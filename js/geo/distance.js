(function (global) {
  function install(dep) {
    var gcdInt = dep.gcdInt;
    var fmtNum = dep.fmtNum;
    var formatLo = dep.formatLo;
    var getPoint = dep.getPoint;
    var near0 = dep.near0;
    var nearNum = dep.nearNum;
    var fmtFrac = dep.fmtFrac;
    var segmentPairName = dep.segmentPairName;
    var preferPartTasks = dep.preferPartTasks;
    var cloneMaps = dep.cloneMaps;
    var remainingRequired = dep.remainingRequired;
    var taskMatchesTag = dep.taskMatchesTag;
    var currentPartText = dep.currentPartText;
    var markOptionalDone = dep.markOptionalDone;

  function radMake(n, d, k) {
    n = Math.round(Number(n) || 0);
    d = Math.round(Number(d) || 1);
    k = Math.round(Number(k) || 1);
    if (!d) return null;
    if (k < 0) return null;
    if (k === 0 || n === 0) return { n: 0, d: 1, k: 1 };
    if (d < 0) {
      n = -n;
      d = -d;
    }
    var sq = 1;
    var r = k;
    var i;
    for (i = 2; i * i <= r; i++) {
      while (r % (i * i) === 0) {
        r /= i * i;
        sq *= i;
      }
    }
    n *= sq;
    var g = gcdInt(n, d);
    n /= g;
    d /= g;
    return { n: n, d: d, k: r };
  }

  function radSqrtFrac(n, d) {
    n = Math.round(Number(n) || 0);
    d = Math.round(Number(d) || 1);
    if (d < 0) {
      n = -n;
      d = -d;
    }
    if (n < 0 || d <= 0) return null;
    return radMake(1, d, n * d);
  }

  function radEq(a, b) {
    if (!a || !b) return false;
    var A = radMake(a.n, a.d, a.k);
    var B = radMake(b.n, b.d, b.k);
    return !!(A && B && A.n === B.n && A.d === B.d && A.k === B.k);
  }

  function radToFloat(r) {
    if (!r) return null;
    return (r.n / r.d) * Math.sqrt(r.k);
  }

  function fmtRad(r) {
    if (!r) return "";
    var c = radMake(r.n, r.d, r.k);
    if (!c) return "";
    if (c.k === 1) {
      if (c.d === 1) return fmtNum(c.n);
      return fmtFrac(c.n, c.d);
    }
    var tail = "√" + fmtNum(c.k);
    if (c.d !== 1) return fmtFrac(c.n, c.d) + tail;
    if (c.n === 1) return tail;
    if (c.n === -1) return "−" + tail;
    return fmtNum(c.n) + tail;
  }

  function distExactFromPoints(a, b) {
    if (!a || !b) return null;
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    function asFrac(v) {
      if (nearNum(v, Math.round(v))) return { n: Math.round(v), d: 1 };
      var den;
      for (den = 2; den <= 24; den++) {
        var num = Math.round(v * den);
        if (nearNum(num / den, v)) return { n: num, d: den };
      }
      return { n: Math.round(v * 1000), d: 1000 };
    }
    var fx = asFrac(dx);
    var fy = asFrac(dy);
    var n = fx.n * fx.n * fy.d * fy.d + fy.n * fy.n * fx.d * fx.d;
    var den = fx.d * fx.d * fy.d * fy.d;
    return radSqrtFrac(n, den);
  }

  function distSegName(task) {
    return String(task.label || segmentPairName(task.from, task.to) || "AB").replace(/→/g, "");
  }

  function distLhs(task, typed) {
    var s = String(typed || "").replace(/\s+/g, "");
    var m = s.match(/^d_?([A-Za-z]{0,4})(?:=|:)/i);
    if (m) return m[1] ? "d" + m[1].toUpperCase() : "d";
    var seg = s.match(/^([A-Za-z]{2})(?:=|:)/);
    if (seg) return seg[1].toUpperCase();
    var name = distSegName(task);
    if (name && /^[A-Za-z]{2}$/.test(name)) return "d" + name;
    return "d";
  }

  function distSubPts(task, pack) {
    var map = pack && pack.map;
    var p1 = getPoint(map, task.subFrom || task.from);
    var p2 = getPoint(map, task.subTo || task.to);
    return { p1: p1, p2: p2 };
  }

  function distWantRad(task, pack) {
    if (task && task.exact) return radMake(task.exact.n, task.exact.d, task.exact.k);
    var a = getPoint(pack && pack.map, task.from);
    var b = getPoint(pack && pack.map, task.to);
    return distExactFromPoints(a, b);
  }

  function distEqualShow(task) {
    var segs = (task && task.segs) || [];
    if (segs.length >= 2) return String(segs[0]).toUpperCase() + "=" + String(segs[1]).toUpperCase();
    return "AB=BC";
  }

  function fmtDistMinus(a, b) {
    return fmtNum(a) + "−" + formatLo(b);
  }

  function fmtDistSqTerm(n) {
    if (n < 0) return "(" + fmtNum(n) + ")²";
    return fmtNum(n) + "²";
  }

  function canonicalDistanceSteps(task, pack) {
    if (!task || task.kind !== "distance") return [];
    var sub = distSubPts(task, pack);
    var p1 = sub.p1;
    var p2 = sub.p2;
    if (!p1 || !p2) return [];
    var lhs = distLhs(task);
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    var out = [
      lhs + "=√((" + fmtDistMinus(p1.x, p2.x) + ")²+(" + fmtDistMinus(p1.y, p2.y) + ")²)",
    ];
    var xNeg = p2.x < 0 && !near0(p2.x);
    var yNeg = p2.y < 0 && !near0(p2.y);
    if (xNeg || yNeg) {
      var xSimp = xNeg ? fmtNum(p1.x) + "+" + fmtNum(-p2.x) : fmtDistMinus(p1.x, p2.x);
      var ySimp = yNeg ? fmtNum(p1.y) + "+" + fmtNum(-p2.y) : fmtDistMinus(p1.y, p2.y);
      out.push(lhs + "=√((" + xSimp + ")²+(" + ySimp + ")²)");
    }
    out.push(lhs + "=√(" + fmtDistSqTerm(dx) + "+" + fmtDistSqTerm(dy) + ")");
    var sx = dx * dx;
    var sy = dy * dy;
    out.push(lhs + "=√(" + fmtNum(sx) + "+" + fmtNum(sy) + ")");
    var sum = sx + sy;
    out.push(lhs + "=√" + fmtNum(sum));
    var want = distWantRad(task, pack);
    var boxed = fmtRad(want);
    var last = lhs + "=" + boxed;
    if (out[out.length - 1] !== last) out.push(last);
    return out;
  }

  function rat(n, d) {
    d = d == null ? 1 : d;
    if (!d) return null;
    if (d < 0) {
      n = -n;
      d = -d;
    }
    var g = gcdInt(Math.round(n), Math.round(d));
    return { n: Math.round(n) / g, d: Math.round(d) / g };
  }

  function ratAdd(a, b) {
    return a && b ? rat(a.n * b.d + b.n * a.d, a.d * b.d) : null;
  }

  function ratSub(a, b) {
    return a && b ? rat(a.n * b.d - b.n * a.d, a.d * b.d) : null;
  }

  function ratMul(a, b) {
    return a && b ? rat(a.n * b.n, a.d * b.d) : null;
  }

  function ratDiv(a, b) {
    return a && b && b.n ? rat(a.n * b.d, a.d * b.n) : null;
  }

  function ratPow2(a) {
    return a ? rat(a.n * a.n, a.d * a.d) : null;
  }

  function ratVal(a) {
    return a ? a.n / a.d : null;
  }

  function tokenizeDist(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/[·×]/g, "*")
      .replace(/²/g, "^2")
      .replace(/\s+/g, "");
    var toks = [];
    var i = 0;
    while (i < t.length) {
      var c = t.charAt(i);
      if (c === "√") {
        toks.push({ t: "sqrt" });
        i += 1;
        continue;
      }
      if ("+-*/^()".indexOf(c) >= 0) {
        toks.push({ t: c });
        i += 1;
        continue;
      }
      if ((c >= "0" && c <= "9") || c === ".") {
        var m = t.slice(i).match(/^\d+(\.\d+)?/);
        if (!m) return null;
        var raw = m[0];
        var v;
        if (raw.indexOf(".") >= 0) {
          var places = raw.split(".")[1].length;
          var den = Math.pow(10, places);
          v = rat(Math.round(parseFloat(raw, 10) * den), den);
        } else {
          v = rat(parseInt(raw, 10), 1);
        }
        toks.push({ t: "num", v: v });
        i += raw.length;
        continue;
      }
      return null;
    }
    var out = [];
    for (i = 0; i < toks.length; i++) {
      var prev = out[out.length - 1];
      var cur = toks[i];
      if (prev && (prev.t === "num" || prev.t === ")") && (cur.t === "sqrt" || cur.t === "(")) {
        out.push({ t: "*" });
      }
      out.push(cur);
    }
    return out;
  }

  function termsOf(v) {
    if (!v) return null;
    if (v.kind === "rat") return [{ k: 1, n: v.r.n, d: v.r.d }];
    if (v.kind === "rad") return [{ k: v.r.k, n: v.r.n, d: v.r.d }];
    if (v.kind === "sum") return (v.terms || []).slice();
    return null;
  }
  function addTermLists(a, b, sign) {
    var out = (a || []).slice();
    var i;
    var j;
    for (i = 0; i < (b || []).length; i++) {
      var t = { k: b[i].k, n: sign * b[i].n, d: b[i].d };
      var merged = false;
      for (j = 0; j < out.length; j++) {
        if (out[j].k === t.k) {
          var s = ratAdd(rat(out[j].n, out[j].d), rat(t.n, t.d));
          out[j] = { k: t.k, n: s.n, d: s.d };
          merged = true;
          break;
        }
      }
      if (!merged) out.push(t);
    }
    return out.filter(function (t) {
      return t && t.n;
    });
  }
  function fromTermList(terms) {
    if (!terms || !terms.length) return { kind: "rat", r: rat(0, 1) };
    if (terms.length === 1) {
      if (terms[0].k === 1) return { kind: "rat", r: rat(terms[0].n, terms[0].d) };
      return { kind: "rad", r: radMake(terms[0].n, terms[0].d, terms[0].k) };
    }
    return { kind: "sum", terms: terms };
  }

  function parseDistTokens(tokens) {
    if (!tokens) return null;
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
    var lastAdd = null;
    function wrapSqrt(inner) {
      if (!inner) return null;
      if (inner.kind === "rat") {
        var rr = radSqrtFrac(inner.r.n, inner.r.d);
        return rr ? { kind: "rad", r: rr, innerRat: inner.r } : null;
      }
      return null;
    }
    function parsePrimary() {
      if (peek() && peek().t === "num") return { kind: "rat", r: eat().v };
      if (peek() && peek().t === "sqrt") {
        eat("sqrt");
        var inner;
        if (peek() && peek().t === "(") {
          eat("(");
          inner = parseAdd();
          if (!eat(")")) return null;
        } else {
          inner = parseUnary();
        }
        return wrapSqrt(inner);
      }
      if (peek() && peek().t === "(") {
        eat("(");
        var innerP = parseAdd();
        if (!eat(")")) return null;
        return innerP;
      }
      return null;
    }
    function parsePow() {
      var base = parsePrimary();
      if (peek() && peek().t === "^") {
        eat("^");
        var expTok = eat("num");
        if (!base || !expTok || Math.round(ratVal(expTok.v)) !== 2) return null;
        if (base.kind !== "rat") return null;
        return { kind: "rat", r: ratPow2(base.r) };
      }
      return base;
    }
    function parseUnary() {
      if (peek() && peek().t === "-") {
        eat("-");
        var u = parseUnary();
        if (!u || u.kind !== "rat") return null;
        return { kind: "rat", r: rat(-u.r.n, u.r.d) };
      }
      if (peek() && peek().t === "+") {
        eat("+");
        return parseUnary();
      }
      return parsePow();
    }
    function parseMul() {
      var left = parseUnary();
      while (peek() && (peek().t === "*" || peek().t === "/")) {
        var op = eat().t;
        var right = parseUnary();
        if (!left || !right) return null;
        if (op === "/" && left.kind === "rat" && right.kind === "rat") {
          left = { kind: "rat", r: ratDiv(left.r, right.r) };
        } else if (op === "*" && left.kind === "rat" && right.kind === "rat") {
          left = { kind: "rat", r: ratMul(left.r, right.r) };
        } else if (op === "*" && left.kind === "rat" && right.kind === "rad") {
          left = {
            kind: "rad",
            r: radMake(left.r.n * right.r.n, left.r.d * right.r.d, right.r.k),
          };
        } else if (op === "*" && left.kind === "rad" && right.kind === "rat") {
          left = {
            kind: "rad",
            r: radMake(left.r.n * right.r.n, left.r.d * right.r.d, left.r.k),
          };
        } else {
          return null;
        }
      }
      return left;
    }
    function parseAdd() {
      var left = parseMul();
      while (peek() && (peek().t === "+" || peek().t === "-")) {
        var op = eat().t;
        var right = parseMul();
        if (!left || !right) return null;
        var lt = termsOf(left);
        var rt = termsOf(right);
        if (!lt || !rt) return null;
        left = fromTermList(addTermLists(lt, rt, op === "+" ? 1 : -1));
      }
      lastAdd = left;
      return left;
    }
    var parsed = parseAdd();
    if (!parsed || i !== tokens.length) return null;
    return parsed;
  }

  function parseTwoSquares(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/²/g, "^2")
      .replace(/\s+/g, "");
    t = t.replace(/^√/, "");
    if (t.charAt(0) === "(" && t.charAt(t.length - 1) === ")") {
      var inner = t.slice(1, -1);
      var depth = 0;
      var ok = true;
      var k;
      for (k = 0; k < inner.length; k++) {
        if (inner.charAt(k) === "(") depth += 1;
        if (inner.charAt(k) === ")") depth -= 1;
        if (depth < 0) ok = false;
      }
      if (ok && depth === 0) t = inner;
    }
    var plusAt = -1;
    var d = 0;
    var i;
    for (i = 0; i < t.length; i++) {
      var ch = t.charAt(i);
      if (ch === "(") d += 1;
      else if (ch === ")") d -= 1;
      else if (ch === "+" && d === 0) {
        plusAt = i;
        break;
      }
    }
    if (plusAt < 0) return null;
    function baseOfSq(expr) {
      var u = String(expr);
      var m = u.match(/^(?:\((.*)\)|(.+))\^2$/);
      if (!m) return null;
      var body = m[1] != null ? m[1] : m[2];
      var p = parseDistTokens(tokenizeDist(body));
      if (!p || p.kind !== "rat") return null;
      return p.r;
    }
    var A = baseOfSq(t.slice(0, plusAt));
    var B = baseOfSq(t.slice(plusAt + 1));
    if (!A || !B) return null;
    return { x: ratVal(A), y: ratVal(B), xr: A, yr: B };
  }

  function prettyDistExpr(s) {
    return String(s || "")
      .replace(/-/g, "−")
      .replace(/\*/g, "·")
      .replace(/\^2/g, "²");
  }

  function parseDistExpr(typed) {
    var s = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    s = s.replace(/^[=:]+/, "");
    var lhs = s.match(/^(?:d_?([A-Za-z]{0,4})|([A-Za-z]{2}))(?:=|:)(.*)$/i);
    var rhs = s;
    var tag = null;
    if (lhs) {
      tag = (lhs[1] || lhs[2] || "").toUpperCase();
      if (tag === "D") tag = "";
      rhs = lhs[3];
    }
    if (/x\s*[₁₂12]|x_[12]|y_[12]|y\s*[₁₂12]|x2-x1|x_2-x_1/i.test(rhs)) {
      return { tag: tag, formula: true, rhs: rhs };
    }
    var squares = parseTwoSquares(rhs);
    var parsed = parseDistTokens(tokenizeDist(rhs));
    var rad = null;
    var sum = null;
    if (parsed && parsed.kind === "rad") rad = parsed.r;
    else if (parsed && parsed.kind === "rat") rad = radMake(parsed.r.n, parsed.r.d, 1);
    else if (parsed && parsed.kind === "sum") sum = parsed;
    if (squares && !rad) {
      var sx = squares.xr.n * squares.xr.n * squares.yr.d * squares.yr.d;
      var sy = squares.yr.n * squares.yr.n * squares.xr.d * squares.xr.d;
      var den = squares.xr.d * squares.xr.d * squares.yr.d * squares.yr.d;
      rad = radSqrtFrac(sx + sy, den);
    }
    return {
      tag: tag || null,
      rhs: rhs,
      rad: rad,
      sum: sum,
      squares: squares,
      hasSqrt: /√/.test(rhs),
      innerSum: /√/.test(rhs) && /\+/.test(rhs),
      pretty: prettyDistExpr(rhs),
    };
  }

  function distDecimalApprox(s, want) {
    if (!want || want.k === 1) return false;
    var t = String(s || "").replace(/[−–—]/g, "-").replace(/\s+/g, "");
    t = t.replace(/^(?:d_?[A-Za-z]{0,4}|[A-Za-z]{2})(?:=|:)/i, "");
    if (!/^\d+\.\d{2,}$/.test(t)) return false;
    var v = parseFloat(t, 10);
    return isFinite(v) && nearNum(v, radToFloat(want));
  }

  function distFormSimplified(got, want) {
    if (!got || !got.rad || !want) return false;
    if (!radEq(got.rad, want)) return false;
    if (got.squares) return false;
    if (got.innerSum) return false;
    if (got.hasSqrt && want.k === 1) return false;
    if (got.hasSqrt && want.k > 1) {
      var c = radMake(got.rad.n, got.rad.d, got.rad.k);
      var inner = String(got.rhs || "").replace(/^√/, "").replace(/^\(|\)$/g, "");
      if (/[+\-()]/.test(inner) && !/^[-−]?\d+$/.test(inner)) return false;
      if (/^\d+$/.test(inner) && Number(inner) !== want.k) return false;
      if (!c || c.k !== want.k || c.n !== want.n) return false;
    }
    return true;
  }

  function diagnoseDistSquares(squares, a, b) {
    if (!squares || !a || !b) return null;
    var gx = squares.x;
    var gy = squares.y;
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    if ((nearNum(gx, dx) && nearNum(gy, dy)) || (nearNum(gx, -dx) && nearNum(gy, -dy))) {
      return { kind: "ok" };
    }
    if ((nearNum(gx, dx) && nearNum(gy, -dy)) || (nearNum(gx, -dx) && nearNum(gy, dy))) {
      return { kind: "mixed" };
    }
    var xOk = nearNum(gx, dx) || nearNum(gx, -dx);
    var yOk = nearNum(gy, dy) || nearNum(gy, -dy);
    if (xOk && !yOk) return { kind: "y" };
    if (yOk && !xOk) return { kind: "x" };
    return { kind: "multi" };
  }

  function distStageFromExpr(prev, task, pack) {
    var got = parseDistExpr(prev || "");
    if (!got || (!got.rad && !got.formula && !got.squares)) return "start";
    if (got.formula && !got.rad) return "formula";
    var want = distWantRad(task, pack);
    if (got.squares) {
      var rhs = String(got.rhs || "");
      if (/\([^)]*[+\-][^)]*\)\^2/.test(rhs.replace(/√/g, "").replace(/²/g, "^2"))) return "subst";
      if (/\^2|²/.test(rhs)) return "diffs";
    }
    if (got.rad && want && radEq(got.rad, want)) {
      if (!distFormSimplified(got, want)) {
        if (got.hasSqrt && want.k === 1) return "sqrt";
        if (got.hasSqrt && want.k > 1) return "simplify";
        return "squares";
      }
      return "done";
    }
    if (got.hasSqrt) return "formula";
    return "start";
  }

  function distanceHintMessage(task, pack, progress) {
    var name = distSegName(task);
    var prev = (progress.lastExpr && progress.lastExpr[task.id]) || "";
    var stage = distStageFromExpr(prev, task, pack);
    var a = getPoint(pack.map, task.from);
    var b = getPoint(pack.map, task.to);
    var pa = String(task.from || "A").toUpperCase();
    var pb = String(task.to || "B").toUpperCase();
    if (stage === "sqrt" || stage === "simplify") return "פשטו את השורש (מדויק, בלי עשרוני).";
    if (stage === "squares") return "חשבו את הריבועים, חברו, ואז את השורש.";
    if (stage === "diffs") return "ריבוע לכל הפרש, חברו, ואז פשטו את השורש.";
    if (stage === "subst") {
      return "חשבו את ההפרשים בסוגריים (אותו סדר נקודות בשני השיעורים), ואז ריבוע וחיבור.";
    }
    if (stage === "formula") {
      return (
        "הציבו: הפרש ה-x של " +
        pa +
        " ו־" +
        pb +
        " באגף אחד והפרש ה-y בשני. אותו סדר נקודות בשני ההפרשים."
      );
    }
    return (
      "זהו את השיעורים של " +
      (a ? pa + "(" + fmtNum(a.x) + ";" + fmtNum(a.y) + ")" : pa) +
      " ו־" +
      (b ? pb + "(" + fmtNum(b.x) + ";" + fmtNum(b.y) + ")" : pb) +
      ". נוסחת המרחק: d = √((x₂ − x₁)² + (y₂ − y₁)²). אפשר d או d" +
      name +
      "."
    );
  }

  function normDistStep(s) {
    var t = String(s || "")
      .replace(/\s+/g, "")
      .replace(/[−–—]/g, "-")
      .replace(/²/g, "^2")
      .replace(/^d_/i, "d");
    var eq = t.search(/[=:]/);
    if (eq >= 0) t = t.slice(eq + 1);
    return t.toLowerCase();
  }

  function distCanonicalIndex(prev, steps) {
    var p = normDistStep(prev);
    if (!p) return -1;
    var i;
    var best = -1;
    for (i = 0; i < steps.length; i++) {
      if (normDistStep(steps[i]) === p) best = i;
    }
    return best;
  }

  function nextDistanceStep(task, pack, progress) {
    var steps = canonicalDistanceSteps(task, pack);
    if (!steps.length) return distLhs(task) + "=" + fmtRad(distWantRad(task, pack));
    var prev = (progress.lastExpr && progress.lastExpr[task.id]) || "";
    var idx = distCanonicalIndex(prev, steps);
    if (idx < 0) return steps[0];
    if (idx + 1 < steps.length) return steps[idx + 1];
    return steps[steps.length - 1];
  }

  function looksLikeEqualLen(typed, task) {
    var s = String(typed || "").replace(/\s+/g, "").replace(/[−–—]/g, "-");
    if (/^(כן|yes)$/i.test(s)) return true;
    var segs = (task && task.segs) || [];
    if (segs.length < 2) return /[A-Za-z]{2}=[A-Za-z]{2}/.test(s);
    var a = String(segs[0]).toUpperCase();
    var b = String(segs[1]).toUpperCase();
    var names = [a, a.charAt(1) + a.charAt(0)];
    var names2 = [b, b.charAt(1) + b.charAt(0)];
    var i;
    var j;
    for (i = 0; i < names.length; i++) {
      for (j = 0; j < names2.length; j++) {
        if (s === names[i] + "=" + names2[j] || s === names2[j] + "=" + names[i]) return true;
        if (
          s === "d" + names[i] + "=d" + names2[j] ||
          s === "d_" + names[i] + "=d_" + names2[j] ||
          s === "d" + names2[j] + "=d" + names[i] ||
          s === "d_" + names2[j] + "=d_" + names[i]
        ) {
          return true;
        }
      }
    }
    return false;
  }

  function checkDistance(typed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var hits = preferPartTasks(
      (pending || []).filter(function (t) {
        return t.kind === "distance";
      }),
      pack,
      progress
    );
    if (!hits.length) return null;
    var s = String(typed || "").replace(/\s+/g, "");
    if (!s) return null;
    var got = parseDistExpr(typed);
    if (got && got.sum && got.sum.terms && got.sum.terms.length > 1) return null;
    var eqLen = (pending || []).filter(function (t) {
      return t.kind === "equalLen";
    })[0];
    if (eqLen && looksLikeEqualLen(typed, eqLen)) return null;
    var looksDist =
      /^d/i.test(s) ||
      /√/.test(s) ||
      !!(got.tag && hits.some(function (t) { return taskMatchesTag(t, got.tag); })) ||
      !!(got.rad && (got.hasSqrt || (got.rad.k > 1)));
    if (!got.formula && !got.rad && !got.squares && !got.hasSqrt && !looksDist) return null;
    if (got.tag) {
      var named = hits.filter(function (t) {
        return taskMatchesTag(t, got.tag);
      });
      if (named.length) hits = named;
    }
    if (got.rad && hits.length > 1) {
      var matched = hits.filter(function (t) {
        return radEq(got.rad, distWantRad(t, pack));
      });
      if (matched.length) hits = matched;
    }
    if (got.squares && hits.length > 1) {
      var sqHits = hits.filter(function (t) {
        var d = diagnoseDistSquares(got.squares, getPoint(pack.map, t.from), getPoint(pack.map, t.to));
        return d && d.kind === "ok";
      });
      if (sqHits.length) hits = sqHits;
    }
    var started = hits.filter(function (t) {
      return partialMap[t.id];
    });
    if (started.length === 1 && !(got.rad && hits.length > 1)) hits = started;
    var task = hits[0];
    var want = distWantRad(task, pack);
    var a = getPoint(pack.map, task.from);
    var b = getPoint(pack.map, task.to);
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    var lhs = distLhs(task, typed);

    function finish(show) {
      maps.done[task.id] = true;
      delete maps.partial[task.id];
      maps.lastExpr[task.id] = show;
      var left = remainingRequired(pack, maps.done);
      var nxt = preferPartTasks(left, pack, { done: maps.done })[0];
      var more = "";
      if (left.length) {
        more =
          nxt && nxt.kind === "distance"
            ? " נשארו עוד מרחקים."
            : nxt && nxt.kind === "equalLen"
              ? " עכשיו הוכיחו " + distEqualShow(nxt) + "."
              : " המשיכו.";
      }
      return {
        ok: true,
        solved: left.length === 0,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: task,
        show: show,
        rawStep: true,
        message: "נכון." + (left.length ? more : " כל התשובות נכונות."),
      };
    }

    function partial(show, msg) {
      maps.partial[task.id] = true;
      maps.lastExpr[task.id] = show;
      return {
        ok: true,
        solved: false,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: task,
        show: show,
        rawStep: true,
        message: msg,
      };
    }

    if (distDecimalApprox(typed, want)) {
      return {
        ok: false,
        message: "השאירו את התשובה מדויקת, למשל " + fmtRad(want) + " — בלי קירוב עשרוני.",
      };
    }

    if (got.formula) {
      return partial(lhs + "=√((x₂−x₁)²+(y₂−y₁)²)", "נכון. עכשיו הציבו את שיעורי שתי הנקודות.");
    }

    if (got.squares) {
      var dgn = diagnoseDistSquares(got.squares, a, b);
      if (dgn && dgn.kind === "mixed") {
        return {
          ok: false,
          message:
            "כשבוחרים סדר לנקודות, צריך אותו סדר בשני ההפרשים: x של נקודה אחת פחות x של השנייה, ואותו דבר ב-y. להפוך את שני ההפרשים — בסדר; לערבב — לא.",
        };
      }
      if (dgn && dgn.kind === "x") {
        return { ok: false, message: "בדקו את הצבת שיעור ה-x (ההפרש הראשון בנוסחה)." };
      }
      if (dgn && dgn.kind === "y") {
        return { ok: false, message: "בדקו את הצבת שיעור ה-y (ההפרש השני בנוסחה)." };
      }
      if (dgn && dgn.kind === "multi") {
        return {
          ok: false,
          message: "יותר מערך אחד הוצב לא נכון. בדקו שוב את שיעורי שתי הנקודות בנוסחת המרחק.",
        };
      }
    }

    if (got.rad && want && radEq(got.rad, want)) {
      var show = lhs + "=" + (got.pretty || fmtRad(want));
      if (distFormSimplified(got, want)) return finish(lhs + "=" + fmtRad(want));
      var prevShow = (progress.lastExpr && progress.lastExpr[task.id]) || "";
      if (prevShow && normDistStep(show) === normDistStep(prevShow)) {
        var nxtSame = nextDistanceStep(task, pack, progress);
        return {
          ok: false,
          message: "זה אותו צעד. המשיכו לחשב — למשל " + nxtSame + ".",
        };
      }
      var nxtHint =
        want.k === 1
          ? "נכון. עכשיו חשבו את השורש."
          : got.squares || got.innerSum
            ? "נכון. המשיכו לחשב: ריבועים, חיבור, ופישוט השורש."
            : "נכון. פשטו את השורש לצורה " + fmtRad(want) + ".";
      return partial(show, nxtHint);
    }

    if (got.rad || got.squares || got.hasSqrt || /^d/i.test(s)) {
      return {
        ok: false,
        message: "עוד לא מדויק עבור " + distSegName(task) + ". " + distanceHintMessage(task, pack, progress),
      };
    }
    return null;
  }

  function checkEqualLen(typed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var hits = preferPartTasks(
      (pending || []).filter(function (t) {
        return t.kind === "equalLen";
      }),
      pack,
      progress
    );
    if (!hits.length) return null;
    var task = hits[0];
    if (!looksLikeEqualLen(typed, task)) return null;
    var segs = task.segs || [];
    var missing = [];
    (pack.tasks || []).forEach(function (t) {
      if (t.kind !== "distance") return;
      var name = distSegName(t);
      if (segs.indexOf(t.id) >= 0 || segs.indexOf(name) >= 0) {
        if (!(doneMap && doneMap[t.id])) missing.push(name);
      }
    });
    if (missing.length) {
      return {
        ok: false,
        message: "קודם חשבו את " + missing.join(" ו־") + ", ואז רשמו " + distEqualShow(task) + ".",
      };
    }
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.done[task.id] = true;
    delete maps.partial[task.id];
    var show = distEqualShow(task);
    maps.lastExpr[task.id] = show;
    var left = remainingRequired(pack, maps.done);
    return {
      ok: true,
      solved: left.length === 0,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      task: task,
      show: show,
      rawStep: true,
      message: left.length ? "נכון. המשיכו." : "נכון. " + show + ", ולכן ההוכחה הושלמה.",
    };
  }

  function periVerts(task) {
    return ((task && task.verts) || []).map(function (v) {
      return String(v || "").toUpperCase();
    });
  }

  function periLabel(task) {
    var v = periVerts(task).join("");
    if (task && task.label) return String(task.label);
    return v ? "P△" + v : "P";
  }

  function periSides(task) {
    var v = periVerts(task);
    var out = [];
    var i;
    for (i = 0; i < v.length; i++) {
      var a = v[i];
      var b = v[(i + 1) % v.length];
      out.push({ a: a, b: b, name: a + b, rev: b + a });
    }
    return out;
  }

  function periSideRad(pack, side) {
    return distExactFromPoints(getPoint(pack && pack.map, side.a), getPoint(pack && pack.map, side.b));
  }

  function periWant(task, pack) {
    var terms = [];
    periSides(task).forEach(function (side) {
      var r = periSideRad(pack, side);
      if (!r) return;
      terms = addTermLists(terms, termsOf({ kind: "rad", r: r }), 1);
    });
    return fromTermList(terms);
  }

  function fmtValueExpr(v) {
    if (!v) return "";
    if (v.kind === "rat") {
      if (v.r.d === 1) return fmtNum(v.r.n);
      return fmtFrac(v.r.n, v.r.d);
    }
    if (v.kind === "rad") return fmtRad(v.r);
    if (v.kind === "sum") {
      var bits = [];
      (v.terms || []).forEach(function (t, idx) {
        var piece =
          t.k === 1 ? (t.d === 1 ? fmtNum(t.n) : fmtFrac(t.n, t.d)) : fmtRad(radMake(t.n, t.d, t.k));
        if (!idx) bits.push(piece);
        else if (t.n < 0) bits.push("−" + fmtRad(radMake(-t.n, t.d, t.k === 1 ? 1 : t.k)).replace(/^−/, ""));
        else bits.push("+" + piece);
      });
      return bits.join("");
    }
    return "";
  }

  function valuesEq(a, b) {
    if (!a || !b) return false;
    var ta = termsOf(a);
    var tb = termsOf(b);
    if (!ta || !tb || ta.length !== tb.length) return false;
    var i;
    var j;
    var used = {};
    for (i = 0; i < ta.length; i++) {
      var ok = false;
      for (j = 0; j < tb.length; j++) {
        if (used[j]) continue;
        if (ta[i].k === tb[j].k && ta[i].n === tb[j].n && ta[i].d === tb[j].d) {
          used[j] = true;
          ok = true;
          break;
        }
      }
      if (!ok) return false;
    }
    return true;
  }

  function periLetterBody(task) {
    return periSides(task)
      .map(function (s) {
        return s.name;
      })
      .join("+");
  }

  function periPlugBody(task, pack) {
    return periSides(task)
      .map(function (s) {
        return fmtRad(periSideRad(pack, s));
      })
      .join("+");
  }

  function canonicalPerimeterSteps(task, pack) {
    if (!task || task.kind !== "perimeter") return [];
    var lhs = periLabel(task);
    var letters = periLetterBody(task);
    var plug = periPlugBody(task, pack);
    var want = periWant(task, pack);
    var fin = fmtValueExpr(want);
    var out = [lhs + "=" + letters];
    if (plug && plug !== letters) out.push(lhs + "=" + plug);
    if (fin && plug !== fin) out.push(lhs + "=" + fin);
    return out;
  }

  function periTagFromTyped(typed) {
    var s = String(typed || "").replace(/\s+/g, "");
    var m = s.match(/^P(?:△|Δ|_?)([A-Za-z]{3,6})(?:=|:)/i);
    return m ? m[1].toUpperCase() : "";
  }

  function looksLikePeriAttempt(typed) {
    var s = String(typed || "").replace(/\s+/g, "").replace(/[−–—]/g, "-");
    if (/^P(?:△|Δ|_?)[A-Za-z]{3,6}/i.test(s)) return true;
    if (/^[A-Za-z]{2}(\+[A-Za-z]{2}){1,5}$/.test(s)) return true;
    if (/^[A-Za-z]{2}(\+[A-Za-z]{2}){1,5}=/.test(s)) return true;
    return false;
  }

  function periReplaceLetters(rhs, task, pack, progress) {
    var t = String(rhs || "").replace(/\s+/g, "");
    periSides(task).forEach(function (side) {
      var r = periSideRad(pack, side);
      if (!r) return;
      var known = false;
      (pack.tasks || []).forEach(function (u) {
        if (u.kind !== "distance") return;
        var a = String(u.from || "").toUpperCase();
        var b = String(u.to || "").toUpperCase();
        var match =
          (a === side.a && b === side.b) || (a === side.b && b === side.a);
        if (match && progress && progress.done && progress.done[u.id]) known = true;
      });
      var show = fmtRad(r);
      t = t.replace(new RegExp(side.name, "gi"), show);
      t = t.replace(new RegExp(side.rev, "gi"), show);
      if (known) {
        /* already replaced */
      }
    });
    return t;
  }

  function periHasLetterSide(rhs, task) {
    var t = String(rhs || "");
    return periSides(task).some(function (side) {
      return new RegExp(side.name, "i").test(t) || new RegExp(side.rev, "i").test(t);
    });
  }

  function samePeriVerts(tag, task) {
    var want = periVerts(task).join("");
    var got = String(tag || "").toUpperCase();
    if (!got || got.length !== want.length) return false;
    if (got.length === 3) {
      var rot = [want, want[1] + want[2] + want[0], want[2] + want[0] + want[1]];
      var rev = want.split("").reverse().join("");
      var rotR = [rev, rev[1] + rev[2] + rev[0], rev[2] + rev[0] + rev[1]];
      return rot.indexOf(got) >= 0 || rotR.indexOf(got) >= 0;
    }
    return (want + want).indexOf(got) >= 0;
  }

  function pendingPeriTasks(pack, progress, pending) {
    var part = currentPartText && currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    return (pending || []).filter(function (t) {
      if (t.kind !== "perimeter") return false;
      return !ids.length || ids.indexOf(t.id) >= 0;
    });
  }

  function checkPerimeter(typed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var hits = pendingPeriTasks(pack, progress, pending);
    if (!hits.length) return null;
    var s = String(typed || "").replace(/\s+/g, "");
    if (!s) return null;
    var tag = periTagFromTyped(typed);
    if (tag) {
      var named = hits.filter(function (t) {
        return samePeriVerts(tag, t);
      });
      if (!named.length) {
        return {
          ok: false,
          message: "היקף " + periLabel(hits[0]) + " — רשמו את הקודקודים של המשולש.",
        };
      }
      hits = named;
    } else if (!looksLikePeriAttempt(typed)) {
      var startedPeri = hits.some(function (t) {
        return !!(progress && progress.lastExpr && progress.lastExpr[t.id]);
      });
      if (!startedPeri) return null;
    }
    var task = hits[0];
    var lhs = periLabel(task);
    var rhs = s.replace(/^P(?:△|Δ|_?)[A-Za-z]{3,6}(?:=|:)/i, "");
    if (!rhs) rhs = s;
    if (/^\d+\.\d+$/.test(rhs)) {
      return { ok: false, message: "השאירו ביטוי מדויק (שורשים), בלי קירוב עשרוני." };
    }
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    var want = periWant(task, pack);
    var letters = periLetterBody(task);
    function finish(show) {
      maps.done[task.id] = true;
      delete maps.partial[task.id];
      delete maps.lastExpr[task.id];
      if (markOptionalDone) markOptionalDone(pack, maps.done, task);
      var left = remainingRequired(pack, maps.done);
      return {
        ok: true,
        solved: left.length === 0,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: task,
        show: show || lhs + "=" + fmtValueExpr(want),
        rawStep: true,
        message: left.length ? "נכון. המשיכו." : "נכון.",
      };
    }
    function partial(show, msg) {
      maps.partial[task.id] = true;
      maps.lastExpr[task.id] = show;
      return {
        ok: true,
        solved: false,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: task,
        show: show,
        rawStep: true,
        message: msg,
      };
    }
    var letterOnly = /^[A-Za-z]{2}(\+[A-Za-z]{2})+$/.test(rhs);
    if (letterOnly || (periHasLetterSide(rhs, task) && !/√|\d/.test(rhs))) {
      var gotLetters = rhs.toUpperCase().split("+").filter(Boolean).sort().join("+");
      var wantLetters = letters.split("+").slice().sort().join("+");
      var revOk = periSides(task).every(function (side) {
        return rhs.toUpperCase().indexOf(side.name) >= 0 || rhs.toUpperCase().indexOf(side.rev) >= 0;
      });
      if (gotLetters === wantLetters || revOk) {
        return partial(lhs + "=" + letters, "נכון. עכשיו הציבו את אורכי הצלעות.");
      }
      return { ok: false, message: "היקף המשולש הוא סכום הצלעות: " + lhs + "=" + letters + "." };
    }
    var plugged = periReplaceLetters(rhs, task, pack, progress);
    if (periHasLetterSide(plugged, task)) {
      return partial(
        lhs + "=" + letters,
        "נכון. עכשיו הציבו את האורכים שכבר מצאתם, או חשבו קודם צלע חסרה."
      );
    }
    var got = parseDistExpr(plugged);
    if (got && got.sum && valuesEq(got.sum, want)) {
      var simplified = fmtValueExpr(want);
      if (prettyDistExpr(plugged) !== simplified && periPlugBody(task, pack) === prettyDistExpr(plugged).replace(/\s+/g, "")) {
        return partial(lhs + "=" + periPlugBody(task, pack), "נכון. אספו איברים דומים (אותו שורש).");
      }
      return finish(lhs + "=" + simplified);
    }
    if (got && got.rad && valuesEq({ kind: "rad", r: got.rad }, want)) {
      return finish(lhs + "=" + fmtValueExpr(want));
    }
    if (got && (got.rad || got.sum)) {
      var plugShow = periPlugBody(task, pack);
      if (prettyDistExpr(plugged) === prettyDistExpr(plugShow) || prettyDistExpr(plugged) === plugShow) {
        return partial(lhs + "=" + plugShow, "נכון. אספו איברים דומים (אותו שורש).");
      }
      return { ok: false, message: "הציבו " + lhs + "=" + letters + " ואז את האורכים, ואספו איברים דומים." };
    }
    if (looksLikePeriAttempt(typed) || tag) {
      return { ok: false, message: "היקף: " + lhs + "=" + letters + ". הציבו את האורכים ואספו איברים דומים." };
    }
    return null;
  }

  function perimeterHintMessage(task, pack, progress) {
    var lhs = periLabel(task);
    var letters = periLetterBody(task);
    var prev = (progress && progress.lastExpr && progress.lastExpr[task.id]) || "";
    if (!prev) {
      return "היקף המשולש הוא סכום אורכי הצלעות. רשמו " + lhs + "=" + letters + ", או חשבו קודם צלע חסרה.";
    }
    if (periHasLetterSide(prev, task) && !/√/.test(prev)) {
      return "הציבו את אורכי הצלעות שכבר מצאתם.";
    }
    return "אספו איברים דומים (אותו שורש), בלי קירוב עשרוני.";
  }

  function nextPerimeterStep(task, pack, progress) {
    var steps = canonicalPerimeterSteps(task, pack);
    var prev = (progress && progress.lastExpr && progress.lastExpr[task.id]) || "";
    if (!prev) return steps[0] || periLabel(task);
    var i;
    for (i = 0; i < steps.length - 1; i++) {
      if (String(steps[i]).replace(/\s+/g, "") === String(prev).replace(/\s+/g, "")) return steps[i + 1];
    }
    return steps[steps.length - 1] || periLabel(task);
  }

    return {
      distExactFromPoints: distExactFromPoints,
      distLhs: distLhs,
      fmtRad: fmtRad,
      radToFloat: radToFloat,
      distEqualShow: distEqualShow,
      distSegName: distSegName,
      distWantRad: distWantRad,
      checkDistance: checkDistance,
      checkEqualLen: checkEqualLen,
      canonicalDistanceSteps: canonicalDistanceSteps,
      distanceHintMessage: distanceHintMessage,
      nextDistanceStep: nextDistanceStep,
      looksLikePeriAttempt: looksLikePeriAttempt,
      checkPerimeter: checkPerimeter,
      canonicalPerimeterSteps: canonicalPerimeterSteps,
      perimeterHintMessage: perimeterHintMessage,
      nextPerimeterStep: nextPerimeterStep,
      periLabel: periLabel,
    };
  }

  global.DoctematicaGeoDistance = { install: install };
})(window);
