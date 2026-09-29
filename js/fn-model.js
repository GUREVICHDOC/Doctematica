(function (global) {
  var EPS = 1e-8;

  function near0(n) {
    return Math.abs(Number(n)) < EPS;
  }

  function near(a, b) {
    return Math.abs(Number(a) - Number(b)) < 1e-6;
  }

  function algebra() {
    return global.DoctematicaAlgebra;
  }

  function terminatingPlaces(n, maxPlaces) {
    var i;
    for (i = 0; i <= maxPlaces; i++) {
      var scale = Math.pow(10, i);
      var scaled = Number(n) * scale;
      if (Math.abs(scaled - Math.round(scaled)) < 1e-6) {
        var val = Math.round(scaled) / scale;
        if (Math.abs(val - Number(n)) < 1e-6) return i;
      }
    }
    return null;
  }

  function formatDecimal(n, places) {
    if (!places) return String(Math.round(Number(n))).replace(/-/g, "−");
    var scale = Math.pow(10, places);
    var s = (Math.round(Number(n) * scale) / scale).toFixed(places);
    return s.replace(/0+$/, "").replace(/\.$/, "").replace(/-/g, "−");
  }

  function fmt(n) {
    if (near0(n)) return "0";
    var places = terminatingPlaces(n, 4);
    if (places != null) return formatDecimal(n, places);
    var den;
    for (den = 1; den <= 16; den++) {
      var num = Math.round(Number(n) * den);
      if (Math.abs(Number(n) * den - num) < 1e-6) {
        var g = den;
        var a = Math.abs(num);
        var b = den;
        while (b) {
          var t = b;
          b = a % b;
          a = t;
        }
        g = a || 1;
        var nn = num / g;
        var dd = den / g;
        if (dd === 1) return String(nn).replace(/-/g, "−");
        return (nn + "/" + dd).replace(/-/g, "−");
      }
    }
    var A = algebra();
    if (A && A.formatNumber) return String(A.formatNumber(n)).split(" או ")[0].replace(/-/g, "−");
    return String(Math.round(n * 1000) / 1000).replace(/-/g, "−");
  }

  /** A fraction written in the given expression stays a fraction. */
  function fmtMatch(n, expr) {
    var s = ascii(expr || "");
    var re = /-?\d+\/\d+/g;
    var m;
    while ((m = re.exec(s))) {
      var v = evalNumeric(m[0]);
      if (v != null && near(v, n)) return m[0].replace(/-/g, "−");
    }
    return fmt(n);
  }

  /** Keep a decimal the student wrote, or a fraction they chose. */
  function asWritten(token, value) {
    var t = ascii(token);
    if (!t) return null;
    var n = evalNumeric(t);
    if (n == null || !near(n, value)) return null;
    if (/^-?\d+\.\d+$/.test(t)) {
      var cleaned = t.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
      return cleaned.replace(/-/g, "−");
    }
    if (/^-?\d+\/\d+$/.test(t)) return t.replace(/-/g, "−");
    return null;
  }

  function ascii(s) {
    return String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/[×·]/g, "*")
      .replace(/\s+/g, "");
  }

  function pretty(expr) {
    var s = ascii(expr).replace(/-/g, "−");
    var out = "";
    var i;
    for (i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      var prev = i > 0 ? s.charAt(i - 1) : "";
      if ((c === "+" || c === "−") && prev && prev !== "(" && prev !== "+" && prev !== "−") {
        out += " " + c + " ";
      } else out += c;
    }
    return out;
  }

  function evalNumeric(text) {
    var A = algebra();
    var t = ascii(text);
    if (!t) return null;
    if (A) {
      try {
        var eq = A.parseEquation("0=(" + t + ")");
        if (near0(eq.right.a)) return eq.right.b;
      } catch (err) {
        /* ביטוי עם חזקה או שבר — ממשיכים למנוע החישוב הריבועי */
      }
    }
    var Q = global.DoctematicaQuadratic;
    if (!Q || !Q.evalExpr) return null;
    try {
      var expr = t.charAt(0) === "-" && t.charAt(1) === "(" ? "(-1)*" + t.slice(1) : t;
      var v = Q.evalExpr(expr);
      return v != null && isFinite(v) ? v : null;
    } catch (err2) {
      return null;
    }
  }

  function quadOf(text) {
    var Q = global.DoctematicaQuadratic;
    if (!Q || !Q.parseABC) return null;
    try {
      return Q.parseABC(text + "=0");
    } catch (err) {
      return null;
    }
  }

  function analyze(expr) {
    var text = ascii(expr);
    if (!text) return null;
    var poly = quadOf(text);
    if (poly) {
      var a = poly.a;
      var b = poly.b;
      var c = poly.c;
      var degree = !near0(a) ? 2 : !near0(b) ? 1 : 0;
      var roots = [];
      if (degree === 2) {
        var disc = b * b - 4 * a * c;
        if (disc > EPS) {
          var s = Math.sqrt(disc);
          roots = [(-b - s) / (2 * a), (-b + s) / (2 * a)];
        } else if (disc >= -EPS) {
          roots = [-b / (2 * a)];
        }
      } else if (degree === 1) {
        roots = [-c / b];
      }
      roots.sort(function (p, q) { return p - q; });
      return {
        expr: text,
        display: pretty(text),
        coeffs: [c, b, a],
        a: a,
        b: b,
        c: c,
        degree: degree,
        identZero: degree === 0 && near0(c),
        roots: roots,
      };
    }
    var A = algebra();
    if (!A) return null;
    var eq;
    try {
      eq = A.parseEquation("0=(" + text + ")");
    } catch (err) {
      return null;
    }
    var slope = eq.right.a;
    var intercept = eq.right.b;
    var linDegree = near0(slope) ? 0 : 1;
    var linRoots = [];
    if (linDegree === 1) linRoots.push(-intercept / slope);
    return {
      expr: text,
      display: pretty(text),
      coeffs: [intercept, slope, 0],
      a: 0,
      b: slope,
      c: intercept,
      degree: linDegree,
      identZero: linDegree === 0 && near0(intercept),
      roots: linRoots,
    };
  }

  function evalAt(fn, x) {
    if (!fn) return null;
    var t = Number(x);
    return (fn.coeffs[2] || 0) * t * t + (fn.coeffs[1] || 0) * t + (fn.coeffs[0] || 0);
  }

  function vertex(fn) {
    if (!fn || fn.degree !== 2 || near0(fn.a)) return null;
    var x = -fn.b / (2 * fn.a);
    return { x: x, y: evalAt(fn, x), kind: fn.a > 0 ? "min" : "max" };
  }

  function trendOf(fn) {
    if (!fn || fn.degree === 0 || (fn.degree < 2 && near0(fn.coeffs[1]))) return "flat";
    if (fn.degree >= 2) return fn.a > 0 ? "up" : "down";
    return fn.coeffs[1] > 0 ? "inc" : "dec";
  }

  function signRegions(fn) {
    if (!fn) return [];
    if (fn.identZero) return [{ from: "-inf", to: "inf", sign: "zero" }];
    if (fn.degree === 0) {
      return [{ from: "-inf", to: "inf", sign: fn.coeffs[0] > 0 ? "pos" : "neg" }];
    }
    if (fn.degree >= 2) {
      var roots = fn.roots || [];
      var up = fn.a > 0;
      if (!roots.length) {
        return [{ from: "-inf", to: "inf", sign: up ? "pos" : "neg" }];
      }
      if (roots.length === 1) {
        return [
          { from: "-inf", to: roots[0], sign: up ? "pos" : "neg" },
          { from: roots[0], to: "inf", sign: up ? "pos" : "neg" },
        ];
      }
      var lo = roots[0];
      var hi = roots[roots.length - 1];
      if (up) {
        return [
          { from: "-inf", to: lo, sign: "pos" },
          { from: lo, to: hi, sign: "neg" },
          { from: hi, to: "inf", sign: "pos" },
        ];
      }
      return [
        { from: "-inf", to: lo, sign: "neg" },
        { from: lo, to: hi, sign: "pos" },
        { from: hi, to: "inf", sign: "neg" },
      ];
    }
    var root = fn.roots[0];
    var right = fn.coeffs[1] > 0 ? "pos" : "neg";
    var left = right === "pos" ? "neg" : "pos";
    return [
      { from: "-inf", to: root, sign: left },
      { from: root, to: "inf", sign: right },
    ];
  }

  function monoRegions(fn) {
    if (fn && fn.degree >= 2) {
      var v = vertex(fn);
      if (!v) return [{ from: "-inf", to: "inf", trend: "flat" }];
      if (fn.a > 0) {
        return [
          { from: "-inf", to: v.x, trend: "dec" },
          { from: v.x, to: "inf", trend: "inc" },
        ];
      }
      return [
        { from: "-inf", to: v.x, trend: "inc" },
        { from: v.x, to: "inf", trend: "dec" },
      ];
    }
    var trend = trendOf(fn);
    if (trend === "flat") return [{ from: "-inf", to: "inf", trend: "flat" }];
    return [{ from: "-inf", to: "inf", trend: trend }];
  }

  function axisSide(n) {
    if (n == null || n === "none") return "none";
    if (typeof n === "string") return n;
    if (near0(n)) return "origin";
    return n > 0 ? "pos" : "neg";
  }

  /** מה מצפים לראות בשרטוט — לפי הפונקציה, לא לפי מספר תרגיל. */
  function sketchExpectations(fn) {
    var trend = trendOf(fn);
    var y = fn.coeffs[0];
    var xSide = "none";
    if (fn.roots && fn.roots.length === 1) {
      var r = fn.roots[0];
      xSide = near0(r) ? "origin" : r > 0 ? "right" : "left";
    } else if (fn.roots && fn.roots.length > 1) {
      xSide = "many";
    }
    var ySide = near0(y) ? "origin" : y > 0 ? "above" : "below";
    if (fn.degree >= 2) {
      var v = vertex(fn);
      return {
        family: "parabola",
        degree: fn.degree,
        opens: fn.a > 0 ? "up" : "down",
        vertex: v,
        xHits: (fn.roots || []).length,
        xSide: xSide,
        ySide: ySide,
        y0: fn.coeffs[0],
        roots: (fn.roots || []).slice(),
      };
    }
    return {
      family: fn.degree <= 1 ? "line" : "curve",
      degree: fn.degree,
      trend: trend,
      xSide: xSide,
      ySide: ySide,
    };
  }

  function scaleOf(fn, extraXs) {
    var maxAbs = 1;
    function consider(v) {
      var n = Math.abs(Number(v));
      if (isFinite(n) && n > maxAbs) maxAbs = n;
    }
    consider(evalAt(fn, 0));
    (fn.roots || []).forEach(function (x) {
      consider(x);
      consider(evalAt(fn, x));
    });
    (extraXs || []).forEach(function (x) {
      consider(x);
      consider(evalAt(fn, x));
    });
    var v = vertex(fn);
    if (v) {
      consider(v.x);
      consider(v.y);
    }
    var unit = 0.78 / maxAbs;
    return { unit: unit, span: maxAbs * 1.05, maxAbs: maxAbs };
  }

  function curveSamples(fn, scale) {
    var raw = [];
    var steps = 48;
    var i;
    for (i = 0; i <= steps; i++) {
      var x = -scale.span + (2 * scale.span * i) / steps;
      raw.push({ qx: x * scale.unit, qy: evalAt(fn, x) * scale.unit });
    }
    var limit = 1.02;
    function inside(p) {
      return Math.abs(p.qx) <= limit && Math.abs(p.qy) <= limit;
    }
    function cross(a, b) {
      var out = Math.abs(a.qy) > limit || Math.abs(a.qx) > limit ? a : b;
      var axis = Math.abs(out.qy) >= Math.abs(out.qx) ? "y" : "x";
      var bound = (axis === "y" ? out.qy : out.qx) > 0 ? limit : -limit;
      var denom = axis === "y" ? b.qy - a.qy : b.qx - a.qx;
      var t = denom ? (bound - (axis === "y" ? a.qy : a.qx)) / denom : 0;
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      return { qx: a.qx + t * (b.qx - a.qx), qy: a.qy + t * (b.qy - a.qy) };
    }
    var samples = [];
    for (i = 0; i < raw.length; i++) {
      var p = raw[i];
      var prev = i ? raw[i - 1] : null;
      var nowIn = inside(p);
      var prevIn = prev ? inside(prev) : false;
      if (nowIn) {
        if (prev && !prevIn) samples.push(cross(prev, p));
        samples.push({ qx: p.qx, qy: p.qy });
      } else if (prevIn) {
        samples.push(cross(prev, p));
      }
    }
    return samples;
  }

  /** נקודות על הגרף, אם יש, ואז העקומה — באותו קנה מידה של השרטוט. */
  function sketchGuide(fn) {
    if (!fn) return { points: [], line: null, curve: null };
    var raw = [];
    function add(x, y) {
      var i;
      for (i = 0; i < raw.length; i++) {
        if (near(raw[i].x, x) && near(raw[i].y, y)) return;
      }
      raw.push({ x: Number(x), y: Number(y) });
    }
    var v = vertex(fn);
    if (fn.degree >= 2 && v) add(v.x, v.y);
    add(0, evalAt(fn, 0));
    (fn.roots || []).forEach(function (x) { add(x, 0); });
    if (fn.degree < 2 && v) add(v.x, v.y);
    var scale = scaleOf(fn, raw.map(function (p) { return p.x; }));
    var points = raw.map(function (p) {
      return { x: p.x, y: p.y, qx: p.x * scale.unit, qy: p.y * scale.unit };
    });
    if (fn.degree >= 2) {
      return { points: points, line: null, curve: curveSamples(fn, scale) };
    }
    return {
      points: points,
      curve: null,
      line: {
        x1: -scale.span * scale.unit,
        y1: evalAt(fn, -scale.span) * scale.unit,
        x2: scale.span * scale.unit,
        y2: evalAt(fn, scale.span) * scale.unit,
      },
    };
  }

  function labelSpot(fn, label) {
    if (!label) return null;
    if (label.at === "y") return { x: 0, y: evalAt(fn, 0) };
    if (label.at === "vertex") return vertex(fn);
    if (label.at === "x") {
      var roots = (fn.roots || []).slice().sort(function (a, b) { return a - b; });
      var pick = label.order === "right" ? roots[roots.length - 1] : roots[0];
      if (pick == null) return null;
      return { x: pick, y: 0 };
    }
    return null;
  }

  function figureGeometry(fn, marks, labels) {
    marks = marks || [];
    var scale = scaleOf(fn, marks);
    var placed = marks.map(function (x) {
      return { qx: Number(x) * scale.unit, label: "x=" + fmt(x) };
    });
    (labels || []).forEach(function (label) {
      var spot = labelSpot(fn, label);
      if (!spot) return;
      placed.push({
        qx: spot.x * scale.unit,
        qy: spot.y * scale.unit,
        label: label.text || label.name,
      });
    });
    var geo = { marks: placed };
    if (fn.degree >= 2) {
      geo.curve = curveSamples(fn, scale);
      geo.opens = fn.a > 0 ? "up" : "down";
      return geo;
    }
    geo.line = {
      x1: -scale.span * scale.unit,
      y1: evalAt(fn, -scale.span) * scale.unit,
      x2: scale.span * scale.unit,
      y2: evalAt(fn, scale.span) * scale.unit,
    };
    return geo;
  }

  function absToken(at) {
    var abs = Math.abs(Number(at));
    if (!isFinite(abs)) return null;
    if (Math.abs(abs - Math.round(abs)) < 1e-6) return String(Math.round(abs));
    var frac = fmt(abs).replace(/−/g, "-");
    if (/^\d+\/\d+$/.test(frac) || /^\d+\.\d+$/.test(frac)) return frac;
    return null;
  }

  function unaryMinusAt(s, index) {
    if (s.charAt(index) !== "-") return false;
    if (index === 0) return true;
    return /[+\-*/^(=,]$/.test(s.charAt(index - 1));
  }

  /** Power of a negative number written as −2^2 or −(2)^2 instead of (−2)^2. */
  function bareNegativePower(text, at) {
    if (!(Number(at) < 0)) return null;
    var want = absToken(at);
    if (!want) return null;
    var s = ascii(text).replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4");
    var i;
    for (i = 0; i < s.length; i++) {
      if (s.charAt(i) !== "^") continue;
      var j = i - 1;
      if (j < 0) continue;
      if (s.charAt(j) === ")") {
        var depth = 1;
        var k = j - 1;
        while (k >= 0 && depth > 0) {
          if (s.charAt(k) === ")") depth += 1;
          else if (s.charAt(k) === "(") depth -= 1;
          k -= 1;
        }
        if (depth !== 0) continue;
        var inside = s.slice(k + 2, j);
        if (inside === "-" + want) continue;
        if (inside === want && unaryMinusAt(s, k)) return "-" + want;
        continue;
      }
      var end = i;
      while (j >= 0 && /[0-9.]/.test(s.charAt(j))) j -= 1;
      if (j >= 0 && s.charAt(j) === "/" && j > 0) {
        var denEnd = j;
        j -= 1;
        while (j >= 0 && /[0-9]/.test(s.charAt(j))) j -= 1;
        if (unaryMinusAt(s, j) && s.slice(j + 1, end) === want) return "-" + want;
        continue;
      }
      if (unaryMinusAt(s, j) && s.slice(j + 1, end) === want) return "-" + want;
    }
    return null;
  }

  function substText(fn, x, spell) {
    var num = spell ? ascii(spell) : fmt(x).replace(/−/g, "-");
    var tok = Number(x) < 0 || num.indexOf("/") >= 0 ? "(" + num + ")" : num;
    var power = tok + "^2";
    var out = String(fn.expr).replace(/(\d)x\^2/gi, "$1*" + power);
    out = out.replace(/(^|[^0-9.)])x\^2/gi, function (_, pre) {
      if (pre === "-") return "-1*" + power;
      return (pre || "") + power;
    });
    out = out.replace(/(\d)x/gi, "$1*" + tok);
    out = out.replace(/x/gi, tok);
    out = out.replace(/(\d|\))(\()/g, "$1*$2");
    return pretty(out);
  }

  function fnCallText(x, rhs, spell) {
    var arg = spell ? String(spell).replace(/-/g, "−") : fmt(x);
    return "f(" + arg + ") = " + rhs;
  }

  function zeroEquation(fn) {
    return pretty(fn.expr) + " = 0";
  }

  function parseFnCall(typed) {
    var s = ascii(typed);
    var m = s.match(/^f\(([^)]+)\)=(.+)$/i);
    if (!m) return null;
    if (/^x$/i.test(m[1])) return { arg: "x", rhs: m[2] };
    var n = evalNumeric(m[1]);
    if (n == null || !isFinite(n)) return null;
    return { arg: n, rhs: m[2] };
  }

  function parseYValue(typed) {
    var m = ascii(typed).match(/^y=(.+)$/i);
    if (!m) return null;
    return { rhs: m[1] };
  }

  function parseYesNo(typed) {
    var t = ascii(typed).replace(/[.:!?]/g, "");
    if (!t) return null;
    if (/^(כן|yes)$/i.test(t)) return true;
    if (/^(לא|no)$/i.test(t)) return false;
    return null;
  }

  function bareNumber(text) {
    var t = ascii(text);
    if (!t || /[xX()]/.test(t)) return null;
    if (/^[+-]?\d+\/\d+$/.test(t)) return evalNumeric(t);
    if (/[+\-*/]/.test(t.replace(/^-/, ""))) return null;
    return evalNumeric(t);
  }

  function containsAt(rhs, at) {
    var t = ascii(rhs);
    var frac = fmt(at).replace(/−/g, "-");
    if (frac && t.indexOf(frac) >= 0) return true;
    var re = /-?\d+\.\d+|-?\d+\/\d+/g;
    var m;
    while ((m = re.exec(t))) {
      var n = evalNumeric(m[0]);
      if (n != null && near(n, at)) return true;
    }
    if (near0(at)) return /0/.test(t);
    var key = String(Math.abs(Math.round(at * 1000) / 1000));
    if (key.indexOf(".") >= 0) key = key.replace(/0+$/, "").replace(/\.$/, "");
    return t.indexOf(key) >= 0;
  }

  function isAllReals(text) {
    var t = String(text || "")
      .replace(/\s+/g, "")
      .replace(/[∈∊]/g, "");
    if (!t) return false;
    if (/^(ℝ|R|כלx|לכלx|כלמספר|כלמספרממשי|כלממשי|כלממשיים|x∈ℝ|x∈R|ℝ|כלx∈ℝ)$/i.test(t)) return true;
    if (/כל/.test(t) && /x/i.test(t)) return true;
    if (t === "ℝ" || /^x∈/.test(t)) return true;
    return false;
  }

  function isEmptySet(text) {
    var t = String(text || "").replace(/\s+/g, "");
    if (!t) return false;
    if (t === "∅" || t === "{}" || t === "Ø") return true;
    if (/^(אין|איןתחום|לאקיים|לאקיימת|קבוצהריקה|איןחיתוך|איןנקודה|איןנקודתחיתוך)$/.test(t)) return true;
    if (/^אין/.test(t) && /חיתוך|תחום|נקוד/.test(t)) return true;
    return false;
  }

  function parseBound(token) {
    if (token == null) return null;
    var t = ascii(token);
    if (/^(∞|inf|infinity)$/i.test(t)) return "inf";
    if (/^(-∞|-inf)$/i.test(t)) return "-inf";
    var n = evalNumeric(t);
    if (n == null || !isFinite(n)) return null;
    return n;
  }

  function parseInterval(text) {
    var raw = String(text || "").trim();
    if (!raw) return null;
    if (isAllReals(raw)) return { from: "-inf", to: "inf", empty: false, all: true };
    if (isEmptySet(raw)) return { empty: true };
    var s = ascii(raw)
      .replace(/≥/g, ">=")
      .replace(/≤/g, "<=")
      .replace(/⩾/g, ">=")
      .replace(/⩽/g, "<=");
    var inclusive = /<=|>=/.test(s);
    var between = s.match(/^(.+?)(<=|<)x(<=|<)(.+)$/i);
    if (between) {
      var a = parseBound(between[1]);
      var b = parseBound(between[4]);
      if (a == null || b == null || a === "inf" || b === "-inf") return null;
      return { from: a, to: b, empty: false, all: false, inclusive: inclusive };
    }
    var betweenRev = s.match(/^(.+?)(>=|>)x(>=|>)(.+)$/i);
    if (betweenRev) {
      var hi = parseBound(betweenRev[1]);
      var lo = parseBound(betweenRev[4]);
      if (hi == null || lo == null || hi === "-inf" || lo === "inf") return null;
      return { from: lo, to: hi, empty: false, all: false, inclusive: inclusive };
    }
    var right = s.match(/^x(>=|<=|>|<)(.+)$/i);
    if (right) {
      var bound = parseBound(right[2]);
      if (bound == null || bound === "inf" || bound === "-inf") return null;
      if (right[1] === ">" || right[1] === ">=") return { from: bound, to: "inf", empty: false, all: false, inclusive: inclusive };
      return { from: "-inf", to: bound, empty: false, all: false, inclusive: inclusive };
    }
    var left = s.match(/^(.+?)(>=|<=|>|<)x$/i);
    if (left) {
      var boundL = parseBound(left[1]);
      if (boundL == null || boundL === "inf" || boundL === "-inf") return null;
      if (left[2] === "<" || left[2] === "<=") return { from: boundL, to: "inf", empty: false, all: false, inclusive: inclusive };
      return { from: "-inf", to: boundL, empty: false, all: false, inclusive: inclusive };
    }
    return null;
  }

  function sameEnd(a, b) {
    if (a === b) return true;
    if (a === "-inf" || a === "inf" || b === "-inf" || b === "inf") return false;
    return near(a, b);
  }

  function sameRegion(student, expected) {
    if (!student || !expected) return false;
    if (student.empty) return false;
    if (expected.from === "-inf" && expected.to === "inf") return !!student.all || (student.from === "-inf" && student.to === "inf");
    if (student.all) return expected.from === "-inf" && expected.to === "inf";
    return sameEnd(student.from, expected.from) && sameEnd(student.to, expected.to);
  }

  function labelKind(word) {
    if (/חיובי/.test(word)) return "pos";
    if (/שלילי/.test(word)) return "neg";
    if (/עול|עלי/.test(word)) return "inc";
    if (/יור|יריד/.test(word)) return "dec";
    return null;
  }

  function splitDomainChunks(text) {
    return String(text || "")
      .split(/\s*[,;]\s*|\n+/)
      .map(function (part) {
        return String(part || "").trim();
      })
      .filter(Boolean);
  }

  function parseRegionList(text) {
    var raw = String(text || "").trim();
    if (!raw) return null;
    if (isEmptySet(raw)) return [];
    if (isAllReals(raw)) return [{ from: "-inf", to: "inf", empty: false, all: true }];
    var parts = raw.split(/\s+או\s+/);
    var out = [];
    var i;
    for (i = 0; i < parts.length; i++) {
      var interval = parseInterval(parts[i]);
      if (!interval || interval.empty) return null;
      out.push(interval);
    }
    return out;
  }

  function sameRegionSet(student, expected) {
    student = student || [];
    expected = expected || [];
    if (student.length !== expected.length) return false;
    var used = [];
    var i;
    var j;
    for (i = 0; i < student.length; i++) {
      var found = false;
      for (j = 0; j < expected.length; j++) {
        if (used[j]) continue;
        if (sameRegion(student[i], expected[j])) {
          used[j] = true;
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  }

  function chunkLabel(chunk) {
    var m = String(chunk || "").match(
      /^(חיוביות|שליליות|חיובי|שלילי|עלייה|ירידה|עולה|יורדת|יורד)\s*[:：]?\s*([\s\S]*)$/
    );
    if (!m) return { label: null, rest: String(chunk || "").trim() };
    return { label: labelKind(m[1]), rest: String(m[2] || "").trim() };
  }

  function isFlatPhrase(text) {
    var t = String(text || "").replace(/\s+/g, "");
    if (!t) return false;
    if (/קבועה/.test(t) && /לאעול/.test(t)) return true;
    if (/^(פונקציה)?קבועה$/.test(t)) return true;
    if (/אינהעולהואינהיורדת|לאעולהולאיורדת|אינהעולהולאיורדת|לאעולהואינהיורדת/.test(t)) return true;
    if (/איןתחוםעלייהואיןתחוםירידה|איןעלייהואיןירידה/.test(t)) return true;
    return false;
  }

  function endNum(v) {
    if (v === "-inf") return -Infinity;
    if (v === "inf") return Infinity;
    return Number(v);
  }

  function intersectOne(a, b) {
    if (!a || !b || a.empty || b.empty) return null;
    if (a.all) return { from: b.from, to: b.to };
    if (b.all) return { from: a.from, to: a.to };
    var from = endNum(a.from) >= endNum(b.from) ? a.from : b.from;
    var to = endNum(a.to) <= endNum(b.to) ? a.to : b.to;
    if (!(endNum(from) < endNum(to))) return null;
    return { from: from, to: to };
  }

  function intersectRegions(left, right) {
    var out = [];
    (left || []).forEach(function (a) {
      (right || []).forEach(function (b) {
        var hit = intersectOne(a, b);
        if (hit) out.push(hit);
      });
    });
    return out;
  }

  function rangeOf(fn) {
    var v = vertex(fn);
    if (!fn || fn.degree < 2 || !v) return null;
    return { op: fn.a > 0 ? ">=" : "<=", bound: v.y, kind: fn.a > 0 ? "min" : "max" };
  }

  function levelCond(fn, hits) {
    var v = vertex(fn);
    if (!fn || fn.degree < 2 || !v) return null;
    var up = fn.a > 0;
    var op = "=";
    if (Number(hits) === 2) op = up ? ">" : "<";
    else if (Number(hits) === 0) op = up ? "<" : ">";
    return { op: op, bound: v.y, kind: up ? "min" : "max" };
  }

  function parseScalarCond(text) {
    var s = ascii(text)
      .replace(/≥/g, ">=")
      .replace(/≤/g, "<=")
      .replace(/⩾/g, ">=")
      .replace(/⩽/g, "<=");
    var name = "(k|y|f\\(x\\))";
    var op = "(<=|>=|<|>|=)";
    var right = s.match(new RegExp("^" + name + op + "(.+)$", "i"));
    if (right) {
      var bound = evalNumeric(right[3]);
      if (bound == null || !isFinite(bound)) return null;
      return { name: right[1].toLowerCase(), op: right[2], bound: bound };
    }
    var left = s.match(new RegExp("^(.+?)" + op + name + "$", "i"));
    if (!left) return null;
    var boundL = evalNumeric(left[1]);
    if (boundL == null || !isFinite(boundL)) return null;
    var flip = { "<": ">", ">": "<", "<=": ">=", ">=": "<=", "=": "=" };
    return { name: left[3].toLowerCase(), op: flip[left[2]], bound: boundL };
  }

  function parseDomainAnswer(text) {
    var chunks = splitDomainChunks(text);
    var items = [];
    chunks.forEach(function (chunk) {
      var labeled = chunkLabel(chunk);
      var intervals = parseRegionList(labeled.rest || chunk);
      if (!intervals && labeled.label && isEmptySet(labeled.rest)) intervals = [];
      if (!intervals && !labeled.label) intervals = parseRegionList(chunk);
      if (!intervals) return;
      items.push({
        label: labeled.label,
        interval: intervals[0] || { empty: true },
        intervals: intervals,
      });
    });
    return items;
  }

  global.DoctematicaFnModel = {
    near: near,
    near0: near0,
    fmt: fmt,
    fmtMatch: fmtMatch,
    asWritten: asWritten,
    ascii: ascii,
    pretty: pretty,
    evalNumeric: evalNumeric,
    analyze: analyze,
    evalAt: evalAt,
    vertex: vertex,
    trendOf: trendOf,
    signRegions: signRegions,
    monoRegions: monoRegions,
    axisSide: axisSide,
    sketchExpectations: sketchExpectations,
    sketchGuide: sketchGuide,
    figureGeometry: figureGeometry,
    substText: substText,
    bareNegativePower: bareNegativePower,
    fnCallText: fnCallText,
    zeroEquation: zeroEquation,
    parseFnCall: parseFnCall,
    parseYValue: parseYValue,
    parseYesNo: parseYesNo,
    bareNumber: bareNumber,
    containsAt: containsAt,
    parseInterval: parseInterval,
    parseRegionList: parseRegionList,
    parseDomainAnswer: parseDomainAnswer,
    sameRegion: sameRegion,
    sameRegionSet: sameRegionSet,
    intersectRegions: intersectRegions,
    rangeOf: rangeOf,
    levelCond: levelCond,
    parseScalarCond: parseScalarCond,
    isFlatPhrase: isFlatPhrase,
    isEmptySet: isEmptySet,
    isAllReals: isAllReals,
  };
})(window);
