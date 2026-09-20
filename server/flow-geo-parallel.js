"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var isMigratedKind = require("./geo-lengths").isMigratedKind;
var packFor = require("./geo-lengths").packFor;
var reconstruct = require("./geo-lengths").reconstruct;
var capabilityForFocus = require("./geo-lengths").capabilityForFocus;

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
  if (res.done && Object.keys(res.done).length) geo.done = res.done;
  if (res.partial && Object.keys(res.partial).length) geo.partial = res.partial;
  if (res.lastExpr && Object.keys(res.lastExpr).length) geo.lastExpr = res.lastExpr;
  if (res.coords && Object.keys(res.coords).length) geo.coords = res.coords;
  if (res.footCoords) geo.footCoords = res.footCoords;
  if (res.pointRoute) geo.pointRoute = res.pointRoute;
  if (res.lineEq) geo.lineEq = Object.assign({}, geo.lineEq || {}, res.lineEq);
  if (res.intersect) geo.intersect = Object.assign({}, geo.intersect || {}, res.intersect);
  if (res.lineMatch) geo.lineMatch = res.lineMatch;
  if (res.lineEqDisplay) geo.lineEqDisplay = res.lineEqDisplay;
  if (res.mbRearranged) geo.mbRearranged = true;
  if (res.mbRearrangeExpr) geo.mbRearrangeExpr = res.mbRearrangeExpr;
}

function remainingRequired(pack, done) {
  return (pack.tasks || []).filter(function (t) {
    return !t.optional && !(done && done[t.id]);
  });
}

function doneKeys(done) {
  return Object.keys(done || {})
    .filter(function (k) {
      return done[k];
    })
    .sort()
    .join(",");
}

function via(handler, payload) {
  return handler.handle(Object.assign({ topic: "analytic" }, payload));
}

function walkExercise(engine, handler, levelId, ex, mode) {
  var G = engine.DoctematicaGeometry;
  var pack = G.analyzeStart(ex);
  pack._levelId = levelId;
  var history = [];
  var geo = emptyGeo();
  var saw = [];
  var caps = [];
  var i;
  for (i = 0; i < 320; i++) {
    var rec = reconstruct(engine, pack, history, {});
    geo = rec;
    if (!remainingRequired(pack, rec.done).length) {
      return { ok: true, saw: saw, caps: caps, n: ex.n, history: history, geo: geo, pack: pack };
    }
    var focus = G.currentFocusTask(pack, rec);
    var cap = capabilityForFocus(pack, focus);
    caps.push(cap);
    saw.push((focus && focus.kind) || "none");
    var beforeHist = history.slice();
    var one;
    var matchActive = G.lineMatchPartActive && G.lineMatchPartActive(pack, rec);
    if (mode === "check" && !matchActive) {
      var h = G.nextHint(pack, rec);
      var typed = h && (h.rawStep ? h.step : h.step || h.answer);
      if (!typed) {
        one = via(handler, {
          capability: cap,
          intent: "one-step",
          levelId: levelId,
          n: ex.n,
          history: beforeHist,
          geo: {},
        });
      } else {
        one = via(handler, {
          capability: cap,
          intent: "check",
          levelId: levelId,
          n: ex.n,
          history: beforeHist,
          geo: {},
          typed: typed,
        });
        if (one && one.ok) one.step = typed;
      }
    } else {
      one = via(handler, {
        capability: cap,
        intent: "one-step",
        levelId: levelId,
        n: ex.n,
        history: beforeHist,
        geo: {},
      });
    }
    if (one && one.local) {
      return fail("walk-local-on-migrated:" + levelId + ":" + ex.n, JSON.stringify(one) + " saw=" + saw.join(">"));
    }
    if (one && one.ok && !one.step && !remainingRequired(pack, reconstruct(engine, pack, history, {}).done).length) {
      return { ok: true, saw: saw, caps: caps, n: ex.n, history: history, geo: reconstruct(engine, pack, history, {}), pack: pack };
    }
    if (!one || !one.ok || !one.step) {
      return fail("walk-stuck:" + levelId + ":" + ex.n, JSON.stringify(one) + " saw=" + saw.join(">"));
    }
    var chk = via(handler, {
      capability: cap,
      intent: "check",
      levelId: levelId,
      n: ex.n,
      history: beforeHist,
      geo: {},
      typed: one.step,
    });
    if (!chk || !chk.ok) {
      return fail(
        "walk-onestep-rejected-by-check:" + levelId + ":" + ex.n,
        JSON.stringify({ step: one.step, chk: chk, saw: saw })
      );
    }
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
  var level = levels.filter(function (l) {
    return l.id === "geo-parallel-1";
  })[0];
  add(
    level && level.exercises && level.exercises.length === 22
      ? { ok: true, id: "count-22" }
      : fail("count-22", String(level && level.exercises && level.exercises.length))
  );

  (level.exercises || []).forEach(function (ex) {
    var oneWalk = walkExercise(engine, handler, "geo-parallel-1", ex, "one-step");
    var sol = via(handler, {
      capability: "parallel",
      intent: "solution",
      levelId: "geo-parallel-1",
      n: ex.n,
      history: [],
      geo: {},
    });
    if (!oneWalk.ok) {
      if (sol && !sol.local && sol.steps && sol.steps.length) {
        add(fail("one-step-stuck-solution-continues:" + ex.n, oneWalk.detail || oneWalk.id));
      } else {
        add(oneWalk);
      }
      return;
    }
    add({ ok: true, id: "full:geo-parallel-1:" + ex.n });
    add(
      remainingRequired(oneWalk.pack, oneWalk.geo.done).length === 0
        ? { ok: true, id: "complete:" + ex.n }
        : fail("complete:" + ex.n, JSON.stringify(oneWalk.geo.done))
    );
    add(
      (oneWalk.pack.tasks || []).every(function (t) {
        return isMigratedKind(t.kind, oneWalk.pack);
      })
        ? { ok: true, id: "all-migrated:" + ex.n }
        : fail("all-migrated:" + ex.n, (oneWalk.pack.tasks || []).map(function (t) { return t.kind; }).join(","))
    );
    add(
      sol && !sol.local && !sol.mixed && sol.steps && sol.steps.length
        ? { ok: true, id: "sol-server:" + ex.n }
        : fail("sol-server:" + ex.n, JSON.stringify(sol && { mixed: sol.mixed, local: sol.local, n: sol.steps && sol.steps.length }))
    );

    var manWalk = walkExercise(engine, handler, "geo-parallel-1", ex, "check");
    add(manWalk.ok ? { ok: true, id: "manual:" + ex.n } : manWalk);
    if (manWalk.ok && oneWalk.ok) {
      add(
        doneKeys(manWalk.geo.done) === doneKeys(oneWalk.geo.done)
          ? { ok: true, id: "manual-onestep-same:" + ex.n }
          : fail("manual-onestep-same:" + ex.n, JSON.stringify({ man: manWalk.geo.done, one: oneWalk.geo.done }))
      );
    }
    if (sol && sol.done && oneWalk.ok) {
      add(
        remainingRequired(oneWalk.pack, sol.done).length === 0
          ? { ok: true, id: "sol-onestep-same:" + ex.n }
          : fail("sol-onestep-same:" + ex.n, JSON.stringify({ sol: sol.done, one: oneWalk.geo.done }))
      );
    }
  });

  var keyNs = [1, 4, 9, 10, 12, 14, 16, 17, 18, 19, 20, 21, 22];
  keyNs.forEach(function (n) {
    var pack = packFor(engine, "geo-parallel-1", n);
    var recFake = reconstruct(
      engine,
      pack,
      [],
      {
        done: { par: true, m: true, eq: true, A: true, B: true, P: true },
        partial: { m: true },
        lastExpr: { m: "9", par: "כן" },
        coords: { A: { x: true, y: true } },
        lineEq: { I: "y = 9x" },
        intersect: { x: 9, y: 9 },
        lineMatch: { eq1: { lineKey: "I", reasonId: "slope" } },
      }
    );
    add(
      remainingRequired(pack, recFake.done).length === remainingRequired(pack, {}).length
        ? { ok: true, id: "no-trust-empty-hist:" + n }
        : fail("no-trust-empty-hist:" + n, JSON.stringify(recFake.done))
    );
  });

  var pack10 = packFor(engine, "geo-parallel-1", 10);
  var first10 = via(handler, {
    capability: "slope",
    intent: "one-step",
    levelId: "geo-parallel-1",
    n: 10,
    history: [],
    geo: {},
  });
  add(
    first10 && first10.ok && /mY/i.test(String(first10.step || "")) && !first10.solved
      ? { ok: true, id: "n10-onestep-copy-label-Y" }
      : fail("n10-onestep-copy-label-Y", JSON.stringify(first10))
  );
  var chk10 = via(handler, {
    capability: "slope",
    intent: "check",
    levelId: "geo-parallel-1",
    n: 10,
    history: [],
    geo: {},
    typed: first10 && first10.step,
  });
  add(
    chk10 && chk10.ok && chk10.task && chk10.task.kind === "slope"
      ? { ok: true, id: "n10-onestep-accepted-by-check" }
      : fail("n10-onestep-accepted-by-check", JSON.stringify(chk10))
  );

  var setup1 = via(handler, { capability: "parallel", intent: "setup", levelId: "geo-parallel-1", n: 1, history: [], geo: {} });
  add(setup1 && setup1.server && setup1.capability === "parallel" ? { ok: true, id: "setup-n1-parallel" } : fail("setup-n1-parallel", JSON.stringify(setup1)));
  var setup9 = via(handler, { capability: "parallel", intent: "setup", levelId: "geo-parallel-1", n: 9, history: [], geo: {} });
  add(setup9 && setup9.server && setup9.capability === "slope" ? { ok: true, id: "setup-n9-slope" } : fail("setup-n9-slope", JSON.stringify(setup9)));

  var gatePerpPar = via(handler, { capability: "parallel", intent: "one-step", levelId: "geo-perp-1", n: 1, history: [], geo: {} });
  add(gatePerpPar && gatePerpPar.ok && !gatePerpPar.local ? { ok: true, id: "gate-perp-parallel-server" } : fail("gate-perp-parallel-server", JSON.stringify(gatePerpPar)));
  var gatePerpSlope = via(handler, { capability: "slope", intent: "one-step", levelId: "geo-perp-1", n: 1, history: [], geo: {} });
  add(gatePerpSlope && gatePerpSlope.ok && !gatePerpSlope.local ? { ok: true, id: "gate-perp-slope-server" } : fail("gate-perp-slope-server", JSON.stringify(gatePerpSlope)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoParallelPage/.test(src) && /geo-parallel-1/.test(src) ? { ok: true, id: "client-parallel-gate" } : fail("client-parallel-gate", "missing"));
  add(/kind === "parallel" && isGeoParallelPage/.test(src) || /isGeoParallelPage\(\) && kind === "parallel"/.test(src) ? { ok: true, id: "client-kind-gate" } : fail("client-kind-gate", "missing"));
  add(/"parallel"/.test(src) ? { ok: true, id: "client-capability" } : fail("client-capability", "missing"));
  add(/showBasicEqServerUnavailable/.test(src) && /isGeoParallelPage/.test(src) ? { ok: true, id: "node-off-wired" } : fail("node-off-wired", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "parallel"/.test(geoApi) ? { ok: true, id: "parallel-capability-wired" } : fail("parallel-capability-wired", "missing"));

  console.log("flow-geo-parallel: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 80).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

if (require.main === module) main();
