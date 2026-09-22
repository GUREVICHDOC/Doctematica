(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
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
          id: "geo-triangle-area-1-ex-a001",
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
          id: "geo-triangle-area-1-ex-a002",
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
          id: "geo-triangle-area-1-ex-a003",
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
          id: "geo-triangle-area-1-ex-a004",
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
          id: "geo-triangle-area-1-ex-a005",
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
          id: "geo-triangle-area-1-ex-a006",
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
          id: "geo-triangle-area-1-ex-a007",
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
          id: "geo-triangle-area-1-ex-a008",
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
          id: "geo-triangle-area-1-ex-a009",
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
          id: "geo-triangle-area-1-ex-a010",
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
          id: "geo-triangle-area-1-ex-a011",
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
          id: "geo-triangle-area-1-ex-a012",
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
          id: "geo-triangle-area-1-ex-a013",
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
    }
  ]);
})(window);
