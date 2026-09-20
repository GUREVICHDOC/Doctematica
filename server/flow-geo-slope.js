"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var isMigratedKind = require("./geo-lengths").isMigratedKind;
var packFor = require("./geo-lengths").packFor;
var reconstruct = require("./geo-lengths").reconstruct;

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
  if (res.done) geo.done = res.done;
  if (res.partial !== undefined) geo.partial = res.partial;
  if (res.lastExpr) geo.lastExpr = res.lastExpr;
  if (res.coords) geo.coords = res.coords;
  if (res.footCoords) geo.footCoords = res.footCoords;
  if (res.pointRoute) geo.pointRoute = res.pointRoute;
  if (res.lineEq) geo.lineEq = Object.assign({}, geo.lineEq || {}, res.lineEq);
  if (res.intersect) geo.intersect = Object.assign({}, geo.intersect || {}, res.intersect);
  if (res.lineMatch) geo.lineMatch = res.lineMatch;
  if (res.lineEqDisplay) geo.lineEqDisplay = res.lineEqDisplay;
}

function remainingRequired(pack, done) {
  return (pack.tasks || []).filter(function (t) {
    return !t.optional && !(done && done[t.id]);
  });
}

function capFor(kind) {
  if (kind === "area") return "areas";
  if (kind === "segment" || kind === "origin" || kind === "axis" || kind === "distSeg") return "lengths";
  if (kind === "slope") return "slope";
  if (kind === "lineEq") return "line-eq";
  if (kind === "lineMatch") return "line-match";
  if (kind === "lineIntersect" || kind === "rearrange") return "line-intersect";
  return "points";
}

function applyLocalMatch(G, pack, geo) {
  var lm = G.lineMatchOneStep(pack, geo);
  if (!lm) return null;
  var res = null;
  if (lm.action === "line") res = G.submitLineMatchLine(lm.taskId, lm.lineKey, pack, geo);
  else if (lm.action === "reason") res = G.submitLineMatchReason(lm.taskId, lm.reasonId, pack, geo);
  if (res && res.ok && G.lineMatchAutoCompleteRemaining) {
    var auto = G.lineMatchAutoCompleteRemaining(pack, geo);
    if (auto && auto.length) {
      var last = auto[auto.length - 1];
      if (last.done) res.done = last.done;
      if (last.lineMatch) res.lineMatch = last.lineMatch;
      if (last.solved) res.solved = true;
    }
  }
  return res;
}

function walkExercise(engine, handler, levelId, ex) {
  var G = engine.DoctematicaGeometry;
  var pack = G.analyzeStart(ex);
  pack._levelId = levelId;
  var history = [];
  var geo = emptyGeo();
  var saw = [];
  var i;
  for (i = 0; i < 280; i++) {
    if (!remainingRequired(pack, geo.done).length) {
      return { ok: true, saw: saw, n: ex.n, history: history, geo: geo, pack: pack };
    }
    if (G.lineMatchPartActive && G.lineMatchPartActive(pack, geo)) {
      saw.push("lineMatch");
      var matchRes = applyLocalMatch(G, pack, geo);
      if (!matchRes || !matchRes.ok) {
        return fail("walk-match:" + levelId + ":" + ex.n, JSON.stringify(matchRes) + " saw=" + saw.join(">"));
      }
      applyRes(geo, matchRes);
      continue;
    }
    var h = G.nextHint(pack, geo);
    var kind = h && h.task && h.task.kind;
    saw.push((h && h.addHeight ? "addHeight:" : "") + (kind || "none"));
    if (h && (h.addHeight || (h.message && String(h.message).indexOf("+ גובה") >= 0))) {
      if (G.siteAddHeight) G.siteAddHeight(pack, geo, h.task);
      if (h.addHeight && !h.step) continue;
    }
    if (h && h.footCalc && h.step && !(h.task && isMigratedKind(h.task.kind, pack))) {
      var footRes = G.checkTyped(String(h.step), pack, geo);
      if (!footRes || !footRes.ok) {
        return fail("walk-foot:" + levelId + ":" + ex.n, (footRes && footRes.message) + " typed=" + h.step);
      }
      applyRes(geo, footRes);
      continue;
    }
    if (kind && isMigratedKind(kind, pack)) {
      var one = handler.handle({
        topic: "analytic",
        capability: capFor(kind),
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
      if (!one || !one.ok || !one.step) {
        var skipCands = [];
        if (h.answer) skipCands.push(h.answer);
        if (h.step) skipCands.push(h.step);
        if (one && one.hint) skipCands.push(one.hint);
        var skipped = null;
        var si;
        for (si = 0; si < skipCands.length; si++) {
          if (!skipCands[si]) continue;
          var chk = handler.handle({
            topic: "analytic",
            capability: capFor(kind),
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
        if (!skipped) {
          return fail("walk-stuck:" + levelId + ":" + ex.n, JSON.stringify(one) + " saw=" + saw.join(">"));
        }
        one = skipped;
      }
      applyRes(geo, one);
      history.push(one.step);
      if (one.solved && remainingRequired(pack, geo.done).length) {
        return fail("walk-early-solved:" + levelId + ":" + ex.n, JSON.stringify(geo.done) + " saw=" + saw.join(">"));
      }
      continue;
    }
    if (!h || !h.task) {
      return fail("walk-no-task:" + levelId + ":" + ex.n, (h && h.message) || "no task");
    }
    var ask = G.lineAsk && G.lineAsk(pack, geo);
    if (ask && ask.stage === "reason" && G.submitReason) {
      var reasonLine = h.step || (ask.choices && ask.choices[0]) || "";
      var reason = G.submitReason(reasonLine, pack, geo);
      if (reason && reason.ok) {
        applyRes(geo, reason);
        continue;
      }
    }
    var typed = h.rawStep ? h.step : h.step || h.answer;
    var localCands = [typed];
    if (h.answer && h.answer !== typed) localCands.push(h.answer);
    var cf = (geo.coords && h.task && geo.coords[h.task.id]) || {};
    if (h.task && h.task.kind === "onLine" && !(cf.x && cf.y)) {
      localCands.push(h.task.on ? "כן" : "לא");
    }
    if (h.task && h.task.kind === "point") {
      if (h.task.answerX != null) localCands.push("x = " + h.task.answerX);
      if (h.task.answerY != null) localCands.push("y = " + h.task.answerY);
      if (h.task.answerX != null && h.task.answerY != null) {
        localCands.push((h.task.label || h.task.point || "P") + "(" + h.task.answerX + ";" + h.task.answerY + ")");
      }
    }
    if (h.task && h.task.kind === "lineEq" && G.canonicalLineEqSteps) {
      (G.canonicalLineEqSteps(h.task) || []).forEach(function (line) {
        localCands.push(line);
      });
    }
    if (h.task && h.task.kind === "lineIntersect" && G.canonicalLineIntersectSteps) {
      (G.canonicalLineIntersectSteps(h.task, pack) || []).forEach(function (line) {
        localCands.push(line);
      });
      if (h.task.answerX != null && h.task.answerY != null) {
        localCands.push((h.task.label || h.task.point || "P") + "(" + h.task.answerX + ";" + h.task.answerY + ")");
      }
    }
    var local = null;
    var li;
    for (li = 0; li < localCands.length; li++) {
      if (!localCands[li]) continue;
      local = G.checkTyped(String(localCands[li]), pack, geo);
      if (local && local.ok) break;
    }
    if (!local || !local.ok) {
      return fail("walk-local:" + levelId + ":" + ex.n, (local && local.message) + " typed=" + typed + " kind=" + kind);
    }
    applyRes(geo, local);
  }
  return fail("walk-long:" + levelId + ":" + ex.n, saw.join(">"));
}

function walkDirectM(engine, handler) {
  var pack = packFor(engine, "geo-slope-1", 1);
  var geo = emptyGeo();
  var history = [];
  var first = handler.handle({
    topic: "analytic",
    capability: "slope",
    intent: "check",
    levelId: "geo-slope-1",
    n: 1,
    history: history,
    geo: geo,
    typed: "m = 2",
  });
  if (!first || !first.ok || !first.done || !first.done.m) return fail("direct-m", JSON.stringify(first));
  applyRes(geo, first);
  return { ok: true, history: ["m = 2"], geo: geo, pack: pack };
}

function via(handler, payload) {
  return handler.handle(Object.assign({ topic: "analytic" }, payload));
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
    return l.id === "geo-slope-1";
  })[0];
  add(
    level && level.exercises && level.exercises.length === 23
      ? { ok: true, id: "count-23" }
      : fail("count-23", String(level && level.exercises && level.exercises.length))
  );

  (level.exercises || []).forEach(function (ex) {
    var out = walkExercise(engine, handler, "geo-slope-1", ex);
    add(out.ok ? { ok: true, id: "full:geo-slope-1:" + ex.n } : out);
    if (out.ok) {
      var hasLocal = (out.pack.tasks || []).some(function (t) {
        return !isMigratedKind(t.kind, out.pack);
      });
      var sol = via(handler, {
        capability: "slope",
        intent: "solution",
        levelId: "geo-slope-1",
        n: ex.n,
        history: [],
        geo: {},
      });
      if (hasLocal) {
        add(sol && sol.local && sol.mixed ? { ok: true, id: "sol-mixed:" + ex.n } : fail("sol-mixed:" + ex.n, JSON.stringify(sol)));
      } else {
        add(
          sol && !sol.local && sol.steps && sol.steps.length
            ? { ok: true, id: "sol-server:" + ex.n }
            : fail("sol-server:" + ex.n, JSON.stringify(sol && { mixed: sol.mixed, n: sol.steps && sol.steps.length }))
        );
      }
      add(
        remainingRequired(out.pack, out.geo.done).length === 0
          ? { ok: true, id: "complete:" + ex.n }
          : fail("complete:" + ex.n, JSON.stringify(out.geo.done))
      );
    }
  });

  var canon = walkExercise(engine, handler, "geo-slope-1", level.exercises[0]);
  var direct = walkDirectM(engine, handler);
  add(canon.ok ? { ok: true, id: "alt-canon-complete" } : canon);
  add(direct.ok ? { ok: true, id: "alt-direct-complete" } : direct);
  if (canon.ok && direct.ok) {
    add(
      canon.geo.done.m && direct.geo.done.m
        ? { ok: true, id: "alt-same-completion" }
        : fail("alt-same-completion", JSON.stringify({ canon: canon.geo.done, direct: direct.geo.done }))
    );
  }

  var recSkip = reconstruct(engine, packFor(engine, "geo-slope-1", 8), ["y = x + 4"], {});
  add(recSkip.done && recSkip.done.m && recSkip.done.eq ? { ok: true, id: "n8-skip-reconstruct" } : fail("n8-skip-reconstruct", JSON.stringify(recSkip.done)));

  function histHas(hist, re) {
    return hist.some(function (line) {
      return re.test(String(line).replace(/[−–—]/g, "-").replace(/\s+/g, ""));
    });
  }

  function walkN22StepOnly() {
    var ex = level.exercises.filter(function (x) {
      return x.n === 22;
    })[0];
    var pack = G.analyzeStart(ex);
    pack._levelId = "geo-slope-1";
    var geo = emptyGeo();
    var history = [];
    var i;
    for (i = 0; i < 80; i++) {
      if (!remainingRequired(pack, geo.done).length) {
        return { ok: true, history: history, geo: geo, pack: pack };
      }
      var h = G.nextHint(pack, geo);
      var kind = h && h.task && h.task.kind;
      if (kind && isMigratedKind(kind, pack)) {
        var one = handler.handle({
          topic: "analytic",
          capability: "slope",
          intent: "one-step",
          levelId: "geo-slope-1",
          n: 22,
          history: history,
          geo: geo,
        });
        if (!one || !one.ok || !one.step || one.local) {
          return fail("n22-onestep-stuck", JSON.stringify(one) + " after " + history.join(" | "));
        }
        applyRes(geo, one);
        history.push(one.step);
        continue;
      }
      var typed = h && (h.rawStep ? h.step : h.step);
      if (!typed) return fail("n22-no-step", (h && h.message) + " hist=" + history.join(" | "));
      var res = G.checkTyped(String(typed), pack, geo);
      if (!res || !res.ok) {
        return fail("n22-check-fail", "typed=" + typed + " msg=" + (res && res.message) + " hist=" + history.join(" | "));
      }
      applyRes(geo, res);
      history.push(String(typed));
    }
    return fail("n22-long", history.join(" | "));
  }

  var n22 = walkN22StepOnly();
  add(n22.ok ? { ok: true, id: "n22-onestep-complete" } : n22);
  if (n22.ok) {
    add(histHas(n22.history, /^y=0$/i) ? { ok: true, id: "n22-saw-y0" } : fail("n22-saw-y0", n22.history.join(" | ")));
    add(
      histHas(n22.history, /^0=-2x\+8$/) || histHas(n22.history, /^0=8-2x$/)
        ? { ok: true, id: "n22-saw-plug" }
        : fail("n22-saw-plug", n22.history.join(" | "))
    );
    add(histHas(n22.history, /B\(4;0\)/) ? { ok: true, id: "n22-saw-B" } : fail("n22-saw-B", n22.history.join(" | ")));
    add(n22.geo.done && n22.geo.done.B ? { ok: true, id: "n22-B-done" } : fail("n22-B-done", JSON.stringify(n22.geo.done)));
    add(n22.geo.done && n22.geo.done.mAB ? { ok: true, id: "n22-slope-done" } : fail("n22-slope-done", JSON.stringify(n22.geo.done)));
    add(n22.geo.done && n22.geo.done.eqAB ? { ok: true, id: "n22-eq-done" } : fail("n22-eq-done", JSON.stringify(n22.geo.done)));
  }

  var pack22 = packFor(engine, "geo-slope-1", 22);
  var geoMan = emptyGeo();
  var manOk = true;
  var manHist = [];
  [
    "x = 0",
    "y=5·0 + 12",
    "y=12",
    "A(0;12)",
    "y = 0",
    "0 = −2x + 8",
    "2x = 8",
    "x = 4",
    "B(4;0)",
  ].forEach(function (line) {
    if (!manOk) return;
    var r = G.checkTyped(line, pack22, geoMan);
    if (!r || !r.ok) {
      manOk = false;
      add(fail("n22-manual", "typed=" + line + " msg=" + (r && r.message) + " hist=" + manHist.join(" | ")));
      return;
    }
    applyRes(geoMan, r);
    manHist.push(line);
  });
  if (manOk) {
    add(geoMan.done && geoMan.done.B ? { ok: true, id: "n22-manual-B" } : fail("n22-manual-B", JSON.stringify(geoMan.done)));
    add(!(geoMan.done && geoMan.done.mAB) && !(geoMan.done && geoMan.done.eqAB) ? { ok: true, id: "n22-manual-not-skipped-eq" } : fail("n22-manual-not-skipped-eq", JSON.stringify(geoMan.done)));
  }
  var afterY0 = emptyGeo();
  ["x = 0", "A(0;12)", "y = 0"].forEach(function (line) {
    applyRes(afterY0, G.checkTyped(line, pack22, afterY0));
  });
  add(
    afterY0.coords && afterY0.coords.B && afterY0.coords.B.y && !afterY0.coords.B.x && !(afterY0.done && afterY0.done.B)
      ? { ok: true, id: "n22-y0-not-B-done" }
      : fail("n22-y0-not-B-done", JSON.stringify({ done: afterY0.done, coords: afterY0.coords }))
  );
  var plugB = G.checkTyped("0 = −2x + 8", pack22, afterY0);
  add(
    plugB && plugB.ok && plugB.task && plugB.task.id === "B" && !(plugB.done && plugB.done.B)
      ? { ok: true, id: "n22-plug-stays-on-B" }
      : fail("n22-plug-stays-on-B", JSON.stringify(plugB && { ok: plugB.ok, msg: plugB.message, task: plugB.task && plugB.task.id, done: plugB.done }))
  );

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoSlopePage/.test(src) ? { ok: true, id: "hybrid-slope-gate" } : fail("hybrid-slope-gate", "missing"));
  add(
    /\(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\) \|\| isGeoMidpointPage\(\)\) && kind === "slope"/.test(src) ||
      /\(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\)\) && kind === "slope"/.test(src) ||
      /\(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\)\) && kind === "slope"/.test(src) ||
      /kind === "slope" && \(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\) \|\| isGeoMidpointPage\(\)\)/.test(src) ||
      /kind === "slope" && \(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\)\)/.test(src) ||
      /kind === "slope" && \(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\)\)/.test(src)
      ? { ok: true, id: "hybrid-kind-gate" }
      : fail("hybrid-kind-gate", "kind not gated")
  );

  console.log("flow-geo-slope: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 50).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
