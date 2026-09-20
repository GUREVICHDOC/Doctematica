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
}

function remainingRequired(pack, done) {
  return (pack.tasks || []).filter(function (t) {
    return !t.optional && !(done && done[t.id]);
  });
}

function capFor(kind) {
  if (kind === "area") return "areas";
  if (kind === "segment" || kind === "origin" || kind === "axis" || kind === "distSeg") return "lengths";
  if (kind === "lineMatch") return "line-match";
  if (kind === "lineIntersect" || kind === "rearrange") return "line-intersect";
  if (kind === "point" || kind === "onLine" || kind === "freePoint" || kind === "noIntercept") return "points";
  return "points";
}

function walkExercise(engine, handler, levelId, ex) {
  var G = engine.DoctematicaGeometry;
  var pack = G.analyzeStart(ex);
  pack._levelId = levelId;
  var history = [];
  var geo = emptyGeo();
  var saw = [];
  var i;
  for (i = 0; i < 220; i++) {
    if (!remainingRequired(pack, geo.done).length) {
      return { ok: true, saw: saw, n: ex.n, history: history, geo: geo, pack: pack };
    }
    var h = G.nextHint(pack, geo);
    var kind = h && h.task && h.task.kind;
    saw.push((h && h.addHeight ? "addHeight:" : "") + (kind || "none"));
    if (
      G.lineMatchPartActive &&
      G.lineMatchPartActive(pack, geo)
    ) {
      kind = "lineMatch";
      saw[saw.length - 1] = "lineMatch";
    } else if (h && (h.addHeight || (h.message && String(h.message).indexOf("+ גובה") >= 0))) {
      if (G.siteAddHeight) G.siteAddHeight(pack, geo, h.task);
      if (h.addHeight && !h.step) continue;
    }
    if (h && h.footCalc && h.step && !(G.lineMatchPartActive && G.lineMatchPartActive(pack, geo))) {
      var footRes = G.checkTyped(String(h.step), pack, geo);
      if (!footRes || !footRes.ok) {
        return fail("walk-foot:" + levelId + ":" + ex.n, (footRes && footRes.message) + " typed=" + h.step);
      }
      applyRes(geo, footRes);
      if (footRes.footCoords) geo.footCoords = footRes.footCoords;
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
        var skipped = null;
        if (h.task && (h.task.kind === "lineIntersect" || h.task.kind === "point")) {
          var skipCands = [];
          if (h.answer) skipCands.push(h.answer);
          if (h.step) skipCands.push(h.step);
          if (h.task.answerX != null) skipCands.push("x = " + h.task.answerX);
          if (h.task.answerY != null) skipCands.push("y = " + h.task.answerY);
          if (h.task.answerX != null && h.task.answerY != null) {
            skipCands.push((h.task.label || h.task.point || "P") + "(" + h.task.answerX + ";" + h.task.answerY + ")");
          }
          var si;
          for (si = 0; si < skipCands.length; si++) {
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
    var typed = h.rawStep ? h.step : h.step || h.answer;
    var local = G.checkTyped(String(typed), pack, geo);
    if (!local || !local.ok) {
      return fail("walk-local:" + levelId + ":" + ex.n, (local && local.message) + " typed=" + typed + " kind=" + kind);
    }
    applyRes(geo, local);
  }
  return fail("walk-long:" + levelId + ":" + ex.n, saw.join(">"));
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
    return l.id === "geo-line-summary-1";
  })[0];
  add(level && level.exercises && level.exercises.length === 17 ? { ok: true, id: "count-17" } : fail("count-17", String(level && level.exercises && level.exercises.length)));

  (level.exercises || []).forEach(function (ex) {
    var out = walkExercise(engine, handler, "geo-line-summary-1", ex);
    add(out.ok ? { ok: true, id: "full:geo-line-summary-1:" + ex.n } : out);
    if (out.ok) {
      var hasLocal = (out.pack.tasks || []).some(function (t) {
        return !isMigratedKind(t.kind, out.pack);
      });
      var sol = via(handler, {
        capability: "points",
        intent: "solution",
        levelId: "geo-line-summary-1",
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

  var pack1 = packFor(engine, "geo-line-summary-1", 1);
  var kinds1 = {};
  (pack1.tasks || []).forEach(function (t) {
    kinds1[t.kind] = true;
  });
  add(kinds1.lineMatch && kinds1.point && kinds1.lineIntersect && kinds1.area ? { ok: true, id: "n1-kinds" } : fail("n1-kinds", JSON.stringify(kinds1)));

  var setupMatch = via(handler, { capability: "line-match", intent: "setup", levelId: "geo-line-summary-1", n: 1, history: [], geo: {} });
  add(setupMatch && setupMatch.server && setupMatch.capability === "line-match" ? { ok: true, id: "setup-match-n1" } : fail("setup-match-n1", JSON.stringify(setupMatch)));

  var wrongMatch = via(handler, {
    capability: "line-match",
    intent: "check",
    levelId: "geo-line-summary-1",
    n: 1,
    history: [],
    geo: {},
    action: { type: "lineMatch.line", taskId: "eq1", lineKey: "II" },
  });
  add(wrongMatch && !wrongMatch.ok ? { ok: true, id: "error-wrong-match" } : fail("error-wrong-match", JSON.stringify(wrongMatch)));

  var okLine = via(handler, {
    capability: "line-match",
    intent: "check",
    levelId: "geo-line-summary-1",
    n: 1,
    history: [],
    geo: {},
    action: { type: "lineMatch.line", taskId: "eq1", lineKey: "I" },
  });
  add(okLine && okLine.ok && !okLine.solved ? { ok: true, id: "match-line-not-exercise" } : fail("match-line-not-exercise", JSON.stringify(okLine)));

  var afterWrongStill = via(handler, {
    capability: "line-match",
    intent: "check",
    levelId: "geo-line-summary-1",
    n: 1,
    history: [],
    geo: {},
    action: { type: "lineMatch.line", taskId: "eq1", lineKey: "I" },
  });
  add(afterWrongStill && afterWrongStill.ok ? { ok: true, id: "error-does-not-poison" } : fail("error-does-not-poison", JSON.stringify(afterWrongStill)));

  var matchHist = ["lineMatch:line:eq1:I", "lineMatch:reason:eq1:m_pos", "lineMatch:line:eq2:II", "lineMatch:reason:eq2:m_neg"];
  var afterMatch = via(handler, {
    capability: "points",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 1,
    history: matchHist,
    geo: {},
  });
  add(
    afterMatch && afterMatch.ok && !afterMatch.local && afterMatch.task && afterMatch.task.kind === "point" && !afterMatch.solved
      ? { ok: true, id: "transition-match-to-point" }
      : fail("transition-match-to-point", JSON.stringify(afterMatch))
  );
  var hintAfterMatch = via(handler, {
    capability: "points",
    intent: "hint",
    levelId: "geo-line-summary-1",
    n: 1,
    history: matchHist,
    geo: {},
  });
  add(hintAfterMatch && hintAfterMatch.ok && !hintAfterMatch.local ? { ok: true, id: "hint-after-match-to-point" } : fail("hint-after-match-to-point", JSON.stringify(hintAfterMatch)));
  var firstCheckPoint = via(handler, {
    capability: "points",
    intent: "check",
    levelId: "geo-line-summary-1",
    n: 1,
    history: matchHist,
    geo: {},
    typed: "A(0;10)",
  });
  add(
    firstCheckPoint && firstCheckPoint.ok && !firstCheckPoint.solved && firstCheckPoint.task && firstCheckPoint.task.id === "A"
      ? { ok: true, id: "first-check-after-match" }
      : fail("first-check-after-match", JSON.stringify(firstCheckPoint && { ok: firstCheckPoint.ok, id: firstCheckPoint.task && firstCheckPoint.task.id, solved: firstCheckPoint.solved }))
  );

  var fakeMatch = via(handler, {
    capability: "points",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 1,
    history: [],
    geo: { done: { eq1: true, eq2: true } },
  });
  add(
    fakeMatch && fakeMatch.matchAction
      ? { ok: true, id: "no-trust-client-match-done" }
      : fail("no-trust-client-match-done", JSON.stringify(fakeMatch && { local: fakeMatch.local, task: fakeMatch.task, matchAction: fakeMatch.matchAction }))
  );

  var progressPts = reconstruct(engine, pack1, matchHist.concat(["A(0;10)", "B(10;0)", "C(2;0)", "D(0;−6)"]), {});
  add(progressPts.done && progressPts.done.A && progressPts.done.D && !progressPts.done.P ? { ok: true, id: "recon-points-after-match" } : fail("recon-points-after-match", JSON.stringify(progressPts.done)));

  var afterPts = via(handler, {
    capability: "line-intersect",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 1,
    history: matchHist.concat(["A(0;10)", "B(10;0)", "C(2;0)", "D(0;−6)"]),
    geo: {},
  });
  add(
    afterPts && afterPts.ok && !afterPts.local && (afterPts.task && afterPts.task.kind === "lineIntersect" || afterPts.step)
      ? { ok: true, id: "transition-point-to-intersect" }
      : fail("transition-point-to-intersect", JSON.stringify(afterPts))
  );

  var n16 = packFor(engine, "geo-line-summary-1", 16);
  add(n16 && n16.tasks.some(function (t) { return t.kind === "origin"; }) && n16.tasks.some(function (t) { return t.kind === "point"; }) ? { ok: true, id: "n16-origin-then-point" } : fail("n16-origin-then-point", "unexpected"));

  var n2setup = via(handler, { capability: "points", intent: "setup", levelId: "geo-line-summary-1", n: 2, history: [], geo: {} });
  add(n2setup && n2setup.server && n2setup.capability === "points" ? { ok: true, id: "n2-starts-point" } : fail("n2-starts-point", JSON.stringify(n2setup)));

  var afterP = via(handler, {
    capability: "lengths",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 1,
    history: matchHist.concat(["A(0;10)", "B(10;0)", "C(2;0)", "D(0;−6)", "P(4;6)"]),
    geo: {},
  });
  add(
    afterP && afterP.ok && !afterP.local && afterP.task && (afterP.task.kind === "segment" || afterP.task.kind === "area") && !afterP.solved
      ? { ok: true, id: "transition-intersect-to-length" }
      : fail("transition-intersect-to-length", JSON.stringify(afterP && { ok: afterP.ok, local: afterP.local, kind: afterP.task && afterP.task.kind, solved: afterP.solved }))
  );
  var hintAfterP = via(handler, {
    capability: "lengths",
    intent: "hint",
    levelId: "geo-line-summary-1",
    n: 1,
    history: matchHist.concat(["A(0;10)", "B(10;0)", "C(2;0)", "D(0;−6)", "P(4;6)"]),
    geo: {},
  });
  add(hintAfterP && hintAfterP.ok && !hintAfterP.local ? { ok: true, id: "hint-after-intersect-to-length" } : fail("hint-after-intersect-to-length", JSON.stringify(hintAfterP)));

  var n9hist = ["lineMatch:line:eq3:none", "lineMatch:reason:eq3:none", "lineMatch:line:eq1:I", "lineMatch:reason:eq1:m_neg", "lineMatch:line:eq2:II", "lineMatch:reason:eq2:m_pos"];
  var n9afterMatch = via(handler, {
    capability: "points",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 9,
    history: n9hist,
    geo: {},
  });
  add(
    n9afterMatch && n9afterMatch.ok && !n9afterMatch.local && n9afterMatch.task && n9afterMatch.task.kind === "point"
      ? { ok: true, id: "transition-match-none-to-point" }
      : fail("transition-match-none-to-point", JSON.stringify(n9afterMatch && { ok: n9afterMatch.ok, kind: n9afterMatch.task && n9afterMatch.task.kind, step: n9afterMatch.step }))
  );

  var n11setup = via(handler, { capability: "points", intent: "setup", levelId: "geo-line-summary-1", n: 11, history: [], geo: {} });
  add(n11setup && n11setup.server && n11setup.capability === "points" ? { ok: true, id: "n11-starts-point" } : fail("n11-starts-point", JSON.stringify(n11setup)));
  var n11afterP = via(handler, {
    capability: "lengths",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 11,
    history: ["P(4;8)"],
    geo: {},
  });
  add(
    n11afterP && n11afterP.ok && !n11afterP.local && n11afterP.task && (n11afterP.task.kind === "origin" || n11afterP.task.kind === "segment" || n11afterP.task.kind === "area") && !n11afterP.solved
      ? { ok: true, id: "transition-point-to-length" }
      : fail("transition-point-to-length", JSON.stringify(n11afterP && { ok: n11afterP.ok, kind: n11afterP.task && n11afterP.task.kind, solved: n11afterP.solved }))
  );
  var hintPtToLen = via(handler, {
    capability: "areas",
    intent: "hint",
    levelId: "geo-line-summary-1",
    n: 11,
    history: ["P(4;8)"],
    geo: {},
  });
  add(hintPtToLen && hintPtToLen.ok && !hintPtToLen.local ? { ok: true, id: "hint-after-point-to-length" } : fail("hint-after-point-to-length", JSON.stringify(hintPtToLen)));

  var n16setup = via(handler, { capability: "lengths", intent: "setup", levelId: "geo-line-summary-1", n: 16, history: [], geo: {} });
  add(n16setup && n16setup.server && n16setup.capability === "lengths" ? { ok: true, id: "n16-starts-length" } : fail("n16-starts-length", JSON.stringify(n16setup)));
  var n16afterOA = via(handler, {
    capability: "lengths",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 16,
    history: ["OA = 4"],
    geo: {},
  });
  add(
    n16afterOA && n16afterOA.ok && !n16afterOA.local && n16afterOA.task && n16afterOA.task.kind === "origin" && !n16afterOA.solved
      ? { ok: true, id: "n16-oa-to-ob" }
      : fail("n16-oa-to-ob", JSON.stringify(n16afterOA && { ok: n16afterOA.ok, kind: n16afterOA.task && n16afterOA.task.kind, solved: n16afterOA.solved }))
  );
  var n16toPoint = via(handler, {
    capability: "points",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 16,
    history: ["OA = 4", "OB = 5"],
    geo: {},
  });
  add(
    n16toPoint && n16toPoint.ok && !n16toPoint.local && n16toPoint.task && n16toPoint.task.kind === "point" && !n16toPoint.solved
      ? { ok: true, id: "transition-length-to-point" }
      : fail("transition-length-to-point", JSON.stringify(n16toPoint && { ok: n16toPoint.ok, kind: n16toPoint.task && n16toPoint.task.kind, solved: n16toPoint.solved }))
  );
  var hintLenToPt = via(handler, {
    capability: "points",
    intent: "hint",
    levelId: "geo-line-summary-1",
    n: 16,
    history: ["OA = 4", "OB = 5"],
    geo: {},
  });
  add(hintLenToPt && hintLenToPt.ok && !hintLenToPt.local ? { ok: true, id: "hint-after-length-to-point" } : fail("hint-after-length-to-point", JSON.stringify(hintLenToPt)));

  var n17setup = via(handler, { capability: "lengths", intent: "setup", levelId: "geo-line-summary-1", n: 17, history: [], geo: {} });
  add(n17setup && n17setup.server && n17setup.capability === "lengths" ? { ok: true, id: "n17-starts-length" } : fail("n17-starts-length", JSON.stringify(n17setup)));
  var n17toPts = via(handler, {
    capability: "points",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 17,
    history: ["AB = 10"],
    geo: {},
  });
  add(
    n17toPts && n17toPts.ok && !n17toPts.local && n17toPts.task && n17toPts.task.kind === "point"
      ? { ok: true, id: "transition-segment-to-point" }
      : fail("transition-segment-to-point", JSON.stringify(n17toPts && { ok: n17toPts.ok, kind: n17toPts.task && n17toPts.task.kind }))
  );

  var wrongPt = via(handler, {
    capability: "points",
    intent: "check",
    levelId: "geo-line-summary-1",
    n: 1,
    history: matchHist,
    geo: {},
    typed: "A(1;1)",
  });
  add(wrongPt && !wrongPt.ok ? { ok: true, id: "error-wrong-point" } : fail("error-wrong-point", JSON.stringify(wrongPt)));
  var afterWrongPt = via(handler, {
    capability: "points",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 1,
    history: matchHist,
    geo: {},
  });
  add(
    afterWrongPt && afterWrongPt.ok && afterWrongPt.task && afterWrongPt.task.kind === "point" && afterWrongPt.task.id === "A"
      ? { ok: true, id: "error-point-keeps-match" }
      : fail("error-point-keeps-match", JSON.stringify(afterWrongPt && { kind: afterWrongPt.task && afterWrongPt.task.kind, id: afterWrongPt.task && afterWrongPt.task.id }))
  );

  var wrongLen = via(handler, {
    capability: "lengths",
    intent: "check",
    levelId: "geo-line-summary-1",
    n: 1,
    history: matchHist.concat(["A(0;10)", "B(10;0)", "C(2;0)", "D(0;−6)", "P(4;6)"]),
    geo: {},
    typed: "CB = 3",
  });
  add(wrongLen && !wrongLen.ok ? { ok: true, id: "error-wrong-length" } : fail("error-wrong-length", JSON.stringify(wrongLen)));
  var afterWrongLen = via(handler, {
    capability: "lengths",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 1,
    history: matchHist.concat(["A(0;10)", "B(10;0)", "C(2;0)", "D(0;−6)", "P(4;6)"]),
    geo: {},
  });
  add(
    afterWrongLen && afterWrongLen.ok && afterWrongLen.task && (afterWrongLen.task.kind === "segment" || afterWrongLen.task.kind === "area")
      ? { ok: true, id: "error-length-keeps-prior" }
      : fail("error-length-keeps-prior", JSON.stringify(afterWrongLen && { kind: afterWrongLen.task && afterWrongLen.task.kind }))
  );

  var wrongIntersect = via(handler, {
    capability: "line-intersect",
    intent: "check",
    levelId: "geo-line-summary-1",
    n: 1,
    history: matchHist.concat(["A(0;10)", "B(10;0)", "C(2;0)", "D(0;−6)"]),
    geo: {},
    typed: "P(0;0)",
  });
  add(wrongIntersect && !wrongIntersect.ok ? { ok: true, id: "error-wrong-intersect" } : fail("error-wrong-intersect", JSON.stringify(wrongIntersect)));

  var n16wrong = via(handler, {
    capability: "points",
    intent: "check",
    levelId: "geo-line-summary-1",
    n: 16,
    history: ["OA = 4", "OB = 5"],
    geo: {},
    typed: "B(0;0)",
  });
  add(n16wrong && !n16wrong.ok ? { ok: true, id: "error-wrong-point-after-length" } : fail("error-wrong-point-after-length", JSON.stringify(n16wrong)));
  var n16still = via(handler, {
    capability: "points",
    intent: "one-step",
    levelId: "geo-line-summary-1",
    n: 16,
    history: ["OA = 4", "OB = 5"],
    geo: {},
  });
  add(n16still && n16still.ok && n16still.task && n16still.task.kind === "point" ? { ok: true, id: "error-then-continue-n16" } : fail("error-then-continue-n16", JSON.stringify(n16still)));

  function assertTwinYThenPlug(n, yTyped, pointId) {
    var chk = via(handler, {
      capability: "points",
      intent: "check",
      levelId: "geo-line-summary-1",
      n: n,
      history: [],
      geo: {},
      typed: yTyped,
    });
    var c = (chk && chk.coords && chk.coords[pointId]) || {};
    add(
      chk && chk.ok && c.y && !c.x && /הציבו/.test(String(chk.message || ""))
        ? { ok: true, id: "twin-y-keeps-x-hidden:" + n }
        : fail("twin-y-keeps-x-hidden:" + n, JSON.stringify(chk && { ok: chk.ok, msg: chk.message, coords: chk.coords }))
    );
    var packN = packFor(engine, "geo-line-summary-1", n);
    var scene = G.sceneForProgress(packN, reconstruct(engine, packN, [yTyped], {}));
    var pt = (scene.points || []).filter(function (p) {
      return String(p.label) === pointId;
    })[0];
    add(
      pt && pt.hideX && !pt.hideY
        ? { ok: true, id: "twin-y-graph-hides-x:" + n }
        : fail("twin-y-graph-hides-x:" + n, JSON.stringify(pt))
    );
    var hintY = via(handler, {
      capability: "points",
      intent: "hint",
      levelId: "geo-line-summary-1",
      n: n,
      history: [yTyped],
      geo: {},
    });
    add(
      hintY && hintY.ok && hintY.step && !/^\s*[A-Z]\(/.test(String(hintY.step)) && /הציבו|פתרו/.test(String(hintY.message || ""))
        ? { ok: true, id: "twin-y-hint-plugs:" + n }
        : fail("twin-y-hint-plugs:" + n, JSON.stringify(hintY && { msg: hintY.message, step: hintY.step }))
    );
    var oneY = via(handler, {
      capability: "points",
      intent: "one-step",
      levelId: "geo-line-summary-1",
      n: n,
      history: [yTyped],
      geo: {},
    });
    add(
      oneY && oneY.ok && oneY.step && !/^\s*[A-Z]\(/.test(String(oneY.step)) && !(oneY.coords && oneY.coords[pointId] && oneY.coords[pointId].x && oneY.done && oneY.done[pointId])
        ? { ok: true, id: "twin-y-one-step-plugs:" + n }
        : fail("twin-y-one-step-plugs:" + n, JSON.stringify(oneY && { step: oneY.step, coords: oneY.coords, done: oneY.done, msg: oneY.message }))
    );
  }
  assertTwinYThenPlug(12, "y = 3", "A");
  assertTwinYThenPlug(13, "y = 3", "B");
  assertTwinYThenPlug(14, "y = 5", "B");

  var n11x = via(handler, {
    capability: "points",
    intent: "check",
    levelId: "geo-line-summary-1",
    n: 11,
    history: [],
    geo: {},
    typed: "x = 4",
  });
  var n11c = (n11x && n11x.coords && n11x.coords.Px) || (n11x && n11x.coords && n11x.coords.P) || {};
  add(
    n11x && n11x.ok && n11c.x && !n11c.y
      ? { ok: true, id: "twin-x-keeps-y-hidden" }
      : fail("twin-x-keeps-y-hidden", JSON.stringify(n11x && { ok: n11x.ok, coords: n11x.coords, msg: n11x.message }))
  );
  var n11hint = via(handler, {
    capability: "points",
    intent: "hint",
    levelId: "geo-line-summary-1",
    n: 11,
    history: ["x = 4"],
    geo: {},
  });
  add(
    n11hint && n11hint.step && !/^\s*P\(/.test(String(n11hint.step))
      ? { ok: true, id: "twin-x-hint-plugs-y" }
      : fail("twin-x-hint-plugs-y", JSON.stringify(n11hint && { msg: n11hint.message, step: n11hint.step }))
  );

  var skipInterceptY = via(handler, {
    capability: "points",
    intent: "check",
    levelId: "geo-line-axis-1",
    n: 1,
    history: ["x = 0"],
    geo: {},
    typed: "y = 6",
  });
  var skipC = (skipInterceptY && skipInterceptY.coords && skipInterceptY.coords.A) || {};
  add(
    skipInterceptY && skipInterceptY.ok && skipC.x && skipC.y
      ? { ok: true, id: "intercept-skip-y-still-both" }
      : fail("intercept-skip-y-still-both", JSON.stringify(skipInterceptY && { ok: skipInterceptY.ok, coords: skipInterceptY.coords, msg: skipInterceptY.message }))
  );

  var gateEq = via(handler, { capability: "line-match", intent: "one-step", levelId: "geo-perp-1", n: 1, history: [], geo: {} });
  add(gateEq && gateEq.ok && !gateEq.local ? { ok: true, id: "perp-now-server" } : fail("perp-now-server", JSON.stringify(gateEq)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoSummaryPage/.test(src) && /geo-line-summary-1/.test(src) ? { ok: true, id: "client-summary-gate" } : fail("client-summary-gate", "missing"));
  add(
    /isGeoLineMatchPage\(\) \|\| isGeoSummaryPage\(\)/.test(src) && /!isGeoLineMatchPage\(\) &&\s*\n\s*!isGeoSummaryPage\(\)/.test(src)
      ? { ok: true, id: "client-match-clicks-and-no-auto" }
      : fail("client-match-clicks-and-no-auto", "match panel / auto-complete gate missing")
  );
  add(/showBasicEqServerUnavailable/.test(src) && /requestGeometryAction/.test(src) ? { ok: true, id: "client-node-off-no-fallback" } : fail("client-node-off-no-fallback", "missing"));

  console.log("flow-geo-line-summary: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 50).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
