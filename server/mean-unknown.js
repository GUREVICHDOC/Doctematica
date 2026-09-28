"use strict";

// ממוצע עם נעלם: בניית משוואת הממוצע, ואז מנוע המשוואות הקיים.
// x בשורת השכיחות נכנס גם למונה וגם למכנה. x בשורת הערכים נכנס רק למונה.

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    var t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

function rat(n, d) {
  n = Math.round(n);
  d = Math.round(d);
  if (!d) return null;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  var g = gcd(n, d);
  return { n: n / g, d: d / g };
}

function sameRat(a, b) {
  return !!a && !!b && a.n === b.n && a.d === b.d;
}

function formatRat(r) {
  if (!r) return "";
  if (r.d === 1) return String(r.n);
  var d = r.d;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  if (d !== 1) return r.n + "/" + r.d;
  var n = Math.abs(r.n);
  var den = r.d;
  var whole = Math.floor(n / den);
  var rem = n % den;
  var dec = "";
  var guard = 0;
  while (rem && guard < 8) {
    rem *= 10;
    dec += String(Math.floor(rem / den));
    rem %= den;
    guard += 1;
  }
  if (rem) return r.n + "/" + r.d;
  return (r.n < 0 ? "-" : "") + whole + (dec ? "." + dec : "");
}

function parseMean(value) {
  if (value && typeof value === "object" && value.n != null) return rat(value.n, value.d || 1);
  var text = String(value == null ? "" : value).replace(",", ".").trim();
  if (/^-?\d+\/\d+$/.test(text)) {
    var bits = text.split("/");
    return rat(Number(bits[0]), Number(bits[1]));
  }
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return null;
  if (text.indexOf(".") < 0) return rat(Number(text), 1);
  var parts = text.split(".");
  var sign = text.charAt(0) === "-" ? -1 : 1;
  var whole = parts[0].replace("-", "") || "0";
  return rat(sign * Number(whole + parts[1]), Math.pow(10, parts[1].length));
}

function coeffText(a) {
  if (a === 1) return "x";
  if (a === -1) return "-x";
  return a + "*x";
}

function prep(text) {
  var s = String(text || "").trim();
  s = s.replace(/\u0304/g, "");
  s = s.replace(/\\bar\{x\}/gi, "");
  s = s.replace(/ממוצע/g, "");
  s = s.replace(/[·⋅×]/g, "*");
  s = s.replace(/(\d)x/gi, "$1*x");
  s = s.replace(/[−–—]/g, "-");
  s = s.replace(/\s+/g, "");
  if (s.charAt(0) === "=") s = s.slice(1);
  return s;
}

function showEq(eq) {
  return String(eq || "").replace(/\*/g, "·");
}

function owns(task) {
  return !!task && (task.kind === "meanUnknown" || task.kind === "meanChoice" || task.kind === "meanFollow" || task.kind === "meanShift");
}

function xRowOf(compiled) {
  var found = null;
  (compiled && compiled.rows || []).forEach(function (row) {
    if (found) return;
    if (row.givenExpr) found = { row: row, role: "frequency" };
    else if (String(row.value).replace(/\s+/g, "") === "x") found = { row: row, role: "value" };
  });
  return found;
}

function modelOf(compiled, task) {
  if (!task) return null;
  if (task.kind === "meanChoice") {
    var choice = modelOf(compiled, { kind: "meanUnknown", unknown: task.unknown, values: task.values, copies: task.copies, mean: task.mean, total: task.total });
    if (!choice) return null;
    choice.kind = "meanChoice";
    choice.options = task.options || [];
    return choice;
  }
  if (task.kind === "meanFollow" || task.kind === "meanShift") {
    return { kind: task.kind, goal: task.goal || "", need: task.need, bonus: task.bonus, who: task.who, add: task.add || [] };
  }
  var role = task.unknown || "";
  if (role === "list") {
    var values = (task.values || []).map(Number);
    var copies = task.copies || 1;
    var knownSum = 0;
    values.forEach(function (value) { knownSum += value; });
    var mean = parseMean(task.mean);
    var count = values.length + copies;
    var solution = solveLinear(copies, knownSum, 0, count, mean);
    return {
      kind: "meanUnknown",
      role: "list",
      values: values,
      knownSum: knownSum,
      knownCount: count,
      numA: copies,
      denA: 0,
      mean: mean,
      meanText: formatRat(mean),
      solution: solution,
      expanded: "(" + values.join("+") + "+" + coeffText(copies) + ")/" + count + "=" + formatRat(mean),
      collapsed: "(" + knownSum + "+" + coeffText(copies) + ")/" + count + "=" + formatRat(mean),
    };
  }
  if (role === "count") {
    var known = 0;
    (compiled.rows || []).forEach(function (row) {
      if (row.givenExpr || row.freq == null) return;
      known += Number(row.freq);
    });
    var total = Number(task.total);
    var freqs = (compiled.rows || []).filter(function (row) { return !row.givenExpr && row.freq != null; }).map(function (row) { return String(row.freq); });
    return {
      kind: "meanUnknown",
      role: "count",
      knownSum: known,
      knownCount: known,
      numA: 1,
      denA: 0,
      total: total,
      mean: rat(total, 1),
      meanText: String(total),
      solution: rat(total - known, 1),
      expanded: freqs.join("+") + "+x=" + total,
      collapsed: known + "+x=" + total,
    };
  }
  var marked = xRowOf(compiled);
  if (!marked) return null;
  role = marked.role;
  var meanRat = parseMean(task.mean);
  var knownSum = 0;
  var knownCount = 0;
  var valueSum = 0;
  var categories = 0;
  (compiled.rows || []).forEach(function (row) {
    if (row.num == null || !isFinite(row.num)) return;
    categories += 1;
    valueSum += row.num;
    if (row === marked.row) return;
    if (row.freq == null) return;
    knownSum += row.num * row.freq;
    knownCount += row.freq;
  });
  var numA = role === "frequency" ? marked.row.num : Number(marked.row.freq);
  var denA = role === "frequency" ? 1 : 0;
  var denB = role === "frequency" ? knownCount : knownCount + Number(marked.row.freq);
  var numParts = [];
  var denParts = [];
  (compiled.rows || []).forEach(function (row) {
    if (row === marked.row) {
      if (role === "frequency") {
        numParts.push(row.num + "*x");
        denParts.push("x");
      } else {
        numParts.push("x*" + row.freq);
        denParts.push(String(row.freq));
      }
      return;
    }
    if (row.num == null || row.freq == null) return;
    numParts.push(row.num + "*" + row.freq);
    denParts.push(String(row.freq));
  });
  var expanded = "(" + numParts.join("+") + ")/(" + denParts.join("+") + ")=" + formatRat(meanRat);
  var collapsedNum = knownSum + "+" + coeffText(numA);
  var collapsedDen = denA ? knownCount + "+x" : String(denB);
  return {
    kind: "meanUnknown",
    role: role,
    knownSum: knownSum,
    knownCount: role === "frequency" ? knownCount : denB,
    numA: numA,
    denA: denA,
    valueSum: valueSum,
    categories: categories,
    mean: meanRat,
    meanText: formatRat(meanRat),
    solution: solveLinear(numA, knownSum, denA, denB, meanRat),
    expanded: expanded,
    collapsed: "(" + collapsedNum + ")/(" + collapsedDen + ")=" + formatRat(meanRat),
    xValue: marked.row.value,
  };
}

function solveLinear(numA, numB, denA, denB, mean) {
  if (!mean) return null;
  var a = mean.d * numA - mean.n * denA;
  var b = mean.n * denB - mean.d * numB;
  if (!a) return null;
  return rat(b, a);
}

function tasksOf(ex) {
  var list = [];
  (ex && ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) { list.push(task); });
  });
  return list;
}

function modelsOf(compiled, ex) {
  return tasksOf(ex).map(function (task) {
    if (task.kind !== "meanUnknown" && task.kind !== "meanChoice") return null;
    return modelOf(compiled, task);
  }).filter(Boolean);
}

function copyState(progress) {
  var src = progress && progress.unknown || {};
  return {
    equation: src.equation || "",
    value: src.value == null ? null : src.value,
    sum: src.sum == null ? null : src.sum,
    list: src.list || {},
    known: src.known || {},
  };
}

function algebra(engine) {
  return engine && engine.DoctematicaAlgebra;
}

function teach(engine) {
  return engine && engine.DoctematicaTeach;
}

function relate(engine, prev, next) {
  var A = algebra(engine);
  var T = teach(engine);
  if (!A || !T || !prev || !next) return { ok: false, message: "המשוואה אינה מתאימה לנתונים." };
  try {
    if (T.eqHasVarDenom(prev) || T.eqHasVarDenom(next)) return T.checkRationalStep(prev, next);
    return A.checkStep(prev, next);
  } catch (err) {
    return { ok: false, message: err && err.message ? err.message : "המשוואה אינה מתאימה לנתונים." };
  }
}

function matches(engine, canonical, typed) {
  if (!canonical || !typed) return false;
  var hit = relate(engine, canonical, typed);
  return !!(hit && (hit.ok || hit.same));
}

function stripOuter(expr) {
  var s = String(expr || "");
  while (s.charAt(0) === "(" && s.charAt(s.length - 1) === ")") {
    var depth = 0;
    var wraps = true;
    var i;
    for (i = 0; i < s.length; i++) {
      if (s.charAt(i) === "(") depth += 1;
      else if (s.charAt(i) === ")") depth -= 1;
      if (depth === 0 && i < s.length - 1) wraps = false;
    }
    if (!wraps || depth !== 0) break;
    s = s.slice(1, -1);
  }
  return s;
}

function splitAdditive(expr) {
  var s = stripOuter(expr);
  var depth = 0;
  var parts = [];
  var start = 0;
  var sign = 1;
  var i = 0;
  if (s.charAt(0) === "+") {
    start = 1;
    i = 1;
  } else if (s.charAt(0) === "-") {
    sign = -1;
    start = 1;
    i = 1;
  }
  for (; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if ((ch === "+" || ch === "-") && depth === 0) {
      parts.push({ sign: sign, text: s.slice(start, i) });
      sign = ch === "-" ? -1 : 1;
      start = i + 1;
    }
    if (depth < 0) return null;
  }
  if (depth !== 0) return null;
  parts.push({ sign: sign, text: s.slice(start) });
  return parts;
}

function evalLinear(expr) {
  var parts = splitAdditive(expr);
  if (!parts) return null;
  var a = 0;
  var b = 0;
  var i;
  for (i = 0; i < parts.length; i++) {
    var piece = stripOuter(parts[i].text);
    if (!piece) return null;
    if (piece.indexOf("+") >= 0 || (piece.indexOf("-") > 0)) {
      var inner = evalLinear(piece);
      if (!inner) return null;
      a += parts[i].sign * inner.a;
      b += parts[i].sign * inner.b;
      continue;
    }
    var factors = piece.split("*");
    var coeff = 1;
    var xs = 0;
    var f;
    for (f = 0; f < factors.length; f++) {
      var bit = factors[f];
      if (!bit) return null;
      if (bit === "x" || bit === "X") xs += 1;
      else if (/^-?\d+(?:\.\d+)?$/.test(bit)) coeff *= Number(bit);
      else return null;
    }
    if (xs > 1) return null;
    if (xs === 1) a += parts[i].sign * coeff;
    else b += parts[i].sign * coeff;
  }
  return { a: a, b: b };
}

function splitSlash(expr) {
  var depth = 0;
  var at = -1;
  var i;
  for (i = 0; i < expr.length; i++) {
    var ch = expr.charAt(i);
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "/" && depth === 0) at = i;
  }
  if (at < 0) return null;
  return { num: expr.slice(0, at), den: expr.slice(at + 1) };
}

function parseFractionEq(text) {
  var eq = text.indexOf("=");
  if (eq < 0) return null;
  var left = text.slice(0, eq);
  var right = text.slice(eq + 1);
  if (right.indexOf("=") >= 0) return null;
  var slash = splitSlash(left);
  if (!slash) return null;
  var num = evalLinear(slash.num);
  var den = evalLinear(slash.den);
  var mean = parseMean(right);
  if (!num || !den || !mean) return null;
  return { num: num, den: den, mean: mean };
}

function near(n, m) {
  return Math.abs(n - m) < 1e-9;
}

function diagnose(text, model) {
  if (model.role === "count") {
    if (text.indexOf("/") >= 0) return "כאן חסרה שכיחות, ומספר המקרים הכולל נתון. כתבו משוואה לסכום השכיחויות.";
    var sides = text.split("=");
    if (sides.length === 2) {
      var left = evalLinear(sides[0]);
      var right = parseMean(sides[1]);
      if (left && right) {
        if (left.a === 0) return "חסר x במשוואת סכום השכיחויות.";
        if (!sameRat(right, model.mean)) return "האגף הימני צריך להיות מספר המקרים הכולל.";
        if (left.a === 1 && left.b !== model.knownSum) return "בדקו את סכום השכיחויות הידועות.";
        if (left.a !== 1) return "השכיחות החסרה מתווספת לסכום, לא מוכפלת.";
      }
    }
    return "המשוואה אינה מתאימה לנתונים.";
  }
  var frac = parseFractionEq(text);
  if (!frac) return "המשוואה אינה מתאימה לנתונים.";
  if (!sameRat(frac.mean, model.mean)) return "האגף הימני צריך להיות הממוצע הנתון.";
  if (model.role === "frequency") {
    if (frac.den.a === 0 && near(frac.den.b, model.categories)) {
      return "בממוצע מתוך טבלת שכיחויות מחלקים במספר הנתונים הכולל, כלומר בסכום השכיחויות, ולא במספר הערכים השונים.";
    }
    if (frac.den.a === 0 && near(frac.den.b, model.valueSum)) {
      return "בממוצע מתוך טבלת שכיחויות מחלקים בסכום השכיחויות, לא בסכום הערכים.";
    }
    if (frac.den.b === 0 && frac.den.a !== 0) return "המכנה כופל ב-x במקום להוסיף את השכיחות החסרה.";
    if (frac.den.a === 0) return "השכיחות החסרה צריכה להופיע גם במכנה, יחד עם סכום השכיחויות.";
    if (frac.num.a === 0) return "חסר במונה האיבר של הערך כפול השכיחות החסרה.";
    if (!near(frac.num.a, model.numA)) return "הנעלם הוכנס למונה במקום לא נכון. כאן הוא שכיחות, ולכן מוכפלים בערך של העמודה.";
    if (!near(frac.den.a, 1)) return "במכנה השכיחות החסרה מתווספת פעם אחת, לא מוכפלת.";
    if (!near(frac.num.b, model.knownSum) || !near(frac.den.b, model.knownCount)) return "המבנה נכון, אבל יש טעות בחישוב.";
  }
  if (model.role === "value") {
    if (frac.den.a !== 0) return "x הוא ערך של המשתנה, לא שכיחות. הוא לא מתווסף למספר הנתונים.";
    if (near(frac.den.b, model.categories)) {
      return "בממוצע מתוך טבלת שכיחויות מחלקים במספר הנתונים הכולל, כלומר בסכום השכיחויות, ולא במספר הערכים השונים.";
    }
    if (frac.num.a === 0) return "חסר במונה האיבר של הערך החסר כפול השכיחות שלו.";
    if (!near(frac.num.a, model.numA)) return "הערך החסר צריך להיות מוכפל בשכיחות של העמודה שלו.";
    if (!near(frac.den.b, model.knownCount) || !near(frac.num.b, model.knownSum)) return "המבנה נכון, אבל יש טעות בחישוב.";
  }
  if (model.role === "list") {
    if (frac.den.a !== 0) return "ברשימה הנעלם הוא ערך אחד. מספר הנתונים לא משתנה בגללו, אלא אם נוספו נתונים.";
    if (!near(frac.den.b, model.knownCount)) return "מספר הנתונים שגוי.";
    if (frac.num.a === 0) return "חסר במונה הערך החסר.";
    if (!near(frac.num.a, model.numA)) return "הנעלם צריך להופיע במונה כמספר הפעמים שהוא נוסף.";
    if (!near(frac.num.b, model.knownSum)) return "המבנה נכון, אבל יש טעות בחישוב של הסכום.";
  }
  return "המשוואה אינה מתאימה לנתונים.";
}

function parseIsolated(text, model) {
  var match = /^x=(-?\d+(?:\.\d+)?|-?\d+\/\d+)$/i.exec(text);
  if (!match) return null;
  var got = parseMean(match[1]);
  if (!got || !sameRat(got, model.solution)) return null;
  return model.solution;
}

function unreducedAnswer(text, model) {
  var body = prep(text).replace(/^x=/i, "");
  var match = /^(-?\d+)\/(-?\d+)$/.exec(body);
  if (!match || !model) return false;
  var got = parseMean(body);
  if (!got || !sameRat(got, model.solution)) return false;
  return gcd(Math.abs(Number(match[1])), Math.abs(Number(match[2]))) !== 1;
}

function keepUnreduced(state, text) {
  state.equation = /^x=/i.test(prep(text)) ? prep(text) : "x=" + prep(text);
  return { ok: true, done: false, shows: [showEq(state.equation)], unknown: state, message: "" };
}

function bareNumber(text) {
  if (!/^-?\d+(?:\.\d+)?$/.test(text) && !/^-?\d+\/\d+$/.test(text)) return null;
  return parseMean(text);
}

function partialSum(text, model) {
  if (!model || model.knownSum == null || /x/i.test(text)) return null;
  var body = text;
  var announced = null;
  if (text.indexOf("=") >= 0) {
    var sides = text.split("=");
    if (sides.length !== 2) return null;
    body = sides[0];
    announced = parseMean(sides[1]);
    if (!announced) return null;
  }
  var got = evalLinear(body);
  if (!got || got.a !== 0 || !near(got.b, model.knownSum)) return null;
  if (announced && !near(announced.n / announced.d, model.knownSum)) return null;
  return true;
}

function finishValue(state, model, show) {
  state.value = model.solution.d === 1 ? model.solution.n : model.solution.n / model.solution.d;
  state.equation = "x=" + formatRat(model.solution);
  return {
    ok: true,
    done: true,
    shows: [show || "x=" + formatRat(model.solution)],
    unknown: state,
    message: "",
  };
}

function acceptEquation(state, model, eq) {
  state.equation = eq;
  var isolated = parseIsolated(prep(eq), model);
  if (isolated) return finishValue(state, model, "x=" + formatRat(model.solution));
  var hit = relate({ DoctematicaTeach: globalTeach, DoctematicaAlgebra: globalAlgebra }, model.expanded, eq);
  if (hit && hit.solved) return finishValue(state, model, showEq(eq));
  return {
    ok: true,
    done: false,
    shows: [showEq(eq)],
    unknown: state,
    message: "",
  };
}

var globalTeach = null;
var globalAlgebra = null;

function checkUnknown(engine, compiled, task, typed, progress) {
  globalTeach = teach(engine);
  globalAlgebra = algebra(engine);
  var model = modelOf(compiled, task);
  if (!model) return { ok: false, message: "השאלה לא נתמכת." };
  var state = copyState(progress);
  var text = prep(typed);
  if (!text) return { ok: false, message: "כתבו תשובה." };
  if (model.kind === "meanChoice") return checkChoice(engine, compiled, task, text, state, model);
  if (model.kind === "meanFollow") return checkFollow(compiled, task, text, progress);
  if (model.kind === "meanShift") return checkShift(compiled, task, typed, progress);
  var isolated = parseIsolated(text, model);
  if (isolated) {
    if (unreducedAnswer(text, model)) return keepUnreduced(state, text);
    return finishValue(state, model);
  }
  var bare = bareNumber(text);
  if (bare && !/x/i.test(text)) {
    if (sameRat(bare, model.solution)) {
      if (unreducedAnswer(text, model)) return keepUnreduced(state, text);
      return finishValue(state, model, formatRat(model.solution));
    }
    if (model.role !== "count" && sameRat(bare, model.mean)) return { ok: false, message: "זה הממוצע הנתון, לא הערך החסר." };
    if (near(bare.n / bare.d, model.knownCount) && !sameRat(bare, model.solution)) return { ok: false, message: "זה מספר הנתונים, לא הערך החסר." };
    if (partialSum(text, model)) {
      state.sum = model.knownSum;
      return { ok: true, done: false, shows: [String(model.knownSum)], unknown: state, message: "" };
    }
    return { ok: false, message: model.role === "count" ? "זו לא השכיחות החסרה." : "זה לא הערך החסר." };
  }
  if (partialSum(text, model)) {
    state.sum = model.knownSum;
    return { ok: true, done: false, shows: [showEq(text.indexOf("=") >= 0 ? text : text + "=" + model.knownSum)], unknown: state, message: "" };
  }
  if (state.equation) {
    var step = relate(engine, state.equation, text);
    if (step && step.same) return { ok: false, message: step.message || "זו אותה משוואה. כתבו צעד חדש." };
    if (step && step.ok) {
      if ((step.solved || parseIsolated(text, model)) && !unreducedAnswer(text, model)) return finishValue(state, model, showEq(text));
      state.equation = text;
      return { ok: true, done: false, shows: [showEq(text)], unknown: state, message: "" };
    }
    if (matches(engine, model.expanded, text) || matches(engine, model.collapsed, text)) return acceptEquation(state, model, text);
    return { ok: false, message: step && step.message ? step.message : "הצעד לא שקול." };
  }
  if (matches(engine, model.expanded, text) || matches(engine, model.collapsed, text)) return acceptEquation(state, model, text);
  if (exactFraction(text, model) || exactCount(text, model)) return acceptEquation(state, model, text);
  return { ok: false, message: diagnose(text, model) };
}

function exactFraction(text, model) {
  if (!model || model.role === "count") return false;
  var frac = parseFractionEq(text);
  if (!frac || !sameRat(frac.mean, model.mean)) return false;
  if (!near(frac.num.a, model.numA) || !near(frac.num.b, model.knownSum)) return false;
  if (model.role === "frequency") return near(frac.den.a, 1) && near(frac.den.b, model.knownCount);
  return frac.den.a === 0 && near(frac.den.b, model.knownCount);
}

function exactCount(text, model) {
  if (!model || model.role !== "count") return false;
  var sides = text.split("=");
  if (sides.length !== 2) return false;
  var left = evalLinear(sides[0]);
  var right = parseMean(sides[1]);
  return !!(left && right && left.a === 1 && near(left.b, model.knownSum) && sameRat(right, model.mean));
}

function optionIndex(text, count) {
  var raw = String(text || "").trim();
  var roman = { I: 0, II: 1, III: 2, IV: 3 };
  var compact = raw.replace(/[().\s]/g, "").toUpperCase();
  if (Object.prototype.hasOwnProperty.call(roman, compact) && roman[compact] < count) return roman[compact];
  var digits = raw.replace(/[^\d]/g, "");
  if (/^\d+$/.test(digits)) {
    var n = Number(digits);
    if (n >= 1 && n <= count) return n - 1;
  }
  return -1;
}

function checkChoice(engine, compiled, task, text, state, model) {
  var options = model.options || [];
  var index = optionIndex(text, options.length);
  var chosen = index >= 0 ? prep(options[index].eq) : text;
  var correct = options.filter(function (option) {
    return matches(engine, model.expanded, prep(option.eq));
  });
  if (!correct.length) return { ok: false, message: "המשוואה אינה מתאימה לנתונים." };
  var pickedCorrect = correct.some(function (option) { return prep(option.eq) === chosen || matches(engine, prep(option.eq), chosen); });
  if (index < 0 && matches(engine, model.expanded, text)) pickedCorrect = true;
  if (!pickedCorrect) {
    var wrong = index >= 0 ? prep(options[index].eq) : text;
    return { ok: false, message: diagnose(wrong, model) };
  }
  state.equation = prep(correct[0].eq);
  return { ok: true, done: true, shows: [showEq(state.equation)], unknown: state, message: "" };
}

function tableSum(compiled) {
  var sum = 0;
  var total = 0;
  (compiled.rows || []).forEach(function (row) {
    if (row.num == null || row.freq == null) return;
    sum += row.num * row.freq;
    total += row.freq;
  });
  return { sum: sum, total: total };
}

function checkFollow(compiled, task, text, progress) {
  var stats = tableSum(compiled);
  if (task.goal === "enough") {
    var rooms = stats.sum;
    var word = /^כן/.test(text) ? "כן" : /^לא/.test(text) ? "לא" : "";
    var enough = rooms >= Number(task.need);
    if (word) {
      if ((enough && word === "לא") || (!enough && word === "כן")) {
        return { ok: false, message: "חשבו את מספר החדרים הכולל והשוו אותו ל-" + task.need + "." };
      }
      return { ok: true, done: true, shows: [word], message: "" };
    }
    var asNum = bareNumber(text);
    if (asNum && near(asNum.n / asNum.d, rooms)) return { ok: false, message: "זה מספר החדרים. השוו אותו ל-" + task.need + " וענו כן או לא." };
    if (asNum && near(asNum.n / asNum.d, Number(task.need))) return { ok: false, message: "זה מספר העובדים. חשבו כמה חדרים יש." };
    if (text.indexOf(">") >= 0 || text.indexOf("<") >= 0) {
      if ((enough && text.indexOf(">") >= 0) || (!enough && text.indexOf("<") >= 0)) {
        return { ok: true, done: true, shows: [rooms + (enough ? ">" : "<") + task.need], message: "" };
      }
    }
    return { ok: false, message: "חשבו את מספר החדרים הכולל והשוו אותו ל-" + task.need + "." };
  }
  if (task.goal === "share") {
    var who = 0;
    (compiled.rows || []).forEach(function (row) {
      if (row.num != null && near(row.num, Number(task.who))) who = row.freq;
    });
    var pool = who * Number(task.bonus);
    var each = stats.total ? pool / stats.total : NaN;
    var got = bareNumber(text);
    if (got && near(got.n / got.d, each)) return { ok: true, done: true, shows: [String(each)], message: "" };
    if (got && near(got.n / got.d, pool)) return { ok: false, message: "זה סכום המענקים. חלקו אותו במספר העובדים." };
    if (got && near(got.n / got.d, Number(task.bonus))) return { ok: false, message: "זה המענק של עובד אחד. צריך לחלק את הסכום בין כל העובדים." };
    if (got && near(got.n / got.d, stats.total)) return { ok: false, message: "זה מספר העובדים. חלקו בו את סכום המענקים." };
    var linear = evalLinear(text.split("=")[0]);
    if (text.indexOf("/") >= 0 && linear && near(linear.b, each)) return { ok: true, done: true, shows: [String(each)], message: "" };
    if (pool && text.indexOf(String(pool)) >= 0 && text.indexOf(String(stats.total)) >= 0 && text.indexOf(String(each)) >= 0) {
      return { ok: true, done: true, shows: [pool + "/" + stats.total + "=" + each], message: "" };
    }
    return { ok: false, message: "חלקו את סך המענקים במספר העובדים." };
  }
  return { ok: false, message: "השאלה לא נתמכת." };
}

function shiftWord(typed) {
  var text = String(typed || "").replace(/\s+/g, " ").trim();
  if (text.indexOf("לא השתנה") >= 0 || text.indexOf("נשאר") >= 0) return "לא השתנה";
  if (text.indexOf("ירד") >= 0) return "ירד";
  if (text.indexOf("עלה") >= 0) return "עלה";
  return "";
}

function checkShift(compiled, task, typed, progress) {
  var before = tableSum(compiled);
  var afterSum = before.sum;
  var afterTotal = before.total;
  (task.add || []).forEach(function (item) {
    afterSum += Number(item.value) * Number(item.freq || 1);
    afterTotal += Number(item.freq || 1);
  });
  var beforeMean = before.total ? before.sum / before.total : NaN;
  var afterMean = afterTotal ? afterSum / afterTotal : NaN;
  var expect = "לא השתנה";
  if (afterMean > beforeMean + 1e-9) expect = "עלה";
  else if (afterMean < beforeMean - 1e-9) expect = "ירד";
  var word = shiftWord(typed);
  if (!word) return { ok: false, message: "כתבו אם הממוצע עלה, ירד, או לא השתנה." };
  if (word !== expect) return { ok: false, message: "חשבו את הממוצע לפני ההוספה ואחריה, והשוו ביניהם." };
  return { ok: true, done: true, shows: [word], message: "" };
}

function hint(engine, compiled, task, progress) {
  var model = modelOf(compiled, task);
  if (!model) return "השתמשו בנוסחת הממוצע.";
  var state = copyState(progress);
  if (model.kind === "meanChoice") return "בדקו איזו משוואה כוללת כל ערך כפול השכיחות שלו, והאם השכיחות החסרה נמצאת גם בסכום השכיחויות.";
  if (model.kind === "meanShift") return "חשבו את הממוצע לפני ההוספה ואחריה, והשוו ביניהם.";
  if (model.kind === "meanFollow" && model.goal === "enough") return "מצאו את מספר החדרים הכולל והשוו אותו למספר העובדים.";
  if (model.kind === "meanFollow") return "חלקו את סך המענקים במספר העובדים.";
  if (state.equation) {
    var act = teach(engine) && teach(engine).nextAction(state.equation);
    if (act && act.hint) return act.hint;
  }
  if (state.sum != null) return "הסכום הידוע כבר נמצא. שלבו אותו עם הנעלם במשוואת הממוצע.";
  if (model.role === "frequency") return "חשבו כיצד השכיחות החסרה משפיעה גם על סכום הנתונים וגם על מספר הנתונים הכולל.";
  if (model.role === "value") return "x הוא ערך של המשתנה. במונה הוא מוכפל בשכיחות שלו, והמכנה הוא סכום השכיחויות.";
  if (model.role === "count") return "סכום השכיחויות נתון. מצאו את השכיחות החסרה.";
  return "השתמשו בנוסחת הממוצע: סכום הנתונים חלקי מספר הנתונים.";
}

function next(engine, compiled, task, progress) {
  globalTeach = teach(engine);
  globalAlgebra = algebra(engine);
  var model = modelOf(compiled, task);
  if (!model) return null;
  var state = copyState(progress);
  if (model.kind === "meanChoice") {
    var correct = (model.options || []).filter(function (option) {
      return matches(engine, model.expanded, prep(option.eq));
    })[0];
    if (!correct) return null;
    state.equation = prep(correct.eq);
    return { line: showEq(state.equation), done: true, unknown: state };
  }
  if (model.kind === "meanShift") {
    var word = checkShift(compiled, task, "עלה", progress);
    var answer = word.ok ? "עלה" : checkShift(compiled, task, "ירד", progress);
    var shown = word.ok ? "עלה" : answer.ok ? "ירד" : "לא השתנה";
    return { line: shown, done: true, unknown: state };
  }
  if (model.kind === "meanFollow") {
    var probe = task.goal === "enough" ? "כן" : "";
    if (task.goal === "enough") {
      var hit = checkFollow(compiled, task, "כן", progress);
      return { line: hit.ok ? "כן" : "לא", done: true, unknown: state };
    }
    var stats = tableSum(compiled);
    var who = 0;
    (compiled.rows || []).forEach(function (row) {
      if (row.num != null && near(row.num, Number(task.who))) who = row.freq;
    });
    var each = stats.total ? (who * Number(task.bonus)) / stats.total : "";
    return { line: String(each), done: true, unknown: state };
  }
  if (state.value != null && sameRat(parseMean(state.value), model.solution)) {
    return { line: "x=" + formatRat(model.solution), done: true, unknown: state };
  }
  if (!state.equation) {
    var line = state.sum != null ? model.collapsed : model.expanded;
    state.equation = prep(line);
    return { line: showEq(line), done: false, unknown: state };
  }
  var T = teach(engine);
  if (!T) return null;
  var act = T.nextAction(state.equation);
  if (!act || act.done || !act.eq) return { line: "x=" + formatRat(model.solution), done: true, unknown: finishValue(state, model).unknown };
  var stored = prep(act.eq);
  if (stored === prep("x=" + formatRat(model.solution))) {
    return { line: showEq(act.eq), done: true, unknown: finishValue(state, model).unknown };
  }
  if (stored === prep(state.equation)) return { line: "x=" + formatRat(model.solution), done: true, unknown: finishValue(state, model).unknown };
  state.equation = stored;
  return { line: showEq(act.eq), done: false, unknown: state };
}

function sanitize(engine, compiled, ex, raw) {
  var out = { equation: "", value: null, sum: null, list: {}, known: {} };
  raw = raw || {};
  var models = modelsOf(compiled, ex);
  if (raw.value != null) {
    var got = parseMean(raw.value);
    models.forEach(function (model) {
      if (got && sameRat(got, model.solution)) out.value = model.solution.d === 1 ? model.solution.n : model.solution.n / model.solution.d;
    });
  }
  if (typeof raw.equation === "string" && raw.equation.length < 240) {
    var eq = prep(raw.equation);
    var kept = models.some(function (model) {
      return matches(engine, model.expanded, eq) || matches(engine, model.collapsed, eq) || exactFraction(eq, model) || exactCount(eq, model);
    });
    if (kept) out.equation = eq;
  }
  if (raw.sum != null) {
    models.forEach(function (model) {
      if (near(Number(raw.sum), model.knownSum)) out.sum = model.knownSum;
    });
  }
  var Mean = require("./mean");
  tasksOf(ex).forEach(function (task) {
    if (!task.source || task.source.type !== "list" || !raw.list || !raw.list[task.id]) return;
    out.list[task.id] = Mean.sanitizeList(task, raw.list[task.id]);
  });
  if (raw.known && typeof raw.known === "object") {
    Object.keys(raw.known).forEach(function (key) {
      if (raw.known[key]) out.known[key] = true;
    });
  }
  return out;
}

function apply(compiled, progress) {
  if (!progress || !progress.unknown || progress.unknown.value == null) return;
  var value = Number(progress.unknown.value);
  if (!isFinite(value)) return;
  (compiled.rows || []).forEach(function (row) {
    if (!row.givenExpr) return;
    row.freq = value;
    row.missing = false;
  });
}

function mark(compiled, ex) {
  compiled.unknownCell = tasksOf(ex).some(function (task) {
    return task.kind === "meanUnknown" || task.kind === "meanChoice";
  }) && (compiled.rows || []).some(function (row) { return row.givenExpr; });
}

function noteCell(engine, compiled, ex, progress, fill) {
  if (!fill || fill.value == null) return null;
  var row = (compiled.rows || []).filter(function (item) {
    return item.givenExpr && String(item.value) === String(fill.value);
  })[0];
  if (!row) return null;
  var model = modelsOf(compiled, ex).filter(function (item) { return item.role === "frequency" || item.role === "count"; })[0];
  if (!model) return null;
  var got = parseMean(prep(fill.typed));
  if (!got || !sameRat(got, model.solution)) return { ok: false, message: "הערך בתא לא מתאים לנתונים." };
  var state = copyState(progress);
  state.value = model.solution.d === 1 ? model.solution.n : model.solution.n / model.solution.d;
  return { ok: true, unknown: state, value: state.value };
}

module.exports = {
  owns: owns,
  modelOf: modelOf,
  check: checkUnknown,
  hint: hint,
  next: next,
  sanitize: sanitize,
  apply: apply,
  mark: mark,
  noteCell: noteCell,
};
