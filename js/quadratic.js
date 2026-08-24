(function (global) {
  var EPS = 1e-9;

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function frac(n, d) {
    if (!d) return { n: 0, d: 1 };
    if (d < 0) {
      n = -n;
      d = -d;
    }
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  function fracFromNumber(x) {
    if (Math.abs(x) < EPS) return frac(0, 1);
    for (var d = 1; d <= 64; d++) {
      var n = Math.round(x * d);
      if (Math.abs(x * d - n) < 1e-6) return frac(n, d);
    }
    return null;
  }

  function fmt(p) {
    if (!p) return "";
    if (p.d === 1) return String(p.n);
    return p.n + "/" + p.d;
  }

  function fmtDisp(p) {
    return String(fmt(p)).replace(/-/g, "−");
  }

  function wrapNum(n) {
    if (n < 0) return "(" + n + ")";
    return String(n);
  }

  function parseQuadratic(eq) {
    var s = String(eq || "")
      .replace(/²/g, "^2")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var parts = s.split("=");
    if (parts.length !== 2) throw new Error("חסר סימן =.");
    var left = parts[0];
    var right = parts[1];
    if (right !== "0") throw new Error("הביאו את המשוואה לצורה ax²+bx+c=0.");
    if (!left) throw new Error("המשוואה ריקה.");
    if (left.charAt(0) !== "+" && left.charAt(0) !== "-") left = "+" + left;
    var a = 0;
    var b = 0;
    var c = 0;
    var i = 0;
    while (i < left.length) {
      var sign = left.charAt(i) === "-" ? -1 : 1;
      if (left.charAt(i) === "+" || left.charAt(i) === "-") i += 1;
      var digits = "";
      while (i < left.length && left.charAt(i) >= "0" && left.charAt(i) <= "9") {
        digits += left.charAt(i);
        i += 1;
      }
      var coef = digits === "" ? 1 : parseInt(digits, 10);
      if (left.slice(i, i + 3) === "x^2") {
        a += sign * coef;
        i += 3;
      } else if (left.charAt(i) === "x") {
        b += sign * coef;
        i += 1;
      } else {
        if (digits === "") throw new Error("לא הצלחתי לקרוא את המשוואה.");
        c += sign * coef;
      }
    }
    if (!a) throw new Error("זו לא משוואה ריבועית.");
    return { a: a, b: b, c: c };
  }

  function analyzeStart(start) {
    var abc = parseQuadratic(start);
    return analyze(abc.a, abc.b, abc.c, start);
  }

  function analyze(a, b, c, start) {
    var D = b * b - 4 * a * c;
    var kind = D > 0 ? "two" : D === 0 ? "one" : "none";
    var s = null;
    if (D >= 0) {
      var root = Math.round(Math.sqrt(D));
      if (root * root === D) s = root;
    }
    var roots = [];
    if (kind !== "none" && s != null) {
      var den = 2 * a;
      var plus = frac(-b + s, den);
      var minus = frac(-b - s, den);
      if (kind === "one") roots = [plus];
      else roots = [plus, minus];
    }
    var answer;
    if (kind === "none") answer = "אין פתרון ממשי";
    else if (kind === "one") answer = "x = " + fmt(roots[0]);
    else answer = "x = " + fmt(roots[0]) + ", x = " + fmt(roots[1]);
    return {
      a: a,
      b: b,
      c: c,
      D: D,
      s: s,
      kind: kind,
      roots: roots,
      answer: answer,
      start: start || "",
      steps: solutionSteps(a, b, c, D, s, kind, roots),
    };
  }

  function solutionSteps(a, b, c, D, s, kind, roots) {
    var steps = [
      "a=" + a + ", b=" + b + ", c=" + c,
      "x=(-(" + b + ")±√((" + b + ")^2-4*" + a + "*" + c + "))/(2*" + a + ")",
      "(" + b + ")^2-4*" + a + "*" + c + "=" + D,
    ];
    if (kind === "none") {
      steps.push("אין פתרון ממשי");
      return steps;
    }
    steps.push("√(" + D + ")=" + s);
    if (kind === "one") steps.push("x=" + fmt(roots[0]));
    else {
      steps.push("x=(" + (-b) + "+" + s + ")/(" + 2 * a + ")=" + fmt(roots[0]));
      steps.push("x=(" + (-b) + "-" + s + ")/(" + 2 * a + ")=" + fmt(roots[1]));
    }
    return steps;
  }

  function evalExpr(input) {
    var s = String(input || "")
      .trim()
      .replace(/[−–—]/g, "-")
      .replace(/[×·]/g, "*")
      .replace(/²/g, "^2")
      .replace(/\s+/g, "");
    if (!s) return null;
    if (!/^[0-9+\-*/^().]+$/.test(s)) return null;
    var i = 0;
    function peek() {
      return s.charAt(i);
    }
    function eat() {
      i += 1;
    }
    function parseExpr() {
      var v = parseTerm();
      while (peek() === "+" || peek() === "-") {
        var op = peek();
        eat();
        var r = parseTerm();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    }
    function parseTerm() {
      var v = parsePower();
      while (peek() === "*" || peek() === "/") {
        var op = peek();
        eat();
        var r = parsePower();
        if (op === "*") v *= r;
        else {
          if (Math.abs(r) < EPS) throw new Error("חלוקה באפס.");
          v /= r;
        }
      }
      return v;
    }
    function parsePower() {
      var v = parseUnary();
      if (peek() === "^") {
        eat();
        var r = parseUnary();
        v = Math.pow(v, r);
      }
      return v;
    }
    function parseUnary() {
      if (peek() === "+") {
        eat();
        return parseUnary();
      }
      if (peek() === "-") {
        eat();
        return -parseUnary();
      }
      return parsePrimary();
    }
    function parsePrimary() {
      if (peek() === "(") {
        eat();
        var v = parseExpr();
        if (peek() !== ")") throw new Error("חסרה סוגר ימני.");
        eat();
        return v;
      }
      var start = i;
      if (peek() < "0" || peek() > "9") throw new Error("ביטוי לא תקין.");
      while ((peek() >= "0" && peek() <= "9") || peek() === ".") eat();
      return parseFloat(s.slice(start, i));
    }
    try {
      var value = parseExpr();
      if (i !== s.length) return null;
      if (!isFinite(value)) return null;
      return value;
    } catch (e) {
      return null;
    }
  }

  function isPlainNumber(s) {
    var t = String(s || "")
      .trim()
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    return /^-?\d+$/.test(t) || /^-?\d+\/-?\d+$/.test(t);
  }

  function parsePlain(s) {
    var t = String(s || "")
      .trim()
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var m = t.match(/^(-?\d+)\/(-?\d+)$/);
    if (m) {
      var d = parseInt(m[2], 10);
      if (!d) return null;
      return frac(parseInt(m[1], 10), d);
    }
    if (/^-?\d+$/.test(t)) return frac(parseInt(t, 10), 1);
    return null;
  }

  function parseCoeff(s) {
    var t = String(s || "")
      .trim()
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var wrapped = t.match(/^\((-?\d+)\)$/);
    if (wrapped) t = wrapped[1];
    if (!/^-?\d+$/.test(t)) return null;
    return parseInt(t, 10);
  }

  function hasOuterParens(s) {
    var t = String(s || "")
      .trim()
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    return /^\(-?\d+\)$/.test(t);
  }

  function sameInt(got, want) {
    return got != null && got === want;
  }

  function checkCoeff(want, letter, typed) {
    var got = parseCoeff(typed);
    if (got == null) {
      return { ok: false, message: "כתבו את " + letter + " כמספר שלם, כולל מינוס אם צריך." };
    }
    if (got !== want[letter]) {
      var hint =
        letter === "a"
          ? "a הוא המקדם של x²."
          : letter === "b"
            ? "b הוא המקדם של x."
            : "c הוא המספר החופשי.";
      return { ok: false, message: hint + " שימו לב לסימן שמופיע במשוואה." };
    }
    return { ok: true, message: "נכון." };
  }

  function checkAbc(want, ta, tb, tc) {
    var a = parseCoeff(ta);
    var b = parseCoeff(tb);
    var c = parseCoeff(tc);
    if (a == null || b == null || c == null) {
      return { ok: false, message: "כתבו את a, b ו־c כמספרים שלמים (כולל סימן מינוס אם צריך)." };
    }
    if (!sameInt(a, want.a) || !sameInt(b, want.b) || !sameInt(c, want.c)) {
      var bits = [];
      if (!sameInt(a, want.a)) bits.push("a");
      if (!sameInt(b, want.b)) bits.push("b");
      if (!sameInt(c, want.c)) bits.push("c");
      return {
        ok: false,
        message:
          "בדקו את " +
          bits.join(", ") +
          ". a הוא המקדם של x², b של x, ו־c המספר החופשי — עם הסימן שמופיע במשוואה.",
      };
    }
    return { ok: true, message: "המקדמים נכונים. עכשיו הציבו בנוסחת השורשים." };
  }

  function checkNumericPart(typed, wantNum) {
    var raw = String(typed || "").trim();
    if (!raw) return { empty: true };
    var plainStr = raw
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/^\+/, "");
    var plain = /^-?\d+$/.test(plainStr);
    var v = plain ? parseInt(plainStr, 10) : evalExpr(raw);
    if (v == null || !isFinite(v) || Math.abs(v - wantNum) > EPS) return { ok: false };
    return { ok: true, more: !plain, n: wantNum };
  }

  function checkCompute(want, fields) {
    var neg = checkNumericPart(fields.negB, -want.b);
    var disc = checkNumericPart(fields.disc, want.D);
    var den = checkNumericPart(fields.den, 2 * want.a);
    if (neg.empty && disc.empty && den.empty) {
      return {
        ok: false,
        message: "מלאו את −b, את מה שבשורש ואת 2a. החצים מעבירים בין התאים.",
      };
    }
    if (neg.ok === false) {
      return {
        ok: false,
        message:
          "במונה חשבו את −b. שני מינוסים צמודים הופכים לפלוס. כאן −b = " +
          String(-want.b).replace(/-/g, "−") +
          ".",
      };
    }
    if (disc.ok === false) {
      return {
        ok: false,
        message: "בתוך השורש חשבו b² − 4ac. כאן זה " + discExpr(want.a, want.b, want.c) + ".",
      };
    }
    if (den.ok === false) {
      return {
        ok: false,
        message: "במכנה חשבו 2a. כאן 2·" + wrapNum(want.a) + ".",
      };
    }
    var anyEmpty = !!(neg.empty || disc.empty || den.empty);
    var anyMore = !!(neg.more || disc.more || den.more);
    return {
      ok: true,
      more: anyEmpty || anyMore,
      done: !anyEmpty && !anyMore,
      parts: { neg: neg, disc: disc, den: den },
      message: anyEmpty
        ? "השלימו את שאר התאים בנוסחה."
        : anyMore
          ? "נכון. פשטו כל תא למספר. בתוך השורש אפשר קודם את הביטוי ואז את התוצאה."
          : "הנוסחה מחושבת.",
    };
  }

  function checkPlug(want, slots) {
    var a1 = parseCoeff(slots.a1);
    var a2 = parseCoeff(slots.a2);
    var b1 = parseCoeff(slots.b1);
    var b2 = parseCoeff(slots.b2);
    var c = parseCoeff(slots.c);
    if (a1 == null || a2 == null || b1 == null || b2 == null || c == null) {
      return { ok: false, message: "מלאו את כל הריבועים בנוסחה במקדמים a, b, c." };
    }
    var bad = [];
    if (!sameInt(b1, want.b) || !sameInt(b2, want.b)) bad.push("b");
    if (!sameInt(a1, want.a) || !sameInt(a2, want.a)) bad.push("a");
    if (!sameInt(c, want.c)) bad.push("c");
    if (bad.length) {
      return {
        ok: false,
        message: "הציבו את אותם a, b, c שמצאתם. שימו לב לסימנים, במיוחד במינוס שלפני b.",
      };
    }
    if (want.b < 0 && !hasOuterParens(slots.b2)) {
      return {
        ok: false,
        message:
          "ב־b² חובה סוגריים כש־b שלילי, כדי שזה יהיה (" +
          String(want.b).replace(/-/g, "−") +
          ")² ולא −" +
          String(Math.abs(want.b)) +
          "². בשאר המקומות סוגריים רשות.",
      };
    }
    return { ok: true, message: "עכשיו חשבו בנוסחה את −b, את מה שבשורש, ואת 2a." };
  }

  function checkDisc(want, typed) {
    var t = String(typed || "").trim();
    var v = evalExpr(t);
    if (v == null) {
      return { ok: false, message: "כתבו את b² − 4ac. אפשר 9²−4·2·9, ואחר כך מספר אחד." };
    }
    if (Math.abs(v - want.D) > EPS) {
      return {
        ok: false,
        message: "הביטוי בתוך השורש הוא b² − 4ac. כאן זה " + wrapNum(want.b) + "² − 4·" + wrapNum(want.a) + "·" + wrapNum(want.c) + ".",
      };
    }
    if (!isPlainNumber(t) || String(t).indexOf("/") !== -1) {
      return {
        ok: true,
        more: true,
        message: "עכשיו חשבו את התוצאה בשורה הבאה.",
      };
    }
    return { ok: true, more: false, message: "הדיסקרימיננטה היא " + want.D + "." };
  }

  function checkSqrt(want, typed) {
    var t = String(typed || "")
      .trim()
      .replace(/[−–—]/g, "-");
    var inner = t.match(/^√\s*(.+)$/);
    if (inner) {
      var iv = evalExpr(inner[1]);
      if (iv != null && Math.abs(iv - want.D) < EPS) {
        return { ok: true, more: true, message: "עכשיו רשמו את ערך השורש בשורה הבאה." };
      }
    }
    var plain = parseCoeff(t);
    var v = evalExpr(t);
    var got = plain != null ? plain : v;
    if (got == null) {
      return { ok: false, message: "חשבו את √(" + want.D + ") למספר שלם." };
    }
    if (want.s == null || Math.abs(got - want.s) > EPS) {
      return { ok: false, message: "√(" + want.D + ") צריך לצאת מספר שלם לא־שלילי." };
    }
    if (plain == null) {
      return { ok: true, more: true, message: "נכון. רשמו את ערך השורש כמספר." };
    }
    return { ok: true, more: false, message: "√(" + want.D + ") = " + want.s + "." };
  }

  function kindLabel(kind) {
    if (kind === "none") return "אין פתרון ממשי";
    if (kind === "one") return "פתרון ממשי אחד";
    return "שני פתרונות ממשיים";
  }

  function checkCount(want, picked) {
    if (picked === "skip") {
      return {
        ok: true,
        skip: true,
        message:
          want.kind === "none"
            ? "רשמו שאין פתרון ממשי."
            : want.kind === "one"
              ? "חשבו את הפתרון בנוסחה."
              : "חשבו את שני הפתרונות בנוסחה.",
      };
    }
    if (picked !== want.kind) {
      var why =
        want.D < 0
          ? "הדיסקרימיננטה שלילית, לכן אין שורש ממשי ואין פתרון ממשי."
          : want.D === 0
            ? "הדיסקרימיננטה היא 0, לכן יש פתרון ממשי אחד (כפול)."
            : "הדיסקרימיננטה חיובית, לכן יש שני פתרונות ממשיים שונים.";
      return { ok: false, message: why };
    }
    if (want.kind === "none") {
      return { ok: true, message: "רשמו שאין פתרון ממשי." };
    }
    return {
      ok: true,
      message: want.kind === "one" ? "חשבו את הפתרון בנוסחה." : "חשבו את שני הפתרונות בנוסחה.",
    };
  }

  function checkNone(typed) {
    if (isNoneText(typed)) {
      return { ok: true, message: "אין פתרון ממשי." };
    }
    return { ok: false, message: "רשמו במפורש שאין פתרון ממשי." };
  }

  function numWant(want, sign) {
    return -want.b + sign * (want.s || 0);
  }

  function denWant(want) {
    return 2 * want.a;
  }

  function rootNumExpr(want, sign) {
    var left = -want.b;
    var s = want.s || 0;
    if (want.kind === "one" || !s) return String(left);
    if (sign > 0) return String(left) + "+" + s;
    return String(left) + "-" + s;
  }

  function rootStartExpr(want, sign) {
    var num = rootNumExpr(want, sign);
    var den = denWant(want);
    var needNumParens = /[+-]/.test(String(num).replace(/^-/, "")) || String(num).charAt(0) === "-";
    var numPart = needNumParens ? "(" + num + ")" : String(num);
    var denPart = den < 0 ? "(" + den + ")" : String(den);
    return numPart + "/" + denPart;
  }

  function rootWant(want, sign) {
    if (want.kind === "one" || sign > 0) return want.roots[0];
    return want.roots[1];
  }

  function checkRootCompute(want, sign, fields) {
    var num = checkNumericPart(fields.num, numWant(want, sign));
    var den = checkNumericPart(fields.den, denWant(want));
    if (num.empty && den.empty) {
      return {
        ok: false,
        message: "מלאו את המונה (−b ± √Δ) ואת המכנה 2a.",
      };
    }
    if (num.ok === false) {
      return {
        ok: false,
        message:
          "במונה חשבו −b " +
          (sign > 0 ? "+ √Δ" : "− √Δ") +
          ". כאן זה " +
          String(numWant(want, sign)).replace(/-/g, "−") +
          ".",
      };
    }
    if (den.ok === false) {
      return {
        ok: false,
        message: "במכנה חשבו 2a. כאן 2·" + wrapNum(want.a) + ".",
      };
    }
    var anyEmpty = !!(num.empty || den.empty);
    var anyMore = !!(num.more || den.more);
    return {
      ok: true,
      more: anyEmpty || anyMore,
      done: !anyEmpty && !anyMore,
      parts: { num: num, den: den },
      message: anyEmpty
        ? "השלימו גם את התא השני בשבר."
        : anyMore
          ? "נכון. פשטו את המונה ואת המכנה למספרים."
          : "עכשיו חשבו את השבר.",
    };
  }

  function checkRootFinal(want, sign, typed) {
    var one = parseRootInput(typed);
    var target = rootWant(want, sign);
    if (one.empty || one.bad) {
      return { ok: false, message: "חשבו את המונה חלקי המכנה. אפשר שבר או מספר." };
    }
    if (Math.abs(one.value - target.n / target.d) > 1e-8) {
      return { ok: false, message: "חלקו את המונה במכנה, וצמצמו אם צריך." };
    }
    if (one.expr || !one.reduced) {
      return { ok: true, more: true, message: "נכון. פשטו עוד: אפשר קודם 10/2 ואז 5." };
    }
    return { ok: true, more: false, message: "x = " + fmtDisp(target) + "." };
  }

  function parseRootInput(s) {
    var t = String(s || "").trim();
    if (!t) return { empty: true };
    var plain = parsePlain(t);
    if (plain) {
      var reduced = frac(plain.n, plain.d);
      var reducedOk = plain.n === reduced.n && plain.d === reduced.d;
      return { value: reduced.n / reduced.d, frac: reduced, reduced: reducedOk };
    }
    var dec = t.replace(/[−–—]/g, "-").replace(/\s+/g, "").replace(",", ".");
    if (/^-?\d*\.\d+$/.test(dec) || /^-?\d+\.$/.test(dec)) {
      var dv = parseFloat(dec);
      if (!isFinite(dv)) return { bad: true };
      return { value: dv, decimal: true, reduced: true };
    }
    var v = evalExpr(t);
    if (v == null) return { bad: true };
    var f = fracFromNumber(v);
    return { value: v, frac: f, reduced: false, expr: true };
  }

  function matchesAnyRoot(got, roots) {
    var i;
    for (i = 0; i < roots.length; i++) {
      if (Math.abs(got.value - roots[i].n / roots[i].d) < 1e-8) return i;
    }
    return -1;
  }

  function checkRoots(want, t1, t2) {
    if (want.kind === "one") {
      var one = parseRootInput(t1);
      if (one.empty || one.bad) {
        return { ok: false, message: "רשמו את x כמספר או שבר." };
      }
      if (matchesAnyRoot(one, want.roots) < 0) {
        return { ok: false, message: "x = −b / (2a). הציבו וחשבו." };
      }
      if (one.expr || !one.reduced) {
        return { ok: true, more: true, message: "נכון. צמצמו / חשבו עד שמתקבל מספר או שבר מצומצם." };
      }
      return { ok: true, more: false, message: "הפתרון: x = " + fmtDisp(want.roots[0]) + "." };
    }
    var p = parseRootInput(t1);
    var q = parseRootInput(t2);
    if (p.empty || q.empty || p.bad || q.bad) {
      return { ok: false, message: "רשמו את שני הפתרונות, כל אחד בתיבה." };
    }
    var i1 = matchesAnyRoot(p, want.roots);
    var i2 = matchesAnyRoot(q, want.roots);
    if (i1 < 0 || i2 < 0 || i1 === i2) {
      return {
        ok: false,
        message: "הפתרונות הם (−b + √Δ) / (2a) ו־(−b − √Δ) / (2a). חשבו כל אחד.",
      };
    }
    if (p.expr || q.expr || !p.reduced || !q.reduced) {
      return { ok: true, more: true, message: "נכון. צמצמו כל שבר עד הסוף." };
    }
    return { ok: true, more: false, message: "הפתרונות: x = " + fmtDisp(want.roots[0]) + ", x = " + fmtDisp(want.roots[1]) + "." };
  }

  function isNoneText(s) {
    var t = String(s || "")
      .replace(/\s+/g, "")
      .replace(/־/g, "-");
    return (
      t.indexOf("איןפתרון") !== -1 ||
      t.indexOf("איןפתרונות") !== -1 ||
      t === "0" ||
      t === "אפס"
    );
  }

  function discExpr(a, b, c) {
    return wrapNum(b) + "² − 4·" + wrapNum(a) + "·" + wrapNum(c);
  }

  function isNoRealText(s) {
    var t = String(s || "")
      .replace(/\s+/g, "")
      .replace(/־/g, "");
    return t.indexOf("איןפתרון") !== -1 || t.indexOf("איןממשי") !== -1;
  }

  function hasX2(text) {
    return /x\s*\^\s*2|x²/i.test(String(text || ""));
  }

  function isRootAnswerText(text) {
    var t = String(text || "").replace(/\s+/g, "");
    if (isNoRealText(t)) return true;
    if (hasX2(t)) return false;
    if (/±|\+\//.test(t) || t.indexOf("+-") !== -1) return true;
    if (/^x=/i.test(t)) return true;
    return false;
  }

  function isolatedK(eqText) {
    var kind = global.DoctematicaAlgebra.isolatedRhsKind(eqText, "x2");
    if (kind !== "value" && kind !== "unreduced") return { kind: kind, k: null };
    var eq = global.DoctematicaAlgebra.parseEquation(eqText, { unknown: "x2" });
    var A = eq.left.a - eq.right.a;
    var C = eq.left.b - eq.right.b;
    if (Math.abs(A) < EPS) return { kind: kind, k: null };
    return { kind: kind, k: -C / A };
  }

  function perfectSqrt(k) {
    if (k < -EPS) return null;
    if (Math.abs(k) < EPS) return frac(0, 1);
    var p = fracFromNumber(k);
    if (!p) {
      var s = Math.sqrt(k);
      if (Math.abs(s - Math.round(s)) < 1e-8) return frac(Math.round(s), 1);
      return null;
    }
    var ns = Math.round(Math.sqrt(Math.abs(p.n)));
    var ds = Math.round(Math.sqrt(p.d));
    if (ns * ns === Math.abs(p.n) && ds * ds === p.d) {
      return frac(p.n < 0 ? -ns : ns, ds);
    }
    return null;
  }

  function analyzeSqrtStart(start) {
    var eq = global.DoctematicaAlgebra.parseEquation(start, { unknown: "x2" });
    var A = eq.left.a - eq.right.a;
    var C = eq.left.b - eq.right.b;
    if (Math.abs(A) < EPS) throw new Error("זו לא משוואה ב־x².");
    var k = -C / A;
    var kind = k > EPS ? "two" : k < -EPS ? "none" : "one";
    var root = kind === "two" ? perfectSqrt(k) : kind === "one" ? frac(0, 1) : null;
    var path = global.DoctematicaTeach.fullPath(start, { unknown: "x2" });
    var steps = (path.steps || []).map(function (s) {
      return s.eq;
    });
    var kFrac = fracFromNumber(k) || frac(Math.round(k * 1000), 1000);
    if (kind === "none") {
      steps.push("אין פתרון ממשי");
    } else if (kind === "one") {
      steps.push("x = 0");
    } else {
      steps.push("√(x²) = √(" + fmtDisp(kFrac) + ")");
      if (root) {
        steps.push("x = ±" + fmtDisp(root));
      } else {
        steps.push("x = ±√(" + fmtDisp(kFrac) + ")");
      }
    }
    var answer =
      kind === "none"
        ? "אין פתרון ממשי"
        : kind === "one"
          ? "x = 0"
          : root
            ? "x = " + fmtDisp(root) + ", x = −" + fmtDisp(root)
            : "x = ±√(" + fmtDisp(kFrac) + ")";
    return { k: k, kind: kind, root: root, steps: steps, answer: answer, start: start };
  }

  function unwrapSqrtSide(side) {
    var t = String(side || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/sqrt/gi, "√");
    var wrapped = t.match(/^√\((.+)\)$/);
    if (wrapped) return wrapped[1];
    var bare = t.match(/^√(.+)$/);
    return bare ? bare[1] : null;
  }

  function parseBothSides(text) {
    var raw = String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/sqrt/gi, "√");
    var i = raw.indexOf("=");
    if (i < 0) return null;
    var L = unwrapSqrtSide(raw.slice(0, i));
    var R = unwrapSqrtSide(raw.slice(i + 1));
    if (!L || !R) return null;
    return { left: L, right: R };
  }

  function kFracOf(pack) {
    return fracFromNumber(pack.k) || frac(Math.round(pack.k * 1000), 1000);
  }

  function checkSqrtBothSides(prev, typed) {
    var sides = parseBothSides(typed);
    if (!sides) return null;
    var A = global.DoctematicaAlgebra;
    try {
      var before = A.parseEquation(prev, { unknown: "x2" });
      var inner = A.parseEquation(sides.left + "=" + sides.right, { unknown: "x2" });
      if (!A.equivalent(before, inner)) {
        return {
          ok: false,
          message: "בתוך השורשים צריכים להיות האגפים של המשוואה הקודמת.",
        };
      }
    } catch (err) {
      return { ok: false, message: err.message };
    }
    var iso = isolatedK(prev);
    if (iso.k != null && iso.k < -EPS) {
      return {
        ok: true,
        message: "הוצאתם שורש משני האגפים, אבל משלילי אין שורש ממשי. רשמו שאין פתרון ממשי.",
      };
    }
    return {
      ok: true,
      message: "הוצאתם שורש משני האגפים. עכשיו חשבו את השורש והשאירו x בצד אחד.",
    };
  }

  function nextSqrtStep(eqText, pack) {
    var r = pack.root ? fmtDisp(pack.root) : null;
    var kShow = fmtDisp(kFracOf(pack));
    if (parseBothSides(eqText) || (isRootAnswerText(eqText) && /√|sqrt/i.test(eqText))) {
      if (pack.kind === "none") {
        return {
          eq: "אין פתרון ממשי",
          hint: "אחרי הבידוד x² יצא שלילי. לשלילי אין שורש ממשי, ולכן אין פתרון ממשי.",
          explain: "מוציאים שורש רק ממספר אי־שלילי.",
          solved: true,
        };
      }
      if (pack.kind === "one") {
        return {
          eq: "x = 0",
          hint: "√0 = 0, ולכן פתרון ממשי אחד: x = 0.",
          explain: "כש־x² = 0 יש פתרון יחיד.",
          solved: true,
        };
      }
      return {
        eq: r ? "x = ±" + r : "x = ±√(" + kShow + ")",
        hint: r
          ? "חשבו את השורש. אם יוצא מספר שלם או עשרוני פשוט, רשמו x = ±" + r + "."
          : "השאירו x = ±√(" + kShow + ").",
        explain: "אחרי שורש משני האגפים מחשבים, או משאירים ±√ כשזה לא מספר פשוט.",
        solved: true,
      };
    }
    var iso = isolatedK(eqText);
    if (iso.k == null && iso.kind !== "value" && iso.kind !== "unreduced") return null;
    if (pack.kind === "none") {
      return {
        eq: "אין פתרון ממשי",
        hint: "אחרי הבידוד x² יצא שלילי. לשלילי אין שורש ממשי, ולכן אין פתרון ממשי.",
        explain: "מוציאים שורש רק ממספר אי־שלילי.",
        solved: true,
      };
    }
    if (pack.kind === "one") {
      return {
        eq: "x = 0",
        hint: "√0 = 0, ולכן פתרון ממשי אחד: x = 0.",
        explain: "כש־x² = 0 יש פתרון יחיד.",
        solved: true,
      };
    }
    return {
      eq: "√(x²) = √(" + kShow + ")",
      hint: "הוציאו שורש משני האגפים. אפשר לכתוב √(x²) = √(" + kShow + ").",
      explain: "מוציאים שורש משני האגפים, ואז מחשבים אם השורש מספר פשוט.",
      solved: false,
    };
  }

  function evalRootPiece(body) {
    var t = String(body || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/sqrt/gi, "√");
    var hadSqrt = false;
    t = t.replace(/√\(([^()]*)\)/g, function (_, inner) {
      hadSqrt = true;
      var n = evalExpr(inner);
      if (n == null || n < 0) return "NaN";
      return String(Math.sqrt(n));
    });
    t = t.replace(/√(\d+(?:\.\d+)?)/g, function (_, inner) {
      hadSqrt = true;
      return String(Math.sqrt(parseFloat(inner, 10)));
    });
    var v = evalExpr(t);
    return { v: v, hadSqrt: hadSqrt };
  }

  function parseSqrtTyped(text) {
    var s = String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/sqrt/gi, "√");
    if (isNoRealText(s)) return { none: true };
    s = s.replace(/^x=/i, "");
    s = s.replace(/,x=/gi, ",").replace(/אוx=/g, ",").replace(/ו-?x=/g, ",");
    s = s.replace(/או/g, ",").replace(/and/gi, ",");
    if (s.indexOf("±") !== -1 || s.indexOf("+-") !== -1) {
      var body = s.replace(/±/g, "").replace("+-", "");
      var p = evalRootPiece(body);
      if (p.v == null || !isFinite(p.v)) return { ok: false };
      return { pm: true, abs: Math.abs(p.v), hadSqrt: p.hadSqrt };
    }
    var parts = s.split(",").filter(Boolean);
    var vals = [];
    var hadSqrt = false;
    var i;
    for (i = 0; i < parts.length; i++) {
      var q = evalRootPiece(parts[i]);
      if (q.v == null || !isFinite(q.v)) return { ok: false };
      if (q.hadSqrt) hadSqrt = true;
      vals.push(q.v);
    }
    if (!vals.length) return { ok: false };
    return { vals: vals, hadSqrt: hadSqrt };
  }

  function checkSqrtFinish(typed, pack, progress) {
    progress = progress || { pos: false, neg: false };
    var parsed = parseSqrtTyped(typed);
    if (parsed.none) {
      if (pack.kind === "none") {
        return { ok: true, solved: true, message: "אין פתרון ממשי, כי אחרי הבידוד x² שלילי." };
      }
      return {
        ok: false,
        message:
          pack.kind === "one"
            ? "יש פתרון אחד: x = 0."
            : "יש שני פתרונות ממשיים. הוציאו שורש עם ±.",
      };
    }
    if (parsed.ok === false) {
      return { ok: false, message: "רשמו את הפתרון, למשל x = ±2 או x = 2, x = −2, או שאין פתרון ממשי." };
    }
    if (pack.kind === "none") {
      return { ok: false, message: "x² יצא שלילי, לכן אין שורש ממשי. רשמו שאין פתרון ממשי." };
    }
    if (pack.kind === "one") {
      var zero =
        (parsed.pm && Math.abs(parsed.abs) < EPS) ||
        (parsed.vals && parsed.vals.length && parsed.vals.every(function (v) { return Math.abs(v) < EPS; }));
      if (zero) return { ok: true, solved: true, message: "הפתרון היחיד הוא x = 0." };
      return { ok: false, message: "כאן x² = 0, לכן רק x = 0." };
    }
    var nice = !!(pack.root);
    var want = nice ? pack.root.n / pack.root.d : null;
    function nearWant(v) {
      if (!nice) return false;
      return Math.abs(Math.abs(v) - Math.abs(want)) < 1e-6;
    }
    var rShow = nice ? fmtDisp(pack.root) : "√(" + fmtDisp(kFracOf(pack)) + ")";
    if (parsed.hadSqrt && nice) {
      var sqrtMatches = parsed.pm
        ? nearWant(parsed.abs)
        : parsed.vals.every(function (v) {
            return nearWant(v);
          });
      if (!sqrtMatches) {
        return { ok: false, message: "בדקו איזה מספר נמצא מתחת לשורש. זה צריך להיות האגף אחרי הבידוד." };
      }
      return {
        ok: true,
        more: true,
        solved: false,
        message: parsed.pm
          ? "עכשיו חשבו את השורש ורשמו x = ± מספר."
          : "עכשיו חשבו את השורש למספר, ואז רשמו את שני הסימנים.",
      };
    }
    if (parsed.pm) {
      if (nice && !nearWant(parsed.abs)) {
        return { ok: false, message: "הערך לא מדויק. אחרי השורש צריך להתקבל ±" + rShow + "." };
      }
      if (!nice && !parsed.hadSqrt) {
        return { ok: false, message: "כאן השורש לא מספר פשוט. רשמו x = ±" + rShow + "." };
      }
      return {
        ok: true,
        solved: true,
        message: nice
          ? "שני הפתרונות: x = " + rShow + ", x = −" + rShow + "."
          : "שני הפתרונות: x = ±" + rShow + ".",
      };
    }
    var nextProg = { pos: progress.pos, neg: progress.neg };
    var j;
    for (j = 0; j < parsed.vals.length; j++) {
      if (nice && !nearWant(parsed.vals[j])) {
        return { ok: false, message: "הערך לא מדויק. הפתרונות הם x = ±" + rShow + "." };
      }
      if (!nice && !parsed.hadSqrt) {
        return { ok: false, message: "כאן השורש לא מספר פשוט. רשמו x = ±" + rShow + "." };
      }
      if (parsed.vals[j] > EPS) nextProg.pos = true;
      else if (parsed.vals[j] < -EPS) nextProg.neg = true;
    }
    if (!nice && parsed.hadSqrt && nextProg.pos && nextProg.neg) {
      return {
        ok: true,
        solved: true,
        progress: nextProg,
        message: "שני הפתרונות: x = ±" + rShow + ".",
      };
    }
    if (nextProg.pos && nextProg.neg) {
      return {
        ok: true,
        solved: true,
        progress: nextProg,
        message: "שני הפתרונות: x = " + rShow + ", x = −" + rShow + ".",
      };
    }
    return {
      ok: true,
      more: true,
      solved: false,
      progress: nextProg,
      message: nextProg.pos
        ? "יש גם פתרון שלילי. רשמו גם x = −" + rShow + ", או x = ±" + rShow + "."
        : "יש גם פתרון חיובי. רשמו גם x = " + rShow + ", או x = ±" + rShow + ".",
    };
  }

  function nearNum(a, b) {
    return Math.abs(a - b) < 1e-6;
  }

  function isIntNum(n) {
    return Math.abs(n - Math.round(n)) < 1e-8;
  }

  function normFactorText(s) {
    return String(s || "")
      .replace(/²/g, "^2")
      .replace(/[−–—]/g, "-")
      .replace(/[×·]/g, "*")
      .replace(/\s+/g, "");
  }

  function unwrapParens(s) {
    var t = String(s || "").trim();
    while (t.charAt(0) === "(" && t.charAt(t.length - 1) === ")") {
      var inner = t.slice(1, -1);
      var d = 0;
      var ok = true;
      var i;
      for (i = 0; i < inner.length; i++) {
        if (inner.charAt(i) === "(") d += 1;
        if (inner.charAt(i) === ")") d -= 1;
        if (d < 0) ok = false;
      }
      if (!ok || d !== 0) break;
      t = inner;
    }
    return t;
  }

  function readPolyNum(s, i) {
    if (s.charAt(i) === "(") {
      var j = s.indexOf(")", i);
      if (j < 0) return null;
      var inner = s.slice(i + 1, j);
      var bits = inner.split("/");
      var v =
        bits.length === 2 ? parseFloat(bits[0], 10) / parseFloat(bits[1], 10) : parseFloat(inner, 10);
      if (!isFinite(v)) return null;
      return { v: v, i: j + 1, had: true };
    }
    var m = s.slice(i).match(/^(\d+(?:\.\d+)?(?:\/\d+)?)/);
    if (!m) return { v: 1, i: i, had: false };
    var tok = m[1];
    var val;
    if (tok.indexOf("/") !== -1) {
      var q = tok.split("/");
      val = parseFloat(q[0], 10) / parseFloat(q[1], 10);
    } else val = parseFloat(tok, 10);
    return { v: val, i: i + tok.length, had: true };
  }

  function polySide(side) {
    var t = normFactorText(side);
    if (!t || t === "0") return { a: 0, b: 0, c: 0 };
    if (t.charAt(0) !== "+" && t.charAt(0) !== "-") t = "+" + t;
    var a = 0;
    var b = 0;
    var c = 0;
    var i = 0;
    while (i < t.length) {
      var sign = t.charAt(i) === "-" ? -1 : 1;
      if (t.charAt(i) === "+" || t.charAt(i) === "-") i += 1;
      var num = readPolyNum(t, i);
      if (!num) return null;
      i = num.i;
      if (t.slice(i, i + 3) === "x^2") {
        a += sign * (num.had ? num.v : 1);
        i += 3;
      } else if (t.charAt(i) === "x" || t.charAt(i) === "X") {
        b += sign * (num.had ? num.v : 1);
        i += 1;
      } else {
        if (!num.had) return null;
        c += sign * num.v;
      }
    }
    return { a: a, b: b, c: c };
  }

  function parseAxBxZero(text) {
    var s = normFactorText(text);
    var parts = s.split("=");
    if (parts.length !== 2) return null;
    var L = polySide(parts[0]);
    var R = polySide(parts[1]);
    if (!L || !R) return null;
    var a = L.a - R.a;
    var b = L.b - R.b;
    var c = L.c - R.c;
    if (Math.abs(a) < EPS) return null;
    if (Math.abs(c) > 1e-6) return null;
    return { a: a, b: b, c: c };
  }

  function fmtLinNum(n) {
    var p = fracFromNumber(n);
    if (p) return fmt(p);
    if (isIntNum(n)) return String(Math.round(n));
    return String(n);
  }

  function formatLinear(a, b) {
    var xs;
    if (nearNum(a, 1)) xs = "x";
    else if (nearNum(a, -1)) xs = "-x";
    else xs = fmtLinNum(a) + "x";
    if (Math.abs(b) < EPS) return xs;
    if (b > 0) return xs + "+" + fmtLinNum(b);
    return xs + "-" + fmtLinNum(-b);
  }

  function preferredFactorEq(a, b) {
    var g = 1;
    if (isIntNum(a) && isIntNum(b)) {
      g = gcd(Math.round(a), Math.round(b));
      if (a < 0) g = -g;
    }
    var a2 = a / g;
    var b2 = b / g;
    var outer = nearNum(g, 1) ? "x" : nearNum(g, -1) ? "-x" : fmtLinNum(g) + "x";
    return outer + "(" + formatLinear(a2, b2) + ")=0";
  }

  function parseLinearFactor(text) {
    var raw = unwrapParens(normFactorText(text));
    if (!raw) return null;
    try {
      var eq = global.DoctematicaAlgebra.parseEquation(raw + "=0");
      var a = eq.left.a - eq.right.a;
      var b = eq.left.b - eq.right.b;
      if (Math.abs(a) < EPS) return null;
      return { a: a, b: b, src: raw };
    } catch (err) {
      return null;
    }
  }

  function splitProductLeft(left) {
    var s = unwrapParens(normFactorText(left));
    var depth = 0;
    var i;
    for (i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      else if (depth === 0 && ch === "*" && i > 0) {
        return [s.slice(0, i), s.slice(i + 1)];
      }
    }
    depth = 0;
    for (i = 0; i < s.length - 1; i++) {
      var c = s.charAt(i);
      var n = s.charAt(i + 1);
      if (c === "(") depth += 1;
      else if (c === ")") {
        depth -= 1;
        if (depth === 0 && (n === "(" || n === "x" || n === "X" || (n >= "0" && n <= "9"))) {
          return [s.slice(0, i + 1), s.slice(i + 1)];
        }
      } else if (depth === 0 && (c === "x" || c === "X") && n === "(") {
        return [s.slice(0, i + 1), s.slice(i + 1)];
      }
    }
    return null;
  }

  function parseProductEq(text) {
    var s = normFactorText(text);
    var parts = s.split("=");
    if (parts.length !== 2) return null;
    var left = parts[0];
    var right = parts[1];
    if (right === "0" || right === "+0" || right === "-0") {
      /* keep left */
    } else if (left === "0" || left === "+0" || left === "-0") {
      left = right;
    } else return null;
    var bits = splitProductLeft(left);
    if (!bits) return null;
    var f1 = parseLinearFactor(bits[0]);
    var f2 = parseLinearFactor(bits[1]);
    if (!f1 || !f2) return null;
    return {
      f1: f1,
      f2: f2,
      e1: unwrapParens(bits[0]) + "=0",
      e2: unwrapParens(bits[1]) + "=0",
    };
  }

  function isProductEq(text) {
    return !!parseProductEq(text);
  }

  function productMatches(pack, prod) {
    var A = prod.f1.a * prod.f2.a;
    var B = prod.f1.a * prod.f2.b + prod.f1.b * prod.f2.a;
    var C = prod.f1.b * prod.f2.b;
    if (Math.abs(C) > 1e-6) return false;
    if (Math.abs(A) < EPS) return false;
    return Math.abs(A * pack.b - B * pack.a) < 1e-5;
  }

  function linearSolved(eq) {
    try {
      return global.DoctematicaAlgebra.isSolved(global.DoctematicaAlgebra.parseEquation(eq));
    } catch (err) {
      return false;
    }
  }

  function analyzeFactorStart(start) {
    var abc = parseAxBxZero(start);
    if (!abc) throw new Error("זו לא משוואה מהצורה ax²+bx=0.");
    var a = abc.a;
    var b = abc.b;
    var other = a === 0 ? 0 : -b / a;
    var otherF = fracFromNumber(other) || frac(Math.round(other * 1000), 1000);
    var factored = preferredFactorEq(a, b);
    var prod = parseProductEq(factored);
    var steps = [start, factored];
    if (prod) {
      steps.push(prod.e1);
      steps.push(prod.e2);
    }
    var r0 = "x = 0";
    var r1 = "x = " + fmtDisp(otherF);
    steps.push(r0);
    steps.push(r1);
    return {
      a: a,
      b: b,
      other: other,
      otherF: otherF,
      factored: factored,
      steps: steps,
      answer: r0 + ", " + r1,
      start: start,
    };
  }

  function parseRootVals(text) {
    var parsed = parseSqrtTyped(text);
    if (!parsed || parsed.ok === false || parsed.none) return null;
    if (parsed.pm) return [parsed.abs, -parsed.abs];
    return parsed.vals;
  }

  function checkFactorRoots(typed, pack, progress) {
    progress = progress || { z: false, o: false };
    var vals = parseRootVals(typed);
    if (!vals || !vals.length) return null;
    var next = { z: progress.z, o: progress.o };
    var i;
    for (i = 0; i < vals.length; i++) {
      if (nearNum(vals[i], 0)) next.z = true;
      else if (nearNum(vals[i], pack.other)) next.o = true;
      else return { ok: false, message: "זה לא אחד הפתרונות של המשוואה הזו." };
    }
    if (next.z && next.o) {
      return {
        ok: true,
        solved: true,
        progress: next,
        message: "שני הפתרונות: x = 0, x = " + fmtDisp(pack.otherF) + ".",
      };
    }
    return {
      ok: true,
      more: true,
      solved: false,
      progress: next,
      message: next.z
        ? "נכון, x = 0. יש עוד משוואה מהסוגריים — פתרו אותה, או לחצו «חילוק למשוואות»."
        : "נכון. יש גם את הפתרון x = 0, כי הוצאתם x כגורם משותף.",
    };
  }

  function nextFactorStep(eqText, pack, st) {
    st = st || {};
    if (st.split) {
      var k;
      for (k = 0; k < 2; k++) {
        if (st.solved && st.solved[k]) continue;
        var cur = (st.eqs && st.eqs[k]) || "";
        if (linearSolved(cur)) continue;
        var act = global.DoctematicaTeach.nextAction(cur);
        if (act && act.eq) {
          return { eq: act.eq, hint: act.hint, explain: act.explain, which: k };
        }
        var lin = parseLinearFactor(String(cur).replace(/=.*$/, ""));
        var val = "0";
        if (lin && Math.abs(lin.b) >= EPS) val = fmtLinNum(-lin.b / lin.a);
        return { eq: "x = " + val, hint: "בודדו את x.", which: k };
      }
      return {
        eq: "x = 0, x = " + fmt(pack.otherF),
        hint: "רשמו את שני הפתרונות.",
        solved: true,
      };
    }
    if (isProductEq(eqText) && productMatches(pack, parseProductEq(eqText))) {
      return {
        split: true,
        hint: "אחרי הוצאת הגורם המשותף מחלקים לשתי משוואות: כל גורם שווה לאפס.",
        explain: "מכפלה שווה אפס רק אם אחד הגורמים אפס.",
      };
    }
    return {
      eq: pack.factored,
      hint: "הוציאו גורם משותף x (ואפשר גם מספר). למשל x²−5x=0 הופך ל־x(x−5)=0.",
      explain: "מוציאים x מחוץ לסוגריים.",
    };
  }

  function checkFactorTyped(prev, typed, pack, st) {
    st = st || { split: false, eqs: [], solved: [false, false], progress: { z: false, o: false } };
    var t = String(typed || "").trim();
    if (!t) return { ok: false, message: "כתבו את הצעד הבא." };

    var prodTyped = parseProductEq(t);
    if (prodTyped && productMatches(pack, prodTyped)) {
      var e1 = prodTyped.e1;
      var e2 = prodTyped.e2;
      return {
        ok: true,
        factored: true,
        eqs: [e1, e2],
        solved: [linearSolved(e1), linearSolved(e2)],
        solvedFlags: [linearSolved(e1), linearSolved(e2)],
        message: "נכון. הוצאתם גורם משותף. עכשיו לחצו «חילוק למשוואות», או פתרו כל גורם בנפרד.",
      };
    }
    if (prodTyped) {
      return { ok: false, message: "המכפלה לא מתאימה למשוואה המקורית. בדקו מה מוציאים מחוץ לסוגריים ומה נשאר בפנים." };
    }

    var roots = checkFactorRoots(t, pack, st.progress);

    var tryEqs = [];
    if (st.split && st.eqs && st.eqs.length) tryEqs = st.eqs;
    else if (isProductEq(prev) && productMatches(pack, parseProductEq(prev))) {
      var p0 = parseProductEq(prev);
      tryEqs = [p0.e1, p0.e2];
    }

    if (tryEqs.length) {
      var j;
      for (j = 0; j < tryEqs.length; j++) {
        if (st.solved && st.solved[j]) continue;
        var result;
        try {
          result = global.DoctematicaAlgebra.checkStep(tryEqs[j], t);
        } catch (err) {
          continue;
        }
        if (!result.ok) continue;
        var eqs = tryEqs.slice();
        eqs[j] = t;
        var solvedFlags = (st.solved || [false, false]).slice();
        if (result.solved || linearSolved(t)) solvedFlags[j] = true;
        var both = solvedFlags[0] && solvedFlags[1];
        return {
          ok: true,
          split: true,
          eqs: eqs,
          solvedFlags: solvedFlags,
          which: j,
          solvedOne: result.solved,
          solvedAll: both,
          message: both
            ? "שני הפתרונות: x = 0, x = " + fmtDisp(pack.otherF) + "."
            : result.solved
              ? "נכון. זו משוואה אחת. פתרו גם את המשוואה השנייה."
              : "צעד חוקי במשוואה " + (j + 1) + ". " + result.message,
        };
      }
      if (roots && (st.split || isProductEq(prev) || st.progress.z || st.progress.o)) {
        return roots;
      }
      return {
        ok: false,
        message: "פתרו אחת משתי המשוואות שקיבלתם אחרי הוצאת הגורם, או רשמו x = מספר.",
      };
    }

    if (roots && (st.split || isProductEq(prev) || st.progress.z || st.progress.o)) {
      return roots;
    }
    return {
      ok: false,
      message: "הוציאו גורם משותף x (ואפשר גם מספר), למשל x(x−5)=0.",
    };
  }

  global.DoctematicaQuadratic = {
    parse: parseQuadratic,
    analyze: analyze,
    analyzeStart: analyzeStart,
    analyzeSqrtStart: analyzeSqrtStart,
    fmt: fmt,
    fmtDisp: fmtDisp,
    wrapNum: wrapNum,
    evalExpr: evalExpr,
    parseCoeff: parseCoeff,
    checkCoeff: checkCoeff,
    checkAbc: checkAbc,
    checkCompute: checkCompute,
    checkPlug: checkPlug,
    checkDisc: checkDisc,
    checkSqrt: checkSqrt,
    checkCount: checkCount,
    checkNone: checkNone,
    checkRootCompute: checkRootCompute,
    checkRootFinal: checkRootFinal,
    numWant: numWant,
    denWant: denWant,
    rootNumExpr: rootNumExpr,
    rootWant: rootWant,
    checkRoots: checkRoots,
    kindLabel: kindLabel,
    isNoneText: isNoneText,
    discExpr: discExpr,
    hasX2: hasX2,
    isRootAnswerText: isRootAnswerText,
    isolatedK: isolatedK,
    nextSqrtStep: nextSqrtStep,
    checkSqrtBothSides: checkSqrtBothSides,
    checkSqrtFinish: checkSqrtFinish,
    analyzeFactorStart: analyzeFactorStart,
    parseProductEq: parseProductEq,
    isProductEq: isProductEq,
    preferredFactorEq: preferredFactorEq,
    nextFactorStep: nextFactorStep,
    checkFactorTyped: checkFactorTyped,
    linearSolved: linearSolved,
    productMatches: productMatches,
  };
})(window);
