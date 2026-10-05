(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "ineq-lin-1",
      topic: "inequalities",
      subtopic: "linear",
      mode: "ineq",
      title: "רמה 1",
      instruction: "פתרו את אי־השוויונות הבאים (בודדו את x):",
      exercises: [
        { id: "ineq-lin-1-ex-a001", n: 1, start: "x + 3 < 8" },
        { id: "ineq-lin-1-ex-a002", n: 2, start: "3x > 12" },
        { id: "ineq-lin-1-ex-a003", n: 3, start: "5x + 7 < 42" },
        { id: "ineq-lin-1-ex-a004", n: 4, start: "2x + 17 ≤ 5" },
        { id: "ineq-lin-1-ex-a005", n: 5, start: "6x - 24 ≥ 0" },
        { id: "ineq-lin-1-ex-a006", n: 6, start: "-3x > 21" },
        { id: "ineq-lin-1-ex-a007", n: 7, start: "-x < -9" },
        { id: "ineq-lin-1-ex-a008", n: 8, start: "-5x + 32 ≤ 12" },
        { id: "ineq-lin-1-ex-a009", n: 9, start: "8x + 14 < 50 + 2x" },
        { id: "ineq-lin-1-ex-a010", n: 10, start: "6x + 16 ≥ 9x - 5" },
        { id: "ineq-lin-1-ex-a011", n: 11, start: "5x + 6 - 7x > -9 - 3(2x - 9)" },
        { id: "ineq-lin-1-ex-a012", n: 12, start: "19 - 4(x - 5) ≥ 6(x + 4) - 5(x + 2)" },
        { id: "ineq-lin-1-ex-a013", n: 13, start: "(x + 4)/6 - (x - 2)/4 < 1" },
        { id: "ineq-lin-1-ex-a014", n: 14, start: "(3x - 2)/8 + (3x + 3)/5 ≥ 4 - (15x + 2)/4" },
        { id: "ineq-lin-1-ex-a015", n: 15, start: "40x - 127 - 28x > 12x + 28" },
        { id: "ineq-lin-1-ex-a016", n: 16, start: "8x - 15 + 11x < 24 + 19x - 32" },
        { id: "ineq-lin-1-ex-a017", n: 17, start: "7x + 3 - 2x < 19 + 5x - 16" },
        { id: "ineq-lin-1-ex-a018", n: 18, start: "2 + 13x + 18 ≥ 7x + 16 + 6x" },
      ],
    },
  ]);
})(window);
