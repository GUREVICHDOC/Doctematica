window.DoctematicaChecks = {
  updated: "2026-08-23",
  levelsCovered: ["משוואות בסיס רמה 1–5", "משוואות עם מכנה רמה 1–2", "משוואות ריבועיות — נוסחת שורשים"],
  active: [
    {
      id: "equivalent",
      title: "שקילות",
      what: "הצעד חייב לשמור את אותו פתרון x.",
    },
    {
      id: "solved_form",
      title: "סיום רק כש־x מבודד ומפושט",
      what: "x = מספר מצומצם (לא 8/2, לא 5+4, לא 2x=8).",
    },
    {
      id: "unreduced_fraction",
      title: "חילוק כשבר",
      what: "x=8/2 נחשב צעד חוקי, לא תשובה סופית. תשובה שגויה בשלב הזה מציינת במפורש מה לחשב (למשל 12/2).",
    },
    {
      id: "move_without_sign_flip",
      title: "העברת איבר בלי החלפת סימן",
      what: "למשל 2x-4=5 הופך ל־2x=5-4 במקום 2x=5+4.",
    },
    {
      id: "move_y_without_sign_flip",
      title: "העברת איבר עם y בלי החלפת סימן",
      what: "כמו עם x, במערכת משוואות: 5x+3y=36 הופך ל־5x=36+3y במקום 5x=36-3y.",
    },
    {
      id: "move_compute_wrong",
      title: "העברה וחישוב שגוי באותו צעד",
      what: "העבירו איבר (+/−) או כפלו/חלקו, חישבו מיד, והמספר לא נכון. למשל 2x-4=5 → 2x=8 במקום 9; 2x=8 → x=3 במקום 4; 7x=4x+12 → 2x=12 במקום 3x=12.",
    },
    {
      id: "one_side_only",
      title: "פעולה / חישוב באגף אחד",
      what: "אגף אחד לא השתנה והשני כן — שכחו לעשות את אותה פעולה בשני האגפים, או טעות בחיבור איברים באותו אגף.",
    },
    {
      id: "same_equation",
      title: "אותה משוואה שוב",
      what: "לא נחשב צעד.",
    },
  ],
  planned: [
    { id: "wrong_numerator_denominator", title: "בלבול מונה/מכנה בחילוק" },
    { id: "sign_on_divide", title: "טעות סימן בחילוק במקדם שלילי" },
    { id: "distribute", title: "פתיחת סוגריים חלקית" },
    { id: "copy_error", title: "העתקה / נפילת מינוס" },
  ],
  summary: function () {
    return this.active
      .map(function (item) {
        return item.title + " — " + item.what;
      })
      .join("\n");
  },
};
