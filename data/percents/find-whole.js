(function (global) {
  // מציאת הכמות היסודית. קודם מביעים אחוז מתוך x, ואחר כך פותרים את המשוואה.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
    {
      id: "pct-whole-1",
      topic: "percents",
      subtopic: "find-whole",
      mode: "percent",
      title: "רמה 1",
      instruction: "",
      exercises: [
        { id: "pct-whole-1-ex-a001", n: 1, stem: "נתון מספר שערכו x. הבע באמצעות x את המספר המהווה 70% מ-x.", express: true, percent: 70 },
        { id: "pct-whole-1-ex-a002", n: 2, stem: "נתון מספר שערכו x. הבע באמצעות x את המספר המהווה 15% מ-x.", express: true, percent: 15 },
        { id: "pct-whole-1-ex-a003", n: 3, stem: "נתון מספר שערכו x. הבע באמצעות x את המספר המהווה 9% מ-x.", express: true, percent: 9 },
        { id: "pct-whole-1-ex-a004", n: 4, stem: "נתון מספר שערכו x. הבע באמצעות x את המספר המהווה 160% מ-x.", express: true, percent: 160 },
        {
          id: "pct-whole-1-ex-a005",
          n: 5,
          stem: "בכיתה x תלמידים, 60% מתוכם בנים.",
          percent: 60,
          parts: [
            { label: "א", text: "הבע באמצעות x את מספר הבנים.", express: true },
            { label: "ב", text: "מצא את x, אם ידוע כי מספר הבנים הוא 21.", unknown: "all", part: 21 },
          ],
        },
        {
          id: "pct-whole-1-ex-a006",
          n: 6,
          stem: "לדליה x חוליות. 30% מהן אדומות.",
          percent: 30,
          parts: [
            { label: "א", text: "הבע באמצעות x את מספר החוליות האדומות שיש לדליה.", express: true },
            { label: "ב", text: "לדליה 6 חוליות אדומות. כמה חוליות בסך הכול יש לדליה?", unknown: "all", part: 6 },
          ],
        },
        {
          id: "pct-whole-1-ex-a007",
          n: 7,
          stem: "45% ממשכורתו של דני הם 3600 שקלים. מהי משכורתו של דני?",
          unknown: "all",
          percent: 45,
          part: 3600,
        },
        {
          id: "pct-whole-1-ex-a008",
          n: 8,
          stem: "לסוחר יש 42 בקבוקי יין על מדף מסוים. בקבוקים אלו מהווים 28% מכלל הבקבוקים שברשותו. כמה בקבוקים בסך הכול יש לסוחר?",
          unknown: "all",
          percent: 28,
          part: 42,
        },
        {
          id: "pct-whole-1-ex-a009",
          n: 9,
          stem: "שני שותפים חילקו ביניהם את הרווחים שהתקבלו ביום עבודה. האחד קיבל 55% מהרווחים, והשני קיבל 900 שקלים.",
          groups: [
            { id: "g1", label: "השותף הראשון", percent: 55 },
            { id: "g2", label: "השותף השני", amount: 900 },
          ],
          parts: [
            {
              label: "א",
              text: "איזה אחוז מהכסף קיבל השותף השני?",
              fields: [{ id: "f-percent", group: "g2", kind: "percent", label: "אחוז השותף השני", unit: "%" }],
            },
            {
              label: "ב",
              text: "מהו סכום הכסף שחולק בין השותפים?",
              unknown: "all",
              fields: [{ id: "f-all", kind: "all", label: "הסכום", unit: "₪" }],
            },
          ],
        },
        {
          id: "pct-whole-1-ex-a010",
          n: 10,
          stem: "סכום כסף חולק בין שלושה אחים. הבכור קיבל 45% מהסכום, השני קיבל 25% מהסכום והשלישי קיבל 3000 שקלים.",
          groups: [
            { id: "g1", label: "הבכור", percent: 45 },
            { id: "g2", label: "השני", percent: 25 },
            { id: "g3", label: "השלישי", amount: 3000 },
          ],
          parts: [
            {
              label: "א",
              text: "איזה אחוז מהכסף קיבל האח השלישי?",
              fields: [{ id: "f-percent", group: "g3", kind: "percent", label: "אחוז האח השלישי", unit: "%" }],
            },
            {
              label: "ב",
              text: "מצא איזה סכום כסף חולק בין האחים.",
              unknown: "all",
              fields: [{ id: "f-all", kind: "all", label: "הסכום", unit: "₪" }],
            },
          ],
        },
      ],
    },
  ]);
})(window);
