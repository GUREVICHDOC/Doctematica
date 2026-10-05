"use strict";

// Graph → critical x values → open intervals → one property on each interval.
// The property on this page is pos / neg. A zero does not flip the property by
// itself: both sides are stored explicitly, so a touch can stay positive | zero | positive.
// The same split can later carry increasing / decreasing. Nothing here assumes a
// parabola or a fixed number of zeros.

var ZERO_MSG =
  "בנקודה הזו הגרף נמצא על ציר ה־x ולכן f(x)=0. היא אינה שייכת לתחום שבו הפונקציה חיובית או שלילית.";
var REVERSED_MSG = "בדקו את מיקום הגרף ביחס לציר ה־x: מעל הציר ערכי הפונקציה חיוביים.";
var MISSING_POS_MSG = "יש עוד חלק של הגרף שנמצא מעל ציר ה־x. המשיכו לבדוק גם מעבר לנקודת האפס הבאה.";
var MISSING_NEG_MSG = "יש עוד חלק של הגרף שנמצא מתחת לציר ה־x. המשיכו לבדוק גם מעבר לנקודת האפס הבאה.";
var TOUCH_MSG = "הגרף מגיע לציר ה־x בנקודה הזו, אבל בדקו אם הוא באמת חוצה אותו או רק נוגע וחוזר לאותו צד.";
var CROSS_MSG = "הגרף חוצה את ציר ה־x בנקודה הזו, ולכן הסימן מתחלף משני צדיה.";
var ALL_MSG = "אי אפשר לכתוב כל x, כי בנקודת האפס f(x)=0 והיא אינה חלק מהתחום.";
var EMPTY_MSG = "יש תחום שבו הגרף נמצא מעל או מתחת לציר ה־x. בדקו שוב את הסקיצה.";
var BOUND_MSG = "הגבול נכון, אבל בדקו לאיזה צד של נקודת האפס הגרף נמצא מעל לציר ה־x, ולאיזה צד מתחת.";
var DOUBLE_MSG = "הגבולות נכונים, אבל בדקו אם הגרף בין נקודות האפס נמצא מעל לציר ה־x או מתחתיו.";
var SPLIT_MSG = "אל תחלקו את התחום בנקודת קיצון שאינה על ציר ה־x. לחיוביות ולשליליות בודקים רק היכן הגרף פוגש את ציר ה־x.";
var GENERIC_MSG = "התחומים אינם תואמים את מיקום הגרף ביחס לציר ה־x.";
var WRITE_MSG = "כתבו תחום, למשל x < 3 או 3 < x < 6. אם אין תחום, כתבו אין.";
var FILL_MSG = "רשמו את תחומי החיוביות ואת תחומי השליליות. אם אין תחום, כתבו אין.";
var AFTER_TOUCH_MSG = "אחרי נקודת המגע הסימן נשאר כמו לפניה. בדקו שוב את התחום שמימין לנקודת האפס.";
var EMPTY_NEG_MSG = "אין תחום שבו הגרף מתחת לציר ה־x. בשליליות כתבו אין.";

function near(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-6;
}

function num(value) {
  if (value === "-inf") return "−∞";
  if (value === "inf") return "∞";
  var n = Number(value);
  if (!isFinite(n)) return String(value);
  if (Math.abs(n - Math.round(n)) < 1e-8) return String(Math.round(n)).replace("-", "−");
  return String(Math.round(n * 1000) / 1000).replace("-", "−");
}

function sortedZeros(ex) {
  return (ex.zeros || [])
    .map(function (zero) {
      return { x: Number(zero.x), kind: zero.kind === "touch" ? "touch" : "cross" };
    })
    .sort(function (a, b) {
      return a.x - b.x;
    });
}

function intervalsFor(regions, property) {
  var out = [];
  (regions || []).forEach(function (region) {
    if (!region || region.property !== property) return;
    if (region.from === "-inf" && region.to === "inf") {
      out.push({ from: "-inf", to: "inf", all: true, empty: false, fromIncluded: false, toIncluded: false });
      return;
    }
    out.push({
      from: region.from === "-inf" ? "-inf" : Number(region.from),
      to: region.to === "inf" ? "inf" : Number(region.to),
      fromIncluded: false,
      toIncluded: false,
      empty: false,
      all: false,
    });
  });
  return out;
}

function formatSide(M, list) {
  if (!list || !list.length) return "אין";
  return M.formatIntervalSet(list);
}

function intervalWords(region) {
  return "(" + num(region.from) + ", " + num(region.to) + ")";
}

function readSide(M, text) {
  var raw = String(text == null ? "" : text).trim();
  if (!raw) return { missing: true, list: null };
  var list = M.parseRegionList(raw);
  if (list == null) return { bad: true, list: null };
  return { list: list };
}

function isAll(list) {
  return !!(list && list.length === 1 && (list[0].all || (list[0].from === "-inf" && list[0].to === "inf")));
}

function containsPoint(interval, x) {
  if (!interval || interval.empty) return false;
  if (interval.all || (interval.from === "-inf" && interval.to === "inf")) return true;
  var lo = interval.from === "-inf" ? -Infinity : Number(interval.from);
  var hi = interval.to === "inf" ? Infinity : Number(interval.to);
  if (x < lo - 1e-9 || x > hi + 1e-9) return false;
  if (near(x, lo) && !interval.fromIncluded) return false;
  if (near(x, hi) && !interval.toIncluded) return false;
  return true;
}

function hitsZero(list, zeros) {
  var i;
  var j;
  for (i = 0; i < zeros.length; i++) {
    for (j = 0; j < (list || []).length; j++) {
      if (containsPoint(list[j], zeros[i].x)) return true;
    }
  }
  return false;
}

function signAt(pos, neg, x) {
  var inPos = (pos || []).some(function (interval) {
    return containsPoint(interval, x);
  });
  var inNeg = (neg || []).some(function (interval) {
    return containsPoint(interval, x);
  });
  if (inPos && !inNeg) return "pos";
  if (inNeg && !inPos) return "neg";
  return "";
}

function sampleBeside(zeros, index, dir) {
  var x = zeros[index].x;
  if (dir < 0) {
    var prev = index > 0 ? zeros[index - 1].x : null;
    return prev == null ? x - 1 : (prev + x) / 2;
  }
  var next = index < zeros.length - 1 ? zeros[index + 1].x : null;
  return next == null ? x + 1 : (x + next) / 2;
}

function sideMismatch(pos, neg, zeros, kind, wantDifferent) {
  var i;
  for (i = 0; i < zeros.length; i++) {
    if (zeros[i].kind !== kind) continue;
    var left = signAt(pos, neg, sampleBeside(zeros, i, -1));
    var right = signAt(pos, neg, sampleBeside(zeros, i, 1));
    if (!left || !right) continue;
    if (wantDifferent ? left !== right : left === right) return true;
  }
  return false;
}

function regionPropertyAt(regions, x) {
  var i;
  for (i = 0; i < regions.length; i++) {
    var region = regions[i];
    var lo = region.from === "-inf" ? -Infinity : Number(region.from);
    var hi = region.to === "inf" ? Infinity : Number(region.to);
    if (x > lo + 1e-9 && x < hi - 1e-9) return region.property;
  }
  return "";
}

function misplacedDouble(list, property, regions, zeros) {
  var i;
  var j;
  for (i = 0; i < (list || []).length; i++) {
    var interval = list[i];
    if (interval.from === "-inf" || interval.to === "inf" || interval.all) continue;
    for (j = 0; j < zeros.length - 1; j++) {
      if (!near(interval.from, zeros[j].x) || !near(interval.to, zeros[j + 1].x)) continue;
      var mid = (zeros[j].x + zeros[j + 1].x) / 2;
      var got = regionPropertyAt(regions, mid);
      if (got && got !== property) return true;
    }
  }
  return false;
}

function flippedRay(list, property, regions, zeros) {
  if (!list || list.length !== 1 || !zeros.length) return false;
  var interval = list[0];
  if (interval.all || interval.empty) return false;
  if (interval.from === "-inf" && interval.to !== "inf") {
    var rightBound = Number(interval.to);
    if (!zeros.some(function (zero) { return near(zero.x, rightBound); })) return false;
    return regionPropertyAt(regions, rightBound - 1) !== property;
  }
  if (interval.to === "inf" && interval.from !== "-inf") {
    var leftBound = Number(interval.from);
    if (!zeros.some(function (zero) { return near(zero.x, leftBound); })) return false;
    return regionPropertyAt(regions, leftBound + 1) !== property;
  }
  return false;
}

function pointPhrase(zeros) {
  var bits = zeros.map(function (zero) { return "x=" + num(zero.x); });
  if (bits.length === 1) return "בנקודה " + bits[0];
  return "בנקודות " + bits.slice(0, -1).join(", ") + " ו־" + bits[bits.length - 1];
}

function allPositiveMessage(zeros) {
  return "הגרף אמנם אינו יורד מתחת לציר ה־x, אבל " + pointPhrase(zeros) + " מתקיים f(x)=0 ולא f(x)>0.";
}

function wrongAfterTouch(pos, neg, regions, zeros) {
  var i;
  for (i = 0; i < zeros.length; i++) {
    if (zeros[i].kind !== "touch") continue;
    var after = sampleBeside(zeros, i, 1);
    var got = signAt(pos, neg, after);
    if (!got) continue;
    var want = regionPropertyAt(regions, after);
    if (want && got !== want) return true;
  }
  return false;
}

function strayEnd(list, zeros) {
  var i;
  for (i = 0; i < (list || []).length; i++) {
    var interval = list[i];
    if (!interval || interval.all || interval.empty) continue;
    var ends = [interval.from, interval.to];
    var j;
    for (j = 0; j < ends.length; j++) {
      var end = ends[j];
      if (end === "-inf" || end === "inf") continue;
      if (!zeros.some(function (zero) { return near(zero.x, end); })) return true;
    }
  }
  return false;
}

function diagnose(M, ex, pos, neg) {
  var regions = ex.regions || [];
  var zeros = sortedZeros(ex);
  var expectedPos = intervalsFor(regions, "pos");
  var expectedNeg = intervalsFor(regions, "neg");
  if (M.sameIntervalSet(pos, expectedPos) && M.sameIntervalSet(neg, expectedNeg)) return { ok: true };
  if (zeros.length && isAll(pos) && regions.every(function (region) { return region.property === "pos"; })) {
    return { ok: false, errorId: "allRealsButHasZeros", message: allPositiveMessage(zeros) };
  }
  if (zeros.length && (isAll(pos) || isAll(neg))) return { ok: false, errorId: "allRealsButHasZero", message: ALL_MSG };
  if (hitsZero(pos, zeros)) return { ok: false, errorId: "zeroIncludedInPositive", message: ZERO_MSG };
  if (hitsZero(neg, zeros)) return { ok: false, errorId: "zeroIncludedInNegative", message: ZERO_MSG };
  if (M.sameIntervalSet(pos, expectedNeg) && M.sameIntervalSet(neg, expectedPos)) {
    return { ok: false, errorId: "positiveNegativeReversed", message: REVERSED_MSG };
  }
  if (sideMismatch(pos, neg, zeros, "touch", true)) return { ok: false, errorId: "touchingTreatedAsCrossing", message: TOUCH_MSG };
  if (sideMismatch(pos, neg, zeros, "cross", false)) return { ok: false, errorId: "crossingTreatedAsTouching", message: CROSS_MSG };
  if (wrongAfterTouch(pos, neg, regions, zeros)) return { ok: false, errorId: "wrongSignAfterTouch", message: AFTER_TOUCH_MSG };
  if (misplacedDouble(pos, "pos", regions, zeros) || misplacedDouble(neg, "neg", regions, zeros)) {
    return { ok: false, errorId: "wrongDoubleInterval", message: DOUBLE_MSG };
  }
  if (flippedRay(pos, "pos", regions, zeros) || flippedRay(neg, "neg", regions, zeros)) {
    return { ok: false, errorId: "boundaryDirectionError", message: BOUND_MSG };
  }
  if (!expectedNeg.length && neg.length) {
    return { ok: false, errorId: "emptyNegativeSetNotRecognized", message: EMPTY_NEG_MSG };
  }
  var posTake = M.takeRegions(pos, expectedPos);
  var negTake = M.takeRegions(neg, expectedNeg);
  if (posTake.partial) return { ok: false, errorId: "missingInterval", message: MISSING_POS_MSG };
  if (negTake.partial) return { ok: false, errorId: "missingInterval", message: MISSING_NEG_MSG };
  if ((!pos.length && expectedPos.length) || (!neg.length && expectedNeg.length)) {
    return { ok: false, errorId: "emptySetIncorrect", message: EMPTY_MSG };
  }
  if (strayEnd(pos, zeros) || strayEnd(neg, zeros)) return { ok: false, errorId: "splitAtExtremum", message: SPLIT_MSG };
  return { ok: false, errorId: "intervalMismatch", message: GENERIC_MSG };
}

function regionPhrase(region, zeros) {
  if (!zeros.length) return "לאורך כל ציר ה־x";
  if (region.from === "-inf") return "שמשמאל ל־x=" + num(zeros[0].x);
  if (region.to === "inf") return "שמימין ל־x=" + num(zeros[zeros.length - 1].x);
  return "שבין x=" + num(region.from) + " ל־x=" + num(region.to);
}

function regionIneq(region) {
  if (region.from === "-inf" && region.to === "inf") return "לכל x";
  if (region.from === "-inf") return "x<" + num(region.to);
  if (region.to === "inf") return "x>" + num(region.from);
  return num(region.from) + "<x<" + num(region.to);
}

function countPhrase(count) {
  var words = { 1: "תחום אחד", 2: "שני תחומים", 3: "שלושה תחומים", 4: "ארבעה תחומים", 5: "חמישה תחומים", 6: "שישה תחומים" };
  return words[count] || String(count) + " תחומים";
}

function splitLine(zeros) {
  if (!zeros.length) return "אין נקודות אפס מסומנות, אז ציר ה־x אינו מתחלק.";
  var names = zeros.map(function (zero) { return "x=" + num(zero.x); });
  var listed = names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " ו־" + names[names.length - 1];
  var verb = names.length === 1 ? "נקודת האפס היא " + listed + ". היא מחלקת" : "נקודות האפס הן " + listed + ". הן מחלקות";
  return verb + " את ציר ה־x ל" + countPhrase(zeros.length + 1) + ".";
}

function startsAtTouch(region, zeros) {
  return zeros.some(function (zero) {
    return zero.kind === "touch" && region.from !== "-inf" && near(Number(region.from), zero.x);
  });
}

function askRegion(region, zeros, index) {
  var ineq = regionIneq(region);
  if (startsAtTouch(region, zeros)) {
    return "מה קורה לאחר x=" + num(region.from) + "? שימו לב אם הגרף חוצה את הציר או רק נוגע בו.";
  }
  if (!zeros.length) return "בדקו לכל x: האם הגרף מעל או מתחת לציר ה־x?";
  if (index === 0) return "בדקו את הגרף עבור " + ineq + ".";
  return "עכשיו בדקו את התחום " + ineq + ".";
}

function coachState(progress) {
  var phase = progress && typeof progress.phase === "string" ? progress.phase : "split";
  return {
    phase: phase,
    region: progress && typeof progress.region === "number" ? progress.region : 0,
    told: progress && progress.told ? 1 : 0,
  };
}

function hintsFor(ex) {
  var zeros = sortedZeros(ex);
  var hints = [
    "הסתכלו על מיקום הגרף ביחס לציר ה־x.",
    "כאשר הגרף מעל ציר ה־x מתקיים f(x)>0, וכאשר הוא מתחת לציר ה־x מתקיים f(x)<0.",
  ];
  if (zeros.length) {
    hints.push("נקודות האפס מחלקות את ציר ה־x לתחומים. בדקו בכל תחום אם הגרף מעל או מתחת לציר.");
  }
  if (zeros.some(function (zero) { return zero.kind === "touch"; })) {
    hints.push("בדקו מה קורה לגרף משני צדי נקודת האפס. האם הוא עובר לצד השני של ציר ה־x?");
    hints.push("נגיעה בציר ה־x אינה מחייבת שינוי סימן.");
    hints.push("בדקו בנפרד את התחום שמשמאל לנקודת האפס ואת התחום שמימינה, וקבעו בכל אחד אם הגרף מעל או מתחת לציר.");
  }
  return hints;
}

function signTable(ex) {
  var zeros = sortedZeros(ex);
  var regions = ex.regions || [];
  var heads = [];
  var signs = [];
  regions.forEach(function (region, index) {
    heads.push(intervalWords(region));
    signs.push(region.property === "pos" ? "+" : "−");
    if (index < zeros.length) {
      heads.push(num(zeros[index].x));
      signs.push("0");
    }
  });
  return "x | " + heads.join(" | ") + " ; f(x) | " + signs.join(" | ");
}

function solutionOf(M, ex) {
  var zeros = sortedZeros(ex);
  var regions = ex.regions || [];
  var pos = intervalsFor(regions, "pos");
  var neg = intervalsFor(regions, "neg");
  var steps = [];
  if (!zeros.length) steps.push("אין נקודות אפס מסומנות על ציר ה־x.");
  else steps.push("נקודות האפס המסומנות: " + zeros.map(function (zero) { return "x=" + num(zero.x); }).join(", ") + ".");
  if (regions.length <= 1 && !zeros.length) steps.push("ציר ה־x אינו מתחלק לתחומים.");
  else steps.push("מחלקים את ציר ה־x לתחומים: " + regions.map(intervalWords).join(", ") + ".");
  steps.push(
    regions
      .map(function (region) {
        var where = zeros.length ? "בתחום " + intervalWords(region) : "לכל x";
        var side = region.property === "pos" ? "מעל" : "מתחת";
        return where + " הגרף נמצא " + side + " לציר ה־x";
      })
      .join(". ") + "."
  );
  steps.push("מסמנים + מעל הציר, − מתחת לציר, ו־0 בנקודות האפס: " + signTable(ex) + ".");
  steps.push("תחומי החיוביות: " + formatSide(M, pos) + ".");
  steps.push("תחומי השליליות: " + formatSide(M, neg) + ".");
  var notes = ["נקודת אפס אינה שייכת לחיוביות ולא לשליליות, כי שם f(x)=0."];
  if (zeros.some(function (zero) { return zero.kind === "touch"; })) {
    notes.push("בנקודת המגע הגרף חוזר לאותו צד של ציר ה־x, ולכן הסימן אינו מתחלף.");
  }
  return { steps: steps, notes: notes };
}

function columnRows(id, progress) {
  var saved = (progress && progress.rows && progress.rows[id]) || [];
  var done = progress && progress.sides && progress.sides[id];
  if (done && !saved.length) saved = [done];
  var rows = saved.map(function (value) {
    return { locked: true, value: value };
  });
  if (!done) {
    var typed = (progress && progress.openText && progress.openText[id]) || "";
    rows.push({ locked: false, value: typed });
  }
  if (!rows.length) rows.push({ locked: false, value: "" });
  return rows;
}

function viewFor(ex, progress) {
  var part = (ex.parts && ex.parts[0]) || {};
  var saved = (progress && progress.sides) || {};
  var posRows = columnRows("pos", progress);
  var negRows = columnRows("neg", progress);
  return {
    input: "domains",
    figure: ex.figure || null,
    domains: [
      { id: "pos", label: "חיובית", locked: !!saved.pos, value: saved.pos || "", rows: posRows },
      { id: "neg", label: "שלילית", locked: !!saved.neg, value: saved.neg || "", rows: negRows },
    ],
    part: { label: part.label || "", text: part.text || "" },
    focusKind: "sign",
  };
}

function payload(ex, extra) {
  var out = {
    ok: true,
    view: viewFor(ex, extra && extra.progress),
  };
  Object.keys(extra || {}).forEach(function (key) {
    out[key] = extra[key];
  });
  return out;
}

function carrySides(progress, next) {
  if (progress && progress.sides) next.sides = progress.sides;
  if (progress && progress.rows) next.rows = progress.rows;
  if (progress && progress.more) next.more = progress.more;
  if (progress && progress.openText) next.openText = progress.openText;
  return next;
}

function formatOne(M, interval) {
  return M.formatIntervalSet([interval]);
}

function oneStep(M, ex, progress) {
  var state = coachState(progress);
  var regions = ex.regions || [];
  var zeros = sortedZeros(ex);
  if (state.phase === "done") {
    var done = solutionOf(M, ex);
    return payload(ex, {
      solved: true,
      show: done.steps[done.steps.length - 2] + " " + done.steps[done.steps.length - 1],
      message: "אלה תחומי החיוביות ותחומי השליליות לפי הסקיצה.",
      progress: carrySides(progress, { phase: "done", region: regions.length, told: 0 }),
    });
  }
  if (state.phase === "split") {
    return payload(ex, {
      show: splitLine(zeros),
      message: "אחר כך בודקים כל תחום בנפרד, בלי לרשום עדיין את התשובה.",
      progress: carrySides(progress, { phase: "region", region: 0, told: 0 }),
    });
  }
  if (state.phase === "region") {
    var index = Math.min(state.region, Math.max(0, regions.length - 1));
    var next = index + 1;
    return payload(ex, {
      show: askRegion(regions[index], zeros, index),
      message: next < regions.length ? "אחר כך עוברים לתחום הבא." : "אחרי כל התחומים מרכזים את החיוביות ואת השליליות.",
      progress: carrySides(progress, { phase: next < regions.length ? "region" : "pos", region: next, told: 0 }),
    });
  }
  if (state.phase === "pos") {
    return payload(ex, {
      show: "חיובית: " + formatSide(M, intervalsFor(regions, "pos")) + ".",
      message: "אלה כל הקטעים שבהם הגרף מעל ציר ה־x. נקודות האפס אינן כלולות.",
      progress: carrySides(progress, { phase: "neg", region: regions.length, told: 0 }),
    });
  }
  return payload(ex, {
    solved: true,
    show: "שלילית: " + formatSide(M, intervalsFor(regions, "neg")) + ".",
    message: "אלה כל הקטעים שבהם הגרף מתחת לציר ה־x.",
    progress: carrySides(progress, { phase: "done", region: regions.length, told: 0 }),
  });
}

function sideName(id) {
  return id === "pos" ? "תחומי החיוביות" : "תחומי השליליות";
}

function judgeOne(M, ex, id, list) {
  var expected = intervalsFor(ex.regions, id);
  var otherId = id === "pos" ? "neg" : "pos";
  var other = intervalsFor(ex.regions, otherId);
  if (other.length && M.sameIntervalSet(list, other) && !M.sameIntervalSet(list, expected)) {
    return { errorId: "positiveNegativeReversed", message: REVERSED_MSG };
  }
  var judged = diagnose(M, ex, id === "pos" ? list : other, id === "neg" ? list : other);
  if (!judged.ok) return { errorId: judged.errorId, message: judged.message };
  return { errorId: "intervalMismatch", message: GENERIC_MSG };
}

function handle(engine, ex, body) {
  var M = engine.DoctematicaFnModel;
  var intent = String((body && body.intent) || "check");
  if (intent === "hint") {
    var hints = hintsFor(ex);
    return { ok: true, hint: hints[0], hints: hints, view: viewFor(ex) };
  }
  if (intent === "solution") {
    var solution = solutionOf(M, ex);
    return { ok: true, steps: solution.steps, notes: solution.notes, view: viewFor(ex) };
  }
  if (intent === "one-step" || intent === "step") return oneStep(M, ex, body && body.progress);
  var progress = (body && body.progress) || {};
  var held = {
    pos: (progress.sides && progress.sides.pos) || "",
    neg: (progress.sides && progress.sides.neg) || "",
  };
  var rows = {
    pos: (progress.rows && progress.rows.pos ? progress.rows.pos.slice() : []),
    neg: (progress.rows && progress.rows.neg ? progress.rows.neg.slice() : []),
  };
  var openText = { pos: "", neg: "" };
  var reads = {
    pos: readSide(M, body && body.domains && body.domains.pos),
    neg: readSide(M, body && body.domains && body.domains.neg),
  };
  var fresh = [];
  var grew = [];
  var wrong = [];
  var problem = null;
  function mergeSaved(id, list) {
    rows[id].forEach(function (text) {
      var parsed = M.parseRegionList(text);
      (parsed || []).forEach(function (interval) {
        if (!list.some(function (have) { return M.sameInterval(have, interval); })) list.push(interval);
      });
    });
    return list;
  }
  ["pos", "neg"].forEach(function (id) {
    if (held[id]) return;
    var read = reads[id];
    if (read.missing && !rows[id].length) return;
    if (read.bad) {
      if (!problem) problem = { errorId: "unparsedInterval", message: WRITE_MSG };
      return;
    }
    var list = mergeSaved(id, read.missing ? [] : (read.list || []).slice());
    var expected = intervalsFor(ex.regions, id);
    if (M.sameIntervalSet(list, expected)) {
      held[id] = formatSide(M, expected);
      rows[id] = expected.map(function (interval) { return formatOne(M, interval); });
      fresh.push(id);
      return;
    }
    var take = M.takeRegions(list, expected);
    if (take.matched.length && (take.partial || take.foreign)) {
      var matchedText = take.matched.map(function (interval) { return formatOne(M, interval); });
      if (matchedText.length > rows[id].length) grew.push(id);
      rows[id] = matchedText;
      if (take.foreign) {
        var foreign = list.filter(function (interval) {
          return !take.matched.some(function (hit) { return M.sameInterval(hit, interval); });
        });
        openText[id] = foreign.map(function (interval) { return formatOne(M, interval); }).join(" או ");
        if (!problem) {
          var piece = judgeOne(M, ex, id, list);
          problem = { errorId: piece.errorId, message: piece.message };
        }
      }
      return;
    }
    wrong.push(id);
    openText[id] = String((body && body.domains && body.domains[id]) || "");
  });
  function keptProgress() {
    var sides = {};
    if (held.pos) sides.pos = held.pos;
    if (held.neg) sides.neg = held.neg;
    var more = {};
    if (!held.pos && rows.pos.length) more.pos = true;
    if (!held.neg && rows.neg.length) more.neg = true;
    var typed = {};
    if (openText.pos) typed.pos = openText.pos;
    if (openText.neg) typed.neg = openText.neg;
    return {
      phase: progress.phase || "",
      region: typeof progress.region === "number" ? progress.region : 0,
      told: progress.told || 0,
      sides: sides,
      rows: { pos: rows.pos.slice(), neg: rows.neg.slice() },
      more: more,
      openText: typed,
    };
  }
  function moreLine(id) {
    var where = id === "pos" ? "בחיוביות" : "בשליליות";
    return "החלק שרשמתם נכון. יש עוד חלק " + where + ". רשמו אותו בשורה שנפתחה מתחת.";
  }
  if (problem && problem.errorId === "unparsedInterval" && !fresh.length && !grew.length) {
    return { ok: false, errorId: problem.errorId, message: problem.message };
  }
  var bothParsed = !!(reads.pos.list && reads.neg.list && !reads.pos.bad && !reads.neg.bad);
  var clean = !wrong.length && !openText.pos && !openText.neg && (grew.length || fresh.length);
  if (!clean && bothParsed) {
    var pair = diagnose(M, ex, reads.pos.list, reads.neg.list);
    if (!pair.ok) return { ok: false, errorId: pair.errorId, message: pair.message };
  }
  if (!clean && wrong.length && !bothParsed && !grew.length && !fresh.length) {
    var only = wrong[0];
    var single = judgeOne(M, ex, only, mergeSaved(only, (reads[only].list || []).slice()));
    return { ok: false, errorId: single.errorId, message: single.message };
  }
  if (!clean && problem && !grew.length && !fresh.length) return { ok: false, errorId: problem.errorId, message: problem.message };
  if (held.pos && held.neg) {
    return payload(ex, {
      solved: true,
      show: "חיובי: " + held.pos + ", שלילי: " + held.neg,
      message: "הגרף מעל ציר ה־x בתחומי החיוביות, ומתחת לציר ה־x בתחומי השליליות. נקודות האפס אינן כלולות.",
      progress: keptProgress(),
    });
  }
  if (!fresh.length && !grew.length && !held.pos && !held.neg && !rows.pos.length && !rows.neg.length) {
    return { ok: false, errorId: "missingSide", message: FILL_MSG };
  }
  var waiting = [];
  if (!held.pos && rows.pos.length) waiting.push("pos");
  if (!held.neg && rows.neg.length) waiting.push("neg");
  if (!fresh.length && !grew.length) {
    var remind = keptProgress();
    var remindId = waiting[0] || (held.pos ? "neg" : "pos");
    return {
      ok: false,
      errorId: waiting.length ? "missingInterval" : "missingSide",
      message: waiting.length ? "רשמו את החלק הנוסף בשורה שנפתחה." : "עכשיו רשמו את " + sideName(remindId) + ".",
      progress: remind,
      view: viewFor(ex, remind),
    };
  }
  var note = [];
  fresh.forEach(function (id) {
    note.push(sideName(id) + " נכונים.");
  });
  grew.forEach(function (id) {
    if (!held[id]) note.push(moreLine(id));
  });
  if (!note.length) {
    var openId = held.pos ? "neg" : "pos";
    note.push("עכשיו רשמו את " + sideName(openId) + ".");
  }
  var advanced = {
    message: note.join(" "),
    progress: keptProgress(),
  };
  if (problem) {
    advanced.ok = false;
    advanced.errorId = problem.errorId;
    advanced.message = problem.message;
    advanced.view = viewFor(ex, advanced.progress);
    return advanced;
  }
  return payload(ex, advanced);
}

function readSidePair(M, domains) {
  domains = domains || {};
  var pos = readSide(M, domains.pos);
  var neg = readSide(M, domains.neg);
  if (pos.missing || neg.missing) return { missing: true };
  if (pos.bad || neg.bad) return { bad: true };
  return { pos: pos.list, neg: neg.list };
}

function openingView(engine, ex) {
  return viewFor(ex);
}

module.exports = {
  handle: handle,
  openingView: openingView,
  intervalsFor: intervalsFor,
  diagnose: diagnose,
};
