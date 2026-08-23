(function (global) {
  var EPS = 1e-8;

  function near(a, b) {
    return Math.abs(a - b) < EPS;
  }

  function sidePack(side) {
    if (side && typeof side.x === "number") {
      return { x: side.x, y: side.y, k: side.k };
    }
    return { x: side.a, y: 0, k: side.b };
  }

  function pack(eq) {
    var L = sidePack(eq.left);
    var R = sidePack(eq.right);
    return {
      lx: L.x,
      ly: L.y,
      lc: L.k,
      rx: R.x,
      ry: R.y,
      rc: R.k,
    };
  }

  function arithMoveMsg() {
    return {
      id: "move_compute_wrong",
      message:
        "נראה שהעברתם איבר לאגף השני וחישבתם באותו צעד, אבל התוצאה החשבונית לא נכונה. בדקו את החיבור או החיסור (למשל 5+4 זה 9, לא 8; 7x−4x זה 3x, לא 2x).",
    };
  }

  function arithScaleMsg() {
    return {
      id: "move_compute_wrong",
      message:
        "נראה שכפלתם או חילקתם בשני האגפים וחישבתם באותו צעד, אבל התוצאה החשבונית לא נכונה. בדקו את הכפל או החילוק (למשל 8÷2 זה 4, לא 3).",
    };
  }

  function coeffScale(oldV, newV) {
    if (near(oldV, 0) && near(newV, 0)) return { kind: "free" };
    if (near(oldV, 0) || near(newV, 0)) return { kind: "break" };
    return { kind: "s", s: newV / oldV };
  }

  function inconsistentScale(a, b) {
    var keys = ["lx", "ly", "lc", "rx", "ry", "rc"];
    var parts = keys.map(function (k) {
      return coeffScale(a[k], b[k]);
    });
    var i;
    for (i = 0; i < parts.length; i++) {
      if (parts[i].kind === "break") return false;
    }
    var scales = [];
    for (i = 0; i < parts.length; i++) {
      if (parts[i].kind === "s") scales.push(parts[i].s);
    }
    if (scales.length < 2) return false;
    var first = scales[0];
    for (i = 1; i < scales.length; i++) {
      if (!near(scales[i], first)) return true;
    }
    return false;
  }

  function fmtN(n) {
    var s = String(global.DoctematicaAlgebra.formatNumber(n)).split(" או ")[0];
    return s.replace(/-/g, "−");
  }

  function termStr(coeff, letter, plusIfPos) {
    var neg = coeff < 0;
    var abs = Math.abs(coeff);
    var sign = neg ? "−" : plusIfPos ? "+" : "";
    if (letter === "c") return sign + fmtN(abs);
    var body = near(abs, 1) ? letter : fmtN(abs) + letter;
    return sign + body;
  }

  function signFlipMsg(taken, letter) {
    var shown = termStr(taken, letter, false);
    var flipped = termStr(-taken, letter, true);
    return {
      id: letter === "c" ? "move_without_sign_flip" : "move_" + letter + "_without_sign_flip",
      message:
        "נראה שהעברתם את " +
        shown +
        " לאגף השני בלי להחליף סימן. " +
        shown +
        " שעובר אגף הופך ל־" +
        flipped +
        ".",
    };
  }

  function moveWithoutFlip(fromOld, fromNew, toOld, toNew) {
    var taken = fromOld - fromNew;
    return Math.abs(taken) > EPS && near(toNew, toOld + taken) && !near(toNew, toOld - taken);
  }

  function classifyVarMove(a, b, fromKey, toKey, letter) {
    var lk = "l" + fromKey;
    var rk = "r" + fromKey;
    var leftFlip = moveWithoutFlip(a[lk], b[lk], a["r" + toKey], b["r" + toKey]);
    var rightFlip = moveWithoutFlip(a[rk], b[rk], a["l" + toKey], b["l" + toKey]);
    if (leftFlip && rightFlip) {
      if (near(b[rk], 0) && !near(a[rk], 0)) {
        return signFlipMsg(a[rk] - b[rk], letter);
      }
      if (near(b[lk], 0) && !near(a[lk], 0)) {
        return signFlipMsg(a[lk] - b[lk], letter);
      }
    }
    if (leftFlip) return signFlipMsg(a[lk] - b[lk], letter);
    if (rightFlip) return signFlipMsg(a[rk] - b[rk], letter);
    var tFromLeft = a["l" + fromKey] - b["l" + fromKey];
    var tFromRight = a["r" + fromKey] - b["r" + fromKey];
    if (Math.abs(tFromLeft) > EPS && Math.abs(tFromRight) > EPS) {
      return arithMoveMsg();
    }
    return null;
  }

  function classify(prevEq, nextEq) {
    var a = pack(prevEq);
    var b = pack(nextEq);
    var leftSame = near(a.lx, b.lx) && near(a.ly, b.ly) && near(a.lc, b.lc);
    var rightSame = near(a.rx, b.rx) && near(a.ry, b.ry) && near(a.rc, b.rc);

    if (near(a.lx, b.lx) && near(a.ly, b.ly) && near(a.rx, b.rx) && near(a.ry, b.ry)) {
      var constMove = classifyVarMove(a, b, "c", "c", "c");
      if (constMove) return constMove;
    }

    if (near(a.ly, b.ly) && near(a.lc, b.lc) && near(a.ry, b.ry) && near(a.rc, b.rc)) {
      var xMove = classifyVarMove(a, b, "x", "x", "x");
      if (xMove) return xMove;
    }

    if (near(a.lx, b.lx) && near(a.lc, b.lc) && near(a.rx, b.rx) && near(a.rc, b.rc)) {
      var yMove = classifyVarMove(a, b, "y", "y", "y");
      if (yMove) return yMove;
    }

    if (leftSame !== rightSame) {
      return {
        id: "one_side_only",
        message:
          "השינוי נראה באגף אחד בלבד, או שיש טעות בחישוב באותו אגף (למשל איחוד 7x+3x). מה שעושים באגף אחד עושים גם בשני — או מאחדים נכון איברים באותו אגף.",
      };
    }

    if (inconsistentScale(a, b)) {
      return arithScaleMsg();
    }

    return {
      id: "not_equivalent",
      message: "הצעד לא חוקי: המשוואה החדשה אינה שקולה לקודמת.",
    };
  }

  global.DoctematicaErrors = {
    classify: classify,
  };
})(window);
