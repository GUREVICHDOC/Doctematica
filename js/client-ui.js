(function (global) {
  function view() {
    return (global.DoctematicaUI && global.DoctematicaUI.view) || {};
  }

  function formatPartHtml(text) {
    var MathR = global.DoctematicaMath;
    if (MathR && typeof MathR.proseHTML === "function") {
      if (/\n/.test(String(text || ""))) {
        return String(text || "")
          .split(/\n/)
          .map(function (line) {
            var chunk = String(line || "").trim();
            return chunk ? MathR.proseHTML(chunk) : "";
          })
          .filter(Boolean)
          .join("<br>");
      }
      return MathR.proseHTML(text);
    }
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function capsHistoryLetters(s) {
    return String(s || "").replace(/[A-Za-z]+/g, function (w, offset, whole) {
      var next = String(whole || "").charAt(offset + w.length);
      if (/^[xyt]$/i.test(w)) return w.toLowerCase();
      if (/^b$/i.test(w) && next !== "(") return "b";
      if (/^m$/i.test(w) && next !== "(") return "m";
      if (/^d$/i.test(w) && next !== "(") return "d";
      if (/^m\d+$/i.test(w)) return "m" + w.slice(1);
      if (/^m(?:III|II|I)$/i.test(w)) return "m" + w.slice(1).toUpperCase();
      if (/^m[A-Za-z]{2,4}$/i.test(w)) return "m" + w.slice(1).toUpperCase();
      if (/^d[A-Za-z]{2,4}$/i.test(w)) return "d" + w.slice(1).toUpperCase();
      return w.toUpperCase();
    });
  }

  function unavailable() {
    return { ok: false, message: "הבדיקה לא זמינה כרגע." };
  }

  function parenNum(x) {
    var v = Number(x);
    if (!isFinite(v)) return String(x == null ? "" : x);
    return v < 0 ? "(" + v + ")" : String(v);
  }

  global.DoctematicaUI = global.DoctematicaUI || { view: null };

  if (!global.DoctematicaGeometry) {
    global.DoctematicaGeometry = {
      formatPartHtml: formatPartHtml,
      capsHistoryLetters: capsHistoryLetters,
      currentPartText: function () {
        return view().part || null;
      },
      currentFocusTask: function () {
        return view().focus || null;
      },
      taskStepLabel: function (task) {
        if (task && task.stepLabel) return task.stepLabel;
        var heading = view().headingTask;
        if (heading && task && heading.id === task.id) return heading.stepLabel || "";
        return "";
      },
      partHeadingTask: function () {
        return view().headingTask || null;
      },
      lineMatchPartActive: function () {
        return !!view().lineMatchActive;
      },
      lineAsk: function () {
        return view().ask || null;
      },
      reasonChoices: function () {
        var ask = view().ask;
        return (ask && ask.choices) || [];
      },
      sceneForProgress: function () {
        return view().scene || { points: [], segments: [] };
      },
      initDrawProgress: function (pack, progress) {
        if (progress && progress.draw && Array.isArray(progress.draw.heights)) return progress.draw;
        return view().draw || { heights: [], auxPoints: [], pickMode: null, note: null };
      },
      resolveDrawConfig: function () {
        return view().drawConfig || null;
      },
      drawPartActive: function () {
        return !!view().drawActive;
      },
      lineMatchPanelData: function () {
        return view().lineMatch || { lines: [], rows: [], hasDistractor: false };
      },
      lineMatchReasonOptions: function () {
        return view().reasonOptions || [];
      },
      givenLineText: function () {
        return view().givenText || null;
      },
      firstPartLineMatchOnly: function () {
        return !!view().firstPartLineMatchOnly;
      },
      onLinePlugReason: function () {
        return view().plugReason || "";
      },
      lineMatchAutoCompleteRemaining: function () {
        return [];
      },
      applyDistUnknownAlgebra: function () {
        return null;
      },
      checkTyped: function () {
        return unavailable();
      },
      nextHint: function () {
        return { message: "" };
      },
      submitReason: function () {
        return unavailable();
      },
      submitLineMatchLine: function () {
        return unavailable();
      },
      submitLineMatchReason: function () {
        return unavailable();
      },
      siteAddHeight: function () {
        return null;
      },
    };
  }

  if (!global.DoctematicaQuadratic) {
    global.DoctematicaQuadratic = {
      fmt: function (n) {
        return n == null ? "" : String(n);
      },
      fmtDisp: function (n) {
        return n == null ? "" : String(n);
      },
      kindLabel: function (kind) {
        if (kind === "none") return "אין פתרון ממשי";
        if (kind === "one") return "פתרון ממשי אחד";
        return "שני פתרונות ממשיים";
      },
      discExpr: function (a, b, c) {
        return parenNum(b) + "² − 4·" + parenNum(a) + "·" + parenNum(c);
      },
      numWant: function (want, sign) {
        want = want || {};
        if (sign < 0) return want.numWantNeg != null ? want.numWantNeg : "";
        return want.numWant != null ? want.numWant : "";
      },
      denWant: function (want) {
        return want && want.denWant != null ? want.denWant : "";
      },
      rootNumExpr: function (want, sign) {
        want = want || {};
        if (sign < 0) return want.rootNumNeg || "";
        return want.rootNum || "";
      },
      rootWant: function (want, sign) {
        want = want || {};
        if (sign < 0) return want.rootWantNeg;
        return want.rootWant;
      },
    };
  }

  if (!global.DoctematicaAlgebra) {
    global.DoctematicaAlgebra = {
      formatNumber: function (n) {
        if (n == null || !isFinite(Number(n))) return "";
        var r = Math.round(Number(n) * 1000000) / 1000000;
        return String(r);
      },
      missingEqualsSign: function () {
        return false;
      },
    };
  }

  if (!global.DoctematicaTeach) global.DoctematicaTeach = {};

  if (!global.DoctematicaSystems) {
    global.DoctematicaSystems = {
      fmt: function (n) {
        return global.DoctematicaAlgebra.formatNumber(n);
      },
    };
  }
})(window);
