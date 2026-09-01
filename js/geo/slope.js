(function (global) {
  function install(dep) {
    var fmtNum = dep.fmtNum;
    var near0 = dep.near0;
    var nearNum = dep.nearNum;
    var fmtSimpleFrac = dep.fmtSimpleFrac;
    var slopeWant = dep.slopeWant;
    var slopeLhs = dep.slopeLhs;
    var slopeLhsFromTyped = dep.slopeLhsFromTyped;
    var slopePairFromPack = dep.slopePairFromPack;
    var slopeTagLetters = dep.slopeTagLetters;
    var slopeTaskLetters = dep.slopeTaskLetters;
    var resolveSlopeByLetters = dep.resolveSlopeByLetters;
    var parseSlopeFormula = dep.parseSlopeFormula;
    var classifySlopeFormula = dep.classifySlopeFormula;
    var prettySlopeFormula = dep.prettySlopeFormula;
    var cloneMaps = dep.cloneMaps;
    var remainingRequired = dep.remainingRequired;
    var preferPartTasks = dep.preferPartTasks;
    var currentPartText = dep.currentPartText;
    var typedLooksLikeCoordStep = dep.typedLooksLikeCoordStep;
    var perpTypedIsFormula = dep.perpTypedIsFormula;
    var parseLineMbInput = dep.parseLineMbInput;
    var looksLikeLinearEq = dep.looksLikeLinearEq;
    var parseConstAxisEq = dep.parseConstAxisEq;
    var parseYesNo = dep.parseYesNo;
    var parsePointPair = dep.parsePointPair;
    var checkCopiedSlope = dep.checkCopiedSlope;
    var checkPerpSlope = dep.checkPerpSlope;
    var canonicalPerpSlopeSteps = dep.canonicalPerpSlopeSteps;
    var parallelCopyShow = dep.parallelCopyShow;
    var openFindMidpointTask = dep.openFindMidpointTask;
    var typedLooksLikeFindMidpoint = dep.typedLooksLikeFindMidpoint;
    var lettersMatchMidSegment = dep.lettersMatchMidSegment;


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

  function slopeNamedPointsMsg(task, pack) {
    var labs = slopeTaskLetters(task);
    var fromMap = pack && pack.map ? Object.keys(pack.map) : [];
    if (fromMap.length >= 2) {
      return "בציור הנקודות הן " + fromMap.join(", ") + ". רשמו " + slopeLhs(task) + ".";
    }
    return "רשמו " + slopeLhs(task) + " (הנקודות " + labs.from + " ו־" + labs.to + ").";
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
    var lettersEarly = slopeTagLetters(typed);
    if (lettersEarly) {
      var letterPool = (pending || []).filter(function (t) {
        return t && t.kind === "slope";
      });
      var resolvedEarly = resolveSlopeByLetters(pack, letterPool, lettersEarly);
      if (resolvedEarly.kind === "task") {
        if (resolvedEarly.task.parallel) {
          return checkCopiedSlope(typed, parsed, pack, progress, resolvedEarly.task, doneMap, partialMap, coordsMap);
        }
        if (resolvedEarly.task.perpendicular) {
          return checkPerpSlope(typed, parsed, pack, progress, resolvedEarly.task, doneMap, partialMap, coordsMap);
        }
      }
    }
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

    function twoPointSlopeEmptyHint() {
      return "רשמו m = (y₂ − y₁)/(x₂ − x₁) עם שתי הנקודות (לא משנה איזו היא 1), או ישר את השיפוע.";
    }

    function nextTwoPointSlopeHint(pack, progress, t) {
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

    return {
      canonicalSlopeSteps: canonicalSlopeSteps,
      nextSlopeCanonicalStep: nextSlopeCanonicalStep,
      checkSlope: checkSlope,
      twoPointSlopeEmptyHint: twoPointSlopeEmptyHint,
      nextTwoPointSlopeHint: nextTwoPointSlopeHint
    };
  }

  global.DoctematicaGeoSlope = { install: install };
})(window);
