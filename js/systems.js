(function (global) {
  var EPS = 1e-8;

  function near(a, b) {
    return Math.abs(a - b) < EPS;
  }

  function near0(n) {
    return near(n, 0);
  }

  function T(x, y, k) {
    return { x: x, y: y, k: k };
  }

  function add(u, v) {
    return T(u.x + v.x, u.y + v.y, u.k + v.k);
  }

  function sub(u, v) {
    return T(u.x - v.x, u.y - v.y, u.k - v.k);
  }

  function scale(u, s) {
    return T(u.x * s, u.y * s, u.k * s);
  }

  function mul(u, v) {
    var uC = near0(u.x) && near0(u.y);
    var vC = near0(v.x) && near0(v.y);
    if (uC) return scale(v, u.k);
    if (vC) return scale(u, v.k);
    throw new Error("הכפל יוצר איבר ממעלה שנייה. כאן עובדים במשוואות ליניאריות.");
  }

  function div(u, v) {
    if (!near0(v.x) || !near0(v.y) || near0(v.k)) {
      throw new Error("אפשר לחלק רק במספר קבוע שונה מאפס.");
    }
    return scale(u, 1 / v.k);
  }

  function rewrite(text) {
    return String(text)
      .replace(/[−–—]/g, "-")
      .replace(/[×·]/g, "*")
      .replace(/:/g, "/")
      .replace(/\s+/g, "");
  }

  function tokenize(text) {
    var s = rewrite(text);
    if (!s) throw new Error("השדה ריק.");
    if (s.indexOf("=") === -1) throw new Error("חסר סימן שווה");
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
      if (c === "y" || c === "Y") {
        tokens.push({ t: "y" });
        i += 1;
        continue;
      }
      if ((c >= "0" && c <= "9") || c === ".") {
        var m = s.slice(i).match(/^\d+(\.\d+)?/);
        if (!m) throw new Error("מספר לא תקין.");
        tokens.push({ t: "num", v: parseFloat(m[0], 10) });
        i += m[0].length;
        continue;
      }
      throw new Error("תו לא מוכר: «" + c + "».");
    }
    var out = [];
    function endsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === "y" || tok.t === ")");
    }
    function startsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === "y" || tok.t === "(");
    }
    for (i = 0; i < tokens.length; i++) {
      var prev = out[out.length - 1];
      var cur = tokens[i];
      if (endsValue(prev) && startsValue(cur)) out.push({ t: "*" });
      out.push(cur);
    }
    return out;
  }

  function parseSide(tokens) {
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
        return mul(T(0, 0, -1), parseUnary());
      }
      return parsePrimary();
    }
    function parsePrimary() {
      var tok = peek();
      if (!tok) throw new Error("הביטוי נקטע באמצע.");
      if (tok.t === "num") {
        eat();
        return T(0, 0, tok.v);
      }
      if (tok.t === "x") {
        eat();
        return T(1, 0, 0);
      }
      if (tok.t === "y") {
        eat();
        return T(0, 1, 0);
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
    if (i !== tokens.length) throw new Error("לא הצלחתי לקרוא את כל האגף.");
    return value;
  }

  function parseEquation(text) {
    var tokens = tokenize(text);
    var eqIndex = -1;
    var j;
    for (j = 0; j < tokens.length; j++) {
      if (tokens[j].t === "=") {
        if (eqIndex !== -1) throw new Error("יותר מסימן שוויון אחד.");
        eqIndex = j;
      }
    }
    if (eqIndex === -1) throw new Error("חסר סימן שווה");
    var leftToks = tokens.slice(0, eqIndex);
    var rightToks = tokens.slice(eqIndex + 1);
    if (!leftToks.length || !rightToks.length) throw new Error("חסר אגף במשוואה.");
    return {
      left: parseSide(leftToks),
      right: parseSide(rightToks),
      source: String(text).trim(),
    };
  }

  function row(eq) {
    return sub(eq.left, eq.right);
  }

  function equivalent(a, b) {
    var r = row(a);
    var s = row(b);
    var zerosR = near0(r.x) && near0(r.y) && near0(r.k);
    var zerosS = near0(s.x) && near0(s.y) && near0(s.k);
    if (zerosR && zerosS) return true;
    if (zerosR || zerosS) return false;
    if (near0(r.x) && near0(r.y)) {
      return near0(s.x) && near0(s.y) && near0(r.k) === near0(s.k);
    }
    var k = null;
    if (!near0(r.x)) k = s.x / r.x;
    else if (!near0(r.y)) k = s.y / r.y;
    else k = s.k / r.k;
    if (near0(k)) return false;
    return near(s.x, k * r.x) && near(s.y, k * r.y) && near(s.k, k * r.k);
  }

  function isIdentity(eq) {
    var r = row(eq);
    return near0(r.x) && near0(r.y) && near0(r.k);
  }

  function isContradiction(eq) {
    var r = row(eq);
    return near0(r.x) && near0(r.y) && !near0(r.k);
  }

  function isBareVar(side, v) {
    if (v === "x") return near(side.x, 1) && near0(side.y) && near0(side.k);
    return near0(side.x) && near(side.y, 1) && near0(side.k);
  }

  function hasVar(side, v) {
    return v === "x" ? !near0(side.x) : !near0(side.y);
  }

  function readIsolation(eq) {
    var left = eq.left;
    var right = eq.right;
    if (isBareVar(left, "x") && !hasVar(right, "x")) {
      return { v: "x", rhs: right, source: eq.source };
    }
    if (isBareVar(right, "x") && !hasVar(left, "x")) {
      return { v: "x", rhs: left, source: eq.source };
    }
    if (isBareVar(left, "y") && !hasVar(right, "y")) {
      return { v: "y", rhs: right, source: eq.source };
    }
    if (isBareVar(right, "y") && !hasVar(left, "y")) {
      return { v: "y", rhs: left, source: eq.source };
    }
    return null;
  }

  function isolationsOf(eq1s, eq2s) {
    var out = [];
    var a = readIsolation(parseEquation(eq1s));
    var b = readIsolation(parseEquation(eq2s));
    if (a) {
      a.from = 0;
      out.push(a);
    }
    if (b) {
      b.from = 1;
      out.push(b);
    }
    return out;
  }

  function substitute(isol, eqText) {
    var eq = parseEquation(eqText);
    function repl(side) {
      if (isol.v === "x") return add(scale(isol.rhs, side.x), T(0, side.y, side.k));
      return add(scale(isol.rhs, side.y), T(side.x, 0, side.k));
    }
    return { left: repl(eq.left), right: repl(eq.right) };
  }

  function substituteNumeric(v, value, eqText) {
    return substitute({ v: v, rhs: T(0, 0, value) }, eqText);
  }

  function dropCoeffSub(isol, eqText) {
    var eq = parseEquation(eqText);
    function repl(side) {
      var coef = isol.v === "x" ? side.x : side.y;
      var kept = isol.v === "x" ? T(0, side.y, side.k) : T(side.x, 0, side.k);
      if (near0(coef)) return kept;
      return add(isol.rhs, kept);
    }
    return { left: repl(eq.left), right: repl(eq.right) };
  }

  function noDistributeSub(isol, eqText) {
    var eq = parseEquation(eqText);
    function repl(side) {
      var coef = isol.v === "x" ? side.x : side.y;
      var kept = isol.v === "x" ? T(0, side.y, side.k) : T(side.x, 0, side.k);
      if (near0(coef)) return kept;
      var wrong = T(coef * isol.rhs.x, coef * isol.rhs.y, isol.rhs.k);
      return add(wrong, kept);
    }
    return { left: repl(eq.left), right: repl(eq.right) };
  }

  function solvedNumber(eq) {
    var iso = readIsolation(eq);
    if (!iso) return null;
    if (!near0(iso.rhs.x) || !near0(iso.rhs.y)) return null;
    return { v: iso.v, value: iso.rhs.k };
  }

  function arrangePlain(text) {
    return String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
  }

  function regionClutter(s) {
    var cleaned = String(s).replace(/\/\d+(?:\.\d+)?/g, "");
    var xs = (cleaned.match(/x/gi) || []).length;
    var ys = (cleaned.match(/y/gi) || []).length;
    if (xs > 1 || ys > 1) return true;
    var noVar = cleaned.replace(/[0-9.]*[xy]/gi, " ");
    var constants = noVar.match(/\d+(?:\.\d+)?/g) || [];
    return constants.length > 1;
  }

  function writtenNeedsCombine(text) {
    var parts = arrangePlain(text).split("=");
    if (parts.length !== 2) return false;
    var i;
    for (i = 0; i < 2; i++) {
      var side = parts[i];
      var outside = side.replace(/\([^()]*\)/g, " ").replace(/\/\d+(?:\.\d+)?/g, "");
      if (regionClutter(outside)) return true;
      var re = /\(([^()]*)\)/g;
      var m;
      while ((m = re.exec(side))) {
        if (regionClutter(m[1])) return true;
      }
    }
    return false;
  }

  function parenHasSum(inside) {
    return /[+-]/.test(String(inside).replace(/^[+-]/, ""));
  }

  function findDistribute(text) {
    var s = String(text || "").replace(/\s+/g, "").replace(/[−–—]/g, "-");
    var i = 0;
    while (i < s.length) {
      var open = s.indexOf("(", i);
      if (open < 0) return null;
      var close = s.indexOf(")", open + 1);
      if (close < 0) return null;
      if (s.charAt(close + 1) === "/") {
        i = close + 1;
        continue;
      }
      var inside = s.slice(open + 1, close);
      if (!parenHasSum(inside)) {
        i = close + 1;
        continue;
      }
      var k = open - 1;
      var coefStr = "";
      while (k >= 0 && /[0-9.]/.test(s.charAt(k))) {
        coefStr = s.charAt(k) + coefStr;
        k -= 1;
      }
      var start = open - coefStr.length;
      var sign = 1;
      if (k >= 0 && s.charAt(k) === "-") {
        sign = -1;
        start = k;
      }
      if (!coefStr && sign === 1 && (open === 0 || s.charAt(open - 1) === "=" || s.charAt(open - 1) === "+")) {
        return { start: start, end: close + 1, coef: 1, inside: inside, dropOnly: true };
      }
      if (coefStr || sign === -1) {
        var coef = (coefStr ? parseFloat(coefStr, 10) : 1) * sign;
        return { start: start, end: close + 1, coef: coef, inside: inside, dropOnly: false };
      }
      i = close + 1;
    }
    return null;
  }

  function listDistributes(text) {
    var hits = [];
    var from = 0;
    var guard = 0;
    var src = String(text || "");
    while (guard < 8) {
      guard += 1;
      var hit = findDistribute(src.slice(from));
      if (!hit) break;
      hit.start += from;
      hit.end += from;
      hits.push(hit);
      from = hit.end;
    }
    return hits;
  }

  function vecText(v) {
    var items = [];
    if (!near0(v.x)) items.push({ c: v.x, k: "x" });
    if (!near0(v.y)) items.push({ c: v.y, k: "y" });
    if (!near0(v.k) || !items.length) items.push({ c: near0(v.k) ? 0 : v.k, k: "n" });
    var s = "";
    var i;
    for (i = 0; i < items.length; i++) {
      var abs = String(fmt(Math.abs(items[i].c))).split(" או ")[0].replace(/−/g, "-");
      var body = items[i].k === "n" ? abs : abs === "1" ? items[i].k : abs + items[i].k;
      if (i === 0) s += (items[i].c < 0 ? "-" : "") + body;
      else s += (items[i].c < 0 ? "-" : "+") + body;
    }
    return s;
  }

  function distributeMiss(prevText, nextText) {
    var hits = listDistributes(prevText);
    if (!hits.length) return "";
    var next;
    try {
      next = parseEquation(nextText);
    } catch (err) {
      return "";
    }
    var src = String(prevText).replace(/\s+/g, "").replace(/[−–—]/g, "-");
    var i;
    for (i = 0; i < hits.length; i++) {
      var hit = hits[i];
      var inside;
      try {
        inside = parseEquation(hit.inside + "=0").left;
      } catch (err2) {
        continue;
      }
      var full = T(inside.x * hit.coef, inside.y * hit.coef, inside.k * hit.coef);
      var keys = ["x", "y", "k"];
      var ki;
      for (ki = 0; ki < keys.length; ki++) {
        var key = keys[ki];
        if (near0(inside[key])) continue;
        var skipped = T(full.x, full.y, full.k);
        skipped[key] = inside[key];
        var flipped = T(full.x, full.y, full.k);
        flipped[key] = -full[key];
        var options = [skipped, flipped];
        var oi;
        for (oi = 0; oi < options.length; oi++) {
          var wrong = options[oi];
          if (near(wrong.x, full.x) && near(wrong.y, full.y) && near(wrong.k, full.k)) continue;
          var replaced = src.slice(0, hit.start) + vecText(wrong) + src.slice(hit.end);
          var parsed;
          try {
            parsed = parseEquation(replaced);
          } catch (err3) {
            continue;
          }
          if (!equivalent(parsed, next)) continue;
          var shown = src.slice(hit.start, hit.end).replace(/-/g, "−");
          var good = vecText(full).replace(/-/g, "−");
          var bad = vecText(wrong).replace(/-/g, "−");
          return "צריך לפתוח סוגריים נכון: " + shown + " זה " + good + ", לא " + bad + ". כופלים את כל האיברים שבסוגריים.";
        }
      }
    }
    return "";
  }

  function teachApi() {
    return global.DoctematicaTeach || null;
  }

  function denomKindOf(text) {
    var Teach = teachApi();
    if (!Teach) return "";
    if (typeof Teach.analyzeLcdNeed === "function" && Teach.analyzeLcdNeed(text)) return "lcd";
    if (typeof Teach.clearEqDens === "function" && Teach.clearEqDens(text)) return "drop";
    return "";
  }

  function lcdPack(text) {
    var Teach = teachApi();
    if (!Teach || typeof Teach.analyzeLcdNeed !== "function") return null;
    var info = Teach.analyzeLcdNeed(text);
    if (!info || info.algebraic) return null;
    return {
      lcd: info.lcd,
      leftN: info.leftTerms.length,
      terms: info.terms.map(function (t) {
        return { text: t.text, den: t.den, mul: t.mul, side: t.side };
      }),
    };
  }

  function numericDenomStep(text) {
    var Teach = teachApi();
    if (!Teach || typeof Teach.numericDenomStep !== "function") return null;
    var step = Teach.numericDenomStep(text);
    if (!step || !step.eq) return null;
    var pack = lcdPack(text);
    if (pack) {
      var dens = [];
      var bits = [];
      var i;
      for (i = 0; i < pack.terms.length; i++) {
        if (pack.terms[i].den > 1 && dens.indexOf(pack.terms[i].den) < 0) dens.push(pack.terms[i].den);
        bits.push(String(pack.terms[i].text).replace(/-/g, "−") + " ×" + pack.terms[i].mul);
      }
      step.hint = "יש מכנים " + dens.join(" ו־") + ". המכנה המשותף הוא " + pack.lcd + ". חשבו במה צריך להכפיל כל איבר.";
      step.reason = "המכנה המשותף הוא " + pack.lcd + ". כפלנו: " + bits.join(", ") + ".";
    } else {
      step.reason = step.explain || "הורדנו את המכנים.";
      if (!step.hint) step.hint = "המכנים זהים. הורידו אותם.";
    }
    return step;
  }

  function componentScale(src, dst) {
    if (near0(src)) return near0(dst) ? null : NaN;
    return dst / src;
  }

  function denomMiss(prevText, nextText) {
    var pack = lcdPack(prevText);
    if (!pack) return "";
    var prev;
    var next;
    try {
      prev = parseEquation(prevText);
      next = parseEquation(nextText);
    } catch (err) {
      return "";
    }
    if (equivalent(prev, next)) return "";
    var rp = row(prev);
    var rn = row(next);
    var scales = { x: componentScale(rp.x, rn.x), y: componentScale(rp.y, rn.y), k: componentScale(rp.k, rn.k) };
    var keys = ["x", "y", "k"];
    var present = [];
    var i;
    for (i = 0; i < keys.length; i++) {
      if (scales[keys[i]] != null && !isNaN(scales[keys[i]])) present.push(keys[i]);
    }
    if (present.length < 2) return "";
    var anchor = null;
    for (i = 0; i < present.length; i++) {
      var s = scales[present[i]];
      var votes = 0;
      var j;
      for (j = 0; j < present.length; j++) if (near(scales[present[j]], s)) votes += 1;
      if (votes >= 2 && s > 0) anchor = s;
    }
    if (anchor == null) return "";
    var odd = "";
    for (i = 0; i < present.length; i++) {
      if (!near(scales[present[i]], anchor)) odd = present[i];
    }
    if (!odd) return "";
    if (odd === "k") {
      if (near(scales.k, 1)) return "שכחתם לכפול את אגף ימין. המכנה המשותף כופל גם את המספר באגף ימין.";
      return "טעות בחישוב באגף ימין אחרי הכפל במכנה המשותף.";
    }
    var want = 0;
    var shown = "";
    for (i = 0; i < pack.terms.length; i++) {
      if (odd === "x" && /x/i.test(pack.terms[i].text)) {
        want = pack.terms[i].mul;
        shown = String(pack.terms[i].text).replace(/-/g, "−");
      }
      if (odd === "y" && /y/i.test(pack.terms[i].text) && !/x/i.test(pack.terms[i].text)) {
        want = pack.terms[i].mul;
        shown = String(pack.terms[i].text).replace(/-/g, "−");
      }
    }
    if (scales[odd] < 0 || near(scales[odd], -anchor)) {
      return "הסימן של " + (shown || odd) + " נעלם. המינוס נשאר גם אחרי הכפל במכנה המשותף.";
    }
    var den = 1;
    for (i = 0; i < pack.terms.length; i++) {
      var term = pack.terms[i];
      var hit = odd === "y" ? /y/i.test(term.text) && !/x/i.test(term.text) : /x/i.test(term.text);
      if (hit) den = term.den;
    }
    var actual = want ? Math.round((scales[odd] / anchor) * want) : 0;
    if (want && actual !== want) {
      return "המכפיל של " + (shown || odd) + " הוא " + want + " (" + pack.lcd + "÷" + den + "), לא " + actual + ".";
    }
    return "הכפל במכנה המשותף לא חל נכון על האיבר עם " + odd + ".";
  }

  function lcdNote(prevText, nextText) {
    var Teach = teachApi();
    if (!Teach || typeof Teach.clearEqDens !== "function") return "";
    var cleared = Teach.clearEqDens(prevText);
    if (!cleared) return "";
    var prev;
    var next;
    var base;
    try {
      prev = parseEquation(prevText);
      next = parseEquation(nextText);
      base = parseEquation(cleared);
    } catch (err) {
      return "";
    }
    if (!equivalent(prev, next)) return "";
    var rb = row(base);
    var rn = row(next);
    var k = !near0(rb.x) ? rn.x / rb.x : !near0(rb.y) ? rn.y / rb.y : !near0(rb.k) ? rn.k / rb.k : null;
    if (k == null || !near(rn.x, k * rb.x) || !near(rn.y, k * rb.y) || !near(rn.k, k * rb.k)) return "";
    var info = Teach.analyzeLcdNeed(prevText);
    if (info && Math.abs(k - Math.round(k)) < 1e-6 && Math.abs(Math.round(k)) > 1) {
      return "הצעד נכון. היה אפשר להשתמש במכנה המשותף הקטן יותר, " + info.lcd + ", ולקבל מספרים פשוטים יותר.";
    }
    if (info && Teach.clearEqDens(nextText) && Math.abs(k - 1) < 1e-6 && typeof Teach.numericDenomStep === "function") {
      var site = Teach.numericDenomStep(prevText);
      if (site && site.eq && rewrite(site.eq) !== rewrite(nextText)) {
        return "הצעד נכון. אפשר היה לבטל את כל המכנים בצעד אחד.";
      }
    }
    return "";
  }

  function equationStatus(text) {
    var eq;
    try {
      eq = parseEquation(text);
    } catch (err) {
      return { ready: false, kind: "parse", message: err.message };
    }
    if (writtenNeedsCombine(text)) return { ready: false, kind: "combine" };
    var num = solvedNumber(eq);
    if (num) return { ready: true, kind: "value", v: num.v, value: num.value };
    var iso = readIsolation(eq);
    if (iso) return { ready: true, kind: "isolated", v: iso.v };
    var denomKind = denomKindOf(text);
    if (denomKind) return { ready: false, kind: denomKind };
    if (findDistribute(text)) return { ready: false, kind: "expand" };
    var leftVar = !near0(eq.left.x) || !near0(eq.left.y);
    var rightVar = !near0(eq.right.x) || !near0(eq.right.y);
    var leftNum = !near0(eq.left.k);
    var rightNum = !near0(eq.right.k);
    var leftConst = !leftVar;
    var rightConst = !rightVar;
    var leftVarsOnly = leftVar && !leftNum;
    var rightVarsOnly = rightVar && !rightNum;
    if ((leftVarsOnly && rightConst) || (rightVarsOnly && leftConst)) return { ready: true, kind: "standard" };
    return { ready: false, kind: "scatter" };
  }

  function fmt(n) {
    return global.DoctematicaAlgebra.formatNumber(n);
  }

  function valueCheck(eq, text) {
    var num = solvedNumber(eq);
    if (!num) return null;
    var status = global.DoctematicaAlgebra.isolatedRhsKind(text, num.v);
    if (status === "value") {
      return {
        ok: true,
        kind: "value",
        v: num.v,
        value: num.value,
        message: "מצאתם " + num.v + " = " + fmt(num.value) + ".",
      };
    }
    return {
      ok: true,
      kind: "step",
      message:
        status === "unreduced"
          ? "צעד חוקי: העברתם את המקדם בחילוק. עכשיו חשבו את השבר, למשל 40/2 → 20."
          : "צעד חוקי, אבל זה עדיין לא הפתרון הסופי. פשטו את האגף עד שמקבלים מספר אחד.",
    };
  }

  function checkWorkStep(prevText, nextText) {
    if (rewrite(prevText) === rewrite(nextText)) {
      return { ok: false, message: "זו אותה משוואה. כתבו צעד חדש." };
    }
    var prev;
    var next;
    try {
      prev = parseEquation(prevText);
      next = parseEquation(nextText);
    } catch (err) {
      return { ok: false, message: err.message };
    }
    if (isContradiction(next) && equivalent(prev, next)) {
      return { ok: true, kind: "none", message: "התקבלה סתירה. למערכת אין פתרון." };
    }
    if (isIdentity(next) && equivalent(prev, next)) {
      return { ok: true, kind: "infinite", message: "התקבלה זהות. יש אינסוף פתרונות (המשוואות תלויות)." };
    }
    if (!equivalent(prev, next)) {
      var missed = distributeMiss(prevText, nextText);
      if (missed) return { ok: false, errorId: "distribute", message: missed };
      var classified = global.DoctematicaErrors.classify(prev, next);
      return { ok: false, message: classified.message };
    }
    var ready = valueCheck(next, nextText);
    if (ready) return ready;
    var iso = readIsolation(next);
    if (iso) {
      return {
        ok: true,
        kind: "isolated",
        isolation: iso,
        message: "בודדתם את " + iso.v + ". עכשיו מציבים במשוואה האחרת.",
      };
    }
    return { ok: true, kind: "step", message: "צעד חוקי. המשיכו." };
  }

  function checkSubstituted(isol, targetText, writtenText) {
    var expected;
    var written;
    try {
      expected = substitute(isol, targetText);
      expected.source = writtenText;
      written = parseEquation(writtenText);
    } catch (err) {
      return { ok: false, message: err.message };
    }
    if (!equivalent(expected, written)) {
      var dropped = dropCoeffSub(isol, targetText);
      if (equivalent(dropped, written)) {
        return {
          ok: false,
          message:
            "שכחתם את המקדם. אם כתוב 5x ו־x שווה לביטוי, צריך להציב 5·(הביטוי), לא את הביטוי לבד.",
        };
      }
      var nodist = noDistributeSub(isol, targetText);
      if (equivalent(nodist, written)) {
        return {
          ok: false,
          message:
            "צריך לפתוח סוגריים נכון: 5(y+4) זה 5y+20, לא 5y+4. כופלים את כל האיברים שבסוגריים.",
        };
      }
      var classified = global.DoctematicaErrors.classify(expected, written);
      if (classified.id !== "not_equivalent") {
        return { ok: false, message: classified.message };
      }
      return {
        ok: false,
        message: "ההצבה לא תואמת. הציבו את הביטוי שבודדתם במשוואה שנבחרה.",
      };
    }
    if (isContradiction(written)) {
      return { ok: true, kind: "none", message: "התקבלה סתירה. למערכת אין פתרון." };
    }
    if (isIdentity(written)) {
      return { ok: true, kind: "infinite", message: "התקבלה זהות. יש אינסוף פתרונות." };
    }
    var ready = valueCheck(written, writtenText);
    if (ready) return ready;
    return { ok: true, kind: "step", message: "הצבה נכונה. עכשיו פתרו את המשוואה בנעלם אחד." };
  }

  function solvePair(eq1s, eq2s) {
    var r1 = row(parseEquation(eq1s));
    var r2 = row(parseEquation(eq2s));
    var det = r1.x * r2.y - r1.y * r2.x;
    if (near0(det)) {
      if (equivalent(parseEquation(eq1s), parseEquation(eq2s)) || isIdentity({ left: r1, right: T(0, 0, 0) })) {
        if (near0(r1.x * r2.k - r2.x * r1.k) && near0(r1.y * r2.k - r2.y * r1.k)) {
          return { kind: "infinite" };
        }
      }
      return { kind: "none" };
    }
    var x = (r1.y * r2.k - r1.k * r2.y) / det;
    var y = (r1.k * r2.x - r1.x * r2.k) / det;
    return { kind: "unique", x: x, y: y };
  }

  function divides(a, b) {
    if (near0(b)) return true;
    if (near0(a)) return false;
    return near(b / a, Math.round(b / a));
  }

  function isolationOption(eqText, eqIndex, v) {
    var eq = parseEquation(eqText);
    var r = row(eq);
    var a = v === "x" ? r.x : r.y;
    var b = v === "x" ? r.y : r.x;
    var c = r.k;
    if (near0(a)) {
      return { eqIndex: eqIndex, v: v, cost: 1000, absA: 0, frac: true, missing: true };
    }
    var absA = Math.abs(a);
    var frac = !divides(a, b) || !divides(a, c);
    var cost = absA === 1 ? 0 : 8 + absA;
    if (frac) cost += 18;
    var iso = readIsolation(eq);
    if (iso && iso.v === v) cost -= 12;
    return { eqIndex: eqIndex, v: v, cost: cost, absA: absA, frac: frac, missing: false };
  }

  function whyIsolate(opt) {
    if (opt.missing) return "";
    if (opt.absA === 1) return "המקדם הוא ±1, בלי חילוק ובלי שברים.";
    if (!opt.frac) return "החילוק במקדם " + fmt(opt.absA) + " יישאר במספרים שלמים.";
    return "אחרי הבידוד מחלקים ב־" + fmt(opt.absA) + ".";
  }

  function sameOpt(p, q) {
    return p.eqIndex === q.eqIndex && p.v === q.v;
  }

  function adviceIsolate(eq1, eq2, eqIndex, v) {
    var eqs = [eq1, eq2];
    var opts = [
      isolationOption(eqs[0], 0, "x"),
      isolationOption(eqs[0], 0, "y"),
      isolationOption(eqs[1], 1, "x"),
      isolationOption(eqs[1], 1, "y"),
    ];
    var chosen = isolationOption(eqs[eqIndex], eqIndex, v);
    var valid = opts.filter(function (o) {
      return !o.missing;
    });
    valid.sort(function (p, q) {
      return p.cost - q.cost;
    });
    var best = valid[0];
    if (chosen.missing) {
      return {
        tone: "tip",
        message:
          "המשתנה " +
          v +
          " לא מופיע במשוואה " +
          (eqIndex + 1) +
          ". בחרו משתנה שמופיע בה, או משוואה אחרת.",
      };
    }
    var similar = valid.filter(function (o) {
      return o.cost - best.cost <= 2.5;
    });
    if (chosen.cost - best.cost <= 2.5) {
      var other = similar.filter(function (o) {
        return !sameOpt(o, chosen);
      })[0];
      if (other) {
        return {
          tone: "ok",
          message:
            "בחירה נכונה. " +
            whyIsolate(chosen) +
            " גם לבודד את " +
            other.v +
            " במשוואה " +
            (other.eqIndex + 1) +
            " נוח באותה מידה.",
        };
      }
      return { tone: "ok", message: "בחירה נוחה. " + whyIsolate(chosen) };
    }
    return {
      tone: "tip",
      message:
        "אפשר לבודד כך, אבל נוח יותר לבודד את " +
        best.v +
        " במשוואה " +
        (best.eqIndex + 1) +
        ". " +
        whyIsolate(best),
    };
  }

  function subOption(isol, targetText, targetIndex) {
    var r = row(parseEquation(targetText));
    var coef = isol.v === "x" ? r.x : r.y;
    if (near0(coef)) {
      return { targetIndex: targetIndex, cost: 1000, absC: 0, missing: true };
    }
    var absC = Math.abs(coef);
    var numeric = near0(isol.rhs.x) && near0(isol.rhs.y);
    var cost = numeric ? absC : absC * 5;
    if (absC === 1) cost -= 2;
    return { targetIndex: targetIndex, cost: cost, absC: absC, missing: false };
  }

  function adviceSubstitute(isol, eqs, targetIndex) {
    var opts = [];
    var i;
    for (i = 0; i < eqs.length; i++) {
      if (isol.from === i) continue;
      opts.push(subOption(isol, eqs[i], i));
    }
    if (!opts.length) return { tone: "ok", message: "בחירה נכונה." };
    opts.sort(function (p, q) {
      return p.cost - q.cost;
    });
    var chosen = subOption(isol, eqs[targetIndex], targetIndex);
    var best = opts[0];
    if (opts.length === 1) {
      return { tone: "ok", message: "בחירה נכונה. מציבים במשוואה האחרת." };
    }
    if (chosen.cost - best.cost <= 2) {
      return { tone: "ok", message: "בחירה נכונה." };
    }
    return {
      tone: "tip",
      message:
        "אפשר, אבל נוח יותר להציב במשוואה " +
        (best.targetIndex + 1) +
        " — שם המקדם של " +
        isol.v +
        " קטן יותר, ויהיו פחות כפל ופחות שברים.",
    };
  }

  function bestIsolateChoice(eq1, eq2) {
    var opts = [
      isolationOption(eq1, 0, "x"),
      isolationOption(eq1, 0, "y"),
      isolationOption(eq2, 1, "x"),
      isolationOption(eq2, 1, "y"),
    ].filter(function (o) {
      return !o.missing;
    });
    opts.sort(function (p, q) {
      if (p.cost !== q.cost) return p.cost - q.cost;
      if (p.eqIndex !== q.eqIndex) return p.eqIndex - q.eqIndex;
      if (p.v === q.v) return 0;
      return p.v === "x" ? -1 : 1;
    });
    if (!opts.length) return null;
    return { eqIndex: opts[0].eqIndex, v: opts[0].v, why: whyIsolate(opts[0]), absA: opts[0].absA };
  }

  function bestReadySub(eqs, isolations) {
    var best = null;
    (isolations || []).forEach(function (iso) {
      var i;
      for (i = 0; i < eqs.length; i++) {
        if (i === iso.from) continue;
        var opt = subOption(iso, eqs[i], i);
        if (opt.missing) continue;
        if (
          !best ||
          opt.cost < best.cost - 1e-9 ||
          (Math.abs(opt.cost - best.cost) <= 1e-9 && (iso.from < best.from || (iso.from === best.from && i < best.target)))
        ) {
          best = { from: iso.from, target: i, cost: opt.cost, absC: opt.absC, isol: iso };
        }
      }
    });
    return best;
  }

  function bestBackChoice(found, eqs) {
    var need = found.v === "x" ? "y" : "x";
    var best = null;
    eqs.forEach(function (text, i) {
      var r = row(parseEquation(text));
      var a = need === "x" ? r.x : r.y;
      if (near0(a)) return;
      var cost = Math.abs(a);
      if (!best || cost < best.cost - 1e-9 || (Math.abs(cost - best.cost) <= 1e-9 && i < best.target)) {
        best = { target: i, cost: cost, absA: cost, need: need };
      }
    });
    return best;
  }

  function adviceBack(found, eqs, targetIndex) {
    var need = found.v === "x" ? "y" : "x";
    var opts = eqs.map(function (text, i) {
      var r = row(parseEquation(text));
      var a = need === "x" ? r.x : r.y;
      return { i: i, absA: Math.abs(a), cost: near0(a) ? 1000 : Math.abs(a) };
    });
    var valid = opts.filter(function (o) {
      return o.cost < 900;
    });
    valid.sort(function (p, q) {
      return p.cost - q.cost;
    });
    var chosen = opts[targetIndex];
    var best = valid[0];
    if (!best || chosen.cost - best.cost <= 1) {
      if (valid.length > 1 && Math.abs(valid[0].cost - valid[1].cost) <= 1) {
        return { tone: "ok", message: "בחירה נכונה. שתי המשוואות נוחות בערך באותה מידה." };
      }
      return { tone: "ok", message: "בחירה נוחה." };
    }
    return {
      tone: "tip",
      message:
        "אפשר, אבל נוח יותר להציב במשוואה " +
        (best.i + 1) +
        " — שם המקדם של " +
        need +
        " הוא " +
        fmt(best.absA) +
        ".",
    };
  }

  function plainN(n) {
    return String(fmt(n)).split(" או ")[0].replace(/−/g, "-").replace(/–/g, "-");
  }

  function showN(n) {
    return plainN(n).replace(/-/g, "−");
  }

  function abcOf(eq) {
    var r = row(eq);
    return { a: r.x, b: r.y, c: -r.k };
  }

  function formatSideVec(t) {
    var parts = [];
    function push(coef, letter) {
      if (near0(coef)) return;
      var body = plainN(Math.abs(coef));
      if (letter && body === "1") body = letter;
      else if (letter) body += letter;
      if (!parts.length) parts.push((coef < 0 ? "-" : "") + body);
      else parts.push((coef < 0 ? "-" : "+") + body);
    }
    push(t.x, "x");
    push(t.y, "y");
    push(t.k, "");
    return parts.join("") || "0";
  }

  function joinExpr(a, b) {
    if (b == null || b === "") return a || "0";
    if (a == null || a === "") return b;
    if (b.charAt(0) === "+" || b.charAt(0) === "-") return a + b;
    return a + "+" + b;
  }

  function splitSrc(text) {
    var s = rewrite(text);
    var i = s.indexOf("=");
    return { left: s.slice(0, i), right: s.slice(i + 1) };
  }

  function elimPack(name, order, a, b, c, A, B) {
    var cancel = null;
    if (near0(a) && !near0(b)) cancel = "x";
    else if (near0(b) && !near0(a)) cancel = "y";
    var remain = !cancel ? 1000 : cancel === "x" ? Math.abs(b) : Math.abs(a);
    var cost = cancel ? remain : 1000;
    if (name === "sub") cost += 0.3;
    if (order === "21") cost += 0.05;
    var coef1 = cancel === "x" ? A.a : cancel === "y" ? A.b : 0;
    var coef2 = cancel === "x" ? B.a : cancel === "y" ? B.b : 0;
    return {
      name: name,
      order: order,
      a: a,
      b: b,
      c: c,
      cancel: cancel,
      cost: cost,
      coef1: coef1,
      coef2: coef2,
    };
  }

  function elimOps(eq1, eq2) {
    var A = abcOf(parseEquation(eq1));
    var B = abcOf(parseEquation(eq2));
    return [
      elimPack("add", "12", A.a + B.a, A.b + B.b, A.c + B.c, A, B),
      elimPack("sub", "12", A.a - B.a, A.b - B.b, A.c - B.c, A, B),
      elimPack("sub", "21", B.a - A.a, B.b - A.b, B.c - A.c, A, B),
    ];
  }

  function opEquation(op) {
    return { left: T(op.a, op.b, 0), right: T(0, 0, op.c) };
  }

  function formatElim(eq1, eq2, op) {
    var A = splitSrc(eq1);
    var B = splitSrc(eq2);
    var left;
    var right;
    if (op.name === "add") {
      left = joinExpr(A.left, B.left);
      right = joinExpr(A.right, B.right);
    } else if (op.order === "21") {
      var e1 = parseEquation(eq1);
      left = joinExpr(B.left, formatSideVec(scale(e1.left, -1)));
      right = joinExpr(B.right, formatSideVec(scale(e1.right, -1)));
    } else {
      var e2 = parseEquation(eq2);
      left = joinExpr(A.left, formatSideVec(scale(e2.left, -1)));
      right = joinExpr(A.right, formatSideVec(scale(e2.right, -1)));
    }
    return left + "=" + right;
  }

  function formatReduced(op) {
    if (near0(op.b)) return formatSideVec(T(op.a, 0, 0)) + "=" + plainN(op.c);
    if (near0(op.a)) return formatSideVec(T(0, op.b, 0)) + "=" + plainN(op.c);
    return formatSideVec(T(op.a, op.b, 0)) + "=" + plainN(op.c);
  }

  function showsVar(text, v) {
    return new RegExp(v, "i").test(rewrite(text));
  }

  function elimSpeech(op) {
    var v = op.cancel;
    var n1 = showN(op.coef1);
    var n2 = showN(op.coef2);
    if (op.name === "add") {
      return {
        hint: "שימו לב שהמקדמים של " + v + " הם " + n1 + " ו־" + n2 + ". חיבור בין המשוואות יבטל את " + v + ".",
        reason: "חיברנו את שתי המשוואות משום שהמקדמים של " + v + " נגדיים ולכן " + v + " מתבטל.",
      };
    }
    var which =
      op.order === "21"
        ? "חיסרנו את המשוואה הראשונה מהשנייה"
        : "חיסרנו את המשוואה השנייה מהראשונה";
    return {
      hint: "המקדמים של " + v + " שווים (" + n1 + "). חיסור בין המשוואות יבטל את " + v + ".",
      reason: which + " משום שהמקדמים של " + v + " שווים ולכן " + v + " מתבטל.",
    };
  }

  function bestElimOp(eq1, eq2) {
    var ops = elimOps(eq1, eq2).filter(function (op) {
      return !!op.cancel;
    });
    ops.sort(function (p, q) {
      return p.cost - q.cost;
    });
    if (!ops.length) return null;
    var best = ops[0];
    var speech = elimSpeech(best);
    best.hint = speech.hint;
    best.reason = speech.reason;
    return best;
  }

  function withLetter(n, letter) {
    var body = showN(Math.abs(n));
    if (letter && body === "1") body = letter;
    else if (letter) body += letter;
    else body = showN(n < 0 ? -Math.abs(n) : Math.abs(n));
    if (!letter) return showN(n);
    return (n < 0 ? "−" : "") + body;
  }

  function storyOf(v1, v2, got) {
    if (near(got, v1 + v2)) return "add";
    if (near(got, v1 - v2)) return "sub12";
    if (near(got, v2 - v1)) return "sub21";
    return "other";
  }

  function howWord(how) {
    return how === "add" ? "חיבור" : "חיסור";
  }

  function expectOf(v1, v2, how) {
    if (how === "add") return v1 + v2;
    if (how === "sub12") return v1 - v2;
    return v2 - v1;
  }

  function exprOf(v1, v2, how, letter) {
    if (how === "add") {
      if (v2 < 0) return withLetter(v1, letter) + "+(" + withLetter(v2, letter) + ")";
      return withLetter(v1, letter) + "+" + withLetter(v2, letter);
    }
    if (how === "sub12") return withLetter(v1, letter) + "−" + withLetter(Math.abs(v2), letter);
    return withLetter(v2, letter) + "−" + withLetter(Math.abs(v1), letter);
  }

  function noCancelMessage() {
    return {
      ok: false,
      id: "no_cancel",
      message:
        "הפעולה שביצעתם לא ביטלה אף משתנה. בדקו את המקדמים של x ושל y ובחרו האם לחבר או לחסר את המשוואות.",
    };
  }

  function diagnoseElim(eq1, eq2, typed, forcedOp) {
    var student;
    try {
      student = abcOf(parseEquation(typed));
    } catch (err) {
      return { ok: false, id: "parse", message: err.message };
    }
    var A = abcOf(parseEquation(eq1));
    var B = abcOf(parseEquation(eq2));
    var ops = forcedOp ? [forcedOp] : elimOps(eq1, eq2);
    var eq1abc = abcOf(parseEquation(eq1));
    var eq2abc = abcOf(parseEquation(eq2));
    if (!forcedOp && (sameAbc(student, eq1abc) || sameAbc(student, eq2abc))) {
      return {
        ok: false,
        id: "given",
        message: "זו אחת מהמשוואות הנתונות. חברו או חסרו את המשוואות כדי לבטל משתנה.",
      };
    }
    function sameAbc(p, q) {
      return near(p.a, q.a) && near(p.b, q.b) && near(p.c, q.c);
    }
    var ranked = ops.map(function (op) {
      var stories = {
        a: storyOf(A.a, B.a, student.a),
        b: storyOf(A.b, B.b, student.b),
        c: storyOf(A.c, B.c, student.c),
      };
      var want = op.name === "add" ? "add" : "sub" + op.order;
      var keys = ["a", "b", "c"];
      var score = 0;
      keys.forEach(function (k) {
        if (stories[k] === want) score += 1;
      });
      return { op: op, stories: stories, score: score, want: want };
    });
    ranked.sort(function (p, q) {
      if (q.score !== p.score) return q.score - p.score;
      if (!!q.op.cancel !== !!p.op.cancel) return q.op.cancel ? -1 : 1;
      return p.op.cost - q.op.cost;
    });
    var best = ranked[0];
    if (!best || best.score < 2) {
      var parsed = parseEquation(typed);
      var target = bestElimOp(eq1, eq2);
      if (target && global.DoctematicaErrors) {
        var classified = global.DoctematicaErrors.classify(opEquation(target), parsed);
        if (classified && classified.id && classified.id !== "not_equivalent") {
          return { ok: false, id: classified.id, message: classified.message };
        }
      }
      return null;
    }
    var op = best.op;
    var stories = best.stories;
    var names = [stories.a, stories.b, stories.c];
    var mixed = names.every(function (n) {
      return n !== "other";
    }) && names.some(function (n) {
      return n !== names[0];
    });
    if (mixed) {
      return {
        ok: false,
        id: "partial_sign",
        message:
          "כאשר מחסרים משוואה, החיסור חל על כל האיברים וגם על אגף ימין. החלפתם סימן רק לחלק מהאיברים.",
      };
    }
    if (!op.cancel) return noCancelMessage();
    var v1 = A;
    var v2 = B;
    var how = op.name === "add" ? "add" : "sub" + op.order;
    function miss(key, letter) {
      var got = key === "a" ? student.a : key === "b" ? student.b : student.c;
      var src1 = key === "a" ? v1.a : key === "b" ? v1.b : v1.c;
      var src2 = key === "a" ? v2.a : key === "b" ? v2.b : v2.c;
      var expect = expectOf(src1, src2, how);
      if (letter && near0(expect) && !near0(got)) {
        return {
          ok: false,
          id: "should_cancel",
          message:
            "המקדמים של " +
            letter +
            " היו אמורים להתבטל ב" +
            howWord(how === "add" ? "add" : "sub") +
            ", אבל " +
            letter +
            " נשאר בגלל חישוב שגוי. " +
            exprOf(src1, src2, how, letter) +
            " זה 0.",
        };
      }
      if (!letter) {
        return {
          ok: false,
          id: "rhs",
          message:
            "ביצעתם את הפעולה באגף שמאל, אבל לא אותה פעולה באגף ימין. " +
            exprOf(src1, src2, how, "") +
            " זה " +
            showN(expect) +
            ", לא " +
            showN(got) +
            ".",
        };
      }
      return {
        ok: false,
        id: "coef_arith",
        message:
          "טעות ב" +
          howWord(how === "add" ? "add" : "sub") +
          " המקדמים של " +
          letter +
          ": " +
          exprOf(src1, src2, how, letter) +
          " זה " +
          withLetter(expect, letter) +
          ", לא " +
          withLetter(got, letter) +
          ".",
      };
    }
    if (stories.a !== "other" && stories.b !== "other" && stories.c === "other") return miss("c", "");
    if (stories.b !== "other" && stories.c !== "other" && stories.a === "other") return miss("a", "x");
    if (stories.a !== "other" && stories.c !== "other" && stories.b === "other") return miss("b", "y");
    if (best.score === 3 && !op.cancel) return noCancelMessage();
    return null;
  }

  function isInt(n) {
    return Math.abs(n - Math.round(n)) < 1e-6;
  }

  function scaleEquation(text, k) {
    var eq = parseEquation(text);
    return formatSideVec(scale(eq.left, k)) + "=" + formatSideVec(scale(eq.right, k));
  }

  function scaleRatio(fromText, toText) {
    var from;
    var to;
    try {
      from = row(parseEquation(fromText));
      to = row(parseEquation(toText));
    } catch (err) {
      return { error: err.message };
    }
    var pairs = [
      [from.x, to.x],
      [from.y, to.y],
      [from.k, to.k],
    ];
    var s = null;
    var i;
    for (i = 0; i < pairs.length; i++) {
      var a = pairs[i][0];
      var b = pairs[i][1];
      if (near0(a) && near0(b)) continue;
      if (near0(a) || near0(b)) return { ratio: null };
      var cand = b / a;
      if (s == null) s = cand;
      else if (!near(s, cand)) return { ratio: null };
    }
    return { ratio: s == null ? 1 : s };
  }

  function gcdInt(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function lcmInt(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    if (!a || !b) return 0;
    return (a / gcdInt(a, b)) * b;
  }

  function prepSpeech(move) {
    var goal = move.opName === "add" ? "נגדיים" : "שווים";
    var pair = showN(move.coef1) + " ו־" + showN(move.coef2);
    var used = [];
    var i;
    for (i = 0; i < 2; i++) {
      if (move.factors[i] != null) used.push(i);
    }
    if (used.length === 1) {
      var n = used[0] + 1;
      var kn = showN(move.factors[used[0]]);
      move.hint =
        "שימו לב למקדמים של " +
        move.cancel +
        ": " +
        pair +
        ". דרך נוחה היא להכפיל את משוואה " +
        n +
        " ב־" +
        kn +
        ", כך שמקדמי " +
        move.cancel +
        " יהיו " +
        goal +
        ".";
      move.reason = "נכפיל את משוואה " + n + " ב־" + kn + " כדי שמקדמי " + move.cancel + " יהיו " + goal + ".";
      return;
    }
    move.hint =
      "מקדמי " +
      move.cancel +
      " הם " +
      pair +
      ". כדי לקבל מקדמים " +
      goal +
      " אפשר להכפיל את המשוואה הראשונה ב־" +
      showN(move.factors[0]) +
      " ואת השנייה ב־" +
      showN(move.factors[1]) +
      ".";
    move.reason = "נכפיל את שתי המשוואות כך שמקדמי " + move.cancel + " יהיו " + goal + ".";
  }

  function bestPrep(eq1, eq2) {
    if (bestElimOp(eq1, eq2)) return null;
    var eqs = [String(eq1), String(eq2)];
    var coefs = [abcOf(parseEquation(eqs[0])), abcOf(parseEquation(eqs[1]))];
    var vars = [
      { v: "x", key: "a" },
      { v: "y", key: "b" },
    ];
    var moves = [];
    function consider(spec, factors, next) {
      var op = bestElimOp(next[0], next[1]);
      if (!op || op.cancel !== spec.v) return;
      var used = 0;
      var sum = 0;
      var neg = 0;
      var i;
      for (i = 0; i < 2; i++) {
        if (factors[i] == null) continue;
        used += 1;
        sum += Math.abs(factors[i]);
        if (factors[i] < 0) neg += 8;
      }
      var cost = (used === 1 ? 0 : 1000) + sum * (used === 1 ? 100 : 50) + neg + Math.abs(op.a) + Math.abs(op.b);
      var row = {
        factors: factors,
        cancel: spec.v,
        opName: op.name,
        cost: cost,
        coef1: coefs[0][spec.key],
        coef2: coefs[1][spec.key],
      };
      if (used === 1) {
        row.index = factors[0] != null ? 0 : 1;
        row.k = factors[row.index];
      }
      moves.push(row);
    }
    var vi;
    for (vi = 0; vi < vars.length; vi++) {
      var spec = vars[vi];
      var index;
      for (index = 0; index < 2; index++) {
        var src = coefs[index][spec.key];
        var other = coefs[1 - index][spec.key];
        if (near0(src)) continue;
        var sign;
        for (sign = -1; sign <= 1; sign += 2) {
          var kRaw = (sign * other) / src;
          if (!isInt(kRaw)) continue;
          var k = Math.round(kRaw);
          if (Math.abs(k) < 2) continue;
          var next = eqs.slice();
          next[index] = scaleEquation(eqs[index], k);
          var factors = [null, null];
          factors[index] = k;
          consider(spec, factors, next);
        }
      }
      var c1 = coefs[0][spec.key];
      var c2 = coefs[1][spec.key];
      if (near0(c1) || near0(c2)) continue;
      var target = lcmInt(c1, c2);
      if (!target) continue;
      var k1 = target / c1;
      var k2 = target / c2;
      if (!isInt(k1) || !isInt(k2)) continue;
      k1 = Math.round(k1);
      k2 = Math.round(k2);
      var pairSign;
      for (pairSign = 0; pairSign < 2; pairSign++) {
        var f1 = k1;
        var f2 = pairSign === 0 ? k2 : -k2;
        if (Math.abs(f1) < 2 || Math.abs(f2) < 2) continue;
        consider(spec, [f1, f2], [scaleEquation(eqs[0], f1), scaleEquation(eqs[1], f2)]);
      }
    }
    moves.sort(function (p, q) {
      return p.cost - q.cost;
    });
    if (!moves.length) return null;
    var best = moves[0];
    prepSpeech(best);
    return best;
  }

  function scaleMissMessage(srcText, gotText, k) {
    var src = abcOf(parseEquation(srcText));
    var got;
    try {
      got = abcOf(parseEquation(gotText));
    } catch (err) {
      return err.message;
    }
    var exp = { a: k * src.a, b: k * src.b, c: k * src.c };
    var keys = [
      { key: "a", letter: "x" },
      { key: "b", letter: "y" },
      { key: "c", letter: "" },
    ];
    var bad = [];
    var i;
    for (i = 0; i < keys.length; i++) {
      if (!near(got[keys[i].key], exp[keys[i].key])) bad.push(keys[i]);
    }
    if (bad.length === 1 && bad[0].key === "c" && near(got.a, exp.a) && near(got.b, exp.b)) {
      return {
        id: "rhs_scale",
        message:
          "הכפל צריך לחול על כל המשוואה, גם על אגף ימין. " +
          showN(src.c) +
          "·" +
          showN(k) +
          " זה " +
          showN(exp.c) +
          ", לא " +
          showN(got.c) +
          ".",
      };
    }
    if (bad.length === 1 && bad[0].letter) {
      var letter = bad[0].letter;
      var srcC = src[bad[0].key];
      var gotC = got[bad[0].key];
      if (near(gotC, srcC)) {
        return {
          id: "partial_scale",
          message:
            "הכפל צריך לחול על כל המשוואה. המקדם של " +
            letter +
            " לא הוכפל: " +
            showN(k) +
            "·" +
            showN(srcC) +
            " זה " +
            showN(k * srcC) +
            ", לא " +
            showN(gotC) +
            ".",
        };
      }
      return {
        id: "scale_arith",
        message:
          "טעות בכפל של מקדם " +
          letter +
          ": " +
          showN(k) +
          "·" +
          showN(srcC) +
          " זה " +
          showN(k * srcC) +
          ", לא " +
          showN(gotC) +
          ".",
      };
    }
    var arith = null;
    for (i = 0; i < bad.length; i++) {
      var srcN = src[bad[i].key];
      var gotN = got[bad[i].key];
      if (near0(srcN)) continue;
      if (!near(gotN, k * srcN)) {
        arith = {
          id: "scale_arith",
          message:
            "טעות בכפל" +
            (bad[i].letter ? " של מקדם " + bad[i].letter : " באגף ימין") +
            ": " +
            showN(k) +
            "·" +
            showN(srcN) +
            " זה " +
            showN(k * srcN) +
            ", לא " +
            showN(gotN) +
            ".",
        };
        break;
      }
    }
    if (arith) return arith;
    return {
      id: "scale",
      message: "המשוואה אינה הכפלה ב־" + showN(k) + " של המשוואה שנבחרה. הכפל חל על כל האיברים ועל אגף ימין.",
    };
  }

  function factorList(declared) {
    if (!declared) return null;
    if (declared.factors) {
      return [
        declared.factors[0] == null || declared.factors[0] === "" ? null : Number(declared.factors[0]),
        declared.factors[1] == null || declared.factors[1] === "" ? null : Number(declared.factors[1]),
      ];
    }
    if (declared.index === 0 || declared.index === 1) {
      var list = [null, null];
      list[declared.index] = Number(declared.k);
      return list;
    }
    return null;
  }

  function missText(miss) {
    if (!miss) return "המשוואה אינה כפולה נכונה.";
    if (typeof miss === "string") return miss;
    return miss.message || "המשוואה אינה כפולה נכונה.";
  }

  function checkPrepSystem(cur1, cur2, next1, next2, declared) {
    var cur = [cur1, cur2];
    var next = [next1, next2];
    var r0 = scaleRatio(cur1, next1);
    var r1 = scaleRatio(cur2, next2);
    if (r0.error) return { ok: false, id: "parse", message: r0.error };
    if (r1.error) return { ok: false, id: "parse", message: r1.error };
    var factors = factorList(declared);
    if (factors && (factors[0] != null || factors[1] != null)) {
      var i;
      for (i = 0; i < 2; i++) {
        var ratio = i === 0 ? r0 : r1;
        var expect = factors[i] == null ? 1 : factors[i];
        if (ratio && ratio.ratio != null && near(ratio.ratio, expect)) continue;
        if (factors[i] == null) {
          return {
            ok: false,
            id: "other_changed",
            message: "משוואה " + (i + 1) + " לא הוכפלה, ולכן יש להעתיק אותה כפי שהיא.",
          };
        }
        var miss = scaleMissMessage(cur[i], next[i], factors[i]);
        return {
          ok: false,
          id: miss && typeof miss === "object" ? miss.id : "scale",
          message: "במשוואה " + (i + 1) + ": " + missText(miss),
        };
      }
      return prepReady(cur1, cur2, next1, next2);
    }
    if (r0.ratio != null && r1.ratio != null && near(r0.ratio, 1) && near(r1.ratio, 1)) {
      return { ok: false, id: "same", message: "זו אותה מערכת. הכפילו משוואה אחת או את שתיהן כדי להתאים את המקדמים." };
    }
    if (r0.ratio == null || r1.ratio == null) {
      var badIndex = r0.ratio == null ? 0 : 1;
      var guess = guessPartial(cur[badIndex], next[badIndex]);
      if (guess) return { ok: false, id: guess.id, message: "במשוואה " + (badIndex + 1) + ": " + missText(guess) };
      return {
        ok: false,
        id: "not_scale",
        message: "משוואה " + (badIndex + 1) + " אינה כפולה של המשוואה הנוכחית. הכפל חל על כל האיברים ועל אגף ימין.",
      };
    }
    return prepReady(cur1, cur2, next1, next2);
  }

  function guessPartial(srcText, gotText) {
    var src;
    var got;
    try {
      src = abcOf(parseEquation(srcText));
      got = abcOf(parseEquation(gotText));
    } catch (err) {
      return null;
    }
    var keys = ["a", "b", "c"];
    var ratios = [];
    var i;
    for (i = 0; i < keys.length; i++) {
      if (near0(src[keys[i]]) && near0(got[keys[i]])) continue;
      if (near0(src[keys[i]])) continue;
      ratios.push(got[keys[i]] / src[keys[i]]);
    }
    if (ratios.length < 2) return null;
    var k = null;
    for (i = 0; i < ratios.length; i++) {
      var j;
      var count = 0;
      for (j = 0; j < ratios.length; j++) {
        if (near(ratios[i], ratios[j])) count += 1;
      }
      if (count >= 2 && isInt(ratios[i]) && Math.abs(Math.round(ratios[i])) >= 2) k = Math.round(ratios[i]);
    }
    if (k == null) return null;
    return scaleMissMessage(srcText, gotText, k);
  }

  function checkScaleChoice(eq1, eq2, index, k) {
    if (!isFinite(k) || Math.abs(Math.round(Number(k))) < 2 || (index !== 0 && index !== 1)) {
      return { ok: false, message: "בחרו כופל שלם, שונה מ־1, למשוואה אחת." };
    }
    try {
      scaleEquation(eq1 && index === 0 ? eq1 : eq2, k);
    } catch (err) {
      return { ok: false, message: err.message };
    }
    return { ok: true, index: index, k: k };
  }

  function efficiencyNote(cur1, cur2, next1, next2, op) {
    var key = op.cancel === "x" ? "a" : "b";
    var before1;
    var before2;
    var got;
    try {
      before1 = abcOf(parseEquation(cur1))[key];
      before2 = abcOf(parseEquation(cur2))[key];
      got = Math.abs(abcOf(parseEquation(next1))[key]);
    } catch (err) {
      return "";
    }
    var minimal = lcmInt(before1, before2);
    if (minimal > 0 && got > minimal + 1e-6) return "הצעד נכון. היה אפשר להשתמש בגורמים קטנים יותר.";
    return "";
  }

  function prepReady(cur1, cur2, next1, next2) {
    var op = bestElimOp(next1, next2);
    if (!op) {
      return {
        ok: false,
        id: "no_match",
        message: "הכופלים לא יוצרים מקדמים שווים או נגדיים. אפשר לאשר כפל רק כשמקדם של x או של y נעשה שווה או נגדי בשתי המשוואות.",
      };
    }
    var note = efficiencyNote(cur1, cur2, next1, next2, op);
    var out = {
      ok: true,
      kind: "system",
      ready: true,
      eq1: next1,
      eq2: next2,
      op: op,
      message: "עכשיו אפשר לחבר או לחסר כדי לבטל את " + op.cancel + ".",
    };
    if (note) out.note = note;
    return out;
  }

  function checkElimStep(eq1, eq2, typed) {
    var parsed;
    try {
      parsed = parseEquation(typed);
    } catch (err) {
      return { ok: false, id: "parse", message: err.message };
    }
    var originals = elimOps(eq1, eq2);
    var i;
    for (i = 0; i < originals.length; i++) {
      var op = originals[i];
      if (!op.cancel) continue;
      if (!equivalent(opEquation(op), parsed)) continue;
      var speech = elimSpeech(op);
      op.hint = speech.hint;
      op.reason = speech.reason;
      var ready = valueCheck(parsed, typed);
      if (ready && ready.kind === "value") {
        return {
          ok: true,
          kind: "value",
          v: ready.v,
          value: ready.value,
          op: op,
          cancel: op.cancel,
          message: ready.message,
        };
      }
      if (showsVar(typed, op.cancel)) {
        return {
          ok: true,
          kind: "written",
          op: op,
          cancel: op.cancel,
          message: "הפעולה נכונה. עכשיו כנסו איברים דומים.",
        };
      }
      var leftVar = near0(op.b) ? "x" : "y";
      return {
        ok: true,
        kind: "reduced",
        op: op,
        cancel: op.cancel,
        message: "קיבלתם משוואה בנעלם אחד. עכשיו בודדו את " + leftVar + ".",
      };
    }
    for (i = 0; i < originals.length; i++) {
      if (originals[i].cancel) continue;
      if (equivalent(opEquation(originals[i]), parsed)) return noCancelMessage();
    }
    var why = diagnoseElim(eq1, eq2, typed, null);
    if (why) return why;
    return {
      ok: false,
      id: "not_equivalent",
      message: "הצעד לא שקול לחיבור או לחיסור שמבטל משתנה. בדקו את הפעולה ואת הסימנים.",
    };
  }

  function parsePlainNumber(raw) {
    var s = String(raw || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (!s) return null;
    var m = s.match(/^([+-]?)(\d+)(?:\/(\d+))?$/);
    if (m) {
      var den = m[3] ? parseInt(m[3], 10) : 1;
      if (!den) return null;
      var v = parseInt(m[2], 10) / den;
      return m[1] === "-" ? -v : v;
    }
    if (/^[+-]?\d+\.\d+$/.test(s)) return parseFloat(s);
    return null;
  }

  function parseSolutionPairs(text) {
    var src = String(text || "")
      .replace(/[−–—]/g, "-")
      .trim();
    if (!src) return { ok: false, kind: "empty", pairs: [] };
    var pairs = [];
    var paren = src.match(/\([^)]*\)/g);
    if (paren && paren.length) {
      var i;
      for (i = 0; i < paren.length; i++) {
        var inner = paren[i].slice(1, -1).trim();
        var bits = inner.split(/[,;]/);
        if (bits.length < 2) bits = inner.split(/\s+/).filter(Boolean);
        if (bits.length !== 2) return { ok: false, kind: "bad", pairs: [] };
        var x = parsePlainNumber(bits[0]);
        var y = parsePlainNumber(bits[1]);
        if (x == null || y == null) return { ok: false, kind: "bad", pairs: [] };
        pairs.push({ x: x, y: y });
      }
      return { ok: true, pairs: pairs };
    }
    var chunks = src.split(/[;|]/);
    if (chunks.length === 1 && (src.match(/x\s*=/gi) || []).length > 1) {
      chunks = src.split(/(?=x\s*=)/i).filter(function (c) {
        return String(c || "").trim();
      });
    }
    var c;
    for (c = 0; c < chunks.length; c++) {
      var part = chunks[c];
      var xm = part.match(/x\s*=\s*([+-]?\d+(?:[./]\d+)?)/i);
      var ym = part.match(/y\s*=\s*([+-]?\d+(?:[./]\d+)?)/i);
      if (!xm || !ym) return { ok: false, kind: "bad", pairs: [] };
      var px = parsePlainNumber(xm[1]);
      var py = parsePlainNumber(ym[1]);
      if (px == null || py == null) return { ok: false, kind: "bad", pairs: [] };
      pairs.push({ x: px, y: py });
    }
    return { ok: true, pairs: pairs };
  }

  function pairNear(a, b) {
    return Math.abs(a - b) < 1e-6;
  }

  function sameOrdered(a, b) {
    return pairNear(a.x, b.x) && pairNear(a.y, b.y);
  }

  function swappedOrdered(a, b) {
    return pairNear(a.x, b.y) && pairNear(a.y, b.x) && !pairNear(b.x, b.y);
  }

  function formatPairs(pairs) {
    return (pairs || [])
      .map(function (p) {
        return "(" + fmt(p.x) + ", " + fmt(p.y) + ")";
      })
      .join(", ");
  }

  function checkOrderedPairs(text, expected) {
    var parsed = parseSolutionPairs(text);
    var exp = expected || [];
    if (!parsed.ok || !parsed.pairs.length) {
      return { ok: false, message: "רשמו את פתרון המערכת כזוג סדור, למשל (2, 3)." };
    }
    var got = parsed.pairs;
    if (got.length < exp.length) {
      return { ok: false, message: "מצאתם פתרון אחד, אך למערכת יש פתרון נוסף." };
    }
    if (got.length > exp.length) {
      return { ok: false, message: "יש כאן יותר זוגות משיש למערכת." };
    }
    var used = [];
    var gi;
    var ei;
    for (gi = 0; gi < got.length; gi++) {
      var hit = -1;
      for (ei = 0; ei < exp.length; ei++) {
        if (used[ei]) continue;
        if (sameOrdered(got[gi], exp[ei])) {
          hit = ei;
          break;
        }
      }
      if (hit >= 0) {
        used[hit] = "ok";
        continue;
      }
      for (ei = 0; ei < exp.length; ei++) {
        if (used[ei]) continue;
        if (swappedOrdered(got[gi], exp[ei])) {
          used[ei] = "swap";
          break;
        }
      }
    }
    var okN = 0;
    var swapN = 0;
    for (ei = 0; ei < exp.length; ei++) {
      if (used[ei] === "ok") okN += 1;
      if (used[ei] === "swap") swapN += 1;
    }
    if (okN === exp.length) {
      var note = "";
      if (String(text || "").indexOf("(") < 0) {
        note = "הפתרון נכון. אפשר לכתוב אותו בקיצור כ־" + formatPairs(exp) + ".";
      }
      return { ok: true, message: "נכון.", note: note };
    }
    if (swapN && okN + swapN === exp.length) {
      return { ok: false, message: "שימו לב שבזוג סדור הערך של x נכתב ראשון והערך של y שני." };
    }
    var distinct = [];
    got.forEach(function (g) {
      if (!distinct.some(function (d) { return sameOrdered(d, g); })) distinct.push(g);
    });
    if (
      distinct.length < exp.length &&
      distinct.every(function (g) {
        return exp.some(function (e) { return sameOrdered(e, g); });
      })
    ) {
      return { ok: false, message: "מצאתם פתרון אחד, אך למערכת יש פתרון נוסף." };
    }
    var bagG = [];
    var bagE = [];
    got.forEach(function (p) {
      bagG.push(p.x, p.y);
    });
    exp.forEach(function (p) {
      bagE.push(p.x, p.y);
    });
    bagG.sort(function (a, b) {
      return a - b;
    });
    bagE.sort(function (a, b) {
      return a - b;
    });
    var bagOk =
      bagG.length === bagE.length &&
      bagG.every(function (v, i) {
        return pairNear(v, bagE[i]);
      });
    if (bagOk) {
      return {
        ok: false,
        message: "מצאתם את הערכים הנכונים, אבל בדקו איזה ערך של y מתאים לכל ערך של x.",
      };
    }
    return { ok: false, message: "הזוג הסדור לא מתאים לפתרון המערכת." };
  }

  global.DoctematicaSystems = {
    parseEquation: parseEquation,
    equivalent: equivalent,
    isolationsOf: isolationsOf,
    readIsolation: readIsolation,
    checkWorkStep: checkWorkStep,
    checkSubstituted: checkSubstituted,
    substituteNumeric: substituteNumeric,
    solvePair: solvePair,
    adviceIsolate: adviceIsolate,
    adviceSubstitute: adviceSubstitute,
    adviceBack: adviceBack,
    bestIsolateChoice: bestIsolateChoice,
    bestReadySub: bestReadySub,
    bestBackChoice: bestBackChoice,
    bestElimOp: bestElimOp,
    formatElim: formatElim,
    formatReduced: formatReduced,
    checkElimStep: checkElimStep,
    diagnoseElim: diagnoseElim,
    showsVar: showsVar,
    bestPrep: bestPrep,
    scaleEquation: scaleEquation,
    checkPrepSystem: checkPrepSystem,
    checkScaleChoice: checkScaleChoice,
    equationStatus: equationStatus,
    numericDenomStep: numericDenomStep,
    lcdPack: lcdPack,
    denomMiss: denomMiss,
    lcdNote: lcdNote,
    writtenNeedsCombine: writtenNeedsCombine,
    findDistribute: findDistribute,
    fmt: fmt,
    parseSolutionPairs: parseSolutionPairs,
    checkOrderedPairs: checkOrderedPairs,
    formatPairs: formatPairs,
  };
})(window);
