"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var isMigratedKind = require("./geo-lengths").isMigratedKind;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function emptyGeo() {
  return { done: {}, partial: {}, lastExpr: {}, coords: {}, footCoords: {}, draw: null, pointRoute: {} };
}

function applyRes(geo, res) {
  if (!res || !res.ok) return;
  if (res.done) geo.done = res.done;
  if (res.partial !== undefined) geo.partial = res.partial;
  if (res.lastExpr) geo.lastExpr = res.lastExpr;
  if (res.coords) geo.coords = res.coords;
  if (res.pointRoute) geo.pointRoute = res.pointRoute;
}

function remainingRequired(pack, done) {
  return (pack.tasks || []).filter(function (t) {
    return !t.optional && !(done && done[t.id]);
  });
}

function walkExercise(engine, handler, levelId, ex) {
  var G = engine.DoctematicaGeometry;
  var pack = G.analyzeStart(ex);
  pack._levelId = levelId;
  var history = [];
  var geo = emptyGeo();
  var saw = [];
  var i;
  for (i = 0; i < 160; i++) {
    if (!remainingRequired(pack, geo.done).length) {
      return { ok: true, saw: saw, n: ex.n, history: history, geo: geo, pack: pack };
    }
    var one = handler.handle({
      topic: "analytic",
      capability: "points",
      intent: "one-step",
      levelId: levelId,
      n: ex.n,
      history: history,
      geo: geo,
    });
    if (one && one.local) {
      return fail("walk-local:" + levelId + ":" + ex.n, JSON.stringify(one) + " saw=" + saw.join(">"));
    }
    if (!one || !one.ok || !one.step) {
      return fail("walk-stuck:" + levelId + ":" + ex.n, JSON.stringify(one) + " saw=" + saw.join(">"));
    }
    saw.push((one.task && one.task.kind) || "none");
    applyRes(geo, one);
    history.push(one.step);
    if (one.solved && remainingRequired(pack, geo.done).length) {
      return fail("walk-early-solved:" + levelId + ":" + ex.n, JSON.stringify(geo.done) + " saw=" + saw.join(">"));
    }
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
  ["geo-line-points-1", "geo-line-axis-1"].forEach(function (levelId) {
    var level = levels.filter(function (l) {
      return l.id === levelId;
    })[0];
    (level.exercises || []).forEach(function (ex) {
      var out = walkExercise(engine, handler, levelId, ex);
      add(out.ok ? { ok: true, id: "full:" + levelId + ":" + ex.n } : out);
      if (out.ok) {
        var hasLocal = (out.pack.tasks || []).some(function (t) {
          return !isMigratedKind(t.kind, out.pack);
        });
        var sol = handler.handle({
          topic: "analytic",
          capability: "points",
          intent: "solution",
          levelId: levelId,
          n: ex.n,
          history: [],
          geo: {},
        });
        if (hasLocal) {
          add(sol && sol.local && sol.mixed ? { ok: true, id: "sol-mixed:" + levelId + ":" + ex.n } : fail("sol-mixed:" + levelId + ":" + ex.n, JSON.stringify(sol)));
        } else {
          add(sol && !sol.local && sol.steps && sol.steps.length ? { ok: true, id: "sol-server:" + levelId + ":" + ex.n } : fail("sol-server:" + levelId + ":" + ex.n, JSON.stringify(sol)));
        }
        add(
          remainingRequired(out.pack, out.geo.done).length === 0
            ? { ok: true, id: "complete:" + levelId + ":" + ex.n }
            : fail("complete:" + levelId + ":" + ex.n, JSON.stringify(out.geo.done))
        );
      }
    });
  });

  var aToB = handler.handle({
    topic: "analytic",
    capability: "points",
    intent: "one-step",
    levelId: "geo-line-axis-1",
    n: 1,
    history: ["A(0;6)"],
    geo: {},
  });
  add(aToB && aToB.ok && !aToB.local && aToB.task && aToB.task.id === "B" && !aToB.solved ? { ok: true, id: "point-to-point-server" } : fail("point-to-point-server", JSON.stringify(aToB)));

  var altDirect = handler.handle({
    topic: "analytic",
    capability: "points",
    intent: "check",
    levelId: "geo-line-axis-1",
    n: 1,
    history: ["x = 0"],
    geo: {},
    typed: "A(0;6)",
  });
  add(altDirect && altDirect.ok && altDirect.done && altDirect.done.A ? { ok: true, id: "alt-skip-to-point" } : fail("alt-skip-to-point", JSON.stringify(altDirect)));

  var partA = handler.handle({
    topic: "analytic",
    capability: "points",
    intent: "check",
    levelId: "geo-line-points-1",
    n: 1,
    history: ["A(2;4)"],
    geo: {},
    typed: "B(0;2)",
  });
  add(partA && partA.ok && partA.done.A && partA.done.B && !partA.solved ? { ok: true, id: "part-a-not-exercise" } : fail("part-a-not-exercise", JSON.stringify(partA)));

  var localLevels = ["geo-line-eq-1", "geo-slope-1", "geo-parallel-1", "geo-perp-1", "geo-midpoint-1", "geo-distance-1", "geo-line-intersect-1"];
  localLevels.forEach(function (levelId) {
    var level = levels.filter(function (l) {
      return l.id === levelId;
    })[0];
    var ex = level.exercises[0];
    var remote = handler.handle({
      topic: "analytic",
      capability: "points",
      intent: "one-step",
      levelId: levelId,
      n: ex.n,
      history: [],
      geo: {},
    });
    add(remote && remote.local ? { ok: true, id: "defer:" + levelId } : fail("defer:" + levelId, JSON.stringify(remote)));
  });

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoPointPage/.test(src) && /applyRequiredReasonLocal/.test(src) ? { ok: true, id: "hybrid-reason-gate" } : fail("hybrid-reason-gate", "missing"));

  console.log("flow-geo-points: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 40).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
