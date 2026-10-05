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

  function normRaw(text) {
    return String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/[×·]/g, "*")
      .replace(/\s+/g, "");
  }

  function splitInnerTerms(inner) {
    var s = String(inner || "").replace(/[−–—]/g, "-");
    var terms = [];
    var start = 0;
    var i;
    for (i = 1; i < s.length; i++) {
      var c = s.charAt(i);
      var prev = s.charAt(i - 1);
      if ((c === "+" || c === "-") && prev !== "*" && prev !== "/" && prev !== "(") {
        terms.push(s.slice(start, i));
        start = i;
      }
    }
    terms.push(s.slice(start));
    return terms.filter(function (t) {
      return t && t !== "+" && t !== "-";
    });
  }

  function parseBinTerm(term) {
    var t = String(term || "").replace(/\s+/g, "");
    var sign = 1;
    if (t.charAt(0) === "+") t = t.slice(1);
    else if (t.charAt(0) === "-") {
      sign = -1;
      t = t.slice(1);
    }
    var mx = t.match(/^(\d*)x$/i);
    if (mx) return { x: true, n: sign * (mx[1] ? parseInt(mx[1], 10) : 1) };
    var mc = t.match(/^(\d+)(?:\/(\d+))?$/);
    if (!mc) return null;
    var mag = mc[2] ? Number(mc[1]) / Number(mc[2]) : Number(mc[1]);
    return { x: false, n: sign * mag, factor: mc[2] ? mc[1] + "/" + mc[2] : mc[1] };
  }

  function formatBin(terms) {
    var s = "";
    var i;
    for (i = 0; i < terms.length; i++) {
      var n = terms[i].n;
      var abs = Math.abs(n);
      var body = terms[i].x ? (near(abs, 1) ? "x" : fmtN(abs) + "x") : fmtN(abs);
      if (i === 0) s += (n < 0 ? "-" : "") + body;
      else s += (n < 0 ? "-" : "+") + body;
    }
    return s;
  }

  function showCoef(n) {
    return (n < 0 ? "−" : "") + fmtN(Math.abs(n));
  }

  function findDistribGroups(eq) {
    var src = normRaw(eq);
    var re = /([+-]?)(\d*)\(([^()]+)\)/g;
    var groups = [];
    var m;
    while ((m = re.exec(src))) {
      var inner = m[3];
      if (/^\d+\+\d+\/\d+$/.test(inner)) continue;
      if (!/[+-]/.test(inner.replace(/^-/, ""))) continue;
      var parts = splitInnerTerms(inner);
      var terms = [];
      var ok = true;
      var i;
      for (i = 0; i < parts.length; i++) {
        var one = parseBinTerm(parts[i]);
        if (!one) ok = false;
        else terms.push(one);
      }
      if (!ok || terms.length < 2) continue;
      var sign = m[1] === "-" ? -1 : 1;
      var mag = m[2] === "" ? 1 : parseInt(m[2], 10);
      groups.push({
        start: m.index,
        end: m.index + m[0].length,
        k: sign * mag,
        terms: terms,
      });
    }
    return { src: src, groups: groups };
  }

  function scaledTerms(group, mode) {
    return group.terms.map(function (term) {
      var n = group.k * term.n;
      if (mode === "partialC" && !term.x) n = term.n;
      if (mode === "partialX" && term.x) n = term.n;
      if (mode === "signC" && !term.x) n = -(group.k * term.n);
      return { x: term.x, n: n };
    });
  }

  function sameParsed(a, b) {
    return (
      near(a.left.a, b.left.a) &&
      near(a.left.b, b.left.b) &&
      near(a.right.a, b.right.a) &&
      near(a.right.b, b.right.b)
    );
  }

  function distributionMistake(prevText, nextText) {
    var Alg = global.DoctematicaAlgebra;
    if (!Alg || typeof Alg.parseEquation !== "function") return null;
    var found = findDistribGroups(prevText);
    if (!found.groups.length) return null;
    var student;
    try {
      student = Alg.parseEquation(nextText);
    } catch (err) {
      return null;
    }
    var modes = ["partialC", "partialX", "signC"];
    var gi;
    var mi;
    for (gi = 0; gi < found.groups.length; gi++) {
      for (mi = 0; mi < modes.length; mi++) {
        var mode = modes[mi];
        var built = found.src;
        var i;
        for (i = found.groups.length - 1; i >= 0; i--) {
          var use = i === gi ? mode : "correct";
          var body = formatBin(scaledTerms(found.groups[i], use));
          var g = found.groups[i];
          built = built.slice(0, g.start) + body + built.slice(g.end);
        }
        var parsed;
        try {
          parsed = Alg.parseEquation(built);
        } catch (err2) {
          continue;
        }
        if (!sameParsed(student, parsed)) continue;
        var group = found.groups[gi];
        var kShow = showCoef(group.k);
        if (mode === "signC") {
          var bits = [];
          var t;
          for (t = 0; t < group.terms.length; t++) {
            if (group.terms[t].x) continue;
            var prod = group.k * group.terms[t].n;
            bits.push(kShow + "·" + fmtN(Math.abs(group.terms[t].n)) + "=" + showCoef(prod));
          }
          if (!bits.length) continue;
          return { id: "distribute", message: bits.join(", ") + "." };
        }
        var word = group.terms.length === 2 ? "שני האיברים" : "כל האיברים";
        return { id: "distribute", message: "צריך לכפול את " + word + " ב־" + kShow + "." };
      }
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
    distributionMistake: distributionMistake,
  };
})(window);
