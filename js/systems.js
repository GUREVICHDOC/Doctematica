(function (global) {
  var EPS = 1e-8;

  function near(a, b) {
    return Math.abs(a - b) < EPS;
  }

  function near0(n) {
    return near(n, 0);
  }

  function T(x, y, k) {
    return { x: x, y: y, k: k };
  }

  function add(u, v) {
    return T(u.x + v.x, u.y + v.y, u.k + v.k);
  }

  function sub(u, v) {
    return T(u.x - v.x, u.y - v.y, u.k - v.k);
  }

  function scale(u, s) {
    return T(u.x * s, u.y * s, u.k * s);
  }

  function mul(u, v) {
    var uC = near0(u.x) && near0(u.y);
    var vC = near0(v.x) && near0(v.y);
    if (uC) return scale(v, u.k);
    if (vC) return scale(u, v.k);
    throw new Error("הכפל יוצר איבר ממעלה שנייה. כאן עובדים במשוואות ליניאריות.");
  }

  function div(u, v) {
    if (!near0(v.x) || !near0(v.y) || near0(v.k)) {
      throw new Error("אפשר לחלק רק במספר קבוע שונה מאפס.");
    }
    return scale(u, 1 / v.k);
  }

  function rewrite(text) {
    return String(text)
      .replace(/[−–—]/g, "-")
      .replace(/[×·]/g, "*")
      .replace(/:/g, "/")
      .replace(/\s+/g, "");
  }

  function tokenize(text) {
    var s = rewrite(text);
    if (!s) throw new Error("השדה ריק.");
    if (s.indexOf("=") === -1) throw new Error("חסר סימן =. כתבו משוואה מלאה.");
    var tokens = [];
    var i = 0;
    while (i < s.length) {
      var c = s.charAt(i);
      if ("=()+*/-".indexOf(c) !== -1) {
        tokens.push({ t: c });
        i += 1;
        continue;
      }
      if (c === "x" || c === "X") {
        tokens.push({ t: "x" });
        i += 1;
        continue;
      }
      if (c === "y" || c === "Y") {
        tokens.push({ t: "y" });
        i += 1;
        continue;
      }
      if ((c >= "0" && c <= "9") || c === ".") {
        var m = s.slice(i).match(/^\d+(\.\d+)?/);
        if (!m) throw new Error("מספר לא תקין.");
        tokens.push({ t: "num", v: parseFloat(m[0], 10) });
        i += m[0].length;
        continue;
      }
      throw new Error("תו לא מוכר: «" + c + "».");
    }
    var out = [];
    function endsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === "y" || tok.t === ")");
    }
    function startsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === "y" || tok.t === "(");
    }
    for (i = 0; i < tokens.length; i++) {
      var prev = out[out.length - 1];
      var cur = tokens[i];
      if (endsValue(prev) && startsValue(cur)) out.push({ t: "*" });
      out.push(cur);
    }
    return out;
  }

  function parseSide(tokens) {
    var i = 0;
    function peek() {
      return tokens[i];
    }
    function eat(t) {
      var tok = tokens[i];
      if (!tok || (t && tok.t !== t)) return null;
      i += 1;
      return tok;
    }
    function parseExpr() {
      var left = parseTerm();
      while (peek() && (peek().t === "+" || peek().t === "-")) {
        var op = eat().t;
        var right = parseTerm();
        left = op === "+" ? add(left, right) : sub(left, right);
      }
      return left;
    }
    function parseTerm() {
      var left = parseUnary();
      while (peek() && (peek().t === "*" || peek().t === "/")) {
        var op = eat().t;
        var right = parseUnary();
        left = op === "*" ? mul(left, right) : div(left, right);
      }
      return left;
    }
    function parseUnary() {
      if (peek() && peek().t === "+") {
        eat();
        return parseUnary();
      }
      if (peek() && peek().t === "-") {
        eat();
        return mul(T(0, 0, -1), parseUnary());
      }
      return parsePrimary();
    }
    function parsePrimary() {
      var tok = peek();
      if (!tok) throw new Error("הביטוי נקטע באמצע.");
      if (tok.t === "num") {
        eat();
        return T(0, 0, tok.v);
      }
      if (tok.t === "x") {
        eat();
        return T(1, 0, 0);
      }
      if (tok.t === "y") {
        eat();
        return T(0, 1, 0);
      }
      if (tok.t === "(") {
        eat();
        var inner = parseExpr();
        if (!eat(")")) throw new Error("חסר סוגריים סוגרים.");
        return inner;
      }
      throw new Error("לא ציפיתי ל־«" + tok.t + "» כאן.");
    }
    var value = parseExpr();
    if (i !== tokens.length) throw new Error("לא הצלחתי לקרוא את כל האגף.");
    return value;
  }

  function parseEquation(text) {
    var tokens = tokenize(text);
    var eqIndex = -1;
    var j;
    for (j = 0; j < tokens.length; j++) {
      if (tokens[j].t === "=") {
        if (eqIndex !== -1) throw new Error("יותר מסימן שוויון אחד.");
        eqIndex = j;
      }
    }
    if (eqIndex === -1) throw new Error("חסר סימן =.");
    var leftToks = tokens.slice(0, eqIndex);
    var rightToks = tokens.slice(eqIndex + 1);
    if (!leftToks.length || !rightToks.length) throw new Error("חסר אגף במשוואה.");
    return {
      left: parseSide(leftToks),
      right: parseSide(rightToks),
      source: String(text).trim(),
    };
  }

  function row(eq) {
    return sub(eq.left, eq.right);
  }

  function equivalent(a, b) {
    var r = row(a);
    var s = row(b);
    var zerosR = near0(r.x) && near0(r.y) && near0(r.k);
    var zerosS = near0(s.x) && near0(s.y) && near0(s.k);
    if (zerosR && zerosS) return true;
    if (zerosR || zerosS) return false;
    if (near0(r.x) && near0(r.y)) {
      return near0(s.x) && near0(s.y) && near0(r.k) === near0(s.k);
    }
    var k = null;
    if (!near0(r.x)) k = s.x / r.x;
    else if (!near0(r.y)) k = s.y / r.y;
    else k = s.k / r.k;
    if (near0(k)) return false;
    return near(s.x, k * r.x) && near(s.y, k * r.y) && near(s.k, k * r.k);
  }

  function isIdentity(eq) {
    var r = row(eq);
    return near0(r.x) && near0(r.y) && near0(r.k);
  }

  function isContradiction(eq) {
    var r = row(eq);
    return near0(r.x) && near0(r.y) && !near0(r.k);
  }

  function isBareVar(side, v) {
    if (v === "x") return near(side.x, 1) && near0(side.y) && near0(side.k);
    return near0(side.x) && near(side.y, 1) && near0(side.k);
  }

  function hasVar(side, v) {
    return v === "x" ? !near0(side.x) : !near0(side.y);
  }

  function readIsolation(eq) {
    var left = eq.left;
    var right = eq.right;
    if (isBareVar(left, "x") && !hasVar(right, "x")) {
      return { v: "x", rhs: right, source: eq.source };
    }
    if (isBareVar(right, "x") && !hasVar(left, "x")) {
      return { v: "x", rhs: left, source: eq.source };
    }
    if (isBareVar(left, "y") && !hasVar(right, "y")) {
      return { v: "y", rhs: right, source: eq.source };
    }
    if (isBareVar(right, "y") && !hasVar(left, "y")) {
      return { v: "y", rhs: left, source: eq.source };
    }
    return null;
  }

  function isolationsOf(eq1s, eq2s) {
    var out = [];
    var a = readIsolation(parseEquation(eq1s));
    var b = readIsolation(parseEquation(eq2s));
    if (a) {
      a.from = 0;
      out.push(a);
    }
    if (b) {
      b.from = 1;
      out.push(b);
    }
    return out;
  }

  function substitute(isol, eqText) {
    var eq = parseEquation(eqText);
    function repl(side) {
      if (isol.v === "x") return add(scale(isol.rhs, side.x), T(0, side.y, side.k));
      return add(scale(isol.rhs, side.y), T(side.x, 0, side.k));
    }
    return { left: repl(eq.left), right: repl(eq.right) };
  }

  function substituteNumeric(v, value, eqText) {
    return substitute({ v: v, rhs: T(0, 0, value) }, eqText);
  }

  function dropCoeffSub(isol, eqText) {
    var eq = parseEquation(eqText);
    function repl(side) {
      var coef = isol.v === "x" ? side.x : side.y;
      var kept = isol.v === "x" ? T(0, side.y, side.k) : T(side.x, 0, side.k);
      if (near0(coef)) return kept;
      return add(isol.rhs, kept);
    }
    return { left: repl(eq.left), right: repl(eq.right) };
  }

  function noDistributeSub(isol, eqText) {
    var eq = parseEquation(eqText);
    function repl(side) {
      var coef = isol.v === "x" ? side.x : side.y;
      var kept = isol.v === "x" ? T(0, side.y, side.k) : T(side.x, 0, side.k);
      if (near0(coef)) return kept;
      var wrong = T(coef * isol.rhs.x, coef * isol.rhs.y, isol.rhs.k);
      return add(wrong, kept);
    }
    return { left: repl(eq.left), right: repl(eq.right) };
  }

  function solvedNumber(eq) {
    var iso = readIsolation(eq);
    if (!iso) return null;
    if (!near0(iso.rhs.x) || !near0(iso.rhs.y)) return null;
    return { v: iso.v, value: iso.rhs.k };
  }

  function fmt(n) {
    return global.DoctematicaAlgebra.formatNumber(n);
  }

  function valueCheck(eq, text) {
    var num = solvedNumber(eq);
    if (!num) return null;
    var status = global.DoctematicaAlgebra.isolatedRhsKind(text, num.v);
    if (status === "value") {
      return {
        ok: true,
        kind: "value",
        v: num.v,
        value: num.value,
        message: "מצאתם " + num.v + " = " + fmt(num.value) + ".",
      };
    }
    return {
      ok: true,
      kind: "step",
      message:
        status === "unreduced"
          ? "צעד חוקי: העברתם את המקדם בחילוק. עכשיו חשבו את השבר, למשל 40/2 → 20."
          : "צעד חוקי, אבל זה עדיין לא הפתרון הסופי. פשטו את האגף עד שמקבלים מספר אחד.",
    };
  }

  function checkWorkStep(prevText, nextText) {
    if (rewrite(prevText) === rewrite(nextText)) {
      return { ok: false, message: "זו אותה משוואה. כתבו צעד חדש." };
    }
    var prev;
    var next;
    try {
      prev = parseEquation(prevText);
      next = parseEquation(nextText);
    } catch (err) {
      return { ok: false, message: err.message };
    }
    if (isContradiction(next) && equivalent(prev, next)) {
      return { ok: true, kind: "none", message: "התקבלה סתירה. למערכת אין פתרון." };
    }
    if (isIdentity(next) && equivalent(prev, next)) {
      return { ok: true, kind: "infinite", message: "התקבלה זהות. יש אינסוף פתרונות (המשוואות תלויות)." };
    }
    if (!equivalent(prev, next)) {
      var classified = global.DoctematicaErrors.classify(prev, next);
      return { ok: false, message: classified.message };
    }
    var ready = valueCheck(next, nextText);
    if (ready) return ready;
    var iso = readIsolation(next);
    if (iso) {
      return {
        ok: true,
        kind: "isolated",
        isolation: iso,
        message: "בודדתם את " + iso.v + ". עכשיו מציבים במשוואה האחרת.",
      };
    }
    return { ok: true, kind: "step", message: "צעד חוקי. המשיכו." };
  }

  function checkSubstituted(isol, targetText, writtenText) {
    var expected;
    var written;
    try {
      expected = substitute(isol, targetText);
      expected.source = writtenText;
      written = parseEquation(writtenText);
    } catch (err) {
      return { ok: false, message: err.message };
    }
    if (!equivalent(expected, written)) {
      var dropped = dropCoeffSub(isol, targetText);
      if (equivalent(dropped, written)) {
        return {
          ok: false,
          message:
            "שכחתם את המקדם. אם כתוב 5x ו־x שווה לביטוי, צריך להציב 5·(הביטוי), לא את הביטוי לבד.",
        };
      }
      var nodist = noDistributeSub(isol, targetText);
      if (equivalent(nodist, written)) {
        return {
          ok: false,
          message:
            "צריך לפתוח סוגריים נכון: 5(y+4) זה 5y+20, לא 5y+4. כופלים את כל האיברים שבסוגריים.",
        };
      }
      var classified = global.DoctematicaErrors.classify(expected, written);
      if (classified.id !== "not_equivalent") {
        return { ok: false, message: classified.message };
      }
      return {
        ok: false,
        message: "ההצבה לא תואמת. הציבו את הביטוי שבודדתם במשוואה שנבחרה.",
      };
    }
    if (isContradiction(written)) {
      return { ok: true, kind: "none", message: "התקבלה סתירה. למערכת אין פתרון." };
    }
    if (isIdentity(written)) {
      return { ok: true, kind: "infinite", message: "התקבלה זהות. יש אינסוף פתרונות." };
    }
    var ready = valueCheck(written, writtenText);
    if (ready) return ready;
    return { ok: true, kind: "step", message: "הצבה נכונה. עכשיו פתרו את המשוואה בנעלם אחד." };
  }

  function solvePair(eq1s, eq2s) {
    var r1 = row(parseEquation(eq1s));
    var r2 = row(parseEquation(eq2s));
    var det = r1.x * r2.y - r1.y * r2.x;
    if (near0(det)) {
      if (equivalent(parseEquation(eq1s), parseEquation(eq2s)) || isIdentity({ left: r1, right: T(0, 0, 0) })) {
        if (near0(r1.x * r2.k - r2.x * r1.k) && near0(r1.y * r2.k - r2.y * r1.k)) {
          return { kind: "infinite" };
        }
      }
      return { kind: "none" };
    }
    var x = (r1.y * r2.k - r1.k * r2.y) / det;
    var y = (r1.k * r2.x - r1.x * r2.k) / det;
    return { kind: "unique", x: x, y: y };
  }

  function divides(a, b) {
    if (near0(b)) return true;
    if (near0(a)) return false;
    return near(b / a, Math.round(b / a));
  }

  function isolationOption(eqText, eqIndex, v) {
    var eq = parseEquation(eqText);
    var r = row(eq);
    var a = v === "x" ? r.x : r.y;
    var b = v === "x" ? r.y : r.x;
    var c = r.k;
    if (near0(a)) {
      return { eqIndex: eqIndex, v: v, cost: 1000, absA: 0, frac: true, missing: true };
    }
    var absA = Math.abs(a);
    var frac = !divides(a, b) || !divides(a, c);
    var cost = absA === 1 ? 0 : 8 + absA;
    if (frac) cost += 18;
    var iso = readIsolation(eq);
    if (iso && iso.v === v) cost -= 12;
    return { eqIndex: eqIndex, v: v, cost: cost, absA: absA, frac: frac, missing: false };
  }

  function whyIsolate(opt) {
    if (opt.missing) return "";
    if (opt.absA === 1) return "המקדם הוא ±1, בלי חילוק ובלי שברים.";
    if (!opt.frac) return "החילוק במקדם " + fmt(opt.absA) + " יישאר במספרים שלמים.";
    return "אחרי הבידוד מחלקים ב־" + fmt(opt.absA) + ".";
  }

  function sameOpt(p, q) {
    return p.eqIndex === q.eqIndex && p.v === q.v;
  }

  function adviceIsolate(eq1, eq2, eqIndex, v) {
    var eqs = [eq1, eq2];
    var opts = [
      isolationOption(eqs[0], 0, "x"),
      isolationOption(eqs[0], 0, "y"),
      isolationOption(eqs[1], 1, "x"),
      isolationOption(eqs[1], 1, "y"),
    ];
    var chosen = isolationOption(eqs[eqIndex], eqIndex, v);
    var valid = opts.filter(function (o) {
      return !o.missing;
    });
    valid.sort(function (p, q) {
      return p.cost - q.cost;
    });
    var best = valid[0];
    if (chosen.missing) {
      return {
        tone: "tip",
        message:
          "המשתנה " +
          v +
          " לא מופיע במשוואה " +
          (eqIndex + 1) +
          ". בחרו משתנה שמופיע בה, או משוואה אחרת.",
      };
    }
    var similar = valid.filter(function (o) {
      return o.cost - best.cost <= 2.5;
    });
    if (chosen.cost - best.cost <= 2.5) {
      var other = similar.filter(function (o) {
        return !sameOpt(o, chosen);
      })[0];
      if (other) {
        return {
          tone: "ok",
          message:
            "בחירה נכונה. " +
            whyIsolate(chosen) +
            " גם לבודד את " +
            other.v +
            " במשוואה " +
            (other.eqIndex + 1) +
            " נוח באותה מידה.",
        };
      }
      return { tone: "ok", message: "בחירה נוחה. " + whyIsolate(chosen) };
    }
    return {
      tone: "tip",
      message:
        "אפשר לבודד כך, אבל נוח יותר לבודד את " +
        best.v +
        " במשוואה " +
        (best.eqIndex + 1) +
        ". " +
        whyIsolate(best),
    };
  }

  function subOption(isol, targetText, targetIndex) {
    var r = row(parseEquation(targetText));
    var coef = isol.v === "x" ? r.x : r.y;
    if (near0(coef)) {
      return { targetIndex: targetIndex, cost: 1000, absC: 0, missing: true };
    }
    var absC = Math.abs(coef);
    var numeric = near0(isol.rhs.x) && near0(isol.rhs.y);
    var cost = numeric ? absC : absC * 5;
    if (absC === 1) cost -= 2;
    return { targetIndex: targetIndex, cost: cost, absC: absC, missing: false };
  }

  function adviceSubstitute(isol, eqs, targetIndex) {
    var opts = [];
    var i;
    for (i = 0; i < eqs.length; i++) {
      if (isol.from === i) continue;
      opts.push(subOption(isol, eqs[i], i));
    }
    if (!opts.length) return { tone: "ok", message: "בחירה נכונה." };
    opts.sort(function (p, q) {
      return p.cost - q.cost;
    });
    var chosen = subOption(isol, eqs[targetIndex], targetIndex);
    var best = opts[0];
    if (opts.length === 1) {
      return { tone: "ok", message: "בחירה נכונה. מציבים במשוואה האחרת." };
    }
    if (chosen.cost - best.cost <= 2) {
      return { tone: "ok", message: "בחירה נכונה." };
    }
    return {
      tone: "tip",
      message:
        "אפשר, אבל נוח יותר להציב במשוואה " +
        (best.targetIndex + 1) +
        " — שם המקדם של " +
        isol.v +
        " קטן יותר, ויהיו פחות כפל ופחות שברים.",
    };
  }

  function adviceBack(found, eqs, targetIndex) {
    var need = found.v === "x" ? "y" : "x";
    var opts = eqs.map(function (text, i) {
      var r = row(parseEquation(text));
      var a = need === "x" ? r.x : r.y;
      return { i: i, absA: Math.abs(a), cost: near0(a) ? 1000 : Math.abs(a) };
    });
    var valid = opts.filter(function (o) {
      return o.cost < 900;
    });
    valid.sort(function (p, q) {
      return p.cost - q.cost;
    });
    var chosen = opts[targetIndex];
    var best = valid[0];
    if (!best || chosen.cost - best.cost <= 1) {
      if (valid.length > 1 && Math.abs(valid[0].cost - valid[1].cost) <= 1) {
        return { tone: "ok", message: "בחירה נכונה. שתי המשוואות נוחות בערך באותה מידה." };
      }
      return { tone: "ok", message: "בחירה נוחה." };
    }
    return {
      tone: "tip",
      message:
        "אפשר, אבל נוח יותר להציב במשוואה " +
        (best.i + 1) +
        " — שם המקדם של " +
        need +
        " הוא " +
        fmt(best.absA) +
        ".",
    };
  }

  global.DoctematicaSystems = {
    parseEquation: parseEquation,
    equivalent: equivalent,
    isolationsOf: isolationsOf,
    readIsolation: readIsolation,
    checkWorkStep: checkWorkStep,
    checkSubstituted: checkSubstituted,
    substituteNumeric: substituteNumeric,
    solvePair: solvePair,
    adviceIsolate: adviceIsolate,
    adviceSubstitute: adviceSubstitute,
    adviceBack: adviceBack,
    fmt: fmt,
  };
})(window);
