(function (global) {
  function toProblem(ex, level) {
    if (ex.eq1 && ex.eq2) {
      var sol = DoctematicaSystems.solvePair(ex.eq1, ex.eq2);
      var answer = "—";
      if (sol.kind === "unique") {
        answer = "x = " + DoctematicaSystems.fmt(sol.x) + ", y = " + DoctematicaSystems.fmt(sol.y);
      } else if (sol.kind === "none") {
        answer = "אין פתרון";
      } else {
        answer = "אינסוף פתרונות";
      }
      return {
        mode: "system-sub",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        eq1: ex.eq1,
        eq2: ex.eq2,
        solution: sol,
        answer: answer,
        solutionSteps: [ex.eq1, ex.eq2],
        explain: "בודדו משתנה, הציבו במשוואה השנייה, ואז מצאו את המשתנה השני.",
      };
    }
    if (level.mode === "quad-sqrt") {
      var sq = DoctematicaQuadratic.analyzeSqrtStart(ex.start);
      return {
        mode: "quad-sqrt",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        sqrt: sq,
        solutionSteps: sq.steps,
        answer: sq.answer,
        explain: "בודדו את x² כמו במשוואה רגילה, ואז הוציאו שורש משני האגפים. ייתכנו שני פתרונות, אחד, או אין פתרון ממשי.",
      };
    }
    if (level.mode === "quad-formula" || (ex.start && /x\^2|x²/.test(ex.start))) {
      var q = DoctematicaQuadratic.analyzeStart(ex.start);
      return {
        mode: "quad-formula",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        quad: q,
        solutionSteps: q.steps,
        answer: q.answer,
        explain: "זהו a, b, c, הציבו בנוסחה, חשבו את הדיסקרימיננטה, ואז את הפתרונות הממשיים.",
      };
    }
    var one = DoctematicaBank.solutionForEquation(ex.start);
    return {
      mode: "steps",
      source: "worksheet",
      levelId: level.id,
      n: ex.n,
      total: level.exercises.length,
      instruction: level.instruction,
      prompt: ex.start,
      startEquation: ex.start,
      solutionSteps: one.steps,
      solutionNotes: one.notes,
      answer: one.answer,
      value: one.value,
      explain: "בודדו את x בצעדים שקולים עד שמתקבלת משוואה מהצורה x = מספר.",
    };
  }

  global.DoctematicaContent = {
    levels: function (topicId, subtopicId) {
      var all = (global.DoctematicaCurriculum && global.DoctematicaCurriculum.levels) || [];
      if (!topicId) return all;
      return all.filter(function (item) {
        if ((item.topic || "equations") !== topicId) return false;
        if (topicId === "equations" && subtopicId) {
          return (item.subtopic || "basic") === subtopicId;
        }
        return true;
      });
    },
    problem: function (levelId, index) {
      var level = this.levels().filter(function (item) {
        return item.id === levelId;
      })[0];
      if (!level || !level.exercises[index]) return null;
      return toProblem(level.exercises[index], level);
    },
  };
})(window);
