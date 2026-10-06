"use strict";

function near(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-6;
}

function finiteY(value) {
  if (value === "inf" || value === "+inf") return Infinity;
  if (value === "-inf") return -Infinity;
  var n = Number(value);
  return isFinite(n) ? n : null;
}

function probeCount(knots, k) {
  var height = Number(k);
  if (!isFinite(height)) return 0;
  var count = 0;
  var i;
  for (i = 0; i < (knots || []).length - 1; i++) {
    var a = finiteY(knots[i].y);
    var b = finiteY(knots[i + 1].y);
    if (a == null || b == null) continue;
    var lo = Math.min(a, b);
    var hi = Math.max(a, b);
    if (height > lo && height < hi) count += 1;
  }
  (knots || []).forEach(function (knot) {
    var y = finiteY(knot.y);
    if (y == null || !isFinite(y) || !near(y, height)) return;
    if (knot.kind === "min" || knot.kind === "max" || knot.kind === "end") count += 1;
  });
  return count;
}

function criticalYs(knots) {
  var ys = [];
  (knots || []).forEach(function (knot) {
    var y = finiteY(knot.y);
    if (y == null || !isFinite(y)) return;
    if (ys.some(function (item) { return near(item, y); })) return;
    ys.push(y);
  });
  ys.sort(function (a, b) { return a - b; });
  return ys;
}

function band(from, to, fromIncluded, toIncluded, count) {
  var point = from === to;
  return {
    from: from,
    to: to,
    fromIncluded: !!fromIncluded,
    toIncluded: !!toIncluded,
    point: point,
    empty: false,
    all: false,
    count: count,
  };
}

function probeBands(knots) {
  var crit = criticalYs(knots);
  var bands = [];
  var prev = "-inf";
  crit.forEach(function (y) {
    var sample = prev === "-inf" ? y - 1 : (Number(prev) + y) / 2;
    bands.push(band(prev, y, false, false, probeCount(knots, sample)));
    bands.push(band(y, y, true, true, probeCount(knots, y)));
    prev = y;
  });
  var above = prev === "-inf" ? 0 : Number(prev) + 1;
  bands.push(band(prev, "inf", false, false, probeCount(knots, above)));
  return bands;
}

function bandsForCount(knots, count) {
  return probeBands(knots).filter(function (item) { return item.count === count; });
}

function crossings(curve, qy) {
  var line = Number(qy);
  var hits = [];
  var samples = curve || [];
  var i;
  for (i = 1; i < samples.length; i++) {
    var a = samples[i - 1];
    var b = samples[i];
    var da = Number(a.qy) - line;
    var db = Number(b.qy) - line;
    if (Math.abs(da) < 0.012 && Math.abs(db) < 0.012) continue;
    if (da * db < 0) {
      var t = da / (da - db);
      hits.push({ qx: Number(a.qx) + (Number(b.qx) - Number(a.qx)) * t, qy: line, kind: "cross" });
    }
  }
  for (i = 1; i < samples.length - 1; i++) {
    var p = samples[i];
    var prev = samples[i - 1];
    var next = samples[i + 1];
    var localMax = Number(p.qy) >= Number(prev.qy) && Number(p.qy) >= Number(next.qy) && (Number(p.qy) > Number(prev.qy) || Number(p.qy) > Number(next.qy));
    var localMin = Number(p.qy) <= Number(prev.qy) && Number(p.qy) <= Number(next.qy) && (Number(p.qy) < Number(prev.qy) || Number(p.qy) < Number(next.qy));
    if (!(localMax || localMin) || Math.abs(Number(p.qy) - line) > 0.03) continue;
    hits = hits.filter(function (hit) { return Math.abs(hit.qx - Number(p.qx)) > 0.08; });
    hits.push({ qx: Number(p.qx), qy: Number(p.qy), kind: "tangent" });
  }
  hits.sort(function (a, b) { return a.qx - b.qx; });
  return hits;
}

function tasksOf(ex) {
  var list = [];
  (ex.parts || []).forEach(function (part) {
    var tasks = part.tasks && part.tasks.length ? part.tasks : [];
    tasks.forEach(function (task) {
      list.push({ part: part, task: task });
    });
  });
  return list;
}

function locate(ex, progress) {
  var list = tasksOf(ex);
  var index = progress && isFinite(progress.index) ? Number(progress.index) : 0;
  if (index < 0) index = 0;
  if (index >= list.length) return { done: true, index: list.length, list: list };
  return { done: false, index: index, item: list[index], list: list };
}

function lineLabel(task) {
  return "y=" + String(task && task.k).replace("-", "−");
}

function probeSpec(ex, task) {
  var anchors = (ex.figure && ex.figure.anchors) || [];
  if (task && task.kind === "probeLevels") {
    return { mode: "drag", label: "y = k", anchors: anchors };
  }
  return { mode: "fixed", y: task.k, label: lineLabel(task), anchors: anchors };
}

function viewFor(ex, progress) {
  var loc = locate(ex, progress);
  var item = loc.item;
  var part = item ? item.part : (ex.parts || [])[ex.parts.length - 1];
  var task = item && item.task;
  return {
    input: "math",
    family: "probe",
    figure: ex.figure || null,
    probe: task ? probeSpec(ex, task) : null,
    part: part ? { label: part.label || "", text: part.text || "" } : null,
    focusKind: task ? task.kind : "",
    hint: task ? hintsFor(ex, task, progress)[0] : "",
  };
}

function payload(ex, progress, extra) {
  var out = { ok: true, view: viewFor(ex, progress), progress: progress };
  Object.keys(extra || {}).forEach(function (key) { out[key] = extra[key]; });
  out.view = viewFor(ex, progress);
  out.progress = progress;
  return out;
}

function issue(id, message) {
  return { ok: false, errorId: id, message: message };
}

function knotAt(knots, y) {
  return (knots || []).filter(function (knot) {
    var height = finiteY(knot.y);
    return height != null && isFinite(height) && near(height, y);
  })[0] || null;
}

function readCount(M, text) {
  var flat = String(text || "").replace(/[.\s_"׳״`−–—]/g, "").replace(/-/g, "");
  flat = flat.replace(/נקודותחיתוך|נקודות|נקודה|חיתוכים|חיתוך|פתרונות|פתרון/g, "");
  var words = {
    0: /^(0|אפס|אין|אף|איןאף)$/,
    1: /^(1|אחת|אחד)$/,
    2: /^(2|שתיים|שניים|שתי|שני)$/,
    3: /^(3|שלוש|שלושה)$/,
    4: /^(4|ארבע|ארבעה)$/,
    5: /^(5|חמש|חמישה)$/,
  };
  var key;
  for (key in words) {
    if (words[key].test(flat)) return Number(key);
  }
  var n = M.bareNumber(text);
  if (n != null && Math.abs(n - Math.round(n)) < 1e-8 && n >= 0 && n <= 12) return Math.round(n);
  return null;
}

function countIssue(M, ex, task, text) {
  var want = probeCount(ex.profile, task.k);
  var said = readCount(M, text);
  var raw = String(text || "").replace(/\s+/g, "");
  if (task.form === "f" && /x=/i.test(raw) && !/f\(x\)/i.test(raw)) {
    return issue("treatedFxEqualsKDifferentlyFromYEqualsK", "f(x)=" + num(task.k) + " הוא אותו דבר כמו הישר y=" + num(task.k) + ". ספרו את נקודות החיתוך של הישר עם הגרף.");
  }
  if (said == null) return issue("wrongIntersectionCount", "רשמו כמה נקודות חיתוך יש, למשל 0, 1 או 2.");
  if (said === want) return null;
  var at = knotAt(ex.profile, task.k);
  if (at && (at.kind === "min" || at.kind === "max") && said === want + 1 && want >= 1) {
    return issue("countedTangentTwice", "נקודת השקה היא נקודת חיתוך אחת, גם אם הגרף משנה בה כיוון.");
  }
  if (at && said === 1 && want > 1) {
    return issue("missedOuterBranch", "נגיעה בקיצון היא נקודה אחת, ויש עוד ענף של הגרף שמגיע לאותו גובה. ספרו את כל נקודות המפגש.");
  }
  if (at && said === 0 && want >= 1) {
    return issue("missedTangentIntersection", "גם כאשר הישר רק נוגע בגרף ואינו עובר דרכו, זו עדיין נקודת חיתוך.");
  }
  if (task.form === "f" && near(said, task.k) && !near(want, task.k)) {
    return issue("treatedFxEqualsKDifferentlyFromYEqualsK", "f(x)=" + num(task.k) + " הוא גובה, כמו הישר y=" + num(task.k) + ". המספר המבוקש הוא מספר נקודות החיתוך.");
  }
  var xHit = (ex.profile || []).some(function (knot) { return knot.x != null && near(knot.x, said) && !near(said, want); });
  if (xHit || (near(said, task.k) && !near(want, task.k))) {
    return issue("confusedXWithYLevel", near(said, task.k)
      ? "זה הגובה של הישר, לא מספר נקודות החיתוך."
      : "זה שיעור ה־x של נקודה על הגרף, לא מספר נקודות החיתוך.");
  }
  if (said === 2 && want > 2) {
    return issue("assumedParabola", "הגרף אינו פרבולה. לישר אופקי יכולות להיות יותר משתי נקודות חיתוך.");
  }
  return issue("wrongIntersectionCount", "עברו על הישר משמאל לימין וספרו כל מקום שבו הוא פוגש את הגרף.");
}

function num(value) {
  var n = Number(value);
  if (!isFinite(n)) return "";
  if (Math.abs(n - Math.round(n)) < 1e-8) return String(Math.round(n)).replace("-", "−");
  return String(n).replace("-", "−");
}

function asK(text) {
  return String(text || "").replace(/\bx\b/gi, "k");
}

function asX(text) {
  return String(text || "").replace(/\bk\b/gi, "x");
}

function formatBands(M, bands) {
  return asK(M.formatIntervalSet(bands));
}

function endpointSet(bands) {
  var ys = [];
  (bands || []).forEach(function (item) {
    [item.from, item.to].forEach(function (end) {
      if (typeof end !== "number" || !isFinite(end)) return;
      if (ys.some(function (y) { return near(y, end); })) return;
      ys.push(end);
    });
  });
  return ys;
}

function inclusionShift(student, expected) {
  var i;
  var j;
  for (i = 0; i < student.length; i++) {
    for (j = 0; j < expected.length; j++) {
      var a = student[i];
      var b = expected[j];
      var sameEnds = (a.from === b.from || near(a.from, b.from)) && (a.to === b.to || near(a.to, b.to));
      if (!sameEnds) continue;
      if (!!a.fromIncluded === !!b.fromIncluded && !!a.toIncluded === !!b.toIncluded) continue;
      var studentWider = (!!a.fromIncluded && !b.fromIncluded) || (!!a.toIncluded && !b.toIncluded);
      return studentWider ? "included" : "excluded";
    }
  }
  return "";
}

function levelIssue(M, ex, task, text) {
  var raw = String(text || "").trim();
  if (!raw) return issue("wrongKBoundary", "רשמו תחום של k.");
  if (M.isEmptySet(raw)) return issue("wrongKBoundary", "יש ערכי k שמתאימים. רשמו את התחום, לא «אין».");
  if (M.isAllReals(raw)) return issue("wrongKBoundary", "לא לכל k יש אותו מספר חיתוכים.");
  var want = bandsForCount(ex.profile, task.count);
  var parsed = M.parseRegionList(asX(raw));
  if (!parsed) return issue("wrongKBoundary", "רשמו תחום של k, למשל k>1 או 0<k<1.");
  if (M.sameIntervalSet(parsed, want)) return null;
  var shift = inclusionShift(parsed, want);
  if (shift === "included") return issue("includedCriticalK", "בגובה נקודת הקיצון מספר החיתוכים שונה מהתחום הפתוח שסביבה.");
  if (shift === "excluded") return issue("excludedCriticalK", "ערך הקיצון עצמו שייך לתחום. בדקו כמה חיתוכים יש בדיוק בגובה הזה.");
  var studentFits = parsed.every(function (got) {
    return want.some(function (item) { return M.sameInterval(got, item); });
  });
  var missingPoints = want.filter(function (item) {
    return item.point && !parsed.some(function (got) { return got.point && near(got.from, item.from); });
  });
  var otherMissing = want.filter(function (item) {
    return !parsed.some(function (got) { return M.sameInterval(got, item); });
  });
  if (studentFits && missingPoints.length && missingPoints.length === otherMissing.length) {
    return issue("excludedCriticalK", "ערך הקיצון עצמו שייך לתחום. בדקו כמה חיתוכים יש בדיוק בגובה הזה.");
  }
  var used = endpointSet(parsed);
  var needed = endpointSet(want);
  var missed = needed.filter(function (y) { return !used.some(function (got) { return near(got, y); }); });
  if (missed.length) {
    var maxMiss = missed.some(function (y) {
      var knot = knotAt(ex.profile, y);
      return knot && knot.kind === "max";
    });
    if (maxMiss) return issue("ignoredLocalMaximum", "התעלמתם מגובה המקסימום. שם מספר החיתוכים משתנה.");
    return issue("ignoredLocalMinimum", "התעלמתם מגובה המינימום. שם מספר החיתוכים משתנה.");
  }
  var foreign = used.some(function (y) {
    return !criticalYs(ex.profile).some(function (crit) { return near(crit, y); });
  });
  if (foreign) return issue("wrongKBoundary", "מספר החיתוכים משתנה בגובה של נקודת קיצון, לא בגובה אחר.");
  if (readCount(M, raw) === 2 && task.count > 2) {
    return issue("assumedParabola", "הגרף אינו פרבולה. לישר אופקי יכולות להיות יותר משתי נקודות חיתוך. רשמו תחום של k.");
  }
  return issue("wrongKBoundary", "התחום אינו מתאים. חלקו את ערכי k לפי גבהי נקודות הקיצון, ובדקו כל תחום וגם את הגבהים עצמם.");
}

function heightList(ex) {
  return criticalYs(ex.profile).map(num).join(" ו־y=").replace(/^/, "y=");
}

function hintsFor(ex, task, progress) {
  var probeOn = !!(progress && progress.probeOn);
  var last = progress && progress.lastError;
  if (task.kind === "probeLevels") {
    return [
      "הזיזו את הישר y=k מלמטה למעלה ובדקו מתי מספר נקודות החיתוך משתנה.",
      "מספר החיתוכים יכול להשתנות כאשר הישר עובר בגובה של נקודת קיצון.",
    ];
  }
  if (!probeOn) return ["נסו להוסיף ישר אופקי ולמקם אותו בגובה המבוקש."];
  if (last === "missedTangentIntersection") return ["גם כאשר הישר רק נוגע בגרף ואינו עובר דרכו, זו עדיין נקודת חיתוך."];
  if (last === "countedTangentTwice") return ["נקודת השקה היא נקודת חיתוך אחת, גם אם הגרף משנה בה כיוון."];
  if (last === "missedOuterBranch") return ["עברו על הישר משמאל לימין וספרו גם ענפים שמחוץ לנקודת הקיצון."];
  return ["עברו על הישר משמאל לימין וספרו כל מקום שבו הוא פוגש את גרף הפונקציה."];
}

function countMessage(task, count) {
  var name = lineLabel(task);
  if (count === 0) return "הישר " + name + " אינו פוגש את הגרף.";
  if (count === 1) return "יש נקודת חיתוך אחת. נגיעה בקיצון נספרת פעם אחת.";
  return "יש " + count + " נקודות חיתוך. נגיעה בקיצון נספרת פעם אחת, וכל ענף נוסף נספר בנפרד.";
}

function solutionLines(M, ex) {
  var steps = [];
  var notes = [];
  steps.push("הגרף נתון. מוסיפים מעליו ישר אופקי, בלי לשנות את הגרף.");
  notes.push("y=k וגם f(x)=k מתארים אותו ישר אופקי.");
  steps.push("גבהי נקודות הקיצון הם " + heightList(ex) + ". באלה מספר החיתוכים עשוי להשתנות.");
  notes.push("נגיעה בקיצון היא נקודת חיתוך אחת.");
  tasksOf(ex).forEach(function (item) {
    var task = item.task;
    var label = item.part.label ? "סעיף " + item.part.label + ": " : "";
    if (task.kind === "probeCount") {
      var count = probeCount(ex.profile, task.k);
      steps.push(label + "מציבים את הישר " + lineLabel(task) + " וסופרים " + count + " נקודות מפגש.");
      notes.push(countMessage(task, count));
      return;
    }
    var bands = bandsForCount(ex.profile, task.count);
    steps.push(label + "ל" + task.count + " נקודות חיתוך מתקבל " + formatBands(M, bands) + ".");
    notes.push("בודקים כל תחום פתוח בין גבהי הקיצון, וגם את הגבהים עצמם.");
  });
  return { steps: steps, notes: notes };
}

function advance(progress) {
  progress.index = (progress.index || 0) + 1;
  progress.coach = 0;
  progress.lastError = "";
}

function fresh(body) {
  var progress = body && body.progress ? body.progress : {};
  if (!isFinite(progress.index)) progress.index = 0;
  progress.probeOn = !!(body && body.probe && body.probe.on);
  return progress;
}

function handle(engine, ex, body) {
  var M = engine.DoctematicaFnModel;
  var intent = String((body && body.intent) || "check");
  var progress = fresh(body);
  var loc = locate(ex, progress);
  if (intent === "solution") {
    var solved = solutionLines(M, ex);
    return { ok: true, steps: solved.steps, notes: solved.notes, answer: solved.steps[solved.steps.length - 1] || "" };
  }
  if (loc.done) return { ok: false, message: "סיימתם את התרגיל.", view: viewFor(ex, progress), progress: progress };
  var task = loc.item.task;
  if (intent === "hint") {
    var list = hintsFor(ex, task, progress);
    return payload(ex, progress, { hint: list[0], hints: list });
  }
  if (intent === "probe-check") {
    if (!progress.probeOn) return issue("wrongIntersectionCount", "קודם הוסיפו ישר אופקי.");
    var qy = body.probe && body.probe.qy;
    var markers = crossings(ex.figure && ex.figure.curve, qy);
    var ready = task.kind === "probeLevels"
      ? "סומנו נקודות המפגש בגובה הנוכחי. הזיזו את הישר ובדקו גם גבהים אחרים."
      : "הישר מוכן. ספרו את נקודות המפגש עם הגרף, ורשמו את המספר.";
    return payload(ex, progress, { probeMarkers: markers, message: ready });
  }
  if (intent === "one-step") {
    var coach = progress.coach || 0;
    if (task.kind === "probeCount") {
      if (!progress.probeOn && coach < 1) {
        progress.coach = 1;
        return payload(ex, progress, {
          show: "הוסיפו ישר אופקי.",
          message: "הישר נוסף בגובה של הסעיף. אחר כך סופרים את נקודות המפגש.",
        });
      }
      if (coach < 2) {
        progress.coach = 2;
        return payload(ex, progress, {
          show: "סופרים לאורך הישר.",
          message: "עוברים משמאל לימין. נגיעה בקיצון נספרת פעם אחת.",
        });
      }
      return payload(ex, progress, {
        show: "רשמו כמה נקודות מפגש יש עם הגרף.",
        message: "המספר נקבע לפי הספירה לאורך הישר.",
        solved: false,
      });
    }
    if (coach < 1) {
      progress.coach = 1;
      return payload(ex, progress, {
        show: "מזיזים את y=k.",
        message: "הזיזו את הישר מלמטה למעלה ובדקו מתי מספר נקודות החיתוך משתנה.",
      });
    }
    if (coach < 2) {
      progress.coach = 2;
      return payload(ex, progress, {
        show: "מחלקים לפי גבהי הקיצון.",
        message: "חלקו את ערכי k לפי הגבהים " + heightList(ex) + " ובדקו בכל תחום כמה פעמים הישר חותך את הגרף.",
      });
    }
    var shown = formatBands(M, bandsForCount(ex.profile, task.count));
    advance(progress);
    return payload(ex, progress, {
      show: shown,
      message: "בכל תחום פתוח מספר החיתוכים קבוע, ובגובה הקיצון עצמו בודקים בנפרד.",
      solved: locate(ex, progress).done,
    });
  }
  var checked = task.kind === "probeLevels"
    ? levelIssue(M, ex, task, body && body.typed)
    : countIssue(M, ex, task, body && body.typed);
  if (checked) {
    progress.lastError = checked.errorId;
    return {
      ok: false,
      errorId: checked.errorId,
      message: checked.message,
      progress: progress,
      view: viewFor(ex, progress),
    };
  }
  var show = task.kind === "probeLevels"
    ? formatBands(M, bandsForCount(ex.profile, task.count))
    : String(probeCount(ex.profile, task.k));
  var why = task.kind === "probeLevels"
    ? "זה התחום שבו לישר y=k יש " + task.count + " נקודות חיתוך עם הגרף."
    : countMessage(task, probeCount(ex.profile, task.k));
  advance(progress);
  return payload(ex, progress, { show: show, message: why, solved: locate(ex, progress).done });
}

module.exports = {
  handle: handle,
  openingView: function (engine, ex) { return viewFor(ex, { index: 0 }); },
  probeCount: probeCount,
  probeBands: probeBands,
  bandsForCount: bandsForCount,
  crossings: crossings,
};
