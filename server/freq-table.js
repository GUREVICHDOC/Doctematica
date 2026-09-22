"use strict";

var OPS = { gt: true, lt: true, gte: true, lte: true, eq: true, in: true };

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

function compileTable(table) {
  table = table || {};
  var variable = table.variable || {};
  var frequency = table.frequency || {};
  var rows = (table.rows || []).map(function (row, index) {
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
  if (scale !== "qualitative" && scale !== "quantitative") {
    scale = rows.length && rows.every(function (row) { return row.num != null; })
      ? "quantitative"
      : "qualitative";
  }
  return {
    variableLabel: variable.label || "",
    frequencyLabel: frequency.label || "",
    scale: scale,
    rows: rows,
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

function matchScale(compiled, typed) {
  var text = normText(typed);
  var quantitative = /כמותי/.test(text);
  var qualitative = /איכותי/.test(text);
  if (quantitative === qualitative) {
    return { ok: false, message: "רשמו אם המשתנה כמותי או איכותי." };
  }
  var word = compiled.scale === "quantitative" ? "כמותי" : "איכותי";
  if ((compiled.scale === "quantitative" && !quantitative) || (compiled.scale !== "quantitative" && !qualitative)) {
    return { ok: false, message: "בדקו אם ערכי המשתנה הם מספרים או שמות." };
  }
  return { ok: true, done: true, shows: [word], message: "" };
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

function verdictWord(compiled, task) {
  var total = numericTotal(compiled, task.calc || { kind: "total" });
  return holds(total, task.op, task.value) ? "כן" : "לא";
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
  if (task.kind === "scale") return matchScale(compiled, typed);
  if (task.kind === "lookup") return matchLookup(compiled, task, typed);
  if (task.kind === "sumFreq" || task.kind === "total") return matchSum(compiled, task, typed, progress);
  if (task.kind === "weightedSum") return matchWeighted(compiled, task, typed, progress);
  if (task.kind === "mode") return matchMode(compiled, task, typed, progress);
  if (task.kind === "matchValues") return matchValues(compiled, task, typed, progress);
  if (task.kind === "yesNo") return matchYesNo(compiled, task, typed, progress);
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
  return { done: {}, phase: {}, found: {} };
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

function viewOf(ex, progress) {
  var current = currentPart(ex, progress);
  if (!current) return { part: null, ask: "", input: "text", solved: true };
  return {
    part: { label: current.part.label || "", text: current.part.text || "" },
    ask: activeAsk(current.part, current.task),
    input: current.task.kind === "yesNo" ? "yesno" : "text",
    solved: false,
  };
}

function applyMatch(progress, task, result) {
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
  if (task.kind === "scale") {
    return "אם ערכי המשתנה הם מספרים שאפשר לחבר ולהשוות, המשתנה כמותי. אם הם שמות או קטגוריות, המשתנה איכותי.";
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
  if (task.kind === "yesNo") {
    if (phase === "value") return "השוו את התוצאה לתנאי שבשאלה, וענו כן או לא.";
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
  if (task.kind === "identify") {
    return task.role === "frequency" ? compiled.frequencyLabel : compiled.variableLabel;
  }
  if (task.kind === "scale") return compiled.scale === "quantitative" ? "כמותי" : "איכותי";
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
    view: viewOf(ex, progress),
  };
}

function checkTyped(compiled, ex, typed, progress) {
  var current = currentPart(ex, progress);
  if (!current) {
    return respond(ex, compiled, progress, {
      ok: true,
      status: "solved",
      message: "כל הסעיפים נכונים.",
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
      view: viewOf(ex, progress),
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

function stepOnce(compiled, ex, progress) {
  var current = currentPart(ex, progress);
  if (!current) return null;
  var line = nextLine(compiled, current.task, progress);
  if (line == null) return null;
  var result = matchTask(compiled, current.task, line, progress);
  if (!result || !result.ok) return null;
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
    return { ok: false, message: "אין צעד נוסף.", view: viewOf(ex, progress), progress: progress };
  }
  var onlySteps = !stepped.result.done;
  var status = statusAfter(ex, progress, onlySteps);
  return respond(ex, compiled, progress, {
    status: status,
    message: stepped.result.message || (status === "solved" ? "כל הסעיפים נכונים." : "הצעד נוסף."),
    shows: stepped.shows,
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
    stepped.shows.forEach(function (show) {
      lines.push({ part: stepped.part, show: show });
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
  var compiled = compileTable(found.ex.table);
  var progress = sanitizeProgress(found.ex, body.progress);
  var intent = String(body.intent || "check");
  if (intent === "hint") return hintResponse(compiled, found.ex, progress);
  if (intent === "step") return stepResponse(compiled, found.ex, progress);
  if (intent === "solution") return solutionResponse(compiled, found.ex, progress);
  return checkTyped(compiled, found.ex, body.typed, progress);
}

function openingView(engine, levelId, index, exerciseId) {
  var found = findExercise(engine, levelId, null, index, exerciseId);
  if (!found) return null;
  return viewOf(found.ex, emptyProgress());
}

function withState(task, state) {
  var id = task.id || "t";
  var progress = emptyProgress();
  state = state || {};
  if (state.phase) progress.phase[id] = state.phase;
  if (state.found) progress.found[id] = state.found.slice();
  return { id: id, progress: progress, task: Object.assign({ id: id }, task) };
}

function assess(table, task, typed, state) {
  var packed = withState(task, state);
  var compiled = compileTable(table);
  return matchTask(compiled, packed.task, typed, packed.progress);
}

function hintText(table, task, state) {
  var packed = withState(task, state);
  return hintForTask(compileTable(table), packed.task, packed.progress);
}

function nextStep(table, task, state) {
  var packed = withState(task, state);
  var compiled = compileTable(table);
  var line = nextLine(compiled, packed.task, packed.progress);
  var result = line == null ? null : matchTask(compiled, packed.task, line, packed.progress);
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
