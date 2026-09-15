"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function emptyGeo() {
  return { done: {}, partial: {}, lastExpr: {}, coords: {}, lineMatch: {} };
}

function applyRes(geo, res) {
  if (!res || !res.ok) return;
  if (res.done) geo.done = res.done;
  if (res.lineMatch) geo.lineMatch = res.lineMatch;
  if (res.lineEq) geo.lineEq = res.lineEq;
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
      capability: "line-match",
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
    saw.push((one.matchAction && one.matchAction.type) || (one.task && one.task.kind) || "none");
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
  var handler = createGeometryHandler(engine);
  var passed = 0;
  var failed = [];
  function add(item) {
    if (item && item.ok) passed += 1;
    else failed.push(item);
  }

  var levels = engine.DoctematicaCurriculum.levels;
  var level = levels.filter(function (l) {
    return l.id === "geo-line-match-1";
  })[0];
  (level.exercises || []).forEach(function (ex) {
    var out = walkExercise(engine, handler, "geo-line-match-1", ex);
    add(out.ok ? { ok: true, id: "full:geo-line-match-1:" + ex.n } : out);
    if (out.ok) {
      var sol = handler.handle({
        topic: "analytic",
        capability: "line-match",
        intent: "solution",
        levelId: "geo-line-match-1",
        n: ex.n,
        history: [],
        geo: {},
      });
      add(
        sol && !sol.local && sol.steps && sol.steps.length
          ? { ok: true, id: "sol-server:" + ex.n }
          : fail("sol-server:" + ex.n, JSON.stringify(sol))
      );
      add(
        remainingRequired(out.pack, out.geo.done).length === 0
          ? { ok: true, id: "complete:" + ex.n }
          : fail("complete:" + ex.n, JSON.stringify(out.geo.done))
      );
      add(
        out.saw.indexOf("lineMatch.line") >= 0
          ? { ok: true, id: "saw-line:" + ex.n }
          : fail("saw-line:" + ex.n, out.saw.join(">"))
      );
    }
  });

  var afterLine = handler.handle({
    topic: "analytic",
    capability: "line-match",
    intent: "one-step",
    levelId: "geo-line-match-1",
    n: 19,
    history: ["lineMatch:line:eq1:I"],
    geo: {},
  });
  add(
    afterLine && afterLine.ok && afterLine.matchAction && afterLine.matchAction.type === "lineMatch.reason" && afterLine.done && afterLine.done.eq1
      ? { ok: true, id: "line-to-reason-server" }
      : fail("line-to-reason-server", JSON.stringify(afterLine))
  );

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/requestLineMatchAction/.test(src) ? { ok: true, id: "hybrid-match-action" } : fail("hybrid-match-action", "missing"));

  console.log("flow-geo-line-match: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 40).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
