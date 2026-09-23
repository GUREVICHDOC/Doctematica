"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var isMigratedKind = require("./geo-lengths").isMigratedKind;
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
  var sawFormula = false;
  var sawSplit = false;
  var i;
  for (i = 0; i < 400; i++) {
    var rec = reconstruct(engine, pack, history, { draw: draw });
    rec.draw = draw || rec.draw;
    if (!remainingRequired(pack, rec.done).length) {
      return { ok: true, saw: saw, caps: caps, n: ex.n, history: history, geo: rec, pack: pack, sawFormula: sawFormula, sawSplit: sawSplit };
    }
    var focus = G.currentFocusTask(pack, rec);
    if (!focus) {
      focus = remainingRequired(pack, rec.done)[0] || null;
    }
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
      return { ok: true, saw: saw, caps: caps, n: ex.n, history: history, geo: reconstruct(engine, pack, history, { draw: draw }), pack: pack, sawFormula: sawFormula, sawSplit: sawSplit };
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
    if (ex.n === 16 && chk && chk.offerFormula) sawFormula = true;
    if (ex.n === 16 && chk && chk.canSplit) sawSplit = true;
    if (!chk || !chk.ok) {
      return fail(
        "walk-onestep-rejected-by-check:" + levelId + ":" + ex.n,
        JSON.stringify({ step: one.step, chk: chk, saw: saw })
      );
    }
    if (chk.solved && remainingRequired(pack, reconstruct(engine, pack, beforeHist.concat([one.step]), { draw: draw }).done).length) {
      return fail("walk-early-solved:" + levelId + ":" + ex.n, JSON.stringify({ step: one.step, done: chk.done }));
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
  var handler = createGeometryHandler(engine);
  var passed = 0;
  var failed = [];
  function add(item) {
    if (item && item.ok) passed += 1;
    else failed.push(item);
  }

  var levels = engine.DoctematicaCurriculum.levels;
  var level = levels.filter(function (l) {
    return l.id === "geo-distance-1";
  })[0];
  add(
    level && level.exercises && level.exercises.length === 26
      ? { ok: true, id: "count-26" }
      : fail("count-26", String(level && level.exercises && level.exercises.length))
  );

  (level.exercises || []).forEach(function (ex) {
    var oneWalk = walkExercise(engine, handler, "geo-distance-1", ex, "one-step");
    var checkWalk = walkExercise(engine, handler, "geo-distance-1", ex, "check");
    var sol = via(handler, {
      capability: "distance",
      intent: "solution",
      levelId: "geo-distance-1",
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
    add({ ok: true, id: "full:geo-distance-1:" + ex.n });
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
        : fail("same-done:" + ex.n, JSON.stringify({ one: oneWalk.geo.done, check: checkWalk.geo && checkWalk.geo.done }))
    );
    (oneWalk.pack.tasks || []).forEach(function (t) {
      add(isMigratedKind(t.kind, oneWalk.pack) ? { ok: true, id: "migrated:" + ex.n + ":" + t.id } : fail("migrated:" + ex.n + ":" + t.id, t.kind));
    });
    if (ex.n === 9) {
      add(oneWalk.caps.indexOf("distance") >= 0 ? { ok: true, id: "n9-used-distance" } : fail("n9-used-distance", oneWalk.caps.join(">")));
    }
    if (ex.n === 10) {
      add(oneWalk.caps.indexOf("line-intersect") >= 0 ? { ok: true, id: "n10-used-intersect" } : fail("n10-used-intersect", oneWalk.caps.join(">")));
    }
    if (ex.n === 11) {
      add(oneWalk.caps.indexOf("slope") >= 0 ? { ok: true, id: "n11-used-slope" } : fail("n11-used-slope", oneWalk.caps.join(">")));
      add(oneWalk.caps.indexOf("line-eq") >= 0 ? { ok: true, id: "n11-used-line-eq" } : fail("n11-used-line-eq", oneWalk.caps.join(">")));
      add(oneWalk.caps.indexOf("distance") >= 0 ? { ok: true, id: "n11-used-distance" } : fail("n11-used-distance", oneWalk.caps.join(">")));
    }
    if (ex.n === 12) {
      add(oneWalk.caps.indexOf("midpoint") >= 0 ? { ok: true, id: "n12-used-midpoint" } : fail("n12-used-midpoint", oneWalk.caps.join(">")));
    }
    if (ex.n === 14) {
      add(oneWalk.caps.indexOf("perpendicular") >= 0 ? { ok: true, id: "n14-used-perp" } : fail("n14-used-perp", oneWalk.caps.join(">")));
    }
    if (ex.n === 16 || ex.n === 17 || ex.n === 23) {
      add(oneWalk.caps.indexOf("distance") >= 0 ? { ok: true, id: "n" + ex.n + "-used-distance" } : fail("n" + ex.n + "-used-distance", oneWalk.caps.join(">")));
    }
    if (ex.n === 16) {
      add(oneWalk.sawFormula ? { ok: true, id: "n16-offer-formula" } : fail("n16-offer-formula", "formula buttons never offered"));
      add(oneWalk.sawSplit ? { ok: true, id: "n16-offer-split" } : fail("n16-offer-split", "split never offered"));
    }
  });

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoDistancePage/.test(src) && /geo-distance-1/.test(src) ? { ok: true, id: "client-dist-gate" } : fail("client-dist-gate", "missing"));
  add(/"distance"/.test(src) ? { ok: true, id: "client-capability" } : fail("client-capability", "missing"));
  add(/showBasicEqServerUnavailable/.test(src) && /isGeoDistancePage/.test(src) ? { ok: true, id: "node-off-wired" } : fail("node-off-wired", "missing"));
  add(/geoEqSolveActive\(\)\) return "mixed"/.test(src) ? { ok: true, id: "dist-uses-mixed-engine" } : fail("dist-uses-mixed-engine", "distance quadratic stage does not call the mixed engine"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "distance"/.test(geoApi) ? { ok: true, id: "dist-capability-wired" } : fail("dist-capability-wired", "missing"));

  console.log("flow-geo-distance: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 80).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

if (require.main === module) main();
