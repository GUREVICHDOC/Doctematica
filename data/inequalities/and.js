(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "ineq-and-1",
      topic: "inequalities",
      subtopic: "sketch",
      mode: "ineq-and",
      title: "מערכת וגם",
      instruction: "מצאו את פתרון המערכת (מומלץ לשרטט את התחומים על ציר המספרים):",
      exercises: [
        { id: "ineq-and-1-ex-a001", n: 1, conds: ["x > 1", "x > 6"] },
        { id: "ineq-and-1-ex-a002", n: 2, conds: ["x > 3", "x < 7"] },
        { id: "ineq-and-1-ex-a003", n: 3, conds: ["x < 0", "x > 4"] },
        { id: "ineq-and-1-ex-a004", n: 4, conds: ["x > -2", "x ≤ 6.5"] },
        { id: "ineq-and-1-ex-a005", n: 5, conds: ["x ≤ 2", "x ≥ 2"] },
        { id: "ineq-and-1-ex-a006", n: 6, conds: ["x < 5", "x ≥ 5"] },
        { id: "ineq-and-1-ex-a007", n: 7, conds: ["15x - 7 < 29 + 11x", "3x - 15 < 25 - 5x"] },
        { id: "ineq-and-1-ex-a008", n: 8, conds: ["15 + 3x ≤ 45 - 2x", "37 + 7x < 17 + 11x"] },
        { id: "ineq-and-1-ex-a009", n: 9, conds: ["x < 5", "x < 8", "x < 7"] },
        { id: "ineq-and-1-ex-a010", n: 10, conds: ["6x - 7 > 2x + 5", "x ≥ 10", "4x - 11 < 7 - 5x"] },
        { id: "ineq-and-1-ex-a011", n: 11, conds: ["23 < 4x + 7 < 39"] },
        { id: "ineq-and-1-ex-a012", n: 12, conds: ["x + 4 < 5x < 4x + 9"] },
        { id: "ineq-and-1-ex-a013", n: 13, conds: ["3x + 1 < 7x + 13 ≤ 5x + 29"] },
        { id: "ineq-and-1-ex-a014", n: 14, conds: ["2(x - 2) + 12 < 4(x + 3) < 7x + 29"] },
      ],
    },
  ]);
})(window);
