(function (global) {
  var EPS = 1e-8;

  function near0(n) {
    return Math.abs(n) < EPS;
  }

  function near(a, b) {
    return Math.abs(a - b) < 1e-6;
  }

  function Q() {
    return global.DoctematicaQuadratic;
  }

  function norm(s) {
    return String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/[·×]/g, "*")
      .replace(/²/g, "^2")
      .replace(/³/g, "^3")
      .replace(/⁴/g, "^4")
      .replace(/⁵/g, "^5")
      .replace(/⁶/g, "^6")
      .replace(/⁰/g, "^0")
      .replace(/¹/g, "^1")
      .replace(/⁷/g, "^7")
      .replace(/⁸/g, "^8")
      .replace(/⁹/g, "^9")
      .replace(/\(([a-z])\)\^/gi, "$1^")
      .replace(/\s+/g, "");
  }

  function noReal(s) {
    var t = norm(s).replace(/־/g, "");
    if (t === "אין" || t === "אין.") return true;
    return t.indexOf("איןפתרון") !== -1 || t.indexOf("איןממשי") !== -1;
  }

  function expOf(term) {
    if (!term) return 0;
    if (term.exp != null) return term.exp;
    if (term.kind === "x2") return 2;
    if (term.kind === "x") return 1;
    return 0;
  }

  function readSide(side) {
    var t = norm(side);
    if (t.indexOf("(") >= 0 || t.indexOf(")") >= 0) return null;
    if (!t || t === "0") return { map: { 0: 0 }, letter: "" };
    if (t.charAt(0) !== "+" && t.charAt(0) !== "-") t = "+" + t;
    var map = {};
    var letter = "";
    var i = 0;
    while (i < t.length) {
      var sign = t.charAt(i) === "-" ? -1 : 1;
      if (t.charAt(i) === "+" || t.charAt(i) === "-") i += 1;
      else return null;
      var num = 1;
      var had = false;
      var m = t.slice(i).match(/^(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)/);
      if (m) {
        had = true;
        if (m[1].indexOf("/") >= 0) {
          var bits = m[1].split("/");
          num = parseFloat(bits[0]) / parseFloat(bits[1]);
        } else num = parseFloat(m[1]);
        if (!isFinite(num)) return null;
        i += m[0].length;
      }
      var exp = 0;
      var id = t.slice(i).match(/^([a-z])(?:\^(\d+))?/i);
      if (id) {
        var ch = id[1].toLowerCase();
        if (letter && letter !== ch) return null;
        letter = ch;
        exp = id[2] ? parseInt(id[2], 10) : 1;
        if (!had) num = 1;
        i += id[0].length;
      } else if (!had) return null;
      map[exp] = (map[exp] || 0) + sign * num;
    }
    if (i !== t.length) return null;
    return { map: map, letter: letter };
  }

  function subMaps(L, R) {
    var map = {};
    function add(src, sign) {
      Object.keys(src || {}).forEach(function (k) {
        map[k] = (map[k] || 0) + sign * src[k];
      });
    }
    add(L, 1);
    add(R, -1);
    Object.keys(map).forEach(function (k) {
      if (near0(map[k])) delete map[k];
    });
    return map;
  }

  function parseEq(text) {
    var s = norm(text);
    if (!s || s.indexOf("(") >= 0) return null;
    var parts = s.split("=");
    if (parts.length !== 2) return null;
    var L = readSide(parts[0]);
    var R = readSide(parts[1]);
    if (!L || !R) return null;
    if (L.letter && R.letter && L.letter !== R.letter) return null;
    return { map: subMaps(L.map, R.map), letter: L.letter || R.letter || "" };
  }

  function liveExps(map) {
    return Object.keys(map || {})
      .map(Number)
      .filter(function (e) {
        return !near0(map[e]);
      })
      .sort(function (a, b) {
        return b - a;
      });
  }

  function shapeOf(map) {
    var exps = liveExps(map);
    if (!exps.length) return null;
    var top = exps[0];
    if (top < 4 || top % 2 !== 0) return null;
    var n = top / 2;
    var i;
    for (i = 0; i < exps.length; i++) {
      if (exps[i] !== top && exps[i] !== n && exps[i] !== 0) return null;
    }
    return { n: n, a: map[top] || 0, b: map[n] || 0, c: map[0] || 0 };
  }

  function scalarOf(A, B) {
    var keys = {};
    liveExps(A).forEach(function (e) {
      keys[e] = true;
    });
    liveExps(B).forEach(function (e) {
      keys[e] = true;
    });
    var k = null;
    var found = false;
    var exps = Object.keys(keys).map(Number);
    var i;
    for (i = 0; i < exps.length; i++) {
      var e = exps[i];
      var av = A[e] || 0;
      var bv = B[e] || 0;
      if (near0(av) && near0(bv)) continue;
      found = true;
      if (near0(av) || near0(bv)) return null;
      var ratio = av / bv;
      if (k == null) k = ratio;
      else if (!near(k, ratio)) return null;
    }
    return found ? k : null;
  }

  function formatMap(map) {
    var exps = liveExps(map);
    if (!exps.length) return "0";
    var terms = exps.map(function (exp) {
      return { coef: map[exp], exp: exp, kind: exp === 0 ? "n" : "p" };
    });
    return Q().formatTermList(terms);
  }

  function sumTerms(terms) {
    var map = {};
    (terms || []).forEach(function (term) {
      var e = expOf(term);
      map[e] = (map[e] || 0) + term.coef;
    });
    Object.keys(map).forEach(function (k) {
      if (near0(map[k])) delete map[k];
    });
    return map;
  }

  function eqParts(text) {
    var s = norm(text);
    var parts = s.split("=");
    if (parts.length !== 2) return null;
    return parts;
  }

  function combineEq(text) {
    var parts = eqParts(text);
    if (!parts) return text;
    if (parts[0].indexOf("(") >= 0 || parts[1].indexOf("(") >= 0) return text;
    var L = Q().polyTerms(parts[0]);
    var R = Q().polyTerms(parts[1]);
    if (!L || !R) return text;
    var left = formatMap(sumTerms(L));
    var right = formatMap(sumTerms(R));
    return left + "=" + (right === "0" ? "0" : right);
  }

  function moveEq(text) {
    var parts = eqParts(text);
    if (!parts) return text;
    if (norm(parts[1]) === "0") return text;
    var L = Q().polyTerms(parts[0]);
    var R = Q().polyTerms(parts[1]);
    if (!L || !R) return text;
    var all = L.slice();
    R.forEach(function (term) {
      all.push({ coef: -term.coef, exp: expOf(term), kind: term.kind });
    });
    all.sort(function (a, b) {
      return expOf(b) - expOf(a);
    });
    return Q().formatTermList(all) + "=0";
  }

  function hasParens(text) {
    return norm(text).indexOf("(") >= 0;
  }

  function targetPoly(start) {
    var cur = norm(start);
    var guard = 0;
    var steps = [{ eq: start, explain: "המשוואה הנתונה." }];
    while (guard < 8 && hasParens(cur)) {
      guard += 1;
      var opened = Q().expandParensEq(cur);
      if (norm(opened) === cur) break;
      cur = opened;
      steps.push({ eq: cur, explain: "פותחים סוגריים. עדיין לא מאחדים איברים דומים." });
    }
    guard = 0;
    while (guard < 6) {
      guard += 1;
      var combined = combineEq(cur);
      if (norm(combined) === norm(cur)) break;
      cur = combined;
      steps.push({ eq: cur, explain: "מכנסים איברים דומים." });
    }
    guard = 0;
    while (guard < 4) {
      guard += 1;
      var parts = eqParts(cur);
      if (!parts || norm(parts[1]) === "0") break;
      var moved = moveEq(cur);
      if (norm(moved) === norm(cur)) break;
      cur = moved;
      steps.push({ eq: cur, explain: "מעבירים הכל לאגף אחד. כל איבר שעובר מחליף סימן." });
      var again = combineEq(cur);
      if (norm(again) !== norm(cur)) {
        cur = again;
        steps.push({ eq: cur, explain: "מכנסים אחרי העברת האגפים." });
      }
    }
    var parsed = parseEq(cur);
    return { eq: cur, map: parsed ? parsed.map : null, steps: steps };
  }

  function asLetter(eq, letter) {
    return String(eq || "").replace(/x\^/g, letter + "^").replace(/x/g, letter);
  }

  function uniqueFracs(roots) {
    var out = [];
    (roots || []).forEach(function (fr) {
      if (!fr) return;
      var v = fr.n / fr.d;
      var seen = out.some(function (item) {
        return near(item.n / item.d, v);
      });
      if (!seen) out.push(fr);
    });
    out.sort(function (a, b) {
      return b.n / b.d - a.n / a.d;
    });
    return out;
  }

  function factorToken(fr, letter) {
    if (fr.d === 1 && fr.n === 0) return letter;
    if (fr.d === 1) return fr.n < 0 ? letter + "+" + -fr.n : letter + "-" + fr.n;
    if (fr.n < 0) return fr.d + letter + "+" + -fr.n;
    if (fr.n === 0) return fr.d + letter;
    return fr.d + letter + "-" + fr.n;
  }

  function matchesQuad(text, a, b, c, letter) {
    var asX = String(text || "").replace(new RegExp(letter + "\\^", "g"), "x^").replace(new RegExp(letter, "g"), "x");
    var opened = hasParens(asX) ? Q().expandParensEq(asX) : asX;
    var combined = combineEq(opened);
    var parsed = parseEq(combined);
    if (!parsed) return false;
    var shape = { map: {} };
    shape.map[2] = a;
    shape.map[1] = b;
    shape.map[0] = c;
    if (near0(b)) delete shape.map[1];
    if (near0(c)) delete shape.map[0];
    if (near0(a)) delete shape.map[2];
    var student = {};
    Object.keys(parsed.map).forEach(function (k) {
      var e = Number(k);
      if (e === 2) student[2] = parsed.map[k];
      else if (e === 1) student[1] = parsed.map[k];
      else if (e === 0) student[0] = parsed.map[k];
      else if (!near0(parsed.map[k])) student[e] = parsed.map[k];
    });
    return scalarOf(shape.map, student) != null;
  }

  function factoredForm(quad, letter) {
    var roots = uniqueFracs(quad.roots);
    if (!roots.length || quad.kind === "none") return null;
    var eq;
    if (roots.length === 1) eq = "(" + factorToken(roots[0], letter) + ")^2=0";
    else {
      var leftTok = factorToken(roots[0], letter);
      var rightTok = factorToken(roots[1], letter);
      if (rightTok === letter) {
        var swapTok = leftTok;
        leftTok = rightTok;
        rightTok = swapTok;
      }
      eq = "(" + leftTok + ")(" + rightTok + ")=0";
    }
    if (matchesQuad(eq, quad.a, quad.b, quad.c, letter)) return eq;
    if (roots.length === 2) {
      eq = "(" + factorToken(roots[1], letter) + ")(" + factorToken(roots[0], letter) + ")=0";
      if (matchesQuad(eq, quad.a, quad.b, quad.c, letter)) return eq;
    }
    return null;
  }

  function fmtT(fr, letter) {
    return letter + "=" + Q().fmt(fr);
  }

  function tList(quad, letter) {
    return uniqueFracs(quad.roots)
      .map(function (fr) {
        return fmtT(fr, letter);
      })
      .join(", ");
  }

  function branchOf(n, fr) {
    var eq = "x^" + n + "=" + Q().fmt(fr);
    var k = fr.n / fr.d;
    if (n === 2) {
      var sp = Q().analyzeSqrtStart(eq);
      return { n: n, k: k, fr: fr, eq: eq, engine: "sqrt", pack: sp, kind: sp.kind, answer: sp.answer };
    }
    var hp = Q().analyzeHighRootStart(eq);
    if (!hp.root && Q().rationalNthRoot) hp.root = Q().rationalNthRoot(k, n);
    if (hp.root && hp.kind !== "none") {
      var show = Q().fmtDisp(hp.root);
      hp.answer =
        hp.kind === "two" ? "x = " + show + ", x = −" + String(show).replace(/^−/, "") : "x = " + show;
    }
    return { n: n, k: k, fr: fr, eq: eq, engine: "root", pack: hp, kind: hp.kind, answer: hp.answer };
  }

  function xShows(br) {
    if (!br || br.kind === "none") return [];
    if (br.kind === "one") {
      if (near0(br.k)) return ["0"];
      if (br.pack && br.pack.root) return [Q().fmtDisp(br.pack.root)];
      return [Q().fmt(br.fr)];
    }
    if (br.pack && br.pack.root) {
      var s = Q().fmtDisp(br.pack.root);
      var bare = String(s).replace(/^−/, "");
      return [bare, "−" + bare];
    }
    var inner = Q().fmt(br.fr);
    return ["√(" + inner + ")", "−√(" + inner + ")"];
  }

  function xNumbers(br) {
    if (!br || br.kind === "none") return [];
    if (br.kind === "one") {
      if (br.pack && br.pack.root) return [br.pack.root.n / br.pack.root.d];
      return [near0(br.k) ? 0 : br.k];
    }
    var mag =
      br.pack && br.pack.root ? Math.abs(br.pack.root.n / br.pack.root.d) : Math.sqrt(Math.abs(br.k));
    return [mag, -mag];
  }

  function analyzeBiquadStart(start) {
    var got = targetPoly(start);
    if (!got.map) throw new Error("לא הצלחתי לסדר את המשוואה.");
    var shape = shapeOf(got.map);
    if (!shape) throw new Error("זו לא משוואה ריבועית בחזקה.");
    var quad = Q().analyze(shape.a, shape.b, shape.c, asLetter(Q().formatPolyEq(shape.a, shape.b, shape.c), "t"));
    var letter = "t";
    var tEq = asLetter(Q().formatPolyEq(shape.a, shape.b, shape.c), letter);
    var roots = uniqueFracs(quad.roots);
    var branches = roots.map(function (fr) {
      return branchOf(shape.n, fr);
    });
    var shows = [];
    var nums = [];
    branches.forEach(function (br) {
      xShows(br).forEach(function (s) {
        shows.push(s);
      });
      xNumbers(br).forEach(function (v) {
        if (!nums.some(function (u) { return near(u, v); })) nums.push(v);
      });
    });
    var answer = shows.length
      ? shows
          .map(function (s) {
            return "x = " + s;
          })
          .join(", ")
      : "אין פתרון ממשי";
    var steps = got.steps.slice();
    if (norm(steps[steps.length - 1].eq) !== norm(got.eq)) {
      steps.push({ eq: got.eq, explain: "המשוואה אחרי סידור." });
    }
    steps.push({
      eq: letter + "=x^" + shape.n,
      explain: "החזקה " + shape.n * 2 + " היא פי 2 מהחזקה " + shape.n + ", לכן מציבים " + letter + " = x^" + shape.n + ".",
    });
    steps.push({
      eq: tEq,
      explain: "מחליפים את x^" + shape.n * 2 + " ב־" + letter + "^2 ואת x^" + shape.n + " ב־" + letter + ".",
    });
    if (quad.kind === "none") {
      steps.push({
        eq: "אין פתרון ממשי",
        explain: "למשוואה הריבועית ב־" + letter + " אין פתרון ממשי, ולכן אין פתרון ממשי ל־x.",
      });
    } else {
      steps.push({
        eq: tList(quad, letter),
        explain: "פותרים את המשוואה הריבועית ב־" + letter + " בנוסחת השורשים. ערך שמופיע פעמיים נפתח כענף אחד.",
      });
      branches.forEach(function (br) {
        var back =
          br.kind === "none" ? br.eq + " ⇒ אין פתרון ממשי" : br.eq + " ⇒ " + String(br.answer || "").replace(/x = /g, "x=");
        var why =
          br.kind === "none"
            ? "t = x^" + shape.n + " ו־t שלילי בחזקה זוגית, אז מהענף הזה אין x ממשי."
            : shape.n % 2 === 0
              ? "חוזרים להצבה. בחזקה זוגית חיובית יש שני סימנים, ו־0 נותן פתרון אחד."
              : "חוזרים להצבה. בחזקה אי־זוגית יש פתרון ממשי אחד.";
        steps.push({ eq: back, explain: why });
      });
      steps.push({ eq: answer, explain: "אוספים את כל פתרונות x מכל הענפים, בלי כפילויות." });
    }
    return {
      start: start,
      standard: got.eq,
      map: got.map,
      shape: shape,
      quad: quad,
      letter: letter,
      tEq: tEq,
      factored: factoredForm(quad, letter),
      branches: branches,
      xRoots: nums,
      answer: answer,
      steps: steps,
      kind: shows.length ? "roots" : "none",
    };
  }

  function valueOf(raw) {
    var t = norm(raw);
    if (!t || /[a-z]/i.test(t)) return null;
    var v = Q().evalExpr(t);
    if (v == null || !isFinite(v)) return null;
    return v;
  }

  function parseAssigns(text, letter) {
    var s = norm(text);
    if (!s) return null;
    var parts = s.split(",");
    var vals = [];
    var re = new RegExp("^" + letter + "(?:_?\\d+|[₁₂])?=(.+)$", "i");
    var i;
    for (i = 0; i < parts.length; i++) {
      var m = parts[i].match(re);
      if (!m) return null;
      var v = valueOf(m[1]);
      if (v == null) return null;
      vals.push(v);
    }
    return vals.length ? vals : null;
  }

  function parseSubLine(text) {
    var s = norm(text);
    var m = s.match(/^([a-z])=x(?:\^(\d+))?$/i);
    if (!m) return null;
    if (m[1].toLowerCase() === "x") return null;
    return { letter: m[1].toLowerCase(), power: m[2] ? parseInt(m[2], 10) : 1 };
  }

  function coverCount(got, want) {
    var used = {};
    var n = 0;
    (got || []).forEach(function (v) {
      var i;
      for (i = 0; i < want.length; i++) {
        if (used[i]) continue;
        if (near(v, want[i])) {
          used[i] = true;
          n += 1;
          break;
        }
      }
    });
    return n;
  }

  function sameSet(got, want) {
    if (!want.length && (!got || !got.length)) return true;
    if (coverCount(got, want) !== want.length) return false;
    return (got || []).every(function (v) {
      return want.some(function (w) {
        return near(v, w);
      });
    });
  }

  function parseXList(text) {
    if (noReal(text)) return { none: true, vals: [] };
    var s = norm(text);
    if (!s) return null;
    var parts = s.split(",");
    var vals = [];
    var i;
    for (i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p) continue;
      var pm = p.match(/^(?:x=)?±(.+)$/i);
      if (pm) {
        var mag = radValue(pm[1]);
        if (mag == null) return null;
        vals.push(mag);
        vals.push(-mag);
        continue;
      }
      var one = p.match(/^x=(.+)$/i);
      if (!one) {
        if (i === 0) return null;
        one = [p, p];
      }
      var v = radValue(one[1]);
      if (v == null) return null;
      vals.push(v);
    }
    return { none: false, vals: vals };
  }

  function trailRoots(trail) {
    var got = [];
    (trail || []).forEach(function (line) {
      var listed = parseXList(line);
      if (!listed || listed.none) return;
      listed.vals.forEach(function (v) {
        if (!got.some(function (u) { return near(u, v); })) got.push(v);
      });
    });
    return got;
  }

  function missingRootLine(br, have) {
    var shows = xShows(br);
    var nums = xNumbers(br);
    var parts = [];
    var i;
    for (i = 0; i < nums.length; i++) {
      if (have.some(function (h) { return near(h, nums[i]); })) continue;
      if (shows[i] == null) continue;
      parts.push("x=" + shows[i]);
    }
    return parts.join(", ");
  }

  function radValue(raw) {
    var t = norm(raw);
    var sign = 1;
    if (t.charAt(0) === "-") {
      sign = -1;
      t = t.slice(1);
    } else if (t.charAt(0) === "+") t = t.slice(1);
    var root = t.match(/^√\((.+)\)$/) || t.match(/^√(.+)$/);
    if (root) {
      var inner = valueOf(root[1]);
      if (inner == null || inner < 0) return null;
      return sign * Math.sqrt(inner);
    }
    var plain = valueOf(sign < 0 ? "-" + t : t);
    return plain;
  }

  function termName(exp, letter) {
    if (!exp) return "המספר החופשי";
    if (exp === 1) return letter;
    return letter + "^" + exp;
  }

  function mismatch(expect, student, letter) {
    if (scalarOf(expect, student) != null) return null;
    var exps = {};
    liveExps(expect).forEach(function (e) {
      exps[e] = true;
    });
    liveExps(student).forEach(function (e) {
      exps[e] = true;
    });
    var list = Object.keys(exps).map(Number);
    var i;
    for (i = 0; i < list.length; i++) {
      var e = list[i];
      var flipped = {};
      Object.keys(student).forEach(function (k) {
        flipped[k] = Number(k) === e ? -student[k] : student[k];
      });
      if (scalarOf(expect, flipped) != null) {
        return {
          errorId: "badSign",
          message: "בדקו את הסימן של " + termName(e, letter) + ".",
        };
      }
    }
    for (i = 0; i < list.length; i++) {
      var miss = list[i];
      if (!near0(expect[miss] || 0) && near0(student[miss] || 0)) {
        var restored = {};
        Object.keys(student).forEach(function (k) {
          restored[k] = student[k];
        });
        restored[miss] = expect[miss];
        if (scalarOf(expect, restored) != null) {
          return {
            errorId: "lostCoeff",
            message: "נראה שנעלם המקדם של " + termName(miss, letter) + " בהצבה.",
          };
        }
      }
    }
    return null;
  }

  function doubledPower(student, shape) {
    var exps = liveExps(student);
    if (!exps.length) return false;
    var i;
    for (i = 0; i < exps.length; i++) {
      if (exps[i] === 0) continue;
      if (exps[i] % 2 !== 0) return false;
    }
    var folded = {};
    exps.forEach(function (e) {
      folded[e === 0 ? 0 : e / 2] = student[e];
    });
    var want = {};
    want[2] = shape.a;
    if (!near0(shape.b)) want[1] = shape.b;
    if (!near0(shape.c)) want[0] = shape.c;
    return scalarOf(want, folded) != null;
  }

  function usesOtherLetter(text) {
    return /[a-wyz]/i.test(norm(text));
  }

  function normStage(text) {
    if (usesOtherLetter(text)) return "ready";
    if (hasParens(text)) return "expand";
    var combined = combineEq(text);
    if (norm(combined) !== norm(text)) return "combine";
    var parts = eqParts(text);
    if (parts && norm(parts[1]) !== "0") return "move";
    return "ready";
  }

  function emptySt() {
    return {
      sub: null,
      tEq: "",
      tGot: [],
      split: false,
      eqs: [],
      solved: [],
      trails: [],
      heads: [],
      got: [],
    };
  }

  function tWant(pack) {
    return uniqueFracs(pack.quad.roots).map(function (fr) {
      return fr.n / fr.d;
    });
  }

  function letterOf(st, pack) {
    return (st.sub && st.sub.letter) || pack.letter || "t";
  }

  function openBranches(pack, st, message) {
    var letter = letterOf(st, pack);
    return {
      ok: true,
      message:
        message ||
        "כל ערכי " +
          letter +
          " נמצאו. נפתח ענף לכל ערך. רשמו בכל ענף את x^" +
          pack.shape.n +
          " שווה לערך הזה, או פתרו ישר.",
      split: true,
      eqs: pack.branches.map(function (br) {
        return br.eq;
      }),
      solvedFlags: pack.branches.map(function () {
        return false;
      }),
      trails: pack.branches.map(function () {
        return [];
      }),
      heads: pack.branches.map(function (br) {
        return fmtT(br.fr, letter);
      }),
      got: pack.branches.map(function () {
        return [];
      }),
      sub: st.sub || { letter: letter, power: pack.shape.n },
      tEq: st.tEq || pack.tEq,
      tGot: tWant(pack),
    };
  }

  function finishIfNone(pack) {
    if (pack.kind !== "none") return null;
    return {
      ok: true,
      solved: true,
      message: "אין פתרון ממשי.",
      tGot: [],
    };
  }

  function checkFinal(typed, pack) {
    var parsed = parseXList(typed);
    if (!parsed) return null;
    if (parsed.none) {
      if (pack.kind === "none") return { ok: true, solved: true, message: "נכון. אין פתרון ממשי." };
      return {
        ok: false,
        errorId: "falseNoSolution",
        message: "יש פתרון ממשי. אל תסגרו את התרגיל בלי לאסוף את ענפי x.",
      };
    }
    if (pack.kind === "none") {
      return {
        ok: false,
        errorId: "falseRoot",
        message: "אין כאן פתרון ממשי. רשמו שאין פתרון ממשי.",
      };
    }
    var unique = [];
    parsed.vals.forEach(function (v) {
      if (!unique.some(function (u) { return near(u, v); })) unique.push(v);
    });
    if (parsed.vals.length > unique.length && sameSet(unique, pack.xRoots)) {
      return {
        ok: false,
        errorId: "duplicateRoot",
        message: "רשמתם את אותו פתרון פעמיים. כל ערך של x נספר פעם אחת.",
      };
    }
    if (sameSet(parsed.vals, pack.xRoots)) {
      return { ok: true, solved: true, message: "קבוצת הפתרונות: " + pack.answer + "." };
    }
    if (coverCount(parsed.vals, pack.xRoots) < pack.xRoots.length && parsed.vals.every(function (v) {
      return pack.xRoots.some(function (w) { return near(v, w); });
    })) {
      return {
        ok: false,
        errorId: "missingRoot",
        message: "חסר פתרון מהאיסוף הסופי. " + pack.answer + ".",
      };
    }
    return {
      ok: false,
      errorId: "badRoot",
      message: "הערכים לא מתאימים לפתרונות של x. " + pack.answer + ".",
    };
  }

  function checkSub(typed, pack, st) {
    var sub = parseSubLine(typed);
    if (!sub) return null;
    var n = pack.shape.n;
    if (sub.power !== n) {
      if (sub.power === 1) {
        return {
          ok: false,
          errorId: "badSub",
          message: "כתבתם " + sub.letter + "=x. ההצבה המתאימה היא " + sub.letter + "=x^" + n + ".",
        };
      }
      if (sub.power === n * 2) {
        return {
          ok: false,
          errorId: "badSub",
          message: "ההצבה היא החזקה הנמוכה, " + sub.letter + "=x^" + n + ". את x^" + n * 2 + " מחליפים אחר כך ב־" + sub.letter + "^2.",
        };
      }
      return {
        ok: false,
        errorId: "badSub",
        message: "ההצבה לא מתאימה לחזקות שבמשוואה. כאן " + sub.letter + "=x^" + n + ".",
      };
    }
    if (normStage(st.prev || pack.start) !== "ready" && normStage(st.prev || pack.start) !== "ready") {
      return null;
    }
    var stage = normStage(st.prev || pack.standard);
    if (stage !== "ready") {
      return {
        ok: false,
        errorId: "earlySub",
        message: "קודם פותחים סוגריים, מכנסים ומעבירים לאגף אחד, ורק אז מציבים.",
      };
    }
    return {
      ok: true,
      sub: sub,
      message: "ההצבה נשמרה. עכשיו החליפו את x^" + n + " ב־" + sub.letter + " ואת x^" + n * 2 + " ב־" + sub.letter + "^2.",
    };
  }

  function quadMap(shape) {
    var map = {};
    map[2] = shape.a;
    if (!near0(shape.b)) map[1] = shape.b;
    if (!near0(shape.c)) map[0] = shape.c;
    return map;
  }

  function checkT(typed, pack, st) {
    var letter = letterOf(st, pack);
    if (noReal(typed)) {
      if (pack.quad.kind === "none") return { ok: true, solved: true, message: "נכון. אין פתרון ממשי." };
      return { ok: false, errorId: "falseNoSolution", message: "למשוואה ב־" + letter + " יש פתרון ממשי." };
    }
    var assigns = parseAssigns(typed, letter);
    if (!assigns && (st.tEq || st.sub) && letter !== "x") assigns = parseAssigns(typed, "x");
    if (assigns) {
      var want = tWant(pack);
      if (!want.length) {
        return { ok: false, errorId: "falseRoot", message: "אין ערך ממשי של " + letter + "." };
      }
      var merged = (st.tGot || []).slice();
      assigns.forEach(function (v) {
        if (!merged.some(function (u) { return near(u, v); })) merged.push(v);
      });
      var known = assigns.every(function (v) {
        return want.some(function (w) { return near(v, w); });
      });
      if (!known) {
        return { ok: false, errorId: "badTRoot", message: "הערך הזה אינו פתרון של המשוואה ב־" + letter + "." };
      }
      if (coverCount(merged, want) < want.length) {
        return {
          ok: true,
          more: true,
          tGot: merged,
          tEq: st.tEq || pack.tEq,
          sub: st.sub || { letter: letter, power: pack.shape.n },
          message: "נכון לחלק מערכי " + letter + ". רשמו גם את מה שחסר.",
        };
      }
      var opened = openBranches(
        pack,
        st,
        "כל ערכי " + letter + " נמצאו. נפתח ענף לכל ערך. רשמו בכל ענף את x^" + pack.shape.n + " שווה לערך הזה, או פתרו ישר."
      );
      opened.tGot = want;
      return opened;
    }
    var expanded = typed;
    if (hasParens(typed)) {
      var foundLetter = norm(typed).match(/[a-wyz]/i);
      var back = foundLetter ? foundLetter[0].toLowerCase() : letter;
      var asX = typed.replace(/([a-z])\^/gi, "x^").replace(/[a-z]/gi, "x");
      expanded = combineEq(Q().expandParensEq(asX)).replace(/x\^/g, back + "^").replace(/x/g, back);
    }
    var parsed = parseEq(hasParens(expanded) ? combineEq(expanded) : expanded);
    if (!parsed) return null;
    if (parsed.letter === "x") return null;
    var use = parsed.letter || letter;
    if (st.sub && parsed.letter && parsed.letter !== st.sub.letter) {
      return { ok: false, errorId: "badSub", message: "המשיכו עם המשתנה " + st.sub.letter + " שכבר בחרתם." };
    }
    if (doubledPower(parsed.map, pack.shape)) {
      return {
        ok: false,
        errorId: "badSubPower",
        message: "אם " + use + "=x^" + pack.shape.n + " אז x^" + pack.shape.n * 2 + "=" + use + "^2, לא " + use + "^" + pack.shape.n * 2 + ".",
      };
    }
    var wantMap = quadMap(pack.shape);
    var student = {};
    var stray = false;
    Object.keys(parsed.map).forEach(function (k) {
      var e = Number(k);
      if (e !== 0 && e !== 1 && e !== 2 && !near0(parsed.map[k])) stray = true;
      else student[e] = parsed.map[k];
    });
    if (stray) {
      return {
        ok: false,
        errorId: "badSubPower",
        message: "אחרי ההצבה צריכה להתקבל משוואה ריבועית ב־" + use + ": " + asLetter(pack.tEq, use) + ".",
      };
    }
    var bad = mismatch(wantMap, student, use);
    if (bad) return { ok: false, errorId: bad.errorId, message: bad.message };
    if (scalarOf(wantMap, student) == null) {
      return {
        ok: false,
        errorId: "badTQuad",
        message: "המשוואה ב־" + use + " לא שקולה. בדקו מקדמים וסימנים.",
      };
    }
    var shown = asLetter(pack.tEq, use);
    return {
      ok: true,
      tEq: shown,
      sub: st.sub || { letter: use, power: pack.shape.n },
      offerFormula: !near0(pack.shape.b),
      formulaEq: shown,
      message: "ההצבה נכונה. עכשיו פותרים משוואה ריבועית ב־" + use + ".",
    };
  }

  function checkNorm(prev, typed, pack) {
    if (usesOtherLetter(prev) || usesOtherLetter(typed)) {
      return {
        ok: false,
        errorId: "not_equivalent",
        message: "הצעד לא ממשיך את הסידור וגם לא את ההצבה.",
      };
    }
    var stage = normStage(prev);
    if (stage === "expand") {
      var opened = Q().expandParensEq(prev);
      if (norm(opened) === norm(typed) || norm(combineEq(opened)) === norm(typed)) {
        return { ok: true, message: "הסוגריים נפתחו. אם נשארו איברים דומים, כנסו אותם." };
      }
    }
    if (norm(combineEq(prev)) === norm(typed) && norm(combineEq(prev)) !== norm(prev)) {
      return { ok: true, message: "האיברים הדומים כונסו." };
    }
    if (norm(moveEq(prev)) === norm(typed)) {
      return { ok: true, message: "האגפים הועברו. אם צריך, כנסו שוב." };
    }
    if (norm(typed) === norm(pack.standard) || norm(combineEq(moveEq(typed))) === norm(pack.standard)) {
      var ready = parseEq(combineEq(hasParens(typed) ? Q().expandParensEq(typed) : typed));
      if (ready && scalarOf(pack.map, ready.map) != null && (!ready.letter || ready.letter === "x")) {
        return { ok: true, message: "המשוואה שקולה. אפשר להמשיך להצבה." };
      }
    }
    var student = parseEq(hasParens(typed) ? combineEq(Q().expandParensEq(typed)) : combineEq(typed));
    if (student && (!student.letter || student.letter === "x")) {
      if (scalarOf(pack.map, student.map) != null) {
        return { ok: true, message: "המשוואה שקולה." };
      }
      var bad = mismatch(pack.map, student.map, "x");
      if (bad) {
        var id = stage === "expand" ? "badExpand" : stage === "combine" ? "badCombine" : stage === "move" ? "badMove" : bad.errorId;
        return { ok: false, errorId: id, message: bad.message };
      }
      if (stage === "expand") {
        return { ok: false, errorId: "badExpand", message: "פתיחת הסוגריים לא שקולה. כל איבר בסוגר אחד מוכפל בכל איבר בסוגר השני." };
      }
      if (stage === "combine") {
        return { ok: false, errorId: "badCombine", message: "כינוס האיברים לא שקול. מאחדים רק חזקות זהות." };
      }
      if (stage === "move") {
        return { ok: false, errorId: "badMove", message: "בהעברת אגף כל איבר מחליף סימן." };
      }
    }
    return {
      ok: false,
      errorId: "not_equivalent",
      message: "הצעד לא שקול למשוואה. אפשר לפתוח סוגריים, לכנס, או להעביר לאגף אחד.",
    };
  }

  function activeBranches(st) {
    var out = [];
    var i;
    for (i = 0; i < (st.eqs || []).length; i++) {
      if (!st.solved[i]) out.push(i);
    }
    return out;
  }

  function chosenBranch(st) {
    var indexes = activeBranches(st);
    if (!indexes.length) return -1;
    if (st.preferBranch != null && st.preferBranch !== "") {
      var p = Number(st.preferBranch);
      if (indexes.indexOf(p) >= 0) return p;
    }
    return indexes[0];
  }

  function orderedBranches(st) {
    var indexes = activeBranches(st);
    var pick = chosenBranch(st);
    if (pick < 0) return indexes;
    return [pick].concat(indexes.filter(function (i) { return i !== pick; }));
  }

  function checkBranch(typed, pack, st) {
    if (/^x=t(\^|$)/i.test(norm(typed))) {
      return {
        ok: false,
        errorId: "invertedSub",
        message: "חוזרים לפי t=x^" + pack.shape.n + ", כלומר x^" + pack.shape.n + "=t, לא x=t^" + pack.shape.n + ".",
      };
    }
    var subLetter = letterOf(st, pack);
    if (subLetter && subLetter !== "x" && new RegExp(subLetter, "i").test(norm(typed))) {
      return {
        ok: false,
        errorId: "branchLetter",
        message: "בענף הזה הפתרון נרשם ב־x. כתבו x = …",
      };
    }
    var indexes = orderedBranches(st);
    var i;
    var firstErr = null;
    for (i = 0; i < indexes.length; i++) {
      var bi = indexes[i];
      var br = pack.branches[bi];
      var trail = (st.trails && st.trails[bi]) || [];
      var fresh = !trail.length;
      var prev = fresh ? br.eq : trail[trail.length - 1] || br.eq;
      var hit = null;
      if (fresh && norm(typed) === norm(br.eq)) {
        hit = { ok: true, message: "נכון. עכשיו פתרו את " + br.eq + "." };
      } else {
        hit = checkOneBranch(prev, typed, br);
      }
      if (!hit) continue;
      if (!hit.ok) {
        if (!firstErr) firstErr = hit;
        continue;
      }
      var nextTrail = trail.slice();
      if (norm(nextTrail[nextTrail.length - 1]) !== norm(typed)) nextTrail.push(typed);
      var covered = trailRoots(nextTrail);
      var wantNums = xNumbers(br);
      if (!hit.solved && wantNums.length && sameSet(covered, wantNums)) {
        hit = {
          ok: true,
          solved: true,
          message: br.answer || "הענף נפתר.",
        };
      }
      var got = (st.got && st.got[bi] ? st.got[bi].slice() : []);
      if (hit.solved) got = wantNums;
      return {
        ok: true,
        message: hit.message,
        more: !!hit.more,
        branch: bi,
        trail: nextTrail,
        branchSolved: !!hit.solved,
        branchGot: got,
        split: true,
        eqs: st.eqs,
        solvedFlags: st.solved.map(function (flag, k) {
          return k === bi ? !!hit.solved : !!flag;
        }),
        trails: st.trails.map(function (tr, k) {
          return k === bi ? nextTrail : (tr || []).slice();
        }),
        heads: st.heads,
        got: (st.got || []).map(function (g, k) {
          return k === bi ? got : (g || []).slice();
        }),
      };
    }
    if (firstErr) return firstErr;
    var finalHit = checkFinal(typed, pack);
    if (finalHit) return finalHit;
    return {
      ok: false,
      errorId: "badBranch",
      message: "הצעד לא מתאים לענף הפתוח. חזרו להצבה x^" + pack.shape.n + "=t.",
    };
  }

  function checkOneBranch(prev, typed, br) {
    if (norm(prev) === norm(typed)) return { ok: false, message: "זו אותה משוואה. כתבו צעד חדש." };
    if (br.engine === "sqrt") {
      var both = Q().checkSqrtBothSides(prev, typed);
      if (both) return both.ok === false ? both : { ok: true, message: both.message || "הוצאתם שורש משני האגפים." };
      var fin = Q().checkSqrtFinish(typed, br.pack, {});
      if (fin) return fin;
    } else {
      var root = Q().checkHighRootTyped(prev, typed, br.pack);
      if (root) return root;
    }
    if (noReal(typed)) {
      if (br.kind === "none") return { ok: true, solved: true, message: "נכון. מהענף הזה אין פתרון ממשי." };
      if (br.n % 2 === 1) {
        return {
          ok: false,
          errorId: "falseNoSolution",
          message: "חזקה אי־זוגית של מספר שלילי כן נותנת פתרון ממשי אחד.",
        };
      }
      return { ok: false, errorId: "falseNoSolution", message: "בענף הזה יש פתרון ממשי." };
    }
    var listed = parseXList(typed);
    if (listed && !listed.none) {
      var want = xNumbers(br);
      if (br.kind === "none") {
        return {
          ok: false,
          errorId: "falseRoot",
          message: "x^" + br.n + " שלילי בחזקה זוגית, ואין ממנו פתרון ממשי.",
        };
      }
      if (br.n % 2 === 1 && listed.vals.length > 1 && coverCount(listed.vals, want) >= 1) {
        return {
          ok: false,
          errorId: "oddPlusMinus",
          message: "בחזקה אי־זוגית אין ±. יש פתרון ממשי אחד.",
        };
      }
      if (sameSet(listed.vals, want)) return { ok: true, solved: true, message: br.answer || "הענף נפתר." };
    }
    return null;
  }

  function allBranchesDone(solved) {
    return solved && solved.length && solved.every(Boolean);
  }

  function withCollect(res, st) {
    if (!res || !res.split || !res.solvedFlags) return res;
    if (!allBranchesDone(res.solvedFlags)) return res;
    res.solved = true;
    res.message = "כל הענפים נפתרו. " + (st.answerNote || "");
    return res;
  }

  function checkBiquadTyped(prev, typed, pack, st) {
    st = st || emptySt();
    st.prev = prev || pack.start;
    typed = String(typed || "").trim();
    if (!typed) return { ok: false, message: "כתבו את הצעד הבא." };
    if (st.split) {
      var branched = checkBranch(typed, pack, st);
      if (branched && branched.ok && branched.solvedFlags && allBranchesDone(branched.solvedFlags)) {
        branched.solved = true;
        branched.message = "כל הענפים נפתרו. " + pack.answer + ".";
      }
      return branched;
    }
    var finalHit = checkFinal(typed, pack);
    if (finalHit && finalHit.ok && finalHit.solved) return finalHit;
    var sub = checkSub(typed, pack, st);
    if (sub) return sub;
    var tHit = checkT(typed, pack, st);
    if (tHit) return tHit;
    if (finalHit) return finalHit;
    return checkNorm(prev || pack.standard, typed, pack);
  }

  function nextNorm(prev) {
    var stage = normStage(prev);
    if (stage === "expand") {
      return { eq: Q().expandParensEq(prev), explain: "פותחים שכבה אחת של סוגריים." };
    }
    if (stage === "combine") {
      return { eq: combineEq(prev), explain: "מכנסים איברים דומים." };
    }
    if (stage === "move") {
      return { eq: moveEq(prev), explain: "מעבירים לאגף אחד ומחליפים סימן." };
    }
    return null;
  }

  function nextBiquadStep(prev, pack, st) {
    st = st || emptySt();
    prev = prev || pack.start;
    if (st.split) {
      var indexes = activeBranches(st);
      if (!indexes.length) return { solved: true, eq: pack.answer, explain: "כל הענפים נפתרו." };
      var bi = chosenBranch(st);
      var br = pack.branches[bi];
      var trail = (st.trails && st.trails[bi]) || [];
      if (!trail.length) {
        return {
          eq: br.eq,
          explain: "כותבים את המשוואה של הענף לפי ערך " + letterOf(st, pack) + " שמופיע בו.",
          hint: "רשמו " + br.eq + ", או את פתרון x של הענף.",
          branch: bi,
        };
      }
      var cur = trail[trail.length - 1] || br.eq;
      var haveRoots = trailRoots(trail);
      var wantRoots = xNumbers(br);
      if (!haveRoots.length && br.kind === "none") {
        return {
          eq: "אין פתרון ממשי",
          explain: "חזקה זוגית של מספר שלילי אינה נותנת פתרון ממשי.",
          hint: "רשמו שאין פתרון ממשי בענף הזה.",
          branch: bi,
        };
      }
      if (!haveRoots.length && wantRoots.length) {
        return {
          eq: br.answer,
          explain: "רושמים את פתרונות x של הענף.",
          hint: "אפשר לרשום את שני הפתרונות יחד, או אחד ואז את השני.",
          branch: bi,
        };
      }
      if (haveRoots.length && wantRoots.length && coverCount(haveRoots, wantRoots) < wantRoots.length) {
        var missingLine = missingRootLine(br, haveRoots);
        if (missingLine) {
          return {
            eq: missingLine,
            explain: "משלימים את הפתרון שחסר בענף, בלי לחזור לצעד קודם.",
            hint: "כבר נרשם פתרון בענף הזה. רשמו גם את " + missingLine + ".",
            branch: bi,
          };
        }
      }
      var nxt = br.engine === "sqrt" ? Q().nextSqrtStep(cur, br.pack) : Q().nextHighRootStep(cur, br.pack);
      if (!nxt || !nxt.eq) {
        nxt = { eq: br.kind === "none" ? "אין פתרון ממשי" : br.answer, solved: true, explain: "מסיימים את הענף." };
      }
      return {
        eq: nxt.eq,
        explain: nxt.explain || nxt.hint || "ממשיכים בענף של " + fmtT(br.fr, letterOf(st, pack)) + ".",
        hint: nxt.hint || "",
        branch: bi,
        solved: !!nxt.solved,
      };
    }
    var stage = nextNorm(prev);
    if (stage && !usesOtherLetter(prev) && !st.sub && !st.tEq) return stage;
    var letter = letterOf(st, pack);
    if (!st.sub && !st.tEq) {
      return {
        eq: letter + "=x^" + pack.shape.n,
        explain: "מזהים שחזקה אחת כפולה מהשנייה, ומציבים משתנה חדש.",
      };
    }
    if (!st.tEq) {
      return {
        eq: asLetter(pack.tEq, letter),
        explain: "מחליפים את x^" + pack.shape.n + " ב־" + letter + ".",
      };
    }
    if (pack.quad.kind === "none") {
      return { eq: "אין פתרון ממשי", explain: "הדיסקרימיננטה שלילית, אין פתרון ממשי.", solved: true };
    }
    var want = tWant(pack);
    if (coverCount(st.tGot || [], want) >= want.length && want.length) {
      return { eq: tList(pack.quad, letter), explain: "כל ערכי " + letter + " ידועים. פותחים ענף לכל ערך.", split: true };
    }
    if (pack.factored && norm(prev) === norm(asLetter(pack.factored, letter))) {
      return { eq: tList(pack.quad, letter), explain: "מכל גורם מתקבל ערך של " + letter + "." };
    }
    if (!near0(pack.shape.b)) {
      return {
        enter: "formula",
        formulaEq: st.tEq,
        explain: "פותרים את המשוואה הריבועית בנוסחת השורשים, כמו כל משוואה ריבועית מלאה.",
      };
    }
    return { eq: tList(pack.quad, letter), explain: "רושמים את ערכי " + letter + "." };
  }

  function biquadHint(prev, pack, st, level) {
    st = st || emptySt();
    prev = prev || pack.start;
    level = level || 0;
    var n = pack.shape.n;
    var letter = letterOf(st, pack);
    if (st.split) {
      var indexes = activeBranches(st);
      if (!indexes.length) return "אספו את כל פתרונות x מכל הענפים.";
      var bi = chosenBranch(st);
      var openTrail = (st.trails && st.trails[bi]) || [];
      if (!openTrail.length && (st.preferBranch == null || st.preferBranch === "")) {
        return "בכל ענף רשמו x^" + n + " שווה לערך של " + letter + " שמופיע מעליו. אפשר גם לדלג ולרשום ישר את פתרון x.";
      }
      if (!openTrail.length) {
        return "בעמודה הזו רשמו x^" + n + " שווה לערך של " + letter + " שמופיע מעליה. אפשר גם לדלג ולרשום ישר את פתרון x.";
      }
      var br = pack.branches[bi];
      if (!trailRoots(openTrail).length) {
        if (br.kind === "none") return "בענף הזה אין פתרון ממשי. רשמו זאת.";
        if (br.kind === "one") return "רשמו את פתרון x של הענף.";
        return "בענף הזה יש שני פתרונות. רשמו את שניהם יחד, או אחד ואז את השני.";
      }
      if (br.kind === "none") return "בענף הזה x^" + n + " שלילי בחזקה זוגית. אין פתרון ממשי.";
      if (br.engine === "sqrt") {
        var sN = Q().nextSqrtStep((st.trails[bi] || [br.eq]).slice(-1)[0], br.pack);
        return (sN && sN.hint) || "הוציאו שורש משני האגפים.";
      }
      var hN = Q().nextHighRootStep((st.trails[bi] || [br.eq]).slice(-1)[0], br.pack);
      return (hN && hN.hint) || "הוציאו שורש ממעלה " + n + ".";
    }
    var stage = normStage(prev);
    if (stage === "expand" || stage === "combine") return "נסו קודם לפתוח את הסוגריים ולכנס איברים.";
    if (stage === "move") return "כדאי להגיע למשוואה שבה אגף אחד הוא 0.";
    if (!st.tEq && !st.sub) {
      if (level <= 0) return "שימו לב לקשר בין החזקות של x. האם חזקה אחת היא פי 2 מהשנייה?";
      if (level === 1) return "נסו להתייחס ל־x^" + n + " כאל משתנה חדש.";
      return "הציבו " + letter + "=x^" + n + ".";
    }
    if (st.sub && !st.tEq) {
      return "החליפו בכל המשוואה את x^" + n + " ב־" + letter + ", ולכן את x^" + n * 2 + " ב־" + letter + "^2.";
    }
    if ((st.tGot || []).length && coverCount(st.tGot, tWant(pack)) < tWant(pack).length) {
      return "חסר עוד ערך של " + letter + ". אחרי כולם חוזרים להצבה המקורית.";
    }
    if (pack.quad.kind === "none") return "חשבו את הדיסקרימיננטה. אם היא שלילית, אין פתרון ממשי.";
    if (!near0(pack.shape.b)) {
      return "זו משוואה ריבועית מלאה ב־" + letter + ". פתרו אותה בנוסחת השורשים, כמו כל משוואה ריבועית.";
    }
    return "פתרו את המשוואה הריבועית ב־" + letter + ". אחר כך חזרו להצבה " + letter + "=x^" + n + " לכל ערך.";
  }

  function applyBiquad(st, res) {
    if (!res || !res.ok) return st;
    if (res.sub) st.sub = res.sub;
    if (res.tEq) st.tEq = res.tEq;
    if (res.tGot) st.tGot = res.tGot.slice();
    if (res.split) {
      st.split = true;
      if (res.eqs) st.eqs = res.eqs.slice();
      if (res.solvedFlags) st.solved = res.solvedFlags.slice();
      if (res.trails) {
        st.trails = res.trails.map(function (t) {
          return (t || []).slice();
        });
      }
      if (res.heads) st.heads = res.heads.slice();
      if (res.got) {
        st.got = res.got.map(function (g) {
          return (g || []).slice();
        });
      }
    }
    return st;
  }

  function reconstructBiquad(pack, history, factor) {
    var st = emptySt();
    var prev = pack.start;
    var hist = history || [];
    var i;
    for (i = 0; i < hist.length; i++) {
      var line = String(hist[i] || "").trim();
      if (!line) continue;
      if (i === 0 && norm(line) === norm(pack.start)) {
        prev = line;
        continue;
      }
      if (norm(line) === norm(prev)) continue;
      var res = checkBiquadTyped(prev, line, pack, st);
      if (res && res.ok) {
        applyBiquad(st, res);
        if (!res.split) prev = line;
        else prev = line;
      }
    }
    if (!st.split && factor && factor.split && (st.tEq || st.sub)) {
      applyBiquad(st, openBranches(pack, st));
    }
    if (st.split && factor && factor.trails) {
      factor.trails.forEach(function (trail, bi) {
        if (!st.trails[bi]) return;
        (trail || []).forEach(function (line2) {
          var curTrail = st.trails[bi] || [];
          var cur = curTrail.length ? curTrail[curTrail.length - 1] : "";
          if (cur && norm(line2) === norm(cur)) return;
          var res2 = checkBiquadTyped(cur, line2, pack, st);
          if (res2 && res2.ok) applyBiquad(st, res2);
        });
      });
    }
    st.prev = prev;
    return st;
  }

  global.DoctematicaBiquad = {
    analyzeBiquadStart: analyzeBiquadStart,
    checkBiquadTyped: checkBiquadTyped,
    nextBiquadStep: nextBiquadStep,
    biquadHint: biquadHint,
    reconstructBiquad: reconstructBiquad,
    applyBiquad: applyBiquad,
    emptySt: emptySt,
  };
})(typeof window !== "undefined" ? window : global);
