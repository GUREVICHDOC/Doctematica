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

function nextSiteLine(ex, progress, history) {
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
  return scoped;
}

function partLabelAt(ex, progress) {
  if (!hasParts(ex)) return "";
  var part = ex.parts[partIndexOf(ex, progress)];
  return (part && part.label) || "";
}

function partSatisfied(ex, progress, history) {
  var scoped = scopePart(ex, progress);
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
    input: isMulti(scoped) || isRelated(scoped) ? "fields" : "text",
    solved: !!(progress && progress.done),
  };
  if (hasParts(ex)) {
    var part = ex.parts[partIndexOf(ex, progress)];
    view.part = { label: (part && part.label) || "", text: (part && part.text) || "" };
  }
  if (!isMulti(scoped) && !isRelated(scoped)) return view;
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
      var solutionPast = history.length || isRelated(solutionScope) || hasParts(ex) ? solutionHistory : null;
      var line = nextSiteLine(solutionScope, progress, solutionPast);
      if (!line) break;
      var repeated = solutionHistory.some(function (prev) {
        return normalize(String(prev).replace(/%/g, "")) === normalize(String(line.line).replace(/%/g, ""));
      });
      if (repeated) break;
      lines.push({ show: line.line, joinPrev: !!line.joinPrev, part: solutionLabel });
      solutionHistory.push(line.line);
      advanceStep(progress, line);
      releasePart(ex, progress, solutionHistory);
      syncPartFromHistory(ex, progress, solutionHistory);
    }
    if (!hasParts(ex) && isRelated(ex) && relatedDone(ex, solutionHistory)) {
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
  if (isMulti(scoped) || isRelated(scoped)) {
    var typed = String(body.typed || "").trim();
    var judged = judgeFields(scoped, body.answers);
    var activeLabel = partLabelAt(ex, progress);
    function carried(shows) {
      var next = history.slice();
      if (typed) next.push(typed);
      return next.concat(shows || []);
    }
    if (typed) {
      var work = isRelated(scoped) ? assessRelated(scoped, typed) : assessGroups(scoped, typed);
      if (!work.ok) {
        return { ok: false, message: work.message, progress: progress, view: viewOf(ex, progress, body.answers) };
      }
      if (isMulti(scoped) && work.found && work.group) progress.found[work.group.id] = true;
      var workShows = (work.result && work.result.shows) || [];
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
