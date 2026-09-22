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
          id: "geo-segments-1-ex-a001",
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
          id: "geo-segments-1-ex-a002",
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
          id: "geo-segments-1-ex-a003",
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
          id: "geo-segments-1-ex-a004",
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
          id: "geo-segments-1-ex-a005",
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
          id: "geo-segments-1-ex-a006",
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
          id: "geo-segments-1-ex-a007",
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
          id: "geo-segments-1-ex-a008",
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
          id: "geo-segments-1-ex-a009",
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
          id: "geo-segments-1-ex-a010",
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
          id: "geo-segments-1-ex-a011",
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
          id: "geo-segments-1-ex-a012",
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
          id: "geo-segments-1-ex-a013",
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
          id: "geo-segments-1-ex-a014",
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
    }
  ]);
})(window);
