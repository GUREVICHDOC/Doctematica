(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "ineq-quad-1",
      topic: "inequalities",
      subtopic: "quadratic",
      mode: "ineq-quad",
      title: "רמה 1",
      instruction: "פתרו את אי־השוויונות הריבועיים. אפשר למצוא קודם את נקודות האפס, ואז את הסימן.",
      exercises: [
        { id: "ineq-quad-1-ex-a001", n: 1, start: "x^2-7x+10<0" },
        { id: "ineq-quad-1-ex-a002", n: 2, start: "x^2-2x-15<0" },
        { id: "ineq-quad-1-ex-a003", n: 3, start: "x^2-6x+5>0" },
        { id: "ineq-quad-1-ex-a004", n: 4, start: "x^2-4x>=0" },
        { id: "ineq-quad-1-ex-a005", n: 5, start: "3x^2-7x>0" },
        { id: "ineq-quad-1-ex-a006", n: 6, start: "3x^2-48>0" },
        { id: "ineq-quad-1-ex-a007", n: 7, start: "-x^2+10x-21>0" },
        { id: "ineq-quad-1-ex-a008", n: 8, start: "-x^2-x+20<=0" },
        { id: "ineq-quad-1-ex-a009", n: 9, start: "-3x^2+7x+10<0" },
        { id: "ineq-quad-1-ex-a010", n: 10, start: "x^2-4x+1>0" },
        { id: "ineq-quad-1-ex-a011", n: 11, start: "x^2-4x+4>0" },
        { id: "ineq-quad-1-ex-a012", n: 12, start: "x^2+8x+16>=0" },
        { id: "ineq-quad-1-ex-a013", n: 13, start: "x^2-20(x-5)<=0" },
        { id: "ineq-quad-1-ex-a014", n: 14, start: "-4x^2-28x-49>0" },
        { id: "ineq-quad-1-ex-a015", n: 15, start: "x^2-8x+20<0" },
        { id: "ineq-quad-1-ex-a016", n: 16, start: "x^2+16>0" },
        { id: "ineq-quad-1-ex-a017", n: 17, start: "x^2-x+6>=0" },
        { id: "ineq-quad-1-ex-a018", n: 18, start: "-2x^2+7x>=50" },
      ],
    },
  ]);
})(window);
