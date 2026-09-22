(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
{
      id: "geo-midpoint-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "אמצע קטע",
      instruction:
        "אמצע קטע: x = (x₁ + x₂)/2 ו־y = (y₁ + y₂)/2. הציבו, חברו את איברי המונה, ואז חלקו. אפשר לדלג למונה או ישר לנקודה.",
      exercises: [
        {
          id: "geo-midpoint-1-ex-a001",
          n: 1,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 2, y: 7 },
            { label: "B", x: 6, y: 3 },
            { label: "M", x: 4, y: 5, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "קצות הקטע AB הם בנקודות A(2;7) ו־B(6;3). נקודה M היא אמצע הקטע AB. מצאו את שיעורי הנקודה M.",
              taskIds: ["M"],
            },
          ],
          tasks: [{ id: "M", kind: "midpoint", point: "M", from: "A", to: "B" }],
        },
        {
          id: "geo-midpoint-1-ex-a002",
          n: 2,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 5, y: 4 },
            { label: "B", x: 11, y: 14 },
            { label: "M", x: 8, y: 9, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "מצאו את אמצע הקטע שקצותיו (5;4) ו־(11;14).",
              taskIds: ["M"],
            },
          ],
          tasks: [{ id: "M", kind: "midpoint", point: "M", from: "A", to: "B" }],
        },
        {
          id: "geo-midpoint-1-ex-a003",
          n: 3,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: -4, y: 7 },
            { label: "B", x: 6, y: 1 },
            { label: "M", x: 1, y: 4, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "מצאו את אמצע הקטע שקצותיו (−4;7) ו־(6;1).",
              taskIds: ["M"],
            },
          ],
          tasks: [{ id: "M", kind: "midpoint", point: "M", from: "A", to: "B" }],
        },
        {
          id: "geo-midpoint-1-ex-a004",
          n: 4,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 1, y: -6 },
            { label: "B", x: -5, y: 8 },
            { label: "M", x: -2, y: 1, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "מצאו את אמצע הקטע שקצותיו (1;−6) ו־(−5;8).",
              taskIds: ["M"],
            },
          ],
          tasks: [{ id: "M", kind: "midpoint", point: "M", from: "A", to: "B" }],
        },
        {
          id: "geo-midpoint-1-ex-a005",
          n: 5,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 8, y: 9 },
            { label: "B", x: 8, y: -3 },
            { label: "M", x: 8, y: 3, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "מצאו את אמצע הקטע שקצותיו (8;9) ו־(8;−3).",
              taskIds: ["M"],
            },
          ],
          tasks: [{ id: "M", kind: "midpoint", point: "M", from: "A", to: "B" }],
        },
        {
          id: "geo-midpoint-1-ex-a006",
          n: 6,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: -5, y: -4 },
            { label: "B", x: 6, y: -8 },
            { label: "M", x: 0.5, y: -6, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "מצאו את אמצע הקטע שקצותיו (−5;−4) ו־(6;−8).",
              taskIds: ["M"],
            },
          ],
          tasks: [{ id: "M", kind: "midpoint", point: "M", from: "A", to: "B" }],
        },
        {
          id: "geo-midpoint-1-ex-a007",
          n: 7,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 7, y: -6 },
            { label: "B", x: 14, y: -11 },
            { label: "M", x: 10.5, y: -8.5, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "מצאו את אמצע הקטע שקצותיו (7;−6) ו־(14;−11).",
              taskIds: ["M"],
            },
          ],
          tasks: [{ id: "M", kind: "midpoint", point: "M", from: "A", to: "B" }],
        },
        {
          id: "geo-midpoint-1-ex-a008",
          n: 8,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 1, y: 2 },
            { label: "M", x: 3, y: 4 },
            { label: "B", x: 5, y: 6, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "נתון הקטע AB. קצהו האחד של הקטע הוא בנקודה A(1;2) ונקודת האמצע שלו היא M(3;4). מצאו את שיעורי הנקודה B.",
              taskIds: ["B"],
            },
          ],
          tasks: [{ id: "B", kind: "midpoint", point: "B", from: "A", mid: "M" }],
        },
        {
          id: "geo-midpoint-1-ex-a009",
          n: 9,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 7, y: 4 },
            { label: "P", x: 5, y: 9 },
            { label: "B", x: 3, y: 14, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "נתון הקטע AB שבו נקודת הקצה האחד היא A(7;4). נקודת האמצע של הקטע היא P(5;9). מצאו את שיעורי נקודת הקצה B.",
              taskIds: ["B"],
            },
          ],
          tasks: [{ id: "B", kind: "midpoint", point: "B", from: "A", mid: "P" }],
        },
        {
          id: "geo-midpoint-1-ex-a010",
          n: 10,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 0, y: 3 },
            { label: "P", x: 5, y: 1 },
            { label: "B", x: 10, y: -1, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "נקודה P היא אמצע הקטע AB. נתונים A(0;3) ו־P(5;1). מצאו את שיעורי הנקודה B.",
              taskIds: ["B"],
            },
          ],
          tasks: [{ id: "B", kind: "midpoint", point: "B", from: "A", mid: "P" }],
        },
        {
          id: "geo-midpoint-1-ex-a011",
          n: 11,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: -3, y: 8 },
            { label: "P", x: 11, y: -6 },
            { label: "B", x: 25, y: -20, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "נקודה P היא אמצע הקטע AB. נתונים A(−3;8) ו־P(11;−6). מצאו את שיעורי הנקודה B.",
              taskIds: ["B"],
            },
          ],
          tasks: [{ id: "B", kind: "midpoint", point: "B", from: "A", mid: "P" }],
        },
        {
          id: "geo-midpoint-1-ex-a012",
          n: 12,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: -3, y: -7 },
            { label: "P", x: -5.5, y: 3.25 },
            { label: "B", x: -8, y: 13.5, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "נקודה P היא אמצע הקטע AB. נתונים A(−3;−7) ו־P(−5 1/2; 3 1/4). מצאו את שיעורי הנקודה B.",
              taskIds: ["B"],
            },
          ],
          tasks: [{ id: "B", kind: "midpoint", point: "B", from: "A", mid: "P" }],
        },
        {
          id: "geo-midpoint-1-ex-a013",
          n: 13,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          polygons: [{ verts: ["A", "B", "C"] }],
          points: [
            { label: "A", x: 2, y: 5 },
            { label: "B", x: -2, y: 0 },
            { label: "C", x: 4, y: 2 },
            { label: "D", x: 0, y: 2.5, hideX: true, hideY: true },
            { label: "E", x: 1, y: 1, hideX: true, hideY: true },
            { label: "F", x: 3, y: 3.5, hideX: true, hideY: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "A", to: "C" },
          ],
          parts: [
            {
              text: "קדקודיו של משולש ABC הם A(2;5), B(−2;0), C(4;2). מצאו את שיעורי נקודת האמצע של כל אחת מצלעות המשולש: D אמצע AB, E אמצע BC, F אמצע AC.",
              taskIds: ["D", "E", "F"],
            },
          ],
          tasks: [
            { id: "D", kind: "midpoint", point: "D", from: "A", to: "B" },
            { id: "E", kind: "midpoint", point: "E", from: "B", to: "C" },
            { id: "F", kind: "midpoint", point: "F", from: "A", to: "C" },
          ],
        },
        {
          id: "geo-midpoint-1-ex-a014",
          n: 14,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          polygons: [{ verts: ["A", "B", "C"] }],
          points: [
            { label: "A", x: 6, y: 4 },
            { label: "D", x: 3, y: 3 },
            { label: "C", x: 8, y: 3 },
            { label: "B", x: 0, y: 2, hideX: true, hideY: true },
            { label: "E", x: 4, y: 2.5, hideX: true, hideY: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "A", to: "C" },
          ],
          parts: [
            {
              text: "D(3;3) היא נקודת אמצע הצלע AB במשולש ABC. נתון A(6;4), C(8;3). מצאו את שיעורי הקדקוד B ואת נקודת האמצע של הצלע BC (נקודה E).",
              taskIds: ["B", "E"],
            },
          ],
          tasks: [
            { id: "B", kind: "midpoint", point: "B", from: "A", mid: "D" },
            { id: "E", kind: "midpoint", point: "E", from: "B", to: "C" },
          ],
        },
        {
          id: "geo-midpoint-1-ex-a015",
          n: 15,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          line: {
            m: 0.75,
            b: -3,
            eqText: "3x − 4y = 12",
            implicit: { ax: 3, ay: -4, c: 12 },
          },
          points: [
            { label: "A", x: 0, y: -3, hideY: true },
            { label: "B", x: 4, y: 0, hideX: true },
            { label: "M", x: 2, y: -1.5, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "הישר 3x − 4y = 12 חותך את ציר y בנקודה A ואת ציר x בנקודה B. מצאו את שיעורי נקודת האמצע של הקטע AB.",
              taskIds: ["A", "B", "M"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y" },
            { id: "B", label: "B", kind: "point", point: "B", missing: "x", intercept: "x" },
            { id: "M", kind: "midpoint", point: "M", from: "A", to: "B" },
          ],
        },
        {
          id: "geo-midpoint-1-ex-a016",
          n: 16,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 0, y: 10, hideX: true, hideY: true },
            { label: "C", x: 3, y: 5 },
            { label: "B", x: 6, y: 0, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "נקודה A נמצאת על ציר y. נקודה B נמצאת על ציר x. הנקודה C(3;5) נמצאת על הקטע AB. נתון AC = CB. מצאו את שיעורי הנקודות A ו־B.",
              taskIds: ["A", "B"],
            },
          ],
          tasks: [
            { id: "A", kind: "midpoint", point: "A", mid: "C", onAxis: "y", otherAxis: "x" },
            { id: "B", kind: "midpoint", point: "B", mid: "C", onAxis: "x", otherAxis: "y" },
          ],
        },
        {
          id: "geo-midpoint-1-ex-a017",
          n: 17,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          line: { m: -0.5, b: 0, mn: -1, md: 2 },
          points: [
            { label: "A", x: 1, y: 5 },
            { label: "B", x: 3, y: -7 },
            { label: "C", x: 2, y: -1, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "נתונות הנקודות A(1;5), B(3;−7). C היא נקודת אמצע הקטע AB. מצאו את משוואת הישר העובר דרך ראשית הצירים ודרך הנקודה C.",
              taskIds: ["C", "mOC", "eq"],
            },
          ],
          tasks: [
            { id: "C", kind: "midpoint", point: "C", from: "A", to: "B" },
            { id: "mOC", label: "m", kind: "slope", from: "O", to: "C" },
            { id: "eq", kind: "lineEq", point: "O", x: 0, y: 0, mn: -1, md: 2, label: "ישר" },
          ],
        },
        {
          id: "geo-midpoint-1-ex-a018",
          n: 18,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          lines: [
            {
              key: "L",
              label: "",
              line: {
                unsorted: true,
                eqText: "2x + y = 8",
                implicit: { ax: 2, ay: 1, c: 8 },
                m: -2,
                b: 8,
              },
            },
            { key: "AB", label: "AB", line: { m: 1, b: 5, hideEq: true } },
          ],
          points: [
            { label: "A", x: 3, y: 8 },
            { label: "B", x: -1, y: 4 },
            { label: "P", x: 1, y: 6, hideX: true, hideY: true },
            { label: "M", x: 1, y: 6, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              label: "א",
              text: "AB הוא קטע שקצותיו בנקודות A(3;8) ו־B(−1;4). נתון הישר 2x + y = 8. מצאו את נקודת החיתוך בין הישר הנתון לבין הקטע AB.",
              taskIds: ["mAB", "eqAB", "P"],
              stepByTask: false,
            },
            {
              label: "ב",
              text: "הוכיחו שהישר 2x + y = 8 חוצה את הקטע AB.",
              taskIds: ["M", "prove"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eqAB", kind: "lineEq", point: "A", x: 3, y: 8, m: 1, b: 5, label: "AB" },
            { id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "L" },
            { id: "M", kind: "midpoint", point: "M", from: "A", to: "B" },
            {
              id: "prove",
              kind: "yesNo",
              answer: true,
              proveBisect: true,
              question: "האם הישר חוצה את הקטע AB?",
            },
          ],
        },
        {
          id: "geo-midpoint-1-ex-a019",
          n: 19,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 2, y: 11, hideX: true, hideY: true },
            { label: "B", x: 4, y: 8 },
            { label: "C", x: 6, y: 5 },
            { label: "D", x: 8, y: 2, hideX: true, hideY: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "D" },
          ],
          parts: [
            {
              text: "בשרטוט שלפניכם, הנקודות B(4;8) ו־C(6;5) מחלקות את הקטע AD לשלושה חלקים שווים: AB = BC = CD. מצאו את שיעורי הנקודות A ו־D בקצות הקטע.",
              taskIds: ["A", "D"],
              stepByTask: false,
            },
          ],
          tasks: [
            { id: "A", kind: "midpoint", point: "A", from: "C", mid: "B" },
            { id: "D", kind: "midpoint", point: "D", from: "B", mid: "C" },
          ],
        },
        {
          id: "geo-midpoint-1-ex-a020",
          n: 20,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          lines: [
            { key: "CE", label: "", line: { mn: 3, md: 2, b: 1, eqText: "y = (3/2)x + 1" } },
            { key: "AE", label: "", line: { vertical: 4, hideEq: true } },
          ],
          points: [
            { label: "A", x: 4, y: -1 },
            { label: "E", x: 4, y: 7, hideX: true, hideY: true },
            { label: "C", x: 0, y: 1 },
            { label: "M", x: 4, y: 3, hideX: true, hideY: true },
            { label: "H", x: 4, y: 1, hideX: true, hideY: true, drawOnly: true },
          ],
          segments: [
            { from: "A", to: "E" },
            { from: "C", to: "E" },
            { from: "C", to: "M", dashed: true },
          ],
          polygons: [{ verts: ["C", "M", "E"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו קודקוד C, וגררו את רגל הגובה אל AE.",
            triangle: ["C", "M", "E"],
            heights: [{ id: "hCME", from: "C", base: ["M", "E"], footLabel: "H", recommended: true }],
          },
          parts: [
            {
              label: "א",
              text: "הישר AE מקביל לציר y. נתון: A(4;−1). הישר y = (3/2)x + 1 עובר דרך הנקודה E וחותך את ציר y בנקודה C. M היא אמצע הקטע AE. מצאו את שיעורי הנקודה E.",
              taskIds: ["E", "M"],
              stepByTask: false,
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש CME.",
              taskIds: ["M", "ME", "CH", "SCME"],
            },
          ],
          tasks: [
            {
              id: "E",
              label: "E",
              kind: "point",
              point: "E",
              missing: "both",
              twinX: "A",
              lineKey: "CE",
              answerX: 4,
              answerY: 7,
            },
            { id: "M", kind: "midpoint", point: "M", from: "A", to: "E" },
            { id: "ME", kind: "segment", from: "M", to: "E", optional: true },
            { id: "CH", kind: "segment", from: "C", to: "H", optional: true, drawHeight: true },
            {
              id: "SCME",
              label: "S△CME",
              kind: "area",
              verts: ["C", "M", "E"],
              legs: [
                ["M", "E"],
                ["C", "H"],
              ],
            },
          ],
        },
        {
          id: "geo-midpoint-1-ex-a021",
          n: 21,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          lines: [
            { key: "vert", label: "", line: { vertical: 9, eqText: "x = 9" } },
            { key: "diag", label: "", line: { m: 1, b: 0, eqText: "y = x" } },
          ],
          points: [
            { label: "A", x: 5, y: 5, hideX: true, hideY: true },
            { label: "B", x: 9, y: 3, hideX: true, hideY: true },
            { label: "C", x: 7, y: 4 },
          ],
          segments: [
            { from: "A", to: "C", dashed: true },
            { from: "C", to: "B", dashed: true },
          ],
          parts: [
            {
              label: "א",
              text: "בשרטוט מתוארים הישרים x = 9 ו־y = x. דרך הנקודה C(7;4) עובר קטע AB כך שהוא חותך את הישרים בנקודות B ו־A בהתאמה, ונקודה C היא אמצע הקטע AB. מצאו את שיעור ה-x של הנקודה A.",
              taskIds: ["A", "B"],
              stepByTask: false,
              untilCoord: { id: "A", axis: "x" },
            },
            {
              label: "ב",
              text: "מצאו את שיעורי הנקודות A ו־B.",
              taskIds: ["A", "B"],
              stepByTask: false,
            },
          ],
          tasks: [
            { id: "A", kind: "midpoint", point: "A", from: "B", mid: "C", onLine: { m: 1, b: 0 } },
            { id: "B", kind: "midpoint", point: "B", from: "A", mid: "C", onLine: { vertical: 9 } },
          ],
        },
      ],
    }
  ]);
})(window);
