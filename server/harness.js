"use strict";

var loadEngine = require("./load-engine").loadEngine;

function fail(msg) {
  throw new Error(msg);
}

function assert(cond, msg) {
  if (!cond) fail(msg);
}

function emptyGeoProgress() {
  return { done: {}, partial: {}, coords: {}, lastExpr: {}, distUnk: {} };
}

function applyGeoRes(progress, res) {
  if (!res) return progress;
  if (res.done) progress.done = res.done;
  if (res.partial) progress.partial = res.partial;
  if (res.coords) progress.coords = res.coords;
  if (res.lastExpr) progress.lastExpr = res.lastExpr;
  if (res.distUnk) progress.distUnk = res.distUnk;
  return progress;
}

function sheetById(engine, id) {
  var levels = engine.DoctematicaCurriculum.levels;
  var i;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === id) return levels[i];
  }
  fail("missing sheet " + id);
}

function testLinearShort(engine) {
  var A = engine.DoctematicaAlgebra;
  var Teach = engine.DoctematicaTeach;
  var start = "x - 4 = 3";
  var bad = A.checkStep(start, "x = 8");
  assert(bad && bad.ok === false, "wrong step should fail");
  var ok = A.checkStep(start, "x = 7");
  assert(ok && ok.ok, "x=7 should be accepted: " + (ok && ok.message));
  assert(A.isSolvedText("x = 7"), "x=7 should count as solved");
  var hint = Teach.nextAction(start);
  assert(hint && hint.eq, "nextAction should suggest a step");
  var path = Teach.fullPath(start);
  assert(path && path.steps && path.steps.length, "fullPath should return steps");
  assert(String(path.answer).indexOf("7") >= 0, "fullPath answer should be 7, got " + path.answer);
}

function testLinearMulti(engine) {
  var A = engine.DoctematicaAlgebra;
  var Teach = engine.DoctematicaTeach;
  var start = "2x - 3 = 7";
  var s1 = A.checkStep(start, "2x = 10");
  assert(s1 && s1.ok, "2x=10 should be accepted: " + (s1 && s1.message));
  assert(!A.isSolvedText("2x = 10"), "2x=10 is not finished");
  var s2 = A.checkStep("2x = 10", "x = 5");
  assert(s2 && s2.ok, "x=5 should be accepted: " + (s2 && s2.message));
  assert(A.isSolvedText("x = 5"), "x=5 should be solved");
  var act = Teach.nextAction(start);
  assert(act && act.eq, "one-step from 2x-3=7");
  var mid = A.checkStep(start, act.eq);
  assert(mid && mid.ok, "one-step result should be a valid step: " + act.eq + " / " + (mid && mid.message));
}

function testFracJuxtapose(engine) {
  var MathR = engine.DoctematicaMath;
  assert(MathR && MathR.toHTML, "math-render loaded");
  var user = MathR.toHTML("y--19=-2/3(x+6)");
  assert(user.indexOf("m-frac") >= 0, "user slope frac should stack");
  assert(user.indexOf("3(x+6)") < 0, "parens after 2/3 are a factor, not the denominator: " + user);
  assert(/m-den[^>]*>3</.test(user) || user.indexOf(">3</span>") >= 0, "denominator should be 3: " + user);
  var site = MathR.toHTML("y + 19 = −(2/3)(x + 6)");
  assert(site.indexOf("m-frac") >= 0, "site slope frac should stack");
  assert(site.indexOf("3(x+6)") < 0 && site.indexOf("3(x + 6)") < 0, "site parens stay a factor: " + site);
  var keepDen = MathR.toHTML("2/(3(x+6))");
  assert(keepDen.indexOf("3(x+6)") >= 0 || keepDen.indexOf("m-den") >= 0, "explicit 2/(3(x+6)) keeps grouped den");
}

function testGeoDistance(engine) {
  var Geo = engine.DoctematicaGeometry;
  var sheet = sheetById(engine, "geo-distance-1");
  var ex = sheet.exercises.filter(function (e) {
    return e.n === 1;
  })[0];
  var pack = Geo.analyzeStart(ex);
  var progress = emptyGeoProgress();
  var hint0 = Geo.nextHint(pack, progress);
  assert(hint0 && (hint0.step || hint0.message), "geo hint before any step");
  var skip = Geo.checkTyped("5", pack, progress);
  assert(skip && skip.ok, "skip to distance 5 should work: " + (skip && skip.message));
  applyGeoRes(progress, skip);
  assert(skip.solved, "exercise n1 should be complete after AB=5");
}

function main() {
  var engine = loadEngine();
  assert(engine.DoctematicaAlgebra, "Algebra loaded");
  assert(engine.DoctematicaTeach, "Teach loaded");
  assert(engine.DoctematicaGeometry, "Geometry loaded");
  assert(engine.DoctematicaCurriculum, "Curriculum loaded");
  testLinearShort(engine);
  testLinearMulti(engine);
  testFracJuxtapose(engine);
  testGeoDistance(engine);
  console.log("harness ok: Node engine loaded; linear + geo checks passed");
}

main();
