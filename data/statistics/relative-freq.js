(function (global) {
  // שכיחות יחסית. כל שאלה בספר היא תרגיל אחד, והסעיפים שלה נשארים יחד. המנוע הכללי מחשב f/N.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  var grades = {
    variable: { label: "הציון" },
    frequency: { label: "מספר התלמידים" },
    rows: [
      { value: 9, freq: 7 },
      { value: 8, freq: 20 },
      { value: 7, freq: 13 },
      { value: 6, freq: 8 },
      { value: 5, freq: 2 },
    ],
  };
  var scores = {
    variable: { label: "הציון" },
    frequency: { label: "מספר התלמידים" },
    rows: [
      { value: 10, freq: 3 },
      { value: 9, freq: 8 },
      { value: 8, freq: 14 },
      { value: 7, freq: 9 },
      { value: 6, freq: 4 },
      { value: 5, freq: 2 },
    ],
  };
  var cars = {
    variable: { label: "מספר המכוניות" },
    frequency: { label: "מספר המשפחות" },
    rows: [
      { value: 4, freq: 1 },
      { value: 3, freq: 8 },
      { value: 2, freq: 5 },
      { value: 1, freq: 6 },
      { value: 0, freq: 3 },
    ],
  };
  function ex(n, stem, table, parts) {
    var num = n < 10 ? "00" + n : "0" + n;
    return {
      id: "stat-rel-1-ex-a" + num,
      n: n,
      stem: stem,
      table: table,
      parts: parts,
    };
  }
  function ex2(n, stem, table, parts) {
    var num = n < 10 ? "00" + n : "0" + n;
    return {
      id: "stat-rel-2-ex-a" + num,
      n: n,
      stem: stem,
      table: table,
      parts: parts,
    };
  }
  C.levels = C.levels.concat([
    {
      id: "stat-rel-1",
      topic: "statistics",
      subtopic: "relative-freq",
      mode: "freq-table",
      title: "רמה 1",
      instruction: "",
      exercises: [
        ex(1, "בטבלה שלפניך מתוארת התפלגות הציונים במחשבים בכיתה מסוימת.", grades, [
          {
            label: "א",
            text: "כמה תלמידים יש בכיתה?",
            tasks: [{ id: "n", kind: "total" }],
          },
          {
            label: "ב",
            text: "כמה תלמידים קיבלו את הציון 9?",
            tasks: [{ id: "nine", kind: "lookup", value: 9 }],
          },
          {
            label: "ג",
            text: "מהי השכיחות היחסית של התלמידים שקיבלו את הציון 9 (כתוב את התוצאה גם בשבר פשוט וגם באחוזים)?",
            tasks: [{ id: "rel9", kind: "relative", value: 9, forms: ["fraction", "percent"] }],
          },
          {
            label: "ד",
            text: "מהי השכיחות היחסית של התלמידים שקיבלו את הציון 8?",
            tasks: [{ id: "rel8", kind: "relative", value: 8 }],
          },
        ]),
        ex(2, "במבחן במינהל ציבורי התקבלה התפלגות הציונים הבאה.", scores, [
          {
            label: "א",
            text: "חשב את מספר התלמידים בכיתה.",
            tasks: [{ id: "n", kind: "total" }],
          },
          {
            label: "ב",
            text: "השלם את הטבלה.",
            tasks: [{ id: "fill", kind: "fillRelative", forms: ["fraction", "percent"] }],
          },
        ]),
        ex(3, "בטבלה שלפניך מתוארת התפלגות של מספר המכוניות הפרטיות שיש למשפחות ביישוב מסוים.", cars, [
          {
            label: "א",
            text: "קבע איזו משתי השורות מתארת את השכיחות f.",
            tasks: [{ id: "freq", kind: "identify", role: "frequency" }],
          },
          {
            label: "ב",
            text: "מהי השכיחות היחסית של המשפחות שיש להן מכונית אחת?",
            tasks: [{ id: "one", kind: "relative", value: 1 }],
          },
          {
            label: "ג",
            text: "מהי השכיחות היחסית של המשפחות שאין להן מכוניות?",
            tasks: [{ id: "none", kind: "relative", value: 0 }],
          },
          {
            label: "ד",
            text: "מהי השכיחות היחסית של המשפחות שיש להן יותר מ־2 מכוניות?",
            tasks: [{ id: "more", kind: "relative", where: { on: "variable", op: "gt", value: 2 } }],
          },
          {
            label: "ה",
            text: "מהי השכיחות היחסית של המשפחות שיש להן פחות מ־3 מכוניות?",
            tasks: [{ id: "fewer", kind: "relative", where: { on: "variable", op: "lt", value: 3 } }],
          },
        ]),
        ex(4, "בטבלה שלפניכם מתוארת התפלגות הציונים במחשבים בכיתה מסוימת.", {
          variable: { label: "הציון" },
          frequency: { label: "מספר התלמידים" },
          rows: [
            { value: 50, freq: 2 },
            { value: 60, freq: 8 },
            { value: 70, freq: 13 },
            { value: 80, freq: 20 },
            { value: 90, freq: 7 },
          ],
        }, [
          { label: "א", text: "כמה תלמידים יש בכיתה?", tasks: [{ id: "n", kind: "total" }] },
          { label: "ב", text: "כמה תלמידים קיבלו את הציון 90?", tasks: [{ id: "top", kind: "lookup", value: 90 }] },
          {
            label: "ג",
            text: "חשבו את השכיחות היחסית של התלמידים שקיבלו את הציון 90. כתבו את התוצאה בשבר פשוט ובשבר עשרוני.",
            tasks: [{ id: "rel90", kind: "relative", value: 90, forms: ["fraction", "decimal"] }],
          },
          {
            label: "ד",
            text: "חשבו את השכיחות היחסית של התלמידים שקיבלו את הציון 80. כתבו את התוצאה בשבר פשוט ובאחוזים.",
            tasks: [{ id: "rel80", kind: "relative", value: 80, forms: ["fraction", "percent"] }],
          },
          {
            label: "ה",
            text: "חשבו את השכיחות היחסית באחוזים של התלמידים שקיבלו ציון 70 לפחות.",
            tasks: [{ id: "least70", kind: "relative", where: { on: "variable", op: "gte", value: 70 }, forms: ["percent"] }],
          },
          {
            label: "ו",
            text: "ציון נמוך מ־60 נחשב נכשל. מהי השכיחות היחסית באחוזים של התלמידים שנכשלו?",
            tasks: [{ id: "fail", kind: "relative", where: { on: "variable", op: "lt", value: 60 }, forms: ["percent"] }],
          },
        ]),
        ex(5, "במבחן מיון התקבלה התפלגות הציונים הבאה.", {
          variable: { label: "הציון" },
          frequency: { label: "מספר התלמידים" },
          rows: [
            { value: 50, freq: 2 },
            { value: 60, freq: 4 },
            { value: 70, freq: 9 },
            { value: 80, freq: 14 },
            { value: 90, freq: 8 },
            { value: 100, freq: 3 },
          ],
        }, [
          { label: "א", text: "מצאו את מספר הנבחנים הכולל במבחן.", tasks: [{ id: "n", kind: "total" }] },
          {
            label: "ב",
            text: "העתיקו את הטבלה למחברתכם. (1) השלימו את שורות השכיחות היחסית בשבר פשוט ובשבר עשרוני. (2) השלימו את שורת השכיחות היחסית באחוזים.",
            tasks: [{ id: "fill", kind: "fillRelative", forms: ["fraction", "decimal", "percent"] }],
          },
        ]),
        ex(6, "באזור מסוים בדקו את צבעי הפרחים בערוגות. התוצאות מוצגות בטבלה.", {
          variable: { label: "צבע הפרח", scale: "qualitative" },
          frequency: { label: "מספר הפרחים" },
          rows: [
            { value: "אדום", freq: 8 },
            { value: "צהוב", freq: 18 },
            { value: "כחול", freq: 14 },
            { value: "ורוד", freq: 18 },
            { value: "לבן", freq: 22 },
          ],
        }, [
          {
            label: "א",
            text: "מהו המשתנה? האם הוא איכותי או כמותי?",
            tasks: [
              { id: "var", kind: "identify", role: "variable" },
              { id: "scale", kind: "scale" },
            ],
          },
          { label: "ב", text: "מהו הצבע ששכיחותו היא הגבוהה ביותר?", tasks: [{ id: "mode", kind: "mode" }] },
          { label: "ג", text: "מהו הצבע ששכיחותו היחסית היא הגבוהה ביותר?", tasks: [{ id: "relMode", kind: "mode" }] },
          {
            label: "ד",
            text: "מהי השכיחות היחסית בשבר פשוט של הצבע ששכיחותו היא הנמוכה ביותר?",
            tasks: [{ id: "low", kind: "relative", of: "minFreq", forms: ["fraction"] }],
          },
        ]),
        ex(7, "ביישוב קטן מתגוררות 23 משפחות. בטבלה מתוארת התפלגות מספר המכוניות הפרטיות שיש למשפחות.", {
          variable: { label: "מספר המכוניות במשפחה" },
          frequency: { label: "מספר המשפחות" },
          population: 23,
          ratios: [{ left: 1, right: 3, parts: [3, 4] }],
          rows: [
            { value: 0, freq: 3 },
            { value: 1 },
            { value: 2, freq: 5 },
            { value: 3 },
            { value: 4, freq: 1 },
          ],
        }, [
          {
            label: "א",
            text: "היחס בין מספר המשפחות שיש להן מכונית אחת לבין מספר המשפחות שיש להן 3 מכוניות הוא 3:4. סמנו את השכיחויות החסרות בנעלם ומצאו לכמה משפחות יש 3 מכוניות.",
            tasks: [{ id: "recover", kind: "recoverFreq", value: 3 }],
          },
          {
            label: "ב",
            text: "מהי השכיחות היחסית של המשפחות שיש להן מכונית אחת?",
            tasks: [{ id: "one", kind: "relative", value: 1 }],
          },
          {
            label: "ג",
            text: "מהי השכיחות היחסית של המשפחות שיש להן פחות מ־3 מכוניות?",
            tasks: [{ id: "fewer", kind: "relative", where: { on: "variable", op: "lt", value: 3 } }],
          },
          {
            label: "ד",
            text: "מהו מספר המכוניות במשפחה ששכיחותה היחסית היא הגדולה ביותר?",
            tasks: [{ id: "peak", kind: "mode" }],
          },
        ]),
      ],
    },
    {
      id: "stat-rel-2",
      topic: "statistics",
      subtopic: "relative-freq",
      mode: "freq-table",
      title: "רמה 2",
      instruction: "",
      exercises: [
        ex2(1, "בטבלה שלפניך מתוארת התפלגות הציונים של תלמידים בכיתה מסוימת. ידוע שהשכיחות היחסית של התלמידים שקיבלו ציון 7 היא 2/5.", {
          variable: { label: "הציון" },
          frequency: { label: "מספר התלמידים" },
          givenRelative: { value: 7, num: 2, den: 5 },
          rows: [
            { value: 7, freq: 10 },
            { value: 8, freq: "x" },
            { value: 9, freq: 8 },
            { value: 10, freq: 2 },
          ],
        }, [
          {
            label: "א",
            text: "מצאו את מספר התלמידים בכיתה.",
            tasks: [{ id: "n", kind: "freqBalance", goal: "total" }],
          },
          {
            label: "ב",
            text: "מצאו את x.",
            tasks: [{ id: "x", kind: "freqBalance", goal: "missing" }],
          },
        ]),
        ex2(2, "בטבלה שלפניך מתוארת התפלגות הציונים של תלמידים בכיתה מסוימת. השכיחות היחסית של התלמידים שקיבלו ציון 6 היא 20%.", {
          variable: { label: "הציון" },
          frequency: { label: "מספר התלמידים" },
          givenRelative: { value: 6, percent: 20 },
          rows: [
            { value: 4, freq: 2 },
            { value: 5, freq: 1 },
            { value: 6, freq: 6 },
            { value: 7, freq: "x" },
            { value: 8, freq: 6 },
            { value: 9, freq: 5 },
            { value: 10, freq: 3 },
          ],
        }, [
          {
            label: "א",
            text: "חשבו את מספר התלמידים בכיתה.",
            tasks: [{ id: "n", kind: "freqBalance", goal: "total" }],
          },
          {
            label: "ב",
            text: "חשבו את מספר התלמידים שקיבלו ציון 7.",
            tasks: [{ id: "x", kind: "freqBalance", goal: "missing" }],
          },
          {
            label: "ג",
            text: "מהי השכיחות היחסית של התלמידים שקיבלו ציון 9?",
            tasks: [{ id: "nine", kind: "relative", value: 9 }],
          },
        ]),
        ex2(3, "בטבלה שלפניך מתוארת התפלגות מספר הילדים במשפחה ביישוב מסוים. ידוע שהשכיחות היחסית של המשפחות שיש בהן 5 ילדים היא 15%.", {
          variable: { label: "מספר הילדים במשפחה" },
          frequency: { label: "מספר המשפחות" },
          givenRelative: { value: 5, percent: 15 },
          rows: [
            { value: 1, freq: 3 },
            { value: 2, freq: "x" },
            { value: 3, freq: 5 },
            { value: 4, freq: 2 },
            { value: 5, freq: 3 },
          ],
        }, [
          {
            label: "א",
            text: "מצאו את מספר המשפחות ביישוב.",
            tasks: [{ id: "n", kind: "freqBalance", goal: "total" }],
          },
          {
            label: "ב",
            text: "מצאו את מספר המשפחות שבהן יש 2 ילדים.",
            tasks: [{ id: "x", kind: "freqBalance", goal: "missing" }],
          },
          {
            label: "ג",
            text: "מצאו את השכיחות היחסית באחוזים של המשפחות שבהן יותר מ־2 ילדים במשפחה.",
            tasks: [{ id: "more", kind: "relative", where: { on: "variable", op: "gt", value: 2 }, forms: ["percent"] }],
          },
          {
            label: "ד",
            text: "מצאו את השכיחות היחסית באחוזים של המשפחות שבהן פחות מ־2 ילדים במשפחה.",
            tasks: [{ id: "fewer", kind: "relative", where: { on: "variable", op: "lt", value: 2 }, forms: ["percent"] }],
          },
        ]),
        ex2(4, "בטבלה שלפניך מתוארת התפלגות מספר האיחורים של תלמידים בכיתה מסוימת במשך שנה. השכיחות היחסית של התלמידים שאיחרו 7 פעמים היא 0.425.", {
          variable: { label: "מספר האיחורים" },
          frequency: { label: "מספר התלמידים" },
          givenRelative: { value: 7, decimal: 0.425 },
          rows: [
            { value: 4, freq: 2 },
            { value: 5, freq: 1 },
            { value: 6, freq: 6 },
            { value: 7, freq: "x" },
            { value: 8, freq: 6 },
            { value: 9, freq: 5 },
            { value: 10, freq: 3 },
          ],
        }, [
          {
            label: "א",
            text: "מצאו את x ואת מספר התלמידים שנבדקו.",
            tasks: [{ id: "both", kind: "freqBalance", goal: "both" }],
          },
          {
            label: "ב",
            text: "התלמידים שאיחרו 9 פעמים השתפרו, ובמהלך שנה נוספת לא איחרו כלל. לתלמיד שאיחר לפחות 9 פעמים במהלך השנה מורידים ציון בתלמידות. חשבו את השכיחות היחסית של התלמידים שהורידו להם ציון בתלמידות.",
            tasks: [{
              id: "moved",
              kind: "relative",
              where: { on: "variable", op: "gte", value: 9 },
              transfer: { from: 9, to: 0, count: 5 },
            }],
          },
        ]),
      ],
    },
  ]);
})(typeof window !== "undefined" ? window : global);
