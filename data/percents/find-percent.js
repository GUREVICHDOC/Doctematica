(function (global) {
  // מציאת האחוז. החלק והשלם ידועים, והנעלם הוא האחוז.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "pct-percent-1",
      topic: "percents",
      subtopic: "find-percent",
      mode: "percent",
      title: "רמה 1",
      instruction: "",
      exercises: [
        { id: "pct-percent-1-ex-a001", n: 1, stem: "איזה אחוז מהווים 6 מתוך 24?", unknown: "percent", part: 6, all: 24 },
        { id: "pct-percent-1-ex-a002", n: 2, stem: "איזה אחוז מהווים 8 מתוך 20?", unknown: "percent", part: 8, all: 20 },
        { id: "pct-percent-1-ex-a003", n: 3, stem: "איזה אחוז מהווים 18 מתוך 40?", unknown: "percent", part: 18, all: 40 },
        { id: "pct-percent-1-ex-a004", n: 4, stem: "איזה אחוז מהווים 3 מתוך 50?", unknown: "percent", part: 3, all: 50 },
        { id: "pct-percent-1-ex-a005", n: 5, stem: "איזה אחוז מהווים 39 מתוך 120?", unknown: "percent", part: 39, all: 120 },
        { id: "pct-percent-1-ex-a006", n: 6, stem: "איזה אחוז מהווים 1 מתוך 20?", unknown: "percent", part: 1, all: 20 },
        {
          id: "pct-percent-1-ex-a007",
          n: 7,
          stem: "בכיתה 40 תלמידים. 25 מהם יצאו לטיול השנתי. מהו אחוז התלמידים שיצאו לטיול השנתי?",
          unknown: "percent",
          part: 25,
          all: 40,
        },
        {
          id: "pct-percent-1-ex-a008",
          n: 8,
          stem: "מחירו של מינוי לתיאטרון הוא 600 שקלים. במבצע ניתנה הנחה של 150 שקלים. מהו אחוז ההנחה שניתן במבצע?",
          unknown: "percent",
          part: 150,
          all: 600,
        },
        {
          id: "pct-percent-1-ex-a009",
          n: 9,
          stem: "בין שני אחים חולקו 1500 שקלים. האח הבכור קיבל 900 שקלים. איזה אחוז מהסכום קיבל כל אחד מן האחים?",
          all: 1500,
          shares: [
            { id: "g1", label: "הבכור", amount: 900 },
            { id: "g2", label: "האח השני" },
          ],
          fields: [
            { id: "f1", share: "g1", kind: "percent", label: "אחוז הבכור", unit: "%" },
            { id: "f2", share: "g2", kind: "percent", label: "אחוז האח השני", unit: "%" },
          ],
        },
        {
          id: "pct-percent-1-ex-a010",
          n: 10,
          stem: "בבית חולים מסוים עובדים 80 רופאים. 52 מתוכם הם רופאים בכירים והשאר מתמחים.",
          parts: [
            {
              label: "א",
              text: "כמה מתמחים עובדים בבית החולים?",
              compute: { op: "sub", a: 80, b: 52 },
            },
            {
              label: "ב",
              text: "מהו אחוז המתמחים?",
              unknown: "percent",
              part: 28,
              all: 80,
              complement: 52,
            },
          ],
        },
        {
          id: "pct-percent-1-ex-a011",
          n: 11,
          stem: "מבין המועמדים למחלקה לביוטכנולוגיה באוניברסיטה מסוימת התקבלו 40 סטודנטים ו-160 נדחו. מהו אחוז הסטודנטים שלא התקבלו למחלקה?",
          unknown: "percent",
          part: 160,
          wholeSum: [40, 160],
          complement: 40,
        },
        {
          id: "pct-percent-1-ex-a012",
          n: 12,
          stem: "למיכל היו 3000 שקלים. 900 שקלים היא הוציאה על קניית מוצרי איפור ואת כל השאר חסכה. כמה אחוזים מכספה חסכה מיכל?",
          unknown: "percent",
          all: 3000,
          rest: 900,
        },
      ],
    },
  ]);
})(typeof window !== "undefined" ? window : global);
