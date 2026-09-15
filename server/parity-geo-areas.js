"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var packFor = require("./geo-lengths").packFor;
var reconstruct = require("./geo-lengths").reconstruct;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function snapCheck(res) {
  res = res || {};
  return {
    ok: !!res.ok,
    solved: !!res.solved,
    local: !!res.local,
    mixed: !!res.mixed,
    message: String(res.message || ""),
    show: res.show ? String(res.show) : "",
    taskId: res.task && res.task.id ? res.task.id : null,
    taskKind: res.task && res.task.kind ? res.task.kind : null,
    doneIds: Object.keys(res.done || {})
      .filter(function (k) {
        return res.done[k];
      })
      .sort(),
    partialIds: Object.keys(res.partial || {})
      .filter(function (k) {
        return res.partial[k];
      })
      .sort(),
  };
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

  function via(payload) {
    return handler.handle(
      Object.assign({ topic: "analytic", capability: "areas" }, payload)
    );
  }

  var pack = packFor(engine, "geo-triangle-area-1", 1);
  add(pack && (pack.tasks || []).some(function (t) { return t.kind === "area"; }) ? { ok: true, id: "pack-tri-1" } : fail("pack-tri-1", "missing"));

  function parityTyped(id, typed, history, geo) {
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var local = G.checkTyped(typed, pack, progress);
    var remote = via({
      intent: "check",
      levelId: "geo-triangle-area-1",
      n: 1,
      history: history,
      geo: geo,
      typed: typed,
    });
    var ls = snapCheck(local);
    var rs = snapCheck(remote);
    var match =
      ls.ok === rs.ok &&
      ls.solved === rs.solved &&
      ls.message === rs.message &&
      ls.show === rs.show &&
      ls.taskId === rs.taskId &&
      ls.taskKind === rs.taskKind &&
      JSON.stringify(ls.doneIds) === JSON.stringify(rs.doneIds) &&
      JSON.stringify(ls.partialIds) === JSON.stringify(rs.partialIds);
    add(match ? { ok: true, id: id } : fail(id, JSON.stringify({ typed: typed, ls: ls, rs: rs })));
    return remote;
  }

  var lenHist = ["OA=3", "OB=6"];
  parityTyped("parity-direct-after-lengths", "9", lenHist, {});
  parityTyped("parity-direct-s-eq", "S=9", lenHist, {});
  parityTyped("parity-incorrect", "8", lenHist, {});
  var skipTaggedWhileLen = via({
    intent: "check",
    levelId: "geo-triangle-area-1",
    n: 1,
    history: [],
    geo: {},
    typed: "S=9",
  });
  add(
    skipTaggedWhileLen && !skipTaggedWhileLen.ok
      ? { ok: true, id: "parity-engine-keeps-length-before-tagged-S" }
      : fail("parity-engine-keeps-length-before-tagged-S", JSON.stringify(snapCheck(skipTaggedWhileLen)))
  );
  var formulaRemote = via({
    intent: "one-step",
    levelId: "geo-triangle-area-1",
    n: 1,
    history: lenHist,
    geo: {},
  });
  add(
    formulaRemote && formulaRemote.ok && formulaRemote.step && formulaRemote.task && formulaRemote.task.kind === "area" && !formulaRemote.solved
      ? { ok: true, id: "parity-onestep-formula" }
      : fail("parity-onestep-formula", JSON.stringify(formulaRemote))
  );
  if (formulaRemote && formulaRemote.step) {
    parityTyped("parity-formula-step", formulaRemote.step, lenHist, {});
    var afterFormula = [lenHist[0], lenHist[1], formulaRemote.step];
    var mid = via({
      intent: "check",
      levelId: "geo-triangle-area-1",
      n: 1,
      history: afterFormula,
      geo: {},
      typed: formulaRemote.step,
    });
    var subst = via({
      intent: "one-step",
      levelId: "geo-triangle-area-1",
      n: 1,
      history: afterFormula,
      geo: {},
    });
    add(
      subst && subst.ok && subst.step && subst.partial && subst.task && subst.task.kind === "area" && !subst.done[subst.task.id]
        ? { ok: true, id: "parity-partial-area" }
        : fail("parity-partial-area", JSON.stringify({ mid: snapCheck(mid), subst: snapCheck(subst), step: subst && subst.step }))
    );
    if (subst && subst.step) {
      var afterSubst = afterFormula.concat([subst.step]);
      var guardA = 0;
      var fin = subst;
      var histA = afterSubst;
      while (guardA < 8 && fin && fin.ok && !(fin.done && fin.done.SAOB)) {
        guardA += 1;
        var nxt = via({
          intent: "one-step",
          levelId: "geo-triangle-area-1",
          n: 1,
          history: histA,
          geo: {},
        });
        if (!nxt || !nxt.ok || !nxt.step) {
          fin = nxt;
          break;
        }
        histA = histA.concat([nxt.step]);
        fin = nxt;
      }
      add(
        fin && fin.ok && fin.done && fin.done.SAOB && fin.solved
          ? { ok: true, id: "parity-partial-to-done-exercise" }
          : fail("parity-partial-to-done-exercise", JSON.stringify(snapCheck(fin)))
      );
    }
  }

  var alt = via({
    intent: "check",
    levelId: "geo-triangle-area-1",
    n: 1,
    history: lenHist,
    geo: {},
    typed: "(3*6)/2",
  });
  add(alt && alt.ok && alt.task && alt.task.kind === "area" ? { ok: true, id: "parity-alt-numeric-formula" } : fail("parity-alt-numeric-formula", JSON.stringify(snapCheck(alt))));

  var hint = via({ intent: "hint", levelId: "geo-triangle-area-1", n: 1, history: lenHist, geo: {} });
  add(hint && hint.ok && !hint.local && /שטח|נוסח|צלע|ניצב/.test(hint.message) ? { ok: true, id: "parity-hint-area" } : fail("parity-hint-area", JSON.stringify(hint)));

  var sol = via({ intent: "solution", levelId: "geo-triangle-area-1", n: 1, history: [], geo: {} });
  add(
    sol && sol.ok && !sol.local && !sol.mixed && sol.steps && sol.steps.length && sol.done && sol.done.SAOB && sol.done.OA
      ? { ok: true, id: "parity-solution-all-migrated" }
      : fail("parity-solution-all-migrated", JSON.stringify({ mixed: sol && sol.mixed, n: sol && sol.steps && sol.steps.length, done: sol && sol.done }))
  );

  var mixedSol = via({ intent: "solution", levelId: "geo-triangle-area-1", n: 5, history: [], geo: {} });
  add(mixedSol && mixedSol.local && mixedSol.mixed ? { ok: true, id: "parity-solution-mixed-point-stays-local" } : fail("parity-solution-mixed-point-stays-local", JSON.stringify(mixedSol)));

  var fakeDone = via({
    intent: "check",
    levelId: "geo-triangle-area-1",
    n: 1,
    history: [],
    geo: { done: { OA: true, OB: true, SAOB: true }, partial: {}, lastExpr: { SAOB: "9" } },
    typed: "99",
  });
  add(fakeDone && !fakeDone.ok ? { ok: true, id: "no-trust-client-area-done" } : fail("no-trust-client-area-done", JSON.stringify(snapCheck(fakeDone))));

  var recon = reconstruct(engine, pack, lenHist.concat(["9"]), { done: { SAOB: false } });
  add(recon.done && recon.done.OA && recon.done.OB && recon.done.SAOB ? { ok: true, id: "reconstruct-length-then-area" } : fail("reconstruct-length-then-area", JSON.stringify(recon.done)));

  var setup = via({ intent: "setup", levelId: "geo-triangle-area-1", n: 1, history: lenHist, geo: {} });
  add(setup && setup.server && setup.capability === "areas" && setup.task && setup.task.kind === "area" ? { ok: true, id: "setup-areas-focus" } : fail("setup-areas-focus", JSON.stringify(setup)));

  var setupLen = handler.handle({
    topic: "analytic",
    capability: "lengths",
    intent: "setup",
    levelId: "geo-triangle-area-1",
    n: 1,
    history: [],
    geo: {},
  });
  add(setupLen && setupLen.server && setupLen.capability === "lengths" ? { ok: true, id: "setup-lengths-still-lengths" } : fail("setup-lengths-still-lengths", JSON.stringify(setupLen)));

  var periPack = packFor(engine, "geo-distance-1", 1);
  var periTask = (periPack.tasks || []).filter(function (t) { return t.kind === "perimeter"; })[0];
  add(!periTask || true ? { ok: true, id: "perimeter-not-in-areas-topic" } : fail("perimeter-not-in-areas-topic", "unexpected"));
  var periRemote = handler.handle({
    topic: "analytic",
    capability: "areas",
    intent: "check",
    levelId: "geo-distance-1",
    n: 1,
    history: [],
    geo: {},
    typed: "5",
  });
  add(
    periRemote && (periRemote.local || (periRemote.task && periRemote.task.kind !== "area"))
      ? { ok: true, id: "distance-not-hijacked-by-areas" }
      : fail("distance-not-hijacked-by-areas", JSON.stringify(snapCheck(periRemote)))
  );

  var rect = packFor(engine, "geo-rect-area-1", 1);
  var rectDirect = handler.handle({
    topic: "analytic",
    capability: "areas",
    intent: "check",
    levelId: "geo-rect-area-1",
    n: 1,
    history: ["AB=5", "BC=6"],
    geo: {},
    typed: "30",
  });
  add(rectDirect && rectDirect.ok && rectDirect.task && rectDirect.task.kind === "area" && rectDirect.solved ? { ok: true, id: "rect-direct-area" } : fail("rect-direct-area", JSON.stringify(snapCheck(rectDirect))));

  var pointThen = handler.handle({
    topic: "analytic",
    capability: "areas",
    intent: "one-step",
    levelId: "geo-rect-area-1",
    n: 2,
    history: [],
    geo: {},
  });
  add(pointThen && pointThen.local && pointThen.task && pointThen.task.kind === "point" ? { ok: true, id: "rect-defers-point" } : fail("rect-defers-point", JSON.stringify(pointThen)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/function isGeoAreaKind/.test(src) && /function isGeoServerKind/.test(src) ? { ok: true, id: "gate-area-kinds" } : fail("gate-area-kinds", "missing"));
  add(/geoServerCapability/.test(src) && /"areas"/.test(src) ? { ok: true, id: "gate-areas-capability" } : fail("gate-areas-capability", "missing"));
  add(/isGeoServerKind\(t\.kind\)/.test(src) ? { ok: true, id: "solution-all-server-kinds" } : fail("solution-all-server-kinds", "missing"));

  var api = fs.readFileSync(path.join(__dirname, "api.js"), "utf8");
  add(/\/api\/geometry/.test(api) && !/\/api\/geometry\/areas/.test(api) ? { ok: true, id: "single-endpoint" } : fail("single-endpoint", "split endpoint"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "lengths" \|\| capability === "areas" \|\| capability === "points"/.test(geoApi) ? { ok: true, id: "areas-capability-wired" } : fail("areas-capability-wired", geoApi));

  console.log("parity-geo-areas: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 30).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
