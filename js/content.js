(function (global) {
  function buildProblem(ex, level) {
    if (level.mode === "meet" && ex.parts && ex.tasks) {
      return {
        mode: "fn",
        compare: true,
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        stem: ex.stem || "",
        prompt: ex.stem || level.instruction || "",
        parts: (ex.parts || []).map(function (part) {
          return { label: part.label || "", text: part.text || "" };
        }),
        explain: "השוו בין הגרפים. נקודות מפגש שכבר נמצאו נשמרות לסעיפים הבאים.",
      };
    }
    if (level.mode === "meet" && ex.eq1 && ex.eq2) {
      return {
        mode: "meet",
        stage: ex.stage || "points",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        eq1: ex.eq1,
        eq2: ex.eq2,
        explain: "מצאו את נקודות המפגש: זוג סדור (x, y) לכל נקודה, או אין נקודת מפגש.",
      };
    }
    if (ex.eq1 && ex.eq2) {
      var elim = level.mode === "system-elim";
      var arrange = level.mode === "system-arrange";
      var quad = level.mode === "system-quad";
      return {
        mode: elim ? "system-elim" : arrange ? "system-arrange" : quad ? "system-quad" : "system-sub",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        eq1: ex.eq1,
        eq2: ex.eq2,
        explain: quad
          ? "השוו בין שני הביטויים, פתרו את המשוואה הריבועית, ומצאו זוג (x, y) לכל פתרון."
          : arrange
          ? "סדרו את שתי המשוואות, בחרו שיטת הצבה או השוואת מקדמים, והמשיכו עד לפתרון."
          : elim
            ? "חברו או חסרו את המשוואות כדי לבטל משתנה, פתרו את הנעלם שנשאר, ואז הציבו במשוואה המקורית."
            : "בודדו משתנה, הציבו במשוואה השנייה, ואז מצאו את המשתנה השני.",
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
    if (level.mode === "biquad") {
      return {
        mode: "biquad",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        explain:
          "אם החזקות קשורות ביחס 2n ו־n, מציבים t=xⁿ, פותרים משוואה ריבועית ב־t, וחוזרים ל־x בכל ערך.",
      };
    }
    if (level.mode === "high-chain") {
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
          "סדרו לאגף אחד, הוציאו חזקה משותפת של x, פצלו, ופתרו כל ענף לפי הסוג שלו. אוספים את כל הפתרונות בלי כפילויות.",
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
    if (level.mode === "fn" && ex.levelProbe) {
      return {
        mode: "fn",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction || "",
        prompt: ex.stem || "",
        stem: ex.stem || "",
        levelProbe: true,
        parts: (ex.parts || []).map(function (part) {
          return { label: part.label || "", text: part.text || "" };
        }),
        explain: "הגרף נתון. הוסיפו ישר אופקי y=k וספרו בכמה נקודות הוא פוגש את הגרף. f(x)=k הוא אותו ישר.",
      };
    }
    if (level.mode === "fn" && ex.freeSketch) {
      return {
        mode: "fn",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction || "",
        prompt: ex.stem || "",
        stem: ex.stem || "",
        freeSketch: true,
        parts: (ex.parts || []).map(function (part) {
          return { label: part.label || "", text: part.text || "" };
        }),
        explain: "סמנו את הנקודות שנובעות מהנתונים, ושרטטו סקיצה אפשרית שעומדת בכל האילוצים.",
      };
    }
    if (level.mode === "fn" && ex.monoGraph) {
      return {
        mode: "fn",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction || "",
        prompt: ex.stem || "",
        stem: ex.stem || "",
        monoGraph: true,
        parts: (ex.parts || []).map(function (part) {
          return { label: part.label || "", text: part.text || "" };
        }),
        explain: "קבעו מינימום או מקסימום לפי שינוי כיוון הגרף, ואז רשמו את תחומי העלייה והירידה לפי x.",
      };
    }
    if (level.mode === "fn" && ex.signGraph) {
      return {
        mode: "fn",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction || "",
        prompt: ex.stem || "",
        stem: ex.stem || "",
        signGraph: true,
        parts: (ex.parts || []).map(function (part) {
          return { label: part.label || "", text: part.text || "" };
        }),
        explain: "קראו מהסקיצה איפה הגרף מעל ציר ה־x ואיפה מתחתיו. נקודת אפס אינה חלק מהתחום.",
      };
    }
    if (level.mode === "fn") {
      var fnPack = global.DoctematicaFn && DoctematicaFn.prepare(ex);
      return {
        mode: "fn",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction || "",
        prompt: ex.stem || level.instruction || "",
        stem: ex.stem || "",
        fn: fnPack,
        explain: "הציבו בפונקציה, פתרו משוואה כשצריך, ורשמו נקודה כזוג סדור או תחום כאי־שוויון.",
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
    if (level.mode === "percent") {
      var percentProblem = {
        mode: "percent",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction || "",
        prompt: ex.stem || "",
        stem: ex.stem || "",
        explain: "",
      };
      if (ex.parts && ex.parts.length) {
        percentProblem.parts = ex.parts.map(function (part) {
          return { label: part.label || "", text: part.text || "" };
        });
      }
      if (ex.fields && ex.fields.length) {
        percentProblem.answers = ex.fields.map(function (field) {
          var item = { id: field.id, label: field.label || "" };
          if (field.unit) item.unit = field.unit;
          return item;
        });
      } else if (ex.groups && ex.groups.length > 1 && !(ex.parts && ex.parts.length)) {
        percentProblem.answers = ex.groups.map(function (group) {
          return { id: group.id, label: group.label || "" };
        });
      }
      return percentProblem;
    }
    if (level.mode === "mean") {
      return {
        mode: "freq-table",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction || "",
        prompt: ex.stem || "",
        stem: ex.stem || "",
        table: null,
        data: ex.data && ex.data.length ? ex.data.slice() : null,
        parts: (ex.parts || []).map(function (part) {
          return { label: part.label || "", text: part.text || "" };
        }),
        explain: "",
      };
    }
    if (level.mode === "freq-table" && ex.pie) {
      return {
        mode: "freq-table",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction || "",
        prompt: ex.stem || "",
        stem: ex.stem || "",
        table: null,
        chart: null,
        pie: displayPie(ex.pie),
        data: null,
        parts: (ex.parts || []).map(function (part) {
          return { label: part.label || "", text: part.text || "" };
        }),
        explain: "",
      };
    }
    if (level.mode === "freq-table" && ex.chart) {
      var picture = ex.chart;
      return {
        mode: "freq-table",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction || "",
        prompt: ex.stem || "",
        stem: ex.stem || "",
        table: null,
        chart: {
          xLabel: picture.xLabel || "",
          yLabel: picture.yLabel || "",
          yStep: picture.yStep,
          yMax: picture.yMax,
          grid: picture.grid !== false,
          bars: (picture.rows || []).map(function (row) {
            return { value: row.value, freq: row.freq };
          }),
        },
        data: null,
        parts: (ex.parts || []).map(function (part) {
          return { label: part.label || "", text: part.text || "" };
        }),
        explain: "",
      };
    }
    if (level.mode === "freq-table") {
      var table = ex.table || {};
      var variable = table.variable || {};
      var frequency = table.frequency || {};
      return {
        mode: "freq-table",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: level.instruction || "",
        prompt: ex.stem || "",
        stem: ex.stem || "",
        table: {
          variableLabel: variable.label || "",
          frequencyLabel: frequency.label || "",
          columnOrder: table.rows && table.rows.length && table.rows.every(function (row) {
            return row.value != null && String(row.value).trim() !== "" && isFinite(Number(row.value));
          }) ? "asc" : "given",
          fill: !!(ex.data && ex.data.length) && !table.build,
          build: !!table.build,
          rows: table.build ? [] : (table.rows || []).map(function (row) {
            var cell = { value: row.value };
            if (!(ex.data && ex.data.length) && row.freq != null) cell.freq = row.freq;
            return cell;
          }),
        },
        data: ex.data && ex.data.length ? ex.data.slice() : null,
        parts: (ex.parts || []).map(function (part) {
          return { label: part.label || "", text: part.text || "" };
        }),
        explain: "",
      };
    }
    if (level.mode === "param" && ex.param) {
      var paramPack = global.DoctematicaFn && DoctematicaFn.prepare(ex);
      return {
        mode: "fn",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: ex.instruction || level.instruction,
        prompt: ex.stem || "",
        stem: ex.stem || "",
        fn: paramPack,
        explain: "הציבו את הנקודה בפונקציה, מצאו את הפרמטר, ואז המשיכו עם הפונקציה שהתקבלה.",
      };
    }
    if (level.mode === "ineq-quad") {
      return {
        mode: "ineq-quad",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: ex.instruction || level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        explain: "מוצאים את נקודות האפס, קובעים את הסימן בכל תחום, וכותבים את הפתרון.",
      };
    }
    if (level.mode === "ineq-and" || level.mode === "ineq-or") {
      var union = level.mode === "ineq-or";
      return {
        mode: level.mode,
        op: union ? "union" : "intersection",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: ex.instruction || level.instruction,
        prompt: (ex.conds || []).join(union ? " או " : " וגם "),
        conds: ex.conds || [],
        explain: union
          ? "במערכת «או» מחפשים את הערכים שמקיימים לפחות אחד מהתנאים."
          : "במערכת «וגם» מחפשים את הערכים שמקיימים את כל התנאים בו־זמנית.",
      };
    }
    if (level.mode === "ineq") {
      return {
        mode: "ineq",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: ex.instruction || level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        explain: "בודדו את x. כשמחלקים או כופלים במספר שלילי, כיוון אי־השוויון מתהפך.",
      };
    }
    if (level.mode === "param") {
      return {
        mode: "param",
        source: "worksheet",
        levelId: level.id,
        n: ex.n,
        total: level.exercises.length,
        instruction: ex.instruction || level.instruction,
        prompt: ex.start,
        startEquation: ex.start,
        solveFor: ex.solveFor || null,
        given: ex.given || null,
        explain: ex.given
          ? "הציבו את הערך הנתון של x, ואז בודדו את a."
          : "בודדו את x. שאר האותיות נשארות פרמטרים בביטוי, למשל x = 12 − m.",
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

  function displayPie(picture) {
    var sectors = (picture && picture.sectors) || [];
    var known = [];
    sectors.forEach(function (sector) {
      if (sector.percent != null && !sector.expr) known.push(Number(sector.percent));
    });
    var knownSum = known.reduce(function (sum, value) { return sum + value; }, 0);
    var mean = known.length ? knownSum / known.length : 15;
    function coeff(expr) {
      var text = String(expr || "").replace(/\s+/g, "");
      if (text === "x") return 1;
      var match = /^(\d+(?:\.\d+)?)x$/i.exec(text);
      return match ? Number(match[1]) : 1;
    }
    var symbolic = sectors.some(function (sector) { return !!sector.expr; });
    var coeffSum = 0;
    sectors.forEach(function (sector) {
      if (sector.expr) coeffSum += coeff(sector.expr);
    });
    var solved = symbolic && coeffSum ? (100 - knownSum) / coeffSum : null;
    function weightsFor(unit) {
      return sectors.map(function (sector) {
        if (!symbolic || (sector.percent != null && !sector.expr)) return Number(sector.percent);
        return coeff(sector.expr) * unit;
      });
    }
    var unit = mean;
    var weights = weightsFor(unit);
    var guard = 0;
    while (symbolic && guard < 6) {
      var total = weights.reduce(function (sum, value) { return sum + value; }, 0);
      var close = false;
      sectors.forEach(function (sector, index) {
        if (!sector.expr) return;
        var shown = weights[index] / total * 100;
        if (Math.abs(shown - coeff(sector.expr) * solved) < 6) close = true;
      });
      if (!close) break;
      unit += 11;
      weights = weightsFor(unit);
      guard += 1;
    }
    var totalWeight = weights.reduce(function (sum, value) { return sum + value; }, 0) || 1;
    return {
      sectors: sectors.map(function (sector, index) {
        return {
          label: sector.label || "",
          text: sector.expr ? String(sector.expr) : String(sector.percent) + "%",
          angle: weights[index] / totalWeight * 360,
        };
      }),
    };
  }

  function toProblem(ex, level) {
    var problem = buildProblem(ex, level);
    if (problem) problem.exerciseId = ex.id || null;
    return problem;
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
        if (topicId === "statistics" && subtopicId) {
          return (item.subtopic || "freq-table") === subtopicId;
        }
        if (topicId === "percents" && subtopicId) {
          return (item.subtopic || "find-part") === subtopicId;
        }
        if (topicId === "systems-sub" && subtopicId) {
          return (item.subtopic || "sub") === subtopicId;
        }
        if (topicId === "calculus" && subtopicId) {
          return (item.subtopic || "intro") === subtopicId;
        }
        if (topicId === "inequalities" && subtopicId) {
          return (item.subtopic || "linear") === subtopicId;
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
