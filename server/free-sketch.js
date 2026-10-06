"use strict";

var extremaEngine = require("./extrema");

function num(value) {
  var n = Number(value);
  if (!isFinite(n)) return "";
  if (Object.is(n, -0) || n === 0) return "0";
  var text = String(n);
  return n < 0 ? "−" + text.slice(1) : text;
}

function near(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-6;
}

function pointText(x, y) {
  return "(" + num(x) + "," + num(y) + ")";
}

function fText(x, y) {
  return "f(" + num(x) + ")=" + num(y);
}

function domainOf(ex) {
  var found = (ex.constraints || []).filter(function (item) { return item.type === "DOMAIN"; })[0];
  if (found && found.all) return { all: true };
  if (!found) return { min: -1, max: 1, includeMin: true, includeMax: true };
  return {
    min: Number(found.min),
    max: Number(found.max),
    includeMin: found.includeMin !== false,
    includeMax: found.includeMax !== false,
  };
}

function withPart(ex, part) {
  var extra = (part && part.constraints) || [];
  if (!extra.length) return ex;
  return {
    constraints: (ex.constraints || []).concat(extra),
    parts: ex.parts,
    stem: ex.stem,
  };
}

function domainText(domain) {
  return num(domain.min) + (domain.includeMin ? "≤" : "<") + "x" + (domain.includeMax ? "≤" : "<") + num(domain.max);
}

function intervalText(item) {
  return num(item.fromX) + "≤x≤" + num(item.toX);
}

function constraints(ex, type) {
  return (ex.constraints || []).filter(function (item) { return item.type === type; });
}

function yKnown(item) {
  return !!(item && item.y != null && isFinite(Number(item.y)));
}

function freeExtrema(ex) {
  return constraints(ex, "EXTREMUM").filter(function (item) { return !yKnown(item); });
}

function positiveOnDomain(ex) {
  return constraints(ex, "POSITIVE_ON_DOMAIN").length > 0;
}

function atDomainEnd(ex, x) {
  var domain = domainOf(ex);
  if (!domain || domain.all) return false;
  return near(x, domain.min) || near(x, domain.max);
}

function nearDomainEnd(ex, x) {
  var domain = domainOf(ex);
  if (!domain || domain.all || !isFinite(x)) return false;
  var width = Math.max(1, domain.max - domain.min);
  var tol = Math.max(0.28, width * 0.06);
  return Math.abs(x - domain.min) <= tol || Math.abs(x - domain.max) <= tol;
}

function freeYIssue(ex, item, y) {
  var kind = item.kind === "max" ? "מקסימום" : "מינימום";
  if (positiveOnDomain(ex) && !(Number(y) > 0.05)) {
    return issue("belowInPositiveInterval", "הפונקציה חיובית בכל תחום ההגדרה, ולכן גם ב־x=" + num(item.x) + " הערך חיובי. הגובה עצמו אינו נתון.");
  }
  var known = requiredPoints(ex);
  if (item.kind === "min" && known.some(function (pt) { return Number(y) >= Number(pt.y) - 0.05; })) {
    return issue("wrongExtremumType", "נקודת מינימום ב־x=" + num(item.x) + " נמוכה מהערכים בקצוות. הגובה עצמו אינו נתון.");
  }
  if (item.kind === "max" && known.some(function (pt) { return Number(y) <= Number(pt.y) + 0.05; })) {
    return issue("wrongExtremumType", "נקודת " + kind + " ב־x=" + num(item.x) + " גבוהה מערכי הקצה. הגובה עצמו אינו נתון.");
  }
  return null;
}

function requiredPoints(ex) {
  var pts = [];
  (ex.constraints || []).forEach(function (item) {
    if (item.type === "KNOWN_POINT") pts.push({ x: Number(item.x), y: Number(item.y), kind: "given" });
    if (item.type === "Y_INTERCEPT") pts.push({ x: 0, y: Number(item.y), kind: "y" });
    if (item.type === "X_INTERCEPT" || item.type === "ZERO_AT_X") pts.push({ x: Number(item.x), y: 0, kind: "x" });
    if (item.type === "EXTREMUM" && yKnown(item)) pts.push({ x: Number(item.x), y: Number(item.y), kind: "extremum" });
    if (item.type === "CONSTANT_INTERVAL") {
      pts.push({ x: Number(item.fromX), y: Number(item.value), kind: "const" });
      pts.push({ x: Number(item.toX), y: Number(item.value), kind: "const" });
    }
  });
  var out = [];
  pts.forEach(function (pt) {
    if (!out.some(function (item) { return near(item.x, pt.x) && near(item.y, pt.y); })) out.push(pt);
  });
  return out;
}

function samePoint(a, b) {
  return near(a.x, b.x) && near(a.y, b.y);
}

function issue(id, message) {
  return { ok: false, id: id, message: message };
}

function sideIssue(x, y, qx, qy) {
  if (near(x, 0) && Math.abs(qx) > 0.16) {
    return issue("wrongYIntercept", "הנקודה שבה x=0 נמצאת על ציר ה־y.");
  }
  if (near(y, 0) && Math.abs(qy) > 0.16) {
    return issue("wrongXIntercept", "נקודת אפס נמצאת על ציר ה־x.");
  }
  if (x > 0.05 && qx < -0.06) return issue("pointOnWrongSideOfAxis", "הנקודה " + pointText(x, y) + " צריכה להיות מימין לציר ה־y.");
  if (x < -0.05 && qx > 0.06) return issue("pointOnWrongSideOfAxis", "הנקודה " + pointText(x, y) + " צריכה להיות משמאל לציר ה־y.");
  if (y > 0.05 && qy < -0.06) return issue("pointOnWrongSideOfAxis", "הנקודה " + pointText(x, y) + " צריכה להיות מעל ציר ה־x.");
  if (y < -0.05 && qy > 0.06) return issue("pointOnWrongSideOfAxis", "הנקודה " + pointText(x, y) + " צריכה להיות מתחת לציר ה־x.");
  return null;
}

function orderIssue(points) {
  var i;
  var j;
  for (i = 0; i < points.length; i++) {
    for (j = i + 1; j < points.length; j++) {
      var a = points[i];
      var b = points[j];
      if (near(a.x, b.x)) {
        if (Math.abs(a.qx - b.qx) > 0.14) {
          return issue("wrongRelativeXOrder", "נקודות עם אותו x נמצאות על אותו קו אנכי.");
        }
      } else if (a.x < b.x && a.qx > b.qx + 0.025) {
        return issue("wrongRelativeXOrder", "סדר ה־x בשרטוט הפוך: " + pointText(a.x, a.y) + " צריכה להיות משמאל ל־" + pointText(b.x, b.y) + ".");
      } else if (b.x < a.x && b.qx > a.qx + 0.025) {
        return issue("wrongRelativeXOrder", "סדר ה־x בשרטוט הפוך: " + pointText(b.x, b.y) + " צריכה להיות משמאל ל־" + pointText(a.x, a.y) + ".");
      }
      if (near(a.y, b.y)) {
        if (Math.abs(a.qy - b.qy) > 0.16) {
          return issue("wrongRelativeYOrder", "נקודות עם אותו y נמצאות בערך באותו גובה.");
        }
      } else if (a.y < b.y && a.qy > b.qy + 0.025) {
        return issue("wrongRelativeYOrder", "סדר הגבהים בשרטוט הפוך: " + pointText(a.x, a.y) + " צריכה להיות נמוכה מ־" + pointText(b.x, b.y) + ".");
      } else if (b.y < a.y && b.qy > a.qy + 0.025) {
        return issue("wrongRelativeYOrder", "סדר הגבהים בשרטוט הפוך: " + pointText(b.x, b.y) + " צריכה להיות נמוכה מ־" + pointText(a.x, a.y) + ".");
      }
    }
  }
  return null;
}

function judgePoint(ex, sketch, point) {
  var x = Number(point.x);
  var y = Number(point.y);
  var qx = Number(point.qx);
  var qy = Number(point.qy);
  if (!isFinite(x) || !isFinite(y) || !isFinite(qx) || !isFinite(qy)) {
    return issue("missingGivenPoint", "רשמו זוג סדור, למשל (0,5).");
  }
  var required = requiredPoints(ex);
  var known = required.some(function (item) { return samePoint(item, { x: x, y: y }); });
  var swapped = !known && required.filter(function (item) {
    return !near(item.x, item.y) && near(item.x, y) && near(item.y, x);
  })[0];
  if (swapped) {
    return issue(
      "swappedCoordinates",
      "מהנתון " + fText(swapped.x, swapped.y) + " מתקבלת נקודה שבה x=" + num(swapped.x) + " ו־y=" + num(swapped.y) + "."
    );
  }
  if (!known) {
    var exceptionX = constraints(ex, "SIGN_EXCEPTION").filter(function (item) { return near(item.x, x); })[0];
    if (exceptionX) {
      var freeSide = sideIssue(x, y, qx, qy);
      if (freeSide) return freeSide;
      return { ok: true, role: "user" };
    }
    var userZero = near(y, 0) && constraints(ex, "ZERO_COUNT").some(function (item) { return Number(item.count) > 0; });
    if (userZero && !required.some(function (item) { return near(item.x, x); })) {
      var axis = sideIssue(x, y, qx, qy);
      if (axis) return axis;
      return { ok: true, role: "user" };
    }
    var sameX = required.filter(function (item) { return near(item.x, x); });
    if (sameX.length === 1) {
      if (atDomainEnd(ex, x)) {
        return issue("wrongEndpoint", "בקצה התחום x=" + num(sameX[0].x) + " הערך הוא " + num(sameX[0].y) + ", לא " + num(y) + ".");
      }
      return issue(
        "unrelatedPoint",
        "מהנתון " + fText(sameX[0].x, sameX[0].y) + " מתקבלת הנקודה " + pointText(sameX[0].x, sameX[0].y) + ", לא " + pointText(x, y) + "."
      );
    }
    var freeAt = freeExtrema(ex).filter(function (item) { return near(item.x, x); })[0];
    if (freeAt) {
      if (atDomainEnd(ex, x)) {
        return issue("endpointTreatedAsInteriorExtremum", "x=" + num(x) + " הוא קצה של תחום ההגדרה, לא נקודת הקיצון הפנימית.");
      }
      var badHeight = freeYIssue(ex, freeAt, y);
      if (badHeight) return badHeight;
      var freeSide = sideIssue(x, y, qx, qy);
      if (freeSide) return freeSide;
      var freeOrder = orderIssue(((sketch && sketch.points) || []).concat([{ x: x, y: y, qx: qx, qy: qy }]));
      if (freeOrder) return freeOrder;
      return { ok: true, role: "extremum" };
    }
    var sameY = required.filter(function (item) { return near(item.y, y); });
    if (sameY.length === 1) {
      return issue(
        "unrelatedPoint",
        "הנקודה " + pointText(x, y) + " אינה נובעת מהנתונים. y=" + num(y) + " מתקבל בנקודה " + pointText(sameY[0].x, sameY[0].y) + "."
      );
    }
    return issue("unrelatedPoint", "הנקודה " + pointText(x, y) + " אינה נובעת מהנתונים.");
  }
  var side = sideIssue(x, y, qx, qy);
  if (side) return side;
  var placed = ((sketch && sketch.points) || []).concat([{ x: x, y: y, qx: qx, qy: qy }]);
  var order = orderIssue(placed);
  if (order) return order;
  return { ok: true, role: known ? "given" : "user" };
}

function samplesOf(sketch) {
  var out = [];
  ((sketch && sketch.strokes) || []).forEach(function (stroke) {
    (stroke || []).forEach(function (pt) {
      if (isFinite(pt.qx) && isFinite(pt.qy)) out.push({ qx: Number(pt.qx), qy: Number(pt.qy) });
    });
  });
  return out;
}

function axisMap(anchors, q, logicalKey, qKey) {
  var pts = (anchors || []).filter(function (pt) {
    return isFinite(pt[qKey]) && isFinite(pt[logicalKey]);
  }).slice().sort(function (a, b) { return a[qKey] - b[qKey]; });
  if (!pts.length) return NaN;
  if (pts.length === 1) return pts[0][logicalKey] + (q - pts[0][qKey]) / 0.22;
  function slope(i) {
    var span = pts[i + 1][qKey] - pts[i][qKey];
    if (Math.abs(span) < 1e-4) return 0;
    return (pts[i + 1][logicalKey] - pts[i][logicalKey]) / span;
  }
  if (q <= pts[0][qKey]) return pts[0][logicalKey] + (q - pts[0][qKey]) * slope(0);
  var i;
  for (i = 0; i < pts.length - 1; i++) {
    if (q <= pts[i + 1][qKey]) {
      var span = pts[i + 1][qKey] - pts[i][qKey];
      if (Math.abs(span) < 1e-4) return pts[i][logicalKey];
      var t = (q - pts[i][qKey]) / span;
      return pts[i][logicalKey] + t * (pts[i + 1][logicalKey] - pts[i][logicalKey]);
    }
  }
  var last = pts.length - 1;
  return pts[last][logicalKey] + (q - pts[last][qKey]) * slope(last - 1);
}

function logicalSamples(sketch) {
  var anchors = (sketch && sketch.points) || [];
  return samplesOf(sketch).map(function (sample) {
    return {
      qx: sample.qx,
      qy: sample.qy,
      x: axisMap(anchors, sample.qx, "x", "qx"),
      y: axisMap(anchors, sample.qy, "y", "qy"),
    };
  }).filter(function (sample) { return isFinite(sample.x) && isFinite(sample.y); });
}

function verticalIssue(samples, domain) {
  if (samples.length < 5) return null;
  var width = domain && domain.all ? 8 : Math.max(1, domain.max - domain.min);
  var tolX = Math.max(0.12, width * 0.025);
  var ys = samples.map(function (sample) { return sample.y; });
  var ySpan = Math.max(4, Math.max.apply(null, ys) - Math.min.apply(null, ys));
  var yTol = Math.max(1.2, ySpan * 0.18);
  var i;
  var j;
  var k;
  for (i = 0; i < samples.length; i++) {
    for (j = i + 4; j < samples.length; j++) {
      if (Math.abs(samples[i].x - samples[j].x) >= tolX) continue;
      if (Math.abs(samples[i].y - samples[j].y) <= yTol) continue;
      var turned = false;
      for (k = i + 1; k < j; k++) {
        if (Math.abs(samples[k].x - samples[i].x) > tolX * 2) turned = true;
      }
      if (turned) {
        return issue("verticalLineTestViolation", "השרטוט אינו יכול להיות גרף של פונקציה: עבור אותו ערך x מתקבלים יותר מערך y אחד.");
      }
    }
  }
  return null;
}

function missingPoint(required, points) {
  var i;
  for (i = 0; i < required.length; i++) {
    if (!points.some(function (pt) { return samePoint(pt, required[i]); })) return required[i];
  }
  return null;
}

function curveMiss(required, points, samples) {
  var i;
  for (i = 0; i < required.length; i++) {
    var need = required[i];
    var placed = points.filter(function (pt) { return samePoint(pt, need); })[0];
    if (!placed) continue;
    var close = samples.some(function (sample) {
      var dx = sample.qx - Number(placed.qx);
      var dy = sample.qy - Number(placed.qy);
      return Math.sqrt(dx * dx + dy * dy) < 0.2;
    });
    if (!close) {
      return issue("curveMissesRequiredPoint", "הגרף אינו עובר דרך הנקודה " + pointText(need.x, need.y) + ". בדקו את " + fText(need.x, need.y) + ".");
    }
  }
  return null;
}

function domainIssue(samples, domain, ex) {
  if (domain && domain.all) return null;
  var xs = samples.map(function (sample) { return sample.x; });
  var lo = Math.min.apply(null, xs);
  var hi = Math.max.apply(null, xs);
  var width = Math.max(1, domain.max - domain.min);
  var pad = Math.max(0.45, width * 0.1);
  if (lo < domain.min - pad || hi > domain.max + pad) {
    if (ex && (freeExtrema(ex).length || positiveOnDomain(ex))) {
      if (lo < domain.min - width && hi > domain.max + width) {
        return issue("ignoredDomain", "הפונקציה מוגדרת רק בתחום " + domainText(domain) + ".");
      }
      return issue("extendedBeyondDomain", "הגרף נמשך מעבר לתחום ההגדרה " + domainText(domain) + ". אין להמשיך ימינה או שמאלה מחוץ לתחום.");
    }
    return issue("continuedPastDomain", "הגרף נמשך מעבר לתחום ההגדרה " + domainText(domain) + ".");
  }
  var cover = Math.max(0.55, width * 0.12);
  if (lo > domain.min + cover || hi < domain.max - cover) {
    return issue("outsideDomain", "הגרף צריך להתחיל ולהסתיים לפי תחום ההגדרה " + domainText(domain) + ".");
  }
  return null;
}

function median(values) {
  var list = values.slice().sort(function (a, b) { return a - b; });
  return list[Math.floor(list.length / 2)];
}

function constantIssue(ex, points, logical) {
  var found = null;
  constraints(ex, "CONSTANT_INTERVAL").forEach(function (item) {
    if (found) return;
    var inside = logical.filter(function (sample) {
      return sample.x >= Number(item.fromX) + 0.08 && sample.x <= Number(item.toX) - 0.08;
    });
    var text = intervalText(item);
    if (inside.length < 4) {
      found = issue("constantIntervalNotConstant", "בתחום " + text + " הגרף צריך להיות אופקי בגובה y=" + num(item.value) + ".");
      return;
    }
    var qys = inside.map(function (sample) { return sample.qy; });
    var spread = Math.max.apply(null, qys) - Math.min.apply(null, qys);
    var anchors = points.filter(function (pt) { return near(pt.y, item.value) && isFinite(pt.qy); });
    var target = anchors.length ? anchors.reduce(function (sum, pt) { return sum + Number(pt.qy); }, 0) / anchors.length : NaN;
    var mid = median(qys);
    if (isFinite(target) && spread <= 0.12 && Math.abs(mid - target) > 0.12) {
      found = issue("wrongConstantValue", "בתחום " + text + " ערך הפונקציה הוא " + num(item.value) + ", לא גובה אחר.");
      return;
    }
    if (spread > 0.12) {
      found = issue("constantIntervalNotConstant", "בתחום " + text + " ערך הפונקציה קבוע, ולכן הגרף שם אופקי בגובה y=" + num(item.value) + ".");
    }
  });
  return found;
}

function signGaps(ex) {
  var pts = requiredPoints(ex).slice().sort(function (a, b) { return a.x - b.x; });
  var gaps = [];
  var i;
  for (i = 0; i < pts.length - 1; i++) {
    if (pts[i].y * pts[i + 1].y < 0) gaps.push({ from: pts[i].x, to: pts[i + 1].x, fromY: pts[i].y, toY: pts[i + 1].y });
  }
  return gaps;
}

function minZeros(ex) {
  var pts = requiredPoints(ex).slice().sort(function (a, b) { return a.x - b.x; });
  var count = 0;
  var i;
  for (i = 0; i < pts.length; i++) if (near(pts[i].y, 0)) count += 1;
  return count + signGaps(ex).length;
}

function pathCrosses(logical, from, to) {
  var mid = logical.filter(function (sample) {
    return sample.x >= from - 0.05 && sample.x <= to + 0.05;
  }).slice().sort(function (a, b) { return a.x - b.x; });
  var i;
  for (i = 0; i < mid.length; i++) {
    if (Math.abs(mid[i].y) < 0.45) return true;
    if (i && mid[i - 1].y * mid[i].y < 0) return true;
  }
  return false;
}

var ZERO_TOL = 0.07;
var SEGMENT_SPAN = 0.2;

function qSign(sample) {
  if (sample.qy > ZERO_TOL) return 1;
  if (sample.qy < -ZERO_TOL) return -1;
  return 0;
}

function analyzeZeros(samples) {
  var sorted = (samples || []).slice().sort(function (a, b) { return a.qx - b.qx; });
  var events = [];
  var i = 0;
  while (i < sorted.length) {
    if (qSign(sorted[i]) !== 0) {
      if (i && qSign(sorted[i - 1]) !== 0 && qSign(sorted[i - 1]) !== qSign(sorted[i])) {
        events.push({ kind: "cross", qx: (sorted[i - 1].qx + sorted[i].qx) / 2 });
      }
      i += 1;
      continue;
    }
    var start = i;
    while (i < sorted.length && qSign(sorted[i]) === 0) i += 1;
    var cluster = sorted.slice(start, i);
    var span = cluster[cluster.length - 1].qx - cluster[0].qx;
    var left = start > 0 ? qSign(sorted[start - 1]) : 0;
    var right = i < sorted.length ? qSign(sorted[i]) : 0;
    var kind = "touch";
    if (span > SEGMENT_SPAN) kind = "segment";
    else if (left && right && left !== right) kind = "cross";
    events.push({ kind: kind, qx: cluster[Math.floor(cluster.length / 2)].qx });
  }
  var merged = [];
  events.forEach(function (ev) {
    var prev = merged[merged.length - 1];
    if (prev && prev.kind !== "segment" && ev.kind !== "segment" && Math.abs(ev.qx - prev.qx) < 0.1) {
      if (ev.kind === "cross" || prev.kind === "cross") prev.kind = "cross";
      return;
    }
    merged.push(ev);
  });
  return {
    events: merged,
    hasNeg: sorted.some(function (sample) { return sample.qy < -ZERO_TOL; }),
    hasPos: sorted.some(function (sample) { return sample.qy > ZERO_TOL; }),
  };
}

function signIssue(ex, samples) {
  var countSpec = constraints(ex, "ZERO_COUNT")[0];
  var negSpec = constraints(ex, "HAS_NEGATIVE")[0];
  if (!countSpec && !negSpec) return null;
  var report = analyzeZeros(samples);
  if (report.events.some(function (ev) { return ev.kind === "segment"; })) {
    return issue("zeroSegmentInsteadOfPoint", "קטע שלם על ציר ה־x אינו נקודת אפס אחת.");
  }
  var zeros = report.events.filter(function (ev) { return ev.kind === "cross" || ev.kind === "touch"; });
  var crosses = zeros.filter(function (ev) { return ev.kind === "cross"; });
  if (countSpec) {
    var want = Number(countSpec.count);
    if (zeros.length > want) {
      if (want === 0) return issue("unexpectedZero", "נוצרה נקודת אפס, אבל בסעיף הזה נדרש גרף ללא נקודות אפס.");
      if (want === 1) return issue("tooManyZeros", "הגרף שציירתם יוצר יותר מנקודת אפס אחת.");
      return issue("wrongZeroCount", "מספר נקודות האפס בשרטוט אינו מתאים לנדרש.");
    }
    if (zeros.length < want) return issue("missingZero", want === 1 ? "כעת צריך ליצור נקודת אפס אחת." : "כעת צריך ליצור " + num(want) + " נקודות אפס.");
  }
  if (negSpec && negSpec.value === false && (report.hasNeg || crosses.length)) {
    return issue("crossingWhenNoNegativeAllowed", "לאחר החצייה הגרף נמצא מתחת לציר ה־x ולכן מתקבלים ערכים שליליים, בניגוד לנתון.");
  }
  if (negSpec && negSpec.value === true && !report.hasNeg) {
    return issue("noNegativeValues", "יש נקודת אפס, אבל הגרף שציירתם אינו מקבל ערכים שליליים. בדקו כיצד הגרף יכול להגיע גם מתחת לציר ה־x.");
  }
  return null;
}

function signExample(scope) {
  var known = layoutAnchors(requiredPoints(scope))[0];
  var count = constraints(scope, "ZERO_COUNT")[0];
  if (!known || !count) return null;
  var qx = known.qx;
  var qy = Math.max(0.16, known.qy);
  var neg = constraints(scope, "HAS_NEGATIVE")[0];
  var stroke;
  if (Number(count.count) === 0) {
    stroke = [[qx - 0.62, qy + 0.1], [qx - 0.2, qy + 0.04], [qx, known.qy], [qx + 0.28, qy + 0.06], [qx + 0.55, qy + 0.14]];
  } else if (neg && neg.value) {
    stroke = [[qx - 0.78, -0.34], [qx - 0.42, -0.08], [qx - 0.22, 0.12], [qx, known.qy], [qx + 0.42, qy + 0.12]];
  } else {
    stroke = [[qx - 0.7, qy + 0.16], [qx - 0.42, 0.18], [qx - 0.22, 0.02], [qx - 0.08, 0.14], [qx, known.qy], [qx + 0.4, qy + 0.1]];
  }
  return { point: { qx: known.qx, qy: known.qy }, stroke: stroke };
}

function signGuide(scope, sketch) {
  var countItem = constraints(scope, "ZERO_COUNT")[0];
  if (!countItem) return null;
  var required = requiredPoints(scope);
  if (!required.length) return null;
  var placed = ((sketch && sketch.points) || []).filter(function (pt) {
    return isFinite(pt.qx) && isFinite(pt.qy);
  });
  var anchors = required.map(function (need) {
    var hit = placed.filter(function (pt) { return samePoint(pt, need); })[0];
    if (hit) return { x: Number(hit.x), y: Number(hit.y), qx: Number(hit.qx), qy: Number(hit.qy), role: "given" };
    var laid = layoutAnchors(required).filter(function (pt) { return samePoint(pt, need); })[0];
    return laid ? { x: laid.x, y: laid.y, qx: laid.qx, qy: laid.qy, role: "given" } : null;
  }).filter(Boolean).sort(function (a, b) { return a.qx - b.qx; });
  if (!anchors.length) return null;
  var count = Number(countItem.count);
  var neg = constraints(scope, "HAS_NEGATIVE")[0];
  var forbidNeg = !!(neg && neg.value === false);
  function sideOf(pt) {
    if (pt.qy > 0.08) return 1;
    if (pt.qy < -0.08) return -1;
    return pt.y < 0 ? -1 : 1;
  }
  var nodes = [];
  var crosses = 0;
  anchors.forEach(function (pt, index) {
    if (index) {
      var prev = anchors[index - 1];
      var mid = (prev.qx + pt.qx) / 2;
      if (sideOf(prev) !== sideOf(pt)) {
        nodes.push({ qx: mid, qy: 0 });
        crosses += 1;
      } else {
        nodes.push({ qx: mid, qy: (prev.qy + pt.qy) / 2 });
      }
    }
    nodes.push({ qx: pt.qx, qy: pt.qy });
  });
  var first = anchors[0];
  var last = anchors[anchors.length - 1];
  var need = count - crosses;
  if (need > 0 && forbidNeg) {
    var touch = first.qx - 0.16;
    nodes.unshift({ qx: touch + 0.08, qy: 0.18 });
    nodes.unshift({ qx: touch, qy: 0 });
    nodes.unshift({ qx: touch - 0.1, qy: 0.22 });
    nodes.unshift({ qx: first.qx - 0.5, qy: Math.max(0.28, first.qy) });
    need -= 1;
  }
  if (need > 0) {
    var leftSide = -sideOf(first);
    nodes.unshift({ qx: first.qx - 0.2, qy: 0 });
    nodes.unshift({ qx: first.qx - 0.46, qy: leftSide < 0 ? -0.3 : 0.3 });
    need -= 1;
  }
  if (need > 0) {
    var rightSide = -sideOf(last);
    nodes.push({ qx: last.qx + 0.18, qy: 0 });
    nodes.push({ qx: last.qx + 0.44, qy: rightSide < 0 ? -0.3 : 0.3 });
    need -= 1;
  }
  if (!nodes.length || nodes[0].qx >= first.qx - 0.05) {
    nodes.unshift({ qx: first.qx - 0.42, qy: sideOf(first) < 0 ? Math.min(-0.28, first.qy) : Math.max(0.22, first.qy) });
  }
  if (nodes[nodes.length - 1].qx <= last.qx + 0.05) {
    nodes.push({ qx: last.qx + 0.42, qy: sideOf(last) < 0 ? Math.min(-0.28, last.qy) : Math.max(0.22, last.qy) });
  }
  nodes.sort(function (a, b) { return a.qx - b.qx; });
  return {
    points: anchors,
    strokes: [densifyStroke(nodes)],
    line: null,
  };
}

function eventGuide(scope, sketch) {
  var required = requiredPoints(scope);
  if (!required.length) return null;
  var placed = ((sketch && sketch.points) || []).filter(function (pt) {
    return isFinite(pt.qx) && isFinite(pt.qy);
  });
  var laid = layoutAnchors(required);
  var anchors = required.map(function (need) {
    var hit = placed.filter(function (pt) { return samePoint(pt, need); })[0];
    if (hit) return { x: Number(hit.x), y: Number(hit.y), qx: Number(hit.qx), qy: Number(hit.qy), role: "given" };
    var fallback = laid.filter(function (pt) { return samePoint(pt, need); })[0];
    return fallback ? { x: fallback.x, y: fallback.y, qx: fallback.qx, qy: fallback.qy, role: "given" } : null;
  }).filter(Boolean);
  freeExtrema(scope).forEach(function (item) {
    var hit = placed.filter(function (pt) { return near(pt.x, item.x); })[0];
    if (!hit || anchors.some(function (pt) { return near(pt.x, hit.x); })) return;
    anchors.push({ x: Number(hit.x), y: Number(hit.y), qx: Number(hit.qx), qy: Number(hit.qy), role: hit.role || "extremum" });
  });
  anchors.sort(function (a, b) { return a.qx - b.qx || a.x - b.x; });
  if (!anchors.length) return null;
  var extrema = constraints(scope, "EXTREMUM");
  function extremumAt(pt) {
    return extrema.filter(function (item) {
      return near(item.x, pt.x) && (yKnown(item) ? near(item.y, pt.y) : true);
    })[0] || null;
  }
  function shift(qy, dir) {
    var next = qy + dir * 0.24;
    if (qy > 0.14 && next < 0.16) next = Math.max(0.18, qy - 0.2);
    if (qy < -0.14 && next > -0.16) next = Math.min(-0.18, qy + 0.2);
    if (Math.abs(next) > 0.9) next = qy - dir * 0.24;
    if (Math.abs(next) > 1e-6 && Math.abs(next) < 0.14) next = dir < 0 ? -0.22 : 0.22;
    return next;
  }
  var nodes = anchors.map(function (pt) { return { qx: pt.qx, qy: pt.qy }; });
  var first = anchors[0];
  var last = anchors[anchors.length - 1];
  var firstExt = extremumAt(first);
  var lastExt = extremumAt(last);
  var left = null;
  var right = null;
  function extremumTail(pt, dir, side) {
    var sign = side === "left" ? -1 : 1;
    var close = shift(pt.qy, dir);
    var mid = close + dir * 0.12;
    if (Math.abs(mid) < 0.16) mid = dir < 0 ? -0.28 : 0.28;
    var far = mid + dir * 0.16;
    if (Math.abs(far) < 0.16) far = mid;
    if (Math.abs(far) > 0.9) far = mid;
    return [
      { qx: pt.qx + sign * 0.52, qy: far },
      { qx: pt.qx + sign * 0.24, qy: mid },
      { qx: pt.qx + sign * 0.1, qy: close },
    ];
  }
  var bounded = domainOf(scope);
  var stayInside = bounded && !bounded.all;
  if (!stayInside && firstExt) {
    left = extremumTail(first, firstExt.kind === "max" ? -1 : 1, "left");
  } else if (!stayInside && nodes.length >= 2 && nodes[1].qx - nodes[0].qx > 0.02) {
    var slopeL = (nodes[1].qy - nodes[0].qy) / (nodes[1].qx - nodes[0].qx);
    var qyL = nodes[0].qy - slopeL * 0.45;
    if (Math.abs(qyL) > 0.9) qyL = nodes[0].qy + (slopeL >= 0 ? -0.24 : 0.24);
    if (Math.abs(qyL) > 1e-6 && Math.abs(qyL) < 0.14) qyL = qyL < 0 ? -0.2 : 0.2;
    left = { qx: nodes[0].qx - 0.45, qy: qyL };
  }
  if (!stayInside && lastExt) {
    right = extremumTail(last, lastExt.kind === "max" ? -1 : 1, "right");
  } else if (!stayInside && nodes.length >= 2) {
    var end = nodes.length - 1;
    var spanR = nodes[end].qx - nodes[end - 1].qx;
    if (spanR > 0.02) {
      var slopeR = (nodes[end].qy - nodes[end - 1].qy) / spanR;
      var qyR = nodes[end].qy + slopeR * 0.45;
      if (Math.abs(qyR) > 0.9) qyR = nodes[end].qy + (slopeR >= 0 ? 0.24 : -0.24);
      if (Math.abs(qyR) > 1e-6 && Math.abs(qyR) < 0.14) qyR = qyR < 0 ? -0.2 : 0.2;
      right = { qx: nodes[end].qx + 0.45, qy: qyR };
    }
  }
  if (left) nodes = (Array.isArray(left) ? left : [left]).concat(nodes);
  if (right) nodes = nodes.concat(Array.isArray(right) ? right : [right]);
  nodes.sort(function (a, b) { return a.qx - b.qx; });
  return { points: anchors, strokes: [densifyStroke(nodes)], line: null };
}

function signWhy(scope) {
  var count = constraints(scope, "ZERO_COUNT")[0];
  var neg = constraints(scope, "HAS_NEGATIVE")[0];
  var knowns = requiredPoints(scope);
  var through = knowns.length
    ? "הגרף עובר דרך " + knowns.map(function (pt) { return pointText(pt.x, pt.y); }).join(" ודרך ")
    : "הגרף עומד בנתונים";
  if (count && Number(count.count) === 0) return through + " ואינו פוגש את ציר ה־x, ולכן אין נקודות אפס.";
  if (count && Number(count.count) === 1 && neg && neg.value) return through + ", פוגש את ציר ה־x פעם אחת, ויש לו גם ערכים שליליים.";
  if (count && Number(count.count) === 1 && neg && neg.value === false) return through + ", נוגע בציר ה־x פעם אחת, ואינו עובר מתחתיו.";
  if (count && Number(count.count) === 1) return through + ", ויש לו נקודת אפס אחת.";
  if (count && Number(count.count) > 1) return through + ", ויש לו " + num(count.count) + " נקודות אפס.";
  return through + ".";
}

function signHints(scope) {
  var count = constraints(scope, "ZERO_COUNT")[0];
  if (!count) return null;
  var known = constraints(scope, "KNOWN_POINT")[0];
  var hints = [];
  if (known) hints.push("מהנתון " + fText(known.x, known.y) + " אתם יודעים שהגרף עובר בנקודה " + pointText(known.x, known.y) + ".");
  var neg = constraints(scope, "HAS_NEGATIVE")[0];
  if (Number(count.count) === 0) {
    hints.push("נקודת אפס היא מקום שבו הגרף פוגש את ציר ה־x.");
    hints.push("כדי שלא יהיו נקודות אפס, הגרף אינו יכול לפגוש את ציר ה־x.");
  } else if (neg && neg.value) {
    hints.push("ערכים שליליים מתקבלים כאשר הגרף נמצא מתחת לציר ה־x.");
    hints.push("נסו ליצור מעבר אחד בלבד בין הצד החיובי לצד השלילי.");
  } else {
    hints.push("צריך להגיע לציר ה־x פעם אחת, אבל אסור לגרף לעבור מתחתיו.");
    hints.push("אפשר לחשוב על נקודת מינימום שנמצאת בדיוק על ציר ה־x.");
  }
  return hints;
}

function zeroForceMessage(ex) {
  var gaps = signGaps(ex);
  if (!gaps.length) return "מהנתונים לא מוכרח חיתוך נוסף של ציר ה־x.";
  return gaps.map(function (gap) {
    return "בין x=" + num(gap.from) + " ל־x=" + num(gap.to) + " ערך הפונקציה משנה סימן, ולכן גרף רציף חייב לחצות את ציר ה־x לפחות פעם אחת שם.";
  }).join(" ");
}

function zeroIssue(ex, logical) {
  var gaps = signGaps(ex);
  var i;
  for (i = 0; i < gaps.length; i++) {
    if (!pathCrosses(logical, gaps[i].from, gaps[i].to)) {
      return issue("missingRequiredZero", zeroForceMessage(ex));
    }
  }
  return null;
}

function bandIssue(ex, logical) {
  var found = null;
  (ex.constraints || []).forEach(function (item) {
    if (found) return;
    if (item.type !== "MUST_BE_ABOVE_X_AXIS" && item.type !== "MUST_BE_BELOW_X_AXIS") return;
    var above = item.type === "MUST_BE_ABOVE_X_AXIS";
    var inside = logical.filter(function (sample) {
      return sample.x >= Number(item.fromX) && sample.x <= Number(item.toX);
    });
    var bad = inside.some(function (sample) { return above ? sample.y < -0.45 : sample.y > 0.45; });
    if (bad) {
      found = issue(
        above ? "missingRequiredZero" : "missingRequiredZero",
        above
          ? "בתחום " + intervalText(item) + " הגרף צריך להישאר מעל ציר ה־x."
          : "בתחום " + intervalText(item) + " הגרף צריך להישאר מתחת לציר ה־x."
      );
    }
  });
  return found;
}

function hasRegionSketch(ex) {
  return constraints(ex, "POSITIVE_INTERVAL").length || constraints(ex, "NEGATIVE_INTERVAL").length || constraints(ex, "ZERO_AT_X").length || constraints(ex, "VALUE_RELATION").length;
}

function boundValue(v) {
  if (v === "-inf" || v === "-∞") return -Infinity;
  if (v === "inf" || v === "∞") return Infinity;
  return Number(v);
}

function containsX(item, x) {
  var from = boundValue(item.from);
  var to = boundValue(item.to);
  var left = from === -Infinity ? true : (item.includeFrom ? x >= from - 1e-9 : x > from + 1e-9);
  var right = to === Infinity ? true : (item.includeTo ? x <= to + 1e-9 : x < to - 1e-9);
  return left && right;
}

function infoAt(ex, x) {
  if (constraints(ex, "ZERO_AT_X").some(function (item) { return near(item.x, x); })) return { kind: "zero", x: x };
  if (constraints(ex, "SIGN_EXCEPTION").some(function (item) { return near(item.x, x); })) return { kind: "unknown", x: x };
  var known = requiredPoints(ex).filter(function (pt) { return near(pt.x, x); })[0];
  if (known && !near(known.y, 0)) return { kind: "value", x: x, y: known.y };
  var sign = signProbe(ex, x);
  if (sign > 0) return { kind: "positive", x: x };
  if (sign < 0) return { kind: "negative", x: x };
  return { kind: "unknown", x: x };
}

function signProbe(ex, x) {
  var pos = constraints(ex, "POSITIVE_INTERVAL").some(function (item) { return containsX(item, x); });
  var neg = constraints(ex, "NEGATIVE_INTERVAL").some(function (item) { return containsX(item, x); });
  if (pos && !neg) return 1;
  if (neg && !pos) return -1;
  return 0;
}

function qyAt(sorted, qx) {
  if (!sorted.length) return NaN;
  if (qx <= sorted[0].qx) return sorted[0].qy;
  var i;
  for (i = 0; i < sorted.length - 1; i++) {
    if (qx <= sorted[i + 1].qx + 1e-9) {
      var span = sorted[i + 1].qx - sorted[i].qx;
      if (Math.abs(span) < 1e-6) return sorted[i].qy;
      var t = (qx - sorted[i].qx) / span;
      return sorted[i].qy + t * (sorted[i + 1].qy - sorted[i].qy);
    }
  }
  return sorted[sorted.length - 1].qy;
}

function qxForX(x, anchors) {
  var pts = (anchors || []).filter(function (pt) { return isFinite(pt.x) && isFinite(pt.qx); }).slice().sort(function (a, b) { return a.x - b.x; });
  if (!pts.length) return NaN;
  if (x <= pts[0].x) {
    if (pts.length === 1) return pts[0].qx;
    var span0 = pts[1].x - pts[0].x;
    if (Math.abs(span0) < 1e-9) return pts[0].qx;
    return pts[0].qx + (x - pts[0].x) / span0 * (pts[1].qx - pts[0].qx);
  }
  var i;
  for (i = 0; i < pts.length - 1; i++) {
    if (x <= pts[i + 1].x + 1e-9) {
      var span = pts[i + 1].x - pts[i].x;
      if (Math.abs(span) < 1e-9) return pts[i].qx;
      return pts[i].qx + (x - pts[i].x) / span * (pts[i + 1].qx - pts[i].qx);
    }
  }
  var last = pts.length - 1;
  var prev = pts[last - 1];
  var endSpan = pts[last].x - prev.x;
  if (Math.abs(endSpan) < 1e-9) return pts[last].qx;
  return pts[last].qx + (x - pts[last].x) / endSpan * (pts[last].qx - prev.qx);
}

function relationAnchors(ex, sketch, samples) {
  var sorted = samples.slice().sort(function (a, b) { return a.qx - b.qx; });
  var anchors = ((sketch && sketch.points) || []).filter(function (pt) { return isFinite(pt.x) && isFinite(pt.qx); }).map(function (pt) {
    return { x: Number(pt.x), qx: Number(pt.qx) };
  });
  var domain = domainOf(ex);
  if (!domain.all && sorted.length) {
    if (!anchors.some(function (pt) { return near(pt.x, domain.min); })) anchors.push({ x: domain.min, qx: sorted[0].qx });
    if (!anchors.some(function (pt) { return near(pt.x, domain.max); })) anchors.push({ x: domain.max, qx: sorted[sorted.length - 1].qx });
  }
  return { sorted: sorted, anchors: anchors };
}

function regionIssue(ex, sketch) {
  if (!hasRegionSketch(ex)) return null;
  var samples = samplesOf(sketch);
  if (samples.length < 4) return null;
  var zeros = constraints(ex, "ZERO_AT_X");
  var placed = ((sketch && sketch.points) || []).filter(function (pt) {
    return zeros.some(function (item) { return near(pt.x, item.x) && near(pt.y, 0) && isFinite(pt.qx); });
  }).slice().sort(function (a, b) { return a.x - b.x; });
  if (!zeros.length || placed.length < zeros.length) return null;
  var report = analyzeZeros(samples);
  if (report.events.some(function (ev) { return ev.kind === "segment"; })) {
    return issue("zeroSegmentInsteadOfPoint", "קטע שלם על ציר ה־x אינו נקודת אפס.");
  }
  var i;
  for (i = 0; i < placed.length; i++) {
    var spot = placed[i];
    var hit = report.events.some(function (ev) { return Math.abs(ev.qx - spot.qx) < 0.14; });
    if (!hit) {
      return issue("missingBoundaryZero", "נקודת האפס בגבול שבין התחומים חסרה. הגרף צריך לפגוש את ציר ה־x ב־x=" + num(spot.x) + ".");
    }
  }
  var exceptions = constraints(ex, "SIGN_EXCEPTION");
  var extras = report.events.filter(function (ev) {
    return ev.kind !== "segment" && !placed.some(function (pt) { return Math.abs(ev.qx - pt.qx) < 0.14; });
  });
  if (extras.length > exceptions.length) {
    var extra = extras[exceptions.length] || extras[0];
    var extraSign = signProbe(ex, extra.qx < placed[0].qx ? placed[0].x - 0.5 : placed[placed.length - 1].x + 0.5);
    if (extra.qx > placed[0].qx && extra.qx < placed[placed.length - 1].qx) extraSign = signProbe(ex, (placed[0].x + placed[placed.length - 1].x) / 2);
    return issue(
      extraSign > 0 ? "zeroInsidePositive" : "zeroInsideNegative",
      extraSign > 0
        ? "בתחום שבו f(x)>0 הגרף אינו יכול לפגוש את ציר ה־x."
        : "בתחום שבו f(x)<0 הגרף אינו יכול לפגוש את ציר ה־x."
    );
  }
  var allowedExtra = extras.slice(0, exceptions.length);
  var wideException = allowedExtra.some(function (ev) {
    var nearNeg = samples.filter(function (sample) {
      return Math.abs(sample.qx - ev.qx) <= 0.16 && sample.qy < -ZERO_TOL;
    });
    if (nearNeg.length <= 1) return false;
    var span = Math.max.apply(null, nearNeg.map(function (sample) { return sample.qx; })) - Math.min.apply(null, nearNeg.map(function (sample) { return sample.qx; }));
    return nearNeg.length > 2 || span > 0.1;
  });
  if (wideException) {
    return issue("signExceptionNotInterval", "החריג הוא נקודה אחת, לא תחום שלם סביבה. מחוץ לנקודה הזאת הסימן נשאר כפי שנתון.");
  }
  var bad = null;
  samples.forEach(function (sample) {
    if (bad) return;
    if (placed.some(function (pt) { return Math.abs(sample.qx - pt.qx) < 0.07; })) return;
    if (allowedExtra.some(function (ev) { return Math.abs(sample.qx - ev.qx) <= 0.1; })) return;
    var probe = null;
    if (sample.qx < placed[0].qx) probe = placed[0].x - 0.5;
    else if (sample.qx > placed[placed.length - 1].qx) probe = placed[placed.length - 1].x + 0.5;
    else {
      var j;
      for (j = 0; j < placed.length - 1; j++) {
        if (sample.qx > placed[j].qx && sample.qx < placed[j + 1].qx) probe = (placed[j].x + placed[j + 1].x) / 2;
      }
    }
    var want = signProbe(ex, probe);
    if (!want) return;
    if (want > 0 && sample.qy < -ZERO_TOL) bad = issue("belowInPositiveInterval", "בתחום החיובי הגרף צריך להיות מעל ציר ה־x.");
    if (want < 0 && sample.qy > ZERO_TOL) bad = issue("aboveInNegativeInterval", "בתחום השלילי הגרף צריך להיות מתחת לציר ה־x.");
  });
  if (bad) return bad;
  var sides = [
    { qx: placed[0].qx - 0.12, x: placed[0].x - 0.5 },
    { qx: placed[placed.length - 1].qx + 0.12, x: placed[placed.length - 1].x + 0.5 },
  ];
  var missingSide = sides.some(function (side) {
    if (!signProbe(ex, side.x)) return false;
    return !samples.some(function (sample) { return Math.abs(sample.qx - side.qx) < 0.2 || (side.qx < placed[0].qx ? sample.qx < placed[0].qx - 0.05 : sample.qx > placed[placed.length - 1].qx + 0.05); });
  });
  if (missingSide) return issue("outsideDomain", "הגרף צריך לכסות את כל תחום ההגדרה, משני צדי נקודות האפס.");
  return null;
}

function relationIssue(ex, sketch) {
  var rels = constraints(ex, "VALUE_RELATION");
  if (!rels.length) return null;
  var samples = samplesOf(sketch);
  if (samples.length < 4) return null;
  var map = relationAnchors(ex, sketch, samples);
  var found = null;
  rels.forEach(function (rel) {
    if (found) return;
    var q1 = qxForX(Number(rel.x1), map.anchors);
    var q2 = qxForX(Number(rel.x2), map.anchors);
    if (!isFinite(q1) || !isFinite(q2)) return;
    var y1 = qyAt(map.sorted, q1);
    var y2 = qyAt(map.sorted, q2);
    var higher = rel.op === ">" ? y1 > y2 + 0.04 : rel.op === "<" ? y1 < y2 - 0.04 : false;
    if (!higher) {
      found = issue(
        "wrongValueRelation",
        "תחומי החיוביות והשליליות מתאימים. כעת בדקו את הגובה של הגרף ב־x=" + num(rel.x1) + " לעומת x=" + num(rel.x2) + "."
      );
    }
  });
  return found;
}

function densifyStroke(nodes) {
  var samples = [];
  var i;
  var k;
  for (i = 0; i < nodes.length - 1; i++) {
    var a = nodes[i];
    var b = nodes[i + 1];
    var steps = 8;
    for (k = 0; k <= steps; k++) {
      if (i && k === 0) continue;
      var t = k / steps;
      var qy = a.qy + (b.qy - a.qy) * t;
      if (Math.abs(qy) > 1e-6 && Math.abs(qy) < 0.12) continue;
      samples.push({
        qx: a.qx + (b.qx - a.qx) * t,
        qy: qy,
      });
    }
  }
  return samples;
}

function regionGuide(scope) {
  var zeros = constraints(scope, "ZERO_AT_X").map(function (item) {
    return { x: Number(item.x), y: 0 };
  }).sort(function (a, b) { return a.x - b.x; });
  if (!zeros.length) return null;
  var placed = layoutAnchors(zeros);
  var domain = domainOf(scope);
  var leftX = domain.all ? zeros[0].x - 2 : domain.min;
  var rightX = domain.all ? zeros[zeros.length - 1].x + 2 : domain.max;
  var leftQx = placed[0].qx - 0.42;
  var rightQx = placed[placed.length - 1].qx + 0.42;
  var virtual = placed.map(function (pt) { return { x: pt.x, qx: pt.qx }; });
  if (!domain.all) {
    virtual.push({ x: domain.min, qx: leftQx });
    virtual.push({ x: domain.max, qx: rightQx });
  }
  function qxOf(x) {
    if (!domain.all) return qxForX(x, virtual);
    if (x <= placed[0].x) return placed[0].qx - Math.min(0.42, 0.16 * (placed[0].x - x));
    var last = placed[placed.length - 1];
    if (x >= last.x) return last.qx + Math.min(0.42, 0.16 * (x - last.x));
    return qxForX(x, placed);
  }
  var nodes = [{ x: leftX }];
  var i;
  for (i = 0; i < zeros.length; i++) {
    if (i) nodes.push({ x: (zeros[i - 1].x + zeros[i].x) / 2 });
    nodes.push({ x: zeros[i].x, zero: true });
  }
  nodes.push({ x: rightX });
  var rel = constraints(scope, "VALUE_RELATION")[0];
  if (rel) {
    var s1 = signProbe(scope, Number(rel.x1));
    var s2 = signProbe(scope, Number(rel.x2));
    var y1;
    var y2;
    if (s1 > 0 && s2 > 0) {
      y1 = rel.op === ">" ? 0.42 : 0.16;
      y2 = rel.op === ">" ? 0.16 : 0.42;
    } else if (s1 < 0 && s2 < 0) {
      y1 = rel.op === ">" ? -0.16 : -0.42;
      y2 = rel.op === ">" ? -0.42 : -0.16;
    } else {
      y1 = s1 < 0 ? -0.28 : 0.28;
      y2 = s2 < 0 ? -0.28 : 0.28;
    }
    [ { x: Number(rel.x1), qy: y1 }, { x: Number(rel.x2), qy: y2 } ].forEach(function (spot) {
      var hit = nodes.filter(function (node) { return near(node.x, spot.x); })[0];
      if (hit) {
        if (!hit.zero) hit.qy = spot.qy;
        return;
      }
      nodes.push({ x: spot.x, qy: spot.qy });
    });
  }
  nodes.sort(function (a, b) { return a.x - b.x; });
  var shaped = nodes.map(function (node) {
    var qy = node.qy;
    if (qy == null) {
      if (node.zero) qy = 0;
      else {
        var sign = signProbe(scope, node.x);
        qy = sign < 0 ? -0.26 : 0.26;
      }
    }
    return { qx: qxOf(node.x), qy: qy };
  });
  return {
    points: placed,
    strokes: [densifyStroke(shaped)],
    line: null,
  };
}

function regionWhy(scope) {
  var zeros = constraints(scope, "ZERO_AT_X").map(function (item) { return "x=" + num(item.x); });
  var rel = constraints(scope, "VALUE_RELATION")[0];
  var text = "הגרף מוגדר בתחום הנתון";
  if (zeros.length) text += ", ופוגש את ציר ה־x ב־" + zeros.join(" וב־");
  var pos = constraints(scope, "POSITIVE_INTERVAL")[0];
  var neg = constraints(scope, "NEGATIVE_INTERVAL")[0];
  if (neg) text += ". בתחום השלילי הוא מתחת לציר";
  if (pos) text += ", ובתחום החיובי מעליו";
  if (rel) text += ". בנוסף " + fPair(rel);
  var exception = constraints(scope, "SIGN_EXCEPTION")[0];
  if (exception) text += ". ב־x=" + num(exception.x) + " הסימן אינו נקבע: אפשר ערך חיובי, אפס, או נקודה שלילית בודדת";
  return text + ".";
}

function fPair(rel) {
  return "f(" + num(rel.x1) + ")" + rel.op + "f(" + num(rel.x2) + ")";
}

function sketchShowsPoint(sketch, x, y) {
  var points = (sketch && sketch.points) || [];
  if (points.some(function (pt) { return near(pt.x, x) && near(pt.y, y); })) return true;
  return logicalSamples(sketch).some(function (sample) {
    return Math.abs(sample.x - x) < 0.35 && Math.abs(sample.y - y) < 0.55;
  });
}

function contradiction(ex, progress, sketch) {
  var answers = (progress && progress.answers) || {};
  var ids = Object.keys(answers);
  var i;
  for (i = 0; i < ids.length; i++) {
    var answer = answers[ids[i]] || {};
    var claim = answer.claim || {};
    if (answer.yes === false && claim.type === "point" && sketchShowsPoint(sketch, claim.x, claim.y)) {
      return issue(
        "contradictsPreviousAnswer",
        "השרטוט עובר דרך " + pointText(claim.x, claim.y) + ", וזו סתירה לתשובה שלא ייתכן " + fText(claim.x, claim.y) + "."
      );
    }
  }
  return null;
}

function coarseSamples(samples) {
  var sorted = (samples || []).slice().sort(function (a, b) { return a.qx - b.qx || a.qy - b.qy; });
  var coarse = [];
  sorted.forEach(function (sample) {
    var prev = coarse[coarse.length - 1];
    if (!prev || sample.qx - prev.qx >= 0.03) coarse.push(sample);
  });
  if (sorted.length && (!coarse.length || coarse[coarse.length - 1] !== sorted[sorted.length - 1])) {
    var last = sorted[sorted.length - 1];
    if (!coarse.length || last.qx - coarse[coarse.length - 1].qx > 0.012) coarse.push(last);
  }
  return coarse;
}

function eventTurns(samples) {
  var sorted = coarseSamples(samples);
  var turns = [];
  var prev = 0;
  var i;
  for (i = 1; i < sorted.length; i++) {
    var dx = sorted[i].qx - sorted[i - 1].qx;
    if (dx < 0.012) continue;
    var slope = (sorted[i].qy - sorted[i - 1].qy) / dx;
    var sign = slope > 0.045 ? 1 : slope < -0.045 ? -1 : 0;
    if (!sign) continue;
    if (prev && sign !== prev) {
      turns.push({
        kind: prev > 0 && sign < 0 ? "max" : "min",
        qx: sorted[i - 1].qx,
        qy: sorted[i - 1].qy,
      });
    }
    prev = sign;
  }
  var merged = [];
  turns.forEach(function (turn) {
    var last = merged[merged.length - 1];
    if (last && last.kind === turn.kind && Math.abs(last.qx - turn.qx) < 0.1) return;
    merged.push(turn);
  });
  return merged;
}

function monotoneScore(samples, from, to, direction) {
  var list = (samples || []).filter(function (sample) {
    if (from != null && !(sample.x > from + 0.12)) return false;
    if (to != null && !(sample.x < to - 0.12)) return false;
    return true;
  }).sort(function (a, b) { return a.qx - b.qx; });
  var good = 0;
  var bad = 0;
  var i;
  for (i = 1; i < list.length; i++) {
    var dx = list[i].qx - list[i - 1].qx;
    if (dx < 0.01) continue;
    var slope = (list[i].qy - list[i - 1].qy) / dx;
    if (Math.abs(slope) < 0.04) continue;
    var rising = slope > 0;
    if ((direction === "inc" && rising) || (direction === "dec" && !rising)) good += 1;
    else bad += 1;
  }
  return { good: good, bad: bad };
}

function localSlope(samples, qx, side) {
  var sorted = (samples || []).slice().sort(function (a, b) { return a.qx - b.qx; });
  var i;
  if (side === "left") {
    var end = null;
    for (i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].qx > qx - 0.012) continue;
      if (sorted[i].qx < qx - 0.3) break;
      if (!end) {
        end = sorted[i];
        continue;
      }
      var leftDx = end.qx - sorted[i].qx;
      if (leftDx < 0.02) continue;
      return (end.qy - sorted[i].qy) / leftDx;
    }
    return null;
  }
  var start = null;
  for (i = 0; i < sorted.length; i++) {
    if (sorted[i].qx < qx + 0.012) continue;
    if (sorted[i].qx > qx + 0.3) break;
    if (!start) {
      start = sorted[i];
      continue;
    }
    var rightDx = sorted[i].qx - start.qx;
    if (rightDx < 0.02) continue;
    return (sorted[i].qy - start.qy) / rightDx;
  }
  return null;
}

function logicalXAt(sketch, qx) {
  return axisMap((sketch && sketch.points) || [], qx, "x", "qx");
}

function turnNearEnd(ex, sketch, turn) {
  return nearDomainEnd(ex, logicalXAt(sketch, turn.qx));
}

function extremumSpot(ex, sketch, item, turns) {
  var points = (sketch && sketch.points) || [];
  var placed = points.filter(function (pt) {
    return near(pt.x, item.x) && (yKnown(item) ? near(pt.y, item.y) : true);
  })[0];
  if (placed) return { qx: Number(placed.qx), y: Number(placed.y), placed: true };
  if (yKnown(item)) return null;
  var turn = (turns || []).filter(function (candidate) {
    return Math.abs(logicalXAt(sketch, candidate.qx) - Number(item.x)) < 0.4;
  })[0];
  if (!turn) return null;
  return { qx: turn.qx, y: axisMap(points, turn.qy, "y", "qy"), placed: false, kind: turn.kind };
}

function positiveIssue(ex, logical) {
  if (!positiveOnDomain(ex)) return null;
  var domain = domainOf(ex);
  var dipped = (logical || []).some(function (sample) {
    if (!domain.all && (sample.x < domain.min - 0.25 || sample.x > domain.max + 0.25)) return false;
    return sample.y < 0.02;
  });
  if (!dipped) return null;
  return issue("belowInPositiveInterval", "הפונקציה חיובית בכל תחום ההגדרה, ולכן הגרף נשאר מעל ציר ה־x.");
}

function eventIssue(ex, sketch) {
  var extrema = constraints(ex, "EXTREMUM");
  var monos = constraints(ex, "MONOTONE");
  if (!extrema.length && !monos.length) return null;
  var logical = logicalSamples(sketch);
  if (logical.length < 6) return null;
  var points = (sketch && sketch.points) || [];
  var turns = eventTurns(logical);
  var i;
  for (i = 0; i < extrema.length; i++) {
    var item = extrema[i];
    var placed = extremumSpot(ex, sketch, item, turns);
    if (!placed) {
      if (!yKnown(item)) {
        var endTurn = turns.some(function (turn) { return turnNearEnd(ex, sketch, turn); });
        if (endTurn) {
          return issue("endpointTreatedAsInteriorExtremum", "הקצוות של תחום ההגדרה אינם נקודת הקיצון. נקודת הקיצון היא ב־x=" + num(item.x) + ".");
        }
        return issue("missingGivenPoint", "מקמו נקודת " + (item.kind === "max" ? "מקסימום" : "מינימום") + " ב־x=" + num(item.x) + ". שיעור ה־y אינו נתון.");
      }
      continue;
    }
    if (!yKnown(item)) {
      var height = freeYIssue(ex, item, placed.y);
      if (height) return height;
    }
    var want = item.kind === "max" ? "max" : "min";
    var left = localSlope(logical, Number(placed.qx), "left");
    var right = localSlope(logical, Number(placed.qx), "right");
    var edgeDomain = domainOf(ex);
    var atLeftEnd = edgeDomain && !edgeDomain.all && Math.abs(Number(item.x) - edgeDomain.min) < 0.08;
    var atRightEnd = edgeDomain && !edgeDomain.all && Math.abs(Number(item.x) - edgeDomain.max) < 0.08;
    if (left == null && atLeftEnd) left = want === "max" ? 1 : -1;
    if (right == null && atRightEnd) right = want === "max" ? -1 : 1;
    if (left == null || right == null) {
      var missingSide = left == null ? "לפני" : "לאחר";
      var way = want === "max"
        ? (left == null ? "עולה" : "יורדת")
        : (left == null ? "יורדת" : "עולה");
      return issue("graphViolatesGivenInterval", "המשיכו את הגרף " + missingSide + " x=" + num(item.x) + ". שם הפונקציה " + way + ".");
    }
    var risesIn = left > 0;
    var risesOut = right > 0;
    var okKind = want === "max" ? risesIn && !risesOut : !risesIn && risesOut;
    if (!okKind) {
      var after = want === "max" ? "לרדת" : "לעלות";
      var where = yKnown(item) ? "הנקודה " + pointText(item.x, item.y) : "ב־x=" + num(item.x);
      return issue(
        "wrongExtremumType",
        where + " אמורה להיות נקודת " + (want === "max" ? "מקסימום" : "מינימום") + ". בדקו מה צריך לקרות לגרף לאחר x=" + num(item.x) + ": הגרף צריך " + after + "."
      );
    }
  }
  var claimed = [];
  extrema.forEach(function (item) {
    var spot = extremumSpot(ex, sketch, item, turns);
    if (!spot) return;
    var best = -1;
    var bestDist = 0.2;
    turns.forEach(function (turn, index) {
      if (claimed.indexOf(index) >= 0) return;
      var dist = Math.abs(turn.qx - Number(spot.qx));
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    if (best >= 0) claimed.push(best);
  });
  var extras = turns.filter(function (turn, index) {
    if (claimed.indexOf(index) >= 0) return false;
    if (turnNearEnd(ex, sketch, turn)) return false;
    return true;
  });
  if (extras.length) {
    var onlyOne = extrema.length === 1 && extrema[0].only;
    return issue(
      "extraExtremum",
      onlyOne
        ? "נתון שלפונקציה יש נקודת קיצון אחת בלבד."
        : "הגרף ששרטטתם יוצר שינוי כיוון נוסף שלא מופיע בנתונים."
    );
  }
  for (i = 0; i < monos.length; i++) {
    var band = monos[i];
    var from = band.from === "-inf" || band.from == null ? null : Number(band.from);
    var to = band.to === "inf" || band.to == null ? null : Number(band.to);
    var score = monotoneScore(logical, from, to, band.direction);
    if (score.good + score.bad < 3) {
      var where = to == null ? "אחרי x=" + num(from) : from == null ? "לפני x=" + num(to) : "בין x=" + num(from) + " ל־x=" + num(to);
      var way = band.direction === "inc" ? "עולה" : "יורדת";
      return issue("graphViolatesGivenInterval", "המשיכו את הגרף " + where + ". שם הפונקציה " + way + ".");
    }
    if (score.good < score.bad) {
      return issue("wrongMonotonicity", "בתחום הזה כיוון הגרף אינו מתאים לנתונים.");
    }
  }
  var zeros = requiredPoints(ex).filter(function (pt) { return near(pt.y, 0); });
  if (zeros.length) {
    var seen = analyzeZeros(samplesOf(sketch));
    var stray = (seen.events || []).filter(function (ev) {
      return !zeros.some(function (pt) {
        var placed = points.filter(function (mark) { return samePoint(mark, pt); })[0];
        return placed && Math.abs(ev.qx - Number(placed.qx)) < 0.18;
      });
    });
    if (stray.length) {
      return issue("extraZero", "השרטוט חותך את ציר ה־x במקום שלא מופיע בנתונים.");
    }
  }
  var zeroMarks = points.filter(function (pt) { return near(pt.y, 0); }).slice().sort(function (a, b) { return a.x - b.x; });
  for (i = 1; i < zeroMarks.length; i++) {
    if (zeroMarks[i].qx + 0.02 < zeroMarks[i - 1].qx) {
      return issue("wrongZeroOrder", "נקודות החיתוך עם ציר ה־x אינן בסדר הנכון לאורך הציר.");
    }
  }
  return null;
}

function eventHints(ex, sketch) {
  var required = requiredPoints(ex);
  var points = (sketch && sketch.points) || [];
  var missing = missingPoint(required, points);
  var free = freeExtrema(ex)[0];
  if (!points.length) {
    var domain = domainOf(ex);
    if (domain && !domain.all) return ["תחום ההגדרה הוא " + domainText(domain) + ". כדאי להתחיל בסימון הנקודות הידועות."];
    return ["כדאי להתחיל בסימון הנקודות הידועות."];
  }
  if (missing) return ["עדיין חסרה נקודה ידועה. סמנו את " + pointText(missing.x, missing.y) + "."];
  if (free && !points.some(function (pt) { return near(pt.x, free.x); })) {
    if (free.kind === "min" && positiveOnDomain(ex)) {
      return ["כעת מקמו את נקודת המינימום ב־x=" + num(free.x) + ". שיעור ה־y שלה אינו נתון, אבל מה ידוע עליו מכך שהפונקציה חיובית?"];
    }
    var kindWord = free.kind === "max" ? "מקסימום" : "מינימום";
    return ["נקודת הקיצון היחידה היא " + kindWord + " ב־x=" + num(free.x) + ". כיצד הגרף צריך להתנהג לפני ואחרי x=" + num(free.x) + "?"];
  }
  if (!samplesOf(sketch).length) {
    if (free && free.kind === "min") return ["חברו את הנקודות כך שהפונקציה תרד עד x=" + num(free.x) + " ותעלה לאחר מכן. אין להמשיך מחוץ לתחום ההגדרה."];
    if (free && free.kind === "max") return ["חברו את הנקודות כך שהפונקציה תעלה עד x=" + num(free.x) + " ותרד לאחר מכן. אין חובה שהגרף יהיה סימטרי."];
    return ["עכשיו חברו ביניהן כך שתישמר התנהגות הפונקציה הנתונה."];
  }
  var problem = validateSketch(ex, sketch, { answers: {} });
  if (!problem) return ["הסקיצה עומדת בנתונים. זו דוגמה אחת, לא הצורה היחידה."];
  if (problem.id === "wrongExtremumType") {
    return ["הנקודות שסימנתם נכונות. בדקו את כיוון הגרף לפני ואחרי נקודת הקיצון.", problem.message];
  }
  if (problem.id === "extraExtremum") return [problem.message];
  if (problem.id === "missingZero" || problem.id === "extraZero") {
    return ["השרטוט כמעט מתאים. בדקו האם הכנסתם את כל נקודות החיתוך עם ציר ה־x."];
  }
  return [problem.message];
}

function validateSketch(ex, sketch, progress) {
  var points = (sketch && sketch.points) || [];
  var required = requiredPoints(ex);
  var order = orderIssue(points);
  if (order) return order;
  var side = null;
  points.forEach(function (pt) {
    if (!side) side = sideIssue(pt.x, pt.y, pt.qx, pt.qy);
  });
  if (side) return side;
  var logical = logicalSamples(sketch);
  var domain = domainOf(ex);
  if (logical.length) {
    var vertical = verticalIssue(logical, domain);
    if (vertical && constraints(ex, "EXTREMUM").length) {
      return issue("notAFunction", "השרטוט אינו יכול להיות גרף של פונקציה: עבור אותו ערך x מתקבלים יותר מערך y אחד.");
    }
    if (vertical) return vertical;
  }
  var missing = missingPoint(required, points);
  if (missing) {
    return issue("missingGivenPoint", "עדיין לא סימנתם את כל הנקודות הנתונות. סמנו את " + pointText(missing.x, missing.y) + " לפי " + fText(missing.x, missing.y) + ".");
  }
  if (!logical.length) return null;
  var span = domainIssue(logical, domain, ex);
  if (span && !hasRegionSketch(ex)) return span;
  var flat = constantIssue(ex, points, logical);
  if (flat) return flat;
  var band = bandIssue(ex, logical);
  if (band) return band;
  var miss = curveMiss(required, points, logical);
  if (miss && constraints(ex, "ZERO_COUNT").length) return issue("missingKnownPoint", miss.message);
  if (miss && constraints(ex, "EXTREMUM").length) {
    var zeroMiss = required.some(function (need) {
      return near(need.y, 0) && miss.message.indexOf(pointText(need.x, need.y)) >= 0;
    });
    if (zeroMiss) return issue("missingZero", "השרטוט כמעט מתאים. בדקו האם הכנסתם את כל נקודות החיתוך עם ציר ה־x.");
    return issue("graphMissesRequiredPoint", miss.message);
  }
  if (miss) return miss;
  var signs = signIssue(ex, samplesOf(sketch));
  if (signs) return signs;
  var regions = regionIssue(ex, sketch);
  if (regions) return regions;
  var relation = relationIssue(ex, sketch);
  if (relation) return relation;
  var zeros = zeroIssue(ex, logical);
  if (zeros) return zeros;
  var events = eventIssue(ex, sketch);
  if (events) return events;
  var above = positiveIssue(ex, logical);
  if (above) return above;
  return contradiction(ex, progress, sketch);
}

function claimPossible(ex, claim) {
  if (!claim) return false;
  if (claim.type === "point") {
    var x = Number(claim.x);
    var y = Number(claim.y);
    var clash = requiredPoints(ex).some(function (pt) { return near(pt.x, x) && !near(pt.y, y); });
    if (clash) return false;
    var blocked = constraints(ex, "CONSTANT_INTERVAL").some(function (item) {
      return x >= Number(item.fromX) - 1e-9 && x <= Number(item.toX) + 1e-9 && !near(y, item.value);
    });
    return !blocked;
  }
  if (claim.type === "zeros") {
    var min = minZeros(ex);
    var count = Number(claim.count);
    return count >= min && (count - min) % 2 === 0;
  }
  if (claim.type === "relation") return true;
  return false;
}

function yesWord(text) {
  var raw = String(text || "").trim();
  var token = raw.replace(/[.\s]/g, "");
  if (token === "כן" || /^כן(?:[,.:]|\s|$)/.test(raw) || /^yes$/i.test(token)) return true;
  if (token === "לא" || /^לא(?:[,.:]|\s|$)/.test(raw) || /^no$/i.test(token)) return false;
  return null;
}

function bypassReason(text) {
  return /עוקפ|לעקוף|מסביב|בלי לפגוש|בלי לחתוך|בלי לחצות/.test(String(text || ""));
}

function signChangeReason(text) {
  var raw = String(text || "");
  if (bypassReason(raw)) return false;
  var neg = /שליל|מתחת/.test(raw);
  var pos = /חיובי|מעל/.test(raw);
  var cross = /חוצ|חות|פוגש|סימן|ציר/.test(raw);
  return (neg && pos) || (cross && (neg || pos));
}

function parseCount(text) {
  var match = String(text || "").match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function pointReason(ex, claim) {
  return "בין הנקודות הידועות הגרף אינו חייב להיות קו ישר, ולכן אפשר להעביר גרף רציף גם דרך " + pointText(claim.x, claim.y) + ".";
}

function layoutAnchors(pairs) {
  var xs = [];
  var ys = [];
  pairs.forEach(function (pt) {
    if (!xs.some(function (value) { return near(value, pt.x); })) xs.push(pt.x);
    if (!ys.some(function (value) { return near(value, pt.y); })) ys.push(pt.y);
  });
  xs.sort(function (a, b) { return a - b; });
  ys.sort(function (a, b) { return a - b; });
  function rank(value, axis) {
    if (near(value, 0)) return 0;
    var group = axis.filter(function (item) { return value < 0 ? item < 0 : item > 0; });
    var index = 0;
    group.forEach(function (item, at) { if (near(item, value)) index = at; });
    if (value < 0) return -0.28 - 0.16 * (group.length - 1 - index);
    return 0.28 + 0.16 * index;
  }
  return pairs.map(function (pt) {
    return { x: pt.x, y: pt.y, qx: rank(pt.x, xs), qy: rank(pt.y, ys), role: "given" };
  });
}

function pointSide(points) {
  var side = null;
  (points || []).forEach(function (pt) {
    if (!side) side = sideIssue(pt.x, pt.y, pt.qx, pt.qy);
  });
  return side;
}

function nudgeGuidePoint(point, placed) {
  var qx = point.qx;
  var qy = point.qy;
  (placed || []).forEach(function (pt) {
    if (!isFinite(pt.qx) || !isFinite(pt.qy)) return;
    if (near(point.x, pt.x)) qx = pt.qx;
    else if (point.x > pt.x) qx = Math.max(qx, pt.qx + 0.08);
    else qx = Math.min(qx, pt.qx - 0.08);
    if (near(point.y, pt.y)) qy = pt.qy;
    else if (point.y > pt.y) qy = Math.max(qy, pt.qy + 0.08);
    else qy = Math.min(qy, pt.qy - 0.08);
  });
  if (near(point.x, 0)) qx = 0;
  if (near(point.y, 0)) qy = 0;
  if (point.x > 0.05) qx = Math.max(0.12, qx);
  if (point.x < -0.05) qx = Math.min(-0.12, qx);
  if (point.y > 0.05) qy = Math.max(0.12, qy);
  if (point.y < -0.05) qy = Math.min(-0.12, qy);
  qx = Math.max(-0.92, Math.min(0.92, qx));
  qy = Math.max(-0.92, Math.min(0.92, qy));
  return { x: point.x, y: point.y, qx: qx, qy: qy, role: "given" };
}

function revealedAnchors(required, placed, next) {
  return layoutAnchors(required.filter(function (need) {
    return (next && samePoint(need, next)) || (placed || []).some(function (pt) { return samePoint(pt, need); });
  }));
}

function exampleExtremumY(ex, item) {
  var known = requiredPoints(ex).map(function (pt) { return Number(pt.y); });
  if (item.kind === "max") {
    var floor = known.length ? Math.max.apply(null, known) : 1;
    return floor + 2;
  }
  var ceiling = known.length ? Math.min.apply(null, known) : 2;
  var height = ceiling * 0.45;
  if (positiveOnDomain(ex) && height < 0.5) height = Math.min(ceiling * 0.5, 1);
  if (!(height > 0)) height = 1;
  if (height >= ceiling) height = ceiling * 0.5;
  return height;
}

function addFreeExtremum(ex, sketch, item) {
  var placed = ((sketch && sketch.points) || []).slice();
  var y = exampleExtremumY(ex, item);
  var qx = qFromLogical(placed, Number(item.x), "x", "qx");
  var qy = qFromLogical(placed, y, "y", "qy");
  placed.push({ x: Number(item.x), y: y, qx: qx, qy: qy, role: "extremum" });
  return { points: placed, strokes: (sketch && sketch.strokes) || [], line: null };
}

function addGuidePoint(ex, sketch, next) {
  var required = requiredPoints(ex);
  var placed = ((sketch && sketch.points) || []).slice();
  var spot = layoutAnchors(required).filter(function (pt) { return samePoint(pt, next); })[0];
  var points = placed.concat([nudgeGuidePoint(spot, placed)]);
  if (pointSide(points) || orderIssue(points)) {
    var anchors = revealedAnchors(required, placed, next);
    var extras = placed.filter(function (pt) {
      return !required.some(function (need) { return samePoint(need, pt); });
    });
    var mixed = anchors.concat(extras);
    points = !pointSide(mixed) && !orderIssue(mixed) ? mixed : anchors;
  }
  return {
    points: points,
    strokes: (sketch && sketch.strokes) || [],
    line: null,
  };
}

function qFromLogical(anchors, logical, logicalKey, qKey) {
  var pts = (anchors || []).filter(function (pt) {
    return isFinite(pt[qKey]) && isFinite(pt[logicalKey]);
  }).slice().sort(function (a, b) { return a[logicalKey] - b[logicalKey] || a[qKey] - b[qKey]; });
  if (!pts.length) return 0;
  if (pts.length === 1) return pts[0][qKey] + (logical - pts[0][logicalKey]) * 0.22;
  function at(i, target) {
    var dLogical = pts[i + 1][logicalKey] - pts[i][logicalKey];
    var dQ = pts[i + 1][qKey] - pts[i][qKey];
    if (Math.abs(dLogical) < 1e-9) return pts[i][qKey];
    return pts[i][qKey] + ((target - pts[i][logicalKey]) / dLogical) * dQ;
  }
  if (logical <= pts[0][logicalKey]) return at(0, logical);
  var i;
  for (i = 0; i < pts.length - 1; i++) {
    if (logical <= pts[i + 1][logicalKey] + 1e-9) return at(i, logical);
  }
  return at(pts.length - 2, logical);
}

function guideTangents(sorted) {
  var n = sorted.length;
  var slope = [];
  var i;
  for (i = 0; i < n - 1; i++) {
    var dx = sorted[i + 1].x - sorted[i].x;
    slope.push(Math.abs(dx) < 1e-6 ? 0 : (sorted[i + 1].y - sorted[i].y) / dx);
  }
  var m = [];
  m[0] = slope[0] || 0;
  if (n > 1) m[n - 1] = slope[n - 2] || 0;
  for (i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) m[i] = 0;
    else m[i] = (slope[i - 1] + slope[i]) / 2;
  }
  for (i = 0; i < n - 1; i++) {
    if (Math.abs(slope[i]) < 1e-6) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    var a = m[i] / slope[i];
    var b = m[i + 1] / slope[i];
    var size = a * a + b * b;
    if (size > 9) {
      var scale = 3 / Math.sqrt(size);
      m[i] = scale * a * slope[i];
      m[i + 1] = scale * b * slope[i];
    }
  }
  return m;
}

function hermiteY(y0, y1, m0, m1, dx, t) {
  var t2 = t * t;
  var t3 = t2 * t;
  var h00 = 2 * t3 - 3 * t2 + 1;
  var h10 = t3 - 2 * t2 + t;
  var h01 = -2 * t3 + 3 * t2;
  var h11 = t3 - t2;
  return h00 * y0 + h10 * m0 * dx + h01 * y1 + h11 * m1 * dx;
}

function guideStroke(anchors, domain) {
  var sorted = anchors.slice().sort(function (a, b) { return a.x - b.x || a.qx - b.qx; });
  var path = [];
  function pushLogical(x, y) {
    path.push({ x: x, y: y });
  }
  if (!sorted.length) return [];
  var tangents = guideTangents(sorted);
  pushLogical(sorted[0].x, sorted[0].y);
  var i;
  var k;
  for (i = 0; i < sorted.length - 1; i++) {
    var a = sorted[i];
    var b = sorted[i + 1];
    var dx = b.x - a.x;
    var steps = 22;
    for (k = 1; k <= steps; k++) {
      var t = k / steps;
      var x = a.x + dx * t;
      var y = near(a.y, b.y) ? a.y : hermiteY(a.y, b.y, tangents[i], tangents[i + 1], dx, t);
      pushLogical(x, y);
    }
  }
  var width = Math.max(1, domain.max - domain.min);
  var cover = Math.max(0.55, width * 0.12);
  var first = path[0];
  var last = path[path.length - 1];
  if (!domain.all && first.x > domain.min + cover) {
    var head = [];
    for (k = 0; k < 6; k++) head.push({ x: domain.min + (first.x - domain.min) * (k / 6), y: first.y });
    path = head.concat(path);
  }
  if (!domain.all && last.x < domain.max - cover) {
    for (k = 1; k <= 6; k++) path.push({ x: last.x + (domain.max - last.x) * (k / 6), y: last.y });
  }
  return path.map(function (pt) {
    return {
      qx: qFromLogical(sorted, pt.x, "x", "qx"),
      qy: qFromLogical(sorted, pt.y, "y", "qy"),
    };
  });
}

function guideDraw(ex, sketch) {
  var required = requiredPoints(ex);
  var placed = ((sketch && sketch.points) || []).slice();
  var laid = layoutAnchors(required);
  var anchors = required.map(function (need) {
    var hit = placed.filter(function (pt) {
      return samePoint(pt, need) && isFinite(pt.qx) && isFinite(pt.qy);
    })[0];
    if (!hit) return laid.filter(function (pt) { return samePoint(pt, need); })[0];
    return { x: hit.x, y: hit.y, qx: hit.qx, qy: hit.qy, role: "given" };
  });
  if (pointSide(anchors) || orderIssue(anchors)) anchors = laid;
  var extras = placed.filter(function (pt) {
    return !required.some(function (need) { return samePoint(need, pt); });
  });
  var points = anchors.concat(extras);
  if (pointSide(points) || orderIssue(points)) points = anchors;
  var board = { points: points, strokes: [guideStroke(anchors, domainOf(ex))], line: null };
  if (validateSketch(ex, board, { answers: {} })) {
    board = { points: laid, strokes: [guideStroke(laid, domainOf(ex))], line: null };
  }
  return board;
}

function diagnose(ex, sketch) {
  var points = (sketch && sketch.points) || [];
  var strokes = samplesOf(sketch);
  var required = requiredPoints(ex);
  var missing = missingPoint(required, points);
  var domain = domainOf(ex);
  var constant = constraints(ex, "CONSTANT_INTERVAL")[0];
  if (!points.length && !strokes.length) {
    var first = required[0];
    var startLine = domain.all
      ? "סמנו את הנקודה " + pointText(first.x, first.y) + "."
      : "תחום ההגדרה הוא " + domainText(domain) + ". סמנו את הנקודה " + pointText(first.x, first.y) + ".";
    return {
      id: "start",
      ready: false,
      lines: [
        "התחילו מהנתונים שאתם יודעים בוודאות. כל נתון מהצורה f(a)=b נותן את הנקודה (a,b).",
        startLine,
      ],
    };
  }
  if (missing) {
    var lines = [];
    if (strokes.length) {
      lines.push("הגרף כבר צויר, אבל הוא אינו עובר דרך אחת הנקודות הנתונות. בדקו את " + fText(missing.x, missing.y) + ".");
    }
    lines.push("עדיין לא סימנתם את כל הנקודות הנתונות.");
    lines.push("סמנו את הנקודה " + pointText(missing.x, missing.y) + " שמתקבלת מ־" + fText(missing.x, missing.y) + ".");
    return { id: "missing:" + missing.x + ":" + missing.y, ready: false, lines: lines };
  }
  if (!strokes.length) {
    var draw = ["כעת חברו ביניהן באמצעות גרף אפשרי שעומד בכל הנתונים."];
    if (constant) {
      draw.push("שימו לב: בתחום " + intervalText(constant) + " ערך הפונקציה קבוע.");
      draw.push("לכן בחלק הזה הגרף צריך להיות אופקי.");
    }
    return { id: "draw", ready: false, lines: draw };
  }
  var problem = validateSketch(ex, sketch, { answers: {} });
  if (problem) return { id: problem.id, ready: false, lines: [problem.message], issue: problem };
  return { id: "ready", ready: true, lines: ["הסקיצה עומדת בנתונים. זו דוגמה אחת, לא הצורה היחידה."] };
}

function hintList(ex, progress, sketch) {
  var loc = locate(ex, progress);
  var task = loc.task;
  if (!task || task.kind === "freeSketch") {
    var scope = withPart(ex, loc.part);
    if (constraints(scope, "EXTREMUM").length) return eventHints(scope, sketch);
    var guided = signHints(scope);
    if (guided) return guided;
    if (hasRegionSketch(scope)) {
      var regionProblem = validateSketch(scope, sketch, progress);
      if (regionProblem && regionProblem.id === "wrongValueRelation") return [regionProblem.message];
      var rel = constraints(scope, "VALUE_RELATION")[0];
      var lines = [
        "איפה הפונקציה שלילית ואיפה היא חיובית?",
        "נקודת אפס נמצאת במקום שבו הגרף עובר דרך ציר ה־x.",
      ];
      if (rel) lines.push("הסימן אינו קובע את הגובה. בדקו את " + fPair(rel) + ".");
      if (regionProblem) lines.unshift(regionProblem.message);
      return lines;
    }
    var found = diagnose(scope, sketch);
    return found.lines;
  }
  if (task.kind === "zeros") {
    var savedZeros = (progress.answers && progress.answers[task.id] && progress.answers[task.id].xs) || [];
    if (savedZeros.length && savedZeros.length < (task.xs || []).length) {
      return [
        "הנקודה שרשמתם נכונה.",
        "יש עוד מקום שבו הגרף עובר מצד אחד של ציר ה־x לצד השני.",
        "רשמו גם את הנקודה הזו כזוג סדור, עם y=0.",
      ];
    }
    return [
      "איפה הפונקציה שלילית ואיפה היא חיובית?",
      "נקודת אפס היא זוג סדור על ציר ה־x, לא רק שיעור x.",
      "בדקו מה קורה בגבול שבין שני התחומים.",
    ];
  }
  if (task.kind === "feasible" && task.reason === "signChange") {
    var waiting = progress.answers && progress.answers[task.id] && progress.answers[task.id].needReason;
    if (waiting) {
      return [
        "בדקו את הסימנים של שני ערכי הפונקציה הנתונים.",
        "בנקודה אחת הגרף מתחת לציר ה־x ובנקודה אחרת מעליו.",
        "חשבו מה חייב לקרות לגרף רציף בדרך ביניהן.",
      ];
    }
    return [
      "בדקו את הסימנים של שני ערכי הפונקציה הנתונים.",
      "בנקודה אחת הגרף מתחת לציר ה־x ובנקודה אחרת מעליו.",
      "חשבו מה חייב לקרות לגרף רציף בדרך ביניהן.",
    ];
  }
  if (task.kind === "feasible" && task.claim && (task.claim.type === "signBound" || task.askMode)) {
    var askLine = (task.askMode || "can") === "must"
      ? "השאלה היא אם זה מתקיים בהכרח, לא רק אם זה אפשרי."
      : "השאלה היא אם זה יכול להתקיים, לא אם זה חייב להתקיים.";
    return [
      "מקמו את ערך ה־x בתחום המתאים.",
      "מה ידוע על סימן הפונקציה בתחום הזה?",
      askLine,
    ];
  }
  if (task.kind === "feasible" && task.claim && task.claim.type === "relation") {
    return [
      "חיוביות מתארת אם הגרף מעל ציר ה־x או מתחתיו.",
      "היא אינה קובעת אם הפונקציה עולה או יורדת.",
      "בדקו אם אפשר לצייר שני גבהים שונים בלי לשנות את הסימן.",
    ];
  }
  if (task.kind === "extremumType") {
    if (task.hints && task.hints.length) return task.hints.slice();
    var kindWord = task.answer === "max" ? "מקסימום" : "מינימום";
    var beforeWord = task.answer === "max" ? "עולה" : "יורדת";
    var afterWord = task.answer === "max" ? "יורדת" : "עולה";
    return [
      "בדקו מה קורה לפונקציה לפני x=" + num(task.point.x) + " ומה קורה אחריו.",
      beforeWord + " ואז " + afterWord + ": " + kindWord + ".",
    ];
  }
  if (task.kind === "trend") {
    return [
      "הסתכלו על הגרף מ־x=" + num(task.from) + " לכיוון x=" + num(task.to) + ". כאשר מתקדמים ימינה, מה קורה לערכי y?",
      "העובדה ש־x גדל אינה אומרת שגם y גדל.",
    ];
  }
  if (task.kind === "signDomains") {
    var signDomain = domainOf(ex);
    return [
      "בדקו את הסימן בקצוות התחום, וגם בין הקצוות.",
      "הפונקציה מוגדרת רק בתחום " + domainText(signDomain) + ", לא לכל x. הקצוות עצמם נכללים אם ערך הפונקציה שם חיובי.",
    ];
  }
  if (task.kind === "range") {
    return [
      "מהו ערך ה־y הגבוה ביותר שהפונקציה מקבלת?",
      "זהו תחום הערכים של הפונקציה, לא תחום ה־x. הפונקציה אינה עולה מעל " + num(task.max) + ".",
    ];
  }
  if (task.kind === "feasible" && task.claim && task.claim.type === "horizontal") {
    var heightLines = [
      "מהו ערך ה־y בנקודת המקסימום?",
      "הערך הגדול ביותר שהפונקציה מקבלת הוא " + num(task.claim.maxY) + ". היכן נמצא הישר y=" + num(task.claim.y) + " ביחס אליו?",
    ];
    if (sketch && sketch.refs && sketch.refs.length) heightLines.unshift("בדקו האם הישר האופקי שהוספתם פוגש את גרף הפונקציה.");
    return heightLines;
  }
  if (task.kind === "feasible" && task.claim && task.claim.type === "belowMin") {
    return [
      "מהו הערך הקטן ביותר שהפונקציה יכולה לקבל?",
      "המינימום הוא בגובה " + num(task.claim.minY) + ". השוו אותו ל־0.",
    ];
  }
  if (task.kind === "feasible" && task.claim && task.claim.type === "zeros") {
    return [
      "בדקו אילו חיתוכים של ציר ה־x מוכרחים משינויי הסימן, ואילו רק אפשריים.",
      "גרף רציף שמשנה סימן בין שתי נקודות ידועות חייב לחצות את ציר ה־x לפחות פעם אחת באותו קטע.",
    ];
  }
  if (task.kind === "feasible") {
    return [
      "השאלה היא אם קיימת סקיצה כלשהי שעומדת בכל הנתונים וגם בתנאי החדש.",
      "אין להסיק את התשובה מהקו הישר בין שתי נקודות ידועות.",
    ];
  }
  if (task.kind === "atLeastZeros") {
    return [
      "המילה לפחות מבקשת את מספר החיתוכים המוכרח, לא את מספר החיתוכים בסקיצה אחת.",
      "עברו על כל זוג נקודות ידועות סמוכות וראו היכן הסימן משתנה.",
    ];
  }
  return ["המשיכו לפי הנתונים שכבר מסומנים."];
}

function freshProgress() {
  return { partIndex: 0, taskIndex: 0, done: {}, answers: {}, coach: 0, coachKey: "", sketchValidated: false, phase: "READ_DOMAIN" };
}

function progressOf(raw) {
  raw = raw || {};
  return {
    partIndex: raw.partIndex || 0,
    taskIndex: raw.taskIndex || 0,
    done: Object.assign({}, raw.done || {}),
    answers: Object.assign({}, raw.answers || {}),
    coach: raw.coach || 0,
    coachKey: raw.coachKey || "",
    sketchValidated: !!raw.sketchValidated,
    phase: raw.phase || "",
  };
}

function locate(ex, progress) {
  var parts = ex.parts || [];
  var pi = progress.partIndex || 0;
  if (pi >= parts.length) return { done: true, part: null, task: null, partIndex: pi, taskIndex: 0 };
  var part = parts[pi];
  var tasks = part.tasks || [];
  var ti = progress.taskIndex || 0;
  if (ti >= tasks.length) ti = 0;
  return { done: false, part: part, task: tasks[ti] || null, partIndex: pi, taskIndex: ti };
}

function advance(ex, progress) {
  var loc = locate(ex, progress);
  if (loc.task) progress.done[loc.task.id] = true;
  var tasks = (loc.part && loc.part.tasks) || [];
  if (loc.taskIndex + 1 < tasks.length) progress.taskIndex += 1;
  else {
    progress.partIndex += 1;
    progress.taskIndex = 0;
  }
  progress.coach = 0;
  progress.coachKey = "";
  return locate(ex, progress).done;
}

function sketchParts(ex, progress) {
  var parts = ex.parts || [];
  if (parts.length < 2) return null;
  var sketchCount = parts.filter(function (part) {
    return (part.tasks || []).some(function (task) { return task.kind === "freeSketch"; });
  }).length;
  var sketchPartsOnly = parts.every(function (part) {
    return ((part.tasks || [])[0] || {}).kind === "freeSketch";
  });
  if (!sketchPartsOnly && sketchCount < 2 && !hasRegionSketch(ex)) return null;
  return parts.map(function (part, index) {
    var task = (part.tasks || [])[0] || {};
    return {
      label: part.label || "",
      text: part.text || "",
      done: !!(progress.done && progress.done[task.id]),
      current: index === (progress.partIndex || 0),
    };
  });
}

function viewFor(ex, progress, sketch) {
  var loc = locate(ex, progress);
  var scope = withPart(ex, loc.part);
  var task = loc.task;
  var input = "math";
  var ask = null;
  if (!task || task.kind === "freeSketch") input = "sketch";
  if (task && task.kind === "signDomains") input = "domains";
  var pendingReason = task && task.kind === "feasible" && task.reason && progress.answers[task.id] && progress.answers[task.id].needReason;
  if (task && task.kind === "feasible" && !pendingReason) {
    input = "yesno";
    ask = { stage: "yesno", question: task.prompt || "ענו כן או לא." };
  }
  if (pendingReason) input = "math";
  var hints = hintList(ex, progress, sketch);
  var phase = "DRAW_FUNCTION";
  if (task && task.kind === "freeSketch") {
    var status = diagnose(scope, sketch);
    phase = status.id === "start" ? "READ_DOMAIN" : status.id === "draw" ? "DRAW_FUNCTION" : "VALIDATE_SKETCH";
  }
  progress.phase = phase;
  var domain = domainOf(scope);
  var parts = sketchParts(ex, progress);
  return {
    stem: ex.stem || "",
    part: loc.part ? { label: loc.part.label || "", text: loc.part.text || "" } : null,
    focusKind: task ? task.kind + ":" + task.id : "done",
    sketch: !!(task && (task.kind === "freeSketch" || task.keepBoard)),
    keepBoard: !!(task && task.keepBoard),
    helperLine: task && task.offerLine ? task.offerLine : null,
    family: "free",
    domain: domain.all ? null : domain,
    parts: parts,
    ask: ask,
    input: loc.done ? "math" : input,
    domains: task && task.kind === "signDomains" ? signFields(progress) : null,
    hint: hints[0] || "",
    hints: hints,
  };
}

function signFields(progress) {
  var saved = (progress && progress.signSides) || {};
  var rows = (progress && progress.signRows) || { pos: [], neg: [] };
  function column(id, label) {
    var locked = !!saved[id];
    var list = rows[id] || [];
    return {
      id: id,
      label: label,
      locked: locked,
      value: saved[id] || "",
      rows: list.length
        ? list.map(function (value) { return { locked: true, value: value }; })
        : [{ locked: locked, value: locked ? (saved[id] || "") : "" }],
    };
  }
  return [column("pos", "חיובית"), column("neg", "שלילית")];
}

function payload(ex, progress, sketch, show, message, solved, board) {
  var hints = hintList(ex, progress, sketch);
  var out = {
    ok: true,
    show: show || "",
    message: message || "",
    progress: progress,
    solved: !!solved,
    view: viewFor(ex, progress, sketch),
    hint: hints[0] || "",
    hints: hints,
  };
  if (board) out.board = board;
  return out;
}

function allConstraints(ex) {
  var list = (ex.constraints || []).slice();
  (ex.parts || []).forEach(function (part) {
    (part.constraints || []).forEach(function (item) { list.push(item); });
  });
  return list;
}

function eventSolution(ex) {
  var steps = [];
  var notes = ["יכולות להיות סקיצות שונות ונכונות. הבדיקה היא על הנתונים, לא על צורה אחת שמורה."];
  var bag = allConstraints(ex);
  var points = [];
  bag.forEach(function (item) {
    if (item.type === "KNOWN_POINT") points.push(pointText(item.x, item.y));
    if (item.type === "Y_INTERCEPT") points.push(pointText(0, item.y));
    if (item.type === "X_INTERCEPT" || item.type === "ZERO_AT_X") points.push(pointText(item.x, 0));
    if (item.type === "EXTREMUM" && yKnown(item)) points.push(pointText(item.x, item.y));
  });
  var unique = [];
  points.forEach(function (text) {
    if (unique.indexOf(text) < 0) unique.push(text);
  });
  var solutionDomain = domainOf(ex);
  if (solutionDomain && !solutionDomain.all) steps.push("מסמנים את תחום ההגדרה " + domainText(solutionDomain) + ". הגרף אינו נמשך מחוץ לתחום.");
  if (unique.length) steps.push("מסמנים את הנקודות הידועות: " + unique.join(", ") + ".");
  var extrema = bag.filter(function (item) { return item.type === "EXTREMUM"; });
  if (extrema.length) {
    steps.push(extrema.map(function (item) {
      var kind = item.kind === "max" ? "מקסימום" : "מינימום";
      if (!yKnown(item)) return "ב־x=" + num(item.x) + " יש נקודת " + kind + ". שיעור ה־y אינו נתון, ולכן לא קובעים לו מספר יחיד.";
      return pointText(item.x, item.y) + " היא נקודת " + kind;
    }).join(". ") + (extrema.every(function (item) { return yKnown(item); }) ? ". הסיווג נקבע לפי העלייה והירידה, לא לפי הגובה על המסך." : ""));
  }
  var monos = bag.filter(function (item) {
    return item.type === "MONOTONE" && isFinite(Number(item.from)) && isFinite(Number(item.to));
  });
  if (monos.length) {
    steps.push(monos.map(function (item) {
      return (item.direction === "inc" ? "עולה" : "יורדת") + " עבור " + num(item.from) + "<x<" + num(item.to);
    }).join(", ") + ".");
  }
  if (bag.some(function (item) { return item.type === "POSITIVE_ON_DOMAIN"; })) {
    steps.push("הפונקציה חיובית בכל תחום ההגדרה, כולל הקצוות, ולכן הגרף נשאר מעל ציר ה־x.");
  }
  steps.push("מחברים סקיצה אפשרית בתוך תחום ההגדרה. כל גרף שמקיים את האילוצים מתקבל, ואין סקיצה יחידה.");
  (ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) {
      if (task.kind === "trend") {
        steps.push("בתחום " + num(task.from) + "<x<" + num(task.to) + ", ככל ש־x גדל y קטן.");
      }
      if (task.kind === "signDomains") {
        var signDomainNow = domainOf(ex);
        steps.push({
          parallel: [
            { label: "תחומי חיוביות", steps: [domainText(signDomainNow)] },
            { label: "תחומי שליליות", steps: ["אין"] },
          ],
          explain: "לא כותבים כל x, כי הפונקציה אינה מוגדרת מחוץ לתחום, והקצוות כלולים.",
        });
      }
      if (task.kind === "extremumType") {
        var min = task.answer !== "max";
        steps.push((min ? "מינימום. " : "מקסימום. ") + "לפני x=" + num(task.point.x) + " הפונקציה " + (min ? "יורדת" : "עולה") + ", ואחריו היא " + (min ? "עולה" : "יורדת") + ".");
      }
      if (task.kind === "feasible" && task.claim && task.claim.type === "horizontal") {
        steps.push("לא. הערך הגדול ביותר הוא " + num(task.claim.maxY) + ", ולכן הישר y=" + num(task.claim.y) + " אינו חותך את הגרף.");
      }
      if (task.kind === "range") {
        steps.push("f(x)≤" + num(task.max) + ". זהו תחום הערכים, לא תחום ה־x.");
      }
      if (task.kind === "feasible" && task.claim && task.claim.type === "belowMin") {
        steps.push("לא. הערך הקטן ביותר הוא " + num(task.claim.minY) + ", ולכן אין x שעבורו f(x)<0.");
      }
    });
  });
  return { steps: steps, notes: notes };
}

function solutionSteps(ex) {
  if (allConstraints(ex).some(function (item) { return item.type === "EXTREMUM"; })) return eventSolution(ex);
  var signParts = (ex.parts || []).filter(function (part) {
    return constraints(withPart(ex, part), "ZERO_COUNT").length && ((part.tasks || [])[0] || {}).kind === "freeSketch";
  });
  var onlySignSketches = signParts.length && signParts.length === (ex.parts || []).length;
  if (onlySignSketches) {
    var known = requiredPoints(ex).map(function (pt) { return pointText(pt.x, pt.y); }).join(", ");
    var steps = ["סקיצה אפשרית. הנקודה " + known + " משותפת לכל הסעיפים, והפונקציה מוגדרת לכל x."];
    var notes = ["כל סעיף הוא סקיצה נפרדת. אין צורה אחת נכונה, כל עוד האילוצים מתקיימים."];
    var examples = [];
    signParts.forEach(function (part) {
      var scope = withPart(ex, part);
      steps.push("סעיף " + (part.label || "") + ": סקיצה אפשרית. " + signWhy(scope));
      var drawn = signExample(scope);
      if (drawn) examples.push({ label: part.label || "", point: drawn.point, stroke: drawn.stroke });
    });
    return { steps: steps, notes: notes, examples: examples };
  }
  if (signParts.length) {
    var mixedSteps = ["הפונקציה מוגדרת לכל x. כל סקיצה היא דוגמה אחת, לא הצורה היחידה."];
    var mixedNotes = ["סקיצה אחרת שמקיימת את הנקודות ואת מספר נקודות האפס גם היא נכונה."];
    var mixedExamples = [];
    signParts.forEach(function (part) {
      var scope = withPart(ex, part);
      mixedSteps.push("סעיף " + (part.label || "") + ": סקיצה אפשרית. " + signWhy(scope));
      var drawn = signGuide(scope, { points: layoutAnchors(requiredPoints(scope)), strokes: [] });
      if (drawn && drawn.strokes && drawn.strokes[0]) {
        mixedExamples.push({
          label: part.label || "",
          points: drawn.points.map(function (pt) { return { qx: pt.qx, qy: pt.qy }; }),
          stroke: drawn.strokes[0].map(function (pt) { return [pt.qx, pt.qy]; }),
        });
      }
    });
    (ex.parts || []).forEach(function (part) {
      (part.tasks || []).forEach(function (task) {
        if (task.kind === "feasible" && task.claim && task.claim.type === "zeros") {
          var yes = claimPossible(ex, task.claim);
          mixedSteps.push("סעיף " + (part.label || "") + ": " + (yes ? "כן. " : "לא. ") + zeroForceMessage(ex));
        }
      });
    });
    return { steps: mixedSteps, notes: mixedNotes, examples: mixedExamples };
  }
  if ((ex.parts || []).some(function (part) {
    return (part.tasks || []).some(function (task) { return task.kind === "zeros" || (task.claim && task.claim.type === "relation"); });
  })) {
    var regionSteps = [];
    var regionNotes = ["כל תת־סעיף מוצג בנפרד. סקיצה היא דוגמה אחת, לא צורה יחידה."];
    (ex.parts || []).forEach(function (part) {
      var scope = withPart(ex, part);
      (part.tasks || []).forEach(function (task) {
        if (task.kind === "zeros") {
          regionSteps.push("סעיף " + (part.label || "") + ": " + formatZeroPoints(task.xs || []) + ". נקודת אפס היא זוג סדור על ציר ה־x, בגבול שבין תחום שלילי לתחום חיובי.");
        }
        if (task.kind === "feasible" && task.claim && (task.claim.type === "relation" || task.claim.type === "signBound")) {
          var verdict = claimVerdict(ex, task.claim);
          var word = wantYes(task, verdict) ? "כן" : "לא";
          regionSteps.push("סעיף " + (part.label || "") + ": " + word + ". " + signBecause(ex, task, verdict));
        }
        if (task.kind === "feasible" && task.reason === "signChange") {
          regionSteps.push("סעיף " + (part.label || "") + ": לא. " + zeroForceMessage(ex));
        }
        if (task.kind === "freeSketch" && hasRegionSketch(scope)) {
          regionSteps.push("סעיף " + (part.label || "") + ": סקיצה אפשרית. " + regionWhy(scope));
        }
      });
    });
    var regionExamples = [];
    (ex.parts || []).forEach(function (part) {
      var scope = withPart(ex, part);
      if (!(part.tasks || []).some(function (task) { return task.kind === "freeSketch" && hasRegionSketch(scope); })) return;
      var drawn = regionGuide(scope);
      if (!drawn || !drawn.strokes || !drawn.strokes[0]) return;
      regionExamples.push({
        label: part.label || "",
        points: (drawn.points || []).map(function (pt) { return { qx: pt.qx, qy: pt.qy }; }),
        stroke: drawn.strokes[0].map(function (pt) { return [pt.qx, pt.qy]; }),
      });
    });
    return { steps: regionSteps, notes: regionNotes, examples: regionExamples };
  }
  var steps = [];
  var notes = [];
  var domain = domainOf(ex);
  var points = requiredPoints(ex).map(function (pt) { return pointText(pt.x, pt.y); }).join(", ");
  steps.push("סקיצה אפשרית. הנתונים מחייבים את הנקודות " + points + " בתחום " + domainText(domain) + ".");
  notes.push("מסמנים קודם את הנתונים המחייבים, ואחר כך מציירים דוגמה אחת לגרף שעומד בהם.");
  var constant = constraints(ex, "CONSTANT_INTERVAL")[0];
  if (constant) {
    steps.push("בתחום " + intervalText(constant) + " הגרף אופקי בגובה y=" + num(constant.value) + ". לא מספיק לעבור רק בקצוות.");
    notes.push("קטע קבוע מחייב את כל הערכים בקטע, לא רק את נקודות הקצה.");
  } else {
    steps.push("מעבירים גרף רציף שמתחיל ומסתיים לפי התחום ועובר דרך הנקודות. אין צורה אחת נכונה.");
    notes.push("בין שתי נקודות ידועות הגרף יכול לעלות, לרדת או ליצור קיצון.");
  }
  (ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) {
      if (task.kind === "feasible" && task.claim && task.claim.type === "point") {
        var possible = claimPossible(ex, task.claim);
        steps.push((possible ? "כן. " : "לא. ") + (possible ? pointReason(ex, task.claim) : "הנתון החדש סותר אילוץ שכבר קיים."));
        notes.push(task.prompt || "");
      }
      if (task.kind === "feasible" && task.claim && task.claim.type === "zeros") {
        var yes = claimPossible(ex, task.claim);
        steps.push((yes ? "כן. " : "לא. ") + zeroForceMessage(ex));
        notes.push(task.prompt || "");
      }
      if (task.kind === "atLeastZeros") {
        var min = minZeros(ex);
        steps.push("לפחות " + num(min) + ". " + zeroForceMessage(ex) + " ייתכנו נקודות אפס נוספות, והשאלה מבקשת את המינימום המוכרח.");
        notes.push("סקיצה עם יותר נקודות אפס עדיין יכולה להיות אפשרית.");
      }
    });
  });
  return { steps: steps, notes: notes };
}

function boundVerdict(info, op, value) {
  if (info.kind === "value" || info.kind === "zero") {
    var y = info.kind === "zero" ? 0 : info.y;
    var holds = op === "<" ? y < value : op === ">" ? y > value : op === "=" ? near(y, value) : false;
    return holds ? "must" : "cannot";
  }
  if (info.kind === "positive") {
    if (op === ">" && value <= 0) return "must";
    if (op === ">" && value > 0) return "can";
    if (op === "<" && value <= 0) return "cannot";
    if (op === "<" && value > 0) return "can";
    if (op === "=" && value <= 0) return "cannot";
    return "can";
  }
  if (info.kind === "negative") {
    if (op === "<" && value >= 0) return "must";
    if (op === "<" && value < 0) return "can";
    if (op === ">" && value >= 0) return "cannot";
    if (op === ">" && value < 0) return "can";
    if (op === "=" && value >= 0) return "cannot";
    return "can";
  }
  return "can";
}

function relationVerdict(ex, claim) {
  var a = infoAt(ex, Number(claim.x1));
  var b = infoAt(ex, Number(claim.x2));
  function numeric(info) {
    if (info.kind === "zero") return 0;
    if (info.kind === "value") return info.y;
    return null;
  }
  var ya = numeric(a);
  var yb = numeric(b);
  var op = claim.op;
  if (ya != null && yb != null) {
    var exact = op === ">" ? ya > yb : op === "<" ? ya < yb : op === "=" ? near(ya, yb) : false;
    return exact ? "must" : "cannot";
  }
  function rank(info) {
    if (info.kind === "positive") return 1;
    if (info.kind === "negative") return -1;
    if (info.kind === "zero") return 0;
    return null;
  }
  var ra = rank(a);
  var rb = rank(b);
  if (ra != null && rb != null && ra !== rb) {
    if (op === "=") return "cannot";
    var holds = op === ">" ? ra > rb : op === "<" ? ra < rb : false;
    return holds ? "must" : "cannot";
  }
  return "can";
}

function claimVerdict(ex, claim) {
  if (!claim) return "can";
  if (claim.type === "signBound") return boundVerdict(infoAt(ex, Number(claim.x)), claim.op, Number(claim.value));
  if (claim.type === "relation") return relationVerdict(ex, claim);
  return "can";
}

function wantYes(task, verdict) {
  if ((task.askMode || "can") === "must") return verdict === "must";
  return verdict !== "cannot";
}

function mentionsUndefined(text) {
  return /לא מוגדר|אינה מוגדר|אינו מוגדר|לא קיימ|חור בתחום/.test(String(text || ""));
}

function mentionsLarge(text) {
  return /גדול|עול|מעל\s*60|הרבה/.test(String(text || ""));
}

function signAnswerIssue(ex, task, text, yes) {
  var claim = task.claim || {};
  var verdict = claimVerdict(ex, claim);
  var accept = wantYes(task, verdict);
  if (yes === accept) {
    return { ok: true, show: yes ? "כן" : "לא", message: signBecause(ex, task, verdict) };
  }
  if (mentionsUndefined(text)) {
    return issue("excludedFromSignMeansUndefined", "השמטה של נקודה מנתון החיוביות אינה אומרת שהפונקציה אינה מוגדרת שם. היא מוגדרת, ורק הסימן בנקודה הזאת אינו ידוע.");
  }
  if (claim.type === "signBound" && verdict === "cannot" && yes) {
    var where = infoAt(ex, Number(claim.x));
    var side = where.kind === "positive" ? "f(x)>0" : "f(x)<0";
    return issue("wrongIntervalLookup", "x=" + num(claim.x) + " נמצא בתחום שבו " + side + ". לכן האי־שוויון הזה אינו אפשרי.");
  }
  if (claim.type === "relation" && verdict === "cannot" && yes) {
    var left = infoAt(ex, Number(claim.x1));
    var right = infoAt(ex, Number(claim.x2));
    return issue("ignoredKnownSignsWhenComparing", "f(" + num(claim.x1) + ")" + (left.kind === "negative" ? "<0" : ">0") + " ו־f(" + num(claim.x2) + ")" + (right.kind === "negative" ? "<0" : ">0") + ". מספר שלילי אינו גדול ממספר חיובי.");
  }
  if ((task.askMode || "can") === "can" && verdict === "can" && !yes && claim.type === "signBound" && mentionsLarge(text)) {
    return issue("positiveMeansLarge", "חיוביות אומרת רק שהגרף מעל ציר ה־x. היא אינה קובעת שהערך גדול.");
  }
  if ((task.askMode || "can") === "can" && verdict === "can" && !yes && claim.type === "signBound") {
    return issue("possibleConfusedWithNecessary", "לא נשאל אם הדבר בהכרח נכון, אלא אם הוא יכול להתקיים. מהנתונים ידוע רק ש־f(" + num(claim.x) + ")>0.");
  }
  if ((task.askMode || "can") === "must" && verdict === "can" && yes) {
    var unknown = [infoAt(ex, Number(claim.x1)), claim.x2 != null ? infoAt(ex, Number(claim.x2)) : null].filter(function (item) { return item && item.kind === "unknown"; })[0];
    if (unknown) {
      return issue("unknownPointAssumedZero", "הפונקציה מוגדרת ב־x=" + num(unknown.x) + ", אבל הסימן שם אינו ידוע. אין להסיק שהערך בהכרח 0.");
    }
    return issue("necessaryConfusedWithPossible", "המצב אפשרי, אבל הוא אינו נובע בהכרח מהנתונים.");
  }
  if ((task.askMode || "can") === "can" && verdict === "can" && !yes && claim.type === "relation") {
    var unknownRel = [infoAt(ex, Number(claim.x1)), infoAt(ex, Number(claim.x2))].filter(function (item) { return item.kind === "unknown"; })[0];
    if (unknownRel) {
      return issue("unknownPointAssumedZero", "f(" + num(claim.x2) + ") ידוע, אבל f(" + num(claim.x1) + ") אינו נקבע מהנתונים. אפשר לבחור ערך שמקיים את האי־שוויון.");
    }
    var probe = signProbe(ex, Number(claim.x1)) || signProbe(ex, Number(claim.x2));
    if (probe > 0) return issue("positiveMeansIncreasing", "חיוביות מתארת אם הגרף נמצא מעל או מתחת לציר ה־x. היא אינה קובעת אם הפונקציה עולה או יורדת.");
    if (probe < 0) return issue("negativeMeansDecreasing", "שליליות מתארת אם הגרף נמצא מתחת לציר ה־x. היא אינה קובעת אם הפונקציה עולה או יורדת.");
    return issue("comparedUnknownMagnitudesFromSameSign", "שני ערכים מאותו סימן אינם קובעים מי מהם גדול יותר.");
  }
  return issue("treatedPossibleAsNecessary", "התשובה אינה מתאימה לנתונים.");
}

function signBecause(ex, task, verdict) {
  var claim = task.claim || {};
  if (claim.type === "signBound") {
    var info = infoAt(ex, Number(claim.x));
    if (verdict === "cannot" && info.kind === "positive") return "x=" + num(claim.x) + " נמצא בתחום שבו f(x)>0, ולכן הערך אינו שלילי.";
    if (verdict === "can" && info.kind === "positive") return "ידוע רק ש־f(" + num(claim.x) + ")>0. ערך חיובי יכול להיות גם קטן מהמספר שבשאלה.";
    if (info.kind === "negative") return "x=" + num(claim.x) + " נמצא בתחום שבו f(x)<0.";
  }
  if (claim.type === "relation" && (task.askMode || "can") === "must" && verdict !== "must") {
    return "f(" + num(claim.x2) + ") ידוע, אבל f(" + num(claim.x1) + ") אינו נקבע מהנתונים. השוויון אינו בהכרח מתקיים.";
  }
  if (claim.type === "relation" && verdict === "cannot") {
    return "הסימנים הידועים קובעים את כיוון האי־שוויון. מספר שלילי קטן ממספר חיובי.";
  }
  if (claim.type === "relation" && verdict === "can") {
    return "הסימן אינו קובע ערך מדויק, ולכן המצב יכול להתקיים.";
  }
  return "זה מה שנובע מתחומי הסימן.";
}

function locatePrompt(task) {
  var claim = task.claim || {};
  if (claim.type === "relation") {
    return "בדקו באיזה תחום נמצא x=" + num(claim.x1) + " ובאיזה תחום נמצא x=" + num(claim.x2) + ".";
  }
  return "מקמו את x=" + num(claim.x) + " בתחום המתאים.";
}

function helperLineIssue(sketch, claim) {
  var refs = (sketch && sketch.refs) || [];
  if (!refs.length) return null;
  var ref = refs[refs.length - 1];
  if (Math.abs(Number(ref.y1) - Number(ref.y2)) > 0.06) {
    return issue("helperLineNotHorizontal", "הישר y=" + num(claim.y) + " צריך להיות אופקי.");
  }
  var maxPt = null;
  ((sketch && sketch.points) || []).forEach(function (pt) {
    if (!isFinite(pt.y)) return;
    if (!maxPt || Number(pt.y) > Number(maxPt.y)) maxPt = pt;
  });
  if (maxPt && isFinite(maxPt.qy) && Number(ref.y1) <= Number(maxPt.qy) + 0.04) {
    return issue("helperLineBelowMax", "הישר y=" + num(claim.y) + " צריך להיות מעל נקודת המקסימום, לא באותו גובה ולא מתחתיה.");
  }
  return null;
}

function checkRange(task, text) {
  var raw = String(text || "").replace(/\s+/g, "").replace(/[−–—]/g, "-").replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/∞/g, "inf");
  var bound = String(task.max);
  var closed = task.include !== false;
  var op = closed ? "<=" : "<";
  var end = closed ? "]" : ")";
  if (/^x/.test(raw)) return issue("rangeConfusedWithDomain", "זהו תחום הערכים של הפונקציה, לא תחום ה־x.");
  var forms = [
    "f(x)" + op + bound,
    "y" + op + bound,
    "(-inf," + bound + end,
  ];
  if (forms.indexOf(raw) >= 0) {
    return { ok: true, show: "f(x)≤" + num(task.max), message: "הערך הגדול ביותר הוא " + num(task.max) + ". תחום הערכים הוא כל מספר שאינו גדול ממנו." };
  }
  return issue("wrongRange", "רשמו את תחום הערכים, למשל f(x)≤" + num(task.max) + ".");
}

function checkTrend(task, text) {
  var raw = String(text || "").trim();
  var flat = raw.replace(/[.\s_"׳״`]/g, "");
  if (/^\d+(?:\.\d+)?$/.test(flat) || /^f\(/.test(flat)) {
    return issue("inventedExtremumY", "שיעור ה־y של נקודת הקיצון אינו נתון. אי אפשר לקבוע ממנו מספר יחיד.");
  }
  if (/סימטר/.test(flat) || /^(שווה|נשאר|קבוע|אותוערך|לאמשתנה)$/.test(flat)) {
    return issue("assumedSymmetry", "ערכים שווים בקצוות אינם אומרים שהגרף סימטרי או שהגובה נשאר קבוע. בדקו את הכיוון בין x=" + num(task.from) + " ל־x=" + num(task.to) + ".");
  }
  if (/^(קטן|קטנה|קטנים|יורד|יורדת|יורדים|פוחת|פוחתת|פוחתים|ירידה)$/.test(flat)) {
    return { ok: true, show: "יורד", message: "בין x=" + num(task.from) + " ל־x=" + num(task.to) + " הפונקציה יורדת, ולכן ככל ש־x גדל הערך של y קטן." };
  }
  if (/עול|גדל|גבוה|עלייה|גדול/.test(flat)) {
    return issue("xIncreaseMeansYIncrease", "העובדה ש־x גדל אינה אומרת שגם y גדל. בדקו את כיוון הגרף בתחום הנתון.");
  }
  return issue("wrongMonotonicDirection", "בתחום " + num(task.from) + "<x<" + num(task.to) + " הפונקציה יורדת. ככל ש־x גדל, y קטן.");
}

function closedDomainInterval(domain) {
  return {
    from: domain.min,
    to: domain.max,
    fromIncluded: domain.includeMin !== false,
    toIncluded: domain.includeMax !== false,
    empty: false,
    all: false,
  };
}

function signListIssue(M, ex, list, side) {
  var domain = domainOf(ex);
  if (!list) return issue("unparsedInterval", "רשמו תחום, למשל " + domainText(domain) + ", או אין.");
  if (domain.all) return null;
  var all = list.some(function (interval) { return interval.all || (interval.from === "-inf" && interval.to === "inf"); });
  if (all) return issue("usedAllRealNumbersInsteadOfDomain", "הפונקציה אינה מוגדרת לכל x. תחום ההגדרה הוא " + domainText(domain) + ".");
  var unbounded = list.some(function (interval) { return interval.from === "-inf" || interval.to === "inf"; });
  if (unbounded) return issue("ignoredDomain", "התשובה צריכה להישאר בתוך תחום ההגדרה " + domainText(domain) + ".");
  if (side === "pos") {
    var opened = list.some(function (interval) {
      return near(interval.from, domain.min) && near(interval.to, domain.max) && (!interval.fromIncluded || !interval.toIncluded);
    });
    if (opened) {
      return issue("excludedDomainEndpointFromSignInterval", "הקצוות שייכים לתחום החיוביות, כי ערך הפונקציה שם חיובי. הרשום הוא " + domainText(domain) + ", לא תחום פתוח.");
    }
  }
  return null;
}

function checkSignDomains(engine, ex, body) {
  var M = engine.DoctematicaFnModel;
  var domain = domainOf(ex);
  var expected = closedDomainInterval(domain);
  function read(text) {
    var raw = String(text == null ? "" : text).trim();
    if (!raw) return { missing: true, list: null };
    var list = M.parseRegionList(raw);
    if (list == null) return { bad: true, list: null };
    return { list: list };
  }
  var pos = read(body && body.domains && body.domains.pos);
  var neg = read(body && body.domains && body.domains.neg);
  if (pos.missing || neg.missing) return issue("unparsedInterval", "מלאו את שתי התיבות: תחומי חיוביות ותחומי שליליות.");
  if (pos.bad || neg.bad) return issue("unparsedInterval", "רשמו תחום, למשל " + domainText(domain) + ", או אין.");
  var posIssue = signListIssue(M, ex, pos.list, "pos");
  if (posIssue) return posIssue;
  var negIssue = signListIssue(M, ex, neg.list, "neg");
  if (negIssue) return negIssue;
  var posOk = pos.list.length === 1 && M.sameInterval(pos.list[0], expected);
  var negOk = !neg.list.length;
  if (!posOk && neg.list.length === 1 && M.sameInterval(neg.list[0], expected) && !pos.list.length) {
    return issue("positiveNegativeReversed", "הפונקציה חיובית בתחום " + domainText(domain) + ", ולא שלילית.");
  }
  if (!negOk && posOk) return issue("wrongIntervalBoundary", "אין תחום שבו הפונקציה שלילית.");
  if (!posOk) return issue("wrongIntervalBoundary", "הפונקציה חיובית בכל תחום ההגדרה " + domainText(domain) + ".");
  var show = "חיובי: " + M.formatIntervalSet([expected]) + ", שלילי: אין";
  return { ok: true, show: show, message: "בכל תחום ההגדרה הגרף נשאר מעל ציר ה־x, כולל הקצוות. מחוץ לתחום הפונקציה אינה מוגדרת." };
}

function checkExtremumType(task, text) {
  var got = extremaEngine.normalizeExtremumType(text);
  if (got === "UNKNOWN") return issue("unparsedExtremum", "רשמו מינימום או מקסימום.");
  var want = task.answer === "max" ? "MAX" : "MIN";
  if (got !== want) {
    var before = want === "MIN" ? "יורדת" : "עולה";
    var after = want === "MIN" ? "עולה" : "יורדת";
    return issue("wrongExtremumType", "לפני x=" + num(task.point.x) + " הפונקציה " + before + ", ואחריו היא " + after + ".");
  }
  var show = want === "MIN" ? "מינימום" : "מקסימום";
  var why = want === "MIN" ? "ירידה ואחר כך עלייה: נקודת מינימום." : "עלייה ואחר כך ירידה: נקודת מקסימום.";
  return { ok: true, show: show, message: why };
}

function checkFeasible(ex, task, text, sketch) {
  var yes = yesWord(text);
  if (yes == null) return issue("treatedPossibleAsNecessary", "ענו כן או לא.");
  var claim = task.claim || {};
  if (claim.type === "horizontal") {
    if (yes === true) {
      if (/ציר ה.?x|ערך x|שיעור x|בתחום|כי\s*x|x\s*=/.test(String(text || ""))) {
        return issue("horizontalLineXYConfusion", "y=" + num(claim.y) + " הוא גובה, לא ערך על ציר ה־x. נקודת המקסימום היא בגובה " + num(claim.maxY) + ".");
      }
      return issue("horizontalMissesGraph", "נקודת המקסימום היא בגובה " + num(claim.maxY) + ". הישר y=" + num(claim.y) + " נמצא מעליה ואינו חותך את הגרף.");
    }
    var line = helperLineIssue(sketch, claim);
    if (line) return line;
    return { ok: true, show: "לא", message: "הערך הגדול ביותר הוא " + num(claim.maxY) + ", ולכן y=" + num(claim.y) + " אינו חותך את הגרף." };
  }
  if (claim.type === "belowMin") {
    if (yes === true) {
      if (/5/.test(String(text || ""))) {
        return issue("minimumXUsedInsteadOfMinimumY", "המינימום הוא ערך ה־y בנקודה, לא שיעור ה־x. כאן הערך הקטן ביותר הוא " + num(claim.minY) + ".");
      }
      return issue("belowMinimum", "הערך הקטן ביותר של הפונקציה הוא " + num(claim.minY) + ", ולכן אין x שעבורו f(x)<0.");
    }
    return { ok: true, show: "לא", message: "המינימום הוא בגובה " + num(claim.minY) + ", ולכן f(x)≥" + num(claim.minY) + "." };
  }
  var possible = claimPossible(ex, claim);
  if (yes === true && possible && claim.type === "point") return { ok: true, show: "כן", message: pointReason(ex, claim) };
  if (yes === true && possible && claim.type === "zeros") {
    return { ok: true, show: "כן", message: "אפשר לבנות גרף רציף עם " + num(claim.count) + " חיתוכים. " + zeroForceMessage(ex) };
  }
  if (yes === false && !possible && claim.type === "zeros") {
    return { ok: true, show: "לא", message: "חיתוך במספר הזה אינו אפשרי. " + zeroForceMessage(ex) };
  }
  if (claim.type === "relation" || claim.type === "signBound") {
    return signAnswerIssue(ex, task, text, yes);
  }
  if (yes === true && !possible && claim.type === "zeros" && bypassReason(text)) {
    return issue("bypassAxis", "אי אפשר פשוט לעקוף את ציר ה־x. גרף רציף שעובר מערך שלילי לערך חיובי חייב לפגוש את הציר.");
  }
  if (yes === false && !possible && claim.type === "point") {
    return { ok: true, show: "לא", message: "אי אפשר לקיים גם את הנתונים וגם את " + fText(claim.x, claim.y) + "." };
  }
  if (yes === false && possible && claim.type === "point" && sketchShowsPoint(sketch, claim.x, claim.y)) {
    return issue("contradictsPreviousAnswer", "השרטוט עובר דרך הנקודה " + pointText(claim.x, claim.y) + ", ולכן " + fText(claim.x, claim.y) + " ייתכן.");
  }
  if (yes === false && possible && claim.type === "point") {
    return issue("assumedStraightLineBetweenPoints", "אין להסיק שהגרף הוא קו ישר בין הנקודות הנתונות. " + fText(claim.x, claim.y) + " ייתכן.");
  }
  if (yes === false && possible) {
    return issue("treatedPossibleAsNecessary", "המצב הזה אפשרי. אין להפוך אפשרות לאיסור.");
  }
  if (claim.type === "zeros") return issue("missingRequiredZero", zeroForceMessage(ex));
  var blocked = constraints(ex, "CONSTANT_INTERVAL").some(function (item) {
    return Number(claim.x) >= Number(item.fromX) - 1e-9 && Number(claim.x) <= Number(item.toX) + 1e-9;
  });
  if (blocked) return issue("wrongConstantValue", "בתחום הקבוע אי אפשר לבחור ערך אחר.");
  return issue("treatedPossibleAsNecessary", "התשובה אינה מתאימה לנתונים.");
}

function checkAtLeast(ex, text) {
  var count = parseCount(text);
  var min = minZeros(ex);
  if (count == null) return issue("treatedMinimumAsExact", "רשמו כמה נקודות אפס יש לפחות.");
  if (count === min) {
    return {
      ok: true,
      show: "לפחות " + num(min),
      message: zeroForceMessage(ex) + " ייתכנו נקודות אפס נוספות.",
    };
  }
  if (count > min) {
    return issue("treatedMinimumAsExact", "ייתכנו יותר נקודות אפס, אבל השאלה מבקשת כמה יש לפחות. מהנתונים מוכרחות " + num(min) + ".");
  }
  return issue("missingRequiredZero", zeroForceMessage(ex));
}

function parseZeroXs(text) {
  var raw = String(text || "").replace(/−/g, "-").replace(/–/g, "-").replace(/—/g, "-");
  if (/[<>≤≥]/.test(raw)) return null;
  var xs = [];
  var eq = /x\s*=\s*(-?\d+(?:\.\d+)?)/gi;
  var match;
  while ((match = eq.exec(raw))) xs.push(Number(match[1]));
  if (!xs.length) {
    var nums = raw.match(/-?\d+(?:\.\d+)?/g);
    if (!nums) return null;
    xs = nums.map(function (item) { return Number(item); });
  }
  return xs;
}

function parseZeroPoints(text) {
  var raw = String(text || "").replace(/−/g, "-").replace(/–/g, "-").replace(/—/g, "-");
  if (/[<>≤≥]/.test(raw)) return { kind: "reject" };
  var points = [];
  var pair = /\(\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*\)/g;
  var match;
  while ((match = pair.exec(raw))) points.push({ x: Number(match[1]), y: Number(match[2]) });
  if (points.length) return { kind: "points", points: points };
  if (/x\s*=|[0-9]/.test(raw)) return { kind: "bare" };
  return { kind: "empty" };
}

function formatZeroPoints(xs) {
  return (xs || []).map(function (x) { return pointText(x, 0); }).join(", ");
}

function sameZeroSet(got, expected) {
  if (!got || got.length !== expected.length) return false;
  return expected.every(function (x) {
    return got.some(function (value) { return near(value, x); });
  });
}

function formatZeros(xs) {
  return formatZeroPoints(xs);
}

function seedSketchBoard(ex, progress) {
  var loc = locate(ex, progress);
  if (!loc.task || loc.task.kind !== "freeSketch") return null;
  var anchors = layoutAnchors(requiredPoints(withPart(ex, loc.part)));
  if (!anchors.length) return null;
  return { points: anchors, strokes: [], line: null };
}

function openingView(engine, ex) {
  return viewFor(ex, freshProgress(), { points: [], strokes: [] });
}

function handle(engine, ex, body) {
  body = body || {};
  var progress = progressOf(body.progress);
  var sketch = body.sketch || { points: [], strokes: [] };
  var intent = String(body.intent || "check");
  var loc = locate(ex, progress);

  if (intent === "hint") {
    var hints = hintList(ex, progress, sketch);
    return { ok: true, hint: hints[0] || "", hints: hints, view: viewFor(ex, progress, sketch) };
  }

  if (intent === "solution") {
    var solved = solutionSteps(ex);
    return { ok: true, steps: solved.steps, notes: solved.notes, examples: solved.examples || [], answer: solved.steps[solved.steps.length - 1] || "" };
  }

  if (intent === "sketch-point") {
    var judged = judgePoint(withPart(ex, loc.part), sketch, body.point || {});
    if (!judged.ok) return { ok: false, message: judged.message, errorId: judged.id };
    return { ok: true, message: judged.role === "given" ? "הנקודה מהנתונים מסומנת." : "הנקודה נוספה לסקיצה.", role: judged.role };
  }

  if (intent === "one-step") {
    if (!loc.task) return { ok: false, message: "אין צעד נוסף." };
    if (loc.task.kind === "freeSketch") {
      var scope = withPart(ex, loc.part);
      var requiredNow = requiredPoints(scope);
      var missingNow = missingPoint(requiredNow, (sketch && sketch.points) || []);
      if (missingNow) {
        var marked = addGuidePoint(scope, sketch, missingNow);
        var hadPoint = ((sketch && sketch.points) || []).some(function (pt) {
          return requiredNow.some(function (need) { return samePoint(need, pt); });
        });
        progress.coach = 0;
        progress.coachKey = "";
        var markShow = "סמנו את הנקודה " + pointText(missingNow.x, missingNow.y) + ".";
        var markWhy = "מהנתון " + fText(missingNow.x, missingNow.y) + " ידועה נקודה אחת על הגרף.";
        if (!hadPoint && !domainOf(scope).all) markWhy = "תחום ההגדרה הוא " + domainText(domainOf(scope)) + ". " + markWhy;
        return payload(ex, progress, marked, markShow, markWhy, false, marked);
      }
      var freeMissing = freeExtrema(scope).filter(function (item) {
        return !((sketch && sketch.points) || []).some(function (pt) { return near(pt.x, item.x); });
      })[0];
      if (freeMissing) {
        var withExtremum = addFreeExtremum(scope, sketch, freeMissing);
        var kindName = freeMissing.kind === "max" ? "מקסימום" : "מינימום";
        var heightWhy = freeMissing.kind === "min" && positiveOnDomain(scope)
          ? "שיעור ה־y אינו נתון. נקודת המינימום חייבת להיות חיובית ונמוכה מהקצוות. הגובה שסומן הוא דוגמה אחת, לא הגובה היחיד."
          : "שיעור ה־y אינו נתון. נקודת ה" + kindName + " חייבת להיות " + (freeMissing.kind === "max" ? "גבוהה מערכי הקצה" : "נמוכה מהקצוות") + ". הגובה שסומן הוא דוגמה אחת, לא הגובה היחיד.";
        return payload(ex, progress, withExtremum, "מקמו נקודת " + kindName + " ב־x=" + num(freeMissing.x) + ".", heightWhy, false, withExtremum);
      }
      if (constraints(scope, "ZERO_COUNT").length) {
        var signDrawn = samplesOf(sketch).length ? sketch : signGuide(scope, sketch);
        var signProblem = signDrawn ? validateSketch(scope, signDrawn, progress) : issue("missingZero", "עדיין חסר גרף שעומד במספר נקודות האפס.");
        if (signProblem) return { ok: false, message: signProblem.message, errorId: signProblem.id };
        progress.sketchValidated = true;
        progress.coach = 0;
        progress.coachKey = "";
        var signedDone = advance(ex, progress);
        return payload(ex, progress, signDrawn, "סקיצה אפשרית", signWhy(scope), signedDone, signDrawn);
      }
      if (hasRegionSketch(scope)) {
        var regionDrawn = samplesOf(sketch).length ? sketch : regionGuide(scope);
        var regionNow = regionDrawn ? validateSketch(scope, regionDrawn, progress) : issue("missingBoundaryZero", "עדיין חסרות נקודות האפס על השרטוט.");
        if (regionNow) return { ok: false, message: regionNow.message, errorId: regionNow.id };
        progress.sketchValidated = true;
        var regionDone = advance(ex, progress);
        return payload(ex, progress, regionDrawn, "סקיצה אפשרית", regionWhy(scope), regionDone, regionDrawn);
      }
      if (constraints(scope, "EXTREMUM").length) {
        var eventDrawn = samplesOf(sketch).length ? sketch : eventGuide(scope, sketch);
        var eventNow = eventDrawn ? validateSketch(scope, eventDrawn, progress) : issue("missingGivenPoint", "עדיין חסר גרף שעובר דרך הנקודות ושומר על כיווני העלייה והירידה.");
        if (eventNow) return { ok: false, message: eventNow.message, errorId: eventNow.id };
        progress.sketchValidated = true;
        progress.coach = 0;
        progress.coachKey = "";
        var eventDone = advance(ex, progress);
        var eventWhy = freeExtrema(scope).length
          ? "זו דוגמה אחת, לא הסקיצה היחידה. שיעור ה־y של הקיצון אינו נקבע מהנתונים, והגרף נשאר בתוך תחום ההגדרה."
          : "זו דוגמה אחת. כל גרף שמקיים את הנקודות ואת כיווני העלייה והירידה מתקבל.";
        return payload(ex, progress, eventDrawn, "סקיצה אפשרית", eventWhy, eventDone, eventDrawn);
      }
      var drawn = samplesOf(sketch).length && !validateSketch(scope, sketch, progress) ? sketch : guideDraw(scope, sketch);
      if (validateSketch(scope, drawn, progress)) {
        return payload(ex, progress, sketch, diagnose(scope, sketch).lines[0], diagnose(scope, sketch).lines[0], false);
      }
      progress.sketchValidated = true;
      progress.coach = 0;
      progress.coachKey = "";
      var finishedSketch = advance(ex, progress);
      var constantNow = constraints(ex, "CONSTANT_INTERVAL")[0];
      var drawWhy = "מעבירים גרף רציף דרך הנקודות. זו דוגמה אחת, לא הצורה היחידה.";
      if (constantNow) drawWhy = "מעבירים גרף רציף דרך הנקודות. בתחום " + intervalText(constantNow) + " הגרף אופקי. זו דוגמה אחת, לא הצורה היחידה.";
      return payload(ex, progress, drawn, "סקיצה אפשרית", drawWhy, finishedSketch, drawn);
    }
    if (loc.task.kind === "zeros") {
      if ((progress.coach || 0) < 1) {
        progress.coach = 1;
        return payload(ex, progress, sketch, "בדקו מה קורה בגבול שבין שני התחומים.", "נקודת אפס נמצאת במעבר בין תחום שלילי לתחום חיובי.", false);
      }
      var listed = formatZeroPoints(loc.task.xs || []);
      var doneZeros = advance(ex, progress);
      return payload(ex, progress, sketch, listed, "נקודת האפס נמצאת על ציר ה־x, בגבול שבין התחומים.", doneZeros, seedSketchBoard(ex, progress));
    }
    if (loc.task.kind === "feasible" && loc.task.claim && (loc.task.claim.type === "signBound" || loc.task.askMode)) {
      if ((progress.coach || 0) < 1) {
        progress.coach = 1;
        return payload(ex, progress, sketch, locatePrompt(loc.task), "קודם מאתרים את התחום, ורק אחר כך מסיקים אם היחס אפשרי או הכרחי.", false);
      }
      var verdictWord = wantYes(loc.task, claimVerdict(ex, loc.task.claim)) ? "כן" : "לא";
      var signChecked = checkFeasible(ex, loc.task, verdictWord, sketch);
      if (!signChecked.ok) return { ok: false, message: signChecked.message, errorId: signChecked.id };
      progress.answers[loc.task.id] = { yes: verdictWord === "כן", claim: loc.task.claim };
      var doneSign = advance(ex, progress);
      return payload(ex, progress, sketch, signChecked.show, signChecked.message, doneSign);
    }
    if (loc.task.kind === "feasible" && loc.task.reason === "signChange") {
      var savedReason = progress.answers[loc.task.id];
      if (!savedReason || !savedReason.needReason) {
        progress.answers[loc.task.id] = { yes: false, claim: loc.task.claim, needReason: true };
        return payload(ex, progress, sketch, "לא", "בדקו את הסימנים של שני הערכים הנתונים, ואז נמקו.", false);
      }
      progress.answers[loc.task.id].needReason = false;
      progress.answers[loc.task.id].reason = true;
      var doneReasonStep = advance(ex, progress);
      return payload(ex, progress, sketch, "גרף רציף שעובר מערך שלילי לערך חיובי חייב לפגוש את ציר ה־x.", zeroForceMessage(ex), doneReasonStep);
    }
    if (loc.task.kind === "trend") {
      if ((progress.coach || 0) < 1) {
        progress.coach = 1;
        return payload(ex, progress, sketch, "הסתכלו על הגרף מ־x=" + num(loc.task.from) + " לכיוון x=" + num(loc.task.to) + ".", "כאשר מתקדמים ימינה, בדקו מה קורה לערכי y.", false);
      }
      var trendStep = checkTrend(loc.task, "יורד");
      progress.answers[loc.task.id] = { direction: "dec" };
      var doneTrendStep = advance(ex, progress);
      return payload(ex, progress, sketch, trendStep.show, trendStep.message, doneTrendStep);
    }
    if (loc.task.kind === "signDomains") {
      if ((progress.coach || 0) < 1) {
        progress.coach = 1;
        return payload(ex, progress, sketch, "בדקו את הסימן בקצוות, וגם בין הקצוות.", "הפונקציה מוגדרת רק בתחום " + domainText(domainOf(withPart(ex, loc.part))) + ".", false);
      }
      var signStep = checkSignDomains(engine, withPart(ex, loc.part), { domains: { pos: domainText(domainOf(withPart(ex, loc.part))), neg: "אין" } });
      if (!signStep.ok) return { ok: false, message: signStep.message, errorId: signStep.id };
      progress.signSides = { pos: domainText(domainOf(withPart(ex, loc.part))), neg: "אין" };
      progress.answers[loc.task.id] = { sign: true };
      var doneSignStep = advance(ex, progress);
      return payload(ex, progress, sketch, signStep.show, signStep.message, doneSignStep);
    }
    if (loc.task.kind === "extremumType") {
      if ((progress.coach || 0) < 1) {
        progress.coach = 1;
        var typeHint = (loc.task.hints && loc.task.hints[0]) || ("בדקו מה קורה לפונקציה לפני x=" + num(loc.task.point.x) + " ומה קורה אחריו.");
        return payload(ex, progress, sketch, typeHint, "הסוג נקבע לפי שינוי הכיוון.", false);
      }
      var typedKind = checkExtremumType(loc.task, loc.task.answer === "max" ? "מקסימום" : "מינימום");
      progress.answers[loc.task.id] = { type: loc.task.answer };
      var doneType = advance(ex, progress);
      return payload(ex, progress, sketch, typedKind.show, typedKind.message, doneType);
    }
    if (loc.task.kind === "range") {
      if ((progress.coach || 0) < 1) {
        progress.coach = 1;
        return payload(ex, progress, sketch, "מהו ערך ה־y הגבוה ביותר שהפונקציה מקבלת?", "זהו תחום הערכים, לא תחום ה־x.", false);
      }
      var ranged = checkRange(loc.task, "f(x)<=" + num(loc.task.max));
      progress.answers[loc.task.id] = { max: loc.task.max };
      var doneRange = advance(ex, progress);
      return payload(ex, progress, sketch, ranged.show, ranged.message, doneRange);
    }
    if (loc.task.kind === "feasible" && loc.task.claim && (loc.task.claim.type === "horizontal" || loc.task.claim.type === "belowMin")) {
      if ((progress.coach || 0) < 1) {
        progress.coach = 1;
        var firstAsk = loc.task.claim.type === "horizontal"
          ? "מהו ערך ה־y בנקודת המקסימום?"
          : "מהו הערך הקטן ביותר שהפונקציה יכולה לקבל?";
        return payload(ex, progress, sketch, firstAsk, "קודם את הערך, ואחר כך את המסקנה.", false);
      }
      var heightWord = checkFeasible(ex, loc.task, "לא", sketch);
      if (!heightWord.ok) return { ok: false, message: heightWord.message, errorId: heightWord.id };
      progress.answers[loc.task.id] = { yes: false, claim: loc.task.claim };
      var doneHeight = advance(ex, progress);
      return payload(ex, progress, sketch, heightWord.show, heightWord.message, doneHeight);
    }
    if (loc.task.kind === "feasible") {
      var possible = claimPossible(ex, loc.task.claim);
      var word = possible ? "כן" : "לא";
      var checked = checkFeasible(ex, loc.task, word, sketch);
      if (!checked.ok) return { ok: false, message: checked.message, errorId: checked.id };
      progress.answers[loc.task.id] = { yes: possible, claim: loc.task.claim };
      var doneFeasible = advance(ex, progress);
      return payload(ex, progress, sketch, checked.show, checked.message, doneFeasible, seedSketchBoard(ex, progress));
    }
    if (loc.task.kind === "atLeastZeros") {
      var least = checkAtLeast(ex, String(minZeros(ex)));
      var doneLeast = advance(ex, progress);
      return payload(ex, progress, sketch, least.show, least.message, doneLeast);
    }
  }

  if (intent === "sketch" || (intent === "check" && sketch && loc.task && loc.task.kind === "freeSketch")) {
    var checkScope = withPart(ex, loc.part);
    var problem = validateSketch(checkScope, sketch, progress);
    if (!samplesOf(sketch).length && problem) return { ok: false, message: problem.message, errorId: problem.id };
    if (!samplesOf(sketch).length) {
      var wait = diagnose(checkScope, sketch);
      return { ok: false, message: wait.lines[0], errorId: wait.id === "draw" ? "curveMissesRequiredPoint" : "missingGivenPoint" };
    }
    if (problem) return { ok: false, message: problem.message, errorId: problem.id };
    if (!loc.task || loc.task.kind !== "freeSketch") {
      return payload(ex, progress, sketch, "", "הסקיצה עומדת בנתונים. היא מדגימה אפשרות אחת, לא את כל האפשרויות.", false);
    }
    progress.sketchValidated = true;
    var doneSketch = advance(ex, progress);
    var sketchMessage = hasRegionSketch(checkScope)
      ? regionWhy(checkScope)
      : (constraints(checkScope, "EXTREMUM").length
        ? (freeExtrema(checkScope).length
          ? "זו דוגמה אחת, לא הסקיצה היחידה. שיעור ה־y של הקיצון אינו נקבע מהנתונים, והגרף נשאר בתוך תחום ההגדרה."
          : "זו דוגמה אחת. כל גרף שמקיים את הנקודות ואת כיווני העלייה והירידה מתקבל.")
        : (constraints(checkScope, "ZERO_COUNT").length ? signWhy(checkScope) : "השרטוט יכול לייצג פונקציה שעומדת בנתונים."));
    return payload(ex, progress, sketch, "סקיצה אפשרית", sketchMessage, doneSketch, seedSketchBoard(ex, progress));
  }

  if (!loc.task) return { ok: false, message: "סיימתם את התרגיל." };

  if (loc.task.kind === "trend") {
    var trendAnswer = checkTrend(loc.task, body.typed);
    if (!trendAnswer.ok) return { ok: false, message: trendAnswer.message, errorId: trendAnswer.id };
    progress.answers[loc.task.id] = { direction: "dec" };
    var doneTrend = advance(ex, progress);
    return payload(ex, progress, sketch, trendAnswer.show, trendAnswer.message, doneTrend);
  }

  if (loc.task.kind === "signDomains") {
    var signAnswer = checkSignDomains(engine, withPart(ex, loc.part), body);
    if (!signAnswer.ok) return { ok: false, message: signAnswer.message, errorId: signAnswer.id };
    progress.signSides = {
      pos: domainText(domainOf(withPart(ex, loc.part))),
      neg: "אין",
    };
    progress.signRows = { pos: [progress.signSides.pos], neg: ["אין"] };
    progress.answers[loc.task.id] = { sign: true };
    var doneSign = advance(ex, progress);
    return payload(ex, progress, sketch, signAnswer.show, signAnswer.message, doneSign);
  }

  if (loc.task.kind === "extremumType") {
    var typeAnswer = checkExtremumType(loc.task, body.typed);
    if (!typeAnswer.ok) return { ok: false, message: typeAnswer.message, errorId: typeAnswer.id };
    progress.answers[loc.task.id] = { type: loc.task.answer };
    var doneTypedKind = advance(ex, progress);
    return payload(ex, progress, sketch, typeAnswer.show, typeAnswer.message, doneTypedKind);
  }

  if (loc.task.kind === "range") {
    var rangeAnswer = checkRange(loc.task, body.typed);
    if (!rangeAnswer.ok) return { ok: false, message: rangeAnswer.message, errorId: rangeAnswer.id };
    progress.answers[loc.task.id] = { max: loc.task.max };
    var doneTypedRange = advance(ex, progress);
    return payload(ex, progress, sketch, rangeAnswer.show, rangeAnswer.message, doneTypedRange);
  }

  if (loc.task.kind === "zeros") {
    var expectedZeros = loc.task.xs || [];
    var parsedZeros = parseZeroPoints(body.typed);
    if (parsedZeros.kind === "bare") {
      return { ok: false, message: "לא מספיק לרשום את שיעור ה־x. נקודת אפס היא זוג סדור על ציר ה־x, עם y=0.", errorId: "zeroNeedsPoint" };
    }
    if (parsedZeros.kind !== "points") {
      return { ok: false, message: "רשמו את נקודת האפס כזוג סדור על ציר ה־x, עם y=0.", errorId: "unparsedZeros" };
    }
    var offAxis = parsedZeros.points.filter(function (pt) { return !near(pt.y, 0); })[0];
    if (offAxis) {
      return { ok: false, message: "נקודת אפס נמצאת על ציר ה־x, ולכן שיעור ה־y הוא 0.", errorId: "zeroNotOnXAxis" };
    }
    var gotZeros = parsedZeros.points.map(function (pt) { return pt.x; });
    var assumed = gotZeros.filter(function (x) {
      return constraints(ex, "SIGN_EXCEPTION").some(function (item) { return near(item.x, x); });
    })[0];
    if (assumed != null) {
      return { ok: false, message: pointText(assumed, 0) + " אינה נקודת אפס ידועה. הנקודה לא נכללה בנתון החיוביות, אבל הפונקציה מוגדרת שם והסימן שלה אינו ידוע.", errorId: "unknownPointAssumedZero" };
    }
    var unexpected = gotZeros.filter(function (x) {
      return !expectedZeros.some(function (want) { return near(want, x); });
    })[0];
    if (unexpected != null) {
      return { ok: false, message: "מספר נקודות האפס, או המיקום שלהן, אינו מתאים למעבר בין התחומים.", errorId: "wrongZeroCount" };
    }
    var already = (progress.answers[loc.task.id] && progress.answers[loc.task.id].xs) || [];
    var savedZeros = already.slice();
    var added = [];
    gotZeros.forEach(function (x) {
      if (savedZeros.some(function (have) { return near(have, x); })) return;
      savedZeros.push(x);
      added.push(x);
    });
    var stillMissing = expectedZeros.filter(function (want) {
      return !savedZeros.some(function (have) { return near(have, want); });
    });
    if (stillMissing.length) {
      if (!added.length) {
        return { ok: false, message: "הנקודה " + formatZeroPoints(gotZeros) + " כבר נרשמה. חסרה עוד נקודת אפס.", errorId: "zeroAlreadyMarked" };
      }
      progress.answers[loc.task.id] = { xs: savedZeros };
      return payload(ex, progress, sketch, formatZeroPoints(added), "הנקודה נכונה. יש עוד נקודת אפס בגבול שבין התחומים.", false);
    }
    var doneZeroList = advance(ex, progress);
    return payload(ex, progress, sketch, formatZeroPoints(expectedZeros), "נקודות האפס נמצאות על ציר ה־x, בגבול שבין התחומים.", doneZeroList, seedSketchBoard(ex, progress));
  }

  if (loc.task.kind === "feasible" && loc.task.reason === "signChange" && progress.answers[loc.task.id] && progress.answers[loc.task.id].needReason) {
    if (bypassReason(body.typed)) {
      return { ok: false, message: "אי אפשר פשוט לעקוף את ציר ה־x. גרף רציף שעובר מערך שלילי לערך חיובי חייב לפגוש את הציר.", errorId: "bypassAxis" };
    }
    if (!signChangeReason(body.typed)) {
      return { ok: false, message: "הנימוק צריך להסביר את שינוי הסימן בין שני הערכים הנתונים.", errorId: "missingSignChangeReason" };
    }
    progress.answers[loc.task.id].needReason = false;
    progress.answers[loc.task.id].reason = true;
    var doneWhy = advance(ex, progress);
    return payload(ex, progress, sketch, "גרף רציף שעובר מערך שלילי לערך חיובי חייב לפגוש את ציר ה־x.", zeroForceMessage(ex), doneWhy);
  }

  if (loc.task.kind === "feasible") {
    var answer = checkFeasible(ex, loc.task, body.typed, sketch);
    if (!answer.ok) return { ok: false, message: answer.message, errorId: answer.id };
    if (loc.task.reason === "signChange" && yesWord(body.typed) === false && !signChangeReason(body.typed)) {
      progress.answers[loc.task.id] = { yes: false, claim: loc.task.claim, needReason: true };
      return payload(ex, progress, sketch, "לא", "נכון. כעת נמקו מדוע לא ייתכן.", false);
    }
    progress.answers[loc.task.id] = { yes: yesWord(body.typed), claim: loc.task.claim, reason: !!(loc.task.reason && signChangeReason(body.typed)) };
    var doneAnswer = advance(ex, progress);
    return payload(ex, progress, sketch, answer.show, answer.message, doneAnswer, seedSketchBoard(ex, progress));
  }

  if (loc.task.kind === "atLeastZeros") {
    var countAnswer = checkAtLeast(ex, body.typed);
    if (!countAnswer.ok) return { ok: false, message: countAnswer.message, errorId: countAnswer.id };
    progress.answers[loc.task.id] = { count: parseCount(body.typed) };
    var doneCount = advance(ex, progress);
    return payload(ex, progress, sketch, countAnswer.show, countAnswer.message, doneCount);
  }

  return { ok: false, message: "שרטטו סקיצה אפשרית לפי הנתונים.", errorId: "missingGivenPoint" };
}

module.exports = {
  handle: handle,
  openingView: openingView,
  requiredPoints: requiredPoints,
  minZeros: minZeros,
  claimPossible: claimPossible,
};
