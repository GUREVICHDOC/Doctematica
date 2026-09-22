"use strict";

var loadEngine = require("./load-engine").loadEngine;
var studentDto = require("./student-dto");
var freq = require("./freq-table");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function main() {
  var engine = loadEngine();
  var checks = [];
  function add(result) {
    checks.push(result);
  }

  var levels = engine.DoctematicaCurriculum.levels || [];
  var page = levels.filter(function (level) { return level.id === "stat-freq-1"; })[0];
  add(page && page.topic === "statistics" && page.subtopic === "freq-table" && page.mode === "freq-table"
    ? { ok: true, id: "page-hierarchy" }
    : fail("page-hierarchy", page && page.topic));
  add(page && page.exercises.length === 2 ? { ok: true, id: "two-exercises" } : fail("two-exercises", ""));
  add(page && page.exercises[0].id === "stat-freq-1-ex-a001" && page.exercises[1].id === "stat-freq-1-ex-a002"
    ? { ok: true, id: "stable-ids" }
    : fail("stable-ids", ""));

  var topics = engine.DoctematicaProblems.topics.map(function (topic) { return topic.id; });
  add(topics.indexOf("statistics") >= 0 ? { ok: true, id: "topic-listed" } : fail("topic-listed", topics.join(",")));
  var subs = engine.DoctematicaProblems.subtopics.statistics || [];
  add(subs.length === 1 && subs[0].id === "freq-table" && subs[0].label === "טבלת שכיחויות"
    ? { ok: true, id: "subtopic-listed" }
    : fail("subtopic-listed", JSON.stringify(subs)));
  add(topics.indexOf("equations") >= 0 && topics.indexOf("analytic") >= 0
    ? { ok: true, id: "old-topics-remain" }
    : fail("old-topics-remain", topics.join(",")));

  var catalog = studentDto.catalog(engine);
  var cat = catalog.levels.filter(function (level) { return level.id === "stat-freq-1"; })[0];
  add(cat && cat.topic === "statistics" && cat.subtopic === "freq-table"
    ? { ok: true, id: "catalog-level" }
    : fail("catalog-level", JSON.stringify(cat && { topic: cat.topic, subtopic: cat.subtopic })));
  add(cat && cat.exercises[0].displayNumber === 1 && cat.exercises[1].displayNumber === 2 &&
    cat.exercises[0].exerciseId === "stat-freq-1-ex-a001"
    ? { ok: true, id: "catalog-display" }
    : fail("catalog-display", JSON.stringify(cat && cat.exercises)));

  var opened = studentDto.openProblem(engine, "stat-freq-1", 0);
  var dumped = JSON.stringify(opened);
  add(opened && opened.problem && opened.problem.mode === "freq-table" && opened.problem.displayNumber === 1
    ? { ok: true, id: "open-first" }
    : fail("open-first", dumped.slice(0, 200)));
  add(opened.problem.table && opened.problem.table.variableLabel === "היום בשבוע" &&
    opened.problem.table.rows.length === 6 && opened.problem.parts.length === 5
    ? { ok: true, id: "open-table-public" }
    : fail("open-table-public", ""));
  add(opened.problem.parts[0].text && !opened.problem.parts[0].tasks
    ? { ok: true, id: "parts-have-no-tasks" }
    : fail("parts-have-no-tasks", JSON.stringify(opened.problem.parts[0])));
  add(!opened.problem.table.scale && dumped.indexOf("\"kind\"") < 0 && dumped.indexOf("weightedSum") < 0 && dumped.indexOf("\"where\"") < 0
    ? { ok: true, id: "open-hides-solver" }
    : fail("open-hides-solver", dumped));
  add(opened.view && opened.view.part && opened.view.part.label === "א" && opened.view.input === "text" && !opened.view.solved
    ? { ok: true, id: "opening-view" }
    : fail("opening-view", JSON.stringify(opened.view)));
  add(opened.view.ask === "מהי השורה המייצגת את המשתנה ומהי השורה המייצגת את השכיחות?"
    ? { ok: true, id: "opening-ask" }
    : fail("opening-ask", opened.view.ask));

  var second = studentDto.openProblem(engine, "stat-freq-1", 1);
  add(second && second.problem.exerciseId === "stat-freq-1-ex-a002" && second.problem.displayNumber === 2 &&
    second.problem.table.variableLabel === "מספר הילדים במשפחה"
    ? { ok: true, id: "open-second" }
    : fail("open-second", JSON.stringify(second && second.problem && second.problem.table)));
  add(second.view && second.view.ask === "איזו שורה מייצגת את המשתנה, ואיזו שורה מייצגת את השכיחות?"
    ? { ok: true, id: "ex2-opening-ask" }
    : fail("ex2-opening-ask", second.view && second.view.ask));

  function check(id, typed, progress) {
    return freq.handle(engine, {
      levelId: "stat-freq-1",
      exerciseId: id,
      intent: "check",
      typed: typed,
      progress: progress || { done: {}, phase: {}, found: {} },
    });
  }

  var both = check("stat-freq-1-ex-a001", "המשתנה: היום בשבוע, השכיחות: מספר ההודעות");
  add(both.ok && both.progress.done.var && both.progress.done.freq && !both.progress.done.scale && both.status === "task"
    ? { ok: true, id: "identify-both" }
    : fail("identify-both", JSON.stringify({ ok: both.ok, done: both.progress && both.progress.done, status: both.status, msg: both.message })));
  add(both.view && both.view.ask === "האם המשתנה הוא כמותי או איכותי?"
    ? { ok: true, id: "ask-advances-to-scale" }
    : fail("ask-advances-to-scale", both.view && both.view.ask));
  var scale = check("stat-freq-1-ex-a001", "איכותי", both.progress);
  add(scale.ok && scale.progress.done.scale && scale.view.part.label === "ב"
    ? { ok: true, id: "scale-qualitative-advances" }
    : fail("scale-qualitative-advances", JSON.stringify({ ok: scale.ok, view: scale.view, done: scale.progress && scale.progress.done, msg: scale.message })));
  var wrongScale = check("stat-freq-1-ex-a001", "כמותי", both.progress);
  add(wrongScale.ok === false ? { ok: true, id: "scale-reject" } : fail("scale-reject", wrongScale.message));
  var swapped = check("stat-freq-1-ex-a001", "מספר המשפחות");
  add(swapped.ok === false ? { ok: true, id: "identify-reject-other-table" } : fail("identify-reject-other-table", ""));

  var byId = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a002",
    exerciseIndex: 0,
    n: 1,
    intent: "check",
    typed: "מספר הילדים במשפחה",
    progress: { done: {}, phase: {}, found: {} },
  });
  add(byId.ok && byId.progress.done.var ? { ok: true, id: "exercise-id-wins" } : fail("exercise-id-wins", byId.message));

  function runExercise(id, steps) {
    var progress = { done: {}, phase: {}, found: {} };
    var last = null;
    steps.forEach(function (step) {
      last = freq.handle(engine, {
        levelId: "stat-freq-1",
        exerciseId: id,
        intent: step.intent || "check",
        typed: step.typed,
        progress: progress,
      });
      if (last.progress) progress = last.progress;
      add(step.expect(last)
        ? { ok: true, id: step.id }
        : fail(step.id, JSON.stringify({
          ok: last.ok,
          status: last.status,
          message: last.message,
          shows: last.shows,
          part: last.part,
          view: last.view && { label: last.view.part && last.view.part.label, input: last.view.input, solved: last.view.solved },
        })));
    });
    return last;
  }

  runExercise("stat-freq-1-ex-a001", [
    { id: "ex1-headers", typed: "היום בשבוע", expect: function (r) { return r.ok && r.progress.done.var && !r.progress.done.freq && r.view.ask === "מהי השורה המייצגת את המשתנה ומהי השורה המייצגת את השכיחות?"; } },
    { id: "ex1-freq-header", typed: "מספר ההודעות", expect: function (r) { return r.ok && r.progress.done.freq && r.view.ask === "האם המשתנה הוא כמותי או איכותי?"; } },
    { id: "ex1-scale", typed: "משתנה איכותי", expect: function (r) { return r.ok && r.view.part.label === "ב" && r.view.ask === "כמה הודעות קיבל יונתן ביום ה'?"; } },
    { id: "ex1-lookup", typed: "25 הודעות", expect: function (r) { return r.ok && r.shows[0] === "25" && r.view.part.label === "ג"; } },
  ]);

  var atLookup = check("stat-freq-1-ex-a001", "25", scale.progress);
  var freshSum = check("stat-freq-1-ex-a001", "54", atLookup.progress);
  add(freshSum.ok && freshSum.progress.done.first3 && freshSum.shows[0] === "54"
    ? { ok: true, id: "sum-direct" }
    : fail("sum-direct", JSON.stringify({ ok: freshSum.ok, shows: freshSum.shows, msg: freshSum.message, done: freshSum.progress && freshSum.progress.done })));
  var expr = check("stat-freq-1-ex-a001", "30 + 15 + 9", atLookup.progress);
  add(expr.ok && !expr.progress.done.first3 && expr.progress.phase.first3 === "expr" && expr.shows[0] === "15 + 9 + 30"
    ? { ok: true, id: "sum-expr-any-order" }
    : fail("sum-expr-any-order", JSON.stringify({ ok: expr.ok, shows: expr.shows, phase: expr.progress && expr.progress.phase, msg: expr.message })));
  var grouped = check("stat-freq-1-ex-a001", "24 + 30", atLookup.progress);
  add(grouped.ok && grouped.shows[0] === "24 + 30" && !grouped.progress.done.first3
    ? { ok: true, id: "sum-grouped" }
    : fail("sum-grouped", JSON.stringify({ ok: grouped.ok, shows: grouped.shows, msg: grouped.message })));
  var groupedDone = check("stat-freq-1-ex-a001", "24 + 30 = 54", atLookup.progress);
  add(groupedDone.ok && groupedDone.progress.done.first3 && groupedDone.shows.length === 1 && groupedDone.shows[0] === "24 + 30 = 54" && !groupedDone.joinPrev
    ? { ok: true, id: "sum-grouped-equals" }
    : fail("sum-grouped-equals", JSON.stringify({ ok: groupedDone.ok, shows: groupedDone.shows, msg: groupedDone.message })));
  var badPartition = check("stat-freq-1-ex-a001", "50 + 4", atLookup.progress);
  add(badPartition.ok === false ? { ok: true, id: "sum-reject-unrelated" } : fail("sum-reject-unrelated", ""));
  var partialOnly = check("stat-freq-1-ex-a001", "15 + 9", atLookup.progress);
  add(partialOnly.ok === false ? { ok: true, id: "sum-reject-incomplete" } : fail("sum-reject-incomplete", partialOnly.message));
  var afterExpr = check("stat-freq-1-ex-a001", "54", expr.progress);
  add(afterExpr.ok && afterExpr.progress.done.first3 && !afterExpr.joinPrev && afterExpr.shows[0] === "54"
    ? { ok: true, id: "sum-after-expr" }
    : fail("sum-after-expr", afterExpr.message));
  var leadEquals = check("stat-freq-1-ex-a001", "=54", atLookup.progress);
  add(leadEquals.ok && leadEquals.progress.done.first3 && leadEquals.shows[0] === "54" && !leadEquals.joinPrev
    ? { ok: true, id: "sum-leading-equals" }
    : fail("sum-leading-equals", JSON.stringify({ ok: leadEquals.ok, shows: leadEquals.shows, join: leadEquals.joinPrev, msg: leadEquals.message })));
  var continueEquals = check("stat-freq-1-ex-a001", "= 54", expr.progress);
  add(continueEquals.ok && continueEquals.joinPrev && continueEquals.shows[0] === "54" && continueEquals.progress.done.first3
    ? { ok: true, id: "sum-continue-equals" }
    : fail("sum-continue-equals", JSON.stringify({ ok: continueEquals.ok, shows: continueEquals.shows, join: continueEquals.joinPrev, msg: continueEquals.message })));
  var trailEquals = check("stat-freq-1-ex-a001", "54=", expr.progress);
  add(trailEquals.ok && trailEquals.joinPrev ? { ok: true, id: "sum-trailing-equals" } : fail("sum-trailing-equals", trailEquals.message));
  add(check("stat-freq-1-ex-a001", "=50", expr.progress).ok === false
    ? { ok: true, id: "sum-leading-equals-wrong" }
    : fail("sum-leading-equals-wrong", ""));
  var oneLine = check("stat-freq-1-ex-a001", "15 + 9 + 30 = 54", atLookup.progress);
  add(oneLine.ok && oneLine.shows.length === 1 && oneLine.shows[0] === "15 + 9 + 30 = 54" && !oneLine.joinPrev
    ? { ok: true, id: "sum-one-line" }
    : fail("sum-one-line", JSON.stringify(oneLine.shows)));
  var lookupEquals = check("stat-freq-1-ex-a001", "=25", scale.progress);
  add(lookupEquals.ok && lookupEquals.shows[0] === "25" && !lookupEquals.joinPrev
    ? { ok: true, id: "lookup-leading-equals" }
    : fail("lookup-leading-equals", JSON.stringify({ ok: lookupEquals.ok, shows: lookupEquals.shows, msg: lookupEquals.message })));

  var hintStart = freq.handle(engine, {
    levelId: "stat-freq-1", exerciseId: "stat-freq-1-ex-a001", intent: "hint",     progress: atLookup.progress,
  });
  add(hintStart.ok && hintStart.message.indexOf("54") < 0 && hintStart.message.indexOf("15 + 9") < 0 && /שכיח/.test(hintStart.message)
    ? { ok: true, id: "sum-hint-before" }
    : fail("sum-hint-before", hintStart.message));
  var hintAfter = freq.handle(engine, {
    levelId: "stat-freq-1", exerciseId: "stat-freq-1-ex-a001", intent: "hint", progress: expr.progress,
  });
  add(hintAfter.ok && hintAfter.message.indexOf("54") < 0 && /חבר/.test(hintAfter.message)
    ? { ok: true, id: "sum-hint-after" }
    : fail("sum-hint-after", hintAfter.message));
  var one = freq.handle(engine, {
    levelId: "stat-freq-1", exerciseId: "stat-freq-1-ex-a001", intent: "step",     progress: atLookup.progress,
  });
  add(one.ok && one.shows[0] === "15 + 9 + 30" && one.status === "step" && !one.view.solved && !one.joinPrev
    ? { ok: true, id: "sum-onestep-expr" }
    : fail("sum-onestep-expr", JSON.stringify({ shows: one.shows, status: one.status, msg: one.message })));
  var two = freq.handle(engine, {
    levelId: "stat-freq-1", exerciseId: "stat-freq-1-ex-a001", intent: "step", progress: one.progress,
  });
  add(two.ok && two.shows[0] === "54" && two.joinPrev && two.progress.done.first3
    ? { ok: true, id: "sum-onestep-total" }
    : fail("sum-onestep-total", JSON.stringify({ shows: two.shows, join: two.joinPrev, done: two.progress && two.progress.done, msg: two.message })));

  var modeHint = freq.handle(engine, {
    levelId: "stat-freq-1", exerciseId: "stat-freq-1-ex-a001", intent: "hint", progress: two.progress,
  });
  add(modeHint.ok && modeHint.message.indexOf("התשובה") < 0 && /גדול/.test(modeHint.message)
    ? { ok: true, id: "mode-hint" }
    : fail("mode-hint", modeHint.message));
  var mode = check("stat-freq-1-ex-a001", "ג", two.progress);
  add(mode.ok && mode.progress.done["mode-day"] && mode.view.part.label === "ה"
    ? { ok: true, id: "mode-value" }
    : fail("mode-value", JSON.stringify({ ok: mode.ok, msg: mode.message, view: mode.view })));
  var modeFreq = check("stat-freq-1-ex-a001", "30", two.progress);
  add(modeFreq.ok === false && /משתנה/.test(modeFreq.message)
    ? { ok: true, id: "mode-rejects-frequency" }
    : fail("mode-rejects-frequency", modeFreq.message));

  var daysPartial = check("stat-freq-1-ex-a001", "ו וה ה", mode.progress);
  add(daysPartial.ok && !daysPartial.progress.done.over15 && daysPartial.progress.found.over15.length === 2
    ? { ok: true, id: "filter-partial" }
    : fail("filter-partial", JSON.stringify({ ok: daysPartial.ok, found: daysPartial.progress && daysPartial.progress.found, msg: daysPartial.message })));
  var daysBad = check("stat-freq-1-ex-a001", "א", mode.progress);
  add(daysBad.ok === false ? { ok: true, id: "filter-rejects-boundary" } : fail("filter-rejects-boundary", daysBad.message));
  var days = check("stat-freq-1-ex-a001", "ו, ג, ה", mode.progress);
  add(days.ok && days.progress.done.over15 && days.view.solved
    ? { ok: true, id: "filter-freq-done" }
    : fail("filter-freq-done", JSON.stringify({ ok: days.ok, solved: days.view && days.view.solved, msg: days.message, shows: days.shows })));

  var lookupHint = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a002",
    intent: "hint",
    progress: { done: { var: true, freq: true }, phase: {}, found: {} },
  });
  add(lookupHint.ok && lookupHint.message.indexOf("5") < 0
    ? { ok: true, id: "lookup-hint-hides-number" }
    : fail("lookup-hint-hides-number", lookupHint.message));

  runExercise("stat-freq-1-ex-a002", [
    { id: "ex2-var", typed: "מספר הילדים במשפחה", expect: function (r) { return r.ok && r.progress.done.var && r.view.ask === "איזו שורה מייצגת את המשתנה, ואיזו שורה מייצגת את השכיחות?"; } },
    { id: "ex2-freq", typed: "מספר המשפחות", expect: function (r) { return r.ok && r.view.part.label === "ב" && r.view.ask === "לכמה משפחות יש 4 ילדים?"; } },
    { id: "ex2-four", typed: "5", expect: function (r) { return r.ok && r.view.part.label === "ג"; } },
    { id: "ex2-zero", typed: "2", expect: function (r) { return r.ok && r.view.part.label === "ד"; } },
    { id: "ex2-lt3-expr", typed: "2 + 1 + 6", expect: function (r) { return r.ok && r.status === "step" && !r.progress.done.lt3; } },
    { id: "ex2-lt3", typed: "9", expect: function (r) { return r.ok && r.progress.done.lt3; } },
    { id: "ex2-gt1", typed: "22", expect: function (r) { return r.ok && r.progress.done.gt1; } },
    { id: "ex2-in", typed: "6 + 8 = 14", expect: function (r) { return r.ok && r.progress.done["two-or-three"]; } },
    { id: "ex2-total-expr", typed: "2 + 1 + 6 + 8 + 5 + 3", expect: function (r) { return r.ok && r.status === "step"; } },
    { id: "ex2-total", typed: "25", expect: function (r) { return r.ok && r.view.part.label === "ח" && r.view.input === "yesno" && r.view.ask.indexOf("האם ביישוב זה ניתן לקבל תקציב זה?") >= 0 && r.view.ask.indexOf("\n") >= 0; } },
    { id: "ex2-yes-too-soon", typed: "כן", expect: function (r) { return r.ok === false; } },
    { id: "ex2-weighted", typed: "0·2 + 1·1 + 2·6 + 3·8 + 4·5 + 5·3", expect: function (r) { return r.ok && r.status === "step" && !r.progress.done.budget && r.view.ask.indexOf("האם ביישוב זה ניתן לקבל תקציב זה?") >= 0; } },
    { id: "ex2-children", typed: "72", expect: function (r) { return r.ok && r.progress.phase.budget === "value" && !r.progress.done.budget; } },
    { id: "ex2-no", typed: "לא", expect: function (r) { return r.ok && r.progress.done.budget && r.view.part.label === "ט"; } },
    { id: "ex2-mode", typed: "3", expect: function (r) { return r.ok && r.view.solved; } },
  ]);

  var budgetNow = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a002",
    intent: "check",
    typed: "לא",
    progress: {
      done: { var: true, freq: true, four: true, none: true, lt3: true, gt1: true, "two-or-three": true, families: true },
      phase: {},
      found: {},
    },
  });
  add(budgetNow.ok && budgetNow.progress.done.budget && budgetNow.view.part.label === "ט"
    ? { ok: true, id: "yesno-skip-to-verdict" }
    : fail("yesno-skip-to-verdict", JSON.stringify({ ok: budgetNow.ok, msg: budgetNow.message, view: budgetNow.view })));

  var solution = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a002",
    intent: "solution",
    progress: { done: {}, phase: {}, found: {} },
  });
  var solvedShows = (solution.lines || []).map(function (line) { return line.show; });
  add(solution.view && solution.view.solved && solvedShows.indexOf("לא") >= 0 && solvedShows.indexOf("72") >= 0 && solvedShows[solvedShows.length - 1] === "3"
    ? { ok: true, id: "full-solution-ex2" }
    : fail("full-solution-ex2", solvedShows.join(" | ")));
  var sumLine = (solution.lines || []).filter(function (line) { return line.show === "2 + 1 + 6"; })[0];
  var sumTotal = (solution.lines || []).filter(function (line) { return line.show === "9" && line.part === "ד"; })[0];
  add(sumLine && !sumLine.joinPrev && sumTotal && sumTotal.joinPrev
    ? { ok: true, id: "solution-shows-sum-then-result" }
    : fail("solution-shows-sum-then-result", solvedShows.join(" | ")));
  var weightedTotal = (solution.lines || []).filter(function (line) { return line.show === "72"; })[0];
  add(weightedTotal && weightedTotal.joinPrev
    ? { ok: true, id: "solution-joins-weighted" }
    : fail("solution-joins-weighted", solvedShows.join(" | ")));

  var grades = {
    variable: { label: "ציון" },
    frequency: { label: "מספר התלמידים" },
    rows: [
      { value: 60, freq: 4 },
      { value: 70, freq: 7 },
      { value: 80, freq: 7 },
      { value: 90, freq: 3 },
      { value: 100, freq: 1 },
    ],
  };

  function grade(task, typed, state) {
    return freq.assess(grades, task, typed, state);
  }

  add(grade({ kind: "identify", role: "variable" }, "ציון").done ? { ok: true, id: "alt-identify-var" } : fail("alt-identify-var", ""));
  add(grade({ kind: "identify", role: "frequency" }, "מספר התלמידים").done ? { ok: true, id: "alt-identify-freq" } : fail("alt-identify-freq", ""));
  add(!grade({ kind: "identify", role: "variable" }, "מספר התלמידים").ok ? { ok: true, id: "alt-identify-swap" } : fail("alt-identify-swap", ""));
  add(grade({ kind: "scale" }, "כמותי").done ? { ok: true, id: "alt-scale" } : fail("alt-scale", ""));
  add(grade({ kind: "lookup", value: 90 }, "3").done ? { ok: true, id: "alt-lookup" } : fail("alt-lookup", ""));
  add(!grade({ kind: "lookup", value: 90 }, "7").ok ? { ok: true, id: "alt-lookup-wrong" } : fail("alt-lookup-wrong", ""));
  var altExpr = grade({ id: "s", kind: "sumFreq", values: [60, 70] }, "4 + 7");
  add(altExpr.ok && !altExpr.done && altExpr.shows[0] === "4 + 7" ? { ok: true, id: "alt-sum-expr" } : fail("alt-sum-expr", JSON.stringify(altExpr)));
  add(grade({ kind: "sumFreq", values: [60, 70] }, "11").done ? { ok: true, id: "alt-sum-direct" } : fail("alt-sum-direct", ""));
  var altLead = grade({ id: "s", kind: "sumFreq", values: [60, 70] }, "=11");
  add(altLead.done && !altLead.joinPrev && altLead.shows[0] === "11" ? { ok: true, id: "alt-leading-equals" } : fail("alt-leading-equals", JSON.stringify(altLead)));
  var altJoin = grade({ id: "s", kind: "sumFreq", values: [60, 70] }, "=11", { phase: "expr" });
  add(altJoin.done && altJoin.joinPrev && altJoin.shows[0] === "11" ? { ok: true, id: "alt-continue-equals" } : fail("alt-continue-equals", JSON.stringify(altJoin)));
  add(!grade({ id: "s", kind: "sumFreq", values: [60, 70] }, "=12", { phase: "expr" }).ok
    ? { ok: true, id: "alt-continue-wrong" } : fail("alt-continue-wrong", ""));
  var altOne = grade({ id: "s", kind: "sumFreq", values: [60, 70] }, "7 + 4 = 11");
  add(altOne.done && altOne.shows.length === 1 && altOne.shows[0] === "4 + 7 = 11"
    ? { ok: true, id: "alt-one-line" } : fail("alt-one-line", JSON.stringify(altOne.shows)));
  add(!grade({ kind: "sumFreq", values: [60, 70] }, "5 + 6").ok ? { ok: true, id: "alt-sum-reject" } : fail("alt-sum-reject", ""));
  var tie = grade({ kind: "mode" }, "80 ו-70");
  add(tie.done ? { ok: true, id: "alt-mode-tie" } : fail("alt-mode-tie", JSON.stringify(tie)));
  var tiePart = grade({ id: "m", kind: "mode" }, "70");
  add(tiePart.ok && !tiePart.done ? { ok: true, id: "alt-mode-partial" } : fail("alt-mode-partial", JSON.stringify(tiePart)));
  add(grade({ id: "m", kind: "mode" }, "80", { found: ["70"] }).done ? { ok: true, id: "alt-mode-rest" } : fail("alt-mode-rest", ""));
  add(!grade({ kind: "mode" }, "60").ok ? { ok: true, id: "alt-mode-wrong" } : fail("alt-mode-wrong", ""));
  add(grade({ kind: "mode", of: "frequency" }, "7").done ? { ok: true, id: "alt-mode-freq" } : fail("alt-mode-freq", ""));
  var over = grade({ kind: "matchValues", where: { on: "frequency", op: "gt", value: 4 } }, "70, 80");
  add(over.done ? { ok: true, id: "alt-gt" } : fail("alt-gt", JSON.stringify(over)));
  add(grade({ kind: "matchValues", where: { on: "frequency", op: "gte", value: 7 } }, "80, 70").done
    ? { ok: true, id: "alt-gte" } : fail("alt-gte", ""));
  add(grade({ kind: "matchValues", where: { on: "frequency", op: "eq", value: 3 } }, "90").done
    ? { ok: true, id: "alt-eq" } : fail("alt-eq", ""));
  add(grade({ kind: "matchValues", where: { on: "frequency", op: "lt", value: 4 } }, "100 ו-90").done
    ? { ok: true, id: "alt-lt" } : fail("alt-lt", ""));
  add(grade({ kind: "matchValues", where: { on: "frequency", op: "lte", value: 1 } }, "100").done
    ? { ok: true, id: "alt-lte" } : fail("alt-lte", ""));
  add(grade({ kind: "matchValues", where: { on: "frequency", op: "gt", value: 100 } }, "אין").done
    ? { ok: true, id: "alt-empty" } : fail("alt-empty", ""));
  add(grade({ kind: "sumFreq", where: { on: "variable", op: "lt", value: 80 } }, "11").done
    ? { ok: true, id: "alt-filter-var" } : fail("alt-filter-var", ""));
  add(grade({ kind: "sumFreq", where: { on: "variable", op: "in", values: [90, 100] } }, "3 + 1").ok &&
    !grade({ kind: "sumFreq", where: { on: "variable", op: "in", values: [90, 100] } }, "3 + 1").done
    ? { ok: true, id: "alt-in-expr" } : fail("alt-in-expr", ""));
  add(grade({ kind: "sumFreq", where: { on: "variable", op: "in", values: [90, 100] } }, "4").done
    ? { ok: true, id: "alt-in-total" } : fail("alt-in-total", ""));
  add(grade({ kind: "sumFreq", where: { on: "variable", op: "gt", value: 100 } }, "0").done
    ? { ok: true, id: "alt-empty-sum" } : fail("alt-empty-sum", ""));
  add(grade({ kind: "total" }, "22").done ? { ok: true, id: "alt-total" } : fail("alt-total", ""));
  var weightedExpr = grade({ kind: "weightedSum" }, "60·4 + 70·7 + 80·7 + 90·3 + 100·1");
  add(weightedExpr.ok && !weightedExpr.done ? { ok: true, id: "alt-weighted-expr" } : fail("alt-weighted-expr", JSON.stringify(weightedExpr)));
  add(grade({ kind: "weightedSum" }, "1660").done ? { ok: true, id: "alt-weighted-total" } : fail("alt-weighted-total", ""));
  var altWeightedJoin = grade({ id: "w", kind: "weightedSum" }, "=1660", { phase: "expr" });
  add(altWeightedJoin.done && altWeightedJoin.joinPrev ? { ok: true, id: "alt-weighted-continue" } : fail("alt-weighted-continue", JSON.stringify(altWeightedJoin)));
  var altWeightedLine = grade({ kind: "weightedSum" }, "60·4 + 70·7 + 80·7 + 90·3 + 100·1 = 1660");
  add(altWeightedLine.done && altWeightedLine.shows.length === 1 && altWeightedLine.shows[0].indexOf("= 1660") > 0
    ? { ok: true, id: "alt-weighted-one-line" } : fail("alt-weighted-one-line", JSON.stringify(altWeightedLine.shows)));
  add(grade({ kind: "yesNo", calc: { kind: "weightedSum" }, op: "gt", value: 1000 }, "כן").done
    ? { ok: true, id: "alt-yes" } : fail("alt-yes", ""));
  add(!grade({ kind: "yesNo", calc: { kind: "weightedSum" }, op: "gt", value: 2000 }, "כן").ok
    ? { ok: true, id: "alt-yes-wrong" } : fail("alt-yes-wrong", ""));
  add(grade({ kind: "yesNo", calc: { kind: "weightedSum" }, op: "gt", value: 2000 }, "לא").done
    ? { ok: true, id: "alt-no" } : fail("alt-no", ""));
  add(grade({ kind: "yesNo", calc: { kind: "total" }, op: "eq", value: 22 }, "כן").done
    ? { ok: true, id: "alt-yes-total" } : fail("alt-yes-total", ""));
  var altHint = freq.hintText(grades, { kind: "sumFreq", values: [60, 70] }, {});
  add(altHint.indexOf("11") < 0 && altHint.indexOf("4 + 7") < 0 ? { ok: true, id: "alt-hint-hides-answer" } : fail("alt-hint-hides-answer", altHint));
  var altHint2 = freq.hintText(grades, { kind: "sumFreq", values: [60, 70] }, { phase: "expr" });
  add(altHint2.indexOf("11") < 0 ? { ok: true, id: "alt-hint-after-hides-total" } : fail("alt-hint-after-hides-total", altHint2));
  var step1 = freq.nextStep(grades, { kind: "sumFreq", where: { on: "variable", op: "lt", value: 80 } }, {});
  add(step1.line === "4 + 7" && step1.result && !step1.result.done ? { ok: true, id: "alt-step-expr" } : fail("alt-step-expr", JSON.stringify(step1)));
  var step2 = freq.nextStep(grades, { kind: "sumFreq", where: { on: "variable", op: "lt", value: 80 } }, { phase: "expr" });
  add(step2.line === "11" && step2.result && step2.result.done ? { ok: true, id: "alt-step-total" } : fail("alt-step-total", JSON.stringify(step2)));
  var named = {
    variable: { label: "מקצוע", scale: "qualitative" },
    frequency: { label: "תלמידים" },
    rows: [{ value: 1, freq: 3 }, { value: 2, freq: 5 }],
  };
  add(freq.assess(named, { kind: "scale" }, "איכותי").done && !freq.assess(named, { kind: "scale" }, "כמותי").ok
    ? { ok: true, id: "scale-override" }
    : fail("scale-override", ""));
  add(!freq.assess({ variable: { label: "יום" }, frequency: { label: "כמות" }, rows: [{ value: "א", freq: 2 }] }, { kind: "weightedSum" }, "2").ok
    ? { ok: true, id: "weighted-needs-numbers" }
    : fail("weighted-needs-numbers", ""));

  engine.DoctematicaCurriculum.levels.push({
    id: "stat-freq-ask-probe",
    topic: "statistics",
    subtopic: "freq-table",
    mode: "freq-table",
    title: "בדיקת שאלה פעילה",
    exercises: [
      {
        id: "stat-freq-ask-probe-ex-a001",
        n: 1,
        stem: "טבלת בדיקה.",
        table: {
          variable: { label: "ציון" },
          frequency: { label: "תלמידים" },
          rows: [{ value: 1, freq: 4 }, { value: 2, freq: 6 }],
        },
        parts: [
          {
            label: "א",
            text: "(1) מה נמדד כאן?\nפירוט קצר.\n(2) כמה תלמידים קיבלו ציון 1?",
            tasks: [
              { id: "measured", kind: "identify", role: "variable", q: 1 },
              { id: "count", kind: "lookup", value: 1, q: 2 },
            ],
          },
        ],
      },
    ],
  });
  var probeOpen = freq.openingView(engine, "stat-freq-ask-probe", 0, "stat-freq-ask-probe-ex-a001");
  add(probeOpen && probeOpen.ask === "מה נמדד כאן?\nפירוט קצר."
    ? { ok: true, id: "probe-ask-q1" }
    : fail("probe-ask-q1", probeOpen && probeOpen.ask));
  var probeNext = freq.handle(engine, {
    levelId: "stat-freq-ask-probe",
    exerciseId: "stat-freq-ask-probe-ex-a001",
    intent: "check",
    typed: "ציון",
    progress: { done: {}, phase: {}, found: {} },
  });
  add(probeNext.ok && probeNext.view.ask === "כמה תלמידים קיבלו ציון 1?"
    ? { ok: true, id: "probe-ask-q2" }
    : fail("probe-ask-q2", probeNext.view && probeNext.view.ask));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-freq-table: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) {
    console.log("FAIL " + item.id + " " + item.detail);
  });
  if (failed.length) process.exitCode = 1;
}

main();
