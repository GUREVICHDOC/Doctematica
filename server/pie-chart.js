"use strict";

// דיאגרמת עיגול היא התפלגות של אחוזים: סכום הגזרות הוא 100.
// משוואה עם נעלם נמסרת למנוע המשוואות הקיים. כן/לא נשאר מנגנון הבחירה הקיים.

function near(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-6;
}

function formatNum(n) {
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  return String(Math.round(n * 1000) / 1000);
}

function coeffOf(expr) {
  var text = String(expr || "").replace(/\s+/g, "");
  if (text === "x" || text === "X") return 1;
  var match = /^(\d+(?:\.\d+)?)x$/i.exec(text);
  return match ? Number(match[1]) : null;
}

function compile(ex) {
  var source = ex.pie || {};
  var sectors = (source.sectors || []).map(function (sector) {
    var item = { label: String(sector.label || "") };
    if (sector.expr) {
      item.expr = String(sector.expr).replace(/\s+/g, "");
      item.coeff = coeffOf(item.expr);
    } else {
      item.percent = Number(sector.percent);
    }
    return item;
  });
  var known = 0;
  var coeff = 0;
  sectors.forEach(function (sector) {
    if (sector.expr) coeff += sector.coeff || 0;
    else known += sector.percent;
  });
  var x = coeff ? (100 - known) / coeff : null;
  sectors.forEach(function (sector) {
    sector.truth = sector.expr ? (sector.coeff || 0) * x : sector.percent;
  });
  return {
    sectors: sectors,
    knownSum: known,
    coeffSum: coeff,
    x: x,
    whole: 100,
  };
}

function byLabel(compiled, label) {
  var i;
  for (i = 0; i < compiled.sectors.length; i++) {
    if (compiled.sectors[i].label === label) return compiled.sectors[i];
  }
  return null;
}

function algebraOf(engine) {
  return engine && engine.DoctematicaAlgebra;
}

function teachOf(engine) {
  return engine && engine.DoctematicaTeach;
}

function emptyPie() {
  return {
    x: null,
    equation: "",
    eqCurrent: "",
    knownSummed: false,
    remainder: null,
    percents: {},
    groups: {},
    summing: {},
    gaps: {},
    complements: {},
    verdicts: {},
    picks: {},
  };
}

function valueOf(compiled, pie, sector) {
  if (!sector) return null;
  if (!sector.expr) return sector.percent;
  if (pie.percents[sector.label] != null) return pie.percents[sector.label];
  if (pie.x != null && sector.coeff != null) return sector.coeff * pie.x;
  return null;
}

function knownList(compiled) {
  return compiled.sectors.filter(function (sector) { return !sector.expr; });
}

function exprSectors(compiled) {
  return compiled.sectors.filter(function (sector) { return sector.expr; });
}

function clean(text) {
  return String(text || "")
    .replace(/[−–—]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/％/g, "%")
    .replace(/\s+/g, " ")
    .trim();
}

function mathish(text) {
  return clean(text).replace(/%/g, "").replace(/\s+/g, "");
}

function parseYesNo(text) {
  var word = clean(text);
  if (/^כן(?=$|\s|[.!?])/.test(word)) return "כן";
  if (/^לא(?=$|\s|[.!?])/.test(word)) return "לא";
  return null;
}

function loneNumber(text) {
  var source = mathish(text);
  if (!/^-?\d+(?:\.\d+)?$/.test(source)) return null;
  return Number(source);
}

function bagKey(nums) {
  return nums.map(function (n) { return formatNum(n); }).sort().join(",");
}

function parseAddends(text) {
  var source = mathish(text);
  var eq = source.split("=");
  if (eq.length > 2) return null;
  var body = eq[0];
  if (body.indexOf("(") >= 0 || body.indexOf("*") >= 0 || body.indexOf("/") >= 0) return null;
  if (!/^[\d+xX.-]+$/.test(body)) return null;
  var parts = body.split("+").filter(function (part) { return part !== ""; });
  if (!parts.length) return null;
  var nums = [];
  var coeff = 0;
  var i;
  for (i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (part === "x" || part === "X") coeff += 1;
    else if (/^\d+(?:\.\d+)?x$/i.test(part)) coeff += Number(part.replace(/x$/i, ""));
    else if (/^-?\d+(?:\.\d+)?$/.test(part)) nums.push(Number(part));
    else return null;
  }
  var equals = eq.length === 2 ? Number(eq[1]) : null;
  if (eq.length === 2 && !/^-?\d+(?:\.\d+)?$/.test(eq[1])) return null;
  return { nums: nums, coeff: coeff, equals: equals, raw: body };
}

function sumNums(nums) {
  var total = 0;
  var i;
  for (i = 0; i < nums.length; i++) total += nums[i];
  return total;
}

function sameBag(a, b) {
  return bagKey(a) === bagKey(b);
}

function subsetBag(small, big) {
  var rest = big.slice();
  var i;
  var j;
  for (i = 0; i < small.length; i++) {
    var at = -1;
    for (j = 0; j < rest.length; j++) {
      if (near(rest[j], small[i])) { at = j; break; }
    }
    if (at < 0) return false;
    rest.splice(at, 1);
  }
  return true;
}

function eqParts(Algebra, text) {
  try {
    var parsed = Algebra.parseEquation(text);
    return {
      parsed: parsed,
      a: parsed.left.a - parsed.right.a,
      b: parsed.left.b - parsed.right.b,
      solved: !!(Algebra.isSolvedText && Algebra.isSolvedText(text)),
      value: Algebra.isSolvedText && Algebra.isSolvedText(text) ? Algebra.solutionOf(parsed) : null,
    };
  } catch (err) {
    return { error: err.message || "עוד לא." };
  }
}

function equivalentText(Algebra, left, right) {
  var a = eqParts(Algebra, left);
  var b = eqParts(Algebra, right);
  if (a.error || b.error || !a.parsed || !b.parsed) return false;
  return Algebra.equivalent(a.parsed, b.parsed);
}

function canonicalEq(compiled) {
  var bits = compiled.sectors.map(function (sector) {
    return sector.expr || formatNum(sector.percent);
  });
  return bits.join("+") + "=100";
}

function noteX(compiled, pie, value) {
  if (value == null || !near(value, compiled.x)) return false;
  pie.x = compiled.x;
  return true;
}

function lockSolvedX(compiled, pie) {
  if (!noteX(compiled, pie, compiled.x)) return false;
  exprSectors(compiled).forEach(function (sector) {
    if (sector.coeff === 1) pie.percents[sector.label] = sector.truth;
  });
  return true;
}

function noteSector(compiled, pie, label, value) {
  var sector = byLabel(compiled, label);
  if (!sector || !near(value, sector.truth)) return false;
  pie.percents[label] = sector.truth;
  if (sector.expr && sector.coeff) noteX(compiled, pie, sector.truth / sector.coeff);
  return true;
}

function syncDone(ex, compiled, progress) {
  if (!compiled) return;
  var pie = progress.pie;
  (ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) {
      var ready = false;
      if (task.kind === "sectorPercent") ready = pie.percents[task.sector] != null && near(pie.percents[task.sector], byLabel(compiled, task.sector).truth);
      if (task.kind === "majority") ready = pie.verdicts[task.id] === (groupTruth(compiled, task.sectors) > 50 ? "כן" : "לא");
      if (task.kind === "pickSector") ready = !!pie.picks[task.id] && pickFits(compiled, progress, task, pie.picks[task.id]);
      if (ready) progress.done[task.id] = true;
      else delete progress.done[task.id];
    });
  });
}

function groupTruth(compiled, labels) {
  var total = 0;
  labels.forEach(function (label) {
    total += byLabel(compiled, label).truth;
  });
  return total;
}

function groupValues(compiled, pie, labels) {
  var values = [];
  var i;
  for (i = 0; i < labels.length; i++) {
    var value = valueOf(compiled, pie, byLabel(compiled, labels[i]));
    if (value == null) return null;
    values.push(value);
  }
  return values;
}

function others(compiled, labels) {
  var skip = {};
  labels.forEach(function (label) { skip[label] = true; });
  return compiled.sectors.filter(function (sector) { return !skip[sector.label]; }).map(function (sector) { return sector.label; });
}

function candidates(compiled, base) {
  return others(compiled, base);
}

function pickFits(compiled, progress, task, label) {
  if (baseHas(task, label)) return false;
  var sector = byLabel(compiled, label);
  if (!sector) return false;
  var base = groupValues(compiled, progress.pie, task.base);
  if (!base) return false;
  return sumNums(base) + sector.truth > 50;
}

function baseHas(task, label) {
  return (task.base || []).indexOf(label) >= 0;
}

function winningLabels(compiled, progress, task) {
  return candidates(compiled, task.base).filter(function (label) {
    return pickFits(compiled, progress, task, label);
  });
}

function restoreTasks(ex, compiled, raw, pie) {
  (ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) {
      var labels = task.kind === "majority" ? task.sectors : task.base;
      if ((task.kind === "majority" || task.kind === "pickSector") && labels) {
        var truth = groupTruth(compiled, labels);
        if (raw.groups && near(raw.groups[task.id], truth)) pie.groups[task.id] = truth;
        if (raw.summing && raw.summing[task.id]) pie.summing[task.id] = true;
        if (raw.gaps && raw.gaps[task.id]) pie.gaps[task.id] = true;
      }
      if (task.kind === "majority") {
        var word = groupTruth(compiled, task.sectors) > 50 ? "כן" : "לא";
        if (raw.verdicts && raw.verdicts[task.id] === word) pie.verdicts[task.id] = word;
        var other = 100 - groupTruth(compiled, task.sectors);
        if (raw.complements && near(raw.complements[task.id], other)) pie.complements[task.id] = other;
      }
      if (task.kind === "pickSector" && raw.picks && raw.picks[task.id] && pickFits(compiled, { pie: pie }, task, raw.picks[task.id])) {
        pie.picks[task.id] = raw.picks[task.id];
      }
    });
  });
}

function sanitize(engine, compiled, raw, ex) {
  var pie = emptyPie();
  raw = raw && raw.pie ? raw.pie : {};
  var Algebra = algebraOf(engine);
  if (raw.x != null && near(raw.x, compiled.x)) noteX(compiled, pie, compiled.x);
  if (Algebra && raw.equation && equivalentText(Algebra, String(raw.equation), canonicalEq(compiled))) {
    pie.equation = String(raw.equation);
    pie.eqCurrent = raw.eqCurrent && equivalentText(Algebra, String(raw.eqCurrent), canonicalEq(compiled))
      ? String(raw.eqCurrent)
      : pie.equation;
  }
  if (raw.knownSummed) pie.knownSummed = true;
  if (raw.remainder != null && near(raw.remainder, 100 - compiled.knownSum)) pie.remainder = 100 - compiled.knownSum;
  Object.keys(raw.percents || {}).forEach(function (label) {
    noteSector(compiled, pie, label, raw.percents[label]);
  });
  if (ex) restoreTasks(ex, compiled, raw, pie);
  return pie;
}

function freshProgress(engine, compiled, raw, ex) {
  return { done: {}, pie: sanitize(engine, compiled, raw || {}, ex) };
}

function currentPart(ex, progress) {
  var parts = ex.parts || [];
  var i;
  var t;
  for (i = 0; i < parts.length; i++) {
    var tasks = parts[i].tasks || [];
    for (t = 0; t < tasks.length; t++) {
      if (!progress.done[tasks[t].id]) return { part: parts[i], tasks: tasks };
    }
  }
  return null;
}

function openTasks(part, progress) {
  return (part.tasks || []).filter(function (task) { return !progress.done[task.id]; });
}

function revealedPie(ex, progress) {
  var compiled = compile(ex);
  var symbolic = compiled.sectors.some(function (sector) { return sector.expr; });
  if (!symbolic || !progress.pie || progress.pie.x == null) return null;
  return {
    sectors: compiled.sectors.map(function (sector) {
      var percent = sector.expr ? sector.coeff * progress.pie.x : sector.percent;
      return {
        label: sector.label,
        text: formatNum(percent) + "%",
        angle: percent / 100 * 360,
      };
    }),
  };
}

function viewOf(ex, progress) {
  var current = currentPart(ex, progress);
  if (!current) {
    var solved = { part: null, ask: "", input: "text", solved: true };
    var donePie = revealedPie(ex, progress);
    if (donePie) solved.pie = donePie;
    return solved;
  }
  var open = openTasks(current.part, progress);
  var task = open[0];
  var input = task && task.kind === "majority" ? "yesno" : "text";
  var view = {
    part: { label: current.part.label || "", text: current.part.text || "" },
    ask: current.part.text || "",
    input: input,
    solved: false,
  };
  if (task && task.kind === "majority" && progress.pie.groups[task.id] != null) view.entry = "choice";
  var revealed = revealedPie(ex, progress);
  if (revealed) view.pie = revealed;
  return view;
}

function respond(ex, compiled, progress, extra) {
  extra = extra || {};
  syncDone(ex, compiled, progress);
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

function hasMajority(percent) {
  return Number(percent) > 50;
}

function fullEquationLine(compiled) {
  return compiled.sectors.map(function (sector) {
    return sector.expr || formatNum(sector.percent);
  }).join(" + ") + " = 100";
}

function exprJoin(compiled) {
  return exprSectors(compiled).map(function (sector) { return sector.expr; }).join(" + ");
}

function diagnoseEquation(Algebra, compiled, text) {
  var info = eqParts(Algebra, text);
  if (info.error) {
    if (info.error.indexOf("שווה") >= 0) return info.error;
    return "";
  }
  function matches(equation) {
    return equivalentText(Algebra, text, equation);
  }
  if (matches(formatNum(compiled.knownSum) + "+" + formatNum(compiled.coeffSum) + "x=360")) {
    return "הנתונים באחוזים, ולכן סכום הגזרות הוא 100 ולא 360.";
  }
  if (info.solved && near(info.value, compiled.knownSum)) {
    return "זה סכום האחוזים הידועים. החלק החסר הוא מה שנשאר עד 100.";
  }
  if (compiled.coeffSum > 1 && info.solved && near(info.value, 100 - compiled.knownSum)) {
    return "זה הסכום של כל הביטויים עם הנעלם יחד, לא הערך של x.";
  }
  var doubled = false;
  var forgot = false;
  knownList(compiled).forEach(function (sector) {
    var forgotEq = formatNum(compiled.knownSum - sector.percent) + "+" + formatNum(compiled.coeffSum) + "x=100";
    var extraEq = formatNum(compiled.knownSum + sector.percent) + "+" + formatNum(compiled.coeffSum) + "x=100";
    if (matches(forgotEq)) forgot = true;
    if (matches(extraEq)) doubled = true;
  });
  if (forgot) return "חסרה גזרה במשוואה.";
  if (doubled) return "ספרתם אותה גזרה פעמיים.";
  if (compiled.coeffSum > 1 && matches(formatNum(compiled.knownSum + 2) + "+" + formatNum(compiled.coeffSum - 1) + "x=100")) {
    return "2x הוא פעמיים x, לא x ועוד 2.";
  }
  if (compiled.coeffSum > 1 && matches(formatNum(compiled.knownSum) + "+" + formatNum(compiled.coeffSum - 1) + "x=100")) {
    return "2x אינו אותו דבר כמו x.";
  }
  if (info.solved && compiled.x != null && near(info.value, compiled.x + 2) && compiled.coeffSum > 1) {
    return "2x הוא פעמיים x, לא x ועוד 2.";
  }
  return "סכום כל הגזרות הוא 100%.";
}

function diagnosePercent(compiled, sector, value) {
  if (value != null && near(value, sector.truth / 100)) return "כתבו את האחוז, לא שבר עשרוני.";
  if (value != null && near(value, compiled.knownSum)) return "זה סכום האחוזים הידועים. החלק החסר הוא מה שנשאר עד 100.";
  if (sector.expr && sector.coeff > 1 && compiled.x != null && near(value, compiled.x)) return "זה הערך של x. כאן הביטוי הוא " + sector.expr + ".";
  if (sector.expr && sector.coeff > 1 && compiled.x != null && near(value, compiled.x + 2)) return "2x הוא פעמיים x, לא x ועוד 2.";
  if (compiled.coeffSum > 1 && near(value, 100 - compiled.knownSum)) return "זה הסכום של כל הביטויים עם הנעלם יחד, לא הערך של x.";
  if (value != null && near(value, sector.truth / 100 * 360)) return "השאלה מבקשת אחוז, לא זווית במעלות.";
  return "עוד לא.";
}

function adoptEquation(pie, text) {
  if (!pie.equation) pie.equation = text;
  pie.eqCurrent = text;
}

function finishSolved(compiled, pie, info) {
  if (!info || info.value == null || !near(info.value, compiled.x)) return false;
  return lockSolvedX(compiled, pie);
}

function checkEquation(engine, compiled, progress, text) {
  var Algebra = algebraOf(engine);
  var Teach = teachOf(engine);
  if (!Algebra) return { ok: false, message: "עוד לא." };
  var source = mathish(text);
  var info = eqParts(Algebra, source);
  if (info.error) return { ok: false, message: diagnoseEquation(Algebra, compiled, source) || info.error };
  var canonical = canonicalEq(compiled);
  var pie = progress.pie;
  if (!equivalentText(Algebra, source, canonical)) {
    return { ok: false, message: diagnoseEquation(Algebra, compiled, source) };
  }
  if (pie.eqCurrent && Teach && Algebra.checkStep) {
    var stepped = null;
    try { stepped = Algebra.checkStep(mathish(pie.eqCurrent), source); } catch (err) { stepped = null; }
    if (stepped && stepped.ok === false && !equivalentText(Algebra, source, canonical)) {
      return { ok: false, message: stepped.message || "עוד לא." };
    }
  }
  adoptEquation(pie, clean(text).replace(/%/g, ""));
  if (info.solved && finishSolved(compiled, pie, info)) {
    return { ok: true, done: false, shows: [clean(text).replace(/%/g, "")], message: "אפשר להמשיך." };
  }
  if (info.solved && !near(info.value, compiled.x)) {
    return { ok: false, message: diagnosePercent(compiled, exprSectors(compiled)[0] || { truth: compiled.x, expr: "x", coeff: 1 }, info.value) };
  }
  return { ok: true, done: false, shows: [clean(text).replace(/%/g, "")], message: "אפשר להמשיך." };
}

function checkPlainSum(compiled, progress, text) {
  var parsed = parseAddends(text);
  if (!parsed || parsed.coeff) return null;
  var known = knownList(compiled).map(function (sector) { return sector.percent; });
  if (!sameBag(parsed.nums, known)) return null;
  if (parsed.equals != null && !near(parsed.equals, compiled.knownSum)) {
    return { ok: false, message: "בדקו שוב את סכום האחוזים הידועים." };
  }
  progress.pie.knownSummed = true;
  var show = knownList(compiled).map(function (sector) { return formatNum(sector.percent); }).join(" + ");
  if (parsed.equals != null) show += " = " + formatNum(compiled.knownSum);
  return { ok: true, done: false, shows: [show], message: "אפשר להמשיך." };
}

function checkComplement(compiled, progress, text) {
  var source = mathish(text);
  var match = /^100-\(?(-?\d+(?:\.\d+)?(?:\+-?\d+(?:\.\d+)?)*)\)?(?:=(-?\d+(?:\.\d+)?))?$/.exec(source);
  if (!match) return null;
  var inner = match[1].split("+").map(Number);
  var known = knownList(compiled).map(function (sector) { return sector.percent; });
  var asTotal = inner.length === 1 && near(inner[0], compiled.knownSum);
  var asParts = sameBag(inner, known);
  if (!asTotal && !asParts) return null;
  var left = 100 - compiled.knownSum;
  if (match[2] != null && !near(Number(match[2]), left)) return { ok: false, message: "בדקו את החיסור מ־100." };
  progress.pie.knownSummed = true;
  progress.pie.remainder = left;
  if (compiled.coeffSum === 1) lockSolvedX(compiled, progress.pie);
  var show = "100 - " + formatNum(compiled.knownSum) + " = " + formatNum(left);
  return { ok: true, done: false, shows: [show], message: "אפשר להמשיך." };
}

function checkProduct(compiled, progress, sector, text) {
  if (!sector.expr || sector.coeff == null || sector.coeff === 1 || progress.pie.x == null) return null;
  var source = mathish(text);
  var expected = sector.truth;
  var factor = formatNum(sector.coeff);
  var known = formatNum(progress.pie.x);
  var forms = {};
  forms[factor + "*" + known] = true;
  forms[factor + "*" + known + "=" + formatNum(expected)] = true;
  forms[factor + "x"] = true;
  forms[factor + "x=" + formatNum(expected)] = true;
  forms["x*" + factor] = true;
  if (!forms[source]) return null;
  noteSector(compiled, progress.pie, sector.label, expected);
  return {
    ok: true,
    done: false,
    shows: [factor + "·" + known + " = " + formatNum(expected)],
    message: "אפשר להמשיך.",
  };
}

function labelsOf(text) {
  var source = clean(text).replace(/רשימה|מועמד/g, "");
  var found = source.match(/[א-ת]/g) || [];
  var unique = [];
  found.forEach(function (letter) {
    if (unique.indexOf(letter) < 0) unique.push(letter);
  });
  if (!unique.length || /[\d=xX]/.test(source)) return null;
  return unique;
}

function checkGroupSum(compiled, progress, task, labels, text) {
  var values = groupValues(compiled, progress.pie, labels);
  if (!values) return null;
  var parsed = parseAddends(text);
  if (!parsed || parsed.coeff) return null;
  if (!sameBag(parsed.nums, values)) return null;
  var total = sumNums(values);
  if (parsed.equals != null && !near(parsed.equals, total)) return { ok: false, message: "בדקו שוב את סכום האחוזים." };
  return { ok: true, total: total, show: values.map(formatNum).join(" + ") + (parsed.equals != null ? " = " + formatNum(total) : "") };
}

function groupMistake(compiled, progress, labels, nums) {
  var values = groupValues(compiled, progress.pie, labels);
  if (!values) return "";
  if (sameBag(nums, values)) return "";
  var truths = labels.map(function (label) { return byLabel(compiled, label).truth; });
  var swapped = truths.slice();
  var changed = false;
  exprSectors(compiled).forEach(function (sector) {
    if (labels.indexOf(sector.label) < 0 || !sector.coeff || sector.coeff === 1 || progress.pie.x == null) return;
    var at = swapped.indexOf(sector.truth);
    if (at >= 0 && nums.some(function (n) { return near(n, progress.pie.x); })) {
      swapped[at] = progress.pie.x;
      changed = true;
    }
  });
  if (changed && sameBag(nums, swapped)) return "השתמשתם בערך של x במקום בביטוי שמופיע בגזרה.";
  if (subsetBag(nums, values) && nums.length < values.length) return "חסרה רשימה מהגוש.";
  if (subsetBag(values, nums) && nums.length > values.length) return "הוספתם רשימה שאינה בגוש.";
  var complement = groupValues(compiled, progress.pie, others(compiled, labels));
  if (complement && sameBag(nums, complement)) return "זה הסכום של שאר הגזרות. אפשר להחסיר אותו מ־100 כדי למצוא את הגוש.";
  return "אלה אינן הרשימות של הגוש.";
}

function checkMajority(engine, compiled, progress, task, text) {
  var verdict = parseYesNo(text);
  var truth = groupTruth(compiled, task.sectors);
  var word = hasMajority(truth) ? "כן" : "לא";
  if (verdict) {
    if (verdict !== word) {
      if (near(truth, 50)) return { ok: false, message: "50% בדיוק אינו רוב. צריך יותר מ־50%." };
      if (verdict === "כן") return { ok: false, message: "הסכום אינו גדול מ־50%, ולכן אין רוב." };
      return { ok: false, message: "הסכום גדול מ־50%, ולכן יש רוב." };
    }
    progress.pie.verdicts[task.id] = word;
    if (progress.pie.groups[task.id] == null) progress.pie.groups[task.id] = truth;
    return { ok: true, done: true, shows: [word], message: "" };
  }
  var number = loneNumber(text);
  if (number != null && near(number, 100) && !near(truth, 100)) return { ok: false, message: "רוב הוא יותר מ־50%, לא מ־100%." };
  if (number != null && near(number, 50) && !near(truth, 50)) return { ok: false, message: "50% בדיוק אינו רוב. צריך יותר מ־50%." };
  if (number != null && near(number, 100 - truth)) {
    progress.pie.complements[task.id] = 100 - truth;
    return { ok: true, done: false, shows: [formatNum(100 - truth)], message: "אפשר להמשיך." };
  }
  var summed = checkGroupSum(compiled, progress, task, task.sectors, text);
  if (summed && summed.ok === false) return summed;
  if (summed) {
    progress.pie.groups[task.id] = summed.total;
    progress.pie.summing[task.id] = false;
    return { ok: true, done: false, shows: [summed.show], message: "אפשר להמשיך." };
  }
  var complement = checkGroupSum(compiled, progress, task, others(compiled, task.sectors), text);
  if (complement && complement.ok !== false) {
    progress.pie.complements[task.id] = complement.total;
    return { ok: true, done: false, shows: [complement.show], message: "אפשר להמשיך." };
  }
  var source = mathish(text);
  var fromComplement = /^100-(-?\d+(?:\.\d+)?)(?:=(-?\d+(?:\.\d+)?))?$/.exec(source);
  if (fromComplement && near(Number(fromComplement[1]), 100 - truth)) {
    if (fromComplement[2] != null && !near(Number(fromComplement[2]), truth)) return { ok: false, message: "בדקו את החיסור מ־100." };
    progress.pie.groups[task.id] = truth;
    var line = "100 - " + formatNum(100 - truth);
    if (fromComplement[2] != null) line += " = " + formatNum(truth);
    return { ok: true, done: false, shows: [line], message: "אפשר להמשיך." };
  }
  var parsed = parseAddends(text);
  if (parsed && !parsed.coeff) return { ok: false, message: groupMistake(compiled, progress, task.sectors, parsed.nums) };
  if (groupValues(compiled, progress.pie, task.sectors) == null) return checkShared(engine, compiled, progress, text);
  return { ok: false, message: "אפשר לחבר את אחוזי הגוש, או לענות כן או לא." };
}

function checkPick(compiled, progress, task, text) {
  var letters = labelsOf(text);
  if (letters && letters.length) {
    var i;
    for (i = 0; i < letters.length; i++) {
      if (baseHas(task, letters[i])) return { ok: false, message: "הרשימה הזו כבר בגוש." };
      if (!byLabel(compiled, letters[i])) return { ok: false, message: "בחרו רשימה מתוך הדיאגרמה." };
    }
    var good = letters.filter(function (label) { return pickFits(compiled, progress, task, label); });
    if (!good.length) {
      var base = sumNums(groupValues(compiled, progress.pie, task.base) || []);
      var exact = letters.some(function (label) {
        var sector = byLabel(compiled, label);
        return sector && near(base + sector.truth, 50);
      });
      if (exact) return { ok: false, message: "50% בדיוק אינו רוב. צריך יותר מ־50%." };
      return { ok: false, message: "הרשימה הזו אינה מביאה את הגוש ליותר מ־50%." };
    }
    progress.pie.picks[task.id] = good[0];
    return { ok: true, done: true, shows: [good.join(", ")], message: "" };
  }
  var number = loneNumber(text);
  var winners = winningLabels(compiled, progress, task);
  if (number != null && winners.some(function (label) { return near(byLabel(compiled, label).truth, number); })) {
    return { ok: false, message: "כתבו את אות הרשימה, לא את האחוז." };
  }
  var baseSum = checkGroupSum(compiled, progress, task, task.base, text);
  if (baseSum && baseSum.ok !== false) {
    progress.pie.groups[task.id] = baseSum.total;
    return { ok: true, done: false, shows: [baseSum.show], message: "אפשר להמשיך." };
  }
  var baseValues = groupValues(compiled, progress.pie, task.base);
  if (number != null && baseValues && near(number, 50 - sumNums(baseValues))) {
    progress.pie.gaps[task.id] = true;
    return { ok: true, done: false, shows: ["50 - " + formatNum(sumNums(baseValues)) + " = " + formatNum(number)], message: "אפשר להמשיך." };
  }
  var parsed = parseAddends(text);
  if (parsed && !parsed.coeff && baseValues) return { ok: false, message: groupMistake(compiled, progress, task.base, parsed.nums) };
  return { ok: false, message: "מצאו רשימה שאחוזה משלים את הגוש ליותר מ־50%." };
}

function checkSector(engine, compiled, progress, task, text) {
  var sector = byLabel(compiled, task.sector);
  var number = loneNumber(text);
  if (number != null) {
    if (near(number, sector.truth)) {
      noteSector(compiled, progress.pie, sector.label, sector.truth);
      return { ok: true, done: false, shows: [formatNum(sector.truth)], message: "אפשר להמשיך." };
    }
    return { ok: false, message: diagnosePercent(compiled, sector, number) };
  }
  var product = checkProduct(compiled, progress, sector, text);
  if (product) return product;
  if (mathish(text).indexOf("=") >= 0 || /x/i.test(mathish(text))) return checkEquation(engine, compiled, progress, text);
  var summed = checkPlainSum(compiled, progress, text);
  if (summed) return summed;
  var complement = checkComplement(compiled, progress, text);
  if (complement) return complement;
  return { ok: false, message: "אפשר לבנות משוואה שסכום הגזרות שלה הוא 100, או לכתוב את האחוז." };
}

function checkShared(engine, compiled, progress, text) {
  if (mathish(text).indexOf("=") >= 0 || /x/i.test(mathish(text))) return checkEquation(engine, compiled, progress, text);
  var summed = checkPlainSum(compiled, progress, text);
  if (summed) return summed;
  var complement = checkComplement(compiled, progress, text);
  if (complement) return complement;
  return null;
}

function checkTyped(engine, compiled, ex, typed, progress) {
  var current = currentPart(ex, progress);
  if (!current) {
    return respond(ex, compiled, progress, { status: "solved", message: "כל הסעיפים נכונים." });
  }
  syncDone(ex, compiled, progress);
  var open = openTasks(current.part, progress);
  var text = clean(typed);
  if (!text) return { ok: false, message: "עוד לא.", view: viewOf(ex, progress), progress: progress };
  var i;
  var hit = null;
  var task = null;
  for (i = 0; i < open.length; i++) {
    var result = null;
    if (open[i].kind === "majority") result = checkMajority(engine, compiled, progress, open[i], text);
    else if (open[i].kind === "pickSector") result = checkPick(compiled, progress, open[i], text);
    else result = checkSector(engine, compiled, progress, open[i], text);
    if (result && result.ok) { hit = result; task = open[i]; break; }
    if (result && result.message && !hit) hit = result;
  }
  if (!hit || !hit.ok) {
    return {
      ok: false,
      message: (hit && hit.message) || "עוד לא.",
      view: viewOf(ex, progress),
      progress: progress,
    };
  }
  syncDone(ex, compiled, progress);
  var doneNow = !openTasks(current.part, progress).length || (task && progress.done[task.id] && open.length === 1);
  var status = currentPart(ex, progress) ? (doneNow ? "task" : "step") : "solved";
  return respond(ex, compiled, progress, {
    status: status,
    message: hit.message || (status === "solved" ? "כל הסעיפים נכונים." : "אפשר להמשיך."),
    shows: hit.shows || [],
    part: current.part.label || "",
  });
}

function hintText(engine, compiled, ex, progress) {
  var current = currentPart(ex, progress);
  if (!current) return "כל הסעיפים נכונים.";
  var task = openTasks(current.part, progress)[0];
  var pie = progress.pie;
  if (task.kind === "majority") {
    if (groupValues(compiled, pie, task.sectors) == null) return missingHint(compiled, pie);
    if (pie.groups[task.id] == null && pie.complements[task.id] == null) return "חברו את האחוזים של הרשימות השייכות לגוש והשוו ל־50%.";
    if (pie.complements[task.id] != null && pie.groups[task.id] == null) return "החסירו את הסכום שמצאתם מ־100.";
    return "בדקו האם האחוז שמצאתם גדול מ־50%.";
  }
  if (task.kind === "pickSector") {
    if (groupValues(compiled, pie, task.base) == null) return missingHint(compiled, pie);
    if (pie.groups[task.id] == null) return "חברו תחילה את האחוזים של הרשימות שכבר בגוש.";
    if (!pie.gaps[task.id]) return "בדקו כמה חסר כדי לעבור 50%.";
    return "חפשו רשימה שאחוזה גדול מההפרש שמצאתם.";
  }
  var sector = byLabel(compiled, task.sector);
  if (pie.x != null && sector.expr && sector.coeff !== 1 && pie.percents[sector.label] == null) {
    return "הכפילו את הערך שכבר מצאתם במקדם של הביטוי.";
  }
  if (pie.percents[sector.label] != null) return "האחוז הזה כבר נמצא.";
  if (pie.eqCurrent) {
    var Teach = teachOf(engine);
    if (Teach && typeof Teach.nextAction === "function") {
      var act = Teach.nextAction(mathish(pie.eqCurrent));
      if (act && act.hint && !act.done) return act.hint;
    }
    return "המשיכו לפתור את המשוואה.";
  }
  return missingHint(compiled, pie);
}

function missingHint(compiled, pie) {
  if (pie.remainder != null && compiled.coeffSum > 1) return "הסכום שחסר עד 100 מתחלק בין הביטויים עם הנעלם. בנו מזה משוואה.";
  if (pie.knownSummed && compiled.coeffSum === 1) return "כעת מצאו כמה חסר מהסכום שקיבלתם עד 100%.";
  if (exprSectors(compiled).length > 1 || compiled.coeffSum > 1) {
    return "כל הגזרות יחד מייצגות 100%. בנו משוואה שבה סכום האחוזים והביטויים שווה ל־100.";
  }
  return "סכום כל החלקים בדיאגרמת עיגול הוא 100%. בדקו אילו אחוזים כבר ידועים.";
}

function teachStep(engine, pie) {
  var Teach = teachOf(engine);
  var Algebra = algebraOf(engine);
  if (!Teach || !pie.eqCurrent) return null;
  var act = Teach.nextAction(mathish(pie.eqCurrent));
  if (!act) return null;
  if (act.done) return { done: true };
  if (!act.eq) return null;
  if (Algebra && Algebra.checkStep) {
    try {
      var checked = Algebra.checkStep(mathish(pie.eqCurrent), mathish(act.eq));
      if (checked && checked.ok === false) return null;
    } catch (err) {}
  }
  return { line: act.eq };
}

function equationStep(engine, compiled, progress) {
  var pie = progress.pie;
  if (pie.x != null) return null;
  if (!pie.equation && !pie.knownSummed && pie.remainder == null) {
    var line = fullEquationLine(compiled);
    adoptEquation(pie, line);
    return { shows: [line] };
  }
  if (!pie.equation && pie.knownSummed && pie.remainder == null) {
    var built = compiled.coeffSum === 1
      ? "x = 100 - " + formatNum(compiled.knownSum)
      : formatNum(compiled.knownSum) + " + " + exprJoin(compiled) + " = 100";
    adoptEquation(pie, built);
    return { shows: [built] };
  }
  if (!pie.equation && pie.remainder != null && compiled.coeffSum > 1) {
    var rest = exprJoin(compiled) + " = " + formatNum(pie.remainder);
    adoptEquation(pie, rest);
    return { shows: [rest] };
  }
  var next = teachStep(engine, pie);
  if (!next) return null;
  if (next.done) {
    var info = eqParts(algebraOf(engine), mathish(pie.eqCurrent));
    finishSolved(compiled, pie, info);
    return { shows: [] };
  }
  adoptEquation(pie, next.line);
  var solved = eqParts(algebraOf(engine), mathish(next.line));
  finishSolved(compiled, pie, solved);
  return { shows: [next.line] };
}

function sectorStep(engine, compiled, progress, task) {
  var sector = byLabel(compiled, task.sector);
  var pie = progress.pie;
  if (pie.percents[sector.label] != null) return null;
  if (pie.x != null && sector.expr && !(sector.coeff === 1 && near(sector.truth, pie.x))) {
    noteSector(compiled, pie, sector.label, sector.truth);
    return { shows: [formatNum(sector.coeff) + "·" + formatNum(pie.x) + " = " + formatNum(sector.truth)] };
  }
  if (pie.x != null && near(sector.truth, pie.x)) {
    noteSector(compiled, pie, sector.label, sector.truth);
    return { shows: [formatNum(sector.truth)] };
  }
  return equationStep(engine, compiled, progress);
}

function majorityStep(engine, compiled, progress, task) {
  var pie = progress.pie;
  if (groupValues(compiled, pie, task.sectors) == null) return equationStep(engine, compiled, progress);
  if (pie.complements[task.id] != null && pie.groups[task.id] == null) {
    var back = 100 - pie.complements[task.id];
    pie.groups[task.id] = back;
    return { shows: [formatNum(back)], joinPrev: true };
  }
  if (pie.groups[task.id] == null) {
    var values = groupValues(compiled, pie, task.sectors);
    if (!pie.summing[task.id]) {
      pie.summing[task.id] = true;
      return { shows: [values.map(formatNum).join(" + ")] };
    }
    pie.groups[task.id] = sumNums(values);
    pie.summing[task.id] = false;
    return { shows: [formatNum(pie.groups[task.id])], joinPrev: true };
  }
  var word = hasMajority(pie.groups[task.id]) ? "כן" : "לא";
  pie.verdicts[task.id] = word;
  return { shows: [word] };
}

function pickStep(compiled, progress, task) {
  var pie = progress.pie;
  if (groupValues(compiled, pie, task.base) == null) return null;
  var values = groupValues(compiled, pie, task.base);
  if (pie.groups[task.id] == null) {
    if (!pie.summing[task.id]) {
      pie.summing[task.id] = true;
      return { shows: [values.map(formatNum).join(" + ")] };
    }
    pie.groups[task.id] = sumNums(values);
    pie.summing[task.id] = false;
    return { shows: [formatNum(pie.groups[task.id])], joinPrev: true };
  }
  var gap = 50 - pie.groups[task.id];
  if (!pie.gaps[task.id]) {
    pie.gaps[task.id] = true;
    return { shows: ["50 - " + formatNum(pie.groups[task.id]) + " = " + formatNum(gap)] };
  }
  var winners = winningLabels(compiled, progress, task);
  pie.picks[task.id] = winners[0];
  return { shows: [winners.join(", ")] };
}

function stepOnce(engine, compiled, ex, progress) {
  var current = currentPart(ex, progress);
  if (!current) return null;
  var task = openTasks(current.part, progress)[0];
  var moved = null;
  if (task.kind === "majority") moved = majorityStep(engine, compiled, progress, task);
  else if (task.kind === "pickSector") moved = pickStep(compiled, progress, task) || equationStep(engine, compiled, progress);
  else moved = sectorStep(engine, compiled, progress, task);
  if (!moved) return null;
  syncDone(ex, compiled, progress);
  return {
    shows: (moved.shows || []).filter(function (line) { return line; }),
    joinPrev: !!moved.joinPrev,
    part: current.part.label || "",
  };
}

function handle(engine, body, found) {
  var compiled = compile(found.ex);
  var progress = freshProgress(engine, compiled, body && body.progress, found.ex);
  syncDone(found.ex, compiled, progress);
  var intent = String((body && body.intent) || "check");
  if (intent === "hint") {
    return respond(found.ex, compiled, progress, {
      status: "hint",
      message: hintText(engine, compiled, found.ex, progress),
      part: (currentPart(found.ex, progress) || { part: {} }).part.label || "",
    });
  }
  if (intent === "step") {
    var stepped = stepOnce(engine, compiled, found.ex, progress);
    if (!stepped) {
      return respond(found.ex, compiled, progress, { status: "solved", message: "כל הסעיפים נכונים." });
    }
    var status = currentPart(found.ex, progress) ? "step" : "solved";
    return respond(found.ex, compiled, progress, {
      status: status,
      message: status === "solved" ? "כל הסעיפים נכונים." : "אפשר להמשיך.",
      shows: stepped.shows,
      joinPrev: stepped.joinPrev,
      part: stepped.part,
    });
  }
  if (intent === "solution") {
    var lines = [];
    var guard = 0;
    while (currentPart(found.ex, progress) && guard < 40) {
      guard += 1;
      var signature = JSON.stringify(progress.done) + JSON.stringify(progress.pie);
      var once = stepOnce(engine, compiled, found.ex, progress);
      if (!once) break;
      if (!once.shows.length && signature === JSON.stringify(progress.done) + JSON.stringify(progress.pie)) break;
      once.shows.forEach(function (show, index) {
        lines.push({ part: once.part, show: show, joinPrev: index === 0 && once.joinPrev });
      });
    }
    return respond(found.ex, compiled, progress, {
      status: currentPart(found.ex, progress) ? "task" : "solved",
      message: "כל הסעיפים נכונים.",
      lines: lines,
      shows: [],
    });
  }
  return checkTyped(engine, compiled, found.ex, body && body.typed, progress);
}

function openingView(found) {
  var compiled = compile(found.ex);
  var progress = freshProgress(null, compiled, {}, found.ex);
  syncDone(found.ex, compiled, progress);
  return viewOf(found.ex, progress);
}

module.exports = {
  handle: handle,
  openingView: openingView,
  hasMajority: hasMajority,
  compile: compile,
};
