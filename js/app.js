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
  var mathWrap = document.getElementById("math-wrap");
  var mathField = new DoctematicaMathField(mathFieldEl, mathKeysEl);
  var sysGuideEl = document.getElementById("sys-guide");
  var sysKnownEl = document.getElementById("sys-known");
  var solveWrap = document.getElementById("solve-wrap");
  var quadGuideEl = document.getElementById("quad-guide");
  var factorGuideEl = document.getElementById("factor-guide");
  var splitEqsBtn = document.getElementById("split-eqs-btn");

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
    stats: loadStats(),
  };

  function typedAnswer() {
    if (isGuidedMode()) return mathField.serialize();
    return answerEl.value;
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

  function isSystemMode() {
    return state.topic === "systems-sub";
  }

  function isQuadMode() {
    var level = currentLevel();
    return (
      state.topic === "equations" &&
      state.subtopic === "quadratic" &&
      !!level &&
      level.mode === "quad-formula" &&
      level.exercises &&
      level.exercises.length > 0
    );
  }

  function isSqrtEqMode() {
    var level = currentLevel();
    return (
      state.topic === "equations" &&
      state.subtopic === "quadratic" &&
      !!level &&
      level.mode === "quad-sqrt" &&
      level.exercises &&
      level.exercises.length > 0
    );
  }

  function isFactorEqMode() {
    var level = currentLevel();
    return (
      state.topic === "equations" &&
      state.subtopic === "quadratic" &&
      !!level &&
      level.mode === "quad-factor" &&
      level.exercises &&
      level.exercises.length > 0
    );
  }

  function isEqWorkMode() {
    return isStepMode() || isSqrtEqMode() || isFactorEqMode();
  }

  function emptyFactorState() {
    return {
      split: false,
      eqs: [],
      solved: [false, false],
      progress: { z: false, o: false },
      trails: [[], []],
    };
  }

  function startFactorTrails(e1, e2) {
    var Q = DoctematicaQuadratic;
    state.factor = state.factor || emptyFactorState();
    state.factor.split = true;
    state.factor.eqs = [e1, e2];
    if (!state.factor.trails[0].length && !state.factor.trails[1].length) {
      state.factor.trails = [[e1], [e2]];
      state.factor.solved = [Q.linearSolved(e1), Q.linearSolved(e2)];
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

  function lastHistoryEq() {
    return state.history[state.history.length - 1];
  }

  function canSplitFactor() {
    if (!isFactorEqMode() || state.locked) return false;
    var st = state.factor || emptyFactorState();
    if (st.split) return false;
    var last = lastHistoryEq();
    var Q = DoctematicaQuadratic;
    var prod = Q.parseProductEq(last);
    return !!(prod && Q.productMatches(state.problem.factor, prod));
  }

  function updateSplitBtn() {
    if (!splitEqsBtn) return;
    var show = isFactorEqMode() && !state.locked && canSplitFactor();
    splitEqsBtn.classList.toggle("hidden", !show);
  }

  function renderFactorGuide() {
    if (factorGuideEl) {
      factorGuideEl.classList.add("hidden");
      factorGuideEl.innerHTML = "";
    }
    updateSplitBtn();
  }

  function doFactorSplit() {
    if (!canSplitFactor()) {
      showFeedback(false, "<strong>עוד לא.</strong> קודם הוציאו גורם משותף, למשל x(x−5)=0.");
      return;
    }
    var Q = DoctematicaQuadratic;
    var prod = Q.parseProductEq(lastHistoryEq());
    startFactorTrails(prod.e1, prod.e2);
    renderFactorGuide();
    renderSteps();
    var both = state.factor.solved[0] && state.factor.solved[1];
    if (both) {
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>כל הכבוד.</strong> " + (state.problem.factor.answer || ""));
      return;
    }
    showFeedback(
      true,
      "<strong>חילקנו.</strong> מכפלה שווה אפס רק אם אחד הגורמים אפס. פתרו כל משוואה בנפרד.",
      "tip"
    );
    mathField.focus();
  }

  function applyFactorTyped(typed) {
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו את הצעד הבא.");
      return false;
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
      if (state.history[state.history.length - 1] !== typed) state.history.push(typed);
    } else if (res.split && !wasSplit) {
      var startEqs = res.eqs;
      var p0 = Q.parseProductEq(prev);
      if (p0) startEqs = [p0.e1, p0.e2];
      if (startEqs && startEqs.length >= 2) startFactorTrails(startEqs[0], startEqs[1]);
    }
    if (res.eqs) state.factor.eqs = res.eqs;
    if (Array.isArray(res.solvedFlags)) state.factor.solved = res.solvedFlags;
    else if (Array.isArray(res.solved)) state.factor.solved = res.solved;
    if (res.split) state.factor.split = true;
    if (res.progress) state.factor.progress = res.progress;
    if (typeof res.which === "number") {
      appendFactorTrail(res.which, typed);
    } else if (res.solved === true && res.progress) {
      if (res.progress.z) appendFactorTrail(0, "x = 0");
      if (res.progress.o) appendFactorTrail(1, "x = " + Q.fmtDisp(pack.otherF));
    } else if (res.progress) {
      if (res.progress.z && !wasSplit) appendFactorTrail(0, typed);
      if (res.progress.o) appendFactorTrail(1, typed);
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
      showFeedback(true, "<strong>כל הכבוד.</strong> " + res.message);
      return true;
    }
    mathField.clear();
    showFeedback(true, "<strong>נכון.</strong> " + res.message);
    mathField.focus();
    return true;
  }

  function isGuidedMode() {
    return isStepMode() || isSystemMode() || state.subtopic === "quadratic" || state.topic === "equations";
  }

  function topicLevels() {
    return DoctematicaContent.levels(state.topic, state.topic === "equations" ? state.subtopic : null);
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
    instructionEl.textContent = level.instruction;
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
        if (topic.id === "equations") {
          state.subtopic = state.subtopic || "basic";
          if (!DoctematicaProblems.subtopics.equations.some(function (s) { return s.id === state.subtopic; })) {
            state.subtopic = "basic";
          }
          if (state.subtopic !== "basic" && state.source === "random") {
            state.source = "worksheet";
          }
        }
        var first = DoctematicaContent.levels(topic.id, topic.id === "equations" ? state.subtopic : null)[0];
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
    if (state.topic === "equations") {
      var sub = ((DoctematicaProblems.subtopics.equations || []).filter(function (s) {
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

  function offerOrBegin(advice, proceed) {
    state.sys.pending = null;
    var old = sysGuideEl.querySelector(".sys-continue-row");
    if (old) old.parentNode.removeChild(old);
    if (!advice || advice.tone !== "tip") {
      proceed();
      showChoiceAdvice(advice);
      return;
    }
    state.sys.pending = proceed;
    showChoiceAdvice({
      tone: "tip",
      message: advice.message + " אפשר לבחור אפשרות אחרת, או להמשיך בבחירה הזו.",
    });
    var wrap = document.createElement("div");
    wrap.className = "topics sys-continue-row";
    wrap.appendChild(
      addSysBtn("להמשיך בבחירה הזו", function () {
        var go = state.sys.pending;
        state.sys.pending = null;
        if (go) go();
      })
    );
    sysGuideEl.appendChild(wrap);
  }

  function renderStats() {
    scoreEl.textContent = state.streak + " נכונות ברצף";
  }

  function isolNumeric(isol) {
    return isol && Math.abs(isol.rhs.x) < 1e-8 && Math.abs(isol.rhs.y) < 1e-8;
  }

  function otherVar(v) {
    return v === "x" ? "y" : "x";
  }

  function bothKnown() {
    return typeof state.sys.known.x === "number" && typeof state.sys.known.y === "number";
  }

  function renderSysKnown() {
    if (isQuadMode() && state.quad && state.quad.gotAbc) {
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

  function startSystemSession(problem) {
    var isos = DoctematicaSystems.isolationsOf(problem.eq1, problem.eq2);
    state.sys = {
      eq: [problem.eq1, problem.eq2],
      isolations: isos,
      isol: isos.length === 1 ? isos[0] : null,
      phase: isos.length ? "pick_sub" : "pick_isolate",
      known: {},
      found: null,
      workFrom: null,
      workTarget: null,
      givenAt: [],
      keepAt: [],
    };
    if (state.sys.isol && isolNumeric(state.sys.isol)) {
      state.sys.known[state.sys.isol.v] = state.sys.isol.rhs.k;
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

  function beginWork(phase, startEq) {
    state.sys.phase = phase;
    state.sys.needSub = phase === "work_sub" || phase === "work_back";
    if (!state.history.length) {
      state.history = [startEq];
      state.sys.givenAt = [0];
    } else if (state.history[state.history.length - 1] !== startEq) {
      state.history.push(startEq);
      state.sys.givenAt.push(state.history.length - 1);
    }
    mathField.clear();
    mathField.setDisabled(false);
    setWorkInput(true);
    renderSysGuide();
    renderSteps();
    mathField.focus();
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
    sysGuideEl.classList.remove("hidden");
    sysGuideEl.innerHTML = "";
    var p = document.createElement("p");
    var row = document.createElement("div");
    row.className = "topics";
    var sys = state.sys;
    var i;

    if (sys.phase === "pick_isolate") {
      p.textContent = "אין משתנה מבודד עדיין. בחרו באיזו משוואה לבודד, ואיזה משתנה.";
      sysGuideEl.appendChild(p);
      for (i = 0; i < 2; i++) {
        (function (idx) {
          row.appendChild(
            addSysBtn("משוואה " + (idx + 1) + " · x", function () {
              offerOrBegin(DoctematicaSystems.adviceIsolate(sys.eq[0], sys.eq[1], idx, "x"), function () {
                sys.workFrom = idx;
                sys.wantVar = "x";
                beginWork("work_isolate", sys.eq[idx]);
              });
            })
          );
          row.appendChild(
            addSysBtn("משוואה " + (idx + 1) + " · y", function () {
              offerOrBegin(DoctematicaSystems.adviceIsolate(sys.eq[0], sys.eq[1], idx, "y"), function () {
                sys.workFrom = idx;
                sys.wantVar = "y";
                beginWork("work_isolate", sys.eq[idx]);
              });
            })
          );
        })(i);
      }
      sysGuideEl.appendChild(row);
      setWorkInput(false);
      return;
    }

    if (sys.phase === "pick_sub") {
      if (!sys.isol && sys.isolations.length > 1) {
        p.textContent = "יש משתנה מבודד ביותר ממשוואה אחת. בחרו מה להציב ובאיזו משוואה.";
        sysGuideEl.appendChild(p);
        sys.isolations.forEach(function (iso) {
          var into = iso.from === 0 ? 1 : 0;
          row.appendChild(
            addSysBtn("הציבו משוואה " + (iso.from + 1) + " במשוואה " + (into + 1), function () {
              offerOrBegin(DoctematicaSystems.adviceSubstitute(iso, sys.eq, into), function () {
                sys.isol = iso;
                if (isolNumeric(iso)) sys.known[iso.v] = iso.rhs.k;
                sys.workTarget = into;
                beginWork("work_sub", sys.eq[into]);
              });
            })
          );
        });
        sysGuideEl.appendChild(row);
        setWorkInput(false);
        return;
      }
      p.textContent =
        "יש ביטוי ל־" +
        sys.isol.v +
        ". בחרו באיזו משוואה להציב את הביטוי.";
      sysGuideEl.appendChild(p);
      for (i = 0; i < 2; i++) {
        if (sys.isol.from === i) continue;
        (function (idx) {
          row.appendChild(
            addSysBtn("משוואה " + (idx + 1), function () {
              offerOrBegin(DoctematicaSystems.adviceSubstitute(sys.isol, sys.eq, idx), function () {
                sys.workTarget = idx;
                beginWork("work_sub", sys.eq[idx]);
              });
            })
          );
        })(i);
      }
      sysGuideEl.appendChild(row);
      setWorkInput(false);
      return;
    }

    if (sys.phase === "pick_back") {
      p.textContent =
        sys.found.v +
        " = " +
        DoctematicaSystems.fmt(sys.found.value) +
        ". בחרו באיזו משוואה להציב כדי למצוא את " +
        otherVar(sys.found.v) +
        ".";
      sysGuideEl.appendChild(p);
      for (i = 0; i < 2; i++) {
        (function (idx) {
          row.appendChild(
            addSysBtn("משוואה " + (idx + 1), function () {
              offerOrBegin(DoctematicaSystems.adviceBack(sys.found, sys.eq, idx), function () {
                sys.workTarget = idx;
                beginWork("work_back", sys.eq[idx]);
              });
            })
          );
        })(i);
      }
      sysGuideEl.appendChild(row);
      setWorkInput(false);
      return;
    }

    if (sys.phase === "work_isolate") {
      p.textContent =
        "בודדו את " +
        (sys.wantVar || "המשתנה") +
        " במשוואה " +
        (sys.workFrom + 1) +
        " עד שהוא לבד באגף (מקדם 1).";
    } else if (sys.phase === "work_sub") {
      p.textContent = "הציבו, ואז פתרו את המשוואה עד שמתקבל משתנה = מספר.";
    } else if (sys.phase === "work_back") {
      p.textContent = "הציבו את הערך שמצאתם, ופתרו עד למשתנה השני.";
    } else {
      sysGuideEl.classList.add("hidden");
      return;
    }
    sysGuideEl.appendChild(p);
    setWorkInput(true);
  }

  function applySysOutcome(result) {
    var sys = state.sys;
    if (!result.ok) {
      showFeedback(false, "<strong>עוד לא.</strong> " + result.message);
      return;
    }
    state.history.push(typedAnswer().trim());
    if (
      (sys.phase === "work_isolate" && (result.kind === "isolated" || result.kind === "value")) ||
      ((sys.phase === "work_sub" || sys.phase === "work_back") && result.kind === "value")
    ) {
      markKeep();
    }
    renderSteps();
    if (result.kind === "none") {
      finishSystem("none");
      return;
    }
    if (result.kind === "infinite") {
      finishSystem("infinite");
      return;
    }
    if (sys.phase === "work_isolate") {
      if (result.kind === "isolated" || result.kind === "value") {
        var iso =
          result.kind === "isolated"
            ? result.isolation
            : { v: result.v, rhs: { x: 0, y: 0, k: result.value } };
        iso.from = sys.workFrom;
        sys.isol = iso;
        if (isolNumeric(iso)) sys.known[iso.v] = iso.rhs.k;
        showFeedback(true, "<strong>מצוין.</strong> " + result.message);
        sys.phase = "pick_sub";
        setWorkInput(false);
        renderSysGuide();
        return;
      }
      mathField.clear();
      showFeedback(true, "<strong>צעד חוקי.</strong> " + result.message);
      mathField.focus();
      return;
    }
    if (sys.phase === "work_sub") {
      sys.needSub = false;
      if (result.kind === "value") {
        sys.found = { v: result.v, value: result.value };
        sys.known[result.v] = result.value;
        if (bothKnown()) {
          finishSystem("unique");
          return;
        }
        showFeedback(true, "<strong>מצוין.</strong> " + result.message);
        sys.phase = "pick_back";
        setWorkInput(false);
        renderSysGuide();
        return;
      }
      mathField.clear();
      showFeedback(true, "<strong>צעד חוקי.</strong> " + result.message);
      mathField.focus();
      return;
    }
    if (sys.phase === "work_back") {
      sys.needSub = false;
      if (result.kind === "value") {
        sys.known[result.v] = result.value;
        if (bothKnown()) {
          finishSystem("unique");
          return;
        }
        mathField.clear();
        showFeedback(
          true,
          "מצאתם " +
            result.v +
            " = " +
            DoctematicaSystems.fmt(result.value) +
            ". המשיכו עד למשתנה השני."
        );
        mathField.focus();
        return;
      }
      mathField.clear();
      showFeedback(true, "<strong>צעד חוקי.</strong> " + result.message);
      mathField.focus();
    }
  }

  function handleSystemSubmit() {
    var sys = state.sys;
    if (!sys || String(sys.phase).indexOf("work") !== 0) return;
    var typed = typedAnswer().trim();
    var result;
    if (sys.needSub) {
      var isol =
        sys.phase === "work_back"
          ? { v: sys.found.v, rhs: { x: 0, y: 0, k: sys.found.value } }
          : sys.isol;
      result = DoctematicaSystems.checkSubstituted(isol, sys.eq[sys.workTarget], typed);
    } else {
      result = DoctematicaSystems.checkWorkStep(state.history[state.history.length - 1], typed);
    }
    state.stats.try += 1;
    saveStats();
    renderStats();
    applySysOutcome(result);
  }

  function renderSteps() {
    stepsEl.innerHTML = "";
    if (isQuadMode() && state.quad && state.quad.trail && state.quad.trail.length) {
      stepsEl.classList.remove("hidden");
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
    var stepNum = 0;
    var factorSplit =
      isFactorEqMode() &&
      state.factor &&
      state.factor.split &&
      state.factor.trails &&
      (state.factor.trails[0].length || state.factor.trails[1].length);
    state.history.forEach(function (eq, index) {
      var li = document.createElement("li");
      var n = document.createElement("span");
      n.className = "n";
      var isGiven = givenAt ? givenAt.indexOf(index) !== -1 : index === 0;
      n.textContent = isGiven ? "נתון" : String(++stepNum);
      var body = document.createElement("span");
      body.innerHTML = DoctematicaMath.toHTML(eq);
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
    });
    if (factorSplit) {
      stepsEl.appendChild(renderFactorFork(stepNum + 1));
    }
    renderFactorGuide();
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
    var want = state.problem.quad;
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
    var want = state.problem.quad;
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

  function numNeedsSimplify(num) {
    var s = String(num || "")
      .replace(/[−–—]/g, "-")
      .replace(/^\s*-/, "");
    return /[+\-]/.test(s);
  }

  function openRootChain(sign) {
    var want = state.problem.quad;
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
    pushTrailHtml(rootFracLine(sign, num, den).outerHTML);
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
    };
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
    var w = state.problem.quad;
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
    if (!isQuadMode() || !state.quad) {
      quadGuideEl.classList.add("hidden");
      quadGuideEl.innerHTML = "";
      return;
    }
    var q = state.quad;
    var want = state.problem.quad;
    var Q = DoctematicaQuadratic;
    quadGuideEl.classList.remove("hidden");
    quadGuideEl.innerHTML = "";
    var note = document.createElement("p");
    note.className = "q-note";

    if (q.phase === "abc") {
      note.innerHTML =
        "רשמו את המקדמים בנוסחה " +
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

  function applyQuadResult(result, extra) {
    state.stats.try += 1;
    saveStats();
    renderStats();
    var q = state.quad;
    var want = state.problem.quad;
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
      q.phase = "plug";
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
      q.phase = want.kind === "none" ? "count" : "sqrt";
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
    if (state.problem.quad.kind !== "none") {
      state.quad.trail.push({
        html: '<span class="m-expr" dir="ltr">' + state.problem.quad.answer.replace(/-/g, "−") + "</span>",
      });
    }
    renderQuadGuide();
    renderSteps();
    markSolved();
    mathField.setDisabled(true);
    checkBtn.disabled = true;
    nextAfterSolveBtn.classList.remove("hidden");
    showFeedback(true, "<strong>כל הכבוד.</strong> " + message);
  }

  function handleQuadSubmit() {
    if (!state.quad || state.locked) return;
    var Q = DoctematicaQuadratic;
    var want = state.problem.quad;
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
    var want = state.problem.quad;
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
      pushTrailHtml(rootFracLine(sign, q.root.lastNum, q.root.lastDen).outerHTML);
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
    pushTrailHtml(
      rootFracLine(sign, q.root.lastNum, q.root.lastDen, Q.fmt(Q.rootWant(want, sign))).outerHTML
    );
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
    var want = state.problem.quad;
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

  function applySqrtEqTyped(typed) {
    if (!typed) {
      showFeedback(false, "<strong>עוד לא.</strong> כתבו את הצעד הבא.");
      return false;
    }
    state.stats.try += 1;
    saveStats();
    renderStats();
    var prev = state.history[state.history.length - 1];
    var pack = state.problem.sqrt;
    var Q = DoctematicaQuadratic;
    var both = Q.checkSqrtBothSides(prev, typed);
    if (both) {
      if (!both.ok) {
        showFeedback(false, "<strong>עוד לא.</strong> " + both.message);
        return false;
      }
      state.history.push(typed);
      renderSteps();
      mathField.clear();
      showFeedback(true, "<strong>נכון.</strong> " + both.message);
      mathField.focus();
      return true;
    }
    var isolated = false;
    var h;
    for (h = 0; h < state.history.length; h++) {
      var isoH = Q.isolatedK(state.history[h]);
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
      state.history.push(typed);
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
    state.history.push(typed);
    renderSteps();
    if (fin.solved) {
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

  function setModeUi() {
    if (isStepMode() || isSystemMode() || isQuadMode() || isSqrtEqMode() || isFactorEqMode()) {
      answerLabelEl.textContent = "הצעד הבא";
      hintEl.textContent = isSqrtEqMode()
        ? "בודדו את x² כמו במשוואה. אחרי x² = מספר אפשר √(x²)=√(מספר), ואז לחשב. אם השורש שלם / חצי / רבע — רשמו x = ± מספר. אם לא — אפשר להשאיר ±√. שלילי: אין פתרון ממשי."
        : isFactorEqMode()
          ? "הוציאו גורם משותף x, למשל x²−5x=0 → x(x−5)=0. אפשר גם 2x(x−4). אחרי הפירוק לחצו «חילוק למשוואות» ופתרו כל גורם = 0."
          : "הקלידו רגיל. לשבר לחצו «שבר» — החצים זזים בין מונה למכנה. לשבר-בתוך-שבר עמדו במונה או במכנה ולחצו «שבר» שוב.";
    } else {
      answerLabelEl.textContent = "התשובה שלך";
      hintEl.textContent = "אפשר לכתוב מספר שלם, שבר כמו 3/4, או עשרוני כמו 0.75";
      answerEl.placeholder = "למשל 5 או 3/4";
    }
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
      if (quadGuideEl) {
        quadGuideEl.classList.add("hidden");
        quadGuideEl.innerHTML = "";
      }
      if (splitEqsBtn) splitEqsBtn.classList.add("hidden");
      topicLabelEl.textContent = currentTopicLabel() + " · " + currentLevel().title;
      setModeUi();
      hintBtn.classList.add("hidden");
      oneStepBtn.classList.add("hidden");
      showSolutionBtn.classList.add("hidden");
      eqActions.classList.add("hidden");
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
      state.quad = null;
    } else if (isQuadMode()) {
      state.sys = null;
      state.history = [];
      startQuadSession();
    } else {
      state.sys = null;
      state.quad = null;
      state.factor = emptyFactorState();
      state.sqrtProg = { pos: false, neg: false };
      state.history = isEqWorkMode() ? [state.problem.startEquation] : [];
    }
    topicLabelEl.textContent = isWorksheet()
      ? (state.topic === "equations" ? currentTopicLabel() + " · " : "") +
        currentLevel().title +
        " · תרגיל " +
        state.problem.n
      : currentTopicLabel();
    setModeUi();
    hintBtn.classList.toggle("hidden", !(isStepMode() || isQuadMode() || isSqrtEqMode() || isFactorEqMode()));
    oneStepBtn.classList.toggle("hidden", !(isStepMode() || isQuadMode() || isSqrtEqMode() || isFactorEqMode()));
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
    modelEl.classList.add("hidden");
    modelEl.innerHTML = "";
    if (isSystemMode()) {
      promptEl.innerHTML = DoctematicaMath.systemHTML(state.problem.eq1, state.problem.eq2);
      renderSysGuide();
      renderSteps();
      return;
    }
    sysGuideEl.classList.add("hidden");
    sysGuideEl.innerHTML = "";
    if (isQuadMode()) {
      promptEl.innerHTML = DoctematicaMath.toHTML(state.problem.startEquation);
      renderQuadGuide();
      renderSteps();
      return;
    }
    if (quadGuideEl) {
      quadGuideEl.classList.add("hidden");
      quadGuideEl.innerHTML = "";
    }
    renderSysKnown();
    mathWrap.classList.remove("hidden");
    checkBtn.classList.remove("hidden");
    answerLabelEl.classList.remove("hidden");
    if (isStepMode() || isSqrtEqMode() || isFactorEqMode()) {
      promptEl.innerHTML = DoctematicaMath.toHTML(state.problem.startEquation);
      mathKeysEl.classList.remove("hidden");
    } else {
      promptEl.textContent = state.problem.prompt;
      mathKeysEl.classList.add("hidden");
    }
    renderSteps();
    mathField.focus();
  }

  if (splitEqsBtn) {
    splitEqsBtn.addEventListener("click", function () {
      doFactorSplit();
    });
  }

  formEl.addEventListener("submit", function (event) {
    event.preventDefault();
    if (state.locked || !state.problem) return;

    if (isSystemMode()) {
      handleSystemSubmit();
      return;
    }

    if (isQuadMode()) {
      handleQuadSubmit();
      return;
    }

    if (isSqrtEqMode()) {
      handleSqrtEqSubmit();
      return;
    }

    if (isFactorEqMode()) {
      applyFactorTyped(typedAnswer());
      return;
    }

    if (isStepMode()) {
      var result = DoctematicaAlgebra.checkStep(
        state.history[state.history.length - 1],
        typedAnswer()
      );
      state.stats.try += 1;
      saveStats();
      renderStats();
      if (!result.ok) {
        showFeedback(false, "<strong>עוד לא.</strong> " + result.message);
        return;
      }
      state.history.push(typedAnswer().trim());
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
    if (isSystemMode()) {
      modelEl.classList.remove("hidden");
      modelEl.innerHTML =
        "<strong>המערכת:</strong> " +
        DoctematicaMath.systemHTML(state.problem.eq1, state.problem.eq2) +
        "<p>הפתרון: " +
        state.problem.answer +
        "</p><p>" +
        state.problem.explain +
        "</p>";
      return;
    }
    if (isQuadMode()) {
      modelEl.classList.remove("hidden");
      var qlines = (state.problem.solutionSteps || [])
        .map(function (step) {
          return "<li dir=\"ltr\">" + String(step).replace(/-/g, "−") + "</li>";
        })
        .join("");
      modelEl.innerHTML =
        "<strong>פתרון מלא — נוסחת שורשים</strong><ol>" +
        qlines +
        "</ol><p>" +
        String(state.problem.answer).replace(/-/g, "−") +
        "</p>";
      return;
    }
    if (isSqrtEqMode()) {
      modelEl.classList.remove("hidden");
      var slines = (state.problem.solutionSteps || [])
        .map(function (step) {
          return "<li>" + DoctematicaMath.toHTML(step) + "</li>";
        })
        .join("");
      modelEl.innerHTML =
        "<strong>פתרון מלא — ביצוע שורש</strong><ol>" +
        slines +
        "</ol><p>" +
        String(state.problem.answer).replace(/-/g, "−") +
        "</p>";
      return;
    }
    if (isFactorEqMode()) {
      modelEl.classList.remove("hidden");
      var flines = (state.problem.solutionSteps || [])
        .map(function (step) {
          return "<li>" + DoctematicaMath.toHTML(step) + "</li>";
        })
        .join("");
      modelEl.innerHTML =
        "<strong>פתרון מלא — הוצאת גורם משותף</strong><ol>" +
        flines +
        "</ol><p>" +
        String(state.problem.answer).replace(/-/g, "−") +
        "</p>";
      return;
    }
    if (!state.problem.solutionSteps) return;
    modelEl.classList.remove("hidden");
    var notes = state.problem.solutionNotes || [];
    var lines = state.problem.solutionSteps
      .map(function (step, i) {
        var why = notes[i]
          ? "<div class=\"why\">" + notes[i] + "</div>"
          : "";
        return "<li>" + DoctematicaMath.toHTML(step) + why + "</li>";
      })
      .join("");
    modelEl.innerHTML =
      "<strong>פתרון מלא לפי הדרך הנלמדת</strong> <span class=\"muted-note\">(אפשר גם לדלג על שלבי ביניים, כל עוד המשוואה שקולה)</span><ol>" +
      lines +
      "</ol><p>הפתרון: x = " +
      state.problem.answer +
      "</p>";
  });

  hintBtn.addEventListener("click", function () {
    if (!state.problem) return;
    if (isQuadMode() && state.quad) {
      var want = state.problem.quad;
      var phase = state.quad.phase;
      var tip =
        phase === "abc"
          ? "a מקדם x², b מקדם x, c החופשי. כאן a = " + want.a + "."
          : phase === "plug"
            ? "הציבו a, b, c. אם b שלילי, ב־b² כתבו עם סוגריים, למשל (−4)²."
            : phase === "compute"
              ? "חשבו −b, את " +
                DoctematicaQuadratic.discExpr(want.a, want.b, want.c) +
                ", ואת 2a. שני מינוסים הופכים לפלוס."
              : phase === "sqrt"
                ? "√(" + want.D + ") הוא מספר שלם."
                : phase === "count"
                  ? "הסתכלו על סימן הדיסקרימיננטה Δ = " + want.D + ". אפשר גם ללחוץ המשך."
                  : phase === "nosol"
                    ? "רשמו שאין פתרון ממשי."
                    : phase === "rootwork"
                      ? "חשבו קודם את המונה, ואז את השבר עם קו השבר. אחר כך את התוצאה."
                      : phase === "roots"
                        ? "x = (−b ± √Δ) / (2a). צמצמו את השבר."
                        : "התרגיל כבר פתור.";
      showFeedback(true, "<strong>רמז.</strong> " + tip, "tip");
      return;
    }
    if (isSqrtEqMode()) {
      var scur = state.history[state.history.length - 1];
      var sact = DoctematicaTeach.nextAction(scur, { unknown: "x2" });
      if (sact.isolated || sact.done) {
        var sfin = DoctematicaQuadratic.nextSqrtStep(scur, state.problem.sqrt);
        showFeedback(true, "<strong>רמז.</strong> " + ((sfin && sfin.hint) || sact.hint), "tip");
        return;
      }
      showFeedback(true, "<strong>רמז.</strong> " + sact.hint, "tip");
      return;
    }
    if (isFactorEqMode()) {
      var fhint = DoctematicaQuadratic.nextFactorStep(
        lastHistoryEq(),
        state.problem.factor,
        state.factor || emptyFactorState()
      );
      showFeedback(true, "<strong>רמז.</strong> " + ((fhint && fhint.hint) || "הוציאו גורם משותף x."), "tip");
      return;
    }
    if (!isStepMode()) return;
    var cur = state.history[state.history.length - 1];
    var act = DoctematicaTeach.nextAction(cur);
    if (act.done) {
      showFeedback(true, "<strong>רמז.</strong> " + act.hint);
      return;
    }
    showFeedback(true, "<strong>רמז.</strong> " + act.hint, "tip");
  });

  oneStepBtn.addEventListener("click", function () {
    if (state.locked || !state.problem) return;
    if (isQuadMode()) {
      fillQuadStep();
      return;
    }
    if (isSqrtEqMode()) {
      var qcur = state.history[state.history.length - 1];
      var qact = DoctematicaTeach.nextAction(qcur, { unknown: "x2" });
      var nextEq = qact.eq;
      if (!nextEq) {
        var qfin = DoctematicaQuadratic.nextSqrtStep(qcur, state.problem.sqrt);
        nextEq = qfin && qfin.eq;
      }
      if (!nextEq) {
        showFeedback(true, "<strong>רמז.</strong> " + (qact.hint || "התרגיל כבר פתור."));
        return;
      }
      applySqrtEqTyped(nextEq);
      return;
    }
    if (isFactorEqMode()) {
      var fnext = DoctematicaQuadratic.nextFactorStep(
        lastHistoryEq(),
        state.problem.factor,
        state.factor || emptyFactorState()
      );
      if (fnext && fnext.split) {
        doFactorSplit();
        return;
      }
      if (!fnext || !fnext.eq) {
        showFeedback(true, "<strong>רמז.</strong> " + ((fnext && fnext.hint) || "התרגיל כבר פתור."), "tip");
        return;
      }
      applyFactorTyped(fnext.eq);
      return;
    }
    if (!isStepMode()) return;
    var cur = state.history[state.history.length - 1];
    var act = DoctematicaTeach.nextAction(cur);
    if (act.done || !act.eq) {
      showFeedback(true, "<strong>רמז.</strong> " + (act.hint || "המשוואה כבר פתורה."));
      return;
    }
    var result = DoctematicaAlgebra.checkStep(cur, act.eq);
    if (!result.ok) {
      showFeedback(false, "<strong>לא הצלחתי לבצע את הצעד.</strong> " + result.message);
      return;
    }
    state.history.push(act.eq);
    renderSteps();
    mathField.clear();
    if (result.solved) {
      markSolved();
      mathField.setDisabled(true);
      checkBtn.disabled = true;
      nextAfterSolveBtn.classList.remove("hidden");
      showFeedback(true, "<strong>צעד של האתר.</strong> " + (act.explain || result.message));
      renderSteps();
    } else {
      showFeedback(true, "<strong>צעד של האתר.</strong> " + (act.explain || result.message), "tip");
      mathField.focus();
    }
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

  newBtn.addEventListener("click", nextProblem);
  levelEl.addEventListener("change", nextProblem);

  renderTopics();
  renderSubtopics();
  renderSources();
  renderKinds();
  renderStats();
  nextProblem();
})();
