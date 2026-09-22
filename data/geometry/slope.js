(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
{
      id: "geo-slope-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "מציאת שיפוע",
      instruction:
        "שיפוע הישר דרך שתי נקודות: m = (y₂ − y₁)/(x₂ − x₁). אפשר לבחור איזו נקודה היא 1 ואיזו 2 — אותו סדר במונה ובמכנה. אפשר לדלג ישר ל־m. בתרגילים עם משוואה: אחרי ה־m רשמו את משוואת הישר (הצבה ב־y − y₁ = m(x − x₁) או ב־y = mx + b).",
      exercises: [
        {
          id: "geo-slope-1-ex-a001",
          n: 1,
          line: { m: 2, b: 2 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 3, y: 8 },
            { label: "B", x: 1, y: 4 },
          ],
          parts: [
            {
              label: "א",
              text: "בציור מתואר ישר העובר דרך הנקודות A(3;8) ו־B(1;4). מצאו את שיפועו של הישר.",
              taskIds: ["m"],
            },
          ],
          tasks: [{ id: "m", label: "m", kind: "slope", from: "A", to: "B" }],
        },
        {
          id: "geo-slope-1-ex-a002",
          n: 2,
          line: { m: 1, b: 4 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 6, y: 10 },
            { label: "B", x: 3, y: 7 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את שיפוע הישר העובר דרך הנקודות (6;10) ו־(3;7).",
              taskIds: ["m"],
            },
          ],
          tasks: [{ id: "m", label: "m", kind: "slope", from: "A", to: "B" }],
        },
        {
          id: "geo-slope-1-ex-a003",
          n: 3,
          line: { m: -1 / 3, b: -2 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: -6, y: 0 },
            { label: "B", x: 0, y: -2 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את שיפוע הישר העובר דרך הנקודות (−6;0) ו־(0;−2).",
              taskIds: ["m"],
            },
          ],
          tasks: [{ id: "m", label: "m", kind: "slope", from: "A", to: "B" }],
        },
        {
          id: "geo-slope-1-ex-a004",
          n: 4,
          line: { m: 2, b: 2 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: -5, y: -8 },
            { label: "B", x: -3, y: -4 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את שיפוע הישר העובר דרך הנקודות (−5;−8) ו־(−3;−4).",
              taskIds: ["m"],
            },
          ],
          tasks: [{ id: "m", label: "m", kind: "slope", from: "A", to: "B" }],
        },
        {
          id: "geo-slope-1-ex-a005",
          n: 5,
          line: { m: -12, b: 31.5 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 3, y: -4.5 },
            { label: "B", x: 2, y: 7.5 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את שיפוע הישר העובר דרך הנקודות (3;−4.5) ו־(2;7.5).",
              taskIds: ["m"],
            },
          ],
          tasks: [{ id: "m", label: "m", kind: "slope", from: "A", to: "B" }],
        },
        {
          id: "geo-slope-1-ex-a006",
          n: 6,
          line: { m: 21 / 4, b: -11 / 4 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 1, y: 5 / 2 },
            { label: "B", x: 1 / 3, y: -1 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את שיפוע הישר העובר דרך הנקודות (1;2½) ו־(⅓;−1).",
              taskIds: ["m"],
            },
          ],
          tasks: [{ id: "m", label: "m", kind: "slope", from: "A", to: "B" }],
        },
        {
          id: "geo-slope-1-ex-a007",
          n: 7,
          line: { m: 0, b: 2 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 3, y: 2 },
            { label: "B", x: 5, y: 2 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את שיפוע הישר העובר דרך הנקודות (3;2) ו־(5;2).",
              taskIds: ["m"],
            },
          ],
          tasks: [{ id: "m", label: "m", kind: "slope", from: "A", to: "B" }],
        },
        {
          id: "geo-slope-1-ex-a008",
          n: 8,
          line: { m: 1, b: 4 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 3, y: 7 },
            { label: "B", x: 8, y: 12 },
          ],
          parts: [
            {
              text: "מצאו את משוואת הישר העובר דרך הנקודות (3;7) ו־(8;12).",
              taskIds: ["m", "eq"],
            },
          ],
          tasks: [
            { id: "m", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eq", kind: "lineEq", point: "A", label: "ישר" },
          ],
        },
        {
          id: "geo-slope-1-ex-a009",
          n: 9,
          line: { m: -1, b: 13 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 3, y: 10 },
            { label: "B", x: 6, y: 7 },
          ],
          parts: [
            {
              text: "מצאו את משוואת הישר העובר דרך הנקודות (3;10) ו־(6;7).",
              taskIds: ["m", "eq"],
            },
          ],
          tasks: [
            { id: "m", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eq", kind: "lineEq", point: "A", label: "ישר" },
          ],
        },
        {
          id: "geo-slope-1-ex-a010",
          n: 10,
          line: { m: 2, b: 0 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: -2, y: -4 },
            { label: "B", x: 5, y: 10 },
          ],
          parts: [
            {
              text: "מצאו את משוואת הישר העובר דרך הנקודות (−2;−4) ו־(5;10).",
              taskIds: ["m", "eq"],
            },
          ],
          tasks: [
            { id: "m", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eq", kind: "lineEq", point: "A", label: "ישר" },
          ],
        },
        {
          id: "geo-slope-1-ex-a011",
          n: 11,
          line: { m: 3, b: 8 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: -3, y: -1 },
            { label: "B", x: -5, y: -7 },
          ],
          parts: [
            {
              text: "מצאו את משוואת הישר העובר דרך הנקודות (−3;−1) ו־(−5;−7).",
              taskIds: ["m", "eq"],
            },
          ],
          tasks: [
            { id: "m", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eq", kind: "lineEq", point: "A", label: "ישר" },
          ],
        },
        {
          id: "geo-slope-1-ex-a012",
          n: 12,
          line: { mn: 1, md: 2, b: 2 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 6, y: 5 },
            { label: "B", x: 2, y: 3 },
          ],
          parts: [
            {
              text: "מצאו את משוואת הישר העובר דרך הנקודות (6;5) ו־(2;3).",
              taskIds: ["m", "eq"],
            },
          ],
          tasks: [
            { id: "m", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eq", kind: "lineEq", point: "A", label: "ישר" },
          ],
        },
        {
          id: "geo-slope-1-ex-a013",
          n: 13,
          line: { mn: -3, md: 4, b: 8 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 4, y: 5 },
            { label: "B", x: 8, y: 2 },
          ],
          parts: [
            {
              text: "מצאו את משוואת הישר העובר דרך הנקודות (4;5) ו־(8;2).",
              taskIds: ["m", "eq"],
            },
          ],
          tasks: [
            { id: "m", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eq", kind: "lineEq", point: "A", label: "ישר" },
          ],
        },
        {
          id: "geo-slope-1-ex-a014",
          n: 14,
          line: { mn: 4, md: 3, b: 11 / 3 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 4, y: 9 },
            { label: "B", x: 1, y: 5 },
          ],
          parts: [
            {
              text: "מצאו את משוואת הישר העובר דרך הנקודות (4;9) ו־(1;5).",
              taskIds: ["m", "eq"],
            },
          ],
          tasks: [
            { id: "m", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eq", kind: "lineEq", point: "A", label: "ישר" },
          ],
        },
        {
          id: "geo-slope-1-ex-a015",
          n: 15,
          line: { mn: -5, md: 2, b: 3 / 2 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: -2, y: 13 / 2 },
            { label: "B", x: 3, y: -6 },
          ],
          parts: [
            {
              text: "מצאו את משוואת הישר העובר דרך הנקודות (−2;6½) ו־(3;−6).",
              taskIds: ["m", "eq"],
            },
          ],
          tasks: [
            { id: "m", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eq", kind: "lineEq", point: "A", label: "ישר" },
          ],
        },
        {
          id: "geo-slope-1-ex-a016",
          n: 16,
          line: { m: 0, b: 6 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 5, y: 6 },
            { label: "B", x: -3, y: 6 },
          ],
          parts: [
            {
              text: "מצאו את משוואת הישר העובר דרך הנקודות (5;6) ו־(−3;6).",
              taskIds: ["m", "eq"],
            },
          ],
          tasks: [
            { id: "m", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eq", kind: "lineEq", point: "A", label: "ישר" },
          ],
        },
        {
          id: "geo-slope-1-ex-a017",
          n: 17,
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "AB", label: "AB", line: { m: -1, b: 3, hideEq: true } },
            { key: "AC", label: "AC", line: { m: 3, b: 7, hideEq: true } },
          ],
          points: [
            { label: "A", x: -1, y: 4 },
            { label: "B", x: 2, y: 1 },
            { label: "C", x: -3, y: -2 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "A", to: "C" },
            { from: "B", to: "C" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          parts: [
            {
              label: "א",
              text: "הקודקודים של משולש ABC הם A(−1;4), B(2;1) ו־C(−3;−2). מצאו את משוואת הישר שעליו מונחת הצלע AB.",
              taskIds: ["mAB", "eqAB"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הצלע AC.",
              taskIds: ["mAC", "eqAC"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eqAB", kind: "lineEq", point: "A", x: -1, y: 4, m: -1, label: "AB" },
            { id: "mAC", label: "m", kind: "slope", from: "A", to: "C" },
            { id: "eqAC", kind: "lineEq", point: "A", x: -1, y: 4, m: 3, label: "AC" },
          ],
        },
        {
          id: "geo-slope-1-ex-a018",
          n: 18,
          line: { m: -3, b: 18 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 1, y: 15 },
            { label: "B", x: 4, y: 6 },
            { label: "P", x: 0, y: 18, hideY: true },
            { label: "Q", x: 6, y: 0, hideX: true },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את משוואת הישר העובר דרך הנקודות (1;15) ו־(4;6).",
              taskIds: ["m", "eq"],
            },
            {
              label: "ב",
              text: "מצאו את נקודות החיתוך של הישר שמצאתם בסעיף א עם הצירים.",
              taskIds: ["P", "Q"],
            },
          ],
          tasks: [
            { id: "m", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eq", kind: "lineEq", point: "A", label: "ישר" },
            { id: "P", label: "P", kind: "point", point: "P", missing: "y", intercept: "y" },
            { id: "Q", label: "Q", kind: "point", point: "Q", missing: "x", intercept: "x" },
          ],
        },
        {
          id: "geo-slope-1-ex-a019",
          n: 19,
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "AB", label: "AB", line: { m: -3, b: 15, hideEq: true } },
            { key: "CD", label: "CD", line: { mn: -1, md: 3, b: 13 / 3, hideEq: true } },
          ],
          points: [
            { label: "A", x: 2, y: 9 },
            { label: "B", x: 6, y: -3 },
            { label: "C", x: 7, y: 2 },
            { label: "D", x: -2, y: 5 },
            { label: "E", x: 4, y: 3, hideX: true, hideY: true },
          ],
          parts: [
            {
              label: "א",
              text: "בציור נתונות הנקודות A(2;9), B(6;−3), C(7;2) ו־D(−2;5). מצאו את משוואות הישרים AB ו־CD.",
              taskIds: ["mAB", "eqAB", "mCD", "eqCD"],
            },
            {
              label: "ב",
              text: "מצאו את נקודת המפגש בין הישרים AB ו־CD (הנקודה E שבציור).",
              taskIds: ["E"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eqAB", kind: "lineEq", point: "A", x: 2, y: 9, m: -3, label: "AB" },
            { id: "mCD", label: "m", kind: "slope", from: "C", to: "D" },
            { id: "eqCD", kind: "lineEq", point: "C", x: 7, y: 2, mn: -1, md: 3, label: "CD" },
            { id: "E", kind: "lineIntersect", point: "E", label: "E" },
          ],
        },
        {
          id: "geo-slope-1-ex-a020",
          n: 20,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", label: "", line: { m: 2, b: 4, eqText: "y = 2x + 4" } },
            { key: "L2", label: "", line: { m: 3, b: -6, eqText: "y = 3x − 6" } },
          ],
          points: [
            { label: "A", x: 0, y: 4, hideY: true },
            { label: "B", x: -2, y: 0, hideX: true },
            { label: "C", x: 0, y: -6, hideY: true },
            { label: "D", x: 2, y: 0, hideX: true },
          ],
          parts: [
            {
              label: "א",
              text: "בציור מתוארים הישרים y = 2x + 4 ו־y = 3x − 6. הנקודות A ו־C נמצאות על ציר y, והנקודות B ו־D נמצאות על ציר x. מצאו את שיעורי הנקודות A, B, C ו־D.",
              taskIds: ["A", "B", "C", "D"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר BC.",
              taskIds: ["mBC", "eqBC"],
            },
            {
              label: "ג",
              text: "מצאו את משוואת הישר AD.",
              taskIds: ["mAD", "eqAD"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y", line: { m: 2, b: 4 } },
            { id: "B", label: "B", kind: "point", point: "B", missing: "x", intercept: "x", line: { m: 2, b: 4 } },
            { id: "C", label: "C", kind: "point", point: "C", missing: "y", intercept: "y", line: { m: 3, b: -6 } },
            { id: "D", label: "D", kind: "point", point: "D", missing: "x", intercept: "x", line: { m: 3, b: -6 } },
            { id: "mBC", label: "m", kind: "slope", from: "B", to: "C" },
            { id: "eqBC", kind: "lineEq", point: "C", x: 0, y: -6, m: -3, label: "BC" },
            { id: "mAD", label: "m", kind: "slope", from: "A", to: "D" },
            { id: "eqAD", kind: "lineEq", point: "A", x: 0, y: 4, m: -2, label: "AD" },
          ],
        },
        {
          id: "geo-slope-1-ex-a021",
          n: 21,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          lines: [
            { key: "I", label: "I", line: { m: 1, b: 2 } },
            { key: "II", label: "II", line: { m: -1, b: 2 } },
            { key: "III", label: "III", line: { m: -1, b: -2 } },
          ],
          points: [
            { label: "A", x: 0, y: 2, hideY: true },
            { label: "B", x: 2, y: 0, hideX: true },
            { label: "C", x: 0, y: -2, hideY: true },
            { label: "D", x: -2, y: 0, hideX: true },
          ],
          segments: [
            { from: "A", to: "O" },
            { from: "O", to: "B" },
            { from: "A", to: "B" },
          ],
          polygons: [{ verts: ["A", "O", "B"] }],
          rightAngles: [{ at: "O", from: "A", to: "B" }],
          parts: [
            {
              label: "א",
              text: "בציור שלושה ישרים. נתונות המשוואות:\n(1) y = −x + 2\n(2) y = x + 2\n(3) y = −x − 2\nשייכו כל משוואה לישר I, II או III ונמקו.",
              taskIds: ["eq1", "eq2", "eq3"],
            },
            {
              label: "ב",
              text: "מצאו את שיעורי הנקודות A, B, C ו־D המסומנות בציור.",
              taskIds: ["A", "B", "C", "D"],
            },
            {
              label: "ג",
              text: "מצאו את משוואת הישר BC.",
              taskIds: ["mBC", "eqBC"],
            },
            {
              label: "ד",
              text: "חשבו את שטח המשולש AOB (O היא ראשית הצירים).",
              taskIds: ["OA", "OB", "SAOB"],
            },
          ],
          tasks: [
            { id: "eq1", kind: "lineMatch", eqNum: 1, eqText: "y = −x + 2", answerKey: "II" },
            { id: "eq2", kind: "lineMatch", eqNum: 2, eqText: "y = x + 2", answerKey: "I" },
            { id: "eq3", kind: "lineMatch", eqNum: 3, eqText: "y = −x − 2", answerKey: "III" },
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y", line: { m: 1, b: 2 } },
            { id: "B", label: "B", kind: "point", point: "B", missing: "x", intercept: "x", line: { m: -1, b: 2 } },
            { id: "C", label: "C", kind: "point", point: "C", missing: "y", intercept: "y", line: { m: -1, b: -2 } },
            { id: "D", label: "D", kind: "point", point: "D", missing: "x", intercept: "x", line: { m: 1, b: 2 } },
            { id: "mBC", label: "m", kind: "slope", from: "B", to: "C" },
            { id: "eqBC", kind: "lineEq", point: "C", x: 0, y: -2, m: 1, label: "BC" },
            { id: "OA", label: "AO", kind: "origin", point: "A", optional: true },
            { id: "OB", label: "BO", kind: "origin", point: "B", optional: true },
            {
              id: "SAOB",
              label: "S△AOB",
              kind: "area",
              verts: ["A", "O", "B"],
              legs: [
                ["A", "O"],
                ["B", "O"],
              ],
            },
          ],
        },
        {
          id: "geo-slope-1-ex-a022",
          n: 22,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", label: "", line: { m: 5, b: 12, eqText: "y = 5x + 12" } },
            { key: "L2", label: "", line: { m: -2, b: 8, eqText: "y = −2x + 8" } },
          ],
          points: [
            { label: "A", x: 0, y: 12, hideY: true },
            { label: "B", x: 4, y: 0, hideX: true },
          ],
          parts: [
            {
              text: "הישר y = 5x + 12 חותך את ציר y בנקודה A. הישר y = −2x + 8 חותך את ציר x בנקודה B. מצאו את משוואת הישר AB.",
              taskIds: ["A", "B", "mAB", "eqAB"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y", line: { m: 5, b: 12 } },
            { id: "B", label: "B", kind: "point", point: "B", missing: "x", intercept: "x", line: { m: -2, b: 8 } },
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eqAB", kind: "lineEq", point: "A", x: 0, y: 12, m: -3, label: "AB" },
          ],
        },
        {
          id: "geo-slope-1-ex-a023",
          n: 23,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", label: "", line: { m: 3, b: -1, eqText: "y = 3x − 1" } },
            { key: "L2", label: "", line: { m: 2, b: -2, eqText: "y = 2x − 2" } },
          ],
          points: [{ label: "M", x: -1, y: -4, hideX: true, hideY: true }],
          parts: [
            {
              label: "א",
              text: "הישרים y = 3x − 1 ו־y = 2x − 2 נחתכים בנקודה M. מצאו את שיעורי הנקודה M.",
              taskIds: ["M"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר העובר דרך ראשית הצירים ודרך הנקודה M.",
              taskIds: ["mOM", "eqOM"],
            },
          ],
          tasks: [
            { id: "M", kind: "lineIntersect", point: "M", label: "M" },
            { id: "mOM", label: "m", kind: "slope", from: "O", to: "M" },
            { id: "eqOM", kind: "lineEq", point: "O", x: 0, y: 0, m: 4, label: "OM" },
          ],
        },
      ],
    }
  ]);
})(window);
