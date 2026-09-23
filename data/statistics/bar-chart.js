(function (global) {
  // דיאגרמת עמודות היא התפלגות: ערך → שכיחות. גובה העמודה הוא השכיחות.
  // אחרי ההמרה, אותם מנועי טבלה, סכום, תנאי, שכיחות יחסית ושכיח.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;

  function chart(xLabel, yLabel, yStep, yMax, rows) {
    return {
      xLabel: xLabel,
      yLabel: yLabel,
      yStep: yStep,
      yMax: yMax,
      grid: true,
      rows: rows,
    };
  }

  function ex(n, stem, picture, parts) {
    return {
      id: "stat-bar-1-ex-a00" + n,
      n: n,
      stem: stem,
      chart: picture,
      parts: parts,
    };
  }

  var grades = chart("ציון", "מספר תלמידים", 1, 8, [
    { value: 4, freq: 2 },
    { value: 5, freq: 4 },
    { value: 6, freq: 1 },
    { value: 7, freq: 6 },
    { value: 8, freq: 3 },
    { value: 9, freq: 5 },
    { value: 10, freq: 2 },
  ]);
  var rooms = chart("מספר החדרים", "מספר המשפחות", 2, 10, [
    { value: 1, freq: 2 },
    { value: 2, freq: 7 },
    { value: 3, freq: 10 },
    { value: 4, freq: 6 },
    { value: 5, freq: 5 },
    { value: 6, freq: 3 },
    { value: 7, freq: 1 },
  ]);
  var computers = chart("הציון", "מספר התלמידים", 2, 12, [
    { value: 7, freq: 12 },
    { value: 8, freq: 3 },
    { value: 9, freq: 6 },
    { value: 10, freq: 9 },
  ]);

  C.levels = C.levels.concat([
    {
      id: "stat-bar-1",
      topic: "statistics",
      subtopic: "bar-chart",
      mode: "freq-table",
      title: "רמה 1",
      instruction: "",
      exercises: [
        ex(1, "בדיאגרמת המקולות שלפניך מתוארת התפלגות הציונים בתנ״ך בכיתה מסוימת.", grades, [
          {
            label: "א",
            text: "כמה תלמידים קיבלו את הציון 5 וכמה קיבלו את הציון 7?",
            tasks: [
              { id: "five", kind: "lookup", value: 5 },
              { id: "seven", kind: "lookup", value: 7 },
            ],
          },
          {
            label: "ב",
            text: "סדרו את הנתונים המופיעים בדיאגרמה בטבלת שכיחויות.",
            tasks: [{ id: "table", kind: "fillFreq" }],
          },
          {
            label: "ג",
            text: "כמה תלמידים בכיתה?",
            tasks: [{ id: "class", kind: "total" }],
          },
        ]),
        ex(2, "לפניך דיאגרמת מקלות המתארת את התפלגות מספר החדרים למשפחה ביישוב מסוים.", rooms, [
          {
            label: "א",
            text: "סדרו את הנתונים המופיעים בדיאגרמה בטבלת שכיחויות.",
            tasks: [{ id: "table", kind: "fillFreq" }],
          },
          {
            label: "ב",
            text: "כמה משפחות מתגוררות ביישוב?",
            tasks: [{ id: "families", kind: "total" }],
          },
          {
            label: "ג",
            text: "לכמה משפחות יש פחות מ־4 חדרים?",
            tasks: [{ id: "under4", kind: "sumFreq", where: { on: "variable", op: "lt", value: 4 } }],
          },
        ]),
        ex(3, "לפניך דיאגרמת מקלות המתארת את התפלגות הציונים במחשבים במחלקה מסוימת.", computers, [
          {
            label: "א",
            text: "כמה סטודנטים במחלקה?",
            tasks: [{ id: "dept", kind: "total" }],
          },
          {
            label: "ב",
            text: "מהי השכיחות היחסית באחוזים של הסטודנטים שקיבלו ציון בין 8 ל־10 (כולל)?",
            tasks: [{
              id: "band",
              kind: "relative",
              where: { on: "variable", op: "between", low: 8, high: 10 },
              forms: ["percent"],
            }],
          },
          {
            label: "ג",
            text: "האם השכיחות היחסית של הסטודנטים שקיבלו ציון גבוה מ־8 שווה לשכיחות היחסית של הסטודנטים שקיבלו ציון נמוך מ־9?",
            tasks: [{
              id: "same",
              kind: "compareRelative",
              left: { where: { on: "variable", op: "gt", value: 8 } },
              right: { where: { on: "variable", op: "lt", value: 9 } },
            }],
          },
        ]),
        ex(4, "לפניכם דיאגרמת עמודות המתארת את התפלגות מספר החדרים בקרב המשפחות ביישוב נרקיסים.", rooms, [
          {
            label: "א",
            text: "תארו בטבלת שכיחויות את הנתונים המופיעים בדיאגרמת העמודות.",
            tasks: [{ id: "table", kind: "fillFreq" }],
          },
          {
            label: "ב",
            text: "כמה משפחות מתגוררות ביישוב?",
            tasks: [{ id: "families", kind: "total" }],
          },
          {
            label: "ג",
            text: "לכמה משפחות יש לכל היותר 4 חדרים?",
            tasks: [{ id: "atMost4", kind: "sumFreq", where: { on: "variable", op: "lte", value: 4 } }],
          },
          {
            label: "ד",
            text: "מהו מספר החדרים שמספר המשפחות המתגוררות בו הוא הגבוה ביותר?",
            tasks: [{ id: "rooms", kind: "mode" }],
          },
          {
            label: "ה",
            text: "מועצת היישוב החליטה להעלות את תשלום הארנונה (מס עירוני) לתושבים שברשותם דירות עם 5 חדרים לפחות. מהי השכיחות היחסית של המשפחות שקיבלו העלאה בתשלום הארנונה?",
            tasks: [{ id: "raise", kind: "relative", where: { on: "variable", op: "gte", value: 5 } }],
          },
        ]),
      ],
    },
  ]);
})(window);
