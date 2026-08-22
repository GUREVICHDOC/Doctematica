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
    { id: "equations", label: "משוואות" },
    { id: "equations-denom", label: "משוואות עם מכנה" },
  ];

  function generate(topicId, level, kind) {
    return DoctematicaBank.pick(level, kind || "all");
  }

  global.DoctematicaProblems = {
    topics: topics,
    generate: generate,
    simplify: simplify,
    gcd: gcd,
  };
})(window);
