(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
{
      id: "geo-parallel-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "ישרים מקבילים",
      instruction:
        "ישרים מקבילים: שיפועים שווים. אם המשוואה לא ב־y = mx + b — סדרו קודם (אפשר גם לרשום ישר את השיפוע). אחר כך ענו כן או לא. דרך נקודה: אותו שיפוע, ואז משוואת הישר; אפשר לדלג ישר למשוואה.",
      exercises: [
        {
          id: "geo-parallel-1-ex-a001",
          n: 1,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: 3, b: 4, eqText: "y = 3x + 4" } },
            { key: "L2", line: { m: 3, b: -5, eqText: "y = 3x − 5" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים y = 3x + 4 ו־y = 3x − 5 מקבילים זה לזה.",
              taskIds: ["par"],
            },
          ],
          tasks: [
            {
              id: "par",
              kind: "parallel",
              answer: true,
              reason: "שיפועים שווים (שניהם 3) — הישרים מקבילים.",
            },
          ],
        },
        {
          id: "geo-parallel-1-ex-a002",
          n: 2,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: 1, b: -5, eqText: "y = x − 5" } },
            { key: "L2", line: { m: -1, b: -5, eqText: "y = −x − 5" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים y = x − 5 ו־y = −x − 5 מקבילים זה לזה.",
              taskIds: ["par"],
            },
          ],
          tasks: [
            {
              id: "par",
              kind: "parallel",
              answer: false,
              reason: "שיפועים שונים (1 ו־−1) — הישרים לא מקבילים.",
            },
          ],
        },
        {
          id: "geo-parallel-1-ex-a003",
          n: 3,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: -1.5, mn: -3, md: 2, b: 5, eqText: "y = −1.5x + 5" } },
            { key: "L2", line: { m: -1.5, mn: -3, md: 2, b: -7, eqText: "y = −(3/2)x − 7" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים y = −1.5x + 5 ו־y = −(3/2)x − 7 מקבילים זה לזה.",
              taskIds: ["par"],
            },
          ],
          tasks: [
            {
              id: "par",
              kind: "parallel",
              answer: true,
              reason: "שיפועים שווים (−3/2) — הישרים מקבילים.",
            },
          ],
        },
        {
          id: "geo-parallel-1-ex-a004",
          n: 4,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: -2, b: 4, eqText: "y + 2x = 4" } },
            { key: "L2", line: { m: -2, b: 0, eqText: "y = −2x" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים y + 2x = 4 ו־y = −2x מקבילים זה לזה.",
              taskIds: ["par"],
            },
          ],
          tasks: [
            {
              id: "par",
              kind: "parallel",
              answer: true,
              reason: "אחרי סידור: y = −2x + 4 ו־y = −2x. שיפועים שווים (−2).",
            },
          ],
        },
        {
          id: "geo-parallel-1-ex-a005",
          n: 5,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: 1, b: 0, eqText: "y = x" } },
            { key: "L2", line: { m: 1, b: 3, eqText: "y − x = 3" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים y = x ו־y − x = 3 מקבילים זה לזה.",
              taskIds: ["par"],
            },
          ],
          tasks: [
            {
              id: "par",
              kind: "parallel",
              answer: true,
              reason: "אחרי סידור: y = x + 3. שיפועים שווים (1).",
            },
          ],
        },
        {
          id: "geo-parallel-1-ex-a006",
          n: 6,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: 0, b: 2, eqText: "y = 2" } },
            { key: "L2", line: { m: 2, b: 7, eqText: "y = 2x + 7" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים y = 2 ו־y = 2x + 7 מקבילים זה לזה.",
              taskIds: ["par"],
            },
          ],
          tasks: [
            {
              id: "par",
              kind: "parallel",
              answer: false,
              reason: "שיפועים שונים (0 ו־2) — הישרים לא מקבילים.",
            },
          ],
        },
        {
          id: "geo-parallel-1-ex-a007",
          n: 7,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: 3, b: 7 / 2, eqText: "2y = 6x + 7" } },
            { key: "L2", line: { m: 3, b: -2, eqText: "y = 3x − 2" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים 2y = 6x + 7 ו־y = 3x − 2 מקבילים זה לזה.",
              taskIds: ["par"],
            },
          ],
          tasks: [
            {
              id: "par",
              kind: "parallel",
              answer: true,
              reason: "אחרי סידור: y = 3x + 3½. שיפועים שווים (3).",
            },
          ],
        },
        {
          id: "geo-parallel-1-ex-a008",
          n: 8,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: -0.75, mn: -3, md: 4, b: 3, eqText: "3x + 4y = 12" } },
            { key: "L2", line: { m: 0.75, mn: 3, md: 4, b: 4, eqText: "y = (3/4)x + 4" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים 3x + 4y = 12 ו־y = (3/4)x + 4 מקבילים זה לזה.",
              taskIds: ["par"],
            },
          ],
          tasks: [
            {
              id: "par",
              kind: "parallel",
              answer: false,
              reason: "אחרי סידור: y = −(3/4)x + 3. שיפועים שונים.",
            },
          ],
        },
        {
          id: "geo-parallel-1-ex-a009",
          n: 9,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "I", label: "I", line: { m: 2, b: -3, eqText: "y = 2x − 3" } },
            { key: "II", label: "II", line: { m: 2, b: -8, hideEq: true, dashed: true } },
          ],
          points: [{ label: "A", x: 5, y: 2 }],
          parts: [
            {
              label: "א",
              text: "נתון הישר I שמשוואתו y = 2x − 3. הישר II מקביל לישר I ועובר דרך הנקודה A(5;2). מצאו את שיפועו של הישר II.",
              taskIds: ["mII"],
            },
            {
              label: "ב",
              text: "מצאו את משוואתו של הישר II.",
              taskIds: ["eqII"],
            },
          ],
          tasks: [
            { id: "mII", kind: "slope", parallel: true, m: 2, label: "II" },
            { id: "eqII", kind: "lineEq", point: "A", x: 5, y: 2, m: 2, label: "II" },
          ],
        },
        {
          id: "geo-parallel-1-ex-a010",
          n: 10,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "I", label: "", line: { m: -1, b: 5, eqText: "y = −x + 5" } },
            { key: "II", label: "", line: { m: -1, b: 2, hideEq: true, dashed: true } },
          ],
          points: [{ label: "A", x: 1, y: 1 }],
          parts: [
            {
              text: "מצאו את משוואת הישר המקביל לישר y = −x + 5 והעובר דרך הנקודה (1;1).",
              taskIds: ["mII", "eqII"],
            },
          ],
          tasks: [
            { id: "mII", kind: "slope", parallel: true, m: -1, label: "II" },
            { id: "eqII", kind: "lineEq", point: "A", x: 1, y: 1, m: -1, label: "II" },
          ],
        },
        {
          id: "geo-parallel-1-ex-a011",
          n: 11,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          line: { m: 3, b: 8, eqText: "y = 3x + 8" },
          lines: [
            { key: "AB", label: "AB", line: { m: 3, b: 8, eqText: "y = 3x + 8" } },
            { key: "II", label: "", line: { m: 3, b: 0, hideEq: true, dashed: true } },
          ],
          points: [
            { label: "A", x: 0, y: 8 },
            { label: "B", x: -8 / 3, y: 0 },
          ],
          parts: [
            {
              text: "הישר AB הוא גרף הפונקציה y = 3x + 8. מצאו את משוואת הישר המקביל לישר AB והעובר דרך ראשית הצירים.",
              taskIds: ["mII", "eqII"],
            },
          ],
          tasks: [
            { id: "mII", kind: "slope", parallel: true, m: 3, label: "II" },
            { id: "eqII", kind: "lineEq", point: "O", x: 0, y: 0, m: 3, label: "II" },
          ],
        },
        {
          id: "geo-parallel-1-ex-a012",
          n: 12,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          line: { m: 3, b: 12, eqText: "y − 3x = 12" },
          lines: [
            { key: "I", label: "", line: { m: 3, b: 12, eqText: "y − 3x = 12" } },
            { key: "II", label: "", line: { m: 3, b: -2, hideEq: true, dashed: true } },
          ],
          points: [{ label: "A", x: 2, y: 4 }],
          parts: [
            {
              label: "א",
              text: "נתון הישר y − 3x = 12. מצאו את שיפוע הישר.",
              taskIds: ["mI"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר המקביל לישר הנתון והעובר דרך הנקודה (2;4).",
              taskIds: ["eqII"],
            },
          ],
          tasks: [
            { id: "mI", kind: "lineMb", param: "m", label: "m" },
            { id: "eqII", kind: "lineEq", point: "A", x: 2, y: 4, m: 3, label: "II" },
          ],
        },
        {
          id: "geo-parallel-1-ex-a013",
          n: 13,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          line: { m: -8, b: 13, eqText: "y + 8x − 13 = 0" },
          lines: [
            { key: "I", label: "", line: { m: -8, b: 13, eqText: "y + 8x − 13 = 0" } },
            { key: "II", label: "", line: { m: -8, b: 28, hideEq: true, dashed: true } },
          ],
          points: [{ label: "A", x: 4, y: -4 }],
          parts: [
            {
              label: "א",
              text: "נתון ישר שמשוואתו y + 8x − 13 = 0. מצאו את שיפוע הישר.",
              taskIds: ["mI"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר המקביל לישר הנתון והעובר דרך הנקודה (4;−4).",
              taskIds: ["eqII"],
            },
          ],
          tasks: [
            { id: "mI", kind: "lineMb", param: "m", label: "m" },
            { id: "eqII", kind: "lineEq", point: "A", x: 4, y: -4, m: -8, label: "II" },
          ],
        },
        {
          id: "geo-parallel-1-ex-a014",
          n: 14,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          line: { m: 2, b: 8, eqText: "y = 2x + 8" },
          lines: [
            { key: "I", label: "", line: { m: 2, b: 8, eqText: "y = 2x + 8" } },
            { key: "II", label: "", line: { m: 3, b: 8, hideEq: true, dashed: true } },
          ],
          points: [{ label: "A", x: 0, y: 8, hideY: true }],
          parts: [
            {
              label: "א",
              text: "נתון הישר y = 2x + 8. מצאו את נקודת החיתוך של הישר הנתון עם ציר y.",
              taskIds: ["A"],
            },
            {
              label: "ב",
              text: "מצאו משוואת ישר המקביל לישר y = 3x + 2 והעובר בנקודה שמצאתם בסעיף א'.",
              taskIds: ["mII", "eqII"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y" },
            {
              id: "mII",
              kind: "lineMb",
              param: "m",
              label: "m",
              line: { m: 3, b: 2, eqText: "y = 3x + 2" },
            },
            { id: "eqII", kind: "lineEq", point: "A", x: 0, y: 8, m: 3, label: "II" },
          ],
        },
        {
          id: "geo-parallel-1-ex-a015",
          n: 15,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          line: { m: 3, b: -9, eqText: "y = 3x − 9" },
          lines: [
            { key: "I", label: "", line: { m: 3, b: -9, eqText: "y = 3x − 9" } },
            { key: "II", label: "", line: { m: -2, b: 6, hideEq: true, dashed: true } },
          ],
          points: [{ label: "A", x: 3, y: 0, hideX: true }],
          parts: [
            {
              label: "א",
              text: "נתון הישר y = 3x − 9. מצאו את נקודת החיתוך של הישר הנתון עם ציר x.",
              taskIds: ["A"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר המקביל לישר y + 2x = 16 והעובר בנקודה שמצאתם בסעיף א'.",
              taskIds: ["mII", "eqII"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "x", intercept: "x" },
            {
              id: "mII",
              kind: "lineMb",
              param: "m",
              label: "m",
              line: { m: -2, b: 16, eqText: "y + 2x = 16" },
            },
            { id: "eqII", kind: "lineEq", point: "A", x: 3, y: 0, m: -2, label: "II" },
          ],
        },
        {
          id: "geo-parallel-1-ex-a016",
          n: 16,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", label: "", line: { m: 2, b: 4, eqText: "y = 2x + 4" } },
            { key: "L2", label: "", line: { m: -1, b: 10, eqText: "y = −x + 10" } },
          ],
          extraLines: [{ m: 5, b: -2, hideEq: true, dashed: true }],
          points: [{ label: "P", x: 2, y: 8, hideX: true, hideY: true }],
          parts: [
            {
              label: "א",
              text: "נתונים הישרים y = 2x + 4 ו־y = −x + 10. מצאו את שיעורי נקודת החיתוך של שני הישרים.",
              taskIds: ["P"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר המקביל לישר y = 5x + 23 והעובר בנקודה שמצאתם בסעיף א'.",
              taskIds: ["mII", "eqII"],
            },
          ],
          tasks: [
            { id: "P", kind: "lineIntersect", point: "P", label: "P" },
            {
              id: "mII",
              kind: "lineMb",
              param: "m",
              label: "m",
              line: { m: 5, b: 23, eqText: "y = 5x + 23" },
            },
            { id: "eqII", kind: "lineEq", point: "P", x: 2, y: 8, m: 5, label: "II" },
          ],
        },
        {
          id: "geo-parallel-1-ex-a017",
          n: 17,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          lines: [
            { key: "AB", label: "", line: { m: 2, b: 5, hideEq: true } },
            { key: "CD", label: "", line: { m: 2, b: 0, hideEq: true } },
          ],
          points: [
            { label: "A", x: 4, y: 13 },
            { label: "B", x: 1, y: 7 },
            { label: "C", x: 5, y: 10 },
            { label: "D", x: -2, y: -4 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "C", to: "D" },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את שיפוע הישר העובר דרך הנקודות (4;13) ו־(1;7).",
              taskIds: ["mAB"],
            },
            {
              label: "ב",
              text: "מצאו את שיפוע הישר העובר דרך הנקודות (5;10) ו־(−2;−4).",
              taskIds: ["mCD"],
            },
            {
              label: "ג",
              text: "האם הישרים מקבילים? נמקו.",
              taskIds: ["par"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "mCD", label: "m", kind: "slope", from: "C", to: "D" },
            {
              id: "par",
              kind: "parallel",
              answer: true,
              slopeIds: ["mAB", "mCD"],
              reason: "ישרים בעלי אותו שיפוע מקבילים.",
            },
          ],
        },
        {
          id: "geo-parallel-1-ex-a018",
          n: 18,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 2, y: 5 },
            { label: "B", x: 8, y: 8 },
            { label: "C", x: 11, y: 5 },
            { label: "D", x: 1, y: 0 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "D" },
            { from: "D", to: "A" },
          ],
          polygons: [{ verts: ["A", "B", "C", "D"] }],
          parts: [
            {
              label: "א",
              text: "הקודקודים של מרובע ABCD הם A(2;5), B(8;8), C(11;5) ו־D(1;0). הוכיחו ש־AB ∥ DC.",
              taskIds: ["mAB", "mCD", "parAB"],
            },
            {
              label: "ב",
              text: "הראו ש־BC אינו מקביל ל־AD.",
              taskIds: ["mBC", "mAD", "parBC"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "mCD", label: "m", kind: "slope", from: "C", to: "D" },
            {
              id: "parAB",
              kind: "parallel",
              answer: true,
              slopeIds: ["mAB", "mCD"],
              reason: "ישרים בעלי אותו שיפוע מקבילים.",
            },
            { id: "mBC", label: "m", kind: "slope", from: "B", to: "C" },
            { id: "mAD", label: "m", kind: "slope", from: "A", to: "D" },
            {
              id: "parBC",
              kind: "parallel",
              answer: false,
              slopeIds: ["mBC", "mAD"],
              reason: "שיפועים שונים — הישרים לא מקבילים.",
            },
          ],
        },
        {
          id: "geo-parallel-1-ex-a019",
          n: 19,
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "I", label: "I", line: { m: 2, b: 6, hideEq: true } },
            { key: "II", label: "II", line: { m: -1, b: 3, hideEq: true } },
          ],
          extraLines: [{ m: -1, b: 0, hideEq: true, dashed: true }],
          points: [{ label: "P", x: -1, y: 4, hideX: true, hideY: true }],
          parts: [
            {
              label: "א",
              text: "לפניך שרטוט של שני ישרים, I ו־II. נתונות שלוש משוואות: (1) y = −x + 6, (2) y = 2x + 6, (3) y = −x + 3. שתיים מבין שלוש המשוואות הן של הישרים I ו־II. לכל אחד מן הישרים I ו־II, מצאו את המשוואה המתאימה מבין המשוואות (1), (2), (3). נמקו.",
              taskIds: ["eq1", "eq2", "eq3"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר העובר דרך ראשית הצירים (0;0) ומקביל לישר II.",
              taskIds: ["mO", "eqO"],
            },
            {
              label: "ג",
              text: "מצאו את שיעורי נקודת החיתוך של הישרים I ו־II.",
              taskIds: ["P"],
            },
          ],
          tasks: [
            { id: "eq1", kind: "lineMatch", eqNum: 1, eqText: "y = −x + 6", answerKey: "none" },
            { id: "eq2", kind: "lineMatch", eqNum: 2, eqText: "y = 2x + 6", answerKey: "I" },
            { id: "eq3", kind: "lineMatch", eqNum: 3, eqText: "y = −x + 3", answerKey: "II" },
            { id: "mO", kind: "slope", parallel: true, m: -1, label: "II" },
            { id: "eqO", kind: "lineEq", point: "O", x: 0, y: 0, m: -1, label: "ישר" },
            { id: "P", kind: "lineIntersect", point: "P", label: "P" },
          ],
        },
        {
          id: "geo-parallel-1-ex-a020",
          n: 20,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "CD", label: "CD", line: { m: 1, b: -4, eqText: "y = x − 4" } },
            { key: "AB", label: "AB", line: { m: -1, b: 10, eqText: "y = 10 − x" } },
          ],
          extraLines: [
            { m: 1, b: 10, hideEq: true, dashed: true },
            { m: -1, b: -4, hideEq: true, dashed: true },
          ],
          points: [
            { label: "A", x: 0, y: 10, hideY: true },
            { label: "B", x: 10, y: 0 },
            { label: "C", x: 0, y: -4 },
            { label: "D", x: 4, y: 0 },
          ],
          parts: [
            {
              label: "א",
              text: "הישר CD הוא גרף הפונקציה y = x − 4. הישר AB הוא גרף הפונקציה y = 10 − x. מצאו את שיעורי הנקודה A.",
              taskIds: ["A"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר העובר דרך הנקודה A ומקביל לישר CD.",
              taskIds: ["mA", "eqA"],
            },
            {
              label: "ג",
              text: "מצאו את משוואת הישר העובר דרך הנקודה C ומקביל לישר AB.",
              taskIds: ["mC", "eqC"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y" },
            { id: "mA", kind: "slope", parallel: true, m: 1, label: "2", givenLabel: "CD" },
            { id: "eqA", kind: "lineEq", point: "A", x: 0, y: 10, m: 1, label: "ישר" },
            { id: "mC", kind: "slope", parallel: true, m: -1, label: "2", givenLabel: "AB" },
            { id: "eqC", kind: "lineEq", point: "C", x: 0, y: -4, m: -1, label: "ישר" },
          ],
        },
        {
          id: "geo-parallel-1-ex-a021",
          n: 21,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          line: { m: 3, b: 1, eqText: "y = 3x + 1" },
          lines: [{ key: "L", label: "", line: { m: 3, b: 1, eqText: "y = 3x + 1" } }],
          points: [
            { label: "A", x: 4, y: 11 },
            { label: "B", x: 1, y: 2 },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "הוכיחו שהישר המחבר את הנקודות (4;11) ו־(1;2) מקביל לישר y = 3x + 1.",
              taskIds: ["mAB", "par"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            {
              id: "par",
              kind: "parallel",
              answer: true,
              slopeIds: ["mAB"],
              givenM: 3,
              reason: "ישרים בעלי אותו שיפוע מקבילים.",
            },
          ],
        },
        {
          id: "geo-parallel-1-ex-a022",
          n: 22,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 3, y: 4 },
            { label: "B", x: 1, y: 8 },
            { label: "C", x: 4, y: 1 },
            { label: "D", x: 0, y: 9 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "C", to: "D" },
          ],
          parts: [
            {
              text: "הוכיחו כי הישר העובר דרך הנקודות (3;4) ו־(1;8) מקביל לישר העובר דרך הנקודות (4;1) ו־(0;9).",
              taskIds: ["mAB", "mCD", "par"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "mCD", label: "m", kind: "slope", from: "C", to: "D" },
            {
              id: "par",
              kind: "parallel",
              answer: true,
              slopeIds: ["mAB", "mCD"],
              reason: "ישרים בעלי אותו שיפוע מקבילים.",
            },
          ],
        },
      ],
    }
  ]);
})(window);
