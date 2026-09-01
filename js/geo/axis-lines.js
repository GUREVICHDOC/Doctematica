(function (global) {
  function install(dep) {
    var fmtNum = dep.fmtNum;
    var nearNum = dep.nearNum;
    var getPoint = dep.getPoint;
    var parseConstAxisEq = dep.parseConstAxisEq;
    var currentPartText = dep.currentPartText;
    var finishLineEq = dep.finishLineEq;

    function axisLineDir(task) {
      var a = String((task && task.axisParallel) || "").toLowerCase();
      if (a === "x" || a === "h") return "x";
      if (a === "y" || a === "v") return "y";
      return "";
    }

    function axisLineConst(task) {
      var dir = axisLineDir(task);
      if (dir === "x") {
        if (task && task.b != null && isFinite(task.b)) return Number(task.b);
        if (task && task.y != null && isFinite(task.y)) return Number(task.y);
      }
      if (dir === "y") {
        if (task && task.vertical != null && isFinite(task.vertical)) return Number(task.vertical);
        if (task && task.x != null && isFinite(task.x)) return Number(task.x);
      }
      return null;
    }

    function axisLineEqText(task) {
      var k = axisLineConst(task);
      if (k == null) return "";
      return (axisLineDir(task) === "y" ? "x = " : "y = ") + fmtNum(k);
    }

    function axisLineComplete(typed, task) {
      var dir = axisLineDir(task);
      var k = axisLineConst(task);
      if (!dir || k == null) return false;
      var got = parseConstAxisEq(typed);
      if (!got) return false;
      var wantAxis = dir === "y" ? "x" : "y";
      return got.axis === wantAxis && nearNum(got.value, k);
    }

    function axisLineHintMessage(task, pack) {
      var dir = axisLineDir(task);
      var eq = axisLineEqText(task);
      var k = axisLineConst(task);
      var why = "";
      if (task && task.from && task.to && pack && pack.map) {
        var p1 = getPoint(pack.map, task.from);
        var p2 = getPoint(pack.map, task.to);
        if (p1 && p2) {
          if (dir === "x") {
            why = "לשתי הנקודות אותו שיעור y (" + fmtNum(p1.y) + ") — הישר מקביל לציר x. ";
          } else {
            why = "לשתי הנקודות אותו שיעור x (" + fmtNum(p1.x) + ") — הישר מקביל לציר y. ";
          }
        }
      }
      if (!why && task && task.givenEq) {
        var g = parseConstAxisEq(task.givenEq);
        var givenShow = String(task.givenEq).replace(/-/g, "−");
        if (g && g.axis === "y" && dir === "x") {
          why = "הישר " + givenShow + " מקביל לציר x, ולכן גם הישר המבוקש מקביל לציר x. ";
        } else if (g && g.axis === "x" && dir === "y") {
          why = "הישר " + givenShow + " מקביל לציר y, ולכן גם הישר המבוקש מקביל לציר y. ";
        }
        var gpt = task.point ? String(task.point).toUpperCase() : "";
        if (why && gpt && k != null) {
          why +=
            "הישר עובר ב־" +
            gpt +
            ", לכן " +
            (dir === "y" ? "x" : "y") +
            " = " +
            fmtNum(k) +
            ". ";
        }
      }
      if (!why) {
        var pt = task && task.point ? String(task.point).toUpperCase() : "";
        if (task && task.axisPerp === "x") {
          why = "מאונך לציר x פירושו מקביל לציר y, ולכן כל הנקודות עם אותו x. ";
        } else if (task && task.axisPerp === "y") {
          why = "מאונך לציר y פירושו מקביל לציר x, ולכן כל הנקודות עם אותו y. ";
        } else if (dir === "x") {
          why = "ישר מקביל לציר x: כל הנקודות עם אותו y. ";
        } else if (dir === "y") {
          why = "ישר מקביל לציר y: כל הנקודות עם אותו x. ";
        }
        if (pt && k != null) {
          why +=
            "הישר עובר ב־" +
            pt +
            ", לכן " +
            (dir === "y" ? "x" : "y") +
            " = " +
            fmtNum(k) +
            ". ";
        }
      }
      return why + "רשמו " + eq + ".";
    }

    function axisLineWrongMessage(typed, task) {
      var dir = axisLineDir(task);
      var eq = axisLineEqText(task);
      var got = parseConstAxisEq(typed);
      if (got && dir === "x" && got.axis === "x") {
        return "ישר מקביל לציר x (או מאונך לציר y) נכתב y = מספר, לא x = …. " + axisLineHintMessage(task, null);
      }
      if (got && dir === "y" && got.axis === "y") {
        return "ישר מקביל לציר y (או מאונך לציר x) נכתב x = מספר, לא y = …. " + axisLineHintMessage(task, null);
      }
      return "עוד לא. " + (eq ? "המשוואה היא " + eq + "." : axisLineHintMessage(task, null));
    }

    function checkAxisLineEq(raw, pack, progress, task, pendingEq, doneMap, partialMap, coordsMap) {
      if (!raw) return null;
      if (axisLineComplete(raw, task)) {
        return finishLineEq(task, axisLineEqText(task), doneMap, partialMap, coordsMap, pack, progress);
      }
      var partIds = ((currentPartText(pack, progress) || {}).taskIds) || [];
      var axisSkip = (pendingEq || []).filter(function (u) {
        return (
          u.id !== task.id &&
          axisLineDir(u) &&
          partIds.indexOf(u.id) >= 0 &&
          axisLineComplete(raw, u)
        );
      })[0];
      if (axisSkip) {
        return finishLineEq(axisSkip, axisLineEqText(axisSkip), doneMap, partialMap, coordsMap, pack, progress);
      }
      if (parseConstAxisEq(raw) || /^[xy]/i.test(String(raw).replace(/\s+/g, ""))) {
        return { ok: false, message: axisLineWrongMessage(raw, task) };
      }
      return null;
    }

    function axisLineNextHint(pack, progress, t) {
      return {
        task: t,
        message: axisLineHintMessage(t, pack),
        step: axisLineEqText(t),
        answer: axisLineEqText(t),
        rawStep: true,
      };
    }

    return {
      axisLineDir: axisLineDir,
      axisLineConst: axisLineConst,
      axisLineEqText: axisLineEqText,
      axisLineComplete: axisLineComplete,
      axisLineHintMessage: axisLineHintMessage,
      axisLineWrongMessage: axisLineWrongMessage,
      checkAxisLineEq: checkAxisLineEq,
      axisLineNextHint: axisLineNextHint,
    };
  }

  global.DoctematicaGeoAxisLines = { install: install };
})(window);
