"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var isMigratedKind = require("./geo-lengths").isMigratedKind;
var packFor = require("./geo-lengths").packFor;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function emptyGeo() {
  return {
    done: {},
    partial: {},
    lastExpr: {},
    coords: {},
    footCoords: {},
    draw: null,
    pointRoute: {},
    lineEq: {},
    intersect: {},
    lineMatch: {},
  };
}

function applyRes(geo, res) {
  if (!res || !res.ok) return;
  if (res.done) geo.done = res.done;
  if (res.partial !== undefined) geo.partial = res.partial;
  if (res.lastExpr) geo.lastExpr = res.lastExpr;
  if (res.coords) geo.coords = res.coords;
  if (res.footCoords) geo.footCoords = res.footCoords;
  if (res.pointRoute) geo.pointRoute = res.pointRoute;
  if (res.lineEq) geo.lineEq = Object.assign({}, geo.lineEq || {}, res.lineEq);
  if (res.intersect) geo.intersect = Object.assign({}, geo.intersect || {}, res.intersect);
  if (res.lineMatch) geo.lineMatch = res.lineMatch;
  if (res.lineEqDisplay) geo.lineEqDisplay = res.lineEqDisplay;
}

function remainingRequired(pack, done) {
  return (pack.tasks || []).filter(function (t) {
    return !t.optional && !(done && done[t.id]);
  });
}

function capFor(kind) {
  if (kind === "area") return "areas";
  if (kind === "segment" || kind === "origin" || kind === "axis" || kind === "distSeg") return "lengths";
  if (kind === "lineEq") return "line-eq";
  return "points";
}

function walkExercise(engine, handler, levelId, ex) {
  var G = engine.DoctematicaGeometry;
  var pack = G.analyzeStart(ex);
  pack._levelId = levelId;
  var history = [];
  var geo = emptyGeo();
  var saw = [];
  var i;
  for (i = 0; i < 260; i++) {
    if (!remainingRequired(pack, geo.done).length) {
      return { ok: true, saw: saw, n: ex.n, history: history, geo: geo, pack: pack };
    }
    var h = G.nextHint(pack, geo);
    var kind = h && h.task && h.task.kind;
    saw.push((h && h.addHeight ? "addHeight:" : "") + (kind || "none"));
    if (h && (h.addHeight || (h.message && String(h.message).indexOf("+ גובה") >= 0))) {
      if (G.siteAddHeight) G.siteAddHeight(pack, geo, h.task);
      if (h.addHeight && !h.step) continue;
    }
    if (h && h.footCalc && h.step && !(h.task && isMigratedKind(h.task.kind, pack))) {
      var footRes = G.checkTyped(String(h.step), pack, geo);
      if (!footRes || !footRes.ok) {
        return fail("walk-foot:" + levelId + ":" + ex.n, (footRes && footRes.message) + " typed=" + h.step);
      }
      applyRes(geo, footRes);
      continue;
    }
    if (kind && isMigratedKind(kind, pack)) {
      var one = handler.handle({
        topic: "analytic",
        capability: capFor(kind),
        intent: "one-step",
        levelId: levelId,
        n: ex.n,
        history: history,
        geo: geo,
      });
      if (one && one.local) {
        return fail("walk-local-on-migrated:" + levelId + ":" + ex.n, JSON.stringify(one) + " saw=" + saw.join(">"));
      }
      if (one && one.addHeight) {
        if (G.siteAddHeight) G.siteAddHeight(pack, geo, h.task);
        continue;
      }
      if (!one || !one.ok || !one.step) {
        var skipCands = [];
        if (h.answer) skipCands.push(h.answer);
        if (h.step) skipCands.push(h.step);
        if (one && one.hint) skipCands.push(one.hint);
        if (h.task && h.task.kind === "onLine") skipCands.push(h.task.on ? "כן" : "לא");
        var skipped = null;
        var si;
        for (si = 0; si < skipCands.length; si++) {
          var chk = handler.handle({
            topic: "analytic",
            capability: capFor(kind),
            intent: "check",
            levelId: levelId,
            n: ex.n,
            history: history,
            geo: geo,
            typed: skipCands[si],
          });
          if (chk && chk.ok) {
            skipped = chk;
            skipped.step = skipCands[si];
            break;
          }
        }
        if (!skipped) {
          return fail("walk-stuck:" + levelId + ":" + ex.n, JSON.stringify(one) + " saw=" + saw.join(">"));
        }
        one = skipped;
      }
      applyRes(geo, one);
      history.push(one.step);
      if (one.solved && remainingRequired(pack, geo.done).length) {
        return fail("walk-early-solved:" + levelId + ":" + ex.n, JSON.stringify(geo.done) + " saw=" + saw.join(">"));
      }
      continue;
    }
    if (!h || !h.task) {
      return fail("walk-no-task:" + levelId + ":" + ex.n, (h && h.message) || "no task");
    }
    var ask = G.lineAsk && G.lineAsk(pack, geo);
    if (ask && ask.stage === "reason" && G.submitReason) {
      var reasonLine = h.step || (ask.choices && ask.choices[0]) || "";
      var reason = G.submitReason(reasonLine, pack, geo);
      if (reason && reason.ok) {
        applyRes(geo, reason);
        continue;
      }
    }
    var typed = h.rawStep ? h.step : h.step || h.answer;
    var localCands = [typed];
    if (h.answer && h.answer !== typed) localCands.push(h.answer);
    var cf = (geo.coords && h.task && geo.coords[h.task.id]) || {};
    if (h.task && h.task.kind === "onLine" && !(cf.x && cf.y)) {
      localCands.push(h.task.on ? "כן" : "לא");
    }
    if (h.task && h.task.kind === "point") {
      if (h.task.answerX != null) localCands.push("x = " + h.task.answerX);
      if (h.task.answerY != null) localCands.push("y = " + h.task.answerY);
      if (h.task.answerX != null && h.task.answerY != null) {
        localCands.push((h.task.label || h.task.point || "P") + "(" + h.task.answerX + ";" + h.task.answerY + ")");
      }
    }
    var local = null;
    var li;
    for (li = 0; li < localCands.length; li++) {
      if (!localCands[li]) continue;
      local = G.checkTyped(String(localCands[li]), pack, geo);
      if (local && local.ok) break;
    }
    if (!local || !local.ok) {
      return fail("walk-local:" + levelId + ":" + ex.n, (local && local.message) + " typed=" + typed + " kind=" + kind);
    }
    applyRes(geo, local);
  }
  return fail("walk-long:" + levelId + ":" + ex.n, saw.join(">"));
}

function walkBRoute(engine, handler, n) {
  var G = engine.DoctematicaGeometry;
  var pack = packFor(engine, "geo-line-eq-1", n);
  var task = pack.tasks.filter(function (t) {
    return t.kind === "lineEq";
  })[0];
  var history = [];
  var geo = emptyGeo();
  var first = handler.handle({
    topic: "analytic",
    capability: "line-eq",
    intent: "check",
    levelId: "geo-line-eq-1",
    n: n,
    history: history,
    geo: geo,
    typed: "y = 2x + b",
  });
  if (!first || !first.ok) return fail("b-first", JSON.stringify(first));
  applyRes(geo, first);
  history.push("y = 2x + b");
  var i;
  for (i = 0; i < 20; i++) {
    if (geo.done && geo.done[task.id]) {
      return { ok: true, history: history, geo: geo, display: geo.lineEqDisplay };
    }
    var one = handler.handle({
      topic: "analytic",
      capability: "line-eq",
      intent: "one-step",
      levelId: "geo-line-eq-1",
      n: n,
      history: history,
      geo: geo,
    });
    if (!one || !one.ok || !one.step) return fail("b-stuck", JSON.stringify(one) + " hist=" + history.join(" | "));
    applyRes(geo, one);
    history.push(one.step);
  }
  return fail("b-long", history.join(" | "));
}

function via(handler, payload) {
  return handler.handle(Object.assign({ topic: "analytic" }, payload));
}

function main() {
  var engine = loadEngine();
  var G = engine.DoctematicaGeometry;
  var handler = createGeometryHandler(engine);
  var passed = 0;
  var failed = [];
  function add(item) {
    if (item && item.ok) passed += 1;
    else failed.push(item);
  }

  var levels = engine.DoctematicaCurriculum.levels;
  var level = levels.filter(function (l) {
    return l.id === "geo-line-eq-1";
  })[0];
  add(
    level && level.exercises && level.exercises.length === 23
      ? { ok: true, id: "count-23" }
      : fail("count-23", String(level && level.exercises && level.exercises.length))
  );

  var lineEqCount = 0;
  (level.exercises || []).forEach(function (ex) {
    var pack = G.analyzeStart(ex);
    (pack.tasks || []).forEach(function (t) {
      if (t.kind === "lineEq") lineEqCount += 1;
    });
  });
  add(lineEqCount === 26 ? { ok: true, id: "lineEq-26" } : fail("lineEq-26", String(lineEqCount)));

  (level.exercises || []).forEach(function (ex) {
    var out = walkExercise(engine, handler, "geo-line-eq-1", ex);
    add(out.ok ? { ok: true, id: "full:geo-line-eq-1:" + ex.n } : out);
    if (out.ok) {
      var hasLocal = (out.pack.tasks || []).some(function (t) {
        return !isMigratedKind(t.kind, out.pack);
      });
      var sol = via(handler, {
        capability: "line-eq",
        intent: "solution",
        levelId: "geo-line-eq-1",
        n: ex.n,
        history: [],
        geo: {},
      });
      if (hasLocal) {
        add(sol && sol.local && sol.mixed ? { ok: true, id: "sol-mixed:" + ex.n } : fail("sol-mixed:" + ex.n, JSON.stringify(sol)));
      } else {
        add(
          sol && !sol.local && sol.steps && sol.steps.length
            ? { ok: true, id: "sol-server:" + ex.n }
            : fail("sol-server:" + ex.n, JSON.stringify(sol && { mixed: sol.mixed, n: sol.steps && sol.steps.length }))
        );
      }
      add(
        remainingRequired(out.pack, out.geo.done).length === 0
          ? { ok: true, id: "complete:" + ex.n }
          : fail("complete:" + ex.n, JSON.stringify(out.geo.done))
      );
    }
  });

  var psWalk = walkExercise(engine, handler, "geo-line-eq-1", level.exercises[0]);
  var bWalk = walkBRoute(engine, handler, 1);
  add(psWalk.ok ? { ok: true, id: "alt-ps-complete" } : psWalk);
  add(bWalk.ok ? { ok: true, id: "alt-b-complete" } : bWalk);
  if (psWalk.ok && bWalk.ok) {
    var psDisp = psWalk.geo.lineEqDisplay;
    var bDisp = bWalk.display || bWalk.geo.lineEqDisplay;
    add(
      psWalk.geo.done.eq && bWalk.geo.done.eq && String(psDisp) === String(bDisp)
        ? { ok: true, id: "alt-same-result" }
        : fail("alt-same-result", JSON.stringify({ ps: psDisp, b: bDisp, psHist: psWalk.history, bHist: bWalk.history }))
    );
  }

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoLineEqPage/.test(src) ? { ok: true, id: "hybrid-eq-gate" } : fail("hybrid-eq-gate", "missing"));
  add(
    /kind === "lineEq" && \(isGeoLineEqPage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\) \|\| isGeoMidpointPage\(\) \|\| isGeoPerpPage\(\) \|\| isGeoDistancePage\(\)\)/.test(src) ||
      /kind === "lineEq" && \(isGeoLineEqPage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\) \|\| isGeoMidpointPage\(\)\)/.test(src) ||
      /kind === "lineEq" && \(isGeoLineEqPage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\)\)/.test(src) ||
      /kind === "lineEq" && \(isGeoLineEqPage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoMidpointPage\(\)\)/.test(src) ||
      /kind === "lineEq" && \(isGeoLineEqPage\(\) \|\| isGeoParallelPage\(\)\)/.test(src) ||
      /\(isGeoLineEqPage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\) \|\| isGeoMidpointPage\(\) \|\| isGeoPerpPage\(\) \|\| isGeoDistancePage\(\)\) && kind === "lineEq"/.test(src) ||
      /\(isGeoLineEqPage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\) \|\| isGeoMidpointPage\(\)\) && kind === "lineEq"/.test(src) ||
      /\(isGeoLineEqPage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\)\) && kind === "lineEq"/.test(src) ||
      /\(isGeoLineEqPage\(\) \|\| isGeoParallelPage\(\)\) && kind === "lineEq"/.test(src)
      ? { ok: true, id: "hybrid-kind-gate" }
      : fail("hybrid-kind-gate", "kind not gated")
  );

  console.log("flow-geo-line-eq: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 40).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
