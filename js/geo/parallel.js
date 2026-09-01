(function (global) {
  function install(dep) {
    var fmtNum = dep.fmtNum;
    var nearNum = dep.nearNum;
    var slopeWant = dep.slopeWant;
    var slopeLhs = dep.slopeLhs;
    var slopeTagNorm = dep.slopeTagNorm;
    var cloneMaps = dep.cloneMaps;
    var remainingRequired = dep.remainingRequired;
    var parseMChain = dep.parseMChain;
    var preferPartTasks = dep.preferPartTasks;
    var currentPartText = dep.currentPartText;
    var taskByIdMap = dep.taskByIdMap;
    var parseYesNo = dep.parseYesNo;
    var looksLikeLinearEq = dep.looksLikeLinearEq;
    var parallelLinesReady = dep.parallelLinesReady;
    var parallelRelatedSlopeTasks = dep.parallelRelatedSlopeTasks;
    var markRelatedSlopes = dep.markRelatedSlopes;
    var parseLineSpec = dep.parseLineSpec;
    var intersectLineRaw = dep.intersectLineRaw;
    var parseNumberToken = dep.parseNumberToken;
    var evalArithLoose = dep.evalArithLoose;
    var resolveSlopeByLetters = dep.resolveSlopeByLetters;
    var canonicalSlopeSteps = dep.canonicalSlopeSteps;
    var normEqText = dep.normEqText;
    var lineMbNeedsUnsorted = dep.lineMbNeedsUnsorted;
    var canonicalLineRearrangeSteps = dep.canonicalLineRearrangeSteps;
    var prettyLineEq = dep.prettyLineEq;
    var firstUnsortedLine = dep.firstUnsortedLine;
    var intersectStoredEq = dep.intersectStoredEq;
    var lineMbSuggestNextStep = dep.lineMbSuggestNextStep;
    var lineMbRearrangeHintMessage = dep.lineMbRearrangeHintMessage;
    var currentFocusTask = dep.currentFocusTask;

  function parallelGivenSlopeTag(task) {
    return slopeTagNorm(task && task.givenLabel);
  }

  function parallelNewSlopeTag(task) {
    var given = parallelGivenSlopeTag(task);
    var lab = slopeTagNorm(task && task.label) || "2";
    if (!lab || (given && lab === given)) return "2";
    if (/^(I|II|III)$/.test(lab) && given && !/^(I|II|III)$/.test(given)) return "2";
    return lab;
  }

  function parallelCopyShow(task, pack) {
    var want = slopeWant(pack, task);
    var lhs = "m" + parallelNewSlopeTag(task);
    var given = parallelGivenSlopeTag(task);
    if (want == null) return lhs;
    if (given) return lhs + " = m" + given + " = " + fmtNum(want);
    return lhs + " = " + fmtNum(want);
  }

  function parallelPendingTask(pack, progress) {
    var part = currentPartText(pack, progress);
    var ids = (part && part.taskIds) || [];
    return (pack.tasks || []).filter(function (t) {
      if (t.kind !== "parallel") return false;
      if (progress.done && progress.done[t.id]) return false;
      return !ids.length || ids.indexOf(t.id) >= 0;
    })[0];
  }

  function parallelSlopeReason() {
    return "ישרים מקבילים — שיפועים שווים.";
  }

  function checkCopiedSlope(typed, parsed, pack, progress, task, doneMap, partialMap, coordsMap) {
    var want = slopeWant(pack, task);
    if (want == null) return null;
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    var chain = parseMChain(typed);
    var lhs = slopeLhs(task);
    function finish(show) {
      maps.done[task.id] = true;
      delete maps.partial[task.id];
      delete maps.lastExpr[task.id];
      var left = remainingRequired(pack, maps.done);
      var siteShow = parallelCopyShow(task, pack);
      return {
        ok: true,
        solved: left.length === 0,
        done: maps.done,
        partial: maps.partial,
        coords: maps.coords,
        lastExpr: maps.lastExpr,
        task: task,
        show: show || siteShow,
        rawStep: true,
        siteNote: parallelSlopeReason(),
        message: "נכון. " + siteShow + ".",
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
        siteNote: parallelSlopeReason(),
        message: msg,
      };
    }
    var gotVal =
      parsed && parsed.value != null && isFinite(parsed.value) ? parsed.value : null;
    if (chain && chain.value != null) gotVal = chain.value;
    if (chain && chain.names.length >= 2 && chain.value == null) {
      var givenTag = parallelGivenSlopeTag(task) || chain.names[1] || "I";
      return partial(
        lhs + " = m" + givenTag,
        "נכון. לישרים מקבילים שיפועים שווים. עכשיו רשמו את ערך השיפוע."
      );
    }
    if (gotVal != null && nearNum(gotVal, want)) {
      return finish(parallelCopyShow(task, pack));
    }
    if (gotVal != null) {
      return { ok: false, message: "השיפוע עדיין לא מדויק. לישרים מקבילים אותו שיפוע." };
    }
    var rawS = String(typed || "").replace(/\s+/g, "");
    if (/^m/i.test(rawS) || chain) {
      return {
        ok: false,
        message:
          "לישרים מקבילים שיפועים שווים. רשמו למשל " +
          parallelCopyShow(task, pack) +
          ", או " +
          lhs +
          " = ….",
      };
    }
    return null;
  }

  function parallelGivenM(pack, task) {
    if (task && task.givenM != null && isFinite(task.givenM)) return Number(task.givenM);
    var lines = (pack && pack.lines) || [];
    if (task && task.lineKey) {
      var raw = intersectLineRaw(pack, task.lineKey);
      var L = parseLineSpec(raw);
      if (L && L.m != null) return L.m;
    }
    if (lines.length === 1) {
      var L1 = parseLineSpec(lines[0].line);
      if (L1 && L1.m != null) return L1.m;
    }
    return null;
  }

  function slopeLettersKey(task) {
    var a = String((task && task.from) || "").toUpperCase();
    var b = String((task && task.to) || "").toUpperCase();
    if (/^[A-Z]$/.test(a) && /^[A-Z]$/.test(b) && a !== b) {
      return a < b ? a + b : b + a;
    }
    return "";
  }

  function parseParallelCompareToken(tok, pack, task, related) {
    var s = String(tok || "")
      .replace(/[−–—]/g, "-")
      .replace(/[₁¹]/g, "1")
      .replace(/[₂²]/g, "2")
      .replace(/^m_?/, "m");
    if (!s) return null;
    var num = parseNumberToken(s) != null ? parseNumberToken(s) : evalArithLoose(s);
    if (num != null && isFinite(num) && !/^m/i.test(s)) return { kind: "num", value: num };
    var given = parallelGivenM(pack, task);
    if (/^m(I|II|III)$/i.test(s) || s === "m") {
      if (given != null) return { kind: "num", value: given, name: s };
    }
    var idx = s.match(/^m([12])$/i);
    if (idx) {
      var i = Number(idx[1]) - 1;
      if (related[i]) return { kind: "slope", task: related[i], value: slopeWant(pack, related[i]) };
      if (i >= 1 && given != null) return { kind: "num", value: given, name: s };
    }
    var letters = s.match(/^m([A-Za-z]{2})$/i);
    if (letters) {
      var pair = letters[1].toUpperCase();
      var key = pair.charAt(0) < pair.charAt(1) ? pair : pair.charAt(1) + pair.charAt(0);
      var j;
      for (j = 0; j < related.length; j++) {
        if (slopeLettersKey(related[j]) === key) {
          return { kind: "slope", task: related[j], value: slopeWant(pack, related[j]) };
        }
      }
      var allSlope = (pack.tasks || []).filter(function (t) {
        return t.kind === "slope";
      });
      var resolved = resolveSlopeByLetters(pack, allSlope, pair);
      if (resolved.kind === "task") {
        return { kind: "slope", task: resolved.task, value: slopeWant(pack, resolved.task) };
      }
    }
    return null;
  }

  function parseParallelCompare(typed, pack, task) {
    var raw = String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (!raw) return null;
    raw = raw.replace(/ולכן.*$/, "").replace(/לכן.*$/, "");
    var neq = /≠|!=|<>/.test(raw);
    if (!neq && raw.indexOf("=") < 0) return null;
    var parts = raw.split(/≠|!=|<>|=/).filter(Boolean);
    if (parts.length < 2) return null;
    var related = parallelRelatedSlopeTasks(pack, task);
    var toks = [];
    var i;
    for (i = 0; i < parts.length; i++) {
      var tok = parseParallelCompareToken(parts[i], pack, task, related);
      if (!tok || tok.value == null || !isFinite(tok.value)) return null;
      toks.push(tok);
    }
    return { neq: neq, toks: toks };
  }

  function parallelProofEqLine(task, pack) {
    var rel = parallelRelatedSlopeTasks(pack, task);
    if (rel.length >= 2) {
      return task && task.answer
        ? slopeLhs(rel[0]) + " = " + slopeLhs(rel[1])
        : slopeLhs(rel[0]) + " ≠ " + slopeLhs(rel[1]);
    }
    if (rel.length === 1 && parallelGivenM(pack, task) != null) {
      return slopeLhs(rel[0]) + " = " + fmtNum(parallelGivenM(pack, task));
    }
    return "";
  }

  function parallelProofConclusion(task) {
    return task && task.answer ? "ולכן הישרים מקבילים" : "ולכן הישרים לא מקבילים";
  }

  function parallelProofNote(task) {
    if (task && task.reason) return task.reason;
    return task && task.answer
      ? "ישרים בעלי אותו שיפוע מקבילים."
      : "שיפועים שונים — הישרים לא מקבילים.";
  }

  function parallelCompareSlopeTasks(cmp) {
    var ids = [];
    var tasks = [];
    ((cmp && cmp.toks) || []).forEach(function (tok) {
      if (!tok || tok.kind !== "slope" || !tok.task) return;
      if (ids.indexOf(tok.task.id) >= 0) return;
      ids.push(tok.task.id);
      tasks.push(tok.task);
    });
    return tasks;
  }

  function parallelCompareIsProof(cmp, pack, task, progress) {
    if (!cmp || !cmp.toks || cmp.toks.length < 2) return false;
    var named = parallelCompareSlopeTasks(cmp);
    if (named.length >= 2) return true;
    var given = parallelGivenM(pack, task);
    if (named.length === 1 && given != null) {
      var st = named[0];
      var hasNum = cmp.toks.some(function (tok) {
        return tok.kind === "num";
      });
      if (hasNum && !(progress && progress.done && progress.done[st.id])) return false;
      return cmp.toks.some(function (tok) {
        return tok.kind === "num" && nearNum(tok.value, given);
      });
    }
    return false;
  }

  function parallelFillSlopeShows(pack, progress, maps, parTask) {
    var rel = parallelRelatedSlopeTasks(pack, parTask);
    var lines = [];
    var i;
    var j;
    for (i = 0; i < rel.length; i++) {
      var st = rel[i];
      if (!st) continue;
      var already = (progress && progress.lastExpr && progress.lastExpr[st.id]) || "";
      var steps = canonicalSlopeSteps(st, pack);
      var start = 0;
      if (already && maps.done[st.id]) continue;
      if (already) {
        for (j = 0; j < steps.length; j++) {
          if (normEqText(steps[j]) === normEqText(already) || steps[j] === already) {
            start = j + 1;
            break;
          }
        }
      }
      if (!maps.done[st.id]) {
        for (j = start; j < steps.length; j++) lines.push(steps[j]);
        maps.done[st.id] = true;
        delete maps.partial[st.id];
        delete maps.lastExpr[st.id];
      }
    }
    return lines;
  }

  function finishParallelProof(task, pack, progress, doneMap, partialMap, coordsMap, eqLine) {
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.done[task.id] = true;
    delete maps.partial[task.id];
    var prefixShow = parallelFillSlopeShows(pack, progress, maps, task);
    markRelatedSlopes(pack, progress, task, maps);
    var show = eqLine || parallelProofEqLine(task, pack);
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
      prefixShow: prefixShow,
      extraShow: show ? [parallelProofConclusion(task)] : [],
      siteNote: parallelProofNote(task),
      message: left.length ? "נכון. המשיכו." : "נכון.",
    };
  }

  function checkParallelSlopeProof(typed, pack, progress, task, doneMap, partialMap, coordsMap) {
    var cmp = parseParallelCompare(typed, pack, task);
    if (!cmp) return null;
    if (!parallelCompareIsProof(cmp, pack, task, progress)) return null;
    var want = !!task.answer;
    var vals = cmp.toks.map(function (t) {
      return t.value;
    });
    var allSame = vals.every(function (v) {
      return nearNum(v, vals[0]);
    });
    if (want) {
      if (cmp.neq || !allSame) {
        return {
          ok: false,
          message:
            "השיפועים שווים — הישרים מקבילים. רשמו " +
            (parallelProofEqLine(task, pack) || "m₁ = m₂") +
            ".",
        };
      }
    } else if (!cmp.neq || allSame) {
      return {
        ok: false,
        message:
          "השיפועים שונים — הישרים לא מקבילים. רשמו " +
          (parallelProofEqLine(task, pack) || "m₁ ≠ m₂") +
          ".",
      };
    }
    return finishParallelProof(
      task,
      pack,
      progress,
      doneMap,
      partialMap,
      coordsMap,
      parallelProofEqLine(task, pack)
    );
  }

  function checkParallel(typed, pack, progress, pending, doneMap, partialMap, coordsMap) {
    var hits = preferPartTasks(
      (pending || []).filter(function (t) {
        return t.kind === "parallel";
      }),
      pack,
      progress
    );
    if (!hits.length) {
      var partParSkip = currentPartText(pack, progress);
      var mapParSkip = taskByIdMap(pack);
      var parSkip = ((partParSkip && partParSkip.taskIds) || [])
        .map(function (id) {
          return mapParSkip[id];
        })
        .filter(function (u) {
          return u && u.kind === "parallel" && !(progress.done && progress.done[u.id]);
        })[0];
      if (parSkip && parseParallelCompare(typed, pack, parSkip)) {
        hits = [parSkip];
      }
    }
    if (!hits.length) return null;
    var task = hits[0];
    var proof = checkParallelSlopeProof(typed, pack, progress, task, doneMap, partialMap, coordsMap);
    if (proof) return proof;
    var yn = parseYesNo(typed);
    if (yn == null) {
      if (looksLikeLinearEq(typed) || /^y/i.test(String(typed || "").replace(/\s+/g, ""))) return null;
      return null;
    }
    if (!parallelLinesReady(pack, progress)) {
      return {
        ok: false,
        message: "קודם סדרו את המשוואות לצורה y = mx + b, ואז ענו כן או לא לפי השיפועים.",
      };
    }
    var want = !!task.answer;
    if (yn !== want) {
      return {
        ok: false,
        message: want
          ? "השיפועים שווים — הישרים מקבילים. רשמו " +
            (parallelProofEqLine(task, pack) || "כן") +
            "."
          : "השיפועים שונים — הישרים לא מקבילים. רשמו " +
            (parallelProofEqLine(task, pack) || "לא") +
            ".",
      };
    }
    var proofLine = parallelProofEqLine(task, pack);
    if (proofLine) {
      return finishParallelProof(task, pack, progress, doneMap, partialMap, coordsMap, proofLine);
    }
    var maps = cloneMaps(doneMap, partialMap, coordsMap, progress);
    maps.done[task.id] = true;
    delete maps.partial[task.id];
    markRelatedSlopes(pack, progress, task, maps);
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
      siteNote: task.reason || (want ? parallelSlopeReason() : "שיפועים שונים — הישרים לא מקבילים."),
      message: left.length ? "נכון. המשיכו." : "נכון.",
    };
  }

  function canonicalParallelSteps(task, pack) {
    var lines = [];
    ((pack && pack.lines) || []).forEach(function (item) {
      if (!lineMbNeedsUnsorted(item.line)) return;
      canonicalLineRearrangeSteps(item.line).forEach(function (s) {
        lines.push(s);
      });
    });
    var eqLine = parallelProofEqLine(task, pack);
    if (eqLine) {
      lines.push(eqLine);
      lines.push(parallelProofConclusion(task));
      return lines;
    }
    lines.push(task && task.answer ? "כן" : "לא");
    return lines;
  }

    function parallelKindHint(pack, progress) {
      return parallelLinesReady(pack, progress)
        ? "ענו כן או לא לפי השיפועים: שווים — כן; שונים — לא."
        : "קודם סדרו את המשוואות לצורה y = mx + b.";
    }

    function parallelCopiedSlopeEmptyHint(task, pack) {
      return (
        "לישרים מקבילים שיפועים שווים. רשמו " +
        parallelCopyShow(task, pack) +
        " או m = …."
      );
    }

    function parallelYesNoPrompt(pack, progress) {
      var par = parallelPendingTask(pack, progress);
      if (par && parallelLinesReady(pack, progress)) {
        var focPar = currentFocusTask(pack, progress);
        if (!focPar || focPar.kind === "parallel" || focPar.id === par.id) {
          var partPar = currentPartText(pack, progress);
          var mapPar = taskByIdMap(pack);
          var slopeInPart = ((partPar && partPar.taskIds) || []).some(function (id) {
            var u = mapPar[id];
            return u && u.kind === "slope";
          });
          if (!(slopeInPart && parallelProofEqLine(par, pack))) {
            return {
              stage: "yesno",
              task: par,
              question: "האם שני הישרים מקבילים?",
            };
          }
        }
      }
      return null;
    }

    function nextParallelHint(pack, progress, t) {
      var unsortedP = firstUnsortedLine(pack, progress);
      if (unsortedP) {
        var fromP =
          intersectStoredEq(progress, unsortedP.key) ||
          (unsortedP.line.eqText || prettyLineEq(unsortedP.line));
        var stepP = lineMbSuggestNextStep(fromP, unsortedP.line);
        return {
          task: t,
          message: lineMbRearrangeHintMessage(fromP, unsortedP.line),
          step: stepP,
          answer: t.answer ? "כן" : "לא",
          rawStep: true,
        };
      }
      var relH = parallelRelatedSlopeTasks(pack, t);
      var undoneH = relH.filter(function (st) {
        return !(progress.done && progress.done[st.id]);
      });
      if (undoneH.length) {
        return {
          task: undoneH[0],
          message: "כדי להוכיח מקבילות, מצאו קודם את " + slopeLhs(undoneH[0]) + ".",
          step: canonicalSlopeSteps(undoneH[0], pack)[0] || slopeLhs(undoneH[0]),
          answer: fmtNum(slopeWant(pack, undoneH[0])),
          rawStep: true,
        };
      }
      var eqH = parallelProofEqLine(t, pack);
      if (eqH) {
        return {
          task: t,
          message: t.answer
            ? "רשמו " + eqH + ". אחרי זה תופיע המסקנה: הישרים מקבילים."
            : "רשמו " + eqH + ". אחרי זה תופיע המסקנה: הישרים לא מקבילים.",
          step: eqH,
          answer: parallelProofConclusion(t),
          rawStep: true,
        };
      }
      return {
        task: t,
        message: "השוו בין השיפועים. אם הם שווים — הישרים מקבילים. ענו כן או לא.",
        step: t.answer ? "כן" : "לא",
        answer: t.answer ? "כן" : "לא",
      };
    }

    function parallelCopiedSlopeNextHint(pack, progress, t) {
      var wantShow = fmtNum(slopeWant(pack, t));
      var show = parallelCopyShow(t, pack);
      return {
        task: t,
        message:
          "לישרים מקבילים שיפועים שווים. רשמו " +
          show +
          " (אפשר גם m = … או רק את המספר).",
        step: show,
        answer: wantShow,
        rawStep: true,
      };
    }

    return {
      parallelGivenSlopeTag: parallelGivenSlopeTag,
      parallelNewSlopeTag: parallelNewSlopeTag,
      parallelCopyShow: parallelCopyShow,
      parallelPendingTask: parallelPendingTask,
      parallelSlopeReason: parallelSlopeReason,
      checkCopiedSlope: checkCopiedSlope,
      parallelGivenM: parallelGivenM,
      parallelProofEqLine: parallelProofEqLine,
      parallelProofConclusion: parallelProofConclusion,
      checkParallel: checkParallel,
      canonicalParallelSteps: canonicalParallelSteps,
      parallelKindHint: parallelKindHint,
      parallelCopiedSlopeEmptyHint: parallelCopiedSlopeEmptyHint,
      parallelYesNoPrompt: parallelYesNoPrompt,
      nextParallelHint: nextParallelHint,
      parallelCopiedSlopeNextHint: parallelCopiedSlopeNextHint,
    };
  }

  global.DoctematicaGeoParallel = { install: install };
})(window);
