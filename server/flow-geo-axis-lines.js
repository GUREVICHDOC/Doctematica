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

function fullTask(pack, slim) {
  if (!slim || !slim.id) return slim;
  return (
    (pack.tasks || []).filter(function (t) {
      return t.id === slim.id;
    })[0] || slim
  );
}

function walkExercise(engine, handler, levelId, ex, mode) {
  var G = engine.DoctematicaGeometry;
  var pack = G.analyzeStart(ex);
  pack._levelId = levelId;
  var history = [];
  var draw = null;
  var saw = [];
  var caps = [];
  var heightAdds = 0;
  var i;
  for (i = 0; i < 320; i++) {
    var rec = reconstruct(engine, pack, history, { draw: draw });
    rec.draw = draw || rec.draw;
    if (!remainingRequired(pack, rec.done).length) {
      return { ok: true, saw: saw, caps: caps, n: ex.n, history: history, geo: rec, pack: pack };
    }
    var focus = G.currentFocusTask(pack, rec);
    var cap = capabilityForFocus(pack, focus);
    caps.push(cap);
    saw.push((focus && focus.kind) || "none");
    var beforeHist = history.slice();
    var geoPayload = { draw: rec.draw || draw, footCoords: rec.footCoords || {} };
    var one;
    if (mode === "check") {
      var h = G.nextHint(pack, rec);
      if (h && h.addHeight) {
        var ht0 = G.siteAddHeight(pack, rec, fullTask(pack, h.task));
        if (!ht0) {
          return fail("walk-addHeight-failed:" + levelId + ":" + ex.n, saw.join(">"));
        }
        draw = rec.draw;
        heightAdds += 1;
        if (heightAdds > 6) {
          return fail("walk-addHeight-loop:" + levelId + ":" + ex.n, saw.join(">"));
        }
        saw.push("addHeight");
        continue;
      }
      var typed = h && (h.rawStep ? h.step : h.step || h.answer);
      if (!typed) {
        one = via(handler, {
          capability: cap,
          intent: "one-step",
          levelId: levelId,
          n: ex.n,
          history: beforeHist,
          geo: geoPayload,
        });
      } else {
        one = via(handler, {
          capability: cap,
          intent: "check",
          levelId: levelId,
          n: ex.n,
          history: beforeHist,
          geo: geoPayload,
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
        geo: geoPayload,
      });
    }
    if (one && one.local) {
      return fail("walk-local-on-migrated:" + levelId + ":" + ex.n, JSON.stringify(one) + " saw=" + saw.join(">"));
    }
    if (one && one.addHeight) {
      var ht = G.siteAddHeight(pack, rec, fullTask(pack, one.task));
      if (!ht) {
        return fail("walk-onestep-addHeight-failed:" + levelId + ":" + ex.n, JSON.stringify(one));
      }
      draw = rec.draw;
      heightAdds += 1;
      if (heightAdds > 6) {
        return fail("walk-addHeight-loop:" + levelId + ":" + ex.n, saw.join(">"));
      }
      saw.push("addHeight");
      continue;
    }
    if (one && one.ok && !one.step && !remainingRequired(pack, reconstruct(engine, pack, history, { draw: draw }).done).length) {
      return { ok: true, saw: saw, caps: caps, n: ex.n, history: history, geo: reconstruct(engine, pack, history, { draw: draw }), pack: pack };
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
      geo: geoPayload,
      typed: one.step,
    });
    if (!chk || !chk.ok) {
      return fail(
        "walk-onestep-rejected-by-check:" + levelId + ":" + ex.n,
        JSON.stringify({ step: one.step, chk: chk, saw: saw })
      );
    }
    history.push(one.step);
    rec = reconstruct(engine, pack, history, { draw: draw });
    if (one.solved && remainingRequired(pack, rec.done).length) {
      return fail("walk-early-solved:" + levelId + ":" + ex.n, JSON.stringify(rec.done) + " saw=" + saw.join(">"));
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
    return l.id === "geo-axis-lines-1";
  })[0];
  add(
    level && level.exercises && level.exercises.length === 11
      ? { ok: true, id: "count-11" }
      : fail("count-11", String(level && level.exercises && level.exercises.length))
  );

  (level.exercises || []).forEach(function (ex) {
    var oneWalk = walkExercise(engine, handler, "geo-axis-lines-1", ex, "one-step");
    var checkWalk = walkExercise(engine, handler, "geo-axis-lines-1", ex, "check");
    var sol = via(handler, {
      capability: "axis-lines",
      intent: "solution",
      levelId: "geo-axis-lines-1",
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
    add({ ok: true, id: "full:geo-axis-lines-1:" + ex.n });
    add(
      remainingRequired(oneWalk.pack, oneWalk.geo.done).length === 0
        ? { ok: true, id: "complete:" + ex.n }
        : fail("complete:" + ex.n, JSON.stringify(oneWalk.geo.done))
    );
    add(
      sol && !sol.local && !sol.mixed && sol.steps && sol.steps.length
        ? { ok: true, id: "solution:" + ex.n }
        : fail("solution:" + ex.n, JSON.stringify(sol && { local: sol.local, mixed: sol.mixed, n: sol.steps && sol.steps.length }))
    );
    add(
      checkWalk.ok && remainingRequired(checkWalk.pack, checkWalk.geo.done).length === 0
        ? { ok: true, id: "manual:" + ex.n }
        : fail("manual:" + ex.n, checkWalk.detail || checkWalk.id || JSON.stringify(checkWalk.geo && checkWalk.geo.done))
    );
    add(
      doneKeys(oneWalk.geo.done) === doneKeys(checkWalk.ok ? checkWalk.geo.done : {})
        ? { ok: true, id: "same-done:" + ex.n }
        : fail("same-done:" + ex.n, oneWalk.geo.done && checkWalk.geo && JSON.stringify({ one: oneWalk.geo.done, check: checkWalk.geo.done }))
    );
    if (ex.n === 17 || ex.n === 18) {
      add(oneWalk.saw.indexOf("addHeight") >= 0 ? { ok: true, id: "addHeight:" + ex.n } : fail("addHeight:" + ex.n, oneWalk.saw.join(">")));
    }
    if (ex.n === 18) {
      add(oneWalk.caps.indexOf("line-eq") >= 0 ? { ok: true, id: "n18-used-line-eq" } : fail("n18-used-line-eq", oneWalk.caps.join(">")));
      add(oneWalk.caps.indexOf("slope") >= 0 ? { ok: true, id: "n18-used-slope" } : fail("n18-used-slope", oneWalk.caps.join(">")));
      add(oneWalk.caps.indexOf("points") >= 0 ? { ok: true, id: "n18-used-points" } : fail("n18-used-points", oneWalk.caps.join(">")));
    }
    if (ex.n === 7) {
      add(oneWalk.caps.indexOf("line-intersect") >= 0 ? { ok: true, id: "n7-used-intersect" } : fail("n7-used-intersect", oneWalk.caps.join(">")));
      add(oneWalk.caps.indexOf("axis-lines") >= 0 ? { ok: true, id: "n7-used-axis" } : fail("n7-used-axis", oneWalk.caps.join(">")));
    }
    (oneWalk.pack.tasks || []).forEach(function (t) {
      add(isMigratedKind(t.kind, oneWalk.pack) ? { ok: true, id: "migrated:" + ex.n + ":" + t.id } : fail("migrated:" + ex.n + ":" + t.id, t.kind));
    });
  });

  var pack7 = packFor(engine, "geo-axis-lines-1", 7);
  var recA = reconstruct(engine, pack7, ["A(0;2)"], {});
  var skipB = G.checkTyped("B(5;2)", pack7, recA);
  add(skipB && skipB.ok && skipB.done && skipB.done.B ? { ok: true, id: "n7-skip-B" } : fail("n7-skip-B", JSON.stringify(skipB && skipB.message)));
  recA = reconstruct(engine, pack7, ["A(0;2)", "B(5;2)"], {});
  var skipC = G.checkTyped("y=-3", pack7, recA);
  add(skipC && skipC.ok && skipC.done && skipC.done.eqC && !(skipC.done.eqB) ? { ok: true, id: "n7-axisSkip-eqC" } : fail("n7-axisSkip-eqC", JSON.stringify(skipC && { done: skipC.done, msg: skipC.message })));

  var setup4 = via(handler, { capability: "axis-lines", intent: "setup", levelId: "geo-axis-lines-1", n: 4, history: [], geo: {} });
  add(setup4 && setup4.capability === "slope" ? { ok: true, id: "setup-n4-slope" } : fail("setup-n4-slope", JSON.stringify(setup4)));
  var setup7 = via(handler, { capability: "axis-lines", intent: "setup", levelId: "geo-axis-lines-1", n: 7, history: [], geo: {} });
  add(setup7 && setup7.capability === "points" ? { ok: true, id: "setup-n7-points" } : fail("setup-n7-points", JSON.stringify(setup7)));
  var setup18 = via(handler, { capability: "axis-lines", intent: "setup", levelId: "geo-axis-lines-1", n: 18, history: [], geo: {} });
  add(setup18 && setup18.capability === "points" ? { ok: true, id: "setup-n18-points" } : fail("setup-n18-points", JSON.stringify(setup18)));

  var gatePerp = via(handler, { capability: "axis-lines", intent: "one-step", levelId: "geo-perp-1", n: 1, history: [], geo: {} });
  add(gatePerp && gatePerp.ok && !gatePerp.local ? { ok: true, id: "gate-perp-axis-server" } : fail("gate-perp-axis-server", JSON.stringify(gatePerp)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoAxisLinesPage/.test(src) && /geo-axis-lines-1/.test(src) ? { ok: true, id: "client-axis-gate" } : fail("client-axis-gate", "missing"));
  add(/kind === "yesNo" && isGeoAxisLinesPage/.test(src) || /isGeoAxisLinesPage\(\) && kind === "yesNo"/.test(src) ? { ok: true, id: "client-kind-gate" } : fail("client-kind-gate", "missing"));
  add(/"axis-lines"/.test(src) ? { ok: true, id: "client-capability" } : fail("client-capability", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "axis-lines"/.test(geoApi) ? { ok: true, id: "axis-capability-wired" } : fail("axis-capability-wired", "missing"));

  console.log("flow-geo-axis-lines: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 80).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

if (require.main === module) main();
