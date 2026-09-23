"use strict";

var Percent = require("./percent");

function same(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-6;
}

function format(n) {
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  return String(Math.round(n * 1000) / 1000);
}

function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    var t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

function compact(text) {
  return String(text || "")
    .replace(/[×·*]/g, "*")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
}

function shown(text) {
  return compact(text).replace(/\*/g, "·").replace(/=/g, " = ");
}

function emptySolve() {
  return {
    total: null,
    totalSymbol: "",
    totalExpr: "",
    missing: null,
    expressed: false,
    rational: false,
    equation: "",
    eqCurrent: "",
    eqAbout: "",
    phase: "",
  };
}

function clone(raw) {
  var base = emptySolve();
  raw = raw || {};
  base.total = raw.total == null ? null : raw.total;
  base.totalSymbol = /^[A-Za-z]$/.test(raw.totalSymbol) ? raw.totalSymbol : "";
  base.totalExpr = typeof raw.totalExpr === "string" ? raw.totalExpr.slice(0, 80) : "";
  base.missing = raw.missing == null ? null : raw.missing;
  base.expressed = !!raw.expressed;
  base.rational = !!raw.rational;
  base.equation = raw.equation || "";
  base.eqCurrent = raw.eqCurrent || "";
  base.eqAbout = raw.eqAbout === "total" ? "total" : "";
  base.phase = raw.phase || "";
  return base;
}

function symbolOf(expr) {
  var match = String(expr || "").match(/[A-Za-z]/);
  return match ? match[0] : "x";
}

function totalName(s) {
  return (s && s.totalSymbol) || "N";
}

function ownershipMessage(letter) {
  return "האות " + letter + " כבר משמשת לנעלם בטבלה. בחרו אות אחרת למספר התלמידים הכולל.";
}

function goalOf(task) {
  return task && task.goal === "missing" ? "missing" : "total";
}

function truth(compiled) {
  var spec = compiled && compiled.givenRelative;
  if (!spec) return null;
  var rows = compiled.rows || [];
  var anchor = null;
  var missingRow = null;
  var known = 0;
  var knownFreqs = [];
  var values = [];
  rows.forEach(function (row) {
    if (row.num != null) values.push(row.num);
    if (row.givenExpr) {
      missingRow = missingRow || row;
      return;
    }
    if (row.freq == null || !isFinite(Number(row.freq))) return;
    known += Number(row.freq);
    knownFreqs.push(Number(row.freq));
    if (String(row.value) === String(spec.value) || row.key === String(spec.value)) anchor = row;
  });
  if (!anchor || anchor.freq == null || !missingRow) return null;
  var f = Number(anchor.freq);
  var num;
  var den;
  var percent = null;
  var asPercent = spec.percent != null && spec.percent !== "";
  if (asPercent) {
    percent = Number(spec.percent);
    num = percent;
    den = 100;
  } else {
    num = Number(spec.num);
    den = Number(spec.den);
    percent = (num / den) * 100;
  }
  if (!den) return null;
  var total = Percent.targetOf({ part: f, percent: percent, unknown: "all" });
  if (!isFinite(total)) return null;
  return {
    f: f,
    value: anchor.num != null ? anchor.num : anchor.value,
    num: num,
    den: den,
    percent: percent,
    asPercent: asPercent,
    ratio: num / den,
    known: known,
    knownFreqs: knownFreqs,
    values: values,
    total: total,
    missing: total - known,
    missingRow: missingRow,
    missingSymbol: symbolOf(missingRow.givenExpr),
  };
}

function materialize(compiled) {
  var info = truth(compiled);
  if (!info) return null;
  (compiled.rows || []).forEach(function (row) {
    if (row.givenExpr) row.freq = info.missing;
  });
  return info;
}

function sanitize(compiled, raw) {
  var info = truth(compiled);
  var out = emptySolve();
  if (!info || !raw || typeof raw !== "object") return out;
  if (raw.total != null && same(raw.total, info.total)) out.total = info.total;
  if (raw.missing != null && same(raw.missing, info.missing)) out.missing = info.missing;
  if (/^[A-Za-z]$/.test(raw.totalSymbol) && raw.totalSymbol !== info.missingSymbol) out.totalSymbol = raw.totalSymbol;
  if (typeof raw.totalExpr === "string") out.totalExpr = raw.totalExpr.slice(0, 80);
  if (raw.eqAbout === "total") out.eqAbout = "total";
  if (raw.expressed) out.expressed = true;
  if (raw.rational && raw.missing == null) out.rational = true;
  if (typeof raw.equation === "string" && raw.missing == null) out.equation = raw.equation.slice(0, 200);
  if (typeof raw.eqCurrent === "string" && raw.missing == null) out.eqCurrent = raw.eqCurrent.slice(0, 200);
  var phase = raw.phase;
  if (phase === "proportion" || phase === "isolate" || phase === "expr" || phase === "total" || phase === "sum" || phase === "subtract" || phase === "plug") {
    out.phase = phase;
  }
  return out;
}

function pending(compiled, progress) {
  if (!compiled || !compiled.givenRelative) return false;
  if (!(compiled.rows || []).some(function (row) { return row.givenExpr; })) return false;
  var s = progress && progress.solve;
  if (s && s.equation && s.missing == null) return true;
  return !(s && s.missing != null);
}

function ratioText(info) {
  if (info.asPercent) return format(info.percent) + "/100";
  return format(info.num) + "/" + format(info.den);
}

function siteLines(info, symbol) {
  symbol = symbol || "N";
  if (info.asPercent) {
    var ex = { part: info.f, percent: info.percent, unknown: "all" };
    return {
      proportion: Percent.proportionLine(ex).replace(/\bx\b/g, symbol),
      isolate: Percent.isolateLine(ex).replace(/\bx\b/g, symbol),
      value: symbol + " = " + format(Percent.targetOf(ex)),
    };
  }
  return {
    proportion: format(info.f) + "/" + symbol + " = " + format(info.num) + "/" + format(info.den),
    isolate: symbol + " = (" + format(info.f) + "·" + format(info.den) + ")/" + format(info.num),
    value: symbol + " = " + format(info.total),
  };
}

function tableSumEquation(compiled, info) {
  var rows = (compiled.ordered || compiled.rows || []).slice().reverse();
  var parts = [];
  rows.forEach(function (row) {
    if (row.givenExpr) parts.push(info.missingSymbol);
    else if (row.freq != null && isFinite(Number(row.freq))) parts.push(format(Number(row.freq)));
  });
  return parts.join(" + ") + " = " + format(info.total);
}

function uniqueLetters(text) {
  var found = String(text || "").match(/[A-Za-z]/g) || [];
  var out = [];
  found.forEach(function (ch) {
    if (out.indexOf(ch) < 0) out.push(ch);
  });
  return out;
}

function unwrap(expr) {
  var t = String(expr || "");
  if (t.charAt(0) !== "(" || t.charAt(t.length - 1) !== ")") return t;
  var depth = 0;
  var i;
  for (i = 0; i < t.length; i++) {
    if (t.charAt(i) === "(") depth += 1;
    else if (t.charAt(i) === ")") depth -= 1;
    if (depth === 0 && i < t.length - 1) return t;
  }
  return t.slice(1, -1);
}

function mainSlash(side) {
  var depth = 0;
  var i;
  for (i = 0; i < side.length; i++) {
    var ch = side.charAt(i);
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "/" && depth === 0) return i;
  }
  return -1;
}

function parseLinearSum(expr, symbol) {
  var t = unwrap(expr);
  if (!t || /[()]/.test(t)) return null;
  var parts = t.split("+").filter(function (part) { return part !== ""; });
  if (!parts.length) return null;
  var a = 0;
  var b = 0;
  var i;
  for (i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (part === symbol) a += 1;
    else if (/^\d+(?:\.\d+)?$/.test(part)) b += Number(part);
    else if (new RegExp("^\\d+(?:\\.\\d+)?\\*" + symbol + "$").test(part)) a += Number(part.split("*")[0]);
    else if (new RegExp("^" + symbol + "\\*\\d+(?:\\.\\d+)?$").test(part)) a += Number(part.split("*")[1]);
    else return null;
  }
  return { a: a, b: b };
}

function fractionSide(side) {
  var slash = mainSlash(side);
  if (slash <= 0) return null;
  return { num: side.slice(0, slash), den: unwrap(side.slice(slash + 1)) };
}

function knownExpr(compiled) {
  var nums = [];
  (compiled.ordered || compiled.rows || []).forEach(function (row) {
    if (row.givenExpr) return;
    if (row.freq == null) return;
    nums.push(format(row.freq));
  });
  return nums.join(" + ");
}

function linearBridge(info) {
  return format(info.num) + "·(x+" + format(info.known) + ") = " + format(info.f) + "·" + format(info.den);
}

function allowedNumber(n, info) {
  if (!isFinite(n)) return false;
  var bag = [info.f, info.known, info.num, info.den, info.percent, 100, info.total, info.missing, info.ratio];
  info.knownFreqs.forEach(function (freq) { bag.push(freq); });
  bag.push(info.f * info.den);
  bag.push(info.num * info.known);
  bag.push(Math.abs(info.num * info.known - info.f * info.den));
  var g = gcd(info.num, info.den);
  bag.push(info.num / g);
  bag.push(info.den / g);
  bag.push((info.num / g) * info.known);
  bag.push(info.f * (info.den / g));
  bag.push(Math.abs((info.num / g) * info.known - info.f * (info.den / g)));
  var i;
  for (i = 0; i < bag.length; i++) {
    if (same(bag[i], n)) return true;
  }
  return false;
}

function numbersOf(text) {
  var found = String(text || "").match(/\d+(?:\.\d+)?/g) || [];
  return found.map(Number);
}

function multiset(list) {
  return list.slice().sort(function (a, b) { return a - b; }).join(",");
}

function addends(side) {
  if (!/^[0-9+x.]+$/.test(side)) return null;
  var parts = side.split("+").filter(function (part) { return part !== ""; });
  var nums = [];
  var xs = 0;
  var i;
  for (i = 0; i < parts.length; i++) {
    if (parts[i] === "x") xs += 1;
    else if (/^\d+(?:\.\d+)?$/.test(parts[i])) nums.push(Number(parts[i]));
    else return null;
  }
  return { xs: xs, nums: nums };
}

function sumNums(nums) {
  var total = 0;
  var i;
  for (i = 0; i < nums.length; i++) total += nums[i];
  return total;
}

function omittedKnown(nums, info) {
  if (!nums.length || nums.length >= info.knownFreqs.length) return false;
  var bag = info.knownFreqs.slice();
  var i;
  var j;
  for (i = 0; i < nums.length; i++) {
    var hit = -1;
    for (j = 0; j < bag.length; j++) {
      if (same(bag[j], nums[i])) {
        hit = j;
        break;
      }
    }
    if (hit < 0) return false;
    bag.splice(hit, 1);
  }
  return bag.length === 1;
}

function diagnose(text, info) {
  var t = compact(text);
  var f = format(info.f);
  var value = format(info.value);
  var sym = info.missingSymbol;
  if (value !== f && new RegExp("^" + value + "/(?:[A-Za-z]|\\(" + sym + ")").test(t)) {
    return "המונה צריך להיות השכיחות של הערך, לא הערך עצמו.";
  }
  if (new RegExp("^" + f + "/" + sym + "=").test(t) || new RegExp("=" + f + "/" + sym + "$").test(t)) {
    return ownershipMessage(sym);
  }
  if (new RegExp("^[A-Za-z]/" + f + "=").test(t)) {
    return "השכיחות היחסית היא השכיחות חלקי הסך הכול, לא להפך.";
  }
  if (info.asPercent && new RegExp("^" + f + "/[A-Za-z]=" + format(info.percent) + "$").test(t)) {
    return format(info.percent) + "% נכתבים כ־" + format(info.percent) + "/100 או כשבר עשרוני, לא כ־" + format(info.percent) + ".";
  }
  if (!same(info.num, info.den) && new RegExp("^" + f + "/[A-Za-z]=" + format(info.den) + "/" + format(info.num) + "$").test(t)) {
    return "השבר הנתון הפוך. השכיחות היחסית היא " + format(info.num) + "/" + format(info.den) + ".";
  }
  var sides = t.split("=");
  if (sides.length === 2 && t.indexOf("x") < 0 && t.indexOf("N") < 0) {
    var left = addends(sides[0]);
    var right = addends(sides[1]);
    var nums = left && !left.xs ? left.nums : null;
    var other = right && right.nums.length === 1 && !right.xs ? right.nums[0] : null;
    if (!nums && right && !right.xs) {
      nums = right.nums;
      other = left && left.nums.length === 1 && !left.xs ? left.nums[0] : null;
    }
    if (nums && multiset(nums) === multiset(info.values)) return "חיברתם את ערכי המשתנה. צריך לחבר את השכיחויות.";
    if (nums && multiset(nums) === multiset(info.knownFreqs) && other != null && same(other, info.total)) {
      return "הסכום כולל גם את התא x.";
    }
    if (nums && other != null && same(other, info.total) && omittedKnown(nums, info)) return "חסרה שכיחות אחת בסכום.";
  }
  if (t.indexOf("=") < 0) {
    var only = addends(t);
    if (only && !only.xs && multiset(only.nums) === multiset(info.values)) return "חיברתם את ערכי המשתנה. צריך לחבר את השכיחויות.";
  }
  var omitted = t.match(/^x=(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (omitted && same(Number(omitted[1]), info.total) && omittedKnown([Number(omitted[2])], { knownFreqs: [info.known] })) {
    return "חסרה שכיחות אחת בסכום.";
  }
  if (omitted && same(Number(omitted[1]), info.total)) {
    var dropped = info.known - Number(omitted[2]);
    if (info.knownFreqs.some(function (freq) { return same(freq, dropped); }) && !same(Number(omitted[2]), info.known)) {
      return "חסרה שכיחות אחת בסכום.";
    }
  }
  return "";
}

function expressedSum(text, info) {
  var t = compact(text);
  var sides = t.split("=");
  if (sides.length !== 2) return null;
  var letter = "";
  var expr = "";
  if (/^[A-Za-z]$/.test(sides[0])) {
    letter = sides[0];
    expr = sides[1];
  } else if (/^[A-Za-z]$/.test(sides[1])) {
    letter = sides[1];
    expr = sides[0];
  } else return null;
  if (letter === info.missingSymbol) {
    var asTotal = parseLinearSum(expr, info.missingSymbol);
    if (asTotal && same(asTotal.a, 0) && same(asTotal.b, info.total)) return { owned: true, letter: letter };
    return null;
  }
  var parsed = parseLinearSum(expr, info.missingSymbol);
  if (!parsed || !same(parsed.a, 1) || !same(parsed.b, info.known)) return null;
  return { letter: letter, expr: expr };
}

function readProportion(text, info) {
  var sides = compact(text).split("=");
  if (sides.length !== 2) return null;
  var left = fractionSide(sides[0]);
  var right = fractionSide(sides[1]);
  var freqSide = null;
  if (left && same(Number(left.num), info.f) && ratioMatches(sides[1], info)) freqSide = left;
  else if (right && same(Number(right.num), info.f) && ratioMatches(sides[0], info)) freqSide = right;
  if (!freqSide) return null;
  var den = freqSide.den;
  if (/^[A-Za-z]$/.test(den)) {
    if (den === info.missingSymbol) return { kind: "owned", letter: den };
    return { kind: "letter", letter: den };
  }
  var sum = parseLinearSum(den, info.missingSymbol);
  if (sum && same(sum.a, 1) && same(sum.b, info.known)) return { kind: "expr", den: den };
  return null;
}

function ownedTotalEquation(engine, text, info) {
  var Algebra = engine && engine.DoctematicaAlgebra;
  if (!Algebra || typeof Algebra.parseEquation !== "function") return "";
  var letters = uniqueLetters(text);
  if (letters.length !== 1 || letters[0] !== info.missingSymbol) return "";
  var parsed;
  try { parsed = Algebra.parseEquation(text); } catch (err) { return ""; }
  var sol = Algebra.solutionOf(parsed);
  if (sol == null || same(sol, info.missing) || !same(sol, info.total)) return "";
  return ownershipMessage(info.missingSymbol);
}

function symbolClash(s, letter) {
  if (!s.totalSymbol || s.totalSymbol === letter) return "";
  return "האות " + s.totalSymbol + " כבר מסמנת את מספר התצפיות הכולל.";
}

function toEngine(s, text) {
  if (s.eqAbout === "total" && s.totalSymbol && s.totalSymbol !== "x") {
    return String(text).replace(new RegExp(s.totalSymbol, "g"), "x");
  }
  return String(text);
}

function fromEngine(s, text) {
  if (s.eqAbout === "total" && s.totalSymbol && s.totalSymbol !== "x") {
    return String(text).replace(/\bx\b/g, s.totalSymbol);
  }
  return String(text);
}

function ratioMatches(piece, info) {
  var text = String(piece || "");
  if (/%$/.test(text)) return same(Number(text.slice(0, -1)) / 100, info.ratio);
  if (text.indexOf("/") >= 0) {
    var bits = text.split("/");
    if (bits.length !== 2 || !Number(bits[1])) return false;
    return same(Number(bits[0]) / Number(bits[1]), info.ratio);
  }
  if (/^\d+(?:\.\d+)?$/.test(text)) return same(Number(text), info.ratio);
  return false;
}

function decimalProportion(text, info) {
  var t = compact(text);
  var match = t.match(/^(\d+(?:\.\d+)?)\/([A-Za-z])=(\d+(?:\.\d+)?)$/);
  if (match && match[2] !== info.missingSymbol && same(Number(match[1]), info.f) && same(Number(match[3]), info.ratio)) {
    return match[2];
  }
  var flipped = t.match(/^(\d+(?:\.\d+)?)=(\d+(?:\.\d+)?)\/([A-Za-z])$/);
  if (flipped && flipped[3] !== info.missingSymbol && same(Number(flipped[2]), info.f) && same(Number(flipped[1]), info.ratio)) {
    return flipped[3];
  }
  return "";
}

function finishFound(s, task, info, which) {
  var goal = goalOf(task);
  if (which === "missing") {
    s.missing = info.missing;
    s.equation = "";
    s.eqCurrent = "";
    s.rational = false;
    if (goal === "missing") s.total = s.total == null ? info.total : s.total;
    return {
      ok: true,
      done: goal === "missing",
      solve: s,
      shows: [info.missingSymbol + " = " + format(info.missing)],
      message: goal === "missing" ? "" : "אפשר להמשיך.",
    };
  }
  s.total = info.total;
  if (s.phase !== "sum" && s.phase !== "subtract") s.phase = "total";
  return {
    ok: true,
    done: goal === "total",
    solve: s,
    shows: [totalName(s) + " = " + format(info.total)],
    message: goal === "total" ? "" : "זה מספר התצפיות הכולל. סכום כל השכיחויות בטבלה שווה לו.",
  };
}

function acceptFirst(engine, text, info) {
  var Algebra = engine && engine.DoctematicaAlgebra;
  if (!Algebra || typeof Algebra.parseEquation !== "function") return null;
  var parsed;
  try { parsed = Algebra.parseEquation(text); } catch (err) { return null; }
  var sol = Algebra.solutionOf(parsed);
  if (!same(sol, info.missing)) return null;
  var solved = Algebra.isSolvedText(parsed.source || text);
  if (!solved) {
    var nums = numbersOf(text);
    var i;
    for (i = 0; i < nums.length; i++) {
      if (!allowedNumber(nums[i], info)) return null;
    }
  }
  return { source: parsed.source || text, solved: solved };
}

function check(engine, compiled, task, typed, progress) {
  var info = truth(compiled);
  if (!info) return { ok: false, message: "עוד לא." };
  var s = clone(progress && progress.solve);
  var text = String(typed || "").trim();
  var t = compact(text);
  if (!t) return { ok: false, message: "אפשר למצוא את מספר התצפיות הכולל, או את התא החסר." };
  var problem = diagnose(text, info);
  if (problem) return { ok: false, message: problem, confident: true };
  var owned = ownedTotalEquation(engine, text, info);
  if (owned) return { ok: false, message: owned, confident: true };
  var expressed = expressedSum(text, info);
  if (expressed) {
    if (expressed.owned) return { ok: false, message: ownershipMessage(expressed.letter), confident: true };
    var clash = symbolClash(s, expressed.letter);
    if (clash) return { ok: false, message: clash, confident: true };
    s.expressed = true;
    s.totalSymbol = expressed.letter;
    s.totalExpr = expressed.expr;
    return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
  }
  var proportion = readProportion(text, info);
  if (proportion) {
    if (proportion.kind === "owned") return { ok: false, message: ownershipMessage(proportion.letter), confident: true };
    if (proportion.kind === "letter") {
      var letterClash = symbolClash(s, proportion.letter);
      if (letterClash) return { ok: false, message: letterClash, confident: true };
      s.totalSymbol = proportion.letter;
      var viaLetter = percentPath(text, info, s, task, proportion.letter);
      if (viaLetter) return viaLetter;
      var decimalLetter = decimalProportion(text, info);
      if (decimalLetter) {
        s.phase = "proportion";
        return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
      }
      s.phase = "proportion";
      return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
    }
    s.expressed = true;
    s.rational = true;
    s.equation = shown(text);
    s.eqCurrent = s.equation;
    s.eqAbout = "";
    return { ok: true, done: false, solve: s, shows: [s.equation], message: "אפשר להמשיך." };
  }
  if (s.equation && s.missing == null && t.indexOf("=") >= 0) {
    var continued = continueEquation(engine, s, text, info, task);
    if (continued && continued.ok) return continued;
    if (s.eqAbout !== "total") {
      var skipped = storeFirstEquation(s, acceptFirst(engine, text, info), text, info, task);
      if (skipped) return skipped;
    }
    return continued;
  }
  if (t.indexOf(info.missingSymbol) >= 0 && t.indexOf("=") >= 0) {
    var opened = storeFirstEquation(s, acceptFirst(engine, text, info), text, info, task);
    if (opened) return opened;
  }
  var letters = uniqueLetters(t);
  if (letters.length === 1 && letters[0] !== info.missingSymbol) {
    var reused = symbolClash(s, letters[0]);
    if (reused) return { ok: false, message: reused, confident: true };
    var viaNamed = percentPath(text, info, s, task, letters[0]);
    if (viaNamed) return viaNamed;
  }
  if (t.indexOf("/") >= 0 || t.indexOf("%") >= 0) {
    var decimalNamed = decimalProportion(text, info);
    if (decimalNamed) {
      var decimalClash = symbolClash(s, decimalNamed);
      if (decimalClash) return { ok: false, message: decimalClash, confident: true };
      s.totalSymbol = decimalNamed;
      s.phase = "proportion";
      return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
    }
  }
  if (/^\d+(?:\.\d+)?$/.test(t)) {
    var n = Number(t);
    if (same(n, info.total)) return finishFound(s, task, info, "total");
    if (same(n, info.missing)) return finishFound(s, task, info, "missing");
  }
  var knownStep = knownSumStep(t, info, compiled);
  if (knownStep) {
    if (knownStep === "missing") {
      if (s.total == null) s.total = info.total;
      return finishFound(s, task, info, "missing");
    }
    s.phase = knownStep === "subtract" ? "subtract" : "sum";
    if ((knownStep === "subtract" || knownStep === "sum") && s.total == null && t.indexOf(format(info.total)) >= 0) s.total = info.total;
    return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
  }
  return { ok: false, message: "עוד לא. השכיחות היחסית היא השכיחות חלקי מספר התצפיות הכולל." };
}

function storeFirstEquation(s, first, text, info, task) {
  if (!first) return null;
  s.equation = first.source;
  s.eqCurrent = first.source;
  s.rational = false;
  s.eqAbout = "";
  if (first.solved) return finishFound(s, task, info, "missing");
  return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
}

function percentPath(text, info, s, task, letter) {
  var engineText = String(text);
  if (letter && letter !== "x") engineText = engineText.replace(new RegExp(letter, "g"), "x");
  else engineText = engineText.replace(/N/g, "x");
  if (engineText.indexOf("x") < 0) return null;
  if (letter) s.totalSymbol = letter;
  var ex = { part: info.f, percent: info.percent, unknown: "all" };
  var assessed = Percent.assessTyped(ex, engineText);
  if (!assessed || !assessed.ok) return null;
  if (assessed.done || assessed.step === "done") return finishFound(s, task, info, "total");
  s.phase = assessed.step === "expr" ? "expr" : (assessed.step === "isolate" ? "isolate" : "proportion");
  return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
}

function knownSumStep(t, info, compiled) {
  var sym = info.missingSymbol;
  if (t.indexOf(sym) < 0 && t.indexOf("=") < 0) {
    var parsed = addends(t);
    if (parsed && !parsed.xs && multiset(parsed.nums) === multiset(info.knownFreqs)) return "sum";
  }
  var summed = t.match(/^([0-9.+]+)=(\d+(?:\.\d+)?)$/);
  if (summed && t.indexOf(sym) < 0) {
    var parts = addends(summed[1]);
    if (parts && !parts.xs && multiset(parts.nums) === multiset(info.knownFreqs) && same(Number(summed[2]), info.known)) return "sum";
  }
  var sub = t.match(new RegExp("^" + sym + "=(\\d+(?:\\.\\d+)?)-(\\d+(?:\\.\\d+)?)$"));
  if (sub && same(Number(sub[1]), info.total) && same(Number(sub[2]), info.known)) return "subtract";
  var deferred = t.match(new RegExp("^" + sym + "=([A-Za-z])-(\\d+(?:\\.\\d+)?)$"));
  if (deferred && deferred[1] !== sym && same(Number(deferred[2]), info.known)) return "subtract";
  var bare = t.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)(?:=(\d+(?:\.\d+)?))?$/);
  if (bare && same(Number(bare[1]), info.total) && same(Number(bare[2]), info.known)) {
    if (bare[3]) return same(Number(bare[3]), info.missing) ? "missing" : "";
    return "subtract";
  }
  if (t === knownExpr(compiled).replace(/\s+/g, "").replace(/·/g, "*")) return "sum";
  return "";
}

function solvedValue(Algebra, text) {
  if (!Algebra || typeof Algebra.parseEquation !== "function" || typeof Algebra.isSolvedText !== "function") return null;
  if (!Algebra.isSolvedText(text)) return null;
  try { return Algebra.solutionOf(Algebra.parseEquation(text)); } catch (err) { return null; }
}

function finishSolved(s, task, info, value) {
  if (s.eqAbout === "total") {
    if (!same(value, info.total)) return { ok: false, message: "התוצאה לא מתאימה למספר התצפיות הכולל." };
    return finishFound(s, task, info, "total");
  }
  if (!same(value, info.missing)) return { ok: false, message: "התוצאה לא מתאימה לנעלם שבטבלה." };
  return finishFound(s, task, info, "missing");
}

function continueEquation(engine, s, text, info, task) {
  var Algebra = engine && engine.DoctematicaAlgebra;
  var previous = toEngine(s, s.eqCurrent || s.equation);
  var engineText = toEngine(s, text);
  var jumped = solvedValue(Algebra, engineText);
  if (jumped != null) return finishSolved(s, task, info, jumped);
  if (!Algebra || typeof Algebra.checkStep !== "function") return { ok: false, message: "המשיכו לפתור את המשוואה." };
  var checked;
  var fail = "הצעד לא מתאים למשוואה.";
  try { checked = Algebra.checkStep(previous, engineText); } catch (err) {
    checked = null;
    fail = err.message || fail;
  }
  if (checked && checked.ok) {
    s.rational = false;
    s.eqCurrent = fromEngine(s, checked.equation || engineText);
    if (checked.solved) {
      var sol = solvedValue(Algebra, toEngine(s, s.eqCurrent));
      if (sol == null) {
        try { sol = Algebra.solutionOf(Algebra.parseEquation(toEngine(s, s.eqCurrent))); } catch (err2) { sol = null; }
      }
      return finishSolved(s, task, info, sol);
    }
    return { ok: true, done: false, solve: s, shows: [shown(s.eqCurrent)], message: checked.message || "אפשר להמשיך." };
  }
  if (s.rational && s.eqAbout !== "total") {
    return { ok: false, message: "כפלו בהצלבה כדי להגיע למשוואה בלי שבר.", confident: true };
  }
  return { ok: false, message: (checked && checked.message) || fail };
}

function hint(engine, compiled, task, progress) {
  var info = truth(compiled);
  if (!info) return "הסתכלו בטבלה ובנתון של השכיחות היחסית.";
  var s = clone(progress && progress.solve);
  if (s.missing != null && goalOf(task) === "missing") return "רשמו את הערך של x.";
  if (s.missing != null && s.total != null) return "המשיכו לשאלה של הסעיף.";
  if (s.equation && s.missing == null) {
    var Teach = engine && engine.DoctematicaTeach;
    if (Teach && typeof Teach.nextAction === "function") {
      var act = Teach.nextAction(toEngine(s, s.eqCurrent || s.equation));
      if (act && act.hint) return fromEngine(s, String(act.hint));
    }
    if (s.rational) return "כפלו בהצלבה כדי להגיע למשוואה בלי שבר.";
    return "המשיכו לפתור את המשוואה שכתבתם.";
  }
  if (s.expressed && !s.equation && s.total == null) {
    return "הציבו את הביטוי של " + totalName(s) + " בקשר: שכיחות חלקי הסך הכול שווה לשכיחות היחסית.";
  }
  if (s.total == null) {
    if (s.phase === "proportion" || s.phase === "isolate" || s.phase === "expr") return "שכיחות חלקי סך הכול שווה לשכיחות היחסית.";
    var label = compiled.variableLabel || "הערך";
    return "השתמשו בשכיחות של " + label + " " + format(info.value) + " ובשכיחות היחסית הנתונה.";
  }
  if (s.missing == null) {
    if (s.phase === "sum" || s.phase === "subtract") return "חסרו את סכום השכיחויות הידועות ממספר התצפיות הכולל.";
    var freqLabel = compiled.frequencyLabel || "";
    var totalWords = freqLabel.indexOf("תלמיד") >= 0 ? "למספר התלמידים בכיתה" : ("ל" + (freqLabel || "מספר התצפיות הכולל"));
    return "סכום כל השכיחויות בטבלה שווה " + totalWords + ".";
  }
  return "המשיכו לשאלה של הסעיף.";
}

function step(engine, compiled, task, progress) {
  var info = truth(compiled);
  if (!info) return null;
  var s = clone(progress && progress.solve);
  var Algebra = engine && engine.DoctematicaAlgebra;
  var Teach = engine && engine.DoctematicaTeach;
  if (s.equation && s.missing == null) {
    var current = toEngine(s, s.eqCurrent || s.equation);
    var already = solvedValue(Algebra, current);
    if (already != null) {
      var early = finishSolved(s, task, info, already);
      return { done: !!early.done, solve: early.solve || s, shows: early.shows || [], message: early.message || "" };
    }
    if (Teach && typeof Teach.nextAction === "function") {
      var act = Teach.nextAction(current);
      if (act && act.eq && !act.done) {
        s.rational = false;
        s.eqCurrent = fromEngine(s, String(act.eq));
        var taught = solvedValue(Algebra, toEngine(s, s.eqCurrent));
        if (taught != null) {
          var finished = finishSolved(s, task, info, taught);
          return { done: !!finished.done, solve: finished.solve || s, shows: finished.shows || [s.eqCurrent], message: finished.message || "" };
        }
        return { done: false, solve: s, shows: [s.eqCurrent], message: "" };
      }
    }
    if (s.rational && s.eqAbout !== "total") {
      var bridge = linearBridge(info);
      s.rational = false;
      s.equation = bridge;
      s.eqCurrent = bridge;
      return { done: false, solve: s, shows: [bridge], message: "" };
    }
    return null;
  }
  if (s.expressed && !s.equation && s.total == null && s.missing == null) {
    var expr = s.totalExpr || (info.missingSymbol + "+" + format(info.known));
    var prop = format(info.f) + "/(" + expr + ") = " + ratioText(info);
    s.equation = prop;
    s.eqCurrent = prop;
    s.rational = true;
    return { done: false, solve: s, shows: [prop], message: "" };
  }
  if (s.missing != null && s.total == null && goalOf(task) !== "missing") {
    var name = totalName(s);
    if (s.phase !== "plug") {
      s.phase = "plug";
      return { done: false, solve: s, shows: [name + " = " + format(info.known) + " + " + info.missingSymbol], message: "" };
    }
    s.total = info.total;
    s.phase = "total";
    return { done: goalOf(task) === "total", solve: s, shows: [name + " = " + format(info.total)], message: "" };
  }
  if (s.total == null && s.missing == null) {
    var lines = siteLines(info, totalName(s));
    if (s.phase !== "proportion" && s.phase !== "isolate" && s.phase !== "expr") {
      s.phase = "proportion";
      return { done: false, solve: s, shows: [lines.proportion], message: "" };
    }
    if (s.phase === "proportion") {
      s.phase = "isolate";
      return { done: false, solve: s, shows: [lines.isolate], message: "" };
    }
    s.total = info.total;
    s.phase = "total";
    return { done: goalOf(task) === "total", solve: s, shows: [lines.value], message: "" };
  }
  if (s.missing == null) {
    if (s.phase === "sum") {
      s.phase = "subtract";
      return { done: false, solve: s, shows: [info.missingSymbol + " = " + format(s.total) + " - " + format(info.known)], message: "" };
    }
    if (s.phase === "subtract") return finishFound(s, task, info, "missing");
    if (!s.equation) {
      var sumEq = tableSumEquation(compiled, info);
      s.equation = sumEq;
      s.eqCurrent = sumEq;
      s.rational = false;
      s.eqAbout = "";
      return { done: false, solve: s, shows: [sumEq], message: "" };
    }
  }
  if (goalOf(task) === "missing") return finishFound(s, task, info, "missing");
  if (s.total == null) s.total = info.total;
  return finishFound(s, task, info, "total");
}

module.exports = {
  truth: truth,
  materialize: materialize,
  sanitize: sanitize,
  pending: pending,
  check: check,
  hint: hint,
  step: step,
  emptySolve: emptySolve,
};
