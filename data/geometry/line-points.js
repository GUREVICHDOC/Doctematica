(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
{
      id: "geo-line-points-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "מציאת נקודות",
      instruction:
        "אם מחפשים שיעורים — מציבים ב־y. אם בודקים אם נקודה על הישר: הציבו x ו־y והראו שוויון בין האגפים, או הציבו רק x וחשבו y. בשאלות כן/לא — אחרי החישוב ענו כן או לא. אפשר לנמק.",
      exercises: [
        {
          id: "geo-line-points-1-ex-a001",
          n: 1,
          line: { m: 1, b: 2 },
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 2, y: 4, hideY: true },
            { label: "B", x: 0, y: 2, hideY: true },
            { label: "C", x: -2, y: 0, hideX: true },
            { label: "D", x: -5, y: -3, hideX: true },
          ],
          parts: [
            {
              label: "א",
              text: "הנקודות A, B, C ו־D נמצאות על הישר y = x + 2. בנקודה A שיעור ה־x הוא 2, ובנקודה B שיעור ה־x הוא 0. מצאו את שיעורי הנקודות A ו־B.",
              taskIds: ["A", "B"],
            },
            {
              label: "ב",
              text: "בנקודה C שיעור ה־y הוא 0, ובנקודה D שיעור ה־y הוא −3. מצאו את שיעורי הנקודות C ו־D.",
              taskIds: ["C", "D"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y" },
            { id: "B", label: "B", kind: "point", point: "B", missing: "y" },
            { id: "C", label: "C", kind: "point", point: "C", missing: "x" },
            { id: "D", label: "D", kind: "point", point: "D", missing: "x" },
          ],
        },
        {
          id: "geo-line-points-1-ex-a002",
          n: 2,
          line: { m: -3, b: 6 },
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: -1, y: 9, hideY: true },
            { label: "B", x: 0, y: 6, hideY: true },
            { label: "C", x: 1, y: 3, hideX: true },
            { label: "D", x: 3, y: -3, hideX: true },
          ],
          parts: [
            {
              label: "א",
              text: "בציור מתואר הישר y = −3x + 6 ועליו הנקודות A, B, C ו־D. בנקודה A שיעור ה־x הוא −1, ובנקודה B שיעור ה־x הוא 0. מצאו את שיעורי הנקודות A ו־B.",
              taskIds: ["A", "B"],
            },
            {
              label: "ב",
              text: "בנקודה C שיעור ה־y הוא 3, ובנקודה D שיעור ה־y הוא −3. מצאו את שיעורי הנקודות C ו־D.",
              taskIds: ["C", "D"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y" },
            { id: "B", label: "B", kind: "point", point: "B", missing: "y" },
            { id: "C", label: "C", kind: "point", point: "C", missing: "x" },
            { id: "D", label: "D", kind: "point", point: "D", missing: "x" },
          ],
        },
        {
          id: "geo-line-points-1-ex-a003",
          n: 3,
          line: { m: 1, b: 4 },
          showBoard: false,
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "א",
              text: "הראו שהנקודות A(1;5) ו־B(−2;2) נמצאות על הישר y = x + 4.",
              taskIds: ["A", "B"],
            },
            {
              label: "ב",
              text: "הראו שהנקודות C(2;7) ו־D(0;5) אינן נמצאות על הישר.",
              taskIds: ["C", "D"],
            },
          ],
          tasks: [
            {
              id: "A",
              label: "A",
              kind: "onLine",
              point: "A",
              x: 1,
              y: 5,
              on: true,
              askYesNo: true,
              reason: "הערכים משני הצדדים אותו הדבר, לכן A על הישר.",
            },
            {
              id: "B",
              label: "B",
              kind: "onLine",
              point: "B",
              x: -2,
              y: 2,
              on: true,
              askYesNo: true,
              reason: "הערכים משני הצדדים אותו הדבר, לכן B על הישר.",
            },
            {
              id: "C",
              label: "C",
              kind: "onLine",
              point: "C",
              x: 2,
              y: 7,
              on: false,
              askYesNo: true,
              reason: "הערכים משני הצדדים לא אותו הדבר, לכן C לא על הישר.",
            },
            {
              id: "D",
              label: "D",
              kind: "onLine",
              point: "D",
              x: 0,
              y: 5,
              on: false,
              askYesNo: true,
              reason: "הערכים משני הצדדים לא אותו הדבר, לכן D לא על הישר.",
            },
          ],
        },
        {
          id: "geo-line-points-1-ex-a004",
          n: 4,
          line: { m: -5, b: 0 },
          showBoard: false,
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "א",
              text: "נתון הישר y = −5x. אילו מהנקודות נמצאות על הישר: A(2;−10), B(0;−5), C(−1;5), D(1;5)? אחרי החישוב ענו כן או לא לכל נקודה.",
              taskIds: ["A", "B", "C", "D"],
            },
            {
              label: "ב",
              text: "נתון הישר y = 3x − 1. רשמו שיעורים של נקודה שנמצאת על הישר.",
              taskIds: ["P"],
              line: { m: 3, b: -1 },
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "onLine", point: "A", x: 2, y: -10, on: true, askYesNo: true, reason: "y מתאים / האגפים שווים, לכן A על הישר." },
            { id: "B", label: "B", kind: "onLine", point: "B", x: 0, y: -5, on: false, askYesNo: true, reason: "y לא מתאים, לכן B לא על הישר." },
            { id: "C", label: "C", kind: "onLine", point: "C", x: -1, y: 5, on: true, askYesNo: true, reason: "y מתאים, לכן C על הישר." },
            { id: "D", label: "D", kind: "onLine", point: "D", x: 1, y: 5, on: false, askYesNo: true, reason: "y לא מתאים, לכן D לא על הישר." },
            { id: "P", label: "P", kind: "freePoint", point: "P", line: { m: 3, b: -1 } },
          ],
        },
        {
          id: "geo-line-points-1-ex-a005",
          n: 5,
          line: { mn: 1, md: 3, b: 6 },
          showBoard: false,
          showSegments: false,
          showAxisGuides: false,
          parts: [
            {
              label: "א",
              text: "האם הנקודה (−3;7) נמצאת על הישר y = (1/3)x + 6? נמקו.",
              taskIds: ["P"],
            },
            {
              label: "ב",
              text: "רשמו שיעורים של נקודה שנמצאת על הישר.",
              taskIds: ["Q"],
            },
          ],
          tasks: [
            {
              id: "P",
              label: "(−3;7)",
              kind: "onLine",
              point: "P",
              x: -3,
              y: 7,
              on: false,
              askYesNo: true,
              reasonRequired: true,
              reason: "אחרי הצבה y יוצא 5, ו־5 ≠ 7, לכן הנקודה לא על הישר.",
            },
            { id: "Q", label: "נקודה", kind: "freePoint", point: "Q" },
          ],
        },
      ],
    }
  ]);
})(window);
