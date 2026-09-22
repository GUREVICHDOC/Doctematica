(function (global) {
  // טבלת שכיחויות. כל סעיף מתואר לפי סוג פעולה, לא לפי מספר תרגיל.
  // identify (role: variable | frequency), scale,
  // lookup (value), sumFreq (values או where), total,
  // matchValues (where), mode (of: value | frequency),
  // weightedSum, yesNo (calc, op, value).
  // where: { on: "variable" | "frequency", op: "gt" | "lt" | "gte" | "lte" | "eq" | "in", value, values }
  // q על משימה בוחר את שורת (n) מתוך טקסט הסעיף כשאלה הפעילה. משימות של אותה שאלה חולקות q.
  // בלי q, כל טקסט הסעיף הוא השאלה הפעילה.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "stat-freq-1",
      topic: "statistics",
      subtopic: "freq-table",
      mode: "freq-table",
      title: "תרגול 1",
      instruction: "",
      exercises: [
        {
          id: "stat-freq-1-ex-a001",
          n: 1,
          stem: "בטבלה שלפניכם מתוארת התפלגות מספר ההודעות שקיבל יונתן במשך שבוע.",
          table: {
            variable: { label: "היום בשבוע" },
            frequency: { label: "מספר ההודעות" },
            rows: [
              { value: "א", freq: 15 },
              { value: "ב", freq: 9 },
              { value: "ג", freq: 30 },
              { value: "ד", freq: 14 },
              { value: "ה", freq: 25 },
              { value: "ו", freq: 18 },
            ],
          },
          parts: [
            {
              label: "א",
              text: "(1) מהי השורה המייצגת את המשתנה ומהי השורה המייצגת את השכיחות?\n(2) האם המשתנה הוא כמותי או איכותי?",
              tasks: [
                { id: "var", kind: "identify", role: "variable", q: 1 },
                { id: "freq", kind: "identify", role: "frequency", q: 1 },
                { id: "scale", kind: "scale", q: 2 },
              ],
            },
            {
              label: "ב",
              text: "כמה הודעות קיבל יונתן ביום ה'?",
              tasks: [{ id: "thu", kind: "lookup", value: "ה" }],
            },
            {
              label: "ג",
              text: "כמה הודעות קיבל יונתן בשלושת הימים הראשונים של השבוע?",
              tasks: [{ id: "first3", kind: "sumFreq", values: ["א", "ב", "ג"] }],
            },
            {
              label: "ד",
              text: "מהו היום בשבוע ששכיחות ההודעות בו היא הגדולה ביותר?",
              tasks: [{ id: "mode-day", kind: "mode" }],
            },
            {
              label: "ה",
              text: "באילו ימים קיבל יונתן יותר מ-15 הודעות?",
              tasks: [
                {
                  id: "over15",
                  kind: "matchValues",
                  where: { on: "frequency", op: "gt", value: 15 },
                },
              ],
            },
          ],
        },
        {
          id: "stat-freq-1-ex-a002",
          n: 2,
          stem: "בטבלה מתוארת התפלגות של מספר הילדים במשפחה ביישוב קרת.",
          table: {
            variable: { label: "מספר הילדים במשפחה" },
            frequency: { label: "מספר המשפחות" },
            rows: [
              { value: 0, freq: 2 },
              { value: 1, freq: 1 },
              { value: 2, freq: 6 },
              { value: 3, freq: 8 },
              { value: 4, freq: 5 },
              { value: 5, freq: 3 },
            ],
          },
          parts: [
            {
              label: "א",
              text: "איזו שורה מייצגת את המשתנה, ואיזו שורה מייצגת את השכיחות?",
              tasks: [
                { id: "var", kind: "identify", role: "variable" },
                { id: "freq", kind: "identify", role: "frequency" },
              ],
            },
            {
              label: "ב",
              text: "לכמה משפחות יש 4 ילדים?",
              tasks: [{ id: "four", kind: "lookup", value: 4 }],
            },
            {
              label: "ג",
              text: "לכמה משפחות אין ילדים?",
              tasks: [{ id: "none", kind: "lookup", value: 0 }],
            },
            {
              label: "ד",
              text: "לכמה משפחות יש פחות מ-3 ילדים?",
              tasks: [
                {
                  id: "lt3",
                  kind: "sumFreq",
                  where: { on: "variable", op: "lt", value: 3 },
                },
              ],
            },
            {
              label: "ה",
              text: "לכמה משפחות יש יותר מילד אחד?",
              tasks: [
                {
                  id: "gt1",
                  kind: "sumFreq",
                  where: { on: "variable", op: "gt", value: 1 },
                },
              ],
            },
            {
              label: "ו",
              text: "לכמה משפחות יש 2 או 3 ילדים?",
              tasks: [
                {
                  id: "two-or-three",
                  kind: "sumFreq",
                  where: { on: "variable", op: "in", values: [2, 3] },
                },
              ],
            },
            {
              label: "ז",
              text: "כמה משפחות יש ביישוב?",
              tasks: [{ id: "families", kind: "total" }],
            },
            {
              label: "ח",
              text: "יישוב המונה מעל 100 ילדים רשאי לקבל תקציב לפתיחת סניף של תנועת נוער.\nהאם ביישוב זה ניתן לקבל תקציב זה?",
              tasks: [
                {
                  id: "budget",
                  kind: "yesNo",
                  calc: { kind: "weightedSum" },
                  op: "gt",
                  value: 100,
                },
              ],
            },
            {
              label: "ט",
              text: "מהו מספר הילדים במשפחות, שבהן השכיחות היא הגבוהה ביותר?",
              tasks: [{ id: "mode-kids", kind: "mode" }],
            },
          ],
        },
      ],
    },
  ]);
})(window);
