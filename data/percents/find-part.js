(function (global) {
  // אחוזים. percent / 100 = part / all, והנעלם יכול לשבת בכל אחד מהמקומות.
  // כרגע unknown הוא part: ידועים האחוז והשלם, ומחפשים את החלק.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "pct-part-1",
      topic: "percents",
      subtopic: "find-part",
      mode: "percent",
      title: "רמה 1",
      instruction: "",
      exercises: [
        { id: "pct-part-1-ex-a001", n: 1, stem: "מצא כמה הם 50% מ-80.", unknown: "part", percent: 50, all: 80 },
        { id: "pct-part-1-ex-a002", n: 2, stem: "מצא כמה הם 10% מ-250.", unknown: "part", percent: 10, all: 250 },
        { id: "pct-part-1-ex-a003", n: 3, stem: "מצא כמה הם 80% מ-150.", unknown: "part", percent: 80, all: 150 },
        { id: "pct-part-1-ex-a004", n: 4, stem: "מצא כמה הם 45% מ-60.", unknown: "part", percent: 45, all: 60 },
        { id: "pct-part-1-ex-a005", n: 5, stem: "מצא כמה הם 78% מ-350.", unknown: "part", percent: 78, all: 350 },
        { id: "pct-part-1-ex-a006", n: 6, stem: "מצא כמה הם 3% מ-400.", unknown: "part", percent: 3, all: 400 },
        { id: "pct-part-1-ex-a007", n: 7, stem: "בתערוכה מוצגים 80 פסלים. 15% מהם נשברו. כמה פסלים נשברו?", unknown: "part", percent: 15, all: 80 },
        { id: "pct-part-1-ex-a008", n: 8, stem: "בגינה יש 60 פרחים. 30% מהם נבלו. כמה פרחים נבלו?", unknown: "part", percent: 30, all: 60 },
        {
          id: "pct-part-1-ex-a009",
          n: 9,
          stem: "במוזיאון ביקרו ביום מסוים 2500 איש. 80% מהם מבוגרים והשאר ילדים. כמה מבוגרים וכמה ילדים ביקרו במוזיאון?",
          all: 2500,
          groups: [
            { id: "g1", label: "מבוגרים", percent: 80 },
            { id: "g2", label: "ילדים" },
          ],
        },
        {
          id: "pct-part-1-ex-a010",
          n: 10,
          stem: "בבית קולנוע ביקרו ביום מסוים 800 איש. 35% מהם מבוגרים והשאר ילדים. כמה מבוגרים וכמה ילדים ביקרו בבית הקולנוע?",
          all: 800,
          groups: [
            { id: "g1", label: "מבוגרים", percent: 35 },
            { id: "g2", label: "ילדים" },
          ],
        },
        {
          id: "pct-part-1-ex-a011",
          n: 11,
          stem: "תמר רכשה שמלה במסגרת מכירת סוף העונה ב-80% ממחירה ההתחלתי. אם מחירה ההתחלתי של השמלה היה 180 שקלים, בכמה שקלים רכשה תמר את השמלה?",
          unknown: "part",
          percent: 80,
          all: 180,
          price: { change: "markdown", base: "initial", result: "paid" },
        },
        {
          id: "pct-part-1-ex-a012",
          n: 12,
          stem: "50 איש יצאו לצעדה. 20% מהצועדים הם ילדים, והשאר מבוגרים. מהו אחוז הצועדים המבוגרים?",
          all: 50,
          groups: [
            { id: "g1", label: "ילדים", percent: 20 },
            { id: "g2", label: "מבוגרים" },
          ],
          fields: [
            { id: "f-percent", group: "g2", kind: "percent", label: "אחוז המבוגרים", unit: "%" },
          ],
        },
        {
          id: "pct-part-1-ex-a013",
          n: 13,
          stem: "50 איש יצאו לצעדה. 20% מהצועדים הם ילדים, והשאר מבוגרים. כמה מבוגרים השתתפו בצעדה?",
          all: 50,
          groups: [
            { id: "g1", label: "ילדים", percent: 20 },
            { id: "g2", label: "מבוגרים" },
          ],
          fields: [
            { id: "f-amount", group: "g2", kind: "amount", label: "מבוגרים" },
          ],
        },
        {
          id: "pct-part-1-ex-a014",
          n: 14,
          stem: "אב הוריש לשני בניו 20000 שקלים. הבכור קיבל 60% מהסכום, ואת השאר קיבל הבן הצעיר. איזה אחוז מהירושה קיבל הבן הצעיר?",
          all: 20000,
          groups: [
            { id: "g1", label: "הבן הבכור", percent: 60 },
            { id: "g2", label: "הבן הצעיר" },
          ],
          fields: [
            { id: "f-percent", group: "g2", kind: "percent", label: "אחוז הבן הצעיר", unit: "%" },
          ],
        },
        {
          id: "pct-part-1-ex-a015",
          n: 15,
          stem: "אב הוריש לשני בניו 20000 שקלים. הבכור קיבל 60% מהסכום, ואת השאר קיבל הבן הצעיר. מהו סכום הכסף שקיבל הבן הצעיר בירושה?",
          all: 20000,
          groups: [
            { id: "g1", label: "הבן הבכור", percent: 60 },
            { id: "g2", label: "הבן הצעיר" },
          ],
          fields: [
            { id: "f-amount", group: "g2", kind: "amount", label: "סכום", unit: "₪" },
          ],
        },
        {
          id: "pct-part-1-ex-a016",
          n: 16,
          stem: "לאלעד היו 500 שקלים. 35% מכספו הוציא אלעד על קניית טלפון, 18% מכספו הוציא על בילויים ואת שאר הכסף חסך. איזה אחוז מכספו חסך?",
          all: 500,
          groups: [
            { id: "g1", label: "טלפון", percent: 35 },
            { id: "g2", label: "בילויים", percent: 18 },
            { id: "g3", label: "חיסכון" },
          ],
          fields: [
            { id: "f-percent", group: "g3", kind: "percent", label: "אחוז החיסכון", unit: "%" },
          ],
        },
        {
          id: "pct-part-1-ex-a017",
          n: 17,
          stem: "לאלעד היו 500 שקלים. 35% מכספו הוציא אלעד על קניית טלפון, 18% מכספו הוציא על בילויים ואת שאר הכסף חסך. כמה כסף חסך?",
          all: 500,
          groups: [
            { id: "g1", label: "טלפון", percent: 35 },
            { id: "g2", label: "בילויים", percent: 18 },
            { id: "g3", label: "חיסכון" },
          ],
          fields: [
            { id: "f-amount", group: "g3", kind: "amount", label: "סכום החיסכון", unit: "₪" },
          ],
        },
        {
          id: "pct-part-1-ex-a018",
          n: 18,
          stem: "סכום של 9000 שקלים חולק בין 3 שותפים. האחד קיבל 60% מהסכום, השני קיבל 15% מהסכום והשלישי קיבל את הסכום הנותר. מהו סכום הכסף שקיבל השותף הראשון?",
          all: 9000,
          groups: [
            { id: "g1", label: "השותף הראשון", percent: 60 },
            { id: "g2", label: "השותף השני", percent: 15 },
            { id: "g3", label: "השותף השלישי" },
          ],
          fields: [
            { id: "f-first", group: "g1", kind: "amount", label: "השותף הראשון", unit: "₪" },
          ],
        },
        {
          id: "pct-part-1-ex-a019",
          n: 19,
          stem: "סכום של 9000 שקלים חולק בין 3 שותפים. האחד קיבל 60% מהסכום, השני קיבל 15% מהסכום והשלישי קיבל את הסכום הנותר. איזה אחוז מהסכום קיבל השותף השלישי?",
          all: 9000,
          groups: [
            { id: "g1", label: "השותף הראשון", percent: 60 },
            { id: "g2", label: "השותף השני", percent: 15 },
            { id: "g3", label: "השותף השלישי" },
          ],
          fields: [
            { id: "f-percent", group: "g3", kind: "percent", label: "אחוז השותף השלישי", unit: "%" },
          ],
        },
        {
          id: "pct-part-1-ex-a020",
          n: 20,
          stem: "סכום של 9000 שקלים חולק בין 3 שותפים. האחד קיבל 60% מהסכום, השני קיבל 15% מהסכום והשלישי קיבל את הסכום הנותר. מהו סכום הכסף שקיבל השותף השלישי?",
          all: 9000,
          groups: [
            { id: "g1", label: "השותף הראשון", percent: 60 },
            { id: "g2", label: "השותף השני", percent: 15 },
            { id: "g3", label: "השותף השלישי" },
          ],
          fields: [
            { id: "f-third", group: "g3", kind: "amount", label: "השותף השלישי", unit: "₪" },
          ],
        },
      ],
    },
    {
      id: "pct-part-2",
      topic: "percents",
      subtopic: "find-part",
      mode: "percent",
      title: "רמה 2",
      instruction: "",
      exercises: [
        {
          id: "pct-part-2-ex-a001",
          n: 1,
          stem: "הגדילו את המספר 60 ב-20%. מהו המספר החדש?",
          quantities: [
            { id: "base", label: "המספר", value: 60 },
            { id: "next", label: "המספר החדש" },
          ],
          relations: [{ op: "increase", from: "base", to: "next", percent: 20 }],
          fields: [{ id: "f", quantity: "next", label: "המספר החדש" }],
        },
        {
          id: "pct-part-2-ex-a002",
          n: 2,
          stem: "הגדילו את המספר 180 ב-15%. מהו המספר החדש?",
          quantities: [
            { id: "base", label: "המספר", value: 180 },
            { id: "next", label: "המספר החדש" },
          ],
          relations: [{ op: "increase", from: "base", to: "next", percent: 15 }],
          fields: [{ id: "f", quantity: "next", label: "המספר החדש" }],
        },
        {
          id: "pct-part-2-ex-a003",
          n: 3,
          stem: "מחירו של בקבוק יין הוא 60 שקלים. מה יהיה מחירו של הבקבוק לאחר התייקרות של 25%?",
          quantities: [
            { id: "base", label: "המחיר", value: 60 },
            { id: "next", label: "המחיר החדש" },
          ],
          relations: [{ op: "increase", from: "base", to: "next", percent: 25 }],
          fields: [{ id: "f", quantity: "next", label: "מחיר", unit: "₪" }],
        },
        {
          id: "pct-part-2-ex-a004",
          n: 4,
          stem: "בחוג לאמנויות משתתפים 25 ילדים. במשך השנה גדל מספר הילדים ב-8%. כמה תלמידים השתתפו בחוג לאחר השינוי?",
          quantities: [
            { id: "base", label: "הילדים", value: 25 },
            { id: "next", label: "התלמידים" },
          ],
          relations: [{ op: "increase", from: "base", to: "next", percent: 8 }],
          fields: [{ id: "f", quantity: "next", label: "תלמידים" }],
        },
        {
          id: "pct-part-2-ex-a005",
          n: 5,
          stem: "מספר הבנים בכיתה הוא 15. מספר הבנות בכיתה גדול ב-20% ממספר הבנים. כמה בנות יש בכיתה?",
          quantities: [
            { id: "boys", label: "בנים", value: 15 },
            { id: "girls", label: "בנות" },
          ],
          relations: [{ op: "increase", from: "boys", to: "girls", percent: 20 }],
          fields: [{ id: "f", quantity: "girls", label: "בנות" }],
        },
        {
          id: "pct-part-2-ex-a006",
          n: 6,
          stem: "מספר הבנים בכיתה הוא 15. מספר הבנות בכיתה גדול ב-20% ממספר הבנים. כמה תלמידים יש בכיתה?",
          quantities: [
            { id: "boys", label: "בנים", value: 15 },
            { id: "girls", label: "בנות" },
            { id: "total", label: "תלמידים" },
          ],
          relations: [
            { op: "increase", from: "boys", to: "girls", percent: 20 },
            { op: "sum", of: ["boys", "girls"], to: "total" },
          ],
          fields: [{ id: "f", quantity: "total", label: "תלמידים" }],
        },
        {
          id: "pct-part-2-ex-a007",
          n: 7,
          stem: "הקטינו את המספר 35 ב-20%. מהו המספר החדש?",
          quantities: [
            { id: "base", label: "המספר", value: 35 },
            { id: "next", label: "המספר החדש" },
          ],
          relations: [{ op: "decrease", from: "base", to: "next", percent: 20 }],
          fields: [{ id: "f", quantity: "next", label: "המספר החדש" }],
        },
        {
          id: "pct-part-2-ex-a008",
          n: 8,
          stem: "הקטינו את המספר 86 ב-35%. מהו המספר החדש?",
          quantities: [
            { id: "base", label: "המספר", value: 86 },
            { id: "next", label: "המספר החדש" },
          ],
          relations: [{ op: "decrease", from: "base", to: "next", percent: 35 }],
          fields: [{ id: "f", quantity: "next", label: "המספר החדש" }],
        },
        {
          id: "pct-part-2-ex-a009",
          n: 9,
          stem: "בחנות ציפורים היו 40 תוכים. 15% מהם נמכרו. כמה תוכים נשארו בחנות לאחר המכירה?",
          quantities: [
            { id: "base", label: "התוכים", value: 40 },
            { id: "next", label: "התוכים שנשארו" },
          ],
          relations: [{ op: "decrease", from: "base", to: "next", percent: 15 }],
          fields: [{ id: "f", quantity: "next", label: "תוכים" }],
        },
        {
          id: "pct-part-2-ex-a010",
          n: 10,
          stem: "מחירו של מוצר הוא 800 שקלים. במכירת סוף העונה הוזל מחירו של המוצר ב-22%. מה היה מחירו של המוצר לאחר ההוזלה?",
          quantities: [
            { id: "base", label: "המחיר", value: 800 },
            { id: "next", label: "המחיר החדש" },
          ],
          relations: [{ op: "decrease", from: "base", to: "next", percent: 22 }],
          fields: [{ id: "f", quantity: "next", label: "מחיר", unit: "₪" }],
        },
        {
          id: "pct-part-2-ex-a011",
          n: 11,
          stem: "בבית מלון הוזמנו ביום א׳ 120 חדרים. מספר החדרים שהוזמנו ביום ב׳ היה קטן ב-30% ממספר החדרים שהוזמנו ביום א׳. כמה חדרים הוזמנו ביום ב׳?",
          quantities: [
            { id: "dayA", label: "יום א׳", value: 120 },
            { id: "dayB", label: "יום ב׳" },
          ],
          relations: [{ op: "decrease", from: "dayA", to: "dayB", percent: 30 }],
          fields: [{ id: "f", quantity: "dayB", label: "חדרים" }],
        },
        {
          id: "pct-part-2-ex-a012",
          n: 12,
          stem: "בבית מלון הוזמנו ביום א׳ 120 חדרים. מספר החדרים שהוזמנו ביום ב׳ היה קטן ב-30% ממספר החדרים שהוזמנו ביום א׳. כמה חדרים הוזמנו סך הכול במשך היומיים?",
          quantities: [
            { id: "dayA", label: "יום א׳", value: 120 },
            { id: "dayB", label: "יום ב׳" },
            { id: "total", label: "היומיים" },
          ],
          relations: [
            { op: "decrease", from: "dayA", to: "dayB", percent: 30 },
            { op: "sum", of: ["dayA", "dayB"], to: "total" },
          ],
          fields: [{ id: "f", quantity: "total", label: "חדרים" }],
        },
        {
          id: "pct-part-2-ex-a013",
          n: 13,
          stem: "במשרד נסיעות התקבלו ביום א׳ 200 הזמנות. מספר ההזמנות שהתקבלו ביום ב׳ היה נמוך ב-24% ממספר ההזמנות שהתקבלו ביום א׳. מספר ההזמנות שהתקבלו ביום ג׳ היה גבוה ב-25% ממספר ההזמנות שהתקבלו ביום ב׳. כמה הזמנות התקבלו סך הכול במשך שלושת הימים?",
          quantities: [
            { id: "dayA", label: "יום א׳", value: 200 },
            { id: "dayB", label: "יום ב׳" },
            { id: "dayC", label: "יום ג׳" },
            { id: "total", label: "שלושת הימים" },
          ],
          relations: [
            { op: "decrease", from: "dayA", to: "dayB", percent: 24 },
            { op: "increase", from: "dayB", to: "dayC", percent: 25 },
            { op: "sum", of: ["dayA", "dayB", "dayC"], to: "total" },
          ],
          fields: [{ id: "f", quantity: "total", label: "הזמנות" }],
        },
      ],
    },
  ]);
})(window);
