(function () {
  var STORAGE_KEY = "doctematica-stats-v1";
  var topicsEl = document.getElementById("topics");
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
  var totalOkEl = document.getElementById("total-ok");
  var totalTryEl = document.getElementById("total-try");
  var bestEl = document.getElementById("best-streak");
  var stepsEl = document.getElementById("steps");
  var ledeEl = document.getElementById("lede");
  var checkBtn = document.getElementById("check");

  var kindsEl = document.getElementById("kinds");
  var kindsWrap = document.getElementById("kinds-wrap");
  var bankCountEl = document.getElementById("bank-count");
  var eqActions = document.getElementById("eq-actions");
  var showSolutionBtn = document.getElementById("show-solution");
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

  var state = {
    topic: "equations",
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
    if (isStepMode()) return mathField.serialize();
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
    return state.topic === "equations" || state.topic === "equations-denom";
  }

  function topicLevels() {
    return DoctematicaContent.levels(state.topic);
  }

  function isWorksheet() {
    return isStepMode() && state.source === "worksheet";
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
    if (!isStepMode()) {
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
    if (state.topic === "equations") {
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
        var first = DoctematicaContent.levels(topic.id)[0];
        state.levelId = first ? first.id : "level-01";
        renderTopics();
        renderSources();
        renderKinds();
        nextProblem();
      });
      topicsEl.appendChild(btn);
    });
  }

  function renderKinds() {
    kindsEl.innerHTML = "";
    if (!isStepMode() || isWorksheet()) {
      kindsWrap.classList.add("hidden");
      if (!isStepMode()) eqActions.classList.add("hidden");
      else eqActions.classList.remove("hidden");
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
    return found ? found.label : "";
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

  function showFeedback(ok, message) {
    feedbackEl.classList.remove("hidden", "ok", "bad");
    feedbackEl.classList.add(ok ? "ok" : "bad");
    feedbackEl.innerHTML = message;
  }

  function renderStats() {
    scoreEl.textContent = state.streak + " נכונות ברצף";
    totalOkEl.textContent = String(state.stats.ok);
    totalTryEl.textContent = String(state.stats.try);
    bestEl.textContent = String(state.stats.best);
  }

  function renderSteps() {
    stepsEl.innerHTML = "";
    if (!isStepMode()) {
      stepsEl.classList.add("hidden");
      return;
    }
    stepsEl.classList.remove("hidden");
    state.history.forEach(function (eq, index) {
      var li = document.createElement("li");
      var n = document.createElement("span");
      n.className = "n";
      n.textContent = index === 0 ? "נתון" : String(index);
      var body = document.createElement("span");
      body.innerHTML = DoctematicaMath.toHTML(eq);
      li.appendChild(n);
      li.appendChild(body);
      if (state.locked && index === state.history.length - 1) {
        li.classList.add("solved-row");
      }
      stepsEl.appendChild(li);
    });
  }

  function setModeUi() {
    if (isStepMode()) {
      ledeEl.textContent =
        "כתבו את הצעד הבא במשוואה. כל שינוי שקול מתקבל: חיבור/חיסור משני האגפים, כפל/חילוק במספר, פישוט, פתיחת סוגריים או החלפת אגפים.";
      answerLabelEl.textContent = "הצעד הבא";
      hintEl.textContent =
        "הקלידו רגיל. לשבר לחצו «שבר» — החצים זזים בין מונה למכנה. «שבר מעורב» למספר כמו 2 1/4.";
    } else {
      ledeEl.textContent =
        "תרגול ממוקד עם משוב מיידי. בחרו נושא, פתרו, וקבלו הסבר קצר אחרי כל תשובה.";
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
    state.history = isStepMode() ? [state.problem.startEquation] : [];
    topicLabelEl.textContent = isWorksheet()
      ? currentLevel().title + " · תרגיל " + state.problem.n
      : currentTopicLabel();
    setModeUi();
    renderSources();
    renderWorksheetNav();
    renderKinds();
    if (isStepMode()) {
      promptEl.innerHTML = DoctematicaMath.toHTML(state.problem.startEquation);
      mathKeysEl.classList.remove("hidden");
    } else {
      promptEl.textContent = state.problem.prompt;
      mathKeysEl.classList.add("hidden");
    }
    checkBtn.disabled = false;
    answerEl.classList.add("sr-only");
    mathField.clear();
    answerEl.value = "";
    answerEl.disabled = false;
    nextAfterSolveBtn.classList.add("hidden");
    feedbackEl.classList.add("hidden");
    modelEl.classList.add("hidden");
    modelEl.innerHTML = "";
    renderSteps();
    mathField.focus();
  }

  formEl.addEventListener("submit", function (event) {
    event.preventDefault();
    if (state.locked || !state.problem) return;

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
    if (!state.problem || !state.problem.solutionSteps) return;
    modelEl.classList.remove("hidden");
    var lines = state.problem.solutionSteps
      .map(function (step) {
        return "<li>" + DoctematicaMath.toHTML(step) + "</li>";
      })
      .join("");
    modelEl.innerHTML =
      "<strong>פתרון מלא אחד (יש גם דרכים אחרות):</strong><ol>" +
      lines +
      "</ol><p>הפתרון: x = " +
      state.problem.answer +
      "</p>";
  });

  nextAfterSolveBtn.addEventListener("click", function () {
    if (isWorksheet()) {
      var level = currentLevel();
      if (state.exerciseIndex < level.exercises.length - 1) {
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
    state.exerciseIndex = (state.exerciseIndex + level.exercises.length - 1) % level.exercises.length;
    nextProblem();
  });
  nextExBtn.addEventListener("click", function () {
    var level = currentLevel();
    state.exerciseIndex = (state.exerciseIndex + 1) % level.exercises.length;
    nextProblem();
  });

  newBtn.addEventListener("click", nextProblem);
  levelEl.addEventListener("change", nextProblem);

  renderTopics();
  renderSources();
  renderKinds();
  renderStats();
  nextProblem();
})();
