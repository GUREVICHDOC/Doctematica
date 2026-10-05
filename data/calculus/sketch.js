(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "calc-sketch-1",
      topic: "calculus",
      subtopic: "pre",
      mode: "fn",
      title: "שרטוט לפי נתונים",
      instruction: "סמנו את הנקודות שנובעות מהנתונים, ושרטטו סקיצה אפשרית. אין גרף יחיד נכון.",
      exercises: [
        {
          id: "calc-sketch-1-ex-a001",
          n: 1,
          freeSketch: true,
          stem: "הפונקציה f(x) מוגדרת בתחום 0≤x≤5. נתון: f(0)=5, f(2)=1, f(5)=10.",
          constraints: [
            { type: "DOMAIN", min: 0, max: 5, includeMin: true, includeMax: true },
            { type: "KNOWN_POINT", x: 0, y: 5 },
            { type: "KNOWN_POINT", x: 2, y: 1 },
            { type: "KNOWN_POINT", x: 5, y: 10 },
          ],
          parts: [
            {
              label: "א",
              text: "שרטטו סקיצה אפשרית של גרף הפונקציה.",
              tasks: [{ id: "sketch", kind: "freeSketch" }],
            },
            {
              label: "ב",
              text: "(1) האם ייתכן f(3)=6? (2) האם ייתכן f(3)=8?",
              tasks: [
                { id: "y6", kind: "feasible", prompt: "האם ייתכן f(3)=6?", claim: { type: "point", x: 3, y: 6 } },
                { id: "y8", kind: "feasible", prompt: "האם ייתכן f(3)=8?", claim: { type: "point", x: 3, y: 8 } },
              ],
            },
          ],
        },
        {
          id: "calc-sketch-1-ex-a002",
          n: 2,
          freeSketch: true,
          stem: "הפונקציה f(x) מוגדרת בתחום −2≤x≤3. נתון: f(−2)=−6, f(1)=3, f(3)=−1.",
          constraints: [
            { type: "DOMAIN", min: -2, max: 3, includeMin: true, includeMax: true },
            { type: "KNOWN_POINT", x: -2, y: -6 },
            { type: "KNOWN_POINT", x: 1, y: 3 },
            { type: "KNOWN_POINT", x: 3, y: -1 },
          ],
          parts: [
            {
              label: "א",
              text: "שרטטו סקיצה אפשרית של גרף הפונקציה.",
              tasks: [{ id: "sketch", kind: "freeSketch" }],
            },
            {
              label: "ב",
              text: "(1) האם ייתכן f(−1)=0? (2) האם ייתכן f(0)=0?",
              tasks: [
                { id: "z1", kind: "feasible", prompt: "האם ייתכן f(−1)=0?", claim: { type: "point", x: -1, y: 0 } },
                { id: "z0", kind: "feasible", prompt: "האם ייתכן f(0)=0?", claim: { type: "point", x: 0, y: 0 } },
              ],
            },
            {
              label: "ג",
              text: "(1) האם ייתכן שגרף הפונקציה חותך את ציר ה־x פעמיים? (2) האם ייתכן שגרף הפונקציה חותך את ציר ה־x פעם אחת?",
              tasks: [
                { id: "twice", kind: "feasible", prompt: "האם ייתכן שגרף הפונקציה חותך את ציר ה־x פעמיים?", claim: { type: "zeros", count: 2 } },
                { id: "once", kind: "feasible", prompt: "האם ייתכן שגרף הפונקציה חותך את ציר ה־x פעם אחת?", claim: { type: "zeros", count: 1 } },
              ],
            },
          ],
        },
        {
          id: "calc-sketch-1-ex-a003",
          n: 3,
          freeSketch: true,
          stem: "הפונקציה f(x) מוגדרת בתחום 0≤x≤6. גרף הפונקציה נפגש עם ציר ה־y בנקודה שבה y=−9. נתון: f(1)=−11, f(5)=11, f(6)=9.",
          constraints: [
            { type: "DOMAIN", min: 0, max: 6, includeMin: true, includeMax: true },
            { type: "Y_INTERCEPT", y: -9 },
            { type: "KNOWN_POINT", x: 1, y: -11 },
            { type: "KNOWN_POINT", x: 5, y: 11 },
            { type: "KNOWN_POINT", x: 6, y: 9 },
          ],
          parts: [
            {
              label: "א",
              text: "שרטטו סקיצה אפשרית של גרף הפונקציה.",
              tasks: [{ id: "sketch", kind: "freeSketch" }],
            },
            {
              label: "ב",
              text: "כמה נקודות אפס לפחות יש לפונקציה?",
              tasks: [{ id: "least", kind: "atLeastZeros", prompt: "כמה נקודות אפס לפחות יש לפונקציה?" }],
            },
          ],
        },
        {
          id: "calc-sketch-1-ex-a004",
          n: 4,
          freeSketch: true,
          stem: "הפונקציה f(x) מוגדרת בתחום −2≤x≤6. נתון: f(−2)=0, f(0)=3, ובכל התחום 2≤x≤6 מתקיים f(x)=6.",
          constraints: [
            { type: "DOMAIN", min: -2, max: 6, includeMin: true, includeMax: true },
            { type: "KNOWN_POINT", x: -2, y: 0 },
            { type: "KNOWN_POINT", x: 0, y: 3 },
            { type: "CONSTANT_INTERVAL", fromX: 2, toX: 6, value: 6 },
          ],
          parts: [
            {
              label: "א",
              text: "שרטטו סקיצה אפשרית של גרף הפונקציה.",
              tasks: [{ id: "sketch", kind: "freeSketch" }],
            },
          ],
        },
      ],
    },
  ]);
})(window);
