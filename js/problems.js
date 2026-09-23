(function (global) {
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function simplify(n, d) {
    var g = gcd(n, d);
    n /= g;
    d /= g;
    if (d < 0) {
      n = -n;
      d = -d;
    }
    return { n: n, d: d };
  }

  var topics = [
    { id: "equations", label: "משוואות בנעלם אחד" },
    { id: "quadratic", label: "משוואות ריבועיות" },
    { id: "high-power", label: "משוואות בחזקה גבוהה" },
    { id: "systems-sub", label: "מערכת משוואות" },
    { id: "percents", label: "אחוזים" },
    { id: "analytic", label: "גאומטריה אנליטית" },
    { id: "statistics", label: "סטטיסטיקה" },
  ];

  var subtopics = {
    equations: [
      { id: "basic", label: "משוואות בסיס" },
      { id: "denom", label: "משוואות עם מכנה" },
    ],
    analytic: [
      { id: "segments", label: "אורכי קטעים" },
      { id: "areas", label: "שטחים והיקפים" },
      { id: "line", label: "הישר" },
    ],
    percents: [
      { id: "find-part", label: "מציאת כמות עבור אחוז" },
      { id: "find-whole", label: "מציאת הכמות היסודית" },
      { id: "find-percent", label: "מציאת האחוז" },
    ],
    statistics: [
      { id: "freq-table", label: "טבלת שכיחויות" },
      { id: "relative-freq", label: "שכיחות יחסית" },
    ],
  };

  function generate(topicId, level, kind) {
    return DoctematicaBank.pick(level, kind || "all");
  }

  global.DoctematicaProblems = {
    topics: topics,
    subtopics: subtopics,
    generate: generate,
    simplify: simplify,
    gcd: gcd,
  };
})(window);
