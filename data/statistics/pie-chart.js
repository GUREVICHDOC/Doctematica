(function (global) {
  // דיאגרמת עיגול: כל גזרה היא אחוז מתוך 100. נעלם נשאר ביטוי עד שהתלמיד פותר.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;

  function pie(sectors) {
    return { unit: "percent", whole: 100, sectors: sectors };
  }

  function ex(n, stem, picture, parts) {
    return {
      id: "stat-pie-1-ex-a00" + n,
      n: n,
      stem: stem,
      pie: picture,
      parts: parts,
    };
  }

  var knesset = pie([
    { label: "ג", percent: 30 },
    { label: "ד", percent: 18 },
    { label: "ה", percent: 24 },
    { label: "ו", percent: 8 },
    { label: "א", expr: "x" },
    { label: "ב", percent: 11 },
  ]);
  var city = pie([
    { label: "ד", percent: 15 },
    { label: "ג", percent: 10 },
    { label: "ב", percent: 25 },
    { label: "א", percent: 20 },
    { label: "ו", percent: 24 },
    { label: "ה", expr: "x" },
  ]);
  var council = pie([
    { label: "א", percent: 8 },
    { label: "ו", percent: 16 },
    { label: "ה", expr: "2x" },
    { label: "ד", percent: 26 },
    { label: "ג", percent: 14 },
    { label: "ב", expr: "x" },
  ]);

  C.levels = C.levels.concat([
    {
      id: "stat-pie-1",
      topic: "statistics",
      subtopic: "pie-chart",
      mode: "freq-table",
      title: "רמה 1",
      instruction: "",
      exercises: [
        ex(1, "בבחירות לכנסת התמודדו 6 רשימות. הרשימות מסומנות באותיות א, ב, ג, ד, ה, ו. תוצאות הבחירות מתוארות בדיאגרמת העיגול שלפניך.", knesset, [
          {
            label: "א",
            text: "איזה אחוז מן הקולות קיבלה רשימה א?",
            tasks: [{ id: "alef", kind: "sectorPercent", sector: "א" }],
          },
          {
            label: "ב",
            text: "האם לגוש הרשימות א, ד ו־ה יש רוב בכנסת?",
            tasks: [{ id: "bloc", kind: "majority", sectors: ["א", "ד", "ה"] }],
          },
          {
            label: "ג",
            text: "רשימות ב ו־ד הקימו גוש. מצאו רשימה מבין הרשימות האחרות, שאם היא תצטרף לגוש זה היא תיתן לו רוב בכנסת.",
            tasks: [{ id: "join", kind: "pickSector", base: ["ב", "ד"] }],
          },
        ]),
        ex(2, "בבחירות לעירייה התמודדו שש רשימות. תוצאות הבחירות מתוארות בדיאגרמת העיגול שלפניך. הרשימות מסומנות בדיאגרמה באותיות א, ב, ג, ד, ה, ו.", city, [
          {
            label: "א",
            text: "איזה אחוז מן הקולות קיבלה רשימה ה?",
            tasks: [{ id: "he", kind: "sectorPercent", sector: "ה" }],
          },
          {
            label: "ב",
            text: "האם לגוש הרשימות ג, ד ו־ה יש רוב בעירייה?",
            tasks: [{ id: "bloc", kind: "majority", sectors: ["ג", "ד", "ה"] }],
          },
          {
            label: "ג",
            text: "רשימות ב ו־ד הקימו גוש. מצאו רשימה מבין הרשימות האחרות, שאם היא תצטרף לגוש זה היא תיתן לו רוב בעירייה.",
            tasks: [{ id: "join", kind: "pickSector", base: ["ב", "ד"] }],
          },
        ]),
        ex(3, "בבחירות ליו״ר מועצת תלמידים התמודדו 6 מועמדים. תוצאות הבחירות מתוארות בדיאגרמת העיגול שלפניך. שמות המועמדים מסומנים באותיות א, ב, ג, ד, ה, ו.", council, [
          {
            label: "א",
            text: "איזה אחוז מן הקולות קיבל מועמד ב, ואיזה אחוז קיבל מועמד ה?",
            tasks: [
              { id: "bet", kind: "sectorPercent", sector: "ב" },
              { id: "he", kind: "sectorPercent", sector: "ה" },
            ],
          },
          {
            label: "ב",
            text: "האם המועמדים א, ה ו־ו קיבלו את רוב קולות הבוחרים?",
            tasks: [{ id: "bloc", kind: "majority", sectors: ["א", "ה", "ו"] }],
          },
        ]),
      ],
    },
  ]);
})(window);
