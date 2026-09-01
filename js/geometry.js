(function (global) {
  function pointMap(points) {
    var map = {};
    (points || []).forEach(function (p) {
      map[String(p.label).toUpperCase()] = p;
    });
    return map;
  }

  function getPoint(map, label) {
    var key = String(label || "").toUpperCase();
    if (map && map[key]) return map[key];
    if (key === "O") return { label: "O", x: 0, y: 0 };
    return null;
  }

  function distOrigin(p) {
    if (!p) return null;
    if (near0(p.y)) return Math.abs(p.x);
    if (near0(p.x)) return Math.abs(p.y);
    return Math.sqrt(p.x * p.x + p.y * p.y);
  }

  function distAxis(p, axis) {
    if (!p) return null;
    return axis === "x" ? Math.abs(p.y) : Math.abs(p.x);
  }

  function segmentLength(a, b) {
    if (!a || !b) return null;
    if (nearNum(a.y, b.y)) return Math.abs(a.x - b.x);
    if (nearNum(a.x, b.x)) return Math.abs(a.y - b.y);
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  function near0(v) {
    return Math.abs(v) < 1e-9;
  }

  function nearNum(a, b) {
    return Math.abs(a - b) < 1e-6;
  }

  function gcdInt(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    if (!a) return b || 1;
    if (!b) return a;
    while (b) {
      var t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }

  function fmtFrac(num, den) {
    if (!den || near0(den)) return fmtNum(num);
    var n = Math.round(num);
    var d = Math.round(den);
    if (d < 0) {
      n = -n;
      d = -d;
    }
    var g = gcdInt(n, d);
    n /= g;
    d /= g;
    if (d === 1) return fmtNum(n);
    if (n < 0) return "−" + fmtNum(-n) + "/" + fmtNum(d);
    return fmtNum(n) + "/" + fmtNum(d);
  }

  function fmtLineB(L) {
    if (L && L.bn != null && L.bd && L.bd !== 1) return fmtFrac(L.bn, L.bd);
    if (L && L.b != null && isFinite(L.b) && !nearNum(L.b, Math.round(L.b))) {
      var d;
      for (d = 2; d <= 16; d++) {
        var n = Math.round(L.b * d);
        if (nearNum(n / d, L.b)) return fmtFrac(n, d);
      }
    }
    return fmtNum(L && L.b);
  }

  function fmtNum(n) {
    if (n == null || !isFinite(n)) return "";
    var A = global.DoctematicaAlgebra;
    if (A && A.formatNumber) {
      return String(A.formatNumber(n)).split(" או ")[0];
    }
    if (near0(n)) return "0";
    if (nearNum(n, Math.round(n))) return String(Math.round(n));
    return String(Math.round(n * 1000) / 1000);
  }

  function coordLabel(p) {
    if (!p) return "";
    var lab = String(p.label || "");
    if (p.hideX && p.hideY) return lab;
    var xs = p.hideX ? "?" : fmtNum(p.x);
    var ys = p.hideY ? "?" : fmtNum(p.y);
    return lab + "(" + xs + ";" + ys + ")";
  }

  function coordLabelHTML(p) {
    var plain = coordLabel(p);
    if (!plain || plain.indexOf("/") < 0) return null;
    var MathR = global.DoctematicaMath;
    if (!MathR || typeof MathR.toHTML !== "function") return null;
    return MathR.toHTML(plain);
  }

  function formatPointPair(x, y) {
    return "(" + fmtNum(x) + ";" + fmtNum(y) + ")";
  }

  function parsePointPair(s) {
    var t = rewriteMixedNum(s)
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/,/g, ";");
    var m = t.match(/^\(?([^;)]+)[;,]([^)]+)\)?$/);
    if (!m) return null;
    var x = parseNumberToken(m[1]);
    var y = parseNumberToken(m[2]);
    if (x == null || y == null || !isFinite(x) || !isFinite(y)) return null;
    return { x: x, y: y };
  }

  function pointTaskLabel(task) {
    if (!task) return "";
    return formatPointPair(task.answerX, task.answerY);
  }

  function lineMbValues(line) {
    var L = parseLineSpec(line);
    if (!L || L.vertical != null) return null;
    return { m: L.m, b: L.b };
  }

  function parseLineMbInput(typed, param) {
    var p = String(param || "m").toLowerCase();
    var s = rewriteMixedNum(typed)
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (!s) return null;
    var tagged = s.match(new RegExp("^" + p + "(?:=|:)(.+)$", "i"));
    if (tagged) {
      var tv = parseNumberToken(tagged[1]);
      if (tv != null) return tv;
      var te = evalArithLoose(tagged[1]);
      if (te != null) return te;
    }
    if (p === "m" && /^שיפוע(?:=|:)(.+)$/.test(s)) {
      var sm = s.match(/^שיפוע(?:=|:)(.+)$/)[1];
      var vm = parseNumberToken(sm);
      if (vm != null) return vm;
    }
    if (p === "b" && /^גובה(?:=|:)(.+)$/.test(s)) {
      var sb = s.match(/^גובה(?:=|:)(.+)$/)[1];
      var vb = parseNumberToken(sb);
      if (vb != null) return vb;
    }
    var bare = parseNumberToken(s);
    if (bare != null) return bare;
    return null;
  }

  function lineMbWrongMessage(param, got, want, other, line, progress) {
    var p = String(param || "m").toLowerCase();
    if (other != null && nearNum(got, other) && !nearNum(got, want)) {
      return p === "m"
        ? "זהו הגובה b (המספר החופשי), לא השיפוע m. השיפוע m הוא המקדם של x."
        : "זהו השיפוע m (מקדם של x), לא הגובה b. הגובה b הוא המספר החופשי.";
    }
    if (!near0(want) && nearNum(got, -want)) {
      return "כמעט — בדקו את הסימן.";
    }
    var eq = line ? lineMbDisplayEq(line, progress) : "y = mx + b";
    return p === "m"
      ? "השיפוע m עדיין לא מדויק. במשוואה " + eq + " — m הוא המקדם של x."
      : "הגובה b עדיין לא מדויק. במשוואה " + eq + " — b הוא המספר החופשי (חיתוך עם ציר y).";
  }

  function prettyRearrangeStep(text, rawLine) {
    if (parseSlopeInterceptText(text)) {
      return lineEqDisplayFromText(text, rawLine);
    }
    var s = String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/[·×]/g, "*")
      .replace(/\s+/g, " ")
      .trim();
    s = s.replace(/\s*=\s*/g, " = ");
    s = normalizeFracCoeffEqText(s);
    var Teach = global.DoctematicaTeach;
    if (Teach && typeof Teach.normalizeEqDisplay === "function") {
      s = Teach.normalizeEqDisplay(s);
    }
    return s;
  }

  function lineMbRearrangeComplete(typed, rawLine) {
    if (sameSlopeIntercept(typed, rawLine)) return true;
    var Sys = global.DoctematicaSystems;
    if (!Sys) return false;
    try {
      var iso = Sys.readIsolation(Sys.parseEquation(typed));
      if (!iso || iso.v !== "y") return false;
      return Sys.equivalent(Sys.parseEquation(typed), Sys.parseEquation(sortedLineEq(rawLine)));
    } catch (e) {
      return false;
    }
  }

  function lineMbRearrangeStart(rawLine, progress) {
    if (progress && progress.mbRearrangeExpr) return progress.mbRearrangeExpr;
    if (rawLine && rawLine.eqText) return rawLine.eqText;
    return prettyLineEq(rawLine);
  }

  function formatMovedRhs(c, ax) {
    var parts = [];
    if (!near0(c)) parts.push(fmtNum(c));
    if (!near0(ax)) {
      var xc = -ax;
      if (nearNum(xc, 1)) parts.push("x");
      else if (nearNum(xc, -1)) parts.push("−x");
      else if (xc > 0) parts.push(fmtNum(xc) + "x");
      else parts.push("−" + fmtNum(-xc) + "x");
    }
    if (!parts.length) return "0";
    return parts.join(" + ").replace(/\+ −/g, "− ");
  }

  function formatVarCoeff(coeff, v) {
    if (near0(coeff)) return "";
    if (nearNum(coeff, 1)) return v;
    if (nearNum(coeff, -1)) return "−" + v;
    if (coeff > 0) return fmtNum(coeff) + v;
    return "−" + fmtNum(-coeff) + v;
  }

  function parseLineEqSides(text) {
    var Sys = global.DoctematicaSystems;
    if (!Sys || typeof Sys.parseEquation !== "function") return null;
    try {
      return Sys.parseEquation(text);
    } catch (e) {
      return null;
    }
  }

  function yCoeffIsolated(eq) {
    if (!eq || !eq.left || !eq.right) return null;
    if (!near0(eq.left.y) && near0(eq.left.x) && near0(eq.right.y)) {
      return { ay: eq.left.y, rhs: eq.right };
    }
    if (!near0(eq.right.y) && near0(eq.right.x) && near0(eq.left.y)) {
      return { ay: eq.right.y, rhs: eq.left };
    }
    return null;
  }

  function lineMbRearrangeCandidates(fromText, rawLine) {
    var out = [];
    var seen = {};
    function push(c) {
      var k = normEqText(c);
      if (!k || seen[k]) return;
      seen[k] = true;
      out.push(c);
    }
    var finalForm = sortedLineEq(rawLine);
    if (lineMbRearrangeComplete(fromText, rawLine)) {
      push(lineEqDisplayFromText(fromText));
      return out;
    }
    var eq = parseLineEqSides(fromText);
    if (eq) {
      if (yCoeffIsolated(eq)) {
        push(finalForm);
        return out;
      }
      var ax = eq.left.x - eq.right.x;
      var ay = eq.left.y - eq.right.y;
      var c = eq.right.k - eq.left.k;
      if (!near0(ay)) {
        var lhs = formatVarCoeff(ay, "y");
        var rhs = formatMovedRhs(c, ax);
        if (lhs) push(lhs + " = " + rhs);
      }
    } else {
      var impl = rawLine && rawLine.implicit;
      if (impl && !near0(impl.ay)) {
        var lhsI = formatVarCoeff(impl.ay, "y");
        var rhsI = formatMovedRhs(impl.c, impl.ax);
        if (lhsI) push(lhsI + " = " + rhsI);
      }
    }
    push(finalForm);
    return out;
  }

  function lineMbRearrangeHintMessage(fromText, rawLine) {
    var eq = parseLineEqSides(fromText);
    if (eq && yCoeffIsolated(eq) && !lineMbRearrangeComplete(fromText, rawLine)) {
      return "חלקו את שני האגפים במקדם של y, כדי לקבל y = mx + b.";
    }
    return "העבירו את איבר ה־x לאגף השני, ואז חלקו במקדם של y.";
  }

  function lineMbSuggestNextStep(fromText, rawLine) {
    if (lineMbRearrangeComplete(fromText, rawLine)) return lineEqDisplayFromText(fromText);
    var Sys = global.DoctematicaSystems;
    if (!Sys || typeof Sys.checkWorkStep !== "function") return sortedLineEq(rawLine);
    var cands = lineMbRearrangeCandidates(fromText, rawLine);
    var i;
    for (i = 0; i < cands.length; i++) {
      var cand = cands[i];
      if (normEqText(cand) === normEqText(fromText)) continue;
      var chk = Sys.checkWorkStep(fromText, cand);
      if (chk.ok) return prettyRearrangeStep(cand, rawLine);
    }
    return sortedLineEq(rawLine);
  }

  function lineMbRearrangeDoneMessage(hits) {
    var wantB = !hits || hits.some(function (t) {
      return String(t.param || "").toLowerCase() === "b";
    });
    if (wantB) {
      return "נכון. המשוואה בצורה y = mx + b — עכשיו רשמו את m (למשל m = −3 או רק −3), ואחר כך את b.";
    }
    return "נכון. המשוואה בצורה y = mx + b — עכשיו רשמו את השיפוע (למשל m = 3 או רק 3).";
  }

  function lineMbRearrangeStepMessage(prevText, nextText, rawLine, stepRes, hits) {
    if (lineMbRearrangeComplete(nextText, rawLine)) return lineMbRearrangeDoneMessage(hits);
    var Sys = global.DoctematicaSystems;
    if (Sys) {
      try {
        var iso = Sys.readIsolation(Sys.parseEquation(nextText));
        if (iso && iso.v === "y") {
          if (parseSlopeInterceptText(nextText)) {
            return lineMbRearrangeDoneMessage(hits);
          }
          return "בודדתם את y. המשיכו לצורה y = mx + b (אם צריך — חשבו או סדרו את האגף השני).";
        }
        if (iso && iso.v === "x") {
          return "בודדתם את x. כדי למצוא m ו-b צריך לבודד את y בצד אחד.";
        }
      } catch (e2) {}
    }
    if (stepRes && stepRes.message && /אותה משוואה/.test(stepRes.message)) {
      return stepRes.message;
    }
    if (/^-y\s*=|=\s*[^=]*-y/i.test(String(nextText || ""))) {
      return "צעד חוקי. כדי לקבל y = … אפשר להכפיל את שני האגפים ב־−1.";
    }
    return "צעד חוקי. המשיכו לסדר עד y = mx + b.";
  }

  function checkLineMbRearrange(typed, pack, progress, pending) {
    var hits = preferPartTasks(
      pending.filter(function (t) {
        return t.kind === "lineMb";
      }),
      pack,
      progress
    );
    if (!hits.length) return null;
    if (typedLooksLikeLaterLineEq(typed, pack, progress)) return null;
    var rawLine = lineMbSourceLine(pack, progress, hits[0]);
    if (!lineMbNeedsUnsorted(rawLine) || lineMbRearranged(progress)) return null;
    if (looksLikeLineMbAnswer(typed, hits)) return null;
    if (!looksLikeLinearEq(typed) && !/^y\s*=/i.test(String(typed || ""))) return null;

    if (lineMbRearrangeComplete(typed, rawLine)) {
      var display = sortedLineEq(rawLine) || lineEqDisplayFromText(typed, rawLine);
      return {
        ok: true,
        solved: false,
        mbRearranged: true,
        lineEqDisplay: display,
        show: display,
        rawStep: true,
        message: lineMbRearrangeDoneMessage(hits),
      };
    }

    var prev = lineMbRearrangeStart(rawLine, progress);
    var Sys = global.DoctematicaSystems;
    if (!Sys || typeof Sys.checkWorkStep !== "function") {
      return {
        ok: false,
        message:
          "המשוואה המסודרת לא תואמת את הנתון " +
          lineMbDisplayEq(rawLine, progress) +
          ". בדקו סימנים וחילוק.",
      };
    }

    if (normEqText(typed) === normEqText(prev)) {
      return {
        ok: false,
        message: "זו אותה משוואה. כתבו צעד חדש — למשל העבירו איבר לצד השני.",
      };
    }

    var stepRes = Sys.checkWorkStep(prev, typed);
    if (!stepRes.ok) {
      return { ok: false, message: stepRes.message };
    }

    var pretty = prettyRearrangeStep(typed, rawLine);
    if (lineMbRearrangeComplete(typed, rawLine)) {
      var display2 = sortedLineEq(rawLine) || lineEqDisplayFromText(typed, rawLine);
      return {
        ok: true,
        solved: false,
        mbRearranged: true,
        lineEqDisplay: display2,
        show: display2,
        rawStep: true,
        message: lineMbRearrangeDoneMessage(hits),
      };
    }

    return {
      ok: true,
      solved: false,
      mbRearrangeExpr: pretty,
      show: pretty,
      rawStep: true,
      message: lineMbRearrangeStepMessage(prev, typed, rawLine, stepRes, hits),
    };
  }

  function lineEqSpec(task) {
    var x1 = task && task.x != null ? Number(task.x) : null;
    var y1 = task && task.y != null ? Number(task.y) : null;
    var md = task && task.md != null ? Number(task.md) : 1;
    var mn = task && task.mn != null ? Number(task.mn) : null;
    var m =
      mn != null && md ? mn / md : task && task.m != null ? Number(task.m) : null;
    if (m == null || x1 == null || y1 == null || !isFinite(m)) return null;
    var b = mn != null && md ? y1 - (mn * x1) / md : y1 - m * x1;
    var bn = mn != null && md ? y1 * md - mn * x1 : null;
    var bd = mn != null && md ? md : null;
    return { m: m, x: x1, y: y1, b: b, mn: mn, md: md || 1, bn: bn, bd: bd };
  }


  function parseConstAxisEq(typed) {
    var s = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (!s) return null;
    var m = s.match(/^([xy])=(.+)$/i);
    if (!m) {
      var z = s.match(/^([xy])([+\-][^=]+)=0$/i);
      if (z) {
        var k0 = evalArithLoose(z[2]);
        if (k0 == null) return null;
        return { axis: z[1].toLowerCase(), value: -k0 };
      }
      return null;
    }
    var v = parseNumberToken(m[2]);
    if (v == null) v = evalArithLoose(m[1] === "x" || m[1] === "y" ? m[2] : m[2]);
    if (v == null || !isFinite(v)) return null;
    return { axis: m[1].toLowerCase(), value: v };
  }

  function parsePointAxisTag(tag) {
    var t = normGeoTag(tag);
    if (!t || t.length !== 2) return null;
    var a = t.charAt(0);
    var b = t.charAt(1);
    if ((a === "X" || a === "Y") && b !== "X" && b !== "Y") {
      return { point: b, axis: a.toLowerCase() };
    }
    if ((b === "X" || b === "Y") && a !== "X" && a !== "Y") {
      return { point: a, axis: b.toLowerCase() };
    }
    return null;
  }

  function typedLooksLikeCoordStep(typed, parsed) {
    if (parsed && (parsed.kind === "point" || parsed.kind === "twin")) return true;
    if (parsed && parsePointAxisTag(parsed.tag)) return true;
    if (parsePointPair(typed)) return true;
    if (parseConstAxisEq(typed)) return true;
    if (/^[A-Za-z]\s*\(/.test(String(typed || ""))) return true;
    return false;
  }


  function lineEqYLeft(y1) {
    if (near0(y1)) return "y − 0";
    if (y1 > 0) return "y − " + fmtNum(y1);
    return "y − (" + fmtNum(y1) + ")";
  }

  function lineEqXInner(x1) {
    if (near0(x1)) return "x − 0";
    if (x1 > 0) return "x − " + fmtNum(x1);
    return "x − (" + fmtNum(x1) + ")";
  }

  function lineEqMParen(spec) {
    if (near0(spec.m)) return "0";
    if (nearNum(spec.m, 1)) return "";
    if (nearNum(spec.m, -1)) return "−";
    if (spec.md && spec.md !== 1 && spec.mn != null) {
      if (spec.mn < 0) return "−(" + fmtNum(-spec.mn) + "/" + fmtNum(spec.md) + ")";
      return "(" + fmtNum(spec.mn) + "/" + fmtNum(spec.md) + ")";
    }
    var t = fmtNum(spec.m);
    if (/\//.test(t)) {
      if (/^−/.test(t) || /^-/.test(t)) return "−(" + t.replace(/^−/, "").replace(/^-/, "") + ")";
      return "(" + t + ")";
    }
    return t;
  }

  function lineEqFormatRhs(spec, c) {
    var xs = slopeInterceptXTerm(spec);
    var cText =
      spec.mn != null && spec.md
        ? fmtFrac(-spec.mn * spec.x, spec.md)
        : fmtNum(c);
    if (near0(c)) return xs || "0";
    if (!xs) return cText;
    if (c > 0) return xs + " + " + cText.replace(/^−/, "");
    if (/^−/.test(cText) || /^-/.test(cText)) return xs + " − " + cText.replace(/^−/, "").replace(/^-/, "");
    return xs + " − " + cText;
  }

  function lineEqPointSlope(spec) {
    var yL = lineEqYLeft(spec.y);
    var inn = lineEqXInner(spec.x);
    if (near0(spec.m)) return yL + " = 0";
    if (nearNum(spec.m, 1)) return yL + " = " + inn;
    if (nearNum(spec.m, -1)) return yL + " = −(" + inn + ")";
    return yL + " = " + lineEqMParen(spec) + "(" + inn + ")";
  }

  function lineEqAnswerLine(task) {
    var spec = lineEqSpec(task);
    if (!spec) return null;
    return { m: spec.m, b: spec.b, mn: spec.mn, md: spec.md, bn: spec.bn, bd: spec.bd };
  }

  function lineEqFinalText(task) {
    if (axisLineDir(task)) return axisLineEqText(task);
    var L = lineEqAnswerLine(task);
    return L ? sortedLineEq(L) : "";
  }

  function lineEqMbForm(spec) {
    if (!spec) return "y = mx + b";
    var mx = lineEqMParen(spec) + "x";
    return "y = " + mx + " + b";
  }

  function lineEqMbPlugSteps(task) {
    var spec = lineEqSpec(task);
    if (!spec) return [];
    var out = [];
    function push(s) {
      var k = String(s || "").replace(/\s+/g, "");
      if (!k) return;
      if (out.some(function (u) {
        return String(u).replace(/\s+/g, "") === k;
      })) return;
      out.push(s);
    }
    push(lineEqMbForm(spec));
    var plug = lineEqBPlug(spec);
    push(plug);
    var eqX = lineEqBToX(plug);
    var guard = 0;
    while (guard++ < 10) {
      var nxt = teachLinearNext(eqX);
      if (!nxt || !nxt.eq) break;
      var shown = lineEqXToB(nxt.eq);
      if (out[out.length - 1] === shown) break;
      push(shown);
      eqX = String(nxt.eq).replace(/×/g, "*");
      if (/^\s*b\s*=/i.test(String(shown).replace(/\s+/g, "")) || /^\s*x\s*=/i.test(String(nxt.eq).replace(/\s+/g, ""))) break;
    }
    var bLine = "b = " + (spec.bn != null && spec.bd ? fmtFrac(spec.bn, spec.bd) : fmtNum(spec.b));
    if (out[out.length - 1] !== bLine) push(bLine);
    push(lineEqFinalText(task));
    return out;
  }

  function lineEqSiteSteps(task) {
    if (axisLineDir(task)) {
      var ax = axisLineEqText(task);
      return ax ? [ax] : [];
    }
    if (task && task.plugB) return lineEqMbPlugSteps(task);
    var spec = lineEqSpec(task);
    if (!spec) return [];
    var out = [];
    function push(s) {
      var k = String(s || "").replace(/\s+/g, "");
      if (!k) return;
      if (out.some(function (u) { return String(u).replace(/\s+/g, "") === k; })) return;
      out.push(s);
    }
    var yL = lineEqYLeft(spec.y);
    var c =
      spec.mn != null && spec.md ? -(spec.mn * spec.x) / spec.md : -spec.m * spec.x;
    push(lineEqPointSlope(spec));
    var left = spec.y < 0 ? "y + " + fmtNum(-spec.y) : near0(spec.y) ? "y" : yL;
    var xInner = lineEqXInner(spec.x);
    if (spec.x < 0 && !near0(spec.m)) xInner = "x + " + fmtNum(-spec.x);
    if (spec.x < 0 || spec.y < 0) {
      if (near0(spec.m)) {
        if (spec.y < 0) push(left + " = 0");
      }       else if (nearNum(spec.m, 1)) push(left + " = " + xInner);
      else if (nearNum(spec.m, -1)) push(left + " = −(" + xInner + ")");
      else push(left + " = " + lineEqMParen(spec) + "(" + xInner + ")");
    }
    if (near0(spec.m)) {
      push("y = " + fmtNum(spec.b));
    } else {
      push(left + " = " + lineEqFormatRhs(spec, c));
      if (spec.y > 0) push("y = " + lineEqFormatRhs(spec, c) + " + " + fmtNum(spec.y));
      else if (spec.y < 0) push("y = " + lineEqFormatRhs(spec, c) + " − " + fmtNum(-spec.y));
      else push("y = " + lineEqFormatRhs(spec, c));
    }
    push(lineEqFinalText(task));
    return out;
  }

  function lineEqBPlug(spec) {
    var mx =
      spec.x < 0 || spec.m < 0
        ? fmtNum(spec.m) + "*(" + fmtNum(spec.x) + ")"
        : fmtNum(spec.m) + "*" + fmtNum(spec.x);
    return fmtNum(spec.y) + " = " + mx + " + b";
  }

  function lineEqHasB(s) {
    return /(^|[^A-Za-z])b([^A-Za-z]|$)/i.test(String(s || ""));
  }

  function lineEqBToX(s) {
    return String(s || "").replace(/\b[bB]\b/g, "x");
  }

  function lineEqXToB(s) {
    return String(s || "").replace(/\bx\b/g, "b");
  }

  function lineEqSysEquivalent(a, b) {
    var Sys = global.DoctematicaSystems;
    if (!Sys) return false;
    try {
      return Sys.equivalent(Sys.parseEquation(a), Sys.parseEquation(b));
    } catch (e) {
      return false;
    }
  }

  /** סיום רק ב־y = mx + b (לא הצבה בנוסחה, גם אם שקולה). */
  function lineEqComplete(typed, task) {
    if (axisLineDir(task)) return axisLineComplete(typed, task);
    var L = lineEqAnswerLine(task);
    if (!L) return false;
    return sameSlopeIntercept(typed, L);
  }

  function lineEqPretty(text, task) {
    if (lineEqComplete(text, task)) return lineEqFinalText(task);
    return prettyRearrangeStep(text, lineEqAnswerLine(task));
  }

  function lineEqIsolatedB(typed, spec) {
    var t = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var m = t.match(/^b=(.+)$/i) || t.match(/^(.+)=b$/i);
    if (!m) return null;
    var v = parseNumberToken(m[1]) || evalArithLoose(m[1]);
    if (v == null) return null;
    return nearNum(v, spec.b) ? spec.b : null;
  }

  function lineEqParenCount(s) {
    return (String(s || "").match(/\(/g) || []).length;
  }

  function lineEqYIsolatedText(s) {
    return /^\s*y\s*=/i.test(String(s || ""));
  }

  /** לא לחזור לסוגריים / ל־y−y₁ אחרי שכבר התקדמו. */
  function lineEqIsBackward(prev, next) {
    if (lineEqParenCount(next) > lineEqParenCount(prev)) return true;
    if (lineEqYIsolatedText(prev) && !lineEqYIsolatedText(next)) return true;
    return false;
  }

  function lineEqSiteIndex(text, steps) {
    var n = normEqText(text);
    var found = -1;
    var i;
    for (i = 0; i < steps.length; i++) {
      if (normEqText(steps[i]) === n) found = i;
    }
    return found;
  }

  function lineEqSuggestNext(fromText, task) {
    if (axisLineDir(task)) return axisLineEqText(task);
    var spec = lineEqSpec(task);
    var finalEq = lineEqFinalText(task);
    if (!spec) return finalEq;
    var prev = String(fromText || "").trim();
    if (!prev) return task.plugB ? lineEqMbForm(spec) : lineEqPointSlope(spec);
    if (lineEqComplete(prev, task)) return finalEq;
    if (lineEqHasB(prev) && !/y/i.test(prev)) {
      var iso = lineEqIsolatedB(prev, spec);
      if (iso != null) return finalEq;
      var Algebra = global.DoctematicaAlgebra;
      var Teach = global.DoctematicaTeach;
      var prevX = lineEqBToX(prev);
      if (Teach && Teach.nextAction) {
        var act = Teach.nextAction(prevX);
        if (act && act.eq) return lineEqXToB(act.eq);
      }
      if (Algebra && Algebra.checkStep) {
        try {
          var nxt = teachLinearNext(prevX);
          if (nxt && nxt.eq) return lineEqXToB(nxt.eq);
        } catch (e1) {}
      }
      return finalEq;
    }
    var Sys = global.DoctematicaSystems;
    var steps = lineEqSiteSteps(task);
    var idx = lineEqSiteIndex(prev, steps);
    if (idx >= 0 && idx < steps.length - 1) return steps[idx + 1];
    if (idx === steps.length - 1) return finalEq;
    var i;
    for (i = 0; i < steps.length; i++) {
      if (normEqText(steps[i]) === normEqText(prev)) continue;
      if (lineEqIsBackward(prev, steps[i])) continue;
      if (Sys && typeof Sys.checkWorkStep === "function") {
        var chk = Sys.checkWorkStep(prev, steps[i]);
        if (chk.ok) return steps[i];
      } else if (lineEqSysEquivalent(prev, steps[i]) && !lineEqIsBackward(prev, steps[i])) {
        return steps[i];
      }
    }
    return finalEq;
  }

  function storeFoundLineEq(pack, progress, display) {
    var lineEq = Object.assign({}, (progress && progress.lineEq) || {});
    if (!display) return lineEq;
    ((pack && pack.lines) || []).forEach(function (item) {
      if (!item || !item.key || !item.line) return;
      if (item.line && item.line.vertical != null) {
        var vx = Number(item.line.vertical);
        var gotV = parseConstAxisEq(display);
        if (gotV && gotV.axis === "x" && nearNum(gotV.value, vx)) lineEq[item.key] = display;
        return;
      }
      if (item.line && sameSlopeIntercept(display, item.line)) {
        lineEq[item.key] = display;
      }
    });
    return lineEq;
  }

  function markPriorSlopes(pack, progress, eqTask, maps) {
    if (!eqTask || !pack) return;
    var map = taskByIdMap(pack);
    var parts = pack.parts || [];
    var i;
    var j;
    var stop = false;
    for (i = 0; i < parts.length && !stop; i++) {
      var ids = parts[i].taskIds || [];
      for (j = 0; j < ids.length; j++) {
        if (ids[j] === eqTask.id) {
          stop = true;
          break;
        }
        var u = map[ids[j]];
        if (
          u &&
          !maps.done[u.id] &&
          (isSlopeLikeTask(u) || u.kind === "midpoint" || u.kind === "point")
        ) {
          maps.done[u.id] = true;
          maps.coords[u.id] = { x: true, y: true };
          delete maps.partial[u.id];
          delete maps.lastExpr[u.id];
        }
      }
    }
  }

  function isSlopeLikeTask(t) {
    if (!t) return false;
    if (t.kind === "slope") return true;
    return t.kind === "lineMb" && String(t.param || "m").toLowerCase() !== "b";
  }

  function currentPartSlopeTask(pack, progress) {
    var focus = currentFocusTask(pack, progress);
    if (focus && isSlopeLikeTask(focus)) return focus;
    var part = currentPartText(pack, progress);
    var map = taskByIdMap(pack);
    var ids = (part && part.taskIds) || [];
    var i;
    for (i = 0; i < ids.length; i++) {
      var t = map[ids[i]];
      if (t && isSlopeLikeTask(t) && !(progress.done && progress.done[t.id])) return t;
    }
    return null;
  }

  function laterLineEqForSlope(pack, progress, slopeTask) {
    if (!pack || !slopeTask) return null;
    var same = partTaskChainContext(pack, progress, slopeTask).later.filter(function (u) {
      return u.kind === "lineEq";
    })[0];
    if (same) return same;
    var map = taskByIdMap(pack);
    var parts = pack.parts || [];
    var past = false;
    var i;
    var j;
    for (i = 0; i < parts.length; i++) {
      var ids = parts[i].taskIds || [];
      if (!past) {
        if (ids.indexOf(slopeTask.id) >= 0) past = true;
        continue;
      }
      for (j = 0; j < ids.length; j++) {
        var u = map[ids[j]];
        if (!u || u.kind !== "lineEq") continue;
        if (progress.done && progress.done[u.id]) continue;
        if (slopeTask.kind === "slope" && slopeTask.label && u.label) {
          var a = String(slopeTask.label).toUpperCase();
          var b = String(u.label).toUpperCase();
          if (a && b && a !== "M" && b !== "M" && a !== b) continue;
        }
        return u;
      }
    }
    return null;
  }

  function typedLooksLikeLaterLineEq(typed, pack, progress) {
    var skipEq = laterLineEqForSlope(pack, progress, currentPartSlopeTask(pack, progress));
    if (!skipEq || !typed) return false;
    if (lineEqComplete(typed, skipEq)) return true;
    var spec = lineEqSpec(skipEq);
    if (!spec) return false;
    if (lineEqSysEquivalent(typed, lineEqPointSlope(spec))) return true;
    var got = parseSlopeInterceptText(typed);
    return !!(got && nearNum(got.m, spec.m) && nearNum(got.b, spec.b));
  }

  function finishLineEq(task, show, doneMap, partialMap, coordsMap, pack, progress) {
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.done[task.id] = true;
    delete maps.partial[task.id];
    delete maps.lastExpr[task.id];
    markPriorSlopes(pack, progress, task, maps);
    var display = lineEqFinalText(task);
    var left = remainingRequired(pack, maps.done);
    return {
      ok: true,
      solved: left.length === 0,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      lineEqDisplay: display,
      lineEq: storeFoundLineEq(pack, progress, display),
      task: task,
      show: show || display,
      rawStep: true,
      message: left.length ? "נכון. המשיכו." : "נכון. זו משוואת הישר.",
    };
  }

  function partialLineEq(task, show, msg, doneMap, partialMap, coordsMap, progress, pack) {
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.partial[task.id] = true;
    maps.lastExpr[task.id] = show;
    markPriorSlopes(pack, progress, task, maps);
    return {
      ok: true,
      solved: false,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      task: task,
      show: show,
      rawStep: true,
      message: msg,
    };
  }

  function segmentLineFromEnds(a, b) {
    if (!a || !b) return null;
    if (nearNum(a.x, b.x)) return { vertical: a.x, a: a, bpt: b };
    var m = (b.y - a.y) / (b.x - a.x);
    return { m: m, b: a.y - m * a.x, a: a, bpt: b };
  }


  function checkLineEq(typed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var pendingEq = (pending || []).filter(function (t) {
      return t.kind === "lineEq";
    });
    var hits = preferPartTasks(pendingEq, pack, progress);
    var raw = String(typed || "").trim();
    if (typedLooksLikeFindMidpoint(typed, pack, progress) && !typedLooksLikeLaterLineEq(typed, pack, progress)) {
      return null;
    }
    if (checkGivenLineRearrange(typed, pack, progress)) return null;
    if (
      typedLooksLikeCoordStep(typed, extractAnswerValue(typed)) &&
      !typedLooksLikeLaterLineEq(typed, pack, progress)
    ) {
      var coordIsLine =
        (hits[0] && lineEqComplete(raw, hits[0])) ||
        pendingEq.some(function (u) {
          return lineEqComplete(raw, u);
        });
      if (!coordIsLine) return null;
    }
    if (!hits.length) {
      var slopeNow = currentPartSlopeTask(pack, progress);
      var skipEq = laterLineEqForSlope(pack, progress, slopeNow);
      if (
        skipEq &&
        raw &&
        (lineEqComplete(raw, skipEq) ||
          looksLikeLinearEq(raw) ||
          /^y/i.test(String(raw || "").replace(/\s+/g, "")) ||
          lineEqHasB(raw))
      ) {
        hits = [skipEq];
      }
    }
    if (!hits.length) return null;
    var task = hits[0];
    if (axisLineDir(task)) {
      return checkAxisLineEq(raw, pack, progress, task, pendingEq, doneMap, partialMap, coordsMap);
    }
    var spec = lineEqSpec(task);
    if (!spec || !raw) return null;
    if (lineEqComplete(raw, task)) {
      return finishLineEq(task, lineEqFinalText(task), doneMap, partialMap, coordsMap, pack, progress);
    }

    var looksEq =
      looksLikeLinearEq(raw) ||
      /^y/i.test(String(raw || "").replace(/\s+/g, "")) ||
      lineEqHasB(raw);
    if (!looksEq) return null;

    var gotMb = parseSlopeInterceptText(raw);
    if (gotMb && spec && nearNum(gotMb.m, spec.m) && !nearNum(gotMb.b, spec.b)) {
      if (near0(spec.b) && spec.x != null && spec.y != null && near0(spec.x) && near0(spec.y)) {
        return {
          ok: false,
          message: "הישר עובר בראשית הצירים, לכן b = 0 — לא מעתיקים את הגובה של הישר הנתון.",
        };
      }
      var thru =
        spec.x != null && spec.y != null
          ? " (" + fmtNum(spec.x) + ";" + fmtNum(spec.y) + ")"
          : "";
      return {
        ok: false,
        message: "השיפוע נכון, אבל הישר לא עובר בנקודה" + thru + ". בדקו את ההצבה ל־b.",
      };
    }

    if (lineEqComplete(raw, task)) {
      return finishLineEq(task, lineEqFinalText(task), doneMap, partialMap, coordsMap, pack, progress);
    }

    var isoB = lineEqIsolatedB(raw, spec);
    if (isoB != null) {
      return partialLineEq(
        task,
        "b = " + fmtNum(spec.b),
        "נכון. עכשיו רשמו את משוואת הישר y = mx + b.",
        doneMap,
        partialMap,
        coordsMap,
        progress,
        pack
      );
    }

    if (lineEqHasB(raw) && /^y\s*=/i.test(raw) && /b/i.test(raw) && /x/i.test(raw)) {
      var gotForm = parseSlopeInterceptText(String(raw).replace(/\b[bB]\b/g, "0"));
      if (!gotForm || nearNum(gotForm.m, spec.m) || /mx|\bmx\b/i.test(raw)) {
        return partialLineEq(
          task,
          prettyRearrangeStep(raw, lineEqAnswerLine(task)),
          "נכון. הציבו את הנקודה במשוואה כדי למצוא את b (למשל " + lineEqBPlug(spec) + ").",
          doneMap,
          partialMap,
          coordsMap,
          progress,
          pack
        );
      }
    }

    var prev = (progress.lastExpr && progress.lastExpr[task.id]) || "";
    var Sys = global.DoctematicaSystems;
    var Algebra = global.DoctematicaAlgebra;

    if (lineEqHasB(raw) && !/y/i.test(raw)) {
      var startB = lineEqBPlug(spec);
      var prevB = prev && lineEqHasB(prev) ? prev : startB;
      if (normEqText(raw) === normEqText(prevB)) {
        return { ok: false, message: "זו אותה משוואה. כתבו צעד חדש." };
      }
      var startX = lineEqBToX(startB);
      var prevX = lineEqBToX(prevB);
      var nextX = lineEqBToX(raw);
      var acceptedB = false;
      if (Algebra && typeof Algebra.checkStep === "function") {
        try {
          var r1 = Algebra.checkStep(prevX, nextX);
          if (r1 && (r1.ok || r1.same || r1.solved)) acceptedB = true;
        } catch (e2) {}
        if (!acceptedB && prevX !== startX) {
          try {
            var r0 = Algebra.checkStep(startX, nextX);
            if (r0 && (r0.ok || r0.same || r0.solved)) acceptedB = true;
          } catch (e3) {}
        }
      }
      if (!acceptedB) {
        return { ok: false, message: "הצעד לא שקול. בדקו הצבה וסימנים. אפשר " + startB + "." };
      }
      var isoAfter = isolatedXValueLineEq(nextX);
      if (isoAfter != null && nearNum(isoAfter, spec.b)) {
        return partialLineEq(
          task,
          "b = " + fmtNum(spec.b),
          "נכון. עכשיו רשמו את משוואת הישר y = mx + b.",
          doneMap,
          partialMap,
          coordsMap,
          progress,
          pack
        );
      }
      return partialLineEq(
        task,
        lineEqPretty(raw, task),
        "צעד חוקי. המשיכו לבודד את b, ואז רשמו y = mx + b.",
        doneMap,
        partialMap,
        coordsMap,
        progress,
        pack
      );
    }

    var startPs = lineEqPointSlope(spec);
    if (!prev) {
      var okStart = lineEqSysEquivalent(raw, startPs);
      if (!okStart) {
        var i0;
        var steps0 = lineEqSiteSteps(task);
        for (i0 = 0; i0 < steps0.length; i0++) {
          if (lineEqSysEquivalent(raw, steps0[i0])) {
            okStart = true;
            break;
          }
        }
      }
      if (!okStart && Sys && typeof Sys.checkWorkStep === "function") {
        var st0 = Sys.checkWorkStep(startPs, raw);
        if (st0 && st0.ok) okStart = true;
      }
      if (!okStart) {
        return {
          ok: false,
          message:
            "התחילו בנוסחה y − y₁ = m(x − x₁), למשל " +
            startPs +
            ". אפשר גם להציב ב־y = mx + b ולמצוא את b.",
        };
      }
      if (lineEqComplete(raw, task)) {
        return finishLineEq(task, lineEqFinalText(task), doneMap, partialMap, coordsMap, pack, progress);
      }
      return partialLineEq(
        task,
        lineEqPretty(raw, task),
        "נכון. פתחו סוגריים והעבירו אגפים עד y = mx + b.",
        doneMap,
        partialMap,
        coordsMap,
        progress,
        pack
      );
    }

    if (normEqText(raw) === normEqText(prev)) {
      return { ok: false, message: "זו אותה משוואה. כתבו צעד חדש — למשל פתיחת סוגריים או העברת אגף." };
    }
    if (!Sys || typeof Sys.checkWorkStep !== "function") {
      return { ok: false, message: "לא ניתן לבדוק את הצעד." };
    }
    var stepRes = Sys.checkWorkStep(prev, raw);
    if (!stepRes.ok) {
      if (lineEqSysEquivalent(raw, startPs) || lineEqComplete(raw, task)) {
        if (lineEqComplete(raw, task)) {
          return finishLineEq(task, lineEqFinalText(task), doneMap, partialMap, coordsMap, pack, progress);
        }
      } else {
        return { ok: false, message: stepRes.message || "הצעד לא שקול. בדקו העברת אגפים ופתיחת סוגריים." };
      }
    }
    if (lineEqComplete(raw, task)) {
      return finishLineEq(task, lineEqFinalText(task), doneMap, partialMap, coordsMap, pack, progress);
    }
    return partialLineEq(
      task,
      lineEqPretty(raw, task),
      "צעד חוקי. המשיכו עד y = mx + b.",
      doneMap,
      partialMap,
      coordsMap,
      progress,
      pack
    );
  }

  function isolatedXValueLineEq(eq) {
    var bits = String(eq || "").split("=");
    if (bits.length < 2) return null;
    var L = bits[0].replace(/\s+/g, "");
    var R = bits[bits.length - 1];
    if (/^x$/i.test(L)) return parseNumberToken(R) || evalArithLoose(R);
    if (/^x$/i.test(R)) return parseNumberToken(L) || evalArithLoose(L);
    return null;
  }

  function canonicalLineEqSteps(task) {
    if (!task || task.kind !== "lineEq") return [];
    return lineEqSiteSteps(task);
  }

  function checkLineMb(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var hits = preferPartTasks(
      pending.filter(function (t) {
        return t.kind === "lineMb";
      }),
      pack,
      progress
    );
    if (!hits.length) return null;
    var phit = hits[0];
    var rawLine = lineMbSourceLine(pack, progress, phit);
    var vals = lineMbValues(rawLine);
    if (!vals) return null;
    var param = String(phit.param || phit.label || "m").toLowerCase();
    var want = param === "b" ? vals.b : vals.m;
    var other = param === "b" ? vals.m : vals.b;
    var got =
      parsed && parsed.value != null && isFinite(parsed.value)
        ? parsed.value
        : parseLineMbInput(typed, param);
    if (got == null) {
      if (
        lineMbRearranged(progress) &&
        (parseSlopeInterceptText(typed) || /^y\s*=/i.test(String(typed || "")))
      ) {
        return {
          ok: false,
          message:
            param === "m"
              ? "כבר סידרתם נכון. עכשיו רשמו את השיפוע m (למשל m = −3 או רק −3)."
              : "כבר סידרתם נכון. עכשיו רשמו את הגובה b (למשל b = 10 או רק 10).",
        };
      }
      return {
        ok: false,
        message:
          param === "m"
            ? "רשמו את השיפוע m (למשל m = −6 או רק את המספר)."
            : "רשמו את הגובה b (למשל b = 3 או רק את המספר).",
      };
    }
    if (!nearNum(got, want)) {
      return {
        ok: false,
        message: lineMbWrongMessage(param, got, want, other, rawLine, progress),
      };
    }
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.done[phit.id] = true;
    delete maps.partial[phit.id];
    var left = remainingRequired(pack, maps.done);
    var show = phit.label + " = " + fmtNum(want);
    var res = {
      ok: true,
      solved: left.length === 0,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      task: phit,
      show: show,
      message:
        left.length === 0
          ? "נכון. " + show + ". כל התשובות נכונות."
          : "נכון. " + show + ". המשיכו.",
    };
    if (lineMbNeedsUnsorted(rawLine) && !lineMbRearranged(progress)) {
      res.lineEqDisplay = sortedLineEq(rawLine);
    }
    return res;
  }

  function slopePairFromPack(pack, task) {
    var map = (pack && pack.map) || {};
    var a = getPoint(map, (task && task.from) || "A");
    var b = getPoint(map, (task && task.to) || "B");
    if ((!a || !b) && pack && pack.points && pack.points.length >= 2) {
      a = pack.points[0];
      b = pack.points[1];
    }
    return { a: a, b: b };
  }

  function slopeWant(pack, task) {
    if (task && task.parallel && task.m != null && isFinite(task.m)) return Number(task.m);
    if (task && task.perpendicular) {
      var pw = perpWantFromGiven(perpGivenSlope(pack, task), task);
      if (pw != null) return pw;
    }
    if (task && task.answer != null && isFinite(task.answer)) return Number(task.answer);
    if (task && task.m != null && isFinite(task.m)) return Number(task.m);
    var pair = slopePairFromPack(pack, task);
    if (!pair.a || !pair.b || nearNum(pair.a.x, pair.b.x)) return null;
    return (pair.b.y - pair.a.y) / (pair.b.x - pair.a.x);
  }

  function slopeEasyOrder(a, b) {
    if (!a || !b) return { p1: a, p2: b };
    var abMinus = slopeHasDoubleMinus(a, b);
    var baMinus = slopeHasDoubleMinus(b, a);
    if (abMinus && !baMinus) return { p1: a, p2: b };
    if (baMinus && !abMinus) return { p1: b, p2: a };
    if (a.x <= b.x) return { p1: a, p2: b };
    return { p1: b, p2: a };
  }

  function fmtSlopeDiff(left, right) {
    var L = fmtNum(left);
    if (right < 0) return L + " − (" + fmtNum(right) + ")";
    return L + " − " + fmtNum(right);
  }

  function fmtSlopePlus(left, right) {
    if (right < 0) return fmtNum(left) + " + " + fmtNum(-right);
    return fmtSlopeDiff(left, right);
  }

  function slopeTagNorm(s) {
    var t = String(s || "").replace(/^m/i, "").trim();
    if (/^(III|II|I)$/i.test(t)) return t.toUpperCase();
    if (/^\d+$/.test(t)) return t;
    if (/^[A-Za-z]{1,4}$/.test(t)) return t.toUpperCase();
    return "";
  }


  function slopeLhs(task) {
    if (task && task.parallel) return "m" + parallelNewSlopeTag(task);
    var a = String((task && task.from) || "A").toUpperCase();
    var b = String((task && task.to) || "B").toUpperCase();
    if (/^[A-Z]$/.test(a) && /^[A-Z]$/.test(b) && a !== b) return "m" + a + b;
    return "m";
  }

  function slopeLhsFromTyped(typed, task) {
    var s = String(typed || "").replace(/\s+/g, "");
    var m = s.match(/^m_?([A-Za-z]{2,3})(?:=|:)/i);
    if (m) return "m" + m[1].toUpperCase();
    return slopeLhs(task);
  }

  function slopeTagLetters(typed) {
    var s = String(typed || "").replace(/\s+/g, "");
    var m = s.match(/^m_?([A-Za-z]{2,3})(?:=|:)/i);
    if (!m) return "";
    return m[1].toUpperCase().slice(0, 2);
  }

  function slopeTaskLetters(task) {
    return {
      from: String((task && task.from) || "A").toUpperCase(),
      to: String((task && task.to) || "B").toUpperCase(),
    };
  }

  function slopeNamedPointsMsg(task, pack) {
    var labs = slopeTaskLetters(task);
    var fromMap = pack && pack.map ? Object.keys(pack.map) : [];
    if (fromMap.length >= 2) {
      return "בציור הנקודות הן " + fromMap.join(", ") + ". רשמו " + slopeLhs(task) + ".";
    }
    return "רשמו " + slopeLhs(task) + " (הנקודות " + labs.from + " ו־" + labs.to + ").";
  }

  function resolveSlopeByLetters(pack, slopeTasks, letters) {
    if (!letters || letters.length < 2) return { kind: "none" };
    var L1 = letters.charAt(0);
    var L2 = letters.charAt(1);
    var map = (pack && pack.map) || {};
    var p1 = getPoint(map, L1);
    var p2 = getPoint(map, L2);
    if (!p1 || !p2) {
      return { kind: "unknown", letters: letters };
    }
    var i;
    for (i = 0; i < (slopeTasks || []).length; i++) {
      var t = slopeTasks[i];
      var labs = slopeTaskLetters(t);
      if (
        (labs.from === L1 && labs.to === L2) ||
        (labs.from === L2 && labs.to === L1)
      ) {
        return { kind: "task", task: t, a: p1, b: p2 };
      }
    }
    return { kind: "wrong-line", letters: letters, a: p1, b: p2 };
  }

  function slopePlugText(p1, p2, task) {
    return slopeLhs(task) + " = (" + fmtSlopeDiff(p2.y, p1.y) + ")/(" + fmtSlopeDiff(p2.x, p1.x) + ")";
  }

  function slopePlusText(p1, p2, task) {
    return slopeLhs(task) + " = (" + fmtSlopePlus(p2.y, p1.y) + ")/(" + fmtSlopePlus(p2.x, p1.x) + ")";
  }

  function slopeHasDoubleMinus(p1, p2) {
    if (!p1 || !p2) return false;
    return p1.y < 0 || p1.x < 0;
  }

  function fmtSlopeSide(side) {
    if (!side) return "";
    if (side.plus) return fmtNum(side.a) + " + " + fmtNum(-side.b);
    return fmtSlopeDiff(side.a, side.b);
  }

  function formulaNeedsPlus(got) {
    if (!got || !got.num || !got.den || got.atomic) return false;
    return (got.num.b < 0 && !got.num.plus) || (got.den.b < 0 && !got.den.plus);
  }

  function slopePlusRewriteText(got, task) {
    if (!got || !got.num || !got.den) return "";
    function part(side) {
      if (side.b < 0) return fmtNum(side.a) + " + " + fmtNum(-side.b);
      return fmtSlopeDiff(side.a, side.b);
    }
    return slopeLhs(task) + " = (" + part(got.num) + ")/(" + part(got.den) + ")";
  }

  function slopeReducedFrac(num, den) {
    if (near0(den)) return null;
    if (near0(num)) return "0";
    var A = global.DoctematicaAlgebra;
    if (A && A.formatNumber) {
      var t = A.formatNumber(num / den);
      return String(t).split(" או ")[0];
    }
    return fmtNum(num / den);
  }

  function rewriteMixedNum(s) {
    return String(s || "").replace(/(-?\d+)\s+(\d+)\s*\/\s*(\d+)/g, function (_, w, n, d) {
      var ww = parseInt(w, 10);
      var nn = parseInt(n, 10);
      var dd = parseInt(d, 10);
      if (!dd) return _;
      var sign = ww < 0 ? -1 : 1;
      return String(sign * (Math.abs(ww) * dd + nn)) + "/" + d;
    });
  }

  function stripOuterParensBalanced(t) {
    var s = String(t || "");
    while (s.length >= 2 && s.charAt(0) === "(" && s.charAt(s.length - 1) === ")") {
      var depth = 0;
      var ok = true;
      var i;
      for (i = 0; i < s.length; i++) {
        if (s.charAt(i) === "(") depth++;
        else if (s.charAt(i) === ")") {
          depth--;
          if (depth < 0) {
            ok = false;
            break;
          }
          if (depth === 0 && i !== s.length - 1) {
            ok = false;
            break;
          }
        }
      }
      if (!ok || depth !== 0) break;
      s = s.slice(1, -1);
    }
    return s;
  }

  function parseParenNumber(s) {
    return parseNumberToken(stripOuterParensBalanced(s));
  }

  function splitAtDepthZero(s, ch) {
    var depth = 0;
    var i;
    for (i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (c === ch && depth === 0) return { left: s.slice(0, i), right: s.slice(i + 1) };
    }
    return null;
  }

  function parseSlopeDiffExpr(expr) {
    var t = rewriteMixedNum(expr)
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    t = stripOuterParensBalanced(t);
    if (!t) return null;
    var atomic = parseParenNumber(t);
    if (atomic != null) return { a: atomic, b: 0, value: atomic, atomic: true };
    var depth = 0;
    var i;
    for (i = 1; i < t.length; i++) {
      var c = t.charAt(i);
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (c === "-" && depth === 0) {
        var a = parseParenNumber(t.slice(0, i));
        var b = parseParenNumber(t.slice(i + 1));
        if (a == null || b == null) continue;
        return { a: a, b: b, value: a - b };
      }
    }
    depth = 0;
    for (i = 1; i < t.length; i++) {
      c = t.charAt(i);
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (c === "+" && depth === 0) {
        var ap = parseParenNumber(t.slice(0, i));
        var bp = parseParenNumber(t.slice(i + 1));
        if (ap == null || bp == null) continue;
        return { a: ap, b: -bp, value: ap + bp, plus: true };
      }
    }
    return null;
  }

  function parseSlopeFormula(typed) {
    var s = rewriteMixedNum(typed)
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    s = s.replace(/^m(?:_?[A-Za-z]{2,3})?(?:=|:)/i, "");
    if (!s || s.indexOf("/") < 0) return null;
    var parts = splitAtDepthZero(s, "/");
    if (!parts) return null;
    var num = parseSlopeDiffExpr(parts.left);
    var den = parseSlopeDiffExpr(parts.right);
    if (!num || !den) return null;
    if (near0(den.value)) return { kind: "vertical", num: num, den: den };
    return {
      num: num,
      den: den,
      value: num.value / den.value,
      atomic: !!(num.atomic && den.atomic),
    };
  }

  function nearPair(u, v, p, q) {
    return nearNum(u, p) && nearNum(v, q);
  }

  function classifySlopeFormula(got, a, b) {
    if (!got || !a || !b) return { kind: "unknown" };
    var y1 = a.y;
    var y2 = b.y;
    var x1 = a.x;
    var x2 = b.x;
    var nA = got.num.a;
    var nB = got.num.b;
    var dA = got.den.a;
    var dB = got.den.b;
    if (nearPair(nA, nB, y2, y1) && nearPair(dA, dB, x2, x1)) return { kind: "ok", order: "ab" };
    if (nearPair(nA, nB, y1, y2) && nearPair(dA, dB, x1, x2)) return { kind: "ok", order: "ba" };
    if (nearPair(nA, nB, x2, x1) && nearPair(dA, dB, y2, y1)) return { kind: "swap" };
    if (nearPair(nA, nB, x1, x2) && nearPair(dA, dB, y1, y2)) return { kind: "swap" };
    if (
      (nearPair(nA, nB, y2, y1) && nearPair(dA, dB, x1, x2)) ||
      (nearPair(nA, nB, y1, y2) && nearPair(dA, dB, x2, x1))
    ) {
      return { kind: "mixed" };
    }
    if (got.value != null && !near0(got.value)) {
      var want = (y2 - y1) / (x2 - x1);
      if (nearNum(got.value, 1 / want)) return { kind: "swap" };
      if (nearNum(got.value, -want)) return { kind: "mixed" };
    }
    return { kind: "unknown" };
  }

  function prettySlopeFormula(got, task, typed) {
    if (!got || !got.num || !got.den) return "";
    return slopeLhsFromTyped(typed, task) + " = (" + fmtSlopeSide(got.num) + ")/(" + fmtSlopeSide(got.den) + ")";
  }

  function slopeLooksLikeFormula(typed) {
    var s = String(typed || "");
    return /[\/÷]/.test(s) && /[-−–—(]/.test(s);
  }

  function slopeMidFracText(p1, p2, lhs) {
    var num = p2.y - p1.y;
    var den = p2.x - p1.x;
    var head = (lhs || "m") + " = ";
    if (near0(den)) return null;
    if (near0(num)) return head + "0";
    var reduced = slopeReducedFrac(num, den);
    var raw = fmtNum(num) + "/" + fmtNum(den);
    if (reduced && raw !== reduced) return head + raw;
    if (nearNum(den, 1) || nearNum(den, -1)) return null;
    return reduced ? head + reduced : null;
  }

  function canonicalSlopeSteps(task, pack) {
    if (!task || task.kind !== "slope") return [];
    if (task.parallel) return [parallelCopyShow(task, pack)];
    if (task.perpendicular) return canonicalPerpSlopeSteps(task, pack);
    var pair = slopePairFromPack(pack, task);
    var easy = slopeEasyOrder(pair.a, pair.b);
    if (!easy.p1 || !easy.p2) return [slopeLhs(task) + " = " + fmtNum(slopeWant(pack, task))];
    var out = [slopePlugText(easy.p1, easy.p2, task)];
    if (slopeHasDoubleMinus(easy.p1, easy.p2)) {
      var plusLine = slopePlusText(easy.p1, easy.p2, task);
      if (plusLine !== out[0]) out.push(plusLine);
    }
    var mid = slopeMidFracText(easy.p1, easy.p2, slopeLhs(task));
    var wantN = slopeWant(pack, task);
    var final = slopeLhs(task) + " = " + (fmtSimpleFrac(wantN) || fmtNum(wantN));
    if (mid && mid !== final) out.push(mid);
    if (out[out.length - 1] !== final) out.push(final);
    return out;
  }

  function normSlopeStepLine(s) {
    return String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/_/g, "");
  }

  function nextSlopeCanonicalStep(steps, prev) {
    if (!steps || !steps.length) return "";
    if (!prev) return steps[0];
    var p = normSlopeStepLine(prev);
    var i;
    for (i = 0; i < steps.length - 1; i++) {
      if (normSlopeStepLine(steps[i]) === p) return steps[i + 1];
    }
    var fa = parseSlopeFormula(prev);
    if (fa && !fa.atomic) {
      for (i = 0; i < steps.length - 1; i++) {
        var fb = parseSlopeFormula(steps[i]);
        if (fb && !fb.atomic && nearNum(fa.value, fb.value)) return steps[i + 1];
      }
      return steps[1] || steps[0];
    }
    return steps[steps.length - 1];
  }

  function checkSlope(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    if (typedLooksLikeCoordStep(typed, parsed) && !parseSlopeFormula(typed) && !perpTypedIsFormula(typed)) {
      return null;
    }
    var partSlope = (pending || []).filter(function (t) {
      return t.kind === "slope";
    });
    var partNow = currentPartText(pack, progress);
    var partIds = (partNow && partNow.taskIds) || [];
    if (partIds.length) {
      partSlope = partSlope.filter(function (t) {
        return partIds.indexOf(t.id) >= 0;
      });
    }
    var hits = preferPartTasks(partSlope, pack, progress);
    if (hits.length && hits[0].parallel) {
      return checkCopiedSlope(typed, parsed, pack, progress, hits[0], doneMap, partialMap, coordsMap);
    }
    if (hits.length && hits[0].perpendicular) {
      return checkPerpSlope(typed, parsed, pack, progress, hits[0], doneMap, partialMap, coordsMap);
    }
    var skipPerpNum =
      parsed && parsed.value != null && isFinite(parsed.value)
        ? parsed.value
        : parseLineMbInput(typed, "m");
    if (looksLikeLinearEq(typed) || parseConstAxisEq(typed)) skipPerpNum = null;
    if (skipPerpNum != null) {
      var perpSkip = partSlope.filter(function (t) {
        return t.perpendicular && nearNum(skipPerpNum, slopeWant(pack, t));
      })[0];
      if (perpSkip && (!hits.length || hits[0].id !== perpSkip.id)) {
        return checkPerpSlope(typed, parsed, pack, progress, perpSkip, doneMap, partialMap, coordsMap);
      }
    }
    if (!hits.length && partSlope.length) {
      var skipSlope = partSlope[0];
      var skipWant = slopeWant(pack, skipSlope);
      var skipNum =
        parsed && parsed.value != null && isFinite(parsed.value)
          ? parsed.value
          : parseLineMbInput(typed, "m");
      var slopeish =
        !!slopeTagLetters(typed) ||
        !!parseSlopeFormula(typed) ||
        /^m/i.test(String(typed || "").replace(/\s+/g, "")) ||
        (skipWant != null && skipNum != null && nearNum(skipNum, skipWant));
      if (slopeish) hits = [skipSlope];
    }
    var letters = slopeTagLetters(typed);
    var midOpen = openFindMidpointTask(pack, progress);
    if (
      midOpen &&
      typedLooksLikeFindMidpoint(typed, pack, progress) &&
      !(letters && !lettersMatchMidSegment(letters, midOpen))
    ) {
      return null;
    }
    if (letters) {
      var resolved = resolveSlopeByLetters(pack, partSlope, letters);
      if (resolved.kind === "unknown") {
        return {
          ok: false,
          message:
            "אין בציור נקודות בשם " +
            letters.charAt(0) +
            " ו־" +
            letters.charAt(1) +
            ". " +
            slopeNamedPointsMsg(hits[0] || partSlope[0], pack),
        };
      }
      if (resolved.kind === "wrong-line") {
        if (midOpen && lettersMatchMidSegment(letters, midOpen)) return null;
        var need = hits[0] || partSlope[0];
        return {
          ok: false,
          message:
            "m" +
            letters +
            " הוא השיפוע של הישר דרך " +
            letters.charAt(0) +
            " ו־" +
            letters.charAt(1) +
            ". כאן צריך " +
            slopeLhs(need) +
            ".",
        };
      }
      if (resolved.kind === "task") {
        hits = [resolved.task];
      }
    }
    if (!hits.length) return null;
    var task = hits[0];
    var pair = slopePairFromPack(pack, task);
    var want = slopeWant(pack, task);
    if (want == null || !pair.a || !pair.b) return null;

    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    var formula = parseSlopeFormula(typed);

    function finish(show) {
      maps.done[task.id] = true;
      delete maps.partial[task.id];
      delete maps.lastExpr[task.id];
      var left = remainingRequired(pack, maps.done);
      return {
        ok: true,
        solved: left.length === 0,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: task,
        show: show || slopeLhs(task) + " = " + fmtNum(want),
        rawStep: true,
        message: "נכון. " + slopeLhs(task) + " = " + fmtNum(want) + ".",
      };
    }

    function partial(show, msg) {
      maps.partial[task.id] = true;
      maps.lastExpr[task.id] = show;
      return {
        ok: true,
        solved: false,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: task,
        show: show,
        rawStep: true,
        message: msg,
      };
    }

    var gotVal =
      parsed && parsed.value != null && isFinite(parsed.value) ? parsed.value : parseLineMbInput(typed, "m");

    if (formula) {
      if (formula.kind === "vertical") {
        return { ok: false, message: "המכנה הוא 0 — בדקו את שיעורי ה-x." };
      }
      if (formula.atomic) {
        if (nearNum(formula.value, want)) return finish(slopeLhsFromTyped(typed, task) + " = " + fmtNum(want));
        if (!near0(want) && nearNum(formula.value, 1 / want)) {
          return {
            ok: false,
            message: "נראה שהחלפתם בין המונה למכנה. הנוסחה היא m = (y₂ − y₁)/(x₂ − x₁) — y למעלה, x למטה.",
          };
        }
        if (nearNum(formula.value, -want) && !near0(want)) {
          return {
            ok: false,
            message: "הסימן הפוך. בדקו שהסדר במונה (y) זהה לסדר במכנה (x) — אותה נקודה «1» ואותה נקודה «2».",
          };
        }
      }
      var kind = classifySlopeFormula(formula, pair.a, pair.b);
      if (kind.kind === "swap") {
        return {
          ok: false,
          message: "הצבתם את שיעורי x במונה ואת שיעורי y במכנה. הנוסחה היא m = (y₂ − y₁)/(x₂ − x₁).",
        };
      }
      if (kind.kind === "mixed") {
        return {
          ok: false,
          message:
            "הסדר במונה ובמכנה לא תואם. אם במונה רשמתם y של נקודה אחת פחות השנייה, במכנה צריך אותו סדר של נקודות.",
        };
      }
      if (kind.kind === "ok" || nearNum(formula.value, want)) {
        var pretty = prettySlopeFormula(formula, task, typed);
        if (formulaNeedsPlus(formula)) {
          return partial(pretty, "נכון. עכשיו הפכו שני מינוסים צמודים לחיבור (למשל 0 − (−6) = 0 + 6).");
        }
        return partial(pretty, "נכון. עכשיו חשבו את המונה ואת המכנה.");
      }
      return { ok: false, message: "המספרים בנוסחה לא מתאימים לנקודות. m = (y₂ − y₁)/(x₂ − x₁)." };
    }

    if (gotVal != null && nearNum(gotVal, want)) {
      if (slopeLooksLikeFormula(typed)) {
        var showF = prettySlopeFormula(parseSlopeFormula(typed), task, typed);
        if (!showF) showF = String(typed || "").replace(/^\s*m_?[A-Za-z]{0,3}\s*[=:]\s*/i, slopeLhs(task) + " = ");
        if (!/^m/i.test(showF)) showF = slopeLhs(task) + " = " + showF;
        return partial(showF, "נכון. עכשיו חשבו את המונה ואת המכנה.");
      }
      return finish(slopeLhs(task) + " = " + fmtNum(want));
    }
    if (gotVal != null && !nearNum(gotVal, want)) {
      if (!near0(want) && nearNum(gotVal, 1 / want)) {
        return {
          ok: false,
          message: "נראה שהחלפתם בין המונה למכנה. הנוסחה היא m = (y₂ − y₁)/(x₂ − x₁) — y למעלה, x למטה.",
        };
      }
      if (nearNum(gotVal, -want) && !near0(want)) {
        return {
          ok: false,
          message: "הסימן הפוך. בדקו שהסדר במונה (y) זהה לסדר במכנה (x) — אותה נקודה «1» ואותה נקודה «2».",
        };
      }
      return { ok: false, message: "השיפוע עדיין לא מדויק. הציבו m = (y₂ − y₁)/(x₂ − x₁)." };
    }
    if (
      (parsed && parsed.kind === "point") ||
      parsePointPair(typed) ||
      looksLikeLinearEq(typed) ||
      /^[xy]\s*=/i.test(String(typed || "").replace(/\s+/g, "")) ||
      parseYesNo(typed) != null
    ) {
      return null;
    }
    return {
      ok: false,
      message:
        "רשמו m = (y₂ − y₁)/(x₂ − x₁) עם הנקודות (לא משנה איזו היא 1 ואיזו 2), או ישר את השיפוע.",
    };
  }


  function intersectLines(pack) {
    return (pack && pack.lines) || [];
  }

  function intersectLineEntry(pack, key) {
    var lines = intersectLines(pack);
    var i;
    for (i = 0; i < lines.length; i++) {
      if (lines[i].key === key) return lines[i];
    }
    return null;
  }

  function intersectLineRaw(pack, key) {
    var item = intersectLineEntry(pack, key);
    return item ? item.line : null;
  }

  function intersectStoredEq(progress, key) {
    return progress && progress.lineEq && progress.lineEq[key] ? progress.lineEq[key] : null;
  }

  function lineMatchRevealedEq(progress, key) {
    var lm = progress && progress.lineMatch;
    if (!lm || !key) return "";
    var ids = Object.keys(lm);
    var i;
    for (i = 0; i < ids.length; i++) {
      var row = lm[ids[i]];
      if (row && row.lineKey === key && row.lineDone && row.revealedEq) return row.revealedEq;
    }
    return "";
  }

  function intersectLineReady(rawLine, progress, key) {
    if (!rawLine || !lineMbNeedsUnsorted(rawLine)) return true;
    var stored = intersectStoredEq(progress, key);
    return !!(stored && isSlopeInterceptEqText(stored));
  }


  function parallelLinesReady(pack, progress) {
    var lines = (pack && pack.lines) || [];
    if (!lines.length) return true;
    return lines.every(function (item) {
      return intersectLineReady(item.line, progress, item.key);
    });
  }

  function firstUnsortedLine(pack, progress) {
    var lines = (pack && pack.lines) || [];
    var i;
    for (i = 0; i < lines.length; i++) {
      if (!intersectLineReady(lines[i].line, progress, lines[i].key)) return lines[i];
    }
    return null;
  }

  function visibleUnsortedLines(pack, progress) {
    return ((pack && pack.lines) || []).filter(function (item) {
      if (!item || !item.line) return false;
      if (item.line.hideEq) return false;
      return !intersectLineReady(item.line, progress, item.key);
    });
  }

  function givenRearrangeTask() {
    return { id: "_rearr", kind: "rearrange", label: "סידור משוואת הישר" };
  }

  function checkGivenLineRearrange(typed, pack, progress) {
    var lines = visibleUnsortedLines(pack, progress);
    if (!lines.length) return null;
    if (parseYesNo(typed) != null) return null;
    var i;
    var lastFail = null;
    for (i = 0; i < lines.length; i++) {
      var res = checkLineIntersectRearrange(typed, pack, progress, {
        key: lines[i].key,
        entry: lines[i],
      });
      if (res && res.ok) {
        res.task = givenRearrangeTask();
        return res;
      }
      if (res) lastFail = res;
    }
    return lines.length === 1 ? lastFail : null;
  }

  function canonicalGivenLineRearrangeSteps(pack) {
    var out = [];
    ((pack && pack.lines) || []).forEach(function (item) {
      if (!item || !item.line || item.line.hideEq) return;
      if (!lineMbNeedsUnsorted(item.line)) return;
      canonicalLineRearrangeSteps(item.line).forEach(function (s) {
        out.push(s);
      });
    });
    return out;
  }

  function partMixesSlopeAndIntersect(pack, progress) {
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    var map = taskByIdMap(pack);
    var hasS = false;
    var hasI = false;
    ids.forEach(function (id) {
      var t = map[id];
      if (!t) return;
      if (t.kind === "slope" || t.kind === "lineEq") hasS = true;
      if (t.kind === "lineIntersect") hasI = true;
    });
    return hasS && hasI;
  }

  function parseMChain(typed) {
    var s = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/:/g, "=");
    if (!s) return null;
    var parts = s.split("=");
    var names = [];
    var val = null;
    var i;
    for (i = 0; i < parts.length; i++) {
      var p = parts[i];
      var nm = p.match(/^m_?(III|II|I|[A-Za-z]{1,4}|\d+)$/i);
      if (nm) {
        names.push(String(nm[1]).toUpperCase());
        continue;
      }
      if (p === "m") {
        names.push("");
        continue;
      }
      var v = evalArithLoose(p);
      if (v == null) {
        var got = parseLineMbInput(p, "m");
        v = got;
      }
      if (v != null && isFinite(v) && i === parts.length - 1) {
        val = v;
        continue;
      }
      return null;
    }
    return { names: names, value: val };
  }


  function checkParallelRearrange(typed, pack, progress, pending) {
    var hits = preferPartTasks(
      (pending || []).filter(function (t) {
        return t.kind === "parallel" || t.kind === "perpendicular";
      }),
      pack,
      progress
    );
    if (!hits.length) return null;
    var unsorted = firstUnsortedLine(pack, progress);
    if (!unsorted) return null;
    var yn = parseYesNo(typed);
    if (yn != null) return null;
    var lines = (pack.lines || []).filter(function (item) {
      return !intersectLineReady(item.line, progress, item.key);
    });
    var i;
    var lastFail = null;
    for (i = 0; i < lines.length; i++) {
      var res = checkLineIntersectRearrange(typed, pack, progress, {
        key: lines[i].key,
        entry: lines[i],
      });
      if (!res) continue;
      if (res.ok) return res;
      lastFail = res;
    }
    return lastFail;
  }

  function parallelRelatedSlopeTasks(pack, task) {
    var map = taskByIdMap(pack);
    if (task && task.slopeIds && task.slopeIds.length) {
      return task.slopeIds
        .map(function (id) {
          return map[id];
        })
        .filter(function (t) {
          return t && t.kind === "slope";
        });
    }
    var part = currentPartText(pack, {});
    var ids = (part && part.taskIds) || [];
    var out = [];
    var i;
    for (i = 0; i < ids.length; i++) {
      if (task && ids[i] === task.id) break;
      var t = map[ids[i]];
      if (t && t.kind === "slope") out.push(t);
    }
    return out;
  }

  function markRelatedSlopes(pack, progress, parTask, maps) {
    var rel = parallelRelatedSlopeTasks(pack, parTask);
    var i;
    for (i = 0; i < rel.length; i++) {
      if (!maps.done[rel[i].id]) {
        maps.done[rel[i].id] = true;
        delete maps.partial[rel[i].id];
        delete maps.lastExpr[rel[i].id];
      }
    }
  }


  function canonicalLineRearrangeSteps(rawLine) {
    var from = (rawLine && rawLine.eqText) || prettyLineEq(rawLine);
    var steps = [];
    var guard = 0;
    while (from && !lineMbRearrangeComplete(from, rawLine) && guard < 8) {
      guard += 1;
      var next = lineMbSuggestNextStep(from, rawLine);
      if (!next || normEqText(next) === normEqText(from)) {
        steps.push(sortedLineEq(rawLine));
        break;
      }
      steps.push(next);
      from = next;
    }
    var finalForm = sortedLineEq(rawLine);
    if (finalForm && steps.length && lineMbRearrangeComplete(steps[steps.length - 1], rawLine)) {
      steps[steps.length - 1] = finalForm;
    } else if (finalForm && (!steps.length || normEqText(steps[steps.length - 1]) !== normEqText(finalForm))) {
      steps.push(finalForm);
    }
    return steps;
  }

  function fmtSimpleFrac(n) {
    if (n == null || !isFinite(n)) return "";
    if (near0(n)) return "0";
    var sign = n < 0 ? "−" : "";
    var a = Math.abs(n);
    var d;
    for (d = 1; d <= 24; d++) {
      var num = Math.round(a * d);
      if (nearNum(num / d, a)) {
        if (d === 1) return sign + String(num);
        return sign + num + "/" + d;
      }
    }
    return fmtNum(n);
  }


  function intersectDisplayEq(pack, progress, key) {
    var stored = intersectStoredEq(progress, key);
    if (stored) return stored;
    var fromMatch = lineMatchRevealedEq(progress, key);
    if (fromMatch) return fromMatch;
    var raw = intersectLineRaw(pack, key);
    if (!raw) return "";
    if (
      raw.hideEq &&
      lineMbNeedsUnsorted(raw) &&
      !(progress && progress.lineEqDisplay && sameSlopeIntercept(progress.lineEqDisplay, raw))
    ) {
      return "";
    }
    if (lineMbNeedsUnsorted(raw) && raw.eqText) return raw.eqText;
    return sortedLineEq(raw) || prettyLineEq(raw);
  }

  function intersectLineLabel(pack, key) {
    var item = intersectLineEntry(pack, key);
    return (item && item.label) || key || "הישר";
  }

  function slopeInterceptRhsText(eqText, rawLine) {
    var got = parseSlopeInterceptText(eqText);
    if (got) {
      var L = { m: got.m, b: got.b };
      if (rawLine && rawLine.mn != null && rawLine.md) {
        var spec = parseLineSpec(rawLine);
        if (spec && nearNum(got.m, spec.m) && nearNum(got.b, spec.b)) {
          L.mn = rawLine.mn;
          L.md = rawLine.md;
        }
      }
      var xs = slopeInterceptXTerm(L);
      if (near0(got.b)) return xs || "0";
      if (!xs) return fmtNum(got.b);
      if (got.b > 0) return xs + " + " + fmtNum(got.b);
      return xs + " − " + fmtNum(-got.b);
    }
    var m = String(eqText || "").match(/^y\s*=\s*(.+)$/i);
    return m ? m[1].trim() : null;
  }

  function packLineEntries(pack) {
    if (pack && pack.lines && pack.lines.length) return pack.lines;
    if (pack && pack.line) return [{ key: "L", label: "", line: pack.line }];
    return [];
  }

  function figureLineEntries(pack, progress) {
    var out = [];
    function already(raw) {
      return out.some(function (e) {
        return e.line && raw && sameSlopeIntercept(prettyLineEq(raw), e.line);
      });
    }
    function add(item) {
      if (!item || !item.line) return;
      if (already(item.line)) return;
      out.push(item);
    }
    (pack && pack.lines ? pack.lines : []).forEach(add);
    if (pack && pack.line) add({ key: "L", label: "", line: pack.line });
    function addExtra(raw, i) {
      if (!raw) return;
      if (
        raw.hideEq &&
        !(progress && progress.lineEqDisplay && sameSlopeIntercept(progress.lineEqDisplay, raw))
      ) {
        return;
      }
      add({ key: "ex" + i, label: "", line: raw });
    }
    ((pack && pack.extraLines) || []).forEach(addExtra);
    return out;
  }

  function pointOnLineRaw(raw, x, y) {
    var L = parseLineSpec(raw);
    if (!L) return false;
    if (L.vertical != null) return nearNum(L.vertical, x);
    return nearNum(lineYAt(raw, x), y);
  }

  function linesThroughPoint(pack, x, y) {
    return packLineEntries(pack).filter(function (e) {
      return e && e.line && pointOnLineRaw(e.line, x, y);
    });
  }

  function linesThroughTask(pack, task) {
    if (!task || task.answerX == null || task.answerY == null) return [];
    return linesThroughPoint(pack, task.answerX, task.answerY);
  }

  /** Horizontal or vertical among the two lines through the intersection — site path uses that coordinate. */
  function intersectEasyAxis(pack, task) {
    var thru = task ? linesThroughTask(pack, task) : [];
    if (thru.length < 2) thru = intersectLines(pack);
    if (!thru || thru.length < 2) return null;
    var horiz = null;
    var vert = null;
    thru.forEach(function (item) {
      var L = parseLineSpec(item.line);
      if (!L) return;
      if (L.vertical != null && isFinite(L.vertical)) {
        if (!vert) vert = item;
      } else if (L.m != null && near0(L.m) && L.b != null && isFinite(L.b)) {
        if (!horiz) horiz = item;
      }
    });
    function otherOf(easy) {
      var i;
      for (i = 0; i < thru.length; i++) {
        if (thru[i].key !== easy.key) return thru[i];
      }
      return thru[1];
    }
    if (horiz) {
      var Lh = parseLineSpec(horiz.line);
      return { kind: "y", value: Lh.b, easy: horiz, other: otherOf(horiz) };
    }
    if (vert) {
      var Lv = parseLineSpec(vert.line);
      return { kind: "x", value: Lv.vertical, easy: vert, other: otherOf(vert) };
    }
    return null;
  }

  function interceptPlugScore(raw, axis) {
    var L = parseLineSpec(raw);
    if (!L) return 1000;
    var s = 0;
    if (raw.implicit) s += 40;
    if (lineMbNeedsUnsorted(raw)) s += 40;
    if (L.md && L.md > 1) s += 15;
    if (String(axis || "") === "y") {
      if (L.m < 0) s += 1;
      if (!nearNum(L.b, Math.round(L.b))) s += 8;
      return s;
    }
    if (near0(L.m)) return 500;
    if (!nearNum(Math.abs(L.m), 1)) s += 5;
    if (L.m < 0) s += 2;
    var xv = -L.b / L.m;
    if (!nearNum(xv, Math.round(xv))) s += 10;
    return s;
  }

  function lineItemRevealed(progress, item) {
    if (!item || !item.line) return false;
    if (!item.line.hideEq) return true;
    if (progress && progress.lineEq && item.key && progress.lineEq[item.key]) return true;
    if (item.key && lineMatchRevealedEq(progress, item.key)) return true;
    if (progress && progress.lineEqDisplay && sameSlopeIntercept(progress.lineEqDisplay, item.line)) {
      return true;
    }
    return false;
  }

  function preferredInterceptLine(pack, task, progress) {
    var thru = linesThroughTask(pack, task).filter(function (item) {
      return lineItemRevealed(progress, item);
    });
    if (!thru.length) return null;
    var axis = nearNum(task.answerX, 0) ? "y" : nearNum(task.answerY, 0) ? "x" : null;
    if (!axis) return thru[0];
    return thru.slice().sort(function (a, b) {
      var da = interceptPlugScore(a.line, axis);
      var db = interceptPlugScore(b.line, axis);
      if (da !== db) return da - db;
      if (task.lineKey === a.key) return -1;
      if (task.lineKey === b.key) return 1;
      return 0;
    })[0];
  }

  function looksLikeTwoSidedXEquate(typed) {
    var t = String(typed || "").replace(/[−–—]/g, "-");
    var i = t.indexOf("=");
    if (i < 0) return false;
    var left = t.slice(0, i);
    var right = t.slice(i + 1);
    if (right.indexOf("=") >= 0) return false;
    return /x/i.test(left) && /x/i.test(right);
  }

  function equateCanonicalForKeys(pack, progress, keys) {
    if (!keys || keys.length < 2) return "";
    var raw0 = intersectLineRaw(pack, keys[0]);
    var raw1 = intersectLineRaw(pack, keys[1]);
    var rhs0 = slopeInterceptRhsText(intersectDisplayEq(pack, progress, keys[0]), raw0);
    var rhs1 = slopeInterceptRhsText(intersectDisplayEq(pack, progress, keys[1]), raw1);
    if (!rhs0 || !rhs1) return "";
    return rhs0 + " = " + rhs1;
  }

  function matchEquatePair(typed, pack, progress, thru) {
    if (!looksLikeTwoSidedXEquate(typed) || !thru || thru.length < 2) return null;
    var i;
    var j;
    for (i = 0; i < thru.length; i++) {
      for (j = i + 1; j < thru.length; j++) {
        var ab = equateCanonicalForKeys(pack, progress, [thru[i].key, thru[j].key]);
        var ba = equateCanonicalForKeys(pack, progress, [thru[j].key, thru[i].key]);
        if (ab && intersectEquateEquivalent(typed, ab)) return [thru[i].key, thru[j].key];
        if (ba && intersectEquateEquivalent(typed, ba)) return [thru[j].key, thru[i].key];
      }
    }
    return null;
  }

  function intersectEquateCanonical(pack, progress) {
    var live = liveIntersect(pack, progress);
    var keys = live.keys;
    if (keys && keys.length >= 2) {
      var keyed = equateCanonicalForKeys(pack, progress, keys);
      if (keyed) return keyed;
    }
    var task = openLineIntersectTask(pack, progress);
    var thru = task ? linesThroughTask(pack, task) : [];
    if (thru.length >= 2) {
      var fromThru = equateCanonicalForKeys(pack, progress, [thru[0].key, thru[1].key]);
      if (fromThru) return fromThru;
    }
    var lines = intersectLines(pack);
    if (lines.length < 2) return "";
    var rhs0 = slopeInterceptRhsText(intersectDisplayEq(pack, progress, lines[0].key), lines[0].line);
    var rhs1 = slopeInterceptRhsText(intersectDisplayEq(pack, progress, lines[1].key), lines[1].line);
    if (!rhs0 || !rhs1) return "";
    return rhs0 + " = " + rhs1;
  }

  function intersectEquateEquivalent(typed, canonical) {
    if (!canonical) return false;
    return eqNormEqual(typed, canonical);
  }

  function openLineIntersectTask(pack, progress) {
    var done = (progress && progress.done) || {};
    var hits = (pack.tasks || []).filter(function (t) {
      return t.kind === "lineIntersect" && !done[t.id];
    });
    return hits.length ? hits[0] : null;
  }

  function liveIntersect(pack, progress) {
    var open = openLineIntersectTask(pack, progress);
    var intr = Object.assign({}, (progress && progress.intersect) || {});
    if (!open) return intr;
    if (intr.taskId && String(intr.taskId) !== String(open.id)) {
      return { taskId: open.id };
    }
    if ((intr.equated || intr.xDone || intr.yDone) && !intr.taskId) {
      var cf = progress.coords && progress.coords[open.id];
      if (!(cf && (cf.x || cf.y))) return { taskId: open.id };
    }
    if (!intr.taskId) intr.taskId = open.id;
    return intr;
  }

  function intersectXReady(pack, progress) {
    var intr = liveIntersect(pack, progress);
    if (intr.xDone) return true;
    var task = openLineIntersectTask(pack, progress);
    if (!task && intr.taskId) {
      task = (pack.tasks || []).filter(function (t) {
        return t.id === intr.taskId;
      })[0];
    }
    if (!task) return false;
    var cf = progress.coords && progress.coords[task.id];
    return !!(cf && cf.x);
  }

  function isSolvedXText(text) {
    var A = global.DoctematicaAlgebra;
    if (A && typeof A.isolatedRhsKind === "function") {
      return A.isolatedRhsKind(text, "x") === "value";
    }
    return /^x\s*=\s*-?\d/i.test(String(text || "").trim());
  }

  function intersectTypedYValue(typed, parsed, phit) {
    if (yEqGivesCoord(typed, phit.answerY)) {
      var v0 = evalMaybeExpr(lastEqStage(typed));
      if (v0 != null) return v0;
    }
    if (parsed && parsed.value != null) {
      var tagU = parsed.tag ? normGeoTag(parsed.tag) : "";
      var pn = String((phit && (phit.point || phit.label)) || "P").toUpperCase();
      if (!parsed.tag || tagU === "Y" || tagU === pn || tagU === pn + "Y" || tagU === "Y" + pn) {
        if (nearNum(parsed.value, phit.answerY)) return parsed.value;
      }
    }
    return null;
  }

  function intersectTypedXValue(typed, parsed, phit) {
    if (isSolvedXText(typed)) {
      var v = evalMaybeExpr(lastEqStage(typed));
      if (v != null) return v;
    }
    if (parsed && parsed.value != null) {
      if (!parsed.tag) return parsed.value;
      var tagU = normGeoTag(parsed.tag);
      if (tagU === "X") return parsed.value;
      var pn = String((phit && (phit.point || phit.label)) || "P").toUpperCase();
      if (tagU === pn || tagU === pn + "X" || tagU === "X" + pn) return parsed.value;
    }
    return null;
  }

  /** Student solved for x (in head or in one jump) — skip forced equate / linear chain. */
  function intersectAcceptEarlyX(typed, parsed, phit, canonical) {
    var wantX = phit.answerX;
    var A = global.DoctematicaAlgebra;
    var xv = intersectTypedXValue(typed, parsed, phit);
    if (xv != null && nearNum(xv, wantX)) {
      var show = isSolvedXText(typed) ? prettyRearrangeStep(typed) : "x = " + fmtNum(wantX);
      return { show: show.indexOf("=") >= 0 ? show : "x = " + fmtNum(wantX) };
    }
    if (canonical && A && typeof A.checkStep === "function") {
      try {
        var xRes = A.checkStep(canonical, typed);
        if (xRes.ok && (xRes.solved || (A.isSolvedText && A.isSolvedText(typed)))) {
          var solX = A.solutionOf ? A.solutionOf(xRes.equation || A.parseEquation(typed)) : null;
          if (solX != null && nearNum(solX, wantX)) {
            return { show: prettyRearrangeStep(typed) };
          }
        }
      } catch (eEarly) {}
    }
    return null;
  }

  /** Valid linear step from equate — student skipped writing the raw y=y equality. */
  function intersectAcceptLinearAdvance(typed, phit, canonical) {
    var A = global.DoctematicaAlgebra;
    if (!canonical || !A || typeof A.checkStep !== "function") return null;
    try {
      var res = A.checkStep(canonical, typed);
      if (!res.ok) return null;
      if (A.isSolvedText && A.isSolvedText(typed)) return null;
      var sol = A.solutionOf ? A.solutionOf(res.equation || A.parseEquation(typed)) : null;
      if (sol != null && !nearNum(sol, phit.answerX)) return null;
      return { show: prettyRearrangeStep(typed) };
    } catch (eAdv) {
      return null;
    }
  }

  function intersectSolveHintEq(pack, progress) {
    var intr = liveIntersect(pack, progress);
    if (intr.plugFromY && !intr.xDone) {
      var lastY = String(intr.lastExpr || "").trim();
      if (lastY && /x/i.test(lastY) && lastY.indexOf("=") >= 0) return lastY;
      return intr.plugFromY;
    }
    var canonical = intr.equateExpr || intersectEquateCanonical(pack, progress);
    if (intr.lastExpr) {
      var last = String(intr.lastExpr).trim();
      if (last && normEqText(last) !== normEqText(canonical)) return last;
    }
    return last || canonical;
  }

  function syncIntersectXKnown(pack, progress, intr, coords, wantX) {
    var task = openLineIntersectTask(pack, progress);
    var cf = task && coords && coords[task.id];
    if (!intr.xDone && cf && cf.x) {
      intr.xDone = true;
      intr.xVal = wantX;
      if (!intr.equated) {
        intr.equated = true;
        intr.equateExpr = intersectEquateCanonical(pack, progress);
        if (!intr.lastExpr) intr.lastExpr = intr.equateExpr;
      }
    }
    return intr;
  }

  /** Next linear-equation step + hint — same engine as משוואות בנעלם אחד (Teach.nextAction). */
  function teachLinearNext(eqText) {
    var Teach = global.DoctematicaTeach;
    if (!Teach || typeof Teach.nextAction !== "function" || !eqText) return null;
    var yOnly = /[yY]/.test(eqText) && !/[xX]/.test(eqText);
    var src = yOnly ? eqRewriteUnknownAsX(eqText) : eqText;
    var act = Teach.nextAction(src);
    if (!act || act.done || !act.eq) return null;
    var nextEq = yOnly ? String(act.eq).replace(/x/g, "y").replace(/X/g, "Y") : act.eq;
    if (normEqText(nextEq) === normEqText(eqText)) return null;
    return { eq: nextEq, hint: act.hint, explain: act.explain };
  }

  function isLineMatchPack(pack) {
    return !!(pack && pack.tasks && pack.tasks.some(function (t) {
      return t.kind === "lineMatch";
    }));
  }

  function lineMatchPartActive(pack, progress) {
    if (!isLineMatchPack(pack)) return false;
    progress = progress || { done: {} };
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    if (!ids.length) return false;
    var i;
    for (i = 0; i < ids.length; i++) {
      var task = (pack.tasks || []).filter(function (t) {
        return t.id === ids[i];
      })[0];
      if (!task || task.kind !== "lineMatch") return false;
    }
    return true;
  }

  function firstPartLineMatchOnly(pack) {
    var part = pack && pack.parts && pack.parts[0];
    if (!part || !(part.taskIds || []).length) return false;
    return part.taskIds.every(function (id) {
      var t = (pack.tasks || []).filter(function (x) {
        return x.id === id;
      })[0];
      return t && t.kind === "lineMatch";
    });
  }

  function lineMatchLineItems(pack) {
    return (pack && pack.lines) || [];
  }

  function lineMatchSlopeSign(m) {
    if (m > 0) return "pos";
    if (m < 0) return "neg";
    return "zero";
  }

  function lineMatchValidReasons(pack, lineKey) {
    var items = lineMatchLineItems(pack);
    var specs = items.map(function (it) {
      return { key: it.key, L: parseLineSpec(it.line) };
    });
    var target = specs.filter(function (s) {
      return s.key === lineKey;
    })[0];
    if (!target || !target.L) return [];
    var valid = [];
    var tSign = lineMatchSlopeSign(target.L.m);
    var sameSign = specs.filter(function (s) {
      return lineMatchSlopeSign(s.L.m) === tSign;
    });
    if (tSign === "pos" && sameSign.length === 1) valid.push("m_pos");
    if (tSign === "neg" && sameSign.length === 1) valid.push("m_neg");
    var sameSlope = specs.filter(function (s) {
      return nearNum(s.L.m, target.L.m);
    });
    if (sameSlope.length > 1) {
      var sameB = sameSlope.filter(function (s) {
        return nearNum(s.L.b, target.L.b);
      });
      if (sameB.length === 1) valid.push("b");
    }
    var sameBAll = specs.filter(function (s) {
      return nearNum(s.L.b, target.L.b);
    });
    if (sameBAll.length === 1 && valid.indexOf("b") < 0) valid.push("b");
    return valid;
  }

  function lineMatchReasonLabel(id) {
    if (id === "m_pos") return "שיפוע חיובי";
    if (id === "m_neg") return "שיפוע שלילי";
    if (id === "b") return "גובה לפי המקדם b";
    return id;
  }

  function lineMatchReasonOptions() {
    return [
      { id: "m_pos", label: lineMatchReasonLabel("m_pos") },
      { id: "m_neg", label: lineMatchReasonLabel("m_neg") },
      { id: "b", label: lineMatchReasonLabel("b") },
    ];
  }

  function lineMatchLineLabel(pack, key) {
    var item = lineMatchLineItems(pack).filter(function (it) {
      return it.key === key;
    })[0];
    return (item && item.label) || key || "ישר";
  }

  function lineMatchProgress(progress) {
    if (!progress.lineMatch) progress.lineMatch = {};
    return progress.lineMatch;
  }

  function lineMatchRowState(progress, taskId) {
    var lm = lineMatchProgress(progress);
    if (!lm[taskId]) lm[taskId] = {};
    return lm[taskId];
  }

  function lineMatchUsedLines(progress, skipTaskId) {
    var used = {};
    var lm = lineMatchProgress(progress);
    Object.keys(lm).forEach(function (tid) {
      if (tid === skipTaskId) return;
      var row = lm[tid];
      if (row && row.lineKey && row.lineKey !== "none") used[row.lineKey] = tid;
    });
    return used;
  }

  function lineMatchPanelData(pack, progress) {
    progress = progress || {};
    var partTasks = lineMatchPartTasks(pack, progress);
    var tasks = (partTasks.length
      ? partTasks
      : (pack.tasks || []).filter(function (t) {
          return t.kind === "lineMatch";
        })
    ).slice().sort(function (a, b) {
      var na = a.eqNum == null ? 999 : a.eqNum;
      var nb = b.eqNum == null ? 999 : b.eqNum;
      return na - nb;
    });
    var lineOpts = lineMatchLineItems(pack).map(function (it) {
      return { key: it.key, label: it.label || it.key };
    });
    var hasDistractor = tasks.some(function (t) {
      return t.answerKey === "none";
    });
    return {
      lines: lineOpts,
      hasDistractor: hasDistractor,
      rows: tasks.map(function (t) {
        var row = lineMatchRowState(progress, t.id);
        var lineDone = !!(progress.done && progress.done[t.id]) || !!row.lineDone;
        var reasonDone = !!(progress.done && progress.done[t.id]) || !!row.reasonDone;
        return {
          task: t,
          eqText: t.eqText || "",
          eqNum: t.eqNum,
          lineKey: row.lineKey || null,
          reason: row.reason || null,
          lineDone: lineDone,
          reasonDone: reasonDone,
          needReason: lineDone && !reasonDone && t.answerKey !== "none",
          done: !!(progress.done && progress.done[t.id]),
          validReasons:
            row.lineKey && row.lineKey !== "none" ? lineMatchValidReasons(pack, row.lineKey) : [],
        };
      }),
    };
  }

  function lineMatchPartTasks(pack, progress) {
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    return (pack.tasks || []).filter(function (t) {
      return t.kind === "lineMatch" && ids.indexOf(t.id) >= 0;
    });
  }

  function lineMatchPendingPartTasks(pack, progress) {
    return lineMatchPartTasks(pack, progress).filter(function (t) {
      return !(progress.done && progress.done[t.id]);
    });
  }

  function lineMatchInferRemaining(pack, progress) {
    var pending = lineMatchPendingPartTasks(pack, progress);
    var used = lineMatchUsedLines(progress, null);
    var unused = lineMatchLineItems(pack)
      .map(function (it) {
        return it.key;
      })
      .filter(function (k) {
        return k && !used[k];
      });
    // 3 משוואות / 2 ישרים: אחרי שיוך אחד נשארות שתי משוואות לישר אחד — עדיין יש הסחה.
    // משלימים אוטומטית רק כשנשארה משוואה אחת וישר אחד שמתאימים.
    if (pending.length !== 1 || unused.length !== 1) return null;
    var task = pending[0];
    if (task.answerKey === "none") return null;
    if (unused[0] === task.answerKey) {
      return { taskId: task.id, lineKey: task.answerKey, task: task };
    }
    return null;
  }

  function lineMatchAutoCompleteRemaining(pack, progress) {
    progress = progress || {};
    var results = [];
    var infer;
    while ((infer = lineMatchInferRemaining(pack, progress))) {
      var task = infer.task;
      var row = lineMatchRowState(progress, infer.taskId);
      if (infer.lineKey === "none") {
        row.lineKey = "none";
        row.lineDone = true;
        var resNone = finishLineMatchTask(
          task,
          pack,
          progress,
          "נשארה משוואה אחת — היא לא שייכת לאף ישר בציור."
        );
        results.push(resNone);
      } else {
        row.lineKey = infer.lineKey;
        row.lineDone = true;
        row.revealedEq = task.eqText || null;
        var valid = lineMatchValidReasons(pack, infer.lineKey);
        row.reason = valid[0] || "b";
        row.reasonDone = true;
        var resLine = finishLineMatchTask(
          task,
          pack,
          progress,
          "נשארו משוואה אחת וישר אחד — השיוך נקבע אוטומטית."
        );
        results.push(resLine);
      }
      if (results[results.length - 1].done) progress.done = results[results.length - 1].done;
      if (results[results.length - 1].lineMatch) {
        progress.lineMatch = results[results.length - 1].lineMatch;
      }
    }
    return results;
  }

  function finishLineMatchTask(task, pack, progress, msg) {
    var maps = cloneMaps(progress.done || {}, progress.partial || {}, progress.coords || {}, progress);
    maps.done[task.id] = true;
    markOptionalDone(pack, maps.done, task);
    var row = lineMatchRowState(progress, task.id);
    row.lineDone = true;
    row.reasonDone = true;
    var eqLab = task.eqNum ? "(" + task.eqNum + ") " : "";
    var show =
      task.answerKey === "none"
        ? eqLab + (task.eqText || "") + " → לא שייך"
        : eqLab +
          (task.eqText || "") +
          " → ישר " +
          lineMatchLineLabel(pack, task.answerKey);
    var note =
      task.answerKey !== "none" && row.reason
        ? lineMatchReasonLabel(row.reason)
        : task.answerKey === "none"
          ? "אין ישר מתאים בציור"
          : "";
    var lineEq = Object.assign({}, (progress && progress.lineEq) || {});
    if (task.answerKey && task.answerKey !== "none" && (row.revealedEq || task.eqText)) {
      lineEq[task.answerKey] = row.revealedEq || task.eqText;
    }
    return {
      ok: true,
      solved: remainingRequired(pack, maps.done).length === 0,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      task: task,
      show: show,
      rawStep: true,
      userStep: show,
      lineMatchNote: note,
      lineEq: lineEq,
      message: msg,
    };
  }

  function submitLineMatchLine(taskId, lineKey, pack, progress) {
    var task = (pack.tasks || []).filter(function (t) {
      return t.id === taskId && t.kind === "lineMatch";
    })[0];
    if (!task) return { ok: false, message: "משימה לא נמצאה." };
    if (progress.done && progress.done[taskId]) {
      return { ok: false, message: "כבר סיימתם משוואה זו." };
    }
    var row = lineMatchRowState(progress, taskId);
    var want = task.answerKey;
    var used = lineMatchUsedLines(progress, taskId);
    if (lineKey !== "none" && used[lineKey]) {
      return { ok: false, message: "ישר " + lineMatchLineLabel(pack, lineKey) + " כבר שויך למשוואה אחרת." };
    }
    if (want === "none") {
      if (lineKey !== "none") {
        return { ok: false, message: "למשוואה זו אין ישר מתאים בציור — בחרו «לא שייך»." };
      }
      row.lineKey = "none";
      row.lineDone = true;
      return finishLineMatchTask(task, pack, progress, "נכון. המשוואה לא שייכת לאף ישר בציור.");
    }
    if (lineKey === "none") {
      return { ok: false, message: "למשוואה זו יש ישר מתאים — בחרו I, II או III." };
    }
    if (lineKey !== want) {
      return {
        ok: false,
        message: "לא מתאים. בדקו שוב את השיפוע והגובה בציור.",
      };
    }
    row.lineKey = lineKey;
    row.lineDone = true;
    row.revealedEq = task.eqText || null;
    var valid = lineMatchValidReasons(pack, lineKey);
    var hintMsg = "נכון. עכשיו נמקו: ";
    if (valid.length === 1) {
      hintMsg += "למה בחרתם ישר " + lineMatchLineLabel(pack, lineKey) + "? (" + lineMatchReasonLabel(valid[0]) + ")";
    } else {
      hintMsg += "האם זיהיתם לפי השיפוע, לפי b, או שניהם?";
    }
    return {
      ok: true,
      solved: false,
      task: task,
      lineMatch: lineMatchProgress(progress),
      message: hintMsg,
    };
  }

  function submitLineMatchReason(taskId, reasonId, pack, progress) {
    var task = (pack.tasks || []).filter(function (t) {
      return t.id === taskId && t.kind === "lineMatch";
    })[0];
    if (!task) return { ok: false, message: "משימה לא נמצאה." };
    if (progress.done && progress.done[taskId]) {
      return { ok: false, message: "כבר סיימתם משוואה זו." };
    }
    var row = lineMatchRowState(progress, taskId);
    if (!row.lineDone || !row.lineKey) {
      return { ok: false, message: "קודם בחרו לאיזה ישר מתאימה המשוואה." };
    }
    if (task.answerKey === "none") {
      return finishLineMatchTask(task, pack, progress, "נכון.");
    }
    var valid = lineMatchValidReasons(pack, row.lineKey);
    if (valid.indexOf(reasonId) < 0) {
      var alt = valid.map(lineMatchReasonLabel).join(" או ");
      return {
        ok: false,
        message:
          "הנימוק לא מתאים למצב. " +
          (alt ? "כאן אפשר לנמק: " + alt + "." : "בדקו שוב את השיפוע והגובה."),
      };
    }
    row.reason = reasonId;
    row.reasonDone = true;
    return finishLineMatchTask(
      task,
      pack,
      progress,
      "נכון. " + lineMatchReasonLabel(reasonId) + "."
    );
  }

  function lineMatchOneStep(pack, progress) {
    var tasks = lineMatchPendingPartTasks(pack, progress)
      .slice()
      .sort(function (a, b) {
        var na = a.eqNum == null ? 999 : a.eqNum;
        var nb = b.eqNum == null ? 999 : b.eqNum;
        return na - nb;
      });
    if (!tasks.length) return null;
    var task = tasks[0];
    var row = lineMatchRowState(progress, task.id);
    if (!row.lineDone) {
      return { action: "line", taskId: task.id, lineKey: task.answerKey, task: task };
    }
    if (!row.reasonDone && task.answerKey !== "none") {
      var valid = lineMatchValidReasons(pack, row.lineKey);
      return {
        action: "reason",
        taskId: task.id,
        reasonId: valid[0] || "b",
        task: task,
      };
    }
    return null;
  }

  function graphLinesForMatch(pack, progress) {
    progress = progress || {};
    var lm = progress.lineMatch || {};
    var revealed = {};
    Object.keys(lm).forEach(function (taskId) {
      var row = lm[taskId];
      if (row && row.lineKey && row.lineKey !== "none" && row.lineDone && row.revealedEq) {
        revealed[row.lineKey] = row.revealedEq;
      }
    });
    return lineMatchLineItems(pack).map(function (item, idx) {
      var raw = item.line;
      var g = Object.assign(parseLineSpec(raw), { showEq: false, _raw: raw, graphKey: item.key });
      g.lineLabel = item.label || item.key;
      if (revealed[item.key]) {
        g.showEq = true;
        g.eqText = revealed[item.key];
        g.lineLabel = null;
      }
      g.graphClass =
        idx === 0 ? "coord-line" : idx === 1 ? "coord-line coord-line-b" : "coord-line coord-line-c";
      return g;
    });
  }

  function intersectSolveLines(lines) {
    if (!lines || lines.length < 2) return null;
    var Sys = global.DoctematicaSystems;
    if (!Sys) return null;
    var eq1 = sortedLineEq(lines[0].line) || prettyLineEq(lines[0].line);
    var eq2 = sortedLineEq(lines[1].line) || prettyLineEq(lines[1].line);
    if (!eq1 || !eq2) return null;
    try {
      var sol = Sys.solvePair(eq1, eq2);
      if (sol && sol.kind === "unique") return { x: sol.x, y: sol.y };
    } catch (e2) {}
    return null;
  }

  function intersectStage(pack, progress) {
    var lines = intersectLines(pack);
    var i;
    for (i = 0; i < lines.length; i++) {
      if (!intersectLineReady(lines[i].line, progress, lines[i].key)) {
        return { stage: "rearrange", key: lines[i].key, entry: lines[i] };
      }
    }
    var intr = liveIntersect(pack, progress);
    var task = openLineIntersectTask(pack, progress);
    var easy = task ? intersectEasyAxis(pack, task) : null;
    var cf = task && progress.coords && progress.coords[task.id];
    var yKnown = !!(intr.yKnown || (cf && cf.y));
    var xReady = intersectXReady(pack, progress);
    if (!intr.yDone && xReady && !yKnown) return { stage: "plugY" };
    if (easy && easy.kind === "y" && !yKnown && !intr.equated && !intr.xDone) {
      return { stage: "knownY", easy: easy };
    }
    if (easy && easy.kind === "x" && !intr.xDone && !intr.equated && !(cf && cf.x)) {
      return { stage: "knownX", easy: easy };
    }
    if (easy && easy.kind === "y" && yKnown && !intr.xDone) return { stage: "solveX" };
    if (!intr.equated && !yKnown && !(easy && easy.kind === "x" && (cf && cf.x))) {
      return { stage: "equate" };
    }
    if (!intr.xDone) return { stage: "solveX" };
    if (!intr.yDone && !yKnown) return { stage: "plugY" };
    return { stage: "point" };
  }

  function intersectPlugStart(pack, progress, phit) {
    var thru = phit ? linesThroughTask(pack, phit) : [];
    var key =
      phit.lineKey ||
      (thru[0] && thru[0].key) ||
      (intersectLines(pack)[0] && intersectLines(pack)[0].key);
    var raw = intersectLineRaw(pack, key);
    var eq = intersectDisplayEq(pack, progress, key);
    var rhs = slopeInterceptRhsText(eq, raw);
    var xVal = liveIntersect(pack, progress).xVal;
    if (rhs == null || xVal == null) return "y = " + rhs;
    var L = parseLineSpec(raw);
    if (L) return "y = " + substYRhs(L, xVal);
    return "y = " + rhs;
  }

  function checkLineIntersectRearrange(typed, pack, progress, stageInfo) {
    var key = stageInfo.key;
    var rawLine = stageInfo.entry.line;
    var hits = [{ param: "m" }];
    if (looksLikeLineMbAnswer(typed, hits)) return null;
    if (!looksLikeLinearEq(typed) && !/^y\s*=/i.test(String(typed || ""))) return null;
    if (lineMbRearrangeComplete(typed, rawLine)) {
      var display = sortedLineEq(rawLine) || lineEqDisplayFromText(typed, rawLine);
      var lineEq = Object.assign({}, progress.lineEq || {});
      lineEq[key] = display;
      return {
        ok: true,
        solved: false,
        lineEq: lineEq,
        show: display,
        rawStep: true,
        message:
          "נכון. " +
          intersectLineLabel(pack, key) +
          " בצורה y = mx + b — המשיכו.",
      };
    }
    var prev = intersectStoredEq(progress, key) || (rawLine.eqText || prettyLineEq(rawLine));
    var Sys = global.DoctematicaSystems;
    if (!Sys || typeof Sys.checkWorkStep !== "function") {
      return {
        ok: false,
        message: "סדרו את " + intersectLineLabel(pack, key) + " לצורה y = mx + b.",
      };
    }
    if (normEqText(typed) === normEqText(prev)) {
      return { ok: false, message: "זו אותה משוואה. כתבו צעד חדש." };
    }
    var stepRes = Sys.checkWorkStep(prev, typed);
    if (!stepRes.ok) return { ok: false, message: stepRes.message };
    var pretty = prettyRearrangeStep(typed, rawLine);
    if (lineMbRearrangeComplete(typed, rawLine)) {
      var display2 = sortedLineEq(rawLine) || lineEqDisplayFromText(typed, rawLine);
      var lineEq2 = Object.assign({}, progress.lineEq || {});
      lineEq2[key] = display2;
      return {
        ok: true,
        solved: false,
        lineEq: lineEq2,
        show: display2,
        rawStep: true,
        message: "נכון. " + intersectLineLabel(pack, key) + " בצורה y = mx + b — המשיכו.",
      };
    }
    var lineEq3 = Object.assign({}, progress.lineEq || {});
    lineEq3[key] = pretty;
    return {
      ok: true,
      solved: false,
      lineEq: lineEq3,
      show: pretty,
      rawStep: true,
      message: lineMbRearrangeStepMessage(prev, typed, rawLine, stepRes, hits),
    };
  }

  function checkLineIntersect(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var hits = preferPartTasks(
      pending.filter(function (t) {
        if (t.kind === "lineIntersect") return true;
        if (t.kind !== "point") return false;
        if (progress.intersect && progress.intersect.taskId === t.id) return true;
        return linesThroughTask(pack, t).length >= 2 && looksLikeTwoSidedXEquate(typed);
      }),
      pack,
      progress
    );
    if (!hits.length) return null;
    var phit = hits[0];
    if (phit && (phit.kind === "lineIntersect" || phit.kind === "point")) {
      var wrongIsect = wrongFigureLinePlugResult(typed, pack, progress, phit);
      if (wrongIsect) return wrongIsect;
    }
    if (phit.kind === "point" && !(progress.intersect && progress.intersect.taskId === phit.id)) {
      var matchPt = null;
      var partPts = preferPartTasks(
        pending.filter(function (t) {
          return t.kind === "point";
        }),
        pack,
        progress
      );
      var mpi;
      for (mpi = 0; mpi < partPts.length; mpi++) {
        if (matchEquatePair(typed, pack, progress, linesThroughTask(pack, partPts[mpi]))) {
          matchPt = partPts[mpi];
          break;
        }
      }
      if (!matchPt) return null;
      phit = matchPt;
    }
    var stage = intersectStage(pack, progress);
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    if (!maps.coords[phit.id]) maps.coords[phit.id] = { x: false, y: false };
    if (!maps.partial[phit.id]) maps.partial[phit.id] = false;
    if (!progress.intersect) progress.intersect = {};
    var intr = liveIntersect(pack, Object.assign({}, progress, { coords: maps.coords }));
    if (phit && phit.id) intr.taskId = phit.id;
    var wantX = phit.answerX;
    var wantY = phit.answerY;
    var A = global.DoctematicaAlgebra;
    intr = syncIntersectXKnown(pack, progress, intr, maps.coords, wantX);
    if (!intr.xVal && intr.xDone) intr.xVal = wantX;
    stage = intersectStage(
      pack,
      Object.assign({}, progress, { intersect: intr, coords: maps.coords })
    );

    var skipPair = parsed && parsed.point ? parsed.point : parsePointPair(typed);
    if (
      skipPair &&
      wantX != null &&
      wantY != null &&
      nearNum(skipPair.x, wantX) &&
      nearNum(skipPair.y, wantY)
    ) {
      maps.done[phit.id] = true;
      maps.coords[phit.id] = { x: true, y: true };
      delete maps.partial[phit.id];
      var skipShow = phit.label + " " + formatPointPair(skipPair.x, skipPair.y);
      var skipLeft = remainingRequired(pack, maps.done);
      return {
        ok: true,
        solved: skipLeft.length === 0,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: phit,
        show: skipShow,
        revealPoint: phit.point || phit.label,
        intersect: { equated: true, xDone: true, yDone: true, xVal: wantX },
        message:
          skipLeft.length === 0
            ? "נכון. " + skipShow + ". כל התשובות נכונות."
            : "נכון. " + skipShow + ".",
      };
    }

    function resPartial(show, msg, extra) {
      extra = extra || {};
      return Object.assign(
        {
          ok: true,
          solved: false,
          done: maps.done,
          partial: maps.partial,
          coords: maps.coords,
          lastExpr: maps.lastExpr,
          task: phit,
          show: show,
          rawStep: !!extra.rawStep,
          intersect: intr,
          lineEq: extra.lineEq || progress.lineEq,
          message: msg,
        },
        extra
      );
    }

    if (stage.stage === "rearrange") {
      var rearr = checkLineIntersectRearrange(typed, pack, progress, stage);
      if (rearr) {
        rearr.task = phit;
        rearr.intersect = intr;
        return rearr;
      }
      var fakeEq = Object.assign({}, progress.lineEq || {});
      intersectLines(pack).forEach(function (item) {
        if (!intersectLineReady(item.line, progress, item.key)) {
          fakeEq[item.key] = sortedLineEq(item.line);
        }
      });
      progress = Object.assign({}, progress, { lineEq: fakeEq });
      stage = intersectStage(
        pack,
        Object.assign({}, progress, { intersect: intr, coords: maps.coords })
      );
    }

    if (stage.stage === "knownY" || stage.stage === "knownX") {
      var easyNow = stage.easy || intersectEasyAxis(pack, phit);
      var canonEasy = intersectEquateCanonical(pack, Object.assign({}, progress, { intersect: intr }));
      if (canonEasy && intersectEquateEquivalent(typed, canonEasy)) {
        intr.equated = true;
        intr.equateExpr = canonEasy;
        intr.lastExpr = prettyRearrangeStep(typed);
        maps.partial[phit.id] = true;
        maps.lastExpr[phit.id] = intr.lastExpr;
        return resPartial(intr.lastExpr, "נכון. זו השוואה בין הישרים. עכשיו פתרו ומצאו את x.", {
          rawStep: true,
          userStep: intr.lastExpr,
        });
      }
      var linEasy = canonEasy ? intersectAcceptLinearAdvance(typed, phit, canonEasy) : null;
      if (linEasy) {
        intr.equated = true;
        intr.equateExpr = canonEasy;
        intr.lastExpr = linEasy.show;
        maps.partial[phit.id] = true;
        return resPartial(linEasy.show, "נכון. המשיכו לפתור עבור x.", { rawStep: true, userStep: linEasy.show });
      }
      if (stage.stage === "knownY") {
        var yGot = intersectTypedYValue(typed, parsed, phit);
        if (yGot != null && nearNum(yGot, wantY)) {
          intr.yKnown = true;
          intr.yDone = true;
          maps.coords[phit.id].y = true;
          maps.partial[phit.id] = true;
          intr.lastExpr = "y = " + fmtNum(wantY);
          intr.plugFromY = easyNow && easyNow.other ? startPlugYEq(easyNow.other.line, wantY) : canonEasy;
          maps.lastExpr[phit.id] = intr.lastExpr;
          return resPartial(intr.lastExpr, "נכון. הישר מקביל לציר x, לכן y = " + fmtNum(wantY) + ". עכשיו הציבו במשוואה השנייה ומצאו את x.", {
            rawStep: true,
            userStep: intr.lastExpr,
          });
        }
        var labY = String(phit.label || phit.point || "B").toUpperCase();
        return {
          ok: false,
          message:
            labY +
            " על הישר המקביל לציר x — רשמו y = " +
            fmtNum(wantY) +
            ". אפשר גם להשוות בין הישרים: " +
            canonEasy +
            ".",
        };
      }
      var earlyKX = intersectAcceptEarlyX(typed, parsed, phit, canonEasy);
      if (earlyKX) {
        intr.equated = true;
        intr.xDone = true;
        intr.xVal = wantX;
        intr.lastExpr = earlyKX.show;
        maps.coords[phit.id].x = true;
        maps.partial[phit.id] = true;
        return resPartial(earlyKX.show, "נכון. הישר מקביל לציר y, לכן x = " + fmtNum(wantX) + ". עכשיו הציבו ומצאו את y.", {
          rawStep: true,
          userStep: earlyKX.show,
        });
      }
      var labX = String(phit.label || phit.point || "B").toUpperCase();
      return {
        ok: false,
        message:
          labX +
          " על הישר המקביל לציר y — רשמו x = " +
          fmtNum(wantX) +
          ". אפשר גם להשוות בין הישרים: " +
          canonEasy +
          ".",
      };
    }

    if (stage.stage === "equate") {
      if (phit.kind === "point") {
        var thruEq = linesThroughTask(pack, phit);
        var pairEq = matchEquatePair(typed, pack, progress, thruEq);
        if (!pairEq) return null;
        intr.keys = pairEq;
        intr.taskId = phit.id;
      }
      var canonical = intersectEquateCanonical(pack, Object.assign({}, progress, { intersect: intr }));
      if (intersectEquateEquivalent(typed, canonical)) {
        intr.equated = true;
        intr.equateExpr = canonical;
        intr.lastExpr = prettyRearrangeStep(typed);
        maps.partial[phit.id] = true;
        maps.lastExpr[phit.id] = intr.lastExpr;
        return resPartial(intr.lastExpr, "נכון. זו השוואה בין הישרים. עכשיו פתרו ומצאו את x.", {
          rawStep: true,
          userStep: intr.lastExpr,
        });
      }
      var earlyX = intersectAcceptEarlyX(typed, parsed, phit, canonical);
      if (earlyX) {
        intr.equated = true;
        intr.equateExpr = canonical;
        intr.xDone = true;
        intr.xVal = wantX;
        intr.lastExpr = earlyX.show;
        maps.coords[phit.id].x = true;
        maps.partial[phit.id] = true;
        return resPartial(earlyX.show, "נכון. x = " + fmtNum(wantX) + ". עכשיו הציבו ומצאו את y.", {
          rawStep: true,
          userStep: earlyX.show,
        });
      }
      var advanceEq = intersectAcceptLinearAdvance(typed, phit, canonical);
      if (advanceEq) {
        intr.equated = true;
        intr.equateExpr = canonical;
        intr.lastExpr = advanceEq.show;
        maps.partial[phit.id] = true;
        return resPartial(advanceEq.show, "נכון. המשיכו לפתור עבור x.", {
          rawStep: true,
          userStep: advanceEq.show,
        });
      }
      if (parsed && parsed.kind === "point") {
        return null;
      }
      if (phit.kind === "point") return null;
      return {
        ok: false,
        message: "השוו בין שני הישרים: " + canonical + ".",
      };
    }

    if (stage.stage === "solveX") {
      var prevEq = intersectSolveHintEq(pack, Object.assign({}, progress, { intersect: intr }));
      var canonEq = intr.equateExpr || intr.plugFromY || intersectEquateCanonical(pack, progress);
      var yAlready = !!(intr.yKnown || (maps.coords[phit.id] && maps.coords[phit.id].y));
      var afterXMsg = yAlready
        ? "נכון. x = " + fmtNum(wantX) + ". עכשיו רשמו " + phit.label + "(x;y)."
        : "נכון. x = " + fmtNum(wantX) + ". עכשיו הציבו ומצאו את y.";
      if (intr.plugFromY && intersectEquateEquivalent(typed, intr.plugFromY) && !isSolvedXText(typed)) {
        intr.lastExpr = prettyRearrangeStep(typed);
        maps.partial[phit.id] = true;
        return resPartial(intr.lastExpr, "נכון. עכשיו פתרו ומצאו את x.", {
          rawStep: true,
          userStep: intr.lastExpr,
        });
      }
      var earlySolveX = intersectAcceptEarlyX(typed, parsed, phit, canonEq);
      if (earlySolveX) {
        intr.xDone = true;
        intr.xVal = wantX;
        intr.lastExpr = earlySolveX.show;
        maps.coords[phit.id].x = true;
        maps.partial[phit.id] = true;
        return resPartial(earlySolveX.show, afterXMsg, {
          rawStep: true,
          userStep: earlySolveX.show,
        });
      }
      if (!A || typeof A.checkStep !== "function") {
        return { ok: false, message: "פתרו את המשוואה " + prevEq + "." };
      }
      var xRes = A.checkStep(prevEq, typed);
      if (!xRes.ok) {
        return { ok: false, message: xRes.message || "הצעד לא שקול למשוואה." };
      }
      var userStep = prettyRearrangeStep(typed);
      var prettyX = userStep;
      if (xRes.solved || (A.isSolvedText && A.isSolvedText(typed))) {
        var solX = A.solutionOf ? A.solutionOf(xRes.equation || A.parseEquation(typed)) : wantX;
        if (solX != null && !nearNum(solX, wantX)) {
          return { ok: false, message: "x עדיין לא מדויק. בדקו את החישוב." };
        }
        intr.xDone = true;
        intr.xVal = wantX;
        intr.lastExpr = prettyX.indexOf("=") >= 0 ? prettyX : "x = " + fmtNum(wantX);
        maps.coords[phit.id].x = true;
        maps.partial[phit.id] = true;
        return resPartial(intr.lastExpr, typeof afterXMsg !== "undefined" ? afterXMsg : "נכון. x = " + fmtNum(wantX) + ". עכשיו הציבו ומצאו את y.", {
          rawStep: true,
          userStep: userStep,
        });
      }
      intr.lastExpr = prettyX;
      maps.partial[phit.id] = true;
      return resPartial(prettyX, xRes.message || "צעד חוקי. המשיכו לפתור עבור x.", {
        rawStep: true,
        userStep: userStep,
      });
    }

    if (stage.stage === "plugY") {
      if (!intr.xVal) intr.xVal = wantX;
      var plugStart = intersectPlugStart(
        pack,
        Object.assign({}, progress, { intersect: intr }),
        phit
      );
      var plugPrev = intr.plugExpr || plugStart;
      var plugTyped = typed;
      if (!/^y\s*=/i.test(String(plugTyped || ""))) {
        if (/^[=:]/.test(String(plugTyped || "").trim())) {
          plugTyped = "y " + String(plugTyped || "").trim();
        } else if (parsed && parsed.kind === "final" && parsed.value != null && !parsed.tag) {
          plugTyped = "y = " + fmtNum(parsed.value);
        }
      }
      var normTypedPlug = normEqText(plugTyped);
      var normPlugStart = normEqText(plugStart);

      if (!intr.plugExpr && normTypedPlug === normPlugStart) {
        intr.plugExpr = prettyRearrangeStep(plugTyped);
        intr.lastExpr = intr.plugExpr;
        maps.partial[phit.id] = true;
        return resPartial(intr.plugExpr, "נכון. עכשיו חשבו את y.", {
          rawStep: true,
          userStep: intr.plugExpr,
        });
      }
      if (!A || typeof A.checkStep !== "function") {
        return { ok: false, message: "הציבו x = " + fmtNum(intr.xVal) + " ב" + plugStart + "." };
      }
      var yRes = checkPlugYStep(plugPrev, plugTyped);
      if (!yRes.ok) {
        var tryPlug = checkPlugYStep(plugStart, plugTyped);
        if (tryPlug && tryPlug.ok) yRes = tryPlug;
        else return { ok: false, message: yRes.message || "בדקו את ההצבה והחישוב." };
      }
      var prettyY = prettyRearrangeStep(plugTyped);
      if (isSolvedYText(plugTyped)) {
        var yVal = evalMaybeExpr(lastEqStage(prettyY));
        if (yVal != null && !nearNum(yVal, wantY)) {
          return { ok: false, message: "y עדיין לא מדויק. בדקו את החישוב." };
        }
        intr.yDone = true;
        intr.lastExpr = prettyY.indexOf("=") >= 0 ? prettyY : "y = " + fmtNum(wantY);
        maps.coords[phit.id].y = true;
        maps.partial[phit.id] = true;
        return resPartial(intr.lastExpr, "נכון. y = " + fmtNum(wantY) + ". עכשיו רשמו " + phit.label + "(x;y).", {
          rawStep: true,
          userStep: prettyY,
        });
      }
      intr.plugExpr = prettyY;
      intr.lastExpr = prettyY;
      maps.partial[phit.id] = true;
      return resPartial(prettyY, yRes.message || "צעד חוקי. המשיכו לחשב את y.", {
        rawStep: true,
        userStep: prettyY,
      });
    }

    var pair = parsed && parsed.point ? parsed.point : parsePointPair(typed);
    if (!pair && parsed && parsed.tag && String(parsed.tag).toUpperCase() === String(phit.label || phit.point || "P").toUpperCase()) {
      if (parsed.kind === "point" && parsed.point) pair = parsed.point;
    }
    if (!pair) {
      return {
        ok: false,
        message: "רשמו את נקודת החיתוך " + phit.label + "(" + fmtNum(wantX) + ";" + fmtNum(wantY) + ").",
      };
    }
    if (!nearNum(pair.x, wantX) || !nearNum(pair.y, wantY)) {
      return {
        ok: false,
        message: "הנקודה עדיין לא נכונה. בדקו את x ואת y.",
      };
    }
    maps.done[phit.id] = true;
    maps.coords[phit.id] = { x: true, y: true };
    delete maps.partial[phit.id];
    var showPt = phit.label + " " + formatPointPair(pair.x, pair.y);
    var left = remainingRequired(pack, maps.done);
    return {
      ok: true,
      solved: left.length === 0,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      task: phit,
      show: showPt,
      revealPoint: phit.point || phit.label,
      intersect: intr,
      message: left.length === 0 ? "נכון. " + showPt + ". כל התשובות נכונות." : "נכון. " + showPt + ".",
    };
  }

  function graphLinesForIntersect(pack, progress) {
    return intersectLines(pack).map(function (item, idx) {
      var raw = item.line;
      var g = Object.assign(parseLineSpec(raw), { showEq: true, _raw: raw, graphKey: item.key });
      var stored = intersectStoredEq(progress, item.key);
      if (stored) g.eqText = stored;
      else if (raw && raw.eqText) g.eqText = raw.eqText;
      else g.eqText = sortedLineEq(raw);
      g.graphClass = idx === 0 ? "coord-line" : "coord-line coord-line-b";
      if (item.label) g.lineLabel = item.label;
      if (raw && raw.hideEq) {
        var storedHide = intersectStoredEq(progress, item.key);
        var revealedI =
          storedHide ||
          (progress &&
            progress.lineEqDisplay &&
            sameSlopeIntercept(progress.lineEqDisplay, raw) &&
            progress.lineEqDisplay);
        g.showEq = !!revealedI;
        if (revealedI) {
          g.eqText = revealedI;
          g.lineLabel = null;
        } else {
          g.lineLabel = null;
        }
      }
      if (raw && raw.dashed) {
        g.graphClass = (g.graphClass || "coord-line") + " is-dashed";
      }
      return g;
    });
  }

  function parseLineSpec(line) {
    if (!line) return null;
    var eqText = line.eqText || null;
    if (line.vertical != null) {
      var vx = Number(line.vertical);
      if (!isFinite(vx)) return null;
      return { vertical: vx, eqText: eqText || "x = " + fmtNum(vx) };
    }
    if (line.implicit) {
      var ax = Number(line.implicit.ax);
      var ay = Number(line.implicit.ay);
      var c = Number(line.implicit.c);
      if (!isFinite(ax) || !isFinite(ay) || !isFinite(c) || near0(ay)) return null;
      return {
        m: -ax / ay,
        b: c / ay,
        mn: null,
        md: 1,
        eqText: eqText,
        implicit: { ax: ax, ay: ay, c: c },
      };
    }
    var md = line.md != null ? Number(line.md) : 1;
    var mn = line.mn != null ? Number(line.mn) : null;
    var m = line.m != null ? Number(line.m) : mn != null && md ? mn / md : null;
    var b = line.b != null ? Number(line.b) : 0;
    if (m == null || !isFinite(m) || !isFinite(b)) return null;
    var bn = line.bn != null ? Number(line.bn) : null;
    var bd = line.bd != null ? Number(line.bd) : null;
    return { m: m, b: b, mn: mn, md: md || 1, bn: bn, bd: bd, eqText: eqText };
  }

  function lineYAt(line, x) {
    var L = parseLineSpec(line);
    if (!L) return null;
    return L.m * Number(x) + L.b;
  }

  function isSlopeInterceptEqText(eq) {
    return /^y\s*=/i.test(
      String(eq || "")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "")
    );
  }

  function fractionXCoeff(num, den) {
    if (!den || den === 1) {
      if (num === 1) return "x";
      if (num === -1) return "−x";
      return (num < 0 ? "−" + fmtNum(-num) : fmtNum(num)) + "x";
    }
    if (num < 0) return "−(" + fmtNum(-num) + "/" + fmtNum(den) + ")x";
    return "(" + fmtNum(num) + "/" + fmtNum(den) + ")x";
  }

  function slopeInterceptXTerm(L) {
    if (near0(L.m)) return "";
    if (nearNum(L.m, 1)) return "x";
    if (nearNum(L.m, -1)) return "−x";
    if (L.md && L.md !== 1 && L.mn != null) {
      return fractionXCoeff(L.mn, L.md);
    }
    if (nearNum(L.m, Math.round(L.m))) {
      return (L.m < 0 ? "−" + fmtNum(-L.m) : fmtNum(L.m)) + "x";
    }
    var d;
    for (d = 2; d <= 16; d++) {
      var n = Math.round(L.m * d);
      if (nearNum(n / d, L.m)) {
        return fractionXCoeff(n, d);
      }
    }
    var mShow = L.m < 0 ? "−" + fmtNum(-L.m) : fmtNum(L.m);
    if (/\//.test(mShow)) {
      if (/^−/.test(mShow)) return "−(" + mShow.slice(1) + ")x";
      return "(" + mShow + ")x";
    }
    return mShow + "x";
  }

  function lineMbNeedsUnsorted(line) {
    if (!line) return false;
    if (line.vertical != null) return false;
    var eq = String(line.eqText || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (/^x=/i.test(eq)) return false;
    if (line.unsorted) return true;
    if (line.implicit && line.eqText && !isSlopeInterceptEqText(line.eqText)) return true;
    if (line.eqText && /=\s*/.test(line.eqText) && !isSlopeInterceptEqText(line.eqText)) return true;
    return false;
  }

  function givenLineEqText(line, progress) {
    if (progress && progress.lineEqDisplay) return progress.lineEqDisplay;
    if (line && lineMbNeedsUnsorted(line) && line.eqText) return line.eqText;
    return prettyLineEq(line);
  }

  function sortedLineEq(line) {
    if (!line) return "";
    if (line.eqText && isSlopeInterceptEqText(line.eqText)) return line.eqText;
    var copy = Object.assign({}, line);
    delete copy.unsorted;
    delete copy.eqText;
    if (copy.implicit && copy.mn != null && copy.md) {
      var L = parseLineSpec(copy);
      if (L) return slopeInterceptStandard(Object.assign({}, L, { mn: copy.mn, md: copy.md }));
    }
    var L2 = parseLineSpec(copy);
    if (L2) return slopeInterceptStandard(L2);
    return prettyLineEq(copy);
  }

  function lineMbDisplayEq(line, progress) {
    return givenLineEqText(line, progress);
  }

  function lineMbRearranged(progress) {
    if (!progress) return false;
    if (progress.mbRearranged) return true;
    return !!(progress.lineEqDisplay && isSlopeInterceptEqText(progress.lineEqDisplay));
  }

  function looksLikeLineMbAnswer(typed, hits) {
    if (!typed || !hits || !hits.length) return false;
    var seen = {};
    for (var i = 0; i < hits.length; i++) {
      var param = String(hits[i].param || hits[i].label || "m").toLowerCase();
      if (seen[param]) continue;
      seen[param] = true;
      if (parseLineMbInput(typed, param) != null) return true;
    }
    return false;
  }

  function slopeInterceptStandard(L) {
    if (!L || L.vertical != null) return "";
    var xs = slopeInterceptXTerm(L);
    if (near0(L.b)) return xs ? "y = " + xs : "y = 0";
    if (!xs) return "y = " + fmtLineB(L);
    if (L.b > 0) return "y = " + xs + " + " + fmtLineB(L);
    var absL = Object.assign({}, L, {
      b: Math.abs(L.b),
      bn: L.bn != null ? Math.abs(L.bn) : null,
    });
    return "y = " + xs + " − " + fmtLineB(absL);
  }

  function prettyLineEq(line) {
    if (line && line.unsorted && line.eqText) return line.eqText;
    if (line && line.eqText && isSlopeInterceptEqText(line.eqText)) return line.eqText;
    if (line && line.implicit && line.eqText) return line.eqText;
    var L = parseLineSpec(line);
    if (!L) return "";
    if (L.eqText && isSlopeInterceptEqText(L.eqText)) return L.eqText;
    if (L.implicit && L.eqText) return L.eqText;
    if (L.vertical != null) return "x = " + fmtNum(L.vertical);
    var xs = slopeInterceptXTerm(L);
    if (near0(L.b)) return xs ? "y = " + xs : "y = 0";
    if (!xs) return "y = " + fmtNum(L.b);
    if (L.m < 0 && L.b > 0) return "y = " + fmtNum(L.b) + " − " + xs.replace(/^−/, "");
    if (L.b > 0) return "y = " + xs + " + " + fmtNum(L.b);
    return "y = " + xs + " − " + fmtNum(-L.b);
  }

  function normalizeExerciseLine(rawLine, tasks) {
    if (!rawLine) return null;
    var hasMb = (tasks || []).some(function (t) {
      return t.kind === "lineMb";
    });
    if (!hasMb) return rawLine;
    if (lineMbNeedsUnsorted(rawLine)) return Object.assign({}, rawLine);
    var copy = Object.assign({}, rawLine);
    delete copy.implicit;
    copy.eqText = prettyLineEq(copy);
    return copy;
  }

  function substYRhs(line, x) {
    var L = parseLineSpec(line);
    if (!L) return "";
    var xs = fmtNum(x);
    var xBit;
    if (near0(L.m)) return fmtNum(L.b);
    if (nearNum(L.m, 1)) xBit = xs;
    else if (nearNum(L.m, -1)) xBit = x < 0 ? "−(" + xs + ")" : "−" + xs;
    else if (L.md && L.md !== 1 && L.mn != null) {
      var nShow2 = L.mn < 0 ? "−" + fmtNum(-L.mn) : fmtNum(L.mn);
      var frac = "(" + nShow2 + "/" + fmtNum(L.md) + ")";
      xBit = x < 0 ? frac + "·(" + xs + ")" : frac + "·" + xs;
    } else {
      var mAbs = L.m < 0 ? "−" + fmtNum(-L.m) : fmtNum(L.m);
      xBit = x < 0 ? mAbs + "·(" + xs + ")" : mAbs + "·" + xs;
    }
    if (near0(L.b)) return xBit;
    if (L.b > 0) return xBit + " + " + fmtNum(L.b);
    return xBit + " − " + fmtNum(-L.b);
  }

  function implicitAbsBody(coeff, letter) {
    var a = Math.abs(Number(coeff));
    if (letter === "0") return nearNum(a, 1) ? "0" : fmtNum(a) + "·0";
    if (nearNum(a, 1)) return letter;
    return fmtNum(a) + letter;
  }

  function joinSignedCoeffTerms(parts) {
    var out = "";
    var i;
    for (i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p || near0(p.coeff)) continue;
      var body = p.body;
      if (!out) out = p.coeff < 0 ? "−" + body : body;
      else out += p.coeff < 0 ? " − " + body : " + " + body;
    }
    return out;
  }

  function implicitZeroedEq(line, zeroVar) {
    var L = parseLineSpec(line);
    if (!L || !L.implicit) return null;
    var ax = L.implicit.ax;
    var ay = L.implicit.ay;
    var c = L.implicit.c;
    var left =
      zeroVar === "x"
        ? joinSignedCoeffTerms([{ coeff: ay, body: implicitAbsBody(ay, "y") }])
        : joinSignedCoeffTerms([{ coeff: ax, body: implicitAbsBody(ax, "x") }]);
    if (!left) return null;
    return left + " = " + fmtNum(c);
  }

  function implicitPlugEq(line, zeroVar) {
    var L = parseLineSpec(line);
    if (!L || !L.implicit) return null;
    var ax = L.implicit.ax;
    var ay = L.implicit.ay;
    var c = L.implicit.c;
    var left;
    if (zeroVar === "x") {
      left = joinSignedCoeffTerms([
        { coeff: ax, body: implicitAbsBody(ax, "0") },
        { coeff: ay, body: implicitAbsBody(ay, "y") },
      ]);
    } else if (zeroVar === "y") {
      left = joinSignedCoeffTerms([
        { coeff: ax, body: implicitAbsBody(ax, "x") },
        { coeff: ay, body: implicitAbsBody(ay, "0") },
      ]);
    } else {
      return null;
    }
    if (!left) return implicitZeroedEq(line, zeroVar);
    return left + " = " + fmtNum(c);
  }

  function eqRewriteUnknownAsX(text) {
    var t = String(text || "");
    if (!/[yY]/.test(t)) return t;
    if (/[xX]/.test(t)) return t;
    return t.replace(/[yY]/g, "x");
  }

  function linearEqEquivalent(a, b) {
    if (!a || !b) return false;
    if (eqNormEqual(a, b)) return true;
    var A = global.DoctematicaAlgebra;
    if (!A || typeof A.equivalent !== "function" || typeof A.parseEquation !== "function") return false;
    try {
      return !!A.equivalent(A.parseEquation(eqRewriteUnknownAsX(a)), A.parseEquation(eqRewriteUnknownAsX(b)));
    } catch (e) {
      return false;
    }
  }

  function checkLinearUnknownStep(prev, next, letter) {
    var A = global.DoctematicaAlgebra;
    if (!A || typeof A.checkStep !== "function") return { ok: false };
    var from = String(letter || "x").toLowerCase() === "y" ? eqRewriteUnknownAsX(prev) : prev;
    var to = String(letter || "x").toLowerCase() === "y" ? eqRewriteUnknownAsX(next) : next;
    return A.checkStep(from, to);
  }

  /** After x=0 (or y=0): −4y=12, 3·0−4y=12, 3x=12, y=−3 if equivalent. */
  function typedMatchesImplicitAfterZero(typed, line, zeroVar) {
    var L = parseLineSpec(line);
    if (!L || !L.implicit) return false;
    var t = String(typed || "").replace(/[−–—]/g, "-");
    if (t.indexOf("=") < 0) return false;
    var unk = zeroVar === "x" ? "y" : "x";
    if (!new RegExp(unk, "i").test(t)) return false;
    var live = t
      .replace(/\d+\s*[·*×]\s*0/g, "")
      .replace(/\(\s*0\s*\)/g, "");
    var other = zeroVar === "x" ? "x" : "y";
    if (new RegExp(other, "i").test(live)) return false;
    var dropped = implicitZeroedEq(line, zeroVar);
    var shown = implicitPlugEq(line, zeroVar);
    return (
      (dropped && linearEqEquivalent(t, dropped)) ||
      (shown && linearEqEquivalent(t, shown))
    );
  }

  function startPlugYEq(line, y) {
    var imp = implicitPlugEq(line, "y");
    if (imp && nearNum(y, 0)) return imp;
    var L = parseLineSpec(line);
    if (!L) return "";
    if (L.vertical != null && nearNum(y, 0)) return "x = " + fmtNum(L.vertical);
    var left = fmtNum(y);
    var xs = slopeInterceptXTerm(L);
    if (!xs) xs = "0";
    if (near0(L.b)) return left + " = " + xs;
    if (L.b > 0) return left + " = " + xs + " + " + fmtNum(L.b);
    return left + " = " + xs + " − " + fmtNum(-L.b);
  }

  function looksLikeLinearEq(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (t.indexOf("=") < 0) return false;
    if (/^[xyXY]=/.test(t) && !/[xyXY]/.test(t.replace(/^[xyXY]=/, ""))) return false;
    return /[xy]/i.test(t);
  }

  function eqNormEqual(a, b) {
    if (!a || !b) return false;
    if (normEqText(a) === normEqText(b)) return true;
    var Sys = global.DoctematicaSystems;
    if (Sys && typeof Sys.equivalent === "function") {
      try {
        return !!Sys.equivalent(Sys.parseEquation(a), Sys.parseEquation(b));
      } catch (e) {}
    }
    return false;
  }

  function typedUsesFigureLine(typed, raw, task) {
    if (!raw || !task || task.answerX == null || task.answerY == null) return null;
    if (sameSlopeIntercept(typed, raw)) return "eq";
    var yPlug = "y = " + substYRhs(raw, task.answerX);
    if (eqNormEqual(typed, yPlug)) return "yplug";
    var yAt = lineYAt(raw, task.answerX);
    if (yAt != null && isFinite(yAt) && !nearNum(yAt, task.answerY)) {
      var yVal = "y = " + fmtNum(yAt);
      if (eqNormEqual(typed, yVal)) return "yval";
    }
    var xPlug = startPlugYEq(raw, task.answerY);
    if (xPlug && eqNormEqual(typed, xPlug)) return "xplug";
    return null;
  }

  function looksLikeLinePlugAttempt(typed) {
    var s = String(typed || "");
    if (looksLikeLinearEq(s)) return true;
    if (/^\s*y\s*=/i.test(s)) return true;
    if (/^\s*0\s*=/i.test(s)) return true;
    return false;
  }

  function wrongFigureLinePlugResult(typed, pack, progress, task) {
    if (!task || !looksLikeLinePlugAttempt(typed)) return null;
    var entries = figureLineEntries(pack, progress);
    if (entries.length < 2) return null;
    var wrong = null;
    var i;
    for (i = 0; i < entries.length; i++) {
      var raw = entries[i].line;
      if (!typedUsesFigureLine(typed, raw, task)) continue;
      if (pointOnLineRaw(raw, task.answerX, task.answerY)) continue;
      wrong = raw;
      break;
    }
    if (!wrong) return null;
    var correct =
      (lineForPointTask(pack, progress, task) &&
      pointOnLineRaw(lineForPointTask(pack, progress, task), task.answerX, task.answerY)
        ? lineForPointTask(pack, progress, task)
        : null) ||
      (linesThroughTask(pack, task)[0] && linesThroughTask(pack, task)[0].line) ||
      (task.line ? task.line : null);
    if (correct && sameSlopeIntercept(prettyLineEq(wrong), correct)) return null;
    var lab = String((task && (task.point || task.label)) || "הנקודה").toUpperCase();
    var miss = String((task && task.missing) || "").toLowerCase();
    var how =
      miss === "y" || (task && task.intercept === "y")
        ? " הציבו x = " + fmtNum(task.answerX) + " במשוואה הנכונה."
        : miss === "x" || (task && task.intercept === "x")
        ? " הציבו y = " + fmtNum(task.answerY) + " במשוואה הנכונה."
        : " השתמשו במשוואה שעוברת בנקודה.";
    return {
      ok: false,
      message:
        "הצבתם במשוואה " +
        prettyLineEq(wrong) +
        ", אבל הנקודה " +
        lab +
        " לא נמצאת על הישר הזה. " +
        (correct ? lab + " נמצאת על " + prettyLineEq(correct) + "." : "") +
        how,
    };
  }

  function eqIsBareAxis(s, axis) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (!t) return false;
    if (String(axis || "").toLowerCase() === "y") return /^y=/i.test(t) && !/[xX]/.test(t);
    return /^x=/i.test(t) && !/[yY]/.test(t);
  }

  /** x = 2 / Ax = 2 / Ay = 5 — שיעור שכבר נרשם, לא הצבה. */
  function eqIsKnownAxisValue(s, axis) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (!t) return false;
    var ax = String(axis || "x").toLowerCase() === "y" ? "y" : "x";
    var other = ax === "y" ? "x" : "y";
    var m = t.match(new RegExp("^(?:[A-Za-z])?" + ax + "=(.+)$", "i"));
    if (!m) return false;
    if (new RegExp(other, "i").test(m[1])) return false;
    return true;
  }

  function firstUnknownAxis(task, cf) {
    cf = cf || {};
    if (cf.x && !cf.y) return "y";
    if (cf.y && !cf.x) return "x";
    if (task && task.twinY && !task.twinX) return "y";
    if (task && task.twinX && !task.twinY) return "x";
    var miss = String((task && task.missing) || "x").toLowerCase();
    if (miss === "y" || miss === "x") return miss;
    return "x";
  }

  function normEqText(s) {
    return String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/(\d)[·×](\d)/g, "$1*$2")
      .replace(/[·×]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  function parseSlopeCoeffToken(s) {
    var tok = String(s || "").replace(/[−–—]/g, "-");
    if (tok === "" || tok === "+") return 1;
    if (tok === "-") return -1;
    if (tok.charAt(0) === "-" && tok.length > 1) {
      var inner = parseSlopeCoeffToken(tok.slice(1));
      return inner == null ? null : -inner;
    }
    var parenFrac = tok.match(/^\((-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\)$/);
    if (parenFrac) {
      var pn = parseFloat(parenFrac[1], 10);
      var pd = parseFloat(parenFrac[2], 10);
      if (isFinite(pn) && isFinite(pd) && !near0(pd)) return pn / pd;
    }
    var bare = parseNumberToken(tok);
    return bare != null ? bare : null;
  }

  function foldMixedNumbersInEq(s) {
    return String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/(-?\d+)\s+(\d+)\s*\/\s*(\d+)/g, function (_, w, n, d) {
        var sign = Number(w) < 0 ? -1 : 1;
        var abs = Math.abs(parseInt(w, 10));
        var den = parseInt(d, 10);
        if (!den) return _;
        return String(sign * (abs * den + parseInt(n, 10))) + "/" + d;
      });
  }

  function parseSlopeInterceptText(s) {
    var t = normEqText(foldMixedNumbersInEq(s));
    var m = t.match(
      /^y=(-?(?:\(\d+(?:\.\d+)?\/\d+(?:\.\d+)?\)|\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)?)x([+-]\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)?$/
    );
    var horiz = t.match(/^y=([+\-]?\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)$/);
    if (horiz) {
      var hb = parseNumberToken(horiz[1]);
      if (hb != null && isFinite(hb)) return { m: 0, b: hb };
    }
    if (m) {
      var slope = parseSlopeCoeffToken(m[1]);
      var inter = m[2] != null ? parseNumberToken(m[2]) : 0;
      if (slope != null && inter != null && isFinite(slope) && isFinite(inter)) return { m: slope, b: inter };
    }
    m = t.match(/^y=([+-]?\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)-x([+-]\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)?$/);
    if (m) {
      var inter2 = parseNumberToken(m[1]);
      var tail = m[2] != null ? parseNumberToken(m[2]) : 0;
      if (inter2 != null && tail != null && isFinite(inter2) && isFinite(tail)) return { m: -1, b: inter2 + tail };
    }
    m = t.match(/^y=([+-]?\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)-(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)x([+-]\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)?$/);
    if (m) {
      var bLead = parseNumberToken(m[1]);
      var mAbs = parseNumberToken(m[2]);
      var tail2 = m[3] != null ? parseNumberToken(m[3]) : 0;
      if (bLead != null && mAbs != null && tail2 != null && isFinite(bLead) && isFinite(mAbs) && isFinite(tail2)) {
        return { m: -mAbs, b: bLead + tail2 };
      }
    }
    return null;
  }

  function sameSlopeIntercept(typed, line) {
    var got = parseSlopeInterceptText(typed);
    var L = parseLineSpec(line);
    if (!got || !L || L.vertical != null) return false;
    return nearNum(got.m, L.m) && nearNum(got.b, L.b);
  }

  function lineEqDisplayFromText(typed, rawLine) {
    var got = parseSlopeInterceptText(typed);
    if (got) {
      var L = { m: got.m, b: got.b };
      if (rawLine && rawLine.mn != null && rawLine.md) {
        var spec = parseLineSpec(rawLine);
        if (spec && nearNum(got.m, spec.m) && nearNum(got.b, spec.b)) {
          L.mn = rawLine.mn;
          L.md = rawLine.md;
        }
      }
      return slopeInterceptStandard(L);
    }
    return normalizeFracCoeffEqText(String(typed || ""));
  }

  function normalizeFracCoeffEqText(text) {
    var s = String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
    s = s.replace(
      /(^|[=+\-−]\s*)(-?\d+\/\d+)([xyXY])/g,
      function (_all, pre, frac, v) {
        return pre + "(" + frac.replace(/-/g, "−") + ")" + v;
      }
    );
    return s.replace(/-/g, "−");
  }

  function activeLine(pack, progress) {
    var part = currentPartText(pack, progress);
    return (part && part.line) || (pack && pack.line) || null;
  }

  function lineForPointTask(pack, progress, task) {
    if (task && task.noLine) return null;
    var route = progress && progress.pointRoute && task && progress.pointRoute[task.id];
    if (route && route.lineKey) {
      var routedEntry = intersectLineEntry(pack, route.lineKey);
      if (routedEntry && lineItemRevealed(progress, routedEntry)) return routedEntry.line;
    }
    if (task && task.line) return task.line;
    if (task && (task.intercept === "y" || task.intercept === "x")) {
      var pref = preferredInterceptLine(pack, task, progress);
      if (pref && pref.line) return pref.line;
    }
    if (task && task.lineKey && pack && pack.lines && pack.lines.length) {
      return intersectLineRaw(pack, task.lineKey);
    }
    if (task && task.line) return task.line;
    var fromPart = lineForTask(pack, task && task.id);
    if (fromPart) return fromPart;
    return activeLine(pack, progress);
  }

  function lineForTask(pack, taskId) {
    var task = (pack.tasks || []).filter(function (t) {
      return t.id === taskId;
    })[0];
    if (task && task.line) return task.line;
    if (task && task.lineKey && pack && pack.lines && pack.lines.length) {
      var keyed = intersectLineRaw(pack, task.lineKey);
      if (keyed) return keyed;
    }
    var found = null;
    (pack.parts || []).some(function (p) {
      if ((p.taskIds || []).indexOf(taskId) >= 0) {
        found = p.line || null;
        return true;
      }
      return false;
    });
    return found || (pack && pack.line) || null;
  }

  function lineMbSourceLine(pack, progress, task) {
    if (task && task.line) return task.line;
    if (task && task.id) {
      var fromTask = lineForTask(pack, task.id);
      if (fromTask) return fromTask;
    }
    return activeLine(pack, progress) || (pack && pack.line) || null;
  }

  function graphLineSpec(pack, progress) {
    var raw = activeLine(pack, progress);
    if (!raw) return null;
    var showEq = true;
    if (pack && pack.hideLineEq && !(progress && progress.lineEqDisplay)) showEq = false;
    var g = Object.assign(parseLineSpec(raw), { showEq: showEq, _raw: raw });
    if (raw && raw.dashed) g.graphClass = "coord-line coord-line-b is-dashed";
    if (pack.hideLineEq && progress && progress.lineEqDisplay) g.eqText = progress.lineEqDisplay;
    else if (raw.eqText) g.eqText = raw.eqText;
    return g;
  }

  function extraLineGraphs(pack, progress) {
    var part = currentPartText(pack, progress);
    var extras =
      part && part.extraLines && part.extraLines.length
        ? part.extraLines
        : (pack && pack.extraLines) || [];
    return extras
      .map(function (raw) {
        var parsed = parseLineSpec(raw);
        if (!parsed) return null;
        var hide = !!raw.hideEq;
        var revealed =
          hide &&
          progress &&
          progress.lineEqDisplay &&
          sameSlopeIntercept(progress.lineEqDisplay, raw);
        var g = Object.assign(parsed, {
          showEq: !hide || !!revealed,
          _raw: raw,
          graphClass: raw.dashed ? "coord-line coord-line-b is-dashed" : "coord-line coord-line-b",
        });
        if (hide && revealed) g.eqText = progress.lineEqDisplay;
        else if (raw.eqText) g.eqText = raw.eqText;
        else g.eqText = sortedLineEq(raw);
        return g;
      })
      .filter(Boolean);
  }

  function looksLikeNoIntercept(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (!t) return false;
    if (/^(אין|לא)$/.test(t)) return true;
    return /אין/.test(t) && /(חיתוך|נקודה|פתרון)/.test(t);
  }

  function evalArithLoose(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/[·×]/g, "*")
      .replace(/\s+/g, "")
      .replace(/[()]/g, "");
    var v = evalStepExpr(t);
    if (v != null) return v;
    var mFrac = t.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\*(-?\d+(?:\.\d+)?)(?:\+(-?\d+(?:\.\d+)?)|-(\d+(?:\.\d+)?))?$/);
    if (mFrac) {
      var q = parseFloat(mFrac[1], 10) / parseFloat(mFrac[2], 10);
      var p = q * parseFloat(mFrac[3], 10);
      if (mFrac[4] != null) p += parseFloat(mFrac[4], 10);
      else if (mFrac[5] != null) p -= parseFloat(mFrac[5], 10);
      if (isFinite(p)) return p;
    }
    var A = global.DoctematicaAlgebra;
    if (!A || typeof A.parseEquation !== "function") return null;
    try {
      var eq = A.parseEquation(t + "=0");
      if (eq && near0(eq.left.a) && near0(eq.right.a)) return eq.left.b;
    } catch (e) {}
    return null;
  }

  function coordsLookSwapped(px, py, task) {
    if (!task || task.answerX == null || task.answerY == null) return false;
    if (nearNum(px, task.answerX) && nearNum(py, task.answerY)) return false;
    return nearNum(px, task.answerY) && nearNum(py, task.answerX);
  }

  function swappedCoordsMessage(task, px, py, pack) {
    var lab = String((task && (task.point || task.label)) || "").toUpperCase();
    var want = formatPointPair(task.answerX, task.answerY);
    if (task.intercept === "x" && nearNum(task.answerY, 0)) {
      return (
        "נראה שהחלפתם בין x ל-y. בנקודת חיתוך עם ציר x כותבים (x;0) — קודם את x שמצאתם, ו-y = 0. " +
        lab +
        " = " +
        want +
        "."
      );
    }
    if (task.intercept === "y" && nearNum(task.answerX, 0)) {
      return (
        "נראה שהחלפתם בין x ל-y. בנקודת חיתוך עם ציר y כותבים (0;y) — קודם x = 0, ואז את y שמצאתם. " +
        lab +
        " = " +
        want +
        "."
      );
    }
    if (pack && pack.line) {
      return (
        "נראה שהחלפתם בין x ל-y. ב-(x;y) כותבים קודם x ואז y — " +
        lab +
        " צריכה להיות " +
        want +
        "."
      );
    }
    return (
      "נראה שהחלפתם בין x ל-y. ב-(x;y) כותבים קודם x ואז y — " +
      lab +
      " צריכה להיות " +
      want +
      "."
    );
  }

  function pointPairMismatchMessage(task, px, py, pack) {
    var lab = String((task && (task.point || task.label)) || "").toUpperCase();
    if (task && coordsLookSwapped(px, py, task)) {
      return swappedCoordsMessage(task, px, py, pack);
    }
    if (pack && lineForTask(pack, task && task.id)) {
      var L = parseLineSpec(lineForTask(pack, task && task.id));
      var miss = task ? String(task.missing || "").toLowerCase() : "";
      if (miss === "y") {
        return (
          "השיעורים של " +
          lab +
          " עדיין לא מדויקים. יודעים x — הציבו במשוואת הישר " +
          prettyLineEq(L) +
          " וחשבו את y."
        );
      }
      if (miss === "x") {
        return (
          "השיעורים של " +
          lab +
          " עדיין לא מדויקים. יודעים y — הציבו במשוואת הישר " +
          prettyLineEq(L) +
          " ופתרו משוואה בנעלם אחד עבור x."
        );
      }
      return "השיעורים עדיין לא מדויקים. הציבו במשוואת הישר " + prettyLineEq(L) + ".";
    }
    if (!task) {
      return "השיעורים עדיין לא מדויקים. זכרו: מקביל לציר y → אותו x; מקביל לציר x → אותו y.";
    }
    var xOk = nearNum(px, task.answerX);
    var yOk = nearNum(py, task.answerY);
    if (xOk && !yOk) {
      return (
        "ה-x של " +
        lab +
        " נכון, אבל ה-y עדיין לא מדויק. זכרו: מקביל לציר x → אותו y (למשל כמו " +
        String(task.twinY || "נקודה על אותו קו אופקי").toUpperCase() +
        ")."
      );
    }
    if (!xOk && yOk) {
      return (
        "ה-y של " +
        lab +
        " נכון, אבל ה-x עדיין לא מדויק. זכרו: מקביל לציר y → אותו x (למשל כמו " +
        String(task.twinX || "נקודה על אותו קו אנכי").toUpperCase() +
        ")."
      );
    }
    return (
      "שני השיעורים של " +
      lab +
      " עדיין לא מדויקים. זכרו: מקביל לציר y → אותו x; מקביל לציר x → אותו y."
    );
  }

  function pointTaskForPairMismatch(candidates, parsed) {
    if (!candidates.length || !parsed || !parsed.point) return null;
    var tagged = null;
    var partial = null;
    var pi;
    if (parsed.tag) {
      for (pi = 0; pi < candidates.length; pi++) {
        if (taskMatchesTag(candidates[pi], parsed.tag)) tagged = candidates[pi];
      }
    }
    for (pi = 0; pi < candidates.length; pi++) {
      var t = candidates[pi];
      if (coordsLookSwapped(parsed.point.x, parsed.point.y, t)) return t;
      var xOk = nearNum(parsed.point.x, t.answerX);
      var yOk = nearNum(parsed.point.y, t.answerY);
      if (xOk !== yOk) partial = t;
    }
    return tagged || partial || candidates[0];
  }

  function bigMinusSmall(u, v) {
    var hi = Math.max(u, v);
    var lo = Math.min(u, v);
    return { hi: hi, lo: lo, diff: hi - lo };
  }

  function formatLo(n) {
    return n < 0 ? "(" + fmtNum(n) + ")" : fmtNum(n);
  }

  function areaShape(task) {
    if (!task) return "triangle";
    if (task.shape === "rect" || task.shape === "rectangle") return "rect";
    if ((task.verts || []).length === 4) return "rect";
    return "triangle";
  }

  function areaMark(task) {
    return areaShape(task) === "rect" ? "□" : "△";
  }

  function areaFigureWord(task) {
    return areaShape(task) === "rect" ? "מלבן" : "משולש";
  }

  function areaFormulaHint(task) {
    if (areaShape(task) === "rect") return "שטח מלבן: אורך×רוחב.";
    var body = canonicalAreaBody(task);
    if (body) return "שטח משולש: " + body + ".";
    return "שטח משולש: (בסיס×גובה)/2.";
  }

  function areaUsesSumCanonical(task) {
    return !!(task && task.sum && task.sum.parts && task.sum.parts.length >= 2 && !task.sum.optional);
  }

  function canonicalSumAreaBody(task) {
    if (!task || !task.sum || !task.sum.parts || task.sum.parts.length < 2) return "";
    return task.sum.parts
      .map(function (p) {
        return areaTriangleName(p);
      })
      .join("+");
  }

  function canonicalAreaBody(task, map) {
    if (!task || task.kind !== "area") return "";
    if (areaUsesSumCanonical(task)) {
      return task.sum.parts
        .map(function (p) {
          return areaTriangleName(p);
        })
        .join("+");
    }
    if (task.diff && task.diff.plus && task.diff.minus) {
      return areaTriangleName(task.diff.plus) + "−" + areaTriangleName(task.diff.minus);
    }
    var legs = task.legs || [];
    if (legs.length >= 2) {
      var a = String(legs[0][0] || "").toUpperCase() + String(legs[0][1] || "").toUpperCase();
      var b = String(legs[1][0] || "").toUpperCase() + String(legs[1][1] || "").toUpperCase();
      if (areaShape(task) === "rect") return a + "×" + b;
      return "(" + a + "×" + b + ")/2";
    }
    return "";
  }

  /** שרשרת פתרון מלאה: אותיות → מספרים → מכפלת מונה → חילוק */
  function canonicalAreaChain(task, map) {
    if (!task || task.kind !== "area") return "";
    var label = task.label || "S";
    if (areaUsesSumCanonical(task)) {
      var sumLetters = task.sum.parts
        .map(function (p) {
          return areaTriangleName(p);
        })
        .join("+");
      var sumParts = task.sum.parts.map(function (p) {
        return triangleArea(map, p);
      });
      if (sumParts.some(function (v) { return v == null || !isFinite(v); })) {
        return sumLetters ? label + "=" + sumLetters + "=" + fmtNum(task.answer) : label + "=" + fmtNum(task.answer);
      }
      return [label, sumLetters, sumParts.map(function (v) { return fmtNum(v); }).join("+"), fmtNum(task.answer)].join("=");
    }
    if (task.diff && task.diff.plus && task.diff.minus) {
      var p = triangleArea(map, task.diff.plus);
      var m = triangleArea(map, task.diff.minus);
      if (p == null || m == null || !isFinite(p) || !isFinite(m)) {
        return letters ? label + "=" + letters + "=" + fmtNum(task.answer) : label + "=" + fmtNum(task.answer);
      }
      return [label, letters, fmtNum(p) + "−" + fmtNum(m), fmtNum(task.answer)].join("=");
    }
    var legs = task.legs || [];
    if (legs.length < 2) {
      return label + "=" + fmtNum(task.answer);
    }
    var n1 = String(legs[0][0] || "").toUpperCase() + String(legs[0][1] || "").toUpperCase();
    var n2 = String(legs[1][0] || "").toUpperCase() + String(legs[1][1] || "").toUpperCase();
    var l1 = legLength(map, legs[0][0], legs[0][1]);
    var l2 = legLength(map, legs[1][0], legs[1][1]);
    if (l1 == null || l2 == null || !isFinite(l1) || !isFinite(l2)) {
      var body = canonicalAreaBody(task, map);
      return body ? label + "=" + body + "=" + fmtNum(task.answer) : label + "=" + fmtNum(task.answer);
    }
    var prod = l1 * l2;
    if (areaShape(task) === "rect") {
      var rLetters = n1 + "×" + n2;
      var rNums = fmtNum(l1) + "×" + fmtNum(l2);
      var rParts = [label, rLetters, rNums];
      if (!isAreaSimplifiedFinal(rNums, task.answer)) rParts.push(fmtNum(task.answer));
      return rParts.join("=");
    }
    var letters = "(" + n1 + "×" + n2 + ")/2";
    var nums = "(" + fmtNum(l1) + "×" + fmtNum(l2) + ")/2";
    var mid = fmtNum(prod) + "/2";
    var parts = [label, letters, nums];
    // 28/2 → ואז 14; 15/2 → ביניים, ואז 7.5
    if (isAreaSimplifiedFinal(mid, task.answer)) {
      parts.push(mid);
    } else {
      parts.push(mid);
      parts.push(fmtNum(task.answer));
    }
    return parts.join("=");
  }

  /** צעדי פתרון מצטברים להצגה בהיסטוריה */
  function canonicalAreaSteps(task, map) {
    var chain = canonicalAreaChain(task, map);
    if (!chain) return [];
    var bits = chain.split("=");
    if (bits.length <= 1) return [chain];
    var out = [];
    var acc = bits[0];
    var i;
    for (i = 1; i < bits.length; i++) {
      acc += "=" + bits[i];
      out.push(acc);
    }
    return out;
  }

  /** שלבי RHS בלבד: אותיות, הצבה, מכפלת מונה, תוצאה */
  function areaStageBits(task, map) {
    var chain = canonicalAreaChain(task, map);
    if (!chain) return [];
    return chain.split("=").slice(1);
  }

  function countMatchedAreaStages(prevExpr, bits) {
    if (!prevExpr || !bits || !bits.length) return 0;
    var prevParts = String(prevExpr).split("=");
    var matched = 0;
    var i;
    for (i = 0; i < bits.length && i < prevParts.length; i++) {
      if (areaStageTokenKey(prevParts[i]) !== areaStageTokenKey(bits[i])) break;
      matched += 1;
    }
    var best = matched;
    var p;
    for (p = 0; p < prevParts.length; p++) {
      var key = areaStageTokenKey(prevParts[p]);
      if (!key) continue;
      for (i = 0; i < bits.length; i++) {
        if (areaStageTokenKey(bits[i]) === key && i + 1 > best) best = i + 1;
      }
    }
    return best;
  }

  function nextAreaStageBit(task, map, progress) {
    var bits = areaStageBits(task, map);
    if (!bits.length) return fmtNum(task.answer);
    var prev = (progress && progress.lastExpr && progress.lastExpr[task.id]) || "";
    var matched = countMatchedAreaStages(prev, bits);
    if (lastAreaTokenLooksNumeric(prev) && matched < 2 && bits.length > 1) {
      matched = 2;
    }
    if (matched >= bits.length) return fmtNum(task.answer);
    return bits[matched];
  }

  function areaStageMessage(bit, task, map) {
    var bits = areaStageBits(task, map);
    var idx = -1;
    var i;
    for (i = 0; i < bits.length; i++) {
      if (prettyAreaExpr(bits[i]) === prettyAreaExpr(bit)) {
        idx = i;
        break;
      }
    }
    if (areaUsesSumCanonical(task)) {
      if (idx === 0) return "רשמו את השטח כסכום של שני שטחים שכבר מצאתם (למשל " + canonicalAreaBody(task) + ").";
      if (idx === 1) return "הציבו את שני המספרים וחברו.";
      return "חשבו את החיבור ורשמו את התוצאה הסופית.";
    }
    if (task.sum && task.sum.optional && idx === 0) {
      return "רשמו את נוסחת השטח עם האותיות (הצלעות). אפשר גם " + canonicalSumAreaBody(task) + ".";
    }
    if (task.diff) {
      if (idx === 0) return "רשמו את השטח כהפרש בין שני השטחים שכבר מצאתם (למשל " + canonicalAreaBody(task) + ").";
      if (idx === 1) return "הציבו את שני המספרים: גדול פחות קטן.";
      return "חשבו את החיסור ורשמו את התוצאה הסופית.";
    }
    if (idx === 0) return "רשמו את נוסחת השטח עם האותיות (הצלעות).";
    if (idx === 1) return "הציבו את אורכי הצלעות במקום האותיות.";
    if (areaShape(task) === "rect") {
      return "חשבו את המכפלה ורשמו את התוצאה הסופית.";
    }
    if (idx === 2 && bits.length > 3) return "חשבו את מכפלת המונה, ואז השאירו חילוק במכנה.";
    if (idx === bits.length - 1 || prettyAreaExpr(bit) === prettyAreaExpr(fmtNum(task.answer))) {
      return "חשבו את החילוק ורשמו את התוצאה הסופית.";
    }
    return "המשיכו את חישוב השטח בשלב הבא.";
  }

  function canonicalStep(task, map) {
    if (!task) return "";
    if (task.kind === "midpoint") {
      return midpointPairText(task);
    }
    if (task.kind === "point") {
      return task.label + " = " + pointTaskLabel(task);
    }
    if (task.kind === "slope" || task.kind === "lineMb") {
      return task.label + " = " + fmtNum(task.answer);
    }
    if (task.kind === "lineEq") {
      return lineEqFinalText(task);
    }
    if (task.kind === "distance") {
      var wantS = task.exact || distExactFromPoints(getPoint(map, task.from), getPoint(map, task.to));
      return distLhs(task) + " = " + fmtRad(wantS);
    }
    if (task.kind === "equalLen") return distEqualShow(task);
    if (task.kind === "lineIntersect") {
      return task.label + " = " + formatPointPair(task.answerX, task.answerY);
    }
    if (task.kind === "area") {
      return canonicalAreaChain(task, map);
    }
    var body = canonicalDiffBody(task, map);
    if (!body) return task.label + " = " + fmtNum(task.answer);
    return task.label + ": " + body + " = " + fmtNum(task.answer);
  }

  function canonicalDiffBody(task, map) {
    if (!task) return "";
    if (task.kind === "origin") {
      if (task.timesLen && task.timesLen.factor != null) {
        var srcLab = task.timesLen.origin || task.timesLen.point;
        var srcPt = getPoint(map, srcLab);
        var srcLen = distOrigin(srcPt);
        if (srcLen != null && isFinite(srcLen)) {
          return fmtNum(task.timesLen.factor) + " · " + fmtNum(srcLen);
        }
      }
      var p = getPoint(map, task.point);
      if (!p) return "";
      if (near0(p.y)) {
        var ox = bigMinusSmall(p.x, 0);
        return fmtNum(ox.hi) + " − " + formatLo(ox.lo);
      }
      if (near0(p.x)) {
        var oy = bigMinusSmall(p.y, 0);
        return fmtNum(oy.hi) + " − " + formatLo(oy.lo);
      }
      return "";
    }
    if (task.kind === "axis") {
      if (task.heightFoot) {
        var hfA = getPoint(map, task.point);
        var hfB = getPoint(map, task.heightFoot);
        if (!hfA || !hfB) return "";
        if (nearNum(hfA.y, hfB.y)) {
          var hfx = bigMinusSmall(hfA.x, hfB.x);
          return fmtNum(hfx.hi) + " − " + formatLo(hfx.lo);
        }
        if (nearNum(hfA.x, hfB.x)) {
          var hfy = bigMinusSmall(hfA.y, hfB.y);
          return fmtNum(hfy.hi) + " − " + formatLo(hfy.lo);
        }
      }
      var q = getPoint(map, task.point);
      if (!q) return "";
      // מרחק מציר x = |y|; מציר y = |x| — כותבים גדול פחות קטן מול 0
      if ((task.axis || "x") === "x") {
        var dx = bigMinusSmall(q.y, 0);
        return fmtNum(dx.hi) + " − " + formatLo(dx.lo);
      }
      var dy = bigMinusSmall(q.x, 0);
      return fmtNum(dy.hi) + " − " + formatLo(dy.lo);
    }
    if (task.kind === "segment") {
      var a = task._fromPt || getPoint(map, task.from);
      var b = task._toPt || getPoint(map, task.to);
      if (!a || !b) return "";
      if (nearNum(a.y, b.y)) {
        var sx = bigMinusSmall(a.x, b.x);
        return fmtNum(sx.hi) + " − " + formatLo(sx.lo);
      }
      if (nearNum(a.x, b.x)) {
        var sy = bigMinusSmall(a.y, b.y);
        return fmtNum(sy.hi) + " − " + formatLo(sy.lo);
      }
    }
    if (task.kind === "distSeg") {
      var dp = getPoint(map, task.point);
      var da = task._fromPt || getPoint(map, task.from);
      var db = task._toPt || getPoint(map, task.to);
      if (!dp || !da || !db) return "";
      if (nearNum(da.x, db.x)) {
        var dx = bigMinusSmall(dp.x, da.x);
        return fmtNum(dx.hi) + " − " + formatLo(dx.lo);
      }
      if (nearNum(da.y, db.y)) {
        var dy = bigMinusSmall(dp.y, da.y);
        return fmtNum(dy.hi) + " − " + formatLo(dy.lo);
      }
    }
    return "";
  }

  function lastDiffStage(expr) {
    var parts = String(expr || "").split("=");
    return String(parts[parts.length - 1] || "").trim();
  }

  function appendDiffExpr(prev, nextPretty) {
    var n = String(nextPretty || "").trim();
    if (!n) return String(prev || "");
    if (!prev) return n;
    var p = String(prev);
    if (lastDiffStage(p) === n) return p;
    return p + " = " + n;
  }

  function simplifiedDiffBody(body) {
    if (!body) return null;
    var s = lastDiffStage(body);
    var m = s.match(/^(.+?) [−-] \((.+)\)$/);
    if (!m) return null;
    var lo = parseFloat(String(m[2]).replace(/[−–—]/g, "-"), 10);
    if (!isFinite(lo) || lo >= 0) return null;
    return m[1] + " + " + fmtNum(-lo);
  }

  function fromAreaUnknownNames(task) {
    var fa = task && task.fromArea ? task.fromArea : {};
    var a;
    var b;
    if (fa.unknown && fa.unknown.length >= 2) {
      a = String(fa.unknown[0] || "").toUpperCase();
      b = String(fa.unknown[1] || "").toUpperCase();
    } else if (task && task.kind === "origin") {
      a = "O";
      b = String(task.point || "").toUpperCase();
    } else {
      a = String((task && task.from) || "").toUpperCase();
      b = String((task && task.to) || "").toUpperCase();
    }
    var names = [a + b, b + a].filter(function (n) {
      return n.length >= 2;
    });
    var lab = String((task && task.label) || "").replace(/△/g, "").trim();
    if (lab && /^[A-Za-z]{1,2}$/.test(lab) && names.indexOf(lab) < 0 && names.indexOf(lab.toUpperCase()) < 0) {
      names.push(lab);
      names.push(lab.toUpperCase());
    }
    return names;
  }

  function fromAreaKnownLeg(task, pack) {
    var fa = task && task.fromArea ? task.fromArea : {};
    var unk = fromAreaUnknownNames(task);
    var legs = fa.legs || [];
    var i;
    for (i = 0; i < legs.length; i++) {
      var n = String(legs[i][0] || "").toUpperCase() + String(legs[i][1] || "").toUpperCase();
      var rev = String(legs[i][1] || "").toUpperCase() + String(legs[i][0] || "").toUpperCase();
      if (unk.indexOf(n) >= 0 || unk.indexOf(rev) >= 0) continue;
      var len = legLength(pack && pack.map, legs[i][0], legs[i][1]);
      if (len == null || !isFinite(len)) continue;
      return { name: n, rev: rev, len: len };
    }
    return null;
  }

  function fromAreaLetterBody(task) {
    var fa = task && task.fromArea ? task.fromArea : {};
    return canonicalAreaBody({
      kind: "area",
      verts: fa.verts,
      legs: fa.legs,
    });
  }

  function fromAreaUnknownLetter(task) {
    var lab = String((task && task.label) || "").trim();
    if (lab && /^[A-Za-z]$/.test(lab)) return lab;
    return fromAreaUnknownNames(task)[0];
  }

  function fromAreaPlugEq(task, pack, useX) {
    var fa = task.fromArea || {};
    var known = fromAreaKnownLeg(task, pack);
    var unk = useX ? "x" : fromAreaUnknownLetter(task);
    if (!known) return fmtNum(fa.value) + "=" + unk;
    return fmtNum(fa.value) + "=(" + unk + "×" + fmtNum(known.len) + ")/2";
  }

  function fromAreaCanonicalSteps(task, pack) {
    var fa = task.fromArea || {};
    var label = fa.label || areaTriangleName(fa.verts);
    var letters = fromAreaLetterBody(task);
    var unk = fromAreaUnknownLetter(task);
    var out = [];
    if (letters) out.push(label + "=" + letters);
    out.push(fromAreaPlugEq(task, pack, false));
    var eqX = fromAreaPlugEq(task, pack, true).replace(/×/g, "*");
    var guard = 0;
    while (guard++ < 10) {
      var nxt = teachLinearNext(eqX);
      if (!nxt || !nxt.eq) break;
      var shown = xEqBackToUnknown(nxt.eq, unk);
      if (out[out.length - 1] === shown) break;
      out.push(shown);
      eqX = String(nxt.eq).replace(/×/g, "*");
      if (/^\s*x\s*=\s*-?[\d.]/i.test(String(nxt.eq).replace(/\s+/g, ""))) break;
    }
    var last = out[out.length - 1] || "";
    if (!new RegExp("^" + unk + "=" + fmtNum(task.answer) + "$", "i").test(last.replace(/\s+/g, ""))) {
      out.push(unk + "=" + fmtNum(task.answer));
    }
    return out;
  }

  function fromAreaToXEq(s, task, pack) {
    var t = normalizeZeroAsO(String(s || ""))
      .replace(/[−–—]/g, "-")
      .replace(/×|·/g, "*")
      .replace(/\s+/g, "");
    t = t.replace(/^S(?:△|Δ)?[A-Z]{3}(?:=|:)/i, "");
    var known = fromAreaKnownLeg(task, pack);
    if (known) {
      t = t.replace(new RegExp(known.name, "gi"), fmtNum(known.len));
      t = t.replace(new RegExp(known.rev, "gi"), fmtNum(known.len));
    }
    fromAreaUnknownNames(task).forEach(function (n) {
      t = t.replace(new RegExp(n, "gi"), "x");
    });
    return t;
  }

  function fromAreaHasLetterKnown(s, task, pack) {
    var t = normalizeZeroAsO(prettyAreaExpr(s));
    var known = fromAreaKnownLeg(task, pack);
    if (!known) return false;
    return new RegExp(known.name, "i").test(t) || new RegExp(known.rev, "i").test(t);
  }

  function fromAreaHasUnknownLetter(s, task) {
    var t = normalizeZeroAsO(prettyAreaExpr(s));
    return fromAreaUnknownNames(task).some(function (n) {
      return new RegExp(n, "i").test(t);
    });
  }

  function fromAreaHasX(s) {
    var t = String(s || "").replace(/×/g, "*");
    return /(^|[^A-Za-z])x([^A-Za-z]|$)/i.test(t);
  }

  function fromAreaLooksLikeFormula(s, task, pack) {
    var t = prettyAreaExpr(s);
    if (!/\//.test(t) && !/÷/.test(t)) return false;
    return fromAreaHasUnknownLetter(s, task) && fromAreaHasLetterKnown(s, task, pack);
  }

  function fromAreaLooksLikeAttempt(s, task, pack) {
    var t = String(s || "");
    if (fromAreaLooksLikeFormula(s, task, pack)) return true;
    if (fromAreaHasUnknownLetter(s, task) || fromAreaHasX(s)) return true;
    if (/^S(?:△|Δ)?[A-Z]{3}/i.test(prettyAreaExpr(t)) && task.fromArea) return true;
    return false;
  }

  function xEqBackToUnknown(eq, unkName) {
    return String(eq || "").replace(/\bx\b/gi, unkName);
  }

  function pendingFromAreaTasks(pending, pack, progress) {
    return preferPartTasks(
      (pending || []).filter(function (t) {
        return t && t.fromArea && (t.kind === "segment" || t.kind === "origin");
      }),
      pack,
      progress
    );
  }

  function finishFromAreaLen(task, show, doneMap, partialMap, coordsMap, pack, progress) {
    var nextDone = {};
    Object.keys(doneMap).forEach(function (k) {
      nextDone[k] = true;
    });
    nextDone[task.id] = true;
    var nextPartial = {};
    Object.keys(partialMap).forEach(function (k) {
      if (k !== task.id) nextPartial[k] = true;
    });
    var nextExpr = {};
    Object.keys((progress && progress.lastExpr) || {}).forEach(function (k) {
      if (k !== task.id) nextExpr[k] = progress.lastExpr[k];
    });
    var left = remainingRequired(pack, nextDone);
    return {
      ok: true,
      solved: left.length === 0,
      done: nextDone,
      partial: nextPartial,
      coords: coordsMap,
      lastExpr: nextExpr,
      task: task,
      show: show || task.label + "=" + fmtNum(task.answer),
      message: left.length ? "נכון. המשיכו לסעיף הבא." : "כל החלקים נפתרו.",
    };
  }

  function partialFromArea(task, show, msg, doneMap, partialMap, coordsMap, progress) {
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.partial[task.id] = true;
    maps.lastExpr[task.id] = show;
    return {
      ok: true,
      solved: false,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      task: task,
      show: show,
      rawStep: true,
      message: msg,
    };
  }

  function checkSegFromArea(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var tasks = pendingFromAreaTasks(pending, pack, progress);
    if (!tasks.length) return null;
    var task = tasks[0];
    if (parsed && parsed.kind === "point") return null;
    var raw = String(typed || "").trim();
    if (!raw) return null;

    if (
      parsed &&
      parsed.value != null &&
      isFinite(parsed.value) &&
      nearNum(parsed.value, task.answer) &&
      (parsed.kind === "final" || parsed.kind === "full") &&
      !fromAreaLooksLikeAttempt(raw, task, pack)
    ) {
      var tagOk = !parsed.tag || taskMatchesTag(task, parsed.tag);
      if (tagOk) {
        return finishFromAreaLen(
          task,
          task.label + "=" + fmtNum(task.answer),
          doneMap,
          partialMap,
          coordsMap,
          pack,
          progress
        );
      }
    }

    if (!fromAreaLooksLikeAttempt(raw, task, pack) && !(parsed && parsed.tag && taskMatchesTag(task, parsed.tag))) {
      return null;
    }

    var pretty = prettyAreaExpr(raw);
    var unk = fromAreaUnknownNames(task)[0];
    var known = fromAreaKnownLeg(task, pack);
    var fa = task.fromArea || {};
    var xEq = fromAreaToXEq(raw, task, pack);
    var Algebra = global.DoctematicaAlgebra;

    var iso = String(xEq || "").match(/^x=(.+)$/i) || String(xEq || "").match(/^(.+)=x$/i);
    if (iso) {
      var isoV = parseNumberToken(iso[1]) || evalArithExpr(iso[1]);
      if (isoV != null && nearNum(isoV, task.answer)) {
        var isoShow = fromAreaHasX(raw) ? pretty : unk + "=" + fmtNum(task.answer);
        return finishFromAreaLen(task, isoShow, doneMap, partialMap, coordsMap, pack, progress);
      }
    }

    if (fromAreaLooksLikeFormula(raw, task, pack)) {
      var formShow = pretty.indexOf("=") >= 0 ? pretty : (fa.label || "S") + "=" + pretty;
      return partialFromArea(
        task,
        formShow,
        "נכון. עכשיו הציבו את השטח " +
          fmtNum(fa.value) +
          " ואת " +
          (known ? known.name + "=" + fmtNum(known.len) : "הצלע הידועה") +
          ", והשאירו את " +
          unk +
          " כנעלם (אפשר גם x).",
        doneMap,
        partialMap,
        coordsMap,
        progress
      );
    }

    function isolatedXValue(eq) {
      var bits = String(eq || "").split("=");
      if (bits.length < 2) return null;
      var L = bits[0];
      var R = bits[bits.length - 1];
      if (/^x$/i.test(L)) return parseNumberToken(R) || evalArithExpr(R);
      if (/^x$/i.test(R)) return parseNumberToken(L) || evalArithExpr(L);
      return null;
    }
    function showFromAreaEq() {
      if (fromAreaHasX(raw) && !fromAreaHasUnknownLetter(raw, task)) return pretty;
      return pretty;
    }
    function acceptPlugOrSolve(res, fallbackMsg) {
      if (!res) return null;
      if (res.same || res.ok) {
        var solN = isolatedXValue(xEq);
        if ((res.solved || solN != null) && solN != null && nearNum(solN, task.answer)) {
          return finishFromAreaLen(task, pretty, doneMap, partialMap, coordsMap, pack, progress);
        }
        if (res.ok || res.same) {
          return partialFromArea(
            task,
            showFromAreaEq(),
            res.same
              ? "נכון. פתרו את המשוואה — הנעלם הוא " + unk + " (אפשר גם x)."
              : res.message || fallbackMsg,
            doneMap,
            partialMap,
            coordsMap,
            progress
          );
        }
      }
      return null;
    }

    var prev = progress.lastExpr && progress.lastExpr[task.id];
    var plugCanon = fromAreaPlugEq(task, pack, true).replace(/×/g, "*");
    var hasEq = /=/.test(xEq);
    if (hasEq && Algebra && typeof Algebra.checkStep === "function") {
      var prevX = prev ? fromAreaToXEq(prev, task, pack) : plugCanon;
      if (!/=/.test(String(prevX))) prevX = plugCanon;
      var accepted = null;
      try {
        accepted = acceptPlugOrSolve(
          Algebra.checkStep(prevX, xEq),
          "צעד חוקי. המשיכו לבודד את " + unk + " (או x)."
        );
      } catch (e) {}
      if (accepted) return accepted;
      if (!prev || fromAreaLooksLikeFormula(prev, task, pack)) {
        try {
          accepted = acceptPlugOrSolve(
            Algebra.checkStep(plugCanon, xEq),
            "נכון. פתרו את המשוואה — הנעלם הוא " + unk + " (אפשר גם x)."
          );
        } catch (e2) {}
        if (accepted) return accepted;
      }
    }

    if (parsed && parsed.value != null && nearNum(parsed.value, task.answer) && taskMatchesTag(task, parsed.tag)) {
      return finishFromAreaLen(
        task,
        task.label + "=" + fmtNum(task.answer),
        doneMap,
        partialMap,
        coordsMap,
        pack,
        progress
      );
    }

    return {
      ok: false,
      message:
        "רשמו את נוסחת השטח " +
        (fa.label || "S") +
        "=" +
        (fromAreaLetterBody(task) || "(צלע×צלע)/2") +
        ", או הציבו ישר " +
        fromAreaPlugEq(task, pack, false) +
        ". הנעלם הוא " +
        unk +
        " (אפשר גם x).",
    };
  }

  /** שרשרת פתרון בשורה אחת: גדול פחות קטן = פישוט = תוצאה */
  function canonicalDiffChain(task, map) {
    if (task && task.fromArea) {
      var stepsFa = fromAreaCanonicalSteps(task, { map: map });
      return stepsFa.length ? stepsFa.join(" → ") : task.label + "=" + fmtNum(task.answer);
    }
    var label = task.label || "";
    var body = canonicalDiffBody(task, map);
    if (!body) return canonicalStep(task, map);
    var simp = simplifiedDiffBody(body);
    if (simp) {
      return label + ": " + body + " = " + simp + " = " + fmtNum(task.answer);
    }
    return label + ": " + body + " = " + fmtNum(task.answer);
  }

  /** צעדי פתרון מצטברים (לשימוש פנימי / תואמות לאחור) */
  function canonicalDiffSteps(task, map) {
    var chain = canonicalDiffChain(task, map);
    return chain ? [chain] : [];
  }

  function labeledDiff(task, map) {
    var body = canonicalDiffBody(task, map);
    if (!body) return task.label + " = " + fmtNum(task.answer);
    return task.label + ": " + body;
  }

  function originSegmentName(point) {
    var p = String(point || "").toUpperCase();
    return p ? "O" + p : "";
  }

  function axisDistanceName(point, axis) {
    var p = String(point || "").toUpperCase();
    var ax = String(axis || "x").toLowerCase() === "y" ? "y" : "x";
    return p ? p + "→" + ax : "";
  }

  function isDrawOnlyPointLabel(ex, label) {
    var key = String(label || "").toUpperCase();
    return !!(ex.points || []).some(function (p) {
      return String(p.label || "").toUpperCase() === key && !!p.drawOnly;
    });
  }

  /** רגל גובה לציר — כשיש drawHeight, מעדיפים שם קטע (HJ) על פני H→y */
  function heightFootLabelFromEx(ex, axisTask) {
    if (!ex || !axisTask || axisTask.kind !== "axis" || !axisTask.drawHeight || !axisTask.point) {
      return null;
    }
    var apex = String(axisTask.point).toUpperCase();
    var heights = (ex.draw && ex.draw.heights) || [];
    var i;
    for (i = 0; i < heights.length; i++) {
      var h = heights[i];
      if (h && String(h.from || "").toUpperCase() === apex && h.footLabel) {
        return String(h.footLabel).toUpperCase();
      }
    }
    var foot = null;
    (ex.tasks || []).forEach(function (at) {
      if (at.kind !== "area" || !at.legs) return;
      (at.legs || []).forEach(function (leg) {
        if (!leg || leg.length < 2) return;
        if (isDrawOnlyPointLabel(ex, leg[0]) && String(leg[1] || "").toUpperCase() === apex) {
          foot = String(leg[0]).toUpperCase();
        } else if (isDrawOnlyPointLabel(ex, leg[1]) && String(leg[0] || "").toUpperCase() === apex) {
          foot = String(leg[1]).toUpperCase();
        }
      });
    });
    return foot;
  }

  function heightSegmentName(apex, foot) {
    return String(apex || "").toUpperCase() + String(foot || "").toUpperCase();
  }

  function distPointToSegName(point, from, to) {
    return (
      String(point || "").toUpperCase() +
      "→" +
      String(from || "").toUpperCase() +
      String(to || "").toUpperCase()
    );
  }

  function distPointToSegment(p, a, b) {
    if (!p || !a || !b) return null;
    if (nearNum(a.x, b.x)) return Math.abs(p.x - a.x);
    if (nearNum(a.y, b.y)) return Math.abs(p.y - a.y);
    return null;
  }

  function footOnAxisSeg(p, a, b) {
    if (!p || !a || !b) return null;
    if (nearNum(a.x, b.x)) return { x: a.x, y: p.y, label: "" };
    if (nearNum(a.y, b.y)) return { x: p.x, y: a.y, label: "" };
    return null;
  }

  function areaTriangleName(verts, shape) {
    var v = (verts || []).map(function (x) {
      return String(x || "").toUpperCase();
    });
    var mark = shape === "rect" ? "□" : "△";
    return v.length ? "S" + mark + v.join("") : "S";
  }

  function sameCyclicVerts(a, b) {
    var A = (a || [])
      .map(function (x) {
        return String(x || "").toUpperCase();
      })
      .join("");
    var B = (b || [])
      .map(function (x) {
        return String(x || "").toUpperCase();
      })
      .join("");
    if (!A || A.length !== B.length) return false;
    if (A.length === 3) {
      var rot = [A, A[1] + A[2] + A[0], A[2] + A[0] + A[1]];
      var rev = A.split("").reverse().join("");
      var rotR = [rev, rev[1] + rev[2] + rev[0], rev[2] + rev[0] + rev[1]];
      return rot.indexOf(B) >= 0 || rotR.indexOf(B) >= 0;
    }
    return (A + A).indexOf(B) >= 0 || (B && (A.split("").reverse().join("") + A.split("").reverse().join("")).indexOf(B) >= 0);
  }

  function sameTriangleVerts(a, b) {
    return sameCyclicVerts(a, b);
  }

  function areaOfNamedTriangle(letters, map, pack) {
    var verts = String(letters || "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .split("");
    if (verts.length !== 3 && verts.length !== 4) return null;
    if (pack && pack.tasks) {
      var hit = (pack.tasks || []).filter(function (t) {
        return t.kind === "area" && sameCyclicVerts(t.verts, verts);
      })[0];
      if (hit && hit.answer != null && isFinite(hit.answer)) return hit.answer;
    }
    if (verts.length === 4) return rectangleArea(map, verts);
    return triangleArea(map, verts);
  }

  function expandAreaNamesInExpr(expr, map, pack) {
    var t = String(expr || "").replace(/\s+/g, "");
    return t.replace(
      /S(?:△|Δ|□|▭)?([A-Za-z]{3,4})|(?:△|Δ|□|▭)([A-Za-z]{3,4})/gi,
      function (full, a, b) {
        var letters = a || b;
        var v = areaOfNamedTriangle(letters, map, pack);
        if (v == null || !isFinite(v)) return full;
        return "(" + String(v) + ")";
      }
    );
  }

  function legLength(map, a, b) {
    var pa = getPoint(map, a);
    var pb = getPoint(map, b);
    if (pa && pb) return segmentLength(pa, pb);
    if (String(a).toUpperCase() === "O") return distOrigin(getPoint(map, b));
    if (String(b).toUpperCase() === "O") return distOrigin(getPoint(map, a));
    return null;
  }

  function knownLegNames(map) {
    var labels = Object.keys(map || {});
    if (labels.indexOf("O") < 0) labels = labels.concat(["O"]);
    var names = [];
    var i;
    var j;
    for (i = 0; i < labels.length; i++) {
      for (j = 0; j < labels.length; j++) {
        if (i === j) continue;
        var len = legLength(map, labels[i], labels[j]);
        if (len != null && isFinite(len)) names.push({ name: labels[i] + labels[j], len: len });
      }
    }
    names.sort(function (u, v) {
      return v.name.length - u.name.length;
    });
    return names;
  }

  function normalizeZeroAsO(expr) {
    return String(expr || "")
      .replace(/([A-Za-z])0/g, "$1O")
      .replace(/0([A-Za-z])/g, "O$1");
  }

  function expandLegsInExpr(expr, map) {
    var t = normalizeZeroAsO(expr)
      .replace(/[−–—]/g, "-")
      .replace(/×|·/g, "*")
      .replace(/÷/g, "/")
      .replace(/\s+/g, "");
    knownLegNames(map).forEach(function (item) {
      t = t.replace(new RegExp(item.name, "gi"), String(item.len));
    });
    return t;
  }

  function triangleArea(map, verts) {
    var pts = (verts || []).map(function (v) {
      return getPoint(map, v);
    });
    if (pts.length !== 3 || pts.some(function (p) { return !p; })) return null;
    var a = pts[0];
    var b = pts[1];
    var c = pts[2];
    return Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2;
  }

  function rectangleArea(map, verts) {
    var pts = (verts || []).map(function (v) {
      return getPoint(map, v);
    });
    if (pts.length !== 4 || pts.some(function (p) { return !p; })) {
      if (pts.length === 2 && pts[0] && pts[1]) {
        return Math.abs(pts[0].x - pts[1].x) * Math.abs(pts[0].y - pts[1].y);
      }
      var xs = pts.filter(Boolean).map(function (p) { return p.x; });
      var ys = pts.filter(Boolean).map(function (p) { return p.y; });
      if (xs.length < 2 || ys.length < 2) return null;
      return (Math.max.apply(null, xs) - Math.min.apply(null, xs)) *
        (Math.max.apply(null, ys) - Math.min.apply(null, ys));
    }
    var xs4 = pts.map(function (p) { return p.x; });
    var ys4 = pts.map(function (p) { return p.y; });
    return (Math.max.apply(null, xs4) - Math.min.apply(null, xs4)) *
      (Math.max.apply(null, ys4) - Math.min.apply(null, ys4));
  }

  /** BO / OB / AOB — אותיות גדולות; x,y,m,b נשארים משתנים. */
  function capsHistoryLetters(s) {
    return String(s || "").replace(/[A-Za-z]+/g, function (w, offset, whole) {
      var next = String(whole || "").charAt(offset + w.length);
      if (/^[xy]$/i.test(w)) return w.toLowerCase();
      if (/^b$/i.test(w)) return "b";
      if (/^m$/i.test(w) && next !== "(") return "m";
      if (/^d$/i.test(w) && next !== "(") return "d";
      if (/^m\d+$/i.test(w)) return "m" + w.slice(1);
      if (/^m(?:III|II|I)$/i.test(w)) return "m" + w.slice(1).toUpperCase();
      if (/^m[A-Za-z]{2,4}$/i.test(w)) return "m" + w.slice(1).toUpperCase();
      if (/^d[A-Za-z]{2,4}$/i.test(w)) return "d" + w.slice(1).toUpperCase();
      return w.toUpperCase();
    });
  }

  function prettyAreaExpr(rhs) {
    return capsHistoryLetters(
      normalizeZeroAsO(String(rhs || ""))
        .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
        .replace(/[−–—]/g, "−")
        .replace(/Δ/g, "△")
        .replace(/▭/g, "□")
        .replace(/[·•∗✕✖]/g, "×")
        .replace(/\*/g, "×")
        .replace(/\s+/g, "")
    );
  }

  /** (4×2)/2, (4×2)/(2), 4×2/2 ו־(2×4)/2 — אותו שלב */
  function areaStageTokenKey(s) {
    var t = prettyAreaExpr(s);
    t = t.replace(/\/\((-?\d+(?:\.\d+)?)\)/g, "/$1");
    t = t.replace(/\((-?\d+(?:\.\d+)?)\)/g, "$1");
    var m =
      t.match(/^\(([^()/]+)×([^()/]+)\)\/(-?\d+(?:\.\d+)?)$/) ||
      t.match(/^([^()/]+)×([^()/]+)\/(-?\d+(?:\.\d+)?)$/);
    if (m) {
      var a = m[1];
      var b = m[2];
      var d = m[3];
      if (a > b) {
        var tmp = a;
        a = b;
        b = tmp;
      }
      return "(" + a + "×" + b + ")/" + d;
    }
    return t;
  }

  function lastAreaTokenLooksNumeric(prevExpr) {
    var last = String(prevExpr || "").split("=").pop();
    var t = prettyAreaExpr(last);
    if (!t) return false;
    if (/[A-Za-z]/.test(t.replace(/S[△Δ□▭]/g, ""))) return false;
    return /\d/.test(t) && (/[×/]/.test(t) || /^-?\d+(?:\.\d+)?$/.test(t));
  }

  /** (4×2)/2 ו־(2×4)/2 ו־4×2/2 נחשבים אותו שלב */
  function areaStageTokenKey(s) {
    var t = prettyAreaExpr(s);
    var m =
      t.match(/^\(([^()/]+)×([^()/]+)\)\/2$/) ||
      t.match(/^([^()/]+)×([^()/]+)\/2$/);
    if (m) {
      var a = m[1];
      var b = m[2];
      if (a > b) {
        var tmp = a;
        a = b;
        b = tmp;
      }
      return "(" + a + "×" + b + ")/2";
    }
    return t;
  }

  function gcdInt(a, b) {
    a = Math.abs(a | 0);
    b = Math.abs(b | 0);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  /**
   * תוצאה סופית לשטח: מספר שלם, עשרוני סופי (עד 3 ספרות), או שבר מצומצם אם אין ייצוג עשרוני קצר.
   * 18/2 → ביניים; 9 → סופי; 15/2 → ביניים (מצפים ל-7.5); 1/3 → סופי.
   */
  function isAreaSimplifiedFinal(token, answer) {
    var t = String(token || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(",", ".");
    if (!t || !isBareNumberExpr(t)) return false;
    var v = parseNumberToken(t);
    if (v == null || answer == null || !nearNum(v, answer)) return false;
    var frac = t.match(/^(-?\d+)\/(-?\d+)$/);
    if (frac) {
      var n = parseInt(frac[1], 10);
      var d = parseInt(frac[2], 10);
      if (!d) return false;
      if (nearNum(answer, Math.round(answer))) return false;
      var A = global.DoctematicaAlgebra;
      if (A && A.terminatingDecimalPlaces && A.terminatingDecimalPlaces(answer, 3) != null) {
        return false;
      }
      return gcdInt(n, d) === 1;
    }
    return true;
  }

  function areaRhsIsComplete(rhs, answer) {
    var parts = String(rhs || "").split("=");
    if (!parts.length) return false;
    return isAreaSimplifiedFinal(parts[parts.length - 1], answer);
  }

  function appendAreaExpr(prev, nextPretty) {
    var n = String(nextPretty || "");
    if (!n) return String(prev || "");
    if (!prev) return n;
    var p = String(prev);
    var last = p.split("=").pop();
    if (areaStageTokenKey(last) === areaStageTokenKey(n)) return p;
    return p + "=" + n;
  }

  function partialAreaTask(ahit, prettyRhs, doneMap, partialMap, coordsMap, pack, progress) {
    var nextDone = {};
    Object.keys(doneMap).forEach(function (k) {
      nextDone[k] = true;
    });
    var nextPartial = {};
    Object.keys(partialMap).forEach(function (k) {
      nextPartial[k] = true;
    });
    nextPartial[ahit.id] = true;
    var prevExpr = (progress.lastExpr && progress.lastExpr[ahit.id]) || "";
    var display = appendAreaExpr(prevExpr, prettyRhs);
    var nextExpr = {};
    Object.keys(progress.lastExpr || {}).forEach(function (k) {
      nextExpr[k] = progress.lastExpr[k];
    });
    nextExpr[ahit.id] = display;
    return {
      ok: true,
      solved: false,
      done: nextDone,
      partial: nextPartial,
      coords: coordsMap,
      lastExpr: nextExpr,
      task: ahit,
      show: ahit.label + "=" + display,
      message: "נכון. זה שלב ביניים — המשיכו לחשב עד לתוצאה הסופית של " + ahit.label + ".",
    };
  }

  function finishAreaTask(ahit, prettyRhs, rawRhs, doneMap, partialMap, coordsMap, pack, progress) {
    var areaDone = {};
    Object.keys(doneMap).forEach(function (k) {
      areaDone[k] = true;
    });
    areaDone[ahit.id] = true;
    // אחרי שטח נכון — אורכים מומלצים (optional) נסגרים אוטומטית
    markOptionalDone(pack, areaDone, ahit);
    var areaPartial = {};
    Object.keys(partialMap).forEach(function (k) {
      if (k !== ahit.id && !areaDone[k]) areaPartial[k] = true;
    });
    var areaLeft = remainingRequired(pack, areaDone);
    var prev = (progress.lastExpr && progress.lastExpr[ahit.id]) || "";
    var incoming = prettyRhs ? prettyAreaExpr(prettyRhs) : "";
    var exprPart;
    if (incoming && areaRhsIsComplete(incoming, ahit.answer)) {
      // שרשרת מלאה או מספר סופי מצומצם
      if (incoming.indexOf("=") < 0 && prev) {
        exprPart = appendAreaExpr(prev, incoming);
      } else {
        exprPart = incoming;
      }
    } else {
      var base = prev || incoming || canonicalAreaBody(ahit, pack.map) || "";
      exprPart = appendAreaExpr(base, fmtNum(ahit.answer));
    }
    var areaShow = canonicalAreaChain(ahit, pack.map) ||
      (exprPart ? ahit.label + "=" + exprPart : canonicalStep(ahit, pack.map));
    var nextExpr = {};
    Object.keys(progress.lastExpr || {}).forEach(function (k) {
      if (k !== ahit.id) nextExpr[k] = progress.lastExpr[k];
    });
    return {
      ok: true,
      solved: areaLeft.length === 0,
      done: areaDone,
      partial: areaPartial,
      coords: coordsMap,
      lastExpr: nextExpr,
      task: ahit,
      show: areaShow,
      message: areaLeft.length ? "נכון. המשיכו לסעיף הבא." : "כל החלקים נפתרו.",
    };
  }

  function evalArithExpr(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/×|·/g, "*")
      .replace(/÷/g, "/")
      .replace(/\s+/g, "");
    if (!t || !/^[\d.+*/()-]+$/.test(t)) return null;
    try {
      var v = Function('"use strict"; return (' + t + ");")();
      return typeof v === "number" && isFinite(v) ? v : null;
    } catch (e) {
      return null;
    }
  }

  function evalGeoAreaRhs(rhs, map, pack) {
    var parts = String(rhs || "").split("=");
    var lastVal = null;
    var i;
    for (i = 0; i < parts.length; i++) {
      var expanded = expandLegsInExpr(expandAreaNamesInExpr(parts[i], map, pack), map);
      var v = evalArithExpr(expanded);
      if (v == null) return null;
      if (lastVal != null && !nearNum(lastVal, v)) return null;
      lastVal = v;
    }
    return lastVal;
  }

  function normAreaTag(tag) {
    return String(tag || "")
      .toUpperCase()
      .replace(/△|Δ/g, "")
      .replace(/^S/, "")
      .replace(/[^A-Z]/g, "");
  }

  function normGeoTag(tag) {
    return String(tag || "")
      .toUpperCase()
      .replace(/→/g, "")
      .replace(/->/g, "")
      .replace(/-/g, "")
      .replace(/\s+/g, "");
  }

  function inferParallelGivenLabel(ex, task) {
    if (!task || !task.parallel) return "";
    if (task.givenLabel) return slopeTagNorm(task.givenLabel);
    var wantId = task.id;
    var parts = (ex && ex.parts) || [];
    var i;
    for (i = 0; i < parts.length; i++) {
      var ids = parts[i].taskIds || [];
      if (wantId && ids.indexOf(wantId) < 0) continue;
      var text = String(parts[i].text || "");
      var m = text.match(/מקביל לישר\s+([A-Za-z]{1,4}|III|II|I)\b/i);
      if (m) return slopeTagNorm(m[1]);
    }
    var wantM = task.m != null && isFinite(task.m) ? Number(task.m) : null;
    var lines = (ex && ex.lines) || [];
    var named = [];
    for (i = 0; i < lines.length; i++) {
      var item = lines[i];
      if (!item || !item.line || item.line.hideEq) continue;
      var L = parseLineSpec(item.line);
      if (!L || wantM == null || !nearNum(L.m, wantM)) continue;
      var lab = slopeTagNorm(item.label || item.key);
      if (lab) named.push(lab);
    }
    if (named.length === 1) return named[0];
    return "";
  }

  function buildTasks(ex) {
    var map = pointMap(ex.points);
    var tasks = [];
    (ex.tasks || []).forEach(function (t) {
      var answer = t.answer;
      if (answer == null && t.kind === "origin") {
        answer = distOrigin(getPoint(map, t.point));
      }
      if (answer == null && t.kind === "segment") {
        answer = segmentLength(getPoint(map, t.from), getPoint(map, t.to));
      }
      if (answer == null && t.kind === "axis") {
        var axisFoot = heightFootLabelFromEx(ex, t);
        if (axisFoot) {
          answer = segmentLength(getPoint(map, t.point), getPoint(map, axisFoot));
        } else {
          answer = distAxis(getPoint(map, t.point), t.axis || "x");
        }
      }
      if (answer == null && t.kind === "distSeg") {
        answer = distPointToSegment(
          getPoint(map, t.point),
          getPoint(map, t.from),
          getPoint(map, t.to)
        );
      }
      if (answer == null && t.kind === "distance") {
        var dAns = distExactFromPoints(getPoint(map, t.from), getPoint(map, t.to));
        if (dAns) {
          t.exact = dAns;
          answer = radToFloat(dAns);
        }
      }
      if (answer == null && t.kind === "area") {
        var divisor = areaShape(t) === "rect" ? 1 : 2;
        if (t.legs && t.legs.length >= 2) {
          var l1 = legLength(map, t.legs[0][0], t.legs[0][1]);
          var l2 = legLength(map, t.legs[1][0], t.legs[1][1]);
          if (l1 != null && l2 != null) answer = (l1 * l2) / divisor;
        }
        if (answer == null) {
          answer =
            areaShape(t) === "rect" ? rectangleArea(map, t.verts) : triangleArea(map, t.verts);
        }
      }
      if (answer == null && t.kind === "slope") {
        if (t.parallel && t.m != null && isFinite(t.m)) {
          answer = Number(t.m);
        } else if (t.perpendicular) {
          if (t.m != null && isFinite(t.m)) answer = Number(t.m);
          else if (t.givenM != null && isFinite(t.givenM) && !near0(t.givenM)) {
            answer = -1 / Number(t.givenM);
          }
        } else {
          var sa = getPoint(map, t.from || "A");
          var sb = getPoint(map, t.to || "B");
          if (sa && sb && !nearNum(sa.x, sb.x)) answer = (sb.y - sa.y) / (sb.x - sa.x);
        }
      }
      if (answer == null && t.kind === "lineMb") {
        var lv = lineMbValues(t.line || ex.line);
        if (lv) answer = String(t.param || "m").toLowerCase() === "b" ? lv.b : lv.m;
      }
      var answerX = t.answerX;
      var answerY = t.answerY;
      if ((answerX == null || answerY == null) && t.kind === "lineIntersect") {
        var isect = intersectSolveLines(ex.lines);
        if (isect) {
          if (answerX == null) answerX = isect.x;
          if (answerY == null) answerY = isect.y;
        }
      }
      if (t.kind === "point" || t.kind === "onLine") {
        var tp = getPoint(map, t.point);
        if (answerX == null && t.x != null) answerX = t.x;
        if (answerY == null && t.y != null) answerY = t.y;
        if (answerX == null && tp) answerX = tp.x;
        if (answerY == null && tp) answerY = tp.y;
        answer = null;
      }
      if (t.kind === "freePoint") {
        answer = null;
      }
      var id = t.id;
      var label = t.label;
      if (t.kind === "origin") {
        var oname = originSegmentName(t.point);
        if (!id || /^[A-Za-z]$/.test(String(id))) id = oname;
        if (!label || /^[A-Za-z]$/.test(String(label))) label = oname;
      }
      var heightFoot = null;
      if (t.kind === "axis") {
        heightFoot = heightFootLabelFromEx(ex, t);
        var aname = heightFoot
          ? heightSegmentName(t.point, heightFoot)
          : axisDistanceName(t.point, t.axis || "x");
        var ax = String(t.axis || "x").toLowerCase() === "y" ? "y" : "x";
        if (!id) id = String(t.point || "").toUpperCase() + "-" + ax;
        if (!label) label = aname;
      }
      if (t.kind === "point") {
        var pname = String(t.point || "").toUpperCase();
        if (!id) id = pname;
        if (!label) label = pname;
      }
      if (t.kind === "midpoint") {
        if (t.mid) {
          var known0 = getPoint(map, t.from);
          var md0 = getPoint(map, t.mid);
          var on0 = String(t.onAxis || "").toLowerCase();
          if (known0 && md0) {
            if (answerX == null) answerX = 2 * md0.x - known0.x;
            if (answerY == null) answerY = 2 * md0.y - known0.y;
          } else if (md0 && on0) {
            if (on0 === "y") {
              if (answerX == null) answerX = 0;
              if (answerY == null) answerY = 2 * md0.y;
            } else if (on0 === "x") {
              if (answerY == null) answerY = 0;
              if (answerX == null) answerX = 2 * md0.x;
            }
          }
          var selfPt = getPoint(map, t.point);
          if (selfPt) {
            if (answerX == null) answerX = selfPt.x;
            if (answerY == null) answerY = selfPt.y;
          }
        } else {
          var mp = getPoint(map, t.from);
          var mq = getPoint(map, t.to);
          if (mp && mq) {
            if (answerX == null) answerX = (mp.x + mq.x) / 2;
            if (answerY == null) answerY = (mp.y + mq.y) / 2;
          }
        }
        var mname = String(t.point || t.label || "M").toUpperCase();
        if (!id) id = mname;
        if (!label) label = mname;
      }
      if (t.kind === "slope") {
        if (!id) id = "m";
        if (!label) label = t.parallel ? String(t.label || "II") : "m";
      }
      if (t.kind === "parallel") {
        if (!id) id = "par";
        if (!label) label = "מקבילים";
      }
      if (t.kind === "perpendicular") {
        if (!id) id = "perp";
        if (!label) label = "מאונכים";
      }
      if (t.kind === "lineEq") {
        if (!id) id = "eq";
        if (!label) label = "ישר";
        if ((t.x == null || t.y == null) && t.point) {
          var gpEq = getPoint(map, t.point);
          if (gpEq) {
            if (t.x == null) t.x = gpEq.x;
            if (t.y == null) t.y = gpEq.y;
          }
        }
        if (
          !t.axisParallel &&
          ex.line &&
          !(ex.extraLines && ex.extraLines.length) &&
          !(ex.parts || []).some(function (p) {
            return p.extraLines && p.extraLines.length;
          })
        ) {
          if (t.mn == null && ex.line.mn != null) t.mn = ex.line.mn;
          if (t.md == null && ex.line.md != null) t.md = ex.line.md;
          if (t.m == null && ex.line.m != null) t.m = ex.line.m;
          else if (t.m == null && ex.line.mn != null && ex.line.md) t.m = ex.line.mn / ex.line.md;
        }
      }
      if (t.kind === "onLine" || t.kind === "freePoint") {
        var pname2 = String(t.point || t.label || "").toUpperCase();
        if (!id) id = pname2 || "P";
        if (!label) label = t.label || pname2 || id;
      }
      if (t.kind === "lineIntersect") {
        var pname3 = String(t.point || t.label || "P").toUpperCase();
        if (!id) id = pname3;
        if (!label) label = pname3;
      }
      if (t.kind === "lineMatch") {
        if (!id) id = "eq" + (t.eqNum != null ? t.eqNum : tasks.length + 1);
        if (!label) label = t.eqNum != null ? "(" + t.eqNum + ")" : id;
      }
      if (t.kind === "noIntercept") {
        var nax = String(t.axis || "x").toLowerCase() === "y" ? "y" : "x";
        if (!id) id = "no-" + nax;
        if (!label) label = "ציר " + nax;
      }
      if (t.kind === "distSeg") {
        var dname = distPointToSegName(t.point, t.from, t.to);
        if (!id) {
          id =
            String(t.point || "").toUpperCase() +
            String(t.from || "").toUpperCase() +
            String(t.to || "").toUpperCase();
        }
        if (!label) label = dname;
      }
      if (t.kind === "area") {
        var aname2 = areaTriangleName(t.verts, areaShape(t));
        if (!id) id = "S" + (t.verts || []).map(function (v) { return String(v || "").toUpperCase(); }).join("");
        if (!label) label = aname2;
      }
      if (!id && (t.kind === "segment" || t.kind === "distance")) id = String(t.from || "") + String(t.to || "");
      if (t.kind === "equalLen") {
        if (!id) id = "eqLen";
        if (!label) label = (t.segs && t.segs.length >= 2 ? t.segs[0] + "=" + t.segs[1] : "AB=BC");
      }
      if (!label) label = id;
      tasks.push({
        id: id,
        kind: t.kind,
        point: t.point,
        from: t.from,
        to: t.to,
        axis: t.axis,
        verts: t.verts,
        legs: t.legs,
        missing: t.missing,
        completeWhen: t.completeWhen || null,
        intercept: t.intercept || null,
        twin: t.twin,
        twinX: t.twinX,
        twinY: t.twinY,
        answer: answer,
        answerX: answerX,
        answerY: answerY,
        label: label,
        optional: !!t.optional,
        outsideBase: !!t.outsideBase,
        diff: t.diff || null,
        sum: t.sum || null,
        reason: t.reason || null,
        reasonRequired: !!t.reasonRequired,
        parallel: !!t.parallel,
        perpendicular: !!t.perpendicular,
        m1: t.m1 != null ? t.m1 : null,
        m2: t.m2 != null ? t.m2 : null,
        givenLabel: t.givenLabel || inferParallelGivenLabel(ex, t) || null,
        slopeIds: t.slopeIds || null,
        givenM: t.givenM != null ? t.givenM : null,
        param: t.param || null,
        askYesNo: !!t.askYesNo,
        on: t.on,
        shape: t.shape || null,
        line: t.line || null,
        lineKey: t.lineKey || null,
        eqText: t.eqText || null,
        eqNum: t.eqNum != null ? t.eqNum : null,
        answerKey: t.answerKey != null ? t.answerKey : null,
        drawHeight: !!t.drawHeight,
        heightFoot: heightFoot || null,
        fromArea: t.fromArea || null,
        x: t.x != null ? t.x : null,
        y: t.y != null ? t.y : null,
        mid: t.mid || null,
        onAxis: t.onAxis || null,
        otherAxis: t.otherAxis || null,
        m: t.m != null ? t.m : null,
        mn: t.mn != null ? t.mn : null,
        md: t.md != null ? t.md : null,
        axisParallel: t.axisParallel || null,
        axisPerp: t.axisPerp || null,
        vertical: t.vertical != null ? t.vertical : null,
        b: t.b != null ? t.b : null,
        givenEq: t.givenEq || null,
        question: t.question || null,
        onLine: t.onLine || null,
        proveBisect: !!t.proveBisect,
        plugB: !!t.plugB,
        timesLen: t.timesLen || null,
        noLine: !!t.noLine,
        subFrom: t.subFrom || null,
        subTo: t.subTo || null,
        segs: t.segs || null,
        exact: t.exact || null,
      });
    });
    return tasks;
  }

  function isRequiredTask(t) {
    return !!(t && !t.optional);
  }

  function remainingRequired(pack, doneMap) {
    return (pack.tasks || []).filter(function (t) {
      return isRequiredTask(t) && !(doneMap && doneMap[t.id]);
    });
  }

  function optionalIsAreaLeg(t, area) {
    if (!t || !area || t.kind !== "segment") return false;
    var a = String(t.from || "").toUpperCase();
    var b = String(t.to || "").toUpperCase();
    return (area.legs || []).some(function (leg) {
      if (!leg || leg.length < 2) return false;
      var x = String(leg[0] || "").toUpperCase();
      var y = String(leg[1] || "").toUpperCase();
      return (a === x && b === y) || (a === y && b === x);
    });
  }

  function markOptionalDone(pack, doneMap, aroundTask) {
    var ids = null;
    if (aroundTask) {
      (pack.parts || []).forEach(function (p) {
        if ((p.taskIds || []).indexOf(aroundTask.id) >= 0) ids = p.taskIds;
      });
    }
    (pack.tasks || []).forEach(function (t) {
      if (!t.optional) return;
      if (ids && ids.indexOf(t.id) < 0) return;
      if (aroundTask && aroundTask.kind === "area" && !optionalIsAreaLeg(t, aroundTask)) return;
      doneMap[t.id] = true;
    });
  }

  function analyzeStart(ex) {
    function normalizePoint(p) {
      return {
        label: p.label,
        x: Number(p.x),
        y: Number(p.y),
        hideX: !!p.hideX,
        hideY: !!p.hideY,
        drawOnly: !!p.drawOnly,
      };
    }
    var points = (ex.points || []).map(normalizePoint);
    if (!points.length && ex.parts) {
      (ex.parts || []).forEach(function (part) {
        (part.points || []).forEach(function (p) {
          var lab = String(p.label).toUpperCase();
          var exists = points.some(function (q) {
            return String(q.label).toUpperCase() === lab;
          });
          if (!exists) points.push(normalizePoint(p));
        });
      });
    }
    var map = pointMap(points);
    var line = normalizeExerciseLine(ex.line, ex.tasks);
    var tasks = buildTasks({
      points: points,
      tasks: ex.tasks,
      line: line || ex.line,
      lines: ex.lines,
      extraLines: ex.extraLines,
      parts: ex.parts,
    });
    var segments = [];
    if (ex.showSegments !== false) {
      segments = (ex.segments || []).slice();
      if (!segments.length) {
        tasks.forEach(function (t) {
          if (t.kind === "segment" || t.kind === "distance") segments.push({ from: t.from, to: t.to });
          if (t.kind === "origin" && t.point) {
            segments.push({ from: "O", to: String(t.point).toUpperCase() });
          }
          if (t.kind === "area" && t.verts && t.verts.length >= 2) {
            var vv = t.verts.map(function (v) {
              return String(v || "").toUpperCase();
            });
            for (var vi = 0; vi < vv.length; vi++) {
              segments.push({ from: vv[vi], to: vv[(vi + 1) % vv.length] });
            }
          }
        });
      }
    }
    var polygons = (ex.polygons || []).slice();
    var rightAngles = (ex.rightAngles || []).slice();
    // remapping part taskIds
    var idAlias = {};
    tasks.forEach(function (t) {
      if (t.kind === "origin" && t.point) {
        var p = String(t.point).toUpperCase();
        // לא לדרוס משימת נקודה B/C במזהה OB/OC
        if (!idAlias[p]) idAlias[p] = t.id;
        idAlias["O" + p] = t.id;
        idAlias[p + "O"] = t.id;
      }
      if (t.kind === "axis" && t.point) {
        var ap = String(t.point).toUpperCase();
        var aax = String(t.axis || "x").toLowerCase() === "y" ? "y" : "x";
        idAlias[ap + aax.toUpperCase()] = t.id;
        idAlias[ap + "-" + aax] = t.id;
        idAlias[ap + "→" + aax] = t.id;
        if (t.heightFoot) {
          var hseg = heightSegmentName(t.point, t.heightFoot);
          var hsegRev = heightSegmentName(t.heightFoot, t.point);
          idAlias[hseg] = t.id;
          idAlias[hsegRev] = t.id;
        }
        idAlias[t.id] = t.id;
      }
      if (t.kind === "point" && t.point) {
        idAlias[String(t.point).toUpperCase()] = t.id;
        idAlias[t.id] = t.id;
      }
      if ((t.kind === "onLine" || t.kind === "freePoint") && t.point) {
        var olp = String(t.point).toUpperCase();
        if (!idAlias[olp]) idAlias[olp] = t.id;
        idAlias[t.id] = t.id;
      }
      if (t.kind === "lineIntersect" && (t.point || t.label)) {
        var ilp = String(t.point || t.label).toUpperCase();
        if (!idAlias[ilp]) idAlias[ilp] = t.id;
        idAlias[t.id] = t.id;
      }
      if (t.kind === "area" && t.verts) {
        var av = t.verts.map(function (v) {
          return String(v || "").toUpperCase();
        }).join("");
        idAlias["S" + av] = t.id;
        idAlias[av] = t.id;
        idAlias[t.id] = t.id;
      }
    });
    var parts = (ex.parts || []).map(function (part) {
      var text = part.text;
      var givenEq =
        ex.line && lineMbNeedsUnsorted(ex.line) && ex.line.eqText
          ? ex.line.eqText
          : line && line.eqText;
      if (givenEq && text && /בציור מתואר הישר/.test(text) && !lineMbNeedsUnsorted(ex.line || line)) {
        text = text.replace(/(בציור מתואר הישר )[^.]+\./, "$1" + givenEq + ".");
      }
      return {
        label: part.label,
        text: text,
        taskIds: (part.taskIds || []).map(function (id) {
          var key = String(id);
          return idAlias[key] || idAlias[key.toUpperCase()] || id;
        }),
        points: (part.points || []).map(normalizePoint),
        segments: (part.segments || []).slice(),
        line: part.line || null,
        extraLines: part.extraLines || null,
        stepByTask: part.stepByTask === false ? false : part.stepByTask,
        untilCoord: part.untilCoord || null,
      };
    });
    if (!parts.length) {
      parts = [{ label: "", text: ex.prompt || "חשבו את האורכים.", taskIds: tasks.map(function (t) { return t.id; }) }];
    }
    var answerLines = tasks.map(function (t) {
      return canonicalStep(t, map);
    });
    // תיקון אורכי קטעים לפי נקודות של אותו חלק (כשיש אותן אותיות בשרטוטים שונים)
    parts.forEach(function (part) {
      var localMap = pointMap(part.points || []);
      (part.taskIds || []).forEach(function (tid) {
        var task = tasks.filter(function (t) {
          return t.id === tid;
        })[0];
        if (!task) return;
        if (task.kind === "midpoint") {
          if (task.mid) {
            var knownL = getPoint(localMap, task.from) || getPoint(map, task.from);
            var mdL = getPoint(localMap, task.mid) || getPoint(map, task.mid);
            if (knownL && mdL) {
              task.answerX = 2 * mdL.x - knownL.x;
              task.answerY = 2 * mdL.y - knownL.y;
            }
          } else {
            var ma = getPoint(localMap, task.from);
            var mb = getPoint(localMap, task.to);
            if (ma && mb) {
              task._fromPt = ma;
              task._toPt = mb;
              task.answerX = (ma.x + mb.x) / 2;
              task.answerY = (ma.y + mb.y) / 2;
            }
          }
        }
        if (task.kind === "segment" || task.kind === "distSeg" || task.kind === "distance") {
          var a = getPoint(localMap, task.from);
          var b = getPoint(localMap, task.to);
          if (a && b) {
            task._fromPt = a;
            task._toPt = b;
            if (task.kind === "segment") task.answer = segmentLength(a, b);
            if (task.kind === "distance") {
              task.exact = distExactFromPoints(a, b);
              task.answer = radToFloat(task.exact);
            }
            if (task.kind === "distSeg") {
              var dp = getPoint(localMap, task.point);
              if (dp) task.answer = distPointToSegment(dp, a, b);
            }
          }
        }
      });
    });
    answerLines = tasks.map(function (t) {
      return canonicalStep(t, map);
    });
    return {
      geo: true,
      points: points,
      map: map,
      segments: segments,
      polygons: polygons,
      rightAngles: rightAngles,
      tasks: tasks,
      parts: parts,
      axisGuides:
        ex.showAxisGuides === false
          ? []
          : tasks
              .filter(function (t) {
                return t.kind === "axis";
              })
              .map(function (t) {
                return { point: t.point, axis: t.axis || "x" };
              }),
      promptHtml: ex.promptHtml || null,
      steps: answerLines,
      answer: answerLines.join(", "),
      draw: ex.draw || null,
      line: line || ex.line || null,
      lines: ex.lines || null,
      extraLines: ex.extraLines || null,
      hideLineEq:
        ex.hideLineEq === false
          ? false
          : !!ex.hideLineEq ||
            ((!(ex.extraLines && ex.extraLines.length) &&
              !(ex.parts || []).some(function (p) {
                return p.extraLines && p.extraLines.length;
              }) &&
              (ex.tasks || []).some(function (t) {
                return t.kind === "lineMatch" || t.kind === "lineEq";
              })) ||
              false),
      showBoard: ex.showBoard !== false,
      givenArea: ex.givenArea || null,
      givenLengths: ex.givenLengths || null,
      givenText: ex.givenText || null,
      hideGiven: !!ex.hideGiven,
    };
  }

  function initDrawProgress(pack, progress) {
    progress = progress || {};
    var cfg = resolveDrawConfig(pack);
    if (!cfg) return { heights: [], auxPoints: [], pickMode: null, note: null };
    var GD = global.DoctematicaGeoDraw;
    if (!GD) return { heights: [], auxPoints: [], pickMode: null, note: null };
    if (progress.draw && Array.isArray(progress.draw.heights)) return progress.draw;
    return GD.initDrawState(cfg, pack.map);
  }

  function drawOnlyFootRevealed(label, pack, progress) {
    var key = String(label || "").toUpperCase();
    var fc = progress && progress.footCoords && progress.footCoords[key];
    if (fc && fc.x != null && fc.y != null) return true;
    var footTask = (pack.tasks || []).filter(function (t) {
      return t.kind === "point" && String(t.point || "").toUpperCase() === key;
    })[0];
    if (footTask && progress.done && progress.done[footTask.id]) return true;
    var axisDone = (pack.tasks || []).some(function (t) {
      return (
        t.kind === "axis" &&
        String(t.heightFoot || "").toUpperCase() === key &&
        progress.done &&
        progress.done[t.id]
      );
    });
    if (axisDone) return true;
    var GD = global.DoctematicaGeoDraw;
    if (GD && GD.revealedFootLabels && progress.draw) {
      return !!GD.revealedFootLabels(progress.draw)[key];
    }
    return false;
  }

  function heightFootSnapped(progress, label) {
    var key = String(label || "").toUpperCase();
    return (progress.draw && progress.draw.heights ? progress.draw.heights : []).some(function (h) {
      return h && h.snapped && String(h.footLabel || "").toUpperCase() === key;
    });
  }

  function drawHeightEnds(pack, task) {
    if (!task || !task.drawHeight) return null;
    if (task.kind === "axis") {
      return {
        apex: String(task.point || "").toUpperCase(),
        foot: String(task.heightFoot || "").toUpperCase(),
      };
    }
    var a = String(task.from || "").toUpperCase();
    var b = String(task.to || task.point || "").toUpperCase();
    if (isDrawFootPoint(pack, b)) return { apex: a, foot: b };
    if (isDrawFootPoint(pack, a)) return { apex: b, foot: a };
    return { apex: a, foot: b };
  }

  function siteAddHeight(pack, progress, task) {
    progress = progress || {};
    var ends = drawHeightEnds(pack, task);
    if (!ends || !ends.apex) return null;
    if (ends.foot && heightFootSnapped(progress, ends.foot)) return null;
    progress.draw = initDrawProgress(pack, progress);
    var GD = global.DoctematicaGeoDraw;
    var cfg = resolveDrawConfig(pack);
    if (!GD || !cfg || !GD.buildHeightFromVertex) return null;
    var item = GD.buildHeightFromVertex(cfg, pack.map, ends.apex);
    if (!item) return null;
    item.snapped = true;
    item.visible = true;
    if (ends.foot) item.footLabel = ends.foot;
    progress.draw.heights = (progress.draw.heights || []).filter(function (h) {
      return String(h.from || "").toUpperCase() !== ends.apex;
    });
    progress.draw.heights.push(item);
    progress.draw.note =
      "הגובה מ־" + ends.apex + " הורד" + (item.footLabel ? " — הרגל היא " + item.footLabel : "") + ".";
    return item;
  }

  function siteAddAllHeights(pack, progress) {
    progress = progress || {};
    (pack.tasks || []).forEach(function (t) {
      if (t.drawHeight) siteAddHeight(pack, progress, t);
    });
    return progress.draw;
  }

  function footPointReady(progress, label) {
    var key = String(label || "").toUpperCase();
    var fc = progress && progress.footCoords && progress.footCoords[key];
    return !!(fc && fc.x != null && fc.y != null);
  }

  function areaUsesFootLabel(pack, progress, label) {
    var key = String(label || "").toUpperCase();
    var pending = (pack.tasks || []).filter(function (t) {
      return t.kind === "area" && !(progress.done && progress.done[t.id]);
    });
    if (
      pending.some(function (t) {
        return (t.legs || []).some(function (leg) {
          return (
            leg &&
            (String(leg[0] || "").toUpperCase() === key || String(leg[1] || "").toUpperCase() === key)
          );
        });
      })
    ) {
      return true;
    }
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    return ids.some(function (id) {
      var t = (pack.tasks || []).filter(function (task) {
        return task.id === id;
      })[0];
      if (!t || !taskUsesDrawnHeight(t, pack)) return false;
      if (t.kind === "segment" || t.kind === "origin") {
        var a = t.kind === "origin" ? "O" : t.from;
        var b = t.kind === "origin" ? t.point : t.to;
        return (
          String(a || "").toUpperCase() === key || String(b || "").toUpperCase() === key
        );
      }
      if (t.kind === "point") {
        return String(t.point || t.label || "").toUpperCase() === key;
      }
      return isDrawFootLabel(pack, key);
    });
  }

  function expectedFootPoint(pack, label) {
    var p = getPoint(pack.map, label);
    if (!p) return null;
    return { x: p.x, y: p.y };
  }

  function isDrawFootLabel(pack, label) {
    var key = String(label || "").toUpperCase();
    var cfg = resolveDrawConfig(pack);
    if (
      (cfg && cfg.heights ? cfg.heights : []).some(function (h) {
        return String(h.footLabel || "").toUpperCase() === key;
      })
    ) {
      return true;
    }
    return !!(pack.points || []).some(function (p) {
      return String(p.label || "").toUpperCase() === key && !!p.drawOnly;
    });
  }

  function pendingHeightFeet(pack, progress) {
    var out = [];
    (progress.draw && progress.draw.heights ? progress.draw.heights : []).forEach(function (h) {
      if (!h || !h.snapped || !h.footLabel) return;
      var lab = String(h.footLabel).toUpperCase();
      if (footPointReady(progress, lab)) return;
      if (!areaUsesFootLabel(pack, progress, lab)) return;
      var exp = expectedFootPoint(pack, lab);
      if (!exp) return;
      out.push({ label: lab, expected: exp, from: String(h.from || "").toUpperCase(), base: h.base || [] });
    });
    return out;
  }

  function heightFootHintMessage(foot, pack) {
    var lab = foot.label;
    var fromPt = foot.from || "";
    var base = (foot.base || []).map(function (b) {
      return String(b || "").toUpperCase();
    }).join("");
    var msg =
      "מצאו את נקודת רגל הגובה " +
      lab +
      " — רשמו " +
      lab +
      formatPointPair(foot.expected.x, foot.expected.y) +
      " (או " +
      lab +
      "x=… ו-" +
      lab +
      "y=…).";
    if (fromPt) {
      msg =
        "מצאו את " +
        lab +
        ". הרגל של הגובה מ-" +
        fromPt +
        " אל " +
        base +
        " → ל-" +
        lab +
        " אותו x כמו ל-" +
        fromPt +
        ", ו-y על צלע " +
        base +
        ".";
    }
    return msg;
  }

  function nextHeightFootHint(pack, progress) {
    var feet = pendingHeightFeet(pack, progress);
    if (!feet.length) return null;
    var f = feet[0];
    var step = f.label + formatPointPair(f.expected.x, f.expected.y);
    return {
      footCalc: true,
      message: heightFootHintMessage(f, pack),
      step: step,
      answer: step,
    };
  }

  function checkHeightFootPoint(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    if (!resolveDrawConfig(pack) || !drawPartActive(pack, progress)) return null;

    var targetLabel = null;
    var pair = null;
    var axisName = null;
    var axisVal = null;

    if (parsed && parsed.kind === "point" && parsed.point) {
      if (parsed.tag) targetLabel = normGeoTag(parsed.tag);
      pair = parsed.point;
    } else if (parsed && parsed.tag && parsed.value != null) {
      var tagU = normGeoTag(parsed.tag);
      var axisMatch = tagU.match(/^([A-Z])(X|Y)$/);
      if (axisMatch) {
        targetLabel = axisMatch[1];
        axisName = axisMatch[2].toLowerCase();
        axisVal = parsed.value;
      }
    }

    if (!targetLabel || !isDrawFootLabel(pack, targetLabel)) return null;
    if (!areaUsesFootLabel(pack, progress, targetLabel)) return null;
    if (footPointReady(progress, targetLabel)) return null;

    var exp = expectedFootPoint(pack, targetLabel);
    if (!exp) return null;

    if (!heightFootSnapped(progress, targetLabel)) {
      var drawCfg = resolveDrawConfig(pack) || {};
      var hspec = (drawCfg.heights || []).filter(function (h) {
        return String(h.footLabel || "").toUpperCase() === targetLabel;
      })[0];
      var fromLab = hspec ? String(hspec.from || "").toUpperCase() : "?";
      var baseLab = hspec ? (hspec.base || []).map(function (b) {
        return String(b || "").toUpperCase();
      }).join("") : "";
      return {
        ok: false,
        message:
          "קודם הורידו גובה מ-" +
          fromLab +
          " אל " +
          baseLab +
          " עם «+ גובה», וגררו את הרגל לצלע.",
      };
    }

    var footCoords = {};
    Object.keys(progress.footCoords || {}).forEach(function (k) {
      footCoords[k] = Object.assign({}, progress.footCoords[k]);
    });
    if (!footCoords[targetLabel]) footCoords[targetLabel] = { x: null, y: null };
    var cur = footCoords[targetLabel];

    if (pair) {
      if (!nearNum(pair.x, exp.x) || !nearNum(pair.y, exp.y)) {
        return {
          ok: false,
          message:
            "השיעורים של " +
            targetLabel +
            " עדיין לא מדויקים. זו רגל הגובה — בדקו את x ו-y.",
        };
      }
      footCoords[targetLabel] = { x: exp.x, y: exp.y };
      return {
        ok: true,
        solved: false,
        done: Object.assign({}, doneMap),
        partial: Object.assign({}, partialMap),
        coords: Object.assign({}, coordsMap),
        lastExpr: progress.lastExpr || {},
        footCoords: footCoords,
        show: targetLabel + " " + formatPointPair(exp.x, exp.y),
        message:
          "נכון. " +
          targetLabel +
          formatPointPair(exp.x, exp.y) +
          " — עכשיו אפשר לחשב את אורכי הצלעות או את השטח.",
      };
    }

    if (axisName && axisVal != null) {
      var want = axisName === "x" ? exp.x : exp.y;
      if (!nearNum(axisVal, want)) {
        return {
          ok: false,
          message: "ה-" + axisName + " של " + targetLabel + " עדיין לא מדויק.",
        };
      }
      cur[axisName] = want;
      footCoords[targetLabel] = cur;
      var showAxis = targetLabel.toLowerCase() + axisName + " = " + fmtNum(want);
      var bothDone = cur.x != null && cur.y != null;
      if (bothDone && nearNum(cur.x, exp.x) && nearNum(cur.y, exp.y)) {
        return {
          ok: true,
          solved: false,
          done: Object.assign({}, doneMap),
          partial: Object.assign({}, partialMap),
          coords: Object.assign({}, coordsMap),
          lastExpr: progress.lastExpr || {},
          footCoords: footCoords,
          show: targetLabel + " " + formatPointPair(exp.x, exp.y),
          message:
            "נכון. " +
            targetLabel +
            formatPointPair(exp.x, exp.y) +
            " — עכשיו אפשר לחשב את אורכי הצלעות או את השטח.",
        };
      }
      return {
        ok: true,
        solved: false,
        done: Object.assign({}, doneMap),
        partial: Object.assign({}, partialMap),
        coords: Object.assign({}, coordsMap),
        lastExpr: progress.lastExpr || {},
        footCoords: footCoords,
        show: showAxis,
        message:
          "נכון. עוד חסר שיעור " +
          (cur.x != null ? "y" : "x") +
          " של " +
          targetLabel +
          ".",
      };
    }

    return null;
  }

  function isDrawFootPoint(pack, label) {
    var key = String(label || "").toUpperCase();
    return !!(pack.points || []).some(function (p) {
      return String(p.label || "").toUpperCase() === key && !!p.drawOnly;
    });
  }

  function inferDrawHeightsFromPack(pack) {
    var seen = {};
    var heights = [];
    function add(h) {
      var key =
        String(h.from || "").toUpperCase() + "|" + String(h.footLabel || "").toUpperCase();
      if (seen[key]) return;
      seen[key] = true;
      heights.push({
        id:
          h.id ||
          "h" + String(h.from || "").toUpperCase() + String(h.footLabel || "").toUpperCase(),
        from: String(h.from || "").toUpperCase(),
        base: (h.base || []).map(function (b) {
          return String(b || "").toUpperCase();
        }),
        footLabel: String(h.footLabel || "").toUpperCase(),
        recommended: h.recommended !== false,
      });
    }
    function legUsesFoot(leg, apex) {
      if (!leg || leg.length < 2) return null;
      var apexKey = String(apex || "").toUpperCase();
      if (isDrawFootPoint(pack, leg[0]) && String(leg[1] || "").toUpperCase() === apexKey) {
        return String(leg[0]).toUpperCase();
      }
      if (isDrawFootPoint(pack, leg[1]) && String(leg[0] || "").toUpperCase() === apexKey) {
        return String(leg[1]).toUpperCase();
      }
      return null;
    }
    (pack.tasks || []).forEach(function (t) {
      if (t.kind === "area" && t.legs) {
        (t.legs || []).forEach(function (leg) {
          if (!leg || leg.length < 2) return;
          var foot = null;
          var apex = null;
          if (isDrawFootPoint(pack, leg[0])) {
            foot = String(leg[0]).toUpperCase();
            apex = String(leg[1]).toUpperCase();
          } else if (isDrawFootPoint(pack, leg[1])) {
            foot = String(leg[1]).toUpperCase();
            apex = String(leg[0]).toUpperCase();
          }
          if (!foot || !apex) return;
          var baseLeg = (t.legs || []).filter(function (L) {
            return L !== leg;
          })[0];
          if (!baseLeg || baseLeg.length < 2) return;
          add({
            from: apex,
            base: [String(baseLeg[0]).toUpperCase(), String(baseLeg[1]).toUpperCase()],
            footLabel: foot,
            recommended: true,
          });
        });
      }
      if (t.kind === "axis" && t.drawHeight && t.point) {
        var apexPt = String(t.point).toUpperCase();
        (pack.tasks || []).forEach(function (at) {
          if (at.kind !== "area" || !at.legs) return;
          (at.legs || []).forEach(function (leg) {
            var foot = legUsesFoot(leg, apexPt);
            if (!foot) return;
            var baseLeg = (at.legs || []).filter(function (L) {
              return L !== leg;
            })[0];
            if (!baseLeg || baseLeg.length < 2) return;
            add({
              from: apexPt,
              base: [String(baseLeg[0]).toUpperCase(), String(baseLeg[1]).toUpperCase()],
              footLabel: foot,
              recommended: true,
            });
          });
        });
      }
      if (t.kind === "segment" || t.kind === "origin") {
        var fromLab = t.kind === "origin" ? "O" : t.from;
        var toLab = t.kind === "origin" ? t.point : t.to;
        var segFoot = null;
        var segApex = null;
        if (isDrawFootPoint(pack, toLab)) {
          segFoot = String(toLab || "").toUpperCase();
          segApex = String(fromLab || "").toUpperCase();
        } else if (isDrawFootPoint(pack, fromLab)) {
          segFoot = String(fromLab || "").toUpperCase();
          segApex = String(toLab || "").toUpperCase();
        }
        if (segFoot && segApex) {
          var baseFromArea = null;
          (pack.tasks || []).forEach(function (at) {
            if (baseFromArea || at.kind !== "area" || !at.legs) return;
            var hLeg = (at.legs || []).filter(function (leg) {
              return legUsesFoot(leg, segApex) === segFoot;
            })[0];
            if (!hLeg) return;
            var bLeg = (at.legs || []).filter(function (L) {
              return L !== hLeg;
            })[0];
            if (!baseFromArea && bLeg && bLeg.length >= 2) {
              baseFromArea = [
                String(bLeg[0]).toUpperCase(),
                String(bLeg[1]).toUpperCase(),
              ];
            }
          });
          if (baseFromArea) {
            add({
              from: segApex,
              base: baseFromArea,
              footLabel: segFoot,
              recommended: true,
            });
          }
        }
      }
    });
    return heights;
  }

  function resolveDrawConfig(pack) {
    if (!pack) return null;
    if (pack.draw && pack.draw.enabled) return pack.draw;
    var heights = inferDrawHeightsFromPack(pack);
    if (!heights.length) return null;
    var verts = [];
    (pack.tasks || []).forEach(function (t) {
      if (t.kind === "area" && t.verts) {
        (t.verts || []).forEach(function (v) {
          var u = String(v || "").toUpperCase();
          if (verts.indexOf(u) < 0) verts.push(u);
        });
      }
    });
    return {
      enabled: true,
      hintText: "לחצו «+ גובה», בחרו קודקוד, וגררו את רגל הגובה אל הצלע.",
      triangle: verts.length >= 3 ? verts : undefined,
      heights: heights,
    };
  }

  function isHeightApex(pack, pointLabel) {
    var cfg = resolveDrawConfig(pack);
    if (!cfg || !cfg.heights) return false;
    var key = String(pointLabel || "").toUpperCase();
    return cfg.heights.some(function (h) {
      return String(h.from || "").toUpperCase() === key;
    });
  }

  function areaNeedsDrawHeight(task, pack) {
    if (!task || task.kind !== "area") return false;
    return (task.legs || []).some(function (leg) {
      if (!leg || leg.length < 2) return false;
      return (
        isDrawFootPoint(pack, leg[0]) ||
        isDrawFootPoint(pack, leg[1])
      );
    });
  }

  function taskUsesDrawnHeight(t, pack) {
    if (!t) return false;
    if (t.drawHeight) return true;
    var cfg = resolveDrawConfig(pack);
    if (!cfg || !cfg.heights || !cfg.heights.length) return false;
    function isFoot(lab) {
      var k = String(lab || "").toUpperCase();
      return cfg.heights.some(function (h) {
        return String(h.footLabel || "").toUpperCase() === k;
      });
    }
    if (t.kind === "area") return areaNeedsDrawHeight(t, pack);
    if (t.kind === "point" && isFoot(t.point || t.label)) return true;
    if (t.kind === "axis") {
      return !!t.drawHeight || isHeightApex(pack, t.point);
    }
    if (t.kind === "segment" || t.kind === "origin") {
      var a = t.kind === "origin" ? "O" : t.from;
      var b = t.kind === "origin" ? t.point : t.to;
      return isFoot(a) || isFoot(b) || isFoot(t.point);
    }
    if (t.kind === "distSeg") {
      var p = String(t.point || "").toUpperCase();
      var from = String(t.from || "").toUpperCase();
      var to = String(t.to || "").toUpperCase();
      return cfg.heights.some(function (h) {
        var apex = String(h.from || "").toUpperCase();
        var base = (h.base || []).map(function (x) {
          return String(x || "").toUpperCase();
        });
        return apex === p && base.indexOf(from) >= 0 && base.indexOf(to) >= 0;
      });
    }
    return false;
  }

  function drawPartActive(pack, progress) {
    if (!pack || !resolveDrawConfig(pack)) return false;
    progress = progress || {};
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    if (!ids.length) return false;
    var i;
    for (i = 0; i < ids.length; i++) {
      var t = (pack.tasks || []).filter(function (task) {
        return task.id === ids[i];
      })[0];
      if (!t) continue;
      if (!taskUsesDrawnHeight(t, pack)) continue;
      if (progress.done && progress.done[t.id]) continue;
      return true;
    }
    return false;
  }

  function sceneForProgress(pack, progress) {
    progress = progress || { done: {} };
    var part = currentPartText(pack, progress);
    var rawPoints =
      part && part.points && part.points.length ? part.points : pack.points || [];
    var segs =
      part && part.segments && part.segments.length
        ? part.segments
        : pack.segments || [];
    var partIds = (part && part.taskIds) || [];
    var found = progress.coords || {};
    var points = rawPoints.map(function (p) {
      var copy = {
        label: p.label,
        x: p.x,
        y: p.y,
        hideX: !!p.hideX,
        hideY: !!p.hideY,
        drawOnly: !!p.drawOnly,
      };
      var task = (pack.tasks || []).filter(function (t) {
        if (t.kind !== "point" && t.kind !== "lineIntersect" && t.kind !== "midpoint") return false;
        var plab = t.kind === "lineIntersect" || t.kind === "midpoint" ? t.point || t.label : t.point;
        if (String(plab || "").toUpperCase() !== String(p.label || "").toUpperCase()) return false;
        if (partIds.length && partIds.indexOf(t.id) < 0) return false;
        return true;
      })[0];
      if (!task) {
        // נקודה שכבר נפתרה בחלק קודם עם אותו תווית — חפש לפי done
        task = (pack.tasks || []).filter(function (t) {
          return (
            (t.kind === "point" || t.kind === "lineIntersect" || t.kind === "midpoint") &&
            String((t.kind === "lineIntersect" || t.kind === "midpoint" ? t.point || t.label : t.point) || "")
              .toUpperCase() === String(p.label || "").toUpperCase() &&
            progress.done &&
            progress.done[t.id]
          );
        })[0];
      }
      if (task) {
        var cf = found[task.id] || {};
        var miss = String(task.missing || "").toLowerCase();
        if (progress.done && progress.done[task.id]) {
          var cw = String(task.completeWhen || "").toLowerCase();
          if (cw === "x") {
            copy.hideX = false;
          } else if (cw === "y") {
            copy.hideY = false;
          } else {
            copy.hideX = false;
            copy.hideY = false;
            copy.revealed = true;
          }
        } else if (task.kind === "lineIntersect" || task.kind === "midpoint") {
          if (cf.x) copy.hideX = false;
          if (cf.y) copy.hideY = false;
          if (progress.done && progress.done[task.id]) {
            copy.hideX = false;
            copy.hideY = false;
            copy.revealed = true;
          }
        } else if (cf.x || cf.y) {
          if (cf.x) copy.hideX = false;
          if (cf.y) copy.hideY = false;
        } else if (progress.partial && progress.partial[task.id]) {
          if (miss === "y") copy.hideY = false;
          else if (miss === "x") copy.hideX = false;
        }
      }
      if (copy.drawOnly) {
        if (drawOnlyFootRevealed(p.label, pack, progress)) {
          copy.hideX = false;
          copy.hideY = false;
          copy.revealed = true;
        } else {
          copy.hideX = true;
          copy.hideY = true;
        }
      }
      return copy;
    }).filter(function (p) {
      if (!p.drawOnly) return true;
      return drawOnlyFootRevealed(p.label, pack, progress);
    });
    return {
      points: points,
      segments: segs,
      polygons: (pack.polygons || []).filter(function (poly) {
        var labs = poly.verts || [];
        if (labs.length < 3) return false;
        return labs.every(function (lab) {
          var key = String(lab || "").toUpperCase();
          if (key === "O") return true;
          return points.some(function (p) {
            return String(p.label || "").toUpperCase() === key;
          });
        });
      }),
      rightAngles: pack.rightAngles || [],
      axisGuides: pack.axisGuides || [],
      graphs: isLineMatchPack(pack)
        ? graphLinesForMatch(pack, progress)
        : pack.lines && pack.lines.length
          ? graphLinesForIntersect(pack, progress).concat(extraLineGraphs(pack, progress))
          : (function () {
            var extra = extraLineGraphs(pack, progress);
            var main = graphLineSpec(pack, progress);
            if (main) extra.push(main);
            return extra;
          })(),
      distGuides: (function () {
        var guides = [];
        (partIds || []).forEach(function (tid) {
          var task = (pack.tasks || []).filter(function (t) {
            return t.id === tid && t.kind === "distSeg";
          })[0];
          if (!task) return;
          var p = points.filter(function (q) {
            return String(q.label).toUpperCase() === String(task.point || "").toUpperCase();
          })[0];
          var a = points.filter(function (q) {
            return String(q.label).toUpperCase() === String(task.from || "").toUpperCase();
          })[0];
          var b = points.filter(function (q) {
            return String(q.label).toUpperCase() === String(task.to || "").toUpperCase();
          })[0];
          var foot = footOnAxisSeg(p, a, b);
          if (p && foot) guides.push({ from: p, to: foot });
        });
        return guides;
      })(),
      areaLabels: (function () {
        var out = [];
        var ga = pack.givenArea;
        if (ga && ga.value != null) {
          out.push({
            verts: ga.verts || [],
            text: "S=" + fmtNum(ga.value),
          });
        }
        (pack.tasks || []).forEach(function (t) {
          if (t.kind !== "area" || !progress.done || !progress.done[t.id]) return;
          if (t.sum || t.diff) return;
          var verts = (t.verts || []).map(function (v) {
            return String(v || "").toUpperCase();
          });
          if (verts.length < 3 || t.answer == null || !isFinite(t.answer)) return;
          out.push({ verts: verts, text: fmtNum(t.answer) });
        });
        return out;
      })(),
      segLabels: (function () {
        var out = [];
        var seen = {};
        var mapLen = pointMap(points);
        function addLen(from, to, len) {
          var a = String(from || "").toUpperCase();
          var b = String(to || "").toUpperCase();
          if (!a || !b || len == null || !isFinite(len)) return;
          var pa = getPoint(mapLen, a) || getPoint(pack.map, a);
          var pb = getPoint(mapLen, b) || getPoint(pack.map, b);
          if (!pa || !pb) return;
          if (!nearNum(pa.x, pb.x) && !nearNum(pa.y, pb.y)) return;
          var key = a < b ? a + "|" + b : b + "|" + a;
          if (seen[key]) return;
          seen[key] = true;
          var inside = null;
          (pack.tasks || []).some(function (at) {
            if (at.kind !== "area" || at.sum || at.diff || !at.verts || at.verts.length < 3) return false;
            var vs = at.verts.map(function (v) {
              return String(v || "").toUpperCase();
            });
            if (vs.indexOf(a) >= 0 && vs.indexOf(b) >= 0) {
              inside = vs;
              return true;
            }
            return false;
          });
          out.push({ from: a, to: b, text: fmtNum(len), upright: true, inside: inside });
        }
        (pack.givenLengths || []).forEach(function (g) {
          addLen(g.from, g.to, g.len);
        });
        (pack.tasks || []).forEach(function (t) {
          if (!progress.done || !progress.done[t.id]) return;
          if (t.kind === "origin") addLen("O", t.point, t.answer);
          if (t.kind === "segment") addLen(t.from, t.to, t.answer);
          if (t.kind === "axis" && t.heightFoot) addLen(t.point, t.heightFoot, t.answer);
        });
        return out;
      })(),
    };
  }

  function parseNumberToken(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(",", ".");
    if (!t) return null;
    var abs = t.match(/^\|(.+)\|$/);
    if (abs) {
      var inner = parseNumberToken(abs[1]);
      return inner == null ? null : Math.abs(inner);
    }
    if (/^[+-]?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?$/.test(t)) {
      if (t.indexOf("/") !== -1) {
        var parts = t.split("/");
        var n = parseFloat(parts[0], 10);
        var d = parseFloat(parts[1], 10);
        if (!isFinite(n) || !isFinite(d) || near0(d)) return null;
        return n / d;
      }
      return parseFloat(t, 10);
    }
    return null;
  }

  /** חישוב ביניים: 5-2, 2-0, 0-(-7), 0--7, וגם 0+7 */
  function evalStepExpr(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/[·×]/g, "*")
      .replace(/\s+/g, "");
    if (!t) return null;
    var direct = parseNumberToken(t);
    if (direct != null) return direct;
    var mMul = t.match(/^(-?\d+(?:\.\d+)?)\*(-?\d+(?:\.\d+)?)$/);
    if (mMul) {
      var pm = parseFloat(mMul[1], 10);
      var qm = parseFloat(mMul[2], 10);
      if (isFinite(pm) && isFinite(qm)) return pm * qm;
    }
    var a;
    var b;
    var mParen = t.match(/^(-?\d+(?:\.\d+)?)-\((-?\d+(?:\.\d+)?)\)$/);
    if (mParen) {
      a = parseFloat(mParen[1], 10);
      b = parseFloat(mParen[2], 10);
      return isFinite(a) && isFinite(b) ? a - b : null;
    }
    var mDouble = t.match(/^(-?\d+(?:\.\d+)?)--(\d+(?:\.\d+)?)$/);
    if (mDouble) {
      a = parseFloat(mDouble[1], 10);
      b = parseFloat(mDouble[2], 10);
      return isFinite(a) && isFinite(b) ? a - -b : null;
    }
    var mSub = t.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
    if (mSub) {
      a = parseFloat(mSub[1], 10);
      b = parseFloat(mSub[2], 10);
      return isFinite(a) && isFinite(b) ? a - b : null;
    }
    var mAddParen = t.match(/^(-?\d+(?:\.\d+)?)\+\((-?\d+(?:\.\d+)?)\)$/);
    if (mAddParen) {
      a = parseFloat(mAddParen[1], 10);
      b = parseFloat(mAddParen[2], 10);
      return isFinite(a) && isFinite(b) ? a + b : null;
    }
    var mAdd = t.match(/^(-?\d+(?:\.\d+)?)\+(-?\d+(?:\.\d+)?)$/);
    if (mAdd) {
      a = parseFloat(mAdd[1], 10);
      b = parseFloat(mAdd[2], 10);
      return isFinite(a) && isFinite(b) ? a + b : null;
    }
    return null;
  }

  function prettyStepExpr(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/[·×]/g, "*")
      .replace(/\s+/g, "");
    if (!t) return "";
    var mMulP = t.match(/^(-?\d+(?:\.\d+)?)\*(-?\d+(?:\.\d+)?)$/);
    if (mMulP) return fmtNum(parseFloat(mMulP[1], 10)) + " · " + fmtNum(parseFloat(mMulP[2], 10));
    var mAdd = t.match(/^(-?\d+(?:\.\d+)?)\+(-?\d+(?:\.\d+)?)$/);
    if (mAdd) return fmtNum(parseFloat(mAdd[1], 10)) + " + " + fmtNum(parseFloat(mAdd[2], 10));
    var mAddParen = t.match(/^(-?\d+(?:\.\d+)?)\+\((-?\d+(?:\.\d+)?)\)$/);
    if (mAddParen) {
      return fmtNum(parseFloat(mAddParen[1], 10)) + " + " + formatLo(parseFloat(mAddParen[2], 10));
    }
    var mParen = t.match(/^(-?\d+(?:\.\d+)?)-\((-?\d+(?:\.\d+)?)\)$/);
    if (mParen) {
      return fmtNum(parseFloat(mParen[1], 10)) + " − " + formatLo(parseFloat(mParen[2], 10));
    }
    var mDouble = t.match(/^(-?\d+(?:\.\d+)?)--(\d+(?:\.\d+)?)$/);
    if (mDouble) {
      return fmtNum(parseFloat(mDouble[1], 10)) + " − (" + fmtNum(-parseFloat(mDouble[2], 10)) + ")";
    }
    var mSub = t.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
    if (mSub) {
      return fmtNum(parseFloat(mSub[1], 10)) + " − " + formatLo(parseFloat(mSub[2], 10));
    }
    return t;
  }

  function isBareNumberExpr(s) {
    return parseNumberToken(s) != null;
  }

  function extractAnswerValue(typed) {
    var raw = String(typed || "").replace(/[−–—]/g, "-");
    raw = raw.replace(/(-?\d+)\s+(\d+)\s*\/\s*(\d+)/g, function (_, w, n, d) {
      var ww = parseInt(w, 10);
      var nn = parseInt(n, 10);
      var dd = parseInt(d, 10);
      if (!dd) return _;
      var sign = ww < 0 ? -1 : 1;
      return String(sign * (Math.abs(ww) * dd + nn)) + "/" + d;
    });
    var s = raw.replace(/\s+/g, "");
    if (!s) return { value: null, tag: null, kind: null };
    // מאפשרים "=4" / ":4" כמו "4" (המשך שרשרת אחרי ביטוי ביניים)
    if (/^[=:]+/.test(s)) {
      s = s.replace(/^[=:]+/, "");
      if (!s) return { value: null, tag: null, kind: null };
    }

    function classifyRhs(rhs) {
      var pair = parsePointPair(rhs);
      if (pair) return { value: null, kind: "point", point: pair, display: formatPointPair(pair.x, pair.y) };
      if (isBareNumberExpr(rhs)) return { value: parseNumberToken(rhs), kind: "final", display: null };
      var v = evalArithLoose(rhs);
      if (v == null) return { value: null, kind: null, display: null };
      return { value: v, kind: "diff", display: prettyStepExpr(rhs) };
    }

    // sAOB=... / S△AOB=... / S□ABCD=... / SAOB=...
    var taggedArea = s.match(/^S(?:△|Δ|□|▭)?([A-Za-z]{3,4})(?:=|:)(.+)$/i);
    if (taggedArea) {
      return {
        tag: normAreaTag(taggedArea[1]),
        value: null,
        kind: "area",
        areaRhs: taggedArea[2],
        displayExpr: prettyAreaExpr(taggedArea[2]),
      };
    }

    // B=(4;-1) / B(4;-1) / B=4;-1 / B(4,-1) / P(2/3;14/3)
    var taggedPoint =
      s.match(/^([A-Za-z])=\(?([^;,)]+)[;,]([^)]+)\)?$/) ||
      s.match(/^([A-Za-z])\(([^;,)]+)[;,]([^)]+)\)$/);
    if (taggedPoint) {
      var tpx = parseNumberToken(taggedPoint[2]);
      var tpy = parseNumberToken(taggedPoint[3]);
      if (tpx != null && tpy != null) {
        return {
          tag: normGeoTag(taggedPoint[1]),
          value: null,
          kind: "point",
          point: { x: tpx, y: tpy },
          displayExpr: formatPointPair(tpx, tpy),
        };
      }
    }

    // Bx=Ax / By=Cy — העתקת שיעור מנקודה ידועה
    var twinEq = s.match(/^([A-Za-z])[_ ]?([xyXY])=([A-Za-z])[_ ]?([xyXY])$/);
    if (twinEq && twinEq[2].toLowerCase() === twinEq[4].toLowerCase()) {
      return {
        tag: normGeoTag(twinEq[1] + twinEq[2]),
        value: null,
        kind: "twin",
        twinPoint: twinEq[3].toUpperCase(),
        twinAxis: twinEq[4].toLowerCase(),
        displayExpr: twinEq[1].toUpperCase() + twinEq[2].toLowerCase() + "=" + twinEq[3].toUpperCase() + twinEq[4].toLowerCase(),
      };
    }

    // C→AB=2 / C->AB:5-2 / CAB=2
    var taggedDist = s.match(/^([A-Za-z])(?:→|->)([A-Za-z]{2})(?:=|:)(.+)$/);
    if (taggedDist) {
      var cd = classifyRhs(taggedDist[3]);
      return {
        tag: normGeoTag(taggedDist[1] + taggedDist[2]),
        value: cd.value,
        kind: cd.kind,
        displayExpr: cd.display,
      };
    }

    // x_A=4 / A_x=4 / yB=1 / yb=1 / By=1
    var axisFirst =
      s.match(/^([xyXY])_([A-Za-z])(?:=|:)(.+)$/) ||
      s.match(/^([A-Za-z])_([xyXY])(?:=|:)(.+)$/) ||
      s.match(/^([A-Za-z])([xyXY])(?:=|:)(.+)$/) ||
      s.match(/^([xyXY])([A-Za-z])(?:=|:)(.+)$/);
    if (axisFirst) {
      var letter;
      var axisCh;
      if (/^[xyXY]$/.test(axisFirst[1]) && !/^[xyXY]$/.test(axisFirst[2])) {
        letter = axisFirst[2];
        axisCh = axisFirst[1];
      } else if (!/^[xyXY]$/.test(axisFirst[1]) && /^[xyXY]$/.test(axisFirst[2])) {
        letter = axisFirst[1];
        axisCh = axisFirst[2];
      } else {
        letter = null;
      }
      if (letter) {
        var cAx = classifyRhs(axisFirst[3]);
        return {
          tag: normGeoTag(letter + axisCh),
          value: cAx.value,
          kind: cAx.kind,
          point: cAx.point || null,
          displayExpr: cAx.display,
        };
      }
    }
    var tagged = s.match(/^([A-Za-z](?:→|->|-)?[xyXY]|[A-Za-z]{1,3})0?(?:=|:)(.+)$/);
    if (tagged) {
      var c = classifyRhs(tagged[2]);
      return {
        tag: normGeoTag(tagged[1]),
        value: c.value,
        kind: c.kind,
        point: c.point || null,
        displayExpr: c.display,
      };
    }
    // זוג שיעורים בלי שם: (4;-1)
    var barePair = parsePointPair(s);
    if (barePair) {
      return {
        tag: null,
        value: null,
        kind: "point",
        point: barePair,
        displayExpr: formatPointPair(barePair.x, barePair.y),
      };
    }
    // 2-0=2 או 0+7=7
    var eq = s.match(/^(.+)=(.+)$/);
    if (eq) {
      var left = evalStepExpr(eq[1]);
      var rightBare = parseNumberToken(eq[2]);
      var rightStep = evalStepExpr(eq[2]);
      if (left != null && rightBare != null && nearNum(left, rightBare)) {
        return {
          tag: null,
          value: rightBare,
          kind: "full",
          expression: eq[1],
          displayExpr: prettyStepExpr(eq[1]),
        };
      }
      if (rightStep != null && !/[xyXY]/.test(eq[1] + eq[2])) {
        var rk = isBareNumberExpr(eq[2]) ? "final" : "diff";
        return {
          tag: null,
          value: rightStep,
          kind: rk,
          displayExpr: rk === "diff" ? prettyStepExpr(eq[2]) : null,
        };
      }
      // רק אגף שמאלי כביטוי אחרי = ריק — לא
      if (left != null && eq[2] === "") {
        return { tag: null, value: left, kind: "diff", displayExpr: prettyStepExpr(eq[1]) };
      }
    }
    if (isBareNumberExpr(s)) {
      return { tag: null, value: parseNumberToken(s), kind: "final" };
    }
    if (evalStepExpr(s) != null) {
      return {
        tag: null,
        value: evalStepExpr(s),
        kind: "diff",
        displayExpr: prettyStepExpr(s),
      };
    }
    return { value: null, tag: null, kind: null };
  }

  function taskMatchesTag(task, tag) {
    if (!tag) return true;
    var t = normGeoTag(tag);
    if (normGeoTag(task.id) === t) return true;
    if (normGeoTag(task.label) === t) return true;
    if (task.kind === "origin") {
      var p = String(task.point || "").toUpperCase();
      var ob = "O" + p;
      var bo = p + "O";
      if (t === p || t === ob || t === bo) return true;
    }
    if (task.kind === "axis") {
      var ap = String(task.point || "").toUpperCase();
      var aax = String(task.axis || "x").toLowerCase() === "y" ? "Y" : "X";
      if (t === ap + aax) return true;
      if (task.heightFoot) {
        var hseg = heightSegmentName(task.point, task.heightFoot);
        var hsegRev = heightSegmentName(task.heightFoot, task.point);
        if (t === hseg || t === hsegRev) return true;
      }
    }
    if (task.kind === "segment" || task.kind === "distance") {
      var ab = String(task.from || "").toUpperCase() + String(task.to || "").toUpperCase();
      var ba = String(task.to || "").toUpperCase() + String(task.from || "").toUpperCase();
      if (t === ab || t === ba) return true;
      if (task.kind === "distance") {
        if (t === "D" || t === "D" + ab || t === "D" + ba) return true;
      }
    }
    if (task.kind === "distSeg") {
      var p0 = String(task.point || "").toUpperCase();
      var f0 = String(task.from || "").toUpperCase();
      var t0 = String(task.to || "").toUpperCase();
      if (t === p0 + f0 + t0 || t === p0 + t0 + f0) return true;
      if (t === normGeoTag(task.label)) return true;
    }
    if (task.kind === "slope") {
      var lp2 = String(task.param || task.label || "m").toUpperCase();
      if (t === lp2 || t === "M") return true;
      var labs = slopeTaskLetters(task);
      if (t === "M" + labs.from + labs.to || t === "M" + labs.to + labs.from) return true;
    }
    if (task.kind === "lineMb") {
      var lpMb = String(task.param || task.label || "m").toUpperCase();
      if (t === lpMb) return true;
    }
    if (task.kind === "midpoint") {
      var pm = String(task.point || task.label || "M").toUpperCase();
      if (t === pm) return true;
      if (t === "X" || t === "Y" || t === pm + "X" || t === pm + "Y" || t === "X" + pm || t === "Y" + pm) {
        return true;
      }
    }
    if (task.kind === "point") {
      var pp = String(task.point || "").toUpperCase();
      if (t === pp) return true;
      if (t === pp + "X" || t === "X" + pp || t === pp + "Y" || t === "Y" + pp) return true;
      if (t === "X" || t === "Y") {
        var missAx = String(task.missing || "").toLowerCase();
        if (missAx === "both" || missAx === t.toLowerCase()) return true;
      }
    }
    if (task.kind === "onLine" || task.kind === "freePoint") {
      var pp2 = String(task.point || task.label || "").toUpperCase();
      if (t === "X" || t === "Y") return true;
      if (t === pp2 || t === pp2 + "X" || t === pp2 + "Y") return true;
      if (t === normGeoTag(task.id) || t === normGeoTag(task.label)) return true;
    }
    if (task.kind === "lineIntersect") {
      var pp3 = String(task.point || task.label || "P").toUpperCase();
      if (t === pp3) return true;
    }
    if (task.kind === "area") {
      var av = (task.verts || []).map(function (v) {
        return String(v || "").toUpperCase();
      }).join("");
      var nt = normAreaTag(tag);
      if (nt === av || normAreaTag(task.id) === nt || normAreaTag(task.label) === nt) return true;
      if (sameCyclicVerts(task.verts, nt.split(""))) return true;
    }
    return false;
  }

  function missingCoordValue(task, axis) {
    if (!task || task.kind !== "point") return null;
    var ax = String(axis || task.missing || "x").toLowerCase();
    if (ax === "y") return task.answerY;
    return task.answerX;
  }

  function resolveTwinPoint(pack, progress, label) {
    var part = currentPartText(pack, progress);
    if (part && part.points) {
      var hit = part.points.filter(function (p) {
        return String(p.label || "").toUpperCase() === String(label || "").toUpperCase();
      })[0];
      if (hit) return hit;
    }
    return getPoint(pack.map, label);
  }

  function taskByIdMap(pack) {
    var map = {};
    (pack && pack.tasks ? pack.tasks : []).forEach(function (t) {
      map[t.id] = t;
    });
    return map;
  }

  function partStepByTask(part, pack) {
    if (!part || part.stepByTask === false) return false;
    var ids = part.taskIds || [];
    if (ids.length < 2) return false;
    var map = taskByIdMap(pack);
    var required = 0;
    ids.forEach(function (id) {
      if (map[id] && isRequiredTask(map[id])) required += 1;
    });
    return required >= 2;
  }

  function currentFocusTask(pack, progress) {
    progress = progress || { done: {} };
    var pair0 = axisMidPairTasks(pack, progress);
    if (pair0) {
      var pf = axisMidPairFocus(pack, progress, pair0);
      if (pf) return pf;
    }
    var pairL = lineMidPairTasks(pack, progress);
    if (pairL && !lineMidPairBlockedByPrior(pack, progress, pairL)) {
      var pfL = lineMidPairFocus(pack, progress, pairL);
      if (pfL) return pfL;
    }
    var part = currentPartText(pack, progress);
    if (!part || !partStepByTask(part, pack)) return null;
    var map = taskByIdMap(pack);
    var ids = part.taskIds || [];
    var i;
    for (i = 0; i < ids.length; i++) {
      var t = map[ids[i]];
      if (!t) continue;
      if (progress.done && progress.done[t.id]) continue;
      if (!isRequiredTask(t)) {
        var laterRequired = false;
        var j;
        for (j = i + 1; j < ids.length; j++) {
          var later = map[ids[j]];
          if (later && isRequiredTask(later) && !(progress.done && progress.done[later.id])) {
            laterRequired = true;
            break;
          }
        }
        if (!laterRequired) continue;
      }
      return t;
    }
    return null;
  }

  function taskStepLabel(task) {
    if (!task) return "";
    var kind = String(task.kind || "");
    var pt = String(task.point || task.label || task.id || "")
      .replace(/→/g, "")
      .toUpperCase();
    if (kind === "point") {
      if (String(task.intercept || "").toLowerCase() === "y") return "נקודה " + pt + " (ציר y)";
      if (String(task.intercept || "").toLowerCase() === "x") return "נקודה " + pt + " (ציר x)";
      return "נקודה " + pt;
    }
    if (kind === "rearrange") return "סידור משוואת הישר";
    if (kind === "lineIntersect") return "נקודת חיתוך " + String(task.label || task.point || "P").toUpperCase();
    if (kind === "onLine" || kind === "freePoint") return "נקודה " + pt;
    if (kind === "midpoint") {
      if (midpointOnAxis(task) === "y") return "נקודה " + (pt || "A") + " (ציר y)";
      if (midpointOnAxis(task) === "x") return "נקודה " + (pt || "B") + " (ציר x)";
      if (midpointLineVertical(task) != null) return "נקודה " + (pt || "B") + " (על x = " + fmtNum(midpointLineVertical(task)) + ")";
      if (midpointLineHorizontal(task) != null) return "נקודה " + (pt || "B") + " (על y = " + fmtNum(midpointLineHorizontal(task)) + ")";
      if (midpointLineIdentity(task)) return "נקודה " + (pt || "A") + " (על y = x)";
      if (task.mid) return "נקודה " + (pt || "B") + " — קצה לפי אמצע";
      return "אמצע הקטע " + (pt || "M");
    }
    if (kind === "segment") {
      if (task.drawHeight) {
        return "גובה מ־" + String(task.from || task.point || "").toUpperCase();
      }
      var segLab = task.label || segmentPairName(task.from, task.to);
      return "צלע " + String(segLab || "").replace(/→/g, "");
    }
    if (kind === "distance") {
      return "מרחק " + distSegName(task);
    }
    if (kind === "equalLen") {
      return "הוכחה: " + distEqualShow(task);
    }
    if (kind === "origin") return "מרחק " + (task.label || originSegmentName(task.point));
    if (kind === "axis") return "מרחק " + (task.label || axisDistanceName(task.point, task.axis));
    if (kind === "area") return "שטח " + (task.label || "S△" + areaVertsLabel(task));
    if (kind === "slope") {
      if (task.parallel) return "שיפוע " + parallelNewSlopeTag(task);
      if (task.perpendicular) return "שיפוע " + perpUnknownLhs(task).replace(/^m/, "");
      var sa = String(task.from || "").toUpperCase();
      var sb = String(task.to || "").toUpperCase();
      if (sa && sb) return "שיפוע " + sa + sb;
      return "שיפוע " + (task.label || "m");
    }
    if (kind === "lineMb") {
      return String(task.param || "m").toLowerCase() === "b" ? "גובה b" : "שיפוע m";
    }
    if (kind === "yesNo") {
      if (task.proveBisect) return "הוכחת חציית הקטע";
      return "כן / לא";
    }
    if (kind === "lineEq") {
      if (axisLineDir(task) === "y") return "משוואת הישר (x = …)";
      if (axisLineDir(task) === "x") return "משוואת הישר (y = …)";
      var side = String(task.label || "").trim();
      if (side && !/^(ישר|הישר)$/.test(side)) return "משוואת הישר " + side;
      return "משוואת הישר";
    }
    if (kind === "parallel") return "האם הישרים מקבילים";
    if (kind === "perpendicular") return "האם הישרים מאונכים";
    if (kind === "noIntercept") {
      var ax = String(task.axis || "x").toLowerCase() === "y" ? "y" : "x";
      return "חיתוך עם ציר " + ax;
    }
    if (kind === "distSeg") return "מרחק " + (task.label || pt);
    return String(task.label || task.id || "");
  }

  function partTaskChainContext(pack, progress, t) {
    var out = { earlier: [], later: [] };
    if (!pack || !t) return out;
    var part = currentPartText(pack, progress);
    if (!part) return out;
    var map = taskByIdMap(pack);
    var ids = part.taskIds || [];
    var i;
    var seen = false;
    for (i = 0; i < ids.length; i++) {
      var u = map[ids[i]];
      if (!u) continue;
      if (u.id === t.id) {
        seen = true;
        continue;
      }
      if (!seen) out.earlier.push(u);
      else out.later.push(u);
    }
    return out;
  }

  function isPointKind(t) {
    return (
      t &&
      (t.kind === "point" ||
        t.kind === "onLine" ||
        t.kind === "lineIntersect" ||
        t.kind === "freePoint" ||
        t.kind === "midpoint")
    );
  }

  function hebrewList(items) {
    var a = (items || []).filter(Boolean);
    if (!a.length) return "";
    if (a.length === 1) return a[0];
    if (a.length === 2) return a[0] + " ו־" + a[1];
    return a.slice(0, -1).join(", ") + " ו־" + a[a.length - 1];
  }

  function pointTaskName(t) {
    return String((t && (t.point || t.label || t.id)) || "")
      .replace(/→/g, "")
      .toUpperCase();
  }

  function lineEqShortName(t) {
    var side = String((t && t.label) || "").trim();
    if (side && !/^(ישר|הישר)$/.test(side)) return side;
    return "";
  }

  function lineEqFullName(t) {
    var short = lineEqShortName(t);
    return short ? "משוואת הישר " + short : "משוואת הישר";
  }

  function goalEquationPhrase(eqTasks) {
    if (!eqTasks || !eqTasks.length) return "";
    var shorts = eqTasks.map(lineEqShortName).filter(Boolean);
    if (eqTasks.length === 1) {
      return shorts[0] ? "את משוואת הישר " + shorts[0] : "את משוואת הישר";
    }
    if (shorts.length === eqTasks.length) {
      return "את משוואות הישרים " + hebrewList(shorts);
    }
    return "את משוואות הישרים";
  }

  function requiredPartTasks(pack, progress) {
    var part = currentPartText(pack, progress);
    if (!part) return [];
    var map = taskByIdMap(pack);
    return (part.taskIds || [])
      .map(function (id) {
        return map[id];
      })
      .filter(function (u) {
        return u && isRequiredTask(u);
      });
  }

  function taskWorkStarted(progress, t) {
    if (!t || !progress) return false;
    if (progress.partial && progress.partial[t.id]) return true;
    if (progress.lastExpr && progress.lastExpr[t.id]) return true;
    var cf = progress.coords && progress.coords[t.id];
    if (cf && (cf.x || cf.y)) return true;
    var ist = progress.intersect;
    if (ist && ist.taskId === t.id) {
      if (ist.eq || ist.xDone || ist.yDone || ist.plugExpr) return true;
    }
    return false;
  }

  function pathOrientHint(pack, progress, t) {
    if (!pack || !t) return "";
    if (t.kind === "lineMatch" || t.kind === "noIntercept") return "";
    if (t.kind === "parallel" || t.kind === "perpendicular") return "";
    var partTasks = requiredPartTasks(pack, progress);
    if (partTasks.length < 2) return "";
    var undone = partTasks.filter(function (u) {
      return !(progress.done && progress.done[u.id]);
    });
    var undonePts = undone.filter(isPointKind);
    var undoneEq = undone.filter(function (u) {
      return u.kind === "lineEq";
    });
    var undoneArea = undone.filter(function (u) {
      return u.kind === "area";
    });
    var goalEq = goalEquationPhrase(undoneEq);
    var undoneInt = undone.filter(function (u) {
      return u.kind === "point" && u.intercept;
    });
    var undoneMidFind = undone.filter(function (u) {
      return u.kind === "midpoint" && !u.mid;
    });
    if (t.kind === "point" && t.intercept && undoneMidFind.length) {
      return "קודם מצאו את נקודות החיתוך עם הצירים, ואז את אמצע הקטע.";
    }
    if (t.kind === "midpoint" && t.onAxis) {
      var pairO = axisMidPairTasks(pack, progress);
      var midL = String(t.mid || "C").toUpperCase();
      var acO = pairO && progress.coords ? progress.coords[pairO.yEnd.id] || {} : {};
      var bcO = pairO && progress.coords ? progress.coords[pairO.xEnd.id] || {} : {};
      if (pairO && acO.x && !bcO.x) {
        return (
          "יש x של " +
          midpointPointName(pairO.yEnd) +
          ". עכשיו x של " +
          midpointPointName(pairO.xEnd) +
          " מאמצע " +
          midL +
          "."
        );
      }
      if (pairO && bcO.x && !acO.y) {
        return (
          "עכשיו y של " +
          midpointPointName(pairO.yEnd) +
          " מאמצע " +
          midL +
          " (הקצה על ציר x, y = 0)."
        );
      }
      if (pairO && bcO.y && !acO.y) {
        return "יש y של " + midpointPointName(pairO.xEnd) + ". עכשיו y של " + midpointPointName(pairO.yEnd) + " מאמצע.";
      }
      return (
        midL +
        " אמצע (כי AC = CB). " +
        midpointPointName(pairO ? pairO.yEnd : t) +
        " על ציר y → x = 0, אחר כך x של הנקודה על ציר x מאמצע, ואז y."
      );
    }

    if (isPointKind(t) && t.intercept && undoneEq.length) {
      var undoneSlI = undone.filter(function (u) {
        return u.kind === "slope";
      });
      if (undoneSlI.length) {
        return (
          "מצאו את נקודת החיתוך, או קודם את השיפוע המאונך, ואז את " +
          goalEq +
          "."
        );
      }
    }
    if (isPointKind(t) && undoneEq.length) {
      var names = hebrewList(undonePts.map(pointTaskName));
      if (undonePts.length >= 2) {
        return "כדי למצוא " + goalEq + ", קודם מצאו את הנקודות " + names + ".";
      }
      if (undonePts.length === 1) {
        return "מצאו את הנקודה " + names + ", כדי שתוכלו אחר כך למצוא " + goalEq + ".";
      }
    }
    if (isPointKind(t) && !undoneEq.length && undonePts.length >= 2) {
      return "מצאו את הנקודות " + hebrewList(undonePts.map(pointTaskName)) + ".";
    }
    if (t.kind === "slope" && undoneEq.length) {
      var foundPts = partTasks.some(function (u) {
        return isPointKind(u) && progress.done && progress.done[u.id];
      });
      var undoneIntS = undone.filter(function (u) {
        return u.kind === "point" && u.intercept;
      });
      if (undoneIntS.length && !foundPts) {
        return (
          "מצאו את השיפוע המאונך, או קודם את נקודת החיתוך, ואז את " +
          goalEq +
          "."
        );
      }
      if (foundPts) {
        return "עכשיו מצאו את " + taskStepLabel(t) + ", כדי שתוכלו אחר כך למצוא " + goalEq + ".";
      }
      return "כדי למצוא " + goalEq + ", קודם מצאו את השיפוע.";
    }
    if (t.kind === "lineEq") {
      var hadSlope = partTasks.some(function (u) {
        return u.kind === "slope" && progress.done && progress.done[u.id];
      });
      if (hadSlope) {
        return "עכשיו רשמו את " + lineEqFullName(t) + " בעזרת השיפוע והנקודה.";
      }
    }
    if ((t.kind === "segment" || t.kind === "origin" || t.kind === "axis") && undoneArea.length) {
      var lenName = String(t.label || "").replace(/→/g, "") || "האורך";
      return "מצאו את " + lenName + ", כדי שתוכלו אחר כך לחשב את השטח.";
    }
    return "";
  }

  function attachPathOrient(pack, progress, result) {
    if (!result || !result.task || !result.message || result.footCalc) return result;
    if (taskWorkStarted(progress, result.task)) return result;
    var orient = pathOrientHint(pack, progress, result.task);
    if (!orient) return result;
    var msg = String(result.message || "");
    if (msg.indexOf(orient) === 0) return result;
    result.message = orient + " " + msg;
    return result;
  }

  function preferPartTasks(tasks, pack, progress) {
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    if (!ids.length) return tasks;
    var map = taskByIdMap(pack);
    var allowed = {};
    ids.forEach(function (id) {
      allowed[id] = true;
    });
    // צלעות אופציונליות של שטח באותו סעיף — גם אם לא נרשמו ב-taskIds
    (pack.tasks || []).forEach(function (t) {
      if (!t) return;
      ids.forEach(function (id) {
        var a = map[id];
        if (a && a.kind === "area" && optionalIsAreaLeg(t, a)) allowed[t.id] = true;
      });
    });
    var filtered = tasks.filter(function (t) {
      return allowed[t.id];
    });
    if (part && partStepByTask(part, pack)) {
      var focus = currentFocusTask(pack, progress);
      if (focus) {
        var keep = {};
        keep[focus.id] = true;
        if (focus.mid && (midpointOnAxis(focus) || midpointOnLineSpec(focus))) {
          (pack.tasks || []).forEach(function (sib) {
            if (
              sib &&
              sib.kind === "midpoint" &&
              sib.mid &&
              String(sib.mid).toUpperCase() === String(focus.mid).toUpperCase() &&
              (midpointOnAxis(sib) || midpointOnLineSpec(sib))
            ) {
              keep[sib.id] = true;
            }
          });
        }
        if (focus.kind === "point" || focus.kind === "slope") {
          var mixInt = false;
          var mixSl = false;
          ids.forEach(function (id) {
            var u = map[id];
            if (!u) return;
            if (u.kind === "point" && u.intercept) mixInt = true;
            if (u.kind === "slope") mixSl = true;
          });
          if (mixInt && mixSl) {
            ids.forEach(function (id) {
              var u = map[id];
              if (!u || (progress.done && progress.done[u.id])) return;
              if (u.kind === "point" && u.intercept) keep[u.id] = true;
              if (u.kind === "slope") keep[u.id] = true;
            });
          } else if (mixInt) {
            ids.forEach(function (id) {
              var u = map[id];
              if (!u || (progress.done && progress.done[u.id])) return;
              if (u.kind === "point" && u.intercept) keep[u.id] = true;
            });
          }
        }
        (pack.tasks || []).forEach(function (a) {
          if (!a || a.kind !== "area" || !allowed[a.id]) return;
          if (a.id === focus.id || optionalIsAreaLeg(focus, a)) {
            keep[a.id] = true;
            (pack.tasks || []).forEach(function (leg) {
              if (optionalIsAreaLeg(leg, a)) keep[leg.id] = true;
            });
          }
        });
        filtered = filtered.filter(function (t) {
          return keep[t.id];
        });
      }
    }
    return filtered;
  }

  function areaVertsLabel(task) {
    return (task.verts || [])
      .map(function (v) {
        return String(v || "").toUpperCase();
      })
      .join("");
  }

  function pendingAreaTasks(pending, pack, progress) {
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    var areas = (pending || []).filter(function (t) {
      return t.kind === "area";
    });
    if (!ids.length) return areas;
    return areas.filter(function (t) {
      return ids.indexOf(t.id) >= 0;
    });
  }

  function looksLikeAreaDiff(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    return /S(?:△|Δ)?[A-Za-z]{3}.+-.*S(?:△|Δ)?[A-Za-z]{3}/i.test(t);
  }

  function looksLikeAreaSum(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    return /S(?:△|Δ)?[A-Za-z]{3}.+\+.*S(?:△|Δ)?[A-Za-z]{3}/i.test(t);
  }

  function looksLikeAreaAttempt(typed, parsed) {
    if (parsed && parsed.kind === "area") return true;
    var s = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (/^S(?:△|Δ|□|▭)?[A-Za-z]{3,4}/i.test(s)) return true;
    if (looksLikeAreaDiff(s)) return true;
    if (looksLikeAreaSum(s)) return true;
    return false;
  }

  function extractAreaTagFromTyped(typed, parsed) {
    if (parsed && parsed.kind === "area" && parsed.tag) return normAreaTag(parsed.tag);
    var s = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var assign = s.match(/^S(?:△|Δ|□|▭)?([A-Za-z]{3,4})(?:=|:)(.+)$/i);
    if (assign) return normAreaTag(assign[1]);
    if (looksLikeAreaDiff(s)) return null;
    if (looksLikeAreaSum(s)) return null;
    var m = s.match(/^S(?:△|Δ|□|▭)?([A-Za-z]{3,4})/i);
    return m ? normAreaTag(m[1]) : null;
  }

  function wrongTriangleMessage(task, gotTag) {
    var want = areaVertsLabel(task);
    var got = normAreaTag(gotTag) || "?";
    var wantN = want.length;
    var gotN = got.replace(/[^A-Z]/g, "").length;
    if (gotN && wantN && gotN !== wantN) {
      return (
        "רשמתם " +
        (gotN === 3 ? "שטח משולש (3 קודקודים)" : "שטח מלבן (4 קודקודים)") +
        ". כאן צריך שטח " +
        areaFigureWord(task) +
        " — " +
        wantN +
        " קודקודים, למשל s" +
        want +
        "=…."
      );
    }
    return (
      "שם ה" +
      areaFigureWord(task) +
      " לא מדויק (" +
      areaMark(task) +
      got +
      "). חשבו את שטח " +
      areaMark(task) +
      want +
      " — רשמו למשל s" +
      want +
      "=…."
    );
  }

  function cloneMaps(doneMap, partialMap, coordsMap, progress) {
    var nextDone = {};
    Object.keys(doneMap).forEach(function (k) {
      nextDone[k] = true;
    });
    var nextPartial = {};
    Object.keys(partialMap).forEach(function (k) {
      nextPartial[k] = true;
    });
    var nextCoords = {};
    Object.keys(coordsMap).forEach(function (k) {
      nextCoords[k] = { x: !!coordsMap[k].x, y: !!coordsMap[k].y };
    });
    var nextExpr = {};
    Object.keys(progress.lastExpr || {}).forEach(function (k) {
      nextExpr[k] = progress.lastExpr[k];
    });
    return { done: nextDone, partial: nextPartial, coords: nextCoords, lastExpr: nextExpr };
  }

  function finishLinePoint(phit, pack, progress, doneMap, partialMap, coordsMap) {
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.done[phit.id] = true;
    delete maps.partial[phit.id];
    maps.coords[phit.id] = { x: true, y: true };
    delete maps.lastExpr[phit.id];
    var left = remainingRequired(pack, maps.done);
    var out = {
      ok: true,
      solved: left.length === 0,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      task: phit,
      revealPoint: phit.point,
      show: phit.label + pointTaskLabel(phit),
      message: left.length
        ? "נכון. הנקודה " + phit.label + " " + pointTaskLabel(phit) + ". המשיכו."
        : "נכון. הנקודה " + phit.label + " " + pointTaskLabel(phit) + ". כל התשובות נכונות.",
    };
    if (progress.intersect && progress.intersect.taskId === phit.id) {
      out.intersect = {};
    }
    return out;
  }

  function checkLineYEq(typed, parsed, pack, progress, phit, doneMap, partialMap, coordsMap) {
    var rawLine = lineForPointTask(pack, progress, phit);
    if (!rawLine) return null;
    var L = parseLineSpec(rawLine);
    var startX = "x = " + fmtNum(phit.answerX);
    var plugY = "y = " + substYRhs(L, phit.answerX);
    var impPlug = implicitPlugEq(rawLine, "x");
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    if (!maps.coords[phit.id]) maps.coords[phit.id] = { x: false, y: false };

    function acceptEq(eqText, msg) {
      maps.partial[phit.id] = true;
      maps.coords[phit.id].x = true;
      maps.lastExpr[phit.id] = eqText;
      return {
        ok: true,
        solved: false,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: phit,
        show: eqText,
        rawStep: true,
        message: msg,
      };
    }

    function acceptYFound(eqText) {
      maps.coords[phit.id].x = true;
      maps.coords[phit.id].y = true;
      maps.partial[phit.id] = true;
      maps.lastExpr[phit.id] = eqText;
      return {
        ok: true,
        solved: false,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: phit,
        show: eqText,
        message: "נכון. עכשיו רשמו " + phit.label + "(x;y).",
      };
    }

    function acceptPlugOrComputedY(eqText) {
      var shown = String(eqText || "").replace(/[−–—]/g, "-");
      if (yEqGivesCoord(shown, phit.answerY)) return acceptYFound(shown);
      if (/^y\s*=/i.test(shown)) return acceptEq(shown, "נכון. עכשיו חשבו את y.");
      return acceptEq(shown, "נכון. עכשיו בודדו את y (כמו משוואה בנעלם אחד).");
    }

    function acceptImplicitYPlug() {
      var shown = String(typed || "").replace(/[−–—]/g, "-");
      if (rawLine.implicit && typedMatchesImplicitAfterZero(typed, rawLine, "x")) {
        return acceptPlugOrComputedY(shown);
      }
      if (normTyped === normPlugY || (normImp && normTyped === normImp) || (normDrop && normTyped === normDrop)) {
        return acceptPlugOrComputedY(shown);
      }
      return null;
    }

    var normTyped = normEqText(typed);
    var normStartX = normEqText(startX);
    var normPlugY = normEqText(plugY);
    var droppedY = implicitZeroedEq(rawLine, "x");
    var normImp = impPlug ? normEqText(impPlug) : null;
    var normDrop = droppedY ? normEqText(droppedY) : null;
    var prev = progress.lastExpr && progress.lastExpr[phit.id];
    var normPrev = prev ? normEqText(prev) : "";

    if (!prev) {
      if (normTyped === normStartX || (parsed && parsed.kind === "final" && nearNum(parsed.value, phit.answerX))) {
        return acceptEq(startX, "נכון. עכשיו הציבו במשוואה ומצאו את y.");
      }
      if (rawLine.implicit && sameSlopeIntercept(typed, rawLine)) {
        var mapsRY = cloneMaps(doneMap, partialMap, coordsMap, progress);
        mapsRY.partial[phit.id] = true;
        mapsRY.coords[phit.id] = mapsRY.coords[phit.id] || { x: false, y: false };
        mapsRY.coords[phit.id].x = true;
        mapsRY.lastExpr[phit.id] = String(typed || "").replace(/[−–—]/g, "-");
        return {
          ok: true,
          solved: false,
          done: mapsRY.done,
          partial: mapsRY.partial,
          coords: mapsRY.coords,
          lastExpr: mapsRY.lastExpr,
          task: phit,
          show: mapsRY.lastExpr[phit.id],
          rawStep: true,
          lineEqDisplay: lineEqDisplayFromText(typed),
          message: "אפשר לסדר את המשוואה — עכשיו הציבו x = 0 ומצאו את y.",
        };
      }
      var skipPlug0 = acceptImplicitYPlug();
      if (skipPlug0) return skipPlug0;
    }

    if (prev && (normPrev === normStartX || eqIsKnownAxisValue(prev, "x"))) {
      var afterX0 = acceptImplicitYPlug();
      if (afterX0) return afterX0;
    }

    if (rawLine.implicit && prev && sameSlopeIntercept(prev, rawLine)) {
      if (normTyped === normStartX) {
        return acceptEq(startX, "נכון. עכשיו הציבו במשוואה ומצאו את y.");
      }
      var afterRearr = acceptImplicitYPlug();
      if (afterRearr) return afterRearr;
    }

    if (prev && /^y\s*=/i.test(String(prev))) {
      var plugNorm = normEqText(prev);
      var typedAsY =
        /^y\s*=/i.test(String(typed || "")) ? String(typed || "").replace(/[−–—]/g, "-") : null;
      if (!typedAsY && parsed && parsed.kind === "final" && parsed.value != null && !parsed.tag) {
        typedAsY = "y = " + fmtNum(parsed.value);
      }
      if (!typedAsY && /^=\s*-?\d/.test(String(typed || "").trim())) {
        typedAsY = "y " + String(typed || "").trim();
      }
      if (typedAsY) {
        var plugRes = checkPlugYStep(prev, typedAsY);
          if (plugRes.ok) {
          var prettyPlug = prettyRearrangeStep(typedAsY);
          if (isSolvedYText(typedAsY)) {
            var yVal = evalMaybeExpr(lastEqStage(prettyPlug));
            if (yVal != null && nearNum(yVal, phit.answerY)) {
              maps.coords[phit.id].y = true;
              maps.partial[phit.id] = true;
              maps.lastExpr[phit.id] = prettyPlug;
              return {
                ok: true,
                solved: false,
                done: maps.done,
                partial: maps.partial,
                coords: maps.coords,
                lastExpr: maps.lastExpr,
                task: phit,
                show: prettyPlug,
                message: "נכון. עכשיו רשמו " + phit.label + "(x;y).",
              };
            }
          }
          if (plugNorm !== normEqText(prettyPlug)) {
            return acceptEq(prettyPlug, plugRes.message || "צעד חוקי. המשיכו לחשב את y.");
          }
        }
      }
    }

    if (
      rawLine.implicit &&
      prev &&
      (normPrev === normImp ||
        normPrev === normPlugY ||
        (normDrop && normPrev === normDrop) ||
        typedMatchesImplicitAfterZero(prev, rawLine, "x") ||
        (/[yY]/.test(String(prev)) && /=/.test(String(prev)) && !/[xX]/.test(String(prev))))
    ) {
      var shownY = String(typed || "").replace(/[−–—]/g, "-");
      var resY = checkLinearUnknownStep(prev, typed, "y");
      if (resY && resY.ok) {
        var pretty = shownY;
        var yGot = null;
        if (isSolvedYText(typed)) yGot = evalMaybeExpr(lastEqStage(pretty));
        if (yGot == null && resY.solved) {
          var Alg = global.DoctematicaAlgebra;
          yGot = Alg && Alg.solutionOf && resY.equation ? Alg.solutionOf(resY.equation) : evalMaybeExpr(lastEqStage(pretty));
        }
        if (yGot != null && nearNum(phit.answerY, yGot)) {
          maps.coords[phit.id].y = true;
          maps.partial[phit.id] = true;
          maps.lastExpr[phit.id] = pretty;
          return {
            ok: true,
            solved: false,
            done: maps.done,
            partial: maps.partial,
            coords: maps.coords,
            lastExpr: maps.lastExpr,
            task: phit,
            show: pretty,
            message: "נכון. עכשיו רשמו " + phit.label + "(x;y).",
          };
        }
        return acceptEq(pretty, resY.message || "צעד חוקי. המשיכו לבודד את y.");
      }
    }

    return null;
  }

  function checkNoIntercept(typed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var hits = preferPartTasks(
      pending.filter(function (t) {
        return t.kind === "noIntercept";
      }),
      pack,
      progress
    );
    if (!hits.length || !looksLikeNoIntercept(typed)) return null;
    var phit = hits[0];
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.done[phit.id] = true;
    delete maps.partial[phit.id];
    var left = remainingRequired(pack, maps.done);
    var ax = String(phit.axis || "x").toLowerCase() === "y" ? "y" : "x";
    var show = "אין חיתוך עם ציר " + ax;
    return {
      ok: true,
      solved: left.length === 0,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      task: phit,
      show: show,
      message: left.length
        ? "נכון. " + (phit.reason || "הישר מקביל לציר — אין נקודת חיתוך.") + " המשיכו."
        : "נכון. " + (phit.reason || "כל התשובות נכונות."),
    };
  }

  function checkLineXEq(typed, pack, progress, phit, doneMap, partialMap, coordsMap) {
    var rawLine = lineForPointTask(pack, progress, phit);
    if (!rawLine) return null;
    var L = parseLineSpec(rawLine);
    var start = startPlugYEq(rawLine, phit.answerY);
    var prev = (progress.lastExpr && progress.lastExpr[phit.id]) || start;
    var A = global.DoctematicaAlgebra;
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    if (!maps.coords[phit.id]) maps.coords[phit.id] = { x: false, y: !!progress.coords && progress.coords[phit.id] && progress.coords[phit.id].y };
    maps.coords[phit.id].y = true;

    function acceptEq(eqText, msg) {
      maps.partial[phit.id] = true;
      maps.lastExpr[phit.id] = eqText;
      return {
        ok: true,
        solved: false,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: phit,
        show: eqText,
        rawStep: true,
        message: msg,
      };
    }

    var normTyped = String(typed || "").replace(/[−–—]/g, "-").replace(/\s+/g, "");
    var normStart = String(start).replace(/[−–—]/g, "-").replace(/\s+/g, "");
    var normPrev = String(prev).replace(/[−–—]/g, "-").replace(/\s+/g, "");
    if (!(progress.lastExpr && progress.lastExpr[phit.id])) {
      if (nearNum(phit.answerY, 0) && /^y=0$/i.test(normTyped)) {
        return acceptEq("y = 0", "נכון. עכשיו הציבו y = 0 במשוואת הישר " + prettyLineEq(rawLine) + ".");
      }
      if (normTyped === normStart || typedMatchesImplicitAfterZero(typed, rawLine, "y")) {
        return acceptEq(
          typedMatchesImplicitAfterZero(typed, rawLine, "y")
            ? String(typed || "").replace(/[−–—]/g, "-")
            : start,
          "נכון. עכשיו פתרו את המשוואה (כמו במשוואות בנעלם אחד)."
        );
      }
      if (rawLine.implicit && sameSlopeIntercept(typed, rawLine)) {
        var mapsRX = cloneMaps(doneMap, partialMap, coordsMap, progress);
        mapsRX.partial[phit.id] = true;
        if (!mapsRX.coords[phit.id]) mapsRX.coords[phit.id] = { x: false, y: !!progress.coords && progress.coords[phit.id] && progress.coords[phit.id].y };
        mapsRX.coords[phit.id].y = true;
        mapsRX.lastExpr[phit.id] = String(typed || "").replace(/[−–—]/g, "-");
        return {
          ok: true,
          solved: false,
          done: mapsRX.done,
          partial: mapsRX.partial,
          coords: mapsRX.coords,
          lastExpr: mapsRX.lastExpr,
          task: phit,
          show: mapsRX.lastExpr[phit.id],
          rawStep: true,
          lineEqDisplay: lineEqDisplayFromText(typed),
          message: "אפשר לסדר את המשוואה — עכשיו הציבו y = 0 ופתרו עבור x.",
        };
      }
    } else if (/^y=0$/i.test(normPrev) || eqIsBareAxis(prev, "y")) {
      if (normTyped === normStart || typedMatchesImplicitAfterZero(typed, rawLine, "y")) {
        return acceptEq(
          typedMatchesImplicitAfterZero(typed, rawLine, "y")
            ? String(typed || "").replace(/[−–—]/g, "-")
            : start,
          "נכון. עכשיו פתרו את המשוואה (כמו במשוואות בנעלם אחד)."
        );
      }
      if (L && L.vertical != null) {
        var vx = fmtNum(L.vertical);
        if (normTyped === "x=" + vx.replace(/-/g, "-")) {
          return acceptEq("x = " + vx, "נכון. עכשיו רשמו את הנקודה (x;y).");
        }
      }
    } else if (rawLine.implicit && sameSlopeIntercept(prev, rawLine) && /^y=0$/i.test(normTyped)) {
      return acceptEq(start, "נכון. עכשיו פתרו את המשוואה (כמו במשוואות בנעלם אחד).");
    }

    if (!A || typeof A.checkStep !== "function") {
      return { ok: false, message: "פתרו את המשוואה " + start + "." };
    }
    var algebraPrev = eqIsBareAxis(prev, "y") ? start : prev;
    var res = A.checkStep(algebraPrev, typed);
    if (!res.ok) {
      if (res.same && !(progress.lastExpr && progress.lastExpr[phit.id])) {
        return acceptEq(start, "נכון. עכשיו פתרו את המשוואה (כמו במשוואות בנעלם אחד).");
      }
      if (res.same) {
        return { ok: false, message: res.message };
      }
      var tryFromStart = A.checkStep(start, typed);
      if (tryFromStart && tryFromStart.ok) res = tryFromStart;
      else return { ok: false, message: res.message || "הצעד לא שקול למשוואה " + start + "." };
    }
    var pretty = prettyRearrangeStep(String(typed || "").replace(/[−–—]/g, "-"));
    if (res.solved || (A.isSolvedText && A.isSolvedText(typed))) {
      var sol = A.solutionOf ? A.solutionOf(res.equation || A.parseEquation(typed)) : phit.answerX;
      if (sol == null && res.equation) sol = res.equation.right && res.equation.right.b;
      if (sol != null && !nearNum(sol, phit.answerX)) {
        return { ok: false, message: "x עדיין לא מדויק. בדקו את הצעד במשוואה." };
      }
      maps.coords[phit.id].x = true;
      maps.partial[phit.id] = true;
      maps.lastExpr[phit.id] = pretty;
      return {
        ok: true,
        solved: false,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: phit,
        show: pretty,
        message: "נכון. עכשיו רשמו " + phit.label + "(x;y).",
      };
    }
    return acceptEq(pretty, res.message || "צעד חוקי. המשיכו לבודד את x.");
  }

  function attachPointRoute(hit, progress, taskId, route) {
    if (!hit) return hit;
    var next = Object.assign({}, progress.pointRoute || {});
    next[taskId] = route;
    hit.pointRoute = next;
    return hit;
  }

  function checkLineEqOnThru(which, typed, parsed, pack, progress, phit, doneMap, partialMap, coordsMap) {
    var thru = linesThroughTask(pack, phit).filter(function (item) {
      return lineItemRevealed(progress, item);
    });
    var raw = lineForPointTask(pack, progress, phit);
    if (!thru.length && raw) {
      thru = [{ key: phit.lineKey || null, line: raw }];
    }
    var pref = preferredInterceptLine(pack, phit, progress);
    var ordered = [];
    if (pref) ordered.push(pref);
    thru.forEach(function (e) {
      if (!pref || e.key !== pref.key) ordered.push(e);
    });
    var saved = phit.lineKey;
    var i;
    var hit;
    for (i = 0; i < ordered.length; i++) {
      if (ordered[i].key) phit.lineKey = ordered[i].key;
      hit =
        which === "y"
          ? checkLineYEq(typed, parsed, pack, progress, phit, doneMap, partialMap, coordsMap)
          : checkLineXEq(typed, pack, progress, phit, doneMap, partialMap, coordsMap);
      if (hit) {
        if (ordered[i].key && intersectLineEntry(pack, ordered[i].key)) {
          attachPointRoute(hit, progress, phit.id, { mode: "intercept", lineKey: ordered[i].key });
        }
        phit.lineKey = saved;
        return hit;
      }
    }
    phit.lineKey = saved;
    return null;
  }

  function checkLinePoint(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var pts = preferPartTasks(
      pending.filter(function (t) {
        return t.kind === "point";
      }),
      pack,
      progress
    );
    var phit = pts[0];
    if (!phit) return null;
    if (progress.intersect && progress.intersect.taskId === phit.id && !progress.intersect.yDone) {
      return null;
    }
    var thruPt = linesThroughTask(pack, phit);
    if (thruPt.length >= 2 && matchEquatePair(typed, pack, progress, thruPt)) {
      return null;
    }
    var rawLine = lineForPointTask(pack, progress, phit);
    if (!rawLine) return null;
    var miss = String(phit.missing || "").toLowerCase();
    var L = parseLineSpec(rawLine);
    var cfLine = (progress.coords && progress.coords[phit.id]) || {};
    if (parsed && parsed.kind === "point") {
      var ptTag = String(phit.point || phit.label || "").toUpperCase();
      var tagOk = !parsed.tag || normGeoTag(parsed.tag) === normGeoTag(ptTag);
      if (
        tagOk &&
        parsed.point &&
        nearNum(parsed.point.x, phit.answerX) &&
        nearNum(parsed.point.y, phit.answerY)
      ) {
        return finishLinePoint(phit, pack, progress, doneMap, partialMap, coordsMap);
      }
      return null;
    }
    var wrongPlug = wrongFigureLinePlugResult(typed, pack, progress, phit);
    if (wrongPlug) return wrongPlug;
    if (cfLine.x && cfLine.y) return null;
    if ((miss === "x" || miss === "both") && !cfLine.y && yEqGivesCoord(typed, phit.answerY)) {
      var mapsKnownY = cloneMaps(doneMap, partialMap, coordsMap, progress);
      if (!mapsKnownY.coords[phit.id]) mapsKnownY.coords[phit.id] = { x: false, y: false };
      mapsKnownY.coords[phit.id].y = true;
      mapsKnownY.partial[phit.id] = true;
      mapsKnownY.lastExpr[phit.id] = "y = " + fmtNum(phit.answerY);
      return {
        ok: true,
        solved: false,
        done: mapsKnownY.done,
        partial: mapsKnownY.partial,
        coords: mapsKnownY.coords,
        lastExpr: mapsKnownY.lastExpr,
        task: phit,
        show: mapsKnownY.lastExpr[phit.id],
        rawStep: true,
        message:
          "נכון. הציבו y = " +
          fmtNum(phit.answerY) +
          " במשוואת הישר " +
          prettyLineEq(L) +
          " ופתרו עבור x.",
      };
    }
    if ((miss === "y" || miss === "both") && !cfLine.x && /^x\s*=/i.test(String(typed || "").trim())) {
      var xKnown = evalMaybeExpr(lastEqStage(typed));
      if (xKnown != null && nearNum(xKnown, phit.answerX)) {
        var mapsKnownX = cloneMaps(doneMap, partialMap, coordsMap, progress);
        if (!mapsKnownX.coords[phit.id]) mapsKnownX.coords[phit.id] = { x: false, y: false };
        mapsKnownX.coords[phit.id].x = true;
        mapsKnownX.partial[phit.id] = true;
        mapsKnownX.lastExpr[phit.id] = "x = " + fmtNum(phit.answerX);
        return {
          ok: true,
          solved: false,
          done: mapsKnownX.done,
          partial: mapsKnownX.partial,
          coords: mapsKnownX.coords,
          lastExpr: mapsKnownX.lastExpr,
          task: phit,
          show: mapsKnownX.lastExpr[phit.id],
          rawStep: true,
          message:
            "נכון. הציבו x = " +
            fmtNum(phit.answerX) +
            " במשוואת הישר " +
            prettyLineEq(L) +
            " וחשבו את y.",
        };
      }
    }
    // יודעים x (תאום / נתון) — מוצאים y מהישר
    // יודעים x (תאום / נתון) — מוצאים y מהישר
    if (cfLine.x && !cfLine.y) {
      var yAfterX = checkLineEqOnThru("y", typed, parsed, pack, progress, phit, doneMap, partialMap, coordsMap);
      if (yAfterX) return yAfterX;
    }
    if (cfLine.y && !cfLine.x) {
      var xAfterY = checkLineEqOnThru("x", typed, parsed, pack, progress, phit, doneMap, partialMap, coordsMap);
      if (xAfterY) return xAfterY;
    }
    if (miss === "both" && phit.twinY && !phit.twinX && !cfLine.y && looksLikeLinearEq(typed)) {
      var xSkipY = checkLineEqOnThru("x", typed, parsed, pack, progress, phit, doneMap, partialMap, coordsMap);
      if (xSkipY) return xSkipY;
    }
    if (miss === "y" && phit.intercept === "y") {
      var yIntHit = checkLineEqOnThru("y", typed, parsed, pack, progress, phit, doneMap, partialMap, coordsMap);
      if (yIntHit) return yIntHit;
    }
    if (miss === "y" && looksLikeLinearEq(typed)) {
      if (rawLine.implicit && sameSlopeIntercept(typed, rawLine)) {
        var mapsR = cloneMaps(doneMap, partialMap, coordsMap, progress);
        mapsR.partial[phit.id] = true;
        mapsR.lastExpr[phit.id] = String(typed || "").replace(/[−–—]/g, "-");
        return {
          ok: true,
          solved: false,
          done: mapsR.done,
          partial: mapsR.partial,
          coords: mapsR.coords,
          lastExpr: mapsR.lastExpr,
          task: phit,
          show: mapsR.lastExpr[phit.id],
          rawStep: true,
          lineEqDisplay: lineEqDisplayFromText(typed),
          message: "אפשר לסדר את המשוואה — עכשיו הציבו x = 0 ומצאו את y.",
        };
      }
      if (cfLine.x) {
        return {
          ok: false,
          message:
            "יודעים x=" +
            fmtNum(phit.answerX) +
            ". הציבו במשוואת הישר " +
            prettyLineEq(L) +
            ": y = " +
            substYRhs(L, phit.answerX) +
            ".",
        };
      }
      return null;
    }
    if (miss === "x" && !phit.twinX) {
      var normXIn = normEqText(typed);
      var yZeroTry = /^y=0$/i.test(normXIn);
      var hasXProg = !!(progress.lastExpr && progress.lastExpr[phit.id]);
      if (looksLikeLinearEq(typed) || yZeroTry || hasXProg) {
        var xLineHit = checkLineEqOnThru("x", typed, parsed, pack, progress, phit, doneMap, partialMap, coordsMap);
        if (xLineHit) return xLineHit;
      }
    }
    if (
      miss === "x" &&
      !phit.twinX &&
      !(progress.lastExpr && progress.lastExpr[phit.id]) &&
      !(progress.coords && progress.coords[phit.id] && progress.coords[phit.id].x) &&
      parsed &&
      parsed.kind !== "point" &&
      parsed.value != null
    ) {
      return {
        ok: false,
        message:
          "יודעים y=" +
          fmtNum(phit.answerY) +
          ". הציבו במשוואת הישר " +
          prettyLineEq(L) +
          " ופתרו עבור x (כמו משוואה בנעלם אחד), למשל " +
          startPlugYEq(L, phit.answerY) +
          ".",
      };
    }
    if (miss === "y" && parsed && parsed.kind === "diff" && parsed.value != null && nearNum(parsed.value, phit.answerY)) {
      var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
      maps.partial[phit.id] = true;
      if (!maps.coords[phit.id]) maps.coords[phit.id] = { x: true, y: false };
      maps.coords[phit.id].x = true;
      var show = "y = " + (parsed.displayExpr || substYRhs(L, phit.answerX));
      maps.lastExpr[phit.id] = show;
      return {
        ok: true,
        solved: false,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: phit,
        show: show,
        message: "נכון. עכשיו חשבו: y = " + fmtNum(phit.answerY) + ".",
      };
    }
    return null;
  }

  function parseYesNo(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (/נמק/.test(t)) t = t.split(/נמק/)[0];
    t = t.replace(/[.:!?]/g, "");
    if (!t) return null;
    if (/^(כן|yes)$/i.test(t) || /^(עלהישר|נמצאת|נמצא)$/.test(t)) return true;
    if (/עלהישר|נמצאתעלהישר|נמצאעלהישר/.test(t) && !/^לא/.test(t)) return true;
    if (/^(לא|no)$/i.test(t) || /^אינ[הן]/.test(t) || /לאעלהישר|אינהעלהישר/.test(t)) return false;
    return null;
  }

  function stripReason(s) {
    var t = String(s || "");
    var m = t.split(/נמק\s*:?/);
    if (m.length < 2) return "";
    return m.slice(1).join("נמק").replace(/^\s*[:：]\s*/, "").trim();
  }

  function looksLikeReason(s) {
    var r = stripReason(s);
    if (r && r.length >= 2) return true;
    return /(?:^|\s)(?:כי|לכן|משום)/.test(String(s || ""));
  }

  function evalMaybeExpr(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/[·×]/g, "*")
      .replace(/\s+/g, "");
    if (!t || /^[yY]$/.test(t)) return null;
    return evalArithLoose(t);
  }

  function isSolvedYText(text) {
    var A = global.DoctematicaAlgebra;
    if (A && typeof A.isolatedRhsKind === "function") {
      return A.isolatedRhsKind(text, "y") === "value";
    }
    return false;
  }

  /** y = 2 after a horizontal plug — the value is already there, not another compute step. */
  function yEqGivesCoord(text, wantY) {
    var t = String(text || "").trim();
    if (!/^y\s*=/i.test(t)) return false;
    if (exprStillOpen(lastEqStage(t))) return false;
    var v = evalMaybeExpr(lastEqStage(t));
    return v != null && wantY != null && isFinite(wantY) && nearNum(v, wantY);
  }

  /** algebra.js tokenizes x, not y — rewrite y = … as x = … for checkStep on plug steps */
  function yEqAsXEq(text) {
    return String(text || "").trim().replace(/^y\s*=/i, "x =");
  }

  function plugYEqRhs(text) {
    var m = String(text || "")
      .trim()
      .match(/^y\s*=\s*(.+)$/i);
    return m ? m[1].trim() : null;
  }

  function checkPlugYStep(prevText, nextText) {
    var A = global.DoctematicaAlgebra;
    if (normEqText(prevText) === normEqText(nextText)) {
      return { ok: false, message: "זו אותה משוואה. כתבו צעד חדש." };
    }
    var nextRhs = plugYEqRhs(nextText);
    if (!nextRhs) {
      return { ok: false, message: "כתבו y = …" };
    }
    var prevRhs = plugYEqRhs(prevText);
    var prevVal = prevRhs != null ? evalMaybeExpr(prevRhs) : null;
    var nextVal = evalMaybeExpr(nextRhs);
    if (prevVal != null && nextVal != null) {
      if (!nearNum(prevVal, nextVal)) {
        return { ok: false, message: "החישוב לא שקול. בדקו את האריתמטיקה." };
      }
      return {
        ok: true,
        message: isSolvedYText(nextText)
          ? "זהו y."
          : "צעד חוקי. המשיכו לחשב את y.",
      };
    }
    if (A && typeof A.checkStep === "function") {
      return A.checkStep(yEqAsXEq(prevText), yEqAsXEq(nextText));
    }
    return { ok: false, message: "בדקו את ההצבה והחישוב." };
  }

  function exprStillOpen(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/[·×]/g, "*")
      .replace(/\s+/g, "");
    if (!t) return false;
    while (t.length > 2 && t.charAt(0) === "(" && t.charAt(t.length - 1) === ")") {
      t = t.slice(1, -1);
    }
    if (/^-?\d+(?:\.\d+)?(?:\/-?\d+)?$/.test(t)) return false;
    return /[+\-*/()]/.test(t.replace(/^-/, ""));
  }

  function onLinePlugReason() {
    return "הצבה של האיקס וה-y לבדיקת שוויון בין הצדדים";
  }

  function reasonChoices(task) {
    if (task && task.reasonChoices && task.reasonChoices.length) return task.reasonChoices.slice();
    if (task && task.on) {
      return ["הערכים משני הצדדים אותו הדבר", "ה־y שחישבנו מתאים לנקודה"];
    }
    return ["הערכים משני הצדדים לא אותו הדבר", "ה־y שחישבנו לא מתאים לנקודה"];
  }

  function onLinePlugged(progress, id) {
    return !!(progress && progress.partial && progress.partial[id] && progress.lastExpr && progress.lastExpr[id]);
  }

  function lastEqStage(s) {
    var parts = String(s || "").split("=");
    return String(parts[parts.length - 1] || "").trim();
  }

  function reasonLine(task) {
    if (task && task.reason) return "נמק: " + task.reason;
    if (task && task.on) return "נמק: שני האגפים שווים (או y מתאים), לכן הנקודה על הישר.";
    return "נמק: האגפים לא שווים (או y לא מתאים), לכן הנקודה לא על הישר.";
  }

  function finishOnLineTask(phit, pack, progress, doneMap, partialMap, coordsMap, show, msg) {
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.done[phit.id] = true;
    delete maps.partial[phit.id];
    maps.coords[phit.id] = { x: true, y: true };
    var left = remainingRequired(pack, maps.done);
    return {
      ok: true,
      solved: left.length === 0,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      task: phit,
      show: show,
      message: msg || (left.length ? "נכון. המשיכו." : "נכון. כל התשובות נכונות."),
    };
  }

  function onLineAfterCalc(phit, pack, progress, doneMap, partialMap, coordsMap, show) {
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.partial[phit.id] = true;
    maps.coords[phit.id] = maps.coords[phit.id] || { x: false, y: false };
    maps.coords[phit.id].x = true;
    maps.lastExpr[phit.id] = show;
    return {
      ok: true,
      solved: false,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      chain: false,
      task: phit,
      show: show,
      message:
        "נכון. עכשיו ענו כן או לא: האם הנקודה " +
        phit.label +
        " על הישר?",
    };
  }

  function eqLeftToken(s) {
    var t = String(s || "").replace(/\s+/g, "");
    if (/^[xyXY]$/.test(t)) return t;
    if (/^[A-Za-z][xyXY]$/.test(t)) return t.charAt(1);
    return t.replace(/^[A-Za-z]:?/, "");
  }

  function onLinePointFromTag(tag) {
    var t = normGeoTag(tag);
    if (!t || t === "X" || t === "Y") return "";
    if (/^[A-Z][XY]$/.test(t)) return t.charAt(0);
    return t;
  }

  function pickOnLineTask(pts, typed, pack, progress) {
    if (!pts || !pts.length) return null;
    var waitingYes = pts.filter(function (t) {
      var c = (progress.coords && progress.coords[t.id]) || {};
      return c.x && !c.y;
    });
    if (waitingYes.length) return waitingYes[0];
    var waitingReason = pts.filter(function (t) {
      var c = (progress.coords && progress.coords[t.id]) || {};
      return c.x && c.y;
    });
    if (waitingReason.length) return waitingReason[0];
    if (pts.length === 1) return pts[0];
    var raw = String(typed || "").replace(/[−–—]/g, "-");
    var sides = raw.split(/≠|!=|=/);
    if (sides.length >= 2) {
      var leftTok = eqLeftToken(sides[0]);
      var isY = /^[yY]$/.test(leftTok);
      var rhs = sides[1];
      var rhsV = evalMaybeExpr(rhs);
      var leftV = evalMaybeExpr(eqLeftToken(sides[0]) === leftTok && !isY ? sides[0] : leftTok);
      var plugged = pts.filter(function (t) {
        return onLinePlugged(progress, t.id);
      });
      if (!exprStillOpen(rhs) && plugged.length) return plugged[0];
      var matched = pts.filter(function (t) {
        var Lt = parseLineSpec(t.line || pack.line);
        if (!Lt) return false;
        var ly = lineYAt(Lt, t.answerX);
        if (rhsV == null || !nearNum(rhsV, ly)) return false;
        if (isY && exprStillOpen(rhs)) return true;
        if (leftV != null && nearNum(leftV, t.answerY) && exprStillOpen(rhs)) return true;
        return false;
      });
      if (matched.length) return matched[0];
    }
    var started = pts.filter(function (t) {
      return onLinePlugged(progress, t.id);
    });
    return (started.length ? started : pts)[0];
  }

  function checkOnLine(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var pts = preferPartTasks(
      pending.filter(function (t) {
        return t.kind === "onLine";
      }),
      pack,
      progress
    );
    var pointTag = onLinePointFromTag(parsed && parsed.tag);
    if (pointTag) {
      pts = pts.filter(function (t) {
        return taskMatchesTag(t, pointTag);
      });
    }
    var phit = pickOnLineTask(pts, typed, pack, progress);
    if (!phit) return null;
    var part = currentPartText(pack, progress);
    var L = parseLineSpec(phit.line || (part && part.line) || pack.line);
    if (!L) return null;
    var lineY = lineYAt(L, phit.answerX);
    var on = !!phit.on;
    var raw = String(typed || "").replace(/[−–—]/g, "-");
    var cf = (progress.coords && progress.coords[phit.id]) || {};
    var calcDone = !!(cf.x || (coordsMap[phit.id] && coordsMap[phit.id].x));
    var verdictDone = !!(cf.y || (coordsMap[phit.id] && coordsMap[phit.id].y));
    var yn = parseYesNo(raw);

    var wrongOn = wrongFigureLinePlugResult(typed, pack, progress, phit);
    if (wrongOn && !yn) return wrongOn;

    if (yn != null) {
      if (!calcDone) {
        return {
          ok: false,
          message:
            "קודם הציבו וחשבו. דרך אחת: " +
            fmtNum(phit.answerY) +
            " = " +
            substYRhs(L, phit.answerX) +
            ". דרך שנייה: y = " +
            substYRhs(L, phit.answerX) +
            ".",
        };
      }
      if (yn !== on) {
        return {
          ok: false,
          message: on
            ? "לפי החישוב הנקודה כן על הישר. ענו כן."
            : "לפי החישוב הנקודה לא על הישר. ענו לא.",
        };
      }
      var mapsY = cloneMaps(doneMap, partialMap, coordsMap, progress);
      mapsY.coords[phit.id] = mapsY.coords[phit.id] || { x: true, y: false };
      mapsY.coords[phit.id].x = true;
      mapsY.coords[phit.id].y = true;
      mapsY.partial[phit.id] = true;
      var showYn = yn ? "כן" : "לא";
      mapsY.lastExpr[phit.id] = showYn;
      return {
        ok: true,
        solved: false,
        done: mapsY.done,
        partial: mapsY.partial,
        coords: mapsY.coords,
        lastExpr: mapsY.lastExpr,
        chain: false,
        task: phit,
        show: showYn,
        message: "נכון. נמקו למה, אפשר לבחור אפשרות.",
      };
    }

    if (calcDone && !verdictDone) {
      return { ok: false, message: "בחרו כן או לא." };
    }
    if (calcDone && verdictDone) {
      return { ok: false, message: "נמקו בתיבה למטה, או בחרו אפשרות." };
    }

    var neq = /≠|!=/.test(raw);
    var sides = raw.split(/≠|!=|=/);
    var hasEq = raw.indexOf("=") >= 0 || neq;
    if (hasEq && sides.length >= 2) {
      var leftTok = eqLeftToken(sides[0]);
      var leftRaw = leftTok;
      var rightRaw = lastEqStage(raw.replace(/≠|!=/g, "="));
      var leftV = /^[yY]$/.test(leftTok) ? null : evalMaybeExpr(leftTok);
      var rightV = evalMaybeExpr(rightRaw);
      var leftIsY = /^[yY]$/.test(leftTok);
      var midRaw = sides[1];
      var midV = evalMaybeExpr(midRaw);
      var plugged = onLinePlugged(progress, phit.id);
      var plugShowY = "y = " + substYRhs(L, phit.answerX);
      var plugShowBoth = fmtNum(phit.answerY) + " = " + substYRhs(L, phit.answerX);
      var calcShowY = "y = " + fmtNum(lineY);
      var calcShowBoth = fmtNum(phit.answerY) + " = " + fmtNum(lineY);

      function acceptPlug(show, nextShow, bothSides) {
        var mapsP = cloneMaps(doneMap, partialMap, coordsMap, progress);
        mapsP.partial[phit.id] = true;
        mapsP.lastExpr[phit.id] = show;
        return {
          ok: true,
          solved: false,
          done: mapsP.done,
          partial: mapsP.partial,
          coords: mapsP.coords,
          lastExpr: mapsP.lastExpr,
          chain: false,
          plugStep: !!bothSides,
          task: phit,
          show: show,
          message: "נכון. עכשיו חשבו: " + nextShow,
        };
      }

      if (leftIsY) {
        if (exprStillOpen(midRaw) && midV != null && nearNum(midV, lineY)) {
          return acceptPlug(plugShowY, calcShowY, false);
        }
        if (rightV != null && !exprStillOpen(rightRaw) && nearNum(rightV, lineY)) {
          if (!plugged) {
            return { ok: false, message: "קודם הציבו: " + plugShowY + ", ואז חשבו." };
          }
          return onLineAfterCalc(phit, pack, progress, doneMap, partialMap, coordsMap, calcShowY);
        }
        if (rightV != null && !nearNum(rightV, lineY) && !(exprStillOpen(midRaw) && midV != null && nearNum(midV, lineY))) {
          return { ok: false, message: "ההצבה של x לא מדויקת. בדקו את האגף הימני." };
        }
        if (rightV == null && exprStillOpen(midRaw)) {
          return { ok: false, message: "ההצבה של x לא מדויקת. בדקו את האגף הימני." };
        }
      }

      if (leftV != null && !nearNum(leftV, phit.answerY) && !nearNum(leftV, lineY)) {
        return {
          ok: false,
          message: "האגף השמאלי צריך להיות שיעור ה־y של הנקודה " + phit.label + ".",
        };
      }
      if (leftV != null && nearNum(leftV, phit.answerY)) {
        if (exprStillOpen(midRaw) && midV != null && nearNum(midV, lineY) && (!plugged || exprStillOpen(rightRaw))) {
          return acceptPlug(plugShowBoth, calcShowBoth, true);
        }
        if (!exprStillOpen(rightRaw) && rightV != null) {
          var okCalc = nearNum(leftV, phit.answerY) && nearNum(rightV, lineY);
          if (!okCalc) {
            return {
              ok: false,
              message: "ההצבה לא מדויקת. הציבו x ו־y במשוואת הישר, או הציבו רק x וחשבו y.",
            };
          }
          if (!plugged) {
            return { ok: false, message: "קודם הציבו: " + plugShowBoth + ", ואז חשבו." };
          }
          return onLineAfterCalc(phit, pack, progress, doneMap, partialMap, coordsMap, calcShowBoth);
        }
        if (leftV != null && rightV == null && sides.length === 2) {
          if (!nearNum(leftV, phit.answerY)) {
            return {
              ok: false,
              message: "האגף השמאלי צריך להיות y של " + phit.label + " (" + fmtNum(phit.answerY) + ").",
            };
          }
          return acceptPlug(plugShowBoth, calcShowBoth, true);
        }
      }
    }

    if (parsed && parsed.kind === "diff" && parsed.value != null && onLinePlugged(progress, phit.id)) {
      return {
        ok: false,
        message: "רשמו את השוויון המלא: " + fmtNum(phit.answerY) + " = " + fmtNum(lineY) + ".",
      };
    }

    return {
      ok: false,
      message:
        "כדי לבדוק אם " +
        phit.label +
        " על הישר: הציבו x ו־y והראו שוויון/אי־שוויון בין האגפים, או הציבו רק x וחשבו y.",
    };
  }

  function checkYesNo(typed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var hits = preferPartTasks(
      (pending || []).filter(function (t) {
        return t.kind === "yesNo";
      }),
      pack,
      progress
    );
    if (!hits.length) return null;
    var task = hits[0];
    var yn = parseYesNo(typed);
    if (yn == null) return null;
    var want = !!task.answer;
    if (yn !== want) {
      return {
        ok: false,
        message: want ? "התשובה היא כן." : "התשובה היא לא.",
      };
    }
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.done[task.id] = true;
    delete maps.partial[task.id];
    var show = yn ? "כן" : "לא";
    maps.lastExpr[task.id] = show;
    var left = remainingRequired(pack, maps.done);
    return {
      ok: true,
      solved: left.length === 0,
      done: maps.done,
      partial: maps.partial,
      coords: maps.coords,
      lastExpr: maps.lastExpr,
      task: task,
      show: show,
      rawStep: true,
      message: left.length ? "נכון. המשיכו." : "נכון.",
    };
  }

  function lineAsk(pack, progress) {
    if (!pack) return null;
    progress = progress || { done: {}, coords: {} };
    var ynFocus = currentFocusTask(pack, progress);
    if (ynFocus && ynFocus.kind === "yesNo") {
      return {
        stage: "yesno",
        task: ynFocus,
        question: ynFocus.question || "ענו כן או לא.",
      };
    }
    var parYn = parallelYesNoPrompt(pack, progress);
    if (parYn) return parYn;
    var perpYn = perpYesNoPrompt(pack, progress);
    if (perpYn) return perpYn;
    var pending = (pack.tasks || []).filter(function (t) {
      return t.kind === "onLine" && !(progress.done && progress.done[t.id]);
    });
    var t =
      pending.filter(function (task) {
        var c = (progress.coords && progress.coords[task.id]) || {};
        return c.x && !c.y;
      })[0] ||
      pending.filter(function (task) {
        var c = (progress.coords && progress.coords[task.id]) || {};
        return c.x && c.y;
      })[0];
    if (!t) return null;
    var cf = (progress.coords && progress.coords[t.id]) || {};
    if (cf.x && !cf.y) {
      return {
        stage: "yesno",
        task: t,
        question: "האם הנקודה " + t.label + " נמצאת על הישר?",
      };
    }
    if (cf.x && cf.y) {
      return { stage: "reason", task: t, choices: reasonChoices(t) };
    }
    return null;
  }

  function submitReason(text, pack, progress) {
    var ask = lineAsk(pack, progress);
    if (!ask || ask.stage !== "reason") {
      return { ok: false, message: "אין נימוק נדרש כרגע." };
    }
    var t = String(text || "").replace(/\s+/g, " ").trim();
    if (t.length < 2) {
      return { ok: false, message: "כתבו נימוק קצר." };
    }
    var res = finishOnLineTask(
      ask.task,
      pack,
      progress,
      progress.done || {},
      progress.partial || {},
      progress.coords || {},
      null
    );
    res.reasonText = t;
    res.task = ask.task;
    res.message = "נכון. הנימוק נשמר.";
    return res;
  }

  function checkFreePoint(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var pts = preferPartTasks(
      pending.filter(function (t) {
        return t.kind === "freePoint";
      }),
      pack,
      progress
    );
    var phit = pts[0];
    if (!phit) return null;
    var part = currentPartText(pack, progress);
    var L = parseLineSpec(phit.line || (part && part.line) || pack.line);
    if (!L) return null;
    var pair = parsed && parsed.point ? parsed.point : parsePointPair(typed);
    if (!pair) {
      return {
        ok: false,
        message: "רשמו נקודה על הישר, למשל (0;" + fmtNum(L.b) + ") — בחרו x, הציבו, וקחו את y שיוצא.",
      };
    }
    var wantY = lineYAt(L, pair.x);
    if (!nearNum(pair.y, wantY)) {
      return {
        ok: false,
        message:
          "הנקודה לא על הישר " +
          prettyLineEq(L) +
          ". הציבו את x במשוואה וקחו את y שמתקבל.",
      };
    }
    var show = formatPointPair(pair.x, pair.y);
    return finishOnLineTask(
      phit,
      pack,
      progress,
      doneMap,
      partialMap,
      coordsMap,
      phit.label + " " + show,
      "נכון. " + show + " נמצאת על הישר."
    );
  }

  var GeoDist = global.DoctematicaGeoDistance.install({
    gcdInt: gcdInt,
    fmtNum: fmtNum,
    formatLo: formatLo,
    getPoint: getPoint,
    near0: near0,
    nearNum: nearNum,
    fmtFrac: fmtFrac,
    segmentPairName: segmentPairName,
    preferPartTasks: preferPartTasks,
    cloneMaps: cloneMaps,
    remainingRequired: remainingRequired,
    taskMatchesTag: taskMatchesTag,
  });
  var distExactFromPoints = GeoDist.distExactFromPoints;
  var distLhs = GeoDist.distLhs;
  var fmtRad = GeoDist.fmtRad;
  var radToFloat = GeoDist.radToFloat;
  var distEqualShow = GeoDist.distEqualShow;
  var distSegName = GeoDist.distSegName;
  var distWantRad = GeoDist.distWantRad;
  var checkDistance = GeoDist.checkDistance;
  var checkEqualLen = GeoDist.checkEqualLen;
  var canonicalDistanceSteps = GeoDist.canonicalDistanceSteps;
  var distanceHintMessage = GeoDist.distanceHintMessage;
  var nextDistanceStep = GeoDist.nextDistanceStep;

  var GeoPerp = global.DoctematicaGeoPerp.install({
    fmtNum: fmtNum,
    near0: near0,
    nearNum: nearNum,
    fmtSimpleFrac: fmtSimpleFrac,
    preferPartTasks: preferPartTasks,
    cloneMaps: cloneMaps,
    remainingRequired: remainingRequired,
    parseLineSpec: parseLineSpec,
    parallelRelatedSlopeTasks: parallelRelatedSlopeTasks,
    slopeWant: slopeWant,
    slopeLhs: slopeLhs,
    slopeTagNorm: slopeTagNorm,
    rewriteMixedNum: rewriteMixedNum,
    parseNumberToken: parseNumberToken,
    evalArithLoose: evalArithLoose,
    currentPartText: currentPartText,
    taskByIdMap: taskByIdMap,
    currentFocusTask: currentFocusTask,
    parseYesNo: parseYesNo,
    looksLikeLinearEq: looksLikeLinearEq,
    typedLooksLikeCoordStep: typedLooksLikeCoordStep,
    parseSlopeFormula: parseSlopeFormula,
    parseLineMbInput: parseLineMbInput,
    parseMChain: parseMChain,
    markPriorSlopes: markPriorSlopes,
    markRelatedSlopes: markRelatedSlopes,
    visibleUnsortedLines: visibleUnsortedLines,
    lineMbNeedsUnsorted: lineMbNeedsUnsorted,
    canonicalLineRearrangeSteps: canonicalLineRearrangeSteps,
    parallelLinesReady: parallelLinesReady,
    firstUnsortedLine: firstUnsortedLine,
    intersectStoredEq: intersectStoredEq,
    prettyLineEq: prettyLineEq,
    lineMbSuggestNextStep: lineMbSuggestNextStep,
    lineMbRearrangeHintMessage: lineMbRearrangeHintMessage,
    canonicalSlopeSteps: canonicalSlopeSteps,
    nextSlopeCanonicalStep: nextSlopeCanonicalStep,
  });
  var perpGivenSlope = GeoPerp.perpGivenSlope;
  var perpWantFromGiven = GeoPerp.perpWantFromGiven;
  var perpTypedIsFormula = GeoPerp.perpTypedIsFormula;
  var perpUnknownLhs = GeoPerp.perpUnknownLhs;
  var perpFormulaShow = GeoPerp.perpFormulaShow;
  var parseTimesEq = GeoPerp.parseTimesEq;
  var checkPerpendicular = GeoPerp.checkPerpendicular;
  var checkPerpSlope = GeoPerp.checkPerpSlope;
  var canonicalPerpendicularSteps = GeoPerp.canonicalPerpendicularSteps;
  var canonicalPerpSlopeSteps = GeoPerp.canonicalPerpSlopeSteps;
  var perpSlopeReason = GeoPerp.perpSlopeReason;
  var perpYesNoPrompt = GeoPerp.perpYesNoPrompt;
  var perpendicularKindHint = GeoPerp.perpendicularKindHint;
  var perpSlopeEmptyHint = GeoPerp.perpSlopeEmptyHint;
  var nextPerpendicularHint = GeoPerp.nextPerpendicularHint;
  var perpSlopeNextHint = GeoPerp.perpSlopeNextHint;

  var GeoPar = global.DoctematicaGeoParallel.install({
    fmtNum: fmtNum,
    nearNum: nearNum,
    slopeWant: slopeWant,
    slopeLhs: slopeLhs,
    slopeTagNorm: slopeTagNorm,
    cloneMaps: cloneMaps,
    remainingRequired: remainingRequired,
    parseMChain: parseMChain,
    preferPartTasks: preferPartTasks,
    currentPartText: currentPartText,
    taskByIdMap: taskByIdMap,
    parseYesNo: parseYesNo,
    looksLikeLinearEq: looksLikeLinearEq,
    parallelLinesReady: parallelLinesReady,
    parallelRelatedSlopeTasks: parallelRelatedSlopeTasks,
    markRelatedSlopes: markRelatedSlopes,
    parseLineSpec: parseLineSpec,
    intersectLineRaw: intersectLineRaw,
    parseNumberToken: parseNumberToken,
    evalArithLoose: evalArithLoose,
    resolveSlopeByLetters: resolveSlopeByLetters,
    canonicalSlopeSteps: canonicalSlopeSteps,
    normEqText: normEqText,
    lineMbNeedsUnsorted: lineMbNeedsUnsorted,
    canonicalLineRearrangeSteps: canonicalLineRearrangeSteps,
    prettyLineEq: prettyLineEq,
    firstUnsortedLine: firstUnsortedLine,
    intersectStoredEq: intersectStoredEq,
    lineMbSuggestNextStep: lineMbSuggestNextStep,
    lineMbRearrangeHintMessage: lineMbRearrangeHintMessage,
    currentFocusTask: currentFocusTask,
  });
  var parallelGivenSlopeTag = GeoPar.parallelGivenSlopeTag;
  var parallelNewSlopeTag = GeoPar.parallelNewSlopeTag;
  var parallelCopyShow = GeoPar.parallelCopyShow;
  var parallelPendingTask = GeoPar.parallelPendingTask;
  var parallelSlopeReason = GeoPar.parallelSlopeReason;
  var checkCopiedSlope = GeoPar.checkCopiedSlope;
  var parallelProofEqLine = GeoPar.parallelProofEqLine;
  var parallelProofConclusion = GeoPar.parallelProofConclusion;
  var checkParallel = GeoPar.checkParallel;
  var canonicalParallelSteps = GeoPar.canonicalParallelSteps;
  var parallelKindHint = GeoPar.parallelKindHint;
  var parallelCopiedSlopeEmptyHint = GeoPar.parallelCopiedSlopeEmptyHint;
  var parallelYesNoPrompt = GeoPar.parallelYesNoPrompt;
  var nextParallelHint = GeoPar.nextParallelHint;
  var parallelCopiedSlopeNextHint = GeoPar.parallelCopiedSlopeNextHint;

  var GeoAxis = global.DoctematicaGeoAxisLines.install({
    fmtNum: fmtNum,
    nearNum: nearNum,
    getPoint: getPoint,
    parseConstAxisEq: parseConstAxisEq,
    currentPartText: currentPartText,
    finishLineEq: finishLineEq,
  });
  var axisLineDir = GeoAxis.axisLineDir;
  var axisLineConst = GeoAxis.axisLineConst;
  var axisLineEqText = GeoAxis.axisLineEqText;
  var axisLineComplete = GeoAxis.axisLineComplete;
  var axisLineHintMessage = GeoAxis.axisLineHintMessage;
  var axisLineWrongMessage = GeoAxis.axisLineWrongMessage;
  var checkAxisLineEq = GeoAxis.checkAxisLineEq;
  var axisLineNextHint = GeoAxis.axisLineNextHint;

  var GeoMid = global.DoctematicaGeoMidpoint.install({
    fmtNum: fmtNum,
    near0: near0,
    nearNum: nearNum,
    formatPointPair: formatPointPair,
    getPoint: getPoint,
    pointMap: pointMap,
    cloneMaps: cloneMaps,
    remainingRequired: remainingRequired,
    currentPartText: currentPartText,
    currentFocusTask: currentFocusTask,
    taskByIdMap: taskByIdMap,
    parseLineSpec: parseLineSpec,
    parseConstAxisEq: parseConstAxisEq,
    parsePointAxisTag: parsePointAxisTag,
    parseSlopeFormula: parseSlopeFormula,
    classifySlopeFormula: classifySlopeFormula,
    prettySlopeFormula: prettySlopeFormula,
    slopeTagLetters: slopeTagLetters,
    segmentLineFromEnds: segmentLineFromEnds,
    parseSlopeInterceptText: parseSlopeInterceptText,
    lineEqSysEquivalent: lineEqSysEquivalent,
    lineEqPointSlope: lineEqPointSlope,
    prettyLineEq: prettyLineEq,
    substYRhs: substYRhs,
    yEqGivesCoord: yEqGivesCoord,
    eqNormEqual: eqNormEqual,
    linearEqEquivalent: linearEqEquivalent,
    checkPlugYStep: checkPlugYStep,
    isSolvedYText: isSolvedYText,
    evalMaybeExpr: evalMaybeExpr,
    lastEqStage: lastEqStage,
    evalStepExpr: evalStepExpr,
    parseNumberToken: parseNumberToken,
    parseParenNumber: parseParenNumber,
    parseSlopeDiffExpr: parseSlopeDiffExpr,
    rewriteMixedNum: rewriteMixedNum,
    splitAtDepthZero: splitAtDepthZero,
    stripOuterParensBalanced: stripOuterParensBalanced,
    isRequiredTask: isRequiredTask,
    normGeoTag: normGeoTag,
    taskStepLabel: taskStepLabel,
    taskWorkStarted: taskWorkStarted,
  });
  var openFindMidpointTask = GeoMid.openFindMidpointTask;
  var midpointSegmentLetters = GeoMid.midpointSegmentLetters;
  var lettersMatchMidSegment = GeoMid.lettersMatchMidSegment;
  var typedMatchesAbLine = GeoMid.typedMatchesAbLine;
  var typedLooksLikeFindMidpoint = GeoMid.typedLooksLikeFindMidpoint;
  var midpointPointName = GeoMid.midpointPointName;
  var midpointEnds = GeoMid.midpointEnds;
  var settleMidpointOnLineCoords = GeoMid.settleMidpointOnLineCoords;
  var lineMidPairTasks = GeoMid.lineMidPairTasks;
  var lineMidPairBlockedByPrior = GeoMid.lineMidPairBlockedByPrior;
  var lineMidPairFocus = GeoMid.lineMidPairFocus;
  var canonicalLineMidPairSteps = GeoMid.canonicalLineMidPairSteps;
  var axisMidPairTasks = GeoMid.axisMidPairTasks;
  var axisMidPairFocus = GeoMid.axisMidPairFocus;
  var canonicalAxisMidPairSteps = GeoMid.canonicalAxisMidPairSteps;
  var settleSkippedMidpointPairs = GeoMid.settleSkippedMidpointPairs;
  var midpointNextHint = GeoMid.midpointNextHint;
  var midpointAwaitingPair = GeoMid.midpointAwaitingPair;
  var checkMidpoint = GeoMid.checkMidpoint;
  var canonicalMidpointSteps = GeoMid.canonicalMidpointSteps;
  var midpointKindHint = GeoMid.midpointKindHint;
  var midpointPairText = GeoMid.midpointPairText;
  var midpointOnAxis = GeoMid.midpointOnAxis;
  var midpointLineVertical = GeoMid.midpointLineVertical;
  var midpointLineHorizontal = GeoMid.midpointLineHorizontal;
  var midpointLineIdentity = GeoMid.midpointLineIdentity;
  var midpointOnLineSpec = GeoMid.midpointOnLineSpec;

  function checkTyped(typed, pack, progress) {
    progress = progress || { done: {}, partial: {}, coords: {} };
    settleMidpointOnLineCoords(pack, progress);
    settleSkippedMidpointPairs(pack, progress);
    var doneMap = progress.done || {};
    var partialMap = progress.partial || {};
    var coordsMap = {};
    Object.keys(progress.coords || {}).forEach(function (k) {
      coordsMap[k] = {
        x: !!(progress.coords[k] && progress.coords[k].x),
        y: !!(progress.coords[k] && progress.coords[k].y),
      };
    });
    var pending = pack.tasks.filter(function (t) {
      return !doneMap[t.id];
    });
    if (!remainingRequired(pack, doneMap).length) {
      return { ok: true, solved: true, message: "כל החלקים כבר נפתרו." };
    }
    if (isLineMatchPack(pack) && lineMatchPartActive(pack, progress)) {
      return { ok: false, message: "בחרו ישר ליד כל משוואה, ואז לחצו «לנמק»." };
    }
    var parsed = extractAnswerValue(typed);
    var ynHit = checkYesNo(typed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (ynHit) return ynHit;
    var onHit = checkOnLine(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (onHit) return onHit;
    var freeHit = checkFreePoint(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (freeHit) return freeHit;
    var noIntHit = checkNoIntercept(typed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (noIntHit) return noIntHit;
    var lineMbReHit = checkLineMbRearrange(typed, pack, progress, pending);
    if (lineMbReHit) return lineMbReHit;
    var givenReHit = checkGivenLineRearrange(typed, pack, progress);
    if (givenReHit) return givenReHit;
    var parReHit = checkParallelRearrange(typed, pack, progress, pending);
    if (parReHit) return parReHit;
    var parHit = checkParallel(typed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (parHit) return parHit;
    var perpHit = checkPerpendicular(typed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (perpHit) return perpHit;
    var lineEqHit = checkLineEq(typed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (lineEqHit) return lineEqHit;
    var lineMbHit = checkLineMb(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (lineMbHit) return lineMbHit;
    var slopeHit = checkSlope(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (slopeHit) return slopeHit;
    var distHit = checkDistance(typed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (distHit) return distHit;
    var eqLenHit = checkEqualLen(typed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (eqLenHit) return eqLenHit;
    var midHit = checkMidpoint(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (midHit) return midHit;
    var fromAreaHit = checkSegFromArea(
      typed,
      parsed,
      pack,
      progress,
      pending,
      doneMap,
      partialMap,
      coordsMap
    );
    if (fromAreaHit) return fromAreaHit;
    var lineHit = checkLinePoint(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (lineHit) return lineHit;
    var lineIntersectHit = checkLineIntersect(typed, parsed, pack, progress, pending, doneMap, partialMap, coordsMap);
    if (lineIntersectHit && (lineIntersectHit.ok || !(parsed && parsed.kind === "point"))) {
      return lineIntersectHit;
    }
    var heightFootHit = checkHeightFootPoint(
      typed,
      parsed,
      pack,
      progress,
      pending,
      doneMap,
      partialMap,
      coordsMap
    );
    if (heightFootHit) return heightFootHit;
    var fromAreaHit = checkSegFromArea(
      typed,
      parsed,
      pack,
      progress,
      pending,
      doneMap,
      partialMap,
      coordsMap
    );
    if (fromAreaHit) return fromAreaHit;

    // —— מציאת נקודה (שיעורים) ——
    var pointPending = preferPartTasks(
      pending.filter(function (t) {
        return t.kind === "point" && taskMatchesTag(t, parsed.tag);
      }),
      pack,
      progress
    );
    // מספר בודד / ביטוי בלי תווית: לא חוטפים נקודה optional שטרם התחילו
    // (למשל 10 אחרי BC=14−4 לא אמור להיחשב כשיעור של D)
    if (
      pointPending.length &&
      !parsed.tag &&
      parsed.kind !== "point" &&
      parsed.kind !== "twin" &&
      (parsed.kind === "final" || parsed.kind === "diff")
    ) {
      pointPending = pointPending.filter(function (t) {
        if (!t.optional) return true;
        var cf = coordsMap[t.id];
        return !!(cf && (cf.x || cf.y)) || !!partialMap[t.id];
      });
    }
    if (
      pointPending.length &&
      (parsed.kind === "point" ||
        parsed.kind === "twin" ||
        (parsed.kind === "final" && parsed.value != null) ||
        (parsed.kind === "diff" && parsed.value != null))
    ) {
      var phit = null;
      var pi;
      if (parsed.kind === "point" && parsed.point) {
        for (pi = 0; pi < pointPending.length; pi++) {
          if (
            nearNum(parsed.point.x, pointPending[pi].answerX) &&
            nearNum(parsed.point.y, pointPending[pi].answerY)
          ) {
            phit = pointPending[pi];
            break;
          }
        }
        if (!phit) {
          var mismatchTask = pointTaskForPairMismatch(pointPending, parsed);
          return {
            ok: false,
            message: pointPairMismatchMessage(
              mismatchTask,
              parsed.point.x,
              parsed.point.y,
              pack
            ),
          };
        }
        var pDone = {};
        Object.keys(doneMap).forEach(function (k) {
          pDone[k] = true;
        });
        pDone[phit.id] = true;
        var pLeft = pack.tasks.filter(function (t) {
          return !pDone[t.id];
        });
        var pPartial = {};
        Object.keys(partialMap).forEach(function (k) {
          if (k !== phit.id) pPartial[k] = true;
        });
        var pCoords = {};
        Object.keys(coordsMap).forEach(function (k) {
          if (k !== phit.id) pCoords[k] = coordsMap[k];
        });
        var pointName = String(phit.point || phit.label || "").toUpperCase();
        var relatedSeg = preferPartTasks(
          pLeft.filter(function (t) {
            if (t.kind !== "segment" && t.kind !== "origin") return false;
            var a = String(t.from || "").toUpperCase();
            var b = String(t.to || "").toUpperCase();
            var p = String(t.point || "").toUpperCase();
            return a === pointName || b === pointName || p === pointName;
          }),
          pack,
          { done: pDone }
        )[0];
        var pointMsg;
        if (!pLeft.length) {
          pointMsg = "נכון. הנקודה " + phit.label + " התגלתה בשרטוט. כל התשובות נכונות.";
        } else if (relatedSeg) {
          pointMsg =
            "נכון. הנקודה " +
            phit.label +
            " התגלתה בשרטוט. עכשיו חשבו את אורך " +
            relatedSeg.label +
            " (גדול פחות קטן).";
        } else {
          pointMsg =
            "נכון. הנקודה " + phit.label + " התגלתה בשרטוט. נשארו עוד " + pLeft.length + ".";
        }
        return {
          ok: true,
          solved: pLeft.length === 0,
          done: pDone,
          partial: pPartial,
          coords: pCoords,
          lastExpr: progress.lastExpr || {},
          task: phit,
          revealPoint: phit.point,
          show: phit.label + pointTaskLabel(phit),
          message: pointMsg,
        };
      }

      // Bx=4 / By=3 / Bx=Ax
      phit = pointPending[0];
      var miss = String(phit.missing || "x").toLowerCase();
      var axisFromTag = null;
      if (parsed.tag) {
        var tagU = String(parsed.tag).toUpperCase();
        var pn = String(phit.point || phit.label || "").toUpperCase();
        if (tagU === "X" || tagU === pn + "X" || tagU === "X" + pn) axisFromTag = "x";
        if (tagU === "Y" || tagU === pn + "Y" || tagU === "Y" + pn) axisFromTag = "y";
      }
      if (parsed.kind === "twin" && parsed.twinAxis) axisFromTag = parsed.twinAxis;
      if (miss === "x" || miss === "y") axisFromTag = miss;
      if (!axisFromTag) axisFromTag = firstUnknownAxis(phit, coordsMap[phit.id]);

      var want = missingCoordValue(phit, axisFromTag);
      var got = null;
      if (parsed.kind === "twin") {
        var twinLabel =
          parsed.twinPoint ||
          (axisFromTag === "y" ? phit.twinY || phit.twin : phit.twinX || phit.twin);
        var twin = resolveTwinPoint(pack, progress, twinLabel);
        if (!twin) {
          return { ok: false, message: "לא מצאתי את הנקודה " + twinLabel + "." };
        }
        got = parsed.twinAxis === "y" ? twin.y : twin.x;
      } else if (parsed.value != null) {
        got = parsed.value;
      }
      if (got == null || !nearNum(got, want)) {
        if (
          miss === "both" &&
          phit.twinX &&
          phit.twinY &&
          got != null &&
          !nearNum(phit.answerX, phit.answerY)
        ) {
          var otherAx = axisFromTag === "y" ? "x" : "y";
          if (nearNum(got, missingCoordValue(phit, otherAx))) {
            axisFromTag = otherAx;
            want = missingCoordValue(phit, otherAx);
          }
        }
      }
      if (got == null || !nearNum(got, want)) {
        var altPi;
        for (altPi = 0; altPi < pointPending.length; altPi++) {
          var alt = pointPending[altPi];
          if (alt === phit) continue;
          var altAxis = axisFromTag;
          if (String(alt.missing || "").toLowerCase() === "x" || String(alt.missing || "").toLowerCase() === "y") {
            altAxis = String(alt.missing).toLowerCase();
          } else if (!altAxis) {
            altAxis = firstUnknownAxis(alt, coordsMap[alt.id]);
          }
          if (got != null && nearNum(got, missingCoordValue(alt, altAxis))) {
            phit = alt;
            miss = String(phit.missing || "x").toLowerCase();
            axisFromTag = altAxis;
            want = missingCoordValue(phit, axisFromTag);
            break;
          }
        }
      }
      if (got == null || !nearNum(got, want)) {
        var hintTwin =
          axisFromTag === "y" ? phit.twinY || phit.twin : phit.twinX || phit.twin;
        var ptLab = String(phit.point || phit.label || "").toUpperCase();
        var axisName = axisFromTag === "y" ? "y" : "x";
        if (parsed.kind !== "twin" && parsed.value != null) {
          var otherAxisOk =
            miss === "both" &&
            coordsMap[phit.id] &&
            (axisFromTag === "y" ? coordsMap[phit.id].x : coordsMap[phit.id].y);
          if (otherAxisOk) {
            return {
              ok: false,
              message:
                "ה-" +
                (axisFromTag === "y" ? "x" : "y") +
                " של " +
                ptLab +
                " כבר נכון, אבל ה-" +
                axisName +
                " עדיין לא מדויק.",
            };
          }
          return {
            ok: false,
            message:
              phit.twinX &&
              !phit.twinY &&
              axisFromTag === "y" &&
              parsed.value != null &&
              (function () {
                var twX = resolveTwinPoint(pack, progress, phit.twinX);
                return twX && nearNum(parsed.value, twX.y);
              })()
                ? "הקטע מקביל לציר y, לכן אותו x (לא אותו y)."
                : phit.twinY &&
                    !phit.twinX &&
                    axisFromTag === "x" &&
                    parsed.value != null &&
                    (function () {
                      var twY = resolveTwinPoint(pack, progress, phit.twinY);
                      return twY && nearNum(parsed.value, twY.x);
                    })()
                  ? "הקטע מקביל לציר x, לכן אותו y (לא אותו x)."
                  : "ה-" + axisName + " של " + ptLab + " עדיין לא מדויק.",
          };
        }
        return {
          ok: false,
          message:
            "השיעור החסר של " +
            phit.label +
            " הוא כמו של " +
            (hintTwin || "הנקודה המקבילה") +
            " על אותו ציר.",
        };
      }

      var midDone = {};
      Object.keys(doneMap).forEach(function (k) {
        midDone[k] = true;
      });
      var midPartial = {};
      Object.keys(partialMap).forEach(function (k) {
        midPartial[k] = true;
      });
      var midCoords = {};
      Object.keys(coordsMap).forEach(function (k) {
        midCoords[k] = { x: !!coordsMap[k].x, y: !!coordsMap[k].y };
      });
      if (!midCoords[phit.id]) midCoords[phit.id] = { x: false, y: false };
      if (axisFromTag === "y") midCoords[phit.id].y = true;
      else midCoords[phit.id].x = true;

      var midExpr = {};
      Object.keys(progress.lastExpr || {}).forEach(function (k) {
        midExpr[k] = progress.lastExpr[k];
      });
      var midShow;
      var chain = false;
      var midLine = lineForPointTask(pack, progress, phit) || activeLine(pack, progress);
      if (midLine && (axisFromTag === "y" || miss === "y")) {
        var prevY = (progress.lastExpr && progress.lastExpr[phit.id]) || "";
        var yBit = fmtNum(want);
        if (prevY && eqIsKnownAxisValue(prevY, "x") && axisFromTag === "y") {
          midShow = "y = " + yBit;
        } else {
          midShow = prevY ? appendDiffExpr(prevY, yBit) : "y = " + yBit;
        }
        chain = !!prevY && !eqIsKnownAxisValue(prevY, "x");
      } else if (midLine && (axisFromTag === "x" || miss === "x")) {
        midShow = "x = " + fmtNum(want);
      } else {
        midShow =
          parsed.displayExpr || phit.label + axisFromTag + " = " + fmtNum(want);
      }
      midExpr[phit.id] = midShow;

      var bothReady =
        miss !== "both"
          ? true
          : midCoords[phit.id].x && midCoords[phit.id].y;
      if (miss !== "both") {
        var cw = String(phit.completeWhen || "").toLowerCase();
        if (cw && cw === axisFromTag) {
          midDone[phit.id] = true;
          var axisHeb = axisFromTag === "y" ? "y" : "x";
          var ptLab = String(phit.point || phit.label || "").toUpperCase();
          var leftReq = pack.tasks.filter(function (t) {
            return !midDone[t.id] && isRequiredTask(t);
          });
          return {
            ok: true,
            solved: !leftReq.length,
            done: midDone,
            partial: midPartial,
            coords: midCoords,
            lastExpr: midExpr,
            task: phit,
            show: midShow,
            chain: chain,
            message:
              "נכון. שיעור ה-" + axisHeb + " של " + ptLab + " הוא " + fmtNum(want) + ".",
          };
        }
        midPartial[phit.id] = true;
        return {
          ok: true,
          solved: false,
          done: midDone,
          partial: midPartial,
          coords: midCoords,
          lastExpr: midExpr,
          task: phit,
          show: midShow,
          chain: chain,
          message: "נכון. אפשר להמשיך עם " + phit.label + "(x;y), או לסיים ישר כך.",
        };
      }
      // missing both: אחרי שני השיעורים — עדיין דורשים B(x;y), או אם שניהם מולאו מאפשרים סגירה ב־B(x;y) בלבד
      midPartial[phit.id] = true;
      if (bothReady) {
        return {
          ok: true,
          solved: false,
          done: midDone,
          partial: midPartial,
          coords: midCoords,
          lastExpr: midExpr,
          task: phit,
          show: midShow,
          message: "נכון. שני השיעורים ידועים — רשמו " + phit.label + "(x;y).",
        };
      }
      var missingAxisMsg =
        midLine && axisFromTag === "x" && !(phit.twinX && phit.twinY)
          ? "נכון. עכשיו הציבו x = " +
            fmtNum(want) +
            " במשוואת הישר " +
            prettyLineEq(midLine) +
            " ומצאו את y."
          : midLine && axisFromTag === "y" && !(phit.twinX && phit.twinY)
            ? "נכון. עכשיו הציבו y = " +
              fmtNum(want) +
              " במשוואת הישר " +
              prettyLineEq(midLine) +
              " ופתרו עבור x (כמו משוואה בנעלם אחד)."
            : phit.twinX && midCoords[phit.id].y && !midCoords[phit.id].x
              ? "נכון. עכשיו אותו x כמו " +
                String(phit.twinX).toUpperCase() +
                " (הישר מקביל לציר ה־y)."
              : phit.twinY && midCoords[phit.id].x && !midCoords[phit.id].y
                ? "נכון. עכשיו אותו y כמו " +
                  String(phit.twinY).toUpperCase() +
                  " (הישר מקביל לציר ה־x)."
                : "נכון. עוד חסר שיעור " +
                  (midCoords[phit.id].x ? "y" : "x") +
                  " של " +
                  phit.label +
                  ".";
      return {
        ok: true,
        solved: false,
        done: midDone,
        partial: midPartial,
        coords: midCoords,
        lastExpr: midExpr,
        task: phit,
        show: midShow,
        message: missingAxisMsg,
      };
    }

    var allAreasEarly = pendingAreaTasks(pending, pack, progress);
    var partLead = preferPartTasks(pending, pack, progress)[0];
    var forceAreaRhs =
      allAreasEarly.length &&
      (looksLikeAreaDiff(typed) ||
        looksLikeAreaSum(typed) ||
        (partLead && partLead.kind === "area" && parsed.kind === "diff"));
    if (parsed.value == null || !isFinite(parsed.value) || !parsed.kind || parsed.kind === "point" || parsed.kind === "twin" || forceAreaRhs) {
      // —— שטח: גם כשהצעד המומלץ הוא צלע — מזהים ניסיון שטח (כולל אותיות שגויות) ——
      var allAreas = allAreasEarly;
      if (looksLikeAreaAttempt(typed, parsed) && allAreas.length) {
        var gotAreaTag = extractAreaTagFromTyped(typed, parsed);
        var areaFocus = null;
        var ak;
        if (looksLikeAreaDiff(typed) && !gotAreaTag) {
          for (ak = 0; ak < allAreas.length; ak++) {
            if (allAreas[ak].diff) {
              areaFocus = allAreas[ak];
              break;
            }
          }
        }
        if (!areaFocus && looksLikeAreaSum(typed) && !gotAreaTag) {
          for (ak = 0; ak < allAreas.length; ak++) {
            if (allAreas[ak].sum) {
              areaFocus = allAreas[ak];
              break;
            }
          }
        }
        if (!areaFocus) {
          for (ak = 0; ak < allAreas.length; ak++) {
            if (!gotAreaTag || taskMatchesTag(allAreas[ak], gotAreaTag)) {
              areaFocus = allAreas[ak];
              break;
            }
          }
        }
        if (!areaFocus) {
          return {
            ok: false,
            message: wrongTriangleMessage(allAreas[0], gotAreaTag),
            hint: canonicalStep(allAreas[0], pack.map),
          };
        }
        var areaRhs = null;
        if (parsed.kind === "area" && parsed.areaRhs) {
          areaRhs = parsed.areaRhs;
        } else {
          var rawTyped = String(typed || "")
            .replace(/[−–—]/g, "-")
            .replace(/\s+/g, "");
          var stripArea = rawTyped.match(/^S(?:△|Δ)?[A-Za-z]{3}(?:=|:)(.+)$/i);
          if (stripArea) areaRhs = stripArea[1];
          else if (/[*/×·÷()]|[A-Za-z]/.test(rawTyped) || rawTyped.indexOf("=") >= 0) {
            areaRhs = rawTyped;
          }
        }
        if (!areaRhs) {
          return {
            ok: false,
            message: areaFocus.diff
              ? "רשמו " +
                areaFocus.label +
                "=" +
                canonicalAreaBody(areaFocus) +
                ", או הציבו מספרים (גדול פחות קטן) ואז את התוצאה."
              : areaFocus.sum && areaUsesSumCanonical(areaFocus)
                ? "רשמו " +
                  areaFocus.label +
                  "=" +
                  canonicalSumAreaBody(areaFocus) +
                  ", או הציבו את שני השטחים וחברו."
                : areaFocus.sum && areaFocus.sum.optional
                  ? "רשמו " +
                    areaFocus.label +
                    "=" +
                    canonicalAreaBody(areaFocus) +
                    ", או " +
                    canonicalSumAreaBody(areaFocus) +
                    "."
                  : "רשמו את חישוב השטח אחרי s" +
                areaVertsLabel(areaFocus) +
                "=, למשל " +
                (canonicalAreaBody(areaFocus) || "את המכפלה") +
                " או את המכפלה המספרית.",
            hint: canonicalStep(areaFocus, pack.map),
          };
        }
        var areaVal = evalGeoAreaRhs(areaRhs, pack.map, pack);
        if (areaVal == null) {
          return {
            ok: false,
            message: areaFocus.diff
              ? "לא הצלחתי לחשב את ההפרש. רשמו למשל " +
                canonicalAreaBody(areaFocus) +
                " או את המספרים ואז את התוצאה."
              : areaFocus.sum && areaUsesSumCanonical(areaFocus)
                ? "לא הצלחתי לחשב את הסכום. רשמו למשל " +
                  canonicalSumAreaBody(areaFocus) +
                  " או את המספרים ואז את התוצאה."
                : areaFocus.sum && areaFocus.sum.optional
                  ? "לא הצלחתי לחשב. רשמו למשל " +
                    canonicalAreaBody(areaFocus) +
                    ", או " +
                    canonicalSumAreaBody(areaFocus) +
                    "."
                  : "לא הצלחתי לחשב את הביטוי לשטח. בדקו את הנוסחה. " + areaFormulaHint(areaFocus),
            hint: canonicalStep(areaFocus, pack.map),
          };
        }
        if (areaVal < 0 && nearNum(areaVal, -areaFocus.answer)) {
          return { ok: false, message: "כמעט, אותו ערך רק בחיובי." };
        }
        if (areaVal < 0) {
          return { ok: false, message: "שטח חייב להיות חיובי." };
        }
        if (!nearNum(areaVal, areaFocus.answer)) {
          return {
            ok: false,
            message: areaFocus.diff
              ? "עוד לא מדויק עבור " +
                areaFocus.label +
                ". השתמשו בהפרש " +
                canonicalAreaBody(areaFocus) +
                "."
              : areaFocus.sum && (areaUsesSumCanonical(areaFocus) || areaFocus.sum.optional)
                ? "עוד לא מדויק עבור " +
                  areaFocus.label +
                  ". אפשר גם לחבר " +
                  canonicalSumAreaBody(areaFocus) +
                  "."
                : "עוד לא מדויק עבור " +
                areaFocus.label +
                ". " +
                areaFormulaHint(areaFocus),
            hint: canonicalStep(areaFocus, pack.map),
          };
        }
        var pretty = prettyAreaExpr(areaRhs);
        if (areaRhsIsComplete(areaRhs, areaFocus.answer)) {
          return finishAreaTask(areaFocus, pretty, areaRhs, doneMap, partialMap, coordsMap, pack, progress);
        }
        return partialAreaTask(areaFocus, pretty, doneMap, partialMap, coordsMap, pack, progress);
      }

      // ביטוי שטח בלי תג (למשל 7*4/2) כשיש משימת שטח פתוחה
      var areaPending = allAreas.length
        ? allAreas
        : preferPartTasks(
            pending.filter(function (t) {
              return t.kind === "area" && taskMatchesTag(t, parsed.tag);
            }),
            pack,
            progress
          );
      var areaRhsBare = null;
      if (areaPending.length && parsed.kind !== "area") {
        var rawBare = String(typed || "")
          .replace(/[−–—]/g, "-")
          .replace(/\s+/g, "");
        if (/[*/×·÷()\-]/.test(rawBare) || (rawBare.indexOf("=") >= 0 && /[A-Za-z]/.test(rawBare))) {
          areaRhsBare = rawBare;
        }
      }
      if (areaPending.length && areaRhsBare) {
        var areaVal2 = evalGeoAreaRhs(areaRhsBare, pack.map, pack);
        if (areaVal2 != null) {
          var ahit = null;
          var ai;
          for (ai = 0; ai < areaPending.length; ai++) {
            if (nearNum(areaVal2, areaPending[ai].answer)) {
              ahit = areaPending[ai];
              break;
            }
          }
          if (ahit) {
            var pretty2 = prettyAreaExpr(areaRhsBare);
            if (areaRhsIsComplete(areaRhsBare, ahit.answer)) {
              return finishAreaTask(ahit, pretty2, areaRhsBare, doneMap, partialMap, coordsMap, pack, progress);
            }
            return partialAreaTask(ahit, pretty2, doneMap, partialMap, coordsMap, pack, progress);
          }
          return {
            ok: false,
            message:
              "עוד לא מדויק עבור " +
              areaPending[0].label +
              ". " +
              areaFormulaHint(areaPending[0]),
            hint: canonicalStep(areaPending[0], pack.map),
          };
        }
      }

      var partTasks = preferPartTasks(pending, pack, progress);
      var lookingFromArea = partTasks.length && partTasks.some(function (t) {
        return t.fromArea;
      });
      var lookingPoint = partTasks.length && partTasks.every(function (t) {
        return t.kind === "point";
      });
      var lookingArea = partTasks.length && partTasks.every(function (t) {
        return t.kind === "area";
      });
      var lookingParallel = partTasks.length && partTasks.every(function (t) {
        return t.kind === "parallel";
      });
      var lookingPerp = partTasks.length && partTasks.every(function (t) {
        return t.kind === "perpendicular";
      });
      var lookingSlope = partTasks.length && partTasks.every(function (t) {
        return t.kind === "slope";
      });
      var lookingMidpoint = partTasks.length && partTasks.every(function (t) {
        return t.kind === "midpoint";
      });
      var lookingLineMb = partTasks.length && partTasks.every(function (t) {
        return t.kind === "lineMb";
      });
      var lookingYesNo = partTasks.length && partTasks.every(function (t) {
        return t.kind === "yesNo";
      });
      var lookingLineEq = partTasks.length && partTasks.every(function (t) {
        return t.kind === "lineEq";
      });
      var lookingLineIntersect = partTasks.length && partTasks.every(function (t) {
        return t.kind === "lineIntersect";
      });
      var lookingDistance = partTasks.length && partTasks.every(function (t) {
        return t.kind === "distance";
      });
      var lookingEqualLen = partTasks.length && partTasks.every(function (t) {
        return t.kind === "equalLen";
      });
      var hasOpenArea = pendingAreaTasks(pending, pack, progress).length > 0;
      return {
        ok: false,
        message: lookingPoint
          ? "רשמו את הנקודה (למשל B(4;−1)). אפשר גם Bx=… או Bx=Ax."
          : lookingFromArea
            ? (function () {
                var faT = partTasks.filter(function (t) {
                  return t.fromArea;
                })[0];
                var unkN = fromAreaUnknownNames(faT)[0];
                return (
                  "צלע מתוך שטח: רשמו " +
                  (faT.fromArea.label || "S") +
                  "=" +
                  (fromAreaLetterBody(faT) || "(צלע×צלע)/2") +
                  " או הציבו ישר " +
                  fromAreaPlugEq(faT, pack, false) +
                  ". הנעלם הוא " +
                  unkN +
                  " (אפשר גם x)."
                );
              })()
          : lookingParallel
            ? parallelKindHint(pack, progress)
          : lookingPerp
            ? perpendicularKindHint(pack, progress)
          : lookingSlope
            ? partTasks[0] && partTasks[0].parallel
              ? parallelCopiedSlopeEmptyHint(partTasks[0], pack)
              : partTasks[0] && partTasks[0].perpendicular
                ? perpSlopeEmptyHint(partTasks[0])
              : "רשמו m = (y₂ − y₁)/(x₂ − x₁) עם שתי הנקודות (לא משנה איזו היא 1), או ישר את השיפוע."
          : lookingMidpoint
            ? midpointKindHint(partTasks[0])
          : lookingLineMb
            ? (function () {
                var mbT = partTasks.filter(function (t) {
                  return t.kind === "lineMb";
                })[0];
                var mbLine = lineMbSourceLine(pack, progress, mbT);
                var wantB = partTasks.some(function (t) {
                  return t.kind === "lineMb" && String(t.param || "").toLowerCase() === "b";
                });
                if (lineMbNeedsUnsorted(mbLine) && !lineMbRearranged(progress)) {
                  return wantB
                    ? "אפשר קודם לסדר את המשוואה לצורה y = mx + b (לא חובה), או למצוא ישר את m ו-b (למשל m = −3 או b = 10)."
                    : "אפשר קודם לסדר את המשוואה לצורה y = mx + b (לא חובה), או למצוא ישר את השיפוע (למשל m = 3).";
                }
                return wantB
                  ? "רשמו את השיפוע m או את הגובה b (למשל m = −6 או b = 3)."
                  : "רשמו את השיפוע m (למשל m = −6 או רק את המספר).";
              })()
          : lookingYesNo
            ? partTasks[0] && partTasks[0].question
              ? partTasks[0].question + " ענו כן או לא."
              : "ענו כן או לא."
          : lookingLineEq
            ? (function () {
                var eqT = partTasks[0];
                if (axisLineDir(eqT)) return axisLineHintMessage(eqT, pack);
                var sp = lineEqSpec(eqT);
                return (
                  "הציבו בנוסחה " +
                  (sp ? lineEqPointSlope(sp) : "y − y₁ = m(x − x₁)") +
                  " והביאו ל־y = mx + b. אפשר גם להציב ב־y = mx + b ולמצוא את b."
                );
              })()
            : lookingLineIntersect
              ? (function () {
                  var st = intersectStage(pack, progress);
                  if (st.stage === "rearrange") {
                    return "קודם סדרו את " + intersectLineLabel(pack, st.key) + " לצורה y = mx + b.";
                  }
                  if (st.stage === "knownY") {
                    return (
                      "הישר מקביל לציר x — רשמו y = " +
                      fmtNum((partTasks[0] && partTasks[0].answerY) || 0) +
                      ". אפשר גם להשוות בין המשוואות."
                    );
                  }
                  if (st.stage === "knownX") {
                    return (
                      "הישר מקביל לציר y — רשמו x = " +
                      fmtNum((partTasks[0] && partTasks[0].answerX) || 0) +
                      ". אפשר גם להשוות בין המשוואות."
                    );
                  }
                  if (st.stage === "equate") {
                    return "השוו בין המשוואות: " + intersectEquateCanonical(pack, progress) + ".";
                  }
                  if (st.stage === "solveX") {
                    var linErr = teachLinearNext(intersectSolveHintEq(pack, progress));
                    return (linErr && linErr.hint) || "פתרו את המשוואה ומצאו את x.";
                  }
                  if (st.stage === "plugY") {
                    return "הציבו x ומצאו את y.";
                  }
                  return "רשמו את נקודת החיתוך, למשל P(2;4).";
                })()
            : lookingDistance
              ? distanceHintMessage(partTasks[0], pack, progress)
            : lookingEqualLen
              ? "רשמו " + distEqualShow(partTasks[0]) + " אחרי שמצאתם את שני האורכים."
            : lookingArea || hasOpenArea
            ? (function () {
                if (parsed && parsed.tag && isDrawFootLabel(pack, parsed.tag)) {
                  var footLab = normGeoTag(parsed.tag).replace(/X$|Y$/, "");
                  if (areaUsesFootLabel(pack, progress, footLab) && !footPointReady(progress, footLab)) {
                    if (!heightFootSnapped(progress, footLab)) {
                      return "קודם הורידו גובה עם «+ גובה» וגררו את הרגל לצלע, ואז מצאו את " + footLab + ".";
                    }
                    return "מצאו את " + footLab + " — רשמו " + footLab + "(x;y) או " + footLab + "x=… ו-" + footLab + "y=….";
                  }
                }
                return "רשמו קודם אורך צלע (גדול פחות קטן) או את השטח לפי הנוסחה המתאימה.";
              })()
            : "רשמו קודם גדול פחות קטן (למשל 5−2), או נקודה במבנה B(4;−1).",
      };
    }

    // מספר סופי / שבר לשטח — 9 סוגר; 18/2 נשמר כביניים
    // אם כבר התחילו צלע (ביניים) והמספר מתאים לה — לא חוטפים לשטח
    var areaNumPending = preferPartTasks(
      pending.filter(function (t) {
        return t.kind === "area" && taskMatchesTag(t, parsed.tag);
      }),
      pack,
      progress
    );
    var openPartialLen = pending.filter(function (t) {
      return (
        partialMap[t.id] &&
        (t.kind === "segment" || t.kind === "origin" || t.kind === "axis" || t.kind === "distSeg") &&
        nearNum(parsed.value, t.answer)
      );
    });
    var bareAreaNum =
      !parsed.tag &&
      (parsed.kind === "final" || parsed.kind === "full") &&
      openPartialLen.length > 0;
    if (
      areaNumPending.length &&
      (parsed.kind === "final" || parsed.kind === "full") &&
      !bareAreaNum
    ) {
      var ahit2 = null;
      var aj;
      for (aj = 0; aj < areaNumPending.length; aj++) {
        if (nearNum(parsed.value, areaNumPending[aj].answer)) {
          ahit2 = areaNumPending[aj];
          break;
        }
      }
      if (ahit2) {
        var rawTok = String(typed || "")
          .replace(/[−–—]/g, "-")
          .replace(/\s+/g, "");
        var stripTok = rawTok.match(/^S(?:△|Δ)?[A-Za-z]{3}(?:=|:)(.+)$/i);
        if (stripTok) rawTok = stripTok[1];
        var lastTok = rawTok.split("=").pop();
        if (isAreaSimplifiedFinal(lastTok, ahit2.answer)) {
          return finishAreaTask(
            ahit2,
            rawTok.indexOf("=") >= 0 ? prettyAreaExpr(rawTok) : prettyAreaExpr(lastTok),
            rawTok,
            doneMap,
            partialMap,
            coordsMap,
            pack,
            progress
          );
        }
        return partialAreaTask(ahit2, prettyAreaExpr(lastTok), doneMap, partialMap, coordsMap, pack, progress);
      }
    }

    var candidates = preferPartTasks(
      pending.filter(function (t) {
        return t.kind !== "point" &&
          t.kind !== "area" &&
          t.kind !== "lineMb" &&
          t.kind !== "slope" &&
          t.kind !== "midpoint" &&
          t.kind !== "lineEq" &&
          t.kind !== "lineIntersect" &&
          t.kind !== "yesNo" &&
          t.kind !== "distance" &&
          t.kind !== "equalLen" &&
          taskMatchesTag(t, parsed.tag);
      }),
      pack,
      progress
    );
    if (!candidates.length) {
      var openLens = preferPartTasks(
        pending.filter(function (t) {
          return t.kind === "segment" || t.kind === "origin" || t.kind === "axis" || t.kind === "distSeg";
        }),
        pack,
        progress
      );
      if (parsed.tag && openLens.length && /^[A-Z]{1,3}$/i.test(String(parsed.tag))) {
        var suggest = openLens
          .slice(0, 3)
          .map(function (t) {
            return t.label;
          })
          .join(", ");
        return {
          ok: false,
          message:
            "התווית «" +
            String(parsed.tag).toUpperCase() +
            "» לא מתאימה לצעד הנוכחי. נסו למשל " +
            suggest +
            ".",
        };
      }
      if (looksLikeAreaAttempt(typed, parsed) && pendingAreaTasks(pending, pack, progress).length) {
        var ar = pendingAreaTasks(pending, pack, progress)[0];
        return {
          ok: false,
          message: wrongTriangleMessage(ar, extractAreaTagFromTyped(typed, parsed)),
          hint: canonicalStep(ar, pack.map),
        };
      }
      return { ok: false, message: "לא מצאתי איזה קטע/נקודה התכוונתם. נסו למשל AB=5−2 או B(x;y)." };
    }
    // אם התחילו קטע מסוים — ממשיכים אותו (גם כשרושמים רק את המספר)
    var started = candidates.filter(function (t) {
      return partialMap[t.id];
    });
    if (started.length) candidates = started;

    var hit = null;
    var i;
    for (i = 0; i < candidates.length; i++) {
      if (nearNum(parsed.value, candidates[i].answer)) {
        hit = candidates[i];
        break;
      }
    }
    if (!hit) {
      var focus = candidates[0];
      var negHit = null;
      for (i = 0; i < candidates.length; i++) {
        var ansNeg = candidates[i].answer;
        if (ansNeg != null && isFinite(ansNeg) && !near0(ansNeg) && nearNum(parsed.value, -ansNeg)) {
          negHit = candidates[i];
          break;
        }
      }
      if (negHit) {
        return {
          ok: false,
          message: "כמעט, אותו ערך רק בחיובי.",
          hint: canonicalStep(negHit, pack.map),
        };
      }
      if (parsed.value != null && isFinite(parsed.value) && parsed.value < 0) {
        return {
          ok: false,
          message: "מרחק חייב להיות חיובי.",
          hint: canonicalStep(focus, pack.map),
        };
      }
      return {
        ok: false,
        message:
          "עוד לא מדויק עבור " +
          focus.label +
          ". זכרו: ערך גדול פחות ערך קטן.",
        hint: canonicalStep(focus, pack.map),
      };
    }

    var nextDone = {};
    Object.keys(doneMap).forEach(function (k) {
      nextDone[k] = true;
    });
    var nextPartial = {};
    Object.keys(partialMap).forEach(function (k) {
      nextPartial[k] = true;
    });
    var nextCoords = {};
    Object.keys(coordsMap).forEach(function (k) {
      nextCoords[k] = coordsMap[k];
    });

    // שלב ביניים: גדול פחות קטן, או מעבר 0+7 — מצטבר באותה שורה
    if (parsed.kind === "diff") {
      nextPartial[hit.id] = true;
      var prevMid = (progress.lastExpr && progress.lastExpr[hit.id]) || "";
      var midBit = parsed.displayExpr || canonicalDiffBody(hit, pack.map);
      var midChain = appendDiffExpr(prevMid, midBit);
      var midShow2 = hit.label + ": " + midChain;
      var nextExpr = {};
      Object.keys(progress.lastExpr || {}).forEach(function (k) {
        nextExpr[k] = progress.lastExpr[k];
      });
      nextExpr[hit.id] = midChain;
      var midMsg = simplifiedDiffBody(midChain)
        ? "נכון. אפשר לפשט (למשל מינוס שלילי לחיבור), ואז לחשב: " +
          hit.label +
          " = " +
          fmtNum(hit.answer) +
          "."
        : "נכון. עכשיו חשבו: " + hit.label + " = " + fmtNum(hit.answer) + ".";
      return {
        ok: true,
        solved: false,
        done: nextDone,
        partial: nextPartial,
        coords: nextCoords,
        lastExpr: nextExpr,
        task: hit,
        show: midShow2,
        message: midMsg,
      };
    }

    // תוצאה סופית / שורה מלאה גדול פחות קטן=תוצאה
    nextDone[hit.id] = true;
    delete nextPartial[hit.id];
    var left = remainingRequired(pack, nextDone);
    var leftAll = pack.tasks.filter(function (t) {
      return !nextDone[t.id];
    });
    var kept = (progress.lastExpr && progress.lastExpr[hit.id]) || canonicalDiffBody(hit, pack.map);
    var finalShow = kept
      ? hit.label + ": " + appendDiffExpr(kept, fmtNum(hit.answer))
      : canonicalStep(hit, pack.map);
    var nextExpr2 = {};
    Object.keys(progress.lastExpr || {}).forEach(function (k) {
      if (k !== hit.id) nextExpr2[k] = progress.lastExpr[k];
    });
    var leftOptionalLens = preferPartTasks(
      pack.tasks.filter(function (t) {
        return (
          t.optional &&
          !nextDone[t.id] &&
          (t.kind === "segment" || t.kind === "origin")
        );
      }),
      pack,
      progress
    );
    var moreMsg;
    if (left.length === 0 && leftAll.length === 0) {
      moreMsg = "כל התשובות נכונות.";
    } else if (hit.optional && leftOptionalLens.length) {
      moreMsg =
        "נכון. עכשיו מצאו את " +
        leftOptionalLens
          .map(function (t) {
            return t.label;
          })
          .join(" ו־") +
        ".";
    } else if (hit.optional && left.length) {
      moreMsg = "נכון. מומלץ להמשיך לנוסחת השטח.";
    } else if (left.length) {
      moreMsg = "נכון. נשארו עוד " + left.length + " תשובות.";
    } else {
      moreMsg = "נכון. המשיכו.";
    }
    return {
      ok: true,
      solved: left.length === 0,
      done: nextDone,
      partial: nextPartial,
      coords: nextCoords,
      lastExpr: nextExpr2,
      task: hit,
      show: finalShow,
      message: moreMsg,
    };
  }

  function segmentPairName(a, b) {
    return String(a || "").toUpperCase() + String(b || "").toUpperCase();
  }

  function pointHintMessage(task, progress) {
    var name = String(task.label || task.point || "").toUpperCase();
    var miss = String(task.missing || "x").toLowerCase();
    var cw = String(task.completeWhen || "").toLowerCase();
    var head =
      cw === "x"
        ? "מצאו את שיעור ה-x של " + name + "."
        : cw === "y"
          ? "מצאו את שיעור ה-y של " + name + "."
          : "מצאו את הנקודה " + name + ".";
    if (miss === "both") {
      var cf = (progress.coords && progress.coords[task.id]) || {};
      if (cf.x && cf.y) {
        return head;
      }
      if (cf.x && !cf.y) {
        if (task.twinY) {
          return (
            head +
            " בגלל שהקו " +
            segmentPairName(name, task.twinY) +
            " מקביל לציר ה־x, לנקודות " +
            name +
            " ו־" +
            String(task.twinY || "").toUpperCase() +
            " יש אותו ערך y."
          );
        }
        return head + " עכשיו הציבו את x במשוואת הישר וחשבו את y.";
      }
      if (!cf.x && cf.y) {
        if (task.twinX) {
          return (
            head +
            " בגלל שהקו " +
            segmentPairName(task.twinX, name) +
            " מקביל לציר ה־y, לנקודות " +
            String(task.twinX || "").toUpperCase() +
            " ו־" +
            name +
            " יש אותו ערך x."
          );
        }
        return head;
      }
      if (task.twinX && !task.twinY) {
        return (
          head +
          " בגלל שהקו " +
          segmentPairName(task.twinX, name) +
          " מקביל לציר ה־y, לנקודות " +
          String(task.twinX || "").toUpperCase() +
          " ו־" +
          name +
          " יש אותו ערך x. אחר כך מציבים במשוואת הישר ומוצאים y."
        );
      }
      if (task.twinY && !task.twinX) {
        return (
          head +
          " בגלל שהקו " +
          segmentPairName(name, task.twinY) +
          " מקביל לציר ה־x, לנקודות " +
          name +
          " ו־" +
          String(task.twinY || "").toUpperCase() +
          " יש אותו ערך y. אחר כך מציבים במשוואת הישר ומוצאים x."
        );
      }
      if (task.intercept === "x") {
        return head + " " + name + " על ציר ה-x → y = 0. אחר כך x לפי האורך הידוע.";
      }
      if (task.twinX && task.twinY) {
        return (
          head +
          " כדי למצוא את שני השיעורים נעזרים גם בישר שמקביל לציר ה־y וגם בישר שמקביל לציר ה־x: " +
          "הקו " +
          segmentPairName(task.twinX, name) +
          " מקביל לציר ה־y → אותו x כמו " +
          String(task.twinX || "").toUpperCase() +
          "; והקו " +
          segmentPairName(name, task.twinY) +
          " מקביל לציר ה־x → אותו y כמו " +
          String(task.twinY || "").toUpperCase() +
          "."
        );
      }
      return head;
    }
    if (progress.partial && progress.partial[task.id]) {
      return head;
    }
    var twin = String(task.twin || (miss === "y" ? task.twinY : task.twinX) || "").toUpperCase();
    var seg = segmentPairName(twin, name);
    var parallelAxis = miss === "x" ? "y" : "x";
    return (
      head +
      " בגלל שהקו " +
      seg +
      " מקביל לציר ה־" +
      parallelAxis +
      ", לנקודות " +
      twin +
      " ו־" +
      name +
      " יש אותו ערך " +
      miss +
      "."
    );
  }

  function segmentOrientation(task, map) {
    if (!task || task.kind !== "segment") return null;
    var a = task._fromPt || getPoint(map, task.from);
    var b = task._toPt || getPoint(map, task.to);
    if (!a || !b) return null;
    if (nearNum(a.y, b.y)) return "h";
    if (nearNum(a.x, b.x)) return "v";
    return null;
  }

  function segmentHintMessage(task, map, progress) {
    var name = String(task.label || "").toUpperCase();
    if (task.fromArea) {
      var fa = task.fromArea;
      var unk = fromAreaUnknownNames(task)[0];
      if (progress.partial && progress.partial[task.id]) {
        var prevFa = progress.lastExpr && progress.lastExpr[task.id];
        if (prevFa && fromAreaLooksLikeFormula(prevFa, task, { map: map })) {
          return (
            "הציבו את השטח " +
            fmtNum(fa.value) +
            " ואת הצלע הידועה, והשאירו את " +
            unk +
            " כנעלם (אפשר גם x)."
          );
        }
        return "פתרו את המשוואה — הנעלם הוא " + unk + " (אפשר גם x).";
      }
      return (
        "השטח " +
        (fa.label || "S") +
        "=" +
        fmtNum(fa.value) +
        " ידוע. רשמו " +
        (fa.label || "S") +
        "=" +
        (fromAreaLetterBody(task) || "(צלע×צלע)/2") +
        ", או הציבו ישר. הנעלם הוא " +
        unk +
        " (אפשר גם x)."
      );
    }
    if (progress.partial && progress.partial[task.id]) {
      return "חשבו את אורך הקטע " + name + " — התוצאה של גדול פחות קטן.";
    }
    if (task.drawHeight && !heightFootSnapped(progress, String(task.to || "").toUpperCase())) {
      return (
        "הוסיפו גובה מ־" +
        String(task.from || "").toUpperCase() +
        " עם «+ גובה», בחרו את הקודקוד, וגררו את הרגל אל הצלע (או לציר)."
      );
    }
    var ori = segmentOrientation(task, map);
    if (ori === "h") {
      return (
        "מצאו את אורך הקטע " +
        name +
        ". בגלל שהקו מקביל לציר ה־x, מחשבים לפי ערכי x: x גדול פחות x קטן."
      );
    }
    if (ori === "v") {
      return (
        "מצאו את אורך הקטע " +
        name +
        ". בגלל שהקו מקביל לציר ה־y, מחשבים לפי ערכי y: y גדול פחות y קטן."
      );
    }
    return "מצאו את אורך הקטע " + name + ".";
  }

  function distSegHintMessage(task, map, progress) {
    var name = String(task.label || distPointToSegName(task.point, task.from, task.to));
    var p = String(task.point || "").toUpperCase();
    var seg = String(task.from || "").toUpperCase() + String(task.to || "").toUpperCase();
    if (progress.partial && progress.partial[task.id]) {
      return "חשבו את המרחק " + name + " — התוצאה של גדול פחות קטן.";
    }
    var a = task._fromPt || getPoint(map, task.from);
    var b = task._toPt || getPoint(map, task.to);
    if (a && b && nearNum(a.x, b.x)) {
      return (
        "מצאו את מרחק הנקודה " +
        p +
        " מהקטע " +
        seg +
        ". בגלל ש־" +
        seg +
        " מקביל לציר ה־y, המרחק הוא לפי ערכי x: x גדול פחות x קטן."
      );
    }
    if (a && b && nearNum(a.y, b.y)) {
      return (
        "מצאו את מרחק הנקודה " +
        p +
        " מהקטע " +
        seg +
        ". בגלל ש־" +
        seg +
        " מקביל לציר ה־x, המרחק הוא לפי ערכי y: y גדול פחות y קטן."
      );
    }
    return "מצאו את מרחק הנקודה " + p + " מהקטע " + seg + ".";
  }

  function axisHintMessage(task, progress) {
    var name = String(task.label || axisDistanceName(task.point, task.axis || "x"));
    var p = String(task.point || "").toUpperCase();
    var ax = String(task.axis || "x").toLowerCase() === "y" ? "y" : "x";
    if (progress.partial && progress.partial[task.id]) {
      return "חשבו את התוצאה: " + name + " = " + fmtNum(task.answer) + ".";
    }
    if (task.drawHeight) {
      if (task.heightFoot) {
        return (
          "הוסיפו גובה מ־" +
          p +
          " לציר " +
          ax +
          " עם «+ גובה», ואז מצאו את אורך " +
          name +
          " — המרחק בין " +
          p +
          " לרגל הגובה " +
          String(task.heightFoot).toUpperCase() +
          "."
        );
      }
      return (
        "הוסיפו גובה מ־" +
        p +
        " לציר " +
        ax +
        " עם «+ גובה», ואז מצאו את אורך האנך — המרחק האופקי מ־" +
        p +
        " לציר y (ערך |x|)."
      );
    }
    if (ax === "x") {
      return (
        "עבור " +
        name +
        ": מרחק מציר ה־x הוא פשוט ערך ה־y של הנקודה " +
        p +
        " (בערך מוחלט — המרחק תמיד חיובי). אפשר גם גדול פחות קטן מול 0."
      );
    }
    return (
      "עבור " +
      name +
      ": מרחק מציר ה־y הוא פשוט ערך ה־x של הנקודה " +
      p +
      " (בערך מוחלט — המרחק תמיד חיובי). אפשר גם גדול פחות קטן מול 0."
    );
  }

  function nextHint(pack, progress) {
    return attachPathOrient(pack, progress, nextHintCore(pack, progress));
  }

  function nextHintCore(pack, progress) {
    progress = progress || { done: {}, partial: {}, coords: {} };
    settleMidpointOnLineCoords(pack, progress);
    settleSkippedMidpointPairs(pack, progress);
    var pending = preferPartTasks(
      pack.tasks.filter(function (t) {
        return !progress.done[t.id];
      }),
      pack,
      progress
    );
    if (!pending.length) return { message: "התרגיל כבר נפתר." };

    var footHintEarly = nextHeightFootHint(pack, progress);
    var inProgressEarly = pending.filter(function (t) {
      if (progress.partial && progress.partial[t.id]) return true;
      var cf = progress.coords && progress.coords[t.id];
      return !!(cf && (cf.x || cf.y));
    });
    if (footHintEarly && !inProgressEarly.length) return footHintEarly;

    // מעדיפים משימה שהתלמיד כבר התחיל באותו סעיף
    var inProgress = pending.filter(function (t) {
      if (progress.partial && progress.partial[t.id]) return true;
      var cf = progress.coords && progress.coords[t.id];
      return !!(cf && (cf.x || cf.y));
    });
    var pairHoldH = lineMidPairTasks(pack, progress);
    if (pairHoldH && lineMidPairBlockedByPrior(pack, progress, pairHoldH)) {
      inProgress = inProgress.filter(function (t) {
        return t.id !== pairHoldH.yEnd.id && t.id !== pairHoldH.xEnd.id;
      });
    }
    // דרך מומלצת: קודם נקודה חסרה (כמו D), אחר כך אורכים optional, אחר כך שאר
    var recommendedPoints = pending.filter(function (t) {
      return t.optional && t.kind === "point";
    });
    var recommendedLens = pending.filter(function (t) {
      return t.optional && (t.kind === "segment" || t.kind === "origin" || t.kind === "axis");
    });
    // אחרי מציאת נקודה (כמו D) — עדיף לחשב קטע שיוצא ממנה (AD) לפני בסיס אחר
    var afterFoundPoint = pending.filter(function (t) {
      if (t.kind !== "segment") return false;
      return (pack.tasks || []).some(function (pt) {
        if (pt.kind !== "point" || !progress.done || !progress.done[pt.id]) return false;
        var name = String(pt.point || "").toUpperCase();
        return (
          String(t.from || "").toUpperCase() === name ||
          String(t.to || "").toUpperCase() === name
        );
      });
    });
    // אחרי גובה שננעל — עדיף למצוא את נקודת הרגל (H, D…)
    var snappedFootPt = null;
    (progress.draw && progress.draw.heights ? progress.draw.heights : []).some(function (h) {
      if (!h || !h.snapped || !h.footLabel) return false;
      var lab = String(h.footLabel).toUpperCase();
      var cand = pending.filter(function (t) {
        return t.kind === "point" && String(t.point || "").toUpperCase() === lab;
      })[0];
      if (cand) snappedFootPt = cand;
      return !!cand;
    });
    var t = inProgress.length
      ? inProgress[0]
      : snappedFootPt
        ? snappedFootPt
        : recommendedPoints.length
          ? recommendedPoints[0]
          : recommendedLens.length
            ? recommendedLens[0]
            : afterFoundPoint.length
              ? afterFoundPoint[0]
              : pending[0];
    var pairHint = axisMidPairTasks(pack, progress);
    var pairFocus = pairHint && axisMidPairFocus(pack, progress, pairHint);
    if (pairFocus && pending.some(function (u) { return u.id === pairFocus.id; })) {
      t = pairFocus;
    }
    var pairHintL = lineMidPairTasks(pack, progress);
    var pairFocusL =
      pairHintL &&
      !lineMidPairBlockedByPrior(pack, progress, pairHintL) &&
      lineMidPairFocus(pack, progress, pairHintL);
    if (pairFocusL && pending.some(function (u) { return u.id === pairFocusL.id; })) {
      t = pairFocusL;
    }
    var awaitPair = pending.filter(function (u) {
      return midpointAwaitingPair(u, pack, progress);
    });
    if (awaitPair.length) t = awaitPair[0];
    var lineWait = pending.filter(function (task) {
      var c = progress.coords && progress.coords[task.id];
      return task.kind === "onLine" && c && c.x;
    });
    if (lineWait.length) t = lineWait[0];
    if (!inProgress.length && !snappedFootPt) {
      var partNowH = currentPartText(pack, progress);
      var partIdsH = (partNowH && partNowH.taskIds) || [];
      var partWorkH = partIdsH.some(function (id) {
        if (progress.done && progress.done[id]) return true;
        if (progress.partial && progress.partial[id]) return true;
        var tt = (pack.tasks || []).filter(function (u) {
          return u.id === id;
        })[0];
        return tt && taskWorkStarted(progress, tt);
      });
      var unsortedHint = firstUnsortedLine(pack, progress);
      if (!partWorkH && unsortedHint && unsortedHint.line && !unsortedHint.line.hideEq) {
        var fromU =
          intersectStoredEq(progress, unsortedHint.key) ||
          (unsortedHint.line.eqText || prettyLineEq(unsortedHint.line));
        var stepU = lineMbSuggestNextStep(fromU, unsortedHint.line);
        return {
          task: givenRearrangeTask(),
          message: lineMbRearrangeHintMessage(fromU, unsortedHint.line),
          step: stepU,
          answer: stepU,
          rawStep: true,
        };
      }
    }
    // לא לקפוץ לשטח לפני אורכים מומלצים של אותו סעיף (למשל AE, DF בסעיף ב)
    if (t && t.kind === "area" && recommendedLens.length && !(progress.partial && progress.partial[t.id])) {
      t = recommendedLens[0];
    }
    if (!t) {
      return { task: null, message: "כל החלקים נפתרו.", step: "", answer: "" };
    }
    if (t.kind === "yesNo") {
      var ynAns = t.answer ? "כן" : "לא";
      return {
        task: t,
        message: t.question || "ענו כן או לא.",
        step: ynAns,
        answer: ynAns,
        rawStep: true,
      };
    }
    if (t.kind === "equalLen") {
      var segsH = t.segs || [];
      var missH = (pack.tasks || []).filter(function (u) {
        return u.kind === "distance" && (segsH.indexOf(u.id) >= 0 || segsH.indexOf(distSegName(u)) >= 0) && !(progress.done && progress.done[u.id]);
      });
      if (missH.length) {
        return {
          task: missH[0],
          message: "קודם חשבו את " + distSegName(missH[0]) + ", ואז " + distEqualShow(t) + ".",
          step: nextDistanceStep(missH[0], pack, progress),
          answer: fmtRad(distWantRad(missH[0], pack)),
          rawStep: true,
        };
      }
      return {
        task: t,
        message: "רשמו " + distEqualShow(t) + " אחרי שמצאתם את שני האורכים.",
        step: distEqualShow(t),
        answer: distEqualShow(t),
        rawStep: true,
      };
    }
    if (t.kind === "distance") {
      return {
        task: t,
        message: distanceHintMessage(t, pack, progress),
        step: nextDistanceStep(t, pack, progress),
        answer: fmtRad(distWantRad(t, pack)),
        rawStep: true,
      };
    }
    if (t.kind === "noIntercept") {
      var nax = String(t.axis || "x").toLowerCase() === "y" ? "y" : "x";
      var nshow = "אין חיתוך עם ציר " + nax;
      return {
        task: t,
        message: t.reason || "הישר מקביל לציר — אין נקודת חיתוך עם ציר " + nax + ".",
        step: nshow,
        answer: nshow,
        rawStep: true,
      };
    }
    if (t.kind === "parallel") {
      return nextParallelHint(pack, progress, t);
    }
    if (t.kind === "perpendicular") {
      return nextPerpendicularHint(pack, progress, t);
    }
    if (t.kind === "midpoint") {
      return midpointNextHint(pack, progress, t);
    }
    if (t.kind === "slope") {
      if (t.perpendicular) return perpSlopeNextHint(pack, progress, t);
      if (t.parallel) return parallelCopiedSlopeNextHint(pack, progress, t);
      var prevM = progress.lastExpr && progress.lastExpr[t.id];
      var stepsM = canonicalSlopeSteps(t, pack);
      var lhsH = slopeLhs(t);
      var wantShow = fmtSimpleFrac(slopeWant(pack, t)) || fmtNum(slopeWant(pack, t));
      var stepM = nextSlopeCanonicalStep(stepsM, prevM) || (lhsH + " = " + wantShow);
      var msgM = "הציבו " + lhsH + " = (y₂ − y₁)/(x₂ − x₁) (או m = …). אפשר לבחור איזו נקודה היא 1 ואיזו 2.";
      if (prevM) {
        stepM = nextSlopeCanonicalStep(stepsM, prevM) || (lhsH + " = " + wantShow);
        msgM = "חשבו את המונה ואת המכנה, ואז את השיפוע.";
      }
      return {
        task: t,
        message: msgM,
        step: stepM,
        answer: wantShow,
        rawStep: true,
      };
    }
    if (t.kind === "lineMb") {
      var mbLine = lineMbSourceLine(pack, progress, t);
      var mbParam = String(t.param || "m").toLowerCase();
      var mbEq = lineMbDisplayEq(mbLine, progress);
      var mbExtra =
        lineMbNeedsUnsorted(mbLine) && !lineMbRearranged(progress)
          ? " (אפשר קודם לסדר לצורה y = mx + b — לא חובה)"
          : "";
      var mbFrom = lineMbRearrangeStart(mbLine, progress);
      var mbStep =
        lineMbNeedsUnsorted(mbLine) && !lineMbRearranged(progress)
          ? lineMbSuggestNextStep(mbFrom, mbLine)
          : t.label + " = " + fmtNum(t.answer);
      var mbAnswer =
        lineMbNeedsUnsorted(mbLine) && !lineMbRearranged(progress)
          ? mbStep
          : fmtNum(t.answer);
      return {
        task: t,
        message:
          mbParam === "m"
            ? "מהו השיפוע m? (המקדם של x במשוואה " + mbEq + ")" + mbExtra
            : "מהו הגובה b? (המספר החופשי — נקודת החיתוך עם ציר y)" + mbExtra,
        step: mbStep,
        answer: mbAnswer,
      };
    }
    if (t.kind === "lineEq") {
      if (axisLineDir(t)) return axisLineNextHint(pack, progress, t);
      var prevEq = progress.lastExpr && progress.lastExpr[t.id];
      var stepEq = lineEqSuggestNext(prevEq, t);
      var specH = lineEqSpec(t);
      var msgEq =
        prevEq && lineEqHasB(prevEq) && !/y/i.test(prevEq)
          ? "פתרו את המשוואה ב־b, ואז רשמו y = mx + b."
          : "הציבו בנוסחה y − y₁ = m(x − x₁)" +
            (specH ? " — " + lineEqPointSlope(specH) : "") +
            " והביאו ל־y = mx + b.";
      return {
        task: t,
        message: msgEq,
        step: stepEq,
        answer: lineEqFinalText(t),
        rawStep: true,
      };
    }
    if (t.kind === "lineMatch") {
      var lmRow = lineMatchRowState(progress, t.id);
      if (!lmRow.lineDone) {
        return {
          task: t,
          message:
            "בחרו לאיזה ישר (I, II" +
            (lineMatchLineItems(pack).length > 2 ? ", III" : "") +
            ") מתאימה המשוואה. התחשבו בשיפוע ובמקדם b.",
          step: "",
          answer: "",
        };
      }
      if (!lmRow.reasonDone && t.answerKey !== "none") {
        var lmValid = lineMatchValidReasons(pack, lmRow.lineKey);
        return {
          task: t,
          message:
            lmValid.length === 1
              ? "נמקו: " + lineMatchReasonLabel(lmValid[0]) + "."
              : "נמקו: שיפוע חיובי, שיפוע שלילי, או גובה b — לפי מה שזיהה את הישר.",
          step: "",
          answer: "",
        };
      }
      return { task: t, message: "המשיכו למשוואה הבאה.", step: "", answer: "" };
    }
    if (t.kind === "lineIntersect" || (t.kind === "point" && progress.intersect && progress.intersect.taskId === t.id)) {
      var istage = intersectStage(pack, progress);
      if (istage.stage === "rearrange") {
        var rawI = istage.entry.line;
        var fromI = intersectStoredEq(progress, istage.key) || (rawI.eqText || prettyLineEq(rawI));
        var stepI = lineMbSuggestNextStep(fromI, rawI);
        return {
          task: t,
          message: lineMbRearrangeHintMessage(fromI, rawI),
          step: stepI,
          answer: stepI,
          rawStep: true,
        };
      }
      if (istage.stage === "knownY") {
        return {
          task: t,
          message:
            "הישר מקביל לציר x, לכן y ידוע. רשמו y = " +
            fmtNum(t.answerY) +
            ". אפשר גם להשוות בין המשוואות.",
          step: "y = " + fmtNum(t.answerY),
          answer: t.label + formatPointPair(t.answerX, t.answerY),
        };
      }
      if (istage.stage === "knownX") {
        return {
          task: t,
          message:
            "הישר מקביל לציר y, לכן x ידוע. רשמו x = " +
            fmtNum(t.answerX) +
            ". אפשר גם להשוות בין המשוואות.",
          step: "x = " + fmtNum(t.answerX),
          answer: t.label + formatPointPair(t.answerX, t.answerY),
        };
      }
      if (istage.stage === "equate") {
        var eqCanon = intersectEquateCanonical(pack, progress);
        return {
          task: t,
          message: "השוו בין שני הישרים — שוויון בין הביטויים של y.",
          step: eqCanon,
          answer: eqCanon,
          rawStep: true,
        };
      }
      if (istage.stage === "solveX") {
        var prevH = intersectSolveHintEq(pack, progress);
        var linX = teachLinearNext(prevH);
        if (linX) {
          return {
            task: t,
            message: linX.hint || "המשיכו לפתור עבור x.",
            step: linX.eq,
            answer: linX.eq,
            rawStep: true,
          };
        }
        return {
          task: t,
          message: "פתרו את המשוואה ומצאו את x.",
          step: "x = " + fmtNum(t.answerX),
          answer: "x = " + fmtNum(t.answerX),
        };
      }
      if (istage.stage === "plugY") {
        var intrPlug = progress.intersect || {};
        var plugH = intersectPlugStart(pack, progress, t);
        if (intrPlug.yDone) {
          return {
            task: t,
            message: "רשמו את נקודת החיתוך " + t.label + ".",
            step: t.label + formatPointPair(t.answerX, t.answerY),
            answer: t.label + formatPointPair(t.answerX, t.answerY),
          };
        }
        if (intrPlug.plugExpr) {
          return {
            task: t,
            message: "חשבו את הביטוי ורשמו y = " + fmtNum(t.answerY) + ".",
            step: "y = " + fmtNum(t.answerY),
            answer: "y = " + fmtNum(t.answerY),
          };
        }
        return {
          task: t,
          message: "הציבו x = " + fmtNum(t.answerX) + " ומצאו את y.",
          step: plugH,
          answer: "y = " + fmtNum(t.answerY),
          rawStep: true,
        };
      }
      return {
        task: t,
        message: "רשמו את נקודת החיתוך " + t.label + ".",
        step: t.label + formatPointPair(t.answerX, t.answerY),
        answer: t.label + formatPointPair(t.answerX, t.answerY),
      };
    }
    if (t.kind === "onLine") {
      var Lo = parseLineSpec(t.line || (currentPartText(pack, progress) && currentPartText(pack, progress).line) || pack.line);
      if (!Lo) return null;
      var cfO = (progress.coords && progress.coords[t.id]) || {};
      var plugBoth = fmtNum(t.answerY) + " = " + substYRhs(Lo, t.answerX);
      var calcBoth = fmtNum(t.answerY) + " = " + fmtNum(lineYAt(Lo, t.answerX));
      if (cfO.y) {
        var pick = reasonChoices(t)[0] || t.reason || "";
        return {
          task: t,
          message: "נמקו למה הנקודה על הישר או לא — אפשר לבחור אפשרות.",
          step: pick,
          answer: pick,
          rawStep: true,
        };
      }
      if (cfO.x && !cfO.y) {
        return {
          task: t,
          message: "לפי החישוב — האם " + t.label + " על הישר? ענו כן או לא.",
          step: t.on ? "כן" : "לא",
          answer: t.on ? "כן" : "לא",
          rawStep: true,
        };
      }
      if (progress.partial && progress.partial[t.id] && progress.lastExpr && progress.lastExpr[t.id]) {
        var lastL = progress.lastExpr[t.id];
        if (/^[yY]\s*=/.test(lastL)) {
          return {
            task: t,
            message: "חשבו את y אחרי ההצבה.",
            step: "y=" + fmtNum(lineYAt(Lo, t.answerX)),
            answer: "y=" + fmtNum(lineYAt(Lo, t.answerX)),
          };
        }
        return {
          task: t,
          message: "חשבו את שני האגפים.",
          step: calcBoth,
          answer: calcBoth,
          rawStep: true,
        };
      }
      return {
        task: t,
        message:
          "בדקו אם " +
          t.label +
          " על הישר " +
          prettyLineEq(Lo) +
          ". דרך 1: הציבו x ו־y והראו אם האגפים שווים. דרך 2: הציבו רק x וחשבו y.",
        step: plugBoth,
        answer: plugBoth,
        rawStep: true,
      };
    }
    if (t.kind === "freePoint") {
      var partF = currentPartText(pack, progress);
      var Lf = parseLineSpec(t.line || (partF && partF.line) || pack.line);
      var sample = Lf ? formatPointPair(0, Lf.b) : "(0;0)";
      return {
        task: t,
        message: "רשמו נקודה על הישר — בחרו x, הציבו, וקחו את y שיוצא. למשל " + sample + ".",
        step: sample,
        answer: sample,
        rawStep: true,
      };
    }
    if (t.kind === "point") {
      var msg = pointHintMessage(t, progress);
      var ptName = String(t.point || "").toUpperCase();
      var fullPoint = t.label + pointTaskLabel(t);
      var hintLine = lineForPointTask(pack, progress, t);
      if (hintLine) {
        var Lh = parseLineSpec(hintLine);
        var missH = String(t.missing || "").toLowerCase();
        var cfH = (progress.coords && progress.coords[t.id]) || {};
        if (missH === "both" && !cfH.x && !cfH.y) {
          if (t.twinX && !t.twinY) {
            return {
              task: t,
              message: msg,
              step: "x = " + fmtNum(t.answerX),
              answer: fullPoint,
            };
          }
          if (t.twinY && !t.twinX) {
            return {
              task: t,
              message: msg,
              step: "y = " + fmtNum(t.answerY),
              answer: fullPoint,
            };
          }
        }
        if (missH === "y" || (cfH.x && !cfH.y)) {
          if (cfH.y) {
            return { task: t, message: "רשמו את הנקודה " + ptName + "(x;y).", step: fullPoint, answer: fullPoint };
          }
          var prevYExpr = progress.lastExpr && progress.lastExpr[t.id];
          if (yEqGivesCoord(prevYExpr, t.answerY)) {
            return { task: t, message: "רשמו את הנקודה " + ptName + "(x;y).", step: fullPoint, answer: fullPoint };
          }
          if (progress.partial && progress.partial[t.id] && prevYExpr) {
            if (eqIsKnownAxisValue(prevYExpr, "x") || /^x\s*=/i.test(prevYExpr)) {
              var impAfterX = implicitZeroedEq(hintLine, "x") || implicitPlugEq(hintLine, "x");
              return {
                task: t,
                message: "הציבו x = " + fmtNum(t.answerX) + " במשוואה וחשבו את y.",
                step: impAfterX || "y=" + substYRhs(Lh, t.answerX),
                answer: fullPoint,
                rawStep: true,
              };
            }
            if (/^y\s*=/i.test(prevYExpr) && exprStillOpen(lastEqStage(prevYExpr))) {
              return {
                task: t,
                message: "חשבו את הביטוי ורשמו y = " + fmtNum(t.answerY) + ".",
                step: "y=" + fmtNum(t.answerY),
                answer: fullPoint,
              };
            }
            if (/=/.test(prevYExpr)) {
              var linY = teachLinearNext(prevYExpr);
              if (linY) {
                return {
                  task: t,
                  message: linY.hint || "המשיכו לבודד את y.",
                  step: linY.eq,
                  answer: fullPoint,
                  rawStep: true,
                };
              }
            }
            return {
              task: t,
              message: "חשבו את הביטוי ורשמו y = " + fmtNum(t.answerY) + ".",
              step: "y=" + fmtNum(t.answerY),
              answer: fullPoint,
            };
          }
          if (t.intercept === "y") {
            var easyY = preferredInterceptLine(pack, t, progress);
            var eqY = easyY ? prettyLineEq(easyY.line) : prettyLineEq(Lh);
            return {
              task: t,
              message: "הציבו x = 0 במשוואה " + eqY + " ומצאו את y. זו הדרך הקלה.",
              step: "x = 0",
              answer: fullPoint,
              rawStep: true,
            };
          }
          return {
            task: t,
            message:
              "יודעים x=" +
              fmtNum(t.answerX) +
              ". הציבו במשוואת הישר " +
              prettyLineEq(Lh) +
              " וחשבו.",
            step: "y=" + substYRhs(Lh, t.answerX),
            answer: fullPoint,
            rawStep: true,
          };
        }
        if (missH === "x" || (cfH.y && !cfH.x)) {
          if (cfH.x && cfH.y) {
            return { task: t, message: "רשמו את הנקודה " + ptName + "(x;y).", step: fullPoint, answer: fullPoint };
          }
          if (cfH.x && !cfH.y) {
            return {
              task: t,
              message:
                "יודעים x=" +
                fmtNum(t.answerX) +
                ". הציבו במשוואת הישר " +
                prettyLineEq(Lh) +
                ".",
              step: "y=" + substYRhs(Lh, t.answerX),
              answer: fullPoint,
              rawStep: true,
            };
          }
          var startEq = startPlugYEq(hintLine, t.answerY);
          var curEq = (progress.lastExpr && progress.lastExpr[t.id]) || startEq;
          var prevXExpr = progress.lastExpr && progress.lastExpr[t.id];
          if (eqIsBareAxis(prevXExpr, "y")) {
            return {
              task: t,
              message: "הציבו במשוואה ומצאו x.",
              step: startEq,
              answer: fullPoint,
              rawStep: true,
            };
          }
          var linX = teachLinearNext(eqIsBareAxis(curEq, "y") ? startEq : curEq);
          if (!prevXExpr) {
            if ((t.intercept === "x" || nearNum(t.answerY, 0)) && !cfH.y && !t.twinY) {
              var easyX = preferredInterceptLine(pack, t, progress);
              var eqX = easyX ? prettyLineEq(easyX.line) : prettyLineEq(Lh);
              return {
                task: t,
                message: "הציבו y = 0 במשוואה " + eqX + " ומצאו את x. זו הדרך הקלה.",
                step: "y = 0",
                answer: fullPoint,
                rawStep: true,
              };
            }
            return {
              task: t,
              message:
                "יודעים y=" +
                fmtNum(t.answerY) +
                ". הציבו במשוואת הישר " +
                prettyLineEq(Lh) +
                " ופתרו עבור x (כמו משוואה בנעלם אחד).",
              step: startEq,
              answer: fullPoint,
              rawStep: true,
            };
          }
          if (/^y\s*=\s*0$/i.test(String(prevXExpr || ""))) {
            return {
              task: t,
              message: "הציבו y = 0 במשוואת הישר " + prettyLineEq(hintLine) + ".",
              step: startEq,
              answer: fullPoint,
              rawStep: true,
            };
          }
          if (linX) {
            return {
              task: t,
              message: linX.hint || "המשיכו לבודד את x.",
              step: linX.eq,
              answer: fullPoint,
              rawStep: true,
            };
          }
          if (!cfH.x) {
            return {
              task: t,
              message: "חשבו ורשמו x = " + fmtNum(t.answerX) + ".",
              step: "x=" + fmtNum(t.answerX),
              answer: fullPoint,
            };
          }
          return { task: t, message: "רשמו את הנקודה " + ptName + "(x;y).", step: fullPoint, answer: fullPoint };
        }
      }
      if (!hintLine) {
        var cfAx = (progress.coords && progress.coords[t.id]) || {};
        if ((t.intercept === "x" || nearNum(t.answerY, 0)) && !cfAx.y) {
          return {
            task: t,
            message: ptName + " על ציר ה-x → y = 0. אחר כך x לפי האורך הידוע.",
            step: "y = 0",
            answer: fullPoint,
            rawStep: true,
          };
        }
        if ((t.intercept === "x" || nearNum(t.answerY, 0)) && cfAx.y && !cfAx.x) {
          return {
            task: t,
            message: "y = 0. עכשיו x לפי האורך הידוע.",
            step: "x = " + fmtNum(t.answerX),
            answer: fullPoint,
          };
        }
        if (t.twinX && !cfAx.x) {
          return {
            task: t,
            message:
              "הישר מקביל לציר ה-y → ל־" +
              ptName +
              " אותו x כמו " +
              String(t.twinX).toUpperCase() +
              ".",
            step: "x = " + fmtNum(t.answerX),
            answer: fullPoint,
          };
        }
        if (t.twinX && cfAx.x && !cfAx.y) {
          return {
            task: t,
            message: "יודעים x. עכשיו y לפי האורך הידוע.",
            step: "y = " + fmtNum(t.answerY),
            answer: fullPoint,
          };
        }
      }
      var heightSnapped = (progress.draw && progress.draw.heights || []).some(function (h) {
        return h && h.snapped && String(h.footLabel || "").toUpperCase() === ptName;
      });
      if (heightSnapped) {
        msg =
          "מצאו את הנקודה " +
          ptName +
          ". רגל הגובה כבר על הצלע — עכשיו רשמו את שיעוריה (למשל " +
          ptName +
          "(x;y) או " +
          ptName +
          "x=…).";
      } else if (
        t.twinX &&
        t.twinY &&
        !(progress.coords && progress.coords[t.id] && (progress.coords[t.id].x || progress.coords[t.id].y))
      ) {
        var drawCfgHint = resolveDrawConfig(pack) || {};
        var heightFoot = (drawCfgHint.heights || []).some(function (h) {
          return h && String(h.footLabel || "").toUpperCase() === ptName;
        });
        var isRectVertex = (pack.tasks || []).some(function (at) {
          return at.kind === "area" && areaShape(at) === "rect";
        });
        if (ptName === "D" && heightFoot) {
          msg =
            "מצאו את הנקודה D. AD מאונך ל־BC (מקביל לציר ה־y) → ל־D אותו x כמו ל־" +
            String(t.twinX).toUpperCase() +
            "; D על הישר של BC" +
            (t.outsideBase ? " (במשולש קהה-זווית הרגל נופלת מחוץ לקטע, על ההמשך)" : "") +
            " → אותו y כמו ל־" +
            String(t.twinY).toUpperCase() +
            " (ו־C). אפשר לרשום D(x;y) או Dx=" +
            String(t.twinX).toUpperCase() +
            "x ו־Dy=" +
            String(t.twinY).toUpperCase() +
            "y.";
        } else if (isRectVertex) {
          msg =
            "מצאו את הנקודה " +
            ptName +
            ". צלעות המלבן מקבילות לצירים → ל־" +
            ptName +
            " אותו x כמו ל־" +
            String(t.twinX).toUpperCase() +
            " ואותו y כמו ל־" +
            String(t.twinY).toUpperCase() +
            ".";
        } else if (heightFoot) {
          msg =
            "מצאו את הנקודה " +
            ptName +
            ". הגובה מאונך לצלע → ל־" +
            ptName +
            " אותו x כמו ל־" +
            String(t.twinX).toUpperCase() +
            " ואותו y כמו ל־" +
            String(t.twinY).toUpperCase() +
            (t.outsideBase ? ". זה גובה חיצוני: הרגל על המשך הצלע, לא על הקטע עצמו." : ".");
        }
      }
      var cfTwin = (progress.coords && progress.coords[t.id]) || {};
      if (t.twinX && t.twinY && cfTwin.x && !cfTwin.y) {
        return {
          task: t,
          message: msg,
          step: "y = " + fmtNum(t.answerY),
          answer: fullPoint,
        };
      }
      if (t.twinX && t.twinY && cfTwin.y && !cfTwin.x) {
        return {
          task: t,
          message: msg,
          step: "x = " + fmtNum(t.answerX),
          answer: fullPoint,
        };
      }
      // צעד אחד / השלמה: ישר את הנקודה; Bx=… נשאר אופציונלי בהקלדה
      return {
        task: t,
        message: msg,
        step: fullPoint,
        answer: fullPoint,
      };
    }
    if (t.kind === "segment" || t.kind === "origin" || t.kind === "axis" || t.kind === "distSeg") {
      if (t.drawHeight) {
        var endsOne = drawHeightEnds(pack, t);
        if (endsOne && endsOne.foot && !heightFootSnapped(progress, endsOne.foot)) {
          return {
            task: t,
            addHeight: true,
            message:
              "הוסיפו גובה מ־" +
              endsOne.apex +
              " עם «+ גובה». צעד אחד יוסיף את הגובה לשרטוט.",
            step: "",
            answer: "",
          };
        }
      }
      var segMsg =
        t.kind === "distSeg"
          ? distSegHintMessage(t, pack.map, progress)
          : t.kind === "axis"
            ? axisHintMessage(t, progress)
            : t.fromArea || t.kind === "segment"
              ? segmentHintMessage(t, pack.map, progress)
              : t.kind === "origin" && t.timesLen
                ? "נתון " +
                  t.label +
                  " = " +
                  fmtNum(t.timesLen.factor) +
                  " · " +
                  originSegmentName(t.timesLen.origin || t.timesLen.point) +
                  ". חשבו את האורך."
              : progress.partial && progress.partial[t.id]
                ? "חשבו את התוצאה: " + t.label + " = " + fmtNum(t.answer) + "."
                : "עבור " +
                  t.label +
                  ": רשמו גדול פחות קטן לפי השיעור המתאים על הציר, ואז את התוצאה.";
      if (t.fromArea) {
        var faSteps = fromAreaCanonicalSteps(t, pack);
        var prevFaH = progress.lastExpr && progress.lastExpr[t.id];
        if (progress.partial && progress.partial[t.id] && prevFaH) {
          if (fromAreaLooksLikeFormula(prevFaH, t, pack)) {
            return {
              task: t,
              message: segMsg,
              step: fromAreaPlugEq(t, pack, fromAreaHasX(prevFaH)),
              answer: fmtNum(t.answer),
              rawStep: true,
            };
          }
          var prevXH = fromAreaToXEq(prevFaH, t, pack);
          var linFa = /=/.test(prevXH) ? teachLinearNext(prevXH) : null;
          if (linFa && linFa.eq) {
            var unkH = fromAreaUnknownNames(t)[0];
            var stepFa = fromAreaHasX(prevFaH) ? linFa.eq : xEqBackToUnknown(linFa.eq, unkH);
            return {
              task: t,
              message: linFa.hint || segMsg,
              step: stepFa,
              answer: fmtNum(t.answer),
              rawStep: true,
            };
          }
          return {
            task: t,
            message: segMsg,
            step: fromAreaUnknownNames(t)[0] + "=" + fmtNum(t.answer),
            answer: fmtNum(t.answer),
          };
        }
        return {
          task: t,
          message: segMsg,
          step: faSteps[0] || t.label + "=" + fmtNum(t.answer),
          answer: fmtNum(t.answer),
          rawStep: true,
        };
      }
      if (progress.partial && progress.partial[t.id]) {
        var prevExpr = progress.lastExpr && progress.lastExpr[t.id];
        var simpStep = prevExpr && simplifiedDiffBody(prevExpr);
        if (simpStep) {
          return {
            task: t,
            message: segMsg,
            step: simpStep.replace(/\s+/g, ""),
            answer: fmtNum(t.answer),
          };
        }
        return {
          task: t,
          message: segMsg,
          step: fmtNum(t.answer),
          answer: fmtNum(t.answer),
        };
      }
      if (t.kind === "origin" && t.timesLen && !(progress.partial && progress.partial[t.id])) {
        var srcP = getPoint(pack.map, t.timesLen.origin || t.timesLen.point);
        var srcL = distOrigin(srcP);
        return {
          task: t,
          message: segMsg,
          step: t.label + "=" + fmtNum(t.timesLen.factor) + "*" + fmtNum(srcL),
          answer: fmtNum(t.answer),
          rawStep: true,
        };
      }
      return {
        task: t,
        message: segMsg,
        step: labeledDiff(t, pack.map),
        answer: fmtNum(t.answer),
      };
    }
    if (t.kind === "area") {
      var nextBit = nextAreaStageBit(t, pack.map, progress);
      var bitStep = String(nextBit || "").replace(/×/g, "*");
      if (bitStep && !(progress.partial && progress.partial[t.id]) && !/^[Ss△Δ□▭]/.test(bitStep)) {
        bitStep = (t.label || "S") + "=" + bitStep;
      }
      return {
        task: t,
        message: areaStageMessage(nextBit, t, pack.map),
        step: bitStep,
        answer: fmtNum(t.answer),
      };
    }
    if (progress.partial && progress.partial[t.id]) {
      return {
        task: t,
        message: "חשבו את התוצאה: " + t.label + " = " + fmtNum(t.answer) + ".",
        step: fmtNum(t.answer),
        answer: fmtNum(t.answer),
      };
    }
    return {
      task: t,
      message:
        "עבור " +
        t.label +
        ": רשמו קודם " +
        labeledDiff(t, pack.map) +
        ", ואז את התוצאה " +
        fmtNum(t.answer) +
        ".",
      step: labeledDiff(t, pack.map),
      answer: fmtNum(t.answer),
    };
  }

  function stripExerciseNumberPrefix(text) {
    return String(text || "").replace(/^תרגיל\s+\d+[א-ת]?[.:]?\s*/, "");
  }

  function formatPartHtml(text) {
    text = stripExerciseNumberPrefix(text);
    var MathR = global.DoctematicaMath;
    if (MathR && typeof MathR.proseHTML === "function") {
      if (/\n/.test(String(text || ""))) {
        return String(text || "")
          .split(/\n/)
          .map(function (line) {
            var chunk = String(line || "").trim();
            return chunk ? MathR.proseHTML(chunk) : "";
          })
          .filter(Boolean)
          .join("<br>");
      }
      return MathR.proseHTML(text);
    }
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function givenLineText(pack, progress) {
    if (pack && pack.hideGiven) return null;
    if (pack && isLineMatchPack(pack) && !lineMatchPartActive(pack, progress)) return null;
    if (pack && pack.givenText) return "נתון: " + pack.givenText;
    if (pack && pack.lines && pack.lines.length) {
      var parts = intersectLines(pack).map(function (item) {
        return "הישר " + intersectLineLabel(pack, item.key) + ": " + intersectDisplayEq(pack, progress, item.key);
      });
      return "נתון:\n" + parts.join("\n");
    }
    if (pack && pack.givenText) return "נתון: " + pack.givenText;
    if (pack && pack.givenArea && pack.givenArea.value != null) {
      var gaLab = pack.givenArea.label || "S";
      return "נתון: " + gaLab + "=" + fmtNum(pack.givenArea.value);
    }
    var line = activeLine(pack, progress);
    if (line) return "נתון: הישר " + givenLineEqText(line, progress);
    if (pack && pack.parts && pack.parts.some(function (p) { return p.line; })) {
      return "נתון: הישרים בתרגיל (ראו שרטוט לכל סעיף)";
    }
    return "נתון: נקודות על מערכת הצירים";
  }

  function canonicalLineIntersectSteps(task, pack) {
    if (!task || task.kind !== "lineIntersect" || !pack) return [];
    var lines = [];
    var thru = linesThroughTask(pack, task);
    var pair = thru.length >= 2 ? thru : intersectLines(pack);
    pair.forEach(function (item) {
      if (lineMbNeedsUnsorted(item.line) && !partMixesSlopeAndIntersect(pack, {})) {
        lines.push(sortedLineEq(item.line));
      }
    });
    var easyI = intersectEasyAxis(pack, task);
    if (easyI && easyI.kind === "y") {
      lines.push("y = " + fmtNum(task.answerY));
      var plugI = startPlugYEq(easyI.other.line, task.answerY);
      if (plugI) {
        lines.push(plugI);
        var TeachY = global.DoctematicaTeach;
        var curY = plugI;
        var guardY = 0;
        while (TeachY && TeachY.nextAction && guardY < 12) {
          guardY += 1;
          var actY = TeachY.nextAction(curY);
          if (!actY || actY.done || !actY.eq) break;
          var nxtY = String(actY.eq).replace(/[−–—]/g, "-").replace(/\s+/g, "");
          var nowY = String(curY).replace(/[−–—]/g, "-").replace(/\s+/g, "");
          if (nxtY === nowY) break;
          lines.push(actY.eq);
          curY = actY.eq;
        }
      }
      var lastYc = String(lines[lines.length - 1] || "");
      if (!/x\s*=/i.test(lastYc)) lines.push("x = " + fmtNum(task.answerX));
      lines.push(task.label + " " + formatPointPair(task.answerX, task.answerY));
      return lines;
    }
    if (easyI && easyI.kind === "x") {
      lines.push("x = " + fmtNum(task.answerX));
      var Lo = parseLineSpec(easyI.other && easyI.other.line);
      if (Lo && Lo.vertical == null) {
        lines.push("y = " + substYRhs(Lo, task.answerX));
        if (normEqText("y = " + substYRhs(Lo, task.answerX)) !== normEqText("y = " + fmtNum(task.answerY))) {
          lines.push("y = " + fmtNum(task.answerY));
        }
      }
      lines.push(task.label + " " + formatPointPair(task.answerX, task.answerY));
      return lines;
    }
    var rhs0 = pair[0]
      ? slopeInterceptRhsText(sortedLineEq(pair[0].line), pair[0].line)
      : null;
    var rhs1 = pair[1]
      ? slopeInterceptRhsText(sortedLineEq(pair[1].line), pair[1].line)
      : null;
    if (rhs0 && rhs1) {
      var eqCanon = rhs0 + " = " + rhs1;
      lines.push(eqCanon);
      var Teach = global.DoctematicaTeach;
      var cur = eqCanon;
      var guard = 0;
      while (Teach && Teach.nextAction && guard < 12) {
        guard += 1;
        var act = Teach.nextAction(cur);
        if (!act || act.done || !act.eq) break;
        var nxt = String(act.eq).replace(/[−–—]/g, "-").replace(/\s+/g, "");
        var now = String(cur).replace(/[−–—]/g, "-").replace(/\s+/g, "");
        if (nxt === now) break;
        lines.push(act.eq);
        cur = act.eq;
      }
    }
    var key = task.lineKey || (pair[0] && pair[0].key);
    var raw = intersectLineRaw(pack, key);
    var L = parseLineSpec(raw);
    if (L) lines.push("y = " + substYRhs(L, task.answerX));
    lines.push("y = " + fmtNum(task.answerY));
    lines.push(task.label + " " + formatPointPair(task.answerX, task.answerY));
    return lines;
  }

  function canonicalLineMbSteps(task, pack) {
    if (!task || task.kind !== "lineMb" || !pack) return [];
    var raw = lineForTask(pack, task.id) || pack.line;
    var param = String(task.param || "m").toLowerCase();
    var lines = [];
    if (param === "m" && lineMbNeedsUnsorted(raw)) lines.push(sortedLineEq(raw));
    lines.push(task.label + " = " + fmtNum(task.answer));
    return lines;
  }

  function givenAxisLenCoordStep(task, pack) {
    if (!task || !pack) return "";
    var name = String(task.point || task.label || "").toUpperCase();
    var lens = pack.givenLengths || [];
    var i;
    for (i = 0; i < lens.length; i++) {
      var a = String(lens[i].from || "").toUpperCase();
      var b = String(lens[i].to || "").toUpperCase();
      var len = Number(lens[i].len);
      if (!isFinite(len)) continue;
      var other = a === name ? b : b === name ? a : "";
      if (!other) continue;
      var op = getPoint(pack.map, other);
      var self = getPoint(pack.map, name);
      if (!op || !self) continue;
      if (nearNum(self.y, 0) && nearNum(op.y, 0)) {
        var xExpr = self.x < op.x ? fmtNum(op.x) + " − " + fmtNum(len) : fmtNum(op.x) + " + " + fmtNum(len);
        return "x = " + xExpr;
      }
      if (nearNum(self.x, 0) && nearNum(op.x, 0)) {
        var yExpr = self.y < op.y ? fmtNum(op.y) + " − " + fmtNum(len) : fmtNum(op.y) + " + " + fmtNum(len);
        return "y = " + yExpr;
      }
    }
    return "";
  }

  function canonicalAxisLenPointSteps(task, pack) {
    if (!task || task.kind !== "point") return [];
    var y0 = nearNum(task.answerY, 0);
    var x0 = nearNum(task.answerX, 0);
    var out = [];
    if (task.intercept === "x" || (y0 && !x0)) {
      out.push("y = 0");
      var xFromLen = givenAxisLenCoordStep(task, pack);
      out.push(xFromLen || "x = " + fmtNum(task.answerX));
      if (xFromLen) out.push("x = " + fmtNum(task.answerX));
      out.push(task.label + pointTaskLabel(task));
      return out;
    }
    if (task.intercept === "y" || (x0 && !y0) || task.twinX) {
      out.push("x = 0");
      var yFromLen = givenAxisLenCoordStep(task, pack);
      out.push(yFromLen || "y = " + fmtNum(task.answerY));
      if (yFromLen) out.push("y = " + fmtNum(task.answerY));
      out.push(task.label + pointTaskLabel(task));
      return out;
    }
    return [];
  }

  function canonicalLineSteps(task, pack) {
    if (!task || !pack) return [];
    if (task.kind === "noIntercept") {
      var cax = String(task.axis || "x").toLowerCase() === "y" ? "y" : "x";
      return ["אין חיתוך עם ציר " + cax];
    }
    var rawLine = lineForPointTask(pack, {}, task) || lineForTask(pack, task && task.id);
    if (task.kind === "point" && !rawLine) return canonicalAxisLenPointSteps(task, pack);
    if (!rawLine || task.kind !== "point") return [];
    var L = parseLineSpec(rawLine);
    var miss = String(task.missing || "").toLowerCase();
    var lines = [];
    function pushSolveXFromKnownY() {
      var eq = startPlugYEq(rawLine, task.answerY);
      lines.push(eq);
      var Teach = global.DoctematicaTeach;
      var cur = eq;
      var guard = 0;
      while (Teach && Teach.nextAction && guard < 12) {
        guard += 1;
        var act = Teach.nextAction(cur);
        if (!act || act.done || !act.eq) break;
        var nxt = String(act.eq).replace(/[−–—]/g, "-").replace(/\s+/g, "");
        var now = String(cur).replace(/[−–—]/g, "-").replace(/\s+/g, "");
        if (nxt === now) break;
        lines.push(act.eq);
        cur = act.eq;
      }
      var last = String(lines[lines.length - 1] || "");
      if (!/x\s*=/i.test(last)) lines.push("x = " + fmtNum(task.answerX));
    }
    if (miss === "both" && task.twinY && !task.twinX) {
      lines.push("y = " + fmtNum(task.answerY));
      pushSolveXFromKnownY();
      lines.push(task.label + pointTaskLabel(task));
      return lines;
    }
    if (miss === "both" && (task.twinX || (nearNum(task.answerX, 0) && !task.twinY))) {
      lines.push("x = " + fmtNum(task.answerX));
      var plug = "y = " + substYRhs(L, task.answerX);
      lines.push(plug);
      var yVal = "y = " + fmtNum(task.answerY);
      if (normEqText(plug) !== normEqText(yVal)) lines.push(yVal);
      lines.push(task.label + pointTaskLabel(task));
      return lines;
    }
    if (miss === "y") {
      if (task.intercept === "y" && nearNum(task.answerX, 0)) lines.push("x = 0");
      else if (!nearNum(task.answerX, 0)) lines.push("x = " + fmtNum(task.answerX));
      var impShown = implicitPlugEq(rawLine, "x");
      var impDrop = implicitZeroedEq(rawLine, "x");
      var plugY = task.intercept === "y" && (impShown || impDrop) ? impShown || impDrop : "y = " + substYRhs(L, task.answerX);
      if (plugY) lines.push(plugY);
      if (impDrop && impShown && normEqText(impDrop) !== normEqText(impShown)) lines.push(impDrop);
      var yDone = "y = " + fmtNum(task.answerY);
      if (normEqText(plugY) !== normEqText(yDone)) lines.push(yDone);
      lines.push(task.label + pointTaskLabel(task));
      return lines;
    }
    if (miss === "x") {
      if (nearNum(task.answerY, 0) && !task.twinX && !task.twinY) lines.push("y = 0");
      else if (!nearNum(task.answerY, 0) && !task.twinX) lines.push("y = " + fmtNum(task.answerY));
      if (task.twinX) {
        lines.push("x = " + fmtNum(task.answerX));
        lines.push("y = " + substYRhs(L, task.answerX));
        lines.push("y = " + fmtNum(task.answerY));
        lines.push(task.label + pointTaskLabel(task));
        return lines;
      }
      if (task.twinY) {
        lines.push("y = " + fmtNum(task.answerY));
        pushSolveXFromKnownY();
        lines.push(task.label + pointTaskLabel(task));
        return lines;
      }
      pushSolveXFromKnownY();
      lines.push(task.label + pointTaskLabel(task));
      return lines;
    }
    return [task.label + pointTaskLabel(task)];
  }

  function canonicalOnLineSteps(task, pack) {
    if (!task || !pack) return [];
    if (task.kind === "freePoint") {
      var Lf = parseLineSpec(task.line || pack.line);
      return Lf ? [formatPointPair(0, Lf.b)] : [];
    }
    if (task.kind !== "onLine") return [];
    var L = parseLineSpec(task.line || pack.line);
    if (!L) return [];
    var ly = lineYAt(L, task.answerX);
    var lines = [];
    lines.push(fmtNum(task.answerY) + " = " + substYRhs(L, task.answerX));
    lines.push(fmtNum(task.answerY) + " = " + fmtNum(ly));
    lines.push(task.on ? "כן" : "לא");
    return lines;
  }

  function partStillOpen(part, taskById, progress) {
    if (!part) return false;
    if (part.untilCoord && part.untilCoord.id) {
      var uid = part.untilCoord.id;
      if (progress.done && progress.done[uid]) return false;
      var axis = String(part.untilCoord.axis || "x").toLowerCase();
      var cf = progress.coords && progress.coords[uid];
      if (cf && cf[axis]) return false;
      return true;
    }
    var ids = part.taskIds || [];
    if (!ids.length) return true;
    return ids.some(function (id) {
      var t = taskById[id];
      if (t && t.optional) return false;
      return !(progress.done && progress.done[id]);
    });
  }

  function currentPartText(pack, progress) {
    progress = progress || { done: {} };
    settleMidpointOnLineCoords(pack, progress);
    settleSkippedMidpointPairs(pack, progress);
    var parts = pack.parts || [];
    var taskById = {};
    (pack.tasks || []).forEach(function (t) {
      taskById[t.id] = t;
    });
    var i;
    for (i = 0; i < parts.length; i++) {
      if (partStillOpen(parts[i], taskById, progress)) return parts[i];
    }
    if (!remainingRequired(pack, progress.done).length) return null;
    return parts[parts.length - 1] || null;
  }

  global.DoctematicaGeometry = {
    analyzeStart: analyzeStart,
    initDrawProgress: initDrawProgress,
    resolveDrawConfig: resolveDrawConfig,
    drawPartActive: drawPartActive,
    siteAddHeight: siteAddHeight,
    siteAddAllHeights: siteAddAllHeights,
    checkTyped: checkTyped,
    nextHint: nextHint,
    currentPartText: currentPartText,
    currentFocusTask: currentFocusTask,
    taskStepLabel: taskStepLabel,
    partStepByTask: partStepByTask,
    taskWorkStarted: taskWorkStarted,
    axisMidPairTasks: axisMidPairTasks,
    canonicalAxisMidPairSteps: canonicalAxisMidPairSteps,
    lineMidPairTasks: lineMidPairTasks,
    canonicalLineMidPairSteps: canonicalLineMidPairSteps,
    canonicalGivenLineRearrangeSteps: canonicalGivenLineRearrangeSteps,
    formatPartHtml: formatPartHtml,
    sceneForProgress: sceneForProgress,
    canonicalStep: canonicalStep,
    canonicalDiffChain: canonicalDiffChain,
    canonicalDiffSteps: canonicalDiffSteps,
    canonicalAreaChain: canonicalAreaChain,
    canonicalAreaSteps: canonicalAreaSteps,
    canonicalLineSteps: canonicalLineSteps,
    canonicalMidpointSteps: canonicalMidpointSteps,
    canonicalSlopeSteps: canonicalSlopeSteps,
    canonicalDistanceSteps: canonicalDistanceSteps,
    canonicalParallelSteps: canonicalParallelSteps,
    canonicalPerpendicularSteps: canonicalPerpendicularSteps,
    perpSlopeReason: perpSlopeReason,
    canonicalLineMbSteps: canonicalLineMbSteps,
    canonicalLineEqSteps: canonicalLineEqSteps,
    canonicalLineIntersectSteps: canonicalLineIntersectSteps,
    sortedLineEq: sortedLineEq,
    lineMbNeedsUnsorted: lineMbNeedsUnsorted,
    canonicalOnLineSteps: canonicalOnLineSteps,
    givenLineText: givenLineText,
    givenLineEqText: givenLineEqText,
    prettyLineEq: prettyLineEq,
    lineAsk: lineAsk,
    submitReason: submitReason,
    reasonChoices: reasonChoices,
    onLinePlugReason: onLinePlugReason,
    isLineMatchPack: isLineMatchPack,
    lineMatchPartActive: lineMatchPartActive,
    firstPartLineMatchOnly: firstPartLineMatchOnly,
    lineMatchPanelData: lineMatchPanelData,
    lineMatchAutoCompleteRemaining: lineMatchAutoCompleteRemaining,
    submitLineMatchLine: submitLineMatchLine,
    submitLineMatchReason: submitLineMatchReason,
    lineMatchReasonOptions: lineMatchReasonOptions,
    lineMatchOneStep: lineMatchOneStep,
    areaShape: areaShape,
    fmtNum: fmtNum,
    capsHistoryLetters: capsHistoryLetters,
    coordLabel: coordLabel,
    coordLabelHTML: coordLabelHTML,
    segmentLength: segmentLength,
    distOrigin: distOrigin,
    distAxis: distAxis,
  };
})(window);
