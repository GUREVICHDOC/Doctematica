"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createFunctionsHandler = require("./functions").createFunctionsHandler;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function partLabel(view) {
  return (view && view.part && view.part.label) || "";
}

function fieldIds(view) {
  return ((view && view.domains) || []).map(function (field) { return field.id; }).join(",");
}

function colText(step) {
  return ((step && step.parallel) || []).map(function (col) {
    return (col.label || "") + ":" + (col.steps || []).join(" ");
  }).join(" | ");
}

function main() {
  var engine = loadEngine();
  var handler = createFunctionsHandler(engine);
  var checks = [];
  function add(result) { checks.push(result); }

  var appSrc = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  var leaveAt = appSrc.indexOf("function leaveBoards");
  var leaveBody = leaveAt >= 0 ? appSrc.slice(leaveAt, leaveAt + 280) : "";
  add(leaveBody.indexOf("viewEpoch += 1") >= 0 && leaveBody.indexOf("hideFnBoardUi()") >= 0 && leaveBody.indexOf("coordBoard.clear()") >= 0
    ? { ok: true, id: "navigation-retires-boards" }
    : fail("navigation-retires-boards", leaveBody.slice(0, 180)));
  add(appSrc.indexOf("if (token !== viewEpoch) return;") >= 0 && appSrc.indexOf("if (token !== viewEpoch || state.levelId !== levelId || state.exerciseIndex !== index) return;") >= 0
    ? { ok: true, id: "stale-response-ignored" }
    : fail("stale-response-ignored"));
  var domainsAt = appSrc.indexOf("function renderFnDomains");
  var readAt = appSrc.indexOf("function readFnDomains");
  var domainsBody = domainsAt >= 0 && readAt > domainsAt ? appSrc.slice(domainsAt, readAt) : "";
  var partReset = domainsBody.indexOf('getAttribute("data-part")');
  var sigKeep = domainsBody.indexOf('getAttribute("data-sig") === sig');
  add(partReset >= 0 && sigKeep > partReset && domainsBody.indexOf("innerHTML = \"\"", partReset) > partReset && domainsBody.indexOf("innerHTML = \"\"", partReset) < sigKeep
    ? { ok: true, id: "domain-part-resets-before-signature" }
    : fail("domain-part-resets-before-signature", "a new part must clear domain fields before the old signature can keep them"));

  var parallelAt = appSrc.indexOf("if (remote.parallel && remote.parallel.parallel");
  var showAt = appSrc.indexOf("} else if (remote.show");
  var parallelBody = parallelAt >= 0 && showAt > parallelAt ? appSrc.slice(parallelAt, showAt) : "";
  add(parallelBody.indexOf("archivePendingSketchCard()") >= 0
    ? { ok: true, id: "parallel-keeps-sketch" }
    : fail("parallel-keeps-sketch", "a parallel arrival must archive the sketch the same way a line does"));

  var solvedSketchAt = appSrc.indexOf("wasSketch && remote.solved && partBefore && remote.view && remote.view.parts");
  var solvedSketchBody = solvedSketchAt >= 0 ? appSrc.slice(solvedSketchAt, solvedSketchAt + 900) : "";
  var keepInkAt = solvedSketchBody.indexOf("!snapshotInk && solvedInk");
  add(keepInkAt >= 0 && solvedSketchBody.indexOf("remote.board", keepInkAt) > keepInkAt
    ? { ok: true, id: "last-sketch-keeps-ink" }
    : fail("last-sketch-keeps-ink", "the last sketch of a multi-part exercise must keep the curve that was just drawn"));

  var axisAt = appSrc.indexOf('if (remote.axis === "y" || remote.axis === "x")');
  var boardAt = appSrc.indexOf("if (remote.board)", axisAt);
  var axisBody = axisAt >= 0 && boardAt > axisAt ? appSrc.slice(axisAt, boardAt) : "";
  add(axisBody.indexOf("syncFnViewPart") >= 0 && axisBody.indexOf("§") >= 0 && axisBody.indexOf("freezeAxisCard") >= 0 && axisBody.lastIndexOf("return;") > axisBody.indexOf("§")
    ? { ok: true, id: "axis-marks-next-part" }
    : fail("axis-marks-next-part", "leaving the axes must sync the part and write the next section before returning"));

  var stashAt = appSrc.indexOf("function stashFnFormulaTrail");
  var stashBody = stashAt >= 0 ? appSrc.slice(stashAt, stashAt + 900) : "";
  var axisKeep = stashBody.indexOf("formulaAxisOwned");
  var globalKeep = stashBody.indexOf("⌘formula");
  add(axisKeep >= 0 && globalKeep > axisKeep && stashBody.indexOf("axisLive") > axisKeep && stashBody.indexOf("axisLive") < globalKeep
    ? { ok: true, id: "formula-stays-in-axis-column" }
    : fail("formula-stays-in-axis-column", "quadratic-formula steps on an axis belong in that column"));

  var sameFields = [];
  var walks = [];
  (engine.DoctematicaCurriculum.levels || []).forEach(function (level) {
    if (level.mode !== "fn" && level.mode !== "param") return;
    (level.exercises || []).forEach(function (ex) {
      if (ex.poly || ex.signGraph || ex.monoGraph || ex.freeSketch || ex.levelProbe) return;
      if (!(ex.tasks && ex.tasks.length)) return;
      walks.push({ levelId: level.id, id: ex.id });
    });
  });

  walks.forEach(function (item) {
    var progress = null;
    var prevPart = "";
    var prevInput = "";
    var prevIds = "";
    var guard;
    for (guard = 0; guard < 80; guard++) {
      var res = handler.handle({
        intent: "one-step",
        levelId: item.levelId,
        exerciseId: item.id,
        progress: progress,
      });
      if (!res || res.ok === false || res.enter === "formula") {
        if (!(res && res.enter === "formula")) add(fail(item.id + "-walk", (res && res.message) || "one-step failed"));
        return;
      }
      var part = partLabel(res.view);
      var input = (res.view && res.view.input) || "";
      var ids = fieldIds(res.view);
      if (prevPart && part && prevPart !== part) {
        if (res.parallel && res.parallel.parallel) {
          var labels = res.parallel.parallel.map(function (col) { return col.label || ""; }).join(" ");
          var filled = res.parallel.parallel.every(function (col) { return col.steps && col.steps.length; });
          add(filled && res.parallel.parallel.length >= 2
            ? { ok: true, id: item.id + "-parallel-" + prevPart }
            : fail(item.id + "-parallel-" + prevPart, colText(res.parallel)));
          add(/חיובי|שלילי|עלייה|ירידה|x₁|x₂/.test(labels)
            ? { ok: true, id: item.id + "-parallel-kind-" + prevPart }
            : fail(item.id + "-parallel-kind-" + prevPart, labels));
        }
        if (prevInput === "axes") {
          add(res.axis === "y" || res.axis === "x"
            ? { ok: true, id: item.id + "-axis-leave" }
            : fail(item.id + "-axis-leave", String(res.axis)));
          var done = res.axisDone || {};
          add(done.y && done.x
            ? { ok: true, id: item.id + "-both-axes" }
            : fail(item.id + "-both-axes", JSON.stringify(done)));
        }
        if (prevInput === "domains" && input === "domains" && prevIds && prevIds === ids) {
          sameFields.push(item.id + " " + prevPart + "→" + part + " " + ids);
          var carried = handler.handle({
            intent: "check",
            levelId: item.levelId,
            exerciseId: item.id,
            progress: res.progress,
            domains: domainPayload(ids, res.show),
          });
          add(carried && carried.ok === false
            ? { ok: true, id: item.id + "-stale-rejected-" + part }
            : fail(item.id + "-stale-rejected-" + part, carried && (carried.message || carried.show || "accepted")));
        }
        if (input === "sketch") {
          var step = handler.handle({
            intent: "one-step",
            levelId: item.levelId,
            exerciseId: item.id,
            progress: res.progress,
          });
          add(step && step.ok && partLabel(step.view) === part && !(step.message && step.message.indexOf("חזרו אליו") >= 0)
            ? { ok: true, id: item.id + "-sketch-continues" }
            : fail(item.id + "-sketch-continues", step && (step.message || partLabel(step.view))));
        }
      }
      progress = res.progress;
      prevPart = part;
      prevInput = input;
      prevIds = ids;
      if (res.solved) break;
    }
  });

  add(sameFields.indexOf("calc-quad-1-ex-a011 ה→ו both") >= 0 && sameFields.indexOf("calc-quad-1-ex-a012 ד→ה both") >= 0
    ? { ok: true, id: "same-field-cases" }
    : fail("same-field-cases", sameFields.join("; ")));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-fn-transition: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) {
    console.log("FAIL", item.id, item.detail);
  });
  if (failed.length) process.exit(1);
}

function domainPayload(ids, show) {
  var fields = {};
  String(ids || "").split(",").forEach(function (id) {
    if (!id) return;
    var piece = intervalFromShow(show, id);
    if (piece) fields[id] = piece;
  });
  return fields;
}

function intervalFromShow(show, id) {
  var text = String(show || "");
  var name = id === "pos" ? "חיובי" : id === "neg" ? "שלילי" : id === "inc" ? "עולה" : id === "dec" ? "יורדת" : "";
  if (!name) {
    var bare = text.split(",")[0].replace(/^[^:]+:\s*/, "").trim();
    return bare;
  }
  var match = text.match(new RegExp(name + ":\\s*([^,]+)"));
  return match ? match[1].trim() : "";
}

main();
