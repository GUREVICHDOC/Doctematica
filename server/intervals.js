"use strict";

function createIntervalsHandler(engine) {
  var M = engine.DoctematicaFnModel;

  function prettyMinus(s) {
    return String(s || "").replace(/-/g, "−").replace(/<=/g, "≤").replace(/>=/g, "≥");
  }

  function normKey(text) {
    return String(text || "")
      .trim()
      .replace(/[−–—]/g, "-")
      .replace(/≤/g, "<=")
      .replace(/≥/g, ">=")
      .replace(/[×·]/g, "*")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  function systemOf(body) {
    var raw = ((body && body.conds) || []).map(function (c) { return String(c || "").trim(); }).filter(Boolean);
    if (raw.length === 1 && M.splitCompound) {
      var pieces = M.splitCompound(raw[0]);
      if (pieces && pieces.length === 2) return { compound: raw[0], originals: pieces };
    }
    return { compound: null, originals: raw };
  }

  function intervalTextOf(orig) {
    var iv = M.parseInterval(orig);
    if (iv) return M.formatInterval(iv);
    var path = engine.DoctematicaTeach.fullPath(orig);
    return path && path.answer ? String(path.answer).trim() : "";
  }

  function targets(body) {
    return systemOf(body).originals.map(function (orig) {
      var text = intervalTextOf(orig);
      return { raw: orig, text: text, iv: M.parseInterval(text) };
    });
  }

  function wantOf(body) {
    var ivs = targets(body).map(function (t) { return t.iv; });
    if (!M.intersectAll) {
      var hit = M.intersectRegions([ivs[0]], [ivs[1]]);
      if (!hit || !hit.length) return { empty: true };
      return hit[0];
    }
    return M.intersectAll(ivs);
  }

  function opOf(body) {
    var op = String((body && (body.op || body.operation)) || "").toLowerCase();
    return op === "union" ? "union" : "intersection";
  }

  function solutionSet(body) {
    var ivs = targets(body).map(function (t) { return t.iv; });
    return M.combineIntervals(ivs, opOf(body));
  }

  function answerText(body) {
    if (opOf(body) !== "union") return M.formatInterval(wantOf(body));
    var set = solutionSet(body);
    var packed = targets(body);
    if (!set.length) return "אין פתרון";
    if (set.length === 1 && (set[0].all || (set[0].from === "-inf" && set[0].to === "inf"))) return "כל x";
    return set.map(function (iv) {
      var i;
      for (i = 0; i < packed.length; i++) {
        if (packed[i].iv && M.sameInterval(packed[i].iv, iv)) return prettyMinus(packed[i].text);
      }
      return M.formatInterval(iv);
    }).join(" או ");
  }

  function sameEnd(a, b) {
    if (a === b) return true;
    if (a === "-inf" || a === "inf" || b === "-inf" || b === "inf") return false;
    return Math.abs(Number(a) - Number(b)) < 1e-8;
  }

  function covers(outer, inner) {
    if (!outer || !inner || outer.empty || inner.empty) return false;
    if (outer.all || (outer.from === "-inf" && outer.to === "inf")) return true;
    if (inner.all) return false;
    if (endNum(outer.from) > endNum(inner.from) + 1e-9) return false;
    if (endNum(outer.to) < endNum(inner.to) - 1e-9) return false;
    if (sameEnd(outer.from, inner.from) && endIncluded(inner, "from") && !endIncluded(outer, "from")) return false;
    if (sameEnd(outer.to, inner.to) && endIncluded(inner, "to") && !endIncluded(outer, "to")) return false;
    return true;
  }

  function endIncluded(interval, which) {
    if (!interval) return false;
    if (interval[which + "Included"] != null) return !!interval[which + "Included"];
    return false;
  }

  function holePoint(set) {
    if (!set || set.length !== 2) return null;
    if (sameEnd(set[0].to, set[1].from) && !endIncluded(set[0], "to") && !endIncluded(set[1], "from")) return set[0].to;
    return null;
  }

  function replay(body) {
    var sys = systemOf(body);
    var conds = sys.originals.map(function (orig) {
      var iv = M.parseInterval(orig);
      return {
        original: orig,
        current: orig,
        solved: !!iv,
        interval: iv ? M.formatInterval(iv) : "",
      };
    });
    var st = { compound: sys.compound, conds: conds, splitDone: !sys.compound, active: -1 };
    var history = (body && body.history) || [];
    history.forEach(function (line) {
      var text = String(line || "").trim();
      if (!text || /^משימה:/.test(text)) return;
      if (st.compound && splitLineMatches(text, st.conds)) {
        st.splitDone = true;
        return;
      }
      var started = startIndex(st, text);
      if (started >= 0) {
        st.conds[started].started = true;
        st.active = started;
        if (st.compound) st.splitDone = true;
        return;
      }
      var hit = matchStep(st, text);
      if (!hit || !hit.chk.ok) return;
      var cond = st.conds[hit.i];
      cond.started = true;
      if (st.compound) st.splitDone = true;
      cond.current = text;
      st.active = hit.i;
      if (hit.chk.solved) {
        cond.solved = true;
        var parsed = M.parseInterval(text);
        cond.interval = parsed ? M.formatInterval(parsed) : prettyMinus(text);
      }
    });
    return st;
  }

  function splitLineMatches(text, conds) {
    if (!/וגם/.test(text)) {
      var again = M.splitCompound(text);
      if (!again) return false;
      text = again.join(" וגם ");
    }
    var parts = text.split(/\s*וגם\s*/).map(function (p) { return p.trim(); }).filter(Boolean);
    if (parts.length !== conds.length) return false;
    return conds.every(function (cond) {
      return parts.some(function (part) { return normKey(part) === normKey(cond.original); });
    });
  }

  function startIndex(st, text) {
    var key = normKey(text);
    var i;
    for (i = 0; i < st.conds.length; i++) {
      var c = st.conds[i];
      if (c.solved || c.started) continue;
      if (normKey(c.current) !== normKey(c.original)) continue;
      if (normKey(c.original) === key) return i;
    }
    return -1;
  }

  function matchStep(st, typed) {
    var A = engine.DoctematicaAlgebra;
    var good = [];
    var named = [];
    var sameHits = [];
    st.conds.forEach(function (c, i) {
      if (c.solved) return;
      var chk = A.checkIneqStep(c.current, typed);
      if (!chk) return;
      if (chk.ok) good.push({ i: i, chk: chk });
      else if (chk.same) sameHits.push({ i: i, chk: chk });
      else if (chk.errorId && String(chk.errorId).indexOf("inequality") === 0) named.push({ i: i, chk: chk });
    });
    if (good.length > 1 && st.active >= 0) {
      var pref = good.filter(function (g) { return g.i === st.active; });
      if (pref.length) return pref[0];
    }
    if (good.length) return good[0];
    if (named.length) return named[0];
    if (sameHits.length) return sameHits[0];
    return null;
  }

  function allGiven(st) {
    return !st.compound && st.conds.every(function (c) { return !!M.parseInterval(c.original); });
  }

  function bothWord(n) {
    if (n === 2) return "שני התנאים";
    if (n === 3) return "שלושת התנאים";
    return "כל התנאים";
  }

  function showNum(n) {
    return M.fmtBound(n);
  }

  function fractionOf(value, texts) {
    var found = null;
    var list = texts || [];
    var k;
    for (k = 0; k < list.length; k++) {
      var src = String(list[k] || "");
      var re = /[−–—-]?\d+\s*\/\s*\d+/g;
      var m;
      while ((m = re.exec(src))) {
        var token = m[0].replace(/[−–—]/g, "-").replace(/\s+/g, "");
        var parts = token.match(/^(-?)(\d+)\/(\d+)$/);
        if (!parts || !Number(parts[3])) continue;
        var sign = parts[1] ? -1 : 1;
        var num = Number(parts[2]);
        var den = Number(parts[3]);
        if (Math.abs((sign * num) / den - Number(value)) >= 1e-8) continue;
        found = { num: num, den: den, sign: sign };
      }
    }
    return found;
  }

  function labelNum(n, texts) {
    var frac = fractionOf(n, texts);
    if (frac) {
      var preferred = String(M.fmt(n) || "");
      if (preferred.indexOf("/") >= 0) return (frac.sign < 0 ? "−" : "") + frac.num + "/" + frac.den;
    }
    return showNum(n);
  }

  function rayWords(iv, raw) {
    var text = String(raw || "").replace(/-/g, "−");
    if (!iv || iv.empty) return text;
    if (iv.point) return text + " מתאר רק את הנקודה " + showNum(iv.from) + ".";
    if (iv.from !== "-inf" && iv.to === "inf") {
      return (
        text +
        " מתאר את כל המספרים שמימין ל־" +
        showNum(iv.from) +
        (iv.fromIncluded ? ", כולל " : ", ו־") +
        showNum(iv.from) +
        (iv.fromIncluded ? "." : " עצמו אינו כלול.")
      );
    }
    if (iv.to !== "inf" && iv.from === "-inf") {
      return (
        text +
        " מתאר את כל המספרים שמשמאל ל־" +
        showNum(iv.to) +
        (iv.toIncluded ? ", כולל " : ", ו־") +
        showNum(iv.to) +
        (iv.toIncluded ? "." : " עצמו אינו כלול.")
      );
    }
    return text;
  }

  function intersectWhy(want, n) {
    if (n === 2) {
      if (want.empty) return "אין מספר שמקיים את שני התנאים בו־זמנית, ולכן אין פתרון.";
      if (want.point) return "נקודת הגבול כלולה בשני התנאים, ולכן החיתוך הוא נקודה אחת.";
      return "במערכת «וגם» לוקחים את החלק המשותף לשני התחומים.";
    }
    var both = bothWord(n);
    if (want.empty) return "אין מספר שמקיים את " + both + " בו־זמנית, ולכן אין פתרון.";
    if (want.point) return "נקודת הגבול כלולה ב" + both + ", ולכן החיתוך הוא נקודה אחת.";
    return "במערכת «וגם» לוקחים את החלק המשותף ל" + both + ".";
  }

  function solutionSteps(body) {
    var sys = systemOf(body);
    var steps = [];
    var n = sys.originals.length;
    var needsSolve = !!sys.compound || sys.originals.some(function (c) { return !M.parseInterval(c); });
    var columns = sys.originals.map(function (orig, i) {
      var col = [];
      var iv = M.parseInterval(orig);
      if (iv) col.push({ eq: prettyMinus(orig), explain: rayWords(iv, orig) });
      else {
        col.push({ eq: prettyMinus(orig), explain: "רושמים את האי־שוויון, ואחר כך מעבירים אגפים." });
        var path = engine.DoctematicaTeach.fullPath(orig);
        (path.steps || []).forEach(function (s) {
          col.push({ eq: prettyMinus(s.eq), explain: s.explain || "" });
        });
      }
      return { label: n > 1 ? "תנאי " + (i + 1) : "", steps: col };
    });
    if (n >= 2) {
      steps.push({
        parallel: columns,
        explain: sys.compound
          ? "אי־שוויון כפול מתאר שני תנאים שצריכים להתקיים בו־זמנית. כל תנאי נפתר בנפרד."
          : opOf(body) === "union"
            ? "כל תנאי נפתר בנפרד, ואחר כך מאחדים."
            : "כל תנאי נפתר בנפרד, ואחר כך לוקחים את החלק המשותף.",
      });
    } else if (columns[0]) {
      columns[0].steps.forEach(function (step) { steps.push(step); });
    }
    if (needsSolve || n > 2) steps.push({ eq: opOf(body) === "union" ? "משימה: איחוד" : "משימה: חיתוך", explain: "" });
    if (opOf(body) === "union") {
      steps.push({ eq: answerText(body), explain: unionWhy(body) });
      return steps;
    }
    var want = wantOf(body);
    steps.push({ eq: M.formatInterval(want), explain: intersectWhy(want, n) });
    return steps;
  }

  function unionWhy(body) {
    var set = solutionSet(body);
    var ivs = targets(body).map(function (t) { return t.iv; });
    if (!set.length) return "אין מספר שמקיים לפחות אחד מהתנאים.";
    if (set.length === 1 && set[0].all) return "כל מספר ממשי מקיים לפחות אחד מהתנאים, ולכן הפתרון הוא כל x.";
    if (holePoint(set) != null) return "נקודת הגבול אינה שייכת לאף אחד מהתנאים, ולכן נשאר חור. הפתרון הוא שני תחומים נפרדים.";
    if (set.length > 1) return "התחומים אינם מתחברים. במערכת «או» לוקחים את כל החלקים, גם כשהם נפרדים.";
    var wider = null;
    var i;
    for (i = 0; i < ivs.length; i++) {
      var j;
      for (j = 0; j < ivs.length; j++) {
        if (i !== j && covers(ivs[i], ivs[j]) && !M.sameInterval(ivs[i], ivs[j])) wider = ivs[i];
      }
    }
    if (wider) return "אחד התחומים כבר מכיל את השני. במערכת «או» האיחוד הוא התחום הרחב.";
    var pointJoined = ivs.some(function (iv) { return iv && iv.point; });
    if (pointJoined) return "נקודת הגבול סוגרת את הקצה הפתוח, ולכן היא כלולה בתחום.";
    return "במערכת «או» לוקחים כל ערך שנמצא לפחות באחד משני התחומים.";
  }

  function endNum(v) {
    if (v === "-inf") return -Infinity;
    if (v === "inf") return Infinity;
    return Number(v);
  }

  function endAtMost(a, b) {
    return endNum(a) <= endNum(b) + 1e-8;
  }

  function endAtLeast(a, b) {
    return endNum(a) >= endNum(b) - 1e-8;
  }

  function contains(outer, inner) {
    if (!outer || !inner || outer.empty || inner.empty || inner.all) return !!outer && !!outer.all && inner && inner.all;
    if (outer.all) return true;
    return endAtMost(outer.from, inner.from) && endAtLeast(outer.to, inner.to);
  }

  function isUnion(got, a, b) {
    if (!got || got.empty || got.point || !a || !b || a.empty || b.empty) return false;
    var from = endNum(a.from) < endNum(b.from) ? a.from : b.from;
    var to = endNum(a.to) > endNum(b.to) ? a.to : b.to;
    if (endNum(from) >= endNum(to)) return false;
    return (got.from === from || (typeof got.from === "number" && typeof from === "number" && Math.abs(got.from - from) < 1e-8))
      && (got.to === to || (typeof got.to === "number" && typeof to === "number" && Math.abs(got.to - to) < 1e-8))
      && endNum(to) - endNum(from) > endNum(a.to) - endNum(a.from) + 1e-8
      && endNum(to) - endNum(from) > endNum(b.to) - endNum(b.from) + 1e-8;
  }

  function inclusionMessage(got, want) {
    if (want.from !== "-inf" && got.fromIncluded !== want.fromIncluded) {
      return want.fromIncluded
        ? "התחום כולל את " + showNum(want.from) + ". נקודת הקצה צריכה להיות סגורה."
        : "התחום אינו כולל את " + showNum(want.from) + ". השתמש בנקודת קצה פתוחה.";
    }
    if (want.to !== "inf" && got.toIncluded !== want.toIncluded) {
      return want.toIncluded
        ? "התחום כולל את " + showNum(want.to) + ". נקודת הקצה צריכה להיות סגורה."
        : "התחום אינו כולל את " + showNum(want.to) + ". השתמש בנקודת קצה פתוחה.";
    }
    return "הגבולות נכונים, אבל פתוח וסגור לא מתאימים.";
  }

  function unionMessage(n) {
    if (n === 2) return "במערכת 'וגם' מחפשים את הערכים שמקיימים את שני התנאים יחד, כלומר את החלק המשותף.";
    return "במערכת 'וגם' מחפשים את החלק המשותף, לא את האיחוד.";
  }

  function pieceVerdict(expected, typed) {
    if (normKey(expected) === normKey(typed)) return { ok: true };
    var chk = engine.DoctematicaAlgebra.checkIneqStep(expected, typed);
    if (chk.ok || chk.same) return { ok: true };
    if (chk.errorId === "inequalityStrictness") {
      var lost = /כולל שוויון/.test(chk.message || "");
      return {
        ok: false,
        errorId: "compoundStrictness",
        message: lost
          ? "בפירוק צריך לשמור על שוויון. הגבול אמור להיות כלול."
          : "בפירוק אין להוסיף שוויון. הגבול אינו כלול.",
      };
    }
    if (
      chk.errorId === "inequalitySwapDirection" ||
      chk.errorId === "inequalityDirectionFlipped" ||
      chk.errorId === "inequalityDirectionNotFlipped"
    ) {
      return {
        ok: false,
        errorId: "compoundDirection",
        message: "כיוון אי־השוויון בפירוק לא נשמר. צריך לשמור את אותו יחס שמופיע באי־השוויון הכפול.",
      };
    }
    return { ok: false, errorId: chk.errorId || "compoundSplit", message: chk.message || "הפירוק אינו מתאים לאי־השוויון הכפול." };
  }

  function splitFeedback(typed, st) {
    var parts = [];
    if (/וגם/.test(typed)) {
      parts = typed.split(/\s*וגם\s*/).map(function (p) { return p.trim(); }).filter(Boolean);
    } else if (M.splitCompound(typed)) {
      parts = M.splitCompound(typed);
    } else return null;
    var originals = st.conds.map(function (c) { return c.original; });
    if (parts.length < originals.length) {
      return {
        ok: false,
        errorId: "compoundMissing",
        message: "אי־השוויון הכפול מתאר שני תנאים שצריכים להתקיים יחד. חסר אחד משני התנאים.",
      };
    }
    if (parts.length !== originals.length) {
      return { ok: false, errorId: "compoundSplit", message: "הפירוק צריך להיות שני אי־שוויונים המחוברים ב'וגם'." };
    }
    var orders = [[0, 1], [1, 0]];
    var best = null;
    orders.forEach(function (order) {
      var verdicts = order.map(function (pi, i) { return pieceVerdict(originals[i], parts[pi]); });
      var okCount = verdicts.filter(function (v) { return v.ok; }).length;
      var bad = null;
      verdicts.forEach(function (v) { if (!v.ok && !bad) bad = v; });
      var score = okCount * 10 + (bad && bad.errorId === "compoundStrictness" ? 3 : bad && bad.errorId === "compoundDirection" ? 2 : 0);
      if (!best || score > best.score) best = { score: score, ok: okCount === originals.length, bad: bad };
    });
    if (best && best.ok) {
      return {
        ok: true,
        solved: false,
        reason: "הפירוק נכון. עכשיו פתרו כל אחד משני האי־שוויונים.",
        message: "הפירוק נכון. עכשיו פתרו כל אחד משני האי־שוויונים.",
      };
    }
    return { ok: false, errorId: best.bad.errorId, message: best.bad.message };
  }

  function subsetSize(got, ivs) {
    var n = ivs.length;
    var best = 0;
    var mask;
    var limit = 1 << n;
    if (n > 8) return 0;
    for (mask = 1; mask < limit; mask++) {
      var sub = [];
      var bits = 0;
      var i;
      for (i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          sub.push(ivs[i]);
          bits++;
        }
      }
      if (bits === n) continue;
      var hit = M.intersectAll(sub);
      if (hit && M.sameInterval(got, hit)) best = Math.max(best, bits);
    }
    return best;
  }

  function isUnionN(got, ivs) {
    var live = (ivs || []).filter(function (iv) { return iv && !iv.empty && !iv.all; });
    if (!got || got.empty || got.point || live.length < 2) return false;
    var from = live[0].from;
    var to = live[0].to;
    live.forEach(function (iv) {
      if (endNum(iv.from) < endNum(from)) from = iv.from;
      if (endNum(iv.to) > endNum(to)) to = iv.to;
    });
    var span = endNum(to) - endNum(from);
    var wider = live.every(function (iv) { return span > endNum(iv.to) - endNum(iv.from) + 1e-8; });
    if (!wider) return false;
    var fromOk = got.from === from || (typeof got.from === "number" && typeof from === "number" && Math.abs(got.from - from) < 1e-8);
    var toOk = got.to === to || (typeof got.to === "number" && typeof to === "number" && Math.abs(got.to - to) < 1e-8);
    return fromOk && toOk;
  }

  function progress(message) {
    return { ok: true, solved: false, message: message, reason: message };
  }

  function setEquals(text, set) {
    var parsed = M.parseRegionList(text);
    if (!parsed) return false;
    return M.sameIntervalSet(M.unionAll(parsed), set);
  }

  function earlierUnionRegions(body, want) {
    var acc = [];
    ((body && body.history) || []).forEach(function (line) {
      var list = M.parseRegionList(line);
      if (!list || !list.length) return;
      list.forEach(function (iv) {
        if ((want || []).some(function (piece) { return M.sameInterval(iv, piece); })) acc.push(iv);
      });
    });
    return acc;
  }

  function checkUnion(body) {
    var typed = String((body && body.typed) || "").trim();
    if (!typed) return { ok: false, message: "כתבו את פתרון המערכת." };
    var st = replay(body);
    var want = solutionSet(body);
    if (setEquals(typed, want)) {
      var shown = answerText(body);
      return { ok: true, solved: true, message: "זהו הפתרון: " + shown + ".", reason: "זהו הפתרון: " + shown + "." };
    }
    var begun = startIndex(st, typed);
    if (begun >= 0) return progress("רושמים את האי־שוויון. עכשיו אפשר להעביר אגפים ולפתור אותו.");
    var hit = matchStep(st, typed);
    if (hit && hit.chk && !hit.chk.ok && hit.chk.errorId) {
      return { ok: false, errorId: hit.chk.errorId, message: hit.chk.message };
    }
    if (hit && hit.chk && hit.chk.same) return { ok: false, message: hit.chk.message };
    if (hit && hit.chk && hit.chk.ok && !hit.chk.solved) return progress(hit.chk.message || "צעד חוקי. המשיכו לבודד את x.");
    if (hit && hit.chk && hit.chk.ok && hit.chk.solved) {
      var others = st.conds.some(function (c, i) { return i !== hit.i && !c.solved; });
      if (others) return progress("אי־שוויון אחד כבר פתור. יש עוד תנאי שצריך לפתור לפני האיחוד.");
    }
    var parsed = M.parseRegionList(typed);
    if (!parsed) return { ok: false, message: "רשמו תחום, למשל x > 3, או x < 1 או x > 6, או כל x." };
    var got = M.unionAll(parsed);
    var ivs = targets(body).map(function (t) { return t.iv; });
    var inter = M.combineIntervals(ivs, "intersection");
    if (M.sameIntervalSet(got, inter) && !M.sameIntervalSet(inter, want)) {
      var contained = ivs.length === 2 && ((covers(ivs[0], ivs[1]) && !M.sameInterval(ivs[0], ivs[1])) || (covers(ivs[1], ivs[0]) && !M.sameInterval(ivs[1], ivs[0])));
      return {
        ok: false,
        errorId: "usedIntersectionInsteadOfUnion",
        message: contained
          ? "אחד התחומים כבר מכיל את השני. באיחוד לוקחים את התחום הרחב, לא רק את המצומצם."
          : "במערכת 'או' לא מחפשים רק את החלק המשותף. מספיק שערך x יקיים לפחות אחד משני התנאים.",
      };
    }
    var hole = holePoint(want);
    var gotAll = got.length === 1 && (got[0].all || (got[0].from === "-inf" && got[0].to === "inf"));
    if (hole != null && gotAll) {
      return { ok: false, errorId: "missingPoint", message: "לא כל המספרים מתאימים. הנקודה " + showNum(hole) + " אינה מקיימת אף אחד מהתנאים." };
    }
    if (want.length === 1 && got.length === 1 && sameEnds(got[0], want[0])) {
      return { ok: false, errorId: "wrongOpenClosed", message: inclusionMessage(got[0], want[0]) };
    }
    if (want.length === got.length && want.length > 1) {
      var used = [];
      var badInc = null;
      var gi;
      for (gi = 0; gi < got.length; gi++) {
        var gj;
        for (gj = 0; gj < want.length; gj++) {
          if (used[gj] || !sameEnds(got[gi], want[gj])) continue;
          used[gj] = true;
          if (!M.sameInterval(got[gi], want[gj])) badInc = inclusionMessage(got[gi], want[gj]);
          break;
        }
      }
      if (badInc && used.filter(Boolean).length === want.length) {
        return { ok: false, errorId: "wrongOpenClosed", message: badInc };
      }
    }
    var earlier = earlierUnionRegions(body, want);
    var merged = M.unionAll(earlier.concat(parsed));
    if (earlier.length && M.sameIntervalSet(merged, want)) {
      var shownUnion = answerText(body);
      return { ok: true, solved: true, message: "זהו הפתרון: " + shownUnion + ".", reason: "זהו הפתרון: " + shownUnion + "." };
    }
    if (want.length > 1 && got.length && got.length < want.length && got.every(function (piece) {
      return want.some(function (iv) { return iv && M.sameInterval(piece, iv); });
    })) {
      return progress("התחום נכון. יש עוד תחום.");
    }
    if (want.length > 1 && got.length === 1 && ivs.some(function (iv) { return iv && M.sameInterval(got[0], iv); })) {
      return progress("התחום נכון. יש עוד תחום.");
    }
    if (want.length === 1 && want[0].all && !gotAll) {
      return { ok: false, errorId: "missedAllReals", message: "שני התחומים יחד מכסים את כל המספרים הממשיים. בדקו אם נשאר מספר שאינו מקיים אף תנאי." };
    }
    if (gotAll && !(want.length === 1 && want[0].all)) {
      return { ok: false, errorId: "falseAllReals", message: "לא כל המספרים מתאימים. יש ערך שאינו מקיים אף אחד מהתנאים." };
    }
    if (want.length === 1 && got.length === 1 && ivs.some(function (iv) { return iv && M.sameInterval(got[0], iv) && !M.sameInterval(got[0], want[0]); })) {
      return { ok: false, errorId: "omittedRegion", message: "זה רק אחד מהתנאים. באיחוד נכנסים גם הערכים של התנאי השני." };
    }
    return { ok: false, message: "זה לא האיחוד של התחומים. במערכת 'או' מחפשים כל ערך שמקיים לפחות אחד מהתנאים." };
  }

  function checkAnswer(body) {
    if (opOf(body) === "union") return checkUnion(body);
    var typed = String((body && body.typed) || "").trim();
    if (!typed) return { ok: false, message: "כתבו את התחום המשותף." };
    var st = replay(body);
    var n = st.conds.length;
    var want = wantOf(body);
    var got = M.parseInterval(typed);
    if (got && M.sameInterval(got, want)) {
      return { ok: true, solved: true, message: "זהו הפתרון: " + M.formatInterval(want) + ".", reason: "זהו הפתרון: " + M.formatInterval(want) + "." };
    }
    if (/או|∪/.test(typed)) {
      return { ok: false, errorId: "unionNotIntersection", message: unionMessage(n) };
    }
    if (st.compound && !st.splitDone) {
      var fb = splitFeedback(typed, st);
      if (fb) return fb;
    }
    var begun = startIndex(st, typed);
    if (begun >= 0) return progress("רושמים את האי־שוויון. עכשיו אפשר להעביר אגפים ולפתור אותו.");
    var hit = matchStep(st, typed);
    if (hit && hit.chk.ok) {
      if (hit.chk.solved) {
        var others = st.conds.some(function (c, i) { return i !== hit.i && !c.solved; });
        if (others) return progress("מצאת תחום של אחד האי־שוויונים. יש תנאים נוספים שעדיין צריכים להתקיים.");
        return progress("כל התנאים נפתרו. במערכת 'וגם' מחפשים את החלק המשותף לכולם.");
      }
      return progress(hit.chk.message || "צעד חוקי. המשיכו לבודד את x.");
    }
    if (hit && hit.chk && hit.chk.same) return { ok: false, message: hit.chk.message };
    if (hit && hit.chk && hit.chk.errorId) {
      return { ok: false, errorId: hit.chk.errorId, message: hit.chk.message };
    }
    if (!got) {
      if (st.compound && !st.splitDone) {
        return { ok: false, message: "אי־שוויון כפול מפרקים לשני אי־שוויונים המחוברים ב'וגם'." };
      }
      return { ok: false, message: "רשמו תחום, למשל 3 < x < 7, או x > 6, או x = 2, או שאין פתרון." };
    }
    var ivs = targets(body).map(function (t) { return t.iv; });
    var given = allGiven(st);
    if (want.empty) {
      if (got.point) return { ok: false, errorId: "pointNotIncluded", message: "הנקודה אינה כלולה באחד התנאים, ולכן היא לא פתרון." };
      return { ok: false, message: n === 2 ? "אין מספר שמקיים את שני התנאים יחד." : "אין מספר שמקיים את " + bothWord(n) + " יחד." };
    }
    if (got.empty && want.point) {
      return { ok: false, errorId: "missedPoint", message: "בדוק האם נקודת המפגש כלולה בשני התנאים." };
    }
    if (got.empty) return { ok: false, message: n === 2 ? "יש מספרים שמקיימים את שני התנאים." : "יש מספרים שמקיימים את " + bothWord(n) + "." };
    if ((got.all || (got.from === "-inf" && got.to === "inf")) && !want.all) {
      return { ok: false, errorId: "unionNotIntersection", message: unionMessage(n) };
    }
    if (sameEnds(got, want)) return { ok: false, errorId: "wrongOpenClosed", message: inclusionMessage(got, want) };
    var part = subsetSize(got, ivs);
    if (given && n === 2 && part === 1) {
      return { ok: false, errorId: "widerInterval", message: "בדוק אילו מהערכים בתחום שכתבת מקיימים גם את התנאי השני." };
    }
    if (part === 1) {
      return { ok: false, errorId: "partialSystem", message: "יש תנאים נוספים שעדיין צריכים להתקיים." };
    }
    if (part >= 2 && part < n) {
      return { ok: false, errorId: "partialSystem", message: "הפתרון חייב לקיים את " + bothWord(n) + ", לא רק חלק מהם." };
    }
    if ((n === 2 && isUnion(got, ivs[0], ivs[1])) || isUnionN(got, ivs)) {
      return { ok: false, errorId: "unionNotIntersection", message: unionMessage(n) };
    }
    if (got.point && !want.point) {
      return { ok: false, message: n === 2 ? "זו נקודה אחת. בדקו אם היא כלולה בשני התנאים, ואם אין תחום רחב יותר." : "זו נקודה אחת. בדקו אם היא כלולה בכל התנאים." };
    }
    return { ok: false, message: n === 2 ? "זה לא החלק המשותף לשני התנאים." : "זה לא החלק המשותף ל" + bothWord(n) + "." };
  }

  function sameEnds(a, b) {
    if (!a || !b || a.empty || b.empty) return false;
    var fromOk = a.from === b.from || (typeof a.from === "number" && typeof b.from === "number" && Math.abs(a.from - b.from) < 1e-8);
    var toOk = a.to === b.to || (typeof a.to === "number" && typeof b.to === "number" && Math.abs(a.to - b.to) < 1e-8);
    return fromOk && toOk;
  }

  function ordinal(i) {
    return i === 0 ? "הראשון" : i === 1 ? "השני" : "השלישי";
  }

  function engineHints(text) {
    var act = engine.DoctematicaTeach.nextAction(text);
    if (act && act.hints && act.hints.length) return act.hints;
    if (act && act.hint) return [act.hint];
    return ["המשיכו לבודד את x."];
  }

  function unionHints(body) {
    var st = replay(body);
    var n = st.conds.length;
    var solvedCount = st.conds.filter(function (c) { return c.solved; }).length;
    if (!allGiven(st) && solvedCount < n) {
      var lead;
      if (solvedCount === 0) lead = "לפני שמוצאים את פתרון המערכת, פתור כל אחד מאי־השוויונים בנפרד.";
      else if (n === 2 && st.conds[0].solved) lead = "אי־השוויון הראשון פתור. כעת מצא את התחום של התנאי השני.";
      else if (n === 2) lead = "אי־השוויון השני פתור. כעת מצא את התחום של התנאי הראשון.";
      else lead = "חלק מהתנאים כבר נפתרו. כעת פתרו את האי־שוויון שנותר.";
      var focus = st.active >= 0 && !st.conds[st.active].solved ? st.active : st.conds.findIndex(function (c) { return !c.solved; });
      return [lead].concat(engineHints(st.conds[focus].current)).concat(["אפשר להשתמש בשרטוט התחומים כדי לראות את האיחוד."]);
    }
    var set = solutionSet(body);
    var ivs = targets(body).map(function (t) { return t.iv; });
    var contained = ivs.length >= 2 && ivs.some(function (a, i) {
      return ivs.some(function (b, j) { return i !== j && covers(a, b) && !M.sameInterval(a, b); });
    });
    if (contained) {
      return [
        "במערכת 'או' מספיק שהמספר יקיים אחד מהתנאים. בדוק האם אחד התחומים כבר מכיל את התחום השני.",
        "בדוק האם כל המספרים של אחד התחומים כבר נמצאים בתחום השני.",
      ];
    }
    if (holePoint(set) != null || ivs.some(function (iv) { return iv && iv.point; })) {
      return [
        "בדוק במיוחד את נקודת הגבול: האם היא שייכת לאחד משני התחומים?",
        "במערכת 'או' מספיק שהמספר יקיים אחד מהתנאים.",
      ];
    }
    if (set.length === 1 && set[0].all) {
      return [
        "בדוק האם נשאר מספר כלשהו שאינו מקיים אף אחד משני התנאים.",
        "במערכת 'או' מספיק שהמספר יקיים אחד מהתנאים.",
      ];
    }
    if (set.length > 1) {
      return [
        "התחומים אינם חייבים להתחבר. במערכת 'או' אפשר לקבל שני חלקים נפרדים.",
        "במערכת 'או' מספיק שהמספר יקיים אחד מהתנאים.",
      ];
    }
    return [
      "במערכת 'או' מספיק שהמספר יקיים אחד מהתנאים.",
      "אפשר להשתמש בשרטוט התחומים כדי לראות את האיחוד.",
    ];
  }

  function hintsFor(body) {
    if (opOf(body) === "union") return unionHints(body);
    var st = replay(body);
    var n = st.conds.length;
    var drawing = body.drawing || null;
    var open = !!(drawing && drawing.open);
    if (st.compound && !st.splitDone) {
      var shown = st.conds.map(function (c) { return prettyMinus(c.original); }).join(" וגם ");
      return [
        "אי־השוויון הכפול מכיל למעשה שני תנאים שצריכים להתקיים יחד.",
        "הביטוי האמצעי משתתף בשני אי־השוויונים.",
        "מפרקים אותו כך: " + shown + ".",
      ];
    }
    var solvedCount = st.conds.filter(function (c) { return c.solved; }).length;
    if (!allGiven(st) && solvedCount < n) {
      var lead;
      if (solvedCount === 0) {
        lead = n === 3
          ? "לפני שמוצאים את התחום המשותף, פתור כל אחד משלושת אי־השוויונים."
          : "לפני שמוצאים את התחום המשותף, פתור כל אחד משני אי־השוויונים.";
      } else if (solvedCount === n - 1) {
        var done = -1;
        var left = -1;
        st.conds.forEach(function (c, i) {
          if (c.solved) done = i;
          else left = i;
        });
        if (n === 2 && done === 0) lead = "מצאת את התחום של אי־השוויון הראשון. כעת פתור את האי־השוויון השני.";
        else if (n === 2) lead = "מצאת את התחום של אי־השוויון השני. כעת פתור את האי־השוויון הראשון.";
        else lead = "חלק מהתנאים כבר נפתרו. כעת פתור את האי־שוויון " + ordinal(left) + ".";
      } else {
        lead = "נשארו אי־שוויונים שטרם נפתרו. פתרו את הבא.";
      }
      var focus = st.active >= 0 && !st.conds[st.active].solved ? st.active : st.conds.findIndex(function (c) { return !c.solved; });
      return [lead].concat(engineHints(st.conds[focus].current));
    }
    if (allGiven(st) && n >= 3) {
      var three = [
        "חפש אילו ערכי x נמצאים בכל שלושת התחומים.",
        "בדוק איזה מהתנאים הוא המגביל ביותר. כל מספר שמקיים אותו עשוי כבר לקיים גם את התנאים האחרים.",
      ];
      if (!open) return three;
      return ["אפשר לסמן את שלושת התחומים על ציר המספרים, כל תנאי בשורה."].concat(three);
    }
    if (!allGiven(st) && solvedCount >= n) {
      var common = n === 3
        ? "עכשיו יש שלושה תחומים. במערכת 'וגם' מחפשים את הערכים שמקיימים את כולם."
        : "עכשיו יש שני תחומים. במערכת 'וגם' מחפשים את הערכים שמקיימים את שניהם.";
      var visual = n === 3
        ? "אפשר לפתוח את שרטוט התחומים ולסמן את שלושת התחומים על ציר המספרים."
        : "אפשר לפתוח את שרטוט התחומים ולסמן את שני התחומים על ציר המספרים.";
      var more = [];
      if (n >= 3) more.push("בדוק איזה מהתנאים הוא המגביל ביותר. כל מספר שמקיים אותו עשוי כבר לקיים גם את התנאים האחרים.");
      return [common, visual].concat(more);
    }
    var marks = (drawing && drawing.marks) || [];
    var layers = (drawing && drawing.layers) || [];
    var arrowCount = drawing && drawing.arrows && drawing.arrows.length;
    var drawn = arrowCount ? drawing.arrows.filter(function (arrow) { return arrow && arrow.direction; }).length : layers.filter(Boolean).length;
    var base = [
      "במערכת 'וגם' מחפשים ערכי x שמקיימים את שני התנאים בו־זמנית.",
      "אפשר לשרטט כל אחד מהתחומים על ציר המספרים ולחפש את החלק המשותף.",
    ];
    if (!open) return base;
    if (!marks.length) return ["התחל בסימון נקודות הגבול של שני האי־שוויונים."].concat(base);
    if (drawn < 2) return ["כעת סמן לכל תנאי לאיזה כיוון התחום ממשיך."].concat(base);
    var want = wantOf(body);
    var extra = "חפש את החלק שבו שני השרטוטים חופפים.";
    if (want.empty) extra = "האם קיים מספר כלשהו שנמצא בשני התחומים בו־זמנית?";
    else if (want.point) extra = "בדוק האם נקודת המפגש כלולה בשני התנאים.";
    else {
      var ivs = targets(body).map(function (t) { return t.iv; });
      if (ivs.length === 2 && (contains(ivs[0], ivs[1]) || contains(ivs[1], ivs[0]))) extra = "בדוק איזה משני התנאים מגביל יותר את ערכי x.";
    }
    return [extra].concat(base);
  }

  function layerInterval(layer) {
    if (!layer) return null;
    if (layer.direction === "point") return M.parseInterval("x=" + layer.bound);
    if (layer.direction === "right") return M.parseInterval("x" + (layer.included ? "≥" : ">") + layer.bound);
    if (layer.direction === "left") return M.parseInterval("x" + (layer.included ? "≤" : "<") + layer.bound);
    if (layer.direction === "segment") {
      var lo = Math.min(Number(layer.bound), Number(layer.bound2));
      var hi = Math.max(Number(layer.bound), Number(layer.bound2));
      var leftInc = Number(layer.bound) <= Number(layer.bound2) ? layer.included : layer.included2;
      var rightInc = Number(layer.bound) <= Number(layer.bound2) ? layer.included2 : layer.included;
      return {
        from: lo,
        to: hi,
        fromIncluded: !!leftInc,
        toIncluded: !!rightInc,
        empty: false,
        all: false,
        point: Math.abs(lo - hi) < 1e-9,
        inclusive: !!(leftInc || rightInc),
      };
    }
    return null;
  }

  function arrowsToLayers(marks, arrows) {
    if (!arrows) return null;
    var layers = [];
    var i;
    for (i = 0; i < arrows.length; i++) {
      var arrow = arrows[i];
      if (!arrow || !arrow.direction) continue;
      var best = null;
      var bestD = 1;
      var j;
      for (j = 0; j < marks.length; j++) {
        var d = Math.abs(Number(marks[j].pos) - Number(arrow.pos));
        if (d < bestD) {
          best = marks[j];
          bestD = d;
        }
      }
      if (!best || bestD > 0.08) {
        return {
          error: {
            ok: false,
            errorId: "wrongBoundaryOrder",
            message: "קרבו את החץ אל המספר שממנו התחום מתחיל.",
          },
        };
      }
      layers.push({
        bound: best.value,
        included: !!arrow.included,
        direction: arrow.direction,
      });
    }
    return { layers: layers };
  }

  function checkDrawing(body) {
    var drawing = body.drawing || {};
    var marks = drawing.marks || [];
    var i;
    var expected = targets(body);
    var conds = expected.map(function (t) { return t.text; });
    var boundTexts = [];
    expected.forEach(function (t) {
      if (t.raw) boundTexts.push(t.raw);
      if (t.text) boundTexts.push(t.text);
    });
    var ordered = marks.slice().sort(function (p, q) { return p.pos - q.pos; });
    for (i = 1; i < ordered.length; i++) {
      if (Number(ordered[i].value) < Number(ordered[i - 1].value) - 1e-9) {
        return {
          ok: false,
          errorId: "wrongBoundaryOrder",
          message: "שים לב לסדר המספרים על ציר המספרים: " + labelNum(ordered[i].value, boundTexts) + " < " + labelNum(ordered[i - 1].value, boundTexts) + ". " + labelNum(ordered[i].value, boundTexts) + " צריך להופיע משמאל ל־" + labelNum(ordered[i - 1].value, boundTexts) + ".",
        };
      }
    }
    var stDraw = replay(body);
    if (!stDraw.conds.every(function (c) { return c.solved; })) {
      return { ok: false, message: "לפני השרטוט פתרו כל אי־שוויון. אחר כך סמנו את התחומים שקיבלתם." };
    }
    var boundArrows = arrowsToLayers(marks, drawing.arrows);
    if (boundArrows && boundArrows.error) return boundArrows.error;
    var layers = boundArrows ? boundArrows.layers : drawing.layers || [];
    var used = {};
    for (i = 0; i < expected.length; i++) {
      if (expected[i].iv && expected[i].iv.point) {
        var pfound = -1;
        for (j = 0; j < layers.length; j++) {
          if (used[j]) continue;
          if (layers[j].direction === "point" && Math.abs(Number(layers[j].bound) - Number(expected[i].iv.from)) < 1e-8) pfound = j;
        }
        if (pfound < 0) {
          for (j = 0; j < layers.length; j++) {
            if (used[j]) continue;
            if (layers[j].included && Math.abs(Number(layers[j].bound) - Number(expected[i].iv.from)) < 1e-8) pfound = j;
          }
        }
        if (pfound >= 0) {
          used[pfound] = true;
          continue;
        }
        var hasPointMark = marks.some(function (mark) { return Math.abs(Number(mark.value) - Number(expected[i].iv.from)) < 1e-8; });
        if (!hasPointMark) return { ok: false, errorId: "missingInterval", message: "חסרה נקודת הגבול " + labelNum(expected[i].iv.from, boundTexts) + "." };
        return { ok: false, errorId: "missingInterval", message: "חסרה נקודה סגורה ב־" + labelNum(expected[i].iv.from, boundTexts) + "." };
      }
      var found = -1;
      var j;
      for (j = 0; j < layers.length; j++) {
        if (used[j]) continue;
        var got = layerInterval(layers[j]);
        if (got && M.sameInterval(got, expected[i].iv)) {
          found = j;
          break;
        }
      }
      if (found >= 0) {
        used[found] = true;
        continue;
      }
      var close = null;
      var wrongDir = false;
      var expBound = finiteBound(expected[i].iv);
      var expDir = expectedDirection(expected[i].iv);
      for (j = 0; j < layers.length; j++) {
        if (used[j]) continue;
        var trial = layerInterval(layers[j]);
        if (!trial) continue;
        var trialBound = finiteBound(trial);
        if (expBound != null && trialBound != null && Math.abs(trialBound - expBound) < 1e-8 && layers[j].direction && layers[j].direction !== expDir) {
          wrongDir = true;
          continue;
        }
        if (sameEnds(trial, expected[i].iv)) close = { layer: layers[j], iv: trial };
      }
      if (close) {
        return { ok: false, errorId: "wrongOpenClosed", message: inclusionMessage(close.iv, expected[i].iv) };
      }
      if (wrongDir) {
        return {
          ok: false,
          errorId: "wrongDirection",
          message: "סימנת את נקודת הגבול הנכונה, אבל כיוון הקרן הפוך. " + "הסימון " + conds[i].replace(/-/g, "−") + " מתאר מספרים " + (expected[i].iv.to === "inf" ? "הגדולים" : "הקטנים") + " מ־" + labelNum(expBound, boundTexts) + ((expected[i].iv.to === "inf" ? expected[i].iv.fromIncluded : expected[i].iv.toIncluded) ? " או שווים לו" : "") + ". על ציר המספרים התחום צריך להמשיך " + (expected[i].iv.to === "inf" ? "ימינה." : "שמאלה."),
        };
      }
      var bound = expected[i].iv.to === "inf" ? expected[i].iv.from : expected[i].iv.to;
      var hasBound = marks.some(function (mark) { return Math.abs(Number(mark.value) - Number(bound)) < 1e-8; });
      if (!hasBound) {
        return { ok: false, errorId: "missingInterval", message: "חסרה נקודת הגבול " + labelNum(bound, boundTexts) + "." };
      }
      return { ok: false, errorId: "missingInterval", message: "חסר שרטוט של " + conds[i].replace(/-/g, "−") + "." };
    }
    var drawn = layers.filter(function (layer) { return layer && layer.direction; }).length;
    if (drawn > expected.length) {
      return {
        ok: false,
        errorId: "extraInterval",
        message: expected.length === 2
          ? "יש סימון מיותר. מחקו את התחום שאינו אחד משני התנאים."
          : "יש סימון מיותר. מחקו את התחום שאינו אחד מהתנאים.",
      };
    }
    if (opOf(body) === "union") {
      return { ok: true, message: "השרטוט נכון. עכשיו מצא את כל האזורים שנמצאים לפחות באחד משני התחומים." };
    }
    return {
      ok: true,
      message: expected.length === 2
        ? "השרטוט נכון. עכשיו מצא את התחום המשותף לשני התנאים."
        : "השרטוט נכון. עכשיו מצא את התחום המשותף ל" + bothWord(expected.length) + ".",
    };
  }

  function finiteBound(iv) {
    if (!iv || iv.empty) return null;
    if (iv.to === "inf" && iv.from !== "-inf") return Number(iv.from);
    if (iv.from === "-inf" && iv.to !== "inf") return Number(iv.to);
    return null;
  }

  function layerFromIv(iv) {
    if (!iv || iv.empty) return null;
    if (iv.to === "inf" && iv.from !== "-inf") return { bound: iv.from, included: !!iv.fromIncluded, direction: "right" };
    if (iv.from === "-inf" && iv.to !== "inf") return { bound: iv.to, included: !!iv.toIncluded, direction: "left" };
    return {
      bound: iv.from,
      included: !!iv.fromIncluded,
      bound2: iv.to,
      included2: !!iv.toIncluded,
      direction: "segment",
    };
  }

  function drawingActions(body) {
    var packed = targets(body);
    var conds = packed.map(function (t) { return t.text; });
    var ivs = packed.map(function (t) { return t.iv; });
    var values = [];
    ivs.forEach(function (iv) {
      if (!iv || iv.empty) return;
      [iv.from, iv.to].forEach(function (end) {
        if (typeof end !== "number") return;
        if (!values.some(function (v) { return Math.abs(v - end) < 1e-8; })) values.push(end);
      });
    });
    values.sort(function (a, b) { return a - b; });
    var actions = values.map(function (v, i) {
      var pos = values.length === 1 ? 0.5 : 0.22 + (i / (values.length - 1)) * 0.56;
      return {
        type: "mark",
        value: v,
        pos: pos,
        reason: "מסמנים את " + showNum(v) + " על ציר המספרים, לפי הסדר המספרי.",
      };
    });
    ivs.forEach(function (iv, idx) {
      var layer = layerFromIv(iv);
      var dir = !layer ? "" : layer.direction === "right" ? "ימינה" : layer.direction === "left" ? "שמאלה" : "בין שתי הנקודות";
      actions.push({
        type: "layer",
        index: idx,
        layer: layer,
        reason: rayWords(iv, conds[idx]) + " לכן התחום ממשיך " + dir + ".",
      });
    });
    var want = wantOf(body);
    actions.push({
      type: "overlap",
      empty: !!want.empty,
      point: !!want.point,
      from: want.from,
      to: want.to,
      fromIncluded: !!want.fromIncluded,
      toIncluded: !!want.toIncluded,
      reason: want.empty
        ? "אין חלק משותף לשני השרטוטים, ולכן אין פתרון."
        : want.point
          ? "שני התחומים נפגשים רק בנקודה, והיא כלולה בשניהם."
          : "החלק שבו שני השרטוטים חופפים הוא הפתרון של מערכת «וגם».",
    });
    return actions;
  }

  function expectedDirection(iv) {
    if (!iv) return "";
    if (iv.to === "inf" && iv.from !== "-inf") return "right";
    if (iv.from === "-inf" && iv.to !== "inf") return "left";
    return "segment";
  }

  function clampPos(pos) {
    return Math.min(0.9, Math.max(0.1, pos));
  }

  function posForNewValue(value, marks) {
    var lower = null;
    var upper = null;
    marks.forEach(function (mark) {
      var v = Number(mark.value);
      if (Math.abs(v - value) < 1e-8) return;
      if (v < value && (!lower || Number(lower.value) < v)) lower = mark;
      if (v > value && (!upper || Number(upper.value) > v)) upper = mark;
    });
    if (lower && upper) return clampPos((Number(lower.pos) + Number(upper.pos)) / 2);
    if (lower) return clampPos(Number(lower.pos) + 0.18);
    if (upper) return clampPos(Number(upper.pos) - 0.18);
    return 0.5;
  }

  function orderNudge(marks, texts) {
    var ordered = marks.slice().sort(function (a, b) { return Number(a.pos) - Number(b.pos); });
    var i;
    for (i = 1; i < ordered.length; i++) {
      if (Number(ordered[i].value) + 1e-9 >= Number(ordered[i - 1].value)) continue;
      var left = ordered[i - 1];
      var right = ordered[i];
      var pos = clampPos(Number(right.pos) + 0.14);
      var moved = left;
      var stay = right;
      if (pos <= Number(right.pos) + 0.04) {
        pos = clampPos(Number(left.pos) - 0.14);
        moved = right;
        stay = left;
      }
      return {
        type: "move",
        value: Number(moved.value),
        pos: pos,
        reason: labelNum(Math.min(Number(moved.value), Number(stay.value)), texts) + " צריך להופיע משמאל ל־" + labelNum(Math.max(Number(moved.value), Number(stay.value)), texts) + ".",
      };
    }
    return null;
  }

  function rayEnd(iv) {
    if (!iv || iv.empty) return null;
    if (iv.to === "inf" && iv.from !== "-inf") return { value: Number(iv.from), direction: "right", included: !!iv.fromIncluded };
    if (iv.from === "-inf" && iv.to !== "inf") return { value: Number(iv.to), direction: "left", included: !!iv.toIncluded };
    return null;
  }

  function markByValue(marks, value) {
    var i;
    for (i = 0; i < marks.length; i++) {
      if (Math.abs(Number(marks[i].value) - Number(value)) < 1e-8) return marks[i];
    }
    return null;
  }

  function nearestArrow(arrows, pos, direction) {
    var found = -1;
    var best = 1;
    var i;
    for (i = 0; i < arrows.length; i++) {
      var arrow = arrows[i];
      if (!arrow || (direction && arrow.direction !== direction)) continue;
      var d = Math.abs(Number(arrow.pos) - Number(pos));
      if (d < best) {
        best = d;
        found = i;
      }
    }
    return { index: found, dist: best };
  }

  function nextDrawingAction(body) {
    var drawing = body.drawing || {};
    var marks = (drawing.marks || []).map(function (mark) {
      return { value: Number(mark.value), pos: Number(mark.pos) };
    });
    var arrows = drawing.arrows || [];
    var packed = targets(body);
    var conds = packed.map(function (t) { return t.text; });
    var boundTexts = [];
    packed.forEach(function (t) {
      if (t.raw) boundTexts.push(t.raw);
      if (t.text) boundTexts.push(t.text);
    });
    var ivs = packed.map(function (t) { return t.iv; });
    var values = [];
    ivs.forEach(function (iv) {
      if (!iv || iv.empty) return;
      [iv.from, iv.to].forEach(function (end) {
        if (typeof end !== "number") return;
        if (!values.some(function (v) { return Math.abs(v - end) < 1e-8; })) values.push(end);
      });
    });
    values.sort(function (a, b) { return a - b; });
    var i;
    for (i = 0; i < values.length; i++) {
      if (markByValue(marks, values[i])) continue;
      var pos = posForNewValue(values[i], marks);
      var beside = null;
      marks.forEach(function (mark) {
        if (!beside || Math.abs(mark.pos - pos) < Math.abs(beside.pos - pos)) beside = mark;
      });
      var frac = fractionOf(values[i], boundTexts);
      var where = beside
        ? (pos < beside.pos ? " משמאל ל־" + labelNum(beside.value, boundTexts) : " מימין ל־" + labelNum(beside.value, boundTexts))
        : "";
      return {
        type: "mark",
        value: values[i],
        pos: pos,
        num: frac ? frac.num : undefined,
        den: frac ? frac.den : undefined,
        sign: frac ? frac.sign : undefined,
        reason: "מסמנים את " + labelNum(values[i], boundTexts) + " על הציר" + where + ", בלי להזיז מספרים שכבר סומנו.",
      };
    }
    var nudge = orderNudge(marks, boundTexts);
    if (nudge) return nudge;
    for (i = 0; i < ivs.length; i++) {
      var end = rayEnd(ivs[i]);
      if (!end) continue;
      var mark = markByValue(marks, end.value);
      if (!mark) continue;
      var sameDir = nearestArrow(arrows, mark.pos, end.direction);
      if (sameDir.index >= 0 && sameDir.dist <= 0.08) {
        if (!!arrows[sameDir.index].included !== end.included) {
          return {
            type: "arrow-fix",
            index: sameDir.index,
            included: end.included,
            reason: end.included
              ? "התחום כולל את " + labelNum(end.value, boundTexts) + ". נקודת הקצה צריכה להיות סגורה."
              : "התחום אינו כולל את " + labelNum(end.value, boundTexts) + ". נקודת הקצה צריכה להיות פתוחה.",
          };
        }
        continue;
      }
      var any = nearestArrow(arrows, mark.pos, "");
      var servesOther = false;
      if (any.index >= 0) {
        var otherK;
        for (otherK = 0; otherK < ivs.length; otherK++) {
          var served = rayEnd(ivs[otherK]);
          if (!served || served.direction !== arrows[any.index].direction) continue;
          var servedMark = markByValue(marks, served.value);
          if (servedMark && Math.abs(Number(servedMark.pos) - Number(arrows[any.index].pos)) <= 0.08) servesOther = true;
        }
      }
      if (!servesOther && any.index >= 0 && any.dist <= 0.08 && arrows[any.index].direction !== "point" && arrows[any.index].direction !== end.direction) {
        return {
          type: "arrow-fix",
          index: any.index,
          direction: end.direction,
          included: end.included,
          reason: rayWords(ivs[i], conds[i]) + " לכן החץ ממשיך " + (end.direction === "right" ? "ימינה." : "שמאלה."),
        };
      }
      var loose = -1;
      var j;
      for (j = 0; j < arrows.length; j++) {
        if (!arrows[j] || arrows[j].direction !== end.direction) continue;
        var used = false;
        var k;
        for (k = 0; k < ivs.length; k++) {
          var other = rayEnd(ivs[k]);
          var otherMark = other && markByValue(marks, other.value);
          if (!otherMark || other.direction !== end.direction) continue;
          if (Math.abs(Number(arrows[j].pos) - Number(otherMark.pos)) <= 0.08) used = true;
        }
        if (!used) loose = j;
      }
      if (loose >= 0) {
        return {
          type: "arrow-fix",
          index: loose,
          pos: mark.pos,
          included: end.included,
          reason: "מקרבים את החץ אל " + labelNum(end.value, boundTexts) + ", בלי להזיז את המספרים.",
        };
      }
      return {
        type: "arrow",
        direction: end.direction,
        included: end.included,
        pos: mark.pos,
        reason: rayWords(ivs[i], conds[i]) + " לכן החץ יוצא מ־" + labelNum(end.value, boundTexts) + " " + (end.direction === "right" ? "ימינה." : "שמאלה."),
      };
    }
    for (i = 0; i < ivs.length; i++) {
      if (!ivs[i] || !ivs[i].point) continue;
      var pointMark = markByValue(marks, ivs[i].from);
      if (!pointMark) continue;
      var hasPoint = false;
      var p;
      for (p = 0; p < arrows.length; p++) {
        if (!arrows[p] || !arrows[p].included) continue;
        if (arrows[p].direction !== "point" && arrows[p].direction) continue;
        if (Math.abs(Number(arrows[p].pos) - Number(pointMark.pos)) <= 0.08) hasPoint = true;
      }
      if (hasPoint) continue;
      return {
        type: "arrow",
        direction: "point",
        included: true,
        pos: pointMark.pos,
        reason: "מסמנים את הנקודה " + labelNum(ivs[i].from, boundTexts) + " בעיגול סגור, כי היא כלולה בתנאי.",
      };
    }
    if (!drawing.overlap) return coverAction(body);
    return null;
  }

  function coverAction(body) {
    if (opOf(body) === "union") {
      var set = solutionSet(body);
      var first = set[0] || {};
      var hole = holePoint(set);
      var reason = "כל השטח שמכוסה על ידי לפחות אחד מהתחומים הוא פתרון מערכת «או».";
      if (!set.length) reason = "אין אזור שמכוסה על ידי התנאים.";
      else if (set.length === 1 && set[0].all) reason = "אין מספר שנשאר מחוץ לשני התחומים.";
      else if (hole != null) reason = "שימו לב לנקודת הגבול " + showNum(hole) + " שנשארה בחוץ.";
      else if (set.length > 1) reason = "האיחוד כאן הוא כמה אזורים נפרדים, לא קטע אחד.";
      return {
        type: "overlap",
        empty: !set.length,
        point: set.length === 1 && !!first.point,
        from: first.from,
        to: first.to,
        fromIncluded: !!first.fromIncluded,
        toIncluded: !!first.toIncluded,
        regions: set,
        reason: reason,
      };
    }
    var want = wantOf(body);
    return {
      type: "overlap",
      empty: !!want.empty,
      point: !!want.point,
      from: want.from,
      to: want.to,
      fromIncluded: !!want.fromIncluded,
      toIncluded: !!want.toIncluded,
      regions: want.empty ? [] : [want],
      reason: want.empty
        ? "אין חלק משותף לשני השרטוטים, ולכן אין פתרון."
        : want.point
          ? "שני התחומים נפגשים רק בנקודה, והיא כלולה בשניהם."
          : "החלק שבו שני השרטוטים חופפים הוא הפתרון של מערכת «וגם».",
    };
  }

  function oneStepPhase(body) {
    var st = replay(body);
    if (st.compound && !st.splitDone) {
      var line = st.conds.map(function (c) { return prettyMinus(c.original); }).join(" וגם ");
      return {
        ok: true,
        step: line,
        reason: "אי־שוויון כפול מתאר שני תנאים שצריכים להתקיים בו־זמנית, ולכן מפרקים אותו לשני אי־שוויונים המחוברים ב'וגם'.",
        solved: false,
      };
    }
    var idx = st.active >= 0 && !st.conds[st.active].solved ? st.active : -1;
    if (idx < 0) {
      var i;
      for (i = 0; i < st.conds.length; i++) {
        if (!st.conds[i].solved) {
          idx = i;
          break;
        }
      }
    }
    if (idx >= 0) {
      var cond = st.conds[idx];
      if (!cond.started && normKey(cond.current) === normKey(cond.original) && !M.parseInterval(cond.original)) {
        return {
          ok: true,
          step: prettyMinus(cond.original),
          reason: "קודם רושמים את האי־שוויון, ואחר כך מעבירים אגפים.",
          solved: false,
        };
      }
      var act = engine.DoctematicaTeach.nextAction(cond.current);
      if (act && act.eq) {
        return { ok: true, step: prettyMinus(act.eq), reason: act.explain || act.hint || "", solved: false };
      }
    }
    var shown = answerText(body);
    var why = opOf(body) === "union" ? unionWhy(body) : intersectWhy(wantOf(body), st.conds.length);
    return { ok: true, step: shown, reason: why, solved: true, answer: shown };
  }

  function walkableSteps(body) {
    var out = [];
    solutionSteps(body).forEach(function (step) {
      if (step && step.parallel) {
        step.parallel.forEach(function (col) {
          (col.steps || []).forEach(function (bit) {
            if (bit && !/^משימה:/.test(String(bit.eq || ""))) out.push(bit);
          });
        });
        return;
      }
      if (!/^משימה:/.test(String(step && step.eq || ""))) out.push(step);
    });
    return out;
  }

  function handle(body) {
    body = body || {};
    var intent = String(body.intent || "");
    if (intent === "check") return checkAnswer(body);
    if (intent === "draw-check") return checkDrawing(body);
    if (intent === "hint") {
      var hints = hintsFor(body);
      return { ok: true, hint: hints[0], hints: hints };
    }
    if (intent === "solution") {
      var steps = solutionSteps(body);
      return { ok: true, steps: steps, answer: steps[steps.length - 1].eq };
    }
    if (intent === "one-step") {
      var history = body.history || [];
      var stNow = replay(body);
      var readyDraw = stNow.conds.every(function (c) { return c.solved; });
      if (body.drawing && body.drawing.open && readyDraw) {
        var drawingStep = nextDrawingAction(body);
        if (drawingStep) return { ok: true, drawingAction: drawingStep, reason: drawingStep.reason, solved: false };
        var already = history.some(function (line) {
          if (opOf(body) === "union") return setEquals(line, solutionSet(body));
          var got = M.parseInterval(line);
          return got && M.sameInterval(got, wantOf(body));
        });
        if (already) return { ok: true, done: true, hint: "הפתרון כבר רשום." };
        var finalStep = walkableSteps(body);
        var last = finalStep[finalStep.length - 1];
        return { ok: true, step: last.eq, reason: last.explain, solved: true, answer: last.eq };
      }
      if (!allGiven(stNow)) return oneStepPhase(body);
      var walk = walkableSteps(body);
      var next = walk[Math.min(history.length, walk.length - 1)];
      var solvedWalk = history.length >= walk.length - 1;
      return { ok: true, step: next.eq, reason: next.explain, solved: solvedWalk, answer: walk[walk.length - 1].eq };
    }
    return { ok: false, message: "unknown intent" };
  }

  return { handle: handle };
}

module.exports = { createIntervalsHandler: createIntervalsHandler };
