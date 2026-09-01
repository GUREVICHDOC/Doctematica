(function (global) {
  function install(dep) {
    var fmtNum = dep.fmtNum;
    var near0 = dep.near0;
    var nearNum = dep.nearNum;
    var formatPointPair = dep.formatPointPair;
    var getPoint = dep.getPoint;
    var pointMap = dep.pointMap;
    var cloneMaps = dep.cloneMaps;
    var remainingRequired = dep.remainingRequired;
    var currentPartText = dep.currentPartText;
    var currentFocusTask = dep.currentFocusTask;
    var taskByIdMap = dep.taskByIdMap;
    var parseLineSpec = dep.parseLineSpec;
    var parseConstAxisEq = dep.parseConstAxisEq;
    var parsePointAxisTag = dep.parsePointAxisTag;
    var parseSlopeFormula = dep.parseSlopeFormula;
    var classifySlopeFormula = dep.classifySlopeFormula;
    var prettySlopeFormula = dep.prettySlopeFormula;
    var slopeTagLetters = dep.slopeTagLetters;
    var segmentLineFromEnds = dep.segmentLineFromEnds;
    var parseSlopeInterceptText = dep.parseSlopeInterceptText;
    var lineEqSysEquivalent = dep.lineEqSysEquivalent;
    var lineEqPointSlope = dep.lineEqPointSlope;
    var prettyLineEq = dep.prettyLineEq;
    var substYRhs = dep.substYRhs;
    var yEqGivesCoord = dep.yEqGivesCoord;
    var eqNormEqual = dep.eqNormEqual;
    var linearEqEquivalent = dep.linearEqEquivalent;
    var checkPlugYStep = dep.checkPlugYStep;
    var isSolvedYText = dep.isSolvedYText;
    var evalMaybeExpr = dep.evalMaybeExpr;
    var lastEqStage = dep.lastEqStage;
    var evalStepExpr = dep.evalStepExpr;
    var parseNumberToken = dep.parseNumberToken;
    var parseParenNumber = dep.parseParenNumber;
    var parseSlopeDiffExpr = dep.parseSlopeDiffExpr;
    var rewriteMixedNum = dep.rewriteMixedNum;
    var splitAtDepthZero = dep.splitAtDepthZero;
    var stripOuterParensBalanced = dep.stripOuterParensBalanced;
    var isRequiredTask = dep.isRequiredTask;
    var normGeoTag = dep.normGeoTag;
    var taskStepLabel = dep.taskStepLabel;
    var taskWorkStarted = dep.taskWorkStarted;

  function openFindMidpointTask(pack, progress) {
    var pending = (pack.tasks || []).filter(function (t) {
      return t.kind === "midpoint" && !t.mid && !(progress.done && progress.done[t.id]);
    });
    return partPendingMidpoints(pending, pack, progress)[0] || null;
  }

  function midpointSegmentLetters(task) {
    var a = String((task && task.from) || "").toUpperCase();
    var b = String((task && task.to) || "").toUpperCase();
    if (!a || !b) return "";
    return a + b;
  }

  function lettersMatchMidSegment(letters, task) {
    var ab = midpointSegmentLetters(task);
    if (!letters || !ab || ab.length < 2) return false;
    return letters === ab || letters === ab.charAt(1) + ab.charAt(0);
  }

  function typedMatchesAbLine(typed, spec) {
    if (!spec || spec.vertical != null) return false;
    var raw = String(typed || "");
    var got = parseSlopeInterceptText(typed);
    if (got && nearNum(got.m, spec.m) && nearNum(got.b, spec.b)) return true;
    var fake = { m: spec.m, b: spec.b, x: spec.a.x, y: spec.a.y, mn: null, md: 1 };
    if (lineEqSysEquivalent(raw, lineEqPointSlope(fake))) return true;
    var fakeB = { m: spec.m, b: spec.b, x: spec.bpt.x, y: spec.bpt.y, mn: null, md: 1 };
    if (lineEqSysEquivalent(raw, lineEqPointSlope(fakeB))) return true;
    return false;
  }

  function typedLooksLikeFindMidpoint(typed, pack, progress) {
    var t = openFindMidpointTask(pack, progress);
    if (!t) return false;
    var cf = (progress.coords && progress.coords[t.id]) || {};
    var ends = midpointEnds(pack, progress, t);
    var frac = parseMidpointFrac(typed);
    if (frac) {
      if (!ends.a || !ends.b) return true;
      if (!frac.atomic && (midAxisFromFormula(frac, ends.a, ends.b) || midCoordsMatch(frac, ends.a.y, ends.b.y) || midCoordsMatch(frac, ends.a.x, ends.b.x))) {
        return true;
      }
      if (frac.atomic) return true;
    }
    var letters = slopeTagLetters(typed);
    if (letters && lettersMatchMidSegment(letters, t)) return true;
    if (ends.a && ends.b) {
      var sf = parseSlopeFormula(typed);
      if (sf && classifySlopeFormula(sf, ends.a, ends.b).kind === "ok") return true;
      var ab = segmentLineFromEnds(ends.a, ends.b);
      if (ab && typedMatchesAbLine(typed, ab)) return true;
    }
    var n = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (/^y=/i.test(n) && !cf.y && !/[xX]/.test(n.replace(/^y=/i, ""))) return true;
    if (/^x=/i.test(n) && !cf.x && !/[yY]/.test(n.replace(/^x=/i, ""))) return true;
    return false;
  }

  function midpointPointName(task) {
    return String((task && (task.point || task.label || "M")) || "M").toUpperCase();
  }

  function midpointEnds(pack, progress, task) {
    if (task && task._fromPt && task._toPt) return { a: task._fromPt, b: task._toPt };
    var part = currentPartText(pack, progress);
    var local =
      part && part.points && part.points.length ? pointMap(part.points) : (pack && pack.map) || {};
    var a = getPoint(local, task && task.from) || getPoint(pack && pack.map, task && task.from);
    var b = getPoint(local, task && task.to) || getPoint(pack && pack.map, task && task.to);
    return { a: a, b: b };
  }

  function fmtMidTerm(n) {
    if (n < 0) return "(" + fmtNum(n) + ")";
    return fmtNum(n);
  }

  function midpointAxisLhs(axis) {
    return String(axis || "x").toLowerCase() === "y" ? "y" : "x";
  }

  function midpointPlugText(axis, a, b) {
    var u = String(axis || "x").toLowerCase() === "y" ? a.y : a.x;
    var v = String(axis || "x").toLowerCase() === "y" ? b.y : b.x;
    return midpointAxisLhs(axis) + " = (" + fmtNum(u) + " + " + fmtMidTerm(v) + ")/2";
  }

  function midpointSumText(axis, a, b) {
    var u = String(axis || "x").toLowerCase() === "y" ? a.y : a.x;
    var v = String(axis || "x").toLowerCase() === "y" ? b.y : b.x;
    return midpointAxisLhs(axis) + " = " + fmtNum(u + v) + "/2";
  }

  function midpointValText(axis, val) {
    return midpointAxisLhs(axis) + " = " + fmtNum(val);
  }

  function midpointPairText(task) {
    return midpointPointName(task) + formatPointPair(task.answerX, task.answerY);
  }

  function midpointWant(axis, task) {
    return String(axis || "x").toLowerCase() === "y" ? task.answerY : task.answerX;
  }

  function midpointOnAxis(task) {
    return String((task && task.onAxis) || "").toLowerCase();
  }

  function midpointOtherAxis(task) {
    return String((task && task.otherAxis) || "").toLowerCase();
  }

  function midpointOnLineSpec(task) {
    return task && task.onLine ? parseLineSpec(task.onLine) : null;
  }

  function midpointLineVertical(task) {
    var L = midpointOnLineSpec(task);
    return L && L.vertical != null && isFinite(L.vertical) ? L.vertical : null;
  }

  function midpointLineHorizontal(task) {
    var L = midpointOnLineSpec(task);
    if (!L || L.vertical != null || L.m == null || !near0(L.m) || L.b == null || !isFinite(L.b)) return null;
    return L.b;
  }

  function midpointLineIdentity(task) {
    var L = midpointOnLineSpec(task);
    return !!(L && L.vertical == null && nearNum(L.m, 1) && near0(L.b));
  }

  function midpointLastExprAxis(task, expr) {
    var got = parseConstAxisEq(expr);
    if (!got || !task) return "";
    var hy = midpointLineHorizontal(task);
    var vx = midpointLineVertical(task);
    if (got.axis === "y" && hy != null && nearNum(got.value, hy)) return "y";
    if (got.axis === "x" && vx != null && nearNum(got.value, vx)) return "x";
    if (got.axis === "x" && midpointOnAxis(task) === "y" && nearNum(got.value, 0)) return "x";
    if (got.axis === "y" && midpointOnAxis(task) === "x" && nearNum(got.value, 0)) return "y";
    return "";
  }

  function midpointCoordFlag(progress, task, axis) {
    if (!task) return false;
    var cf = (progress && progress.coords && progress.coords[task.id]) || {};
    if (cf[axis]) return true;
    return midpointLastExprAxis(task, (progress && progress.lastExpr && progress.lastExpr[task.id]) || "") === axis;
  }

  function settleMidpointOnLineCoords(pack, progress) {
    if (!pack || !progress) return;
    if (!progress.coords) progress.coords = {};
    (pack.tasks || []).forEach(function (t) {
      if (!t || t.kind !== "midpoint") return;
      var ax = midpointLastExprAxis(t, (progress.lastExpr && progress.lastExpr[t.id]) || "");
      if (!ax) return;
      if (!progress.coords[t.id]) progress.coords[t.id] = { x: false, y: false };
      progress.coords[t.id][ax] = true;
    });
  }

  function lineMidPairTasks(pack, progress) {
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    var map = taskByIdMap(pack);
    var ident = null;
    var horiz = null;
    var vert = null;
    var i;
    for (i = 0; i < ids.length; i++) {
      var t = map[ids[i]];
      if (!t || t.kind !== "midpoint" || !t.mid) continue;
      if (midpointLineIdentity(t)) ident = t;
      if (midpointLineHorizontal(t) != null) horiz = t;
      if (midpointLineVertical(t) != null) vert = t;
    }
    var yEnd = ident || horiz;
    if (
      yEnd &&
      vert &&
      String(yEnd.mid || "").toUpperCase() === String(vert.mid || "").toUpperCase()
    ) {
      return { yEnd: yEnd, xEnd: vert };
    }
    return null;
  }

  function lineMidPairBlockedByPrior(pack, progress, pair) {
    if (!pack || !pair) return false;
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    var map = taskByIdMap(pack);
    var inPair = {};
    inPair[pair.yEnd.id] = true;
    inPair[pair.xEnd.id] = true;
    var seenPair = false;
    var i;
    for (i = 0; i < ids.length; i++) {
      if (inPair[ids[i]]) seenPair = true;
      if (seenPair) break;
      var u = map[ids[i]];
      if (u && isRequiredTask(u) && !(progress.done && progress.done[u.id])) return true;
    }
    return false;
  }

  function lineMidPairFocus(pack, progress, pair) {
    if (!pair) return null;
    var a = pair.yEnd;
    var b = pair.xEnd;
    var done = (progress && progress.done) || {};
    if (done[a.id] && done[b.id]) return null;
    var ac = {
      x: midpointCoordFlag(progress, a, "x"),
      y: midpointCoordFlag(progress, a, "y"),
    };
    var bc = {
      x: midpointCoordFlag(progress, b, "x"),
      y: midpointCoordFlag(progress, b, "y"),
    };
    var aExpr = (progress.lastExpr && progress.lastExpr[a.id]) || "";
    var bExpr = (progress.lastExpr && progress.lastExpr[b.id]) || "";
    if (aExpr && !done[a.id] && (midLastIsPlug(aExpr) || /[+]/.test(aExpr))) return a;
    if (bExpr && !done[b.id] && (midLastIsPlug(bExpr) || /[+]/.test(bExpr))) return b;
    if (midpointAwaitingPair(a, pack, progress)) return a;
    if (midpointAwaitingPair(b, pack, progress)) return b;
    if (taskWorkStarted(progress, a) && !ac.x && !ac.y) return a;
    if (taskWorkStarted(progress, b) && !bc.x && !bc.y) return b;
    if (!bc.x) return b;
    if (!ac.x) return a;
    if (!ac.y) return a;
    if (!bc.y) return b;
    if (!done[a.id]) return a;
    return b;
  }

  function canonicalLineMidPairSteps(pack, progress) {
    var pair = lineMidPairTasks(pack, progress);
    if (!pair) return [];
    var a = pair.yEnd;
    var b = pair.xEnd;
    var vx = midpointLineVertical(b);
    var trioA = midpointTrio(pack, progress, a);
    var trioB = midpointTrio(pack, progress, b);
    if (!trioA.known || !trioA.mid || !trioB.known || !trioB.mid || vx == null) return [];
    var out = [];
    out.push("משימה:" + taskStepLabel(b));
    out.push("x = " + fmtNum(vx));
    out.push("משימה:" + taskStepLabel(a));
    out.push(midpointEndPlugText("x", trioA.known, trioA.mid));
    out.push(midpointEndTimesText("x", trioA.known, trioA.mid));
    out.push(midpointValText("x", a.answerX));
    var hyCan = midpointLineHorizontal(a);
    if (hyCan != null) {
      out.push("y = " + fmtNum(hyCan));
    } else {
      out.push("y = x");
      if (!nearNum(a.answerY, a.answerX)) out.push(midpointValText("y", a.answerY));
    }
    out.push(midpointPairText(a));
    out.push("משימה:" + taskStepLabel(b));
    out.push(midpointEndPlugText("y", trioB.known, trioB.mid));
    out.push(midpointEndTimesText("y", trioB.known, trioB.mid));
    out.push(midpointValText("y", b.answerY));
    out.push(midpointPairText(b));
    return out;
  }

  function axisMidPairTasks(pack, progress) {
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    var map = taskByIdMap(pack);
    var yEnd = null;
    var xEnd = null;
    var i;
    for (i = 0; i < ids.length; i++) {
      var t = map[ids[i]];
      if (!t || t.kind !== "midpoint" || !t.mid) continue;
      if (midpointOnAxis(t) === "y") yEnd = t;
      if (midpointOnAxis(t) === "x") xEnd = t;
    }
    if (
      yEnd &&
      xEnd &&
      String(yEnd.mid || "").toUpperCase() === String(xEnd.mid || "").toUpperCase()
    ) {
      return { yEnd: yEnd, xEnd: xEnd };
    }
    return null;
  }

  function axisMidPairFocus(pack, progress, pair) {
    if (!pair) return null;
    var a = pair.yEnd;
    var b = pair.xEnd;
    var done = (progress && progress.done) || {};
    if (done[a.id] && done[b.id]) return null;
    var ac = (progress.coords && progress.coords[a.id]) || {};
    var bc = (progress.coords && progress.coords[b.id]) || {};
    var aExpr = (progress.lastExpr && progress.lastExpr[a.id]) || "";
    var bExpr = (progress.lastExpr && progress.lastExpr[b.id]) || "";
    if (bExpr && !done[b.id] && (midLastIsPlug(bExpr) || /[+]/.test(bExpr))) return b;
    if (aExpr && !done[a.id] && (midLastIsPlug(aExpr) || /[+]/.test(aExpr))) return a;
    if (midpointAwaitingPair(a, pack, progress)) return a;
    if (midpointAwaitingPair(b, pack, progress)) return b;
    if (taskWorkStarted(progress, b) && !bc.y && !bc.x && !ac.x) return b;
    if (bc.y && !ac.y) return a;
    if (!ac.x) return a;
    if (!bc.x) return b;
    if (!ac.y) return a;
    if (!bc.y) return b;
    if (!done[a.id]) return a;
    return b;
  }

  function canonicalAxisMidPairSteps(pack, progress) {
    var pair = axisMidPairTasks(pack, progress);
    if (!pair) return [];
    var a = pair.yEnd;
    var b = pair.xEnd;
    var trio = midpointTrio(pack, progress, b);
    if (!trio.known || !trio.mid) return [];
    var out = [];
    out.push("משימה:" + taskStepLabel(a));
    out.push("x = 0");
    out.push("משימה:" + taskStepLabel(b));
    out.push(midpointEndPlugText("x", trio.known, trio.mid));
    out.push(midpointEndTimesText("x", trio.known, trio.mid));
    out.push(midpointValText("x", b.answerX));
    out.push("משימה:" + taskStepLabel(a));
    out.push(midpointEndPlugText("y", trio.known, trio.mid));
    out.push(midpointEndTimesText("y", trio.known, trio.mid));
    out.push(midpointValText("y", a.answerY));
    out.push(midpointPairText(a));
    out.push("משימה:" + taskStepLabel(b));
    out.push(midpointPairText(b));
    return out;
  }

  function midpointAxisKnown(task) {
    var other = midpointOtherAxis(task);
    if (other === "x") return { x: 0, y: 0 };
    if (other === "y") return { x: 0, y: 0 };
    if (midpointOnAxis(task) === "y") return { x: 0, y: 0 };
    if (midpointOnAxis(task) === "x") return { x: 0, y: 0 };
    return null;
  }

  function midpointTrio(pack, progress, task) {
    var part = currentPartText(pack, progress);
    var local =
      part && part.points && part.points.length ? pointMap(part.points) : (pack && pack.map) || {};
    var known = getPoint(local, task && task.from) || getPoint(pack && pack.map, task && task.from);
    var mid = getPoint(local, task && task.mid) || getPoint(pack && pack.map, task && task.mid);
    if (!known) known = midpointAxisKnown(task);
    return { known: known, mid: mid };
  }

  function midpointEndPlugText(axis, known, mid) {
    var k = String(axis || "x").toLowerCase() === "y" ? known.y : known.x;
    var m = String(axis || "x").toLowerCase() === "y" ? mid.y : mid.x;
    var unk = midpointAxisLhs(axis);
    return fmtNum(m) + " = (" + fmtNum(k) + " + " + unk + ")/2";
  }

  function midpointEndTimesText(axis, known, mid) {
    var k = String(axis || "x").toLowerCase() === "y" ? known.y : known.x;
    var m = String(axis || "x").toLowerCase() === "y" ? mid.y : mid.x;
    var unk = midpointAxisLhs(axis);
    return fmtNum(2 * m) + " = " + fmtNum(k) + " + " + unk;
  }

  function normalizeMidEndTyped(typed) {
    return rewriteMixedNum(typed)
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/:/g, "=")
      .replace(/[A-Za-z][_]?([xyXY])/g, function (_, a) {
        return a.toLowerCase();
      });
  }

  function midEndHasUnk(side, axis) {
    var ax = midpointAxisLhs(axis);
    return new RegExp("(^|[^A-Za-z])" + ax + "([^A-Za-z]|$)", "i").test(String(side || ""));
  }

  function midEndSideNum(side) {
    return parseParenNumber(String(side || ""));
  }

  function midEndIsUnkLetter(side) {
    return /^[xy]$/i.test(String(side || ""));
  }

  function midEndIsKnownPlusUnk(side, known, axis) {
    var t = stripOuterParensBalanced(String(side || ""));
    var plus = splitAtDepthZero(t, "+");
    if (!plus) return false;
    var leftN = parseParenNumber(plus.left);
    var rightN = parseParenNumber(plus.right);
    if (leftN != null && midEndIsUnkLetter(plus.right) && nearNum(leftN, known)) {
      return true;
    }
    if (rightN != null && midEndIsUnkLetter(plus.left) && nearNum(rightN, known)) {
      return true;
    }
    return false;
  }

  function midEndIsPlugSide(side, known, axis) {
    var t = String(side || "");
    var parts = splitAtDepthZero(t, "/");
    if (!parts) return false;
    var den = parseParenNumber(parts.right);
    if (den == null || !nearNum(den, 2)) return false;
    if (midEndIsKnownPlusUnk(parts.left, known, axis)) return true;
    if (nearNum(known, 0)) {
      var num = stripOuterParensBalanced(parts.left);
      if (midEndIsUnkLetter(num)) return true;
    }
    return false;
  }

  function classifyMidEndTyped(typed, known, mid, axis) {
    var k = String(axis || "x").toLowerCase() === "y" ? known.y : known.x;
    var m = String(axis || "x").toLowerCase() === "y" ? mid.y : mid.x;
    var w = 2 * m - k;
    var s = normalizeMidEndTyped(typed);
    var unk = midpointAxisLhs(axis);
    if (!s) return null;
    if (s.indexOf("=") < 0) {
      var bare = evalStepExpr(s) != null ? evalStepExpr(s) : parseNumberToken(s);
      if (bare != null && nearNum(bare, w)) return { kind: "value" };
      return null;
    }
    var eq = splitAtDepthZero(s, "=") || (function () {
      var i = s.indexOf("=");
      return { left: s.slice(0, i), right: s.slice(i + 1) };
    })();
    var L = eq.left;
    var R = eq.right;
    var nL = midEndSideNum(L);
    var nR = midEndSideNum(R);
    if (midEndIsPlugSide(R, k, axis) && nL != null && nearNum(nL, m)) return { kind: "plug" };
    if (midEndIsPlugSide(L, k, axis) && nR != null && nearNum(nR, m)) return { kind: "plug" };
    if (midEndIsKnownPlusUnk(R, k, axis) && nL != null && nearNum(nL, 2 * m)) return { kind: "times2" };
    if (midEndIsKnownPlusUnk(L, k, axis) && nR != null && nearNum(nR, 2 * m)) return { kind: "times2" };
    if (
      (midEndIsKnownPlusUnk(R, k, axis) && nL != null && nearNum(nL, m)) ||
      (midEndIsKnownPlusUnk(L, k, axis) && nR != null && nearNum(nR, m))
    ) {
      return { kind: "missingDen" };
    }
    var isolL = /^[xy]$/i.test(L);
    var isolR = /^[xy]$/i.test(R);
    if (isolL && nR != null && nearNum(nR, w)) return { kind: "value" };
    if (isolR && nL != null && nearNum(nL, w)) return { kind: "value" };
    if (isolL) {
      var rhs = evalStepExpr(R);
      if (rhs != null && nearNum(rhs, w)) return { kind: "value" };
    }
    if (isolR) {
      var lhs = evalStepExpr(L);
      if (lhs != null && nearNum(lhs, w)) return { kind: "value" };
    }
    return null;
  }

  function midEndWrongMessage(got, known, mid, axis, task) {
    var k = String(axis || "x").toLowerCase() === "y" ? known.y : known.x;
    var m = String(axis || "x").toLowerCase() === "y" ? mid.y : mid.x;
    var w = 2 * m - k;
    var ax = midpointAxisLhs(axis);
    var midName = String((task && task.mid) || "M").toUpperCase();
    var knownName = String((task && task.from) || "A").toUpperCase();
    if (got == null || !isFinite(got)) return "";
    if (nearNum(got, m)) {
      return "זה שיעור האמצע (" + midName + "), לא של הקצה. " + ax + "₂ = 2" + ax + "ₘ − " + ax + "₁.";
    }
    if (nearNum(got, k)) {
      return "זה שיעור " + knownName + " שכבר נתון. צריך את הקצה השני: " + ax + "₂ = 2" + ax + "ₘ − " + ax + "₁.";
    }
    if (nearNum(got, 2 * m + k)) {
      return "כמעט: הנוסחה היא 2 פעמים האמצע פחות הקצה הידוע, לא חיבור.";
    }
    if (nearNum(got, m + k) || nearNum(got, m - k) || nearNum(got, k - m)) {
      return "חסר הכפל ב־2. מ־" + ax + "ₘ = (" + ax + "₁ + " + ax + "₂)/2 מכפילים את אגף שמאל ב־2, ואז מבודדים.";
    }
    if (nearNum(got, (m + k) / 2)) {
      return "זה שוב ממוצע — כאן האמצע כבר ידוע. הציבו אותו בנוסחה ומצאו את הקצה.";
    }
    if (!nearNum(got, w)) {
      return (
        "שיעור ה־" +
        ax +
        " עדיין לא מדויק. הציבו " +
        midpointEndPlugText(axis, known, mid) +
        "."
      );
    }
    return "";
  }

  function parseMidSumExpr(expr) {
    var t = rewriteMixedNum(expr)
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    t = stripOuterParensBalanced(t);
    if (!t) return null;
    var atomic = parseParenNumber(t);
    if (atomic != null) return { a: atomic, b: 0, sum: atomic, atomic: true };
    var plus = splitAtDepthZero(t, "+");
    if (plus) {
      var a = parseParenNumber(plus.left);
      var b = parseParenNumber(plus.right);
      if (a != null && b != null) return { a: a, b: b, sum: a + b };
    }
    var diff = parseSlopeDiffExpr(t);
    if (diff && !diff.atomic) {
      return { a: diff.a, b: -diff.b, sum: diff.value };
    }
    return null;
  }

  function parseMidpointFrac(typed) {
    var s = rewriteMixedNum(typed)
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    s = s.replace(/^(?:[Mm][_]?[xyXY]|[xyXY]_[A-Za-z]|[xyXY]|[Mm])(?:=|:)/, "");
    if (!s || s.indexOf("/") < 0) return null;
    var parts = splitAtDepthZero(s, "/");
    if (!parts) return null;
    var num = parseMidSumExpr(parts.left);
    var den = parseParenNumber(parts.right);
    if (!num || den == null) return null;
    return { num: num, den: den, value: den === 0 ? null : num.sum / den, atomic: !!num.atomic };
  }

  function midCoordsMatch(got, u, v) {
    if (!got || !got.num || got.atomic) return false;
    return (
      (nearNum(got.num.a, u) && nearNum(got.num.b, v)) ||
      (nearNum(got.num.a, v) && nearNum(got.num.b, u))
    );
  }

  function midAxisFromFormula(got, a, b) {
    if (!got || !a || !b || got.atomic) return "";
    var xok = midCoordsMatch(got, a.x, b.x);
    var yok = midCoordsMatch(got, a.y, b.y);
    if (xok && !yok) return "x";
    if (yok && !xok) return "y";
    if (xok && yok) return "x";
    return "";
  }

  function midpointTagAxis(tag, task) {
    var t = normGeoTag(tag);
    var p = midpointPointName(task);
    if (t === "X" || t === p + "X" || t === "X" + p) return "x";
    if (t === "Y" || t === p + "Y" || t === "Y" + p) return "y";
    if (t === p) return "point";
    return "";
  }

  function canonicalMidpointSteps(task, pack, progress) {
    if (!task || task.kind !== "midpoint") return [];
    if (task.mid) {
      var trio = midpointTrio(pack, progress, task);
      if (!trio.known || !trio.mid) return [midpointPairText(task)];
      var outE = [];
      var onAx = midpointOnAxis(task);
      function addEndAxis(axis, val) {
        outE.push(midpointEndPlugText(axis, trio.known, trio.mid));
        outE.push(midpointEndTimesText(axis, trio.known, trio.mid));
        outE.push(midpointValText(axis, val));
      }
      if (onAx === "y") {
        outE.push("x = 0");
        addEndAxis("y", task.answerY);
      } else if (onAx === "x") {
        outE.push("y = 0");
        addEndAxis("x", task.answerX);
      } else {
        addEndAxis("x", task.answerX);
        addEndAxis("y", task.answerY);
      }
      outE.push(midpointPairText(task));
      return outE;
    }
    var ends = midpointEnds(pack, progress, task);
    if (!ends.a || !ends.b) return [midpointPairText(task)];
    var out = [];
    function addAxis(axis, val) {
      var plug = midpointPlugText(axis, ends.a, ends.b);
      var sum = midpointSumText(axis, ends.a, ends.b);
      var fin = midpointValText(axis, val);
      out.push(plug);
      if (sum !== plug && sum !== fin) out.push(sum);
      if (fin !== plug && fin !== sum) out.push(fin);
    }
    addAxis("x", task.answerX);
    addAxis("y", task.answerY);
    out.push(midpointPairText(task));
    return out;
  }

  function midpointReadyForPair(task, cf, pack, progress) {
    if (!task || !cf) return false;
    if (cf.x && cf.y) return true;
    if (midpointOnAxis(task) === "x" && cf.x) {
      var pairAx = pack ? axisMidPairTasks(pack, progress) : null;
      if (!pairAx || task.id !== pairAx.xEnd.id) return true;
      return !!(progress.done && progress.done[pairAx.yEnd.id]);
    }
    return false;
  }

  function midpointAwaitingPair(task, pack, progress) {
    if (!task || task.kind !== "midpoint") return false;
    if (progress && progress.done && progress.done[task.id]) return false;
    var cf = (progress && progress.coords && progress.coords[task.id]) || {};
    return midpointReadyForPair(task, cf, pack, progress);
  }

  function midpointWritePairHint(t) {
    var pair = midpointPairText(t);
    return {
      task: t,
      message:
        "יש את שני השיעורים. רשמו את הנקודה " + midpointPointName(t) + "(x;y).",
      step: pair,
      answer: pair,
      rawStep: true,
    };
  }

  function settleSkippedMidpointPairs(pack, progress) {
    if (!pack || !progress) return;
    var done = progress.done || {};
    var movedOn = (pack.tasks || []).some(function (t) {
      return t && !t.optional && t.kind !== "midpoint" && done[t.id];
    });
    if (!movedOn) return;
    progress.done = done;
    (pack.tasks || []).forEach(function (t) {
      if (!t || t.kind !== "midpoint") return;
      if (done[t.id]) return;
      var cf = progress.coords && progress.coords[t.id];
      if (midpointReadyForPair(t, cf, pack, progress)) {
        progress.done[t.id] = true;
        if (progress.partial) delete progress.partial[t.id];
      }
    });
  }

  function midpointPairAskMessage(name) {
    return "נכון. יש את שני השיעורים. רשמו את הנקודה " + name + "(x;y).";
  }

  function midpointNextHint(pack, progress, t) {
    var pair = midpointPairText(t);
    var cf = {
      x: midpointCoordFlag(progress, t, "x"),
      y: midpointCoordFlag(progress, t, "y"),
    };
    var prev = (progress.lastExpr && progress.lastExpr[t.id]) || "";
    if (t.mid) {
      var trio = midpointTrio(pack, progress, t);
      if (!trio.known || !trio.mid) {
        return { task: t, message: "רשמו את הקצה החסר.", step: pair, answer: pair, rawStep: true };
      }
      if (midpointReadyForPair(t, cf, pack, progress)) return midpointWritePairHint(t);
      var onAxH = midpointOnAxis(t);
      var midNm = String(t.mid || "C").toUpperCase();
      var pairH = axisMidPairTasks(pack, progress);
      var partner = null;
      if (pairH) partner = t.id === pairH.yEnd.id ? pairH.xEnd : pairH.yEnd;
      var pcf = partner && progress.coords ? progress.coords[partner.id] || {} : {};
      if (onAxH === "y" && !cf.x && !(pcf.y && !cf.y)) {
        return {
          task: t,
          message:
            midpointPointName(t) +
            " על ציר y, לכן x = 0. אחר כך מוצאים את x של הנקודה על ציר x מאמצע " +
            midNm +
            ".",
          step: "x = 0",
          answer: pair,
          rawStep: true,
        };
      }
      if (onAxH === "x" && !cf.y && !pcf.x) {
        return {
          task: t,
          message:
            midpointPointName(t) +
            " על ציר x, לכן y = 0. אחר כך מוצאים את y של הנקודה על ציר y מאמצע " +
            midNm +
            ".",
          step: "y = 0",
          answer: pair,
          rawStep: true,
        };
      }
      var vxH = midpointLineVertical(t);
      if (vxH != null && !cf.x) {
        return {
          task: t,
          message:
            midpointPointName(t) +
            " על x = " +
            fmtNum(vxH) +
            ". רשמו x = " +
            fmtNum(vxH) +
            ", ואז את y מאמצע.",
          step: "x = " + fmtNum(vxH),
          answer: pair,
          rawStep: true,
        };
      }
      var hyH = midpointLineHorizontal(t);
      if (hyH != null && !cf.y) {
        return {
          task: t,
          message:
            midpointPointName(t) +
            " על y = " +
            fmtNum(hyH) +
            ". רשמו y = " +
            fmtNum(hyH) +
            ", ואז את x מאמצע.",
          step: "y = " + fmtNum(hyH),
          answer: pair,
          rawStep: true,
        };
      }
      if (midpointLineIdentity(t) && cf.x && !cf.y) {
        return {
          task: t,
          message: midpointPointName(t) + " על y = x, לכן y = " + fmtNum(t.answerX) + ".",
          step: "y = " + fmtNum(t.answerX),
          answer: pair,
          rawStep: true,
        };
      }
      if (onAxH === "y" && cf.x && !cf.y && pairH && partner && !(pcf.x || pcf.y)) {
        var plugBx = midpointEndPlugText("x", midpointTrio(pack, progress, partner).known || trio.known, trio.mid);
        return {
          task: partner,
          message:
            "יש x של " +
            midpointPointName(t) +
            ". עכשיו x של " +
            midpointPointName(partner) +
            " מאמצע: " +
            plugBx +
            ".",
          step: plugBx,
          answer: midpointPairText(partner),
          rawStep: true,
        };
      }
      var axisE = cf.x ? "y" : "x";
      if (onAxH === "y" && pcf.y && !cf.y) axisE = "y";
      if (onAxH === "x" && pcf.x && !cf.x) axisE = "x";
      if (!cf.x && !cf.y && /(^|[^A-Za-z])y([^A-Za-z]|$)/i.test(prev) && !/(^|[^A-Za-z])x([^A-Za-z]|$)/i.test(prev)) {
        axisE = "y";
      }
      var wantE = midpointWant(axisE, t);
      var plugE = midpointEndPlugText(axisE, trio.known, trio.mid);
      var timesE = midpointEndTimesText(axisE, trio.known, trio.mid);
      var finE = midpointValText(axisE, wantE);
      var prevAxisE = midLastAxis(prev);
      if (!prevAxisE && /(^|[^A-Za-z])x([^A-Za-z]|$)/i.test(prev) && !/(^|[^A-Za-z])y([^A-Za-z]|$)/i.test(prev)) {
        prevAxisE = "x";
      }
      if (!prevAxisE && /(^|[^A-Za-z])y([^A-Za-z]|$)/i.test(prev)) prevAxisE = "y";
      var prevSameE = !prev || prevAxisE === axisE;
      if (prevSameE && midLastIsPlug(prev)) {
        return {
          task: t,
          message: "הכפילו את אגף שמאל ב־2 (העבירו את המכנה בכפל).",
          step: timesE,
          answer: pair,
          rawStep: true,
        };
      }
      if (prevSameE && /[+]/.test(prev) && !/[\/÷]/.test(prev)) {
        return {
          task: t,
          message: "בודדו את " + midpointAxisLhs(axisE) + ".",
          step: finE,
          answer: pair,
          rawStep: true,
        };
      }
      return {
        task: t,
        message:
          "הציבו את האמצע בנוסחה: " +
          plugE +
          ". אחר כך הכפילו ב־2 ובודדו. אפשר גם ישר את הקצה.",
        step: plugE,
        answer: pair,
        rawStep: true,
      };
    }
    var ends = midpointEnds(pack, progress, t);
    if (midpointReadyForPair(t, cf, pack, progress)) return midpointWritePairHint(t);
    if (!ends.a || !ends.b) {
      return { task: t, message: "רשמו את נקודת האמצע.", step: pair, answer: pair, rawStep: true };
    }
    var axis = cf.x ? "y" : "x";
    if (!cf.x && !cf.y && /^y/i.test(prev)) axis = "y";
    if (/^m/i.test(prev) || (/^y\s*=/i.test(prev) && /[xX]/.test(prev))) {
      var endsAbH = midpointEnds(pack, progress, t);
      var abH = endsAbH.a && endsAbH.b ? segmentLineFromEnds(endsAbH.a, endsAbH.b) : null;
      if (abH && !abH.vertical) {
        if (/^m/i.test(prev)) {
          return {
            task: t,
            message:
              "כתבו את משוואת " +
              midpointSegmentLetters(t) +
              " מנקודה ושיפוע, הציבו את השיעור הידוע של האמצע, ומצאו את החסר. אפשר גם ישר את נוסחת האמצע.",
            step: prettyLineEq({ m: abH.m, b: abH.b }),
            answer: pair,
            rawStep: true,
          };
        }
        return {
          task: t,
          message:
            "הציבו x = " +
            fmtNum(t.answerX) +
            " במשוואת " +
            midpointSegmentLetters(t) +
            " ומצאו את y.",
          step: midpointValText("y", t.answerY),
          answer: pair,
          rawStep: true,
        };
      }
    }
    var want = midpointWant(axis, t);
    var plug = midpointPlugText(axis, ends.a, ends.b);
    var sum = midpointSumText(axis, ends.a, ends.b);
    var fin = midpointValText(axis, want);
    var prevSame = midLastAxis(prev) === axis;
    if (prevSame && midLastIsPlug(prev) && sum !== fin) {
      return {
        task: t,
        message: "חברו את איברי המונה.",
        step: sum,
        answer: pair,
        rawStep: true,
      };
    }
    if (prevSame && (midLastIsPlug(prev) || midLastIsSum(prev)) && fin !== plug) {
      return {
        task: t,
        message: "חשבו את המונה חלקי המכנה.",
        step: fin,
        answer: pair,
        rawStep: true,
      };
    }
    return {
      task: t,
      message:
        "הציבו בנוסחה " +
        midpointAxisLhs(axis) +
        " = (" +
        midpointAxisLhs(axis) +
        "₁ + " +
        midpointAxisLhs(axis) +
        "₂)/2. אפשר גם את סכום המונה או ישר את התוצאה.",
      step: plug,
      answer: pair,
      rawStep: true,
    };
  }

  function midLastAxis(expr) {
    var s = String(expr || "").replace(/\s+/g, "");
    if (/^y/i.test(s)) return "y";
    if (/^x/i.test(s)) return "x";
    return "";
  }

  function midLastIsPlug(expr) {
    return /\+/.test(String(expr || "")) && /[\/÷]/.test(String(expr || ""));
  }

  function midLastIsSum(expr) {
    return /[\/÷]/.test(String(expr || "")) && !/\+/.test(String(expr || ""));
  }

  function partPendingMidpoints(pending, pack, progress) {
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    return (pending || []).filter(function (t) {
      if (!t || t.kind !== "midpoint") return false;
      return !ids.length || ids.indexOf(t.id) >= 0;
    });
  }

  function midEndOpenAxes(task, progress) {
    var onAx = midpointOnAxis(task);
    var cf = (progress && progress.coords && progress.coords[task.id]) || {};
    if (onAx === "y") return cf.y ? [] : ["y"];
    if (onAx === "x") return cf.x ? [] : ["x"];
    if (midpointLineVertical(task) != null) return cf.y ? [] : ["y"];
    if (midpointLineHorizontal(task) != null) {
      if (!cf.y) return ["y", "x"];
      return cf.x ? [] : ["x"];
    }
    var out = [];
    if (!cf.x) out.push("x");
    if (!cf.y) out.push("y");
    return out;
  }

  function pickMidpointTask(allMids, typed, parsed, pack, progress) {
    if (!allMids || !allMids.length) return null;
    var tag = parsed && parsed.tag ? normGeoTag(parsed.tag) : "";
    var i;
    if (tag) {
      var named = [];
      for (i = 0; i < allMids.length; i++) {
        var pName = midpointPointName(allMids[i]);
        if (pName && tag.indexOf(pName) >= 0) named.push(allMids[i]);
      }
      if (named.length) {
        for (i = 0; i < named.length; i++) {
          var axN = midpointTagAxis(tag, named[i]);
          if (axN === "point" || axN === "x" || axN === "y") return named[i];
        }
        return named[0];
      }
      if (tag !== "X" && tag !== "Y") {
        for (i = 0; i < allMids.length; i++) {
          var ax = midpointTagAxis(tag, allMids[i]);
          if (ax === "point" || ax === "x" || ax === "y") return allMids[i];
        }
      } else if (parsed && parsed.value != null && isFinite(parsed.value)) {
        var axBare = tag === "Y" ? "y" : "x";
        for (i = 0; i < allMids.length; i++) {
          var openBare = midEndOpenAxes(allMids[i], progress);
          if (openBare.indexOf(axBare) < 0) continue;
          var wantBare = axBare === "y" ? allMids[i].answerY : allMids[i].answerX;
          if (nearNum(parsed.value, wantBare)) return allMids[i];
        }
      }
    }
    var typedNormPick = normalizeMidEndTyped(typed);
    for (i = 0; i < allMids.length; i++) {
      var vxPick = midpointLineVertical(allMids[i]);
      if (vxPick == null) continue;
      var axisPick = "";
      if (/^x=/i.test(typedNormPick) || (parsed && midpointTagAxis(parsed.tag, allMids[i]) === "x")) axisPick = "x";
      if (/^y=/i.test(typedNormPick) || (parsed && midpointTagAxis(parsed.tag, allMids[i]) === "y")) axisPick = "y";
      var gotPick =
        parsed && parsed.value != null && isFinite(parsed.value)
          ? parsed.value
          : parseParenNumber(String(typedNormPick || "").replace(/^[xy]=/i, ""));
      if (gotPick != null && nearNum(gotPick, vxPick) && (axisPick === "x" || axisPick === "y")) {
        return allMids[i];
      }
    }
    for (i = 0; i < allMids.length; i++) {
      if (midpointLineIdentity(allMids[i]) && /^(y=x|x=y)$/i.test(typedNormPick)) return allMids[i];
    }
    for (i = 0; i < allMids.length; i++) {
      var hyPick = midpointLineHorizontal(allMids[i]);
      if (hyPick == null) continue;
      var axisHy = "";
      if (/^x=/i.test(typedNormPick) || (parsed && midpointTagAxis(parsed.tag, allMids[i]) === "x")) axisHy = "x";
      if (/^y=/i.test(typedNormPick) || (parsed && midpointTagAxis(parsed.tag, allMids[i]) === "y")) axisHy = "y";
      var gotHyPick =
        parsed && parsed.value != null && isFinite(parsed.value)
          ? parsed.value
          : parseParenNumber(String(typedNormPick || "").replace(/^[xy]=/i, ""));
      if (gotHyPick != null && nearNum(gotHyPick, hyPick) && (axisHy === "x" || axisHy === "y")) {
        return allMids[i];
      }
    }
    if (parsed && parsed.kind === "point" && parsed.point) {
      for (i = 0; i < allMids.length; i++) {
        if (
          nearNum(parsed.point.x, allMids[i].answerX) &&
          nearNum(parsed.point.y, allMids[i].answerY)
        ) {
          return allMids[i];
        }
      }
    }
    var formula = parseMidpointFrac(typed);
    if (formula && !formula.atomic) {
      for (i = 0; i < allMids.length; i++) {
        if (allMids[i].mid) continue;
        var ends = midpointEnds(pack, progress, allMids[i]);
        if (!ends.a || !ends.b) continue;
        if (midAxisFromFormula(formula, ends.a, ends.b)) return allMids[i];
      }
    }
    for (i = 0; i < allMids.length; i++) {
      if (!allMids[i].mid) continue;
      var trio = midpointTrio(pack, progress, allMids[i]);
      if (!trio.known || !trio.mid) continue;
      var openAx = midEndOpenAxes(allMids[i], progress);
      var oi;
      for (oi = 0; oi < openAx.length; oi++) {
        if (classifyMidEndTyped(typed, trio.known, trio.mid, openAx[oi])) return allMids[i];
      }
    }
    var focus = currentFocusTask(pack, progress);
    if (focus && focus.kind === "midpoint") {
      for (i = 0; i < allMids.length; i++) {
        if (allMids[i].id === focus.id) return allMids[i];
      }
    }
    return allMids[0];
  }

  function markMidpointInterceptsDone(pack, maps, task) {
    if (!task || task.kind !== "midpoint" || task.mid) return;
    var from = String(task.from || "").toUpperCase();
    var to = String(task.to || "").toUpperCase();
    (pack.tasks || []).forEach(function (u) {
      if (!u || u.kind !== "point" || !u.intercept) return;
      var lab = String(u.point || u.label || "").toUpperCase();
      if (lab !== from && lab !== to) return;
      maps.done[u.id] = true;
      maps.coords[u.id] = { x: true, y: true };
      delete maps.partial[u.id];
      delete maps.lastExpr[u.id];
    });
  }

  function looksLikeMidpointTyped(typed, parsed, pack, progress, task) {
    if (parsed && parsed.tag) {
      var tagU0 = normGeoTag(parsed.tag);
      var pN0 = midpointPointName(task);
      if (pN0 && tagU0 && tagU0 !== "X" && tagU0 !== "Y" && tagU0.indexOf(pN0) < 0) {
        return false;
      }
    }
    if (parsed && parsed.kind === "point" && parsed.point) {
      if (
        task &&
        nearNum(parsed.point.x, task.answerX) &&
        nearNum(parsed.point.y, task.answerY)
      ) {
        return true;
      }
      var tagP = parsed.tag ? midpointTagAxis(parsed.tag, task) : "";
      return tagP === "point";
    }
    var frac = parseMidpointFrac(typed);
    if (frac && frac.value != null && nearNum(frac.den, 2)) {
      if (task && task.mid) {
        var trioL = midpointTrio(pack, progress, task);
        if (trioL.known && trioL.mid) return true;
      }
      if (task && !task.mid) {
        var endsL = midpointEnds(pack, progress, task);
        if (endsL.a && endsL.b && midAxisFromFormula(frac, endsL.a, endsL.b)) return true;
        if (frac.atomic && (nearNum(frac.value, task.answerX) || nearNum(frac.value, task.answerY))) {
          return true;
        }
      }
    }
    if (task && task.mid) {
      var trio = midpointTrio(pack, progress, task);
      if (trio.known && trio.mid) {
        var openLike = midEndOpenAxes(task, progress);
        var li;
        for (li = 0; li < openLike.length; li++) {
          if (classifyMidEndTyped(typed, trio.known, trio.mid, openLike[li])) return true;
        }
      }
      if (midpointOnAxis(task) && /^(x=0|y=0)$/i.test(normalizeMidEndTyped(typed))) return true;
      var vxLike = midpointLineVertical(task);
      if (vxLike != null && /^x=/i.test(normalizeMidEndTyped(typed))) return true;
      var hyLike = midpointLineHorizontal(task);
      if (hyLike != null && /^y=/i.test(normalizeMidEndTyped(typed))) return true;
      if (midpointLineIdentity(task) && /^(y=x|x=y)$/i.test(normalizeMidEndTyped(typed))) return true;
    }
    if (task && !task.mid) {
      var endsAb = midpointEnds(pack, progress, task);
      if (endsAb.a && endsAb.b) {
        var sfAb = parseSlopeFormula(typed);
        if (sfAb && classifySlopeFormula(sfAb, endsAb.a, endsAb.b).kind === "ok") return true;
        var abLine = segmentLineFromEnds(endsAb.a, endsAb.b);
        if (abLine && typedMatchesAbLine(typed, abLine)) return true;
        if (lettersMatchMidSegment(slopeTagLetters(typed), task)) return true;
      }
    }
    var focusNow = currentFocusTask(pack, progress);
    if (focusNow && focusNow.kind !== "midpoint") return false;
    var got =
      parsed && parsed.value != null && isFinite(parsed.value) ? parsed.value : null;
    if (got != null && task && (nearNum(got, task.answerX) || nearNum(got, task.answerY))) return true;
    return false;
  }

  function checkMidpointEnd(typed, parsed, pack, progress, task, doneMap, partialMap, coordsMap) {
    var trio = midpointTrio(pack, progress, task);
    if (!trio.known || !trio.mid || task.answerX == null || task.answerY == null) return null;
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    if (!maps.coords[task.id]) maps.coords[task.id] = { x: false, y: false };
    var cf = maps.coords[task.id];
    var lastAx0 = midpointLastExprAxis(task, (maps.lastExpr && maps.lastExpr[task.id]) || "");
    if (lastAx0) cf[lastAx0] = true;
    var known = trio.known;
    var mid = trio.mid;
    var midName = String(task.mid || "M").toUpperCase();
    var knownName = String(task.from || (midpointOtherAxis(task) === "x" ? "B" : "A") || "A").toUpperCase();
    var endName = midpointPointName(task);
    var onAx = midpointOnAxis(task);
    var typedNorm = normalizeMidEndTyped(typed);
    var pairNow = axisMidPairTasks(pack, progress) || lineMidPairTasks(pack, progress);
    var vx = midpointLineVertical(task);
    var ident = midpointLineIdentity(task);
    if (
      onAx === "x" &&
      (/^x=0$/i.test(typedNorm) ||
        (midpointTagAxis(parsed && parsed.tag, task) === "x" && parsed && nearNum(parsed.value, 0)))
    ) {
      var plugBx = trio.known && trio.mid ? midpointEndPlugText("x", trio.known, trio.mid) : "3 = (0 + x)/2";
      return {
        ok: false,
        message:
          endName +
          " על ציר x, לכן y = 0 (לא x = 0). את x מוצאים מאמצע: " +
          plugBx +
          ".",
      };
    }
    if (onAx === "y" && !cf.x && (/^x=0$/i.test(typedNorm) || (midpointTagAxis(parsed && parsed.tag, task) === "x" && parsed && nearNum(parsed.value, 0)))) {
      return afterCoord("x", "x = 0");
    }
    if (onAx === "x" && !cf.y && (/^y=0$/i.test(typedNorm) || (midpointTagAxis(parsed && parsed.tag, task) === "y" && parsed && nearNum(parsed.value, 0)))) {
      return afterCoord("y", "y = 0");
    }
    if (
      vx != null &&
      parsed &&
      parsed.value != null &&
      nearNum(parsed.value, vx) &&
      (midpointTagAxis(parsed.tag, task) === "y" || /^y=/i.test(typedNorm))
    ) {
      return {
        ok: false,
        message:
          endName +
          " על הישר x = " +
          fmtNum(vx) +
          ", לכן x = " +
          fmtNum(vx) +
          " (לא y). את y מוצאים מאמצע.",
      };
    }
    if (vx != null && !cf.x && (/^x=/i.test(typedNorm) || midpointTagAxis(parsed && parsed.tag, task) === "x")) {
      var gotVx =
        parsed && parsed.value != null && isFinite(parsed.value)
          ? parsed.value
          : parseParenNumber(String(typedNorm || "").replace(/^x=/, ""));
      if (gotVx != null && nearNum(gotVx, vx)) {
        return afterCoord("x", "x = " + fmtNum(vx));
      }
      if (gotVx != null) {
        return { ok: false, message: endName + " נמצאת על x = " + fmtNum(vx) + "." };
      }
    }
    var hy = midpointLineHorizontal(task);
    if (
      hy != null &&
      parsed &&
      parsed.value != null &&
      nearNum(parsed.value, hy) &&
      (midpointTagAxis(parsed.tag, task) === "x" || /^x=/i.test(typedNorm))
    ) {
      return {
        ok: false,
        message:
          endName +
          " על הישר y = " +
          fmtNum(hy) +
          ", לכן y = " +
          fmtNum(hy) +
          " (לא x). את x מוצאים מאמצע.",
      };
    }
    if (hy != null && cf.y && (/^y=/i.test(typedNorm) || midpointTagAxis(parsed && parsed.tag, task) === "y")) {
      var gotHyHave =
        parsed && parsed.value != null && isFinite(parsed.value)
          ? parsed.value
          : parseParenNumber(String(typedNorm || "").replace(/^y=/i, ""));
      if (gotHyHave != null && nearNum(gotHyHave, hy)) {
        var nextAfterHy =
          pairNow && !(maps.coords[pairNow.xEnd.id] && maps.coords[pairNow.xEnd.id].x)
            ? "רשמו x = " +
              fmtNum(midpointLineVertical(pairNow.xEnd)) +
              " (" +
              midpointPointName(pairNow.xEnd) +
              " על הישר האנכי)."
            : "עכשיו הציבו את האמצע בנוסחה: " + midpointEndPlugText("x", known, mid) + ".";
        return { ok: false, message: "את y כבר מצאתם. " + nextAfterHy };
      }
    }
    if (hy != null && !cf.y && (/^y=/i.test(typedNorm) || midpointTagAxis(parsed && parsed.tag, task) === "y")) {
      var gotHy =
        parsed && parsed.value != null && isFinite(parsed.value)
          ? parsed.value
          : parseParenNumber(String(typedNorm || "").replace(/^y=/i, ""));
      if (gotHy != null && nearNum(gotHy, hy)) {
        return afterCoord("y", "y = " + fmtNum(hy));
      }
      if (gotHy != null) {
        return { ok: false, message: endName + " נמצאת על y = " + fmtNum(hy) + "." };
      }
    }
    if (ident && /^(y=x|x=y)$/i.test(typedNorm)) {
      if (cf.x && !cf.y) return afterCoord("y", "y = " + fmtNum(task.answerX));
      if (cf.y && !cf.x) return afterCoord("x", "x = " + fmtNum(task.answerY));
      maps.partial[task.id] = true;
      maps.lastExpr[task.id] = "y = x";
      return {
        ok: true,
        solved: false,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: task,
        show: "y = x",
        rawStep: true,
        message: "נכון. על y = x מתקיים y = x. עכשיו מצאו שיעור בעזרת נוסחת האמצע.",
      };
    }
    if (ident && cf.x && !cf.y && parsed && parsed.value != null && nearNum(parsed.value, task.answerX)) {
      return afterCoord("y", midpointValText("y", task.answerY));
    }
    if (
      ident &&
      pairNow &&
      pairNow.xEnd &&
      parsed &&
      parsed.value != null &&
      midpointTagAxis(parsed.tag, task) === "x" &&
      nearNum(parsed.value, midpointLineVertical(pairNow.xEnd))
    ) {
      return {
        ok: false,
        message:
          endName +
          " על y = x, לא על x = " +
          fmtNum(midpointLineVertical(pairNow.xEnd)) +
          ". את x מוצאים מאמצע: " +
          midpointEndPlugText("x", known, mid) +
          ".",
      };
    }

    function finish(show) {
      maps.done[task.id] = true;
      delete maps.partial[task.id];
      maps.coords[task.id] = { x: true, y: true };
      delete maps.lastExpr[task.id];
      var left = remainingRequired(pack, maps.done);
      return {
        ok: true,
        solved: left.length === 0,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: task,
        show: show || midpointPairText(task),
        rawStep: true,
        message: left.length ? "נכון. המשיכו לתרגיל הבא." : "כל החלקים נפתרו.",
      };
    }

    function afterCoord(axis, show) {
      cf[axis] = true;
      maps.lastExpr[task.id] = show;
      maps.partial[task.id] = true;
      if (cf.x && cf.y) {
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
          message: midpointPairAskMessage(endName),
        };
      }
      var other = axis === "x" ? "y" : "x";
      var pairOther = pairNow
        ? task.id === pairNow.yEnd.id
          ? pairNow.xEnd
          : pairNow.yEnd
        : null;
      var nextMsg =
        pairNow && onAx === "y" && axis === "x"
            ? "נכון. עכשיו x של " +
              midpointPointName(pairOther) +
              " מאמצע: " +
              midpointEndPlugText("x", known, mid) +
              "."
            : pairNow && onAx === "x" && axis === "x"
              ? "נכון. עכשיו y של " +
                midpointPointName(pairNow.yEnd) +
                " מאמצע: " +
                midpointEndPlugText("y", known, mid) +
                "."
              : onAx === "y" && axis === "x"
                ? "נכון. עכשיו הציבו את האמצע בנוסחה: " + midpointEndPlugText("y", known, mid) + "."
                : onAx === "x" && axis === "y"
                  ? "נכון. עכשיו הציבו את האמצע בנוסחה: " + midpointEndPlugText("x", known, mid) + "."
                  : ident && axis === "x"
                    ? "נכון. על y = x, לכן y = " + fmtNum(task.answerX) + "."
                    : vx != null && axis === "x" && pairNow
                      ? "נכון. עכשיו x של " +
                        midpointPointName(pairNow.yEnd) +
                        " מאמצע."
                      : ident && axis === "y" && pairNow
                        ? "נכון. עכשיו y של " +
                          midpointPointName(pairNow.xEnd) +
                          " מאמצע."
                      : hy != null &&
                          axis === "y" &&
                          pairNow &&
                          !(maps.coords[pairNow.xEnd.id] && maps.coords[pairNow.xEnd.id].x)
                        ? "נכון. עכשיו x של " +
                          midpointPointName(pairNow.xEnd) +
                          ": x = " +
                          fmtNum(midpointLineVertical(pairNow.xEnd)) +
                          "."
                        : hy != null && axis === "y"
                          ? "נכון. עכשיו הציבו את האמצע בנוסחה: " +
                            midpointEndPlugText("x", known, mid) +
                            "."
                  : "נכון. עכשיו אותו דבר ל־" + midpointAxisLhs(other) + ".";
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
        message: nextMsg,
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

    var tagAx = parsed && parsed.tag ? midpointTagAxis(parsed.tag, task) : "";
    if (parsed && parsed.kind === "point" && parsed.point) {
      if (nearNum(parsed.point.x, task.answerX) && nearNum(parsed.point.y, task.answerY)) {
        return finish(midpointPairText(task));
      }
      if (nearNum(parsed.point.x, mid.x) && nearNum(parsed.point.y, mid.y)) {
        return {
          ok: false,
          message: "זו נקודת האמצע " + midName + ". צריך את הקצה " + endName + ": x₂ = 2xₘ − x₁.",
        };
      }
      if (task.from && nearNum(parsed.point.x, known.x) && nearNum(parsed.point.y, known.y)) {
        return {
          ok: false,
          message: "זו הנקודה " + knownName + " שכבר נתונה. מצאו את הקצה השני.",
        };
      }
      if (tagAx === "point" || parsed.tag) {
        return {
          ok: false,
          message: "הנקודה עדיין לא מדויקת. הציבו " + midpointEndPlugText("x", known, mid) + ".",
        };
      }
    }

    var axes = cf.x && !cf.y ? ["y", "x"] : ["x", "y"];
    if (tagAx === "y" || tagAx === "x") {
      axes = [tagAx].concat(
        axes.filter(function (a) {
          return a !== tagAx;
        })
      );
    }
    var ai;
    for (ai = 0; ai < axes.length; ai++) {
      var axis = axes[ai];
      if (onAx === "y" && axis === "x") continue;
      if (onAx === "x" && axis === "y") {
        if (classifyMidEndTyped(typed, known, mid, "y")) {
          return {
            ok: false,
            message: endName + " על ציר x, לכן y = 0 (לא מנוסחת האמצע). את x מוצאים מאמצע.",
          };
        }
        continue;
      }
      if (vx != null && axis === "x") continue;
      if (cf[axis] && tagAx !== axis) continue;
      var cls = classifyMidEndTyped(typed, known, mid, axis);
      if (!cls) continue;
      if (cf[axis] && cls.kind !== "value") {
        return {
          ok: false,
          message: "את שיעור " + midpointAxisLhs(axis) + " כבר מצאתם. המשיכו לשיעור השני או רשמו את הנקודה.",
        };
      }
      if (cls.kind === "missingDen") {
        return {
          ok: false,
          message:
            "חסר החילוק ב־2. הנוסחה היא " +
            midpointAxisLhs(axis) +
            "ₘ = (" +
            midpointAxisLhs(axis) +
            "₁ + " +
            midpointAxisLhs(axis) +
            "₂)/2. הכפילו את אגף שמאל ב־2.",
        };
      }
      if (cls.kind === "plug") {
        return partial(
          midpointEndPlugText(axis, known, mid),
          "נכון. עכשיו הכפילו את אגף שמאל ב־2 (העבירו את המכנה בכפל)."
        );
      }
      if (cls.kind === "times2") {
        return partial(
          midpointEndTimesText(axis, known, mid),
          "נכון. עכשיו בודדו את " + midpointAxisLhs(axis) + "."
        );
      }
      if (cls.kind === "value") {
        return afterCoord(axis, midpointValText(axis, midpointWant(axis, task)));
      }
    }

    var gotVal =
      parsed && parsed.value != null && isFinite(parsed.value) ? parsed.value : null;
    if (gotVal != null) {
      var axN = tagAx === "x" || tagAx === "y" ? tagAx : "";
      if (!axN) {
        if (!cf.x && nearNum(gotVal, task.answerX)) axN = "x";
        else if (!cf.y && nearNum(gotVal, task.answerY)) axN = "y";
      }
      if (axN && cf[axN] && nearNum(gotVal, midpointWant(axN, task))) {
        axN = "";
      }
      if (axN && nearNum(gotVal, midpointWant(axN, task))) {
        return afterCoord(axN, midpointValText(axN, midpointWant(axN, task)));
      }
      var tryAx = axN || (cf.x ? "y" : "x");
      var bad = midEndWrongMessage(gotVal, known, mid, tryAx, task);
      if (bad) return { ok: false, message: bad };
    }

    if (tagAx === "point" || (parsed && parsed.kind === "point")) return null;
    var plugAxis = onAx === "x" ? "x" : onAx === "y" ? "y" : cf.x ? "y" : "x";
    if (pairNow && onAx === "y" && cf.x && !cf.y) {
      var bTask = pairNow.xEnd;
      var bcf = maps.coords[bTask.id] || {};
      if (!bcf.x) {
        return {
          ok: false,
          message:
            "הציבו " +
            midpointEndPlugText("x", known, mid) +
            " כדי למצוא את x של " +
            midpointPointName(bTask) +
            ", הכפילו ב־2 ובודדו.",
        };
      }
      plugAxis = "y";
    }
    return {
      ok: false,
      message: "הציבו " + midpointEndPlugText(plugAxis, known, mid) + ", הכפילו ב־2 ובודדו.",
    };
  }

  function checkMidpoint(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var allMids = partPendingMidpoints(pending, pack, progress);
    if (!allMids.length) return null;
    var typedN0 = normalizeMidEndTyped(typed);
    var pairHold = lineMidPairTasks(pack, progress);
    if (
      pairHold &&
      lineMidPairBlockedByPrior(pack, progress, pairHold) &&
      /^[xy]=/i.test(typedN0) &&
      !parseMidpointFrac(typed)
    ) {
      return null;
    }
    if (/^x=0$/i.test(typedN0) || /^y=0$/i.test(typedN0)) {
      var axisMid = allMids.filter(function (t) {
        if (midpointOnAxis(t) === "y" && /^x=0$/i.test(typedN0)) return true;
        if (midpointOnAxis(t) === "x" && /^y=0$/i.test(typedN0)) return true;
        return false;
      });
      if (!axisMid.length) {
        var hasInt = (pending || []).some(function (t) {
          return t.kind === "point" && t.intercept;
        });
        if (hasInt) return null;
      }
    }
    var paTag = parsePointAxisTag(parsed && parsed.tag);
    if (paTag) {
      var namedForPt = allMids.filter(function (t) {
        return midpointPointName(t) === paTag.point;
      })[0];
      if (!namedForPt) {
        var focPt = currentFocusTask(pack, progress);
        var wantNm =
          focPt && focPt.kind === "midpoint"
            ? midpointPointName(focPt)
            : allMids[0]
              ? midpointPointName(allMids[0])
              : "";
        if (wantNm && wantNm !== paTag.point) {
          return {
            ok: false,
            message:
              "זה " +
              paTag.axis +
              " של " +
              paTag.point +
              ", לא של " +
              wantNm +
              ". רשמו " +
              paTag.axis +
              "_" +
              wantNm +
              " (או " +
              wantNm +
              paTag.axis +
              ").",
          };
        }
      }
    }
    var task = pickMidpointTask(allMids, typed, parsed, pack, progress);
    if (!task) return null;
    if (!looksLikeMidpointTyped(typed, parsed, pack, progress, task)) {
      var mi;
      task = null;
      for (mi = 0; mi < allMids.length; mi++) {
        if (looksLikeMidpointTyped(typed, parsed, pack, progress, allMids[mi])) {
          task = allMids[mi];
          break;
        }
      }
      if (!task) return null;
    }
    if (task.mid) {
      return checkMidpointEnd(typed, parsed, pack, progress, task, doneMap, partialMap, coordsMap);
    }
    var ends = midpointEnds(pack, progress, task);
    if (!ends.a || !ends.b || task.answerX == null || task.answerY == null) return null;
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    if (!maps.coords[task.id]) maps.coords[task.id] = { x: false, y: false };
    var cf = maps.coords[task.id];

    function finish(show) {
      maps.done[task.id] = true;
      delete maps.partial[task.id];
      maps.coords[task.id] = { x: true, y: true };
      delete maps.lastExpr[task.id];
      markMidpointInterceptsDone(pack, maps, task);
      var left = remainingRequired(pack, maps.done);
      return {
        ok: true,
        solved: left.length === 0,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: task,
        show: show || midpointPairText(task),
        rawStep: true,
        message: left.length ? "נכון. המשיכו לסעיף הבא." : "כל החלקים נפתרו.",
      };
    }

    function afterCoord(axis, show, msg) {
      cf[axis] = true;
      maps.lastExpr[task.id] = show;
      maps.partial[task.id] = true;
      if (cf.x && cf.y) {
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
          message: midpointPairAskMessage(midpointPointName(task)),
        };
      }
      var other = axis === "x" ? "y" : "x";
      var nextMsg = msg || "נכון. עכשיו אותו דבר ל־" + midpointAxisLhs(other) + ".";
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
        message: nextMsg,
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

    var tagAx = parsed && parsed.tag ? midpointTagAxis(parsed.tag, task) : "";
    if (parsed && parsed.kind === "point" && parsed.point) {
      if (nearNum(parsed.point.x, task.answerX) && nearNum(parsed.point.y, task.answerY)) {
        return finish(midpointPairText(task));
      }
      if (tagAx === "point" || parsed.tag) {
        return {
          ok: false,
          message:
            "הנקודה עדיין לא מדויקת. אמצע קטע: x = (x₁ + x₂)/2 ו־y = (y₁ + y₂)/2.",
        };
      }
    }

    var formula = parseMidpointFrac(typed);
    if (formula && formula.value != null) {
      if (!nearNum(formula.den, 2)) {
        return { ok: false, message: "בנוסחת האמצע המכנה הוא 2." };
      }
      var axF = midAxisFromFormula(formula, ends.a, ends.b);
      if (!axF && (tagAx === "x" || tagAx === "y")) axF = tagAx;
      if (!axF && formula.atomic) {
        if (!cf.x && nearNum(formula.value, task.answerX)) axF = "x";
        else if (!cf.y && nearNum(formula.value, task.answerY)) axF = "y";
        else if (!cf.x) axF = "x";
        else axF = "y";
      }
      if (!axF) {
        return {
          ok: false,
          message: "המספרים בנוסחה לא מתאימים לקצות הקטע. x = (x₁ + x₂)/2.",
        };
      }
      if (cf[axF] && formula.atomic && nearNum(formula.value, midpointWant(axF, task))) {
        return afterCoord(axF, midpointValText(axF, midpointWant(axF, task)));
      }
      if (cf[axF]) {
        return {
          ok: false,
          message: "את שיעור " + midpointAxisLhs(axF) + " כבר מצאתם. המשיכו לשיעור השני או רשמו את הנקודה.",
        };
      }
      if (!formula.atomic && !midCoordsMatch(formula, axF === "y" ? ends.a.y : ends.a.x, axF === "y" ? ends.b.y : ends.b.x)) {
        return {
          ok: false,
          message: "המספרים בנוסחה לא מתאימים לקצות הקטע. הציבו את שני שיעורי ה־" + midpointAxisLhs(axF) + ".",
        };
      }
      if (formula.atomic && !nearNum(formula.num.sum, (axF === "y" ? ends.a.y + ends.b.y : ends.a.x + ends.b.x))) {
        if (nearNum(formula.value, midpointWant(axF, task))) {
          return afterCoord(axF, midpointValText(axF, midpointWant(axF, task)));
        }
        return {
          ok: false,
          message: "המונה לא מתאים. חברו את שני שיעורי ה־" + midpointAxisLhs(axF) + ".",
        };
      }
      var prettyPlug = midpointPlugText(axF, ends.a, ends.b);
      var prettySum = midpointSumText(axF, ends.a, ends.b);
      var prettyFin = midpointValText(axF, midpointWant(axF, task));
      if (!formula.atomic) {
        if (prettySum === prettyFin) {
          return afterCoord(axF, prettyFin, "נכון. עכשיו אותו דבר לשיעור השני.");
        }
        return partial(prettyPlug, "נכון. עכשיו חברו את איברי המונה.");
      }
      if (prettySum === prettyFin || nearNum(formula.value, midpointWant(axF, task))) {
        if (nearNum(formula.num.sum, midpointWant(axF, task) * 2) && prettySum !== prettyFin) {
          return partial(prettySum, "נכון. עכשיו חלקו מונה במכנה.");
        }
        return afterCoord(axF, prettyFin);
      }
      return partial(prettySum, "נכון. עכשיו חלקו מונה במכנה.");
    }

    var abSpec = segmentLineFromEnds(ends.a, ends.b);
    if (abSpec && abSpec.vertical == null && !(cf.x && cf.y)) {
      var abLetters = midpointSegmentLetters(task);
      var sfAb2 = parseSlopeFormula(typed);
      var abSlopeOk = sfAb2 && classifySlopeFormula(sfAb2, ends.a, ends.b).kind === "ok";
      var abLet = lettersMatchMidSegment(slopeTagLetters(typed), task);
      var abMnum =
        parsed && parsed.value != null && isFinite(parsed.value) ? parsed.value : null;
      if (abSlopeOk || (abLet && (abMnum == null || nearNum(abMnum, abSpec.m)))) {
        if (abSlopeOk && !sfAb2.atomic) {
          return partial(
            prettySlopeFormula(sfAb2, { from: task.from, to: task.to, label: "m" }, typed) ||
              "m_{" + abLetters + "} = " + fmtNum(abSpec.m),
            "נכון. זה שיפוע " +
              abLetters +
              ". עכשיו משוואת הישר, הציבו את השיעור הידוע של האמצע, ומצאו את החסר. אפשר גם ישר את נוסחת האמצע."
          );
        }
        if (abMnum == null || nearNum(abMnum, abSpec.m) || (sfAb2 && sfAb2.atomic && nearNum(sfAb2.value, abSpec.m))) {
          return partial(
            "m_{" + abLetters + "} = " + fmtNum(abSpec.m),
            "נכון. עכשיו משוואת " +
              abLetters +
              " (נקודה ושיפוע), הציבו את השיעור הידוע של האמצע, ומצאו את השיעור החסר. אפשר גם ישר את נוסחת האמצע."
          );
        }
      }
      if (typedMatchesAbLine(typed, abSpec)) {
        var knownAx = cf.x ? "x" : cf.y ? "y" : "x";
        var knownV = cf.x ? task.answerX : cf.y ? task.answerY : task.answerX;
        return partial(
          prettyLineEq({ m: abSpec.m, b: abSpec.b }),
          "נכון. זו משוואת " +
            abLetters +
            ". הציבו " +
            knownAx +
            " = " +
            fmtNum(knownV) +
            " ומצאו את השיעור החסר."
        );
      }
      if (cf.x && !cf.y) {
        var shownAb = String(typed || "").replace(/[−–—]/g, "-");
        var plugAb = "y = " + substYRhs({ m: abSpec.m, b: abSpec.b }, task.answerX);
        if (yEqGivesCoord(shownAb, task.answerY)) {
          return afterCoord("y", midpointValText("y", task.answerY));
        }
        if (eqNormEqual(shownAb, plugAb) || linearEqEquivalent(shownAb, plugAb)) {
          return partial(shownAb, "נכון. עכשיו חשבו את y.");
        }
        var prevAb = maps.lastExpr[task.id] || "";
        if (/^y\s*=/i.test(prevAb) && /[xX]/.test(prevAb)) {
          var plugResAb = checkPlugYStep(prevAb, shownAb);
          if (plugResAb && plugResAb.ok) {
            if (yEqGivesCoord(shownAb, task.answerY) || isSolvedYText(typed)) {
              var yAb = evalMaybeExpr(lastEqStage(shownAb));
              if (yAb != null && nearNum(yAb, task.answerY)) {
                return afterCoord("y", midpointValText("y", task.answerY));
              }
            }
            return partial(shownAb, plugResAb.message || "צעד חוקי. המשיכו לחשב את y.");
          }
        }
      }
    }

    var gotVal =
      parsed && parsed.value != null && isFinite(parsed.value) ? parsed.value : null;
    if (gotVal != null) {
      var axN = tagAx === "x" || tagAx === "y" ? tagAx : "";
      if (!axN) {
        if (!cf.x && nearNum(gotVal, task.answerX) && !(nearNum(gotVal, task.answerY) && !cf.y && tagAx === "y")) {
          axN = "x";
        }
        if (!axN && !cf.y && nearNum(gotVal, task.answerY)) axN = "y";
        if (!axN && !cf.x && nearNum(gotVal, task.answerX)) axN = "x";
      }
      if (axN && nearNum(gotVal, midpointWant(axN, task))) {
        return afterCoord(axN, midpointValText(axN, midpointWant(axN, task)));
      }
      if (axN && !nearNum(gotVal, midpointWant(axN, task))) {
        return {
          ok: false,
          message:
            "שיעור ה־" +
            midpointAxisLhs(axN) +
            " עדיין לא מדויק. הציבו " +
            midpointAxisLhs(axN) +
            " = (" +
            midpointAxisLhs(axN) +
            "₁ + " +
            midpointAxisLhs(axN) +
            "₂)/2.",
        };
      }
    }

    if (tagAx === "point" || (parsed && parsed.kind === "point")) return null;
    return {
      ok: false,
      message:
        "הציבו x = (x₁ + x₂)/2 ו־y = (y₁ + y₂)/2, או רשמו ישר את נקודת האמצע.",
    };
  }

    function midpointKindHint(task) {
      if (task && task.mid) {
        return "הציבו את האמצע בנוסחה (למשל 3 = (1 + x)/2), הכפילו ב־2 ובודדו, או רשמו ישר את הקצה.";
      }
      return "הציבו x = (x₁ + x₂)/2 ו־y = (y₁ + y₂)/2, או רשמו ישר את נקודת האמצע.";
    }

    return {
      openFindMidpointTask: openFindMidpointTask,
      midpointSegmentLetters: midpointSegmentLetters,
      lettersMatchMidSegment: lettersMatchMidSegment,
      typedMatchesAbLine: typedMatchesAbLine,
      typedLooksLikeFindMidpoint: typedLooksLikeFindMidpoint,
      midpointPointName: midpointPointName,
      midpointEnds: midpointEnds,
      settleMidpointOnLineCoords: settleMidpointOnLineCoords,
      lineMidPairTasks: lineMidPairTasks,
      lineMidPairBlockedByPrior: lineMidPairBlockedByPrior,
      lineMidPairFocus: lineMidPairFocus,
      canonicalLineMidPairSteps: canonicalLineMidPairSteps,
      axisMidPairTasks: axisMidPairTasks,
      axisMidPairFocus: axisMidPairFocus,
      canonicalAxisMidPairSteps: canonicalAxisMidPairSteps,
      settleSkippedMidpointPairs: settleSkippedMidpointPairs,
      midpointNextHint: midpointNextHint,
      midpointAwaitingPair: midpointAwaitingPair,
      checkMidpoint: checkMidpoint,
      canonicalMidpointSteps: canonicalMidpointSteps,
      midpointKindHint: midpointKindHint,
      partPendingMidpoints: partPendingMidpoints,
      midpointPairText: midpointPairText,
      midpointOnAxis: midpointOnAxis,
      midpointLineVertical: midpointLineVertical,
      midpointLineHorizontal: midpointLineHorizontal,
      midpointLineIdentity: midpointLineIdentity,
      midpointOnLineSpec: midpointOnLineSpec
    };
  }

  global.DoctematicaGeoMidpoint = { install: install };
})(window);
