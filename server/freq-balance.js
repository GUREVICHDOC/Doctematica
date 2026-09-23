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
  return { total: null, missing: null, expressed: false, rational: false, equation: "", eqCurrent: "", phase: "" };
}

function clone(raw) {
  var base = emptySolve();
  raw = raw || {};
  base.total = raw.total == null ? null : raw.total;
  base.missing = raw.missing == null ? null : raw.missing;
  base.expressed = !!raw.expressed;
  base.rational = !!raw.rational;
  base.equation = raw.equation || "";
  base.eqCurrent = raw.eqCurrent || "";
  base.phase = raw.phase || "";
  return base;
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

function siteLines(info) {
  if (info.asPercent) {
    var ex = { part: info.f, percent: info.percent, unknown: "all" };
    return {
      proportion: Percent.proportionLine(ex).replace(/\bx\b/g, "N"),
      isolate: Percent.isolateLine(ex).replace(/\bx\b/g, "N"),
      value: "N = " + format(Percent.targetOf(ex)),
    };
  }
  return {
    proportion: format(info.f) + "/N = " + format(info.num) + "/" + format(info.den),
    isolate: "N = (" + format(info.f) + "·" + format(info.den) + ")/" + format(info.num),
    value: "N = " + format(info.total),
  };
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
  if (value !== f && (new RegExp("^" + value + "/N=").test(t) || new RegExp("^" + value + "/\\(x").test(t))) {
    return "המונה צריך להיות השכיחות של הערך, לא הערך עצמו.";
  }
  if (new RegExp("^" + f + "/x=").test(t)) return "x הוא תא בטבלה. המכנה הוא מספר התצפיות הכולל.";
  if (new RegExp("^N/" + f + "=").test(t)) return "השכיחות היחסית היא השכיחות חלקי הסך הכול, לא להפך.";
  if (info.asPercent && new RegExp("^" + f + "/N=" + format(info.percent) + "$").test(t)) {
    return format(info.percent) + "% נכתבים כ־" + format(info.percent) + "/100 או כשבר עשרוני, לא כ־" + format(info.percent) + ".";
  }
  if (!same(info.num, info.den) && new RegExp("^" + f + "/N=" + format(info.den) + "/" + format(info.num) + "$").test(t)) {
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
  if (sides.length !== 2) return false;
  var left = sides[0];
  var right = sides[1];
  var expr = null;
  if (left === "N") expr = right;
  else if (right === "N") expr = left;
  else return false;
  var parsed = addends(expr);
  if (!parsed || parsed.xs !== 1) return false;
  return same(sumNums(parsed.nums), info.known);
}

function rationalOf(text, info) {
  var t = compact(text);
  var match = t.match(/^(\d+(?:\.\d+)?)\/\((?:x\+(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\+x)\)=(.+)$/);
  var flipped = false;
  if (!match) {
    match = t.match(/^(.+)=(\d+(?:\.\d+)?)\/\((?:x\+(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\+x)\)$/);
    flipped = !!match;
  }
  if (!match) return false;
  var freq = flipped ? match[2] : match[1];
  var known = flipped ? (match[4] || match[3]) : (match[2] || match[3]);
  var ratio = flipped ? match[1] : match[4];
  if (!same(Number(freq), info.f) || !same(Number(known), info.known)) return false;
  return ratioMatches(ratio, info);
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
  var match = t.match(/^(\d+(?:\.\d+)?)\/N=(\d+(?:\.\d+)?)$/) || t.match(/^(\d+(?:\.\d+)?)=(\d+(?:\.\d+)?)\/N$/);
  if (!match) return false;
  var freq = match[2] && t.indexOf("/N") > 0 && t.indexOf("=") < t.indexOf("/N") ? match[2] : match[1];
  var dec = freq === match[1] ? match[2] : match[1];
  if (t.indexOf("/N") < t.indexOf("=")) {
    freq = match[1];
    dec = match[2];
  } else {
    dec = match[1];
    freq = match[2];
  }
  return same(Number(freq), info.f) && same(Number(dec), info.ratio);
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
      shows: ["x = " + format(info.missing)],
      message: goal === "missing" ? "" : "אפשר להמשיך.",
    };
  }
  s.total = info.total;
  s.phase = "total";
  return {
    ok: true,
    done: goal === "total",
    solve: s,
    shows: ["N = " + format(info.total)],
    message: goal === "total" ? "" : "זה מספר התצפיות הכולל. חסרו ממנו את סכום השכיחויות הידועות.",
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
  if (expressedSum(text, info)) {
    s.expressed = true;
    return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
  }
  if (rationalOf(text, info)) {
    s.expressed = true;
    s.rational = true;
    s.equation = shown(text);
    s.eqCurrent = s.equation;
    return { ok: true, done: false, solve: s, shows: [s.equation], message: "אפשר להמשיך." };
  }
  if (s.equation && s.missing == null && t.indexOf("=") >= 0 && t.indexOf("x") >= 0) {
    return continueEquation(engine, s, text, info, task);
  }
  if (t.indexOf("x") >= 0 && t.indexOf("=") >= 0 && t.indexOf("N") < 0) {
    var first = acceptFirst(engine, text, info);
    if (first) {
      s.equation = first.source;
      s.eqCurrent = first.source;
      s.rational = false;
      if (first.solved) return finishFound(s, task, info, "missing");
      return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
    }
    return { ok: false, message: "המשוואה לא מתאימה לקשר בין השכיחות לשכיחות היחסית.", confident: true };
  }
  if (t.indexOf("N") >= 0 || t.indexOf("/") >= 0 || t.indexOf("%") >= 0) {
    var viaPercent = percentPath(text, info, s, task);
    if (viaPercent) return viaPercent;
    if (decimalProportion(text, info)) {
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
    s.phase = knownStep;
    if (knownStep === "subtract" && s.total == null) s.total = info.total;
    return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
  }
  return { ok: false, message: "עוד לא. השכיחות היחסית היא השכיחות חלקי מספר התצפיות הכולל." };
}

function percentPath(text, info, s, task) {
  var engineText = String(text).replace(/N/g, "x");
  if (engineText.indexOf("x") < 0) return null;
  var ex = { part: info.f, percent: info.percent, unknown: "all" };
  var assessed = Percent.assessTyped(ex, engineText);
  if (!assessed || !assessed.ok) return null;
  if (assessed.done || assessed.step === "done") return finishFound(s, task, info, "total");
  s.phase = assessed.step === "expr" ? "expr" : (assessed.step === "isolate" ? "isolate" : "proportion");
  return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
}

function knownSumStep(t, info, compiled) {
  if (t.indexOf("x") < 0 && t.indexOf("=") < 0) {
    var parsed = addends(t);
    if (parsed && !parsed.xs && multiset(parsed.nums) === multiset(info.knownFreqs)) return "sum";
  }
  var sub = t.match(/^x=(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (sub && same(Number(sub[1]), info.total) && same(Number(sub[2]), info.known)) return "subtract";
  var deferred = t.match(/^x=N-(\d+(?:\.\d+)?)$/);
  if (deferred && same(Number(deferred[1]), info.known)) return "subtract";
  if (t === knownExpr(compiled).replace(/\s+/g, "").replace(/·/g, "*")) return "sum";
  return "";
}

function continueEquation(engine, s, text, info, task) {
  var Algebra = engine && engine.DoctematicaAlgebra;
  if (s.rational) {
    var bridged = acceptFirst(engine, text, info);
    if (!bridged) return { ok: false, message: "כפלו בהצלבה כדי להגיע למשוואה בלי שבר.", confident: true };
    s.rational = false;
    s.equation = bridged.source;
    s.eqCurrent = bridged.source;
    if (bridged.solved) return finishFound(s, task, info, "missing");
    return { ok: true, done: false, solve: s, shows: [shown(text)], message: "אפשר להמשיך." };
  }
  if (Algebra && typeof Algebra.isSolvedText === "function" && Algebra.isSolvedText(text)) {
    var jumped = null;
    try { jumped = Algebra.solutionOf(Algebra.parseEquation(text)); } catch (errJump) { jumped = null; }
    if (same(jumped, info.missing)) return finishFound(s, task, info, "missing");
  }
  if (!Algebra || typeof Algebra.checkStep !== "function") return { ok: false, message: "המשיכו לפתור את המשוואה." };
  var checked;
  try { checked = Algebra.checkStep(s.eqCurrent || s.equation, text); } catch (err) {
    return { ok: false, message: err.message || "הצעד לא מתאים למשוואה." };
  }
  if (!checked || !checked.ok) return { ok: false, message: (checked && checked.message) || "הצעד לא מתאים למשוואה." };
  s.eqCurrent = checked.equation || shown(text);
  if (checked.solved) {
    var sol = null;
    try { sol = Algebra.solutionOf(Algebra.parseEquation(s.eqCurrent)); } catch (err2) { sol = null; }
    if (!same(sol, info.missing)) return { ok: false, message: "התוצאה לא מתאימה לנעלם שבטבלה." };
    return finishFound(s, task, info, "missing");
  }
  return { ok: true, done: false, solve: s, shows: [shown(s.eqCurrent)], message: checked.message || "אפשר להמשיך." };
}

function hint(engine, compiled, task, progress) {
  var info = truth(compiled);
  if (!info) return "הסתכלו בטבלה ובנתון של השכיחות היחסית.";
  var s = clone(progress && progress.solve);
  if (s.missing != null && goalOf(task) === "missing") return "רשמו את הערך של x.";
  if (s.missing != null && s.total != null) return "המשיכו לשאלה של הסעיף.";
  if (s.equation && s.missing == null) {
    if (s.rational) return "כפלו בהצלבה כדי להגיע למשוואה בלי שבר.";
    var Teach = engine && engine.DoctematicaTeach;
    if (Teach && typeof Teach.nextAction === "function") {
      var act = Teach.nextAction(s.eqCurrent || s.equation);
      if (act && act.hint) return String(act.hint);
    }
    return "המשיכו לפתור את המשוואה שכתבתם.";
  }
  if (s.expressed && !s.equation && s.total == null) return "הציבו את הביטוי של N בקשר: שכיחות חלקי הסך הכול שווה לשכיחות היחסית.";
  if (s.total == null) {
    if (s.phase === "proportion" || s.phase === "isolate" || s.phase === "expr") return "שכיחות חלקי סך הכול שווה לשכיחות היחסית.";
    return "השתמשו בשכיחות של הערך הנתון ובשכיחות היחסית שלו כדי למצוא את מספר התצפיות הכולל.";
  }
  if (s.missing == null) return "סכום כל השכיחויות בטבלה צריך להיות שווה למספר התצפיות הכולל.";
  return "המשיכו לשאלה של הסעיף.";
}

function step(engine, compiled, task, progress) {
  var info = truth(compiled);
  if (!info) return null;
  var s = clone(progress && progress.solve);
  var Algebra = engine && engine.DoctematicaAlgebra;
  var Teach = engine && engine.DoctematicaTeach;
  if (s.equation && s.missing == null) {
    if (s.rational) {
      var bridge = linearBridge(info);
      s.rational = false;
      s.equation = bridge;
      s.eqCurrent = bridge;
      return { done: false, solve: s, shows: [bridge], message: "" };
    }
    var current = s.eqCurrent || s.equation;
    if (Algebra && Algebra.isSolvedText(current)) return finishFound(s, task, info, "missing");
    if (Teach && typeof Teach.nextAction === "function") {
      var act = Teach.nextAction(current);
      if (!act || act.done || !act.eq) return null;
      s.eqCurrent = String(act.eq);
      if (Algebra && Algebra.isSolvedText(s.eqCurrent)) return finishFound(s, task, info, "missing");
      return { done: false, solve: s, shows: [s.eqCurrent], message: "" };
    }
    return null;
  }
  if (s.expressed && !s.equation && s.total == null && s.missing == null) {
    var prop = format(info.f) + "/(x+" + format(info.known) + ") = " + ratioText(info);
    s.equation = prop;
    s.eqCurrent = prop;
    s.rational = true;
    return { done: false, solve: s, shows: [prop], message: "" };
  }
  if (s.missing != null && s.total == null && goalOf(task) !== "missing") {
    if (s.phase !== "plug") {
      s.phase = "plug";
      return { done: false, solve: s, shows: ["N = " + format(s.missing) + " + " + format(info.known)], message: "" };
    }
    s.total = info.total;
    s.phase = "total";
    return { done: goalOf(task) === "total", solve: s, shows: ["N = " + format(info.total)], message: "" };
  }
  if (s.total == null && s.missing == null) {
    var lines = siteLines(info);
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
    if (s.phase !== "sum" && s.phase !== "subtract") {
      s.phase = "sum";
      return { done: false, solve: s, shows: [knownExpr(compiled)], message: "" };
    }
    if (s.phase === "sum") {
      s.phase = "subtract";
      return { done: false, solve: s, shows: ["x = " + format(s.total) + " - " + format(info.known)], message: "" };
    }
    return finishFound(s, task, info, "missing");
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
