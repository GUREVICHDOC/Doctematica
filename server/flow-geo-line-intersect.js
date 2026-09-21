"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var isMigratedKind = require("./geo-lengths").isMigratedKind;
var walkMod = require("./flow-geo-walk");

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
  };
}

function applyRes(geo, res) {
  if (!res || !res.ok) return;
  if (res.done) geo.done = res.done;
  if (res.partial !== undefined) geo.partial = res.partial;
  if (res.lastExpr) geo.lastExpr = res.lastExpr;
  if (res.coords) geo.coords = res.coords;
  if (res.lineEq) geo.lineEq = Object.assign({}, geo.lineEq || {}, res.lineEq);
  if (res.intersect) geo.intersect = Object.assign({}, geo.intersect || {}, res.intersect);
  if (res.pointRoute) geo.pointRoute = res.pointRoute;
}

function remainingRequired(pack, done) {
  return (pack.tasks || []).filter(function (t) {
    return !t.optional && !(done && done[t.id]);
  });
}

function capFor(kind, pack) {
  if (kind === "area") return "areas";
  if (kind === "segment" || kind === "origin" || kind === "axis" || kind === "distSeg") return "lengths";
  if (kind === "lineIntersect") return "line-intersect";
  if (kind === "point" || kind === "onLine" || kind === "freePoint" || kind === "noIntercept") return "points";
  return "line-intersect";
}

function walkExercise(engine, handler, levelId, ex) {
  var G = engine.DoctematicaGeometry;
  var pack = G.analyzeStart(ex);
  pack._levelId = levelId;
  var history = [];
  var geo = emptyGeo();
  var saw = [];
  var i;
  for (i = 0; i < 180; i++) {
    if (!remainingRequired(pack, geo.done).length) {
      return { ok: true, saw: saw, n: ex.n, history: history, geo: geo, pack: pack };
    }
    var h = G.nextHint(pack, geo);
    var kind = h && h.task && h.task.kind;
    saw.push(kind || (h && h.message) || "none");
    if (kind && isMigratedKind(kind, pack)) {
      var one = handler.handle({
        topic: "analytic",
        capability: capFor(kind, pack),
        intent: "one-step",
        levelId: levelId,
        n: ex.n,
        history: history,
        geo: geo,
      });
      if (one && one.local) {
        return fail("walk-local-on-migrated:" + levelId + ":" + ex.n, JSON.stringify(one) + " saw=" + saw.join(">"));
      }
      if (!one || !one.ok || !one.step) {
        var skipped = null;
        if (h.task && h.task.kind === "lineIntersect") {
          var skipCands = [];
          if (h.answer) skipCands.push(h.answer);
          if (h.task.answerX != null) skipCands.push("x = " + h.task.answerX);
          if (h.task.answerY != null) skipCands.push("y = " + h.task.answerY);
          if (h.task.answerX != null && h.task.answerY != null) {
            skipCands.push(h.task.label + "(" + h.task.answerX + ";" + h.task.answerY + ")");
          }
          var si;
          for (si = 0; si < skipCands.length; si++) {
            var chk = handler.handle({
              topic: "analytic",
              capability: "line-intersect",
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
        }
        if (!skipped) {
          return fail("walk-stuck:" + levelId + ":" + ex.n, JSON.stringify(one) + " saw=" + saw.join(">"));
        }
        one = skipped;
      }
      if (one.solved && remainingRequired(pack, Object.assign({}, geo.done, one.done || {})).length) {
        applyRes(geo, one);
        if (remainingRequired(pack, geo.done).length) {
          return fail("walk-early-solved:" + levelId + ":" + ex.n, JSON.stringify(geo.done) + " saw=" + saw.join(">"));
        }
      } else {
        applyRes(geo, one);
      }
      history.push(one.step);
      continue;
    }
    if (!h || !h.task) {
      return fail("walk-no-task:" + levelId + ":" + ex.n, (h && h.message) || "no task");
    }
    var typed = h.rawStep ? h.step : h.step || h.answer;
    var local = G.checkTyped(String(typed), pack, geo);
    if (!local || !local.ok) {
      return fail("walk-local:" + levelId + ":" + ex.n, (local && local.message) + " typed=" + typed + " kind=" + kind);
    }
    applyRes(geo, local);
  }
  return fail("walk-long:" + levelId + ":" + ex.n, saw.join(">"));
}

function main() {
  var engine = loadEngine();
  var handler = createGeometryHandler(engine);
  var passed = 0;
  var failed = [];
  function add(item) {
    if (item && item.ok) passed += 1;
    else failed.push(item);
  }

  var levels = engine.DoctematicaCurriculum.levels;
  var level = levels.filter(function (l) {
    return l.id === "geo-line-intersect-1";
  })[0];
  walkMod.addHybridSuite(add, engine, handler, "geo-line-intersect-1", "line-intersect", {
    onWalk: function (addItem, ex, oneWalk) {
      if (oneWalk.caps.indexOf("points") >= 0 && oneWalk.caps.indexOf("line-intersect") >= 0) {
        addItem({ ok: true, id: "transition-point-intersect:" + ex.n });
      }
    },
  });
  walkMod.addNoTrust(add, engine, handler, "geo-line-intersect-1", 8, "points", {
    done: { A: true, B: true, C: true, D: true },
    coords: { A: { x: true, y: true } },
    lastExpr: { A: "A(0;0)" },
  });

  var eqToX = handler.handle({
    topic: "analytic",
    capability: "line-intersect",
    intent: "one-step",
    levelId: "geo-line-intersect-1",
    n: 1,
    history: ["x + 2 = −x + 6"],
    geo: {},
  });
  add(
    eqToX && eqToX.ok && !eqToX.local && !eqToX.solved
      ? { ok: true, id: "equate-to-algebra-server" }
      : fail("equate-to-algebra-server", JSON.stringify(eqToX))
  );

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoLineIntersectPage/.test(src) ? { ok: true, id: "hybrid-intersect-gate" } : fail("hybrid-intersect-gate", "missing"));

  console.log("flow-geo-line-intersect: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 40).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
