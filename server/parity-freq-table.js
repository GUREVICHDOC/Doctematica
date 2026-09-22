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
  add(page && page.exercises.length === 8 ? { ok: true, id: "eight-exercises" } : fail("eight-exercises", String(page && page.exercises.length)));
  add(page && page.exercises[0].id === "stat-freq-1-ex-a001" && page.exercises[1].id === "stat-freq-1-ex-a002" &&
    page.exercises[2].id === "stat-freq-1-ex-a003" && page.exercises[3].id === "stat-freq-1-ex-a004" &&
    page.exercises[4].id === "stat-freq-1-ex-a005" && page.exercises[5].id === "stat-freq-1-ex-a006" &&
    page.exercises[6].id === "stat-freq-1-ex-a007" && page.exercises[7].id === "stat-freq-1-ex-a008"
    ? { ok: true, id: "stable-ids" }
    : fail("stable-ids", ""));
  add(page.exercises[2].parts.map(function (part) { return part.label; }).join(",") === "א,ב,ד,ה,ו,ז,ח"
    ? { ok: true, id: "grades-parts-skip-gimel" }
    : fail("grades-parts-skip-gimel", page.exercises[2].parts.map(function (part) { return part.label; }).join(",")));

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
        fill: step.fill,
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

  var gradesEx = studentDto.openProblem(engine, "stat-freq-1", 2);
  var gradesDump = JSON.stringify(gradesEx);
  add(gradesEx && gradesEx.problem.exerciseId === "stat-freq-1-ex-a003" && gradesEx.problem.displayNumber === 3 &&
    gradesEx.problem.table.rows.length === 6 && gradesEx.problem.parts.length === 7 &&
    !gradesEx.problem.parts[1].tasks && gradesDump.indexOf("\"kind\"") < 0 && gradesDump.indexOf("\"where\"") < 0
    ? { ok: true, id: "grades-open-hides-solver" }
    : fail("grades-open-hides-solver", gradesDump.slice(0, 240)));
  add(gradesEx.view.ask === "קבעו עבור כל שורה (העליונה והתחתונה) האם היא מייצגת את המשתנה (התכונה הנבדקת) או מייצגת את השכיחות."
    ? { ok: true, id: "grades-opening-ask" }
    : fail("grades-opening-ask", gradesEx.view && gradesEx.view.ask));
  runExercise("stat-freq-1-ex-a003", [
    { id: "g-var", typed: "ציון", expect: function (r) { return r.ok && r.progress.done.var && !r.progress.done.freq; } },
    { id: "g-freq", typed: "מס' תלמידים", expect: function (r) { return r.ok && r.view.part.label === "ב" && r.view.ask === "האם המשתנה הוא איכותי או כמותי בדיד או כמותי רציף?"; } },
    { id: "g-scale-short", typed: "כמותי", expect: function (r) { return r.ok === false; } },
    { id: "g-scale-cont", typed: "כמותי רציף", expect: function (r) { return r.ok === false; } },
    { id: "g-scale", typed: "כמותי בדיד", expect: function (r) { return r.ok && r.shows[0] === "כמותי בדיד" && r.view.ask === "נמקו."; } },
    { id: "g-reason-thin", typed: "כי כן", expect: function (r) { return r.ok === false; } },
    { id: "g-reason", typed: "הערכים הם מספרים שלמים שאפשר לספור", expect: function (r) { return r.ok && r.view.part.label === "ד" && r.shows[0].indexOf("נפרדים") >= 0; } },
    { id: "g-50", typed: "4", expect: function (r) { return r.ok && r.view.part.label === "ה"; } },
    { id: "g-80", typed: "=12", expect: function (r) { return r.ok && r.shows[0] === "12" && r.view.part.label === "ו"; } },
    { id: "g-total-expr", typed: "4 + 3 + 5 + 12 + 6 + 2", expect: function (r) { return r.ok && r.status === "step"; } },
    { id: "g-total", typed: "=32", expect: function (r) { return r.ok && r.joinPrev && r.view.part.label === "ז"; } },
    { id: "g-above-expr", typed: "12 + 6 + 2", expect: function (r) { return r.ok && r.status === "step"; } },
    { id: "g-above", typed: "20", expect: function (r) { return r.ok && !r.joinPrev && r.view.part.label === "ח"; } },
    { id: "g-atmost-line", typed: "4 + 3 + 5 = 12", expect: function (r) { return r.ok && r.shows.length === 1 && r.shows[0] === "4 + 3 + 5 = 12" && r.view.solved; } },
  ]);
  var gradesHint = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a003",
    intent: "hint",
    progress: { done: { var: true, freq: true }, phase: {}, found: {} },
  });
  add(gradesHint.ok && gradesHint.message.indexOf("בדיד") < 0 && gradesHint.message.indexOf("רציף") < 0
    ? { ok: true, id: "grades-scale-hint-hides-choice" }
    : fail("grades-scale-hint-hides-choice", gradesHint.message));
  var gradesStep = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a003",
    intent: "step",
    progress: { done: { var: true, freq: true, scale: true }, phase: { why: "" }, found: {} },
  });
  add(gradesStep.ok && gradesStep.shows[0] === "ערכי המשתנה הם מספרים נפרדים שאפשר לספור."
    ? { ok: true, id: "grades-reason-step" }
    : fail("grades-reason-step", JSON.stringify(gradesStep.shows)));

  var heights = {
    variable: { label: "גובה" },
    frequency: { label: "תלמידים" },
    rows: [{ value: 1.5, freq: 3 }, { value: 1.7, freq: 4 }],
  };
  add(freq.assess(heights, { kind: "scale", depth: "full" }, "כמותי רציף").done
    && !freq.assess(heights, { kind: "scale", depth: "full" }, "כמותי בדיד").ok
    ? { ok: true, id: "scale-full-continuous" }
    : fail("scale-full-continuous", ""));
  add(freq.assess(heights, { kind: "reason", about: "scale" }, "הגובה מתקבל ממדידה ויכול לקבל כל ערך בקטע").done
    ? { ok: true, id: "reason-continuous" }
    : fail("reason-continuous", ""));
  add(!freq.assess(grades, { kind: "scale", depth: "full" }, "כמותי רציף").ok
    && freq.assess(grades, { kind: "scale", depth: "full" }, "כמותי בדיד").shows[0] === "כמותי בדיד"
    ? { ok: true, id: "scale-full-discrete-other-table" }
    : fail("scale-full-discrete-other-table", ""));
  add(freq.assess(grades, { kind: "scale" }, "כמותי").done
    ? { ok: true, id: "scale-short-still-quantitative" }
    : fail("scale-short-still-quantitative", ""));

  function fillHandle(id, fill, progress, intent) {
    return freq.handle(engine, {
      levelId: "stat-freq-1",
      exerciseId: id,
      intent: intent || "check",
      fill: fill,
      progress: progress || { done: {}, phase: {}, found: {}, filled: {} },
    });
  }
  function rowState(view, value) {
    var rows = view && view.table && view.table.rows || [];
    var i;
    for (i = 0; i < rows.length; i++) {
      if (String(rows[i].value) === String(value)) return rows[i];
    }
    return null;
  }
  var nutrition = studentDto.openProblem(engine, "stat-freq-1", 3);
  var nutritionDump = JSON.stringify(nutrition);
  add(nutrition && nutrition.problem.exerciseId === "stat-freq-1-ex-a004" && nutrition.problem.displayNumber === 4 &&
    nutrition.problem.data.length === 15 && nutrition.view.input === "cells" && nutrition.view.data.length === 15
    ? { ok: true, id: "nutrition-open" }
    : fail("nutrition-open", nutritionDump.slice(0, 240)));
  add(!/"freq":\s*\d/.test(nutritionDump) && nutrition.problem.parts.map(function (part) { return part.label; }).join(",") === "א,ב,ג"
    ? { ok: true, id: "nutrition-hides-freqs" }
    : fail("nutrition-hides-freqs", nutritionDump));
  var booksOpen = studentDto.openProblem(engine, "stat-freq-1", 4);
  var booksDump = JSON.stringify(booksOpen);
  add(booksOpen && booksOpen.problem.exerciseId === "stat-freq-1-ex-a005" && booksOpen.problem.data.length === 17 &&
    booksDump.indexOf("6") < 0 && !/"freq":\s*\d/.test(booksDump)
    ? { ok: true, id: "books-hides-freqs" }
    : fail("books-hides-freqs", booksDump.slice(0, 300)));

  var early = fillHandle("stat-freq-1-ex-a004", null, null);
  add(early.ok === false && early.view.part.label === "א"
    ? { ok: true, id: "fill-before-table-blocks-later" }
    : fail("fill-before-table-blocks-later", early.message));
  var typedLater = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a004",
    intent: "check",
    typed: "2",
    progress: { done: { fill: true }, phase: {}, found: {}, filled: {} },
  });
  add(typedLater.ok === false && typedLater.view.part.label === "א" && !typedLater.progress.done.fill
    ? { ok: true, id: "fill-ignores-forced-done" }
    : fail("fill-ignores-forced-done", JSON.stringify({ ok: typedLater.ok, part: typedLater.view && typedLater.view.part, done: typedLater.progress.done })));

  var offHigh = fillHandle("stat-freq-1-ex-a004", { value: 6, typed: "4" });
  add(offHigh.ok === false && offHigh.message.indexOf("מופע אחד נוסף") >= 0 && offHigh.message.indexOf("3") < 0
    ? { ok: true, id: "fill-off-by-one-high" }
    : fail("fill-off-by-one-high", offHigh.message));
  var offLow = fillHandle("stat-freq-1-ex-a004", { value: 6, typed: "2" });
  add(offLow.ok === false && offLow.message.indexOf("פספסתם מופע אחד") >= 0
    ? { ok: true, id: "fill-off-by-one-low" }
    : fail("fill-off-by-one-low", offLow.message));
  var far = fillHandle("stat-freq-1-ex-a004", { value: 6, typed: "9" });
  add(far.ok === false && far.message.indexOf("אינה נכונה") >= 0 && far.message.indexOf("מופע אחד") < 0 && far.message.indexOf("עודף") < 0
    ? { ok: true, id: "fill-far-generic" }
    : fail("fill-far-generic", far.message));
  var asValue = fillHandle("stat-freq-1-ex-a004", { value: 6, typed: "6" });
  add(asValue.ok === false && asValue.message.indexOf("הערך") >= 0 && asValue.message.indexOf("3") < 0
    ? { ok: true, id: "fill-entered-value" }
    : fail("fill-entered-value", asValue.message));
  var marked = fillHandle("stat-freq-1-ex-a004", { value: 8, typed: "4" }, {
    done: {}, phase: {}, found: {}, filled: {}, marks: [true, false, true],
  });
  add(marked.ok && marked.progress.filled["8"] === 4 && marked.progress.marks == null && rowState(marked.view, 8).locked &&
    rowState(marked.view, 6).freq == null
    ? { ok: true, id: "fill-marks-do-not-affect-check" }
    : fail("fill-marks-do-not-affect-check", JSON.stringify({ ok: marked.ok, filled: marked.progress.filled, msg: marked.message })));

  var order = [10, 8, 9, 7, 6];
  var progress = { done: {}, phase: {}, found: {}, filled: {} };
  order.forEach(function (value) {
    var hit = fillHandle("stat-freq-1-ex-a004", { value: value, typed: { 6: "3", 7: "5", 8: "4", 9: "1", 10: "2" }[value] }, progress);
    progress = hit.progress;
    add(hit.ok && rowState(hit.view, value).locked
      ? { ok: true, id: "fill-any-order-" + value }
      : fail("fill-any-order-" + value, hit.message));
  });
  add(progress.done.fill && progress.view == null
    ? { ok: true, id: "fill-complete-flag" }
    : fail("fill-complete-flag", ""));
  var afterFill = fillHandle("stat-freq-1-ex-a004", null, progress);
  add(afterFill.view.part.label === "ב"
    ? { ok: true, id: "fill-then-next-part" }
    : fail("fill-then-next-part", afterFill.view && afterFill.view.part && afterFill.view.part.label));
  var above = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a004",
    intent: "check",
    typed: "2",
    progress: progress,
  });
  add(above.ok && above.view.part.label === "ג" && above.shows[0] === "2"
    ? { ok: true, id: "nutrition-above-9" }
    : fail("nutrition-above-9", JSON.stringify({ ok: above.ok, shows: above.shows, msg: above.message, part: above.view && above.view.part })));
  var below = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a004",
    intent: "check",
    typed: "3 + 5 = 8",
    progress: above.progress,
  });
  add(below.ok && below.view.solved
    ? { ok: true, id: "nutrition-below-8" }
    : fail("nutrition-below-8", JSON.stringify({ ok: below.ok, shows: below.shows, msg: below.message })));

  var almost = { done: {}, phase: {}, found: {}, filled: { "6": 3, "7": 5, "8": 4, "9": 1 } };
  var surplus = fillHandle("stat-freq-1-ex-a004", { value: 10, typed: "9" }, almost);
  add(surplus.ok === false && surplus.message.indexOf("עודף") >= 0
    ? { ok: true, id: "fill-surplus" }
    : fail("fill-surplus", surplus.message));
  var shortfall = fillHandle("stat-freq-1-ex-a004", { value: 10, typed: "0" }, almost);
  add(shortfall.ok === false && shortfall.message.indexOf("חוסר") >= 0
    ? { ok: true, id: "fill-shortfall" }
    : fail("fill-shortfall", shortfall.message));
  var lastSlip = fillHandle("stat-freq-1-ex-a004", { value: 10, typed: "1" }, almost);
  add(lastSlip.ok === false && lastSlip.message.indexOf("מופע אחד") >= 0 && lastSlip.message.indexOf("חוסר") < 0
    ? { ok: true, id: "fill-last-off-by-one" }
    : fail("fill-last-off-by-one", lastSlip.message));

  var guided = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a004",
    intent: "step",
    progress: { done: {}, phase: {}, found: {}, filled: { "10": 2, "8": 4 } },
  });
  add(guided.ok && guided.shows[0] === "השכיחות של 6 היא 3" && rowState(guided.view, 6).locked && !rowState(guided.view, 7).locked
    ? { ok: true, id: "fill-step-smallest-open" }
    : fail("fill-step-smallest-open", JSON.stringify(guided.shows)));
  var solvedLines = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a004",
    intent: "solution",
    progress: { done: {}, phase: {}, found: {}, filled: {} },
  });
  add(solvedLines.ok && solvedLines.lines[0].show === "השכיחות של 6 היא 3" &&
    solvedLines.lines[1].show === "השכיחות של 7 היא 5" && solvedLines.view.solved
    ? { ok: true, id: "fill-solution-numeric-order" }
    : fail("fill-solution-numeric-order", JSON.stringify(solvedLines.lines && solvedLines.lines.slice(0, 3))));

  var messy = {
    variable: { label: "ציון" },
    frequency: { label: "תלמידים" },
    rows: [{ value: 10 }, { value: 6 }, { value: 8 }],
  };
  var messyData = [10, 6, 6, 8, 10];
  var messyStep = freq.nextStep(messy, { id: "fill", kind: "fillFreq" }, {}, messyData);
  add(messyStep.line === "השכיחות של 6 היא 2"
    ? { ok: true, id: "fill-unsorted-smallest-first" }
    : fail("fill-unsorted-smallest-first", messyStep.line));
  var messyNext = freq.nextStep(messy, { id: "fill", kind: "fillFreq" }, { filled: { "6": 2 } }, messyData);
  add(messyNext.line === "השכיחות של 8 היא 1"
    ? { ok: true, id: "fill-unsorted-then-8-not-10" }
    : fail("fill-unsorted-then-8-not-10", messyNext.line));
  var messyFar = freq.assess(messy, { id: "fill", kind: "fillFreq" }, "", { fill: { value: 10, typed: "9" } }, messyData);
  add(messyFar.ok === false && messyFar.message.indexOf("עודף") >= 0
    ? { ok: true, id: "fill-unsorted-surplus" }
    : fail("fill-unsorted-surplus", messyFar.message));
  var messySlip = freq.assess(messy, { id: "fill", kind: "fillFreq" }, "", { fill: { value: 8, typed: "2" } }, messyData);
  add(messySlip.ok === false && messySlip.message.indexOf("מופע אחד נוסף") >= 0
    ? { ok: true, id: "fill-unsorted-off-by-one" }
    : fail("fill-unsorted-off-by-one", messySlip.message));

  var bookProgress = { done: {}, phase: {}, found: {}, filled: {} };
  [0, 5, 2, 4, 1, 3].forEach(function (value) {
    var count = { 0: "2", 1: "3", 2: "1", 3: "2", 4: "6", 5: "3" }[value];
    var hit = fillHandle("stat-freq-1-ex-a005", { value: value, typed: count }, bookProgress);
    bookProgress = hit.progress;
    add(hit.ok ? { ok: true, id: "books-fill-" + value } : fail("books-fill-" + value, hit.message));
  });
  var bookUnder = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a005",
    intent: "check",
    typed: "6",
    progress: bookProgress,
  });
  add(bookUnder.ok && bookUnder.view.part.label === "ג"
    ? { ok: true, id: "books-under-3" }
    : fail("books-under-3", JSON.stringify({ ok: bookUnder.ok, shows: bookUnder.shows, msg: bookUnder.message, part: bookUnder.view && bookUnder.view.part })));
  var bookYes = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a005",
    intent: "check",
    typed: "כן",
    progress: bookUnder.progress,
  });
  add(bookYes.ok && bookYes.view.part.label === "ד"
    ? { ok: true, id: "books-majority-yes" }
    : fail("books-majority-yes", JSON.stringify({ ok: bookYes.ok, msg: bookYes.message, part: bookYes.view && bookYes.view.part })));
  var bookNo = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a005",
    intent: "check",
    typed: "לא",
    progress: bookUnder.progress,
  });
  add(bookNo.ok === false ? { ok: true, id: "books-majority-no" } : fail("books-majority-no", bookNo.message));
  var bookMode = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a005",
    intent: "check",
    typed: "6",
    progress: bookYes.progress,
  });
  add(bookMode.ok && bookMode.view.solved && bookMode.shows[0] === "6"
    ? { ok: true, id: "books-mode-frequency" }
    : fail("books-mode-frequency", JSON.stringify({ ok: bookMode.ok, shows: bookMode.shows, msg: bookMode.message })));
  var bookValue = freq.handle(engine, {
    levelId: "stat-freq-1",
    exerciseId: "stat-freq-1-ex-a005",
    intent: "check",
    typed: "4",
    progress: bookYes.progress,
  });
  add(bookValue.ok === false ? { ok: true, id: "books-mode-rejects-value" } : fail("books-mode-rejects-value", bookValue.message));

  function buildHandle(id, columns, progress, intent, typed) {
    return freq.handle(engine, {
      levelId: "stat-freq-1",
      exerciseId: id,
      intent: intent || "check",
      columns: columns,
      typed: typed,
      progress: progress || { done: {}, phase: {}, found: {}, filled: {}, columns: [] },
    });
  }
  function col(value, freq) {
    return { value: String(value), freq: String(freq) };
  }
  var soc = "stat-freq-1-ex-a006";
  var glide = "stat-freq-1-ex-a007";
  var food = "stat-freq-1-ex-a008";
  var socSorted = [col(2, 3), col(6, 2), col(7, 6), col(8, 4), col(10, 1)];
  var socOpen = studentDto.openProblem(engine, "stat-freq-1", 5);
  var socDump = JSON.stringify(socOpen);
  add(socOpen && socOpen.problem.exerciseId === soc && socOpen.problem.displayNumber === 6 &&
    socOpen.view.input === "build" && socOpen.view.table.build && socOpen.view.table.columns.length === 0 &&
    socOpen.view.table.variableLabel === "ציון" && socOpen.view.table.frequencyLabel === "מספר התלמידים" &&
    socOpen.problem.data.length === 16 && socOpen.problem.table.rows.length === 0 &&
    !/"freq":\s*\d/.test(socDump) && socDump.indexOf("entries") < 0
    ? { ok: true, id: "soc-open-headers-only" }
    : fail("soc-open-headers-only", socDump.slice(0, 400)));
  var glideOpen = studentDto.openProblem(engine, "stat-freq-1", 6);
  add(glideOpen && glideOpen.problem.data.length === 20 && glideOpen.view.input === "build" &&
    glideOpen.view.table.columns.length === 0 && glideOpen.view.table.variableLabel === "מספר פעמים"
    ? { ok: true, id: "glide-open-headers-only" }
    : fail("glide-open-headers-only", JSON.stringify(glideOpen && glideOpen.view && glideOpen.view.table)));
  var foodOpen = studentDto.openProblem(engine, "stat-freq-1", 7);
  var foodDump = JSON.stringify(foodOpen);
  add(foodOpen && foodOpen.view.input === "build" && foodOpen.view.table.columns.length === 0 &&
    !foodOpen.problem.data && foodOpen.problem.table.rows.length === 0 &&
    foodOpen.problem.stem.indexOf("פלאפל") >= 0 && foodOpen.problem.stem.indexOf("71") >= 0 &&
    foodDump.indexOf("entries") < 0 && foodDump.indexOf("count") < 0 && !/"freq":\s*\d/.test(foodDump)
    ? { ok: true, id: "food-open-hides-entries" }
    : fail("food-open-hides-entries", foodDump.slice(0, 500)));

  var socMiss = buildHandle(soc, [col(2, 3), col(6, 2), col(7, 6), col(8, 4)]);
  add(socMiss.ok && !socMiss.progress.done.build && socMiss.message.indexOf("חסר") >= 0 && socMiss.view.input === "build"
    ? { ok: true, id: "soc-missing-column" }
    : fail("soc-missing-column", socMiss.message));
  var socExtra = buildHandle(soc, socSorted.concat([{ value: "", freq: "" }]));
  add(socExtra.ok === false && socExtra.message.indexOf("מיותרת") >= 0
    ? { ok: true, id: "soc-extra-column" }
    : fail("soc-extra-column", socExtra.message));
  var socDup = buildHandle(soc, [col(2, 3), col(2, 3), col(6, 2)]);
  add(socDup.ok === false && socDup.message.indexOf("יותר מעמודה") >= 0
    ? { ok: true, id: "soc-duplicate-value" }
    : fail("soc-duplicate-value", socDup.message));
  var socUnknown = buildHandle(soc, [col(9, 1)]);
  add(socUnknown.ok === false && socUnknown.message.indexOf("אינו מופיע") >= 0 &&
    socUnknown.view.table.columns[0].valueLocked === false
    ? { ok: true, id: "soc-unknown-value" }
    : fail("soc-unknown-value", socUnknown.message));
  var socSlip = buildHandle(soc, [col(2, 4)]);
  add(socSlip.ok === false && socSlip.message.indexOf("נוסף") >= 0 &&
    socSlip.view.table.columns[0].valueLocked === true && socSlip.view.table.columns[0].freqLocked === false
    ? { ok: true, id: "soc-freq-off-by-one" }
    : fail("soc-freq-off-by-one", JSON.stringify({ msg: socSlip.message, col: socSlip.view.table.columns[0] })));
  var socValueAsFreq = buildHandle(soc, [col(2, 2)]);
  add(socValueAsFreq.ok === false && socValueAsFreq.message.indexOf("עצמו") >= 0
    ? { ok: true, id: "soc-typed-value-as-freq" }
    : fail("soc-typed-value-as-freq", socValueAsFreq.message));
  var socBig = buildHandle(soc, [col(2, 8)]);
  add(socBig.ok === false && socBig.message.indexOf("אינה נכונה") >= 0 && socBig.message.indexOf("פספסתם") < 0
    ? { ok: true, id: "soc-freq-generic" }
    : fail("soc-freq-generic", socBig.message));
  var socOrder = buildHandle(soc, [col(10, 1), col(8, 4), col(7, 6), col(6, 2), col(2, 3)]);
  add(socOrder.ok && socOrder.status === "note" && !socOrder.progress.done.build &&
    socOrder.message.indexOf("מהקטן לגדול") >= 0 && socOrder.view.part.label === "א" &&
    socOrder.view.table.columns.every(function (item) { return item.freqLocked && item.valueLocked; })
    ? { ok: true, id: "soc-wrong-order-is-not-calc-error" }
    : fail("soc-wrong-order-is-not-calc-error", JSON.stringify({ ok: socOrder.ok, status: socOrder.status, msg: socOrder.message })));
  var socDone = buildHandle(soc, socSorted, socOrder.progress);
  add(socDone.ok && socDone.view.part.label === "ב"
    ? { ok: true, id: "soc-sorted-continues" }
    : fail("soc-sorted-continues", socDone.message + " " + (socDone.view && socDone.view.part && socDone.view.part.label)));
  var socTotal = buildHandle(soc, null, socDone.progress, "check", "16");
  add(socTotal.ok && socTotal.view.part.label === "ג"
    ? { ok: true, id: "soc-class-total" }
    : fail("soc-class-total", socTotal.message));
  var socBetween = buildHandle(soc, null, socTotal.progress, "check", "6 + 4 + 1 = 11");
  add(socBetween.ok && socBetween.view.solved
    ? { ok: true, id: "soc-between-inclusive" }
    : fail("soc-between-inclusive", JSON.stringify({ ok: socBetween.ok, msg: socBetween.message, shows: socBetween.shows })));

  var random = { done: {}, phase: {}, found: {}, filled: {}, columns: [] };
  var randomPairs = [[8, 4], [2, 3], [10, 1], [6, 2], [7, 6]];
  var randomLast = null;
  randomPairs.forEach(function (pair, index) {
    var columns = randomPairs.slice(0, index + 1).map(function (item) { return col(item[0], item[1]); });
    randomLast = buildHandle(soc, columns, random);
    random = randomLast.progress;
  });
  add(randomLast && randomLast.status === "note" && randomLast.view.part.label === "א"
    ? { ok: true, id: "soc-random-fill-then-order" }
    : fail("soc-random-fill-then-order", randomLast && randomLast.message));
  var randomFixed = buildHandle(soc, socSorted, random);
  add(randomFixed.ok && randomFixed.view.part.label === "ב"
    ? { ok: true, id: "soc-random-then-sort" }
    : fail("soc-random-then-sort", randomFixed.message));
  var forged = buildHandle(soc, [], { done: { build: true }, phase: {}, found: {}, filled: {}, columns: [] });
  add(forged.ok === false && forged.view.part.label === "א"
    ? { ok: true, id: "soc-forged-done-ignored" }
    : fail("soc-forged-done-ignored", forged.view && forged.view.part && forged.view.part.label));
  var socHint = buildHandle(soc, [], null, "hint");
  add(socHint.ok && socHint.status === "hint" && !/\d/.test(socHint.message) && socHint.message.indexOf("עמודה") >= 0
    ? { ok: true, id: "soc-hint-hides-column-count" }
    : fail("soc-hint-hides-column-count", socHint.message));
  var socStep = buildHandle(soc, [], null, "step");
  add(socStep.ok && socStep.shows[0] === "הערך 2" && socStep.view.table.columns.length === 1 &&
    socStep.view.table.columns[0].valueLocked && !socStep.view.table.columns[0].freqLocked
    ? { ok: true, id: "soc-step-smallest-value" }
    : fail("soc-step-smallest-value", JSON.stringify(socStep.shows)));
  var socStep2 = buildHandle(soc, null, socStep.progress, "step");
  add(socStep2.ok && socStep2.shows[0] === "השכיחות של 2 היא 3" && socStep2.view.table.columns[0].freqLocked
    ? { ok: true, id: "soc-step-frequency" }
    : fail("soc-step-frequency", JSON.stringify(socStep2.shows)));
  var socSolution = buildHandle(soc, [], null, "solution");
  var socLines = (socSolution.lines || []).map(function (line) { return line.show; }).join("\n");
  add(socSolution.ok && socSolution.view.solved && socLines.indexOf("השכיחות של 2 היא 3") >= 0 &&
    socLines.indexOf("11") >= 0 && socLines.indexOf("16") >= 0
    ? { ok: true, id: "soc-full-solution" }
    : fail("soc-full-solution", socLines));

  var glideSorted = [col(1, 3), col(2, 4), col(3, 3), col(4, 5), col(5, 4), col(6, 1)];
  var glideDone = buildHandle(glide, glideSorted);
  var glideTotal = buildHandle(glide, null, glideDone.progress, "check", "20");
  var glideUnder = buildHandle(glide, null, glideTotal.progress, "check", "7");
  add(glideDone.view.part.label === "ב" && glideTotal.view.part.label === "ג" && glideUnder.view.solved
    ? { ok: true, id: "glide-build-then-parts" }
    : fail("glide-build-then-parts", JSON.stringify({
      build: glideDone.view.part && glideDone.view.part.label,
      total: glideTotal.message,
      under: glideUnder.message,
    })));
  var glideStep = buildHandle(glide, [col(6, 1)], null, "step");
  add(glideStep.shows[0] === "הערך 1"
    ? { ok: true, id: "glide-step-smallest-not-first-typed" }
    : fail("glide-step-smallest-not-first-typed", JSON.stringify(glideStep.shows)));

  var foodPerm = [col("במבה", 36), col("צ׳יפס", 18), col("חומוס", 25), col("פלאפל", 71)];
  var foodDone = buildHandle(food, foodPerm);
  add(foodDone.ok && foodDone.view.part.label === "ב" && foodDone.status !== "note" &&
    foodDone.view.table.rows.map(function (row) { return row.value; }).join(",") === "במבה,צ'יפס,חומוס,פלאפל"
    ? { ok: true, id: "food-any-order" }
    : fail("food-any-order", JSON.stringify({
      ok: foodDone.ok,
      status: foodDone.status,
      msg: foodDone.message,
      rows: foodDone.view && foodDone.view.table && foodDone.view.table.rows,
    })));
  var foodGuide = buildHandle(food, [col("פלאפל", 71), col("חומוס", 25), col("צ'יפס", 18), col("במבה", 36)]);
  add(foodGuide.ok && foodGuide.view.part.label === "ב"
    ? { ok: true, id: "food-guide-order-also-accepted" }
    : fail("food-guide-order-also-accepted", foodGuide.message));
  var foodMiss = buildHandle(food, [col("פלאפל", 71), col("חומוס", 25), col("צ'יפס", 18)]);
  add(foodMiss.message.indexOf("חסר") >= 0 && !foodMiss.progress.done.build
    ? { ok: true, id: "food-missing-category" }
    : fail("food-missing-category", foodMiss.message));
  var foodDup = buildHandle(food, [col("פלאפל", 71), col("פלאפל", 71)]);
  add(foodDup.ok === false && foodDup.message.indexOf("יותר מעמודה") >= 0
    ? { ok: true, id: "food-duplicate" }
    : fail("food-duplicate", foodDup.message));
  var foodUnknown = buildHandle(food, [col("פיצה", 10)]);
  add(foodUnknown.ok === false && foodUnknown.message.indexOf("פיצה") >= 0
    ? { ok: true, id: "food-unknown" }
    : fail("food-unknown", foodUnknown.message));
  var foodSlip = buildHandle(food, [col("פלאפל", 70)]);
  add(foodSlip.ok === false && foodSlip.message.indexOf("פספסתם") >= 0
    ? { ok: true, id: "food-freq-off-by-one" }
    : fail("food-freq-off-by-one", foodSlip.message));
  var foodBad = buildHandle(food, [col("פלאפל", 50)]);
  add(foodBad.ok === false && foodBad.message.indexOf("אינה נכונה") >= 0
    ? { ok: true, id: "food-freq-generic" }
    : fail("food-freq-generic", foodBad.message));
  var foodScale = buildHandle(food, null, foodDone.progress, "check", "איכותי");
  add(foodScale.ok && foodScale.view.part.label === "ג"
    ? { ok: true, id: "food-qualitative" }
    : fail("food-qualitative", foodScale.message));
  var foodQuant = buildHandle(food, null, foodDone.progress, "check", "כמותי");
  add(foodQuant.ok === false ? { ok: true, id: "food-rejects-quantitative" } : fail("food-rejects-quantitative", foodQuant.message));
  var foodMode = buildHandle(food, null, foodScale.progress, "check", "פלאפל");
  add(foodMode.ok && foodMode.view.solved && foodMode.shows[0] === "פלאפל"
    ? { ok: true, id: "food-mode-is-category" }
    : fail("food-mode-is-category", JSON.stringify({ ok: foodMode.ok, shows: foodMode.shows, msg: foodMode.message })));
  var foodCount = buildHandle(food, null, foodScale.progress, "check", "71");
  add(foodCount.ok === false ? { ok: true, id: "food-mode-rejects-frequency" } : fail("food-mode-rejects-frequency", foodCount.message));
  var foodStep = buildHandle(food, [col("במבה", 36)], null, "step");
  add(foodStep.shows[0] === "הערך פלאפל" && foodStep.view.table.columns.length === 2
    ? { ok: true, id: "food-step-uses-guide-order" }
    : fail("food-step-uses-guide-order", JSON.stringify({ shows: foodStep.shows, n: foodStep.view.table.columns.length })));
  var foodSolution = buildHandle(food, [], null, "solution");
  var foodLines = (foodSolution.lines || []).map(function (line) { return line.show; }).join("\n");
  add(foodSolution.view.solved && foodLines.indexOf("הערך פלאפל") >= 0 && foodLines.indexOf("איכותי") >= 0 &&
    foodLines.indexOf("פלאפל") >= 0
    ? { ok: true, id: "food-full-solution" }
    : fail("food-full-solution", foodLines));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-freq-table: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) {
    console.log("FAIL " + item.id + " " + item.detail);
  });
  if (failed.length) process.exitCode = 1;
}

main();
