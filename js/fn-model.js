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
      if ((c === "+" || c === "−") && prev && prev !== "(" && prev !== "=" && prev !== "+" && prev !== "−") {
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
      .replace(/[∈∊]/g, "")
      .replace(/[−–—]/g, "-");
    if (!t) return false;
    if (/^\((-∞|-inf|-infinity),(∞|inf|infinity)\)$/i.test(t)) return true;
    if (/^(ℝ|R|xℝ|xR|כלx|לכלx|כלמספר|כלמספרממשי|כלממשי|כלממשיים|כלהמספריםהממשיים|כלערכיx|xℝ|xR|ℝ|כלxℝ)$/i.test(t)) return true;
    if (/כל/.test(t) && (/x/i.test(t) || /איקס/.test(t) || /ממשי/.test(t))) return true;
    if (t === "ℝ" || /^x∈/.test(t)) return true;
    return false;
  }

  function isEmptySet(text) {
    var t = String(text || "").replace(/\s+/g, "");
    if (!t) return false;
    if (t === "∅" || t === "{}" || t === "Ø") return true;
    if (/^(אין|איןתחום|איןפתרון|איןפתרונות|איןx|אףx|איןערכיx|לאקיים|לאקיימת|קבוצהריקה|איןחיתוך|איןנקודה|איןנקודתחיתוך)$/.test(t)) return true;
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
    var bracket = s.match(/^(\[|\()([^,]+),([^)\]]+)(\]|\))$/);
    if (bracket) {
      var leftEnd = parseBound(bracket[2]);
      var rightEnd = parseBound(bracket[3]);
      if (leftEnd == null || rightEnd == null) return null;
      if (typeof leftEnd === "number" && typeof rightEnd === "number" && leftEnd > rightEnd) return { empty: true };
      return intervalEnds(leftEnd, rightEnd, bracket[1] === "[", bracket[4] === "]");
    }
    var brace = s.match(/^\{(-?\d+(?:\.\d+)?)\}$/);
    if (brace) return intervalEnds(Number(brace[1]), Number(brace[1]), true, true);
    var eqPoint = s.match(/^x=(.+)$/i);
    if (eqPoint) {
      var point = parseBound(eqPoint[1]);
      if (typeof point !== "number") return null;
      return {
        from: point,
        to: point,
        fromIncluded: true,
        toIncluded: true,
        point: true,
        empty: false,
        all: false,
        inclusive: true,
      };
    }
    var between = s.match(/^(.+?)(<=|<)x(<=|<)(.+)$/i);
    if (between) {
      var a = parseBound(between[1]);
      var b = parseBound(between[4]);
      if (a == null || b == null || a === "inf" || b === "-inf") return null;
      if (typeof a === "number" && typeof b === "number" && a > b) return { empty: true };
      return intervalEnds(a, b, between[2] === "<=", between[3] === "<=");
    }
    var betweenRev = s.match(/^(.+?)(>=|>)x(>=|>)(.+)$/i);
    if (betweenRev) {
      var hi = parseBound(betweenRev[1]);
      var lo = parseBound(betweenRev[4]);
      if (hi == null || lo == null || hi === "-inf" || lo === "inf") return null;
      if (typeof lo === "number" && typeof hi === "number" && lo > hi) return { empty: true };
      return intervalEnds(lo, hi, betweenRev[4] && betweenRev[3] === ">=", betweenRev[2] === ">=");
    }
    var right = s.match(/^x(>=|<=|>|<)(.+)$/i);
    if (right) {
      var bound = parseBound(right[2]);
      if (bound == null || bound === "inf" || bound === "-inf") return null;
      if (right[1] === ">" || right[1] === ">=") return intervalEnds(bound, "inf", right[1] === ">=", false);
      return intervalEnds("-inf", bound, false, right[1] === "<=");
    }
    var left = s.match(/^(.+?)(>=|<=|>|<)x$/i);
    if (left) {
      var boundL = parseBound(left[1]);
      if (boundL == null || boundL === "inf" || boundL === "-inf") return null;
      if (left[2] === "<" || left[2] === "<=") return intervalEnds(boundL, "inf", left[2] === "<=", false);
      return intervalEnds("-inf", boundL, false, left[2] === ">=");
    }
    return null;
  }

  function intervalEnds(from, to, fromIncluded, toIncluded) {
    var point = from === to || (typeof from === "number" && typeof to === "number" && Math.abs(from - to) < 1e-9);
    if (point && (!fromIncluded || !toIncluded)) return { empty: true };
    return {
      from: from,
      to: to,
      fromIncluded: !!fromIncluded,
      toIncluded: !!toIncluded,
      point: !!point,
      empty: false,
      all: false,
      inclusive: !!(fromIncluded || toIncluded),
    };
  }

  function fmtBound(v) {
    if (v === "inf") return "∞";
    if (v === "-inf") return "−∞";
    var n = Number(v);
    if (!isFinite(n)) return String(v);
    return fmt(n);
  }

  function formatInterval(iv) {
    if (!iv || iv.empty) return "אין פתרון";
    if (iv.all || (iv.from === "-inf" && iv.to === "inf")) return "כל x";
    if (iv.point) return "x = " + fmtBound(iv.from);
    var lo = iv.from !== "-inf";
    var hi = iv.to !== "inf";
    if (lo && hi) {
      return fmtBound(iv.from) + (iv.fromIncluded ? " ≤ " : " < ") + "x" + (iv.toIncluded ? " ≤ " : " < ") + fmtBound(iv.to);
    }
    if (lo) return "x " + (iv.fromIncluded ? "≥ " : "> ") + fmtBound(iv.from);
    return "x " + (iv.toIncluded ? "≤ " : "< ") + fmtBound(iv.to);
  }

  function endIncluded(interval, which) {
    if (!interval) return false;
    var key = which + "Included";
    if (interval[key] != null) return !!interval[key];
    return false;
  }

  function sameInterval(student, expected) {
    if (!student || !expected) return false;
    if (student.empty || expected.empty) return !!(student.empty && expected.empty);
    var studentAll = !!(student.all || (student.from === "-inf" && student.to === "inf"));
    var expectedAll = !!(expected.all || (expected.from === "-inf" && expected.to === "inf"));
    if (studentAll || expectedAll) return studentAll && expectedAll;
    if (!sameEnd(student.from, expected.from) || !sameEnd(student.to, expected.to)) return false;
    if (student.point || expected.point) return !!(student.point && expected.point) || (endIncluded(student, "from") && endIncluded(student, "to") && endIncluded(expected, "from") && endIncluded(expected, "to"));
    return endIncluded(student, "from") === endIncluded(expected, "from") && endIncluded(student, "to") === endIncluded(expected, "to");
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

  function ineqAtomPattern() {
    var num = "[−–—+-]?(?:\\d+(?:\\.\\d+)?(?:\\s*/\\s*\\d+(?:\\.\\d+)?)?)";
    var op = "(?:<=|>=|≤|≥|<|>)";
    var between = num + "\\s*" + op + "\\s*x\\s*" + op + "\\s*" + num;
    var right = "x\\s*" + op + "\\s*" + num;
    var left = num + "\\s*" + op + "\\s*x";
    return new RegExp("^(?:" + between + "|" + right + "|" + left + ")", "i");
  }

  function splitSpacedInequalities(chunk) {
    var rest = String(chunk || "").trim();
    var re = ineqAtomPattern();
    var parts = [];
    while (rest) {
      var found = rest.match(re);
      if (!found) return null;
      parts.push(found[0].trim());
      rest = rest.slice(found[0].length).replace(/^\s+/, "");
      if (!rest) break;
    }
    if (parts.length < 2) return null;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (!parseInterval(parts[i])) return null;
    }
    return parts;
  }

  function splitRegionParts(raw) {
    if (parseInterval(raw)) return [raw];
    var chunks = String(raw || "").split(/\s+או\s+|\s*∪\s*|\s*,\s*/);
    var out = [];
    var i;
    for (i = 0; i < chunks.length; i++) {
      var chunk = chunks[i].trim();
      if (!chunk) return null;
      if (parseInterval(chunk)) {
        out.push(chunk);
        continue;
      }
      var spaced = splitSpacedInequalities(chunk);
      if (!spaced) return null;
      spaced.forEach(function (part) { out.push(part); });
    }
    return out.length ? out : null;
  }

  function parseRegionList(text) {
    var raw = String(text || "").trim();
    if (!raw) return null;
    if (isEmptySet(raw)) return [];
    if (isAllReals(raw)) return [{ from: "-inf", to: "inf", empty: false, all: true }];
    var parts = splitRegionParts(raw);
    if (!parts) return null;
    var out = [];
    var i;
    for (i = 0; i < parts.length; i++) {
      var interval = parseInterval(parts[i]);
      if (!interval || interval.empty) return null;
      out.push(interval);
    }
    return out;
  }

  function takeRegions(student, expected) {
    student = student || [];
    expected = expected || [];
    var used = [];
    var foreign = false;
    var i;
    var j;
    for (i = 0; i < student.length; i++) {
      var hit = false;
      for (j = 0; j < expected.length; j++) {
        if (used[j]) continue;
        if (sameInterval(student[i], expected[j])) {
          used[j] = true;
          hit = true;
          break;
        }
      }
      if (!hit) foreign = true;
    }
    var matched = [];
    for (j = 0; j < expected.length; j++) if (used[j]) matched.push(expected[j]);
    return {
      foreign: foreign,
      complete: !foreign && matched.length === expected.length && (expected.length > 0 || !student.length),
      partial: !foreign && matched.length > 0 && matched.length < expected.length,
      matched: matched,
    };
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
    if (a.all) return intervalEnds(b.from, b.to, endIncluded(b, "from"), endIncluded(b, "to"));
    if (b.all) return intervalEnds(a.from, a.to, endIncluded(a, "from"), endIncluded(a, "to"));
    var from = endNum(a.from) >= endNum(b.from) ? a.from : b.from;
    var to = endNum(a.to) <= endNum(b.to) ? a.to : b.to;
    var fromIncluded;
    var toIncluded;
    if (sameEnd(a.from, b.from)) fromIncluded = endIncluded(a, "from") && endIncluded(b, "from");
    else fromIncluded = endNum(a.from) > endNum(b.from) ? endIncluded(a, "from") : endIncluded(b, "from");
    if (sameEnd(a.to, b.to)) toIncluded = endIncluded(a, "to") && endIncluded(b, "to");
    else toIncluded = endNum(a.to) < endNum(b.to) ? endIncluded(a, "to") : endIncluded(b, "to");
    if (endNum(from) > endNum(to) + 1e-9) return null;
    var hit = intervalEnds(from, to, fromIncluded, toIncluded);
    return hit.empty ? null : hit;
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

  function intersectAll(list) {
    if (!list || !list.length) return { empty: true };
    var cur = null;
    var i;
    for (i = 0; i < list.length; i++) {
      var iv = list[i];
      if (!iv || iv.empty) return { empty: true };
      var all = !!(iv.all || (iv.from === "-inf" && iv.to === "inf"));
      if (all) {
        if (!cur) cur = { from: "-inf", to: "inf", empty: false, all: true, fromIncluded: false, toIncluded: false };
        continue;
      }
      if (!cur || cur.all) {
        cur = iv;
        continue;
      }
      var hit = intersectOne(cur, iv);
      if (!hit) return { empty: true };
      cur = hit;
    }
    return cur || { empty: true };
  }

  function canonInterval(iv) {
    if (!iv || iv.empty) return null;
    if (iv.all || (iv.from === "-inf" && iv.to === "inf")) {
      return { from: "-inf", to: "inf", fromIncluded: false, toIncluded: false, all: true, empty: false, point: false, inclusive: false };
    }
    return intervalEnds(iv.from, iv.to, endIncluded(iv, "from"), endIncluded(iv, "to"));
  }

  function overlapsOrAbuts(left, right) {
    if (endNum(left.to) > endNum(right.from) + 1e-9) return true;
    if (!sameEnd(left.to, right.from)) return false;
    return endIncluded(left, "to") || endIncluded(right, "from");
  }

  function mergeTouching(left, right) {
    var from = left.from;
    var fromIncluded = endIncluded(left, "from");
    if (sameEnd(left.from, right.from)) fromIncluded = fromIncluded || endIncluded(right, "from");
    var to = endNum(left.to) >= endNum(right.to) - 1e-9 ? left.to : right.to;
    var toIncluded;
    if (sameEnd(left.to, right.to)) toIncluded = endIncluded(left, "to") || endIncluded(right, "to");
    else toIncluded = endNum(left.to) > endNum(right.to) ? endIncluded(left, "to") : endIncluded(right, "to");
    if (from === "-inf" && to === "inf") {
      return { from: "-inf", to: "inf", fromIncluded: false, toIncluded: false, all: true, empty: false, point: false, inclusive: false };
    }
    return intervalEnds(from, to, fromIncluded, toIncluded);
  }

  function unionAll(list) {
    var items = [];
    var i;
    for (i = 0; i < (list || []).length; i++) {
      var c = canonInterval(list[i]);
      if (!c) continue;
      if (c.all) return [c];
      items.push(c);
    }
    if (!items.length) return [];
    items.sort(function (a, b) {
      var d = endNum(a.from) - endNum(b.from);
      if (Math.abs(d) > 1e-9) return d;
      return endNum(a.to) - endNum(b.to);
    });
    var out = [items[0]];
    for (i = 1; i < items.length; i++) {
      var last = out[out.length - 1];
      var cur = items[i];
      if (overlapsOrAbuts(last, cur)) out[out.length - 1] = mergeTouching(last, cur);
      else out.push(cur);
      if (out[out.length - 1].all) return [out[out.length - 1]];
    }
    return out;
  }

  function combineIntervals(list, operation) {
    var op = String(operation || "intersection").toLowerCase();
    if (op === "union") return unionAll(list);
    var hit = intersectAll(list);
    if (!hit || hit.empty) return [];
    var one = canonInterval(hit);
    return one ? [one] : [];
  }

  function formatIntervalSet(list) {
    if (!list || !list.length) return "אין פתרון";
    if (list.length === 1 && (list[0].all || (list[0].from === "-inf" && list[0].to === "inf"))) return "כל x";
    return list.map(formatInterval).join(" או ");
  }

  function sameIntervalSet(student, expected) {
    student = student || [];
    expected = expected || [];
    if (!student.length || !expected.length) return !student.length && !expected.length;
    var studentAll = student.length === 1 && !!(student[0].all || (student[0].from === "-inf" && student[0].to === "inf"));
    var expectedAll = expected.length === 1 && !!(expected[0].all || (expected[0].from === "-inf" && expected[0].to === "inf"));
    if (studentAll || expectedAll) return studentAll && expectedAll;
    if (student.length !== expected.length) return false;
    var used = [];
    var i;
    var j;
    for (i = 0; i < student.length; i++) {
      var found = false;
      for (j = 0; j < expected.length; j++) {
        if (used[j]) continue;
        if (sameInterval(student[i], expected[j])) {
          used[j] = true;
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  }

  function compoundOp(op) {
    if (op === "<=") return "≤";
    if (op === ">=") return "≥";
    return op;
  }

  function splitCompound(text) {
    var src = String(text || "").trim();
    if (!src || /וגם/.test(src)) return null;
    var re = /<=|>=|≤|≥|<|>/g;
    var hits = [];
    var m;
    while ((m = re.exec(src))) hits.push({ i: m.index, op: m[0], len: m[0].length });
    if (hits.length !== 2) return null;
    var left = src.slice(0, hits[0].i).trim();
    var mid = src.slice(hits[0].i + hits[0].len, hits[1].i).trim();
    var right = src.slice(hits[1].i + hits[1].len).trim();
    if (!left || !mid || !right) return null;
    return [
      left + " " + compoundOp(hits[0].op) + " " + mid,
      mid + " " + compoundOp(hits[1].op) + " " + right,
    ];
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

  function qyForLevel(anchors, y) {
    var list = (anchors || []).filter(function (item) {
      return item && isFinite(Number(item.y)) && isFinite(Number(item.qy));
    }).slice().sort(function (a, b) { return Number(a.y) - Number(b.y); });
    var height = Number(y);
    if (!list.length || !isFinite(height)) return 0.35;
    if (list.length === 1 || height <= Number(list[0].y)) {
      var low = list[0];
      if (Math.abs(height - Number(low.y)) < 1e-6) return Number(low.qy);
      if (height > Number(low.y)) return Math.min(0.95, Number(low.qy) + 0.55);
      return Math.max(-0.95, Number(low.qy) - 0.38);
    }
    var high = list[list.length - 1];
    if (height >= Number(high.y)) {
      if (Math.abs(height - Number(high.y)) < 1e-6) return Number(high.qy);
      return Math.min(0.95, Number(high.qy) + 0.42);
    }
    var i;
    for (i = 0; i < list.length - 1; i++) {
      var a = list[i];
      var b = list[i + 1];
      if (height >= Number(a.y) && height <= Number(b.y)) {
        var span = Number(b.y) - Number(a.y);
        var t = span ? (height - Number(a.y)) / span : 0;
        return Number(a.qy) + (Number(b.qy) - Number(a.qy)) * t;
      }
    }
    return Number(high.qy);
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
    formatInterval: formatInterval,
    sameInterval: sameInterval,
    fmtBound: fmtBound,
    parseRegionList: parseRegionList,
    takeRegions: takeRegions,
    parseDomainAnswer: parseDomainAnswer,
    sameRegion: sameRegion,
    sameRegionSet: sameRegionSet,
    intersectRegions: intersectRegions,
    intersectAll: intersectAll,
    unionAll: unionAll,
    combineIntervals: combineIntervals,
    formatIntervalSet: formatIntervalSet,
    sameIntervalSet: sameIntervalSet,
    splitCompound: splitCompound,
    rangeOf: rangeOf,
    levelCond: levelCond,
    parseScalarCond: parseScalarCond,
    isFlatPhrase: isFlatPhrase,
    isEmptySet: isEmptySet,
    isAllReals: isAllReals,
    qyForLevel: qyForLevel,
  };
})(window);
