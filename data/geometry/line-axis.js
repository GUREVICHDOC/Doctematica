(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
{
      id: "geo-line-axis-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "נקודות חיתוך עם הצירים",
      instruction:
        "נקודת חיתוך עם ציר y: הציבו x = 0 ומצאו y. נקודת חיתוך עם ציר x: הציבו y = 0 ופתרו משוואה בנעלם אחד. אם המשוואה לא בצורת y = … — אפשר להציב ישירות, או קודם לסדר (לא חובה).",
      exercises: [
        {
          id: "geo-line-axis-1-ex-a001",
          n: 1,
          line: { m: 2, b: 6 },
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 0, y: 6, hideY: true },
            { label: "B", x: -3, y: 0, hideX: true },
          ],
          parts: [
            {
              label: "א",
              text: "בציור מתואר הישר y = 2x + 6. נקודה A היא נקודת החיתוך של הישר עם ציר y. מצאו את שיעורי נקודה A.",
              taskIds: ["A"],
            },
            {
              label: "ב",
              text: "נקודה B היא נקודת החיתוך של הישר עם ציר x. מצאו את שיעורי נקודה B.",
              taskIds: ["B"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y" },
            { id: "B", label: "B", kind: "point", point: "B", missing: "x", intercept: "x" },
          ],
        },
        {
          id: "geo-line-axis-1-ex-a002",
          n: 2,
          line: { m: -4, b: 20 },
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 0, y: 20, hideY: true },
            { label: "B", x: 5, y: 0, hideX: true },
          ],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = −4x + 20. הנקודות A ו־B הן נקודות החיתוך של הישר עם הצירים (ראו שרטוט). מצאו את שיעורי הנקודות A ו־B.",
              taskIds: ["A", "B"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y" },
            { id: "B", label: "B", kind: "point", point: "B", missing: "x", intercept: "x" },
          ],
        },
        {
          id: "geo-line-axis-1-ex-a003",
          n: 3,
          line: { eqText: "x + y = 4", implicit: { ax: 1, ay: 1, c: 4 } },
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "P", x: 4, y: 0, hideX: true },
            { label: "Q", x: 0, y: 4, hideY: true },
          ],
          parts: [
            {
              label: "א",
              text: "נתונה הפונקציה x + y = 4. מצאו את נקודת החיתוך של גרף הפונקציה עם ציר x.",
              taskIds: ["P"],
            },
            {
              label: "ב",
              text: "מצאו את נקודת החיתוך של גרף הפונקציה עם ציר y.",
              taskIds: ["Q"],
            },
          ],
          tasks: [
            { id: "P", label: "P", kind: "point", point: "P", missing: "x", intercept: "x" },
            { id: "Q", label: "Q", kind: "point", point: "Q", missing: "y", intercept: "y" },
          ],
        },
        {
          id: "geo-line-axis-1-ex-a004",
          n: 4,
          showSegments: false,
          showAxisGuides: false,
          parts: [
            {
              label: "א",
              text: "מצאו את נקודות החיתוך עם הצירים של הישר y = 3x − 12 (ראו שרטוט).",
              line: { m: 3, b: -12 },
              points: [
                { label: "A", x: 0, y: -12, hideY: true },
                { label: "B", x: 4, y: 0, hideX: true },
              ],
              taskIds: ["A", "B"],
            },
            {
              label: "ב",
              text: "מצאו את נקודות החיתוך עם הצירים של הישר x + y = −5 (ראו שרטוט).",
              line: { eqText: "x + y = −5", implicit: { ax: 1, ay: 1, c: -5 } },
              points: [
                { label: "P", x: -5, y: 0, hideX: true },
                { label: "Q", x: 0, y: -5, hideY: true },
              ],
              taskIds: ["P", "Q"],
            },
            {
              label: "ג",
              text: "מצאו את נקודות החיתוך עם הצירים של הישר x = 4 (ראו שרטוט).",
              line: { vertical: 4, eqText: "x = 4" },
              points: [{ label: "R", x: 4, y: 0, hideX: true }],
              taskIds: ["R", "noY"],
            },
            {
              label: "ד",
              text: "מצאו את נקודות החיתוך עם הצירים של הישר y = −2 (ראו שרטוט).",
              line: { m: 0, b: -2, eqText: "y = −2" },
              points: [{ label: "S", x: 0, y: -2, hideY: true }],
              taskIds: ["S", "noX"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y" },
            { id: "B", label: "B", kind: "point", point: "B", missing: "x", intercept: "x" },
            { id: "P", label: "P", kind: "point", point: "P", missing: "x", intercept: "x" },
            { id: "Q", label: "Q", kind: "point", point: "Q", missing: "y", intercept: "y" },
            { id: "R", label: "R", kind: "point", point: "R", missing: "x", intercept: "x" },
            {
              id: "noY",
              label: "ציר y",
              kind: "noIntercept",
              axis: "y",
              reason: "הישר x = 4 מקביל לציר y — אין חיתוך עם ציר y.",
            },
            { id: "S", label: "S", kind: "point", point: "S", missing: "y", intercept: "y" },
            {
              id: "noX",
              label: "ציר x",
              kind: "noIntercept",
              axis: "x",
              reason: "הישר y = −2 מקביל לציר x — אין חיתוך עם ציר x.",
            },
          ],
        },
      ],
    }
  ]);
})(window);
