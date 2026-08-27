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
    if (level.mode === "quad-factor" || level.mode === "high-factor") {
      var fa =
        level.mode === "high-factor"
          ? DoctematicaQuadratic.analyzeHighFactorStart(ex.start)
          : DoctematicaQuadratic.analyzeFactorStart(ex.start);
      return {
        mode: level.mode,
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        factor: fa,
        solutionSteps: fa.steps,
        answer: fa.answer,
        explain: fa.high
          ? "העבירו לאגף אחד אם צריך, הוציאו חזקה משותפת של x, פצלו לשתי משוואות, ופתרו — ייתכן שענף אחד ריבועי."
          : "הוציאו גורם משותף x (ואפשר גם מספר), ואז פתרו כל גורם כמשוואה ששווה לאפס.",
      };
    }
    if (level.mode === "geo-length") {
      var geo = DoctematicaGeometry.analyzeStart(ex);
      return {
        mode: "geo-length",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: level.instruction,
        geo: geo,
        points: geo.points,
        solutionSteps: geo.steps,
        answer: geo.answer,
        explain:
          "על ציר או על ישר מקביל: ערך גדול פחות ערך קטן. אפשר גם לרשום ישר את התשובה (למשל AB=3 או 3).",
      };
    }
    if (level.mode === "high-root") {
      var hr = DoctematicaQuadratic.analyzeHighRootStart(ex.start);
      return {
        mode: "high-root",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        highRoot: hr,
        solutionSteps: hr.steps,
        answer: hr.answer,
        explain:
          "בודדו xⁿ = מספר. הוציאו שורש ממעלה n (כפתור «שורש n»), למשל x = ∛(27), ואז חשבו את המספר. זוגית: ± או אין ממשי; אי־זוגית: פתרון אחד.",
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
    if (level.mode === "quad-mixed") {
      var mx = DoctematicaQuadratic.analyzeMixedStart(ex.start);
      var mixedDomain =
        DoctematicaTeach && typeof DoctematicaTeach.analyzeDomain === "function"
          ? DoctematicaTeach.analyzeDomain(ex.start)
          : null;
      return {
        mode: "quad-mixed",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        mixed: mx,
        sqrt: mx.sqrt,
        factor: mx.factor,
        quad: mx.quad,
        solutionSteps: mx.steps,
        answer: mx.answer,
        domain: mixedDomain,
        explain: mixedDomain
          ? "קודם תחום הצבה, אחר כך מכנה משותף, פתיחת סוגריים, ואיסוף ל־ax²+bx+c=0. לפי המקדמים: שורש / גורם משותף / נוסחת שורשים / משוואה רגילה."
          : "אם יש סוגריים — פתחו אותם. אם b=0 מעבירים x² לשמאל ומספרים לימין; אם c=0 מוציאים גורם; אם x² מתאפס — משוואה רגילה; אחרת נוסחת שורשים.",
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
    var domain =
      DoctematicaTeach && typeof DoctematicaTeach.analyzeDomain === "function"
        ? DoctematicaTeach.analyzeDomain(ex.start)
        : null;
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
      domain: domain,
      explain: domain
        ? "קודם תחום הצבה, אחר כך בודדו את x בצעדים שקולים."
        : "בודדו את x בצעדים שקולים עד שמתקבלת משוואה מהצורה x = מספר.",
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
        if (topicId === "analytic" && subtopicId) {
          return (item.subtopic || "segments") === subtopicId;
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
