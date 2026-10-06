"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createFunctionsHandler = require("./functions").createFunctionsHandler;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function stepBlob(step) {
  if (step && step.parallel) {
    return step.parallel.map(function (col) {
      return (col.label ? col.label + " " : "") + (col.steps || []).map(stepBlob).join(" ");
    }).join(" ");
  }
  if (step && step.eq != null) return String(step.eq);
  return String(step || "");
}

function partLabel(view) {
  return (view && view.part && view.part.label) || "";
}

function main() {
  var engine = loadEngine();
  var Fn = engine.DoctematicaFn;
  var handler = createFunctionsHandler(engine);
  var checks = [];
  function add(result) {
    checks.push(result);
  }

  var appSrc = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  var axisAt = appSrc.indexOf('if (remote.axis === "y" || remote.axis === "x")');
  var boardAt = appSrc.indexOf("if (remote.board)", axisAt);
  var axisBody = axisAt >= 0 && boardAt > axisAt ? appSrc.slice(axisAt, boardAt) : "";
  var syncAt = axisBody.indexOf("syncFnViewPart");
  var returnAt = axisBody.indexOf("return;");
  add(syncAt >= 0 && returnAt > syncAt
    ? { ok: true, id: "axis-syncs-before-return" }
    : fail("axis-syncs-before-return", "axis arrival must set viewPart to the server part before it returns"));

  var targets = [];
  (engine.DoctematicaCurriculum.levels || []).forEach(function (level) {
    (level.exercises || []).forEach(function (ex) {
      var tasks = ex.tasks || [];
      var sketchAt = -1;
      tasks.forEach(function (task, index) {
        if (task.kind === "fnSketch" && sketchAt < 0) sketchAt = index;
      });
      if (sketchAt > 0) targets.push({ levelId: level.id, ex: ex, sketchAt: sketchAt });
    });
  });
  add(targets.length >= 6
    ? { ok: true, id: "targets" }
    : fail("targets", String(targets.length)));

  targets.forEach(function (target) {
    var id = target.ex.id;
    var pack = Fn.prepare(target.ex);
    var progress = Fn.freshProgress();
    var viewPart = "";
    var entered = null;
    var guard = 0;
    while (guard < 80 && !entered) {
      guard += 1;
      var beforePart = partLabel(Fn.viewFor(pack, progress));
      var out = handler.handle({
        intent: "one-step",
        levelId: target.levelId,
        exerciseId: id,
        progress: progress,
      });
      if (!out || !out.ok) {
        add(fail(id + "-walk", (out && out.message) || "one-step failed before the sketch"));
        return;
      }
      var server = partLabel(out.view);
      var changed = !!(beforePart && server && beforePart !== server);
      if (changed && out.axis) {
        Fn.syncViewPart({ viewPart: viewPart }, server);
        viewPart = server;
      } else if (changed) {
        viewPart = server;
      }
      if (viewPart && server && viewPart !== server) {
        add(fail(id + "-active", "viewPart " + viewPart + " server " + server));
        return;
      }
      if (changed && out.view && out.view.input === "sketch") {
        var stale = beforePart;
        entered = {
          via: out.axis ? "axis" : "other",
          part: server,
          progress: out.progress,
          hint: out.hint || "",
          wouldBlock: !!(stale && server && stale !== server),
        };
      }
      progress = out.progress;
    }
    if (!entered) {
      add(fail(id + "-enter", "never reached the sketch part"));
      return;
    }
    add(entered.wouldBlock
      ? { ok: true, id: id + "-would-block" }
      : fail(id + "-would-block", "expected a real part change into the sketch"));
    add(viewPart === entered.part
      ? { ok: true, id: id + "-active-part" }
      : fail(id + "-active-part", viewPart + " vs " + entered.part));

    var prior = target.ex.tasks.slice(0, target.sketchAt);
    var kept = prior.every(function (task) {
      return entered.progress && entered.progress.done && entered.progress.done[task.id];
    });
    add(kept
      ? { ok: true, id: id + "-prior" }
      : fail(id + "-prior", JSON.stringify(entered.progress && entered.progress.done)));

    var hint = Fn.hintFor(Fn.prepare(target.ex), entered.progress);
    add(hint && hint.indexOf("חזרו אליו") < 0 && /סמנו|שרטטו/.test(hint)
      ? { ok: true, id: id + "-hint" }
      : fail(id + "-hint", hint));

    var step = handler.handle({
      intent: "one-step",
      levelId: target.levelId,
      exerciseId: id,
      progress: entered.progress,
    });
    add(step && step.ok && partLabel(step.view) === entered.part && step.view && step.view.focusKind === "fnSketch"
      ? { ok: true, id: id + "-step" }
      : fail(id + "-step", step && (step.message || partLabel(step.view) + " " + (step.show || ""))));
    if (!step || !step.ok) return;
    var sketchTask = target.ex.tasks[target.sketchAt];
    var step2 = handler.handle({
      intent: "one-step",
      levelId: target.levelId,
      exerciseId: id,
      progress: step.progress,
    });
    var stayed = step2 && step2.ok && partLabel(step2.view) === entered.part;
    var finishedSketch = step2 && step2.ok && step2.progress && step2.progress.done && step2.progress.done[sketchTask.id];
    add(step2 && step2.ok && step2.show !== step.show && (stayed || finishedSketch)
      ? { ok: true, id: id + "-step2" }
      : fail(id + "-step2", step2 && (partLabel(step2.view) + " " + (step2.show || step2.message || ""))));
    var priorStill = prior.every(function (task) {
      return step.progress && step.progress.done && step.progress.done[task.id];
    });
    add(priorStill
      ? { ok: true, id: id + "-prior-kept" }
      : fail(id + "-prior-kept", JSON.stringify(step.progress && step.progress.done)));

    if (id === "calc-quad-1-ex-a007") {
      add(entered.via === "axis" && /הקודקוד/.test(hint)
        ? { ok: true, id: "a007-vertex-hint" }
        : fail("a007-vertex-hint", entered.via + " " + hint));
      add(step.show === "(1,−4)" && step.board && step.board.points && step.board.points.length === 1
        ? { ok: true, id: "a007-mark-vertex" }
        : fail("a007-mark-vertex", step.show));
      add(stayed && step2.show && step2.show !== "(1,−4)"
        ? { ok: true, id: "a007-next-mark" }
        : fail("a007-next-mark", step2 && step2.show));
      var sol = handler.handle({ intent: "solution", levelId: target.levelId, exerciseId: id });
      var blob = (sol.steps || []).map(stepBlob).join("\n");
      add(sol.ok && blob.indexOf("(1,−4)") >= 0 && blob.indexOf("(0,−3)") >= 0 && blob.indexOf("(−1,0)") >= 0 && blob.indexOf("שרטוט הגרף") >= 0
        ? { ok: true, id: "a007-solution" }
        : fail("a007-solution", blob));
    }
  });

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-sketch-carry: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) {
    console.log("FAIL", item.id, item.detail);
  });
  if (failed.length) process.exit(1);
}

main();
