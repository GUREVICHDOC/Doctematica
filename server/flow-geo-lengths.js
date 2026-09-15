"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var isLengthKind = require("./geo-lengths").isLengthKind;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function emptyGeo() {
  return { done: {}, partial: {}, lastExpr: {}, coords: {} };
}

function applyRes(geo, res) {
  if (!res || !res.ok) return;
  if (res.done) geo.done = res.done;
  if (res.partial) geo.partial = res.partial;
  if (res.lastExpr) geo.lastExpr = res.lastExpr;
  if (res.coords) geo.coords = res.coords;
}

function remainingRequired(pack, done) {
  return (pack.tasks || []).filter(function (t) {
    return !t.optional && !(done && done[t.id]);
  });
}

function walkExercise(engine, handler, levelId, ex) {
  var G = engine.DoctematicaGeometry;
  var pack = G.analyzeStart(ex);
  var history = [];
  var geo = emptyGeo();
  var saw = [];
  var i;
  for (i = 0; i < 80; i++) {
    if (!remainingRequired(pack, geo.done).length) {
      return { ok: true, saw: saw, n: ex.n, history: history, geo: geo };
    }
    var h = G.nextHint(pack, geo);
    var kind = h && h.task && h.task.kind;
    saw.push(kind || "none");
    if (kind && isLengthKind(kind)) {
      var one = handler.handle({
        topic: "analytic",
        capability: "lengths",
        intent: "one-step",
        levelId: levelId,
        n: ex.n,
        history: history,
        geo: geo,
      });
      if (one && one.local) {
        return fail("walk-local-on-length:" + levelId + ":" + ex.n, JSON.stringify(one));
      }
      if (one && one.addHeight) {
        if (G.siteAddHeight) G.siteAddHeight(pack, geo, h.task);
        continue;
      }
      if (!one || !one.step || !one.ok) {
        return fail("walk-length:" + levelId + ":" + ex.n, JSON.stringify(one) + " hint=" + (h && h.message));
      }
      applyRes(geo, one);
      history.push(one.step);
      continue;
    }
    if (!h || !h.task) return fail("walk-stuck:" + levelId + ":" + ex.n, (h && h.message) || "no task");
    var typed = h.step || h.answer;
    if (h.rawStep) typed = h.step;
    var local = G.checkTyped(String(typed), pack, geo);
    if (!local || !local.ok) {
      return fail("walk-local:" + levelId + ":" + ex.n, (local && local.message) + " typed=" + typed + " kind=" + kind);
    }
    applyRes(geo, local);
    if (local.show) history.push(local.show);
    else history.push(String(typed));
  }
  return fail("walk-long:" + levelId + ":" + ex.n, saw.join(">"));
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
  var segLevel = levels.filter(function (l) {
    return l.id === "geo-segments-1";
  })[0];
  (segLevel.exercises || []).forEach(function (ex) {
    var out = walkExercise(engine, handler, "geo-segments-1", ex);
    add(out.ok ? { ok: true, id: "full-seg:" + ex.n } : out);
  });

  var triLevel = levels.filter(function (l) {
    return l.id === "geo-triangle-area-1";
  })[0];
  var tri1 = triLevel.exercises[0];
  var packT = G.analyzeStart(tri1);
  var geoT = emptyGeo();
  var histT = [];
  var guardT = 0;
  while (guardT < 12) {
    guardT += 1;
    var remT = remainingRequired(packT, geoT.done);
    if (remT.length === 1 && remT[0].kind === "area") break;
    var oneT = handler.handle({
      topic: "analytic",
      capability: "lengths",
      intent: "one-step",
      levelId: "geo-triangle-area-1",
      n: 1,
      history: histT,
      geo: geoT,
    });
    if (!oneT || !oneT.ok || !oneT.step || oneT.local) {
      add(fail("hybrid-len-walk", JSON.stringify(oneT)));
      break;
    }
    add(oneT.solved ? fail("hybrid-early-solved", JSON.stringify(oneT)) : { ok: true, id: "hybrid-len-step-" + guardT });
    applyRes(geoT, oneT);
    histT.push(oneT.step);
  }
  add(
    remainingRequired(packT, geoT.done).length === 1 && remainingRequired(packT, geoT.done)[0].kind === "area"
      ? { ok: true, id: "hybrid-part-a-done-area-open" }
      : fail("hybrid-part-a-done-area-open", JSON.stringify(geoT.done) + " rem=" + remainingRequired(packT, geoT.done).map(function (t) { return t.kind; }))
  );
  var areaHint = G.nextHint(packT, geoT);
  add(
    areaHint && areaHint.task && areaHint.task.kind === "area"
      ? { ok: true, id: "hybrid-next-area" }
      : fail("hybrid-next-area", JSON.stringify(areaHint && { kind: areaHint.task && areaHint.task.kind, msg: areaHint.message }))
  );
  var areaRemote = handler.handle({
    topic: "analytic",
    capability: "areas",
    intent: "one-step",
    levelId: "geo-triangle-area-1",
    n: 1,
    history: histT,
    geo: geoT,
  });
  add(
    areaRemote && areaRemote.ok && areaRemote.step && !areaRemote.local && areaRemote.task && areaRemote.task.kind === "area"
      ? { ok: true, id: "hybrid-server-does-area" }
      : fail("hybrid-server-does-area", JSON.stringify(areaRemote))
  );
  add(areaRemote.solved ? fail("hybrid-area-one-step-not-exercise-done", JSON.stringify(areaRemote)) : { ok: true, id: "hybrid-area-one-step-not-exercise-done" });
  var areaTyped = areaHint.step || areaHint.answer;
  var areaLocal = G.checkTyped(String(areaTyped), packT, geoT);
  add(areaLocal && areaLocal.ok ? { ok: true, id: "hybrid-area-local-ok" } : fail("hybrid-area-local-ok", JSON.stringify(areaLocal)));

  var pointEx = (segLevel.exercises || []).filter(function (ex) {
    var p = G.analyzeStart(ex);
    return (p.tasks || []).some(function (t) {
      return t.kind === "point";
    }) && (p.tasks || []).some(function (t) {
      return isLengthKind(t.kind);
    });
  })[0];
  add(pointEx ? { ok: true, id: "has-point-length-mix" } : fail("has-point-length-mix", "none"));
  if (pointEx) {
    var mix = walkExercise(engine, handler, "geo-segments-1", pointEx);
    add(mix.ok ? { ok: true, id: "hybrid-point-and-length:" + pointEx.n } : mix);
    var kinds = (G.analyzeStart(pointEx).parts[0] && G.analyzeStart(pointEx).parts[0].taskIds) || [];
    add(kinds.length ? { ok: true, id: "hybrid-mix-parts" } : fail("hybrid-mix-parts", "no parts"));
  }

  var areaOnly = G.checkTyped("9", G.analyzeStart(tri1), {
    done: { OA: true, OB: true },
    partial: {},
    lastExpr: {},
    coords: {},
  });
  add(areaOnly && areaOnly.ok && areaOnly.task && areaOnly.task.kind === "area" ? { ok: true, id: "regress-area-local" } : fail("regress-area-local", JSON.stringify(areaOnly)));

  var midLevel = levels.filter(function (l) {
    return l.id === "geo-midpoint-1";
  })[0];
  var midPack = G.analyzeStart(midLevel.exercises[0]);
  var midH = G.nextHint(midPack, emptyGeo());
  var midC = midH && midH.task ? G.checkTyped(String(midH.step || midH.answer), midPack, emptyGeo()) : null;
  add(midC && midC.ok && midC.task && midC.task.kind === "midpoint" ? { ok: true, id: "regress-midpoint-local" } : fail("regress-midpoint-local", JSON.stringify(midC)));

  var slopeLevel = levels.filter(function (l) {
    return l.id === "geo-slope-1";
  })[0];
  var slopePack = G.analyzeStart(slopeLevel.exercises[0]);
  var slopeH = G.nextHint(slopePack, emptyGeo());
  add(
    slopeH && slopeH.task && (slopeH.task.kind === "slope" || slopeH.task.kind === "lineEq" || slopeH.task.kind === "rearrange")
      ? { ok: true, id: "regress-slope-local-hint" }
      : fail("regress-slope-local-hint", JSON.stringify(slopeH && slopeH.task && slopeH.task.kind))
  );

  var distLevel = levels.filter(function (l) {
    return l.id === "geo-distance-1";
  })[0];
  var distPack = G.analyzeStart(distLevel.exercises[0]);
  var distH = G.nextHint(distPack, emptyGeo());
  add(
    distH && distH.task && (distH.task.kind === "distance" || distH.task.kind === "distUnknown")
      ? { ok: true, id: "regress-distance-local-hint" }
      : fail("regress-distance-local-hint", JSON.stringify(distH && distH.task && distH.task.kind))
  );

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/function isGeoLengthsServerActive/.test(src) ? { ok: true, id: "hybrid-gate-present" } : fail("hybrid-gate-present", "missing"));
  add(/geoShowSolutionLocal/.test(src) ? { ok: true, id: "mixed-solution-local" } : fail("mixed-solution-local", "missing"));

  console.log("flow-geo-lengths: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 30).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
