"use strict";

var teachApi = require("./systems-teach");

function near(a, b) {
  return Math.abs(a - b) < 1e-6;
}

function keyEq(s) {
  return String(s || "")
    .replace(/[−–—]/g, "-")
    .replace(/x²/g, "x^2")
    .replace(/₁/g, "1")
    .replace(/₂/g, "2")
    .replace(/√/g, "sqrt")
    .replace(/\s+/g, "");
}

function yRhs(eq) {
  var s = String(eq || "")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
  var m = s.match(/^y=(.+)$/i);
  return m ? m[1] : null;
}

function hasSquare(s) {
  return /[xy]\s*\^\s*2|[xy]²/i.test(String(s || ""));
}

function swapXY(s) {
  return String(s || "")
    .replace(/x/gi, "\u0001")
    .replace(/y/gi, "x")
    .replace(/\u0001/g, "y");
}

function showText(st, s) {
  if (!st || st.solvedVar !== "y" || s == null) return s;
  return swapXY(s);
}

function engineOf(st, text) {
  return st && st.solvedVar === "y" ? swapXY(text) : String(text || "");
}

function eqWord(index) {
  return index === 0 ? "הראשונה" : "השנייה";
}

function safeAbc(Q, text) {
  try {
    return Q.parseABC(text);
  } catch (err) {
    return null;
  }
}

function varCoef(Sys, text, v) {
  try {
    var eq = Sys.parseEquation(text);
    return v === "x" ? eq.left.x - eq.right.x : eq.left.y - eq.right.y;
  } catch (err) {
    return null;
  }
}

function siteWant(Sys, linear, quad) {
  var q = String(quad || "").replace(/\s+/g, "");
  var prefer = /^x=/i.test(q) ? "x" : "y";
  var best = null;
  var advice = null;
  try {
    best = Sys.bestIsolateChoice(linear, linear);
    advice = Sys.adviceIsolate(linear, linear, 0, prefer);
  } catch (err) {
    best = null;
  }
  var v = advice && advice.tone === "ok" ? prefer : best && best.v ? best.v : prefer;
  var coef = varCoef(Sys, linear, v);
  var why = "זה הבידוד הנוח כאן.";
  if (coef != null && near(Math.abs(coef), 1)) {
    why = "נוח לבודד את " + v + " משום שהמקדם שלו הוא " + (coef < 0 ? "−1" : "1") + ".";
  } else if (best && best.v === v && best.why) {
    why = best.why;
  } else if (prefer === v) {
    why = "נוח לבודד את " + v + ", כי המשוואה הריבועית כבר מבטאת את " + v + ".";
  }
  return { v: v, why: why };
}

function sideExpr(text, v) {
  var s = String(text || "").replace(/\s+/g, "");
  var i = s.indexOf("=");
  if (i < 0) return "";
  var left = s.slice(0, i);
  var right = s.slice(i + 1);
  if (left === v) return right;
  if (right === v) return left;
  return "";
}

function needsWrap(expr) {
  var e = String(expr || "").replace(/\s+/g, "");
  if (!e) return false;
  if (/^[+−-]?\d+(?:\.\d+)?$/.test(e)) return false;
  if (/^[+−-]?\d+(?:\.\d+)?[xy]$/i.test(e)) return false;
  if (/^[xy]$/i.test(e)) return false;
  return true;
}

function substituteTokens(text, v, expr, wrap) {
  var e = String(expr || "").replace(/\s+/g, "");
  var use = wrap && needsWrap(e) ? "(" + e + ")" : e;
  var s = String(text || "").replace(/\s+/g, "").replace(/[−–—]/g, "-");
  var pow = new RegExp(v + "(\\^2|²)", "gi");
  s = s.replace(pow, use + "^2");
  var re = new RegExp("([+\\-]?)(\\d*\\.?\\d+)?" + v + "(?!\\^)", "gi");
  s = s.replace(re, function (full, sign, digits, offset, whole) {
    var coef = (digits ? parseFloat(digits) : 1) * (sign === "-" ? -1 : 1);
    var body = use;
    var bit;
    if (near(coef, 1)) bit = body;
    else if (near(coef, -1)) bit = "-" + body;
    else bit = (coef < 0 ? "-" : "") + String(Math.abs(coef)).replace(/\.0$/, "") + "·" + body;
    if (offset > 0 && bit.charAt(0) !== "-" && bit.charAt(0) !== "+") {
      var prev = whole.charAt(offset - 1);
      if (prev !== "=" && prev !== "(") bit = "+" + bit;
    }
    return bit;
  });
  return s;
}

function normMath(s) {
  return String(s || "")
    .replace(/[−–—]/g, "-")
    .replace(/[·×]/g, "*")
    .replace(/²/g, "^2")
    .replace(/\s+/g, "");
}

function parseExpr(input) {
  var s = normMath(input);
  var i = 0;
  function parseSum() {
    var node = parseTerm();
    while (i < s.length && (s.charAt(i) === "+" || s.charAt(i) === "-")) {
      var op = s.charAt(i);
      i += 1;
      node = { t: "sum", op: op, left: node, right: parseTerm() };
    }
    return node;
  }
  function parseTerm() {
    var node = parseUnary();
    while (i < s.length) {
      var c = s.charAt(i);
      if (c === "*") {
        i += 1;
        node = { t: "mul", left: node, right: parseUnary() };
        continue;
      }
      if (c === "(" || /[xy]/i.test(c)) {
        node = { t: "mul", left: node, right: parseUnary() };
        continue;
      }
      break;
    }
    return node;
  }
  function parseUnary() {
    if (s.charAt(i) === "+") {
      i += 1;
      return parseUnary();
    }
    if (s.charAt(i) === "-") {
      i += 1;
      return { t: "neg", inner: parseUnary() };
    }
    return parseDiv();
  }
  function parseDiv() {
    var node = parsePow();
    while (s.charAt(i) === "/") {
      i += 1;
      node = { t: "div", left: node, right: parsePow() };
    }
    return node;
  }
  function parsePow() {
    var base = parseAtom();
    if (s.charAt(i) === "^") {
      i += 1;
      var m = s.slice(i).match(/^\d+/);
      if (!m) throw new Error("חזקה לא תקינה");
      i += m[0].length;
      return { t: "pow", base: base, exp: parseInt(m[0], 10) };
    }
    return base;
  }
  function parseAtom() {
    var c = s.charAt(i);
    if (c === "(") {
      i += 1;
      var inner = parseSum();
      if (s.charAt(i) !== ")") throw new Error("חסר סוגר");
      i += 1;
      return { t: "paren", inner: inner };
    }
    if (/[xy]/i.test(c)) {
      i += 1;
      return { t: "var", v: c.toLowerCase() };
    }
    var num = s.slice(i).match(/^\d+(?:\.\d+)?/);
    if (num) {
      i += num[0].length;
      return { t: "num", v: parseFloat(num[0]) };
    }
    throw new Error("לא הצלחתי לקרוא את הביטוי");
  }
  if (!s) throw new Error("ביטוי ריק");
  var node = parseSum();
  if (i !== s.length) throw new Error("לא הצלחתי לקרוא את כל הביטוי");
  return node;
}

function cloneNode(n) {
  if (!n) return n;
  if (n.t === "num") return { t: "num", v: n.v };
  if (n.t === "var") return { t: "var", v: n.v };
  if (n.t === "neg") return { t: "neg", inner: cloneNode(n.inner) };
  if (n.t === "paren") return { t: "paren", inner: cloneNode(n.inner) };
  if (n.t === "pow") return { t: "pow", base: cloneNode(n.base), exp: n.exp };
  if (n.t === "mul") return { t: "mul", left: cloneNode(n.left), right: cloneNode(n.right) };
  if (n.t === "div") return { t: "div", left: cloneNode(n.left), right: cloneNode(n.right) };
  if (n.t === "sum") return { t: "sum", op: n.op, left: cloneNode(n.left), right: cloneNode(n.right) };
  return n;
}

function isCompound(n) {
  return n && (n.t === "sum" || n.t === "neg" || n.t === "mul" || n.t === "div");
}

function replaceVar(node, v, repl, parent, wrap) {
  if (!node) return node;
  if (node.t === "var" && node.v === v) {
    var copy = cloneNode(repl);
    if (wrap && isCompound(copy) && (parent === "pow" || parent === "mul" || parent === "neg" || parent === "sum" || parent === "div")) {
      return { t: "paren", inner: copy };
    }
    return copy;
  }
  if (node.t === "neg") return { t: "neg", inner: replaceVar(node.inner, v, repl, "neg", wrap) };
  if (node.t === "paren") return { t: "paren", inner: replaceVar(node.inner, v, repl, "paren", wrap) };
  if (node.t === "pow") return { t: "pow", base: replaceVar(node.base, v, repl, "pow", wrap), exp: node.exp };
  if (node.t === "div") {
    return {
      t: "div",
      left: replaceVar(node.left, v, repl, "div", wrap),
      right: replaceVar(node.right, v, repl, "div", wrap),
    };
  }
  if (node.t === "mul") {
    return {
      t: "mul",
      left: replaceVar(node.left, v, repl, "mul", wrap),
      right: replaceVar(node.right, v, repl, "mul", wrap),
    };
  }
  if (node.t === "sum") {
    return {
      t: "sum",
      op: node.op,
      left: replaceVar(node.left, v, repl, "sum", wrap),
      right: replaceVar(node.right, v, repl, "sum", wrap),
    };
  }
  return node;
}

function printExpr(n) {
  if (!n) return "";
  if (n.t === "num") {
    if (near(n.v, Math.round(n.v))) return String(Math.round(n.v));
    return String(n.v);
  }
  if (n.t === "var") return n.v;
  if (n.t === "paren") return "(" + printExpr(n.inner) + ")";
  if (n.t === "neg") {
    var inner = printExpr(n.inner);
    if (n.inner.t === "sum") return "-(" + inner + ")";
    return "-" + inner;
  }
  if (n.t === "pow") {
    var base = n.base.t === "paren" ? printExpr(n.base) : isCompound(n.base) ? "(" + printExpr(n.base) + ")" : printExpr(n.base);
    return base + "^" + n.exp;
  }
  if (n.t === "div") {
    var left = n.left.t === "paren" || n.left.t === "num" || n.left.t === "var" ? printExpr(n.left) : "(" + printExpr(n.left) + ")";
    var right = n.right.t === "num" || n.right.t === "var" ? printExpr(n.right) : "(" + printExpr(n.right) + ")";
    return left + "/" + right;
  }
  if (n.t === "mul") {
    var L = printExpr(n.left);
    var R = printExpr(n.right);
    if (n.left.t === "num" && (n.right.t === "var" || n.right.t === "pow" || n.right.t === "paren")) return L + R;
    if (n.left.t === "var" && (n.right.t === "var" || n.right.t === "paren" || n.right.t === "pow")) return L + R;
    if (n.left.t === "paren" && (n.right.t === "var" || n.right.t === "paren" || n.right.t === "pow")) return L + R;
    if (n.left.t === "neg" && n.left.inner.t === "num" && (n.right.t === "var" || n.right.t === "pow" || n.right.t === "paren")) {
      return printExpr(n.left) + R;
    }
    return L + "*" + R;
  }
  var right = printExpr(n.right);
  if (n.right.t === "neg") {
    right = printExpr(n.right.inner);
    return printExpr(n.left) + (n.op === "-" ? "+" : "-") + right;
  }
  return printExpr(n.left) + n.op + right;
}

function flattenTerms(n, sign) {
  if (n.t === "paren") return flattenTerms(n.inner, sign);
  if (n.t === "sum") {
    return flattenTerms(n.left, sign).concat(flattenTerms(n.right, n.op === "-" ? -sign : sign));
  }
  if (n.t === "neg") return flattenTerms(n.inner, -sign);
  return [{ sign: sign, node: n }];
}

function foldNode(n) {
  if (!n || n.t === "num" || n.t === "var") return n;
  if (n.t === "neg") return { t: "neg", inner: foldNode(n.inner) };
  if (n.t === "pow") return { t: "pow", base: foldNode(n.base), exp: n.exp };
  if (n.t === "mul") return { t: "mul", left: foldNode(n.left), right: foldNode(n.right) };
  if (n.t === "div") return { t: "div", left: foldNode(n.left), right: foldNode(n.right) };
  if (n.t === "sum") return foldNodeSum(n);
  if (n.t === "paren") {
    var inner = foldNode(n.inner);
    var terms = flattenTerms(inner, 1);
    var bits = [];
    var constant = 0;
    var sawConst = false;
    var consts = 0;
    var i;
    for (i = 0; i < terms.length; i++) {
      if (terms[i].node.t === "num") {
        constant += terms[i].sign * terms[i].node.v;
        sawConst = true;
        consts += 1;
      } else bits.push(terms[i]);
    }
    if (consts < 2) return { t: "paren", inner: inner };
    if (sawConst && !near(constant, 0)) bits.push({ sign: constant < 0 ? -1 : 1, node: { t: "num", v: Math.abs(constant) } });
    if (!bits.length) return { t: "num", v: 0 };
    var built = bits[0].sign < 0 ? { t: "neg", inner: bits[0].node } : bits[0].node;
    for (i = 1; i < bits.length; i++) {
      built = { t: "sum", op: bits[i].sign < 0 ? "-" : "+", left: built, right: bits[i].node };
    }
    if (built.t === "sum" || built.t === "neg") return { t: "paren", inner: built };
    return built;
  }
  return n;
}

function foldNodeSum(n) {
  return { t: "sum", op: n.op, left: foldNode(n.left), right: foldNode(n.right) };
}

function substEq(equation, v, expr, wrap) {
  var s = normMath(equation);
  var at = s.indexOf("=");
  if (at < 0) throw new Error("חסר סימן שווה");
  var repl = parseExpr(expr);
  var left = replaceVar(parseExpr(s.slice(0, at)), v, repl, "sum", wrap !== false);
  var right = replaceVar(parseExpr(s.slice(at + 1)), v, repl, "sum", wrap !== false);
  return printExpr(left) + "=" + printExpr(right);
}

function foldEq(equation) {
  var s = normMath(equation);
  var at = s.indexOf("=");
  if (at < 0) return s;
  var left = foldNode(parseExpr(s.slice(0, at)));
  var right = foldNode(parseExpr(s.slice(at + 1)));
  return printExpr(left) + "=" + printExpr(right);
}

function bareIsol(text) {
  var s = normMath(text);
  var m = s.match(/^([xy])=(.+)$/i);
  if (!m) return null;
  if (new RegExp(m[1], "i").test(m[2])) return null;
  return { v: m[1].toLowerCase(), expr: m[2] };
}

function isLinearSys(Sys, text) {
  if (/[\^²]/.test(String(text || ""))) return false;
  try {
    Sys.parseEquation(text);
    return true;
  } catch (err) {
    return false;
  }
}

function subEquation(quad, v, expr) {
  var s = String(quad || "").replace(/\s+/g, "").replace(/[−–—]/g, "-");
  var i = s.indexOf("=");
  var left = s.slice(0, i);
  var right = s.slice(i + 1);
  if (left === v) return right + "=" + String(expr || "").replace(/\s+/g, "");
  if (right === v) return left + "=" + String(expr || "").replace(/\s+/g, "");
  return substituteTokens(s, v, expr, true);
}

function hasLetter(text, v) {
  return new RegExp(v, "i").test(String(text || ""));
}

function isolatingToward(Sys, text) {
  var eq;
  try {
    eq = Sys.parseEquation(text);
  } catch (err) {
    return null;
  }
  function only(side, v) {
    var mine = v === "x" ? side.x : side.y;
    var other = v === "x" ? side.y : side.x;
    return Math.abs(mine) > 1e-8 && Math.abs(other) < 1e-8 && Math.abs(side.k) < 1e-8;
  }
  function has(side, v) {
    return Math.abs(v === "x" ? side.x : side.y) > 1e-8;
  }
  if ((only(eq.left, "y") && !has(eq.right, "y")) || (only(eq.right, "y") && !has(eq.left, "y"))) return "y";
  if ((only(eq.left, "x") && !has(eq.right, "x")) || (only(eq.right, "x") && !has(eq.left, "x"))) return "x";
  return null;
}

function armSubstitution(Q, st) {
  var expr = st.subExpr || sideExpr(st.isolText, st.isol.v);
  st.subExpr = expr;
  var target = st.eq[st.quadIndex];
  var left = normMath(target).split("=")[0];
  if (left === st.isol.v) st.equated = subEquation(target, st.isol.v, expr);
  else st.equated = substEq(target, st.isol.v, expr, true);
  st.engineEq = engineOf(st, st.equated);
  var folded = st.engineEq;
  try {
    folded = foldEq(st.engineEq);
  } catch (err) {
    folded = st.engineEq;
  }
  var start = folded !== st.engineEq ? folded : st.engineEq;
  st.pack = Q.analyzeMixedStart(start);
  if (folded !== st.engineEq) {
    st.pack.steps.unshift(st.engineEq);
    st.foldEngine = folded;
  } else st.foldEngine = "";
  st.quadAt = -1;
  st.phase = "equate";
}

function parenBare(st) {
  if (!st.subExpr || !needsWrap(st.subExpr)) return "";
  return substituteTokens(st.eq[st.quadIndex], st.isol.v, st.subExpr, false);
}

function sameEngine(Q, st, typed, other) {
  return sameAbc(safeAbc(Q, engineOf(st, typed)), safeAbc(Q, engineOf(st, other)));
}

function polyOf(Q, expr) {
  var p = Q.parseABC(String(expr || "") + "=0");
  if (!p) return null;
  return { a: p.a, b: p.b, c: p.c };
}

function sameAbc(p, q) {
  if (!p || !q) return false;
  var vals = [p.a, p.b, p.c];
  var oth = [q.a, q.b, q.c];
  var k = null;
  var i;
  for (i = 0; i < 3; i++) {
    if (Math.abs(oth[i]) > 1e-8) {
      k = vals[i] / oth[i];
      break;
    }
  }
  if (k == null) return vals.every(function (v) { return Math.abs(v) < 1e-8; });
  if (!isFinite(k) || Math.abs(k) < 1e-8) return false;
  return near(p.a, k * q.a) && near(p.b, k * q.b) && near(p.c, k * q.c);
}

function evalPoly(p, x) {
  return p.a * x * x + p.b * x + p.c;
}

function cost(p) {
  if (!p) return 1000;
  if (Math.abs(p.a) > 1e-8) return 100;
  if (Math.abs(p.b) > 1e-8) return 10;
  return 0;
}

function knownConstantY(polys) {
  if (!polys || polys.length < 2) return null;
  var c0 = polys[0] && Math.abs(polys[0].a) < 1e-8 && Math.abs(polys[0].b) < 1e-8;
  var c1 = polys[1] && Math.abs(polys[1].a) < 1e-8 && Math.abs(polys[1].b) < 1e-8;
  if (c0 && !c1) return { y: polys[0].c, index: 0 };
  if (c1 && !c0) return { y: polys[1].c, index: 1 };
  return null;
}

function sameRootSet(a, b) {
  if (!a || !b || a.none || b.none) return false;
  if (!a.roots.length || a.roots.length !== b.roots.length) return false;
  return a.roots.every(function (r) {
    return b.roots.some(function (s) {
      return near(r, s);
    });
  });
}

function rootsFromAnswer(ans) {
  var t = String(ans || "").replace(/[−–—]/g, "-");
  if (/אין פתרון/.test(t)) return { none: true, roots: [] };
  var pm = t.match(/±\s*([0-9./]+)/);
  if (pm) {
    var n = Number(pm[1]);
    if (!isFinite(n)) return { none: false, roots: [] };
    if (near(n, 0)) return { none: false, roots: [0] };
    return { none: false, roots: [n, -n] };
  }
  var roots = [];
  var re = /x\s*(?:1|2)?\s*=\s*([+-]?\d+(?:[./]\d+)?)/gi;
  var m;
  while ((m = re.exec(t))) {
    var v = m[1].indexOf("/") >= 0 ? (function (s) {
      var bits = s.split("/");
      var sign = 1;
      var num = bits[0];
      if (num.charAt(0) === "+") num = num.slice(1);
      if (num.charAt(0) === "-") {
        sign = -1;
        num = num.slice(1);
      }
      return sign * (parseInt(num, 10) / parseInt(bits[1], 10));
    })(m[1]) : Number(m[1]);
    if (!roots.some(function (r) { return near(r, v); })) roots.push(v);
  }
  return { none: false, roots: roots };
}

function fmtX(Sys, x) {
  return Sys.fmt(x);
}

function plugExpr(Sys, poly, x) {
  var raw = fmtX(Sys, x);
  var shown = x < 0 ? "(" + raw + ")" : raw;
  var parts = [];
  function push(coef, body) {
    if (Math.abs(coef) < 1e-8) return;
    var neg = coef < 0;
    var mag = Math.abs(coef);
    var bit = "";
    if (body) {
      if (near(mag, 1)) bit = body;
      else bit = fmtX(Sys, mag) + "·" + body;
    } else {
      bit = fmtX(Sys, mag);
    }
    if (!parts.length) parts.push((neg ? "−" : "") + bit);
    else parts.push((neg ? "−" : "+") + bit);
  }
  if (Math.abs(poly.a) > 1e-8) push(poly.a, "(" + raw + ")²");
  if (Math.abs(poly.b) > 1e-8) push(poly.b, shown);
  if (Math.abs(poly.c) > 1e-8 || !parts.length) push(poly.c || 0, "");
  return parts.join("");
}

function explainQuad(Q, current, nextEq, pack) {
  try {
    var n = Q.nextMixedStep(current, pack);
    if (n && n.eq && keyEq(n.eq) === keyEq(nextEq)) {
      return { hint: n.hint || Q.mixedHintFor(pack, current), reason: n.explain || n.hint || "" };
    }
    if (n && n.hint && !nextEq) return { hint: n.hint, reason: n.explain || n.hint };
  } catch (err) {
    /* formula lines are not equations */
  }
  var step = String(nextEq || "");
  if (/^a\s*=/.test(step)) {
    return { hint: "זהו a, b, c של ax²+bx+c=0.", reason: "זיהינו את המקדמים a, b, c." };
  }
  if (/sqrt|√|±/.test(step)) {
    return { hint: "המשיכו בנוסחת השורשים.", reason: "ממשיכים בנוסחת השורשים." };
  }
  if (/^[xy]\s*=/i.test(step) || /x1|x2|x₁|x₂/.test(step)) {
    return { hint: "חשבו את שורשי המשוואה.", reason: "מחשבים את ערכי x." };
  }
  try {
    return { hint: Q.mixedHintFor(pack, current), reason: "המשך פתרון המשוואה הריבועית." };
  } catch (err2) {
    return { hint: "המשיכו בפתרון המשוואה הריבועית.", reason: "המשך פתרון המשוואה הריבועית." };
  }
}

function freshPack(Q, text, fallback) {
  try {
    return Q.analyzeMixedStart(text);
  } catch (err) {
    return fallback;
  }
}

function readyChoice(Sys, eq1, eq2) {
  var eqs = [String(eq1 || ""), String(eq2 || "")];
  var i;
  for (i = 0; i < 2; i++) {
    var iso = bareIsol(eqs[i]);
    if (iso) return { index: i, iso: iso };
  }
  return null;
}

function readySubState(Q, Sys, eq1, eq2, ready) {
  var eqs = [String(eq1 || ""), String(eq2 || "")];
  var st = {
    eq: eqs,
    equated: "",
    engineEq: "",
    pack: { steps: [], answer: "" },
    quadAt: -1,
    phase: "equate",
    roots: [],
    branches: [],
    active: 0,
    easy: ready.index,
    polys: [null, null],
    doneKind: null,
    note: "",
    pending: null,
    linearIndex: ready.index,
    quadIndex: 1 - ready.index,
    wantVar: ready.iso.v,
    wantWhy: "",
    isolEq: eqs[ready.index],
    isol: { v: ready.iso.v, rhs: { x: 0, y: 0, k: 0 } },
    isolText: eqs[ready.index],
    subExpr: ready.iso.expr,
    solvedVar: ready.iso.v === "x" ? "y" : "x",
    usedReady: true,
  };
  armSubstitution(Q, st);
  return st;
}

function blankState(Q, Sys, eq1, eq2) {
  if (yRhs(eq1) && yRhs(eq2)) return level1State(Q, Sys, eq1, eq2);
  var ready = readyChoice(Sys, eq1, eq2);
  if (ready) return readySubState(Q, Sys, eq1, eq2, ready);
  return level2State(Q, Sys, eq1, eq2);
}

function level1State(Q, Sys, eq1, eq2) {
  var r1 = yRhs(eq1);
  var r2 = yRhs(eq2);
  var equated = r1 + "=" + r2;
  var pack = Q.analyzeMixedStart(equated);
  var polys = [polyOf(Q, r1), polyOf(Q, r2)];
  var easy = cost(polys[0]) <= cost(polys[1]) ? 0 : 1;
  return {
    eq: [String(eq1 || ""), String(eq2 || "")],
    equated: equated,
    pack: pack,
    quadAt: -1,
    phase: "equate",
    roots: [],
    branches: [],
    active: 0,
    easy: easy,
    polys: polys,
    knownY: knownConstantY(polys),
    doneKind: null,
    note: "",
    pending: null,
  };
}

function level2State(Q, Sys, eq1, eq2) {
  var eqs = [String(eq1 || ""), String(eq2 || "")];
  var lIndex = isLinearSys(Sys, eqs[0]) ? 0 : isLinearSys(Sys, eqs[1]) ? 1 : hasSquare(eqs[0]) && !hasSquare(eqs[1]) ? 1 : 0;
  var qIndex = lIndex === 0 ? 1 : 0;
  var want = siteWant(Sys, eqs[lIndex], eqs[qIndex]);
  var st = {
    eq: eqs,
    equated: "",
    engineEq: "",
    pack: { steps: [], answer: "" },
    quadAt: -1,
    phase: "isolate",
    roots: [],
    branches: [],
    active: 0,
    easy: lIndex,
    polys: [null, null],
    doneKind: null,
    note: "",
    pending: null,
    linearIndex: lIndex,
    quadIndex: qIndex,
    wantVar: want.v,
    wantWhy: want.why,
    isolEq: eqs[lIndex],
    isol: null,
    isolText: "",
    subExpr: "",
    solvedVar: "x",
  };
  try {
    var iso = Sys.readIsolation(Sys.parseEquation(eqs[lIndex]));
    if (iso) {
      st.isol = iso;
      st.isolText = eqs[lIndex];
      st.solvedVar = iso.v === "x" ? "y" : "x";
      armSubstitution(Q, st);
    }
  } catch (err) {
    /* the linear equation still needs isolation */
  }
  return st;
}

function openBranches(st) {
  var info = rootsFromAnswer(st.pack.answer);
  if (info.none || /אין פתרון/.test(String(st.pack.steps[st.quadAt] || ""))) {
    st.phase = "done";
    st.doneKind = "none";
    st.roots = [];
    st.branches = [];
    return;
  }
  st.roots = info.roots;
  st.branches = info.roots.map(function (val) {
    if (st.solvedVar === "y") return { x: null, y: val };
    return { x: val, y: null };
  });
  st.active = 0;
  if (st.knownY && st.solvedVar !== "y") {
    st.branches.forEach(function (b) {
      b.y = st.knownY.y;
    });
    st.phase = st.roots.length ? "final_pair" : "done";
    if (!st.roots.length) st.doneKind = "none";
    return;
  }
  st.phase = st.roots.length ? "back" : "done";
  if (!st.roots.length) st.doneKind = "none";
}

function quadFinished(st) {
  if (st.quadAt < 0) return false;
  var step = st.pack.steps[st.quadAt];
  if (st.quadAt === st.pack.steps.length - 1) return true;
  if (keyEq(step) === keyEq(st.pack.answer)) return true;
  if (/אין פתרון/.test(String(step || ""))) return true;
  return false;
}

function takeEquate(Q, st, typed) {
  var got = Q.parseABC(typed);
  var want = Q.parseABC(st.equated);
  if (!got || !sameAbc(got, want)) {
    return { ok: false, message: "השוו בין שני הביטויים של y כדי לקבל משוואה ב־x בלבד." };
  }
  var at = -1;
  var i;
  for (i = 0; i < st.pack.steps.length; i++) {
    if (keyEq(st.pack.steps[i]) === keyEq(typed)) at = i;
  }
  if (at < 0) {
    st.pack = freshPack(Q, typed, st.pack);
    st.quadAt = 0;
  } else {
    st.quadAt = at;
  }
  st.phase = "quad";
  if (quadFinished(st)) openBranches(st);
  var note = at > 0 ? "הצעד נכון. אפשר היה להראות את ההשוואה בין שני הביטויים של y לפני הסידור." : "";
  return { ok: true, note: note };
}

function takeQuad(Q, st, typed) {
  if (st.solvedVar === "y") typed = swapXY(typed);
  var steps = st.pack.steps;
  var n = keyEq(typed);
  var i;
  for (i = st.quadAt + 1; i < steps.length; i++) {
    if (keyEq(steps[i]) === n) {
      var skipped = i > st.quadAt + 1;
      st.quadAt = i;
      if (quadFinished(st)) openBranches(st);
      return {
        ok: true,
        note: skipped ? "הצעד נכון. אפשר היה להראות את שלבי הביניים של המשוואה הריבועית." : "",
      };
    }
  }
  var current = st.quadAt >= 0 ? steps[st.quadAt] : st.equated;
  var checked = null;
  try {
    checked = Q.checkMixedTyped(current, typed, st.pack);
  } catch (err) {
    checked = null;
  }
  if (checked && checked.ok && Q.parseABC(typed)) {
    st.pack = freshPack(Q, typed, st.pack);
    st.quadAt = 0;
    if (quadFinished(st)) openBranches(st);
    return { ok: true, message: checked.message || "", note: "" };
  }
  var info = rootsFromAnswer(st.pack.answer);
  var got = rootsFromAnswer(typed);
  if ((info.none && got.none) || sameRootSet(info, got)) {
    var onProduct = !!(current && Q.parseProductEq(current));
    st.quadAt = steps.length - 1;
    openBranches(st);
    return {
      ok: true,
      note: info.none || onProduct ? "" : "הצעד נכון. אפשר היה להראות את שלבי הנוסחה.",
    };
  }
  if (checked && !checked.ok && checked.message) {
    return { ok: false, message: showText(st, checked.message) };
  }
  if (!info.none && info.roots.length > 1 && got.roots.length === 1 && !got.none) {
    return { ok: false, message: "למשוואה הריבועית יש שני פתרונות. אל תמשיכו רק עם אחד מהם." };
  }
  return { ok: false, message: "הצעד לא מתאים להמשך פתרון המשוואה הריבועית." };
}

function takeIsolate(Q, Sys, st, typed) {
  var chk = Sys.checkWorkStep(st.isolEq, typed);
  if (!chk.ok) return { ok: false, message: chk.message };
  st.isolEq = String(typed).trim();
  if (chk.kind === "isolated" && chk.isolation) {
    st.isol = chk.isolation;
    st.isolText = st.isolEq;
    st.solvedVar = chk.isolation.v === "x" ? "y" : "x";
    var note = "";
    if (chk.isolation.v !== st.wantVar) {
      var chosenCoef = varCoef(Sys, st.eq[st.linearIndex], chk.isolation.v);
      var wantCoef = varCoef(Sys, st.eq[st.linearIndex], st.wantVar);
      if (wantCoef != null && near(Math.abs(wantCoef), 1) && chosenCoef != null && !near(Math.abs(chosenCoef), 1)) {
        note = "הצעד נכון. היה פשוט יותר לבודד את " + st.wantVar + " כדי להימנע משברים.";
      } else {
        note = "דרך חוקית. אפשר היה גם לבודד את " + st.wantVar + ".";
      }
    }
    try {
      armSubstitution(Q, st);
    } catch (err) {
      return {
        ok: false,
        message: "הבידוד חוקי, אבל אחרי ההצבה מתקבלת משוואה שהמנוע עדיין לא יודע לפתוח. נוח יותר לבודד את " + st.wantVar + ".",
      };
    }
    return { ok: true, note: note, message: chk.message || "" };
  }
  return { ok: true, message: chk.message || "צעד חוקי. המשיכו לבודד." };
}

function landQuad(Q, st, typed, eng) {
  var at = -1;
  var i;
  for (i = 0; i < st.pack.steps.length; i++) {
    if (keyEq(st.pack.steps[i]) === keyEq(eng)) at = i;
  }
  if (at < 0) {
    st.pack = freshPack(Q, eng, st.pack);
    st.quadAt = 0;
  } else {
    st.quadAt = at;
  }
  st.phase = "quad";
  if (quadFinished(st)) openBranches(st);
  var foldAt = -1;
  if (st.foldEngine) {
    for (i = 0; i < st.pack.steps.length; i++) {
      if (keyEq(st.pack.steps[i]) === keyEq(st.foldEngine)) foldAt = i;
    }
  }
  var note = "";
  if (foldAt >= 0 && at > foldAt) {
    note = "הצעד נכון. אפשר לפשט את הביטוי שבתוך הסוגריים לפני פתיחת הריבוע.";
  } else if (at > 0) {
    note = "הצעד נכון. אפשר היה להראות את ההצבה לפני הסידור.";
  } else if (at < 0) {
    note = "הצעד נכון. אפשר היה להראות את שלבי הביניים לפני המשוואה הזו.";
  }
  return { ok: true, note: note };
}

function polyOfEq(Q, text) {
  var direct = safeAbc(Q, text);
  if (direct) return direct;
  try {
    var pack = Q.analyzeMixedStart(text);
    if (pack && typeof pack.a === "number") return { a: pack.a, b: pack.b, c: pack.c };
  } catch (err) {
    return null;
  }
  return null;
}

function samePoly(Q, a, b) {
  if (keyEq(a) === keyEq(b)) return true;
  return sameAbc(polyOfEq(Q, a), polyOfEq(Q, b));
}

function badSquareForms(eq) {
  var s = normMath(eq);
  function swapPow(fn) {
    return s.replace(/\(([^()]+)\)\^2/g, function (_m, inner) {
      var m = inner.match(/^([^+-]+)([+-].+)$/);
      if (!m) return _m;
      return fn(m[1], m[2]);
    });
  }
  var ends = swapPow(function (a, rest) {
    var b = rest.replace(/^[+-]/, "");
    var n = Number(b);
    var b2 = b && isFinite(n) && String(n) === b ? String(n * n) : b + "^2";
    return a + "^2+" + b2;
  });
  var headOnly = swapPow(function (a, rest) {
    return a + "^2" + rest;
  });
  return [
    { eq: ends, message: "כל הביטוי צריך להיות בריבוע. ריבוע של סכום אינו סכום הריבועים." },
    { eq: headOnly, message: "כל הביטוי שמצאתם צריך להיות בריבוע, לא רק החלק הראשון שלו." },
  ];
}

function takeEquateIsol(Q, st, typed) {
  var face = String(typed || "");
  var eng = engineOf(st, face);
  if (keyEq(face) === keyEq(st.equated) || keyEq(eng) === keyEq(st.engineEq)) return landQuad(Q, st, face, eng);
  var bare = parenBare(st);
  var bareAst = "";
  try {
    bareAst = substEq(st.eq[st.quadIndex], st.isol.v, st.subExpr, false);
  } catch (err) {
    bareAst = "";
  }
  if (
    (bare && samePoly(Q, engineOf(st, face), engineOf(st, bare)) && !samePoly(Q, engineOf(st, face), st.engineEq)) ||
    (bareAst && keyEq(bareAst) !== keyEq(st.equated) && samePoly(Q, eng, engineOf(st, bareAst)) && !samePoly(Q, eng, st.engineEq))
  ) {
    return {
      ok: false,
      message: "שמרו על סוגריים. כשמציבים ביטוי עם חיבור או חיסור בתוך חזקה או מכפלה, סוגרים אותו בסוגריים.",
    };
  }
  var wrongs = badSquareForms(st.engineEq);
  var w;
  for (w = 0; w < wrongs.length; w++) {
    if (keyEq(wrongs[w].eq) !== keyEq(st.engineEq) && samePoly(Q, eng, wrongs[w].eq)) {
      return { ok: false, message: wrongs[w].message };
    }
  }
  if (hasLetter(face, st.isol.v) && hasLetter(face, st.solvedVar)) {
    return { ok: false, message: "ההצבה חלקית. החליפו כל מופע של " + st.isol.v + " בביטוי שבודדתם." };
  }
  if (hasLetter(face, st.isol.v) && !hasLetter(face, st.solvedVar)) {
    return { ok: false, message: "הציבו את הביטוי במשוואה הריבועית, לא במשוואה שכבר בודדתם." };
  }
  if (!samePoly(Q, eng, st.engineEq)) {
    if (!polyOfEq(Q, eng)) {
      return { ok: false, message: "אחרי ההצבה צריכה להתקבל משוואה בנעלם אחד, ליניארית או ריבועית." };
    }
    return { ok: false, message: "הציבו את הביטוי שמצאתם עבור " + st.isol.v + " במשוואה " + eqWord(st.quadIndex) + "." };
  }
  return landQuad(Q, st, face, eng);
}

function isolPoly(st) {
  var coef = st.solvedVar === "x" ? st.isol.rhs.x : st.isol.rhs.y;
  return { a: 0, b: coef, c: st.isol.rhs.k };
}

function solvedOf(st, b) {
  return st.solvedVar === "y" ? b.y : b.x;
}

function backFilled(st, b) {
  return st.isol.v === "y" ? b.y != null : b.x != null;
}

function exprAsPoly(Q, st) {
  if (!st.subExpr) return null;
  var e = st.solvedVar === "y" ? swapXY(st.subExpr) : st.subExpr;
  return polyOf(Q, e);
}

function backPoly(Q, st) {
  var fromExpr = exprAsPoly(Q, st);
  if (fromExpr) return fromExpr;
  if (st.isol && st.isol.rhs) return isolPoly(st);
  return { a: 0, b: 0, c: 0 };
}

function takeBackIsol(Q, Sys, st, typed) {
  var written = absorbWrittenPairs(Sys, st, typed);
  if (written) return written;
  var b = st.branches[st.active];
  if (!b) return { ok: false, message: "אין ענף פתוח." };
  var solved = solvedOf(st, b);
  var raw = String(typed || "")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
  var m = raw.match(new RegExp("^" + st.isol.v + "=(.+)$", "i"));
  if (!m) {
    return { ok: false, message: "רשמו את " + st.isol.v + " שמתקבל מהצבת " + st.solvedVar + " = " + fmtX(Sys, solved) + "." };
  }
  var rhs = m[1];
  var pieces = rhs.split("=");
  var tail = pieces[pieces.length - 1];
  var plainTail = /^[+-]?\d+(?:[./]\d+)?$/.test(tail);
  var others = [];
  var i;
  for (i = 0; i < st.branches.length; i++) {
    var other = solvedOf(st, st.branches[i]);
    if (i !== st.active && !near(other, solved)) others.push(other);
  }
  var hitOther = false;
  if (!plainTail) {
    for (i = 0; i < others.length; i++) {
      if (mentions(rhs, others[i]) && !mentions(rhs, solved)) hitOther = true;
    }
  }
  if (hitOther) {
    return { ok: false, message: "עכשיו מציבים את " + st.solvedVar + " = " + fmtX(Sys, solved) + ", לא את הערך השני." };
  }
  var val = evalArith(tail);
  var want = evalPoly(backPoly(Q, st), solved);
  if (val == null || !near(val, want)) {
    return { ok: false, message: "החישוב של " + st.isol.v + " עבור " + st.solvedVar + " = " + fmtX(Sys, solved) + " לא נכון." };
  }
  var plain = pieces.length === 1 && /^[+-]?\d+(?:[./]\d+)?$/.test(pieces[0]);
  var hard = /[²^]/.test(rhs) && !/[²^]/.test(st.subExpr || "");
  var note = hard ? "הפתרון נכון. למציאת " + st.isol.v + " אפשר להשתמש בבידוד שכבר מצאתם קודם." : "";
  if (!plain) {
    st.pending = want;
    return { ok: true, message: "ההצבה נכונה. עכשיו חשבו את הערך של " + st.isol.v + ".", note: note };
  }
  st.pending = null;
  if (st.isol.v === "y") b.y = want;
  else b.x = want;
  var next = -1;
  for (i = 0; i < st.branches.length; i++) {
    if (!backFilled(st, st.branches[i])) {
      next = i;
      break;
    }
  }
  if (next >= 0) {
    st.active = next;
    st.phase = "back";
  } else {
    st.phase = "final_pair";
  }
  return { ok: true, note: note, message: st.isol.v + " = " + fmtX(Sys, want) + "." };
}

function mentions(expr, x) {
  var nums = String(expr || "").match(/[−–—+-]?\d+(?:[./]\d+)?/g) || [];
  var i;
  for (i = 0; i < nums.length; i++) {
    var s = nums[i].replace(/[−–—]/g, "-");
    var v = s.indexOf("/") >= 0 ? (function (raw) {
      var sign = 1;
      var t = raw;
      if (t.charAt(0) === "+") t = t.slice(1);
      if (t.charAt(0) === "-") {
        sign = -1;
        t = t.slice(1);
      }
      var bits = t.split("/");
      return sign * (parseInt(bits[0], 10) / parseInt(bits[1], 10));
    })(s) : Number(s);
    if (near(v, x)) return true;
  }
  return false;
}

function evalArith(expr) {
  var s = String(expr || "")
    .replace(/[−–—]/g, "-")
    .replace(/[·×]/g, "*")
    .replace(/²/g, "**2")
    .replace(/\^/g, "**")
    .replace(/\s+/g, "")
    .replace(/-(\([^()]*\))(\*\*\d+)?/g, function (_m, base, exp) {
      return "-(" + base + (exp || "") + ")";
    });
  if (!s || !/^[0-9+\-*/().]+$/.test(s)) return null;
  try {
    var v = Function("return (" + s + ")")();
    return typeof v === "number" && isFinite(v) ? v : null;
  } catch (err) {
    return null;
  }
}

function takeBack(Q, Sys, st, typed) {
  if (st.isol) return takeBackIsol(Q, Sys, st, typed);
  var writtenBack = absorbWrittenPairs(Sys, st, typed);
  if (writtenBack) return writtenBack;
  var b = st.branches[st.active];
  if (!b) return { ok: false, message: "אין ענף פתוח." };
  var raw = String(typed || "")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
  var m = raw.match(/^y=(.+)$/i);
  if (!m) return { ok: false, message: "רשמו את y שמתקבל מהצבת x = " + fmtX(Sys, b.x) + "." };
  var rhs = m[1];
  var pieces = rhs.split("=");
  var tail = pieces[pieces.length - 1];
  var plainTail = /^[+-]?\d+(?:[./]\d+)?$/.test(tail);
  var others = [];
  var i;
  for (i = 0; i < st.branches.length; i++) {
    if (i !== st.active && !near(st.branches[i].x, b.x)) others.push(st.branches[i].x);
  }
  var hitOther = false;
  if (!plainTail) {
    for (i = 0; i < others.length; i++) {
      if (mentions(rhs, others[i]) && !mentions(rhs, b.x)) hitOther = true;
    }
  }
  if (hitOther) {
    return {
      ok: false,
      message: "עכשיו מציבים את x = " + fmtX(Sys, b.x) + ", לא את הערך השני.",
    };
  }
  var val = evalArith(tail);
  var want = evalPoly(st.polys[st.easy], b.x);
  if (val == null || !near(val, want)) {
    return { ok: false, message: "החישוב של y עבור x = " + fmtX(Sys, b.x) + " לא נכון." };
  }
  var plain = pieces.length === 1 && /^[+-]?\d+(?:[./]\d+)?$/.test(pieces[0]);
  var hard = Math.abs(st.polys[1 - st.easy].a) > 1e-8 && /[²^]/.test(rhs);
  var note = hard
    ? "הצעד נכון. למציאת y יהיה פשוט יותר להשתמש במשוואה " + st.eq[st.easy] + "."
    : "";
  if (!plain) {
    st.pending = want;
    return { ok: true, message: "ההצבה נכונה. עכשיו חשבו את הערך של y.", note: note };
  }
  st.pending = null;
  b.y = want;
  var next = -1;
  for (i = 0; i < st.branches.length; i++) {
    if (st.branches[i].y == null) {
      next = i;
      break;
    }
  }
  if (next >= 0) {
    st.active = next;
    st.phase = "back";
  } else {
    st.phase = "final_pair";
  }
  return { ok: true, note: note, message: "y = " + fmtX(Sys, want) + "." };
}

function expectedPairs(st) {
  return st.branches.map(function (b) {
    return { x: b.x, y: b.y };
  });
}

function pairReady(b) {
  return !!(b && b.x != null && b.y != null);
}

function sameWritten(a, b) {
  return near(a.x, b.x) && near(a.y, b.y);
}

function swappedWritten(a, b) {
  return near(a.x, b.y) && near(a.y, b.x) && !near(b.x, b.y);
}

function recordedList(st) {
  if (!st.recorded) st.recorded = [];
  return st.recorded;
}

function rememberPairs(st, pairs) {
  var list = recordedList(st);
  pairs.forEach(function (p) {
    if (!list.some(function (r) { return sameWritten(r, p); })) list.push({ x: p.x, y: p.y });
  });
}

function missingPairs(st) {
  var have = recordedList(st);
  return expectedPairs(st).filter(function (e) {
    return pairReady(e) && !have.some(function (r) { return sameWritten(r, e); });
  });
}

function allBranchesReady(st) {
  return st.branches.length > 0 && st.branches.every(pairReady);
}

function uniquePairs(pairs) {
  var out = [];
  pairs.forEach(function (p) {
    if (!out.some(function (q) { return sameWritten(q, p); })) out.push(p);
  });
  return out;
}

function absorbWrittenPairs(Sys, st, typed) {
  var parsed = Sys.parseSolutionPairs(typed);
  if (!parsed.ok || !parsed.pairs.length) return null;
  var known = expectedPairs(st).filter(pairReady);
  if (!known.length) return null;
  var got = uniquePairs(parsed.pairs);
  var good = [];
  var swap = false;
  var bad = false;
  got.forEach(function (g) {
    if (known.some(function (e) { return sameWritten(g, e); })) good.push(g);
    else if (known.some(function (e) { return swappedWritten(g, e); })) swap = true;
    else bad = true;
  });
  if (swap && !bad && !good.length) {
    return { ok: false, message: "שימו לב שבזוג סדור הערך של x נכתב ראשון והערך של y שני." };
  }
  if (bad || swap) {
    if (got.length === expectedPairs(st).length && allBranchesReady(st)) {
      var full = Sys.checkOrderedPairs(typed, expectedPairs(st));
      if (!full.ok) return full;
    }
    return { ok: false, message: "הזוג הסדור לא מתאים לפתרון המערכת." };
  }
  var coversAll =
    allBranchesReady(st) &&
    expectedPairs(st).every(function (e) {
      return good.some(function (g) { return sameWritten(g, e); });
    });
  if (coversAll) return null;
  rememberPairs(st, good);
  var missing = missingPairs(st);
  if (!missing.length && allBranchesReady(st)) {
    st.phase = "done";
    st.doneKind = st.branches.length > 1 ? "pairs" : "unique";
    return { ok: true, message: "נכון.", note: "" };
  }
  var wrote = Sys.formatPairs(recordedList(st));
  if (!allBranchesReady(st)) {
    return {
      ok: true,
      message: "הזוג " + wrote + " נרשם. המשיכו למצוא את הנעלם שעדיין חסר.",
      note: "",
    };
  }
  return {
    ok: true,
    message: "הזוג " + wrote + " נרשם. עכשיו רשמו את " + Sys.formatPairs(missing) + ".",
    note: "",
  };
}

function takePair(Sys, st, typed) {
  if (st.knownY) {
    var raw = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var knownLine = raw.match(/^y=(.+)$/i);
    if (knownLine) {
      var gotY = evalArith(knownLine[1].split("=").pop());
      if (gotY != null && near(gotY, st.knownY.y)) {
        return {
          ok: true,
          note: "y = " + fmtX(Sys, st.knownY.y) + " כבר ידוע מהמשוואה " + eqWord(st.knownY.index) + ". רשמו את הזוגות הסדורים.",
          message: "y כבר ידוע.",
        };
      }
    }
  }
  var written = absorbWrittenPairs(Sys, st, typed);
  if (written) return written;
  var chk = Sys.checkOrderedPairs(typed, expectedPairs(st));
  if (!chk.ok) return chk;
  rememberPairs(st, expectedPairs(st));
  st.phase = "done";
  st.doneKind = st.branches.length > 1 ? "pairs" : "unique";
  return chk;
}

function adoptLinearWork(Q, Sys, st, typed, chk) {
  var alreadyVar = st.isol && st.isol.v;
  var alreadyIndex = st.linearIndex;
  var target = st.quadIndex;
  st.linearIndex = target;
  st.quadIndex = alreadyIndex;
  st.usedReady = false;
  st.isolEq = String(typed).trim();
  if (chk.kind === "isolated" && chk.isolation) {
    st.isol = chk.isolation;
    st.isolText = st.isolEq;
    st.subExpr = sideExpr(st.isolText, chk.isolation.v);
    st.solvedVar = chk.isolation.v === "x" ? "y" : "x";
    var want = siteWant(Sys, st.eq[st.linearIndex], st.eq[st.quadIndex]);
    st.wantVar = want.v;
    st.wantWhy = want.why;
    try {
      armSubstitution(Q, st);
    } catch (err) {
      return {
        ok: false,
        message: "הבידוד חוקי, אבל אחרי ההצבה מתקבלת משוואה שהמנוע עדיין לא יודע לפתוח.",
      };
    }
    return {
      ok: true,
      note:
        "דרך חוקית. " +
        alreadyVar +
        " כבר מבודד במשוואה " +
        eqWord(alreadyIndex) +
        ", ואפשר היה להציב אותו.",
      message: chk.message || "",
    };
  }
  st.isol = null;
  st.isolText = "";
  st.subExpr = "";
  st.phase = "isolate";
  var mid = siteWant(Sys, st.eq[st.linearIndex], st.eq[st.quadIndex]);
  st.wantVar = mid.v;
  st.wantWhy = mid.why;
  return { ok: true, message: chk.message || "צעד חוקי. המשיכו לבודד." };
}

function tryOtherIsolation(Q, Sys, st, typed) {
  if (/[\^²]/.test(String(typed || ""))) return null;
  if (!isLinearSys(Sys, st.eq[st.quadIndex])) return null;
  var chk;
  try {
    chk = Sys.checkWorkStep(st.eq[st.quadIndex], typed);
  } catch (err) {
    return null;
  }
  if (!chk) return null;
  if (!chk.ok) {
    try {
      Sys.parseEquation(typed);
    } catch (err2) {
      return null;
    }
    return { ok: false, message: chk.message };
  }
  return adoptLinearWork(Q, Sys, st, typed, chk);
}

function applyLine(Q, Sys, st, typed) {
  if (st.phase === "isolate") return takeIsolate(Q, Sys, st, typed);
  if (st.phase === "equate" && st.isol && st.usedReady) {
    var sub = takeEquateIsol(Q, st, typed);
    if (sub.ok) return sub;
    var alt = tryOtherIsolation(Q, Sys, st, typed);
    if (alt) return alt;
    return sub;
  }
  if (st.phase === "equate" && st.isol) return takeEquateIsol(Q, st, typed);
  if (st.phase === "equate") return takeEquate(Q, st, typed);
  if (st.phase === "quad") return takeQuad(Q, st, typed);
  if (st.phase === "back") return takeBack(Q, Sys, st, typed);
  if (st.phase === "final_pair") return takePair(Sys, st, typed);
  return { ok: false, message: "התרגיל כבר פתור." };
}

function loadState(Q, Sys, eq1, eq2, history) {
  var st = blankState(Q, Sys, eq1, eq2);
  var hist = Array.isArray(history) ? history : [];
  var i;
  var last = { ok: true };
  for (i = 0; i < hist.length; i++) {
    if (st.phase === "done") break;
    last = applyLine(Q, Sys, st, hist[i]);
    if (!last.ok) return { ok: false, message: last.message, st: st };
  }
  st.note = last.note || "";
  st.lastMessage = last.message || "";
  return { ok: true, st: st };
}

function hintFor(Q, Sys, A, st) {
  if (st.phase === "done" && st.doneKind === "none") return "אין פתרון ממשי למשוואה, ולכן גם למערכת אין פתרון ממשי.";
  if (st.phase === "done") return "התרגיל כבר פתור.";
  if (st.phase === "isolate") {
    if (keyEq(st.isolEq) === keyEq(st.eq[st.linearIndex])) {
      return "כדי להשתמש בשיטת ההצבה, בודדו משתנה במשוואה " + eqWord(st.linearIndex) + ". " + st.wantWhy;
    }
    var goal = isolatingToward(Sys, st.isolEq) || st.wantVar;
    var alg = teachApi.nextAlgebra(Sys, A, st.isolEq, { mode: "isolate", v: goal });
    if (alg && alg.hint) return alg.hint;
    return "המשיכו לבודד את " + goal + ".";
  }
  if (st.phase === "equate" && st.isol) {
    if (st.usedReady) {
      var target = normMath(st.eq[st.quadIndex]);
      var bareSquare = new RegExp(st.isol.v + "(\\^2|²)").test(target);
      var parenSquare = new RegExp("\\([^()]*" + st.isol.v + "[^()]*\\)\\^2").test(target);
      var readyHint =
        st.isol.v +
        " כבר מבודד במשוואה " +
        eqWord(st.linearIndex) +
        ". הציבו את הביטוי שלו במשוואה " +
        eqWord(st.quadIndex) +
        ".";
      if (bareSquare) {
        readyHint +=
          " בהצבה במקום " +
          st.isol.v +
          "², זכרו שכל הביטוי שמצאתם עבור " +
          st.isol.v +
          " נמצא בריבוע.";
      } else if (parenSquare) {
        readyHint += " המשתנה נמצא בתוך סוגריים בריבוע, אז מציבים את כל הביטוי בתוך הסוגריים.";
      }
      return readyHint;
    }
    return "כעת הציבו את הביטוי שמצאתם עבור " + st.isol.v + " במשוואה הריבועית.";
  }
  if (st.phase === "equate") {
    if (st.knownY) {
      return (
        "y כבר ידוע מהמשוואה " +
        eqWord(st.knownY.index) +
        ": y = " +
        fmtX(Sys, st.knownY.y) +
        ". בכל זוג סדור של המערכת זה הערך של y. נשאר להשוות בין הביטויים כדי למצוא את x."
      );
    }
    return "שתי המשוואות מבטאות את y. הציבו/השוו ביניהן כדי לקבל משוואה ב־x בלבד.";
  }
  if (st.phase === "quad") {
    var current = st.quadAt >= 0 ? st.pack.steps[st.quadAt] : st.engineEq || st.equated;
    var nxt = st.quadAt + 1 < st.pack.steps.length ? st.pack.steps[st.quadAt + 1] : "";
    if (st.foldEngine && nxt && keyEq(nxt) === keyEq(st.foldEngine)) {
      return "כעת פשטו את הביטוי שנוצר. אפשר לפשט את הביטוי שבתוך הסוגריים לפני פתיחת הריבוע.";
    }
    var quadHint = showText(st, explainQuad(Q, current, nxt, st.pack).hint);
    if (st.isol && st.quadAt === 0 && /[\^²()]/.test(String(current || ""))) {
      return "כעת פשטו את הביטוי שנוצר. " + quadHint;
    }
    return quadHint;
  }
  if (st.phase === "back" && st.isol) {
    if (st.pending != null) return "ההצבה נכונה. חשבו את הערך של " + st.isol.v + ".";
    var filled = st.branches.filter(function (br) { return backFilled(st, br); }).length;
    var cur = st.branches[st.active];
    var known = solvedOf(st, cur);
    if (!filled && st.branches.length > 1) {
      return "מצאתם " + st.branches.length + " ערכים אפשריים של " + st.solvedVar + ". הציבו כל אחד מהם בביטוי שמצאתם עבור " + st.isol.v + ".";
    }
    if (filled && st.branches.length > 1) {
      var savedI = recordedList(st);
      if (savedI.length) {
        return "הזוג " + Sys.formatPairs(savedI) + " נרשם. כעת מצאו את " + st.isol.v + " המתאים לערך השני של " + st.solvedVar + ".";
      }
      return "מצאתם פתרון אחד. כעת מצאו את " + st.isol.v + " המתאים לערך השני של " + st.solvedVar + ".";
    }
    return "מצאתם את " + st.solvedVar + " = " + fmtX(Sys, known) + ". הציבו אותו בביטוי שמצאתם עבור " + st.isol.v + ".";
  }
  if (st.phase === "back") {
    var done = st.branches.filter(function (b) { return b.y != null; }).length;
    var b = st.branches[st.active];
    if (!done && st.branches.length > 1) {
      return "מצאתם " + st.branches.length + " ערכים אפשריים של x. כעת מצאו את y המתאים לכל אחד מהם. התחילו מ־x = " + fmtX(Sys, b.x) + ".";
    }
    if (done && st.branches.length > 1) {
      var saved = recordedList(st);
      if (saved.length) {
        return "הזוג " + Sys.formatPairs(saved) + " נרשם. כעת הציבו את x = " + fmtX(Sys, b.x) + ".";
      }
      return "מצאתם את הזוג הראשון. כעת הציבו את x = " + fmtX(Sys, b.x) + ".";
    }
    return "מצאתם את x. הציבו אותו כדי למצוא את y.";
  }
  var savedPairs = recordedList(st);
  var still = missingPairs(st);
  if (savedPairs.length && still.length) {
    return "רשמתם את " + Sys.formatPairs(savedPairs) + ". עכשיו רשמו את " + Sys.formatPairs(still) + ".";
  }
  if (st.knownY) {
    return (
      "y = " +
      fmtX(Sys, st.knownY.y) +
      " כבר ידוע מהמשוואה " +
      eqWord(st.knownY.index) +
      ", בכל הפתרונות. רשמו את פתרונות המערכת כזוגות סדורים (x,y)."
    );
  }
  if (st.isol) return "רשמו את פתרונות המערכת כזוגות סדורים (x,y).";
  return "מצאתם את כל הערכים. רשמו את פתרונות המערכת כזוגות סדורים.";
}

function plugIsolExpr(expr, solvedVar, value, Sys) {
  var raw = fmtX(Sys, value);
  var shown = value < 0 ? "(" + raw + ")" : raw;
  return substituteTokens(expr, solvedVar, shown, false);
}

function nextLine(Q, Sys, A, st) {
  if (st.phase === "isolate") {
    var goal = isolatingToward(Sys, st.isolEq) || st.wantVar;
    var alg = teachApi.nextAlgebra(Sys, A, st.isolEq, { mode: "isolate", v: goal });
    if (!alg || alg.error || !alg.eq) return null;
    var finishes = null;
    try {
      finishes = Sys.readIsolation(Sys.parseEquation(alg.eq));
    } catch (err) {
      finishes = null;
    }
    var reason = alg.reason || "";
    if (finishes) {
      reason = "בידדנו את " + finishes.v + " במשוואה " + eqWord(st.linearIndex) + " כדי שנוכל להשתמש בשיטת ההצבה.";
    }
    return { eq: alg.eq, reason: reason, hint: alg.hint || hintFor(Q, Sys, A, st) };
  }
  if (st.phase === "equate" && st.isol) {
    return {
      eq: st.equated,
      reason: "הצבנו את הביטוי " + st.subExpr + " במקום " + st.isol.v + " במשוואה " + eqWord(st.quadIndex) + ".",
      hint: hintFor(Q, Sys, A, st),
    };
  }
  if (st.phase === "equate") {
    return {
      eq: st.equated,
      reason: "הצבנו את הביטוי של y מהמשוואה השנייה במשוואה הראשונה.",
      hint: hintFor(Q, Sys, A, st),
    };
  }
  if (st.phase === "quad") {
    var current = st.quadAt >= 0 ? st.pack.steps[st.quadAt] : st.engineEq || st.equated;
    var eq = st.pack.steps[st.quadAt + 1];
    if (st.foldEngine && keyEq(eq) === keyEq(st.foldEngine)) {
      return {
        eq: showText(st, eq),
        reason: "פישטנו את הביטוי שבתוך הסוגריים לפני פתיחת הריבוע.",
        hint: hintFor(Q, Sys, A, st),
      };
    }
    var why = explainQuad(Q, current, eq, st.pack);
    return { eq: showText(st, eq), reason: showText(st, why.reason), hint: showText(st, why.hint) };
  }
  if (st.phase === "back" && st.isol) {
    var br = st.branches[st.active];
    var solved = solvedOf(st, br);
    var polyI = backPoly(Q, st);
    var backVal = evalPoly(polyI, solved);
    var letter = st.isol.v;
    if (st.pending != null && near(st.pending, backVal)) {
      return {
        eq: letter + "=" + fmtX(Sys, backVal),
        reason: "חישבנו וקיבלנו " + letter + " = " + fmtX(Sys, backVal) + ".",
        hint: hintFor(Q, Sys, A, st),
      };
    }
    var plugged = fmtX(Sys, backVal);
    if (st.subExpr && !/[\^²]/.test(st.subExpr)) plugged = plugIsolExpr(st.subExpr, st.solvedVar, solved, Sys);
    else if (st.subExpr) plugged = plugExpr(Sys, polyI, solved);
    var shownI = letter + "=" + plugged;
    if (keyEq(shownI) === keyEq(letter + "=" + fmtX(Sys, backVal))) {
      return {
        eq: letter + "=" + fmtX(Sys, backVal),
        reason: "בביטוי שבודדתם מתקבל " + letter + " = " + fmtX(Sys, backVal) + ".",
        hint: hintFor(Q, Sys, A, st),
      };
    }
    return {
      eq: shownI,
      reason: "הציבו " + st.solvedVar + " = " + fmtX(Sys, solved) + " בביטוי שמצאתם עבור " + letter + ".",
      hint: hintFor(Q, Sys, A, st),
    };
  }
  if (st.phase === "back") {
    var b = st.branches[st.active];
    var poly = st.polys[st.easy];
    var y = evalPoly(poly, b.x);
    if (st.pending != null && near(st.pending, y)) {
      return {
        eq: "y=" + fmtX(Sys, y),
        reason: "חישבנו וקיבלנו y = " + fmtX(Sys, y) + ".",
        hint: hintFor(Q, Sys, A, st),
      };
    }
    var shown = "y=" + plugExpr(Sys, poly, b.x);
    if (keyEq(shown) === keyEq("y=" + fmtX(Sys, y)) || (Math.abs(poly.a) < 1e-8 && Math.abs(poly.b) < 1e-8)) {
      return {
        eq: "y=" + fmtX(Sys, y),
        reason: "במשוואה " + st.eq[st.easy] + " מתקבל y = " + fmtX(Sys, y) + ".",
        hint: hintFor(Q, Sys, A, st),
      };
    }
    return {
      eq: shown,
      reason: "הציבו x = " + fmtX(Sys, b.x) + " במשוואה " + st.eq[st.easy] + ".",
      hint: hintFor(Q, Sys, A, st),
      follow: "y=" + fmtX(Sys, y),
    };
  }
  if (st.phase === "final_pair") {
    var pairReason = "רשמו את פתרונות המערכת כזוגות סדורים.";
    if (st.knownY) {
      pairReason =
        "y = " +
        fmtX(Sys, st.knownY.y) +
        " כבר ידוע מהמשוואה " +
        eqWord(st.knownY.index) +
        ", בכל הפתרונות. רשמו את הזוגות הסדורים.";
    }
    return {
      eq: Sys.formatPairs(expectedPairs(st)),
      reason: pairReason,
      hint: hintFor(Q, Sys, A, st),
    };
  }
  return null;
}

function viewOf(Q, Sys, A, st, extra) {
  extra = extra || {};
  var answer = "";
  if (st.phase === "done" && st.doneKind === "none") answer = "אין פתרון ממשי";
  if (st.phase === "done" && st.branches.length) answer = Sys.formatPairs(expectedPairs(st));
  var prompt = hintFor(Q, Sys, A, st);
  var offer = formulaOffer(Q, st);
  var split = splitOffer(Q, st);
  return {
    ok: extra.ok !== false,
    phase: st.phase,
    prompt: prompt,
    input: st.phase !== "done",
    buttons: [],
    known: {},
    roots: st.roots || [],
    branches: (st.branches || []).map(function (b) {
      return { x: b.x, y: b.y };
    }),
    solved: st.phase === "done",
    kind: st.doneKind,
    answer: answer,
    message: extra.message != null ? String(extra.message) : st.lastMessage || "",
    note: extra.note != null ? extra.note : st.note || "",
    offerFormula: !!offer,
    formulaEq: offer ? offer.eq : "",
    formulaLetter: offer ? offer.letter : "x",
    offerSplit: !!split,
    splitStart: split ? split.start : "",
    splitEq: split ? split.eq : "",
    splitLetter: split ? split.letter : "x",
  };
}

function formulaOffer(Q, st) {
  if (!st || st.phase !== "quad") return null;
  var engine = st.quadAt >= 0 ? st.pack.steps[st.quadAt] : st.engineEq || st.equated;
  if (!engine || !Q.isAbcOrder(engine)) return null;
  var parsed = Q.parseABC(engine);
  if (!parsed || !parsed.a) return null;
  return { eq: engine, letter: st.solvedVar === "y" ? "y" : "x" };
}

function splitOffer(Q, st) {
  if (!st || st.phase !== "quad") return null;
  var engine = st.quadAt >= 0 ? st.pack.steps[st.quadAt] : st.engineEq || st.equated;
  if (!engine || !Q.parseProductEq(engine)) return null;
  var steps = (st.pack && st.pack.steps) || [];
  var start = "";
  var i;
  for (i = 0; i < steps.length; i++) {
    if (Q.isAbcOrder(steps[i]) && Q.parseABC(steps[i])) start = steps[i];
    if (keyEq(steps[i]) === keyEq(engine)) break;
  }
  if (!start) return null;
  return { start: start, eq: engine, letter: st.solvedVar === "y" ? "y" : "x" };
}

function createQuadSystemsHandler(engine) {
  var Q = engine.DoctematicaQuadratic;
  var Sys = engine.DoctematicaSystems;
  var A = engine.DoctematicaAlgebra;

  function handle(body) {
    body = body || {};
    if (String(body.topic || "") !== "systems-quad") {
      return { error: "unknown topic", message: "unknown topic" };
    }
    var intent = String(body.intent || "");
    var eq1 = String(body.eq1 || "");
    var eq2 = String(body.eq2 || "");
    var hist = Array.isArray(body.history) ? body.history.map(String) : [];
    if (intent === "solution") {
      var steps = [];
      var guard = 0;
      var walk = hist.slice();
      var last = null;
      while (guard < 80) {
        guard += 1;
        var remote = handle({ intent: "one-step", eq1: eq1, eq2: eq2, history: walk, topic: "systems-quad" });
        if (!remote || remote.ok === false) return remote || { ok: false, message: "הפתרון נעצר." };
        if (remote.done && !remote.step) break;
        if (!remote.step) break;
        steps.push({ eq: remote.step, reason: remote.reason || "" });
        walk.push(remote.step);
        last = remote;
        if (remote.solved) break;
      }
      return {
        ok: true,
        steps: steps,
        answer: (last && last.answer) || "",
        solved: !!(last && last.solved),
        kind: last && last.kind,
      };
    }
    var loaded = loadState(Q, Sys, eq1, eq2, hist);
    if (!loaded.ok && intent !== "check") return { ok: false, message: loaded.message };
    if (intent === "setup") return viewOf(Q, Sys, A, loaded.st);
    if (intent === "hint") {
      if (!loaded.ok) return { ok: false, message: loaded.message };
      return { ok: true, done: loaded.st.phase === "done", hint: hintFor(Q, Sys, A, loaded.st), phase: loaded.st.phase };
    }
    if (intent === "one-step") {
      if (!loaded.ok) return { ok: false, message: loaded.message };
      if (loaded.st.phase === "done") {
        var doneView = viewOf(Q, Sys, A, loaded.st, { message: "התרגיל כבר פתור." });
        doneView.done = true;
        return doneView;
      }
      var action = nextLine(Q, Sys, A, loaded.st);
      if (!action || !action.eq) return { ok: false, message: "אין צעד המשך." };
      var after = loadState(Q, Sys, eq1, eq2, hist.concat([action.eq]));
      if (!after.ok) return { ok: false, message: after.message, eq: action.eq };
      var view = viewOf(Q, Sys, A, after.st, { message: action.reason });
      view.step = action.eq;
      view.reason = action.reason || "";
      view.hint = action.hint || "";
      view.done = false;
      return view;
    }
    if (intent === "check") {
      var base = loaded.ok ? loaded.st : blankState(Q, Sys, eq1, eq2);
      if (!loaded.ok) return { ok: false, message: loaded.message };
      var typed = String((body && body.typed) || "").trim();
      if (!typed) return { ok: false, message: "כתבו את הצעד הבא." };
      var trial = loadState(Q, Sys, eq1, eq2, hist.concat([typed]));
      if (!trial.ok) return { ok: false, message: trial.message, phase: base.phase };
      var out = viewOf(Q, Sys, A, trial.st, { message: trial.st.lastMessage || "צעד חוקי.", note: trial.st.note || "" });
      out.ok = true;
      return out;
    }
    return { error: "unknown intent", message: "unknown intent" };
  }

  return { handle: handle };
}

module.exports = {
  createQuadSystemsHandler: createQuadSystemsHandler,
};
