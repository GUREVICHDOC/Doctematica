(function (global) {
  function install(dep) {
    var near0 = dep.near0;
    var nearNum = dep.nearNum;
    var fmtSimpleFrac = dep.fmtSimpleFrac;
    var preferPartTasks = dep.preferPartTasks;
    var cloneMaps = dep.cloneMaps;
    var remainingRequired = dep.remainingRequired;
    var parseLineSpec = dep.parseLineSpec;
    var parallelRelatedSlopeTasks = dep.parallelRelatedSlopeTasks;
    var slopeWant = dep.slopeWant;
    var slopeLhs = dep.slopeLhs;
    var slopeTagNorm = dep.slopeTagNorm;
    var rewriteMixedNum = dep.rewriteMixedNum;
    var parseNumberToken = dep.parseNumberToken;
    var evalArithLoose = dep.evalArithLoose;
    var currentPartText = dep.currentPartText;
    var taskByIdMap = dep.taskByIdMap;
    var currentFocusTask = dep.currentFocusTask;
    var parseYesNo = dep.parseYesNo;
    var looksLikeLinearEq = dep.looksLikeLinearEq;
    var typedLooksLikeCoordStep = dep.typedLooksLikeCoordStep;
    var parseSlopeFormula = dep.parseSlopeFormula;
    var parseLineMbInput = dep.parseLineMbInput;
    var parseMChain = dep.parseMChain;
    var markPriorSlopes = dep.markPriorSlopes;
    var markRelatedSlopes = dep.markRelatedSlopes;
    var visibleUnsortedLines = dep.visibleUnsortedLines;
    var lineMbNeedsUnsorted = dep.lineMbNeedsUnsorted;
    var canonicalLineRearrangeSteps = dep.canonicalLineRearrangeSteps;
    var parallelLinesReady = dep.parallelLinesReady;
    var firstUnsortedLine = dep.firstUnsortedLine;
    var intersectStoredEq = dep.intersectStoredEq;
    var prettyLineEq = dep.prettyLineEq;
    var lineMbSuggestNextStep = dep.lineMbSuggestNextStep;
    var lineMbRearrangeHintMessage = dep.lineMbRearrangeHintMessage;
    var canonicalSlopeSteps = dep.canonicalSlopeSteps;
    var nextSlopeCanonicalStep = dep.nextSlopeCanonicalStep;
    var fmtNumHint = dep.fmtNum;

    function fmtParenFactor(n) {
      var s = fmtSimpleFrac(n);
      if (n < 0 || /\//.test(s)) return "(" + s + ")";
      return s;
    }

    function perpGivenSlope(pack, task) {
      if (task && task.givenM != null && isFinite(task.givenM)) return Number(task.givenM);
      var lines = (pack && pack.lines) || [];
      var i;
      for (i = 0; i < lines.length; i++) {
        var item = lines[i];
        if (!item || !item.line) continue;
        var L = parseLineSpec(item.line);
        if (L && L.vertical == null && L.m != null && isFinite(L.m) && !near0(L.m)) return L.m;
      }
      return null;
    }

    function perpWantFromGiven(given, task) {
      if (task && task.m != null && isFinite(task.m)) return Number(task.m);
      if (given == null || !isFinite(given) || near0(given)) return null;
      return -1 / given;
    }

    function perpSlopeWant(pack, task) {
      var pw = perpWantFromGiven(perpGivenSlope(pack, task), task);
      if (pw != null) return pw;
      if (task && task.m != null && isFinite(task.m)) return Number(task.m);
      return slopeWant(pack, task);
    }

    function perpSlopePair(task, pack) {
      if (task && task.m1 != null && isFinite(task.m1) && task.m2 != null && isFinite(task.m2)) {
        return { m1: Number(task.m1), m2: Number(task.m2) };
      }
      if (task && task.kind === "slope" && task.perpendicular) {
        var givenU = perpGivenSlope(pack, task);
        var wantU = perpWantFromGiven(givenU, task);
        if (givenU != null && wantU != null) return { m1: givenU, m2: wantU, unknown: true };
      }
      var lines = (pack && pack.lines) || [];
      if (lines.length >= 2) {
        var L1 = parseLineSpec(lines[0].line);
        var L2 = parseLineSpec(lines[1].line);
        if (!L1 || !L2) return null;
        if (L1.vertical != null && L2.vertical != null) return { axis: "both-vert" };
        if (L1.vertical != null && L2.m != null) {
          return near0(L2.m) ? { axis: "hv" } : { axis: "v-oblique", m: L2.m };
        }
        if (L2.vertical != null && L1.m != null) {
          return near0(L1.m) ? { axis: "hv" } : { axis: "v-oblique", m: L1.m };
        }
        if (L1.m != null && L2.m != null) return { m1: L1.m, m2: L2.m };
      }
      var relP = parallelRelatedSlopeTasks(pack, task);
      if (relP.length >= 2) {
        var w1 = slopeWant(pack, relP[0]);
        var w2 = slopeWant(pack, relP[1]);
        if (w1 != null && w2 != null) return { m1: w1, m2: w2 };
      }
      return null;
    }

    function perpIsAxisPair(pair) {
      return !!(pair && pair.axis === "hv");
    }

    function perpProductValue(pair) {
      if (!pair || pair.m1 == null || pair.m2 == null) return null;
      return pair.m1 * pair.m2;
    }

    function perpProductShow(pair) {
      if (!pair || pair.m1 == null || pair.m2 == null) return "";
      var prod = pair.m1 * pair.m2;
      return fmtParenFactor(pair.m1) + " · " + fmtParenFactor(pair.m2) + " = " + fmtSimpleFrac(prod);
    }

    function perpArePerpendicular(task, pack) {
      if (task && task.answer != null) return !!task.answer;
      var pair = perpSlopePair(task, pack);
      if (perpIsAxisPair(pair)) return true;
      var prod = perpProductValue(pair);
      return prod != null && nearNum(prod, -1);
    }

    function perpSlopeReason(task, pack) {
      if (perpIsAxisPair(perpSlopePair(task, pack))) {
        return "ישר אופקי מאונך לישר אנכי.";
      }
      var pair = perpSlopePair(task, pack);
      var show = perpProductShow(pair);
      if (perpArePerpendicular(task, pack)) {
        return show
          ? "מכפלת השיפועים " + show + " — הישרים מאונכים."
          : "מכפלת השיפועים היא −1 — הישרים מאונכים.";
      }
      return show
        ? "מכפלת השיפועים " + show + " ≠ −1 — הישרים לא מאונכים."
        : "מכפלת השיפועים אינה −1 — הישרים לא מאונכים.";
    }

    function perpUnknownLhs(task) {
      if (task && task.from && task.to) return slopeLhs(task);
      var lab = slopeTagNorm(task && task.label);
      if (lab) return "m" + lab;
      return "m₂";
    }

    function perpFormulaShow() {
      return "m₁ · m₂ = −1";
    }

    function perpProductUnknownShow(task, pack) {
      var pair = perpSlopePair(task, pack);
      if (!pair || pair.m1 == null) return "";
      return fmtParenFactor(pair.m1) + " · " + perpUnknownLhs(task) + " = −1";
    }

    function perpTypedIsFormula(typed) {
      var got = parseTimesEq(typed);
      if (!got || got.a.kind !== "m" || got.b.kind !== "m") return false;
      return got.right.kind === "num" && nearNum(got.right.value, -1);
    }

    function normalizeTimesTyped(typed) {
      return rewriteMixedNum(String(typed || ""))
        .replace(/(\d+)½/g, function (_, w) {
          return String(parseInt(w, 10) * 2 + 1) + "/2";
        })
        .replace(/½/g, "1/2")
        .replace(/¼/g, "1/4")
        .replace(/[−–—]/g, "-")
        .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, function (ch) {
          return String("₀₁₂₃₄₅₆₇₈₉".indexOf(ch));
        })
        .replace(/[·×]/g, "*")
        .replace(/(\d)\s*\*\s*m/gi, "$1*m")
        .replace(/(\d)m/gi, "$1*m")
        .replace(/\s+/g, "");
    }

    function parseTimesFactor(tok) {
      var s = String(tok || "").replace(/^\(+/, "").replace(/\)+$/, "");
      var m = s.match(/^m_?([A-Za-z]{1,4}|\d+)?$/i);
      if (m) return { kind: "m", tag: String(m[1] || "").toUpperCase() };
      var v = parseNumberToken(s);
      if (v == null) v = evalArithLoose(s);
      if (v != null && isFinite(v)) return { kind: "num", value: v };
      return null;
    }

    function parseTimesEq(typed) {
      var s = normalizeTimesTyped(typed);
      if (!s) return null;
      var eq = s.match(/^([^=]+)=(.+)$/);
      if (!eq) return null;
      var left = eq[1];
      var rightTok = parseTimesFactor(eq[2]);
      var star = left.lastIndexOf("*");
      if (star < 0) return null;
      var a = parseTimesFactor(left.slice(0, star));
      var b = parseTimesFactor(left.slice(star + 1));
      if (!a || !b || !rightTok) return null;
      return { a: a, b: b, right: rightTok };
    }

    function perpTagMatchesUnknown(tag, task) {
      var t = String(tag || "").toUpperCase();
      if (!t || t === "2" || t === "C") return true;
      var lhs = perpUnknownLhs(task).replace(/^m/i, "").toUpperCase();
      if (t === lhs) return true;
      var a = String((task && task.from) || "").toUpperCase();
      var b = String((task && task.to) || "").toUpperCase();
      if (a && b) {
        if (t === a + b || t === b + a) return true;
      }
      return false;
    }

    function timesHasUnknownM(got, task) {
      if (!got) return false;
      var parts = [got.a, got.b, got.right];
      var i;
      for (i = 0; i < parts.length; i++) {
        if (parts[i] && parts[i].kind === "m" && perpTagMatchesUnknown(parts[i].tag, task)) return true;
      }
      return false;
    }

    function canonicalPerpendicularSteps(task, pack) {
      var lines = [];
      ((pack && pack.lines) || []).forEach(function (item) {
        if (!item || !item.line || item.line.hideEq) return;
        if (!lineMbNeedsUnsorted(item.line)) return;
        canonicalLineRearrangeSteps(item.line).forEach(function (s) {
          lines.push(s);
        });
      });
      var pair = perpSlopePair(task, pack);
      if (perpIsAxisPair(pair)) {
        lines.push(task && task.answer ? "כן" : "לא");
        return lines;
      }
      var prodLine = perpProductShow(pair);
      if (prodLine) lines.push(prodLine);
      if (task && task.slopeIds && task.slopeIds.length) {
        lines.push("ולכן הישרים מאונכים");
        return lines;
      }
      lines.push(task && task.answer ? "כן" : "לא");
      return lines;
    }

    function canonicalPerpSlopeSteps(task, pack) {
      var out = [];
      var prod = perpProductUnknownShow(task, pack);
      var want = perpSlopeWant(pack, task);
      var fin = perpUnknownLhs(task) + " = " + fmtSimpleFrac(want);
      if (prod) {
        out.push(perpFormulaShow());
        out.push(prod);
      }
      out.push(fin);
      return out;
    }

    function perpPendingTask(pack, progress) {
      var part = currentPartText(pack, progress);
      var ids = (part && part.taskIds) || [];
      return (pack.tasks || []).filter(function (t) {
        if (t.kind !== "perpendicular") return false;
        if (progress.done && progress.done[t.id]) return false;
        return !ids.length || ids.indexOf(t.id) >= 0;
      })[0];
    }

    function finishPerpendicular(task, pack, progress, doneMap, partialMap, coordsMap, show) {
      var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
      maps.done[task.id] = true;
      delete maps.partial[task.id];
      maps.lastExpr[task.id] = show;
      markRelatedSlopes(pack, progress, task, maps);
      var left = remainingRequired(pack, maps.done);
      var proof = !!(task && task.slopeIds && task.slopeIds.length);
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
        siteNote: show === "כן" || show === "לא" ? undefined : perpSlopeReason(task, pack),
        extraShow: proof && show && show !== "כן" && show !== "לא" ? ["ולכן הישרים מאונכים"] : [],
        message: left.length ? "נכון. המשיכו." : "נכון.",
      };
    }

    function partialPerpendicular(task, pack, progress, doneMap, partialMap, coordsMap, show, msg) {
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
        siteNote: perpSlopeReason(task, pack),
        message: msg,
      };
    }

    function checkPerpProductLine(typed, task, pack) {
      var pair = perpSlopePair(task, pack);
      if (perpIsAxisPair(pair)) return null;
      var prod = perpProductValue(pair);
      if (prod == null) return null;
      var got = parseTimesEq(typed);
      if (got && !timesHasUnknownM(got, task)) {
        var fa = got.a.kind === "num" ? got.a.value : null;
        var fb = got.b.kind === "num" ? got.b.value : null;
        var fr = got.right.kind === "num" ? got.right.value : null;
        if (fa != null && fb != null && fr != null) {
          var samePair =
            (nearNum(fa, pair.m1) && nearNum(fb, pair.m2)) ||
            (nearNum(fa, pair.m2) && nearNum(fb, pair.m1));
          if (samePair && nearNum(fa * fb, fr) && nearNum(fr, prod)) {
            return { kind: "product", show: perpProductShow(pair) };
          }
          if (samePair && !nearNum(fr, fa * fb)) {
            return { kind: "bad", message: "המכפלה עדיין לא מדויקת." };
          }
        }
        if (got.a.kind === "m" && got.b.kind === "m" && fr != null) {
          if (nearNum(fr, prod)) return { kind: "product", show: perpProductShow(pair) };
          return {
            kind: "bad",
            message: nearNum(prod, -1)
              ? "מכפלת השיפועים היא −1."
              : "מכפלת השיפועים אינה −1.",
          };
        }
      }
      var raw = normalizeTimesTyped(typed);
      if (got) return null;
      if (/^m/i.test(raw) || parseYesNo(typed) != null) return null;
      var v = evalArithLoose(raw);
      if (v != null && nearNum(v, prod)) return { kind: "product", show: perpProductShow(pair) };
      return null;
    }

    function checkPerpendicular(typed, pack, progress, pending, doneMap, partialMap, coordsMap) {
      var hits = preferPartTasks(
        (pending || []).filter(function (t) {
          return t.kind === "perpendicular";
        }),
        pack,
        progress
      );
      if (!hits.length) {
        var partPerpSkip = currentPartText(pack, progress);
        var mapPerpSkip = taskByIdMap(pack);
        var perpSkipYn = ((partPerpSkip && partPerpSkip.taskIds) || [])
          .map(function (id) {
            return mapPerpSkip[id];
          })
          .filter(function (u) {
            return u && u.kind === "perpendicular" && !(progress.done && progress.done[u.id]);
          })[0];
        if (perpSkipYn && parseYesNo(typed) != null) hits = [perpSkipYn];
      }
      if (!hits.length) return null;
      var task = hits[0];
      var prodHit = checkPerpProductLine(typed, task, pack);
      if (prodHit && prodHit.kind === "bad") return { ok: false, message: prodHit.message };
      if (prodHit && prodHit.kind === "product") {
        if (task.slopeIds && task.slopeIds.length) {
          return finishPerpendicular(
            task,
            pack,
            progress,
            doneMap,
            partialMap,
            coordsMap,
            prodHit.show
          );
        }
        return partialPerpendicular(
          task,
          pack,
          progress,
          doneMap,
          partialMap,
          coordsMap,
          prodHit.show,
          "נכון. עכשיו ענו כן או לא: אם המכפלה −1 הישרים מאונכים."
        );
      }
      var yn = parseYesNo(typed);
      if (yn == null) {
        if (looksLikeLinearEq(typed) || /^y/i.test(String(typed || "").replace(/\s+/g, ""))) return null;
        return null;
      }
      if (!parallelLinesReady(pack, progress)) {
        return {
          ok: false,
          message: "קודם סדרו את המשוואות לצורה y = mx + b, ואז ענו כן או לא לפי מכפלת השיפועים.",
        };
      }
      var want = perpArePerpendicular(task, pack);
      if (yn !== want) {
        return {
          ok: false,
          message: want
            ? "מכפלת השיפועים היא −1 — הישרים מאונכים. רשמו כן."
            : perpIsAxisPair(perpSlopePair(task, pack))
              ? "ישר אופקי מאונך לישר אנכי. רשמו כן."
              : "מכפלת השיפועים אינה −1 — הישרים לא מאונכים. רשמו לא.",
        };
      }
      return finishPerpendicular(task, pack, progress, doneMap, partialMap, coordsMap, yn ? "כן" : "לא");
    }

    function checkPerpSlope(typed, parsed, pack, progress, task, doneMap, partialMap, coordsMap) {
      var want = perpSlopeWant(pack, task);
      if (want == null) return null;
      if (typedLooksLikeCoordStep(typed, parsed)) return null;
      if (looksLikeLinearEq(typed) && !parseTimesEq(typed) && !perpTypedIsFormula(typed)) return null;
      var slopeForm = parseSlopeFormula(typed);
      if (slopeForm && !slopeForm.atomic) {
        return {
          ok: false,
          message:
            "זה שיפוע לפי שתי נקודות. השיפוע המאונך בא מ־" +
            perpFormulaShow() +
            ", הצבה, ובידוד.",
        };
      }
      var pair = perpSlopePair(task, pack);
      var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
      var lhs = perpUnknownLhs(task);
      function finish(show) {
        maps.done[task.id] = true;
        delete maps.partial[task.id];
        delete maps.lastExpr[task.id];
        markPriorSlopes(pack, progress, task, maps);
        var left = remainingRequired(pack, maps.done);
        return {
          ok: true,
          solved: left.length === 0,
          done: maps.done,
          partial: maps.partial,
          coords: maps.coords,
          lastExpr: maps.lastExpr,
          task: task,
          show: show || lhs + " = " + fmtSimpleFrac(want),
          rawStep: true,
          message: "נכון. " + lhs + " = " + fmtSimpleFrac(want) + ".",
        };
      }
      function partial(show, msg, note) {
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
          siteNote: note,
          message: msg,
        };
      }
      if (perpTypedIsFormula(typed)) {
        return partial(
          perpFormulaShow(),
          "נכון. עכשיו הציבו את השיפוע הנתון: " + perpProductUnknownShow(task, pack) + ".",
          "ישרים מאונכים — מכפלת השיפועים היא −1."
        );
      }
      var gotEq = parseTimesEq(typed);
      if (gotEq && timesHasUnknownM(gotEq, task) && pair && pair.m1 != null) {
        var known = null;
        var rhs = gotEq.right.kind === "num" ? gotEq.right.value : null;
        if (gotEq.a.kind === "num") known = gotEq.a.value;
        if (gotEq.b.kind === "num") known = known == null ? gotEq.b.value : known;
        if (known != null && nearNum(known, pair.m1) && rhs != null && nearNum(rhs, -1)) {
          return partial(
            perpProductUnknownShow(task, pack),
            "נכון. עכשיו בודדו את השיפוע: " + lhs + " = −1/" + fmtSimpleFrac(pair.m1) + "."
          );
        }
      }
      var gotVal =
        parsed && parsed.value != null && isFinite(parsed.value)
          ? parsed.value
          : parseLineMbInput(typed, "m");
      var chain = parseMChain(typed);
      if (chain && chain.value != null) gotVal = chain.value;
      if (gotVal == null && slopeForm && slopeForm.atomic && slopeForm.value != null) {
        gotVal = slopeForm.value;
      }
      if (gotVal != null && nearNum(gotVal, want)) {
        return finish(lhs + " = " + fmtSimpleFrac(want));
      }
      if (gotVal != null && pair && pair.m1 != null && nearNum(gotVal, pair.m1)) {
        return {
          ok: false,
          message:
            "זה שיפוע הישר הנתון. לישרים מאונכים רשמו " +
            perpFormulaShow() +
            ", הציבו, ואז בודדו — השיפוע המאונך הוא " +
            fmtSimpleFrac(want) +
            ".",
        };
      }
      if (gotVal != null && nearNum(gotVal, -want) && !near0(want)) {
        return { ok: false, message: "הסימן הפוך. מכפלת השיפועים היא −1, לכן השיפוע השני הוא −1/" + fmtSimpleFrac(pair && pair.m1) + "." };
      }
      if (gotVal != null) {
        return { ok: false, message: "השיפוע עדיין לא מדויק. לישרים מאונכים: m₁ · m₂ = −1." };
      }
      if (parseYesNo(typed) != null) return null;
      if (looksLikeLinearEq(typed)) {
        if (visibleUnsortedLines(pack, progress).length) return null;
        return {
          ok: false,
          message:
            "המשוואה כבר מסודרת. רשמו " +
            perpFormulaShow() +
            ", הציבו, או ישר את השיפוע.",
        };
      }
      if (gotEq) return { ok: false, message: "רשמו " + perpProductUnknownShow(task, pack) + ", ואז בודדו את השיפוע." };
      return {
        ok: false,
        message:
          "לישרים מאונכים מכפלת השיפועים היא −1. רשמו " +
          perpFormulaShow() +
          ", הציבו " +
          perpProductUnknownShow(task, pack) +
          ", או ישר " +
          lhs +
          " = " +
          fmtSimpleFrac(want) +
          ".",
      };
    }

    function perpYesNoPrompt(pack, progress) {
      var perpAsk = perpPendingTask(pack, progress);
      if (
        perpAsk &&
        parallelLinesReady(pack, progress) &&
        progress.partial &&
        progress.partial[perpAsk.id]
      ) {
        var focPerp = currentFocusTask(pack, progress);
        if (!focPerp || focPerp.kind === "perpendicular" || focPerp.id === perpAsk.id) {
          return {
            stage: "yesno",
            task: perpAsk,
            question: "האם הישרים מאונכים זה לזה?",
          };
        }
      }
      return null;
    }

    function perpendicularKindHint(pack, progress) {
      return parallelLinesReady(pack, progress)
        ? "כפלו את השיפועים. אם המכפלה −1 — כן (מאונכים); אחרת לא. אפשר גם ישר כן או לא."
        : "קודם סדרו את המשוואות לצורה y = mx + b.";
    }

    function perpSlopeEmptyHint(task) {
      return (
        "לישרים מאונכים מכפלת השיפועים היא −1. רשמו " +
        perpFormulaShow() +
        ", הציבו, או ישר את השיפוע."
      );
    }

    function nextPerpendicularHint(pack, progress, t) {
      var unsortedQ = firstUnsortedLine(pack, progress);
      if (unsortedQ) {
        var fromQ =
          intersectStoredEq(progress, unsortedQ.key) ||
          (unsortedQ.line.eqText || prettyLineEq(unsortedQ.line));
        var stepQ = lineMbSuggestNextStep(fromQ, unsortedQ.line);
        return {
          task: t,
          message: lineMbRearrangeHintMessage(fromQ, unsortedQ.line),
          step: stepQ,
          answer: t.answer ? "כן" : "לא",
          rawStep: true,
        };
      }
      var relQ = parallelRelatedSlopeTasks(pack, t);
      var undoneQ = relQ.filter(function (st) {
        return !(progress.done && progress.done[st.id]);
      });
      if (undoneQ.length) {
        return {
          task: undoneQ[0],
          message: "כדי להראות שהישרים מאונכים, מצאו קודם את " + slopeLhs(undoneQ[0]) + ".",
          step: canonicalSlopeSteps(undoneQ[0], pack)[0] || slopeLhs(undoneQ[0]),
          answer: fmtNumHint(slopeWant(pack, undoneQ[0])),
          rawStep: true,
        };
      }
      var pairH = perpSlopePair(t, pack);
      if (perpIsAxisPair(pairH)) {
        return {
          task: t,
          message: "ישר אופקי (מקביל לציר x) מאונך לישר אנכי (מקביל לציר y). ענו כן או לא.",
          step: t.answer ? "כן" : "לא",
          answer: t.answer ? "כן" : "לא",
          rawStep: true,
        };
      }
      var prevPerp = progress.lastExpr && progress.lastExpr[t.id];
      if (!prevPerp) {
        return {
          task: t,
          message: "כפלו את שני השיפועים. אם המכפלה −1 הישרים מאונכים.",
          step: perpProductShow(pairH),
          answer: t.answer ? "כן" : "לא",
          rawStep: true,
        };
      }
      return {
        task: t,
        message: perpArePerpendicular(t, pack)
          ? "המכפלה −1 — הישרים מאונכים. ענו כן."
          : "המכפלה אינה −1 — הישרים לא מאונכים. ענו לא.",
        step: t.answer ? "כן" : "לא",
        answer: t.answer ? "כן" : "לא",
        rawStep: true,
      };
    }

    function perpSlopeNextHint(pack, progress, t) {
      var prevM = progress.lastExpr && progress.lastExpr[t.id];
      var stepsM = canonicalSlopeSteps(t, pack);
      var lhsH = perpUnknownLhs(t);
      var wantShow = fmtSimpleFrac(perpSlopeWant(pack, t)) || fmtNumHint(perpSlopeWant(pack, t));
      var stepM = nextSlopeCanonicalStep(stepsM, prevM) || lhsH + " = " + wantShow;
      var msgM =
        "לישרים מאונכים מכפלת השיפועים היא −1. רשמו " +
        perpFormulaShow() +
        ", הציבו את השיפוע הנתון, ואז בודדו. אפשר גם ישר את השיפוע.";
      var plugLine = perpProductUnknownShow(t, pack);
      var givenPlug = t.givenM != null ? t.givenM : (perpSlopePair(t, pack) || {}).m1;
      var finM = lhsH + " = " + wantShow;
      if (perpTypedIsFormula(prevM)) {
        stepM = plugLine || stepsM[1] || stepsM[stepsM.length - 1];
        msgM = "הציבו את השיפוע הנתון בנוסחה: " + plugLine + ".";
      } else if (prevM && plugLine && normSlopeStepLine(prevM) === normSlopeStepLine(plugLine)) {
        stepM = stepsM[stepsM.length - 1] || finM;
        msgM = "בודדו את השיפוע: " + lhsH + " = −1/" + fmtSimpleFrac(givenPlug) + ".";
      } else if (
        prevM &&
        givenPlug != null &&
        (function () {
          var pv = parseLineMbInput(prevM, "m");
          return pv != null && nearNum(pv, givenPlug);
        })()
      ) {
        stepM = perpFormulaShow();
        msgM =
          "יש את שיפוע הישר. עכשיו מכפלת השיפועים: רשמו " +
          perpFormulaShow() +
          ", הציבו, ואז בודדו.";
      } else if (
        prevM &&
        (function () {
          var sf = parseSlopeFormula(prevM);
          return sf && !sf.atomic;
        })()
      ) {
        stepM = perpFormulaShow();
        msgM =
          "יש את שיפוע הישר. עכשיו מכפלת השיפועים: רשמו " +
          perpFormulaShow() +
          ", הציבו, ואז בודדו.";
      } else if (looksLikeLinearEq(prevM) && !parseTimesEq(prevM)) {
        stepM = perpFormulaShow();
        msgM =
          "לישרים מאונכים מכפלת השיפועים היא −1. רשמו " +
          perpFormulaShow() +
          ", הציבו את השיפוע הנתון, ואז בודדו. אפשר גם ישר את השיפוע.";
      } else {
        stepM = nextSlopeCanonicalStep(stepsM, prevM) || lhsH + " = " + wantShow;
        if (prevM) {
          msgM = "בודדו את השיפוע: " + lhsH + " = −1/" + fmtSimpleFrac(givenPlug) + ".";
        }
      }
      return {
        task: t,
        message: msgM,
        step: stepM,
        answer: wantShow,
        rawStep: true,
      };
    }

    function normSlopeStepLine(s) {
      return String(s || "")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "")
        .replace(/_/g, "");
    }

    return {
      perpGivenSlope: perpGivenSlope,
      perpWantFromGiven: perpWantFromGiven,
      perpTypedIsFormula: perpTypedIsFormula,
      perpUnknownLhs: perpUnknownLhs,
      perpFormulaShow: perpFormulaShow,
      parseTimesEq: parseTimesEq,
      checkPerpendicular: checkPerpendicular,
      checkPerpSlope: checkPerpSlope,
      canonicalPerpendicularSteps: canonicalPerpendicularSteps,
      canonicalPerpSlopeSteps: canonicalPerpSlopeSteps,
      perpSlopeReason: perpSlopeReason,
      perpYesNoPrompt: perpYesNoPrompt,
      perpendicularKindHint: perpendicularKindHint,
      perpSlopeEmptyHint: perpSlopeEmptyHint,
      nextPerpendicularHint: nextPerpendicularHint,
      perpSlopeNextHint: perpSlopeNextHint,
    };
  }

  global.DoctematicaGeoPerp = { install: install };
})(window);
