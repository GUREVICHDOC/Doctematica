(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
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
          id: "geo-axis-lines-1-ex-a001",
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
          id: "geo-axis-lines-1-ex-a002",
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
          id: "geo-axis-lines-1-ex-a003",
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
          id: "geo-axis-lines-1-ex-a004",
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
          id: "geo-axis-lines-1-ex-a005",
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
          id: "geo-axis-lines-1-ex-a006",
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
          id: "geo-axis-lines-1-ex-a007",
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
          id: "geo-axis-lines-1-ex-a008",
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
          id: "geo-axis-lines-1-ex-a009",
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
          id: "geo-axis-lines-1-ex-a010",
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
          id: "geo-axis-lines-1-ex-a011",
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
    }
  ]);
})(window);
