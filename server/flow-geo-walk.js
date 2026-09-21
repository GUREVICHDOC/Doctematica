"use strict";

var fs = require("fs");
var path = require("path");
var reconstruct = require("./geo-lengths").reconstruct;
var capabilityForFocus = require("./geo-lengths").capabilityForFocus;
var isMigratedKind = require("./geo-lengths").isMigratedKind;
var packFor = require("./geo-lengths").packFor;
var EXTRA_POINT_PAGE_IDS = require("./geo-lengths").EXTRA_POINT_PAGE_IDS;

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
  for (i = 0; i < 400; i++) {
    var rec = reconstruct(engine, pack, history, { draw: draw });
    rec.draw = draw || rec.draw;
    if (!remainingRequired(pack, rec.done).length) {
      return { ok: true, saw: saw, caps: caps, n: ex.n, history: history, geo: rec, pack: pack };
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
        if (!ht0 && G.siteAddAllHeights) ht0 = G.siteAddAllHeights(pack, rec);
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
        if (!one || !one.ok) {
          one = via(handler, {
            capability: cap,
            intent: "one-step",
            levelId: levelId,
            n: ex.n,
            history: beforeHist,
            geo: geoPayload,
          });
        }
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
      if (!ht && G.siteAddAllHeights) ht = G.siteAddAllHeights(pack, rec);
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
    if (chk.solved && remainingRequired(pack, reconstruct(engine, pack, beforeHist.concat([one.step]), { draw: draw }).done).length) {
      chk.solved = false;
    }
    history.push(one.step);
    rec = reconstruct(engine, pack, history, { draw: draw });
    if (one.solved && remainingRequired(pack, rec.done).length) {
      one.solved = false;
    }
  }
  return fail("walk-long:" + levelId + ":" + ex.n, saw.join(">"));
}

function addHybridSuite(add, engine, handler, levelId, defaultCap, extra) {
  extra = extra || {};
  var levels = engine.DoctematicaCurriculum.levels;
  var level = levels.filter(function (l) {
    return l.id === levelId;
  })[0];
  if (extra.count != null) {
    add(
      level && level.exercises && level.exercises.length === extra.count
        ? { ok: true, id: "count-" + extra.count }
        : fail("count-" + extra.count, String(level && level.exercises && level.exercises.length))
    );
  }
  (level.exercises || []).forEach(function (ex) {
    var oneWalk = walkExercise(engine, handler, levelId, ex, "one-step");
    var checkWalk = walkExercise(engine, handler, levelId, ex, "check");
    var sol = via(handler, {
      capability: defaultCap,
      intent: "solution",
      levelId: levelId,
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
    add({ ok: true, id: "full:" + levelId + ":" + ex.n });
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
    if (extra.onWalk) extra.onWalk(add, ex, oneWalk);
  });
  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(
    /showBasicEqServerUnavailable/.test(src) && /isGeoLengthsServerActive/.test(src)
      ? { ok: true, id: "node-off-unavailable:" + levelId }
      : fail("node-off-unavailable:" + levelId, "missing unavailable wiring")
  );
  add(
    /if \(isGeoLengthsServerActive\(\)\)/.test(src) && /geoHintLocal/.test(src) && /geoOneStepLocal/.test(src)
      ? { ok: true, id: "node-off-no-quiet-fallback:" + levelId }
      : fail("node-off-no-quiet-fallback:" + levelId, "missing")
  );
  if (EXTRA_POINT_PAGE_IDS[levelId]) {
    add(
      /function isGeoExtraPointPage/.test(src) && src.indexOf('"' + levelId + '"') >= 0
        ? { ok: true, id: "node-off-extra-point-gate:" + levelId }
        : fail("node-off-extra-point-gate:" + levelId, "missing extra point page")
    );
  }
  return level;
}

function addNoTrust(add, engine, handler, levelId, n, cap, fake) {
  fake = fake || {};
  if (fake.answerX == null) fake.answerX = 999;
  if (fake.answerY == null) fake.answerY = 999;
  var pack = packFor(engine, levelId, n);
  var rec = reconstruct(engine, pack, [], fake);
  var first = (pack.tasks || []).filter(function (t) {
    return !t.optional;
  })[0];
  add(!(rec.done && first && rec.done[first.id]) ? { ok: true, id: "no-trust-done:" + levelId } : fail("no-trust-done:" + levelId, JSON.stringify(rec.done)));
  var chk = via(handler, {
    capability: cap,
    intent: "check",
    levelId: levelId,
    n: n,
    history: [],
    geo: fake,
    typed: "999",
  });
  add(chk && !chk.ok ? { ok: true, id: "no-trust-check:" + levelId } : fail("no-trust-check:" + levelId, JSON.stringify(chk && { ok: chk.ok, done: chk.done })));
  var one = via(handler, {
    capability: cap,
    intent: "one-step",
    levelId: levelId,
    n: n,
    history: [],
    geo: fake,
  });
  add(
    one && !one.local && !one.solved
      ? { ok: true, id: "no-trust-onestep:" + levelId }
      : fail("no-trust-onestep:" + levelId, JSON.stringify(one && { local: one.local, solved: one.solved, ok: one.ok }))
  );
}

module.exports = {
  fail: fail,
  remainingRequired: remainingRequired,
  doneKeys: doneKeys,
  via: via,
  walkExercise: walkExercise,
  addHybridSuite: addHybridSuite,
  addNoTrust: addNoTrust,
  isMigratedKind: isMigratedKind,
};
