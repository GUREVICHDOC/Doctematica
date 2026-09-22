(function (global) {
  // טבלת שכיחויות. כל סעיף מתואר לפי סוג פעולה, לא לפי מספר תרגיל.
  // identify (role: variable | frequency), scale (depth: "full" לשלוש האפשרויות),
  // reason (about: "scale"),
  // lookup (value), sumFreq (values או where), total,
  // matchValues (where), mode (of: value | frequency),
  // weightedSum, yesNo (calc, op, value או against: "half"),
  // fillFreq: רשימת data וערכי משתנה בלי שכיחות. השרת סופר את השכיחויות.
  // buildFreq: table.build. התלמיד מוסיף עמודות וממלא ערך ושכיחות.
  //   כמותי: data. איכותי: entries נשארות בשרת, והסדר שלהן הוא רק סדר הפתרון של האתר.
  // where: { on: "variable" | "frequency", op: "gt" | "lt" | "gte" | "lte" | "eq" | "in" | "between", value, values, low, high }
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
        {
          id: "stat-freq-1-ex-a003",
          n: 3,
          stem: "בטבלה שלפניכם מתוארת התפלגות הציונים באמנות בכיתה מסוימת.",
          table: {
            variable: { label: "ציון" },
            frequency: { label: "מס' תלמידים" },
            rows: [
              { value: 50, freq: 4 },
              { value: 60, freq: 3 },
              { value: 70, freq: 5 },
              { value: 80, freq: 12 },
              { value: 90, freq: 6 },
              { value: 100, freq: 2 },
            ],
          },
          parts: [
            {
              label: "א",
              text: "קבעו עבור כל שורה (העליונה והתחתונה) האם היא מייצגת את המשתנה (התכונה הנבדקת) או מייצגת את השכיחות.",
              tasks: [
                { id: "var", kind: "identify", role: "variable" },
                { id: "freq", kind: "identify", role: "frequency" },
              ],
            },
            {
              label: "ב",
              text: "קבעו האם המשתנה הוא איכותי או כמותי בדיד או כמותי רציף. נמקו.",
              tasks: [
                {
                  id: "scale",
                  kind: "scale",
                  depth: "full",
                  ask: "האם המשתנה הוא איכותי או כמותי בדיד או כמותי רציף?",
                },
                { id: "why", kind: "reason", about: "scale", ask: "נמקו." },
              ],
            },
            {
              label: "ד",
              text: "כמה תלמידים קיבלו את הציון 50?",
              tasks: [{ id: "score50", kind: "lookup", value: 50 }],
            },
            {
              label: "ה",
              text: "מה השכיחות של הציון 80?",
              tasks: [{ id: "score80", kind: "lookup", value: 80 }],
            },
            {
              label: "ו",
              text: "כמה תלמידים יש סך הכול בכיתה?",
              tasks: [{ id: "class", kind: "total" }],
            },
            {
              label: "ז",
              text: "כמה תלמידים קיבלו ציון הגבוה מ-70?",
              tasks: [
                {
                  id: "above70",
                  kind: "sumFreq",
                  where: { on: "variable", op: "gt", value: 70 },
                },
              ],
            },
            {
              label: "ח",
              text: "כמה תלמידים קיבלו ציון שהוא לכל היותר 70?",
              tasks: [
                {
                  id: "atMost70",
                  kind: "sumFreq",
                  where: { on: "variable", op: "lte", value: 70 },
                },
              ],
            },
          ],
        },
        {
          id: "stat-freq-1-ex-a004",
          n: 4,
          stem: "לפניך רשימה של ציונים בתזונה שהתקבלו בכיתה מסוימת:",
          data: [9, 10, 8, 7, 7, 6, 7, 10, 8, 6, 6, 8, 7, 8, 7],
          table: {
            variable: { label: "הציון" },
            frequency: { label: "מספר התלמידים" },
            rows: [
              { value: 6 },
              { value: 7 },
              { value: 8 },
              { value: 9 },
              { value: 10 },
            ],
          },
          parts: [
            {
              label: "א",
              text: "סדר את הנתונים בטבלת השכיחויות הבאה:",
              tasks: [{ id: "fill", kind: "fillFreq" }],
            },
            {
              label: "ב",
              text: "כמה תלמידים קיבלו ציון גבוה מ-9?",
              tasks: [
                {
                  id: "above9",
                  kind: "sumFreq",
                  where: { on: "variable", op: "gt", value: 9 },
                },
              ],
            },
            {
              label: "ג",
              text: "כמה תלמידים קיבלו ציון נמוך מ-8?",
              tasks: [
                {
                  id: "below8",
                  kind: "sumFreq",
                  where: { on: "variable", op: "lt", value: 8 },
                },
              ],
            },
          ],
        },
        {
          id: "stat-freq-1-ex-a005",
          n: 5,
          stem: "לפניכם רשימה של מספר הספרים שקוראים בחודש תלמידי שכבת י בבית ספר מסוים:",
          data: [4, 3, 5, 4, 1, 0, 2, 4, 0, 3, 5, 4, 4, 1, 5, 4, 1],
          table: {
            variable: { label: "מספר הספרים" },
            frequency: { label: "מספר התלמידים" },
            rows: [
              { value: 0 },
              { value: 1 },
              { value: 2 },
              { value: 3 },
              { value: 4 },
              { value: 5 },
            ],
          },
          parts: [
            {
              label: "א",
              text: "העתיקו את טבלת השכיחויות למחברותיכם וסדרו בה את הנתונים:",
              tasks: [{ id: "fill", kind: "fillFreq" }],
            },
            {
              label: "ב",
              text: "כמה תלמידים קראו פחות מ-3 ספרים?",
              tasks: [
                {
                  id: "under3",
                  kind: "sumFreq",
                  where: { on: "variable", op: "lt", value: 3 },
                },
              ],
            },
            {
              label: "ג",
              text: "האם רוב תלמידי הכיתה קראו 4 או 5 ספרים?",
              tasks: [
                {
                  id: "most",
                  kind: "yesNo",
                  calc: { kind: "sumFreq", where: { on: "variable", op: "in", values: [4, 5] } },
                  op: "gt",
                  against: "half",
                },
              ],
            },
            {
              label: "ד",
              text: "מהו מספר התלמידים שקראו את מספר הספרים ששכיחותם היא הגבוהה ביותר?",
              tasks: [{ id: "mode-count", kind: "mode", of: "frequency" }],
            },
          ],
        },
        {
          id: "stat-freq-1-ex-a006",
          n: 6,
          stem: "לפניך רשימה של ציונים בסוציולוגיה שהתקבלו בכיתה מסוימת:",
          data: [7, 8, 2, 8, 6, 7, 2, 7, 8, 2, 7, 10, 7, 7, 8, 6],
          table: {
            build: true,
            variable: { label: "ציון", scale: "discrete" },
            frequency: { label: "מספר התלמידים" },
          },
          parts: [
            {
              label: "א",
              text: "סדר את הנתונים בטבלת שכיחויות.",
              tasks: [{ id: "build", kind: "buildFreq" }],
            },
            {
              label: "ב",
              text: "כמה תלמידים בכיתה?",
              tasks: [{ id: "class", kind: "total" }],
            },
            {
              label: "ג",
              text: "כמה תלמידים קיבלו בין 7 ל-10 (כולל)?",
              tasks: [
                {
                  id: "between",
                  kind: "sumFreq",
                  where: { on: "variable", op: "between", low: 7, high: 10 },
                },
              ],
            },
          ],
        },
        {
          id: "stat-freq-1-ex-a007",
          n: 7,
          stem: "מועדון גלישה בדק את מספר הפעמים בחודש שבו גולשים קבוצת ילדים בני 14:",
          data: [5, 4, 4, 2, 1, 5, 2, 5, 3, 2, 3, 1, 3, 2, 4, 1, 4, 4, 5, 6],
          table: {
            build: true,
            variable: { label: "מספר פעמים", scale: "discrete" },
            frequency: { label: "מספר ילדים" },
          },
          parts: [
            {
              label: "א",
              text: "סדרו את הנתונים בטבלת שכיחויות.",
              tasks: [{ id: "build", kind: "buildFreq" }],
            },
            {
              label: "ב",
              text: "כמה ילדים יש בקבוצת הגולשים?",
              tasks: [{ id: "group", kind: "total" }],
            },
            {
              label: "ג",
              text: "כמה מהילדים גולשים פחות מ-3 פעמים בחודש?",
              tasks: [
                {
                  id: "under3",
                  kind: "sumFreq",
                  where: { on: "variable", op: "lt", value: 3 },
                },
              ],
            },
          ],
        },
        {
          id: "stat-freq-1-ex-a008",
          n: 8,
          stem: "בסקר שנערך בקרב מדגם של 150 איש נשאלו המשתתפים מה לדעתם הוא המאכל הלאומי של ישראל.\nהתוצאות שהתקבלו הן: 71 איש השיבו – פלאפל, 25 איש השיבו – חומוס, 18 איש השיבו – צ'יפס, 36 איש השיבו – במבה.",
          entries: [
            { value: "פלאפל", count: 71 },
            { value: "חומוס", count: 25 },
            { value: "צ'יפס", count: 18 },
            { value: "במבה", count: 36 },
          ],
          table: {
            build: true,
            variable: { label: "מאכל", scale: "qualitative" },
            frequency: { label: "מספר אנשים" },
          },
          parts: [
            {
              label: "א",
              text: "סדרו את הנתונים בטבלת שכיחויות.",
              tasks: [{ id: "build", kind: "buildFreq" }],
            },
            {
              label: "ב",
              text: "האם המשתנה הוא כמותי או איכותי?",
              tasks: [{ id: "scale", kind: "scale" }],
            },
            {
              label: "ג",
              text: "מיהו המשתנה ששכיחותו היא הגדולה ביותר?",
              tasks: [{ id: "mode", kind: "mode" }],
            },
          ],
        },
      ],
    },
  ]);
})(window);
