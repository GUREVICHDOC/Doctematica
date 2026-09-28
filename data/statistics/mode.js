(function (global) {
  // שכיח: הערך ששכיחותו מקסימלית. רשימה, טבלה ודיאגרמה מגיעות לאותה התפלגות.
  // select: בוחרים את הערכים. adjust: משנים שכיחות של ערך ואז מחשבים שכיח מחדש.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;

  function ex(n, stem, extra, parts) {
    var item = {
      id: "stat-mode-1-ex-a00" + n,
      n: n,
      stem: stem,
      parts: parts,
    };
    Object.keys(extra || {}).forEach(function (key) { item[key] = extra[key]; });
    return item;
  }

  var grades = {
    xLabel: "ציון",
    yLabel: "מספר תלמידים",
    yStep: 1,
    yMax: 8,
    grid: true,
    rows: [
      { value: 4, freq: 2 },
      { value: 5, freq: 4 },
      { value: 6, freq: 1 },
      { value: 7, freq: 6 },
      { value: 8, freq: 3 },
      { value: 9, freq: 5 },
      { value: 10, freq: 2 },
    ],
  };

  C.levels = C.levels.concat([
    {
      id: "stat-mode-1",
      topic: "statistics",
      subtopic: "mode",
      mode: "freq-table",
      title: "רמה 1",
      instruction: "",
      exercises: [
        ex(1, "לפניך שתי רשימות. מצאו את השכיח בכל אחת.", null, [
          {
            label: "א",
            text: "לפניך רשימה של ציונים בכימיה שהתקבלו בכיתה מסוימת. מהו הציון השכיח? נמק.",
            tasks: [{
              id: "grades",
              kind: "mode",
              select: true,
              variable: "הציון",
              frequency: "מספר התלמידים",
              data: [9, 8, 8, 8, 5, 8, 9, 7, 8, 9, 5, 8],
            }],
          },
          {
            label: "ב",
            text: "לפניך רשימה של מספר הטלפונים הסלולריים שיש למשפחות ביישוב מסוים. מהו מספר הטלפונים השכיח?",
            tasks: [{
              id: "phones",
              kind: "mode",
              select: true,
              variable: "מספר הטלפונים",
              frequency: "מספר המשפחות",
              data: [2, 4, 4, 5, 5, 2, 2, 1, 4, 3, 3, 4, 5],
            }],
          },
        ]),
        ex(2, "בטבלה שלפניך מתוארת התפלגות הציונים בפיסיקה בכיתה מסוימת.", {
          table: {
            variable: { label: "הציון" },
            frequency: { label: "מספר התלמידים" },
            rows: [
              { value: 6, freq: 5 },
              { value: 7, freq: 8 },
              { value: 8, freq: 7 },
              { value: 9, freq: 6 },
              { value: 10, freq: 3 },
            ],
          },
        }, [
          {
            label: "",
            text: "מהו הציון השכיח? נמק.",
            tasks: [{ id: "grade", kind: "mode", select: true }],
          },
        ]),
        ex(3, "בטבלה שלפניך מתוארת התפלגות מספר החדרים שיש למשפחות ביישוב מסוים.", {
          table: {
            variable: { label: "מספר החדרים" },
            frequency: { label: "מספר המשפחות" },
            rows: [
              { value: 1, freq: 20 },
              { value: 2, freq: 40 },
              { value: 3, freq: 200 },
              { value: 4, freq: 300 },
              { value: 5, freq: 120 },
              { value: 6, freq: 5 },
            ],
          },
        }, [
          {
            label: "",
            text: "מהו מספר החדרים השכיח?",
            tasks: [{ id: "rooms", kind: "mode", select: true }],
          },
        ]),
        ex(4, "בטבלה שלפניך מתוארת התפלגות מספר המכוניות הפרטיות שיש למשפחות ביישוב מסוים.", {
          table: {
            variable: { label: "מספר המכוניות" },
            frequency: { label: "מספר המשפחות" },
            rows: [
              { value: 0, freq: 2 },
              { value: 1, freq: 18 },
              { value: 2, freq: 18 },
              { value: 3, freq: 16 },
              { value: 4, freq: 9 },
            ],
          },
        }, [
          {
            label: "",
            text: "מהו מספר המכוניות השכיח?",
            tasks: [{ id: "cars", kind: "mode", select: true }],
          },
        ]),
        ex(5, "לפניך דיאגרמת מקלות המתארת את התפלגות הציונים בתנ״ך של קבוצת תלמידים.", { chart: grades }, [
          {
            label: "א",
            text: "מהו הציון השכיח?",
            tasks: [{ id: "score", kind: "mode", select: true }],
          },
          {
            label: "ב",
            text: "מהו השכיח, אם יצטרפו לקבוצה ארבעה תלמידים שכל אחד מהם קיבל 8?",
            tasks: [{ id: "joined", kind: "mode", select: true, adjust: { value: 8, delta: 4 } }],
          },
        ]),
        ex(6, "לפניך דיאגרמת מקלות המתארת את התפלגות מספר החדרים למשפחה ביישוב מסוים.", {
          chart: {
            xLabel: "מספר החדרים",
            yLabel: "מספר המשפחות",
            yStep: 2,
            yMax: 10,
            grid: true,
            rows: [
              { value: 1, freq: 2 },
              { value: 2, freq: 7 },
              { value: 3, freq: 7 },
              { value: 4, freq: 6 },
              { value: 5, freq: 5 },
              { value: 6, freq: 3 },
              { value: 7, freq: 1 },
            ],
          },
        }, [
          {
            label: "א",
            text: "מהו מספר החדרים השכיח במשפחה?",
            tasks: [{ id: "rooms", kind: "mode", select: true }],
          },
          {
            label: "ב",
            text: "היישוב מעוניין לבנות דירות שבהן יש 6 חדרים. מהו מספר הדירות הנוסף המינימלי שיש לבנות כדי שהשכיח יהיה 6 חדרים?",
            tasks: [{ id: "build", kind: "modeRaise", value: 6, unique: true }],
          },
        ]),
        ex(7, "בטבלה שלפניך מתוארת התפלגות הציונים של תלמידים בכיתה מסוימת.", {
          table: {
            variable: { label: "ציון" },
            frequency: { label: "מספר התלמידים" },
            rows: [
              { value: 5, freq: 10 },
              { value: 6, freq: 15 },
              { value: 7, freq: 27 },
              { value: 8, freq: 8 },
            ],
          },
        }, [
          {
            label: "א",
            text: "מהי השכיחות היחסית של התלמידים שקיבלו ציון 6?",
            tasks: [{ id: "rel", kind: "relative", value: 6 }],
          },
          {
            label: "ב",
            text: "מה הציון השכיח? נמק.",
            tasks: [{ id: "grade", kind: "mode", select: true }],
          },
        ]),
        ex(8, "בטבלה שלפניך מתוארת התפלגות הגבהים בס״מ בכיתה מסוימת.", {
          table: {
            variable: { label: "גובה" },
            frequency: { label: "מספר תלמידים" },
            rows: [
              { value: 130, freq: 7 },
              { value: 135, freq: 10 },
              { value: 140, freq: "x" },
              { value: 145, freq: 8 },
              { value: 150, freq: 6 },
            ],
          },
        }, [
          {
            label: "א",
            text: "מצא את x, אם ידוע שהגבהים השכיחים הם 135 ס״מ ו־140 ס״מ.",
            tasks: [{ id: "tie", kind: "modeSet", values: [135, 140] }],
          },
          {
            label: "ב",
            text: "לאילו ערכים של x יהיה 140 ס״מ השכיח היחיד?",
            tasks: [{ id: "only", kind: "modeBound", value: 140, unique: true }],
          },
        ]),
        ex(9, "בטבלה שלפניך מתוארת התפלגות משכורותיהם החודשיות של עובדים במפעל מסוים. השכיחות היחסית של העובדים המשתכרים 7000 שקלים היא 8%.", {
          table: {
            variable: { label: "המשכורת החודשית" },
            frequency: { label: "מספר העובדים" },
            givenRelative: { value: 7000, percent: 8 },
            rows: [
              { value: 5000, freq: 6 },
              { value: 5500, freq: "x" },
              { value: 6000, freq: 20 },
              { value: 6500, freq: 9 },
              { value: 7000, freq: 4 },
              { value: 7500, freq: 1 },
            ],
          },
        }, [
          {
            label: "א",
            text: "חשב את מספר העובדים במפעל.",
            tasks: [{ id: "workers", kind: "freqBalance", goal: "total" }],
          },
          {
            label: "ב",
            text: "מהי השכיחות היחסית של העובדים המשתכרים 5000 שקלים?",
            tasks: [{ id: "low", kind: "relative", value: 5000 }],
          },
          {
            label: "ג",
            text: "מהי המשכורת השכיחה?",
            tasks: [{ id: "pay", kind: "mode", select: true }],
          },
        ]),
      ],
    },
  ]);
})(window);
