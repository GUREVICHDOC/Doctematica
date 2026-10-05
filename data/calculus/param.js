(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "calc-param-1",
      topic: "calculus",
      subtopic: "intro",
      mode: "param",
      title: "פונקציות עם פרמטרים",
      instruction: "פתרו את המשוואות הבאות (הביעו את x באמצעות הפרמטר):",
      exercises: [
        { id: "calc-param-1-ex-a001", n: 1, start: "x + m = 12" },
        { id: "calc-param-1-ex-a002", n: 2, start: "2x = 10a" },
        { id: "calc-param-1-ex-a003", n: 3, start: "2x + 5a = -x + 4a" },
        { id: "calc-param-1-ex-a004", n: 4, start: "2a + x = 3(a - x)" },
        {
          id: "calc-param-1-ex-a005",
          n: 5,
          start: "x + a = 8",
          given: { letter: "x", value: 5 },
          solveFor: "a",
          instruction: "לפניכם משוואות עם פרמטרים. ליד כל משוואה נתון ערך המשתנה x. מצאו את הפרמטר a.",
        },
        {
          id: "calc-param-1-ex-a006",
          n: 6,
          start: "3x = 6a",
          given: { letter: "x", value: -2 },
          solveFor: "a",
          instruction: "לפניכם משוואות עם פרמטרים. ליד כל משוואה נתון ערך המשתנה x. מצאו את הפרמטר a.",
        },
        {
          id: "calc-param-1-ex-a007",
          n: 7,
          start: "-3x + 4a = -x + 7a",
          given: { letter: "x", value: -3 },
          solveFor: "a",
          instruction: "לפניכם משוואות עם פרמטרים. ליד כל משוואה נתון ערך המשתנה x. מצאו את הפרמטר a.",
        },
        {
          id: "calc-param-1-ex-a008",
          n: 8,
          start: "2(3x - a - 7) = 3(a - x - 5)",
          given: { letter: "x", value: 6 },
          solveFor: "a",
          instruction: "לפניכם משוואות עם פרמטרים. ליד כל משוואה נתון ערך המשתנה x. מצאו את הפרמטר a.",
        },
        {
          id: "calc-param-1-ex-a009",
          n: 9,
          stem: "הפונקציה g(x) = mx − 6 מקיימת g(−3) = 15.",
          instruction: "נתונה פונקציה עם פרמטר. הציבו את הנקודה או את הערך הנתון, מצאו את הפרמטר, והמשיכו עם הפונקציה שהתקבלה.",
          param: { expr: "mx-6", letter: "m", name: "g", points: [{ x: -3, y: 15 }] },
          parts: [
            { label: "א", text: "מצאו את הפרמטר m.", taskIds: ["p"] },
            { label: "ב", text: "כתבו את משוואת הפונקציה ללא פרמטרים.", taskIds: ["f"] },
          ],
          tasks: [
            { id: "p", kind: "paramPoint" },
            { id: "f", kind: "paramApply" },
          ],
        },
        {
          id: "calc-param-1-ex-a010",
          n: 10,
          stem: "ידוע כי ערך הפונקציה y = −5x² + 2n בנקודה x = −1 הוא 3. מצאו את n.",
          instruction: "נתונה פונקציה עם פרמטר. הציבו את הנקודה או את הערך הנתון, מצאו את הפרמטר, והמשיכו עם הפונקציה שהתקבלה.",
          param: { expr: "-5x^2+2n", letter: "n", name: "y", points: [{ x: -1, y: 3 }] },
          parts: [{ label: "", text: "מצאו את n.", taskIds: ["p"] }],
          tasks: [{ id: "p", kind: "paramPoint" }],
        },
        {
          id: "calc-param-1-ex-a011",
          n: 11,
          stem: "גרף הפרבולה y = x² + c עובר בנקודה (4,12). c הוא פרמטר.",
          instruction: "נתונה פונקציה עם פרמטר. הציבו את הנקודה או את הערך הנתון, מצאו את הפרמטר, והמשיכו עם הפונקציה שהתקבלה.",
          param: { expr: "x^2+c", letter: "c", name: "y", points: [{ x: 4, y: 12 }] },
          parts: [
            { label: "א", text: "מצאו את הערך של הפרמטר c.", taskIds: ["p"] },
            { label: "ב", text: "מצאו את נקודות החיתוך של גרף הפרבולה עם ציר ה־x.", taskIds: ["z"] },
          ],
          tasks: [
            { id: "p", kind: "paramPoint" },
            { id: "z", kind: "fnZero", points: true },
          ],
        },
        {
          id: "calc-param-1-ex-a012",
          n: 12,
          stem: "גרף הפונקציה שבציור מתואר על־ידי המשוואה y = −2x² + bx. בהסתמך על הגרף מצאו את הערך של הפרמטר b.",
          instruction: "נתונה פונקציה עם פרמטר. הציבו את הנקודה או את הערך הנתון, מצאו את הפרמטר, והמשיכו עם הפונקציה שהתקבלה.",
          graph: true,
          marks: [2],
          param: {
            expr: "-2x^2+bx",
            letter: "b",
            name: "y",
            fromGraph: true,
            points: [{ x: 0, y: 0 }, { x: 2, y: 0 }],
          },
          parts: [{ label: "", text: "מצאו את הערך של הפרמטר b.", taskIds: ["p"] }],
          tasks: [{ id: "p", kind: "paramPoint" }],
        },
      ],
    },
  ]);
})(window);
