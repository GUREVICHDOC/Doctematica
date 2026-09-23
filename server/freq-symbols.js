"use strict";

// שכיחויות חסרות עם יחס נתון. הסימון חופשי, והמשוואה נמסרת למנוע הקיים בנעלם אחד.

function same(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-6;
}

function keyOf(value) {
  return String(value == null ? "" : value).trim();
}

function ratioOf(compiled) {
  var list = compiled && compiled.ratios;
  return list && list.length ? list[0] : null;
}

function openRows(compiled) {
  return (compiled.rows || []).filter(function (row) { return row.missing; });
}

function knownSum(compiled) {
  var total = 0;
  (compiled.rows || []).forEach(function (row) {
    if (!row.missing && row.freq != null && isFinite(Number(row.freq))) total += Number(row.freq);
  });
  return total;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    var t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}

function formatCoeff(coeff) {
  if (!isFinite(coeff)) return "";
  if (same(coeff, Math.round(coeff))) {
    var n = Math.round(coeff);
    if (n === 1) return "x";
    if (n === -1) return "-x";
    return String(n) + "x";
  }
  var sign = coeff < 0 ? "-" : "";
  var abs = Math.abs(coeff);
  var den = 1;
  while (den <= 1000 && !same(abs * den, Math.round(abs * den))) den += 1;
  var num = Math.round(abs * den);
  var g = gcd(num, den);
  return sign + "(" + (num / g) + "/" + (den / g) + ")x";
}

function parseTerm(text) {
  var t = String(text || "").trim().replace(/[−–—]/g, "-").replace(/\s+/g, "").replace(/[∙⋅•×✕*]/g, "");
  if (!t) return null;
  if (/^-?\d+(?:\.\d+)?$/.test(t)) return { kind: "number", value: Number(t) };
  var frac = t.match(/^\(?(-?\d+)\/(-?\d+)\)?x$/i);
  if (frac && Number(frac[2])) {
    return { kind: "expr", coeff: Number(frac[1]) / Number(frac[2]), text: formatCoeff(Number(frac[1]) / Number(frac[2])) };
  }
  var plain = t.match(/^(-?\d+)?x$/i);
  if (!plain) return null;
  var raw = plain[1];
  var coeff = raw == null || raw === "" ? 1 : Number(raw);
  if (!coeff) return null;
  return { kind: "expr", coeff: coeff, text: formatCoeff(coeff) };
}

function trueFreqs(compiled) {
  var ratio = ratioOf(compiled);
  var out = {};
  if (!ratio || compiled.population == null) return out;
  var gap = Number(compiled.population) - knownSum(compiled);
  var parts = ratio.parts || [];
  var denom = Number(parts[0]) + Number(parts[1]);
  if (!denom) return out;
  var unit = gap / denom;
  out[keyOf(ratio.left)] = Number(parts[0]) * unit;
  out[keyOf(ratio.right)] = Number(parts[1]) * unit;
  return out;
}

function sideKeys(compiled) {
  var ratio = ratioOf(compiled);
  if (!ratio) return null;
  return { left: keyOf(ratio.left), right: keyOf(ratio.right), parts: ratio.parts };
}

function holds(leftCoeff, rightCoeff, parts) {
  return same(leftCoeff * Number(parts[1]), rightCoeff * Number(parts[0]));
}

function inverted(leftCoeff, rightCoeff, parts) {
  return !holds(leftCoeff, rightCoeff, parts) && same(leftCoeff * Number(parts[0]), rightCoeff * Number(parts[1]));
}

function clone(raw) {
  raw = raw || {};
  var value = raw.value == null || raw.value === "" ? null : Number(raw.value);
  return {
    cells: Object.assign({}, raw.cells || {}),
    equation: raw.equation ? String(raw.equation) : "",
    eqCurrent: raw.eqCurrent ? String(raw.eqCurrent) : "",
    value: value != null && isFinite(value) ? value : null,
    resolved: Object.assign({}, raw.resolved || {}),
  };
}

function algebra(engine) {
  return engine && engine.DoctematicaAlgebra;
}

function teach(engine) {
  return engine && engine.DoctematicaTeach;
}

function normalized(Algebra, text) {
  var eq = Algebra.parseEquation(text);
  var a = eq.left.a - eq.right.a;
  var b = eq.left.b - eq.right.b;
  if (a < -1e-9 || (Math.abs(a) < 1e-9 && b < 0)) {
    a = -a;
    b = -b;
  }
  return { a: a, b: b };
}

function expectLine(compiled, symbols) {
  var sides = sideKeys(compiled);
  var a = null;
  if (sides && symbols.cells[sides.left] && symbols.cells[sides.right]) {
    var left = parseTerm(symbols.cells[sides.left]);
    var right = parseTerm(symbols.cells[sides.right]);
    if (left && right && left.kind === "expr" && right.kind === "expr") a = left.coeff + right.coeff;
  }
  return { a: a, b: knownSum(compiled) - Number(compiled.population) };
}

function lineMatches(got, expect) {
  if (!got || Math.abs(got.a) < 1e-9) return false;
  if (!same(got.b, expect.b)) return false;
  if (expect.a == null) return true;
  return same(got.a, expect.a);
}

function looksLikeValues(compiled, typed) {
  var values = (compiled.rows || []).map(function (row) { return String(row.num); });
  var parts = String(typed || "").replace(/\s+/g, "").split(/[=+]/);
  var addends = [];
  parts.forEach(function (part) {
    if (!part || /x/i.test(part)) return;
    if (/^-?\d+(?:\.\d+)?$/.test(part)) addends.push(part.replace(/^-/, ""));
  });
  var distinctive = values.filter(function (value) {
    return !(compiled.rows || []).some(function (row) { return !row.missing && String(row.freq) === value; });
  });
  if (distinctive.length < 2) return false;
  var seen = distinctive.every(function (value) { return addends.indexOf(value) >= 0; });
  var usedKnown = (compiled.rows || []).some(function (row) {
    return !row.missing && values.indexOf(String(row.freq)) < 0 && addends.indexOf(String(row.freq)) >= 0;
  });
  return seen && !usedKnown;
}

function omittedFreq(compiled, got, expect) {
  if (expect.a != null && !same(got.a, expect.a)) return null;
  var missing = expect.b - got.b;
  var found = null;
  (compiled.rows || []).forEach(function (row) {
    if (!row.missing && same(row.freq, missing)) found = row.freq;
  });
  return found;
}

function totalOnWrongSide(compiled, got, expect) {
  if (expect.a != null && !same(got.a, expect.a)) return false;
  var wrong = knownSum(compiled) + Number(compiled.population);
  return same(got.b, wrong) || same(got.b, -wrong);
}

function formatNumber(n) {
  if (same(n, Math.round(n))) return String(Math.round(n));
  return String(Math.round(n * 1000) / 1000);
}

function inferCells(compiled, coeffSum) {
  var sides = sideKeys(compiled);
  if (!sides || !coeffSum) return null;
  var parts = sides.parts;
  var left = coeffSum * Number(parts[0]) / (Number(parts[0]) + Number(parts[1]));
  var right = coeffSum * Number(parts[1]) / (Number(parts[0]) + Number(parts[1]));
  var cells = {};
  cells[sides.left] = formatCoeff(left);
  cells[sides.right] = formatCoeff(right);
  return cells;
}

function buildEquation(compiled, symbols) {
  var terms = [];
  (compiled.ordered || compiled.rows || []).forEach(function (row) {
    if (row.missing) {
      if (symbols.cells[row.key]) terms.push(symbols.cells[row.key]);
      return;
    }
    if (row.freq != null) terms.push(formatNumber(row.freq));
  });
  return terms.join("+") + "=" + formatNumber(compiled.population);
}

function partnerText(compiled, symbols) {
  var sides = sideKeys(compiled);
  if (!sides) return "";
  var left = symbols.cells[sides.left] ? parseTerm(symbols.cells[sides.left]) : null;
  var right = symbols.cells[sides.right] ? parseTerm(symbols.cells[sides.right]) : null;
  var parts = sides.parts;
  if (left && left.kind === "expr" && !right) return formatCoeff(left.coeff * Number(parts[1]) / Number(parts[0]));
  if (right && right.kind === "expr" && !left) return formatCoeff(right.coeff * Number(parts[0]) / Number(parts[1]));
  return "";
}

function pairError(compiled, symbols) {
  var sides = sideKeys(compiled);
  if (!sides) return "";
  var left = parseTerm(symbols.cells[sides.left] || "");
  var right = parseTerm(symbols.cells[sides.right] || "");
  if (!left || !right || left.kind !== "expr" || right.kind !== "expr") return "";
  if (holds(left.coeff, right.coeff, sides.parts)) return "";
  if (inverted(left.coeff, right.coeff, sides.parts)) return "היחס בין השכיחויות הפוך. בדקו איזו קבוצה גדולה יותר לפי היחס שנתון.";
  if (same(left.coeff, right.coeff)) return "סימנתם את שתי הכמויות באותו ביטוי, אבל היחס ביניהן אינו 1:1.";
  return "הכפלתם ביחס שאינו מתאים לקשר שנתון בין שתי הקבוצות.";
}

function complete(compiled, symbols) {
  var open = openRows(compiled);
  if (!open.length) return false;
  return open.every(function (row) {
    return symbols.resolved && symbols.resolved[row.key] != null && same(symbols.resolved[row.key], trueFreqs(compiled)[row.key]);
  });
}

function sanitize(engine, compiled, raw) {
  var symbols = { cells: {}, equation: "", eqCurrent: "", value: null, resolved: {} };
  raw = raw || {};
  var Algebra = algebra(engine);
  var truth = trueFreqs(compiled);
  openRows(compiled).forEach(function (row) {
    var term = parseTerm(raw.cells && raw.cells[row.key]);
    if (term && term.kind === "expr") symbols.cells[row.key] = term.text;
  });
  if (pairError(compiled, symbols)) {
    var sides = sideKeys(compiled);
    if (sides && symbols.cells[sides.left] && symbols.cells[sides.right]) delete symbols.cells[sides.right];
  }
  if (Algebra && raw.equation) {
    try {
      var got = normalized(Algebra, raw.equation);
      if (lineMatches(got, expectLine(compiled, symbols))) {
        symbols.equation = String(raw.equation);
        symbols.eqCurrent = raw.eqCurrent ? String(raw.eqCurrent) : symbols.equation;
      }
    } catch (err) {}
  }
  if (Algebra && symbols.eqCurrent && raw.value != null && raw.value !== "") {
    try {
      var current = Algebra.parseEquation(symbols.eqCurrent);
      var sol = Algebra.solutionOf(current);
      if (sol != null && same(sol, raw.value) && (Algebra.isSolved(current) || Algebra.isSolvedText(symbols.eqCurrent))) {
        symbols.value = Number(raw.value);
      }
    } catch (err2) {}
  }
  openRows(compiled).forEach(function (row) {
    if (raw.resolved && raw.resolved[row.key] != null && same(raw.resolved[row.key], truth[row.key])) {
      symbols.resolved[row.key] = truth[row.key];
    }
  });
  return symbols;
}

function apply(compiled, symbols) {
  symbols = symbols || {};
  var resolved = symbols.resolved || {};
  (compiled.rows || []).forEach(function (row) {
    if (row.missing && resolved[row.key] != null) row.freq = Number(resolved[row.key]);
  });
}

function emptySymbols() {
  return { cells: {}, equation: "", eqCurrent: "", value: null, resolved: {} };
}

function checkCell(compiled, task, symbols, value, typed) {
  var row = null;
  (compiled.rows || []).some(function (item) {
    if (item.key === keyOf(value) || String(item.value) === String(value)) {
      row = item;
      return true;
    }
    return false;
  });
  if (!row || !row.missing) return { ok: false, message: "התא הזה כבר ידוע." };
  var term = parseTerm(typed);
  if (!term) return { ok: false, message: "אפשר לסמן את השכיחות החסרה בנעלם, למשל x או ביטוי ב־x, או לרשום את המספר אם הוא כבר ידוע." };
  var truth = trueFreqs(compiled);
  var next = clone(symbols);
  if (term.kind === "number") {
    if (same(term.value, Number(row.num)) && !same(term.value, truth[row.key])) {
      return { ok: false, message: "במשוואה ובתאים צריך שכיחויות, לא את ערכי המשתנה." };
    }
    var other = null;
    openRows(compiled).forEach(function (item) {
      if (item.key !== row.key && same(term.value, truth[item.key])) other = item;
    });
    if (!same(term.value, truth[row.key]) && other) {
      return { ok: false, message: "היחס בין השכיחויות הפוך. בדקו איזו קבוצה גדולה יותר לפי היחס שנתון." };
    }
    if (!same(term.value, truth[row.key])) {
      if (symbols.value != null && symbols.cells[row.key]) {
        var own = parseTerm(symbols.cells[row.key]);
        if (own && own.kind === "expr" && !same(own.coeff * symbols.value, term.value)) {
          return { ok: false, message: "הפתרון של x נכון, אבל ההצבה בביטוי אינה נכונה." };
        }
      }
      return { ok: false, message: "עוד לא. בדקו שוב את השכיחות." };
    }
    next.resolved[row.key] = truth[row.key];
    if (String(task.value) === String(row.value) || keyOf(task.value) === row.key) {
      Object.keys(truth).forEach(function (id) { next.resolved[id] = truth[id]; });
    }
    return {
      ok: true,
      done: complete(compiled, next),
      symbols: next,
      shows: [formatNumber(truth[row.key])],
      message: complete(compiled, next) ? "" : "אפשר להמשיך.",
    };
  }
  if (symbols.value != null && !same(term.coeff * symbols.value, truth[row.key])) {
    return { ok: false, message: "הפתרון של x נכון, אבל ההצבה בביטוי אינה נכונה." };
  }
  next.cells[row.key] = term.text;
  var bad = pairError(compiled, next);
  if (bad) return { ok: false, message: bad };
  if (symbols.value != null && same(term.coeff * symbols.value, truth[row.key])) {
    next.resolved[row.key] = truth[row.key];
  }
  return {
    ok: true,
    done: complete(compiled, next),
    symbols: next,
    shows: [term.text],
    message: complete(compiled, next) ? "" : "אפשר להמשיך.",
  };
}

function acceptAsked(compiled, task, symbols, number) {
  var truth = trueFreqs(compiled);
  var asked = truth[keyOf(task.value)];
  if (asked == null || !same(number, asked)) return null;
  var next = clone(symbols);
  Object.keys(truth).forEach(function (id) { next.resolved[id] = truth[id]; });
  return {
    ok: true,
    done: true,
    symbols: next,
    shows: [formatNumber(asked)],
    message: "",
  };
}

function startEquation(engine, compiled, symbols, typed) {
  var Algebra = algebra(engine);
  if (!Algebra) return { ok: false, message: "עוד לא." };
  if (looksLikeValues(compiled, typed)) {
    return { ok: false, message: "במשוואה צריך לחבר שכיחויות, לא את ערכי המשתנה." };
  }
  var sides = sideKeys(compiled);
  var marked = sides ? [symbols.cells[sides.left], symbols.cells[sides.right]].filter(Boolean).length : 0;
  if (marked === 1) {
    return { ok: false, message: "קודם בטאו את הכמות השנייה באמצעות אותו נעלם, לפי היחס שנתון." };
  }
  var expect = expectLine(compiled, symbols);
  var got;
  try {
    got = normalized(Algebra, typed);
  } catch (err) {
    return { ok: false, message: err.message || "המשוואה לא ניתנת לקריאה." };
  }
  if (!lineMatches(got, expect)) {
    if (omittedFreq(compiled, got, expect) != null) {
      return { ok: false, message: "חסרה אחת הקבוצות בסכום השכיחויות." };
    }
    if (totalOnWrongSide(compiled, got, expect)) {
      return { ok: false, message: "מספר המשפחות הכולל צריך להיות שווה לסכום השכיחויות, לא להתווסף אליו." };
    }
    if (expect.a != null && !same(got.a, expect.a) && same(got.b, expect.b)) {
      return { ok: false, message: "המשוואה צריכה להשתמש בביטויים שסימנתם בטבלה." };
    }
    return { ok: false, message: "המשוואה צריכה לומר שסכום כל השכיחויות שווה למספר הכולל." };
  }
  var next = clone(symbols);
  if (expect.a == null) {
    var inferred = inferCells(compiled, got.a);
    if (inferred) next.cells = inferred;
    next.equation = buildEquation(compiled, next);
  } else {
    next.equation = String(typed);
  }
  next.eqCurrent = String(typed);
  return {
    ok: true,
    done: false,
    symbols: next,
    shows: [next.eqCurrent],
    message: "אפשר להמשיך.",
  };
}

function continueEquation(engine, symbols, typed) {
  if (symbols.value != null) {
    return { ok: false, message: "x כבר נמצא. הציבו אותו בביטויים שבטבלה." };
  }
  var Algebra = algebra(engine);
  if (!Algebra) return { ok: false, message: "עוד לא." };
  var previous = symbols.eqCurrent || symbols.equation;
  var result;
  try {
    result = Algebra.checkStep(previous, typed);
  } catch (err) {
    return { ok: false, message: err.message || "עוד לא." };
  }
  if (!result || !result.ok) return { ok: false, message: (result && result.message) || "עוד לא." };
  var next = clone(symbols);
  next.eqCurrent = String(typed);
  if (result.solved) {
    try {
      next.value = Algebra.solutionOf(Algebra.parseEquation(typed));
    } catch (err2) {}
  }
  return {
    ok: true,
    done: false,
    symbols: next,
    shows: [String(typed)],
    message: result.message || "אפשר להמשיך.",
  };
}

function check(engine, compiled, task, typed, progress, fill) {
  var symbols = clone(progress && progress.symbols);
  if (fill && fill.value != null && String(fill.value) !== "") {
    return checkCell(compiled, task, symbols, fill.value, fill.typed);
  }
  var text = String(typed || "").trim();
  if (!text) return { ok: false, message: "סמנו שכיחות חסרה בנעלם, או כתבו משוואה מסכום השכיחויות." };
  if (symbols.value == null && /x/i.test(text) && (text.indexOf("/") >= 0 || text.indexOf("%") >= 0)) {
    return { ok: false, message: "קודם צריך למצוא את השכיחות עצמה." };
  }
  if (/^-?\d+(?:\.\d+)?$/.test(text.replace(/\s+/g, ""))) {
    var asked = acceptAsked(compiled, task, symbols, Number(text));
    if (asked) return asked;
  }
  if (text.indexOf("=") >= 0) {
    if (symbols.equation) return continueEquation(engine, symbols, text);
    return startEquation(engine, compiled, symbols, text);
  }
  if (symbols.value != null) return { ok: false, message: "הציבו את ערך הנעלם בתאים החסרים." };
  if (symbols.equation) return { ok: false, message: "המשיכו לפתור את המשוואה." };
  var marked = Object.keys(symbols.cells).length;
  if (!marked) return { ok: false, message: "בחרו שכיחות חסרה וסמנו אותה בנעלם בתוך הטבלה." };
  if (marked === 1) return { ok: false, message: "בטאו את הכמות השנייה באמצעות אותו נעלם, לפי היחס שנתון." };
  return { ok: false, message: "כתבו משוואה: סכום כל השכיחויות שווה למספר הכולל." };
}

function hint(engine, compiled, task, progress) {
  var symbols = clone(progress && progress.symbols);
  if (symbols.value != null && !complete(compiled, symbols)) {
    return "הציבו את ערך הנעלם בביטויים שבטבלה, כדי למצוא את השכיחויות החסרות.";
  }
  if (symbols.equation && symbols.value == null) {
    var Teach = teach(engine);
    if (Teach && typeof Teach.nextAction === "function") {
      var act = Teach.nextAction(symbols.eqCurrent || symbols.equation);
      if (act && act.hint) return String(act.hint);
    }
    return "המשיכו לפתור את המשוואה שכתבתם.";
  }
  var count = Object.keys(symbols.cells).length;
  if (!count) return "בחרו אחת מהשכיחויות החסרות וסמנו אותה בנעלם.";
  if (count === 1) return "השתמשו ביחס הנתון כדי לבטא את הכמות השנייה באמצעות אותו נעלם.";
  return "סכום מספר המשפחות בכל הקבוצות שווה למספר המשפחות הכולל. כתבו מזה משוואה.";
}

function step(engine, compiled, task, progress) {
  var symbols = clone(progress && progress.symbols);
  var Algebra = algebra(engine);
  var Teach = teach(engine);
  var sides = sideKeys(compiled);
  if (!sides) return null;
  if (!symbols.cells[sides.left] && !symbols.cells[sides.right]) {
    symbols.cells[sides.left] = formatCoeff(Number(sides.parts[0]));
    return { done: false, symbols: symbols, shows: [symbols.cells[sides.left]] };
  }
  if (!symbols.cells[sides.left] || !symbols.cells[sides.right]) {
    var partner = partnerText(compiled, symbols);
    if (!partner) return null;
    var missingKey = symbols.cells[sides.left] ? sides.right : sides.left;
    symbols.cells[missingKey] = partner;
    return { done: false, symbols: symbols, shows: [partner] };
  }
  if (pairError(compiled, symbols)) return null;
  if (!symbols.equation) {
    var eq = buildEquation(compiled, symbols);
    symbols.equation = eq;
    symbols.eqCurrent = eq;
    return { done: false, symbols: symbols, shows: [eq] };
  }
  if (symbols.value == null) {
    var current = symbols.eqCurrent || symbols.equation;
    if (Algebra && Algebra.isSolvedText(current)) {
      try { symbols.value = Algebra.solutionOf(Algebra.parseEquation(current)); } catch (err) {}
    } else if (Teach && typeof Teach.nextAction === "function") {
      var act = Teach.nextAction(current);
      if (!act || act.done || !act.eq) return null;
      symbols.eqCurrent = String(act.eq);
      if (Algebra) {
        try {
          var checked = Algebra.checkStep(current, act.eq);
          if (checked && checked.solved) symbols.value = Algebra.solutionOf(Algebra.parseEquation(act.eq));
        } catch (err2) {}
      }
      return { done: false, symbols: symbols, shows: [String(act.eq)] };
    } else return null;
  }
  var truth = trueFreqs(compiled);
  var pending = null;
  (compiled.ordered || compiled.rows || []).some(function (row) {
    if (!row.missing || (symbols.resolved && symbols.resolved[row.key] != null)) return false;
    pending = row;
    return true;
  });
  if (!pending) return null;
  var expr = parseTerm(symbols.cells[pending.key] || "");
  var value = expr && expr.kind === "expr" && symbols.value != null ? expr.coeff * symbols.value : truth[pending.key];
  if (!same(value, truth[pending.key])) value = truth[pending.key];
  symbols.resolved[pending.key] = truth[pending.key];
  return {
    done: complete(compiled, symbols),
    symbols: symbols,
    shows: [formatNumber(value)],
  };
}

module.exports = {
  sanitize: sanitize,
  apply: apply,
  check: check,
  hint: hint,
  step: step,
  complete: complete,
  emptySymbols: emptySymbols,
  trueFreqs: trueFreqs,
  parseTerm: parseTerm,
};
