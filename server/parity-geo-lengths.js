"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var isLengthKind = require("./geo-lengths").isLengthKind;
var packFor = require("./geo-lengths").packFor;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function snapCheck(res) {
  res = res || {};
  return {
    ok: !!res.ok,
    solved: !!res.solved,
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

function levelExercises(engine, id) {
  var levels = engine.DoctematicaCurriculum.levels;
  var i;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === id) return levels[i].exercises || [];
  }
  return [];
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
      Object.assign({ topic: "analytic", capability: "lengths" }, payload)
    );
  }

  var pack = packFor(engine, "geo-segments-1", 1);
  add(pack && pack.tasks && pack.tasks.length ? { ok: true, id: "pack-ex1" } : fail("pack-ex1", "missing"));

  var cases = [
    { typed: "OB=2", ok: true },
    { typed: "2", ok: true },
    { typed: "0+2", ok: true },
    { typed: "OB=99", ok: false },
  ];
  cases.forEach(function (c, idx) {
    var local = G.checkTyped(c.typed, pack, { done: {}, partial: {}, lastExpr: {}, coords: {} });
    var remote = via({
      intent: "check",
      levelId: "geo-segments-1",
      n: 1,
      history: [],
      geo: {},
      typed: c.typed,
    });
    var ls = snapCheck(local);
    var rs = snapCheck(remote);
    var match =
      ls.ok === rs.ok &&
      ls.solved === rs.solved &&
      ls.message === rs.message &&
      ls.show === rs.show &&
      ls.taskId === rs.taskId &&
      JSON.stringify(ls.doneIds) === JSON.stringify(rs.doneIds);
    add(
      match && ls.ok === c.ok
        ? { ok: true, id: "parity-check-ex1-" + idx }
        : fail("parity-check-ex1-" + idx, JSON.stringify({ typed: c.typed, ls: ls, rs: rs }))
    );
  });

  var midLocal = G.checkTyped("5-2", pack, { done: { OB: true, OD: true }, partial: {}, lastExpr: {}, coords: {} });
  var midRemote = via({
    intent: "check",
    levelId: "geo-segments-1",
    n: 1,
    history: ["OB=2", "OD=7"],
    geo: {},
    typed: "5-2",
  });
  add(
    midLocal.ok &&
      midRemote.ok &&
      midLocal.task &&
      midLocal.task.kind === "segment" &&
      midRemote.partial &&
      midRemote.partial[midLocal.task.id] &&
      !midRemote.done[midLocal.task.id]
      ? { ok: true, id: "parity-partial-diff" }
      : fail("parity-partial-diff", JSON.stringify({ midLocal: snapCheck(midLocal), midRemote: snapCheck(midRemote) }))
  );

  var doneRemote = via({
    intent: "check",
    levelId: "geo-segments-1",
    n: 1,
    history: ["OB=2", "OD=7", "AB: 5-2"],
    geo: {},
    typed: "AB=3",
  });
  add(
    doneRemote.ok && doneRemote.done && doneRemote.done.AB && !doneRemote.solved
      ? { ok: true, id: "parity-done-not-all" }
      : fail("parity-done-not-all", JSON.stringify(snapCheck(doneRemote)))
  );

  var hintL = G.nextHint(pack, { done: {}, partial: {}, lastExpr: {}, coords: {} });
  var hintR = via({ intent: "hint", levelId: "geo-segments-1", n: 1, history: [], geo: {} });
  add(
    hintL.message === hintR.message && isLengthKind(hintL.task && hintL.task.kind)
      ? { ok: true, id: "parity-hint" }
      : fail("parity-hint", JSON.stringify({ hintL: hintL.message, hintR: hintR }))
  );

  var one = via({ intent: "one-step", levelId: "geo-segments-1", n: 1, history: [], geo: {} });
  add(
    one.ok && one.step && one.task && isLengthKind(one.task.kind) && one.solved !== true
      ? { ok: true, id: "parity-onestep-not-solved" }
      : fail("parity-onestep-not-solved", JSON.stringify(one))
  );
  add(one.ok && one.show ? { ok: true, id: "parity-onestep-applies" } : fail("parity-onestep-applies", JSON.stringify(one)));

  var sol = via({ intent: "solution", levelId: "geo-segments-1", n: 1, history: [], geo: {} });
  add(sol.ok && !sol.mixed && sol.steps && sol.steps.length && sol.done && sol.done.OB ? { ok: true, id: "solution-all-lengths-ex1" } : fail("solution-all-lengths-ex1", JSON.stringify(sol)));

  var solMix = via({ intent: "solution", levelId: "geo-segments-1", n: 8, history: [], geo: {} });
  add(solMix.ok && !solMix.mixed && !solMix.local && solMix.steps && solMix.steps.length ? { ok: true, id: "solution-point-ex8-now-server" } : fail("solution-point-ex8-now-server", JSON.stringify(solMix)));

  var axisEx = levelExercises(engine, "geo-segments-1").filter(function (ex) {
    var p = G.analyzeStart(ex);
    return (p.tasks || []).some(function (t) {
      return t.kind === "axis";
    });
  })[0];
  if (axisEx) {
    var axisPack = G.analyzeStart(axisEx);
    var axisTask = (axisPack.tasks || []).filter(function (t) {
      return t.kind === "axis";
    })[0];
    var axisHint = via({
      intent: "hint",
      levelId: "geo-segments-1",
      n: axisEx.n,
      history: [],
      geo: {},
    });
    add(
      axisHint.ok && axisHint.message
        ? { ok: true, id: "parity-axis-hint" }
        : fail("parity-axis-hint", JSON.stringify({ axisTask: axisTask && axisTask.id, axisHint: axisHint }))
    );
  } else {
    add(fail("parity-axis-hint", "no axis exercise"));
  }

  var distEx = levelExercises(engine, "geo-segments-1").filter(function (ex) {
    var p = G.analyzeStart(ex);
    return (p.tasks || []).some(function (t) {
      return t.kind === "distSeg";
    });
  })[0];
  add(distEx ? { ok: true, id: "has-distSeg" } : fail("has-distSeg", "missing"));
  if (distEx) {
    var dHint = via({ intent: "hint", levelId: "geo-segments-1", n: distEx.n, history: [], geo: {} });
    add(dHint.ok && !dHint.local ? { ok: true, id: "parity-distSeg-hint" } : fail("parity-distSeg-hint", JSON.stringify(dHint)));
  }

  var unknownCap = handler.handle({ topic: "analytic", capability: "area", intent: "check" });
  add(unknownCap && unknownCap.error ? { ok: true, id: "unknown-capability" } : fail("unknown-capability", JSON.stringify(unknownCap)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/GEOMETRY_URL/.test(src) ? { ok: true, id: "gate-url" } : fail("gate-url", "missing"));
  add(/function isGeoLengthsServerActive/.test(src) ? { ok: true, id: "gate-fn" } : fail("gate-fn", "missing"));
  add(/intent: "check"/.test(src) && /geoServerCapability/.test(src) ? { ok: true, id: "gate-payload" } : fail("gate-payload", "missing"));
  add(/geoHintLocal/.test(src) && /geoOneStepLocal/.test(src) && /geoShowSolutionLocal/.test(src) ? { ok: true, id: "local-fallbacks" } : fail("local-fallbacks", "missing"));
  add(/showBasicEqServerUnavailable/.test(src) && /isGeoExtraPointPage/.test(src) ? { ok: true, id: "node-off-extra-point-pages" } : fail("node-off-extra-point-pages", "missing"));
  add(/if \(!remote\.step\)/.test(src) ? { ok: true, id: "onestep-no-step-not-solved" } : fail("onestep-no-step-not-solved", "missing"));

  var api = fs.readFileSync(path.join(__dirname, "api.js"), "utf8");
  add(/\/api\/geometry/.test(api) && !/\/api\/geometry\/lengths/.test(api) ? { ok: true, id: "single-endpoint" } : fail("single-endpoint", "split endpoint"));

  console.log("parity-geo-lengths: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 25).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
