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

function jsonSafe(res) {
  try {
    JSON.stringify(res);
    return true;
  } catch (err) {
    return false;
  }
}

function callMid(handler, intent, history, geo, extra) {
  extra = extra || {};
  var body = {
    capability: extra.capability || "midpoint",
    intent: intent,
    levelId: extra.levelId || "geo-midpoint-1",
    n: extra.n || 16,
    history: history || [],
    geo: geo || {},
  };
  if (extra.typed != null) body.typed = extra.typed;
  try {
    return via(handler, body);
  } catch (err) {
    return { throw: String((err && err.stack) || err) };
  }
}

function uiStepFail(id, res, extra) {
  return fail(id, JSON.stringify({ res: res, extra: extra || null }));
}

function commitUi(history, geo, res, typed) {
  if (res && res.ok && typed) history.push(typed);
  geo.done = res.done || {};
  geo.partial = res.partial || {};
  geo.lastExpr = res.lastExpr || {};
  geo.coords = res.coords || {};
}

function assertUiTick(handler, engine, G, pack, history, geo, res, id, typed) {
  if (res && res.throw) return uiStepFail(id + ":throw", res);
  if (!jsonSafe(res)) return fail(id + ":stringify", "circular");
  if (!res || res.ok !== true) return uiStepFail(id + ":http", res);
  var rec = reconstruct(engine, pack, history.concat(typed ? [typed] : []), {});
  if (res.solved && remainingRequired(pack, rec.done).length) {
    return uiStepFail(id + ":early-solved", res, rec.done);
  }
  if (typed) {
    var prior = history.slice();
    var chk = callMid(handler, "check", prior, geo, { typed: typed, n: pack._n });
    if (chk && chk.throw) return uiStepFail(id + ":check-throw", chk);
    if (!jsonSafe(chk)) return fail(id + ":check-stringify", "circular");
    if (!chk || !chk.ok) return uiStepFail(id + ":check-reject", { one: res, chk: chk, typed: typed });
  }
  return null;
}

function walkUiAxisPair(engine, handler, G, startTyped) {
  var pack = packFor(engine, "geo-midpoint-1", 16);
  var history = [];
  var geo = {};
  var setup = callMid(handler, "setup", history, geo, { n: 16 });
  var bad = assertUiTick(handler, engine, G, pack, history, geo, setup, "n16-ui-setup");
  if (bad) return bad;
  if (setup.solved) return fail("n16-ui-setup-solved", JSON.stringify(setup));

  function oneOrTyped(label, wantRe) {
    var one = callMid(handler, "one-step", history, geo, { n: 16 });
    bad = assertUiTick(handler, engine, G, pack, history, geo, one, label, one && one.step);
    if (bad) return bad;
    if (!one.step) return uiStepFail(label + ":no-step", one);
    if (wantRe && !wantRe.test(String(one.step))) {
      var typedHit = callMid(handler, "check", history, geo, { n: 16, typed: wantRe.source });
      return uiStepFail(label + ":unexpected-step", one, { want: String(wantRe) });
    }
    commitUi(history, geo, one, one.step);
    var rec = reconstruct(engine, pack, history, {});
    rec.partial = rec.partial || {};
    rec.coords = rec.coords || {};
    if (remainingRequired(pack, rec.done).length && (rec.done.A || rec.done.B) && !(rec.coords.A && rec.coords.A.x && rec.coords.A.y && rec.coords.B && rec.coords.B.x && rec.coords.B.y)) {
      if (rec.done.A && !(rec.coords.A && rec.coords.A.x && rec.coords.A.y)) {
        return fail(label + ":A-done-while-partial", JSON.stringify(rec));
      }
    }
    var focus = G.currentFocusTask(pack, rec);
    return { ok: true, one: one, rec: rec, focus: focus };
  }

  var first = callMid(handler, "check", history, geo, { n: 16, typed: startTyped });
  bad = assertUiTick(handler, engine, G, pack, history, geo, first, "n16-ui-first:" + startTyped, startTyped);
  if (bad) return bad;
  commitUi(history, geo, first, startTyped);

  var i;
  for (i = 0; i < 16; i++) {
    var recNow = reconstruct(engine, pack, history, {});
    if (!remainingRequired(pack, recNow.done).length) {
      return { ok: true, history: history, rec: recNow };
    }
    var nxt = oneOrTyped("n16-ui-step-" + i);
    if (!nxt.ok) return nxt;
  }
  return fail("n16-ui-long:" + startTyped, history.join(" >> "));
}

function walkUiN16Exact(engine, handler, G) {
  var pack = packFor(engine, "geo-midpoint-1", 16);
  var history = [];
  var geo = {};
  var rec;
  var setup = callMid(handler, "setup", history, geo, { n: 16 });
  var bad = assertUiTick(handler, engine, G, pack, history, geo, setup, "n16-exact-setup");
  if (bad) return bad;

  function checkLine(typed, label) {
    var res = callMid(handler, "check", history, geo, { n: 16, typed: typed });
    var err = assertUiTick(handler, engine, G, pack, history, geo, res, label, typed);
    if (err) return err;
    if (res.solved) return fail(label + ":early-solved", JSON.stringify(res));
    commitUi(history, geo, res, typed);
    var rec = reconstruct(engine, pack, history, {});
    if (!(rec.coords && rec.coords.A && rec.coords.A.x) && typed !== "y = 0" && typed !== "y=0") {
      if (history[0] === "x = 0" && typed !== "x = 0") {
        if (!(rec.coords && rec.coords.A && rec.coords.A.x)) {
          return fail(label + ":lost-Ax", JSON.stringify(rec));
        }
      }
    }
    return rec;
  }

  var recOrErr = checkLine("x = 0", "n16-exact-x0");
  if (recOrErr && recOrErr.ok === false) return recOrErr;
  rec = reconstruct(engine, pack, history, {});
  if (!(rec.coords && rec.coords.A && rec.coords.A.x) || rec.done.A) {
    return fail("n16-exact-x0-partial", JSON.stringify(rec));
  }

  var plug = callMid(handler, "one-step", history, geo, { n: 16 });
  bad = assertUiTick(handler, engine, G, pack, history, geo, plug, "n16-exact-plug", plug && plug.step);
  if (bad) return bad;
  if (!/3\s*=\s*\(0\s*\+\s*x\)\s*\/\s*2/.test(String(plug.step || ""))) {
    return fail("n16-exact-plug-step", JSON.stringify(plug));
  }
  commitUi(history, geo, plug, plug.step);

  var times = callMid(handler, "one-step", history, geo, { n: 16 });
  bad = assertUiTick(handler, engine, G, pack, history, geo, times, "n16-exact-times2", times && times.step);
  if (bad) return bad;
  if (!/6\s*=\s*0\s*\+\s*x/.test(String(times.step || ""))) {
    return fail("n16-exact-times2-step", JSON.stringify(times));
  }
  commitUi(history, geo, times, times.step);
  rec = reconstruct(engine, pack, history, {});
  if (rec.coords && rec.coords.B && rec.coords.B.x) {
    return fail("n16-exact-times2-Bx-too-soon", JSON.stringify(rec));
  }
  if (!(rec.partial && rec.partial.A && rec.partial.B)) {
    return fail("n16-exact-times2-partial", JSON.stringify(rec));
  }
  var focus = G.currentFocusTask(pack, rec);
  if (!focus || focus.id !== "B") return fail("n16-exact-times2-focus", focus && focus.id);

  var xb = callMid(handler, "one-step", history, geo, { n: 16 });
  bad = assertUiTick(handler, engine, G, pack, history, geo, xb, "n16-exact-xb", xb && xb.step);
  if (bad) return bad;
  if (!/^x\s*=\s*6$/.test(String(xb.step || "").replace(/\s+/g, " ").trim()) && String(xb.step).replace(/\s+/g, "") !== "x=6") {
    return fail("n16-exact-xb-step", JSON.stringify(xb));
  }
  commitUi(history, geo, xb, xb.step);
  rec = reconstruct(engine, pack, history, {});
  if (!(rec.coords && rec.coords.B && rec.coords.B.x) || rec.done.B) {
    return fail("n16-exact-xb-partial", JSON.stringify(rec));
  }

  var afterXb = callMid(handler, "one-step", history, geo, { n: 16 });
  bad = assertUiTick(handler, engine, G, pack, history, geo, afterXb, "n16-exact-after-xb", afterXb && afterXb.step);
  if (bad) return bad;
  var st = String(afterXb.step || "").replace(/\s+/g, "");
  if (st === "y=0") {
    commitUi(history, geo, afterXb, afterXb.step);
    rec = reconstruct(engine, pack, history, {});
    if (rec.done.B) return fail("n16-exact-y0-B-done", JSON.stringify(rec));
    afterXb = callMid(handler, "one-step", history, geo, { n: 16 });
    bad = assertUiTick(handler, engine, G, pack, history, geo, afterXb, "n16-exact-ay-plug", afterXb && afterXb.step);
    if (bad) return bad;
    st = String(afterXb.step || "").replace(/\s+/g, "");
  }
  if (!/5=\(0\+y\)\/2/.test(st) && !/5=\(y\+0\)\/2/.test(st)) {
    return fail("n16-exact-ay-plug-step", JSON.stringify(afterXb));
  }
  commitUi(history, geo, afterXb, afterXb.step);

  var j;
  for (j = 0; j < 12; j++) {
    rec = reconstruct(engine, pack, history, {});
    if (!remainingRequired(pack, rec.done).length) {
      if (!(rec.done.A && rec.done.B)) return fail("n16-exact-incomplete", JSON.stringify(rec.done));
      return { ok: true, history: history, rec: rec };
    }
    var one = callMid(handler, "one-step", history, geo, { n: 16 });
    bad = assertUiTick(handler, engine, G, pack, history, geo, one, "n16-exact-finish-" + j, one && one.step);
    if (bad) return bad;
    if (!one.step) return uiStepFail("n16-exact-finish-stuck", one, rec.done);
    commitUi(history, geo, one, one.step);
  }
  return fail("n16-exact-long", history.join(" >> "));
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
    return l.id === "geo-midpoint-1";
  })[0];
  add(
    level && level.exercises && level.exercises.length === 21
      ? { ok: true, id: "count-21" }
      : fail("count-21", String(level && level.exercises && level.exercises.length))
  );

  (level.exercises || []).forEach(function (ex) {
    var oneWalk = walkExercise(engine, handler, "geo-midpoint-1", ex, "one-step");
    var checkWalk = walkExercise(engine, handler, "geo-midpoint-1", ex, "check");
    var sol = via(handler, {
      capability: "midpoint",
      intent: "solution",
      levelId: "geo-midpoint-1",
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
    add({ ok: true, id: "full:geo-midpoint-1:" + ex.n });
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
    (oneWalk.pack.tasks || []).forEach(function (t) {
      add(isMigratedKind(t.kind, oneWalk.pack) ? { ok: true, id: "migrated:" + ex.n + ":" + t.id } : fail("migrated:" + ex.n + ":" + t.id, t.kind));
    });
    if (ex.n === 15) {
      add(oneWalk.caps.indexOf("points") >= 0 ? { ok: true, id: "n15-used-points" } : fail("n15-used-points", oneWalk.caps.join(">")));
      add(oneWalk.caps.indexOf("midpoint") >= 0 ? { ok: true, id: "n15-used-midpoint" } : fail("n15-used-midpoint", oneWalk.caps.join(">")));
    }
    if (ex.n === 17) {
      add(oneWalk.caps.indexOf("slope") >= 0 ? { ok: true, id: "n17-used-slope" } : fail("n17-used-slope", oneWalk.caps.join(">")));
      add(oneWalk.caps.indexOf("line-eq") >= 0 ? { ok: true, id: "n17-used-line-eq" } : fail("n17-used-line-eq", oneWalk.caps.join(">")));
    }
    if (ex.n === 18) {
      add(oneWalk.caps.indexOf("line-intersect") >= 0 ? { ok: true, id: "n18-used-intersect" } : fail("n18-used-intersect", oneWalk.caps.join(">")));
      add(oneWalk.caps.indexOf("midpoint") >= 0 ? { ok: true, id: "n18-used-midpoint" } : fail("n18-used-midpoint", oneWalk.caps.join(">")));
    }
    if (ex.n === 20) {
      add(oneWalk.caps.indexOf("points") >= 0 ? { ok: true, id: "n20-used-points" } : fail("n20-used-points", oneWalk.caps.join(">")));
      add(oneWalk.caps.indexOf("areas") >= 0 || oneWalk.caps.indexOf("lengths") >= 0 ? { ok: true, id: "n20-used-area-or-len" } : fail("n20-used-area-or-len", oneWalk.caps.join(">")));
      var eIdx = oneWalk.history.join("\n").indexOf("E(4;7)");
      var mIdx = oneWalk.history.join("\n").indexOf("M(4;3)");
      add(eIdx >= 0 && mIdx >= 0 && eIdx < mIdx ? { ok: true, id: "n20-E-before-M" } : fail("n20-E-before-M", oneWalk.history.join(" >> ")));
    }
  });

  var gateDist = via(handler, { capability: "midpoint", intent: "one-step", levelId: "geo-distance-1", n: 1, history: [], geo: {} });
  add(gateDist && gateDist.ok && !gateDist.local ? { ok: true, id: "gate-distance-server" } : fail("gate-distance-server", JSON.stringify(gateDist)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoMidpointPage/.test(src) && /geo-midpoint-1/.test(src) ? { ok: true, id: "client-mid-gate" } : fail("client-mid-gate", "missing"));
  add(/kind === "midpoint" && isGeoMidpointPage/.test(src) || /isGeoMidpointPage\(\) && \(kind === "midpoint"/.test(src) ? { ok: true, id: "client-kind-gate" } : fail("client-kind-gate", "missing"));
  add(/"midpoint"/.test(src) ? { ok: true, id: "client-capability" } : fail("client-capability", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "midpoint"/.test(geoApi) ? { ok: true, id: "mid-capability-wired" } : fail("mid-capability-wired", "missing"));

  var exact = walkUiN16Exact(engine, handler, G);
  add(exact && exact.ok ? { ok: true, id: "n16-ui-exact-forward" } : exact || fail("n16-ui-exact-forward", "missing"));
  var rev = walkUiAxisPair(engine, handler, G, "y = 0");
  add(rev && rev.ok ? { ok: true, id: "n16-ui-reverse-y0" } : rev || fail("n16-ui-reverse-y0", "missing"));

  add(/showGeometryProcessingError/.test(src) ? { ok: true, id: "client-http-vs-down" } : fail("client-http-vs-down", "missing"));
  var apiSrc = fs.readFileSync(path.join(__dirname, "api.js"), "utf8");
  add(/שגיאה בעיבוד הבדיקה/.test(apiSrc) && /geometry\.handle/.test(apiSrc) ? { ok: true, id: "api-geometry-trycatch" } : fail("api-geometry-trycatch", "missing"));

  console.log("flow-geo-midpoint: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 80).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

if (require.main === module) main();
