(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "geo-segments-1",
      topic: "analytic",
      subtopic: "segments",
      mode: "geo-length",
      title: "אורכי קטעים",
      instruction:
        "מרחק מראשית: OB / BO. מרחק לציר: A→x. מרחק מנקודה לקטע: C→AB או CAB. מציאת נקודה: B(x;y).",
      exercises: [
        {
          n: 1,
          points: [
            { label: "A", x: 5, y: 0 },
            { label: "B", x: 2, y: 0 },
            { label: "C", x: -3, y: 0 },
            { label: "D", x: -7, y: 0 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את המרחק של הנקודה B ושל הנקודה D מראשית הצירים.",
              taskIds: ["OB", "OD"],
            },
            {
              label: "ב",
              text: "מצאו את אורכי הקטעים: AB, AC, BD, CD.",
              taskIds: ["AB", "AC", "BD", "CD"],
            },
          ],
          tasks: [
            { id: "OB", label: "OB", kind: "origin", point: "B" },
            { id: "OD", label: "OD", kind: "origin", point: "D" },
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B" },
            { id: "AC", label: "AC", kind: "segment", from: "A", to: "C" },
            { id: "BD", label: "BD", kind: "segment", from: "B", to: "D" },
            { id: "CD", label: "CD", kind: "segment", from: "C", to: "D" },
          ],
        },
        {
          n: 2,
          points: [
            { label: "A", x: 0, y: 10 },
            { label: "B", x: 0, y: 3 },
            { label: "C", x: 0, y: -2 },
            { label: "D", x: 0, y: -6 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את המרחק של הנקודות A ו־C מראשית הצירים.",
              taskIds: ["OA", "OC"],
            },
            {
              label: "ב",
              text: "מצאו את אורכי הקטעים: AB, AC, BC, BD ו־CD.",
              taskIds: ["AB", "AC", "BC", "BD", "CD"],
            },
          ],
          tasks: [
            { id: "OA", label: "OA", kind: "origin", point: "A" },
            { id: "OC", label: "OC", kind: "origin", point: "C" },
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B" },
            { id: "AC", label: "AC", kind: "segment", from: "A", to: "C" },
            { id: "BC", label: "BC", kind: "segment", from: "B", to: "C" },
            { id: "BD", label: "BD", kind: "segment", from: "B", to: "D" },
            { id: "CD", label: "CD", kind: "segment", from: "C", to: "D" },
          ],
        },
        {
          n: 3,
          points: [
            { label: "A", x: 6, y: 0 },
            { label: "B", x: 1, y: 0 },
            { label: "C", x: -2, y: 0 },
            { label: "D", x: -5, y: 0 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את המרחק של הנקודות A ו־C מראשית הצירים.",
              taskIds: ["OA", "OC"],
            },
            {
              label: "ב",
              text: "מצאו את אורכי הקטעים: AB, AD, BC, CD.",
              taskIds: ["AB", "AD", "BC", "CD"],
            },
          ],
          tasks: [
            { id: "OA", label: "OA", kind: "origin", point: "A" },
            { id: "OC", label: "OC", kind: "origin", point: "C" },
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B" },
            { id: "AD", label: "AD", kind: "segment", from: "A", to: "D" },
            { id: "BC", label: "BC", kind: "segment", from: "B", to: "C" },
            { id: "CD", label: "CD", kind: "segment", from: "C", to: "D" },
          ],
        },
        {
          n: 4,
          points: [
            { label: "P", x: 4, y: 0 },
            { label: "Q", x: -1, y: 0 },
            { label: "R", x: -6, y: 0 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את המרחק של כל נקודה מראשית הצירים.",
              taskIds: ["OP", "OQ", "OR"],
            },
            {
              label: "ב",
              text: "מצאו את אורכי הקטעים PQ, PR, QR.",
              taskIds: ["PQ", "PR", "QR"],
            },
          ],
          tasks: [
            { id: "OP", label: "OP", kind: "origin", point: "P" },
            { id: "OQ", label: "OQ", kind: "origin", point: "Q" },
            { id: "OR", label: "OR", kind: "origin", point: "R" },
            { id: "PQ", label: "PQ", kind: "segment", from: "P", to: "Q" },
            { id: "PR", label: "PR", kind: "segment", from: "P", to: "R" },
            { id: "QR", label: "QR", kind: "segment", from: "Q", to: "R" },
          ],
        },
        {
          n: 5,
          points: [
            { label: "A", x: 2, y: 10 },
            { label: "B", x: 5, y: 10 },
            { label: "C", x: -4, y: 6 },
            { label: "D", x: -4, y: 1 },
            { label: "E", x: -4, y: -8 },
            { label: "F", x: 3, y: -8 },
            { label: "G", x: 7, y: 2 },
            { label: "H", x: 7, y: -1 },
          ],
          parts: [
            {
              label: "",
              text: "חשבו את אורכי הקטעים AB, CD, EF ו־GH.",
              taskIds: ["AB", "CD", "EF", "GH"],
            },
          ],
          tasks: [
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B" },
            { id: "CD", label: "CD", kind: "segment", from: "C", to: "D" },
            { id: "EF", label: "EF", kind: "segment", from: "E", to: "F" },
            { id: "GH", label: "GH", kind: "segment", from: "G", to: "H" },
          ],
        },
        {
          n: 6,
          points: [{ label: "A", x: 3, y: 4 }],
          parts: [
            {
              label: "א",
              text: "מהו המרחק של הנקודה A מציר ה־x? (רשמו A→x או Ax)",
              taskIds: ["A-x"],
            },
            {
              label: "ב",
              text: "מהו המרחק של הנקודה A מציר ה־y? (רשמו A→y או Ay)",
              taskIds: ["A-y"],
            },
          ],
          tasks: [
            { id: "A-x", label: "A→x", kind: "axis", point: "A", axis: "x" },
            { id: "A-y", label: "A→y", kind: "axis", point: "A", axis: "y" },
          ],
        },
        {
          n: 7,
          showAxisGuides: false,
          points: [
            { label: "A", x: 10, y: 8 },
            { label: "B", x: -4, y: 5 },
            { label: "C", x: -2, y: -4 },
            { label: "D", x: 5, y: -3 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את המרחק מציר ה־x של כל אחת מהנקודות (A→x, B→x, …).",
              taskIds: ["A-x", "B-x", "C-x", "D-x"],
            },
            {
              label: "ב",
              text: "מצאו את המרחק מציר ה־y של כל אחת מהנקודות (A→y, B→y, …).",
              taskIds: ["A-y", "B-y", "C-y", "D-y"],
            },
          ],
          tasks: [
            { id: "A-x", label: "A→x", kind: "axis", point: "A", axis: "x" },
            { id: "B-x", label: "B→x", kind: "axis", point: "B", axis: "x" },
            { id: "C-x", label: "C→x", kind: "axis", point: "C", axis: "x" },
            { id: "D-x", label: "D→x", kind: "axis", point: "D", axis: "x" },
            { id: "A-y", label: "A→y", kind: "axis", point: "A", axis: "y" },
            { id: "B-y", label: "B→y", kind: "axis", point: "B", axis: "y" },
            { id: "C-y", label: "C→y", kind: "axis", point: "C", axis: "y" },
            { id: "D-y", label: "D→y", kind: "axis", point: "D", axis: "y" },
          ],
        },
        {
          n: 8,
          parts: [
            {
              label: "א",
              text: "AB מקביל לציר ה־y. שיעורי A הם (4;3). שיעור ה־y של B הוא −1. מצאו את שיעורי B.",
              taskIds: ["B"],
              points: [
                { label: "A", x: 4, y: 3 },
                { label: "B", x: 4, y: -1, hideX: true },
              ],
              segments: [{ from: "A", to: "B" }],
            },
            {
              label: "ב",
              text: "CD מקביל לציר ה־x. שיעורי C הם (6;5). שיעור ה־x של D הוא −3. מצאו את שיעורי D.",
              taskIds: ["D"],
              points: [
                { label: "C", x: 6, y: 5 },
                { label: "D", x: -3, y: 5, hideY: true },
              ],
              segments: [{ from: "C", to: "D" }],
            },
          ],
          tasks: [
            {
              id: "B",
              label: "B",
              kind: "point",
              point: "B",
              missing: "x",
              twin: "A",
              answerX: 4,
              answerY: -1,
            },
            {
              id: "D",
              label: "D",
              kind: "point",
              point: "D",
              missing: "y",
              twin: "C",
              answerX: -3,
              answerY: 5,
            },
          ],
        },
        {
          n: 9,
          showAxisGuides: false,
          parts: [
            {
              label: "I א",
              text: "הישרים המקווקווים מקבילים לצירים. חשבו את שיעורי הנקודות החסרות.",
              taskIds: ["B1", "C1"],
              points: [
                { label: "H", x: 6, y: 10 },
                { label: "B", x: 6, y: -4, hideX: true },
                { label: "C", x: -8, y: -4, hideY: true },
              ],
              segments: [
                { from: "H", to: "B", dashed: true },
                { from: "B", to: "C", dashed: true },
              ],
            },
            {
              label: "I ב",
              text: "מצאו את אורכי הקטעים המקווקווים HB ו־BC.",
              taskIds: ["HB", "BC1"],
              points: [
                { label: "H", x: 6, y: 10 },
                { label: "B", x: 6, y: -4, hideX: true },
                { label: "C", x: -8, y: -4, hideY: true },
              ],
              segments: [
                { from: "H", to: "B", dashed: true },
                { from: "B", to: "C", dashed: true },
              ],
            },
            {
              label: "II א",
              text: "הישרים המקווקווים מקבילים לצירים. חשבו את שיעורי הנקודות החסרות.",
              taskIds: ["P", "Q"],
              points: [
                { label: "D", x: -5, y: 3 },
                { label: "P", x: 2, y: 3, hideY: true },
                { label: "Q", x: -5, y: -2, hideX: true },
              ],
              segments: [
                { from: "D", to: "P", dashed: true },
                { from: "D", to: "Q", dashed: true },
              ],
            },
            {
              label: "II ב",
              text: "מצאו את אורכי הקטעים המקווקווים DP ו־DQ.",
              taskIds: ["DP", "DQ"],
              points: [
                { label: "D", x: -5, y: 3 },
                { label: "P", x: 2, y: 3, hideY: true },
                { label: "Q", x: -5, y: -2, hideX: true },
              ],
              segments: [
                { from: "D", to: "P", dashed: true },
                { from: "D", to: "Q", dashed: true },
              ],
            },
            {
              label: "III א",
              text: "הישרים המקווקווים מקבילים לצירים. חשבו את שיעורי הנקודה החסרה B.",
              taskIds: ["B3"],
              points: [
                { label: "A", x: -4, y: 8 },
                { label: "B", x: -4, y: 4, hideX: true, hideY: true },
                { label: "C", x: 6, y: 4 },
              ],
              segments: [
                { from: "A", to: "B", dashed: true },
                { from: "B", to: "C", dashed: true },
              ],
            },
            {
              label: "III ב",
              text: "מצאו את אורכי הקטעים המקווקווים AB ו־BC.",
              taskIds: ["AB3", "BC3"],
              points: [
                { label: "A", x: -4, y: 8 },
                { label: "B", x: -4, y: 4, hideX: true, hideY: true },
                { label: "C", x: 6, y: 4 },
              ],
              segments: [
                { from: "A", to: "B", dashed: true },
                { from: "B", to: "C", dashed: true },
              ],
            },
          ],
          tasks: [
            {
              id: "B1",
              label: "B",
              kind: "point",
              point: "B",
              missing: "x",
              twin: "H",
              answerX: 6,
              answerY: -4,
            },
            {
              id: "C1",
              label: "C",
              kind: "point",
              point: "C",
              missing: "y",
              twin: "B",
              answerX: -8,
              answerY: -4,
            },
            { id: "HB", label: "HB", kind: "segment", from: "H", to: "B", answer: 14 },
            { id: "BC1", label: "BC", kind: "segment", from: "B", to: "C", answer: 14 },
            {
              id: "P",
              label: "P",
              kind: "point",
              point: "P",
              missing: "y",
              twin: "D",
              answerX: 2,
              answerY: 3,
            },
            {
              id: "Q",
              label: "Q",
              kind: "point",
              point: "Q",
              missing: "x",
              twin: "D",
              answerX: -5,
              answerY: -2,
            },
            { id: "DP", label: "DP", kind: "segment", from: "D", to: "P", answer: 7 },
            { id: "DQ", label: "DQ", kind: "segment", from: "D", to: "Q", answer: 5 },
            {
              id: "B3",
              label: "B",
              kind: "point",
              point: "B",
              missing: "both",
              twinX: "A",
              twinY: "C",
              answerX: -4,
              answerY: 4,
            },
            { id: "AB3", label: "AB", kind: "segment", from: "A", to: "B", answer: 4 },
            { id: "BC3", label: "BC", kind: "segment", from: "B", to: "C", answer: 10 },
          ],
        },
        {
          n: 10,
          showAxisGuides: false,
          parts: [
            {
              label: "א",
              text: "הישרים המקווקווים שבשרטוט מקבילים לצירים. חשבו את שיעורי הנקודות B ו־D על סמך הנתונים שבשרטוט.",
              taskIds: ["B16", "D16"],
              points: [
                { label: "A", x: 5, y: 4 },
                { label: "B", x: 5, y: -2, hideX: true, hideY: true },
                { label: "C", x: -2, y: -2 },
                { label: "D", x: -2, y: 4, hideX: true, hideY: true },
              ],
              segments: [
                { from: "A", to: "B", dashed: true },
                { from: "B", to: "C", dashed: true },
                { from: "C", to: "D", dashed: true },
                { from: "D", to: "A", dashed: true },
              ],
            },
            {
              label: "ב",
              text: "חשבו את אורכי הקטעים AB ו־BC.",
              taskIds: ["AB16", "BC16"],
              points: [
                { label: "A", x: 5, y: 4 },
                { label: "B", x: 5, y: -2, hideX: true, hideY: true },
                { label: "C", x: -2, y: -2 },
                { label: "D", x: -2, y: 4, hideX: true, hideY: true },
              ],
              segments: [
                { from: "A", to: "B", dashed: true },
                { from: "B", to: "C", dashed: true },
                { from: "C", to: "D", dashed: true },
                { from: "D", to: "A", dashed: true },
              ],
            },
          ],
          tasks: [
            {
              id: "B16",
              label: "B",
              kind: "point",
              point: "B",
              missing: "both",
              twinX: "A",
              twinY: "C",
              answerX: 5,
              answerY: -2,
            },
            {
              id: "D16",
              label: "D",
              kind: "point",
              point: "D",
              missing: "both",
              twinX: "C",
              twinY: "A",
              answerX: -2,
              answerY: 4,
            },
            { id: "AB16", label: "AB", kind: "segment", from: "A", to: "B", answer: 6 },
            { id: "BC16", label: "BC", kind: "segment", from: "B", to: "C", answer: 7 },
          ],
        },
        {
          n: 11,
          showAxisGuides: false,
          parts: [
            {
              label: "",
              text: "הישרים המקווקווים מקבילים לצירים. מצאו את מרחק הנקודה C מהקטע AB. (רשמו C→AB או CAB)",
              taskIds: ["CAB"],
              points: [
                { label: "A", x: 2, y: 4 },
                { label: "B", x: 2, y: 1 },
                { label: "C", x: 0, y: 2 },
              ],
              segments: [{ from: "A", to: "B", dashed: true }],
            },
          ],
          tasks: [
            {
              id: "CAB",
              label: "C→AB",
              kind: "distSeg",
              point: "C",
              from: "A",
              to: "B",
              answer: 2,
            },
          ],
        },
        {
          n: 12,
          showAxisGuides: false,
          parts: [
            {
              label: "",
              text: "הישרים המקווקווים מקבילים לצירים. מצאו את מרחק הנקודה C מהקטע AB. (רשמו C→AB או CAB)",
              taskIds: ["CAB"],
              points: [
                { label: "A", x: 2, y: 2 },
                { label: "B", x: 4, y: 2 },
                { label: "C", x: 3, y: 5 },
              ],
              segments: [{ from: "A", to: "B", dashed: true }],
            },
          ],
          tasks: [
            {
              id: "CAB",
              label: "C→AB",
              kind: "distSeg",
              point: "C",
              from: "A",
              to: "B",
              answer: 3,
            },
          ],
        },
        {
          n: 13,
          showAxisGuides: false,
          parts: [
            {
              label: "",
              text: "הישרים המקווקווים מקבילים לצירים. מצאו את מרחק הנקודה C מהקטע AB. (רשמו C→AB או CAB)",
              taskIds: ["CAB"],
              points: [
                { label: "A", x: -2, y: -4 },
                { label: "B", x: 3, y: -4 },
                { label: "C", x: 2, y: 3 },
              ],
              segments: [{ from: "A", to: "B", dashed: true }],
            },
          ],
          tasks: [
            {
              id: "CAB",
              label: "C→AB",
              kind: "distSeg",
              point: "C",
              from: "A",
              to: "B",
              answer: 7,
            },
          ],
        },
        {
          n: 14,
          showAxisGuides: false,
          parts: [
            {
              label: "",
              text: "הישרים המקווקווים מקבילים לצירים. מצאו את מרחק הנקודה C מהקטע AB. (רשמו C→AB או CAB)",
              taskIds: ["CAB"],
              points: [
                { label: "A", x: -2, y: 3 },
                { label: "B", x: -2, y: -3 },
                { label: "C", x: 3, y: 2 },
              ],
              segments: [{ from: "A", to: "B", dashed: true }],
            },
          ],
          tasks: [
            {
              id: "CAB",
              label: "C→AB",
              kind: "distSeg",
              point: "C",
              from: "A",
              to: "B",
              answer: 5,
            },
          ],
        },
      ],
    },
    {
      id: "geo-triangle-area-1",
      topic: "analytic",
      subtopic: "areas",
      mode: "geo-length",
      title: "שטח משולש",
      instruction:
        "מומלץ: קודם אורכי הניצבים (גדול פחות קטן), אחר כך שטח sABC=(AB×BC)/2 בשלבים. אפשר גם לרשום ישירות שטח נכון.",
      exercises: [
        {
          n: 1,
          points: [
            { label: "A", x: 0, y: 3 },
            { label: "B", x: 6, y: 0 },
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
              text: "במערכת צירים מסומנות הנקודות A(0;3) ו־B(6;0). הנקודה O היא ראשית הצירים. רשמו את אורכי הקטעים AO ו־BO.",
              taskIds: ["OA", "OB"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש AOB. רשמו קודם את הביטוי (למשל (AO×BO)/2 או 3×6/2), ואז את התוצאה.",
              taskIds: ["SAOB"],
            },
          ],
          tasks: [
            { id: "OA", label: "AO", kind: "origin", point: "A" },
            { id: "OB", label: "BO", kind: "origin", point: "B" },
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
          n: 2,
          points: [
            { label: "A", x: 0, y: 4 },
            { label: "B", x: 0, y: -3 },
            { label: "C", x: 4, y: -3 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "A", to: "C" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          rightAngles: [{ at: "B", from: "A", to: "C" }],
          parts: [
            {
              label: "",
              text: "נתונים שיעורי הנקודות A, B ו־C. חשבו את שטח המשולש ABC. מומלץ קודם למצוא את אורכי הניצבים AB ו־BC.",
              taskIds: ["AB", "BC", "SABC"],
            },
          ],
          tasks: [
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "BC", label: "BC", kind: "segment", from: "B", to: "C", optional: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["A", "B"],
                ["B", "C"],
              ],
            },
          ],
        },
        {
          n: 3,
          points: [
            { label: "A", x: 2, y: 4 },
            { label: "B", x: 2, y: -1 },
            { label: "C", x: 5, y: -1 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "A", to: "C" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          rightAngles: [{ at: "B", from: "A", to: "C" }],
          parts: [
            {
              label: "",
              text: "נתונים שיעורי הנקודות A, B ו־C. חשבו את שטח המשולש ABC. מומלץ קודם למצוא את אורכי הניצבים AB ו־BC.",
              taskIds: ["AB", "BC", "SABC"],
            },
          ],
          tasks: [
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "BC", label: "BC", kind: "segment", from: "B", to: "C", optional: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["A", "B"],
                ["B", "C"],
              ],
            },
          ],
        },
        {
          n: 4,
          points: [
            { label: "A", x: -1, y: -1 },
            { label: "B", x: -3, y: -5 },
            { label: "C", x: -1, y: -5 },
          ],
          segments: [
            { from: "A", to: "C" },
            { from: "B", to: "C" },
            { from: "A", to: "B" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          rightAngles: [{ at: "C", from: "A", to: "B" }],
          parts: [
            {
              label: "",
              text: "נתונים שיעורי הנקודות A, B ו־C. חשבו את שטח המשולש ABC. מומלץ קודם למצוא את אורכי הניצבים AC ו־BC.",
              taskIds: ["AC", "BC", "SABC"],
            },
          ],
          tasks: [
            { id: "AC", label: "AC", kind: "segment", from: "A", to: "C", optional: true },
            { id: "BC", label: "BC", kind: "segment", from: "B", to: "C", optional: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["A", "C"],
                ["B", "C"],
              ],
            },
          ],
        },
        {
          n: 5,
          points: [
            { label: "A", x: 8, y: 6 },
            { label: "B", x: 4, y: 0 },
            { label: "C", x: 14, y: 0 },
            { label: "D", x: 8, y: 0, hideX: true, hideY: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" },
            { from: "A", to: "D" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          rightAngles: [{ at: "D", from: "A", to: "B" }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו קודקוד, וגררו את רגל הגובה אל הצלע.",
            triangle: ["A", "B", "C"],
            heights: [
              {
                id: "hAD",
                from: "A",
                base: ["B", "C"],
                footLabel: "D",
                recommended: true,
              },
            ],
          },
          parts: [
            {
              label: "א",
              text: "קדקודי המשולש ABC הם: A(8;6), B(4;0) ו־C(14;0). AD הוא הגובה לצלע BC. מצאו את אורך הצלע BC ואת אורך הגובה AD. מומלץ קודם למצוא את שיעורי הנקודה D, ואז לחשב את AD.",
              taskIds: ["D", "BC", "AD"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש ABC. רשמו קודם את הביטוי (למשל (BC×AD)/2), ואז את התוצאה.",
              taskIds: ["SABC"],
            },
          ],
          tasks: [
            {
              id: "D",
              label: "D",
              kind: "point",
              point: "D",
              missing: "both",
              twinX: "A",
              twinY: "B",
              answerX: 8,
              answerY: 0,
              optional: true,
            },
            { id: "BC", label: "BC", kind: "segment", from: "B", to: "C" },
            { id: "AD", label: "AD", kind: "segment", from: "A", to: "D" },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["B", "C"],
                ["A", "D"],
              ],
            },
          ],
        },
        {
          n: 6,
          points: [
            { label: "A", x: 5, y: 3 },
            { label: "B", x: 7, y: 0 },
            { label: "C", x: 1, y: 0 },
            { label: "H", x: 5, y: 0, hideX: true, hideY: true, drawOnly: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו קודקוד (מומלץ A), וגררו את רגל הגובה אל BC.",
            triangle: ["A", "B", "C"],
            heights: [
              {
                id: "hABC",
                from: "A",
                base: ["B", "C"],
                footLabel: "H",
                recommended: true,
              },
            ],
          },
          parts: [
            {
              label: "א",
              text: "במערכת הצירים מסומנות הנקודות A(5;3), B(7;0) ו-C(1;0). חשבו את שטח המשולש ABC. אפשר להיעזר בגובה על BC, ואז למצוא את הנקודה H ואת אורך AH.",
              taskIds: ["H", "BC", "AH", "SABC"],
            },
          ],
          tasks: [
            {
              id: "H",
              label: "H",
              kind: "point",
              point: "H",
              missing: "both",
              twinX: "A",
              twinY: "B",
              answerX: 5,
              answerY: 0,
              optional: true,
            },
            { id: "BC", label: "BC", kind: "segment", from: "B", to: "C", optional: true },
            { id: "AH", label: "AH", kind: "segment", from: "A", to: "H", optional: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["B", "C"],
                ["A", "H"],
              ],
            },
          ],
        },
        {
          n: 7,
          points: [
            { label: "A", x: 0, y: 2 },
            { label: "B", x: 3, y: 0 },
            { label: "C", x: 0, y: -4 },
            { label: "D", x: 5, y: 3 },
            { label: "E", x: 0, y: 4 },
            { label: "F", x: 0, y: 3, hideX: true, hideY: true, drawOnly: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" },
            { from: "A", to: "D" },
            { from: "D", to: "E" },
            { from: "E", to: "A" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }, { verts: ["A", "D", "E"] }],
          rightAngles: [
            { at: "O", from: "A", to: "B" },
            { at: "F", from: "D", to: "A" },
          ],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה». בסעיף א בחרו B (רגל ב־O); בסעיף ב בחרו D (רגל על AE).",
            triangles: [
              ["A", "B", "C"],
              ["A", "D", "E"],
            ],
            heights: [
              {
                id: "hBAC",
                from: "B",
                base: ["A", "C"],
                footLabel: "O",
                recommended: true,
              },
              {
                id: "hDAE",
                from: "D",
                base: ["A", "E"],
                footLabel: "F",
                recommended: true,
              },
            ],
          },
          parts: [
            {
              label: "א",
              text: "נתונות הנקודות A(0;2), B(3;0), C(0;−4), D(5;3), E(0;4) ו־O(0;0). חשבו את שטח המשולש ABC. מומלץ להוריד גובה מ־B ל־AC, למצוא את AC ואת BO, ואז את השטח.",
              taskIds: ["AC", "BO", "SABC"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש ADE. מומלץ להוריד גובה מ־D ל־AE, למצוא את הנקודה F ואת אורכי AE ו־DF, ואז את השטח.",
              taskIds: ["F", "AE", "DF", "SADE"],
            },
          ],
          tasks: [
            { id: "AC", label: "AC", kind: "segment", from: "A", to: "C", optional: true },
            { id: "BO", label: "BO", kind: "origin", point: "B", optional: true },
            {
              id: "F",
              label: "F",
              kind: "point",
              point: "F",
              missing: "both",
              twinX: "A",
              twinY: "D",
              answerX: 0,
              answerY: 3,
              optional: true,
            },
            { id: "AE", label: "AE", kind: "segment", from: "A", to: "E", optional: true },
            { id: "DF", label: "DF", kind: "segment", from: "D", to: "F", optional: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["A", "C"],
                ["B", "O"],
              ],
            },
            {
              id: "SADE",
              label: "S△ADE",
              kind: "area",
              verts: ["A", "D", "E"],
              legs: [
                ["A", "E"],
                ["D", "F"],
              ],
            },
          ],
        },
        {
          n: 8,
          points: [
            { label: "A", x: 6, y: 3 },
            { label: "B", x: 0, y: 0 },
            { label: "C", x: 4, y: 0 },
            { label: "D", x: 6, y: 0, hideX: true, hideY: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" },
            { from: "A", to: "D", dashed: true },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          rightAngles: [{ at: "D", from: "A", to: "C" }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו A, וגררו את רגל הגובה אל הישר של BC (יכולה ליפול מחוץ לקטע).",
            triangle: ["A", "B", "C"],
            heights: [
              {
                id: "hAD",
                from: "A",
                base: ["B", "C"],
                footLabel: "D",
                recommended: true,
              },
            ],
          },
          parts: [
            {
              label: "א",
              text: "ABC הוא משולש קהה-זווית שקודקודיו הם: A(6;3), B(0;0) ו־C(4;0). AD הוא הגובה לצלע BC (יכול ליפול על המשך הצלע). מצאו את אורך הצלע BC ואת אורך הגובה AD. מומלץ קודם למצוא את שיעורי הנקודה D.",
              taskIds: ["D", "BC", "AD"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש ABC. רשמו קודם את הביטוי (למשל (BC×AD)/2), ואז את התוצאה.",
              taskIds: ["SABC"],
            },
          ],
          tasks: [
            {
              id: "D",
              label: "D",
              kind: "point",
              point: "D",
              missing: "both",
              twinX: "A",
              twinY: "B",
              answerX: 6,
              answerY: 0,
              optional: true,
              outsideBase: true,
            },
            { id: "BC", label: "BC", kind: "segment", from: "B", to: "C" },
            { id: "AD", label: "AD", kind: "segment", from: "A", to: "D" },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["B", "C"],
                ["A", "D"],
              ],
            },
          ],
        },
        {
          n: 9,
          points: [
            { label: "A", x: 0, y: 8 },
            { label: "B", x: 0, y: 3 },
            { label: "C", x: 4, y: 0 },
            { label: "H", x: 0, y: 0, hideX: true, hideY: true, drawOnly: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו C. הגובה ל־AB (ציר ה־y) הוא חיצוני — הרגל על המשך הצלע.",
            triangle: ["A", "B", "C"],
            heights: [
              {
                id: "hCH",
                from: "C",
                base: ["A", "B"],
                footLabel: "H",
                recommended: true,
              },
            ],
          },
          parts: [
            {
              label: "",
              text: "נתונים שיעורי הנקודות A(0;8), B(0;3) ו־C(4;0). חשבו את שטח המשולש ABC. הגובה מ־C לצלע AB (על ציר ה־y) הוא גובה חיצוני.",
              taskIds: ["H", "AB", "CH", "SABC"],
            },
          ],
          tasks: [
            {
              id: "H",
              label: "H",
              kind: "point",
              point: "H",
              missing: "both",
              twinX: "A",
              twinY: "C",
              answerX: 0,
              answerY: 0,
              optional: true,
              outsideBase: true,
            },
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "CH", label: "CH", kind: "segment", from: "C", to: "H", optional: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["A", "B"],
                ["C", "H"],
              ],
            },
          ],
        },
        {
          n: 10,
          points: [
            { label: "A", x: 0, y: 3 },
            { label: "B", x: 0, y: -2 },
            { label: "C", x: 3, y: -4 },
            { label: "H", x: 0, y: -4, hideX: true, hideY: true, drawOnly: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו C. הגובה ל־AB (ציר ה־y) הוא חיצוני — הרגל על המשך הצלע.",
            triangle: ["A", "B", "C"],
            heights: [
              {
                id: "hCH",
                from: "C",
                base: ["A", "B"],
                footLabel: "H",
                recommended: true,
              },
            ],
          },
          parts: [
            {
              label: "",
              text: "נתונים שיעורי הנקודות A(0;3), B(0;−2) ו־C(3;−4). חשבו את שטח המשולש ABC. הגובה מ־C לצלע AB הוא גובה חיצוני.",
              taskIds: ["H", "AB", "CH", "SABC"],
            },
          ],
          tasks: [
            {
              id: "H",
              label: "H",
              kind: "point",
              point: "H",
              missing: "both",
              twinX: "A",
              twinY: "C",
              answerX: 0,
              answerY: -4,
              optional: true,
              outsideBase: true,
            },
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "CH", label: "CH", kind: "segment", from: "C", to: "H", optional: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["A", "B"],
                ["C", "H"],
              ],
            },
          ],
        },
        {
          n: 11,
          points: [
            { label: "A", x: 0, y: 2 },
            { label: "B", x: 0, y: -3 },
            { label: "C", x: -2, y: -5 },
            { label: "H", x: 0, y: -5, hideX: true, hideY: true, drawOnly: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו C. הגובה ל־AB (ציר ה־y) הוא חיצוני — הרגל על המשך הצלע.",
            triangle: ["A", "B", "C"],
            heights: [
              {
                id: "hCH",
                from: "C",
                base: ["A", "B"],
                footLabel: "H",
                recommended: true,
              },
            ],
          },
          parts: [
            {
              label: "",
              text: "נתונים שיעורי הנקודות A(0;2), B(0;−3) ו־C(−2;−5). חשבו את שטח המשולש ABC. הגובה מ־C לצלע AB הוא גובה חיצוני.",
              taskIds: ["H", "AB", "CH", "SABC"],
            },
          ],
          tasks: [
            {
              id: "H",
              label: "H",
              kind: "point",
              point: "H",
              missing: "both",
              twinX: "A",
              twinY: "C",
              answerX: 0,
              answerY: -5,
              optional: true,
              outsideBase: true,
            },
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "CH", label: "CH", kind: "segment", from: "C", to: "H", optional: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["A", "B"],
                ["C", "H"],
              ],
            },
          ],
        },
        {
          n: 12,
          points: [
            { label: "A", x: 4, y: -5 },
            { label: "B", x: 0, y: -5 },
            { label: "C", x: 0, y: -2 },
            { label: "D", x: 0, y: 3 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "A", to: "C" },
            { from: "A", to: "D" },
            { from: "B", to: "C" },
            { from: "C", to: "D" },
          ],
          polygons: [{ verts: ["A", "B", "D"] }],
          rightAngles: [{ at: "B", from: "A", to: "D" }],
          parts: [
            {
              label: "א",
              text: "נתונות הנקודות A(4;−5), B(0;−5), C(0;−2) ו־D(0;3). מצאו את שטח המשולש ABD.",
              taskIds: ["AB", "BD", "SABD"],
            },
            {
              label: "ב",
              text: "מצאו את שטח המשולש ABC.",
              taskIds: ["BC", "SABC"],
            },
            {
              label: "ג",
              text: "מצאו את שטח המשולש ACD. אפשר להיעזר בסעיפים א ו-ב: S△ACD = S△ABD − S△ABC.",
              taskIds: ["SACD"],
            },
          ],
          tasks: [
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "BD", label: "BD", kind: "segment", from: "B", to: "D", optional: true },
            { id: "BC", label: "BC", kind: "segment", from: "B", to: "C", optional: true },
            {
              id: "SABD",
              label: "S△ABD",
              kind: "area",
              verts: ["A", "B", "D"],
              legs: [
                ["B", "D"],
                ["A", "B"],
              ],
            },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["B", "C"],
                ["A", "B"],
              ],
            },
            {
              id: "SACD",
              label: "S△ACD",
              kind: "area",
              verts: ["A", "C", "D"],
              diff: { plus: ["A", "B", "D"], minus: ["A", "B", "C"] },
            },
          ],
        },
        {
          n: 13,
          points: [
            { label: "A", x: -4, y: -4 },
            { label: "B", x: 0, y: 4 },
            { label: "C", x: 0, y: -2 },
            { label: "D", x: 0, y: -4 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "A", to: "C" },
            { from: "A", to: "D" },
            { from: "B", to: "C" },
            { from: "C", to: "D" },
          ],
          polygons: [{ verts: ["A", "B", "D"] }],
          rightAngles: [{ at: "D", from: "A", to: "B" }],
          parts: [
            {
              label: "א",
              text: "נתונות הנקודות A(−4;−4), B(0;4), C(0;−2) ו־D(0;−4). מצאו את שטח המשולש ACD.",
              taskIds: ["AD", "CD", "SACD"],
            },
            {
              label: "ב",
              text: "מצאו את שטח המשולש ABD.",
              taskIds: ["BD", "SABD"],
            },
            {
              label: "ג",
              text: "מצאו את שטח המשולש ABC. אפשר להיעזר בסעיפים א ו-ב: S△ABC = S△ABD − S△ACD.",
              taskIds: ["SABC"],
            },
          ],
          tasks: [
            { id: "AD", label: "AD", kind: "segment", from: "A", to: "D", optional: true },
            { id: "CD", label: "CD", kind: "segment", from: "C", to: "D", optional: true },
            { id: "BD", label: "BD", kind: "segment", from: "B", to: "D", optional: true },
            {
              id: "SACD",
              label: "S△ACD",
              kind: "area",
              verts: ["A", "C", "D"],
              legs: [
                ["C", "D"],
                ["A", "D"],
              ],
            },
            {
              id: "SABD",
              label: "S△ABD",
              kind: "area",
              verts: ["A", "B", "D"],
              legs: [
                ["B", "D"],
                ["A", "D"],
              ],
            },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              diff: { plus: ["A", "B", "D"], minus: ["A", "C", "D"] },
            },
          ],
        },
      ],
    },
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
    },
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
    },
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
    },
    {
      id: "geo-line-mb-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "זיהוי שיפוע וגובה",
      instruction:
        "במשוואה y = mx + b: m הוא המקדם של x (השיפוע), b הוא המספר החופשי (הגובה). בתרגילים שבהם המשוואה לא מסודרת — אפשר קודם לסדר את המשוואה לצורה y = mx + b (לא חובה), ואז m ו-b. אפשר גם למצוא ישר m ו-b.",
      exercises: [
        {
          n: 1,
          line: { m: 2, b: -8, eqText: "y = 2x − 8" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = 2x − 8. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 2,
          line: { m: -4, b: 7, eqText: "y = −4x + 7" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = −4x + 7. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 3,
          line: { m: -6, b: 3, eqText: "y = 3 − 6x" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = 3 − 6x. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 4,
          line: { mn: 2, md: 5, b: -4, eqText: "y = (2/5)x − 4" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = (2/5)x − 4. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 5,
          line: { m: -1, b: 9, eqText: "y = −x + 9" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = −x + 9. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 6,
          line: { m: 2, b: 0, eqText: "y = 2x" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = 2x. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 7,
          line: { m: 1, b: 0, eqText: "y = x" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = x. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 8,
          line: { m: 0, b: 5, eqText: "y = 5" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = 5. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 10,
          line: {
            unsorted: true,
            eqText: "y + 3x = 10",
            implicit: { ax: 3, ay: 1, c: 10 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y + 3x = 10. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 11,
          line: {
            unsorted: true,
            eqText: "y − 2x + 5 = 0",
            implicit: { ax: -2, ay: 1, c: -5 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y − 2x + 5 = 0. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 12,
          line: {
            unsorted: true,
            eqText: "2x − y = 15",
            implicit: { ax: 2, ay: -1, c: 15 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 2x − y = 15. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 13,
          line: {
            unsorted: true,
            eqText: "5x − y + 7 = 0",
            implicit: { ax: 5, ay: -1, c: -7 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 5x − y + 7 = 0. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 14,
          line: {
            unsorted: true,
            eqText: "5y = 10x + 30",
            implicit: { ax: 10, ay: -5, c: -30 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 5y = 10x + 30. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 15,
          line: {
            unsorted: true,
            eqText: "3y + 12x = 6",
            implicit: { ax: 12, ay: 3, c: 6 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 3y + 12x = 6. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 16,
          line: {
            unsorted: true,
            eqText: "3y − 8x = 6",
            implicit: { ax: -8, ay: 3, c: 6 },
            mn: 8,
            md: 3,
            b: 2,
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 3y − 8x = 6. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 17,
          line: {
            unsorted: true,
            eqText: "6x − 6y = 15",
            implicit: { ax: 6, ay: -6, c: 15 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 6x − 6y = 15. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          n: 18,
          line: {
            unsorted: true,
            eqText: "5x − 4y = 23",
            implicit: { ax: 5, ay: -4, c: 23 },
            mn: 5,
            md: 4,
            b: -5.75,
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 5x − 4y = 23. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
      ],
    },
    {
          id: "geo-line-match-1",
          topic: "analytic",
          subtopic: "line",
          mode: "geo-length",
          title: "זיהוי ישר לפי משוואה",
          instruction: "בציור מופיעים ישרים (I, II, III). שייכו כל משוואה לישר המתאים ונמקו: שיפוע חיובי, שיפוע שלילי, או גובה לפי b — לפי מה שבאמת מזהה את הישר.",
          exercises: [
            {
              n: 19,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 1,
                    b: 6
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -4,
                    b: 10
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 19. בציור שני ישרים. שייכו כל משוואה לישר המתאים ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = x + 6",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −4x + 10",
                  answerKey: "II"
                }
              ]
            },
            {
              n: 20,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    mn: 1,
                    md: 2,
                    b: 8,
                    eqText: "y = (1/2)x + 8"
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    mn: -1,
                    md: 4,
                    b: 8,
                    eqText: "y = −(1/4)x + 8"
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 20. שני ישרים החותכים את ציר y באותה נקודה. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = (1/2)x + 8",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −(1/4)x + 8",
                  answerKey: "II"
                }
              ]
            },
            {
              n: 21,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -2,
                    b: -3
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 1,
                    b: 4
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 21. שייכו כל משוואה לישר I או II ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = x + 4",
                  answerKey: "II"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −2x − 3",
                  answerKey: "I"
                }
              ]
            },
            {
              n: 22,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 1,
                    b: 2
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -2,
                    b: 5
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 22. שייכו כל משוואה לישר I או II ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = x + 2",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −2x + 5",
                  answerKey: "II"
                }
              ]
            },
            {
              n: 23,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 1,
                    b: 6
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -1,
                    b: 6
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 23. שני ישרים עם אותו גובה b. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = x + 6",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −x + 6",
                  answerKey: "II"
                }
              ]
            },
            {
              n: 24,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 2,
                    b: 4
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 2,
                    b: -4
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 24. שייכו כל משוואה לישר I או II ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = 2x − 4",
                  answerKey: "II"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = 2x + 4",
                  answerKey: "I"
                }
              ]
            },
            {
              n: 25,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -3,
                    b: 5
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -3,
                    b: 2
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 25. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = −3x + 5",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −3x + 2",
                  answerKey: "II"
                }
              ]
            },
            {
              n: 26,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 3,
                    b: 2
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 5,
                    b: -4
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 26. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = 3x + 2",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = 5x − 4",
                  answerKey: "II"
                }
              ]
            },
            {
              n: 27,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -2,
                    b: 0
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -3,
                    b: -2
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 27. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = −2x",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −3x − 2",
                  answerKey: "II"
                }
              ]
            },
            {
              n: 28,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -2,
                    b: 3
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -2,
                    b: 6
                  }
                },
                {
                  key: "III",
                  label: "III",
                  line: {
                    m: 2,
                    b: 2
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 28. שלושה ישרים — שייכו כל משוואה לישר I, II או III ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = 2x + 2",
                  answerKey: "III"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −2x + 6",
                  answerKey: "II"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = −2x + 3",
                  answerKey: "I"
                }
              ]
            },
            {
              n: 29,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -1,
                    b: 4
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 3,
                    b: 4
                  }
                },
                {
                  key: "III",
                  label: "III",
                  line: {
                    m: 3,
                    b: -2
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 29. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = −x + 4",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = 3x + 4",
                  answerKey: "II"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = 3x − 2",
                  answerKey: "III"
                }
              ]
            },
            {
              n: 30,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -1,
                    b: 3
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 1,
                    b: 3
                  }
                },
                {
                  key: "III",
                  label: "III",
                  line: {
                    m: -1,
                    b: -3
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 30. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = −x + 3",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = x + 3",
                  answerKey: "II"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = −x − 3",
                  answerKey: "III"
                }
              ]
            },
            {
              n: 31,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -2,
                    b: 3
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 3,
                    b: 2
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 31. שני ישרים ושלוש משוואות — אחת מהן לא שייכת. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = 3x + 2",
                  answerKey: "II"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −2x + 3",
                  answerKey: "I"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = 3x + 3",
                  answerKey: "none"
                }
              ]
            },
            {
              n: 32,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 1,
                    b: 3
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -1,
                    b: 6
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 32. שני ישרים ושלוש משוואות — אחת מיותרת. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = −x + 6",
                  answerKey: "II"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −x + 2",
                  answerKey: "none"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = x + 3",
                  answerKey: "I"
                }
              ]
            },
            {
              n: 33,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 0.5,
                    b: 6
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -1,
                    b: 6
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "תרגיל 33. שני ישרים עם אותו b, ושלוש משוואות. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = (1/2)x + 6",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −(1/2)x + 4",
                  answerKey: "none"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = −x + 6",
                  answerKey: "II"
                }
              ]
            }
          ]
        },
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
              text: "תרגיל 20א. נתונים שני ישרים:\ny = 3x\ny = −x + 4\nמצאו את שיעורי נקודת החיתוך ביניהם (הנקודה P בציור).",
              taskIds: ["P"],
            },
          ],
          tasks: [{ id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" }],
        },
        {
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
              text: "תרגיל 20ב. נתונים שני ישרים:\ny = (1/2)x + 2\ny = −x + 8\nמצאו את שיעורי נקודת החיתוך ביניהם (הנקודה P בציור).",
              taskIds: ["P"],
            },
          ],
          tasks: [{ id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" }],
        },
        {
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
              text: "תרגיל 20ג. נתונים שני ישרים:\n2x + y = 8\nx + 3y = 19\nקודם סדרו את שתי המשוואות לצורה y = mx + b, ואז מצאו את שיעורי נקודת החיתוך (הנקודה P בציור).",
              taskIds: ["P"],
            },
          ],
          tasks: [{ id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" }],
        },
        {
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
              text: "תרגיל 20ד. נתונים שני ישרים:\n3x + 4y = 45\n3x − 2y = 9\nקודם סדרו את שתי המשוואות לצורה y = mx + b, ואז מצאו את שיעורי נקודת החיתוך (הנקודה P בציור).",
              taskIds: ["P"],
            },
          ],
          tasks: [{ id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "A" }],
        },
        {
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
              text: "תרגיל 21א. הישרים AD ו-BC הם גרפים של:\nAD: y = −2x + 22\nBC: y = x + 4\nמצאו את שיעורי הנקודות A, B, C, D ו-P (ראו ציור).",
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
              text: "תרגיל 22א. נתונים שני ישרים:\nAB: x + 2y = 10\nCD: 2x − 3y = 6\nמצאו את שיעורי הנקודות A, B, C, D ו-P. לפני חיתוך — סדרו את שתי המשוואות לצורה y = mx + b.",
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
    },
    {
      id: "geo-line-summary-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "סיכום ביניים",
      instruction: "תרגילי סיכום: שיוך משוואות לישרים, נקודות חיתוך עם צירים, חיתוך בין ישרים, אורכי קטעים, מרחקים ושטחים — באותה לוגיקה של הרמזים והצעדים שכבר למדנו.",
      exercises: [
        {
          n: 1,
          lines: [
            {
              key: "I",
              label: "I",
              line: {
                m: 3,
                b: -6,
                eqText: "y = 3x − 6"
              }
            },
            {
              key: "II",
              label: "II",
              line: {
                m: -1,
                b: 10,
                eqText: "y = −x + 10"
              }
            }
          ],
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            {
              label: "A",
              x: 0,
              y: 10,
              hideX: true,
              hideY: true
            },
            {
              label: "B",
              x: 10,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "C",
              x: 2,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "D",
              x: 0,
              y: -6,
              hideX: true,
              hideY: true
            },
            {
              label: "P",
              x: 4,
              y: 6,
              hideX: true,
              hideY: true
            },
            {
              label: "G",
              x: 4,
              y: 0,
              drawOnly: true
            }
          ],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו P, וגררו את רגל הגובה אל BC.",
            triangle: [
              "P",
              "C",
              "B"
            ],
            heights: [
              {
                id: "hPG",
                from: "P",
                base: [
                  "C",
                  "B"
                ],
                footLabel: "G",
                recommended: true
              }
            ]
          },
          parts: [
            {
              label: "א",
              text: "תרגיל 1. לפניכם שרטוט של שני ישרים I ו-II. נתונות שתי המשוואות:\n(1) y = 3x − 6\n(2) y = −x + 10\nשייכו כל משוואה לישר המתאים ונמקו.",
              taskIds: [
                "eq1",
                "eq2"
              ]
            },
            {
              label: "ב",
              text: "מצאו את שיעורי הנקודות A, B, C, D, P.",
              taskIds: [
                "A",
                "B",
                "C",
                "D",
                "P"
              ]
            },
            {
              label: "ג",
              text: "חשבו את שטח המשולש PCB.",
              taskIds: [
                "CB",
                "SPCB"
              ]
            }
          ],
          tasks: [
            {
              id: "eq1",
              kind: "lineMatch",
              eqNum: 1,
              eqText: "y = 3x − 6",
              answerKey: "I"
            },
            {
              id: "eq2",
              kind: "lineMatch",
              eqNum: 2,
              eqText: "y = −x + 10",
              answerKey: "II"
            },
            {
              id: "A",
              kind: "point",
              point: "A",
              label: "A",
              missing: "y",
              intercept: "y",
              lineKey: "II"
            },
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "x",
              intercept: "x",
              lineKey: "II"
            },
            {
              id: "C",
              kind: "point",
              point: "C",
              label: "C",
              missing: "x",
              intercept: "x",
              lineKey: "I"
            },
            {
              id: "D",
              kind: "point",
              point: "D",
              label: "D",
              missing: "y",
              intercept: "y",
              lineKey: "I"
            },
            {
              id: "P",
              kind: "lineIntersect",
              point: "P",
              label: "P",
              lineKey: "I"
            },
            {
              id: "CB",
              kind: "segment",
              from: "C",
              to: "B",
              optional: true
            },
            {
              id: "SPCB",
              label: "S△PCB",
              kind: "area",
              verts: [
                "P",
                "C",
                "B"
              ],
              legs: [
                [
                  "C",
                  "B"
                ],
                [
                  "P",
                  "G"
                ]
              ]
            }
          ]
        },
        {
          n: 2,
          lines: [
            {
              key: "L1",
              label: "ℓ₁",
              line: {
                m: 1,
                b: 2,
                eqText: "y = x + 2"
              }
            },
            {
              key: "L2",
              label: "ℓ₂",
              line: {
                mn: -1,
                md: 2,
                b: 8,
                eqText: "y = −(1/2)x + 8"
              }
            }
          ],
          showSegments: false,
          showAxisGuides: false,
          points: [
            {
              label: "A",
              x: -2,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "B",
              x: 4,
              y: 6,
              hideX: true,
              hideY: true
            },
            {
              label: "C",
              x: 16,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "G",
              x: 4,
              y: 0,
              drawOnly: true
            }
          ],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו B, וגררו את רגל הגובה אל AC.",
            triangle: [
              "A",
              "B",
              "C"
            ],
            heights: [
              {
                id: "hBG",
                from: "B",
                base: [
                  "A",
                  "C"
                ],
                footLabel: "G",
                recommended: true
              }
            ]
          },
          parts: [
            {
              label: "א",
              text: "תרגיל 2. הישר y = x + 2 והישר y = −(1/2)x + 8 יוצרים עם ציר x את המשולש ABC.\nמצאו את שיעורי קודקודי המשולש A, B, C.",
              taskIds: [
                "A",
                "B",
                "C"
              ]
            },
            {
              label: "ב",
              text: "מצאו את המרחק בין שני הקודקודים של המשולש הנמצאים על ציר x.",
              taskIds: [
                "AC"
              ]
            },
            {
              label: "ג",
              text: "מצאו את המרחק של הנקודה B מציר x.",
              taskIds: [
                "Bx"
              ]
            },
            {
              label: "ד",
              text: "חשבו את שטח המשולש ABC.",
              taskIds: [
                "SABC"
              ]
            }
          ],
          tasks: [
            {
              id: "A",
              kind: "point",
              point: "A",
              label: "A",
              missing: "x",
              intercept: "x",
              lineKey: "L1"
            },
            {
              id: "B",
              kind: "lineIntersect",
              point: "B",
              label: "B",
              lineKey: "L1"
            },
            {
              id: "C",
              kind: "point",
              point: "C",
              label: "C",
              missing: "x",
              intercept: "x",
              lineKey: "L2"
            },
            {
              id: "AC",
              kind: "segment",
              from: "A",
              to: "C"
            },
            {
              id: "Bx",
              kind: "axis",
              point: "B",
              axis: "x"
            },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: [
                "A",
                "B",
                "C"
              ],
              legs: [
                [
                  "A",
                  "C"
                ],
                [
                  "B",
                  "G"
                ]
              ]
            }
          ]
        },
        {
          n: 3,
          lines: [
            {
              key: "L1",
              label: "ℓ₁",
              line: {
                m: 1,
                b: 1,
                eqText: "y = x + 1"
              }
            },
            {
              key: "L2",
              label: "ℓ₂",
              line: {
                mn: -1,
                md: 2,
                b: 4,
                eqText: "y = −(1/2)x + 4"
              }
            }
          ],
          showSegments: false,
          showAxisGuides: false,
          points: [
            {
              label: "A",
              x: -1,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "B",
              x: 2,
              y: 3,
              hideX: true,
              hideY: true
            },
            {
              label: "C",
              x: 8,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "G",
              x: 2,
              y: 0,
              drawOnly: true
            }
          ],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו B, וגררו את רגל הגובה אל AC.",
            triangle: [
              "A",
              "B",
              "C"
            ],
            heights: [
              {
                id: "hBG",
                from: "B",
                base: [
                  "A",
                  "C"
                ],
                footLabel: "G",
                recommended: true
              }
            ]
          },
          parts: [
            {
              label: "א",
              text: "תרגיל 3. הישר y = x + 1 והישר y = −(1/2)x + 4 יוצרים עם ציר x את המשולש ABC.\nמצאו את שיעורי קודקודי המשולש A, B, C.",
              taskIds: [
                "A",
                "B",
                "C"
              ]
            },
            {
              label: "ב",
              text: "מצאו את המרחק בין שני הקודקודים של המשולש הנמצאים על ציר x.",
              taskIds: [
                "AC"
              ]
            },
            {
              label: "ג",
              text: "חשבו את שטח המשולש ABC.",
              taskIds: [
                "SABC"
              ]
            }
          ],
          tasks: [
            {
              id: "A",
              kind: "point",
              point: "A",
              label: "A",
              missing: "x",
              intercept: "x",
              lineKey: "L1"
            },
            {
              id: "B",
              kind: "lineIntersect",
              point: "B",
              label: "B",
              lineKey: "L1"
            },
            {
              id: "C",
              kind: "point",
              point: "C",
              label: "C",
              missing: "x",
              intercept: "x",
              lineKey: "L2"
            },
            {
              id: "AC",
              kind: "segment",
              from: "A",
              to: "C"
            },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: [
                "A",
                "B",
                "C"
              ],
              legs: [
                [
                  "A",
                  "C"
                ],
                [
                  "B",
                  "G"
                ]
              ]
            }
          ]
        },
        {
          n: 4,
          lines: [
            {
              key: "AB",
              label: "AB",
              line: {
                mn: 1,
                md: 2,
                b: 2,
                eqText: "y = (1/2)x + 2"
              }
            },
            {
              key: "CD",
              label: "CD",
              line: {
                m: 2,
                b: -4,
                eqText: "y = 2x − 4"
              }
            }
          ],
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            {
              label: "A",
              x: 0,
              y: 2,
              hideX: true,
              hideY: true
            },
            {
              label: "B",
              x: -4,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "C",
              x: 2,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "D",
              x: 0,
              y: -4,
              hideX: true,
              hideY: true
            },
            {
              label: "P",
              x: 4,
              y: 4,
              hideX: true,
              hideY: true
            },
            {
              label: "G",
              x: 4,
              y: 0,
              drawOnly: true
            }
          ],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו P, וגררו את רגל הגובה אל BC.",
            triangle: [
              "B",
              "P",
              "C"
            ],
            heights: [
              {
                id: "hPG",
                from: "P",
                base: [
                  "B",
                  "C"
                ],
                footLabel: "G",
                recommended: true
              }
            ]
          },
          parts: [
            {
              label: "א",
              text: "תרגיל 4. הישרים AB ו-CD הם הגרפים של הפונקציות:\n(1) y = 2x − 4\n(2) y = (1/2)x + 2\nשייכו כל משוואה לישר המתאים ונמקו.",
              taskIds: [
                "eq1",
                "eq2"
              ]
            },
            {
              label: "ב",
              text: "מצאו את שיעורי הנקודות B, C, P.",
              taskIds: [
                "B",
                "C",
                "P"
              ]
            },
            {
              label: "ג",
              text: "חשבו את שטח המשולש BPC.",
              taskIds: [
                "BC",
                "SBPC"
              ]
            }
          ],
          tasks: [
            {
              id: "eq1",
              kind: "lineMatch",
              eqNum: 1,
              eqText: "y = 2x − 4",
              answerKey: "CD"
            },
            {
              id: "eq2",
              kind: "lineMatch",
              eqNum: 2,
              eqText: "y = (1/2)x + 2",
              answerKey: "AB"
            },
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "x",
              intercept: "x",
              lineKey: "AB"
            },
            {
              id: "C",
              kind: "point",
              point: "C",
              label: "C",
              missing: "x",
              intercept: "x",
              lineKey: "CD"
            },
            {
              id: "P",
              kind: "lineIntersect",
              point: "P",
              label: "P",
              lineKey: "AB"
            },
            {
              id: "BC",
              kind: "segment",
              from: "B",
              to: "C",
              optional: true
            },
            {
              id: "SBPC",
              label: "S△BPC",
              kind: "area",
              verts: [
                "B",
                "P",
                "C"
              ],
              legs: [
                [
                  "B",
                  "C"
                ],
                [
                  "P",
                  "G"
                ]
              ]
            }
          ]
        },
        {
          n: 5,
          lines: [
            {
              key: "L1",
              label: "ℓ₁",
              line: {
                m: -2,
                b: 4,
                eqText: "y = −2x + 4"
              }
            },
            {
              key: "L2",
              label: "ℓ₂",
              line: {
                m: -1,
                b: -2,
                eqText: "y = −x − 2"
              }
            }
          ],
          showSegments: false,
          showAxisGuides: false,
          points: [
            {
              label: "A",
              x: 0,
              y: 4,
              hideX: true,
              hideY: true
            },
            {
              label: "B",
              x: 0,
              y: -2,
              hideX: true,
              hideY: true
            },
            {
              label: "C",
              x: 6,
              y: -8,
              hideX: true,
              hideY: true
            },
            {
              label: "H",
              x: 0,
              y: -8,
              drawOnly: true
            }
          ],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו C, וגררו את רגל הגובה אל AB (ציר y).",
            triangle: [
              "A",
              "B",
              "C"
            ],
            heights: [
              {
                id: "hCH",
                from: "C",
                base: [
                  "A",
                  "B"
                ],
                footLabel: "H",
                recommended: true
              }
            ]
          },
          parts: [
            {
              label: "א",
              text: "תרגיל 5. הישר y = −2x + 4 והישר y = −x − 2 יוצרים עם ציר y את המשולש ABC.\nמצאו את שיעורי קודקודי המשולש A, B, C.",
              taskIds: [
                "A",
                "B",
                "C"
              ]
            },
            {
              label: "ב",
              text: "מצאו את המרחק בין שני קודקודי המשולש הנמצאים על ציר y.",
              taskIds: [
                "AB"
              ]
            },
            {
              label: "ג",
              text: "מקודקוד C הורידו אנך (מאונך) לציר y. מצאו את אורך האנך שבין הקודקוד לבין ציר y.\n(הוסיפו את הגובה לציור עם «+ גובה», בחרו C, וגררו את הרגל אל AB.)",
              taskIds: [
                "Cy"
              ]
            },
            {
              label: "ד",
              text: "חשבו את שטח המשולש ABC.",
              taskIds: [
                "SABC"
              ]
            }
          ],
          tasks: [
            {
              id: "A",
              kind: "point",
              point: "A",
              label: "A",
              missing: "y",
              intercept: "y",
              lineKey: "L1"
            },
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "y",
              intercept: "y",
              lineKey: "L2"
            },
            {
              id: "C",
              kind: "lineIntersect",
              point: "C",
              label: "C",
              lineKey: "L1"
            },
            {
              id: "AB",
              kind: "segment",
              from: "A",
              to: "B"
            },
            {
              id: "Cy",
              kind: "axis",
              point: "C",
              axis: "y",
              drawHeight: true
            },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: [
                "A",
                "B",
                "C"
              ],
              legs: [
                [
                  "A",
                  "B"
                ],
                [
                  "C",
                  "H"
                ]
              ]
            }
          ]
        },
        {
          n: 6,
          lines: [
            {
              key: "L1",
              label: "ℓ₁",
              line: {
                m: 2,
                b: 4,
                eqText: "y = 2x + 4"
              }
            },
            {
              key: "L2",
              label: "ℓ₂",
              line: {
                mn: 1,
                md: 2,
                b: -2,
                eqText: "y = (1/2)x − 2"
              }
            }
          ],
          showSegments: false,
          showAxisGuides: false,
          points: [
            {
              label: "G",
              x: 0,
              y: 4,
              hideX: true,
              hideY: true
            },
            {
              label: "H",
              x: -4,
              y: -4,
              hideX: true,
              hideY: true
            },
            {
              label: "I",
              x: 0,
              y: -2,
              hideX: true,
              hideY: true
            },
            {
              label: "J",
              x: 0,
              y: -4,
              drawOnly: true
            }
          ],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו H, וגררו את רגל הגובה אל GI (ציר y).",
            triangle: [
              "G",
              "H",
              "I"
            ],
            heights: [
              {
                id: "hHJ",
                from: "H",
                base: [
                  "G",
                  "I"
                ],
                footLabel: "J",
                recommended: true
              }
            ]
          },
          polygons: [
            {
              verts: [
                "G",
                "H",
                "I"
              ]
            }
          ],
          parts: [
            {
              label: "א",
              text: "תרגיל 6. הישר y = 2x + 4 והישר y = (1/2)x − 2 יוצרים עם ציר y את המשולש GHI.\nמצאו את שיעורי הקודקודים G, H ו-I.",
              taskIds: [
                "G",
                "H",
                "I"
              ]
            },
            {
              label: "ב",
              text: "מצאו את המרחק בין שני קודקודי המשולש המונחים על ציר y.",
              taskIds: [
                "GI"
              ]
            },
            {
              label: "ג",
              text: "מקודקוד H הורידו אנך (מאונך) לציר y. מצאו את אורך האנך שבין הקודקוד לבין ציר y.\n(הוסיפו את הגובה לציור עם «+ גובה», בחרו H, וגררו את הרגל אל GI.)",
              taskIds: [
                "Hy"
              ]
            },
            {
              label: "ד",
              text: "חשבו את שטח המשולש GHI.",
              taskIds: [
                "SGHI"
              ]
            }
          ],
          tasks: [
            {
              id: "G",
              kind: "point",
              point: "G",
              label: "G",
              missing: "y",
              intercept: "y",
              lineKey: "L1"
            },
            {
              id: "H",
              kind: "lineIntersect",
              point: "H",
              label: "H",
              lineKey: "L1"
            },
            {
              id: "I",
              kind: "point",
              point: "I",
              label: "I",
              missing: "y",
              intercept: "y",
              lineKey: "L2"
            },
            {
              id: "GI",
              kind: "segment",
              from: "G",
              to: "I"
            },
            {
              id: "Hy",
              kind: "axis",
              point: "H",
              axis: "y",
              drawHeight: true
            },
            {
              id: "SGHI",
              label: "S△GHI",
              kind: "area",
              verts: [
                "G",
                "H",
                "I"
              ],
              legs: [
                [
                  "G",
                  "I"
                ],
                [
                  "H",
                  "J"
                ]
              ]
            }
          ]
        },
        {
          n: 7,
          lines: [
            {
              key: "I",
              label: "I",
              line: {
                m: 1,
                b: 4,
                eqText: "y = x + 4"
              }
            },
            {
              key: "II",
              label: "II",
              line: {
                m: -2,
                b: 6,
                eqText: "y = −2x + 6"
              }
            }
          ],
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            {
              label: "A",
              x: 0,
              y: 4,
              hideX: true,
              hideY: true
            },
            {
              label: "B",
              x: -4,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "C",
              x: 0,
              y: 6,
              hideX: true,
              hideY: true
            },
            {
              label: "D",
              x: 3,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "P",
              x: 0.6666666666666666,
              y: 4.666666666666667,
              hideX: true,
              hideY: true
            }
          ],
          parts: [
            {
              label: "א",
              text: "תרגיל 7. לפניכם שרטוט של שני ישרים I ו-II. נתונות שלוש משוואות:\n(1) y = x + 4\n(2) y = −2x + 6\n(3) y = 2x + 6\nלכל אחד מן הישרים I ו-II, מצאו את המשוואה המתאימה מבין (1), (2), (3) ונמקו.",
              taskIds: [
                "eq1",
                "eq2",
                "eq3"
              ]
            },
            {
              label: "ב",
              text: "מצאו את נקודות החיתוך של כל אחד משני הישרים עם הצירים.",
              taskIds: [
                "A",
                "B",
                "C",
                "D"
              ]
            },
            {
              label: "ג",
              text: "מצאו את שיעורי נקודת החיתוך של הישרים I ו-II.",
              taskIds: [
                "P"
              ]
            }
          ],
          tasks: [
            {
              id: "eq1",
              kind: "lineMatch",
              eqNum: 1,
              eqText: "y = x + 4",
              answerKey: "I"
            },
            {
              id: "eq2",
              kind: "lineMatch",
              eqNum: 2,
              eqText: "y = −2x + 6",
              answerKey: "II"
            },
            {
              id: "eq3",
              kind: "lineMatch",
              eqNum: 3,
              eqText: "y = 2x + 6",
              answerKey: "none"
            },
            {
              id: "A",
              kind: "point",
              point: "A",
              label: "A",
              missing: "y",
              intercept: "y",
              lineKey: "I"
            },
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "x",
              intercept: "x",
              lineKey: "I"
            },
            {
              id: "C",
              kind: "point",
              point: "C",
              label: "C",
              missing: "y",
              intercept: "y",
              lineKey: "II"
            },
            {
              id: "D",
              kind: "point",
              point: "D",
              label: "D",
              missing: "x",
              intercept: "x",
              lineKey: "II"
            },
            {
              id: "P",
              kind: "lineIntersect",
              point: "P",
              label: "P",
              lineKey: "I"
            }
          ]
        },
        {
          n: 8,
          lines: [
            {
              key: "I",
              label: "I",
              line: {
                m: 2,
                b: 6,
                eqText: "y = 2x + 6"
              }
            },
            {
              key: "II",
              label: "II",
              line: {
                m: -3,
                b: 11,
                eqText: "y = −3x + 11"
              }
            }
          ],
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            {
              label: "A",
              x: -3,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "B",
              x: 3.6666666666666665,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "C",
              x: 0,
              y: 6,
              hideX: true,
              hideY: true
            },
            {
              label: "D",
              x: 0,
              y: 11,
              hideX: true,
              hideY: true
            },
            {
              label: "P",
              x: 1,
              y: 8,
              hideX: true,
              hideY: true
            },
            {
              label: "G",
              x: 1,
              y: 0,
              drawOnly: true
            }
          ],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו P, וגררו את רגל הגובה אל AB (ציר x).",
            triangle: [
              "A",
              "P",
              "B"
            ],
            heights: [
              {
                id: "hPG",
                from: "P",
                base: [
                  "A",
                  "B"
                ],
                footLabel: "G",
                recommended: true
              }
            ]
          },
          polygons: [
            {
              verts: [
                "A",
                "P",
                "B"
              ]
            }
          ],
          parts: [
            {
              label: "א",
              text: "תרגיל 8. לפניכם שרטוט של שני ישרים I ו-II. נתונות שלוש משוואות:\n(1) y = 2x + 6\n(2) y = −3x + 11\n(3) y = −3x + 6\nלכל אחד מהישרים I ו-II, מצאו את המשוואה המתאימה מבין (1), (2), (3) ונמקו.",
              taskIds: [
                "eq1",
                "eq2",
                "eq3"
              ]
            },
            {
              label: "ב",
              text: "מצאו את שיעורי הנקודות A, B, C, D ו-P.",
              taskIds: [
                "A",
                "B",
                "C",
                "D",
                "P"
              ]
            },
            {
              label: "ג",
              text: "חשבו את שטח המשולש APB.",
              taskIds: [
                "AB",
                "SAPB"
              ]
            }
          ],
          tasks: [
            {
              id: "eq1",
              kind: "lineMatch",
              eqNum: 1,
              eqText: "y = 2x + 6",
              answerKey: "I"
            },
            {
              id: "eq2",
              kind: "lineMatch",
              eqNum: 2,
              eqText: "y = −3x + 11",
              answerKey: "II"
            },
            {
              id: "eq3",
              kind: "lineMatch",
              eqNum: 3,
              eqText: "y = −3x + 6",
              answerKey: "none"
            },
            {
              id: "A",
              kind: "point",
              point: "A",
              label: "A",
              missing: "x",
              intercept: "x",
              lineKey: "I"
            },
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "x",
              intercept: "x",
              lineKey: "II"
            },
            {
              id: "C",
              kind: "point",
              point: "C",
              label: "C",
              missing: "y",
              intercept: "y",
              lineKey: "I"
            },
            {
              id: "D",
              kind: "point",
              point: "D",
              label: "D",
              missing: "y",
              intercept: "y",
              lineKey: "II"
            },
            {
              id: "P",
              kind: "lineIntersect",
              point: "P",
              label: "P",
              lineKey: "I"
            },
            {
              id: "AB",
              kind: "segment",
              from: "A",
              to: "B",
              optional: true
            },
            {
              id: "SAPB",
              label: "S△APB",
              kind: "area",
              verts: [
                "A",
                "P",
                "B"
              ],
              legs: [
                [
                  "A",
                  "B"
                ],
                [
                  "P",
                  "G"
                ]
              ]
            }
          ]
        },
        {
          n: 9,
          lines: [
            {
              key: "I",
              label: "I",
              line: {
                m: -1,
                b: 4,
                eqText: "y = −x + 4"
              }
            },
            {
              key: "II",
              label: "II",
              line: {
                m: 2,
                b: 4,
                eqText: "y = 2x + 4"
              }
            }
          ],
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            {
              label: "A",
              x: 0,
              y: 4,
              hideX: true,
              hideY: true
            },
            {
              label: "B",
              x: -2,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "C",
              x: 4,
              y: 0,
              hideX: true,
              hideY: true
            }
          ],
          polygons: [
            {
              verts: [
                "A",
                "B",
                "C"
              ]
            }
          ],
          parts: [
            {
              label: "א",
              text: "תרגיל 9. לפניכם שרטוט של שני ישרים I ו-II. נתונות שלוש משוואות:\n(1) y = −x + 2\n(2) y = −x + 4\n(3) y = 2x + 4\nלכל אחד מן הישרים I ו-II, מצאו את המשוואה המתאימה מבין (1), (2), (3) ונמקו.",
              taskIds: [
                "eq1",
                "eq2",
                "eq3"
              ]
            },
            {
              label: "ב",
              text: "מצאו את שיעורי הנקודות A, B, C.",
              taskIds: [
                "A",
                "B",
                "C"
              ]
            },
            {
              label: "ג",
              text: "חשבו את שטחי המשולשים AOC ו-ABC. לשטח ABC אפשר גם S△AOC+S△AOB.",
              taskIds: [
                "OA",
                "OC",
                "SAOC",
                "BC",
                "SABC"
              ]
            }
          ],
          tasks: [
            {
              id: "eq3",
              kind: "lineMatch",
              eqNum: 1,
              eqText: "y = −x + 2",
              answerKey: "none"
            },
            {
              id: "eq1",
              kind: "lineMatch",
              eqNum: 2,
              eqText: "y = −x + 4",
              answerKey: "I"
            },
            {
              id: "eq2",
              kind: "lineMatch",
              eqNum: 3,
              eqText: "y = 2x + 4",
              answerKey: "II"
            },
            {
              id: "A",
              kind: "point",
              point: "A",
              label: "A",
              missing: "y",
              intercept: "y",
              lineKey: "I"
            },
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "x",
              intercept: "x",
              lineKey: "II"
            },
            {
              id: "C",
              kind: "point",
              point: "C",
              label: "C",
              missing: "x",
              intercept: "x",
              lineKey: "I"
            },
            {
              id: "OA",
              kind: "origin",
              point: "A",
              optional: true
            },
            {
              id: "OC",
              kind: "origin",
              point: "C",
              optional: true
            },
            {
              id: "SAOC",
              label: "S△AOC",
              kind: "area",
              verts: [
                "A",
                "O",
                "C"
              ],
              legs: [
                [
                  "O",
                  "A"
                ],
                [
                  "O",
                  "C"
                ]
              ]
            },
            {
              id: "BC",
              kind: "segment",
              from: "B",
              to: "C",
              optional: true
            },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: [
                "A",
                "B",
                "C"
              ],
              legs: [
                [
                  "B",
                  "C"
                ],
                [
                  "A",
                  "O"
                ]
              ],
              sum: {
                optional: true,
                parts: [
                  [
                    "A",
                    "O",
                    "C"
                  ],
                  [
                    "A",
                    "O",
                    "B"
                  ]
                ]
              }
            }
          ]
        },
        {
          n: 10,
          lines: [
            {
              key: "I",
              label: "I",
              line: {
                m: -2,
                b: 2,
                eqText: "y = −2x + 2"
              }
            },
            {
              key: "II",
              label: "II",
              line: {
                m: 2,
                b: -2,
                eqText: "y = 2x − 2"
              }
            },
            {
              key: "III",
              label: "III",
              line: {
                m: -2,
                b: -2,
                eqText: "y = −2x − 2"
              }
            }
          ],
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            {
              label: "A",
              x: 0,
              y: 2,
              hideX: true,
              hideY: true
            },
            {
              label: "B",
              x: 1,
              y: 0,
              hideX: true,
              hideY: true
            },
            {
              label: "C",
              x: 0,
              y: -2,
              hideX: true,
              hideY: true
            },
            {
              label: "D",
              x: -1,
              y: 0,
              hideX: true,
              hideY: true
            }
          ],
          polygons: [
            {
              verts: [
                "B",
                "O",
                "C"
              ]
            }
          ],
          parts: [
            {
              label: "א",
              text: "תרגיל 10. לפניכם שרטוט של שלושה ישרים I, II, III. נתונות שלוש משוואות:\n(1) y = −2x + 2\n(2) y = 2x − 2\n(3) y = −2x − 2\nהתאימו כל משוואה לישר I, II או III ונמקו.",
              taskIds: [
                "eq1",
                "eq2",
                "eq3"
              ]
            },
            {
              label: "ב",
              text: "מצאו את שיעורי הנקודות A, B, C, D.",
              taskIds: [
                "A",
                "B",
                "C",
                "D"
              ]
            },
            {
              label: "ג",
              text: "חשבו את שטח המשולש BOC.",
              taskIds: [
                "OB",
                "OC",
                "SBOC"
              ]
            }
          ],
          tasks: [
            {
              id: "eq1",
              kind: "lineMatch",
              eqNum: 1,
              eqText: "y = −2x + 2",
              answerKey: "I"
            },
            {
              id: "eq2",
              kind: "lineMatch",
              eqNum: 2,
              eqText: "y = 2x − 2",
              answerKey: "II"
            },
            {
              id: "eq3",
              kind: "lineMatch",
              eqNum: 3,
              eqText: "y = −2x − 2",
              answerKey: "III"
            },
            {
              id: "A",
              kind: "point",
              point: "A",
              label: "A",
              missing: "y",
              intercept: "y",
              lineKey: "I"
            },
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "x",
              intercept: "x",
              lineKey: "I"
            },
            {
              id: "C",
              kind: "point",
              point: "C",
              label: "C",
              missing: "y",
              intercept: "y",
              lineKey: "II"
            },
            {
              id: "D",
              kind: "point",
              point: "D",
              label: "D",
              missing: "x",
              intercept: "x",
              lineKey: "III"
            },
            {
              id: "OB",
              kind: "origin",
              point: "B",
              optional: true
            },
            {
              id: "OC",
              kind: "origin",
              point: "C",
              optional: true
            },
            {
              id: "SBOC",
              label: "S△BOC",
              kind: "area",
              verts: [
                "B",
                "O",
                "C"
              ],
              legs: [
                [
                  "O",
                  "B"
                ],
                [
                  "O",
                  "C"
                ]
              ]
            }
          ]
        },
        {
          n: 11,
          line: {
            m: 2,
            b: 0,
            eqText: "y = 2x"
          },
          showSegments: true,
          showAxisGuides: false,
          points: [
            {
              label: "B",
              x: 4,
              y: 0
            },
            {
              label: "P",
              x: 4,
              y: 8,
              hideX: true,
              hideY: true
            }
          ],
          segments: [
            {
              from: "B",
              to: "P"
            },
            {
              from: "O",
              to: "P"
            }
          ],
          polygons: [
            {
              verts: [
                "B",
                "O",
                "P"
              ]
            }
          ],
          parts: [
            {
              label: "א",
              text: "תרגיל 11. הישר BP מקביל לציר ה-y. משוואת הישר PO היא y = 2x. שיעורי הנקודה B הם (4;0). O — ראשית הצירים.\nמצאו את שיעור ה-x של הנקודה P.",
              taskIds: [
                "Px"
              ]
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש BOP.",
              taskIds: [
                "OB",
                "BP",
                "SBOP"
              ]
            }
          ],
          tasks: [
            {
              id: "Px",
              kind: "point",
              point: "P",
              label: "P",
              missing: "both",
              twinX: "B",
              answerX: 4,
              answerY: 8
            },
            {
              id: "OB",
              kind: "origin",
              point: "B",
              optional: true
            },
            {
              id: "BP",
              kind: "segment",
              from: "B",
              to: "P",
              optional: true
            },
            {
              id: "SBOP",
              label: "S△BOP",
              kind: "area",
              verts: [
                "B",
                "O",
                "P"
              ],
              legs: [
                [
                  "O",
                  "B"
                ],
                [
                  "B",
                  "P"
                ]
              ]
            }
          ]
        },
        {
          n: 12,
          line: {
            m: 1,
            b: -1,
            eqText: "y = x − 1"
          },
          showSegments: true,
          showAxisGuides: false,
          points: [
            {
              label: "B",
              x: 0,
              y: 3
            },
            {
              label: "A",
              x: 4,
              y: 3,
              hideX: true,
              hideY: true
            },
            {
              label: "C",
              x: 0,
              y: -1,
              hideX: true,
              hideY: true
            }
          ],
          segments: [
            {
              from: "A",
              to: "B"
            },
            {
              from: "A",
              to: "C"
            },
            {
              from: "B",
              to: "C"
            }
          ],
          polygons: [
            {
              verts: [
                "A",
                "B",
                "C"
              ]
            }
          ],
          parts: [
            {
              label: "א",
              text: "תרגיל 12. הישר AB מקביל לציר ה-x. שיעורי הנקודה B הם (0;3). דרך נקודה A עובר ישר שמשוואתו y = x − 1, החותך את ציר ה-y בנקודה C.\nמצאו את שיעורי הנקודות A ו-C.",
              taskIds: [
                "A",
                "C"
              ]
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש ABC.",
              taskIds: [
                "BC",
                "AB",
                "SABC"
              ]
            }
          ],
          tasks: [
            {
              id: "C",
              kind: "point",
              point: "C",
              label: "C",
              missing: "y",
              intercept: "y"
            },
            {
              id: "A",
              kind: "point",
              point: "A",
              label: "A",
              missing: "both",
              twinY: "B",
              answerX: 4,
              answerY: 3
            },
            {
              id: "BC",
              kind: "segment",
              from: "B",
              to: "C",
              optional: true
            },
            {
              id: "AB",
              kind: "segment",
              from: "A",
              to: "B",
              optional: true
            },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: [
                "A",
                "B",
                "C"
              ],
              legs: [
                [
                  "B",
                  "C"
                ],
                [
                  "A",
                  "B"
                ]
              ]
            }
          ]
        },
        {
          n: 13,
          line: {
            mn: 1,
            md: 2,
            b: 0,
            eqText: "y = (1/2)x"
          },
          showSegments: true,
          showAxisGuides: false,
          points: [
            {
              label: "A",
              x: -4,
              y: 3
            },
            {
              label: "B",
              x: 6,
              y: 3,
              hideX: true,
              hideY: true
            },
            {
              label: "G",
              x: 0,
              y: 3,
              drawOnly: true
            }
          ],
          segments: [
            {
              from: "O",
              to: "A"
            },
            {
              from: "O",
              to: "B"
            },
            {
              from: "A",
              to: "B"
            }
          ],
          polygons: [
            {
              verts: [
                "O",
                "A",
                "B"
              ]
            }
          ],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו O, וגררו את רגל הגובה אל AB.",
            triangle: [
              "O",
              "A",
              "B"
            ],
            heights: [
              {
                id: "hOG",
                from: "O",
                base: [
                  "A",
                  "B"
                ],
                footLabel: "G",
                recommended: true
              }
            ]
          },
          parts: [
            {
              label: "א",
              text: "תרגיל 13. הישר AB מקביל לציר ה-x. שיעורי הנקודה A הם (−4;3). O — ראשית הצירים. משוואת הישר BO היא y = (1/2)x.\nמצאו את שיעורי הנקודה B.",
              taskIds: [
                "B"
              ]
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש OAB.",
              taskIds: [
                "AB",
                "OG",
                "SOAB"
              ]
            }
          ],
          tasks: [
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "both",
              twinY: "A",
              answerX: 6,
              answerY: 3
            },
            {
              id: "AB",
              kind: "segment",
              from: "A",
              to: "B",
              optional: true
            },
            {
              id: "OG",
              kind: "origin",
              point: "G",
              optional: true
            },
            {
              id: "SOAB",
              label: "S△OAB",
              kind: "area",
              verts: [
                "O",
                "A",
                "B"
              ],
              legs: [
                [
                  "A",
                  "B"
                ],
                [
                  "O",
                  "G"
                ]
              ],
              sum: {
                optional: true,
                parts: [
                  [
                    "O",
                    "A",
                    "G"
                  ],
                  [
                    "O",
                    "B",
                    "G"
                  ]
                ]
              }
            }
          ]
        },
        {
          n: 14,
          line: {
            m: 1,
            b: 0,
            eqText: "y = x"
          },
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 2, y: 5 },
            { label: "B", x: 5, y: 5, hideX: true, hideY: true },
            { label: "C", x: 0, y: 0 },
            { label: "H", x: 0, y: 5, drawOnly: true }
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" }
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          rightAngles: [{ at: "H", from: "C", to: "A" }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו C, וגררו את רגל הגובה אל הישר של AB (יכולה ליפול מחוץ לקטע).",
            triangle: ["A", "B", "C"],
            heights: [
              {
                id: "hCH",
                from: "C",
                base: ["A", "B"],
                footLabel: "H",
                recommended: true
              }
            ]
          },
          parts: [
            {
              label: "א",
              text: "תרגיל 14. במשולש ABC נתון: A(2;5). C — ראשית הצירים. הצלע BC מונחת על הישר y = x והצלע AB מקבילה לציר ה-x.\nמצאו את שיעורי הקודקוד B.",
              taskIds: ["B"]
            },
            {
              label: "ב",
              text: "חשבו את אורך הצלע AB.",
              taskIds: ["AB"]
            },
            {
              label: "ג",
              text: "מצאו את אורך הגובה לצלע AB.",
              taskIds: ["CH"]
            },
            {
              label: "ד",
              text: "חשבו את שטח המשולש ABC.",
              taskIds: ["SABC"]
            }
          ],
          tasks: [
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "both",
              twinY: "A",
              answerX: 5,
              answerY: 5
            },
            {
              id: "AB",
              kind: "segment",
              from: "A",
              to: "B"
            },
            {
              id: "CH",
              kind: "segment",
              from: "C",
              to: "H"
            },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["A", "B"],
                ["C", "H"]
              ]
            }
          ]
        },
        {
          n: 15,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 0, y: 0 },
            { label: "B", x: 3, y: 6, hideX: true, hideY: true },
            { label: "C", x: 9, y: 6 },
            { label: "E", x: 3, y: 2 },
            { label: "H", x: 3, y: 0, drawOnly: true }
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" },
            { from: "B", to: "E", dashed: true }
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          rightAngles: [{ at: "H", from: "A", to: "E" }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו A, וגררו את רגל הגובה אל הישר של BE (יכולה ליפול מחוץ לקטע).",
            triangle: ["A", "B", "E"],
            heights: [
              {
                id: "hAH",
                from: "A",
                base: ["B", "E"],
                footLabel: "H",
                recommended: true
              }
            ]
          },
          parts: [
            {
              label: "א",
              text: "תרגיל 15. במשולש ABC נתון: A(0;0), C(9;6). הצלע BC מקבילה לציר ה-x. דרך הקודקוד B עובר ישר המקביל לציר ה-y והחותך את הצלע AC בנקודה E. שיעורי הנקודה E הם (3;2).\nמצאו את שיעורי הקודקוד B.",
              taskIds: ["B"]
            },
            {
              label: "ב",
              text: "חשבו את אורך הקטע BE.",
              taskIds: ["BE"]
            },
            {
              label: "ג",
              text: "חשבו את שטח המשולש ABE.",
              taskIds: ["AH", "SABE"]
            }
          ],
          tasks: [
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "both",
              twinX: "E",
              twinY: "C",
              answerX: 3,
              answerY: 6
            },
            {
              id: "BE",
              kind: "segment",
              from: "B",
              to: "E"
            },
            {
              id: "AH",
              kind: "segment",
              from: "A",
              to: "H",
              optional: true
            },
            {
              id: "SABE",
              label: "S△ABE",
              kind: "area",
              verts: ["A", "B", "E"],
              legs: [
                ["B", "E"],
                ["A", "H"]
              ]
            }
          ]
        },
        {
          n: 16,
          givenText: "AOB משולש ישר-זווית ב־O. A(0;4). שטח המשולש 10",
          givenArea: { verts: ["A", "O", "B"], value: 10, label: "S△AOB" },
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 0, y: 4 },
            { label: "B", x: 5, y: 0, hideX: true, hideY: true }
          ],
          segments: [
            { from: "O", to: "A" },
            { from: "O", to: "B" },
            { from: "A", to: "B" }
          ],
          polygons: [{ verts: ["A", "O", "B"] }],
          rightAngles: [{ at: "O", from: "A", to: "B" }],
          parts: [
            {
              label: "א",
              text: "תרגיל 16. AOB משולש ישר-זווית בראשית הצירים. שיעורי הנקודה A הם (0;4). שטח המשולש 10.\nמצאו את אורך הצלע AO.",
              taskIds: ["OA"]
            },
            {
              label: "ב",
              text: "מצאו את אורך הצלע OB ואת שיעורי הנקודה B.",
              taskIds: ["OB", "B"]
            }
          ],
          tasks: [
            { id: "OA", kind: "origin", point: "A" },
            {
              id: "OB",
              kind: "origin",
              point: "B",
              fromArea: {
                label: "S△AOB",
                verts: ["A", "O", "B"],
                value: 10,
                legs: [
                  ["B", "O"],
                  ["A", "O"]
                ],
                unknown: ["B", "O"]
              }
            },
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "both",
              intercept: "x",
              answerX: 5,
              answerY: 0
            }
          ]
        },
        {
          n: 17,
          givenText: "AB מקביל לציר ה-y. AO=4. שטח המשולש ABO הוא 20",
          givenArea: { verts: ["A", "B", "O"], value: 20, label: "S△ABO" },
          givenLengths: [{ from: "A", to: "O", len: 4 }],
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 4, y: 0, hideX: true, hideY: true },
            { label: "B", x: 4, y: 10, hideX: true, hideY: true }
          ],
          segments: [
            { from: "O", to: "A" },
            { from: "A", to: "B" },
            { from: "B", to: "O" }
          ],
          polygons: [{ verts: ["A", "B", "O"] }],
          rightAngles: [{ at: "A", from: "O", to: "B" }],
          parts: [
            {
              label: "א",
              text: "תרגיל 17. הצלע AB מקבילה לציר ה-y. אורך הקטע AO הוא 4. שטח המשולש ABO הוא 20.\nמצאו את אורך הקטע AB.",
              taskIds: ["AB"]
            },
            {
              label: "ב",
              text: "הנקודה A נמצאת על ציר ה-x. מצאו את שיעורי הנקודות A ו־B.",
              taskIds: ["A", "B"]
            }
          ],
          tasks: [
            {
              id: "AB",
              kind: "segment",
              from: "A",
              to: "B",
              fromArea: {
                label: "S△ABO",
                verts: ["A", "B", "O"],
                value: 20,
                legs: [
                  ["A", "B"],
                  ["A", "O"]
                ],
                unknown: ["A", "B"]
              }
            },
            {
              id: "A",
              kind: "point",
              point: "A",
              label: "A",
              missing: "both",
              intercept: "x",
              answerX: 4,
              answerY: 0
            },
            {
              id: "B",
              kind: "point",
              point: "B",
              label: "B",
              missing: "both",
              twinX: "A",
              answerX: 4,
              answerY: 10
            }
          ]
        }
      ],
    },
    {
      id: "geo-line-eq-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "משוואת ישר",
      instruction:
        "דרך האתר: הציבו בנוסחה y − y₁ = m(x − x₁) והביאו למצב y = mx + b (פתיחת סוגריים והעברת אגפים). אפשר גם להציב את הנקודה ב־y = mx + b ולמצוא את b. כל צעד שקול מתקבל; אפשר גם לרשום ישר את המשוואה.",
      exercises: [
        {
          n: 1,
          line: { m: 2, b: -2 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "A(3;4), m = 2",
          points: [{ label: "A", x: 3, y: 4 }],
          parts: [
            {
              label: "",
              text: "בציור מתואר ישר העובר דרך הנקודה A(3;4). שיפוע הישר הוא 2. מצאו את משוואת הישר.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: 3, y: 4, m: 2, label: "ישר" }],
        },
        {
          n: 2,
          line: { m: -3, b: 13 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(2;7), m = −3",
          points: [{ label: "A", x: 2, y: 7 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (2;7) ושיפועו −3.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: 2, y: 7, m: -3, label: "ישר" }],
        },
        {
          n: 3,
          line: { m: 4, b: -8 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(2;0), m = 4",
          points: [{ label: "A", x: 2, y: 0 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (2;0) ושיפועו m = 4.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: 2, y: 0, m: 4, label: "ישר" }],
        },
        {
          n: 4,
          line: { m: 1, b: -5 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(3;−2), m = 1",
          points: [{ label: "A", x: 3, y: -2 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (3;−2) ושיפועו m = 1.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: 3, y: -2, m: 1, label: "ישר" }],
        },
        {
          n: 5,
          line: { m: -2, b: -7 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(−5;3), m = −2",
          points: [{ label: "A", x: -5, y: 3 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (−5;3) ושיפועו m = −2.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: -5, y: 3, m: -2, label: "ישר" }],
        },
        {
          n: 6,
          line: { m: 6, b: 14 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(−3;−4), m = 6",
          points: [{ label: "A", x: -3, y: -4 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (−3;−4) ושיפועו m = 6.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: -3, y: -4, m: 6, label: "ישר" }],
        },
        {
          n: 7,
          line: { m: -1, b: -9 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(−6;−3), m = −1",
          points: [{ label: "A", x: -6, y: -3 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (−6;−3) ושיפועו m = −1.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: -6, y: -3, m: -1, label: "ישר" }],
        },
        {
          n: 8,
          line: { m: 0, b: -4 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(−5;−4), m = 0",
          points: [{ label: "A", x: -5, y: -4 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (−5;−4) ושיפועו m = 0.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: -5, y: -4, m: 0, label: "ישר" }],
        },
        {
          n: 9,
          line: { mn: 1, md: 2, b: 3 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(2;4), m = 1/2",
          points: [{ label: "A", x: 2, y: 4 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (2;4) ושיפועו m = 1/2.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: 2, y: 4, mn: 1, md: 2, label: "ישר" }],
        },
        {
          n: 10,
          line: { mn: -2, md: 3, b: -23 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(−6;−19), m = −2/3",
          points: [{ label: "A", x: -6, y: -19 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (−6;−19) ושיפועו m = −2/3.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: -6, y: -19, mn: -2, md: 3, label: "ישר" }],
        },
        {
          n: 11,
          line: { mn: 4, md: 7, b: 41 / 7 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(9;11), m = 4/7",
          points: [{ label: "A", x: 9, y: 11 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (9;11) ושיפועו m = 4/7.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: 9, y: 11, mn: 4, md: 7, label: "ישר" }],
        },
        {
          n: 12,
          line: { mn: 3, md: 2, b: 0 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(6;9), m = 3/2",
          points: [{ label: "A", x: 6, y: 9 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (6;9) ושיפועו m = 3/2.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: 6, y: 9, mn: 3, md: 2, label: "ישר" }],
        },
        {
          n: 13,
          line: { mn: 11, md: 5, b: 9 / 5 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(1;4), m = 11/5",
          points: [{ label: "A", x: 1, y: 4 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (1;4) ושיפועו m = 11/5.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: 1, y: 4, mn: 11, md: 5, label: "ישר" }],
        },
        {
          n: 14,
          line: { mn: -4, md: 3, b: 0 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(0;0), m = −4/3",
          points: [{ label: "A", x: 0, y: 0 }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר העובר דרך הנקודה (0;0) ושיפועו m = −4/3.",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", point: "A", x: 0, y: 0, mn: -4, md: 3, label: "ישר" }],
        },
        {
          n: 15,
          line: { m: -2, b: 13 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(3;7), m = −2",
          points: [
            { label: "A", x: 3, y: 7 },
            { label: "B", x: 2, y: 10 },
          ],
          parts: [
            {
              label: "א",
              text: "רשמו את משוואת הישר העובר דרך הנקודה (3;7) ושיפועו −2.",
              taskIds: ["eq"],
            },
            {
              label: "ב",
              text: "האם הנקודה (2;10) נמצאת על הישר שמצאתם בסעיף א? נמקו. הציבו ובדקו אם האגפים שווים, ואז ענו כן או לא.",
              taskIds: ["B"],
            },
          ],
          tasks: [
            { id: "eq", kind: "lineEq", point: "A", x: 3, y: 7, m: -2, label: "ישר" },
            {
              id: "B",
              label: "B",
              kind: "onLine",
              point: "B",
              x: 2,
              y: 10,
              on: false,
              askYesNo: true,
              reason: "10 ≠ −2·2 + 13, לכן B לא על הישר.",
            },
          ],
        },
        {
          n: 16,
          line: { m: 2, b: -2 },
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          givenText: "(3;4), m = 2",
          points: [
            { label: "A", x: 3, y: 4 },
            { label: "B", x: -12, y: -22 },
            { label: "C", x: 0, y: 2 },
            { label: "D", x: 8, y: 14 },
          ],
          parts: [
            {
              label: "א",
              text: "רשמו את משוואת הישר ששיפועו 2 והוא עובר דרך הנקודה (3;4).",
              taskIds: ["eq"],
            },
            {
              label: "ב",
              text: "רק אחת מהנקודות B(−12;−22), C(0;2), D(8;14) נמצאת על הישר שמצאתם בסעיף א. לכל נקודה הציבו, חשבו וענו כן או לא.",
              taskIds: ["B", "C", "D"],
            },
          ],
          tasks: [
            { id: "eq", kind: "lineEq", point: "A", x: 3, y: 4, m: 2, label: "ישר" },
            {
              id: "B",
              label: "B",
              kind: "onLine",
              point: "B",
              x: -12,
              y: -22,
              on: false,
              askYesNo: true,
              reason: "−22 ≠ 2·(−12) − 2, לכן B לא על הישר.",
            },
            {
              id: "C",
              label: "C",
              kind: "onLine",
              point: "C",
              x: 0,
              y: 2,
              on: false,
              askYesNo: true,
              reason: "2 ≠ 2·0 − 2, לכן C לא על הישר.",
            },
            {
              id: "D",
              label: "D",
              kind: "onLine",
              point: "D",
              x: 8,
              y: 14,
              on: true,
              askYesNo: true,
              reason: "14 = 2·8 − 2, לכן D על הישר.",
            },
          ],
        },
        {
          n: 17,
          line: { m: 1, b: 9, eqText: "y = x + 9" },
          extraLines: [{ m: 2, b: 9, dashed: true, hideEq: true }],
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          givenText: "y = x + 9, A על ציר y; ישר מקווקו דרך A, m = 2",
          points: [{ label: "A", x: 0, y: 9, hideY: true }],
          parts: [
            {
              label: "א",
              text: "הישר y = x + 9 חותך את ציר y בנקודה A. מצאו את שיעורי נקודה A.",
              taskIds: ["A"],
            },
            {
              label: "ב",
              text: "הישר המקווקו בציור עובר דרך נקודה A ושיפועו 2. מצאו את משוואת הישר המקווקו.",
              taskIds: ["eq"],
            },
            {
              label: "ג",
              text: "הראו בהצבה שהישר המקווקו עובר דרך הנקודה (−2;5). הציבו, חשבו וענו כן או לא.",
              taskIds: ["P"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y" },
            { id: "eq", kind: "lineEq", point: "A", x: 0, y: 9, m: 2, label: "ישר" },
            {
              id: "P",
              label: "P",
              kind: "onLine",
              point: "P",
              x: -2,
              y: 5,
              on: true,
              askYesNo: true,
              line: { m: 2, b: 9 },
              reason: "5 = 2·(−2) + 9, לכן P על הישר.",
            },
          ],
        },
        {
          n: 18,
          hideGiven: true,
          line: { m: 1, b: -8, eqText: "y = x − 8" },
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 8, y: 0, hideX: true },
            { label: "P", x: 0, y: 5, hideY: true },
          ],
          parts: [
            {
              label: "א",
              line: { m: 1, b: -8, eqText: "y = x − 8" },
              extraLines: [{ m: 4, b: -32, dashed: true, hideEq: true }],
              points: [{ label: "A", x: 8, y: 0, hideX: true }],
              text: "הישר y = x − 8 חותך את ציר x בנקודה A. מצאו את שיעורי נקודה A, ואז את משוואת הישר העובר דרך A ושיפועו 4.",
              taskIds: ["A", "eqA"],
            },
            {
              label: "ב",
              line: { m: -2, b: 5, eqText: "y = −2x + 5" },
              extraLines: [{ m: -6, b: 5, dashed: true, hideEq: true }],
              points: [{ label: "P", x: 0, y: 5, hideY: true }],
              text: "הישר y = −2x + 5 חותך את ציר y בנקודה P. מצאו את שיעורי נקודה P, ואז את משוואת הישר העובר דרך P ושיפועו −6.",
              taskIds: ["P", "eqP"],
            },
          ],
          tasks: [
            {
              id: "A",
              label: "A",
              kind: "point",
              point: "A",
              missing: "x",
              intercept: "x",
              line: { m: 1, b: -8 },
            },
            { id: "eqA", kind: "lineEq", point: "A", x: 8, y: 0, m: 4, label: "ישר" },
            {
              id: "P",
              label: "P",
              kind: "point",
              point: "P",
              missing: "y",
              intercept: "y",
              line: { m: -2, b: 5 },
            },
            { id: "eqP", kind: "lineEq", point: "P", x: 0, y: 5, m: -6, label: "ישר" },
          ],
        },
        {
          n: 19,
          line: { m: 5, b: -20 },
          lines: [
            { key: "L", label: "ℓ", line: { m: 5, b: -20, hideEq: true } },
            { key: "AO", label: "AO", line: { m: 1, b: 0, eqText: "y = x" } },
          ],
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          givenText: "ℓ דרך (3;−5), m = 5",
          points: [
            { label: "G", x: 3, y: -5 },
            { label: "A", x: 5, y: 5, hideX: true, hideY: true },
            { label: "B", x: 4, y: 0, hideX: true },
            { label: "H", x: 5, y: 0, hideX: true, hideY: true, drawOnly: true },
          ],
          segments: [
            { from: "A", to: "O" },
            { from: "O", to: "B" },
            { from: "A", to: "B" },
          ],
          polygons: [{ verts: ["A", "O", "B"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו A, וגררו את רגל הגובה אל ציר x (המשך של OB).",
            triangle: ["A", "O", "B"],
            heights: [
              {
                id: "hAH",
                from: "A",
                base: ["O", "B"],
                footLabel: "H",
                recommended: true,
              },
            ],
          },
          parts: [
            {
              label: "א",
              text: "הישר ℓ עובר דרך הנקודה (3;−5) ושיפועו 5. מצאו את משוואת הישר ℓ.",
              taskIds: ["eq"],
            },
            {
              label: "ב",
              text: "הישר ℓ חותך את הישר y = x בנקודה A. מצאו את שיעורי נקודה A.",
              taskIds: ["A"],
            },
            {
              label: "ג",
              text: "הישר ℓ חותך את ציר x בנקודה B. מצאו את שיעורי נקודה B.",
              taskIds: ["B"],
            },
            {
              label: "ד",
              text: "חשבו את שטח המשולש AOB (O ראשית הצירים). אפשר להיעזר בבסיס OB ובגובה מ־A לציר x.",
              taskIds: ["OB", "AH", "SAOB"],
            },
          ],
          tasks: [
            { id: "eq", kind: "lineEq", point: "G", x: 3, y: -5, m: 5, label: "ℓ" },
            { id: "A", kind: "lineIntersect", point: "A", label: "A", lineKey: "L" },
            {
              id: "B",
              label: "B",
              kind: "point",
              point: "B",
              missing: "x",
              intercept: "x",
              lineKey: "L",
            },
            { id: "OB", kind: "segment", from: "O", to: "B", optional: true },
            {
              id: "AH",
              kind: "segment",
              from: "A",
              to: "H",
              optional: true,
              drawHeight: true,
            },
            {
              id: "SAOB",
              label: "S△AOB",
              kind: "area",
              verts: ["A", "O", "B"],
              legs: [
                ["O", "B"],
                ["A", "H"],
              ],
            },
          ],
        },
        {
          n: 20,
          lines: [
            { key: "L1", label: "", line: { m: 5, b: -6, eqText: "y = 5x − 6" } },
            { key: "L2", label: "", line: { m: -1, b: 6, eqText: "y = −x + 6" } },
          ],
          extraLines: [{ m: 3, b: -2, dashed: true, hideEq: true }],
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          givenText: "y = 5x − 6, y = −x + 6; נחתכים ב־P",
          points: [{ label: "P", x: 2, y: 4, hideX: true, hideY: true }],
          parts: [
            {
              label: "א",
              text: "נתונות משוואות של שני ישרים y = 5x − 6 ו־y = −x + 6. הישרים נחתכים בנקודה P. מצאו את שיעורי הנקודה P.",
              taskIds: ["P"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר העובר דרך הנקודה P ושיפועו 3.",
              taskIds: ["eq"],
            },
            {
              label: "ג",
              extraLines: [
                { m: 3, b: -2, dashed: true, hideEq: true },
                { m: 2, b: -3, eqText: "y = 2x − 3", dashed: true },
              ],
              text: "האם הישר שמשוואתו y = 2x − 3 עובר דרך הנקודה P? הציבו, חשבו וענו כן או לא, ונמקו.",
              taskIds: ["chk"],
            },
          ],
          tasks: [
            { id: "P", kind: "lineIntersect", point: "P", label: "P" },
            { id: "eq", kind: "lineEq", point: "P", x: 2, y: 4, m: 3, label: "ישר" },
            {
              id: "chk",
              label: "P",
              kind: "onLine",
              point: "P",
              x: 2,
              y: 4,
              on: false,
              askYesNo: true,
              line: { m: 2, b: -3 },
              reason: "4 ≠ 2·2 − 3, לכן P לא על הישר.",
            },
          ],
        },
        {
          n: 21,
          lines: [
            { key: "L1", label: "", line: { m: 1, b: 6, eqText: "y = x + 6" } },
            { key: "L2", label: "", line: { m: -1, b: 10, eqText: "y = −x + 10" } },
          ],
          extraLines: [{ m: 6, b: -4, dashed: true, hideEq: true }],
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          givenText: "y = x + 6, y = −x + 10; ישר דרך החיתוך, m = 6",
          points: [{ label: "P", x: 2, y: 8, hideX: true, hideY: true }],
          parts: [
            {
              label: "",
              text: "מצאו את משוואת הישר ששיפועו 6, והוא עובר בנקודת החיתוך של הישרים y = x + 6 ו־y = −x + 10.",
              taskIds: ["P", "eq"],
            },
          ],
          tasks: [
            { id: "P", kind: "lineIntersect", point: "P", label: "P" },
            { id: "eq", kind: "lineEq", point: "P", x: 2, y: 8, m: 6, label: "ישר" },
          ],
        },
        {
          n: 22,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          givenText: "A(4;8); שיפוע AB = 2, שיפוע AC = −7; BC: y = −x + 6",
          lines: [
            { key: "AB", label: "", line: { m: 2, b: 0, hideEq: true, dashed: true } },
            { key: "AC", label: "", line: { m: -7, b: 36, hideEq: true, dashed: true } },
            { key: "BC", label: "", line: { m: -1, b: 6, eqText: "y = −x + 6" } },
          ],
          points: [
            { label: "A", x: 4, y: 8 },
            { label: "B", x: 2, y: 4, hideX: true, hideY: true },
            { label: "C", x: 5, y: 1, hideX: true, hideY: true },
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
              text: "במשולש ABC קדקוד A הוא בנקודה A(4;8). שיפוע הצלע AB הוא 2. מצאו את משוואת הצלע AB.",
              taskIds: ["eqAB"],
            },
            {
              label: "ב",
              text: "שיפוע הצלע AC הוא −7. מצאו את משוואת הצלע AC.",
              taskIds: ["eqAC"],
            },
            {
              label: "ג",
              text: "משוואת הצלע BC היא y = −x + 6. מצאו את שיעורי הקדקודים B ו־C.",
              taskIds: ["B", "C"],
            },
          ],
          tasks: [
            { id: "eqAB", kind: "lineEq", point: "A", x: 4, y: 8, m: 2, label: "AB" },
            { id: "eqAC", kind: "lineEq", point: "A", x: 4, y: 8, m: -7, label: "AC" },
            {
              id: "B",
              kind: "lineIntersect",
              point: "B",
              label: "B",
              answerX: 2,
              answerY: 4,
            },
            {
              id: "C",
              kind: "lineIntersect",
              point: "C",
              label: "C",
              answerX: 5,
              answerY: 1,
            },
          ],
        },
        {
          n: 23,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          givenText: "AB: y = −2x + 8; A על ציר y; שיעור ה־x של B הוא 2; שיפוע הצלע AC הוא 3, שיפוע הצלע BC הוא 1",
          extraLines: [{ m: -2, b: 8, eqText: "y = −2x + 8" }],
          lines: [
            { key: "AC", label: "", line: { m: 3, b: 8, hideEq: true, dashed: true } },
            { key: "BC", label: "", line: { m: 1, b: 2, hideEq: true, dashed: true } },
          ],
          points: [
            { label: "A", x: 0, y: 8, hideY: true },
            { label: "B", x: 2, y: 4, hideY: true },
            { label: "C", x: -3, y: -1, hideX: true, hideY: true },
            { label: "D", x: 0, y: 2, hideY: true },
            { label: "H", x: 0, y: 4, hideX: true, hideY: true, drawOnly: true },
            { label: "E", x: 0, y: -1, hideX: true, hideY: true, drawOnly: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "A", to: "C" },
            { from: "B", to: "C" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו קודקוד, וגררו את רגל הגובה אל ציר y (המשך של AD).",
            triangle: ["A", "B", "C"],
            heights: [
              { id: "hBH", from: "B", base: ["A", "D"], footLabel: "H", recommended: true },
              { id: "hCE", from: "C", base: ["A", "D"], footLabel: "E", recommended: true },
            ],
          },
          parts: [
            {
              label: "א",
              text: "במשולש ABC משוואת הצלע AB היא y = −2x + 8. קדקוד A נמצא על ציר y, ושיעור ה־x של קדקוד B הוא 2. מצאו את שיעורי הקדקודים A ו־B.",
              taskIds: ["A", "B"],
            },
            {
              label: "ב",
              text: "שיפוע הצלע AC הוא 3 ושיפוע הצלע BC הוא 1. מצאו את משוואות הצלעות, ואז את שיעורי הנקודה C.",
              taskIds: ["eqAC", "eqBC", "C"],
            },
            {
              label: "ג",
              text: "הצלע BC חותכת את ציר y בנקודה D. מצאו את D, ואז חשבו את שטח המשולשים ABD, ACD ו־ABC.",
              taskIds: ["D", "AD", "BH", "SABD", "CE", "SACD", "SABC"],
            },
          ],
          tasks: [
            {
              id: "A",
              label: "A",
              kind: "point",
              point: "A",
              missing: "y",
              intercept: "y",
              line: { m: -2, b: 8 },
            },
            {
              id: "B",
              label: "B",
              kind: "point",
              point: "B",
              missing: "y",
              line: { m: -2, b: 8 },
            },
            { id: "eqAC", kind: "lineEq", point: "A", x: 0, y: 8, m: 3, label: "AC" },
            { id: "eqBC", kind: "lineEq", point: "B", x: 2, y: 4, m: 1, label: "BC" },
            {
              id: "C",
              kind: "lineIntersect",
              point: "C",
              label: "C",
              answerX: -3,
              answerY: -1,
            },
            {
              id: "D",
              label: "D",
              kind: "point",
              point: "D",
              missing: "y",
              intercept: "y",
              line: { m: 1, b: 2 },
            },
            { id: "AD", kind: "segment", from: "A", to: "D", optional: true },
            {
              id: "BH",
              kind: "segment",
              from: "B",
              to: "H",
              optional: true,
              drawHeight: true,
            },
            {
              id: "CE",
              kind: "segment",
              from: "C",
              to: "E",
              optional: true,
              drawHeight: true,
              outsideBase: true,
            },
            {
              id: "SABD",
              label: "S△ABD",
              kind: "area",
              verts: ["A", "B", "D"],
              legs: [
                ["A", "D"],
                ["B", "H"],
              ],
            },
            {
              id: "SACD",
              label: "S△ACD",
              kind: "area",
              verts: ["A", "C", "D"],
              legs: [
                ["A", "D"],
                ["C", "E"],
              ],
            },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              sum: {
                parts: [
                  ["A", "B", "D"],
                  ["A", "C", "D"],
                ],
              },
            },
          ],
        },
      ],
    },
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
    },
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
    },
    {
      id: "geo-perp-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "ישרים מאונכים",
      instruction:
        "ישרים מאונכים: מכפלת השיפועים היא −1. אם המשוואה לא ב־y = mx + b — סדרו קודם. אחר כך ענו כן או לא, או מצאו את השיפוע המאונך ואז את משוואת הישר.",
      exercises: [
        {
          n: 1,
          showBoard: false,
          hideGiven: true,
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          parts: [
            {
              text: "נתונים שיפועים של שני ישרים: m₁ = −7, m₂ = 1/7. קבעו אם הישרים מאונכים זה לזה.",
              taskIds: ["perp"],
            },
          ],
          tasks: [
            {
              id: "perp",
              kind: "perpendicular",
              m1: -7,
              m2: 1 / 7,
              answer: true,
              reason: "מכפלת השיפועים (−7)·(1/7) = −1 — הישרים מאונכים.",
            },
          ],
        },
        {
          n: 2,
          showBoard: false,
          hideGiven: true,
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          parts: [
            {
              text: "נתונים שיפועים של שני ישרים: m₁ = 4, m₂ = 1/4. קבעו אם הישרים מאונכים זה לזה.",
              taskIds: ["perp"],
            },
          ],
          tasks: [
            {
              id: "perp",
              kind: "perpendicular",
              m1: 4,
              m2: 1 / 4,
              answer: false,
              reason: "מכפלת השיפועים 4·(1/4) = 1 ≠ −1 — הישרים לא מאונכים.",
            },
          ],
        },
        {
          n: 3,
          showBoard: false,
          hideGiven: true,
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          parts: [
            {
              text: "נתונים שיפועים של שני ישרים: m₁ = 1, m₂ = −1. קבעו אם הישרים מאונכים זה לזה.",
              taskIds: ["perp"],
            },
          ],
          tasks: [
            {
              id: "perp",
              kind: "perpendicular",
              m1: 1,
              m2: -1,
              answer: true,
              reason: "מכפלת השיפועים 1·(−1) = −1 — הישרים מאונכים.",
            },
          ],
        },
        {
          n: 4,
          showBoard: false,
          hideGiven: true,
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          parts: [
            {
              text: "נתונים שיפועים של שני ישרים: m₁ = 4½, m₂ = −2/9. קבעו אם הישרים מאונכים זה לזה.",
              taskIds: ["perp"],
            },
          ],
          tasks: [
            {
              id: "perp",
              kind: "perpendicular",
              m1: 9 / 2,
              m2: -2 / 9,
              answer: true,
              reason: "מכפלת השיפועים (9/2)·(−2/9) = −1 — הישרים מאונכים.",
            },
          ],
        },
        {
          n: 5,
          showBoard: false,
          hideGiven: true,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: 5, b: -3, eqText: "y = 5x − 3" } },
            { key: "L2", line: { m: 0.2, mn: 1, md: 5, b: 3, eqText: "y = (1/5)x + 3" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים y = 5x − 3 ו־y = (1/5)x + 3 מאונכים זה לזה.",
              taskIds: ["perp"],
            },
          ],
          tasks: [
            {
              id: "perp",
              kind: "perpendicular",
              answer: false,
              reason: "מכפלת השיפועים 5·(1/5) = 1 ≠ −1 — הישרים לא מאונכים.",
            },
          ],
        },
        {
          n: 6,
          showBoard: false,
          hideGiven: true,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: 5 / 7, mn: 5, md: 7, b: 3, eqText: "y = (5/7)x + 3" } },
            { key: "L2", line: { m: -7 / 5, mn: -7, md: 5, b: -4, eqText: "y = −(7/5)x − 4" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים y = (5/7)x + 3 ו־y = −(7/5)x − 4 מאונכים זה לזה.",
              taskIds: ["perp"],
            },
          ],
          tasks: [
            {
              id: "perp",
              kind: "perpendicular",
              answer: true,
              reason: "מכפלת השיפועים (5/7)·(−7/5) = −1 — הישרים מאונכים.",
            },
          ],
        },
        {
          n: 7,
          showBoard: false,
          hideGiven: true,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: -1, b: 4, eqText: "y = −x + 4" } },
            { key: "L2", line: { m: 1, b: 8, eqText: "y = x + 8" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים y = −x + 4 ו־y = x + 8 מאונכים זה לזה.",
              taskIds: ["perp"],
            },
          ],
          tasks: [
            {
              id: "perp",
              kind: "perpendicular",
              answer: true,
              reason: "מכפלת השיפועים (−1)·1 = −1 — הישרים מאונכים.",
            },
          ],
        },
        {
          n: 8,
          showBoard: false,
          hideGiven: true,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: 1 / 3, mn: 1, md: 3, b: 3, eqText: "3y − x = 9" } },
            { key: "L2", line: { m: -3, b: 2, eqText: "y + 3x = 2" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים 3y − x = 9 ו־y + 3x = 2 מאונכים זה לזה.",
              taskIds: ["perp"],
            },
          ],
          tasks: [
            {
              id: "perp",
              kind: "perpendicular",
              answer: true,
              reason: "מכפלת השיפועים (1/3)·(−3) = −1 — הישרים מאונכים.",
            },
          ],
        },
        {
          n: 9,
          showBoard: false,
          hideGiven: true,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: 1.5, mn: 3, md: 2, b: 7 / 2, eqText: "2y − 3x = 7" } },
            { key: "L2", line: { m: 2 / 3, mn: 2, md: 3, b: 2, eqText: "3y − 2x = 6" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים 2y − 3x = 7 ו־3y − 2x = 6 מאונכים זה לזה.",
              taskIds: ["perp"],
            },
          ],
          tasks: [
            {
              id: "perp",
              kind: "perpendicular",
              answer: false,
              reason: "מכפלת השיפועים (3/2)·(2/3) = 1 ≠ −1 — הישרים לא מאונכים.",
            },
          ],
        },
        {
          n: 10,
          showBoard: false,
          hideGiven: true,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: 0, b: 4, eqText: "y = 4" } },
            { key: "L2", line: { vertical: 10, eqText: "x = 10" } },
          ],
          parts: [
            {
              text: "קבעו אם הישרים y = 4 ו־x = 10 מאונכים זה לזה.",
              taskIds: ["perp"],
            },
          ],
          tasks: [
            {
              id: "perp",
              kind: "perpendicular",
              answer: true,
              reason: "y = 4 מקביל לציר x ו־x = 10 מקביל לציר y — ישר אופקי מאונך לישר אנכי.",
            },
          ],
        },
        {
          n: 11,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          givenText: "הקטעים AB ו־CD מאונכים זה לזה. שיפוע AB הוא 4",
          points: [
            { label: "A", x: -1, y: -2 },
            { label: "B", x: 1, y: 6 },
            { label: "C", x: -4, y: 3 },
            { label: "D", x: 4, y: 1 },
            { label: "P", x: 0, y: 2, hideX: true, hideY: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "C", to: "D" },
          ],
          rightAngles: [{ at: "P", from: "A", to: "C" }],
          parts: [
            {
              text: "הקטעים AB ו־CD מאונכים זה לזה. שיפועו של הקטע AB הוא 4. חשבו את שיפועו של הקטע CD.",
              taskIds: ["mCD"],
            },
          ],
          tasks: [
            {
              id: "mCD",
              label: "CD",
              kind: "slope",
              perpendicular: true,
              givenM: 4,
              m: -1 / 4,
              mn: -1,
              md: 4,
              from: "C",
              to: "D",
            },
          ],
        },
        {
          n: 12,
          showBoard: false,
          hideGiven: true,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [{ key: "L1", line: { m: 4, b: -7, eqText: "y = 4x − 7" } }],
          parts: [
            {
              text: "חשבו את שיפוע הישר המאונך לישר y = 4x − 7.",
              taskIds: ["m2"],
            },
          ],
          tasks: [
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: 4,
              m: -1 / 4,
              mn: -1,
              md: 4,
            },
          ],
        },
        {
          n: 13,
          showBoard: false,
          hideGiven: true,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [{ key: "L1", line: { m: -0.2, mn: -1, md: 5, b: 0, eqText: "y = −0.2x" } }],
          parts: [
            {
              text: "חשבו את שיפוע הישר המאונך לישר y = −0.2x.",
              taskIds: ["m2"],
            },
          ],
          tasks: [
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: -0.2,
              m: 5,
            },
          ],
        },
        {
          n: 14,
          showBoard: false,
          hideGiven: true,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "L1", line: { m: -5 / 8, mn: -5, md: 8, b: 13 / 8, bn: 13, bd: 8, eqText: "8y + 5x = 13" } },
          ],
          parts: [
            {
              text: "חשבו את שיפוע הישר המאונך לישר 8y + 5x = 13.",
              taskIds: ["m2"],
            },
          ],
          tasks: [
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: -5 / 8,
              m: 8 / 5,
              mn: 8,
              md: 5,
            },
          ],
        },
        {
          n: 15,
          showBoard: false,
          hideGiven: true,
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 11, y: 3 },
            { label: "B", x: 8, y: 9 },
          ],
          parts: [
            {
              text: "מצאו את שיפוע הישר המאונך לישר העובר דרך הנקודות (11;3) ו־(8;9).",
              taskIds: ["mAB", "m2"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: -2,
              m: 1 / 2,
              mn: 1,
              md: 2,
            },
          ],
        },
        {
          n: 16,
          showBoard: false,
          hideGiven: true,
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 17, y: 9 },
            { label: "B", x: 9, y: 7 },
          ],
          parts: [
            {
              text: "מצאו את שיפוע הישר המאונך לישר העובר דרך הנקודות (17;9) ו־(9;7).",
              taskIds: ["mAB", "m2"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: 1 / 4,
              m: -4,
            },
          ],
        },
        {
          n: 17,
          showBoard: false,
          hideGiven: true,
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 8, y: 5 },
            { label: "B", x: 13, y: 8 },
          ],
          parts: [
            {
              text: "מצאו את שיפוע הישר המאונך לישר העובר דרך הנקודות (8;5) ו־(13;8).",
              taskIds: ["mAB", "m2"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: 3 / 5,
              m: -5 / 3,
              mn: -5,
              md: 3,
            },
          ],
        },
        {
          n: 18,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 2, y: 5 },
            { label: "B", x: 7, y: 9 },
            { label: "C", x: 7, y: 6 },
            { label: "D", x: 3, y: 11 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "C", to: "D" },
          ],
          parts: [
            {
              text: "הראו שהישר העובר דרך הנקודות A(2;5) ו־B(7;9) ניצב לישר העובר דרך הנקודות C(7;6) ו־D(3;11).",
              taskIds: ["mAB", "mCD", "perp"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "mCD", label: "m", kind: "slope", from: "C", to: "D" },
            {
              id: "perp",
              kind: "perpendicular",
              answer: true,
              slopeIds: ["mAB", "mCD"],
              reason: "מכפלת השיפועים היא −1 — הישרים מאונכים.",
            },
          ],
        },
        {
          n: 19,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 7, y: 5 },
            { label: "B", x: 11, y: 3 },
            { label: "C", x: 10, y: 1, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          lines: [
            { key: "AB", label: "", line: { m: -0.5, mn: -1, md: 2, b: 8.5, hideEq: true } },
            { key: "perp", label: "", line: { m: 2, b: -19, hideEq: true, dashed: true } },
          ],
          rightAngles: [{ at: "B", from: "A", to: "C" }],
          parts: [
            {
              text: "נתונות הנקודות A(7;5) ו־B(11;3). מצאו את משוואת האנך לקטע AB בנקודה B.",
              taskIds: ["mAB", "m2", "eq"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: -1 / 2,
              m: 2,
            },
            {
              id: "eq",
              kind: "lineEq",
              point: "B",
              x: 11,
              y: 3,
              m: 2,
              b: -19,
              label: "האנך",
            },
          ],
        },
        {
          n: 20,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          points: [{ label: "A", x: 3, y: 5 }],
          lines: [
            { key: "L1", line: { m: 1 / 2, mn: 1, md: 2, b: -5, eqText: "y = (1/2)x − 5" } },
            { key: "perp", label: "", line: { m: -2, b: 11, hideEq: true, dashed: true } },
          ],
          parts: [
            {
              text: "מצאו את משוואת הישר המאונך לישר y = (1/2)x − 5 ועובר דרך הנקודה (3;5).",
              taskIds: ["m2", "eq"],
            },
          ],
          tasks: [
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: 1 / 2,
              m: -2,
            },
            {
              id: "eq",
              kind: "lineEq",
              point: "A",
              x: 3,
              y: 5,
              m: -2,
              b: 11,
              label: "האנך",
            },
          ],
        },
        {
          n: 21,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          points: [{ label: "A", x: -4, y: -5 }],
          lines: [
            {
              key: "L1",
              line: {
                m: 9 / 8,
                mn: 9,
                md: 8,
                b: -5 / 8,
                bn: -5,
                bd: 8,
                eqText: "−9x + 8y + 5 = 0",
              },
            },
            {
              key: "perp",
              label: "",
              line: { m: -8 / 9, mn: -8, md: 9, b: -77 / 9, bn: -77, bd: 9, hideEq: true, dashed: true },
            },
          ],
          parts: [
            {
              text: "מצאו את משוואת הישר העובר בנקודה (−4;−5) ומאונך לישר −9x + 8y + 5 = 0.",
              taskIds: ["m2", "eq"],
            },
          ],
          tasks: [
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: 9 / 8,
              m: -8 / 9,
              mn: -8,
              md: 9,
            },
            {
              id: "eq",
              kind: "lineEq",
              point: "A",
              x: -4,
              y: -5,
              m: -8 / 9,
              mn: -8,
              md: 9,
              b: -77 / 9,
              bn: -77,
              bd: 9,
              label: "האנך",
            },
          ],
        },
        {
          n: 22,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          line: { m: 2, b: 6, eqText: "y = 2x + 6" },
          points: [
            { label: "A", x: 0, y: 6, hideY: true },
            { label: "B", x: -3, y: 0, hideX: true },
            { label: "C", x: 2, y: 5, hideX: true, hideY: true },
            { label: "D", x: -1, y: -1, hideX: true, hideY: true },
          ],
          lines: [
            { key: "L", label: "", line: { m: 2, b: 6, eqText: "y = 2x + 6" } },
            { key: "perpY", label: "", line: { m: -0.5, mn: -1, md: 2, b: 6, hideEq: true, dashed: true } },
            { key: "perpX", label: "", line: { m: -0.5, mn: -1, md: 2, b: -1.5, bn: -3, bd: 2, hideEq: true, dashed: true } },
          ],
          rightAngles: [
            { at: "A", from: "B", to: "C" },
            { at: "B", from: "A", to: "D" },
          ],
          parts: [
            {
              label: "א",
              text: "בשרטוט נתון הישר y = 2x + 6. מצאו משוואת ישר המאונך לישר הנתון בנקודת החיתוך שלו עם ציר ה־y.",
              taskIds: ["A", "m2", "eqA"],
            },
            {
              label: "ב",
              text: "מצאו משוואת ישר המאונך לישר הנתון בנקודת החיתוך שלו עם ציר ה־x.",
              taskIds: ["B", "eqB"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y", lineKey: "L" },
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: 2,
              m: -1 / 2,
              mn: -1,
              md: 2,
            },
            {
              id: "eqA",
              kind: "lineEq",
              point: "A",
              x: 0,
              y: 6,
              m: -1 / 2,
              mn: -1,
              md: 2,
              b: 6,
              label: "האנך בציר y",
            },
            { id: "B", label: "B", kind: "point", point: "B", missing: "x", intercept: "x", lineKey: "L" },
            {
              id: "eqB",
              kind: "lineEq",
              point: "B",
              x: -3,
              y: 0,
              m: -1 / 2,
              mn: -1,
              md: 2,
              b: -3 / 2,
              bn: -3,
              bd: 2,
              label: "האנך בציר x",
            },
          ],
        },
        {
          n: 23,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "O", x: 0, y: 0 },
            { label: "A", x: 3, y: 1, hideX: true, hideY: true },
            { label: "P", x: 0, y: 10, hideX: true, hideY: true },
          ],
          lines: [
            { key: "L", line: { m: -3, b: 10, eqText: "y = −3x + 10" } },
            { key: "perp", label: "", line: { m: 1 / 3, mn: 1, md: 3, b: 0, hideEq: true, dashed: true } },
          ],
          rightAngles: [{ at: "A", from: "P", to: "O" }],
          parts: [
            {
              label: "א",
              text: "נתון הישר y = −3x + 10. מצאו את משוואת הישר המאונך לישר הנתון והעובר דרך ראשית הצירים.",
              taskIds: ["m2", "eq"],
            },
            {
              label: "ב",
              text: "מצאו את שיעורי נקודת החיתוך של הישר שמצאתם בסעיף א עם הישר הנתון (נקודה A בשרטוט).",
              taskIds: ["A"],
            },
          ],
          tasks: [
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: -3,
              m: 1 / 3,
              mn: 1,
              md: 3,
            },
            {
              id: "eq",
              kind: "lineEq",
              point: "O",
              x: 0,
              y: 0,
              m: 1 / 3,
              mn: 1,
              md: 3,
              b: 0,
              label: "האנך",
            },
            { id: "A", kind: "lineIntersect", point: "A", label: "A" },
          ],
        },
        {
          n: 24,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 1, y: 5 },
            { label: "B", x: 4, y: 2, hideX: true, hideY: true },
            { label: "P", x: 2, y: 0, hideX: true, hideY: true },
          ],
          lines: [
            { key: "L", line: { m: 1, b: -2, eqText: "y = x − 2" } },
            { key: "perp", label: "", line: { m: -1, b: 6, hideEq: true, dashed: true } },
          ],
          rightAngles: [{ at: "B", from: "P", to: "A" }],
          parts: [
            {
              text: "מהנקודה A(1;5) מעבירים אנך לישר y = x − 2. האנך חותך את הישר בנקודה B. מצאו את שיעורי הנקודה B.",
              taskIds: ["m2", "eq", "B"],
            },
          ],
          tasks: [
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: 1,
              m: -1,
            },
            {
              id: "eq",
              kind: "lineEq",
              point: "A",
              x: 1,
              y: 5,
              m: -1,
              b: 6,
              label: "האנך",
            },
            { id: "B", kind: "lineIntersect", point: "B", label: "B" },
          ],
        },
        {
          n: 25,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          points: [
            { label: "A", x: 0, y: 6, hideY: true },
            { label: "B", x: 8, y: 0, hideX: true },
            { label: "C", x: -4.5, y: 0, hideX: true },
            { label: "H", x: 0, y: 0, hideX: true, hideY: true, drawOnly: true },
          ],
          lines: [
            { key: "L", line: { m: -3 / 4, mn: -3, md: 4, b: 6, eqText: "y = −(3/4)x + 6" } },
            { key: "perp", label: "", line: { m: 4 / 3, mn: 4, md: 3, b: 6, hideEq: true, dashed: true } },
          ],
          rightAngles: [{ at: "A", from: "B", to: "C" }],
          polygons: [{ verts: ["A", "B", "C"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו קודקוד A, וגררו את רגל הגובה אל BC.",
            triangle: ["A", "B", "C"],
            heights: [{ id: "hABC", from: "A", base: ["B", "C"], footLabel: "H", recommended: true }],
          },
          parts: [
            {
              label: "א",
              text: "הישר y = −(3/4)x + 6 חותך את ציר y בנקודה A ואת ציר x בנקודה B. בנקודה A מעבירים ישר המאונך לישר הנתון. מצאו את משוואת הישר המאונך.",
              taskIds: ["A", "m2", "eq"],
            },
            {
              label: "ב",
              text: "הישר המאונך חותך את ציר x בנקודה C. חשבו את שטח המשולש ABC.",
              taskIds: ["B", "C", "BC", "AH", "SABC"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y", lineKey: "L" },
            {
              id: "m2",
              label: "2",
              kind: "slope",
              perpendicular: true,
              givenM: -3 / 4,
              m: 4 / 3,
              mn: 4,
              md: 3,
            },
            {
              id: "eq",
              kind: "lineEq",
              point: "A",
              x: 0,
              y: 6,
              m: 4 / 3,
              mn: 4,
              md: 3,
              b: 6,
              label: "האנך",
            },
            { id: "B", label: "B", kind: "point", point: "B", missing: "x", intercept: "x", lineKey: "L" },
            { id: "C", label: "C", kind: "point", point: "C", missing: "x", intercept: "x", lineKey: "perp" },
            { id: "BC", kind: "segment", from: "B", to: "C", optional: true },
            { id: "AH", kind: "segment", from: "A", to: "H", optional: true, drawHeight: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["B", "C"],
                ["A", "H"],
              ],
            },
          ],
        },
        {
          n: 26,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: -4, y: 1, hideX: true, hideY: true },
            { label: "B", x: 2, y: 1, hideX: true, hideY: true },
            { label: "C", x: -4, y: 7, hideX: true, hideY: true },
            { label: "D", x: -1, y: 4 },
            { label: "G", x: -1, y: 1, hideX: true, hideY: true, drawOnly: true },
            { label: "H", x: -4, y: 4, hideX: true, hideY: true, drawOnly: true },
          ],
          lines: [
            { key: "AB", label: "", line: { m: 0, b: 1, eqText: "y = 1" } },
            { key: "AC", label: "", line: { vertical: -4, eqText: "x = −4" } },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "A", to: "C" },
            { from: "B", to: "C" },
            { from: "A", to: "D" },
          ],
          rightAngles: [{ at: "D", from: "B", to: "A" }],
          polygons: [{ verts: ["A", "B", "D"] }, { verts: ["A", "D", "C"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה» וגררו רגל גובה מ־D אל AB או אל AC.",
            heights: [
              { id: "hABD", from: "D", base: ["A", "B"], footLabel: "G", recommended: true },
              { id: "hADC", from: "D", base: ["A", "C"], footLabel: "H", recommended: true },
            ],
          },
          parts: [
            {
              label: "א",
              text: "משוואת הישר AB היא y = 1. משוואת הישר AC היא x = −4. הנקודה D(−1;4) היא אמצע הקטע BC. הראו שהישר BC מאונך לישר AD.",
              taskIds: ["A", "B", "C", "mAD", "mBC", "perp"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש ABD.",
              taskIds: ["AB", "DG", "SABD"],
            },
            {
              label: "ג",
              text: "חשבו את שטח המשולש ADC.",
              taskIds: ["AC", "DH", "SADC"],
            },
          ],
          tasks: [
            { id: "A", kind: "lineIntersect", point: "A", label: "A" },
            { id: "B", kind: "midpoint", point: "B", from: "C", mid: "D", onLine: { m: 0, b: 1 } },
            { id: "C", kind: "midpoint", point: "C", from: "B", mid: "D", onLine: { vertical: -4 } },
            { id: "mAD", label: "m", kind: "slope", from: "A", to: "D" },
            { id: "mBC", label: "m", kind: "slope", from: "B", to: "C" },
            {
              id: "perp",
              kind: "perpendicular",
              answer: true,
              slopeIds: ["mAD", "mBC"],
              reason: "מכפלת השיפועים היא −1 — הישרים מאונכים.",
            },
            { id: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "DG", kind: "segment", from: "D", to: "G", optional: true, drawHeight: true },
            {
              id: "SABD",
              label: "S△ABD",
              kind: "area",
              verts: ["A", "B", "D"],
              legs: [
                ["A", "B"],
                ["D", "G"],
              ],
            },
            { id: "AC", kind: "segment", from: "A", to: "C", optional: true },
            { id: "DH", kind: "segment", from: "D", to: "H", optional: true, drawHeight: true },
            {
              id: "SADC",
              label: "S△ADC",
              kind: "area",
              verts: ["A", "D", "C"],
              legs: [
                ["A", "C"],
                ["D", "H"],
              ],
            },
          ],
        },
        {
          n: 27,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          givenText: "A(4;1), B(10;3), AB ∥ DC, ∠BCD = 90°, C על ציר x",
          points: [
            { label: "A", x: 4, y: 1 },
            { label: "B", x: 10, y: 3 },
            { label: "C", x: 11, y: 0, hideX: true, hideY: true },
            { label: "D", x: 8, y: -1, hideX: true, hideY: true },
          ],
          lines: [
            { key: "BC", label: "BC", line: { m: -3, b: 33, hideEq: true } },
            { key: "DC", label: "DC", line: { m: 1 / 3, mn: 1, md: 3, b: -11 / 3, bn: -11, bd: 3, hideEq: true } },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "D" },
            { from: "D", to: "A" },
          ],
          rightAngles: [{ at: "C", from: "B", to: "D" }],
          polygons: [{ verts: ["A", "B", "C", "D"] }],
          parts: [
            {
              label: "א",
              text: "במרובע ABCD הקודקוד C נמצא על ציר ה-x. נתון: A(4;1), B(10;3), AB ∥ DC, ∠BCD = 90° (ראו ציור).\nמצאו את שיפוע הישר BC ואת משוואת הישר BC.",
              taskIds: ["mAB", "mBC", "eqBC"],
            },
            {
              label: "ב",
              text: "מצאו את השיעורים של הקודקוד C.",
              taskIds: ["C"],
            },
            {
              label: "ג",
              text: "מצאו את משוואת הישר DC.",
              taskIds: ["mDC2", "eqDC"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "mDC", kind: "slope", parallel: true, optional: true, m: 1 / 3, mn: 1, md: 3, label: "DC", givenLabel: "AB", from: "D", to: "C" },
            {
              id: "mBC",
              label: "BC",
              kind: "slope",
              perpendicular: true,
              givenM: 1 / 3,
              givenLabel: "AB",
              m: -3,
              from: "B",
              to: "C",
            },
            {
              id: "eqBC",
              kind: "lineEq",
              point: "B",
              x: 10,
              y: 3,
              m: -3,
              b: 33,
              label: "BC",
            },
            {
              id: "C",
              label: "C",
              kind: "point",
              point: "C",
              missing: "x",
              intercept: "x",
              lineKey: "BC",
              line: { m: -3, b: 33 },
            },
            { id: "mDC2", kind: "slope", parallel: true, m: 1 / 3, mn: 1, md: 3, label: "DC", givenLabel: "AB", from: "D", to: "C" },
            {
              id: "eqDC",
              kind: "lineEq",
              point: "C",
              x: 11,
              y: 0,
              m: 1 / 3,
              mn: 1,
              md: 3,
              b: -11 / 3,
              label: "DC",
            },
          ],
        },
        {
          n: 28,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          givenText: "y = −2x + 5",
          line: { m: -2, b: 5, eqText: "y = −2x + 5" },
          points: [
            { label: "A", x: 0, y: 5, hideY: true },
            { label: "B", x: 2.5, y: 0, hideX: true },
            { label: "D", x: 0, y: -10, hideX: true, hideY: true },
            { label: "C", x: 6, y: -7, hideX: true, hideY: true },
            { label: "F", x: 2.5, y: -8.75, hideX: true, hideY: true },
          ],
          lines: [
            { key: "AB", label: "", line: { m: -2, b: 5, eqText: "y = −2x + 5" } },
            { key: "DC", label: "DC", line: { m: 0.5, mn: 1, md: 2, b: -10, hideEq: true } },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "D", to: "C" },
            { from: "B", to: "F" },
          ],
          rightAngles: [{ at: "C", from: "D", to: "A" }],
          parts: [
            {
              label: "א",
              text: "הישר y = −2x + 5 חותך את ציר ה-y בנקודה A ואת ציר ה-x בנקודה B (ראו ציור). מצאו את שיעורי הנקודות A ו־B.",
              taskIds: ["A", "B"],
            },
            {
              label: "ב",
              text: "הנקודה O היא ראשית הצירים. הנקודה D נמצאת על ציר ה-y, מתחת לציר ה-x. נתון: OD = 4 · OB. מצאו את שיעורי הנקודה D.",
              taskIds: ["OB", "OD", "D"],
            },
            {
              label: "ג",
              text: "הנקודה C נמצאת על המשך הקטע AB, כך שהישר DC מאונך לישר AC.\n(1) מצאו את משוואת הישר DC.",
              taskIds: ["mDC", "eqDC"],
            },
            {
              label: "ג(2)",
              text: "(2) מצאו את שיעורי הנקודה C.",
              taskIds: ["C"],
            },
            {
              label: "ד",
              text: "הנקודה F נמצאת על הישר DC, ושיעור ה-y שלה הוא −8.75.",
              taskIds: ["F"],
            },
            {
              label: "ד(1)",
              text: "(1) הוכיחו כי הישר BF מקביל לציר ה-y.",
              taskIds: ["parBF"],
            },
            {
              label: "ד(2)",
              text: "(2) כתבו את משוואת הישר BF.",
              taskIds: ["eqBF"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y" },
            { id: "B", label: "B", kind: "point", point: "B", missing: "x", intercept: "x" },
            { id: "OB", kind: "origin", point: "B", optional: true },
            { id: "OD", kind: "origin", point: "D", optional: true, timesLen: { origin: "B", factor: 4 } },
            {
              id: "D",
              label: "D",
              kind: "point",
              point: "D",
              missing: "both",
              twinX: "O",
              noLine: true,
            },
            {
              id: "mDC",
              label: "DC",
              kind: "slope",
              perpendicular: true,
              givenM: -2,
              m: 0.5,
              mn: 1,
              md: 2,
            },
            {
              id: "eqDC",
              kind: "lineEq",
              point: "D",
              x: 0,
              y: -10,
              m: 0.5,
              mn: 1,
              md: 2,
              b: -10,
              label: "DC",
            },
            { id: "C", kind: "lineIntersect", point: "C", label: "C", answerX: 6, answerY: -7 },
            {
              id: "F",
              label: "F",
              kind: "point",
              point: "F",
              missing: "x",
              lineKey: "DC",
              line: { m: 0.5, mn: 1, md: 2, b: -10 },
            },
            {
              id: "parBF",
              kind: "yesNo",
              answer: true,
              question: "האם BF מקביל לציר ה-y?",
              reason: "ל־B ול־F אותו שיעור x, לכן BF מקביל לציר ה-y.",
            },
            {
              id: "eqBF",
              kind: "lineEq",
              axisParallel: "y",
              point: "B",
              x: 2.5,
              y: 0,
              vertical: 2.5,
            },
          ],
        },
        {
          n: 29,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          givenText: "AC: y = −4½x + 36, BC = 5",
          givenArea: { verts: ["A", "B", "C"], value: 22.5, label: "S△ABC" },
          givenLengths: [{ from: "B", to: "C", len: 5 }],
          line: { m: -4.5, mn: -9, md: 2, b: 36, eqText: "y = −4½x + 36" },
          points: [
            { label: "C", x: 8, y: 0, hideX: true },
            { label: "B", x: 3, y: 0, hideX: true, hideY: true },
            { label: "A", x: 6, y: 9, hideX: true, hideY: true },
            { label: "D", x: -12, y: 5, hideX: true, hideY: true },
            { label: "H", x: 6, y: 0, hideX: true, hideY: true, drawOnly: true },
          ],
          lines: [
            { key: "AC", label: "AC", line: { m: -4.5, mn: -9, md: 2, b: 36, eqText: "y = −4½x + 36" } },
            { key: "BD", label: "BD", line: { m: -1 / 3, mn: -1, md: 3, b: 1, hideEq: true } },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" },
            { from: "B", to: "D" },
            { from: "A", to: "D" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו קודקוד A, וגררו את רגל הגובה אל BC.",
            triangle: ["A", "B", "C"],
            heights: [{ id: "hABC", from: "A", base: ["B", "C"], footLabel: "H", recommended: true }],
          },
          parts: [
            {
              label: "א",
              text: "הקודקודים B ו־C של משולש ABC מונחים על ציר ה-x. הקודקוד A נמצא ברביע הראשון. משוואת הצלע AC היא y = −4½x + 36. אורך הצלע BC הוא 5. מצאו את שיעורי הנקודות C ו־B.",
              taskIds: ["C", "B"],
            },
            {
              label: "ב",
              text: "נתון: שטח המשולש ABC הוא 22½. מצאו את שיעורי הנקודה A.",
              taskIds: ["h", "A"],
            },
            {
              label: "ג",
              text: "D היא נקודה ברביע השני, כך ש־DB מאונך ל־AB. מצאו את משוואת הישר BD.",
              taskIds: ["mAB", "mBD", "eqBD"],
            },
            {
              label: "ד",
              text: "שיעור ה-x של הנקודה D הוא −12. הוכיחו כי ∠DAC = 90°.",
              taskIds: ["D", "mAD", "mAC", "perp"],
            },
          ],
          tasks: [
            { id: "C", label: "C", kind: "point", point: "C", missing: "x", intercept: "x", lineKey: "AC" },
            {
              id: "B",
              label: "B",
              kind: "point",
              point: "B",
              missing: "both",
              intercept: "x",
              noLine: true,
            },
            {
              id: "h",
              kind: "segment",
              from: "A",
              to: "H",
              label: "h",
              optional: true,
              drawHeight: true,
              fromArea: {
                label: "S△ABC",
                verts: ["A", "B", "C"],
                value: 22.5,
                legs: [
                  ["B", "C"],
                  ["A", "H"],
                ],
                unknown: ["A", "H"],
              },
            },
            {
              id: "A",
              label: "A",
              kind: "point",
              point: "A",
              missing: "x",
              lineKey: "AC",
              line: { m: -4.5, mn: -9, md: 2, b: 36 },
            },
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            {
              id: "mBD",
              label: "BD",
              kind: "slope",
              perpendicular: true,
              givenM: 3,
              m: -1 / 3,
              mn: -1,
              md: 3,
            },
            {
              id: "eqBD",
              kind: "lineEq",
              point: "B",
              x: 3,
              y: 0,
              m: -1 / 3,
              mn: -1,
              md: 3,
              b: 1,
              label: "BD",
            },
            {
              id: "D",
              label: "D",
              kind: "point",
              point: "D",
              missing: "y",
              lineKey: "BD",
              line: { m: -1 / 3, mn: -1, md: 3, b: 1 },
            },
            { id: "mAD", label: "m", kind: "slope", from: "A", to: "D" },
            { id: "mAC", label: "m", kind: "slope", from: "A", to: "C" },
            {
              id: "perp",
              kind: "perpendicular",
              answer: true,
              slopeIds: ["mAD", "mAC"],
              reason: "מכפלת השיפועים (2/9)·(−9/2) = −1 — לכן AD ⊥ AC, ולכן ∠DAC = 90°.",
            },
          ],
        },
      ],
    },
    {
      id: "geo-axis-lines-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "ישרים מקבילים לצירים",
      instruction:
        "מקביל לציר x (או מאונך לציר y): y = שיעור ה-y של הנקודה (או של שתי נקודות עם אותו y). מקביל לציר y (או מאונך לציר x): x = שיעור ה-x. אפשר לרשום ישר את המשוואה. בשאלות כן/לא — רק כן או לא, בלי נימוק.",
      exercises: [
        {
          n: 1,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [{ key: "L", label: "", line: { m: 0, b: 4, hideEq: true } }],
          points: [{ label: "A", x: 3, y: 4 }],
          parts: [
            {
              text: "בציור שלפניכם מתואר ישר המקביל לציר ה-x. הישר עובר בנקודה A(3;4). מהי משוואת הישר?",
              taskIds: ["eq"],
            },
          ],
          tasks: [{ id: "eq", kind: "lineEq", axisParallel: "x", point: "A", x: 3, y: 4, m: 0, b: 4 }],
        },
        {
          n: 2,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [{ key: "L", label: "", line: { vertical: 5, hideEq: true } }],
          points: [{ label: "A", x: 5, y: -2 }],
          parts: [
            {
              label: "א",
              text: "בציור מתואר ישר המקביל לציר ה-y. הישר עובר בנקודה A(5;−2). מהי משוואת הישר?",
              taskIds: ["eq"],
            },
            {
              label: "ב",
              text: "האם הישר מאונך לציר ה-x?",
              taskIds: ["yn"],
            },
          ],
          tasks: [
            { id: "eq", kind: "lineEq", axisParallel: "y", axisPerp: "x", point: "A", x: 5, y: -2, vertical: 5 },
            {
              id: "yn",
              kind: "yesNo",
              answer: true,
              question: "האם הישר מאונך לציר ה-x?",
            },
          ],
        },
        {
          n: 3,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "V", label: "", line: { vertical: -3, hideEq: true } },
            { key: "H", label: "", line: { m: 0, b: 2, hideEq: true } },
          ],
          points: [
            { label: "A", x: -3, y: 7 },
            { label: "B", x: 5, y: 2 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו משוואת ישר המאונך לציר ה-x ועובר דרך הנקודה (−3;7).",
              taskIds: ["eqA"],
            },
            {
              label: "ב",
              text: "מצאו משוואת ישר המאונך לציר ה-y ועובר דרך הנקודה (5;2).",
              taskIds: ["eqB"],
            },
          ],
          tasks: [
            { id: "eqA", kind: "lineEq", axisParallel: "y", axisPerp: "x", point: "A", x: -3, y: 7, vertical: -3 },
            { id: "eqB", kind: "lineEq", axisParallel: "x", axisPerp: "y", point: "B", x: 5, y: 2, m: 0, b: 2 },
          ],
        },
        {
          n: 4,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          lines: [{ key: "L", label: "", line: { m: 0, b: 6, hideEq: true } }],
          points: [
            { label: "A", x: 5, y: 6 },
            { label: "B", x: -2, y: 6 },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              label: "א",
              text: "בציור מתואר ישר העובר דרך הנקודות A(5;6) ו־B(−2;6). מהו שיפוע הישר?",
              taskIds: ["mAB"],
            },
            {
              label: "ב",
              text: "כתבו את משוואת הישר.",
              taskIds: ["eq"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eq", kind: "lineEq", axisParallel: "x", from: "A", to: "B", point: "A", x: 5, y: 6, m: 0, b: 6 },
          ],
        },
        {
          n: 5,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          lines: [{ key: "L", label: "", line: { vertical: 5, hideEq: true } }],
          points: [
            { label: "A", x: 5, y: 1 },
            { label: "B", x: 5, y: -5 },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              label: "א",
              text: "בציור שלפניכם מתואר ישר העובר דרך הנקודות A(5;1) ו־B(5;−5). כתבו את משוואת הישר.",
              taskIds: ["eq"],
            },
            {
              label: "ב",
              text: "דניאל טוען ששיפוע הישר הוא אפס. האם הוא צודק?",
              taskIds: ["yn"],
            },
          ],
          tasks: [
            { id: "eq", kind: "lineEq", axisParallel: "y", from: "A", to: "B", point: "A", x: 5, y: 1, vertical: 5 },
            {
              id: "yn",
              kind: "yesNo",
              answer: false,
              question: "דניאל טוען ששיפוע הישר הוא אפס. האם הוא צודק?",
            },
          ],
        },
        {
          n: 6,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          lines: [
            { key: "AB", label: "", line: { m: 0, b: -9, hideEq: true } },
            { key: "CD", label: "", line: { vertical: -5, hideEq: true } },
            { key: "EF", label: "", line: { m: 0, b: 0, hideEq: true } },
            { key: "GH", label: "", line: { vertical: 0, hideEq: true } },
          ],
          points: [
            { label: "A", x: 2, y: -9 },
            { label: "B", x: -4, y: -9 },
            { label: "C", x: -5, y: -8 },
            { label: "D", x: -5, y: -12 },
            { label: "E", x: 7, y: 0 },
            { label: "F", x: -5, y: 0 },
            { label: "G", x: 0, y: 8 },
            { label: "H", x: 0, y: 4 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "C", to: "D" },
            { from: "E", to: "F" },
            { from: "G", to: "H" },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את משוואת הישר העובר דרך שתי הנקודות הנתונות: (2;−9) ו־(−4;−9).",
              taskIds: ["eqAB"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר העובר דרך שתי הנקודות הנתונות: (−5;−8) ו־(−5;−12).",
              taskIds: ["eqCD"],
            },
            {
              label: "ג",
              text: "מצאו את משוואת הישר העובר דרך שתי הנקודות הנתונות: (7;0) ו־(−5;0).",
              taskIds: ["eqEF"],
            },
            {
              label: "ד",
              text: "מצאו את משוואת הישר העובר דרך שתי הנקודות הנתונות: (0;8) ו־(0;4).",
              taskIds: ["eqGH"],
            },
          ],
          tasks: [
            { id: "eqAB", kind: "lineEq", axisParallel: "x", from: "A", to: "B", point: "A", x: 2, y: -9, m: 0, b: -9 },
            { id: "eqCD", kind: "lineEq", axisParallel: "y", from: "C", to: "D", point: "C", x: -5, y: -8, vertical: -5 },
            { id: "eqEF", kind: "lineEq", axisParallel: "x", from: "E", to: "F", point: "E", x: 7, y: 0, m: 0, b: 0 },
            { id: "eqGH", kind: "lineEq", axisParallel: "y", from: "G", to: "H", point: "G", x: 0, y: 8, vertical: 0 },
          ],
        },
        {
          n: 7,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          lines: [
            { key: "AB", label: "AB", line: { m: 0, b: 2, eqText: "y = 2" } },
            { key: "BC", label: "BC", line: { m: 1, b: -3, eqText: "y = x − 3" } },
          ],
          points: [
            { label: "A", x: 0, y: 2, hideY: true },
            { label: "B", x: 5, y: 2, hideX: true, hideY: true },
            { label: "C", x: 0, y: -3 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
          ],
          parts: [
            {
              label: "א",
              text: "משוואת הישר AB היא y = 2 ומשוואת הישר BC היא y = x − 3. נקודה A נמצאת על ציר ה-y. מצאו את שיעורי הנקודות A ו־B.",
              taskIds: ["A", "B"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר: (1) העובר בנקודה B ומקביל לציר ה-y. (2) העובר בנקודה C ומקביל לציר ה-x.",
              taskIds: ["eqB", "eqC"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y" },
            { id: "B", kind: "lineIntersect", point: "B", label: "B" },
            { id: "eqB", kind: "lineEq", axisParallel: "y", point: "B", x: 5, y: 2, vertical: 5 },
            { id: "eqC", kind: "lineEq", axisParallel: "x", point: "C", x: 0, y: -3, m: 0, b: -3 },
          ],
        },
        {
          n: 8,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "G", label: "", line: { m: 0, b: 2, eqText: "y = 2" } },
            { key: "L", label: "", line: { m: 0, b: 5, hideEq: true, dashed: true } },
          ],
          points: [{ label: "A", x: 3, y: 5 }],
          parts: [
            {
              text: "מצאו את משוואת הישר העובר בנקודה A(3;5) ומקביל לישר y = 2.",
              taskIds: ["eq"],
            },
          ],
          tasks: [
            {
              id: "eq",
              kind: "lineEq",
              axisParallel: "x",
              point: "A",
              x: 3,
              y: 5,
              m: 0,
              b: 5,
              givenEq: "y = 2",
            },
          ],
        },
        {
          n: 9,
          hideLineEq: false,
          showSegments: false,
          showAxisGuides: false,
          lines: [
            { key: "G1", label: "", line: { m: 0, b: -5, eqText: "y = −5" } },
            { key: "G2", label: "", line: { vertical: 1, eqText: "x = 1" } },
            { key: "L1", label: "", line: { m: 0, b: -3, hideEq: true, dashed: true } },
            { key: "L2", label: "", line: { vertical: -2, hideEq: true, dashed: true } },
          ],
          points: [
            { label: "A", x: 1, y: -3 },
            { label: "B", x: -2, y: 0 },
          ],
          parts: [
            {
              label: "א",
              text: "מצאו את משוואת הישר העובר בנקודה (1;−3) ומקביל לישר y = −5.",
              taskIds: ["eqA"],
            },
            {
              label: "ב",
              text: "מצאו את משוואת הישר העובר בנקודה (−2;0) ומקביל לישר x = 1.",
              taskIds: ["eqB"],
            },
          ],
          tasks: [
            {
              id: "eqA",
              kind: "lineEq",
              axisParallel: "x",
              point: "A",
              x: 1,
              y: -3,
              m: 0,
              b: -3,
              givenEq: "y = −5",
            },
            {
              id: "eqB",
              kind: "lineEq",
              axisParallel: "y",
              point: "B",
              x: -2,
              y: 0,
              vertical: -2,
              givenEq: "x = 1",
            },
          ],
        },
        {
          n: 17,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          lines: [
            { key: "AB", label: "", line: { m: 0, b: 3, hideEq: true } },
            { key: "BC", label: "", line: { m: -2, b: -1, eqText: "y = −2x − 1" } },
          ],
          points: [
            { label: "A", x: 8, y: 3 },
            { label: "B", x: -2, y: 3, hideX: true, hideY: true },
            { label: "C", x: -0.5, y: 0, hideX: true },
            { label: "G", x: -0.5, y: 3, hideX: true, hideY: true, drawOnly: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו קודקוד C, וגררו את רגל הגובה אל AB.",
            triangle: ["A", "B", "C"],
            heights: [{ id: "hABC", from: "C", base: ["A", "B"], footLabel: "G", recommended: true }],
          },
          parts: [
            {
              text: "במשולש ABC נתונים שיעורי הנקודה A(8;3). הצלע BC מונחת על הישר y = −2x − 1. הצלע AB מקבילה לציר ה-x. הקודקוד C נמצא על ציר ה-x. חשבו את שטח המשולש ABC.",
              taskIds: ["B", "C", "AB", "CG", "SABC"],
            },
          ],
          tasks: [
            { id: "B", label: "B", kind: "point", point: "B", missing: "both", twinY: "A", lineKey: "BC" },
            { id: "C", label: "C", kind: "point", point: "C", missing: "x", intercept: "x", lineKey: "BC" },
            { id: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "CG", kind: "segment", from: "C", to: "G", optional: true, drawHeight: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["A", "B"],
                ["C", "G"],
              ],
            },
          ],
        },
        {
          n: 18,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          lines: [
            { key: "AC", label: "", line: { m: 1, b: 3, eqText: "y = x + 3" } },
            { key: "AB", label: "", line: { vertical: 2, hideEq: true } },
            { key: "BC", label: "", line: { mn: -4, md: 5, bn: -12, bd: 5, b: -2.4, hideEq: true } },
            { key: "AD", label: "", line: { m: 0, b: 5, hideEq: true, dashed: true } },
          ],
          points: [
            { label: "A", x: 2, y: 5, hideX: true, hideY: true },
            { label: "B", x: 2, y: -4 },
            { label: "C", x: -3, y: 0, hideX: true },
            { label: "D", x: -9.25, y: 5, hideX: true, hideY: true },
            { label: "H", x: 2, y: 0, hideX: true, hideY: true, drawOnly: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "A" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו קודקוד C, וגררו את רגל הגובה אל AB.",
            triangle: ["A", "B", "C"],
            heights: [{ id: "hABC", from: "C", base: ["A", "B"], footLabel: "H", recommended: true }],
          },
          parts: [
            {
              label: "א",
              text: "משוואת הישר AC היא y = x + 3. נקודה C נמצאת על ציר ה-x. הישר AB מקביל לציר ה-y. שיעורי הנקודה B הם (2;−4). חשבו את שטח המשולש ABC.",
              taskIds: ["A", "C", "AB", "CH", "SABC"],
            },
            {
              label: "ב",
              text: "ישר העובר בנקודה A ומקביל לציר ה-x חותך את הישר BC בנקודה D. (1) מצאו את משוואת הישר BC. (2) מצאו את שיעורי הנקודה D.",
              taskIds: ["mBC", "eqBC", "D"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "both", twinX: "B", lineKey: "AC" },
            { id: "C", label: "C", kind: "point", point: "C", missing: "x", intercept: "x", lineKey: "AC" },
            { id: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "CH", kind: "segment", from: "C", to: "H", optional: true, drawHeight: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["A", "B"],
                ["C", "H"],
              ],
            },
            { id: "mBC", label: "m", kind: "slope", from: "B", to: "C" },
            { id: "eqBC", kind: "lineEq", point: "B", from: "B", to: "C", x: 2, y: -4, mn: -4, md: 5, label: "BC" },
            { id: "D", label: "D", kind: "point", point: "D", missing: "both", twinY: "A", lineKey: "BC" },
          ],
        },
      ],
    },
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
    },
    {
      id: "geo-distance-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "מרחק בין שתי נקודות",
      instruction:
        "מרחק בין שתי נקודות: d = √((x₂ − x₁)² + (y₂ − y₁)²). אפשר d או dAB. אותו סדר נקודות בשני ההפרשים. אפשר לדלג לשלבים. השורש מדויק, בלי קירוב עשרוני.",
      exercises: [
        {
          n: 1,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 6, y: 5 },
            { label: "B", x: 3, y: 1 },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "בציור מסומנות הנקודות A(6;5) ו־B(3;1). חשבו את המרחק בין הנקודה A לנקודה B.",
              taskIds: ["AB"],
            },
          ],
          tasks: [{ id: "AB", label: "AB", kind: "distance", from: "A", to: "B", subFrom: "A", subTo: "B" }],
        },
        {
          n: 2,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 6, y: 2 },
            { label: "B", x: 11, y: 14 },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [{ text: "נתונות הנקודות (6;2) ו־(11;14). חשבו את המרחק ביניהן.", taskIds: ["AB"] }],
          tasks: [{ id: "AB", label: "AB", kind: "distance", from: "A", to: "B", subFrom: "B", subTo: "A" }],
        },
        {
          n: 3,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 2, y: -3 },
            { label: "B", x: -4, y: 5 },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [{ text: "נתונות הנקודות (2;−3) ו־(−4;5). חשבו את המרחק ביניהן.", taskIds: ["AB"] }],
          tasks: [{ id: "AB", label: "AB", kind: "distance", from: "A", to: "B", subFrom: "B", subTo: "A" }],
        },
        {
          n: 4,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: -12, y: 5 },
            { label: "B", x: 0, y: 0 },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [{ text: "נתונות הנקודות (−12;5) ו־(0;0). חשבו את המרחק ביניהן.", taskIds: ["AB"] }],
          tasks: [{ id: "AB", label: "AB", kind: "distance", from: "A", to: "B", subFrom: "B", subTo: "A" }],
        },
        {
          n: 5,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 0, y: -4 },
            { label: "B", x: -8, y: 11 },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [{ text: "נתונות הנקודות (0;−4) ו־(−8;11). חשבו את המרחק ביניהן.", taskIds: ["AB"] }],
          tasks: [{ id: "AB", label: "AB", kind: "distance", from: "A", to: "B", subFrom: "B", subTo: "A" }],
        },
        {
          n: 6,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 13, y: 10 },
            { label: "B", x: 7, y: 1 },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [{ text: "נתונות הנקודות (13;10) ו־(7;1). חשבו את המרחק ביניהן.", taskIds: ["AB"] }],
          tasks: [{ id: "AB", label: "AB", kind: "distance", from: "A", to: "B", subFrom: "B", subTo: "A" }],
        },
        {
          n: 7,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: -9, y: -3 },
            { label: "B", x: -7, y: -4 },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [{ text: "נתונות הנקודות (−9;−3) ו־(−7;−4). חשבו את המרחק ביניהן.", taskIds: ["AB"] }],
          tasks: [{ id: "AB", label: "AB", kind: "distance", from: "A", to: "B", subFrom: "B", subTo: "A" }],
        },
        {
          n: 8,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 0, y: 1 },
            { label: "B", x: 3, y: 4 },
            { label: "C", x: 5, y: 1 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "A", to: "C" },
          ],
          parts: [
            {
              label: "א",
              text: "נתון משולש ABC שקודקודיו A(0;1), B(3;4), C(5;1). מצאו את אורך הצלעות AB ו־BC.",
              taskIds: ["AB", "BC"],
              stepByTask: false,
            },
            {
              label: "ב",
              text: "מצאו את אורך הצלע AC. (הערה: ניתן למצוא את אורך הצלע AC ללא שימוש בנוסחה.)",
              taskIds: ["AC"],
            },
          ],
          tasks: [
            { id: "AB", label: "AB", kind: "distance", from: "A", to: "B", subFrom: "B", subTo: "A" },
            { id: "BC", label: "BC", kind: "distance", from: "B", to: "C", subFrom: "C", subTo: "B" },
            { id: "AC", label: "AC", kind: "segment", from: "A", to: "C" },
          ],
        },
        {
          n: 9,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 8, y: -3 },
            { label: "B", x: 9, y: 4 },
            { label: "C", x: 14, y: -1 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "A", to: "C" },
          ],
          parts: [
            {
              text: "נתון משולש ABC שקודקודיו A(8;−3), C(14;−1), B(9;4). הוכיחו: AB = BC.",
              taskIds: ["AB", "BC", "eq"],
              stepByTask: false,
            },
          ],
          tasks: [
            { id: "AB", label: "AB", kind: "distance", from: "A", to: "B", subFrom: "B", subTo: "A" },
            { id: "BC", label: "BC", kind: "distance", from: "B", to: "C", subFrom: "C", subTo: "B" },
            { id: "eq", kind: "equalLen", segs: ["AB", "BC"] },
          ],
        },
        {
          n: 10,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          givenText: "y = 2x − 4, y = 3x − 10",
          lines: [
            { key: "I", label: "", line: { m: 2, b: -4, eqText: "y = 2x − 4" } },
            { key: "II", label: "", line: { m: 3, b: -10, eqText: "y = 3x − 10" } },
          ],
          points: [
            { label: "P", x: 6, y: 8, hideX: true, hideY: true },
            { label: "O", x: 0, y: 0 },
          ],
          segments: [{ from: "O", to: "P" }],
          parts: [
            {
              label: "א",
              text: "הישרים y = 2x − 4 ו־y = 3x − 10 נחתכים בנקודה P. מצאו את שיעורי הנקודה P.",
              taskIds: ["P"],
            },
            {
              label: "ב",
              text: "חשבו את המרחק של הנקודה P מראשית הצירים.",
              taskIds: ["OP"],
            },
          ],
          tasks: [
            { id: "P", kind: "lineIntersect", point: "P", label: "P", lineKey: "I" },
            { id: "OP", label: "OP", kind: "distance", from: "O", to: "P", subFrom: "P", subTo: "O" },
          ],
        },
        {
          n: 11,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: -2, y: -3 },
            { label: "B", x: 2, y: -11 },
            { label: "O", x: 0, y: 0 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "O", to: "A" },
            { from: "O", to: "B" },
          ],
          polygons: [{ verts: ["O", "A", "B"] }],
          parts: [
            {
              label: "א",
              text: "נתונות הנקודות A(−2;−3) ו־B(2;−11). מצאו את משוואת הישר העובר דרך A ו־B.",
              taskIds: ["mAB", "eqAB"],
            },
            {
              label: "ב",
              text: "חשבו את אורך הקטע AB.",
              taskIds: ["AB"],
            },
            {
              label: "ג",
              text: "O היא ראשית הצירים. חשבו את היקף המשולש OAB.",
              taskIds: ["OA", "OB", "peri"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            { id: "eqAB", kind: "lineEq", point: "A", x: -2, y: -3, m: -2, b: -7, label: "AB" },
            { id: "AB", label: "AB", kind: "distance", from: "A", to: "B", subFrom: "B", subTo: "A" },
            { id: "OA", label: "OA", kind: "distance", from: "O", to: "A", optional: true, subFrom: "A", subTo: "O" },
            { id: "OB", label: "OB", kind: "distance", from: "O", to: "B", optional: true, subFrom: "B", subTo: "O" },
            { id: "peri", kind: "perimeter", verts: ["O", "A", "B"], label: "P△OAB" },
          ],
        },
        {
          n: 12,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          line: { m: 4, b: 8, eqText: "y = 4x + 8" },
          points: [
            { label: "A", x: 0, y: 8, hideY: true },
            { label: "B", x: -2, y: 0, hideX: true },
            { label: "M", x: -1, y: 4, hideX: true, hideY: true },
            { label: "O", x: 0, y: 0 },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "O", to: "M" },
          ],
          parts: [
            {
              text: "הישר y = 4x + 8 חותך את ציר ה-y בנקודה A ואת ציר ה-x בנקודה B. הנקודה M היא אמצע הקטע AB. חשבו את המרחק של הנקודה M מראשית הצירים.",
              taskIds: ["A", "B", "M", "OM"],
            },
          ],
          tasks: [
            { id: "A", label: "A", kind: "point", point: "A", missing: "y", intercept: "y" },
            { id: "B", label: "B", kind: "point", point: "B", missing: "x", intercept: "x" },
            { id: "M", kind: "midpoint", point: "M", from: "A", to: "B" },
            { id: "OM", label: "OM", kind: "distance", from: "O", to: "M", subFrom: "M", subTo: "O" },
          ],
        },
        {
          n: 13,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          lines: [
            { key: "BE", label: "", line: { m: 0, b: 2, hideEq: true } },
            { key: "CE", label: "", line: { m: 1, b: 5, eqText: "y = x + 5" } },
          ],
          points: [
            { label: "B", x: 4, y: 2 },
            { label: "E", x: -3, y: 2, hideX: true, hideY: true },
            { label: "C", x: -5, y: 0, hideX: true },
          ],
          segments: [
            { from: "B", to: "E" },
            { from: "E", to: "C" },
          ],
          parts: [
            {
              label: "א",
              text: "הישר BE מקביל לציר ה-x. שיעורי הנקודה B הם (4;2). ישר CE עובר דרך E ומשוואתו y = x + 5. הישר חותך את ציר ה-x בנקודה C (ראו שרטוט). מצאו את שיעורי הנקודה E.",
              taskIds: ["E"],
            },
            {
              label: "ב",
              text: "חשבו את אורך הקטע BE.",
              taskIds: ["BE"],
            },
            {
              label: "ג",
              text: "מהי משוואת הישר BE?",
              taskIds: ["eqBE"],
            },
            {
              label: "ד",
              text: "מצאו את שיעורי הנקודה C, וחשבו את אורך הקטע EC.",
              taskIds: ["C", "EC"],
            },
          ],
          tasks: [
            { id: "E", label: "E", kind: "point", point: "E", missing: "both", twinY: "B", lineKey: "CE" },
            { id: "BE", label: "BE", kind: "segment", from: "B", to: "E" },
            { id: "eqBE", kind: "lineEq", axisParallel: "x", point: "B", x: 4, y: 2, m: 0, b: 2, label: "BE" },
            { id: "C", label: "C", kind: "point", point: "C", missing: "x", intercept: "x", lineKey: "CE" },
            { id: "EC", label: "EC", kind: "distance", from: "E", to: "C", subFrom: "E", subTo: "C" },
          ],
        },
        {
          n: 14,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 4, y: 9 },
            { label: "B", x: 6, y: 1 },
            { label: "C", x: 0, y: 8, hideX: true, hideY: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "A", to: "C" },
          ],
          lines: [
            { key: "AB", label: "", line: { m: -4, b: 25, hideEq: true } },
            { key: "AC", label: "", line: { m: 1 / 4, mn: 1, md: 4, b: 8, hideEq: true } },
          ],
          rightAngles: [{ at: "A", from: "B", to: "C" }],
          parts: [
            {
              text: "נתונות הנקודות A(4;9) ו־B(6;1). לישר העובר דרך A ו־B מעבירים אנך בנקודה A. האנך חותך את ציר ה-y בנקודה C. חשבו את אורך הקטע AC.",
              taskIds: ["mAB", "mAC", "eqAC", "C", "AC"],
            },
          ],
          tasks: [
            { id: "mAB", label: "m", kind: "slope", from: "A", to: "B" },
            {
              id: "mAC",
              label: "AC",
              kind: "slope",
              perpendicular: true,
              givenM: -4,
              givenLabel: "AB",
              m: 1 / 4,
              mn: 1,
              md: 4,
            },
            {
              id: "eqAC",
              kind: "lineEq",
              point: "A",
              x: 4,
              y: 9,
              m: 1 / 4,
              mn: 1,
              md: 4,
              b: 8,
              label: "AC",
            },
            { id: "C", label: "C", kind: "point", point: "C", missing: "y", intercept: "y", lineKey: "AC" },
            { id: "AC", label: "AC", kind: "distance", from: "A", to: "C", subFrom: "C", subTo: "A" },
          ],
        },
        {
          n: 15,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          lines: [
            { key: "AB", label: "", line: { m: 0, b: 2, hideEq: true } },
            { key: "BC", label: "", line: { m: 1, b: 5, eqText: "y = x + 5" } },
          ],
          points: [
            { label: "A", x: 4, y: 2 },
            { label: "B", x: -3, y: 2, hideX: true, hideY: true },
            { label: "C", x: -5, y: 0, hideX: true },
            { label: "G", x: -5, y: 2, hideX: true, hideY: true, drawOnly: true },
          ],
          segments: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "A", to: "C" },
          ],
          polygons: [{ verts: ["A", "B", "C"] }],
          draw: {
            enabled: true,
            hintText: "לחצו «+ גובה», בחרו קודקוד C, וגררו את רגל הגובה אל AB (או אל המשך הצלע).",
            triangle: ["A", "B", "C"],
            heights: [{ id: "hABC", from: "C", base: ["A", "B"], footLabel: "G", recommended: true }],
          },
          parts: [
            {
              label: "א",
              text: "במשולש ABC נתון: A(4;2). הצלע AB מקבילה לציר ה-x ומשוואת הצלע BC היא y = x + 5. הקודקוד C נמצא על ציר ה-x. חשבו את היקף המשולש ABC.",
              taskIds: ["B", "C", "AB", "BC", "AC", "peri"],
            },
            {
              label: "ב",
              text: "חשבו את שטח המשולש ABC.",
              taskIds: ["AB", "CG", "SABC"],
            },
          ],
          tasks: [
            { id: "B", label: "B", kind: "point", point: "B", missing: "both", twinY: "A", lineKey: "BC" },
            { id: "C", label: "C", kind: "point", point: "C", missing: "x", intercept: "x", lineKey: "BC" },
            { id: "AB", label: "AB", kind: "segment", from: "A", to: "B", optional: true },
            { id: "BC", label: "BC", kind: "distance", from: "B", to: "C", optional: true, subFrom: "B", subTo: "C" },
            { id: "AC", label: "AC", kind: "distance", from: "A", to: "C", optional: true, subFrom: "A", subTo: "C" },
            { id: "peri", kind: "perimeter", verts: ["A", "B", "C"], label: "P△ABC" },
            { id: "CG", kind: "segment", from: "C", to: "G", optional: true, drawHeight: true },
            {
              id: "SABC",
              label: "S△ABC",
              kind: "area",
              verts: ["A", "B", "C"],
              legs: [
                ["A", "B"],
                ["C", "G"],
              ],
            },
          ],
        },
        {
          n: 16,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 8, y: 1 },
            { label: "B", x: 16, y: 16, hideX: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "נתונה הנקודה A(8;1). הנקודה B ברביע הראשון ושיעור ה-y שלה הוא 16. מצאו את שיעורי הנקודה B, אם מרחקה מהנקודה A הוא 17.",
              taskIds: ["B"],
            },
          ],
          tasks: [
            {
              id: "B",
              kind: "distUnknown",
              from: "A",
              unknownPoint: "B",
              unknownAxis: "x",
              knownY: 16,
              givenDist: 17,
              quadrant: 1,
              roots: [0, 16],
              keep: [16],
              answers: [{ x: 16, y: 16 }],
              resultKind: "point",
            },
          ],
        },
        {
          n: 17,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: -3, y: 6 },
            { label: "B", x: 2, y: 18, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "המרחק בין הנקודות A(−3;6) ו־B(2;y) הוא 13. מצאו את y. כתבו את שתי האפשרויות.",
              taskIds: ["yB"],
            },
          ],
          tasks: [
            {
              id: "yB",
              kind: "distUnknown",
              from: "A",
              unknownPoint: "B",
              unknownAxis: "y",
              knownX: 2,
              givenDist: 13,
              roots: [18, -6],
              keep: [18, -6],
              answers: [
                { x: 2, y: 18 },
                { x: 2, y: -6 },
              ],
              resultKind: "coord",
            },
          ],
        },
        {
          n: 18,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "A", x: 8, y: 19 },
            { label: "P", x: 0, y: 25, hideX: true, hideY: true },
            { label: "Q", x: 0, y: 13, hideX: true, hideY: true },
          ],
          segments: [
            { from: "A", to: "P" },
            { from: "A", to: "Q" },
          ],
          parts: [
            {
              text: "מצאו נקודה על ציר ה-y שמרחקה מהנקודה (8;19) הוא 10.",
              taskIds: ["P"],
            },
          ],
          tasks: [
            {
              id: "P",
              kind: "distUnknown",
              from: "A",
              unknownPoint: "P",
              unknownAxis: "y",
              onAxis: "y",
              givenDist: 10,
              roots: [25, 13],
              keep: [25, 13],
              answers: [
                { x: 0, y: 25 },
                { x: 0, y: 13 },
              ],
              resultKind: "point",
            },
          ],
        },
        {
          n: 19,
          hideLineEq: true,
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              text: "המרחק בין הנקודות (6t;4t) ו־(8t;3t) הוא 10. מצאו את שני הערכים האפשריים של t.",
              taskIds: ["t"],
            },
          ],
          tasks: [
            {
              id: "t",
              kind: "distUnknown",
              letter: "t",
              fromExpr: { x: "6t", y: "4t" },
              toExpr: { x: "8t", y: "3t" },
              givenDist: 10,
              roots: [
                { n: 2, k: 5 },
                { n: -2, k: 5 },
              ],
              keep: [
                { n: 2, k: 5 },
                { n: -2, k: 5 },
              ],
              resultKind: "param",
            },
          ],
        },
        {
          n: 20,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          givenText: "הישר x = 8 והנקודה A(24;7)",
          lines: [{ key: "L", label: "", line: { vertical: 8, eqText: "x = 8" } }],
          points: [
            { label: "A", x: 24, y: 7 },
            { label: "B", x: 8, y: 19, hideY: true },
          ],
          segments: [{ from: "A", to: "B" }],
          parts: [
            {
              text: "נתונים הישר x = 8 והנקודה A(24;7). הנקודה B נמצאת על הישר ברביע הראשון. מצאו את שיעורי הנקודה B, אם ידוע שאורך הקטע AB הוא 20.",
              taskIds: ["B"],
            },
          ],
          tasks: [
            {
              id: "B",
              kind: "distUnknown",
              from: "A",
              unknownPoint: "B",
              unknownAxis: "y",
              knownX: 8,
              onVertical: 8,
              givenDist: 20,
              quadrant: 1,
              roots: [19, -5],
              keep: [19],
              answers: [{ x: 8, y: 19 }],
              resultKind: "point",
            },
          ],
        },
        {
          n: 21,
          hideLineEq: true,
          showSegments: true,
          showAxisGuides: false,
          points: [
            { label: "B", x: 10, y: 1 },
            { label: "C", x: 6, y: -3 },
            { label: "A", x: 7, y: 0, hideX: true, hideY: true },
          ],
          segments: [
            { from: "A", to: "B", dashed: true },
            { from: "A", to: "C", dashed: true },
          ],
          parts: [
            {
              text: "נתונות הנקודות B(10;1) ו־C(6;−3). מצאו שיעורי נקודה A, הממוקמת על ציר ה-x, והנמצאת במרחק שווה מהנקודות B ו־C.",
              taskIds: ["A"],
            },
          ],
          tasks: [
            {
              id: "A",
              kind: "distUnknown",
              unknownPoint: "A",
              unknownAxis: "x",
              onAxis: "x",
              knownY: 0,
              equalFrom: "B",
              equalTo: "C",
              roots: [7],
              keep: [7],
              answers: [{ x: 7, y: 0 }],
              resultKind: "point",
            },
          ],
        },
        {
          n: 22,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          givenText: "y = −4",
          lines: [{ key: "L", label: "", line: { m: 0, b: -4, eqText: "y = −4" } }],
          points: [
            { label: "B", x: 9, y: 0 },
            { label: "C", x: 11, y: -6 },
            { label: "P", x: 7, y: -4, hideX: true },
          ],
          segments: [
            { from: "P", to: "B", dashed: true },
            { from: "P", to: "C", dashed: true },
          ],
          parts: [
            {
              text: "מצאו נקודה על הישר y = −4, הנמצאת במרחק שווה מהנקודות (9;0) ו־(11;−6).",
              taskIds: ["P"],
            },
          ],
          tasks: [
            {
              id: "P",
              kind: "distUnknown",
              unknownPoint: "P",
              unknownAxis: "x",
              knownY: -4,
              yLine: { m: 0, b: -4 },
              equalFrom: "B",
              equalTo: "C",
              roots: [7],
              keep: [7],
              answers: [{ x: 7, y: -4 }],
              resultKind: "point",
            },
          ],
        },
        {
          n: 23,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          givenText: "y = x − 3",
          lines: [{ key: "L", label: "", line: { m: 1, b: -3, eqText: "y = x − 3" } }],
          points: [
            { label: "A", x: 2, y: 2 },
            { label: "B", x: 8, y: 5, hideX: true, hideY: true },
          ],
          segments: [{ from: "A", to: "B", dashed: true }],
          parts: [
            {
              text: "נתונה הנקודה A(2;2). הנקודה B נמצאת ברביע הראשון, על הישר y = x − 3. מצאו את שיעורי הנקודה B, אם ידוע שאורך הקטע AB הוא √45. הדרכה: סמנו B(t; t−3).",
              taskIds: ["B"],
            },
          ],
          tasks: [
            {
              id: "B",
              kind: "distUnknown",
              from: "A",
              unknownPoint: "B",
              letter: "t",
              yLine: { m: 1, b: -3 },
              givenDistExact: { n: 1, k: 45 },
              quadrant: 1,
              roots: [8, -1],
              keep: [8],
              answers: [{ x: 8, y: 5 }],
              resultKind: "point",
            },
          ],
        },
        {
          n: 24,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          givenText: "y = 2x",
          lines: [{ key: "L", label: "", line: { m: 2, b: 0, eqText: "y = 2x" } }],
          points: [
            { label: "A", x: 2, y: 2 },
            { label: "P", x: 7, y: 14, hideX: true, hideY: true },
            { label: "Q", x: -4.6, y: -9.2, hideX: true, hideY: true },
          ],
          segments: [
            { from: "A", to: "P", dashed: true },
            { from: "A", to: "Q", dashed: true },
          ],
          parts: [
            {
              text: "מצאו נקודה הנמצאת על הישר y = 2x שמרחקה מהנקודה (2;2) הוא 13. רשמו את שתי האפשרויות המתקבלות.",
              taskIds: ["P"],
            },
          ],
          tasks: [
            {
              id: "P",
              kind: "distUnknown",
              from: "A",
              unknownPoint: "P",
              yLine: { m: 2, b: 0 },
              givenDist: 13,
              roots: [7, { n: -23, d: 5 }],
              keep: [7, { n: -23, d: 5 }],
              answers: [
                { x: 7, y: 14 },
                { x: -23 / 5, y: -46 / 5 },
              ],
              resultKind: "point",
            },
          ],
        },
        {
          n: 25,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          givenText: "y = x + 4",
          lines: [{ key: "L", label: "", line: { m: 1, b: 4, eqText: "y = x + 4" } }],
          points: [
            { label: "A", x: 10, y: 12 },
            { label: "P", x: 16, y: 20, hideX: true, hideY: true },
            { label: "Q", x: 2, y: 6, hideX: true, hideY: true },
          ],
          segments: [
            { from: "A", to: "P", dashed: true },
            { from: "A", to: "Q", dashed: true },
          ],
          parts: [
            {
              text: "נתונה הנקודה A(10;12). על הישר y = x + 4 קיימות שתי נקודות שמרחקן מהנקודה A הוא 10. מצאו את שיעורי נקודות אלה.",
              taskIds: ["P"],
            },
          ],
          tasks: [
            {
              id: "P",
              kind: "distUnknown",
              from: "A",
              unknownPoint: "P",
              yLine: { m: 1, b: 4 },
              givenDist: 10,
              roots: [16, 2],
              keep: [16, 2],
              answers: [
                { x: 16, y: 20 },
                { x: 2, y: 6 },
              ],
              resultKind: "point",
            },
          ],
        },
        {
          n: 26,
          hideLineEq: false,
          showSegments: true,
          showAxisGuides: false,
          givenText: "y = x − 1",
          lines: [{ key: "L", label: "", line: { m: 1, b: -1, eqText: "y = x − 1" } }],
          points: [
            { label: "A", x: 5, y: 2 },
            { label: "B", x: 9, y: 4 },
            { label: "P", x: 6, y: 5, hideX: true, hideY: true },
          ],
          segments: [
            { from: "P", to: "A", dashed: true },
            { from: "P", to: "B", dashed: true },
          ],
          parts: [
            {
              text: "נתון הישר y = x − 1 ונתונות הנקודות A(5;2), B(9;4). מצאו נקודה על הישר הנמצאת במרחק שווה משתי הנקודות.",
              taskIds: ["P"],
            },
          ],
          tasks: [
            {
              id: "P",
              kind: "distUnknown",
              unknownPoint: "P",
              yLine: { m: 1, b: -1 },
              equalFrom: "A",
              equalTo: "B",
              roots: [6],
              keep: [6],
              answers: [{ x: 6, y: 5 }],
              resultKind: "point",
            },
          ],
        },
      ],
    }
  ]);
})(window);
