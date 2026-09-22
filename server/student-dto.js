"use strict";

var freqTable = require("./freq-table");
var percent = require("./percent");

var DROP_KEYS = {
  steps: true,
  solutionSteps: true,
  solutionNotes: true,
  answer: true,
  answerX: true,
  answerY: true,
  answerKey: true,
  answers: true,
  exact: true,
  canonical: true,
  _fromPt: true,
  _toPt: true,
  reason: true,
};

function dropSecrets(value, depth) {
  if (depth > 8 || value == null) return value;
  if (Array.isArray(value)) {
    return value.map(function (item) {
      return dropSecrets(item, depth + 1);
    });
  }
  if (typeof value !== "object") return value;
  var out = {};
  Object.keys(value).forEach(function (key) {
    if (DROP_KEYS[key]) return;
    if (key === "on" && (value.kind === "onLine" || value.kind === "yesNo" || value.kind === "freePoint")) return;
    out[key] = dropSecrets(value[key], depth + 1);
  });
  return out;
}

function catalog(engine) {
  var problems = engine.DoctematicaProblems || {};
  var levels = ((engine.DoctematicaCurriculum && engine.DoctematicaCurriculum.levels) || []).map(function (level) {
    return {
      id: level.id,
      topic: level.topic || "equations",
      subtopic: level.subtopic || (level.topic === "analytic" ? "segments" : "basic"),
      mode: level.mode || null,
      title: level.title,
      instruction: level.instruction || "",
      exercises: (level.exercises || []).map(function (ex, index) {
        return { n: ex.n, exerciseId: ex.id || null, displayNumber: index + 1 };
      }),
    };
  });
  return {
    topics: problems.topics || [],
    subtopics: problems.subtopics || {},
    levels: levels,
  };
}

function slimProblem(problem) {
  if (!problem) return null;
  var out = {
    mode: problem.mode,
    source: problem.source,
    levelId: problem.levelId,
    exerciseId: problem.exerciseId || null,
    displayNumber: problem.displayNumber,
    n: problem.n,
    total: problem.total,
    instruction: problem.instruction,
    prompt: problem.prompt || problem.instruction,
    startEquation: problem.startEquation || null,
    eq1: problem.eq1 || null,
    eq2: problem.eq2 || null,
    explain: problem.explain || "",
  };
  if (problem.geo) out.geo = dropSecrets(problem.geo, 0);
  if (problem.mode === "quad-mixed") out.offerFormula = !!problem.offerFormula;
  if (problem.mode === "percent") {
    out.stem = problem.stem || "";
    out.prompt = problem.stem || problem.prompt || "";
    if (problem.answers && problem.answers.length) {
      out.answers = problem.answers.map(function (field) {
        var item = { id: field.id, label: field.label || "" };
        if (field.unit) item.unit = field.unit;
        return item;
      });
    }
  }
  if (problem.mode === "freq-table") {
    out.stem = problem.stem || "";
    out.prompt = problem.stem || problem.prompt || "";
    out.table = problem.table || null;
    if (problem.data) out.data = problem.data;
    out.parts = (problem.parts || []).map(function (part) {
      return { label: part.label || "", text: part.text || "" };
    });
  }
  return out;
}

function displayTask(G, task) {
  if (!task) return null;
  return {
    id: task.id,
    kind: task.kind,
    label: task.label || "",
    from: task.from || null,
    to: task.to || null,
    point: task.point || null,
    optional: !!task.optional,
    perpendicular: !!task.perpendicular,
    parallel: !!task.parallel,
    axisParallel: task.axisParallel || null,
    stepLabel: G && G.taskStepLabel ? G.taskStepLabel(task) : "",
  };
}

function sanitizeGraphs(graphs) {
  return (graphs || []).map(function (g) {
    if (!g || typeof g !== "object") return g;
    var copy = {};
    Object.keys(g).forEach(function (key) {
      if (key === "_raw") return;
      copy[key] = g[key];
    });
    if (!copy.showEq) delete copy.eqText;
    return copy;
  });
}

function sanitizeScene(scene) {
  scene = scene || { points: [], segments: [] };
  var copy;
  try {
    copy = JSON.parse(JSON.stringify(scene));
  } catch (err) {
    copy = { points: scene.points || [], segments: scene.segments || [] };
  }
  if (copy.graphs) copy.graphs = sanitizeGraphs(copy.graphs);
  return copy;
}

function slimMatchPanel(panel) {
  if (!panel) return { lines: [], rows: [], hasDistractor: false };
  return {
    lines: (panel.lines || []).map(function (line) {
      return { key: line.key, label: line.label || line.key };
    }),
    hasDistractor: !!panel.hasDistractor,
    rows: (panel.rows || []).map(function (row) {
      var task = row.task || {};
      var done = !!row.done;
      var taskOut = { id: task.id };
      if (done && task.answerKey) taskOut.answerKey = task.answerKey;
      return {
        task: taskOut,
        eqText: row.eqText || "",
        eqNum: row.eqNum,
        lineKey: row.lineKey || null,
        reason: row.reason || null,
        lineDone: !!row.lineDone,
        reasonDone: !!row.reasonDone,
        needReason: !!row.needReason,
        done: done,
      };
    }),
  };
}

function buildClientView(engine, pack, progress) {
  var G = engine.DoctematicaGeometry;
  progress = progress || { done: {} };
  var part = G.currentPartText ? G.currentPartText(pack, progress) : null;
  var focus = G.currentFocusTask ? G.currentFocusTask(pack, progress) : null;
  var heading = G.partHeadingTask ? G.partHeadingTask(pack, progress) : null;
  var ask = G.lineAsk ? G.lineAsk(pack, progress) : null;
  var scene = G.sceneForProgress ? G.sceneForProgress(pack, progress) : { points: pack.points || [], segments: pack.segments || [] };
  var drawActive = !!(G.drawPartActive && G.drawPartActive(pack, progress));
  var drawConfig = drawActive && G.resolveDrawConfig ? G.resolveDrawConfig(pack) : null;
  var draw = G.initDrawProgress ? G.initDrawProgress(pack, progress) : null;
  var lineMatchActive = !!(G.lineMatchPartActive && G.lineMatchPartActive(pack, progress));
  var panel = lineMatchActive && G.lineMatchPanelData ? G.lineMatchPanelData(pack, progress) : null;
  var given = G.givenLineText ? G.givenLineText(pack, progress) : null;
  var view = {
    scene: sanitizeScene(scene),
    pointMap: dropSecrets(pack.map || {}, 0),
    draw: draw,
    drawConfig: drawConfig,
    drawActive: drawActive,
    part: part
      ? { label: part.label || "", text: part.text || "", taskIds: part.taskIds || [] }
      : null,
    focus: displayTask(G, focus),
    headingTask: displayTask(G, heading),
    lineMatchActive: lineMatchActive,
    lineMatch: slimMatchPanel(panel),
    reasonOptions: G.lineMatchReasonOptions ? G.lineMatchReasonOptions() : [],
    ask: ask
      ? {
          stage: ask.stage,
          question: ask.question || "",
          choices: ask.choices || (ask.task && G.reasonChoices ? G.reasonChoices(ask.task) : []),
          task: displayTask(G, ask.task),
        }
      : null,
    givenText: given,
    firstPartLineMatchOnly: !!(G.firstPartLineMatchOnly && G.firstPartLineMatchOnly(pack)),
    plugReason: G.onLinePlugReason ? G.onLinePlugReason() : "",
  };
  try {
    return JSON.parse(JSON.stringify(view));
  } catch (err) {
    view.drawConfig = null;
    view.pointMap = {};
    return JSON.parse(JSON.stringify(view));
  }
}

function openProblem(engine, levelId, index) {
  var content = engine.DoctematicaContent;
  if (!content || typeof content.problem !== "function") return null;
  var problem = content.problem(levelId, index);
  if (!problem) return null;
  var view = null;
  if (problem.geo && engine.DoctematicaGeometry) {
    view = buildClientView(engine, problem.geo, { done: {}, partial: {}, lastExpr: {}, coords: {}, lineMatch: {} });
  }
  if (problem.mode === "freq-table") {
    view = freqTable.openingView(engine, problem.levelId, index, problem.exerciseId);
  }
  if (problem.mode === "percent") {
    view = percent.openingView(engine, problem.levelId, index, problem.exerciseId);
  }
  var slim = slimProblem(problem);
  if (slim) slim.displayNumber = index + 1;
  if (problem.mode === "quad-mixed") {
    var Q = engine.DoctematicaQuadratic;
    var start = problem.startEquation || "";
    try {
      var parsed = Q && Q.parseABC ? Q.parseABC(start) : null;
      slim.offerFormula = !!(Q && Q.isAbcOrder && Q.isAbcOrder(start) && parsed && parsed.a);
    } catch (err) {
      slim.offerFormula = false;
    }
  }
  return { problem: slim, view: view };
}

module.exports = {
  catalog: catalog,
  openProblem: openProblem,
  slimProblem: slimProblem,
  buildClientView: buildClientView,
};
