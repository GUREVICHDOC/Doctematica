"use strict";

var LENGTH_KINDS = { origin: true, segment: true, axis: true, distSeg: true };
var POINT_KINDS = { point: true, onLine: true, freePoint: true, noIntercept: true };
var POINT_PAGE_IDS = { "geo-line-points-1": true, "geo-line-axis-1": true };
var LINE_MB_PAGE_IDS = { "geo-line-mb-1": true };
var LINE_MATCH_PAGE_IDS = { "geo-line-match-1": true };

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

function isPointPageLevel(pack) {
  return !!(pack && POINT_PAGE_IDS[pack._levelId]);
}

function isLineMbPage(pack) {
  return !!(pack && LINE_MB_PAGE_IDS[pack._levelId]);
}

function isLineMatchPage(pack) {
  return !!(pack && LINE_MATCH_PAGE_IDS[pack._levelId]);
}

function isMigratedKind(kind, pack) {
  if (isLengthKind(kind) || isAreaKind(kind)) return true;
  if (pack && isPointPageLevel(pack) && isPointKind(kind)) return true;
  if (pack && isLineMbPage(pack) && isLineMbKind(kind)) return true;
  if (pack && isLineMatchPage(pack) && isLineMatchKind(kind)) return true;
  return false;
}

function capabilityForFocus(pack, focus) {
  if (focus && isAreaKind(focus.kind)) return "areas";
  if (focus && isPointPageLevel(pack) && isPointKind(focus.kind)) return "points";
  if (focus && isLineMbPage(pack) && isLineMbKind(focus.kind)) return "line-mb";
  if (focus && isLineMatchPage(pack) && isLineMatchKind(focus.kind)) return "line-match";
  if (isLineMatchPage(pack)) return "line-match";
  if (isLineMbPage(pack)) return "line-mb";
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

function findExercise(engine, levelId, n, index) {
  var level = findLevel(engine, levelId);
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

function packFor(engine, levelId, n, index) {
  var found = findExercise(engine, levelId, n, index);
  if (!found) return null;
  var pack = engine.DoctematicaGeometry.analyzeStart(found.ex);
  pack._levelId = found.level.id;
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
    lineEq: isLineMatchPage(pack) || isLineMbPage(pack) ? {} : copyMap(geo.lineEq),
    intersect: geo.intersect && typeof geo.intersect === "object" ? geo.intersect : {},
    pointRoute: pointRoute,
    distUnk: geo.distUnk && typeof geo.distUnk === "object" ? geo.distUnk : {},
    draw: geo.draw || null,
    mbRearranged: isLineMbPage(pack) ? false : !!geo.mbRearranged,
    mbRearrangeExpr: isLineMbPage(pack) ? null : geo.mbRearrangeExpr || null,
    lineEqDisplay: isLineMbPage(pack) ? null : geo.lineEqDisplay || null,
    lineMatch: isLineMatchPage(pack) ? {} : copyMap(geo.lineMatch),
  };
}

function applyMigratedResult(pack, progress, res) {
  if (!res || !res.ok) return;
  var migratedTask = res.task && isMigratedKind(res.task.kind, pack);
  var mbPageHit =
    isLineMbPage(pack) && (res.mbRearranged || res.mbRearrangeExpr || res.lineEqDisplay);
  var matchHit = isLineMatchPage(pack) && (res.lineMatch || (res.task && isLineMatchKind(res.task.kind)));
  if (!migratedTask && !mbPageHit && !matchHit) return;
  if (res.done) progress.done = res.done;
  if (res.partial) progress.partial = res.partial;
  if (res.lastExpr) progress.lastExpr = res.lastExpr;
  if (res.coords) progress.coords = res.coords;
  if (res.footCoords) progress.footCoords = res.footCoords;
  if (res.pointRoute) progress.pointRoute = res.pointRoute;
  if (res.mbRearranged) progress.mbRearranged = true;
  if (res.mbRearrangeExpr) progress.mbRearrangeExpr = res.mbRearrangeExpr;
  if (res.lineEqDisplay) progress.lineEqDisplay = res.lineEqDisplay;
  if (res.lineMatch) progress.lineMatch = res.lineMatch;
  if (res.lineEq) progress.lineEq = Object.assign({}, progress.lineEq || {}, res.lineEq);
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
  if (act && isLineMatchPage(pack) && G.submitLineMatchLine) {
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
    if (isPointKind(t.kind) || t.kind === "onLine" || t.kind === "freePoint") {
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
    solved: !(pack.tasks || []).some(function (t) {
      return !t.optional && !(progress.done && progress.done[t.id]);
    }),
  };
}

function handleCheck(engine, pack, body) {
  var G = engine.DoctematicaGeometry;
  var progress = reconstruct(engine, pack, body.history || [], body.geo || {});
  if (body.action && body.action.type) {
    if (!isLineMatchPage(pack)) {
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
  if (h && h.footCalc && !(h.task && isMigratedKind(h.task.kind, pack))) {
    return localHint(h);
  }
  if (h && h.task && !isMigratedKind(h.task.kind, pack)) {
    return localHint(h);
  }
  return snapshotHint(h);
}

function handleOneStep(engine, pack, body) {
  var G = engine.DoctematicaGeometry;
  var progress = reconstruct(engine, pack, body.history || [], body.geo || {});
  if (isLineMatchPage(pack) && G.lineMatchPartActive && G.lineMatchPartActive(pack, progress) && G.lineMatchOneStep) {
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
  if (h && h.footCalc && !(h.task && isMigratedKind(h.task.kind, pack))) {
    return localHint(h);
  }
  if (h && h.task && !isMigratedKind(h.task.kind, pack)) {
    return localHint(h);
  }
  if (h && h.addHeight) {
    var heightOut = snapshotHint(h);
    heightOut.step = null;
    return heightOut;
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
  var res = applyTypedProgress(G, pack, progress, String(typed));
  var out = snapshotCheck(res);
  out.step = String(typed);
  out.hintMessage = h.message || "";
  return out;
}

function solutionLinesForTask(G, task, pack) {
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
    (part.taskIds || []).forEach(function (id) {
      var task = (pack.tasks || []).filter(function (t) {
        return t.id === id;
      })[0];
      if (!task) return;
      done[task.id] = true;
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

function handleLengths(engine, body) {
  var pack = packFor(engine, body.levelId, body.n, body.exerciseIndex);
  if (!pack) {
    return { error: "unknown exercise", message: "unknown exercise" };
  }
  var intent = String(body.intent || "");
  if (intent === "setup") return handleSetup(engine, pack, body);
  if (intent === "check") return handleCheck(engine, pack, body);
  if (intent === "hint") return handleHint(engine, pack, body);
  if (intent === "one-step") return handleOneStep(engine, pack, body);
  if (intent === "solution") return handleSolution(engine, pack, body);
  return { error: "unknown intent", message: "unknown intent" };
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
  LINE_MB_PAGE_IDS: LINE_MB_PAGE_IDS,
  LINE_MATCH_PAGE_IDS: LINE_MATCH_PAGE_IDS,
};
