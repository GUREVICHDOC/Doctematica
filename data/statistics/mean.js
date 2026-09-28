(function (global) {
  // ממוצע מרשימה. בחירת הנתונים והחישוב נעשים במנוע הכללי.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;

  function ex(n, stem, data, parts) {
    return {
      id: "stat-mean-1-ex-a00" + n,
      n: n,
      stem: stem,
      data: data,
      parts: parts,
    };
  }

  function meanOf(id, values, select, extra) {
    var task = {
      id: id,
      kind: "mean",
      source: { type: "list", values: values.slice() },
      select: select || { type: "all" },
    };
    Object.keys(extra || {}).forEach(function (key) { task[key] = extra[key]; });
    return task;
  }

  var geography = [6, 6, 7, 8, 8];
  var weights = [7, 10, 12, 15, 13, 6, 8, 4, 9, 10];
  var grades = [70, 75, 80, 90, 95, 100];
  var ages = [48, 38, 43, 37, 50, 35, 55, 27, 32, 45];

  C.levels = C.levels.concat([
    {
      id: "stat-mean-1",
      topic: "statistics",
      subtopic: "mean",
      mode: "mean",
      title: "ממוצע מרשימה – רמה 1",
      instruction: "",
      exercises: [
        ex(1, "חמישה תלמידים נבחנו באזרחות וקיבלו את הציונים: 6, 6, 7, 8, 8.", geography, [
          {
            label: "",
            text: "חשב את הציון הממוצע במבחן זה.",
            tasks: [meanOf("mean", geography)],
          },
        ]),
        ex(2, "עשרה פעוטות נשקלו ומשקלם בק״ג נרשם כדלקמן: 7, 10, 12, 15, 13, 6, 8, 4, 9, 10.", weights, [
          {
            label: "",
            text: "מצא את המשקל הממוצע של התינוקות הללו.",
            tasks: [meanOf("mean", weights)],
          },
        ]),
        ex(3, "לפניכם רשימת הציונים של התלמידים שנבחנו: 70, 75, 80, 90, 95, 100.", grades, [
          {
            label: "א",
            text: "מהו המשתנה? האם הוא איכותי או כמותי?",
            tasks: [{
              id: "variable",
              kind: "variable",
              names: ["ציון"],
              displayName: "הציון",
              scale: "quantitative",
            }],
          },
          {
            label: "ב",
            text: "חשבו את הציון הממוצע של 6 התלמידים.",
            tasks: [meanOf("all", grades)],
          },
          {
            label: "ג",
            text: "חשבו את הציון הממוצע של ארבעת התלמידים שקיבלו את הציונים הגבוהים ביותר.",
            tasks: [meanOf("top", grades, { type: "top", n: 4, thing: "הציונים" })],
          },
        ]),
        ex(4, "בבית ספר מסוים מלמדים 10 מורים. גילי המורים (בשנים) הם: 48, 38, 43, 37, 50, 35, 55, 27, 32, 45.", ages, [
          {
            label: "ב",
            text: "חשבו את הגיל הממוצע של מורה בבית הספר.",
            tasks: [meanOf("all", ages)],
          },
          {
            label: "ג",
            text: "(1) כמה מהמורים הם בעלי גיל נמוך מהגיל הממוצע?\n(2) חשבו את הגיל הממוצע של המורים שגילם נמוך מהממוצע.",
            tasks: [
              meanOf("below-count", ages, { type: "compare", op: "<", against: "mean" }, { of: "count", q: 1 }),
              meanOf("below-mean", ages, { type: "compare", op: "<", against: "mean" }, { q: 2 }),
            ],
          },
        ]),
      ],
    },
  ]);
})(window);
