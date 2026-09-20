(function (global) {
  function install(dep) {
    var fmtNum = dep.fmtNum;
    var getPoint = dep.getPoint;
    var near0 = dep.near0;
    var nearNum = dep.nearNum;
    var preferPartTasks = dep.preferPartTasks;
    var cloneMaps = dep.cloneMaps;
    var remainingRequired = dep.remainingRequired;
    var parseConstAxisEq = dep.parseConstAxisEq;
    var formatPointPair = dep.formatPointPair;
    var fmtRad = dep.fmtRad;
    var parsePointPair = dep.parsePointPair;

    function Q() {
      return global.DoctematicaQuadratic;
    }

    function stOf(progress, id) {
      return (progress.distUnk && progress.distUnk[id]) || {};
    }

    function ensureSt(maps, id) {
      if (!maps.distUnk) maps.distUnk = {};
      if (!maps.distUnk[id]) {
        maps.distUnk[id] = { letter: "", found: [], keepFound: [], mixedStart: "", squared: false, known: false };
      }
      return maps.distUnk[id];
    }

    function normEq(s) {
      return String(s || "")
        .replace(/[−–—]/g, "-")
        .replace(/²/g, "^2")
        .replace(/\s+/g, "");
    }

    function hasSqrt(s) {
      return /√|sqrt/i.test(String(s || ""));
    }

    function splitEq(s) {
      var t = String(s || "").replace(/[−–—]/g, "-");
      var i = t.indexOf("=");
      if (i < 0) return null;
      return { L: t.slice(0, i).trim(), R: t.slice(i + 1).trim() };
    }

    function stripDistTag(s) {
      var t = String(s || "").trim();
      t = t.replace(/^(?:d_?[A-Za-z0-9]{0,4}|AB|BE|AC|EC|BC|PA|PB|PC)\s*=/i, "");
      return t;
    }

    function rewriteLetter(eq, from, to) {
      if (!from || !to || from.toLowerCase() === to.toLowerCase()) return eq;
      var f = String(from).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return String(eq || "").replace(new RegExp("(?<![A-Za-z_])" + f + "(?![A-Za-z])", "gi"), to);
    }

    function asX(eq, letter) {
      var L = letter || "x";
      if (L.toLowerCase() === "x") return eq;
      return rewriteLetter(eq, L, "x");
    }

    function fromX(eq, letter) {
      var L = letter || "x";
      if (L.toLowerCase() === "x") return eq;
      return rewriteLetter(eq, "x", L);
    }

    function evalNumericExpr(s) {
      var t = String(s || "")
        .replace(/[−–—]/g, "-")
        .replace(/[·×]/g, "*")
        .replace(/\s+/g, "")
        .replace(/--/g, "+");
      if (!t || !/^[-+*/().0-9]+$/.test(t)) return null;
      try {
        var v = Function("return (" + t + ")")();
        return isFinite(v) ? v : null;
      } catch (e) {
        return null;
      }
    }

    function unwrapNegParens(t) {
      return String(t || "").replace(/-\((-?\d+(?:\.\d+)?)\)/g, function (_, n) {
        var v = -Number(n);
        return v < 0 ? String(v) : "+" + v;
      });
    }

    function expandSquares(t) {
      var cur = unwrapNegParens(t);
      var guard = 0;
      while (guard < 20) {
        guard += 1;
        var next = unwrapNegParens(cur).replace(/\((-?\d+(?:\.\d+)?)\)/g, "$1");
        next = unwrapNegParens(next);
        next = next.replace(/\(([^()]*)\)/g, function (_, u) {
          if (/\^/.test(u)) return _;
          var v = evalNumericExpr(u);
          if (v == null) return _;
          return String(v);
        });
        next = next.replace(/\(([^()]*)\)\^2/g, function (_, u) {
          var v = evalNumericExpr(u);
          if (v == null) return _;
          return String(v * v);
        });
        next = next.replace(/(-?\d+(?:\.\d+)?)\^2/g, function (_, n) {
          var v = Number(n);
          return String(v * v);
        });
        if (next === cur) break;
        cur = next;
      }
      return cur;
    }

    function evalInner(inner, letter, val) {
      var t = String(inner || "")
        .replace(/[−–—]/g, "-")
        .replace(/²/g, "^2")
        .replace(/[·×]/g, "*");
      if (letter) {
        var L = String(letter).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        var wrapped = "(" + val + ")";
        t = t.replace(new RegExp("(\\d)" + L, "gi"), "$1*" + wrapped);
        t = t.replace(new RegExp("(?<![A-Za-z0-9_])" + L + "(?![A-Za-z0-9])", "gi"), wrapped);
      }
      t = expandSquares(t);
      return evalNumericExpr(t);
    }

    function evalMaybePow(s) {
      var t = String(s || "")
        .replace(/[−–—]/g, "-")
        .replace(/²/g, "^2")
        .replace(/\^{(-?\d+)}/g, "^$1")
        .replace(/\s+/g, "");
      if (!t || /[a-z]/i.test(t.replace(/sqrt/gi, ""))) return null;
      var m = t.match(/^(.+)\^2$/);
      if (m) {
        var u = evalNumericExpr(m[1]);
        if (u != null) return u * u;
      }
      return evalNumericExpr(t);
    }

    function extractSqrtInner(side) {
      var s = String(side || "")
        .replace(/[−–—]/g, "-")
        .replace(/²/g, "^2")
        .replace(/\s+/g, "")
        .replace(/sqrt/gi, "√");
      var idx = s.indexOf("√");
      if (idx < 0) return null;
      var rest = s.slice(idx + 1);
      if (rest.charAt(0) === "(") {
        var depth = 0;
        var i;
        for (i = 0; i < rest.length; i++) {
          if (rest.charAt(i) === "(") depth += 1;
          if (rest.charAt(i) === ")") {
            depth -= 1;
            if (depth === 0) return rest.slice(1, i);
          }
        }
      }
      return rest.replace(/\^2$/, "");
    }

    function lettersIn(s) {
      var t = String(s || "")
        .replace(/sqrt/gi, "")
        .replace(/d_?[A-Za-z]{0,4}/gi, "");
      var m = t.match(/[a-zA-Z]/g) || [];
      var seen = {};
      var out = [];
      m.forEach(function (ch) {
        var c = ch.toLowerCase();
        if (seen[c]) return;
        seen[c] = true;
        out.push(c);
      });
      return out;
    }

    function rootFloat(r) {
      if (r == null) return null;
      if (typeof r === "number") return r;
      var n = Number(r.n);
      var d = r.d != null ? Number(r.d) : 1;
      var k = r.k != null ? Number(r.k) : 1;
      if (!d) return null;
      return (n / d) * Math.sqrt(k);
    }

    function fmtRoot(r) {
      if (r == null) return "";
      if (typeof r === "number") return fmtNum(r);
      if (fmtRad) return fmtRad({ n: r.n, d: r.d || 1, k: r.k || 1 });
      var v = rootFloat(r);
      return fmtNum(v);
    }

    function parseRootToken(s) {
      var t = String(s || "")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "")
        .replace(/[·×]/g, "");
      if (!t) return null;
      if (/^[+-]?\d+(?:\.\d+)?(?:\/-?\d+)?$/.test(t)) {
        var n = t.indexOf("/") >= 0 ? parseFloat(t.split("/")[0], 10) / parseFloat(t.split("/")[1], 10) : parseFloat(t, 10);
        return isFinite(n) ? { value: n } : null;
      }
      var m = t.match(/^([+-])?(\d*)√(\d+)$/);
      if (m) {
        var sign = m[1] === "-" ? -1 : 1;
        var coef = m[2] === "" ? 1 : parseInt(m[2], 10);
        var k = parseInt(m[3], 10);
        return { value: sign * coef * Math.sqrt(k), n: sign * coef, k: k };
      }
      return null;
    }

    function listMatch(val, list) {
      var i;
      for (i = 0; i < (list || []).length; i++) {
        var f = rootFloat(list[i]);
        if (f != null && nearNum(val, f)) return true;
      }
      return false;
    }

    function otherPoint(pack, task) {
      if (task.fromExpr) return null;
      return getPoint(pack.map, task.from || "A");
    }

    function knownXOf(task, st) {
      if (task.knownX != null && isFinite(task.knownX)) return Number(task.knownX);
      if (String(task.onAxis || "").toLowerCase() === "y") return 0;
      if (task.onVertical != null && isFinite(task.onVertical)) return Number(task.onVertical);
      return null;
    }

    function knownYOf(task) {
      if (task.knownY != null && isFinite(task.knownY)) return Number(task.knownY);
      if (task.yLine && near0(Number(task.yLine.m))) return Number(task.yLine.b);
      if (String(task.onAxis || "").toLowerCase() === "x") return 0;
      return null;
    }

    function unknownAxisOf(task) {
      var a = String(task.unknownAxis || "").toLowerCase();
      if (a === "x" || a === "y") return a;
      if (task.fromExpr) return "";
      if (task.yLine && !near0(Number(task.yLine.m))) return "";
      if (task.knownY != null && task.knownX == null) return "x";
      if (task.knownX != null && task.knownY == null) return "y";
      if (String(task.onAxis || "").toLowerCase() === "y") return "y";
      if (task.onVertical != null) return "y";
      return "x";
    }

    function isEqualTask(task) {
      return !!(task && task.equalFrom && task.equalTo);
    }

    function yExprOf(task, letter) {
      var L = letter || task.letter || "x";
      if (task.yLine) {
        var m = Number(task.yLine.m);
        var b = Number(task.yLine.b);
        if (!isFinite(m)) m = 1;
        if (!isFinite(b)) b = 0;
        var head;
        if (near0(m)) return fmtNum(b);
        if (nearNum(m, 1)) head = L;
        else if (nearNum(m, -1)) head = "−" + L;
        else head = fmtNum(m) + L;
        if (near0(b)) return head;
        if (b > 0) return head + "+" + fmtNum(b);
        return head + "−" + fmtNum(-b);
      }
      var ky = knownYOf(task);
      if (ky != null) return fmtNum(ky);
      if (task.toExpr && task.toExpr.y) return String(task.toExpr.y);
      return L;
    }

    function unknownXY(task, letter) {
      letter = letter || task.letter || "x";
      if (task.toExpr) return { x: String(task.toExpr.x), y: String(task.toExpr.y) };
      if (task.onVertical != null) return { x: fmtNum(task.onVertical), y: letter };
      if (unknownAxisOf(task) === "y" && knownXOf(task) != null) {
        return { x: fmtNum(knownXOf(task)), y: letter };
      }
      return { x: letter, y: yExprOf(task, letter) };
    }

    function wrapIfOp(s) {
      var t = String(s || "");
      if (/[+\-−]/.test(t.slice(1))) return "(" + t + ")";
      return t;
    }

    function prettyExprDiff(left, rightVal) {
      var L = wrapIfOp(left);
      var rawR = String(rightVal == null ? "" : rightVal).replace(/[−–—]/g, "-");
      if (/[a-z]/i.test(rawR)) return L + "−" + wrapIfOp(rawR);
      var r = Number(rawR);
      if (!isFinite(r)) return L + "−" + wrapIfOp(rawR);
      if (r < 0) return L + "−(−" + fmtNum(-r) + ")";
      if (near0(r)) return L;
      return L + "−" + fmtNum(r);
    }

    function paramFrom(pack, task) {
      if (task.fromExpr) return { x: String(task.fromExpr.x), y: String(task.fromExpr.y) };
      var o = otherPoint(pack, task);
      if (o) return { x: String(o.x), y: String(o.y) };
      return null;
    }

    function paramTo(task, letter) {
      if (task.toExpr) return { x: String(task.toExpr.x), y: String(task.toExpr.y) };
      if (task.yLine || task.equalFrom || knownYOf(task) != null || String(task.onAxis || "").toLowerCase() === "x") {
        return unknownXY(task, letter);
      }
      return null;
    }

    function distSqVal(task) {
      var ex = task.givenDistExact;
      if (ex && ex.k != null) {
        var n = Number(ex.n != null ? ex.n : 1);
        var d = Number(ex.d != null ? ex.d : 1);
        var k = Number(ex.k);
        if (d) return (n * n * k) / (d * d);
      }
      var v = distValue(task);
      return v * v;
    }

    function distShow(task) {
      var ex = task.givenDistExact;
      if (ex && ex.k != null) {
        var n = Number(ex.n != null ? ex.n : 1);
        var d = Number(ex.d != null ? ex.d : 1);
        var k = Number(ex.k);
        var tail = "√" + fmtNum(k);
        if (d === 1 && (n === 1 || nearNum(n, 1))) return tail;
        if (d === 1 && nearNum(n, -1)) return "−" + tail;
        if (d === 1) return fmtNum(n) + tail;
        if (fmtRad) return fmtRad(ex);
      }
      if (task.givenDist != null && isFinite(Number(task.givenDist))) return fmtNum(task.givenDist);
      return "";
    }

    function formulaInnerBare(pack, task, letter, otherLab) {
      var u = unknownXY(task, letter);
      var o = getPoint(pack.map, otherLab);
      if (!o) return "";
      return "(" + prettyExprDiff(u.x, o.x) + ")²+(" + prettyExprDiff(u.y, o.y) + ")²";
    }

    function formulaInnerToPoint(pack, task, letter, otherLab) {
      var bare = formulaInnerBare(pack, task, letter, otherLab);
      return bare ? "(" + bare + ")" : "";
    }

    function segName(task, other) {
      return String(task.unknownPoint || "P").toUpperCase() + String(other || "").toUpperCase();
    }

    function expectedInnerVal(pack, task, letter, val) {
      var fr = paramFrom(pack, task);
      var to = paramTo(task, letter);
      if (fr && to) {
        var x1 = evalInner(fr.x, letter, val);
        var y1 = evalInner(fr.y, letter, val);
        var x2 = evalInner(to.x, letter, val);
        var y2 = evalInner(to.y, letter, val);
        if (x1 == null || y1 == null || x2 == null || y2 == null) return null;
        return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
      }
      var o = otherPoint(pack, task);
      if (!o) return null;
      var ux;
      var uy;
      var ax = unknownAxisOf(task);
      if (ax === "x") {
        ux = val;
        uy = knownYOf(task);
      } else {
        ux = knownXOf(task);
        uy = val;
      }
      if (ux == null || uy == null) return null;
      return (ux - o.x) * (ux - o.x) + (uy - o.y) * (uy - o.y);
    }

    function expectedInnerLeg(pack, task, letter, val, otherLab) {
      var u = unknownXY(task, letter);
      var o = getPoint(pack.map, otherLab);
      if (!o) return null;
      var ux = evalInner(u.x, letter, val);
      var uy = evalInner(u.y, letter, val);
      if (ux == null || uy == null) return null;
      return (ux - o.x) * (ux - o.x) + (uy - o.y) * (uy - o.y);
    }

    function innerMatchesLeg(pack, task, inner, letter, otherLab) {
      var vals = [0, 1, 2, -1, 3];
      var i;
      for (i = 0; i < vals.length; i++) {
        var got = evalInner(inner, letter, vals[i]);
        var want = expectedInnerLeg(pack, task, letter, vals[i], otherLab);
        if (got == null || want == null || Math.abs(got - want) > 1e-5) return false;
      }
      return true;
    }

    function innerMatchesExpected(pack, task, inner, letter) {
      if (isEqualTask(task)) {
        return (
          innerMatchesLeg(pack, task, inner, letter, task.equalFrom) ||
          innerMatchesLeg(pack, task, inner, letter, task.equalTo)
        );
      }
      var vals = [0, 1, 2, -1, 3];
      var i;
      for (i = 0; i < vals.length; i++) {
        var got = evalInner(inner, letter, vals[i]);
        var want = expectedInnerVal(pack, task, letter, vals[i]);
        if (got == null || want == null || Math.abs(got - want) > 1e-5) return false;
      }
      return true;
    }

    function matchEqualLeg(pack, task, inner, letter) {
      if (!isEqualTask(task) || !inner) return "";
      if (innerMatchesLeg(pack, task, inner, letter, task.equalFrom)) return "from";
      if (innerMatchesLeg(pack, task, inner, letter, task.equalTo)) return "to";
      return "";
    }

    function inferLetter(pack, task, inner, preferred) {
      var cands = [];
      if (preferred) cands.push(preferred);
      if (task.letter) cands.push(String(task.letter).toLowerCase());
      lettersIn(inner).forEach(function (c) {
        cands.push(c);
      });
      ["x", "y", "t"].forEach(function (c) {
        cands.push(c);
      });
      var seen = {};
      var i;
      for (i = 0; i < cands.length; i++) {
        var L = cands[i];
        if (!L || seen[L]) continue;
        seen[L] = true;
        if (innerMatchesExpected(pack, task, inner, L)) return L;
      }
      return preferred || (task.letter && String(task.letter).toLowerCase()) || "x";
    }

    function distValue(task) {
      var ex = task.givenDistExact;
      if (ex && ex.k != null) {
        var n = Number(ex.n != null ? ex.n : 1);
        var d = Number(ex.d != null ? ex.d : 1);
        var k = Number(ex.k);
        if (d) return (n / d) * Math.sqrt(k);
      }
      return Number(task.givenDist);
    }

    function prettyCoordDiff(left, rightVal) {
      var r = Number(rightVal);
      if (!isFinite(r)) return left + "−" + String(rightVal);
      if (r < 0) return left + "+" + fmtNum(-r);
      if (near0(r)) return left;
      return left + "−" + fmtNum(r);
    }

    function formulaShow(pack, task, letter) {
      letter = letter || task.letter || "x";
      if (isEqualTask(task)) {
        return segName(task, task.equalFrom) + "=√" + formulaInnerToPoint(pack, task, letter, task.equalFrom);
      }
      var d = distShow(task);
      var fr = paramFrom(pack, task);
      var to = paramTo(task, letter);
      if (fr && to) {
        return (
          "√((" +
          prettyExprDiff(to.x, fr.x) +
          ")²+(" +
          prettyExprDiff(to.y, fr.y) +
          ")²)=" +
          d
        );
      }
      var o = otherPoint(pack, task);
      var ax = unknownAxisOf(task);
      var kx = knownXOf(task);
      var ky = knownYOf(task);
      var x1 = ax === "x" ? letter : fmtNum(kx);
      var y1 = ax === "y" ? letter : fmtNum(ky);
      return "√((" + prettyCoordDiff(x1, o ? o.x : 0) + ")²+(" + prettyCoordDiff(y1, o ? o.y : 0) + ")²)=" + d;
    }

    function formulaShowOther(pack, task, letter) {
      letter = letter || task.letter || "x";
      if (!isEqualTask(task)) return formulaShow(pack, task, letter);
      return segName(task, task.equalTo) + "=√" + formulaInnerToPoint(pack, task, letter, task.equalTo);
    }

    function formulaShowEqual(pack, task, letter) {
      letter = letter || task.letter || "x";
      return (
        "√" +
        formulaInnerToPoint(pack, task, letter, task.equalFrom) +
        "=√" +
        formulaInnerToPoint(pack, task, letter, task.equalTo)
      );
    }

    function seedSquared(pack, task, letter) {
      letter = letter || "x";
      if (isEqualTask(task)) {
        return (
          formulaInnerBare(pack, task, letter, task.equalFrom).replace(/²/g, "^2") +
          "=" +
          formulaInnerBare(pack, task, letter, task.equalTo).replace(/²/g, "^2")
        );
      }
      var d2 = distSqVal(task);
      var fr = paramFrom(pack, task);
      var to = paramTo(task, letter);
      if (fr && to) {
        return (
          "(" +
          prettyExprDiff(to.x, fr.x) +
          ")^2+(" +
          prettyExprDiff(to.y, fr.y) +
          ")^2=" +
          fmtNum(d2)
        );
      }
      var o = otherPoint(pack, task);
      var ax = unknownAxisOf(task);
      var kx = knownXOf(task);
      var ky = knownYOf(task);
      var xs = ax === "x" ? letter : fmtNum(kx);
      var ys = ax === "y" ? letter : fmtNum(ky);
      return "(" + prettyCoordDiff(xs, o.x) + ")^2+(" + prettyCoordDiff(ys, o.y) + ")^2=" + fmtNum(d2);
    }

    function coeffOfLetter(expr, letter) {
      var s = String(expr || "")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "");
      var L = String(letter || "");
      if (!L || !s) return null;
      if (s === L) return 1;
      if (s === "-" + L) return -1;
      var m = s.match(new RegExp("^([+-]?\\d+(?:\\.\\d+)?)?" + L + "$", "i"));
      if (!m) return null;
      if (!m[1] || m[1] === "+") return 1;
      if (m[1] === "-") return -1;
      return Number(m[1]);
    }

    function fmtLetterCoef(c, letter) {
      if (near0(c)) return "0";
      if (nearNum(c, 1)) return letter;
      if (nearNum(c, -1)) return "−" + letter;
      return fmtNum(c) + letter;
    }

    function simplifyParenInner(inner, letter) {
      var t = String(inner || "")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "");
      var L = letter || "";
      if (L) {
        var twoL = t.match(new RegExp("^([+-]?\\d*)" + L + "([+-]\\d*)" + L + "$", "i"));
        if (twoL) {
          var c1 = twoL[1] === "" || twoL[1] === "+" ? 1 : twoL[1] === "-" ? -1 : Number(twoL[1]);
          var c2 = twoL[2] === "+" ? 1 : twoL[2] === "-" ? -1 : Number(twoL[2]);
          if (!isFinite(c1) || !isFinite(c2)) return null;
          return fmtLetterCoef(c1 + c2, L);
        }
      }
      var nums = t.match(/^(-?\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)$/);
      if (nums) return fmtNum(Number(nums[1]) + Number(nums[2]));
      return null;
    }

    function seedInnerDiffs(pack, task, letter) {
      letter = letter || task.letter || "x";
      var seed = String(seedSquared(pack, task, letter)).replace(/\^2/g, "²");
      var next = seed.replace(/\(([^()]+)\)²/g, function (all, inner) {
        var s = simplifyParenInner(inner, letter);
        if (s == null || s === inner) return all;
        return "(" + s + ")²";
      });
      if (normEq(next) === normEq(seed)) return null;
      return next;
    }

    function seedAfterSquares(pack, task, letter) {
      letter = letter || task.letter || "x";
      if (!task.fromExpr || !task.toExpr) return null;
      var dx = coeffOfLetter(task.toExpr.x, letter) - coeffOfLetter(task.fromExpr.x, letter);
      var dy = coeffOfLetter(task.toExpr.y, letter) - coeffOfLetter(task.fromExpr.y, letter);
      if (dx == null || dy == null || !isFinite(dx) || !isFinite(dy)) return null;
      var d2 = distValue(task) * distValue(task);
      var t2 = letter + "²";
      function term(c) {
        var q = c * c;
        if (near0(q)) return "";
        if (nearNum(q, 1)) return t2;
        return fmtNum(q) + t2;
      }
      var left = [term(dx), term(dy)].filter(Boolean).join("+");
      if (!left) return null;
      return left + "=" + fmtNum(d2);
    }

    function seedCombinedSquares(pack, task, letter) {
      letter = letter || task.letter || "x";
      if (!task.fromExpr || !task.toExpr) return null;
      var dx = coeffOfLetter(task.toExpr.x, letter) - coeffOfLetter(task.fromExpr.x, letter);
      var dy = coeffOfLetter(task.toExpr.y, letter) - coeffOfLetter(task.fromExpr.y, letter);
      if (dx == null || dy == null || !isFinite(dx) || !isFinite(dy)) return null;
      var k = dx * dx + dy * dy;
      var d2 = distValue(task) * distValue(task);
      if (near0(k)) return null;
      return (nearNum(k, 1) ? letter + "²" : fmtNum(k) + letter + "²") + "=" + fmtNum(d2);
    }

    function keepList(task) {
      return task.keep && task.keep.length ? task.keep : task.roots || [];
    }

    function discardList(task) {
      var keep = keepList(task);
      return (task.roots || []).filter(function (r) {
        return !listMatch(rootFloat(r), keep);
      });
    }

    function parseMarkedUnknown(typed, task) {
      var s = String(typed || "")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "")
        .replace(/,/g, ";");
      var m =
        s.match(/^([A-Za-z])\(([^;)]+);([^)]+)\)$/) ||
        s.match(/^([A-Za-z])=\(([^;)]+);([^)]+)\)$/);
      if (!m) return null;
      var lab = m[1].toUpperCase();
      var want = String(task.unknownPoint || task.label || "").toUpperCase();
      if (want && lab !== want) return null;
      function exprsEq(a, b, L) {
        var vals = [0, 1, 2, -1];
        var i;
        for (i = 0; i < vals.length; i++) {
          var ga = evalInner(a, L, vals[i]);
          var gb = evalInner(b, L, vals[i]);
          if (ga == null || gb == null || Math.abs(ga - gb) > 1e-5) return false;
        }
        return true;
      }
      if (task.yLine || (task.toExpr && /[a-z]/i.test(String(task.toExpr.y || "")))) {
        var lets = lettersIn(m[2] + ";" + m[3]);
        var li;
        for (li = 0; li < lets.length; li++) {
          var Lp = String(lets[li] || "").toLowerCase();
          if (!Lp) continue;
          var u = unknownXY(task, Lp);
          if (exprsEq(m[2], u.x, Lp) && exprsEq(m[3], u.y, Lp)) {
            return { letter: Lp, show: lab + "(" + m[2] + ";" + m[3] + ")" };
          }
        }
      }
      function isLet(u) {
        return /^[a-zA-Z]$/.test(u);
      }
      var leftLet = isLet(m[2]);
      var rightLet = isLet(m[3]);
      if (leftLet === rightLet) return null;
      var letter = leftLet ? m[2].toLowerCase() : m[3].toLowerCase();
      var num = leftLet ? Number(m[3].replace(/−/g, "-")) : Number(m[2].replace(/−/g, "-"));
      if (!isFinite(num)) return null;
      var ax = unknownAxisOf(task);
      if (ax === "x" && !leftLet) return null;
      if (ax === "y" && !rightLet) return null;
      if (ax === "x" && knownYOf(task) != null && !nearNum(num, knownYOf(task))) return null;
      if (ax === "y" && knownXOf(task) != null && !nearNum(num, knownXOf(task))) return null;
      return { letter: letter, show: lab + "(" + m[2] + ";" + m[3] + ")" };
    }

    function parseAnswerPoints(typed) {
      var s = String(typed || "")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "")
        .replace(/,/g, ";");
      var out = [];
      var re = /[A-Za-z]?\(([^;()]+);([^()]+)\)/g;
      var m;
      while ((m = re.exec(s))) {
        var p = parsePointPair ? parsePointPair("(" + m[1] + ";" + m[2] + ")") : null;
        if (p) out.push(p);
      }
      if (!out.length) {
        var bare = parsePointPair ? parsePointPair(s) : null;
        if (bare) out.push(bare);
      }
      return out;
    }

    function extractRootValues(typed, letter) {
      var s = String(typed || "")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "");
      var L = letter || "x";
      var out = [];
      var pm = s.match(new RegExp("(?:^|,)" + L + "=±(.+)$", "i")) || s.match(/^=?±(.+)$/);
      if (pm) {
        var tok = parseRootToken(pm[1]);
        if (tok) {
          out.push(tok.value);
          out.push(-tok.value);
          return out;
        }
      }
      var re = new RegExp("(?:^|,)" + L + "=([^,;]+)", "gi");
      var m;
      while ((m = re.exec(s))) {
        var t = parseRootToken(m[1]);
        if (t) out.push(t.value);
      }
      return out;
    }

    function mixedPackFor(pack, task, letter) {
      var Quad = Q();
      if (!Quad || !Quad.analyzeMixedStart) return null;
      var seed =
        seedCombinedSquares(pack, task, letter) ||
        seedAfterSquares(pack, task, letter) ||
        seedInnerDiffs(pack, task, letter) ||
        seedSquared(pack, task, letter);
      try {
        return Quad.analyzeMixedStart(asX(seed, letter));
      } catch (e) {
        return null;
      }
    }

    function markKnown(maps, task, show, msg) {
      var st = ensureSt(maps, task.id);
      st.known = true;
      maps.partial[task.id] = true;
      maps.lastExpr[task.id] = show;
      if (!maps.coords[task.id]) maps.coords[task.id] = { x: false, y: false };
      if (String(task.onAxis || "").toLowerCase() === "y" || task.onVertical != null) {
        maps.coords[task.id].x = true;
      }
      if (String(task.onAxis || "").toLowerCase() === "x" || (task.yLine && near0(Number(task.yLine.m)))) {
        maps.coords[task.id].y = true;
      }
      return {
        ok: true,
        solved: false,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        distUnk: maps.distUnk,
        task: task,
        show: show,
        rawStep: true,
        message: msg,
      };
    }

    function acceptStep(maps, task, show, msg, extra) {
      var st = ensureSt(maps, task.id);
      maps.partial[task.id] = true;
      maps.lastExpr[task.id] = show;
      var out = {
        ok: true,
        solved: false,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        distUnk: maps.distUnk,
        task: task,
        show: show,
        rawStep: true,
        message: msg,
      };
      if (extra) {
        Object.keys(extra).forEach(function (k) {
          out[k] = extra[k];
        });
      }
      return out;
    }

    function finishTask(maps, pack, task, show, extraShow, msg) {
      var st = ensureSt(maps, task.id);
      maps.done[task.id] = true;
      delete maps.partial[task.id];
      maps.lastExpr[task.id] = show;
      if (!maps.coords[task.id]) maps.coords[task.id] = { x: true, y: true };
      maps.coords[task.id].x = true;
      maps.coords[task.id].y = true;
      var left = remainingRequired(pack, maps.done);
      var out = {
        ok: true,
        solved: left.length === 0,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        distUnk: maps.distUnk,
        task: task,
        show: show,
        rawStep: true,
        revealPoint: task.unknownPoint || task.point,
        message: msg || (left.length ? "נכון. המשיכו." : "נכון. כל התשובות נכונות."),
      };
      if (extraShow && extraShow.length) out.extraShow = extraShow;
      return out;
    }

    function addFound(st, val, task) {
      var i;
      for (i = 0; i < st.found.length; i++) {
        if (nearNum(st.found[i], val)) return;
      }
      st.found.push(val);
      if (listMatch(val, keepList(task))) {
        var k;
        for (k = 0; k < st.keepFound.length; k++) {
          if (nearNum(st.keepFound[k], val)) return;
        }
        st.keepFound.push(val);
      }
    }

    function keepComplete(st, task) {
      var keep = keepList(task);
      if (!keep.length) return st.keepFound.length > 0;
      return keep.every(function (r) {
        return st.keepFound.some(function (v) {
          return nearNum(v, rootFloat(r));
        });
      });
    }

    function finishIfReady(maps, pack, task, show) {
      var st = ensureSt(maps, task.id);
      if (!keepComplete(st, task)) return null;
      var kind = String(task.resultKind || "point");
      var extra = [];
      if (kind === "param") {
        var parts = keepList(task).map(function (r) {
          return (task.letter || st.letter || "t") + " = " + fmtRoot(r);
        });
        return finishTask(maps, pack, task, show || parts.join(", "), null, "נכון. שני הערכים: " + parts.join(", ") + ".");
      }
      if (kind === "coord") {
        var L = st.letter || task.letter || unknownAxisOf(task) || "y";
        var nums = keepList(task).map(fmtRoot);
        return finishTask(
          maps,
          pack,
          task,
          show || L + " = " + nums.join(", " + L + " = "),
          null,
          "נכון. שתי האפשרויות: " + nums.join(", ") + "."
        );
      }
      var ans = task.answers || [];
      if (ans.length === 1) {
        var lab = String(task.unknownPoint || task.label || "B").toUpperCase();
        var pt = lab + formatPointPair(ans[0].x, ans[0].y);
        if (show && /[A-Za-z]\(/.test(show)) pt = show;
        else extra.push(pt);
        var note = "";
        if (task.quadrant === 1 && discardList(task).length) {
          extra = extra;
          note = " רק הפתרון שמתאים לרביע הראשון.";
        }
        return finishTask(maps, pack, task, pt, extra.length && extra[0] !== pt ? extra : null, "נכון." + note);
      }
      var pts = ans.map(function (a) {
        return formatPointPair(a.x, a.y);
      });
      return finishTask(maps, pack, task, show || pts.join(", "), null, "נכון. שתי הנקודות: " + pts.join(", ") + ".");
    }

    function quadrantReject(task, px, py) {
      if (task.quadrant !== 1) return null;
      if (px <= 0 || py <= 0) {
        var labQ = String(task.unknownPoint || "B").toUpperCase();
        var ansOk = (task.answers || []).some(function (a) {
          return nearNum(a.x, px) && nearNum(a.y, py);
        });
        if (!ansOk) {
          return labQ + " ברביע הראשון, לכן שני השיעורים חיוביים. הערך הזה מתקבל מהמשוואה אבל נפסל לפי הרביע.";
        }
      }
      var ax = unknownAxisOf(task);
      var disc = discardList(task);
      var v = ax === "y" ? py : px;
      if (v == null) return null;
      if (!listMatch(v, disc)) return null;
      var lab = String(task.unknownPoint || "B").toUpperCase();
      return (
        lab +
        " ברביע הראשון, לכן " +
        (ax === "y" ? "y" : "x") +
        " > 0. הערך " +
        fmtNum(v) +
        " מתקבל מהמשוואה אבל נפסל לפי הרביע."
      );
    }

    function tryFinishPoints(maps, pack, task, typed) {
      var pts = parseAnswerPoints(typed);
      if (!pts.length) return null;
      var ans = task.answers || [];
      var st = ensureSt(maps, task.id);
      var i;
      for (i = 0; i < pts.length; i++) {
        var q = quadrantReject(task, pts[i].x, pts[i].y);
        if (q && !ans.some(function (a) { return nearNum(a.x, pts[i].x) && nearNum(a.y, pts[i].y); })) {
          return { ok: false, message: q };
        }
        ans.forEach(function (a) {
          if (nearNum(a.x, pts[i].x) && nearNum(a.y, pts[i].y)) {
            var ax = unknownAxisOf(task);
            addFound(st, ax === "y" ? a.y : a.x, task);
          }
        });
      }
      var hitAll =
        ans.length &&
        ans.every(function (a) {
          return pts.some(function (p) {
            return nearNum(p.x, a.x) && nearNum(p.y, a.y);
          });
        });
      if (hitAll) {
        var show = String(typed || "").replace(/\s+/g, "");
        return finishIfReady(maps, pack, task, show) || finishTask(maps, pack, task, show);
      }
      if (pts.length === 1 && ans.length === 1 && nearNum(pts[0].x, ans[0].x) && nearNum(pts[0].y, ans[0].y)) {
        return finishTask(maps, pack, task, String(task.unknownPoint || "B").toUpperCase() + formatPointPair(ans[0].x, ans[0].y));
      }
      return null;
    }

    function tryAxisFirst(maps, pack, task, typed, st) {
      if (st.known) return null;
      var axisY = String(task.onAxis || "").toLowerCase() === "y";
      var vert = task.onVertical;
      var got = parseConstAxisEq(typed);
      var s = normEq(typed);
      var sub = s.match(/^([xy])_?([A-Za-z])=(.+)$/i);
      if (sub) {
        got = { axis: sub[1].toLowerCase(), value: parseFloat(String(sub[3]).replace(/−/g, "-"), 10) };
      }
      if (axisY) {
        if (got && got.axis === "x" && near0(got.value)) {
          return markKnown(maps, task, "x = 0", "נכון. הנקודה על ציר y ולכן x = 0. עכשיו הציבו בנוסחת המרחק.");
        }
      }
      if (String(task.onAxis || "").toLowerCase() === "x") {
        if (got && got.axis === "y" && near0(got.value)) {
          return markKnown(maps, task, "y = 0", "נכון. הנקודה על ציר x ולכן y = 0. עכשיו הציבו בנוסחת המרחק.");
        }
      }
      var ky0 = knownYOf(task);
      if (ky0 != null && got && got.axis === "y" && nearNum(got.value, ky0)) {
        return markKnown(
          maps,
          task,
          "y = " + fmtNum(ky0),
          "נכון. הנקודה על הישר y = " + fmtNum(ky0) + ". עכשיו הציבו בנוסחת המרחק."
        );
      }
      if (vert != null && isFinite(vert)) {
        if (got && got.axis === "x" && nearNum(got.value, Number(vert))) {
          var lab = String(task.unknownPoint || "B").toUpperCase();
          return markKnown(
            maps,
            task,
            "x = " + fmtNum(vert),
            "נכון. " + lab + " על הישר x = " + fmtNum(vert) + "."
          );
        }
      }
      return null;
    }

    function looksDistUnk(typed, task, st, last) {
      if (last) return true;
      if (hasSqrt(typed)) return true;
      if (parseConstAxisEq(typed)) return true;
      if (parseMarkedUnknown(typed, task)) return true;
      if (parseAnswerPoints(typed).length) return true;
      if (/\^2|²/.test(typed) && /=/.test(typed)) return true;
      if (st && (st.squared || st.letter)) return true;
      if (/[xyt]\s*=/i.test(typed)) return true;
      if (isEqualTask(task) && /[A-Za-z]{1,2}\s*=\s*[A-Za-z]{1,2}/.test(typed)) return true;
      return false;
    }

    function innersSame(a, b, letter) {
      var vals = [0, 1, 2, -1];
      var i;
      for (i = 0; i < vals.length; i++) {
        var ga = evalInner(a, letter, vals[i]);
        var gb = evalInner(b, letter, vals[i]);
        if (ga == null || gb == null || Math.abs(ga - gb) > 1e-5) return false;
      }
      return true;
    }

    function innersMatchPrev(sides, prev, letter) {
      if (!prev || !hasSqrt(prev.L) || !hasSqrt(prev.R)) return false;
      var pL = extractSqrtInner(prev.L);
      var pR = extractSqrtInner(prev.R);
      return (
        (innersSame(sides.L, pL, letter) && innersSame(sides.R, pR, letter)) ||
        (innersSame(sides.L, pR, letter) && innersSame(sides.R, pL, letter))
      );
    }

    function checkDistUnknown(typed, pack, progress, pending, doneMap, partialMap, coordsMap) {
      var hits = preferPartTasks(
        (pending || []).filter(function (t) {
          return t.kind === "distUnknown";
        }),
        pack,
        progress
      );
      if (!hits.length) return null;
      var task = hits[0];
      var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
      var st = ensureSt(maps, task.id);
      var last = progress.lastExpr && progress.lastExpr[task.id];
      var raw = String(typed || "").trim();
      if (!looksDistUnk(raw, task, st, last)) return null;

      var ptHit = tryFinishPoints(maps, pack, task, raw);
      if (ptHit) return ptHit;

      var axisHit = tryAxisFirst(maps, pack, task, raw, st);
      if (axisHit) return axisHit;

      var marked = parseMarkedUnknown(raw, task);
      if (marked) {
        st.letter = marked.letter;
        return acceptStep(maps, task, marked.show, "נכון. עכשיו הציבו בנוסחת המרחק.");
      }

      var letter = st.letter || (task.letter && String(task.letter).toLowerCase()) || "";
      var eq = stripDistTag(raw);
      var sides = splitEq(eq);
      if (!sides && hasSqrt(eq)) sides = { L: eq, R: "" };

      if (isEqualTask(task) && !hasSqrt(raw) && /^[A-Za-z]{1,2}=[A-Za-z]{1,2}$/.test(normEq(raw))) {
        st.equated = true;
        return acceptStep(
          maps,
          task,
          raw.replace(/\s+/g, ""),
          "נכון. המרחקים שווים. עכשיו כתבו את נוסחאות המרחק והשוו."
        );
      }

      if (isEqualTask(task) && sides && hasSqrt(sides.L) && hasSqrt(sides.R)) {
        var iL = extractSqrtInner(sides.L);
        var iR = extractSqrtInner(sides.R);
        letter = inferLetter(pack, task, (iL || "") + "+" + (iR || ""), letter);
        var legL = matchEqualLeg(pack, task, iL, letter);
        var legR = matchEqualLeg(pack, task, iR, letter);
        if (!legL || !legR || legL === legR) {
          return {
            ok: false,
            message: "ההצבה בנוסחאות המרחק עדיין לא מדויקת. " + formulaShowEqual(pack, task, letter || "x"),
          };
        }
        st.letter = letter;
        st.eqFrom = true;
        st.eqTo = true;
        st.equated = true;
        return acceptStep(
          maps,
          task,
          raw.replace(/\s+/g, ""),
          "נכון. עכשיו העלו בריבוע את שני האגפים כדי לבטל את השורשים."
        );
      }

      if (isEqualTask(task) && sides && (hasSqrt(sides.L) || hasSqrt(sides.R)) && !(st.squared && last && !hasSqrt(last))) {
        var sqrtSideE = hasSqrt(sides.L) ? sides.L : sides.R;
        var otherE = hasSqrt(sides.L) ? sides.R : sides.L;
        var innerE = extractSqrtInner(sqrtSideE);
        if (innerE && /\^2|²/.test(innerE) && (!otherE || !hasSqrt(otherE))) {
          letter = inferLetter(pack, task, innerE, letter);
          var which = matchEqualLeg(pack, task, innerE, letter);
          if (!which) {
            return {
              ok: false,
              message: "ההצבה בנוסחת המרחק עדיין לא מדויקת. " + formulaShow(pack, task, letter || "x"),
            };
          }
          st.letter = letter;
          if (which === "from") st.eqFrom = true;
          if (which === "to") st.eqTo = true;
          var bothEq = !!(st.eqFrom && st.eqTo);
          return acceptStep(
            maps,
            task,
            raw.replace(/\s+/g, ""),
            bothEq
              ? "נכון. עכשיו השוו את שני הביטויים, או העלו בריבוע את שני האגפים."
              : "נכון. עכשיו כתבו את נוסחת המרחק גם לקטע השני, או השוו את שני הביטויים."
          );
        }
      }

      if (isEqualTask(task) && last && hasSqrt(last) && sides && !hasSqrt(raw)) {
        var prevEq = splitEq(stripDistTag(last));
        var lastTwo = prevEq && hasSqrt(prevEq.L) && hasSqrt(prevEq.R);
        if (lastTwo || st.equated) {
          letter = st.letter || inferLetter(pack, task, sides.L + sides.R, letter);
          var sqL = matchEqualLeg(pack, task, sides.L, letter);
          var sqR = matchEqualLeg(pack, task, sides.R, letter);
          if (sqL && sqR && sqL !== sqR) {
            st.letter = letter;
            st.squared = true;
            st.mixedStart = asX(eq, letter);
            return acceptStep(maps, task, raw.replace(/\s+/g, ""), "נכון. השורשים בוטלו. המשיכו לפשט ולפתור את המשוואה.");
          }
          if (innersMatchPrev(sides, prevEq, letter)) {
            st.letter = letter;
            st.squared = true;
            st.mixedStart = asX(eq, letter);
            return acceptStep(maps, task, raw.replace(/\s+/g, ""), "נכון. השורשים בוטלו. המשיכו לפשט ולפתור את המשוואה.");
          }
          return {
            ok: false,
            message: "העלו בריבוע את שני האגפים: שני הביטויים שבתוך השורשים, בלי השורש.",
          };
        }
      }

      if (isEqualTask(task) && sides && !hasSqrt(raw)) {
        letter = inferLetter(pack, task, sides.L + "+" + sides.R, letter || st.letter);
        var skL = matchEqualLeg(pack, task, sides.L, letter);
        var skR = matchEqualLeg(pack, task, sides.R, letter);
        if (skL && skR && skL !== skR) {
          st.letter = letter;
          st.squared = true;
          st.mixedStart = asX(eq, letter);
          return acceptStep(maps, task, raw.replace(/\s+/g, ""), "נכון. השורשים בוטלו. המשיכו לפשט ולפתור את המשוואה.");
        }
      }

      if (sides && (hasSqrt(sides.L) || hasSqrt(sides.R)) && !(st.squared && last && !hasSqrt(last))) {
        var sqrtSide = hasSqrt(sides.L) ? sides.L : sides.R;
        var inner = extractSqrtInner(sqrtSide);
        if (inner && /\^2|²/.test(inner)) {
          letter = inferLetter(pack, task, inner, letter);
          if (!innerMatchesExpected(pack, task, inner, letter)) {
            return {
              ok: false,
              message: "ההצבה בנוסחת המרחק עדיין לא מדויקת. " + formulaShow(pack, task, letter || "x"),
            };
          }
          var numSide = hasSqrt(sides.L) ? sides.R : sides.L;
          var dgot = evalMaybePow(numSide);
          var d = distValue(task);
          if (dgot != null && !nearNum(dgot, d) && !nearNum(dgot, d * d)) {
            return { ok: false, message: "המרחק הנתון הוא " + fmtNum(d) + "." };
          }
          st.letter = letter;
          var showF = raw.replace(/\s+/g, "");
          return acceptStep(maps, task, showF, "נכון. עכשיו העלו בריבוע את שני האגפים כדי לבטל את השורש.");
        }
      }

      if (last && hasSqrt(last) && sides && !hasSqrt(raw)) {
        var prevSides = splitEq(stripDistTag(last));
        var d = distValue(task);
        var nL = evalMaybePow(sides.L);
        var nR = evalMaybePow(sides.R);
        var dropped =
          (nL != null && nearNum(nL, d) && !nearNum(nL, d * d)) ||
          (nR != null && nearNum(nR, d) && !nearNum(nR, d * d));
        if (dropped) {
          return {
            ok: false,
            message:
              "כשמבטלים את השורש צריך להעלות בריבוע את שני האגפים: " +
              fmtNum(d) +
              "² = … (כאן " +
              fmtNum(d * d) +
              ").",
          };
        }
        var innerPrev = prevSides ? extractSqrtInner(hasSqrt(prevSides.L) ? prevSides.L : prevSides.R) : null;
        letter = st.letter || inferLetter(pack, task, innerPrev || sides.L + sides.R, letter);
        var innerNext = nL != null && nearNum(nL, d * d) ? sides.R : nR != null && nearNum(nR, d * d) ? sides.L : null;
        if (innerNext && innerMatchesExpected(pack, task, innerNext, letter)) {
          st.letter = letter;
          st.squared = true;
          st.mixedStart = asX(eq, letter);
          return acceptStep(maps, task, raw.replace(/\s+/g, ""), "נכון. השורש בוטל. המשיכו לפשט ולפתור את המשוואה.");
        }
        if (innerPrev && innerNext && evalInner(innerNext, letter, 1) != null) {
          var okInner = true;
          [0, 1, 2, -1].forEach(function (v) {
            var a = evalInner(innerPrev, letter, v);
            var b = evalInner(innerNext, letter, v);
            if (a == null || b == null || Math.abs(a - b) > 1e-5) okInner = false;
          });
          var d2ok = (nL != null && nearNum(nL, d * d)) || (nR != null && nearNum(nR, d * d));
          if (okInner && d2ok) {
            st.letter = letter;
            st.squared = true;
            st.mixedStart = asX(eq, letter);
            return acceptStep(maps, task, raw.replace(/\s+/g, ""), "נכון. השורש בוטל. המשיכו לפשט ולפתור את המשוואה.");
          }
        }
        return {
          ok: false,
          message: "העלו בריבוע את שני האגפים: " + fmtNum(d) + "² = (הביטוי שבתוך השורש).",
        };
      }

      if (sides && !hasSqrt(raw) && (evalMaybePow(sides.L) != null || evalMaybePow(sides.R) != null)) {
        var d2 = distValue(task) * distValue(task);
        var nL2 = evalMaybePow(sides.L);
        var nR2 = evalMaybePow(sides.R);
        var innerTry = nL2 != null && nearNum(nL2, d2) ? sides.R : nR2 != null && nearNum(nR2, d2) ? sides.L : null;
        if (innerTry) {
          letter = inferLetter(pack, task, innerTry, letter || st.letter);
          if (innerMatchesExpected(pack, task, innerTry, letter)) {
            st.letter = letter;
            st.squared = true;
            st.mixedStart = asX(eq, letter);
            return acceptStep(maps, task, raw.replace(/\s+/g, ""), "נכון. השורש בוטל. המשיכו לפשט ולפתור את המשוואה.");
          }
        }
      }

      letter = st.letter || letter || (task.letter && String(task.letter).toLowerCase()) || (unknownAxisOf(task) === "y" ? "y" : task.fromExpr ? "t" : "x");
      var Quad = Q();
      if (Quad && Quad.analyzeMixedStart && Quad.abcEquivalent && sides && !hasSqrt(raw)) {
        var lettersTry = [letter, st.letter, task.letter, "x", "y", "t"];
        var li;
        var seenL = {};
        for (li = 0; li < lettersTry.length; li++) {
          if (!lettersTry[li]) continue;
          var Ltry = String(lettersTry[li]).toLowerCase();
          if (seenL[Ltry]) continue;
          seenL[Ltry] = true;
          try {
            var tp = Quad.analyzeMixedStart(asX(eq, Ltry));
            var mp0 = mixedPackFor(pack, task, Ltry);
            if (tp && mp0 && Quad.abcEquivalent(mp0, tp)) {
              if (!st.letter) st.letter = letter || Ltry;
              st.squared = true;
              st.mixedStart = asX(eq, Ltry);
              extractRootValues(normEq(eq), Ltry).forEach(function (v) {
                addFound(st, v, task);
              });
              var finSkip = finishIfReady(maps, pack, task, raw.replace(/\s+/g, ""));
              if (finSkip) return finSkip;
              return acceptStep(maps, task, raw.replace(/\s+/g, ""), "נכון. המשיכו לפתור את המשוואה.");
            }
          } catch (eSkip) {}
        }
      }
      if (Quad && Quad.checkMixedTyped && (st.squared || (last && !hasSqrt(last)))) {
        var prev = last && !hasSqrt(last) ? last : st.mixedStart;
        if (prev) {
          var mix = Quad.checkMixedTyped(asX(stripDistTag(prev), letter), asX(eq, letter), mixedPackFor(pack, task, letter));
          if (mix && mix.ok) {
            st.squared = true;
            var rootsGot = extractRootValues(normEq(eq), letter);
            rootsGot.forEach(function (v) {
              addFound(st, v, task);
            });
            var doneMix = finishIfReady(maps, pack, task, raw.replace(/\s+/g, ""));
            if (doneMix) return doneMix;
            if (rootsGot.length && !keepComplete(st, task) && task.quadrant === 1) {
              return acceptStep(
                maps,
                task,
                raw.replace(/\s+/g, ""),
                "נכון. זה פתרון של המשוואה. בדקו איזה ערך מתאים לרביע הראשון."
              );
            }
            return acceptStep(maps, task, fromX(mix.message && false ? "" : raw.replace(/\s+/g, ""), letter), mix.message || "נכון. המשיכו לפתור את המשוואה.");
          }
          if (mix && !mix.ok && mix.message && st.squared) {
            var rootsAnyway = extractRootValues(normEq(eq), letter);
            if (rootsAnyway.length) {
              rootsGot = rootsAnyway;
              rootsAnyway.forEach(function (v) {
                addFound(st, v, task);
              });
              var discMsg = null;
              rootsAnyway.forEach(function (v) {
                if (listMatch(v, discardList(task)) && !listMatch(v, keepList(task)) && task.quadrant === 1) {
                  discMsg = "נכון. זה פתרון אלגברי. " + String(task.unknownPoint || "B") + " ברביע הראשון, לכן משאירים רק את הערך החיובי.";
                }
              });
              var fin = finishIfReady(maps, pack, task, raw.replace(/\s+/g, ""));
              if (fin) return fin;
              if (rootsAnyway.length) {
                return acceptStep(maps, task, raw.replace(/\s+/g, ""), discMsg || "נכון. רשמו גם את הפתרון השני, או את הנקודה.");
              }
            }
            return { ok: false, message: fromX(mix.message, letter) };
          }
        }
      }

      var Teach = global.DoctematicaTeach;
      if (Teach && typeof Teach.checkWorkStep === "function" && last && !hasSqrt(last) && !hasSqrt(raw) && sides) {
        var tRes = Teach.checkWorkStep(asX(stripDistTag(last), letter), asX(eq, letter));
        if (tRes && tRes.ok) {
          var rTeach = extractRootValues(normEq(eq), letter);
          rTeach.forEach(function (v) {
            addFound(st, v, task);
          });
          var finT = finishIfReady(maps, pack, task, raw.replace(/\s+/g, ""));
          if (finT) return finT;
          return acceptStep(maps, task, raw.replace(/\s+/g, ""), tRes.message || "נכון. המשיכו.");
        }
      }

      var rootsBare = [];
      [letter, "x", "y", "t", task.letter].forEach(function (L) {
        if (!L) return;
        extractRootValues(normEq(eq || raw), String(L).toLowerCase()).forEach(function (v) {
          if (!rootsBare.some(function (u) { return nearNum(u, v); })) rootsBare.push(v);
        });
      });
      if (rootsBare.length) {
        var qbad = null;
        var onlyDiscard = rootsBare.every(function (v) {
          return listMatch(v, discardList(task)) && !listMatch(v, keepList(task));
        });
        if (onlyDiscard && task.quadrant === 1 && !(st.squared || (last && !hasSqrt(last)))) {
          return {
            ok: false,
            message:
              "זה פתרון אפשרי של המשוואה, אבל " +
              String(task.unknownPoint || "B") +
              " ברביע הראשון — צריך את הערך שמתאים לכל הנתונים.",
          };
        }
        rootsBare.forEach(function (v) {
          addFound(st, v, task);
          if (task.quadrant === 1 && listMatch(v, discardList(task)) && !listMatch(v, keepList(task))) {
            qbad = "נכון. זה פתרון אלגברי. בדקו איזה ערך מתאים לרביע הראשון.";
          }
        });
        var finR = finishIfReady(maps, pack, task, raw.replace(/\s+/g, ""));
        if (finR) return finR;
        if (qbad && onlyDiscard) {
          return acceptStep(maps, task, raw.replace(/\s+/g, ""), qbad);
        }
        return acceptStep(maps, task, raw.replace(/\s+/g, ""), "נכון. רשמו את כל הפתרונות הנדרשים, או את הנקודה.");
      }

      if (st.squared || (last && !hasSqrt(last))) {
        return { ok: false, message: "המשיכו לפשט או לפתור את המשוואה שהתקבלה אחרי ביטול השורש." };
      }
      if (hasSqrt(raw) || /=/.test(raw)) {
        return { ok: false, message: "הציבו בנוסחת המרחק: " + formulaShow(pack, task, letter || "x") };
      }
      return null;
    }

    function canonicalDistUnknownSteps(task, pack) {
      var letter = (task.letter && String(task.letter).toLowerCase()) || (unknownAxisOf(task) === "y" ? "y" : task.fromExpr ? "t" : "x");
      var steps = [];
      if (String(task.onAxis || "").toLowerCase() === "y") steps.push("x = 0");
      if (String(task.onAxis || "").toLowerCase() === "x") steps.push("y = 0");
      if (task.onVertical != null) steps.push("x = " + fmtNum(task.onVertical));
      var lab = String(task.unknownPoint || "").toUpperCase();
      if (lab && !task.fromExpr) {
        var u0 = unknownXY(task, letter);
        steps.push(lab + "(" + u0.x + ";" + u0.y + ")");
      }
      if (isEqualTask(task)) {
        steps.push(formulaShow(pack, task, letter));
        steps.push(formulaShowOther(pack, task, letter));
        steps.push(formulaShowEqual(pack, task, letter));
      } else {
        steps.push(formulaShow(pack, task, letter));
      }
      var seed = String(seedSquared(pack, task, letter)).replace(/\^2/g, "²");
      steps.push(seed);
      var inner = seedInnerDiffs(pack, task, letter);
      if (inner) steps.push(inner);
      var afterSq = seedAfterSquares(pack, task, letter);
      if (afterSq) steps.push(afterSq);
      var combined = seedCombinedSquares(pack, task, letter);
      if (combined) steps.push(combined);
      var Quad = Q();
      if (Quad && Quad.analyzeMixedStart) {
        try {
          var mixSeed = asX(combined || afterSq || inner || seed, letter);
          var mp = Quad.analyzeMixedStart(mixSeed);
          (mp.steps || []).forEach(function (s) {
            if (!s || /כל x|אין פתרון/.test(s) || /^0=0$/.test(normEq(s))) return;
            var line = fromX(s, letter);
            var seen = steps.some(function (prev) {
              return normEq(prev) === normEq(line);
            });
            if (!seen) steps.push(line);
          });
        } catch (e) {}
      }
      var kind = String(task.resultKind || "point");
      if (kind === "param" || kind === "coord") {
        keepList(task).forEach(function (r) {
          steps.push((task.letter || letter) + " = " + fmtRoot(r));
        });
      }
      (task.answers || []).forEach(function (a) {
        var nm = lab || "P";
        steps.push(nm + formatPointPair(a.x, a.y));
      });
      return steps;
    }

    function distUnknownWouldAccept(typed, pack, progress, lastNorm) {
      var s = String(typed || "").trim();
      if (!s) return false;
      if (/^\s*a\s*=/i.test(s) && /b\s*=/i.test(s)) return false;
      if (lastNorm && normEq(s) === lastNorm) return false;
      if (/^[xy]\s*[+\-−].*=\s*0$/i.test(s.replace(/\s+/g, "")) && !/\^2|²|x\(/i.test(s)) return false;
      var probe = {
        done: Object.assign({}, progress.done || {}),
        partial: Object.assign({}, progress.partial || {}),
        lastExpr: Object.assign({}, progress.lastExpr || {}),
        coords: JSON.parse(JSON.stringify(progress.coords || {})),
        distUnk: JSON.parse(JSON.stringify(progress.distUnk || {})),
        footCoords: progress.footCoords || {},
        draw: progress.draw || null,
      };
      var pending = (pack.tasks || []).filter(function (t) {
        return !(probe.done && probe.done[t.id]);
      });
      var hit = checkDistUnknown(s, pack, probe, pending, probe.done, probe.partial, probe.coords);
      return !!(hit && hit.ok);
    }

    function isEarlyDistUnknownMark(s) {
      var t = String(s || "").replace(/\s+/g, "");
      if (/^[xy]=0$/i.test(t)) return true;
      if (/^[A-Za-z]\([^)]*[xyt][^)]*\)$/i.test(t) && /[xyt]/i.test(t.split(";")[1] || "")) return true;
      return false;
    }

    function nextDistUnknownStep(task, pack, progress) {
      var steps = canonicalDistUnknownSteps(task, pack);
      var last = progress.lastExpr && progress.lastExpr[task.id];
      var letter = (stOf(progress, task.id).letter || task.letter || (unknownAxisOf(task) === "y" ? "y" : task.fromExpr ? "t" : "x"));
      if (!last) return steps[0] || formulaShow(pack, task, "x");
      var nLast = normEq(last);
      var i;
      var idx = -1;
      for (i = 0; i < steps.length; i++) {
        if (normEq(steps[i]) === nLast) idx = i;
      }
      var st = stOf(progress, task.id);
      var start = idx >= 0 ? idx + 1 : 0;
      var j;
      if ((st.squared || (last && !hasSqrt(last) && /=/.test(String(last)))) && idx < 0) {
        var si;
        for (si = 0; si < steps.length; si++) {
          if (!hasSqrt(steps[si]) && /[xy]\^2|[xy]²/i.test(String(steps[si]).replace(/²/g, "^2"))) start = si + 1;
        }
      }
      for (j = start; j < steps.length; j++) {
        if ((st.squared || (last && !hasSqrt(last))) && (hasSqrt(steps[j]) || isEarlyDistUnknownMark(steps[j]))) continue;
        if (distUnknownWouldAccept(steps[j], pack, progress, nLast)) return steps[j];
      }
      if (hasSqrt(last) && !st.squared) {
        return String(seedSquared(pack, task, letter)).replace(/\^2/g, "²");
      }
      var Quad = Q();
      if (Quad && Quad.nextMixedStep && last && !hasSqrt(last)) {
        var nxt = Quad.nextMixedStep(asX(last, letter), mixedPackFor(pack, task, letter));
        if (nxt && nxt.eq) {
          var shown = fromX(nxt.eq, letter);
          if (distUnknownWouldAccept(shown, pack, progress, nLast)) return shown;
        }
      }
      var kind = String(task.resultKind || "point");
      var keeps = keepList(task);
      var found = (st.found || []).slice();
      var remaining = keeps.filter(function (r) {
        return !found.some(function (f) {
          return nearNum(f, r);
        });
      });
      function notLast(s) {
        return s && normEq(s) !== nLast;
      }
      if (keeps.length) {
        var rootLine = keeps
          .map(function (r) {
            return letter + " = " + fmtRoot(r);
          })
          .join(", ");
        if (notLast(rootLine) && distUnknownWouldAccept(rootLine, pack, progress, nLast)) return rootLine;
        var restLine = remaining
          .map(function (r) {
            return letter + " = " + fmtRoot(r);
          })
          .join(", ");
        if (restLine && notLast(restLine) && distUnknownWouldAccept(restLine, pack, progress, nLast)) return restLine;
        if (remaining.length && notLast(letter + " = " + fmtRoot(remaining[0])) && distUnknownWouldAccept(letter + " = " + fmtRoot(remaining[0]), pack, progress, nLast)) {
          return letter + " = " + fmtRoot(remaining[0]);
        }
      }
      var ans = (task.answers || [])[0];
      if (ans && kind !== "param" && kind !== "coord") {
        var pt = String(task.unknownPoint || task.label || "P") + formatPointPair(ans.x, ans.y);
        if (notLast(pt) && distUnknownWouldAccept(pt, pack, progress, nLast)) return pt;
        var pts = (task.answers || [])
          .map(function (a) {
            return String(task.unknownPoint || task.label || "P") + formatPointPair(a.x, a.y);
          })
          .join(", ");
        if (notLast(pts) && distUnknownWouldAccept(pts, pack, progress, nLast)) return pts;
      }
      if (remaining.length && notLast(letter + " = " + fmtRoot(remaining[0]))) {
        return letter + " = " + fmtRoot(remaining[0]);
      }
      if (ans && notLast(String(task.unknownPoint || task.label || "P") + formatPointPair(ans.x, ans.y))) {
        return String(task.unknownPoint || task.label || "P") + formatPointPair(ans.x, ans.y);
      }
      if (notLast(formulaShow(pack, task, letter))) return formulaShow(pack, task, letter);
      return remaining.length ? letter + " = " + fmtRoot(remaining[0]) : null;
    }

    function distUnknownHintMessage(task, pack, progress) {
      var last = progress.lastExpr && progress.lastExpr[task.id];
      var st = stOf(progress, task.id);
      if (!last && String(task.onAxis || "").toLowerCase() === "x" && !st.known) {
        return "הנקודה על ציר x, לכן y = 0. אחר כך הציבו בנוסחת המרחק.";
      }
      if (!last && task.yLine && near0(Number(task.yLine.m)) && !st.known) {
        return (
          "הנקודה על הישר y = " +
          fmtNum(task.yLine.b) +
          ", לכן אפשר לסמן " +
          String(task.unknownPoint || "P") +
          "(x;" +
          fmtNum(task.yLine.b) +
          ")."
        );
      }
      if (!last && task.yLine && !near0(Number(task.yLine.m))) {
        var uH = unknownXY(task, st.letter || task.letter || "x");
        return (
          "הנקודה על הישר, לכן אפשר לסמן " +
          String(task.unknownPoint || "P") +
          "(" +
          uH.x +
          ";" +
          uH.y +
          "). אחר כך הציבו בנוסחת המרחק."
        );
      }
      if (!last && isEqualTask(task) && !hasSqrt(String(last || ""))) {
        var uE = unknownXY(task, st.letter || task.letter || "x");
        return (
          "סמנו את הנקודה " +
          String(task.unknownPoint || "A") +
          "(" +
          uE.x +
          ";" +
          uE.y +
          "). המרחק שווה משתי הנקודות, לכן " +
          segName(task, task.equalFrom) +
          " = " +
          segName(task, task.equalTo) +
          "."
        );
      }
      if (!last && String(task.onAxis || "").toLowerCase() === "y" && !st.known) {
        return "הנקודה על ציר y, לכן x = 0. אחר כך הציבו בנוסחת המרחק.";
      }
      if (!last && task.onVertical != null && !st.known) {
        return (
          String(task.unknownPoint || "B") +
          " על הישר x = " +
          fmtNum(task.onVertical) +
          ", לכן x = " +
          fmtNum(task.onVertical) +
          ". אחר כך הציבו בנוסחת המרחק."
        );
      }
      if (!last || (last && !hasSqrt(last) && !st.squared && !/=/.test(String(last)))) {
        if (!hasSqrt(String(last || ""))) {
          return "הציבו בנוסחת המרחק עם הנעלם: " + formulaShow(pack, task, st.letter || task.letter || (unknownAxisOf(task) === "y" ? "y" : task.fromExpr ? "t" : "x"));
        }
      }
      if (last && hasSqrt(last) && !st.squared) {
        if (isEqualTask(task) && !(st.eqFrom && st.eqTo) && !st.equated && String(last).split("√").length < 3) {
          return (
            "כתבו גם את נוסחת המרחק לקטע השני, או השוו: " + formulaShowEqual(pack, task, st.letter || task.letter || "x")
          );
        }
        return isEqualTask(task)
          ? "העלו בריבוע את שני האגפים כדי לבטל את שני השורשים."
          : "העלו בריבוע את שני האגפים. אפשר באותו צעד להחליף מינוס-מינוס ב־+, למשל (2−(−3))² ל־(2+3)².";
      }
      if (last && st.squared && /\([^)]*[+\-−][^)]*\)²/.test(String(last).replace(/\^2/g, "²"))) {
        return "חשבו קודם את הפנים של הסוגריים, אחר כך את הריבועים, ואז חברו איברים דומים.";
      }
      var letter = st.letter || task.letter || (unknownAxisOf(task) === "y" ? "y" : task.fromExpr ? "t" : "x");
      if (keepComplete(st, task) && String(task.resultKind || "point") === "point") {
        return (
          "רשמו את הנקודה " +
          String(task.unknownPoint || "B") +
          "(x;y) לפי הערך שמתאים לנתונים" +
          (task.quadrant === 1 ? " (רביע ראשון)." : ".")
        );
      }
      var Quad = Q();
      if (Quad && Quad.mixedHintFor && last && !hasSqrt(last)) {
        return fromX(Quad.mixedHintFor(mixedPackFor(pack, task, letter), asX(last, letter)), letter);
      }
      return "המשיכו לפתור את המשוואה, ואז בדקו אילו פתרונות מתאימים לנתוני השאלה.";
    }

    function applyDistUnknownAlgebra(typed, pack, progress) {
      var hits = preferPartTasks(
        (pack.tasks || []).filter(function (t) {
          return t.kind === "distUnknown" && !(progress.done && progress.done[t.id]);
        }),
        pack,
        progress
      );
      if (!hits.length) return null;
      var task = hits[0];
      var maps = cloneMaps(progress.done || {}, progress.partial || {}, progress.coords || {}, progress);
      var st = ensureSt(maps, task.id);
      var letter = st.letter || (task.letter && String(task.letter).toLowerCase()) || (unknownAxisOf(task) === "y" ? "y" : task.fromExpr ? "t" : "x");
      var raw = String(typed || "").trim();
      var show = fromX(raw.replace(/\s+/g, ""), letter);
      [letter, "x", "y", "t", task.letter].forEach(function (L) {
        if (!L) return;
        extractRootValues(normEq(raw), String(L).toLowerCase()).forEach(function (v) {
          addFound(st, v, task);
        });
      });
      st.squared = true;
      st.letter = letter;
      var kind = String(task.resultKind || "point");
      if (kind !== "point") {
        var fin = finishIfReady(maps, pack, task, show);
        if (fin) return fin;
      }
      var msg = "נכון. רשמו את הנקודה שמתאימה לנתונים.";
      if (task.quadrant === 1 && discardList(task).length) {
        msg =
          "נכון. אלה פתרונות המשוואה. " +
          String(task.unknownPoint || "B") +
          " ברביע הראשון — רשמו רק את הנקודה עם הערך החיובי.";
      }
      return acceptStep(maps, task, show, msg);
    }

    return {
      checkDistUnknown: checkDistUnknown,
      applyDistUnknownAlgebra: applyDistUnknownAlgebra,
      canonicalDistUnknownSteps: canonicalDistUnknownSteps,
      nextDistUnknownStep: nextDistUnknownStep,
      distUnknownHintMessage: distUnknownHintMessage,
    };
  }

  global.DoctematicaGeoDistUnknown = { install: install };
})(window);
