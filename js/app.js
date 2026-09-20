(function () {
  var STORAGE_KEY = "doctematica-stats-v1";
  var topicsEl = document.getElementById("topics");
  var subtopicsEl = document.getElementById("subtopics");
  var subtopicsWrap = document.getElementById("subtopics-wrap");
  var levelEl = document.getElementById("level");
  var promptEl = document.getElementById("prompt");
  var topicLabelEl = document.getElementById("topic-label");
  var scoreEl = document.getElementById("score");
  var formEl = document.getElementById("answer-form");
  var answerEl = document.getElementById("answer");
  var answerLabelEl = document.getElementById("answer-label");
  var hintEl = document.getElementById("hint");
  var feedbackEl = document.getElementById("feedback");
  var newBtn = document.getElementById("new-problem");
  var stepsEl = document.getElementById("steps");
  var checkBtn = document.getElementById("check");

  var kindsEl = document.getElementById("kinds");
  var kindsWrap = document.getElementById("kinds-wrap");
  var bankCountEl = document.getElementById("bank-count");
  var eqActions = document.getElementById("eq-actions");
  var showSolutionBtn = document.getElementById("show-solution");
  var hintBtn = document.getElementById("hint-btn");
  var oneStepBtn = document.getElementById("one-step-btn");
  var nextAfterSolveBtn = document.getElementById("next-after-solve");
  var modelEl = document.getElementById("model");
  var sourcesEl = document.getElementById("sources");
  var sourcesWrap = document.getElementById("sources-wrap");
  var randomWrap = document.getElementById("random-wrap");
  var worksheetNav = document.getElementById("worksheet-nav");
  var instructionEl = document.getElementById("instruction");
  var exerciseNumsEl = document.getElementById("exercise-nums");
  var prevExBtn = document.getElementById("prev-ex");
  var nextExBtn = document.getElementById("next-ex");

  var mathFieldEl = document.getElementById("math-field");
  var mathKeysEl = document.getElementById("math-keys");
  var yesnoAskEl = document.getElementById("yesno-ask");
  var yesnoQEl = document.getElementById("yesno-q");
  var yesBtn = document.getElementById("yes-btn");
  var noBtn = document.getElementById("no-btn");
  var reasonBoxEl = document.getElementById("reason-box");
  var reasonInput = document.getElementById("reason-input");
  var reasonCheckBtn = document.getElementById("reason-check");
  var reasonChoicesEl = document.getElementById("reason-choices");
  var answerRowEl = document.getElementById("answer-row");
  var mathWrap = document.getElementById("math-wrap");
  var mathField = new DoctematicaMathField(mathFieldEl, mathKeysEl);
  var sysGuideEl = document.getElementById("sys-guide");
  var sysKnownEl = document.getElementById("sys-known");
  var solveWrap = document.getElementById("solve-wrap");
  var geoBoardEl = document.getElementById("geo-board");
  var geoPartEl = document.getElementById("geo-part");
  var lineMatchPanelEl = document.getElementById("line-match-panel");
  var coordBoard = geoBoardEl ? new DoctematicaCoordBoard(geoBoardEl) : null;
  var quadGuideEl = document.getElementById("quad-guide");
  var factorGuideEl = document.getElementById("factor-guide");
  var splitEqsBtn = document.getElementById("split-eqs-btn");
  var useFormulaBtn = document.getElementById("use-formula-btn");
  var md53Btn = document.getElementById("md53-btn");
  var lcdBtn = document.getElementById("lcd-btn");
  var domainBtn = document.getElementById("domain-btn");
  var splitDomainBtn = document.getElementById("split-domain-btn");
  var domainGuideEl = document.getElementById("domain-guide");
  var lcdGuideEl = document.getElementById("lcd-guide");

  var state = {
    topic: "equations",
    subtopic: "basic",
    source: "worksheet",
    levelId: "level-01",
    exerciseIndex: 0,
    kind: "all",
    problem: null,
    locked: false,
    streak: 0,
    history: [],
    mixed: { path: null },
    lcd: null,
    lcdMarks: {},
    domain: null,
    geo: { done: {} },
    stats: loadStats(),
  };

  function typedAnswer() {
    if (domainPending() && domainMulti()) return readDomainCellTyped();
    if (isGuidedMode()) {
      var fromField = mathField.serialize();
      if (fromField) return fromField;
      var live = mathFieldEl && mathFieldEl.querySelector("input.ml-text, input");
      return live ? String(live.value || "").trim() : "";
    }
    return answerEl.value;
  }

  function readDomainCellTyped() {
    if (!domainGuideEl || !state.domain) return "";
    var idx = state.domain.activeBranch || 0;
    var inp = domainGuideEl.querySelector('.domain-cell-input[data-domain-branch="' + idx + '"]');
    return inp ? String(inp.value || "").trim() : "";
  }

  function insertAtInputCursor(input, text) {
    if (!input) return;
    var start = input.selectionStart != null ? input.selectionStart : input.value.length;
    var end = input.selectionEnd != null ? input.selectionEnd : start;
    var val = input.value;
    input.value = val.slice(0, start) + text + val.slice(end);
    var pos = start + text.length;
    input.setSelectionRange(pos, pos);
    input.focus();
  }

  function focusActiveDomainInput() {
    if (!domainGuideEl) return;
    var inp = domainGuideEl.querySelector(".domain-cell-input.is-active");
    if (inp) inp.focus();
  }

  function wireDomainMathKeys() {
    if (!mathKeysEl || state.domainKeysWired) return;
    state.domainKeysWired = true;
    mathKeysEl.addEventListener(
      "click",
      function (event) {
        if (!domainPending() || !domainMulti()) return;
        var btn = event.target.closest("button.math-action");
        if (!btn) return;
        var inp = domainGuideEl && domainGuideEl.querySelector(".domain-cell-input.is-active");
        if (!inp) return;
        var labelEl = btn.querySelector("span:last-child");
        var label = labelEl ? labelEl.textContent : "";
        if (label === "שונה") {
          event.stopImmediatePropagation();
          event.preventDefault();
          insertAtInputCursor(inp, "≠");
        } else if (label === "±") {
          event.stopImmediatePropagation();
          event.preventDefault();
          insertAtInputCursor(inp, "±");
        }
      },
      true
    );
  }

  function loadStats() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ok: 0, try: 0, best: 0 };
      return JSON.parse(raw);
    } catch (e) {
      return { ok: 0, try: 0, best: 0 };
    }
  }

  function saveStats() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats));
  }

  function isStepMode() {
    return state.topic === "equations" && (state.subtopic === "basic" || state.subtopic === "denom");
  }

  var EQUATIONS_URL = "http://127.0.0.1:8787/api/equations";
  var QUADRATIC_URL = "http://127.0.0.1:8787/api/quadratic";
  var HIGH_POWER_URL = "http://127.0.0.1:8787/api/high-power";
  var SYSTEMS_URL = "http://127.0.0.1:8787/api/systems";
  var GEOMETRY_URL = "http://127.0.0.1:8787/api/geometry";
  var equationsCheckBusy = false;

  function isBasicEqServerMode() {
    return state.topic === "equations" && state.subtopic === "basic" && !geoEqSolveActive();
  }

  function isDenomServerMode() {
    return state.topic === "equations" && state.subtopic === "denom" && !geoEqSolveActive();
  }

  function isSqrtServerMode() {
    return isSqrtEqMode() && !geoEqSolveActive();
  }

  function isFactorServerMode() {
    var level = currentLevel();
    return (
      isQuadraticTopic() &&
      !!level &&
      level.mode === "quad-factor" &&
      !geoEqSolveActive()
    );
  }

  function isFormulaServerMode() {
    return isQuadMode() && !geoEqSolveActive();
  }

  function isMixedServerMode() {
    return isMixedEqMode() && !geoEqSolveActive();
  }

  function quadraticSubtopic() {
    if (isMixedServerMode()) return "mixed";
    if (isFactorServerMode()) return "factor";
    if (isFormulaServerMode()) return "formula";
    if (isSqrtServerMode()) return "sqrt";
    return null;
  }

  function isQuadraticServerMode() {
    return !!quadraticSubtopic();
  }

  function isHighRootServerMode() {
    return isHighRootEqMode();
  }

  function isHighFactorServerMode() {
    var level = currentLevel();
    return (
      isHighPowerTopic() &&
      !!level &&
      level.mode === "high-factor" &&
      !geoEqSolveActive()
    );
  }

  function highPowerSubtopic() {
    if (isHighRootServerMode()) return "root";
    if (isHighFactorServerMode()) return "factor";
    return null;
  }

  function isDomainLcdServerMode() {
    return isDenomServerMode() || isMixedServerMode();
  }

  function denomDomainPayload() {
    if (!state.domain || !state.domain.needed) return { trail: [] };
    return {
      trail: state.domain.trail || [],
      progressItems: domainProgressItems(),
      split: !!state.domain.split,
      activeBranch: state.domain.activeBranch || 0,
    };
  }

  function lcdInfoFromSnap(snap) {
    if (!snap || !snap.needed) return null;
    return {
      lcd: snap.lcd,
      algebraic: !!snap.algebraic,
      leftTerms: snap.leftTerms || [],
      rightTerms: snap.rightTerms || [],
      terms: snap.terms || [],
      dens: snap.dens,
    };
  }

  function applyLcdOffer(remote) {
    if (!isDomainLcdServerMode()) return;
    if (remote && remote.lcd) {
      state.lcdOfferNeeded = !!remote.lcd.needed;
    }
  }

  function snapshotLinearCheck(result) {
    result = result || {};
    return {
      ok: !!result.ok,
      solved: !!result.solved,
      same: !!result.same,
      errorId: result.errorId || null,
      message: String(result.message || ""),
    };
  }

  function showBasicEqServerUnavailable() {
    showFeedback(
      false,
      "<strong>הבדיקה לא זמינה כרגע.</strong> שרת הבדיקה לא מגיב. הפעילו אותו ואז נסו שוב."
    );
  }

  function showGeometryProcessingError() {
    showFeedback(
      false,
      "<strong>הבדיקה נכשלה.</strong> שגיאה בעיבוד בשרת. זה לא אומר שהשרת כבוי — נסו שוב."
    );
  }

  function requestBasicEqAction(payload, onResult) {
    var intent = String((payload && payload.intent) || "");
    if (isBasicEqServerMode()) {
      /* all basic intents */
    } else if (isDenomServerMode()) {
      /* denom: equation / domain / LCD — server-authoritative */
    } else {
      return false;
    }
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    var body = {
      topic: "equations",
      subtopic: state.subtopic,
      intent: intent,
      start: payload.start,
      history: payload.history,
      previous: payload.previous,
      typed: payload.typed,
    };
    if (isDenomServerMode()) {
      body.domain = payload.domain || denomDomainPayload();
      if (payload.lcd) body.lcd = payload.lcd;
      if (payload.termIndex != null) body.termIndex = payload.termIndex;
      if (payload.lcdMarks) body.lcdMarks = true;
    }
    fetch(EQUATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("equations http " + res.status);
        return res.json();
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        applyLcdOffer(remote || {});
        onResult(remote || {});
      })
      .catch(function () {
        equationsCheckBusy = false;
        showBasicEqServerUnavailable();
      });
    return true;
  }

  function requestQuadraticAction(payload, onResult) {
    var subtopic = payload.subtopic || quadraticSubtopic();
    if (!subtopic) return false;
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    var body = {
      topic: "quadratic",
      subtopic: subtopic,
      intent: payload.intent,
      start: payload.start,
      history: payload.history,
      previous: payload.previous,
      typed: payload.typed,
    };
    if (payload.factor) body.factor = payload.factor;
    if (payload.phase) body.phase = payload.phase;
    if (payload.letter) body.letter = payload.letter;
    if (payload.slots) body.slots = payload.slots;
    if (payload.root) body.root = payload.root;
    if (payload.compute) body.compute = payload.compute;
    if (payload.picked != null) body.picked = payload.picked;
    if (payload.md53) body.md53 = true;
    if (payload.domain) body.domain = payload.domain;
    if (payload.lcd) body.lcd = payload.lcd;
    if (payload.termIndex != null) body.termIndex = payload.termIndex;
    if (payload.lcdMarks) body.lcdMarks = true;
    fetch(QUADRATIC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("quadratic http " + res.status);
        return res.json();
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        applyLcdOffer(remote || {});
        onResult(remote || {});
      })
      .catch(function () {
        equationsCheckBusy = false;
        showBasicEqServerUnavailable();
      });
    return true;
  }

  function isGeoLengthKind(kind) {
    return kind === "origin" || kind === "segment" || kind === "axis" || kind === "distSeg";
  }

  function isGeoAreaKind(kind) {
    return kind === "area";
  }

  function isGeoPointPage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-line-points-1" || id === "geo-line-axis-1";
  }

  function isGeoPointKind(kind) {
    return kind === "point" || kind === "onLine" || kind === "freePoint" || kind === "noIntercept";
  }

  function isGeoLineMbPage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-line-mb-1";
  }

  function isGeoLineMatchPage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-line-match-1";
  }

  function isGeoLineIntersectPage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-line-intersect-1";
  }

  function isGeoSummaryPage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-line-summary-1";
  }

  function isGeoLineEqPage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-line-eq-1";
  }

  function isGeoSlopePage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-slope-1";
  }

  function isGeoParallelPage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-parallel-1";
  }

  function isGeoAxisLinesPage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-axis-lines-1";
  }

  function isGeoMidpointPage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-midpoint-1";
  }

  function isGeoPerpPage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-perp-1";
  }

  function isGeoDistancePage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return id === "geo-distance-1";
  }

  function isGeoPracticeServerPage() {
    return (
      isGeoPointPage() ||
      isGeoSummaryPage() ||
      isGeoParallelPage() ||
      isGeoAxisLinesPage() ||
      isGeoMidpointPage() ||
      isGeoPerpPage() ||
      isGeoDistancePage()
    );
  }

  function isAxisParallelTask(task) {
    var a = String((task && task.axisParallel) || "").toLowerCase();
    return a === "x" || a === "h" || a === "y" || a === "v";
  }

  function isGeoServerKind(kind) {
    if (isGeoLengthKind(kind) || isGeoAreaKind(kind)) return true;
    if (isGeoPracticeServerPage() && isGeoPointKind(kind)) return true;
    if ((isGeoLineMbPage() || isGeoParallelPage()) && kind === "lineMb") return true;
    if ((isGeoLineMatchPage() || isGeoSummaryPage() || isGeoParallelPage()) && kind === "lineMatch") return true;
    if (
      (isGeoLineIntersectPage() || isGeoSummaryPage() || isGeoParallelPage() || isGeoAxisLinesPage() || isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage()) &&
      (kind === "lineIntersect" || kind === "rearrange")
    ) {
      return true;
    }
    if ((isGeoLineEqPage() || isGeoParallelPage() || isGeoAxisLinesPage() || isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage()) && kind === "lineEq") return true;
    if ((isGeoSlopePage() || isGeoParallelPage() || isGeoAxisLinesPage() || isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage()) && kind === "slope") return true;
    if (isGeoParallelPage() && kind === "parallel") return true;
    if (isGeoAxisLinesPage() && kind === "yesNo") return true;
    if (isGeoMidpointPage() && (kind === "midpoint" || kind === "yesNo")) return true;
    if ((isGeoPerpPage() || isGeoDistancePage()) && kind === "midpoint") return true;
    if (isGeoPerpPage() && (kind === "perpendicular" || kind === "yesNo")) return true;
    if (isGeoDistancePage() && (kind === "distance" || kind === "equalLen" || kind === "distUnknown" || kind === "perimeter")) return true;
    if (isGeoDistancePage() && kind === "perpendicular") return true;
    return false;
  }

  function geoServerCapability(kind) {
    if (isGeoAreaKind(kind)) return "areas";
    if (isGeoPointKind(kind) && isGeoPracticeServerPage()) return "points";
    if (kind === "lineMb" && (isGeoLineMbPage() || isGeoParallelPage())) return "line-mb";
    if (kind === "lineMatch" && (isGeoLineMatchPage() || isGeoSummaryPage() || isGeoParallelPage())) return "line-match";
    if (
      (kind === "lineIntersect" || kind === "rearrange") &&
      (isGeoLineIntersectPage() || isGeoSummaryPage() || isGeoParallelPage() || isGeoAxisLinesPage() || isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage())
    ) {
      return "line-intersect";
    }
    if (kind === "yesNo" && isGeoMidpointPage()) return "midpoint";
    if (kind === "yesNo" && (isGeoAxisLinesPage() || isGeoPerpPage())) return "axis-lines";
    if (kind === "lineEq" && (isGeoAxisLinesPage() || isGeoPerpPage() || isGeoDistancePage())) {
      var axisPack = state.problem && state.problem.geo;
      var axisFocus =
        axisPack &&
        DoctematicaGeometry.currentFocusTask &&
        DoctematicaGeometry.currentFocusTask(axisPack, state.geo);
      if (isAxisParallelTask(axisFocus)) return "axis-lines";
      if (isGeoAxisLinesPage()) return "line-eq";
    }
    if (kind === "lineEq" && (isGeoLineEqPage() || isGeoParallelPage() || isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage())) {
      return "line-eq";
    }
    if (kind === "slope" && (isGeoPerpPage() || isGeoDistancePage())) {
      var slPack = state.problem && state.problem.geo;
      var slFocus =
        slPack &&
        DoctematicaGeometry.currentFocusTask &&
        DoctematicaGeometry.currentFocusTask(slPack, state.geo);
      if ((slFocus && slFocus.perpendicular) || (kind === "slope" && slFocus && slFocus.kind === "slope" && slFocus.perpendicular)) {
        return "perpendicular";
      }
      return "slope";
    }
    if (kind === "slope" && (isGeoSlopePage() || isGeoParallelPage() || isGeoAxisLinesPage() || isGeoMidpointPage())) return "slope";
    if (kind === "midpoint" && (isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage())) return "midpoint";
    if (kind === "parallel" && isGeoParallelPage()) return "parallel";
    if (kind === "perpendicular" && (isGeoPerpPage() || isGeoDistancePage())) return "perpendicular";
    if ((kind === "distance" || kind === "equalLen" || kind === "distUnknown" || kind === "perimeter") && isGeoDistancePage()) {
      return "distance";
    }
    if (isGeoLengthKind(kind)) return "lengths";
    var pack = state.problem && state.problem.geo;
    var focus =
      pack &&
      DoctematicaGeometry.currentFocusTask &&
      DoctematicaGeometry.currentFocusTask(pack, state.geo);
    if (isGeoPracticeServerPage() && isGeoPointKind(focus && focus.kind)) return "points";
    if (isGeoAreaKind(focus && focus.kind)) return "areas";
    if (isGeoLengthKind(focus && focus.kind)) return "lengths";
    if (isGeoLineMbPage()) return "line-mb";
    if (isGeoLineMatchPage()) return "line-match";
    if (isGeoLineIntersectPage()) return "line-intersect";
    if (isGeoSummaryPage()) {
      if (focus && focus.kind === "lineMatch") return "line-match";
      if (focus && (focus.kind === "lineIntersect" || focus.kind === "rearrange")) return "line-intersect";
      return "points";
    }
    if (isGeoLineEqPage()) return "line-eq";
    if (isGeoSlopePage()) return "slope";
    if (isGeoParallelPage()) {
      if (focus && focus.kind === "lineMatch") return "line-match";
      if (focus && (focus.kind === "lineIntersect" || focus.kind === "rearrange")) return "line-intersect";
      if (focus && focus.kind === "lineEq") return "line-eq";
      if (focus && focus.kind === "slope") return "slope";
      if (focus && focus.kind === "lineMb") return "line-mb";
      if (focus && isGeoPointKind(focus.kind)) return "points";
      return "parallel";
    }
    if (isGeoAxisLinesPage()) {
      if (focus && (focus.kind === "lineIntersect" || focus.kind === "rearrange")) return "line-intersect";
      if (focus && isAxisParallelTask(focus)) return "axis-lines";
      if (focus && focus.kind === "yesNo") return "axis-lines";
      if (focus && focus.kind === "lineEq") return "line-eq";
      if (focus && focus.kind === "slope") return "slope";
      if (focus && isGeoPointKind(focus.kind)) return "points";
      return "axis-lines";
    }
    if (isGeoMidpointPage()) {
      if (!focus) {
        var midPack = state.problem && state.problem.geo;
        var midPending = (midPack && midPack.tasks) || [];
        var mi;
        for (mi = 0; mi < midPending.length; mi++) {
          var mt = midPending[mi];
          if (mt && !mt.optional && !(state.geo && state.geo.done && state.geo.done[mt.id])) {
            focus = mt;
            break;
          }
        }
      }
      if (focus && isGeoPointKind(focus.kind)) return "points";
      if (focus && focus.kind === "slope") return "slope";
      if (focus && focus.kind === "lineEq") return "line-eq";
      if (focus && (focus.kind === "lineIntersect" || focus.kind === "rearrange")) return "line-intersect";
      if (focus && isGeoAreaKind(focus.kind)) return "areas";
      if (focus && isGeoLengthKind(focus.kind)) return "lengths";
      return "midpoint";
    }
    if (isGeoPerpPage() || isGeoDistancePage()) {
      if (!focus) {
        var lastPack = state.problem && state.problem.geo;
        var lastPending = (lastPack && lastPack.tasks) || [];
        var li;
        for (li = 0; li < lastPending.length; li++) {
          var lt = lastPending[li];
          if (lt && !lt.optional && !(state.geo && state.geo.done && state.geo.done[lt.id])) {
            focus = lt;
            break;
          }
        }
      }
      if (focus && isGeoPointKind(focus.kind)) return "points";
      if (focus && (focus.kind === "lineIntersect" || focus.kind === "rearrange")) return "line-intersect";
      if (focus && isAxisParallelTask(focus)) return "axis-lines";
      if (focus && focus.kind === "lineEq") return "line-eq";
      if (focus && focus.kind === "slope" && focus.perpendicular) return "perpendicular";
      if (focus && focus.kind === "slope") return "slope";
      if (focus && focus.kind === "midpoint") return "midpoint";
      if (focus && focus.kind === "yesNo") return "axis-lines";
      if (focus && focus.kind === "perpendicular") return "perpendicular";
      if (focus && (focus.kind === "distance" || focus.kind === "equalLen" || focus.kind === "distUnknown" || focus.kind === "perimeter")) {
        return "distance";
      }
      if (focus && isGeoAreaKind(focus.kind)) return "areas";
      if (focus && isGeoLengthKind(focus.kind)) return "lengths";
      return isGeoDistancePage() ? "distance" : "perpendicular";
    }
    return "lengths";
  }

  function isGeoLengthsServerActive() {
    if (!isGeoLengthMode() || geoEqSolveActive()) return false;
    var pack = state.problem && state.problem.geo;
    if (!pack) return false;
    if (
      DoctematicaGeometry.lineMatchPartActive &&
      DoctematicaGeometry.lineMatchPartActive(pack, state.geo)
    ) {
      return isGeoLineMatchPage() || isGeoSummaryPage() || isGeoParallelPage();
    }
    var ask = DoctematicaGeometry.lineAsk && DoctematicaGeometry.lineAsk(pack, state.geo);
    if (ask) {
      if (ask.task && isGeoServerKind(ask.task.kind)) {
        /* keep server for parallel yes/no and other migrated asks */
      } else if (
        !((isGeoPointPage() || isGeoSummaryPage() || isGeoAxisLinesPage() || isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage()) && ask.task && isGeoPointKind(ask.task.kind))
      ) {
        return false;
      }
    }
    var focus =
      DoctematicaGeometry.currentFocusTask &&
      DoctematicaGeometry.currentFocusTask(pack, state.geo);
    if (focus) return isGeoServerKind(focus.kind);
    var pending = [];
    var part =
      DoctematicaGeometry.currentPartText &&
      DoctematicaGeometry.currentPartText(pack, state.geo);
    var ids = (part && part.taskIds) || [];
    if (ids.length) {
      pending = ids
        .map(function (id) {
          return (pack.tasks || []).filter(function (t) {
            return t.id === id;
          })[0];
        })
        .filter(function (t) {
          return t && !(state.geo && state.geo.done && state.geo.done[t.id]);
        });
    } else {
      pending = (pack.tasks || []).filter(function (t) {
        return !(state.geo && state.geo.done && state.geo.done[t.id]);
      });
    }
    return !!(pending[0] && isGeoServerKind(pending[0].kind));
  }

  function geoClientMaps() {
    var g = state.geo || {};
    return {
      done: g.done || {},
      partial: g.partial || {},
      lastExpr: g.lastExpr || {},
      coords: g.coords || {},
      footCoords: g.footCoords || {},
      lineEq: g.lineEq || {},
      intersect: g.intersect || {},
      pointRoute: g.pointRoute || {},
      lineMatch: g.lineMatch || {},
      distUnk: g.distUnk || {},
      draw: g.draw || null,
    };
  }

  function requestGeometryAction(payload, onResult) {
    if (!isGeoLengthMode()) return false;
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    var rawBody;
    try {
      var body = {
        topic: "analytic",
        capability: payload.capability || geoServerCapability(payload.kind),
        intent: payload.intent,
        levelId: (state.problem && state.problem.levelId) || state.levelId,
        n: state.problem && state.problem.n,
        exerciseIndex: state.exerciseIndex,
        history: payload.history != null ? payload.history : (state.geo && state.geo.lengthLog) || [],
        geo: payload.geo || geoClientMaps(),
      };
      if (payload.typed != null) body.typed = payload.typed;
      if (payload.action) body.action = payload.action;
      rawBody = JSON.stringify(body);
    } catch (err) {
      equationsCheckBusy = false;
      showGeometryProcessingError();
      return true;
    }
    fetch(GEOMETRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody,
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try {
            data = text ? JSON.parse(text) : {};
          } catch (err) {
            data = null;
          }
          if (!res.ok) {
            var httpErr = new Error("geometry http " + res.status);
            httpErr.status = res.status;
            httpErr.body = data;
            throw httpErr;
          }
          if (data == null) {
            var jsonErr = new Error("geometry bad json");
            jsonErr.status = res.status || 500;
            throw jsonErr;
          }
          return data;
        });
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        try {
          onResult(remote || {});
        } catch (err) {
          showGeometryProcessingError();
        }
      })
      .catch(function (err) {
        equationsCheckBusy = false;
        if (err && err.status) showGeometryProcessingError();
        else showBasicEqServerUnavailable();
      });
    return true;
  }

  function requestSystemsAction(payload, onResult) {
    if (!isSystemMode()) return false;
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    var body = {
      topic: "systems-sub",
      intent: payload.intent,
      eq1: (state.problem && state.problem.eq1) || payload.eq1,
      eq2: (state.problem && state.problem.eq2) || payload.eq2,
      history: payload.history != null ? payload.history : state.history || [],
      choices: payload.choices != null ? payload.choices : (state.sys && state.sys.choices) || [],
    };
    if (payload.typed != null) body.typed = payload.typed;
    if (payload.choice) body.choice = payload.choice;
    if (payload.confirm) body.confirm = true;
    fetch(SYSTEMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("systems http " + res.status);
        return res.json();
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        onResult(remote || {});
      })
      .catch(function () {
        equationsCheckBusy = false;
        showBasicEqServerUnavailable();
      });
    return true;
  }

  function requestHighPowerAction(payload, onResult) {
    var subtopic = payload.subtopic || highPowerSubtopic();
    if (!subtopic) return false;
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    var body = {
      topic: "high-power",
      subtopic: subtopic,
      intent: payload.intent,
      start: payload.start,
      history: payload.history,
      previous: payload.previous,
      typed: payload.typed,
    };
    if (payload.factor) body.factor = payload.factor;
    fetch(HIGH_POWER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("high-power http " + res.status);
        return res.json();
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        onResult(remote || {});
      })
      .catch(function () {
        equationsCheckBusy = false;
        showBasicEqServerUnavailable();
      });
    return true;
  }

  function requestDomainLcdAction(payload, onResult) {
    if (isDenomServerMode()) return requestBasicEqAction(payload, onResult);
    if (isMixedServerMode()) return requestQuadraticAction(payload, onResult);
    return false;
  }

  function requestBasicEqCheck(previous, typed, onResult) {
    return requestBasicEqAction(
      {
        intent: "check",
        start: (state.problem && state.problem.startEquation) || previous,
        history: state.history && state.history.length ? state.history : [previous],
        previous: previous,
        typed: typed,
      },
      function (remote) {
        applyLcdOffer(remote);
        var snap = snapshotLinearCheck(remote);
        onResult(snap);
      }
    );
  }

  function isSystemMode() {
    return state.topic === "systems-sub";
  }

  function isHighPowerTopic() {
    return state.topic === "high-power";
  }

  function isAnalyticTopic() {
    return state.topic === "analytic";
  }

  function isGeoLengthMode() {
    var level = currentLevel();
    return (
      isAnalyticTopic() &&
      !!level &&
      level.mode === "geo-length" &&
      state.problem &&
      state.problem.mode === "geo-length"
    );
  }

  function isQuadraticTopic() {
    return state.topic === "quadratic";
  }

  function isQuadMode() {
    var level = currentLevel();
    return (
      isQuadraticTopic() &&
      !!level &&
      level.mode === "quad-formula" &&
      level.exercises &&
      level.exercises.length > 0
    );
  }

  function isSqrtEqMode() {
    var level = currentLevel();
    return (
      isQuadraticTopic() &&
      !!level &&
      level.mode === "quad-sqrt" &&
      level.exercises &&
      level.exercises.length > 0
    );
  }

  function isHighRootEqMode() {
    var level = currentLevel();
    return (
      isHighPowerTopic() &&
      !!level &&
      level.mode === "high-root" &&
      level.exercises &&
      level.exercises.length > 0
    );
  }

  function isFactorEqMode() {
    var level = currentLevel();
    return (
      ((isQuadraticTopic() && level && level.mode === "quad-factor") ||
        (isHighPowerTopic() && level && level.mode === "high-factor")) &&
      !!level &&
      level.exercises &&
      level.exercises.length > 0
    );
  }

  function isMixedEqMode() {
    var level = currentLevel();
    return (
      isQuadraticTopic() &&
      !!level &&
      level.mode === "quad-mixed" &&
      level.exercises &&
      level.exercises.length > 0
    );
  }

  function mixedPath() {
    return (state.mixed && state.mixed.path) || null;
  }

  function formulaWorkActive() {
    return isQuadMode() || mixedPath() === "formula";
  }

  function factorWorkActive() {
    return isFactorEqMode() || mixedPath() === "factor";
  }

  function sqrtWorkActive() {
    return isSqrtEqMode() || isHighRootEqMode() || mixedPath() === "sqrt";
  }

  function isEqWorkMode() {
    return isStepMode() || isSqrtEqMode() || isHighRootEqMode() || isFactorEqMode() || isMixedEqMode();
  }

  function emptyMixedState() {
    return { path: null, md53: false };
  }

  function emptyFactorState() {
    return {
      split: false,
      eqs: [],
      solved: [false, false],
      progress: { z: false, o: false, n: false },
      sqrtProg: { pos: false, neg: false },
      trails: [[], []],
      canSplit: false,
    };
  }

  function factorPayload() {
    var st = state.factor || emptyFactorState();
    return {
      split: !!st.split,
      trails: (st.trails || [[], []]).map(function (t) {
        return (t || []).map(String);
      }),
    };
  }

  function startFactorTrails(e1, e2) {
    var Q = DoctematicaQuadratic;
    var pack = state.problem && state.problem.factor;
    state.factor = state.factor || emptyFactorState();
    state.factor.split = true;
    state.factor.eqs = [e1, e2];
    if (!state.factor.trails[0].length && !state.factor.trails[1].length) {
      state.factor.trails = [[e1], [e2]];
      if (pack && pack.high) {
        state.factor.solved = [
          !!(Q.linearSolved(e1) && /x\s*=\s*0/i.test(e1)),
          false,
        ];
      } else {
        state.factor.solved = [Q.linearSolved(e1), Q.linearSolved(e2)];
      }
    }
  }

  function appendFactorTrail(which, eq) {
    if (which !== 0 && which !== 1) return;
    var trail = state.factor.trails[which];
    if (!trail) {
      state.factor.trails[which] = [eq];
      return;
    }
    if (trail[trail.length - 1] !== eq) trail.push(eq);
  }

  function geoDistUnkTask() {
    if (!state.problem || state.problem.mode !== "geo-length") return null;
    var pack = state.problem.geo;
    if (!pack || !DoctematicaGeometry) return null;
    var t =
      DoctematicaGeometry.currentFocusTask && DoctematicaGeometry.currentFocusTask(pack, state.geo);
    if (t && t.kind === "distUnknown") {
      if (state.geo && state.geo.done && state.geo.done[t.id]) return null;
      return t;
    }
    var part =
      DoctematicaGeometry.currentPartText && DoctematicaGeometry.currentPartText(pack, state.geo);
    var ids = (part && part.taskIds) || [];
    var open = (pack.tasks || []).filter(function (task) {
      if (task.kind !== "distUnknown") return false;
      if (state.geo && state.geo.done && state.geo.done[task.id]) return false;
      return !ids.length || ids.indexOf(task.id) >= 0;
    });
    var i;
    for (i = 0; i < open.length; i++) {
      var st = state.geo && state.geo.distUnk && state.geo.distUnk[open[i].id];
      if (st && st.squared) return open[i];
    }
    return open[0] || null;
  }

  function geoEqLetter() {
    var t = geoDistUnkTask();
    var st = t && state.geo && state.geo.distUnk && state.geo.distUnk[t.id];
    var axis = t && String(t.unknownAxis || "").toLowerCase();
    if (st && st.letter) {
      var L = String(st.letter).toLowerCase();
      var last = (t && state.geo && state.geo.lastExpr && state.geo.lastExpr[t.id]) || "";
      if (axis === "y" && L === "x" && /(?:^|[^A-Za-z])y(?:[^A-Za-z]|$)/i.test(last)) return "y";
      return L;
    }
    if (t && t.letter) return String(t.letter).toLowerCase();
    if (t && t.yLine && !near0Yline(t)) return String(t.letter || "x").toLowerCase();
    if (axis === "y") return "y";
    if (t && t.fromExpr) return "t";
    return "x";
  }

  function near0Yline(t) {
    return t.yLine && Math.abs(Number(t.yLine.m)) < 1e-9;
  }

  function rewriteLetterGeo(eq, from, to) {
    if (!from || !to || String(from).toLowerCase() === String(to).toLowerCase()) return eq;
    var f = String(from).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return String(eq || "").replace(new RegExp("(?<![A-Za-z_])" + f + "(?![A-Za-z])", "gi"), to);
  }

  function geoEngineTyped(typed) {
    if (!geoEqSolveActive()) return typed;
    var L = geoEqLetter();
    if (!L || String(L).toLowerCase() === "x") return typed;
    return rewriteLetterGeo(typed, L, "x");
  }

  function geoEqSolveActive() {
    if (isGeoDistancePage()) return false;
    var t = geoDistUnkTask();
    if (!t) return false;
    var last = (state.geo && state.geo.lastExpr && state.geo.lastExpr[t.id]) || "";
    if (/√|sqrt/i.test(last)) return false;
    var st = state.geo && state.geo.distUnk && state.geo.distUnk[t.id];
    return !!(st && st.squared && last);
  }

  function geoDistUnkNeedPoint() {
    var t = geoDistUnkTask();
    if (!t || String(t.resultKind || "point") !== "point") return false;
    var st = t && state.geo && state.geo.distUnk && state.geo.distUnk[t.id];
    return !!(st && st.keepFound && st.keepFound.length);
  }

  function ensureGeoMixedPack() {
    if (!geoEqSolveActive() || !DoctematicaQuadratic || !DoctematicaQuadratic.analyzeMixedStart) return false;
    var last = lastHistoryEq();
    if (!last) return false;
    try {
      var pack = DoctematicaQuadratic.analyzeMixedStart(last);
      state.problem.mixed = pack;
      if (pack.factor) state.problem.factor = pack.factor;
      if (pack.quad) state.problem.quad = pack.quad;
      if (pack.sqrt) state.problem.sqrt = pack.sqrt;
      state.mixed = state.mixed || emptyMixedState();
      return true;
    } catch (err) {
      return false;
    }
  }

  function finishEqSolveForGeo(answer) {
    if (!state.problem || state.problem.mode !== "geo-length" || !geoDistUnkTask()) return false;
    var text = String(answer || "").trim();
    var L = geoEqLetter();
    if (L && String(L).toLowerCase() !== "x") text = rewriteLetterGeo(text, "x", L);
    state.mixed = state.mixed || emptyMixedState();
    state.mixed.path = null;
    state.mixed.md53 = false;
    if (state.quad && state.quad.trail && state.quad.trail.length) {
      state.geo = state.geo || {};
      var trailL = geoEqLetter();
      var trailLines = state.quad.trail;
      if (trailL && String(trailL).toLowerCase() !== "x") {
        trailLines = trailLines.map(function (line) {
          return rewriteLetterGeo(line, "x", trailL);
        });
      }
      state.geo.eqTrail = (state.geo.eqTrail || []).concat(trailLines);
    }
    state.quad = null;
    state.factor = emptyFactorState();
    if (quadGuideEl) {
      quadGuideEl.classList.add("hidden");
      quadGuideEl.innerHTML = "";
    }
    if (sysKnownEl) {
      sysKnownEl.classList.add("hidden");
      sysKnownEl.innerHTML = "";
    }
    if (solveWrap) solveWrap.classList.remove("is-system");
    setQuadInput(true);
    var pack = state.problem.geo;
    var res =
      text && DoctematicaGeometry.applyDistUnknownAlgebra
        ? DoctematicaGeometry.applyDistUnknownAlgebra(text, pack, state.geo)
        : null;
    if (res && res.ok) {
      applyGeoResultState(res);
      if (res.show) {
        var histLine = res.show;
        if (DoctematicaGeometry.capsHistoryLetters) {
          histLine = DoctematicaGeometry.capsHistoryLetters(histLine);
        }
        if (state.history[state.history.length - 1] !== histLine) state.history.push(histLine);
      }
      renderSteps();
      renderGeoPart();
      renderGeoAskUi();
      renderGeoScene(null);
      mathField.clear();
      mathField.setDisabled(false);
      checkBtn.disabled = false;
      updateSplitBtn();
      updateFormulaBtn();
      setModeUi();
      var okMsg = res.message || "";
      if (DoctematicaMath && DoctematicaMath.proseHTML) okMsg = DoctematicaMath.proseHTML(okMsg);
      if (res.solved) {
        markSolved();
        mathField.setDisabled(true);
        checkBtn.disabled = true;
        nextAfterSolveBtn.classList.remove("hidden");
        showFeedback(true, "<strong>כל הכבוד.</strong> " + okMsg);
      } else {
        showFeedback(true, "<strong>נכון.</strong> " + okMsg);
        mathField.focus();
      }
      return true;
    }
    renderSteps();
    updateSplitBtn();
    updateFormulaBtn();
    setModeUi();
    return true;
  }

  function lastHistoryEq() {
    var raw = state.history[state.history.length - 1];
    if (geoEqSolveActive()) {
      if (!mixedPath()) {
        var t = geoDistUnkTask();
        var fromTask = t && state.geo && state.geo.lastExpr && state.geo.lastExpr[t.id];
        if (fromTask) raw = fromTask;
      }
      return rewriteLetterGeo(raw, geoEqLetter(), "x");
    }
    return raw;
  }

  function canSplitFactor() {
    if (geoEqSolveActive()) ensureGeoMixedPack();
    if (isFactorServerMode() || isHighFactorServerMode() || (isMixedServerMode() && mixedPath() === "factor")) {
      return !!(state.factor && state.factor.canSplit && !state.locked);
    }
    if ((!factorWorkActive() && !geoEqSolveActive()) || state.locked || !state.problem || !state.problem.factor) return false;
    var st = state.factor || emptyFactorState();
    var last = lastHistoryEq();
    var Q = DoctematicaQuadratic;
    var pack = state.problem.factor;
    if (pack && pack.high) {
      if (!st.split) {
        var hi = Q.parseHighProductEq(last);
        return !!(hi && Q.highProductMatches(pack, hi));
      }
      var bi;
      for (bi = 0; bi < 2; bi++) {
        if (st.solved && st.solved[bi]) continue;
        var beq = (st.eqs && st.eqs[bi]) || "";
        var bp = Q.parseProductEq(beq) || Q.parseHighProductEq(beq);
        if (bp && (bp.e2Kind === "linear" || (bp.f1 && bp.f2))) return true;
      }
      return false;
    }
    if (st.split) return false;
    var prod = Q.parseProductEq(last);
    return !!(prod && Q.productMatches(pack, prod));
  }

  function updateSplitBtn() {
    if (!splitEqsBtn) return;
    var show = !state.locked && canSplitFactor();
    splitEqsBtn.classList.toggle("hidden", !show);
  }

  function canUseMixedFormula() {
    if (state.locked || !state.problem) return false;
    if (geoEqSolveActive()) ensureGeoMixedPack();
    if (!isMixedEqMode() && !geoEqSolveActive()) return false;
    if (mixedPath()) return false;
    var last = lastHistoryEq();
    var Q = DoctematicaQuadratic;
    if (!Q.isAbcOrder(last)) return false;
    var p = Q.parseABC(last);
    return !!(p && p.a);
  }

  function updateFormulaBtn() {
    var show = canUseMixedFormula();
    if (useFormulaBtn) useFormulaBtn.classList.toggle("hidden", !show);
    if (md53Btn) md53Btn.classList.toggle("hidden", !show);
  }

  function emptyLcdState() {
    return null;
  }

  function canUseLcdAssist() {
    if ((!isStepMode() && !isMixedEqMode()) || state.locked || !state.problem) return false;
    if (state.denomSetupPending) return false;
    if (domainPending()) return false;
    if (state.lcd && state.lcd.phase) return false;
    if (state.lcdMarks && state.lcdMarks[state.history.length - 1]) return false;
    if (isDomainLcdServerMode()) return !!state.lcdOfferNeeded;
    if (!DoctematicaTeach || typeof DoctematicaTeach.analyzeLcdNeed !== "function") return false;
    try {
      return !!DoctematicaTeach.analyzeLcdNeed(lastHistoryEq());
    } catch (err) {
      return false;
    }
  }

  function domainPending() {
    if (isDomainLcdServerMode() && state.denomSetupPending) return false;
    return !!(state.domain && state.domain.needed && !state.domain.done);
  }

  function domainItems() {
    return (state.domain && state.domain.info && state.domain.info.items) || [];
  }

  function domainMulti() {
    return domainItems().length > 1;
  }

  function emptyDomainProgress(info) {
    return (info.items || []).map(function () {
      return { phase: null, display: null, trail: [], itemIndex: null };
    });
  }

  function domainProgressItems() {
    if (!state.domain) return [];
    if (!state.domain.progress) {
      state.domain.progress = emptyDomainProgress(state.domain.info || { items: [] });
    }
    return state.domain.progress;
  }

  function domainAllSolved() {
    var items = domainItems();
    var prog = domainProgressItems();
    var i;
    for (i = 0; i < items.length; i++) {
      if (!prog[i] || prog[i].phase !== "solved") return false;
    }
    return items.length > 0;
  }

  function nextUnsolvedDomainBranch() {
    var items = domainItems();
    var prog = domainProgressItems();
    var i;
    for (i = 0; i < items.length; i++) {
      if (!prog[i] || prog[i].phase !== "solved") return i;
    }
    return -1;
  }

  function resetDomainState(eqText) {
    state.domain = null;
    if (isDomainLcdServerMode()) return;
    if (!DoctematicaTeach || typeof DoctematicaTeach.analyzeDomain !== "function") return;
    var info = null;
    try {
      info = DoctematicaTeach.analyzeDomain(eqText || (state.problem && state.problem.startEquation) || "");
    } catch (err) {
      info = null;
    }
    if (!info) return;
    var multi = info.items && info.items.length > 1;
    state.domain = {
      needed: true,
      done: false,
      split: multi,
      phase: null,
      info: info,
      display: info.display,
      trail: [],
      progress: emptyDomainProgress(info),
      activeBranch: 0,
      drafts: {},
    };
  }

  function applyDenomSetup(remote) {
    state.denomSetupPending = false;
    state.denomReady = true;
    var d = remote && remote.domain;
    if (!d || !d.needed) {
      state.domain = null;
    } else {
      state.domain = {
        needed: true,
        done: false,
        split: !!d.split,
        phase: null,
        info: d,
        display: d.display,
        trail: [],
        progress: emptyDomainProgress(d),
        activeBranch: 0,
        drafts: {},
      };
    }
    applyLcdOffer(remote);
    updateDomainBtn();
    renderDomainGuide();
    renderLcdGuide();
    setModeUi();
    updateLcdBtn();
  }

  function requestDenomSetup() {
    if (!state.problem) return;
    state.denomSetupPending = true;
    state.denomReady = false;
    state.lcdOfferNeeded = false;
    var start = state.problem.startEquation;
    requestDomainLcdAction(
      {
        intent: "setup",
        start: start,
        history: [start],
      },
      function (remote) {
        applyDenomSetup(remote);
      }
    );
  }

  function domainHistoryInSteps() {
    if (!state.domain || !state.domain.needed || (!isStepMode() && !isMixedEqMode())) return false;
    if (domainMulti()) {
      if (state.domain.done) return true;
      return domainProgressItems().some(function (p) {
        return p && p.trail && p.trail.length;
      });
    }
    return !!((state.domain.trail && state.domain.trail.length) || state.domain.done);
  }

  function renderDomainTrailFork(baseNum) {
    var items = domainItems();
    var prog = domainProgressItems();
    var letters = ["א", "ב", "ג"];
    var wrap = document.createElement("li");
    wrap.className = "factor-fork domain-fork";
    var i;
    for (i = 0; i < items.length; i++) {
      (function (branchIdx) {
        var p = prog[branchIdx] || { phase: null, trail: [] };
        var solved = p.phase === "solved";
        var col = document.createElement("div");
        col.className = "factor-branch" + (solved ? " is-done" : "");
        var trail = p.trail && p.trail.length ? p.trail : [];
        if (!trail.length) {
          var empty = document.createElement("div");
          empty.className = "factor-branch-step";
          var n0 = document.createElement("span");
          n0.className = "n";
          n0.textContent = baseNum + ".0." + (letters[branchIdx] || String(branchIdx + 1));
          var b0 = document.createElement("span");
          b0.className = "domain-fork-empty";
          b0.textContent = "…";
          empty.appendChild(n0);
          empty.appendChild(b0);
          col.appendChild(empty);
        } else {
          trail.forEach(function (entry, k) {
            var row = document.createElement("div");
            var isLast = k === trail.length - 1;
            row.className =
              "factor-branch-step" + (solved && isLast ? " is-final" : "");
            var n = document.createElement("span");
            n.className = "n";
            n.textContent = baseNum + "." + k + "." + (letters[branchIdx] || String(branchIdx + 1));
            var body = document.createElement("span");
            body.innerHTML = DoctematicaMath.toHTML(entry.display);
            row.appendChild(n);
            row.appendChild(body);
            if (solved && isLast) {
              var ok = document.createElement("span");
              ok.className = "factor-eq-n";
              ok.textContent = "✓";
              row.appendChild(ok);
            }
            col.appendChild(row);
          });
        }
        wrap.appendChild(col);
      })(i);
    }
    return wrap;
  }

  function appendDomainHistorySteps(stepsEl, stepNumRef) {
    if (!domainHistoryInSteps()) return;
    if (domainMulti()) {
      stepsEl.appendChild(renderDomainTrailFork(1));
      return;
    }
    var trail = state.domain.trail || [];
    if (!trail.length && state.domain.done) {
      trail = [{ display: state.domain.display || state.domain.info.display }];
    }
    trail.forEach(function (entry, k) {
      var row = document.createElement("li");
      row.className = "domain-step-row";
      var num = document.createElement("span");
      num.className = "n";
      if (k === 0) num.textContent = "תחום";
      else {
        stepNumRef.n += 1;
        num.textContent = String(stepNumRef.n);
      }
      var body = document.createElement("span");
      body.innerHTML = DoctematicaMath.toHTML(entry.display);
      row.appendChild(num);
      row.appendChild(body);
      stepsEl.appendChild(row);
    });
  }

  function snapshotDomainDrafts() {
    if (!domainGuideEl || !state.domain) return;
    state.domain.drafts = state.domain.drafts || {};
    var nodes = domainGuideEl.querySelectorAll(".domain-cell-input");
    var i;
    for (i = 0; i < nodes.length; i++) {
      state.domain.drafts[nodes[i].getAttribute("data-domain-branch")] = nodes[i].value;
    }
  }

  function renderDomainGuide() {
    if (!domainGuideEl) return;
    snapshotDomainDrafts();
    if (!domainPending() || !domainMulti()) {
      domainGuideEl.classList.add("hidden");
      domainGuideEl.innerHTML = "";
      if (mathWrap && !formulaWorkActive()) mathWrap.classList.remove("hidden");
      return;
    }
    wireDomainMathKeys();
    domainGuideEl.classList.remove("hidden");
    if (mathWrap) mathWrap.classList.add("hidden");
    var items = domainItems();
    var prog = domainProgressItems();
    var drafts = state.domain.drafts || {};
    var letters = ["א", "ב", "ג"];
    domainGuideEl.innerHTML = "";
    var cells = document.createElement("div");
    cells.className = "domain-cells";
    var i;
    for (i = 0; i < items.length; i++) {
      (function (branchIdx) {
        var p = prog[branchIdx] || { phase: null, trail: [] };
        var solved = p.phase === "solved";
        var active = state.domain.activeBranch === branchIdx;
        var wrap = document.createElement("div");
        wrap.className =
          "domain-cell-wrap" + (solved ? " is-done" : "") + (active && !solved ? " is-active" : "");
        wrap.setAttribute("data-domain-branch", String(branchIdx));

        var head = document.createElement("div");
        head.className = "domain-cell-head";
        var tag = document.createElement("span");
        tag.className = "domain-cell-tag";
        tag.textContent = letters[branchIdx] || String(branchIdx + 1);
        head.appendChild(tag);
        if (solved) {
          var okHead = document.createElement("span");
          okHead.className = "domain-cell-ok";
          okHead.textContent = "✓";
          head.appendChild(okHead);
        }
        wrap.appendChild(head);

        var trail = p.trail && p.trail.length ? p.trail : [];
        trail.forEach(function (entry) {
          var chip = document.createElement("div");
          chip.className = "domain-cell-chip";
          chip.innerHTML = DoctematicaMath.toHTML(entry.display);
          wrap.appendChild(chip);
        });

        if (!solved) {
          var inp = document.createElement("input");
          inp.type = "text";
          inp.className = "domain-cell-input" + (active ? " is-active" : "");
          inp.setAttribute("data-domain-branch", String(branchIdx));
          inp.dir = "ltr";
          inp.autocomplete = "off";
          inp.spellcheck = false;
          inp.value = drafts[String(branchIdx)] || "";
          inp.addEventListener("focus", function () {
            if (state.domain.activeBranch === branchIdx) return;
            snapshotDomainDrafts();
            state.domain.activeBranch = branchIdx;
            renderDomainGuide();
            setModeUi();
          });
          inp.addEventListener("keydown", function (event) {
            if (event.key !== "Enter") return;
            event.preventDefault();
            state.domain.activeBranch = branchIdx;
            tryApplyDomainTyped(String(inp.value || "").trim());
          });
          wrap.addEventListener("click", function (event) {
            if (event.target === inp) return;
            snapshotDomainDrafts();
            state.domain.activeBranch = branchIdx;
            renderDomainGuide();
            focusActiveDomainInput();
          });
          wrap.appendChild(inp);
        }
        cells.appendChild(wrap);
      })(i);
    }
    domainGuideEl.appendChild(cells);
    focusActiveDomainInput();
  }

  function updateDomainBtn() {
    if (!domainBtn) return;
    domainBtn.classList.toggle("hidden", !domainPending() || state.locked);
    if (splitDomainBtn) splitDomainBtn.classList.add("hidden");
  }

  function appendDomainTrail(text, parts) {
    if (!state.domain) return;
    state.domain.trail = state.domain.trail || [];
    state.domain.trail.push({
      display: text,
      parts: parts || null,
    });
  }

  function applyDomainDone(display, opts) {
    opts = opts || {};
    if (!state.domain) return;
    state.domain.done = true;
    state.domain.phase = "solved";
    state.domain.display = display || state.domain.info.display;
    if (!opts.skipTrail) {
      var already = (state.domain.trail || []).some(function (t) {
        return t.display === state.domain.display;
      });
      if (!already) {
        appendDomainTrail(state.domain.display, state.domain.info.parts);
      }
    }
    updateDomainBtn();
    renderDomainGuide();
    renderSteps();
    setModeUi();
    updateLcdBtn();
    mathField.clear();
    showFeedback(
      true,
      opts.message ||
        "<strong>תחום הצבה:</strong> " +
          state.domain.display +
          ". עכשיו פתרו את המשוואה (אפשר מכנה משותף).",
      "tip"
    );
    mathField.focus();
  }

  function applyDomainRaw(display, parts, message) {
    if (!state.domain) return;
    state.domain.phase = "work";
    state.domain.rawDisplay = display;
    if (!domainMulti()) {
      var last = (state.domain.trail || [])[state.domain.trail.length - 1];
      if (!last || last.display !== display) appendDomainTrail(display, parts);
    }
    renderDomainGuide();
    renderSteps();
    setModeUi();
    updateDomainBtn();
    mathField.clear();
    showFeedback(true, message || "עכשיו פשטו ל־x≠…", "tip");
    if (domainMulti()) focusActiveDomainInput();
    else mathField.focus();
  }

  function applyDomainItemResult(res) {
    if (!state.domain || res.itemIndex == null) return;
    state.domain.progress = res.progressItems || state.domain.progress;
    var idx = res.itemIndex;
    if (res.nextBranch != null && res.nextBranch >= 0) {
      state.domain.activeBranch = res.nextBranch;
    } else if (state.domain.split) {
      var n = nextUnsolvedDomainBranch();
      if (n >= 0) state.domain.activeBranch = n;
    }
    if (state.domain.drafts) delete state.domain.drafts[String(idx)];
    if (domainGuideEl) {
      var live = domainGuideEl.querySelector('.domain-cell-input[data-domain-branch="' + idx + '"]');
      if (live) live.value = "";
    }
    renderDomainGuide();
    renderSteps();
    setModeUi();
    updateDomainBtn();
    if (!domainMulti()) mathField.clear();
    if (res.done) {
      var parts = domainItems().map(function (it, i) {
        var p = domainProgressItems()[i];
        return (p && p.display) || it.solvedPart;
      });
      state.domain.trail = [
        {
          display: res.display || state.domain.info.display,
          parts: parts,
        },
      ];
      applyDomainDone(res.display || state.domain.info.display, {
        skipTrail: true,
        message: "<strong>נכון.</strong> תחום הצבה: " + (res.display || state.domain.info.display) + ".",
      });
      return;
    }
    showFeedback(true, res.message || "המשיכו.", "tip");
    if (domainMulti()) focusActiveDomainInput();
    else mathField.focus();
  }

  function fillDomainFromButton() {
    if (!domainPending()) return;
    if (isDomainLcdServerMode()) {
      requestDomainLcdAction(
        {
          intent: "domain-reveal",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          domain: denomDomainPayload(),
        },
        function (res) {
          if (!res.ok) {
            showFeedback(false, "<strong>עוד לא.</strong> " + (res.message || ""));
            return;
          }
          applyDenomServerResult(res);
        }
      );
      return;
    }
    if (domainMulti()) {
      var items = domainItems();
      var prog = domainProgressItems();
      var i;
      for (i = 0; i < items.length; i++) {
        prog[i] = {
          phase: "solved",
          display: items[i].solvedPart,
          itemIndex: i,
          trail: [{ display: items[i].solvedPart }],
        };
      }
      state.domain.progress = prog;
      applyDomainDone(state.domain.info.display, {
        message:
          "<strong>תחום הצבה:</strong> " +
          state.domain.info.display +
          ". עכשיו פתרו את המשוואה.",
      });
      return;
    }
    if (state.domain.phase === "raw") {
      applyDomainDone(state.domain.info.display, {
        message:
          "<strong>תחום הצבה:</strong> " +
          state.domain.info.display +
          ". עכשיו פתרו את המשוואה.",
      });
      return;
    }
    applyDomainDone(state.domain.info.display, {
      message:
        "<strong>תחום הצבה:</strong> " +
        state.domain.info.display +
        ". עכשיו פתרו את המשוואה.",
    });
  }

  function applyDenomServerResult(res) {
    if (!state.domain) return;
    if (res.domain) {
      state.domain.info = res.domain;
      state.domain.split = !!res.domain.split;
    }
    if (res.progressItems) state.domain.progress = res.progressItems;
    if (res.skip) {
      state.domain = null;
      updateDomainBtn();
      renderDomainGuide();
      setModeUi();
      return;
    }
    if (res.partial || (res.progressItems && res.itemIndex != null)) {
      applyDomainItemResult(res);
      return;
    }
    if (res.done) {
      applyDomainDone(res.display || (state.domain.info && state.domain.info.display), {
        message: "<strong>נכון.</strong> תחום הצבה: " + (res.display || (state.domain.info && state.domain.info.display)) + ".",
      });
      return;
    }
    if (res.phase === "raw" || res.phase === "work") {
      applyDomainRaw(res.display, res.parts, res.message);
      return;
    }
    applyDomainDone(res.display || (state.domain.info && state.domain.info.display), {
      message: "<strong>נכון.</strong> תחום הצבה: " + (res.display || (state.domain.info && state.domain.info.display)) + ".",
    });
  }

  function tryApplyDomainTyped(typed) {
    if (!domainPending()) return false;
    if (!typed) {
      showFeedback(
        false,
        "<strong>עוד לא.</strong> רשמו תחום הצבה (למשל " +
          ((state.domain.info && state.domain.info.rawDisplay) || "x+2≠0") +
          " ואז x≠…), או לחצו «הצג תחום הצבה»."
      );
      return true;
    }
    state.stats.try += 1;
    saveStats();
    renderStats();
    var eq = (state.problem && state.problem.startEquation) || lastHistoryEq();
    if (isDomainLcdServerMode()) {
      requestDomainLcdAction(
        {
          intent: "domain-check",
          start: eq,
          history: state.history,
          typed: typed,
          domain: denomDomainPayload(),
        },
        function (res) {
          if (!res.ok) {
            showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
            return;
          }
          applyDenomServerResult(res);
        }
      );
      return true;
    }
    var res;
    var trail = (state.domain && state.domain.trail) || [];
    if (domainMulti()) {
      var br = state.domain.activeBranch || 0;
      res = DoctematicaTeach.checkDomainProgress(
        eq,
        typed,
        {
          items: domainProgressItems(),
          split: true,
          activeBranch: br,
        },
        {}
      );
    } else {
      res = DoctematicaTeach.checkDomain(eq, typed, {
        previous:
          trail.length
            ? trail[trail.length - 1].display
            : (state.domain.info.items && state.domain.info.items[0] && state.domain.info.items[0].rawPart) ||
              state.domain.info.rawDisplay,
        started: trail.length > 0,
      });
    }
    if (!res.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
      return true;
    }
    if (res.partial || (res.progressItems && res.itemIndex != null)) {
      applyDomainItemResult(res);
      return true;
    }
    if (res.done) {
      applyDomainDone(res.display || state.domain.info.display, {
        message: "<strong>נכון.</strong> תחום הצבה: " + (res.display || state.domain.info.display) + ".",
      });
      return true;
    }
    if (res.phase === "raw" || res.phase === "work") {
      applyDomainRaw(res.display, res.parts, res.message);
      return true;
    }
    applyDomainDone(res.display || state.domain.info.display, {
      message: "<strong>נכון.</strong> תחום הצבה: " + (res.display || state.domain.info.display) + ".",
    });
    return true;
  }

  function updateLcdBtn() {
    if (!lcdBtn) return;
    lcdBtn.classList.toggle("hidden", !canUseLcdAssist());
  }

  function clearLcdAssist() {
    state.lcd = null;
    renderLcdGuide();
    updateLcdBtn();
  }

  function startLcdAssist() {
    if (isDomainLcdServerMode()) {
      requestDomainLcdAction(
        {
          intent: "lcd-start",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          domain: denomDomainPayload(),
        },
        function (res) {
          if (!res.ok) {
            showFeedback(false, "<strong>עוד לא.</strong> " + (res.message || "כרגע אין צורך במכנה משותף."));
            return;
          }
          var info = lcdInfoFromSnap(res.lcd);
          if (!info) {
            showFeedback(false, "<strong>עוד לא.</strong> כרגע אין צורך במכנה משותף.");
            return;
          }
          state.lcd = { phase: "ask", info: info, lcd: null, got: [] };
          renderLcdGuide();
          updateLcdBtn();
          showFeedback(
            true,
            "<strong>מכנה משותף.</strong> רשמו את המכנה המשותף המצומצם ביותר, ואז מעל כל איבר — בכמה מכפילים.",
            "tip"
          );
        }
      );
      return;
    }
    var info = DoctematicaTeach.analyzeLcdNeed(lastHistoryEq());
    if (!info) {
      showFeedback(false, "<strong>עוד לא.</strong> כרגע אין צורך במכנה משותף.");
      return;
    }
    state.lcd = { phase: "ask", info: info, lcd: null, got: [] };
    renderLcdGuide();
    updateLcdBtn();
    showFeedback(
      true,
      "<strong>מכנה משותף.</strong> רשמו את המכנה המשותף המצומצם ביותר, ואז מעל כל איבר — בכמה מכפילים.",
      "tip"
    );
  }

  function lcdTermSignParts(text) {
    var raw = String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var sign = "+";
    if (raw.charAt(0) === "-") {
      sign = "-";
      raw = raw.slice(1);
    } else if (raw.charAt(0) === "+") {
      raw = raw.slice(1);
    }
    return { sign: sign, body: raw || "0" };
  }

  function fitLcdMulEl(el) {
    if (!el) return;
    var text = el.tagName === "INPUT" ? String(el.value || "") : String(el.textContent || "");
    var probe = text || "x";
    var mirror = document.createElement("span");
    mirror.className = "lcd-mul-measure";
    mirror.textContent = probe;
    var cs = window.getComputedStyle(el);
    var eq = el.closest ? el.closest(".lcd-eq") : null;
    var eqCs = eq ? window.getComputedStyle(eq) : null;
    mirror.style.fontFamily = cs.fontFamily || '"Segoe Print", "Comic Sans MS", "Frank Ruhl Libre", cursive';
    mirror.style.fontWeight = cs.fontWeight || "700";
    mirror.style.fontSize = cs.fontSize && cs.fontSize !== "0px" ? cs.fontSize : eqCs ? "0.72em" : "0.95rem";
    if (eqCs && (!cs.fontSize || cs.fontSize === "0px")) {
      mirror.style.fontSize = "calc(" + eqCs.fontSize + " * 0.72)";
    }
    mirror.style.letterSpacing = cs.letterSpacing;
    mirror.style.padding = "0 3px";
    mirror.style.border = "0";
    mirror.style.visibility = "hidden";
    mirror.style.position = "absolute";
    mirror.style.left = "-9999px";
    mirror.style.whiteSpace = "nowrap";
    if (eq) eq.appendChild(mirror);
    else document.body.appendChild(mirror);
    var w = Math.ceil(mirror.getBoundingClientRect().width) + 6;
    mirror.parentNode.removeChild(mirror);
    el.style.width = Math.max(w, 24) + "px";
  }

  function wireLcdMulFit(el) {
    if (!el) return;
    fitLcdMulEl(el);
    if (el.tagName !== "INPUT" || el._lcdFitWired) return;
    el._lcdFitWired = true;
    el.addEventListener("input", function () {
      fitLcdMulEl(el);
    });
  }

  function refitLcdMuls(root) {
    if (!root) return;
    var nodes = root.querySelectorAll(".lcd-mul");
    var i;
    for (i = 0; i < nodes.length; i++) fitLcdMulEl(nodes[i]);
  }

  function renderLcdTermChip(term, index, gotOk, opts) {
    opts = opts || {};
    var wrap = document.createElement("span");
    wrap.className = "lcd-term";
    var mulVal = opts.mul != null ? opts.mul : term.mul;
    if (opts.readonly) {
      var hat = document.createElement("span");
      hat.className = "lcd-mul is-ok lcd-mul-view";
      hat.textContent = String(mulVal);
      wrap.appendChild(hat);
      wireLcdMulFit(hat);
    } else {
      var inp = document.createElement("input");
      inp.type = "text";
      inp.className = "lcd-mul" + (gotOk ? " is-ok" : "");
      inp.setAttribute("data-lcd-mul", String(index));
      inp.setAttribute("aria-label", "מכפיל לאיבר " + (index + 1));
      inp.inputMode = "text";
      inp.autocomplete = "off";
      if (gotOk) {
        inp.value = String(mulVal);
        inp.disabled = true;
      }
      wrap.appendChild(inp);
      wireLcdMulFit(inp);
    }
    var body = document.createElement("span");
    body.className = "lcd-term-body";
    var display = opts.bodyText != null ? opts.bodyText : term.text;
    body.innerHTML = DoctematicaMath.toHTML(display);
    wrap.appendChild(body);
    return wrap;
  }

  function appendLcdSide(eqEl, terms, startIndex, got, opts) {
    opts = opts || {};
    var i;
    for (i = 0; i < terms.length; i++) {
      var term = terms[i];
      var parts = lcdTermSignParts(term.text);
      if (i > 0 || parts.sign === "-") {
        var op = document.createElement("span");
        op.className = "lcd-op";
        op.textContent = parts.sign === "-" ? "−" : "+";
        eqEl.appendChild(op);
      }
      var mulOverride =
        opts.muls && opts.muls[startIndex + i] != null ? opts.muls[startIndex + i] : null;
      eqEl.appendChild(
        renderLcdTermChip(term, startIndex + i, !!(got && got[startIndex + i]), {
          readonly: !!opts.readonly,
          mul: mulOverride != null ? mulOverride : term.mul,
          bodyText: parts.body,
        })
      );
    }
  }

  function buildLcdEqView(mark) {
    var eqEl = document.createElement("div");
    eqEl.className = "lcd-eq lcd-eq-step";
    var terms = mark.terms || [];
    var leftN = mark.leftN || 0;
    var muls = mark.muls || [];
    appendLcdSide(eqEl, terms.slice(0, leftN), 0, null, { readonly: true, muls: muls });
    var eqSign = document.createElement("span");
    eqSign.className = "lcd-op";
    eqSign.textContent = "=";
    eqEl.appendChild(eqSign);
    appendLcdSide(eqEl, terms.slice(leftN), leftN, null, { readonly: true, muls: muls });
    return eqEl;
  }

  function renderLcdGuide() {
    if (!lcdGuideEl) return;
    lcdGuideEl.innerHTML = "";
    if (state.lcd && state.lcd.phase === "ask") {
      lcdGuideEl.classList.remove("hidden");
      var title = document.createElement("p");
      title.className = "lcd-guide-title";
      title.textContent = "רשמו את המכנה המשותף (המצומצם ביותר), ואז Enter או בדיקה.";
      lcdGuideEl.appendChild(title);
      var ask = document.createElement("div");
      ask.className = "lcd-ask";
      ask.innerHTML =
        '<label>מכנה משותף <input type="text" id="lcd-value" inputmode="numeric" autocomplete="off" aria-label="מכנה משותף" /></label>';
      lcdGuideEl.appendChild(ask);
      var tip = document.createElement("p");
      tip.className = "lcd-hint-line";
      tip.textContent = "אפשר גם בלי זה — לכתוב ישר את המשוואה עם מכנה משותף בשדה למטה.";
      lcdGuideEl.appendChild(tip);
      var inp = lcdGuideEl.querySelector("#lcd-value");
      if (inp) {
        inp.focus();
        inp.addEventListener("keydown", function (ev) {
          if (ev.key === "Enter") {
            ev.preventDefault();
            handleLcdSubmit();
          }
        });
      }
      updateLcdBtn();
      return;
    }
    if (state.lcd && state.lcd.phase === "muls") {
      lcdGuideEl.classList.remove("hidden");
      var titleM = document.createElement("p");
      titleM.className = "lcd-guide-title";
      titleM.textContent =
        "מכנה משותף " +
        state.lcd.lcd +
        ". מעל כל איבר רשמו בכמה מכפילים (כמו במחברת), ואז בדיקה.";
      lcdGuideEl.appendChild(titleM);
      var eqEl = document.createElement("div");
      eqEl.className = "lcd-eq";
      var info = state.lcd.info;
      var got = state.lcd.got || [];
      var leftN = info.leftTerms.length;
      appendLcdSide(eqEl, info.terms.slice(0, leftN), 0, got);
      var eqSign = document.createElement("span");
      eqSign.className = "lcd-op";
      eqSign.textContent = "=";
      eqEl.appendChild(eqSign);
      appendLcdSide(eqEl, info.terms.slice(leftN), leftN, got);
      lcdGuideEl.appendChild(eqEl);
      refitLcdMuls(eqEl);
      var tip2 = document.createElement("p");
      tip2.className = "lcd-hint-line";
      tip2.textContent = "המכפיל = המכנה המשותף חלקי המכנה של האיבר.";
      lcdGuideEl.appendChild(tip2);
      var first = lcdGuideEl.querySelector(".lcd-mul:not(:disabled)");
      if (first) first.focus();
      var muls = lcdGuideEl.querySelectorAll(".lcd-mul");
      var mi;
      for (mi = 0; mi < muls.length; mi++) {
        muls[mi].addEventListener("keydown", function (ev) {
          if (ev.key === "Enter") {
            ev.preventDefault();
            handleLcdSubmit();
          }
        });
      }
      updateLcdBtn();
      return;
    }
    if (canUseLcdAssist()) {
      lcdGuideEl.classList.remove("hidden");
      var offer = document.createElement("div");
      offer.className = "lcd-offer";
      var offerText = document.createElement("p");
      offerText.className = "lcd-guide-title";
      offerText.textContent =
        "לפני שפותרים — אפשר לסמן מעל כל איבר בכמה מכפילים כדי להגיע למכנה משותף (כמו במחברת).";
      offer.appendChild(offerText);
      var offerBtn = document.createElement("button");
      offerBtn.type = "button";
      offerBtn.className = "lcd-offer-btn";
      offerBtn.id = "lcd-offer-start";
      offerBtn.textContent = "ביצוע מכנה משותף";
      offerBtn.addEventListener("click", function () {
        startLcdAssist();
      });
      offer.appendChild(offerBtn);
      lcdGuideEl.appendChild(offer);
      updateLcdBtn();
      return;
    }
    lcdGuideEl.classList.add("hidden");
    updateLcdBtn();
  }

  function finishLcdMarksFromState() {
    var info = state.lcd.info;
    var lcdVal = state.lcd.lcd;
    var mark = {
      lcd: lcdVal,
      muls: info.terms.map(function (t) {
        return t.mulDisplay != null ? t.mulDisplay : t.mul;
      }),
      terms: info.terms.map(function (t) {
        return {
          text: t.text,
          mul: t.mulDisplay != null ? t.mulDisplay : t.mul,
          den: t.den,
          side: t.side,
        };
      }),
      leftN: info.leftTerms.length,
    };
    clearLcdAssist();
    pushLcdMarksStep(mark, {
      message:
        "<strong>צעד חוקי.</strong> סימנתם את המכפילים למכנה משותף " +
        lcdVal +
        ". עכשיו הקלידו את המשוואה אחרי הכפל בכל איבר.",
    });
  }

  function handleDenomLcdSubmit() {
    if (!state.lcd || !state.lcd.phase) return false;
    var start = (state.problem && state.problem.startEquation) || lastHistoryEq();
    if (state.lcd.phase === "ask") {
      var box = lcdGuideEl && lcdGuideEl.querySelector("#lcd-value");
      var typed = box ? box.value : "";
      state.stats.try += 1;
      saveStats();
      renderStats();
      requestDomainLcdAction(
        {
          intent: "lcd-value",
          start: start,
          history: state.history,
          typed: typed,
          domain: denomDomainPayload(),
        },
        function (res) {
          if (!res.ok) {
            showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
            if (box) box.focus();
            return;
          }
          state.lcd.phase = "muls";
          state.lcd.lcd = res.lcd;
          if (res.lcdInfo) state.lcd.info = lcdInfoFromSnap(res.lcdInfo) || state.lcd.info;
          state.lcd.got = [];
          renderLcdGuide();
          showFeedback(true, "<strong>נכון.</strong> " + res.message, "tip");
        }
      );
      return true;
    }
    if (state.lcd.phase === "muls") {
      var info = state.lcd.info;
      var got = state.lcd.got ? state.lcd.got.slice() : [];
      var i;
      var pending = -1;
      var pendingRaw = "";
      var pendingEl = null;
      for (i = 0; i < info.terms.length; i++) {
        if (got[i]) continue;
        var el = lcdGuideEl.querySelector('[data-lcd-mul="' + i + '"]');
        var raw = el ? String(el.value || "").trim() : "";
        if (!raw) continue;
        pending = i;
        pendingRaw = raw;
        pendingEl = el;
        break;
      }
      if (pending < 0) {
        if (!info.terms.every(function (_, idx) { return got[idx]; })) {
          showFeedback(false, "<strong>עוד לא.</strong> רשמו מעל האיברים בכמה מכפילים כל אחד.");
          var firstEmpty = lcdGuideEl.querySelector(".lcd-mul:not(:disabled)");
          if (firstEmpty) firstEmpty.focus();
        }
        return true;
      }
      state.stats.try += 1;
      saveStats();
      renderStats();
      requestDomainLcdAction(
        {
          intent: "lcd-mul",
          start: start,
          history: state.history,
          typed: pendingRaw,
          termIndex: pending,
          domain: denomDomainPayload(),
          lcd: { phase: "muls", lcd: state.lcd.lcd },
        },
        function (res) {
          if (!res.ok) {
            showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
            if (pendingEl) pendingEl.focus();
            return;
          }
          got[pending] = true;
          state.lcd.got = got;
          var allDone = info.terms.every(function (_, idx) {
            return got[idx];
          });
          if (!allDone) {
            renderLcdGuide();
            showFeedback(true, "<strong>נכון.</strong> המשיכו למלא את שאר המכפילים.", "tip");
            return;
          }
          finishLcdMarksFromState();
        }
      );
      return true;
    }
    return false;
  }

  function handleLcdSubmit() {
    if (!state.lcd || !state.lcd.phase) return false;
    if (isDomainLcdServerMode()) return handleDenomLcdSubmit();
    var Teach = DoctematicaTeach;
    if (state.lcd.phase === "ask") {
      var box = lcdGuideEl && lcdGuideEl.querySelector("#lcd-value");
      var typed = box ? box.value : "";
      var res = Teach.checkLcdValue(lastHistoryEq(), typed);
      state.stats.try += 1;
      saveStats();
      renderStats();
      if (!res.ok) {
        showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
        if (box) box.focus();
        return true;
      }
      state.lcd.phase = "muls";
      state.lcd.lcd = res.lcd;
      state.lcd.info = res.info || Teach.analyzeLcdNeed(lastHistoryEq());
      state.lcd.got = [];
      renderLcdGuide();
      showFeedback(true, "<strong>נכון.</strong> " + res.message, "tip");
      return true;
    }
    if (state.lcd.phase === "muls") {
      var info = state.lcd.info;
      var got = state.lcd.got ? state.lcd.got.slice() : [];
      var i;
      var anyTyped = false;
      for (i = 0; i < info.terms.length; i++) {
        if (got[i]) continue;
        var el = lcdGuideEl.querySelector('[data-lcd-mul="' + i + '"]');
        var raw = el ? String(el.value || "").trim() : "";
        if (!raw) continue;
        anyTyped = true;
        var mulRes = Teach.checkLcdMultiplier(info.terms[i], raw);
        if (!mulRes.ok) {
          state.stats.try += 1;
          saveStats();
          renderStats();
          showFeedback(false, "<strong>עוד לא.</strong> " + mulRes.message);
          if (el) el.focus();
          return true;
        }
        got[i] = true;
      }
      state.stats.try += 1;
      saveStats();
      renderStats();
      if (!anyTyped && !info.terms.every(function (_, idx) { return got[idx]; })) {
        showFeedback(false, "<strong>עוד לא.</strong> רשמו מעל האיברים בכמה מכפילים כל אחד.");
        var firstEmpty = lcdGuideEl.querySelector(".lcd-mul:not(:disabled)");
        if (firstEmpty) firstEmpty.focus();
        return true;
      }
      state.lcd.got = got;
      var allDone = info.terms.every(function (_, idx) {
        return got[idx];
      });
      if (!allDone) {
        renderLcdGuide();
        showFeedback(true, "<strong>נכון.</strong> המשיכו למלא את שאר המכפילים.", "tip");
        return true;
      }
      var lcdVal = state.lcd.lcd;
      var mark = {
        lcd: lcdVal,
        muls: info.terms.map(function (t) {
          return t.mulDisplay != null ? t.mulDisplay : t.mul;
        }),
        terms: info.terms.map(function (t) {
          return {
            text: t.text,
            mul: t.mulDisplay != null ? t.mulDisplay : t.mul,
            den: t.den,
            side: t.side,
          };
        }),
        leftN: info.leftTerms.length,
      };
      clearLcdAssist();
      pushLcdMarksStep(mark, {
        message:
          "<strong>צעד חוקי.</strong> סימנתם את המכפילים למכנה משותף " +
          lcdVal +
          ". עכשיו הקלידו את המשוואה אחרי הכפל בכל איבר.",
      });
      return true;
    }
    return false;
  }

  function pushLcdMarksStep(mark, opts) {
    opts = opts || {};
    var baseEq = lastHistoryEq();
    state.history.push(baseEq);
    state.lcdMarks[state.history.length - 1] = mark;
    renderSteps();
    renderLcdGuide();
    updateLcdBtn();
    mathField.clear();
    showFeedback(
      true,
      opts.message ||
        "<strong>צעד.</strong> מכנה משותף " +
          mark.lcd +
          " — רשמו/ראו את המכפילים מעל כל איבר, ואז ממשיכים אחרי הכפל.",
      "tip"
    );
    mathField.focus();
  }

  function markFromLcdInfo(info) {
    return {
      lcd: info.lcd,
      muls: info.terms.map(function (t) {
        return t.mulDisplay != null ? t.mulDisplay : t.mul;
      }),
      terms: info.terms.map(function (t) {
        return {
          text: t.text,
          mul: t.mulDisplay != null ? t.mulDisplay : t.mul,
          den: t.den,
          side: t.side,
        };
      }),
      leftN: info.leftTerms.length,
    };
  }

  function lastStepHasLcdMarks() {
    return !!(state.lcdMarks && state.lcdMarks[state.history.length - 1]);
  }

  /** If LCD is needed and hats not shown yet — show multipliers as the next solved step. */
  function maybeApplyLcdMarksOneStep() {
    if (lastStepHasLcdMarks()) return false;
    if (isDomainLcdServerMode()) {
      if (!state.lcdOfferNeeded) return false;
      requestDomainLcdAction(
        {
          intent: "lcd-one-step",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          domain: denomDomainPayload(),
        },
        function (res) {
          if (!res.ok || !res.mark) {
            showFeedback(false, "<strong>עוד לא.</strong> " + (res.message || "אין צורך במכנה משותף."));
            return;
          }
          clearLcdAssist();
          pushLcdMarksStep(res.mark, {
            message:
              "<strong>צעד.</strong> מכנה משותף " +
              res.mark.lcd +
              " — המכפילים מעל כל איבר (כמו במחברת). הצעד הבא: כפלו והורידו מכנים.",
          });
        }
      );
      return true;
    }
    if (!DoctematicaTeach || typeof DoctematicaTeach.analyzeLcdNeed !== "function") return false;
    if (lastStepHasLcdMarks()) return false;
    var info;
    try {
      info = DoctematicaTeach.analyzeLcdNeed(lastHistoryEq());
    } catch (err) {
      return false;
    }
    if (!info) return false;
    clearLcdAssist();
    pushLcdMarksStep(markFromLcdInfo(info), {
      message:
        "<strong>צעד.</strong> מכנה משותף " +
        info.lcd +
        " — המכפילים מעל כל איבר (כמו במחברת). הצעד הבא: כפלו והורידו מכנים.",
    });
    return true;
  }

  function renderFactorGuide() {
    if (factorGuideEl) {
      factorGuideEl.classList.add("hidden");
      factorGuideEl.innerHTML = "";
    }
    updateSplitBtn();
    updateFormulaBtn();
    renderLcdGuide();
    renderDomainGuide();
  }

  function doFactorSplit() {
    if (!canSplitFactor()) {
      showFeedback(false, "<strong>עוד לא.</strong> קודם הוציאו גורם משותף, למשל x(x−5)=0.");
      return;
    }
    if (isHighFactorServerMode() || isFactorServerMode() || (isMixedServerMode() && mixedPath() === "factor")) {
      var sendSplit = isHighFactorServerMode() ? requestHighPowerAction : requestQuadraticAction;
      sendSplit(
        {
          intent: "split",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          factor: factorPayload(),
        },
        function (res) {
          if (!res.ok) {
            showFeedback(false, "<strong>עוד לא.</strong> " + (res.message || ""));
            return;
          }
          applyFactorServerResult("", res);
        }
      );
      return;
    }
    if (geoEqSolveActive()) {
      state.mixed = state.mixed || emptyMixedState();
      state.mixed.path = "factor";
    }
    var Q = DoctematicaQuadratic;
    var pack = state.problem.factor;
    state.factor = state.factor || emptyFactorState();

    if (pack && pack.high && state.factor.split) {
      var which = -1;
      var prod2 = null;
      var bi;
      for (bi = 0; bi < 2; bi++) {
        if (state.factor.solved && state.factor.solved[bi]) continue;
        var beq = (state.factor.eqs && state.factor.eqs[bi]) || "";
        var bp = Q.parseProductEq(beq) || Q.parseHighProductEq(beq);
        if (bp && (bp.e2Kind === "linear" || (bp.f1 && bp.f2))) {
          which = bi;
          prod2 = bp;
          break;
        }
      }
      if (which < 0 || !prod2) {
        showFeedback(false, "<strong>עוד לא.</strong> אין מכפלה לפיצול בענף.");
        return;
      }
      var zEq = null;
      var otherEq = prod2.e2;
      var e1z =
        /^x\s*=\s*0$/i.test(String(prod2.e1 || "").replace(/\s+/g, "")) ||
        (Q.linearSolved(prod2.e1) && /x\s*=\s*0/i.test(prod2.e1));
      var e2z =
        /^x\s*=\s*0$/i.test(String(prod2.e2 || "").replace(/\s+/g, "")) ||
        (Q.linearSolved(prod2.e2) && /x\s*=\s*0/i.test(prod2.e2));
      if (e1z) {
        zEq = prod2.e1;
        otherEq = prod2.e2;
      } else if (e2z) {
        zEq = prod2.e2;
        otherEq = prod2.e1;
      } else if (prod2.e2Kind === "linear") {
        otherEq = prod2.e2;
        var e1raw = String(prod2.e1 || "").replace(/\s+/g, "");
        if (/^x=0$/i.test(e1raw) || /^x$/i.test(e1raw.replace(/=0$/, ""))) {
          zEq = prod2.e1.indexOf("=") >= 0 ? prod2.e1 : "x=0";
        }
      }
      // מציגים שוב את שני הגורמים אחרי הפיצול השני
      if (zEq) appendFactorTrail(which, zEq);
      appendFactorTrail(which, otherEq);
      state.factor.eqs[which] = otherEq;
      state.factor.solved[which] = false;
      renderFactorGuide();
      renderSteps();
      showFeedback(
        true,
        "<strong>חילקנו שוב.</strong> שוב קיבלתם x = 0 (כבר מהענף הראשון) ואת המשוואה " +
          otherEq +
          " — בודדו את x עד הסוף.",
        "tip"
      );
      mathField.focus();
      return;
    }

    var prod = pack.high
      ? Q.parseHighProductEq(lastHistoryEq())
      : Q.parseProductEq(lastHistoryEq());
    startFactorTrails(prod.e1, prod.e2);
    renderFactorGuide();
    renderSteps();
    var both = state.factor.solved[0] && state.factor.solved[1];
    if (both) {
      if (finishEqSolveForGeo(state.problem.factor.answer || "")) return;
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + (state.problem.factor.answer || ""));
      return;
    }
    var tip =
      pack.high && prod && prod.e2Kind === "axbx"
        ? "חילקנו. בענף השני אפשר להוציא שוב גורם x ואז לפצל פעם נוספת."
        : "מכפלה שווה אפס רק אם אחד הגורמים אפס. פתרו כל משוואה בנפרד.";
    showFeedback(true, "<strong>חילקנו.</strong> " + tip, "tip");
    mathField.focus();
  }

  function highBranchDone(eq, pack, which) {
    if (which === 0) {
      return /^x\s*=\s*0$/i.test(String(eq || "").replace(/\s+/g, ""));
    }
    if (pack && pack.e2Kind === "linear" && pack.linRoot != null) {
      // רק x = מספר נחשב סיום — לא x−2=0
      if (!DoctematicaQuadratic.linearSolved(eq)) return false;
      try {
        var sol = DoctematicaAlgebra.solutionOf(DoctematicaAlgebra.parseEquation(eq));
        return sol != null && Math.abs(sol - pack.linRoot) < 1e-6;
      } catch (err) {
        return false;
      }
    }
    return false;
  }

  function applyFactorServerResult(shownTyped, res) {
    res = res || {};
    if (res.raw && typeof res.raw === "object") {
      res = Object.assign({}, res.raw, res);
    }
    state.stats.try += 1;
    saveStats();
    renderStats();
    if (!res.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + (res.message || ""));
      return false;
    }
    var Q = DoctematicaQuadratic;
    var pack = state.problem.factor || {};
    state.factor = state.factor || emptyFactorState();
    if (res.canSplit != null) state.factor.canSplit = !!res.canSplit;
    if (res.sqrtProg) state.factor.sqrtProg = res.sqrtProg;
    var wasSplit = !!state.factor.split;
    var msg = String(res.message || res.hint || "");
    if (res.factored) {
      if (shownTyped && state.history[state.history.length - 1] !== shownTyped) {
        state.history.push(shownTyped);
      }
    } else if (res.rearrange) {
      if (shownTyped && state.history[state.history.length - 1] !== shownTyped) {
        state.history.push(shownTyped);
      }
    } else if (res.resplit) {
      if (res.eqs) state.factor.eqs = res.eqs;
      if (Array.isArray(res.solvedFlags)) state.factor.solved = res.solvedFlags;
      state.factor.split = true;
      state.factor.canSplit = false;
      if (typeof res.which === "number") {
        if (res.trailAlso) appendFactorTrail(res.which, res.trailAlso);
        if (res.eqs && res.eqs[res.which]) appendFactorTrail(res.which, res.eqs[res.which]);
      }
    } else if (res.split && !wasSplit) {
      var startEqs = res.eqs;
      if (!isHighFactorServerMode()) {
        var p0 = Q.parseProductEq(lastHistoryEq());
        if (p0) startEqs = [p0.e1, p0.e2];
      }
      if (startEqs && startEqs.length >= 2) startFactorTrails(startEqs[0], startEqs[1]);
    }
    if (!res.resplit && res.eqs) state.factor.eqs = res.eqs;
    if (!res.resplit && Array.isArray(res.solvedFlags)) state.factor.solved = res.solvedFlags;
    if (res.split || res.resplit) state.factor.split = true;
    if (res.progress) state.factor.progress = res.progress;
    if (!res.resplit && typeof res.which === "number" && shownTyped) {
      if (res.trailAlso) appendFactorTrail(res.which, res.trailAlso);
      appendFactorTrail(res.which, shownTyped);
    } else if (res.solved === true && res.progress) {
      if (res.progress.z) appendFactorTrail(0, "x = 0");
      else if (res.progress.o) appendFactorTrail(1, shownTyped);
    } else if (res.progress) {
      if (res.progress.z && !wasSplit) appendFactorTrail(0, shownTyped);
      if (res.progress.o) appendFactorTrail(1, shownTyped);
    }
    renderSteps();
    renderFactorGuide();
    var done = res.solvedAll || res.solved === true;
    if (done) {
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      renderSteps();
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + msg);
      return true;
    }
    mathField.clear();
    if (!shownTyped && (res.split || res.resplit)) {
      showFeedback(true, "<strong>חילקנו.</strong> " + msg, "tip");
      mathField.focus();
      return true;
    }
    var label = res.factored || res.solvedOne || res.solved ? "נכון" : "צעד חוקי";
    showFeedback(true, "<strong>" + label + ".</strong> " + msg);
    mathField.focus();
    return true;
  }

  function applyFactorTyped(typed) {
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו את הצעד הבא.");
      return false;
    }
    var shownTyped = String(typed || "").trim();
    typed = geoEngineTyped(shownTyped);
    if (isHighFactorServerMode()) {
      if (equationsCheckBusy) return true;
      var prevH = lastHistoryEq();
      if (
        !requestHighPowerAction(
          {
            intent: "check",
            start: (state.problem && state.problem.startEquation) || prevH,
            history: state.history && state.history.length ? state.history : [prevH],
            previous: prevH,
            typed: typed,
            factor: factorPayload(),
          },
          function (res) {
            applyFactorServerResult(shownTyped, res);
          }
        )
      ) {
        showBasicEqServerUnavailable();
      }
      return true;
    }
    if (isFactorServerMode() || (isMixedServerMode() && mixedPath() === "factor")) {
      if (equationsCheckBusy) return true;
      var prevF = lastHistoryEq();
      requestQuadraticAction(
        {
          intent: "check",
          start: (state.problem && state.problem.startEquation) || prevF,
          history: state.history && state.history.length ? state.history : [prevF],
          previous: prevF,
          typed: typed,
          factor: factorPayload(),
        },
        function (res) {
          applyFactorServerResult(shownTyped, res);
        }
      );
      return true;
    }
    if (isHighPowerTopic()) {
      showBasicEqServerUnavailable();
      return true;
    }
    state.stats.try += 1;
    saveStats();
    renderStats();
    var Q = DoctematicaQuadratic;
    var prev = lastHistoryEq();
    var pack = state.problem.factor;
    state.factor = state.factor || emptyFactorState();
    var res = Q.checkFactorTyped(prev, typed, pack, state.factor);
    if (!res.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
      return false;
    }
    var wasSplit = !!state.factor.split;
    if (res.factored) {
      if (state.history[state.history.length - 1] !== shownTyped) state.history.push(shownTyped);
    } else if (res.rearrange) {
      if (state.history[state.history.length - 1] !== shownTyped) state.history.push(shownTyped);
    } else if (res.split && !wasSplit) {
      var startEqs = res.eqs;
      var p0 = pack.high
        ? Q.parseHighProductEq(prev)
        : Q.parseProductEq(prev);
      if (p0) startEqs = [p0.e1, p0.e2];
      if (startEqs && startEqs.length >= 2) startFactorTrails(startEqs[0], startEqs[1]);
    }
    if (res.eqs) state.factor.eqs = res.eqs;
    if (Array.isArray(res.solvedFlags)) state.factor.solved = res.solvedFlags;
    else if (Array.isArray(res.solved)) state.factor.solved = res.solved;
    if (res.split) state.factor.split = true;
    if (res.progress) state.factor.progress = res.progress;
    if (res.sqrtProg) state.factor.sqrtProg = res.sqrtProg;
    if (typeof res.which === "number") {
      if (res.trailAlso) appendFactorTrail(res.which, res.trailAlso);
      appendFactorTrail(res.which, shownTyped);
    } else if (res.solved === true && res.progress) {
      if (res.progress.z) appendFactorTrail(0, "x = 0");
      if (pack.high && pack.quadRoot && res.progress.o && res.progress.n) {
        appendFactorTrail(1, "x = ±" + Q.fmtDisp(pack.quadRoot));
      } else if (pack.high && pack.e2Kind === "linear" && res.progress.o) {
        appendFactorTrail(1, "x = " + Q.fmtDisp(pack.linRootF || pack.otherF));
      } else if (pack.high && pack.quadKind === "none" && res.progress.n) {
        appendFactorTrail(1, "אין פתרון ממשי");
      } else if (res.progress.o) {
        appendFactorTrail(1, "x = " + Q.fmtDisp(pack.otherF));
      }
    } else if (res.progress) {
      if (res.progress.z && !wasSplit) appendFactorTrail(0, shownTyped);
      if (res.progress.o || res.progress.n) appendFactorTrail(1, shownTyped);
    }
    renderSteps();
    renderFactorGuide();
    var done = res.solvedAll || res.solved === true;
    if (done) {
      if (finishEqSolveForGeo((state.problem.factor && state.problem.factor.answer) || shownTyped)) return true;
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      renderSteps();
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + res.message);
      return true;
    }
    mathField.clear();
    var label = res.factored || res.solvedOne || res.solved ? "נכון" : "צעד חוקי";
    showFeedback(true, "<strong>" + label + ".</strong> " + res.message);
    mathField.focus();
    return true;
  }

  function isGuidedMode() {
    return (
      isStepMode() ||
      isSystemMode() ||
      isQuadraticTopic() ||
      isHighPowerTopic() ||
      isAnalyticTopic() ||
      state.topic === "equations"
    );
  }

  function topicLevels() {
    var sub =
      state.topic === "equations" || state.topic === "analytic" ? state.subtopic : null;
    return DoctematicaContent.levels(state.topic, sub);
  }

  function isWorksheet() {
    return isGuidedMode() && state.source === "worksheet";
  }

  function isComingSoon() {
    var level = currentLevel();
    return isWorksheet() && (!level || !level.exercises || !level.exercises.length);
  }

  function currentLevel() {
    var levels = topicLevels();
    return (
      levels.filter(function (item) {
        return item.id === state.levelId;
      })[0] || levels[0]
    );
  }

  function renderSources() {
    sourcesEl.innerHTML = "";
    if (!isGuidedMode()) {
      sourcesWrap.classList.add("hidden");
      worksheetNav.classList.add("hidden");
      randomWrap.classList.remove("hidden");
      return;
    }
    sourcesWrap.classList.remove("hidden");
    topicLevels().forEach(function (level) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = level.title;
      btn.className = state.source === "worksheet" && state.levelId === level.id ? "active" : "";
      btn.addEventListener("click", function () {
        state.source = "worksheet";
        state.levelId = level.id;
        state.exerciseIndex = 0;
        nextProblem();
      });
      sourcesEl.appendChild(btn);
    });
    if (state.topic === "equations" && state.subtopic === "basic") {
      var randomBtn = document.createElement("button");
      randomBtn.type = "button";
      randomBtn.textContent = "מאגר אקראי";
      randomBtn.className = state.source === "random" ? "active" : "";
      randomBtn.addEventListener("click", function () {
        state.source = "random";
        nextProblem();
      });
      sourcesEl.appendChild(randomBtn);
    }
  }

  function renderWorksheetNav() {
    if (!isWorksheet()) {
      worksheetNav.classList.add("hidden");
      randomWrap.classList.remove("hidden");
      return;
    }
    worksheetNav.classList.remove("hidden");
    randomWrap.classList.add("hidden");
    var level = currentLevel();
    if (level.mode === "geo-length") {
      instructionEl.innerHTML = "";
      instructionEl.classList.add("hidden");
    } else {
      instructionEl.classList.remove("hidden");
      instructionEl.innerHTML =
        DoctematicaMath && DoctematicaMath.proseHTML
          ? DoctematicaMath.proseHTML(level.instruction)
          : level.instruction;
    }
    exerciseNumsEl.innerHTML = "";
    if (!level.exercises || !level.exercises.length) {
      prevExBtn.classList.add("hidden");
      nextExBtn.classList.add("hidden");
      return;
    }
    prevExBtn.classList.remove("hidden");
    nextExBtn.classList.remove("hidden");
    level.exercises.forEach(function (ex, index) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(ex.n);
      btn.className = index === state.exerciseIndex ? "active" : "";
      btn.addEventListener("click", function () {
        state.exerciseIndex = index;
        nextProblem();
      });
      exerciseNumsEl.appendChild(btn);
    });
  }

  function renderTopics() {
    topicsEl.innerHTML = "";
    DoctematicaProblems.topics.forEach(function (topic) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = topic.label;
      btn.className = topic.id === state.topic ? "active" : "";
      btn.addEventListener("click", function () {
        state.topic = topic.id;
        state.source = "worksheet";
        state.exerciseIndex = 0;
        if (topic.id === "equations" || topic.id === "analytic") {
          var subs = (DoctematicaProblems.subtopics && DoctematicaProblems.subtopics[topic.id]) || [];
          state.subtopic = state.subtopic || (subs[0] && subs[0].id);
          if (!subs.some(function (s) { return s.id === state.subtopic; })) {
            state.subtopic = subs[0] ? subs[0].id : null;
          }
          if (topic.id === "equations" && state.subtopic !== "basic" && state.source === "random") {
            state.source = "worksheet";
          }
        }
        var first = DoctematicaContent.levels(
          topic.id,
          topic.id === "equations" || topic.id === "analytic" ? state.subtopic : null
        )[0];
        state.levelId = first ? first.id : "level-01";
        renderTopics();
        renderSubtopics();
        renderSources();
        renderKinds();
        nextProblem();
      });
      topicsEl.appendChild(btn);
    });
  }

  function renderSubtopics() {
    var list = (DoctematicaProblems.subtopics && DoctematicaProblems.subtopics[state.topic]) || [];
    if (!list.length) {
      subtopicsWrap.classList.add("hidden");
      return;
    }
    subtopicsWrap.classList.remove("hidden");
    subtopicsEl.innerHTML = "";
    list.forEach(function (item) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = item.label;
      btn.className = item.id === state.subtopic ? "active" : "";
      btn.addEventListener("click", function () {
        state.subtopic = item.id;
        state.source = "worksheet";
        state.exerciseIndex = 0;
        var first = topicLevels()[0];
        state.levelId = first ? first.id : "level-01";
        renderSubtopics();
        renderSources();
        nextProblem();
      });
      subtopicsEl.appendChild(btn);
    });
  }

  function renderKinds() {
    kindsEl.innerHTML = "";
    if (isComingSoon()) {
      kindsWrap.classList.add("hidden");
      eqActions.classList.add("hidden");
      return;
    }
    if (!isStepMode() || isWorksheet()) {
      kindsWrap.classList.add("hidden");
      if (isGuidedMode()) eqActions.classList.remove("hidden");
      else eqActions.classList.add("hidden");
      return;
    }
    kindsWrap.classList.remove("hidden");
    eqActions.classList.remove("hidden");
    DoctematicaBank.kinds.forEach(function (kind) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = kind.label;
      btn.className = kind.id === state.kind ? "active" : "";
      btn.addEventListener("click", function () {
        state.kind = kind.id;
        renderKinds();
        nextProblem();
      });
      kindsEl.appendChild(btn);
    });
    var stats = DoctematicaBank.counts();
    var n = DoctematicaBank.all.filter(function (it) {
      if (it.level !== levelEl.value) return false;
      if (state.kind === "all") return true;
      return it.kind === state.kind;
    }).length;
    bankCountEl.textContent =
      n + " תרגילים במאגר לסוג ולרמה שנבחרו (סה״כ " + stats.total + " משוואות עם פתרון מלא).";
  }

  function currentTopicLabel() {
    var found = DoctematicaProblems.topics.find(function (t) {
      return t.id === state.topic;
    });
    var label = found ? found.label : "";
    if (state.topic === "equations" || state.topic === "analytic") {
      var subList =
        (DoctematicaProblems.subtopics && DoctematicaProblems.subtopics[state.topic]) || [];
      var sub = (subList.filter(function (s) {
        return s.id === state.subtopic;
      })[0] || {}).label;
      if (sub) label = sub;
    }
    return label;
  }

  function parseAnswer(text) {
    var cleaned = String(text).trim().replace(/\s+/g, "").replace(",", ".");
    if (!cleaned) return null;
    if (cleaned.indexOf("/") !== -1) {
      var parts = cleaned.split("/");
      if (parts.length !== 2) return null;
      var n = Number(parts[0]);
      var d = Number(parts[1]);
      if (!isFinite(n) || !isFinite(d) || d === 0) return null;
      var s = DoctematicaProblems.simplify(n, d);
      return { value: s.n / s.d, n: s.n, d: s.d };
    }
    var num = Number(cleaned);
    if (!isFinite(num)) return null;
    return { value: num, n: num, d: 1 };
  }

  function answersMatch(user, problem) {
    if (!user) return false;
    if (problem.n != null && problem.d != null) {
      if (user.d === 1 && user.n !== Math.round(user.n)) {
        return Math.abs(user.value - problem.n / problem.d) < 1e-8;
      }
      var s = DoctematicaProblems.simplify(Math.round(user.n), Math.round(user.d));
      return s.n === problem.n && s.d === problem.d;
    }
    return Math.abs(user.value - problem.value) < 1e-9;
  }

  function showFeedback(ok, message, tone) {
    feedbackEl.classList.remove("hidden", "ok", "bad", "tip");
    feedbackEl.classList.add(tone || (ok ? "ok" : "bad"));
    feedbackEl.innerHTML = message;
  }

  function showChoiceAdvice(advice) {
    if (!advice) return;
    showFeedback(
      advice.tone === "ok",
      "<strong>" + (advice.tone === "ok" ? "טוב." : "שימו לב.") + "</strong> " + advice.message,
      advice.tone
    );
  }

  function renderStats() {
    scoreEl.textContent = state.streak + " נכונות ברצף";
  }

  function renderSysKnown() {
    if (formulaWorkActive() && state.quad && state.quad.gotAbc) {
      renderQuadKnown();
      return;
    }
    if (!isSystemMode() || !state.sys) {
      sysKnownEl.classList.add("hidden");
      solveWrap.classList.remove("is-system");
      return;
    }
    solveWrap.classList.add("is-system");
    sysKnownEl.classList.remove("hidden");
    sysKnownEl.innerHTML = "<p class=\"k-title\">משתנים</p>";
    ["x", "y"].forEach(function (v) {
      var row = document.createElement("div");
      var has = typeof state.sys.known[v] === "number";
      row.className = "k-row" + (has ? " is-set" : "");
      row.innerHTML =
        '<span class="k-var">' +
        v +
        '</span><span class="k-eq">=</span><span class="k-val">' +
        (has ? DoctematicaSystems.fmt(state.sys.known[v]) : "?") +
        "</span>";
      sysKnownEl.appendChild(row);
    });
  }

  function mergeSysFromView(view) {
    if (!state.sys) state.sys = {};
    view = view || {};
    state.sys.phase = view.phase || null;
    state.sys.known = view.known || {};
    state.sys.needSub = !!view.needSub;
    state.sys.wantVar = view.wantVar;
    state.sys.workFrom = view.workFrom;
    state.sys.workTarget = view.workTarget;
    state.sys.found = view.found || null;
    state.sys.view = view;
  }

  function beginWorkFromView(view) {
    mergeSysFromView(view);
    var startEq = view && view.startEq;
    if (startEq) {
      if (!state.history.length) {
        state.history = [startEq];
        state.sys.givenAt = [0];
      } else if (state.history[state.history.length - 1] !== startEq) {
        state.history.push(startEq);
        if (!state.sys.givenAt) state.sys.givenAt = [];
        state.sys.givenAt.push(state.history.length - 1);
      }
    }
    mathField.clear();
    mathField.setDisabled(false);
    setWorkInput(!!(view && view.input));
    renderSysGuide();
    renderSteps();
    if (view && view.input) mathField.focus();
  }

  function applySysSetup(view) {
    if (!view || view.ok === false) {
      showFeedback(false, "<strong>עוד לא.</strong> " + ((view && view.message) || "לא ניתן להתחיל את המערכת."));
      return;
    }
    mergeSysFromView(view);
    renderSysGuide();
    renderSteps();
  }

  function sendSysChoice(choice, confirm) {
    if (!state.sys) return;
    if (equationsCheckBusy) return;
    if (
      !requestSystemsAction(
        {
          intent: "choice",
          choice: choice,
          confirm: !!confirm,
          history: state.history || [],
          choices: state.sys.choices || [],
        },
        applySysChoiceView
      )
    ) {
      showBasicEqServerUnavailable();
    }
  }

  function applySysChoiceView(remote) {
    remote = remote || {};
    if (remote.applied === false && remote.pendingChoice) {
      state.sys.pendingChoice = remote.pendingChoice;
      mergeSysFromView(remote);
      showChoiceAdvice({
        tone: "tip",
        message:
          ((remote.advice && remote.advice.message) || remote.message || "") +
          " אפשר לבחור אפשרות אחרת, או להמשיך בבחירה הזו.",
      });
      renderSysGuide();
      return;
    }
    if (!remote.ok && !remote.applied) {
      showFeedback(false, "<strong>עוד לא.</strong> " + (remote.message || "בחירה לא חוקית."));
      return;
    }
    state.sys.pendingChoice = null;
    if (remote.choice) {
      if (!state.sys.choices) state.sys.choices = [];
      state.sys.choices.push(remote.choice);
    }
    if (remote.advice) showChoiceAdvice(remote.advice);
    beginWorkFromView(remote);
  }

  function startSystemSession(problem) {
    state.sys = {
      eq: [problem.eq1, problem.eq2],
      choices: [],
      known: {},
      found: null,
      workFrom: null,
      workTarget: null,
      givenAt: [],
      keepAt: [],
      pendingChoice: null,
      phase: null,
      view: null,
    };
    if (
      !requestSystemsAction(
        {
          intent: "setup",
          eq1: problem.eq1,
          eq2: problem.eq2,
          history: [],
          choices: [],
        },
        applySysSetup
      )
    ) {
      showBasicEqServerUnavailable();
    }
  }

  function setWorkInput(on) {
    mathWrap.classList.toggle("hidden", !on);
    mathKeysEl.classList.toggle("hidden", !on);
    checkBtn.classList.toggle("hidden", !on);
    answerLabelEl.classList.toggle("hidden", !on);
  }

  function addSysBtn(label, onClick) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function markKeep() {
    if (!state.sys.keepAt) state.sys.keepAt = [];
    var i = state.history.length - 1;
    if (state.sys.keepAt.indexOf(i) === -1) state.sys.keepAt.push(i);
  }

  function finishSystem(kind, extra) {
    state.sys.phase = "done";
    setWorkInput(false);
    renderSysGuide();
    renderSteps();
    if (kind === "none") {
      markSolved();
      mathField.setDisabled(true);
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>אין פתרון.</strong> המערכת סותרת.");
      return;
    }
    if (kind === "infinite") {
      markSolved();
      mathField.setDisabled(true);
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>אינסוף פתרונות.</strong> המשוואות תלויות.");
      return;
    }
    markSolved();
    mathField.setDisabled(true);
    nextAfterSolveBtn.classList.remove("hidden");
    showFeedback(
      true,
      "<strong>כל הכבוד.</strong> x = " +
        DoctematicaSystems.fmt(state.sys.known.x) +
        ", y = " +
        DoctematicaSystems.fmt(state.sys.known.y) +
        (extra ? " " + extra : "")
    );
  }

  function renderSysGuide() {
    renderSysKnown();
    if (!isSystemMode() || !state.sys) {
      sysGuideEl.classList.add("hidden");
      sysGuideEl.innerHTML = "";
      return;
    }
    var sys = state.sys;
    var view = sys.view || {};
    if (sys.phase === "done" || !sys.phase) {
      sysGuideEl.classList.add("hidden");
      sysGuideEl.innerHTML = "";
      if (!sys.phase) setWorkInput(false);
      return;
    }
    sysGuideEl.classList.remove("hidden");
    sysGuideEl.innerHTML = "";
    var p = document.createElement("p");
    p.textContent = view.prompt || "";
    sysGuideEl.appendChild(p);
    var buttons = view.buttons || [];
    if (buttons.length) {
      var row = document.createElement("div");
      row.className = "topics";
      buttons.forEach(function (btn) {
        row.appendChild(
          addSysBtn(btn.label, function () {
            sendSysChoice(btn.choice, false);
          })
        );
      });
      sysGuideEl.appendChild(row);
    }
    if (sys.pendingChoice) {
      var wrap = document.createElement("div");
      wrap.className = "topics sys-continue-row";
      wrap.appendChild(
        addSysBtn("להמשיך בבחירה הזו", function () {
          var pending = state.sys.pendingChoice;
          state.sys.pendingChoice = null;
          if (pending) sendSysChoice(pending, true);
        })
      );
      sysGuideEl.appendChild(wrap);
    }
    setWorkInput(!!view.input && String(sys.phase).indexOf("work") === 0);
  }

  function applySysCheckView(typed, remote) {
    remote = remote || {};
    state.stats.try += 1;
    saveStats();
    renderStats();
    if (!remote.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + (remote.message || ""));
      return;
    }
    state.history.push(typed);
    if (remote.keep) markKeep();
    mergeSysFromView(remote);
    renderSteps();
    if (remote.solved) {
      finishSystem(remote.kind);
      return;
    }
    var kind = remote.resultKind || "";
    var phaseBeforePick = String(remote.phase || "").indexOf("pick") === 0;
    if (phaseBeforePick && (kind === "isolated" || kind === "value")) {
      showFeedback(true, "<strong>מצוין.</strong> " + (remote.message || ""));
      setWorkInput(false);
      renderSysGuide();
      return;
    }
    if (kind === "value" && remote.found && remote.phase === "work_back") {
      mathField.clear();
      showFeedback(
        true,
        "מצאתם " +
          remote.found.v +
          " = " +
          DoctematicaSystems.fmt(remote.found.value) +
          ". המשיכו עד למשתנה השני."
      );
      mathField.focus();
      renderSysGuide();
      return;
    }
    mathField.clear();
    showFeedback(true, "<strong>צעד חוקי.</strong> " + (remote.message || ""));
    mathField.focus();
    renderSysGuide();
  }

  function handleSystemSubmit() {
    var sys = state.sys;
    if (!sys || String(sys.phase).indexOf("work") !== 0) return;
    var typed = typedAnswer().trim();
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו את הצעד הבא.");
      return;
    }
    if (equationsCheckBusy) return;
    if (
      !requestSystemsAction(
        {
          intent: "check",
          typed: typed,
          history: state.history || [],
          choices: sys.choices || [],
        },
        function (remote) {
          applySysCheckView(typed, remote);
        }
      )
    ) {
      showBasicEqServerUnavailable();
    }
  }

  function isGeoQuestionHeader(line) {
    return /^שאלה:/.test(String(line || ""));
  }

  function isGeoPartHeader(line) {
    return /^סעיף:/.test(String(line || ""));
  }

  function isGeoTaskHeader(line) {
    return /^משימה:/.test(String(line || ""));
  }

  function isGeoSectionHeader(line) {
    return isGeoPartHeader(line) || isGeoTaskHeader(line) || isGeoQuestionHeader(line);
  }

  function geoPartHeaderLabel(line) {
    return String(line || "").replace(/^סעיף:/, "");
  }

  function geoPartByLabel(pack, label) {
    if (!pack || !pack.parts) return null;
    var want = String(label || "");
    var i;
    for (i = 0; i < pack.parts.length; i++) {
      if (String(pack.parts[i].label || "") === want) return pack.parts[i];
    }
    return null;
  }

  function geoPartInstructionHtml(pack, label) {
    var part = geoPartByLabel(pack, label);
    var text = part && part.text ? String(part.text).trim() : "";
    if (!text) return "";
    if (DoctematicaGeometry.formatPartHtml) return DoctematicaGeometry.formatPartHtml(text);
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function geoTaskHeaderLabel(line) {
    return String(line || "").replace(/^משימה:/, "");
  }

  function ensureGeoQuestionRow(pack) {
    var parts = (pack && pack.parts) || [];
    var i;
    for (i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p || p.label || !String(p.text || "").trim()) continue;
      var marker = "שאלה:" + String(p.text).trim();
      if (state.history.indexOf(marker) >= 0) return;
      state.history.push(marker);
      return;
    }
  }

  function ensureGeoPartHeader(label) {
    if (!label) return;
    var marker = "סעיף:" + label;
    if (state.history.indexOf(marker) >= 0) return;
    state.history.push(marker);
  }

  function ensureGeoTaskHeader(task) {
    if (!task || !DoctematicaGeometry.taskStepLabel) return;
    var label = DoctematicaGeometry.taskStepLabel(task);
    if (!label) return;
    var marker = "משימה:" + label;
    if (state.history.indexOf(marker) >= 0) return;
    state.history.push(marker);
  }

  function ensureGeoFocusTaskHeader(pack, geo) {
    if (!pack || !DoctematicaGeometry.taskStepLabel) return;
    if (
      DoctematicaGeometry.lineMatchPartActive &&
      DoctematicaGeometry.lineMatchPartActive(pack, geo || state.geo)
    ) {
      return;
    }
    var g = geo || state.geo;
    var heading =
      DoctematicaGeometry.partHeadingTask && DoctematicaGeometry.partHeadingTask(pack, g);
    if (!heading) return;
    ensureGeoTaskHeader(heading);
  }

  function lastHistoryStepIndex() {
    var i;
    for (i = state.history.length - 1; i >= 0; i--) {
      if (isGeoSectionHeader(state.history[i])) continue;
      if (i === 0 && /^נתון/.test(String(state.history[i] || ""))) continue;
      return i;
    }
    return -1;
  }

  function attachStepNote(text) {
    var idx = lastHistoryStepIndex();
    if (idx < 0) return;
    if (!state.geo.notes) state.geo.notes = {};
    state.geo.notes[idx] = String(text || "").trim();
    state.geo.noteOpen = null;
  }

  function renderGeoAskUi() {
    var pack = state.problem && state.problem.geo;
    var ask =
      pack && DoctematicaGeometry.lineAsk
        ? DoctematicaGeometry.lineAsk(pack, state.geo)
        : null;
    var yesno = ask && ask.stage === "yesno" && !state.locked;
    var reasonNeed = ask && ask.stage === "reason" && !state.locked;
    if (yesnoAskEl) {
      if (yesno) {
        yesnoAskEl.classList.remove("hidden");
        if (yesnoQEl) yesnoQEl.textContent = ask.question || "האם הנקודה על הישר?";
      } else {
        yesnoAskEl.classList.add("hidden");
      }
    }
    if (reasonBoxEl) {
      if (reasonNeed) {
        reasonBoxEl.classList.remove("hidden");
        if (reasonInput && !reasonInput.value) reasonInput.placeholder = "או כתבו נימוק משלכם";
        if (reasonChoicesEl) {
          reasonChoicesEl.innerHTML = "";
          var opts =
            (DoctematicaGeometry.reasonChoices && DoctematicaGeometry.reasonChoices(ask.task)) || [];
          opts.forEach(function (opt) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "reason-choice";
            b.textContent = opt;
            b.addEventListener("click", function () {
              applyRequiredReason(opt);
            });
            reasonChoicesEl.appendChild(b);
          });
        }
      } else {
        reasonBoxEl.classList.add("hidden");
        if (reasonInput) reasonInput.value = "";
        if (reasonChoicesEl) reasonChoicesEl.innerHTML = "";
      }
    }
    var hideMath = !!(yesno || reasonNeed);
    var lineMatch =
      pack &&
      DoctematicaGeometry.lineMatchPartActive &&
      DoctematicaGeometry.lineMatchPartActive(pack, state.geo);
    if (lineMatch) hideMath = true;
    if (answerRowEl) {
      if (hideMath) answerRowEl.classList.add("hidden");
      else answerRowEl.classList.remove("hidden");
    }
    if (mathKeysEl) {
      if (hideMath) mathKeysEl.classList.add("hidden");
      else mathKeysEl.classList.remove("hidden");
    }
  }

  function renderSteps() {
    stepsEl.innerHTML = "";
    if (state.problem && state.problem.mode === "geo-length" && state.history.length) {
      stepsEl.classList.remove("hidden");
      var stepNum = 0;
      var isLineMatch =
        state.problem.geo &&
        DoctematicaGeometry.lineMatchPartActive &&
        DoctematicaGeometry.lineMatchPartActive(state.problem.geo, state.geo);
      state.history.forEach(function (line, index) {
        var li = document.createElement("li");
        var n = document.createElement("span");
        n.className = "n";
        var body = document.createElement("span");
        if (index === 0 && !isLineMatch && !isGeoSectionHeader(line) && /^נתון/.test(String(line || ""))) {
          n.textContent = "נתון";
          var givenBody = String(line).replace(/^נתון:\s*/, "") || "נקודות על מערכת הצירים";
          if (DoctematicaGeometry.formatPartHtml) {
            body.innerHTML = DoctematicaGeometry.formatPartHtml(givenBody);
          } else {
            body.textContent = givenBody;
          }
        } else if (isGeoPartHeader(line)) {
          var plab = geoPartHeaderLabel(line);
          n.textContent = plab || "·";
          var partHtml =
            state.problem.geo && geoPartInstructionHtml(state.problem.geo, plab);
          if (partHtml) {
            body.innerHTML = partHtml;
            li.classList.add("geo-section-row", "geo-part-row");
          } else {
            body.textContent = plab ? "סעיף " + plab : "סעיף";
            li.classList.add("geo-section-row");
          }
        } else if (isGeoQuestionHeader(line)) {
          n.textContent = "שאלה";
          var qText = String(line).replace(/^שאלה:/, "");
          if (DoctematicaGeometry.formatPartHtml) {
            body.innerHTML = DoctematicaGeometry.formatPartHtml(qText);
          } else {
            body.textContent = qText;
          }
          li.classList.add("geo-section-row", "geo-part-row");
        } else if (isGeoTaskHeader(line)) {
          n.textContent = "▸";
          body.textContent = geoTaskHeaderLabel(line);
          li.classList.add("geo-section-row", "geo-task-row");
        } else {
          stepNum += 1;
          n.textContent = String(stepNum);
          var histLine = String(line);
          if (DoctematicaGeometry.capsHistoryLetters) {
            histLine = DoctematicaGeometry.capsHistoryLetters(histLine);
          }
          body.innerHTML = DoctematicaMath.toHTML(histLine);
        }
        li.appendChild(n);
        li.appendChild(body);
        var isGivenRow =
          index === 0 &&
          !isLineMatch &&
          !isGeoSectionHeader(line) &&
          /^נתון/.test(String(line || ""));
        if (!isGivenRow && !isGeoSectionHeader(line)) {
          var noteWrap = document.createElement("div");
          noteWrap.className = "step-note";
          var saved = state.geo && state.geo.notes && state.geo.notes[index];
          if (saved) {
            noteWrap.classList.add("has-text");
            if (DoctematicaMath && DoctematicaMath.proseHTML) {
              noteWrap.innerHTML = DoctematicaMath.proseHTML(saved);
            } else {
              noteWrap.textContent = saved;
            }
          } else if (!state.locked) {
            var askReason =
              DoctematicaGeometry.lineAsk &&
              DoctematicaGeometry.lineAsk(state.problem.geo, state.geo);
            if (askReason && askReason.stage === "reason" && index === lastHistoryStepIndex()) {
              noteWrap.classList.add("is-wait");
            } else if (state.geo && state.geo.noteOpen === index) {
              var ta = document.createElement("textarea");
              ta.rows = 2;
              ta.dir = "rtl";
              ta.className = "step-note-input";
              ta.placeholder = "נימוק";
              ta.addEventListener("keydown", function (ev) {
                if (ev.key === "Enter" && !ev.shiftKey) {
                  ev.preventDefault();
                  if (!state.geo.notes) state.geo.notes = {};
                  state.geo.notes[index] = ta.value.trim();
                  state.geo.noteOpen = null;
                  renderSteps();
                }
              });
              var saveBtn = document.createElement("button");
              saveBtn.type = "button";
              saveBtn.className = "step-note-save";
              saveBtn.textContent = "שמירה";
              saveBtn.addEventListener("click", function () {
                if (!state.geo.notes) state.geo.notes = {};
                state.geo.notes[index] = ta.value.trim();
                state.geo.noteOpen = null;
                renderSteps();
              });
              noteWrap.appendChild(ta);
              noteWrap.appendChild(saveBtn);
              setTimeout(function () {
                ta.focus();
              }, 0);
            } else {
              var askBtn = document.createElement("button");
              askBtn.type = "button";
              askBtn.className = "step-note-ask";
              askBtn.textContent = "לנמק?";
              askBtn.addEventListener("click", function () {
                state.geo.noteOpen = index;
                renderSteps();
              });
              noteWrap.appendChild(askBtn);
            }
          }
          li.appendChild(noteWrap);
          li.classList.add("has-step-note");
        }
        if (state.locked && index === state.history.length - 1 && !isGeoPartHeader(line)) {
          li.classList.add("solved-row");
        }
        stepsEl.appendChild(li);
      });
      var geoFactorSplit =
        factorWorkActive() &&
        state.factor &&
        state.factor.split &&
        state.factor.trails &&
        (state.factor.trails[0].length || state.factor.trails[1].length);
      if (geoFactorSplit) {
        stepsEl.appendChild(renderFactorFork(stepNum + 1));
      }
      var liveTrail =
        formulaWorkActive() && state.quad && state.quad.trail && state.quad.trail.length
          ? state.quad.trail
          : state.geo && state.geo.eqTrail && state.geo.eqTrail.length
            ? state.geo.eqTrail
            : null;
      if (liveTrail) {
        liveTrail.forEach(function (item, index) {
          var liQ = document.createElement("li");
          var nQ = document.createElement("span");
          nQ.className = "n";
          nQ.textContent = index === 0 ? "מקדמים" : String(index);
          var bodyQ = document.createElement("span");
          bodyQ.innerHTML = item.html;
          liQ.appendChild(nQ);
          liQ.appendChild(bodyQ);
          if (state.locked && index === liveTrail.length - 1) liQ.classList.add("solved-row");
          stepsEl.appendChild(liQ);
        });
      }
      renderFactorGuide();
      if (formulaWorkActive()) renderQuadGuide();
      return;
    }
    if (formulaWorkActive() && state.quad && state.quad.trail && state.quad.trail.length) {
      stepsEl.classList.remove("hidden");
      if (isMixedEqMode() && state.history.length) {
        var stepNumF = { n: 0 };
        state.history.forEach(function (eq, index) {
          var li0 = document.createElement("li");
          var n0 = document.createElement("span");
          n0.className = "n";
          n0.textContent = index === 0 ? "נתון" : String(++stepNumF.n);
          var body0 = document.createElement("span");
          var mark0 = state.lcdMarks && state.lcdMarks[index];
          if (mark0) {
            body0.appendChild(buildLcdEqView(mark0));
            refitLcdMuls(body0);
          } else {
            body0.innerHTML = DoctematicaMath.toHTML(eq);
          }
          li0.appendChild(n0);
          li0.appendChild(body0);
          stepsEl.appendChild(li0);
          if (index === 0) appendDomainHistorySteps(stepsEl, stepNumF);
        });
      }
      state.quad.trail.forEach(function (item, index) {
        var li = document.createElement("li");
        var n = document.createElement("span");
        n.className = "n";
        n.textContent = index === 0 ? "מקדמים" : String(index);
        var body = document.createElement("span");
        body.innerHTML = item.html;
        li.appendChild(n);
        li.appendChild(body);
        if (state.locked && index === state.quad.trail.length - 1) li.classList.add("solved-row");
        stepsEl.appendChild(li);
      });
      return;
    }
    if (!isGuidedMode() || !state.history.length) {
      stepsEl.classList.add("hidden");
      renderFactorGuide();
      return;
    }
    stepsEl.classList.remove("hidden");
    var givenAt = (state.sys && state.sys.givenAt) || (isSystemMode() ? [0] : null);
    var stepNum = { n: 0 };
    var factorSplit =
      factorWorkActive() &&
      state.factor &&
      state.factor.split &&
      state.factor.trails &&
      (state.factor.trails[0].length || state.factor.trails[1].length);
    state.history.forEach(function (eq, index) {
      var li = document.createElement("li");
      var n = document.createElement("span");
      n.className = "n";
      var isGiven = givenAt ? givenAt.indexOf(index) !== -1 : index === 0;
      n.textContent = isGiven ? "נתון" : String(++stepNum.n);
      var body = document.createElement("span");
      var mark = state.lcdMarks && state.lcdMarks[index];
      if (mark) {
        body.appendChild(buildLcdEqView(mark));
        refitLcdMuls(body);
      } else {
        body.innerHTML = DoctematicaMath.toHTML(eq);
      }
      li.appendChild(n);
      li.appendChild(body);
      var isKeep = state.sys && state.sys.keepAt && state.sys.keepAt.indexOf(index) !== -1;
      if (isKeep) {
        li.classList.add("keep-row");
        var tag = document.createElement("span");
        tag.className = "keep-tag";
        tag.textContent = "לשימוש בהמשך";
        li.appendChild(tag);
      }
      if (state.locked && index === state.history.length - 1 && !factorSplit) {
        li.classList.add("solved-row");
      }
      stepsEl.appendChild(li);
      if (index === 0) appendDomainHistorySteps(stepsEl, stepNum);
    });
    if (factorSplit) {
      stepsEl.appendChild(renderFactorFork(stepNum.n + 1));
    }
    renderFactorGuide();
    renderDomainGuide();
  }

  function renderFactorFork(baseNum) {
    var st = state.factor;
    var letters = ["א", "ב"];
    var wrap = document.createElement("li");
    wrap.className = "factor-fork";
    var i;
    for (i = 0; i < 2; i++) {
      var col = document.createElement("div");
      col.className = "factor-branch" + (st.solved[i] ? " is-done" : "");
      var trail = st.trails[i] && st.trails[i].length ? st.trails[i] : st.eqs[i] ? [st.eqs[i]] : [];
      trail.forEach(function (eq, k) {
        var row = document.createElement("div");
        var isLast = k === trail.length - 1;
        row.className =
          "factor-branch-step" +
          (st.solved[i] && isLast ? " is-final" : "") +
          (!st.solved[i] && isLast ? " is-current" : "");
        var n = document.createElement("span");
        n.className = "n";
        n.textContent = baseNum + k + "." + letters[i];
        var body = document.createElement("span");
        body.innerHTML = DoctematicaMath.toHTML(eq);
        row.appendChild(n);
        row.appendChild(body);
        if (st.solved[i] && isLast) {
          var ok = document.createElement("span");
          ok.className = "factor-eq-n";
          ok.textContent = "✓";
          row.appendChild(ok);
        }
        col.appendChild(row);
      });
      wrap.appendChild(col);
    }
    return wrap;
  }

  function qText(n) {
    var span = document.createElement("span");
    var s = String(n).replace(/-/g, "−");
    span.textContent = n < 0 ? "(" + s + ")" : s;
    return span;
  }

  function qNum(n) {
    var span = document.createElement("span");
    span.textContent = String(n).replace(/-/g, "−");
    return span;
  }

  function qSlot(name, extraClass) {
    var inp = document.createElement("input");
    inp.type = "text";
    inp.className = "q-slot" + (extraClass ? " " + extraClass : "");
    inp.setAttribute("data-q", name);
    inp.setAttribute("dir", "ltr");
    inp.autocomplete = "off";
    inp.placeholder = "□";
      inp.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        handleQuadSubmit();
      }
    });
    return inp;
  }

  function bindQuadArrows(root) {
    var slots = [].slice.call(root.querySelectorAll("input.q-slot:not([disabled])"));
    slots.forEach(function (inp, i) {
      inp.addEventListener("keydown", function (event) {
        if (
          event.key !== "ArrowLeft" &&
          event.key !== "ArrowRight" &&
          event.key !== "ArrowUp" &&
          event.key !== "ArrowDown"
        ) {
          return;
        }
        var start = inp.selectionStart;
        var end = inp.selectionEnd;
        var atStart = start === 0 && end === 0;
        var atEnd = start === (inp.value || "").length && end === (inp.value || "").length;
        var next = -1;
        if (event.key === "ArrowRight" && atEnd) next = i + 1;
        if (event.key === "ArrowLeft" && atStart) next = i - 1;
        if (event.key === "ArrowDown") next = i + 1;
        if (event.key === "ArrowUp") next = i - 1;
        if (next < 0 || next >= slots.length) return;
        event.preventDefault();
        var el = slots[next];
        el.focus();
        var pos = event.key === "ArrowLeft" || event.key === "ArrowUp" ? (el.value || "").length : 0;
        try {
          el.setSelectionRange(pos, pos);
        } catch (err) {}
      });
    });
  }

  function qPow(baseNode) {
    var wrap = document.createElement("span");
    wrap.className = "m-pow";
    wrap.appendChild(baseNode);
    var sup = document.createElement("sup");
    sup.className = "m-sup";
    sup.textContent = "2";
    wrap.appendChild(sup);
    return wrap;
  }

  function qAppend(host, text) {
    host.appendChild(document.createTextNode(text));
  }

  function prettyPart(text) {
    return String(text || "")
      .replace(/-/g, "−")
      .replace(/\*/g, "·")
      .replace(/\s+/g, "");
  }

  function qPlain(text) {
    var span = document.createElement("span");
    span.className = "q-done";
    span.textContent = prettyPart(text);
    return span;
  }

  function computeCell(name, doneValue, stored, done, placeholder, wide) {
    if (done) {
      var frozen = document.createElement("span");
      frozen.className = "q-done";
      frozen.textContent = String(doneValue).replace(/-/g, "−");
      return frozen;
    }
    var inp = qSlot(name, wide ? "is-wide" : "");
    if (placeholder) inp.placeholder = placeholder;
    if (stored) inp.value = String(stored).replace(/·/g, "*");
    return inp;
  }

  function buildQuadFormula(mode) {
    var want = quadView();
    var q = state.quad;
    var c = (q && q.compute) || {};
    var wrap = document.createElement("div");
    wrap.className = "q-formula";
    wrap.setAttribute("dir", "ltr");
    qAppend(wrap, "x = ");
    var frac = document.createElement("span");
    frac.className = "q-frac";
    var num = document.createElement("span");
    num.className = "q-num";
    var sqrt = document.createElement("span");
    sqrt.className = "q-sqrt";
    var rad = document.createElement("span");
    rad.className = "q-rad";
    var den = document.createElement("span");
    den.className = "q-den";

    if (mode === "plug") {
      qAppend(num, "−");
      num.appendChild(qSlot("b1"));
      qAppend(num, " ± ");
      rad.appendChild(qPow(qSlot("b2", "is-wide")));
      qAppend(rad, " − 4·");
      rad.appendChild(qSlot("a1"));
      qAppend(rad, "·");
      rad.appendChild(qSlot("c", "is-wide"));
      qAppend(den, "2·");
      den.appendChild(qSlot("a2"));
    } else if (mode === "plugged") {
      qAppend(num, "−");
      num.appendChild(qText(want.b));
      qAppend(num, " ± ");
      rad.appendChild(qPow(qText(want.b)));
      qAppend(rad, " − 4·");
      rad.appendChild(qText(want.a));
      qAppend(rad, "·");
      rad.appendChild(qText(want.c));
      qAppend(den, "2·");
      den.appendChild(qText(want.a));
    } else if (mode === "compute") {
      num.appendChild(computeCell("negB", -want.b, c.negB, c.negBDone, "−b"));
      qAppend(num, " ± ");
      rad.appendChild(computeCell("disc", want.D, c.disc, c.discDone, "b²−4ac", true));
      den.appendChild(computeCell("den", 2 * want.a, c.den, c.denDone, "2a"));
    } else if (mode === "progress") {
      num.appendChild(qPlain(c.negBDone ? -want.b : c.negB || "−b"));
      qAppend(num, " ± ");
      rad.appendChild(qPlain(c.discDone ? want.D : c.disc || "…"));
      den.appendChild(qPlain(c.denDone ? 2 * want.a : c.den || "2a"));
    } else if (mode === "sqrt") {
      num.appendChild(qNum(-want.b));
      qAppend(num, " ± ");
      num.appendChild(computeCell("s", want.s, c.s, c.sDone, ""));
      den.appendChild(qNum(2 * want.a));
    } else if (mode === "computed") {
      num.appendChild(qNum(-want.b));
      qAppend(num, " ± ");
      qAppend(rad, String(want.D).replace(/-/g, "−"));
      den.appendChild(qNum(2 * want.a));
    } else if (mode === "rooted") {
      num.appendChild(qNum(-want.b));
      qAppend(num, " ± ");
      qAppend(num, String(want.s));
      den.appendChild(qNum(2 * want.a));
    }

    if (mode !== "rooted" && mode !== "sqrt") {
      sqrt.appendChild(rad);
      num.appendChild(sqrt);
    }
    frac.appendChild(num);
    frac.appendChild(den);
    wrap.appendChild(frac);
    return wrap;
  }

  function rootLabel(sign) {
    var want = quadView();
    if (want.kind === "one") return "x = ";
    return sign > 0 ? "x₁ = " : "x₂ = ";
  }

  function qFrac(numNode, denNode) {
    var frac = document.createElement("span");
    frac.className = "q-frac";
    var num = document.createElement("span");
    num.className = "q-num";
    num.appendChild(numNode);
    var den = document.createElement("span");
    den.className = "q-den";
    den.appendChild(denNode);
    frac.appendChild(num);
    frac.appendChild(den);
    return frac;
  }

  function rootFracLine(sign, numText, denText, valText) {
    var wrap = document.createElement("div");
    wrap.className = "q-formula q-root-row";
    wrap.setAttribute("dir", "ltr");
    qAppend(wrap, rootLabel(sign));
    wrap.appendChild(qFrac(qPlain(numText), qPlain(denText)));
    if (valText != null && valText !== "") {
      qAppend(wrap, " = ");
      wrap.appendChild(qPlain(valText));
    }
    return wrap;
  }

  function pushRootTrail(sign, numText, denText, valText) {
    var trail = state.quad.trail;
    var last = trail.length ? trail[trail.length - 1] : null;
    if (last && last.rootSign === sign) {
      var holder = document.createElement("div");
      holder.innerHTML = last.html;
      var row = holder.firstElementChild;
      if (row) {
        qAppend(row, " = ");
        if (valText != null && valText !== "") {
          row.appendChild(qPlain(valText));
        } else {
          row.appendChild(qFrac(qPlain(numText), qPlain(denText)));
        }
        last.html = row.outerHTML;
        return;
      }
    }
    trail.push({
      html: rootFracLine(sign, numText, denText, valText).outerHTML,
      rootSign: sign,
    });
  }

  function numNeedsSimplify(num) {
    var s = String(num || "")
      .replace(/[−–—]/g, "-")
      .replace(/^\s*-/, "");
    return /[+\-]/.test(s);
  }

  function openRootChain(sign) {
    var want = quadView();
    var Q = DoctematicaQuadratic;
    var num = Q.rootNumExpr(want, sign);
    var den = String(Q.denWant(want));
    state.quad.root.at = sign;
    state.quad.root.lastNum = num;
    state.quad.root.lastDen = den;
    state.quad.root.numDone = !numNeedsSimplify(num);
    state.quad.root.denDone = true;
    state.quad.root.valDone = false;
    state.quad.root.val = "";
    pushRootTrail(sign, num, den);
  }

  function pushTrailHtml(html) {
    var trail = state.quad.trail;
    if (!trail.length || trail[trail.length - 1].html !== html) trail.push({ html: html });
  }

  function startQuadSession() {
    state.quad = {
      phase: "abc",
      gotAbc: false,
      discDone: false,
      sDone: false,
      abcAt: "a",
      abcGot: {},
      compute: {},
      trail: [],
      view: {},
    };
  }

  function quadView() {
    return (state.quad && state.quad.view) || (state.problem && state.problem.quad) || {};
  }

  function mergeQuadView(extra) {
    if (!state.quad) return;
    state.quad.view = Object.assign({}, state.quad.view || {}, extra || {});
  }

  function setQuadInput(on) {
    mathWrap.classList.toggle("hidden", !on);
    mathKeysEl.classList.toggle("hidden", !on);
    checkBtn.classList.toggle("hidden", false);
    answerLabelEl.classList.toggle("hidden", false);
    if (!on) {
      mathWrap.classList.add("hidden");
      mathKeysEl.classList.add("hidden");
    }
  }

  function renderQuadKnown() {
    var w = quadView();
    if (w.a == null) {
      sysKnownEl.classList.add("hidden");
      return;
    }
    solveWrap.classList.add("is-system");
    sysKnownEl.classList.remove("hidden");
    sysKnownEl.innerHTML = '<p class="k-title">מקדמים</p>';
    [
      ["a", w.a],
      ["b", w.b],
      ["c", w.c],
    ].forEach(function (pair) {
      var row = document.createElement("div");
      row.className = "k-row is-set";
      row.innerHTML =
        '<span class="k-var">' +
        pair[0] +
        '</span><span class="k-eq">=</span><span class="k-val">' +
        String(pair[1]).replace(/-/g, "−") +
        "</span>";
      sysKnownEl.appendChild(row);
    });
  }

  function slotVal(name) {
    var el = quadGuideEl.querySelector('[data-q="' + name + '"]');
    return el ? el.value : "";
  }

  function renderQuadGuide() {
    if (!formulaWorkActive() || !state.quad) {
      quadGuideEl.classList.add("hidden");
      quadGuideEl.innerHTML = "";
      return;
    }
    var q = state.quad;
    var want = quadView();
    var Q = DoctematicaQuadratic;
    quadGuideEl.classList.remove("hidden");
    quadGuideEl.innerHTML = "";
    var note = document.createElement("p");
    note.className = "q-note";

    if (q.phase === "abc") {
      note.innerHTML =
        state.mixed && state.mixed.md53
          ? "md53: רשמו a, אחר כך b, אחר כך c (Enter אחרי כל אחד). גם 0 אם אין איבר. אחרי c המחשבון פותר."
          : "רשמו את המקדמים בנוסחה " +
            DoctematicaMath.toHTML("ax^2+bx+c=0") +
            ". אחרי כל מקדם לחצו Enter.";
      quadGuideEl.appendChild(note);
      var row = document.createElement("div");
      row.className = "q-abc";
      var order = ["a", "b", "c"];
      order.forEach(function (name) {
        var lab = document.createElement("label");
        lab.textContent = name + " = ";
        var inp = qSlot(name);
        inp.id = "quad-" + name;
        if (q.abcGot && q.abcGot[name] != null) {
          inp.value = String(q.abcGot[name]);
          inp.classList.add("is-ok");
          inp.readOnly = true;
        } else if (name !== (q.abcAt || "a")) {
          inp.disabled = true;
        }
        lab.appendChild(inp);
        row.appendChild(lab);
      });
      quadGuideEl.appendChild(row);
      setQuadInput(false);
      checkBtn.classList.remove("hidden");
      answerLabelEl.textContent = "המקדם " + (q.abcAt || "a");
      hintEl.textContent = "Enter בודק את המקדם הנוכחי ועובר לבא אם הוא נכון.";
      var cur = quadGuideEl.querySelector('[data-q="' + (q.abcAt || "a") + '"]');
      if (cur) cur.focus();
      renderSysKnown();
      return;
    }

    if (q.phase === "plug") {
      note.textContent = "הציבו את a, b, c בנוסחת השורשים.";
      quadGuideEl.appendChild(note);
      quadGuideEl.appendChild(buildQuadFormula("plug"));
      bindQuadArrows(quadGuideEl);
      setQuadInput(false);
      checkBtn.classList.remove("hidden");
      answerLabelEl.textContent = "הצבה בנוסחה";
      hintEl.textContent =
        "בכל ריבוע כתבו את המקדם. אם המספר שלילי אפשר סוגריים, למשל (−12). ב־b² כש־b שלילי חובה סוגריים: (−4)².";
      var slot = quadGuideEl.querySelector("input");
      if (slot) slot.focus();
      renderSysKnown();
      return;
    }

    if (q.phase === "compute") {
      var c = q.compute || {};
      if (c.lastDisc && c.negBDone && c.denDone) {
        note.innerHTML =
          "חשבו עכשיו את " +
          DoctematicaMath.toHTML(String(c.lastDisc).replace(/·/g, "*")) +
          " בתוך השורש.";
      } else {
        note.innerHTML =
          "חשבו בנוסחה שלושה דברים: −b במונה, " +
          DoctematicaMath.toHTML(Q.discExpr(want.a, want.b, want.c).replace(/²/g, "^2").replace(/·/g, "*")) +
          " בתוך השורש, ו־2a במכנה.";
      }
      quadGuideEl.appendChild(note);
      quadGuideEl.appendChild(buildQuadFormula("compute"));
      bindQuadArrows(quadGuideEl);
      setQuadInput(false);
      checkBtn.classList.remove("hidden");
      answerLabelEl.textContent = c.lastDisc ? "חשבו את " + prettyPart(c.lastDisc) : "חישוב בנוסחה";
      hintEl.textContent = c.lastDisc
        ? "רשמו את התוצאה של " + prettyPart(c.lastDisc) + " בתוך השורש."
        : "שני מינוסים צמודים הופכים לפלוס. בתוך השורש אפשר קודם ביטוי כמו 64−48 ואחר כך את התוצאה. החצים מעבירים בין התאים.";
      var cslot = quadGuideEl.querySelector("input.q-slot");
      if (cslot) cslot.focus();
      renderSysKnown();
      return;
    }

    if (q.phase === "sqrt") {
      note.textContent = "חשבו את השורש √(" + want.D + ") בתוך הנוסחה.";
      quadGuideEl.appendChild(note);
      quadGuideEl.appendChild(buildQuadFormula("sqrt"));
      bindQuadArrows(quadGuideEl);
      setQuadInput(false);
      checkBtn.classList.remove("hidden");
      answerLabelEl.textContent = "ערך השורש";
      hintEl.textContent = "√(" + want.D + ") צריך לצאת מספר שלם.";
      var sslot = quadGuideEl.querySelector("input.q-slot");
      if (sslot) sslot.focus();
      renderSysKnown();
      return;
    }

    if (q.phase === "count") {
      note.textContent = "לפי הדיסקרימיננטה, כמה פתרונות ממשיים יש למשוואה?";
      quadGuideEl.appendChild(note);
      quadGuideEl.appendChild(buildQuadFormula(q.sDone ? "rooted" : "computed"));
      var counts = document.createElement("div");
      counts.className = "q-count";
      [
        { id: "none", label: "אין פתרון ממשי" },
        { id: "one", label: "פתרון אחד" },
        { id: "two", label: "שני פתרונות" },
        { id: "skip", label: "המשך" },
      ].forEach(function (opt) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = opt.id === "skip" ? "ghost is-continue" : "ghost";
        btn.textContent = opt.label;
        btn.addEventListener("click", function () {
          if (isFormulaWorkServerMode()) {
            requestQuadCheck({ picked: opt.id }, applyQuadServerResult);
            return;
          }
          applyQuadResult(Q.checkCount(want, opt.id), { count: opt.id });
        });
        counts.appendChild(btn);
      });
      quadGuideEl.appendChild(counts);
      setQuadInput(false);
      checkBtn.classList.add("hidden");
      answerLabelEl.classList.add("hidden");
      hintEl.textContent = "Δ > 0 שני פתרונות, Δ = 0 פתרון אחד, Δ < 0 אין פתרון ממשי. אפשר גם להמשיך בלי לבחור.";
      renderSysKnown();
      return;
    }

    if (q.phase === "nosol") {
      note.textContent = "רשמו שאין פתרון ממשי.";
      quadGuideEl.appendChild(note);
      quadGuideEl.appendChild(buildQuadFormula(q.sDone ? "rooted" : "computed"));
      var noneRow = document.createElement("div");
      noneRow.className = "q-roots";
      var noneLab = document.createElement("label");
      noneLab.textContent = "מסקנה: ";
      var noneInp = qSlot("none");
      noneInp.style.width = "11rem";
      noneInp.placeholder = "אין פתרון ממשי";
      noneLab.appendChild(noneInp);
      noneRow.appendChild(noneLab);
      quadGuideEl.appendChild(noneRow);
      setQuadInput(false);
      checkBtn.classList.remove("hidden");
      answerLabelEl.classList.remove("hidden");
      answerLabelEl.textContent = "אין פתרון";
      hintEl.textContent = "כתבו שאין פתרון ממשי.";
      noneInp.focus();
      renderSysKnown();
      return;
    }

    if (q.phase === "rootwork") {
      var sign = q.root.at || 1;
      var lastNum = q.root.lastNum || Q.rootNumExpr(want, sign);
      var lastDen = q.root.lastDen || String(Q.denWant(want));
      note.textContent =
        want.kind === "one"
          ? "חשבו את השבר עד לתוצאה."
          : sign > 0
            ? "קודם x₁: חברו או חסרו במונה, ואז חלקו במכנה. אחר כך x₂."
            : "עכשיו x₂: חברו או חסרו במונה, ואז חלקו במכנה.";
      quadGuideEl.appendChild(note);
      var chain = document.createElement("div");
      chain.className = "q-root-chain";
      var shown = document.createElement("div");
      shown.className = "q-formula q-root-row";
      shown.setAttribute("dir", "ltr");
      qAppend(shown, rootLabel(sign));
      shown.appendChild(qFrac(qPlain(lastNum), qPlain(lastDen)));
      chain.appendChild(shown);
      var next = document.createElement("div");
      next.className = "q-formula q-root-row";
      next.setAttribute("dir", "ltr");
      qAppend(next, "= ");
      if (!q.root.numDone || !q.root.denDone) {
        var nSlot = q.root.numDone
          ? qPlain(lastNum)
          : computeCell("rnum", Q.numWant(want, sign), "", false, "מונה", true);
        var dSlot = q.root.denDone
          ? qPlain(lastDen)
          : computeCell("rden", Q.denWant(want), "", false, "מכנה");
        next.appendChild(qFrac(nSlot, dSlot));
      } else {
        next.appendChild(computeCell("rval", 0, q.root.val, false, "x", true));
      }
      chain.appendChild(next);
      quadGuideEl.appendChild(chain);
      bindQuadArrows(quadGuideEl);
      setQuadInput(false);
      checkBtn.classList.remove("hidden");
      answerLabelEl.classList.remove("hidden");
      answerLabelEl.textContent = want.kind === "one" ? "חישוב x" : sign > 0 ? "חישוב x₁" : "חישוב x₂";
      hintEl.textContent = "קודם חשבו את המונה, אחר כך את השבר. השבר מוצג עם קו, לא עם /.";
      var rslot = quadGuideEl.querySelector("input.q-slot");
      if (rslot) rslot.focus();
      renderSysKnown();
      return;
    }

    note.textContent = Q.kindLabel(want.kind) + ".";
    quadGuideEl.appendChild(note);
    setQuadInput(false);
    checkBtn.classList.add("hidden");
    renderSysKnown();
  }

  function isFormulaWorkServerMode() {
    return (
      !geoEqSolveActive() &&
      (isFormulaServerMode() || (isMixedServerMode() && mixedPath() === "formula"))
    );
  }

  function collectQuadSlots() {
    var slots = {};
    if (!quadGuideEl) return slots;
    var nodes = quadGuideEl.querySelectorAll("[data-q]");
    var i;
    for (i = 0; i < nodes.length; i++) {
      slots[nodes[i].getAttribute("data-q")] = nodes[i].value;
    }
    return slots;
  }

  function applyQuadFill(fill) {
    if (!fill || !quadGuideEl) return;
    var key;
    for (key in fill) {
      if (!Object.prototype.hasOwnProperty.call(fill, key)) continue;
      var el = quadGuideEl.querySelector('[data-q="' + key + '"]');
      if (el) el.value = String(fill[key]);
    }
  }

  function requestQuadCheck(extra, onResult) {
    extra = extra || {};
    var q = state.quad;
    return requestQuadraticAction(
      Object.assign(
        {
          intent: extra.intent || "check",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history && state.history.length ? state.history : [(state.problem && state.problem.startEquation) || ""],
          phase: q.phase,
          letter: q.abcAt,
          slots: collectQuadSlots(),
          root: q.root,
          compute: q.compute,
          md53: !!(state.mixed && state.mixed.md53),
        },
        extra
      ),
      onResult
    );
  }

  function applyQuadServerResult(res) {
    res = res || {};
    mergeQuadView(res.view);
    if (res.answer) mergeQuadView({ answer: res.answer, kind: res.kind });
    var q = state.quad;
    if (res.fill) applyQuadFill(res.fill);
    if (q.phase === "abc" && res.ok && res.nextPhase === "abc" && res.nextLetter) {
      var letter = q.abcAt || "a";
      if (!q.abcGot) q.abcGot = {};
      q.abcGot[letter] = slotVal(letter);
      state.stats.try += 1;
      saveStats();
      renderStats();
      q.abcAt = res.nextLetter;
      showFeedback(true, "<strong>נכון.</strong> " + (res.message || "עכשיו " + res.nextLetter + "."));
      renderQuadGuide();
      return;
    }
    if (q.phase === "rootwork") {
      applyQuadRootworkServer(res);
      return;
    }
    if (res.solved) {
      applyQuadResult(res);
      return;
    }
    applyQuadResult(res);
  }

  function applyQuadRootworkServer(res) {
    var q = state.quad;
    var want = quadView();
    var Q = DoctematicaQuadratic;
    var sign = (q.root && q.root.at) || 1;
    if (!q.root) q.root = { at: 1 };
    state.stats.try += 1;
    saveStats();
    renderStats();
    if (!res.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + (res.message || ""));
      return;
    }
    if (!q.root.numDone || !q.root.denDone) {
      var fields = {
        num: q.root.numDone ? String(Q.numWant(want, sign)) : slotVal("rnum") || (res.fill && res.fill.rnum) || "",
        den: q.root.denDone ? String(Q.denWant(want)) : slotVal("rden") || (res.fill && res.fill.rden) || "",
      };
      if (!q.root.numDone) q.root.lastNum = fields.num;
      if (!q.root.denDone) q.root.lastDen = fields.den;
      var parts = res.parts || {};
      if (parts.num && parts.num.ok && !parts.num.empty && !parts.num.more) q.root.numDone = true;
      if (parts.den && parts.den.ok && !parts.den.empty && !parts.den.more) q.root.denDone = true;
      if (!res.more) {
        q.root.numDone = true;
        q.root.denDone = true;
      }
      if (parts.num && parts.num.more) q.root.lastNum = fields.num;
      pushRootTrail(sign, q.root.lastNum, q.root.lastDen);
      if (q.root.numDone) q.root.lastNum = String(Q.numWant(want, sign));
      if (q.root.denDone) q.root.lastDen = String(Q.denWant(want));
      showFeedback(true, "<strong>נכון.</strong> " + res.message);
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (res.more) {
      q.root.val = "";
      showFeedback(true, "<strong>נכון.</strong> " + res.message);
      renderQuadGuide();
      return;
    }
    var shown = slotVal("rval") || (res.fill && res.fill.rval) || "";
    pushRootTrail(sign, q.root.lastNum, q.root.lastDen, shown);
    if (res.nextRoot === -1 || res.nextLetter === "x2") {
      q.root.plusDone = true;
      openRootChain(-1);
      showFeedback(true, "<strong>נכון.</strong> עכשיו חשבו את x₂.");
      renderQuadGuide();
      renderSteps();
      return;
    }
    finishQuad(String((res.answer || "").replace(/-/g, "−") || res.message || "") + (res.answer ? "." : ""));
  }

  function applyQuadResult(result, extra) {
    state.stats.try += 1;
    saveStats();
    renderStats();
    var q = state.quad;
    var want = quadView();
    var Q = DoctematicaQuadratic;
    if (!result.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + result.message);
      return;
    }
    if (result.more) {
      if (q.phase === "compute") {
        if (!q.compute) q.compute = {};
        if (!q.compute.negBDone) q.compute.negB = slotVal("negB");
        if (!q.compute.discDone) q.compute.disc = slotVal("disc");
        if (!q.compute.denDone) q.compute.den = slotVal("den");
        var parts = result.parts || {};
        if (parts.neg && parts.neg.ok && !parts.neg.empty && !parts.neg.more) q.compute.negBDone = true;
        if (parts.disc && parts.disc.ok && !parts.disc.empty && !parts.disc.more) q.compute.discDone = true;
        if (parts.den && parts.den.ok && !parts.den.empty && !parts.den.more) q.compute.denDone = true;
        var progressed =
          !!(parts.neg && parts.neg.more) ||
          !!(parts.disc && parts.disc.more) ||
          !!(parts.den && parts.den.more);
        if (progressed) {
          var snap = buildQuadFormula("progress").outerHTML;
          if (!q.trail.length || q.trail[q.trail.length - 1].html !== snap) {
            q.trail.push({ html: snap });
          }
          if (parts.disc && parts.disc.more) {
            q.compute.lastDisc = q.compute.disc;
            q.compute.disc = "";
          }
          if (parts.neg && parts.neg.more) q.compute.negB = "";
          if (parts.den && parts.den.more) q.compute.den = "";
        }
        showFeedback(
          true,
          "<strong>נכון.</strong> " +
            (progressed && q.compute.lastDisc
              ? "עכשיו חשבו את " + prettyPart(q.compute.lastDisc) + "."
              : result.message)
        );
        renderQuadGuide();
        renderSteps();
        return;
      }
      if (q.phase === "sqrt") {
        if (!q.compute) q.compute = {};
        q.compute.s = "";
        showFeedback(true, "<strong>נכון.</strong> " + result.message);
        renderQuadGuide();
        return;
      }
      showFeedback(true, "<strong>צעד חוקי.</strong> " + result.message);
      return;
    }
    if (q.phase === "abc") {
      q.gotAbc = true;
      q.trail.push({
        html:
          '<span class="m-expr" dir="ltr">a = ' +
          String(want.a).replace(/-/g, "−") +
          ", b = " +
          String(want.b).replace(/-/g, "−") +
          ", c = " +
          String(want.c).replace(/-/g, "−") +
          "</span>",
      });
      if (state.mixed && state.mixed.md53) {
        renderQuadGuide();
        renderSteps();
        finishQuad("לפי md53: " + String(result.answer || want.answer || ""));
        return;
      }
      q.phase = result.nextPhase || "plug";
      showFeedback(true, "<strong>נכון.</strong> " + result.message);
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (q.phase === "plug") {
      q.trail.push({ html: buildQuadFormula("plugged").outerHTML });
      q.phase = "compute";
      q.compute = {};
      showFeedback(true, "<strong>נכון.</strong> " + result.message);
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (q.phase === "compute") {
      q.discDone = true;
      q.trail.push({ html: buildQuadFormula("computed").outerHTML });
      q.phase = result.nextPhase || (want.kind === "none" ? "count" : "sqrt");
      q.compute = {};
      showFeedback(true, "<strong>נכון.</strong> " + result.message);
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (q.phase === "sqrt") {
      q.sDone = true;
      q.trail.push({ html: buildQuadFormula("rooted").outerHTML });
      q.phase = "count";
      showFeedback(true, "<strong>נכון.</strong> " + result.message);
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (q.phase === "count") {
      if (!result.skip) q.trail.push({ html: Q.kindLabel(want.kind) });
      if (want.kind === "none") {
        q.phase = "nosol";
      } else {
        q.phase = "rootwork";
        q.root = { plusDone: false, minusDone: false };
        openRootChain(1);
      }
      showFeedback(true, "<strong>נכון.</strong> " + result.message);
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (q.phase === "nosol") {
      pushTrailHtml(Q.kindLabel("none"));
      finishQuad(result.message);
      return;
    }
    if (q.phase === "roots") {
      finishQuad(result.message);
    }
  }

  function finishQuad(message) {
    state.quad.phase = "done";
    var ans = String((quadView() && quadView().answer) || (state.problem && state.problem.quad && state.problem.quad.answer) || "");
    var kind = (quadView() && quadView().kind) || (state.problem && state.problem.quad && state.problem.quad.kind);
    if (ans && (kind !== "none" || (state.mixed && state.mixed.md53))) {
      state.quad.trail.push({
        html: '<span class="m-expr" dir="ltr">' + ans.replace(/-/g, "−") + "</span>",
      });
    }
    renderQuadGuide();
    renderSteps();
    if (finishEqSolveForGeo(state.problem.quad && state.problem.quad.answer)) return;
    markSolved();
    mathField.setDisabled(true);
    checkBtn.disabled = true;
    nextAfterSolveBtn.classList.remove("hidden");
    showFeedback(true, "<strong>כל הכבוד.</strong> " + message);
  }

  function handleQuadSubmit() {
    if (!state.quad || state.locked) return;
    if (isFormulaWorkServerMode()) {
      requestQuadCheck({}, applyQuadServerResult);
      return;
    }
    var Q = DoctematicaQuadratic;
    var want = quadView();
    var q = state.quad;
    if (q.phase === "abc") {
      var letter = q.abcAt || "a";
      var one = Q.checkCoeff(want, letter, slotVal(letter));
      if (!one.ok) {
        state.stats.try += 1;
        saveStats();
        renderStats();
        showFeedback(false, "<strong>עוד לא.</strong> " + one.message);
        return;
      }
      if (!q.abcGot) q.abcGot = {};
      q.abcGot[letter] = slotVal(letter);
      if (letter === "a") {
        state.stats.try += 1;
        saveStats();
        renderStats();
        q.abcAt = "b";
        showFeedback(true, "<strong>נכון.</strong> עכשיו b.");
        renderQuadGuide();
        return;
      }
      if (letter === "b") {
        state.stats.try += 1;
        saveStats();
        renderStats();
        q.abcAt = "c";
        showFeedback(true, "<strong>נכון.</strong> עכשיו c.");
        renderQuadGuide();
        return;
      }
      applyQuadResult({ ok: true, message: "המקדמים נכונים. עכשיו הציבו בנוסחת השורשים." });
      return;
    }
    if (q.phase === "plug") {
      applyQuadResult(
        Q.checkPlug(want, {
          a1: slotVal("a1"),
          a2: slotVal("a2"),
          b1: slotVal("b1"),
          b2: slotVal("b2"),
          c: slotVal("c"),
        })
      );
      return;
    }
    if (q.phase === "compute") {
      var c = q.compute || {};
      applyQuadResult(
        Q.checkCompute(want, {
          negB: c.negBDone ? String(-want.b) : slotVal("negB"),
          disc: c.discDone ? String(want.D) : slotVal("disc"),
          den: c.denDone ? String(2 * want.a) : slotVal("den"),
        })
      );
      return;
    }
    if (q.phase === "sqrt") {
      applyQuadResult(Q.checkSqrt(want, slotVal("s")), { typed: slotVal("s") });
      return;
    }
    if (q.phase === "nosol") {
      applyQuadResult(Q.checkNone(slotVal("none")));
      return;
    }
    if (q.phase === "rootwork") {
      handleRootWorkSubmit();
    }
  }

  function handleRootWorkSubmit() {
    state.stats.try += 1;
    saveStats();
    renderStats();
    var want = quadView();
    var q = state.quad;
    var Q = DoctematicaQuadratic;
    var sign = q.root.at || 1;
    if (!q.root.numDone || !q.root.denDone) {
      var fields = {
        num: q.root.numDone ? String(Q.numWant(want, sign)) : slotVal("rnum"),
        den: q.root.denDone ? String(Q.denWant(want)) : slotVal("rden"),
      };
      var result = Q.checkRootCompute(want, sign, fields);
      if (!result.ok) {
        showFeedback(false, "<strong>עוד לא.</strong> " + result.message);
        return;
      }
      if (!q.root.numDone) q.root.lastNum = fields.num;
      if (!q.root.denDone) q.root.lastDen = fields.den;
      var parts = result.parts || {};
      if (parts.num && parts.num.ok && !parts.num.empty && !parts.num.more) q.root.numDone = true;
      if (parts.den && parts.den.ok && !parts.den.empty && !parts.den.more) q.root.denDone = true;
      if (parts.num && parts.num.more) q.root.lastNum = fields.num;
      pushRootTrail(sign, q.root.lastNum, q.root.lastDen);
      if (q.root.numDone) q.root.lastNum = String(Q.numWant(want, sign));
      if (q.root.denDone) q.root.lastDen = String(Q.denWant(want));
      showFeedback(true, "<strong>נכון.</strong> " + result.message);
      renderQuadGuide();
      renderSteps();
      return;
    }
    var typed = slotVal("rval");
    if (!String(typed).trim()) {
      showFeedback(false, "<strong>עוד לא.</strong> חשבו את השבר לתוצאה.");
      return;
    }
    var fin = Q.checkRootFinal(want, sign, typed);
    if (!fin.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + fin.message);
      return;
    }
    if (fin.more) {
      q.root.val = "";
      showFeedback(true, "<strong>נכון.</strong> " + fin.message);
      renderQuadGuide();
      return;
    }
    pushRootTrail(sign, q.root.lastNum, q.root.lastDen, Q.fmt(Q.rootWant(want, sign)));
    if (sign > 0 && want.kind === "two") {
      q.root.plusDone = true;
      openRootChain(-1);
      showFeedback(true, "<strong>נכון.</strong> עכשיו חשבו את x₂.");
      renderQuadGuide();
      renderSteps();
      return;
    }
    finishQuad(want.answer.replace(/-/g, "−") + ".");
  }

  function fillQuadStep() {
    if (isFormulaWorkServerMode()) {
      requestQuadCheck({ intent: "one-step" }, applyQuadServerResult);
      return;
    }
    var want = quadView();
    var q = state.quad;
    if (q.phase === "abc") {
      q.abcGot = { a: want.a, b: want.b, c: want.c };
      q.abcAt = "c";
      applyQuadResult({ ok: true, message: "המקדמים נכונים. עכשיו הציבו בנוסחת השורשים." });
      return;
    }
    if (q.phase === "plug") {
      quadGuideEl.querySelector('[data-q="b1"]').value = String(want.b);
      quadGuideEl.querySelector('[data-q="b2"]').value =
        want.b < 0 ? "(" + want.b + ")" : String(want.b);
      quadGuideEl.querySelector('[data-q="a1"]').value = String(want.a);
      quadGuideEl.querySelector('[data-q="a2"]').value = String(want.a);
      quadGuideEl.querySelector('[data-q="c"]').value = String(want.c);
      handleQuadSubmit();
      return;
    }
    if (q.phase === "compute") {
      var nB = quadGuideEl.querySelector('[data-q="negB"]');
      var dI = quadGuideEl.querySelector('[data-q="disc"]');
      var dN = quadGuideEl.querySelector('[data-q="den"]');
      if (nB) nB.value = String(-want.b);
      if (dI) dI.value = String(want.D);
      if (dN) dN.value = String(2 * want.a);
      handleQuadSubmit();
      return;
    }
    if (q.phase === "sqrt") {
      var sI = quadGuideEl.querySelector('[data-q="s"]');
      if (sI) sI.value = String(want.s);
      handleQuadSubmit();
      return;
    }
    if (q.phase === "count") {
      applyQuadResult(DoctematicaQuadratic.checkCount(want, want.kind));
      return;
    }
    if (q.phase === "nosol") {
      applyQuadResult(DoctematicaQuadratic.checkNone("אין פתרון ממשי"));
      return;
    }
    if (q.phase === "rootwork") {
      if (!q.root.numDone || !q.root.denDone) {
        var nEl = quadGuideEl.querySelector('[data-q="rnum"]');
        var dEl = quadGuideEl.querySelector('[data-q="rden"]');
        if (nEl) nEl.value = String(DoctematicaQuadratic.numWant(want, q.root.at || 1));
        if (dEl) dEl.value = String(DoctematicaQuadratic.denWant(want));
      } else {
        var vEl = quadGuideEl.querySelector('[data-q="rval"]');
        if (vEl) {
          vEl.value = DoctematicaQuadratic.fmt(
            DoctematicaQuadratic.rootWant(want, q.root.at || 1)
          );
        }
      }
      handleRootWorkSubmit();
    }
  }

  function handleSqrtEqSubmit() {
    applySqrtEqTyped(typedAnswer().trim());
  }

  function clearGeoUi() {
    if (solveWrap) solveWrap.classList.remove("has-geo");
    if (coordBoard) coordBoard.clear();
    if (geoPartEl) {
      geoPartEl.classList.add("hidden");
      geoPartEl.innerHTML = "";
    }
  }

  function updateGeoFootHint() {
    if (!state.problem || !state.problem.geo || !hintEl) return;
    var ds = state.geo.draw || {};
    var pack = state.problem.geo;
    var snapped = (ds.heights || []).filter(function (h) {
      return h && h.snapped && h.footLabel;
    });
    if (!snapped.length) return;
    var h0 = snapped[0];
    var footId = String(h0.footLabel || "").toUpperCase();
    var footTask = (pack.tasks || []).filter(function (t) {
      return t.kind === "point" && String(t.point || "").toUpperCase() === footId;
    })[0];
    var footDone =
      state.geo.footCoords &&
      state.geo.footCoords[footId] &&
      state.geo.footCoords[footId].x != null &&
      state.geo.footCoords[footId].y != null;
    if ((footTask && !(state.geo.done && state.geo.done[footTask.id])) || (!footTask && !footDone)) {
      hintEl.textContent =
        "מצאו את הנקודה " +
        footId +
        " — רשמו " +
        footId +
        "(x;y) או " +
        footId +
        "x=… ו-" +
        footId +
        "y=…";
    }
  }

  function renderGeoScene(highlight) {
    if (!coordBoard || !state.problem || !state.problem.geo) {
      clearGeoUi();
      return;
    }
    var pack = state.problem.geo;
    if (pack.showBoard === false) {
      coordBoard.clear();
      if (geoBoardEl) geoBoardEl.classList.add("hidden");
      if (solveWrap) solveWrap.classList.remove("has-geo");
      return;
    }
    if (solveWrap) solveWrap.classList.add("has-geo");
    var scene = DoctematicaGeometry.sceneForProgress
      ? DoctematicaGeometry.sceneForProgress(pack, state.geo)
      : {
          points: pack.points,
          segments: pack.segments,
          axisGuides: pack.axisGuides || [],
        };
    if (DoctematicaGeometry.initDrawProgress) {
      state.geo.draw = DoctematicaGeometry.initDrawProgress(pack, state.geo);
    }
    var drawConfig = null;
    if (
      DoctematicaGeometry.resolveDrawConfig &&
      DoctematicaGeometry.drawPartActive &&
      DoctematicaGeometry.drawPartActive(pack, state.geo)
    ) {
      drawConfig = DoctematicaGeometry.resolveDrawConfig(pack);
    }
    coordBoard.render({
      points: scene.points,
      segments: scene.segments,
      polygons: scene.polygons || pack.polygons || [],
      rightAngles: scene.rightAngles || pack.rightAngles || [],
      axisGuides: scene.axisGuides || [],
      distGuides: scene.distGuides || [],
      graphs: scene.graphs || [],
      areaLabels: scene.areaLabels || [],
      segLabels: scene.segLabels || [],
      highlight: highlight || null,
      drawConfig: drawConfig,
      drawState: state.geo.draw || { heights: [], auxPoints: [] },
      pointMap: pack.map || {},
      onDrawChange: function (ds) {
        state.geo.draw = ds;
        updateGeoFootHint();
      },
    });
    updateGeoFootHint();
  }

  function renderGeoPart() {
    if (!geoPartEl || !state.problem || !state.problem.geo) {
      if (geoPartEl) {
        geoPartEl.classList.add("hidden");
        geoPartEl.innerHTML = "";
      }
      return;
    }
    var pack = state.problem.geo;
    var part = DoctematicaGeometry.currentPartText(pack, state.geo);
    var showPart = part && !part.label ? part : null;
    if (!showPart) {
      var unlabeled = (pack.parts || []).filter(function (p) {
        return p && !p.label && String(p.text || "").trim();
      });
      if (!part && unlabeled.length) showPart = unlabeled[0];
    }
    if (showPart && (state.history || []).some(isGeoQuestionHeader)) showPart = null;
    if (!showPart) {
      geoPartEl.classList.add("hidden");
      geoPartEl.innerHTML = "";
    } else {
      geoPartEl.classList.remove("hidden");
      geoPartEl.innerHTML = DoctematicaGeometry.formatPartHtml(showPart.text || "");
    }
    renderLineMatchPanel();
  }

  function applyLineMatchResult(res) {
    return applyLineMatchResultLocal(res);
  }

  function requestLineMatchAction(type, taskId, extra) {
    extra = extra || {};
    var action = { type: type, taskId: taskId };
    if (extra.lineKey != null) action.lineKey = extra.lineKey;
    if (extra.reasonId != null) action.reasonId = extra.reasonId;
    if (
      !requestGeometryAction({ intent: "check", action: action }, function (remote) {
        if (remote && remote.local) {
          applyLineMatchResultLocal(
            type === "lineMatch.line"
              ? DoctematicaGeometry.submitLineMatchLine(taskId, extra.lineKey, state.problem.geo, state.geo)
              : DoctematicaGeometry.submitLineMatchReason(taskId, extra.reasonId, state.problem.geo, state.geo)
          );
          return;
        }
        var log =
          "lineMatch:" +
          (type === "lineMatch.line" ? "line" : "reason") +
          ":" +
          taskId +
          ":" +
          (extra.lineKey != null ? extra.lineKey : extra.reasonId);
        if (!state.geo.lengthLog) state.geo.lengthLog = [];
        if (remote && remote.ok) state.geo.lengthLog.push(log);
        applyLineMatchResultLocal(remote);
      })
    ) {
      showBasicEqServerUnavailable();
    }
  }

  function applyLineMatchResultLocal(res) {
    if (!res || !res.ok) {
      var bad = res && res.message ? res.message : "עוד לא.";
      if (DoctematicaMath && DoctematicaMath.proseHTML) bad = DoctematicaMath.proseHTML(bad);
      showFeedback(false, "<strong>עוד לא.</strong> " + bad);
      return false;
    }
    state.stats.try += 1;
    saveStats();
    renderStats();
    var pack = state.problem && state.problem.geo;
    var partBefore =
      pack && DoctematicaGeometry.currentPartText
        ? DoctematicaGeometry.currentPartText(pack, state.geo)
        : null;
    if (res.done) state.geo.done = res.done;
    if (res.lineMatch) state.geo.lineMatch = res.lineMatch;
    if (res.lineEq) state.geo.lineEq = Object.assign({}, state.geo.lineEq || {}, res.lineEq);
    renderGeoScene(null);
    if (res.show) {
      state.history.push(res.userStep || res.show);
      if (res.lineMatchNote) {
        state.geo.notes = state.geo.notes || {};
        state.geo.notes[state.history.length - 1] = res.lineMatchNote;
      }
    }
    if (res.extraShow && res.extraShow.length) {
      res.extraShow.forEach(function (line) {
        if (line) state.history.push(line);
      });
    }
    if (
      pack &&
      !isGeoLineMatchPage() &&
      !isGeoSummaryPage() &&
      !isGeoParallelPage() &&
      DoctematicaGeometry.lineMatchAutoCompleteRemaining &&
      res.done
    ) {
      var autoResults = DoctematicaGeometry.lineMatchAutoCompleteRemaining(pack, state.geo);
      if (autoResults && autoResults.length) {
        autoResults.forEach(function (ar) {
          if (ar.done) state.geo.done = ar.done;
          if (ar.lineMatch) state.geo.lineMatch = ar.lineMatch;
          if (ar.lineEq) state.geo.lineEq = Object.assign({}, state.geo.lineEq || {}, ar.lineEq);
          if (ar.show) {
            state.history.push(ar.userStep || ar.show);
            if (ar.lineMatchNote) {
              state.geo.notes = state.geo.notes || {};
              state.geo.notes[state.history.length - 1] = ar.lineMatchNote;
            }
          }
          if (ar.solved) res.solved = true;
        });
        renderGeoScene(null);
      }
    }
    var partAfter =
      pack && DoctematicaGeometry.currentPartText
        ? DoctematicaGeometry.currentPartText(pack, state.geo)
        : null;
    if (
      partAfter &&
      partAfter.label &&
      (!partBefore || partAfter.label !== partBefore.label)
    ) {
      ensureGeoPartHeader(partAfter.label);
      ensureGeoFocusTaskHeader(pack, state.geo);
      if (!(state.geo.lineEq && Object.keys(state.geo.lineEq).length)) {
        state.geo.lineEqDisplay = null;
      }
      state.geo.mbRearranged = false;
      state.geo.mbRearrangeExpr = null;
    }
    if (res.show) renderSteps();
    renderLineMatchPanel();
    renderGeoPart();
    renderGeoAskUi();
    setModeUi();
    if (res.solved) {
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + (res.message || "כל השיוכים נכונים."));
      return true;
    }
    var okMsg = res.message || "נכון.";
    if (DoctematicaMath && DoctematicaMath.proseHTML) okMsg = DoctematicaMath.proseHTML(okMsg);
    showFeedback(true, "<strong>נכון.</strong> " + okMsg);
    return true;
  }

  function renderLineMatchPanel() {
    var pack = state.problem && state.problem.geo;
    if (
      !lineMatchPanelEl ||
      !pack ||
      !DoctematicaGeometry.lineMatchPartActive ||
      !DoctematicaGeometry.lineMatchPartActive(pack, state.geo)
    ) {
      if (lineMatchPanelEl) {
        lineMatchPanelEl.classList.add("hidden");
        lineMatchPanelEl.innerHTML = "";
      }
      return;
    }
    lineMatchPanelEl.classList.remove("hidden");
    var data = DoctematicaGeometry.lineMatchPanelData(pack, state.geo);
    var reasonOpts = DoctematicaGeometry.lineMatchReasonOptions();
    lineMatchPanelEl.innerHTML = "";
    var intro = document.createElement("p");
    intro.className = "line-match-intro";
    intro.textContent =
      "שייכו כל משוואה לישר בציור (I, II" +
      (data.lines.length > 2 ? ", III" : "") +
      ")" +
      (data.hasDistractor ? ". אם משוואה לא מתאימה לאף ישר — בחרו «לא שייך»" : "") +
      ", ונמקו. התחשבו בשיפוע ובמקדם b.";
    lineMatchPanelEl.appendChild(intro);
    data.rows.forEach(function (row) {
      var el = document.createElement("div");
      el.className = "line-match-row" + (row.done ? " is-done" : "");
      var eq = document.createElement("div");
      eq.className = "line-match-eq";
      var eqHtml = row.eqText || "";
      if (row.eqNum != null) eqHtml = "(" + row.eqNum + ") " + eqHtml;
      if (DoctematicaMath && DoctematicaMath.toHTML) eq.innerHTML = DoctematicaMath.toHTML(eqHtml);
      else eq.textContent = eqHtml;
      el.appendChild(eq);
      var pick = document.createElement("div");
      pick.className = "line-match-pick";
      var pickLab = document.createElement("span");
      pickLab.className = "line-match-pick-label";
      pickLab.textContent = "ישר";
      pick.appendChild(pickLab);
      data.lines.forEach(function (opt) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "line-match-btn";
        if (row.lineKey === opt.key) b.classList.add("is-selected");
        if (row.done && row.task.answerKey === opt.key) b.classList.add("is-correct");
        b.textContent = opt.label;
        b.disabled = !!state.locked || row.done;
        b.addEventListener("click", function () {
          if (state.locked) return;
          if ((isGeoLineMatchPage() || isGeoSummaryPage() || isGeoParallelPage()) && isGeoLengthMode()) {
            requestLineMatchAction("lineMatch.line", row.task.id, { lineKey: opt.key });
            return;
          }
          var r = DoctematicaGeometry.submitLineMatchLine(row.task.id, opt.key, pack, state.geo);
          applyLineMatchResult(r);
        });
        pick.appendChild(b);
      });
      if (data.hasDistractor) {
        var noneBtn = document.createElement("button");
        noneBtn.type = "button";
        noneBtn.className = "line-match-btn";
        if (row.lineKey === "none") noneBtn.classList.add("is-selected");
        if (row.done && row.task.answerKey === "none") noneBtn.classList.add("is-correct");
        noneBtn.textContent = "לא שייך";
        noneBtn.disabled = !!state.locked || row.done;
        noneBtn.addEventListener("click", function () {
          if (state.locked) return;
          if ((isGeoLineMatchPage() || isGeoSummaryPage() || isGeoParallelPage()) && isGeoLengthMode()) {
            requestLineMatchAction("lineMatch.line", row.task.id, { lineKey: "none" });
            return;
          }
          var r = DoctematicaGeometry.submitLineMatchLine(row.task.id, "none", pack, state.geo);
          applyLineMatchResult(r);
        });
        pick.appendChild(noneBtn);
      }
      el.appendChild(pick);
      if (row.needReason && !state.locked) {
        var reason = document.createElement("div");
        reason.className = "line-match-reason";
        var rLab = document.createElement("span");
        rLab.className = "line-match-reason-label";
        rLab.textContent = "לנמק?";
        reason.appendChild(rLab);
        reasonOpts.forEach(function (opt) {
          var rb = document.createElement("button");
          rb.type = "button";
          rb.className = "line-match-reason-btn";
          rb.textContent = opt.label;
          rb.addEventListener("click", function () {
            if ((isGeoLineMatchPage() || isGeoSummaryPage() || isGeoParallelPage()) && isGeoLengthMode()) {
              requestLineMatchAction("lineMatch.reason", row.task.id, { reasonId: opt.id });
              return;
            }
            var r = DoctematicaGeometry.submitLineMatchReason(row.task.id, opt.id, pack, state.geo);
            applyLineMatchResult(r);
          });
          reason.appendChild(rb);
        });
        el.appendChild(reason);
      }
      if (row.done) {
        var tag = document.createElement("span");
        tag.className = "line-match-done-tag";
        var reasonLab = "";
        if (row.reason) {
          reasonOpts.forEach(function (o) {
            if (o.id === row.reason) reasonLab = o.label;
          });
        }
        tag.textContent =
          row.task.answerKey === "none"
            ? "✓ לא שייך"
            : "✓ ישר " + (row.lineKey || row.task.answerKey) + (reasonLab ? " · " + reasonLab : "");
        el.appendChild(tag);
      }
      lineMatchPanelEl.appendChild(el);
    });
  }

  function createEmptyGeoState() {
    return {
      done: {},
      partial: {},
      lastExpr: {},
      coords: {},
      footCoords: {},
      draw: null,
      notes: {},
      noteOpen: null,
      lineEq: {},
      intersect: {},
      pointRoute: {},
      lineMatch: {},
      distUnk: {},
      eqTrail: [],
      lengthLog: [],
    };
  }

  function applyGeoResultState(res) {
    if (!res || !state.geo) return;
    state.geo.done = res.done || state.geo.done || {};
    state.geo.partial = res.partial !== undefined ? res.partial : state.geo.partial || {};
    if (res.lastExpr && (Object.keys(res.lastExpr).length || (res.task && res.done && res.done[res.task.id]))) {
      state.geo.lastExpr = res.lastExpr;
    }
    state.geo.coords = res.coords !== undefined ? res.coords : state.geo.coords || {};
    if (res.lineEqDisplay) state.geo.lineEqDisplay = res.lineEqDisplay;
    if (res.lineEq) state.geo.lineEq = Object.assign({}, state.geo.lineEq || {}, res.lineEq);
    if (res.intersect) state.geo.intersect = res.intersect;
    if (res.pointRoute) state.geo.pointRoute = Object.assign({}, state.geo.pointRoute || {}, res.pointRoute);
    if (res.footCoords) state.geo.footCoords = res.footCoords;
    if (res.distUnk) state.geo.distUnk = res.distUnk;
    if (res.lineMatch) state.geo.lineMatch = res.lineMatch;
    if (res.mbRearranged) {
      state.geo.mbRearranged = true;
      state.geo.mbRearrangeExpr = null;
    }
    if (res.mbRearrangeExpr) state.geo.mbRearrangeExpr = res.mbRearrangeExpr;
  }

  function startGeoSession() {
    state.geo = createEmptyGeoState();
    var pack0 = state.problem && state.problem.geo;
    var lineMatchStart =
      pack0 &&
      DoctematicaGeometry.firstPartLineMatchOnly &&
      DoctematicaGeometry.firstPartLineMatchOnly(pack0);
    if (
      lineMatchStart ||
      (pack0 && pack0.hideGiven) ||
      (state.problem && state.problem.mode === "geo-length")
    ) {
      state.history = [];
    } else {
      var given =
        DoctematicaGeometry.givenLineText &&
        DoctematicaGeometry.givenLineText(pack0, state.geo);
      state.history = [given || "נתון: נקודות על מערכת הצירים"];
    }
    if (pack0) {
      var firstPart = DoctematicaGeometry.currentPartText(pack0, state.geo);
      if (firstPart && firstPart.label) ensureGeoPartHeader(firstPart.label);
      else ensureGeoQuestionRow(pack0);
      ensureGeoFocusTaskHeader(pack0, state.geo);
    }
    renderGeoScene(null);
    renderGeoPart();
    renderGeoAskUi();
  }

  function applyGeoTyped(typed) {
    var pack = state.problem && state.problem.geo;
    if (!typed) {
      var emptyMsg = "כתבו תשובה או צעד.";
      if (
        pack &&
        DoctematicaGeometry.lineMatchPartActive &&
        DoctematicaGeometry.lineMatchPartActive(pack, state.geo)
      ) {
        emptyMsg = "בחרו ישר ליד המשוואה, ואז לחצו «לנמק».";
      } else if (pack && DoctematicaGeometry.currentPartText) {
        var emptyPart = DoctematicaGeometry.currentPartText(pack, state.geo);
        var emptyIds = (emptyPart && emptyPart.taskIds) || [];
        var emptyKinds = emptyIds
          .map(function (id) {
            return (pack.tasks || []).filter(function (t) {
              return t.id === id;
            })[0];
          })
          .filter(Boolean);
        if (
          emptyKinds.length &&
          emptyKinds.every(function (t) {
            return t.kind === "lineIntersect";
          })
        ) {
          emptyMsg = "השוו את שתי המשוואות, או רשמו את נקודת החיתוך.";
        } else if (
          emptyKinds.length &&
          emptyKinds.every(function (t) {
            return t.kind === "lineEq";
          })
        ) {
          emptyMsg =
            emptyKinds[0] && isAxisParallelTask(emptyKinds[0])
              ? String(emptyKinds[0].axisParallel).toLowerCase() === "y" ||
                String(emptyKinds[0].axisParallel).toLowerCase() === "v"
                ? "רשמו x = מספר (ישר מקביל לציר y)."
                : "רשמו y = מספר (ישר מקביל לציר x)."
              : "רשמו משוואת ישר או צעד (למשל y − y₁ = m(x − x₁)).";
        } else if (
          emptyKinds.length &&
          emptyKinds.every(function (t) {
            return t.kind === "slope";
          })
        ) {
          emptyMsg = emptyKinds[0] && emptyKinds[0].perpendicular
            ? "רשמו m₁ · m₂ = −1, הציבו את השיפוע הנתון, או ישר את השיפוע המאונך."
            : "רשמו את השיפוע, או m = (y₂ − y₁)/(x₂ − x₁).";
        }
      }
      showFeedback(false, "<strong>עוד לא.</strong> " + emptyMsg);
      return false;
    }
    if (!pack) {
      showFeedback(false, "<strong>עוד לא.</strong> אין תרגיל טעון.");
      return false;
    }
    if (isGeoLengthsServerActive()) {
      if (equationsCheckBusy) return true;
      state.stats.try += 1;
      saveStats();
      renderStats();
      if (
        !requestGeometryAction(
          { intent: "check", typed: typed },
          function (remote) {
            if (remote && remote.local) {
              finishGeoCheckResult(typed, DoctematicaGeometry.checkTyped(typed, pack, state.geo), true);
              return;
            }
            finishGeoCheckResult(typed, remote, true);
          }
        )
      ) {
        showBasicEqServerUnavailable();
      }
      return true;
    }
    return finishGeoCheckResult(typed, DoctematicaGeometry.checkTyped(typed, pack, state.geo), false);
  }

  function geoTaskFromId(pack, id) {
    if (!pack || !id) return null;
    return (pack.tasks || []).filter(function (t) {
      return t.id === id;
    })[0] || null;
  }

  function finishGeoCheckResult(typed, res, statsAlready) {
    var pack = state.problem && state.problem.geo;
    if (!statsAlready) {
      state.stats.try += 1;
      saveStats();
      renderStats();
    }
    if (!res || !res.ok) {
      var badMsg = (res && res.message) || "";
      if (DoctematicaMath && DoctematicaMath.proseHTML) badMsg = DoctematicaMath.proseHTML(badMsg);
      else if (DoctematicaGeometry.formatPartHtml) badMsg = DoctematicaGeometry.formatPartHtml(badMsg);
      showFeedback(false, "<strong>עוד לא.</strong> " + badMsg);
      return false;
    }
    if (res.task && res.task.id && !res.task.from) {
      var fullTask = geoTaskFromId(pack, res.task.id);
      if (fullTask) res.task = fullTask;
    }
    var partBefore = DoctematicaGeometry.currentPartText(pack, state.geo);
    var doneBefore = Object.assign({}, (state.geo && state.geo.done) || {});
    if (partBefore && partBefore.label) ensureGeoPartHeader(partBefore.label);
    applyGeoResultState(res);
    if (res.task && isGeoServerKind(res.task.kind)) {
      if (!state.geo.lengthLog) state.geo.lengthLog = [];
      var logLine = String(typed || "").trim();
      if (logLine) state.geo.lengthLog.push(logLine);
    } else if (res.mbRearranged || res.mbRearrangeExpr || res.lineEq) {
      if (!state.geo.lengthLog) state.geo.lengthLog = [];
      var rearrangeLine = String(typed || "").trim();
      if (rearrangeLine) state.geo.lengthLog.push(rearrangeLine);
    }
    if (res.mbRearranged) {
      state.geo.mbRearranged = true;
      state.geo.mbRearrangeExpr = null;
    }
    if (res.mbRearrangeExpr) state.geo.mbRearrangeExpr = res.mbRearrangeExpr;
    if (res.show) {
      if (res.task) ensureGeoTaskHeader(res.task);
      var last = state.history[state.history.length - 1];
      if (res.prefixShow && res.prefixShow.length) {
        res.prefixShow.forEach(function (line) {
          var pre = String(line || "");
          if (DoctematicaGeometry.capsHistoryLetters) {
            pre = DoctematicaGeometry.capsHistoryLetters(pre);
          }
          if (pre) state.history.push(pre);
        });
        last = state.history[state.history.length - 1];
      }
      var historyLine = res.show;
      if (
        res.task &&
        res.rawStep &&
        (res.userStep || typed) &&
        (res.task.kind === "lineIntersect" ||
          (res.intersect && res.intersect.taskId === res.task.id))
      ) {
        historyLine = res.userStep || String(typed || "").trim();
      }
      if (DoctematicaGeometry.capsHistoryLetters) {
        historyLine = DoctematicaGeometry.capsHistoryLetters(historyLine);
      }
      var chainKinds =
        res.task &&
        (res.task.kind === "segment" ||
          res.task.kind === "origin" ||
          res.task.kind === "axis" ||
          res.task.kind === "distSeg" ||
          res.task.kind === "area");
      var sameTaskOpen =
        res.task &&
        last &&
        !isGeoSectionHeader(last) &&
        chainKinds &&
        res.task.label &&
        last.indexOf(res.task.label) === 0 &&
        !/=\s*-?\d+(?:[.,]\d+)?\s*$/.test(String(last));
      var chainY =
        res.chain &&
        last &&
        !isGeoSectionHeader(last) &&
        /^\s*[yY]\s*=/.test(String(last));
      if (
        (chainY || sameTaskOpen) &&
        (state.geo.done[res.task.id] ||
          (state.geo.partial && state.geo.partial[res.task.id]))
      ) {
        state.history[state.history.length - 1] = historyLine;
      } else {
        state.history.push(historyLine);
      }
      if (res.extraShow && res.extraShow.length) {
        res.extraShow.forEach(function (line) {
          var extra = String(line || "");
          if (DoctematicaGeometry.capsHistoryLetters) {
            extra = DoctematicaGeometry.capsHistoryLetters(extra);
          }
          state.history.push(extra);
        });
      }
      if (res.plugStep && DoctematicaGeometry.onLinePlugReason) {
        attachStepNote(DoctematicaGeometry.onLinePlugReason());
      }
      if (res.siteNote) attachStepNote(res.siteNote);
    }
    if (res.reasonText) attachStepNote(res.reasonText);
    var partAfter = DoctematicaGeometry.currentPartText(pack, state.geo);
    if (
      !res.solved &&
      partAfter &&
      partAfter.label &&
      (!partBefore || partAfter.label !== partBefore.label)
    ) {
      ensureGeoPartHeader(partAfter.label);
      ensureGeoFocusTaskHeader(pack, state.geo);
      if (!(state.geo.lineEq && Object.keys(state.geo.lineEq).length)) {
        state.geo.lineEqDisplay = null;
      }
      state.geo.mbRearranged = false;
      state.geo.mbRearrangeExpr = null;
    } else if (res.task && res.done && res.done[res.task.id] && !doneBefore[res.task.id]) {
      ensureGeoFocusTaskHeader(pack, state.geo);
    }
    renderSteps();
    renderGeoPart();
    renderGeoAskUi();
    if (res.task) {
      renderGeoScene(
        res.task.kind === "segment"
          ? { from: res.task.from, to: res.task.to }
          : { point: res.task.point || res.revealPoint }
      );
    } else {
      renderGeoScene(null);
    }
    mathField.clear();
    if (res.solved) {
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      renderSteps();
      renderGeoAskUi();
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + res.message);
      return true;
    }
    var okMsg = res.message || "";
    if (DoctematicaMath && DoctematicaMath.proseHTML) okMsg = DoctematicaMath.proseHTML(okMsg);
    else if (DoctematicaGeometry.formatPartHtml) okMsg = DoctematicaGeometry.formatPartHtml(okMsg);
    showFeedback(true, "<strong>נכון.</strong> " + okMsg);
    renderGeoAskUi();
    setModeUi();
    if (geoEqSolveActive()) ensureGeoMixedPack();
    updateSplitBtn();
    updateFormulaBtn();
    var askNow = DoctematicaGeometry.lineAsk && DoctematicaGeometry.lineAsk(pack, state.geo);
    if (!askNow) mathField.focus();
    return true;
  }

  function geoHint() {
    var pack = state.problem && state.problem.geo;
    if (!pack) return;
    if (isGeoLengthsServerActive()) {
      if (
        !requestGeometryAction({ intent: "hint" }, function (remote) {
          if (remote && remote.local) {
            geoHintLocal();
            return;
          }
          var msg = (remote && remote.message) || "";
          if (DoctematicaMath && DoctematicaMath.proseHTML) {
            msg = DoctematicaMath.proseHTML(msg);
          } else if (DoctematicaGeometry.formatPartHtml) {
            msg = DoctematicaGeometry.formatPartHtml(msg);
          }
          showFeedback(true, "<strong>רמז.</strong> " + msg, "tip");
        })
      ) {
        showBasicEqServerUnavailable();
      }
      return;
    }
    geoHintLocal();
  }

  function geoHintLocal() {
    var pack = state.problem && state.problem.geo;
    if (!pack) return;
    var h = DoctematicaGeometry.nextHint(pack, state.geo);
    var msg = h.message || "";
    if (DoctematicaMath && DoctematicaMath.proseHTML) {
      msg = DoctematicaMath.proseHTML(msg);
    } else if (DoctematicaGeometry.formatPartHtml) {
      msg = DoctematicaGeometry.formatPartHtml(msg);
    }
    showFeedback(true, "<strong>רמז.</strong> " + msg, "tip");
  }

  function applyRequiredReason(text) {
    var pack = state.problem && state.problem.geo;
    if (!pack) return false;
    if (isGeoLengthsServerActive()) {
      if (
        !requestGeometryAction({ intent: "check", typed: text }, function (remote) {
          if (remote && remote.local) {
            applyRequiredReasonLocal(text);
            return;
          }
          finishGeoCheckResult(text, remote, false);
        })
      ) {
        showBasicEqServerUnavailable();
      }
      return true;
    }
    return applyRequiredReasonLocal(text);
  }

  function applyRequiredReasonLocal(text) {
    var pack = state.problem && state.problem.geo;
    if (!pack) return false;
    var res = DoctematicaGeometry.submitReason(text, pack, state.geo);
    if (!res.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
      return false;
    }
    state.geo.done = res.done || state.geo.done || {};
    state.geo.partial = res.partial || {};
    state.geo.coords = res.coords || state.geo.coords || {};
    state.geo.lastExpr = res.lastExpr || state.geo.lastExpr || {};
    attachStepNote(res.reasonText || text);
    renderSteps();
    renderGeoPart();
    renderGeoAskUi();
    if (res.solved) {
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + res.message);
      return true;
    }
    showFeedback(true, "<strong>נכון.</strong> " + res.message);
    mathField.focus();
    return true;
  }

  function geoOneStep() {
    var pack = state.problem && state.problem.geo;
    if (!pack || state.locked) return;
    if (isGeoLengthsServerActive()) {
      if (
        !requestGeometryAction({ intent: "one-step" }, function (remote) {
          applyGeoLengthsOneStep(pack, remote);
        })
      ) {
        showBasicEqServerUnavailable();
      }
      return;
    }
    geoOneStepLocal();
  }

  function applyGeoLengthsOneStep(pack, remote) {
    remote = remote || {};
    if (remote.local) {
      geoOneStepLocal();
      return;
    }
    if (remote.matchAction) {
      if (remote.ok) {
        if (!state.geo.lengthLog) state.geo.lengthLog = [];
        if (remote.step) state.geo.lengthLog.push(remote.step);
      }
      applyLineMatchResultLocal(remote);
      return;
    }
    if (remote.addHeight && DoctematicaGeometry.siteAddHeight) {
      var heightTask = remote.task && remote.task.id ? geoTaskFromId(pack, remote.task.id) : null;
      DoctematicaGeometry.siteAddHeight(pack, state.geo, heightTask || remote.task);
      renderGeoScene(null);
      var heightMsg =
        (state.geo.draw && state.geo.draw.note) || remote.message || "הגובה נוסף לשרטוט.";
      if (DoctematicaMath && DoctematicaMath.proseHTML) heightMsg = DoctematicaMath.proseHTML(heightMsg);
      else if (DoctematicaGeometry.formatPartHtml) heightMsg = DoctematicaGeometry.formatPartHtml(heightMsg);
      showFeedback(true, "<strong>נכון.</strong> " + heightMsg);
      return;
    }
    if (!remote.step) {
      var doneMsg = remote.message || "התרגיל כבר נפתר.";
      if (DoctematicaMath && DoctematicaMath.proseHTML) doneMsg = DoctematicaMath.proseHTML(doneMsg);
      else if (DoctematicaGeometry.formatPartHtml) doneMsg = DoctematicaGeometry.formatPartHtml(doneMsg);
      showFeedback(true, "<strong>רמז.</strong> " + doneMsg, "tip");
      return;
    }
    finishGeoCheckResult(remote.step, remote, false);
  }

  function geoOneStepLocal() {
    var pack = state.problem && state.problem.geo;
    if (!pack || state.locked) return;
    if (geoEqSolveActive()) {
      var gPathEarly = mixedPath();
      if (gPathEarly === "formula") return fillQuadStep();
      if (gPathEarly === "factor") return factorOneStep();
      if (gPathEarly === "sqrt") return sqrtOneStep();
      if (gPathEarly === "linear") return stepOneStep();
      var duTask = geoDistUnkTask();
      if (duTask && DoctematicaGeometry.nextDistUnknownStep) {
        var geoNxt = DoctematicaGeometry.nextDistUnknownStep(duTask, pack, state.geo);
        var lastDu = (state.geo.lastExpr && state.geo.lastExpr[duTask.id]) || "";
        if (geoNxt && String(geoNxt).replace(/\s+/g, "") !== String(lastDu).replace(/\s+/g, "")) {
          applyGeoTyped(geoNxt);
          return;
        }
      }
      ensureGeoMixedPack();
      var gPath = mixedPath();
      if (gPath === "formula") return fillQuadStep();
      if (gPath === "factor") return factorOneStep();
      if (gPath === "sqrt") return sqrtOneStep();
      if (gPath === "linear") return stepOneStep();
      var mixPack = state.problem.mixed;
      if (mixPack && DoctematicaQuadratic && DoctematicaQuadratic.nextMixedStep) {
        var act = DoctematicaQuadratic.nextMixedStep(lastHistoryEq(), mixPack);
        if (act && act.path === "formula") {
          enterMixedFormula();
          return;
        }
        if (act && act.path === "factor" && act.eq) {
          state.mixed = state.mixed || emptyMixedState();
          state.mixed.path = "factor";
          if (mixPack.factor) state.problem.factor = mixPack.factor;
          applyFactorTyped(act.eq);
          return;
        }
        if (act && act.path === "sqrt" && act.eq) {
          state.mixed = state.mixed || emptyMixedState();
          state.mixed.path = "sqrt";
          if (mixPack.sqrt) state.problem.sqrt = mixPack.sqrt;
          applySqrtEqTyped(act.eq);
          return;
        }
        if (act && act.eq) {
          applyGeoTyped(rewriteLetterGeo(act.eq, "x", geoEqLetter()));
          return;
        }
      }
    }
    if (
      DoctematicaGeometry.lineMatchPartActive &&
      DoctematicaGeometry.lineMatchPartActive(pack, state.geo)
    ) {
      var lmStep = DoctematicaGeometry.lineMatchOneStep(pack, state.geo);
      if (!lmStep) {
        showFeedback(true, "<strong>רמז.</strong> התרגיל כבר נפתר.");
        return;
      }
      if (lmStep.action === "line") {
        applyLineMatchResult(
          DoctematicaGeometry.submitLineMatchLine(lmStep.taskId, lmStep.lineKey, pack, state.geo)
        );
      } else {
        applyLineMatchResult(
          DoctematicaGeometry.submitLineMatchReason(lmStep.taskId, lmStep.reasonId, pack, state.geo)
        );
      }
      return;
    }
    var ask =
      DoctematicaGeometry.lineAsk && DoctematicaGeometry.lineAsk(pack, state.geo);
    if (ask && ask.stage === "yesno") {
      var yesAns =
        ask.task &&
        (ask.task.kind === "parallel" || ask.task.kind === "perpendicular" || ask.task.kind === "yesNo")
          ? !!ask.task.answer
          : !!ask.task.on;
      applyGeoTyped(yesAns ? "כן" : "לא");
      return;
    }
    if (ask && ask.stage === "reason") {
      applyRequiredReason(ask.task.reason || "לפי החישוב.");
      return;
    }
    var h = DoctematicaGeometry.nextHint(pack, state.geo);
    if (h.footCalc) {
      applyGeoTyped(h.step || h.answer);
      return;
    }
    if (h.addHeight && DoctematicaGeometry.siteAddHeight) {
      DoctematicaGeometry.siteAddHeight(pack, state.geo, h.task);
      renderGeoScene(null);
      var heightMsg =
        (state.geo.draw && state.geo.draw.note) || h.message || "הגובה נוסף לשרטוט.";
      if (DoctematicaMath && DoctematicaMath.proseHTML) heightMsg = DoctematicaMath.proseHTML(heightMsg);
      else if (DoctematicaGeometry.formatPartHtml) heightMsg = DoctematicaGeometry.formatPartHtml(heightMsg);
      showFeedback(true, "<strong>נכון.</strong> " + heightMsg);
      return;
    }
    if (!h.task) {
      var doneMsg = h.message || "התרגיל כבר נפתר.";
      if (DoctematicaMath && DoctematicaMath.proseHTML) doneMsg = DoctematicaMath.proseHTML(doneMsg);
      else if (DoctematicaGeometry.formatPartHtml) doneMsg = DoctematicaGeometry.formatPartHtml(doneMsg);
      showFeedback(true, "<strong>רמז.</strong> " + doneMsg, "tip");
      return;
    }
    var typed = h.step || h.answer;
    if (h.rawStep) typed = h.step;
    // בסגירת קטע שהתחיל: עדיף מספר מתויג כדי לא להתבלבל עם סעיפים אחרים
    if (
      h.task &&
      state.geo.partial &&
      state.geo.partial[h.task.id] &&
      (h.task.kind === "segment" ||
        h.task.kind === "origin" ||
        h.task.kind === "axis" ||
        h.task.kind === "distSeg" ||
        h.task.kind === "area")
    ) {
      if (h.task.kind === "area" || h.task.fromArea || h.task.kind === "lineEq") {
        typed = h.step || h.answer;
      } else {
        var tag = String(h.task.label || "").replace(/→/g, "").replace(/->/g, "");
        typed = tag + "=" + (h.answer || h.step);
      }
    }
    applyGeoTyped(typed);
  }

  function geoShowSolution() {
    var pack = state.problem && state.problem.geo;
    if (!pack) return;
    var allServer = (pack.tasks || []).every(function (t) {
      return isGeoServerKind(t.kind);
    });
    if (allServer && isGeoLengthMode()) {
      if (
        !requestGeometryAction({ intent: "solution" }, function (remote) {
          if (!remote || remote.local || remote.mixed || !remote.steps) {
            geoShowSolutionLocal();
            return;
          }
          applyGeoServerSolution(pack, remote);
        })
      ) {
        showBasicEqServerUnavailable();
      }
      return;
    }
    geoShowSolutionLocal();
  }

  function applyGeoServerSolution(pack, remote) {
    if (!state.geo) state.geo = createEmptyGeoState();
    state.geo.notes = {};
    state.geo.noteOpen = null;
    state.history = (remote.steps || []).slice();
    state.geo.done = remote.done || {};
    state.geo.partial = {};
    state.geo.coords = remote.coords || {};
    if (remote.mbRearranged) state.geo.mbRearranged = true;
    if (remote.lineEqDisplay) state.geo.lineEqDisplay = remote.lineEqDisplay;
    if (remote.lineMatch) state.geo.lineMatch = remote.lineMatch;
    state.geo.draw = DoctematicaGeometry.initDrawProgress
      ? DoctematicaGeometry.initDrawProgress(pack, state.geo)
      : null;
    if (DoctematicaGeometry.siteAddAllHeights) {
      state.geo.draw = DoctematicaGeometry.siteAddAllHeights(pack, state.geo);
    }
    markSolved();
    renderSteps();
    renderGeoPart();
    renderGeoScene(null);
    renderGeoAskUi();
    mathField.setDisabled(true);
    checkBtn.disabled = true;
    nextAfterSolveBtn.classList.remove("hidden");
    showFeedback(true, "<strong>פתרון מלא.</strong> כל הצעדים מוצגים בהיסטוריה.");
  }

  function geoShowSolutionLocal() {
    var pack = state.problem && state.problem.geo;
    if (!pack) return;
    if (!state.geo) state.geo = {};
    state.geo.notes = {};
    state.geo.noteOpen = null;
    state.history = [];
    var parts = pack.parts || [];
    if (parts.length) {
      parts.forEach(function (part) {
        if (part.label) state.history.push("סעיף:" + part.label);
        else if (String(part.text || "").trim()) state.history.push("שאלה:" + String(part.text).trim());
        if (DoctematicaGeometry.canonicalGivenLineRearrangeSteps) {
          var rearrLines = DoctematicaGeometry.canonicalGivenLineRearrangeSteps(pack) || [];
          if (rearrLines.length && (part.taskIds || []).some(function (id) {
            var tt = (pack.tasks || []).filter(function (u) { return u.id === id; })[0];
            return tt && (tt.kind === "lineIntersect" || tt.kind === "slope" || tt.kind === "lineEq");
          })) {
            state.history.push("משימה:סידור משוואת הישר");
            rearrLines.forEach(function (line) {
              state.history.push(line);
            });
          }
        }
        (part.taskIds || []).forEach(function (id) {
          var task = (pack.tasks || []).filter(function (t) {
            return t.id === id;
          })[0];
          if (task) {
            var pairSol =
              DoctematicaGeometry.axisMidPairTasks &&
              DoctematicaGeometry.axisMidPairTasks(pack, {});
            var pairSolL =
              DoctematicaGeometry.lineMidPairTasks &&
              DoctematicaGeometry.lineMidPairTasks(pack, {});
            if (
              pairSol &&
              (task.id === pairSol.yEnd.id || task.id === pairSol.xEnd.id)
            ) {
              if (task.id === pairSol.yEnd.id && DoctematicaGeometry.canonicalAxisMidPairSteps) {
                DoctematicaGeometry.canonicalAxisMidPairSteps(pack, {}).forEach(function (line) {
                  state.history.push(line);
                });
              }
              return;
            }
            if (
              pairSolL &&
              (task.id === pairSolL.yEnd.id || task.id === pairSolL.xEnd.id)
            ) {
              if (task.id === pairSolL.yEnd.id && DoctematicaGeometry.canonicalLineMidPairSteps) {
                DoctematicaGeometry.canonicalLineMidPairSteps(pack, {}).forEach(function (line) {
                  state.history.push(line);
                });
              }
              return;
            }
            if (
              DoctematicaGeometry.partStepByTask &&
              DoctematicaGeometry.partStepByTask(part, pack)
            ) {
              var taskHead =
                DoctematicaGeometry.taskStepLabel && DoctematicaGeometry.taskStepLabel(task);
              if (taskHead) state.history.push("משימה:" + taskHead);
            }
            var taskLine =
              part.line ||
              (pack.line ? pack.line : null);
            if (taskLine && (task.kind === "onLine" || task.kind === "freePoint") && DoctematicaGeometry.canonicalOnLineSteps) {
              var plugIdx = state.history.length;
              DoctematicaGeometry.canonicalOnLineSteps(task, pack).forEach(function (line) {
                state.history.push(line);
              });
              if (!state.geo.notes) state.geo.notes = {};
              if (task.kind === "onLine" && DoctematicaGeometry.onLinePlugReason) {
                state.geo.notes[plugIdx] = DoctematicaGeometry.onLinePlugReason();
              }
              if (task.reason) {
                state.geo.notes[state.history.length - 1] = task.reason;
              }
            } else if (task.kind === "midpoint" && DoctematicaGeometry.canonicalMidpointSteps) {
              DoctematicaGeometry.canonicalMidpointSteps(task, pack, state.geo).forEach(function (line) {
                state.history.push(line);
              });
            } else if (task.kind === "slope" && DoctematicaGeometry.canonicalSlopeSteps) {
              var slopeIdx = state.history.length;
              DoctematicaGeometry.canonicalSlopeSteps(task, pack).forEach(function (line) {
                state.history.push(line);
              });
              if (task.parallel) {
                if (!state.geo.notes) state.geo.notes = {};
                state.geo.notes[slopeIdx] = "ישרים מקבילים — שיפועים שווים.";
              }
              if (task.perpendicular) {
                if (!state.geo.notes) state.geo.notes = {};
                state.geo.notes[slopeIdx] = "ישרים מאונכים — מכפלת השיפועים היא −1.";
              }
            } else if (task.kind === "distance" && DoctematicaGeometry.canonicalDistanceSteps) {
              DoctematicaGeometry.canonicalDistanceSteps(task, pack).forEach(function (line) {
                state.history.push(line);
              });
            } else if (task.kind === "distUnknown" && DoctematicaGeometry.canonicalDistUnknownSteps) {
              DoctematicaGeometry.canonicalDistUnknownSteps(task, pack).forEach(function (line) {
                state.history.push(line);
              });
            } else if (task.kind === "perimeter" && DoctematicaGeometry.canonicalPerimeterSteps) {
              DoctematicaGeometry.canonicalPerimeterSteps(task, pack).forEach(function (line) {
                state.history.push(line);
              });
            } else if (task.kind === "equalLen") {
              state.history.push(task.segs && task.segs.length >= 2 ? String(task.segs[0]).toUpperCase() + "=" + String(task.segs[1]).toUpperCase() : "AB=BC");
            } else if (task.kind === "lineMb" && DoctematicaGeometry.canonicalLineMbSteps) {
              DoctematicaGeometry.canonicalLineMbSteps(task, pack).forEach(function (line) {
                state.history.push(line);
              });
            } else if (task.kind === "parallel" && DoctematicaGeometry.canonicalParallelSteps) {
              var parSteps = DoctematicaGeometry.canonicalParallelSteps(task, pack);
              var parIdx = state.history.length;
              parSteps.forEach(function (line) {
                state.history.push(line);
              });
              if (!state.geo.notes) state.geo.notes = {};
              if (task.reason) state.geo.notes[state.history.length - 1] = task.reason;
            } else if (task.kind === "perpendicular" && DoctematicaGeometry.canonicalPerpendicularSteps) {
              var perpSteps = DoctematicaGeometry.canonicalPerpendicularSteps(task, pack);
              var perpBase = state.history.length;
              perpSteps.forEach(function (line) {
                state.history.push(line);
              });
              if (!state.geo.notes) state.geo.notes = {};
              var perpNote = DoctematicaGeometry.perpSlopeReason
                ? DoctematicaGeometry.perpSlopeReason(task, pack)
                : "";
              var pk;
              for (pk = 0; pk < perpSteps.length; pk++) {
                var pln = String(perpSteps[pk] || "");
                if (/^(כן|לא)$/.test(pln) || /^ולכן/.test(pln)) continue;
                if (/[·×*]/.test(pln) && /=/.test(pln)) {
                  state.geo.notes[perpBase + pk] = perpNote;
                  break;
                }
              }
            } else if (task.kind === "yesNo") {
              state.history.push(task.answer ? "כן" : "לא");
            } else if (task.kind === "lineEq" && DoctematicaGeometry.canonicalLineEqSteps) {
              DoctematicaGeometry.canonicalLineEqSteps(task).forEach(function (line) {
                state.history.push(line);
              });
            } else if (task.kind === "lineIntersect" && DoctematicaGeometry.canonicalLineIntersectSteps) {
              DoctematicaGeometry.canonicalLineIntersectSteps(task, pack).forEach(function (line) {
                state.history.push(line);
              });
            } else if (
              (task.kind === "point" || task.kind === "noIntercept") &&
              DoctematicaGeometry.canonicalLineSteps
            ) {
              var lineSteps = DoctematicaGeometry.canonicalLineSteps(task, pack);
              if (lineSteps.length) {
                lineSteps.forEach(function (line) {
                  state.history.push(line);
                });
              } else if (task.kind === "point") {
                state.history.push(DoctematicaGeometry.canonicalStep(task, pack.map));
              }
            } else if (task.kind === "area" && DoctematicaGeometry.canonicalAreaSteps) {
              DoctematicaGeometry.canonicalAreaSteps(task, pack.map).forEach(function (line) {
                state.history.push(line);
              });
            } else if (DoctematicaGeometry.canonicalDiffChain) {
              state.history.push(DoctematicaGeometry.canonicalDiffChain(task, pack.map));
            } else {
              state.history.push(DoctematicaGeometry.canonicalStep(task, pack.map));
            }
          }
        });
      });
    } else {
      state.history = state.history.concat(pack.steps || []);
    }
    var done = {};
    pack.tasks.forEach(function (t) {
      done[t.id] = true;
    });
    state.geo.done = done;
    state.geo.partial = {};
    state.geo.coords = {};
    if (
      pack.line &&
      DoctematicaGeometry.lineMbNeedsUnsorted &&
      DoctematicaGeometry.lineMbNeedsUnsorted(pack.line) &&
      DoctematicaGeometry.sortedLineEq
    ) {
      state.geo.lineEqDisplay = DoctematicaGeometry.sortedLineEq(pack.line);
    } else if (
      pack.tasks &&
      pack.tasks.some(function (t) {
        return t.kind === "lineEq";
      }) &&
      pack.line &&
      DoctematicaGeometry.sortedLineEq
    ) {
      state.geo.lineEqDisplay = DoctematicaGeometry.sortedLineEq(pack.line);
    } else {
      state.geo.lineEqDisplay = null;
    }
    state.geo.draw = DoctematicaGeometry.initDrawProgress
      ? DoctematicaGeometry.initDrawProgress(pack, {})
      : null;
    if (DoctematicaGeometry.siteAddAllHeights) {
      state.geo.draw = DoctematicaGeometry.siteAddAllHeights(pack, state.geo);
    }
    pack.tasks.forEach(function (t) {
      if (t.kind === "point" || t.kind === "midpoint") state.geo.coords[t.id] = { x: true, y: true };
    });
    markSolved();
    renderSteps();
    renderGeoPart();
    renderGeoScene(null);
    renderGeoAskUi();
    mathField.setDisabled(true);
    checkBtn.disabled = true;
    nextAfterSolveBtn.classList.remove("hidden");
    showFeedback(true, "<strong>פתרון מלא.</strong> כל הצעדים מוצגים בהיסטוריה.");
  }

  function applyHighRootTyped(typed) {
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו את הצעד הבא.");
      return false;
    }
    if (!isHighRootServerMode()) {
      showBasicEqServerUnavailable();
      return false;
    }
    if (equationsCheckBusy) return true;
    var shownTyped = String(typed || "").trim();
    var prev = lastHistoryEq();
    if (
      !requestHighPowerAction(
        {
          intent: "check",
          start: (state.problem && state.problem.startEquation) || prev,
          history: state.history && state.history.length ? state.history : [prev],
          previous: prev,
          typed: shownTyped,
        },
        function (res) {
          applyHighRootServerResult(shownTyped, res);
        }
      )
    ) {
      showBasicEqServerUnavailable();
    }
    return true;
  }

  function applyHighRootServerResult(shownTyped, res) {
    res = res || {};
    state.stats.try += 1;
    saveStats();
    renderStats();
    if (!res.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
      return;
    }
    if (res.progress) state.sqrtProg = res.progress;
    if (shownTyped && state.history[state.history.length - 1] !== shownTyped) {
      state.history.push(shownTyped);
    }
    renderSteps();
    if (res.solved) {
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      renderSteps();
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + res.message);
      return;
    }
    mathField.clear();
    var label = res.isolated || res.kind === "both" || res.kind === "finish" ? "נכון" : "צעד חוקי";
    showFeedback(true, "<strong>" + label + ".</strong> " + res.message, res.solved ? undefined : "tip");
    mathField.focus();
  }

  function normLike(s) {
    return String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
  }

  function highRootHint() {
    if (
      !requestHighPowerAction(
        {
          intent: "hint",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
        },
        function (remote) {
          showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "בודדו ואז שורש n."), "tip");
        }
      )
    ) {
      showBasicEqServerUnavailable();
    }
  }

  function highRootOneStep() {
    if (
      !requestHighPowerAction(
        {
          intent: "one-step",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
        },
        function (remote) {
          if (remote.step) {
            applyHighRootServerResult(remote.step, remote);
            return;
          }
          showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "התרגיל כבר פתור."), "tip");
        }
      )
    ) {
      showBasicEqServerUnavailable();
    }
  }

  function applySqrtServerResult(shownTyped, res) {
    res = res || {};
    state.stats.try += 1;
    saveStats();
    renderStats();
    if (!res.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
      return;
    }
    if (res.progress) state.sqrtProg = res.progress;
    state.history.push(shownTyped);
    renderSteps();
    if (res.solved) {
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      renderSteps();
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + res.message);
      return;
    }
    mathField.clear();
    var label = res.isolated || res.kind === "both" || res.kind === "finish" ? "נכון" : "צעד חוקי";
    showFeedback(true, "<strong>" + label + ".</strong> " + res.message, res.solved ? undefined : "tip");
    mathField.focus();
  }

  function applySqrtEqTyped(typed) {
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו את הצעד הבא.");
      return false;
    }
    var shownTyped = String(typed || "").trim();
    typed = geoEngineTyped(shownTyped);
    if (isSqrtServerMode() || (isMixedServerMode() && mixedPath() === "sqrt")) {
      if (equationsCheckBusy) return true;
      var prev = lastHistoryEq();
      requestQuadraticAction(
        {
          intent: "check",
          start: (state.problem && state.problem.startEquation) || prev,
          history: state.history && state.history.length ? state.history : [prev],
          previous: prev,
          typed: typed,
        },
        function (res) {
          applySqrtServerResult(shownTyped, res);
        }
      );
      return true;
    }
    if (DoctematicaAlgebra.missingEqualsSign(typed)) {
      state.stats.try += 1;
      saveStats();
      renderStats();
      showFeedback(false, "<strong>עוד לא.</strong> חסר סימן שווה");
      return false;
    }
    state.stats.try += 1;
    saveStats();
    renderStats();
    var prev = lastHistoryEq();
    var pack = state.problem.sqrt;
    var Q = DoctematicaQuadratic;
    if (Q.hasVisibleLinearX && Q.hasVisibleLinearX(prev)) {
      var mixedPack = state.problem.mixed;
      var nextP = Q.parseABC(typed);
      var isoT = Q.isolatedK(typed);
      if (mixedPack && nextP && Q.abcEquivalent(mixedPack, nextP) && isoT && (isoT.kind === "value" || isoT.kind === "unreduced" || isoT.kind === "expr")) {
        state.history.push(shownTyped);
        renderSteps();
        mathField.clear();
        showFeedback(true, "<strong>נכון.</strong> x² מבודד. עכשיו הוציאו שורש משני האגפים.");
        mathField.focus();
        return true;
      }
    }
    var both = Q.checkSqrtBothSides(prev, typed);
    if (both) {
      if (!both.ok) {
        showFeedback(false, "<strong>עוד לא.</strong> " + both.message);
        return false;
      }
      state.history.push(shownTyped);
      renderSteps();
      mathField.clear();
      showFeedback(true, "<strong>נכון.</strong> " + both.message);
      mathField.focus();
      return true;
    }
    var isolated = false;
    var h;
    for (h = 0; h < state.history.length; h++) {
      var isoH = Q.isolatedK(geoEngineTyped(state.history[h]));
      if (isoH && (isoH.kind === "value" || isoH.kind === "unreduced")) isolated = true;
    }
    var rootAns = Q.isRootAnswerText(typed);
    var stillX2 = Q.hasX2(typed);
    if ((!isolated || stillX2) && !rootAns) {
      var result = DoctematicaAlgebra.checkStep(prev, typed, { unknown: "x2" });
      if (!result.ok) {
        showFeedback(false, "<strong>עוד לא.</strong> " + result.message);
        return false;
      }
      state.history.push(shownTyped);
      renderSteps();
      mathField.clear();
      showFeedback(
        true,
        result.isolated
          ? "<strong>נכון.</strong> " + result.message
          : "<strong>צעד חוקי.</strong> " + result.message
      );
      mathField.focus();
      return true;
    }
    var fin = Q.checkSqrtFinish(typed, pack, state.sqrtProg || { pos: false, neg: false });
    if (!fin.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + fin.message);
      return false;
    }
    if (fin.progress) state.sqrtProg = fin.progress;
    state.history.push(shownTyped);
    renderSteps();
    if (fin.solved) {
      if (finishEqSolveForGeo(shownTyped || (pack && pack.answer) || "")) return true;
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      renderSteps();
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + fin.message);
      return true;
    }
    mathField.clear();
    showFeedback(true, "<strong>נכון.</strong> " + fin.message);
    mathField.focus();
    return true;
  }

  function applyLinearTyped(typed) {
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו את הצעד הבא.");
      return false;
    }
    var shownTyped = String(typed || "").trim();
    typed = geoEngineTyped(shownTyped);
    var prevEq = lastHistoryEq();
    function applyLinearVerdict(result) {
      state.stats.try += 1;
      saveStats();
      renderStats();
      if (!result.ok) {
        showFeedback(false, "<strong>עוד לא.</strong> " + result.message);
        return false;
      }
      state.history.push(shownTyped);
      renderSteps();
      if (result.solved) {
        if (finishEqSolveForGeo(shownTyped)) return true;
        markSolved();
        mathField.setDisabled(true);
        checkBtn.disabled = true;
        renderSteps();
        nextAfterSolveBtn.classList.remove("hidden");
        showFeedback(true, "<strong>כל הכבוד.</strong> " + result.message);
        return true;
      }
      mathField.clear();
      showFeedback(true, "<strong>צעד חוקי.</strong> " + result.message);
      mathField.focus();
      return true;
    }
    if (requestBasicEqCheck(prevEq, typed, applyLinearVerdict)) return false;
    if (isMixedServerMode()) {
      requestQuadraticAction(
        {
          intent: "check",
          start: (state.problem && state.problem.startEquation) || prevEq,
          history: state.history,
          previous: prevEq,
          typed: typed,
          domain: denomDomainPayload(),
          factor: factorPayload(),
        },
        applyLinearVerdict
      );
      return true;
    }
    return applyLinearVerdict(DoctematicaAlgebra.checkStep(prevEq, typed));
  }

  function beginMixedFormulaFromServer(res, md53) {
    res = res || {};
    if (res.ok === false) {
      showFeedback(false, "<strong>עוד לא.</strong> " + (res.message || ""));
      return false;
    }
    state.mixed = state.mixed || emptyMixedState();
    state.mixed.path = "formula";
    state.mixed.md53 = !!(md53 || res.md53);
    startQuadSession();
    if (res.view) mergeQuadView(res.view);
    renderQuadGuide();
    renderSteps();
    updateFormulaBtn();
    setModeUi();
    showFeedback(
      true,
      "<strong>" + (state.mixed.md53 ? "md53" : "נוסחת שורשים") + ".</strong> " + (res.message || res.hint || ""),
      "tip"
    );
    return true;
  }

  function enterMixedFormula() {
    if (geoEqSolveActive()) ensureGeoMixedPack();
    if (isMixedServerMode()) {
      requestQuadraticAction(
        {
          intent: "formula-enter",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          md53: false,
          domain: denomDomainPayload(),
        },
        function (res) {
          beginMixedFormulaFromServer(res, false);
        }
      );
      return;
    }
    var pack = state.problem.mixed;
    if (!state.problem.quad && pack) {
      state.problem.quad = pack.quad || DoctematicaQuadratic.analyze(pack.a, pack.b, pack.c, pack.standard);
    }
    if (!state.problem.quad) {
      showFeedback(false, "<strong>עוד לא.</strong> קודם הביאו לצורה ax²+bx+c=0.");
      return;
    }
    state.mixed = state.mixed || emptyMixedState();
    state.mixed.path = "formula";
    state.mixed.md53 = false;
    startQuadSession();
    renderQuadGuide();
    renderSteps();
    updateFormulaBtn();
    showFeedback(
      true,
      "<strong>נוסחת שורשים.</strong> a, b, c הם המקדמים אחרי האיסוף, בצורה ax²+bx+c=0.",
      "tip"
    );
  }

  function enterMixedMd53() {
    if (geoEqSolveActive()) ensureGeoMixedPack();
    if (isMixedServerMode()) {
      requestQuadraticAction(
        {
          intent: "formula-enter",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          md53: true,
          domain: denomDomainPayload(),
        },
        function (res) {
          beginMixedFormulaFromServer(res, true);
        }
      );
      return;
    }
    var last = lastHistoryEq();
    var Q = DoctematicaQuadratic;
    var p = Q.parseABC(last);
    if (!p || !p.a) {
      showFeedback(false, "<strong>עוד לא.</strong> קודם סדרו ל־ax²+bx+c=0 (גם אם b או c אפס).");
      return;
    }
    state.problem.quad = Q.analyze(p.a, p.b, p.c, last);
    state.mixed = state.mixed || emptyMixedState();
    state.mixed.path = "formula";
    state.mixed.md53 = true;
    startQuadSession();
    renderQuadGuide();
    renderSteps();
    updateFormulaBtn();
    showFeedback(
      true,
      "<strong>md53.</strong> כמו במחשבון: רשמו a, אחר כך b, אחר כך c. אחרי שלושתם מופיע הפתרון. גם אם b=0 או c=0.",
      "tip"
    );
  }

  function applyMixedTyped(typed) {
    typed = String(typed || "").trim();
    var shownTyped = typed;
    typed = geoEngineTyped(shownTyped);
    var path = mixedPath();
    if (path === "formula") {
      handleQuadSubmit();
      return true;
    }
    if (!typed) {
      if (state.lcd && state.lcd.phase) {
        handleLcdSubmit();
        return true;
      }
      showFeedback(false, "<strong>עוד לא.</strong> כתבו את הצעד הבא.");
      return false;
    }
    if (isMixedServerMode()) {
      if (equationsCheckBusy) return true;
      requestQuadraticAction(
        {
          intent: "check",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          previous: lastHistoryEq(),
          typed: typed,
          domain: denomDomainPayload(),
          factor: factorPayload(),
        },
        function (res) {
          applyMixedServerResult(shownTyped, res);
        }
      );
      return true;
    }
    if (path === "sqrt") return applySqrtEqTyped(shownTyped);
    if (path === "factor") return applyFactorTyped(shownTyped);
    if (path === "linear") return applyLinearTyped(shownTyped);

    var pack = state.problem.mixed;
    var Q = DoctematicaQuadratic;
    var res = Q.checkMixedTyped(lastHistoryEq(), typed, pack);
    if (!res.ok) {
      state.stats.try += 1;
      saveStats();
      renderStats();
      showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
      return false;
    }
    if (res.path === "factor") {
      if (res.factor) state.problem.factor = res.factor;
      state.mixed.path = "factor";
      return applyFactorTyped(shownTyped);
    }
    if (res.enter === "sqrt") {
      if (!state.problem.sqrt && pack && pack.sqrt) state.problem.sqrt = pack.sqrt;
      if (!state.problem.sqrt && pack) {
        try {
          state.problem.sqrt = Q.analyzeSqrtStart(pack.standard);
        } catch (err) {}
      }
      state.mixed.path = "sqrt";
      state.sqrtProg = { pos: false, neg: false };
      return applySqrtEqTyped(shownTyped);
    }
    if (res.enter === "linear") {
      state.mixed.path = "linear";
      state.stats.try += 1;
      saveStats();
      renderStats();
      state.history.push(shownTyped);
      renderSteps();
      mathField.clear();
      try {
        var lin = DoctematicaAlgebra.parseEquation(typed);
        if (DoctematicaAlgebra.isSolved(lin)) {
          markSolved();
          mathField.setDisabled(true);
          checkBtn.disabled = true;
          renderSteps();
          nextAfterSolveBtn.classList.remove("hidden");
          showFeedback(true, "<strong>כל הכבוד.</strong> " + res.message);
          return true;
        }
      } catch (err2) {}
      showFeedback(true, "<strong>נכון.</strong> " + res.message);
      mathField.focus();
      return true;
    }
    if (res.solved) {
      state.stats.try += 1;
      saveStats();
      renderStats();
      state.history.push(shownTyped);
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      renderSteps();
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + res.message);
      return true;
    }
    state.stats.try += 1;
    saveStats();
    renderStats();
    clearLcdAssist();
    state.history.push(shownTyped);
    renderSteps();
    mathField.clear();
    showFeedback(true, "<strong>צעד חוקי.</strong> " + res.message);
    mathField.focus();
    return true;
  }

  function applyMixedServerResult(shownTyped, res) {
    res = res || {};
    if (res.errorId === "domain-required") {
      state.stats.try += 1;
      saveStats();
      renderStats();
      showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
      return;
    }
    if ((res.path === "formula" || res.enter === "formula") && !res.step) {
      beginMixedFormulaFromServer(res);
      return;
    }
    if ((res.path === "formula" || res.enter === "formula") && state.quad) {
      state.mixed = state.mixed || emptyMixedState();
      state.mixed.path = "formula";
      applyQuadServerResult(res);
      setModeUi();
      return;
    }
    if (res.path === "sqrt" || res.enter === "sqrt") {
      state.mixed = state.mixed || emptyMixedState();
      state.mixed.path = "sqrt";
      applySqrtServerResult(shownTyped, res);
      setModeUi();
      return;
    }
    if (res.path === "factor" || res.enter === "factor") {
      state.mixed = state.mixed || emptyMixedState();
      state.mixed.path = "factor";
      if (res.factor) state.problem.factor = res.factor;
      applyFactorServerResult(shownTyped, res);
      updateSplitBtn();
      updateFormulaBtn();
      setModeUi();
      return;
    }
    if (res.path === "linear" || res.enter === "linear") {
      state.mixed = state.mixed || emptyMixedState();
      state.mixed.path = "linear";
      state.stats.try += 1;
      saveStats();
      renderStats();
      if (!res.ok) {
        showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
        return;
      }
      state.history.push(shownTyped);
      renderSteps();
      if (res.solved) {
        markSolved();
        mathField.setDisabled(true);
        checkBtn.disabled = true;
        nextAfterSolveBtn.classList.remove("hidden");
        showFeedback(true, "<strong>כל הכבוד.</strong> " + res.message);
        return;
      }
      mathField.clear();
      showFeedback(true, "<strong>נכון.</strong> " + res.message);
      mathField.focus();
      setModeUi();
      return;
    }
    state.stats.try += 1;
    saveStats();
    renderStats();
    if (!res.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
      return;
    }
    if (res.solved) {
      state.history.push(shownTyped);
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      renderSteps();
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + res.message);
      return;
    }
    clearLcdAssist();
    state.history.push(shownTyped);
    renderSteps();
    mathField.clear();
    updateSplitBtn();
    updateFormulaBtn();
    showFeedback(true, "<strong>צעד חוקי.</strong> " + (res.message || ""));
    mathField.focus();
  }

  function mixedHint() {
    if (domainPending()) return stepHint();
    if (mixedPath() === "formula") return quadHint();
    if (mixedPath() === "factor") return factorHint();
    if (mixedPath() === "sqrt") return sqrtHint();
    if (mixedPath() === "linear") {
      if (isMixedServerMode()) {
        requestQuadraticAction(
          {
            intent: "hint",
            start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
            history: state.history,
            domain: denomDomainPayload(),
          },
          function (remote) {
            showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || ""), remote.done ? undefined : "tip");
          }
        );
        return;
      }
      return stepHint();
    }
    if (isMixedServerMode()) {
      requestQuadraticAction(
        {
          intent: "hint",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          domain: denomDomainPayload(),
          factor: factorPayload(),
        },
        function (remote) {
          showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || ""), remote.done ? undefined : "tip");
        }
      );
      return;
    }
    var pack = state.problem.mixed;
    var path = mixedPath();
    if (path === "sqrt") return sqrtHint();
    if (path === "factor") return factorHint();
    if (path === "formula") return quadHint();
    if (path === "linear") return stepHint();
    var act = DoctematicaQuadratic.nextMixedStep(lastHistoryEq(), pack);
    showFeedback(true, "<strong>רמז.</strong> " + ((act && act.hint) || DoctematicaQuadratic.mixedHintFor(pack, lastHistoryEq())), "tip");
  }

  function mixedOneStep() {
    if (domainPending()) return stepOneStep();
    if (isMixedServerMode()) {
      if (mixedPath() === "formula") return fillQuadStep();
      if (mixedPath() === "factor") return factorOneStep();
      if (mixedPath() === "sqrt") return sqrtOneStep();
      if (maybeApplyLcdMarksOneStep()) return;
      requestQuadraticAction(
        {
          intent: "one-step",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          domain: denomDomainPayload(),
          factor: factorPayload(),
        },
        function (remote) {
          if (remote.enter === "formula" || (remote.path === "formula" && !remote.step)) {
            beginMixedFormulaFromServer(remote);
            return;
          }
          if (remote.enter === "sqrt" || remote.path === "sqrt") {
            state.mixed = state.mixed || emptyMixedState();
            state.mixed.path = "sqrt";
            setModeUi();
            if (remote.step) {
              applySqrtServerResult(remote.step, remote);
              return;
            }
            sqrtOneStep();
            return;
          }
          if (remote.enter === "linear" || remote.path === "linear") {
            state.mixed = state.mixed || emptyMixedState();
            state.mixed.path = "linear";
            setModeUi();
            if (remote.step) {
              applyMixedServerResult(remote.step, remote);
              return;
            }
            showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || remote.message || ""), "tip");
            return;
          }
          if (remote.enter === "factor" || remote.path === "factor") {
            state.mixed = state.mixed || emptyMixedState();
            state.mixed.path = "factor";
            if (remote.split && !(state.factor && state.factor.split)) {
              applyFactorServerResult("", remote);
              setModeUi();
              return;
            }
            if (remote.step) {
              applyMixedServerResult(remote.step, remote);
              return;
            }
            setModeUi();
            factorOneStep();
            return;
          }
          if (remote.split && !(state.factor && state.factor.split)) {
            state.mixed = state.mixed || emptyMixedState();
            state.mixed.path = "factor";
            applyFactorServerResult("", remote);
            setModeUi();
            return;
          }
          if (remote.step) {
            applyMixedServerResult(remote.step, remote);
            return;
          }
          showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "התרגיל כבר פתור."), "tip");
        }
      );
      return;
    }
    var pack = state.problem.mixed;
    var path = mixedPath();
    if (path === "sqrt") return sqrtOneStep();
    if (path === "factor") return factorOneStep();
    if (path === "formula") return fillQuadStep();
    if (path === "linear") return stepOneStep();
    if (maybeApplyLcdMarksOneStep()) return;
    var act = DoctematicaQuadratic.nextMixedStep(lastHistoryEq(), pack);
    if (!act) return;
    if (act.path === "formula") {
      enterMixedFormula();
      return;
    }
    if (act.path === "factor" && act.eq) {
      if (pack.factor) state.problem.factor = pack.factor;
      state.mixed.path = "factor";
      applyFactorTyped(act.eq);
      return;
    }
    if (act.eq) {
      applyMixedTyped(act.eq);
      return;
    }
    showFeedback(true, "<strong>רמז.</strong> " + (act.hint || "התרגיל כבר פתור."), "tip");
  }

  var MATH_FIELD_HINT =
    "הקלידו רגיל. לשבר לחצו «שבר» — החצים זזים בין מונה למכנה. לשבר-בתוך-שבר עמדו במונה או במכנה ולחצו «שבר» שוב.";

  function showEqSolution(title, opts) {
    opts = opts || {};
    if (!state.problem) return false;
    var steps = opts.steps || state.problem.solutionSteps || [];
    if (!opts.always && !steps.length) return false;
    var notes = opts.withNotes ? opts.notes || state.problem.solutionNotes || [] : [];
    var mixed = state.problem.mixed;
    var lcdInfo = mixed && mixed.lcdInfo;
    var cleared = mixed && mixed.cleared;
    var lines = "";
    var domainInfo =
      opts.domain ||
      (state.domain && state.domain.info) ||
      state.problem.domain ||
      (isDomainLcdServerMode()
        ? null
        : DoctematicaTeach && typeof DoctematicaTeach.analyzeDomain === "function"
          ? DoctematicaTeach.analyzeDomain(state.problem.startEquation || "")
          : null);
    if (domainInfo && domainInfo.display) {
      var domHtml;
      if (domainInfo.parts && domainInfo.parts.length > 1) {
        domHtml = domainInfo.parts
          .map(function (p) {
            return '<span class="domain-chip">' + DoctematicaMath.toHTML(p) + "</span>";
          })
          .join('<span class="domain-sep">, </span>');
      } else {
        domHtml = DoctematicaMath.toHTML(domainInfo.display);
      }
      lines +=
        "<li class=\"domain-row\"><span class=\"domain-body\">" +
        domHtml +
        '</span><div class="why">תחום הצבה' +
        (domainInfo.count > 1 ? " (" + domainInfo.count + " ערכים אסורים)" : "") +
        ".</div></li>";
    }
    var i;
    for (i = 0; i < steps.length; i++) {
      var step = steps[i];
      var body = opts.plain
        ? String(step).replace(/-/g, "−")
        : DoctematicaMath.toHTML(step);
      var why = notes[i] ? "<div class=\"why\">" + notes[i] + "</div>" : "";
      lines += "<li" + (opts.plain ? " dir=\"ltr\"" : "") + ">" + body + why + "</li>";
      if (
        !opts.plain &&
        i === 0 &&
        lcdInfo &&
        cleared &&
        steps.length > 1 &&
        DoctematicaMath &&
        typeof buildLcdEqView === "function"
      ) {
        var hats = buildLcdEqView(lcdInfo);
        lines +=
          "<li><div class=\"sol-lcd\">" +
          hats.outerHTML +
          '</div><div class="why">מכנה משותף ' +
          lcdInfo.lcd +
          " — מכפילים מעל כל איבר.</div></li>";
      }
    }
    var extra = opts.note
      ? " <span class=\"muted-note\">" + opts.note + "</span>"
      : "";
    var footer =
      opts.footer != null
        ? opts.footer
        : String(state.problem.answer).replace(/-/g, "−");
    modelEl.classList.remove("hidden");
    modelEl.innerHTML =
      "<strong>" + title + "</strong>" + extra + "<ol>" + lines + "</ol><p>" + footer + "</p>";
    return true;
  }

  function quadHint() {
    if (!state.quad) return;
    if (isFormulaWorkServerMode()) {
      requestQuadCheck(
        { intent: "hint" },
        function (remote) {
          showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "התרגיל כבר פתור."), "tip");
        }
      );
      return;
    }
    var tips = {
      abc: "a מקדם x², b מקדם x, c החופשי. כאן a = " + want.a + ".",
      plug: "הציבו a, b, c. אם b שלילי, ב־b² כתבו עם סוגריים, למשל (−4)².",
      compute:
        "חשבו −b, את " +
        DoctematicaQuadratic.discExpr(want.a, want.b, want.c) +
        ", ואת 2a. שני מינוסים הופכים לפלוס.",
      sqrt: "√(" + want.D + ") הוא מספר שלם.",
      count: "הסתכלו על סימן הדיסקרימיננטה Δ = " + want.D + ". אפשר גם ללחוץ המשך.",
      nosol: "רשמו שאין פתרון ממשי.",
      rootwork: "חשבו קודם את המונה, ואז את השבר עם קו השבר. אחר כך את התוצאה.",
      roots: "x = (−b ± √Δ) / (2a). צמצמו את השבר.",
    };
    showFeedback(true, "<strong>רמז.</strong> " + (tips[state.quad.phase] || "התרגיל כבר פתור."), "tip");
  }

  function sqrtHint() {
    if (isSqrtServerMode() || (isMixedServerMode() && mixedPath() === "sqrt")) {
      var hintEq = lastHistoryEq();
      requestQuadraticAction(
        {
          intent: "hint",
          start: (state.problem && state.problem.startEquation) || hintEq,
          history: state.history,
        },
        function (remote) {
          showFeedback(true, "<strong>רמז.</strong> " + remote.hint, remote.done ? undefined : "tip");
        }
      );
      return;
    }
    var cur = lastHistoryEq();
    var act = DoctematicaTeach.nextAction(cur, { unknown: "x2" });
    var extra = (act.isolated || act.done) && DoctematicaQuadratic.nextSqrtStep(cur, state.problem.sqrt);
    showFeedback(true, "<strong>רמז.</strong> " + ((extra && extra.hint) || act.hint), "tip");
  }

  function sqrtOneStep() {
    if (isSqrtServerMode() || (isMixedServerMode() && mixedPath() === "sqrt")) {
      var cur = lastHistoryEq();
      requestQuadraticAction(
        {
          intent: "one-step",
          start: (state.problem && state.problem.startEquation) || cur,
          history: state.history,
        },
        function (remote) {
          if (remote.step) {
            applySqrtServerResult(remote.step, remote);
            return;
          }
          showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "התרגיל כבר פתור."), remote.done ? undefined : "tip");
        }
      );
      return;
    }
    var cur = lastHistoryEq();
    var act = DoctematicaTeach.nextAction(cur, { unknown: "x2" });
    var nextEq = act.eq;
    if (!nextEq) {
      var fin = DoctematicaQuadratic.nextSqrtStep(cur, state.problem.sqrt);
      nextEq = fin && fin.eq;
    }
    if (!nextEq) {
      showFeedback(true, "<strong>רמז.</strong> " + (act.hint || "התרגיל כבר פתור."));
      return;
    }
    applySqrtEqTyped(nextEq);
  }

  function factorHint() {
    if (isHighFactorServerMode()) {
      if (
        !requestHighPowerAction(
          {
            intent: "hint",
            start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
            history: state.history,
            factor: factorPayload(),
          },
          function (remote) {
            if (remote.canSplit != null) {
              state.factor = state.factor || emptyFactorState();
              state.factor.canSplit = !!remote.canSplit;
              updateSplitBtn();
            }
            showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "הוציאו חזקה משותפת של x."), "tip");
          }
        )
      ) {
        showBasicEqServerUnavailable();
      }
      return;
    }
    if (isFactorServerMode() || (isMixedServerMode() && mixedPath() === "factor")) {
      requestQuadraticAction(
        {
          intent: "hint",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          factor: factorPayload(),
        },
        function (remote) {
          showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "הוציאו גורם משותף x."), "tip");
        }
      );
      return;
    }
    if (isHighPowerTopic()) {
      showBasicEqServerUnavailable();
      return;
    }
    var act = DoctematicaQuadratic.nextFactorStep(
      lastHistoryEq(),
      state.problem.factor,
      state.factor || emptyFactorState()
    );
    showFeedback(true, "<strong>רמז.</strong> " + ((act && act.hint) || "הוציאו גורם משותף x."), "tip");
  }

  function factorOneStep() {
    if (isHighFactorServerMode()) {
      if (
        !requestHighPowerAction(
          {
            intent: "one-step",
            start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
            history: state.history,
            factor: factorPayload(),
          },
          function (remote) {
            if (remote.resplit || (remote.split && !(state.factor && state.factor.split))) {
              applyFactorServerResult("", remote);
              return;
            }
            if (remote.step) {
              applyFactorServerResult(remote.step, remote);
              return;
            }
            showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "התרגיל כבר פתור."), "tip");
          }
        )
      ) {
        showBasicEqServerUnavailable();
      }
      return;
    }
    if (isFactorServerMode() || (isMixedServerMode() && mixedPath() === "factor")) {
      requestQuadraticAction(
        {
          intent: "one-step",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          factor: factorPayload(),
        },
        function (remote) {
          if (remote.split && !(state.factor && state.factor.split)) {
            applyFactorServerResult("", remote);
            return;
          }
          if (remote.step) {
            applyFactorServerResult(remote.step, remote);
            return;
          }
          showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "התרגיל כבר פתור."), "tip");
        }
      );
      return;
    }
    if (isHighPowerTopic()) {
      showBasicEqServerUnavailable();
      return;
    }
    var act = DoctematicaQuadratic.nextFactorStep(
      lastHistoryEq(),
      state.problem.factor,
      state.factor || emptyFactorState()
    );
    if (act && act.split) {
      doFactorSplit();
      return;
    }
    if (!act || !act.eq) {
      showFeedback(true, "<strong>רמז.</strong> " + ((act && act.hint) || "התרגיל כבר פתור."), "tip");
      return;
    }
    applyFactorTyped(act.eq);
  }

  function currentDomainWorkIndex() {
    if (!state.domain) return 0;
    if (state.domain.split) return state.domain.activeBranch || 0;
    var n = nextUnsolvedDomainBranch();
    return n >= 0 ? n : 0;
  }

  function domainItemForSlot(slot) {
    var items = domainItems();
    var prog = domainProgressItems();
    var p = prog[slot];
    if (p && p.itemIndex != null && items[p.itemIndex]) return items[p.itemIndex];
    var taken = {};
    var i;
    for (i = 0; i < prog.length; i++) {
      if (prog[i] && prog[i].itemIndex != null) taken[prog[i].itemIndex] = true;
    }
    for (i = 0; i < items.length; i++) {
      if (!taken[i]) return items[i];
    }
    return items[0] || null;
  }

  function currentDomainConstraint() {
    var items = domainItems();
    if (!items.length) return "";
    if (domainMulti()) {
      var idx = currentDomainWorkIndex();
      var prog = domainProgressItems()[idx];
      if (prog && prog.trail && prog.trail.length) return prog.trail[prog.trail.length - 1].display;
      var bound = domainItemForSlot(idx);
      return bound ? bound.rawPart : "";
    }
    var trail = (state.domain && state.domain.trail) || [];
    if (trail.length) return trail[trail.length - 1].display;
    return items[0].rawPart;
  }

  function currentDomainStarted() {
    if (domainMulti()) {
      var prog = domainProgressItems()[currentDomainWorkIndex()];
      return !!(prog && prog.trail && prog.trail.length);
    }
    return !!(state.domain && state.domain.trail && state.domain.trail.length);
  }

  function stepHint() {
    if (domainPending()) {
      if (isDomainLcdServerMode()) {
        requestDomainLcdAction(
          {
            intent: "domain-hint",
            start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
            history: state.history,
            domain: denomDomainPayload(),
          },
          function (remote) {
            showFeedback(true, "<strong>רמז.</strong> " + remote.hint, remote.done ? undefined : "tip");
          }
        );
        return;
      }
      var items = domainItems();
      if (!items.length) return;
      if (!currentDomainStarted()) {
        showFeedback(
          true,
          "<strong>רמז.</strong> רשמו באחד התאים מכנה≠0 או x≠… — איזה מכנה שתרצו. התא השני יהיה למכנה שנשאר.",
          "tip"
        );
        return;
      }
      var nxt = DoctematicaTeach.domainNextStep(currentDomainConstraint());
      showFeedback(true, "<strong>רמז.</strong> " + (nxt.hint || nxt.display), "tip");
      return;
    }
    if (isDomainLcdServerMode() && state.lcd && state.lcd.phase) {
      requestDomainLcdAction(
        {
          intent: "lcd-hint",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          domain: denomDomainPayload(),
          lcd: { phase: state.lcd.phase, lcd: state.lcd.lcd },
        },
        function (remote) {
          showFeedback(true, "<strong>רמז.</strong> " + remote.hint, "tip");
        }
      );
      return;
    }
    var hintEq = lastHistoryEq();
    if (
      requestBasicEqAction(
        {
          intent: "hint",
          start: (state.problem && state.problem.startEquation) || hintEq,
          history: state.history,
        },
        function (remote) {
          showFeedback(true, "<strong>רמז.</strong> " + remote.hint, remote.done ? undefined : "tip");
        }
      )
    ) {
      return;
    }
    var act = DoctematicaTeach.nextAction(hintEq);
    showFeedback(true, "<strong>רמז.</strong> " + act.hint, act.done ? undefined : "tip");
  }

  function stepOneStep() {
    if (domainPending()) {
      if (isDomainLcdServerMode()) {
        requestDomainLcdAction(
          {
            intent: "domain-one-step",
            start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
            history: state.history,
            domain: denomDomainPayload(),
          },
          function (res) {
            if (!res.ok) {
              showFeedback(false, "<strong>עוד לא.</strong> " + (res.message || ""));
              return;
            }
            applyDenomServerResult(res);
          }
        );
        return;
      }
      var items = domainItems();
      if (!currentDomainStarted()) {
        var first = domainItemForSlot(currentDomainWorkIndex());
        tryApplyDomainTyped((first && first.rawPart) || items[0].rawPart);
        return;
      }
      var nxt = DoctematicaTeach.domainNextStep(currentDomainConstraint());
      tryApplyDomainTyped(nxt.display);
      return;
    }
    if (maybeApplyLcdMarksOneStep()) return;
    var cur = lastHistoryEq();
    function applySiteStep(actEq, actHint, result) {
      if (!result.ok) {
        showFeedback(false, "<strong>לא הצלחתי לבצע את הצעד.</strong> " + result.message);
        return;
      }
      state.history.push(actEq);
      renderSteps();
      mathField.clear();
      if (result.solved) {
        markSolved();
        mathField.setDisabled(true);
        checkBtn.disabled = true;
        nextAfterSolveBtn.classList.remove("hidden");
        showFeedback(true, "<strong>צעד של האתר.</strong> " + (actHint || result.message));
        renderSteps();
      } else {
        showFeedback(true, "<strong>צעד של האתר.</strong> " + (actHint || result.message), "tip");
        mathField.focus();
      }
    }
    if (
      requestBasicEqAction(
        {
          intent: "one-step",
          start: (state.problem && state.problem.startEquation) || cur,
          history: state.history,
          lcdMarks: lastStepHasLcdMarks(),
        },
        function (remote) {
          if (remote.done || !remote.step) {
            showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "המשוואה כבר פתורה."));
            return;
          }
          clearLcdAssist();
          applySiteStep(remote.step, remote.hint, snapshotLinearCheck(remote));
        }
      )
    ) {
      return;
    }
    var actEq = null;
    var actHint = null;
    if (lastStepHasLcdMarks() && typeof DoctematicaTeach.clearEqDens === "function") {
      actEq = DoctematicaTeach.clearEqDens(cur);
      actHint = "כפלו כל איבר במכפיל והורידו את המכנים.";
    }
    if (!actEq) {
      var act = DoctematicaTeach.nextAction(cur);
      if (act.done || !act.eq) {
        showFeedback(true, "<strong>רמז.</strong> " + (act.hint || "המשוואה כבר פתורה."));
        return;
      }
      actEq = act.eq;
      actHint = act.hint;
    }
    clearLcdAssist();
    applySiteStep(actEq, actHint, DoctematicaAlgebra.checkStep(cur, actEq));
  }

  function currentGuide() {
    if (isSystemMode()) {
      return {
        work: true,
        hintText: MATH_FIELD_HINT,
        showSolution: function () {
          if (
            !requestSystemsAction(
              {
                intent: "solution",
                eq1: state.problem.eq1,
                eq2: state.problem.eq2,
                history: state.history || [],
                choices: (state.sys && state.sys.choices) || [],
              },
              function (remote) {
                modelEl.classList.remove("hidden");
                modelEl.innerHTML =
                  "<strong>המערכת:</strong> " +
                  DoctematicaMath.systemHTML(state.problem.eq1, state.problem.eq2) +
                  "<p>הפתרון: " +
                  ((remote && remote.answer) || "—") +
                  "</p><p>" +
                  ((remote && remote.explain) || (state.problem && state.problem.explain) || "") +
                  "</p>";
              }
            )
          ) {
            showBasicEqServerUnavailable();
          }
        },
      };
    }
    if (isQuadMode()) {
      return {
        work: true,
        buttons: true,
        hintText: MATH_FIELD_HINT,
        hint: quadHint,
        oneStep: function () {
          fillQuadStep();
        },
        showSolution: function () {
          if (
            requestQuadraticAction(
              {
                intent: "solution",
                start: state.problem.startEquation,
                history: state.history,
              },
              function (remote) {
                showEqSolution("פתרון מלא — נוסחת שורשים", {
                  plain: true,
                  always: true,
                  steps: (remote.steps || []).map(function (s) {
                    return s.eq;
                  }),
                  footer: remote.answer ? "הפתרון: " + remote.answer : "",
                });
              }
            )
          ) {
            return;
          }
          showEqSolution("פתרון מלא — נוסחת שורשים", { plain: true, always: true });
        },
      };
    }
    if (isSqrtEqMode()) {
      return {
        work: true,
        buttons: true,
        hintText:
          "בודדו את x² כמו במשוואה. אחרי x² = מספר אפשר √(x²)=√(מספר), ואז לחשב. אם השורש שלם / חצי / רבע — רשמו x = ± מספר. אם לא — אפשר להשאיר ±√. שלילי: אין פתרון ממשי.",
        hint: sqrtHint,
        oneStep: sqrtOneStep,
        showSolution: function () {
          if (
            requestQuadraticAction(
              {
                intent: "solution",
                start: state.problem.startEquation,
                history: state.history,
              },
              function (remote) {
                showEqSolution("פתרון מלא — שורש רגיל", {
                  always: true,
                  steps: (remote.steps || []).map(function (s) {
                    return s.eq;
                  }),
                  footer: remote.answer ? "הפתרון: " + remote.answer : "",
                });
              }
            )
          ) {
            return;
          }
          showEqSolution("פתרון מלא — שורש רגיל", { always: true });
        },
      };
    }
    if (isHighRootEqMode()) {
      return {
        work: true,
        buttons: true,
        hintText:
          "בודדו xⁿ = מספר. אחר כך הוציאו שורש ממעלה n משני האגפים (כפתור «שורש n»). בחזקה זוגית: x = ±… או אין פתרון ממשי; באי־זוגית: פתרון ממשי אחד.",
        hint: highRootHint,
        oneStep: highRootOneStep,
        showSolution: function () {
          if (
            requestHighPowerAction(
              {
                intent: "solution",
                start: state.problem.startEquation,
                history: state.history,
              },
              function (remote) {
                showEqSolution("פתרון מלא — שורש ממעלה גבוהה", {
                  always: true,
                  steps: (remote.steps || []).map(function (s) {
                    return s.eq;
                  }),
                  footer: remote.answer ? "הפתרון: " + remote.answer : "",
                });
              }
            )
          ) {
            return;
          }
          showBasicEqServerUnavailable();
        },
      };
    }
    if (isGeoLengthMode() || (isAnalyticTopic() && state.problem && state.problem.mode === "geo-length")) {
      if (geoEqSolveActive()) {
        ensureGeoMixedPack();
        var gMix = mixedPath();
        if (gMix === "formula") {
          return {
            work: true,
            buttons: true,
            hintText:
              state.mixed && state.mixed.md53
                ? "md53: רשמו a, אחר כך b, אחר כך c. אחרי שלושתם מופיע הפתרון."
                : "רשמו את המקדמים a, b, c בנוסחת השורשים. אחרי כל מקדם לחצו Enter.",
            hint: quadHint,
            oneStep: fillQuadStep,
            showSolution: geoShowSolution,
          };
        }
        if (gMix === "factor") {
          return {
            work: true,
            buttons: true,
            hintText: "מכפלה שווה אפס רק אם אחד הגורמים אפס. לחצו «חילוק למשוואות» ופתרו כל גורם.",
            hint: factorHint,
            oneStep: factorOneStep,
            showSolution: geoShowSolution,
          };
        }
        if (gMix === "sqrt") {
          return {
            work: true,
            buttons: true,
            hintText: "בודדו את x² ואז הוציאו שורש משני האגפים. אם האגף השני שלילי — אין פתרון ממשי.",
            hint: sqrtHint,
            oneStep: sqrtOneStep,
            showSolution: geoShowSolution,
          };
        }
      }
      var geoPackHint = state.problem && state.problem.geo;
      var geoPartHint =
        geoPackHint && DoctematicaGeometry.currentPartText
          ? DoctematicaGeometry.currentPartText(geoPackHint, state.geo)
          : null;
      var geoPartHintIds = (geoPartHint && geoPartHint.taskIds) || [];
      function geoPartHasKind(kind) {
        return !!(
          geoPackHint &&
          (geoPackHint.tasks || []).some(function (t) {
            if (kind === "onLine") {
              if (t.kind !== "onLine" && t.kind !== "freePoint") return false;
            } else if (t.kind !== kind) return false;
            return !geoPartHintIds.length || geoPartHintIds.indexOf(t.id) >= 0;
          })
        );
      }
      var geoFocus =
        geoPackHint && DoctematicaGeometry.currentFocusTask
          ? DoctematicaGeometry.currentFocusTask(geoPackHint, state.geo)
          : null;
      var hasOnLineHint = geoPartHasKind("onLine");
      var hasParallelHint = geoFocus ? geoFocus.kind === "parallel" : geoPartHasKind("parallel");
      var hasPerpHint = geoFocus ? geoFocus.kind === "perpendicular" : geoPartHasKind("perpendicular");
      var hasSlopeHint = geoFocus ? geoFocus.kind === "slope" : geoPartHasKind("slope");
      var hasDistanceHint = geoFocus ? geoFocus.kind === "distance" || geoFocus.kind === "equalLen" : geoPartHasKind("distance") || geoPartHasKind("equalLen");
      var hasDistUnkHint = geoFocus ? geoFocus.kind === "distUnknown" : geoPartHasKind("distUnknown");
      var hasMidpointHint = geoFocus ? geoFocus.kind === "midpoint" : geoPartHasKind("midpoint");
      var midEndHint = !!(
        (geoFocus && geoFocus.kind === "midpoint" && geoFocus.mid) ||
        (hasMidpointHint &&
          geoPackHint &&
          (geoPackHint.tasks || []).some(function (t) {
            if (t.kind !== "midpoint" || !t.mid) return false;
            return !geoPartHintIds.length || geoPartHintIds.indexOf(t.id) >= 0;
          }))
      );
      var slopeIsParallel = !!(
        (geoFocus && geoFocus.kind === "slope" && geoFocus.parallel) ||
        (!geoFocus &&
          geoPackHint &&
          (geoPackHint.tasks || []).some(function (t) {
            if (t.kind !== "slope" || !t.parallel) return false;
            return !geoPartHintIds.length || geoPartHintIds.indexOf(t.id) >= 0;
          }))
      );
      var slopeIsPerp = !!(
        (geoFocus && geoFocus.kind === "slope" && geoFocus.perpendicular) ||
        (!geoFocus &&
          geoPackHint &&
          (geoPackHint.tasks || []).some(function (t) {
            if (t.kind !== "slope" || !t.perpendicular) return false;
            return !geoPartHintIds.length || geoPartHintIds.indexOf(t.id) >= 0;
          }))
      );
      var hasLineEqHint = geoFocus ? geoFocus.kind === "lineEq" : geoPartHasKind("lineEq");
      var axisLineHint = !!(
        (geoFocus && geoFocus.kind === "lineEq" && geoFocus.axisParallel) ||
        (!geoFocus &&
          geoPackHint &&
          (geoPackHint.tasks || []).some(function (t) {
            if (t.kind !== "lineEq" || !t.axisParallel) return false;
            return !geoPartHintIds.length || geoPartHintIds.indexOf(t.id) >= 0;
          }))
      );
      var hasYesNoHint = geoFocus ? geoFocus.kind === "yesNo" : geoPartHasKind("yesNo");
      var hasIntersectHint = geoFocus
        ? geoFocus.kind === "lineIntersect"
        : geoPartHasKind("lineIntersect");
      var hasLineHint =
        !!(state.problem && state.problem.geo && state.problem.geo.line) ||
        !!(
          geoPackHint &&
          (geoPackHint.tasks || []).some(function (t) {
            if (t.kind !== "point" || !t.intercept) return false;
            return !geoPartHintIds.length || geoPartHintIds.indexOf(t.id) >= 0;
          })
        );
      var hasAreaHint = geoPartHasKind("area") || geoPartHasKind("perimeter");
      var lineMatchHint =
        state.problem &&
        state.problem.geo &&
        DoctematicaGeometry.lineMatchPartActive &&
        DoctematicaGeometry.lineMatchPartActive(state.problem.geo, state.geo);
      return {
        work: true,
        buttons: true,
        hintText: lineMatchHint
          ? "שייכו כל משוואה לישר בציור (I, II…) ונמקו לפי השיפוע או לפי b."
          : hasOnLineHint
          ? "שתי דרכים: הציבו x ו־y והראו אם האגפים שווים, או הציבו רק x וחשבו y. בשאלות כן/לא — אחרי החישוב ענו כן או לא. אפשר לנמק."
          : hasParallelHint
          ? "ישרים מקבילים: שיפועים שווים. אם המשוואה לא ב־y = mx + b — סדרו קודם. אחר כך ענו כן או לא. נימוק באתר; אפשר לנמק אם תרצו."
          : hasPerpHint
          ? "ישרים מאונכים: מכפלת השיפועים היא −1. אם צריך — סדרו קודם ל־y = mx + b (לא חובה אם כבר יודעים את השיפוע). אחר כך ענו כן או לא."
          : hasMidpointHint
          ? midEndHint
            ? geoFocus && geoFocus.onAxis
              ? "הנקודה על ציר: רשמו את השיעור 0. AC = CB אומר ש־C אמצע — הציבו בנוסחה, הכפילו ב־2, ובודדו. אפשר גם ישר את הנקודה."
              : "אמצע ידוע, קצה חסר: הציבו xₘ = (x₁ + x)/2, הכפילו את אגף שמאל ב־2, ובודדו את x. אותו דבר ל־y. אפשר גם ישר את הנקודה."
            : "אמצע קטע: x = (x₁ + x₂)/2 ו־y = (y₁ + y₂)/2. הציבו, חברו את המונה, ואז חלקו. אפשר לדלג למונה או ישר לנקודה."
          : hasSlopeHint
          ? slopeIsParallel
            ? "לישרים מקבילים שיפועים שווים. רשמו m2 = mCD = … (או mII = mI), או m = …."
            : slopeIsPerp
              ? "לישרים מאונכים: m₁ · m₂ = −1. רשמו את הנוסחה, הציבו את השיפוע הנתון, ואז בודדו. אפשר גם ישר את השיפוע."
            : "שיפוע: כפתור «שיפוע» לרשום mAB = (y₂ − y₁)/(x₂ − x₁). לא משנה איזו נקודה היא 1 — אותו סדר במונה ובמכנה. אפשר גם m = … או ישר את המספר."
          : hasDistanceHint
          ? "מרחק: כפתור «מרחק» לרשום dAB. נוסחה d = √((x₂ − x₁)² + (y₂ − y₁)²). אותו סדר נקודות בשני ההפרשים. אפשר לדלג לשלבים או ישר לתשובה המדויקת (בלי עשרוני)."
          : hasDistUnkHint
          ? geoDistUnkNeedPoint()
            ? "יש את פתרונות המשוואה. רשמו את הנקודה שמתאימה לנתונים (רביע, ציר, ישר)."
            : geoEqSolveActive()
            ? "אחרי ביטול השורש: סדרו ax²+bx+c=0. «נוסחת שורשים» או md53, או גורם משותף ואז «חילוק למשוואות»."
            : "רשמו את הנקודה עם נעלם, הציבו בנוסחת המרחק, העלו בריבוע את שני האגפים, ופתרו."
          : hasYesNoHint
          ? "ענו כן או לא. אין צורך לנמק."
          : hasLineEqHint
          ? axisLineHint
            ? "מקביל לציר x (או מאונך לציר y): y = שיעור ה-y. מקביל לציר y (או מאונך לציר x): x = שיעור ה-x. אם נתון ישר שכבר מקביל לציר — גם הישר המבוקש מקביל לאותו ציר. אפשר לרשום ישר את המשוואה."
            : "משוואת ישר: הציבו y − y₁ = m(x − x₁) והביאו ל־y = mx + b, או הציבו את הנקודה ב־y = mx + b ומצאו את b."
          : hasIntersectHint
          ? "נקודת חיתוך: אם אחד הישרים מקביל לציר — רשמו את השיעור הידוע (y או x) והציבו במשוואה השנייה. אפשר גם להשוות בין שתי המשוואות."
          : hasLineHint
          ? "נתון x: הציבו ב־y = … וחשבו. נתון y: הציבו ופתרו משוואה בנעלם אחד, ואז רשמו את הנקודה (x;y)."
          : hasAreaHint
          ? "אורכים: גדול פחות קטן. שטח או היקף: בחרו ב«שטחים והיקפים», רשמו את הקודקודים, ואז את הביטוי והתוצאה."
          : "קטע/ראשית: גדול פחות קטן. מרחק לציר: A→x. מרחק מנקודה לקטע: C→AB או CAB. מציאת נקודה: B(x;y).",
        hint: geoHint,
        oneStep: geoOneStep,
        showSolution: geoShowSolution,
      };
    }
    if (isFactorEqMode()) {
      var high = isHighFactorServerMode();
      return {
        work: true,
        buttons: true,
        hintText: high
          ? "העבירו לאגף אחד אם צריך, הוציאו חזקה משותפת של x (ואפשר גם מספר), למשל x³−9x → x(x²−9)=0 או x³−4x² → x²(x−4)=0. אחר כך «חילוק למשוואות»: מ־xⁿ=0 מקבלים x=0; הענף השני לינארי או ריבועי (בידוד ואז שורש / ±)."
          : "הוציאו גורם משותף x, למשל x²−5x=0 → x(x−5)=0. אפשר גם 2x(x−4). אחרי הפירוק לחצו «חילוק למשוואות» ופתרו כל גורם = 0.",
        hint: factorHint,
        oneStep: factorOneStep,
        showSolution: function () {
          var title = high ? "פתרון מלא — משוואה בחזקה גבוהה" : "פתרון מלא — הוצאת גורם משותף";
          var sendSol = high ? requestHighPowerAction : requestQuadraticAction;
          if (
            sendSol(
              {
                intent: "solution",
                start: state.problem.startEquation,
                history: state.history,
                factor: factorPayload(),
              },
              function (remote) {
                showEqSolution(title, {
                  always: true,
                  steps: (remote.steps || []).map(function (s) {
                    return s.eq;
                  }),
                  footer: remote.answer ? "הפתרון: " + remote.answer : "",
                });
              }
            )
          ) {
            return;
          }
          showBasicEqServerUnavailable();
        },
      };
    }
    if (isMixedEqMode()) {
      var mixPath = mixedPath();
      if (mixPath === "formula") {
        return {
          work: true,
          buttons: true,
          hintText:
            state.mixed && state.mixed.md53
              ? "md53: רשמו a, אחר כך b, אחר כך c. אחרי שלושתם מופיע הפתרון."
              : "רשמו את המקדמים a, b, c בנוסחת השורשים. אחרי כל מקדם לחצו Enter.",
          hint: quadHint,
          oneStep: fillQuadStep,
          showSolution: function () {
            requestQuadraticAction(
              {
                intent: "solution",
                start: state.problem.startEquation,
                history: state.history,
                domain: denomDomainPayload(),
              },
              function (remote) {
                showEqSolution("פתרון מלא — משוואה ריבועית מגוונת", {
                  always: true,
                  steps: (remote.steps || []).map(function (s) {
                    return s.eq;
                  }),
                  footer: remote.answer ? "הפתרון: " + remote.answer : "",
                });
              }
            );
          },
        };
      }
      if (mixPath === "factor") {
        return {
          work: true,
          buttons: true,
          hintText: "מכפלה שווה אפס רק אם אחד הגורמים אפס. לחצו «חילוק למשוואות» ופתרו כל גורם.",
          hint: factorHint,
          oneStep: factorOneStep,
          showSolution: function () {
            requestQuadraticAction(
              {
                intent: "solution",
                start: state.problem.startEquation,
                history: state.history,
                domain: denomDomainPayload(),
                factor: factorPayload(),
              },
              function (remote) {
                showEqSolution("פתרון מלא — משוואה ריבועית מגוונת", {
                  always: true,
                  steps: (remote.steps || []).map(function (s) {
                    return s.eq;
                  }),
                  footer: remote.answer ? "הפתרון: " + remote.answer : "",
                });
              }
            );
          },
        };
      }
      if (mixPath === "sqrt") {
        return {
          work: true,
          buttons: true,
          hintText: "בודדו את x² ואז הוציאו שורש משני האגפים. אם האגף השני שלילי — אין פתרון ממשי.",
          hint: sqrtHint,
          oneStep: sqrtOneStep,
          showSolution: function () {
            requestQuadraticAction(
              {
                intent: "solution",
                start: state.problem.startEquation,
                history: state.history,
                domain: denomDomainPayload(),
              },
              function (remote) {
                showEqSolution("פתרון מלא — משוואה ריבועית מגוונת", {
                  always: true,
                  steps: (remote.steps || []).map(function (s) {
                    return s.eq;
                  }),
                  footer: remote.answer ? "הפתרון: " + remote.answer : "",
                });
              }
            );
          },
        };
      }
      if (mixPath === "linear") {
        return {
          work: true,
          buttons: true,
          hintText: "המקדם של x² התאפס. פתרו כמשוואה ממעלה ראשונה.",
          hint: mixedHint,
          oneStep: mixedOneStep,
          showSolution: function () {
            requestQuadraticAction(
              {
                intent: "solution",
                start: state.problem.startEquation,
                history: state.history,
                domain: denomDomainPayload(),
              },
              function (remote) {
                showEqSolution("פתרון מלא — משוואה ריבועית מגוונת", {
                  always: true,
                  steps: (remote.steps || []).map(function (s) {
                    return s.eq;
                  }),
                  footer: remote.answer ? "הפתרון: " + remote.answer : "",
                });
              }
            );
          },
        };
      }
      var mixedLevel = currentLevel();
      var mixedId = mixedLevel && mixedLevel.id;
      var hintText =
        mixedId === "quad-mixed-7"
          ? "קודם תחום הצבה (המכנים עם נעלם ≠ 0). אחר כך מכנה משותף — סמנו מכפילים מעל האיברים, כפלו והורידו מכנים, פתחו סוגריים, ואספו ל־ax²+bx+c=0. אחר כך md53 או נוסחת שורשים (גם אם b=0 או c=0)."
          : mixedId === "quad-mixed-6"
          ? "קודם מכנה משותף — סמנו מכפילים מעל האיברים כמו במחברת, כפלו, ואז המשיכו: סוגריים / כפל מקוצר / איסוף ל־ax²+bx+c=0. אחר כך md53 או נוסחת שורשים (גם אם b=0 או c=0)."
          : mixedId === "quad-mixed-5"
          ? "פתחו (a±b)² בכפל מקוצר, למשל (x−3)²=x²−6x+9. אם יש עוד סוגריים או גורם מימין כמו (x+1)2 — פתחו גם אותם באותו צעד. אחר כך סדרו ax²+bx+c=0 ולחצו md53 (גם אם b=0 או c=0) או נוסחת שורשים."
          : mixedId === "quad-mixed-4"
          ? "אם יש מקדם מחוץ לכפל שני סוגריים — קודם סוגר בסוגר (המקדם נשאר בחוץ), ואז כופלים את המקדם בכל איבר. בלי לאחד. אחר כך סדרו ax²+bx+c=0: md53 או נוסחת שורשים (גם אם b=0 או c=0)."
          : mixedId === "quad-mixed-3"
            ? "פתחו סוגריים כפולים: הראשון בסוגר הראשון בראשון ובשני של הסוגר השני, ואז האיבר השני בסוגר הראשון בשני איברי הסוגר השני — בלי לאחד. אחר כך סדרו ax²+bx+c=0: md53 או נוסחת שורשים (גם אם b=0 או c=0)."
            : "אם ה־x מימין לסוגריים — העבירו אותו לשמאל, ואז פתחו סוגריים. אחר כך סדרו ax²+bx+c=0 ולחצו md53 או נוסחת שורשים (גם אם b=0 או c=0). אם x² מתאפס — משוואה רגילה.";
      return {
        work: true,
        buttons: true,
        hintText: hintText,
        hint: mixedHint,
        oneStep: mixedOneStep,
        showSolution: function () {
          if (
            requestQuadraticAction(
              {
                intent: "solution",
                start: state.problem.startEquation,
                history: state.history,
                domain: denomDomainPayload(),
              },
              function (remote) {
                showEqSolution("פתרון מלא — משוואה ריבועית מגוונת", {
                  always: true,
                  steps: (remote.steps || []).map(function (s) {
                    return s.eq;
                  }),
                  footer: remote.answer ? "הפתרון: " + remote.answer : "",
                });
              }
            )
          ) {
            return;
          }
          showEqSolution("פתרון מלא — משוואה ריבועית מגוונת", { always: true });
        },
      };
    }
    if (isStepMode()) {
      return {
        work: true,
        buttons: true,
        hintText: MATH_FIELD_HINT,
        hint: stepHint,
        oneStep: stepOneStep,
        showSolution: function () {
          function showRemoteSolution() {
            if (
              requestBasicEqAction(
                {
                  intent: "solution",
                  start: state.problem.startEquation,
                  history: state.history,
                },
                function (remote) {
                  showEqSolution("פתרון מלא לפי הדרך הנלמדת", {
                    withNotes: true,
                    note: "(אפשר גם לדלג על שלבי ביניים, כל עוד המשוואה שקולה)",
                    footer: "הפתרון: x = " + remote.answer,
                    steps: (remote.steps || []).map(function (s) {
                      return s.eq;
                    }),
                    notes: (remote.steps || []).map(function (s) {
                      return s.explain;
                    }),
                    domain: remote.domain,
                  });
                }
              )
            ) {
              return;
            }
            showEqSolution("פתרון מלא לפי הדרך הנלמדת", {
              withNotes: true,
              note: "(אפשר גם לדלג על שלבי ביניים, כל עוד המשוואה שקולה)",
              footer: "הפתרון: x = " + state.problem.answer,
            });
          }
          if (isDenomServerMode() && domainPending()) {
            requestDomainLcdAction(
              {
                intent: "domain-reveal",
                start: state.problem.startEquation,
                history: state.history,
                domain: denomDomainPayload(),
              },
              function (res) {
                if (res && res.ok) applyDenomServerResult(res);
                showRemoteSolution();
              }
            );
            return;
          }
          if (domainPending()) fillDomainFromButton();
          showRemoteSolution();
        },
      };
    }
    return null;
  }

  function setModeUi() {
    var g = currentGuide();
    if (domainPending()) {
      answerLabelEl.textContent = "תחום הצבה";
      answerLabelEl.classList.add("is-domain");
      var dInfo = state.domain.info;
      var items = domainItems();
      if (items.length > 1) {
        hintEl.textContent =
          "מלאו איזה תא שתרצו — האתר מזהה איזה מכנה זה. התא השני למכנה שנשאר. אנטר בודק.";
      } else if (state.domain.phase === "raw") {
        hintEl.textContent =
          "המשיכו לפתור כמו משוואה (העברת אגף, חילוק במקדם) עד " +
          (dInfo && dInfo.display) +
          ".";
      } else {
        hintEl.textContent =
          "אפשר קודם " +
          ((dInfo && dInfo.rawDisplay) || "x+2≠0") +
          ", ואז " +
          ((dInfo && dInfo.display) || "x≠−2") +
          " — או ישר את הצורה הסופית.";
      }
    } else if (formulaWorkActive() && state.quad) {
      /* renderQuadGuide sets the label and hint */
    } else if (g && g.work) {
      answerLabelEl.textContent = "הצעד הבא";
      answerLabelEl.classList.remove("is-domain");
      hintEl.textContent = g.hintText || MATH_FIELD_HINT;
    } else {
      answerLabelEl.textContent = "התשובה שלך";
      answerLabelEl.classList.remove("is-domain");
      hintEl.textContent = "אפשר לכתוב מספר שלם, שבר כמו 3/4, או עשרוני כמו 0.75";
      answerEl.placeholder = "למשל 5 או 3/4";
    }
    updateDomainBtn();
    renderDomainGuide();
    renderGeoAskUi();
    if (mathField && mathField.setMSlopeEnabled) {
      var slopePack = state.problem && state.problem.geo;
      var slopeFocus =
        slopePack && DoctematicaGeometry.currentFocusTask
          ? DoctematicaGeometry.currentFocusTask(slopePack, state.geo)
          : null;
      var slopePart =
        slopePack && DoctematicaGeometry.currentPartText
          ? DoctematicaGeometry.currentPartText(slopePack, state.geo)
          : null;
      var slopePartIds = (slopePart && slopePart.taskIds) || [];
      var slopeTask = null;
      if (slopeFocus && slopeFocus.kind === "slope") {
        slopeTask = slopeFocus;
      } else if (!slopeFocus) {
        slopeTask =
          slopePack &&
          (slopePack.tasks || []).filter(function (x) {
            if (x.kind !== "slope") return false;
            return !slopePartIds.length || slopePartIds.indexOf(x.id) >= 0;
          })[0];
      }
      if (slopeTask) {
        mathField.setMSlopeEnabled(
          true,
          slopeTask.parallel
            ? String(slopeTask.label || "II")
            : String(slopeTask.from || "A") + String(slopeTask.to || "B")
        );
      } else {
        mathField.setMSlopeEnabled(false);
      }
    }
    if (mathField && mathField.setMDistEnabled) {
      var distPack = state.problem && state.problem.geo;
      var distFocus =
        distPack && DoctematicaGeometry.currentFocusTask
          ? DoctematicaGeometry.currentFocusTask(distPack, state.geo)
          : null;
      var distPart =
        distPack && DoctematicaGeometry.currentPartText
          ? DoctematicaGeometry.currentPartText(distPack, state.geo)
          : null;
      var distPartIds = (distPart && distPart.taskIds) || [];
      var distTask = null;
      if (distFocus && distFocus.kind === "distance") {
        distTask = distFocus;
      } else if (!distFocus || distFocus.kind === "equalLen") {
        distTask =
          distPack &&
          (distPack.tasks || []).filter(function (x) {
            if (x.kind !== "distance") return false;
            if (state.geo && state.geo.done && state.geo.done[x.id]) return false;
            return !distPartIds.length || distPartIds.indexOf(x.id) >= 0;
          })[0];
      }
      if (distTask) {
        mathField.setMDistEnabled(true, String(distTask.from || "A") + String(distTask.to || "B"));
      } else {
        mathField.setMDistEnabled(false);
      }
    }
    if (geoEqSolveActive()) ensureGeoMixedPack();
    updateSplitBtn();
    updateFormulaBtn();
  }

  function markSolved() {
    state.locked = true;
    answerEl.disabled = true;
    state.stats.ok += 1;
    state.streak += 1;
    if (state.streak > state.stats.best) state.stats.best = state.streak;
    saveStats();
    renderStats();
  }

  function nextProblem() {
    state.locked = false;
    mathField.setDisabled(false);
    if (isComingSoon()) {
      state.problem = null;
      state.history = [];
      state.sys = null;
      state.quad = null;
      state.factor = emptyFactorState();
      state.mixed = emptyMixedState();
      state.lcdMarks = {};
      if (quadGuideEl) {
        quadGuideEl.classList.add("hidden");
        quadGuideEl.innerHTML = "";
      }
      if (splitEqsBtn) splitEqsBtn.classList.add("hidden");
      if (useFormulaBtn) useFormulaBtn.classList.add("hidden");
      if (md53Btn) md53Btn.classList.add("hidden");
      if (lcdBtn) lcdBtn.classList.add("hidden");
      clearLcdAssist();
      topicLabelEl.textContent = currentTopicLabel() + " · " + currentLevel().title;
      setModeUi();
      hintBtn.classList.add("hidden");
      oneStepBtn.classList.add("hidden");
      showSolutionBtn.classList.add("hidden");
      eqActions.classList.add("hidden");
      clearGeoUi();
      renderSources();
      renderWorksheetNav();
      renderKinds();
      checkBtn.disabled = true;
      mathWrap.classList.add("hidden");
      mathKeysEl.classList.add("hidden");
      formEl.classList.add("hidden");
      checkBtn.classList.add("hidden");
      answerLabelEl.classList.add("hidden");
      nextAfterSolveBtn.classList.add("hidden");
      feedbackEl.classList.add("hidden");
      modelEl.classList.add("hidden");
      modelEl.innerHTML = "";
      sysGuideEl.classList.add("hidden");
      sysGuideEl.innerHTML = "";
      renderSysKnown();
      promptEl.textContent = currentLevel().instruction;
      renderSteps();
      return;
    }
    showSolutionBtn.classList.remove("hidden");
    eqActions.classList.remove("hidden");
    formEl.classList.remove("hidden");
    if (isWorksheet()) {
      var level = currentLevel();
      if (state.exerciseIndex < 0) state.exerciseIndex = 0;
      if (state.exerciseIndex >= level.exercises.length) {
        state.exerciseIndex = level.exercises.length - 1;
      }
      state.problem = DoctematicaContent.problem(level.id, state.exerciseIndex);
    } else {
      state.problem = DoctematicaProblems.generate(state.topic, levelEl.value, state.kind);
    }
    if (isSystemMode()) {
      startSystemSession(state.problem);
      state.history = [];
      state.lcdMarks = {};
      state.domain = null;
      state.quad = null;
    } else if (isQuadMode()) {
      state.sys = null;
      state.history = [];
      state.lcdMarks = {};
      state.domain = null;
      startQuadSession();
      clearGeoUi();
    } else if (state.problem && state.problem.mode === "geo-length") {
      state.sys = null;
      state.quad = null;
      state.factor = emptyFactorState();
      state.mixed = emptyMixedState();
      state.lcdMarks = {};
      clearLcdAssist();
      state.domain = null;
      startGeoSession();
    } else {
      state.sys = null;
      state.quad = null;
      state.factor = emptyFactorState();
      state.mixed = emptyMixedState();
      state.sqrtProg = { pos: false, neg: false };
      state.history = isEqWorkMode() ? [state.problem.startEquation] : [];
      state.lcdMarks = {};
      clearLcdAssist();
      resetDomainState(state.problem && state.problem.startEquation);
      clearGeoUi();
      if (isDomainLcdServerMode()) requestDenomSetup();
    }
    topicLabelEl.textContent = isWorksheet()
      ? (state.topic === "equations" ||
        isQuadraticTopic() ||
        isHighPowerTopic() ||
        isAnalyticTopic()
          ? currentTopicLabel() + " · "
          : "") +
        currentLevel().title +
        " · תרגיל " +
        state.problem.n
      : currentTopicLabel();
    setModeUi();
    var guide = currentGuide();
    hintBtn.classList.toggle("hidden", !(guide && guide.buttons));
    oneStepBtn.classList.toggle("hidden", !(guide && guide.buttons));
    renderSources();
    renderWorksheetNav();
    renderKinds();
    checkBtn.disabled = false;
    answerEl.classList.add("sr-only");
    mathField.clear();
    answerEl.value = "";
    answerEl.disabled = false;
    nextAfterSolveBtn.classList.add("hidden");
    feedbackEl.classList.add("hidden");
    promptEl.classList.remove("hidden");
    modelEl.classList.add("hidden");
    modelEl.innerHTML = "";
    if (isSystemMode()) {
      clearGeoUi();
      promptEl.innerHTML = DoctematicaMath.systemHTML(state.problem.eq1, state.problem.eq2);
      renderSysGuide();
      renderSteps();
      return;
    }
    sysGuideEl.classList.add("hidden");
    sysGuideEl.innerHTML = "";
    if (isQuadMode()) {
      clearGeoUi();
      promptEl.innerHTML = DoctematicaMath.toHTML(state.problem.startEquation);
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (state.problem && state.problem.mode === "geo-length") {
      var geoPack = state.problem.geo;
      promptEl.textContent = "";
      promptEl.classList.add("hidden");
      mathKeysEl.classList.remove("hidden");
      mathWrap.classList.remove("hidden");
      checkBtn.classList.remove("hidden");
      answerLabelEl.classList.remove("hidden");
      renderGeoScene(null);
      renderGeoPart();
      renderSteps();
      renderGeoAskUi();
      if (
        !(
          DoctematicaGeometry.lineAsk &&
          DoctematicaGeometry.lineAsk(geoPack, state.geo)
        ) &&
        !(
          DoctematicaGeometry.lineMatchPartActive &&
          DoctematicaGeometry.lineMatchPartActive(geoPack, state.geo)
        )
      ) {
        mathField.focus();
      }
      return;
    }
    clearGeoUi();
    if (quadGuideEl) {
      quadGuideEl.classList.add("hidden");
      quadGuideEl.innerHTML = "";
    }
    renderSysKnown();
    mathWrap.classList.remove("hidden");
    checkBtn.classList.remove("hidden");
    answerLabelEl.classList.remove("hidden");
    if (isStepMode() || isSqrtEqMode() || isHighRootEqMode() || isFactorEqMode() || isMixedEqMode()) {
      promptEl.innerHTML = DoctematicaMath.toHTML(state.problem.startEquation);
      mathKeysEl.classList.remove("hidden");
    } else {
      promptEl.textContent = state.problem.prompt;
      mathKeysEl.classList.add("hidden");
    }
    renderSteps();
    renderLcdGuide();
    mathField.focus();
  }

  if (splitEqsBtn) {
    splitEqsBtn.addEventListener("click", function () {
      doFactorSplit();
    });
  }

  if (useFormulaBtn) {
    useFormulaBtn.addEventListener("click", function () {
      if (!canUseMixedFormula()) {
        showFeedback(false, "<strong>עוד לא.</strong> קודם סדרו ל־ax²+bx+c=0 (קודם x², אחר כך x, ואז המספר).");
        return;
      }
      enterMixedFormula();
    });
  }

  if (md53Btn) {
    md53Btn.addEventListener("click", function () {
      if (!canUseMixedFormula()) {
        showFeedback(false, "<strong>עוד לא.</strong> קודם סדרו ל־ax²+bx+c=0 (גם אם b=0 או c=0).");
        return;
      }
      enterMixedMd53();
    });
  }

  if (lcdBtn) {
    lcdBtn.addEventListener("click", function () {
      if (!canUseLcdAssist()) {
        showFeedback(false, "<strong>עוד לא.</strong> כרגע אין צורך במכנה משותף, או שכבר התחלתם את השלב.");
        return;
      }
      startLcdAssist();
    });
  }

  if (domainBtn) {
    domainBtn.addEventListener("click", function () {
      if (!domainPending()) return;
      fillDomainFromButton();
    });
  }

  formEl.addEventListener("submit", function (event) {
    event.preventDefault();
    if (state.locked || !state.problem) return;

    if (reasonBoxEl && !reasonBoxEl.classList.contains("hidden")) {
      applyRequiredReason(reasonInput ? reasonInput.value : "");
      return;
    }

    if (isSystemMode()) {
      handleSystemSubmit();
      return;
    }

    if (isQuadMode()) {
      handleQuadSubmit();
      return;
    }

    if (isMixedEqMode()) {
      if (domainPending()) {
        tryApplyDomainTyped(typedAnswer());
        return;
      }
      applyMixedTyped(typedAnswer());
      return;
    }

    if (isSqrtEqMode()) {
      handleSqrtEqSubmit();
      return;
    }

    if (isHighRootEqMode()) {
      applyHighRootTyped(typedAnswer().trim());
      return;
    }

    if (state.problem && state.problem.mode === "geo-length") {
      if (mixedPath() === "formula") {
        handleQuadSubmit();
        return;
      }
      if (mixedPath() === "factor") {
        applyFactorTyped(typedAnswer());
        return;
      }
      if (mixedPath() === "sqrt") {
        applySqrtEqTyped(typedAnswer().trim());
        return;
      }
      if (mixedPath() === "linear") {
        applyLinearTyped(typedAnswer());
        return;
      }
      applyGeoTyped(typedAnswer().trim());
      return;
    }

    if (isFactorEqMode()) {
      applyFactorTyped(typedAnswer());
      return;
    }

    if (isStepMode()) {
      if (isDomainLcdServerMode() && (state.denomSetupPending || state.denomReady === false)) {
        showBasicEqServerUnavailable();
        return;
      }
      if (domainPending()) {
        tryApplyDomainTyped(typedAnswer());
        return;
      }
      if (state.lcd && state.lcd.phase) {
        var typedLcd = typedAnswer().trim();
        if (!typedLcd) {
          handleLcdSubmit();
          return;
        }
      }
      var prevEq = state.history[state.history.length - 1];
      var typedNow = typedAnswer();
      function applyStepVerdict(result) {
        state.stats.try += 1;
        saveStats();
        renderStats();
        if (!result.ok) {
          showFeedback(false, "<strong>עוד לא.</strong> " + result.message);
          return;
        }
        clearLcdAssist();
        state.history.push(String(typedNow || "").trim());
        renderSteps();
        if (result.solved) {
          markSolved();
          mathField.setDisabled(true);
          checkBtn.disabled = true;
          renderSteps();
          nextAfterSolveBtn.classList.remove("hidden");
          showFeedback(true, "<strong>כל הכבוד.</strong> " + result.message);
        } else {
          mathField.clear();
          showFeedback(true, "<strong>צעד חוקי.</strong> " + result.message);
          mathField.focus();
        }
      }
      if (requestBasicEqCheck(prevEq, typedNow, applyStepVerdict)) return;
      applyStepVerdict(DoctematicaAlgebra.checkStep(prevEq, typedNow));
      return;
    }

    var parsed = parseAnswer(typedAnswer());
    var ok = answersMatch(parsed, state.problem);
    state.locked = true;
    answerEl.disabled = true;
    state.stats.try += 1;
    if (ok) {
      state.stats.ok += 1;
      state.streak += 1;
      if (state.streak > state.stats.best) state.stats.best = state.streak;
    } else {
      state.streak = 0;
    }
    saveStats();
    renderStats();
    if (ok) {
      showFeedback(true, "<strong>נכון.</strong> " + state.problem.explain);
    } else {
      showFeedback(
        false,
        "<strong>עוד לא.</strong> התשובה הנכונה היא " +
          state.problem.answer +
          ". " +
          state.problem.explain
      );
    }
  });

  showSolutionBtn.addEventListener("click", function () {
    if (!state.problem) return;
    var g = currentGuide();
    if (g && g.showSolution) g.showSolution();
  });

  hintBtn.addEventListener("click", function () {
    if (!state.problem) return;
    var g = currentGuide();
    if (g && g.hint) g.hint();
  });

  oneStepBtn.addEventListener("click", function () {
    if (state.locked || !state.problem) return;
    var g = currentGuide();
    if (g && g.oneStep) g.oneStep();
  });

  nextAfterSolveBtn.addEventListener("click", function () {
    if (isWorksheet()) {
      var level = currentLevel();
      if (level.exercises && state.exerciseIndex < level.exercises.length - 1) {
        state.exerciseIndex += 1;
        nextProblem();
        return;
      }
      showFeedback(true, "<strong>סיימתם את הרמה.</strong> אפשר לבחור רמה אחרת למעלה.");
      return;
    }
    nextProblem();
  });

  prevExBtn.addEventListener("click", function () {
    var level = currentLevel();
    if (!level.exercises || !level.exercises.length) return;
    state.exerciseIndex = (state.exerciseIndex + level.exercises.length - 1) % level.exercises.length;
    nextProblem();
  });
  nextExBtn.addEventListener("click", function () {
    var level = currentLevel();
    if (!level.exercises || !level.exercises.length) return;
    state.exerciseIndex = (state.exerciseIndex + 1) % level.exercises.length;
    nextProblem();
  });

  if (yesBtn) {
    yesBtn.addEventListener("click", function () {
      applyGeoTyped("כן");
    });
  }
  if (noBtn) {
    noBtn.addEventListener("click", function () {
      applyGeoTyped("לא");
    });
  }
  if (reasonCheckBtn) {
    reasonCheckBtn.addEventListener("click", function () {
      applyRequiredReason(reasonInput ? reasonInput.value : "");
    });
  }

  newBtn.addEventListener("click", nextProblem);
  levelEl.addEventListener("change", nextProblem);

  renderTopics();
  renderSubtopics();
  renderSources();
  renderKinds();
  renderStats();
  nextProblem();
})();
