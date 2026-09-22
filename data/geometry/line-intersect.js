(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
{
      id: "geo-line-intersect-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "חיתוך בין ישרים",
      instruction:
        "כדי למצוא את נקודת החיתוך: השוו בין המשוואות (הביטויים של y), פתרו עבור x, הציבו באחת המשוואות ומצאו את y, ורשמו את הנקודה. אם משוואה לא מסודרת — קודם סדרו לצורה y = mx + b.",
      exercises: [
        {
          id: "geo-line-intersect-1-ex-a001",
          n: 1,
          lines: [
            { key: "A", label: "AB", line: { m: 1, b: 2, eqText: "y = x + 2" } },
            { key: "B", label: "CD", line: { m: -1, b: 6, eqText: "y = −x + 6" } },
          ],
          showSegments: false,
          showAxisGuides: false,
          points: [{ label: "P", x: 2, y: 4, hideX: true, hideY: true }],
          parts: [
            {
              label: "",
              text: "משוואת הישר AB היא y = x + 2.\nמשוואת הישר CD היא y = −x + 6.\nהנקודה P היא נקודת החיתוך בין שני הישרים. מצאו את קואורדינטות נקודה P.",
              taskIds: ["P"],
            },
          ],
          tasks: [{ id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" }],
        },
        {
          id: "geo-line-intersect-1-ex-a002",
          n: 2,
          lines: [
            { key: "A", label: "AD", line: { m: -2, b: 14, eqText: "y = 14 − 2x" } },
            { key: "B", label: "BC", line: { m: -1, b: 4, eqText: "y = 4 − x" } },
          ],
          showSegments: false,
          showAxisGuides: false,
          points: [{ label: "P", x: 10, y: -6, hideX: true, hideY: true }],
          parts: [
            {
              label: "",
              text: "הישר AD הוא גרף הפונקציה y = 14 − 2x.\nהישר BC הוא גרף הפונקציה y = 4 − x.\nהנקודה P היא נקודת החיתוך בין שני הישרים. מצאו את שיעורי הנקודה P.",
              taskIds: ["P"],
            },
          ],
          tasks: [{ id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" }],
        },
        {
          id: "geo-line-intersect-1-ex-a003",
          n: 3,
          lines: [
            {
              key: "A",
              label: "AD",
              line: {
                unsorted: true,
                eqText: "y + 4x = −16",
                implicit: { ax: 4, ay: 1, c: -16 },
              },
            },
            {
              key: "B",
              label: "BC",
              line: {
                unsorted: true,
                eqText: "y − x = −6",
                implicit: { ax: -1, ay: 1, c: -6 },
              },
            },
          ],
          showSegments: false,
          showAxisGuides: false,
          points: [{ label: "P", x: -2, y: -8, hideX: true, hideY: true }],
          parts: [
            {
              label: "",
              text: "הישר AD הוא גרף הפונקציה y + 4x = −16.\nהישר BC הוא גרף הפונקציה y − x = −6.\nמצאו את שיעורי נקודת החיתוך של שני הישרים (הנקודה P שבציור).",
              taskIds: ["P"],
            },
          ],
          tasks: [{ id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" }],
        },
        {
          id: "geo-line-intersect-1-ex-a004",
          n: 4,
          lines: [
            { key: "A", label: "ℓ₁", line: { m: 3, b: 0, eqText: "y = 3x" } },
            { key: "B", label: "ℓ₂", line: { m: -1, b: 4, eqText: "y = −x + 4" } },
          ],
          showSegments: false,
          showAxisGuides: false,
          points: [{ label: "P", x: 1, y: 3, hideX: true, hideY: true }],
          parts: [
            {
              label: "א",
              text: "נתונים שני ישרים:\ny = 3x\ny = −x + 4\nמצאו את שיעורי נקודת החיתוך ביניהם (הנקודה P בציור).",
              taskIds: ["P"],
            },
          ],
          tasks: [{ id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" }],
        },
        {
          id: "geo-line-intersect-1-ex-a005",
          n: 5,
          lines: [
            { key: "A", label: "ℓ₁", line: { mn: 1, md: 2, b: 2, eqText: "y = (1/2)x + 2" } },
            { key: "B", label: "ℓ₂", line: { m: -1, b: 8, eqText: "y = −x + 8" } },
          ],
          showSegments: false,
          showAxisGuides: false,
          points: [{ label: "P", x: 4, y: 4, hideX: true, hideY: true }],
          parts: [
            {
              label: "ב",
              text: "נתונים שני ישרים:\ny = (1/2)x + 2\ny = −x + 8\nמצאו את שיעורי נקודת החיתוך ביניהם (הנקודה P בציור).",
              taskIds: ["P"],
            },
          ],
          tasks: [{ id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" }],
        },
        {
          id: "geo-line-intersect-1-ex-a006",
          n: 6,
          lines: [
            {
              key: "A",
              label: "ℓ₁",
              line: {
                unsorted: true,
                eqText: "2x + y = 8",
                implicit: { ax: 2, ay: 1, c: 8 },
              },
            },
            {
              key: "B",
              label: "ℓ₂",
              line: {
                unsorted: true,
                eqText: "x + 3y = 19",
                implicit: { ax: 1, ay: 3, c: 19 },
              },
            },
          ],
          showSegments: false,
          showAxisGuides: false,
          points: [{ label: "P", x: 1, y: 6, hideX: true, hideY: true }],
          parts: [
            {
              label: "ג",
              text: "נתונים שני ישרים:\n2x + y = 8\nx + 3y = 19\nקודם סדרו את שתי המשוואות לצורה y = mx + b, ואז מצאו את שיעורי נקודת החיתוך (הנקודה P בציור).",
              taskIds: ["P"],
            },
          ],
          tasks: [{ id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" }],
        },
        {
          id: "geo-line-intersect-1-ex-a007",
          n: 7,
          lines: [
            {
              key: "A",
              label: "ℓ₁",
              line: {
                unsorted: true,
                eqText: "3x + 4y = 45",
                implicit: { ax: 3, ay: 4, c: 45 },
              },
            },
            {
              key: "B",
              label: "ℓ₂",
              line: {
                unsorted: true,
                eqText: "3x − 2y = 9",
                implicit: { ax: 3, ay: -2, c: 9 },
              },
            },
          ],
          showSegments: false,
          showAxisGuides: false,
          points: [{ label: "P", x: 7, y: 6, hideX: true, hideY: true }],
          parts: [
            {
              label: "ד",
              text: "נתונים שני ישרים:\n3x + 4y = 45\n3x − 2y = 9\nקודם סדרו את שתי המשוואות לצורה y = mx + b, ואז מצאו את שיעורי נקודת החיתוך (הנקודה P בציור).",
              taskIds: ["P"],
            },
          ],
          tasks: [{ id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" }],
        },
        {
          id: "geo-line-intersect-1-ex-a008",
          n: 8,
          lines: [
            { key: "A", label: "AD", line: { m: -2, b: 22, eqText: "y = −2x + 22" } },
            { key: "B", label: "BC", line: { m: 1, b: 4, eqText: "y = x + 4" } },
          ],
          showSegments: false,
          showAxisGuides: false,
          segments: [
            { from: "A", to: "D" },
            { from: "B", to: "C" },
            { from: "P", to: "C" },
            { from: "P", to: "D" },
          ],
          polygons: [{ verts: ["P", "C", "D"] }],
          points: [
            { label: "A", x: 0, y: 22, hideY: true },
            { label: "B", x: 0, y: 4, hideY: true },
            { label: "C", x: -4, y: 0, hideX: true },
            { label: "D", x: 11, y: 0, hideX: true },
            { label: "P", x: 6, y: 10, hideX: true, hideY: true },
            { label: "H", x: 6, y: 0, drawOnly: true },
          ],
          parts: [
            {
              label: "א",
              text: "הישרים AD ו-BC הם גרפים של:\nAD: y = −2x + 22\nBC: y = x + 4\nמצאו את שיעורי הנקודות A, B, C, D ו-P (ראו ציור).",
              taskIds: ["A", "B", "C", "D", "P"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש PCD. מומלץ: אורך CD וגובה מ-P לבסיס CD.",
              taskIds: ["CD", "SPCD"],
            },
          ],
          tasks: [
            { id: "A", kind: "point", point: "A", missing: "y", intercept: "y", lineKey: "A" },
            { id: "B", kind: "point", point: "B", missing: "y", intercept: "y", lineKey: "B" },
            { id: "C", kind: "point", point: "C", missing: "x", intercept: "x", lineKey: "B" },
            { id: "D", kind: "point", point: "D", missing: "x", intercept: "x", lineKey: "A" },
            { id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" },
            { id: "CD", kind: "segment", from: "C", to: "D", optional: true },
            {
              id: "SPCD",
              label: "S△PCD",
              kind: "area",
              verts: ["P", "C", "D"],
              legs: [
                ["C", "D"],
                ["P", "H"],
              ],
            },
          ],
        },
        {
          id: "geo-line-intersect-1-ex-a009",
          n: 9,
          lines: [
            {
              key: "A",
              label: "AB",
              line: {
                unsorted: true,
                eqText: "x + 2y = 10",
                implicit: { ax: 1, ay: 2, c: 10 },
              },
            },
            {
              key: "B",
              label: "CD",
              line: {
                unsorted: true,
                eqText: "2x − 3y = 6",
                implicit: { ax: 2, ay: -3, c: 6 },
              },
            },
          ],
          showSegments: false,
          showAxisGuides: false,
          segments: [
            { from: "A", to: "B" },
            { from: "C", to: "D" },
            { from: "P", to: "B" },
            { from: "P", to: "D" },
            { from: "P", to: "A" },
            { from: "P", to: "C" },
          ],
          polygons: [{ verts: ["P", "B", "D"] }, { verts: ["A", "P", "C"] }],
          points: [
            { label: "A", x: 0, y: 5, hideY: true },
            { label: "B", x: 10, y: 0, hideX: true },
            { label: "C", x: 0, y: -2, hideY: true },
            { label: "D", x: 3, y: 0, hideX: true },
            { label: "P", x: 6, y: 2, hideX: true, hideY: true },
            { label: "H", x: 6, y: 0, drawOnly: true },
            { label: "G", x: 0, y: 2, drawOnly: true },
          ],
          parts: [
            {
              label: "א",
              text: "נתונים שני ישרים:\nAB: x + 2y = 10\nCD: 2x − 3y = 6\nמצאו את שיעורי הנקודות A, B, C, D ו-P. לפני חיתוך — סדרו את שתי המשוואות לצורה y = mx + b.",
              taskIds: ["A", "B", "C", "D", "P"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש PBD.",
              taskIds: ["BD", "SPBD"],
            },
            {
              label: "ג",
              text: "חשבו את שטח המשולש APC.",
              taskIds: ["AC", "SAPC"],
            },
          ],
          tasks: [
            { id: "A", kind: "point", point: "A", missing: "y", intercept: "y", lineKey: "A" },
            { id: "B", kind: "point", point: "B", missing: "x", intercept: "x", lineKey: "A" },
            { id: "C", kind: "point", point: "C", missing: "y", intercept: "y", lineKey: "B" },
            { id: "D", kind: "point", point: "D", missing: "x", intercept: "x", lineKey: "B" },
            { id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" },
            { id: "BD", kind: "segment", from: "B", to: "D", optional: true },
            {
              id: "SPBD",
              label: "S△PBD",
              kind: "area",
              verts: ["P", "B", "D"],
              legs: [
                ["B", "D"],
                ["P", "H"],
              ],
            },
            { id: "AC", kind: "segment", from: "A", to: "C", optional: true },
            {
              id: "SAPC",
              label: "S△APC",
              kind: "area",
              verts: ["A", "P", "C"],
              legs: [
                ["A", "C"],
                ["P", "G"],
              ],
            },
          ],
        },
      ],
    }
  ]);
})(window);
