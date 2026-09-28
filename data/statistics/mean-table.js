(function (global) {
  // ממוצע מטבלת שכיחויות. זיהוי השורה וסכום השכיחויות נשארים במנוע הטבלה.
  // הממוצע עצמו הוא Σ(x·f) / Σf.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;

  function table(variable, frequency, pairs) {
    return {
      variable: { label: variable },
      frequency: { label: frequency },
      rows: pairs.map(function (pair) {
        return { value: pair[0], freq: pair[1] };
      }),
    };
  }

  C.levels = C.levels.concat([
    {
      id: "stat-mean-table-1",
      topic: "statistics",
      subtopic: "mean",
      mode: "freq-table",
      title: "ממוצע מתוך טבלה – רמה 1",
      instruction: "",
      exercises: [
        {
          id: "stat-mean-table-1-ex-a001",
          n: 1,
          stem: "בטבלה שלפניך מתוארת התפלגות הציונים של תלמידים בכיתה מסוימת.",
          table: table("ציון", "מספר התלמידים", [[5, 4], [6, 7], [7, 18], [8, 7], [9, 4]]),
          parts: [
            {
              label: "א",
              text: "קבע איזו משתי השורות מתארת את השכיחות f.",
              tasks: [{ id: "freq", kind: "identify", role: "frequency" }],
            },
            {
              label: "ב",
              text: "מצא את מספר התלמידים בכיתה.",
              tasks: [{ id: "total", kind: "total" }],
            },
            {
              label: "ג",
              text: "חשב את הציון הממוצע.",
              tasks: [{ id: "mean", kind: "mean" }],
            },
          ],
        },
        {
          id: "stat-mean-table-1-ex-a002",
          n: 2,
          stem: "בטבלה שלפניך מתוארת התפלגות מספר הילדים במשפחה ביישוב בצפון.",
          table: table("מספר הילדים במשפחה", "מספר המשפחות", [[0, 8], [1, 2], [2, 5], [3, 7]]),
          parts: [
            {
              label: "א",
              text: "קבע איזו משתי השורות מתארת את השכיחות.",
              tasks: [{ id: "freq", kind: "identify", role: "frequency" }],
            },
            {
              label: "ב",
              text: "חשב את מספר הילדים הממוצע למשפחה ביישוב.",
              tasks: [{ id: "mean", kind: "mean" }],
            },
          ],
        },
        {
          id: "stat-mean-table-1-ex-a003",
          n: 3,
          stem: "בדקו את מספר דוחות התנועה שקיבלו נהגי אוטובוסים ומצאו את ההתפלגות הבאה.",
          table: table("מספר הדוחות", "מספר הנהגים", [[0, 4], [1, 5], [2, 6], [3, 5], [4, 4], [5, 8]]),
          parts: [
            {
              label: "",
              text: "חשב את ממוצע מספר דוחות התנועה שקיבל כל נהג.",
              tasks: [{ id: "mean", kind: "mean" }],
            },
          ],
        },
        {
          id: "stat-mean-table-1-ex-a004",
          n: 4,
          stem: "בבדיקה של קופסאות גפרורים התקבלה התפלגות מספר הגפרורים הפגומים בכל קופסה.",
          table: table("מספר הגפרורים הפגומים בכל קופסה", "מספר הקופסאות", [[0, 3], [1, 4], [2, 5], [3, 6], [4, 7]]),
          parts: [
            {
              label: "",
              text: "חשב את ממוצע מספר הגפרורים הפגומים בקופסה.",
              tasks: [{ id: "mean", kind: "mean" }],
            },
          ],
        },
        {
          id: "stat-mean-table-1-ex-a005",
          n: 5,
          stem: "מועצת היישוב מרגלית החליטה להכין מתקני חנייה לאופניים. בטבלה מתוארת התפלגות מספר זוגות האופניים שיש לכל משפחה ביישוב.",
          table: table("מספר זוגות אופניים", "מספר המשפחות", [[0, 31], [1, 68], [2, 15], [3, 20], [4, 28], [5, 18]]),
          parts: [
            {
              label: "א",
              text: "איזו שורה מתארת את המשתנה, ואיזו שורה מתארת את השכיחות?",
              tasks: [
                { id: "var", kind: "identify", role: "variable", ask: "איזו שורה מתארת את המשתנה?" },
                { id: "freq", kind: "identify", role: "frequency", ask: "איזו שורה מתארת את השכיחות?" },
              ],
            },
            {
              label: "ב",
              text: "מהו מספר המשפחות ביישוב מרגלית?",
              tasks: [{ id: "families", kind: "total" }],
            },
            {
              label: "ג",
              text: "מהו מספר זוגות האופניים ביישוב?",
              tasks: [{ id: "pairs", kind: "weightedSum" }],
            },
            {
              label: "ד",
              text: "חשבו את ממוצע מספר זוגות האופניים שיש לכל משפחה.",
              tasks: [{ id: "mean", kind: "mean" }],
            },
          ],
        },
        {
          id: "stat-mean-table-1-ex-a006",
          n: 6,
          stem: "במבחן השתתפו 15 נבחנים, והתקבלו הציונים הבאים:",
          data: [8, 10, 6, 4, 6, 6, 7, 5, 9, 8, 8, 9, 7, 7, 8],
          table: {
            build: true,
            variable: { label: "ציון", scale: "discrete" },
            frequency: { label: "מספר הנבחנים" },
          },
          parts: [
            {
              label: "א",
              text: "סדר את הציונים בטבלת שכיחויות.",
              tasks: [{ id: "build", kind: "buildFreq" }],
            },
            {
              label: "ב",
              text: "חשב את הציון הממוצע.",
              tasks: [{ id: "mean", kind: "mean" }],
            },
            {
              label: "ג",
              text: "שלושה תלמידים שלא השתתפו במבחן קיבלו כל אחד את הציון 8. מצא את ממוצע הציונים לאחר ההצטרפות.",
              tasks: [{ id: "joined", kind: "mean", add: [{ value: 8, freq: 3 }] }],
            },
          ],
        },
        {
          id: "stat-mean-table-1-ex-a007",
          n: 7,
          stem: "ביישוב מסוים יש 25 משפחות. בטבלה מתוארת התפלגות מספר הילדים במשפחה באותו יישוב.",
          table: table("מספר הילדים במשפחה", "מספר המשפחות", [[1, 6], [2, 4], [3, 5], [4, "x"]]),
          parts: [
            {
              label: "א",
              text: "קבעו מהו המשתנה ומהו סוג המשתנה: איכותי, כמותי בדיד או כמותי רציף.",
              tasks: [
                { id: "var", kind: "identify", role: "variable", ask: "מהו המשתנה?" },
                { id: "scale", kind: "scale", depth: "full", ask: "מהו סוג המשתנה?" },
              ],
            },
            {
              label: "ב",
              text: "האם מספר הילדים הממוצע למשפחה ביישוב יכול להיות מספר לא שלם?",
              tasks: [{ id: "fraction", kind: "yesNo", expect: "yes", miss: "ממוצע יכול להיות שבר גם כשכל הנתונים שלמים." }],
            },
            {
              label: "ג",
              text: "מהו מספר הילדים הממוצע למשפחה ביישוב?",
              tasks: [
                { id: "missing", kind: "meanUnknown", unknown: "count", total: 25, ask: "השלימו את השכיחות החסרה. ביישוב 25 משפחות." },
                { id: "mean", kind: "mean", ask: "חשבו את מספר הילדים הממוצע למשפחה." },
              ],
            },
            {
              label: "ד",
              text: "מצרפים ליישוב משפחה שבה 3 ילדים. האם הממוצע עלה, ירד או לא השתנה?",
              tasks: [{ id: "shift", kind: "meanShift", add: [{ value: 3, freq: 1 }] }],
            },
          ],
        },
      ],
    },
  ]);
})(typeof window !== "undefined" ? window : global);
