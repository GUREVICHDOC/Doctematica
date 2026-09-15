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

  function simp(n, d) {
    if (!d) throw new Error("division by 0");
    var g = gcd(n, d);
    n /= g;
    d /= g;
    if (d < 0) {
      n = -n;
      d = -d;
    }
    return { n: n, d: d };
  }

  function fmt(n, d) {
    var s = typeof d === "number" ? simp(n, d) : simp(n.n, n.d);
    if (s.d === 1) return String(s.n);
    return s.n + "/" + s.d;
  }

  function add(a, b) {
    return simp(a.n * b.d + b.n * a.d, a.d * b.d);
  }

  function sub(a, b) {
    return simp(a.n * b.d - b.n * a.d, a.d * b.d);
  }

  function mul(a, b) {
    return simp(a.n * b.n, a.d * b.d);
  }

  function R(n, d) {
    return simp(n, d == null ? 1 : d);
  }

  function eqR(a, b) {
    return a.n === b.n && a.d === b.d;
  }

  function isZero(a) {
    return a.n === 0;
  }

  function isOne(a) {
    return a.n === 1 && a.d === 1;
  }

  function coeffX(a) {
    if (isZero(a)) return "0";
    if (isOne(a)) return "x";
    if (a.n === -1 && a.d === 1) return "−x";
    if (a.d === 1) return a.n + "x";
    if (a.n === 1) return "(1/" + a.d + ")x";
    if (a.n === -1) return "−(1/" + a.d + ")x";
    return "(" + fmt(a) + ")x";
  }

  function signedConst(c) {
    if (c.n >= 0) return " + " + fmt(c);
    return " − " + fmt(R(-c.n, c.d));
  }

  function linStr(a, b) {
    if (isZero(a)) return fmt(b);
    if (isZero(b)) return coeffX(a);
    return coeffX(a) + signedConst(b);
  }

  function eqStr(a, b, c, d) {
    return linStr(a, b) + " = " + linStr(c, d);
  }

  function isolateSteps(a, b, c, d) {
    var steps = [];
    var leftA = a;
    var leftB = b;
    var rightA = c;
    var rightB = d;
    function push() {
      var s = eqStr(leftA, leftB, rightA, rightB);
      if (steps.indexOf(s) === -1) steps.push(s);
    }
    push();
    if (!isZero(rightA)) {
      leftA = sub(leftA, rightA);
      rightA = R(0);
      push();
    }
    if (!isZero(leftB)) {
      rightB = sub(rightB, leftB);
      leftB = R(0);
      push();
    }
    if (!isZero(leftA) && leftA.d !== 1) {
      rightB = mul(rightB, R(leftA.d));
      leftA = R(leftA.n);
      push();
    }
    if (!isZero(leftA) && leftA.n === -1 && leftA.d === 1) {
      leftA = R(1);
      rightB = R(-rightB.n, rightB.d);
      push();
    }
    if (!isZero(leftA) && !(leftA.n === 1 && leftA.d === 1)) {
      var unN = rightB.n * leftA.d;
      var unD = rightB.d * leftA.n;
      if (unD < 0) {
        unN = -unN;
        unD = -unD;
      }
      var unreduced = "x = " + unN + "/" + unD;
      var simplified = mul(rightB, R(leftA.d, leftA.n));
      if (unD !== 1 && gcd(unN, unD) !== 1) {
        if (steps.indexOf(unreduced) === -1) steps.push(unreduced);
      }
      rightB = simplified;
      leftA = R(1);
      push();
    }
    if (!eqR(leftA, R(1)) || !isZero(leftB) || !isZero(rightA)) {
      steps.push("x = " + fmt(rightB));
    }
    return { steps: steps, x: rightB };
  }

  function item(kind, level, start, steps, x, note) {
    return {
      kind: kind,
      level: level,
      startEquation: start,
      solutionSteps: steps,
      value: x.n / x.d,
      answer: fmt(x),
      note: note || "",
    };
  }

  function fromLinear(kind, level, a, b, c, d, note) {
    var pack = isolateSteps(a, b, c, d);
    return item(kind, level, pack.steps[0], pack.steps, pack.x, note);
  }

  function factorStr(k) {
    if (isOne(k)) return "";
    if (k.n === -1 && k.d === 1) return "−";
    if (k.d === 1) return String(k.n);
    if (k.n === 1) return "(1/" + k.d + ")";
    if (k.n === -1) return "−(1/" + k.d + ")";
    return "(" + fmt(k) + ")";
  }

  function fromParens(kind, level, k, inner, rightA, rightB, note) {
    var innerPart = "(x" + signedConst(inner) + ")";
    var start = (isOne(k) ? innerPart : innerPart + factorStr(k)) + " = " + linStr(rightA, rightB);
    var expandedA = k;
    var expandedB = mul(k, inner);
    var pack = isolateSteps(expandedA, expandedB, rightA, rightB);
    var steps = [start].concat(pack.steps);
    var unique = [];
    steps.forEach(function (s) {
      if (unique.indexOf(s) === -1) unique.push(s);
    });
    return item(kind, level, start, unique, pack.x, note);
  }

  var KINDS = [
    { id: "all", label: "הכל" },
    { id: "integers", label: "שלמים" },
    { id: "half", label: "חצי" },
    { id: "quarter", label: "רבע" },
    { id: "both", label: "שני אגפים" },
    { id: "parens", label: "סוגריים" },
  ];

  function build() {
    var out = [];
    var seen = {};

    function addItem(it) {
      if (!it) return;
      var id = it.level + "|" + it.startEquation;
      if (seen[id]) return;
      if (!isFinite(it.value)) return;
      seen[id] = true;
      out.push({
        kind: it.kind,
        level: it.level,
        startEquation: it.startEquation,
      });
    }

    var xs = [-8, -6, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
    var bs = [-9, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9];
    var as = [2, 3, 4, 5, 6, 7, 8];

    as.forEach(function (a) {
      xs.forEach(function (x) {
        bs.forEach(function (b) {
          var level = Math.abs(x) <= 8 && a <= 6 ? "easy" : "medium";
          addItem(fromLinear("integers", level, R(a), R(b), R(0), R(a * x + b)));
          if (a >= 4) {
            addItem(fromLinear("integers", "hard", R(a), R(b), R(0), R(a * x + b)));
          }
        });
      });
    });

    [1, 2, 3, 4, 5, 6, 8, 10, 12, -2, -4, -6, -8].forEach(function (x) {
      bs.forEach(function (b) {
        addItem(
          fromLinear("half", "easy", R(1, 2), R(b), R(0), add(mul(R(1, 2), R(x)), R(b)))
        );
        addItem(
          fromLinear("half", "medium", R(1, 2), R(b), R(0), add(mul(R(1, 2), R(x)), R(b)))
        );
        addItem(
          fromLinear("half", "hard", R(3, 2), R(b), R(0), add(mul(R(3, 2), R(x)), R(b)))
        );
      });
    });

    [1, 2, 3, 4, 5, 6, 8].forEach(function (x) {
      [-2, -1, 1, 2, 3, 5].forEach(function (bN) {
        addItem(fromLinear("half", "easy", R(2), R(bN, 2), R(0), add(mul(R(2), R(x)), R(bN, 2))));
        addItem(fromLinear("half", "medium", R(3), R(1, 2), R(0), add(mul(R(3), R(x)), R(1, 2))));
        addItem(fromLinear("half", "hard", R(2), R(1, 2), R(1), add(mul(R(2), R(x)), R(1, 2))));
      });
    });

    [4, 8, 12, -4, -8, 0, 2, 6, -2].forEach(function (x) {
      if (x === 0) return;
      bs.forEach(function (b) {
        addItem(
          fromLinear("quarter", "easy", R(1, 4), R(b), R(0), add(mul(R(1, 4), R(x)), R(b)))
        );
        addItem(
          fromLinear("quarter", "medium", R(1, 4), R(b), R(0), add(mul(R(1, 4), R(x)), R(b)))
        );
        addItem(
          fromLinear("quarter", "hard", R(3, 4), R(b), R(0), add(mul(R(3, 4), R(x)), R(b)))
        );
      });
    });

    [1, 2, 3, 4, 5, 6].forEach(function (x) {
      addItem(fromLinear("quarter", "easy", R(2), R(1, 4), R(0), add(mul(R(2), R(x)), R(1, 4))));
      addItem(fromLinear("quarter", "medium", R(4), R(3, 4), R(0), add(mul(R(4), R(x)), R(3, 4))));
      addItem(fromLinear("quarter", "hard", R(1, 2), R(1, 4), R(0), add(mul(R(1, 2), R(x)), R(1, 4))));
      addItem(fromLinear("half", "easy", R(4), R(0), R(0), R(x, 2)));
      addItem(fromLinear("quarter", "easy", R(4), R(0), R(0), R(x)));
    });

    [2, 3, 4, 5, 6].forEach(function (a1) {
      [1, 2, 3].forEach(function (a2) {
        if (a1 === a2) return;
        xs.forEach(function (x) {
          bs.slice(0, 8).forEach(function (b1) {
            var left = add(mul(R(a1), R(x)), R(b1));
            var b2 = sub(left, mul(R(a2), R(x)));
            addItem(fromLinear("both", "medium", R(a1), R(b1), R(a2), b2));
            addItem(fromLinear("both", "hard", R(a1), R(b1), R(a2), b2));
          });
        });
      });
    });

    [2, 4, 6, 8, -2, -4].forEach(function (x) {
      [-3, -1, 1, 3, 5].forEach(function (b1) {
        addItem(fromLinear("both", "medium", R(1, 2), R(b1), R(1, 4), sub(add(mul(R(1, 2), R(x)), R(b1)), mul(R(1, 4), R(x)))));
        addItem(fromLinear("both", "hard", R(3, 4), R(b1), R(1, 4), sub(add(mul(R(3, 4), R(x)), R(b1)), mul(R(1, 4), R(x)))));
        addItem(fromLinear("both", "easy", R(3), R(b1), R(1), sub(add(mul(R(3), R(x)), R(b1)), R(x))));
      });
    });

    [2, 3, 4, 5].forEach(function (k) {
      [-5, -3, -2, -1, 1, 2, 3, 4, 5].forEach(function (inner) {
        xs.slice(6).forEach(function (x) {
          var right = mul(R(k), add(R(x), R(inner)));
          addItem(fromParens("parens", "easy", R(k), R(inner), R(0), right));
          addItem(fromParens("parens", "medium", R(k), R(inner), R(0), right));
        });
      });
    });

    [2, 3, 4].forEach(function (k) {
      [1, 2, 3, -1, -2].forEach(function (inner) {
        [1, 2, 3, 5, 6, 8].forEach(function (x) {
          var leftVal = mul(R(k), add(R(x), R(inner)));
          [1, 2].forEach(function (aRight) {
            var bRight = sub(leftVal, mul(R(aRight), R(x)));
            addItem(fromParens("parens", "hard", R(k), R(inner), R(aRight), bRight));
          });
        });
      });
    });

    [2, 4, 6, 8, -2, 10].forEach(function (x) {
      [2, 4, -2, 6].forEach(function (inner) {
        addItem(fromParens("half", "hard", R(1, 2), R(inner), R(0), mul(R(1, 2), add(R(x), R(inner)))));
        addItem(fromParens("quarter", "hard", R(1, 4), R(inner), R(0), mul(R(1, 4), add(R(x), R(inner)))));
        addItem(fromParens("parens", "medium", R(1, 2), R(inner), R(0), mul(R(1, 2), add(R(x), R(inner)))));
      });
    });

    [1, 3, 5, 7, 9].forEach(function (odd) {
      addItem(fromLinear("half", "medium", R(2), R(0), R(0), R(odd)));
      addItem(fromLinear("quarter", "hard", R(4), R(0), R(0), R(odd)));
    });

    return out;
  }

  var ALL = build();
  var queues = {};

  function key(level, kind) {
    return level + "|" + kind;
  }

  function listFor(level, kind) {
    return ALL.filter(function (it) {
      if (it.level !== level) return false;
      if (!kind || kind === "all") return true;
      return it.kind === kind;
    });
  }

  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copy[i];
      copy[i] = copy[j];
      copy[j] = t;
    }
    return copy;
  }

  function pick(level, kind) {
    var k = key(level, kind || "all");
    if (!queues[k] || !queues[k].length) queues[k] = shuffle(listFor(level, kind || "all"));
    var chosen = queues[k].pop();
    if (!chosen) {
      queues[k] = shuffle(ALL.filter(function (it) { return it.level === level; }));
      chosen = queues[k].pop() || ALL[Math.floor(Math.random() * ALL.length)];
    }
    return {
      mode: "steps",
      prompt: chosen.startEquation,
      startEquation: chosen.startEquation,
      kind: chosen.kind,
      explain: "בודדו את x בצעדים שקולים עד שמתקבלת משוואה מהצורה x = מספר.",
    };
  }

  function counts() {
    var map = {};
    ALL.forEach(function (it) {
      var id = it.level + "/" + it.kind;
      map[id] = (map[id] || 0) + 1;
    });
    return { total: ALL.length, by: map };
  }

  function ratFromFloat(x) {
    if (Math.abs(x) < 1e-12) return R(0);
    for (var d = 1; d <= 64; d++) {
      var n = Math.round(x * d);
      if (Math.abs(x * d - n) < 1e-8) return R(n, d);
    }
    var den = 1000;
    return R(Math.round(x * den), den);
  }

  function solutionForEquation(start) {
    var path = global.DoctematicaTeach.fullPath(start);
    var steps = path.steps.map(function (s) {
      return s.eq;
    });
    var value = 0;
    try {
      var eqText =
        global.DoctematicaTeach.eqHasVarDenom && global.DoctematicaTeach.eqHasVarDenom(start)
          ? global.DoctematicaTeach.toClearedEquation(start)
          : start;
      var eq = DoctematicaAlgebra.parseEquation(eqText);
      var d = eq.left.a - eq.right.a;
      if (d) value = (eq.right.b - eq.left.b) / d;
    } catch (e) {}
    return {
      steps: steps,
      notes: path.steps.map(function (s) {
        return s.explain;
      }),
      answer: path.answer,
      value: value,
    };
  }

  global.DoctematicaBank = {
    kinds: KINDS,
    pick: pick,
    counts: counts,
    all: ALL,
    solutionForEquation: solutionForEquation,
  };
})(window);
