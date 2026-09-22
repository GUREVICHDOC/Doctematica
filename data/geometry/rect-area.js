(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
{
      id: "geo-rect-area-1",
      topic: "analytic",
      subtopic: "areas",
      mode: "geo-length",
      title: "שטח מלבן",
      instruction:
        "צלעות המלבן מקבילות לצירים. מומלץ: קודם קודקודים חסרים אם צריך, אחר כך אורכי הצלעות (גדול פחות קטן), ואז שטח sABCD=AB×BC.",
      exercises: [
        {
          id: "geo-rect-area-1-ex-a001",
          n: 1,
          points: [
            { label: "A", x: 2, y: 0 },
            { label: "B", x: 7, y: 0 },
            { label: "C", x: 7, y: 6 },
            { label: "D", x: 2, y: 6 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "D" },
            { from: "D", to: "A" },
          ],
          polygons: [{ verts: ["A", "B", "C", "D"] }],
          rightAngles: [{ at: "B", from: "A", to: "C" }],
          parts: [
            {
              label: "א",
              text: "ABCD מלבן שצלעותיו מקבילות לצירים. נתונים A(2;0), B(7;0) ו־C(7;6). מצאו את אורכי הצלעות AB ו־BC.",
              taskIds: ["AB", "BC"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המלבן ABCD. רשמו קודם את הנוסחה עם האותיות (AB×BC), ואז את התוצאה.",
              taskIds: ["SABCD"],
            },
          ],
          tasks: [
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B" },
            { id: "BC", label: "BC", kind: "segment", from: "B", to: "C" },
            {
              id: "SABCD",
              label: "S□ABCD",
              kind: "area",
              shape: "rect",
              verts: ["A", "B", "C", "D"],
              legs: [
                ["A", "B"],
                ["B", "C"],
              ],
            },
          ],
        },
        {
          id: "geo-rect-area-1-ex-a002",
          n: 2,
          points: [
            { label: "A", x: 1, y: 4 },
            { label: "B", x: 5, y: 4, hideX: true, hideY: true },
            { label: "C", x: 5, y: 1 },
            { label: "D", x: 1, y: 1, hideX: true, hideY: true },
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
              text: "ABCD מלבן שצלעותיו מקבילות לצירים. נתונים A(1;4) ו־C(5;1). רשמו את שיעורי הקודקודים B ו־D.",
              taskIds: ["B", "D"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המלבן ABCD. מומלץ קודם את אורכי AB ו־AD, ואז את הנוסחה.",
              taskIds: ["AB", "AD", "SABCD"],
            },
          ],
          tasks: [
            {
              id: "B",
              label: "B",
              kind: "point",
              point: "B",
              missing: "both",
              twinX: "C",
              twinY: "A",
              answerX: 5,
              answerY: 4,
            },
            {
              id: "D",
              label: "D",
              kind: "point",
              point: "D",
              missing: "both",
              twinX: "A",
              twinY: "C",
              answerX: 1,
              answerY: 1,
            },
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "AD", label: "AD", kind: "segment", from: "A", to: "D", optional: true },
            {
              id: "SABCD",
              label: "S□ABCD",
              kind: "area",
              shape: "rect",
              verts: ["A", "B", "C", "D"],
              legs: [
                ["A", "B"],
                ["A", "D"],
              ],
            },
          ],
        },
        {
          id: "geo-rect-area-1-ex-a003",
          n: 3,
          points: [
            { label: "A", x: 2, y: 8 },
            { label: "B", x: 2, y: 1, hideX: true, hideY: true },
            { label: "C", x: -4, y: 1 },
            { label: "D", x: -4, y: 8, hideX: true, hideY: true },
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
              text: "ABCD מלבן שצלעותיו מקבילות לצירים. נתונים A(2;8) ו־C(−4;1). הקודקוד B נמצא ברביע הראשון. רשמו את שיעורי B ו־D.",
              taskIds: ["B", "D"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המלבן ABCD. מומלץ קודם את אורכי AB ו־AD, ואז את הנוסחה.",
              taskIds: ["AB", "AD", "SABCD"],
            },
          ],
          tasks: [
            {
              id: "B",
              label: "B",
              kind: "point",
              point: "B",
              missing: "both",
              twinX: "A",
              twinY: "C",
              answerX: 2,
              answerY: 1,
            },
            {
              id: "D",
              label: "D",
              kind: "point",
              point: "D",
              missing: "both",
              twinX: "C",
              twinY: "A",
              answerX: -4,
              answerY: 8,
            },
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "AD", label: "AD", kind: "segment", from: "A", to: "D", optional: true },
            {
              id: "SABCD",
              label: "S□ABCD",
              kind: "area",
              shape: "rect",
              verts: ["A", "B", "C", "D"],
              legs: [
                ["A", "B"],
                ["A", "D"],
              ],
            },
          ],
        },
        {
          id: "geo-rect-area-1-ex-a004",
          n: 4,
          points: [
            { label: "A", x: 8, y: 10 },
            { label: "B", x: 13, y: 10, hideX: true, hideY: true },
            { label: "C", x: 13, y: 22 },
            { label: "D", x: 8, y: 22, hideX: true, hideY: true },
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
              text: "ABCD מלבן שצלעותיו מקבילות לצירים. נתונים A(8;10) ו־C(13;22). רשמו את שיעורי הקודקודים B ו־D.",
              taskIds: ["B", "D"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המלבן ABCD. מומלץ קודם את אורכי AB ו־AD, ואז את הנוסחה.",
              taskIds: ["AB", "AD", "SABCD"],
            },
          ],
          tasks: [
            {
              id: "B",
              label: "B",
              kind: "point",
              point: "B",
              missing: "both",
              twinX: "C",
              twinY: "A",
              answerX: 13,
              answerY: 10,
            },
            {
              id: "D",
              label: "D",
              kind: "point",
              point: "D",
              missing: "both",
              twinX: "A",
              twinY: "C",
              answerX: 8,
              answerY: 22,
            },
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "AD", label: "AD", kind: "segment", from: "A", to: "D", optional: true },
            {
              id: "SABCD",
              label: "S□ABCD",
              kind: "area",
              shape: "rect",
              verts: ["A", "B", "C", "D"],
              legs: [
                ["A", "B"],
                ["A", "D"],
              ],
            },
          ],
        },
      ],
    }
  ]);
})(window);
