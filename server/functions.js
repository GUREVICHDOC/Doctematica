"use strict";

function findExercise(engine, body) {
  var levels = (engine.DoctematicaCurriculum && engine.DoctematicaCurriculum.levels) || [];
  var level = levels.filter(function (item) {
    return item.id === body.levelId;
  })[0];
  if (!level) return null;
  var listed = level.exercises || [];
  var picked = null;
  if (body.exerciseId) {
    picked = listed.filter(function (item) { return item.id === body.exerciseId; })[0];
  }
  if (!picked && isFinite(body.exerciseIndex)) picked = listed[Number(body.exerciseIndex)] || null;
  if (picked && picked.signGraph) return { sign: true, ex: picked, level: level };
  if (picked && picked.monoGraph) return { mono: true, ex: picked, level: level };
  if (picked && picked.freeSketch) return { free: true, ex: picked, level: level };
  if (picked && picked.levelProbe) return { probe: true, ex: picked, level: level };
  if (picked && picked.tasks && (picked.f || picked.points)) return { compare: true, ex: picked, level: level };
  if (level.mode !== "fn" && level.mode !== "param") return null;
  var list = level.exercises || [];
  var ex = null;
  if (body.exerciseId) {
    ex = list.filter(function (item) {
      return item.id === body.exerciseId;
    })[0];
  }
  if (!ex && isFinite(body.exerciseIndex)) ex = list[Number(body.exerciseIndex)] || null;
  if (!ex) return null;
  var pack = engine.DoctematicaFn.prepare(ex);
  if (!pack) return null;
  return { level: level, ex: ex, pack: pack };
}

function axisPayload(checked) {
  if (!checked || !checked.axis) return {};
  var flags = { y: false, x: false };
  var axes = checked.progress && checked.progress.axes;
  if (axes) {
    Object.keys(axes).forEach(function (id) {
      var st = axes[id] || {};
      if (st.y === "done") flags.y = true;
      if (st.x === "done") flags.x = true;
    });
  }
  return { axis: checked.axis, axisDone: flags };
}

function createFunctionsHandler(engine) {
  function handle(body) {
    body = body || {};
    var found = findExercise(engine, body);
    if (!found) return { error: "unknown exercise", message: "unknown exercise" };
    if (found.sign) return require("./sign-graph").handle(engine, found.ex, body);
    if (found.mono) return require("./extrema").handle(engine, found.ex, body);
    if (found.free) return require("./free-sketch").handle(engine, found.ex, body);
    if (found.probe) return require("./level-probe").handle(engine, found.ex, body);
    if (found.compare) return require("./compare").handle(engine, found.ex, body);
    var Fn = engine.DoctematicaFn;
    var progress = body.progress || Fn.freshProgress();
    var intent = String(body.intent || "check");
    var pack = found.pack;

    if (intent === "hint") {
      return {
        ok: true,
        hint: Fn.hintFor(pack, progress),
        hints: Fn.hintsFor ? Fn.hintsFor(pack, progress) : [Fn.hintFor(pack, progress)],
        view: Fn.viewFor(pack, progress),
      };
    }

    if (intent === "solution") {
      var solved = Fn.solutionLines(pack) || {};
      var lines = solved.steps || [];
      return {
        ok: true,
        steps: lines,
        notes: solved.notes || lines.map(function () { return ""; }),
        answer: lines.length ? lines[lines.length - 1] : "",
      };
    }

    if (intent === "one-step") {
      var line = Fn.nextLine(pack, progress);
      var task = Fn.currentTask(pack, progress);
      if (task && task.kind === "fnSketch") {
        var guided = Fn.sketchAdvance(pack, progress);
        if (!guided.ok) return { ok: false, message: guided.message || "אין צעד נוסף." };
        return {
          ok: true,
          show: guided.show,
          heading: Fn.pointHeading(pack, progress),
          message: guided.message || "",
          progress: guided.progress,
          solved: !!guided.solved,
          view: Fn.viewFor(pack, guided.progress),
          hint: Fn.hintFor(pack, guided.progress),
          board: guided.board,
        };
      }
      if (!line) return { ok: false, message: "אין צעד נוסף להציג." };
      var stepped = Fn.checkTyped(pack, progress, line);
      if (!stepped.ok) return { ok: false, message: stepped.message || "אין צעד נוסף." };
      return Object.assign({
        ok: true,
        show: stepped.show || line,
        heading: Fn.pointHeadingFor(pack, progress, line),
        message: stepped.message || "",
        progress: stepped.progress,
        solved: !!stepped.solved,
        view: Fn.viewFor(pack, stepped.progress),
        hint: Fn.hintFor(pack, stepped.progress),
      }, axisPayload(stepped));
    }

    if (intent === "sketch-point") {
      var point = body.point || {};
      var placed = Fn.checkSketchPoint(pack, body.sketch || { points: [] }, point);
      if (!placed.ok) return { ok: false, message: placed.message || "הנקודה לא במקום המתאים." };
      return { ok: true, message: "הנקודה מסומנת במקום סביר.", point: point };
    }

    if (intent === "sketch" || (intent === "check" && body.sketch && body.sketch.line)) {
      var taskNow = Fn.currentTask(pack, progress);
      if (taskNow && taskNow.kind === "fnSketch") {
        var drawn = Fn.checkSketch(pack, progress, body.sketch || {});
        if (!drawn.ok) return { ok: false, message: drawn.message || "השרטוט עוד לא מתאים." };
        return {
          ok: true,
          show: drawn.show,
          heading: Fn.pointHeading(pack, progress),
          message: drawn.message || "",
          progress: drawn.progress,
          solved: !!drawn.solved,
          view: Fn.viewFor(pack, drawn.progress),
          hint: Fn.hintFor(pack, drawn.progress),
        };
      }
    }

    if (body.domains) {
      var byFields = Fn.checkDomainFields(pack, progress, body.domains);
      if (!byFields.ok) return { ok: false, message: byFields.message || "עוד לא." };
      return {
        ok: true,
        show: byFields.show || "",
        heading: Fn.pointHeading(pack, progress),
        message: byFields.message || "",
        progress: byFields.progress,
        solved: !!byFields.solved,
        view: Fn.viewFor(pack, byFields.progress),
        hint: Fn.hintFor(pack, byFields.progress),
      };
    }

    var checked = Fn.checkTyped(pack, progress, body.typed, body.axis ? { axis: String(body.axis) } : null);
    if (!checked.ok) return { ok: false, message: checked.message || "עוד לא." };
    return Object.assign({
      ok: true,
      show: checked.show || "",
      heading: Fn.pointHeadingFor(pack, progress, body.typed),
      message: checked.message || "",
      progress: checked.progress,
      solved: !!checked.solved,
      view: Fn.viewFor(pack, checked.progress),
      hint: Fn.hintFor(pack, checked.progress),
    }, axisPayload(checked));
  }

  return { handle: handle };
}

module.exports = {
  createFunctionsHandler: createFunctionsHandler,
};
