(function (global) {
  // אחוזים. percent / 100 = part / all, והנעלם יכול לשבת בכל אחד מהמקומות.
  // כרגע unknown הוא part: ידועים האחוז והשלם, ומחפשים את החלק.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "pct-part-1",
      topic: "percents",
      subtopic: "find-part",
      mode: "percent",
      title: "רמה 1",
      instruction: "",
      exercises: [
        { id: "pct-part-1-ex-a001", n: 1, stem: "מצא כמה הם 50% מ-80.", unknown: "part", percent: 50, all: 80 },
        { id: "pct-part-1-ex-a002", n: 2, stem: "מצא כמה הם 10% מ-250.", unknown: "part", percent: 10, all: 250 },
        { id: "pct-part-1-ex-a003", n: 3, stem: "מצא כמה הם 80% מ-150.", unknown: "part", percent: 80, all: 150 },
        { id: "pct-part-1-ex-a004", n: 4, stem: "מצא כמה הם 45% מ-60.", unknown: "part", percent: 45, all: 60 },
        { id: "pct-part-1-ex-a005", n: 5, stem: "מצא כמה הם 78% מ-350.", unknown: "part", percent: 78, all: 350 },
        { id: "pct-part-1-ex-a006", n: 6, stem: "מצא כמה הם 3% מ-400.", unknown: "part", percent: 3, all: 400 },
        { id: "pct-part-1-ex-a007", n: 7, stem: "בתערוכה מוצגים 80 פסלים. 15% מהם נשברו. כמה פסלים נשברו?", unknown: "part", percent: 15, all: 80 },
        { id: "pct-part-1-ex-a008", n: 8, stem: "בגינה יש 60 פרחים. 30% מהם נבלו. כמה פרחים נבלו?", unknown: "part", percent: 30, all: 60 },
        {
          id: "pct-part-1-ex-a009",
          n: 9,
          stem: "במוזיאון ביקרו ביום מסוים 2500 איש. 80% מהם מבוגרים והשאר ילדים. כמה מבוגרים וכמה ילדים ביקרו במוזיאון?",
          all: 2500,
          groups: [
            { id: "g1", label: "מבוגרים", percent: 80 },
            { id: "g2", label: "ילדים" },
          ],
        },
        {
          id: "pct-part-1-ex-a010",
          n: 10,
          stem: "בבית קולנוע ביקרו ביום מסוים 800 איש. 35% מהם מבוגרים והשאר ילדים. כמה מבוגרים וכמה ילדים ביקרו בבית הקולנוע?",
          all: 800,
          groups: [
            { id: "g1", label: "מבוגרים", percent: 35 },
            { id: "g2", label: "ילדים" },
          ],
        },
        {
          id: "pct-part-1-ex-a011",
          n: 11,
          stem: "תמר רכשה שמלה במסגרת מכירת סוף העונה ב-80% ממחירה ההתחלתי. אם מחירה ההתחלתי של השמלה היה 180 שקלים, בכמה שקלים רכשה תמר את השמלה?",
          unknown: "part",
          percent: 80,
          all: 180,
          price: { change: "markdown", base: "initial", result: "paid" },
        },
      ],
    },
  ]);
})(window);
