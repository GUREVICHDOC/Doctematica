"use strict";

var signGraph = require("./sign-graph");

// Extrema and monotonicity read off a graph.
// Intervals reuse DoctematicaFnModel (the same parser as sign graphs).
// The property here is inc / dec. An extremum is the boundary, not part of either side.
// MIN / MAX come from the change of direction, not from which point sits lower on the screen.

var TYPE_MSG = "כדי לקבוע את סוג הקיצון, בדקו מה קורה לפונקציה לפני הנקודה ואחריה.";
var PLACE_OK_MSG = "המיקום שמצאתם נכון. בדקו האם הגרף עובר מעלייה לירידה או מירידה לעלייה בנקודה הזו.";
var SWAP_TYPE_MSG = "השיעורים נכונים, אבל מינימום ומקסימום התחלפו. בדקו את כיוון הגרף לפני כל נקודה ואחריה.";
var X_MSG = "שיעור ה־x אינו מתאים לנקודת קיצון בסקיצה.";
var POINT_MSG = "הנקודה אינה נקודת הקיצון המסומנת. בדקו את שני השיעורים.";
var MISSING_MSG = "יש עוד נקודת קיצון בסקיצה. רשמו גם אותה.";
var EXTRA_MSG = "יש כאן נקודה שאינה נקודת קיצון בסקיצה.";
var EMPTY_MSG = "רשמו את נקודת הקיצון ואת סוגה: מינימום או מקסימום.";
var UNKNOWN_TYPE_MSG = "כתבו מינימום או מקסימום.";
var Y_MSG = "תחומי עלייה וירידה נרשמים לפי ערכי x.";
var POS_MSG = "עלייה אינה אומרת שהפונקציה חיובית. בדקו האם ערך y גדל כאשר מתקדמים ימינה.";
var NEG_MSG = "פונקציה יכולה להיות שלילית ועדיין לעלות. כאן בודקים את כיוון התנועה של הגרף משמאל לימין.";
var OPEN_MSG = "נקודת הקיצון היא הגבול בין התחומים ואינה חלק מתחום העלייה או הירידה כאן.";
var CROSS_MSG = "התחום חוצה נקודת קיצון. חלקו את ציר ה־x בנקודות הקיצון.";
var BOUND_MSG = "הגבול של התחום אינו שיעור ה־x של נקודת קיצון.";
var SWAP_SIDE_MSG = "עלייה וירידה התחלפו. בדקו את כיוון הגרף משמאל לימין.";
var WRITE_MSG = "כתבו תחום, למשל x < 3 או 1 < x < 4. אם אין תחום, כתבו אין.";
var FILL_MSG = "רשמו את תחומי העלייה ואת תחומי הירידה. אם אין תחום, כתבו אין.";
var EXTRA_INTERVAL_MSG = "יש תחום שאינו תואם את כיוון הגרף. בדקו שוב כל קטע בין נקודות הקיצון.";
var OUTER_MSG = "מצאתם את התחומים שבין נקודות הקיצון. בדקו גם מה קורה לגרף לפני נקודת הקיצון הראשונה ואחרי האחרונה.";
var FLAT_MSG = "בדקו האם הפונקציה באמת משנה כיוון. כל עוד היא ממשיכה לעלות כאשר מתקדמים משמאל לימין, אין שם מעבר מעלייה לירידה.";
var SAME_Y_MSG = "לשתי נקודות יש אותו ערך y, אבל תחומי העלייה והירידה נקבעים לפי x. בין שתי הנקודות האלה הכיוון אינו אחיד.";
var ZERO_AS_MONO_MSG = "נקודת אפס אומרת ש־f(x)=0, אבל היא לא בהכרח משנה את כיוון הפונקציה. לתחומי עלייה וירידה חפשו שינוי בכיוון הגרף.";
var EXTREMUM_AS_SIGN_MSG = "לחיוביות ולשליליות חשוב המיקום של הגרף ביחס לציר ה־x. נקודת קיצון אינה בהכרח נקודת אפס.";
var TOUCH_ASSUMED_MSG = "בדקו האם הגרף באמת עובר לצד השני של ציר ה־x בנקודת האפס, או רק נוגע בציר וחוזר לאותו צד.";
var APPROACH_MSG = "הגרף מתקרב לציר ה־x אבל אינו חותך אותו. אין כאן נקודת אפס.";
var DECREASE_SIGN_MSG = "ירידה מתארת את כיוון הגרף, לא את הסימן שלו. גם בזמן שהפונקציה יורדת היא יכולה להישאר מעל ציר ה־x.";

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

function normalizeExtremumType(input) {
  var t = String(input == null ? "" : input)
    .trim()
    .toLowerCase()
    .replace(/[.\s_\-'"׳״`]/g, "");
  if (!t) return "UNKNOWN";
  if (/^(min|minimum|localmin|מינ|מין|מינימום|מינימלית|מינימוםמקומי|נקודתמינימום|נקמינימום)$/.test(t)) return "MIN";
  if (/^(max|maximum|localmax|מקס|מקסימום|מקסימלית|מקסימוםמקומי|נקודתמקסימום|נקמקסימום)$/.test(t)) return "MAX";
  return "UNKNOWN";
}

function typeCode(pt) {
  var raw = pt && pt.type;
  if (raw === "MAX" || raw === "max") return "MAX";
  if (raw === "MIN" || raw === "min") return "MIN";
  return normalizeExtremumType(raw);
}

function typeWord(code) {
  return code === "MAX" ? "מקסימום" : "מינימום";
}

function sortedExtrema(ex) {
  return (ex.extrema || []).slice().sort(function (a, b) {
    return Number(a.x) - Number(b.x);
  });
}

function parseNum(text) {
  var t = String(text == null ? "" : text).trim().replace(/[−–—]/g, "-").replace(/\s+/g, "");
  if (!t) return null;
  var frac = t.match(/^([+-]?\d+)\/(\d+)$/);
  if (frac) {
    var den = Number(frac[2]);
    if (!den) return null;
    return Number(frac[1]) / den;
  }
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(t)) return null;
  var n = Number(t);
  return isFinite(n) ? n : null;
}

function intervalsFor(regions, property) {
  var out = [];
  (regions || []).forEach(function (region) {
    if (!region || region.property !== property) return;
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

function formatOne(M, interval) {
  return M.formatIntervalSet([interval]);
}

function pairTable(leftKey, leftValues, rightKey, rightValues) {
  return leftKey + ": " + (leftValues || []).join(" או ") + ", " + rightKey + ": " + (rightValues || []).join(" או ");
}

function sideName(id) {
  return id === "inc" ? "תחומי העלייה" : "תחומי הירידה";
}

function placeText(pt, yKnown) {
  if (!yKnown || pt.y == null) return "x=" + num(pt.x);
  return "(" + num(pt.x) + "," + num(pt.y) + ")";
}

function formatFound(ex, found) {
  return (found || [])
    .slice()
    .sort(function (a, b) { return Number(a.x) - Number(b.x); })
    .map(function (pt) {
      return typeWord(typeCode(pt)) + ": " + placeText(pt, ex.yKnown);
    })
    .join(". ");
}

function samePlace(card, pt, yKnown) {
  if (card.x == null || !near(card.x, pt.x)) return false;
  if (!yKnown) return true;
  return card.y != null && near(card.y, pt.y);
}

function alreadyFound(found, pt) {
  return (found || []).some(function (item) {
    return near(item.x, pt.x);
  });
}

function readCards(body) {
  var list = body && body.extrema;
  if (!Array.isArray(list)) return [];
  return list.map(function (card) {
    return {
      x: parseNum(card && card.x),
      y: parseNum(card && card.y),
      type: normalizeExtremumType(card && card.type),
      typed: String((card && card.type) || "").trim(),
      rawX: String((card && card.x) || "").trim(),
    };
  });
}

function wordIssue(text) {
  var raw = String(text || "");
  if (/(?:^|[^a-z])y\s*[<>=≤≥]|[<>=≤≥]\s*y/i.test(raw)) {
    return { errorId: "usedYInsteadOfXForInterval", message: Y_MSG };
  }
  if (/חיובי|מעל\s+ל?ציר/.test(raw)) {
    return { errorId: "positiveConfusedWithIncreasing", message: POS_MSG };
  }
  if (/שלילי|מתחת\s+ל?ציר/.test(raw)) {
    return { errorId: "negativeConfusedWithDecreasing", message: NEG_MSG };
  }
  return null;
}

function closesExtremum(list, extrema) {
  return (list || []).some(function (interval) {
    return (extrema || []).some(function (pt) {
      return (interval.fromIncluded && near(interval.from, pt.x)) || (interval.toIncluded && near(interval.to, pt.x));
    });
  });
}

function opened(list) {
  return (list || []).map(function (interval) {
    return {
      from: interval.from,
      to: interval.to,
      fromIncluded: false,
      toIncluded: false,
      empty: !!interval.empty,
      all: !!interval.all,
      point: false,
    };
  });
}

function inventedExtremum(ex, list) {
  if ((ex.extrema || []).length) return false;
  return (list || []).some(function (interval) {
    if (!interval || interval.empty) return false;
    if (interval.all || (interval.from === "-inf" && interval.to === "inf")) return false;
    return true;
  });
}

function sameHeightSpan(ex, list) {
  var pts = sortedExtrema(ex);
  var i;
  var j;
  for (i = 0; i < pts.length; i++) {
    for (j = i + 1; j < pts.length; j++) {
      if (pts[i].y == null || pts[j].y == null || !near(pts[i].y, pts[j].y)) continue;
      if (j === i + 1) continue;
      if ((list || []).some(function (interval) {
        return near(Number(interval.from), pts[i].x) && near(Number(interval.to), pts[j].x);
      })) return true;
    }
  }
  return false;
}

function regionInterval(region) {
  return {
    from: region.from === "-inf" ? "-inf" : Number(region.from),
    to: region.to === "inf" ? "inf" : Number(region.to),
    fromIncluded: false,
    toIncluded: false,
    empty: false,
    all: region.from === "-inf" && region.to === "inf",
  };
}

function rowsCover(M, rows, interval) {
  var found = false;
  (rows || []).forEach(function (text) {
    var list = M.parseRegionList(text);
    (list || []).forEach(function (item) {
      if (M.sameInterval(item, interval)) found = true;
    });
  });
  return found;
}

function missedOuter(M, ex, rows) {
  var regions = ex.regions || [];
  if (sortedExtrema(ex).length < 1) return false;
  var inners = regions.filter(function (region) { return region.from !== "-inf" && region.to !== "inf"; });
  var outers = regions.filter(function (region) { return region.from === "-inf" || region.to === "inf"; });
  if (!inners.length || !outers.length) return false;
  var inc = (rows && rows.inc) || [];
  var dec = (rows && rows.dec) || [];
  function covered(region) {
    return rowsCover(M, region.property === "inc" ? inc : dec, regionInterval(region));
  }
  return inners.every(covered) && outers.some(function (region) { return !covered(region); });
}

function stamp(ex, progress, issue) {
  progress = progress || {};
  var rows = progress.rows || { inc: [], dec: [] };
  var done = (rows.inc || []).length + (rows.dec || []).length;
  progress.increasingIntervals = (rows.inc || []).slice();
  progress.decreasingIntervals = (rows.dec || []).slice();
  progress.correctIncreasingIntervals = (rows.inc || []).slice();
  progress.correctDecreasingIntervals = (rows.dec || []).slice();
  progress.positiveIntervals = ((progress.signRows && progress.signRows.pos) || []).slice();
  progress.negativeIntervals = ((progress.signRows && progress.signRows.neg) || []).slice();
  progress.monotonicityComplete = !!(progress.sides && progress.sides.inc && progress.sides.dec);
  progress.signComplete = !!(progress.signSides && progress.signSides.pos && progress.signSides.neg);
  progress.currentPart = progress.phase === "sign" ? "ב" : "א";
  progress.completedRegions = done;
  progress.currentRegion = done;
  progress.hintLevel = progress.step || progress.signStep || 0;
  progress.validationIssues = issue ? [issue] : (progress.validationIssues || []);
  progress.isComplete = ex && ex.monoThenSign ? progress.signComplete : progress.monotonicityComplete;
  return progress;
}

function crossesExtremum(list, extrema) {
  return (list || []).some(function (interval) {
    var lo = interval.from === "-inf" ? -Infinity : Number(interval.from);
    var hi = interval.to === "inf" ? Infinity : Number(interval.to);
    return (extrema || []).some(function (pt) {
      return Number(pt.x) > lo + 1e-9 && Number(pt.x) < hi - 1e-9;
    });
  });
}

function sideLeft(ex, x) {
  var hit = null;
  (ex.regions || []).forEach(function (region) {
    var to = region.to === "inf" ? Infinity : Number(region.to);
    if (near(to, x)) hit = region.property;
  });
  return hit;
}

function sideRight(ex, x) {
  var hit = null;
  (ex.regions || []).forEach(function (region) {
    var from = region.from === "-inf" ? -Infinity : Number(region.from);
    if (near(from, x)) hit = region.property;
  });
  return hit;
}

function directionWord(property) {
  return property === "inc" ? "עולה" : "יורדת";
}

function regionWords(M, region) {
  return formatOne(M, {
    from: region.from === "-inf" ? "-inf" : Number(region.from),
    to: region.to === "inf" ? "inf" : Number(region.to),
    fromIncluded: false,
    toIncluded: false,
    empty: false,
    all: false,
  });
}

function whyExtremum(ex, pt) {
  var left = sideLeft(ex, pt.x);
  var right = sideRight(ex, pt.x);
  var where = placeText(pt, ex.yKnown);
  if (left === "dec" && right === "inc") {
    return "הפונקציה יורדת לפני " + where + " ועולה אחריה, ולכן שם נמצאת נקודת מינימום.";
  }
  if (left === "inc" && right === "dec") {
    return "הפונקציה עולה לפני " + where + " ויורדת אחריה, ולכן שם נמצאת נקודת מקסימום.";
  }
  return "ב־" + where + " כיוון הגרף מתחלף.";
}

function splitLine(ex) {
  var xs = sortedExtrema(ex).map(function (pt) { return "x=" + num(pt.x); });
  if (!xs.length) return "עברו על הגרף משמאל לימין ובדקו אם הכיוון מתחלף באיזשהו מקום.";
  if (xs.length === 1) return "חלקו את ציר ה־x לפי " + xs[0] + ".";
  return "חלקו את ציר ה־x לפי " + xs.join(" ו־") + ".";
}

function phaseOf(ex, progress) {
  if (ex && ex.monoThenSign) return progress && progress.phase === "sign" ? "sign" : "domains";
  if (ex && ex.intervalsOnly) return "domains";
  if (progress && progress.phase === "domains") return "domains";
  return "extrema";
}

function loneZeros(ex) {
  var extrema = sortedExtrema(ex).map(function (pt) { return Number(pt.x); });
  return (ex.zeros || []).map(function (zero) { return Number(zero.x); }).filter(function (x) {
    return !extrema.some(function (other) { return near(other, x); });
  });
}

function loneExtrema(ex) {
  var zeros = (ex.zeros || []).map(function (zero) { return Number(zero.x); });
  return sortedExtrema(ex).map(function (pt) { return Number(pt.x); }).filter(function (x) {
    return !zeros.some(function (other) { return near(other, x); });
  });
}

function endpointHits(list, xs) {
  return (list || []).some(function (interval) {
    if (!interval || interval.all || interval.empty) return false;
    return xs.some(function (x) {
      return (interval.from !== "-inf" && near(interval.from, x)) || (interval.to !== "inf" && near(interval.to, x));
    });
  });
}

function foundLine(ex, progress) {
  var found = (progress && progress.found) || [];
  if (!found.length) return "";
  return "כבר מצאתם " + formatFound(ex, found) + ".";
}

function hintsFor(ex, progress) {
  var phase = phaseOf(ex, progress);
  if (phase === "sign") return signHints(ex, progress);
  if (phase === "extrema") {
    if (progress && progress.issue === "type") {
      return [
        PLACE_OK_MSG,
        "יורדת ואז עולה: מינימום. עולה ואז יורדת: מקסימום.",
      ];
    }
    var found = (progress && progress.found) || [];
    var first = found.length
      ? "יש עוד נקודת קיצון. חפשו מקום נוסף שבו הגרף משנה כיוון."
      : "חפשו מקום שבו התנהגות הגרף משתנה מעלייה לירידה או מירידה לעלייה.";
    return [
      first,
      "אם הפונקציה יורדת לפני הנקודה ועולה אחריה, איזה סוג קיצון מתקבל?",
      "יורדת ואז עולה: מינימום. עולה ואז יורדת: מקסימום.",
    ];
  }
  var rows = (progress && progress.rows) || {};
  var locked = []
    .concat(rows.inc || [])
    .concat(rows.dec || []);
  if (locked.length) {
    return [
      remainSentence(ex, progress),
      focusAsk(ex, progress),
    ];
  }
  var second = sortedExtrema(ex).length
    ? "נקודות הקיצון מחלקות את הגרף לתחומי העלייה והירידה."
    : "בדקו אם הגרף משנה כיוון באיזשהו מקום, או שהוא ממשיך באותו כיוון לכל x.";
  return [
    "עברו על הגרף משמאל לימין ובדקו היכן הוא עולה והיכן הוא יורד.",
    second,
    focusAsk(ex, progress),
  ];
}

function describedRegion(region) {
  if (region.from === "-inf" && region.to === "inf") return "כל x";
  if (region.from === "-inf") return "x < " + num(region.to);
  if (region.to === "inf") return "x > " + num(region.from);
  return num(region.from) + " < x < " + num(region.to);
}

function regionPhrase(region) {
  if (region.from === "-inf" && region.to === "inf") return "לכל אורך הגרף";
  if (region.from === "-inf") return "משמאל ל־x=" + num(region.to);
  if (region.to === "inf") return "מימין ל־x=" + num(region.from);
  return "בין x=" + num(region.from) + " ל־x=" + num(region.to);
}

function focusAsk(ex, progress) {
  var rows = (progress && progress.rows) || {};
  var regions = ex.regions || [];
  var i;
  for (i = 0; i < regions.length; i++) {
    var text = describedRegion(regions[i]);
    var have = rows[regions[i].property] || [];
    if (have.indexOf(text) >= 0) continue;
    if ((progress.sides || {})[regions[i].property]) continue;
    return "בדקו מה קורה " + regionPhrase(regions[i]) + ". כאשר x גדל, האם ערך הפונקציה עולה או יורד?";
  }
  return "בדקו את הקטע שעוד לא רשמתם.";
}

function remainSentence(ex, progress) {
  var M = null;
  var rows = (progress && progress.rows) || {};
  var heldInc = rows.inc || [];
  var heldDec = rows.dec || [];
  var bits = [];
  if (heldInc.length) bits.push("בעלייה כבר רשום חלק נכון");
  if (heldDec.length) bits.push("בירידה כבר רשום חלק נכון");
  var xs = sortedExtrema(ex).map(function (pt) { return num(pt.x); });
  var tail = xs.length === 1
    ? "נשאר לבדוק מה קורה משמאל ל־x=" + xs[0] + " ומימין ל־x=" + xs[0] + "."
    : "נשאר לבדוק מה קורה משמאל ל־x=" + xs[0] + ", בין נקודות הקיצון, ומימין ל־x=" + xs[xs.length - 1] + ".";
  if (!bits.length) return tail;
  return bits.join(", ") + ". " + tail;
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

function extremumCards(ex, progress) {
  var found = (progress && progress.found) || [];
  return sortedExtrema(ex).map(function (pt, index) {
    var hit = found.filter(function (item) { return near(item.x, pt.x); })[0];
    return {
      id: String(index),
      yKnown: !!ex.yKnown,
      locked: !!hit,
      x: hit ? num(hit.x) : "",
      y: hit && ex.yKnown ? num(hit.y) : "",
      type: hit ? typeWord(typeCode(hit)) : "",
    };
  });
}

function partFor(ex, phase) {
  if (ex.intervalsOnly) return null;
  if (ex.monoThenSign) {
    var item = (ex.parts || [])[phase === "sign" ? 1 : 0] || {};
    return { label: item.label || (phase === "sign" ? "ב" : "א"), text: item.text || "" };
  }
  var part = (ex.parts && ex.parts[phase === "domains" ? 1 : 0]) || {};
  return { label: part.label || (phase === "domains" ? "ב" : "א"), text: part.text || "" };
}

function viewFor(ex, progress) {
  var phase = phaseOf(ex, progress);
  var part = partFor(ex, phase);
  var base = {
    figure: ex.figure || null,
    part: part,
    focusKind: phase === "sign" ? "sign" : phase === "domains" ? "mono" : (progress && progress.issue === "type" ? "extrema-type" : "extrema"),
  };
  if (phase === "sign") {
    var signSaved = (progress && progress.signSides) || {};
    var signProgress = {
      sides: signSaved,
      rows: (progress && progress.signRows) || { pos: [], neg: [] },
      openText: (progress && progress.signOpen) || {},
    };
    base.input = "domains";
    base.domains = [
      { id: "pos", label: "חיובית", locked: !!signSaved.pos, value: signSaved.pos || "", rows: columnRows("pos", signProgress) },
      { id: "neg", label: "שלילית", locked: !!signSaved.neg, value: signSaved.neg || "", rows: columnRows("neg", signProgress) },
    ];
    return base;
  }
  if (phase === "domains") {
    var saved = (progress && progress.sides) || {};
    base.input = "domains";
    base.domains = [
      { id: "inc", label: "עלייה", locked: !!saved.inc, value: saved.inc || "", rows: columnRows("inc", progress) },
      { id: "dec", label: "ירידה", locked: !!saved.dec, value: saved.dec || "", rows: columnRows("dec", progress) },
    ];
    return base;
  }
  base.input = "extrema";
  base.extrema = extremumCards(ex, progress);
  return base;
}

function payload(ex, extra) {
  if (extra && extra.progress) extra.progress = stamp(ex, extra.progress);
  var out = { ok: true, view: viewFor(ex, extra && extra.progress) };
  Object.keys(extra || {}).forEach(function (key) {
    if (key === "progress") return;
    out[key] = extra[key];
  });
  if (extra && extra.progress) out.progress = extra.progress;
  out.view = viewFor(ex, extra && extra.progress);
  return out;
}

function carry(progress, next) {
  if (!Object.prototype.hasOwnProperty.call(next, "found")) next.found = (progress && progress.found) || [];
  if (!Object.prototype.hasOwnProperty.call(next, "sides")) next.sides = (progress && progress.sides) || {};
  if (!Object.prototype.hasOwnProperty.call(next, "rows")) next.rows = (progress && progress.rows) || { inc: [], dec: [] };
  if (!Object.prototype.hasOwnProperty.call(next, "openText")) next.openText = (progress && progress.openText) || {};
  return next;
}

function readSide(M, text) {
  var raw = String(text == null ? "" : text).trim();
  if (!raw) return { missing: true, list: null };
  var words = wordIssue(raw);
  if (words) return { bad: true, words: words, list: null };
  var list = M.parseRegionList(raw);
  if (list == null) return { bad: true, list: null };
  return { list: list };
}

function signHints(ex, progress) {
  var rows = (progress && progress.signRows) || {};
  var locked = [].concat(rows.pos || []).concat(rows.neg || []);
  var touched = (ex.zeros || []).some(function (zero) { return zero.kind === "touch"; });
  if (locked.length) {
    return [
      "התחום שרשמתם נכון. בדקו את האזור שעוד לא סווג ביחס לציר ה־x.",
      touched
        ? "בדקו האם הגרף באמת עובר לצד השני של ציר ה־x בנקודת האפס, או רק נוגע בציר וחוזר לאותו צד."
        : "נקודות האפס מחלקות את ציר ה־x לתחומים שאותם כדאי לבדוק.",
    ];
  }
  var hints = [
    "בדקו היכן הגרף נמצא מעל ציר ה־x והיכן הוא נמצא מתחת לציר ה־x.",
    "נקודות האפס מחלקות את ציר ה־x לתחומים שאותם כדאי לבדוק.",
  ];
  if (touched) hints.push("בדקו האם הגרף באמת עובר לצד השני של ציר ה־x בנקודת האפס, או רק נוגע בציר וחוזר לאותו צד.");
  if (!(ex.zeros || []).length) hints[1] = "בדקו אם הגרף באמת פוגש את ציר ה־x, או רק מתקרב אליו.";
  return hints;
}

function judgeSide(M, ex, id, list) {
  if (endpointHits(list, loneZeros(ex))) {
    return { errorId: "zeroUsedAsMonotonicityBoundary", message: ZERO_AS_MONO_MSG };
  }
  var expected = intervalsFor(ex.regions, id);
  var otherId = id === "inc" ? "dec" : "inc";
  var other = intervalsFor(ex.regions, otherId);
  if (other.length && M.sameIntervalSet(list, other) && !M.sameIntervalSet(list, expected)) {
    return { errorId: "increasingDecreasingSwapped", message: SWAP_SIDE_MSG };
  }
  if (inventedExtremum(ex, list)) {
    return { errorId: "falseExtremumFromFlatAppearance", message: FLAT_MSG };
  }
  if (sameHeightSpan(ex, list)) {
    return { errorId: "sameYMeansSameInterval", message: SAME_Y_MSG };
  }
  if (M.sameIntervalSet(opened(list), expected) && !M.sameIntervalSet(list, expected) && closesExtremum(list, ex.extrema)) {
    return { errorId: "includedExtremumInOpenInterval", message: OPEN_MSG };
  }
  if (crossesExtremum(list, ex.extrema)) {
    return { errorId: "intervalCrossesExtremum", message: CROSS_MSG };
  }
  var take = M.takeRegions(list, expected);
  if (take.foreign && take.matched.length < list.length) {
    return { errorId: "extraMonotonicInterval", message: EXTRA_INTERVAL_MSG };
  }
  if (!take.matched.length) return { errorId: "wrongIntervalBoundary", message: BOUND_MSG };
  return { errorId: "missingMonotonicInterval", message: "יש עוד תחום. בדקו את הקטע שעוד לא רשמתם." };
}

function checkExtrema(ex, body, progress) {
  var found = ((progress && progress.found) || []).slice();
  var cards = readCards(body).filter(function (card) {
    return card.rawX || card.typed || card.y != null;
  });
  var fresh = cards.filter(function (card) {
    return !found.some(function (pt) { return card.x != null && near(card.x, pt.x); });
  });
  if (!fresh.length && !found.length) {
    return { ok: false, errorId: "missingExtremum", message: EMPTY_MSG, progress: progress || { phase: "extrema", found: [] } };
  }
  if (!fresh.length && found.length < sortedExtrema(ex).length) {
    return {
      ok: false,
      errorId: "missingExtremum",
      message: MISSING_MSG,
      progress: { phase: "extrema", found: found, issue: "" },
    };
  }
  var expectedAll = sortedExtrema(ex);
  if (expectedAll.length >= 2 && fresh.length >= expectedAll.length && expectedAll.every(function (pt) {
    var card = fresh.filter(function (item) { return samePlace(item, pt, ex.yKnown); })[0];
    return card && card.type !== "UNKNOWN" && card.type !== typeCode(pt);
  })) {
    return {
      ok: false,
      errorId: "minMaxSwapped",
      message: SWAP_TYPE_MSG,
      progress: { phase: "extrema", found: (progress && progress.found) || [], issue: "type" },
    };
  }
  var remaining = expectedAll.filter(function (pt) { return !alreadyFound(found, pt); });
  var used = [];
  var problem = null;
  var placed = null;
  fresh.forEach(function (card) {
    if (problem) return;
    if (card.x == null) {
      problem = { errorId: "wrongExtremumX", message: X_MSG };
      return;
    }
    var match = null;
    remaining.forEach(function (pt, index) {
      if (used[index] || match) return;
      if (near(card.x, pt.x)) match = { pt: pt, index: index };
    });
    if (!match) {
      if (found.length >= sortedExtrema(ex).length) {
        problem = { errorId: "extraExtremum", message: EXTRA_MSG };
        return;
      }
      var yHit = ex.yKnown && remaining.some(function (pt) { return card.y != null && near(card.y, pt.y) && !near(card.x, pt.x); });
      problem = yHit
        ? { errorId: "wrongExtremumPoint", message: POINT_MSG }
        : { errorId: card.y != null && ex.yKnown ? "wrongExtremumPoint" : "wrongExtremumX", message: card.y != null && ex.yKnown ? POINT_MSG : X_MSG };
      return;
    }
    if (ex.yKnown && (card.y == null || !near(card.y, match.pt.y))) {
      problem = { errorId: "wrongExtremumPoint", message: POINT_MSG };
      return;
    }
    if (!card.typed) {
      problem = { errorId: "wrongExtremumType", message: UNKNOWN_TYPE_MSG };
      placed = match.pt;
      return;
    }
    if (card.type === "UNKNOWN") {
      problem = { errorId: "wrongExtremumType", message: UNKNOWN_TYPE_MSG };
      return;
    }
    if (card.type !== typeCode(match.pt)) {
      problem = { errorId: "extremumChosenByHeightOnly", message: TYPE_MSG };
      placed = match.pt;
      return;
    }
    used[match.index] = true;
    found.push({ x: match.pt.x, y: ex.yKnown ? match.pt.y : null, type: match.pt.type });
  });
  var unmatched = fresh.filter(function (card) {
    return card.x != null && !remaining.some(function (pt) { return near(card.x, pt.x); }) && !found.some(function (pt) { return near(card.x, pt.x); });
  });
  if (!problem && unmatched.length) problem = { errorId: "extraExtremum", message: EXTRA_MSG };
  if (problem) {
    return {
      ok: false,
      errorId: problem.errorId,
      message: problem.errorId === "extremumChosenByHeightOnly" ? TYPE_MSG : problem.message,
      progress: {
        phase: "extrema",
        found: found,
        issue: problem.errorId === "extremumChosenByHeightOnly" || placed ? "type" : "",
      },
    };
  }
  if (found.length < sortedExtrema(ex).length) {
    return {
      ok: false,
      errorId: "missingExtremum",
      message: "הנקודה שרשמתם נכונה. " + MISSING_MSG,
      progress: { phase: "extrema", found: found, issue: "" },
    };
  }
  return {
    ok: true,
    show: formatFound(ex, found),
    message: "סיווגתם את נקודות הקיצון לפי שינוי הכיוון. עכשיו חלקו את ציר ה־x לפי שיעורי ה־x שלהן.",
    progress: { phase: "domains", found: found, issue: "", sides: {}, rows: { inc: [], dec: [] }, openText: {}, step: 0 },
  };
}

function checkDomains(M, ex, body, progress) {
  var held = {
    inc: (progress.sides && progress.sides.inc) || "",
    dec: (progress.sides && progress.sides.dec) || "",
  };
  var rows = {
    inc: progress.rows && progress.rows.inc ? progress.rows.inc.slice() : [],
    dec: progress.rows && progress.rows.dec ? progress.rows.dec.slice() : [],
  };
  var openText = { inc: "", dec: "" };
  var reads = {
    inc: readSide(M, body && body.domains && body.domains.inc),
    dec: readSide(M, body && body.domains && body.domains.dec),
  };
  var fresh = [];
  var grew = [];
  var wrong = [];
  var problem = null;
  ["inc", "dec"].forEach(function (id) {
    var read = reads[id];
    if (read.words && !problem) problem = read.words;
  });
  if (problem) {
    return { ok: false, errorId: problem.errorId, message: problem.message, progress: progress };
  }
  function mergeSaved(id, list) {
    rows[id].forEach(function (text) {
      var parsed = M.parseRegionList(text);
      (parsed || []).forEach(function (interval) {
        if (!list.some(function (have) { return M.sameInterval(have, interval); })) list.push(interval);
      });
    });
    return list;
  }
  function lockSide(sideId) {
    if (held[sideId]) return;
    var expectedSide = intervalsFor(ex.regions, sideId);
    if (!expectedSide.length) return;
    var covered = expectedSide.every(function (interval) {
      return rows[sideId].indexOf(formatOne(M, interval)) >= 0;
    });
    if (!covered) return;
    held[sideId] = formatSide(M, expectedSide);
    rows[sideId] = expectedSide.map(function (interval) { return formatOne(M, interval); });
    if (fresh.indexOf(sideId) < 0) fresh.push(sideId);
  }
  ["inc", "dec"].forEach(function (id) {
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
        var otherId = id === "inc" ? "dec" : "inc";
        var otherExpected = intervalsFor(ex.regions, otherId);
        var stay = [];
        list.filter(function (interval) {
          return !take.matched.some(function (hit) { return M.sameInterval(hit, interval); });
        }).forEach(function (interval) {
          var placed = M.takeRegions([interval], otherExpected);
          if (placed.matched.length && !placed.foreign) {
            var text = formatOne(M, placed.matched[0]);
            if (!held[otherId] && rows[otherId].indexOf(text) < 0) {
              rows[otherId].push(text);
              if (grew.indexOf(otherId) < 0) grew.push(otherId);
            }
            return;
          }
          stay.push(interval);
        });
        lockSide("inc");
        lockSide("dec");
        if (stay.length) {
          openText[id] = stay.map(function (interval) { return formatOne(M, interval); }).join(" או ");
          if (!problem) problem = judgeSide(M, ex, id, list);
        }
      } else {
        lockSide(id);
      }
      return;
    }
    if (list.length && sameHeightSpan(ex, list)) {
      problem = { errorId: "sameYMeansSameInterval", message: SAME_Y_MSG };
      openText[id] = String((body && body.domains && body.domains[id]) || "");
      return;
    }
    if (list.length && inventedExtremum(ex, list)) {
      problem = { errorId: "falseExtremumFromFlatAppearance", message: FLAT_MSG };
      openText[id] = String((body && body.domains && body.domains[id]) || "");
      return;
    }
    if (list.length && closesExtremum(list, ex.extrema) && M.sameIntervalSet(opened(list), expected)) {
      problem = { errorId: "includedExtremumInOpenInterval", message: OPEN_MSG };
      openText[id] = String((body && body.domains && body.domains[id]) || "");
      return;
    }
    if (list.length && crossesExtremum(list, ex.extrema)) {
      problem = { errorId: "intervalCrossesExtremum", message: CROSS_MSG };
      wrong.push(id);
      openText[id] = String((body && body.domains && body.domains[id]) || "");
      return;
    }
    wrong.push(id);
    openText[id] = String((body && body.domains && body.domains[id]) || "");
  });
  function keptProgress() {
    var sides = {};
    if (held.inc) sides.inc = held.inc;
    if (held.dec) sides.dec = held.dec;
    var typed = {};
    if (openText.inc) typed.inc = openText.inc;
    if (openText.dec) typed.dec = openText.dec;
    return {
      phase: "domains",
      found: (progress.found || []).slice(),
      issue: "",
      step: progress.step || 0,
      sides: sides,
      rows: { inc: rows.inc.slice(), dec: rows.dec.slice() },
      openText: typed,
    };
  }
  if (problem && problem.errorId === "unparsedInterval" && !fresh.length && !grew.length) {
    return { ok: false, errorId: problem.errorId, message: problem.message, progress: keptProgress() };
  }
  var bothParsed = !!(reads.inc.list && reads.dec.list && !reads.inc.bad && !reads.dec.bad);
  if (bothParsed) {
    var expectInc = intervalsFor(ex.regions, "inc");
    var expectDec = intervalsFor(ex.regions, "dec");
    if (M.sameIntervalSet(reads.inc.list, expectDec) && M.sameIntervalSet(reads.dec.list, expectInc)) {
      return { ok: false, errorId: "increasingDecreasingSwapped", message: SWAP_SIDE_MSG, progress: keptProgress() };
    }
  }
  var clean = !wrong.length && !openText.inc && !openText.dec && (grew.length || fresh.length);
  if (!clean && bothParsed && !fresh.length && !grew.length) {
    var pairInc = judgeSide(M, ex, "inc", reads.inc.list);
    var pairDec = judgeSide(M, ex, "dec", reads.dec.list);
    var pair = pairInc.errorId === "missingMonotonicInterval" ? pairDec : pairInc;
    return { ok: false, errorId: pair.errorId, message: pair.message, progress: keptProgress() };
  }
  if (!clean && wrong.length && !bothParsed && !grew.length && !fresh.length) {
    var only = wrong[0];
    var single = judgeSide(M, ex, only, mergeSaved(only, (reads[only].list || []).slice()));
    return { ok: false, errorId: single.errorId, message: single.message, progress: keptProgress() };
  }
  if (!clean && problem && !grew.length && !fresh.length) {
    return { ok: false, errorId: problem.errorId, message: problem.message, progress: keptProgress() };
  }
  if (held.inc && held.dec) return finishMono(ex, held, rows, progress);
  if (!fresh.length && !grew.length && !held.inc && !held.dec && !rows.inc.length && !rows.dec.length) {
    return { ok: false, errorId: "missingMonotonicInterval", message: FILL_MSG, progress: keptProgress() };
  }
  if (missedOuter(M, ex, rows)) {
    return { ok: false, errorId: "missedOuterInterval", message: OUTER_MSG, progress: keptProgress() };
  }
  var note = [];
  fresh.forEach(function (id) { note.push(sideName(id) + " נכונים."); });
  grew.forEach(function (id) {
    if (!held[id]) note.push("החלק שרשמתם נכון. יש עוד תחום " + (id === "inc" ? "בעלייה" : "בירידה") + ". רשמו אותו בשורה שנפתחה מתחת.");
  });
  if (!note.length) {
    var openId = held.inc ? "dec" : "inc";
    note.push("עכשיו רשמו את " + sideName(openId) + ".");
  }
  var advanced = keptProgress();
  if (problem) {
    return { ok: false, errorId: problem.errorId, message: problem.message, progress: advanced };
  }
  return { ok: true, message: note.join(" "), progress: advanced };
}

function finishMono(ex, held, rows, progress) {
  var next = {
    phase: ex.monoThenSign ? "sign" : "domains",
    found: ((progress && progress.found) || []).slice(),
    issue: "",
    step: 0,
    sides: { inc: held.inc, dec: held.dec },
    rows: { inc: rows.inc.slice(), dec: rows.dec.slice() },
    openText: {},
    monotonicityComplete: true,
    signSides: (progress && progress.signSides) || {},
    signRows: (progress && progress.signRows) || { pos: [], neg: [] },
    signOpen: {},
    signStep: 0,
  };
  var show = "עולה: " + held.inc + ", יורדת: " + held.dec;
  var parallel = {
    parallel: [
      { label: "תחומי עלייה", steps: (rows.inc || []).slice() },
      { label: "תחומי ירידה", steps: (rows.dec || []).slice() },
    ],
  };
  if (ex.monoThenSign) {
    return {
      ok: true,
      show: show,
      parallel: parallel,
      message: "אלה תחומי העלייה והירידה לפי נקודות הקיצון. עכשיו בדקו היכן הגרף מעל ציר ה־x והיכן מתחתיו.",
      progress: next,
    };
  }
  return {
    ok: true,
    solved: true,
    show: show,
    parallel: parallel,
    message: sortedExtrema(ex).length
      ? "אלה תחומי העלייה והירידה לפי כיוון הגרף. נקודות הקיצון הן הגבול בין התחומים."
      : "הגרף עולה לכל x, ואין תחום שבו הוא יורד.",
    progress: next,
  };
}

function signBundle(progress, extra) {
  var next = {
    phase: "sign",
    found: ((progress && progress.found) || []).slice(),
    sides: (progress && progress.sides) || {},
    rows: (progress && progress.rows) || { inc: [], dec: [] },
    monotonicityComplete: true,
    signSides: extra.sides || {},
    signRows: extra.rows || { pos: [], neg: [] },
    signOpen: extra.open || {},
    signStep: extra.step || 0,
    step: (progress && progress.step) || 0,
  };
  return next;
}

function signIssue(M, ex, pos, neg) {
  var signEx = { regions: ex.signRegions || [], zeros: ex.zeros || [] };
  var expectedPos = intervalsFor(ex.signRegions, "pos");
  var expectedNeg = intervalsFor(ex.signRegions, "neg");
  if (!(ex.zeros || []).length && inventedExtremum({ extrema: [] }, (pos || []).concat(neg || []))) {
    return { errorId: "approachingAxisAssumedZero", message: APPROACH_MSG };
  }
  if (endpointHits((pos || []).concat(neg || []), loneExtrema(ex))) {
    return { errorId: "extremumUsedAsSignBoundary", message: EXTREMUM_AS_SIGN_MSG };
  }
  var monoDec = intervalsFor(ex.regions, "dec");
  var monoInc = intervalsFor(ex.regions, "inc");
  if (neg && neg.length && monoDec.length && M.sameIntervalSet(neg, monoDec) && !M.sameIntervalSet(neg, expectedNeg)) {
    return { errorId: "negativeConfusedWithDecreasing", message: DECREASE_SIGN_MSG };
  }
  if (pos && pos.length && monoInc.length && M.sameIntervalSet(pos, monoInc) && !M.sameIntervalSet(pos, expectedPos)) {
    return { errorId: "positiveConfusedWithIncreasing", message: POS_MSG };
  }
  var judged = signGraph.diagnose(M, signEx, pos || [], neg || []);
  if (judged.ok) return null;
  if (judged.errorId === "touchingTreatedAsCrossing") return { errorId: "touchingZeroAssumedCrossing", message: TOUCH_ASSUMED_MSG };
  if (judged.errorId === "zeroIncludedInPositive") return { errorId: "includedZeroInPositiveInterval", message: judged.message };
  if (judged.errorId === "zeroIncludedInNegative") return { errorId: "includedZeroInNegativeInterval", message: judged.message };
  if (judged.errorId === "splitAtExtremum") return { errorId: "extremumUsedAsSignBoundary", message: EXTREMUM_AS_SIGN_MSG };
  if (judged.errorId === "intervalMismatch" || judged.errorId === "boundaryDirectionError" || judged.errorId === "wrongDoubleInterval") {
    return { errorId: "wrongIntervalBoundary", message: judged.message };
  }
  return judged;
}

function checkSign(M, ex, body, progress) {
  progress = progress || {};
  var held = {
    pos: (progress.signSides && progress.signSides.pos) || "",
    neg: (progress.signSides && progress.signSides.neg) || "",
  };
  var rows = {
    pos: progress.signRows && progress.signRows.pos ? progress.signRows.pos.slice() : [],
    neg: progress.signRows && progress.signRows.neg ? progress.signRows.neg.slice() : [],
  };
  var openText = { pos: "", neg: "" };
  var reads = {
    pos: readSide(M, body && body.domains && body.domains.pos),
    neg: readSide(M, body && body.domains && body.domains.neg),
  };
  var fresh = [];
  var grew = [];
  var problem = null;
  function pack(step) {
    return signBundle(progress, { sides: held, rows: rows, open: openText, step: step == null ? progress.signStep || 0 : step });
  }
  ["pos", "neg"].forEach(function (id) {
    if (reads[id].words && !problem) problem = reads[id].words;
  });
  if (problem) return { ok: false, errorId: problem.errorId, message: problem.message, progress: pack() };
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
    var expected = intervalsFor(ex.signRegions, id);
    if (M.sameIntervalSet(list, expected)) {
      held[id] = formatSide(M, expected);
      rows[id] = expected.map(function (interval) { return formatOne(M, interval); });
      fresh.push(id);
      return;
    }
    var take = M.takeRegions(list, expected);
    if (take.matched.length && (take.partial || take.foreign)) {
      rows[id] = take.matched.map(function (interval) { return formatOne(M, interval); });
      if (rows[id].length) grew.push(id);
      if (take.foreign && !problem) {
        problem = signIssue(M, ex, id === "pos" ? list : intervalsFor(ex.signRegions, "pos"), id === "neg" ? list : intervalsFor(ex.signRegions, "neg"));
      }
      return;
    }
    if (!problem) problem = signIssue(M, ex, id === "pos" ? list : [], id === "neg" ? list : []);
  });
  if (reads.pos.list && reads.neg.list) {
    var both = signIssue(M, ex, reads.pos.list, reads.neg.list);
    if (both && !fresh.length && !grew.length) problem = both;
  }
  if (held.pos && held.neg) {
    return {
      ok: true,
      solved: true,
      show: "חיובי: " + held.pos + ", שלילי: " + held.neg,
      message: "אלה תחומי החיוביות והשליליות לפי מיקום הגרף ביחס לציר ה־x. נקודת אפס אינה חלק מהתחום.",
      progress: pack(),
    };
  }
  if (problem && !fresh.length && !grew.length) {
    return { ok: false, errorId: problem.errorId, message: problem.message, progress: pack() };
  }
  if (!fresh.length && !grew.length && !held.pos && !held.neg && !rows.pos.length && !rows.neg.length) {
    return { ok: false, errorId: "missingInterval", message: "רשמו את תחומי החיוביות ואת תחומי השליליות. אם אין תחום, כתבו אין.", progress: pack() };
  }
  if (problem) return { ok: false, errorId: problem.errorId, message: problem.message, progress: pack() };
  var note = [];
  fresh.forEach(function (id) { note.push((id === "pos" ? "תחומי החיוביות" : "תחומי השליליות") + " נכונים."); });
  grew.forEach(function (id) { note.push("החלק שרשמתם נכון. יש עוד תחום " + (id === "pos" ? "בחיוביות" : "בשליליות") + "."); });
  if (!note.length) note.push("המשיכו לתחום שעוד חסר.");
  return { ok: true, message: note.join(" "), progress: pack() };
}

function signOneStep(M, ex, progress) {
  var step = progress.signStep || 0;
  var touched = (ex.zeros || []).some(function (zero) { return zero.kind === "touch"; });
  if (step < 1 && !((progress.signRows && progress.signRows.pos) || []).length && !((progress.signRows && progress.signRows.neg) || []).length) {
    return payload(ex, {
      show: touched
        ? "בדקו היכן הגרף מעל ציר ה־x והיכן מתחתיו. בנקודת מגע בדקו אם הסימן באמת מתחלף."
        : "בדקו היכן הגרף מעל ציר ה־x והיכן מתחתיו.",
      message: "הגבולות כאן הם נקודות האפס, לא נקודות הקיצון.",
      progress: signBundle(progress, { step: 1 }),
    });
  }
  var rows = {
    pos: ((progress.signRows && progress.signRows.pos) || []).slice(),
    neg: ((progress.signRows && progress.signRows.neg) || []).slice(),
  };
  var pending = [];
  ["pos", "neg"].forEach(function (id) {
    if (progress.signSides && progress.signSides[id]) return;
    intervalsFor(ex.signRegions, id).forEach(function (interval) {
      var text = formatOne(M, interval);
      if (rows[id].indexOf(text) >= 0) return;
      pending.push({ id: id, text: text });
    });
  });
  if (!pending.length) {
    var pos = formatSide(M, intervalsFor(ex.signRegions, "pos"));
    var neg = formatSide(M, intervalsFor(ex.signRegions, "neg"));
    return payload(ex, {
      solved: true,
      show: "חיובי: " + pos + ", שלילי: " + neg,
      message: "אלה תחומי החיוביות והשליליות.",
      progress: signBundle(progress, {
        sides: { pos: pos, neg: neg },
        rows: {
          pos: intervalsFor(ex.signRegions, "pos").map(function (interval) { return formatOne(M, interval); }),
          neg: intervalsFor(ex.signRegions, "neg").map(function (interval) { return formatOne(M, interval); }),
        },
        step: 2,
      }),
    });
  }
  var piece = pending[0];
  rows[piece.id].push(piece.text);
  var expected = intervalsFor(ex.signRegions, piece.id);
  var sides = Object.assign({}, progress.signSides || {});
  if (rows[piece.id].length >= expected.length) sides[piece.id] = formatSide(M, expected);
  if (sides.pos && sides.neg) {
    return payload(ex, {
      solved: true,
      show: pairTable("חיובי", rows.pos, "שלילי", rows.neg),
      message: "אלה תחומי החיוביות והשליליות לפי נקודות האפס.",
      progress: signBundle(progress, { sides: sides, rows: rows, step: 2 }),
    });
  }
  return payload(ex, {
    show: pairTable("חיובי", rows.pos, "שלילי", rows.neg),
    message: "אחר כך בודקים את האזור הבא ביחס לציר ה־x.",
    progress: signBundle(progress, { sides: sides, rows: rows, step: 1 }),
  });
}

function nextMissing(ex, found) {
  return sortedExtrema(ex).filter(function (pt) { return !alreadyFound(found, pt); })[0] || null;
}

function oneStep(M, ex, progress) {
  progress = progress || {};
  if ((ex.intervalsOnly || ex.monoThenSign) && progress.phase !== "sign") {
    progress.phase = "domains";
    progress.rows = progress.rows || { inc: [], dec: [] };
    progress.sides = progress.sides || {};
  }
  if (ex.monoThenSign && progress.phase === "sign") return signOneStep(M, ex, progress);
  if (!ex.intervalsOnly && !ex.monoThenSign && progress.phase !== "domains") {
    var found = (progress.found || []).slice();
    var step = progress.step || 0;
    var next = nextMissing(ex, found);
    if (progress.issue === "type" && step < 1) {
      return payload(ex, {
        show: PLACE_OK_MSG,
        message: "אחר כך רשמו מינימום או מקסימום לפי הכיוון.",
        progress: { phase: "extrema", found: found, issue: "type", step: 1 },
      });
    }
    if (!next) {
      return payload(ex, {
        show: splitLine(ex),
        message: "אחר כך בודקים כל קטע בנפרד.",
        progress: { phase: "domains", found: found, sides: {}, rows: { inc: [], dec: [] }, openText: {}, step: 1 },
      });
    }
    if (step < 1) {
      return payload(ex, {
        show: "הנקודה הבאה מסומנת ב־" + placeText(next, ex.yKnown) + ". קבעו אם היא מינימום או מקסימום.",
        message: "הסוג נקבע לפי מה שקורה לגרף לפני הנקודה ואחריה.",
        progress: { phase: "extrema", found: found, issue: "", step: 1 },
      });
    }
    found.push({ x: next.x, y: ex.yKnown ? next.y : null, type: next.type });
    var more = nextMissing(ex, found);
    if (more) {
      return payload(ex, {
        show: typeWord(typeCode(next)) + ": " + placeText(next, ex.yKnown),
        message: whyExtremum(ex, next) + " נשארה עוד נקודת קיצון.",
        progress: { phase: "extrema", found: found, issue: "", step: 0 },
      });
    }
    return payload(ex, {
      show: formatFound(ex, found),
      message: whyExtremum(ex, next) + " " + splitLine(ex),
      progress: { phase: "domains", found: found, issue: "", sides: {}, rows: { inc: [], dec: [] }, openText: {}, step: 1 },
    });
  }
  var domainStep = progress.step || 0;
  if (!sortedExtrema(ex).length && domainStep < 2) {
    if (domainStep < 1) {
      return payload(ex, {
        show: splitLine(ex),
        message: "אם אין מעבר מעלייה לירידה, אין נקודת קיצון.",
        progress: carry(progress, { phase: "domains", step: 1 }),
      });
    }
    return payload(ex, {
      show: "גם במקום שבו הגרף נראה שטוח יותר, בדקו אם הוא ממשיך לעלות.",
      message: "שינוי בשיפוע אינו נקודת קיצון.",
      progress: carry(progress, { phase: "domains", step: 2 }),
    });
  }
  if (domainStep < 1) {
    var intro = foundLine(ex, progress);
    return payload(ex, {
      show: splitLine(ex),
      message: (intro ? intro + " " : "") + "בדקו כל קטע בין הגבולות האלה.",
      progress: carry(progress, { phase: "domains", step: 1 }),
    });
  }
  var pending = [];
  ["inc", "dec"].forEach(function (id) {
    var have = (progress.rows && progress.rows[id]) || [];
    intervalsFor(ex.regions, id).forEach(function (interval) {
      var text = formatOne(M, interval);
      if (have.indexOf(text) >= 0) return;
      if (progress.sides && progress.sides[id]) return;
      pending.push({ id: id, interval: interval, text: text });
    });
  });
  if (!pending.length) {
    var incDone = formatSide(M, intervalsFor(ex.regions, "inc"));
    var decDone = formatSide(M, intervalsFor(ex.regions, "dec"));
    var doneRows = {
      inc: intervalsFor(ex.regions, "inc").map(function (interval) { return formatOne(M, interval); }),
      dec: intervalsFor(ex.regions, "dec").map(function (interval) { return formatOne(M, interval); }),
    };
    return payload(ex, finishMono(ex, { inc: incDone, dec: decDone }, doneRows, progress));
  }
  var piece = pending[0];
  var rows = {
    inc: ((progress.rows && progress.rows.inc) || []).slice(),
    dec: ((progress.rows && progress.rows.dec) || []).slice(),
  };
  rows[piece.id].push(piece.text);
  var expected = intervalsFor(ex.regions, piece.id);
  var doneSide = rows[piece.id].length >= expected.length;
  var sides = Object.assign({}, progress.sides || {});
  if (doneSide) sides[piece.id] = formatSide(M, expected);
  var both = sides.inc && sides.dec;
  var region = (ex.regions || []).filter(function (item) {
    var from = item.from === "-inf" ? "-inf" : Number(item.from);
    var to = item.to === "inf" ? "inf" : Number(item.to);
    return String(from) === String(piece.interval.from) && String(to) === String(piece.interval.to) && item.property === piece.id;
  })[0];
  var told = region
    ? "בתחום " + regionWords(M, region) + " הפונקציה " + directionWord(region.property) + "."
    : piece.text;
  if (both) {
    var finished = finishMono(ex, sides, rows, progress);
    finished.show = pairTable("עולה", rows.inc, "יורדת", rows.dec);
    finished.message = told + " " + (finished.message || "");
    return payload(ex, finished);
  }
  return payload(ex, {
    show: pairTable("עולה", rows.inc, "יורדת", rows.dec),
    message: told + " " + remainSentence(ex, { rows: rows }),
    progress: carry(progress, { phase: "domains", step: 1, sides: sides, rows: rows, openText: {} }),
  });
}

function solutionOf(M, ex) {
  var steps = [];
  var xs = sortedExtrema(ex);
  if (!xs.length) {
    steps.push("אין נקודה שבה הגרף עובר מעלייה לירידה או מירידה לעלייה.");
    steps.push("גם במקום שבו הגרף נראה שטוח יותר, הוא ממשיך לעלות כאשר מתקדמים ימינה.");
  } else if (ex.intervalsOnly) {
    steps.push("נקודות הקיצון מחלקות את ציר ה־x לפי " + xs.map(function (pt) { return num(pt.x); }).join(", ") + ".");
    steps.push("עוברים על הגרף משמאל לימין.");
  } else {
    steps.push("עוברים על הגרף משמאל לימין, ומחפשים היכן הכיוון מתחלף.");
  }
  (ex.regions || []).forEach(function (region) {
    steps.push("בתחום " + regionWords(M, region) + " הפונקציה " + directionWord(region.property) + ".");
  });
  if (!ex.intervalsOnly && !ex.monoThenSign) {
    xs.forEach(function (pt) {
      steps.push(whyExtremum(ex, pt));
    });
  }
  steps.push({
    parallel: [
      { label: "תחומי עלייה", steps: [formatSide(M, intervalsFor(ex.regions, "inc"))] },
      { label: "תחומי ירידה", steps: [formatSide(M, intervalsFor(ex.regions, "dec"))] },
    ],
    explain: "עלייה וירידה הם שני חלקים של אותה קריאה מהגרף.",
  });
  if (ex.monoThenSign) {
    var zeros = (ex.zeros || []).slice().sort(function (a, b) { return a.x - b.x; });
    steps.push("חיוביות ושליליות: בודקים היכן הגרף מעל ציר ה־x והיכן מתחתיו.");
    if (!zeros.length) steps.push("הגרף אינו חותך את ציר ה־x, גם אם הוא מתקרב אליו. אין נקודת אפס.");
    else steps.push("מחלקים לפי נקודות האפס: " + zeros.map(function (zero) { return "x=" + num(zero.x); }).join(", ") + ".");
    if (zeros.some(function (zero) { return zero.kind === "touch"; })) {
      steps.push("בנקודת המגע הגרף חוזר לאותו צד של ציר ה־x, ולכן הסימן אינו מתחלף.");
    }
    (ex.signRegions || []).forEach(function (region) {
      var where = region.property === "pos" ? "מעל" : "מתחת";
      steps.push("בתחום " + regionWords(M, region) + " הגרף נמצא " + where + " לציר ה־x.");
    });
  steps.push({
    parallel: [
      { label: "תחומי חיוביות", steps: [formatSide(M, intervalsFor(ex.signRegions, "pos"))] },
      { label: "תחומי שליליות", steps: [formatSide(M, intervalsFor(ex.signRegions, "neg"))] },
    ],
    explain: "חיוביות ושליליות הם שני חלקים של אותה קריאה מהגרף.",
  });
  }
  return {
    steps: steps,
    notes: [ex.monoThenSign
      ? "עלייה וירידה נקבעות לפי נקודות הקיצון. חיוביות ושליליות נקבעות לפי נקודות האפס."
      : xs.length
        ? "נקודת הקיצון היא הגבול בין התחומים, והיא אינה כלולה בתחום העלייה או הירידה."
        : "שינוי בשיפוע או בקעירות אינו נקודת קיצון, כל עוד הכיוון לא מתחלף."],
  };
}

function handle(engine, ex, body) {
  var M = engine.DoctematicaFnModel;
  var intent = String((body && body.intent) || "check");
  var progress = (body && body.progress) || {};
  if (intent === "hint") {
    var hints = hintsFor(ex, progress);
    return { ok: true, hint: hints[0], hints: hints, view: viewFor(ex, progress) };
  }
  if (intent === "solution") {
    var solution = solutionOf(M, ex);
    return { ok: true, steps: solution.steps, notes: solution.notes, view: viewFor(ex, progress) };
  }
  if (intent === "one-step" || intent === "step") return oneStep(M, ex, progress);
  var phase = phaseOf(ex, progress);
  var result = phase === "sign"
    ? checkSign(M, ex, body, progress)
    : phase === "domains"
      ? checkDomains(M, ex, body, progress)
      : checkExtrema(ex, body, progress);
  if (!result.ok) {
    var stamped = stamp(ex, result.progress || {}, result.errorId);
    return {
      ok: false,
      errorId: result.errorId,
      message: result.message,
      progress: stamped,
      view: viewFor(ex, stamped),
    };
  }
  return payload(ex, result);
}

function openingView(engine, ex) {
  return viewFor(ex, {});
}

module.exports = {
  handle: handle,
  openingView: openingView,
  normalizeExtremumType: normalizeExtremumType,
  sideLeft: sideLeft,
  sideRight: sideRight,
};
