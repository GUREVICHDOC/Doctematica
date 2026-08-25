(function (global) {
  var EPS = 1e-9;

  function near0(n) {
    return Math.abs(n) < EPS;
  }

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
    if (parts.length !== 2) throw new Error("חסר סימן שווה");
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

  function hasVisibleLinearX(text) {
    var p = parseABC(text);
    if (p && !near0(p.b)) return true;
    var s = normFactorText(text);
    return /x(?!\^2)/i.test(s);
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

  function hasDepth0PlusMinus(side) {
    var s = unwrapParens(normFactorText(side));
    if (!s) return false;
    var depth = 0;
    var i = 0;
    if (s.charAt(0) === "+" || s.charAt(0) === "-") i = 1;
    for (; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      else if (depth === 0 && (ch === "+" || ch === "-")) return true;
    }
    return false;
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
    if (hasDepth0PlusMinus(left)) return null;
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

  function matchBranchStep(st, typed) {
    var tryEqs = st && st.eqs;
    if (!tryEqs || !tryEqs.length) return null;
    var t = String(typed || "").trim();
    var lastFail = null;
    var j;
    for (j = 0; j < tryEqs.length; j++) {
      if (st.solved && st.solved[j]) continue;
      var result;
      try {
        result = global.DoctematicaAlgebra.checkStep(tryEqs[j], t);
      } catch (err) {
        continue;
      }
      if (!result.ok) {
        if (!lastFail) lastFail = result;
        continue;
      }
      var eqs = tryEqs.slice();
      eqs[j] = t;
      var solvedFlags = (st.solved || [false, false]).slice();
      if (result.solved || linearSolved(t)) solvedFlags[j] = true;
      return {
        ok: true,
        which: j,
        result: result,
        eqs: eqs,
        solvedFlags: solvedFlags,
        solvedAll: !!(solvedFlags[0] && solvedFlags[1]),
      };
    }
    if (lastFail) return { ok: false, result: lastFail };
    return null;
  }

  function checkFactorTyped(prev, typed, pack, st) {
    st = st || { split: false, eqs: [], solved: [false, false], progress: { z: false, o: false } };
    var t = String(typed || "").trim();
    if (!t) return { ok: false, message: "כתבו את הצעד הבא." };
    if (global.DoctematicaAlgebra && global.DoctematicaAlgebra.missingEqualsSign(t)) {
      return { ok: false, message: "חסר סימן שווה" };
    }

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
      var hit = matchBranchStep({ eqs: tryEqs, solved: st.solved }, t);
      if (hit && hit.ok) {
        return {
          ok: true,
          split: true,
          eqs: hit.eqs,
          solvedFlags: hit.solvedFlags,
          which: hit.which,
          solvedOne: hit.result.solved,
          solvedAll: hit.solvedAll,
          message: hit.solvedAll
            ? "שני הפתרונות: x = 0, x = " + fmtDisp(pack.otherF) + "."
            : hit.result.solved
              ? hit.result.message + " יש עוד משוואה מהפיצול — פתרו גם אותה."
              : hit.result.message,
        };
      }
      if (roots && (st.split || isProductEq(prev) || st.progress.z || st.progress.o)) {
        return roots;
      }
      if (hit && !hit.ok) {
        return { ok: false, message: hit.result.message };
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

  function polyAdd(p, q) {
    return { a: p.a + q.a, b: p.b + q.b, c: p.c + q.c };
  }

  function polySub(p, q) {
    return { a: p.a - q.a, b: p.b - q.b, c: p.c - q.c };
  }

  function polyMul(p, q) {
    if ((!near0(p.a) && !near0(q.a)) || (!near0(p.a) && !near0(q.b)) || (!near0(q.a) && !near0(p.b))) {
      return null;
    }
    return {
      a: p.a * q.c + p.b * q.b + p.c * q.a,
      b: p.b * q.c + p.c * q.b,
      c: p.c * q.c,
    };
  }

  function polyNeg(p) {
    return { a: -p.a, b: -p.b, c: -p.c };
  }

  function insertQuadImplicit(tokens) {
    var out = [];
    function endsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === "x2" || tok.t === ")");
    }
    function startsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === "x2" || tok.t === "(");
    }
    var i;
    for (i = 0; i < tokens.length; i++) {
      var prev = out[out.length - 1];
      var cur = tokens[i];
      if (endsValue(prev) && startsValue(cur)) out.push({ t: "*" });
      out.push(cur);
    }
    return out;
  }

  function tokenizeQuad(side) {
    var s = normFactorText(side);
    if (!s) return [];
    var tokens = [];
    var i = 0;
    while (i < s.length) {
      var c = s.charAt(i);
      if ("()+*/-".indexOf(c) !== -1) {
        tokens.push({ t: c });
        i += 1;
        continue;
      }
      if (c === "^") {
        if (s.slice(i, i + 2) === "^2") {
          tokens.push({ t: "pow2" });
          i += 2;
          continue;
        }
        return null;
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
        var m = s.slice(i).match(/^\d+(?:\.\d+)?/);
        if (!m) return null;
        tokens.push({ t: "num", v: parseFloat(m[0], 10) });
        i += m[0].length;
        continue;
      }
      return null;
    }
    return insertQuadImplicit(tokens);
  }

  function parseQuadTokens(tokens) {
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
      if (!left) return null;
      while (peek() && (peek().t === "+" || peek().t === "-")) {
        var op = eat().t;
        var right = parseTerm();
        if (!right) return null;
        left = op === "+" ? polyAdd(left, right) : polySub(left, right);
      }
      return left;
    }
    function parseTerm() {
      var left = parseUnary();
      if (!left) return null;
      while (peek() && (peek().t === "*" || peek().t === "/")) {
        var op = eat().t;
        var right = parseUnary();
        if (!right) return null;
        if (op === "/") {
          if (!near0(right.a) || !near0(right.b) || near0(right.c)) return null;
          left = { a: left.a / right.c, b: left.b / right.c, c: left.c / right.c };
        } else {
          left = polyMul(left, right);
          if (!left) return null;
        }
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
        var v = parseUnary();
        return v ? polyNeg(v) : null;
      }
      var primary = parsePrimary();
      if (!primary) return null;
      if (peek() && peek().t === "pow2") {
        eat();
        primary = polyMul(primary, primary);
      }
      return primary;
    }
    function parsePrimary() {
      var tok = peek();
      if (!tok) return null;
      if (tok.t === "num") {
        eat();
        return { a: 0, b: 0, c: tok.v };
      }
      if (tok.t === "x2") {
        eat();
        return { a: 1, b: 0, c: 0 };
      }
      if (tok.t === "x") {
        eat();
        return { a: 0, b: 1, c: 0 };
      }
      if (tok.t === "(") {
        eat();
        var inner = parseExpr();
        if (!inner || !eat(")")) return null;
        return inner;
      }
      return null;
    }
    var value = parseExpr();
    if (!value || i !== tokens.length) return null;
    return value;
  }

  function parseQuadSide(side) {
    var t = normFactorText(side);
    if (!t || t === "0") return { a: 0, b: 0, c: 0 };
    var plain = polySide(t);
    if (plain && t.indexOf("(") < 0) return plain;
    var tokens = tokenizeQuad(t);
    if (!tokens) return null;
    return parseQuadTokens(tokens);
  }

  function hasExpandableParens(text) {
    var s = normFactorText(text);
    return /\([^()]*[+\-][^()]*\)/.test(s);
  }

  function rewriteTermXBeforeParens(term) {
    var t = normFactorText(term);
    if (/x\^2$/i.test(t)) return term;
    var numAfter = t.match(/^([+-]?)(\([^()]+\))(\d+)$/);
    if (numAfter) return (numAfter[1] || "") + numAfter[3] + numAfter[2];
    var m = t.match(/^([+-]?)(\d*)(\([^()]+\))(\d*)x$/i);
    if (!m) return term;
    var sign = m[1] || "";
    var leftK = m[2] || "";
    var parens = m[3];
    var rightK = m[4] || "";
    var k = leftK + rightK;
    if (!k || k === "1") return sign + "x" + parens;
    return sign + k + "x" + parens;
  }

  function joinSignedTermParts(parts) {
    var s = parts[0] || "0";
    var i;
    for (i = 1; i < parts.length; i++) {
      var piece = parts[i];
      if (!piece || piece === "0") continue;
      if (piece.charAt(0) === "-") s += piece;
      else s += "+" + piece;
    }
    return s;
  }

  function rewriteSideXBeforeParens(side) {
    var terms = splitSignedTerms(side);
    if (!terms.length) return side;
    var parts = terms.map(function (term) {
      var next = rewriteTermXBeforeParens(term);
      var t = normFactorText(next);
      return t.charAt(0) === "+" ? t.slice(1) : t;
    });
    return joinSignedTermParts(parts);
  }

  function moveXBeforeParensEq(text) {
    var s = normFactorText(text);
    var parts = s.split("=");
    if (parts.length !== 2) return text;
    return rewriteSideXBeforeParens(parts[0]) + "=" + rewriteSideXBeforeParens(parts[1]);
  }

  function hasXAfterParens(text) {
    var s = normFactorText(text);
    if (!s) return false;
    return normFactorText(moveXBeforeParensEq(s)) !== s;
  }

  function splitSignedTerms(side) {
    var t = normFactorText(side);
    if (!t || t === "0") return [];
    var out = [];
    var depth = 0;
    var buf = "";
    var i;
    for (i = 0; i < t.length; i++) {
      var ch = t.charAt(i);
      if (ch === "(") depth += 1;
      if (ch === ")") depth -= 1;
      if (depth === 0 && (ch === "+" || ch === "-") && buf) {
        out.push(buf);
        buf = ch === "-" ? "-" : "";
        continue;
      }
      buf += ch;
    }
    if (buf) out.push(buf);
    return out;
  }

  function hasFoilParens(text) {
    return /\([^()]+\)\([^()]+\)/.test(normFactorText(text));
  }

  function hasSquaredParens(text) {
    return /\([^()]+\)\^2/.test(normFactorText(text));
  }

  function mulPolyAtoms(u, v) {
    if (!u || !v) return null;
    var c = u.coef * v.coef;
    if (u.kind === "n") return { kind: v.kind, coef: c };
    if (v.kind === "n") return { kind: u.kind, coef: c };
    if (u.kind === "x" && v.kind === "x") return { kind: "x2", coef: c };
    return null;
  }

  function expandFoilTerm(term) {
    var t = normFactorText(term);
    var m = t.match(/^([+-]?)(\d*)(\([^()]+\))(\([^()]+\))$/);
    if (!m) return null;
    var left = splitPolyTerms(unwrapParens(m[3]));
    var right = splitPolyTerms(unwrapParens(m[4]));
    if (!left || left.length !== 2 || !right || right.length !== 2) return null;
    var out = [];
    var i;
    var j;
    for (i = 0; i < left.length; i++) {
      for (j = 0; j < right.length; j++) {
        var prod = mulPolyAtoms(left[i], right[j]);
        if (!prod) return null;
        if (!near0(prod.coef)) out.push(prod);
      }
    }
    if (!out.length) return "0";
    var foil = formatTermList(out);
    var keepOuter = !!(m[2] || m[1] === "-");
    if (!keepOuter) return foil;
    if (m[2]) return (m[1] === "-" ? "-" : "") + m[2] + "(" + foil + ")";
    return "-(" + foil + ")";
  }

  function expandSquareTerm(term) {
    var t = normFactorText(term);
    var m = t.match(/^([+-]?)(\d*)(\([^()]+\))\^2$/);
    if (!m) return null;
    var inner = parseQuadSide(m[3]);
    if (!inner || !near0(inner.a)) return null;
    var sq = polyMul(inner, inner);
    if (!sq) return null;
    var body = formatSide(sq.a, sq.b, sq.c);
    var keepOuter = !!(m[2] || m[1] === "-");
    if (!keepOuter) return body;
    if (m[2]) return (m[1] === "-" ? "-" : "") + m[2] + "(" + body + ")";
    return "-(" + body + ")";
  }

  function expandSquareKeepOuterSide(side) {
    return mapSignedSideTerms(side, function (term) {
      var sq = expandSquareTerm(term);
      if (sq) return sq;
      return term.charAt(0) === "+" ? term.slice(1) : term;
    });
  }

  function expandDistributeTerm(term) {
    var t = normFactorText(term);
    if (hasFoilParens(t)) return null;
    var m = t.match(/^([+-]?)(\d*)(x)?\(([^()]*)\)$/i);
    if (!m) return null;
    var inner = splitPolyTerms(m[4]);
    if (!inner.length) return null;
    var k = m[2] ? parseFloat(m[2], 10) : 1;
    if (m[1] === "-") k = -k;
    var byX = !!m[3];
    var out = [];
    var i;
    for (i = 0; i < inner.length; i++) {
      var atom = inner[i];
      var prod = byX ? mulPolyAtoms(atom, { kind: "x", coef: 1 }) : { kind: atom.kind, coef: atom.coef };
      if (!prod) return null;
      prod.coef *= k;
      if (!near0(prod.coef)) out.push(prod);
    }
    if (!out.length) return "0";
    return formatTermList(out);
  }

  function hasOtherParensBesideSquares(text) {
    var s = normFactorText(text).replace(/\([^()]+\)\^2/g, "#");
    return hasFoilParens(s) || hasXAfterParens(s) || hasExpandableParens(s);
  }

  function expandOneParenLayer(text) {
    var s = normFactorText(text);
    var parts = s.split("=");
    if (parts.length !== 2) return text;
    if (hasSquaredParens(s)) {
      return expandSquareKeepOuterSide(parts[0]) + "=" + expandSquareKeepOuterSide(parts[1]);
    }
    if (hasXAfterParens(s)) return moveXBeforeParensEq(s);
    if (hasFoilParens(s)) {
      return expandFoilKeepOuterSide(parts[0]) + "=" + expandFoilKeepOuterSide(parts[1]);
    }
    var L = expandDistributeSide(parts[0]);
    var R = expandDistributeSide(parts[1]);
    if (L == null || R == null) return text;
    return L + "=" + R;
  }

  function mapSignedSideTerms(side, eachTerm) {
    var terms = splitSignedTerms(side);
    if (!terms.length) return "0";
    var parts = [];
    var i;
    for (i = 0; i < terms.length; i++) {
      var piece = eachTerm(terms[i]);
      if (piece == null) return null;
      parts.push(piece.charAt(0) === "+" ? piece.slice(1) : piece);
    }
    var s = parts[0] || "0";
    for (i = 1; i < parts.length; i++) {
      var next = parts[i];
      if (!next || next === "0") continue;
      if (next.charAt(0) === "-") s += next;
      else s += "+" + next;
    }
    return s;
  }

  function expandFoilKeepOuterSide(side) {
    return mapSignedSideTerms(side, function (term) {
      var foil = expandFoilTerm(term);
      if (foil) return foil;
      return term.charAt(0) === "+" ? term.slice(1) : term;
    });
  }

  function expandDistributeSide(side) {
    return mapSignedSideTerms(side, function (term) {
      if (!hasExpandableParens(term)) {
        return term.charAt(0) === "+" ? term.slice(1) : term;
      }
      var dist = expandDistributeTerm(term);
      if (dist) return dist;
      var p = parseQuadSide(term);
      if (!p) return null;
      return formatSide(p.a, p.b, p.c);
    });
  }

  function expandSideTerms(side) {
    if (hasFoilParens(side)) return expandFoilKeepOuterSide(side) || side;
    var dist = expandDistributeSide(side);
    return dist == null ? side : dist;
  }

  function expandParensEq(text) {
    var s = normFactorText(text);
    if (s.split("=").length !== 2) return text;
    var withSquare = hasSquaredParens(s);
    var nxt = expandOneParenLayer(s);
    if (!withSquare || !hasOtherParensBesideSquares(s)) return nxt;
    var guard = 0;
    while (guard < 8 && (hasFoilParens(nxt) || hasXAfterParens(nxt) || hasExpandableParens(nxt))) {
      guard += 1;
      var more = expandOneParenLayer(nxt);
      if (normFactorText(more) === normFactorText(nxt)) break;
      nxt = more;
    }
    return nxt;
  }

  function parseABC(text) {
    var s = normFactorText(text);
    var parts = s.split("=");
    if (parts.length !== 2) return null;
    var L = parseQuadSide(parts[0]);
    var R = parseQuadSide(parts[1]);
    if (!L || !R) return null;
    return { a: L.a - R.a, b: L.b - R.b, c: L.c - R.c, L: L, R: R };
  }

  function sideZero(p) {
    return p && near0(p.a) && near0(p.b) && near0(p.c);
  }

  function countSideTerms(side) {
    var t = normFactorText(side);
    if (!t || t === "0") return { x2: 0, x: 0, n: 0 };
    if (t.charAt(0) !== "+" && t.charAt(0) !== "-") t = "+" + t;
    var x2 = 0;
    var x = 0;
    var n = 0;
    var i = 0;
    while (i < t.length) {
      if (t.charAt(i) === "+" || t.charAt(i) === "-") i += 1;
      var num = readPolyNum(t, i);
      if (!num) return null;
      i = num.i;
      if (t.slice(i, i + 3) === "x^2") {
        x2 += 1;
        i += 3;
      } else if (t.charAt(i) === "x" || t.charAt(i) === "X") {
        x += 1;
        i += 1;
      } else {
        if (!num.had) return null;
        n += 1;
      }
    }
    return { x2: x2, x: x, n: n };
  }

  function hasUncombined(text) {
    var s = normFactorText(text);
    var parts = s.split("=");
    if (parts.length !== 2) return false;
    var i;
    for (i = 0; i < 2; i++) {
      var c = countSideTerms(parts[i]);
      if (c && (c.x2 > 1 || c.x > 1 || c.n > 1)) return true;
    }
    return false;
  }

  function isStandardZero(text) {
    var p = parseABC(text);
    if (!p) return false;
    if (hasUncombined(text)) return false;
    if (hasSquaredParens(text) || hasExpandableParens(text) || hasXAfterParens(text)) return false;
    return sideZero(p.L) || sideZero(p.R);
  }

  function termKindSequence(side) {
    var t = normFactorText(side);
    if (!t || t === "0") return [];
    if (t.charAt(0) !== "+" && t.charAt(0) !== "-") t = "+" + t;
    var kinds = [];
    var i = 0;
    while (i < t.length) {
      if (t.charAt(i) === "+" || t.charAt(i) === "-") i += 1;
      var num = readPolyNum(t, i);
      if (!num) return kinds;
      i = num.i;
      if (t.slice(i, i + 3) === "x^2") {
        kinds.push("x2");
        i += 3;
      } else if (t.charAt(i) === "x" || t.charAt(i) === "X") {
        kinds.push("x");
        i += 1;
      } else {
        if (!num.had) return kinds;
        kinds.push("n");
      }
    }
    return kinds;
  }

  function isAbcOrder(text) {
    if (!isStandardZero(text)) return false;
    var p = parseABC(text);
    var s = normFactorText(text);
    var parts = s.split("=");
    var live = sideZero(p.R) ? parts[0] : parts[1];
    var kinds = termKindSequence(live);
    var rank = { x2: 0, x: 1, n: 2 };
    var i;
    for (i = 1; i < kinds.length; i++) {
      if (rank[kinds[i]] < rank[kinds[i - 1]]) return false;
    }
    return true;
  }

  function abcEquivalent(p, q) {
    if (!p || !q) return false;
    var pZ = near0(p.a) && near0(p.b) && near0(p.c);
    var qZ = near0(q.a) && near0(q.b) && near0(q.c);
    if (pZ) return qZ;
    if (qZ) return false;
    var k = null;
    if (!near0(p.a) && !near0(q.a)) k = q.a / p.a;
    else if (!near0(p.b) && !near0(q.b)) k = q.b / p.b;
    else if (!near0(p.c) && !near0(q.c)) k = q.c / p.c;
    else return false;
    if (k == null || Math.abs(k) < EPS) return false;
    return nearNum(q.a, k * p.a) && nearNum(q.b, k * p.b) && nearNum(q.c, k * p.c);
  }

  function canonicalABC(a, b, c) {
    var i;
    var A = a;
    var B = b;
    var C = c;
    for (i = 1; i <= 64; i++) {
      if (isIntNum(a * i) && isIntNum(b * i) && isIntNum(c * i)) {
        A = Math.round(a * i);
        B = Math.round(b * i);
        C = Math.round(c * i);
        break;
      }
    }
    var g = gcd(gcd(Math.abs(A) || 0, Math.abs(B) || 0), Math.abs(C) || 0);
    if (!g) g = 1;
    A /= g;
    B /= g;
    C /= g;
    if (A < 0 || (near0(A) && B < 0) || (near0(A) && near0(B) && C < 0)) {
      A = -A;
      B = -B;
      C = -C;
    }
    return { a: A, b: B, c: C };
  }

  function formatSide(a, b, c) {
    var parts = [];
    function add(coef, body) {
      if (near0(coef)) return;
      var neg = coef < 0;
      var abs = Math.abs(coef);
      var core;
      if (!body) core = fmtLinNum(abs);
      else if (nearNum(abs, 1)) core = body;
      else core = fmtLinNum(abs) + body;
      if (!parts.length) parts.push(neg ? "-" + core : core);
      else parts.push((neg ? "-" : "+") + core);
    }
    add(a, "x^2");
    add(b, "x");
    add(c, "");
    if (!parts.length) return "0";
    return parts.join("");
  }

  function formatPolyEq(a, b, c) {
    return formatSide(a, b, c) + "=0";
  }

  function splitPolyTerms(side) {
    var t = normFactorText(side);
    if (!t || t === "0") return [];
    if (t.charAt(0) !== "+" && t.charAt(0) !== "-") t = "+" + t;
    var out = [];
    var i = 0;
    while (i < t.length) {
      var sign = t.charAt(i) === "-" ? -1 : 1;
      if (t.charAt(i) === "+" || t.charAt(i) === "-") i += 1;
      var num = readPolyNum(t, i);
      if (!num) return out;
      i = num.i;
      if (t.slice(i, i + 3) === "x^2") {
        out.push({ kind: "x2", coef: sign * (num.had ? num.v : 1) });
        i += 3;
      } else if (t.charAt(i) === "x" || t.charAt(i) === "X") {
        out.push({ kind: "x", coef: sign * (num.had ? num.v : 1) });
        i += 1;
      } else {
        if (!num.had) return out;
        out.push({ kind: "n", coef: sign * num.v });
      }
    }
    return out;
  }

  function formatTermList(terms) {
    if (!terms || !terms.length) return "0";
    var s = "";
    var i;
    for (i = 0; i < terms.length; i++) {
      var c = terms[i].coef;
      var abs = Math.abs(c);
      var body;
      if (terms[i].kind === "x2") body = nearNum(abs, 1) ? "x^2" : fmtLinNum(abs) + "x^2";
      else if (terms[i].kind === "x") body = nearNum(abs, 1) ? "x" : fmtLinNum(abs) + "x";
      else body = fmtLinNum(abs);
      var neg = c < 0;
      if (i === 0) s += neg ? "-" + body : body;
      else s += (neg ? "-" : "+") + body;
    }
    return s;
  }

  function moveAllToLeft(text) {
    var s = normFactorText(text);
    var parts = s.split("=");
    if (parts.length !== 2) return text;
    var left = splitPolyTerms(parts[0]);
    var right = splitPolyTerms(parts[1]);
    var flipped = right.map(function (term) {
      return { kind: term.kind, coef: -term.coef };
    });
    var all = left.concat(flipped);
    return formatTermList(groupTermsByKind(all)) + "=0";
  }

  function groupTermsByKind(terms) {
    var grouped = [];
    ["x2", "x", "n"].forEach(function (kind) {
      terms.forEach(function (term) {
        if (term.kind === kind) grouped.push(term);
      });
    });
    return grouped;
  }

  function termsOfKind(terms, kind) {
    return terms.filter(function (term) {
      return term.kind === kind;
    });
  }

  function flipTerms(terms) {
    return terms.map(function (term) {
      return { kind: term.kind, coef: -term.coef };
    });
  }

  function isSqrtSplit(pack) {
    return !!(
      pack &&
      pack.classify &&
      pack.classify.methods &&
      pack.classify.methods.sqrt &&
      !pack.classify.methods.factor
    );
  }

  function isX2LeftConstRight(text) {
    var s = normFactorText(text);
    var parts = s.split("=");
    if (parts.length !== 2) return false;
    var L = splitPolyTerms(parts[0]);
    var R = splitPolyTerms(parts[1]);
    if (!L.length) return false;
    var hasX2term = false;
    var i;
    for (i = 0; i < L.length; i++) {
      if (L[i].kind === "n") return false;
      if (L[i].kind === "x2") hasX2term = true;
    }
    for (i = 0; i < R.length; i++) {
      if (R[i].kind !== "n") return false;
    }
    return hasX2term;
  }

  function moveX2LeftConstsRight(text) {
    var s = normFactorText(text);
    var parts = s.split("=");
    if (parts.length !== 2) return text;
    var L = splitPolyTerms(parts[0]);
    var R = splitPolyTerms(parts[1]);
    var left = termsOfKind(L, "x2")
      .concat(flipTerms(termsOfKind(R, "x2")))
      .concat(termsOfKind(L, "x"))
      .concat(flipTerms(termsOfKind(R, "x")));
    var right = termsOfKind(R, "n").concat(flipTerms(termsOfKind(L, "n")));
    return formatTermList(groupTermsByKind(left)) + "=" + formatTermList(groupTermsByKind(right));
  }

  function combineBothSides(text) {
    var s = normFactorText(text);
    var parts = s.split("=");
    if (parts.length !== 2) return text;
    var L = polySide(parts[0]);
    var R = polySide(parts[1]);
    if (!L || !R) return text;
    if (L.a < 0) {
      L = { a: -L.a, b: -L.b, c: -L.c };
      R = { a: -R.a, b: -R.b, c: -R.c };
    }
    return formatSide(L.a, L.b, L.c) + "=" + formatSide(R.a, R.b, R.c);
  }

  function bothSidesLive(text) {
    var p = parseABC(text);
    return !!(p && !sideZero(p.L) && !sideZero(p.R));
  }

  function classifyABC(p) {
    var a0 = near0(p.a);
    var b0 = near0(p.b);
    var c0 = near0(p.c);
    if (a0 && b0 && c0) {
      return {
        kind: "identity",
        methods: { sqrt: false, factor: false, formula: false, linear: false },
      };
    }
    if (a0 && b0) {
      return {
        kind: "none",
        methods: { sqrt: false, factor: false, formula: false, linear: false },
      };
    }
    if (a0) {
      return {
        kind: "linear",
        methods: { sqrt: false, factor: false, formula: false, linear: true },
      };
    }
    return {
      kind: "quadratic",
      methods: { sqrt: b0, factor: c0, formula: true, linear: false },
    };
  }

  function naturalMethod(cls) {
    if (cls.kind === "identity" || cls.kind === "none" || cls.kind === "linear") return cls.kind;
    if (cls.methods.sqrt) return "sqrt";
    if (cls.methods.factor) return "factor";
    return "formula";
  }

  function mixedError(pack, nextP) {
    if (!nextP) return "לא הצלחתי לקרוא את המשוואה. כתבו משוואה מלאה עם סימן שווה.";
    if (!near0(pack.b) && near0(nextP.b) && !near0(nextP.a)) {
      return "נראה שהשמטתם את איבר ה־x. אחרי איסוף עדיין יש מקדם ל־x, אז אי אפשר לבודד רק x².";
    }
    if (!near0(pack.c) && near0(nextP.c) && !near0(nextP.a) && !near0(nextP.b)) {
      return "נראה שהשמטתם את המספר החופשי. אם הוא לא אפס, אי אפשר רק להוציא x כגורם משותף.";
    }
    if (!near0(pack.a) && near0(nextP.a) && (!near0(nextP.b) || !near0(nextP.c))) {
      return "נראה שהשמטתם את x². אם אחרי איסוף המקדם של x² באמת 0 — זו משוואה ממעלה ראשונה.";
    }
    return "המשוואה לא שקולה. בדקו סימנים כשמעבירים אגף, ואיסוף איברים דומים (x² עם x², x עם x, מספרים עם מספרים).";
  }

  function isolatedX2(text) {
    var iso = isolatedK(text);
    if (!iso || (iso.kind !== "value" && iso.kind !== "unreduced" && iso.kind !== "expr")) return false;
    if (hasVisibleLinearX(text)) return false;
    var p = parseABC(text);
    if (p && !near0(p.b)) return false;
    return true;
  }

  function looksLikeProduct(text) {
    return !!parseProductEq(text);
  }

  function analyzeMixedStart(start) {
    var raw = parseABC(start);
    if (!raw) throw new Error("לא הצלחתי לקרוא את המשוואה הריבועית.");
    var xMoved =
      hasSquaredParens(start) || hasFoilParens(start)
        ? start
        : hasXAfterParens(start)
          ? moveXBeforeParensEq(start)
          : start;
    var expandFrom = xMoved;
    var expanded = expandFrom;
    var steps = [start];
    if (normFactorText(xMoved) !== normFactorText(start)) steps.push(xMoved);
    var guard = 0;
    while (
      guard < 10 &&
      (hasSquaredParens(expanded) ||
        hasFoilParens(expanded) ||
        hasXAfterParens(expanded) ||
        hasExpandableParens(expanded))
    ) {
      guard += 1;
      var nxt;
      if (hasSquaredParens(expanded) || hasFoilParens(expanded)) nxt = expandParensEq(expanded);
      else if (hasXAfterParens(expanded)) nxt = moveXBeforeParensEq(expanded);
      else nxt = expandParensEq(expanded);
      if (normFactorText(nxt) === normFactorText(expanded)) break;
      steps.push(nxt);
      expanded = nxt;
    }
    var body = expanded;
    var canon = canonicalABC(raw.a, raw.b, raw.c);
    var cls = classifyABC(canon);
    var standard = formatPolyEq(canon.a, canon.b, canon.c);
    var sqrtSplit = cls.methods.sqrt && !cls.methods.factor;
    var gathered = null;
    var combinedSides = null;
    var moved = body;
    var sqrtSeed = standard;
    if (sqrtSplit) {
      if (bothSidesLive(body) && !isX2LeftConstRight(body)) {
        gathered = moveX2LeftConstsRight(body);
        if (normFactorText(gathered) !== normFactorText(body)) steps.push(gathered);
      } else {
        gathered = body;
      }
      if (isX2LeftConstRight(gathered)) {
        combinedSides = combineBothSides(gathered);
        if (hasUncombined(gathered) && normFactorText(combinedSides) !== normFactorText(gathered)) {
          steps.push(combinedSides);
        }
      }
      sqrtSeed = combinedSides || gathered || body;
    } else {
      moved = bothSidesLive(body) ? moveAllToLeft(body) : body;
      if (normFactorText(moved) !== normFactorText(body)) steps.push(moved);
      var shown = formatPolyEq(raw.a, raw.b, raw.c);
      if (
        normFactorText(shown) !== normFactorText(moved) &&
        normFactorText(shown) !== normFactorText(start) &&
        normFactorText(shown) !== normFactorText(body)
      ) {
        steps.push(shown);
      }
    }
    var sqrt = null;
    var factor = null;
    var quad = null;
    var answer = "";
    var nat = naturalMethod(cls);
    if (cls.kind === "identity") {
      steps.push("כל x");
      answer = "כל x (זהות)";
    } else if (cls.kind === "none") {
      steps.push("אין פתרון");
      answer = "אין פתרון";
    } else if (cls.kind === "linear") {
      var linSeed = formatPolyEq(raw.a, raw.b, raw.c);
      var linPath = global.DoctematicaTeach.fullPath(linSeed);
      (linPath.steps || []).forEach(function (s) {
        if (s.eq && steps.indexOf(s.eq) === -1) steps.push(s.eq);
      });
      answer = "x = " + (linPath.answer != null ? linPath.answer : "");
    } else {
      if (cls.methods.sqrt) {
        try {
          sqrt = analyzeSqrtStart(sqrtSeed);
        } catch (err1) {
          sqrt = null;
        }
      }
      if (cls.methods.factor) {
        try {
          factor = analyzeFactorStart(formatPolyEq(raw.a, raw.b, raw.c));
        } catch (err2) {
          try {
            factor = analyzeFactorStart(standard);
          } catch (err2b) {
            factor = null;
          }
        }
      }
      quad = analyze(canon.a, canon.b, canon.c, standard);
      if (nat === "sqrt" && sqrt) {
        sqrt.steps.forEach(function (s) {
          if (steps.indexOf(s) === -1) steps.push(s);
        });
        answer = sqrt.answer;
      } else if (nat === "factor" && factor) {
        factor.steps.forEach(function (s) {
          if (steps.indexOf(s) === -1) steps.push(s);
        });
        answer = factor.answer;
      } else {
        quad.steps.forEach(function (s) {
          if (steps.indexOf(s) === -1) steps.push(s);
        });
        answer = quad.answer;
      }
    }
    return {
      a: canon.a,
      b: canon.b,
      c: canon.c,
      start: start,
      xMoved: xMoved,
      expanded: expanded,
      moved: moved,
      gathered: gathered,
      combinedSides: combinedSides,
      standard: standard,
      unreduced: formatPolyEq(raw.a, raw.b, raw.c),
      classify: cls,
      natural: nat,
      sqrt: sqrt,
      factor: factor,
      quad: quad,
      steps: steps,
      answer: answer,
    };
  }

  function mixedHintFor(pack, eqText) {
    var cls = pack.classify;
    if (hasSquaredParens(eqText)) {
      if (hasXAfterParens(eqText) || hasOtherParensBesideSquares(eqText)) {
        return "יש גם חזקה וגם סוגריים נוספים (למשל גורם מימין כמו (x+1)2). פתחו את החזקה בכפל מקוצר, ובאותו צעד העבירו את הגורם לשמאל ופתחו את שאר הסוגריים.";
      }
      return "פתחו את הסוגריים שבחזקה: כפל מקוצר, למשל (x−3)² = x²−6x+9, או פיצול לדו־איבר (x−3)(x−3) ואז פתיחה כמו קודם.";
    }
    if (hasFoilParens(eqText)) {
      return "פתחו את הסוגריים: כופלים איבר באיבר — הראשון בסוגר הראשון בראשון ובשני של הסוגר השני, ואז האיבר השני בסוגר הראשון בשני איברי הסוגר השני. עדיין בלי לאחד, ואת המקדם שמחוץ לכפל משאירים בחוץ.";
    }
    if (hasXAfterParens(eqText)) {
      return "אם יש גורם מימין לסוגריים, העבירו אותו לשמאל, למשל (x−4)10 → 10(x−4). אחר כך פותחים סוגריים.";
    }
    if (hasExpandableParens(eqText)) {
      return "פתחו את הסוגריים: כופלים את המקדם שבחוץ בכל איבר שבפנים. עדיין בלי לאחד איברים דומים.";
    }
    if (isSqrtSplit(pack) && !isStandardZero(eqText)) {
      if (bothSidesLive(eqText) && !isX2LeftConstRight(eqText)) {
        return "אין איבר x (b = 0). העבירו את איברי x² לאגף שמאל ואת המספרים החופשיים לאגף ימין. כשמעבירים — מחליפים סימן, עדיין בלי לאחד.";
      }
      if (isX2LeftConstRight(eqText) && hasUncombined(eqText)) {
        return "אספו איברים דומים בכל אגף: x² עם x², ומספרים עם מספרים.";
      }
      if (isolatedX2(eqText) || (isX2LeftConstRight(eqText) && !hasUncombined(eqText))) {
        return "בודדו x² אם צריך, והוציאו שורש. אם האגף השני שלילי — אין פתרון ממשי.";
      }
    }
    if (!isStandardZero(eqText) || hasUncombined(eqText)) {
      if (hasUncombined(eqText)) {
        return "אספו איברים דומים באותו אגף: x² עם x², x עם x, ומספרים עם מספרים.";
      }
      return "העבירו את כל האיברים לאגף אחד והשאירו 0 באגף השני. כשמעבירים — מחליפים סימן, עדיין בלי לאחד איברים דומים.";
    }
    if (cls.kind === "identity") return "כל המקדמים 0 — זו זהות. כל x הוא פתרון.";
    if (cls.kind === "none") return "התקבל מספר שונה מאפס ששווה לאפס. אין פתרון.";
    if (cls.kind === "linear") {
      return "המקדם של x² התאפס. זו משוואה ממעלה ראשונה — פתרו כמו משוואה רגילה.";
    }
    return mixedArrangedHint(eqText);
  }

  function mixedArrangedHint(eqText) {
    var p = parseABC(eqText);
    var b0 = p && near0(p.b);
    var c0 = p && near0(p.c);
    var always = "אפשר «נוסחת שורשים» או «md53»";
    var extra = [];
    if (b0) extra.push("שורש");
    if (c0) extra.push("גורם משותף");
    var opts = extra.length ? always + ". אפשר גם " + extra.join(" או ") : always;
    if (isAbcOrder(eqText)) {
      return "המשוואה מסודרת בצד אחד, ax²+bx+c=0. " + opts + ".";
    }
    return "הכל בצד אחד. עדיף לסדר קודם x², אחר כך x, ואז המספר. " + opts + ".";
  }

  function nextMixedStep(eqText, pack) {
    pack = pack || {};
    if (hasSquaredParens(eqText)) {
      return {
        eq: expandParensEq(eqText),
        hint: mixedHintFor(pack, eqText),
        explain: hasOtherParensBesideSquares(eqText)
          ? "פותחים (a±b)² בכפל מקוצר, ובאותו צעד גם את שאר הסוגריים במשוואה."
          : "פותחים (a±b)² בכפל מקוצר, או מפצלים ל־(a±b)(a±b) וממשיכים כמו בסוגריים כפולים.",
      };
    }
    if (hasFoilParens(eqText)) {
      return {
        eq: expandParensEq(eqText),
        hint: mixedHintFor(pack, eqText),
        explain: "פותחים סוגריים כפולים: כל איבר בסוגר הראשון בכל איבר בסוגר השני. מקדם שמחוץ לכפל נשאר בחוץ, בלי לאחד.",
      };
    }
    if (hasXAfterParens(eqText)) {
      return {
        eq: moveXBeforeParensEq(eqText),
        hint: mixedHintFor(pack, eqText),
        explain: "מעבירים את הגורם לשמאל הסוגריים, ואז פותחים.",
      };
    }
    if (hasExpandableParens(eqText)) {
      return {
        eq: expandParensEq(eqText),
        hint: mixedHintFor(pack, eqText),
        explain: "פותחים סוגריים: כופלים את המקדם שבחוץ בכל איבר שבפנים, בלי לאחד.",
      };
    }
    if (isSqrtSplit(pack)) {
      if (bothSidesLive(eqText) && !isX2LeftConstRight(eqText)) {
        return {
          eq: moveX2LeftConstsRight(eqText),
          hint: mixedHintFor(pack, eqText),
          explain: "איברי x² לשמאל, מספרים חופשיים לימין. מחליפים סימן, בלי לאחד עדיין.",
        };
      }
      if (isX2LeftConstRight(eqText) && hasUncombined(eqText)) {
        return {
          eq: pack.combinedSides || combineBothSides(eqText),
          hint: mixedHintFor(pack, eqText),
          explain: "אוספים איברים דומים בכל אגף.",
        };
      }
      if (isolatedX2(eqText) || parseBothSides(eqText) || isRootAnswerText(eqText) || isNoRealText(eqText)) {
        var fin = pack.sqrt ? nextSqrtStep(eqText, pack.sqrt) : null;
        if (fin && fin.eq) {
          return {
            path: "sqrt",
            eq: fin.eq,
            hint: fin.hint || mixedHintFor(pack, eqText),
            explain: fin.explain,
          };
        }
      }
      if (isX2LeftConstRight(eqText) && !hasUncombined(eqText) && !isolatedX2(eqText)) {
        return {
          path: "sqrt",
          eq: near0(pack.a) ? null : "x^2=" + fmtLinNum(-pack.c / pack.a),
          hint: mixedHintFor(pack, eqText),
          explain: "בודדים x² בחלוקה במקדם.",
        };
      }
    }
    if (pack.classify && pack.classify.kind === "linear" && !hasX2(eqText) && !hasExpandableParens(eqText)) {
      var linAct = global.DoctematicaTeach.nextAction(eqText);
      if (linAct && linAct.eq) {
        return {
          path: "linear",
          eq: linAct.eq,
          hint: linAct.hint || mixedHintFor(pack, eqText),
          explain: linAct.explain,
        };
      }
      return {
        path: "linear",
        hint: (linAct && linAct.hint) || mixedHintFor(pack, eqText),
        doneKind: "linear",
      };
    }
    if (bothSidesLive(eqText)) {
      return {
        eq: moveAllToLeft(eqText),
        hint: mixedHintFor(pack, eqText),
        explain: "מעבירים לאגף אחד. כל איבר מחליף סימן, בלי לאחד עדיין.",
      };
    }
    if (hasUncombined(eqText)) {
      return {
        eq: pack.unreduced || pack.standard,
        hint: mixedHintFor(pack, eqText),
        explain: "אוספים איברים דומים.",
      };
    }
    if (!isStandardZero(eqText)) {
      return {
        eq: pack.standard,
        hint: mixedHintFor(pack, eqText),
        explain: "אוספים לאגף אחד. מקדמים בודקים אחרי האיסוף, לא לפי הנתון המפוזר.",
      };
    }
    var cls = pack.classify;
    if (cls.kind === "identity") {
      return { eq: "כל x", hint: mixedHintFor(pack, eqText), doneKind: "identity" };
    }
    if (cls.kind === "none") {
      return { eq: "אין פתרון", hint: mixedHintFor(pack, eqText), doneKind: "none" };
    }
    if (cls.kind === "linear") {
      var act = global.DoctematicaTeach.nextAction(eqText);
      return {
        path: "linear",
        eq: act && act.eq,
        hint: (act && act.hint) || mixedHintFor(pack, eqText),
        explain: act && act.explain,
      };
    }
    var nat = pack.natural;
    if (nat === "factor" && pack.factor) {
      return {
        path: "factor",
        eq: pack.factor.factored,
        hint: mixedHintFor(pack, eqText),
      };
    }
    if (nat === "sqrt") {
      var isoWant = near0(pack.a) ? null : "x^2=" + fmtLinNum(-pack.c / pack.a);
      return {
        path: "sqrt",
        eq: isoWant,
        hint: mixedHintFor(pack, eqText),
      };
    }
    return {
      path: "formula",
      hint: mixedHintFor(pack, eqText),
      explain: "a, b, c הם המקדמים של הצורה ax²+bx+c=0 אחרי האיסוף.",
    };
  }

  function checkMixedTyped(prev, typed, pack) {
    var t = String(typed || "").trim();
    if (!t) return { ok: false, message: "כתבו את הצעד הבא." };
    if (global.DoctematicaAlgebra && global.DoctematicaAlgebra.missingEqualsSign(t)) {
      return { ok: false, message: "חסר סימן שווה" };
    }
    if (normFactorText(prev) === normFactorText(t)) {
      return { ok: false, message: "זו אותה משוואה. כתבו צעד חדש." };
    }
    pack = pack || {};
    var cls = pack.classify || classifyABC(pack);

    if (looksLikeProduct(t) && !hasFoilParens(prev) && !hasSquaredParens(prev)) {
      if (!cls.methods || !cls.methods.factor) {
        return {
          ok: false,
          message:
            "יש מספר חופשי (לא אפס) אחרי איסוף, אז אי אפשר רק להוציא x כגורם משותף. הביאו ל־ax²+bx+c=0 והשתמשו בנוסחת שורשים.",
        };
      }
      var fa = pack.factor || analyzeFactorStart(pack.standard);
      var fres = checkFactorTyped(prev, t, fa, {
        split: false,
        eqs: [],
        solved: [false, false],
        progress: { z: false, o: false },
      });
      if (fres.ok) return { ok: true, path: "factor", factor: fa, raw: fres };
      return { ok: false, message: fres.message };
    }

    var nextP = parseABC(t);
    var prevP = parseABC(prev);
    if (nextP && abcEquivalent(pack, nextP)) {
      if (near0(nextP.a) && near0(nextP.b) && near0(nextP.c)) {
        if (hasX2(t) || hasExpandableParens(t)) {
          /* still rearranging */
        } else {
          return { ok: true, solved: true, message: "כל x הוא פתרון — זו זהות." };
        }
      }
      if (near0(nextP.a) && near0(nextP.b) && !near0(nextP.c) && !hasX2(t) && !hasExpandableParens(t)) {
        return { ok: true, solved: true, message: "סתירה: מספר שונה מאפס שווה לאפס. אין פתרון." };
      }
      if (near0(nextP.a) && !hasX2(t) && !hasExpandableParens(t)) {
        return {
          ok: true,
          enter: "linear",
          message: "המקדם של x² התאפס. המשיכו כמשוואה ממעלה ראשונה.",
        };
      }
      if (isolatedX2(t) && !hasVisibleLinearX(prev)) {
        if (!cls.methods || !cls.methods.sqrt) {
          return { ok: false, message: mixedError(pack, nextP) };
        }
        return {
          ok: true,
          enter: "sqrt",
          message: "x² מבודד. עכשיו הוציאו שורש משני האגפים. אם האגף השני שלילי — אין פתרון ממשי.",
        };
      }
      var msg = "צעד חוקי.";
      if (hasXAfterParens(prev) && !hasXAfterParens(t) && hasExpandableParens(t)) {
        msg = "עכשיו פתחו את הסוגריים.";
      } else if (hasExpandableParens(prev) && !hasExpandableParens(t)) {
        msg = "עכשיו המשיכו לפי המקדמים, כמו במשוואה בלי סוגריים.";
      } else if (isStandardZero(t) && !hasUncombined(t)) {
        msg = mixedHintFor(pack, t);
      } else if (isolatedX2(t) && hasVisibleLinearX(prev)) {
        msg = "עכשיו הוציאו שורש משני האגפים. אם האגף השני שלילי — אין פתרון ממשי.";
      } else if (isSqrtSplit(pack) && isX2LeftConstRight(t) && hasUncombined(t)) {
        msg = "עכשיו אספו איברים דומים בכל אגף.";
      } else if (isSqrtSplit(pack) && isX2LeftConstRight(t) && !hasUncombined(t) && !isolatedX2(t)) {
        msg = "עכשיו בודדו x² (חלקו במקדם).";
      } else if (isSqrtSplit(pack) && bothSidesLive(t) && !isX2LeftConstRight(t)) {
        msg = "העבירו את איברי x² לשמאל ואת המספרים החופשיים לימין.";
      } else if (!bothSidesLive(t) && hasUncombined(t)) {
        msg = "עכשיו אספו איברים דומים (x² עם x², x עם x, מספרים עם מספרים).";
      } else if (hasUncombined(prev) && !hasUncombined(t)) {
        msg = "נכון. עכשיו אפשר להעביר לאגף אחד.";
      } else {
        msg = "אפשר להמשיך לאסוף עד ax²+bx+c=0.";
      }
      return { ok: true, rearrange: true, message: msg };
    }

    if (nextP) {
      return { ok: false, message: mixedError(pack, nextP) };
    }

    if (parseBothSides(t) || isRootAnswerText(t) || isNoRealText(t) || isNoneText(t)) {
      if (!cls.methods || !cls.methods.sqrt) {
        return {
          ok: false,
          message: "יש עדיין איבר x במשוואה. אי אפשר לעבור לשורש לפני שמבודדים x², ורק אם b = 0 אחרי איסוף.",
        };
      }
      return { ok: true, enter: "sqrt", message: "המשיכו בביצוע שורש." };
    }

    if (cls.kind === "identity" && /כל/.test(t)) {
      return { ok: true, solved: true, message: "כל x הוא פתרון." };
    }
    if (cls.kind === "none" && (isNoneText(t) || isNoRealText(t) || /אין/.test(t))) {
      return { ok: true, solved: true, message: "אין פתרון." };
    }

    if (prevP && !hasX2(t)) {
      try {
        var lin = global.DoctematicaAlgebra.checkStep(prev, t);
        if (lin.ok && near0(pack.a)) {
          return { ok: true, enter: "linear", linear: lin, message: lin.message };
        }
      } catch (err) {}
    }

    return {
      ok: false,
      message: "לא הצלחתי לקרוא את הצעד. כתבו משוואה שקולה, או בחרו דרך: שורש / גורם משותף / נוסחת שורשים.",
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
    hasVisibleLinearX: hasVisibleLinearX,
    isRootAnswerText: isRootAnswerText,
    isolatedK: isolatedK,
    parseABC: parseABC,
    classifyABC: classifyABC,
    abcEquivalent: abcEquivalent,
    formatPolyEq: formatPolyEq,
    moveAllToLeft: moveAllToLeft,
    canonicalABC: canonicalABC,
    isStandardZero: isStandardZero,
    isAbcOrder: isAbcOrder,
    expandParensEq: expandParensEq,
    hasExpandableParens: hasExpandableParens,
    analyzeMixedStart: analyzeMixedStart,
    checkMixedTyped: checkMixedTyped,
    nextMixedStep: nextMixedStep,
    mixedHintFor: mixedHintFor,
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
