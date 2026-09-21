"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var isLengthKind = require("./geo-lengths").isLengthKind;
var isMigratedKind = require("./geo-lengths").isMigratedKind;
var walkMod = require("./flow-geo-walk");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function emptyGeo() {
  return { done: {}, partial: {}, lastExpr: {}, coords: {}, footCoords: {}, draw: null };
}

function applyRes(geo, res) {
  if (!res || !res.ok) return;
  if (res.done) geo.done = res.done;
  if (res.partial !== undefined) geo.partial = res.partial;
  if (res.lastExpr) geo.lastExpr = res.lastExpr;
  if (res.coords) geo.coords = res.coords;
  if (res.footCoords) geo.footCoords = res.footCoords;
}

function remainingRequired(pack, done) {
  return (pack.tasks || []).filter(function (t) {
    return !t.optional && !(done && done[t.id]);
  });
}

function capFor(kind, pack) {
  if (kind === "area") return "areas";
  if (kind === "point" || kind === "onLine" || kind === "freePoint" || kind === "noIntercept") return "points";
  return "lengths";
}

function snapCurriculumHeights(engine, pack, geo) {
  var GD = engine.DoctematicaGeoDraw;
  var G = engine.DoctematicaGeometry;
  var cfg = pack.draw;
  if (!GD || !cfg || !cfg.heights || !cfg.heights.length) return;
  geo.draw = G.initDrawProgress ? G.initDrawProgress(pack, geo) : geo.draw || { heights: [] };
  cfg.heights.forEach(function (spec) {
    var item = GD.buildHeightFromVertex(cfg, pack.map, spec.from);
    if (!item) return;
    item.snapped = true;
    item.visible = true;
    if (spec.footLabel) item.footLabel = spec.footLabel;
    geo.draw.heights = (geo.draw.heights || []).filter(function (h) {
      return String(h.from || "").toUpperCase() !== String(spec.from || "").toUpperCase();
    });
    geo.draw.heights.push(item);
  });
}

function walkExercise(engine, handler, levelId, ex) {
  var G = engine.DoctematicaGeometry;
  var pack = G.analyzeStart(ex);
  pack._levelId = levelId;
  var history = [];
  var geo = emptyGeo();
  snapCurriculumHeights(engine, pack, geo);
  var saw = [];
  var i;
  for (i = 0; i < 120; i++) {
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
    if (h && h.footCalc && h.step) {
      var footRes = G.checkTyped(String(h.step), pack, geo);
      if (!footRes || !footRes.ok) {
        return fail("walk-foot:" + levelId + ":" + ex.n, (footRes && footRes.message) + " typed=" + h.step);
      }
      applyRes(geo, footRes);
      history.push(String(h.step));
      continue;
    }
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
      if (one && one.addHeight) {
        if (G.siteAddHeight) G.siteAddHeight(pack, geo, h.task);
        continue;
      }
      if (!one || !one.step || !one.ok) {
        return fail("walk-migrated:" + levelId + ":" + ex.n, JSON.stringify(one) + " hint=" + (h && h.message) + " saw=" + saw.join(">"));
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
  walkMod.addHybridSuite(add, engine, handler, "geo-triangle-area-1", "areas", {
    onWalk: function (addItem, ex, oneWalk) {
      if (oneWalk.caps.indexOf("points") >= 0 && oneWalk.caps.indexOf("areas") >= 0) {
        addItem({ ok: true, id: "transition-point-area:" + ex.n });
      }
      if (oneWalk.caps.indexOf("lengths") >= 0 && oneWalk.caps.indexOf("areas") >= 0) {
        addItem({ ok: true, id: "transition-length-area:" + ex.n });
      }
    },
  });
  walkMod.addHybridSuite(add, engine, handler, "geo-rect-area-1", "areas", {
    onWalk: function (addItem, ex, oneWalk) {
      if (oneWalk.caps.indexOf("points") >= 0 && oneWalk.caps.indexOf("areas") >= 0) {
        addItem({ ok: true, id: "rect-transition-point-area:" + ex.n });
      }
    },
  });
  walkMod.addNoTrust(add, engine, handler, "geo-triangle-area-1", 5, "points", {
    done: { D: true },
    coords: { D: { x: true, y: true } },
    partial: { D: true },
    lastExpr: { D: "D(1;1)" },
  });

  var packT = G.analyzeStart(levels.filter(function (l) { return l.id === "geo-triangle-area-1"; })[0].exercises[0]);
  var geoT = emptyGeo();
  var histT = [];
  var guardT = 0;
  var partA = false;
  while (guardT < 16) {
    guardT += 1;
    var remT = remainingRequired(packT, geoT.done);
    if (remT.length === 1 && remT[0].kind === "area") {
      partA = true;
      break;
    }
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
      add(fail("len-to-area-walk", JSON.stringify(oneT)));
      break;
    }
    add(oneT.solved ? fail("len-to-area-early-solved", JSON.stringify(oneT)) : { ok: true, id: "len-step-" + guardT });
    applyRes(geoT, oneT);
    histT.push(oneT.step);
  }
  add(partA ? { ok: true, id: "length-then-area-open" } : fail("length-then-area-open", JSON.stringify(geoT.done)));
  var areaOne = handler.handle({
    topic: "analytic",
    capability: "areas",
    intent: "one-step",
    levelId: "geo-triangle-area-1",
    n: 1,
    history: histT,
    geo: geoT,
  });
  add(areaOne && areaOne.ok && !areaOne.local && areaOne.task && areaOne.task.kind === "area" ? { ok: true, id: "length-to-area-server" } : fail("length-to-area-server", JSON.stringify(areaOne)));

  var fakeLens = handler.handle({
    topic: "analytic",
    capability: "areas",
    intent: "check",
    levelId: "geo-triangle-area-1",
    n: 1,
    history: [],
    geo: { done: { OA: true, OB: true } },
    typed: "S=9",
  });
  add(
    fakeLens && !fakeLens.ok
      ? { ok: true, id: "no-trust-client-length-done-for-area" }
      : fail("no-trust-client-length-done-for-area", JSON.stringify(fakeLens))
  );

  var footLocal = handler.handle({
    topic: "analytic",
    capability: "areas",
    intent: "one-step",
    levelId: "geo-triangle-area-1",
    n: 5,
    history: [],
    geo: emptyGeo(),
  });
  add(
    footLocal && footLocal.ok && !footLocal.local && footLocal.task && footLocal.task.kind === "point"
      ? { ok: true, id: "height-foot-now-server-point" }
      : fail("height-foot-now-server-point", JSON.stringify(footLocal))
  );

  var rectLevel = levels.filter(function (l) { return l.id === "geo-rect-area-1"; })[0];
  var rect2 = walkExercise(engine, handler, "geo-rect-area-1", rectLevel.exercises[1]);
  add(rect2.ok ? { ok: true, id: "rect-n2-point-then-area" } : rect2);
  if (rect2.ok) {
    add(
      rect2.saw.some(function (s) { return s === "point"; }) && rect2.saw.some(function (s) { return s === "area" || s.indexOf("area") >= 0; })
        ? { ok: true, id: "rect-n2-saw-point-and-area" }
        : fail("rect-n2-saw-point-and-area", rect2.saw.join(">"))
    );
  }

  var tri12 = walkExercise(engine, handler, "geo-triangle-area-1", levels.filter(function (l) { return l.id === "geo-triangle-area-1"; })[0].exercises[11]);
  add(tri12.ok ? { ok: true, id: "tri-n12-diff-area" } : tri12);
  if (tri12.ok) {
    add(
      tri12.saw.filter(function (s) { return s === "area"; }).length >= 3
        ? { ok: true, id: "tri-n12-three-areas" }
        : fail("tri-n12-three-areas", tri12.saw.join(">"))
    );
    add(
      remainingRequired(tri12.pack, tri12.geo.done).length === 0
        ? { ok: true, id: "tri-n12-exercise-complete" }
        : fail("tri-n12-exercise-complete", JSON.stringify(tri12.geo.done))
    );
  }

  var midLevel = levels.filter(function (l) { return l.id === "geo-midpoint-1"; })[0];
  var midPack = G.analyzeStart(midLevel.exercises[0]);
  var midH = G.nextHint(midPack, emptyGeo());
  var midRemote = handler.handle({
    topic: "analytic",
    capability: "areas",
    intent: "one-step",
    levelId: "geo-midpoint-1",
    n: midLevel.exercises[0].n,
    history: [],
    geo: {},
  });
  add(midRemote && (midRemote.local || (midRemote.ok && midRemote.task && midRemote.task.kind === "midpoint")) ? { ok: true, id: "areas-defers-midpoint" } : fail("areas-defers-midpoint", JSON.stringify(midRemote)));
  add(midH && midH.task && midH.task.kind === "midpoint" ? { ok: true, id: "midpoint-still-local-engine" } : fail("midpoint-still-local-engine", JSON.stringify(midH && midH.task && midH.task.kind)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/function isGeoLengthsServerActive/.test(src) && /isGeoServerKind/.test(src) ? { ok: true, id: "hybrid-gate" } : fail("hybrid-gate", "missing"));
  add(/state\.geo\.lengthLog/.test(src) && /isGeoServerKind\(res\.task\.kind\)/.test(src) ? { ok: true, id: "work-log-includes-area" } : fail("work-log-includes-area", "missing"));

  console.log("flow-geo-areas: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 40).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
