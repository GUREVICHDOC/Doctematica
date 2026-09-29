(function (global) {
  function model() {
    return global.DoctematicaFnModel;
  }

  function graph() {
    return global.DoctematicaFnGraph;
  }

  function freshProgress() {
    return { done: {}, phase: {}, eq: {}, rootKnown: false, vertexKnown: false, axes: {}, regions: {}, got: {} };
  }

  function cloneProgress(progress) {
    try {
      var copy = JSON.parse(JSON.stringify(progress || freshProgress()));
      copy.done = copy.done || {};
      copy.phase = copy.phase || {};
      copy.eq = copy.eq || {};
      copy.axes = copy.axes || {};
      copy.regions = copy.regions || {};
      if (copy.rootKnown == null) copy.rootKnown = false;
      if (copy.vertexKnown == null) copy.vertexKnown = false;
      copy.got = copy.got || {};
      return copy;
    } catch (err) {
      return freshProgress();
    }
  }

  function tasksOf(pack) {
    var map = {};
    (pack.tasks || []).forEach(function (task) {
      map[task.id] = task;
    });
    return map;
  }

  function remaining(pack, progress) {
    return (pack.tasks || []).filter(function (task) {
      if (task.optional) return false;
      return !(progress.done && progress.done[task.id]);
    });
  }

  function currentPart(pack, progress) {
    var map = tasksOf(pack);
    var parts = pack.parts || [];
    var i;
    for (i = 0; i < parts.length; i++) {
      var ids = parts[i].taskIds || [];
      var open = ids.some(function (id) {
        var task = map[id];
        if (task && task.optional) return false;
        return !(progress.done && progress.done[id]);
      });
      if (open) return parts[i];
    }
    return null;
  }

  function currentTask(pack, progress) {
    var part = currentPart(pack, progress);
    if (!part) return null;
    var map = tasksOf(pack);
    var ids = part.taskIds || [];
    var i;
    for (i = 0; i < ids.length; i++) {
      var task = map[ids[i]];
      if (task && !task.optional && !(progress.done && progress.done[task.id])) return task;
    }
    return null;
  }

  function readPoint(text) {
    var Geo = global.DoctematicaGeometry;
    if (!Geo || !Geo.parsePointPair) return null;
    var raw = String(text || "").trim();
    var named = raw.match(/^[A-Za-z]\s*(\(.+\))$/);
    return Geo.parsePointPair(named ? named[1] : raw);
  }

  function pairText(x, y) {
    return "(" + model().fmt(x) + "," + model().fmt(y) + ")";
  }

  function readBag(progress, key) {
    return (progress && progress.got && progress.got[key]) || { roots: [], points: [], steps: [] };
  }

  function sortedRoots(fn) {
    return ((fn && fn.roots) || []).slice().sort(function (a, b) { return a - b; });
  }

  function namedPointCount(pack, progress) {
    var part = currentPart(pack, progress);
    if (!part) return 0;
    var map = tasksOf(pack);
    var n = 0;
    (part.taskIds || []).forEach(function (id) {
      var task = map[id];
      if (!task) return;
      if (task.names && task.names.length) n += task.names.length;
      else if (task.name) n += 1;
      else if (task.kind === "fnIntercepts") n += 1 + Math.max((pack.fn.roots || []).length, 1);
    });
    return n;
  }

  function rootName(pack, task, x) {
    var M = model();
    var roots = sortedRoots(pack.fn);
    var names = (task && task.names) || [];
    var labels = (pack.labels || []).filter(function (label) {
      return label.at === "x" && names.indexOf(label.name) >= 0;
    });
    if (labels.length && labels.length === names.length) {
      var ordered = labels.slice().sort(function (a, b) {
        return (a.order === "right" ? 1 : 0) - (b.order === "right" ? 1 : 0);
      });
      var i;
      for (i = 0; i < roots.length && i < ordered.length; i++) {
        if (M.near(roots[i], x)) return ordered[i].name;
      }
    }
    var j;
    for (j = 0; j < roots.length && j < names.length; j++) {
      if (M.near(roots[j], x)) return names[j];
    }
    return "";
  }

  function nextZeroName(pack, progress, task) {
    var M = model();
    var store = readBag(progress, task.id);
    var roots = sortedRoots(pack.fn);
    var i;
    for (i = 0; i < roots.length; i++) {
      var placed = store.points.some(function (p) { return M.near(p, roots[i]); });
      if (!placed) return rootName(pack, task, roots[i]);
    }
    return "";
  }

  function joinNames(names) {
    if (!names || !names.length) return "";
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(", ") + " ו־" + names[names.length - 1];
  }

  function pointHeadingFor(pack, progress, typed) {
    var base = pointHeading(pack, progress);
    var task = currentTask(pack, progress);
    if (!base || !task || task.kind !== "fnZero" || !(task.names && task.names.length) || !typed) return base;
    var pairs = readPairs(typed);
    if (pairs.length !== 1) return base;
    var name = rootName(pack, task, pairs[0].x);
    if (!name) return base;
    return "נקודה " + name + " (ציר x)";
  }

  function pointHeading(pack, progress) {
    if (!pack || namedPointCount(pack, progress) < 2) return "";
    var task = currentTask(pack, progress);
    if (!task) return "";
    if (task.kind === "fnPoint" && task.name) {
      var onY = Math.abs(Number(task.at)) < 1e-8;
      return "נקודה " + task.name + (onY ? " (ציר y)" : "");
    }
    if (task.kind === "fnVertex" && task.name) return "נקודה " + task.name + " (קודקוד)";
    if (task.kind === "fnZero" && task.names && task.names.length) {
      var phase = (progress.phase && progress.phase[task.id]) || "";
      if (phase === "points" || phase === "root") {
        var name = nextZeroName(pack, progress, task);
        if (name) return "נקודה " + name + " (ציר x)";
      }
      if (task.names.length === 1) return "נקודה " + task.names[0] + " (ציר x)";
      return "נקודות " + joinNames(task.names) + " (ציר x)";
    }
    if (task.kind === "fnIntercepts") {
      var axes = (progress.axes && progress.axes[task.id]) || {};
      if (axes.y !== "done") return "חיתוך עם ציר ה־y";
      var roots = sortedRoots(pack.fn);
      var placed = readBag(progress, task.id + ":x").points || [];
      if (roots.length > 1 && placed.length && placed.length < roots.length) return "חיתוך עם ציר ה־x (הנקודה הבאה)";
      return "חיתוך עם ציר ה־x";
    }
    return "";
  }

  function foundPointLabels(pack, progress) {
    var M = model();
    var out = {};
    (pack.tasks || []).forEach(function (task) {
      var phase = (progress.phase && progress.phase[task.id]) || "";
      var done = !!(progress.done && progress.done[task.id]);
      if (task.kind === "fnPoint" && task.name && (done || phase === "point")) {
        out[task.name] = task.name + pairText(Number(task.at), M.evalAt(pack.fn, task.at));
      }
      if (task.kind === "fnVertex" && task.name && (done || phase === "point" || phase === "kind")) {
        var vertex = M.vertex(pack.fn);
        if (vertex) out[task.name] = task.name + pairText(vertex.x, vertex.y);
      }
      if (task.kind === "fnZero" && task.names && task.names.length) {
        var store = readBag(progress, task.id);
        sortedRoots(pack.fn).forEach(function (x) {
          if (!store.points.some(function (p) { return M.near(p, x); })) return;
          var name = rootName(pack, task, x);
          if (name) out[name] = name + pairText(x, 0);
        });
      }
    });
    return out;
  }

  function labelTaken(labels, at, order) {
    return (labels || []).some(function (label) {
      if (label.at !== at) return false;
      if (at !== "x") return true;
      return !order || label.order === order || !label.order;
    });
  }

  function figureLabels(pack, progress) {
    var M = model();
    var found = foundPointLabels(pack, progress);
    var labels = (pack.labels || []).map(function (label) {
      return {
        name: label.name,
        at: label.at,
        order: label.order,
        text: found[label.name] || label.name,
      };
    });
    (pack.tasks || []).forEach(function (task) {
      var phase = (progress.phase && progress.phase[task.id]) || "";
      var done = !!(progress.done && progress.done[task.id]);
      if (task.kind === "fnVertex" && !task.name && (done || phase === "point" || phase === "kind") && !labelTaken(labels, "vertex")) {
        var vertex = M.vertex(pack.fn);
        if (vertex) labels.push({ at: "vertex", text: pairText(vertex.x, vertex.y) });
      }
      if (task.kind === "fnIntercepts") {
        var axes = (progress.axes && progress.axes[task.id]) || {};
        if (axes.y === "done" && !labelTaken(labels, "y")) {
          labels.push({ at: "y", text: pairText(0, M.evalAt(pack.fn, 0)) });
        }
        if (axes.x === "done" || (readBag(progress, task.id + ":x").points || []).length) {
          var store = readBag(progress, task.id + ":x");
          var roots = sortedRoots(pack.fn);
          roots.forEach(function (x, index) {
            if (roots.length > 1 && !store.points.some(function (p) { return M.near(p, x); }) && axes.x !== "done") return;
            if (roots.length === 1 && axes.x !== "done" && !store.points.length) return;
            var order = roots.length > 1 && index === roots.length - 1 ? "right" : "left";
            if (labelTaken(labels, "x", order)) return;
            labels.push({ at: "x", order: order, text: pairText(x, 0) });
          });
        }
      }
      if (task.kind === "fnPoint" && !task.name && (done || phase === "point")) {
        var at = Number(task.at);
        var onAxis = Math.abs(at) < 1e-8 ? "y" : "";
        if (onAxis && !labelTaken(labels, onAxis)) {
          labels.push({ at: onAxis, text: pairText(at, M.evalAt(pack.fn, at)) });
        }
      }
    });
    return labels;
  }

  function bad(message) {
    return { ok: false, message: message };
  }

  function good(progress, pack, show, message) {
    return {
      ok: true,
      message: message || "נכון.",
      show: show,
      progress: progress,
      solved: remaining(pack, progress).length === 0,
    };
  }

  function parseEq(text) {
    var A = global.DoctematicaAlgebra;
    if (!A) return null;
    try {
      return A.parseEquation(text);
    } catch (err) {
      return null;
    }
  }

  function algebraMove(fn, last, typed) {
    var A = global.DoctematicaAlgebra;
    var M = model();
    if (!A || !fn.roots.length) return null;
    var canon = fn.expr + "=0";
    if (!last) {
      var call = M.parseFnCall(typed);
      if (call && call.arg === "x") {
        var rhs0 = M.evalNumeric(call.rhs);
        if (rhs0 != null && M.near0(rhs0)) return { ok: true, stage: "setup", show: "f(x) = 0" };
      }
      if (/^y=0$/i.test(M.ascii(typed))) return { ok: true, stage: "setup", show: "y = 0" };
      var parsed = parseEq(typed);
      var base = parseEq(canon);
      if (!parsed || !base || !A.equivalent(parsed, base)) return null;
      if (A.isSolvedText(typed)) {
        var sol = A.solutionOf(parsed);
        if (sol != null && M.near(sol, fn.roots[0])) {
          return { ok: true, stage: "root", show: "x = " + M.fmt(sol), eq: typed };
        }
        return bad("הפתרון לא מתאים לנקודת האפס של הפונקציה.");
      }
      return { ok: true, stage: "eq", show: M.zeroEquation(fn), eq: String(typed).trim() };
    }
    var step;
    try {
      step = A.checkStep(last, typed);
    } catch (err) {
      return bad("לא הצלחתי לקרוא את המשוואה.");
    }
    if (!step || !step.ok) return bad((step && step.message) || "הצעד לא שקול למשוואה.");
    if (step.solved || A.isSolvedText(typed)) {
      var sol2 = A.solutionOf(step.equation || parseEq(typed));
      if (sol2 == null || !M.near(sol2, fn.roots[0])) return bad("הפתרון לא מתאים לנקודת האפס של הפונקציה.");
      return { ok: true, stage: "root", show: "x = " + M.fmt(sol2), eq: typed };
    }
    return { ok: true, stage: "eq", show: String(typed).trim(), eq: String(typed).trim() };
  }

  function asFnCall(typed, at) {
    var M = model();
    var call = M.parseFnCall(typed);
    if (call) return call;
    var yLine = M.parseYValue(typed);
    if (!yLine) return null;
    return { arg: Number(at), rhs: yLine.rhs };
  }

  function plugStep(fn, at, rhs, spell) {
    var M = model();
    var barePow = M.bareNegativePower(rhs, at);
    if (barePow) {
      return bad(
        "מספר שלילי בחזקה נכתב בסוגריים בבסיס: (" + String(barePow).replace(/-/g, "−") + ")^2."
      );
    }
    var want = M.evalAt(fn, at);
    var got = M.evalNumeric(rhs);
    if (got == null || !M.near(got, want)) {
      if (M.containsAt(rhs, -at) && !M.near(at, -at)) return bad("הציבו את x עם הסימן שמצאתם, לא את המספר הנגדי.");
      if (M.containsAt(rhs, at)) return bad("ההצבה נכונה, אבל החישוב שגוי. חשבו שוב את האגף הימני.");
      return bad("ההצבה לא מדויקת. החליפו את x ב־" + M.fmt(at) + ".");
    }
    if (M.bareNumber(rhs) != null) {
      return { ok: true, stage: "value", show: M.fnCallText(at, M.asWritten(rhs, want) || M.fmt(want), spell) };
    }
    if (!M.containsAt(rhs, at)) {
      return bad("הציבו את " + M.fmt(at) + " במקום x.");
    }
    return { ok: true, stage: "plug", show: M.fnCallText(at, M.substText(fn, at, spell), spell) };
  }

  function markRoot(progress) {
    progress.rootKnown = true;
  }

  function checkValueTask(pack, progress, task, typed, needPoint) {
    var M = model();
    var fn = pack.fn;
    var at = Number(task.at);
    var y = M.evalAt(fn, at);
    var phase = progress.phase[task.id] || "";
    var point = readPoint(typed);
    if (point) {
      if (!M.near(point.x, at) || !M.near(point.y, y)) return bad("הזוג הסדור לא מתאים לנקודה על הגרף.");
      progress.phase[task.id] = "point";
      progress.done[task.id] = true;
      var shownPoint = (task.name ? task.name : "") + pairText(at, y);
      return good(progress, pack, shownPoint, "הנקודה על הגרף: שיעור ה־y הוא ערך הפונקציה בשיעור ה־x הזה.");
    }
    var xLine = M.ascii(typed).match(/^x=(.+)$/i);
    if (xLine && phase !== "plug" && phase !== "value" && phase !== "point") {
      var xExpr = xLine[1];
      var xVal = M.evalNumeric(xExpr);
      if (xVal != null && M.near(xVal, at) && !valueStillOpen(xExpr)) {
        if (phase === "set") return bad("את x כבר רשמתם. הציבו אותו במשוואה ומצאו את y.");
        progress.phase[task.id] = "set";
        var xShow = "x = " + (M.asWritten(xExpr, at) || M.fmt(at));
        var xWhy = M.near0(at)
          ? "הנקודה על ציר ה־y, ולכן x = 0. כעת הציבו במשוואה ומצאו את y."
          : "זה שיעור ה־x של הנקודה. כעת הציבו אותו במשוואה ומצאו את y.";
        return good(progress, pack, xShow, xWhy);
      }
      if (xVal != null && !M.near(xVal, at) && !valueStillOpen(xExpr)) {
        return bad("שיעור ה־x של הנקודה הוא " + M.fmt(at) + ".");
      }
    }
    var wroteY = !M.parseFnCall(typed) && M.parseYValue(typed);
    var call = asFnCall(typed, at);
    if (call && call.arg !== "x") {
      if (!M.near(call.arg, at)) return bad("מציבים את x = " + M.fmt(at) + ".");
      var step = plugStep(fn, at, call.rhs);
      if (!step.ok) return step;
      if (step.stage === "plug" && phase === "plug") return bad("את ההצבה כבר רשמתם. עכשיו חשבו.");
      if (step.stage === "value" && phase === "value") {
        return bad(needPoint ? "רשמו את הנקודה כזוג סדור." : "את הערך כבר רשמתם.");
      }
      if (step.stage === "plug") {
        progress.phase[task.id] = "plug";
        var plugShow = wroteY ? "y = " + M.pretty(wroteY.rhs) : step.show;
        return good(progress, pack, plugShow, "נכון. עכשיו חשבו את y.");
      }
      progress.phase[task.id] = "value";
      var valueShow = wroteY
        ? "y = " + (M.asWritten(wroteY.rhs, y) || M.fmt(y))
        : step.show;
      if (!needPoint) {
        progress.done[task.id] = true;
        return good(progress, pack, valueShow, "זה ערך הפונקציה בנקודה הזו.");
      }
      return good(progress, pack, valueShow, "נכון. רשמו את הנקודה כזוג סדור.");
    }
    var bare = M.bareNumber(typed);
    if (bare != null) {
      if (!M.near(bare, y)) return bad("הערך לא מתאים להצבה בפונקציה.");
      if (!phase && fn.degree > 0) {
        progress.phase[task.id] = "value";
      } else {
        progress.phase[task.id] = "value";
      }
      if (!needPoint) {
        progress.done[task.id] = true;
        return good(progress, pack, M.fnCallText(at, M.fmt(y)), "זה ערך הפונקציה בנקודה הזו.");
      }
      return good(progress, pack, "y = " + (M.asWritten(typed, y) || M.fmt(y)), "נכון. רשמו את הנקודה כזוג סדור.");
    }
    if (phase === "value" && needPoint) return bad("רשמו את הנקודה כזוג סדור, למשל (x,y).");
    if (phase === "plug") return bad("חשבו את y.");
    if (phase === "set") return bad("הציבו את x במשוואה. אפשר y = …, בלי חובה לכתוב f().");
    if (needPoint && M.near0(at)) return bad("הנקודה על ציר ה־y. רשמו x = 0, ואחר כך הציבו במשוואה ומצאו את y.");
    if (needPoint) return bad("רשמו את x, או הציבו ישר במשוואה: y = …");
    return bad("הציבו את " + M.fmt(at) + " במקום x. אפשר f() או y = …");
  }

  function finishRoot(progress, taskId) {
    markRoot(progress);
    progress.phase[taskId] = "root";
  }

  function checkZeroTask(pack, progress, task, typed, needPoint) {
    var M = model();
    var fn = pack.fn;
    var phase = progress.phase[task.id] || "";
    if (!fn.roots.length) {
      if (M.isEmptySet(typed) || /אין/.test(String(typed || ""))) {
        progress.done[task.id] = true;
        progress.phase[task.id] = "none";
        return good(progress, pack, "אין נקודת אפס", "נכון. לפונקציה אין נקודת אפס.");
      }
      return bad("לפונקציה הזו אין נקודת אפס. כתבו שאין.");
    }
    if (fn.degree >= 2) return checkSolve(pack, progress, task, typed, { k: 0, points: needPoint });
    var point = readPoint(typed);
    var root = fn.roots[0];
    if (point) {
      if (!M.near(point.y, 0) || !M.near(point.x, root)) return bad("הזוג הסדור אינו נקודת האפס.");
      markRoot(progress);
      progress.phase[task.id] = "point";
      progress.done[task.id] = true;
      return good(progress, pack, pairText(root, 0), "בנקודת האפס y = 0, ולכן הנקודה על ציר ה־x.");
    }
    var move = algebraMove(fn, progress.eq[task.id], typed);
    if (move && move.ok === false) return move;
    if (move && move.ok) {
      if (move.eq) progress.eq[task.id] = move.eq;
      if (move.stage === "root") {
        finishRoot(progress, task.id);
        if (!needPoint) {
          progress.done[task.id] = true;
          return good(progress, pack, move.show, "זה הפתרון של f(x) = 0.");
        }
        return good(progress, pack, move.show, "נכון. רשמו את הנקודה על ציר ה־x.");
      }
      progress.phase[task.id] = move.stage;
      var nextMsg = move.stage === "setup" ? "רשמו את המשוואה ופתרו אותה." : "המשיכו לפתור את המשוואה.";
      return good(progress, pack, move.show, "נכון. " + nextMsg);
    }
    if (phase === "root" && needPoint) return bad("רשמו את נקודת האפס כזוג סדור.");
    return bad("פתרו את המשוואה " + M.zeroEquation(fn) + ".");
  }

  function axisState(progress, id) {
    progress.axes[id] = progress.axes[id] || { x: "", y: "" };
    return progress.axes[id];
  }

  function checkIntercepts(pack, progress, task, typed) {
    var M = model();
    var fn = pack.fn;
    var axes = axisState(progress, task.id);
    var y0 = M.evalAt(fn, 0);
    function side(which, res) {
      if (res && res.ok) res.axis = which;
      return res;
    }
    var point = readPoint(typed);
    if (point) {
      if (M.near(point.x, 0) && M.near(point.y, y0)) {
        if (axes.y === "done") return bad("את חיתוך ציר ה־y כבר מצאתם.");
        axes.y = "done";
        if (axes.x === "done") progress.done[task.id] = true;
        return side("y", good(progress, pack, pairText(0, y0), axes.x === "done" ? "על ציר ה־y מתקיים x = 0, ושיעור ה־y הוא f(0)." : "נכון. עכשיו חיתוך עם ציר ה־x."));
      }
      if (fn.roots.length && M.near(point.y, 0)) {
        var hitRoot = fn.roots.filter(function (r) { return M.near(r, point.x); })[0];
        if (hitRoot != null) {
          if (fn.degree >= 2) {
            var store = bag(progress, task.id + ":x");
            if (store.points.some(function (x) { return M.near(x, hitRoot); })) return bad("את הנקודה הזו כבר רשמתם.");
            store.points.push(hitRoot);
            rememberRoot(store, levelAt(fn, 0), hitRoot);
            if (store.points.length >= fn.roots.length) {
              axes.x = "done";
              markRoot(progress);
              if (axes.y === "done") progress.done[task.id] = true;
            }
            return side("x", good(progress, pack, pairText(hitRoot, 0), axes.x === "done" && axes.y === "done" ? "על ציר ה־x מתקיים y = 0." : store.points.length >= fn.roots.length ? "נכון. עכשיו חיתוך עם ציר ה־y." : "נכון. יש עוד חיתוך עם ציר ה־x."));
          }
          if (axes.x === "done") return bad("את חיתוך ציר ה־x כבר מצאתם.");
          axes.x = "done";
          markRoot(progress);
          if (axes.y === "done") progress.done[task.id] = true;
          return side("x", good(progress, pack, pairText(fn.roots[0], 0), axes.y === "done" ? "על ציר ה־x מתקיים y = 0." : "נכון. עכשיו חיתוך עם ציר ה־y."));
        }
      }
      return bad("הנקודה אינה חיתוך של הפונקציה עם אחד הצירים.");
    }
    if (/^(x=0|0=x)$/i.test(M.ascii(typed))) {
      if (axes.y === "done") return bad("את חיתוך ציר ה־y כבר מצאתם.");
      if (axes.y) return bad("המשיכו לחשב את f(0), או עברו לחיתוך עם ציר ה־x.");
      axes.y = "set";
      return side("y", good(progress, pack, "x = 0", "נכון. הציבו בפונקציה."));
    }
    var call = asFnCall(typed, 0);
    var yLine = !M.parseFnCall(typed) && M.parseYValue(typed);
    if (yLine) {
      var yNum = M.bareNumber(yLine.rhs);
      var bareZero = yNum != null && M.near0(yNum);
      var computingY = axes.y === "set" || axes.y === "plug";
      if (bareZero && !(computingY && M.near0(y0))) call = null;
    }
    if (call && call.arg !== "x" && M.near(call.arg, 0)) {
      if (axes.y === "done") return bad("את חיתוך ציר ה־y כבר מצאתם.");
      var step = plugStep(fn, 0, call.rhs);
      if (!step.ok) return step;
      axes.y = step.stage === "value" ? "value" : "plug";
      var msg = step.stage === "value" ? "נכון. רשמו את הנקודה (0,y)." : "נכון. עכשיו חשבו.";
      return side("y", good(progress, pack, step.show, msg));
    }
    if (!fn.roots.length && (M.isEmptySet(typed) || /אין/.test(String(typed || "")) || /ציר ה?x|צירהx/.test(String(typed || "")))) {
      if (axes.x === "done") return bad("כבר רשמתם שאין חיתוך עם ציר ה־x.");
      axes.x = "done";
      markRoot(progress);
      if (axes.y === "done") progress.done[task.id] = true;
      return side("x", good(progress, pack, "אין חיתוך עם ציר x", axes.y === "done" ? "אין פתרון ממשי, ולכן הגרף לא חותך את ציר ה־x." : "נכון. מצאו את החיתוך עם ציר ה־y."));
    }
    if (fn.degree >= 2 && axes.x !== "done") {
      var quad = checkSolve(pack, progress, task, typed, { k: 0, points: true, key: task.id + ":x", keepOpen: true });
      if (quad && quad.ok) {
        var xbag = bag(progress, task.id + ":x");
        if (!fn.roots.length && quad.progress && quad.progress.phase && quad.progress.phase[task.id] === "none") {
          axes.x = "done";
          markRoot(progress);
          if (axes.y === "done") progress.done[task.id] = true;
        } else if (xbag.points.length >= fn.roots.length && fn.roots.length) {
          axes.x = "done";
          markRoot(progress);
          if (axes.y === "done") progress.done[task.id] = true;
        } else if (quad.progress && quad.progress.phase && quad.progress.phase[task.id] === "points") {
          axes.x = "root";
        } else {
          axes.x = axes.x === "done" ? "done" : "set";
        }
        if (progress.done[task.id] && axes.y !== "done") progress.done[task.id] = false;
        quad.solved = remaining(pack, progress).length === 0;
        quad.axis = "x";
        return quad;
      }
      if (quad && quad.ok === false && progress.eq[task.id + ":x"]) return quad;
    }
    if (fn.degree < 2 && fn.roots.length && axes.x !== "done") {
      var move = algebraMove(fn, progress.eq[task.id + ":x"], typed);
      if (move && move.ok === false) return move;
      if (move && move.ok) {
        if (move.stage === "setup" && axes.x) return bad("המשיכו לפתור את המשוואה.");
        if (move.eq) progress.eq[task.id + ":x"] = move.eq;
        if (move.stage === "root") {
          axes.x = "root";
          markRoot(progress);
          return side("x", good(progress, pack, move.show, "נכון. רשמו את נקודת החיתוך עם ציר ה־x."));
        }
        axes.x = axes.x === "done" ? "done" : "set";
        return side("x", good(progress, pack, move.show, "נכון. המשיכו לפתור."));
      }
    }
    if (axes.y === "value") return bad("רשמו את נקודת החיתוך עם ציר ה־y.");
    if (axes.x === "root") return bad("רשמו את נקודת החיתוך עם ציר ה־x.");
    if (axes.y === "plug") return bad("חשבו את f(0).");
    return bad("אפשר להתחיל מחיתוך ציר ה־y: x = 0, או מחיתוך ציר ה־x: y = 0.");
  }

  function listSlot(list) {
    var clean = (list || []).filter(Boolean);
    if (!clean.length) return null;
    if (clean.length === 1) return clean[0];
    return clean;
  }

  function asRegionList(region) {
    if (!region) return [];
    if (Array.isArray(region)) return region;
    return [region];
  }

  function domainSlots(task, fn) {
    var M = model();
    if (task.kind === "fnSign") {
      var regions = M.signRegions(fn);
      var slots = {
        pos: listSlot(regions.filter(function (r) { return r.sign === "pos"; })),
        neg: listSlot(regions.filter(function (r) { return r.sign === "neg"; })),
      };
      if (task.only === "pos") return { pos: slots.pos };
      if (task.only === "neg") return { neg: slots.neg };
      return slots;
    }
    if (fn.degree >= 2) {
      var mono = M.monoRegions(fn);
      var monoSlots = {
        inc: listSlot(mono.filter(function (r) { return r.trend === "inc"; })),
        dec: listSlot(mono.filter(function (r) { return r.trend === "dec"; })),
      };
      if (task.only === "inc") return { inc: monoSlots.inc };
      if (task.only === "dec") return { dec: monoSlots.dec };
      return monoSlots;
    }
    var trend = M.trendOf(fn);
    if (trend === "inc") return { inc: { from: "-inf", to: "inf" }, dec: null };
    if (trend === "dec") return { inc: null, dec: { from: "-inf", to: "inf" } };
    return { inc: null, dec: null };
  }

  function slotKeys(slots) {
    return Object.keys(slots);
  }

  function regionOf(slots, key) {
    return slots[key];
  }

  function checkDomains(pack, progress, task, typed) {
    var M = model();
    var fn = pack.fn;
    if (task.kind === "fnMono" && fn.degree >= 2 && !progress.vertexKnown) {
      return checkVertex(pack, progress, { id: task.id, want: "x" }, typed);
    }
    if (task.kind === "fnSign" && fn.degree >= 2 && !progress.rootKnown) {
      if (M.parseDomainAnswer(typed).length || M.isAllReals(typed) || M.isEmptySet(typed)) {
        return bad("מצאו תחילה את נקודות האפס. הן מחלקות את ציר ה־x לתחומים שבהם הסימן יכול להשתנות.");
      }
      var quadSign = quadAdvance(fn, progress, task.id, 0, typed);
      if (!quadSign.ok) return quadSign;
      if (quadSign.stage === "roots" || quadSign.stage === "none") {
        progress.phase[task.id] = "root";
        return good(progress, pack, quadSign.show, "נכון. עכשיו רשמו את תחומי החיוביות והשליליות.");
      }
      progress.phase[task.id] = quadSign.stage;
      return good(progress, pack, quadSign.show, quadSign.message || "נכון. המשיכו עד שנקודות האפס ידועות.");
    }
    if (task.kind === "fnSign" && fn.roots.length && !progress.rootKnown) {
      var move = algebraMove(fn, progress.eq[task.id], typed);
      if (move && move.ok === false) return move;
      if (move && move.ok) {
        if (move.eq) progress.eq[task.id] = move.eq;
        if (move.stage === "root") {
          markRoot(progress);
          progress.phase[task.id] = "root";
          return good(progress, pack, move.show, "נכון. עכשיו רשמו את תחומי החיוביות והשליליות.");
        }
        progress.phase[task.id] = move.stage;
        return good(progress, pack, move.show, "נכון. המשיכו עד שנקודת האפס ידועה.");
      }
      if (M.parseDomainAnswer(typed).length || M.isFlatPhrase(typed)) {
        return bad("קודם מצאו את נקודת האפס: פתרו את המשוואה " + M.zeroEquation(fn) + ".");
      }
      return bad("קודם מצאו את נקודת האפס של הפונקציה.");
    }
    if (task.kind === "fnMono" && M.trendOf(fn) === "flat" && M.isFlatPhrase(typed)) {
      progress.regions[task.id] = { inc: true, dec: true };
      progress.done[task.id] = true;
      progress.phase[task.id] = "done";
      return good(progress, pack, "אינה עולה ואינה יורדת", "נכון. פונקציה קבועה אינה עולה ואינה יורדת.");
    }
    var items = M.parseDomainAnswer(typed);
    if (!items.length) {
      if (task.kind === "fnMono") return bad("רשמו תחומי עלייה וירידה, למשל עולה: כל x, יורדת: אין.");
      return bad("רשמו תחומי חיוביות ושליליות, למשל x > a ו־x < a.");
    }
    var slots = domainSlots(task, fn);
    var bag = progress.regions[task.id] || {};
    var keys = slotKeys(slots);
    var i;
    for (i = 0; i < items.length; i++) {
      var item = items[i];
      var matchKey = null;
      if (item.label && keys.indexOf(item.label) >= 0) {
        if (!regionFits(item, slots[item.label])) {
          return bad(item.label === "pos" || item.label === "neg"
            ? "התחום לא מתאים לסימן של הפונקציה שם."
            : "התחום לא מתאים לעלייה או לירידה של הפונקציה.");
        }
        matchKey = item.label;
      } else if (!item.label) {
        var hits = keys.filter(function (key) {
          return !bag[key] && regionFits(item, slots[key]);
        });
        if (hits.length !== 1) {
          return bad("רשמו איזה תחום זה: חיובי או שלילי, עולה או יורד.");
        }
        matchKey = hits[0];
      } else {
        return bad("הניסוח לא מתאים לתחום שמבקשים בסעיף.");
      }
      bag[matchKey] = true;
    }
    progress.regions[task.id] = bag;
    var missing = keys.filter(function (key) { return !bag[key]; });
    if (!missing.length) {
      progress.done[task.id] = true;
      progress.phase[task.id] = "done";
      return good(progress, pack, String(typed).trim(), domainDoneWhy(fn, task));
    }
    progress.phase[task.id] = "partial";
    var ask = task.kind === "fnSign" ? "רשמו גם את התחום השני: חיוביות או שליליות." : "רשמו גם את התחום השני: עלייה או ירידה.";
    return good(progress, pack, String(typed).trim(), "נכון. " + ask);
  }

  var DOMAIN_NAME = {
    pos: "תחומי החיוביות",
    neg: "תחומי השליליות",
    inc: "תחומי העלייה",
    dec: "תחומי הירידה",
  };

  var DOMAIN_SHOW = {
    pos: "חיובי",
    neg: "שלילי",
    inc: "עולה",
    dec: "יורדת",
  };

  function domainDoneWhy(fn, task) {
    var M = model();
    if (task.kind === "fnMono") {
      if (fn.degree >= 2) {
        var v = M.vertex(fn);
        var x = v ? M.fmt(v.x) : "";
        if (fn.a > 0) return "a > 0, הפרבולה נפתחת כלפי מעלה. משמאל ל־x = " + x + " הפונקציה יורדת, ומימינו היא עולה.";
        return "a < 0, הפרבולה נפתחת כלפי מטה. משמאל ל־x = " + x + " הפונקציה עולה, ומימינו היא יורדת.";
      }
      var trend = M.trendOf(fn);
      if (trend === "inc") return "השיפוע חיובי, ולכן הפונקציה עולה לכל x.";
      if (trend === "dec") return "השיפוע שלילי, ולכן הפונקציה יורדת לכל x.";
      return "פונקציה קבועה אינה עולה ואינה יורדת.";
    }
    if (!(fn.roots || []).length) {
      var above = fn.degree >= 2 ? fn.a > 0 : M.evalAt(fn, 0) > 0;
      return above
        ? "אין נקודת אפס, והגרף כולו מעל ציר ה־x, ולכן הפונקציה חיובית לכל x."
        : "אין נקודת אפס, והגרף כולו מתחת לציר ה־x, ולכן הפונקציה שלילית לכל x.";
    }
    return "נקודות האפס מחלקות את ציר ה־x. מעל הציר הפונקציה חיובית, ומתחתיו היא שלילית.";
  }

  function domainWhy(fn, task, key, list, slots) {
    var M = model();
    var want = asRegionList(slots[key]);
    if (task.kind === "fnSign" && list.some(function (region) { return region.inclusive; })) {
      return "החיוביות והשליליות הן f(x) > 0 ו־f(x) < 0. נקודת האפס עצמה לא נכללת, אז בלי ≤ או ≥.";
    }
    if (M.sameRegionSet(list, want)) return null;
    var other = key === "pos" ? "neg" : key === "neg" ? "pos" : key === "inc" ? "dec" : "inc";
    if (slots[other] && M.sameRegionSet(list, asRegionList(slots[other]))) {
      return task.kind === "fnSign"
        ? "החלפתם בין חיוביות לשליליות. בדקו איפה הגרף מעל ציר ה־x ואיפה מתחתיו."
        : "החלפתם בין עלייה לירידה. בדקו את כיוון הפתיחה של הפרבולה.";
    }
    var vertex = M.vertex(fn);
    if (vertex && list.some(function (region) {
      return M.near(region.from, vertex.y) || M.near(region.to, vertex.y);
    }) && !M.near(vertex.x, vertex.y)) {
      return "התחומים נכתבים לפי שיעור ה־x, לא לפי שיעור ה־y.";
    }
    if (task.kind === "fnMono" && vertex && (fn.roots || []).length && list.some(function (region) {
      return (fn.roots || []).some(function (root) {
        return M.near(region.from, root) || M.near(region.to, root);
      });
    }) && !list.some(function (region) {
      return M.near(region.from, vertex.x) || M.near(region.to, vertex.x);
    })) {
      return "תחומי העלייה והירידה נחתכים ב־x של הקודקוד, לא בנקודת האפס.";
    }
    if (want.length === 1 && list.length === 1 && !list[0].all && !want[0].all) {
      var flipped = M.near(list[0].from, want[0].to) && M.near(list[0].to, want[0].from);
      var swappedEnds = (list[0].from === "-inf" && want[0].to === "inf" && M.near(list[0].to, want[0].from))
        || (list[0].to === "inf" && want[0].from === "-inf" && M.near(list[0].from, want[0].to));
      if (flipped || swappedEnds) return "המספר נכון, אבל סימן האי־שוויון הפוך.";
    }
    if (want.length > 1 && list.length && list.length < want.length && list.every(function (got) {
      return want.some(function (region) {
        return region.from === got.from && region.to === got.to || (M.near(region.from, got.from) && M.near(region.to, got.to));
      });
    })) {
      return "חסר אחד מהתחומים. אם יש שני תחומים, חברו אותם עם או.";
    }
    return DOMAIN_NAME[key] + " לא מתאימים לפונקציה.";
  }

  function checkDomainFields(pack, progress, fields) {
    var next = cloneProgress(progress);
    var task = currentTask(pack, next);
    if (task && task.kind === "fnBoth") {
      var bothText = String((fields || {}).both || "").trim();
      if (!bothText) return bad("רשמו את התחום שבו שני התנאים מתקיימים יחד.");
      return checkBoth(pack, next, task, bothText);
    }
    if (!task || (task.kind !== "fnSign" && task.kind !== "fnMono")) {
      return bad("עכשיו לא רושמים תחומים.");
    }
    var M = model();
    var fn = pack.fn;
    if (task.kind === "fnSign" && fn.roots.length && !next.rootKnown) {
      return bad("קודם מצאו את נקודת האפס: פתרו את המשוואה " + M.zeroEquation(fn) + ".");
    }
    fields = fields || {};
    var joined = ["pos", "neg", "inc", "dec"].map(function (key) {
      return String(fields[key] || "").trim();
    }).filter(Boolean).join(" ");
    if (task.kind === "fnMono" && M.trendOf(fn) === "flat" && M.isFlatPhrase(joined)) {
      next.regions[task.id] = { inc: true, dec: true };
      next.done[task.id] = true;
      next.phase[task.id] = "done";
      return good(next, pack, "אינה עולה ואינה יורדת", "נכון. פונקציה קבועה אינה עולה ואינה יורדת.");
    }
    var slots = domainSlots(task, fn);
    var keys = slotKeys(slots);
    var shows = [];
    var i;
    for (i = 0; i < keys.length; i++) {
      var key = keys[i];
      var text = String(fields[key] || "").trim();
      if (!text) return bad("מלאו את " + DOMAIN_NAME[key] + ".");
      var list = M.parseRegionList(text);
      if (!list) return bad("ב" + DOMAIN_NAME[key] + " רשמו תחום, למשל x > 3, x < 2 או x > 6, כל x, או אין.");
      var why = domainWhy(fn, task, key, list, slots);
      if (why) return bad(why);
      shows.push(DOMAIN_SHOW[key] + ": " + text);
    }
    var bag = {};
    keys.forEach(function (key) { bag[key] = true; });
    next.regions[task.id] = bag;
    next.done[task.id] = true;
    next.phase[task.id] = "done";
    return good(next, pack, shows.join(", "), domainDoneWhy(fn, task));
  }

  function regionFits(item, region) {
    var M = model();
    var want = asRegionList(region);
    var got = item && item.intervals ? item.intervals : [];
    if ((!item || !item.intervals) && item && item.interval && item.interval.empty) got = [];
    else if ((!item || !item.intervals) && item && item.interval) got = [item.interval];
    return M.sameRegionSet(got, want);
  }

  function onAnswer(fn, task) {
    return model().near(model().evalAt(fn, task.x), task.y);
  }

  function claimAnswer(fn, task) {
    if (task.quant === "infinite") {
      if (fn.degree > 0) return false;
      return model().near(model().evalAt(fn, 0), Number(task.value));
    }
    return false;
  }

  function checkOn(pack, progress, task, typed) {
    var M = model();
    var fn = pack.fn;
    var phase = progress.phase[task.id] || "";
    var yn = M.parseYesNo(typed);
    if (yn != null) {
      if (phase !== "value") return bad("קודם הציבו את x בפונקציה וחשבו את f(" + M.fmt(task.x) + ").");
      var want = onAnswer(fn, task);
      if (yn !== want) return bad(want ? "לפי החישוב הנקודה כן על הגרף." : "לפי החישוב הנקודה לא על הגרף.");
      progress.done[task.id] = true;
      progress.phase[task.id] = "done";
      return good(progress, pack, yn ? "כן" : "לא", yn
        ? "f(x) שווה לשיעור ה־y של הנקודה, ולכן היא על הגרף."
        : "f(x) אינו שווה לשיעור ה־y של הנקודה, ולכן היא אינה על הגרף.");
    }
    var call = asFnCall(typed, task.x);
    if (!call || call.arg === "x" || !M.near(Number(call.arg), Number(task.x))) {
      return bad("הציבו: f(" + M.fmt(task.x) + ") = …");
    }
    var step = plugStep(fn, task.x, call.rhs);
    if (!step.ok) return step;
    progress.phase[task.id] = step.stage === "value" ? "value" : "plug";
    var msg = step.stage === "value" ? "נכון. ענו כן או לא: האם הנקודה על הגרף?" : "נכון. עכשיו חשבו.";
    return good(progress, pack, step.show, msg);
  }

  function checkClaim(pack, progress, task, typed) {
    var yn = model().parseYesNo(typed);
    if (yn == null) return bad("ענו כן או לא.");
    var want = claimAnswer(pack.fn, task);
    if (yn !== want) return bad(want ? "הטענה נכונה." : "הטענה אינה נכונה.");
    progress.done[task.id] = true;
    progress.phase[task.id] = "done";
    return good(progress, pack, yn ? "כן" : "לא", yn ? "הטענה מתאימה לפונקציה." : "הטענה אינה מתאימה לפונקציה.");
  }

  function quadApi() {
    return global.DoctematicaQuadratic;
  }

  function normMath(s) {
    return String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/²/g, "^2")
      .replace(/[×·]/g, "*")
      .replace(/₁/g, "1")
      .replace(/₂/g, "2")
      .replace(/\s+/g, "");
  }

  function rootNum(r) {
    if (r && typeof r === "object" && r.d) return r.n / r.d;
    return Number(r);
  }

  function shownLevelEq(level, k) {
    var M = model();
    var left = String(level.eq || "").split("=")[0];
    return M.pretty(left) + " = " + M.fmt(k);
  }

  function levelAt(fn, k, progress) {
    var Q = quadApi();
    var M = model();
    if (!Q) return null;
    var rhs = M.fmt(k).replace(/−/g, "-");
    var expr = (progress && progress.standardExpr) || fn.expr;
    var eq = expr + "=" + rhs;
    var parsed = Q.parseABC(eq);
    if (!parsed) return null;
    var analyzed = Q.analyze(parsed.a, parsed.b, parsed.c, eq);
    var roots = (analyzed.roots || []).map(rootNum);
    var disc = parsed.b * parsed.b - 4 * parsed.a * parsed.c;
    var kind = analyzed.kind;
    if (!roots.length && Math.abs(parsed.a) > 1e-9) {
      if (disc > 1e-8) {
        var s = Math.sqrt(disc);
        roots = [(-parsed.b - s) / (2 * parsed.a), (-parsed.b + s) / (2 * parsed.a)];
        roots.sort(function (p, q) { return p - q; });
        kind = "two";
      } else if (disc >= -1e-8) {
        roots = [-parsed.b / (2 * parsed.a)];
        kind = "one";
      } else kind = "none";
    }
    return {
      eq: eq,
      analyzed: analyzed,
      roots: roots,
      kind: kind,
    };
  }

  function bag(progress, key) {
    progress.got = progress.got || {};
    progress.got[key] = progress.got[key] || { roots: [], points: [], steps: [] };
    return progress.got[key];
  }

  function readRootNumbers(typed) {
    var M = model();
    var out = [];
    var re = /x[₁₂12]?\s*=\s*([^,;]+?)(?=,|;|$)/gi;
    var m;
    var text = normMath(typed).replace(/x1/g, "x=").replace(/x2/g, "x=");
    if (!/^x=/i.test(text) && text.indexOf("x=") < 0) return out;
    var raw = String(typed || "").replace(/[−–—]/g, "-").replace(/₁/g, "1").replace(/₂/g, "2");
    while ((m = re.exec(raw))) {
      var chunk = m[1];
      var parts = chunk.split("=");
      var n = M.evalNumeric(parts[parts.length - 1]);
      if (n != null) out.push(n);
    }
    return out;
  }

  function readPairs(typed) {
    var M = model();
    var out = [];
    var re = /\(\s*([^,()]+)\s*[,;]\s*([^()]+)\s*\)/g;
    var m;
    var raw = String(typed || "");
    while ((m = re.exec(raw))) {
      var x = M.evalNumeric(m[1]);
      var y = M.evalNumeric(m[2]);
      if (x == null || y == null) {
        var pt = readPoint("(" + m[1] + "," + m[2] + ")");
        if (!pt) continue;
        x = pt.x;
        y = pt.y;
      }
      out.push({ x: x, y: y });
    }
    if (!out.length) {
      var one = readPoint(typed);
      if (one) out.push(one);
    }
    return out;
  }

  function rememberRoot(store, level, value) {
    var M = model();
    var hit = level.roots.filter(function (r) { return M.near(r, value); })[0];
    if (hit == null) return false;
    if (!store.roots.some(function (r) { return M.near(r, hit); })) store.roots.push(hit);
    return true;
  }

  function matchFormulaStep(level, store, text) {
    var steps = (level.analyzed && level.analyzed.steps) || [];
    var n = normMath(text);
    var i;
    for (i = 0; i < steps.length; i++) {
      if (normMath(steps[i]) !== n) continue;
      if (store.steps.indexOf(n) < 0) store.steps.push(n);
      readRootNumbers(steps[i]).forEach(function (num) { rememberRoot(store, level, num); });
      var done = level.roots.length && store.roots.length >= level.roots.length;
      var shown = model().pretty(String(text).replace(/\s+/g, ""));
      if (/^a=/i.test(n) && level.analyzed) {
        shown = "a = " + level.analyzed.a + ", b = " + level.analyzed.b + ", c = " + level.analyzed.c;
      }
      return { ok: true, stage: done ? "roots" : "eq", show: shown };
    }
    var Q = quadApi();
    var abc = String(text || "").match(/a\s*=\s*([^,]+)[,;]\s*b\s*=\s*([^,]+)[,;]\s*c\s*=\s*([^,]+)/i);
    if (abc && Q && Q.checkAbc) {
      var checked = Q.checkAbc(level.analyzed, abc[1], abc[2], abc[3]);
      if (!checked.ok) return checked;
      if (store.steps.indexOf(n) < 0) store.steps.push(n);
      return { ok: true, stage: "eq", show: "a = " + level.analyzed.a + ", b = " + level.analyzed.b + ", c = " + level.analyzed.c };
    }
    return null;
  }

  function quadAdvance(fn, progress, key, k, typed) {
    var M = model();
    var Q = quadApi();
    var level = levelAt(fn, k, progress);
    if (!level || !Q) return bad("לא הצלחתי לקרוא את המשוואה.");
    var store = bag(progress, key);
    var text = String(typed || "").trim();
    if (level.kind === "none" && /אין/.test(text)) {
      progress.rootKnown = true;
      return { ok: true, stage: "none", show: "אין פתרון ממשי" };
    }
    var plusMinus = String(text).match(/x\s*=\s*±\s*([0-9./()−-]+)/i);
    if (plusMinus && level.kind !== "none") {
      var mag = M.evalNumeric(plusMinus[1]);
      if (mag != null) {
        if (!rememberRoot(store, level, mag) || !rememberRoot(store, level, -mag)) {
          return bad("הפתרון לא מתאים למשוואה.");
        }
        progress.eq[key] = progress.eq[key] || level.eq;
        if (store.roots.length >= level.roots.length) {
          progress.rootKnown = true;
          return {
            ok: true,
            stage: "roots",
            show: level.roots.map(function (r) { return "x = " + M.fmt(r); }).join(", "),
          };
        }
      }
    }
    var nums = readRootNumbers(text);
    if (nums.length && !/a\s*=/.test(text) && !/±/.test(text)) {
      var i;
      for (i = 0; i < nums.length; i++) {
        if (!rememberRoot(store, level, nums[i])) {
          var signMsg = productSignMessage(fn, nums[i]);
          if (signMsg) return bad(signMsg);
          return bad("הפתרון לא מתאים למשוואה.");
        }
      }
      progress.eq[key] = progress.eq[key] || level.eq;
      if (store.steps.indexOf(normMath(text)) < 0) store.steps.push(normMath(text));
      if (store.roots.length >= level.roots.length) {
        progress.rootKnown = true;
        return {
          ok: true,
          stage: "roots",
          show: level.roots.map(function (r) { return "x = " + M.fmt(r); }).join(", "),
        };
      }
      return { ok: true, stage: "eq", show: "x = " + M.fmt(nums[nums.length - 1]), message: "נכון. יש עוד פתרון." };
    }
    if (Math.abs(Number(k)) > 1e-9 && productFactorHit(fn, text)) {
      return bad("כלל «מכפלה שווה לאפס» תקף רק כאשר המכפלה עצמה שווה לאפס.");
    }
    var acceptedFactor = productStep(fn, progress, key, k, text, store);
    if (acceptedFactor) {
      progress.eq[key] = progress.eq[key] || level.eq;
      return acceptedFactor;
    }
    if (!progress.eq[key]) {
      var height = Math.abs(Number(k)) > 1e-9;
      var call = M.parseFnCall(text);
      if (call && call.arg === "x") {
        var rhs = M.evalNumeric(call.rhs);
        if (rhs != null && M.near(rhs, k)) {
          progress.eq[key] = level.eq;
          return { ok: true, stage: "eq", show: shownLevelEq(level, k) };
        }
      }
      var yLine = M.parseYValue(text);
      if (yLine) {
        var yNum = M.evalNumeric(yLine.rhs);
        if (yNum != null && M.near(yNum, k)) {
          progress.eq[key] = level.eq;
          if (height) return { ok: true, stage: "eq", show: shownLevelEq(level, k) };
          return { ok: true, stage: "setup", show: "y = " + M.fmt(k) };
        }
      }
      var parsed = Q.parseABC(M.ascii(text));
      var target = Q.parseABC(level.eq);
      if (parsed && target && Q.abcEquivalent(parsed, target)) {
        progress.eq[key] = M.ascii(text);
        return { ok: true, stage: "eq", show: shownLevelEq(level, k) };
      }
      return bad("רשמו את המשוואה " + (Math.abs(Number(k)) > 1e-9 ? shownLevelEq(level, k) : M.pretty(level.eq)) + ".");
    }
    var formula = matchFormulaStep(formulaLevelOf(Q, level, progress.eq && progress.eq[key]), store, text);
    if (formula) {
      if (formula.ok === false) return formula;
      if (formula.stage === "roots") progress.rootKnown = true;
      return formula;
    }
    var pack = null;
    try {
      pack = Q.analyzeMixedStart(level.eq);
    } catch (err) {
      pack = null;
    }
    if (pack) {
      var stepped = Q.checkMixedTyped(progress.eq[key], M.ascii(text), pack);
      if (stepped && stepped.ok) {
        progress.eq[key] = M.ascii(text);
        return { ok: true, stage: "eq", show: M.pretty(M.ascii(text)), message: stepped.message || "נכון. המשיכו לפתור." };
      }
      if (stepped && stepped.message) return bad(stepped.message);
    }
    return bad("המשיכו לפתור את המשוואה הריבועית.");
  }

  function nextQuadLine(fn, progress, key, k) {
    var M = model();
    var Q = quadApi();
    var level = levelAt(fn, k, progress);
    if (!level) return null;
    if (!progress.eq || !progress.eq[key]) return String(level.eq).replace("=", " = ");
    if (!level.roots.length && progress.rootKnown) return null;
    var known = bag(progress, key);
    if (level.roots.length && known.roots.length >= level.roots.length) return null;
    if (Math.abs(Number(k)) < 1e-9 && productStillOpen(fn, progress, key)) {
      var prodLine = nextProductLine(fn, progress, key);
      if (prodLine) return prodLine;
    }
    var pack = null;
    try {
      pack = Q.analyzeMixedStart(level.eq);
    } catch (err) {
      pack = null;
    }
    if (pack) {
      var mixed = Q.nextMixedStep(progress.eq[key], pack) || {};
      if (
        mixed.eq &&
        normMath(mixed.eq) !== normMath(progress.eq[key]) &&
        !coeffsNegated(Q, progress.eq[key], mixed.eq)
      ) {
        return mixed.eq;
      }
    }
    var steps = formulaStepsOf(Q, progress.eq[key], level);
    var store = bag(progress, key);
    var i;
    for (i = 0; i < steps.length; i++) {
      if (store.steps.indexOf(normMath(steps[i])) < 0) return steps[i];
    }
    var missing = level.roots.filter(function (r) {
      return !store.roots.some(function (g) { return M.near(g, r); });
    });
    if (missing.length) return "x=" + M.fmt(missing[0]).replace(/−/g, "-");
    if (level.kind === "none") return "אין פתרון ממשי";
    return null;
  }

  function takePoints(progress, key, level, k, pairs) {
    var M = model();
    var store = bag(progress, key);
    var i;
    for (i = 0; i < pairs.length; i++) {
      var pt = pairs[i];
      if (!M.near(pt.y, k)) return bad("שיעור ה־y של הנקודה צריך להיות " + M.fmt(k) + ".");
      var hit = level.roots.filter(function (r) { return M.near(r, pt.x); })[0];
      if (hit == null) return bad("הנקודה אינה על הגרף בגובה הזה.");
      if (store.points.some(function (x) { return M.near(x, hit); })) return bad("את הנקודה הזו כבר רשמתם.");
      store.points.push(hit);
      rememberRoot(store, level, hit);
    }
    progress.rootKnown = store.roots.length >= level.roots.length;
    var show = pairs.map(function (pt) { return pairText(pt.x, pt.y); }).join(", ");
    if (store.points.length >= level.roots.length) return { ok: true, stage: "done", show: show };
    return { ok: true, stage: "points", show: show, message: "נכון. רשמו גם את הנקודה השנייה." };
  }

  function checkSolve(pack, progress, task, typed, opts) {
    opts = opts || {};
    var M = model();
    var k = opts.k != null ? Number(opts.k) : Number(task.k);
    var needPoints = opts.points != null ? opts.points : !!task.points;
    var key = opts.key || task.id;
    var level = levelAt(pack.fn, k, progress);
    if (!level) return bad("לא הצלחתי לקרוא את המשוואה.");
    var pairs = readPairs(typed);
    if (pairs.length && needPoints) {
      var taken = takePoints(progress, key, level, k, pairs);
      if (!taken.ok) return taken;
      if (taken.stage === "done" && !opts.keepOpen) {
        progress.done[task.id] = true;
        progress.phase[task.id] = "done";
        progress.rootKnown = true;
        return good(progress, pack, taken.show, M.near0(k) ? "על ציר ה־x מתקיים y = 0." : "אלה הנקודות על הגרף בגובה y = " + M.fmt(k) + ".");
      }
      progress.phase[task.id] = "points";
      return good(progress, pack, taken.show, taken.message || "נכון.");
    }
    var adv = quadAdvance(pack.fn, progress, key, k, typed);
    if (!adv.ok) return adv;
    if ((adv.stage === "roots" || adv.stage === "none") && !opts.keepOpen) {
      if (!needPoints || adv.stage === "none" || !level.roots.length) {
        progress.done[task.id] = true;
        progress.phase[task.id] = "done";
        return good(progress, pack, adv.show, adv.message || "נכון.");
      }
      progress.phase[task.id] = "points";
      return good(progress, pack, adv.show, "נכון. רשמו את הנקודות על הגרף, (" + "x" + ", " + model().fmt(k) + ").");
    }
    if (adv.stage === "roots" || adv.stage === "none") {
      progress.phase[task.id] = adv.stage;
      return good(progress, pack, adv.show, adv.message || "נכון.");
    }
    progress.phase[task.id] = adv.stage === "setup" ? "setup" : "eq";
    return good(progress, pack, adv.show, adv.message || "נכון. המשיכו לפתור.");
  }

  function coeffsNegated(Q, fromEq, toEq) {
    var left = Q.parseABC(fromEq);
    var right = Q.parseABC(toEq);
    if (!left || !right || Math.abs(left.a) < 1e-9) return false;
    return Math.abs(left.a + right.a) < 1e-6 && Math.abs(left.b + right.b) < 1e-6 && Math.abs(left.c + right.c) < 1e-6;
  }

  function formulaStepsOf(Q, eqText, level) {
    var steps = (level.analyzed && level.analyzed.steps) || [];
    if (!eqText) return steps;
    var parsed = Q.parseABC(eqText);
    if (!parsed || Math.abs(parsed.a) < 1e-9) return steps;
    try {
      var live = Q.analyze(parsed.a, parsed.b, parsed.c, eqText);
      return (live && live.steps) || steps;
    } catch (err) {
      return steps;
    }
  }

  function formulaLevelOf(Q, level, eqText) {
    if (!eqText) return level;
    var parsed = Q.parseABC(eqText);
    if (!parsed || Math.abs(parsed.a) < 1e-9) return level;
    try {
      var live = Q.analyze(parsed.a, parsed.b, parsed.c, eqText);
      return {
        eq: eqText,
        analyzed: live,
        roots: level.roots,
        kind: (live && live.kind) || level.kind,
      };
    } catch (err2) {
      return level;
    }
  }

  function needsExpand(fn) {
    return /[()]/.test(String(fn && fn.expr || ""));
  }

  function readableVertex(expr) {
    var M = model();
    var s = M.ascii(expr).replace(/\s+/g, "");
    s = s.replace(/^(?:y|f\(x\))=/, "");
    var m = s.match(/^([+-])?(\d+\/\d+|\d+(?:\.\d+)?)?(?:\(x([+-](?:\d+\/\d+|\d+(?:\.\d+)?))\)\^2|x\^2)([+-](?:\d+\/\d+|\d+(?:\.\d+)?))?$/);
    if (!m) return null;
    var coef = m[2] ? (m[1] || "") + m[2] : m[1] === "-" ? "-1" : "1";
    var a = M.evalNumeric(coef);
    if (a == null || M.near0(a)) return null;
    var h = 0;
    if (m[3]) {
      var inside = M.evalNumeric(m[3]);
      if (inside == null) return null;
      h = -inside;
    }
    var k = 0;
    if (m[4]) {
      k = M.evalNumeric(m[4]);
      if (k == null) return null;
    }
    return { x: h, y: k };
  }

  function vertexReadable(fn) {
    var seen = readableVertex(fn && fn.expr);
    if (!seen) return null;
    var v = model().vertex(fn);
    if (!v || !model().near(seen.x, v.x) || !model().near(seen.y, v.y)) return null;
    return seen;
  }

  function formReady(fn, progress) {
    return !needsExpand(fn) || !!(progress && progress.standard);
  }

  function currentExpr(fn, progress) {
    return (progress && progress.workExpr) || (fn && fn.expr) || "";
  }

  function markStandard(progress, expr) {
    progress.standard = true;
    progress.workExpr = null;
    if (expr && !/[()]/.test(expr)) progress.standardExpr = expr;
  }

  function expandDiagnosis(rhs, fn) {
    var Q = quadApi();
    var M = model();
    if (!Q || !Q.parseABC) return "הפתיחה לא שקולה. בדקו את הסימנים.";
    var got = null;
    try { got = Q.parseABC(M.ascii(rhs) + "=0"); } catch (err) { got = null; }
    if (!got) {
      var stepped = null;
      try { stepped = Q.checkMixedTyped(fn.expr + "=0", M.ascii(rhs) + "=0"); } catch (err2) { stepped = null; }
      return (stepped && stepped.message) || "הפתיחה לא שקולה. בדקו את הסימנים.";
    }
    if (Q.abcEquivalent(got, { a: fn.a, b: fn.b, c: fn.c })) return null;
    if (M.near(got.a, fn.a) && M.near(got.c, fn.c) && M.near(got.b, -fn.b) && !M.near0(fn.b)) {
      return "שימו לב לסימן של האיבר עם x. המינוס שמחוץ לסוגריים הופך את הסימן של כל איבר.";
    }
    if (M.near0(got.b) && !M.near0(fn.b)) {
      return "נשמט האיבר האמצעי. בריבוע של סכום או הפרש יש גם איבר עם x, לא רק x² ומספר.";
    }
    if (M.near(got.a, fn.a) && M.near(got.b, -fn.b)) {
      return "המינוס שמחוץ לסוגריים לא הופעל על כל האיברים.";
    }
    var again = null;
    try { again = Q.checkMixedTyped(fn.expr + "=0", M.ascii(rhs) + "=0"); } catch (err3) { again = null; }
    return (again && again.ok === false && again.message) || "הפתיחה לא שקולה. בדקו את הסימנים.";
  }

  function checkExpand(pack, progress, typed) {
    var M = model();
    var Q = quadApi();
    var fn = pack.fn;
    var cur = currentExpr(fn, progress);
    var ascii = M.ascii(typed);
    var rhs = ascii;
    var sides = ascii.match(/^(.+)=(.+)$/);
    if (sides) rhs = sides[2];
    if (rhs === M.ascii(cur)) return bad("זו אותה צורה. פתחו את הסוגריים.");
    var diagnosis = expandDiagnosis(rhs, fn);
    if (diagnosis) return bad(diagnosis);
    var nextLeft = cur;
    try { nextLeft = String(Q.expandParensEq(cur + "=0") || "").split("=")[0] || cur; } catch (err) { nextLeft = cur; }
    var keep = /[()]/.test(rhs) || stillSimplifying(rhs);
    if (keep) {
      progress.workExpr = rhs;
      progress.standard = false;
    } else {
      markStandard(progress, rhs);
    }
    var reason = "פותחים את הסוגריים.";
    if (/[()]/.test(cur) && !/[()]/.test(rhs)) reason = "מפזרים את המקדם על כל איבר, ומגיעים לצורה ax²+bx+c.";
    else if (!/[()]/.test(cur)) reason = "אוספים איברים דומים.";
    return { ok: true, stage: "expand", show: M.pretty(cur) + " = " + M.pretty(rhs), message: reason, expr: rhs, keep: keep, nextLeft: nextLeft };
  }

  function gcdInt(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }

  function valueStillOpen(expr) {
    var t = model().ascii(String(expr || "").split("=")[0]);
    if (!t) return false;
    if (/[a-z]/i.test(t)) return true;
    if (/[()]/.test(t)) return true;
    if (/[+-]{2,}/.test(t)) return true;
    if (/[*+]/.test(t)) return true;
    var frac = t.match(/^([+-]?\d+)\/([+-]?\d+)$/);
    if (!frac) return /\//.test(t);
    var n = Math.abs(Number(frac[1]));
    var d = Math.abs(Number(frac[2]));
    if (!d) return true;
    if (n % d === 0) return true;
    return gcdInt(n, d) > 1;
  }

  function openXMessage(expr) {
    var t = model().ascii(expr);
    if (/^[+-]{2,}/.test(t) || /-\(/.test(t)) return "פשטו את הסימנים. אחר כך חשבו את הערך.";
    if (/\//.test(t) && !/[a-z()]/i.test(t)) {
      var frac = t.match(/^([+-]?\d+)\/([+-]?\d+)$/);
      if (frac && Math.abs(Number(frac[2])) && Math.abs(Number(frac[1])) % Math.abs(Number(frac[2])) !== 0) return "צמצמו את השבר.";
      return "השבר עוד לא חושב. חשבו את החילוק.";
    }
    return "כעת חשבו את הערך.";
  }

  function vertexXMistake(fn, expr) {
    var M = model();
    var body = M.ascii(expr).split("=")[0];
    var val = M.evalNumeric(body);
    var a = fn.a;
    var b = fn.b;
    var c = fn.c;
    var v = M.vertex(fn);
    var dropped = body.match(/^-\((\d+)\)\/\(2\*/);
    if (dropped && b < 0 && M.near(Number(dropped[1]), Math.abs(b)) && (val == null || !M.near(val, v.x))) {
      return "שימו לב: המקדם b כולל גם את הסימן של האיבר bx.";
    }
    if (/^b\/\(2\*?a\)$/.test(body) || /^b\/2a$/.test(body)) return "בנוסחה יש מינוס לפני b: x = −b/(2a).";
    if (/^-b\/2$/.test(body)) return "מחלקים ב־2a, לא רק ב־2.";
    if (val == null || !v) return null;
    if (!M.near(Math.abs(a), 1) && M.near(val, -b / 2) && !M.near(val, v.x)) return "מחלקים ב־2a, לא רק ב־2.";
    if (!M.near(c, b) && M.near(val, -c / (2 * a)) && !M.near(val, v.x)) return "במונה מציבים את b, לא את c. c הוא המספר החופשי.";
    if (!M.near0(c) && !M.near(c, a) && M.near(val, -b / (2 * c)) && !M.near(val, v.x)) return "במכנה מציבים 2a. a הוא המקדם של x².";
    if (M.near(val, b / (2 * a)) && !M.near(val, v.x)) return "בנוסחה יש מינוס לפני b: x = −b/(2a).";
    return null;
  }

  function acceptCoefficients(pack, progress, task, text) {
    var Q = quadApi();
    var M = model();
    var fn = pack.fn;
    var abc = String(text || "").match(/a\s*=\s*([^,;]+)[,;]\s*b\s*=\s*([^,;]+)[,;]\s*c\s*=\s*([^,;]+)/i);
    if (!abc || !Q || !Q.checkAbc) return null;
    var checked = Q.checkAbc({ a: fn.a, b: fn.b, c: fn.c }, abc[1], abc[2], abc[3]);
    if (!checked.ok) {
      var a = Q.parseCoeff ? Q.parseCoeff(abc[1]) : M.evalNumeric(abc[1]);
      var b = Q.parseCoeff ? Q.parseCoeff(abc[2]) : M.evalNumeric(abc[2]);
      var c = Q.parseCoeff ? Q.parseCoeff(abc[3]) : M.evalNumeric(abc[3]);
      if (a != null && c != null && b != null && M.near(a, fn.a) && M.near(c, fn.c) && M.near(b, -fn.b)) {
        return bad("שימו לב: המקדם b כולל גם את הסימן של האיבר bx.");
      }
      if (b != null && M.near(b, fn.c) && !M.near(fn.b, fn.c)) return bad("b הוא המקדם של x, לא המספר החופשי.");
      if (a != null && M.near(a, fn.c) && !M.near(fn.a, fn.c)) return bad("a הוא המקדם של x², לא המספר החופשי.");
      return checked.ok === false ? checked : bad(checked.message || "בדקו את המקדמים, כולל הסימן.");
    }
    markStandard(progress, progress.workExpr || fn.expr);
    progress.phase[task.id] = "abc";
    var show = "a = " + M.fmtMatch(fn.a, fn.expr) + ", b = " + M.fmtMatch(fn.b, fn.expr) + ", c = " + M.fmtMatch(fn.c, fn.expr);
    return good(progress, pack, show, "a הוא המקדם של x², b של x, ו־c המספר החופשי — כולל הסימן.");
  }

  function checkVertex(pack, progress, task, typed) {
    var M = model();
    var fn = pack.fn;
    var v = M.vertex(fn);
    if (!v) return bad("לפונקציה הזו אין קודקוד של פרבולה.");
    var phase = progress.phase[task.id] || "";
    var want = task.want || "point";
    var text = String(typed || "").trim();
    var ascii = M.ascii(text);
    if (task.classify && /מינימום|מקסימום/.test(text)) {
      if (phase !== "point" && phase !== "kind") return bad("קודם רשמו את הקודקוד כזוג סדור.");
      var wantKind = fn.a > 0 ? "min" : "max";
      var gotKind = /מקסימום/.test(text) ? "max" : "min";
      if (gotKind !== wantKind) {
        return bad("הנקודה נכונה, אבל זו לא נקודת " + (gotKind === "min" ? "מינימום" : "מקסימום") + ". בדקו את הסימן של a, המקדם של x².");
      }
      progress.vertexKind = wantKind;
      progress.done[task.id] = true;
      progress.phase[task.id] = "done";
      var kindText = wantKind === "min" ? "מינימום" : "מקסימום";
      var kindWhy = fn.a > 0
        ? "a > 0, הפרבולה נפתחת כלפי מעלה, ולכן זו נקודת מינימום."
        : "a < 0, הפרבולה נפתחת כלפי מטה, ולכן זו נקודת מקסימום.";
      return good(progress, pack, kindText, kindWhy);
    }
    if (want === "value" && progress.vertexY != null && M.near(Number(progress.vertexY), v.y) && !phase) {
      var yOnly = ascii.match(/^y=(.+)$/i);
      var directExpr = yOnly ? yOnly[1] : (!/[a-z=]/i.test(ascii) ? ascii : "");
      if (directExpr && !valueStillOpen(directExpr)) {
        var directVal = M.evalNumeric(directExpr);
        if (directVal != null && M.near(directVal, v.y)) {
          progress.done[task.id] = true;
          progress.phase[task.id] = "done";
          progress.vertexY = v.y;
          var directShown = M.asWritten(directExpr, v.y) || M.fmt(v.y);
          var directWhy = fn.a > 0
            ? "זה שיעור ה־y של הקודקוד שמצאתם, ולכן זה הערך המינימלי."
            : "זה שיעור ה־y של הקודקוד שמצאתם, ולכן זה הערך המקסימלי.";
          return good(progress, pack, directShown, directWhy);
        }
        if (directVal != null) {
          return bad(fn.a > 0
            ? "הערך המינימלי הוא שיעור ה־y של הקודקוד שכבר מצאתם."
            : "הערך המקסימלי הוא שיעור ה־y של הקודקוד שכבר מצאתם.");
        }
      }
    }
    var coeffs = acceptCoefficients(pack, progress, task, text);
    if (coeffs) return coeffs;
    if (!formReady(fn, progress) && /[=()]/.test(ascii) && !/^x=/.test(ascii) && !/^a=/.test(ascii) && !(vertexReadable(fn) && readPoint(text))) {
      var expanded = checkExpand(pack, progress, text);
      if (!expanded.ok) return expanded;
      progress.phase[task.id] = expanded.keep ? "expand" : "";
      return good(progress, pack, expanded.show, expanded.message);
    }
    if (/^x=-b\/\(2\*?a\)$/i.test(ascii) || /^x=-b\/2a$/i.test(ascii)) {
      progress.phase[task.id] = "formula";
      markStandard(progress, progress.standardExpr || fn.expr);
      return good(progress, pack, "x = −b/(2a)", "שיעור ה־x של הקודקוד הוא −b/(2a). כעת הציבו את a ואת b.");
    }
    var xLine = ascii.match(/^x=(.+)$/i);
    var xBody = null;
    if (xLine && phase !== "value" && phase !== "plug" && phase !== "point" && phase !== "kind" && want !== "value-only") {
      xBody = xLine[1];
    } else if (!xLine && (phase === "plugx" || phase === "formula") && !/[a-z]/i.test(ascii) && M.evalNumeric(ascii) != null) {
      xBody = ascii;
    }
    if (xBody != null) {
      var xExpr = xBody.split("=")[0];
      var xv = M.evalNumeric(xExpr);
      if (xv == null || !M.near(xv, v.x)) {
        var pieces = xBody.split("=");
        if (pieces.length > 1) {
          var leftVal = M.evalNumeric(pieces[0]);
          var rightVal = M.evalNumeric(pieces[pieces.length - 1]);
          if (leftVal != null && M.near(leftVal, v.x) && rightVal != null && !M.near(rightVal, leftVal)) {
            return bad("ההצבה בנוסחה נכונה, אבל החישוב שגוי. חשבו שוב.");
          }
        }
        var whyX = vertexXMistake(fn, xExpr);
        if (whyX) return bad(whyX);
        if (phase === "formula" || phase === "plugx" || phase === "abc") return bad("x של הקודקוד הוא −b/(2a). הציבו את a ואת b, כולל הסימן.");
      } else if (valueStillOpen(xExpr)) {
        progress.phase[task.id] = "plugx";
        progress.vertexXWork = M.ascii(xExpr);
        var openWhy = /[a-z]/i.test(xExpr) || /\*/.test(M.ascii(xExpr))
          ? "הצבנו את a ואת b. כעת חשבו את הערך."
          : openXMessage(xExpr);
        return good(progress, pack, "x = " + M.pretty(xExpr), openWhy);
      } else {
        progress.vertexKnown = true;
        progress.vertexX = v.x;
        progress.vertexXWork = null;
        var xSpell = M.asWritten(xExpr, v.x) || M.fmt(v.x);
        progress.vertexXText = xSpell;
        progress.phase[task.id] = "x";
        if (want === "x") return good(progress, pack, "x = " + xSpell, "זה שיעור ה־x של הקודקוד. ממנו נפרדות העלייה והירידה.");
        return good(progress, pack, "x = " + xSpell, want === "value" ? "מצאתם את x. הציבו אותו בפונקציה כדי למצוא את הערך." : "מצאתם את x. הציבו אותו בפונקציה כדי למצוא את y.");
      }
    }
    if (phase === "x" || phase === "plug" || phase === "value" || progress.vertexKnown) {
      var call = asFnCall(text, v.x);
      if (call && call.arg !== "x" && M.near(Number(call.arg), v.x)) {
        var step = plugStep(fn, v.x, call.rhs, progress.vertexXText);
        if (!step.ok) return step;
        progress.vertexKnown = true;
        progress.phase[task.id] = step.stage === "value" ? "value" : "plug";
        if (step.stage === "value") progress.vertexY = v.y;
        if (step.stage === "value" && want === "value") {
          progress.done[task.id] = true;
          progress.phase[task.id] = "done";
          return good(progress, pack, step.show, "זה ערך הפונקציה בקודקוד.");
        }
        var after = step.stage === "value"
          ? (want === "point" ? "מצאתם את y. רשמו את הקודקוד כזוג סדור." : "נכון.")
          : "ההצבה נכונה. כעת חשבו את הערך.";
        return good(progress, pack, step.show, after);
      }
      var bare = M.bareNumber(text);
      if (bare != null && M.near(bare, v.y) && (phase === "plug" || phase === "value" || phase === "x")) {
        progress.vertexY = v.y;
        progress.phase[task.id] = "value";
        if (want === "value") {
          progress.done[task.id] = true;
          progress.phase[task.id] = "done";
          return good(progress, pack, M.fnCallText(v.x, M.asWritten(text, v.y) || M.fmt(v.y), progress.vertexXText), "זה ערך הפונקציה בקודקוד.");
        }
        return good(progress, pack, M.fnCallText(v.x, M.asWritten(text, v.y) || M.fmt(v.y), progress.vertexXText), "מצאתם את y. רשמו את הקודקוד כזוג סדור.");
      }
    }
    var point = readPoint(text);
    if (point) {
      if (M.near(point.x, v.x) && !M.near(point.y, v.y)) {
        if (M.near(point.y, v.x)) return bad("מצאתם את x. שיעור ה־y מתקבל מהצבה בפונקציה, לא מאותו מספר.");
        return bad("x של הקודקוד נכון. את y מוצאים בהצבה בפונקציה.");
      }
      if (M.near(point.x, -v.x) && !M.near(v.x, 0) && !M.near(point.x, v.x)) {
        return bad("סימן ה־x של הקודקוד הפוך. חזרו לנוסחה x = −b/(2a).");
      }
      if (!M.near(point.x, v.x) || !M.near(point.y, v.y)) return bad("הזוג הסדור אינו הקודקוד.");
      progress.vertexKnown = true;
      progress.vertexX = v.x;
      progress.vertexY = v.y;
      if (want === "x") return good(progress, pack, pairText(v.x, v.y), "זה הקודקוד. שיעור ה־x שלו מפריד בין העלייה לירידה.");
      if (task.classify) {
        progress.phase[task.id] = "point";
        return good(progress, pack, (task.name ? task.name : "") + pairText(v.x, v.y), "הנקודה נכונה. לפי סימן a, קבעו אם זו נקודת מינימום או מקסימום.");
      }
      progress.done[task.id] = true;
      progress.phase[task.id] = "done";
      var named = task.name ? task.name + pairText(v.x, v.y) : pairText(v.x, v.y);
      return good(progress, pack, named, "זה הקודקוד.");
    }
    if (!formReady(fn, progress)) return bad("קודם פתחו את הסוגריים והגיעו לצורה ax²+bx+c.");
    if (!phase || phase === "expand") return bad("כדי למצוא את הקודקוד, התחילו בזיהוי המקדמים a ו־b.");
    if (phase === "abc") return bad("השתמשו בנוסחה x = −b/(2a).");
    if (phase === "formula") return bad("חשבו את x = −b/(2a).");
    if (phase === "plugx") return bad(progress.vertexXWork && /\//.test(progress.vertexXWork) && !/[a-z()]/i.test(progress.vertexXWork) ? "חשבו את החילוק, ורשמו את x כמספר." : "חשבו את הערך של x.");
    if (phase === "x" || phase === "plug") return bad(want === "value" ? "הציבו את x של הקודקוד בפונקציה." : "הציבו את x של הקודקוד, ואחר כך רשמו את הנקודה.");
    if (phase === "point") return bad("הנקודה נכונה. בדקו את הסימן של a כדי לקבוע מינימום או מקסימום.");
    return bad("רשמו את הקודקוד כזוג סדור.");
  }

  function trueClaims(fn, task) {
    var M = model();
    return (task.claims || []).filter(function (claim) {
      function val(spec) {
        if (!spec) return null;
        if (spec.op === "neg") return -M.evalAt(fn, spec.at);
        return M.evalAt(fn, spec.at);
      }
      return M.near(val(claim.left), val(claim.right));
    });
  }

  function checkChoice(pack, progress, task, typed) {
    var text = String(typed || "").trim();
    var claims = task.claims || [];
    var picked = claims.filter(function (claim) {
      if (text === String(claim.id)) return true;
      if (text === "(" + claim.id + ")") return true;
      return claim.text && text.replace(/\s+/g, "") === String(claim.text).replace(/\s+/g, "");
    })[0];
    if (!picked) return bad("בחרו את הטענה הנכונה.");
    var ok = trueClaims(pack.fn, task).some(function (claim) { return claim.id === picked.id; });
    if (!ok) return bad("הטענה הזו אינה נכונה. בדקו את שני האגפים בהצבה.");
    progress.done[task.id] = true;
    progress.phase[task.id] = "done";
    return good(progress, pack, picked.text || picked.id, "שני האגפים שווים, ולכן הטענה נכונה.");
  }

  function intersectionCount(fn, k) {
    var level = levelAt(fn, k);
    if (!level) return 0;
    if (level.kind === "none") return 0;
    return level.roots.length;
  }

  function checkCount(pack, progress, task, typed) {
    var M = model();
    var want = intersectionCount(pack.fn, task.k);
    var text = String(typed || "").replace(/\s+/g, "");
    var words = { 0: "אין", 1: "אחת", 2: "שתיים" };
    var n = M.bareNumber(typed);
    var named = words[want] && (text === words[want] || text.indexOf(words[want]) === 0);
    if ((n == null || !M.near(n, want)) && !named) {
      return bad("ענו כמה נקודות חיתוך יש, לפי השרטוט.");
    }
    progress.done[task.id] = true;
    progress.phase[task.id] = "done";
    return good(progress, pack, String(want), want === 0
      ? "הישר y = " + M.fmt(task.k) + " אינו חותך את הגרף."
      : want === 1
        ? "הישר y = " + M.fmt(task.k) + " נוגע בגרף בנקודה אחת."
        : "הישר y = " + M.fmt(task.k) + " חותך את הגרף בשתי נקודות.");
  }

  function productSpec(fn) {
    var Q = quadApi();
    if (!Q || !Q.parseProductEq || !fn || !fn.expr) return null;
    try {
      var parsed = Q.parseProductEq(String(fn.expr) + "=0");
      if (!parsed || !parsed.f1 || !parsed.f2 || !parsed.e1 || !parsed.e2) return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function productFactorHit(fn, text) {
    var prod = productSpec(fn);
    if (!prod) return false;
    var n = normMath(text);
    return n === normMath(prod.e1) || n === normMath(prod.e2);
  }

  function productSignMessage(fn, num) {
    var prod = productSpec(fn);
    if (!prod) return null;
    var M = model();
    var factors = [prod.f1, prod.f2];
    var i;
    for (i = 0; i < factors.length; i++) {
      if (!factors[i] || !factors[i].a) continue;
      var root = -factors[i].b / factors[i].a;
      if (M.near(num, root)) return null;
      if (!M.near(root, 0) && M.near(num, -root)) {
        return "כשמעבירים את המספר החופשי לאגף השני מחליפים סימן. הפתרון אינו המספר שמופיע בגורם.";
      }
    }
    return null;
  }

  function productStillOpen(fn, progress, key) {
    if (progress.standardExpr) return false;
    if (!productSpec(fn)) return false;
    var eq = progress.eq && progress.eq[key];
    if (!eq) return true;
    var left = model().ascii(String(eq).split("=")[0]);
    if (/^f\(x\)$/i.test(left)) return true;
    if (left === model().ascii(fn.expr)) return true;
    return /[()]/.test(left);
  }

  function productStep(fn, progress, key, k, text, store) {
    if (Math.abs(Number(k)) > 1e-9) return null;
    if (!productStillOpen(fn, progress, key) && progress.eq && progress.eq[key] && !productFactorHit(fn, text)) return null;
    var prod = productSpec(fn);
    if (!prod || !productFactorHit(fn, text)) return null;
    var n = normMath(text);
    if (store.steps.indexOf(n) < 0) store.steps.push(n);
    return {
      ok: true,
      stage: "eq",
      show: model().pretty(text),
      message: "מכפלה שווה לאפס רק כאשר אחד הגורמים שווה לאפס.",
    };
  }

  function nextProductLine(fn, progress, key) {
    var prod = productSpec(fn);
    if (!prod) return null;
    var M = model();
    var store = bag(progress, key);
    var factors = [prod.f1, prod.f2];
    var eqs = [prod.e1, prod.e2];
    var i;
    for (i = 0; i < factors.length; i++) {
      var root = -factors[i].b / factors[i].a;
      var have = store.roots.some(function (r) { return M.near(r, root); });
      if (have) continue;
      if (store.steps.indexOf(normMath(eqs[i])) < 0) return eqs[i];
      return "x=" + M.fmt(root).replace(/−/g, "-");
    }
    return null;
  }

  function stillSimplifying(expr) {
    var Q = quadApi();
    var M = model();
    if (!Q || !expr) return false;
    var eq = expr + "=0";
    var nxt = null;
    try {
      nxt = Q.nextMixedStep(eq, Q.analyzeMixedStart(eq));
    } catch (err) {
      return false;
    }
    if (!nxt || !nxt.eq || /^a=/i.test(nxt.eq)) return false;
    var left = String(nxt.eq).split("=")[0];
    return M.ascii(left) !== M.ascii(expr);
  }

  function finishValuePrelude(step, task, y) {
    if (!step || !step.ok || !step.progress || !step.progress.done[task.id]) return step;
    step.progress.done[task.id] = false;
    step.progress.vertexY = y;
    step.progress.phase[task.id] = "ready";
    step.solved = false;
    return step;
  }

  function condText(name, op, bound) {
    var M = model();
    var sym = { "<": "<", ">": ">", "<=": "≤", ">=": "≥", "=": "=" }[op] || op;
    return name + " " + sym + " " + M.fmt(bound);
  }

  function formatRegions(list) {
    var M = model();
    if (!list || !list.length) return "אין";
    return list.map(function (region) {
      if (region.from === "-inf" && region.to === "inf") return "כל x";
      if (region.from === "-inf") return "x < " + M.fmt(region.to).replace(/−/g, "-");
      if (region.to === "inf") return "x > " + M.fmt(region.from).replace(/−/g, "-");
      return M.fmt(region.from).replace(/−/g, "-") + " < x < " + M.fmt(region.to).replace(/−/g, "-");
    }).join(" או ");
  }

  function bothParts(fn, task) {
    var M = model();
    var trend = task.trend === "dec" ? "dec" : "inc";
    var sign = task.sign === "neg" ? "neg" : "pos";
    return {
      trend: trend,
      sign: sign,
      mono: M.monoRegions(fn).filter(function (region) { return region.trend === trend; }),
      signed: M.signRegions(fn).filter(function (region) { return region.sign === sign; }),
      both: M.intersectRegions(
        M.monoRegions(fn).filter(function (region) { return region.trend === trend; }),
        M.signRegions(fn).filter(function (region) { return region.sign === sign; })
      ),
    };
  }

  function bothPhrase(task) {
    var trend = task.trend === "dec" ? "יורדת" : "עולה";
    var sign = task.sign === "neg" ? "שלילית" : "חיובית";
    return "הפונקציה " + trend + " וגם " + sign;
  }

  function checkExtremumPick(pack, progress, task, typed) {
    var M = model();
    var fn = pack.fn;
    var v = M.vertex(fn);
    if (!v) return bad("לפונקציה הזו אין ערך קיצון.");
    var asked = task.pole === "low" ? "min" : "max";
    var kind = fn.a > 0 ? "min" : "max";
    var n = M.bareNumber(typed);
    var matched = null;
    if (n != null) {
      (task.options || []).forEach(function (opt) {
        if (M.near(Number(opt), n)) matched = Number(opt);
      });
      if (matched == null && kind === asked && M.near(n, v.y)) matched = v.y;
    }
    if (matched != null) {
      if (kind !== asked) {
        return bad(asked === "max"
          ? "הפרבולה נפתחת כלפי מעלה, ולכן יש לה ערך קטן ביותר ולא ערך גדול ביותר."
          : "הפרבולה נפתחת כלפי מטה, ולכן יש לה ערך גדול ביותר ולא ערך קטן ביותר.");
      }
      if (M.near(matched, v.x) && !M.near(v.x, v.y)) {
        return bad("זה שיעור ה־x של הקודקוד, לא ערך הפונקציה. הערך הגדול או הקטן ביותר הוא שיעור ה־y.");
      }
      if (!M.near(matched, v.y)) {
        return bad("הערך הזה אינו שיעור ה־y של הקודקוד. " + (kind === "max" ? "הערך הגדול ביותר" : "הערך הקטן ביותר") + " נמצא בקודקוד.");
      }
      progress.vertexKnown = true;
      progress.vertexX = v.x;
      progress.vertexY = v.y;
      progress.vertexKind = kind;
      progress.done[task.id] = true;
      progress.phase[task.id] = "done";
      var whyPick = kind === "max"
        ? "a < 0, הפרבולה נפתחת כלפי מטה, והערך הגדול ביותר הוא שיעור ה־y של הקודקוד."
        : "a > 0, הפרבולה נפתחת כלפי מעלה, והערך הקטן ביותר הוא שיעור ה־y של הקודקוד.";
      return good(progress, pack, M.fmt(v.y), whyPick);
    }
    if (progress.vertexY == null) {
      var step = checkVertex(pack, progress, { id: task.id, want: "value" }, typed);
      step = finishValuePrelude(step, task, v.y);
      if (step && step.ok && step.progress && step.progress.phase[task.id] === "ready") {
        step.progress.phase[task.id] = "pick";
        step.progress.vertexKind = kind;
        step.message = "זה ערך הקיצון. כעת בחרו איזה מהערכים המוצעים הוא " + (asked === "max" ? "הערך הגדול ביותר" : "הערך הקטן ביותר") + ".";
      }
      return step;
    }
    return bad("בחרו את הערך מבין האפשרויות.");
  }

  function judgeRange(pack, progress, task, cond, range) {
    var M = model();
    var fn = pack.fn;
    var v = M.vertex(fn);
    if (cond.name === "x" || cond.name === "k") {
      return bad("תחום הערכים נכתב עבור y, לא עבור x.");
    }
    if (v && M.near(cond.bound, v.x) && !M.near(v.x, v.y)) {
      return bad("זה שיעור ה־x של הקודקוד. קצה תחום הערכים הוא שיעור ה־y.");
    }
    if (!M.near(cond.bound, range.bound)) return bad("המספר אינו שיעור ה־y של הקודקוד.");
    var dir = String(cond.op).replace("=", "");
    var wantDir = String(range.op).replace("=", "");
    if (dir !== wantDir) {
      return bad(range.kind === "max"
        ? "זו פרבולה עם מקסימום, ולכן הערכים הם מתחת לערך הקודקוד, לא מעליו."
        : "זו פרבולה עם מינימום, ולכן הערכים הם מעל ערך הקודקוד, לא מתחתיו.");
    }
    if (cond.op !== range.op) {
      return bad("הפונקציה מקבלת את ערך הקודקוד, לכן הגבול נכלל. השתמשו ב־" + (range.op === "<=" ? "≤" : "≥") + ".");
    }
    progress.vertexKnown = true;
    progress.vertexY = range.bound;
    progress.vertexKind = range.kind;
    progress.range = { op: range.op, bound: range.bound };
    progress.done[task.id] = true;
    progress.phase[task.id] = "done";
    var whyRange = range.kind === "max"
      ? "a < 0, יש מקסימום, והפונקציה מקבלת את ערך הקודקוד, לכן y ≤ הערך הזה."
      : "a > 0, יש מינימום, והפונקציה מקבלת את ערך הקודקוד, לכן y ≥ הערך הזה.";
    return good(progress, pack, condText("y", range.op, range.bound), whyRange);
  }

  function checkRange(pack, progress, task, typed) {
    var M = model();
    var fn = pack.fn;
    var range = M.rangeOf(fn);
    if (!range) return bad("לפונקציה הזו אין תחום ערכים של פרבולה.");
    var cond = M.parseScalarCond(typed);
    if (cond) return judgeRange(pack, progress, task, cond, range);
    if (M.parseInterval(typed)) return bad("תחום הערכים נכתב עבור y, לא עבור x.");
    if (progress.vertexY == null) {
      var step = checkVertex(pack, progress, { id: task.id, want: "value" }, typed);
      step = finishValuePrelude(step, task, range.bound);
      if (step && step.ok && step.progress && step.progress.phase[task.id] === "ready") {
        step.progress.phase[task.id] = "range";
        step.progress.vertexKind = range.kind;
        step.message = "זה ערך הקיצון. שיעור ה־y שלו, יחד עם כיוון הפתיחה, קובע את תחום הערכים.";
      }
      return step;
    }
    return bad("רשמו תחום עבור y, למשל y ≤ מספר או y ≥ מספר.");
  }

  function levelWhy(fn, hits, want) {
    if (Number(hits) === 1) return "ישר אופקי בגובה ערך הקיצון נוגע בפרבולה בנקודה אחת, הקודקוד.";
    if (Number(hits) === 2) {
      return want.kind === "max"
        ? "פרבולה עם מקסימום נחתכת פעמיים על ידי ישר אופקי שנמצא מתחת לקודקוד."
        : "פרבולה עם מינימום נחתכת פעמיים על ידי ישר אופקי שנמצא מעל לקודקוד.";
    }
    return want.kind === "max"
      ? "ישר אופקי מעל המקסימום אינו פוגש את הפרבולה."
      : "ישר אופקי מתחת למינימום אינו פוגש את הפרבולה.";
  }

  function judgeLevel(pack, progress, task, cond) {
    var M = model();
    var fn = pack.fn;
    var want = M.levelCond(fn, task.hits);
    var v = M.vertex(fn);
    if (!want) return bad("אי אפשר לקבוע את מספר החיתוכים בלי ערך קיצון.");
    if (cond.name !== "k" && cond.name !== "y") return bad("רשמו תנאי על k.");
    if (v && M.near(cond.bound, v.x) && !M.near(v.x, v.y)) {
      return bad("זה שיעור ה־x של הקודקוד. משווים את k לשיעור ה־y.");
    }
    if (!M.near(cond.bound, want.bound)) return bad("השוו את k לשיעור ה־y של הקודקוד, לא למספר אחר.");
    var hits = Number(task.hits);
    if (hits === 1) {
      if (cond.op !== "=") return bad("חיתוך אחד מתקבל כאשר הישר עובר בדיוק בגובה הקודקוד, כלומר k שווה לערך הקיצון.");
    } else if (cond.op === "=") {
      return bad("כאשר k שווה לערך הקיצון יש חיתוך אחד, לא " + (hits === 0 ? "אפס חיתוכים" : "שני חיתוכים") + ".");
    } else {
      var dir = String(cond.op).replace("=", "");
      var wantDir = String(want.op).replace("=", "");
      if (dir !== wantDir) {
        return bad("החלפתם בין המקרה של שני חיתוכים למקרה של אפס חיתוכים.");
      }
      if (cond.op !== want.op) return bad("ערך הקיצון עצמו נותן חיתוך אחד. כאן האי־שוויון חזק, בלי שוויון.");
    }
    progress.vertexY = want.bound;
    progress.vertexKind = want.kind;
    progress.done[task.id] = true;
    progress.phase[task.id] = "done";
    return good(progress, pack, condText("k", want.op, want.bound), levelWhy(fn, hits, want));
  }

  function checkLevel(pack, progress, task, typed) {
    var M = model();
    var fn = pack.fn;
    var want = M.levelCond(fn, task.hits);
    if (!want) return bad("אי אפשר לקבוע את מספר החיתוכים בלי ערך קיצון.");
    var cond = M.parseScalarCond(typed);
    if (cond) return judgeLevel(pack, progress, task, cond);
    if (progress.vertexY == null) {
      var step = checkVertex(pack, progress, { id: task.id, want: "value" }, typed);
      step = finishValuePrelude(step, task, want.bound);
      if (step && step.ok && step.progress && step.progress.phase[task.id] === "ready") {
        step.progress.phase[task.id] = "level";
        step.progress.vertexKind = want.kind;
        step.message = "זה ערך הקיצון. כעת השוו אליו את גובה הישר y = k.";
      }
      return step;
    }
    return bad("רשמו תנאי על k, למשל k < מספר, k = מספר או k > מספר.");
  }

  function judgeBoth(pack, progress, task, list) {
    var M = model();
    var fn = pack.fn;
    var parts = bothParts(fn, task);
    var v = M.vertex(fn);
    if (list.some(function (region) { return region.inclusive; })) {
      var touchesRoot = list.some(function (region) {
        return (fn.roots || []).some(function (root) {
          return M.near(region.from, root) || M.near(region.to, root);
        });
      });
      if (touchesRoot) return bad("התנאי על הסימן הוא אי־שוויון חזק. נקודת האפס לא נכללת.");
      if (v && list.some(function (region) { return M.near(region.from, v.x) || M.near(region.to, v.x); })) {
        return bad("עולה ויורדת נכתבים באי־שוויון חזק. הקודקוד עצמו לא נכלל.");
      }
    }
    if (M.sameRegionSet(list, parts.both)) {
      progress.vertexKnown = true;
      progress.rootKnown = true;
      if (v) {
        progress.vertexX = v.x;
        progress.vertexY = v.y;
      }
      progress.done[task.id] = true;
      progress.phase[task.id] = "done";
      var trendName = parts.trend === "dec" ? "הירידה" : "העלייה";
      var signName = parts.sign === "neg" ? "השליליות" : "החיוביות";
      return good(progress, pack, formatRegions(parts.both), "זה החיתוך של תחום " + trendName + " עם תחום " + signName + ".");
    }
    if (M.sameRegionSet(list, parts.mono)) {
      return bad(parts.trend === "dec"
        ? "זה רק תחום הירידה. צריך גם שהפונקציה תהיה " + (parts.sign === "neg" ? "שלילית" : "חיובית") + "."
        : "זה רק תחום העלייה. צריך גם שהפונקציה תהיה " + (parts.sign === "neg" ? "שלילית" : "חיובית") + ".");
    }
    if (M.sameRegionSet(list, parts.signed)) {
      return bad(parts.sign === "neg"
        ? "זה רק תחום השליליות. צריך גם שהפונקציה תהיה " + (parts.trend === "dec" ? "יורדת" : "עולה") + "."
        : "זה רק תחום החיוביות. צריך גם שהפונקציה תהיה " + (parts.trend === "dec" ? "יורדת" : "עולה") + ".");
    }
    if (list.length > parts.both.length) return bad("חיברתם תחומים עם או. כאן שני התנאים צריכים להתקיים יחד, כלומר החיתוך.");
    if (parts.both.length > list.length && list.length) return bad("התשובה חלקית. חפשו את כל ערכי ה־x שנמצאים בשני התחומים.");
    if (v && list.some(function (region) { return M.near(region.from, v.y) || M.near(region.to, v.y); }) && !M.near(v.x, v.y)) {
      return bad("התחום נכתב לפי שיעור ה־x, לא לפי שיעור ה־y.");
    }
    return bad("התחום שבחרתם אינו נמצא בשני התנאים יחד.");
  }

  function checkBoth(pack, progress, task, typed) {
    var M = model();
    var fn = pack.fn;
    var list = M.parseRegionList(typed);
    if (list) return judgeBoth(pack, progress, task, list);
    if (fn.degree >= 2 && !progress.vertexKnown) {
      return checkVertex(pack, progress, { id: task.id, want: "x" }, typed);
    }
    if (fn.degree >= 2 && !progress.rootKnown) {
      if (M.parseDomainAnswer(typed).length) return bad("מצאו תחילה את נקודות האפס, ואז את החיתוך של שני התחומים.");
      var quad = quadAdvance(fn, progress, task.id, 0, typed);
      if (!quad.ok) return quad;
      progress.phase[task.id] = quad.stage === "roots" || quad.stage === "none" ? "root" : quad.stage;
      return good(progress, pack, quad.show, quad.stage === "roots" || quad.stage === "none"
        ? "נקודות האפס ידועות. עכשיו חפשו את ערכי x שנמצאים בשני התחומים יחד."
        : (quad.message || "נכון. המשיכו עד שנקודות האפס ידועות."));
    }
    return bad("רשמו את התחום שבו " + bothPhrase(task) + ".");
  }

  function rangeClaimTrue(fn, cmp, bound) {
    var M = model();
    var v = M.vertex(fn);
    if (!v || !fn || fn.degree < 2) return false;
    var y = v.y;
    var greater = y > bound && !M.near(y, bound);
    var less = y < bound && !M.near(y, bound);
    var equal = M.near(y, bound);
    if (fn.a > 0) {
      if (cmp === ">") return greater;
      if (cmp === ">=") return greater || equal;
      return false;
    }
    if (cmp === "<") return less;
    if (cmp === "<=") return less || equal;
    return false;
  }

  function checkRangeClaim(pack, progress, task, typed) {
    var M = model();
    var fn = pack.fn;
    var yn = M.parseYesNo(typed);
    if (yn == null) {
      if (progress.vertexY == null) {
        var v = M.vertex(fn);
        var step = checkVertex(pack, progress, { id: task.id, want: "value" }, typed);
        step = finishValuePrelude(step, task, v && v.y);
        if (step && step.ok && step.progress && step.progress.phase[task.id] === "ready") {
          step.progress.phase[task.id] = "claim";
          step.message = "זה ערך הקיצון. בדקו אם הפונקציה מקבלת אותו, והבחינו בין > לבין ≥.";
        }
        return step;
      }
      return bad("ענו כן או לא.");
    }
    var truth = rangeClaimTrue(fn, task.cmp, task.bound);
    if (yn !== truth) {
      return bad("יש הבדל בין > לבין ≥. בדקו אם הפונקציה מקבלת בפועל את ערך ה־y של הקודקוד.");
    }
    var vNow = M.vertex(fn);
    if (vNow) progress.vertexY = vNow.y;
    progress.done[task.id] = true;
    progress.phase[task.id] = "done";
    var whyClaim = truth
      ? "הפונקציה מקבלת את ערך הקודקוד, ולכן אי־שוויון חלש שכולל אותו מתקיים לכל x."
      : "הפונקציה מקבלת את ערך הקודקוד, ולכן אי־שוויון חזק שלא כולל אותו אינו נכון לכל x.";
    return good(progress, pack, yn ? "כן" : "לא", whyClaim);
  }

  function dispatch(pack, progress, typed) {
    var task = currentTask(pack, progress);
    if (!task) return bad("סיימתם את התרגיל.");
    var text = String(typed || "").trim();
    if (!text) return bad("כתבו שלב.");
    if (task.kind === "fnSketch") return bad("שרטטו את הגרף על מערכת הצירים, ואז לחצו בדיקה.");
    if (task.kind === "fnSolve") return checkSolve(pack, progress, task, text);
    if (task.kind === "fnVertex") return checkVertex(pack, progress, task, text);
    if (task.kind === "fnChoice") return checkChoice(pack, progress, task, text);
    if (task.kind === "fnCount") return checkCount(pack, progress, task, text);
    if (task.kind === "fnValue") return checkValueTask(pack, progress, task, text, false);
    if (task.kind === "fnPoint") return checkValueTask(pack, progress, task, text, true);
    if (task.kind === "fnZero") return checkZeroTask(pack, progress, task, text, true);
    if (task.kind === "fnIntercepts") return checkIntercepts(pack, progress, task, text);
    if (task.kind === "fnSign" || task.kind === "fnMono") return checkDomains(pack, progress, task, text);
    if (task.kind === "fnExtremumPick") return checkExtremumPick(pack, progress, task, text);
    if (task.kind === "fnRange") return checkRange(pack, progress, task, text);
    if (task.kind === "fnLevel") return checkLevel(pack, progress, task, text);
    if (task.kind === "fnBoth") return checkBoth(pack, progress, task, text);
    if (task.kind === "fnRangeClaim") return checkRangeClaim(pack, progress, task, text);
    if (task.kind === "fnOn") return checkOn(pack, progress, task, text);
    if (task.kind === "fnClaim") return checkClaim(pack, progress, task, text);
    return bad("הסעיף הזה עדיין לא נתמך.");
  }

  function checkTyped(pack, progress, typed, opts) {
    var next = cloneProgress(progress);
    var result = dispatch(pack, next, typed);
    if (opts && opts.axis && result && result.ok && result.axis && result.axis !== opts.axis) {
      return bad(result.axis === "y"
        ? "זה חיתוך עם ציר ה־y. רשמו אותו בתיבה הימנית."
        : "זה חיתוך עם ציר ה־x. רשמו אותו בתיבה השמאלית.");
    }
    if (!result) return bad("עוד לא.");
    if (!result.ok) return result;
    if (!result.progress) result.progress = next;
    if (result.solved == null) result.solved = remaining(pack, result.progress).length === 0;
    return result;
  }

  function checkSketch(pack, progress, sketch) {
    var task = currentTask(pack, progress);
    if (!task || task.kind !== "fnSketch") return bad("אין עכשיו סעיף שרטוט.");
    var expect = model().sketchExpectations(pack.fn);
    var stray = offGraphPoint(pack.fn, sketch && sketch.points);
    if (stray) return bad("הנקודה " + pointLabel(stray) + " אינה על גרף הפונקציה.");
    var verdict = graph().validateSketch(sketch, expect);
    if (!verdict.ok) return verdict;
    var next = cloneProgress(progress);
    next.done[task.id] = true;
    next.phase[task.id] = "done";
    return good(next, pack, "שרטוט הגרף", verdict.message || "השרטוט מתאים לפונקציה.");
  }

  function pointLabel(point) {
    var M = model();
    return "(" + M.fmt(point.x) + "," + M.fmt(point.y) + ")";
  }

  function pointOnFn(fn, point) {
    var M = model();
    return M.near(M.evalAt(fn, Number(point.x)), Number(point.y));
  }

  function offGraphPoint(fn, points) {
    var i;
    for (i = 0; i < (points || []).length; i++) {
      if (!pointOnFn(fn, points[i])) return points[i];
    }
    return null;
  }

  function checkSketchPoint(pack, sketch, point) {
    var others = (sketch && sketch.points) || [];
    var placed = graph().validatePoint(point, others);
    if (!placed.ok) return placed;
    if (!pointOnFn(pack.fn, point)) {
      return bad("הנקודה " + pointLabel(point) + " אינה על גרף הפונקציה.");
    }
    return placed;
  }

  function domainLine(task, fn) {
    var M = model();
    var slots = domainSlots(task, fn);
    function formatRegion(region) {
      if (region.from === "-inf" && region.to === "inf") return "כל x";
      if (region.from === "-inf") return "x < " + M.fmt(region.to);
      if (region.to === "inf") return "x > " + M.fmt(region.from);
      return M.fmt(region.from) + " < x < " + M.fmt(region.to);
    }
    function piece(key, region) {
      var name = key === "pos" ? "חיובי" : key === "neg" ? "שלילי" : key === "inc" ? "עולה" : "יורדת";
      var list = asRegionList(region);
      if (!list.length) return name + ": אין";
      return name + ": " + list.map(formatRegion).join(" או ");
    }
    return slotKeys(slots).map(function (key) {
      return piece(key, slots[key]);
    }).join(", ");
  }

  function nextEquationLine(fn, eqText) {
    var Teach = global.DoctematicaTeach;
    if (Teach && eqText && Teach.nextAction) {
      var act = Teach.nextAction(eqText);
      if (act && act.eq && !act.done) return act.eq;
    }
    if (fn.roots.length) return "x=" + model().fmt(fn.roots[0]).replace(/−/g, "-");
    return null;
  }

  function nextExpandLine(fn, progress) {
    var Q = quadApi();
    var M = model();
    if (!Q || formReady(fn, progress)) return null;
    var cur = currentExpr(fn, progress);
    var eq = cur + "=0";
    var nxt = null;
    try {
      nxt = Q.nextMixedStep(eq, Q.analyzeMixedStart(eq));
    } catch (err) {
      nxt = null;
    }
    if (nxt && nxt.eq) {
      var steppedLeft = String(nxt.eq).split("=")[0];
      if (M.ascii(steppedLeft) !== M.ascii(cur) && !/^a=/i.test(nxt.eq)) {
        return M.ascii(cur) + "=" + M.ascii(steppedLeft);
      }
    }
    var left = cur;
    try {
      left = String(Q.expandParensEq(eq) || "").split("=")[0] || cur;
    } catch (err2) {
      left = cur;
    }
    if (!left || M.ascii(left) === M.ascii(cur)) return null;
    return M.ascii(cur) + "=" + M.ascii(left);
  }

  function nextVertexLine(fn, progress, task) {
    var M = model();
    var phase = (progress.phase && progress.phase[task.id]) || "";
    var vert = M.vertex(fn);
    if (!vert) return null;
    function num(n) { return M.fmt(n).replace(/−/g, "-"); }
    function coeff(n) { return M.fmtMatch(n, fn.expr).replace(/−/g, "-"); }
    function xTok() {
      var saved = progress.vertexXText;
      if (saved && M.near(M.evalNumeric(M.ascii(saved)), vert.x)) return M.ascii(saved);
      return num(vert.x);
    }
    if (task.want === "x" && (phase === "x" || phase === "done")) return null;
    if (task.want === "value" && progress.vertexY != null && M.near(Number(progress.vertexY), vert.y) && !phase) {
      return num(vert.y);
    }
    if (task.want === "value" && progress.vertexKnown && phase !== "plug" && phase !== "x") {
      if (phase === "value" || phase === "done") return null;
      return "f(" + xTok() + ")=" + M.substText(fn, vert.x, progress.vertexXText).replace(/−/g, "-").replace(/\s+/g, "");
    }
    var readVertex = vertexReadable(fn);
    var midVertex = phase === "expand" || phase === "abc" || phase === "formula" || phase === "plugx" || phase === "x" || phase === "plug" || phase === "value" || phase === "point" || phase === "kind";
    if (readVertex && !midVertex) {
      if (task.want === "x") return "x=" + num(vert.x);
      if (task.want === "value") return num(vert.y);
      return (task.name || "") + pairText(vert.x, vert.y);
    }
    if (phase === "expand" || (!formReady(fn, progress) && phase !== "abc" && phase !== "formula" && phase !== "plugx" && phase !== "x" && phase !== "plug" && phase !== "value" && phase !== "point")) {
      var expandLine = nextExpandLine(fn, progress);
      if (expandLine) return expandLine;
    }
    if (phase !== "abc" && phase !== "formula" && phase !== "plugx" && phase !== "x" && phase !== "plug" && phase !== "value" && phase !== "point" && phase !== "kind") {
      return "a=" + coeff(fn.a) + ", b=" + coeff(fn.b) + ", c=" + coeff(fn.c);
    }
    if (phase === "abc") return "x=-b/(2a)";
    if (phase === "formula") return "x=-(" + coeff(fn.b) + ")/(2*(" + coeff(fn.a) + "))";
    if (phase === "plugx") return "x=" + num(vert.x);
    if (task.want === "x") return null;
    if (phase === "x") return "f(" + xTok() + ")=" + M.substText(fn, vert.x, progress.vertexXText).replace(/−/g, "-").replace(/\s+/g, "");
    if (phase === "plug") return "f(" + xTok() + ")=" + num(vert.y);
    if (phase === "value") {
      if (task.want === "value") return null;
      return pairText(vert.x, vert.y);
    }
    if (phase === "point" && task.classify) return fn.a > 0 ? "מינימום" : "מקסימום";
    return null;
  }

  function nextLine(pack, progress) {
    var M = model();
    var task = currentTask(pack, cloneProgress(progress));
    if (!task) return null;
    var fn = pack.fn;
    var phase = (progress.phase && progress.phase[task.id]) || "";
    if (task.kind === "fnValue" || task.kind === "fnPoint") {
      var at = Number(task.at);
      if (task.kind === "fnPoint" && !phase) return "x=" + M.fmt(at).replace(/−/g, "-");
      if (task.kind === "fnPoint" && phase === "set") {
        return "y=" + M.substText(fn, at).replace(/−/g, "-").replace(/\s+/g, "");
      }
      if (task.kind === "fnPoint" && phase === "plug") {
        return "y=" + M.fmt(M.evalAt(fn, at)).replace(/−/g, "-");
      }
      if (phase !== "plug" && phase !== "value" && phase !== "point" && fn.degree > 0) {
        return "f(" + M.fmt(at).replace(/−/g, "-") + ")=" + M.substText(fn, at).replace(/−/g, "-").replace(/\s+/g, "");
      }
      if (phase !== "value" && phase !== "point") {
        return "f(" + M.fmt(at).replace(/−/g, "-") + ")=" + M.fmt(M.evalAt(fn, at)).replace(/−/g, "-");
      }
      if (task.kind === "fnPoint") return pairText(at, M.evalAt(fn, at));
      return null;
    }
    if (task.kind === "fnSolve") {
      var solveLine = nextQuadLine(fn, progress, task.id, task.k);
      if (solveLine) return solveLine;
      if (task.points) {
        var solveLevel = levelAt(fn, task.k, progress);
        var solveBag = bag(progress, task.id);
        var solveMissing = (solveLevel ? solveLevel.roots : []).filter(function (r) {
          return !solveBag.points.some(function (x) { return M.near(x, r); });
        });
        solveMissing.sort(function (a, b) { return a - b; });
        if (solveMissing.length) return pairText(solveMissing[0], task.k);
      }
      return null;
    }
    if (task.kind === "fnVertex") return nextVertexLine(fn, progress, task);
    if (task.kind === "fnChoice") {
      var pickedClaim = trueClaims(fn, task)[0];
      return pickedClaim ? pickedClaim.text : null;
    }
    if (task.kind === "fnCount") return String(intersectionCount(fn, task.k));
    if (task.kind === "fnZero") {
      if (fn.degree >= 2) {
        var zeroLine = nextQuadLine(fn, progress, task.id, 0);
        if (zeroLine) return zeroLine;
        var zeroLevel = levelAt(fn, 0, progress);
        var zeroBag = bag(progress, task.id);
        var zeroMissing = (zeroLevel ? zeroLevel.roots : []).filter(function (r) {
          return !zeroBag.points.some(function (x) { return M.near(x, r); });
        });
        zeroMissing.sort(function (a, b) { return a - b; });
        if (zeroMissing.length) return pairText(zeroMissing[0], 0);
        return null;
      }
      if (!fn.roots.length) return "אין";
      if (phase !== "root" && phase !== "point") {
        var eq = progress.eq && progress.eq[task.id];
        if (!eq) return fn.expr + "=0";
        return nextEquationLine(fn, eq);
      }
      return pairText(fn.roots[0], 0);
    }
    if (task.kind === "fnIntercepts") {
      var axes = (progress.axes && progress.axes[task.id]) || { x: "", y: "" };
      if (axes.y !== "done") {
        if (!axes.y) return "x=0";
        if (axes.y === "set") return "f(0)=" + M.substText(fn, 0).replace(/−/g, "-").replace(/\s+/g, "");
        if (axes.y === "plug") return "f(0)=" + M.fmt(M.evalAt(fn, 0)).replace(/−/g, "-");
        return pairText(0, M.evalAt(fn, 0));
      }
      if (axes.x !== "done") {
        if (!fn.roots.length) {
          if (progress.rootKnown || axes.x === "done") return null;
          var noneLine = nextQuadLine(fn, progress, task.id + ":x", 0);
          if (noneLine) return noneLine;
          return "אין חיתוך עם ציר x";
        }
        if (fn.degree >= 2) {
          var ixBag = bag(progress, task.id + ":x");
          var ixMissing = fn.roots.filter(function (r) {
            return !ixBag.points.some(function (x) { return M.near(x, r); });
          });
          if (ixBag.roots.length < fn.roots.length) {
            var ixLine = nextQuadLine(fn, progress, task.id + ":x", 0);
            if (ixLine) return ixLine;
          }
          if (ixMissing.length) return pairText(ixMissing[0], 0);
          return null;
        }
        if (axes.x === "root") return pairText(fn.roots[0], 0);
        var eqX = progress.eq && progress.eq[task.id + ":x"];
        if (!eqX) return fn.expr + "=0";
        return nextEquationLine(fn, eqX);
      }
      return null;
    }
    if (task.kind === "fnSign") {
      if (fn.degree >= 2 && !(progress && progress.rootKnown)) {
        var signQuad = nextQuadLine(fn, progress, task.id, 0);
        if (signQuad) return signQuad;
      }
      if (fn.roots.length && !(progress && progress.rootKnown)) {
        var eqS = progress.eq && progress.eq[task.id];
        if (!eqS) return fn.expr + "=0";
        if (phase === "root") return null;
        return nextEquationLine(fn, eqS);
      }
      var regionBag = (progress.regions && progress.regions[task.id]) || {};
      if (regionBag.pos && regionBag.neg) return null;
      return domainLine(task, fn);
    }
    if (task.kind === "fnMono") {
      if (fn.degree >= 2 && !(progress && progress.vertexKnown)) {
        return nextVertexLine(fn, progress, { id: task.id, want: "x" });
      }
      if (M.trendOf(fn) === "flat") return "אינה עולה ואינה יורדת";
      return domainLine(task, fn);
    }
    if (task.kind === "fnOn") {
      if (phase !== "plug" && phase !== "value" && phase !== "done") {
        return "f(" + M.fmt(task.x).replace(/−/g, "-") + ")=" + M.substText(fn, task.x).replace(/−/g, "-").replace(/\s+/g, "");
      }
      if (phase !== "value" && phase !== "done") {
        return "f(" + M.fmt(task.x).replace(/−/g, "-") + ")=" + M.fmt(M.evalAt(fn, task.x)).replace(/−/g, "-");
      }
      return onAnswer(fn, task) ? "כן" : "לא";
    }
    if (task.kind === "fnClaim") return claimAnswer(fn, task) ? "כן" : "לא";
    if (task.kind === "fnExtremumPick") {
      if (progress.vertexY == null && phase !== "pick") return nextVertexLine(fn, progress, { id: task.id, want: "value" });
      return M.fmt(M.vertex(fn).y).replace(/−/g, "-");
    }
    if (task.kind === "fnRange") {
      if (progress.vertexY == null && phase !== "range") return nextVertexLine(fn, progress, { id: task.id, want: "value" });
      var range = M.rangeOf(fn);
      return range ? "y" + range.op + M.fmt(range.bound).replace(/−/g, "-") : null;
    }
    if (task.kind === "fnLevel") {
      if (progress.vertexY == null && phase !== "level") return nextVertexLine(fn, progress, { id: task.id, want: "value" });
      var levelWant = M.levelCond(fn, task.hits);
      return levelWant ? "k" + levelWant.op + M.fmt(levelWant.bound).replace(/−/g, "-") : null;
    }
    if (task.kind === "fnBoth") {
      if (fn.degree >= 2 && !progress.vertexKnown) return nextVertexLine(fn, progress, { id: task.id, want: "x" });
      if (fn.degree >= 2 && !progress.rootKnown) {
        var bothQuad = nextQuadLine(fn, progress, task.id, 0);
        if (bothQuad) return bothQuad;
      }
      return formatRegions(bothParts(fn, task).both);
    }
    if (task.kind === "fnRangeClaim") {
      if (progress.vertexY == null && phase !== "claim") return nextVertexLine(fn, progress, { id: task.id, want: "value" });
      return rangeClaimTrue(fn, task.cmp, task.bound) ? "כן" : "לא";
    }
    return null;
  }

  function hintFor(pack, progress) {
    var M = model();
    var task = currentTask(pack, progress || freshProgress());
    if (!task) return "סיימתם את התרגיל.";
    var fn = pack.fn;
    var phase = ((progress && progress.phase) || {})[task.id] || "";
    if (task.kind === "fnValue") {
      if (phase === "plug") return "חשבו את האגף הימני.";
      return "הציבו את " + M.fmt(task.at) + " במקום x, ורשמו f(" + M.fmt(task.at) + ").";
    }
    if (task.kind === "fnPoint") {
      if (phase === "value") return "רשמו את הנקודה כזוג סדור (x,y).";
      if (phase === "plug") return "חשבו את y, ואחר כך רשמו את הנקודה.";
      if (phase === "set") return "הציבו את x במשוואה ומצאו את y. אפשר לרשום y = …, בלי f().";
      if (M.near0(Number(task.at))) return "הנקודה על ציר ה־y, ולכן x = 0. אחר כך הציבו במשוואה ומצאו את y.";
      return "רשמו את שיעור ה־x, הציבו אותו במשוואה, ומצאו את y.";
    }
    if (task.kind === "fnZero") {
      if (!fn.roots.length) return "בדקו אם יש x שעבורו הפונקציה שווה 0.";
      if (phase === "root") return "רשמו את נקודת האפס כזוג סדור על ציר ה־x.";
      if (phase === "eq" || (progress && progress.eq && progress.eq[task.id])) return "המשיכו לפתור את המשוואה עד שמתקבל x = מספר.";
      return "פתרו " + M.zeroEquation(fn) + ", ואחר כך רשמו את הנקודה.";
    }
    if (task.kind === "fnIntercepts") {
      var axes = (progress && progress.axes && progress.axes[task.id]) || { x: "", y: "" };
      if (!axes.y && !axes.x) return "מימין פותרים את החיתוך עם ציר ה־y, ומשמאל את נקודות החיתוך עם ציר ה־x. בכל תיבה עד לרשימת הנקודות.";
      if (!axes.y) return "בנקודה שנמצאת על ציר ה־y, מהו ערך ה־x?";
      if (axes.y === "set") return "הציבו x = 0 בפונקציה.";
      if (axes.y === "plug") return "חשבו את f(0), ואחר כך רשמו את הנקודה.";
      if (axes.y === "value") return "רשמו את נקודת החיתוך עם ציר ה־y כזוג סדור.";
      if (!axes.x) return "בנקודה שנמצאת על ציר ה־x, מהו ערך ה־y?";
      if (axes.x === "set") return fn.roots.length ? "פתרו את המשוואה " + M.zeroEquation(fn) + "." : "רשמו " + M.zeroEquation(fn) + ". אם אין פתרון ממשי, אין חיתוך עם ציר ה־x.";
      if (axes.x === "root") return fn.roots.length > 1 ? "רשמו את נקודות החיתוך עם ציר ה־x. אם יש שתיים, רשמו את שתיהן." : "רשמו את נקודת החיתוך עם ציר ה־x.";
      if (!fn.roots.length) return "אין פתרון ממשי, ולכן אין חיתוך עם ציר ה־x.";
      return "רשמו את נקודות החיתוך כזוגות סדורים.";
    }
    if (task.kind === "fnSign") {
      if (fn.degree >= 2 && !(progress && progress.rootKnown)) {
        if (progress && progress.eq && progress.eq[task.id]) return "מצאו תחילה את נקודות האפס של הפונקציה.";
        if (task.only === "neg") return "כדי לקבוע היכן הפונקציה שלילית, חשוב היכן הגרף נמצא ביחס לציר ה־x.";
        if (task.only === "pos") return "כדי לקבוע היכן הפונקציה חיובית, חשוב היכן הגרף נמצא ביחס לציר ה־x.";
        return "כדי לקבוע את סימן הפונקציה, חשוב היכן הגרף נמצא ביחס לציר ה־x.";
      }
      if (!(fn.roots || []).length) return "אין נקודות אפס. לפי כיוון הפרבולה, היא כולה מעל ציר ה־x או כולה מתחתיו.";
      if (task.only === "pos") return "נקודות האפס מחלקות את ציר ה־x לתחומים. בדקו באיזה מהם הפרבולה נמצאת מעל ציר ה־x.";
      return "נקודות האפס מחלקות את ציר ה־x לתחומים. בדקו איפה הגרף מעל ציר ה־x ואיפה מתחתיו.";
    }
    if (task.kind === "fnMono") {
      if (fn.degree >= 2 && !(progress && progress.vertexKnown)) return "כדי לקבוע את תחומי העלייה והירידה, מצאו תחילה את הקודקוד.";
      if (fn.degree >= 2 && progress && progress.vertexKnown) return "שיעור ה־x של הקודקוד מפריד בין תחום העלייה לתחום הירידה.";
      if (M.trendOf(fn) === "flat") return "פונקציה קבועה אינה עולה ואינה יורדת. בשתי התיבות כתבו אין.";
      return "מלאו את שתי התיבות: תחומי עלייה ותחומי ירידה. אם הפונקציה עולה בכל הישר — כל x. אם אין תחום — אין.";
    }
    if (task.kind === "fnSolve") {
      if (progress && progress.eq && progress.eq[task.id]) return "המשיכו לפתור את המשוואה הריבועית.";
      if (Math.abs(Number(task.k)) < 1e-9) return "רשמו " + M.zeroEquation(fn) + ", ואז פתרו.";
      return "רשמו את משוואת הפרבולה והשוו אותה ל־" + M.fmt(task.k) + ", ואז פתרו.";
    }
    if (task.kind === "fnVertex") {
      if (vertexReadable(fn) && !phase) {
        if (task.want === "value") return "שיעור ה־y של הקודקוד נראה מהמשוואה. אפשר לרשום אותו ישירות.";
        if (task.want === "x") return "שיעור ה־x של הקודקוד נראה מהמשוואה. אפשר לרשום אותו ישירות.";
        return "אפשר לראות את הקודקוד ישר מהמשוואה, ולרשום אותו כזוג סדור. אפשר גם לפתוח סוגריים.";
      }
      if (task.want === "value" && progress && progress.vertexY != null && !phase) {
        return fn.a > 0
          ? "הערך המינימלי הוא שיעור ה־y של הקודקוד שכבר מצאתם. אפשר לרשום אותו ישירות."
          : "הערך המקסימלי הוא שיעור ה־y של הקודקוד שכבר מצאתם. אפשר לרשום אותו ישירות.";
      }
      if (!formReady(fn, progress) && (phase === "" || phase === "expand")) return "פתחו את הסוגריים והגיעו לצורה ax²+bx+c, כולל הסימנים.";
      if (!phase || phase === "expand") return "כדי למצוא את הקודקוד, התחילו בזיהוי המקדמים a ו־b.";
      if (phase === "abc") return "השתמשו בנוסחה x = −b/(2a).";
      if (phase === "formula") return "כעת הציבו בנוסחה את הערכים של a ושל b, כולל הסימן.";
      if (phase === "plugx") return "חשבו את הערך של x.";
      if (phase === "x") return "מצאתם את שיעור ה־x של הקודקוד. כדי למצוא את שיעור ה־y, הציבו את x בפונקציה.";
      if (phase === "plug") return "ההצבה נכונה. חשבו את y.";
      if (phase === "value") return "כעת רשמו את הקודקוד כזוג סדור.";
      if (phase === "point") return "בדקו את הסימן של המקדם של x². מה הוא אומר על כיוון פתיחת הפרבולה?";
      return "כדי למצוא את הקודקוד, התחילו בזיהוי המקדמים a ו־b.";
    }
    if (task.kind === "fnChoice") return "בחרו את הטענה הנכונה. אפשר לבדוק בהצבה.";
    if (task.kind === "fnCount") return "ענו כמה נקודות חיתוך יש. אפשר לשרטט את הישר y = " + M.fmt(task.k) + " כקו עזר, בלי שזה חובה.";
    if (task.kind === "fnOn") {
      if (phase === "value") return "ענו כן או לא לפי החישוב.";
      if (phase === "plug") return "חשבו את הערך שהתקבל.";
      return "בדקו אם f(" + M.fmt(task.x) + ") שווה לשיעור ה־y של הנקודה.";
    }
    if (task.kind === "fnClaim") return "ענו כן או לא. אפשר קודם לבדוק עבור אילו x מתקבל הערך שבטענה.";
    if (task.kind === "fnExtremumPick") {
      if (phase === "pick") return "השוו את הערכים המוצעים לשיעור ה־y של הקודקוד.";
      if (phase === "x" || phase === "plug" || phase === "value") return "מצאו את הקודקוד ולאחר מכן בדקו את שיעור ה־y שלו.";
      return fn.a < 0
        ? "הערך הגדול ביותר של פרבולה הפונה כלפי מטה נמצא בקודקוד."
        : "הערך הקטן ביותר של פרבולה הפונה כלפי מעלה נמצא בקודקוד.";
    }
    if (task.kind === "fnRange") {
      if (progress && progress.vertexY != null) return "בדקו האם הפרבולה נפתחת למעלה או למטה, וכללו את ערך הקודקוד ב־≤ או ב־≥.";
      if (phase === "x" || phase === "plug" || phase === "value" || phase === "range") return "שיעור ה־y של הקודקוד קובע את קצה תחום הערכים.";
      return "חשבו מהו הערך הגבוה ביותר או הנמוך ביותר שהפונקציה יכולה לקבל.";
    }
    if (task.kind === "fnLevel") {
      if (phase === "level" || (progress && progress.vertexY != null)) return "בדקו מה קורה כאשר הישר עובר בדיוק דרך הקודקוד, מעליו ומתחתיו.";
      if (phase) return "השוו את גובה הישר לערך ה־y של הקודקוד.";
      return "הישר y = k הוא ישר אופקי.";
    }
    if (task.kind === "fnBoth") {
      if (progress && progress.vertexKnown && progress.rootKnown) return "עכשיו חפשו את ערכי x שנמצאים בשני התחומים יחד.";
      return "מצאו בנפרד את התחום שבו הפונקציה " + (task.trend === "dec" ? "יורדת" : "עולה") + " ואת התחום שבו היא " + (task.sign === "neg" ? "שלילית" : "חיובית") + ".";
    }
    if (task.kind === "fnRangeClaim") return "בדקו האם הפונקציה מקבלת בפועל את ערך ה־y של הקודקוד.";
    if (task.kind === "fnSketch") {
      var guide = model().sketchGuide(fn);
      var placed = sketchPlaced(progress, task);
      if (fn.degree >= 2) {
        if (placed < guide.points.length) {
          var spot = guide.points[placed];
          var vertex = M.vertex(fn);
          if (vertex && M.near(spot.x, vertex.x) && M.near(spot.y, vertex.y)) {
            return progress && progress.vertexKnown
              ? "כבר מצאתם את הקודקוד. סמנו אותו תחילה על מערכת הצירים."
              : "סמנו תחילה את הקודקוד.";
          }
          if (M.near0(spot.y) && (fn.roots || []).some(function (root) { return M.near(root, spot.x); })) {
            return "סמנו את נקודת החיתוך עם ציר ה־x שמצאתם.";
          }
          if (M.near0(spot.x)) return "סמנו את נקודת החיתוך עם ציר ה־y.";
          return "סמנו את הנקודה הבאה שעל הגרף.";
        }
        if (!(fn.roots || []).length) return "אין חיתוך עם ציר ה־x. בדקו לפי סימן a אם הפרבולה נפתחת למעלה או למטה, ושרטטו עקומה סימטרית דרך הנקודות.";
        return "בדקו לפי סימן a אם הפרבולה נפתחת למעלה או למטה, ושרטטו עקומה סימטרית דרך הנקודות שסימנתם.";
      }
      if (guide.points.length && placed < guide.points.length) {
        if (!placed) return "סמנו קודם את הנקודות שעל הגרף, ואחר כך שרטטו את הישר.";
        return "סמנו נקודה נוספת שעל הגרף, ואחר כך שרטטו את הישר.";
      }
      if (guide.points.length) return "עכשיו שרטטו את הישר דרך הנקודות.";
      return "שרטטו את הישר על מערכת הצירים.";
    }
    return "רשמו את השלב הבא.";
  }

  function viewFor(pack, progress) {
    progress = progress || freshProgress();
    var part = currentPart(pack, progress);
    var task = currentTask(pack, progress);
    var M = model();
    var ask = null;
    var input = "math";
    if (task && task.kind === "fnSketch") input = "sketch";
    var domains = null;
    var signReady = task && task.kind === "fnSign" && (progress.rootKnown || (pack.fn.degree < 2 && !pack.fn.roots.length));
    if (signReady) {
      input = "domains";
      domains = [
        { id: "pos", label: "תחומי חיוביות" },
        { id: "neg", label: "תחומי שליליות" },
      ];
      if (task.only === "pos") domains = domains.filter(function (item) { return item.id === "pos"; });
      if (task.only === "neg") domains = domains.filter(function (item) { return item.id === "neg"; });
    }
    if (task && task.kind === "fnMono" && (pack.fn.degree < 2 || progress.vertexKnown)) {
      input = "domains";
      domains = [
        { id: "inc", label: "תחומי עלייה" },
        { id: "dec", label: "תחומי ירידה" },
      ];
      if (task.only === "inc") domains = domains.filter(function (item) { return item.id === "inc"; });
      if (task.only === "dec") domains = domains.filter(function (item) { return item.id === "dec"; });
    }
    if (task && task.kind === "fnBoth" && progress.vertexKnown && progress.rootKnown) {
      input = "domains";
      domains = [{ id: "both", label: "התחום שבו " + bothPhrase(task) }];
    }
    var choices = null;
    if (task && task.kind === "fnChoice") {
      ask = { stage: "choice", question: "בחרו את הטענה הנכונה.", options: task.claims || [] };
      input = "choice";
      choices = task.claims || [];
    }
    if (task && task.kind === "fnExtremumPick" && (progress.phase || {})[task.id] === "pick") {
      choices = (task.options || []).map(function (opt, index) {
        return { id: String(index + 1), text: M.fmt(Number(opt)) };
      });
      ask = { stage: "choice", question: "איזה מהערכים הוא ערך הקיצון?", options: choices };
      input = "choice";
    }
    if (task && task.kind === "fnVertex" && task.classify && (progress.phase || {})[task.id] === "point") {
      choices = [
        { id: "1", text: "מינימום" },
        { id: "2", text: "מקסימום" },
      ];
      ask = { stage: "choice", question: "האם זו נקודת מינימום או מקסימום?", options: choices };
      input = "choice";
    }
    if (task && task.kind === "fnCount") input = "math";
    if (task && task.kind === "fnIntercepts") input = "axes";
    if (task && (task.kind === "fnClaim" || task.kind === "fnRangeClaim")) {
      ask = { stage: "yesno", question: task.prompt || "ענו כן או לא." };
      input = "yesno";
    }
    if (task && task.kind === "fnOn" && (progress.phase || {})[task.id] === "value") {
      ask = { stage: "yesno", question: "האם הנקודה נמצאת על הגרף?" };
      input = "yesno";
    }
    var reference = task && task.kind === "fnCount" ? { k: task.k } : null;
    var figure = null;
    if (pack.graph || (pack.marks && pack.marks.length) || (task && task.kind === "fnLevel")) {
      var geo = M.figureGeometry(pack.fn, pack.marks || [], figureLabels(pack, progress));
      figure = {
        line: geo.line || null,
        curve: geo.curve || null,
        marks: geo.marks || [],
        opens: geo.opens || "",
        trend: M.trendOf(pack.fn),
      };
    }
    return {
      stem: pack.stem || "",
      fnText: "f(x) = " + M.pretty(pack.fn.expr),
      part: part ? { label: part.label || "", text: (part.text || "") + (task && task.prompt ? " " + task.prompt : "") } : null,
      focusKind: task ? task.kind : "",
      sketch: input === "sketch",
      reference: task && task.kind === "fnLevel" ? { movable: true } : reference,
      choices: choices,
      family: pack.fn.degree >= 2 ? "parabola" : "line",
      figure: figure,
      ask: ask,
      input: input,
      domains: domains,
      hint: hintFor(pack, progress),
      pointHeading: pointHeading(pack, progress),
    };
  }

  function prepare(ex) {
    var fn = model().analyze(ex && ex.fn);
    if (!fn) return null;
    return {
      fn: fn,
      stem: (ex && ex.stem) || "",
      marks: (ex && ex.marks) || null,
      graph: !!(ex && ex.graph),
      labels: (ex && ex.labels) || null,
      parts: (ex && ex.parts) || [],
      tasks: (ex && ex.tasks) || [],
    };
  }

  function sketchPlaced(progress, task) {
    var phase = progress && progress.phase ? progress.phase[task.id] : "";
    var n = parseInt(phase, 10);
    return isFinite(n) && n > 0 ? n : 0;
  }

  function sketchAdvance(pack, progress) {
    var task = currentTask(pack, progress);
    if (!task || task.kind !== "fnSketch") return bad("אין עכשיו סעיף שרטוט.");
    var guide = model().sketchGuide(pack.fn);
    var placed = sketchPlaced(progress, task);
    var next = cloneProgress(progress);
    if (placed < guide.points.length) {
      var point = guide.points[placed];
      next.phase[task.id] = String(placed + 1);
      var markedWhy = "הנקודה מסומנת.";
      var vertexHere = model().vertex(pack.fn);
      if (vertexHere && model().near(point.x, vertexHere.x) && model().near(point.y, vertexHere.y)) {
        markedWhy = "מסמנים קודם את הקודקוד, כי ממנו נגזרים הכיוון והסימטריה.";
      } else if (model().near0(point.y)) {
        markedWhy = "מסמנים את החיתוך עם ציר ה־x שמצאתם.";
      } else if (model().near0(point.x)) {
        markedWhy = "מסמנים את החיתוך עם ציר ה־y.";
      }
      var marked = good(next, pack, pairText(point.x, point.y), markedWhy);
      marked.board = { points: guide.points.slice(0, placed + 1), line: null };
      return marked;
    }
    var board = { points: guide.points.slice(), line: guide.line || null, curve: guide.curve || null };
    var stray = offGraphPoint(pack.fn, board.points);
    if (stray) return bad("הנקודה " + pointLabel(stray) + " אינה על גרף הפונקציה.");
    var verdict = graph().validateSketch(board, model().sketchExpectations(pack.fn));
    if (!verdict.ok) return verdict;
    next.done[task.id] = true;
    next.phase[task.id] = "done";
    var drawn = good(next, pack, "שרטוט הגרף", pack.fn.degree >= 2 ? "פרבולה סימטרית דרך הנקודות, בכיוון שסימן a קובע." : (verdict.message || "השרטוט מתאים לפונקציה."));
    drawn.board = board;
    return drawn;
  }

  function solutionLines(pack) {
    var progress = freshProgress();
    var lines = [];
    var notes = [];
    var guard = 0;
    var last = "";
    var lastHead = "";
    while (guard < 160 && remaining(pack, progress).length) {
      var head = pointHeading(pack, progress);
      if (head && head !== lastHead) {
        lines.push("משימה:" + head);
        notes.push("");
        lastHead = head;
      }
      var task = currentTask(pack, progress);
      if (task && task.kind === "fnSketch") {
        var advanced = sketchAdvance(pack, progress);
        if (!advanced.ok) break;
        lines.push(advanced.show || "שרטוט הגרף");
        notes.push(advanced.message || "");
        progress = advanced.progress;
        guard += 1;
        continue;
      }
      var line = nextLine(pack, progress);
      if (!line || line === last) break;
      last = line;
      var result = checkTyped(pack, progress, line);
      if (!result.ok) break;
      lines.push(result.show || line);
      notes.push(result.message || "");
      progress = result.progress;
      guard += 1;
    }
    return { steps: lines, notes: notes };
  }

  global.DoctematicaFn = {
    prepare: prepare,
    freshProgress: freshProgress,
    viewFor: viewFor,
    hintFor: hintFor,
    nextLine: nextLine,
    checkTyped: checkTyped,
    checkDomainFields: checkDomainFields,
    checkSketch: checkSketch,
    checkSketchPoint: checkSketchPoint,
    sketchAdvance: sketchAdvance,
    solutionLines: solutionLines,
    currentPart: currentPart,
    currentTask: currentTask,
    pointHeading: pointHeading,
    pointHeadingFor: pointHeadingFor,
  };
})(window);
