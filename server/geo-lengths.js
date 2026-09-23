"use strict";

var LENGTH_KINDS = { origin: true, segment: true, axis: true, distSeg: true };
var POINT_KINDS = { point: true, onLine: true, freePoint: true, noIntercept: true };
var POINT_PAGE_IDS = { "geo-line-points-1": true, "geo-line-axis-1": true };
var EXTRA_POINT_PAGE_IDS = {
  "geo-segments-1": true,
  "geo-triangle-area-1": true,
  "geo-rect-area-1": true,
  "geo-line-intersect-1": true,
  "geo-line-eq-1": true,
  "geo-slope-1": true,
};
var LINE_MB_PAGE_IDS = { "geo-line-mb-1": true };
var LINE_MATCH_PAGE_IDS = { "geo-line-match-1": true };
var LINE_INTERSECT_PAGE_IDS = { "geo-line-intersect-1": true };
var SUMMARY_PAGE_IDS = { "geo-line-summary-1": true };
var LINE_EQ_PAGE_IDS = { "geo-line-eq-1": true };
var SLOPE_PAGE_IDS = { "geo-slope-1": true };
var PARALLEL_PAGE_IDS = { "geo-parallel-1": true };
var AXIS_LINES_PAGE_IDS = { "geo-axis-lines-1": true };
var MIDPOINT_PAGE_IDS = { "geo-midpoint-1": true };
var PERP_PAGE_IDS = { "geo-perp-1": true };
var DISTANCE_PAGE_IDS = { "geo-distance-1": true };

function isLengthKind(kind) {
  return !!LENGTH_KINDS[String(kind || "")];
}

function isAreaKind(kind) {
  return String(kind || "") === "area";
}

function isPointKind(kind) {
  return !!POINT_KINDS[String(kind || "")];
}

function isLineMbKind(kind) {
  return String(kind || "") === "lineMb";
}

function isLineMatchKind(kind) {
  return String(kind || "") === "lineMatch";
}

function isLineIntersectKind(kind) {
  return String(kind || "") === "lineIntersect";
}

function isLineEqKind(kind) {
  return String(kind || "") === "lineEq";
}

function isSlopeKind(kind) {
  return String(kind || "") === "slope";
}

function isPointPageLevel(pack) {
  return !!(pack && POINT_PAGE_IDS[pack._levelId]);
}

function isLineMbPage(pack) {
  return !!(pack && LINE_MB_PAGE_IDS[pack._levelId]);
}

function isLineMatchPage(pack) {
  return !!(pack && LINE_MATCH_PAGE_IDS[pack._levelId]);
}

function isLineIntersectPage(pack) {
  return !!(pack && LINE_INTERSECT_PAGE_IDS[pack._levelId]);
}

function isSummaryPage(pack) {
  return !!(pack && SUMMARY_PAGE_IDS[pack._levelId]);
}

function isLineEqPage(pack) {
  return !!(pack && LINE_EQ_PAGE_IDS[pack._levelId]);
}

function isSlopePage(pack) {
  return !!(pack && SLOPE_PAGE_IDS[pack._levelId]);
}

function isParallelPage(pack) {
  return !!(pack && PARALLEL_PAGE_IDS[pack._levelId]);
}

function isAxisLinesPage(pack) {
  return !!(pack && AXIS_LINES_PAGE_IDS[pack._levelId]);
}

function isMidpointPage(pack) {
  return !!(pack && MIDPOINT_PAGE_IDS[pack._levelId]);
}

function isPerpPage(pack) {
  return !!(pack && PERP_PAGE_IDS[pack._levelId]);
}

function isDistancePage(pack) {
  return !!(pack && DISTANCE_PAGE_IDS[pack._levelId]);
}

function isMidpointKind(kind) {
  return String(kind || "") === "midpoint";
}

function isPerpKind(kind) {
  return String(kind || "") === "perpendicular";
}

function isPerpSlopeTask(task) {
  return !!(task && isSlopeKind(task.kind) && task.perpendicular);
}

function isDistanceKind(kind) {
  var k = String(kind || "");
  return k === "distance" || k === "equalLen" || k === "distUnknown" || k === "perimeter";
}

function isEqualLenKind(kind) {
  return String(kind || "") === "equalLen";
}

function isDistUnknownKind(kind) {
  return String(kind || "") === "distUnknown";
}

function isPerimeterKind(kind) {
  return String(kind || "") === "perimeter";
}

function isProveBisectTask(task) {
  return !!(task && isYesNoKind(task.kind) && task.proveBisect);
}

function isYesNoKind(kind) {
  return String(kind || "") === "yesNo";
}

function isAxisLineTask(task) {
  var a = String((task && task.axisParallel) || "").toLowerCase();
  return a === "x" || a === "h" || a === "y" || a === "v";
}

function isParallelKind(kind) {
  return String(kind || "") === "parallel";
}

function isExtraPointPage(pack) {
  return !!(pack && EXTRA_POINT_PAGE_IDS[pack._levelId]);
}

function isServerLineMatch(pack) {
  return isLineMatchPage(pack) || isSummaryPage(pack) || isParallelPage(pack) || isSlopePage(pack);
}

function isServerIntersect(pack) {
  return (
    isLineIntersectPage(pack) ||
    isSummaryPage(pack) ||
    isParallelPage(pack) ||
    isAxisLinesPage(pack) ||
    isMidpointPage(pack) ||
    isPerpPage(pack) ||
    isDistancePage(pack) ||
    isLineEqPage(pack) ||
    isSlopePage(pack)
  );
}

function isServerPoints(pack) {
  return (
    isPointPageLevel(pack) ||
    isExtraPointPage(pack) ||
    isSummaryPage(pack) ||
    isParallelPage(pack) ||
    isAxisLinesPage(pack) ||
    isMidpointPage(pack) ||
    isPerpPage(pack) ||
    isDistancePage(pack)
  );
}

function isMigratedKind(kind, pack) {
  if (isLengthKind(kind) || isAreaKind(kind)) return true;
  if (pack && isServerPoints(pack) && isPointKind(kind)) return true;
  if (pack && isLineMbPage(pack) && isLineMbKind(kind)) return true;
  if (pack && isServerLineMatch(pack) && isLineMatchKind(kind)) return true;
  if (pack && isServerIntersect(pack) && (isLineIntersectKind(kind) || String(kind || "") === "rearrange")) return true;
  if (pack && isLineEqPage(pack) && isLineEqKind(kind)) return true;
  if (pack && isSlopePage(pack) && (isSlopeKind(kind) || isLineEqKind(kind))) return true;
  if (pack && isParallelPage(pack)) {
    if (isParallelKind(kind) || isSlopeKind(kind) || isLineEqKind(kind) || isLineMbKind(kind)) return true;
    if (isPointKind(kind) || isLineIntersectKind(kind) || String(kind || "") === "rearrange") return true;
    if (isLineMatchKind(kind)) return true;
  }
  if (pack && isAxisLinesPage(pack)) {
    if (isLineEqKind(kind) || isYesNoKind(kind) || isSlopeKind(kind)) return true;
    if (isPointKind(kind) || isLineIntersectKind(kind) || String(kind || "") === "rearrange") return true;
  }
  if (pack && isMidpointPage(pack)) {
    if (isMidpointKind(kind)) return true;
    if (isPointKind(kind) || isSlopeKind(kind) || isLineEqKind(kind)) return true;
    if (isLineIntersectKind(kind) || String(kind || "") === "rearrange") return true;
    if (isYesNoKind(kind)) return true;
  }
  if (pack && isPerpPage(pack)) {
    if (isPerpKind(kind) || isSlopeKind(kind) || isLineEqKind(kind)) return true;
    if (isPointKind(kind) || isLineIntersectKind(kind) || String(kind || "") === "rearrange") return true;
    if (isMidpointKind(kind) || isYesNoKind(kind) || isParallelKind(kind)) return true;
  }
  if (pack && isDistancePage(pack)) {
    if (isDistanceKind(kind) || isSlopeKind(kind) || isLineEqKind(kind)) return true;
    if (isPointKind(kind) || isLineIntersectKind(kind) || String(kind || "") === "rearrange") return true;
    if (isMidpointKind(kind) || isPerpKind(kind)) return true;
  }
  return false;
}

function capabilityForFocus(pack, focus) {
  if (focus && isAreaKind(focus.kind)) return "areas";
  if (focus && isLengthKind(focus.kind)) return "lengths";
  if (focus && isServerPoints(pack) && isPointKind(focus.kind)) return "points";
  if (focus && isLineMbPage(pack) && isLineMbKind(focus.kind)) return "line-mb";
  if (focus && isServerLineMatch(pack) && isLineMatchKind(focus.kind)) return "line-match";
  if (focus && isServerIntersect(pack) && (isLineIntersectKind(focus.kind) || focus.kind === "rearrange")) return "line-intersect";
  if (focus && isLineEqPage(pack) && isPointKind(focus.kind)) return "points";
  if (focus && isLineEqPage(pack) && isLineEqKind(focus.kind)) return "line-eq";
  if (focus && isSlopePage(pack) && isLineMatchKind(focus.kind)) return "line-match";
  if (focus && isSlopePage(pack) && isPointKind(focus.kind)) return "points";
  if (focus && isSlopePage(pack) && isLineEqKind(focus.kind)) return "line-eq";
  if (focus && isSlopePage(pack) && isSlopeKind(focus.kind)) return "slope";
  if (focus && isParallelPage(pack) && isParallelKind(focus.kind)) return "parallel";
  if (focus && isParallelPage(pack) && isSlopeKind(focus.kind)) return "slope";
  if (focus && isParallelPage(pack) && isLineEqKind(focus.kind)) return "line-eq";
  if (focus && isParallelPage(pack) && isLineMbKind(focus.kind)) return "line-mb";
  if (focus && isParallelPage(pack) && isPointKind(focus.kind)) return "points";
  if (focus && isParallelPage(pack) && (isLineIntersectKind(focus.kind) || focus.kind === "rearrange")) return "line-intersect";
  if (focus && isParallelPage(pack) && isLineMatchKind(focus.kind)) return "line-match";
  if (focus && isAxisLinesPage(pack) && (isYesNoKind(focus.kind) || isAxisLineTask(focus))) return "axis-lines";
  if (focus && isAxisLinesPage(pack) && isLineEqKind(focus.kind)) return "line-eq";
  if (focus && isAxisLinesPage(pack) && isSlopeKind(focus.kind)) return "slope";
  if (focus && isMidpointPage(pack) && (isMidpointKind(focus.kind) || isProveBisectTask(focus))) return "midpoint";
  if (focus && isMidpointPage(pack) && isPointKind(focus.kind)) return "points";
  if (focus && isMidpointPage(pack) && isSlopeKind(focus.kind)) return "slope";
  if (focus && isMidpointPage(pack) && isLineEqKind(focus.kind)) return "line-eq";
  if (focus && isMidpointPage(pack) && (isLineIntersectKind(focus.kind) || focus.kind === "rearrange")) return "line-intersect";
  if (focus && (isPerpPage(pack) || isDistancePage(pack)) && isServerPoints(pack) && isPointKind(focus.kind)) return "points";
  if (focus && (isPerpPage(pack) || isDistancePage(pack)) && (isLineIntersectKind(focus.kind) || focus.kind === "rearrange")) {
    return "line-intersect";
  }
  if (focus && (isPerpPage(pack) || isDistancePage(pack)) && isAxisLineTask(focus)) return "axis-lines";
  if (focus && (isPerpPage(pack) || isDistancePage(pack)) && isLineEqKind(focus.kind)) return "line-eq";
  if (focus && (isPerpPage(pack) || isDistancePage(pack)) && isPerpSlopeTask(focus)) return "perpendicular";
  if (focus && (isPerpPage(pack) || isDistancePage(pack)) && isSlopeKind(focus.kind)) return "slope";
  if (focus && (isPerpPage(pack) || isDistancePage(pack)) && isMidpointKind(focus.kind)) return "midpoint";
  if (focus && isPerpPage(pack) && isYesNoKind(focus.kind)) return "axis-lines";
  if (focus && isPerpPage(pack) && isPerpKind(focus.kind)) return "perpendicular";
  if (focus && isDistancePage(pack) && isPerpKind(focus.kind)) return "perpendicular";
  if (focus && isDistancePage(pack) && isDistanceKind(focus.kind)) return "distance";
  if (isLineMatchPage(pack)) return "line-match";
  if (isLineMbPage(pack)) return "line-mb";
  if (isLineIntersectPage(pack)) return "line-intersect";
  if (isLineEqPage(pack)) return "line-eq";
  if (isSlopePage(pack)) return "slope";
  if (isParallelPage(pack)) return "parallel";
  if (isAxisLinesPage(pack)) return "axis-lines";
  if (isMidpointPage(pack)) return "midpoint";
  if (isPerpPage(pack)) return "perpendicular";
  if (isDistancePage(pack)) return "distance";
  if (isSummaryPage(pack)) return "points";
  return "lengths";
}

function findLevel(engine, levelId) {
  var levels = (engine.DoctematicaCurriculum && engine.DoctematicaCurriculum.levels) || [];
  var i;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === levelId) return levels[i];
  }
  return null;
}

function exerciseById(level, exerciseId) {
  var i;
  for (i = 0; i < level.exercises.length; i++) {
    if (level.exercises[i].id === exerciseId) {
      return { level: level, ex: level.exercises[i], index: i };
    }
  }
  return null;
}

function findExercise(engine, levelId, n, index, exerciseId) {
  var level = findLevel(engine, levelId);
  var id = exerciseId ? String(exerciseId) : "";
  if (id) {
    if (level) {
      var scoped = exerciseById(level, id);
      if (scoped) return scoped;
    }
    var levels = (engine.DoctematicaCurriculum && engine.DoctematicaCurriculum.levels) || [];
    var li;
    for (li = 0; li < levels.length; li++) {
      var globalHit = exerciseById(levels[li], id);
      if (globalHit) return globalHit;
    }
  }
  if (!level || !level.exercises) return null;
  if (typeof index === "number" && level.exercises[index]) {
    return { level: level, ex: level.exercises[index], index: index };
  }
  var i;
  var want = Number(n);
  for (i = 0; i < level.exercises.length; i++) {
    if (Number(level.exercises[i].n) === want) {
      return { level: level, ex: level.exercises[i], index: i };
    }
  }
  return null;
}

function packFor(engine, levelId, n, index, exerciseId) {
  var found = findExercise(engine, levelId, n, index, exerciseId);
  if (!found) return null;
  var pack = engine.DoctematicaGeometry.analyzeStart(found.ex);
  pack._levelId = found.level.id;
  pack._exerciseId = found.ex.id || null;
  pack._n = found.ex.n;
  return pack;
}

function isHistoryHeader(line) {
  return /^(סעיף:|משימה:|שאלה:)/.test(String(line || ""));
}

function copyMap(src) {
  var out = {};
  Object.keys(src || {}).forEach(function (k) {
    out[k] = src[k];
  });
  return out;
}

function seedNonLengthProgress(pack, geo) {
  geo = geo || {};
  var done = {};
  var partial = {};
  var lastExpr = {};
  var coords = {};
  (pack.tasks || []).forEach(function (t) {
    if (isMigratedKind(t.kind, pack)) return;
    if (geo.done && geo.done[t.id]) done[t.id] = true;
    if (geo.partial && geo.partial[t.id]) partial[t.id] = true;
    if (geo.lastExpr && geo.lastExpr[t.id] != null) lastExpr[t.id] = geo.lastExpr[t.id];
    if (geo.coords && geo.coords[t.id]) coords[t.id] = geo.coords[t.id];
  });
  var footCoords = {};
  Object.keys(geo.footCoords || {}).forEach(function (k) {
    footCoords[k] = geo.footCoords[k];
  });
  var pointRoute = {};
  Object.keys(geo.pointRoute || {}).forEach(function (k) {
    var t = (pack.tasks || []).filter(function (u) {
      return u.id === k;
    })[0];
    if (t && isMigratedKind(t.kind, pack)) return;
    pointRoute[k] = geo.pointRoute[k];
  });
  return {
    done: done,
    partial: partial,
    lastExpr: lastExpr,
    coords: coords,
    footCoords: footCoords,
    lineEq:
      isLineMatchPage(pack) ||
      isLineMbPage(pack) ||
      isLineIntersectPage(pack) ||
      isSummaryPage(pack) ||
      isLineEqPage(pack) ||
      isSlopePage(pack) ||
      isParallelPage(pack) ||
      isAxisLinesPage(pack) ||
      isMidpointPage(pack) ||
      isPerpPage(pack) ||
      isDistancePage(pack)
        ? {}
        : copyMap(geo.lineEq),
    intersect: isServerIntersect(pack)
      ? {}
      : geo.intersect && typeof geo.intersect === "object"
        ? geo.intersect
        : {},
    pointRoute: pointRoute,
    distUnk: isDistancePage(pack) ? {} : geo.distUnk && typeof geo.distUnk === "object" ? geo.distUnk : {},
    draw: geo.draw || null,
    mbRearranged: isLineMbPage(pack) || isParallelPage(pack) || isPerpPage(pack) ? false : !!geo.mbRearranged,
    mbRearrangeExpr: isLineMbPage(pack) || isParallelPage(pack) || isPerpPage(pack) ? null : geo.mbRearrangeExpr || null,
    lineEqDisplay:
      isLineMbPage(pack) ||
      isLineEqPage(pack) ||
      isSlopePage(pack) ||
      isParallelPage(pack) ||
      isAxisLinesPage(pack) ||
      isMidpointPage(pack) ||
      isPerpPage(pack) ||
      isDistancePage(pack)
        ? null
        : geo.lineEqDisplay || null,
    lineMatch: isServerLineMatch(pack) ? {} : copyMap(geo.lineMatch),
  };
}

function applyMigratedResult(pack, progress, res) {
  if (!res || !res.ok) return;
  var migratedTask = res.task && isMigratedKind(res.task.kind, pack);
  var mbPageHit =
    (isLineMbPage(pack) || isParallelPage(pack) || isPerpPage(pack) || isDistancePage(pack)) &&
    (res.mbRearranged || res.mbRearrangeExpr || res.lineEqDisplay);
  var matchHit = isServerLineMatch(pack) && (res.lineMatch || (res.task && isLineMatchKind(res.task.kind)));
  var intersectHit =
    isServerIntersect(pack) && (res.intersect || res.lineEq || (res.task && isLineIntersectKind(res.task.kind)));
  var lineEqHit =
    (isLineEqPage(pack) ||
      isSlopePage(pack) ||
      isParallelPage(pack) ||
      isAxisLinesPage(pack) ||
      isMidpointPage(pack) ||
      isPerpPage(pack) ||
      isDistancePage(pack)) &&
    (res.lineEqDisplay || res.lineEq || (res.task && isLineEqKind(res.task.kind)));
  var slopeSkipHit =
    (isSlopePage(pack) ||
      isParallelPage(pack) ||
      isAxisLinesPage(pack) ||
      isMidpointPage(pack) ||
      isPerpPage(pack) ||
      isDistancePage(pack)) &&
    res.done &&
    (pack.tasks || []).some(function (t) {
      return isSlopeKind(t.kind) && res.done[t.id];
    });
  var footHit = !!(res.footCoords && Object.keys(res.footCoords).length);
  var distUnkHit = isDistancePage(pack) && (res.distUnk || (res.task && isDistanceKind(res.task.kind)));
  if (!migratedTask && !mbPageHit && !matchHit && !intersectHit && !lineEqHit && !slopeSkipHit && !footHit && !distUnkHit) return;
  if (res.done) progress.done = res.done;
  if (res.partial) progress.partial = res.partial;
  if (res.lastExpr) progress.lastExpr = res.lastExpr;
  if (res.coords) progress.coords = res.coords;
  if (res.footCoords) progress.footCoords = res.footCoords;
  if (res.pointRoute) progress.pointRoute = res.pointRoute;
  if (res.distUnk) progress.distUnk = res.distUnk;
  if (res.mbRearranged) progress.mbRearranged = true;
  if (res.mbRearrangeExpr) progress.mbRearrangeExpr = res.mbRearrangeExpr;
  if (res.lineEqDisplay) progress.lineEqDisplay = res.lineEqDisplay;
  if (res.lineMatch) progress.lineMatch = res.lineMatch;
  if (res.lineEq) progress.lineEq = Object.assign({}, progress.lineEq || {}, res.lineEq);
  if (res.intersect) progress.intersect = Object.assign({}, progress.intersect || {}, res.intersect);
}

function parseMatchActionLine(line) {
  var m = String(line || "").match(/^lineMatch:(line|reason):([^:]+):(.+)$/);
  if (!m) return null;
  return { kind: m[1], taskId: m[2], value: m[3] };
}

function encodeMatchAction(action) {
  action = action || {};
  var type = String(action.type || "");
  if (type === "lineMatch.line") return "lineMatch:line:" + action.taskId + ":" + action.lineKey;
  if (type === "lineMatch.reason") return "lineMatch:reason:" + action.taskId + ":" + action.reasonId;
  return "";
}

function mergeMatchAuto(G, pack, progress, res) {
  if (!res || !res.ok || !G.lineMatchAutoCompleteRemaining || !res.done) return res;
  var auto = G.lineMatchAutoCompleteRemaining(pack, progress);
  if (!auto || !auto.length) return res;
  res.extraShow = (res.extraShow || []).concat(
    auto
      .map(function (a) {
        return a.show;
      })
      .filter(Boolean)
  );
  var last = auto[auto.length - 1];
  if (last.done) res.done = last.done;
  if (last.solved) res.solved = true;
  if (last.lineEq) res.lineEq = Object.assign({}, res.lineEq || {}, last.lineEq);
  if (last.lineMatch) res.lineMatch = last.lineMatch;
  return res;
}

function applyMatchAction(G, pack, progress, action) {
  action = action || {};
  var type = String(action.type || "");
  var res = null;
  if (type === "lineMatch.line" || (action.kind === "line" && action.taskId)) {
    res = G.submitLineMatchLine(action.taskId, action.lineKey || action.value, pack, progress);
  } else if (type === "lineMatch.reason" || (action.kind === "reason" && action.taskId)) {
    res = G.submitLineMatchReason(action.taskId, action.reasonId || action.value, pack, progress);
  } else {
    return { ok: false, message: "פעולה לא מוכרת." };
  }
  if (res && res.ok) applyMigratedResult(pack, progress, res);
  res = mergeMatchAuto(G, pack, progress, res);
  if (res && res.ok) {
    applyMigratedResult(pack, progress, res);
    res.lineMatch = progress.lineMatch;
  }
  return res;
}

function applyTypedProgress(G, pack, progress, typed) {
  var act = parseMatchActionLine(typed);
  if (act && isServerLineMatch(pack) && G.submitLineMatchLine) {
    return applyMatchAction(G, pack, progress, act);
  }
  var res = G.checkTyped(typed, pack, progress);
  if (res && res.ok) {
    applyMigratedResult(pack, progress, res);
    return res;
  }
  var ask = G.lineAsk && G.lineAsk(pack, progress);
  if (ask && ask.stage === "reason" && G.submitReason) {
    var reason = G.submitReason(typed, pack, progress);
    if (reason && reason.ok) {
      applyMigratedResult(pack, progress, reason);
      return reason;
    }
  }
  return res;
}

function reconstruct(engine, pack, history, geo) {
  var G = engine.DoctematicaGeometry;
  var progress = seedNonLengthProgress(pack, geo);
  var hist = Array.isArray(history) ? history : [];
  var i;
  for (i = 0; i < hist.length; i++) {
    var line = String(hist[i] || "").trim();
    if (!line || isHistoryHeader(line)) continue;
    applyTypedProgress(G, pack, progress, line);
  }
  return progress;
}

function slimTask(task) {
  if (!task) return null;
  return {
    id: task.id,
    kind: task.kind,
    label: task.label || "",
    from: task.from || null,
    to: task.to || null,
    point: task.point || null,
    optional: !!task.optional,
    fromArea: !!task.fromArea,
    drawHeight: !!task.drawHeight,
    heightFoot: task.heightFoot || null,
    intercept: task.intercept || null,
    missing: task.missing || null,
    axis: task.axis || null,
    on: task.on,
  };
}

function snapshotCheck(res) {
  res = res || {};
  var out = {
    ok: !!res.ok,
    message: String(res.message || ""),
    solved: !!res.solved,
    show: res.show || null,
    extraShow: res.extraShow || null,
    prefixShow: res.prefixShow || null,
    siteNote: res.siteNote || null,
    chain: !!res.chain,
    rawStep: !!res.rawStep,
    userStep: res.userStep || null,
    revealPoint: res.revealPoint || null,
    task: slimTask(res.task),
    done: res.done || {},
    partial: res.partial || {},
    lastExpr: res.lastExpr || {},
    coords: res.coords || {},
  };
  if (res.footCoords) out.footCoords = res.footCoords;
  if (res.pointRoute) out.pointRoute = res.pointRoute;
  if (res.lineEqDisplay) out.lineEqDisplay = res.lineEqDisplay;
  if (res.hint) out.hint = res.hint;
  if (res.plugStep) out.plugStep = true;
  if (res.reasonText) out.reasonText = res.reasonText;
  if (res.mbRearranged) out.mbRearranged = true;
  if (res.mbRearrangeExpr) out.mbRearrangeExpr = res.mbRearrangeExpr;
  if (res.lineEqDisplay) out.lineEqDisplay = res.lineEqDisplay;
  if (res.lineMatch) out.lineMatch = res.lineMatch;
  if (res.lineEq) out.lineEq = res.lineEq;
  if (res.lineMatchNote) out.lineMatchNote = res.lineMatchNote;
  if (res.intersect) out.intersect = res.intersect;
  if (res.distUnk) out.distUnk = res.distUnk;
  return out;
}

function snapshotHint(h) {
  h = h || {};
  return {
    ok: true,
    message: String(h.message || ""),
    step: h.step != null ? String(h.step) : "",
    addHeight: !!h.addHeight,
    footCalc: !!h.footCalc,
    rawStep: !!h.rawStep,
    task: slimTask(h.task),
  };
}

function allTasksAreMigrated(pack) {
  return (pack.tasks || []).every(function (t) {
    return isMigratedKind(t.kind, pack);
  });
}

function coordsForDone(pack, done) {
  var coords = {};
  (pack.tasks || []).forEach(function (t) {
    if (!done || !done[t.id]) return;
    if (isPointKind(t.kind) || t.kind === "onLine" || t.kind === "freePoint" || t.kind === "lineIntersect" || t.kind === "midpoint" || t.kind === "distUnknown") {
      coords[t.id] = { x: true, y: true };
    }
  });
  return coords;
}

function handleSetup(engine, pack, body) {
  var progress = reconstruct(engine, pack, body.history || [], body.geo || {});
  var G = engine.DoctematicaGeometry;
  var focus = G.currentFocusTask(pack, progress);
  if (!focus) {
    var pending = (pack.tasks || []).filter(function (t) {
      return !(progress.done && progress.done[t.id]);
    });
    focus = pending[0] || null;
  }
  return {
    ok: true,
    capability: capabilityForFocus(pack, focus),
    server: !!(focus && isMigratedKind(focus.kind, pack)),
    task: slimTask(focus),
    done: progress.done,
    partial: progress.partial,
    lastExpr: progress.lastExpr,
    coords: progress.coords,
    distUnk: progress.distUnk || {},
    solved: !(pack.tasks || []).some(function (t) {
      return !t.optional && !(progress.done && progress.done[t.id]);
    }),
  };
}

function handleCheck(engine, pack, body) {
  var G = engine.DoctematicaGeometry;
  var progress = reconstruct(engine, pack, body.history || [], body.geo || {});
  if (body.action && body.action.type) {
    if (!isServerLineMatch(pack)) {
      return { ok: false, local: true, message: "הפעולה שייכת למשימה שעדיין מקומית." };
    }
    return snapshotCheck(applyMatchAction(G, pack, progress, body.action));
  }
  var typed = String((body && body.typed) || "").trim();
  if (!typed) {
    return { ok: false, message: "כתבו תשובה או צעד." };
  }
  var res = applyTypedProgress(G, pack, progress, typed);
  if (res && res.ok && res.task && !isMigratedKind(res.task.kind, pack)) {
    return {
      ok: false,
      local: true,
      message: "הצעד שייך למשימה שעדיין מקומית.",
      task: slimTask(res.task),
    };
  }
  return snapshotCheck(res);
}

function localHint(h) {
  return {
    ok: true,
    local: true,
    footCalc: !!(h && h.footCalc),
    addHeight: !!(h && h.addHeight),
    task: slimTask(h && h.task),
    message: (h && h.message) || "",
    step: null,
  };
}

function handleHint(engine, pack, body) {
  var G = engine.DoctematicaGeometry;
  var progress = reconstruct(engine, pack, body.history || [], body.geo || {});
  var h = G.nextHint(pack, progress);
  if (h && h.footCalc && !(h.task && isMigratedKind(h.task.kind, pack)) && !allTasksAreMigrated(pack)) {
    return localHint(h);
  }
  if (h && h.task && !isMigratedKind(h.task.kind, pack)) {
    return localHint(h);
  }
  return snapshotHint(h);
}

function applyOneStepTyped(G, pack, progress, h, typed) {
  var res = applyTypedProgress(G, pack, progress, String(typed));
  if (res && res.ok) return { res: res, typed: String(typed) };
  var msg = String((res && res.message) || "");
  if (/גובה/.test(msg)) {
    return { addHeight: true, message: msg, task: h && h.task, res: res };
  }
  var alts = [];
  if (h && h.answer && String(h.answer) !== String(typed)) alts.push(h.answer);
  if (h && h.task && isLineEqKind(h.task.kind) && G.canonicalLineEqSteps) {
    alts = alts.concat(G.canonicalLineEqSteps(h.task) || []);
  }
  if (h && h.task && isLineIntersectKind(h.task.kind) && G.canonicalLineIntersectSteps) {
    alts = alts.concat(G.canonicalLineIntersectSteps(h.task, pack) || []);
  }
  var i;
  var beforeDone = JSON.stringify(progress.done || {});
  var beforeLast = JSON.stringify(progress.lastExpr || {});
  for (i = 0; i < alts.length; i++) {
    if (!alts[i] || String(alts[i]) === String(typed)) continue;
    var skip = applyTypedProgress(G, pack, progress, String(alts[i]));
    if (skip && skip.ok) {
      var progressed =
        JSON.stringify(progress.done || {}) !== beforeDone || JSON.stringify(progress.lastExpr || {}) !== beforeLast;
      if (progressed) return { res: skip, typed: String(alts[i]) };
    }
  }
  return { res: res, typed: String(typed) };
}

function handleOneStep(engine, pack, body) {
  var G = engine.DoctematicaGeometry;
  var progress = reconstruct(engine, pack, body.history || [], body.geo || {});
  if (isServerLineMatch(pack) && G.lineMatchPartActive && G.lineMatchPartActive(pack, progress) && G.lineMatchOneStep) {
    var lm = G.lineMatchOneStep(pack, progress);
    if (!lm) {
      var leftM = (pack.tasks || []).filter(function (t) {
        return !t.optional && !(progress.done && progress.done[t.id]);
      });
      return {
        ok: true,
        step: null,
        message: leftM.length ? "בחרו ישר ליד המשוואה." : "התרגיל כבר נפתר.",
        solved: !leftM.length,
        done: progress.done || {},
        lineMatch: progress.lineMatch || {},
      };
    }
    var act =
      lm.action === "line"
        ? { type: "lineMatch.line", taskId: lm.taskId, lineKey: lm.lineKey }
        : { type: "lineMatch.reason", taskId: lm.taskId, reasonId: lm.reasonId };
    var matchRes = applyMatchAction(G, pack, progress, act);
    var matchOut = snapshotCheck(matchRes);
    matchOut.step = encodeMatchAction(act);
    matchOut.matchAction = act;
    matchOut.solved = !!matchRes.solved;
    return matchOut;
  }
  var h = G.nextHint(pack, progress);
  if (h && h.footCalc && !(h.task && isMigratedKind(h.task.kind, pack)) && !allTasksAreMigrated(pack)) {
    if (!((isAxisLinesPage(pack) || isMidpointPage(pack) || isPerpPage(pack) || isDistancePage(pack)) && (h.step || h.answer))) {
      return localHint(h);
    }
  }
  if (h && h.task && !isMigratedKind(h.task.kind, pack)) {
    return localHint(h);
  }
  if (h && h.addHeight) {
    var heightOut = snapshotHint(h);
    heightOut.step = null;
    return heightOut;
  }
  if (h && h.footCalc && (h.step || h.answer) && (allTasksAreMigrated(pack) || isAxisLinesPage(pack) || isMidpointPage(pack) || isPerpPage(pack) || isDistancePage(pack))) {
    var footTyped = h.rawStep ? h.step : h.step || h.answer;
    var footRes = applyTypedProgress(G, pack, progress, String(footTyped));
    var footOut = snapshotCheck(footRes);
    footOut.step = String(footTyped);
    return footOut;
  }
  if (!h || !h.task) {
    return { ok: true, step: null, message: (h && h.message) || "התרגיל כבר נפתר.", solved: false };
  }
  var typed = h.step || h.answer;
  if (h.rawStep) typed = h.step;
  if (
    progress.partial &&
    h.task &&
    progress.partial[h.task.id] &&
    isLengthKind(h.task.kind) &&
    !h.task.fromArea
  ) {
    var tag = String(h.task.label || "").replace(/→/g, "").replace(/->/g, "");
    typed = tag + "=" + (h.answer || h.step);
  }
  if (!typed) {
    return { ok: true, step: null, message: h.message || "", addHeight: !!h.addHeight, solved: false };
  }
  var applied = applyOneStepTyped(G, pack, progress, h, typed);
  if (applied.addHeight) {
    return {
      ok: true,
      addHeight: true,
      step: null,
      message: applied.message || h.message || "",
      task: slimTask(applied.task || h.task),
    };
  }
  var out = snapshotCheck(applied.res);
  out.step = String(applied.typed);
  out.hintMessage = h.message || "";
  return out;
}

function solutionLinesForTask(G, task, pack) {
  if (isMidpointKind(task.kind) && G.canonicalMidpointSteps) {
    var midLines = G.canonicalMidpointSteps(task, pack, {}) || [];
    if (midLines.length) return midLines;
  }
  if (isPerpKind(task.kind) && G.canonicalPerpendicularSteps) {
    var perpLines = G.canonicalPerpendicularSteps(task, pack) || [];
    if (perpLines.length) return perpLines;
  }
  if (isDistanceKind(task.kind) && task.kind === "distance" && G.canonicalDistanceSteps) {
    var distLines = G.canonicalDistanceSteps(task, pack) || [];
    if (distLines.length) return distLines;
  }
  if (isDistUnknownKind(task.kind) && G.canonicalDistUnknownSteps) {
    var unkLines = G.canonicalDistUnknownSteps(task, pack) || [];
    if (unkLines.length) return unkLines;
  }
  if (isPerimeterKind(task.kind) && G.canonicalPerimeterSteps) {
    var periLines = G.canonicalPerimeterSteps(task, pack) || [];
    if (periLines.length) return periLines;
  }
  if (isEqualLenKind(task.kind)) {
    var segs = task.segs || [];
    return [segs.length >= 2 ? String(segs[0]).toUpperCase() + "=" + String(segs[1]).toUpperCase() : "AB=BC"];
  }
  if (isAreaKind(task.kind) && G.canonicalAreaSteps) {
    var areaLines = G.canonicalAreaSteps(task, pack.map) || [];
    if (areaLines.length) return areaLines;
  }
  if ((task.kind === "onLine" || task.kind === "freePoint") && G.canonicalOnLineSteps) {
    var onLines = G.canonicalOnLineSteps(task, pack) || [];
    if (onLines.length) return onLines;
  }
  if ((task.kind === "point" || task.kind === "noIntercept") && G.canonicalLineSteps) {
    var ptLines = G.canonicalLineSteps(task, pack) || [];
    if (ptLines.length) return ptLines;
  }
  if (isLineMbKind(task.kind) && G.canonicalLineMbSteps) {
    var mbLines = G.canonicalLineMbSteps(task, pack) || [];
    if (mbLines.length) return mbLines;
  }
  if (isLineIntersectKind(task.kind) && G.canonicalLineIntersectSteps) {
    var isectLines = G.canonicalLineIntersectSteps(task, pack) || [];
    if (isectLines.length) return isectLines;
  }
  if (isLineEqKind(task.kind) && G.canonicalLineEqSteps) {
    var eqLines = G.canonicalLineEqSteps(task) || [];
    if (eqLines.length) return eqLines;
  }
  if (isSlopeKind(task.kind) && task.perpendicular && G.canonicalPerpSlopeSteps) {
    var perpSl = G.canonicalPerpSlopeSteps(task, pack) || [];
    if (perpSl.length) return perpSl;
  }
  if (isSlopeKind(task.kind) && G.canonicalSlopeSteps) {
    var slLines = G.canonicalSlopeSteps(task, pack) || [];
    if (slLines.length) return slLines;
  }
  if (isParallelKind(task.kind) && G.canonicalParallelSteps) {
    var parLines = G.canonicalParallelSteps(task, pack) || [];
    if (parLines.length) return parLines;
  }
  if (isYesNoKind(task.kind)) {
    return [task.answer ? "כן" : "לא"];
  }
  if (isLineMatchKind(task.kind)) {
    var eqLab = task.eqNum ? "(" + task.eqNum + ") " : "";
    if (task.answerKey === "none") return [eqLab + (task.eqText || "") + " → לא שייך"];
    var label =
      G.lineMatchLineLabel && pack
        ? G.lineMatchLineLabel(pack, task.answerKey)
        : task.answerKey;
    return [eqLab + (task.eqText || "") + " → ישר " + label];
  }
  if (isLengthKind(task.kind) && G.canonicalDiffChain) {
    return [G.canonicalDiffChain(task, pack.map)];
  }
  return [G.canonicalStep(task, pack.map)];
}

function handleSolution(engine, pack, body) {
  var G = engine.DoctematicaGeometry;
  if (!allTasksAreMigrated(pack)) {
    return { ok: true, mixed: true, local: true, message: "התרגיל מעורב; הפתרון המלא נשאר מקומי." };
  }
  var lines = [];
  var done = {};
  (pack.parts || []).forEach(function (part) {
    if (part.label) lines.push("סעיף:" + part.label);
    else if (String(part.text || "").trim()) lines.push("שאלה:" + String(part.text).trim());
    if (G.canonicalGivenLineRearrangeSteps) {
      var rearrLines = G.canonicalGivenLineRearrangeSteps(pack) || [];
      if (rearrLines.length && (part.taskIds || []).some(function (id) {
        var tt = (pack.tasks || []).filter(function (u) { return u.id === id; })[0];
        return tt && (tt.kind === "lineIntersect" || tt.kind === "slope" || tt.kind === "lineEq");
      })) {
        lines.push("משימה:סידור משוואת הישר");
        rearrLines.forEach(function (line) {
          if (line) lines.push(line);
        });
      }
    }
    (part.taskIds || []).forEach(function (id) {
      var task = (pack.tasks || []).filter(function (t) {
        return t.id === id;
      })[0];
      if (!task) return;
      done[task.id] = true;
      var pairSol = G.axisMidPairTasks && G.axisMidPairTasks(pack, {});
      var pairSolL = G.lineMidPairTasks && G.lineMidPairTasks(pack, {});
      if (pairSol && (task.id === pairSol.yEnd.id || task.id === pairSol.xEnd.id)) {
        if (task.id === pairSol.yEnd.id && G.canonicalAxisMidPairSteps) {
          G.canonicalAxisMidPairSteps(pack, {}).forEach(function (line) {
            if (line) lines.push(line);
          });
        }
        return;
      }
      if (pairSolL && (task.id === pairSolL.yEnd.id || task.id === pairSolL.xEnd.id)) {
        if (task.id === pairSolL.yEnd.id && G.canonicalLineMidPairSteps) {
          G.canonicalLineMidPairSteps(pack, {}).forEach(function (line) {
            if (line) lines.push(line);
          });
        }
        return;
      }
      if (G.taskStepLabel && G.partStepByTask && G.partStepByTask(part, pack)) {
        var head = G.taskStepLabel(task);
        if (head) lines.push("משימה:" + head);
      }
      solutionLinesForTask(G, task, pack).forEach(function (line) {
        if (line) lines.push(line);
      });
    });
  });
  if (!pack.parts || !pack.parts.length) {
    (pack.tasks || []).forEach(function (task) {
      done[task.id] = true;
      solutionLinesForTask(G, task, pack).forEach(function (line) {
        if (line) lines.push(line);
      });
    });
  }
  return {
    ok: true,
    mixed: false,
    solved: true,
    steps: lines,
    done: done,
    partial: {},
    coords: coordsForDone(pack, done),
    mbRearranged: !!(isLineMbPage(pack) && pack.line && G.lineMbNeedsUnsorted && G.lineMbNeedsUnsorted(pack.line)),
    lineEqDisplay:
      isLineMbPage(pack) && pack.line && G.sortedLineEq && G.lineMbNeedsUnsorted && G.lineMbNeedsUnsorted(pack.line)
        ? G.sortedLineEq(pack.line)
        : undefined,
  };
}

function overlayProgress(progress, result) {
  if (!result) return progress;
  if (result.done) progress.done = result.done;
  if (result.partial) progress.partial = result.partial;
  if (result.lastExpr) progress.lastExpr = result.lastExpr;
  if (result.coords) progress.coords = result.coords;
  if (result.footCoords) progress.footCoords = result.footCoords;
  if (result.lineEq) progress.lineEq = result.lineEq;
  if (result.lineMatch) progress.lineMatch = result.lineMatch;
  if (result.intersect) progress.intersect = result.intersect;
  if (result.distUnk) progress.distUnk = result.distUnk;
  if (result.pointRoute) progress.pointRoute = result.pointRoute;
  if (result.draw) progress.draw = result.draw;
  if (result.mbRearranged) progress.mbRearranged = true;
  if (result.mbRearrangeExpr) progress.mbRearrangeExpr = result.mbRearrangeExpr;
  if (result.lineEqDisplay) progress.lineEqDisplay = result.lineEqDisplay;
  return progress;
}

function progressForView(engine, pack, body, result) {
  var geoCopy = {};
  try {
    geoCopy = JSON.parse(JSON.stringify((body && body.geo) || {}));
  } catch (err) {
    geoCopy = {};
  }
  var progress = reconstruct(engine, pack, (body && body.history) || [], geoCopy);
  overlayProgress(progress, result);
  if (result && result.addHeight && engine.DoctematicaGeometry.siteAddHeight) {
    var task = result.task;
    var full =
      task &&
      (pack.tasks || []).filter(function (t) {
        return t.id === task.id;
      })[0];
    engine.DoctematicaGeometry.siteAddHeight(pack, progress, full || task);
  }
  return progress;
}

function attachDistQuadOffers(engine, pack, result) {
  if (!result || result.error || !pack) return;
  var Q = engine.DoctematicaQuadratic;
  if (!Q || typeof Q.isAbcOrder !== "function" || typeof Q.parseABC !== "function") return;
  var task = null;
  (pack.tasks || []).some(function (t) {
    if (String(t.kind || "") === "distUnknown" && !(result.done && result.done[t.id])) {
      task = t;
      return true;
    }
    return false;
  });
  if (!task) return;
  var st = result.distUnk && result.distUnk[task.id];
  var eq = result.lastExpr && result.lastExpr[task.id];
  if (!st || !st.squared || !eq || /√|sqrt/i.test(String(eq))) {
    result.offerFormula = false;
    result.canSplit = false;
    return;
  }
  var letter = String(st.letter || "x");
  var asX = String(eq);
  if (letter.toLowerCase() !== "x") {
    var esc = letter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    asX = asX.replace(new RegExp("(?<![A-Za-z_])" + esc + "(?![A-Za-z])", "gi"), "x");
  }
  var offer = false;
  try {
    if (Q.isAbcOrder(asX)) {
      var parsed = Q.parseABC(asX);
      offer = !!(parsed && parsed.a);
    }
  } catch (errOffer) {
    offer = false;
  }
  result.offerFormula = offer;
  var split = false;
  try {
    split = typeof Q.isProductEq === "function" && Q.isProductEq(asX);
  } catch (errSplit) {
    split = false;
  }
  result.canSplit = !!split;
}

function handleLengths(engine, body) {
  var pack = packFor(engine, body.levelId, body.n, body.exerciseIndex, body.exerciseId);
  if (!pack) {
    return { error: "unknown exercise", message: "unknown exercise" };
  }
  var intent = String(body.intent || "");
  var result;
  if (intent === "setup") result = handleSetup(engine, pack, body);
  else if (intent === "check") result = handleCheck(engine, pack, body);
  else if (intent === "hint") result = handleHint(engine, pack, body);
  else if (intent === "one-step") result = handleOneStep(engine, pack, body);
  else if (intent === "solution") result = handleSolution(engine, pack, body);
  else return { error: "unknown intent", message: "unknown intent" };
  attachDistQuadOffers(engine, pack, result);
  if (result && !result.error) {
    try {
      result.view = require("./student-dto").buildClientView(
        engine,
        pack,
        progressForView(engine, pack, body, result)
      );
    } catch (err) {
      result.view = null;
    }
  }
  return result;
}

module.exports = {
  handleLengths: handleLengths,
  handleAreas: handleLengths,
  handlePoints: handleLengths,
  isLengthKind: isLengthKind,
  isAreaKind: isAreaKind,
  isPointKind: isPointKind,
  isPointPageLevel: isPointPageLevel,
  isMigratedKind: isMigratedKind,
  packFor: packFor,
  reconstruct: reconstruct,
  LENGTH_KINDS: LENGTH_KINDS,
  POINT_PAGE_IDS: POINT_PAGE_IDS,
  EXTRA_POINT_PAGE_IDS: EXTRA_POINT_PAGE_IDS,
  LINE_MB_PAGE_IDS: LINE_MB_PAGE_IDS,
  LINE_MATCH_PAGE_IDS: LINE_MATCH_PAGE_IDS,
  LINE_INTERSECT_PAGE_IDS: LINE_INTERSECT_PAGE_IDS,
  SUMMARY_PAGE_IDS: SUMMARY_PAGE_IDS,
  LINE_EQ_PAGE_IDS: LINE_EQ_PAGE_IDS,
  SLOPE_PAGE_IDS: SLOPE_PAGE_IDS,
  isLineEqPage: isLineEqPage,
  isLineEqKind: isLineEqKind,
  isSlopePage: isSlopePage,
  isSlopeKind: isSlopeKind,
  isParallelPage: isParallelPage,
  isParallelKind: isParallelKind,
  isAxisLinesPage: isAxisLinesPage,
  isAxisLineTask: isAxisLineTask,
  isYesNoKind: isYesNoKind,
  capabilityForFocus: capabilityForFocus,
  PARALLEL_PAGE_IDS: PARALLEL_PAGE_IDS,
  AXIS_LINES_PAGE_IDS: AXIS_LINES_PAGE_IDS,
  MIDPOINT_PAGE_IDS: MIDPOINT_PAGE_IDS,
  isMidpointPage: isMidpointPage,
  isMidpointKind: isMidpointKind,
  isPerpPage: isPerpPage,
  isDistancePage: isDistancePage,
  isPerpKind: isPerpKind,
  isDistanceKind: isDistanceKind,
  PERP_PAGE_IDS: PERP_PAGE_IDS,
  DISTANCE_PAGE_IDS: DISTANCE_PAGE_IDS,
};
