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
  if (expected.percent === "x") {
    if (key === "all|part") {
      return "נראה שהחלפת בין החלק לבין השלם. בדוק שוב: איזה מספר הוא הכמות שמתוכה מחשבים את האחוז?";
    }
    if (key === "base|percent") {
      return "נראה שהחלפת בין x לבין 100. האחוז צריך להיות במונה, ו־100 במכנה.";
    }
    return "הערכים שבחרת מתאימים לשאלה, אבל חלק מהם נמצאים במקומות הלא נכונים בפרופורציה. בדוק שוב את החלק, השלם, האחוז ו־100.";
  }
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
  if (expected.percent === "x") {
    return { message: "הערכים שבחרת מתאימים לשאלה, אבל חלק מהם נמצאים במקומות הלא נכונים בפרופורציה. בדוק שוב את החלק, השלם, האחוז ו־100." };
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

function formatDecimal(n) {
  if (!isFinite(n)) return "";
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

function formatFactor(percent) {
  return formatDecimal(Number(percent) / 100);
}

function factorValue(percent) {
  return Number(percent) / 100;
}

function mistake(ex, text, value) {
  if (unknownOf(ex) === "all" && ex.part != null && ex.percent != null) {
    var wholePart = Number(ex.part);
    var wholePercent = Number(ex.percent);
    if (sameNum(value, wholePercent * wholePart)) {
      return "האחוז הוכפל כמספר רגיל. " + formatValue(wholePercent) + "% הם " + formatFactor(wholePercent) + ", לא " + formatValue(wholePercent) + ".";
    }
    if (wholePercent && sameNum(value, wholePart / wholePercent)) {
      return "חילקתם באחוז כמספר רגיל. " + formatValue(wholePercent) + "% הם " + formatFactor(wholePercent) + ", לא " + formatValue(wholePercent) + ".";
    }
    var badFactors = [wholePercent / 10, wholePercent / 1000, wholePercent / 10000];
    var wholeLiterals = literalsOf(text);
    var bi;
    for (bi = 0; bi < badFactors.length; bi++) {
      var badFactor = badFactors[bi];
      if (!isFinite(badFactor) || sameNum(badFactor, wholePercent / 100)) continue;
      var badAppears = wholeLiterals.some(function (n) { return sameNum(n, badFactor); });
      if (badAppears && badFactor && sameNum(value, wholePart / badFactor)) {
        return "ההמרה לעשרוני אינה במקום הנכון. " + formatValue(wholePercent) + "% הם " + formatFactor(wholePercent) + ", לא " + formatDecimal(badFactor) + ".";
      }
    }
  }
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
      if (lhsBareX && rhsBare) {
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

function isShares(ex) {
  return !!(ex && ex.shares && ex.shares.length > 1);
}

function groupList(ex) {
  if (!isMulti(ex)) {
    var singleAll = Number(ex.all);
    return [{
      id: "part",
      label: "",
      percent: Number(ex.percent),
      amount: isFinite(singleAll) ? (singleAll * Number(ex.percent)) / 100 : null,
      given: true,
      amountGiven: null,
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
    var amountGiven = g.amount != null && g.amount !== "" ? Number(g.amount) : null;
    return {
      id: g.id,
      label: g.label || "",
      percent: given ? Number(g.percent) : null,
      given: given,
      amountGiven: amountGiven,
    };
  });
  var missing = groups.filter(function (g) { return g.percent == null; });
  if (missing.length === 1 && givenCount >= 1) missing[0].percent = 100 - sumGiven;
  var whole = Number(ex.all);
  if (!isFinite(whole)) {
    var anchors = groups.filter(function (g) {
      return g.amountGiven != null && g.percent != null && g.percent !== 0;
    });
    if (anchors.length === 1) whole = (anchors[0].amountGiven * 100) / anchors[0].percent;
  }
  groups.forEach(function (g) {
    if (g.amountGiven != null) g.amount = g.amountGiven;
    else if (isFinite(whole) && g.percent != null) g.amount = (whole * Number(g.percent)) / 100;
    else g.amount = null;
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
  var norm = normalize(String(text || "").replace(/%/g, ""));
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

function isRelated(ex) {
  return !!(ex && ex.relations && ex.relations.length);
}

function relationWorld(ex) {
  var byId = {};
  (ex.quantities || []).forEach(function (q) {
    byId[q.id] = {
      id: q.id,
      label: q.label || q.id,
      value: q.value != null && q.value !== "" ? Number(q.value) : null,
      given: q.value != null && q.value !== "",
    };
  });
  var scales = [];
  var links = [];
  var pending = (ex.relations || []).slice();
  var guard = 0;
  while (pending.length && guard < 20) {
    guard += 1;
    var next = [];
    pending.forEach(function (rel) {
      if (rel.op === "increase" || rel.op === "decrease" || rel.op === "part") {
        var src = byId[rel.from];
        var dst = byId[rel.to];
        if (!src || src.value == null) {
          next.push(rel);
          return;
        }
        var p = Number(rel.percent);
        var factor = rel.op === "increase" ? (100 + p) / 100 : rel.op === "decrease" ? (100 - p) / 100 : p / 100;
        var change = src.value * p / 100;
        var value = rel.op === "part" ? change : src.value * factor;
        if (dst && dst.value == null) dst.value = value;
        scales.push({
          index: scales.length,
          op: rel.op,
          from: src,
          to: dst,
          percent: p,
          factor: factor,
          newPercent: rel.op === "increase" ? 100 + p : rel.op === "decrease" ? 100 - p : p,
          change: change,
          result: dst && dst.value != null ? dst.value : value,
        });
        return;
      }
      if (rel.op === "sum" || rel.op === "difference") {
        var parts = rel.op === "sum" ? (rel.of || []).map(function (id) { return byId[id]; }) : [byId[rel.from], byId[rel.minus]];
        if (parts.some(function (q) { return !q || q.value == null; })) {
          next.push(rel);
          return;
        }
        var sum = rel.op === "sum" ? 0 : parts[0].value;
        if (rel.op === "sum") parts.forEach(function (q) { sum += q.value; });
        else sum = parts[0].value - parts[1].value;
        var target = byId[rel.to];
        if (target && target.value == null) target.value = sum;
        links.push({ op: rel.op, parts: parts, to: target, value: target && target.value != null ? target.value : sum });
      }
    });
    if (next.length === pending.length) break;
    pending = next;
  }
  var quantityValues = [];
  Object.keys(byId).forEach(function (id) {
    if (byId[id].value != null) quantityValues.push(byId[id].value);
  });
  var amountFacts = subsetSums(quantityValues);
  var percentFacts = [100];
  scales.forEach(function (scale) {
    if (!inFacts(scale.change, amountFacts)) amountFacts.push(scale.change);
    if (!inFacts(scale.result, amountFacts)) amountFacts.push(scale.result);
    [scale.percent, scale.newPercent].forEach(function (n) {
      if (!inFacts(n, percentFacts)) percentFacts.push(n);
    });
  });
  return { byId: byId, scales: scales, links: links, amountFacts: amountFacts, percentFacts: percentFacts };
}

function relationSpec(scale, role) {
  return {
    unknown: "part",
    percent: role === "change" ? scale.percent : scale.newPercent,
    all: scale.from.value,
  };
}

function literalAllowed(n, world) {
  if (inFacts(n, world.amountFacts) || inFacts(n, world.percentFacts)) return true;
  var i;
  for (i = 0; i < world.percentFacts.length; i++) {
    if (sameNum(n, world.percentFacts[i] / 100)) return true;
  }
  return false;
}

function relationGrounded(world, typed, step) {
  var plain = normalize(String(typed || "").replace(/%/g, ""));
  if (step === "proportion" || step === "isolate" || bareNumber(plain) || plain.indexOf("x") >= 0) return true;
  var literals = numberLiterals(workSide(typed));
  return !!literals.length && literals.every(function (n) { return literalAllowed(n, world); });
}

function matchQuantity(world, value) {
  var found = null;
  Object.keys(world.byId).forEach(function (id) {
    var q = world.byId[id];
    if (q.value != null && sameNum(q.value, value)) found = q;
  });
  return found;
}

function assessRelated(ex, typed) {
  var text = String(typed || "").trim();
  if (!text) return { ok: false, message: "כתבו תשובה." };
  var world = relationWorld(ex);
  var i;
  for (i = 0; i < world.scales.length; i++) {
    var scale = world.scales[i];
    var roles = scale.op === "part" ? ["result"] : ["result", "change"];
    var r;
    for (r = 0; r < roles.length; r++) {
      var role = roles[r];
      var spec = relationSpec(scale, role);
      var result = assessTyped(spec, text);
      if (result.ok && relationGrounded(world, text, result.step)) {
        var quantity = role === "result" ? scale.to : null;
        return {
          ok: true,
          group: quantity,
          found: !!(quantity && (result.done || result.step === "expr") && shownResult(text)),
          role: role,
          scale: scale,
          quantityId: quantity ? quantity.id : null,
          value: role === "change" ? scale.change : scale.result,
          result: { shows: [displayTyped(text)], joinPrev: false, step: result.step, done: false },
        };
      }
    }
  }
  var value = fieldValue(text);
  var cleaned = normalize(text.replace(/%/g, ""));
  var literals = numberLiterals(workSide(text));
  if (value != null && literals.length && !/[*/x]/.test(cleaned)) {
    var percentOk = inFacts(value, world.percentFacts) && literals.every(function (n) { return inFacts(n, world.percentFacts); });
    var amountOk = inFacts(value, world.amountFacts) && literals.every(function (n) { return inFacts(n, world.amountFacts); });
    if (percentOk && !amountOk) {
      var percentScale = null;
      world.scales.forEach(function (scale) {
        if (sameNum(scale.newPercent, value)) percentScale = scale;
      });
      return {
        ok: true,
        found: false,
        role: "percent",
        scale: percentScale,
        value: value,
        result: { shows: [displayTyped(text)], joinPrev: false, step: "expr", done: false },
      };
    }
    if (amountOk) {
      var quantity = matchQuantity(world, value);
      var changeScale = null;
      if (!quantity) {
        world.scales.forEach(function (scale) {
          if (sameNum(scale.change, value)) changeScale = scale;
        });
      }
      return {
        ok: true,
        group: quantity,
        found: !!quantity && shownResult(text),
        role: changeScale ? "change" : "result",
        scale: changeScale,
        quantityId: quantity ? quantity.id : null,
        value: value,
        result: { shows: [displayTyped(text)], joinPrev: false, step: "expr", done: false },
      };
    }
  }
  if (value != null && literals.length && literals.every(function (n) { return literalAllowed(n, world); }) && inFacts(value, world.amountFacts)) {
    var scaledQuantity = matchQuantity(world, value);
    var scaledChange = null;
    if (!scaledQuantity) {
      world.scales.forEach(function (scale) {
        if (sameNum(scale.change, value)) scaledChange = scale;
      });
    }
    var scaledResult = null;
    world.scales.forEach(function (scale) {
      if (sameNum(scale.result, value)) scaledResult = scale;
    });
    return {
      ok: true,
      group: scaledQuantity,
      found: !!scaledQuantity && shownResult(text),
      role: scaledChange ? "change" : "result",
      scale: scaledChange || scaledResult,
      quantityId: scaledQuantity ? scaledQuantity.id : null,
      value: value,
      result: { shows: [displayTyped(text)], joinPrev: false, step: "expr", done: false },
    };
  }
  return { ok: false, message: diagnoseRelation(world, text) || "זה לא שקול לחישוב המבוקש." };
}

function diagnoseRelation(world, typed) {
  var value = fieldValue(typed);
  if (value == null) return "";
  var notes = [];
  function add(note) {
    if (notes.indexOf(note) < 0) notes.push(note);
  }
  world.scales.forEach(function (scale) {
    var source = scale.from.value;
    var p = scale.percent;
    if (sameNum(value, source * p)) {
      add("האחוז הוכפל כמספר רגיל. " + formatValue(p) + "% הם " + formatValue(p / 100) + ", לא " + formatValue(p) + ".");
    }
    [10, 100].forEach(function (place) {
      var bad = p / (100 * place);
      var grown = scale.op === "decrease" ? source * (1 - bad) : source * (1 + bad);
      if (sameNum(value, source * bad) || (scale.op !== "part" && sameNum(value, grown))) {
        add("ההמרה לעשרוני אינה במקום הנכון. " + formatValue(p) + "% הם " + formatValue(p / 100) + ", לא " + formatValue(bad) + ".");
      }
    });
    if (scale.op === "increase" && /[-]/.test(normalize(typed)) && sameNum(value, source - scale.change)) {
      add("בהגדלה מחברים את התוספת אל הערך המקורי.");
    }
    if (scale.op === "decrease" && /[+]/.test(normalize(typed)) && sameNum(value, source + scale.change)) {
      add("בהקטנה מחסרים את ההפחתה מהערך המקורי.");
    }
    Object.keys(world.byId).forEach(function (id) {
      var other = world.byId[id];
      if (!other || other.id === scale.from.id || other.value == null) return;
      if (sameNum(value, other.value * scale.factor) || sameNum(value, other.value * p / 100)) {
        add("השינוי של " + (scale.to ? scale.to.label : "") + " מחושב מתוך " + scale.from.label + ".");
      }
    });
  });
  if (notes.length === 1) return notes[0];
  return "";
}

function relationFieldError(ex, field, value) {
  if (!isRelated(ex) || value == null) return "";
  var world = relationWorld(ex);
  var quantity = world.byId[field.group];
  if (!quantity) return "";
  var notes = [];
  function add(note) {
    if (notes.indexOf(note) < 0) notes.push(note);
  }
  world.scales.forEach(function (scale) {
    if (!scale.to || scale.to.id !== quantity.id) return;
    if (sameNum(value, scale.change)) add("חישבתם את גודל השינוי. השאלה מבקשת את הערך שאחרי השינוי.");
    if (sameNum(value, scale.percent)) {
      add(scale.op === "decrease"
        ? "בהקטנה הערך החדש הוא 100% פחות אחוז ההקטנה."
        : "בהגדלה הערך החדש הוא 100% ועוד אחוז ההגדלה.");
    }
    if (scale.op === "increase" && sameNum(value, scale.from.value - scale.change)) add("בהגדלה מחברים את התוספת אל הערך המקורי.");
    if (scale.op === "decrease" && sameNum(value, scale.from.value + scale.change)) add("בהקטנה מחסרים את ההפחתה מהערך המקורי.");
    Object.keys(world.byId).forEach(function (id) {
      var other = world.byId[id];
      if (!other || other.id === scale.from.id || other.value == null) return;
      if (sameNum(value, other.value * scale.factor) || sameNum(value, other.value * scale.percent / 100)) {
        add("השינוי של " + scale.to.label + " מחושב מתוך " + scale.from.label + ".");
      }
    });
    [10, 100].forEach(function (place) {
      var bad = scale.percent / (100 * place);
      var grown = scale.op === "decrease" ? scale.from.value * (1 - bad) : scale.from.value * (1 + bad);
      if (sameNum(value, grown) || sameNum(value, scale.from.value * bad)) {
        add("ההמרה לעשרוני אינה במקום הנכון. " + formatValue(scale.percent) + "% הם " + formatValue(scale.percent / 100) + ", לא " + formatValue(bad) + ".");
      }
    });
  });
  world.links.forEach(function (link) {
    if (!link.to || link.to.id !== quantity.id || link.op !== "sum") return;
    var hits = link.parts.filter(function (part) { return part && sameNum(part.value, value); });
    if (hits.length === 1) add("זהו אחד מהגדלים בסכום. השאלה מבקשת את הסכום כולו.");
  });
  if (notes.length === 1) return notes[0];
  return "";
}

function percentCombineLine(scale) {
  var sign = scale.op === "increase" ? "+" : "-";
  return "100% " + sign + " " + formatValue(scale.percent) + "% = " + formatValue(scale.newPercent) + "%";
}

function changeCombineLine(scale) {
  var sign = scale.op === "decrease" ? " - " : " + ";
  return formatValue(scale.from.value) + sign + formatValue(scale.change) + " = " + formatValue(scale.result);
}

function sumLine(link) {
  return link.parts.map(function (part) { return formatValue(part.value); }).join(" + ") + " = " + formatValue(link.value);
}

function deriveRelated(ex, history) {
  var world = relationWorld(ex);
  var known = {};
  Object.keys(world.byId).forEach(function (id) {
    if (world.byId[id].given) known[id] = true;
  });
  var percentKnown = {};
  var path = null;
  var open = null;
  (history || []).forEach(function (line) {
    var info = assessRelated(ex, line);
    if (!info.ok) return;
    var settled = info.result.step === "done" || shownResult(line);
    if (info.quantityId && settled) known[info.quantityId] = true;
    if (info.role === "percent" && info.scale && settled) {
      percentKnown[info.scale.index] = true;
      path = { kind: "percent", scale: info.scale };
    }
    if (info.role === "change" && info.scale && settled) path = { kind: "change", scale: info.scale };
    if (info.role === "result" && info.scale && settled && info.scale.to) {
      known[info.scale.to.id] = true;
      path = null;
    }
    if (info.role === "result" && info.scale && (info.result.step === "proportion" || info.result.step === "isolate")) {
      percentKnown[info.scale.index] = true;
    }
    if (!settled && (info.result.step === "proportion" || info.result.step === "isolate" || info.result.step === "expr")) {
      open = info;
    } else open = null;
  });
  return { world: world, known: known, percentKnown: percentKnown, path: path, open: open };
}

function relatedDone(ex, history) {
  var state = deriveRelated(ex, history);
  return (ex.fields || []).every(function (field) { return !!state.known[field.quantity]; });
}

function guidedRelated(ex, state) {
  var steps = [];
  var seen = {};
  function want(id) {
    if (!id || seen[id] || state.known[id]) return;
    seen[id] = true;
    var scale = null;
    state.world.scales.forEach(function (item) { if (item.to && item.to.id === id) scale = item; });
    if (scale) {
      want(scale.from.id);
      steps.push({ type: "scale", scale: scale });
      return;
    }
    var link = null;
    state.world.links.forEach(function (item) { if (item.to && item.to.id === id) link = item; });
    if (link) {
      link.parts.forEach(function (part) { if (part) want(part.id); });
      steps.push({ type: "sum", link: link });
    }
  }
  (ex.fields || []).forEach(function (field) { want(field.quantity); });
  if (!steps.length) return null;
  var first = steps[0];
  if (first.type === "sum") {
    return {
      line: sumLine(first.link),
      step: "value",
      done: false,
      joinPrev: false,
      hint: "חברו את הגדלים שמצאתם.",
    };
  }
  var scale = first.scale;
  if (scale.op !== "part" && !state.percentKnown[scale.index]) {
    return {
      line: percentCombineLine(scale),
      step: "expr",
      done: false,
      joinPrev: false,
      hint: scale.op === "decrease" ? "מצאו את האחוז שנשאר: 100% פחות אחוז ההקטנה." : "מצאו את האחוז החדש: 100% ועוד אחוז ההגדלה.",
    };
  }
  return {
    line: proportionLine(relationSpec(scale, "result")),
    step: "proportion",
    done: false,
    joinPrev: false,
    hint: "רשמו את הפרופורציה: האחוז חלקי 100 שווה לחלק חלקי השלם. במקום הגודל החסר רשמו x.",
  };
}

function nextRelated(ex, history) {
  var state = deriveRelated(ex, history);
  var step = null;
  if (state.open && state.open.result.step === "proportion" && state.open.scale) {
    var role = state.open.role === "change" ? "change" : "result";
    step = {
      line: isolateLine(relationSpec(state.open.scale, role)),
      step: "isolate",
      done: false,
      joinPrev: false,
      hint: "בודדו את x. אצלנו x = (השלם כפול האחוז) חלקי 100.",
    };
  } else if (state.open && state.open.result.step === "isolate" && state.open.scale) {
    var isolateRole = state.open.role === "change" ? "change" : "result";
    step = {
      line: valueLine(relationSpec(state.open.scale, isolateRole)),
      step: "value",
      done: false,
      joinPrev: false,
      hint: "חשבו את ערכו של x.",
    };
  } else if (state.open && state.open.result.step === "expr" && state.open.value != null) {
    step = {
      line: formatValue(state.open.value),
      step: "value",
      done: false,
      joinPrev: true,
      hint: "חשבו את הביטוי שרשמתם.",
    };
  } else if (state.path && state.path.kind === "change" && state.path.scale.to && !state.known[state.path.scale.to.id]) {
    step = {
      line: changeCombineLine(state.path.scale),
      step: "value",
      done: false,
      joinPrev: false,
      hint: state.path.scale.op === "decrease" ? "החסירו את ההפחתה מהערך המקורי." : "חברו את התוספת אל הערך המקורי.",
    };
  } else if (state.path && state.path.kind === "percent" && state.path.scale.to && !state.known[state.path.scale.to.id]) {
    step = {
      line: proportionLine(relationSpec(state.path.scale, "result")),
      step: "proportion",
      done: false,
      joinPrev: false,
      hint: "רשמו את הפרופורציה: האחוז חלקי 100 שווה לחלק חלקי השלם. במקום הגודל החסר רשמו x.",
    };
  } else {
    step = guidedRelated(ex, state);
  }
  if (!step) return null;
  var after = deriveRelated(ex, (history || []).concat([step.line]));
  step.done = (ex.fields || []).every(function (field) { return !!after.known[field.quantity]; });
  return step;
}

function answerFields(ex) {
  if (isShares(ex)) {
    var shares = sharePack(ex);
    return (ex.fields || []).map(function (field) {
      var share = null;
      var i;
      for (i = 0; i < shares.length; i++) if (shares[i].id === field.share || shares[i].id === field.group) share = shares[i];
      return {
        id: field.id,
        label: field.label || (share && share.label) || "",
        unit: field.unit || "%",
        kind: "percent",
        group: field.share || field.group || "",
        given: false,
        name: field.label || (share && share.label) || "",
        value: share ? share.target : null,
      };
    });
  }
  if (isRelated(ex)) {
    var world = relationWorld(ex);
    return (ex.fields || []).map(function (field) {
      var quantity = world.byId[field.quantity];
      return {
        id: field.id,
        label: field.label || (quantity && quantity.label) || "",
        unit: field.unit || "",
        kind: "amount",
        group: field.quantity,
        given: false,
        name: field.label || (quantity && quantity.label) || "",
        value: quantity ? quantity.value : null,
      };
    });
  }
  var groups = groupList(ex);
  if (ex.fields && ex.fields.length) {
    return ex.fields.map(function (field) {
      var group = null;
      var i;
      for (i = 0; i < groups.length; i++) if (groups[i].id === field.group) group = groups[i];
      if (field.kind === "all") {
        var spec = wholeSpec(ex);
        return {
          id: field.id,
          label: field.label || "",
          unit: field.unit || "",
          kind: "amount",
          group: field.group || "",
          given: false,
          name: field.label || "השלם",
          value: spec ? targetOf(spec) : null,
        };
      }
      var kind = field.kind === "percent" ? "percent" : "amount";
      return {
        id: field.id,
        label: field.label || (group && group.label) || "",
        unit: field.unit || "",
        kind: kind,
        group: field.group,
        given: !!(group && group.given),
        name: (group && group.label) || field.label || "",
        value: group ? (kind === "percent" ? group.percent : group.amount) : null,
      };
    });
  }
  return groups.map(function (g) {
    return { id: g.id, label: g.label, unit: "", kind: "amount", group: g.id, given: g.given, name: g.label, value: g.amount };
  });
}

function judgeFields(ex, answers) {
  var fields = answerFields(ex);
  var locks = {};
  var wrong = [];
  var missing = [];
  var values = {};
  var amountsOnly = fields.every(function (field) { return field.kind === "amount"; });
  fields.forEach(function (field) {
    var raw = answers && answers[field.id];
    if (!String(raw || "").trim()) {
      missing.push(field);
      return;
    }
    var value = fieldValue(raw);
    values[field.id] = value;
    if (value != null && sameNum(value, field.value)) locks[field.id] = true;
    else wrong.push(field);
  });
  var swapped = false;
  if (fields.length === 2 && wrong.length === 2 && !missing.length) {
    if (values[fields[0].id] != null && values[fields[1].id] != null && sameNum(values[fields[0].id], fields[1].value) && sameNum(values[fields[1].id], fields[0].value)) swapped = true;
  }
  function wrongText(field) {
    var specific = relationFieldError(ex, field, values[field.id]);
    if (specific) return specific;
    return (field.kind === "percent" ? "האחוז של " : "הכמות של ") + field.name + (field.kind === "percent" ? " אינו נכון." : " אינה נכונה.");
  }
  function missingText(field) {
    return (field.kind === "percent" ? "חסר האחוז של " : "חסרה הכמות של ") + field.name + ".";
  }
  var message = "";
  if (swapped) {
    message = (amountsOnly ? "הכמויות נכונות, אבל נראה שהחלפת בין " : "הערכים נכונים, אבל נראה שהחלפת בין ") + fields[0].label + " לבין " + fields[1].label + ".";
  } else if (wrong.length) message = wrong.map(wrongText).join(" ");
  else if (missing.length && Object.keys(locks).length) message = missing.map(missingText).join(" ");
  else if (missing.length) message = amountsOnly ? "כתבו את הכמויות בשדות." : "כתבו את התשובות בשדות.";
  return { locks: locks, message: message, solved: !wrong.length && !missing.length, swapped: swapped };
}

function subsetSums(values) {
  var out = [];
  function walk(index, sum, count) {
    if (index === values.length) {
      if (count > 0) out.push(sum);
      return;
    }
    walk(index + 1, sum, count);
    walk(index + 1, sum + values[index], count + 1);
  }
  walk(0, 0, 0);
  return out;
}

function familyFacts(ex) {
  var groups = groupList(ex);
  var percents = [];
  var amounts = [];
  groups.forEach(function (g) {
    if (isFinite(g.percent)) percents.push(Number(g.percent));
    if (isFinite(g.amount)) amounts.push(Number(g.amount));
  });
  var percentFacts = subsetSums(percents);
  if (!percentFacts.some(function (n) { return sameNum(n, 100); })) percentFacts.push(100);
  var amountFacts = subsetSums(amounts);
  var whole = Number(ex.all);
  if (isFinite(whole) && !amountFacts.some(function (n) { return sameNum(n, whole); })) amountFacts.push(whole);
  return { percentFacts: percentFacts, amountFacts: amountFacts, groups: groups };
}

function workSide(text) {
  var cleaned = normalize(String(text || "").replace(/%/g, ""));
  var parts = splitEq(cleaned);
  if (parts.length === 2 && parts[0]) return parts[0];
  if (parts.length === 2 && !parts[0]) return parts[1];
  return cleaned;
}

function numberLiterals(text) {
  var found = [];
  var re = /\d+(?:\.\d+)?/g;
  var match;
  while ((match = re.exec(text))) found.push(Number(match[0]));
  return found;
}

function inFacts(n, facts) {
  var i;
  for (i = 0; i < facts.length; i++) if (sameNum(facts[i], n)) return true;
  return false;
}

function factStep(ex, typed) {
  var cleaned = normalize(String(typed || "").replace(/%/g, ""));
  if (!cleaned || /[*/x]/.test(cleaned)) return null;
  var value = fieldValue(typed);
  if (value == null) return null;
  var facts = familyFacts(ex);
  var literals = numberLiterals(workSide(typed));
  if (!literals.length) return null;
  var percentOk = inFacts(value, facts.percentFacts) && literals.every(function (n) { return inFacts(n, facts.percentFacts); });
  var amountOk = inFacts(value, facts.amountFacts) && literals.every(function (n) { return inFacts(n, facts.amountFacts); });
  if (!percentOk && !amountOk) return null;
  var group = null;
  if (amountOk) {
    facts.groups.forEach(function (g) {
      if (sameNum(g.amount, value)) group = g;
    });
  }
  return {
    ok: true,
    group: group,
    found: !!(group && amountOk),
    result: { shows: [displayTyped(typed)], joinPrev: false, step: "expr", done: false },
  };
}

function scaledWhole(ex, typed) {
  var cleaned = normalize(String(typed || "").replace(/%/g, ""));
  if (!cleaned || (cleaned.indexOf("*") < 0 && cleaned.indexOf("/") < 0) || cleaned.indexOf("x") >= 0) return null;
  var value = fieldValue(typed);
  if (value == null) return null;
  var facts = familyFacts(ex);
  if (!inFacts(value, facts.amountFacts)) return null;
  var whole = Number(ex.all);
  var literals = numberLiterals(workSide(typed));
  function allowed(n) {
    if (inFacts(n, facts.percentFacts) || sameNum(n, whole)) return true;
    var i;
    for (i = 0; i < facts.percentFacts.length; i++) {
      if (sameNum(n, facts.percentFacts[i] / 100)) return true;
    }
    return false;
  }
  if (!literals.length || !literals.every(allowed)) return null;
  var group = null;
  facts.groups.forEach(function (g) {
    if (sameNum(g.amount, value)) group = g;
  });
  return {
    ok: true,
    group: group,
    found: !!group,
    result: { shows: [displayTyped(typed)], joinPrev: false, step: "expr", done: false },
  };
}

function assessGroups(ex, typed) {
  var groups = groupList(ex);
  var placement = "";
  var noted = "";
  var unequal = "";
  var i;
  for (i = 0; i < groups.length; i++) {
    var result = assessTyped({ unknown: "part", percent: groups[i].percent, all: ex.all }, typed);
    if (result.ok) {
      var plain = normalize(String(typed || "").replace(/%/g, ""));
      var grounded = result.step === "proportion" || result.step === "isolate" || bareNumber(plain) || plain.indexOf("x") >= 0 || factStep(ex, typed) || scaledWhole(ex, typed);
      if (grounded) return { ok: true, group: groups[i], result: result, found: !!(result.done || result.step === "expr") };
    }
    if (!placement && result.code === "placement") placement = result.message;
    if (!unequal && result.message && result.message.indexOf("לא שווה") >= 0) unequal = result.message;
    if (!noted && result.message && (result.message.indexOf("מספר רגיל") >= 0 || result.message.indexOf("אינה במקום הנכון") >= 0 || result.message.indexOf("חסר הכפל") >= 0)) noted = result.message;
  }
  var summed = factStep(ex, typed);
  if (summed) return summed;
  var scaled = scaledWhole(ex, typed);
  if (scaled) return scaled;
  if (placement) return { ok: false, message: placement };
  if (noted) return { ok: false, message: noted };
  if (unequal) return { ok: false, message: unequal };
  return { ok: false, message: "זה לא שקול לחישוב המבוקש." };
}

function advanceStep(progress, result) {
  var order = { "": 0, proportion: 1, isolate: 2, expr: 2, value: 3, subtract: 4, complement: 1, done: 5 };
  var current = progress.step || "";
  var next = result.step || current;
  if ((order[next] || 0) >= (order[current] || 0)) progress.step = next;
  if (result.guide != null) progress.guide = result.guide;
  if (result.done) {
    progress.step = "done";
    progress.done = true;
  }
}

function missingGroup(groups) {
  var missing = groups.filter(function (g) { return !g.given; });
  return missing.length === 1 ? missing[0] : null;
}

function needsComplementPath(ex) {
  if (!isMulti(ex) || !missingGroup(groupList(ex))) return false;
  var fields = answerFields(ex);
  var missing = missingGroup(groupList(ex));
  if (fields.some(function (field) { return field.kind === "percent"; })) return true;
  var asksMissing = fields.some(function (field) { return field.group === missing.id; });
  var asksGiven = fields.some(function (field) { return field.kind === "amount" && field.group !== missing.id; });
  if (groupList(ex).length > 2) return asksMissing || !asksGiven;
  return asksMissing && !asksGiven;
}

function complementLine(groups, missing) {
  var given = groups.filter(function (g) { return g.given; });
  var left = ["100%"].concat(given.map(function (g) { return formatValue(g.percent) + "%"; }));
  return left.join(" - ") + " = " + formatValue(missing.percent) + "%";
}

function guideScript(ex) {
  var groups = groupList(ex);
  var missing = missingGroup(groups);
  var fields = answerFields(ex);
  var lines = [];
  function addAmount(group, intro) {
    var spec = { unknown: "part", percent: group.percent, all: ex.all };
    lines.push({
      line: proportionLine(spec),
      step: "proportion",
      hint: intro + " רשמו את הפרופורציה: האחוז חלקי 100 שווה לחלק חלקי השלם. במקום הגודל החסר רשמו x.",
    });
    lines.push({
      line: isolateLine(spec),
      step: "isolate",
      hint: "בודדו את x. אצלנו x = (השלם כפול האחוז) חלקי 100.",
    });
    lines.push({ line: valueLine(spec), step: "value", hint: "חשבו את ערכו של x." });
  }
  lines.push({
    line: complementLine(groups, missing),
    step: "complement",
    hint: "מצאו את האחוז של " + missing.label + ": 100% פחות האחוזים הנתונים.",
  });
  if (fields.some(function (field) { return field.group === missing.id && field.kind === "amount"; })) {
    addAmount(missing, "עכשיו חשבו את הכמות של " + missing.label + " לפי האחוז שמצאתם.");
  }
  fields.forEach(function (field) {
    if (field.kind !== "amount" || !field.given) return;
    var group = null;
    groups.forEach(function (g) { if (g.id === field.group) group = g; });
    if (group) addAmount(group, "מצאו את הכמות של " + group.label + ".");
  });
  return lines;
}

function shownResult(text) {
  var cleaned = normalize(String(text || "").replace(/%/g, ""));
  if (bareNumber(cleaned)) return true;
  var parts = splitEq(cleaned);
  if (parts.length === 2 && parts[1] && bareNumber(parts[1])) return true;
  return false;
}

function interpretLine(ex, line) {
  var text = String(line || "").trim();
  if (!text) return null;
  if (!isMulti(ex)) return null;
  var work = assessGroups(ex, text);
  if (!work.ok) return null;
  return {
    step: (work.result && work.result.step) || "",
    group: work.group || null,
    value: fieldValue(text),
  };
}

function deriveState(ex, history) {
  var groups = groupList(ex);
  var knownPercent = {};
  var knownAmount = {};
  var open = null;
  groups.forEach(function (g) {
    if (g.given) knownPercent[g.id] = true;
  });
  (history || []).forEach(function (line) {
    var info = interpretLine(ex, line);
    if (!info) return;
    var settled = info.step === "done" || shownResult(line);
    if (info.group && (info.step === "proportion" || info.step === "isolate" || info.step === "expr" || info.step === "done")) {
      knownPercent[info.group.id] = true;
    }
    groups.forEach(function (g) {
      if (info.value != null && settled && sameNum(info.value, g.percent)) knownPercent[g.id] = true;
      if (info.value != null && settled && sameNum(info.value, g.amount)) knownAmount[g.id] = true;
    });
    if (info.group && settled && (info.step === "value" || info.step === "done")) knownAmount[info.group.id] = true;
    if (!settled && (info.step === "proportion" || info.step === "isolate" || info.step === "expr")) {
      open = { kind: info.step, group: info.group, value: info.value };
    } else {
      open = null;
    }
  });
  return { groups: groups, knownPercent: knownPercent, knownAmount: knownAmount, open: open };
}

function allAskedKnown(ex, state) {
  return answerFields(ex).every(function (field) {
    if (field.kind === "percent") return !!state.knownPercent[field.group];
    return !!state.knownAmount[field.group];
  });
}

function pendingAmounts(ex, state) {
  var fields = answerFields(ex);
  var list = [];
  function push(group) {
    if (!group || state.knownAmount[group.id]) return;
    if (list.some(function (item) { return item.id === group.id; })) return;
    var asked = fields.some(function (field) { return field.group === group.id && field.kind === "amount"; });
    if (asked) list.push(group);
  }
  push(missingGroup(state.groups));
  fields.forEach(function (field) {
    if (field.kind !== "amount") return;
    var group = null;
    state.groups.forEach(function (item) { if (item.id === field.group) group = item; });
    push(group);
  });
  return list;
}

function amountStep(group, ex, intro) {
  var spec = { unknown: "part", percent: group.percent, all: ex.all };
  return {
    line: proportionLine(spec),
    step: "proportion",
    done: false,
    joinPrev: false,
    hint: intro + " רשמו את הפרופורציה: האחוז חלקי 100 שווה לחלק חלקי השלם. במקום הגודל החסר רשמו x.",
  };
}

function nextGuided(ex, state) {
  if (needsComplementPath(ex)) {
    var missing = missingGroup(state.groups);
    if (missing && !state.knownPercent[missing.id]) {
      return {
        line: complementLine(state.groups, missing),
        step: "complement",
        done: false,
        joinPrev: false,
        hint: "מצאו את האחוז של " + missing.label + ": 100% פחות האחוזים הנתונים.",
      };
    }
    var pending = pendingAmounts(ex, state);
    if (pending.length) return amountStep(pending[0], ex, "חשבו את הכמות של " + pending[0].label + ".");
    return null;
  }
  var primary = primaryGroup(state.groups);
  var other = otherGroup(state.groups, primary);
  if (!state.knownAmount[primary.id]) {
    return amountStep(primary, ex, "מצאו את " + primary.label + ".");
  }
  if (!state.knownAmount[other.id]) {
    return {
      line: formatValue(ex.all) + " - " + formatValue(primary.amount),
      step: "subtract",
      done: false,
      joinPrev: false,
      hint: "מצאו את " + other.label + ": השלם פחות הקבוצה שכבר מצאתם.",
    };
  }
  return null;
}

function nextFromHistory(ex, history) {
  var state = deriveState(ex, history);
  var step = null;
  if (state.open && state.open.kind === "proportion" && state.open.group) {
    var spec = { unknown: "part", percent: state.open.group.percent, all: ex.all };
    step = {
      line: isolateLine(spec),
      step: "isolate",
      done: false,
      joinPrev: false,
      hint: "בודדו את x. אצלנו x = (השלם כפול האחוז) חלקי 100.",
    };
  } else if (state.open && state.open.kind === "isolate" && state.open.group) {
    step = {
      line: valueLine({ unknown: "part", percent: state.open.group.percent, all: ex.all }),
      step: "value",
      done: false,
      joinPrev: false,
      hint: "חשבו את ערכו של x.",
    };
  } else if (state.open && state.open.kind === "expr" && state.open.value != null) {
    step = {
      line: formatValue(state.open.value),
      step: "value",
      done: false,
      joinPrev: true,
      hint: "חשבו את הביטוי שרשמתם.",
    };
  } else {
    step = nextGuided(ex, state);
  }
  if (!step) return null;
  var after = deriveState(ex, (history || []).concat([step.line]));
  step.done = allAskedKnown(ex, after);
  return step;
}

function nextComplementLine(ex, progress) {
  var script = guideScript(ex);
  var guide = progress.guide || 0;
  if (guide >= script.length) return null;
  var item = script[guide];
  return { line: item.line, step: item.step, done: guide + 1 >= script.length, joinPrev: false, guide: guide + 1 };
}

function nextMultiLine(ex, progress, history) {
  if (history && history.length) return nextFromHistory(ex, history);
  if (needsComplementPath(ex)) return nextComplementLine(ex, progress);
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

function isExpress(ex) {
  return !!(ex && ex.express);
}

function anchorSpec(ex) {
  if (!isMulti(ex)) return null;
  var groups = groupList(ex);
  var anchors = groups.filter(function (g) {
    return g.amountGiven != null && g.percent != null && g.percent !== 0;
  });
  if (anchors.length !== 1) return null;
  return { unknown: "all", percent: anchors[0].percent, part: anchors[0].amountGiven };
}

function wholeSpec(ex) {
  if (!ex) return null;
  var asks = unknownOf(ex) === "all" || (ex.fields || []).some(function (field) { return field.kind === "all"; });
  if (!asks) return null;
  if (!isMulti(ex) && ex.part != null && ex.part !== "" && ex.percent != null) {
    return { unknown: "all", percent: Number(ex.percent), part: Number(ex.part) };
  }
  return anchorSpec(ex);
}

function asksWhole(ex) {
  return !!wholeSpec(ex);
}

function coefficientMatches(lin, percent) {
  return !!(lin && !lin.bad && !lin.b && lin.a && sameNum(lin.a, factorValue(percent)));
}

function isSimplifiedProduct(ex, text) {
  var norm = normalize(text);
  if (!norm || norm.indexOf("/") >= 0 || norm.indexOf("=") >= 0) return false;
  return coefficientMatches(parseLinear(norm), ex.percent);
}

function expressMistake(ex, text) {
  var lin = parseLinear(splitEq(normalize(text))[0]);
  var percent = Number(ex.percent);
  var factor = factorValue(percent);
  if (lin && !lin.bad && !lin.b && sameNum(lin.a, percent)) {
    return "האחוז הוכפל כמספר רגיל. " + formatValue(percent) + "% הם " + formatFactor(percent) + ", לא " + formatValue(percent) + ".";
  }
  var bad = [percent / 10, percent / 1000, percent / 10000];
  var i;
  if (lin && !lin.bad && !lin.b && lin.a) {
    for (i = 0; i < bad.length; i++) {
      if (sameNum(lin.a, bad[i]) && !sameNum(bad[i], factor)) {
        return "ההמרה לעשרוני אינה במקום הנכון. " + formatValue(percent) + "% הם " + formatFactor(percent) + ", לא " + formatDecimal(bad[i]) + ".";
      }
    }
  }
  if (lin && !lin.bad && !lin.a && sameNum(lin.b, factor)) return "חסר הכפל ב-x.";
  return "זה לא שקול לחישוב המבוקש.";
}

function assessExpress(ex, typed) {
  var text = normalize(typed);
  if (!text) return { ok: false, message: "כתבו תשובה." };
  if (text.charAt(0) === "=") {
    var rest = text.slice(1);
    if (isSimplifiedProduct(ex, rest)) {
      return {
        ok: true,
        done: true,
        step: "done",
        shows: [displayTyped(rest)],
        joinPrev: true,
        message: "",
      };
    }
    return { ok: false, message: expressMistake(ex, rest) };
  }
  var parts = splitEq(text);
  if (parts.length > 2) return { ok: false, message: "זה לא שקול לחישוב המבוקש." };
  if (parts.length === 2) {
    var left = parseLinear(parts[0]);
    var right = parseLinear(parts[1]);
    if (coefficientMatches(left, ex.percent) && coefficientMatches(right, ex.percent)) {
      var simplified = isSimplifiedProduct(ex, parts[0]) || isSimplifiedProduct(ex, parts[1]);
      return {
        ok: true,
        done: simplified,
        step: simplified ? "done" : "expr",
        shows: [displayTyped(text)],
        message: "",
      };
    }
    return { ok: false, message: expressMistake(ex, text) };
  }
  if (coefficientMatches(parseLinear(text), ex.percent)) {
    var finalForm = isSimplifiedProduct(ex, text);
    return {
      ok: true,
      done: finalForm,
      step: finalForm ? "done" : "expr",
      shows: [displayTyped(text)],
      message: "",
    };
  }
  return { ok: false, message: expressMistake(ex, text) };
}

function expressProductLine(ex) {
  return "(" + formatValue(ex.percent) + "/100)·x";
}

function expressSimpleLine(ex) {
  return formatFactor(ex.percent) + "x";
}

function nextExpress(ex, history) {
  var sawSimple = false;
  var sawProduct = false;
  (history || []).forEach(function (line) {
    var judged = assessExpress(ex, line);
    if (!judged.ok) return;
    if (judged.done) sawSimple = true;
    else sawProduct = true;
  });
  if (sawSimple) return null;
  if (sawProduct) {
    return {
      line: expressSimpleLine(ex),
      step: "done",
      done: true,
      joinPrev: true,
      hint: "פשטו את המקדם למספר עשרוני.",
    };
  }
  return {
    line: expressProductLine(ex),
    step: "expr",
    done: false,
    joinPrev: false,
    hint: "רשמו את האחוז חלקי 100, כפול x.",
  };
}

function productSetupLine(spec) {
  return "(" + formatValue(spec.percent) + "/100)·x = " + formatValue(spec.part);
}

function decimalSetupLine(spec) {
  return formatFactor(spec.percent) + "x = " + formatValue(spec.part);
}

function isDecimalSetup(spec, text) {
  var norm = normalize(text);
  if (norm.indexOf("/") >= 0 || norm.indexOf("=") < 0) return false;
  var sides = splitEq(norm);
  if (sides.length !== 2) return false;
  var left = parseLinear(sides[0]);
  var right = parseLinear(sides[1]);
  if (!left || !right) return false;
  var factor = factorValue(spec.percent);
  var coef = left.a || right.a;
  var constant = !left.a ? left.b : (!right.a ? right.b : null);
  return sameNum(coef, factor) && constant != null && sameNum(constant, Number(spec.part));
}

function readWholeHistory(spec, history) {
  var state = { solved: false, open: "", simplified: false, product: false };
  (history || []).forEach(function (line) {
    var expressed = assessExpress({ percent: spec.percent }, line);
    if (expressed.ok && expressed.done) state.simplified = true;
    else if (expressed.ok) state.product = true;
    var judged = assessTyped(spec, line);
    if (!judged.ok) return;
    if (judged.done) {
      state.solved = true;
      state.open = "";
      return;
    }
    if (judged.step === "proportion") state.open = "proportion";
    else if (judged.step === "isolate") state.open = "isolate";
    else if (isDecimalSetup(spec, line)) state.open = "decimal";
    else if (normalize(line).indexOf("/") >= 0) state.open = "product";
    else state.open = "equation";
  });
  return state;
}

function nextFindWhole(ex, history) {
  var spec = wholeSpec(ex);
  if (!spec) return null;
  var state = readWholeHistory(spec, history || []);
  if (state.solved) return null;
  if (state.open === "proportion") {
    return {
      line: isolateLine(spec),
      step: "isolate",
      done: false,
      joinPrev: false,
      hint: "בודדו את x. אצלנו x = (החלק כפול 100) חלקי האחוז.",
    };
  }
  if (state.open === "isolate" || state.open === "decimal" || state.open === "equation") {
    return {
      line: valueLine(spec),
      step: "done",
      done: true,
      joinPrev: false,
      hint: "פתרו את המשוואה ומצאו את x.",
    };
  }
  if (state.open === "product" || state.product || state.simplified) {
    return {
      line: decimalSetupLine(spec),
      step: "decimal",
      done: false,
      joinPrev: false,
      hint: state.simplified ? "השוו את הביטוי שמצאתם אל החלק הנתון." : "פשטו את השבר למספר עשרוני.",
    };
  }
  return {
    line: productSetupLine(spec),
    step: "product",
    done: false,
    joinPrev: false,
    hint: "רשמו שהחלק הנתון הוא האחוז מתוך x: האחוז חלקי 100, כפול x, שווה לחלק.",
  };
}

function historyDone(ex, history, kind) {
  return (history || []).some(function (line) {
    if (kind === "express") {
      var expressed = assessExpress(ex, line);
      return expressed.ok && expressed.done;
    }
    var spec = wholeSpec(ex);
    if (!spec) return false;
    var judged = assessTyped(spec, line);
    return judged.ok && judged.done;
  });
}

function stripPercentSign(text) {
  return String(text || "").replace(/%/g, "");
}

function calcMessage(shown) {
  return "הדרך נכונה, אבל נראה שיש טעות בחישוב. בדוק שוב את " + shown + ".";
}

function percentTask(ex) {
  if (!ex || ex.express || ex.compute || isShares(ex)) return null;
  if (unknownOf(ex) !== "percent") return null;
  var all = Number(ex.all);
  var part = ex.part != null && ex.part !== "" ? Number(ex.part) : NaN;
  var prep = null;
  var complement = ex.complement != null && ex.complement !== "" ? Number(ex.complement) : null;
  if (ex.wholeSum && ex.wholeSum.length >= 2) {
    var sumA = Number(ex.wholeSum[0]);
    var sumB = Number(ex.wholeSum[1]);
    all = sumA + sumB;
    prep = { op: "add", a: sumA, b: sumB, result: all };
  }
  if (ex.rest != null && ex.rest !== "") {
    var minus = Number(ex.rest);
    part = all - minus;
    if (complement == null) complement = minus;
    prep = { op: "sub", a: all, b: minus, result: part };
  }
  if (!isFinite(part) || !isFinite(all) || !all) return null;
  return { part: part, all: all, target: (part * 100) / all, prep: prep, complement: complement };
}

function asksPercent(ex) {
  return !!percentTask(ex);
}

function percentEx(part, all) {
  return { unknown: "percent", part: part, all: all };
}

function displayPrep(job) {
  return formatValue(job.a) + (job.op === "add" ? " + " : " - ") + formatValue(job.b);
}

function computeTarget(job) {
  if (!job) return null;
  if (job.op === "add") return Number(job.a) + Number(job.b);
  return Number(job.a) - Number(job.b);
}

function displayCompute(job) {
  return formatValue(job.a) + (job.op === "add" ? " + " : " - ") + formatValue(job.b);
}

function productFactors(text) {
  var norm = normalize(text);
  var left = norm.match(/^(\d+(?:\.\d+)?)x=(\d+(?:\.\d+)?)\*(\d+(?:\.\d+)?)$/);
  if (left) return { coef: Number(left[1]), a: Number(left[2]), b: Number(left[3]) };
  var right = norm.match(/^(\d+(?:\.\d+)?)\*(\d+(?:\.\d+)?)=(\d+(?:\.\d+)?)x$/);
  if (right) return { coef: Number(right[3]), a: Number(right[1]), b: Number(right[2]) };
  return null;
}

function crossFromProportion(text) {
  var parsed = parseProportion(normalize(text));
  if (!parsed) return null;
  var left = parsed.left;
  var right = parsed.right;
  var coef = null;
  var factors = null;
  if (right.num === "x" && typeof left.den === "number") {
    coef = left.den;
    factors = [left.num, right.den];
  } else if (left.num === "x" && typeof right.den === "number") {
    coef = right.den;
    factors = [right.num, left.den];
  } else if (right.den === "x" && typeof left.num === "number") {
    coef = left.num;
    factors = [left.den, right.num];
  } else if (left.den === "x" && typeof right.num === "number") {
    coef = right.num;
    factors = [right.den, left.num];
  }
  if (typeof coef !== "number" || !factors || factors.some(function (factor) { return typeof factor !== "number"; })) return null;
  if (sameNum(factors[0], 100) && !sameNum(factors[1], 100)) factors = [factors[1], factors[0]];
  return formatValue(coef) + "x = " + formatValue(factors[0]) + "·" + formatValue(factors[1]);
}

function foldCross(text) {
  var factors = productFactors(text);
  if (!factors) return null;
  return formatValue(factors.coef) + "x = " + formatValue(factors.a * factors.b);
}

function isolateProduct(text) {
  var match = normalize(text).match(/^(\d+(?:\.\d+)?)x=(\d+(?:\.\d+)?)$/);
  if (!match || text.indexOf("*") >= 0 || text.indexOf("·") >= 0) return null;
  return "x = " + formatValue(Number(match[2])) + "/" + formatValue(Number(match[1]));
}

function complementFinish(spec, text) {
  if (!spec || spec.complement == null) return "";
  var alt = (Number(spec.complement) * 100) / Number(spec.all);
  var norm = normalize(stripPercentSign(text));
  var parts = splitEq(norm);
  var body = parts[0];
  if (!body) return "";
  var lin = parseLinear(body);
  if (!lin || lin.bad || lin.a || !sameNum(lin.b, spec.target)) return "";
  var literals = numberLiterals(body);
  if (!literals.some(function (n) { return sameNum(n, 100); })) return "";
  if (!literals.some(function (n) { return sameNum(n, alt); })) return "";
  if (parts.length === 1) return "expr";
  if (parts.length === 2 && parts[1]) {
    var right = parseLinear(parts[1]);
    if (right && !right.bad && !right.a && sameNum(right.b, spec.target)) return "done";
  }
  return "";
}

function percentComplementLine(spec) {
  var alt = (Number(spec.complement) * 100) / Number(spec.all);
  return "100% - " + formatValue(alt) + "% = " + formatValue(spec.target) + "%";
}

function assessPrep(spec, text) {
  var job = spec.prep;
  if (!job) return null;
  var norm = normalize(stripPercentSign(text));
  var parts = splitEq(norm);
  var body = parts.length === 2 && parts[0] ? parts[0] : parts[0];
  if (!body) return null;
  var lin = parseLinear(body);
  if (!lin || lin.bad || lin.a) return null;
  var literals = numberLiterals(body);
  var usesOperands = literals.some(function (n) { return sameNum(n, job.a); }) && literals.some(function (n) { return sameNum(n, job.b); });
  if (parts.length === 2 && parts[0] && parts[1]) {
    var right = parseLinear(parts[1]);
    if (usesOperands && sameNum(lin.b, job.result) && right && !right.a && !sameNum(right.b, job.result)) {
      return { ok: false, message: calcMessage(displayPrep(job)) };
    }
    if (usesOperands && sameNum(lin.b, job.result) && right && !right.a && sameNum(right.b, job.result)) {
      return { ok: true, done: false, step: "expr", shows: [displayTyped(text)], message: "" };
    }
  }
  if (usesOperands && sameNum(lin.b, job.result) && parts.length === 1) {
    return { ok: true, done: false, step: "expr", shows: [displayPrep(job)], message: "" };
  }
  if (parts.length === 1 && bareNumber(norm) && sameNum(Number(norm), job.result) && !sameNum(job.result, spec.target)) {
    return { ok: true, done: false, step: "expr", shows: [formatValue(job.result)], message: "" };
  }
  return null;
}

function arithmeticSlip(spec, text, history) {
  var norm = normalize(stripPercentSign(text));
  var lines = history || [];
  var last = "";
  var i;
  for (i = lines.length - 1; i >= 0; i--) {
    if (String(lines[i] || "").trim()) {
      last = String(lines[i]);
      break;
    }
  }
  if (!last) return "";
  var lastNorm = normalize(stripPercentSign(last));
  var factors = productFactors(lastNorm);
  var replaced = norm.match(/^(\d+(?:\.\d+)?)x=(\d+(?:\.\d+)?)$/);
  if (factors && replaced && sameNum(Number(replaced[1]), factors.coef) && !sameNum(Number(replaced[2]), factors.a * factors.b)) {
    return calcMessage(formatValue(factors.a) + "·" + formatValue(factors.b));
  }
  if (!factors && replaced && sameNum(Number(replaced[1]), spec.all) && !sameNum(Number(replaced[2]), spec.part * 100)) {
    var sawProportion = lines.some(function (line) {
      var judged = assessTyped(percentEx(spec.part, spec.all), stripPercentSign(line));
      return judged.ok && judged.step === "proportion";
    });
    if (sawProportion) return calcMessage(formatValue(spec.part) + "·100");
  }
  var quot = lastNorm.match(/^x=(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  var claimed = norm.match(/^x=(\d+(?:\.\d+)?)$/);
  if (quot && claimed && !sameNum(Number(claimed[1]), Number(quot[1]) / Number(quot[2]))) {
    return calcMessage(formatValue(Number(quot[1])) + "/" + formatValue(Number(quot[2])));
  }
  var sides = splitEq(norm);
  if (sides.length === 2 && sides[0] && bareNumber(sides[1])) {
    var left = parseLinear(sides[0]);
    if (left && !left.a && sameNum(left.b, spec.target) && !sameNum(Number(sides[1]), spec.target)) {
      return calcMessage(displayTyped(sides[0]));
    }
  }
  return "";
}

function assessFindPercent(ex, typed, history) {
  var spec = percentTask(ex);
  if (!spec) return { ok: false, message: "כתבו תשובה." };
  var raw = String(typed || "").trim();
  if (!raw) return { ok: false, message: "כתבו תשובה." };
  var stripped = stripPercentSign(raw);
  var finished = complementFinish(spec, raw);
  if (finished === "done") {
    return { ok: true, done: true, step: "done", shows: [percentComplementLine(spec)], message: "" };
  }
  if (finished === "expr") {
    return { ok: true, done: false, step: "expr", shows: [displayTyped(stripped)], message: "" };
  }
  var prep = assessPrep(spec, raw);
  if (prep) return prep;
  var placed = diagnosePlacement(percentEx(spec.part, spec.all), stripped);
  if (placed && placed.message) return { ok: false, message: placed.message, code: "placement" };
  var main = assessTyped(percentEx(spec.part, spec.all), stripped);
  if (main.ok) {
    if (raw.indexOf("%") >= 0 && main.done) main.shows = [formatValue(spec.target) + "%"];
    return main;
  }
  if (spec.complement != null) {
    var alt = assessTyped(percentEx(spec.complement, spec.all), stripped);
    if (alt.ok) {
      if (alt.done) {
        return { ok: true, done: false, step: "expr", shows: alt.shows, message: "" };
      }
      return alt;
    }
  }
  if (main.code === "placement") return main;
  var slip = arithmeticSlip(spec, raw, history);
  if (slip) return { ok: false, message: slip };
  return main;
}

function classifyPercent(spec, line) {
  var raw = String(line || "");
  var stripped = stripPercentSign(raw);
  var norm = normalize(stripped);
  if (!norm) return "";
  var finished = complementFinish(spec, raw);
  if (finished === "done") return "solved";
  if (finished === "expr") return "alt-expr";
  var factors = productFactors(norm);
  if (factors && sameNum((factors.a * factors.b) / factors.coef, spec.target)) return "cross";
  var equation = norm.match(/^(\d+(?:\.\d+)?)x=(\d+(?:\.\d+)?)$/);
  if (equation && !factors && sameNum(Number(equation[1]), spec.all) && sameNum(Number(equation[2]), spec.part * 100)) return "equation";
  if (equation && !factors && sameNum(Number(equation[2]) / Number(equation[1]), spec.target)) return "equation";
  var quot = norm.match(/^x=(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (quot && sameNum(Number(quot[1]) / Number(quot[2]), spec.target)) return "isolate";
  if (spec.prep) {
    var prepBody = spec.prep.op === "sub"
      ? String(spec.prep.a) + "-" + String(spec.prep.b)
      : String(spec.prep.a) + "+" + String(spec.prep.b);
    if (norm === prepBody) return "prep";
    if (norm === prepBody + "=" + formatValue(spec.prep.result)) return "prep-done";
    if (bareNumber(norm) && sameNum(Number(norm), spec.prep.result) && !sameNum(spec.prep.result, spec.target)) return "prep-done";
  }
  var main = assessTyped(percentEx(spec.part, spec.all), stripped);
  if (main.ok && main.done) return raw.indexOf("%") >= 0 ? "solved" : "value";
  if (main.ok && main.step === "proportion") return "proportion";
  if (main.ok && main.step === "isolate") return "isolate";
  if (main.ok && main.step === "expr") {
    if (norm.indexOf("x") < 0 && norm.indexOf("/") >= 0) return "expr";
    return "equation";
  }
  if (spec.complement != null) {
    var alt = assessTyped(percentEx(spec.complement, spec.all), stripped);
    if (alt.ok && alt.done) return "alt-value";
    if (alt.ok && alt.step === "proportion") return "alt-proportion";
    if (factors && sameNum((factors.a * factors.b) / factors.coef, (spec.complement * 100) / spec.all)) return "alt-cross";
    if (alt.ok) return "alt-expr";
  }
  return "";
}

function lastProportion(spec, history) {
  var found = "";
  (history || []).forEach(function (line) {
    if (classifyPercent(spec, line) === "proportion" || classifyPercent(spec, line) === "alt-proportion") found = line;
  });
  return found;
}

function percentSettled(spec, history) {
  return (history || []).some(function (line) {
    var kind = classifyPercent(spec, line);
    return kind === "solved" || kind === "value";
  });
}

function nextPercentScript(spec, history, closing) {
  var state = "";
  var lastLine = "";
  (history || []).forEach(function (line) {
    var kind = classifyPercent(spec, line);
    if (!kind) return;
    state = kind;
    lastLine = line;
  });
  if (state === "solved") return null;
  if (!state && spec.prep) {
    var prepDone = (history || []).some(function (line) { return classifyPercent(spec, line) === "prep-done"; });
    if (!prepDone) {
      return {
        line: displayPrep(spec.prep),
        step: "expr",
        done: false,
        joinPrev: false,
        hint: spec.prep.op === "add" ? "חשבו קודם את השלם." : "חשבו קודם את הכמות החסרה.",
      };
    }
  }
  if (state === "prep") {
    return {
      line: formatValue(spec.prep.result),
      step: "expr",
      done: false,
      joinPrev: true,
      hint: "חשבו את התוצאה.",
    };
  }
  if (!state || state === "prep-done") {
    return {
      line: formatValue(spec.part) + "/" + formatValue(spec.all) + " = x/100",
      step: "proportion",
      done: false,
      joinPrev: false,
      hint: "זהה מהו החלק ומהו השלם, ובנה יחס מתאים למציאת האחוז.",
    };
  }
  if (state === "proportion" || state === "alt-proportion") {
    var crossed = crossFromProportion(lastProportion(spec, history) || lastLine);
    return {
      line: crossed || (formatValue(spec.all) + "x = " + formatValue(spec.part) + "·100"),
      step: "expr",
      done: false,
      joinPrev: false,
      hint: "כפלו באלכסון.",
    };
  }
  if (state === "cross" || state === "alt-cross") {
    return { line: foldCross(lastLine), step: "expr", done: false, joinPrev: false, hint: "חשבו את הכפל." };
  }
  if (state === "equation") {
    return { line: isolateProduct(lastLine), step: "isolate", done: false, joinPrev: false, hint: "בודדו את x." };
  }
  if (state === "isolate") {
    var quotMatch = normalize(stripPercentSign(lastLine)).match(/^x=(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    var quotient = quotMatch ? Number(quotMatch[1]) / Number(quotMatch[2]) : spec.target;
    return { line: "x = " + formatValue(quotient), step: "value", done: false, joinPrev: false, hint: "חשבו את ערכו של x." };
  }
  if (state === "value") {
    return {
      line: formatValue(spec.target) + "%",
      step: "done",
      done: !!closing,
      joinPrev: false,
      hint: "רשמו את התשובה באחוזים.",
    };
  }
  if (state === "expr") {
    return { line: formatValue(spec.target), step: "done", done: true, joinPrev: true, hint: "חשבו את הביטוי שרשמתם." };
  }
  if (state === "alt-value" || state === "alt-expr") {
    return {
      line: percentComplementLine(spec),
      step: "done",
      done: !!closing,
      joinPrev: false,
      hint: "חשבו את האחוז המשלים: 100% פחות האחוז שמצאתם.",
    };
  }
  return {
    line: formatValue(spec.part) + "/" + formatValue(spec.all) + " = x/100",
    step: "proportion",
    done: false,
    joinPrev: false,
    hint: "זהה מהו החלק ומהו השלם, ובנה יחס מתאים למציאת האחוז.",
  };
}

function sharePack(ex) {
  var all = Number(ex.all);
  var known = 0;
  var missing = 0;
  var list = ex.shares.map(function (share) {
    var explicit = share.amount != null && share.amount !== "";
    var amount = explicit ? Number(share.amount) : null;
    if (amount == null) missing += 1;
    else known += amount;
    return { id: share.id, label: share.label || "", amount: amount, explicit: explicit };
  });
  if (missing === 1 && isFinite(all)) {
    list.forEach(function (share) {
      if (share.amount == null) share.amount = all - known;
    });
  }
  return list.map(function (share, index) {
    var other = list.length === 2 ? list[1 - index] : null;
    return {
      id: share.id,
      label: share.label,
      part: share.amount,
      all: all,
      target: share.amount != null && all ? (share.amount * 100) / all : null,
      complement: other && other.amount != null ? other.amount : null,
      explicit: share.explicit,
      prep: null,
    };
  });
}

function shareSettled(spec, history) {
  return (history || []).some(function (line) {
    return classifyPercent(spec, line) === "solved";
  });
}

function nextShares(ex, history) {
  var specs = sharePack(ex);
  var pending = null;
  var i;
  for (i = 0; i < specs.length; i++) {
    if (!shareSettled(specs[i], history)) {
      pending = specs[i];
      break;
    }
  }
  if (!pending) return null;
  var settled = specs.filter(function (spec) { return shareSettled(spec, history); });
  if (settled.length && specs.length === 2) {
    return {
      line: percentComplementLine(pending),
      step: "done",
      done: true,
      joinPrev: false,
      hint: "חשבו את האחוז המשלים: 100% פחות האחוז שמצאתם.",
    };
  }
  return nextPercentScript(pending, history, false);
}

function assessCompute(job, typed) {
  var target = computeTarget(job);
  var raw = String(typed || "").trim();
  if (!raw) return { ok: false, message: "כתבו תשובה." };
  var norm = normalize(raw);
  var shown = displayCompute(job);
  var expr = job.op === "add" ? String(job.a) + "+" + String(job.b) : String(job.a) + "-" + String(job.b);
  if (bareNumber(norm) && sameNum(Number(norm), target)) {
    return { ok: true, done: true, step: "done", shows: [formatValue(target)], message: "" };
  }
  var continued = splitEq(norm);
  if (continued.length === 2 && !continued[0] && bareNumber(continued[1]) && sameNum(Number(continued[1]), target)) {
    return { ok: true, done: true, step: "done", shows: [formatValue(target)], joinPrev: true, message: "" };
  }
  var parts = splitEq(norm);
  if (parts.length === 1 && parts[0] === expr) {
    return { ok: true, done: false, step: "expr", shows: [shown], message: "" };
  }
  if (parts.length === 2 && parts[0] === expr) {
    var right = parseLinear(parts[1]);
    if (right && !right.a && sameNum(right.b, target)) {
      return { ok: true, done: true, step: "done", shows: [shown + " = " + formatValue(target)], message: "" };
    }
    if (right && !right.a) return { ok: false, message: calcMessage(shown) };
  }
  var value = parseLinear(norm);
  if (value && !value.a && sameNum(value.b, target)) {
    return { ok: true, done: false, step: "expr", shows: [displayTyped(raw)], message: "" };
  }
  return { ok: false, message: "זה לא שקול לחישוב המבוקש." };
}

function computeSettled(job, history) {
  var target = computeTarget(job);
  return (history || []).some(function (line) {
    var judged = assessCompute(job, line);
    if (judged.ok && judged.done) return true;
    var norm = normalize(stripPercentSign(line));
    return bareNumber(norm) && sameNum(Number(norm), target);
  });
}

function nextCompute(ex, history) {
  var job = ex.compute;
  if (computeSettled(job, history)) return null;
  var started = (history || []).some(function (line) {
    return classifyComputeOpen(job, line);
  });
  if (started) {
    return { line: formatValue(computeTarget(job)), step: "done", done: true, joinPrev: true, hint: "חשבו את התוצאה." };
  }
  return {
    line: displayCompute(job),
    step: "expr",
    done: false,
    joinPrev: false,
    hint: job.op === "add" ? "חברו את שני המספרים." : "חשבו את ההפרש.",
  };
}

function classifyComputeOpen(job, line) {
  var norm = normalize(stripPercentSign(line));
  var expr = job.op === "add" ? String(job.a) + "+" + String(job.b) : String(job.a) + "-" + String(job.b);
  return norm === expr;
}

function assessShares(ex, typed, history) {
  var specs = sharePack(ex);
  var placement = "";
  var slip = "";
  var fallback = null;
  var i;
  for (i = 0; i < specs.length; i++) {
    var judged = assessFindPercent({ unknown: "percent", part: specs[i].part, all: specs[i].all, complement: specs[i].complement }, typed, history);
    if (judged.ok) return judged;
    if (!placement && judged.code === "placement") placement = judged.message;
    if (!slip && judged.message && judged.message.indexOf("טעות בחישוב") >= 0) slip = judged.message;
    fallback = judged;
  }
  if (placement) return { ok: false, message: placement, code: "placement" };
  if (slip) return { ok: false, message: slip };
  return fallback || { ok: false, message: "זה לא שקול לחישוב המבוקש." };
}

function assessCurrent(ex, typed, history) {
  if (ex && ex.compute) return assessCompute(ex.compute, typed);
  if (isShares(ex)) return assessShares(ex, typed, history);
  if (asksPercent(ex)) return assessFindPercent(ex, typed, history);
  if (isExpress(ex)) return assessExpress(ex, typed);
  if (asksWhole(ex)) {
    var whole = assessTyped(wholeSpec(ex), typed);
    if (whole.ok) return whole;
    if (isMulti(ex)) {
      var groupedWhole = assessGroups(ex, typed);
      if (groupedWhole.ok) return groupedWhole;
    }
    return whole;
  }
  if (isRelated(ex)) return assessRelated(ex, typed);
  if (isMulti(ex)) {
    var grouped = assessGroups(ex, typed);
    if (grouped.ok) return grouped;
    var anchor = anchorSpec(ex);
    if (anchor) {
      var ahead = assessTyped(anchor, typed);
      if (ahead.ok) return ahead;
    }
    return grouped;
  }
  return assessTyped(ex, typed);
}

function nextSiteLine(ex, progress, history) {
  if (ex && ex.compute) return nextCompute(ex, history || []);
  if (isShares(ex)) return nextShares(ex, history || []);
  if (asksPercent(ex)) return nextPercentScript(percentTask(ex), history || [], true);
  if (isExpress(ex)) return nextExpress(ex, history || []);
  if (asksWhole(ex)) return nextFindWhole(ex, history || []);
  if (isRelated(ex)) return nextRelated(ex, history || []);
  if (isMulti(ex)) return nextMultiLine(ex, progress, history);
  var step = progress.step || "";
  if (step === "done") return null;
  if (!step) return { line: proportionLine(ex), step: "proportion", done: false, joinPrev: false };
  if (step === "proportion") return { line: isolateLine(ex), step: "isolate", done: false, joinPrev: false };
  if (step === "expr") return { line: formatValue(targetOf(ex)), step: "done", done: true, joinPrev: true };
  return { line: valueLine(ex), step: "done", done: true, joinPrev: false };
}

function hintFor(ex, progress, history) {
  var step = progress.step || "";
  if (ex && ex.compute) {
    var computeStep = nextCompute(ex, history || []);
    if (!computeStep) return "רשמו את התוצאה.";
    return computeStep.hint;
  }
  if (isShares(ex)) {
    var shareStep = nextShares(ex, history || []);
    if (!shareStep) return "רשמו את האחוזים בשדות.";
    return shareStep.hint;
  }
  if (asksPercent(ex)) {
    var percentStep = nextPercentScript(percentTask(ex), history || [], true);
    if (!percentStep) return "רשמו את התשובה באחוזים.";
    return percentStep.hint;
  }
  if (isExpress(ex)) {
    var expressStep = nextExpress(ex, history || []);
    if (!expressStep) return "רשמו את הביטוי המצומצם.";
    return expressStep.hint;
  }
  if (asksWhole(ex)) {
    var wholeStep = nextFindWhole(ex, history || []);
    if (!wholeStep) return "רשמו את התשובה.";
    return wholeStep.hint;
  }
  if (isRelated(ex)) {
    var related = nextRelated(ex, history || []);
    if (!related) return "רשמו את התשובה בשדה.";
    return related.hint;
  }
  if (isMulti(ex) && history && history.length) {
    var adaptive = nextFromHistory(ex, history);
    if (!adaptive) return "רשמו את התשובות בשדות.";
    return adaptive.hint;
  }
  if (isMulti(ex) && needsComplementPath(ex)) {
    var script = guideScript(ex);
    var guide = (progress && progress.guide) || 0;
    if (guide >= script.length) return "רשמו את התשובות בשדות.";
    return script[guide].hint;
  }
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

function hasParts(ex) {
  return !!(ex && ex.parts && ex.parts.length);
}

function partIndexOf(ex, progress) {
  var index = progress && isFinite(Number(progress.part)) ? Number(progress.part) : 0;
  if (index < 0) index = 0;
  if (hasParts(ex) && index > ex.parts.length - 1) index = ex.parts.length - 1;
  return Math.floor(index);
}

function scopePart(ex, progress) {
  if (!hasParts(ex)) return ex;
  var part = ex.parts[partIndexOf(ex, progress)] || ex.parts[0];
  var scoped = {};
  var key;
  for (key in ex) {
    if (Object.prototype.hasOwnProperty.call(ex, key) && key !== "parts") scoped[key] = ex[key];
  }
  scoped.fields = part.fields || [];
  scoped.express = !!part.express;
  if (part.express) scoped.unknown = "part";
  else if (part.unknown) scoped.unknown = part.unknown;
  if (part.part != null && part.part !== "") scoped.part = part.part;
  if (part.percent != null && part.percent !== "") scoped.percent = part.percent;
  if (part.all != null && part.all !== "") scoped.all = part.all;
  if (part.rest != null && part.rest !== "") scoped.rest = part.rest;
  if (part.wholeSum) scoped.wholeSum = part.wholeSum;
  if (part.complement != null && part.complement !== "") scoped.complement = part.complement;
  if (part.compute) {
    scoped.compute = part.compute;
    scoped.unknown = "compute";
    scoped.express = false;
  }
  return scoped;
}

function partLabelAt(ex, progress) {
  if (!hasParts(ex)) return "";
  var part = ex.parts[partIndexOf(ex, progress)];
  return (part && part.label) || "";
}

function partSatisfied(ex, progress, history) {
  var scoped = scopePart(ex, progress);
  if (scoped.compute) return computeSettled(scoped.compute, history);
  if (asksPercent(scoped)) return percentSettled(percentTask(scoped), history);
  if (isExpress(scoped)) return historyDone(scoped, history, "express");
  if (asksWhole(scoped)) return historyDone(scoped, history, "whole");
  if (isRelated(scoped)) return relatedDone(scoped, history || []);
  if (isMulti(scoped)) return allAskedKnown(scoped, deriveState(scoped, history || []));
  return false;
}

function syncPartFromHistory(ex, progress, history) {
  if (!hasParts(ex)) return;
  var guard = 0;
  while (guard < ex.parts.length && partSatisfied(ex, progress, history)) {
    guard += 1;
    var index = partIndexOf(ex, progress);
    if (index >= ex.parts.length - 1) {
      progress.done = true;
      progress.step = "done";
      progress.part = index;
      return;
    }
    progress.part = index + 1;
    progress.step = "";
    progress.guide = 0;
    progress.done = false;
  }
}

function releasePart(ex, progress, history) {
  if (!progress.done || !hasParts(ex)) return;
  progress.done = false;
  syncPartFromHistory(ex, progress, history);
  if (partSatisfied(ex, progress, history) && partIndexOf(ex, progress) >= ex.parts.length - 1) {
    progress.done = true;
    progress.step = "done";
  }
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
  if (step !== "proportion" && step !== "isolate" && step !== "expr" && step !== "value" && step !== "subtract" && step !== "complement") step = "";
  var found = {};
  if (isMulti(ex) && raw.found) {
    groupList(ex).forEach(function (g) {
      if (raw.found[g.id]) found[g.id] = true;
    });
  }
  var guide = Number(raw.guide);
  if (!isFinite(guide) || guide < 0) guide = 0;
  return { step: step, done: false, found: found, guide: Math.floor(guide), part: partIndexOf(ex, raw) };
}

function viewOf(ex, progress, answers) {
  var scoped = scopePart(ex, progress);
  var view = {
    input: isMulti(scoped) || isRelated(scoped) || isShares(scoped) ? "fields" : "text",
    solved: !!(progress && progress.done),
  };
  if (hasParts(ex)) {
    var part = ex.parts[partIndexOf(ex, progress)];
    view.part = { label: (part && part.label) || "", text: (part && part.text) || "" };
  }
  if (!isMulti(scoped) && !isRelated(scoped) && !isShares(scoped)) return view;
  var fields = answerFields(scoped);
  var locks = {};
  if (!(progress && progress.done)) locks = judgeFields(scoped, answers).locks;
  view.fields = fields.map(function (field) {
    var shown = { id: field.id, label: field.label, locked: !!(progress && progress.done) || !!locks[field.id] };
    if (field.unit) shown.unit = field.unit;
    if (progress && progress.done) shown.value = formatValue(field.value);
    return shown;
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
    part: extra.part || "",
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
  var history = Array.isArray(body.history) ? body.history.map(function (line) { return String(line || ""); }) : [];
  syncPartFromHistory(ex, progress, history);
  var intent = String(body.intent || "check");
  if (intent === "hint") {
    return respond(ex, progress, { status: "hint", message: hintFor(scopePart(ex, progress), progress, history), answers: body.answers });
  }
  if (intent === "step") {
    var stepLabel = partLabelAt(ex, progress);
    var stepped = nextSiteLine(scopePart(ex, progress), progress, history);
    if (!stepped) return { ok: false, message: "אין צעד נוסף.", progress: progress, view: viewOf(ex, progress, body.answers) };
    advanceStep(progress, stepped);
    releasePart(ex, progress, history.concat([stepped.line]));
    return respond(ex, progress, {
      status: progress.done ? "solved" : "step",
      message: progress.done ? "אפשר להמשיך." : "הצעד נוסף.",
      shows: [stepped.line],
      joinPrev: stepped.joinPrev,
      part: stepLabel,
      answers: body.answers,
    });
  }
  if (intent === "solution") {
    var lines = [];
    var guard = 0;
    var solutionHistory = history.slice();
    syncPartFromHistory(ex, progress, solutionHistory);
    while (!progress.done && guard < 40) {
      guard += 1;
      var solutionLabel = partLabelAt(ex, progress);
      var solutionScope = scopePart(ex, progress);
      var solutionPast = history.length || isRelated(solutionScope) || hasParts(ex) || isExpress(solutionScope) || asksWhole(solutionScope) || asksPercent(solutionScope) || isShares(solutionScope) || solutionScope.compute ? solutionHistory : null;
      var line = nextSiteLine(solutionScope, progress, solutionPast);
      if (!line || !line.line) break;
      var repeated = solutionHistory.some(function (prev) {
        return normalize(String(prev).replace(/%/g, "")) === normalize(String(line.line).replace(/%/g, ""));
      });
      if (repeated) break;
      lines.push({ show: line.line, joinPrev: !!line.joinPrev, part: solutionLabel });
      solutionHistory.push(line.line);
      advanceStep(progress, line);
      if (line.done) {
        releasePart(ex, progress, solutionHistory);
        syncPartFromHistory(ex, progress, solutionHistory);
      }
    }
    if (!hasParts(ex) && isRelated(ex) && relatedDone(ex, solutionHistory)) {
      progress.done = true;
      progress.step = "done";
    } else if (!hasParts(ex) && isShares(ex) && sharePack(ex).every(function (share) { return shareSettled(share, solutionHistory); })) {
      progress.done = true;
      progress.step = "done";
    } else if (!hasParts(ex) && history.length && isMulti(ex) && allAskedKnown(ex, deriveState(ex, solutionHistory))) {
      progress.done = true;
      progress.step = "done";
    }
    if (progress.done && isMulti(ex)) groupList(ex).forEach(function (g) { progress.found[g.id] = true; });
    return respond(ex, progress, {
      status: progress.done ? "solved" : "step",
      message: "אפשר להמשיך.",
      lines: lines,
      shows: [],
      answers: body.answers,
    });
  }
  var scoped = scopePart(ex, progress);
  if (isMulti(scoped) || isRelated(scoped) || isShares(scoped)) {
    var typed = String(body.typed || "").trim();
    var judged = judgeFields(scoped, body.answers);
    var activeLabel = partLabelAt(ex, progress);
    function carried(shows) {
      var next = history.slice();
      if (typed) next.push(typed);
      return next.concat(shows || []);
    }
    if (typed) {
      var work = assessCurrent(scoped, typed, history);
      if (!work.ok) {
        return { ok: false, message: work.message, progress: progress, view: viewOf(ex, progress, body.answers) };
      }
      if (isMulti(scoped) && work.found && work.group) progress.found[work.group.id] = true;
      var workShows = (work.result && work.result.shows) || work.shows || [];
      if (judged.solved) {
        progress.done = true;
        progress.step = "done";
        if (isMulti(scoped)) answerFields(scoped).forEach(function (field) {
          if (field.kind === "amount" && field.group) progress.found[field.group] = true;
        });
        releasePart(ex, progress, carried(workShows));
      }
      return respond(ex, progress, {
        status: progress.done ? "solved" : "step",
        message: progress.done ? "" : "אפשר להמשיך.",
        shows: workShows,
        joinPrev: !!(work.result && work.result.joinPrev),
        part: activeLabel,
        answers: body.answers,
      });
    }
    if (!judged.solved) {
      return { ok: false, message: judged.message, progress: progress, view: viewOf(ex, progress, body.answers) };
    }
    var fieldShows = answerFields(scoped).map(function (field) {
      var raw = String((body.answers && body.answers[field.id]) || "").trim();
      return raw || (field.kind === "percent" ? formatValue(field.value) + "%" : formatValue(field.value));
    });
    progress.done = true;
    progress.step = "done";
    if (isMulti(scoped)) {
      answerFields(scoped).forEach(function (field) {
        if (field.kind === "amount" && field.group) progress.found[field.group] = true;
      });
    }
    releasePart(ex, progress, carried(fieldShows));
    return respond(ex, progress, {
      status: progress.done ? "solved" : "step",
      message: progress.done ? "" : "אפשר להמשיך.",
      shows: fieldShows,
      part: activeLabel,
      answers: body.answers,
    });
  }
  var result = assessCurrent(scoped, body.typed, history);
  if (!result.ok) {
    return { ok: false, message: result.message || "עוד לא.", progress: progress, view: viewOf(ex, progress) };
  }
  var singleLabel = partLabelAt(ex, progress);
  var joinPrev = !!result.joinPrev && (progress.step === "expr" || progress.step === "isolate");
  advanceStep(progress, result);
  releasePart(ex, progress, history.concat(result.shows || []));
  return respond(ex, progress, {
    status: progress.done ? "solved" : "step",
    message: progress.done ? "" : "אפשר להמשיך.",
    shows: result.shows || [],
    joinPrev: joinPrev,
    part: singleLabel,
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
