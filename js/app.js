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
  var nlineBtn = document.getElementById("nline-btn");
  var nlineEl = document.getElementById("number-line");
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
  var modePickEl = document.getElementById("mode-pick");
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
  var fnBoardEl = document.getElementById("fn-board");
  var fnSketchSlot = document.getElementById("fn-sketch-slot");
  var fnBoardHomeNext = fnBoardEl ? fnBoardEl.nextSibling : null;
  var fnDomainsEl = document.getElementById("fn-domains");
  var fnExtremaEl = document.getElementById("fn-extrema");
  var fnAxesEl = document.getElementById("fn-axes");
  var fnChoiceEl = document.getElementById("fn-choice");
  var fnSketch = fnBoardEl && window.DoctematicaFnSketch ? DoctematicaFnSketch.mount(fnBoardEl) : null;
  var geoPartEl = document.getElementById("geo-part");
  var freqTableEl = document.getElementById("freq-table");
  var freqAskEl = document.getElementById("freq-ask");
  var freqAnswerEl = document.getElementById("freq-answer");
  var percentFieldsEl = document.getElementById("percent-fields");
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
  var crumbEl = document.getElementById("crumb");
  var exercisePosEl = document.getElementById("exercise-pos");
  var subJumpEl = document.getElementById("sub-jump");
  var prevSubBtn = document.getElementById("prev-sub");
  var nextSubBtn = document.getElementById("next-sub");
  var topicRailEl = document.getElementById("topic-rail");
  var navToggleBtn = document.getElementById("nav-toggle");
  var homeBtn = document.getElementById("home-btn");
  var navScrim = document.getElementById("nav-scrim");
  var shellMode = "pick";
  var navOpen = false;

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
    streakSeen: {},
    history: [],
    mixed: { path: null },
    lcd: null,
    lcdMarks: {},
    domain: null,
    geo: { done: {} },
    freq: { done: {}, phase: {}, found: {} },
    freqView: null,
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

  function isIneqMode() {
    return !!(state.problem && state.problem.mode === "ineq");
  }

  function isAndMode() {
    return !!(state.problem && state.problem.mode === "ineq-and");
  }

  function isOrMode() {
    return !!(state.problem && state.problem.mode === "ineq-or");
  }

  function isIntervalMode() {
    return isAndMode() || isOrMode();
  }

  function isQuadIneqMode() {
    return !!(state.problem && state.problem.mode === "ineq-quad");
  }

  function quadIneqSnap() {
    var board = window.DoctematicaQuadIneq && DoctematicaQuadIneq.isOpen() ? DoctematicaQuadIneq.snapshot() : { open: false, regions: [], parabola: { open: false } };
    return {
      sign: { open: !!(board.open && board.mode !== "parabola"), regions: board.regions || [] },
      parabola: board.parabola || { open: false },
    };
  }

  function noteQuadIneqPhase(res) {
    if (!isQuadIneqMode() || !res) return;
    state.quadIneq = state.quadIneq || { phase: "zeros" };
    if (res.phase) state.quadIneq.phase = res.phase;
    if (res.roots) state.quadIneq.roots = res.roots;
    if (res.regions) state.quadIneq.regions = res.regions;
    if (res.offerFormula != null) state.offerFormula = !!res.offerFormula;
    if (res.phase === "equation" && !mixedPath()) state.offerFormula = true;
    if (res.rootsFound) state.quadIneq.phase = "signs";
    if (res.canSplit) {
      state.factor = state.factor || emptyFactorState();
      state.factor.canSplit = true;
      updateSplitBtn();
    }
    renderQuadIneqPanel();
    updateFormulaBtn();
  }

  function softenQuadIneqSolve(res) {
    if (!isQuadIneqMode() || !res || !res.solved) return res;
    var next = Object.assign({}, res, { solved: false, rootsFound: true, phase: "signs" });
    var tail = " מצאתם את נקודות האפס. עכשיו אפשר לכתוב את הפתרון, לשרטט פרבולה, או לבדוק סימנים.";
    next.message = (next.message || "") + tail;
    if (next.reason) next.reason = next.reason + tail;
    noteQuadIneqPhase(next);
    return next;
  }

  function renderQuadIneqPanel() {
    if (!window.DoctematicaQuadIneq) return;
    var el = document.getElementById("quad-ineq");
    if (!el) return;
    DoctematicaQuadIneq.mount(el);
    if (!isQuadIneqMode() || !state.quadIneq || state.quadIneq.phase !== "signs") {
      DoctematicaQuadIneq.close();
      return;
    }
    DoctematicaQuadIneq.setModel({ roots: state.quadIneq.roots || [], regions: state.quadIneq.regions || [] });
    DoctematicaQuadIneq.setCommit(checkSignCell);
    if (!DoctematicaQuadIneq.isOpen()) DoctematicaQuadIneq.open("signs");
  }

  function checkSignCell(cell, done) {
    if (equationsCheckBusy) {
      done({ ok: false, field: cell.field, message: "רגע, הבדיקה הקודמת עוד רצה." });
      return;
    }
    requestQuadIneq({
      intent: "sign-check",
      signRow: {
        index: cell.index,
        field: cell.field,
        x: cell.x,
        expr: cell.expr,
        value: cell.value,
        sign: cell.sign,
        from: cell.from,
        to: cell.to,
        fromText: cell.fromText,
        toText: cell.toText,
      },
    }, function (remote) {
      done(remote);
      showFeedback(!!remote.ok, (remote.ok ? "<strong>נכון.</strong> " : "<strong>עוד לא.</strong> ") + siteReasonHTML(remote.message || ""));
    });
  }

  function isParamEqMode() {
    return !!(state.problem && state.problem.mode === "param");
  }

  function eqNotesActive() {
    return isStepMode() || isIntervalMode() || isQuadIneqMode() || (isQuadraticTopic() && !geoEqSolveActive());
  }

  var API_ROOT =
    (typeof window !== "undefined" && window.DOCTEMATICA_API) ||
    (typeof location !== "undefined" && location.protocol === "file:"
      ? "http://127.0.0.1:8787"
      : "");
  var EQUATIONS_URL = API_ROOT + "/api/equations";
  var INTERVALS_URL = API_ROOT + "/api/intervals";
  var QUADRATIC_URL = API_ROOT + "/api/quadratic";
  var QUAD_INEQ_URL = API_ROOT + "/api/quad-ineq";
  var HIGH_POWER_URL = API_ROOT + "/api/high-power";
  var BIQUAD_URL = API_ROOT + "/api/biquad";
  var SYSTEMS_URL = API_ROOT + "/api/systems";
  var GEOMETRY_URL = API_ROOT + "/api/geometry";
  var STATISTICS_URL = API_ROOT + "/api/statistics";
  var PERCENTS_URL = API_ROOT + "/api/percents";
  var FUNCTIONS_URL = API_ROOT + "/api/functions";
  var equationsCheckBusy = false;
  var viewEpoch = 0;

  function isBasicEqServerMode() {
    return (
      (state.topic === "equations" && state.subtopic === "basic" && !geoEqSolveActive()) ||
      isParamEqMode() ||
      isIneqMode()
    );
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
    if (isQuadIneqMode() && (!state.quadIneq || state.quadIneq.phase !== "signs")) return "mixed";
    if (isMixedServerMode() || geoEqSolveActive() || fnQuadSolveActive() || fnFormulaActive()) return "mixed";
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

  function isHighChainServerMode() {
    var level = currentLevel();
    return (
      isHighPowerTopic() &&
      !!level &&
      level.mode === "high-chain" &&
      !geoEqSolveActive()
    );
  }

  function highPowerSubtopic() {
    if (isHighRootServerMode()) return "root";
    if (isHighFactorServerMode()) return "factor";
    if (isHighChainServerMode()) return "chain";
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

  function showServerProcessingError() {
    showFeedback(
      false,
      "<strong>הבדיקה נכשלה.</strong> שגיאה בעיבוד בשרת. זה לא אומר שהשרת כבוי — נסו שוב."
    );
  }
  var showGeometryProcessingError = showServerProcessingError;

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
      subtopic: isParamEqMode() || isIneqMode() ? "basic" : state.subtopic,
      intent: intent,
      start: payload.start,
      history: payload.history,
      previous: payload.previous,
      typed: payload.typed,
    };
    if (state.problem && state.problem.solveFor) body.solveFor = state.problem.solveFor;
    if (state.problem && state.problem.given) body.given = state.problem.given;
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
        if (!res.ok) {
          var httpErr = new Error("equations http " + res.status);
          httpErr.status = res.status;
          throw httpErr;
        }
        return res.json();
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        applyLcdOffer(remote || {});
        onResult(remote || {});
      })
      .catch(function (err) {
        equationsCheckBusy = false;
        if (err && err.status >= 500) showServerProcessingError();
        else showBasicEqServerUnavailable();
      });
    return true;
  }

  function requestIntervals(payload, onResult) {
    if (!isIntervalMode()) return false;
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    var body = {
      intent: payload.intent,
      conds: (state.problem && state.problem.conds) || [],
      op: (state.problem && state.problem.op) || "intersection",
      typed: payload.typed || "",
      history: payload.history || state.history || [],
      drawing: payload.drawing || null,
    };
    fetch(INTERVALS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) {
          var httpErr = new Error("intervals http " + res.status);
          httpErr.status = res.status;
          throw httpErr;
        }
        return res.json();
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        onResult(remote || {});
      })
      .catch(function (err) {
        equationsCheckBusy = false;
        if (err && err.status >= 500) showServerProcessingError();
        else showBasicEqServerUnavailable();
      });
    return true;
  }

  function requestQuadraticAction(payload, onResult) {
    var subtopic = payload.subtopic || quadraticSubtopic();
    if (!subtopic) return false;
    if (equationsCheckBusy) return true;
    if (geoEqSolveActive()) {
      var chain = geoQuadChain();
      payload = Object.assign({}, payload, {
        start: chain.start,
        history: chain.history,
        previous: chain.history.length ? chain.history[chain.history.length - 1] : chain.start,
      });
    }
    if (fnQuadSolveActive() || fnFormulaActive()) {
      var fnChain = fnQuadChain();
      payload = Object.assign({}, payload, {
        subtopic: "mixed",
        start: fnChain.start,
        history: fnChain.history,
        previous: fnChain.start,
      });
    }
    equationsCheckBusy = true;
    var quadIneqCall = isQuadIneqMode();
    var body = {
      topic: quadIneqCall ? "inequalities" : "quadratic",
      subtopic: subtopic,
      intent: payload.intent,
      start: payload.start,
      history: payload.history,
      previous: payload.previous,
      typed: payload.typed,
    };
    if (quadIneqCall) {
      body.engine = "mixed";
      body.ineq = (state.problem && state.problem.startEquation) || "";
    }
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
    fetch(quadIneqCall ? QUAD_INEQ_URL : QUADRATIC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return null; }).then(function (body) {
            var httpErr = new Error("quadratic http " + res.status);
            httpErr.status = res.status;
            httpErr.body = body;
            throw httpErr;
          });
        }
        return res.json();
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        if (remote && remote.offerFormula != null) state.offerFormula = !!remote.offerFormula;
        applyLcdOffer(remote || {});
        onResult(remote || {});
        updateFormulaBtn();
      })
      .catch(function (err) {
        equationsCheckBusy = false;
        if (err && err.body && err.body.message && err.status && err.status < 500) {
          onResult({ ok: false, message: String(err.body.message) });
          updateFormulaBtn();
          return;
        }
        if (err && err.status >= 500) showServerProcessingError();
        else showBasicEqServerUnavailable();
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

  function isGeoExtraPointPage() {
    var id = (state.problem && state.problem.levelId) || state.levelId;
    return (
      id === "geo-segments-1" ||
      id === "geo-triangle-area-1" ||
      id === "geo-rect-area-1" ||
      id === "geo-line-intersect-1" ||
      id === "geo-line-eq-1" ||
      id === "geo-slope-1"
    );
  }

  function isGeoPracticeServerPage() {
    return (
      isGeoPointPage() ||
      isGeoExtraPointPage() ||
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
    if ((isGeoLineMatchPage() || isGeoSummaryPage() || isGeoParallelPage() || isGeoSlopePage()) && kind === "lineMatch") return true;
    if (
      (isGeoLineIntersectPage() || isGeoSummaryPage() || isGeoParallelPage() || isGeoAxisLinesPage() || isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage() || isGeoLineEqPage() || isGeoSlopePage()) &&
      (kind === "lineIntersect" || kind === "rearrange")
    ) {
      return true;
    }
    if ((isGeoLineEqPage() || isGeoParallelPage() || isGeoAxisLinesPage() || isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage() || isGeoSlopePage()) && kind === "lineEq") return true;
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
    if (kind === "lineMatch" && (isGeoLineMatchPage() || isGeoSummaryPage() || isGeoParallelPage() || isGeoSlopePage())) return "line-match";
    if (
      (kind === "lineIntersect" || kind === "rearrange") &&
      (isGeoLineIntersectPage() || isGeoSummaryPage() || isGeoParallelPage() || isGeoAxisLinesPage() || isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage() || isGeoLineEqPage() || isGeoSlopePage())
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
    if (kind === "lineEq" && (isGeoLineEqPage() || isGeoParallelPage() || isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage() || isGeoSlopePage())) {
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
    if (isGeoLineEqPage()) {
      if (focus && isGeoPointKind(focus.kind)) return "points";
      if (focus && (focus.kind === "lineIntersect" || focus.kind === "rearrange")) return "line-intersect";
      if (focus && isGeoAreaKind(focus.kind)) return "areas";
      if (focus && isGeoLengthKind(focus.kind)) return "lengths";
      return "line-eq";
    }
    if (isGeoSlopePage()) {
      if (focus && focus.kind === "lineMatch") return "line-match";
      if (focus && isGeoPointKind(focus.kind)) return "points";
      if (focus && (focus.kind === "lineIntersect" || focus.kind === "rearrange")) return "line-intersect";
      if (focus && focus.kind === "lineEq") return "line-eq";
      if (focus && isGeoAreaKind(focus.kind)) return "areas";
      if (focus && isGeoLengthKind(focus.kind)) return "lengths";
      return "slope";
    }
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
    if (!isGeoLengthMode()) return false;
    if (geoEqSolveActive() && mixedPath()) return false;
    var pack = state.problem && state.problem.geo;
    if (!pack) return false;
    if (
      DoctematicaGeometry.lineMatchPartActive &&
      DoctematicaGeometry.lineMatchPartActive(pack, state.geo)
    ) {
      return isGeoLineMatchPage() || isGeoSummaryPage() || isGeoParallelPage() || isGeoSlopePage();
    }
    var ask = DoctematicaGeometry.lineAsk && DoctematicaGeometry.lineAsk(pack, state.geo);
    if (ask) {
      if (ask.task && isGeoServerKind(ask.task.kind)) {
        /* keep server for parallel yes/no and other migrated asks */
      } else if (
        !((isGeoPointPage() || isGeoExtraPointPage() || isGeoSummaryPage() || isGeoAxisLinesPage() || isGeoMidpointPage() || isGeoPerpPage() || isGeoDistancePage()) && ask.task && isGeoPointKind(ask.task.kind))
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
    var token = viewEpoch;
    var rawBody;
    try {
      var body = {
        topic: "analytic",
        capability: payload.capability || geoServerCapability(payload.kind),
        intent: payload.intent,
        levelId: (state.problem && state.problem.levelId) || state.levelId,
        exerciseId: state.problem && state.problem.exerciseId,
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
      showServerProcessingError();
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
        if (token !== viewEpoch) return;
        try {
          onResult(remote || {});
        } catch (err) {
          showServerProcessingError();
        }
      })
      .catch(function (err) {
        equationsCheckBusy = false;
        if (token !== viewEpoch) return;
        if (err && err.status) showServerProcessingError();
        else showBasicEqServerUnavailable();
      });
    return true;
  }

  function requestSystemsAction(payload, onResult) {
    if (!isSystemMode()) return false;
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    var body = {
      topic:
        state.problem && state.problem.mode === "meet"
          ? "calculus-meet"
          : state.problem && state.problem.mode === "system-elim"
          ? "systems-elim"
          : state.problem && state.problem.mode === "system-arrange"
            ? "systems-arrange"
            : state.problem && state.problem.mode === "system-quad"
              ? "systems-quad"
              : "systems-sub",
      intent: payload.intent,
      eq1: (state.problem && state.problem.eq1) || payload.eq1,
      eq2: (state.problem && state.problem.eq2) || payload.eq2,
      history: payload.history != null ? payload.history : state.history || [],
      choices: payload.choices != null ? payload.choices : (state.sys && state.sys.choices) || [],
    };
    if (payload.typed != null) body.typed = payload.typed;
    if (payload.scale) body.scale = payload.scale;
    if (payload.choice) body.choice = payload.choice;
    if (payload.confirm) body.confirm = true;
    fetch(SYSTEMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) {
          var httpErr = new Error("systems http " + res.status);
          httpErr.status = res.status;
          throw httpErr;
        }
        return res.json();
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        onResult(remote || {});
      })
      .catch(function (err) {
        equationsCheckBusy = false;
        if (err && err.status >= 500) showServerProcessingError();
        else showBasicEqServerUnavailable();
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
      phase: payload.phase,
      letter: payload.letter,
      slots: payload.slots,
      root: payload.root,
      compute: payload.compute,
      md53: payload.md53,
      formulaBranch: payload.formulaBranch,
    };
    if (payload.factor) body.factor = payload.factor;
    fetch(HIGH_POWER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) {
          var httpErr = new Error("high-power http " + res.status);
          httpErr.status = res.status;
          throw httpErr;
        }
        return res.json();
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        onResult(remote || {});
      })
      .catch(function (err) {
        equationsCheckBusy = false;
        if (err && err.status >= 500) showServerProcessingError();
        else showBasicEqServerUnavailable();
      });
    return true;
  }

  function biquadBody(payload) {
    var st = state.factor || emptyFactorState();
    var body = {
      topic: "biquad",
      intent: payload.intent,
      start: payload.start,
      history: payload.history,
      previous: payload.previous,
      typed: payload.typed,
      hintLevel: state.biquadHints || 0,
      factor: {
        split: !!st.split,
        trails: (st.trails || []).map(function (t) {
          return (t || []).map(String);
        }),
      },
      phase: payload.phase,
      letter: payload.letter,
      slots: payload.slots,
      root: payload.root,
      compute: payload.compute,
      md53: payload.md53,
    };
    if (payload.branch != null && payload.branch !== "") body.branch = payload.branch;
    return body;
  }

  function requestBiquadAction(payload, onResult) {
    if (!isBiquadMode()) return false;
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    fetch(BIQUAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(biquadBody(payload)),
    })
      .then(function (res) {
        if (!res.ok) {
          var httpErr = new Error("biquad http " + res.status);
          httpErr.status = res.status;
          throw httpErr;
        }
        return res.json();
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        onResult(remote || {});
      })
      .catch(function (err) {
        equationsCheckBusy = false;
        if (err && err.status >= 500) showServerProcessingError();
        else showBasicEqServerUnavailable();
      });
    return true;
  }

  function applyBiquadFactor(res) {
    if (!res || !res.trails) return;
    state.factor = state.factor || emptyFactorState();
    state.factor.split = true;
    if (res.eqs) state.factor.eqs = res.eqs.slice();
    if (res.solvedFlags) state.factor.solved = res.solvedFlags.slice();
    state.factor.trails = res.trails.map(function (t) {
      return (t || []).slice();
    });
    if (res.heads) state.factor.heads = res.heads.slice();
    state.factor.canSplit = false;
    state.factor.offerFormula = false;
    if (res.split) {
      state.mixed = emptyMixedState();
      state.quad = null;
      hideQuadGuide();
      if (sysKnownEl) {
        sysKnownEl.classList.add("hidden");
        sysKnownEl.innerHTML = "";
      }
      if (solveWrap) solveWrap.classList.remove("is-system");
      updateFormulaBtn();
    }
  }

  function applyBiquadServerResult(shownTyped, res, keepBranch) {
    res = res || {};
    state.biquadOffer = !!res.offerFormula;
    if (res.formulaEq) state.biquadFormulaEq = res.formulaEq;
    if (!res.ok) {
      state.stats.try += 1;
      saveStats();
      renderStats();
      showFeedback(false, "<strong>עוד לא.</strong> " + (res.message || ""));
      return;
    }
    if (shownTyped && res.branch == null && state.history[state.history.length - 1] !== shownTyped) {
      state.history.push(shownTyped);
    }
    applyBiquadFactor(res);
    updateFormulaBtn();
    renderSteps();
    if (res.solved) {
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + (res.message || ""));
      return;
    }
    if (shownTyped) mathField.clear();
    showFeedback(true, siteStepMessage(res.reason, "<strong>נכון.</strong> " + (res.message || "")), "tip");
    if (keepBranch != null && focusBiquadField(keepBranch)) return;
    if (!(state.factor && state.factor.split)) mathField.focus();
  }

  function biquadStartPayload() {
    var prev = lastHistoryEq();
    return {
      start: (state.problem && state.problem.startEquation) || prev,
      history: state.history && state.history.length ? state.history : [prev],
      previous: prev,
    };
  }

  function applyBiquadTyped(typed, sourceBranch) {
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו את הצעד הבא.");
      return false;
    }
    if (equationsCheckBusy) return true;
    if (
      !requestBiquadAction(
        Object.assign({ intent: "check", typed: typed, branch: sourceBranch }, biquadStartPayload()),
        function (res) {
          var keep = null;
          if (res && res.ok) {
            clearBiquadField(sourceBranch);
            if (res.branch != null) clearBiquadField(res.branch);
            if (!res.solved) {
              if (sourceBranch != null && !(res.branchSolved && res.branch === sourceBranch)) keep = sourceBranch;
              else if (res.branch != null && !res.branchSolved) keep = res.branch;
            }
          }
          applyBiquadServerResult(typed, res, keep);
        }
      )
    ) {
      showBasicEqServerUnavailable();
    }
    return true;
  }

  function biquadHint() {
    if (
      !requestBiquadAction(Object.assign({ intent: "hint", branch: biquadChosenBranch() }, biquadStartPayload()), function (res) {
        state.biquadHints = (state.biquadHints || 0) + 1;
        state.biquadOffer = !!res.offerFormula;
        updateFormulaBtn();
        showFeedback(true, "<strong>רמז.</strong> " + (res.hint || res.message || ""), "tip");
      })
    ) {
      showBasicEqServerUnavailable();
    }
  }

  function biquadShowSolution() {
    requestBiquadAction(Object.assign({ intent: "solution" }, biquadStartPayload()), function (remote) {
      showEqSolution("פתרון מלא — משוואה דו־ריבועית", {
        always: true,
        steps: (remote.steps || []).map(function (s) {
          return keepSolutionStep(s);
        }),
        notes: (remote.steps || []).map(function (s) {
          return s.explain || "";
        }),
        withNotes: true,
        footer: remote.answer ? "קבוצת הפתרונות: " + remote.answer : "",
      });
    });
  }

  function biquadOneStep() {
    var pending = biquadPending();
    if (pending.text) {
      applyBiquadTyped(pending.text, pending.branch);
      return;
    }
    if (biquadColumnsOpen() && pending.branch == null) {
      showFeedback(true, "<strong>בחרו עמודה.</strong> אפשר להתחיל מכל אחת.", "tip");
      return;
    }
    if (
      !requestBiquadAction(Object.assign({ intent: "one-step", branch: pending.branch }, biquadStartPayload()), function (res) {
        if (!res || res.ok === false) {
          showFeedback(false, "<strong>עוד לא.</strong> " + ((res && res.message) || ""));
          return;
        }
        if (res.enter === "formula" || res.path === "formula") {
          if (state.factor && state.factor.split) {
            showFeedback(true, "<strong>הענפים כבר פתוחים.</strong> המשיכו בכל עמודה.", "tip");
            return;
          }
          beginMixedFormulaFromServer(res, !!res.md53);
          return;
        }
        if (state.factor && state.factor.split && res.branch == null && !res.split) {
          showFeedback(true, "<strong>הענפים כבר פתוחים.</strong> המשיכו בכל עמודה: רשמו את המשוואה של x, או את הפתרון.", "tip");
          return;
        }
        applyBiquadServerResult(res.branch == null ? res.step || "" : "", res, res.branch);
      })
    ) {
      showBasicEqServerUnavailable();
    }
  }

  function enterBiquadFormula(md53) {
    requestBiquadAction(
      Object.assign({ intent: "formula-enter", md53: !!md53 }, biquadStartPayload()),
      function (res) {
        beginMixedFormulaFromServer(res, !!md53);
      }
    );
  }

  function finishBiquadFormula(ans) {
    requestBiquadAction(
      Object.assign({ intent: "absorb", typed: ans || "" }, biquadStartPayload()),
      function (res) {
        var keptBranch = state.factor && state.factor.formulaBranch;
        if (keptBranch != null && keptBranch !== "" && state.quad) parkFormulaSession(keptBranch);
        state.mixed = emptyMixedState();
        state.quad = null;
        updateFormulaBtn();
        setModeUi();
        applyBiquadServerResult((res && res.step) || "", res || {});
      }
    );
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
    if (state.topic === "systems-sub") return true;
    return state.topic === "calculus" && !!(state.problem && state.problem.mode === "meet");
  }

  function isSystemQuadMode() {
    if (state.problem && state.problem.mode === "system-quad") return true;
    if (!(state.problem && state.problem.mode === "meet")) return false;
    if (state.offerFormula || state.offerSplit) return true;
    var path = state.mixed && state.mixed.path;
    return path === "formula" || path === "factor";
  }

  function sysQuadFormulaActive() {
    return isSystemQuadMode() && mixedPath() === "formula";
  }

  function sysQuadFactorActive() {
    return isSystemQuadMode() && mixedPath() === "factor";
  }

  function isHighPowerTopic() {
    return state.topic === "high-power";
  }

  function isBiquadMode() {
    return !!(state.problem && state.problem.mode === "biquad");
  }

  function isAnalyticTopic() {
    return state.topic === "analytic";
  }

  function isStatisticsTopic() {
    return state.topic === "statistics";
  }

  function isPercentTopic() {
    return state.topic === "percents";
  }

  function isFreqTableMode() {
    return !!(state.problem && state.problem.mode === "freq-table");
  }

  function isPercentMode() {
    return !!(state.problem && state.problem.mode === "percent");
  }

  function isCalculusTopic() {
    return state.topic === "calculus";
  }

  function isFnMode() {
    return !!(state.problem && state.problem.mode === "fn");
  }

  function emptyFnProgress() {
    return { done: {}, phase: {}, eq: {}, rootKnown: false, axes: {}, regions: {} };
  }

  function emptyFreqProgress() {
    return { done: {}, phase: {}, found: {}, filled: {} };
  }

  function escapeFreqHtml(text) {
    return String(text || "").replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }

  function freqStemHTML(stem) {
    var prose = window.DoctematicaMath && DoctematicaMath.proseHTML
      ? function (text) { return DoctematicaMath.proseHTML(text); }
      : function (text) { return escapeFreqHtml(text); };
    var src = String(stem || "").replace(/\r\n/g, "\n");
    src = src.replace(/[ \t]+((?:III|II|I)\.)(?=\s)/g, "\n$1");
    src = src.replace(/[ \t]+(\(\d+\))(?=\s+\()/g, "\n$1");
    var lead = [];
    var choices = [];
    src.split("\n").forEach(function (line) {
      var trimmed = line.trim();
      var roman = trimmed.match(/^((?:III|II|I)\.)\s+(.+)$/);
      var paren = trimmed.match(/^(\(\d+\))\s+(.+)$/);
      var hit = roman || paren;
      if (hit && hit[2].indexOf("=") >= 0) choices.push({ label: hit[1], eq: hit[2] });
      else if (trimmed) lead.push(trimmed);
    });
    if (!choices.length) return prose(String(stem || ""));
    var html = prose(lead.join(" "));
    html += '<div class="eq-choices">';
    choices.forEach(function (choice) {
      html += '<div class="eq-choice" dir="ltr"><span class="eq-choice-label">' +
        escapeFreqHtml(choice.label) +
        '</span><span class="eq-choice-eq">' +
        prose(choice.eq) +
        "</span></div>";
    });
    html += "</div>";
    return html;
  }

  function clearFreqUi() {
    if (freqTableEl) {
      freqTableEl.classList.add("hidden");
      freqTableEl.innerHTML = "";
    }
    if (freqAnswerEl) {
      freqAnswerEl.classList.add("hidden");
      freqAnswerEl.classList.remove("is-math");
      freqAnswerEl.value = "";
      freqAnswerEl.disabled = false;
    }
    if (freqAskEl) {
      freqAskEl.classList.add("hidden");
      freqAskEl.innerHTML = "";
    }
    if (yesnoAskEl && !isGeoLengthMode()) yesnoAskEl.classList.add("hidden");
    if (modePickEl) {
      modePickEl.classList.add("hidden");
      modePickEl.innerHTML = "";
    }
    if (percentFieldsEl) {
      percentFieldsEl.classList.add("hidden");
      percentFieldsEl.innerHTML = "";
    }
  }

  function splitFracDraft(text) {
    var match = String(text || "").trim().match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (!match) return { num: String(text || "").trim(), den: "" };
    return { num: match[1], den: match[2] };
  }

  function fracEditorValue(edit) {
    if (!edit) return "";
    var num = edit.querySelector('[data-slot="num"]');
    var den = edit.querySelector('[data-slot="den"]');
    var n = num ? String(num.value || "").trim() : "";
    var d = den ? String(den.value || "").trim() : "";
    if (n && d) return n + "/" + d;
    return n || d;
  }

  function appendFracEditor(parent, opts) {
    opts = opts || {};
    var edit = document.createElement("span");
    edit.className = "freq-frac-edit" + (opts.extraClass ? " " + opts.extraClass : "");
    edit.dir = "ltr";
    if (opts.row) edit.setAttribute("data-row", opts.row);
    if (opts.value != null) edit.setAttribute("data-value", String(opts.value));
    if (opts.id) edit.setAttribute("data-id", opts.id);
    var parts = splitFracDraft(opts.draft);
    ["num", "den"].forEach(function (slot) {
      var input = document.createElement("input");
      input.type = "text";
      input.className = "freq-frac-slot";
      input.dir = "ltr";
      input.autocomplete = "off";
      input.setAttribute("data-slot", slot);
      input.setAttribute("inputmode", "decimal");
      input.setAttribute("aria-label", (slot === "num" ? "מונה" : "מכנה") + (opts.label ? " " + opts.label : ""));
      input.placeholder = "□";
      input.value = parts[slot] || "";
      edit.appendChild(input);
    });
    parent.appendChild(edit);
    return edit;
  }

  function readPercentFields() {
    var out = {};
    if (!percentFieldsEl) return out;
    var inputs = percentFieldsEl.querySelectorAll(".percent-field");
    var i;
    for (i = 0; i < inputs.length; i++) out[inputs[i].getAttribute("data-id")] = inputs[i].value;
    var editors = percentFieldsEl.querySelectorAll(".percent-frac-edit");
    for (i = 0; i < editors.length; i++) out[editors[i].getAttribute("data-id")] = fracEditorValue(editors[i]);
    return out;
  }

  function renderPercentFields(fields) {
    if (!percentFieldsEl) return;
    if (!fields || !fields.length) {
      percentFieldsEl.classList.add("hidden");
      percentFieldsEl.innerHTML = "";
      return;
    }
    var prev = readPercentFields();
    percentFieldsEl.innerHTML = "";
    percentFieldsEl.classList.remove("hidden");
    fields.forEach(function (field) {
      var row = document.createElement("label");
      row.className = "percent-field-row";
      var name = document.createElement("span");
      name.textContent = field.label ? field.label + ":" : "";
      row.appendChild(name);
      var shown = field.value != null && String(field.value) ? String(field.value) : (prev[field.id] || "");
      if (field.id === "fraction" && (field.locked || state.locked) && shown && window.DoctematicaMath && DoctematicaMath.toHTML) {
        var lockedFrac = document.createElement("span");
        lockedFrac.className = "percent-frac-locked";
        lockedFrac.innerHTML = DoctematicaMath.toHTML(shown);
        row.appendChild(lockedFrac);
        percentFieldsEl.appendChild(row);
        return;
      }
      if (field.id === "fraction" && !field.locked && !state.locked) {
        appendFracEditor(row, { id: field.id, draft: shown, label: field.label || "שבר", extraClass: "percent-frac-edit" });
        percentFieldsEl.appendChild(row);
        return;
      }
      var input = document.createElement("input");
      input.type = "text";
      input.className = "percent-field";
      input.setAttribute("data-id", field.id);
      input.dir = "ltr";
      input.autocomplete = "off";
      input.value = field.value != null ? String(field.value) : (prev[field.id] || "");
      input.disabled = !!field.locked || !!state.locked;
      row.appendChild(input);
      if (field.unit) {
        var unit = document.createElement("span");
        unit.className = "percent-unit";
        unit.textContent = field.unit;
        row.appendChild(unit);
      }
      percentFieldsEl.appendChild(row);
    });
  }

  function freqColumnOrder(table) {
    if (table && (table.columnOrder === "asc" || table.columnOrder === "given")) return table.columnOrder;
    var list = (table && table.rows) || [];
    if (list.length && list.every(function (row) {
      return row.value != null && String(row.value).trim() !== "" && isFinite(Number(String(row.value).replace(",", ".")));
    })) return "asc";
    return "given";
  }

  function orderFreqRows(table) {
    var list = ((table && table.rows) || []).slice();
    if (freqColumnOrder(table) !== "asc") return list;
    return list.sort(function (a, b) {
      var an = Number(String(a.value).replace(",", "."));
      var bn = Number(String(b.value).replace(",", "."));
      if (isFinite(an) && isFinite(bn) && an !== bn) return an - bn;
      return 0;
    });
  }

  function renderBarChart(chart) {
    var bars = (chart && chart.bars) || [];
    if (!bars.length || !freqTableEl) return;
    var yStep = Number(chart.yStep) || 1;
    var yMax = Number(chart.yMax) || yStep;
    if (!(yMax > 0)) yMax = yStep;
    var plotW = Math.max(280, bars.length * 58);
    var plotH = 210;
    var left = 56;
    var top = 14;
    var bottom = 54;
    var right = 16;
    var width = left + plotW + right;
    var height = top + plotH + bottom;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("class", "bar-chart-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", (chart.yLabel || "שכיחות") + " לפי " + (chart.xLabel || "ערך"));
    function node(name, attrs, text) {
      var el = document.createElementNS("http://www.w3.org/2000/svg", name);
      Object.keys(attrs).forEach(function (key) { el.setAttribute(key, String(attrs[key])); });
      if (text != null) el.textContent = text;
      return el;
    }
    var y0 = top + plotH;
    var steps = Math.max(1, Math.round(yMax / yStep));
    var s;
    for (s = 0; s <= steps; s++) {
      var tick = s * yStep;
      var y = y0 - (tick / yMax) * plotH;
      if (chart.grid !== false) svg.appendChild(node("line", { x1: left, y1: y, x2: left + plotW, y2: y, class: "bar-grid" }));
      svg.appendChild(node("text", { x: left - 8, y: y + 4, class: "bar-tick", "text-anchor": "end" }, String(tick)));
    }
    svg.appendChild(node("line", { x1: left, y1: top, x2: left, y2: y0, class: "bar-axis" }));
    svg.appendChild(node("line", { x1: left, y1: y0, x2: left + plotW, y2: y0, class: "bar-axis" }));
    var slot = plotW / bars.length;
    bars.forEach(function (bar, index) {
      var freq = Number(bar.freq) || 0;
      var h = Math.max(0, Math.min(plotH, (freq / yMax) * plotH));
      var bw = Math.min(34, slot * 0.58);
      var x = left + index * slot + (slot - bw) / 2;
      svg.appendChild(node("rect", { x: x, y: y0 - h, width: bw, height: h, class: "bar-col" }));
      svg.appendChild(node("text", { x: x + bw / 2, y: y0 + 18, class: "bar-tick", "text-anchor": "middle" }, bar.value == null ? "" : String(bar.value)));
    });
    svg.appendChild(node("text", { x: left + plotW / 2, y: height - 12, class: "bar-axis-title", "text-anchor": "middle" }, chart.xLabel || ""));
    svg.appendChild(node("text", {
      x: 18,
      y: top + plotH / 2,
      class: "bar-axis-title",
      "text-anchor": "middle",
      transform: "rotate(-90 18 " + (top + plotH / 2) + ")",
    }, chart.yLabel || ""));
    var wrap = document.createElement("div");
    wrap.className = "bar-chart";
    wrap.setAttribute("dir", "ltr");
    wrap.appendChild(svg);
    freqTableEl.appendChild(wrap);
  }

  function renderPieChart(pie) {
    var sectors = (pie && pie.sectors) || [];
    if (!sectors.length || !freqTableEl) return;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 320 320");
    svg.setAttribute("class", "pie-chart-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "דיאגרמת עיגול");
    var cx = 160;
    var cy = 160;
    var radius = 118;
    var cursor = 0;
    var fills = ["#f4faf6", "#e3f1e8", "#f7fbf8", "#d7ebe0", "#eef6f1", "#cfe4d8"];
    sectors.forEach(function (sector, index) {
      var sweep = Number(sector.angle) || 0;
      var start = cursor;
      var end = cursor + sweep;
      cursor = end;
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pieSlicePath(cx, cy, radius, start, end));
      path.setAttribute("class", "pie-slice");
      path.setAttribute("fill", fills[index % fills.length]);
      svg.appendChild(path);
      var mid = (start + end) / 2;
      var rad = (mid - 90) * Math.PI / 180;
      var labelR = sweep < 32 ? radius * 0.72 : radius * 0.62;
      var lx = cx + labelR * Math.cos(rad);
      var ly = cy + labelR * Math.sin(rad);
      var name = document.createElementNS("http://www.w3.org/2000/svg", "text");
      name.setAttribute("x", String(lx));
      name.setAttribute("y", String(ly - 2));
      name.setAttribute("class", "pie-slice-label");
      name.textContent = sector.label || "";
      svg.appendChild(name);
      var value = document.createElementNS("http://www.w3.org/2000/svg", "text");
      value.setAttribute("x", String(lx));
      value.setAttribute("y", String(ly + 16));
      value.setAttribute("class", "pie-slice-value");
      value.textContent = sector.text || "";
      svg.appendChild(value);
    });
    var wrap = document.createElement("div");
    wrap.className = "pie-chart";
    wrap.setAttribute("dir", "ltr");
    wrap.appendChild(svg);
    freqTableEl.appendChild(wrap);
  }

  function pieSlicePath(cx, cy, radius, start, end) {
    var span = end - start;
    if (span >= 359.9) {
      return "M " + cx + " " + (cy - radius) + " A " + radius + " " + radius + " 0 1 1 " + (cx - 0.01) + " " + (cy - radius) + " Z";
    }
    function point(angle) {
      var rad = (angle - 90) * Math.PI / 180;
      return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
    }
    var a = point(start);
    var b = point(end);
    var large = span > 180 ? 1 : 0;
    return "M " + cx + " " + cy + " L " + a[0] + " " + a[1] + " A " + radius + " " + radius + " 0 " + large + " 1 " + b[0] + " " + b[1] + " Z";
  }

  function renderFreqBoard() {
    if (!freqTableEl) return;
    var problem = state.problem || {};
    var view = state.freqView || {};
    var chart = view.chart || problem.chart || null;
    var table = view.table || null;
    if (!table && !chart) table = problem.table || null;
    var data = view.data || (!chart ? problem.data : null) || null;
    var filling = !!(view.input === "cells" && !state.locked);
    freqTableEl.innerHTML = "";
    if (chart) renderBarChart(chart);
    var pie = view.pie || problem.pie || null;
    if (pie) renderPieChart(pie);
    if (!table && !(data && data.length)) {
      if (chart || pie) freqTableEl.classList.remove("hidden");
      return;
    }
    if (data && data.length) {
      var plain = view.list === "plain";
      if (!plain) {
        var note = document.createElement("p");
        note.className = "freq-note";
        note.textContent = "אפשר ללחוץ על מספר כדי לסמן אותו ככזה שכבר נספר.";
        freqTableEl.appendChild(note);
      }
      var list = document.createElement("div");
      list.className = "freq-data";
      data.forEach(function (item, index) {
        var btn = document.createElement(plain ? "span" : "button");
        if (!plain) btn.type = "button";
        btn.className = plain ? "freq-datum is-plain" : "freq-datum";
        btn.textContent = item == null ? "" : String(item);
        if (!plain) {
          btn.setAttribute("data-index", String(index));
          btn.setAttribute("aria-pressed", state.freqMarks && state.freqMarks[index] ? "true" : "false");
          if (state.freqMarks && state.freqMarks[index]) btn.classList.add("is-struck");
        }
        list.appendChild(btn);
      });
      freqTableEl.appendChild(list);
    }
    var building = !!(view.input === "build" && table && table.build && !state.locked);
    if (building) {
      renderBuildTable(table);
    } else if (table) {
      var grid = document.createElement("table");
      grid.className = "freq-grid";
      grid.setAttribute("dir", "rtl");
      var rows = orderFreqRows(table);
      function addLabel(tr, label) {
        var th = document.createElement("th");
        th.textContent = label || "";
        tr.appendChild(th);
      }
      var head = document.createElement("tr");
      addLabel(head, table.variableLabel);
      rows.forEach(function (row) {
        var th = document.createElement("th");
        th.textContent = row.value == null ? "" : String(row.value);
        head.appendChild(th);
      });
      grid.appendChild(head);
      var freqRow = document.createElement("tr");
      addLabel(freqRow, table.frequencyLabel);
      rows.forEach(function (row) {
        var td = document.createElement("td");
        var value = row.value == null ? "" : String(row.value);
        td.setAttribute("data-row", "freq");
        td.setAttribute("data-value", value);
        if (row.open) {
          var openCell = document.createElement("input");
          openCell.type = "text";
          openCell.className = "freq-cell";
          openCell.setAttribute("dir", "ltr");
          openCell.setAttribute("data-value", value);
          openCell.setAttribute("aria-label", "שכיחות של " + value);
          openCell.autocomplete = "off";
          openCell.value = state.freqDrafts && state.freqDrafts[value] != null ? state.freqDrafts[value] : (row.expr || "");
          td.appendChild(openCell);
        } else if (row.locked || (!filling && row.freq != null)) {
          if (row.freq == null && row.expr) {
            if (window.DoctematicaMath && DoctematicaMath.toHTML) td.innerHTML = DoctematicaMath.toHTML(String(row.expr));
            else td.textContent = String(row.expr);
          } else td.textContent = row.freq == null ? "" : String(row.freq);
          if (row.locked) td.classList.add("is-locked");
        } else if (filling) {
          var input = document.createElement("input");
          input.type = "text";
          input.inputMode = "numeric";
          input.className = "freq-cell";
          input.setAttribute("data-value", value);
          input.setAttribute("aria-label", "שכיחות של " + value);
          input.autocomplete = "off";
          if (state.freqDrafts && state.freqDrafts[value] != null) input.value = state.freqDrafts[value];
          td.appendChild(input);
        }
        freqRow.appendChild(td);
      });
      grid.appendChild(freqRow);
      renderWorkBands(grid);
      appendFreqGrid(grid);
      renderWorkTools();
    }
    freqTableEl.classList.remove("hidden");
    requestAnimationFrame(fitFreqTable);
    if (state.freqCellCursor) {
      var stayed = focusAfterLockedFreqCell(state.freqCellCursor);
      state.freqCellCursor = null;
      if (stayed) return;
    }
    if (building) {
      var openInput = freqTableEl.querySelector(".freq-build-value:not(:disabled), .freq-build-freq:not(:disabled)");
      if (openInput) openInput.focus();
      return;
    }
    if (!filling && !freqTableEl.querySelector(".freq-cell")) return;
    var focusValue = state.freqFocus;
    var again = focusValue != null ? freqTableEl.querySelector('.freq-cell[data-value="' + focusValue + '"]') : null;
    if (again) again.focus();
    else {
      var firstCell = freqTableEl.querySelector(".freq-cell");
      if (firstCell) firstCell.focus();
    }
  }

  function renderBuildTable(table) {
    var columns = (table && table.columns) || [];
    var grid = document.createElement("table");
    grid.className = "freq-grid freq-build";
    grid.setAttribute("dir", "rtl");
    function field(className, value, locked, label) {
      var input = document.createElement("input");
      input.type = "text";
      input.className = className;
      input.value = value == null ? "" : String(value);
      input.autocomplete = "off";
      input.setAttribute("aria-label", label);
      if (locked) input.disabled = true;
      return input;
    }
    var head = document.createElement("tr");
    var varHead = document.createElement("th");
    varHead.textContent = table.variableLabel || "";
    head.appendChild(varHead);
    columns.forEach(function (col, index) {
      var th = document.createElement("th");
      th.className = "freq-build-col";
      th.setAttribute("data-index", String(index));
      if (col.valueLocked) th.classList.add("is-locked");
      var tools = document.createElement("div");
      tools.className = "freq-col-tools";
      [["-1", "ימינה"], ["1", "שמאלה"]].forEach(function (pair) {
        var move = document.createElement("button");
        move.type = "button";
        move.className = "freq-col-move";
        move.setAttribute("data-dir", pair[0]);
        move.textContent = pair[1];
        tools.appendChild(move);
      });
      var del = document.createElement("button");
      del.type = "button";
      del.className = "freq-col-delete";
      del.textContent = "מחיקה";
      tools.appendChild(del);
      th.appendChild(tools);
      th.appendChild(field("freq-build-value", col.value, col.valueLocked, "ערך בעמודה " + (index + 1)));
      head.appendChild(th);
    });
    grid.appendChild(head);
    var freqRow = document.createElement("tr");
    var freqHead = document.createElement("th");
    freqHead.textContent = table.frequencyLabel || "";
    freqRow.appendChild(freqHead);
    columns.forEach(function (col, index) {
      var td = document.createElement("td");
      td.className = "freq-build-col";
      td.setAttribute("data-index", String(index));
      if (col.freqLocked) td.classList.add("is-locked");
      td.appendChild(field(
        "freq-build-freq",
        col.freq,
        col.freqLocked,
        "שכיחות בעמודה " + (index + 1)
      ));
      freqRow.appendChild(td);
    });
    grid.appendChild(freqRow);
    renderWorkBands(grid);
    appendFreqGrid(grid);
    renderWorkTools();
    var add = document.createElement("button");
    add.type = "button";
    add.className = "freq-add-col";
    add.textContent = "הוספת עמודה";
    freqTableEl.appendChild(add);
  }

  function renderWorkBands(grid) {
    var work = (state.freqView && state.freqView.work) || {};
    (work.rows || []).forEach(function (band) {
      var tr = document.createElement("tr");
      var th = document.createElement("th");
      th.textContent = band.label || "";
      if (band.removable && !state.locked) {
        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "freq-remove-row";
        remove.setAttribute("data-row", band.row || "");
        remove.textContent = "הסרה";
        th.appendChild(document.createElement("br"));
        th.appendChild(remove);
      }
      tr.appendChild(th);
      var tableOrder = freqColumnOrder((state.freqView && state.freqView.table) || (state.problem && state.problem.table) || {});
      var bandCells = (band.cells || []).slice();
      if (tableOrder === "asc") {
        bandCells.sort(function (a, b) {
          var an = Number(String(a.value).replace(",", "."));
          var bn = Number(String(b.value).replace(",", "."));
          if (isFinite(an) && isFinite(bn) && an !== bn) return an - bn;
          return 0;
        });
      }
      bandCells.forEach(function (cell) {
        var td = document.createElement("td");
        td.setAttribute("data-row", band.row || "");
        td.setAttribute("data-value", cell.value == null ? "" : String(cell.value));
        if (cell.locked) {
          var lockedText = cell.text || "";
          td.classList.add("is-locked");
          if (lockedText.indexOf("/") >= 0 && window.DoctematicaMath && DoctematicaMath.toHTML) {
            td.innerHTML = DoctematicaMath.toHTML(lockedText);
          } else td.textContent = lockedText;
        } else if (!state.locked && band.row === "relativeFraction") {
          var fracKey = (band.row || "") + ":" + (cell.value == null ? "" : cell.value);
          appendFracEditor(td, {
            row: band.row,
            value: cell.value,
            draft: state.freqWorkDrafts && state.freqWorkDrafts[fracKey],
            label: (band.label || "שבר") + " " + (cell.value == null ? "" : cell.value),
          });
        } else if (!state.locked) {
          var input = document.createElement("input");
          input.type = "text";
          input.className = "freq-work-cell";
          input.dir = "ltr";
          input.autocomplete = "off";
          input.setAttribute("data-row", band.row || "");
          input.setAttribute("data-value", cell.value == null ? "" : String(cell.value));
          input.setAttribute("aria-label", (band.label || "שורה") + " " + (cell.value == null ? "" : cell.value));
          var draftKey = (band.row || "") + ":" + (cell.value == null ? "" : cell.value);
          if (state.freqWorkDrafts && state.freqWorkDrafts[draftKey] != null) input.value = state.freqWorkDrafts[draftKey];
          td.appendChild(input);
        }
        tr.appendChild(td);
      });
      grid.appendChild(tr);
    });
  }

  function renderWorkTools() {
    var work = (state.freqView && state.freqView.work) || {};
    if (!freqTableEl || state.locked || !(work.available || []).length) return;
    var bar = document.createElement("div");
    bar.className = "freq-row-tools";
    var select = document.createElement("select");
    select.className = "freq-add-select";
    select.setAttribute("aria-label", "הוספת שורת שכיחות יחסית");
    var blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "הוספת שורה";
    select.appendChild(blank);
    work.available.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item.row || "";
      option.textContent = item.label || "שורה";
      select.appendChild(option);
    });
    bar.appendChild(select);
    freqTableEl.appendChild(bar);
  }

  function appendFreqGrid(grid) {
    var fit = document.createElement("div");
    fit.className = "freq-fit";
    fit.appendChild(grid);
    freqTableEl.appendChild(fit);
  }

  function fitFreqTable() {
    if (!freqTableEl) return;
    var fit = freqTableEl.querySelector(".freq-fit");
    var grid = fit && fit.querySelector(".freq-grid");
    if (!fit || !grid) return;
    grid.style.transform = "";
    fit.style.height = "";
    var available = freqTableEl.clientWidth;
    var needed = grid.scrollWidth;
    if (!available || needed <= available + 1) return;
    var scale = available / needed;
    grid.style.transform = "scale(" + scale + ")";
    fit.style.height = Math.ceil(grid.offsetHeight * scale) + "px";
  }

  function readBuildColumns() {
    if (!freqTableEl) return ((state.freqView && state.freqView.table && state.freqView.table.columns) || []).slice();
    var values = freqTableEl.querySelectorAll(".freq-build-value");
    var freqs = freqTableEl.querySelectorAll(".freq-build-freq");
    if (!values.length && !freqs.length) {
      return ((state.freqView && state.freqView.table && state.freqView.table.columns) || []).slice();
    }
    var cols = [];
    var i;
    for (i = 0; i < values.length; i++) {
      cols.push({
        value: values[i].value || "",
        freq: freqs[i] ? freqs[i].value || "" : "",
        valueLocked: !!values[i].disabled,
        freqLocked: !!(freqs[i] && freqs[i].disabled),
      });
    }
    return cols;
  }

  function rememberBuildColumns(columns) {
    if (!state.freqView) return;
    state.freqView.table = state.freqView.table || {};
    state.freqView.table.columns = columns;
    state.freqView.table.build = true;
  }

  function submitBuildTable() {
    if (state.locked) return;
    var columns = readBuildColumns();
    rememberBuildColumns(columns);
    if (!requestStatistics({ intent: "check", columns: columns }, applyFreqRemote)) {
      showBasicEqServerUnavailable();
    }
  }

  function freqCellToCheck() {
    var active = document.activeElement;
    if (active && active.classList && active.classList.contains("freq-cell")) return active;
    if (!freqTableEl) return null;
    var inputs = freqTableEl.querySelectorAll(".freq-cell");
    var i;
    for (i = 0; i < inputs.length; i++) {
      if (String(inputs[i].value || "").trim()) return inputs[i];
    }
    return inputs[0] || null;
  }

  function submitWorkCell(input) {
    if (state.locked || !input) return;
    state.freqCellCursor = {
      row: input.getAttribute("data-row") || "",
      value: input.getAttribute("data-value") || "",
    };
    requestStatistics({
      intent: "check",
      fill: { row: input.getAttribute("data-row"), value: input.getAttribute("data-value"), typed: input.value },
    }, applyFreqRemote);
  }

  function freqGridInputs() {
    if (!freqTableEl) return [];
    return Array.prototype.filter.call(freqTableEl.querySelectorAll(".freq-grid input"), function (input) {
      return !input.disabled && (
        input.classList.contains("freq-frac-slot") ||
        input.classList.contains("freq-work-cell") ||
        input.classList.contains("freq-cell") ||
        input.classList.contains("freq-build-value") ||
        input.classList.contains("freq-build-freq")
      );
    });
  }

  function freqInputsIn(cell) {
    return freqGridInputs().filter(function (input) {
      return input.closest("td, th") === cell;
    }).sort(function (a, b) {
      var rank = function (input) {
        return input.classList.contains("freq-frac-slot") && input.getAttribute("data-slot") === "den" ? 1 : 0;
      };
      return rank(a) - rank(b);
    });
  }

  function freqInputAt(rows, rowIndex, colIndex, slot, rowStep, colStep) {
    var guard = 0;
    while (rowIndex >= 0 && rowIndex < rows.length && colIndex >= 0 && guard < 40) {
      guard += 1;
      var row = rows[rowIndex];
      var cell = row && row.cells ? row.cells[colIndex] : null;
      if (cell && colIndex < row.cells.length) {
        var inputs = freqInputsIn(cell);
        if (inputs.length) {
          if (slot < 0) return inputs[inputs.length - 1];
          return inputs[Math.min(slot, inputs.length - 1)];
        }
      }
      if (!rowStep && !colStep) return null;
      rowIndex += rowStep;
      colIndex += colStep;
    }
    return null;
  }

  function focusFreqInput(input, atEnd) {
    input.focus();
    var pos = atEnd ? (input.value || "").length : 0;
    try { input.setSelectionRange(pos, pos); } catch (err) {}
  }

  function focusAfterLockedFreqCell(cursor) {
    var grid = freqTableEl && freqTableEl.querySelector(".freq-grid");
    if (!grid || !cursor) return false;
    var cells = Array.prototype.slice.call(grid.querySelectorAll("td[data-row]"));
    var index = -1;
    var i;
    for (i = 0; i < cells.length; i++) {
      if (cells[i].getAttribute("data-row") === cursor.row && cells[i].getAttribute("data-value") === cursor.value) {
        index = i;
        break;
      }
    }
    if (index < 0) return false;
    var open = cells[index].querySelector("input:not(:disabled)");
    if (open) {
      var sameSlot = cursor.slot ? cells[index].querySelector('input[data-slot="' + cursor.slot + '"]:not(:disabled)') : null;
      focusFreqInput(sameSlot || open, false);
      return true;
    }
    for (i = index + 1; i < cells.length; i++) {
      var next = cells[i].querySelector("input:not(:disabled)");
      if (next) {
        focusFreqInput(next, false);
        return true;
      }
    }
    return false;
  }

  function moveFreqTableFocus(event) {
    var input = event.target;
    var key = event.key;
    if (!input || !input.closest || !input.closest(".freq-grid")) return false;
    if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "ArrowUp" && key !== "ArrowDown") return false;
    if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return false;
    var cell = input.closest("td, th");
    var row = input.closest("tr");
    var grid = input.closest("table");
    if (!cell || !row || !grid) return false;
    var len = (input.value || "").length;
    var atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    var atEnd = input.selectionStart === len && input.selectionEnd === len;
    var rtl = window.getComputedStyle(input).direction === "rtl";
    var leaveLeft = key === "ArrowLeft" && (rtl ? atEnd : atStart);
    var leaveRight = key === "ArrowRight" && (rtl ? atStart : atEnd);
    if ((key === "ArrowLeft" || key === "ArrowRight") && !leaveLeft && !leaveRight) return false;
    var rows = Array.prototype.slice.call(grid.querySelectorAll("tr"));
    var rowIndex = rows.indexOf(row);
    var colIndex = cell.cellIndex;
    var inCell = freqInputsIn(cell);
    var slot = inCell.indexOf(input);
    if (slot < 0) slot = 0;
    var target = null;
    var caretEnd = false;
    if (key === "ArrowDown") {
      caretEnd = false;
      target = slot + 1 < inCell.length
        ? inCell[slot + 1]
        : freqInputAt(rows, rowIndex + 1, colIndex, 0, 1, 0);
    } else if (key === "ArrowUp") {
      caretEnd = true;
      target = slot > 0
        ? inCell[slot - 1]
        : freqInputAt(rows, rowIndex - 1, colIndex, -1, -1, 0);
    } else if (leaveLeft) {
      caretEnd = true;
      target = freqInputAt(rows, rowIndex, colIndex + 1, slot, 0, 1);
    } else if (leaveRight) {
      caretEnd = false;
      target = freqInputAt(rows, rowIndex, colIndex - 1, slot, 0, -1);
    }
    if (!target || target === input) return false;
    event.preventDefault();
    focusFreqInput(target, caretEnd);
    return true;
  }

  function submitFracEdit(edit) {
    if (state.locked || !edit) return;
    var typed = fracEditorValue(edit);
    if (!typed) return;
    var active = document.activeElement;
    state.freqCellCursor = {
      row: edit.getAttribute("data-row") || "",
      value: edit.getAttribute("data-value") || "",
      slot: active && active.getAttribute ? (active.getAttribute("data-slot") || "") : "",
    };
    requestStatistics({
      intent: "check",
      fill: { row: edit.getAttribute("data-row"), value: edit.getAttribute("data-value"), typed: typed },
    }, applyFreqRemote);
  }

  function submitFreqCell(input) {
    if (state.locked) return;
    if (!input) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו שכיחות באחד מתאי הטבלה.");
      return;
    }
    state.freqFocus = input.getAttribute("data-value");
    state.freqDrafts = state.freqDrafts || {};
    state.freqDrafts[state.freqFocus] = input.value;
    if (!requestStatistics({
      intent: "check",
      fill: { value: state.freqFocus, typed: input.value },
    }, applyFreqRemote)) {
      showBasicEqServerUnavailable();
    }
  }

  function syncFreqEntry(view) {
    var board = !!(view && (view.input === "cells" || view.input === "build") && !state.locked);
    var choice = !!(view && view.entry === "choice");
    var showMath = isFreqTableMode() && !board && !choice;
    if (freqAnswerEl) freqAnswerEl.classList.add("hidden");
    if (mathWrap && isFreqTableMode()) mathWrap.classList.toggle("hidden", !showMath);
    if (mathKeysEl && isFreqTableMode()) {
      var meanKeys = !!(view && view.keys === "mean");
      mathKeysEl.classList.toggle("hidden", !showMath);
      mathKeysEl.classList.toggle("is-frac-only", showMath && !meanKeys);
      mathKeysEl.classList.toggle("is-mean-keys", showMath && meanKeys);
    }
    if (answerLabelEl && isFreqTableMode()) answerLabelEl.classList.toggle("hidden", board);
  }

  function freqPartByLabel(label) {
    var parts = (state.problem && state.problem.parts) || [];
    var i;
    for (i = 0; i < parts.length; i++) {
      if (String(parts[i].label || "") === String(label || "")) return parts[i];
    }
    return null;
  }

  function renderFreqPart(view) {
    if (!geoPartEl) return;
    var part = view && view.part;
    if (!part) {
      geoPartEl.classList.add("hidden");
      geoPartEl.innerHTML = "";
      renderFreqAsk(view);
      return;
    }
    geoPartEl.classList.remove("hidden");
    geoPartEl.innerHTML = "";
    if (part.label) {
      var strong = document.createElement("strong");
      strong.textContent = "סעיף " + part.label;
      geoPartEl.appendChild(strong);
    }
    String(part.text || "").split("\n").forEach(function (line) {
      var div = document.createElement("div");
      if (window.DoctematicaMath && DoctematicaMath.proseHTML) div.innerHTML = DoctematicaMath.proseHTML(line);
      else div.textContent = line;
      geoPartEl.appendChild(div);
    });
    renderFreqAsk(view);
    if (isFreqTableMode()) renderPercentFields(view && view.fields);
  }

  function renderFreqAsk(view) {
    if (!freqAskEl) return;
    var ask = view && !view.solved ? view.ask : "";
    freqAskEl.innerHTML = "";
    if (!ask) {
      freqAskEl.classList.add("hidden");
      return;
    }
    String(ask).split("\n").forEach(function (line) {
      if (!line) return;
      var div = document.createElement("div");
      if (window.DoctematicaMath && DoctematicaMath.proseHTML) div.innerHTML = DoctematicaMath.proseHTML(line);
      else div.textContent = line;
      freqAskEl.appendChild(div);
    });
    freqAskEl.classList.remove("hidden");
  }

  function renderModePick(view) {
    if (!modePickEl) return;
    var show = !!(view && view.entry === "pick" && view.options && view.options.length && !state.locked);
    modePickEl.classList.toggle("hidden", !show);
    if (!show) {
      modePickEl.innerHTML = "";
      return;
    }
    var pressed = {};
    modePickEl.querySelectorAll("button[aria-pressed='true']").forEach(function (btn) {
      pressed[btn.getAttribute("data-value")] = true;
    });
    (view.picked || []).forEach(function (value) { pressed[String(value)] = true; });
    modePickEl.innerHTML = "";
    var note = document.createElement("p");
    note.textContent = "אפשר לבחור ערך אחד או יותר, ואז לבדוק.";
    modePickEl.appendChild(note);
    var row = document.createElement("div");
    row.className = "mode-pick-btns";
    view.options.forEach(function (option) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = option.label;
      btn.setAttribute("data-value", String(option.value));
      var on = !!pressed[String(option.value)];
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.addEventListener("click", function () {
        var next = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", next ? "true" : "false");
      });
      row.appendChild(btn);
    });
    modePickEl.appendChild(row);
  }

  function readModePick() {
    if (!modePickEl) return [];
    var values = [];
    modePickEl.querySelectorAll("button[aria-pressed='true']").forEach(function (btn) {
      values.push(btn.getAttribute("data-value"));
    });
    return values;
  }

  function syncFreqYesNo(view) {
    var show = !!(view && view.input === "yesno" && !state.locked);
    if (yesnoAskEl) yesnoAskEl.classList.toggle("hidden", !show);
    if (yesnoQEl) yesnoQEl.textContent = show ? (view.entry === "choice" ? "בחרו כן או לא." : "אפשר גם לענות כן או לא מיד:") : "";
  }

  function ensureFreqPartHeader(label) {
    if (!label) return;
    var marker = "סעיף:" + label;
    var i;
    for (i = state.history.length - 1; i >= 0; i--) {
      if (isGeoPartHeader(state.history[i])) {
        if (state.history[i] === marker) return;
        break;
      }
    }
    state.history.push(marker);
  }

  function isFreqMathLine(line) {
    var text = String(line || "").trim();
    if (!text || /[א-ת]/.test(text)) return false;
    return /[\d=+·×*]/.test(text);
  }

  function syncFreqAnswerDir() {
    if (!freqAnswerEl) return;
    var text = freqAnswerEl.value || "";
    var math = !/[א-ת]/.test(text) && /[=+·×*.\/]/.test(text);
    freqAnswerEl.classList.toggle("is-math", math);
  }

  function continueFreqMathLine(suffix) {
    var i;
    for (i = state.history.length - 1; i >= 0; i--) {
      var line = state.history[i];
      if (isGeoPartHeader(line)) return false;
      if (!isFreqMathLine(line) || line.indexOf("=") >= 0) return false;
      state.history[i] = line + " = " + suffix;
      return true;
    }
    return false;
  }

  function renderFreqSteps() {
    stepsEl.innerHTML = "";
    if (!state.history.length) {
      stepsEl.classList.add("hidden");
      return;
    }
    stepsEl.classList.remove("hidden");
    var stepNum = 0;
    state.history.forEach(function (line, index) {
      var li = document.createElement("li");
      var n = document.createElement("span");
      n.className = "n";
      var body = document.createElement("span");
      if (isGeoPartHeader(line)) {
        var plab = geoPartHeaderLabel(line);
        n.textContent = plab || "·";
        var part = freqPartByLabel(plab);
        var text = part && part.text ? part.text : (plab ? "סעיף " + plab : "סעיף");
        if (window.DoctematicaMath && DoctematicaMath.proseHTML) {
          body.innerHTML = DoctematicaMath.proseHTML(String(text).replace(/\n/g, " "));
        } else body.textContent = text;
        li.classList.add("geo-section-row", "geo-part-row");
      } else {
        stepNum += 1;
        n.textContent = String(stepNum);
        if (isFreqMathLine(line) && window.DoctematicaMath && DoctematicaMath.toHTML) {
          body.className = "freq-math-line";
          body.dir = "ltr";
          body.innerHTML = DoctematicaMath.toHTML(line);
        } else if (window.DoctematicaMath && DoctematicaMath.proseHTML) body.innerHTML = DoctematicaMath.proseHTML(line);
        else body.textContent = line;
      }
      if (state.locked && index === state.history.length - 1 && !isGeoPartHeader(line)) {
        li.classList.add("solved-row");
      }
      li.appendChild(n);
      li.appendChild(body);
      stepsEl.appendChild(li);
    });
  }

  function requestStatistics(payload, onResult) {
    if (!isFreqTableMode()) return false;
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    var body = {
      topic: "statistics",
      capability: "freq-table",
      intent: payload.intent,
      levelId: (state.problem && state.problem.levelId) || state.levelId,
      exerciseId: state.problem && state.problem.exerciseId,
      n: state.problem && state.problem.n,
      exerciseIndex: state.exerciseIndex,
      progress: state.freq || emptyFreqProgress(),
      history: state.history || [],
    };
    if (payload.typed != null) body.typed = payload.typed;
    if (payload.pick) body.pick = payload.pick;
    if (payload.fill) body.fill = payload.fill;
    if (payload.work) body.work = payload.work;
    if (payload.entries) body.entries = payload.entries;
    if (payload.answers) body.answers = payload.answers;
    if (payload.columns) body.columns = payload.columns;
    else if (state.freqView && state.freqView.input === "build") body.columns = readBuildColumns();
    fetch(STATISTICS_URL, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try {
            data = text ? JSON.parse(text) : {};
          } catch (err) {
            data = null;
          }
          if (!res.ok || data == null) throw new Error("statistics");
          return data;
        });
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        try {
          onResult(remote || {});
        } catch (err) {
          showServerProcessingError();
        }
      })
      .catch(function () {
        equationsCheckBusy = false;
        showBasicEqServerUnavailable();
      });
    return true;
  }

  function applyFreqLines(part, lines, joinPrev) {
    (lines || []).forEach(function (line, index) {
      if (!line) return;
      if (part) ensureFreqPartHeader(part);
      if (joinPrev && index === 0 && continueFreqMathLine(line)) return;
      state.history.push(line);
    });
  }

  function applyFreqRemote(remote) {
    var failed = !remote || remote.ok === false;
    var keepBoard = !!(failed && remote && remote.view && remote.view.input === "build");
    if (failed && remote && remote.view && isFreqTableMode()) {
      if (remote.progress) state.freq = remote.progress;
      state.freqView = remote.view;
      if (remote.shows && remote.shows.length) applyFreqLines(remote.part, remote.shows, remote.joinPrev);
      renderFreqBoard();
      renderFreqPart(remote.view);
      renderPercentFields(remote.view.fields);
      renderSteps();
    }
    if (failed && !keepBoard) {
      if (isPercentMode() && remote && remote.view) {
        renderPercentFields(remote.view.fields);
        renderFreqPart(remote.view);
        if (mathField && !mathField.serialize() && percentFieldsEl) {
          var openField = percentFieldsEl.querySelector(".percent-field:not(:disabled)");
          if (openField) openField.focus();
        }
      }
      var bad = remote && remote.message ? remote.message : "נסו שוב.";
      showFeedback(false, "<strong>עוד לא.</strong> " + escapeFreqHtml(bad));
      return;
    }
    if (remote.progress) state.freq = remote.progress;
    if (failed) {
      if (remote.view) {
        state.freqView = remote.view;
        renderFreqBoard();
        renderFreqPart(remote.view);
        syncFreqYesNo(remote.view);
        renderModePick(remote.view);
        syncFreqEntry(remote.view);
      }
      showFeedback(false, "<strong>עוד לא.</strong> " + escapeFreqHtml(remote.message || "נסו שוב."));
      return;
    }
    if (remote.lines && remote.lines.length) {
      remote.lines.forEach(function (line) {
        applyFreqLines(line.part, [line.show], line.joinPrev);
      });
    } else {
      applyFreqLines(remote.part, remote.shows, remote.joinPrev);
    }
    if (remote.view) {
      if (isPercentMode()) {
        state.percentView = remote.view;
        renderPercentFields(remote.view.fields);
        renderFreqPart(remote.view);
      } else {
        if (state.freqDrafts && state.freqFocus) delete state.freqDrafts[state.freqFocus];
        state.freqView = remote.view;
        if (state.freqFocus && remote.view.table && (remote.view.table.rows || []).some(function (row) {
          return String(row.value) === String(state.freqFocus) && row.locked && !row.open;
        })) {
          state.freqCellCursor = { row: "freq", value: String(state.freqFocus) };
        }
        renderFreqBoard();
        renderFreqPart(remote.view);
        syncFreqYesNo(remote.view);
        renderModePick(remote.view);
        syncFreqEntry(remote.view);
      }
    }
    renderSteps();
    if ((remote.shows && remote.shows.length) || (remote.lines && remote.lines.length)) {
      if (isPercentMode() || isFreqTableMode()) mathField.clear();
      else if (freqAnswerEl) freqAnswerEl.value = "";
    }
    if (remote.status === "note") {
      showFeedback(true, escapeFreqHtml(remote.message || ""), "tip");
      return;
    }
    if (remote.status === "solved" || (remote.view && remote.view.solved)) {
      markSolved();
      if (isPercentMode() || isFreqTableMode()) mathField.setDisabled(true);
      else if (freqAnswerEl) freqAnswerEl.disabled = true;
      checkBtn.disabled = true;
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + escapeFreqHtml(remote.message || ""));
      return;
    }
    var prefix = remote.status === "step" || remote.status === "hint" ? "צעד נכון." : "נכון.";
    if (remote.status === "hint") prefix = "רמז.";
    showFeedback(remote.status !== "hint", "<strong>" + prefix + "</strong> " + escapeFreqHtml(remote.message || ""), remote.status === "hint" ? "tip" : "ok");
    if (remote.status !== "hint") {
      var tableHasFocus = freqTableEl && freqTableEl.contains(document.activeElement);
      if (tableHasFocus) return;
      if (isPercentMode() || (isFreqTableMode() && mathWrap && !mathWrap.classList.contains("hidden"))) mathField.focus();
      else if (freqAnswerEl && !freqAnswerEl.classList.contains("hidden")) freqAnswerEl.focus();
    }
  }

  function applyFreqTyped(typed) {
    if (state.locked) return;
    if (!String(typed || "").trim()) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו תשובה.");
      return;
    }
    if (!requestStatistics({ intent: "check", typed: typed }, applyFreqRemote)) {
      showBasicEqServerUnavailable();
    }
  }

  function freqHint() {
    if (!requestStatistics({ intent: "hint" }, applyFreqRemote)) showBasicEqServerUnavailable();
  }

  function freqOneStep() {
    if (!requestStatistics({ intent: "step" }, applyFreqRemote)) showBasicEqServerUnavailable();
  }

  function freqSolution() {
    if (!requestStatistics({ intent: "solution" }, applyFreqRemote)) showBasicEqServerUnavailable();
  }

  function requestPercent(payload, onResult) {
    if (!isPercentMode()) return false;
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    var body = {
      topic: "percents",
      intent: payload.intent,
      levelId: (state.problem && state.problem.levelId) || state.levelId,
      exerciseId: state.problem && state.problem.exerciseId,
      n: state.problem && state.problem.n,
      exerciseIndex: state.exerciseIndex,
      progress: state.freq || { step: "", done: false },
      answers: payload.answers || readPercentFields(),
      history: state.history || [],
    };
    if (payload.typed != null) body.typed = payload.typed;
    fetch(PERCENTS_URL, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try {
            data = text ? JSON.parse(text) : {};
          } catch (err) {
            data = null;
          }
          if (!res.ok || data == null) throw new Error("percents");
          return data;
        });
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        try {
          onResult(remote || {});
        } catch (err) {
          showServerProcessingError();
        }
      })
      .catch(function () {
        equationsCheckBusy = false;
        showBasicEqServerUnavailable();
      });
    return true;
  }

  function applyPercentTyped(typed) {
    if (state.locked) return;
    var answers = readPercentFields();
    var hasFields = percentFieldsEl && !percentFieldsEl.classList.contains("hidden");
    if (!String(typed || "").trim() && !hasFields) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו תשובה.");
      return;
    }
    if (!requestPercent({ intent: "check", typed: typed, answers: answers }, applyFreqRemote)) {
      showBasicEqServerUnavailable();
    }
  }

  function percentHint() {
    if (!requestPercent({ intent: "hint" }, applyFreqRemote)) showBasicEqServerUnavailable();
  }

  function percentOneStep() {
    if (!requestPercent({ intent: "step" }, applyFreqRemote)) showBasicEqServerUnavailable();
  }

  function percentSolution() {
    if (!requestPercent({ intent: "solution" }, applyFreqRemote)) showBasicEqServerUnavailable();
  }

  function requestFunctions(payload, onResult) {
    if (!isFnMode()) return false;
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    var token = viewEpoch;
    var body = {
      intent: payload.intent,
      levelId: (state.problem && state.problem.levelId) || state.levelId,
      exerciseId: state.problem && state.problem.exerciseId,
      n: state.problem && state.problem.n,
      exerciseIndex: state.exerciseIndex,
      progress: payload.progress || (state.fn && state.fn.progress) || emptyFnProgress(),
      history: state.history || [],
    };
    if (payload.typed != null) body.typed = payload.typed;
    if (payload.axis) body.axis = payload.axis;
    if (payload.domains) body.domains = payload.domains;
    if (payload.extrema) body.extrema = payload.extrema;
    if (payload.sketch) body.sketch = payload.sketch;
    if (!body.sketch && state.fnView && state.fnView.family === "free" && fnSketch && fnSketch.getModel) {
      body.sketch = fnSketch.getModel();
    }
    if (payload.point) body.point = payload.point;
    if (payload.probe) body.probe = payload.probe;
    if (payload.branch != null && payload.branch !== "") body.branch = payload.branch;
    if (payload.formulaBranch != null && payload.formulaBranch !== "") body.formulaBranch = payload.formulaBranch;
    if (payload.phase) body.phase = payload.phase;
    if (payload.letter) body.letter = payload.letter;
    if (payload.slots) body.slots = payload.slots;
    if (payload.root) body.root = payload.root;
    if (payload.compute) body.compute = payload.compute;
    if (payload.md53) body.md53 = true;
    if (!body.probe && state.fnView && state.fnView.family === "probe" && fnSketch && fnSketch.getProbe) {
      body.probe = fnSketch.getProbe();
    }
    fetch(FUNCTIONS_URL, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try {
            data = text ? JSON.parse(text) : {};
          } catch (err) {
            data = null;
          }
          if (data == null) throw new Error("functions");
          if (!res.ok) {
            if (data.message && res.status < 500) return Object.assign({ ok: false }, data);
            throw new Error("functions");
          }
          return data;
        });
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        if (token !== viewEpoch) return;
        if (!isFnMode()) {
          hideFnBoardUi();
          return;
        }
        try {
          onResult(remote || {});
        } catch (err) {
          showServerProcessingError();
        }
      })
      .catch(function () {
        equationsCheckBusy = false;
        if (token !== viewEpoch) return;
        showBasicEqServerUnavailable();
        try {
          onResult({ ok: false, unavailable: true });
        } catch (err) { /* the banner already explains the outage */ }
      });
    return true;
  }

  function fnProse(text) {
    if (window.DoctematicaMath && DoctematicaMath.proseHTML) return DoctematicaMath.proseHTML(text);
    return String(text || "");
  }

  function fnDomainPair(line) {
    var bits = String(line || "").replace(/\s+/g, " ").trim().split(/\s*,\s*/);
    var compared = {};
    bits.forEach(function (bit) {
      var found = bit.match(/^(f\(x\)\s*>\s*g\(x\)|f\(x\)\s*<\s*g\(x\))\s*:\s*(.+)$/);
      if (found) compared[found[1].replace(/\s+/g, "")] = found[2].trim();
    });
    if (compared["f(x) > g(x)"] && compared["f(x) < g(x)"]) {
      return [
        { label: "f(x) > g(x)", value: compared["f(x) > g(x)"] },
        { label: "f(x) < g(x)", value: compared["f(x) < g(x)"] },
      ];
    }
    var named = {};
    bits.forEach(function (bit) {
      var match = bit.match(/^(חיובי|שלילי|עולה|יורדת)\s*:\s*(.*)$/);
      if (match) named[match[1]] = match[2].trim();
    });
    if ("חיובי" in named || "שלילי" in named) {
      return [
        { label: "תחומי חיוביות", value: named["חיובי"] || "" },
        { label: "תחומי שליליות", value: named["שלילי"] || "" },
      ];
    }
    if ("עולה" in named || "יורדת" in named) {
      return [
        { label: "תחומי עלייה", value: named["עולה"] || "" },
        { label: "תחומי ירידה", value: named["יורדת"] || "" },
      ];
    }
    return null;
  }

  function domainFamily(line) {
    var text = String(line || "");
    if (/חיובי\s*:|שלילי\s*:/.test(text)) return "sign";
    if (/עולה\s*:|יורדת\s*:/.test(text)) return "mono";
    return "";
  }

  function buildForkCard(card) {
    var li = document.createElement("li");
    li.className = "factor-fork";
    var trails = (card && card.trails) || [];
    li.style.setProperty("--sol-cols", String(trails.length || 1));
    trails.forEach(function (trail, index) {
      var col = document.createElement("div");
      var done = card && card.solved && card.solved[index];
      col.className = "factor-branch" + (done ? " is-done" : "");
      (trail || []).forEach(function (line) {
        var row = document.createElement("div");
        row.className = "factor-branch-step";
        var text = String(line || "");
        row.innerHTML = window.DoctematicaMath ? DoctematicaMath.toHTML(text.replace(/-/g, "−")) : text;
        col.appendChild(row);
      });
      li.appendChild(col);
    });
    return li;
  }

  function renderFnSteps() {
    var followEl = document.getElementById("steps-follow");
    if (followEl) {
      followEl.innerHTML = "";
      followEl.classList.add("hidden");
    }
    stepsEl.innerHTML = "";
    if (!(state.history || []).length) {
      stepsEl.classList.add("hidden");
      return;
    }
    var splitAt = -1;
    var solveMain = solveWrap && solveWrap.querySelector(".solve-main");
    if (solveMain && solveMain.classList.contains("fn-follow")) {
      var partMarks = 0;
      state.history.forEach(function (line, index) {
        if (splitAt >= 0 || !/^§/.test(String(line || ""))) return;
        partMarks += 1;
        if (partMarks === 2) splitAt = index;
      });
    }
    stepsEl.classList.remove("hidden");
    var stepNum = 0;
    var axisCard = 0;
    var sketchCardAt = 0;
    var forkCardAt = 0;
    var formulaCardAt = 0;
    state.history.forEach(function (line, index) {
      var host = splitAt >= 0 && index >= splitAt && followEl ? followEl : stepsEl;
      if (line === "⌘axes") {
        var card = (state.fn && state.fn.axisCards && state.fn.axisCards[axisCard]) || { y: [], x: [] };
        axisCard += 1;
        host.appendChild(buildAxisCard(card));
        return;
      }
      if (line === "⌘sketch") {
        var sketchCard = (state.fn && state.fn.sketchCards && state.fn.sketchCards[sketchCardAt]) || null;
        sketchCardAt += 1;
        host.appendChild(buildSketchCard(sketchCard));
        return;
      }
      if (line === "⌘fork") {
        var forkCard = (state.fn && state.fn.forkCards && state.fn.forkCards[forkCardAt]) || null;
        forkCardAt += 1;
        host.appendChild(buildForkCard(forkCard));
        return;
      }
      if (line && line.parallel) {
        var held = document.createElement("li");
        held.className = "sol-parallel-row";
        held.innerHTML = parallelBlockHTML(line);
        host.appendChild(held);
        return;
      }
      if (line === "⌘formula") {
        var formulaCard = (state.fn && state.fn.formulaCards && state.fn.formulaCards[formulaCardAt]) || [];
        formulaCardAt += 1;
        formulaCard.forEach(function (item) {
          stepNum += 1;
          host.appendChild(formulaTrailRow(item, stepNum));
        });
        return;
      }
      var li = document.createElement("li");
      var n = document.createElement("span");
      n.className = "n";
      var body = document.createElement("span");
      if (isGeoTaskHeader(line)) {
        n.textContent = "▸";
        body.textContent = geoTaskHeaderLabel(line);
        li.classList.add("geo-section-row", "geo-task-row");
      } else if (/^§/.test(String(line || ""))) {
        n.textContent = String(line).slice(1);
        var part = state.fnView && state.fnView.part;
        var parts = (state.problem && state.problem.parts) || [];
        var found = parts.filter(function (item) {
          return item.label === String(line).slice(1);
        })[0];
        body.innerHTML = fnProse((found && found.text) || (part && part.label === String(line).slice(1) ? part.text : ""));
        li.classList.add("geo-section-row", "geo-part-row");
      } else {
        stepNum += 1;
        n.textContent = String(stepNum);
        var domainPair = fnDomainPair(line);
        if (domainPair) {
          body = document.createElement("div");
          body.className = "fn-domain-history";
          domainPair.forEach(function (item) {
            var col = document.createElement("div");
            col.className = "fn-domain-col";
            var title = document.createElement("span");
            title.innerHTML = fnProse(item.label);
            var lines = document.createElement("div");
            lines.className = "fn-domain-lines";
            String(item.value || "").split(/\s+או\s+/).forEach(function (piece) {
              var bit = piece.trim();
              if (!bit) return;
              var value = document.createElement("strong");
              var allPhrase = /^(?:כל|לכל)\s+x$/i.test(bit);
              var math = !allPhrase && /[<>≤≥]/.test(bit) && !/[\u0590-\u05FF]/.test(bit);
              if (allPhrase) {
                value.className = "fn-all-x";
                value.dir = "rtl";
                value.textContent = bit;
              }
              else if (math && window.DoctematicaMath && DoctematicaMath.toHTML) {
                value.dir = "ltr";
                value.innerHTML = DoctematicaMath.toHTML(bit);
              }
              else value.innerHTML = fnProse(bit);
              lines.appendChild(value);
            });
            col.appendChild(title);
            col.appendChild(lines);
            body.appendChild(col);
          });
          li.classList.add("fn-domain-step");
        } else {
          body.innerHTML = /[\u0590-\u05FF]/.test(String(line))
            ? fnProse(line)
            : DoctematicaMath.toHTML(String(line).replace(/-/g, "−"));
        }
        var fnReason = state.fn && state.fn.reasons && state.fn.reasons[index];
        if (fnReason) {
          appendSiteWhy(body, fnReason);
          li.classList.add("has-why");
        }
      }
      li.appendChild(n);
      li.appendChild(body);
      host.appendChild(li);
    });
    if (formulaWorkActive() && state.quad && state.quad.trail && state.quad.trail.length && !formulaSplitOwned() && !formulaAxisOwned()) {
      var liveHost = followEl && followEl.children.length ? followEl : stepsEl;
      state.quad.trail.forEach(function (item) {
        stepNum += 1;
        liveHost.appendChild(formulaTrailRow(item, stepNum));
      });
    }
    if (!stepsEl.children.length) stepsEl.classList.add("hidden");
    if (followEl && followEl.children.length) followEl.classList.remove("hidden");
  }

  function formulaTrailRow(item, num) {
    var li = document.createElement("li");
    var n = document.createElement("span");
    n.className = "n";
    n.textContent = String(num);
    var body = document.createElement("span");
    body.innerHTML = (item && item.html) || "";
    if (item && item.reason) {
      appendSiteWhy(body, item.reason);
      li.classList.add("has-why");
    }
    li.appendChild(n);
    li.appendChild(body);
    return li;
  }

  function formulaAxisOwned() {
    return isFnMode() && state.fn && (state.fn.formulaAxis === "x" || state.fn.formulaAxis === "y");
  }

  function stashFnFormulaTrail() {
    if (!state.quad || !state.quad.trail || !state.quad.trail.length) return;
    if (formulaAxisOwned()) {
      var axis = state.fn.formulaAxis;
      state.fn.axisLive = state.fn.axisLive || emptyAxisLive();
      state.quad.trail.forEach(function (item) {
        state.fn.axisLive[axis].push({ html: item.html || "", why: item.reason || "" });
      });
      return;
    }
    if (isFnMode() && formulaSplitOwned()) {
      var ownedBranch = formulaOwnerIndex();
      if (ownedBranch != null) {
        parkFormulaSession(ownedBranch);
        return;
      }
    }
    state.fn = state.fn || {};
    state.fn.formulaCards = state.fn.formulaCards || [];
    state.fn.formulaCards.push(
      state.quad.trail.map(function (item) {
        return { html: item.html, reason: item.reason || "" };
      })
    );
    state.history.push("⌘formula");
  }

  function placeFnBoard(where) {
    if (!fnBoardEl) return;
    if (where === "work" && fnSketchSlot) {
      if (fnBoardEl.parentNode !== fnSketchSlot) fnSketchSlot.appendChild(fnBoardEl);
      return;
    }
    if (fnBoardEl.parentNode !== solveWrap && solveWrap) {
      if (fnBoardHomeNext && fnBoardHomeNext.parentNode === solveWrap) solveWrap.insertBefore(fnBoardEl, fnBoardHomeNext);
      else solveWrap.insertBefore(fnBoardEl, solveWrap.firstChild);
    }
  }

  function fnServerPart() {
    return (state.fnView && state.fnView.part && state.fnView.part.label) || "";
  }

  function syncFnViewPart(serverPart) {
    if (!state.fn || !serverPart) return;
    state.fn.viewPart = serverPart;
  }

  function fnSketchPartKey() {
    return (state.fn && state.fn.viewPart) || fnServerPart();
  }

  function fnReviewingSketch() {
    var key = fnSketchPartKey();
    var server = fnServerPart();
    return !!(key && server && key !== server);
  }

  function fnViewedPartIndex() {
    var parts = (state.fnView && state.fnView.parts) || [];
    var key = fnSketchPartKey();
    var i;
    for (i = 0; i < parts.length; i++) {
      if (parts[i].label === key) return i;
    }
    return (state.fn && state.fn.progress && state.fn.progress.partIndex) || 0;
  }

  function fnProgressForView() {
    var base = (state.fn && state.fn.progress) || emptyFnProgress();
    if (!fnReviewingSketch()) return base;
    return Object.assign({}, base, { partIndex: fnViewedPartIndex(), taskIndex: 0 });
  }

  function fnSketchHooks(locked) {
    var key = fnSketchPartKey();
    var saved = state.fn && state.fn.partSketches && state.fn.partSketches[key];
    var reviewing = fnReviewingSketch();
    var emptySketch = { points: [], strokes: [], line: null };
    var model = reviewing ? ((saved && saved.model) || emptySketch) : ((state.fn && state.fn.sketch) || emptySketch);
    return {
      model: model,
      undo: saved && saved.undo ? saved.undo : [],
      partKey: key,
      problemKey: (state.problem && state.problem.exerciseId) || "",
      family: (state.fnView && state.fnView.family) || "",
      helperLine: (state.fnView && state.fnView.helperLine) || null,
      allowCheck: !locked && (!state.fnView || !state.fnView.input || state.fnView.input === "sketch"),
      locked: !!locked,
      onCheck: locked || reviewing ? null : submitFnSketch,
      domain: (state.fnView && state.fnView.domain) || null,
      onPoint: function (point, model, done) {
        if (!requestFunctions({ intent: "sketch-point", point: point, sketch: model, progress: fnProgressForView() }, function (remote) {
          if (remote && remote.unavailable) {
            done(false, "הבדיקה לא זמינה כרגע.");
            return;
          }
          done(!!(remote && remote.ok), (remote && remote.message) || "", remote || null);
        })) done(false, "הבדיקה לא זמינה כרגע.");
      },
      onChange: function (model) {
        state.fn = state.fn || { progress: emptyFnProgress() };
        state.fn.partSketches = state.fn.partSketches || {};
        var snap = fnSketch && fnSketch.snapshot ? fnSketch.snapshot() : { model: model, undo: [] };
        if (key) state.fn.partSketches[key] = snap;
        if (!reviewing) state.fn.sketch = snap.model;
      },
    };
  }

  function keptFnSketch() {
    var keptBoard = state.fn && state.fn.sketch;
    var drawn = state.fn && state.fn.sketchDone && keptBoard && (keptBoard.line || (keptBoard.curve && keptBoard.curve.length) || (keptBoard.strokes && keptBoard.strokes.length));
    var view = state.fnView;
    return !!(drawn && view && !view.sketch && !view.figure && !view.reference);
  }

  function renderFnBoard() {
    if (!fnSketch) return;
    var view = state.fnView;
    if (!isFnMode() || !view) {
      placeFnBoard("home");
      fnSketch.hide();
      syncFnFigureLayout();
      renderFnPartNav();
      return;
    }
    if (state.fn && state.fn.sketchArchived) {
      placeFnBoard("home");
      fnSketch.hide();
      syncFnFigureLayout();
      renderFnPartNav();
      return;
    }
    if (view.sketch) {
      placeFnBoard("work");
      syncFnFigureLayout();
      fnSketch.showSketch(fnSketchHooks(false));
      renderFnPartNav();
      return;
    }
    if (keptFnSketch()) {
      placeFnBoard("work");
      syncFnFigureLayout();
      fnSketch.showSketch(fnSketchHooks(true));
      renderFnPartNav();
      return;
    }
    if (view.figure && view.probe) {
      placeFnBoard("work");
      syncFnFigureLayout();
      fnSketch.showFigure(view.figure, {
        probe: view.probe,
        partKey: (view.part && view.part.label) || "",
        problemKey: (state.problem && state.problem.exerciseId) || "",
        onCheck: function () {
          if (!requestFunctions({ intent: "probe-check" }, applyFnRemote)) showBasicEqServerUnavailable();
        },
      });
      renderFnPartNav();
      return;
    }
    if (view.figure && view.reference) {
      placeFnBoard("work");
      syncFnFigureLayout();
      fnSketch.showFigure(view.figure, {
        reference: true,
        model: (state.fn && state.fn.sketch) || { points: [], line: null, refs: [] },
        onChange: function (model) {
          state.fn = state.fn || { progress: emptyFnProgress() };
          state.fn.sketch = model;
        },
      });
      renderFnPartNav();
      return;
    }
    placeFnBoard("home");
    if (state.fn && state.fn.sketch && (state.fn.sketch.refs || []).length) {
      state.fn.sketch = { points: [], line: null, refs: [], curve: [] };
    }
    if (view.figure) fnSketch.showFigure(view.figure);
    else fnSketch.hide();
    syncFnFigureLayout();
    renderFnPartNav();
  }

  function renderFnPartNav() {
    var existing = document.getElementById("fn-part-nav");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }

  function givenSketch(model) {
    return {
      points: ((model && model.points) || []).filter(function (point) {
        return point && point.role === "given";
      }).map(function (point) {
        return { x: point.x, y: point.y, qx: point.qx, qy: point.qy, role: "given" };
      }),
      strokes: [],
      line: null,
    };
  }

  function buildSketchCard(model) {
    var wrap = document.createElement("li");
    wrap.className = "fn-history-sketch";
    if (fnSketch && fnSketch.card) wrap.appendChild(fnSketch.card(model || { points: [], strokes: [] }));
    return wrap;
  }

  function syncFnFigureLayout() {
    var view = state.fnView;
    var figure = !!(isFnMode() && view && view.figure && !view.sketch && !view.reference && !keptFnSketch());
    var sketch = !!(isFnMode() && ((view && (view.sketch || view.reference)) || keptFnSketch()));
    if (solveWrap) {
      solveWrap.classList.toggle("has-fn-figure", figure);
      solveWrap.classList.remove("has-fn-sketch");
      var solveMain = solveWrap.querySelector(".solve-main");
      if (solveMain) {
        var multiSketch = !!(view && view.parts && view.parts.length > 1);
        var follow = sketch && view && view.family === "free" && view.input !== "sketch" && !multiSketch;
        solveMain.classList.toggle("fn-follow", !!follow);
      }
    }
    if (fnBoardEl) {
      fnBoardEl.classList.toggle("is-figure", figure);
      fnBoardEl.classList.toggle("is-sketch", sketch);
    }
  }

  function emptyAxisLive() {
    return { y: [], x: [] };
  }

  function fnAxisHTML(text) {
    var line = String(text || "");
    if (/[\u0590-\u05FF]/.test(line)) return fnProse(line);
    return DoctematicaMath.toHTML(line.replace(/-/g, "−"));
  }

  function fillAxisTrail(trail, steps) {
    trail.innerHTML = "";
    (steps || []).forEach(function (step, i) {
      var row = document.createElement("div");
      row.className = "fn-axis-step";
      var n = document.createElement("span");
      n.className = "n";
      n.textContent = String(i + 1);
      var body = document.createElement("span");
      if (step.parallel && step.parallel.parallel) body.innerHTML = parallelBlockHTML(step.parallel);
      else body.innerHTML = step.html || fnAxisHTML(step.show);
      if (step.why) appendSiteWhy(body, step.why);
      row.appendChild(n);
      row.appendChild(body);
      trail.appendChild(row);
    });
  }

  function buildAxisCard(card) {
    var li = document.createElement("li");
    li.className = "fn-axis-card";
    ["y", "x"].forEach(function (axis) {
      var col = document.createElement("div");
      col.className = "fn-axis-col";
      var title = document.createElement("h3");
      title.textContent = axis === "y" ? "חיתוך עם ציר y" : "חיתוך עם ציר x";
      var trail = document.createElement("div");
      fillAxisTrail(trail, card[axis]);
      col.appendChild(title);
      col.appendChild(trail);
      li.appendChild(col);
    });
    return li;
  }

  function renderFnAxes(on) {
    if (!fnAxesEl) return;
    if (!on) {
      fnAxesEl.classList.add("hidden");
      fnAxesEl.innerHTML = "";
      return;
    }
    if (!fnAxesEl.querySelector(".fn-axis-col")) {
      ["y", "x"].forEach(function (axis) {
        var col = document.createElement("div");
        col.className = "fn-axis-col";
        col.setAttribute("data-col", axis);
        var title = document.createElement("h3");
        title.textContent = axis === "y" ? "חיתוך עם ציר y" : "חיתוך עם ציר x";
        var trail = document.createElement("div");
        trail.className = "fn-axis-trail";
        var input = document.createElement("input");
        input.className = "fn-axis-input";
        input.setAttribute("data-axis", axis);
        input.dir = "ltr";
        input.autocomplete = "off";
        input.placeholder = axis === "y" ? "x = 0" : "המשוואה";
        input.addEventListener("focus", function () {
          state.fn = state.fn || {};
          state.fn.axisFocus = axis;
        });
        input.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            submitFnAxis(axis);
          }
        });
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "fn-axis-check";
        btn.textContent = "בדיקה";
        btn.addEventListener("click", function () {
          submitFnAxis(axis);
        });
        col.appendChild(title);
        col.appendChild(trail);
        col.appendChild(input);
        col.appendChild(btn);
        fnAxesEl.appendChild(col);
      });
    }
    var live = (state.fn && state.fn.axisLive) || emptyAxisLive();
    var done = (state.fn && state.fn.axisDone) || {};
    ["y", "x"].forEach(function (axis) {
      var col = fnAxesEl.querySelector("[data-col='" + axis + "']");
      if (!col) return;
      col.classList.toggle("is-done", !!done[axis]);
      var trail = col.querySelector(".fn-axis-trail");
      fillAxisTrail(trail, live[axis]);
      if (formulaWorkActive() && state.fn && state.fn.formulaAxis === axis && state.quad && state.quad.trail) {
        state.quad.trail.forEach(function (item, i) {
          var row = document.createElement("div");
          row.className = "fn-axis-step";
          var n = document.createElement("span");
          n.className = "n";
          n.textContent = String((live[axis] || []).length + i + 1);
          var body = document.createElement("span");
          body.innerHTML = (item && item.html) || "";
          if (item && item.reason) appendSiteWhy(body, item.reason);
          row.appendChild(n);
          row.appendChild(body);
          trail.appendChild(row);
        });
      }
    });
    fnAxesEl.classList.remove("hidden");
  }

  function focusedFnAxis() {
    var active = document.activeElement;
    if (active && active.getAttribute) {
      var axis = active.getAttribute("data-axis");
      if (axis === "y" || axis === "x") return axis;
    }
    if (state.fn && (state.fn.axisFocus === "y" || state.fn.axisFocus === "x")) return state.fn.axisFocus;
    return "y";
  }

  function submitFnAxis(axis) {
    if (!fnAxesEl) return;
    var input = fnAxesEl.querySelector("input[data-axis='" + axis + "']");
    var text = input ? input.value : "";
    if (!String(text || "").trim()) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו שלב בתיבה.");
      if (input) input.focus();
      return;
    }
    applyFnTyped(text, axis);
  }

  function freezeAxisCard() {
    if (!state.fn) return;
    var live = state.fn.axisLive || emptyAxisLive();
    if ((live.y && live.y.length) || (live.x && live.x.length)) {
      state.fn.axisCards = state.fn.axisCards || [];
      state.fn.axisCards.push({ y: (live.y || []).slice(), x: (live.x || []).slice() });
      state.history.push("⌘axes");
    }
    state.fn.axisLive = emptyAxisLive();
    state.fn.axisDone = { y: false, x: false };
  }

  function archivePendingSketchCard() {
    if (!state.fn || !state.fn.pendingSketchCard) return;
    state.fn.sketchCards = state.fn.sketchCards || [];
    state.fn.sketchCards.push(state.fn.pendingSketchCard);
    state.history.push("⌘sketch");
    state.fn.pendingSketchCard = null;
  }

  function renderFnDomains(fields) {
    if (!fnDomainsEl) return;
    if (!fields || !fields.length) {
      fnDomainsEl.classList.add("hidden");
      fnDomainsEl.innerHTML = "";
      fnDomainsEl.removeAttribute("data-problem");
      fnDomainsEl.removeAttribute("data-sig");
      fnDomainsEl.removeAttribute("data-part");
      return;
    }
    var problemKey = (state.problem && state.problem.exerciseId) || "";
    if (fnDomainsEl.getAttribute("data-problem") !== problemKey) {
      fnDomainsEl.setAttribute("data-problem", problemKey);
      fnDomainsEl.innerHTML = "";
      fnDomainsEl.removeAttribute("data-sig");
      fnDomainsEl.removeAttribute("data-part");
    }
    var partKey = (state.fnView && state.fnView.part && state.fnView.part.label) || "";
    if (fnDomainsEl.getAttribute("data-part") !== partKey) {
      fnDomainsEl.setAttribute("data-part", partKey);
      fnDomainsEl.innerHTML = "";
      fnDomainsEl.removeAttribute("data-sig");
    }
    var sig = fields.map(function (field) {
      var rows = field.rows && field.rows.length ? field.rows : [{ locked: !!field.locked, value: field.locked ? field.value || "" : "" }];
      return field.id + "=" + rows.map(function (row) {
        return (row.locked ? "L" : "o") + (row.locked ? row.value || "" : "");
      }).join(",");
    }).join(";");
    if (fnDomainsEl.getAttribute("data-sig") === sig && !fnDomainsEl.classList.contains("hidden")) {
      fnDomainsEl.querySelectorAll("input[data-domain]").forEach(function (input) {
        if (state.locked) {
          input.disabled = true;
          input.classList.add("is-locked");
        }
      });
      fnDomainsEl.classList.remove("hidden");
      return;
    }
    var kept = {};
    fnDomainsEl.querySelectorAll("input[data-domain]").forEach(function (input) {
      if (input.disabled) return;
      var id = input.getAttribute("data-domain");
      kept[id] = input.value;
    });
    fnDomainsEl.setAttribute("data-sig", sig);
    fnDomainsEl.innerHTML = "";
    fields.forEach(function (field) {
      var column = document.createElement("label");
      var pieces = field.rows && field.rows.length ? field.rows : [{ locked: !!field.locked, value: field.value || "" }];
      var columnLocked = pieces.every(function (piece) { return piece.locked; });
      column.className = "fn-domain-row" + (columnLocked ? " is-locked" : "");
      var title = document.createElement("span");
      title.innerHTML = fnProse(field.label || "");
      column.appendChild(title);
      pieces.forEach(function (piece, index) {
        var input = document.createElement("input");
        input.type = "text";
        input.setAttribute("data-domain", field.id);
        input.dir = "ltr";
        input.autocomplete = "off";
        var lockField = !!piece.locked || !!state.locked;
        if (!lockField) input.placeholder = "x > 3 או אין";
        if (lockField) {
          input.value = piece.value || "";
          input.disabled = true;
          input.classList.add("is-locked");
        } else if (piece.value) input.value = piece.value;
        else if (pieces.length === 1 && kept[field.id]) input.value = kept[field.id];
        input.addEventListener("input", function () {
          var caret = input.selectionStart;
          var polished = String(input.value || "").replace(/<=/g, "≤").replace(/>=/g, "≥");
          if (polished === input.value) return;
          var drop = input.value.length - polished.length;
          input.value = polished;
          var pos = Math.max(0, (caret == null ? polished.length : caret) - drop);
          try { input.setSelectionRange(pos, pos); } catch (err) {}
        });
        if (index > 0) input.classList.add("is-next");
        column.appendChild(input);
      });
      fnDomainsEl.appendChild(column);
    });
    fnDomainsEl.classList.remove("hidden");
    var opened = fnDomainsEl.querySelector("input.is-next:not(:disabled)") || fnDomainsEl.querySelector("input:not(:disabled)");
    if (opened) opened.focus();
  }

  function readFnDomains() {
    var out = {};
    var lists = {};
    if (!fnDomainsEl) return out;
    fnDomainsEl.querySelectorAll("input[data-domain]").forEach(function (input) {
      var id = input.getAttribute("data-domain");
      var value = String(input.value || "").trim();
      if (!value) return;
      lists[id] = lists[id] || [];
      lists[id].push(value);
    });
    Object.keys(lists).forEach(function (id) {
      out[id] = lists[id].join(" או ");
    });
    return out;
  }

  function renderFnExtrema(cards) {
    if (!fnExtremaEl) return;
    if (!cards || !cards.length) {
      fnExtremaEl.classList.add("hidden");
      fnExtremaEl.innerHTML = "";
      fnExtremaEl.removeAttribute("data-problem");
      fnExtremaEl.removeAttribute("data-sig");
      return;
    }
    var problemKey = (state.problem && state.problem.exerciseId) || "";
    if (fnExtremaEl.getAttribute("data-problem") !== problemKey) {
      fnExtremaEl.setAttribute("data-problem", problemKey);
      fnExtremaEl.innerHTML = "";
      fnExtremaEl.removeAttribute("data-sig");
    }
    var sig = cards.map(function (card) {
      return card.id + (card.locked ? "L" + card.x + "," + card.y + "," + card.type : "o");
    }).join(";");
    if (fnExtremaEl.getAttribute("data-sig") === sig && !fnExtremaEl.classList.contains("hidden")) {
      fnExtremaEl.querySelectorAll("input").forEach(function (input) {
        if (state.locked) {
          input.disabled = true;
          input.classList.add("is-locked");
        }
      });
      fnExtremaEl.classList.remove("hidden");
      return;
    }
    var kept = [];
    fnExtremaEl.querySelectorAll(".fn-extremum-card").forEach(function (cardEl, index) {
      var x = cardEl.querySelector("[data-ex-x]");
      var y = cardEl.querySelector("[data-ex-y]");
      var type = cardEl.querySelector("[data-ex-type]");
      if (x && x.disabled) return;
      kept[index] = {
        x: x ? x.value : "",
        y: y ? y.value : "",
        type: type ? type.value : "",
      };
    });
    fnExtremaEl.setAttribute("data-sig", sig);
    fnExtremaEl.innerHTML = "";
    var list = document.createElement("datalist");
    list.id = "fn-extremum-types";
    ["מינימום", "מקסימום"].forEach(function (word) {
      var option = document.createElement("option");
      option.value = word;
      list.appendChild(option);
    });
    fnExtremaEl.appendChild(list);
    cards.forEach(function (card, index) {
      var row = document.createElement("div");
      row.className = "fn-extremum-card" + (card.locked ? " is-locked" : "");
      row.setAttribute("data-ex-id", card.id || String(index));
      var title = document.createElement("span");
      title.className = "fn-extremum-k";
      title.textContent = "נקודה";
      row.appendChild(title);
      var point = document.createElement("span");
      point.className = "fn-extremum-point";
      point.dir = "ltr";
      function field(attr, value, placeholder) {
        var input = document.createElement("input");
        input.type = "text";
        input.setAttribute(attr, "");
        input.dir = "ltr";
        input.autocomplete = "off";
        input.placeholder = placeholder;
        input.value = value || "";
        if (card.locked || state.locked) {
          input.disabled = true;
          input.classList.add("is-locked");
        }
        input.addEventListener("input", function () {
          var caret = input.selectionStart;
          var polished = String(input.value || "").replace(/<=/g, "≤").replace(/>=/g, "≥");
          if (polished === input.value) return;
          var drop = input.value.length - polished.length;
          input.value = polished;
          var pos = Math.max(0, (caret == null ? polished.length : caret) - drop);
          try { input.setSelectionRange(pos, pos); } catch (err) {}
        });
        return input;
      }
      var prior = kept[index] || {};
      if (card.yKnown) {
        point.appendChild(document.createTextNode("("));
        point.appendChild(field("data-ex-x", card.locked ? card.x : prior.x || "", "x"));
        point.appendChild(document.createTextNode(","));
        point.appendChild(field("data-ex-y", card.locked ? card.y : prior.y || "", "y"));
        point.appendChild(document.createTextNode(")"));
      } else {
        var eq = document.createElement("span");
        eq.textContent = "x =";
        point.appendChild(eq);
        point.appendChild(field("data-ex-x", card.locked ? card.x : prior.x || "", "x"));
      }
      row.appendChild(point);
      var kind = document.createElement("span");
      kind.className = "fn-extremum-k";
      kind.textContent = "סוג";
      row.appendChild(kind);
      var type = field("data-ex-type", card.locked ? card.type : prior.type || "", "מינימום או מקסימום");
      type.setAttribute("list", "fn-extremum-types");
      row.appendChild(type);
      fnExtremaEl.appendChild(row);
    });
    fnExtremaEl.classList.remove("hidden");
    var opened = fnExtremaEl.querySelector("input:not(:disabled)");
    if (opened) opened.focus();
  }

  function readFnExtrema() {
    var out = [];
    if (!fnExtremaEl) return out;
    fnExtremaEl.querySelectorAll(".fn-extremum-card").forEach(function (cardEl) {
      var x = cardEl.querySelector("[data-ex-x]");
      var y = cardEl.querySelector("[data-ex-y]");
      var type = cardEl.querySelector("[data-ex-type]");
      out.push({
        x: x ? x.value : "",
        y: y ? y.value : "",
        type: type ? type.value : "",
      });
    });
    return out;
  }

  function renderFnChoice(choices) {
    if (!fnChoiceEl) return;
    if (!choices || !choices.length) {
      fnChoiceEl.classList.add("hidden");
      fnChoiceEl.innerHTML = "";
      return;
    }
    var sig = choices.map(function (item) { return item.id + ":" + item.text; }).join("|");
    if (fnChoiceEl.getAttribute("data-sig") === sig) {
      fnChoiceEl.classList.remove("hidden");
      return;
    }
    fnChoiceEl.setAttribute("data-sig", sig);
    fnChoiceEl.innerHTML = "";
    fnChoiceEl.classList.remove("hidden");
    choices.forEach(function (item) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fn-choice-btn";
      btn.textContent = "(" + item.id + ") " + item.text;
      btn.addEventListener("click", function () {
        applyFnTyped(item.text || String(item.id));
      });
      fnChoiceEl.appendChild(btn);
    });
  }

  function snapshotPolyFork() {
    if (!state.polyForkFields || !state.polyForkFields.length) return;
    state.polyForkDrafts = state.polyForkDrafts || {};
    state.polyForkFields.forEach(function (item) {
      if (!item || !item.field || !item.field.host || !item.field.host.isConnected) return;
      item.field.readInputs();
      var text = item.field.serialize();
      if (!text) {
        delete state.polyForkDrafts[item.index];
        return;
      }
      state.polyForkDrafts[item.index] = JSON.parse(JSON.stringify(item.field.parts));
    });
  }

  function polyForkPending() {
    var fields = state.polyForkFields || [];
    var fallback = null;
    var i;
    for (i = 0; i < fields.length; i++) {
      if (fields[i].field && fields[i].field.readInputs) fields[i].field.readInputs();
      var text = fields[i].field ? fields[i].field.serialize().trim() : "";
      if (!text) continue;
      if (fields[i].index === state.polyForkBranch) return { text: text, branch: fields[i].index };
      if (!fallback) fallback = { text: text, branch: fields[i].index };
    }
    return fallback;
  }

  function assignFormulaBranch() {
    var st = state.factor;
    if (!st || !st.split) return;
    if (st.formulaBranch != null && st.formulaBranch !== "") return;
    var eqs = st.eqs || [];
    var want = String(st.formulaEq || "").replace(/[−–—]/g, "-").replace(/\s+/g, "");
    var i;
    for (i = 0; i < eqs.length; i++) {
      if (want && String(eqs[i] || "").replace(/[−–—]/g, "-").replace(/\s+/g, "") === want) {
        st.formulaBranch = i;
        return;
      }
    }
    for (i = 0; i < eqs.length; i++) {
      if (/\^2|²/.test(String(eqs[i] || "")) && !(st.solved && st.solved[i])) {
        st.formulaBranch = i;
        return;
      }
    }
  }

  function formulaSplitOwned() {
    if (isFnMode() && state.fnView && state.fnView.fork && state.fnView.fork.eqs && state.fnView.fork.eqs.length) return true;
    if (!(state.factor && state.factor.split)) return false;
    if (mixedPath() === "formula" || (state.quad && state.quad.trail && state.quad.trail.length)) assignFormulaBranch();
    return state.factor.formulaBranch != null && state.factor.formulaBranch !== "";
  }

  function formulaOwnerIndex() {
    if (isFnMode() && state.fnFormulaBranch != null && state.fnFormulaBranch !== "") return Number(state.fnFormulaBranch);
    if (state.factor && state.factor.formulaBranch != null && state.factor.formulaBranch !== "") return Number(state.factor.formulaBranch);
    return null;
  }

  function formulaSessions() {
    if (isFnMode()) {
      state.fn = state.fn || {};
      state.fn.branchSessions = state.fn.branchSessions || [];
      return state.fn.branchSessions;
    }
    state.factor = state.factor || emptyFactorState();
    state.factor.sessions = state.factor.sessions || [];
    return state.factor.sessions;
  }

  function parkFormulaSession(index) {
    if (index == null || !state.quad) return;
    formulaSessions()[index] = state.quad;
  }

  function mergeParkedFormula(step) {
    var sessions = state.fn && state.fn.branchSessions;
    if (!sessions || !step || !step.parallel) return;
    step.parallel.forEach(function (col, index) {
      var session = sessions[index];
      if (!session || !session.trail || !session.trail.length || !col) return;
      var steps = (col.steps || []).slice();
      var answerAt = -1;
      var i;
      for (i = 0; i < steps.length; i++) {
        var compact = String(steps[i] || "").replace(/[−–—]/g, "-").replace(/\s+/g, "");
        if (/^[abc]=/.test(compact)) {
          steps.splice(i, 1);
          i -= 1;
          continue;
        }
        if (answerAt < 0 && typeof steps[i] === "string" && isAnsweredRootLine(steps[i])) answerAt = i;
      }
      var htmlSteps = session.trail.map(function (item) {
        return { html: (item && item.html) || "" };
      });
      if (answerAt >= 0 && htmlSteps.length && isAnsweredRootLine(String(htmlSteps[htmlSteps.length - 1].html).replace(/<[^>]+>/g, " "))) {
        htmlSteps = htmlSteps.slice(0, -1);
      }
      if (answerAt < 0) steps = steps.concat(htmlSteps);
      else {
        var head = steps.slice(0, answerAt);
        var tail = steps.slice(answerAt);
        steps = head.concat(htmlSteps, tail);
      }
      var seenAnswers = {};
      col.steps = steps.filter(function (line) {
        if (typeof line === "string" && isAnsweredRootLine(line)) {
          var key = String(line).replace(/[−–—]/g, "-").replace(/\s+/g, "");
          if (seenAnswers[key]) return false;
          seenAnswers[key] = true;
        }
        return true;
      });
    });
  }

  function showFormulaSession(index) {
    var saved = formulaSessions()[index];
    if (!saved) return false;
    state.quad = saved;
    state.mixed = state.mixed || emptyMixedState();
    state.mixed.path = "formula";
    if (isFnMode()) {
      state.fnFormula = true;
      state.fnFormulaBranch = index;
    }
    return true;
  }

  function hideFormulaSessionKeep(index) {
    parkFormulaSession(index);
    state.quad = null;
    if (state.mixed) state.mixed.path = null;
    if (isFnMode()) state.fnFormula = false;
    hideQuadGuide();
  }

  function selectSplitBranch(index) {
    var prev = formulaOwnerIndex();
    if (formulaWorkActive() && prev != null && prev !== index) hideFormulaSessionKeep(prev);
    else if (prev === index && !formulaWorkActive()) showFormulaSession(index);
    state.polyForkBranch = index;
    if (isFnMode()) syncFnAsk();
    renderSteps();
    renderQuadGuide();
    setModeUi();
  }

  function branchFormulaSession(index) {
    if (formulaOwnerIndex() === index && state.quad) return state.quad;
    var sessions = isFnMode() ? (state.fn && state.fn.branchSessions) : (state.factor && state.factor.sessions);
    return (sessions && sessions[index]) || null;
  }

  function renderPolyFork(fork) {
    if (!fnDomainsEl) return;
    var parkedLens = ((state.fn && state.fn.branchSessions) || []).map(function (session) {
      return (session && session.trail && session.trail.length) || 0;
    }).join(",");
    var sig = (fork.eqs || []).join("|") + "#" + (fork.solved || []).join(",") + "#" + (fork.trails || []).map(function (trail) {
      return (trail || []).join("~");
    }).join(",") + "#q" + formulaOwnerIndex() + ":" + parkedLens + ":" + (formulaWorkActive() ? 1 : 0);
    if (fnDomainsEl.getAttribute("data-fork") === sig && fnDomainsEl.classList.contains("is-fork") && !fnDomainsEl.classList.contains("hidden")) return;
    snapshotPolyFork();
    fnDomainsEl.innerHTML = "";
    fnDomainsEl.classList.remove("hidden");
    fnDomainsEl.classList.add("is-fork");
    fnDomainsEl.setAttribute("data-fork", sig);
    state.polyForkFields = [];
    (fork.eqs || []).forEach(function (eq, index) {
      var col = document.createElement("div");
      var done = !!(fork.solved && fork.solved[index]);
      col.className = "factor-branch" + (done ? " is-done" : "");
      col.addEventListener("mousedown", function () {
        selectSplitBranch(index);
      });
      var trail = (fork.trails && fork.trails[index]) || [];
      var title = (fork.heads && fork.heads[index]) || "";
      if (!title && !trail.length) title = eq;
      function sameEq(a, b) {
        return String(a || "").replace(/\s+/g, "") === String(b || "").replace(/\s+/g, "");
      }
      if (title) {
        var head = document.createElement("div");
        head.className = "factor-branch-step";
        head.innerHTML = window.DoctematicaMath ? DoctematicaMath.toHTML(title) : title;
        col.appendChild(head);
      }
      var session = branchFormulaSession(index);
      var formulaTrail = session && session.trail && session.trail.length ? session.trail.slice() : null;
      var laterLines = [];
      function appendForkLine(line) {
        var row = document.createElement("div");
        row.className = "factor-branch-step";
        row.innerHTML = window.DoctematicaMath ? DoctematicaMath.toHTML(line) : line;
        col.appendChild(row);
      }
      trail.forEach(function (line) {
        if (title && sameEq(line, title)) return;
        var compact = String(line || "").replace(/[−–—]/g, "-").replace(/\s+/g, "");
        if (formulaTrail && /^[abc]=/.test(compact)) return;
        if (formulaTrail && (/^\(/.test(compact) || isAnsweredRootLine(line))) {
          if (!laterLines.some(function (have) { return String(have).replace(/[−–—]/g, "-").replace(/\s+/g, "") === compact; })) laterLines.push(line);
          return;
        }
        appendForkLine(line);
      });
      if (formulaTrail && laterLines.some(function (line) { return isAnsweredRootLine(line); })) {
        var lastHtml = String((formulaTrail[formulaTrail.length - 1] && formulaTrail[formulaTrail.length - 1].html) || "").replace(/<[^>]+>/g, "");
        if (isAnsweredRootLine(lastHtml)) formulaTrail = formulaTrail.slice(0, -1);
      }
      if (formulaTrail) {
        formulaTrail.forEach(function (item) {
          var live = document.createElement("div");
          live.className = "factor-branch-step";
          live.innerHTML = (item && item.html) || "";
          col.appendChild(live);
        });
      }
      laterLines.forEach(appendForkLine);
      var formulaHere = formulaWorkActive() && formulaOwnerIndex() === index;
      if (!done && !fork.keepMain && !formulaHere) {
        var host = document.createElement("div");
        host.className = "math-line factor-branch-math";
        host.setAttribute("data-branch", String(index));
        var field = new DoctematicaMathField(host, null, { keyboard: false });
        var draft = state.polyForkDrafts && state.polyForkDrafts[index];
        if (draft && draft.length) field.loadParts(JSON.parse(JSON.stringify(draft)));
        host.addEventListener("focusin", function () {
          selectSplitBranch(index);
          DoctematicaMathField.current = field;
        });
        host.addEventListener("keydown", function (event) {
          if (event.key !== "Enter") return;
          event.preventDefault();
          event.stopPropagation();
          var text = field.serialize().trim();
          if (!text) return;
          if (!requestFunctions({ intent: "check", typed: text, branch: index }, applyFnRemote)) showBasicEqServerUnavailable();
        });
        state.polyForkFields.push({ index: index, field: field });
        col.appendChild(host);
      }
      fnDomainsEl.appendChild(col);
    });
  }

  function syncFnAsk() {
    var ask = state.fnView && state.fnView.ask;
    var sketch = state.fnView && state.fnView.input === "sketch";
    var choice = isFnMode() && state.fnView && state.fnView.input === "choice";
    var fork = isFnMode() && state.fnView && state.fnView.fork && state.fnView.fork.eqs && state.fnView.fork.eqs.length ? state.fnView.fork : null;
    var domainFields = isFnMode() && state.fnView && state.fnView.input === "domains" ? state.fnView.domains : null;
    var extremaCards = isFnMode() && state.fnView && state.fnView.input === "extrema" ? state.fnView.extrema : null;
    if (domainFields && domainFields.length && domainFields.every(function (field) {
      var rows = field.rows && field.rows.length ? field.rows : null;
      if (rows) return rows.every(function (row) { return row.locked; });
      return !!field.locked;
    })) domainFields = null;
    var axisBoard = isFnMode() && state.fnView && state.fnView.input === "axes";
    if (fork && fork.eqs && fork.eqs.length) renderPolyFork(fork);
    else {
      if (fnDomainsEl) {
        fnDomainsEl.classList.remove("is-fork");
        fnDomainsEl.removeAttribute("data-fork");
      }
      state.polyForkFields = [];
      renderFnDomains(domainFields);
    }
    renderFnExtrema(extremaCards);
    renderFnAxes(axisBoard);
    renderFnChoice(choice ? state.fnView.choices : null);
    if (yesnoAskEl) {
      if (ask && ask.stage === "yesno") {
        yesnoAskEl.classList.remove("hidden");
        if (yesnoQEl) yesnoQEl.textContent = ask.question || "ענו כן או לא.";
      } else if (!isGeoLengthMode()) {
        yesnoAskEl.classList.add("hidden");
      }
    }
    var formulaOpen = formulaWorkActive();
    var forkOpen = !!(fork && fork.eqs && fork.eqs.length && !fork.keepMain);
    if (mathWrap) mathWrap.classList.toggle("hidden", !!sketch || !!domainFields || !!extremaCards || !!choice || !!axisBoard || formulaOpen || forkOpen);
    if (mathKeysEl) mathKeysEl.classList.toggle("hidden", !!sketch || !!domainFields || !!extremaCards || !!choice || formulaOpen);
    if (forkOpen && mathKeysEl) mathKeysEl.classList.remove("hidden");
    updateSplitBtn();
    if (answerRowEl && isFnMode()) answerRowEl.classList.toggle("hidden", !!sketch || !!choice || formulaOpen);
    if (answerLabelEl && isFnMode()) {
      answerLabelEl.textContent = domainFields ? (domainFields.length === 1 ? "התחום" : "התחומים") : "הצעד הבא";
      answerLabelEl.classList.toggle("hidden", !!domainFields || !!extremaCards || !!sketch || !!choice || !!axisBoard || forkOpen);
    }
    if (hintEl && state.fnView && state.fnView.hint) hintEl.textContent = state.fnView.hint;
    updateFormulaBtn();
  }

  function renderFnPart() {
    if (!geoPartEl) return;
    var view = state.fnView;
    if (!isFnMode() || !view || !view.part) {
      if (isFnMode()) {
        geoPartEl.classList.add("hidden");
        geoPartEl.innerHTML = "";
      }
      return;
    }
    if (view.part.label) {
      var partMark = "§" + view.part.label;
      if ((state.history || []).indexOf(partMark) < 0) state.history.push(partMark);
      geoPartEl.classList.add("hidden");
      geoPartEl.innerHTML = "";
      return;
    }
    geoPartEl.classList.remove("hidden");
    geoPartEl.innerHTML = fnProse(view.part.text || "");
  }

  function applyFnRemote(remote) {
    if (remote && remote.probeMarkers && fnSketch && fnSketch.setProbeMarkers) {
      state.fn = state.fn || {};
      if (remote.progress) state.fn.progress = remote.progress;
      if (remote.view) state.fnView = remote.view;
      fnSketch.setProbeMarkers(remote.probeMarkers);
      showFeedback(true, fnProse(remote.message || "הישר מוכן."), "tip");
      return;
    }
    if (remote && remote.enter === "formula") {
      state.fn = state.fn || {};
      if (remote.progress) state.fn.progress = remote.progress;
      if (remote.formulaEq) state.fnFormulaEq = remote.formulaEq;
      if (remote.formulaBranch != null) state.fnFormulaBranch = remote.formulaBranch;
      beginMixedFormulaFromServer(remote, !!remote.md53);
      return;
    }
    if (!remote || remote.ok === false) {
      if (remote && remote.progress && remote.view && (remote.view.input === "domains" || remote.view.input === "extrema" || remote.view.family === "probe")) {
        state.fn = state.fn || {};
        state.fn.progress = remote.progress;
        state.fnView = remote.view;
        syncFnAsk();
        renderFnBoard();
        var stayOn = (fnExtremaEl && fnExtremaEl.querySelector("input:not(:disabled)")) || (fnDomainsEl && fnDomainsEl.querySelector("input:not(:disabled)"));
        if (stayOn) stayOn.focus();
      }
      var bad = remote && remote.message ? remote.message : "עוד לא.";
      showFeedback(false, "<strong>עוד לא.</strong> " + fnProse(bad));
      return;
    }
    if (remote.sketch && !remote.show) {
      showFeedback(true, "<strong>רמז.</strong> " + fnProse(remote.hint || "שרטטו את הגרף על מערכת הצירים."), "tip");
      return;
    }
    state.stats.try += 1;
    saveStats();
    renderStats();
    var wasSketch = state.fnView && state.fnView.input === "sketch";
    var partBefore = state.fnView && state.fnView.part && state.fnView.part.label;
    if (remote.progress) {
      state.fn = state.fn || {};
      state.fn.progress = remote.progress;
    }
    if (remote.axis === "y" || remote.axis === "x") {
      state.fn = state.fn || {};
      state.fn.axisLive = state.fn.axisLive || emptyAxisLive();
      var axisWhy = String(remote.message || "").replace(/^נכון\.\s*/, "").trim();
      var axisPrev = state.fn.axisLive[remote.axis].slice(-1)[0];
      var axisPrevText = axisPrev ? (axisPrev.show || String(axisPrev.html || "").replace(/<[^>]+>/g, "")) : "";
      var axisSame = String(axisPrevText).replace(/[−–]/g, "-").replace(/\s+/g, "") === String(remote.show || "").replace(/[−–]/g, "-").replace(/\s+/g, "");
      var axisSplit = remote.parallel && remote.parallel.parallel;
      var axisSameSplit = axisSplit && axisPrev && axisPrev.parallel && parallelKey(axisPrev.parallel) === parallelKey(remote.parallel);
      if (axisSplit) {
        if (!axisSameSplit) {
          state.fn.axisLive[remote.axis].push({
            parallel: remote.parallel,
            why: axisWhy && axisWhy !== "נכון" ? axisWhy : "",
          });
        }
      } else if (!axisSame) {
        state.fn.axisLive[remote.axis].push({
          show: remote.show || "",
          why: axisWhy && axisWhy !== "נכון" ? axisWhy : "",
        });
      }
      if (remote.axisDone) state.fn.axisDone = remote.axisDone;
      if (!(remote.view && remote.view.input === "axes")) {
        if (partBefore && (state.history || []).indexOf("§" + partBefore) < 0) state.history.push("§" + partBefore);
        freezeAxisCard();
      }
      if (remote.view) state.fnView = remote.view;
      if (partBefore && fnServerPart() && partBefore !== fnServerPart()) {
        state.fn = state.fn || {};
        syncFnViewPart(fnServerPart());
        var axisNextMark = "§" + fnServerPart();
        if ((state.history || []).indexOf(axisNextMark) < 0) state.history.push(axisNextMark);
        if (state.fnView && state.fnView.input === "sketch") {
          var axisArrived = state.fn.partSketches && state.fn.partSketches[fnServerPart()];
          state.fn.sketch = axisArrived && axisArrived.model ? axisArrived.model : { points: [], strokes: [], line: null };
          state.fn.sketchArchived = false;
        }
      }
      if (fnAxesEl) {
        var axisBox = fnAxesEl.querySelector("input[data-axis='" + remote.axis + "']");
        if (axisBox) axisBox.value = "";
      }
      renderFnPart();
      renderFnBoard();
      syncFnAsk();
      updateFormulaBtn();
      renderFnSteps();
      if (remote.hint && hintEl) hintEl.textContent = remote.hint;
      if (remote.solved) {
        markSolved();
        syncFnAsk();
        if (mathField) mathField.setDisabled(true);
        checkBtn.disabled = true;
        nextAfterSolveBtn.classList.remove("hidden");
        showFeedback(true, "<strong>כל הכבוד.</strong> " + fnProse(remote.message || "סיימתם את התרגיל."));
        return;
      }
      showFeedback(true, "<strong>נכון.</strong> " + fnProse(remote.message || ""));
      return;
    }
    if (remote.board) {
      state.fn = state.fn || {};
      state.fn.partSketches = state.fn.partSketches || {};
      var nextLabel = remote.view && remote.view.part && remote.view.part.label;
      var sharedParts = remote.view && remote.view.parts && remote.view.parts.length > 1 && remote.view.input === "sketch";
      if (partBefore && nextLabel && partBefore !== nextLabel && sharedParts && wasSketch) {
        var incomingInk = remote.board && ((remote.board.strokes && remote.board.strokes.length) || (remote.board.curve && remote.board.curve.length));
        var finished = incomingInk ? { model: remote.board, undo: [] } : (fnSketch && fnSketch.snapshot ? fnSketch.snapshot() : { model: remote.board, undo: [] });
        state.fn.partSketches[partBefore] = finished;
        state.fn.pendingSketchCard = finished.model;
        var seeded = givenSketch(finished.model);
        if (!seeded.points.length && remote.board && remote.board.points && remote.board.points.length) seeded = remote.board;
        state.fn.sketch = seeded;
        state.fn.partSketches[nextLabel] = { model: seeded, undo: [] };
        state.fn.viewPart = nextLabel;
        state.fn.sketchArchived = false;
      } else if (partBefore && nextLabel && partBefore !== nextLabel && sharedParts && remote.board) {
        state.fn.sketch = remote.board;
        state.fn.partSketches[nextLabel] = { model: remote.board, undo: [] };
        state.fn.viewPart = nextLabel;
        state.fn.sketchArchived = false;
      } else if (wasSketch && partBefore && nextLabel && partBefore !== nextLabel && remote.view && remote.view.keepBoard && remote.board) {
        var keptDrawn = { model: remote.board, undo: [] };
        state.fn.partSketches[partBefore] = keptDrawn;
        state.fn.partSketches[nextLabel] = { model: remote.board, undo: [] };
        state.fn.sketch = remote.board;
        state.fn.viewPart = nextLabel;
        state.fn.sketchArchived = false;
      } else if (wasSketch && partBefore && nextLabel && partBefore !== nextLabel && remote.board && (((remote.board.strokes && remote.board.strokes.length) || (remote.board.curve && remote.board.curve.length)))) {
        state.fn.partSketches[partBefore] = { model: remote.board, undo: [] };
        state.fn.pendingSketchCard = remote.board;
        state.fn.sketchArchived = true;
        state.fn.viewPart = nextLabel;
        state.fn.sketch = { points: [], strokes: [], line: null };
      } else if (wasSketch && remote.solved && partBefore && remote.view && remote.view.parts && remote.view.parts.length > 1) {
        var finishedLast = fnSketch && fnSketch.snapshot ? fnSketch.snapshot() : { model: remote.board, undo: [] };
        var snapshotInk = finishedLast && finishedLast.model && ((finishedLast.model.strokes && finishedLast.model.strokes.length) || (finishedLast.model.curve && finishedLast.model.curve.length) || finishedLast.model.line);
        var solvedInk = remote.board && ((remote.board.strokes && remote.board.strokes.length) || (remote.board.curve && remote.board.curve.length) || remote.board.line);
        if (!snapshotInk && solvedInk) finishedLast = { model: remote.board, undo: [] };
        state.fn.partSketches[partBefore] = finishedLast;
        state.fn.pendingSketchCard = (finishedLast && finishedLast.model) || remote.board;
        state.fn.sketchArchived = true;
      } else if (partBefore && nextLabel && partBefore !== nextLabel) {
        state.fn.partSketches[partBefore] = fnSketch && fnSketch.snapshot ? fnSketch.snapshot() : { model: remote.board, undo: [] };
        state.fn.viewPart = nextLabel;
        var keptNext = state.fn.partSketches[nextLabel];
        state.fn.sketch = keptNext && keptNext.model ? keptNext.model : { points: [], strokes: [], line: null };
      } else {
        state.fn.sketch = remote.board;
        var stay = nextLabel || partBefore;
        if (stay) state.fn.partSketches[stay] = { model: remote.board, undo: [] };
      }
    }
    var sketchBoardDone = !remote.board || remote.board.line || (remote.board.curve && remote.board.curve.length) || (remote.board.strokes && remote.board.strokes.length);
    if (wasSketch && remote.show && sketchBoardDone) {
      state.fn = state.fn || {};
      state.fn.sketchDone = true;
    }
    if (state.fnView && state.fnView.input === "fork") {
      state.polyForkDrafts = {};
      state.polyForkFields = [];
    }
    if (remote.view) state.fnView = remote.view;
    if (!remote.board && partBefore && fnServerPart() && partBefore !== fnServerPart()) {
      state.fn = state.fn || {};
      state.fn.partSketches = state.fn.partSketches || {};
      var finishedSketch = fnSketch && fnSketch.snapshot ? fnSketch.snapshot() : null;
      if (finishedSketch) state.fn.partSketches[partBefore] = finishedSketch;
      var nextParts = state.fnView && state.fnView.parts && state.fnView.parts.length > 1 && state.fnView.input === "sketch";
      if (nextParts && finishedSketch) {
        state.fn.pendingSketchCard = finishedSketch.model;
        var seededNext = givenSketch(finishedSketch.model);
        state.fn.sketch = seededNext;
        state.fn.partSketches[fnServerPart()] = { model: seededNext, undo: [] };
        state.fn.sketchArchived = false;
      } else if (finishedSketch && state.fnView && state.fnView.keepBoard) {
        state.fn.sketch = finishedSketch.model;
        state.fn.sketchArchived = false;
        state.fn.partSketches[fnServerPart()] = finishedSketch;
      } else if (finishedSketch && wasSketch && state.fnView && state.fnView.parts && state.fnView.parts.length > 1 && state.fnView.input !== "sketch") {
        state.fn.pendingSketchCard = finishedSketch.model;
        state.fn.sketchArchived = true;
      } else if (finishedSketch && wasSketch && remote.solved && state.fnView && state.fnView.parts && state.fnView.parts.length > 1) {
        state.fn.pendingSketchCard = finishedSketch.model;
        state.fn.sketchArchived = true;
      } else {
        var arrivedSketch = state.fn.partSketches[fnServerPart()];
        state.fn.sketch = arrivedSketch && arrivedSketch.model ? arrivedSketch.model : { points: [], strokes: [], line: null };
      }
      syncFnViewPart(fnServerPart());
    }
    if (remote.historyFork && remote.historyFork.trails && remote.historyFork.trails.length && !(remote.parallel && remote.parallel.parallel)) {
      state.fn = state.fn || {};
      state.fn.forkCards = state.fn.forkCards || [];
      state.fn.forkCards.push(remote.historyFork);
      state.history.push("⌘fork");
    }
    var liveFork = remote.view && remote.view.fork && remote.view.fork.eqs && remote.view.fork.eqs.length;
    if (remote.parallel && remote.parallel.parallel && !(remote.axis === "y" || remote.axis === "x") && !liveFork && !remote.split) {
      mergeParkedFormula(remote.parallel);
      var partForFork = partBefore;
      if (partForFork) {
        var forkMark = "§" + partForFork;
        if ((state.history || []).indexOf(forkMark) < 0) state.history.push(forkMark);
      }
      ensureFnTaskHeader(remote.heading);
      var forkKind = parallelFamily(remote.parallel);
      var forkKey = parallelKey(remote.parallel);
      var forkAt = -1;
      if (forkKind || forkKey) {
        var forkScan = state.history.length - 1;
        while (forkScan >= 0) {
          var priorFork = state.history[forkScan];
          if (typeof priorFork === "string" && (/^§/.test(priorFork) || priorFork === "⌘sketch" || priorFork === "⌘axes" || isGeoTaskHeader(priorFork))) break;
          if ((forkKey && parallelKey(priorFork) === forkKey) || (forkKind && parallelFamily(priorFork) === forkKind)) {
            forkAt = forkScan;
            break;
          }
          forkScan -= 1;
        }
      }
      if (forkAt >= 0) state.history[forkAt] = remote.parallel;
      else {
        state.history.push(remote.parallel);
        forkAt = state.history.length - 1;
      }
      var forkReason = String(remote.message || "").replace(/^נכון\.\s*/, "").trim();
      if (forkReason && forkReason !== "נכון") {
        state.fn = state.fn || {};
        state.fn.reasons = state.fn.reasons || {};
        state.fn.reasons[forkAt] = forkReason;
      }
      archivePendingSketchCard();
      var nextForkPart = remote.view && remote.view.part && remote.view.part.label;
      if (nextForkPart && nextForkPart !== partBefore) {
        var nextForkMark = "§" + nextForkPart;
        if ((state.history || []).indexOf(nextForkMark) < 0) state.history.push(nextForkMark);
      }
      ensureFnTaskHeader(remote.view && remote.view.pointHeading);
    } else if (remote.show && !liveFork) {
      var partLabel = partBefore;
      if (partLabel) {
        var mark = "§" + partLabel;
        if ((state.history || []).indexOf(mark) < 0) state.history.push(mark);
      }
      ensureFnTaskHeader(remote.heading);
      var domainKind = domainFamily(remote.show);
      var domainAt = -1;
      if (domainKind) {
        var scan = state.history.length - 1;
        while (scan >= 0) {
          var priorLine = String(state.history[scan] || "");
          if (/^§/.test(priorLine) || priorLine === "⌘sketch" || priorLine === "⌘axes" || isGeoTaskHeader(priorLine)) break;
          if (domainFamily(priorLine) === domainKind) {
            domainAt = scan;
            break;
          }
          scan -= 1;
        }
      }
      if (domainAt >= 0) state.history[domainAt] = remote.show;
      else {
        state.history.push(remote.show);
        domainAt = state.history.length - 1;
      }
      var fnReason = String(remote.message || "").replace(/^נכון\.\s*/, "").trim();
      if (fnReason && fnReason !== "נכון") {
        state.fn = state.fn || {};
        state.fn.reasons = state.fn.reasons || {};
        state.fn.reasons[domainAt] = fnReason;
      }
      var nextPart = remote.view && remote.view.part && remote.view.part.label;
      archivePendingSketchCard();
      if (nextPart && nextPart !== partBefore) {
        var nextMark = "§" + nextPart;
        if ((state.history || []).indexOf(nextMark) < 0) state.history.push(nextMark);
      }
      ensureFnTaskHeader(remote.view && remote.view.pointHeading);
    }
    renderFnPart();
    renderFnBoard();
    syncFnAsk();
    renderFnSteps();
    if (remote.hint && hintEl) hintEl.textContent = remote.hint;
    if (mathField && state.fnView && state.fnView.input !== "sketch" && state.fnView.input !== "domains") mathField.clear();
    if (remote.solved) {
      markSolved();
      syncFnAsk();
      if (mathField) mathField.setDisabled(true);
      checkBtn.disabled = true;
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + fnProse(remote.message || "סיימתם את התרגיל."));
      return;
    }
    showFeedback(true, "<strong>נכון.</strong> " + fnProse(remote.message || ""));
    updateFormulaBtn();
    if (state.fnView && state.fnView.input === "domains" && fnDomainsEl) {
      var lockedDomain = {};
      (state.fnView.domains || []).forEach(function (field) {
        if (field.locked) lockedDomain[field.id] = true;
      });
      (remote.clearDomains || []).forEach(function (id) {
        if (lockedDomain[id]) return;
        var box = fnDomainsEl.querySelector("input[data-domain='" + id + "']");
        if (box && !box.disabled) box.value = "";
      });
      var nextDomain = fnDomainsEl.querySelector("input:not(:disabled)");
      if (nextDomain) nextDomain.focus();
    } else if (mathField && state.fnView && state.fnView.input !== "sketch") mathField.focus();
  }

  function submitFnSketch() {
    var view = state.fnView;
    if (view && view.family === "free") {
      var model = fnSketch ? fnSketch.getModel() : { points: [], strokes: [] };
      if (!requestFunctions({ intent: "sketch", sketch: model }, applyFnRemote)) showBasicEqServerUnavailable();
      return;
    }
    applyFnTyped("");
  }

  function applyFnTyped(typed, axis) {
    if (state.locked) return;
    var view = state.fnView;
    if (view && view.input === "sketch") {
      if (fnReviewingSketch()) {
        showFeedback(false, "<strong>עוד לא.</strong> הבדיקה שייכת לסעיף " + fnServerPart() + ". חזרו אליו כדי להמשיך.");
        return;
      }
      var model = fnSketch ? fnSketch.getModel() : { points: [], line: null };
      var freeSketch = view.family === "free";
      if (!freeSketch && !model.line && !(model.curve && model.curve.length)) {
        showFeedback(false, "<strong>עוד לא.</strong> שרטטו את הגרף על מערכת הצירים.");
        return;
      }
      if (!requestFunctions({ intent: "sketch", sketch: model }, applyFnRemote)) showBasicEqServerUnavailable();
      return;
    }
    if (view && view.input === "domains") {
      if (!requestFunctions({ intent: "check", domains: readFnDomains() }, applyFnRemote)) showBasicEqServerUnavailable();
      return;
    }
    if (view && view.input === "fork") {
      var pendingFork = polyForkPending();
      if (!pendingFork) {
        showFeedback(false, "<strong>עוד לא.</strong> בחרו עמודה. אפשר להתחיל מכל אחת.");
        return;
      }
      if (!requestFunctions({ intent: "check", typed: pendingFork.text, branch: pendingFork.branch }, applyFnRemote)) showBasicEqServerUnavailable();
      return;
    }
    if (view && view.input === "extrema") {
      if (!requestFunctions({ intent: "check", extrema: readFnExtrema() }, applyFnRemote)) showBasicEqServerUnavailable();
      return;
    }
    if (!String(typed || "").trim()) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו שלב.");
      return;
    }
    var fnBody = { intent: "check", typed: typed };
    if (axis) fnBody.axis = axis;
    if (!requestFunctions(fnBody, applyFnRemote)) showBasicEqServerUnavailable();
  }

  function fnHint() {
    var hintBody = { intent: "hint", progress: fnProgressForView() };
    if (state.fnView && state.fnView.fork && state.polyForkBranch != null) hintBody.branch = state.polyForkBranch;
    if (fnSketch && fnSketch.getModel) hintBody.sketch = fnSketch.getModel();
    if (!requestFunctions(hintBody, function (remote) {
      if (!remote || remote.ok === false) {
        showFeedback(false, "<strong>עוד לא.</strong> " + fnProse((remote && remote.message) || ""));
        return;
      }
      var hintList = remote.hints && remote.hints.length ? remote.hints : [remote.hint || ""];
      var hintKey = (state.fnView && state.fnView.focusKind) + "|" + fnSketchPartKey();
      state.fn = state.fn || {};
      state.fn.hintBank = state.fn.hintBank || {};
      var hintAt = state.fn.hintBank[hintKey] || 0;
      var hintText = hintList[Math.min(hintAt, hintList.length - 1)];
      if (hintAt < hintList.length - 1) state.fn.hintBank[hintKey] = hintAt + 1;
      showFeedback(true, "<strong>רמז.</strong> " + fnProse(hintText), "tip");
    })) showBasicEqServerUnavailable();
  }

  function abandonFnFormula() {
    if (!isFnMode() || !fnFormulaActive()) return;
    state.fnFormula = false;
    state.fnFormulaEq = "";
    state.mixed = state.mixed || emptyMixedState();
    state.mixed.path = null;
    state.mixed.md53 = false;
    state.quad = null;
    if (state.fn) state.fn.formulaAxis = "";
    hideQuadGuide();
    setQuadInput(true);
    updateFormulaBtn();
    setModeUi();
  }

  function fnOneStep() {
    if (fnFormulaActive()) return fillQuadStep();
    if (fnReviewingSketch()) {
      showFeedback(false, "<strong>עוד לא.</strong> הצעד הבא שייך לסעיף " + fnServerPart() + ". חזרו אליו כדי להמשיך.");
      return;
    }
    if (state.fnView && state.fnView.input === "fork") {
      var pendingFork = polyForkPending();
      if (pendingFork && pendingFork.text) {
        if (!requestFunctions({ intent: "check", typed: pendingFork.text, branch: pendingFork.branch }, applyFnRemote)) showBasicEqServerUnavailable();
        return;
      }
      if (!requestFunctions({ intent: "one-step", branch: state.polyForkBranch }, applyFnRemote)) showBasicEqServerUnavailable();
      return;
    }
    var stepBody = { intent: "one-step" };
    if (state.fnView && state.fnView.fork && state.polyForkBranch != null) stepBody.branch = state.polyForkBranch;
    if (!requestFunctions(stepBody, applyFnRemote)) showBasicEqServerUnavailable();
  }

  function ensureFnTaskHeader(heading) {
    if (!heading) return;
    var marker = "משימה:" + heading;
    if ((state.history || []).indexOf(marker) >= 0) return;
    state.history.push(marker);
  }

  function fnSolution() {
    if (!requestFunctions({ intent: "solution" }, function (remote) {
      if (!remote || remote.ok === false) {
        showFeedback(false, "<strong>עוד לא.</strong> " + fnProse((remote && remote.message) || ""));
        return;
      }
      showEqSolution("פתרון מלא", {
        always: true,
        steps: remote.steps || [],
        notes: remote.notes || [],
        withNotes: true,
        footer: "",
      });
      renderFnSolutionExamples(remote.examples);
    })) showBasicEqServerUnavailable();
  }

  function renderFnSolutionExamples(examples) {
    if (!modelEl || !examples || !examples.length) return;
    var wrap = document.createElement("div");
    wrap.className = "fn-solution-examples";
    examples.forEach(function (example) {
      var card = document.createElement("figure");
      card.className = "fn-solution-example";
      var title = document.createElement("figcaption");
      title.innerHTML = fnProse("סעיף " + (example.label || "") + ": סקיצה אפשרית");
      card.appendChild(title);
      card.appendChild(fnExampleSvg(example));
      wrap.appendChild(card);
    });
    modelEl.appendChild(wrap);
  }

  function fnExampleSvg(example) {
    var w = 168;
    var h = 132;
    var ox = 84;
    var oy = 66;
    var half = 52;
    function sx(q) { return ox + Number(q) * half; }
    function sy(q) { return oy - Number(q) * half; }
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("class", "fn-example-svg");
    function line(x1, y1, x2, y2, cls) {
      var node = document.createElementNS("http://www.w3.org/2000/svg", "line");
      node.setAttribute("x1", x1);
      node.setAttribute("y1", y1);
      node.setAttribute("x2", x2);
      node.setAttribute("y2", y2);
      node.setAttribute("class", cls);
      svg.appendChild(node);
    }
    line(12, oy, w - 12, oy, "axis");
    line(ox, 10, ox, h - 10, "axis");
    var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    poly.setAttribute("class", "curve");
    poly.setAttribute("points", (example.stroke || []).map(function (pt) {
      return sx(pt[0]) + "," + sy(pt[1]);
    }).join(" "));
    svg.appendChild(poly);
    var dots = example.points && example.points.length ? example.points : (example.point ? [example.point] : []);
    dots.forEach(function (pt) {
      var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", sx(pt.qx));
      dot.setAttribute("cy", sy(pt.qy));
      dot.setAttribute("r", "3.2");
      dot.setAttribute("class", "point");
      svg.appendChild(dot);
    });
    return svg;
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
        (isHighPowerTopic() && level && (level.mode === "high-factor" || level.mode === "high-chain"))) &&
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

  function hideQuadGuide() {
    if (!quadGuideEl) return;
    quadGuideEl.classList.add("hidden");
    quadGuideEl.innerHTML = "";
  }

  function hideSysPanels() {
    if (sysGuideEl) {
      sysGuideEl.classList.add("hidden");
      sysGuideEl.innerHTML = "";
    }
    if (sysKnownEl) {
      sysKnownEl.classList.add("hidden");
      sysKnownEl.innerHTML = "";
    }
    if (solveWrap) solveWrap.classList.remove("is-system");
  }

  function factorWorkActive() {
    return isFactorEqMode() || mixedPath() === "factor" || (isBiquadMode() && state.factor && state.factor.split);
  }

  function factorForkLive() {
    var st = state.factor;
    if (!st) return false;
    if (isBiquadMode() && st.split && st.heads && st.heads.length) return true;
    var tr = st.trails;
    if (!tr || !tr.length) return false;
    return tr.some(function (t) {
      return t && t.length;
    });
  }

  function biquadColumnsOpen() {
    return !!(isBiquadMode() && state.factor && state.factor.split && state.factor.heads && state.factor.heads.length);
  }

  function biquadChosenBranch() {
    var fields = state.biquadFields || [];
    var i;
    if (state.biquadActiveBranch != null) {
      for (i = 0; i < fields.length; i++) {
        if (fields[i].index === state.biquadActiveBranch) return state.biquadActiveBranch;
      }
    }
    if (fields.length === 1) return fields[0].index;
    return null;
  }

  function biquadPending() {
    var fields = state.biquadFields || [];
    var active = state.biquadActiveBranch;
    var i;
    var fallback = null;
    for (i = 0; i < fields.length; i++) {
      var text = fields[i].field ? fields[i].field.serialize().trim() : "";
      if (!text) continue;
      if (fields[i].index === active) return { text: text, branch: fields[i].index };
      if (!fallback) fallback = { text: text, branch: fields[i].index };
    }
    if (fallback) return fallback;
    if (!biquadColumnsOpen()) {
      var typed = typedAnswer().trim();
      if (typed) return { text: typed, branch: null };
    }
    return { text: "", branch: biquadChosenBranch() };
  }

  function focusBiquadField(index) {
    var fields = state.biquadFields || [];
    var i;
    for (i = 0; i < fields.length; i++) {
      if (fields[i].index === index && fields[i].field) {
        state.biquadActiveBranch = index;
        fields[i].field.focus();
        return true;
      }
    }
    return false;
  }

  function clearBiquadField(index) {
    if (index == null) return;
    state.biquadDrafts = state.biquadDrafts || {};
    delete state.biquadDrafts[index];
    (state.biquadFields || []).forEach(function (item) {
      if (item.index === index && item.field) item.field.clear();
    });
  }

  function snapshotBiquadDrafts() {
    if (!state.biquadFields || !state.biquadFields.length) return;
    state.biquadDrafts = state.biquadDrafts || {};
    state.biquadFields.forEach(function (item) {
      if (!item || !item.field || !item.field.host || !item.field.host.isConnected) return;
      item.field.readInputs();
      var text = item.field.serialize();
      if (!text) {
        delete state.biquadDrafts[item.index];
        return;
      }
      state.biquadDrafts[item.index] = JSON.parse(JSON.stringify(item.field.parts));
    });
  }

  function rememberBiquadTarget() {
    var fields = state.biquadFields || [];
    var i;
    var match = null;
    for (i = 0; i < fields.length; i++) {
      if (fields[i].index === state.biquadActiveBranch) match = fields[i].field;
    }
    if (match) {
      DoctematicaMathField.current = match;
      return;
    }
    if (fields.length === 1) {
      DoctematicaMathField.current = fields[0].field;
      state.biquadActiveBranch = fields[0].index;
      return;
    }
    if (
      DoctematicaMathField.current &&
      DoctematicaMathField.current.host &&
      !DoctematicaMathField.current.host.isConnected
    ) {
      DoctematicaMathField.current = null;
    }
  }

  function syncBiquadColumnsEntry() {
    if (!mathWrap) return;
    if (biquadColumnsOpen()) {
      mathWrap.classList.add("hidden");
      if (mathKeysEl) mathKeysEl.classList.remove("hidden");
    }
  }

  function sqrtWorkActive() {
    return isSqrtEqMode() || isHighRootEqMode() || mixedPath() === "sqrt";
  }

  function isEqWorkMode() {
    return isStepMode() || isIneqMode() || isParamEqMode() || isSqrtEqMode() || isHighRootEqMode() || isFactorEqMode() || isMixedEqMode() || isBiquadMode();
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
      pending: (st.pending || []).map(String),
      formulaBranch: st.formulaBranch,
      work: st.work || null,
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
      var lin = Q && typeof Q.linearSolved === "function" ? function (eq) { return !!Q.linearSolved(eq); } : function () { return false; };
      if (pack && pack.high) {
        state.factor.solved = [
          !!(lin(e1) && /x\s*=\s*0/i.test(e1)),
          false,
        ];
      } else {
        state.factor.solved = [lin(e1), lin(e2)];
      }
    }
  }

  function appendFactorTrail(which, eq, reason) {
    if (typeof which !== "number" || which < 0) return;
    var trail = state.factor.trails[which];
    if (!trail) {
      state.factor.trails[which] = [eq];
      trail = state.factor.trails[which];
    } else if (trail[trail.length - 1] !== eq) {
      trail.push(eq);
    } else {
      return;
    }
    if (reason && eqNotesActive()) {
      state.factor.why = state.factor.why || {};
      state.factor.why[which + ":" + (trail.length - 1)] = reason;
    }
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

  function geoEqKey(text) {
    return String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
  }

  function geoQuadChain() {
    var t = geoDistUnkTask();
    var st = t && state.geo && state.geo.distUnk && state.geo.distUnk[t.id];
    var letter = geoEqLetter() || (st && st.letter) || "x";
    var start = st && st.mixedStart ? String(st.mixedStart) : "";
    var hist = [];
    var armed = !start;
    var i;
    for (i = 0; i < (state.history || []).length; i++) {
      var line = String(state.history[i] || "");
      if (isGeoSectionHeader(line)) continue;
      if (!/=/.test(line) || /√|sqrt/i.test(line)) continue;
      var asX = rewriteLetterGeo(line, letter, "x");
      if (!armed) {
        if (geoEqKey(asX) === geoEqKey(start)) armed = true;
        else continue;
      }
      hist.push(asX);
    }
    var last = "";
    if (t && state.geo && state.geo.lastExpr && state.geo.lastExpr[t.id]) {
      last = rewriteLetterGeo(state.geo.lastExpr[t.id], letter, "x");
    }
    if (start && (!hist.length || geoEqKey(hist[0]) !== geoEqKey(start))) hist.unshift(start);
    if (last && !/√|sqrt/i.test(last) && (!hist.length || geoEqKey(hist[hist.length - 1]) !== geoEqKey(last))) {
      hist.push(last);
    }
    if (!hist.length && last) hist = [last];
    return { start: hist[0] || start || last, history: hist.length ? hist : [start || last] };
  }

  function geoLooksArrangedQuadratic(eq) {
    var s = geoEqKey(eq);
    if (!/=/.test(s) || /√|sqrt|\(|\)/.test(s)) return false;
    var parts = s.split("=");
    if (parts.length !== 2) return false;
    var live = parts[1] === "0" ? parts[0] : parts[0] === "0" ? parts[1] : "";
    if (!live || !/x\^2/i.test(live)) return false;
    return (live.match(/x\^2/gi) || []).length === 1;
  }

  function geoLooksProductZero(eq) {
    var s = geoEqKey(eq);
    return /\([^()]*\)/.test(s) && /=0$/.test(s);
  }

  function fnQuadText(text) {
    return String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/²/g, "^2")
      .replace(/\s+/g, "");
  }

  function fnLooksArrangedQuadratic(eq) {
    var s = fnQuadText(eq);
    if (!/=/.test(s) || /√|sqrt|\(|\)/.test(s)) return false;
    var parts = s.split("=");
    if (parts.length !== 2) return false;
    var live = parts[1] === "0" ? parts[0] : parts[0] === "0" ? parts[1] : "";
    if (!live || !/x\^2/i.test(live)) return false;
    return (live.match(/x\^2/gi) || []).length === 1;
  }

  function fnLastMathLine() {
    var hist = state.history || [];
    var i;
    for (i = hist.length - 1; i >= 0; i--) {
      if (/^§/.test(String(hist[i] || ""))) continue;
      return String(hist[i] || "");
    }
    return "";
  }

  function fnAxisQuadEq() {
    if (!isFnMode() || !state.fnView || state.fnView.input !== "axes") return "";
    if (state.fn && state.fn.axisDone && state.fn.axisDone.x) return "";
    var live = (state.fn && state.fn.axisLive && state.fn.axisLive.x) || [];
    var found = "";
    var i;
    for (i = 0; i < live.length; i++) {
      var show = String((live[i] && live[i].show) || "");
      if (fnLooksArrangedQuadratic(show)) found = show;
    }
    return found;
  }

  function fnCurrentQuadLine() {
    if (isFnMode() && state.fnView && state.fnView.input === "axes") return fnAxisQuadEq();
    return fnLastMathLine();
  }

  function fnQuadSolveActive() {
    if (!isFnMode() || state.locked || mixedPath() === "formula") return false;
    return fnLooksArrangedQuadratic(fnCurrentQuadLine());
  }

  function fnFormulaActive() {
    return isFnMode() && mixedPath() === "formula";
  }

  function fnFormulaBranchEq() {
    if (state.fnFormulaEq) return state.fnFormulaEq;
    var fork = state.fnView && state.fnView.fork;
    var eqs = (fork && fork.eqs) || [];
    var i;
    for (i = 0; i < eqs.length; i++) {
      if (fork.solved && fork.solved[i]) continue;
      var eq = String(eqs[i] || "");
      if (/x\^2/.test(eq) && !/x\^[3-9]/.test(eq)) return eq;
    }
    return "";
  }

  function formulaLetterToX(eq) {
    var text = String(eq || "");
    var found = text.replace(/\s+/g, "").match(/([a-wyz])\^2/i);
    if (!found) return text;
    var letter = found[1];
    return text.replace(new RegExp(letter + "\\^", "gi"), "x^").replace(new RegExp(letter, "gi"), "x");
  }

  function fnQuadChain() {
    if (fnFormulaActive()) {
      var branch = formulaLetterToX(fnFormulaBranchEq());
      if (branch) return { start: branch, history: [branch] };
    }
    var eq = fnQuadText(fnCurrentQuadLine());
    return { start: eq, history: [eq] };
  }

  function finishEqSolveForFn(answer) {
    if (!state.fnFormula || !isFnMode()) return false;
    var text = String(answer || "").trim();
    state.fnFormula = false;
    state.fnFormulaEq = "";
    stashFnFormulaTrail();
    state.mixed = state.mixed || emptyMixedState();
    state.mixed.path = null;
    state.mixed.md53 = false;
    state.quad = null;
    state.factor = emptyFactorState();
    hideQuadGuide();
    setQuadInput(true);
    updateFormulaBtn();
    setModeUi();
    if (!text) {
      showFeedback(false, "<strong>עוד לא.</strong> לא התקבל פתרון מהנוסחה.");
      return true;
    }
    var axis = state.fn && state.fn.formulaAxis;
    if (state.fn) state.fn.formulaAxis = "";
    var back = { intent: "check", typed: text };
    if (axis === "x" || axis === "y") back.axis = axis;
    if (!requestFunctions(back, applyFnRemote)) showBasicEqServerUnavailable();
    return true;
  }

  function geoEqSolveActive() {
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
    renderSteps();
    updateSplitBtn();
    updateFormulaBtn();
    setModeUi();
    if (!text) return true;
    if (
      !requestGeometryAction({ intent: "check", typed: text }, function (remote) {
        finishGeoCheckResult(text, remote, true);
      })
    ) {
      showBasicEqServerUnavailable();
    }
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
    if (state.locked) return false;
    if (isFnMode() && state.fnView && state.fnView.canSplit) return true;
    if (isSystemQuadMode() && state.offerSplit && mixedPath() !== "factor") return true;
    var ready = !!(state.factor && state.factor.canSplit);
    if (
      !ready &&
      geoEqSolveActive() &&
      (!mixedPath() || mixedPath() === "factor") &&
      geoLooksProductZero(lastHistoryEq())
    ) {
      ready = true;
    }
    if (!ready) return false;
    if (isFactorServerMode() || isHighFactorServerMode() || isHighChainServerMode()) return true;
    if (isMixedServerMode() && mixedPath() === "factor") return true;
    if (isQuadIneqMode() && state.factor && state.factor.canSplit) return true;
    if (geoEqSolveActive() && (!mixedPath() || mixedPath() === "factor")) return true;
    return false;
  }

  function updateSplitBtn() {
    if (!splitEqsBtn) return;
    var show = !state.locked && canSplitFactor();
    splitEqsBtn.classList.toggle("hidden", !show);
  }

  function canUseMixedFormula() {
    if (state.locked || !state.problem) return false;
    if (isHighChainServerMode()) {
      if (mixedPath() === "formula") return false;
      return !!(state.factor && state.factor.offerFormula);
    }
    if (isBiquadMode()) {
      if (mixedPath() === "formula") return false;
      return !!state.biquadOffer;
    }
    if (sysQuadFormulaActive()) return false;
    if (fnQuadSolveActive()) return true;
    if (isFnMode() && state.fnView && state.fnView.offerFormula && mixedPath() !== "formula") return true;
    if (isSystemQuadMode() && state.offerFormula) return true;
    if (isQuadIneqMode() && (!state.quadIneq || state.quadIneq.phase === "equation" || state.quadIneq.phase === "zeros") && !mixedPath() && state.offerFormula) return true;
    if (!isMixedEqMode() && !geoEqSolveActive()) return false;
    if (mixedPath()) return false;
    if (state.offerFormula) return true;
    return geoEqSolveActive() && geoLooksArrangedQuadratic(lastHistoryEq());
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
            appendSiteWhy(body, entry.reason);
            row.appendChild(n);
            row.appendChild(body);
            if (!entry.reason) appendEqUserNote(row, "d:" + branchIdx + ":" + k);
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
      appendSiteWhy(body, entry.reason);
      row.appendChild(num);
      row.appendChild(body);
      if (!entry.reason) appendEqUserNote(row, "d:" + k);
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
      if (biquadColumnsOpen()) {
        if (mathWrap) mathWrap.classList.add("hidden");
        if (mathKeysEl) mathKeysEl.classList.remove("hidden");
      } else if (mathWrap && !formulaWorkActive() && !sysPrepActive()) mathWrap.classList.remove("hidden");
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

  function appendDomainTrail(text, parts, reason) {
    if (!state.domain) return;
    state.domain.trail = state.domain.trail || [];
    var row = {
      display: text,
      parts: parts || null,
    };
    if (reason) row.reason = reason;
    state.domain.trail.push(row);
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
        appendDomainTrail(state.domain.display, state.domain.info.parts, opts.reason);
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
      opts.reason
        ? "<strong>צעד של האתר.</strong> " + siteReasonHTML(opts.reason)
        : opts.message ||
          "<strong>תחום הצבה:</strong> " +
            state.domain.display +
            ". עכשיו פתרו את המשוואה (אפשר מכנה משותף).",
      "tip"
    );
    mathField.focus();
  }

  function applyDomainRaw(display, parts, message, reason) {
    if (!state.domain) return;
    state.domain.phase = "work";
    state.domain.rawDisplay = display;
    if (!domainMulti()) {
      var last = (state.domain.trail || [])[state.domain.trail.length - 1];
      if (!last || last.display !== display) appendDomainTrail(display, parts, reason);
      else if (reason && !last.reason) last.reason = reason;
    }
    renderDomainGuide();
    renderSteps();
    setModeUi();
    updateDomainBtn();
    mathField.clear();
    showFeedback(
      true,
      reason ? "<strong>צעד של האתר.</strong> " + siteReasonHTML(reason) : message || "עכשיו פשטו ל־x≠…",
      "tip"
    );
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
          reason: res.reason || "",
        },
      ];
      applyDomainDone(res.display || state.domain.info.display, {
        skipTrail: true,
        reason: res.reason || "",
        message: "<strong>נכון.</strong> תחום הצבה: " + (res.display || state.domain.info.display) + ".",
      });
      return;
    }
    showFeedback(
      true,
      res.reason ? "<strong>צעד של האתר.</strong> " + siteReasonHTML(res.reason) : res.message || "המשיכו.",
      "tip"
    );
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
        reason: res.reason || "",
      });
      return;
    }
    if (res.phase === "raw" || res.phase === "work") {
      applyDomainRaw(res.display, res.parts, res.message, res.reason);
      return;
    }
    applyDomainDone(res.display || (state.domain.info && state.domain.info.display), {
      message: "<strong>נכון.</strong> תחום הצבה: " + (res.display || (state.domain.info && state.domain.info.display)) + ".",
      reason: res.reason || "",
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
    showBasicEqServerUnavailable();
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
    showBasicEqServerUnavailable();
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
    showBasicEqServerUnavailable();
    return true;
  }

  function pushLcdMarksStep(mark, opts) {
    opts = opts || {};
    var baseEq = lastHistoryEq();
    state.history.push(baseEq);
    state.lcdMarks[state.history.length - 1] = mark;
    if (opts.reason) {
      state.eqReasons = state.eqReasons || {};
      state.eqReasons[state.history.length - 1] = opts.reason;
    }
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
            reason: res.reason,
            message:
              "<strong>צעד של האתר.</strong> " +
              (res.reason
                ? siteReasonHTML(res.reason)
                : "מכנה משותף " +
                  res.mark.lcd +
                  " — המכפילים מעל כל איבר (כמו במחברת). הצעד הבא: כפלו והורידו מכנים."),
          });
        }
      );
      return true;
    }
    return false;
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
    if (isFnMode()) {
      if (!requestFunctions({ intent: "split" }, applyFnRemote)) showBasicEqServerUnavailable();
      return;
    }
    if (isSystemQuadMode()) {
      enterSysSplit();
      return;
    }
    if (
      isHighFactorServerMode() ||
      isHighChainServerMode() ||
      isFactorServerMode() ||
      isQuadIneqMode() ||
      ((isMixedServerMode() || geoEqSolveActive()) && (mixedPath() === "factor" || geoEqSolveActive()))
    ) {
      if (geoEqSolveActive()) {
        state.mixed = state.mixed || emptyMixedState();
        state.mixed.path = "factor";
      }
      if (isQuadIneqMode()) {
        state.mixed = state.mixed || emptyMixedState();
        state.mixed.path = "factor";
      }
      var sendSplit = isHighFactorServerMode() || isHighChainServerMode() ? requestHighPowerAction : requestQuadraticAction;
      sendSplit(
        {
          intent: "split",
          start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: state.history,
          factor: factorPayload(),
        },
        function (res) {
          if (!res.ok) {
            if (geoEqSolveActive() && state.mixed) state.mixed.path = null;
            updateSplitBtn();
            setModeUi();
            showFeedback(false, "<strong>עוד לא.</strong> " + (res.message || ""));
            return;
          }
          applyFactorServerResult("", res);
        }
      );
      return;
    }
    showBasicEqServerUnavailable();
  }

  function highBranchDone() {
    return false;
  }

  function applyFactorServerResult(shownTyped, res) {
    res = softenQuadIneqSolve(res || {});
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
    if (res.offerFormula != null) state.factor.offerFormula = !!res.offerFormula;
    if (res.formulaEq) state.factor.formulaEq = res.formulaEq;
    if (res.formulaBranch != null) state.factor.formulaBranch = res.formulaBranch;
    if (Array.isArray(res.work)) state.factor.work = res.work;
    if (Array.isArray(res.pending)) state.factor.pending = res.pending.slice();
    if (res.sqrtProg) state.factor.sqrtProg = res.sqrtProg;
    var wasSplit = !!state.factor.split;
    var chainTrails = isHighChainServerMode() && Array.isArray(res.trails) && res.trails.length;
    if (chainTrails) {
      state.factor.trails = res.trails.map(function (t) {
        return (t || []).slice();
      });
      state.factor.split = true;
      if (res.eqs) state.factor.eqs = res.eqs.slice();
      if (Array.isArray(res.solvedFlags)) state.factor.solved = res.solvedFlags.slice();
    }
    var msg = String(res.message || res.hint || "");
    if (res.factored) {
      if (shownTyped && state.history[state.history.length - 1] !== shownTyped) {
        state.history.push(shownTyped);
        rememberHistoryReason(res.reason);
      }
    } else if (res.rearrange) {
      if (shownTyped && state.history[state.history.length - 1] !== shownTyped) {
        state.history.push(shownTyped);
        rememberHistoryReason(res.reason);
      }
    } else if (res.resplit && !chainTrails) {
      if (res.eqs) state.factor.eqs = res.eqs;
      if (Array.isArray(res.solvedFlags)) state.factor.solved = res.solvedFlags;
      state.factor.split = true;
      state.factor.canSplit = false;
      if (typeof res.which === "number") {
        if (res.trailAlso) appendFactorTrail(res.which, res.trailAlso);
        if (res.eqs && res.eqs[res.which]) appendFactorTrail(res.which, res.eqs[res.which], res.reason);
      }
    } else if (res.split && !wasSplit && !chainTrails) {
      var startEqs = res.eqs;
      if (!isHighFactorServerMode() && Q && typeof Q.parseProductEq === "function") {
        var p0 = Q.parseProductEq(lastHistoryEq());
        if (p0) startEqs = [p0.e1, p0.e2];
      }
      if (startEqs && startEqs.length >= 2) startFactorTrails(startEqs[0], startEqs[1]);
      if (res.reason && eqNotesActive()) state.factor.splitReason = res.reason;
    }
    if (!chainTrails && !res.resplit && res.eqs) state.factor.eqs = res.eqs;
    if (!chainTrails && !res.resplit && Array.isArray(res.solvedFlags)) state.factor.solved = res.solvedFlags;
    if (res.split || res.resplit) state.factor.split = true;
    if (res.progress) state.factor.progress = res.progress;
    if (!chainTrails && !res.resplit && typeof res.which === "number" && shownTyped) {
      if (res.trailAlso) appendFactorTrail(res.which, res.trailAlso);
      appendFactorTrail(res.which, shownTyped, res.reason);
    } else if (res.solved === true && res.progress) {
      if (res.progress.z) appendFactorTrail(0, "x = 0", res.reason);
      else if (res.progress.o) appendFactorTrail(1, shownTyped, res.reason);
    } else if (res.progress) {
      if (res.progress.z && !wasSplit) appendFactorTrail(0, shownTyped, res.reason);
      if (res.progress.o) appendFactorTrail(1, shownTyped, res.reason);
    }
    renderSteps();
    renderFactorGuide();
    var done = res.solvedAll || res.solved === true;
    if (done && sysQuadFactorActive()) {
      finishFactorForSys(res);
      return true;
    }
    if (done) {
      if (isQuadIneqMode()) {
        finishEqSolveForQuadIneq(shownTyped || "");
        return true;
      }
      if (geoDistUnkTask()) {
        var rootBits = [];
        if (state.factor && state.factor.trails) {
          state.factor.trails.forEach(function (tr) {
            (tr || []).forEach(function (line) {
              var bit = String(line || "").trim();
              if (/^[A-Za-z]\s*=/.test(bit.replace(/[−–—]/g, "-"))) rootBits.push(bit);
            });
          });
        }
        var rootAns = rootBits.join(", ");
        if (shownTyped && rootAns.indexOf(shownTyped) < 0) rootAns = rootAns ? rootAns + ", " + shownTyped : shownTyped;
        rootBits.forEach(function (bit) {
          if (state.history[state.history.length - 1] !== bit) state.history.push(bit);
        });
        finishEqSolveForGeo(rootAns);
        return true;
      }
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
      showFeedback(true, siteStepMessage(res.reason, "<strong>חילקנו.</strong> " + msg), "tip");
      mathField.focus();
      return true;
    }
    var label = res.factored || res.solvedOne || res.solved ? "נכון" : "צעד חוקי";
    showFeedback(true, siteStepMessage(res.reason, "<strong>" + label + ".</strong> " + msg));
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
    if (isHighFactorServerMode() || isHighChainServerMode()) {
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
    if (isFactorServerMode() || ((isMixedServerMode() || geoEqSolveActive() || isQuadIneqMode()) && mixedPath() === "factor")) {
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
    showBasicEqServerUnavailable();
    return false;
  }

  function isGuidedMode() {
    return (
      isStepMode() ||
      isSystemMode() ||
      isQuadraticTopic() ||
      isHighPowerTopic() ||
      state.topic === "biquad" ||
      isAnalyticTopic() ||
      isStatisticsTopic() ||
      isPercentTopic() ||
      isCalculusTopic() ||
      state.topic === "inequalities" ||
      state.topic === "equations"
    );
  }

  function topicLevels() {
    var all = (state.catalog && state.catalog.levels) || [];
    var sub =
      state.topic === "equations" ||
      state.topic === "analytic" ||
      state.topic === "statistics" ||
      state.topic === "percents" ||
      state.topic === "systems-sub" ||
      state.topic === "calculus" ||
      state.topic === "inequalities"
        ? state.subtopic
        : null;
    if (!state.topic) return all;
    return all.filter(function (item) {
      if ((item.topic || "equations") !== state.topic) return false;
      if (state.topic === "equations" && sub) return (item.subtopic || "basic") === sub;
      if (state.topic === "analytic" && sub) return (item.subtopic || "segments") === sub;
      if (state.topic === "statistics" && sub) return (item.subtopic || "freq-table") === sub;
      if (state.topic === "percents" && sub) return (item.subtopic || "find-part") === sub;
      if (state.topic === "systems-sub" && sub) return (item.subtopic || "sub") === sub;
      if (state.topic === "calculus" && sub) return (item.subtopic || "intro") === sub;
      if (state.topic === "inequalities" && sub) return (item.subtopic || "linear") === sub;
      return true;
    });
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

  function topicIconName(id) {
    if (id === "equations") return "eq";
    if (id === "quadratic") return "quad";
    if (id === "high-power") return "pow";
    if (id === "systems-sub") return "sys";
    if (id === "percents") return "pct";
    if (id === "analytic") return "geo";
    if (id === "statistics") return "stat";
    if (id === "calculus") return "calc";
    if (id === "inequalities") return "ineq";
    return "eq";
  }

  function navIcon(name) {
    var common =
      'viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    if (name === "home") {
      return "<svg " + common + '><path d="M4 11.5 12 4l8 7.5"/><path d="M7 10.5V20h10v-9.5"/></svg>';
    }
    if (name === "quad") {
      return "<svg " + common + '><path d="M4 16c2.2-7 4.2-7 6.2 0s4 7 6.2 0"/><path d="M4 20h16"/></svg>';
    }
    if (name === "pow") {
      return "<svg " + common + '><path d="M7 16l4-9 4 9"/><path d="M8.2 13h5.6"/><path d="M17 6h3"/></svg>';
    }
    if (name === "sys") {
      return "<svg " + common + '><path d="M8 7h11"/><path d="M8 12h11"/><path d="M8 17h11"/><path d="M5 7h.01M5 12h.01M5 17h.01"/></svg>';
    }
    if (name === "pct") {
      return "<svg " + common + '><circle cx="8" cy="8" r="2.2"/><circle cx="16" cy="16" r="2.2"/><path d="M16 6 8 18"/></svg>';
    }
    if (name === "geo") {
      return "<svg " + common + '><path d="M4 20V5"/><path d="M4 20h16"/><path d="M4 20 16 8"/></svg>';
    }
    if (name === "ineq") {
      return "<svg " + common + '><path d="M16 6 8 12l8 6"/><path d="M6 12h.01"/></svg>';
    }
    if (name === "calc") {
      return "<svg " + common + '><path d="M4 19V5"/><path d="M4 19h16"/><path d="M6 15c3-1 4-6 7-7s4 2 7 1"/></svg>';
    }
    if (name === "stat") {
      return "<svg " + common + '><path d="M5 19V11"/><path d="M10 19V6"/><path d="M15 19v-5"/><path d="M20 19V8"/><path d="M4 19h16"/></svg>';
    }
    return "<svg " + common + '><path d="M5 8h14"/><path d="M5 12h8"/><path d="M5 16h11"/></svg>';
  }

  function navChevronHtml() {
    return '<span class="nav-chevron" aria-hidden="true"><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.2 4.5 6.5 10l5.7 5.5"/></svg></span>';
  }

  function paintNavButton(btn, label, iconName, active, withChevron) {
    btn.className = "nav-item" + (active ? " active" : "");
    btn.innerHTML =
      (iconName ? '<span class="nav-ico">' + navIcon(iconName) + "</span>" : "") +
      '<span class="nav-label"></span>' +
      (withChevron ? navChevronHtml() : "");
    btn.querySelector(".nav-label").textContent = label;
  }

  function goHome() {
    shellMode = "pick";
    navOpen = false;
    syncShell();
  }

  function enterSolve() {
    shellMode = "solve";
    navOpen = false;
    syncShell();
  }

  function syncShell() {
    document.body.classList.toggle("is-solve", shellMode === "solve");
    document.body.classList.toggle("is-pick", shellMode !== "solve");
    document.body.classList.toggle("nav-open", shellMode === "solve" && navOpen);
    if (navToggleBtn) {
      navToggleBtn.setAttribute("aria-expanded", shellMode === "solve" && navOpen ? "true" : "false");
    }
    if (homeBtn) homeBtn.classList.remove("active");
    var navCols = document.querySelectorAll(".nav-col");
    var collapsed = shellMode === "solve" && !navOpen;
    for (var c = 0; c < navCols.length; c++) {
      if (collapsed) navCols[c].setAttribute("inert", "");
      else navCols[c].removeAttribute("inert");
    }
    if (navScrim) {
      var overlay =
        shellMode === "solve" &&
        navOpen &&
        window.matchMedia("(min-width: 861px)").matches;
      navScrim.classList.toggle("hidden", !overlay);
    }
    renderCrumb();
  }

  function renderCrumb() {
    if (!crumbEl) return;
    crumbEl.innerHTML = "";
    var bits = [{ label: "בית", home: true }];
    var topics = (state.catalog && state.catalog.topics) || [];
    var topic = topics.filter(function (t) {
      return t.id === state.topic;
    })[0];
    if (topic) bits.push({ label: topic.label });
    var subs = ((state.catalog && state.catalog.subtopics) || {})[state.topic] || [];
    var sub = subs.filter(function (s) {
      return s.id === state.subtopic;
    })[0];
    if (sub) bits.push({ label: sub.label });
    if (shellMode === "solve") {
      if (state.source === "random") bits.push({ label: "מאגר אקראי" });
      else {
        var level = currentLevel();
        if (level && level.title) bits.push({ label: level.title });
      }
    }
    bits.forEach(function (bit, i) {
      if (i) {
        var sep = document.createElement("span");
        sep.className = "crumb-sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "‹";
        crumbEl.appendChild(sep);
      }
      if (bit.home) {
        var link = document.createElement("button");
        link.type = "button";
        link.className = "crumb-link";
        link.textContent = bit.label;
        link.addEventListener("click", goHome);
        crumbEl.appendChild(link);
      } else {
        var span = document.createElement("span");
        span.textContent = bit.label;
        crumbEl.appendChild(span);
      }
    });
  }

  function renderRail() {
    if (!topicRailEl) return;
    var old = topicRailEl.querySelectorAll(".rail-icon");
    for (var i = 0; i < old.length; i++) old[i].remove();
    var home = document.createElement("button");
    home.type = "button";
    home.className = "rail-icon";
    home.title = "בית";
    home.setAttribute("aria-label", "בית");
    home.innerHTML = navIcon("home");
    home.addEventListener("click", goHome);
    topicRailEl.appendChild(home);
    ((state.catalog && state.catalog.topics) || []).forEach(function (topic) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rail-icon" + (shellMode === "solve" && topic.id === state.topic ? " active" : "");
      btn.title = topic.label;
      btn.setAttribute("aria-label", topic.label);
      btn.innerHTML = navIcon(topicIconName(topic.id));
      btn.addEventListener("click", function () {
        if (shellMode === "solve") navOpen = true;
        selectTopic(topic);
      });
      topicRailEl.appendChild(btn);
    });
  }

  function revealExerciseBtn(btn) {
    if (!exerciseNumsEl || !btn) return;
    var left = btn.offsetLeft;
    var right = left + btn.offsetWidth;
    if (left < exerciseNumsEl.scrollLeft) exerciseNumsEl.scrollLeft = Math.max(0, left - 8);
    else if (right > exerciseNumsEl.scrollLeft + exerciseNumsEl.clientWidth) {
      exerciseNumsEl.scrollLeft = right - exerciseNumsEl.clientWidth + 8;
    }
  }

  function selectTopic(topic) {
    state.topic = topic.id;
    state.source = "worksheet";
    state.exerciseIndex = 0;
    if (topic.id === "equations" || topic.id === "analytic" || topic.id === "statistics" || topic.id === "percents" || topic.id === "systems-sub" || topic.id === "calculus" || topic.id === "inequalities") {
      var subs = ((state.catalog && state.catalog.subtopics) || {})[topic.id] || [];
      state.subtopic = state.subtopic || (subs[0] && subs[0].id);
      if (!subs.some(function (s) { return s.id === state.subtopic; })) {
        state.subtopic = subs[0] ? subs[0].id : null;
      }
      if (topic.id === "equations" && state.subtopic !== "basic" && state.source === "random") {
        state.source = "worksheet";
      }
    }
    var first = topicLevels()[0];
    state.levelId = first ? first.id : "level-01";
    renderTopics();
    renderSubtopics();
    renderSources();
    renderKinds();
    nextProblem();
  }

  function selectSubtopic(item) {
    state.subtopic = item.id;
    state.source = "worksheet";
    state.exerciseIndex = 0;
    var first = topicLevels()[0];
    state.levelId = first ? first.id : "level-01";
    renderSubtopics();
    renderSources();
    nextProblem();
  }

  function renderSources() {
    sourcesEl.innerHTML = "";
    if (!isGuidedMode()) {
      sourcesWrap.classList.add("hidden");
      worksheetNav.classList.add("hidden");
      randomWrap.classList.remove("hidden");
      syncShell();
      return;
    }
    sourcesWrap.classList.remove("hidden");
    topicLevels().forEach(function (level) {
      var btn = document.createElement("button");
      btn.type = "button";
      paintNavButton(
        btn,
        level.title,
        null,
        state.source === "worksheet" && state.levelId === level.id,
        true
      );
      btn.addEventListener("click", function () {
        state.source = "worksheet";
        state.levelId = level.id;
        state.exerciseIndex = 0;
        enterSolve();
        nextProblem();
      });
      sourcesEl.appendChild(btn);
    });
    if (state.topic === "equations" && state.subtopic === "basic") {
      var randomBtn = document.createElement("button");
      randomBtn.type = "button";
      paintNavButton(randomBtn, "מאגר אקראי", null, state.source === "random", true);
      randomBtn.addEventListener("click", function () {
        state.source = "random";
        enterSolve();
        nextProblem();
      });
      sourcesEl.appendChild(randomBtn);
    }
    syncShell();
  }

  function renderWorksheetNav() {
    if (!isWorksheet()) {
      worksheetNav.classList.add("hidden");
      randomWrap.classList.remove("hidden");
      if (exercisePosEl) exercisePosEl.textContent = "";
      syncShell();
      return;
    }
    worksheetNav.classList.remove("hidden");
    randomWrap.classList.add("hidden");
    var level = currentLevel();
    var pageInstruction = (state.problem && state.problem.instruction) || level.instruction;
    if (level.mode === "geo-length" || level.mode === "freq-table" || !pageInstruction) {
      instructionEl.innerHTML = "";
      instructionEl.classList.add("hidden");
    } else {
      instructionEl.classList.remove("hidden");
      instructionEl.innerHTML =
        DoctematicaMath && DoctematicaMath.proseHTML
          ? DoctematicaMath.proseHTML(pageInstruction)
          : pageInstruction;
    }
    exerciseNumsEl.innerHTML = "";
    var total = level.exercises ? level.exercises.length : 0;
    if (exercisePosEl) {
      exercisePosEl.textContent = total ? "שאלה " + (state.exerciseIndex + 1) + " מתוך " + total : "";
    }
    if (!level.exercises || !level.exercises.length) {
      prevExBtn.classList.add("hidden");
      nextExBtn.classList.add("hidden");
      renderSubJump();
      syncShell();
      return;
    }
    prevExBtn.classList.add("hidden");
    nextExBtn.classList.add("hidden");
    level.exercises.forEach(function (ex, index) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String((level.mode === "system-arrange" || level.mode === "system-quad") && ex.n != null ? ex.n : index + 1);
      btn.className = index === state.exerciseIndex ? "active" : "";
      if (index === state.exerciseIndex) btn.setAttribute("aria-current", "true");
      btn.addEventListener("click", function () {
        state.exerciseIndex = index;
        nextProblem();
      });
      exerciseNumsEl.appendChild(btn);
    });
    renderSubJump();
    syncShell();
  }

  function subtopicList() {
    return ((state.catalog && state.catalog.subtopics) || {})[state.topic] || [];
  }

  function subtopicIndex() {
    var list = subtopicList();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === state.subtopic) return i;
    }
    return -1;
  }

  function renderSubJump() {
    if (!subJumpEl) return;
    var list = subtopicList();
    var index = subtopicIndex();
    if (!isWorksheet() || list.length < 2 || index < 0) {
      subJumpEl.classList.add("hidden");
      return;
    }
    subJumpEl.classList.remove("hidden");
    if (prevSubBtn) prevSubBtn.disabled = index <= 0;
    if (nextSubBtn) nextSubBtn.disabled = index >= list.length - 1;
  }

  function stepSubtopic(dir) {
    var list = subtopicList();
    var index = subtopicIndex();
    var next = list[index + dir];
    if (!next) return;
    selectSubtopic(next);
  }

  function renderTopics() {
    topicsEl.innerHTML = "";
    ((state.catalog && state.catalog.topics) || []).forEach(function (topic) {
      var btn = document.createElement("button");
      btn.type = "button";
      paintNavButton(btn, topic.label, topicIconName(topic.id), topic.id === state.topic, true);
      btn.addEventListener("click", function () {
        selectTopic(topic);
      });
      topicsEl.appendChild(btn);
    });
    renderRail();
    syncShell();
  }

  function renderSubtopics() {
    var list = ((state.catalog && state.catalog.subtopics) || {})[state.topic] || [];
    if (!list.length) {
      subtopicsWrap.classList.add("hidden");
      subtopicsEl.innerHTML = "";
      syncShell();
      return;
    }
    subtopicsWrap.classList.remove("hidden");
    subtopicsEl.innerHTML = "";
    list.forEach(function (item) {
      var btn = document.createElement("button");
      btn.type = "button";
      paintNavButton(btn, item.label, null, item.id === state.subtopic, true);
      btn.addEventListener("click", function () {
        selectSubtopic(item);
      });
      subtopicsEl.appendChild(btn);
    });
    syncShell();
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
    if (typeof DoctematicaBank === "undefined" || !DoctematicaBank.kinds) {
      kindsWrap.classList.add("hidden");
      return;
    }
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
    var found = ((state.catalog && state.catalog.topics) || []).filter(function (t) {
      return t.id === state.topic;
    })[0];
    var label = found ? found.label : "";
    if (
      state.topic === "equations" ||
      state.topic === "analytic" ||
      state.topic === "statistics" ||
      state.topic === "percents" ||
      state.topic === "calculus" ||
      state.topic === "inequalities" ||
      (state.topic === "systems-sub" && (state.subtopic === "elim" || state.subtopic === "arrange"))
    ) {
      var subList =
        ((state.catalog && state.catalog.subtopics) || {})[state.topic] || [];
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

  function streakKey() {
    var p = state.problem || {};
    var id = p.exerciseId || p.id || p.startEquation || "";
    if (!id) return "";
    return String(state.topic || "") + "/" + String(state.subtopic || "") + "/" + String(state.levelId || "") + "/" + id;
  }

  function showFeedback(ok, message, tone) {
    if (!ok && /עוד לא|לא נכון/.test(String(message || ""))) {
      state.streak = 0;
      var key = streakKey();
      if (key && state.streakSeen) delete state.streakSeen[key];
      renderStats();
    }
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
    if (isBiquadMode() && state.factor && state.factor.split) {
      if (sysKnownEl) {
        sysKnownEl.classList.add("hidden");
        sysKnownEl.innerHTML = "";
      }
      if (solveWrap) solveWrap.classList.remove("is-system");
      return;
    }
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
    state.sys.formulaEq = view.formulaEq || "";
    state.sys.formulaLetter = view.formulaLetter || "x";
    state.sys.splitStart = view.splitStart || "";
    state.sys.splitEq = view.splitEq || "";
    state.sys.splitLetter = view.splitLetter || "x";
    state.offerFormula = !!view.offerFormula;
    if (!sysQuadFactorActive()) state.offerSplit = !!view.offerSplit;
    updateFormulaBtn();
    updateSplitBtn();
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
    if (state.sys) state.sys.hintI = 0;
    mathField.clear();
    mathField.setDisabled(false);
    setWorkInput(!!(view && view.input));
    renderSysGuide();
    renderSteps();
    if (view && view.input) mathField.focus();
  }

  function applySysSetup(view) {
    if (view && view.stamp && state.sys && state.sys.stamp !== view.stamp) return;
    if ((state.history && state.history.length) || (state.sys && state.sys.choices && state.sys.choices.length)) return;
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
    if (remote.historyMark) {
      state.history.push(remote.historyMark);
      if (!state.sys.reasons) state.sys.reasons = {};
      if (remote.reason) state.sys.reasons[state.history.length - 1] = remote.reason;
    }
    if (remote.choice) {
      if (!state.sys.choices) state.sys.choices = [];
      state.sys.choices.push(remote.choice);
    }
    if (remote.advice) showChoiceAdvice(remote.advice);
    beginWorkFromView(remote);
  }

  function startSystemSession(problem) {
    var stamp = String(problem.eq1 || "") + "|" + String(problem.eq2 || "");
    state.sys = {
      stamp: stamp,
      eq: [problem.eq1, problem.eq2],
      choices: [],
      known: {},
      found: null,
      workFrom: null,
      workTarget: null,
      givenAt: [],
      keepAt: [],
      reasons: {},
      lcdHats: {},
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
        function (remote) {
          if (remote) remote.stamp = stamp;
          applySysSetup(remote);
        }
      )
    ) {
      showBasicEqServerUnavailable();
    }
  }

  function sysPrepActive() {
    return !!(
      isSystemMode() &&
      state.sys &&
      (state.sys.phase === "prep" || state.sys.phase === "prep_write" || state.sys.phase === "normalize")
    );
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
      var noneAnswer = state.sys.view && state.sys.view.answer;
      showFeedback(
        true,
        noneAnswer === "אין פתרון ממשי"
          ? "<strong>אין פתרון ממשי.</strong>"
          : "<strong>אין פתרון.</strong> המערכת סותרת."
      );
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
    var pairAnswer = state.sys.view && state.sys.view.answer;
    showFeedback(
      true,
      "<strong>כל הכבוד.</strong> " +
        (pairAnswer ||
          "x = " +
            DoctematicaSystems.fmt(state.sys.known.x) +
            ", y = " +
            DoctematicaSystems.fmt(state.sys.known.y)) +
        (extra ? " " + extra : "")
    );
  }

  function renderSysGuide() {
    renderSysKnown();
    if (sysQuadFormulaActive() || sysQuadFactorActive()) {
      sysGuideEl.classList.add("hidden");
      sysGuideEl.innerHTML = "";
      return;
    }
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
    if (sys.phase === "normalize" && view.arrange) {
      sysGuideEl.appendChild(buildSysArrange(view.arrange));
      var arrangeField = sysGuideEl.querySelector("[data-sys-new]");
      if (arrangeField && arrangeField.focus) arrangeField.focus();
      setWorkInput(false);
      checkBtn.classList.remove("hidden");
      return;
    }
    if ((sys.phase === "prep" || sys.phase === "prep_write") && view.prep) {
      sysGuideEl.appendChild(buildSysPrep(view.prep, sys.phase));
      var nextField = sysGuideEl.querySelector("[data-sys-new], .lcd-mul");
      if (nextField && nextField.focus) nextField.focus();
      setWorkInput(false);
      checkBtn.classList.remove("hidden");
      return;
    }
    setWorkInput(!!view.input);
  }

  function readSysMul(raw) {
    var s = String(raw || "")
      .trim()
      .replace(/×/g, "")
      .replace(/[−–—]/g, "-")
      .replace(/^\*/, "");
    if (!s) return null;
    if (!/^[+-]?\d+$/.test(s)) return { bad: true };
    var n = Number(s);
    if (!n || Math.abs(n) < 2) return { bad: true };
    return n;
  }

  function normSysLine(s) {
    return String(s || "")
      .replace(/\s+/g, "")
      .replace(/[−–—]/g, "-");
  }

  function sysHatsHTML(pair, hats) {
    var parts = [];
    var i;
    for (i = 0; i < 2; i++) {
      if (hats && hats[i]) {
        parts.push('<span class="sys-lcd-line">' + buildLcdEqView(hats[i]).outerHTML + "</span>");
      } else if (DoctematicaMath && typeof DoctematicaMath.toHTML === "function") {
        parts.push(DoctematicaMath.toHTML(pair[i] || ""));
      }
    }
    return (
      '<span class="sys" dir="ltr"><span class="sys-brace">{</span><span class="sys-eqs">' +
      parts.join("") +
      "</span></span>"
    );
  }

  function sysStepHTML(eq, hats) {
    var s = String(eq || "");
    if (s.indexOf("sys:") === 0 && hats && (hats[0] || hats[1])) {
      return sysHatsHTML(s.slice(4).split("|"), hats);
    }
    if (s.indexOf("method:") === 0) {
      var methodKey = s.slice(7);
      var methodName =
        methodKey === "elim" ? "שיטת השוואת מקדמים" : methodKey === "equate" ? "השוואה" : "שיטת ההצבה";
      return '<span class="sys-mul-mark" dir="rtl">' + methodName + "</span>";
    }
    if (s.indexOf("mul:") === 0) {
      var bits = s.slice(4).split("|");
      var lines = String(bits[0] || "")
        .split(",")
        .map(function (part) {
          var head = part.split(":");
          var idx = Number(head[0]) + 1;
          var k = String(head[1] || "").replace(/-/g, "−");
          return "משוואה " + idx + ": ×" + k;
        });
      return '<span class="sys-mul-mark" dir="rtl">' + lines.join("<br>") + "</span>";
    }
    if (s.indexOf("sys:") === 0) {
      var pair = s.slice(4).split("|");
      if (DoctematicaMath && typeof DoctematicaMath.systemHTML === "function") {
        return DoctematicaMath.systemHTML(pair[0] || "", pair[1] || "");
      }
    }
    return "";
  }

  function prepEnter(event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (focusMissingFactor()) return;
    if (focusMissingArrange()) return;
    handleSystemSubmit();
  }

  function focusMissingArrange() {
    var sys = state.sys;
    var arrange = sys && sys.view && sys.view.arrange;
    if (!sys || sys.phase !== "normalize" || !arrange || !arrange.open || !sysGuideEl) return false;
    if (!(arrange.open[0] && arrange.open[1])) return false;
    var fields = [
      sysGuideEl.querySelector('[data-sys-new="0"]'),
      sysGuideEl.querySelector('[data-sys-new="1"]'),
    ];
    if (!fields[0] || !fields[1]) return false;
    var filled = [
      !!String(fields[0].value || "").trim(),
      !!String(fields[1].value || "").trim(),
    ];
    if (filled[0] && filled[1]) return false;
    var active = document.activeElement;
    var activeIndex = active === fields[0] ? 0 : active === fields[1] ? 1 : -1;
    if (activeIndex >= 0 && filled[activeIndex] && !filled[1 - activeIndex]) {
      fields[1 - activeIndex].focus();
      return true;
    }
    if (!filled[0] && !filled[1]) return false;
    var empty = !filled[0] ? fields[0] : fields[1];
    empty.focus();
    return true;
  }

  function focusMissingFactor() {
    var sys = state.sys;
    var prep = sys && sys.view && sys.view.prep;
    if (!sys || sys.phase !== "prep" || !prep || !prep.needsBoth || !sysGuideEl) return false;
    var fields = [
      sysGuideEl.querySelector('[data-sys-mul="0"]'),
      sysGuideEl.querySelector('[data-sys-mul="1"]'),
    ];
    if (!fields[0] || !fields[1]) return false;
    var empty = null;
    var i;
    for (i = 0; i < 2; i++) {
      if (!String(fields[i].value || "").trim()) empty = fields[i];
    }
    if (!empty) return false;
    empty.focus();
    return true;
  }

  function buildSysPrep(prep, phase) {
    if (phase === "prep_write" && prep.scale) return buildSysPrepWrite(prep);
    var box = document.createElement("div");
    box.className = "sys-prep";
    var brace = document.createElement("span");
    brace.className = "sys-brace";
    brace.textContent = "{";
    box.appendChild(brace);
    var rows = document.createElement("div");
    rows.className = "sys-prep-rows";
    var eqs = [prep.eq1, prep.eq2];
    var i;
    for (i = 0; i < 2; i++) {
      var row = document.createElement("div");
      row.className = "sys-prep-row";
      var term = document.createElement("span");
      term.className = "lcd-term";
      var mul = document.createElement("input");
      mul.type = "text";
      mul.className = "lcd-mul";
      mul.setAttribute("data-sys-mul", String(i));
      mul.setAttribute("aria-label", "כופל למשוואה " + (i + 1));
      mul.autocomplete = "off";
      mul.placeholder = "×";
      term.appendChild(mul);
      wireLcdMulFit(mul);
      var body = document.createElement("span");
      body.className = "lcd-term-body";
      body.innerHTML = DoctematicaMath.toHTML(eqs[i]);
      term.appendChild(body);
      row.appendChild(term);
      mul.addEventListener("keydown", prepEnter);
      rows.appendChild(row);
    }
    box.appendChild(rows);
    var note = document.createElement("p");
    note.className = "sys-prep-note";
    note.textContent = "סמנו כופל ליד משוואה אחת, או ליד שתיהן.";
    var wrap = document.createElement("div");
    wrap.appendChild(box);
    wrap.appendChild(note);
    return wrap;
  }

  function prepFactors(scale) {
    if (!scale) return [null, null];
    if (scale.factors) {
      return [
        scale.factors[0] == null || scale.factors[0] === "" ? null : scale.factors[0],
        scale.factors[1] == null || scale.factors[1] === "" ? null : scale.factors[1],
      ];
    }
    var out = [null, null];
    if (scale.index === 0 || scale.index === 1) out[scale.index] = scale.k;
    return out;
  }

  function buildSysPrepWrite(prep) {
    var factors = prepFactors(prep.scale);
    var active = [];
    var ai;
    for (ai = 0; ai < 2; ai++) if (factors[ai] != null) active.push(ai);
    var eqs = [prep.eq1, prep.eq2];
    var box = document.createElement("div");
    box.className = "sys-prep";
    var brace = document.createElement("span");
    brace.className = "sys-brace";
    brace.textContent = "{";
    box.appendChild(brace);
    var rows = document.createElement("div");
    rows.className = "sys-prep-rows";
    var i;
    for (i = 0; i < 2; i++) {
      var row = document.createElement("div");
      row.className = "sys-prep-row" + (factors[i] != null ? " is-new" : " is-kept");
      if (factors[i] == null) {
        var kept = document.createElement("span");
        kept.className = "sys-prep-kept";
        kept.innerHTML = DoctematicaMath.toHTML(eqs[i]);
        row.appendChild(kept);
      } else {
        var term = document.createElement("span");
        term.className = "lcd-term";
        var hat = document.createElement("span");
        hat.className = "lcd-mul is-ok lcd-mul-view";
        hat.textContent = "×" + String(factors[i]).replace(/-/g, "−");
        term.appendChild(hat);
        var body = document.createElement("span");
        body.className = "lcd-term-body";
        body.innerHTML = DoctematicaMath.toHTML(eqs[i]);
        term.appendChild(body);
        row.appendChild(term);
        var arrow = document.createElement("span");
        arrow.className = "sys-prep-arrow";
        arrow.textContent = "→";
        row.appendChild(arrow);
        var field = document.createElement("input");
        field.type = "text";
        field.className = "sys-prep-eq";
        field.setAttribute("data-sys-new", String(i));
        field.setAttribute("aria-label", "משוואה " + (i + 1) + " אחרי הכפל");
        field.dir = "ltr";
        field.autocomplete = "off";
        field.placeholder = "המשוואה אחרי הכפל";
        field.addEventListener("keydown", prepEnter);
        row.appendChild(field);
      }
      rows.appendChild(row);
    }
    box.appendChild(rows);
    var note = document.createElement("p");
    note.className = "sys-prep-note";
    if (active.length === 2) {
      note.textContent = "כתבו את שתי המשוואות אחרי הכפל.";
    } else {
      var idx = active.length ? active[0] : 0;
      var other = idx === 0 ? 1 : 0;
      note.textContent = "משוואה " + (other + 1) + " נשארת כמו שהיא. כתבו את משוואה " + (idx + 1) + " אחרי הכפל.";
    }
    var wrap = document.createElement("div");
    wrap.appendChild(box);
    wrap.appendChild(note);
    return wrap;
  }

  function sysLcdFeedback(remote) {
    if (!remote || !remote.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + ((remote && remote.message) || ""));
      return;
    }
    showFeedback(true, "<strong>נכון.</strong> " + (remote.note ? remote.note + " " : "") + (remote.message || ""), "tip");
  }

  function buildArrangeLcd(index, pack) {
    var box = document.createElement("div");
    box.className = "sys-lcd";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ghost";
    btn.textContent = "מכפילים";
    var panel = document.createElement("div");
    panel.className = "sys-lcd-panel";
    panel.hidden = true;
    btn.addEventListener("click", function () {
      panel.hidden = false;
      if (!panel.childNodes.length) renderArrangeLcdAsk(panel, index);
    });
    box.appendChild(btn);
    box.appendChild(panel);
    return box;
  }

  function renderArrangeLcdAsk(panel, index) {
    panel.innerHTML = "";
    var label = document.createElement("label");
    label.textContent = "מכנה משותף ";
    var input = document.createElement("input");
    input.type = "text";
    input.className = "sys-prep-eq";
    input.setAttribute("aria-label", "מכנה משותף למשוואה " + (index + 1));
    input.autocomplete = "off";
    label.appendChild(input);
    panel.appendChild(label);
    var tip = document.createElement("p");
    tip.className = "sys-prep-note";
    tip.textContent = "אפשר גם בלי זה — לכתוב ישר את המשוואה אחרי ביטול המכנים.";
    panel.appendChild(tip);
    input.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      requestSystemsAction(
        { intent: "check", typed: "lcdv:" + index + ":" + input.value, history: state.history || [] },
        function (remote) {
          sysLcdFeedback(remote);
          if (!remote || !remote.ok) {
            input.focus();
            return;
          }
          renderArrangeLcdMuls(panel, index, remote);
        }
      );
    });
    input.focus();
  }

  function renderArrangeLcdMuls(panel, index, remote) {
    panel.innerHTML = "";
    var title = document.createElement("p");
    title.className = "sys-prep-note";
    title.textContent = "מכנה משותף " + remote.lcd + ". מעל כל איבר רשמו בכמה מכפילים.";
    panel.appendChild(title);
    var eqEl = document.createElement("div");
    eqEl.className = "lcd-eq";
    eqEl.setAttribute("data-sys-eq", String(index));
    var terms = remote.terms || [];
    var leftN = remote.leftN || 0;
    appendLcdSide(eqEl, terms.slice(0, leftN), 0, []);
    var eqSign = document.createElement("span");
    eqSign.className = "lcd-op";
    eqSign.textContent = "=";
    eqEl.appendChild(eqSign);
    appendLcdSide(eqEl, terms.slice(leftN), leftN, []);
    var kept = sysGuideEl.querySelector('[data-sys-eq="' + index + '"]');
    var row = kept && kept.closest ? kept.closest(".sys-prep-row") : null;
    if (kept && kept.parentNode) {
      kept.parentNode.replaceChild(eqEl, kept);
      if (row) row.classList.add("is-lcd");
    } else {
      panel.appendChild(eqEl);
    }
    refitLcdMuls(eqEl);
    var fields = eqEl.querySelectorAll(".lcd-mul");
    function submitMuls() {
      var vals = [];
      var fi;
      for (fi = 0; fi < fields.length; fi++) {
        if (!String(fields[fi].value || "").trim()) {
          fields[fi].focus();
          return;
        }
        vals.push(String(fields[fi].value).trim());
      }
      requestSystemsAction(
        {
          intent: "check",
          typed: "lcdm:" + index + ":" + remote.lcd + ":" + vals.join(","),
          history: state.history || [],
        },
        function (res) {
          sysLcdFeedback(res);
          if (!res || !res.ok) return;
          var eqField = sysGuideEl.querySelector('[data-sys-new="' + index + '"]');
          if (eqField && eqField.focus) eqField.focus();
        }
      );
    }
    var mi;
    for (mi = 0; mi < fields.length; mi++) {
      fields[mi].addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        var empty = null;
        var j;
        for (j = 0; j < fields.length; j++) {
          if (!String(fields[j].value || "").trim()) empty = fields[j];
        }
        if (empty && empty !== ev.target && String(ev.target.value || "").trim()) {
          empty.focus();
          return;
        }
        if (empty) {
          empty.focus();
          return;
        }
        submitMuls();
      });
    }
    if (fields[0]) fields[0].focus();
  }

  function buildSysArrange(arrange) {
    var box = document.createElement("div");
    box.className = "sys-prep";
    var brace = document.createElement("span");
    brace.className = "sys-brace";
    brace.textContent = "{";
    box.appendChild(brace);
    var rows = document.createElement("div");
    rows.className = "sys-prep-rows";
    var eqs = [arrange.eq1, arrange.eq2];
    var i;
    for (i = 0; i < 2; i++) {
      var row = document.createElement("div");
      row.className = "sys-prep-row is-new";
      var kept = document.createElement("span");
      kept.className = "sys-prep-kept";
      kept.setAttribute("data-sys-eq", String(i));
      kept.innerHTML = DoctematicaMath.toHTML(eqs[i]);
      var arrow = document.createElement("span");
      arrow.className = "sys-prep-arrow";
      arrow.textContent = "→";
      var field = document.createElement("input");
      field.type = "text";
      field.className = "sys-prep-eq";
      field.setAttribute("data-sys-new", String(i));
      field.setAttribute("aria-label", "משוואה " + (i + 1) + " אחרי הסידור");
      field.dir = "ltr";
      field.autocomplete = "off";
      field.placeholder = "השאירו ריק אם אין שינוי";
      field.addEventListener("keydown", prepEnter);
      row.appendChild(kept);
      row.appendChild(arrow);
      row.appendChild(field);
      rows.appendChild(row);
      if (arrange.lcd && arrange.lcd[i]) rows.appendChild(buildArrangeLcd(i, arrange.lcd[i]));
    }
    box.appendChild(rows);
    var note = document.createElement("p");
    note.className = "sys-prep-note";
    note.textContent = "כתבו משוואה שסידרתם. אם גם השנייה צריכה שינוי, אנטר עובר אליה. משוואה שלא משנים אפשר להשאיר ריקה.";
    var wrap = document.createElement("div");
    wrap.appendChild(box);
    wrap.appendChild(note);
    return wrap;
  }

  function handleArrangeSubmit() {
    var arrange = state.sys && state.sys.view && state.sys.view.arrange;
    if (!arrange) return;
    var current = [arrange.eq1, arrange.eq2];
    var next = current.slice();
    var any = false;
    var i;
    for (i = 0; i < 2; i++) {
      var field = sysGuideEl.querySelector('[data-sys-new="' + i + '"]');
      var typedEq = String((field && field.value) || "").trim();
      if (!typedEq) continue;
      any = true;
      next[i] = typedEq;
    }
    if (!any) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו משוואה אחרי הסידור. משוואה שלא משנים אפשר להשאיר ריקה.");
      return;
    }
    sendPrepCheck("sys:" + next[0] + "|" + next[1]);
  }

  function sendPrepCheck(typed, scale) {
    var payload = {
      intent: "check",
      typed: typed,
      history: state.history || [],
      choices: (state.sys && state.sys.choices) || [],
    };
    if (scale) payload.scale = scale;
    if (equationsCheckBusy) return;
    if (
      !requestSystemsAction(payload, function (remote) {
        applySysCheckView(typed, remote);
      })
    ) {
      showBasicEqServerUnavailable();
    }
  }

  function handlePrepSubmit() {
    var sys = state.sys;
    var prep = sys && sys.view && sys.view.prep;
    if (!prep) return;
    if (sys.phase === "prep_write" && prep.scale) {
      var factors = prepFactors(prep.scale);
      var current = [prep.eq1, prep.eq2];
      var wi;
      for (wi = 0; wi < 2; wi++) {
        if (factors[wi] == null) continue;
        var field = sysGuideEl.querySelector('[data-sys-new="' + wi + '"]');
        var typedEq = String((field && field.value) || "").trim();
        if (!typedEq || normSysLine(typedEq) === normSysLine(current[wi])) {
          showFeedback(false, "<strong>עוד לא.</strong> כתבו את משוואה " + (wi + 1) + " אחרי הכפל.");
          return;
        }
        current[wi] = typedEq;
      }
      sendPrepCheck("sys:" + current[0] + "|" + current[1]);
      return;
    }
    var m0 = readSysMul(sysGuideEl.querySelector('[data-sys-mul="0"]').value);
    var m1 = readSysMul(sysGuideEl.querySelector('[data-sys-mul="1"]').value);
    if ((m0 && m0.bad) || (m1 && m1.bad)) {
      showFeedback(false, "<strong>עוד לא.</strong> הכופל צריך להיות מספר שלם שונה מ־1.");
      return;
    }
    if (prep.needsBoth && !(m0 && m1)) {
      showFeedback(false, "<strong>עוד לא.</strong> כאן צריך כופל לשתי המשוואות. כתבו את שניהם, ואז בדיקה.");
      var missing = sysGuideEl.querySelector('[data-sys-mul="' + (m0 ? "1" : "0") + '"]');
      if (missing && missing.focus) missing.focus();
      return;
    }
    var parts = [];
    if (m0) parts.push("0:" + m0);
    if (m1) parts.push("1:" + m1);
    if (!parts.length) {
      showFeedback(false, "<strong>עוד לא.</strong> סמנו כופל ליד משוואה אחת, או ליד שתיהן.");
      return;
    }
    sendPrepCheck("mul:" + parts.join(",") + "|" + prep.eq1 + "|" + prep.eq2);
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
    if (state.sys && remote.reason) {
      if (!state.sys.reasons) state.sys.reasons = {};
      state.sys.reasons[state.history.length - 1] = remote.reason;
    }
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
    showFeedback(true, "<strong>צעד חוקי.</strong> " + (remote.message || "") + (remote.note ? " " + remote.note : ""));
    if (remote.input) mathField.focus();
    renderSysGuide();
  }

  function applySysTaughtStep(remote) {
    remote = remote || {};
    if (remote.done && !remote.step) {
      showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "הפתרון כבר הושלם."), "tip");
      return;
    }
    if (!remote.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + (remote.message || "לא הצלחתי לבצע את הצעד."));
      return;
    }
    if (!state.sys) return;
    if (!state.sys.reasons) state.sys.reasons = {};
    if (!state.sys.choices) state.sys.choices = [];
    state.sys.pendingChoice = null;
    if (remote.choice) state.sys.choices.push(remote.choice);
    if (remote.startEq) {
      if (!state.history.length || state.history[state.history.length - 1] !== remote.startEq) {
        state.history.push(remote.startEq);
        if (!state.sys.givenAt) state.sys.givenAt = [];
        state.sys.givenAt.push(state.history.length - 1);
      }
    }
    if (remote.step) {
      state.history.push(remote.step);
      if (remote.reason) state.sys.reasons[state.history.length - 1] = remote.reason;
      if (remote.lcdHats) {
        if (!state.sys.lcdHats) state.sys.lcdHats = {};
        state.sys.lcdHats[state.history.length - 1] = remote.lcdHats;
      }
      if (remote.keep) markKeep();
    }
    mergeSysFromView(remote);
    mathField.clear();
    renderSteps();
    renderSysGuide();
    if (remote.solved) {
      finishSystem(remote.kind);
      return;
    }
    showFeedback(true, "<strong>צעד של האתר.</strong> " + siteReasonHTML(remote.reason || ""), "tip");
    if (remote.input) mathField.focus();
  }

  function handleSystemSubmit() {
    var sys = state.sys;
    if (!sys) return;
    if (sys.phase === "prep" || sys.phase === "prep_write") {
      handlePrepSubmit();
      return;
    }
    if (sys.phase === "normalize") {
      handleArrangeSubmit();
      return;
    }
    var writing =
      String(sys.phase).indexOf("work") === 0 ||
      sys.phase === "final_pair" ||
      sys.phase === "isolate" ||
      sys.phase === "equate" ||
      sys.phase === "solve" ||
      sys.phase === "plug" ||
      sys.phase === "yval" ||
      sys.phase === "pair" ||
      sys.phase === "conclude" ||
      sys.phase === "quad" ||
      sys.phase === "back";
    if (!writing) return;
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

  function loneUnlabeledTask(task) {
    var pack = state.problem && state.problem.geo;
    if (!pack || !task || !DoctematicaGeometry.currentPartText) return false;
    var part = DoctematicaGeometry.currentPartText(pack, state.geo);
    if (!part || part.label) return false;
    var ids = part.taskIds || [];
    return ids.length <= 1;
  }

  function ensureGeoTaskHeader(task) {
    if (loneUnlabeledTask(task)) return;
    if (!task || !DoctematicaGeometry.taskStepLabel) return;
    var label = DoctematicaGeometry.taskStepLabel(task);
    if (!label) return;
    var marker = "משימה:" + label;
    if (state.history.indexOf(marker) >= 0) return;
    state.history.push(marker);
  }

  function ensureGeoFocusTaskHeader(pack, geo) {
    if (!pack || !DoctematicaGeometry.taskStepLabel) return;
    var heading =
      DoctematicaGeometry.partHeadingTask && DoctematicaGeometry.partHeadingTask(pack, geo || state.geo);
    if (loneUnlabeledTask(heading)) return;
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
    if (formulaWorkActive()) hideMath = true;
    if (mathKeysEl) {
      if (hideMath) mathKeysEl.classList.add("hidden");
      else mathKeysEl.classList.remove("hidden");
    }
    if (formulaWorkActive() && mathWrap) mathWrap.classList.add("hidden");
  }

  function siteReasonHTML(text) {
    if (!text) return "";
    if (DoctematicaMath && DoctematicaMath.proseHTML) return DoctematicaMath.proseHTML(text);
    return String(text);
  }

  function appendSiteWhy(body, text) {
    if (!text) return;
    var why = document.createElement("span");
    why.className = "sys-step-why";
    why.innerHTML = siteReasonHTML(text);
    body.appendChild(why);
  }

  function rememberHistoryReason(reason) {
    if (!reason || !eqNotesActive()) return;
    state.eqReasons = state.eqReasons || {};
    state.eqReasons[state.history.length - 1] = reason;
  }

  function siteStepMessage(reason, plain) {
    if (reason && eqNotesActive()) return "<strong>צעד של האתר.</strong> " + siteReasonHTML(reason);
    return plain;
  }

  function appendHistorySiteNote(li, body, index, isGiven) {
    if (isIneqMode() || isIntervalMode() || isQuadIneqMode()) {
      if (state.eqReasons && state.eqReasons[index]) {
        appendSiteWhy(body, state.eqReasons[index]);
        li.classList.add("has-why");
      }
      return;
    }
    if (!eqNotesActive()) return;
    if (state.eqReasons && state.eqReasons[index]) appendSiteWhy(body, state.eqReasons[index]);
    if (!isGiven && !(state.eqReasons && state.eqReasons[index])) appendEqUserNote(li, String(index));
  }

  function appendQuadTrailNote(li, body, item, index) {
    if (!eqNotesActive()) return;
    if (item && item.reason) appendSiteWhy(body, item.reason);
    else appendEqUserNote(li, "q:" + index);
  }

  function appendEqUserNote(parent, key) {
    if (!eqNotesActive() || !key) return;
    var saved = state.eqNotes && state.eqNotes[key];
    if (!saved && state.locked) return;
    var noteWrap = document.createElement("div");
    noteWrap.className = "step-note";
    if (saved) {
      noteWrap.classList.add("has-text");
      if (DoctematicaMath && DoctematicaMath.proseHTML) noteWrap.innerHTML = DoctematicaMath.proseHTML(saved);
      else noteWrap.textContent = saved;
    } else if (state.eqNoteOpen === key) {
      var ta = document.createElement("textarea");
      ta.rows = 2;
      ta.dir = "rtl";
      ta.className = "step-note-input";
      ta.placeholder = "נימוק";
      function saveNote() {
        state.eqNotes = state.eqNotes || {};
        var text = ta.value.trim();
        if (text) state.eqNotes[key] = text;
        else delete state.eqNotes[key];
        state.eqNoteOpen = null;
        renderSteps();
      }
      ta.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" && !ev.shiftKey) {
          ev.preventDefault();
          saveNote();
        }
      });
      var saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "step-note-save";
      saveBtn.textContent = "שמירה";
      saveBtn.addEventListener("click", saveNote);
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
        state.eqNoteOpen = key;
        renderSteps();
      });
      noteWrap.appendChild(askBtn);
    }
    parent.appendChild(noteWrap);
    if (parent.tagName === "LI") parent.classList.add("has-step-note");
  }

  function quadSketchVisible() {
    var el = document.getElementById("quad-ineq");
    return !!(isQuadIneqMode() && el && !el.classList.contains("hidden"));
  }

  function isQuadSolutionLine(eq) {
    var t = String(eq || "").trim();
    if (!t) return false;
    var start = state.problem && state.problem.startEquation ? String(state.problem.startEquation) : "";
    var norm = function (s) {
      return String(s || "").replace(/\s+/g, "").replace(/−/g, "-").replace(/≤/g, "<=").replace(/≥/g, ">=");
    };
    if (start && norm(t) === norm(start)) return false;
    if (/אין\s*פתרון|כל\s*x|ℝ|∅/.test(t)) return true;
    if (!/[<>≤≥]/.test(t) && t.indexOf("או") < 0) return false;
    if (/x\s*\^|x²|²/.test(t)) return false;
    return true;
  }

  function clearQuadAnswerSteps() {
    var slot = document.getElementById("quad-answer-steps");
    if (!slot) return;
    slot.innerHTML = "";
    slot.classList.add("hidden");
  }

  function renderQuadAnswerSteps(items) {
    var slot = document.getElementById("quad-answer-steps");
    if (!slot) return;
    slot.innerHTML = "";
    if (!items || !items.length) {
      slot.classList.add("hidden");
      return;
    }
    items.forEach(function (item) {
      var li = document.createElement("li");
      var n = document.createElement("span");
      n.className = "n";
      n.textContent = item.num;
      var body = document.createElement("span");
      body.innerHTML = DoctematicaMath.toHTML(item.eq);
      appendHistorySiteNote(li, body, item.index, false);
      li.appendChild(n);
      li.appendChild(body);
      if (state.locked && item.index === state.history.length - 1) li.classList.add("solved-row");
      slot.appendChild(li);
    });
    slot.classList.remove("hidden");
  }

  function renderSteps() {
    snapshotBiquadDrafts();
    if (isBiquadMode() && state.factor && state.factor.split && state.history.length) {
      var stray = String(state.history[state.history.length - 1] || "")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "");
      if (/^\([^()]*t[^()]*\)\([^()]*t[^()]*\)=0$/i.test(stray)) state.history.pop();
    }
    stepsEl.innerHTML = "";
    clearQuadAnswerSteps();
    if (state.problem && (state.problem.mode === "freq-table" || state.problem.mode === "percent")) {
      renderFreqSteps();
      return;
    }
    if (state.problem && state.problem.mode === "fn") {
      renderFnSteps();
      return;
    }
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
        factorForkLive();
      if (geoFactorSplit) {
        stepsEl.appendChild(renderFactorFork(stepNum + 1));
      }
      var liveTrail =
        formulaWorkActive() && state.quad && state.quad.trail && state.quad.trail.length && !formulaSplitOwned()
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
          appendQuadTrailNote(liQ, bodyQ, item, index);
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
    if (
      formulaWorkActive() &&
      state.quad &&
      state.quad.trail &&
      state.quad.trail.length &&
      !isSystemMode() &&
      !isHighChainServerMode() &&
      !isBiquadMode()
    ) {
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
          appendHistorySiteNote(li0, body0, index, index === 0);
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
        appendQuadTrailNote(li, body, item, index);
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
      factorForkLive();
    var deferredAnswers = [];
    var deferQuadAnswer = quadSketchVisible();
    state.history.forEach(function (eq, index) {
      if (deferQuadAnswer && isQuadSolutionLine(eq)) {
        deferredAnswers.push({ eq: eq, index: index, num: String(++stepNum.n) });
        return;
      }
      var li = document.createElement("li");
      var n = document.createElement("span");
      n.className = "n";
      var isGiven = isIntervalMode() ? false : givenAt ? givenAt.indexOf(index) !== -1 : index === 0;
      n.textContent = isGiven ? "נתון" : String(++stepNum.n);
      var body = document.createElement("span");
      var hats = state.sys && state.sys.lcdHats && state.sys.lcdHats[index];
      var sysHtml = isSystemMode() ? sysStepHTML(eq, hats) : "";
      var mark = state.lcdMarks && state.lcdMarks[index];
      if (sysHtml) {
        body.innerHTML = sysHtml;
        refitLcdMuls(body);
      } else if (mark) {
        body.appendChild(buildLcdEqView(mark));
        refitLcdMuls(body);
      } else {
        body.innerHTML = DoctematicaMath.toHTML(eq);
      }
      var whyText = state.sys && state.sys.reasons && state.sys.reasons[index];
      if (whyText && isSystemMode()) {
        appendSiteWhy(body, whyText);
      }
      appendHistorySiteNote(li, body, index, isGiven);
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
      if (
        state.locked &&
        !factorSplit &&
        (index === state.history.length - 1 || isAnsweredRootLine(eq))
      ) {
        li.classList.add("solved-row");
      }
      stepsEl.appendChild(li);
      if (index === 0) appendDomainHistorySteps(stepsEl, stepNum);
    });
    if (
      isSystemMode() &&
      formulaWorkActive() &&
      state.quad &&
      state.quad.trail &&
      state.quad.trail.length
    ) {
      state.quad.trail.forEach(function (item, index) {
        var liF = document.createElement("li");
        var nF = document.createElement("span");
        nF.className = "n";
        nF.textContent = index === 0 ? "מקדמים" : String(index);
        var bodyF = document.createElement("span");
        bodyF.innerHTML = item.html;
        appendQuadTrailNote(liF, bodyF, item, index);
        liF.appendChild(nF);
        liF.appendChild(bodyF);
        stepsEl.appendChild(liF);
      });
    }
    if (factorSplit) {
      stepsEl.appendChild(renderFactorFork(stepNum.n + 1));
    }
    if (
      (isHighChainServerMode() || isBiquadMode()) &&
      formulaWorkActive() &&
      state.quad &&
      state.quad.trail &&
      state.quad.trail.length &&
      !formulaSplitOwned()
    ) {
      state.quad.trail.forEach(function (item, index) {
        var liC = document.createElement("li");
        var nC = document.createElement("span");
        nC.className = "n";
        nC.textContent = index === 0 ? "מקדמים" : String(index);
        var bodyC = document.createElement("span");
        bodyC.innerHTML = item.html;
        appendQuadTrailNote(liC, bodyC, item, index);
        liC.appendChild(nC);
        liC.appendChild(bodyC);
        if (state.locked && index === state.quad.trail.length - 1) liC.classList.add("solved-row");
        stepsEl.appendChild(liC);
      });
    }
    if (!stepsEl.children.length) stepsEl.classList.add("hidden");
    renderQuadAnswerSteps(deferredAnswers);
    renderFactorGuide();
    renderDomainGuide();
    syncBiquadColumnsEntry();
  }

  function rootRhsStillOpen(rhs) {
    var t = String(rhs || "").replace(/\s+/g, "");
    if (!t) return false;
    if (/[·*×]/.test(t)) return true;
    if (/√|sqrt/i.test(t)) return false;
    if (/[+]/.test(t.replace(/^[+±]/, ""))) return true;
    var bare = t.replace(/[()]/g, "");
    var body = bare.replace(/^[+±-]/, "");
    if (/[+-]/.test(body)) return true;
    if (!/\//.test(t)) return false;
    var Alg = window.DoctematicaAlgebra;
    if (!Alg || typeof Alg.isolatedRhsKind !== "function") return true;
    return Alg.isolatedRhsKind("x=" + t, "x") !== "value";
  }

  function isAnsweredRootLine(eq) {
    var t = String(eq || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/²/g, "^2")
      .replace(/³/g, "^3")
      .replace(/⁴/g, "^4")
      .replace(/⁵/g, "^5")
      .replace(/⁶/g, "^6");
    if (!t) return false;
    if (/^אין/.test(t)) return true;
    var parts = t.split(/,|;|או/);
    var seen = 0;
    var i;
    for (i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p) continue;
      var m = p.match(/^[a-zA-Z]=(.+)$/);
      if (!m) return false;
      var rhs = m[1].replace(/sqrt/gi, "").replace(/±/g, "").replace(/\+\-/g, "");
      if (/[a-zA-Z]/.test(rhs)) return false;
      if (rootRhsStillOpen(rhs)) return false;
      seen += 1;
    }
    return seen > 0;
  }

  function renderFactorFork(baseNum) {
    var st = state.factor;
    var letters = ["א", "ב", "ג", "ד", "ה", "ו"];
    var wrap = document.createElement("li");
    wrap.className = "factor-fork";
    if (st.splitReason && eqNotesActive()) {
      var splitWhy = document.createElement("div");
      splitWhy.className = "sys-step-why";
      splitWhy.innerHTML = siteReasonHTML(st.splitReason);
      wrap.appendChild(splitWhy);
    }
    var i;
    var branchCount = st.eqs && st.eqs.length ? st.eqs.length : st.heads && st.heads.length ? st.heads.length : 2;
    if (branchCount === 1) wrap.style.gridTemplateColumns = "1fr";
    if (isBiquadMode()) state.biquadFields = [];
    for (i = 0; i < branchCount; i++) {
      var col = document.createElement("div");
      col.className = "factor-branch" + (st.solved && st.solved[i] ? " is-done" : "");
      if (st.heads && st.heads[i]) {
        var head = document.createElement("div");
        head.className = "factor-branch-step";
        var headN = document.createElement("span");
        headN.className = "n";
        headN.textContent = letters[i] || String(i + 1);
        var headBody = document.createElement("span");
        headBody.innerHTML = DoctematicaMath.toHTML(st.heads[i]);
        head.appendChild(headN);
        head.appendChild(headBody);
        col.appendChild(head);
      }
      var trail = st.trails[i] && st.trails[i].length ? st.trails[i] : [];
      if (!trail.length && st.eqs[i] && !isBiquadMode()) trail = [st.eqs[i]];
      var branchSession = branchFormulaSession(i);
      var formulaTrail = branchSession && branchSession.trail && branchSession.trail.length ? branchSession.trail.slice() : null;
      var earlyLines = [];
      var answerLines = [];
      trail.forEach(function (eq) {
        if (formulaTrail && isAnsweredRootLine(eq)) answerLines.push(eq);
        else earlyLines.push(eq);
      });
      if (formulaTrail && answerLines.length) {
        var lastHtml = String((formulaTrail[formulaTrail.length - 1] && formulaTrail[formulaTrail.length - 1].html) || "");
        var lastText = lastHtml.replace(/<[^>]+>/g, "").replace(/[−–—]/g, "-").replace(/\s+/g, "");
        var ansText = String(answerLines[answerLines.length - 1] || "").replace(/[−–—]/g, "-").replace(/\s+/g, "");
        if (lastText && ansText && lastText === ansText) formulaTrail = formulaTrail.slice(0, -1);
      }
      function appendBranchLine(eq, k, answered) {
        var row = document.createElement("div");
        row.className =
          "factor-branch-step" +
          (answered ? " is-final" : "") +
          (!st.solved[i] && k === earlyLines.length - 1 && !answered && !formulaTrail ? " is-current" : "");
        var n = document.createElement("span");
        n.className = "n";
        n.textContent = baseNum + k + "." + (letters[i] || String(i + 1));
        var body = document.createElement("span");
        body.innerHTML = DoctematicaMath.toHTML(eq);
        var branchWhy = st.why && st.why[i + ":" + k];
        if (branchWhy) appendSiteWhy(body, branchWhy);
        else if (!(k === 0 && st.splitReason)) appendEqUserNote(row, "f:" + i + ":" + k);
        row.appendChild(n);
        row.appendChild(body);
        if (answered) {
          var ok = document.createElement("span");
          ok.className = "factor-eq-n";
          ok.textContent = "✓";
          row.appendChild(ok);
        }
        col.appendChild(row);
      }
      earlyLines.forEach(function (eq, k) {
        appendBranchLine(eq, k, false);
      });
      if (!formulaTrail) {
        var owned = state.factor && state.factor.work && state.factor.work[i] && state.factor.work[i].history;
        (owned || []).forEach(function (line) {
          var ownedRow = document.createElement("div");
          ownedRow.className = "factor-branch-step";
          ownedRow.innerHTML = DoctematicaMath.toHTML(String(line).replace(/-/g, "−"));
          col.appendChild(ownedRow);
        });
      }
      if (formulaTrail) {
        formulaTrail.forEach(function (item) {
          var liveRow = document.createElement("div");
          liveRow.className = "factor-branch-step";
          liveRow.innerHTML = (item && item.html) || "";
          col.appendChild(liveRow);
        });
      }
      answerLines.forEach(function (eq, k) {
        appendBranchLine(eq, earlyLines.length + k, true);
      });
      col.addEventListener("mousedown", function (event) {
        if (event.target && event.target.closest && event.target.closest(".factor-branch-math, input, textarea")) return;
        selectSplitBranch(i);
      });
      if (isBiquadMode() && !(st.solved && st.solved[i])) {
        (function (branchIdx) {
          var host = document.createElement("div");
          host.className = "math-line factor-branch-math";
          host.setAttribute("data-branch", String(branchIdx));
          host.setAttribute("aria-label", "ענף " + (letters[branchIdx] || String(branchIdx + 1)));
          var field = new DoctematicaMathField(host, null, { keyboard: false });
          var draft = state.biquadDrafts && state.biquadDrafts[branchIdx];
          if (draft && draft.length) field.loadParts(JSON.parse(JSON.stringify(draft)));
          host.addEventListener("focusin", function () {
            state.biquadActiveBranch = branchIdx;
          });
          host.addEventListener("keydown", function (event) {
            if (event.key !== "Enter") return;
            event.preventDefault();
            event.stopPropagation();
            var text = field.serialize().trim();
            if (!text) return;
            applyBiquadTyped(text, branchIdx);
          });
          col.addEventListener("mousedown", function (event) {
            if (event.target && event.target.closest && event.target.closest(".factor-branch-math")) return;
            event.preventDefault();
            field.focus();
          });
          state.biquadFields.push({ index: branchIdx, field: field });
          col.appendChild(host);
        })(i);
      }
      wrap.appendChild(col);
    }
    if (isBiquadMode()) rememberBiquadTarget();
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
    var v = isBiquadMode() ? "t" : "x";
    if (want.kind === "one") return v + " = ";
    return sign > 0 ? v + "₁ = " : v + "₂ = ";
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

  function pushRootTrail(sign, numText, denText, valText, reason) {
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
        if (reason && eqNotesActive() && !last.reason) last.reason = reason;
        return;
      }
    }
    var rootRow = {
      html: rootFracLine(sign, numText, denText, valText).outerHTML,
      rootSign: sign,
    };
    if (reason && eqNotesActive()) rootRow.reason = reason;
    trail.push(rootRow);
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

  function pushTrailHtml(html, reason) {
    var trail = state.quad.trail;
    if (!trail.length || trail[trail.length - 1].html !== html) {
      var item = { html: html };
      if (reason && eqNotesActive()) item.reason = reason;
      trail.push(item);
    }
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
    if (isBiquadMode() && state.factor && state.factor.split) {
      hideQuadGuide();
      if (sysKnownEl) {
        sysKnownEl.classList.add("hidden");
        sysKnownEl.innerHTML = "";
      }
      if (solveWrap) solveWrap.classList.remove("is-system");
      return;
    }
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
      if (isSystemQuadMode() && state.sys && state.sys.formulaLetter === "y") {
        var yNote = document.createElement("p");
        yNote.className = "q-note";
        yNote.textContent = "הנעלם במשוואה הוא y. בנוסחה רושמים אותו כ־x, והשורשים יחזרו כ־y.";
        quadGuideEl.appendChild(yNote);
      }
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
      isFormulaServerMode() ||
      sysQuadFormulaActive() ||
      (isHighChainServerMode() && mixedPath() === "formula") ||
      (isBiquadMode() && mixedPath() === "formula") ||
      ((isMixedServerMode() || geoEqSolveActive() || fnFormulaActive() || isQuadIneqMode()) && mixedPath() === "formula")
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
    if (isBiquadMode() && mixedPath() === "formula") {
      var tEq = state.biquadFormulaEq || lastHistoryEq();
      return requestBiquadAction(
        Object.assign(
          {
            intent: extra.intent || "check",
            start: (state.problem && state.problem.startEquation) || tEq,
            history: state.history && state.history.length ? state.history : [tEq],
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
    if (fnFormulaActive() && state.fnView && state.fnView.fork && state.fnView.fork.eqs && state.fnView.fork.eqs.length) {
      return requestFunctions(
        Object.assign(
          {
            intent: extra.intent || "check",
            phase: q.phase,
            letter: q.abcAt,
            slots: Object.assign({}, q.abcGot || {}, collectQuadSlots()),
            root: q.root,
            compute: q.compute,
            md53: !!(state.mixed && state.mixed.md53),
            branch: state.fnFormulaBranch,
            formulaBranch: state.fnFormulaBranch,
          },
          extra
        ),
        function (remote) {
          remote = remote || {};
          if (remote.progress) {
            state.fn = state.fn || {};
            state.fn.progress = remote.progress;
          }
          if (remote.view) state.fnView = remote.view;
          var quadRes = remote.formulaView ? Object.assign({}, remote, { view: remote.formulaView }) : remote;
          onResult(quadRes);
          syncFnAsk();
          renderFnSteps();
        }
      );
    }
    if (isHighChainServerMode() && mixedPath() === "formula") {
      var branchEq = (state.factor && state.factor.formulaEq) || "";
      return requestHighPowerAction(
        Object.assign(
          {
            intent: extra.intent || "check",
            start: (state.problem && state.problem.startEquation) || branchEq,
            history: state.history && state.history.length ? state.history : [branchEq],
            phase: q.phase,
            letter: q.abcAt,
            slots: collectQuadSlots(),
            root: q.root,
            compute: q.compute,
            md53: !!(state.mixed && state.mixed.md53),
            formulaBranch: state.factor && state.factor.formulaBranch,
            factor: factorPayload(),
          },
          extra
        ),
        onResult
      );
    }
    var sysStart = sysQuadFormulaActive() && state.sys && state.sys.formulaEq ? state.sys.formulaEq : "";
    return requestQuadraticAction(
      Object.assign(
        {
          intent: extra.intent || "check",
          subtopic: sysStart ? "mixed" : undefined,
          start: sysStart || (state.problem && state.problem.startEquation) || lastHistoryEq(),
          history: sysStart
            ? [sysStart]
            : state.history && state.history.length
              ? state.history
              : [(state.problem && state.problem.startEquation) || ""],
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
    res = softenQuadIneqSolve(res || {});
    mergeQuadView(res.view);
    if (res.answer) mergeQuadView({ answer: res.answer, kind: res.kind });
    var q = state.quad;
    if (res.fill) applyQuadFill(res.fill);
    if (Array.isArray(res.work) && state.factor) state.factor.work = res.work;
    if (q.phase === "abc" && res.ok && res.nextPhase === "abc" && res.nextLetter) {
      var letter = q.abcAt || "a";
      if (!q.abcGot) q.abcGot = {};
      q.abcGot[letter] = slotVal(letter) || (res.fill && res.fill[letter]) || "";
      state.stats.try += 1;
      saveStats();
      renderStats();
      q.abcAt = res.nextLetter;
      showFeedback(
        true,
        siteStepMessage(res.reason, "<strong>נכון.</strong> " + (res.message || "עכשיו " + res.nextLetter + "."))
      );
      renderQuadGuide();
      if (formulaSplitOwned()) renderSteps();
      return;
    }
    if (q.phase === "rootwork") {
      applyQuadRootworkServer(res);
      return;
    }
    if (res.solved) {
      if (res.answer) mergeQuadView({ answer: res.answer, kind: res.kind });
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
      pushRootTrail(sign, q.root.lastNum, q.root.lastDen, null, res.reason);
      if (q.root.numDone && String(Q.numWant(want, sign) || "")) q.root.lastNum = String(Q.numWant(want, sign));
      if (q.root.denDone && String(Q.denWant(want) || "")) q.root.lastDen = String(Q.denWant(want));
      showFeedback(true, siteStepMessage(res.reason, "<strong>נכון.</strong> " + res.message));
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
    pushRootTrail(sign, q.root.lastNum, q.root.lastDen, shown, res.reason);
    if (res.nextRoot === -1 || res.nextLetter === "x2") {
      q.root.plusDone = true;
      openRootChain(-1);
      showFeedback(true, siteStepMessage(res.reason, "<strong>נכון.</strong> עכשיו חשבו את x₂."));
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
            var progItem = { html: snap };
            if (result.reason && eqNotesActive()) progItem.reason = result.reason;
            q.trail.push(progItem);
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
          siteStepMessage(
            result.reason,
            "<strong>נכון.</strong> " +
              (progressed && q.compute.lastDisc
                ? "עכשיו חשבו את " + prettyPart(q.compute.lastDisc) + "."
                : result.message)
          )
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
      if (!formulaSplitOwned()) {
        var abcItem = {
          html:
            '<span class="m-expr" dir="ltr">a = ' +
            String(want.a).replace(/-/g, "−") +
            ", b = " +
            String(want.b).replace(/-/g, "−") +
            ", c = " +
            String(want.c).replace(/-/g, "−") +
            "</span>",
        };
        if (result.reason && eqNotesActive()) abcItem.reason = result.reason;
        q.trail.push(abcItem);
      }
      if (state.mixed && state.mixed.md53) {
        renderQuadGuide();
        renderSteps();
        finishQuad("לפי md53: " + String(result.answer || want.answer || ""));
        return;
      }
      q.phase = result.nextPhase || "plug";
      showFeedback(true, siteStepMessage(result.reason, "<strong>נכון.</strong> " + result.message));
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (q.phase === "plug") {
      var plugItem = { html: buildQuadFormula("plugged").outerHTML };
      if (result.reason && eqNotesActive()) plugItem.reason = result.reason;
      q.trail.push(plugItem);
      q.phase = "compute";
      q.compute = {};
      showFeedback(true, siteStepMessage(result.reason, "<strong>נכון.</strong> " + result.message));
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (q.phase === "compute") {
      q.discDone = true;
      var compItem = { html: buildQuadFormula("computed").outerHTML };
      if (result.reason && eqNotesActive()) compItem.reason = result.reason;
      q.trail.push(compItem);
      if (result.solved) {
        finishQuad(result.message || "");
        return;
      }
      q.phase = result.nextPhase || (want.kind === "none" ? "count" : "sqrt");
      q.compute = {};
      showFeedback(true, siteStepMessage(result.reason, "<strong>נכון.</strong> " + result.message));
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (q.phase === "sqrt") {
      q.sDone = true;
      var rootItem = { html: buildQuadFormula("rooted").outerHTML };
      if (result.reason && eqNotesActive()) rootItem.reason = result.reason;
      q.trail.push(rootItem);
      q.phase = "count";
      showFeedback(true, siteStepMessage(result.reason, "<strong>נכון.</strong> " + result.message));
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (q.phase === "count") {
      if (!result.skip) {
        var kindItem = { html: Q.kindLabel(want.kind) };
        if (result.reason && eqNotesActive()) kindItem.reason = result.reason;
        q.trail.push(kindItem);
      }
      if (want.kind === "none") {
        q.phase = "nosol";
      } else {
        q.phase = "rootwork";
        q.root = { plusDone: false, minusDone: false };
        openRootChain(1);
      }
      showFeedback(true, siteStepMessage(result.reason, "<strong>נכון.</strong> " + result.message));
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (q.phase === "nosol") {
      pushTrailHtml(Q.kindLabel("none"), result.reason);
      finishQuad(result.message);
      return;
    }
    if (q.phase === "roots") {
      finishQuad(result.message);
    }
  }

  function finishEqSolveForQuadIneq(answer) {
    if (!isQuadIneqMode()) return false;
    var bits = [];
    if (state.factor && state.factor.trails) {
      state.factor.trails.forEach(function (tr) {
        (tr || []).forEach(function (line) {
          var bit = String(line || "").trim();
          if (/^[A-Za-z]\s*=/.test(bit.replace(/[−–—]/g, "-"))) bits.push(bit);
        });
      });
    }
    var text = String(answer || "").trim();
    if (text && text !== "x = , x = " && bits.indexOf(text) < 0) bits.push(text);
    bits.forEach(function (bit) {
      if (!bit || bit === "x = , x = ") return;
      if (state.history[state.history.length - 1] === bit) return;
      state.history.push(bit);
      rememberHistoryReason("אלה נקודות האפס של הביטוי.");
    });
    state.mixed = emptyMixedState();
    state.quad = null;
    state.factor = emptyFactorState();
    state.offerFormula = false;
    state.quadIneq = state.quadIneq || {};
    state.quadIneq.phase = "signs";
    state.quadIneq.rootsDone = true;
    state.locked = false;
    if (mathField) mathField.setDisabled(false);
    if (checkBtn) checkBtn.disabled = false;
    if (nextAfterSolveBtn) nextAfterSolveBtn.classList.add("hidden");
    hideQuadGuide();
    setQuadInput(true);
    updateFormulaBtn();
    updateSplitBtn();
    setModeUi();
    renderSteps();
    requestQuadIneq({ intent: "regions" }, function (remote) {
      if (window.DoctematicaQuadIneq && remote && remote.roots) {
        DoctematicaQuadIneq.open("signs");
        DoctematicaQuadIneq.setModel({ roots: remote.roots, regions: remote.regions || [] });
      }
      showFeedback(
        true,
        siteStepMessage(
          "מצאתם את נקודות האפס. עכשיו שרטטו את התחומים, בדקו סימנים, או רשמו את הפתרון.",
          "<strong>נקודות האפס נמצאו.</strong> התרגיל עוד לא נגמר: מוצאים את התחומים שפותרים את אי־השוויון."
        ),
        "tip"
      );
    });
    return true;
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
    if (isHighChainServerMode()) {
      finishChainFormula(ans);
      return;
    }
    if (isBiquadMode()) {
      finishBiquadFormula(ans);
      return;
    }
    if (finishEqSolveForSys(ans)) return;
    if (finishEqSolveForFn(ans)) return;
    if (finishEqSolveForGeo(ans || (state.problem.quad && state.problem.quad.answer))) return;
    if (finishEqSolveForQuadIneq(ans)) return;
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
    showBasicEqServerUnavailable();
  }

  function handleRootWorkSubmit() {
    showBasicEqServerUnavailable();
  }

  function fillQuadStep() {
    if (isBiquadMode() && state.factor && state.factor.split) {
      biquadOneStep();
      return;
    }
    if (isFormulaWorkServerMode()) {
      requestQuadCheck({ intent: "one-step" }, applyQuadServerResult);
      return;
    }
    showBasicEqServerUnavailable();
  }

  function handleSqrtEqSubmit() {
    applySqrtEqTyped(typedAnswer().trim());
  }

  function hideFnBoardUi() {
    if (fnSketch) fnSketch.hide();
    if (solveWrap) {
      solveWrap.classList.remove("has-fn-figure");
      solveWrap.classList.remove("has-fn-sketch");
    }
    if (fnBoardEl) {
      fnBoardEl.classList.remove("is-figure");
      fnBoardEl.classList.remove("is-sketch");
      fnBoardEl.classList.add("hidden");
    }
    if (answerRowEl) answerRowEl.classList.remove("hidden");
    placeFnBoard("home");
    renderFnDomains(null);
    renderFnAxes(false);
  }

  function clearGeoUi() {
    clearFreqUi();
    hideFnBoardUi();
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
      pointMap: (state.view && state.view.pointMap) || pack.map || {},
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
          showBasicEqServerUnavailable();
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
    if (res.view) applyGeoView(res.view);
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
          if (isGeoLengthMode()) {
            requestLineMatchAction("lineMatch.line", row.task.id, { lineKey: opt.key });
            return;
          }
          showBasicEqServerUnavailable();
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
          if (isGeoLengthMode()) {
            requestLineMatchAction("lineMatch.line", row.task.id, { lineKey: "none" });
            return;
          }
          showBasicEqServerUnavailable();
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
            if (isGeoLengthMode()) {
              requestLineMatchAction("lineMatch.reason", row.task.id, { reasonId: opt.id });
              return;
            }
            showBasicEqServerUnavailable();
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
    hideFnBoardUi();
    state.fnView = null;
    state.geo = createEmptyGeoState();
    if (state.view && state.view.draw) state.geo.draw = state.view.draw;
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
              showBasicEqServerUnavailable();
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
    showBasicEqServerUnavailable();
    return false;
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
    if (res && res.offerFormula != null) state.offerFormula = !!res.offerFormula;
    if (res && res.canSplit != null) {
      state.factor = state.factor || emptyFactorState();
      state.factor.canSplit = !!res.canSplit;
    }
    if (!res || !res.ok) {
      var badMsg = (res && res.message) || "";
      if (DoctematicaMath && DoctematicaMath.proseHTML) badMsg = DoctematicaMath.proseHTML(badMsg);
      else if (DoctematicaGeometry.formatPartHtml) badMsg = DoctematicaGeometry.formatPartHtml(badMsg);
      showFeedback(false, "<strong>עוד לא.</strong> " + badMsg);
      updateSplitBtn();
      updateFormulaBtn();
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
    if (res.view) applyGeoView(res.view);
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
    showBasicEqServerUnavailable();
  }

  function applyRequiredReason(text) {
    var pack = state.problem && state.problem.geo;
    if (!pack) return false;
    if (isGeoLengthsServerActive()) {
      if (
        !requestGeometryAction({ intent: "check", typed: text }, function (remote) {
          if (remote && remote.local) {
            showBasicEqServerUnavailable();
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
    showBasicEqServerUnavailable();
    return false;
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

  function applyGeoView(view) {
    if (!view) return;
    state.view = view;
    window.DoctematicaUI = window.DoctematicaUI || {};
    window.DoctematicaUI.view = view;
    if (view.draw && state.geo) state.geo.draw = view.draw;
  }

  function applyGeoLengthsOneStep(pack, remote) {
    remote = remote || {};
    if (remote.view) applyGeoView(remote.view);
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
    showBasicEqServerUnavailable();
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
    if (remote.view) applyGeoView(remote.view);
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
    showBasicEqServerUnavailable();
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
    res = softenQuadIneqSolve(res || {});
    state.stats.try += 1;
    saveStats();
    renderStats();
    if (!res.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + res.message);
      return;
    }
    if (res.progress) state.sqrtProg = res.progress;
    state.history.push(shownTyped);
    rememberHistoryReason(res.reason);
    renderSteps();
    if (isQuadIneqMode() && (res.rootsFound || res.phase === "signs")) {
      finishEqSolveForQuadIneq(shownTyped);
      return;
    }
    if (res.solved) {
      if (geoDistUnkTask() && finishEqSolveForGeo(shownTyped)) return;
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      renderSteps();
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, siteStepMessage(res.reason, "<strong>כל הכבוד.</strong> " + res.message));
      return;
    }
    mathField.clear();
    var label = res.isolated || res.kind === "both" || res.kind === "finish" ? "נכון" : "צעד חוקי";
    showFeedback(
      true,
      siteStepMessage(res.reason, "<strong>" + label + ".</strong> " + res.message),
      "tip"
    );
    mathField.focus();
  }

  function applySqrtEqTyped(typed) {
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו את הצעד הבא.");
      return false;
    }
    var shownTyped = String(typed || "").trim();
    typed = geoEngineTyped(shownTyped);
    if (isSqrtServerMode() || ((isMixedServerMode() || geoEqSolveActive() || isQuadIneqMode()) && mixedPath() === "sqrt")) {
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
    showBasicEqServerUnavailable();
    return false;
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
    if (isMixedServerMode() || (geoEqSolveActive() && mixedPath() === "linear")) {
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
    showBasicEqServerUnavailable();
    return false;
  }

  function sysFactorHistory() {
    var start = (state.sys && state.sys.splitStart) || "";
    var eq = (state.sys && state.sys.splitEq) || start;
    if (!start) return [];
    if (eq && eq !== start) return [start, eq];
    return [start];
  }

  function factorAnswerLine(res) {
    var eqs = (res && res.eqs) || [];
    var bits = [];
    eqs.forEach(function (eq) {
      var s = String(eq || "").replace(/\s+/g, "");
      if (/^x=/i.test(s)) bits.push(String(eq).trim());
    });
    return bits.join(", ");
  }

  function finishFactorForSys(res) {
    if (!sysQuadFactorActive()) return false;
    var letter = (state.sys && state.sys.splitLetter) || "x";
    var typed = factorAnswerLine(res);
    if (letter === "y") typed = typed.replace(/x/gi, "y");
    state.mixed = emptyMixedState();
    state.factor = emptyFactorState();
    state.offerSplit = false;
    updateSplitBtn();
    renderSysGuide();
    setModeUi();
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> לא התקבלו שני הפתרונות.");
      return true;
    }
    if (
      !requestSystemsAction(
        {
          intent: "check",
          typed: typed,
          history: state.history || [],
          choices: (state.sys && state.sys.choices) || [],
        },
        function (remote) {
          applySysCheckView(typed, remote);
        }
      )
    ) {
      showBasicEqServerUnavailable();
    }
    return true;
  }

  function enterSysSplit() {
    var start = state.sys && state.sys.splitStart;
    var eq = state.sys && state.sys.splitEq;
    if (!start || !eq) return;
    state.mixed = emptyMixedState();
    state.mixed.path = "factor";
    state.factor = emptyFactorState();
    state.offerSplit = false;
    updateSplitBtn();
    renderSysGuide();
    if (
      !requestQuadraticAction(
        {
          subtopic: "factor",
          intent: "split",
          start: start,
          history: sysFactorHistory(),
          factor: { split: false, trails: [[], []] },
        },
        function (res) {
          if (!res || res.ok === false) {
            state.mixed = emptyMixedState();
            state.offerSplit = true;
            updateSplitBtn();
            renderSysGuide();
            setModeUi();
            showFeedback(false, "<strong>עוד לא.</strong> " + ((res && res.message) || ""));
            return;
          }
          applyFactorServerResult("", res);
        }
      )
    ) {
      state.mixed = emptyMixedState();
      state.offerSplit = true;
      updateSplitBtn();
      showBasicEqServerUnavailable();
    }
  }

  function applySysFactorTyped(typed) {
    typed = String(typed || "").trim();
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו את הצעד הבא.");
      return;
    }
    if (
      !requestQuadraticAction(
        {
          subtopic: "factor",
          intent: "check",
          start: state.sys.splitStart,
          history: sysFactorHistory(),
          previous: state.sys.splitEq,
          typed: typed,
          factor: factorPayload(),
        },
        function (res) {
          applyFactorServerResult(typed, res);
        }
      )
    ) {
      showBasicEqServerUnavailable();
    }
  }

  function sysFactorHint() {
    requestQuadraticAction(
      {
        subtopic: "factor",
        intent: "hint",
        start: state.sys.splitStart,
        history: sysFactorHistory(),
        factor: factorPayload(),
      },
      function (remote) {
        showFeedback(true, "<strong>רמז.</strong> " + ((remote && remote.hint) || "פתרו כל גורם בנפרד."), "tip");
      }
    );
  }

  function sysFactorOneStep() {
    requestQuadraticAction(
      {
        subtopic: "factor",
        intent: "one-step",
        start: state.sys.splitStart,
        history: sysFactorHistory(),
        factor: factorPayload(),
      },
      function (remote) {
        if (!remote) return;
        if (remote.step) {
          applyFactorServerResult(remote.step, remote);
          return;
        }
        if (remote.split) {
          applyFactorServerResult("", remote);
          return;
        }
        showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "התרגיל כבר פתור."), "tip");
      }
    );
  }

  function finishEqSolveForSys(answer) {
    if (!sysQuadFormulaActive()) return false;
    var letter = (state.sys && state.sys.formulaLetter) || "x";
    var typed = String(answer || "");
    if (letter === "y") typed = typed.replace(/x/gi, "y");
    state.mixed = emptyMixedState();
    state.quad = null;
    state.offerFormula = false;
    hideQuadGuide();
    updateFormulaBtn();
    setModeUi();
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> לא התקבל פתרון מהנוסחה.");
      renderSysGuide();
      return true;
    }
    if (
      !requestSystemsAction(
        {
          intent: "check",
          typed: typed,
          history: state.history || [],
          choices: (state.sys && state.sys.choices) || [],
        },
        function (remote) {
          applySysCheckView(typed, remote);
        }
      )
    ) {
      showBasicEqServerUnavailable();
    }
    return true;
  }

  function beginMixedFormulaFromServer(res, md53) {
    res = res || {};
    if (res.ok === false) {
      if (isSystemQuadMode()) {
        state.mixed = emptyMixedState();
        state.quad = null;
        updateFormulaBtn();
        renderSysGuide();
        setModeUi();
      }
      showFeedback(false, "<strong>עוד לא.</strong> " + (res.message || ""));
      return false;
    }
    state.mixed = state.mixed || emptyMixedState();
    state.mixed.path = "formula";
    state.mixed.md53 = !!(md53 || res.md53);
    if (isFnMode()) {
      state.fnFormula = true;
      state.fn = state.fn || {};
      state.fn.formulaAxis = fnAxisQuadEq() ? "x" : "";
    }
    startQuadSession();
    if (res.view) mergeQuadView(res.view);
    renderQuadGuide();
    renderSteps();
    updateFormulaBtn();
    setModeUi();
    var formulaSlot = quadGuideEl && quadGuideEl.querySelector("input.q-slot:not([disabled])");
    if (formulaSlot) formulaSlot.focus();
    showFeedback(
      true,
      "<strong>" + (state.mixed.md53 ? "md53" : "נוסחת שורשים") + ".</strong> " + (res.message || res.hint || ""),
      "tip"
    );
    return true;
  }

  function enterSysFormula(md53) {
    var eq = state.sys && state.sys.formulaEq;
    if (!eq) {
      showFeedback(false, "<strong>עוד לא.</strong> קודם סדרו ל־ax²+bx+c=0.");
      return;
    }
    state.mixed = state.mixed || emptyMixedState();
    state.mixed.path = "formula";
    state.mixed.md53 = !!md53;
    updateFormulaBtn();
    renderSysGuide();
    requestQuadraticAction(
      {
        intent: "formula-enter",
        subtopic: "mixed",
        start: eq,
        history: [eq],
        md53: !!md53,
      },
      function (res) {
        beginMixedFormulaFromServer(res, !!md53);
      }
    );
  }

  function finishChainFormula(ans) {
    requestHighPowerAction(
      {
        intent: "absorb",
        start: (state.problem && state.problem.startEquation) || "",
        history: state.history,
        typed: ans || ((state.quad && state.quad.view && state.quad.view.answer) || ""),
        formulaBranch: state.factor && state.factor.formulaBranch,
        factor: factorPayload(),
      },
      function (res) {
        var keptBranch = state.factor && state.factor.formulaBranch;
        if (keptBranch != null && keptBranch !== "" && state.quad) parkFormulaSession(keptBranch);
        state.mixed = emptyMixedState();
        state.quad = null;
        hideQuadGuide();
        if (!res || !res.ok) {
          showFeedback(false, "<strong>עוד לא.</strong> " + ((res && res.message) || ""));
          setModeUi();
          return;
        }
        applyFactorServerResult(ans || "", res);
        updateFormulaBtn();
        setModeUi();
      }
    );
  }

  function enterChainFormula(md53) {
    var eq = (state.factor && state.factor.formulaEq) || "";
    requestHighPowerAction(
      {
        intent: "formula-enter",
        start: (state.problem && state.problem.startEquation) || eq,
        history: state.history,
        md53: !!md53,
        formulaBranch: state.factor && state.factor.formulaBranch,
        factor: factorPayload(),
      },
      function (res) {
        if (res && res.formulaEq) {
          state.factor = state.factor || emptyFactorState();
          state.factor.formulaEq = res.formulaEq;
          state.factor.formulaBranch = res.formulaBranch;
        }
        beginMixedFormulaFromServer(res, !!md53);
      }
    );
  }

  function enterMixedFormula() {
    if (isFnMode() && state.fnView && state.fnView.offerFormula) {
      if (!requestFunctions({ intent: "formula-enter" }, applyFnRemote)) showBasicEqServerUnavailable();
      return;
    }
    if (isBiquadMode()) {
      enterBiquadFormula(false);
      return;
    }
    if (isHighChainServerMode()) {
      enterChainFormula(false);
      return;
    }
    if (isSystemQuadMode()) {
      enterSysFormula(false);
      return;
    }
    if (isMixedServerMode() || geoEqSolveActive() || fnQuadSolveActive() || isQuadIneqMode()) {
      requestQuadraticAction(
        {
          intent: "formula-enter",
          subtopic: "mixed",
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
    showBasicEqServerUnavailable();
  }

  function enterMixedMd53() {
    if (isFnMode() && state.fnView && state.fnView.offerFormula) {
      if (!requestFunctions({ intent: "formula-enter", md53: true }, applyFnRemote)) showBasicEqServerUnavailable();
      return;
    }
    if (isBiquadMode()) {
      enterBiquadFormula(true);
      return;
    }
    if (isHighChainServerMode()) {
      enterChainFormula(true);
      return;
    }
    if (isSystemQuadMode()) {
      enterSysFormula(true);
      return;
    }
    if (isMixedServerMode() || geoEqSolveActive() || fnQuadSolveActive() || isQuadIneqMode()) {
      requestQuadraticAction(
        {
          intent: "formula-enter",
          subtopic: "mixed",
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
    showBasicEqServerUnavailable();
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
    showBasicEqServerUnavailable();
    return false;
  }

  function applyMixedServerResult(shownTyped, res) {
    res = softenQuadIneqSolve(res || {});
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
      rememberHistoryReason(res.reason);
      renderSteps();
      if (res.solved) {
        markSolved();
        mathField.setDisabled(true);
        checkBtn.disabled = true;
        nextAfterSolveBtn.classList.remove("hidden");
        showFeedback(true, siteStepMessage(res.reason, "<strong>כל הכבוד.</strong> " + res.message));
        return;
      }
      mathField.clear();
      showFeedback(true, siteStepMessage(res.reason, "<strong>נכון.</strong> " + res.message));
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
      rememberHistoryReason(res.reason);
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      renderSteps();
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, siteStepMessage(res.reason, "<strong>כל הכבוד.</strong> " + res.message));
      return;
    }
    clearLcdAssist();
    state.history.push(shownTyped);
    rememberHistoryReason(res.reason);
    renderSteps();
    mathField.clear();
    updateSplitBtn();
    updateFormulaBtn();
    showFeedback(true, siteStepMessage(res.reason, "<strong>צעד חוקי.</strong> " + (res.message || "")));
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
    showBasicEqServerUnavailable();
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
          if (remote.chooseFormula && !(remote.enter === "formula" || remote.fill || remote.nextLetter)) {
            showFeedback(true, remote.hint || remote.message || "", "tip");
            return;
          }
          if (remote.enter === "formula" || (remote.path === "formula" && !remote.step)) {
            beginMixedFormulaFromServer(remote);
            if (remote.fill || remote.nextLetter || remote.nextPhase) applyQuadServerResult(remote);
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
    showBasicEqServerUnavailable();
  }

  var MATH_FIELD_HINT =
    "הקלידו רגיל. לשבר לחצו «שבר» — החצים זזים בין מונה למכנה. לשבר-בתוך-שבר עמדו במונה או במכנה ולחצו «שבר» שוב.";

  function keepSolutionStep(step) {
    if (step && step.parallel) return step;
    if (step && step.eq != null) return step.eq;
    return step;
  }

  function parallelFamily(step) {
    var labels = ((step && step.parallel) || []).map(function (col) {
      return String(col.label || "");
    }).join(" ");
    if (/חיובי|שלילי/.test(labels)) return "sign";
    if (/עלייה|ירידה|עולה|יורדת/.test(labels)) return "mono";
    return "";
  }

  function parallelKey(step) {
    return ((step && step.parallel) || []).map(function (col) {
      return String(col.label || "");
    }).join("|");
  }

  function solutionStepHTML(src) {
    if (src && src.eq != null) src = src.eq;
    var text = String(src || "");
    if (window.DoctematicaMath && DoctematicaMath.toHTML && !/[\u0590-\u05FF]/.test(text)) {
      return DoctematicaMath.toHTML(text.replace(/-/g, "−"));
    }
    return fnProse(text);
  }

  function parallelBlockHTML(step) {
    var cols = (step && step.parallel) || [];
    var html = '<div class="sol-parallel" style="--sol-cols:' + cols.length + '">';
    cols.forEach(function (col) {
      html += '<div class="sol-parallel-col">';
      if (col.label) html += '<div class="sol-parallel-label">' + fnProse(col.label) + "</div>";
      (col.steps || []).forEach(function (bit) {
        if (bit && bit.parallel) {
          html += parallelBlockHTML(bit);
          return;
        }
        if (bit && bit.html) {
          html += '<div class="sol-parallel-step">' + bit.html + "</div>";
          return;
        }
        html += '<div class="sol-parallel-step">' + solutionStepHTML(bit) + "</div>";
      });
      html += "</div>";
    });
    html += "</div>";
    return html;
  }

  function showEqSolution(title, opts) {
    opts = opts || {};
    if (!state.problem) return false;
    var steps = opts.steps || state.problem.solutionSteps || [];
    if (!opts.always && !steps.length) return false;
    var notes = opts.withNotes ? opts.notes || state.problem.solutionNotes || [] : [];
    function solutionNoteHTML(text) {
      var raw = String(text || "");
      if (!raw) return "";
      if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
      return siteReasonHTML(raw);
    }
    function solKey(text) {
      return String(text || "")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "")
        .toLowerCase();
    }
    var mixed = state.problem.mixed;
    var lcdInfo = mixed && mixed.lcdInfo;
    var cleared = mixed && mixed.cleared;
    var lines = "";
    var givenHtml = "";
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
        '</span><span class="why">תחום הצבה' +
        (domainInfo.count > 1 ? " (" + domainInfo.count + " ערכים אסורים)" : "") +
        ".</span></li>";
    }
    var startEq =
      opts.start != null
        ? String(opts.start)
        : state.problem && state.problem.startEquation
          ? String(state.problem.startEquation)
          : "";
    var firstStep = steps.length ? steps[0] : "";
    var firstSrc = firstStep && typeof firstStep === "object" && firstStep.eq != null ? firstStep.eq : firstStep;
    if (startEq && solKey(firstSrc) !== solKey(startEq)) {
      var givenBody = opts.plain
        ? String(startEq).replace(/-/g, "−")
        : DoctematicaMath.toHTML(startEq);
      var given = state.problem && state.problem.given;
      var givenNote =
        given && given.value != null && given.value !== ""
          ? "המשוואה הנתונה. " +
            (given.letter || "x") +
            " = " +
            String(given.value).replace(/-/g, "−") +
            "."
          : "";
      givenHtml =
        '<p class="sol-given"><span class="sol-k">נתון</span><span class="sol-eq">' +
        givenBody +
        "</span>" +
        (givenNote ? '<span class="why">' + solutionNoteHTML(givenNote) + "</span>" : "") +
        "</p>";
    }
    var i;
    var stepNo = 0;
    for (i = 0; i < steps.length; i++) {
      var step = steps[i];
      if (step && step.parallel) {
        stepNo += 1;
        var forkWhy = notes[i] || step.explain || "";
        lines +=
          '<li class="sol-parallel-row" value="' +
          stepNo +
          '">' +
          parallelBlockHTML(step) +
          (forkWhy ? '<span class="why">' + solutionNoteHTML(forkWhy) + "</span>" : "") +
          "</li>";
        continue;
      }
      var src = step && typeof step === "object" && step.eq != null ? step.eq : step;
      if (/^משימה:/.test(String(src || ""))) {
        var taskLabel = String(src).replace(/^משימה:/, "");
        lines +=
          '<li class="sol-task-row" value="' +
          stepNo +
          '">▸ ' +
          taskLabel.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
          "</li>";
        continue;
      }
      stepNo += 1;
      var sysHtml = sysStepHTML(src, opts.lcdHats && opts.lcdHats[i]);
      var body = sysHtml
        ? sysHtml
        : opts.plain
          ? String(src).replace(/-/g, "−")
          : solutionStepHTML(src);
      var why = notes[i] ? '<span class="why">' + solutionNoteHTML(notes[i]) + "</span>" : "";
      lines += '<li><span class="sol-eq">' + body + "</span>" + why + "</li>";
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
          '</div><span class="why">' +
          solutionNoteHTML("מכנה משותף " + lcdInfo.lcd + " — מכפילים מעל כל איבר.") +
          "</span></li>";
      }
    }
    var extra = opts.note
      ? " <span class=\"muted-note\">" + opts.note + "</span>"
      : "";
    var footer =
      opts.footer != null
        ? opts.footer
        : String(state.problem.answer).replace(/-/g, "−");
    var footerHtml =
      !opts.plain && DoctematicaMath && typeof DoctematicaMath.proseHTML === "function"
        ? DoctematicaMath.proseHTML(String(footer))
        : String(footer);
    modelEl.classList.remove("hidden");
    modelEl.innerHTML =
      "<strong>" +
      title +
      "</strong>" +
      extra +
      givenHtml +
      "<ol class=\"sol-lines\" dir=\"rtl\">" +
      lines +
      "</ol><p dir=\"rtl\">" +
      footerHtml +
      "</p>";
    refitLcdMuls(modelEl);
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
    showBasicEqServerUnavailable();
  }

  function sqrtHint() {
    if (isSqrtServerMode() || ((isMixedServerMode() || geoEqSolveActive() || isQuadIneqMode()) && mixedPath() === "sqrt")) {
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
    showBasicEqServerUnavailable();
  }

  function sqrtOneStep() {
    if (isSqrtServerMode() || ((isMixedServerMode() || geoEqSolveActive() || isQuadIneqMode()) && mixedPath() === "sqrt")) {
      var cur = lastHistoryEq();
      requestQuadraticAction(
        {
          intent: "one-step",
          start: (state.problem && state.problem.startEquation) || cur,
          history: state.history,
        },
        function (remote) {
          if (isQuadIneqMode() && (remote.boardAction || remote.rootsFound || remote.phase === "signs")) {
            state.mixed = emptyMixedState();
            noteQuadIneqPhase(remote);
            if (remote.boardAction && window.DoctematicaQuadIneq) {
              DoctematicaQuadIneq.open("signs");
              DoctematicaQuadIneq.applyAction(remote.boardAction);
            }
            showFeedback(true, "<strong>צעד של האתר.</strong> " + siteReasonHTML(remote.reason || remote.hint || "עכשיו בודקים את הסימן בכל תחום."), "tip");
            return;
          }
          if (remote.step) {
            applySqrtServerResult(remote.step, remote);
            return;
          }
          showFeedback(true, "<strong>רמז.</strong> " + (remote.hint || "התרגיל כבר פתור."), remote.done ? undefined : "tip");
        }
      );
      return;
    }
    showBasicEqServerUnavailable();
  }

  function factorHint() {
    if (isHighChainServerMode() && mixedPath() === "formula") {
      quadHint();
      return;
    }
    if (isHighFactorServerMode() || isHighChainServerMode()) {
      if (
        !requestHighPowerAction(
          {
            intent: "hint",
            start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
            history: state.history,
            factor: factorPayload(),
          },
          function (remote) {
            if (remote.solved || remote.solvedAll) {
              applyFactorServerResult("", remote);
              return;
            }
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
    if (isFactorServerMode() || ((isMixedServerMode() || geoEqSolveActive() || isQuadIneqMode()) && mixedPath() === "factor")) {
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
    showBasicEqServerUnavailable();
  }

  function factorOneStep() {
    if (isHighChainServerMode() && mixedPath() === "formula") {
      fillQuadStep();
      return;
    }
    if (isHighFactorServerMode() || isHighChainServerMode()) {
      if (
        !requestHighPowerAction(
          {
            intent: "one-step",
            start: (state.problem && state.problem.startEquation) || lastHistoryEq(),
            history: state.history,
            factor: factorPayload(),
          },
          function (remote) {
            if (remote.enter === "formula" || remote.path === "formula") {
              if (remote.formulaEq) {
                state.factor = state.factor || emptyFactorState();
                state.factor.formulaEq = remote.formulaEq;
                state.factor.formulaBranch = remote.formulaBranch;
                state.factor.offerFormula = true;
              }
              beginMixedFormulaFromServer(remote, !!remote.md53);
              return;
            }
            if (remote.solved || remote.solvedAll) {
              applyFactorServerResult(remote.step || "", remote);
              return;
            }
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
    if (isFactorServerMode() || ((isMixedServerMode() || geoEqSolveActive() || isQuadIneqMode()) && mixedPath() === "factor")) {
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
    showBasicEqServerUnavailable();
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
      showBasicEqServerUnavailable();
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
          var hintText = remote.hint;
          if ((isParamEqMode() || isIneqMode()) && remote.hints && remote.hints.length) {
            var curEq = lastHistoryEq();
            if (!state.paramHint || state.paramHint.eq !== curEq) state.paramHint = { eq: curEq, i: 0 };
            hintText = remote.hints[Math.min(state.paramHint.i, remote.hints.length - 1)];
            state.paramHint.i += 1;
          }
          showFeedback(true, "<strong>רמז.</strong> " + siteReasonHTML(hintText), remote.done ? undefined : "tip");
        }
      )
    ) {
      return;
    }
    showBasicEqServerUnavailable();
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
      showBasicEqServerUnavailable();
      return;
    }
        if (maybeApplyLcdMarksOneStep()) return;
    var cur = lastHistoryEq();
    function applySiteStep(actEq, actHint, result, reason) {
      if (!result.ok) {
        showFeedback(false, "<strong>לא הצלחתי לבצע את הצעד.</strong> " + result.message);
        return;
      }
      state.history.push(actEq);
      if (reason) {
        state.eqReasons = state.eqReasons || {};
        state.eqReasons[state.history.length - 1] = reason;
      }
      renderSteps();
      mathField.clear();
      var said = reason ? siteReasonHTML(reason) : actHint || result.message;
      if (result.solved) {
        markSolved();
        mathField.setDisabled(true);
        checkBtn.disabled = true;
        nextAfterSolveBtn.classList.remove("hidden");
        showFeedback(true, "<strong>צעד של האתר.</strong> " + said);
        renderSteps();
      } else {
        showFeedback(true, "<strong>צעד של האתר.</strong> " + said, "tip");
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
          applySiteStep(remote.step, remote.hint, snapshotLinearCheck(remote), remote.reason);
        }
      )
    ) {
      return;
    }
    showBasicEqServerUnavailable();
  }

  function requestQuadIneq(payload, onResult) {
    if (!isQuadIneqMode()) return false;
    if (equationsCheckBusy) return true;
    equationsCheckBusy = true;
    var snap = quadIneqSnap();
    var body = {
      intent: payload.intent,
      ineq: (state.problem && state.problem.startEquation) || "",
      typed: payload.typed || "",
      history: payload.history || state.history || [],
      rootsDone: !!(state.quadIneq && state.quadIneq.rootsDone),
      sign: payload.sign || snap.sign,
      parabola: payload.parabola || snap.parabola,
      signRow: payload.signRow || null,
    };
    fetch(QUAD_INEQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) {
          var httpErr = new Error("quad ineq http " + res.status);
          httpErr.status = res.status;
          throw httpErr;
        }
        return res.json();
      })
      .then(function (remote) {
        equationsCheckBusy = false;
        noteQuadIneqPhase(remote || {});
        onResult(remote || {});
      })
      .catch(function (err) {
        equationsCheckBusy = false;
        if (payload.signRow && payload.signRow.field) {
          onResult({
            ok: false,
            field: payload.signRow.field,
            message: err && err.status >= 500 ? "הבדיקה נכשלה. שגיאה בעיבוד בשרת." : "הבדיקה לא זמינה כרגע. שרת הבדיקה לא מגיב.",
          });
          return;
        }
        if (err && err.status >= 500) showServerProcessingError();
        else showBasicEqServerUnavailable();
      });
    return true;
  }

  function quadIneqHint() {
    requestQuadIneq({ intent: "hint" }, function (remote) {
      var hints = remote.hints && remote.hints.length ? remote.hints : [remote.hint || ""];
      var key = (state.problem && state.problem.exerciseId) || "";
      if (state.quadHintKey !== key) {
        state.quadHintKey = key;
        state.quadHint = 0;
      }
      var text = hints[state.quadHint % hints.length];
      state.quadHint += 1;
      showFeedback(true, "<strong>רמז.</strong> " + siteReasonHTML(text), "tip");
    });
  }

  function quadIneqOneStep() {
    var signing = state.quadIneq && state.quadIneq.phase === "signs";
    if (!signing && mixedPath() === "formula") return fillQuadStep();
    if (!signing && mixedPath() === "factor") return factorOneStep();
    if (!signing && mixedPath() === "sqrt") return sqrtOneStep();
    requestQuadIneq({ intent: "one-step" }, function (remote) {
      noteQuadIneqPhase(remote);
      if (remote.boardAction && window.DoctematicaQuadIneq) {
        DoctematicaQuadIneq.open("signs");
        DoctematicaQuadIneq.applyAction(remote.boardAction);
        showFeedback(true, "<strong>צעד של האתר.</strong> " + siteReasonHTML(remote.reason), "tip");
        return;
      }
      if (remote.enter === "formula" || (remote.path === "formula" && !remote.step)) {
        beginMixedFormulaFromServer(remote);
        if (remote.fill || remote.nextLetter || remote.nextPhase) applyQuadServerResult(remote);
        return;
      }
      if (remote.enter === "factor" || remote.path === "factor") {
        state.mixed = state.mixed || emptyMixedState();
        state.mixed.path = "factor";
        if (remote.step) {
          applyMixedServerResult(remote.step, remote);
          return;
        }
        setModeUi();
        factorOneStep();
        return;
      }
      if (remote.done || !remote.step) {
        showFeedback(true, "<strong>רמז.</strong> " + siteReasonHTML(remote.hint || remote.reason || "רשמו את פתרון אי־השוויון."), "tip");
        return;
      }
      state.history.push(remote.step);
      if (remote.reason) {
        state.eqReasons = state.eqReasons || {};
        state.eqReasons[state.history.length - 1] = remote.reason;
      }
      renderSteps();
      mathField.clear();
      if (remote.solved) {
        markSolved();
        mathField.setDisabled(true);
        checkBtn.disabled = true;
        nextAfterSolveBtn.classList.remove("hidden");
      }
      showFeedback(true, "<strong>צעד של האתר.</strong> " + siteReasonHTML(remote.reason), "tip");
    });
  }

  function quadIneqSolution() {
    requestQuadIneq({ intent: "solution" }, function (remote) {
      showEqSolution("פתרון מלא — אי־שוויון ריבועי", {
        always: true,
        withNotes: true,
        steps: (remote.steps || []).map(function (s) { return keepSolutionStep(s); }),
        notes: (remote.steps || []).map(function (s) { return s.explain || ""; }),
        footer: remote.answer ? "הפתרון: " + remote.answer : "",
      });
    });
  }

  function andHint() {
    requestIntervals(
      { intent: "hint", drawing: DoctematicaNumberLine ? DoctematicaNumberLine.snapshot() : null },
      function (remote) {
        var hints = remote.hints && remote.hints.length ? remote.hints : [remote.hint || ""];
        var key = (state.problem && state.problem.exerciseId) || "";
        if (state.andHintKey !== key) {
          state.andHintKey = key;
          state.andHint = 0;
        }
        var text = hints[state.andHint % hints.length];
        state.andHint += 1;
        showFeedback(true, "<strong>רמז.</strong> " + siteReasonHTML(text), "tip");
      }
    );
  }

  function andOneStep() {
    var drawing = DoctematicaNumberLine && DoctematicaNumberLine.isOpen() ? DoctematicaNumberLine.snapshot() : { open: false };
    requestIntervals({ intent: "one-step", history: state.history, drawing: drawing }, function (remote) {
      if (remote.drawingAction && DoctematicaNumberLine) {
        DoctematicaNumberLine.applyAction(remote.drawingAction);
        showFeedback(true, "<strong>צעד של האתר.</strong> " + siteReasonHTML(remote.reason), "tip");
        return;
      }
      if (remote.done || !remote.step) {
        showFeedback(true, "<strong>רמז.</strong> " + siteReasonHTML(remote.hint || "רשמו את התחום המשותף."), "tip");
        return;
      }
      state.history.push(remote.step);
      if (remote.reason) {
        state.eqReasons = state.eqReasons || {};
        state.eqReasons[state.history.length - 1] = remote.reason;
      }
      renderSteps();
      mathField.clear();
      if (remote.solved) {
        markSolved();
        mathField.setDisabled(true);
        checkBtn.disabled = true;
        nextAfterSolveBtn.classList.remove("hidden");
        showFeedback(true, "<strong>צעד של האתר.</strong> " + siteReasonHTML(remote.reason));
        renderSteps();
      } else {
        showFeedback(true, "<strong>צעד של האתר.</strong> " + siteReasonHTML(remote.reason), "tip");
        mathField.focus();
      }
    });
  }

  function andSolution() {
    requestIntervals({ intent: "solution" }, function (remote) {
      var steps = remote.steps || [];
      showEqSolution(isOrMode() ? "פתרון מלא — מערכת או" : "פתרון מלא — מערכת וגם", {
        always: true,
        steps: steps.map(function (s) { return keepSolutionStep(s); }),
        withNotes: true,
        notes: steps.map(function (s) { return siteReasonHTML(s.explain); }),
        footer: remote.answer ? "הפתרון: " + remote.answer : "",
      });
    });
  }

  function currentGuide() {
    if (isFreqTableMode()) {
      return {
        work: true,
        buttons: true,
        hintText: "אפשר לרשום את התשובה הסופית, או שלב ביניים נכון.",
        hint: freqHint,
        oneStep: freqOneStep,
        showSolution: freqSolution,
      };
    }
    if (isPercentMode()) {
      return {
        work: true,
        buttons: true,
        hintText: "אפשר לרשום את התשובה הסופית, או שלב ביניים נכון.",
        hint: percentHint,
        oneStep: percentOneStep,
        showSolution: percentSolution,
      };
    }
    if (isFnMode()) {
      return {
        work: true,
        buttons: true,
        hintText: (state.fnView && state.fnView.hint) || "הציבו, חשבו, ורשמו נקודה או תחום.",
        hint: fnHint,
        oneStep: fnOneStep,
        showSolution: fnSolution,
      };
    }
    if (isQuadIneqMode()) {
      if (mixedPath() === "formula") {
        return {
          work: true,
          buttons: true,
          hintText: state.mixed && state.mixed.md53
            ? "md53: רשמו a, אחר כך b, אחר כך c. אחרי שלושתם מופיע הפתרון."
            : "רשמו את המקדמים a, b, c בנוסחת השורשים. אחרי כל מקדם לחצו Enter.",
          hint: quadHint,
          oneStep: fillQuadStep,
          showSolution: quadIneqSolution,
        };
      }
      if (mixedPath() === "factor") {
        return {
          work: true,
          buttons: true,
          hintText: "מפרקים לגורמים, או רושמים את פתרון אי־השוויון.",
          hint: quadIneqHint,
          oneStep: factorOneStep,
          showSolution: quadIneqSolution,
        };
      }
      return {
        work: true,
        buttons: true,
        hintText: "אפשר לכתוב את הפתרון, או למצוא קודם את נקודות האפס.",
        hint: quadIneqHint,
        oneStep: quadIneqOneStep,
        showSolution: quadIneqSolution,
      };
    }
    if (isSystemMode()) {
      return {
        work: true,
        buttons: true,
        hintText: MATH_FIELD_HINT,
        hint: function () {
          if (sysQuadFormulaActive()) {
            quadHint();
            return;
          }
          if (sysQuadFactorActive()) {
            sysFactorHint();
            return;
          }
          if (!state.sys) return;
          if (
            !requestSystemsAction(
              {
                intent: "hint",
                history: state.history || [],
                choices: state.sys.choices || [],
              },
              function (remote) {
                if (!remote || remote.ok === false) {
                  showFeedback(false, "<strong>עוד לא.</strong> " + ((remote && remote.message) || ""));
                  return;
                }
                var hintList = remote.hints && remote.hints.length ? remote.hints : [remote.hint || ""];
                if (state.sys.hintI == null) state.sys.hintI = 0;
                var hintText = hintList[Math.min(state.sys.hintI, hintList.length - 1)];
                if (state.sys.hintI < hintList.length - 1) state.sys.hintI += 1;
                showFeedback(true, "<strong>רמז.</strong> " + hintText, "tip");
              }
            )
          ) {
            showBasicEqServerUnavailable();
          }
        },
        oneStep: function () {
          if (sysQuadFormulaActive()) {
            fillQuadStep();
            return;
          }
          if (sysQuadFactorActive()) {
            sysFactorOneStep();
            return;
          }
          if (!state.sys) return;
          if (
            !requestSystemsAction(
              {
                intent: "one-step",
                history: state.history || [],
                choices: state.sys.choices || [],
              },
              applySysTaughtStep
            )
          ) {
            showBasicEqServerUnavailable();
          }
        },
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
                if (!remote || remote.ok === false) {
                  showFeedback(false, "<strong>עוד לא.</strong> " + ((remote && remote.message) || ""));
                  return;
                }
                var prior = (state.history || []).map(function (eq, index) {
                  return {
                    eq: eq,
                    reason: (state.sys && state.sys.reasons && state.sys.reasons[index]) || "",
                    lcdHats: (state.sys && state.sys.lcdHats && state.sys.lcdHats[index]) || null,
                  };
                });
                var rest = remote.steps || [];
                var lines = prior.concat(rest);
                showEqSolution(
                  state.problem && state.problem.mode === "meet"
                    ? "פתרון מלא — נקודות מפגש"
                    : state.problem && state.problem.mode === "system-elim"
                    ? "פתרון מלא — השוואת מקדמים"
                    : state.problem && state.problem.mode === "system-arrange"
                      ? "פתרון מלא — משוואות לא מסודרות"
                      : "פתרון מלא — שיטת ההצבה",
                  {
                  always: true,
                  steps: lines.map(function (s) {
                    return keepSolutionStep(s);
                  }),
                  notes: lines.map(function (s) {
                    return s.reason || "";
                  }),
                  lcdHats: lines.map(function (s) {
                    return s.lcdHats || null;
                  }),
                  withNotes: true,
                  footer: "הפתרון: " + ((remote && remote.answer) || "—"),
                });
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
                  always: true,
                  steps: (remote.steps || []).map(function (s) {
                    return keepSolutionStep(s);
                  }),
                  footer: remote.answer ? "הפתרון: " + remote.answer : "",
                });
              }
            )
          ) {
            return;
          }
          showEqSolution("פתרון מלא — נוסחת שורשים", { always: true });
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
                    return keepSolutionStep(s);
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
                    return keepSolutionStep(s);
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
    if (isBiquadMode()) {
      if (mixedPath() === "formula" && !(state.factor && state.factor.split)) {
        return {
          work: true,
          buttons: true,
          hintText: state.mixed && state.mixed.md53
            ? "md53: רשמו a, אחר כך b, אחר כך c של המשוואה ב־t."
            : "רשמו את המקדמים a, b, c בנוסחת השורשים של t. אחרי כל מקדם לחצו Enter.",
          hint: quadHint,
          oneStep: fillQuadStep,
          showSolution: biquadShowSolution,
        };
      }
      return {
        work: true,
        buttons: true,
        hintText: "סדרו את המשוואה, הציבו t = xⁿ לפי הקשר בין החזקות, פתרו את t, ואז חזרו ל־x בכל ערך.",
        hint: biquadHint,
        oneStep: biquadOneStep,
        showSolution: biquadShowSolution,
      };
    }
    if (isFactorEqMode()) {
      var high = isHighFactorServerMode();
      var chain = isHighChainServerMode();
      if (chain && mixedPath() === "formula") {
        return {
          work: true,
          buttons: true,
          hintText: state.mixed && state.mixed.md53
            ? "md53: רשמו a, אחר כך b, אחר כך c. אחרי שלושתם מופיע הפתרון."
            : "רשמו את המקדמים a, b, c בנוסחת השורשים של הענף הריבועי. אחרי כל מקדם לחצו Enter.",
          hint: quadHint,
          oneStep: fillQuadStep,
          showSolution: function () {
            requestHighPowerAction(
              {
                intent: "solution",
                start: state.problem.startEquation,
                history: state.history,
                factor: factorPayload(),
              },
              function (remote) {
                showEqSolution("פתרון מלא — משוואה בחזקה גבוהה", {
                  always: true,
                  steps: (remote.steps || []).map(function (s) {
                    return keepSolutionStep(s);
                  }),
                  notes: (remote.steps || []).map(function (s) {
                    return s.explain || "";
                  }),
                  withNotes: true,
                  footer: remote.answer ? "קבוצת הפתרונות: " + remote.answer : "",
                });
              }
            );
          },
        };
      }
      return {
        work: true,
        buttons: true,
        hintText: chain
          ? "העבירו לאגף אחד אם צריך, הוציאו חזקה משותפת של x, ואז «חילוק למשוואות». כל ענף נפתר לפי הסוג שלו."
          : high
          ? "העבירו לאגף אחד אם צריך, הוציאו חזקה משותפת של x (ואפשר גם מספר), למשל x³−9x → x(x²−9)=0 או x³−4x² → x²(x−4)=0. אחר כך «חילוק למשוואות»: מ־xⁿ=0 מקבלים x=0; הענף השני לינארי או ריבועי (בידוד ואז שורש / ±)."
          : "הוציאו גורם משותף x, למשל x²−5x=0 → x(x−5)=0. אפשר גם 2x(x−4). אחרי הפירוק לחצו «חילוק למשוואות» ופתרו כל גורם = 0.",
        hint: factorHint,
        oneStep: factorOneStep,
        showSolution: function () {
          var title = chain || high ? "פתרון מלא — משוואה בחזקה גבוהה" : "פתרון מלא — הוצאת גורם משותף";
          var sendSol = chain || high ? requestHighPowerAction : requestQuadraticAction;
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
                    return keepSolutionStep(s);
                  }),
                  notes: chain
                    ? (remote.steps || []).map(function (s) {
                        return s.explain || "";
                      })
                    : [],
                  withNotes: !!chain,
                  footer: remote.answer ? (chain ? "קבוצת הפתרונות: " + remote.answer : "הפתרון: " + remote.answer) : "",
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
                    return keepSolutionStep(s);
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
                    return keepSolutionStep(s);
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
                    return keepSolutionStep(s);
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
                    return keepSolutionStep(s);
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
                    return keepSolutionStep(s);
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
    if (isIntervalMode()) {
      return {
        work: true,
        buttons: true,
        hintText: isOrMode()
          ? "אפשר לכתוב את האיחוד, למשל x > 3 או x < 1 או x > 6, או לשרטט את התחומים על הציר."
          : "אפשר לכתוב את התחום המשותף, למשל 3 < x < 7, או לשרטט את התחומים על הציר.",
        hint: andHint,
        oneStep: andOneStep,
        showSolution: andSolution,
      };
    }
    if (isStepMode() || isParamEqMode() || isIneqMode()) {
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
                  var steps = (remote.steps || []).map(function (s) {
                    return keepSolutionStep(s);
                  });
                  var notes = (remote.steps || []).map(function (s) {
                    if (isIneqMode() && s.explain) return siteReasonHTML(s.explain);
                    return s.explain;
                  });
                  showEqSolution("פתרון מלא לפי הדרך הנלמדת", {
                    withNotes: true,
                    note: "(אפשר גם לדלג על שלבי ביניים, כל עוד המשוואה שקולה)",
                    footer: isIneqMode()
                      ? "הפתרון: " + remote.answer
                      : "הפתרון: " + ((state.problem && state.problem.solveFor) || "x") + " = " + remote.answer,
                    steps: steps,
                    notes: notes,
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
    updateSplitBtn();
    updateFormulaBtn();
    if (mathKeysEl && !isFreqTableMode()) {
      mathKeysEl.classList.remove("is-frac-only");
      mathKeysEl.classList.remove("is-mean-keys");
      mathKeysEl.classList.toggle("is-ineq-keys", isIneqMode() || isIntervalMode());
    }
  }

  function markSolved() {
    state.locked = true;
    answerEl.disabled = true;
    state.stats.ok += 1;
    state.streakSeen = state.streakSeen || {};
    var key = streakKey();
    if (!key || !state.streakSeen[key]) {
      if (key) state.streakSeen[key] = true;
      state.streak += 1;
      if (state.streak > state.stats.best) state.stats.best = state.streak;
    }
    saveStats();
    renderStats();
  }

  function leaveBoards() {
    viewEpoch += 1;
    hideFnBoardUi();
    if (coordBoard) coordBoard.clear();
    if (solveWrap) solveWrap.classList.remove("has-geo");
  }

  function nextProblem() {
    leaveBoards();
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
    if (!isWorksheet()) {
      renderSources();
      renderWorksheetNav();
      renderKinds();
      showBasicEqServerUnavailable();
      return;
    }
    var level = currentLevel();
    if (!level || !level.exercises || !level.exercises.length) return;
    if (state.exerciseIndex < 0) state.exerciseIndex = 0;
    if (state.exerciseIndex >= level.exercises.length) {
      state.exerciseIndex = level.exercises.length - 1;
    }
    requestStudentProblem(level.id, state.exerciseIndex);
  }

  function requestStudentProblem(levelId, index) {
    var token = viewEpoch;
    fetch(API_ROOT + "/api/problem", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ levelId: levelId, exerciseIndex: index }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("problem");
        return res.json();
      })
      .then(function (data) {
        if (token !== viewEpoch || state.levelId !== levelId || state.exerciseIndex !== index) return;
        if (!data || !data.problem) {
          showBasicEqServerUnavailable();
          return;
        }
        state.problem = data.problem;
        state.offerFormula = !!(data.problem && data.problem.offerFormula);
        if (data.problem && data.problem.mode === "freq-table") {
          state.freqView = data.view || null;
          state.view = null;
          if (window.DoctematicaUI) window.DoctematicaUI.view = null;
        } else if (data.problem && data.problem.mode === "percent") {
          state.percentView = data.view || null;
          state.freqView = null;
          state.view = null;
          if (window.DoctematicaUI) window.DoctematicaUI.view = null;
        } else if (data.problem && data.problem.mode === "fn") {
          state.fnView = data.view || null;
          state.percentView = null;
          state.freqView = null;
          state.view = null;
          if (window.DoctematicaUI) window.DoctematicaUI.view = null;
        } else if (data.view) {
          state.fnView = null;
          applyGeoView(data.view);
        }
        else {
          state.view = null;
          state.freqView = null;
          if (window.DoctematicaUI) window.DoctematicaUI.view = null;
        }
        presentLoadedProblem();
      })
      .catch(function () {
        showBasicEqServerUnavailable();
      });
  }

  function presentLoadedProblem() {
    state.eqReasons = {};
    state.eqNotes = {};
    state.eqNoteOpen = null;
    if (isSystemMode()) {
      startSystemSession(state.problem);
      state.history = [];
      state.lcdMarks = {};
      state.domain = null;
      state.quad = null;
      state.factor = emptyFactorState();
      state.mixed = emptyMixedState();
      clearLcdAssist();
    } else if (isQuadMode()) {
      state.sys = null;
      state.history = [];
      state.lcdMarks = {};
      state.domain = null;
      state.mixed = emptyMixedState();
      startQuadSession();
      clearLcdAssist();
      clearGeoUi();
    } else if (state.problem && state.problem.mode === "freq-table") {
      state.sys = null;
      state.quad = null;
      state.factor = emptyFactorState();
      state.mixed = emptyMixedState();
      state.lcdMarks = {};
      state.domain = null;
      state.history = [];
      state.freq = emptyFreqProgress();
      state.freqMarks = [];
      state.freqDrafts = {};
      state.freqWorkDrafts = {};
      state.freqCellCursor = null;
      state.freqFocus = null;
      clearLcdAssist();
      clearGeoUi();
    } else if (isFnMode()) {
      state.sys = null;
      state.quad = null;
      state.factor = emptyFactorState();
      state.mixed = emptyMixedState();
      state.lcdMarks = {};
      state.domain = null;
      state.history = [];
      state.freq = { step: "", done: false, found: {} };
      state.fn = { progress: emptyFnProgress(), sketch: { points: [], line: null, strokes: [] }, partSketches: {}, viewPart: "", hintBank: {}, reasons: {}, axisLive: emptyAxisLive(), axisCards: [], axisDone: { y: false, x: false } };
      state.fnFormula = false;
      state.fnFormulaEq = "";
      state.fn.forkCards = [];
      clearLcdAssist();
      clearGeoUi();
    } else if (isPercentMode()) {
      state.sys = null;
      state.quad = null;
      state.factor = emptyFactorState();
      state.mixed = emptyMixedState();
      state.lcdMarks = {};
      state.domain = null;
      state.history = [];
      state.freq = { step: "", done: false, found: {} };
      clearLcdAssist();
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
      state.biquadHints = 0;
      state.biquadOffer = false;
      state.biquadFormulaEq = "";
      state.biquadDrafts = {};
      state.biquadFields = [];
      state.biquadActiveBranch = null;
      state.quadIneq = { phase: "zeros" };
      state.offerFormula = false;
      if (window.DoctematicaQuadIneq) DoctematicaQuadIneq.reset();
      state.lcdMarks = {};
      clearLcdAssist();
      resetDomainState(state.problem && state.problem.startEquation);
      clearGeoUi();
      if (isDomainLcdServerMode()) requestDenomSetup();
    }
    if (!formulaWorkActive()) hideQuadGuide();
    if (!isSystemMode() && !formulaWorkActive()) hideSysPanels();
    topicLabelEl.textContent = isWorksheet()
      ? (state.topic === "equations" ||
        isQuadraticTopic() ||
        isHighPowerTopic() ||
        isAnalyticTopic() ||
        isStatisticsTopic() ||
        isPercentTopic() ||
        isCalculusTopic() ||
        (state.topic === "systems-sub" && (state.subtopic === "elim" || state.subtopic === "arrange"))
          ? currentTopicLabel() + " · "
          : "") +
        currentLevel().title +
        " · תרגיל " +
        (state.problem && state.problem.mode === "system-arrange" && state.problem.n != null
          ? state.problem.n
          : state.exerciseIndex + 1)
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
    clearFreqUi();
    if (isFreqTableMode()) {
      var freqStem = state.problem.stem || state.problem.prompt || "";
      promptEl.innerHTML = freqStemHTML(freqStem);
      checkBtn.classList.remove("hidden");
      answerLabelEl.classList.remove("hidden");
      answerLabelEl.textContent = "התשובה שלך";
      if (freqAnswerEl) freqAnswerEl.classList.add("hidden");
      mathField.setDisabled(false);
      mathField.clear();
      renderFreqBoard();
      renderFreqPart(state.freqView);
      syncFreqYesNo(state.freqView);
      renderModePick(state.freqView);
      syncFreqEntry(state.freqView);
      renderSteps();
      if (mathWrap && !mathWrap.classList.contains("hidden")) mathField.focus();
      return;
    }
    if (isPercentMode()) {
      var percentStem = state.problem.stem || state.problem.prompt || "";
      promptEl.innerHTML =
        window.DoctematicaMath && DoctematicaMath.proseHTML
          ? DoctematicaMath.proseHTML(percentStem)
          : percentStem;
      mathWrap.classList.remove("hidden");
      mathKeysEl.classList.remove("hidden");
      checkBtn.classList.remove("hidden");
      answerLabelEl.classList.remove("hidden");
      answerLabelEl.textContent = state.percentView && state.percentView.fields ? "חישוב" : "התשובה שלך";
      if (freqAnswerEl) freqAnswerEl.classList.add("hidden");
      renderPercentFields(state.percentView && state.percentView.fields);
      renderFreqPart(state.percentView);
      renderSteps();
      mathField.focus();
      return;
    }
    if (isFnMode()) {
      var fnStem = (state.fnView && state.fnView.stem) || state.problem.stem || state.problem.prompt || "";
      promptEl.classList.remove("hidden");
      promptEl.innerHTML = fnProse(fnStem);
      mathWrap.classList.remove("hidden");
      mathKeysEl.classList.remove("hidden");
      checkBtn.classList.remove("hidden");
      answerLabelEl.classList.remove("hidden");
      if (freqAnswerEl) freqAnswerEl.classList.add("hidden");
      mathField.setDisabled(false);
      mathField.clear();
      renderFnPart();
      renderFnBoard();
      syncFnAsk();
      var openingPart = state.fnView && state.fnView.part && state.fnView.part.label;
      if (openingPart) {
        var openingMark = "§" + openingPart;
        if ((state.history || []).indexOf(openingMark) < 0) state.history.push(openingMark);
      }
      ensureFnTaskHeader(state.fnView && state.fnView.pointHeading);
      renderFnSteps();
      if (mathWrap && !mathWrap.classList.contains("hidden")) mathField.focus();
      else if (fnDomainsEl && !fnDomainsEl.classList.contains("hidden")) {
        var firstDomain = fnDomainsEl.querySelector("input");
        if (firstDomain) firstDomain.focus();
      }
      return;
    }
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
    if (isQuadIneqMode()) {
      promptEl.innerHTML = DoctematicaMath.toHTML(state.problem.startEquation || state.problem.prompt || "");
      mathKeysEl.classList.remove("hidden");
      mathKeysEl.classList.add("is-ineq-keys");
      if (nlineBtn) nlineBtn.classList.add("hidden");
      renderQuadIneqPanel();
    } else if (isIntervalMode()) {
      var andConds = (state.problem && state.problem.conds) || [];
      promptEl.innerHTML = andConds
        .map(function (c) {
          return DoctematicaMath.toHTML(c);
        })
        .join(isOrMode() ? " או " : " וגם ");
      mathKeysEl.classList.remove("hidden");
      mathKeysEl.classList.add("is-ineq-keys");
      if (nlineBtn) nlineBtn.classList.remove("hidden");
      if (DoctematicaNumberLine) DoctematicaNumberLine.reset();
    } else if (isStepMode() || isIneqMode() || isParamEqMode() || isSqrtEqMode() || isHighRootEqMode() || isFactorEqMode() || isMixedEqMode() || isBiquadMode()) {
      if (nlineBtn) nlineBtn.classList.add("hidden");
      if (DoctematicaNumberLine) DoctematicaNumberLine.close();
      var givenLine = state.problem.given
        ? "<div class=\"eq-given\">" + DoctematicaMath.toHTML((state.problem.given.letter || "x") + " = " + state.problem.given.value) + "</div>"
        : "";
      promptEl.innerHTML = DoctematicaMath.toHTML(state.problem.startEquation) + givenLine;
      mathKeysEl.classList.remove("hidden");
    } else {
      if (nlineBtn) nlineBtn.classList.add("hidden");
      if (DoctematicaNumberLine) DoctematicaNumberLine.close();
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

  if (nlineEl && DoctematicaNumberLine) {
    DoctematicaNumberLine.mount(nlineEl, {
      onEmpty: function () {
        if (mathField) mathField.insertChars("∅");
      },
      onCheck: function () {
        requestIntervals({ intent: "draw-check", drawing: DoctematicaNumberLine.snapshot() }, function (remote) {
          showFeedback(!!remote.ok, "<strong>" + (remote.ok ? "שרטוט." : "עוד לא.") + "</strong> " + siteReasonHTML(remote.message || ""), remote.ok ? "tip" : "");
        });
      },
    });
  }

  if (nlineBtn) {
    nlineBtn.addEventListener("click", function () {
      if (!isIntervalMode() || !DoctematicaNumberLine) return;
      if (DoctematicaNumberLine.isOpen()) DoctematicaNumberLine.close();
      else DoctematicaNumberLine.open();
    });
  }

  window.addEventListener("resize", function () {
    if (isFreqTableMode()) fitFreqTable();
  });

  if (freqTableEl) {
    freqTableEl.addEventListener("change", function (event) {
      var select = event.target;
      if (!select || !select.classList || !select.classList.contains("freq-add-select")) return;
      var rowName = select.value;
      select.value = "";
      if (!rowName || state.locked) return;
      requestStatistics({ intent: "work", work: { action: "add", row: rowName } }, applyFreqRemote);
    });
    freqTableEl.addEventListener("click", function (event) {
      var removeRow = event.target && event.target.closest ? event.target.closest(".freq-remove-row") : null;
      if (removeRow) {
        if (state.locked) return;
        var rowName = removeRow.getAttribute("data-row");
        var confirmRemove = state.freqRemoveConfirm === rowName;
        state.freqRemoveConfirm = "";
        requestStatistics({
          intent: "work",
          work: { action: "remove", row: rowName, confirm: !!confirmRemove },
        }, function (remote) {
          if (remote && remote.confirm) state.freqRemoveConfirm = rowName;
          applyFreqRemote(remote);
        });
        return;
      }
      var addCol = event.target && event.target.closest ? event.target.closest(".freq-add-col") : null;
      var moveCol = event.target && event.target.closest ? event.target.closest(".freq-col-move") : null;
      var deleteCol = event.target && event.target.closest ? event.target.closest(".freq-col-delete") : null;
      if (addCol || moveCol || deleteCol) {
        if (state.locked) return;
        var columns = readBuildColumns();
        if (addCol) columns.push({ value: "", freq: "" });
        else {
          var cell = (moveCol || deleteCol).closest(".freq-build-col");
          var index = cell ? Number(cell.getAttribute("data-index")) : -1;
          if (deleteCol && index >= 0) columns.splice(index, 1);
          if (moveCol && index >= 0) {
            var next = index + Number(moveCol.getAttribute("data-dir"));
            if (next >= 0 && next < columns.length) {
              var held = columns[index];
              columns[index] = columns[next];
              columns[next] = held;
            }
          }
        }
        rememberBuildColumns(columns);
        renderFreqBoard();
        return;
      }
      var btn = event.target && event.target.closest ? event.target.closest(".freq-datum") : null;
      if (!btn || state.locked) return;
      var index = Number(btn.getAttribute("data-index"));
      if (!isFinite(index)) return;
      state.freqMarks = state.freqMarks || [];
      state.freqMarks[index] = !state.freqMarks[index];
      btn.classList.toggle("is-struck", !!state.freqMarks[index]);
      btn.setAttribute("aria-pressed", state.freqMarks[index] ? "true" : "false");
    });
    freqTableEl.addEventListener("input", function (event) {
      var input = event.target;
      if (input && input.classList && (input.classList.contains("freq-build-value") || input.classList.contains("freq-build-freq"))) {
        rememberBuildColumns(readBuildColumns());
        return;
      }
      if (!input || !input.classList) return;
      if (input.classList.contains("freq-frac-slot")) {
        var fracEdit = input.closest ? input.closest(".freq-frac-edit") : null;
        if (!fracEdit) return;
        state.freqWorkDrafts = state.freqWorkDrafts || {};
        state.freqWorkDrafts[fracEdit.getAttribute("data-row") + ":" + fracEdit.getAttribute("data-value")] = fracEditorValue(fracEdit);
        return;
      }
      if (input.classList.contains("freq-work-cell")) {
        state.freqWorkDrafts = state.freqWorkDrafts || {};
        state.freqWorkDrafts[input.getAttribute("data-row") + ":" + input.getAttribute("data-value")] = input.value;
        return;
      }
      if (!input.classList.contains("freq-cell")) return;
      state.freqDrafts = state.freqDrafts || {};
      state.freqDrafts[input.getAttribute("data-value")] = input.value;
      state.freqFocus = input.getAttribute("data-value");
    });
    freqTableEl.addEventListener("keydown", function (event) {
      if (moveFreqTableFocus(event)) return;
      if (event.key !== "Enter") return;
      var input = event.target;
      if (!input || !input.classList) return;
      if (input.classList.contains("freq-build-value") || input.classList.contains("freq-build-freq")) {
        event.preventDefault();
        submitBuildTable();
        return;
      }
      if (input.classList.contains("freq-frac-slot")) {
        event.preventDefault();
        submitFracEdit(input.closest ? input.closest(".freq-frac-edit") : null);
        return;
      }
      if (input.classList.contains("freq-work-cell")) {
        event.preventDefault();
        submitWorkCell(input);
        return;
      }
      if (!input.classList.contains("freq-cell")) return;
      event.preventDefault();
      submitFreqCell(input);
    });
  }

  formEl.addEventListener("submit", function (event) {
    event.preventDefault();
    if (state.locked || !state.problem) return;

    if (isFreqTableMode()) {
      var workInput = document.activeElement;
      if (workInput && workInput.classList && workInput.classList.contains("freq-frac-slot")) {
        var fracEdit = workInput.closest ? workInput.closest(".freq-frac-edit") : null;
        if (fracEdit && fracEdit.getAttribute("data-row")) {
          submitFracEdit(fracEdit);
          return;
        }
      }
      if (workInput && workInput.classList && workInput.classList.contains("freq-work-cell") && String(workInput.value || "").trim()) {
        submitWorkCell(workInput);
        return;
      }
      if (state.freqView && state.freqView.input === "cells") {
        submitFreqCell(freqCellToCheck());
        return;
      }
      if (state.freqView && state.freqView.input === "build") {
        submitBuildTable();
        return;
      }
      var fieldAnswers = readPercentFields();
      var hasField = Object.keys(fieldAnswers).some(function (key) { return String(fieldAnswers[key] || "").trim(); });
      var typedFreq = mathField ? mathField.serialize() : "";
      var picked = readModePick();
      if (!String(typedFreq || "").trim() && picked.length) {
        requestStatistics({ intent: "check", pick: picked }, applyFreqRemote);
        return;
      }
      if (!String(typedFreq || "").trim() && hasField) {
        requestStatistics({ intent: "check", answers: fieldAnswers }, applyFreqRemote);
        return;
      }
      applyFreqTyped(typedFreq);
      return;
    }

    if (isPercentMode()) {
      applyPercentTyped(typedAnswer());
      return;
    }

    if (isFnMode()) {
      if (mixedPath() === "formula") {
        handleQuadSubmit();
        return;
      }
      if (state.fnView && state.fnView.input === "axes") {
        submitFnAxis(focusedFnAxis());
        return;
      }
      applyFnTyped(typedAnswer());
      return;
    }

    if (reasonBoxEl && !reasonBoxEl.classList.contains("hidden")) {
      applyRequiredReason(reasonInput ? reasonInput.value : "");
      return;
    }

    if (isSystemMode() && sysQuadFormulaActive()) {
      handleQuadSubmit();
      return;
    }

    if (isSystemMode() && sysQuadFactorActive()) {
      applySysFactorTyped(typedAnswer());
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

    if (isBiquadMode()) {
      if (mixedPath() === "formula" && !(state.factor && state.factor.split)) {
        handleQuadSubmit();
        return;
      }
      var biquadPendingNow = biquadPending();
      applyBiquadTyped(biquadPendingNow.text, biquadPendingNow.branch);
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
      if (isHighChainServerMode() && mixedPath() === "formula") {
        handleQuadSubmit();
        return;
      }
      applyFactorTyped(typedAnswer());
      return;
    }

    if (isQuadIneqMode()) {
      var quadTyped = typedAnswer();
      var quadAnswer = /[<>≤≥]|או/.test(quadTyped);
      if (!quadAnswer && mixedPath() === "formula") {
        handleQuadSubmit();
        return;
      }
      if (!quadAnswer && mixedPath() === "factor") {
        applyFactorTyped(quadTyped);
        return;
      }
      if (!quadAnswer && mixedPath() === "sqrt") {
        applySqrtEqTyped(quadTyped.trim());
        return;
      }
      if (!quadTyped && window.DoctematicaQuadIneq && DoctematicaQuadIneq.isOpen()) {
        var boardSnap = DoctematicaQuadIneq.snapshot();
        if (boardSnap.mode === "parabola") {
          requestQuadIneq({ intent: "parabola-check", parabola: boardSnap.parabola }, function (remote) {
            showFeedback(!!remote.ok, (remote.ok ? "<strong>נכון.</strong> " : "<strong>עוד לא.</strong> ") + siteReasonHTML(remote.message || ""));
          });
          return;
        }
        var signIndex = 0;
        (boardSnap.regions || []).some(function (row, index) {
          if (row && row.x) {
            signIndex = index;
            return true;
          }
          return false;
        });
        var signRow = (boardSnap.regions || [])[signIndex] || {};
        requestQuadIneq({
          intent: "sign-check",
          signRow: { index: signIndex, x: signRow.x, expr: signRow.expr, value: signRow.value, sign: signRow.sign, from: signRow.from, to: signRow.to, fromText: signRow.fromText, toText: signRow.toText },
        }, function (remote) {
          showFeedback(!!remote.ok, (remote.ok ? "<strong>נכון.</strong> " : "<strong>עוד לא.</strong> ") + siteReasonHTML(remote.message || ""));
        });
        return;
      }
      requestQuadIneq({ intent: "check", typed: quadTyped }, function (remote) {
        if (remote.path || remote.enter) {
          applyMixedServerResult(quadTyped, remote);
          noteQuadIneqPhase(remote);
          return;
        }
        state.stats.try += 1;
        saveStats();
        renderStats();
        if (!remote.ok) {
          showFeedback(false, "<strong>עוד לא.</strong> " + siteReasonHTML(remote.message || ""));
          return;
        }
        var quadLine = String(quadTyped || "").trim();
        if (quadLine) {
          state.history.push(quadLine);
          state.eqReasons = state.eqReasons || {};
          state.eqReasons[state.history.length - 1] = remote.reason || remote.message || "";
          renderSteps();
          mathField.clear();
        }
        if (remote.solved) {
          markSolved();
          mathField.setDisabled(true);
          checkBtn.disabled = true;
          nextAfterSolveBtn.classList.remove("hidden");
        }
        showFeedback(true, "<strong>נכון.</strong> " + siteReasonHTML(remote.message || ""));
        noteQuadIneqPhase(remote);
      });
      return;
    }

    if (isIntervalMode()) {
      var andTyped = typedAnswer();
      requestIntervals({ intent: "check", typed: andTyped }, function (remote) {
        state.stats.try += 1;
        saveStats();
        renderStats();
        if (!remote.ok) {
          showFeedback(false, "<strong>עוד לא.</strong> " + siteReasonHTML(remote.message || ""));
          return;
        }
        var andLine = String(andTyped || "").trim();
        if (andLine) {
          state.history.push(andLine);
          state.eqReasons = state.eqReasons || {};
          state.eqReasons[state.history.length - 1] = remote.reason || remote.message || "";
          renderSteps();
          mathField.clear();
        }
        if (remote.solved) {
          markSolved();
          mathField.setDisabled(true);
          checkBtn.disabled = true;
          nextAfterSolveBtn.classList.remove("hidden");
        }
        showFeedback(true, "<strong>נכון.</strong> " + siteReasonHTML(remote.message || ""));
      });
      return;
    }

    if (isStepMode() || isParamEqMode() || isIneqMode()) {
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
          showFeedback(false, "<strong>עוד לא.</strong> " + siteReasonHTML(result.message));
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
          showFeedback(true, "<strong>כל הכבוד.</strong> " + siteReasonHTML(result.message));
        } else {
          mathField.clear();
          showFeedback(true, "<strong>צעד חוקי.</strong> " + siteReasonHTML(result.message));
          mathField.focus();
        }
      }
      if (requestBasicEqCheck(prevEq, typedNow, applyStepVerdict)) return;
      showBasicEqServerUnavailable();
      return;
    }

    showBasicEqServerUnavailable();
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

  if (prevSubBtn) {
    prevSubBtn.addEventListener("click", function () { stepSubtopic(-1); });
  }
  if (nextSubBtn) {
    nextSubBtn.addEventListener("click", function () { stepSubtopic(1); });
  }

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

  if (freqAnswerEl) {
    freqAnswerEl.addEventListener("input", syncFreqAnswerDir);
  }
  if (yesBtn) {
    yesBtn.addEventListener("click", function () {
      if (isFreqTableMode()) {
        applyFreqTyped("כן");
        return;
      }
      if (isFnMode()) {
        applyFnTyped("כן");
        return;
      }
      applyGeoTyped("כן");
    });
  }
  if (noBtn) {
    noBtn.addEventListener("click", function () {
      if (isFreqTableMode()) {
        applyFreqTyped("לא");
        return;
      }
      if (isFnMode()) {
        applyFnTyped("לא");
        return;
      }
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

  if (homeBtn) homeBtn.addEventListener("click", goHome);
  if (navToggleBtn) {
    navToggleBtn.addEventListener("click", function () {
      if (shellMode !== "solve") return;
      navOpen = !navOpen;
      syncShell();
    });
  }
  if (navScrim) {
    navScrim.addEventListener("click", function () {
      navOpen = false;
      syncShell();
    });
  }
  window.addEventListener("resize", function () {
    if (shellMode === "solve") syncShell();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && shellMode === "solve" && navOpen) {
      navOpen = false;
      syncShell();
    }
  });

  function loadCatalog() {
    fetch(API_ROOT + "/api/catalog", { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("catalog");
        return res.json();
      })
      .then(function (data) {
        state.catalog = data || { topics: [], subtopics: {}, levels: [] };
        renderTopics();
        renderSubtopics();
        renderSources();
        renderKinds();
        renderStats();
        nextProblem();
      })
      .catch(function () {
        showBasicEqServerUnavailable();
        enterSolve();
      });
  }

  loadCatalog();
})();
