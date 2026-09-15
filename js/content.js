(function (global) {
  function toProblem(ex, level) {
    if (ex.eq1 && ex.eq2) {
      return {
        mode: "system-sub",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        eq1: ex.eq1,
        eq2: ex.eq2,
        explain: "בודדו משתנה, הציבו במשוואה השנייה, ואז מצאו את המשתנה השני.",
      };
    }
    if (level.mode === "quad-factor") {
      return {
        mode: level.mode,
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        explain: "הוציאו גורם משותף x (ואפשר גם מספר), ואז פתרו כל גורם כמשוואה ששווה לאפס.",
      };
    }
    if (level.mode === "high-factor") {
      return {
        mode: level.mode,
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        explain:
          "העבירו לאגף אחד אם צריך, הוציאו חזקה משותפת של x, פצלו לשתי משוואות, ופתרו — ייתכן שענף אחד ריבועי.",
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
      return {
        mode: "high-root",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        explain:
          "בודדו xⁿ = מספר. הוציאו שורש ממעלה n (כפתור «שורש n»), למשל x = ∛(27), ואז חשבו את המספר. זוגית: ± או אין ממשי; אי־זוגית: פתרון אחד.",
      };
    }
    if (level.mode === "quad-sqrt") {
      return {
        mode: "quad-sqrt",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        explain: "בודדו את x² כמו במשוואה רגילה, ואז הוציאו שורש משני האגפים. ייתכנו שני פתרונות, אחד, או אין פתרון ממשי.",
      };
    }
    if (level.mode === "quad-mixed") {
      var mixedDomainNeeded = /תחום/.test(level.instruction || "");
      return {
        mode: "quad-mixed",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        explain: mixedDomainNeeded
          ? "קודם תחום הצבה, אחר כך מכנה משותף, פתיחת סוגריים, ואיסוף ל־ax²+bx+c=0. לפי המקדמים: שורש / גורם משותף / נוסחת שורשים / משוואה רגילה."
          : "אם יש סוגריים — פתחו אותם. אם b=0 מעבירים x² לשמאל ומספרים לימין; אם c=0 מוציאים גורם; אם x² מתאפס — משוואה רגילה; אחרת נוסחת שורשים.",
      };
    }
    if (level.mode === "quad-formula") {
      return {
        mode: "quad-formula",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        explain: "זהו a, b, c, הציבו בנוסחה, חשבו את הדיסקרימיננטה, ואז את הפתרונות הממשיים.",
      };
    }
    if ((level.subtopic || "basic") === "basic") {
      return {
        mode: "steps",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        explain: "בודדו את x בצעדים שקולים עד שמתקבלת משוואה מהצורה x = מספר.",
      };
    }
    if ((level.subtopic || "") === "denom") {
      return {
        mode: "steps",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        explain: "קודם תחום הצבה אם יש נעלם במכנה, אחר כך בודדו את x בצעדים שקולים.",
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
