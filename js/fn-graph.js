(function (global) {
  var AXIS = 0.11;
  var SIDE = 0.07;
  var FLAT = 0.22;
  var TREND = 0.12;
  var POINT_DIST = 0.24;
  var MIN_LEN = 0.28;

  function num(n) {
    var v = Number(n);
    return isFinite(v) ? v : 0;
  }

  function lineOf(line) {
    if (!line) return null;
    var x1 = num(line.x1);
    var y1 = num(line.y1);
    var x2 = num(line.x2);
    var y2 = num(line.y2);
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < MIN_LEN) return null;
    return { x1: x1, y1: y1, x2: x2, y2: y2, dx: dx, dy: dy, len: len };
  }

  function slopeOf(line) {
    if (Math.abs(line.dx) < 0.04) return null;
    return line.dy / line.dx;
  }

  function crossX(line) {
    if (Math.abs(line.dy) < 1e-6) return null;
    var t = (0 - line.y1) / line.dy;
    return line.x1 + t * line.dx;
  }

  function crossY(line) {
    if (Math.abs(line.dx) < 1e-6) return null;
    var t = (0 - line.x1) / line.dx;
    return line.y1 + t * line.dy;
  }

  function sideOf(q, positiveName, negativeName, originName) {
    if (Math.abs(q) <= AXIS) return originName;
    return q > 0 ? positiveName : negativeName;
  }

  function onAxis(q) {
    return Math.abs(q) <= AXIS;
  }

  function pointSideOk(value, q) {
    if (Math.abs(Number(value)) < 1e-6) return onAxis(q);
    if (Number(value) > 0) return q > SIDE;
    return q < -SIDE;
  }

  function distToLine(px, py, line) {
    var len = line.len || 1;
    var area = Math.abs(line.dx * (line.y1 - py) - (line.x1 - px) * line.dy);
    return area / len;
  }

  function validatePoint(point, others) {
    if (!point) return { ok: false, message: "חסרה נקודה." };
    var x = Number(point.x);
    var y = Number(point.y);
    var qx = num(point.qx);
    var qy = num(point.qy);
    if (!isFinite(x) || !isFinite(y)) return { ok: false, message: "רשמו את הנקודה כזוג סדור, למשל (0,−2)." };
    if (!pointSideOk(x, qx)) {
      if (Math.abs(x) < 1e-6) return { ok: false, message: "נקודה עם x = 0 צריכה להיות על ציר ה־y." };
      return {
        ok: false,
        message: x > 0 ? "ערך x חיובי צריך להיות מימין לציר ה־y." : "ערך x שלילי צריך להיות משמאל לציר ה־y.",
      };
    }
    if (!pointSideOk(y, qy)) {
      if (Math.abs(y) < 1e-6) return { ok: false, message: "נקודה עם y = 0 צריכה להיות על ציר ה־x." };
      return {
        ok: false,
        message: y > 0 ? "ערך y חיובי צריך להיות מעל ציר ה־x." : "ערך y שלילי צריך להיות מתחת לציר ה־x.",
      };
    }
    var i;
    var list = others || [];
    for (i = 0; i < list.length; i++) {
      var other = list[i];
      if (Number(other.x) < x - 1e-6 && !(num(other.qx) < qx - 0.02)) {
        return { ok: false, message: "הנקודה עם x גדול יותר צריכה להיות ימינה יותר." };
      }
      if (Number(other.x) > x + 1e-6 && !(num(other.qx) > qx + 0.02)) {
        return { ok: false, message: "הנקודה עם x קטן יותר צריכה להיות שמאלה יותר." };
      }
      if (Number(other.y) < y - 1e-6 && !(num(other.qy) < qy - 0.02)) {
        return { ok: false, message: "הנקודה עם y גדול יותר צריכה להיות גבוהה יותר." };
      }
      if (Number(other.y) > y + 1e-6 && !(num(other.qy) > qy + 0.02)) {
        return { ok: false, message: "הנקודה עם y קטן יותר צריכה להיות נמוכה יותר." };
      }
    }
    return { ok: true };
  }

  function staysOnSide(line, side) {
    var ys = [line.y1, line.y2];
    var mid = crossY(line);
    if (mid != null) ys.push(mid);
    var i;
    for (i = 0; i < ys.length; i++) {
      if (side === "above" && ys[i] <= SIDE) return false;
      if (side === "below" && ys[i] >= -SIDE) return false;
      if (side === "origin" && Math.abs(ys[i]) > AXIS) return false;
    }
    return true;
  }

  function validateLineSketch(model, expect) {
    var line = lineOf(model && model.line);
    if (!line) return { ok: false, message: "גררו עם העט על מערכת הצירים." };
    if (Math.abs(line.dx) < 0.04) return { ok: false, message: "ישר אנכי אינו גרף של פונקציה." };
    var slope = slopeOf(line);
    if (slope == null) return { ok: false, message: "ישר אנכי אינו גרף של פונקציה." };
    if (expect.trend === "flat") {
      if (Math.abs(slope) > FLAT) return { ok: false, message: "פונקציה קבועה היא ישר אופקי." };
      if (!staysOnSide(line, expect.ySide)) {
        if (expect.ySide === "above") return { ok: false, message: "הישר האופקי צריך להיות מעל ציר ה־x." };
        if (expect.ySide === "below") return { ok: false, message: "הישר האופקי צריך להיות מתחת לציר ה־x." };
        return { ok: false, message: "הישר האופקי צריך להיות על ציר ה־x." };
      }
    } else if (expect.trend === "inc") {
      if (slope < TREND) return { ok: false, message: "הפונקציה עולה — הישר צריך לעלות משמאל לימין." };
    } else if (expect.trend === "dec") {
      if (slope > -TREND) return { ok: false, message: "הפונקציה יורדת — הישר צריך לרדת משמאל לימין." };
    }

    if (expect.trend !== "flat") {
      var xAt = crossX(line);
      if (xAt == null || Math.abs(xAt) > 1.15) {
        return { ok: false, message: "הישר צריך לחצות את ציר ה־x בתוך מערכת הצירים." };
      }
      var gotX = sideOf(xAt, "right", "left", "origin");
      if (expect.xSide !== "none" && expect.xSide !== "many" && gotX !== expect.xSide) {
        if (expect.xSide === "left") return { ok: false, message: "החיתוך עם ציר ה־x צריך להיות משמאל לראשית." };
        if (expect.xSide === "right") return { ok: false, message: "החיתוך עם ציר ה־x צריך להיות מימין לראשית." };
        return { ok: false, message: "הישר צריך לעבור בראשית הצירים." };
      }
      var yAt = crossY(line);
      if (yAt == null || Math.abs(yAt) > 1.15) {
        return { ok: false, message: "הישר צריך לחצות את ציר ה־y בתוך מערכת הצירים." };
      }
      var gotY = sideOf(yAt, "above", "below", "origin");
      if (gotY !== expect.ySide) {
        if (expect.ySide === "above") return { ok: false, message: "החיתוך עם ציר ה־y צריך להיות מעל ציר ה־x." };
        if (expect.ySide === "below") return { ok: false, message: "החיתוך עם ציר ה־y צריך להיות מתחת לציר ה־x." };
        return { ok: false, message: "הישר צריך לחצות את ציר ה־y בראשית." };
      }
    }

    var points = (model && model.points) || [];
    var i;
    for (i = 0; i < points.length; i++) {
      var p = points[i];
      if (distToLine(num(p.qx), num(p.qy), line) > POINT_DIST) {
        var label = "(" + p.x + "," + p.y + ")";
        return { ok: false, message: "הישר לא עובר ליד הנקודה " + label + " שסימנתם." };
      }
    }
    return { ok: true, message: "השרטוט מתאים לפונקציה." };
  }

  function samplesOf(model) {
    var curve = (model && model.curve) || [];
    return curve.filter(function (p) {
      return p && isFinite(Number(p.qx)) && isFinite(Number(p.qy));
    }).map(function (p) {
      return { qx: num(p.qx), qy: num(p.qy) };
    });
  }

  function nearestOnCurve(samples, qx, qy) {
    var best = 99;
    var i;
    for (i = 1; i < samples.length; i++) {
      var a = samples[i - 1];
      var b = samples[i];
      var dx = b.qx - a.qx;
      var dy = b.qy - a.qy;
      var len2 = dx * dx + dy * dy || 1;
      var t = ((qx - a.qx) * dx + (qy - a.qy) * dy) / len2;
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      var x = a.qx + t * dx;
      var y = a.qy + t * dy;
      var d = Math.sqrt((x - qx) * (x - qx) + (y - qy) * (y - qy));
      if (d < best) best = d;
    }
    return best;
  }

  function resampleCurve(samples) {
    var sorted = samples.slice().sort(function (a, b) { return a.qx - b.qx; });
    var out = [];
    var i;
    for (i = 0; i < sorted.length; i++) {
      var p = sorted[i];
      var last = out[out.length - 1];
      if (last && Math.abs(p.qx - last.qx) < 0.02) {
        last.qy = (last.qy * last.n + p.qy) / (last.n + 1);
        last.n += 1;
      } else out.push({ qx: p.qx, qy: p.qy, n: 1 });
    }
    return out;
  }

  function curveExtreme(samples, opens) {
    var extreme = samples[0];
    var i;
    for (i = 1; i < samples.length; i++) {
      if (opens === "up" ? samples[i].qy < extreme.qy : samples[i].qy > extreme.qy) extreme = samples[i];
    }
    return extreme;
  }

  function xCrossings(samples) {
    var found = [];
    var lastSign = 0;
    var lastQx = samples[0].qx;
    var i;
    for (i = 0; i < samples.length; i++) {
      var s = Math.abs(samples[i].qy) < 0.03 ? 0 : (samples[i].qy > 0 ? 1 : -1);
      if (s === 0) continue;
      if (lastSign !== 0 && s !== lastSign) found.push((lastQx + samples[i].qx) / 2);
      lastSign = s;
      lastQx = samples[i].qx;
    }
    var merged = [];
    found.forEach(function (qx) {
      var last = merged[merged.length - 1];
      if (last != null && Math.abs(qx - last) < 0.1) return;
      merged.push(qx);
    });
    return merged;
  }

  function yNearAxis(samples) {
    var best = null;
    var i;
    for (i = 0; i < samples.length; i++) {
      if (!best || Math.abs(samples[i].qx) < Math.abs(best.qx)) best = samples[i];
    }
    if (!best || Math.abs(best.qx) > 0.22) return null;
    return best.qy;
  }

  function wrongSide(value, q) {
    if (Math.abs(Number(value)) < 1e-6) return Math.abs(q) > 0.16;
    if (Number(value) > 0) return q < -0.04;
    return q > 0.04;
  }

  function armMessage(samples, extreme, opens) {
    var left = false;
    var right = false;
    var bad = false;
    var i;
    for (i = 0; i < samples.length; i++) {
      var dx = samples[i].qx - extreme.qx;
      if (Math.abs(dx) < 0.1) continue;
      var rise = samples[i].qy - extreme.qy;
      var ok = opens === "up" ? rise > 0.03 : rise < -0.03;
      if (dx < 0) left = true;
      else right = true;
      if (!ok) bad = true;
    }
    if (!left || !right) return "המשיכו את שתי הזרועות של הפרבולה.";
    if (!bad) return "";
    return opens === "up"
      ? "הפרבולה נפתחת כלפי מטה, אבל המקדם של x² חיובי."
      : "הפרבולה נפתחת כלפי מעלה, אבל המקדם של x² שלילי.";
  }

  function validateParabola(model, expect) {
    var raw = samplesOf(model);
    if (raw.length < 8) return { ok: false, message: "גררו עם העט את הפרבולה על מערכת הצירים." };
    var samples = resampleCurve(raw);
    var opens = expect.opens === "down" ? "down" : "up";
    var extreme = curveExtreme(samples, opens);
    var arms = armMessage(samples, extreme, opens);
    if (arms) return { ok: false, message: arms };
    var vertex = expect.vertex;
    if (vertex) {
      if (wrongSide(vertex.x, extreme.qx) || wrongSide(vertex.y, extreme.qy)) {
        return { ok: false, message: "מקמו את הקודקוד בצד הנכון של הצירים." };
      }
    }
    var hits = expect.xHits == null ? 2 : expect.xHits;
    var crossings = xCrossings(samples);
    if (hits === 0 && crossings.length) return { ok: false, message: "הפרבולה לא חותכת את ציר ה־x." };
    if (hits === 1 && (crossings.length > 1 || (vertex && Math.abs(extreme.qy) > 0.18))) {
      return { ok: false, message: "הפרבולה נוגעת בציר ה־x בנקודה אחת, ואינה חוצה אותו." };
    }
    if (hits >= 2 && crossings.length < 2) {
      return { ok: false, message: crossings.length === 1
        ? "הפונקציה חותכת את ציר ה־x בשתי נקודות, אבל השרטוט עובר דרכו רק פעם אחת."
        : "הפרבולה חותכת את ציר ה־x בשתי נקודות." };
    }
    if (hits >= 2 && crossings.length > 2) return { ok: false, message: "הפרבולה חותכת את ציר ה־x בשתי נקודות בלבד." };
    var roots = (expect.roots || []).slice().sort(function (a, b) { return a - b; });
    if (hits >= 2 && roots.length >= 2 && crossings.length >= 2) {
      var leftQx = crossings[0];
      var rightQx = crossings[crossings.length - 1];
      if (extreme.qx < leftQx - 0.06 || extreme.qx > rightQx + 0.06) {
        return { ok: false, message: "הקודקוד צריך להיות בין שני החיתוכים עם ציר ה־x." };
      }
      if (wrongSide(roots[0], leftQx) || wrongSide(roots[1], rightQx)) {
        return { ok: false, message: "מקמו כל חיתוך עם ציר ה־x בצד הנכון של הראשית." };
      }
      var absL = Math.abs(roots[0]);
      var absR = Math.abs(roots[1]);
      var small = Math.max(Math.min(absL, absR), 0.25);
      if (Math.max(absL, absR) / small >= 1.45) {
        var leftFarther = Math.abs(leftQx) > Math.abs(rightQx);
        if ((absL > absR) !== leftFarther) {
          return { ok: false, message: "על ציר ה־x, החיתוך עם הערך המוחלט הגדול יותר צריך להיות רחוק יותר מהראשית." };
        }
      }
    }
    var yAt = yNearAxis(samples);
    if (yAt == null) return { ok: false, message: "העקומה צריכה לעבור גם ליד ציר ה־y." };
    if (expect.y0 != null && wrongSide(expect.y0, yAt)) {
      return { ok: false, message: Number(expect.y0) > 0
        ? "החיתוך עם ציר ה־y צריך להיות מעל ציר ה־x."
        : Number(expect.y0) < 0
          ? "החיתוך עם ציר ה־y צריך להיות מתחת לציר ה־x."
          : "החיתוך עם ציר ה־y צריך להיות בראשית." };
    }
    if (vertex && expect.y0 != null) {
      var vy = Math.abs(Number(vertex.y));
      var iy = Math.abs(Number(expect.y0));
      var base = Math.max(Math.min(vy, iy), 0.25);
      if (Math.max(vy, iy) / base >= 1.45) {
        var vertexFarther = Math.abs(extreme.qy) > Math.abs(yAt);
        if ((vy > iy) !== vertexFarther) {
          return { ok: false, message: vy > iy
            ? "הקודקוד רחוק יותר מציר ה־x מאשר החיתוך עם ציר ה־y."
            : "החיתוך עם ציר ה־y רחוק יותר מציר ה־x מאשר הקודקוד." };
        }
      }
    }
    var points = (model && model.points) || [];
    var i;
    for (i = 0; i < points.length; i++) {
      if (nearestOnCurve(samples, num(points[i].qx), num(points[i].qy)) > 0.36) {
        return { ok: false, message: "העקומה לא עוברת ליד הנקודה (" + points[i].x + "," + points[i].y + ") שסימנתם." };
      }
    }
    return { ok: true, message: "השרטוט מתאים לפונקציה." };
  }

  function validateSketch(model, expect) {
    expect = expect || {};
    if (expect.family === "line") return validateLineSketch(model, expect);
    if (expect.family === "parabola") return validateParabola(model, expect);
    return { ok: false, message: "עדיין אין בדיקת שרטוט לסוג הפונקציה הזה." };
  }

  global.DoctematicaFnGraph = {
    validatePoint: validatePoint,
    validateSketch: validateSketch,
  };
})(window);
