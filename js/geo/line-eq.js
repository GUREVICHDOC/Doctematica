(function (global) {
  function install(dep) {
    var fmtNum = dep.fmtNum;
    var near0 = dep.near0;
    var nearNum = dep.nearNum;
    var fmtFrac = dep.fmtFrac;
    var parseNumberToken = dep.parseNumberToken;
    var evalArithLoose = dep.evalArithLoose;
    var slopeInterceptXTerm = dep.slopeInterceptXTerm;
    var sortedLineEq = dep.sortedLineEq;
    var sameSlopeIntercept = dep.sameSlopeIntercept;
    var prettyRearrangeStep = dep.prettyRearrangeStep;
    var teachLinearNext = dep.teachLinearNext;
    var normEqText = dep.normEqText;
    var looksLikeLinearEq = dep.looksLikeLinearEq;
    var parseSlopeInterceptText = dep.parseSlopeInterceptText;
    var cloneMaps = dep.cloneMaps;
    var remainingRequired = dep.remainingRequired;
    var preferPartTasks = dep.preferPartTasks;
    var typedLooksLikeCoordStep = dep.typedLooksLikeCoordStep;
    var extractAnswerValue = dep.extractAnswerValue;
    var checkGivenLineRearrange = dep.checkGivenLineRearrange;
    var currentPartSlopeTask = dep.currentPartSlopeTask;
    var laterLineEqForSlope = dep.laterLineEqForSlope;
    var typedLooksLikeLaterLineEq = dep.typedLooksLikeLaterLineEq;
    var typedLooksLikeFindMidpoint = dep.typedLooksLikeFindMidpoint;
    var markPriorSlopes = dep.markPriorSlopes;
    var storeFoundLineEq = dep.storeFoundLineEq;
    var axisLineDir = dep.axisLineDir;
    var axisLineEqText = dep.axisLineEqText;
    var axisLineComplete = dep.axisLineComplete;
    var checkAxisLineEq = dep.checkAxisLineEq;
    var parseConstAxisEq = dep.parseConstAxisEq;


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

  function checkLineEq(typed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var pendingEq = (pending || []).filter(function (t) {
      return t.kind === "lineEq";
    });
    var hits = preferPartTasks(pendingEq, pack, progress);
    var raw = String(typed || "").trim();
    if (typedLooksLikeFindMidpoint(typed, pack, progress) && !typedLooksLikeLaterLineEq(typed, pack, progress)) {
      return null;
    }
    var rearrHit = checkGivenLineRearrange(typed, pack, progress);
    if (rearrHit && rearrHit.ok) return null;
    if (
      typedLooksLikeCoordStep(typed, extractAnswerValue(typed)) &&
      !typedLooksLikeLaterLineEq(typed, pack, progress)
    ) {
      var axisFocus = hits[0] && axisLineDir(hits[0]);
      var coordIsLine =
        (hits[0] && lineEqComplete(raw, hits[0])) ||
        pendingEq.some(function (u) {
          return lineEqComplete(raw, u);
        });
      var siteForm = pendingEq.some(function (u) {
        return (lineEqSiteSteps(u) || []).some(function (s) {
          return normEqText(s) === normEqText(raw) || lineEqSysEquivalent(raw, s);
        });
      });
      if (!coordIsLine && !axisFocus && !siteForm) return null;
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

    function lineEqEmptyHint(task) {
      if (axisLineDir(task)) return "";
      var sp = lineEqSpec(task);
      return (
        "הציבו בנוסחה " +
        (sp ? lineEqPointSlope(sp) : "y − y₁ = m(x − x₁)") +
        " והביאו ל־y = mx + b. אפשר גם להציב ב־y = mx + b ולמצוא את b."
      );
    }

    function nextLineEqHint(pack, progress, t) {
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

    return {
      lineEqSpec: lineEqSpec,
      lineEqPointSlope: lineEqPointSlope,
      lineEqSysEquivalent: lineEqSysEquivalent,
      lineEqComplete: lineEqComplete,
      lineEqFinalText: lineEqFinalText,
      lineEqHasB: lineEqHasB,
      lineEqSuggestNext: lineEqSuggestNext,
      finishLineEq: finishLineEq,
      checkLineEq: checkLineEq,
      canonicalLineEqSteps: canonicalLineEqSteps,
      lineEqEmptyHint: lineEqEmptyHint,
      nextLineEqHint: nextLineEqHint
    };
  }

  global.DoctematicaGeoLineEq = { install: install };
})(window);
