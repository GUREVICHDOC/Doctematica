"use strict";

var loadEngine = require("./load-engine").loadEngine;
var studentDto = require("./student-dto");
var geoLengths = require("./geo-lengths");

var ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*-ex-a\d{3}$/;
var BOOK_PREFIX = /^תרגיל\s+\d+/;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function walkStrings(value, visit) {
  if (typeof value === "string") {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(function (item) {
      walkStrings(item, visit);
    });
    return;
  }
  if (value && typeof value === "object") {
    Object.keys(value).forEach(function (key) {
      walkStrings(value[key], visit);
    });
  }
}

function main() {
  var engine = loadEngine();
  var levels = engine.DoctematicaCurriculum.levels || [];
  var checks = [];
  var seen = {};
  var exercises = 0;

  function add(result) {
    checks.push(result);
  }

  add(levels.length === 42 ? { ok: true, id: "level-count" } : fail("level-count", String(levels.length)));

  levels.forEach(function (level) {
    var list = level.exercises || [];
    if (!list.length) add(fail("empty-level:" + level.id, ""));
    else add({ ok: true, id: "has-exercises:" + level.id });
    list.forEach(function (ex, index) {
      exercises += 1;
      var id = ex.id;
      if (!id) {
        add(fail("missing-id:" + level.id + ":" + index, ""));
        return;
      }
      if (!ID_RE.test(id) || id.indexOf(level.id + "-ex-a") !== 0) {
        add(fail("bad-id:" + id, level.id));
      } else add({ ok: true, id: "format:" + id });
      if (seen[id]) add(fail("duplicate-id:" + id, seen[id] + " and " + level.id));
      else {
        seen[id] = level.id;
        add({ ok: true, id: "unique:" + id });
      }
      walkStrings(ex, function (text) {
        if (BOOK_PREFIX.test(text)) add(fail("book-number:" + id, text.slice(0, 80)));
      });
    });
  });

  add(exercises === 688 ? { ok: true, id: "exercise-count" } : fail("exercise-count", String(exercises)));

  var opened = studentDto.openProblem(engine, "level-02", 0);
  add(
    opened && opened.problem && opened.problem.displayNumber === 1 && opened.problem.n === 13 && opened.problem.exerciseId === "level-02-ex-a001"
      ? { ok: true, id: "display-ignores-book-n" }
      : fail("display-ignores-book-n", JSON.stringify(opened && opened.problem))
  );

  var catalog = studentDto.catalog(engine);
  catalog.levels.forEach(function (level) {
    var nums = (level.exercises || []).map(function (ex) {
      return ex.displayNumber;
    });
    var expect = nums.map(function (n, index) {
      return index + 1;
    });
    var book = (level.exercises || []).some(function (ex, index) {
      return ex.displayNumber === ex.n && ex.n !== index + 1;
    });
    add(
      JSON.stringify(nums) === JSON.stringify(expect) && !book
        ? { ok: true, id: "catalog-display:" + level.id }
        : fail("catalog-display:" + level.id, nums.join(","))
    );
  });

  var midpoint = levels.filter(function (level) {
    return level.id === "geo-midpoint-1";
  })[0];
  var before = midpoint.exercises.map(function (ex) {
    return ex.id;
  });
  var copy = midpoint.exercises.slice();
  copy.splice(1, 0, { id: "geo-midpoint-1-ex-a999", n: 999 });
  add(copy[0].id === before[0] && copy[1].id === "geo-midpoint-1-ex-a999" && copy[2].id === before[1] && copy[3].id === before[2]
    ? { ok: true, id: "insert-keeps-ids" }
    : fail("insert-keeps-ids", copy.slice(0, 4).map(function (ex) { return ex.id; }).join(",")));
  var displays = copy.map(function (ex, index) {
    return index + 1;
  });
  add(
    displays[0] === 1 && displays[1] === 2 && displays[2] === 3 && displays[3] === 4
      ? { ok: true, id: "insert-shifts-display" }
      : fail("insert-shifts-display", displays.slice(0, 4).join(","))
  );
  add(midpoint.exercises[1].id === before[1] ? { ok: true, id: "insert-does-not-mutate" } : fail("insert-does-not-mutate", midpoint.exercises[1].id));

  var byLegacy = geoLengths.packFor(engine, "geo-line-match-1", 19);
  var byId = geoLengths.packFor(engine, "geo-line-match-1", 1, 0, "geo-line-match-1-ex-a002");
  add(
    byLegacy && byLegacy._exerciseId === "geo-line-match-1-ex-a001" && byLegacy._n === 19
      ? { ok: true, id: "legacy-n-still-loads" }
      : fail("legacy-n-still-loads", JSON.stringify(byLegacy && { id: byLegacy._exerciseId, n: byLegacy._n }))
  );
  add(
    byId && byId._exerciseId === "geo-line-match-1-ex-a002" && byId._n === 20
      ? { ok: true, id: "exercise-id-beats-index-and-n" }
      : fail("exercise-id-beats-index-and-n", JSON.stringify(byId && { id: byId._exerciseId, n: byId._n }))
  );

  var failed = checks.filter(function (item) {
    return !item.ok;
  });
  console.log("parity-curriculum: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) {
    console.log("FAIL " + item.id + " " + item.detail);
  });
  if (failed.length) process.exitCode = 1;
}

main();
