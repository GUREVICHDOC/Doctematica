(function (global) {
  var EPS = 1e-8;

  function near(a, b) {
    return Math.abs(a - b) < EPS;
  }

  function pack(eq) {
    return {
      lx: eq.left.a,
      lc: eq.left.b,
      rx: eq.right.a,
      rc: eq.right.b,
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
    var parts = [
      coeffScale(a.lx, b.lx),
      coeffScale(a.lc, b.lc),
      coeffScale(a.rx, b.rx),
      coeffScale(a.rc, b.rc),
    ];
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

  function classify(prevEq, nextEq) {
    var a = pack(prevEq);
    var b = pack(nextEq);
    var leftSame = near(a.lx, b.lx) && near(a.lc, b.lc);
    var rightSame = near(a.rx, b.rx) && near(a.rc, b.rc);

    if (near(a.lx, b.lx) && near(a.rx, b.rx)) {
      var tFromLeft = a.lc - b.lc;
      if (
        Math.abs(tFromLeft) > EPS &&
        near(b.rc, a.rc + tFromLeft) &&
        !near(b.rc, a.rc - tFromLeft)
      ) {
        return {
          id: "move_without_sign_flip",
          message:
            "נראה שהעברתם איבר (מספר) לאגף השני בלי להחליף סימן. כשמעבירים איבר, פלוס הופך למינוס ומינוס לפלוס.",
        };
      }
      var tFromRight = a.rc - b.rc;
      if (
        Math.abs(tFromRight) > EPS &&
        near(b.lc, a.lc + tFromRight) &&
        !near(b.lc, a.lc - tFromRight)
      ) {
        return {
          id: "move_without_sign_flip",
          message:
            "נראה שהעברתם איבר (מספר) לאגף השני בלי להחליף סימן. כשמעבירים איבר, פלוס הופך למינוס ומינוס לפלוס.",
        };
      }
      if (Math.abs(tFromLeft) > EPS && Math.abs(tFromRight) > EPS) {
        return arithMoveMsg();
      }
    }

    if (near(a.lc, b.lc) && near(a.rc, b.rc)) {
      var xFromLeft = a.lx - b.lx;
      if (
        Math.abs(xFromLeft) > EPS &&
        near(b.rx, a.rx + xFromLeft) &&
        !near(b.rx, a.rx - xFromLeft)
      ) {
        return {
          id: "move_x_without_sign_flip",
          message:
            "נראה שהעברתם איבר עם x לאגף השני בלי להחליף סימן. 4x שעובר שמאלה הופך ל־−4x.",
        };
      }
      var xFromRight = a.rx - b.rx;
      if (
        Math.abs(xFromRight) > EPS &&
        near(b.lx, a.lx + xFromRight) &&
        !near(b.lx, a.lx - xFromRight)
      ) {
        return {
          id: "move_x_without_sign_flip",
          message:
            "נראה שהעברתם איבר עם x לאגף השני בלי להחליף סימן. 4x שעובר שמאלה הופך ל־−4x.",
        };
      }
      if (Math.abs(xFromLeft) > EPS && Math.abs(xFromRight) > EPS) {
        return arithMoveMsg();
      }
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
