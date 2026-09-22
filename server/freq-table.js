"use strict";

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
    var freq = Number(row.freq);
    return {
      value: value,
      key: valueKey(value),
      num: num,
      freq: freq,
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
  };
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

function matchLookup(compiled, task, typed) {
  var row = findRow(compiled.rows, task.value);
  if (!row) return { ok: false, message: "הערך לא מופיע בטבלה." };
  var n = loneNumber(typed);
  if (n == null || !sameNum(n, row.freq)) {
    return { ok: false, message: "מצאו את הערך בטבלה וכתבו את השכיחות שמתאימה לו." };
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
      return { ok: false, message: "זה לא הסכום. אפשר גם לרשום קודם את תרגיל החיבור." };
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
    return { ok: false, message: "כתבתם את הערך " + valueText + " עצמו. בתא צריך את מספר הפעמים שהוא מופיע ברשימה." };
  }
  if (sameNum(Math.abs(n - row.freq), 1)) {
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
  return { ok: false, message: "השכיחות של " + valueText + " אינה נכונה. עברו שוב על הרשימה וספרו את כל המופעים של הערך הזה." };
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

function matchTask(compiled, task, typed, progress) {
  if (task.kind === "identify") return matchIdentify(compiled, task, typed);
  if (task.kind === "scale") return matchScale(compiled, task, typed);
  if (task.kind === "reason") return matchReason(compiled, task, typed);
  if (task.kind === "lookup") return matchLookup(compiled, task, typed);
  if (task.kind === "sumFreq" || task.kind === "total") return matchSum(compiled, task, typed, progress);
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
    if (raw.phase[id] === "expr" || raw.phase[id] === "value") progress.phase[id] = raw.phase[id];
  });
  Object.keys(raw.found || {}).forEach(function (id) {
    if (!allowed[id] || progress.done[id] || !Array.isArray(raw.found[id])) return;
    progress.found[id] = raw.found[id].map(function (item) { return String(item); }).filter(Boolean);
  });
  return progress;
}

function sanitizeFilled(compiled, raw) {
  var filled = {};
  if (!compiled || !compiled.fill || !raw || typeof raw !== "object") return filled;
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
  if (!compiled || !compiled.fill) return;
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
    fill: true,
    rows: compiled.rows.map(function (row) {
      var locked = Object.prototype.hasOwnProperty.call(filled, row.key);
      return {
        value: displayValue(row),
        freq: locked ? filled[row.key] : null,
        locked: locked,
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
    rows: source.map(function (row) {
      return { value: displayValue(row), freq: row.freq, locked: true };
    }),
  };
}

function viewOf(ex, progress, compiled) {
  var current = currentPart(ex, progress);
  var building = !!(current && current.task.kind === "buildFreq");
  var table = compiled && compiled.build ? viewBuild(compiled, progress, building) : viewTable(compiled, progress);
  var data = viewData(compiled);
  if (!current) {
    var solved = { part: null, ask: "", input: "text", solved: true };
    if (table) solved.table = table;
    if (data) solved.data = data;
    return solved;
  }
  var input = "text";
  if (current.task.kind === "yesNo") input = "yesno";
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
  return view;
}

function applyMatch(progress, task, result) {
  if (result.filled) progress.filled = result.filled;
  if (result.found) progress.found[task.id] = result.found;
  if (result.phase) progress.phase[task.id] = result.phase;
  if (result.done) {
    progress.done[task.id] = true;
    delete progress.phase[task.id];
  }
}

function hintForTask(compiled, task, progress) {
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
  if (task.kind === "lookup") {
    return "מצאו בטבלה את הערך המבוקש, וקראו את השכיחות שמתאימה לו.";
  }
  if (task.kind === "mode" && task.of === "frequency") {
    return "חפשו בשורת השכיחויות את המספר הגדול ביותר.";
  }
  if (task.kind === "mode") {
    if (found.length) return "יש יותר מערך אחד עם אותה שכיחות מקסימלית. רשמו גם את האחרים.";
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
  if (phase === "expr") return "חברו את השכיחויות שמצאתם.";
  if (task.kind === "total") return "חברו את כל השכיחויות שבטבלה.";
  return "הסתכלו בטבלה ומצאו תחילה את השכיחויות המתאימות לערכים המבוקשים.";
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

function checkTyped(compiled, ex, typed, progress, fill, priorColumns) {
  var current = currentPart(ex, progress);
  if (!current) {
    return respond(ex, compiled, progress, {
      ok: true,
      status: "solved",
      message: "כל הסעיפים נכונים.",
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

function hintResponse(compiled, ex, progress) {
  var current = currentPart(ex, progress);
  if (!current) {
    return respond(ex, compiled, progress, { status: "solved", message: "כל הסעיפים נכונים." });
  }
  return respond(ex, compiled, progress, {
    status: "hint",
    message: hintForTask(compiled, current.task, progress),
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

function stepOnce(compiled, ex, progress) {
  var current = currentPart(ex, progress);
  if (!current) return null;
  if (current.task.kind === "buildFreq") return stepBuildOnce(compiled, ex, progress);
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

function stepResponse(compiled, ex, progress) {
  var stepped = stepOnce(compiled, ex, progress);
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

function solutionResponse(compiled, ex, progress) {
  var lines = [];
  var guard = 0;
  while (currentPart(ex, progress) && guard < 80) {
    guard += 1;
    var stepped = stepOnce(compiled, ex, progress);
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
  var compiled = compileTable(found.ex.table, found.ex.data, found.ex.entries);
  var progress = sanitizeProgress(found.ex, body.progress);
  progress.filled = sanitizeFilled(compiled, body.progress && body.progress.filled);
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
    return checkTyped(compiled, found.ex, body.typed, progress, body.fill, priorColumns);
  }
  reconcileBuild(compiled, found.ex, progress);
  if (intent === "hint") return hintResponse(compiled, found.ex, progress);
  if (intent === "step") return stepResponse(compiled, found.ex, progress);
  if (intent === "solution") return solutionResponse(compiled, found.ex, progress);
  return checkTyped(compiled, found.ex, body.typed, progress, body.fill, priorColumns);
}

function openingView(engine, levelId, index, exerciseId) {
  var found = findExercise(engine, levelId, null, index, exerciseId);
  if (!found) return null;
  var compiled = compileTable(found.ex.table, found.ex.data, found.ex.entries);
  var progress = emptyProgress();
  progress.columns = [];
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
