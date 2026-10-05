(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "ineq-or-1",
      topic: "inequalities",
      subtopic: "sketch",
      mode: "ineq-or",
      title: "מערכת או",
      instruction: "מצאו את פתרון המערכת (מומלץ לשרטט את התחומים על ציר המספרים):",
      exercises: [
        { id: "ineq-or-1-ex-a001", n: 1, conds: ["x > 3", "x > 5"] },
        { id: "ineq-or-1-ex-a002", n: 2, conds: ["x < 7", "x > 0"] },
        { id: "ineq-or-1-ex-a003", n: 3, conds: ["x > 6", "x < 1"] },
        { id: "ineq-or-1-ex-a004", n: 4, conds: ["x > 0", "x ≤ 0"] },
        { id: "ineq-or-1-ex-a005", n: 5, conds: ["x > 3", "x < 3"] },
        { id: "ineq-or-1-ex-a006", n: 6, conds: ["x > 8", "x = 8"] },
        { id: "ineq-or-1-ex-a007", n: 7, conds: ["3x - 1 > x + 5", "2x - 7 > x + 5"] },
        { id: "ineq-or-1-ex-a008", n: 8, conds: ["-2x + 7 ≥ 3x + 1", "7x - 2 < 10"] },
      ],
    },
  ]);
})(window);
