"use strict";

var Symbols = require("./freq-symbols");
var Balance = require("./freq-balance");
var Pie = require("./pie-chart");
var OPS = { gt: true, lt: true, gte: true, lte: true, eq: true, in: true, between: true };

function sum(nums) {
  var total = 0;
  var i;
  for (i = 0; i < nums.length; i++) total += nums[i];
  return total;
}

function sameNum(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-9;
}

function formatInt(n) {
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return String(n);
}

function normText(value) {
  return String(value == null ? "" : value)
    .replace(/["״«»]/g, "")
    .replace(/['׳]/g, "")
    .replace(/[.\u05c3:：]+/g, " ")
    .replace(/[־–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function valueKey(value) {
  var text = normText(value).replace(/^יום\s+/, "");
  return text;
}

function parseNumber(value) {
  var text = String(value == null ? "" : value).trim().replace(/\s+/g, "").replace(",", ".");
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return null;
  var n = Number(text);
  return isFinite(n) ? n : null;
}

function sameObservation(row, item) {
  if (row.num != null) {
    var num = typeof item === "number" && isFinite(item) ? item : parseNumber(item);
    return num != null && sameNum(row.num, num);
  }
  return valueKey(item) === row.key;
}

function observeValue(value) {
  var num = null;
  if (typeof value === "number" && isFinite(value)) num = value;
  else if (parseNumber(value) != null && String(value).trim() !== "") num = parseNumber(value);
  return { value: num != null ? num : value, key: valueKey(value), num: num };
}

function rowsFromObservations(data, entries) {
  var rows = [];
  function add(value, freq) {
    var seen = observeValue(value);
    var existing = null;
    var i;
    for (i = 0; i < rows.length; i++) {
      if (rows[i].key === seen.key || (seen.num != null && rows[i].num != null && sameNum(rows[i].num, seen.num))) {
        existing = rows[i];
        break;
      }
    }
    if (existing) {
      existing.freq += freq;
      return;
    }
    rows.push({
      value: seen.value,
      key: seen.key,
      num: seen.num,
      freq: freq,
      index: rows.length,
    });
  }
  if (entries && entries.length) {
    entries.forEach(function (item) { add(item.value, Number(item.count) || 0); });
    return rows;
  }
  (data || []).forEach(function (item) { add(item, 1); });
  return rows;
}

function compileTable(table, dataList, entries) {
  table = table || {};
  var variable = table.variable || {};
  var frequency = table.frequency || {};
  var build = !!table.build;
  var data = Array.isArray(dataList) ? dataList.slice() : null;
  var rows = build ? rowsFromObservations(data, entries) : (table.rows || []).map(function (row, index) {
    var value = row.value;
    var num = null;
    if (typeof value === "number" && isFinite(value)) num = value;
    else if (parseNumber(value) != null && String(value).trim() !== "") num = parseNumber(value);
    var rawFreq = row.freq;
    var givenExpr = "";
    var freq = null;
    if (typeof rawFreq === "string" && /[A-Za-z]/.test(rawFreq)) givenExpr = rawFreq.replace(/\s+/g, "");
    else if (rawFreq != null && rawFreq !== "") {
      freq = Number(rawFreq);
      if (!isFinite(freq)) freq = null;
    }
    return {
      value: value,
      key: valueKey(value),
      num: num,
      freq: freq,
      givenExpr: givenExpr,
      missing: !!givenExpr || (freq == null && !build),
      index: index,
    };
  });
  var scale = variable.scale;
  if (scale !== "qualitative" && scale !== "quantitative" && scale !== "discrete" && scale !== "continuous") {
    var numeric = rows.length && rows.every(function (row) { return row.num != null; });
    var fractional = numeric && rows.some(function (row) {
      return !sameNum(row.num, Math.round(row.num));
    });
    scale = !numeric ? "qualitative" : fractional ? "continuous" : "discrete";
  }
  var fill = !build && !!(data && data.length && rows.length);
  if (fill) {
    rows.forEach(function (row) {
      var count = 0;
      data.forEach(function (item) {
        if (sameObservation(row, item)) count += 1;
      });
      row.freq = count;
      row.missing = false;
    });
  }
  var quantitative = scale !== "qualitative";
  var ordered = rows.slice().sort(function (a, b) {
    if (quantitative && a.num != null && b.num != null && !sameNum(a.num, b.num)) return a.num - b.num;
    return a.index - b.index;
  });
  return {
    variableLabel: variable.label || "",
    frequencyLabel: frequency.label || "",
    scale: scale,
    rows: rows,
    ordered: ordered,
    data: build && !(data && data.length) ? null : data,
    fill: fill,
    build: build,
    quantitative: quantitative,
    population: table.population == null || table.population === "" ? null : Number(table.population),
    ratios: Array.isArray(table.ratios) ? table.ratios : [],
    givenRelative: table.givenRelative || null,
    columnOrder: quantitative ? "asc" : "given",
  };
}

function compileChart(chart) {
  chart = chart || {};
  var compiled = compileTable({
    variable: { label: chart.xLabel || "" },
    frequency: { label: chart.yLabel || "" },
    rows: (chart.rows || []).map(function (row) {
      return { value: row.value, freq: row.freq };
    }),
  }, null, null);
  var maxFreq = 0;
  compiled.rows.forEach(function (row) {
    if (Number(row.freq) > maxFreq) maxFreq = Number(row.freq);
  });
  var yStep = Number(chart.yStep) || 1;
  var yMax = chart.yMax != null ? Number(chart.yMax) : Math.max(yStep, Math.ceil(maxFreq / yStep) * yStep);
  compiled.chartSource = true;
  compiled.chart = {
    xLabel: compiled.variableLabel,
    yLabel: compiled.frequencyLabel,
    yStep: yStep,
    yMax: yMax,
    grid: chart.grid !== false,
    bars: (compiled.ordered || compiled.rows).map(function (row) {
      return { value: displayValue(row), freq: row.freq };
    }),
  };
  return compiled;
}

function compileExercise(ex) {
  if (ex && ex.chart) return compileChart(ex.chart);
  return compileTable(ex && ex.table, ex && ex.data, ex && ex.entries);
}

function displayRows(compiled) {
  return ((compiled && (compiled.ordered || compiled.rows)) || []).slice();
}

function findRow(rows, value) {
  var key = valueKey(value);
  var num = parseNumber(value);
  var i;
  for (i = 0; i < rows.length; i++) {
    if (rows[i].key === key) return rows[i];
    if (num != null && rows[i].num != null && sameNum(rows[i].num, num)) return rows[i];
  }
  return null;
}

function compareOp(left, where) {
  if (left == null || !where || !OPS[where.op]) return false;
  if (where.op === "in") {
    return (where.values || []).some(function (item) {
      var num = parseNumber(item);
      if (num == null) return valueKey(item) === valueKey(left);
      return sameNum(left, num);
    });
  }
  if (where.op === "between") {
    var low = Number(where.low);
    var high = Number(where.high);
    if (!isFinite(low) || !isFinite(high)) return false;
    return left >= low && left <= high;
  }
  var right = Number(where.value);
  if (!isFinite(right)) return false;
  if (where.op === "gt") return left > right;
  if (where.op === "lt") return left < right;
  if (where.op === "gte") return left >= right;
  if (where.op === "lte") return left <= right;
  if (where.op === "eq") return sameNum(left, right);
  return false;
}

function rowMatches(row, where) {
  if (!where) return false;
  if (where.on === "frequency") return compareOp(row.freq, where);
  if (where.op === "in") {
    return (where.values || []).some(function (item) {
      var num = parseNumber(item);
      if (num != null && row.num != null) return sameNum(row.num, num);
      return row.key === valueKey(item);
    });
  }
  if (row.num == null) return false;
  return compareOp(row.num, where);
}

function rowsFor(compiled, task) {
  if (task.values) {
    return task.values.map(function (value) {
      return findRow(compiled.rows, value);
    }).filter(Boolean);
  }
  if (task.where) {
    return compiled.rows.filter(function (row) {
      return rowMatches(row, task.where);
    });
  }
  return compiled.rows.slice();
}

function displayValue(row) {
  if (row.num != null && (typeof row.value === "number" || parseNumber(row.value) != null)) {
    return formatInt(row.num);
  }
  return String(row.value);
}

function displayDatum(item) {
  if (typeof item === "number" && isFinite(item)) return formatInt(item);
  var num = parseNumber(item);
  if (num != null && String(item).trim() !== "") return formatInt(num);
  return String(item);
}

function fillOrder(compiled) {
  return compiled.rows.slice().sort(function (a, b) {
    if (a.num != null && b.num != null && !sameNum(a.num, b.num)) return a.num - b.num;
    if (a.num != null && b.num == null) return -1;
    if (a.num == null && b.num != null) return 1;
    return a.index - b.index;
  });
}

function nextOpenRow(compiled, progress) {
  var filled = (progress && progress.filled) || {};
  var order = fillOrder(compiled);
  var i;
  for (i = 0; i < order.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(filled, order[i].key)) return order[i];
  }
  return null;
}

function fillShow(row) {
  return "השכיחות של " + displayValue(row) + " היא " + formatInt(row.freq);
}

function tableTotal(compiled) {
  return sum(compiled.rows.map(function (row) { return Number(row.freq) || 0; }));
}

function population(compiled) {
  if (compiled.data && compiled.data.length) return compiled.data.length;
  return tableTotal(compiled);
}

function formatList(rows) {
  if (!rows.length) return "אין";
  return rows.map(displayValue).join(", ");
}

function formatSum(nums) {
  return nums.map(formatInt).join(" + ");
}

function formatWeighted(rows) {
  return rows.map(function (row) {
    return formatInt(row.num) + "·" + formatInt(row.freq);
  }).join(" + ");
}

function canPartition(items, targets) {
  if (!sameNum(sum(items), sum(targets))) return false;
  var rest = targets.slice();
  var arr = items.slice().sort(function (a, b) { return b - a; });
  function rec(index) {
    if (index === arr.length) {
      return rest.every(function (item) { return Math.abs(item) < 1e-6; });
    }
    var n = arr[index];
    var seen = {};
    var t;
    for (t = 0; t < rest.length; t++) {
      var key = String(Math.round(rest[t] * 1e6));
      if (seen[key]) continue;
      if (rest[t] + 1e-9 < n) continue;
      seen[key] = true;
      rest[t] -= n;
      if (rec(index + 1)) return true;
      rest[t] += n;
    }
    return false;
  }
  return rec(0);
}

function poolFor(freqs, terms) {
  var nonzero = freqs.filter(function (freq) { return !sameNum(freq, 0); });
  var termSum = sum(terms);
  if (sameNum(termSum, sum(freqs))) return freqs.slice();
  if (nonzero.length && sameNum(termSum, sum(nonzero))) return nonzero;
  if (!nonzero.length && sameNum(termSum, 0)) return [0];
  return null;
}

function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  var left = a.slice().sort(function (x, y) { return x - y; });
  var right = b.slice().sort(function (x, y) { return x - y; });
  var i;
  for (i = 0; i < left.length; i++) {
    if (!sameNum(left[i], right[i])) return false;
  }
  return true;
}

function parseEqualsNumber(raw) {
  var lead = /^=\s*(-?\d+(?:\.\d+)?)$/.exec(raw);
  var trail = /^(-?\d+(?:\.\d+)?)\s*=$/.exec(raw);
  var hit = lead || trail;
  if (!hit) return null;
  return { kind: "number", value: Number(hit[1]), continued: true };
}

function parseExpr(typed) {
  var raw = String(typed || "").trim().replace(/[−–—]/g, "-").replace(/[∙⋅•×✕]/g, "·");
  if (!raw) return null;
  var continuedNumber = parseEqualsNumber(raw);
  if (continuedNumber) return continuedNumber;
  var sides = raw.split("=");
  if (sides.length > 2) return null;
  var equals = null;
  if (sides.length === 2) {
    equals = parseNumber(sides[1]);
    if (equals == null) return null;
  }
  var left = sides[0].trim();
  if (equals == null && parseNumber(left) != null && !/[+·*xX]/.test(left)) {
    return { kind: "number", value: parseNumber(left) };
  }
  var parts = left.split("+").map(function (part) { return part.trim(); }).filter(Boolean);
  if (!parts.length) return null;
  var terms = [];
  var i;
  for (i = 0; i < parts.length; i++) {
    var prod = parts[i].match(/^(-?\d+(?:\.\d+)?)\s*[·*xX]\s*(-?\d+(?:\.\d+)?)$/);
    if (prod) {
      terms.push({ kind: "product", a: Number(prod[1]), b: Number(prod[2]) });
      continue;
    }
    var num = parseNumber(parts[i]);
    if (num == null) return null;
    terms.push({ kind: "number", value: num });
  }
  return { kind: "expr", terms: terms, equals: equals };
}

function stripRole(text) {
  var prev;
  var re = /^(השורה המייצגת את|השורה של|השורה|שורה|המשתנה הוא|המשתנה|השכיחות היא|השכיחות|את|היא|הוא)\s+/;
  do {
    prev = text;
    text = text.replace(re, "");
  } while (text !== prev);
  return text.trim();
}

function containsPhrase(text, phrase) {
  var host = normText(text);
  var needle = normText(phrase);
  if (!host || !needle) return false;
  var at = host.indexOf(needle);
  if (at < 0) return false;
  var before = at === 0 ? "" : host.charAt(at - 1);
  var after = at + needle.length >= host.length ? "" : host.charAt(at + needle.length);
  if (before && !/[\s,]/.test(before)) return false;
  if (after && !/[\s,]/.test(after)) return false;
  return true;
}

function headerMatch(typed, label) {
  var wanted = normText(label);
  if (!wanted) return false;
  var chunks = String(typed || "").split(/[,،;\n]+/);
  chunks.push(typed);
  var i;
  for (i = 0; i < chunks.length; i++) {
    var text = stripRole(normText(chunks[i]));
    if (text === wanted || text === "ה" + wanted) return true;
  }
  return containsPhrase(typed, label);
}

function matchIdentify(compiled, task, typed) {
  var label = task.role === "frequency" ? compiled.frequencyLabel : compiled.variableLabel;
  if (!headerMatch(typed, label)) {
    return { ok: false, message: "זו לא הכותרת המבוקשת. בדקו שוב את כותרות הטבלה." };
  }
  return { ok: true, done: true, shows: [label], message: "" };
}

function scaleKind(compiled) {
  var scale = compiled && compiled.scale;
  if (scale === "qualitative" || scale === "quantitative" || scale === "discrete" || scale === "continuous") {
    return scale;
  }
  return "qualitative";
}

function scaleAnswer(compiled, task) {
  var kind = scaleKind(compiled);
  if (task && task.depth === "full") {
    if (kind === "qualitative") return "איכותי";
    if (kind === "continuous") return "כמותי רציף";
    if (kind === "quantitative") return "כמותי";
    return "כמותי בדיד";
  }
  return kind === "qualitative" ? "איכותי" : "כמותי";
}

function canonicalReason(kind) {
  if (kind === "qualitative") return "ערכי המשתנה הם שמות או קטגוריות, לא מספרים.";
  if (kind === "continuous") return "ערכי המשתנה מתקבלים ממדידה ויכולים לקבל כל ערך בקטע.";
  return "ערכי המשתנה הם מספרים נפרדים שאפשר לספור.";
}

function denies(text, word) {
  return new RegExp("לא\\s*" + word + "|אינו\\s*" + word + "|אינם\\s*" + word + "|איננה\\s*" + word).test(text);
}

function reasonFits(kind, typed) {
  var text = normText(typed);
  if (!text) return false;
  if (kind === "qualitative") {
    if ((/כמותי|בדיד|רציף/.test(text)) && !denies(text, "כמותי")) return false;
    return /שמות|שם|קטגור|לא מספר|אינם מספרים|אינו מספר|מילים/.test(text);
  }
  if (kind === "continuous") {
    if (/בדיד/.test(text) && !denies(text, "בדיד")) return false;
    return /רציף|מדיד|כל ערך|בקטע/.test(text);
  }
  if ((/רציף/.test(text) && !denies(text, "רציף")) || (/איכותי/.test(text) && !denies(text, "איכותי"))) {
    return false;
  }
  var discrete = /בדיד|נפרד|שלמים|שלם|ספיר|לספור|נספר/.test(text);
  var numeric = /מספר|ערכ/.test(text);
  return discrete && numeric;
}

function matchScale(compiled, task, typed) {
  var text = normText(typed);
  var qualitative = /איכותי/.test(text);
  var quantitative = /כמותי/.test(text);
  var discrete = /בדיד/.test(text);
  var continuous = /רציף/.test(text);
  var kind = scaleKind(compiled);
  var full = !!(task && task.depth === "full");
  if (full) {
    var ok = false;
    if (kind === "qualitative") ok = qualitative && !quantitative && !discrete && !continuous;
    else if (kind === "continuous") ok = continuous && !discrete && !qualitative;
    else if (kind === "discrete") ok = (discrete || quantitative) && discrete && !continuous && !qualitative;
    else ok = quantitative && !qualitative && !continuous && !discrete;
    if (!ok) {
      return { ok: false, message: "ציינו אם המשתנה איכותי, כמותי בדיד או כמותי רציף." };
    }
    return { ok: true, done: true, shows: [scaleAnswer(compiled, task)], message: "" };
  }
  var family = kind === "qualitative" ? "qualitative" : "quantitative";
  if (quantitative === qualitative && !discrete && !continuous) {
    return { ok: false, message: "רשמו אם המשתנה כמותי או איכותי." };
  }
  if (family === "quantitative" && continuous && kind !== "continuous") {
    return { ok: false, message: "בדקו אם ערכי המשתנה הם מספרים או שמות." };
  }
  if (family === "quantitative" && discrete && kind === "continuous") {
    return { ok: false, message: "בדקו אם ערכי המשתנה הם מספרים או שמות." };
  }
  if (family === "qualitative" && (quantitative || discrete || continuous) && !qualitative) {
    return { ok: false, message: "בדקו אם ערכי המשתנה הם מספרים או שמות." };
  }
  if (family === "quantitative" && !quantitative && !discrete) {
    return { ok: false, message: "בדקו אם ערכי המשתנה הם מספרים או שמות." };
  }
  if (family === "qualitative" && !qualitative) {
    return { ok: false, message: "בדקו אם ערכי המשתנה הם מספרים או שמות." };
  }
  return { ok: true, done: true, shows: [scaleAnswer(compiled, task)], message: "" };
}

function matchReason(compiled, task, typed) {
  if (task && task.about && task.about !== "scale") {
    return { ok: false, message: "הנימוק לא נתמך." };
  }
  var kind = scaleKind(compiled);
  if (!reasonFits(kind, typed)) {
    return { ok: false, message: "הנימוק צריך להסביר את אופי הערכים בטבלה." };
  }
  return { ok: true, done: true, shows: [canonicalReason(kind)], message: "" };
}

function loneNumber(typed) {
  var text = String(typed || "").trim().replace(/^=\s*/, "").replace(/\s*=$/, "");
  if (/[=+·*xX×]/.test(text)) return null;
  var nums = text.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length !== 1) return null;
  return Number(nums[0]);
}

function chartReadMiss(compiled, row, n) {
  if (!compiled || !compiled.chartSource || n == null || !row) return "";
  if (row.num != null && sameNum(n, row.num) && !sameNum(row.num, row.freq)) {
    return "כתבתם את הערך שבציר האופקי. צריך את גובה העמודה.";
  }
  if (sameNum(Math.abs(n - row.freq), 1)) {
    return "הגובה לא מדויק. בדקו שוב את הסקאלה — ייתכן שפספסתם יחידה אחת.";
  }
  return "";
}

function chartSumMiss(compiled, task, n, total) {
  if (!compiled || !compiled.chartSource || n == null || sameNum(n, total)) return "";
  var values = [];
  rowsFor(compiled, task).forEach(function (row) {
    if (row.num != null) values.push(row.num);
  });
  if (values.length && sameNum(sum(values), n)) {
    return "חיברתם את ערכי הציר האופקי. צריך לחבר את גובהי העמודות.";
  }
  var neighbor = task && boundaryWhere(task.where);
  if (neighbor) {
    var neighborSum = sum(compiled.rows.filter(function (row) {
      return rowMatches(row, neighbor);
    }).map(function (row) { return row.freq; }));
    if (!sameNum(neighborSum, total) && sameNum(n, neighborSum)) return boundaryMessage(task.where.op);
  }
  var freqs = freqList(compiled, task);
  var missed = freqs.some(function (freq) {
    return !sameNum(freq, 0) && sameNum(total - freq, n);
  });
  if (missed) return "חסרה אחת העמודות בחיבור.";
  return "";
}

function matchLookup(compiled, task, typed) {
  var row = findRow(compiled.rows, task.value);
  if (!row) return { ok: false, message: "הערך לא מופיע בטבלה." };
  var n = loneNumber(typed);
  if (n == null || !sameNum(n, row.freq)) {
    return { ok: false, message: chartReadMiss(compiled, row, n) || (compiled && compiled.chartSource
      ? "מצאו את הערך בציר האופקי ובדקו לאיזה גובה מגיעה העמודה שלו."
      : "מצאו את הערך בטבלה וכתבו את השכיחות שמתאימה לו.") };
  }
  return { ok: true, done: true, shows: [formatInt(row.freq)], message: "" };
}

function freqList(compiled, task) {
  return rowsFor(compiled, task).map(function (row) { return row.freq; });
}

function numericTotal(compiled, task) {
  if (task.kind === "weightedSum") {
    return sum(compiled.rows.map(function (row) {
      return row.num == null ? NaN : row.num * row.freq;
    }));
  }
  return sum(freqList(compiled, task));
}

function finishSum(total, displayExpr, reduced) {
  if (!reduced) return { ok: true, done: true, shows: [formatInt(total)], message: "" };
  return {
    ok: true,
    done: true,
    shows: [displayExpr + " = " + formatInt(total)],
    message: "",
  };
}

function matchSum(compiled, task, typed, progress) {
  var freqs = freqList(compiled, task);
  var total = sum(freqs);
  var parsed = parseExpr(typed);
  if (!parsed || parsed.kind === "number" && parsed.terms) {
    return { ok: false, message: "אפשר לרשום את תרגיל החיבור, או את הסכום הסופי." };
  }
  if (!parsed || (parsed.kind !== "number" && parsed.kind !== "expr")) {
    return { ok: false, message: "אפשר לרשום את תרגיל החיבור, או את הסכום הסופי." };
  }
  if (parsed.kind === "number") {
    if (!sameNum(parsed.value, total)) {
      return { ok: false, message: chartSumMiss(compiled, task, parsed.value, total) || "זה לא הסכום. אפשר גם לרשום קודם את תרגיל החיבור." };
    }
    var show = formatInt(total);
    var phase = (progress && progress.phase && progress.phase[task.id]) || "";
    if (parsed.continued && phase === "expr") {
      return { ok: true, done: true, shows: [show], joinPrev: true, message: "" };
    }
    return { ok: true, done: true, shows: [show], message: "" };
  }
  if (parsed.terms.some(function (term) { return term.kind === "product"; })) {
    return { ok: false, message: "החיבור צריך לכלול את כל השכיחויות הרלוונטיות, או את הסכום הסופי." };
  }
  var terms = parsed.terms.map(function (term) { return term.value; });
  var pool = poolFor(freqs, terms);
  if (!pool || !canPartition(pool, terms)) {
    return { ok: false, message: "החיבור צריך לכלול את כל השכיחויות הרלוונטיות, או את הסכום הסופי." };
  }
  var nonzero = freqs.filter(function (freq) { return !sameNum(freq, 0); });
  var base = nonzero.length ? nonzero : [0];
  var displayExpr = sameMultiset(terms, base) || sameMultiset(terms, freqs)
    ? formatSum(base.length === freqs.length ? freqs : base)
    : formatSum(terms);
  if (terms.length === 1 || parsed.equals != null) {
    if (parsed.equals != null && !sameNum(parsed.equals, total)) {
      return { ok: false, message: "התוצאה לא שווה לחיבור שרשמתם." };
    }
    return finishSum(total, displayExpr, terms.length !== 1);
  }
  return {
    ok: true,
    done: false,
    phase: "expr",
    shows: [displayExpr],
    message: "עכשיו חברו את השכיחויות.",
  };
}

function takeProduct(remaining, a, b) {
  var exact = -1;
  var swapped = -1;
  var i;
  for (i = 0; i < remaining.length; i++) {
    var row = remaining[i];
    if (row.num == null) continue;
    if (exact < 0 && sameNum(row.num, a) && sameNum(row.freq, b)) exact = i;
    if (swapped < 0 && sameNum(row.num, b) && sameNum(row.freq, a)) swapped = i;
  }
  var idx = exact >= 0 ? exact : swapped;
  if (idx < 0) return null;
  return remaining.splice(idx, 1)[0];
}

function matchWeighted(compiled, task, typed, progress) {
  if (compiled.rows.some(function (row) { return row.num == null; })) {
    return { ok: false, message: "סכום משוקלל מתאים למשתנה מספרי." };
  }
  var total = numericTotal(compiled, { kind: "weightedSum" });
  var parsed = parseExpr(typed);
  if (!parsed) return { ok: false, message: "אפשר לרשום את המכפלות, או את הסכום שלהן." };
  if (parsed.kind === "number") {
    if (!sameNum(parsed.value, total)) {
      return { ok: false, message: "זה לא הסכום. אפשר גם לרשום קודם את המכפלות." };
    }
    var show = formatInt(total);
    var phase = (progress && progress.phase && task && progress.phase[task.id]) || "";
    if (parsed.continued && phase === "expr") {
      return { ok: true, done: true, shows: [show], joinPrev: true, message: "" };
    }
    return { ok: true, done: true, shows: [show], message: "" };
  }
  var remaining = compiled.rows.slice();
  var numberTerms = [];
  var i;
  for (i = 0; i < parsed.terms.length; i++) {
    var term = parsed.terms[i];
    if (term.kind === "product") {
      if (!takeProduct(remaining, term.a, term.b)) {
        return { ok: false, message: "כל מכפלה צריכה להתאים לערך ולשכיחות שלו בטבלה." };
      }
    } else numberTerms.push(term.value);
  }
  var products = remaining.map(function (row) { return row.num * row.freq; });
  var pool = poolFor(products, numberTerms.length ? numberTerms : [0]);
  if (numberTerms.length) {
    pool = poolFor(products, numberTerms);
    if (!pool || !canPartition(pool, numberTerms)) {
      return { ok: false, message: "החיבור צריך לכלול את כל המכפלות, או את הסכום הסופי." };
    }
  } else if (products.some(function (product) { return !sameNum(product, 0); })) {
    return { ok: false, message: "החיבור צריך לכלול את כל המכפלות, או את הסכום הסופי." };
  }
  var displayExpr = numberTerms.length ? formatSum(numberTerms) : formatWeighted(compiled.rows);
  if (parsed.equals != null) {
    if (!sameNum(parsed.equals, total)) {
      return { ok: false, message: "התוצאה לא שווה לחישוב שרשמתם." };
    }
    return { ok: true, done: true, shows: [displayExpr + " = " + formatInt(total)], message: "" };
  }
  if (numberTerms.length === 1) {
    return { ok: true, done: true, shows: [formatInt(total)], message: "" };
  }
  return {
    ok: true,
    done: false,
    phase: "expr",
    shows: [displayExpr],
    message: "עכשיו חשבו את הסכום.",
  };
}

function tokenizeList(typed) {
  var text = String(typed || "").trim();
  if (!text) return [];
  text = text.replace(/\s*וגם\s*/g, ",");
  text = text.replace(/\s*או\s*/g, ",");
  text = text.replace(/\s*וה\s*/g, ",");
  text = text.replace(/\s*ו-\s*/g, ",");
  text = text.replace(/\s+ו\s+/g, ",");
  text = text.replace(/[;|\n]+/g, ",");
  var parts = text.split(",").map(function (part) { return part.trim(); }).filter(Boolean);
  if (parts.length === 1 && /\s/.test(parts[0])) {
    var words = parts[0].split(/\s+/).filter(Boolean);
    if (words.length > 1) parts = words;
  }
  return parts;
}

function matchValueSet(compiled, expected, typed, prevFound, partialMessage) {
  if (!expected.length) {
    var empty = normText(typed);
    if (empty === "אין" || empty === "אף אחד" || empty === "אף ערך" || empty === "אין ערכים") {
      return { ok: true, done: true, found: [], shows: ["אין"], message: "" };
    }
    return { ok: false, message: "אף ערך לא מקיים את התנאי. אפשר לרשום «אין»." };
  }
  var tokens = tokenizeList(typed);
  if (!tokens.length) return { ok: false, message: "רשמו את ערכי המשתנה שמקיימים את התנאי." };
  var foundNow = [];
  var sawTableMiss = false;
  var sawGarbage = false;
  tokens.forEach(function (token) {
    var key = valueKey(token);
    var expectedRow = findRow(expected, token);
    if (expectedRow) {
      if (foundNow.indexOf(expectedRow.key) < 0) foundNow.push(expectedRow.key);
      return;
    }
    if (/^(ו|וה|או|וגם)$/.test(key) && !findRow(compiled.rows, token)) return;
    if (findRow(compiled.rows, token)) sawTableMiss = true;
    else sawGarbage = true;
  });
  if (!foundNow.length || sawGarbage || sawTableMiss) {
    return {
      ok: false,
      message: sawTableMiss
        ? "אחד הערכים לא מקיים את התנאי."
        : "רשמו את ערכי המשתנה שמקיימים את התנאי.",
    };
  }
  var prev = prevFound || [];
  var union = prev.slice();
  foundNow.forEach(function (key) {
    if (union.indexOf(key) < 0) union.push(key);
  });
  var added = foundNow.filter(function (key) { return prev.indexOf(key) < 0; });
  var expectedKeys = expected.map(function (row) { return row.key; });
  var done = expectedKeys.every(function (key) { return union.indexOf(key) >= 0; }) &&
    union.every(function (key) { return expectedKeys.indexOf(key) >= 0; });
  var showRows = expected.filter(function (row) {
    return (added.length ? added : foundNow).indexOf(row.key) >= 0;
  });
  if (!added.length && !done) {
    return {
      ok: true,
      done: false,
      found: union,
      shows: [],
      message: "את זה כבר רשמתם. בדקו אם יש עוד ערכים.",
    };
  }
  return {
    ok: true,
    done: done,
    found: union,
    shows: [formatList(showRows)],
    message: done ? "" : (partialMessage || "בדקו אם יש עוד ערכים שמקיימים את התנאי."),
  };
}

function modeRows(compiled) {
  var max = null;
  compiled.rows.forEach(function (row) {
    if (max == null || row.freq > max) max = row.freq;
  });
  return compiled.rows.filter(function (row) { return max != null && sameNum(row.freq, max); });
}

function maxFreq(compiled) {
  var rows = modeRows(compiled);
  return rows.length ? rows[0].freq : null;
}

function matchMode(compiled, task, typed, progress) {
  if (task.of === "frequency") {
    var n = loneNumber(typed);
    var max = maxFreq(compiled);
    if (n == null || max == null || !sameNum(n, max)) {
      return { ok: false, message: "חפשו בשורת השכיחויות את המספר הגדול ביותר." };
    }
    return { ok: true, done: true, shows: [formatInt(max)], message: "" };
  }
  var expected = modeRows(compiled);
  var typedNum = loneNumber(typed);
  if (
    typedNum != null &&
    sameNum(typedNum, maxFreq(compiled)) &&
    !expected.some(function (row) { return row.num != null && sameNum(row.num, typedNum); })
  ) {
    return { ok: false, message: "מצאתם את השכיחות. עכשיו רשמו את ערך המשתנה שמתאים לה." };
  }
  return matchValueSet(
    compiled,
    expected,
    typed,
    progress.found[task.id],
    expected.length > 1 ? "יש יותר מערך אחד עם אותה שכיחות מקסימלית. רשמו גם את האחרים." : ""
  );
}

function matchValues(compiled, task, typed, progress) {
  return matchValueSet(compiled, rowsFor(compiled, task), typed, progress.found[task.id], "");
}

function holds(total, op, value) {
  return compareOp(total, { op: op, value: value });
}

function decisionValue(compiled, task) {
  if (task && task.against === "half") return population(compiled) / 2;
  return Number(task && task.value);
}

function verdictWord(compiled, task) {
  var total = numericTotal(compiled, task.calc || { kind: "total" });
  return holds(total, task.op, decisionValue(compiled, task)) ? "כן" : "לא";
}

function asCount(typed) {
  var n = loneNumber(typed);
  if (n == null) return null;
  if (n < -1e-9 || Math.abs(n - Math.round(n)) > 1e-9) return NaN;
  return Math.round(n);
}

function matchFill(compiled, task, typed, progress, entry) {
  var row = null;
  var countText = typed;
  if (entry && entry.value != null && String(entry.value) !== "") {
    row = findRow(compiled.rows, entry.value);
    if (!row) return { ok: false, message: "הערך הזה לא מופיע בטבלה." };
    countText = entry.typed;
  } else {
    var guided = nextOpenRow(compiled, progress);
    if (!guided || String(typed || "").trim() !== fillShow(guided)) {
      return { ok: false, message: "כתבו שכיחות באחד מתאי הטבלה." };
    }
    row = guided;
    countText = formatInt(guided.freq);
  }
  var filled = {};
  Object.keys((progress && progress.filled) || {}).forEach(function (key) {
    filled[key] = progress.filled[key];
  });
  if (Object.prototype.hasOwnProperty.call(filled, row.key)) {
    return { ok: false, message: "התא הזה כבר נעול." };
  }
  var n = asCount(countText);
  if (n == null) return { ok: false, message: "כתבו את השכיחות כמספר." };
  if (typeof n !== "number" || !isFinite(n)) {
    return { ok: false, message: "שכיחות היא מספר הפעמים שהערך מופיע, ולכן היא מספר שלם שאינו שלילי." };
  }
  if (sameNum(n, row.freq)) {
    filled[row.key] = row.freq;
    var done = compiled.rows.every(function (item) {
      return Object.prototype.hasOwnProperty.call(filled, item.key);
    });
    return {
      ok: true,
      done: done,
      filled: filled,
      shows: [fillShow(row)],
      message: done ? "" : "התא נעול. אפשר למלא תא אחר.",
    };
  }
  var valueText = displayValue(row);
  if (row.num != null && sameNum(n, row.num) && !sameNum(row.num, row.freq)) {
    return {
      ok: false,
      message: compiled.chartSource
        ? "כתבתם את הערך " + valueText + " עצמו. בתא צריך את גובה העמודה."
        : "כתבתם את הערך " + valueText + " עצמו. בתא צריך את מספר הפעמים שהוא מופיע ברשימה.",
    };
  }
  if (sameNum(Math.abs(n - row.freq), 1)) {
    if (compiled.chartSource) {
      return { ok: false, message: "הגובה לא מדויק. בדקו שוב את הסקאלה — ייתכן שפספסתם יחידה אחת." };
    }
    var slip = n < row.freq ? "נראה שפספסתם מופע אחד." : "נראה שספרתם מופע אחד נוסף.";
    return { ok: false, message: slip + " כדאי לספור שוב את " + valueText + "." };
  }
  var lockedSum = 0;
  var open = 0;
  compiled.rows.forEach(function (item) {
    if (Object.prototype.hasOwnProperty.call(filled, item.key)) lockedSum += Number(filled[item.key]) || 0;
    else open += 1;
  });
  var expectedTotal = tableTotal(compiled);
  if (lockedSum + n > expectedTotal + 1e-9) {
    return {
      ok: false,
      message: "נוצר עודף בספירה. יחד עם התאים שכבר מולאו, השכיחויות גדולות מ־" + formatInt(expectedTotal) + ", מספר הנתונים שמתאימים לערכי הטבלה.",
    };
  }
  if (open === 1 && lockedSum + n < expectedTotal - 1e-9) {
    return {
      ok: false,
      message: "נוצר חוסר בספירה. סכום השכיחויות קטן מ־" + formatInt(expectedTotal) + ", מספר הנתונים שמתאימים לערכי הטבלה.",
    };
  }
  return {
    ok: false,
    message: compiled.chartSource
      ? "גובה העמודה של " + valueText + " אינו נכון. מצאו את הערך בציר האופקי ובדקו לאיזה גובה היא מגיעה."
      : "השכיחות של " + valueText + " אינה נכונה. עברו שוב על הרשימה וספרו את כל המופעים של הערך הזה.",
  };
}

function countSlip(row, n) {
  var valueText = displayValue(row);
  if (row.num != null && sameNum(n, row.num) && !sameNum(row.num, row.freq)) {
    return "כתבתם את הערך " + valueText + " עצמו. בתא צריך את מספר הפעמים שהוא מופיע ברשימה.";
  }
  if (sameNum(Math.abs(n - row.freq), 1)) {
    var slip = n < row.freq ? "נראה שפספסתם מופע אחד." : "נראה שספרתם מופע אחד נוסף.";
    return slip + " כדאי לספור שוב את " + valueText + ".";
  }
  return "השכיחות של " + valueText + " אינה נכונה. עברו שוב על הנתונים וספרו את כל המופעים של הערך הזה.";
}

function assessColumns(compiled, rawColumns) {
  var incoming = (rawColumns || []).map(function (col) {
    return {
      value: col && col.value != null ? String(col.value).trim() : "",
      freqText: col && col.freq != null ? String(col.freq).trim() : "",
    };
  });
  var used = {};
  var issues = [];
  var columns = incoming.map(function (col) {
    var out = { value: col.value, freq: col.freqText, valueLocked: false, freqLocked: false, issue: "" };
    if (!col.value && !col.freqText) {
      issues.push("empty");
      return out;
    }
    if (!col.value) {
      issues.push("novalue");
      out.issue = "novalue";
      return out;
    }
    var row = findRow(compiled.rows, col.value);
    if (!row) {
      issues.push("unknown");
      out.issue = "unknown";
      return out;
    }
    if (used[row.key]) {
      out.value = displayValue(row);
      issues.push("duplicate");
      out.issue = "duplicate";
      return out;
    }
    used[row.key] = true;
    out.value = displayValue(row);
    out.valueLocked = true;
    if (!col.freqText) {
      issues.push("nofreq");
      out.issue = "nofreq";
      return out;
    }
    var n = asCount(col.freqText);
    if (n == null || typeof n !== "number" || !isFinite(n)) {
      issues.push("badfreq");
      out.issue = "badfreq";
      return out;
    }
    if (!sameNum(n, row.freq)) {
      issues.push("freq");
      out.issue = "freq";
      out.freqMessage = countSlip(row, n);
      return out;
    }
    out.freq = formatInt(row.freq);
    out.freqLocked = true;
    return out;
  });
  var missing = compiled.rows.some(function (row) { return !used[row.key]; });
  var emptyCount = 0;
  columns.forEach(function (col) {
    if (!col.value && !col.freq) emptyCount += 1;
  });
  var seq = [];
  columns.forEach(function (col) {
    if (!col.valueLocked) return;
    var row = findRow(compiled.rows, col.value);
    if (row) seq.push(row);
  });
  var inOrder = true;
  if (compiled.quantitative) {
    var ordered = compiled.ordered || compiled.rows;
    if (seq.length !== ordered.length) inOrder = false;
    else {
      var i;
      for (i = 0; i < ordered.length; i++) {
        if (seq[i].key !== ordered[i].key) inOrder = false;
      }
    }
  }
  var message = "";
  var status = "";
  var ok = true;
  var done = false;
  var unknown = columns.filter(function (col) { return col.issue === "unknown"; })[0];
  var duplicate = columns.filter(function (col) { return col.issue === "duplicate"; })[0];
  var freqIssue = columns.filter(function (col) { return col.issue === "freq"; })[0];
  if (unknown) {
    message = "הערך " + unknown.value + " אינו מופיע בנתונים.";
    ok = false;
  } else if (duplicate) {
    message = "הערך " + duplicate.value + " הוזן ביותר מעמודה אחת.";
    ok = false;
  } else if (freqIssue) {
    message = freqIssue.freqMessage;
    ok = false;
  } else if (issues.indexOf("badfreq") >= 0 || issues.indexOf("novalue") >= 0) {
    message = "בכל עמודה צריך ערך מהנתונים, ומתחתיו שכיחות שהיא מספר שלם שאינו שלילי.";
    ok = false;
  } else if (issues.indexOf("nofreq") >= 0) {
    message = "לכל ערך שכתבתם, ספרו כמה פעמים הוא מופיע בנתונים.";
    ok = columns.some(function (col) { return col.freqLocked; });
  } else if (missing) {
    message = columns.some(function (col) { return col.valueLocked; })
      ? "חסר ערך שמופיע בנתונים. הוסיפו לו עמודה."
      : "הוסיפו עמודה, וכתבו בה ערך מהנתונים ואת השכיחות שלו.";
    ok = columns.some(function (col) { return col.freqLocked; });
  } else if (emptyCount > 0) {
    message = "יש עמודה מיותרת.";
    ok = false;
  } else if (compiled.quantitative && !inOrder) {
    message = "הערכים והשכיחויות נכונים, אבל יש לסדר את ערכי המשתנה מהקטן לגדול.";
    ok = true;
    status = "note";
  } else {
    done = compiled.rows.length > 0;
    ok = done;
    message = "";
  }
  return {
    ok: ok,
    done: done,
    status: status,
    message: message,
    missing: missing,
    inOrder: inOrder,
    columns: columns.map(function (col) {
      return {
        value: col.value,
        freq: col.freq,
        valueLocked: col.valueLocked,
        freqLocked: col.freqLocked,
      };
    }),
  };
}

function newBuildShows(prevRaw, columns, compiled) {
  var prevFreq = {};
  var prevValue = {};
  (prevRaw || []).forEach(function (col) {
    if (!col) return;
    var row = findRow(compiled.rows, col.value);
    if (!row) return;
    prevValue[row.key] = true;
    var n = asCount(col.freq);
    if (n != null && sameNum(n, row.freq)) prevFreq[row.key] = true;
  });
  var shows = [];
  columns.forEach(function (col) {
    if (!col.valueLocked) return;
    var row = findRow(compiled.rows, col.value);
    if (!row) return;
    if (col.freqLocked) {
      if (!prevFreq[row.key]) shows.push(fillShow(row));
      return;
    }
    if (!prevValue[row.key]) shows.push("הערך " + displayValue(row));
  });
  return shows;
}

function copyBuildColumns(columns) {
  return (columns || []).map(function (col) {
    return {
      value: col.value == null ? "" : String(col.value),
      freq: col.freq == null ? "" : String(col.freq),
      valueLocked: !!col.valueLocked,
      freqLocked: !!col.freqLocked,
    };
  });
}

function columnIndexFor(columns, row) {
  var i;
  for (i = 0; i < columns.length; i++) {
    if (!columns[i].valueLocked) continue;
    if (valueKey(columns[i].value) === row.key) return i;
  }
  return -1;
}

function firstBlankColumn(columns) {
  var i;
  for (i = 0; i < columns.length; i++) {
    if (!String(columns[i].value || "").trim() && !String(columns[i].freq || "").trim()) return i;
  }
  return -1;
}

function nextBuildAction(compiled, rawColumns) {
  var assessed = assessColumns(compiled, rawColumns);
  var columns = assessed.columns;
  var guide = compiled.ordered || compiled.rows;
  var i;
  for (i = 0; i < guide.length; i++) {
    var row = guide[i];
    var at = columnIndexFor(columns, row);
    if (at < 0) {
      var next = copyBuildColumns(columns);
      var placed = { value: displayValue(row), freq: "", valueLocked: true, freqLocked: false };
      var blank = firstBlankColumn(next);
      if (blank >= 0) next[blank] = placed;
      else next.push(placed);
      return {
        ok: true,
        done: false,
        columns: next,
        shows: ["הערך " + displayValue(row)],
        message: "",
      };
    }
    if (!columns[at].freqLocked) {
      var filled = copyBuildColumns(columns);
      filled[at] = {
        value: displayValue(row),
        freq: formatInt(row.freq),
        valueLocked: true,
        freqLocked: true,
      };
      var again = assessColumns(compiled, filled);
      return {
        ok: true,
        done: again.done,
        status: again.done ? "" : "",
        columns: again.columns,
        shows: [fillShow(row)],
        message: "",
      };
    }
  }
  if (assessed.status === "note") {
    var sorted = guide.map(function (item) {
      return {
        value: displayValue(item),
        freq: formatInt(item.freq),
        valueLocked: true,
        freqLocked: true,
      };
    });
    return {
      ok: true,
      done: true,
      columns: sorted,
      shows: ["סדר עולה: " + guide.map(displayValue).join(", ")],
      message: "",
    };
  }
  return null;
}

function parseYesNo(typed) {
  var text = normText(typed);
  if (/^כן(?=$|\s)/.test(text)) return "כן";
  if (/^לא(?=$|\s)/.test(text)) return "לא";
  return null;
}

function matchYesNo(compiled, task, typed, progress) {
  var verdict = parseYesNo(typed);
  if (verdict) {
    if (verdict !== verdictWord(compiled, task)) {
      return { ok: false, message: "בדקו שוב את החישוב מול התנאי." };
    }
    return { ok: true, done: true, shows: [verdict], message: "" };
  }
  var calc = Object.assign({ id: task.id }, task.calc || { kind: "total" });
  var calcProgress = {
    done: {},
    phase: {},
    found: {},
  };
  if (progress.phase[task.id]) calcProgress.phase[calc.id] = progress.phase[task.id];
  var result = matchTask(compiled, calc, typed, calcProgress);
  if (!result.ok) {
    return { ok: false, message: result.message || "אפשר לרשום את החישוב, או לענות כן או לא." };
  }
  if (result.done) {
    if ((progress.phase[task.id] || "") === "value") {
      return {
        ok: true,
        done: false,
        phase: "value",
        shows: [],
        message: "השוו את התוצאה לתנאי וענו כן או לא.",
      };
    }
    return {
      ok: true,
      done: false,
      phase: "value",
      shows: result.shows || [],
      joinPrev: !!result.joinPrev,
      message: "השוו את התוצאה לתנאי וענו כן או לא.",
    };
  }
  return {
    ok: true,
    done: false,
    phase: result.phase || "expr",
    shows: result.shows || [],
    joinPrev: !!result.joinPrev,
    message: result.message || "חשבו את התוצאה.",
  };
}

function groupOf(compiled, where) {
  var rows = compiled.rows.filter(function (row) { return rowMatches(row, where); });
  var part = sum(rows.map(function (row) { return Number(row.freq) || 0; }));
  var total = tableTotal(compiled);
  return {
    rows: rows,
    part: part,
    total: total,
    values: formatList(rows),
    fraction: fractionText(part, total),
    ratio: total ? part / total : NaN,
  };
}

function compareSides(compiled, task) {
  return {
    left: groupOf(compiled, task.left && task.left.where),
    right: groupOf(compiled, task.right && task.right.where),
  };
}

function compareBag(progress, task) {
  return (progress && progress.got && progress.got[task.id]) || {};
}

function compareReady(got) {
  return !!(got && (got.compared || (got.leftFraction && got.rightFraction)));
}

function ratiosEqual(sides) {
  return !!(sides && sameNum(sides.left.ratio, sides.right.ratio));
}

function classifyGroupPiece(text, sides) {
  var frac = parseFraction(String(text || "").replace(/\s+/g, ""));
  if (frac) {
    return {
      kind: "fraction",
      left: fractionEquals(frac, sides.left.part, sides.left.total),
      right: fractionEquals(frac, sides.right.part, sides.right.total),
      text: frac.text,
    };
  }
  var parsed = parseExpr(text);
  if (parsed && parsed.kind === "expr" && parsed.equals == null) {
    var terms = parsed.terms.filter(function (term) { return term.kind === "number"; }).map(function (term) { return term.value; });
    if (terms.length !== parsed.terms.length) return null;
    function fits(group) {
      var freqs = group.rows.map(function (row) { return row.freq; });
      var pool = poolFor(freqs, terms);
      return !!(pool && canPartition(pool, terms));
    }
    var onLeft = fits(sides.left);
    var onRight = fits(sides.right);
    if (!onLeft && !onRight) return null;
    return { kind: terms.length > 1 ? "sum" : "bare", left: onLeft, right: onRight, value: sum(terms) };
  }
  var n = loneNumber(text);
  if (n == null) return null;
  return {
    kind: "bare",
    left: sameNum(n, sides.left.part),
    right: sameNum(n, sides.right.part),
    value: n,
  };
}

function assignSide(got, side, patch) {
  var prefix = side === "right" ? "right" : "left";
  if (patch.values) got[prefix + "Values"] = patch.values;
  if (patch.freq) got[prefix + "Freq"] = patch.freq;
  if (patch.fraction) got[prefix + "Fraction"] = patch.fraction;
  if (patch.expr) got[prefix + "Expr"] = patch.expr;
}

function freshCompare(got) {
  return Object.assign({}, got || {});
}

function matchCompare(compiled, task, typed, progress) {
  var sides = compareSides(compiled, task);
  var got = freshCompare(compareBag(progress, task));
  var verdict = ratiosEqual(sides) ? "כן" : "לא";
  var answer = parseYesNo(typed);
  if (answer) {
    if (answer !== verdict) return { ok: false, message: "בדקו שוב את שתי השכיחויות היחסיות." };
    return { ok: true, done: true, shows: [answer], got: got, message: "" };
  }
  var text = stripMath(typed).replace(/\s+/g, "");
  var bits = text.split("=");
  if (bits.length === 2) {
    var leftPiece = classifyGroupPiece(bits[0], sides);
    var rightPiece = classifyGroupPiece(bits[1], sides);
    if (leftPiece && rightPiece && leftPiece.kind === "fraction" && rightPiece.kind === "fraction" &&
      ((leftPiece.left && rightPiece.right) || (leftPiece.right && rightPiece.left))) {
      got.leftFraction = sides.left.fraction;
      got.rightFraction = sides.right.fraction;
      got.leftFreq = formatInt(sides.left.part);
      got.rightFreq = formatInt(sides.right.part);
      return { ok: true, done: false, got: got, shows: [sides.left.fraction + " = " + sides.right.fraction], message: "השוו וענו כן או לא." };
    }
    if (leftPiece && rightPiece && leftPiece.kind === "sum" && rightPiece.kind === "sum" &&
      ((leftPiece.left && rightPiece.right) || (leftPiece.right && rightPiece.left))) {
      got.compared = "freqs";
      got.leftFreq = formatInt(sides.left.part);
      got.rightFreq = formatInt(sides.right.part);
      return { ok: true, done: false, got: got, shows: [shownCompare(sides)], message: "אפשר להמשיך." };
    }
    if (leftPiece && rightPiece && leftPiece.kind === "bare" && rightPiece.kind === "bare" &&
      leftPiece.left && leftPiece.right && rightPiece.left && rightPiece.right) {
      got.compared = "freqs";
      got.leftFreq = formatInt(sides.left.part);
      got.rightFreq = formatInt(sides.right.part);
      return { ok: true, done: false, got: got, shows: [formatInt(sides.left.part) + " = " + formatInt(sides.right.part)], message: "אפשר להמשיך." };
    }
    if (leftPiece && rightPiece && leftPiece.kind === "sum" && rightPiece.kind === "bare" && sameNum(rightPiece.value, leftPiece.value)) {
      var side = leftPiece.left ? "left" : "right";
      assignSide(got, side, { values: sides[side].values, freq: formatInt(sides[side].part), expr: "1" });
      return { ok: true, done: false, got: got, shows: [formatSum(sides[side].rows.map(function (row) { return row.freq; })) + " = " + formatInt(sides[side].part)], message: "אפשר להמשיך." };
    }
  }
  var listed = matchValueSet(compiled, sides.left.rows, typed, [], "");
  var listedRight = matchValueSet(compiled, sides.right.rows, typed, [], "");
  if (listed && listed.ok && listed.done && !(listedRight && listedRight.ok && listedRight.done)) {
    got.leftValues = sides.left.values;
    return { ok: true, done: false, got: got, shows: [sides.left.values], message: "אפשר להמשיך." };
  }
  if (listedRight && listedRight.ok && listedRight.done && !(listed && listed.ok && listed.done)) {
    got.rightValues = sides.right.values;
    return { ok: true, done: false, got: got, shows: [sides.right.values], message: "אפשר להמשיך." };
  }
  var piece = classifyGroupPiece(text, sides);
  if (piece && piece.kind === "fraction") {
    var fracSide = piece.left && !got.leftFraction ? "left" : (piece.right && !got.rightFraction ? "right" : (piece.left ? "left" : "right"));
    assignSide(got, fracSide, {
      values: sides[fracSide].values,
      freq: formatInt(sides[fracSide].part),
      fraction: sides[fracSide].fraction,
    });
    return { ok: true, done: false, got: got, shows: [sides[fracSide].fraction], message: compareReady(got) ? "השוו וענו כן או לא." : "אפשר להמשיך." };
  }
  if (piece && (piece.kind === "sum" || piece.kind === "bare")) {
    var numSide = piece.left && !got.leftFreq ? "left" : (piece.right && !got.rightFreq ? "right" : "");
    if (!numSide && piece.left) numSide = "left";
    if (!numSide && piece.right) numSide = "right";
    if (numSide && (piece.left || piece.right)) {
      if (piece.kind === "sum") {
        assignSide(got, numSide, { values: sides[numSide].values, expr: "1" });
        return {
          ok: true,
          done: false,
          got: got,
          shows: [formatSum(sides[numSide].rows.map(function (row) { return row.freq; }))],
          message: "עכשיו חברו את השכיחויות.",
        };
      }
      assignSide(got, numSide, { freq: formatInt(sides[numSide].part) });
      return { ok: true, done: false, got: got, shows: [formatInt(sides[numSide].part)], message: "אפשר להמשיך." };
    }
  }
  var neighborNote = compareBoundary(compiled, task, typed, sides);
  if (neighborNote) return { ok: false, message: neighborNote };
  if (compiled.chartSource) {
    var asNumber = loneNumber(typed);
    var valueMiss = chartSumMiss(compiled, { where: task.left && task.left.where }, asNumber, sides.left.part)
      || chartSumMiss(compiled, { where: task.right && task.right.where }, asNumber, sides.right.part);
    if (valueMiss) return { ok: false, message: valueMiss };
  }
  return { ok: false, message: "אפשר לחשב כל שכיחות יחסית, להשוות ביניהן, או לענות כן או לא." };
}

function shownCompare(sides) {
  return formatInt(sides.left.part) + " = " + formatInt(sides.right.part);
}

function compareBoundary(compiled, task, typed, sides) {
  var n = loneNumber(stripMath(typed));
  if (n == null) return "";
  var specs = [task.left && task.left.where, task.right && task.right.where];
  var i;
  for (i = 0; i < specs.length; i++) {
    var neighbor = boundaryWhere(specs[i]);
    if (!neighbor) continue;
    var neighborSum = sum(compiled.rows.filter(function (row) { return rowMatches(row, neighbor); }).map(function (row) { return row.freq; }));
    var own = i === 0 ? sides.left.part : sides.right.part;
    if (!sameNum(neighborSum, own) && sameNum(n, neighborSum)) return boundaryMessage(specs[i].op);
  }
  return "";
}

function nextCompare(compiled, task, progress) {
  var sides = compareSides(compiled, task);
  var got = compareBag(progress, task);
  if (compareReady(got)) {
    return { line: ratiosEqual(sides) ? "כן" : "לא", done: true, got: got };
  }
  if (!got.leftValues && !got.leftFreq && !got.leftFraction) {
    return { line: sides.left.values, done: false, got: { leftValues: sides.left.values } };
  }
  if (!got.leftFreq && !got.leftFraction) {
    var leftFreqs = sides.left.rows.map(function (row) { return row.freq; });
    if (leftFreqs.length > 1 && !got.leftExpr) {
      return { line: formatSum(leftFreqs), done: false, got: { leftExpr: "1", leftValues: sides.left.values } };
    }
    return { line: formatInt(sides.left.part), joinPrev: !!got.leftExpr, done: false, got: { leftFreq: formatInt(sides.left.part) } };
  }
  if (!got.leftFraction) {
    return { line: sides.left.fraction, done: false, got: { leftFraction: sides.left.fraction, leftFreq: formatInt(sides.left.part) } };
  }
  if (!got.rightValues && !got.rightFreq && !got.rightFraction) {
    return { line: sides.right.values, done: false, got: { rightValues: sides.right.values } };
  }
  if (!got.rightFreq && !got.rightFraction) {
    var rightFreqs = sides.right.rows.map(function (row) { return row.freq; });
    if (rightFreqs.length > 1 && !got.rightExpr) {
      return { line: formatSum(rightFreqs), done: false, got: { rightExpr: "1", rightValues: sides.right.values } };
    }
    return { line: formatInt(sides.right.part), joinPrev: !!got.rightExpr, done: false, got: { rightFreq: formatInt(sides.right.part) } };
  }
  if (!got.rightFraction) {
    return { line: sides.right.fraction, done: false, got: { rightFraction: sides.right.fraction, rightFreq: formatInt(sides.right.part) } };
  }
  return { line: ratiosEqual(sides) ? "כן" : "לא", done: true, got: got };
}

var REL_ROWS = {
  relativeFraction: { label: "שכיחות יחסית בשבר", form: "fraction" },
  relativeDecimal: { label: "שכיחות יחסית בעשרוני", form: "decimal" },
  relativePercent: { label: "שכיחות יחסית באחוזים", form: "percent" },
};
// השורה הבאה נשמרת כנקודת הרחבה. היא לא מוצעת לתלמיד עד שנוסיף שכיחות מצטברת.
var LATER_ROWS = {
  cumulativeFrequency: { label: "שכיחות מצטברת" },
};

function formToRow(form) {
  if (form === "fraction") return "relativeFraction";
  if (form === "decimal") return "relativeDecimal";
  if (form === "percent") return "relativePercent";
  return "";
}

function rowToForm(row) {
  return REL_ROWS[row] ? REL_ROWS[row].form : "";
}

function emptyWork() {
  return { added: [], cells: {}, guided: {}, pending: null };
}

function formatPlain(n) {
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  var thousand = Math.round(n * 1000) / 1000;
  if (Math.abs(n - thousand) < 1e-8) return String(thousand);
  return String(Math.round(n * 100) / 100);
}

function fractionText(part, total) {
  return formatInt(part) + "/" + formatInt(total);
}

function decimalsOf(text) {
  var match = String(text == null ? "" : text).match(/\.(\d+)/);
  return match ? match[1].length : 0;
}

function roundsTo(exact, text) {
  var n = Number(text);
  if (!isFinite(n)) return false;
  var factor = Math.pow(10, decimalsOf(text));
  return sameNum(Math.round(Number(exact) * factor) / factor, n);
}

function parseFraction(text) {
  var match = String(text || "").replace(/\s+/g, "").match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (!match || !Number(match[2])) return null;
  return { num: Number(match[1]), den: Number(match[2]), text: match[1] + "/" + match[2] };
}

function fractionEquals(frac, part, total) {
  if (!frac || !total) return false;
  return sameNum(frac.num * total, frac.den * part);
}

function stripMath(text) {
  return String(text || "").trim().replace(/[−–—]/g, "-").replace(/[∙⋅•×✕*]/g, "·");
}

function parsePercentText(text) {
  var match = stripMath(text).replace(/\s+/g, "").match(/^(-?\d+(?:\.\d+)?)%$/);
  return match ? match[1] : null;
}

function percentEquals(text, ratio) {
  var num = parsePercentText(text);
  if (num == null) return false;
  return roundsTo(ratio * 100, num);
}

function decimalEquals(text, ratio) {
  var raw = stripMath(text).replace(/\s+/g, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(raw)) return false;
  if (raw.indexOf(".") < 0 && !sameNum(Number(raw), ratio)) return false;
  return roundsTo(ratio, raw);
}

function selectionRows(compiled, task) {
  if (task && (task.of === "minFreq" || task.of === "maxFreq")) {
    var best = null;
    compiled.rows.forEach(function (row) {
      if (row.freq == null || !isFinite(Number(row.freq))) return;
      if (!best) best = row;
      else if (task.of === "minFreq" && Number(row.freq) < Number(best.freq)) best = row;
      else if (task.of === "maxFreq" && Number(row.freq) > Number(best.freq)) best = row;
    });
    return best ? [best] : [];
  }
  if (task && task.value != null && !task.where && !task.values) {
    var row = findRow(compiled.rows, task.value);
    return row ? [row] : [];
  }
  return rowsFor(compiled, task || {});
}

function rowsAfterTransfer(compiled, transfer) {
  var rows = (compiled.rows || []).map(function (row) {
    return Object.assign({}, row);
  });
  var from = Number(transfer.from);
  var to = Number(transfer.to);
  var count = Number(transfer.count);
  var fromRow = null;
  var toRow = null;
  rows.forEach(function (row) {
    if (row.num != null && sameNum(row.num, from)) fromRow = row;
    if (row.num != null && sameNum(row.num, to)) toRow = row;
  });
  if (fromRow) fromRow.freq = Number(fromRow.freq) - count;
  if (toRow) toRow.freq = Number(toRow.freq) + count;
  else rows.push({ value: to, key: valueKey(to), num: to, freq: count, missing: false, givenExpr: "", index: rows.length });
  return rows;
}

function withTransfer(compiled, task) {
  if (!task || !task.transfer) return compiled;
  var rows = rowsAfterTransfer(compiled, task.transfer);
  return Object.assign({}, compiled, { rows: rows, ordered: rows });
}

function transferFacts(compiled, task) {
  var spec = task && task.transfer;
  if (!spec) return null;
  var from = Number(spec.from);
  var to = Number(spec.to);
  var count = Number(spec.count);
  var fromRow = findRow(compiled.rows, from);
  var toRow = findRow(compiled.rows, to);
  var fromOld = fromRow ? Number(fromRow.freq) : 0;
  var toOld = toRow ? Number(toRow.freq) : 0;
  return {
    from: from,
    to: to,
    count: count,
    fromOld: fromOld,
    toOld: toOld,
    fromNew: fromOld - count,
    toNew: toOld + count,
  };
}

function relativeTarget(compiled, task) {
  var source = withTransfer(compiled, task);
  var selected = selectionRows(source, task);
  var part = sum(selected.map(function (row) { return Number(row.freq) || 0; }));
  var total = tableTotal(source);
  var complement = total - part;
  return {
    selected: selected,
    part: part,
    total: total,
    complement: complement,
    ratio: total ? part / total : NaN,
    complementRatio: total ? complement / total : NaN,
    allFreqs: source.rows.map(function (row) { return row.freq; }),
  };
}

function formsNeeded(task) {
  if (task && task.forms && task.forms.length) return task.forms.slice();
  return null;
}

function wantsPercent(task) {
  var forms = formsNeeded(task);
  return !!(forms && forms.indexOf("percent") >= 0);
}

function wantsDecimal(task) {
  var forms = formsNeeded(task);
  return !!(forms && forms.indexOf("decimal") >= 0);
}

function gotSatisfied(task, got) {
  got = got || {};
  var need = formsNeeded(task);
  if (!need) return !!(got.fraction || got.percent || got.decimal);
  var i;
  for (i = 0; i < need.length; i++) {
    if (!got[need[i]]) return false;
  }
  return true;
}

function canonicalPercent(ratio) {
  return formatPlain(ratio * 100) + "%";
}

function noteAnswerPiece(piece, state, target, allowComplement) {
  var text = stripMath(piece);
  if (!text) return;
  var product = text.replace(/\s+/g, "").match(/^\(?(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\)?·100$/);
  if (product) {
    var frac = { num: Number(product[1]), den: Number(product[2]) };
    if (fractionEquals(frac, target.part, target.total)) {
      state.product = true;
      state.total = true;
      state.part = true;
      if (!state.fraction) state.fraction = product[1] + "/" + product[2];
      state.usingComplement = false;
      state.complementOpen = "";
    }
    return;
  }
  var fracPiece = parseFraction(text);
  if (fracPiece && fractionEquals(fracPiece, target.part, target.total)) {
    state.fraction = fracPiece.text;
    state.total = true;
    state.part = true;
    state.usingComplement = false;
    state.complementOpen = "";
    return;
  }
  if (allowComplement && fracPiece && fractionEquals(fracPiece, target.complement, target.total)) {
    state.complement = fracPiece.text;
    state.usingComplement = !state.fraction;
    state.total = true;
    state.complementOpen = "";
    return;
  }
  if (percentEquals(text, target.ratio)) {
    state.percent = parsePercentText(text) + "%";
    state.total = true;
    state.part = true;
    state.complementOpen = "";
    return;
  }
  if (allowComplement && percentEquals(text, target.complementRatio)) {
    state.complementPercent = parsePercentText(text) + "%";
    state.usingComplement = !state.fraction && !state.percent;
    state.total = true;
    state.complementOpen = "";
    return;
  }
  if (decimalEquals(text, target.ratio)) {
    state.decimal = stripMath(text).replace(/\s+/g, "");
    state.total = true;
    state.part = true;
    state.complementOpen = "";
    return;
  }
  var parsed = parseExpr(text);
  if (!parsed) return;
  if (parsed.kind === "number" && sameNum(parsed.value, target.total)) {
    state.total = true;
    state.summingTotal = false;
    return;
  }
  if (parsed.kind === "number" && target.selected.length > 1 && sameNum(parsed.value, target.part) && !sameNum(target.part, target.total)) {
    state.part = true;
    state.summingPart = false;
    state.total = state.total || sameNum(parsed.value, target.total);
    return;
  }
  if (allowComplement && parsed.kind === "number" && !sameNum(target.complement, target.part) && sameNum(parsed.value, target.complement)) {
    state.complementSum = true;
    state.usingComplement = !state.fraction;
    state.total = true;
    return;
  }
  if (parsed.kind !== "expr" || parsed.terms.some(function (term) { return term.kind === "product"; })) return;
  var terms = parsed.terms.map(function (term) { return term.value; });
  var all = targetAllFreqs(target);
  if (poolFor(all, terms) && canPartition(poolFor(all, terms), terms)) {
    state.summingTotal = parsed.equals == null && terms.length > 1;
    if (parsed.equals != null && sameNum(parsed.equals, target.total)) state.total = true;
    if (terms.length === 1) state.total = true;
    if (state.total) state.summingTotal = false;
    return;
  }
  var picked = target.selected.map(function (row) { return row.freq; });
  if (target.selected.length > 1 && poolFor(picked, terms) && canPartition(poolFor(picked, terms), terms)) {
    state.summingPart = parsed.equals == null && terms.length > 1;
    if (parsed.equals != null && sameNum(parsed.equals, target.part)) state.part = true;
    if (terms.length === 1) state.part = true;
    if (state.part) state.summingPart = false;
  }
}

function targetAllFreqs(target) {
  return target.allFreqs || [];
}

function absorbMathLine(line, state, target, allowComplement) {
  var text = stripMath(line);
  if (!text || /[א-ת]/.test(text)) return;
  var compact = text.replace(/\s+/g, "");
  var comp = /^1-(.+)$/.exec(compact);
  if (allowComplement && comp) {
    var left = comp[1].split("=")[0];
    var frac = parseFraction(left);
    if (frac && fractionEquals(frac, target.complement, target.total)) {
      state.complement = frac.text;
      state.total = true;
      state.usingComplement = !state.fraction;
      state.complementOpen = compact.indexOf("=") < 0 ? "fraction" : "";
      if (compact.indexOf("=") >= 0) noteAnswerPiece(compact.split("=").pop(), state, target, true);
      return;
    }
    if (decimalEquals(left, target.complementRatio)) {
      state.total = true;
      state.usingComplement = !state.fraction && !state.decimal;
      state.complementOpen = compact.indexOf("=") < 0 ? "decimal" : "";
      if (compact.indexOf("=") >= 0) noteAnswerPiece(compact.split("=").pop(), state, target, true);
      return;
    }
  }
  var pct = /^100%-(.+)$/.exec(compact);
  if (allowComplement && pct) {
    var base = pct[1].split("=")[0];
    if (percentEquals(base, target.complementRatio) || percentEquals(base.indexOf("%") >= 0 ? base : base + "%", target.complementRatio)) {
      state.complementPercent = parsePercentText(base.indexOf("%") >= 0 ? base : base + "%") + "%";
      state.total = true;
      state.usingComplement = !state.percent && !state.fraction;
      state.complementOpen = compact.indexOf("=") < 0 ? "percent" : "";
      if (compact.indexOf("=") >= 0) noteAnswerPiece(compact.split("=").pop(), state, target, true);
      return;
    }
  }
  text.split("=").forEach(function (piece) { noteAnswerPiece(piece, state, target, allowComplement); });
}

function mathHistory(progress) {
  return (progress && progress._history) || [];
}

function readRelativeState(compiled, task, progress) {
  var target = relativeTarget(compiled, task);
  if (!target.allFreqs) target.allFreqs = compiled.rows.map(function (row) { return row.freq; });
  var state = {
    total: false,
    part: false,
    fraction: "",
    percent: "",
    decimal: "",
    product: false,
    summingTotal: false,
    summingPart: false,
    complement: "",
    complementPercent: "",
    complementOpen: "",
    usingComplement: false,
  };
  var phase = (progress.phase && progress.phase[task.id]) || "";
  if (phase === "expr") state.summingTotal = true;
  if (phase === "total" || phase === "pick" || phase === "part" || phase === "fraction" || phase === "product" || phase === "scaled") state.total = true;
  if (phase === "pick") state.summingPart = true;
  if (phase === "part" || phase === "fraction" || phase === "product" || phase === "scaled") state.part = true;
  if (phase === "product") state.product = true;
  var got = (progress.got && progress.got[task.id]) || {};
  if (got.fraction) {
    state.fraction = got.fraction;
    state.total = true;
    state.part = true;
  }
  if (got.percent) {
    state.percent = got.percent;
    state.total = true;
    state.part = true;
  }
  if (got.decimal) {
    state.decimal = got.decimal;
    state.total = true;
    state.part = true;
  }
  if (workHasRelative(progress)) state.total = true;
  var lines = mathHistory(progress);
  var currentAt = -1;
  var lineIndex;
  for (lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    if (/^סעיף:/.test(String(lines[lineIndex] || "").trim())) currentAt = lineIndex;
  }
  lines.forEach(function (line, index) {
    absorbMathLine(line, state, target, index > currentAt);
  });
  if (state.fraction) state.usingComplement = false;
  if (progress.solve && progress.solve.total != null) state.total = true;
  return { state: state, target: target, got: got };
}

function workHasRelative(progress) {
  var cells = (progress.work && progress.work.cells) || {};
  var names = Object.keys(cells);
  var i;
  for (i = 0; i < names.length; i++) {
    if (cells[names[i]] && Object.keys(cells[names[i]]).length) return true;
  }
  return false;
}

function boundaryWhere(where) {
  var flip = { gt: "gte", gte: "gt", lt: "lte", lte: "lt" };
  if (!where || !flip[where.op] || where.on === "frequency") return null;
  var copy = {};
  Object.keys(where).forEach(function (key) { copy[key] = where[key]; });
  copy.op = flip[where.op];
  return copy;
}

function boundaryMessage(op) {
  if (op === "gt") return "בתנאי «יותר מ» לא כוללים את הערך עצמו.";
  if (op === "gte") return "בתנאי «לפחות» כוללים גם את הערך עצמו.";
  if (op === "lt") return "בתנאי «פחות מ» לא כוללים את הערך עצמו.";
  if (op === "lte") return "בתנאי «לכל היותר» כוללים גם את הערך עצמו.";
  return "";
}

function diagnoseRelative(compiled, task, target, typed, place) {
  var text = stripMath(typed);
  if (!text) return "";
  var hits = [];
  function add(code) {
    if (code && hits.indexOf(code) < 0) hits.push(code);
  }
  var frac = parseFraction(text.replace(/\s+/g, ""));
  var lone = loneNumber(text);
  var neighbor = boundaryWhere(task && task.where);
  var neighborSum = neighbor ? sum(compiled.rows.filter(function (row) { return rowMatches(row, neighbor); }).map(function (row) { return row.freq; })) : null;
  var valueSum = target.selected.every(function (row) { return row.num != null; })
    ? sum(target.selected.map(function (row) { return row.num; }))
    : null;
  if (lone != null && sameNum(lone, target.part) && !sameNum(target.part, target.ratio) && target.selected.length === 1) add("freq");
  if (frac && fractionEquals(frac, target.part, 100) && !fractionEquals(frac, target.part, target.total)) add("div100");
  if (lone != null && target.total && sameNum(lone, target.part / 100) && !sameNum(lone, target.ratio)) add("div100");
  if (frac && fractionEquals(frac, target.total, target.part) && !fractionEquals(frac, target.part, target.total)) add("invert");
  if (place === "percent" && decimalEquals(text, target.ratio) && !percentEquals(text.indexOf("%") >= 0 ? text : text + "%", target.ratio)) add("bare");
  if (parsePercentText(text) != null && decimalEquals(parsePercentText(text), target.ratio) && !percentEquals(text, target.ratio)) add("bare");
  var pct = parsePercentText(text);
  if (pct != null && !percentEquals(text, target.ratio)) {
    if (roundsTo(target.ratio * 1000, pct) || roundsTo(target.ratio * 10, pct)) add("shift");
  }
  if (place === "percent" && lone != null && !percentEquals(String(lone) + "%", target.ratio)) {
    if (roundsTo(target.ratio * 1000, lone) || roundsTo(target.ratio * 10, lone)) add("shift");
  }
  if (valueSum != null && !sameNum(valueSum, target.part)) {
    if (lone != null && sameNum(lone, valueSum)) add("values");
    var parsed = parseExpr(text);
    if (parsed && parsed.kind === "expr") {
      var terms = parsed.terms.filter(function (term) { return term.kind === "number"; }).map(function (term) { return term.value; });
      var vars = target.selected.map(function (row) { return row.num; });
      if (poolFor(vars, terms) && canPartition(poolFor(vars, terms), terms)) add("values");
    }
  }
  if (neighbor && neighborSum != null && !sameNum(neighborSum, target.part) && !sameNum(neighborSum, target.complement)) {
    if (lone != null && sameNum(lone, neighborSum)) add(task.where.op);
    if (frac && fractionEquals(frac, neighborSum, target.total)) add(task.where.op);
  }
  if (frac && sameNum(frac.den, target.part) && !sameNum(frac.num, target.total) && !sameNum(target.part, target.total) && !fractionEquals(frac, target.part, target.total)) add("group");
  if (hits.length !== 1) return "";
  if (hits[0] === "freq") return "זו השכיחות עצמה, לא השכיחות היחסית. השכיחות היחסית היא השכיחות חלקי מספר התצפיות הכולל.";
  if (hits[0] === "div100") return "נראה שחילקתם ב־100. המכנה הוא מספר התצפיות הכולל.";
  if (hits[0] === "invert") return "נראה שהפכתם בין המונה למכנה. השכיחות היחסית היא השכיחות חלקי מספר התצפיות הכולל.";
  if (hits[0] === "bare") return "היחס נכון, אבל כדי לקבל אחוזים צריך להכפיל ב־100.";
  if (hits[0] === "shift") return "נראה שהנקודה העשרונית זזה. בדקו שוב את ההמרה לאחוזים.";
  if (hits[0] === "values") return "חיברתם את ערכי המשתנה. צריך לחבר את השכיחויות שלהם.";
  if (hits[0] === "group") return "המכנה צריך להיות כלל התצפיות, לא רק סכום הקבוצה שנבחרה.";
  return boundaryMessage(hits[0]);
}

function calcSlip(target, typed) {
  var text = stripMath(typed);
  var parsed = parseExpr(text);
  if (parsed && parsed.kind === "expr" && parsed.equals != null) {
    var terms = parsed.terms.map(function (term) { return term.value; });
    var all = target.allFreqs || [];
    if (poolFor(all, terms) && canPartition(poolFor(all, terms), terms) && !sameNum(parsed.equals, target.total)) {
      return "הדרך נכונה, אבל נראה שיש טעות בחישוב. בדקו שוב את החיבור.";
    }
  }
  var compact = text.replace(/\s+/g, "");
  var product = compact.match(/^\(?(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\)?·100=(-?\d+(?:\.\d+)?%?)$/);
  if (product && fractionEquals({ num: Number(product[1]), den: Number(product[2]) }, target.part, target.total)) {
    var expected = target.part * 100 / target.total;
    var wrote = product[3].replace("%", "");
    if (!roundsTo(expected, wrote)) return "הדרך נכונה, אבל נראה שיש טעות בחישוב. בדקו שוב את ההכפלה ב־100.";
  }
  return "";
}

function pieceGot(piece, target, place) {
  var text = stripMath(piece);
  var got = {};
  var frac = parseFraction(text.replace(/\s+/g, ""));
  if (frac && fractionEquals(frac, target.part, target.total)) got.fraction = frac.text;
  if (percentEquals(text, target.ratio)) got.percent = parsePercentText(text) + "%";
  else if (place === "percent" && loneNumber(text) != null && percentEquals(loneNumber(text) + "%", target.ratio)) {
    got.percent = formatPlain(loneNumber(text)) + "%";
  }
  if (!got.fraction && decimalEquals(text, target.ratio)) got.decimal = text.replace(/\s+/g, "");
  return got;
}

function matchRelativeSum(compiled, task, typed) {
  var forms = formsNeeded(task) || ["fraction"];
  var text = stripMath(typed).replace(/\s+/g, "");
  var onlyPercent = forms.length === 1 && forms[0] === "percent";
  if (onlyPercent) {
    if (percentEquals(text, 1) || text === "100%") return { ok: true, done: true, shows: ["100%"], message: "" };
    return { ok: false, message: "בדקו את סכום כל השכיחויות היחסיות." };
  }
  if (text === "1" || text === "1.0" || text === "1/1") return { ok: true, done: true, shows: ["1"], message: "" };
  var frac = parseFraction(text);
  var total = tableTotal(compiled);
  if (frac && total && fractionEquals(frac, total, total)) return { ok: true, done: true, shows: [frac.text], message: "" };
  if (!onlyPercent && forms.indexOf("decimal") >= 0 && decimalEquals(text, 1)) {
    return { ok: true, done: true, shows: [text], message: "" };
  }
  if (decimalEquals(text, 1) && text.indexOf("/") < 0) return { ok: true, done: true, shows: ["1"], message: "" };
  return { ok: false, message: "בדקו את סכום כל השכיחויות היחסיות." };
}

function withBalance(compiled, progress, result) {
  if (!result || !result.ok || !result.done || !compiled || !compiled.givenRelative) return result;
  var info = Balance.truth(compiled);
  if (!info) return result;
  result.solve = Object.assign({}, (progress && progress.solve) || {}, { total: info.total, missing: info.missing, phase: "" });
  return result;
}

function shiftBag(progress) {
  var raw = progress && progress.solve && progress.solve.shift;
  return {
    fromNext: raw && raw.fromNext != null && raw.fromNext !== "" ? Number(raw.fromNext) : null,
    toNext: raw && raw.toNext != null && raw.toNext !== "" ? Number(raw.toNext) : null,
    part: !!(raw && raw.part),
  };
}

function saveShift(progress, shift) {
  progress.solve = progress.solve || {};
  progress.solve.shift = {
    fromNext: shift.fromNext,
    toNext: shift.toNext,
    part: !!shift.part,
  };
  return progress.solve;
}

function compactShift(text) {
  return String(text || "").replace(/\s+/g, "").replace(/−/g, "-").replace(/·/g, "*");
}

function acceptShift(compiled, task, progress, typed) {
  var facts = transferFacts(compiled, task);
  if (!facts) return null;
  var t = compactShift(typed);
  if (!t || t.indexOf("/") >= 0) return null;
  var shift = shiftBag(progress);
  var fromSub = formatInt(facts.fromOld) + "-" + formatInt(facts.count);
  var toAdd = formatInt(facts.toOld) + "+" + formatInt(facts.count);
  var fromWrong = formatInt(facts.fromOld) + "+" + formatInt(facts.count);
  var toWrong = formatInt(facts.toOld) + "-" + formatInt(facts.count);
  var total = tableTotal(compiled);
  if (t === fromWrong || t === fromWrong + "=" + formatInt(facts.fromOld + facts.count)) {
    return { ok: false, confident: true, message: "התלמידים יצאו מהקבוצה של " + formatInt(facts.from) + ", לא נוספו אליה." };
  }
  if ((facts.toOld !== 0 || t.indexOf("-") >= 0) && (t === toWrong || t === toWrong + "=" + formatInt(facts.toOld - facts.count))) {
    return { ok: false, confident: true, message: "התלמידים עברו אל הקבוצה של " + formatInt(facts.to) + ", לא יצאו ממנה." };
  }
  if (t === formatInt(total + facts.count) || t === formatInt(total - facts.count) || t === formatInt(total) + "+" + formatInt(facts.count) || t === formatInt(total) + "-" + formatInt(facts.count)) {
    return { ok: false, confident: true, message: "אותם תלמידים רק עברו בין קבוצות, ולכן מספר התלמידים הכולל לא השתנה." };
  }
  var oldPart = sum(selectionRows(compiled, task).map(function (row) { return Number(row.freq) || 0; }));
  var fresh = relativeTarget(compiled, task);
  if (/^\d+(?:\.\d+)?$/.test(t) && sameNum(Number(t), oldPart) && !sameNum(oldPart, fresh.part)) {
    return { ok: false, confident: true, message: "החישוב משתמש בהתפלגות שלפני המעבר." };
  }
  if (t === fromSub || t === fromSub + "=" + formatInt(facts.fromNew)) {
    shift.fromNext = facts.fromNew;
    return { ok: true, done: false, solve: saveShift(progress, shift), shows: [String(typed).trim()], message: "אפשר להמשיך." };
  }
  if (t === toAdd || t === toAdd + "=" + formatInt(facts.toNew)) {
    shift.toNext = facts.toNew;
    return { ok: true, done: false, solve: saveShift(progress, shift), shows: [String(typed).trim()], message: "אפשר להמשיך." };
  }
  if (/^\d+(?:\.\d+)?$/.test(t) && sameNum(Number(t), fresh.part) && !sameNum(fresh.part, oldPart)) {
    shift.part = true;
    return { ok: true, done: false, phase: "part", solve: saveShift(progress, shift), shows: [formatInt(fresh.part)], message: "חלקו את הסכום במספר התלמידים הכולל." };
  }
  return null;
}

function nextShiftLine(compiled, task, progress) {
  var facts = transferFacts(compiled, task);
  if (!facts) return null;
  var shift = shiftBag(progress);
  if (shift.fromNext == null || !sameNum(shift.fromNext, facts.fromNew)) {
    shift.fromNext = facts.fromNew;
    return {
      line: formatInt(facts.fromOld) + " − " + formatInt(facts.count) + " = " + formatInt(facts.fromNew),
      phase: "shift",
      done: false,
      solve: saveShift(progress, shift),
    };
  }
  if (shift.toNext == null || !sameNum(shift.toNext, facts.toNew)) {
    shift.toNext = facts.toNew;
    return {
      line: formatInt(facts.toOld) + " + " + formatInt(facts.count) + " = " + formatInt(facts.toNew),
      phase: "shift",
      done: false,
      solve: saveShift(progress, shift),
    };
  }
  return null;
}

function matchRelative(compiled, task, typed, progress) {
  if (task && task.transfer) {
    var shifted = acceptShift(compiled, task, progress, typed);
    if (shifted) return shifted;
    var oldPart = sum(selectionRows(compiled, task).map(function (row) { return Number(row.freq) || 0; }));
    var moved = relativeTarget(compiled, task);
    var oldFrac = parseFraction(stripMath(typed).replace(/\s+/g, ""));
    if (oldFrac && fractionEquals(oldFrac, oldPart, moved.total) && !sameNum(oldPart, moved.part)) {
      return { ok: false, confident: true, message: "החישוב משתמש בהתפלגות שלפני המעבר." };
    }
  }
  var read = readRelativeState(compiled, task, progress);
  var target = read.target;
  var text = stripMath(typed);
  if (!text) return { ok: false, message: "אפשר לחשב את מספר התצפיות הכולל, או לכתוב את השכיחות היחסית." };
  if (compiled.givenRelative) {
    var info = Balance.truth(compiled);
    var compactRel = text.replace(/\s+/g, "");
    var relFrac = parseFraction(compactRel);
    if (info && relFrac && sameNum(relFrac.den, info.missing) && !sameNum(relFrac.den, info.total)) {
      return { ok: false, message: "המכנה הוא מספר התצפיות הכולל, לא הערך של x." };
    }
    if (info && new RegExp("/" + formatInt(info.missing) + "$").test(compactRel) && compactRel.indexOf("/") > 0) {
      var bits = compactRel.split("/");
      if (bits.length === 2 && sameNum(Number(bits[1]), info.missing) && !sameNum(info.missing, info.total)) {
        return { ok: false, message: "המכנה הוא מספר התצפיות הכולל, לא הערך של x." };
      }
    }
    if (/\/x(?![0-9])/.test(compactRel) && compactRel.indexOf("x+") < 0 && compactRel.indexOf("+x") < 0 && compactRel.indexOf("(x") < 0) {
      return { ok: false, message: "המכנה הוא מספר התצפיות הכולל, לא x." };
    }
  }
  if (/x/i.test(text) && target.selected.some(function (row) { return row.freq == null || row.missing && !(progress.symbols && progress.symbols.resolved && progress.symbols.resolved[row.key] != null); })) {
    return { ok: false, message: "קודם צריך למצוא את השכיחות עצמה." };
  }
  var slip = calcSlip(target, text);
  if (slip) return { ok: false, message: slip };
  var got = Object.assign({}, read.got || {});
  var pieces = text.split("=").map(function (piece) { return piece.trim(); }).filter(Boolean);
  var accepted = false;
  var phase = "";
  pieces.forEach(function (piece) {
    var found = pieceGot(piece, target, "");
    Object.keys(found).forEach(function (key) {
      got[key] = found[key];
      accepted = true;
    });
  });
  if (accepted) {
    var done = gotSatisfied(task, got);
    return withBalance(compiled, progress, {
      ok: true,
      done: done,
      phase: done ? "" : (got.fraction ? "fraction" : "total"),
      got: got,
      shows: [text.indexOf("=") >= 0 ? text.replace(/·/g, "·") : (got.percent && !got.fraction && !formsNeeded(task) ? got.percent : (got.fraction || got.percent || got.decimal || text))],
      message: done ? "" : "אפשר להמשיך.",
    });
  }
  var state = read.state;
  var parsed = parseExpr(text);
  if (parsed && parsed.kind === "expr" && !parsed.terms.some(function (term) { return term.kind === "product"; })) {
    var terms = parsed.terms.map(function (term) { return term.value; });
    if (poolFor(target.allFreqs, terms) && canPartition(poolFor(target.allFreqs, terms), terms) && parsed.equals == null && terms.length > 1) {
      return { ok: true, done: false, phase: "expr", shows: [formatSum(target.allFreqs)], message: "עכשיו חברו את השכיחויות." };
    }
    var picked = target.selected.map(function (row) { return row.freq; });
    if (target.selected.length > 1 && poolFor(picked, terms) && canPartition(poolFor(picked, terms), terms) && parsed.equals == null) {
      return { ok: true, done: false, phase: "pick", shows: [formatSum(picked)], message: "עכשיו חברו את השכיחויות שמצאתם." };
    }
  }
  if (parsed && parsed.kind === "number" && sameNum(parsed.value, target.total)) {
    return {
      ok: true,
      done: false,
      phase: "total",
      joinPrev: !!(parsed.continued && state.summingTotal),
      shows: [formatInt(target.total)],
      message: "אפשר להמשיך.",
    };
  }
  if (parsed && parsed.kind === "number" && target.selected.length > 1 && sameNum(parsed.value, target.part)) {
    return {
      ok: true,
      done: false,
      phase: "part",
      joinPrev: !!(parsed.continued && state.summingPart),
      shows: [formatInt(target.part)],
      message: "חלקו את הסכום במספר התצפיות הכולל.",
    };
  }
  var compact = text.replace(/\s+/g, "");
  if (/^1-/.test(compact) || /^100%-/.test(compact)) {
    var before = readRelativeState(compiled, task, progress).state;
    absorbMathLine(text, before, target);
    if (before.complementOpen || before.fraction || before.percent || before.decimal) {
      var openGot = Object.assign({}, got);
      if (before.fraction) openGot.fraction = before.fraction;
      if (before.percent) openGot.percent = before.percent;
      if (before.decimal) openGot.decimal = before.decimal;
      return {
        ok: true,
        done: gotSatisfied(task, openGot),
        phase: before.fraction ? "fraction" : "part",
        got: openGot,
        shows: [text],
        message: gotSatisfied(task, openGot) ? "" : "אפשר להמשיך.",
      };
    }
  }
  var complementFrac = parseFraction(compact);
  if (complementFrac && fractionEquals(complementFrac, target.complement, target.total) && !sameNum(target.complement, target.part)) {
    return { ok: true, done: false, phase: "part", shows: [complementFrac.text], message: "אפשר להמשיך." };
  }
  if (parsed && parsed.kind === "number" && !sameNum(target.complement, target.part) && sameNum(parsed.value, target.complement) && target.selected.length > 1) {
    return { ok: true, done: false, phase: "part", shows: [formatInt(target.complement)], message: "אפשר להמשיך." };
  }
  var product = compact.match(/^\(?(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\)?·100$/);
  if (product && fractionEquals({ num: Number(product[1]), den: Number(product[2]) }, target.part, target.total)) {
    var fracGot = Object.assign({}, got, { fraction: product[1] + "/" + product[2] });
    return { ok: true, done: false, phase: "product", got: fracGot, shows: ["(" + product[1] + "/" + product[2] + ")·100"], message: "חשבו את ההכפלה." };
  }
  var diagnosed = diagnoseRelative(compiled, task, target, text, wantsPercent(task) && !formsNeeded(task) ? "" : "");
  if (!diagnosed && wantsPercent(task)) diagnosed = diagnoseRelative(compiled, task, target, text, "percent");
  return { ok: false, message: diagnosed || "עוד לא. בדקו שוב את השכיחות היחסית." };
}

function hintRelative(compiled, task, progress) {
  if (task && task.transfer) {
    var facts = transferFacts(compiled, task);
    var shift = shiftBag(progress);
    if (facts && (shift.fromNext == null || !sameNum(shift.fromNext, facts.fromNew) || shift.toNext == null || !sameNum(shift.toNext, facts.toNew))) {
      return "בדקו מאיזו קבוצה יצאו התלמידים ולאיזו קבוצה הם עברו.";
    }
  }
  var read = readRelativeState(compiled, task, progress);
  var state = read.state;
  var target = read.target;
  if (state.product && wantsPercent(task) && !state.percent) return "חשבו את ההכפלה ב־100.";
  if (state.fraction && wantsDecimal(task) && !state.decimal && !wantsPercent(task)) return "המירו את השבר לשבר עשרוני.";
  if ((state.fraction || state.decimal) && wantsPercent(task) && !state.percent) return "המירו את השכיחות היחסית שקיבלתם לאחוזים.";
  if (state.usingComplement && (state.complement || state.complementPercent) && !state.fraction && !state.percent) {
    return "המשיכו את דרך המשלים: חסרו את השכיחות היחסית שמצאתם מ־1, או את האחוז מ־100%.";
  }
  if (!state.total) return "כדי לחשב שכיחות יחסית, צריך לדעת כמה תצפיות יש בסך הכול. חברו את כל השכיחויות.";
  if (task && task.transfer && target.selected.length > 1 && !state.part) {
    return "מצאו אילו תלמידים עומדים בתנאי להורדת ציון וחברו את השכיחויות המתאימות.";
  }
  if (task && task.transfer && state.part && !state.fraction && !state.decimal && !state.percent) {
    return "כדי למצוא שכיחות יחסית, חלקו במספר התלמידים הכולל.";
  }
  if (target.selected.length > 1 && !state.part) {
    var where = task.where || {};
    if (where.op === "gt") return "בדקו אילו ערכים בטבלה גדולים מ־" + formatInt(where.value) + " וחברו את השכיחויות שלהם.";
    if (where.op === "gte") return "בדקו אילו ערכים בטבלה גדולים או שווים ל־" + formatInt(where.value) + " וחברו את השכיחויות שלהם.";
    if (where.op === "lt") return "בדקו אילו ערכים בטבלה קטנים מ־" + formatInt(where.value) + " וחברו את השכיחויות שלהם.";
    if (where.op === "lte") return "בדקו אילו ערכים בטבלה קטנים או שווים ל־" + formatInt(where.value) + " וחברו את השכיחויות שלהם.";
    return "חברו את השכיחויות של הערכים שעונים על התנאי.";
  }
  if (state.part && !state.fraction) return "חלקו את הסכום שקיבלתם במספר התצפיות הכולל.";
  return "מצאו את השכיחות של הערך המבוקש וחלקו אותה במספר התצפיות הכולל.";
}

function nextRelativeAction(compiled, task, progress) {
  if (task && task.transfer) {
    var shiftLine = nextShiftLine(compiled, task, progress);
    if (shiftLine) return shiftLine;
  }
  var read = readRelativeState(compiled, task, progress);
  var state = read.state;
  var target = read.target;
  var frac = state.fraction || fractionText(target.part, target.total);
  if (state.complementOpen === "fraction") {
    return { line: fractionText(target.part, target.total), joinPrev: true, phase: "fraction", done: !wantsPercent(task), got: { fraction: fractionText(target.part, target.total) } };
  }
  if (state.complementOpen === "percent") {
    var pct = canonicalPercent(target.ratio);
    return { line: pct, joinPrev: true, phase: "scaled", done: true, got: { percent: pct } };
  }
  if (state.usingComplement && state.complementSum && !state.complement && !state.fraction) {
    return { line: fractionText(target.complement, target.total), phase: "part", done: false };
  }
  if (state.usingComplement && state.complement && !state.fraction) {
    return { line: "1 - " + state.complement, phase: "part", done: false };
  }
  if (state.usingComplement && state.complementPercent && !state.percent && !state.fraction) {
    return { line: "100% - " + state.complementPercent, phase: "part", done: false };
  }
  var scaled = (progress.phase && progress.phase[task.id]) === "scaled";
  if ((scaled || state.product) && wantsPercent(task) && !state.percent && scaled) {
    var shownPct = canonicalPercent(target.ratio);
    return { line: shownPct, phase: "", done: true, got: { fraction: frac, percent: shownPct } };
  }
  if (state.product && wantsPercent(task) && !state.percent) {
    return { line: formatPlain(target.ratio * 100), joinPrev: true, phase: "scaled", done: false, got: { fraction: frac } };
  }
  if ((state.fraction || phaseHasFraction(progress, task)) && wantsPercent(task) && !state.percent && !state.product) {
    return { line: "(" + frac + ")·100", phase: "product", done: false, got: { fraction: frac } };
  }
  var scaled = (progress.phase && progress.phase[task.id]) === "scaled";
  if (scaled && wantsPercent(task) && !state.percent) {
    var shown = canonicalPercent(target.ratio);
    return { line: shown, phase: "", done: true, got: { fraction: frac, percent: shown } };
  }
  if (!state.total) {
    if (state.summingTotal) return { line: formatInt(target.total), joinPrev: true, phase: "total", done: false };
    var all = target.allFreqs;
    var expr = formatSum(all);
    if (expr === formatInt(target.total)) return { line: formatInt(target.total), phase: "total", done: false };
    return { line: expr, phase: "expr", done: false };
  }
  if (target.selected.length > 1 && !state.part) {
    if (state.summingPart) return { line: formatInt(target.part), joinPrev: true, phase: "part", done: false };
    return { line: formatSum(target.selected.map(function (row) { return row.freq; })), phase: "pick", done: false };
  }
  if (!state.fraction) {
    var own = fractionText(target.part, target.total);
    return { line: own, phase: "fraction", done: !wantsPercent(task) && !wantsDecimal(task), got: { fraction: own } };
  }
  if (state.fraction && wantsDecimal(task) && !state.decimal && !wantsPercent(task)) {
    var dec = formatPlain(target.ratio);
    return { line: dec, phase: "", done: true, got: { fraction: frac, decimal: dec } };
  }
  if (wantsPercent(task) && !state.percent) {
    return { line: "(" + frac + ")·100", phase: "product", done: false, got: { fraction: frac } };
  }
  return null;
}

function phaseHasFraction(progress, task) {
  var phase = (progress.phase && progress.phase[task.id]) || "";
  return phase === "fraction" || phase === "product" || phase === "scaled";
}

function requiredRows(ex, progress) {
  var rows = [];
  var parts = ex.parts || [];
  var i;
  progress = progress && progress.done ? progress : { done: {} };
  for (i = 0; i < parts.length; i++) {
    (parts[i].tasks || []).forEach(function (task) {
      if (task.kind !== "fillRelative") return;
      (task.forms || []).forEach(function (form) {
        var row = formToRow(form);
        if (row && rows.indexOf(row) < 0) rows.push(row);
      });
    });
    if (openTasks(parts[i], progress).length) break;
  }
  return rows;
}

function relativeReached(ex, progress) {
  var parts = ex.parts || [];
  var i;
  var t;
  progress = progress && progress.done ? progress : { done: {} };
  for (i = 0; i < parts.length; i++) {
    var tasks = parts[i].tasks || [];
    for (t = 0; t < tasks.length; t++) {
      if (tasks[t].kind === "relative" || tasks[t].kind === "fillRelative") return true;
    }
    if (openTasks(parts[i], progress).length) return false;
  }
  return false;
}

function activeRows(ex, progress) {
  var rows = requiredRows(ex, progress).slice();
  ((progress.work && progress.work.added) || []).forEach(function (row) {
    if (REL_ROWS[row] && rows.indexOf(row) < 0) rows.push(row);
  });
  return rows;
}

function cellAccepts(compiled, row, kind, text) {
  var form = rowToForm(kind);
  var target = { part: row.freq, total: tableTotal(compiled), ratio: tableTotal(compiled) ? row.freq / tableTotal(compiled) : NaN };
  if (form === "fraction") {
    var frac = parseFraction(stripMath(text).replace(/\s+/g, ""));
    return !!(frac && fractionEquals(frac, target.part, target.total));
  }
  if (form === "decimal") return decimalEquals(text, target.ratio);
  if (form === "percent") {
    return percentEquals(stripMath(text).indexOf("%") >= 0 ? text : String(text).trim() + "%", target.ratio)
      || (loneNumber(text) != null && percentEquals(loneNumber(text) + "%", target.ratio));
  }
  return false;
}

function canonicalCell(compiled, row, kind, text) {
  var form = rowToForm(kind);
  var total = tableTotal(compiled);
  if (form === "fraction") {
    var frac = parseFraction(stripMath(text).replace(/\s+/g, ""));
    return frac ? frac.text : fractionText(row.freq, total);
  }
  if (form === "decimal") return stripMath(text).replace(/\s+/g, "");
  if (loneNumber(text) != null && String(text).indexOf("%") < 0) return formatPlain(loneNumber(text)) + "%";
  var pct = parsePercentText(text);
  return pct != null ? formatPlain(Number(pct)) + "%" : canonicalPercent(row.freq / total);
}

function sanitizeWork(compiled, raw) {
  var work = emptyWork();
  raw = raw && typeof raw === "object" ? raw : {};
  (raw.added || []).forEach(function (row) {
    if (REL_ROWS[row] && work.added.indexOf(row) < 0) work.added.push(row);
  });
  var cells = raw.cells || {};
  Object.keys(REL_ROWS).forEach(function (kind) {
    work.cells[kind] = {};
    var src = cells[kind] || {};
    compiled.rows.forEach(function (row) {
      if (src[row.key] == null) return;
      var text = String(src[row.key]).slice(0, 40);
      if (!cellAccepts(compiled, row, kind, text)) return;
      work.cells[kind][row.key] = canonicalCell(compiled, row, kind, text);
    });
  });
  var guided = raw.guided || {};
  Object.keys(REL_ROWS).forEach(function (kind) {
    if (guided[kind]) work.guided[kind] = true;
  });
  if (raw.pending && REL_ROWS[raw.pending.row] && raw.pending.key) {
    work.pending = { row: raw.pending.row, key: String(raw.pending.key) };
  }
  return work;
}

function sanitizeGot(compiled, ex, raw) {
  var got = {};
  raw = raw || {};
  (ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) {
      if (task.kind === "compareRelative" && raw[task.id]) {
        var sides = compareSides(compiled, task);
        var srcCompare = raw[task.id];
        var kept = {};
        if (srcCompare.leftValues === sides.left.values) kept.leftValues = sides.left.values;
        if (srcCompare.rightValues === sides.right.values) kept.rightValues = sides.right.values;
        if (srcCompare.leftFreq && sameNum(Number(srcCompare.leftFreq), sides.left.part)) kept.leftFreq = formatInt(sides.left.part);
        if (srcCompare.rightFreq && sameNum(Number(srcCompare.rightFreq), sides.right.part)) kept.rightFreq = formatInt(sides.right.part);
        if (srcCompare.leftFraction && fractionEquals(parseFraction(srcCompare.leftFraction), sides.left.part, sides.left.total)) kept.leftFraction = sides.left.fraction;
        if (srcCompare.rightFraction && fractionEquals(parseFraction(srcCompare.rightFraction), sides.right.part, sides.right.total)) kept.rightFraction = sides.right.fraction;
        if (srcCompare.leftExpr === "1") kept.leftExpr = "1";
        if (srcCompare.rightExpr === "1") kept.rightExpr = "1";
        if (srcCompare.compared === "freqs" && kept.leftFreq && kept.rightFreq) kept.compared = "freqs";
        if (Object.keys(kept).length) got[task.id] = kept;
        return;
      }
      if (task.kind !== "relative" || !raw[task.id]) return;
      var target = relativeTarget(compiled, task);
      target.allFreqs = compiled.rows.map(function (row) { return row.freq; });
      var src = raw[task.id];
      var keep = {};
      if (src.fraction && pieceGot(src.fraction, target).fraction) keep.fraction = pieceGot(src.fraction, target).fraction;
      if (src.percent && pieceGot(src.percent, target).percent) keep.percent = pieceGot(src.percent, target).percent;
      if (src.decimal && pieceGot(src.decimal, target).decimal) keep.decimal = pieceGot(src.decimal, target).decimal;
      if (Object.keys(keep).length) got[task.id] = keep;
    });
  });
  return got;
}

function fillComplete(compiled, task, progress) {
  var forms = task.forms || [];
  var cells = (progress.work && progress.work.cells) || {};
  var f;
  for (f = 0; f < forms.length; f++) {
    var kind = formToRow(forms[f]);
    var rowCells = cells[kind] || {};
    var i;
    for (i = 0; i < compiled.rows.length; i++) {
      if (!rowCells[compiled.rows[i].key]) return false;
    }
  }
  return forms.length > 0 && compiled.rows.length > 0;
}

function reconcileRelative(compiled, ex, progress) {
  (ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) {
      if (task.kind === "fillRelative") {
        if (fillComplete(compiled, task, progress)) progress.done[task.id] = true;
        else delete progress.done[task.id];
      }
      if (task.kind === "recoverFreq") {
        if (Symbols.complete(compiled, progress.symbols || {})) progress.done[task.id] = true;
        else delete progress.done[task.id];
      }
      if (task.kind === "relative") {
        var got = (progress.got && progress.got[task.id]) || {};
        if (gotSatisfied(task, got)) progress.done[task.id] = true;
        else if (!(progress.done && progress._keepDone)) delete progress.done[task.id];
      }
    });
  });
}

function viewWork(compiled, ex, progress, building) {
  if (!relativeReached(ex, progress)) return null;
  var rows = [];
  var visible = building ? [] : activeRows(ex, progress);
  if (building) {
    ((progress.work && progress.work.added) || []).forEach(function (row) {
      if (REL_ROWS[row]) visible.push(row);
    });
  }
  var columns = building
    ? ((progress.columns || []).filter(function (col) { return col.valueLocked; }))
    : displayRows(compiled);
  visible.forEach(function (kind) {
    var required = requiredRows(ex, progress).indexOf(kind) >= 0;
    rows.push({
      row: kind,
      label: REL_ROWS[kind].label,
      required: required,
      removable: !required,
      cells: columns.map(function (col) {
        var key = col.key || valueKey(col.value);
        var text = progress.work && progress.work.cells && progress.work.cells[kind] ? (progress.work.cells[kind][key] || "") : "";
        return { value: col.value == null ? "" : String(displayValue(col.key ? col : { value: col.value, num: parseNumber(col.value) })), text: text, locked: !!text };
      }),
    });
  });
  var present = {};
  visible.forEach(function (kind) { present[kind] = true; });
  var available = Object.keys(REL_ROWS).filter(function (kind) { return !present[kind]; }).map(function (kind) {
    return { row: kind, label: REL_ROWS[kind].label };
  });
  return { rows: rows, available: available };
}

function attachWork(view, compiled, ex, progress) {
  if (!view || !compiled) return view;
  var building = !!(compiled.build && view.input === "build");
  var work = viewWork(compiled, ex, progress, building);
  if (work) view.work = work;
  var current = currentPart(ex, progress);
  if (current && current.task.kind === "freqBalance" && current.task.goal === "both") {
    var pairInfo = Balance.truth(compiled);
    var pairSolve = (progress && progress.solve) || {};
    if (pairInfo) {
      view.fields = [
        {
          id: "missing",
          label: pairInfo.missingSymbol,
          value: pairSolve.missing != null ? formatInt(pairSolve.missing) : "",
          locked: pairSolve.missing != null,
        },
        {
          id: "total",
          label: compiled.frequencyLabel || "מספר התצפיות",
          value: pairSolve.total != null ? formatInt(pairSolve.total) : "",
          locked: pairSolve.total != null,
        },
      ];
    }
  }
  if (current && current.task.kind === "relative" && formsNeeded(current.task) && formsNeeded(current.task).length > 1) {
    var got = (progress.got && progress.got[current.task.id]) || {};
    view.fields = formsNeeded(current.task).map(function (form) {
      var field = {
        id: form,
        label: form === "fraction" ? "שבר" : form === "percent" ? "אחוזים" : "עשרוני",
        value: got[form] ? String(got[form]).replace(/%$/, "") : "",
        locked: !!got[form],
      };
      if (form === "percent") field.unit = "%";
      return field;
    });
  }
  return view;
}

function workMessage(code) {
  if (code === "duplicate") return "השורה הזו כבר נמצאת בטבלה.";
  if (code === "unknown") return "אי אפשר להוסיף את השורה הזו.";
  if (code === "required") return "השאלה מבקשת להשלים את השורה הזו.";
  if (code === "confirm") return "השורה מולאה גם בצעד מודרך. הסרה תמחק את התאים האלה. לחצו שוב על הסרה כדי לאשר.";
  return "עוד לא.";
}

function changeWork(compiled, ex, progress, request) {
  request = request || {};
  var row = String(request.row || request.kind || "");
  progress.work = progress.work || emptyWork();
  if (!relativeReached(ex, progress)) return { ok: false, message: workMessage("unknown") };
  if (request.action === "add") {
    if (!REL_ROWS[row] || LATER_ROWS[row]) return { ok: false, message: workMessage(REL_ROWS[row] ? "duplicate" : "unknown") };
    if (activeRows(ex, progress).indexOf(row) >= 0) return { ok: false, message: workMessage("duplicate") };
    progress.work.added.push(row);
    return { ok: true, status: "note", message: "השורה נוספה. אפשר למלא רק את התאים שצריך." };
  }
  if (request.action === "remove") {
    if (requiredRows(ex, progress).indexOf(row) >= 0) return { ok: false, message: workMessage("required") };
    if (progress.work.added.indexOf(row) < 0) return { ok: false, message: "השורה לא נמצאת בטבלה." };
    var guided = progress.work.guided && progress.work.guided[row] && progress.work.cells[row] && Object.keys(progress.work.cells[row]).length;
    if (guided && !request.confirm) return { ok: false, confirm: true, message: workMessage("confirm") };
    progress.work.added = progress.work.added.filter(function (item) { return item !== row; });
    if (progress.work.cells) delete progress.work.cells[row];
    if (progress.work.guided) delete progress.work.guided[row];
    return { ok: true, status: "note", message: "השורה הוסרה." };
  }
  return { ok: false, message: workMessage("unknown") };
}

function checkWorkCell(compiled, ex, progress, fill) {
  var kind = String(fill.row || fill.kind || "");
  var row = findRow(compiled.rows, fill.value);
  if (!REL_ROWS[kind] || activeRows(ex, progress).indexOf(kind) < 0) {
    return { ok: false, message: "הוסיפו קודם את השורה לטבלה.", view: null };
  }
  if (!row) return { ok: false, message: "הערך לא מופיע בטבלה." };
  var text = String(fill.typed || "").trim();
  if (!text) return { ok: false, message: "כתבו ערך בתא." };
  var target = relativeTarget(compiled, { value: row.value });
  target.allFreqs = compiled.rows.map(function (item) { return item.freq; });
  if (!cellAccepts(compiled, row, kind, text)) {
    var diagnosed = diagnoseRelative(compiled, { value: row.value, forms: [rowToForm(kind)] }, target, text, rowToForm(kind) === "percent" ? "percent" : "");
    return { ok: false, message: diagnosed || "עוד לא. בדקו שוב את התא." };
  }
  progress.work.cells[kind] = progress.work.cells[kind] || {};
  progress.work.cells[kind][row.key] = canonicalCell(compiled, row, kind, text);
  var current = currentPart(ex, progress);
  var done = false;
  if (current && current.task.kind === "fillRelative" && fillComplete(compiled, current.task, progress)) {
    progress.done[current.task.id] = true;
    done = true;
  }
  return {
    ok: true,
    done: done,
    status: done ? statusAfter(ex, progress, false) : "note",
    message: done ? "" : "התא נכון.",
    shows: done ? [] : [],
  };
}

function consistencyNote(compiled, kind) {
  var form = rowToForm(kind);
  if (form === "percent") return "השכיחויות היחסיות בשורה אינן מסתכמות ל־100%.";
  return "השכיחויות היחסיות בשורה אינן מסתכמות ל־1.";
}

function checkWorkEntries(compiled, ex, progress, packet) {
  var kind = String(packet.row || "");
  var entries = Array.isArray(packet.cells) ? packet.cells : [];
  if (!REL_ROWS[kind]) return { ok: false, message: "השורה לא נמצאת בטבלה." };
  if (activeRows(ex, progress).indexOf(kind) < 0) progress.work.added.push(kind);
  var wrong = [];
  var right = [];
  entries.forEach(function (entry) {
    var row = findRow(compiled.rows, entry.value);
    if (!row) return;
    var text = String(entry.typed || "").trim();
    if (!text) return;
    if (cellAccepts(compiled, row, kind, text)) right.push({ row: row, text: text });
    else wrong.push({ row: row, text: text });
  });
  right.forEach(function (item) {
    progress.work.cells[kind] = progress.work.cells[kind] || {};
    progress.work.cells[kind][item.row.key] = canonicalCell(compiled, item.row, kind, item.text);
  });
  if (wrong.length > 1) {
    return { ok: false, message: consistencyNote(compiled, kind) };
  }
  if (wrong.length === 1) {
    var target = relativeTarget(compiled, { value: wrong[0].row.value });
    target.allFreqs = compiled.rows.map(function (item) { return item.freq; });
    var diagnosed = diagnoseRelative(compiled, { value: wrong[0].row.value }, target, wrong[0].text, rowToForm(kind) === "percent" ? "percent" : "");
    return { ok: false, message: diagnosed || "עוד לא. בדקו שוב את התא." };
  }
  var current = currentPart(ex, progress);
  if (current && current.task.kind === "fillRelative" && fillComplete(compiled, current.task, progress)) {
    progress.done[current.task.id] = true;
  }
  return { ok: true, status: currentPart(ex, progress) ? "note" : "solved", message: currentPart(ex, progress) ? "התאים הנכונים נעולים." : "" };
}

function checkRelativeAnswers(compiled, ex, progress, answers) {
  var current = currentPart(ex, progress);
  if (!current || current.task.kind !== "relative") return { ok: false, message: "עוד לא." };
  var task = current.task;
  var partLabel = current.part.label || "";
  var read = readRelativeState(compiled, task, progress);
  var got = Object.assign({}, (progress.got && progress.got[task.id]) || {});
  var previous = Object.assign({}, got);
  var wrong = "";
  Object.keys(answers || {}).forEach(function (id) {
    var text = String(answers[id] || "").trim();
    if (!text || wrong) return;
    var found = pieceGot(text, read.target, id);
    if ((id === "fraction" && found.fraction) || (id === "percent" && found.percent) || (id === "decimal" && found.decimal)) {
      Object.assign(got, found);
      return;
    }
    wrong = diagnoseRelative(compiled, task, read.target, text, id) || "עוד לא. בדקו שוב את השדה.";
  });
  progress.got = progress.got || {};
  progress.got[task.id] = got;
  if (gotSatisfied(task, got)) {
    progress.done[task.id] = true;
    delete progress.phase[task.id];
  }
  var shows = [];
  (formsNeeded(task) || ["fraction", "decimal", "percent"]).forEach(function (form) {
    if (got[form] && got[form] !== previous[form]) shows.push(String(got[form]));
  });
  if (wrong) return { ok: false, message: wrong, shows: shows, part: partLabel };
  var done = !!progress.done[task.id];
  return {
    ok: true,
    status: done ? statusAfter(ex, progress, false) : "note",
    message: done ? "" : "השדה הנכון נעול.",
    shows: shows,
    part: partLabel,
  };
}

function nextFillAction(compiled, task, progress) {
  progress.work = progress.work || emptyWork();
  var read = readRelativeState(compiled, task, progress);
  if (!read.state.total && !workHasRelative(progress)) {
    if (read.state.summingTotal) return { line: formatInt(read.target.total), joinPrev: true, phase: "total" };
    var expr = formatSum(read.target.allFreqs);
    if (expr === formatInt(read.target.total)) return { line: formatInt(read.target.total), phase: "total" };
    return { line: expr, phase: "expr" };
  }
  var pending = progress.work && progress.work.pending;
  if (pending && pending.row === "relativePercent") {
    var row = compiled.rows.filter(function (item) { return item.key === pending.key; })[0];
    if (row) {
      var text = canonicalPercent(row.freq / tableTotal(compiled));
      return {
        line: text,
        joinPrev: true,
        phase: "total",
        clearPending: true,
        cell: { row: "relativePercent", key: row.key, text: text },
        done: false,
      };
    }
  }
  var forms = task.forms || ["fraction"];
  var f;
  var i;
  for (f = 0; f < forms.length; f++) {
    var kind = formToRow(forms[f]);
    var cells = (progress.work.cells && progress.work.cells[kind]) || {};
    for (i = 0; i < compiled.rows.length; i++) {
      var item = compiled.rows[i];
      if (cells[item.key]) continue;
      if (kind === "relativePercent") {
        var frac = fractionText(item.freq, tableTotal(compiled));
        return { line: "(" + frac + ")·100", phase: "product", pending: { row: kind, key: item.key } };
      }
      var shown = kind === "relativeDecimal"
        ? formatPlain(item.freq / tableTotal(compiled))
        : fractionText(item.freq, tableTotal(compiled));
      return { line: shown, phase: "total", cell: { row: kind, key: item.key, text: shown } };
    }
  }
  return null;
}

function matchTask(compiled, task, typed, progress) {
  if (task.kind === "relative") return matchRelative(compiled, task, typed, progress);
  if (task.kind === "relativeSum") return matchRelativeSum(compiled, task, typed);
  if (task.kind === "identify") return matchIdentify(compiled, task, typed);
  if (task.kind === "scale") return matchScale(compiled, task, typed);
  if (task.kind === "reason") return matchReason(compiled, task, typed);
  if (task.kind === "lookup") return matchLookup(compiled, task, typed);
  if (task.kind === "sumFreq" || task.kind === "total") {
    var summed = matchSum(compiled, task, typed, progress);
    if (summed && summed.ok && summed.done && task.kind === "total") {
      summed.solve = Object.assign({}, (progress && progress.solve) || {}, { total: numericTotal(compiled, task) });
    }
    return summed;
  }
  if (task.kind === "compareRelative") return matchCompare(compiled, task, typed, progress);
  if (task.kind === "weightedSum") return matchWeighted(compiled, task, typed, progress);
  if (task.kind === "mode") return matchMode(compiled, task, typed, progress);
  if (task.kind === "matchValues") return matchValues(compiled, task, typed, progress);
  if (task.kind === "yesNo") return matchYesNo(compiled, task, typed, progress);
  if (task.kind === "fillFreq") return matchFill(compiled, task, typed, progress, null);
  return { ok: false, message: "השאלה לא נתמכת." };
}

function taskIds(ex) {
  var ids = [];
  (ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) {
      ids.push(task.id);
    });
  });
  return ids;
}

function emptyProgress() {
  return { done: {}, phase: {}, found: {}, filled: {} };
}

function sanitizeProgress(ex, raw) {
  var progress = emptyProgress();
  raw = raw || {};
  var allowed = {};
  taskIds(ex).forEach(function (id) { allowed[id] = true; });
  Object.keys(raw.done || {}).forEach(function (id) {
    if (allowed[id] && raw.done[id]) progress.done[id] = true;
  });
  Object.keys(raw.phase || {}).forEach(function (id) {
    if (!allowed[id] || progress.done[id]) return;
    if (raw.phase[id] === "expr" || raw.phase[id] === "value" || raw.phase[id] === "total" || raw.phase[id] === "pick" || raw.phase[id] === "part" || raw.phase[id] === "fraction" || raw.phase[id] === "product" || raw.phase[id] === "scaled") {
      progress.phase[id] = raw.phase[id];
    }
  });
  Object.keys(raw.found || {}).forEach(function (id) {
    if (!allowed[id] || progress.done[id] || !Array.isArray(raw.found[id])) return;
    progress.found[id] = raw.found[id].map(function (item) { return String(item); }).filter(Boolean);
  });
  return progress;
}

function sanitizeFilled(compiled, raw) {
  var filled = {};
  if (!compiled || (!compiled.fill && !compiled.chartSource) || !raw || typeof raw !== "object") return filled;
  compiled.rows.forEach(function (row) {
    if (!Object.prototype.hasOwnProperty.call(raw, row.key)) return;
    var n = Number(raw[row.key]);
    if (sameNum(n, row.freq)) filled[row.key] = row.freq;
  });
  return filled;
}

function sanitizeColumns(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 30).map(function (col) {
    return {
      value: col && col.value != null ? String(col.value).slice(0, 40) : "",
      freq: col && col.freq != null ? String(col.freq).slice(0, 20) : "",
    };
  });
}

function reconcileBuild(compiled, ex, progress) {
  if (!compiled || !compiled.build) return;
  var result = assessColumns(compiled, progress.columns || []);
  progress.columns = result.columns;
  (ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) {
      if (task.kind !== "buildFreq") return;
      if (result.done) progress.done[task.id] = true;
      else delete progress.done[task.id];
    });
  });
}

function reconcileFill(compiled, ex, progress) {
  if (!compiled || (!compiled.fill && !compiled.chartSource)) return;
  (ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) {
      if (task.kind !== "fillFreq") return;
      var complete = compiled.rows.length > 0 && compiled.rows.every(function (row) {
        return Object.prototype.hasOwnProperty.call(progress.filled || {}, row.key);
      });
      if (complete) progress.done[task.id] = true;
      else delete progress.done[task.id];
    });
  });
}

function openTasks(part, progress) {
  return (part.tasks || []).filter(function (task) {
    return !progress.done[task.id];
  });
}

function currentPart(ex, progress) {
  var parts = ex.parts || [];
  var i;
  for (i = 0; i < parts.length; i++) {
    var open = openTasks(parts[i], progress);
    if (open.length) return { part: parts[i], task: open[0], index: i };
  }
  return null;
}

function questionsIn(text) {
  var blocks = [];
  var current = null;
  String(text || "").split("\n").forEach(function (line) {
    var trimmed = line.trim();
    var mark = /^\((\d+)\)\s*(.*)$/.exec(trimmed);
    if (mark) {
      current = { n: Number(mark[1]), lines: mark[2] ? [mark[2]] : [] };
      blocks.push(current);
      return;
    }
    if (current && trimmed) current.lines.push(trimmed);
  });
  return blocks;
}

function activeAsk(part, task) {
  if (task && task.ask) return String(task.ask);
  var text = String((part && part.text) || "").trim();
  var q = task && task.q;
  if (q == null || q === "") return text;
  var blocks = questionsIn(text);
  var i;
  for (i = 0; i < blocks.length; i++) {
    if (blocks[i].n === Number(q)) return blocks[i].lines.join("\n");
  }
  return text;
}

function viewTable(compiled, progress) {
  if (!compiled || !compiled.fill) return null;
  var filled = (progress && progress.filled) || {};
  return {
    variableLabel: compiled.variableLabel,
    frequencyLabel: compiled.frequencyLabel,
    columnOrder: compiled.columnOrder || "given",
    fill: true,
    rows: displayRows(compiled).map(function (row) {
      var locked = Object.prototype.hasOwnProperty.call(filled, row.key);
      return {
        value: displayValue(row),
        freq: locked ? filled[row.key] : null,
        locked: locked,
      };
    }),
  };
}

function staticView(compiled, progress) {
  if (!compiled || compiled.build || compiled.fill) return null;
  var symbols = (progress && progress.symbols) || {};
  var cells = symbols.cells || {};
  var resolved = symbols.resolved || {};
  return {
    variableLabel: compiled.variableLabel,
    frequencyLabel: compiled.frequencyLabel,
    columnOrder: compiled.columnOrder || "given",
    rows: displayRows(compiled).map(function (row) {
      var revealed = row.givenExpr && progress && progress.solve && progress.solve.missing != null;
      if (row.givenExpr && !revealed) {
        return {
          value: displayValue(row),
          freq: null,
          expr: row.givenExpr,
          open: false,
          locked: true,
        };
      }
      if (row.givenExpr && revealed) {
        return {
          value: displayValue(row),
          freq: progress.solve.missing,
          expr: "",
          open: false,
          locked: true,
        };
      }
      var solved = Object.prototype.hasOwnProperty.call(resolved, row.key);
      var open = !!row.missing && !solved;
      var freq = solved ? resolved[row.key] : (row.missing ? null : row.freq);
      return {
        value: displayValue(row),
        freq: freq,
        expr: open ? (cells[row.key] || "") : "",
        open: open,
        locked: !open,
      };
    }),
  };
}

function viewData(compiled) {
  if (!compiled || !compiled.data) return null;
  return compiled.data.map(displayDatum);
}

function viewBuild(compiled, progress, building) {
  if (!compiled || !compiled.build) return null;
  if (building) {
    return {
      build: true,
      variableLabel: compiled.variableLabel,
      frequencyLabel: compiled.frequencyLabel,
      columns: ((progress && progress.columns) || []).map(function (col) {
        return {
          value: col.value == null ? "" : String(col.value),
          freq: col.freq == null ? "" : String(col.freq),
          valueLocked: !!col.valueLocked,
          freqLocked: !!col.freqLocked,
        };
      }),
    };
  }
  var source = compiled.ordered || compiled.rows;
  if (!compiled.quantitative && progress && progress.columns && progress.columns.length) {
    var kept = [];
    progress.columns.forEach(function (col) {
      if (!col.valueLocked || !col.freqLocked) return;
      var row = findRow(compiled.rows, col.value);
      if (row) kept.push(row);
    });
    if (kept.length === compiled.rows.length) source = kept;
  }
  return {
    variableLabel: compiled.variableLabel,
    frequencyLabel: compiled.frequencyLabel,
    columnOrder: compiled.quantitative ? "asc" : "given",
    rows: source.map(function (row) {
      return { value: displayValue(row), freq: row.freq, locked: true };
    }),
  };
}

function chartTableView(compiled, progress) {
  var filled = (progress && progress.filled) || {};
  return {
    variableLabel: compiled.variableLabel,
    frequencyLabel: compiled.frequencyLabel,
    columnOrder: compiled.columnOrder || "asc",
    fill: true,
    rows: displayRows(compiled).map(function (row) {
      var locked = Object.prototype.hasOwnProperty.call(filled, row.key);
      return {
        value: displayValue(row),
        freq: locked ? filled[row.key] : null,
        locked: locked,
      };
    }),
  };
}

function chartTableVisible(compiled, ex, progress) {
  if (!compiled || !compiled.chartSource) return false;
  var current = currentPart(ex, progress);
  if (current && current.task.kind === "fillFreq") return true;
  var filled = (progress && progress.filled) || {};
  return compiled.rows.length > 0 && compiled.rows.every(function (row) {
    return Object.prototype.hasOwnProperty.call(filled, row.key);
  });
}

function decorateChart(view, compiled, ex, progress) {
  if (!view || !compiled || !compiled.chart) return view;
  view.chart = compiled.chart;
  if (compiled.chartSource) {
    if (chartTableVisible(compiled, ex, progress)) view.table = chartTableView(compiled, progress);
    else delete view.table;
    delete view.data;
  }
  var current = currentPart(ex, progress);
  if (current && current.task.kind === "compareRelative") {
    view.input = "yesno";
    if (compareReady(compareBag(progress, current.task))) view.entry = "choice";
  }
  return view;
}

function viewOf(ex, progress, compiled) {
  if (progress && progress._history) delete progress._history;
  var current = currentPart(ex, progress);
  var building = !!(current && current.task.kind === "buildFreq");
  var table = compiled && compiled.build
    ? viewBuild(compiled, progress, building)
    : compiled && compiled.fill
      ? viewTable(compiled, progress)
      : staticView(compiled, progress);
  var data = viewData(compiled);
  if (!current) {
    var solved = { part: null, ask: "", input: "text", solved: true };
    if (table) solved.table = table;
    if (data) solved.data = data;
    return decorateChart(attachWork(solved, compiled, ex, progress), compiled, ex, progress);
  }
  var input = "text";
  if (current.task.kind === "yesNo" || current.task.kind === "compareRelative") input = "yesno";
  if (current.task.kind === "fillFreq") input = "cells";
  if (current.task.kind === "buildFreq") input = "build";
  var view = {
    part: { label: current.part.label || "", text: current.part.text || "" },
    ask: activeAsk(current.part, current.task),
    input: input,
    solved: false,
  };
  if (table) view.table = table;
  if (data) view.data = data;
  return decorateChart(attachWork(view, compiled, ex, progress), compiled, ex, progress);
}

function applyMatch(progress, task, result) {
  if (result.filled) progress.filled = result.filled;
  if (result.found) progress.found[task.id] = result.found;
  if (result.phase) progress.phase[task.id] = result.phase;
  if (result.got) {
    progress.got = progress.got || {};
    progress.got[task.id] = Object.assign({}, progress.got[task.id] || {}, result.got);
  }
  if (result.workCell) {
    progress.work = progress.work || emptyWork();
    var cell = result.workCell;
    progress.work.cells[cell.row] = progress.work.cells[cell.row] || {};
    progress.work.cells[cell.row][cell.key] = cell.text;
    progress.work.guided[cell.row] = true;
  }
  if (result.pending) {
    progress.work = progress.work || emptyWork();
    progress.work.pending = result.pending;
  }
  if (result.clearPending && progress.work) progress.work.pending = null;
  if (result.symbols) progress.symbols = result.symbols;
  if (result.solve) progress.solve = result.solve;
  if (result.done) {
    progress.done[task.id] = true;
    delete progress.phase[task.id];
  }
}

function hintForTask(compiled, task, progress, engine) {
  if (task.kind === "freqBalance") return Balance.hint(engine, compiled, task, progress);
  if ((task.kind === "relative" || task.kind === "fillRelative") && Balance.pending(compiled, progress)) {
    return Balance.hint(engine, compiled, task, progress);
  }
  if (task.kind === "recoverFreq") return Symbols.hint(engine, compiled, task, progress);
  if (task.kind === "relativeSum") {
    var forms = formsNeeded(task) || [];
    if (forms.length === 1 && forms[0] === "percent") return "סכום כל השכיחויות היחסיות הוא 100%.";
    return "סכום כל השכיחויות היחסיות הוא 1.";
  }
  if (task.kind === "relative") {
    if (compiled && compiled.chartSource) return chartRelativeHint(compiled, task, progress);
    return hintRelative(compiled, task, progress);
  }
  if (task.kind === "fillRelative") {
    var read = readRelativeState(compiled, task, progress);
    if (!read.state.total && !workHasRelative(progress)) {
      return "כדי להשלים שכיחות יחסית, חברו קודם את כל השכיחויות.";
    }
    return "השלימו את תאי השורות שהשאלה מבקשת. בשבר כתבו שכיחות חלקי מספר התצפיות, בלי לצמצם.";
  }
  var phase = progress.phase[task.id] || "";
  var found = progress.found[task.id] || [];
  if (task.kind === "identify" && task.role === "frequency") {
    return "הסתכלו בכותרות הטבלה ומצאו את השורה שמתארת את השכיחות — כמה פעמים כל ערך מופיע.";
  }
  if (task.kind === "identify") {
    return "הסתכלו בכותרות הטבלה ומצאו את השורה שמתארת את המשתנה — מה שנמדד בכל עמודה.";
  }
  if (task.kind === "scale" && task.depth === "full") {
    return "הסתכלו בערכי המשתנה: שמות או קטגוריות, מספרים נפרדים, או מדידה שיכולה לקבל כל ערך.";
  }
  if (task.kind === "scale") {
    return "אם ערכי המשתנה הם מספרים שאפשר לחבר ולהשוות, המשתנה כמותי. אם הם שמות או קטגוריות, המשתנה איכותי.";
  }
  if (task.kind === "reason") {
    return "כתבו משפט שמסביר את הסיווג לפי אופי הערכים בטבלה.";
  }
  if (task.kind === "compareRelative") return compareHint(compiled, task, progress);
  if (task.kind === "lookup") {
    if (compiled && compiled.chartSource) return "מצאו את הערך בציר האופקי ובדקו לאיזה גובה מגיעה העמודה שלו.";
    return "מצאו בטבלה את הערך המבוקש, וקראו את השכיחות שמתאימה לו.";
  }
  if (task.kind === "mode" && task.of === "frequency") {
    return "חפשו בשורת השכיחויות את המספר הגדול ביותר.";
  }
  if (task.kind === "mode") {
    if (found.length) return "יש יותר מערך אחד עם אותה שכיחות מקסימלית. רשמו גם את האחרים.";
    if (compiled && compiled.chartSource) return "מצאו את העמודה הגבוהה ביותר, ורשמו את הערך שמתחתיה.";
    return "חפשו בשורת השכיחויות את הערך הגדול ביותר, ובדקו לאיזה ערך של המשתנה הוא שייך.";
  }
  if (task.kind === "matchValues") {
    if (found.length) return "יש עוד ערכים שמקיימים את התנאי. המשיכו לבדוק את הטבלה.";
    if (task.where && task.where.on === "variable") {
      return "מצאו את ערכי המשתנה שמקיימים את התנאי, ורשמו אותם.";
    }
    return "עברו על השכיחויות ובדקו אילו מהן מקיימות את התנאי. רשמו את ערכי המשתנה המתאימים.";
  }
  if (task.kind === "fillFreq") {
    if (compiled && compiled.chartSource) {
      return progress.filled && Object.keys(progress.filled).length
        ? "המשיכו לקרוא את גובה העמודות שהתא שלהן עוד פתוח."
        : "לכל ערך, קראו את גובה העמודה שלו וכתבו את המספר בתא השכיחות.";
    }
    if (nextOpenRow(compiled, progress) && progress.filled && Object.keys(progress.filled).length) {
      return "המשיכו לספור ברשימה את הערכים שהתא שלהם עוד פתוח.";
    }
    return "לכל ערך בטבלה, ספרו כמה פעמים הוא מופיע ברשימת הנתונים וכתבו את זה בתא שמתחתיו.";
  }
  if (task.kind === "buildFreq") {
    var built = assessColumns(compiled, (progress && progress.columns) || []);
    if (built.status === "note") {
      return "הערכים והשכיחויות נכונים. סדרו את ערכי המשתנה מהקטן לגדול: הקטן ביותר מימין, והגדולים משמאלו.";
    }
    if (!built.ok && built.message.indexOf("אינו מופיע") >= 0) {
      return "כל ערך בעמודה צריך להופיע בנתונים. מחקו ערך שלא מופיע.";
    }
    if (!built.ok && built.message.indexOf("יותר מעמודה") >= 0) {
      return "כל ערך מופיע בעמודה אחת. מחקו את העמודה הכפולה.";
    }
    if (!built.ok && built.message.indexOf("מיותרת") >= 0) {
      return "יש עמודה בלי ערך מהנתונים. מחקו אותה.";
    }
    var openFreq = built.columns.some(function (col) { return col.valueLocked && !col.freqLocked; });
    var anyValue = built.columns.some(function (col) { return col.valueLocked; });
    if (openFreq) return "ספרו כמה פעמים מופיע הערך שכתבתם, וכתבו את המספר בתא השכיחות.";
    if (anyValue && built.missing) return "יש עוד ערך שמופיע בנתונים ואין לו עמודה. מצאו אותו והוסיפו עמודה.";
    if (!anyValue) return "הוסיפו עמודה לכל ערך שונה שמופיע בנתונים, וכתבו מתחתיו כמה פעמים הוא מופיע.";
    return "השלימו את הטבלה: לכל ערך מהנתונים עמודה אחת, ובה השכיחות שלו.";
  }
  if (task.kind === "yesNo") {
    if (phase === "value") return "השוו את התוצאה לתנאי שבשאלה, וענו כן או לא.";
    if (task.against === "half" && !phase) {
      return "חשבו את הגודל שהשאלה בודקת, והשוו אותו למחצית מכלל הנתונים. אחר כך ענו כן או לא.";
    }
    if (phase === "expr") return "חשבו את התוצאה, ואחר כך ענו כן או לא.";
    if (task.calc && task.calc.kind === "weightedSum") {
      return "כפלו כל ערך של המשתנה בשכיחות שלו, ואז חברו את המכפלות. בסוף ענו כן או לא.";
    }
    return "חשבו קודם את הגודל שהשאלה בודקת, ואחר כך ענו כן או לא.";
  }
  if (task.kind === "weightedSum") {
    return phase === "expr"
      ? "חשבו את סכום המכפלות."
      : "כפלו כל ערך של המשתנה בשכיחות שלו, ואז חברו את המכפלות.";
  }
  if (phase === "expr") {
    return compiled && compiled.chartSource ? "חברו את גובהי העמודות המתאימות." : "חברו את השכיחויות שמצאתם.";
  }
  if (task.kind === "total") {
    return compiled && compiled.chartSource
      ? "גובה כל עמודה מייצג שכיחות. חברו את השכיחויות של כל העמודות."
      : "חברו את כל השכיחויות שבטבלה.";
  }
  if (task.kind === "sumFreq" && compiled && compiled.chartSource) {
    return "זהו תחילה אילו ערכים בציר האופקי מקיימים את התנאי.";
  }
  return "הסתכלו בטבלה ומצאו תחילה את השכיחויות המתאימות לערכים המבוקשים.";
}

function compareHint(compiled, task, progress) {
  var got = compareBag(progress, task);
  if (compareReady(got)) return "השוו את שתי השכיחויות היחסיות וענו כן או לא.";
  if (got.rightFreq && !got.rightFraction) return "חלקו את השכיחות שמצאתם במספר הכולל.";
  if (got.rightValues && !got.rightFreq && !got.rightFraction) return "חברו את גובהי העמודות המתאימות.";
  if ((got.leftFraction || got.compared) && !got.rightValues && !got.rightFreq && !got.rightFraction) {
    return "זהו תחילה אילו ערכים בציר האופקי מקיימים את התנאי השני.";
  }
  if ((got.leftFreq || got.leftExpr) && !got.leftFraction) return "חלקו את השכיחות שמצאתם במספר הכולל.";
  if (got.leftValues && !got.leftFreq && !got.leftFraction) return "חברו את גובהי העמודות המתאימות.";
  return "זהו תחילה אילו ערכים בציר האופקי מקיימים את התנאי.";
}

function chartRelativeHint(compiled, task, progress) {
  var read = readRelativeState(compiled, task, progress);
  if (read.state.fraction || read.state.percent || read.state.decimal) {
    if (wantsPercent(task) && !read.state.percent) return "המירו את השכיחות היחסית שקיבלתם לאחוזים.";
    return "חלקו את השכיחות שמצאתם במספר הכולל.";
  }
  if (read.state.part && read.state.total) return "חלקו את השכיחות שמצאתם במספר הכולל.";
  if (read.state.total) return "חברו את גובהי העמודות המתאימות.";
  return "זהו תחילה אילו ערכים בציר האופקי מקיימים את התנאי.";
}

function guidedExpr(compiled, task) {
  if (task.kind === "weightedSum") return formatWeighted(compiled.rows);
  var freqs = freqList(compiled, task);
  var nonzero = freqs.filter(function (freq) { return !sameNum(freq, 0); });
  var nums = nonzero.length ? nonzero : [0];
  return formatSum(nums);
}

function nextLine(compiled, task, progress) {
  var phase = progress.phase[task.id] || "";
  if (task.kind === "buildFreq") return null;
  if (task.kind === "fillFreq") {
    var openRow = nextOpenRow(compiled, progress);
    return openRow ? fillShow(openRow) : null;
  }
  if (task.kind === "relativeSum") {
    var sumForms = formsNeeded(task) || [];
    if (sumForms.length === 1 && sumForms[0] === "percent") return "100%";
    return "1";
  }
  if (task.kind === "identify") {
    return task.role === "frequency" ? compiled.frequencyLabel : compiled.variableLabel;
  }
  if (task.kind === "scale") return scaleAnswer(compiled, task);
  if (task.kind === "reason") return canonicalReason(scaleKind(compiled));
  if (task.kind === "lookup") {
    var row = findRow(compiled.rows, task.value);
    return row ? formatInt(row.freq) : null;
  }
  if (task.kind === "mode" && task.of === "frequency") return formatInt(maxFreq(compiled));
  if (task.kind === "mode") return formatList(modeRows(compiled));
  if (task.kind === "matchValues") return formatList(rowsFor(compiled, task));
  if (task.kind === "yesNo") {
    if (phase === "value") return verdictWord(compiled, task);
    var calc = Object.assign({ id: task.id }, task.calc || { kind: "total" });
    if (phase === "expr") return formatInt(numericTotal(compiled, calc));
    var expr = guidedExpr(compiled, calc);
    var totalText = formatInt(numericTotal(compiled, calc));
    return expr === totalText ? totalText : expr;
  }
  if (phase === "expr") return formatInt(numericTotal(compiled, task));
  var expression = guidedExpr(compiled, task);
  var asTotal = formatInt(numericTotal(compiled, task));
  return expression === asTotal ? asTotal : expression;
}

function statusAfter(ex, progress, advancedOnly) {
  if (!currentPart(ex, progress)) return "solved";
  if (advancedOnly) return "step";
  return "task";
}

function messageFor(status, detail) {
  if (detail) return detail;
  if (status === "solved") return "כל הסעיפים נכונים.";
  if (status === "step") return "אפשר להמשיך.";
  return "אפשר להמשיך.";
}

function findLevel(engine, levelId) {
  var levels = (engine.DoctematicaCurriculum && engine.DoctematicaCurriculum.levels) || [];
  var i;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === levelId && levels[i].mode === "freq-table") return levels[i];
  }
  return null;
}

function findExercise(engine, levelId, n, index, exerciseId) {
  var level = findLevel(engine, levelId);
  if (!level) return null;
  var list = level.exercises || [];
  var i;
  if (exerciseId) {
    for (i = 0; i < list.length; i++) {
      if (list[i].id === exerciseId) return { level: level, ex: list[i], index: i };
    }
    return null;
  }
  if (index != null && index >= 0 && list[index]) return { level: level, ex: list[index], index: index };
  if (n != null) {
    for (i = 0; i < list.length; i++) {
      if (list[i].n === Number(n)) return { level: level, ex: list[i], index: i };
    }
  }
  return null;
}

function respond(ex, compiled, progress, extra) {
  extra = extra || {};
  if (progress && progress._history) delete progress._history;
  return {
    ok: extra.ok !== false,
    status: extra.status || "",
    message: extra.message || "",
    shows: extra.shows || [],
    joinPrev: !!extra.joinPrev,
    lines: extra.lines || null,
    part: extra.part || "",
    progress: progress,
    view: viewOf(ex, progress, compiled),
  };
}

function checkTyped(engine, compiled, ex, typed, progress, fill, priorColumns) {
  var current = currentPart(ex, progress);
  if (!current) {
    return respond(ex, compiled, progress, {
      ok: true,
      status: "solved",
      message: "כל הסעיפים נכונים.",
    });
  }
  if (current.task.kind === "freqBalance" || Balance.pending(compiled, progress)) {
    var balanced = Balance.check(engine, compiled, current.task, typed, progress);
    if (balanced && (balanced.ok || current.task.kind === "freqBalance" || balanced.confident)) {
      if (!balanced.ok) {
        return {
          ok: false,
          message: balanced.message || "עוד לא.",
          view: viewOf(ex, progress, compiled),
          progress: progress,
        };
      }
      var balanceDone = current.task.kind === "freqBalance" && !!balanced.done;
      applyMatch(progress, current.task, {
        ok: true,
        done: balanceDone,
        shows: balanced.shows || [],
        solve: balanced.solve,
        message: balanced.message || "",
      });
      var balanceStatus = statusAfter(ex, progress, !balanceDone);
      return respond(ex, compiled, progress, {
        status: balanceStatus,
        message: messageFor(balanceStatus, balanced.message),
        shows: balanced.shows || [],
        part: current.part.label || "",
      });
    }
  }
  if (current.task.kind === "recoverFreq") {
    var recovered = Symbols.check(engine, compiled, current.task, typed, progress, fill || null);
    if (!recovered.ok) {
      return {
        ok: false,
        message: recovered.message || "עוד לא.",
        view: viewOf(ex, progress, compiled),
        progress: progress,
      };
    }
    applyMatch(progress, current.task, recovered);
    Symbols.apply(compiled, progress.symbols);
    var recoveredStatus = statusAfter(ex, progress, !recovered.done);
    return respond(ex, compiled, progress, {
      status: recoveredStatus,
      message: messageFor(recoveredStatus, recovered.message),
      shows: recovered.shows || [],
      part: current.part.label || "",
    });
  }
  if (current.task.kind === "buildFreq") {
    var previous = priorColumns || [];
    var built = assessColumns(compiled, progress.columns || []);
    progress.columns = built.columns;
    if (built.done) progress.done[current.task.id] = true;
    else delete progress.done[current.task.id];
    if (!built.ok) {
      return {
        ok: false,
        message: built.message || "עוד לא.",
        view: viewOf(ex, progress, compiled),
        progress: progress,
      };
    }
    var builtStatus = built.status === "note" ? "note" : statusAfter(ex, progress, false);
    return respond(ex, compiled, progress, {
      status: builtStatus,
      message: built.status === "note" ? built.message : messageFor(builtStatus, built.message),
      shows: built.status === "note" ? [] : newBuildShows(previous, built.columns, compiled),
      part: current.part.label || "",
    });
  }
  if (current.task.kind === "fillFreq") {
    var filledResult = matchFill(compiled, current.task, typed, progress, fill || null);
    if (!filledResult.ok) {
      return {
        ok: false,
        message: filledResult.message || "עוד לא.",
        view: viewOf(ex, progress, compiled),
        progress: progress,
      };
    }
    applyMatch(progress, current.task, filledResult);
    var filledStatus = statusAfter(ex, progress, false);
    return respond(ex, compiled, progress, {
      status: filledStatus,
      message: messageFor(filledStatus, filledResult.message),
      shows: filledResult.shows || [],
      part: current.part.label || "",
    });
  }
  var open = openTasks(current.part, progress);
  var hits = [];
  var focusMiss = null;
  open.forEach(function (task) {
    var result = matchTask(compiled, task, typed, progress);
    if (result && result.ok) hits.push({ task: task, result: result });
    else if (task.id === open[0].id) focusMiss = result;
  });
  if (!hits.length) {
    return {
      ok: false,
      message: (focusMiss && focusMiss.message) || "עוד לא.",
      view: viewOf(ex, progress, compiled),
      progress: progress,
    };
  }
  var shows = [];
  var detail = "";
  var onlySteps = true;
  var joinPrev = false;
  hits.forEach(function (hit) {
    applyMatch(progress, hit.task, hit.result);
    (hit.result.shows || []).forEach(function (line) {
      if (line) shows.push(line);
    });
    if (hit.result.joinPrev) joinPrev = true;
    if (hit.result.done) onlySteps = false;
    if (hit.result.message) detail = hit.result.message;
  });
  var status = statusAfter(ex, progress, onlySteps);
  return respond(ex, compiled, progress, {
    status: status,
    message: messageFor(status, detail),
    shows: shows,
    joinPrev: joinPrev,
    part: current.part.label || "",
  });
}

function hintResponse(engine, compiled, ex, progress) {
  var current = currentPart(ex, progress);
  if (!current) {
    return respond(ex, compiled, progress, { status: "solved", message: "כל הסעיפים נכונים." });
  }
  return respond(ex, compiled, progress, {
    status: "hint",
    message: hintForTask(compiled, current.task, progress, engine),
    part: current.part.label || "",
  });
}

function stepBuildOnce(compiled, ex, progress) {
  var current = currentPart(ex, progress);
  if (!current) return null;
  var action = nextBuildAction(compiled, progress.columns || []);
  if (!action) return null;
  progress.columns = action.columns;
  if (action.done) progress.done[current.task.id] = true;
  else delete progress.done[current.task.id];
  return {
    part: current.part.label || "",
    shows: action.shows || [],
    result: action,
  };
}

function stepOnce(engine, compiled, ex, progress) {
  Symbols.apply(compiled, progress.symbols);
  var current = currentPart(ex, progress);
  if (!current) return null;
  if (current.task.kind === "freqBalance" || Balance.pending(compiled, progress)) {
    var balancedStep = Balance.step(engine, compiled, current.task, progress);
    if (!balancedStep) return null;
    var balanceMarked = {
      ok: true,
      done: current.task.kind === "freqBalance" && !!balancedStep.done,
      shows: balancedStep.shows || [],
      solve: balancedStep.solve,
      message: "",
    };
    applyMatch(progress, current.task, balanceMarked);
    return { part: current.part.label || "", shows: balanceMarked.shows, result: balanceMarked };
  }
  if (current.task.kind === "recoverFreq") {
    var recovered = Symbols.step(engine, compiled, current.task, progress);
    if (!recovered) return null;
    var marked = {
      ok: true,
      done: !!recovered.done,
      shows: recovered.shows || [],
      symbols: recovered.symbols,
      message: "",
    };
    applyMatch(progress, current.task, marked);
    Symbols.apply(compiled, progress.symbols);
    return { part: current.part.label || "", shows: marked.shows, result: marked };
  }
  if (current.task.kind === "buildFreq") return stepBuildOnce(compiled, ex, progress);
  if (current.task.kind === "compareRelative") {
    var compared = nextCompare(compiled, current.task, progress);
    if (!compared) return null;
    var comparedMarked = {
      ok: true,
      done: !!compared.done,
      shows: [compared.line],
      joinPrev: !!compared.joinPrev,
      got: compared.got,
      message: "",
    };
    applyMatch(progress, current.task, comparedMarked);
    return { part: current.part.label || "", shows: [compared.line], result: comparedMarked };
  }
  if (current.task.kind === "relative" || current.task.kind === "fillRelative") {
    var action = current.task.kind === "fillRelative"
      ? nextFillAction(compiled, current.task, progress)
      : nextRelativeAction(compiled, current.task, progress);
    if (!action) return null;
    var guided = {
      ok: true,
      done: !!action.done,
      phase: action.phase || "",
      shows: [action.line],
      joinPrev: !!action.joinPrev,
      message: "",
      got: action.got,
      solve: action.solve,
      workCell: action.cell,
      pending: action.pending,
      clearPending: !!action.clearPending,
    };
    applyMatch(progress, current.task, guided);
    if (current.task.kind === "fillRelative" && fillComplete(compiled, current.task, progress)) {
      progress.done[current.task.id] = true;
      delete progress.phase[current.task.id];
      guided.done = true;
    }
    return { part: current.part.label || "", shows: [action.line], result: guided };
  }
  var phaseBefore = (progress.phase && progress.phase[current.task.id]) || "";
  var line = nextLine(compiled, current.task, progress);
  if (line == null) return null;
  var result = matchTask(compiled, current.task, line, progress);
  if (!result || !result.ok) return null;
  if (phaseBefore === "expr" && (result.shows || []).length) result.joinPrev = true;
  var before = JSON.stringify(progress);
  applyMatch(progress, current.task, result);
  if (JSON.stringify(progress) === before && !(result.shows || []).length) return null;
  return {
    part: current.part.label || "",
    shows: result.shows && result.shows.length ? result.shows : [line],
    result: result,
  };
}

function stepResponse(engine, compiled, ex, progress) {
  var stepped = stepOnce(engine, compiled, ex, progress);
  if (!stepped) {
    return { ok: false, message: "אין צעד נוסף.", view: viewOf(ex, progress, compiled), progress: progress };
  }
  var onlySteps = !stepped.result.done;
  var status = statusAfter(ex, progress, onlySteps);
  return respond(ex, compiled, progress, {
    status: status,
    message: stepped.result.message || (status === "solved" ? "כל הסעיפים נכונים." : "הצעד נוסף."),
    shows: stepped.shows,
    joinPrev: !!(stepped.result && stepped.result.joinPrev),
    part: stepped.part,
  });
}

function solutionResponse(engine, compiled, ex, progress) {
  var lines = [];
  var guard = 0;
  while (currentPart(ex, progress) && guard < 80) {
    guard += 1;
    var stepped = stepOnce(engine, compiled, ex, progress);
    if (!stepped) break;
    stepped.shows.forEach(function (show, index) {
      lines.push({
        part: stepped.part,
        show: show,
        joinPrev: index === 0 && !!(stepped.result && stepped.result.joinPrev),
      });
    });
  }
  return respond(ex, compiled, progress, {
    status: currentPart(ex, progress) ? "task" : "solved",
    message: "כל הסעיפים נכונים.",
    lines: lines,
    shows: [],
  });
}

function loadExercise(engine, body) {
  body = body || {};
  var found = findExercise(engine, body.levelId, body.n, body.exerciseIndex, body.exerciseId);
  if (!found) return null;
  return found;
}

function handle(engine, body) {
  var found = loadExercise(engine, body);
  if (!found) return { error: "unknown exercise", message: "unknown exercise" };
  if (found.ex.pie) return Pie.handle(engine, body, found);
  var compiled = compileExercise(found.ex);
  Balance.materialize(compiled);
  var progress = sanitizeProgress(found.ex, body.progress);
  progress.filled = sanitizeFilled(compiled, body.progress && body.progress.filled);
  progress.work = sanitizeWork(compiled, body.progress && body.progress.work);
  progress.got = sanitizeGot(compiled, found.ex, body.progress && body.progress.got);
  progress.symbols = Symbols.sanitize(engine, compiled, body.progress && body.progress.symbols);
  Symbols.apply(compiled, progress.symbols);
  progress.solve = Balance.sanitize(compiled, body.progress && body.progress.solve);
  var keptTotal = body.progress && body.progress.solve && body.progress.solve.total;
  if (keptTotal != null && sameNum(keptTotal, tableTotal(compiled))) progress.solve.total = tableTotal(compiled);
  Balance.materialize(compiled);
  progress._history = Array.isArray(body.history) ? body.history.map(function (line) { return String(line); }).slice(-40) : [];
  reconcileRelative(compiled, found.ex, progress);
  var priorColumns = sanitizeColumns(body.progress && body.progress.columns);
  var incoming = sanitizeColumns(body.columns != null ? body.columns : priorColumns);
  progress.columns = incoming;
  reconcileFill(compiled, found.ex, progress);
  var intent = String(body.intent || "check");
  if (intent === "check" && compiled.build) {
    var preview = assessColumns(compiled, incoming);
    (found.ex.parts || []).forEach(function (part) {
      (part.tasks || []).forEach(function (task) {
        if (task.kind === "buildFreq" && !preview.done) delete progress.done[task.id];
      });
    });
    return checkTyped(engine, compiled, found.ex, body.typed, progress, body.fill, priorColumns);
  }
  reconcileBuild(compiled, found.ex, progress);
  if (intent === "work") {
    var changed = changeWork(compiled, found.ex, progress, body.work || {});
    changed.view = viewOf(found.ex, progress, compiled);
    changed.progress = progress;
    return changed;
  }
  if (body.entries && body.entries.row) {
    var batch = checkWorkEntries(compiled, found.ex, progress, body.entries);
    batch.view = viewOf(found.ex, progress, compiled);
    batch.progress = progress;
    return batch;
  }
  if (body.fill && (body.fill.row || body.fill.kind)) {
    var cell = checkWorkCell(compiled, found.ex, progress, body.fill);
    cell.view = viewOf(found.ex, progress, compiled);
    cell.progress = progress;
    return cell;
  }
  if (body.answers && Object.keys(body.answers).some(function (key) { return String(body.answers[key] || "").trim(); })) {
    var open = currentPart(found.ex, progress);
    if (open && open.task.kind === "freqBalance" && open.task.goal === "both") {
      var paired = Balance.acceptPair(compiled, open.task, body.answers, progress);
      if (paired) {
        if (!paired.ok) {
          if (paired.solve) progress.solve = paired.solve;
          return {
            ok: false,
            message: paired.message || "עוד לא.",
            shows: paired.shows || [],
            part: open.part.label || "",
            view: viewOf(found.ex, progress, compiled),
            progress: progress,
          };
        }
        applyMatch(progress, open.task, {
          ok: true,
          done: !!paired.done,
          shows: paired.shows || [],
          solve: paired.solve,
          message: paired.message || "",
        });
        var pairStatus = statusAfter(found.ex, progress, !paired.done);
        return respond(found.ex, compiled, progress, {
          status: pairStatus,
          message: messageFor(pairStatus, paired.message),
          shows: paired.shows || [],
          part: open.part.label || "",
        });
      }
    }
    var fields = checkRelativeAnswers(compiled, found.ex, progress, body.answers);
    fields.view = viewOf(found.ex, progress, compiled);
    fields.progress = progress;
    return fields;
  }
  if (intent === "hint") return hintResponse(engine, compiled, found.ex, progress);
  if (intent === "step") return stepResponse(engine, compiled, found.ex, progress);
  if (intent === "solution") return solutionResponse(engine, compiled, found.ex, progress);
  return checkTyped(engine, compiled, found.ex, body.typed, progress, body.fill, priorColumns);
}

function openingView(engine, levelId, index, exerciseId) {
  var found = findExercise(engine, levelId, null, index, exerciseId);
  if (!found) return null;
  if (found.ex.pie) return Pie.openingView(found);
  var compiled = compileExercise(found.ex);
  var progress = emptyProgress();
  progress.solve = Balance.emptySolve();
  progress.columns = [];
  Balance.materialize(compiled);
  return viewOf(found.ex, progress, compiled);
}

function withState(task, state) {
  var id = task.id || "t";
  var progress = emptyProgress();
  state = state || {};
  if (state.phase) progress.phase[id] = state.phase;
  if (state.found) progress.found[id] = state.found.slice();
  return { id: id, progress: progress, task: Object.assign({ id: id }, task) };
}

function preparePacked(table, task, state, data) {
  var packed = withState(task, state);
  var compiled = compileTable(table, data, state && state.entries);
  packed.progress.solve = Balance.sanitize(compiled, state && state.solve);
  Balance.materialize(compiled);
  packed.progress.filled = sanitizeFilled(compiled, state && state.filled);
  packed.progress.columns = sanitizeColumns(state && state.columns);
  if (compiled.build) reconcileBuild(compiled, { parts: [{ tasks: [packed.task] }] }, packed.progress);
  return { packed: packed, compiled: compiled };
}

function assess(table, task, typed, state, data) {
  var ready = preparePacked(table, task, state, data);
  if (task && task.kind === "buildFreq") {
    return assessColumns(ready.compiled, ready.packed.progress.columns);
  }
  if (state && state.fill) {
    return matchFill(ready.compiled, ready.packed.task, typed, ready.packed.progress, state.fill);
  }
  return matchTask(ready.compiled, ready.packed.task, typed, ready.packed.progress);
}

function hintText(table, task, state, data) {
  var ready = preparePacked(table, task, state, data);
  return hintForTask(ready.compiled, ready.packed.task, ready.packed.progress);
}

function nextStep(table, task, state, data) {
  var ready = preparePacked(table, task, state, data);
  if (task && task.kind === "buildFreq") {
    var action = nextBuildAction(ready.compiled, ready.packed.progress.columns);
    return { line: action && action.shows ? action.shows[0] : null, result: action, columns: action && action.columns };
  }
  var line = nextLine(ready.compiled, ready.packed.task, ready.packed.progress);
  var result = line == null ? null : matchTask(ready.compiled, ready.packed.task, line, ready.packed.progress);
  return { line: line, result: result };
}

module.exports = {
  handle: handle,
  openingView: openingView,
  assess: assess,
  hintText: hintText,
  nextStep: nextStep,
  compileTable: compileTable,
};
