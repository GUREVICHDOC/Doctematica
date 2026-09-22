"use strict";

function sameNum(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-6;
}

function formatValue(n) {
  if (!isFinite(n)) return "";
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  var rounded = Math.round(n * 1000) / 1000;
  return String(rounded);
}

function unknownOf(ex) {
  var name = ex && ex.unknown;
  if (name === "percent" || name === "all" || name === "part") return name;
  return "part";
}

function targetOf(ex) {
  var unknown = unknownOf(ex);
  if (unknown === "part") return (Number(ex.all) * Number(ex.percent)) / 100;
  if (unknown === "percent") return (Number(ex.part) * 100) / Number(ex.all);
  return (Number(ex.part) * 100) / Number(ex.percent);
}

function slotText(ex, name) {
  if (unknownOf(ex) === name) return "x";
  if (name === "percent") return formatValue(ex.percent);
  if (name === "all") return formatValue(ex.all);
  return formatValue(ex.part);
}

function proportionLine(ex) {
  return slotText(ex, "percent") + "/100 = " + slotText(ex, "part") + "/" + slotText(ex, "all");
}

function isolateLine(ex) {
  var unknown = unknownOf(ex);
  if (unknown === "part") return "x = (" + formatValue(ex.all) + "·" + formatValue(ex.percent) + ")/100";
  if (unknown === "percent") return "x = (" + formatValue(ex.part) + "·100)/" + formatValue(ex.all);
  return "x = (" + formatValue(ex.part) + "·100)/" + formatValue(ex.percent);
}

function valueLine(ex) {
  return "x = " + formatValue(targetOf(ex));
}

function normalize(text) {
  return String(text || "")
    .replace(/[×·*]/g, "*")
    .replace(/[−–—]/g, "-")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\s+/g, "");
}

function displayTyped(raw) {
  return normalize(raw).replace(/\*/g, "·").replace(/=/g, " = ");
}

function addLin(left, right) {
  return { a: left.a + right.a, b: left.b + right.b, bad: left.bad || right.bad };
}

function scaleLin(lin, k) {
  return { a: lin.a * k, b: lin.b * k, bad: lin.bad };
}

function mulLin(left, right) {
  if (left.bad || right.bad) return { a: 0, b: 0, bad: true };
  if (left.a && right.a) return { a: 0, b: 0, bad: true };
  if (!left.a) return scaleLin(right, left.b);
  return scaleLin(left, right.b);
}

function divLin(left, right) {
  if (left.bad || right.bad || right.a || !right.b) return { a: 0, b: 0, bad: true };
  return scaleLin(left, 1 / right.b);
}

function parseLinear(text) {
  var s = String(text || "");
  var i = 0;
  function peek() { return s.charAt(i); }
  function parseExpr() {
    var left = parseTerm();
    while (peek() === "+" || (peek() === "-" && i > 0)) {
      var op = peek();
      i += 1;
      var right = parseTerm();
      left = op === "+" ? addLin(left, right) : addLin(left, scaleLin(right, -1));
    }
    return left;
  }
  function parseTerm() {
    var left = parseUnary();
    while (peek() === "*" || peek() === "/" || peek() === "(" || peek() === "x" || /[0-9.]/.test(peek())) {
      var before = i;
      if (peek() === "*" || peek() === "/") {
        var op = peek();
        i += 1;
        left = op === "*" ? mulLin(left, parseUnary()) : divLin(left, parseUnary());
      } else {
        left = mulLin(left, parseUnary());
      }
      if (i === before) break;
    }
    return left;
  }
  function parseUnary() {
    if (peek() === "+") {
      i += 1;
      return parseUnary();
    }
    if (peek() === "-") {
      i += 1;
      return scaleLin(parseUnary(), -1);
    }
    return parsePrimary();
  }
  function parsePrimary() {
    if (peek() === "(") {
      i += 1;
      var inner = parseExpr();
      if (peek() !== ")") return { a: 0, b: 0, bad: true };
      i += 1;
      return inner;
    }
    if (peek() === "x") {
      i += 1;
      return { a: 1, b: 0, bad: false };
    }
    var m = s.slice(i).match(/^\d+(?:\.\d+)?/);
    if (!m) return { a: 0, b: 0, bad: true };
    i += m[0].length;
    return { a: 0, b: Number(m[0]), bad: false };
  }
  if (!s) return null;
  var value = parseExpr();
  if (!value || value.bad || i !== s.length) return null;
  return value;
}

function bareNumber(text) {
  return /^-?\d+(?:\.\d+)?$/.test(String(text || ""));
}

function splitEq(text) {
  return String(text || "").split("=");
}

function solveLinear(left, right) {
  var a = left.a - right.a;
  var b = right.b - left.b;
  if (!isFinite(a) || Math.abs(a) < 1e-9) return null;
  return b / a;
}

function depthOk(text) {
  var depth = 0;
  var i;
  for (i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    if (ch === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

function unwrap(text) {
  var t = String(text || "");
  while (t.length >= 2 && t.charAt(0) === "(" && t.charAt(t.length - 1) === ")" && depthOk(t.slice(1, -1))) {
    t = t.slice(1, -1);
  }
  return t;
}

function splitTopSlash(side) {
  var depth = 0;
  var at = -1;
  var count = 0;
  var i;
  for (i = 0; i < side.length; i++) {
    var ch = side.charAt(i);
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "/" && depth === 0) {
      at = i;
      count += 1;
    }
  }
  if (count !== 1) return null;
  return { num: unwrap(side.slice(0, at)), den: unwrap(side.slice(at + 1)) };
}

function asToken(cell) {
  var t = unwrap(cell);
  if (t === "x" || t === "+x") return "x";
  if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t);
  return null;
}

function tokenEq(a, b) {
  if (a === "x" || b === "x") return a === b;
  return sameNum(a, b);
}

function parseProportion(text) {
  var parts = splitEq(text);
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  var left = splitTopSlash(parts[0]);
  var right = splitTopSlash(parts[1]);
  if (!left || !right) return null;
  var cells = [asToken(left.num), asToken(left.den), asToken(right.num), asToken(right.den)];
  if (cells.some(function (cell) { return cell == null; })) return null;
  return {
    left: { num: cells[0], den: cells[1] },
    right: { num: cells[2], den: cells[3] },
    cells: cells,
  };
}

function ratioSolution(text) {
  var parsed = parseProportion(text);
  if (!parsed) return null;
  var cells = parsed.cells;
  var xCount = cells.filter(function (cell) { return cell === "x"; }).length;
  if (xCount !== 1) return null;
  function num(cell) {
    return cell === "x" ? null : cell;
  }
  var ln = num(parsed.left.num);
  var ld = num(parsed.left.den);
  var rn = num(parsed.right.num);
  var rd = num(parsed.right.den);
  var value = null;
  if (parsed.left.num === "x" && ld && rn != null && rd) value = ld * rn / rd;
  else if (parsed.left.den === "x" && ln != null && rn != null && rd) value = ln * rd / rn;
  else if (parsed.right.num === "x" && rd && ln != null && ld) value = rd * ln / ld;
  else if (parsed.right.den === "x" && rn != null && ln != null && ld) value = rn * ld / ln;
  if (value == null || !isFinite(value)) return null;
  return { value: value };
}

function expectedRoles(ex) {
  var unknown = unknownOf(ex);
  return {
    percent: unknown === "percent" ? "x" : Number(ex.percent),
    base: 100,
    part: unknown === "part" ? "x" : Number(ex.part),
    all: unknown === "all" ? "x" : Number(ex.all),
  };
}

function sameMultiset(left, right) {
  var used = [];
  var i;
  var j;
  if (left.length !== right.length) return false;
  for (i = 0; i < left.length; i++) {
    var found = false;
    for (j = 0; j < right.length; j++) {
      if (used[j]) continue;
      if (tokenEq(left[i], right[j])) {
        used[j] = true;
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

function roleMismatches(actual, expected) {
  var roles = ["percent", "base", "part", "all"];
  var bad = [];
  roles.forEach(function (role) {
    if (!tokenEq(actual[role], expected[role])) bad.push(role);
  });
  return bad;
}

function swappedPair(bad, actual, expected) {
  if (bad.length !== 2) return null;
  var a = bad[0];
  var b = bad[1];
  if (tokenEq(actual[a], expected[b]) && tokenEq(actual[b], expected[a])) return [a, b];
  return null;
}

function samePair(left, right) {
  if (!left || !right) return false;
  return (left[0] === right[0] && left[1] === right[1]) || (left[0] === right[1] && left[1] === right[0]);
}

function mentionPair(a, b) {
  var first = a;
  var second = b;
  if (first === "x") {
    first = b;
    second = a;
  }
  if (first === "x") return "x ו־" + formatValue(second);
  if (second === "x") return formatValue(first) + " ו־x";
  return formatValue(first) + " ו־" + formatValue(second);
}

function swapMessage(pair, expected) {
  var key = pair.slice().sort().join("|");
  if (key === "all|part") {
    return "הערכים שבחרת מתאימים לנתוני השאלה, אבל נראה שהחלפת בין השלם לבין הכמות שאותה מחפשים. בדוק היכן צריכים להופיע " + mentionPair(expected.all, expected.part) + ".";
  }
  if (key === "base|percent") {
    return "נראה שהחלפת בין האחוז הנתון לבין 100. בדוק את מבנה שבר האחוז.";
  }
  var names = { percent: "האחוז", base: "100", part: "החלק", all: "השלם" };
  return "נראה שהחלפת בין " + names[pair[0]] + " לבין " + names[pair[1]] + ". בדוק היכן צריכים להופיע " + mentionPair(expected[pair[0]], expected[pair[1]]) + ".";
}

var PLACEMENT_MANY = "השתמשת בערכים הנכונים, אבל כמה מהם נמצאים במקומות הלא נכונים. בדוק שוב איזה ערך מייצג את האחוז, החלק והשלם.";

function diagnosePlacement(ex, text) {
  var parsed = parseProportion(text);
  if (!parsed) return null;
  var expected = expectedRoles(ex);
  var expectedList = [expected.percent, expected.base, expected.part, expected.all];
  if (!sameMultiset(parsed.cells, expectedList)) return null;
  function score(percentSide, partSide) {
    var actual = {
      percent: percentSide.num,
      base: percentSide.den,
      part: partSide.num,
      all: partSide.den,
    };
    var bad = roleMismatches(actual, expected);
    return { bad: bad, pair: swappedPair(bad, actual, expected) };
  }
  var options = [
    score(parsed.left, parsed.right),
    score(parsed.right, parsed.left),
  ];
  options.sort(function (a, b) { return a.bad.length - b.bad.length; });
  if (!options[0].bad.length) return { correct: true };
  var best = options[0];
  var other = options[1];
  if (best.pair && !(other.bad.length === best.bad.length && other.pair && !samePair(best.pair, other.pair))) {
    return { message: swapMessage(best.pair, expected) };
  }
  return { message: PLACEMENT_MANY };
}

function literalsOf(text) {
  var found = [];
  var re = /\d+(?:\.\d+)?/g;
  var match;
  while ((match = re.exec(text))) found.push(Number(match[0]));
  var frac = /(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g;
  while ((match = frac.exec(text))) {
    var den = Number(match[2]);
    if (den) found.push(Number(match[1]) / den);
  }
  return found;
}

function badDecimal(ex, text, value) {
  if (ex.percent == null || ex.all == null) return null;
  var candidates = [Number(ex.percent) / 10, Number(ex.percent) / 1000];
  var literals = literalsOf(text);
  var i;
  for (i = 0; i < candidates.length; i++) {
    var factor = candidates[i];
    if (!isFinite(factor) || sameNum(factor, Number(ex.percent) / 100)) continue;
    var appears = literals.some(function (n) { return sameNum(n, factor); });
    if (appears && sameNum(value, Number(ex.all) * factor)) return factor;
  }
  return null;
}

function mistake(ex, text, value) {
  if (ex.percent != null && ex.all != null && sameNum(value, Number(ex.percent) * Number(ex.all))) {
    return "האחוז הוכפל כמספר רגיל. " + formatValue(ex.percent) + "% הם " + formatValue(ex.percent / 100) + ", לא " + formatValue(ex.percent) + ".";
  }
  var factor = badDecimal(ex, text, value);
  if (factor != null) {
    return "ההמרה לעשרוני אינה במקום הנכון. " + formatValue(ex.percent) + "% הם " + formatValue(ex.percent / 100) + ", לא " + formatValue(factor) + ".";
  }
  if (ex.percent != null && sameNum(value, Number(ex.percent) / 100)) {
    return "חילקתם ב-100, אבל חסר הכפל בשלם.";
  }
  return "זה לא שקול לחישוב המבוקש.";
}

function assessTyped(ex, typed) {
  var text = normalize(typed);
  if (!text) return { ok: false, message: "כתבו תשובה." };
  var target = targetOf(ex);
  var ratio = ratioSolution(text);
  if (ratio && sameNum(ratio.value, target)) {
    return { ok: true, done: false, step: "proportion", shows: [displayTyped(text)], message: "" };
  }
  var placed = diagnosePlacement(ex, text);
  if (placed && placed.correct) {
    return { ok: true, done: false, step: "proportion", shows: [displayTyped(text)], message: "" };
  }
  if (placed && placed.message) return { ok: false, message: placed.message, code: "placement" };
  if (ratio) return { ok: false, message: mistake(ex, text, ratio.value) };
  var parts = splitEq(text);
  if (parts.length > 2) return { ok: false, message: "זה לא שקול לחישוב המבוקש." };
  if (parts.length === 2 && !parts[0]) {
    var continued = parseLinear(parts[1]);
    if (continued && !continued.a && sameNum(continued.b, target)) {
      return { ok: true, done: true, step: "done", shows: [formatValue(target)], joinPrev: true, message: "" };
    }
    if (continued && !continued.a) return { ok: false, message: mistake(ex, parts[1], continued.b) };
    return { ok: false, message: "זה לא שקול לחישוב המבוקש." };
  }
  if (parts.length === 2) {
    var left = parseLinear(parts[0]);
    var right = parseLinear(parts[1]);
    if (!left || !right) return { ok: false, message: "זה לא שקול לחישוב המבוקש." };
    if (!left.a && !right.a) {
      if (!sameNum(left.b, right.b)) return { ok: false, message: "התוצאה לא שווה לביטוי שרשמתם." };
      if (sameNum(left.b, target)) {
        return { ok: true, done: true, step: "done", shows: [displayTyped(text)], message: "" };
      }
      return { ok: false, message: mistake(ex, text, left.b) };
    }
    var solved = solveLinear(left, right);
    if (solved != null && sameNum(solved, target)) {
      var rhsBare = bareNumber(parts[1]);
      var lhsBareX = parts[0] === "x" || parts[0] === "+x";
      if (rhsBare || (left.a && !right.a && bareNumber(parts[1]))) {
        return { ok: true, done: true, step: "done", shows: [displayTyped(text)], message: "" };
      }
      if (lhsBareX && !rhsBare) {
        return { ok: true, done: false, step: "isolate", shows: [displayTyped(text)], message: "" };
      }
      if (!left.a && !right.a && sameNum(left.b, target)) {
        return { ok: true, done: true, step: "done", shows: [displayTyped(text)], message: "" };
      }
      return { ok: true, done: false, step: "expr", shows: [displayTyped(text)], message: "" };
    }
    var wrongValue = solved;
    if (wrongValue == null && !left.a && !right.a) wrongValue = left.b;
    if (wrongValue != null) return { ok: false, message: mistake(ex, text, wrongValue) };
    return { ok: false, message: "זה לא שקול לחישוב המבוקש." };
  }
  var expr = parseLinear(text);
  if (!expr) return { ok: false, message: "זה לא שקול לחישוב המבוקש." };
  if (expr.a) return { ok: false, message: "זה לא שקול לחישוב המבוקש." };
  if (sameNum(expr.b, target)) {
    if (bareNumber(text)) {
      return { ok: true, done: true, step: "done", shows: [formatValue(target)], message: "" };
    }
    return { ok: true, done: false, step: "expr", shows: [displayTyped(text)], message: "" };
  }
  return { ok: false, message: mistake(ex, text, expr.b) };
}

function isMulti(ex) {
  return !!(ex && ex.groups && ex.groups.length > 1);
}

function groupList(ex) {
  if (!isMulti(ex)) {
    return [{
      id: "part",
      label: "",
      percent: Number(ex.percent),
      amount: (Number(ex.all) * Number(ex.percent)) / 100,
      given: true,
    }];
  }
  var sumGiven = 0;
  var givenCount = 0;
  var groups = ex.groups.map(function (g) {
    var given = g.percent != null && g.percent !== "";
    if (given) {
      sumGiven += Number(g.percent);
      givenCount += 1;
    }
    return { id: g.id, label: g.label || "", percent: given ? Number(g.percent) : null, given: given };
  });
  var missing = groups.filter(function (g) { return g.percent == null; });
  if (missing.length === 1 && givenCount >= 1) missing[0].percent = 100 - sumGiven;
  groups.forEach(function (g) {
    g.amount = (Number(ex.all) * Number(g.percent)) / 100;
  });
  return groups;
}

function primaryGroup(groups) {
  var i;
  for (i = 0; i < groups.length; i++) if (groups[i].given) return groups[i];
  return groups[0];
}

function otherGroup(groups, primary) {
  var i;
  for (i = 0; i < groups.length; i++) if (groups[i].id !== primary.id) return groups[i];
  return groups[0];
}

function fieldValue(text) {
  var norm = normalize(text);
  if (!norm) return null;
  var parts = splitEq(norm);
  if (parts.length === 1) {
    var lin = parseLinear(norm);
    if (lin && !lin.bad && !lin.a) return lin.b;
    return null;
  }
  if (parts.length === 2 && !parts[0]) {
    var only = parseLinear(parts[1]);
    if (only && !only.bad && !only.a) return only.b;
    return null;
  }
  if (parts.length === 2) {
    var left = parseLinear(parts[0]);
    var right = parseLinear(parts[1]);
    if (left && right && !left.bad && !right.bad && !left.a && !right.a && sameNum(left.b, right.b)) return left.b;
  }
  return null;
}

function judgeFields(ex, answers) {
  var groups = groupList(ex);
  var locks = {};
  var wrong = [];
  var missing = [];
  var values = {};
  groups.forEach(function (g) {
    var raw = answers && answers[g.id];
    if (!String(raw || "").trim()) {
      missing.push(g);
      return;
    }
    var value = fieldValue(raw);
    values[g.id] = value;
    if (value != null && sameNum(value, g.amount)) locks[g.id] = true;
    else wrong.push(g);
  });
  var swapped = false;
  if (groups.length === 2 && wrong.length === 2 && !missing.length) {
    if (values[groups[0].id] != null && values[groups[1].id] != null && sameNum(values[groups[0].id], groups[1].amount) && sameNum(values[groups[1].id], groups[0].amount)) swapped = true;
  }
  var message = "";
  if (swapped) message = "הכמויות נכונות, אבל נראה שהחלפת בין " + groups[0].label + " לבין " + groups[1].label + ".";
  else if (wrong.length) message = wrong.map(function (g) { return "הכמות של " + g.label + " אינה נכונה."; }).join(" ");
  else if (missing.length && Object.keys(locks).length) message = missing.map(function (g) { return "חסרה הכמות של " + g.label + "."; }).join(" ");
  else if (missing.length) message = "כתבו את הכמויות בשדות.";
  return { locks: locks, message: message, solved: !wrong.length && !missing.length, swapped: swapped };
}

function assessGroups(ex, typed) {
  var groups = groupList(ex);
  var placement = "";
  var noted = "";
  var i;
  for (i = 0; i < groups.length; i++) {
    var result = assessTyped({ unknown: "part", percent: groups[i].percent, all: ex.all }, typed);
    if (result.ok) return { ok: true, group: groups[i], result: result, found: !!(result.done || result.step === "expr") };
    if (!placement && result.code === "placement") placement = result.message;
    if (!noted && result.message && (result.message.indexOf("מספר רגיל") >= 0 || result.message.indexOf("אינה במקום הנכון") >= 0 || result.message.indexOf("חסר הכפל") >= 0)) noted = result.message;
  }
  var value = fieldValue(typed);
  var complement = 100 - Number(primaryGroup(groups).percent);
  if (value != null && sameNum(value, complement) && !groups.some(function (g) { return sameNum(g.amount, value); })) {
    return { ok: true, group: null, found: false, result: { shows: [displayTyped(typed)], joinPrev: false, step: "expr", done: false } };
  }
  if (placement) return { ok: false, message: placement };
  if (noted) return { ok: false, message: noted };
  return { ok: false, message: "זה לא שקול לחישוב המבוקש." };
}

function advanceStep(progress, result) {
  var order = { "": 0, proportion: 1, isolate: 2, expr: 2, value: 3, subtract: 4, done: 5 };
  var current = progress.step || "";
  var next = result.step || current;
  if ((order[next] || 0) >= (order[current] || 0)) progress.step = next;
  if (result.done) {
    progress.step = "done";
    progress.done = true;
  }
}

function nextMultiLine(ex, progress) {
  var groups = groupList(ex);
  var primary = primaryGroup(groups);
  var other = otherGroup(groups, primary);
  var spec = { unknown: "part", percent: primary.percent, all: ex.all };
  var step = progress.step || "";
  if (step === "done") return null;
  if (!step) return { line: proportionLine(spec), step: "proportion", done: false, joinPrev: false };
  if (step === "proportion") return { line: isolateLine(spec), step: "isolate", done: false, joinPrev: false };
  if (step === "isolate" || step === "expr") return { line: valueLine(spec), step: "value", done: false, joinPrev: step === "expr" };
  if (step === "value") return { line: formatValue(ex.all) + " - " + formatValue(primary.amount), step: "subtract", done: false, joinPrev: false };
  return { line: formatValue(other.amount), step: "done", done: true, joinPrev: step === "subtract" };
}

function nextSiteLine(ex, progress) {
  if (isMulti(ex)) return nextMultiLine(ex, progress);
  var step = progress.step || "";
  if (step === "done") return null;
  if (!step) return { line: proportionLine(ex), step: "proportion", done: false, joinPrev: false };
  if (step === "proportion") return { line: isolateLine(ex), step: "isolate", done: false, joinPrev: false };
  if (step === "expr") return { line: formatValue(targetOf(ex)), step: "done", done: true, joinPrev: true };
  return { line: valueLine(ex), step: "done", done: true, joinPrev: false };
}

function hintFor(ex, progress) {
  var step = progress.step || "";
  if (isMulti(ex)) {
    var groups = groupList(ex);
    var primary = primaryGroup(groups);
    var other = otherGroup(groups, primary);
    var found = (progress && progress.found) || {};
    if (step === "value" || step === "subtract" || (found[primary.id] && !found[other.id])) {
      return "מצאו את " + other.label + ": השלם פחות הקבוצה שכבר מצאתם.";
    }
    if (found[other.id] && !found[primary.id]) return "עכשיו מצאו את " + primary.label + ".";
    if (found[primary.id] && found[other.id]) return "רשמו את שתי הכמויות בשדות.";
    if (step === "proportion") return "בודדו את x. אצלנו x = (השלם כפול האחוז) חלקי 100.";
    if (step === "isolate") return "חשבו את ערכו של x.";
    return "קודם מצאו את " + primary.label + ". רשמו את הפרופורציה: האחוז חלקי 100 שווה לחלק חלקי השלם. במקום הגודל החסר רשמו x.";
  }
  if (!step) return "רשמו את הפרופורציה: האחוז חלקי 100 שווה לחלק חלקי השלם. במקום הגודל החסר רשמו x.";
  if (step === "proportion") {
    if (unknownOf(ex) === "part") return "בודדו את x. אצלנו x = (השלם כפול האחוז) חלקי 100.";
    return "בודדו את x באגף אחד.";
  }
  return "חשבו את ערכו של x.";
}

function findLevel(engine, levelId) {
  var levels = (engine.DoctematicaCurriculum && engine.DoctematicaCurriculum.levels) || [];
  var i;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === levelId && levels[i].mode === "percent") return levels[i];
  }
  return null;
}

function findExercise(engine, body) {
  var level = findLevel(engine, body.levelId);
  if (!level) return null;
  var list = level.exercises || [];
  var i;
  if (body.exerciseId) {
    for (i = 0; i < list.length; i++) {
      if (list[i].id === body.exerciseId) return { level: level, ex: list[i], index: i };
    }
    return null;
  }
  var index = Number(body.exerciseIndex);
  if (index >= 0 && list[index]) return { level: level, ex: list[index], index: index };
  return null;
}

function sanitizeProgress(raw, ex) {
  raw = raw || {};
  var step = raw.step;
  if (step !== "proportion" && step !== "isolate" && step !== "expr" && step !== "value" && step !== "subtract") step = "";
  var found = {};
  if (isMulti(ex) && raw.found) {
    groupList(ex).forEach(function (g) {
      if (raw.found[g.id]) found[g.id] = true;
    });
  }
  return { step: step, done: false, found: found };
}

function viewOf(ex, progress, answers) {
  var view = {
    input: isMulti(ex) ? "fields" : "text",
    solved: !!(progress && progress.done),
  };
  if (!isMulti(ex)) return view;
  var groups = groupList(ex);
  var locks = {};
  if (!(progress && progress.done)) locks = judgeFields(ex, answers).locks;
  view.fields = groups.map(function (g) {
    var field = { id: g.id, label: g.label, locked: !!(progress && progress.done) || !!locks[g.id] };
    if (progress && progress.done) field.value = formatValue(g.amount);
    return field;
  });
  return view;
}

function respond(ex, progress, extra) {
  extra = extra || {};
  return {
    ok: extra.ok !== false,
    status: extra.status || "",
    message: extra.message || "",
    shows: extra.shows || [],
    joinPrev: !!extra.joinPrev,
    lines: extra.lines || null,
    progress: progress,
    view: viewOf(ex, progress, extra.answers),
  };
}

function handle(engine, body) {
  body = body || {};
  var found = findExercise(engine, body);
  if (!found) return { error: "unknown exercise", message: "unknown exercise" };
  var ex = found.ex;
  var progress = sanitizeProgress(body.progress, ex);
  var intent = String(body.intent || "check");
  if (intent === "hint") {
    return respond(ex, progress, { status: "hint", message: hintFor(ex, progress), answers: body.answers });
  }
  if (intent === "step") {
    var stepped = nextSiteLine(ex, progress);
    if (!stepped) return { ok: false, message: "אין צעד נוסף.", progress: progress, view: viewOf(ex, progress, body.answers) };
    advanceStep(progress, stepped);
    return respond(ex, progress, {
      status: progress.done ? "solved" : "step",
      message: progress.done ? "אפשר להמשיך." : "הצעד נוסף.",
      shows: [stepped.line],
      joinPrev: stepped.joinPrev,
      answers: body.answers,
    });
  }
  if (intent === "solution") {
    var lines = [];
    var guard = 0;
    while (progress.step !== "done" && guard < 8) {
      guard += 1;
      var line = nextSiteLine(ex, progress);
      if (!line) break;
      lines.push({ show: line.line, joinPrev: !!line.joinPrev });
      advanceStep(progress, line);
    }
    if (isMulti(ex)) groupList(ex).forEach(function (g) { progress.found[g.id] = true; });
    return respond(ex, progress, {
      status: "solved",
      message: "אפשר להמשיך.",
      lines: lines,
      shows: [],
      answers: body.answers,
    });
  }
  if (isMulti(ex)) {
    var typed = String(body.typed || "").trim();
    var judged = judgeFields(ex, body.answers);
    if (typed) {
      var work = assessGroups(ex, typed);
      if (!work.ok) {
        return { ok: false, message: work.message, progress: progress, view: viewOf(ex, progress, body.answers) };
      }
      if (work.found && work.group) progress.found[work.group.id] = true;
      if (judged.solved) {
        progress.done = true;
        progress.step = "done";
      }
      return respond(ex, progress, {
        status: progress.done ? "solved" : "step",
        message: progress.done ? "" : "אפשר להמשיך.",
        shows: (work.result && work.result.shows) || [],
        joinPrev: !!(work.result && work.result.joinPrev),
        answers: body.answers,
      });
    }
    if (!judged.solved) {
      return { ok: false, message: judged.message, progress: progress, view: viewOf(ex, progress, body.answers) };
    }
    progress.done = true;
    progress.step = "done";
    groupList(ex).forEach(function (g) { progress.found[g.id] = true; });
    return respond(ex, progress, { status: "solved", message: "", answers: body.answers });
  }
  var result = assessTyped(ex, body.typed);
  if (!result.ok) {
    return { ok: false, message: result.message || "עוד לא.", progress: progress, view: viewOf(ex, progress) };
  }
  var joinPrev = !!result.joinPrev && (progress.step === "expr" || progress.step === "isolate");
  advanceStep(progress, result);
  return respond(ex, progress, {
    status: progress.done ? "solved" : "step",
    message: progress.done ? "" : "אפשר להמשיך.",
    shows: result.shows || [],
    joinPrev: joinPrev,
  });
}

function openingView(engine, levelId, index, exerciseId) {
  var found = findExercise(engine, { levelId: levelId, exerciseIndex: index, exerciseId: exerciseId });
  if (!found) return null;
  return viewOf(found.ex, { step: "", done: false });
}

module.exports = {
  handle: handle,
  openingView: openingView,
  assessTyped: assessTyped,
  targetOf: targetOf,
  proportionLine: proportionLine,
  isolateLine: isolateLine,
  hintFor: hintFor,
  nextSiteLine: nextSiteLine,
};
