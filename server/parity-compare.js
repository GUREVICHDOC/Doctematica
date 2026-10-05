"use strict";

var loadEngine = require("./load-engine").loadEngine;
var compare = require("./compare");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function main() {
  var engine = loadEngine();
  var checks = [];
  function add(result) {
    checks.push(result);
  }
  function exOf(id) {
    var found = null;
    (engine.DoctematicaCurriculum.levels || []).forEach(function (level) {
      (level.exercises || []).forEach(function (ex) {
        if (ex.id === id) found = ex;
      });
    });
    return found;
  }
  function ask(ex, body) {
    return compare.handle(engine, ex, body);
  }
  function fresh(done, known) {
    return {
      done: done || {},
      phase: {},
      work: [],
      known: known || { xs: [], points: [], intercepts: [] },
      pair: {},
      held: {},
    };
  }
  function clone(progress) {
    return JSON.parse(JSON.stringify(progress));
  }

  var two = exOf("calc-meet-1-ex-a010");
  var noneEx = exOf("calc-meet-1-ex-a011");
  var touchEx = exOf("calc-meet-1-ex-a012");
  add(two && noneEx && touchEx ? { ok: true, id: "exercises-present" } : fail("exercises-present", ""));

  var modelNone = compare.buildModel(engine.DoctematicaFnModel, engine.DoctematicaQuadratic, noneEx);
  var modelTouch = compare.buildModel(engine.DoctematicaFnModel, engine.DoctematicaQuadratic, touchEx);
  var modelTwo = compare.buildModel(engine.DoctematicaFnModel, engine.DoctematicaQuadratic, two);
  add(modelNone.contact === "none" && !modelNone.xs.length ? { ok: true, id: "no-intersection" } : fail("no-intersection", modelNone.contact));
  add(modelTouch.contact === "tangency" && modelTouch.xs.length === 1 ? { ok: true, id: "tangency" } : fail("tangency", modelTouch.contact + " " + modelTouch.xs.join(",")));
  add(modelTwo.contact === "crossing" && modelTwo.xs.length === 2 ? { ok: true, id: "two-intersections" } : fail("two-intersections", modelTwo.contact));
  var oneLine = compare.buildModel(engine.DoctematicaFnModel, engine.DoctematicaQuadratic, exOf("calc-meet-1-ex-a007"));
  add(oneLine.contact === "crossing" && oneLine.xs.length === 1 ? { ok: true, id: "single-crossing" } : fail("single-crossing", oneLine.contact + " " + oneLine.xs.length));

  var solvedNone = ask(noneEx, { intent: "solution" });
  var noneText = (solvedNone.steps || []).join(" | ");
  add(/אין פתרון/.test(noneText) && /כל x/.test(noneText) ? { ok: true, id: "solution-none" } : fail("solution-none", noneText));

  var solvedTouch = ask(touchEx, { intent: "solution" });
  var touchText = (solvedTouch.steps || []).join(" | ");
  add(/x=4\/2=2/.test(touchText) && /אין פתרון/.test(touchText) && /x < 2 או x > 2/.test(touchText) ? { ok: true, id: "solution-tangency" } : fail("solution-tangency", touchText));

  var prog = fresh();
  var step = ask(noneEx, { intent: "check", progress: prog, typed: "x^2+3=x+1" });
  add(step.ok ? { ok: true, id: "none-equate" } : fail("none-equate", step.message));
  var disc = ask(noneEx, { intent: "check", progress: step.progress, typed: "Δ<0" });
  add(disc.ok && /דיסקרימיננטה/.test(disc.message) ? { ok: true, id: "disc-negative" } : fail("disc-negative", disc.message));
  var concluded = ask(noneEx, { intent: "check", progress: disc.progress, typed: "אין פתרון ממשי" });
  add(concluded.ok && concluded.progress.contact === "none" && concluded.progress.done.meet
    ? { ok: true, id: "none-conclusion" }
    : fail("none-conclusion", JSON.stringify({ ok: concluded.ok, msg: concluded.message, contact: concluded.progress && concluded.progress.contact })));

  var invented = ask(noneEx, { intent: "check", progress: fresh(), typed: "x=1" });
  add(!invented.ok && invented.errorId === "inventedIntersection" ? { ok: true, id: "inventedIntersection" } : fail("inventedIntersection", invented.message));
  var domainErr = ask(noneEx, { intent: "check", progress: fresh(), typed: "הפונקציות לא מוגדרות" });
  add(!domainErr.ok && domainErr.errorId === "noRealRootsMisreadAsDomainError" ? { ok: true, id: "noRealRootsMisreadAsDomainError" } : fail("noRealRootsMisreadAsDomainError", domainErr.message));

  var bothNone = ask(noneEx, {
    intent: "check",
    progress: clone(concluded.progress),
    domains: { gt: "כל x", lt: "אין" },
  });
  add(bothNone.ok && bothNone.solved ? { ok: true, id: "f-above-all-and-empty" } : fail("f-above-all-and-empty", bothNone.message));
  var wrongEmpty = ask(noneEx, { intent: "check", progress: clone(concluded.progress), domains: { gt: "אין", lt: "" } });
  add(!wrongEmpty.ok && wrongEmpty.errorId === "wrongEmptySet" ? { ok: true, id: "wrongEmptySet" } : fail("wrongEmptySet", wrongEmpty.errorId + " " + wrongEmpty.message));
  var cannot = ask(noneEx, { intent: "check", progress: clone(concluded.progress), domains: { gt: "אי אפשר לדעת", lt: "" } });
  add(!cannot.ok && cannot.errorId === "noIntersectionMeansCannotCompare" ? { ok: true, id: "noIntersectionMeansCannotCompare" } : fail("noIntersectionMeansCannotCompare", cannot.message));

  var figNone = ask(noneEx, { intent: "hint", progress: concluded.progress });
  add(figNone.view && figNone.view.figure && !(figNone.view.figure.marks || []).length
    ? { ok: true, id: "drawing-none" }
    : fail("drawing-none", JSON.stringify(figNone.view && figNone.view.figure && figNone.view.figure.marks)));

  var xOnly = ask(touchEx, { intent: "check", progress: fresh(), typed: "x=2" });
  add(xOnly.ok && xOnly.progress.done.eqx && xOnly.progress.known.xs.length === 1
    ? { ok: true, id: "tangency-x-only" }
    : fail("tangency-x-only", xOnly.message));
  var figX = ask(touchEx, { intent: "hint", progress: xOnly.progress });
  var xMark = ((figX.view && figX.view.figure && figX.view.figure.marks) || []).some(function (mark) { return /x=2/.test(mark.label || ""); });
  add(xMark ? { ok: true, id: "drawing-known-x" } : fail("drawing-known-x", JSON.stringify(figX.view && figX.view.figure && figX.view.figure.marks)));

  var withY = fresh();
  withY.known.xs = [2];
  withY.known.points = [{ x: 2, y: 2 }];
  withY.done = { eqx: true };
  withY.contact = "tangency";
  var figPoint = ask(touchEx, { intent: "hint", progress: withY });
  var pointMark = ((figPoint.view && figPoint.view.figure && figPoint.view.figure.marks) || []).some(function (mark) { return /\(2,\s*2\)/.test(mark.label || ""); });
  add(pointMark ? { ok: true, id: "drawing-full-point" } : fail("drawing-full-point", JSON.stringify(figPoint.view && figPoint.view.figure && figPoint.view.figure.marks)));

  var twoXs = ask(touchEx, { intent: "check", progress: fresh(), typed: "x=1 או x=3" });
  add(!twoXs.ok && twoXs.errorId === "tangencyTreatedAsTwoIntersections" ? { ok: true, id: "tangencyTreatedAsTwoIntersections" } : fail("tangencyTreatedAsTwoIntersections", twoXs.message));

  var cross = ask(touchEx, { intent: "check", progress: clone(xOnly.progress), domains: { gt: "x<2", lt: "x>2" } });
  add(/השקה/.test(cross.message) ? { ok: true, id: "tangencyTreatedAsCrossing" } : fail("tangencyTreatedAsCrossing", cross.errorId + " " + cross.message));

  var oneSide = ask(touchEx, { intent: "check", progress: clone(xOnly.progress), domains: { gt: "אין", lt: "x<2" } });
  add(oneSide.ok && !oneSide.solved && /צד/.test(oneSide.message) ? { ok: true, id: "onlyOneSideOfTangencyAnswered" } : fail("onlyOneSideOfTangencyAnswered", oneSide.message));
  var rest = ask(touchEx, { intent: "check", progress: oneSide.progress, domains: { lt: "x>2" } });
  add(rest.ok && rest.solved ? { ok: true, id: "tangency-both-sides" } : fail("tangency-both-sides", rest.message));

  var closed = ask(touchEx, { intent: "check", progress: clone(xOnly.progress), domains: { gt: "אין", lt: "x≤2 או x≥2" } });
  add(closed.errorId === "equalityIncludedInStrictComparison" && /אינה נכללת/.test(closed.message) ? { ok: true, id: "equalityIncludedInStrictComparison" } : fail("equalityIncludedInStrictComparison", closed.errorId + " " + closed.message));

  var inner = ask(two, {
    intent: "check",
    progress: fresh({ eqx: true, gt: true }, { xs: [1, 6], points: [], intercepts: [] }),
    domains: { ans: "1<x<6" },
  });
  add(inner.ok ? { ok: true, id: "inner-interval" } : fail("inner-interval", inner.message + " " + (inner.view && inner.view.focusKind)));

  var outer = ask(two, {
    intent: "check",
    progress: fresh({ eqx: true }, { xs: [1, 6], points: [], intercepts: [] }),
    domains: { ans: "x<1 או x>6" },
  });
  add(outer.ok ? { ok: true, id: "two-intervals" } : fail("two-intervals", outer.message));

  var inclusive = JSON.parse(JSON.stringify(touchEx));
  inclusive.parts = [{ label: "א", text: "f(x) ≤ g(x)", taskIds: ["ge"] }];
  inclusive.tasks = [{ id: "ge", kind: "compare", who: "g", include: true }];
  var inclusiveRes = ask(inclusive, { intent: "check", progress: fresh(), domains: { ans: "כל x" } });
  add(inclusiveRes.ok ? { ok: true, id: "inclusive-tangency" } : fail("inclusive-tangency", inclusiveRes.message));

  var reuse = ask(two, { intent: "hint", progress: fresh({ eqx: true }, { xs: [1, 6], points: [], intercepts: [] }) });
  add(reuse.hint && /נקודות מפגש/.test(reuse.hint) ? { ok: true, id: "reuse-intersections" } : fail("reuse-intersections", reuse.hint));

  var lineMeet = exOf("calc-meet-1-ex-a008");
  var lineSolved = ask(lineMeet, { intent: "solution" });
  var lineText = (lineSolved.steps || []).join(" | ");
  var quot = (lineSolved.steps || []).findIndex(function (step) { return /1\.5/.test(step) && /\//.test(step); });
  var computed = (lineSolved.steps || []).findIndex(function (step, index) { return index > quot && /^x\s*=\s*2$/.test(String(step).replace(/\s+/g, "")); });
  add(quot >= 0 && computed > quot && !/אלה ערכי ה־x/.test(lineSolved.notes[quot] || "")
    ? { ok: true, id: "divide-decimal-quotient" }
    : fail("divide-decimal-quotient", lineText));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-compare: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) { console.log("FAIL", item.id, item.detail); });
  if (failed.length) process.exit(1);
}

main();
