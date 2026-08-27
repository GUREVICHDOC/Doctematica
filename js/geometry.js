(function (global) {
  function pointMap(points) {
    var map = {};
    (points || []).forEach(function (p) {
      map[String(p.label).toUpperCase()] = p;
    });
    return map;
  }

  function getPoint(map, label) {
    var key = String(label || "").toUpperCase();
    if (map && map[key]) return map[key];
    if (key === "O") return { label: "O", x: 0, y: 0 };
    return null;
  }

  function distOrigin(p) {
    if (!p) return null;
    if (near0(p.y)) return Math.abs(p.x);
    if (near0(p.x)) return Math.abs(p.y);
    return Math.sqrt(p.x * p.x + p.y * p.y);
  }

  function distAxis(p, axis) {
    if (!p) return null;
    return axis === "x" ? Math.abs(p.y) : Math.abs(p.x);
  }

  function segmentLength(a, b) {
    if (!a || !b) return null;
    if (nearNum(a.y, b.y)) return Math.abs(a.x - b.x);
    if (nearNum(a.x, b.x)) return Math.abs(a.y - b.y);
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  function near0(v) {
    return Math.abs(v) < 1e-9;
  }

  function nearNum(a, b) {
    return Math.abs(a - b) < 1e-6;
  }

  function fmtNum(n) {
    if (n == null || !isFinite(n)) return "";
    var A = global.DoctematicaAlgebra;
    if (A && A.formatNumber) {
      return String(A.formatNumber(n)).split(" או ")[0];
    }
    if (near0(n)) return "0";
    if (nearNum(n, Math.round(n))) return String(Math.round(n));
    return String(Math.round(n * 1000) / 1000);
  }

  function coordLabel(p) {
    if (!p) return "";
    var xs = p.hideX ? " " : fmtNum(p.x);
    var ys = p.hideY ? " " : fmtNum(p.y);
    return p.label + "(" + xs + ";" + ys + ")";
  }

  function formatPointPair(x, y) {
    return "(" + fmtNum(x) + ";" + fmtNum(y) + ")";
  }

  function parsePointPair(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/,/g, ";");
    var m = t.match(/^\(?(-?\d+(?:\.\d+)?);(-?\d+(?:\.\d+)?)\)?$/);
    if (!m) return null;
    var x = parseFloat(m[1], 10);
    var y = parseFloat(m[2], 10);
    if (!isFinite(x) || !isFinite(y)) return null;
    return { x: x, y: y };
  }

  function pointTaskLabel(task) {
    if (!task) return "";
    return formatPointPair(task.answerX, task.answerY);
  }

  function bigMinusSmall(u, v) {
    var hi = Math.max(u, v);
    var lo = Math.min(u, v);
    return { hi: hi, lo: lo, diff: hi - lo };
  }

  function formatLo(n) {
    return n < 0 ? "(" + fmtNum(n) + ")" : fmtNum(n);
  }

  function canonicalAreaBody(task, map) {
    if (!task || task.kind !== "area") return "";
    var legs = task.legs || [];
    if (legs.length >= 2) {
      var a = String(legs[0][0] || "").toUpperCase() + String(legs[0][1] || "").toUpperCase();
      var b = String(legs[1][0] || "").toUpperCase() + String(legs[1][1] || "").toUpperCase();
      return "(" + a + "×" + b + ")/2";
    }
    return "";
  }

  /** שרשרת פתרון מלאה: אותיות → מספרים → מכפלת מונה → חילוק */
  function canonicalAreaChain(task, map) {
    if (!task || task.kind !== "area") return "";
    var label = task.label || "S";
    var legs = task.legs || [];
    if (legs.length < 2) {
      return label + "=" + fmtNum(task.answer);
    }
    var n1 = String(legs[0][0] || "").toUpperCase() + String(legs[0][1] || "").toUpperCase();
    var n2 = String(legs[1][0] || "").toUpperCase() + String(legs[1][1] || "").toUpperCase();
    var l1 = legLength(map, legs[0][0], legs[0][1]);
    var l2 = legLength(map, legs[1][0], legs[1][1]);
    if (l1 == null || l2 == null || !isFinite(l1) || !isFinite(l2)) {
      var body = canonicalAreaBody(task, map);
      return body ? label + "=" + body + "=" + fmtNum(task.answer) : label + "=" + fmtNum(task.answer);
    }
    var letters = "(" + n1 + "×" + n2 + ")/2";
    var nums = "(" + fmtNum(l1) + "×" + fmtNum(l2) + ")/2";
    var prod = l1 * l2;
    var mid = fmtNum(prod) + "/2";
    var parts = [label, letters, nums];
    // 28/2 → ואז 14; 15/2 → ביניים, ואז 7.5
    if (isAreaSimplifiedFinal(mid, task.answer)) {
      parts.push(mid);
    } else {
      parts.push(mid);
      parts.push(fmtNum(task.answer));
    }
    return parts.join("=");
  }

  /** צעדי פתרון מצטברים להצגה בהיסטוריה */
  function canonicalAreaSteps(task, map) {
    var chain = canonicalAreaChain(task, map);
    if (!chain) return [];
    var bits = chain.split("=");
    if (bits.length <= 1) return [chain];
    var out = [];
    var acc = bits[0];
    var i;
    for (i = 1; i < bits.length; i++) {
      acc += "=" + bits[i];
      out.push(acc);
    }
    return out;
  }

  /** שלבי RHS בלבד: אותיות, הצבה, מכפלת מונה, תוצאה */
  function areaStageBits(task, map) {
    var chain = canonicalAreaChain(task, map);
    if (!chain) return [];
    return chain.split("=").slice(1);
  }

  function countMatchedAreaStages(prevExpr, bits) {
    if (!prevExpr || !bits || !bits.length) return 0;
    var prevParts = String(prevExpr).split("=");
    var matched = 0;
    var i;
    for (i = 0; i < bits.length && i < prevParts.length; i++) {
      if (prettyAreaExpr(prevParts[i]) !== prettyAreaExpr(bits[i])) break;
      matched += 1;
    }
    // אם רשמו ביטוי שקול לאחד השלבים (לא בהכרח מההתחלה)
    if (matched === 0 && prevParts.length) {
      var last = prettyAreaExpr(prevParts[prevParts.length - 1]);
      for (i = 0; i < bits.length; i++) {
        if (prettyAreaExpr(bits[i]) === last) return i + 1;
      }
    }
    return matched;
  }

  function nextAreaStageBit(task, map, progress) {
    var bits = areaStageBits(task, map);
    if (!bits.length) return fmtNum(task.answer);
    var prev = (progress && progress.lastExpr && progress.lastExpr[task.id]) || "";
    var matched = countMatchedAreaStages(prev, bits);
    if (matched >= bits.length) return fmtNum(task.answer);
    return bits[matched];
  }

  function areaStageMessage(bit, task, map) {
    var bits = areaStageBits(task, map);
    var idx = -1;
    var i;
    for (i = 0; i < bits.length; i++) {
      if (prettyAreaExpr(bits[i]) === prettyAreaExpr(bit)) {
        idx = i;
        break;
      }
    }
    if (idx === 0) return "רשמו את נוסחת השטח עם האותיות (הצלעות).";
    if (idx === 1) return "הציבו את אורכי הצלעות במקום האותיות.";
    if (idx === 2 && bits.length > 3) return "חשבו את מכפלת המונה, ואז השאירו חילוק במכנה.";
    if (idx === bits.length - 1 || prettyAreaExpr(bit) === prettyAreaExpr(fmtNum(task.answer))) {
      return "חשבו את החילוק ורשמו את התוצאה הסופית.";
    }
    return "המשיכו את חישוב השטח בשלב הבא.";
  }

  function canonicalStep(task, map) {
    if (!task) return "";
    if (task.kind === "point") {
      return task.label + " = " + pointTaskLabel(task);
    }
    if (task.kind === "area") {
      return canonicalAreaChain(task, map);
    }
    var body = canonicalDiffBody(task, map);
    if (!body) return task.label + " = " + fmtNum(task.answer);
    return task.label + ": " + body + " = " + fmtNum(task.answer);
  }

  function canonicalDiffBody(task, map) {
    if (!task) return "";
    if (task.kind === "origin") {
      var p = getPoint(map, task.point);
      if (!p) return "";
      if (near0(p.y)) {
        var ox = bigMinusSmall(p.x, 0);
        return fmtNum(ox.hi) + " − " + formatLo(ox.lo);
      }
      if (near0(p.x)) {
        var oy = bigMinusSmall(p.y, 0);
        return fmtNum(oy.hi) + " − " + formatLo(oy.lo);
      }
      return "";
    }
    if (task.kind === "axis") {
      var q = getPoint(map, task.point);
      if (!q) return "";
      // מרחק מציר x = |y|; מציר y = |x| — כותבים גדול פחות קטן מול 0
      if ((task.axis || "x") === "x") {
        var dx = bigMinusSmall(q.y, 0);
        return fmtNum(dx.hi) + " − " + formatLo(dx.lo);
      }
      var dy = bigMinusSmall(q.x, 0);
      return fmtNum(dy.hi) + " − " + formatLo(dy.lo);
    }
    if (task.kind === "segment") {
      var a = task._fromPt || getPoint(map, task.from);
      var b = task._toPt || getPoint(map, task.to);
      if (!a || !b) return "";
      if (nearNum(a.y, b.y)) {
        var sx = bigMinusSmall(a.x, b.x);
        return fmtNum(sx.hi) + " − " + formatLo(sx.lo);
      }
      if (nearNum(a.x, b.x)) {
        var sy = bigMinusSmall(a.y, b.y);
        return fmtNum(sy.hi) + " − " + formatLo(sy.lo);
      }
    }
    if (task.kind === "distSeg") {
      var dp = getPoint(map, task.point);
      var da = task._fromPt || getPoint(map, task.from);
      var db = task._toPt || getPoint(map, task.to);
      if (!dp || !da || !db) return "";
      if (nearNum(da.x, db.x)) {
        var dx = bigMinusSmall(dp.x, da.x);
        return fmtNum(dx.hi) + " − " + formatLo(dx.lo);
      }
      if (nearNum(da.y, db.y)) {
        var dy = bigMinusSmall(dp.y, da.y);
        return fmtNum(dy.hi) + " − " + formatLo(dy.lo);
      }
    }
    return "";
  }

  function lastDiffStage(expr) {
    var parts = String(expr || "").split("=");
    return String(parts[parts.length - 1] || "").trim();
  }

  function appendDiffExpr(prev, nextPretty) {
    var n = String(nextPretty || "").trim();
    if (!n) return String(prev || "");
    if (!prev) return n;
    var p = String(prev);
    if (lastDiffStage(p) === n) return p;
    return p + " = " + n;
  }

  function simplifiedDiffBody(body) {
    if (!body) return null;
    var s = lastDiffStage(body);
    var m = s.match(/^(.+?) [−-] \((.+)\)$/);
    if (!m) return null;
    var lo = parseFloat(String(m[2]).replace(/[−–—]/g, "-"), 10);
    if (!isFinite(lo) || lo >= 0) return null;
    return m[1] + " + " + fmtNum(-lo);
  }

  /** שרשרת פתרון בשורה אחת: גדול פחות קטן = פישוט = תוצאה */
  function canonicalDiffChain(task, map) {
    var label = task.label || "";
    var body = canonicalDiffBody(task, map);
    if (!body) return canonicalStep(task, map);
    var simp = simplifiedDiffBody(body);
    if (simp) {
      return label + ": " + body + " = " + simp + " = " + fmtNum(task.answer);
    }
    return label + ": " + body + " = " + fmtNum(task.answer);
  }

  /** צעדי פתרון מצטברים (לשימוש פנימי / תואמות לאחור) */
  function canonicalDiffSteps(task, map) {
    var chain = canonicalDiffChain(task, map);
    return chain ? [chain] : [];
  }

  function labeledDiff(task, map) {
    var body = canonicalDiffBody(task, map);
    if (!body) return task.label + " = " + fmtNum(task.answer);
    return task.label + ": " + body;
  }

  function originSegmentName(point) {
    var p = String(point || "").toUpperCase();
    return p ? "O" + p : "";
  }

  function axisDistanceName(point, axis) {
    var p = String(point || "").toUpperCase();
    var ax = String(axis || "x").toLowerCase() === "y" ? "y" : "x";
    return p ? p + "→" + ax : "";
  }

  function distPointToSegName(point, from, to) {
    return (
      String(point || "").toUpperCase() +
      "→" +
      String(from || "").toUpperCase() +
      String(to || "").toUpperCase()
    );
  }

  function distPointToSegment(p, a, b) {
    if (!p || !a || !b) return null;
    if (nearNum(a.x, b.x)) return Math.abs(p.x - a.x);
    if (nearNum(a.y, b.y)) return Math.abs(p.y - a.y);
    return null;
  }

  function footOnAxisSeg(p, a, b) {
    if (!p || !a || !b) return null;
    if (nearNum(a.x, b.x)) return { x: a.x, y: p.y, label: "" };
    if (nearNum(a.y, b.y)) return { x: p.x, y: a.y, label: "" };
    return null;
  }

  function areaTriangleName(verts) {
    var v = (verts || []).map(function (x) {
      return String(x || "").toUpperCase();
    });
    return v.length ? "S△" + v.join("") : "S";
  }

  function legLength(map, a, b) {
    var pa = getPoint(map, a);
    var pb = getPoint(map, b);
    if (pa && pb) return segmentLength(pa, pb);
    if (String(a).toUpperCase() === "O") return distOrigin(getPoint(map, b));
    if (String(b).toUpperCase() === "O") return distOrigin(getPoint(map, a));
    return null;
  }

  function knownLegNames(map) {
    var labels = Object.keys(map || {});
    if (labels.indexOf("O") < 0) labels = labels.concat(["O"]);
    var names = [];
    var i;
    var j;
    for (i = 0; i < labels.length; i++) {
      for (j = 0; j < labels.length; j++) {
        if (i === j) continue;
        var len = legLength(map, labels[i], labels[j]);
        if (len != null && isFinite(len)) names.push({ name: labels[i] + labels[j], len: len });
      }
    }
    names.sort(function (u, v) {
      return v.name.length - u.name.length;
    });
    return names;
  }

  function normalizeZeroAsO(expr) {
    return String(expr || "")
      .replace(/([A-Za-z])0/g, "$1O")
      .replace(/0([A-Za-z])/g, "O$1");
  }

  function expandLegsInExpr(expr, map) {
    var t = normalizeZeroAsO(expr)
      .replace(/[−–—]/g, "-")
      .replace(/×|·/g, "*")
      .replace(/÷/g, "/")
      .replace(/\s+/g, "");
    knownLegNames(map).forEach(function (item) {
      t = t.replace(new RegExp(item.name, "gi"), String(item.len));
    });
    return t;
  }

  function triangleArea(map, verts) {
    var pts = (verts || []).map(function (v) {
      return getPoint(map, v);
    });
    if (pts.length !== 3 || pts.some(function (p) { return !p; })) return null;
    var a = pts[0];
    var b = pts[1];
    var c = pts[2];
    return Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2;
  }

  function prettyAreaExpr(rhs) {
    return normalizeZeroAsO(String(rhs || ""))
      .replace(/[−–—]/g, "−")
      .replace(/\*/g, "×")
      .replace(/\s+/g, "");
  }

  function gcdInt(a, b) {
    a = Math.abs(a | 0);
    b = Math.abs(b | 0);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  /**
   * תוצאה סופית לשטח: מספר שלם, עשרוני סופי (עד 3 ספרות), או שבר מצומצם אם אין ייצוג עשרוני קצר.
   * 18/2 → ביניים; 9 → סופי; 15/2 → ביניים (מצפים ל-7.5); 1/3 → סופי.
   */
  function isAreaSimplifiedFinal(token, answer) {
    var t = String(token || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(",", ".");
    if (!t || !isBareNumberExpr(t)) return false;
    var v = parseNumberToken(t);
    if (v == null || answer == null || !nearNum(v, answer)) return false;
    var frac = t.match(/^(-?\d+)\/(-?\d+)$/);
    if (frac) {
      var n = parseInt(frac[1], 10);
      var d = parseInt(frac[2], 10);
      if (!d) return false;
      if (nearNum(answer, Math.round(answer))) return false;
      var A = global.DoctematicaAlgebra;
      if (A && A.terminatingDecimalPlaces && A.terminatingDecimalPlaces(answer, 3) != null) {
        return false;
      }
      return gcdInt(n, d) === 1;
    }
    return true;
  }

  function areaRhsIsComplete(rhs, answer) {
    var parts = String(rhs || "").split("=");
    if (!parts.length) return false;
    return isAreaSimplifiedFinal(parts[parts.length - 1], answer);
  }

  function appendAreaExpr(prev, nextPretty) {
    var n = String(nextPretty || "");
    if (!n) return String(prev || "");
    if (!prev) return n;
    var p = String(prev);
    var last = p.split("=").pop();
    if (prettyAreaExpr(last) === prettyAreaExpr(n)) return p;
    return p + "=" + n;
  }

  function partialAreaTask(ahit, prettyRhs, doneMap, partialMap, coordsMap, pack, progress) {
    var nextDone = {};
    Object.keys(doneMap).forEach(function (k) {
      nextDone[k] = true;
    });
    var nextPartial = {};
    Object.keys(partialMap).forEach(function (k) {
      nextPartial[k] = true;
    });
    nextPartial[ahit.id] = true;
    var prevExpr = (progress.lastExpr && progress.lastExpr[ahit.id]) || "";
    var display = appendAreaExpr(prevExpr, prettyRhs);
    var nextExpr = {};
    Object.keys(progress.lastExpr || {}).forEach(function (k) {
      nextExpr[k] = progress.lastExpr[k];
    });
    nextExpr[ahit.id] = display;
    return {
      ok: true,
      solved: false,
      done: nextDone,
      partial: nextPartial,
      coords: coordsMap,
      lastExpr: nextExpr,
      task: ahit,
      show: ahit.label + "=" + display,
      message: "נכון. זה שלב ביניים — המשיכו לחשב עד לתוצאה הסופית של " + ahit.label + ".",
    };
  }

  function finishAreaTask(ahit, prettyRhs, rawRhs, doneMap, partialMap, coordsMap, pack, progress) {
    var areaDone = {};
    Object.keys(doneMap).forEach(function (k) {
      areaDone[k] = true;
    });
    areaDone[ahit.id] = true;
    // אחרי שטח נכון — אורכים מומלצים (optional) נסגרים אוטומטית
    markOptionalDone(pack, areaDone);
    var areaPartial = {};
    Object.keys(partialMap).forEach(function (k) {
      if (k !== ahit.id && !areaDone[k]) areaPartial[k] = true;
    });
    var areaLeft = remainingRequired(pack, areaDone);
    var prev = (progress.lastExpr && progress.lastExpr[ahit.id]) || "";
    var incoming = prettyRhs ? prettyAreaExpr(prettyRhs) : "";
    var exprPart;
    if (incoming && areaRhsIsComplete(incoming, ahit.answer)) {
      // שרשרת מלאה או מספר סופי מצומצם
      if (incoming.indexOf("=") < 0 && prev) {
        exprPart = appendAreaExpr(prev, incoming);
      } else {
        exprPart = incoming;
      }
    } else {
      var base = prev || incoming || canonicalAreaBody(ahit, pack.map) || "";
      exprPart = appendAreaExpr(base, fmtNum(ahit.answer));
    }
    var areaShow = canonicalAreaChain(ahit, pack.map) ||
      (exprPart ? ahit.label + "=" + exprPart : canonicalStep(ahit, pack.map));
    var nextExpr = {};
    Object.keys(progress.lastExpr || {}).forEach(function (k) {
      if (k !== ahit.id) nextExpr[k] = progress.lastExpr[k];
    });
    return {
      ok: true,
      solved: areaLeft.length === 0,
      done: areaDone,
      partial: areaPartial,
      coords: coordsMap,
      lastExpr: nextExpr,
      task: ahit,
      show: areaShow,
      message: areaLeft.length ? "נכון. המשיכו לסעיף הבא." : "כל החלקים נפתרו.",
    };
  }

  function evalArithExpr(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/×|·/g, "*")
      .replace(/÷/g, "/")
      .replace(/\s+/g, "");
    if (!t || !/^[\d.+*/()-]+$/.test(t)) return null;
    try {
      var v = Function('"use strict"; return (' + t + ");")();
      return typeof v === "number" && isFinite(v) ? v : null;
    } catch (e) {
      return null;
    }
  }

  function evalGeoAreaRhs(rhs, map) {
    var parts = String(rhs || "").split("=");
    var lastVal = null;
    var i;
    for (i = 0; i < parts.length; i++) {
      var expanded = expandLegsInExpr(parts[i], map);
      var v = evalArithExpr(expanded);
      if (v == null) return null;
      if (lastVal != null && !nearNum(lastVal, v)) return null;
      lastVal = v;
    }
    return lastVal;
  }

  function normAreaTag(tag) {
    return String(tag || "")
      .toUpperCase()
      .replace(/△|Δ/g, "")
      .replace(/^S/, "")
      .replace(/[^A-Z]/g, "");
  }

  function normGeoTag(tag) {
    return String(tag || "")
      .toUpperCase()
      .replace(/→/g, "")
      .replace(/->/g, "")
      .replace(/-/g, "")
      .replace(/\s+/g, "");
  }

  function buildTasks(ex) {
    var map = pointMap(ex.points);
    var tasks = [];
    (ex.tasks || []).forEach(function (t) {
      var answer = t.answer;
      if (answer == null && t.kind === "origin") {
        answer = distOrigin(getPoint(map, t.point));
      }
      if (answer == null && t.kind === "segment") {
        answer = segmentLength(getPoint(map, t.from), getPoint(map, t.to));
      }
      if (answer == null && t.kind === "axis") {
        answer = distAxis(getPoint(map, t.point), t.axis || "x");
      }
      if (answer == null && t.kind === "distSeg") {
        answer = distPointToSegment(
          getPoint(map, t.point),
          getPoint(map, t.from),
          getPoint(map, t.to)
        );
      }
      if (answer == null && t.kind === "area") {
        if (t.legs && t.legs.length >= 2) {
          var l1 = legLength(map, t.legs[0][0], t.legs[0][1]);
          var l2 = legLength(map, t.legs[1][0], t.legs[1][1]);
          if (l1 != null && l2 != null) answer = (l1 * l2) / 2;
        }
        if (answer == null) answer = triangleArea(map, t.verts);
      }
      var answerX = t.answerX;
      var answerY = t.answerY;
      if (t.kind === "point") {
        var tp = getPoint(map, t.point);
        if (answerX == null && tp) answerX = tp.x;
        if (answerY == null && tp) answerY = tp.y;
        answer = null;
      }
      var id = t.id;
      var label = t.label;
      if (t.kind === "origin") {
        var oname = originSegmentName(t.point);
        if (!id || /^[A-Za-z]$/.test(String(id))) id = oname;
        if (!label || /^[A-Za-z]$/.test(String(label))) label = oname;
      }
      if (t.kind === "axis") {
        var aname = axisDistanceName(t.point, t.axis || "x");
        var ax = String(t.axis || "x").toLowerCase() === "y" ? "y" : "x";
        if (!id) id = String(t.point || "").toUpperCase() + "-" + ax;
        if (!label) label = aname;
      }
      if (t.kind === "point") {
        var pname = String(t.point || "").toUpperCase();
        if (!id) id = pname;
        if (!label) label = pname;
      }
      if (t.kind === "distSeg") {
        var dname = distPointToSegName(t.point, t.from, t.to);
        if (!id) {
          id =
            String(t.point || "").toUpperCase() +
            String(t.from || "").toUpperCase() +
            String(t.to || "").toUpperCase();
        }
        if (!label) label = dname;
      }
      if (t.kind === "area") {
        var aname2 = areaTriangleName(t.verts);
        if (!id) id = "S" + (t.verts || []).map(function (v) { return String(v || "").toUpperCase(); }).join("");
        if (!label) label = aname2;
      }
      if (!id && t.kind === "segment") id = String(t.from || "") + String(t.to || "");
      if (!label) label = id;
      tasks.push({
        id: id,
        kind: t.kind,
        point: t.point,
        from: t.from,
        to: t.to,
        axis: t.axis,
        verts: t.verts,
        legs: t.legs,
        missing: t.missing,
        twin: t.twin,
        twinX: t.twinX,
        twinY: t.twinY,
        answer: answer,
        answerX: answerX,
        answerY: answerY,
        label: label,
        optional: !!t.optional,
      });
    });
    return tasks;
  }

  function isRequiredTask(t) {
    return !!(t && !t.optional);
  }

  function remainingRequired(pack, doneMap) {
    return (pack.tasks || []).filter(function (t) {
      return isRequiredTask(t) && !(doneMap && doneMap[t.id]);
    });
  }

  function markOptionalDone(pack, doneMap) {
    (pack.tasks || []).forEach(function (t) {
      if (t.optional) doneMap[t.id] = true;
    });
  }

  function analyzeStart(ex) {
    function normalizePoint(p) {
      return {
        label: p.label,
        x: Number(p.x),
        y: Number(p.y),
        hideX: !!p.hideX,
        hideY: !!p.hideY,
      };
    }
    var points = (ex.points || []).map(normalizePoint);
    if (!points.length && ex.parts) {
      (ex.parts || []).forEach(function (part) {
        (part.points || []).forEach(function (p) {
          var lab = String(p.label).toUpperCase();
          var exists = points.some(function (q) {
            return String(q.label).toUpperCase() === lab;
          });
          if (!exists) points.push(normalizePoint(p));
        });
      });
    }
    var map = pointMap(points);
    var tasks = buildTasks({ points: points, tasks: ex.tasks });
    var segments = [];
    if (ex.showSegments !== false) {
      segments = (ex.segments || []).slice();
      if (!segments.length) {
        tasks.forEach(function (t) {
          if (t.kind === "segment") segments.push({ from: t.from, to: t.to });
          if (t.kind === "origin" && t.point) {
            segments.push({ from: "O", to: String(t.point).toUpperCase() });
          }
          if (t.kind === "area" && t.verts && t.verts.length >= 2) {
            var vv = t.verts.map(function (v) {
              return String(v || "").toUpperCase();
            });
            for (var vi = 0; vi < vv.length; vi++) {
              segments.push({ from: vv[vi], to: vv[(vi + 1) % vv.length] });
            }
          }
        });
      }
    }
    var polygons = (ex.polygons || []).slice();
    var rightAngles = (ex.rightAngles || []).slice();
    // remapping part taskIds
    var idAlias = {};
    tasks.forEach(function (t) {
      if (t.kind === "origin" && t.point) {
        var p = String(t.point).toUpperCase();
        idAlias[p] = t.id;
        idAlias["O" + p] = t.id;
        idAlias[p + "O"] = t.id;
      }
      if (t.kind === "axis" && t.point) {
        var ap = String(t.point).toUpperCase();
        var aax = String(t.axis || "x").toLowerCase() === "y" ? "y" : "x";
        idAlias[ap + aax.toUpperCase()] = t.id;
        idAlias[ap + "-" + aax] = t.id;
        idAlias[ap + "→" + aax] = t.id;
        idAlias[t.id] = t.id;
      }
      if (t.kind === "point" && t.point) {
        idAlias[String(t.point).toUpperCase()] = t.id;
        idAlias[t.id] = t.id;
      }
      if (t.kind === "area" && t.verts) {
        var av = t.verts.map(function (v) {
          return String(v || "").toUpperCase();
        }).join("");
        idAlias["S" + av] = t.id;
        idAlias[av] = t.id;
        idAlias[t.id] = t.id;
      }
    });
    var parts = (ex.parts || []).map(function (part) {
      return {
        label: part.label,
        text: part.text,
        taskIds: (part.taskIds || []).map(function (id) {
          var key = String(id);
          return idAlias[key] || idAlias[key.toUpperCase()] || id;
        }),
        points: (part.points || []).map(normalizePoint),
        segments: (part.segments || []).slice(),
      };
    });
    if (!parts.length) {
      parts = [{ label: "", text: ex.prompt || "חשבו את האורכים.", taskIds: tasks.map(function (t) { return t.id; }) }];
    }
    var answerLines = tasks.map(function (t) {
      return canonicalStep(t, map);
    });
    // תיקון אורכי קטעים לפי נקודות של אותו חלק (כשיש אותן אותיות בשרטוטים שונים)
    parts.forEach(function (part) {
      var localMap = pointMap(part.points || []);
      (part.taskIds || []).forEach(function (tid) {
        var task = tasks.filter(function (t) {
          return t.id === tid;
        })[0];
        if (!task) return;
        if (task.kind === "segment" || task.kind === "distSeg") {
          var a = getPoint(localMap, task.from);
          var b = getPoint(localMap, task.to);
          if (a && b) {
            task._fromPt = a;
            task._toPt = b;
            if (task.kind === "segment") task.answer = segmentLength(a, b);
            if (task.kind === "distSeg") {
              var dp = getPoint(localMap, task.point);
              if (dp) task.answer = distPointToSegment(dp, a, b);
            }
          }
        }
      });
    });
    answerLines = tasks.map(function (t) {
      return canonicalStep(t, map);
    });
    return {
      geo: true,
      points: points,
      map: map,
      segments: segments,
      polygons: polygons,
      rightAngles: rightAngles,
      tasks: tasks,
      parts: parts,
      axisGuides:
        ex.showAxisGuides === false
          ? []
          : tasks
              .filter(function (t) {
                return t.kind === "axis";
              })
              .map(function (t) {
                return { point: t.point, axis: t.axis || "x" };
              }),
      promptHtml: ex.promptHtml || null,
      steps: answerLines,
      answer: answerLines.join(", "),
    };
  }

  function sceneForProgress(pack, progress) {
    progress = progress || { done: {} };
    var part = currentPartText(pack, progress);
    var rawPoints =
      part && part.points && part.points.length ? part.points : pack.points || [];
    var segs =
      part && part.segments && part.segments.length
        ? part.segments
        : pack.segments || [];
    var partIds = (part && part.taskIds) || [];
    var found = progress.coords || {};
    var points = rawPoints.map(function (p) {
      var copy = {
        label: p.label,
        x: p.x,
        y: p.y,
        hideX: !!p.hideX,
        hideY: !!p.hideY,
      };
      var task = (pack.tasks || []).filter(function (t) {
        if (t.kind !== "point") return false;
        if (String(t.point || "").toUpperCase() !== String(p.label || "").toUpperCase()) return false;
        if (partIds.length && partIds.indexOf(t.id) < 0) return false;
        return true;
      })[0];
      if (!task) {
        // נקודה שכבר נפתרה בחלק קודם עם אותו תווית — חפש לפי done
        task = (pack.tasks || []).filter(function (t) {
          return (
            t.kind === "point" &&
            String(t.point || "").toUpperCase() === String(p.label || "").toUpperCase() &&
            progress.done &&
            progress.done[t.id]
          );
        })[0];
      }
      if (task) {
        var cf = found[task.id] || {};
        var miss = String(task.missing || "").toLowerCase();
        if (progress.done && progress.done[task.id]) {
          copy.hideX = false;
          copy.hideY = false;
          copy.revealed = true;
        } else if (miss === "both") {
          if (cf.x) copy.hideX = false;
          if (cf.y) copy.hideY = false;
        } else if (progress.partial && progress.partial[task.id]) {
          if (miss === "y") copy.hideY = false;
          else copy.hideX = false;
        }
      }
      return copy;
    });
    return {
      points: points,
      segments: segs,
      polygons: pack.polygons || [],
      rightAngles: pack.rightAngles || [],
      axisGuides: pack.axisGuides || [],
      distGuides: (function () {
        var guides = [];
        (partIds || []).forEach(function (tid) {
          var task = (pack.tasks || []).filter(function (t) {
            return t.id === tid && t.kind === "distSeg";
          })[0];
          if (!task) return;
          var p = points.filter(function (q) {
            return String(q.label).toUpperCase() === String(task.point || "").toUpperCase();
          })[0];
          var a = points.filter(function (q) {
            return String(q.label).toUpperCase() === String(task.from || "").toUpperCase();
          })[0];
          var b = points.filter(function (q) {
            return String(q.label).toUpperCase() === String(task.to || "").toUpperCase();
          })[0];
          var foot = footOnAxisSeg(p, a, b);
          if (p && foot) guides.push({ from: p, to: foot });
        });
        return guides;
      })(),
    };
  }

  function parseNumberToken(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(",", ".");
    if (!t) return null;
    var abs = t.match(/^\|(.+)\|$/);
    if (abs) {
      var inner = parseNumberToken(abs[1]);
      return inner == null ? null : Math.abs(inner);
    }
    if (/^-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?$/.test(t)) {
      if (t.indexOf("/") !== -1) {
        var parts = t.split("/");
        var n = parseFloat(parts[0], 10);
        var d = parseFloat(parts[1], 10);
        if (!isFinite(n) || !isFinite(d) || near0(d)) return null;
        return n / d;
      }
      return parseFloat(t, 10);
    }
    return null;
  }

  /** חישוב ביניים: 5-2, 2-0, 0-(-7), 0--7, וגם 0+7 */
  function evalStepExpr(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (!t) return null;
    var direct = parseNumberToken(t);
    if (direct != null) return direct;
    var a;
    var b;
    var mParen = t.match(/^(-?\d+(?:\.\d+)?)-\((-?\d+(?:\.\d+)?)\)$/);
    if (mParen) {
      a = parseFloat(mParen[1], 10);
      b = parseFloat(mParen[2], 10);
      return isFinite(a) && isFinite(b) ? a - b : null;
    }
    var mDouble = t.match(/^(-?\d+(?:\.\d+)?)--(\d+(?:\.\d+)?)$/);
    if (mDouble) {
      a = parseFloat(mDouble[1], 10);
      b = parseFloat(mDouble[2], 10);
      return isFinite(a) && isFinite(b) ? a - -b : null;
    }
    var mSub = t.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
    if (mSub) {
      a = parseFloat(mSub[1], 10);
      b = parseFloat(mSub[2], 10);
      return isFinite(a) && isFinite(b) ? a - b : null;
    }
    var mAddParen = t.match(/^(-?\d+(?:\.\d+)?)\+\((-?\d+(?:\.\d+)?)\)$/);
    if (mAddParen) {
      a = parseFloat(mAddParen[1], 10);
      b = parseFloat(mAddParen[2], 10);
      return isFinite(a) && isFinite(b) ? a + b : null;
    }
    var mAdd = t.match(/^(-?\d+(?:\.\d+)?)\+(-?\d+(?:\.\d+)?)$/);
    if (mAdd) {
      a = parseFloat(mAdd[1], 10);
      b = parseFloat(mAdd[2], 10);
      return isFinite(a) && isFinite(b) ? a + b : null;
    }
    return null;
  }

  function prettyStepExpr(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (!t) return "";
    var mAdd = t.match(/^(-?\d+(?:\.\d+)?)\+(-?\d+(?:\.\d+)?)$/);
    if (mAdd) return fmtNum(parseFloat(mAdd[1], 10)) + " + " + fmtNum(parseFloat(mAdd[2], 10));
    var mAddParen = t.match(/^(-?\d+(?:\.\d+)?)\+\((-?\d+(?:\.\d+)?)\)$/);
    if (mAddParen) {
      return fmtNum(parseFloat(mAddParen[1], 10)) + " + " + formatLo(parseFloat(mAddParen[2], 10));
    }
    var mParen = t.match(/^(-?\d+(?:\.\d+)?)-\((-?\d+(?:\.\d+)?)\)$/);
    if (mParen) {
      return fmtNum(parseFloat(mParen[1], 10)) + " − " + formatLo(parseFloat(mParen[2], 10));
    }
    var mDouble = t.match(/^(-?\d+(?:\.\d+)?)--(\d+(?:\.\d+)?)$/);
    if (mDouble) {
      return fmtNum(parseFloat(mDouble[1], 10)) + " − (" + fmtNum(-parseFloat(mDouble[2], 10)) + ")";
    }
    var mSub = t.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
    if (mSub) {
      return fmtNum(parseFloat(mSub[1], 10)) + " − " + formatLo(parseFloat(mSub[2], 10));
    }
    return t;
  }

  function isBareNumberExpr(s) {
    return parseNumberToken(s) != null;
  }

  function extractAnswerValue(typed) {
    var s = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (!s) return { value: null, tag: null, kind: null };
    // מאפשרים "=4" / ":4" כמו "4" (המשך שרשרת אחרי ביטוי ביניים)
    if (/^[=:]+/.test(s)) {
      s = s.replace(/^[=:]+/, "");
      if (!s) return { value: null, tag: null, kind: null };
    }

    function classifyRhs(rhs) {
      var pair = parsePointPair(rhs);
      if (pair) return { value: null, kind: "point", point: pair, display: formatPointPair(pair.x, pair.y) };
      if (isBareNumberExpr(rhs)) return { value: parseNumberToken(rhs), kind: "final", display: null };
      var v = evalStepExpr(rhs);
      if (v == null) return { value: null, kind: null, display: null };
      return { value: v, kind: "diff", display: prettyStepExpr(rhs) };
    }

    // sAOB=... / S△AOB=... / SAOB=...
    var taggedArea = s.match(/^S(?:△|Δ)?([A-Za-z]{3})(?:=|:)(.+)$/i);
    if (taggedArea) {
      return {
        tag: normAreaTag(taggedArea[1]),
        value: null,
        kind: "area",
        areaRhs: taggedArea[2],
        displayExpr: prettyAreaExpr(taggedArea[2]),
      };
    }

    // B=(4;-1) / B(4;-1) / B=4;-1 / B(4,-1)
    var taggedPoint =
      s.match(/^([A-Za-z])=\(?(-?\d+(?:\.\d+)?)[;,](-?\d+(?:\.\d+)?)\)?$/) ||
      s.match(/^([A-Za-z])\((-?\d+(?:\.\d+)?)[;,](-?\d+(?:\.\d+)?)\)$/);
    if (taggedPoint) {
      return {
        tag: normGeoTag(taggedPoint[1]),
        value: null,
        kind: "point",
        point: { x: parseFloat(taggedPoint[2], 10), y: parseFloat(taggedPoint[3], 10) },
        displayExpr: formatPointPair(parseFloat(taggedPoint[2], 10), parseFloat(taggedPoint[3], 10)),
      };
    }

    // Bx=Ax / By=Cy — העתקת שיעור מנקודה ידועה
    var twinEq = s.match(/^([A-Za-z])[_ ]?([xyXY])=([A-Za-z])[_ ]?([xyXY])$/);
    if (twinEq && twinEq[2].toLowerCase() === twinEq[4].toLowerCase()) {
      return {
        tag: normGeoTag(twinEq[1] + twinEq[2]),
        value: null,
        kind: "twin",
        twinPoint: twinEq[3].toUpperCase(),
        twinAxis: twinEq[4].toLowerCase(),
        displayExpr: twinEq[1].toUpperCase() + twinEq[2].toLowerCase() + "=" + twinEq[3].toUpperCase() + twinEq[4].toLowerCase(),
      };
    }

    // C→AB=2 / C->AB:5-2 / CAB=2
    var taggedDist = s.match(/^([A-Za-z])(?:→|->)([A-Za-z]{2})(?:=|:)(.+)$/);
    if (taggedDist) {
      var cd = classifyRhs(taggedDist[3]);
      return {
        tag: normGeoTag(taggedDist[1] + taggedDist[2]),
        value: cd.value,
        kind: cd.kind,
        displayExpr: cd.display,
      };
    }

    // OB=2 / A→x=4-0 / Ax=4 / AB=5-2 / Bx=4 / CAB=2
    var tagged = s.match(/^([A-Za-z](?:→|->|-)?[xyXY]|[A-Za-z]{1,3})0?(?:=|:)(.+)$/);
    if (tagged) {
      var c = classifyRhs(tagged[2]);
      return {
        tag: normGeoTag(tagged[1]),
        value: c.value,
        kind: c.kind,
        point: c.point || null,
        displayExpr: c.display,
      };
    }
    // זוג שיעורים בלי שם: (4;-1)
    var barePair = parsePointPair(s);
    if (barePair) {
      return {
        tag: null,
        value: null,
        kind: "point",
        point: barePair,
        displayExpr: formatPointPair(barePair.x, barePair.y),
      };
    }
    // 2-0=2 או 0+7=7
    var eq = s.match(/^(.+)=(.+)$/);
    if (eq) {
      var left = evalStepExpr(eq[1]);
      var rightBare = parseNumberToken(eq[2]);
      var rightStep = evalStepExpr(eq[2]);
      if (left != null && rightBare != null && nearNum(left, rightBare)) {
        return {
          tag: null,
          value: rightBare,
          kind: "full",
          expression: eq[1],
          displayExpr: prettyStepExpr(eq[1]),
        };
      }
      if (rightStep != null) {
        var rk = isBareNumberExpr(eq[2]) ? "final" : "diff";
        return {
          tag: null,
          value: rightStep,
          kind: rk,
          displayExpr: rk === "diff" ? prettyStepExpr(eq[2]) : null,
        };
      }
      // רק אגף שמאלי כביטוי אחרי = ריק — לא
      if (left != null && eq[2] === "") {
        return { tag: null, value: left, kind: "diff", displayExpr: prettyStepExpr(eq[1]) };
      }
    }
    if (isBareNumberExpr(s)) {
      return { tag: null, value: parseNumberToken(s), kind: "final" };
    }
    if (evalStepExpr(s) != null) {
      return {
        tag: null,
        value: evalStepExpr(s),
        kind: "diff",
        displayExpr: prettyStepExpr(s),
      };
    }
    return { value: null, tag: null, kind: null };
  }

  function taskMatchesTag(task, tag) {
    if (!tag) return true;
    var t = normGeoTag(tag);
    if (normGeoTag(task.id) === t) return true;
    if (normGeoTag(task.label) === t) return true;
    if (task.kind === "origin") {
      var p = String(task.point || "").toUpperCase();
      var ob = "O" + p;
      var bo = p + "O";
      if (t === p || t === ob || t === bo) return true;
    }
    if (task.kind === "axis") {
      var ap = String(task.point || "").toUpperCase();
      var aax = String(task.axis || "x").toLowerCase() === "y" ? "Y" : "X";
      if (t === ap + aax) return true;
    }
    if (task.kind === "segment") {
      var ab = String(task.from || "").toUpperCase() + String(task.to || "").toUpperCase();
      var ba = String(task.to || "").toUpperCase() + String(task.from || "").toUpperCase();
      if (t === ab || t === ba) return true;
    }
    if (task.kind === "distSeg") {
      var p0 = String(task.point || "").toUpperCase();
      var f0 = String(task.from || "").toUpperCase();
      var t0 = String(task.to || "").toUpperCase();
      if (t === p0 + f0 + t0 || t === p0 + t0 + f0) return true;
      if (t === normGeoTag(task.label)) return true;
    }
    if (task.kind === "point") {
      var pp = String(task.point || "").toUpperCase();
      if (t === pp) return true;
      if (t === pp + "X" || t === "X" + pp || t === pp + "Y" || t === "Y" + pp) return true;
    }
    if (task.kind === "area") {
      var av = (task.verts || []).map(function (v) {
        return String(v || "").toUpperCase();
      }).join("");
      var nt = normAreaTag(tag);
      if (nt === av || normAreaTag(task.id) === nt || normAreaTag(task.label) === nt) return true;
      // סדר קודקודים מחזורי
      if (av.length === 3) {
        var rot = [av, av[1] + av[2] + av[0], av[2] + av[0] + av[1]];
        var rev = av.split("").reverse().join("");
        var rotR = [rev, rev[1] + rev[2] + rev[0], rev[2] + rev[0] + rev[1]];
        if (rot.indexOf(nt) >= 0 || rotR.indexOf(nt) >= 0) return true;
      }
    }
    return false;
  }

  function missingCoordValue(task, axis) {
    if (!task || task.kind !== "point") return null;
    var ax = String(axis || task.missing || "x").toLowerCase();
    if (ax === "y") return task.answerY;
    return task.answerX;
  }

  function resolveTwinPoint(pack, progress, label) {
    var part = currentPartText(pack, progress);
    if (part && part.points) {
      var hit = part.points.filter(function (p) {
        return String(p.label || "").toUpperCase() === String(label || "").toUpperCase();
      })[0];
      if (hit) return hit;
    }
    return getPoint(pack.map, label);
  }

  function preferPartTasks(tasks, pack, progress) {
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    if (!ids.length) return tasks;
    // רק משימות של הסעיף הנוכחי — בלי ליפול חזרה לתרגילים מסעיפים אחרים
    return tasks.filter(function (t) {
      return ids.indexOf(t.id) >= 0;
    });
  }

  function areaVertsLabel(task) {
    return (task.verts || [])
      .map(function (v) {
        return String(v || "").toUpperCase();
      })
      .join("");
  }

  function pendingAreaTasks(pending, pack, progress) {
    return preferPartTasks(
      (pending || []).filter(function (t) {
        return t.kind === "area";
      }),
      pack,
      progress
    );
  }

  function looksLikeAreaAttempt(typed, parsed) {
    if (parsed && parsed.kind === "area") return true;
    var s = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (/^S(?:△|Δ)?[A-Za-z]{3}/i.test(s)) return true;
    return false;
  }

  function extractAreaTagFromTyped(typed, parsed) {
    if (parsed && parsed.kind === "area" && parsed.tag) return normAreaTag(parsed.tag);
    var s = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var m = s.match(/^S(?:△|Δ)?([A-Za-z]{3})/i);
    return m ? normAreaTag(m[1]) : null;
  }

  function wrongTriangleMessage(task, gotTag) {
    var want = areaVertsLabel(task);
    var got = normAreaTag(gotTag) || "?";
    return (
      "שם המשולש לא מדויק (△" +
      got +
      "). חשבו את שטח △" +
      want +
      " — רשמו למשל s" +
      want +
      "=…."
    );
  }

  function checkTyped(typed, pack, progress) {
    progress = progress || { done: {}, partial: {}, coords: {} };
    var doneMap = progress.done || {};
    var partialMap = progress.partial || {};
    var coordsMap = {};
    Object.keys(progress.coords || {}).forEach(function (k) {
      coordsMap[k] = {
        x: !!(progress.coords[k] && progress.coords[k].x),
        y: !!(progress.coords[k] && progress.coords[k].y),
      };
    });
    var pending = pack.tasks.filter(function (t) {
      return !doneMap[t.id];
    });
    if (!remainingRequired(pack, doneMap).length) {
      return { ok: true, solved: true, message: "כל החלקים כבר נפתרו." };
    }
    var parsed = extractAnswerValue(typed);

    // —— מציאת נקודה (שיעורים) ——
    var pointPending = preferPartTasks(
      pending.filter(function (t) {
        return t.kind === "point" && taskMatchesTag(t, parsed.tag);
      }),
      pack,
      progress
    );
    // מספר בודד / ביטוי בלי תווית: לא חוטפים נקודה optional שטרם התחילו
    // (למשל 10 אחרי BC=14−4 לא אמור להיחשב כשיעור של D)
    if (
      pointPending.length &&
      !parsed.tag &&
      parsed.kind !== "point" &&
      parsed.kind !== "twin" &&
      (parsed.kind === "final" || parsed.kind === "diff")
    ) {
      pointPending = pointPending.filter(function (t) {
        if (!t.optional) return true;
        var cf = coordsMap[t.id];
        return !!(cf && (cf.x || cf.y)) || !!partialMap[t.id];
      });
    }
    if (
      pointPending.length &&
      (parsed.kind === "point" ||
        parsed.kind === "twin" ||
        (parsed.kind === "final" && parsed.value != null) ||
        (parsed.kind === "diff" && parsed.value != null))
    ) {
      var phit = null;
      var pi;
      if (parsed.kind === "point" && parsed.point) {
        for (pi = 0; pi < pointPending.length; pi++) {
          if (
            nearNum(parsed.point.x, pointPending[pi].answerX) &&
            nearNum(parsed.point.y, pointPending[pi].answerY)
          ) {
            phit = pointPending[pi];
            break;
          }
        }
        if (!phit) {
          return {
            ok: false,
            message:
              "השיעורים עדיין לא מדויקים. זכרו: מקביל לציר y → אותו x; מקביל לציר x → אותו y.",
          };
        }
        var pDone = {};
        Object.keys(doneMap).forEach(function (k) {
          pDone[k] = true;
        });
        pDone[phit.id] = true;
        var pLeft = pack.tasks.filter(function (t) {
          return !pDone[t.id];
        });
        var pPartial = {};
        Object.keys(partialMap).forEach(function (k) {
          if (k !== phit.id) pPartial[k] = true;
        });
        var pCoords = {};
        Object.keys(coordsMap).forEach(function (k) {
          if (k !== phit.id) pCoords[k] = coordsMap[k];
        });
        var pointName = String(phit.point || phit.label || "").toUpperCase();
        var relatedSeg = preferPartTasks(
          pLeft.filter(function (t) {
            if (t.kind !== "segment" && t.kind !== "origin") return false;
            var a = String(t.from || "").toUpperCase();
            var b = String(t.to || "").toUpperCase();
            var p = String(t.point || "").toUpperCase();
            return a === pointName || b === pointName || p === pointName;
          }),
          pack,
          { done: pDone }
        )[0];
        var pointMsg;
        if (!pLeft.length) {
          pointMsg = "נכון. הנקודה " + phit.label + " התגלתה בשרטוט. כל התשובות נכונות.";
        } else if (relatedSeg) {
          pointMsg =
            "נכון. הנקודה " +
            phit.label +
            " התגלתה בשרטוט. עכשיו חשבו את אורך " +
            relatedSeg.label +
            " (גדול פחות קטן).";
        } else {
          pointMsg =
            "נכון. הנקודה " + phit.label + " התגלתה בשרטוט. נשארו עוד " + pLeft.length + ".";
        }
        return {
          ok: true,
          solved: pLeft.length === 0,
          done: pDone,
          partial: pPartial,
          coords: pCoords,
          lastExpr: progress.lastExpr || {},
          task: phit,
          revealPoint: phit.point,
          show: phit.label + pointTaskLabel(phit),
          message: pointMsg,
        };
      }

      // Bx=4 / By=3 / Bx=Ax
      phit = pointPending[0];
      var miss = String(phit.missing || "x").toLowerCase();
      var axisFromTag = null;
      if (parsed.tag) {
        var tagU = String(parsed.tag).toUpperCase();
        var pn = String(phit.point || phit.label || "").toUpperCase();
        if (tagU === pn + "X" || tagU === "X" + pn) axisFromTag = "x";
        if (tagU === pn + "Y" || tagU === "Y" + pn) axisFromTag = "y";
      }
      if (parsed.kind === "twin" && parsed.twinAxis) axisFromTag = parsed.twinAxis;
      if (miss === "x" || miss === "y") axisFromTag = miss;
      if (!axisFromTag) axisFromTag = "x";

      var want = missingCoordValue(phit, axisFromTag);
      var got = null;
      if (parsed.kind === "twin") {
        var twinLabel =
          parsed.twinPoint ||
          (axisFromTag === "y" ? phit.twinY || phit.twin : phit.twinX || phit.twin);
        var twin = resolveTwinPoint(pack, progress, twinLabel);
        if (!twin) {
          return { ok: false, message: "לא מצאתי את הנקודה " + twinLabel + "." };
        }
        got = parsed.twinAxis === "y" ? twin.y : twin.x;
      } else if (parsed.value != null) {
        got = parsed.value;
      }
      if (got == null || !nearNum(got, want)) {
        var hintTwin =
          axisFromTag === "y" ? phit.twinY || phit.twin : phit.twinX || phit.twin;
        return {
          ok: false,
          message:
            "השיעור החסר של " +
            phit.label +
            " הוא כמו של " +
            (hintTwin || "הנקודה המקבילה") +
            " על אותו ציר.",
        };
      }

      var midDone = {};
      Object.keys(doneMap).forEach(function (k) {
        midDone[k] = true;
      });
      var midPartial = {};
      Object.keys(partialMap).forEach(function (k) {
        midPartial[k] = true;
      });
      var midCoords = {};
      Object.keys(coordsMap).forEach(function (k) {
        midCoords[k] = { x: !!coordsMap[k].x, y: !!coordsMap[k].y };
      });
      if (!midCoords[phit.id]) midCoords[phit.id] = { x: false, y: false };
      if (axisFromTag === "y") midCoords[phit.id].y = true;
      else midCoords[phit.id].x = true;

      var midExpr = {};
      Object.keys(progress.lastExpr || {}).forEach(function (k) {
        midExpr[k] = progress.lastExpr[k];
      });
      var midShow =
        parsed.displayExpr || phit.label + axisFromTag + " = " + fmtNum(want);
      midExpr[phit.id] = midShow;

      var bothReady =
        miss !== "both"
          ? true
          : midCoords[phit.id].x && midCoords[phit.id].y;
      if (miss !== "both") {
        midPartial[phit.id] = true;
        return {
          ok: true,
          solved: false,
          done: midDone,
          partial: midPartial,
          coords: midCoords,
          lastExpr: midExpr,
          task: phit,
          show: midShow,
          message: "נכון. אפשר להמשיך עם " + phit.label + "(x;y), או לסיים ישר כך.",
        };
      }
      // missing both: אחרי שני השיעורים — עדיין דורשים B(x;y), או אם שניהם מולאו מאפשרים סגירה ב־B(x;y) בלבד
      midPartial[phit.id] = true;
      if (bothReady) {
        return {
          ok: true,
          solved: false,
          done: midDone,
          partial: midPartial,
          coords: midCoords,
          lastExpr: midExpr,
          task: phit,
          show: midShow,
          message: "נכון. שני השיעורים ידועים — רשמו " + phit.label + "(x;y).",
        };
      }
      return {
        ok: true,
        solved: false,
        done: midDone,
        partial: midPartial,
        coords: midCoords,
        lastExpr: midExpr,
        task: phit,
        show: midShow,
        message:
          "נכון. עוד חסר שיעור " +
          (midCoords[phit.id].x ? "y" : "x") +
          " של " +
          phit.label +
          ".",
      };
    }

    if (parsed.value == null || !isFinite(parsed.value) || !parsed.kind || parsed.kind === "point" || parsed.kind === "twin") {
      // —— שטח: גם כשהצעד המומלץ הוא צלע — מזהים ניסיון שטח (כולל אותיות שגויות) ——
      var allAreas = pendingAreaTasks(pending, pack, progress);
      if (looksLikeAreaAttempt(typed, parsed) && allAreas.length) {
        var gotAreaTag = extractAreaTagFromTyped(typed, parsed);
        var areaFocus = null;
        var ak;
        for (ak = 0; ak < allAreas.length; ak++) {
          if (!gotAreaTag || taskMatchesTag(allAreas[ak], gotAreaTag)) {
            areaFocus = allAreas[ak];
            break;
          }
        }
        if (!areaFocus) {
          return {
            ok: false,
            message: wrongTriangleMessage(allAreas[0], gotAreaTag),
            hint: canonicalStep(allAreas[0], pack.map),
          };
        }
        var areaRhs = null;
        if (parsed.kind === "area" && parsed.areaRhs) {
          areaRhs = parsed.areaRhs;
        } else {
          var rawTyped = String(typed || "")
            .replace(/[−–—]/g, "-")
            .replace(/\s+/g, "");
          var stripArea = rawTyped.match(/^S(?:△|Δ)?[A-Za-z]{3}(?:=|:)(.+)$/i);
          if (stripArea) areaRhs = stripArea[1];
          else if (/[*/×·÷()]|[A-Za-z]/.test(rawTyped) || rawTyped.indexOf("=") >= 0) {
            areaRhs = rawTyped;
          }
        }
        if (!areaRhs) {
          return {
            ok: false,
            message:
              "רשמו את חישוב השטח אחרי s" +
              areaVertsLabel(areaFocus) +
              "=, למשל (AB×BC)/2 או את המכפלה המספרית.",
            hint: canonicalStep(areaFocus, pack.map),
          };
        }
        var areaVal = evalGeoAreaRhs(areaRhs, pack.map);
        if (areaVal == null) {
          return {
            ok: false,
            message:
              "לא הצלחתי לחשב את הביטוי לשטח. בדקו את הנוסחה (רגל×רגל)/2.",
            hint: canonicalStep(areaFocus, pack.map),
          };
        }
        if (areaVal < 0 && nearNum(areaVal, -areaFocus.answer)) {
          return { ok: false, message: "כמעט, אותו ערך רק בחיובי." };
        }
        if (areaVal < 0) {
          return { ok: false, message: "שטח חייב להיות חיובי." };
        }
        if (!nearNum(areaVal, areaFocus.answer)) {
          return {
            ok: false,
            message:
              "עוד לא מדויק עבור " +
              areaFocus.label +
              ". שטח משולש ישר־זווית: (רגל×רגל)/2.",
            hint: canonicalStep(areaFocus, pack.map),
          };
        }
        var pretty = prettyAreaExpr(areaRhs);
        if (areaRhsIsComplete(areaRhs, areaFocus.answer)) {
          return finishAreaTask(areaFocus, pretty, areaRhs, doneMap, partialMap, coordsMap, pack, progress);
        }
        return partialAreaTask(areaFocus, pretty, doneMap, partialMap, coordsMap, pack, progress);
      }

      // ביטוי שטח בלי תג (למשל 7*4/2) כשיש משימת שטח פתוחה
      var areaPending = allAreas.length
        ? allAreas
        : preferPartTasks(
            pending.filter(function (t) {
              return t.kind === "area" && taskMatchesTag(t, parsed.tag);
            }),
            pack,
            progress
          );
      var areaRhsBare = null;
      if (areaPending.length && parsed.kind !== "area") {
        var rawBare = String(typed || "")
          .replace(/[−–—]/g, "-")
          .replace(/\s+/g, "");
        if (/[*/×·÷()]/.test(rawBare) || (rawBare.indexOf("=") >= 0 && /[A-Za-z]/.test(rawBare))) {
          areaRhsBare = rawBare;
        }
      }
      if (areaPending.length && areaRhsBare) {
        var areaVal2 = evalGeoAreaRhs(areaRhsBare, pack.map);
        if (areaVal2 != null) {
          var ahit = null;
          var ai;
          for (ai = 0; ai < areaPending.length; ai++) {
            if (nearNum(areaVal2, areaPending[ai].answer)) {
              ahit = areaPending[ai];
              break;
            }
          }
          if (ahit) {
            var pretty2 = prettyAreaExpr(areaRhsBare);
            if (areaRhsIsComplete(areaRhsBare, ahit.answer)) {
              return finishAreaTask(ahit, pretty2, areaRhsBare, doneMap, partialMap, coordsMap, pack, progress);
            }
            return partialAreaTask(ahit, pretty2, doneMap, partialMap, coordsMap, pack, progress);
          }
          return {
            ok: false,
            message:
              "עוד לא מדויק עבור " +
              areaPending[0].label +
              ". שטח משולש ישר־זווית: (רגל×רגל)/2.",
            hint: canonicalStep(areaPending[0], pack.map),
          };
        }
      }

      var partTasks = preferPartTasks(pending, pack, progress);
      var lookingPoint = partTasks.length && partTasks.every(function (t) {
        return t.kind === "point";
      });
      var lookingArea = partTasks.length && partTasks.every(function (t) {
        return t.kind === "area";
      });
      var hasOpenArea = pendingAreaTasks(pending, pack, progress).length > 0;
      return {
        ok: false,
        message: lookingPoint
          ? "רשמו את הנקודה (למשל B(4;−1)). אפשר גם Bx=… או Bx=Ax."
          : lookingArea || hasOpenArea
            ? "רשמו קודם אורך ניצב (גדול פחות קטן) או את שטח המשולש (למשל sABC=(AB×BC)/2)."
            : "רשמו קודם גדול פחות קטן (למשל 5−2), או נקודה במבנה B(4;−1).",
      };
    }

    // מספר סופי / שבר לשטח — 9 סוגר; 18/2 נשמר כביניים
    // אם כבר התחילו צלע (ביניים) והמספר מתאים לה — לא חוטפים לשטח
    var areaNumPending = preferPartTasks(
      pending.filter(function (t) {
        return t.kind === "area" && taskMatchesTag(t, parsed.tag);
      }),
      pack,
      progress
    );
    var openPartialLen = pending.filter(function (t) {
      return (
        partialMap[t.id] &&
        (t.kind === "segment" || t.kind === "origin" || t.kind === "axis" || t.kind === "distSeg") &&
        nearNum(parsed.value, t.answer)
      );
    });
    var bareAreaNum =
      !parsed.tag &&
      (parsed.kind === "final" || parsed.kind === "full") &&
      openPartialLen.length > 0;
    if (
      areaNumPending.length &&
      (parsed.kind === "final" || parsed.kind === "full") &&
      !bareAreaNum
    ) {
      var ahit2 = null;
      var aj;
      for (aj = 0; aj < areaNumPending.length; aj++) {
        if (nearNum(parsed.value, areaNumPending[aj].answer)) {
          ahit2 = areaNumPending[aj];
          break;
        }
      }
      if (ahit2) {
        var rawTok = String(typed || "")
          .replace(/[−–—]/g, "-")
          .replace(/\s+/g, "");
        var stripTok = rawTok.match(/^S(?:△|Δ)?[A-Za-z]{3}(?:=|:)(.+)$/i);
        if (stripTok) rawTok = stripTok[1];
        var lastTok = rawTok.split("=").pop();
        if (isAreaSimplifiedFinal(lastTok, ahit2.answer)) {
          return finishAreaTask(
            ahit2,
            rawTok.indexOf("=") >= 0 ? prettyAreaExpr(rawTok) : prettyAreaExpr(lastTok),
            rawTok,
            doneMap,
            partialMap,
            coordsMap,
            pack,
            progress
          );
        }
        return partialAreaTask(ahit2, prettyAreaExpr(lastTok), doneMap, partialMap, coordsMap, pack, progress);
      }
    }

    var candidates = preferPartTasks(
      pending.filter(function (t) {
        return t.kind !== "point" && t.kind !== "area" && taskMatchesTag(t, parsed.tag);
      }),
      pack,
      progress
    );
    if (!candidates.length) {
      var openLens = preferPartTasks(
        pending.filter(function (t) {
          return t.kind === "segment" || t.kind === "origin" || t.kind === "axis" || t.kind === "distSeg";
        }),
        pack,
        progress
      );
      if (parsed.tag && openLens.length && /^[A-Z]{1,3}$/i.test(String(parsed.tag))) {
        var suggest = openLens
          .slice(0, 3)
          .map(function (t) {
            return t.label;
          })
          .join(", ");
        return {
          ok: false,
          message:
            "התווית «" +
            String(parsed.tag).toUpperCase() +
            "» לא מתאימה לצעד הנוכחי. נסו למשל " +
            suggest +
            ".",
        };
      }
      if (looksLikeAreaAttempt(typed, parsed) && pendingAreaTasks(pending, pack, progress).length) {
        var ar = pendingAreaTasks(pending, pack, progress)[0];
        return {
          ok: false,
          message: wrongTriangleMessage(ar, extractAreaTagFromTyped(typed, parsed)),
          hint: canonicalStep(ar, pack.map),
        };
      }
      return { ok: false, message: "לא מצאתי איזה קטע/נקודה התכוונתם. נסו למשל AB=5−2 או B(x;y)." };
    }
    // אם התחילו קטע מסוים — ממשיכים אותו (גם כשרושמים רק את המספר)
    var started = candidates.filter(function (t) {
      return partialMap[t.id];
    });
    if (started.length) candidates = started;

    var hit = null;
    var i;
    for (i = 0; i < candidates.length; i++) {
      if (nearNum(parsed.value, candidates[i].answer)) {
        hit = candidates[i];
        break;
      }
    }
    if (!hit) {
      var focus = candidates[0];
      var negHit = null;
      for (i = 0; i < candidates.length; i++) {
        var ansNeg = candidates[i].answer;
        if (ansNeg != null && isFinite(ansNeg) && !near0(ansNeg) && nearNum(parsed.value, -ansNeg)) {
          negHit = candidates[i];
          break;
        }
      }
      if (negHit) {
        return {
          ok: false,
          message: "כמעט, אותו ערך רק בחיובי.",
          hint: canonicalStep(negHit, pack.map),
        };
      }
      if (parsed.value != null && isFinite(parsed.value) && parsed.value < 0) {
        return {
          ok: false,
          message: "מרחק חייב להיות חיובי.",
          hint: canonicalStep(focus, pack.map),
        };
      }
      return {
        ok: false,
        message:
          "עוד לא מדויק עבור " +
          focus.label +
          ". זכרו: ערך גדול פחות ערך קטן.",
        hint: canonicalStep(focus, pack.map),
      };
    }

    var nextDone = {};
    Object.keys(doneMap).forEach(function (k) {
      nextDone[k] = true;
    });
    var nextPartial = {};
    Object.keys(partialMap).forEach(function (k) {
      nextPartial[k] = true;
    });
    var nextCoords = {};
    Object.keys(coordsMap).forEach(function (k) {
      nextCoords[k] = coordsMap[k];
    });

    // שלב ביניים: גדול פחות קטן, או מעבר 0+7 — מצטבר באותה שורה
    if (parsed.kind === "diff") {
      nextPartial[hit.id] = true;
      var prevMid = (progress.lastExpr && progress.lastExpr[hit.id]) || "";
      var midBit = parsed.displayExpr || canonicalDiffBody(hit, pack.map);
      var midChain = appendDiffExpr(prevMid, midBit);
      var midShow2 = hit.label + ": " + midChain;
      var nextExpr = {};
      Object.keys(progress.lastExpr || {}).forEach(function (k) {
        nextExpr[k] = progress.lastExpr[k];
      });
      nextExpr[hit.id] = midChain;
      var midMsg = simplifiedDiffBody(midChain)
        ? "נכון. אפשר לפשט (למשל מינוס שלילי לחיבור), ואז לחשב: " +
          hit.label +
          " = " +
          fmtNum(hit.answer) +
          "."
        : "נכון. עכשיו חשבו: " + hit.label + " = " + fmtNum(hit.answer) + ".";
      return {
        ok: true,
        solved: false,
        done: nextDone,
        partial: nextPartial,
        coords: nextCoords,
        lastExpr: nextExpr,
        task: hit,
        show: midShow2,
        message: midMsg,
      };
    }

    // תוצאה סופית / שורה מלאה גדול פחות קטן=תוצאה
    nextDone[hit.id] = true;
    delete nextPartial[hit.id];
    var left = remainingRequired(pack, nextDone);
    var leftAll = pack.tasks.filter(function (t) {
      return !nextDone[t.id];
    });
    var kept = (progress.lastExpr && progress.lastExpr[hit.id]) || canonicalDiffBody(hit, pack.map);
    var finalShow = kept
      ? hit.label + ": " + appendDiffExpr(kept, fmtNum(hit.answer))
      : canonicalStep(hit, pack.map);
    var nextExpr2 = {};
    Object.keys(progress.lastExpr || {}).forEach(function (k) {
      if (k !== hit.id) nextExpr2[k] = progress.lastExpr[k];
    });
    var leftOptionalLens = preferPartTasks(
      pack.tasks.filter(function (t) {
        return (
          t.optional &&
          !nextDone[t.id] &&
          (t.kind === "segment" || t.kind === "origin")
        );
      }),
      pack,
      progress
    );
    var moreMsg;
    if (left.length === 0 && leftAll.length === 0) {
      moreMsg = "כל התשובות נכונות.";
    } else if (hit.optional && leftOptionalLens.length) {
      moreMsg =
        "נכון. עכשיו מצאו את " +
        leftOptionalLens
          .map(function (t) {
            return t.label;
          })
          .join(" ו־") +
        ".";
    } else if (hit.optional && left.length) {
      moreMsg = "נכון. מומלץ להמשיך לנוסחת השטח.";
    } else if (left.length) {
      moreMsg = "נכון. נשארו עוד " + left.length + " תשובות.";
    } else {
      moreMsg = "נכון. המשיכו.";
    }
    return {
      ok: true,
      solved: left.length === 0,
      done: nextDone,
      partial: nextPartial,
      coords: nextCoords,
      lastExpr: nextExpr2,
      task: hit,
      show: finalShow,
      message: moreMsg,
    };
  }

  function segmentPairName(a, b) {
    return String(a || "").toUpperCase() + String(b || "").toUpperCase();
  }

  function pointHintMessage(task, progress) {
    var name = String(task.label || task.point || "").toUpperCase();
    var miss = String(task.missing || "x").toLowerCase();
    var head = "מצאו את הנקודה " + name + ".";
    if (miss === "both") {
      var cf = (progress.coords && progress.coords[task.id]) || {};
      if (cf.x && cf.y) {
        return head;
      }
      if (cf.x && !cf.y) {
        return (
          head +
          " בגלל שהקו " +
          segmentPairName(name, task.twinY) +
          " מקביל לציר ה־x, לנקודות " +
          name +
          " ו־" +
          String(task.twinY || "").toUpperCase() +
          " יש אותו ערך y."
        );
      }
      if (!cf.x && cf.y) {
        return (
          head +
          " בגלל שהקו " +
          segmentPairName(task.twinX, name) +
          " מקביל לציר ה־y, לנקודות " +
          String(task.twinX || "").toUpperCase() +
          " ו־" +
          name +
          " יש אותו ערך x."
        );
      }
      return (
        head +
        " כדי למצוא את שני השיעורים נעזרים גם בישר שמקביל לציר ה־y וגם בישר שמקביל לציר ה־x: " +
        "הקו " +
        segmentPairName(task.twinX, name) +
        " מקביל לציר ה־y → אותו x כמו " +
        String(task.twinX || "").toUpperCase() +
        "; והקו " +
        segmentPairName(name, task.twinY) +
        " מקביל לציר ה־x → אותו y כמו " +
        String(task.twinY || "").toUpperCase() +
        "."
      );
    }
    if (progress.partial && progress.partial[task.id]) {
      return head;
    }
    var twin = String(task.twin || (miss === "y" ? task.twinY : task.twinX) || "").toUpperCase();
    var seg = segmentPairName(twin, name);
    var parallelAxis = miss === "x" ? "y" : "x";
    return (
      head +
      " בגלל שהקו " +
      seg +
      " מקביל לציר ה־" +
      parallelAxis +
      ", לנקודות " +
      twin +
      " ו־" +
      name +
      " יש אותו ערך " +
      miss +
      "."
    );
  }

  function segmentOrientation(task, map) {
    if (!task || task.kind !== "segment") return null;
    var a = task._fromPt || getPoint(map, task.from);
    var b = task._toPt || getPoint(map, task.to);
    if (!a || !b) return null;
    if (nearNum(a.y, b.y)) return "h";
    if (nearNum(a.x, b.x)) return "v";
    return null;
  }

  function segmentHintMessage(task, map, progress) {
    var name = String(task.label || "").toUpperCase();
    if (progress.partial && progress.partial[task.id]) {
      return "חשבו את אורך הקטע " + name + " — התוצאה של גדול פחות קטן.";
    }
    var ori = segmentOrientation(task, map);
    if (ori === "h") {
      return (
        "מצאו את אורך הקטע " +
        name +
        ". בגלל שהקו מקביל לציר ה־x, מחשבים לפי ערכי x: x גדול פחות x קטן."
      );
    }
    if (ori === "v") {
      return (
        "מצאו את אורך הקטע " +
        name +
        ". בגלל שהקו מקביל לציר ה־y, מחשבים לפי ערכי y: y גדול פחות y קטן."
      );
    }
    return "מצאו את אורך הקטע " + name + ".";
  }

  function distSegHintMessage(task, map, progress) {
    var name = String(task.label || distPointToSegName(task.point, task.from, task.to));
    var p = String(task.point || "").toUpperCase();
    var seg = String(task.from || "").toUpperCase() + String(task.to || "").toUpperCase();
    if (progress.partial && progress.partial[task.id]) {
      return "חשבו את המרחק " + name + " — התוצאה של גדול פחות קטן.";
    }
    var a = task._fromPt || getPoint(map, task.from);
    var b = task._toPt || getPoint(map, task.to);
    if (a && b && nearNum(a.x, b.x)) {
      return (
        "מצאו את מרחק הנקודה " +
        p +
        " מהקטע " +
        seg +
        ". בגלל ש־" +
        seg +
        " מקביל לציר ה־y, המרחק הוא לפי ערכי x: x גדול פחות x קטן."
      );
    }
    if (a && b && nearNum(a.y, b.y)) {
      return (
        "מצאו את מרחק הנקודה " +
        p +
        " מהקטע " +
        seg +
        ". בגלל ש־" +
        seg +
        " מקביל לציר ה־x, המרחק הוא לפי ערכי y: y גדול פחות y קטן."
      );
    }
    return "מצאו את מרחק הנקודה " + p + " מהקטע " + seg + ".";
  }

  function axisHintMessage(task, progress) {
    var name = String(task.label || axisDistanceName(task.point, task.axis || "x"));
    var p = String(task.point || "").toUpperCase();
    var ax = String(task.axis || "x").toLowerCase() === "y" ? "y" : "x";
    if (progress.partial && progress.partial[task.id]) {
      return "חשבו את התוצאה: " + name + " = " + fmtNum(task.answer) + ".";
    }
    if (ax === "x") {
      return (
        "עבור " +
        name +
        ": מרחק מציר ה־x הוא פשוט ערך ה־y של הנקודה " +
        p +
        " (בערך מוחלט — המרחק תמיד חיובי). אפשר גם גדול פחות קטן מול 0."
      );
    }
    return (
      "עבור " +
      name +
      ": מרחק מציר ה־y הוא פשוט ערך ה־x של הנקודה " +
      p +
      " (בערך מוחלט — המרחק תמיד חיובי). אפשר גם גדול פחות קטן מול 0."
    );
  }

  function nextHint(pack, progress) {
    progress = progress || { done: {}, partial: {}, coords: {} };
    var pending = preferPartTasks(
      pack.tasks.filter(function (t) {
        return !progress.done[t.id];
      }),
      pack,
      progress
    );
    if (!pending.length) return { message: "התרגיל כבר נפתר." };

    // מעדיפים משימה שהתלמיד כבר התחיל באותו סעיף
    var inProgress = pending.filter(function (t) {
      if (progress.partial && progress.partial[t.id]) return true;
      var cf = progress.coords && progress.coords[t.id];
      return !!(cf && (cf.x || cf.y));
    });
    // דרך מומלצת: קודם נקודה חסרה (כמו D), אחר כך אורכים optional, אחר כך שאר
    var recommendedPoints = pending.filter(function (t) {
      return t.optional && t.kind === "point";
    });
    var recommendedLens = pending.filter(function (t) {
      return t.optional && (t.kind === "segment" || t.kind === "origin");
    });
    // אחרי מציאת נקודה (כמו D) — עדיף לחשב קטע שיוצא ממנה (AD) לפני בסיס אחר
    var afterFoundPoint = pending.filter(function (t) {
      if (t.kind !== "segment") return false;
      return (pack.tasks || []).some(function (pt) {
        if (pt.kind !== "point" || !progress.done || !progress.done[pt.id]) return false;
        var name = String(pt.point || "").toUpperCase();
        return (
          String(t.from || "").toUpperCase() === name ||
          String(t.to || "").toUpperCase() === name
        );
      });
    });
    var t = inProgress.length
      ? inProgress[0]
      : recommendedPoints.length
        ? recommendedPoints[0]
        : recommendedLens.length
          ? recommendedLens[0]
          : afterFoundPoint.length
            ? afterFoundPoint[0]
            : pending[0];
    if (t.kind === "point") {
      var msg = pointHintMessage(t, progress);
      // רמז לגובה: AD מקביל ל־y ו־D על BC
      if (
        String(t.point || "").toUpperCase() === "D" &&
        t.twinX &&
        t.twinY &&
        !(progress.coords && progress.coords[t.id] && (progress.coords[t.id].x || progress.coords[t.id].y))
      ) {
        msg =
          "מצאו את הנקודה D. AD מאונך ל־BC (מקביל לציר ה־y) → ל־D אותו x כמו ל־" +
          String(t.twinX).toUpperCase() +
          "; D נמצאת על BC → אותו y כמו ל־" +
          String(t.twinY).toUpperCase() +
          " (ו־C). אפשר לרשום D(x;y) או Dx=" +
          String(t.twinX).toUpperCase() +
          "x ו־Dy=" +
          String(t.twinY).toUpperCase() +
          "y.";
      }
      var fullPoint = t.label + pointTaskLabel(t);
      // צעד אחד / השלמה: ישר את הנקודה; Bx=… נשאר אופציונלי בהקלדה
      return {
        task: t,
        message: msg,
        step: fullPoint,
        answer: fullPoint,
      };
    }
    if (t.kind === "segment" || t.kind === "origin" || t.kind === "axis" || t.kind === "distSeg") {
      var segMsg =
        t.kind === "distSeg"
          ? distSegHintMessage(t, pack.map, progress)
          : t.kind === "axis"
            ? axisHintMessage(t, progress)
            : t.kind === "segment"
              ? segmentHintMessage(t, pack.map, progress)
              : progress.partial && progress.partial[t.id]
                ? "חשבו את התוצאה: " + t.label + " = " + fmtNum(t.answer) + "."
                : "עבור " +
                  t.label +
                  ": רשמו גדול פחות קטן לפי השיעור המתאים על הציר, ואז את התוצאה.";
      if (progress.partial && progress.partial[t.id]) {
        var prevExpr = progress.lastExpr && progress.lastExpr[t.id];
        var simpStep = prevExpr && simplifiedDiffBody(prevExpr);
        if (simpStep) {
          return {
            task: t,
            message: segMsg,
            step: simpStep.replace(/\s+/g, ""),
            answer: fmtNum(t.answer),
          };
        }
        return {
          task: t,
          message: segMsg,
          step: fmtNum(t.answer),
          answer: fmtNum(t.answer),
        };
      }
      return {
        task: t,
        message: segMsg,
        step: labeledDiff(t, pack.map),
        answer: fmtNum(t.answer),
      };
    }
    if (t.kind === "area") {
      var nextBit = nextAreaStageBit(t, pack.map, progress);
      var bitStep = String(nextBit || "").replace(/×/g, "*");
      return {
        task: t,
        message: areaStageMessage(nextBit, t, pack.map),
        step: bitStep,
        answer: fmtNum(t.answer),
      };
    }
    if (progress.partial && progress.partial[t.id]) {
      return {
        task: t,
        message: "חשבו את התוצאה: " + t.label + " = " + fmtNum(t.answer) + ".",
        step: fmtNum(t.answer),
        answer: fmtNum(t.answer),
      };
    }
    return {
      task: t,
      message:
        "עבור " +
        t.label +
        ": רשמו קודם " +
        labeledDiff(t, pack.map) +
        ", ואז את התוצאה " +
        fmtNum(t.answer) +
        ".",
      step: labeledDiff(t, pack.map),
      answer: fmtNum(t.answer),
    };
  }

  function formatPartHtml(text) {
    var esc = String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // ביטויים מתמטיים LTR בתוך טקסט עברי — מונע מינוס מימין (1-)
    return esc.replace(
      /[A-Za-z]{1,3}(?:→[xyXY]|[xyXY])?\s*=\s*(?:[A-Za-z]{1,3}(?:→[xyXY]|[xyXY])?|\(?[−–—-]?\d+(?:[.,;][−–—-]?\d+)?\)?)|[A-Za-z]→[A-Za-z]{2}|[A-Za-z]\s*\(\s*[−–—-]?\d+\s*[.,;]\s*[−–—-]?\d+\s*\)|\(\s*[−–—-]?\d+\s*[.,;]\s*[−–—-]?\d+\s*\)|[−–—-]\d+(?:\.\d+)?/g,
      function (chunk) {
        return '<span class="m-expr" dir="ltr">' + chunk + "</span>";
      }
    );
  }

  function currentPartText(pack, progress) {
    progress = progress || { done: {} };
    var parts = pack.parts || [];
    var taskById = {};
    (pack.tasks || []).forEach(function (t) {
      taskById[t.id] = t;
    });
    var i;
    for (i = 0; i < parts.length; i++) {
      var ids = parts[i].taskIds || [];
      var open = ids.some(function (id) {
        var t = taskById[id];
        // משימות מומלצות (optional) לא חוסמות מעבר לסעיף הבא
        if (t && t.optional) return false;
        return !progress.done[id];
      });
      if (open || !ids.length) return parts[i];
    }
    return parts[parts.length - 1] || null;
  }

  global.DoctematicaGeometry = {
    analyzeStart: analyzeStart,
    checkTyped: checkTyped,
    nextHint: nextHint,
    currentPartText: currentPartText,
    formatPartHtml: formatPartHtml,
    sceneForProgress: sceneForProgress,
    canonicalStep: canonicalStep,
    canonicalDiffChain: canonicalDiffChain,
    canonicalDiffSteps: canonicalDiffSteps,
    canonicalAreaChain: canonicalAreaChain,
    canonicalAreaSteps: canonicalAreaSteps,
    fmtNum: fmtNum,
    coordLabel: coordLabel,
    segmentLength: segmentLength,
    distOrigin: distOrigin,
    distAxis: distAxis,
  };
})(window);
