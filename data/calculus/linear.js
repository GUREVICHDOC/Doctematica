(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "calc-linear-1",
      topic: "calculus",
      subtopic: "intro",
      mode: "fn",
      title: "פונקציה ממעלה ראשונה",
      instruction:
        "הציבו בפונקציה וחשבו. נקודה על הגרף נרשמת כזוג סדור. תחום נרשם כאי־שוויון, למשל x > −7, או כ־כל x / אין.",
      exercises: [
        {
          id: "calc-linear-1-ex-a001",
          n: 1,
          fn: "x+7",
          marks: [-8, 3],
          stem: "לפניכם גרף הפונקציה f(x) = x + 7.",
          parts: [
            { label: "א", text: "חשבו את f(3).", taskIds: ["f3"] },
            { label: "ב", text: "מצאו נקודה שבה x = −8, ונמצאת על גרף הפונקציה.", taskIds: ["pt"] },
            { label: "ג", text: "מהי הנקודה הנמצאת על הגרף, שבה מתקיים f(x) = 0?", taskIds: ["zero"] },
            { label: "ד", text: "רשמו את תחומי החיוביות והשליליות של הפונקציה.", taskIds: ["sign"] },
            { label: "ה", text: "רשמו את תחומי העלייה והירידה של הפונקציה (אם ישנם).", taskIds: ["mono"] },
          ],
          tasks: [
            { id: "f3", kind: "fnValue", at: 3 },
            { id: "pt", kind: "fnPoint", at: -8 },
            { id: "zero", kind: "fnZero" },
            { id: "sign", kind: "fnSign" },
            { id: "mono", kind: "fnMono" },
          ],
        },
        {
          id: "calc-linear-1-ex-a002",
          n: 2,
          fn: "-x-2",
          stem: "נתונה הפונקציה f(x) = −x − 2.",
          parts: [
            { label: "א", text: "מצאו את תחומי העלייה והירידה של הפונקציה (אם ישנם).", taskIds: ["mono"] },
            { label: "ב", text: "מצאו את נקודות החיתוך של הפונקציה עם הצירים.", taskIds: ["axes"] },
            { label: "ג", text: "שרטטו את גרף הפונקציה.", taskIds: ["sketch"] },
            { label: "ד", text: "מצאו את תחומי החיוביות והשליליות של הפונקציה (אם ישנם).", taskIds: ["sign"] },
            { label: "ה", text: "האם הנקודה (−10;−8) נמצאת על הגרף?", taskIds: ["on"] },
          ],
          tasks: [
            { id: "mono", kind: "fnMono" },
            { id: "axes", kind: "fnIntercepts" },
            { id: "sketch", kind: "fnSketch" },
            { id: "sign", kind: "fnSign" },
            { id: "on", kind: "fnOn", x: -10, y: -8 },
          ],
        },
        {
          id: "calc-linear-1-ex-a003",
          n: 3,
          fn: "1",
          stem: "נתונה הפונקציה f(x) = 1.",
          parts: [
            {
              label: "א",
              text: "קבעו האם הפונקציה היא פונקציה שעולה לכל x, פונקציה שיורדת לכל x, או פונקציה קבועה שלא עולה ולא יורדת.",
              taskIds: ["mono"],
            },
            { label: "ב", text: "שרטטו את גרף הפונקציה.", taskIds: ["sketch"] },
            { label: "ג", text: "מצאו את תחומי החיוביות והשליליות של הפונקציה (אם ישנם).", taskIds: ["sign"] },
            {
              label: "ד",
              text: "האם נכונה הטענה שקיימים אינסוף ערכי x, שעבורם ערך הפונקציה f(x) הוא 1?",
              taskIds: ["claim"],
            },
          ],
          tasks: [
            { id: "mono", kind: "fnMono" },
            { id: "sketch", kind: "fnSketch" },
            { id: "sign", kind: "fnSign" },
            { id: "claim", kind: "fnClaim", value: 1, quant: "infinite" },
          ],
        },
      ],
    },
  ]);
})(window);
