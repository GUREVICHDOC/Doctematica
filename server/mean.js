"use strict";

// ממוצע: בחירת הנתונים נפרדת מחישוב sum/count/mean.
// המקור יכול להיות רשימה, ובהמשך גם טבלת שכיחויות או דיאגרמה.

var BAR = "x\u0304";

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

function divRat(a, b) {
  if (!a || !b || !b.n) return null;
  return rat(a.n * b.d, a.d * b.n);
}

function parseNum(text) {
  var s = String(text || "").replace(",", ".");
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
  if (s.indexOf(".") < 0) return rat(Number(s), 1);
  var bits = s.split(".");
  var sign = s.charAt(0) === "-" ? -1 : 1;
  var whole = bits[0].replace("-", "") || "0";
  var frac = bits[1];
  var n = sign * Number(whole + frac);
  return rat(n, Math.pow(10, frac.length));
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

function ratKey(r) {
  return r ? r.n + "/" + r.d : "";
}

function observations(source) {
  var rows = [];
  if (Array.isArray(source)) {
    source.forEach(function (value) { rows.push({ value: Number(value), weight: 1 }); });
    return rows;
  }
  if (!source) return rows;
  if (source.type === "frequency" || source.type === "chart") {
    (source.rows || source.bars || []).forEach(function (row) {
      var freq = Number(row.frequency != null ? row.frequency : row.freq);
      var value = Number(row.value);
      var i;
      for (i = 0; i < freq; i++) rows.push({ value: value, weight: 1 });
    });
    return rows;
  }
  var values = source.values || [];
  values.forEach(function (value) { rows.push({ value: Number(value), weight: 1 }); });
  return rows;
}

function measure(items) {
  var sum = 0;
  var count = 0;
  var values = [];
  (items || []).forEach(function (item) {
    var weight = item.weight == null ? 1 : item.weight;
    sum += item.value * weight;
    count += weight;
    var i;
    for (i = 0; i < weight; i++) values.push(item.value);
  });
  return {
    items: items || [],
    values: values,
    sum: sum,
    count: count,
    rational: count ? rat(sum, count) : null,
  };
}

function selectItems(items, spec, mean) {
  spec = spec || { type: "all" };
  if (spec.type === "top") {
    var ranked = items.map(function (item, index) { return { item: item, index: index }; });
    ranked.sort(function (a, b) {
      if (a.item.value !== b.item.value) return b.item.value - a.item.value;
      return a.index - b.index;
    });
    return ranked.slice(0, spec.n).sort(function (a, b) { return a.index - b.index; }).map(function (row) { return row.item; });
  }
  if (spec.type === "compare") {
    var op = spec.op || "<";
    return items.filter(function (item) {
      if (mean == null) return false;
      var left = item.value * mean.d;
      var right = mean.n;
      if (op === "<") return left < right;
      if (op === "<=") return left <= right;
      if (op === ">") return left > right;
      if (op === ">=") return left >= right;
      return false;
    });
  }
  return items.slice();
}

function bag(values) {
  var map = {};
  (values || []).forEach(function (value) {
    var key = ratKey(parseNum(String(value)));
    map[key] = (map[key] || 0) + 1;
  });
  return map;
}

function bagsEqual(a, b) {
  var keys = {};
  Object.keys(a).forEach(function (key) { keys[key] = true; });
  Object.keys(b).forEach(function (key) { keys[key] = true; });
  return Object.keys(keys).every(function (key) { return a[key] === b[key]; });
}

function tasksOf(ex) {
  var list = [];
  (ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) { list.push({ part: part, task: task }); });
  });
  return list;
}

function taskSource(task) {
  return task && task.source;
}

function meanOfAll(task) {
  return measure(observations(taskSource(task)));
}

function truthOf(task) {
  var all = observations(taskSource(task));
  var mean = measure(all).rational;
  var chosen = selectItems(all, task.select, mean);
  var stats = measure(chosen);
  stats.all = measure(all);
  stats.meanBound = mean;
  stats.select = task.select || { type: "all" };
  return stats;
}

function needsPick(task) {
  var spec = task.select || { type: "all" };
  return spec.type === "top" || spec.type === "compare";
}

function selectKey(spec) {
  spec = spec || { type: "all" };
  return [spec.type || "all", spec.n || "", spec.op || "", spec.against || ""].join("|");
}

function emptyState() {
  return { hints: 0, selected: false, formula: false, sum: null, count: null, quotient: false, countMiss: false, named: false, scaled: false };
}

function sanitizeState(raw, truth) {
  var state = emptyState();
  raw = raw || {};
  if (raw.selected) state.selected = true;
  if (raw.formula) state.formula = true;
  if (raw.quotient) state.quotient = true;
  if (raw.countMiss) state.countMiss = true;
  if (raw.named) state.named = true;
  if (raw.scaled) state.scaled = true;
  var hints = Number(raw.hints);
  if (hints > 0 && hints < 8) state.hints = hints;
  if (raw.sum != null && truth && Number(raw.sum) === truth.sum) state.sum = truth.sum;
  if (raw.count != null && truth && Number(raw.count) === truth.count) state.count = truth.count;
  return state;
}

function sanitizeProgress(ex, raw) {
  var progress = { done: {}, phase: {}, found: {}, mean: {}, known: {} };
  raw = raw || {};
  var allowed = {};
  tasksOf(ex).forEach(function (row) { allowed[row.task.id] = row.task; });
  Object.keys(raw.done || {}).forEach(function (id) {
    if (allowed[id] && raw.done[id]) progress.done[id] = true;
  });
  Object.keys(raw.mean || {}).forEach(function (id) {
    if (!allowed[id] || progress.done[id]) return;
    progress.mean[id] = sanitizeState(raw.mean[id], truthOf(allowed[id]));
  });
  Object.keys(raw.known || {}).forEach(function (key) {
    if (raw.known[key]) progress.known[key] = true;
  });
  return progress;
}

function stateOf(progress, task) {
  return (progress.mean && progress.mean[task.id]) || emptyState();
}

function saveState(progress, task, state) {
  progress.mean[task.id] = state;
}

function patchState(state, patch) {
  var next = Object.assign({}, state);
  Object.keys(patch || {}).forEach(function (key) { next[key] = patch[key]; });
  return next;
}

function currentWork(ex, progress) {
  var rows = tasksOf(ex);
  var i;
  for (i = 0; i < rows.length; i++) {
    if (!progress.done[rows[i].task.id]) return rows[i];
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
  if (!task || task.q == null || task.q === "") return text;
  var blocks = questionsIn(text);
  var i;
  for (i = 0; i < blocks.length; i++) {
    if (blocks[i].n === Number(task.q)) return blocks[i].lines.join("\n");
  }
  return text;
}

function viewData(ex) {
  var row = tasksOf(ex).filter(function (item) { return item.task.source; })[0];
  if (!row) return null;
  return observations(row.task.source).map(function (item) { return item.value; });
}

function viewOf(ex, progress) {
  var current = currentWork(ex, progress);
  var data = viewData(ex);
  if (!current) {
    var solved = { part: null, ask: "", input: "text", solved: true, keys: "mean", list: "plain" };
    if (data) solved.data = data;
    return solved;
  }
  var view = {
    part: { label: current.part.label || "", text: current.part.text || "" },
    ask: activeAsk(current.part, current.task),
    input: "text",
    solved: false,
    keys: "mean",
    list: "plain",
  };
  if (data) view.data = data;
  return view;
}

function listedAlready(ex, progress, task) {
  var key = selectKey(task.select);
  if (progress.known && progress.known[key]) return true;
  var hit = false;
  tasksOf(ex).forEach(function (row) {
    if (row.task.id === task.id) return;
    if (selectKey(row.task.select) !== key) return;
    var state = progress.mean[row.task.id];
    if (state && state.selected) hit = true;
  });
  return hit;
}

function formulaLine(truth) {
  return BAR + "=(" + truth.values.join("+") + ")/" + truth.count;
}

function quotientLine(truth) {
  return BAR + "=" + truth.sum + "/" + truth.count;
}

function resultLine(truth) {
  return BAR + "=" + formatRat(truth.rational);
}

function sumLine(truth) {
  return truth.values.join("+") + "=" + truth.sum;
}

function listLine(truth) {
  return truth.values.join(", ");
}

function topPhrase(task) {
  var spec = task.select || {};
  if (spec.n === 4 && spec.thing === "הציונים") return "ארבעת הציונים הגבוהים ביותר";
  return String(spec.n || "") + " הערכים הגבוהים ביותר";
}

function hintFor(ex, task, progress) {
  var state = stateOf(progress, task);
  if (task.kind === "variable") {
    if (state.named && !state.scaled) return "האם הערכים הם מספרים או שמות?";
    if (state.scaled && !state.named) return "רשמו מה נמדד אצל כל אחד.";
    return "המשתנה הוא מה שנמדד אצל כל אחד. בדקו אם הערכים הם מספרים או שמות.";
  }
  var truth = truthOf(task);
  if (task.of === "count") {
    if (!state.selected && !listedAlready(ex, progress, task)) return "בדוק אילו ערכים קטנים מהממוצע שכבר מצאת.";
    return "כמה ערכים כאלה יש?";
  }
  if (needsPick(task) && !state.selected && !listedAlready(ex, progress, task) && state.sum == null && !state.formula && !state.quotient) {
    if ((task.select || {}).type === "top") return "ראשית מצא את " + topPhrase(task) + ".";
    return "בדוק אילו ערכים קטנים מהממוצע שכבר מצאת.";
  }
  if (state.countMiss && state.count == null) return "כמה נתונים יש ברשימה?";
  if (state.quotient) return "חשבו את תוצאת החילוק.";
  if (state.sum != null) return "כעת חלק את הסכום במספר הנתונים.";
  if (state.formula) return "חשבו את סכום הנתונים במונה.";
  if (!needsPick(task) && state.hints) return "כמה נתונים יש ברשימה?";
  return "כדי לחשב ממוצע, חבר את כל הנתונים וחלק במספר הנתונים.";
}

function nextAction(ex, task, progress) {
  var state = stateOf(progress, task);
  if (task.kind === "variable") {
    if (!state.named) return { shows: ["המשתנה הוא " + (task.displayName || "הציון") + "."], patch: { named: true } };
    return { shows: ["הוא כמותי."], patch: { scaled: true }, done: true };
  }
  var truth = truthOf(task);
  if (task.of === "count") {
    if (!state.selected && !listedAlready(ex, progress, task)) {
      return { shows: [listLine(truth)], patch: { selected: true } };
    }
    return { shows: [String(truth.count)], done: true };
  }
  var picked = state.selected || listedAlready(ex, progress, task);
  if (needsPick(task) && !picked && state.sum == null && !state.formula && !state.quotient) {
    return { shows: [listLine(truth)], patch: { selected: true } };
  }
  if (state.quotient) return { shows: [resultLine(truth)], done: true };
  if (state.sum != null || state.formula) return { shows: [quotientLine(truth)], patch: { quotient: true, sum: truth.sum, count: truth.count, selected: true } };
  return { shows: [formulaLine(truth)], patch: { formula: true, selected: true } };
}

function solutionLines(ex, task, progress) {
  var lines = [];
  var state = stateOf(progress, task);
  var guard = 0;
  while (!progress.done[task.id] && guard < 8) {
    var action = nextAction(ex, task, progress);
    lines = lines.concat(action.shows || []);
    state = patchState(state, action.patch);
    saveState(progress, task, state);
    if (action.done) progress.done[task.id] = true;
    guard += 1;
  }
  return lines;
}

function peelEdgeEquals(s) {
  if (s.charAt(0) === "=") return s.slice(1);
  if (s.charAt(s.length - 1) === "=" && s.indexOf("=") === s.length - 1) return s.slice(0, -1);
  return s;
}

function normalize(text) {
  var s = String(text || "").trim();
  s = s.replace(/ק\s*["״']\s*ג/g, "");
  s = s.replace(/ק״ג/g, "");
  s = s.replace(/שנים/g, "");
  s = s.replace(/\u0304/g, "");
  s = s.replace(/[¯ˉ]/g, "");
  s = s.replace(/\\bar\s*\{\s*x\s*\}/gi, "x");
  s = s.replace(/ממוצע/g, "x");
  s = s.replace(/[−–—]/g, "-");
  s = s.replace(/\s+/g, "");
  if (/^x=/i.test(s)) s = s.replace(/^x=/i, "");
  return s;
}

function stripOuter(expr) {
  var s = expr;
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

function parseTerms(expr) {
  var s = stripOuter(expr);
  if (!s) return null;
  var depth = 0;
  var start = 0;
  var parts = [];
  var i;
  for (i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "+" && depth === 0) {
      parts.push(s.slice(start, i));
      start = i + 1;
    }
    if (depth < 0) return null;
  }
  if (depth !== 0) return null;
  parts.push(s.slice(start));
  if (parts.length === 1) {
    var num = parseNum(parts[0]);
    if (!num) return null;
    return { values: [num], single: true };
  }
  var values = [];
  for (i = 0; i < parts.length; i++) {
    var inner = parseTerms(parts[i]);
    if (!inner) return null;
    values = values.concat(inner.values);
  }
  return { values: values, single: false };
}

function splitFrac(expr) {
  var depth = 0;
  var slash = -1;
  var count = 0;
  var i;
  for (i = 0; i < expr.length; i++) {
    var ch = expr.charAt(i);
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "/" && depth === 0) {
      slash = i;
      count += 1;
    }
  }
  if (count !== 1 || slash <= 0 || slash === expr.length - 1) return null;
  return { num: expr.slice(0, slash), den: expr.slice(slash + 1) };
}

function readAddends(expr) {
  var parsed = parseTerms(expr);
  if (!parsed) return null;
  return parsed;
}

function valueList(rats) {
  return rats.map(function (item) { return item.n / item.d; });
}

function placeGroups(targets, nums, requireAll) {
  var used = nums.map(function () { return false; });
  function place(index) {
    if (index === targets.length) {
      if (!requireAll) return true;
      var i;
      for (i = 0; i < used.length; i++) if (!used[i]) return false;
      return true;
    }
    return fill(index, 0, 0, false);
  }
  function fill(group, index, sum, any) {
    if (sum === targets[group] && any) return place(group + 1);
    if (index >= nums.length || sum > targets[group]) return false;
    if (fill(group, index + 1, sum, any)) return true;
    if (!used[index] && sum + nums[index] <= targets[group]) {
      used[index] = true;
      if (fill(group, index + 1, sum + nums[index], true)) return true;
      used[index] = false;
    }
    return false;
  }
  return place(0);
}

function groupVerdict(gotRats, truth) {
  var nums = truth.values.map(function (value) { return Math.round(value); });
  var raw = bag(nums);
  var targets = [];
  var combined = false;
  var i;
  for (i = 0; i < gotRats.length; i++) {
    var item = gotRats[i];
    if (!item || item.d !== 1) return null;
    targets.push(item.n);
    if (!raw[ratKey(item)]) combined = true;
  }
  if (!combined) return null;
  var ordered = targets.slice().sort(function (a, b) { return b - a; });
  if (placeGroups(ordered, nums, true)) return { ok: true, grouped: true };
  for (i = 0; i < ordered.length; i++) {
    if (!placeGroups([ordered[i]], nums, false)) {
      var where = (truth.select && truth.select.type && truth.select.type !== "all")
        ? "אינו סכום של הנתונים שנבחרו."
        : "אינו סכום של נתונים מהרשימה.";
      return { ok: false, message: "המספר " + ordered[i] + " " + where };
    }
  }
  if (placeGroups(ordered, nums, false)) {
    var gotSum = ordered.reduce(function (sum, value) { return sum + value; }, 0);
    var wantSum = nums.reduce(function (sum, value) { return sum + value; }, 0);
    if (gotSum < wantSum) return { ok: false, message: "חסר נתון אחד בסכום." };
    return { ok: false, message: "השתמשתם באותו נתון פעמיים." };
  }
  return { ok: false, message: "הקיבוץ לא משתמש בכל נתון פעם אחת." };
}

function diagnose(gotRats, truth, task) {
  var got = bag(valueList(gotRats));
  var want = bag(truth.values);
  var full = bag(truth.all.values);
  if (bagsEqual(got, want)) return { ok: true };
  if ((task.select || {}).type && (task.select || {}).type !== "all" && bagsEqual(got, full)) {
    return { ok: false, message: "חיברתם את כל הנתונים. צריך רק את הנתונים של הקבוצה המבוקשת." };
  }
  var bound = truth.meanBound;
  var op = (task.select || {}).op;
  var equalHit = null;
  var outsider = null;
  var unknown = null;
  gotRats.forEach(function (item) {
    var key = ratKey(item);
    if (op === "<" && bound && sameRat(item, bound)) equalHit = formatRat(item);
    else if (!want[key] && full[key] && outsider == null) outsider = formatRat(item);
    else if (!full[key] && unknown == null) unknown = formatRat(item);
  });
  if (equalHit != null) return { ok: false, message: "הנתון " + equalHit + " שווה לממוצע. נדרש ערך נמוך ממנו." };
  if (outsider != null) {
    if ((task.select || {}).type === "top") return { ok: false, message: "הנתון " + outsider + " אינו בין " + topPhrase(task) + "." };
    if (op === "<") return { ok: false, message: "הנתון " + outsider + " אינו קטן מהממוצע." };
    return { ok: false, message: "הנתון " + outsider + " אינו שייך לקבוצה." };
  }
  var grouped = groupVerdict(gotRats, truth);
  if (grouped && grouped.ok) return grouped;
  if (unknown != null) {
    if (grouped && !grouped.ok) return grouped;
    return { ok: false, message: "הנתון " + unknown + " אינו מופיע ברשימה." };
  }
  if (grouped && !grouped.ok) return grouped;
  var gotCount = gotRats.length;
  var wantCount = truth.values.length;
  var extra = false;
  var missing = false;
  Object.keys(want).forEach(function (key) {
    if ((got[key] || 0) < want[key]) missing = true;
    if ((got[key] || 0) > want[key]) extra = true;
  });
  Object.keys(got).forEach(function (key) {
    if ((got[key] || 0) > (want[key] || 0)) extra = true;
  });
  if (extra && !missing) return { ok: false, message: "השתמשתם באותו נתון פעמיים." };
  if (missing && !extra && gotCount + 1 === wantCount) return { ok: false, message: "חסר נתון אחד בסכום." };
  if (missing && !extra) return { ok: false, message: "חסר נתון ששייך לקבוצה." };
  if ((task.select || {}).type === "top" && gotCount === wantCount) {
    return { ok: false, message: "אלה לא " + topPhrase(task) + "." };
  }
  return { ok: false, message: "בדקו אילו נתונים נכנסים לחישוב." };
}

function denMessage(denRat, truth) {
  var den = denRat.n / denRat.d;
  if (den === truth.count + 1) return "ספרתם נתון אחד יותר. בדקו כמה נתונים יש ברשימה.";
  if (den === truth.count - 1) return "חסר נתון אחד בספירה. בדקו כמה נתונים יש ברשימה.";
  return "הסכום נכון, אבל החלוקה היא במספר נתונים שגוי.";
}

function checkBare(num, truth, task) {
  if (task.of === "count") return checkCountNumber(num, truth, task);
  if (sameRat(num, truth.rational)) return { ok: true, done: true, shows: [resultLine(truth)] };
  if (sameRat(num, rat(truth.sum, 1))) return { ok: false, message: "זה סכום הנתונים, לא הממוצע." };
  if (sameRat(num, rat(truth.count, 1))) return { ok: false, message: "זה מספר הנתונים, לא הממוצע." };
  var hit = truth.all.values.some(function (value) { return sameRat(num, rat(value, 1)); });
  if (hit) return { ok: false, message: "זה אחד הנתונים, לא הממוצע." };
  return { ok: false, message: "בדקו את החיבור ואת החילוק." };
}

function checkCountNumber(num, truth, task) {
  if (num.d !== 1) return { ok: false, message: "השאלה מבקשת כמה ערכים, לא ממוצע." };
  if (num.n === truth.count) return { ok: true, done: true, shows: [String(truth.count)] };
  var loose = selectItems(truth.all.items, { type: "compare", op: "<=" }, truth.meanBound);
  if ((task.select || {}).op === "<" && loose.length !== truth.count && num.n === loose.length) {
    return { ok: false, message: "כללתם ערך ששווה לממוצע. נדרש ערך נמוך מהממוצע." };
  }
  if (sameRat(num, truth.all.rational)) return { ok: false, message: "זה הממוצע. עכשיו ספרו כמה ערכים קטנים ממנו." };
  if (num.n === truth.all.count) return { ok: false, message: "ספרתם את כל הנתונים. צריך רק את אלה שקטנים מהממוצע." };
  if (Math.abs(num.n - truth.count) === 1) return { ok: false, message: "הספירה שונה ב־1 ממספר הערכים שקטנים מהממוצע." };
  return { ok: false, message: "בדקו אילו ערכים קטנים מהממוצע." };
}

function checkFraction(expr, truth, task, expectResult) {
  var parts = splitFrac(expr);
  if (!parts) return null;
  var num = readAddends(parts.num);
  var den = readAddends(parts.den);
  if (!num || !den) return { ok: false, message: "בדקו את המונה ואת המכנה." };
  var denRat = den.single ? den.values[0] : den.values.reduce(function (acc, item) { return rat(acc.n * item.d + item.n * acc.d, acc.d * item.d); }, rat(0, 1));
  var judgedNums = !num.single ? diagnose(num.values, truth, task) : null;
  var numIsAddends = !!(judgedNums && judgedNums.ok);
  var numIsSum = num.single && sameRat(num.values[0], rat(truth.sum, 1));
  var denIsCount = sameRat(denRat, rat(truth.count, 1));
  if (num.single && num.values.length === 1 && !numIsSum && denIsCount) {
    var only = num.values[0];
    var member = truth.all.values.some(function (value) { return sameRat(only, rat(value, 1)); });
    if (member) return { ok: false, message: "חילקתם במספר הנתונים לפני שחיברתם את כל הנתונים." };
  }
  if ((numIsAddends || numIsSum) && denIsCount) {
    if (expectResult) return { ok: true, done: false, hold: true };
    if (numIsAddends) {
      var groupedLine = judgedNums.grouped
        ? BAR + "=(" + num.values.map(formatRat).join("+") + ")/" + truth.count
        : formulaLine(truth);
      return { ok: true, done: false, shows: [groupedLine], patch: { formula: true, selected: true, countMiss: false } };
    }
    return { ok: true, done: false, shows: [quotientLine(truth)], patch: { quotient: true, sum: truth.sum, count: truth.count, selected: true, countMiss: false } };
  }
  if (numIsAddends || numIsSum) {
    return { ok: false, message: denMessage(denRat, truth), patch: { countMiss: true, sum: numIsSum || numIsAddends ? truth.sum : null } };
  }
  var addendCheck = !num.single ? diagnose(num.values, truth, task) : null;
  if (addendCheck && !addendCheck.ok) return addendCheck;
  if (num.single && den.single) {
    var value = divRat(num.values[0], den.values[0]);
    if (task.of !== "count" && sameRat(value, truth.rational) && !numIsSum) {
      return { ok: true, done: true, shows: [resultLine(truth)] };
    }
  }
  return { ok: false, message: "בדקו את המונה ואת המכנה." };
}

function checkSumEq(left, right, truth, task) {
  var addends = readAddends(left);
  var total = parseNum(right);
  if (!addends || addends.single || !total) return null;
  var judged = diagnose(addends.values, truth, task);
  if (!judged.ok) return judged;
  if (!sameRat(total, rat(truth.sum, 1))) {
    return { ok: false, message: judged.grouped ? "החיבור נכון, אבל הסכום שגוי." : "הנתונים נכונים, אבל הסכום שגוי." };
  }
  var shownSum = judged.grouped ? addends.values.map(formatRat).join("+") + "=" + truth.sum : sumLine(truth);
  return { ok: true, done: false, shows: [shownSum], patch: { sum: truth.sum, selected: true, countMiss: false } };
}

function checkMeanText(task, typed) {
  var truth = truthOf(task);
  var s = peelEdgeEquals(normalize(typed));
  if (!s) return { ok: false, message: "כתבו תשובה." };
  if (task.of === "count") {
    var countListed = s.split(",").map(parseNum);
    if (s.indexOf(",") >= 0 && countListed.every(Boolean) && !(countListed.length === 2 && sameRat(divRat(countListed[0], rat(1, 1)), truth.rational))) {
      var asRats = countListed;
      if (s.split(",").length === 2 && /^\d+,\d+$/.test(s)) {
        var decimal = parseNum(s);
        if (decimal && checkCountNumber(decimal, truth, task).ok) return checkCountNumber(decimal, truth, task);
      }
      var judgedList = diagnose(asRats, truth, task);
      if (!judgedList.ok) return judgedList;
      return { ok: true, done: false, shows: [listLine(truth)], patch: { selected: true } };
    }
    var bareCount = parseNum(s);
    if (bareCount) return checkCountNumber(bareCount, truth, task);
  }
  if (/^-?\d+(?:[.,]\d+)?$/.test(s)) return checkBare(parseNum(s), truth, task);
  var sides = s.split("=");
  if (sides.length === 1) {
    if (s.indexOf("/") >= 0) {
      var frac = checkFraction(s, truth, task, false);
      if (frac) return frac;
    }
    var only = readAddends(s);
    if (only && !only.single) {
      var listed = diagnose(only.values, truth, task);
      if (!listed.ok) return listed;
      return { ok: true, done: false, shows: [truth.values.join("+")], patch: { selected: true } };
    }
    return { ok: false, message: "בדקו את החיבור ואת החילוק." };
  }
  if (sides.length > 3) return { ok: false, message: "רשמו שלב אחד, או את הממוצע." };
  if (sides.length === 2) {
    var rightNum = parseNum(sides[1]);
    var sumEq = checkSumEq(sides[0], sides[1], truth, task);
    if (sumEq) return sumEq;
    var leftFrac = splitFrac(sides[0]);
    if (leftFrac && rightNum) {
      var step = checkFraction(sides[0], truth, task, true);
      if (step && step.ok === false) return step;
      if (step && step.hold) {
        if (sameRat(rightNum, truth.rational)) return { ok: true, done: true, shows: [resultLine(truth)], patch: { quotient: true, sum: truth.sum, count: truth.count, selected: true } };
        return { ok: false, message: "הסכום ומספר הנתונים נכונים, אבל תוצאת החילוק שגויה." };
      }
      if (step && step.done) return step;
    }
    if (rightNum && sameRat(rightNum, truth.rational)) {
      var leftTerms = readAddends(sides[0]);
      if (leftTerms && !leftTerms.single) {
        var leftJudge = diagnose(leftTerms.values, truth, task);
        if (!leftJudge.ok) return leftJudge;
      }
    }
    return { ok: false, message: "בדקו את החיבור ואת החילוק." };
  }
  var mid = checkFraction(sides[1], truth, task, true);
  var first = checkFraction(sides[0], truth, task, true);
  var end = parseNum(sides[2]);
  if (first && first.ok === false) return first;
  if (mid && mid.ok === false) return mid;
  if (first && first.hold && mid && mid.hold && end && sameRat(end, truth.rational)) {
    return { ok: true, done: true, shows: [resultLine(truth)], patch: { formula: true, quotient: true, sum: truth.sum, count: truth.count, selected: true } };
  }
  if (first && first.hold && mid && mid.hold && !end) return { ok: false, message: "בדקו את החיבור ואת החילוק." };
  if (end && !sameRat(end, truth.rational)) return { ok: false, message: "הסכום ומספר הנתונים נכונים, אבל תוצאת החילוק שגויה." };
  return { ok: false, message: "בדקו את החיבור ואת החילוק." };
}

function normHeb(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function checkVariable(task, typed, state) {
  var text = normHeb(typed);
  if (!text) return { ok: false, message: "כתבו תשובה." };
  var named = (task.names || ["ציון"]).some(function (name) { return text.indexOf(name) >= 0; });
  var qualitative = /איכותי/.test(text);
  var quantitative = /כמותי/.test(text);
  if (qualitative && !quantitative) return { ok: false, message: "הערכים הם מספרים, ולכן המשתנה כמותי." };
  if (/תלמיד/.test(text) && !named) return { ok: false, message: "התלמידים הם מי שנמדד. המשתנה הוא מה שנרשם לכל אחד מהם." };
  var nowNamed = named || state.named;
  var nowScaled = quantitative || state.scaled;
  if (nowNamed && nowScaled) {
    return { ok: true, done: true, shows: ["המשתנה הוא " + (task.displayName || "הציון") + ".", "הוא כמותי."] };
  }
  if (named && !nowScaled) {
    return { ok: true, done: false, shows: ["המשתנה הוא " + (task.displayName || "הציון") + "."], patch: { named: true }, message: "עכשיו ציינו אם הוא איכותי או כמותי." };
  }
  if (quantitative && !nowNamed) {
    return { ok: true, done: false, shows: ["כמותי"], patch: { scaled: true }, message: "עכשיו רשמו מהו המשתנה." };
  }
  return { ok: false, message: "רשמו מהו המשתנה, ואם הוא כמותי או איכותי." };
}

function checkTyped(ex, task, typed, progress) {
  var state = stateOf(progress, task);
  if (task.kind === "variable") return checkVariable(task, typed, state);
  if (task.of === "count") {
    var countHit = checkMeanText(task, typed);
    return countHit;
  }
  return checkMeanText(task, typed);
}

function respond(ex, progress, extra) {
  extra = extra || {};
  return {
    ok: extra.ok !== false,
    status: extra.status || "",
    message: extra.message || "",
    shows: extra.shows || [],
    part: extra.part || "",
    progress: progress,
    view: viewOf(ex, progress),
  };
}

function applyResult(progress, task, result) {
  var state = patchState(stateOf(progress, task), result.patch);
  if (result.done) {
    if (state.selected && task.select) {
      progress.known = progress.known || {};
      progress.known[selectKey(task.select)] = true;
    }
    progress.done[task.id] = true;
    delete progress.mean[task.id];
    return;
  }
  saveState(progress, task, state);
}

function statusAfter(ex, progress, stepped) {
  if (!currentWork(ex, progress)) return "solved";
  if (stepped) return "step";
  return "task";
}

function handle(engine, body, found) {
  if (!found || !found.ex) return { error: "unknown exercise", message: "unknown exercise" };
  var ex = found.ex;
  var progress = sanitizeProgress(ex, body && body.progress);
  var intent = String((body && body.intent) || "check");
  var current = currentWork(ex, progress);
  if (!current && intent !== "solution") {
    return respond(ex, progress, { ok: true, status: "solved", message: "כל הסעיפים נכונים." });
  }
  if (intent === "hint") {
    if (!current) return respond(ex, progress, { ok: true, status: "solved", message: "כל הסעיפים נכונים." });
    var hinted = stateOf(progress, current.task);
    var message = hintFor(ex, current.task, progress);
    hinted = patchState(hinted, { hints: (hinted.hints || 0) + 1 });
    saveState(progress, current.task, hinted);
    return respond(ex, progress, { status: "hint", message: message, part: current.part.label || "" });
  }
  if (intent === "step") {
    var action = nextAction(ex, current.task, progress);
    applyResult(progress, current.task, action);
    var stepStatus = statusAfter(ex, progress, true);
    return respond(ex, progress, {
      status: stepStatus,
      message: action.message || "",
      shows: action.shows || [],
      part: current.part.label || "",
    });
  }
  if (intent === "solution") {
    var lines = [];
    var guard = 0;
    while (currentWork(ex, progress) && guard < 12) {
      var open = currentWork(ex, progress);
      var chunk = solutionLines(ex, open.task, progress);
      chunk.forEach(function (line) { lines.push({ part: open.part.label || "", show: line }); });
      guard += 1;
    }
    return {
      ok: true,
      status: currentWork(ex, progress) ? "task" : "solved",
      message: "כל הסעיפים נכונים.",
      shows: [],
      lines: lines,
      progress: progress,
      view: viewOf(ex, progress),
    };
  }
  var result = checkTyped(ex, current.task, body && body.typed, progress);
  if (!result.ok) {
    if (result.patch) saveState(progress, current.task, patchState(stateOf(progress, current.task), result.patch));
    return {
      ok: false,
      message: result.message || "בדקו שוב.",
      view: viewOf(ex, progress),
      progress: progress,
    };
  }
  applyResult(progress, current.task, result);
  var status = statusAfter(ex, progress, !result.done);
  var detail = result.message || "";
  if (!detail && status === "solved") detail = "כל הסעיפים נכונים.";
  if (!detail && !result.done) detail = "אפשר להמשיך.";
  return respond(ex, progress, {
    status: status,
    message: detail,
    shows: result.shows || [],
    part: current.part.label || "",
  });
}

function openingView(found) {
  if (!found || !found.ex) return null;
  return viewOf(found.ex, sanitizeProgress(found.ex, {}));
}

// ממוצע משוקלל מטבלת שכיחויות: Σ(x·f) / Σf.
// לא מרחיבים את הטבלה לרשימה שבה כל ערך חוזר לפי השכיחות.

var FORGET_WEIGHT = "כל ערך צריך להילקח בחשבון לפי מספר הפעמים שהוא מופיע. נסה לכפול כל ערך בשכיחות שלו.";
var CATEGORY_DEN = "בממוצע מתוך טבלת שכיחויות מחלקים במספר הנתונים הכולל, כלומר בסכום השכיחויות, ולא במספר הערכים השונים.";
var SWAP_ENDS = "החלפתם בין המונה למכנה.";
var ADD_NOT_MUL = "יש לכפול כל ערך בשכיחות שלו, לא לחבר אותם.";
var ADDED_PAIRS = "חיברתם ערך ושכיחות במקום לכפול.";
var VALUES_DEN = "המכנה צריך להיות סכום השכיחויות, לא סכום ערכי המשתנה.";
var OMIT_COLUMN = "חסרה עמודה במונה.";
var OMIT_FREQ = "חסרה שכיחות במכנה.";
var SHIFT_PAIRS = "ההתאמה בין הערך לשכיחות הוזזה.";
var WRONG_COLUMN = "כפלתם ערך בשכיחות של עמודה אחרת.";
var NUM_OK_DEN_BAD = "המונה נכון, אבל המכנה שגוי.";
var DEN_OK_NUM_BAD = "המכנה נכון, אבל המונה שגוי.";
var PRODUCTS_SUM_BAD = "המכפלות נכונות, אבל הסכום שלהן שגוי.";
var FREQ_SUM_BAD = "חיבור השכיחויות נכון, אבל הסכום שגוי.";
var HINT_START = "כל ערך מופיע מספר פעמים לפי השכיחות שלו. כפל כל ערך בשכיחות המתאימה לו.";
var HINT_DEN = "כעת מצא את מספר הנתונים הכולל על ידי חיבור השכיחויות.";
var HINT_NUM = "מספר הנתונים כבר ידוע. כעת חשב את סכום ערך × שכיחות.";
var HINT_DIV = "חלק את סכום ערך×שכיחות במספר הנתונים הכולל.";

function sameInt(a, b) {
  return Number(a) === Number(b) && isFinite(Number(a));
}

function tableModel(compiled, task) {
  var extra = {};
  (task && task.add || []).forEach(function (item) {
    var key = String(item.value);
    extra[key] = (extra[key] || 0) + Number(item.freq || 0);
  });
  var terms = [];
  ((compiled && (compiled.ordered || compiled.rows)) || []).forEach(function (row) {
    if (row.num == null || !isFinite(row.num)) return;
    var freq = row.freq;
    var key = String(row.num);
    if (extra[key]) {
      freq = (freq == null ? 0 : Number(freq)) + extra[key];
      delete extra[key];
    }
    if (freq == null || !isFinite(freq)) return;
    terms.push({
      index: terms.length,
      value: row.num,
      frequency: freq,
      product: row.num * freq,
    });
  });
  Object.keys(extra).forEach(function (key) {
    var value = Number(key);
    var freq = extra[key];
    if (!isFinite(value) || !isFinite(freq)) return;
    terms.push({
      index: terms.length,
      value: value,
      frequency: freq,
      product: value * freq,
    });
  });
  var weightedSum = 0;
  var totalFrequency = 0;
  var valueSum = 0;
  terms.forEach(function (term) {
    weightedSum += term.product;
    totalFrequency += term.frequency;
    valueSum += term.value;
  });
  return {
    terms: terms,
    weightedSum: weightedSum,
    totalFrequency: totalFrequency,
    valueSum: valueSum,
    categoryCount: terms.length,
    mean: totalFrequency ? rat(weightedSum, totalFrequency) : null,
  };
}

function emptyWeighted() {
  return {
    knownProducts: [],
    knownFrequencies: [],
    weightedSum: null,
    totalFrequency: null,
    expanded: false,
    collapsed: false,
    quotient: false,
  };
}

function cleanWeighted(state) {
  var base = emptyWeighted();
  if (!state) return base;
  base.knownProducts = (state.knownProducts || []).slice();
  base.knownFrequencies = (state.knownFrequencies || []).slice();
  base.weightedSum = state.weightedSum == null ? null : state.weightedSum;
  base.totalFrequency = state.totalFrequency == null ? null : state.totalFrequency;
  base.expanded = !!state.expanded;
  base.collapsed = !!state.collapsed;
  base.quotient = !!state.quotient;
  return base;
}

function sanitizeTable(compiled, ex, raw) {
  var out = {};
  if (!raw || typeof raw !== "object") return out;
  (ex.parts || []).forEach(function (part) {
    (part.tasks || []).forEach(function (task) {
      if (task.kind !== "mean" || !raw[task.id] || typeof raw[task.id] !== "object") return;
      var model = tableModel(compiled, task);
      var src = raw[task.id];
      var state = emptyWeighted();
      if (Array.isArray(src.knownProducts)) {
        state.knownProducts = src.knownProducts.map(Number).filter(function (index) {
          return index >= 0 && index < model.terms.length && model.terms[index].product !== 0;
        });
      }
      if (Array.isArray(src.knownFrequencies)) {
        state.knownFrequencies = src.knownFrequencies.map(Number).filter(function (index) {
          return index >= 0 && index < model.terms.length;
        });
      }
      if (src.weightedSum != null && sameInt(src.weightedSum, model.weightedSum)) state.weightedSum = model.weightedSum;
      if (src.totalFrequency != null && sameInt(src.totalFrequency, model.totalFrequency)) state.totalFrequency = model.totalFrequency;
      state.expanded = !!src.expanded;
      state.collapsed = !!src.collapsed;
      state.quotient = !!src.quotient;
      out[task.id] = state;
    });
  });
  var base = tableModel(compiled);
  if (raw._shared && sameInt(raw._shared.weightedSum, base.weightedSum)) {
    out._shared = { weightedSum: base.weightedSum };
  }
  return out;
}

function readWeighted(progress, task, model) {
  var src = progress && progress.weighted && progress.weighted[task.id];
  var state = cleanWeighted(src);
  if (state.totalFrequency == null && progress && progress.solve && sameInt(progress.solve.total, model.totalFrequency)) {
    state.totalFrequency = model.totalFrequency;
  }
  var shared = progress && progress.weighted && progress.weighted._shared;
  if (state.weightedSum == null && shared && sameInt(shared.weightedSum, model.weightedSum)) {
    state.weightedSum = model.weightedSum;
  }
  return state;
}

function storeWeighted(progress, task, state) {
  var map = Object.assign({}, (progress && progress.weighted) || {});
  map[task.id] = cleanWeighted(state);
  return map;
}

function prepWeighted(text) {
  var s = normalize(text);
  s = s.replace(/[·⋅×]/g, "*");
  s = s.replace(/(\d)[xX](\d)/g, "$1*$2");
  s = s.replace(/[א-ת]+/g, "");
  return s;
}

function splitEquals(expr) {
  var depth = 0;
  var parts = [];
  var start = 0;
  var i;
  for (i = 0; i < expr.length; i++) {
    var ch = expr.charAt(i);
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "=" && depth === 0) {
      parts.push(expr.slice(start, i));
      start = i + 1;
    }
    if (depth < 0) return null;
  }
  if (depth !== 0) return null;
  parts.push(expr.slice(start));
  if (parts.some(function (part) { return part === ""; })) return null;
  return parts;
}

function parseAtoms(expr) {
  var s = stripOuter(String(expr || ""));
  if (!s) return null;
  var depth = 0;
  var start = 0;
  var parts = [];
  var i;
  for (i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "+" && depth === 0) {
      parts.push(s.slice(start, i));
      start = i + 1;
    }
    if (depth < 0) return null;
  }
  if (depth !== 0) return null;
  parts.push(s.slice(start));
  var atoms = [];
  for (i = 0; i < parts.length; i++) {
    var piece = stripOuter(parts[i]);
    if (!piece) return null;
    if (piece.indexOf("+") >= 0) {
      var inner = parseAtoms(piece);
      if (!inner) return null;
      atoms = atoms.concat(inner);
      continue;
    }
    var prod = /^(-?\d+(?:\.\d+)?)\*(-?\d+(?:\.\d+)?)$/.exec(piece);
    if (prod) {
      var left = parseNum(prod[1]);
      var right = parseNum(prod[2]);
      if (!left || !right || left.d !== 1 || right.d !== 1) return null;
      atoms.push({ kind: "product", a: left.n, b: right.n });
      continue;
    }
    var num = parseNum(piece);
    if (!num || num.d !== 1) return null;
    atoms.push({ kind: "number", value: num.n });
  }
  return atoms.length ? atoms : null;
}

function countBag(nums) {
  var bag = {};
  nums.forEach(function (num) {
    var key = String(num);
    bag[key] = (bag[key] || 0) + 1;
  });
  return bag;
}

function sameBag(a, b) {
  var keys = {};
  Object.keys(a).forEach(function (key) { keys[key] = true; });
  Object.keys(b).forEach(function (key) { keys[key] = true; });
  return Object.keys(keys).every(function (key) { return (a[key] || 0) === (b[key] || 0); });
}

function assignGroups(targets, items) {
  var used = items.map(function () { return false; });
  var chosen = [];
  var ordered = targets.slice().sort(function (a, b) { return b - a; });
  function place(group) {
    if (group === ordered.length) return true;
    return fill(group, 0, 0, []);
  }
  function fill(group, index, sum, picked) {
    if (sum === ordered[group] && picked.length) {
      var before = chosen.length;
      picked.forEach(function (itemIndex) {
        used[itemIndex] = true;
        chosen.push(items[itemIndex].index);
      });
      if (place(group + 1)) return true;
      picked.forEach(function (itemIndex) { used[itemIndex] = false; });
      chosen.length = before;
    }
    if (index >= items.length || sum > ordered[group]) return false;
    if (fill(group, index + 1, sum, picked)) return true;
    if (!used[index] && sum + items[index].value <= ordered[group]) {
      if (fill(group, index + 1, sum + items[index].value, picked.concat([index]))) return true;
    }
    return false;
  }
  if (!place(0)) return null;
  return chosen;
}

function productItems(model, skip) {
  return model.terms.filter(function (term) {
    return term.product !== 0 && (!skip || skip.indexOf(term.index) < 0);
  }).map(function (term) {
    return { value: term.product, index: term.index };
  });
}

function frequencyItems(model) {
  return model.terms.map(function (term) {
    return { value: term.frequency, index: term.index };
  });
}

function nonzeroIndexes(model) {
  return model.terms.filter(function (term) { return term.product !== 0; }).map(function (term) { return term.index; });
}

function coversNonzero(indexes, model) {
  return nonzeroIndexes(model).every(function (index) { return indexes.indexOf(index) >= 0; });
}

function uniqueIndexes(indexes) {
  var out = [];
  indexes.forEach(function (index) {
    if (out.indexOf(index) < 0) out.push(index);
  });
  return out;
}

function isShifted(pairs, model) {
  if (pairs.length !== model.terms.length) return false;
  var seen = {};
  var unique = pairs.every(function (pair) {
    if (seen[pair.a]) return false;
    seen[pair.a] = true;
    return model.terms.some(function (term) { return sameInt(term.value, pair.a); });
  });
  if (!unique) return false;
  var n = model.terms.length;
  var d;
  for (d = 1; d < n; d++) {
    var ok = pairs.every(function (pair) {
      var at = -1;
      model.terms.forEach(function (term, index) {
        if (sameInt(term.value, pair.a)) at = index;
      });
      return at >= 0 && sameInt(model.terms[(at + d) % n].frequency, pair.b);
    });
    if (ok) return true;
  }
  return false;
}

function diagnoseProduct(a, b, model) {
  var rowA = null;
  var rowB = null;
  model.terms.forEach(function (term) {
    if (sameInt(term.value, a)) rowA = term;
    if (sameInt(term.value, b)) rowB = term;
  });
  var freqA = model.terms.some(function (term) { return sameInt(term.frequency, a); });
  var freqB = model.terms.some(function (term) { return sameInt(term.frequency, b); });
  if (rowA && freqB && !sameInt(rowA.frequency, b)) return WRONG_COLUMN;
  if (rowB && freqA && !sameInt(rowB.frequency, a)) return WRONG_COLUMN;
  if (rowA && rowB && !freqA && !freqB) return "כפלתם שני ערכים. צריך לכפול כל ערך בשכיחות שלו.";
  if (freqA && freqB && !rowA && !rowB) return "כפלתם שכיחויות. צריך לכפול כל ערך בשכיחות שלו.";
  return FORGET_WEIGHT;
}

function takePair(slots, a, b) {
  var i;
  for (i = 0; i < slots.length; i++) {
    if (slots[i].used) continue;
    if (sameInt(slots[i].term.value, a) && sameInt(slots[i].term.frequency, b)) return slots[i];
  }
  for (i = 0; i < slots.length; i++) {
    if (slots[i].used) continue;
    if (!sameInt(a, b) && sameInt(slots[i].term.value, b) && sameInt(slots[i].term.frequency, a)) return slots[i];
  }
  return null;
}

function classifyProducts(atoms, model) {
  var pairs = atoms.filter(function (atom) { return atom.kind === "product"; });
  if (pairs.length === model.terms.length && isShifted(pairs, model) && pairs.some(function (pair) {
    return !model.terms.some(function (term) {
      return (sameInt(term.value, pair.a) && sameInt(term.frequency, pair.b)) ||
        (sameInt(term.value, pair.b) && sameInt(term.frequency, pair.a));
    });
  })) {
    return { error: SHIFT_PAIRS };
  }
  var slots = model.terms.map(function (term) { return { term: term, used: false }; });
  var indexes = [];
  var i;
  for (i = 0; i < pairs.length; i++) {
    var hit = takePair(slots, pairs[i].a, pairs[i].b);
    if (!hit) return { error: diagnoseProduct(pairs[i].a, pairs[i].b, model) };
    hit.used = true;
    indexes.push(hit.term.index);
  }
  var numbers = atoms.filter(function (atom) { return atom.kind === "number"; }).map(function (atom) { return atom.value; });
  if (numbers.length) {
    var left = productItems(model, indexes);
    var grouped = assignGroups(numbers, left);
    if (!grouped) return { error: FORGET_WEIGHT };
    indexes = indexes.concat(grouped);
  }
  indexes = uniqueIndexes(indexes);
  var symbolic = pairs.length > 0;
  return {
    kind: "products",
    complete: coversNonzero(indexes, model),
    indexes: indexes,
    symbolic: symbolic,
    value: indexes.reduce(function (sum, index) { return sum + model.terms[index].product; }, 0),
    atoms: atoms,
  };
}

function classifyNumbers(atoms, model) {
  var nums = atoms.map(function (atom) { return atom.value; });
  var values = model.terms.map(function (term) { return term.value; });
  var freqs = model.terms.map(function (term) { return term.frequency; });
  var products = model.terms.map(function (term) { return term.product; });
  var nonzero = products.filter(function (product) { return product !== 0; });
  var added = values.concat(freqs);
  var pairs = model.terms.map(function (term) { return term.value + term.frequency; });
  if (sameBag(countBag(nums), countBag(values))) return { kind: "values", complete: true, atoms: atoms };
  if (sameBag(countBag(nums), countBag(added))) return { kind: "added", complete: true, atoms: atoms };
  if (sameBag(countBag(nums), countBag(pairs))) return { kind: "addedPairs", complete: true, atoms: atoms };
  var asProducts = sameBag(countBag(nums), countBag(products)) || sameBag(countBag(nums), countBag(nonzero));
  var asFreq = sameBag(countBag(nums), countBag(freqs));
  if (asFreq && !asProducts) {
    return { kind: "frequencies", complete: true, indexes: model.terms.map(function (term) { return term.index; }), value: model.totalFrequency, atoms: atoms };
  }
  if (asProducts && !asFreq) {
    var allIndexes = model.terms.filter(function (term) { return term.product !== 0 || nums.indexOf(0) >= 0; }).map(function (term) { return term.index; });
    return { kind: "products", complete: true, indexes: nonzeroIndexes(model), symbolic: false, value: model.weightedSum, atoms: atoms, listed: allIndexes };
  }
  var prodAssign = assignGroups(nums, productItems(model));
  var freqAssign = assignGroups(nums, frequencyItems(model));
  if (prodAssign && !freqAssign) {
    return {
      kind: "products",
      complete: coversNonzero(prodAssign, model),
      indexes: prodAssign,
      symbolic: false,
      value: prodAssign.reduce(function (sum, index) { return sum + model.terms[index].product; }, 0),
      atoms: atoms,
    };
  }
  if (freqAssign && !prodAssign) {
    return {
      kind: "frequencies",
      complete: freqAssign.length === model.terms.length,
      indexes: freqAssign,
      value: freqAssign.reduce(function (sum, index) { return sum + model.terms[index].frequency; }, 0),
      atoms: atoms,
    };
  }
  if (prodAssign && freqAssign) {
    var prodComplete = coversNonzero(prodAssign, model);
    var freqComplete = freqAssign.length === model.terms.length;
    if (freqComplete && !prodComplete) {
      return { kind: "frequencies", complete: true, indexes: freqAssign, value: model.totalFrequency, atoms: atoms };
    }
    return {
      kind: "products",
      complete: prodComplete,
      indexes: prodAssign,
      symbolic: false,
      value: prodAssign.reduce(function (sum, index) { return sum + model.terms[index].product; }, 0),
      atoms: atoms,
    };
  }
  return { error: FORGET_WEIGHT };
}

function classifySide(expr, model) {
  var atoms = parseAtoms(expr);
  if (!atoms) return { error: "אפשר לרשום מכפלות של ערך בשכיחות, את סכום השכיחויות, או את הממוצע." };
  if (atoms.length === 1 && atoms[0].kind === "number") {
    return { kind: "number", value: atoms[0].value, complete: true, atoms: atoms };
  }
  if (atoms.some(function (atom) { return atom.kind === "product"; })) return classifyProducts(atoms, model);
  return classifyNumbers(atoms, model);
}

function fractionProblem(num, den, model) {
  if (num.kind === "values" || num.kind === "added" || num.kind === "addedPairs") return num.kind === "addedPairs" ? ADDED_PAIRS : num.kind === "added" ? ADD_NOT_MUL : FORGET_WEIGHT;
  if (num.kind === "number" && sameInt(num.value, model.valueSum) && !sameInt(num.value, model.weightedSum)) return FORGET_WEIGHT;
  if (den.kind === "values") return VALUES_DEN;
  if (den.kind === "number" && sameInt(den.value, model.valueSum) && !sameInt(den.value, model.totalFrequency)) return VALUES_DEN;
  if (num.kind === "products" && !num.complete) return OMIT_COLUMN;
  if (den.kind === "frequencies" && !den.complete) return OMIT_FREQ;
  if (den.kind === "number" && sameInt(den.value, model.categoryCount) && !sameInt(den.value, model.totalFrequency)) return CATEGORY_DEN;
  if (num.kind === "number" && den.kind === "number" && sameInt(num.value, model.totalFrequency) && sameInt(den.value, model.weightedSum)) return SWAP_ENDS;
  if ((num.kind === "frequencies" && den.kind === "products") || (num.kind === "number" && den.kind === "products" && sameInt(num.value, model.totalFrequency))) return SWAP_ENDS;
  if (num.kind === "number" && den.kind === "number" && sameRat(rat(num.value, den.value), model.mean)) return null;
  var numOk = (num.kind === "number" && sameInt(num.value, model.weightedSum)) || (num.kind === "products" && num.complete);
  var denOk = (den.kind === "number" && sameInt(den.value, model.totalFrequency)) || (den.kind === "frequencies" && den.complete);
  if (numOk && !denOk) return NUM_OK_DEN_BAD;
  if (denOk && !numOk) return DEN_OK_NUM_BAD;
  if (!numOk || !denOk) return "השבר אינו הממוצע. המונה הוא סכום ערך×שכיחות, והמכנה הוא סכום השכיחויות.";
  return null;
}

function fractionStage(num, den, model) {
  if (num.kind === "number" && den.kind === "number" && sameInt(num.value, model.weightedSum) && sameInt(den.value, model.totalFrequency)) {
    return "quotient";
  }
  if (num.kind === "number" && den.kind === "number" && sameRat(rat(num.value, den.value), model.mean)) return "answer";
  if (num.kind === "products" && num.symbolic) return "formula";
  if (num.kind === "products" && den.kind === "number") return "collapsed";
  return "formula";
}

function formatAtoms(atoms) {
  return atoms.map(function (atom) {
    if (atom.kind === "product") return atom.a + "·" + atom.b;
    return String(atom.value);
  }).join("+");
}

function dotProducts(model) {
  return model.terms.map(function (term) { return term.value + "·" + term.frequency; }).join("+");
}

function freqText(model) {
  return model.terms.map(function (term) { return String(term.frequency); }).join("+");
}

function productText(model) {
  return model.terms.map(function (term) { return String(term.product); }).join("+");
}

function weightedResult(model) {
  return BAR + "=" + formatRat(model.mean);
}

function quotientText(model) {
  return BAR + "=" + model.weightedSum + "/" + model.totalFrequency;
}

function formulaText(model, total) {
  var den = total != null ? String(total) : "(" + freqText(model) + ")";
  return BAR + "=(" + dotProducts(model) + ")/" + den;
}

function collapsedText(model, total) {
  return BAR + "=(" + productText(model) + ")/" + total;
}

function stepResult(progress, task, state, extra) {
  return Object.assign({
    ok: true,
    weighted: storeWeighted(progress, task, state),
  }, extra);
}

function doneMean(model) {
  return { ok: true, done: true, shows: [weightedResult(model)], message: "" };
}

function acceptFraction(stage, model, state, progress, task) {
  if (stage === "answer") return doneMean(model);
  if (stage === "quotient") {
    state.weightedSum = model.weightedSum;
    state.totalFrequency = model.totalFrequency;
    state.quotient = true;
    state.knownProducts = nonzeroIndexes(model);
    return stepResult(progress, task, state, { done: false, shows: [quotientText(model)], message: "" });
  }
  if (stage === "collapsed") {
    state.collapsed = true;
    state.expanded = true;
    state.totalFrequency = model.totalFrequency;
    state.knownProducts = nonzeroIndexes(model);
    state.knownFrequencies = model.terms.map(function (term) { return term.index; });
    return stepResult(progress, task, state, { done: false, shows: [collapsedText(model, model.totalFrequency)], message: "" });
  }
  state.expanded = true;
  return stepResult(progress, task, state, { done: false, shows: [formulaText(model, state.totalFrequency)], message: "" });
}

function checkWeightedBare(num, model, state, progress, task) {
  if (sameRat(num, model.mean)) return doneMean(model);
  if (!num || num.d !== 1) return { ok: false, message: "זה לא הממוצע." };
  var value = num.n;
  if (sameInt(value, model.weightedSum)) {
    state.weightedSum = model.weightedSum;
    state.knownProducts = nonzeroIndexes(model);
    return stepResult(progress, task, state, {
      done: false,
      shows: [String(model.weightedSum)],
      message: "זה סכום ערך×שכיחות, לא הממוצע.",
    });
  }
  if (sameInt(value, model.totalFrequency)) {
    if (state.totalFrequency != null) {
      return { ok: true, done: false, shows: [], message: "את מספר הנתונים כבר מצאתם.", weighted: storeWeighted(progress, task, state) };
    }
    state.totalFrequency = model.totalFrequency;
    state.knownFrequencies = model.terms.map(function (term) { return term.index; });
    return stepResult(progress, task, state, {
      done: false,
      shows: [String(model.totalFrequency)],
      message: "זה מספר הנתונים הכולל, לא הממוצע.",
    });
  }
  if (sameInt(value, model.valueSum) && !sameInt(value, model.weightedSum)) return { ok: false, message: FORGET_WEIGHT };
  var hits = model.terms.filter(function (term) { return term.product !== 0 && sameInt(term.product, value); });
  var isValue = model.terms.some(function (term) { return sameInt(term.value, value); });
  if (hits.length === 1 && !isValue) {
    if (state.knownProducts.indexOf(hits[0].index) < 0) state.knownProducts = state.knownProducts.concat([hits[0].index]);
    return stepResult(progress, task, state, { done: false, shows: [String(value)], message: "" });
  }
  if (isValue) return { ok: false, message: "זה אחד מערכי המשתנה, לא הממוצע." };
  if (sameInt(value, model.categoryCount) && !sameInt(value, model.totalFrequency)) return { ok: false, message: CATEGORY_DEN };
  return { ok: false, message: "זה לא הממוצע." };
}

function checkExprEquals(info, right, model, state, progress, task) {
  if (info.error) return { ok: false, message: info.error };
  if (info.kind === "values") return { ok: false, message: FORGET_WEIGHT };
  if (info.kind === "added") return { ok: false, message: ADD_NOT_MUL };
  if (info.kind === "addedPairs") return { ok: false, message: ADDED_PAIRS };
  if (!right || right.d !== 1) {
    if (right && sameRat(right, model.mean) && info.kind === "products" && info.complete) return doneMean(model);
    return { ok: false, message: "בדקו את התוצאה." };
  }
  var claimed = right.n;
  if (info.kind === "products") {
    if (info.atoms.length === 1 && info.atoms[0].kind === "product") {
      var only = info.indexes[0];
      var term = model.terms[only];
      if (!sameInt(claimed, term.product)) return { ok: false, message: "המכפלה נכונה, אבל התוצאה שגויה." };
      if (term.product !== 0 && state.knownProducts.indexOf(only) < 0) state.knownProducts = state.knownProducts.concat([only]);
      return stepResult(progress, task, state, { done: false, shows: [term.value + "·" + term.frequency + "=" + term.product], message: "" });
    }
    if (info.complete && sameInt(claimed, model.weightedSum)) {
      state.weightedSum = model.weightedSum;
      state.knownProducts = nonzeroIndexes(model);
      return stepResult(progress, task, state, { done: false, shows: [formatAtoms(info.atoms) + "=" + model.weightedSum], message: "" });
    }
    if (info.complete) return { ok: false, message: PRODUCTS_SUM_BAD };
    if (sameInt(claimed, info.value)) {
      state.knownProducts = uniqueIndexes(state.knownProducts.concat(info.indexes));
      return stepResult(progress, task, state, { done: false, shows: [formatAtoms(info.atoms) + "=" + claimed], message: "" });
    }
    if (sameInt(claimed, model.weightedSum)) return { ok: false, message: OMIT_COLUMN };
    return { ok: false, message: info.indexes.length ? "החיבור של המכפלות שרשמתם שגוי." : FORGET_WEIGHT };
  }
  if (info.kind === "frequencies") {
    if (info.complete && sameInt(claimed, model.totalFrequency)) {
      state.totalFrequency = model.totalFrequency;
      state.knownFrequencies = model.terms.map(function (term) { return term.index; });
      return stepResult(progress, task, state, { done: false, shows: [formatAtoms(info.atoms) + "=" + model.totalFrequency], message: "" });
    }
    if (info.complete) return { ok: false, message: FREQ_SUM_BAD };
    if (sameInt(claimed, info.value)) {
      state.knownFrequencies = uniqueIndexes(state.knownFrequencies.concat(info.indexes));
      return stepResult(progress, task, state, { done: false, shows: [formatAtoms(info.atoms) + "=" + claimed], message: "" });
    }
    if (sameInt(claimed, model.totalFrequency)) return { ok: false, message: OMIT_FREQ };
    return { ok: false, message: "החיבור של השכיחויות שרשמתם שגוי." };
  }
  return { ok: false, message: FORGET_WEIGHT };
}

function checkExpression(info, model, state, progress, task) {
  if (info.error) return { ok: false, message: info.error };
  if (info.kind === "values") return { ok: false, message: FORGET_WEIGHT };
  if (info.kind === "added") return { ok: false, message: ADD_NOT_MUL };
  if (info.kind === "addedPairs") return { ok: false, message: ADDED_PAIRS };
  if (info.kind === "products") {
    state.knownProducts = uniqueIndexes(state.knownProducts.concat(info.indexes));
    return stepResult(progress, task, state, { done: false, shows: [formatAtoms(info.atoms)], message: "" });
  }
  if (info.kind === "frequencies") {
    state.knownFrequencies = uniqueIndexes(state.knownFrequencies.concat(info.indexes));
    return stepResult(progress, task, state, { done: false, shows: [formatAtoms(info.atoms)], message: "" });
  }
  return { ok: false, message: FORGET_WEIGHT };
}

function checkTable(compiled, task, typed, progress) {
  var model = tableModel(compiled, task);
  if (!model.terms.length || !model.mean) return { ok: false, message: "ממוצע מתוך טבלה מתאים למשתנה מספרי." };
  var state = readWeighted(progress, task, model);
  var text = peelEdgeEquals(prepWeighted(typed));
  if (!text) return { ok: false, message: "רשמו את החישוב." };
  var sides = splitEquals(text);
  if (!sides) return { ok: false, message: "בדקו את הביטוי." };
  if (sides.length > 2) return { ok: false, message: "בדקו את הביטוי." };
  if (sides.length === 2) {
    var right = parseNum(sides[1]);
    var frac = splitFrac(stripOuter(sides[0]));
    if (frac) {
      var numInfo = classifySide(frac.num, model);
      var denInfo = classifySide(frac.den, model);
      if (numInfo.error) return { ok: false, message: numInfo.error };
      if (denInfo.error) return { ok: false, message: denInfo.error };
      var problem = fractionProblem(numInfo, denInfo, model);
      if (problem) return { ok: false, message: problem };
      if (right && sameRat(right, model.mean)) return doneMean(model);
      return { ok: false, message: "השבר נכון, אבל התוצאה שגויה." };
    }
    var leftInfo = classifySide(sides[0], model);
    return checkExprEquals(leftInfo, right, model, state, progress, task);
  }
  var onlyFrac = splitFrac(stripOuter(sides[0]));
  if (onlyFrac) {
    var numSide = classifySide(onlyFrac.num, model);
    var denSide = classifySide(onlyFrac.den, model);
    if (numSide.error) return { ok: false, message: numSide.error };
    if (denSide.error) return { ok: false, message: denSide.error };
    var bad = fractionProblem(numSide, denSide, model);
    if (bad) return { ok: false, message: bad };
    return acceptFraction(fractionStage(numSide, denSide, model), model, state, progress, task);
  }
  var bare = parseNum(sides[0]);
  if (bare && stripOuter(sides[0]) === sides[0]) return checkWeightedBare(bare, model, state, progress, task);
  return checkExpression(classifySide(sides[0], model), model, state, progress, task);
}

function nextTable(compiled, task, progress) {
  var model = tableModel(compiled, task);
  if (!model.mean) return null;
  var state = readWeighted(progress, task, model);
  var total = state.totalFrequency;
  var sum = state.weightedSum;
  if (state.quotient && sum != null && total != null) {
    return { line: weightedResult(model), done: true, weighted: storeWeighted(progress, task, state) };
  }
  if (sum != null && total != null) {
    state.quotient = true;
    return { line: quotientText(model), done: false, weighted: storeWeighted(progress, task, state) };
  }
  if (sum != null && total == null) {
    state.totalFrequency = model.totalFrequency;
    state.knownFrequencies = model.terms.map(function (term) { return term.index; });
    return { line: freqText(model) + "=" + model.totalFrequency, done: false, weighted: storeWeighted(progress, task, state) };
  }
  var pending = model.terms.filter(function (term) {
    return term.product !== 0 && state.knownProducts.indexOf(term.index) < 0;
  });
  if (state.knownProducts.length && pending.length && !state.collapsed) {
    var nxt = pending[0];
    state.knownProducts = state.knownProducts.concat([nxt.index]);
    return { line: nxt.value + "·" + nxt.frequency + "=" + nxt.product, done: false, weighted: storeWeighted(progress, task, state) };
  }
  if (!pending.length && state.knownProducts.length && sum == null && !state.collapsed) {
    state.weightedSum = model.weightedSum;
    return { line: productText(model) + "=" + model.weightedSum, done: false, weighted: storeWeighted(progress, task, state) };
  }
  if (state.knownFrequencies.length && !state.knownProducts.length && total == null && sum == null && !state.expanded) {
    state.totalFrequency = model.totalFrequency;
    state.knownFrequencies = model.terms.map(function (term) { return term.index; });
    return { line: freqText(model) + "=" + model.totalFrequency, done: false, weighted: storeWeighted(progress, task, state) };
  }
  if (!state.expanded && !state.knownProducts.length) {
    state.expanded = true;
    return { line: formulaText(model, total), done: false, weighted: storeWeighted(progress, task, state) };
  }
  if (!state.collapsed) {
    state.collapsed = true;
    state.expanded = true;
    state.totalFrequency = model.totalFrequency;
    state.knownProducts = nonzeroIndexes(model);
    state.knownFrequencies = model.terms.map(function (term) { return term.index; });
    return { line: collapsedText(model, model.totalFrequency), done: false, weighted: storeWeighted(progress, task, state) };
  }
  state.weightedSum = model.weightedSum;
  state.totalFrequency = model.totalFrequency;
  state.quotient = true;
  return { line: quotientText(model), done: false, weighted: storeWeighted(progress, task, state) };
}

function hintTable(compiled, task, progress) {
  var model = tableModel(compiled, task);
  var state = readWeighted(progress, task, model);
  if (state.weightedSum != null && state.totalFrequency != null) return HINT_DIV;
  if (state.totalFrequency != null && state.weightedSum == null) return HINT_NUM;
  if (state.weightedSum != null && state.totalFrequency == null) return HINT_DEN;
  if (!state.knownProducts.length && state.knownFrequencies.length === model.terms.length) return HINT_DEN;
  if (!state.knownProducts.length && state.knownFrequencies.length) return "המשיכו לחבר את שאר השכיחויות.";
  if (state.knownProducts.length && !coversNonzero(state.knownProducts, model)) return "המשיכו לכפול את שאר הערכים בשכיחות שלהם.";
  return HINT_START;
}

module.exports = {
  handle: handle,
  openingView: openingView,
  observations: observations,
  measure: measure,
  selectItems: selectItems,
  truthOf: truthOf,
  checkMeanText: checkMeanText,
  checkTable: checkTable,
  nextTable: nextTable,
  hintTable: hintTable,
  sanitizeTable: sanitizeTable,
  listHint: hintFor,
  listStep: nextAction,
  listApply: applyResult,
  sanitizeList: function (task, raw) {
    return sanitizeState(raw, truthOf(task));
  },
};
