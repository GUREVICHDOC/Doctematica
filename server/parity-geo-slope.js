"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var packFor = require("./geo-lengths").packFor;
var reconstruct = require("./geo-lengths").reconstruct;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function snapCheck(res) {
  res = res || {};
  return {
    ok: !!res.ok,
    solved: !!res.solved,
    local: !!res.local,
    mixed: !!res.mixed,
    message: String(res.message || ""),
    show: res.show ? String(res.show) : "",
    taskId: res.task && res.task.id ? res.task.id : null,
    taskKind: res.task && res.task.kind ? res.task.kind : null,
    doneIds: Object.keys(res.done || {})
      .filter(function (k) {
        return res.done[k];
      })
      .sort(),
    partialIds: Object.keys(res.partial || {})
      .filter(function (k) {
        return res.partial[k];
      })
      .sort(),
    last: res.lastExpr && res.lastExpr.m ? String(res.lastExpr.m) : res.lastExpr ? JSON.stringify(res.lastExpr) : "",
  };
}

function snapHint(h) {
  h = h || {};
  return {
    ok: h.ok !== false,
    local: !!h.local,
    message: String(h.message || ""),
    step: h.step != null ? String(h.step) : "",
    taskId: h.task && h.task.id ? h.task.id : null,
  };
}

function main() {
  var engine = loadEngine();
  var G = engine.DoctematicaGeometry;
  var handler = createGeometryHandler(engine);
  var passed = 0;
  var failed = [];
  function add(item) {
    if (item && item.ok) passed += 1;
    else failed.push(item);
  }

  function via(payload) {
    return handler.handle(Object.assign({ topic: "analytic", capability: "slope" }, payload));
  }

  function parityTyped(id, n, typed, history, geo) {
    var pack = packFor(engine, "geo-slope-1", n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var local = G.checkTyped(typed, pack, progress);
    var remote = via({
      intent: "check",
      levelId: "geo-slope-1",
      n: n,
      history: history,
      geo: geo,
      typed: typed,
    });
    var ls = snapCheck(local);
    var rs = snapCheck(remote);
    var match =
      ls.ok === rs.ok &&
      ls.solved === rs.solved &&
      ls.local === rs.local &&
      ls.message === rs.message &&
      ls.show === rs.show &&
      ls.taskId === rs.taskId &&
      ls.taskKind === rs.taskKind &&
      JSON.stringify(ls.doneIds) === JSON.stringify(rs.doneIds) &&
      JSON.stringify(ls.partialIds) === JSON.stringify(rs.partialIds);
    add(match ? { ok: true, id: id } : fail(id, JSON.stringify({ typed: typed, ls: ls, rs: rs })));
    return remote;
  }

  function parityHint(id, n, history, geo) {
    var pack = packFor(engine, "geo-slope-1", n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var local = G.nextHint(pack, progress);
    var remote = via({
      intent: "hint",
      levelId: "geo-slope-1",
      n: n,
      history: history,
      geo: geo,
    });
    var ls = snapHint({ ok: true, message: local && local.message, step: local && local.step, task: local && local.task });
    var rs = snapHint(remote);
    var match = ls.message === rs.message && ls.step === rs.step && !rs.local;
    add(match ? { ok: true, id: id } : fail(id, JSON.stringify({ ls: ls, rs: rs })));
    return remote;
  }

  function parityOne(id, n, history, geo) {
    var pack = packFor(engine, "geo-slope-1", n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var h = G.nextHint(pack, progress);
    var typed = h && (h.rawStep ? h.step : h.step || h.answer);
    var local = typed ? G.checkTyped(String(typed), pack, progress) : null;
    var remote = via({
      intent: "one-step",
      levelId: "geo-slope-1",
      n: n,
      history: history,
      geo: geo,
    });
    var match =
      remote &&
      remote.ok &&
      !remote.local &&
      String(remote.step || "") === String(typed || "") &&
      !!remote.solved === !!(local && local.solved) &&
      !!remote.ok === !!(local && local.ok);
    add(
      match
        ? { ok: true, id: id }
        : fail(id, JSON.stringify({ typed: typed, local: snapCheck(local), remote: snapCheck(remote), step: remote && remote.step }))
    );
    return remote;
  }

  var pack1 = packFor(engine, "geo-slope-1", 1);
  var t1 = pack1.tasks[0];
  var steps1 = G.canonicalSlopeSteps(t1, pack1);
  add(pack1.tasks.length === 1 && t1.kind === "slope" ? { ok: true, id: "pack-n1" } : fail("pack-n1", "bad pack"));
  add(
    steps1 && steps1.length && /\(8\s*[-−]\s*4\)/.test(steps1[0]) && /\(3\s*[-−]\s*1\)/.test(steps1[0])
      ? { ok: true, id: "canonical-plugged-not-symbolic" }
      : fail("canonical-plugged-not-symbolic", JSON.stringify(steps1))
  );
  add(
    steps1 && !/\(y\s*[₂2]/.test(steps1[0])
      ? { ok: true, id: "canonical-not-y2-y1" }
      : fail("canonical-not-y2-y1", JSON.stringify(steps1))
  );

  var plug = steps1[0];
  parityTyped("n1-plug", 1, plug, [], {});
  var hist = [plug];
  var i;
  for (i = 1; i < steps1.length; i++) {
    parityTyped("n1-canon-" + i, 1, steps1[i], hist.slice(), {});
    hist.push(steps1[i]);
  }
  add(reconstruct(engine, pack1, hist, {}).done.m ? { ok: true, id: "n1-canon-done" } : fail("n1-canon-done", JSON.stringify(hist)));

  parityTyped("n1-direct-m", 1, "m = 2", [], {});
  parityTyped("n1-direct-mAB", 1, "mAB = 2", [], {});
  parityTyped("n1-bare-2", 1, "2", [], {});
  var atomic = via({ intent: "check", levelId: "geo-slope-1", n: 1, history: [], geo: {}, typed: "4/2" });
  var localAtomic = G.checkTyped("4/2", pack1, { done: {}, partial: {}, lastExpr: {}, coords: {} });
  add(
    atomic &&
      localAtomic &&
      atomic.ok &&
      localAtomic.ok &&
      !atomic.solved &&
      !localAtomic.solved &&
      !(atomic.done && atomic.done.m) &&
      atomic.partial &&
      atomic.partial.m &&
      /4\/2/.test(String(atomic.show || "") + String(atomic.lastExpr && atomic.lastExpr.m || ""))
      ? { ok: true, id: "n1-atomic-4/2-keeps-frac" }
      : fail("n1-atomic-4/2-keeps-frac", JSON.stringify({ atomic: snapCheck(atomic), local: snapCheck(localAtomic) }))
  );
  var sixOverTwo = via({ intent: "check", levelId: "geo-slope-1", n: 1, history: [], geo: {}, typed: "m = 6/2" });
  add(
    sixOverTwo && !sixOverTwo.ok && !(sixOverTwo.done && sixOverTwo.done.m)
      ? { ok: true, id: "n1-6/2-not-accepted-as-3" }
      : fail("n1-6/2-not-accepted-as-3", JSON.stringify(snapCheck(sixOverTwo)))
  );
  var eight = via({ intent: "check", levelId: "geo-slope-1", n: 1, history: [], geo: {}, typed: "8/4" });
  add(
    eight && eight.ok && !eight.solved && eight.partial && eight.partial.m && /8\/4/.test(String(eight.show || ""))
      ? { ok: true, id: "n1-atomic-8/4-keeps-frac" }
      : fail("n1-atomic-8/4-keeps-frac", JSON.stringify(snapCheck(eight)))
  );
  var afterHalf = via({
    intent: "check",
    levelId: "geo-slope-1",
    n: 1,
    history: ["4/2"],
    geo: {},
    typed: "m = 2",
  });
  add(afterHalf && afterHalf.ok && afterHalf.done && afterHalf.done.m ? { ok: true, id: "n1-after-4/2-divide" } : fail("n1-after-4/2-divide", JSON.stringify(snapCheck(afterHalf))));
  var hintHalf = via({ intent: "hint", levelId: "geo-slope-1", n: 1, history: ["4/2"], geo: {} });
  add(
    hintHalf && /חלקו/.test(String(hintHalf.message || "")) && /=\s*2/.test(String(hintHalf.step || "").replace(/\s+/g, ""))
      ? { ok: true, id: "n1-hint-after-4/2-divide" }
      : fail("n1-hint-after-4/2-divide", JSON.stringify(hintHalf))
  );

  parityTyped("n1-reverse-full", 1, "mAB=(4-8)/(1-3)", [], {});
  parityTyped("n1-mixed", 1, "mAB=(8-4)/(1-3)", [], {});
  parityTyped("n1-xy-swap", 1, "mAB=(3-1)/(8-4)", [], {});
  parityTyped("n1-wrong-sign", 1, "m = -2", [], {});
  parityTyped("n1-reciprocal", 1, "m = 1/2", [], {});
  parityTyped("n1-symbolic", 1, "m=(y2-y1)/(x2-x1)", [], {});
  parityTyped("n1-symbolic-sub", 1, "m=(y₂-y₁)/(x₂-x₁)", [], {});

  var pack3 = packFor(engine, "geo-slope-1", 3);
  var s3 = G.canonicalSlopeSteps(pack3.tasks[0], pack3);
  add(
    s3 && s3.length >= 2 && (/\(\s*0\s*[-−]\s*\(/.test(s3[0]) || /-\s*\(/.test(s3[0]))
      ? { ok: true, id: "n3-has-double-minus" }
      : fail("n3-has-double-minus", JSON.stringify(s3))
  );
  parityTyped("n3-plug", 3, s3[0], [], {});
  if (s3[1]) parityTyped("n3-plus", 3, s3[1], [s3[0]], {});
  parityTyped("n3-final", 3, s3[s3.length - 1], [], {});

  var pack5 = packFor(engine, "geo-slope-1", 5);
  var s5 = G.canonicalSlopeSteps(pack5.tasks[0], pack5);
  parityTyped("n5-plug", 5, s5[0], [], {});
  parityTyped("n5-final", 5, s5[s5.length - 1], [], {});

  var pack6 = packFor(engine, "geo-slope-1", 6);
  var s6 = G.canonicalSlopeSteps(pack6.tasks[0], pack6);
  add(s6 && s6.length ? { ok: true, id: "n6-has-steps" } : fail("n6-has-steps", "empty"));
  add(
    s6 && s6.some(function (line) {
      return /3\.5|2\/3|5\/2|1\/3/.test(String(line).replace(/\s+/g, ""));
    })
      ? { ok: true, id: "n6-quirk-frac" }
      : fail("n6-quirk-frac", JSON.stringify(s6))
  );
  var h6 = [];
  s6.forEach(function (line, idx) {
    parityTyped("n6-canon-" + idx, 6, line, h6.slice(), {});
    h6.push(line);
  });

  var pack7 = packFor(engine, "geo-slope-1", 7);
  var s7 = G.canonicalSlopeSteps(pack7.tasks[0], pack7);
  parityTyped("n7-plug", 7, s7[0], [], {});
  parityTyped("n7-zero", 7, "m = 0", [], {});
  parityTyped("n7-bare-0", 7, "0", [], {});

  var pack12 = packFor(engine, "geo-slope-1", 12);
  var s12 = G.canonicalSlopeSteps(pack12.tasks.filter(function (t) { return t.kind === "slope"; })[0], pack12);
  var h12 = [];
  s12.forEach(function (line, idx) {
    parityTyped("n12-canon-" + idx, 12, line, h12.slice(), {});
    h12.push(line);
  });
  var n12mid = via({ intent: "check", levelId: "geo-slope-1", n: 12, history: [], geo: {}, typed: "2/4" });
  add(
    n12mid && n12mid.ok && !n12mid.solved && n12mid.partial && n12mid.partial.m
      ? { ok: true, id: "n12-2/4-not-done" }
      : fail("n12-2/4-not-done", JSON.stringify(snapCheck(n12mid)))
  );
  var n12fin = via({ intent: "check", levelId: "geo-slope-1", n: 12, history: ["2/4"], geo: {}, typed: "1/2" });
  add(n12fin && n12fin.ok && n12fin.done && n12fin.done.m ? { ok: true, id: "n12-1/2-done" } : fail("n12-1/2-done", JSON.stringify(snapCheck(n12fin))));

  parityHint("hint-n1-start", 1, [], {});
  parityOne("onestep-n1-start", 1, [], {});
  var one0 = via({ intent: "one-step", levelId: "geo-slope-1", n: 1, history: [], geo: {} });
  add(one0 && one0.ok && one0.step && !one0.solved && one0.step === plug ? { ok: true, id: "onestep-not-answer" } : fail("onestep-not-answer", JSON.stringify(one0)));
  parityHint("hint-n1-after-plug", 1, [plug], {});
  parityOne("onestep-n1-after-plug", 1, [plug], {});
  if (steps1.length > 2) {
    parityHint("hint-n1-after-mid", 1, [plug, steps1[1]], {});
  }
  parityHint("hint-n3-start", 3, [], {});
  parityOne("onestep-n3-start", 3, [], {});
  parityHint("hint-n3-after-plug", 3, [s3[0]], {});
  parityOne("onestep-n3-after-plug", 3, [s3[0]], {});

  var n8skip = via({
    intent: "check",
    levelId: "geo-slope-1",
    n: 8,
    history: [],
    geo: {},
    typed: "y = x + 4",
  });
  add(n8skip && n8skip.ok && !n8skip.local && n8skip.done && n8skip.done.eq ? { ok: true, id: "n8-lineEq-now-server" } : fail("n8-lineEq-now-server", JSON.stringify(n8skip)));
  var rec8 = reconstruct(engine, packFor(engine, "geo-slope-1", 8), ["y = x + 4"], {});
  add(rec8.done && rec8.done.m && rec8.done.eq ? { ok: true, id: "n8-skip-replay-marks-slope" } : fail("n8-skip-replay-marks-slope", JSON.stringify(rec8.done)));
  var rec8fake = reconstruct(engine, packFor(engine, "geo-slope-1", 8), [], { done: { m: true, eq: true } });
  add(!(rec8fake.done && rec8fake.done.m) ? { ok: true, id: "n8-fake-done-ignored" } : fail("n8-fake-done-ignored", JSON.stringify(rec8fake.done)));
  var rec8bad = reconstruct(engine, packFor(engine, "geo-slope-1", 8), ["y = x + 5"], {});
  add(!(rec8bad.done && rec8bad.done.m) ? { ok: true, id: "n8-bad-lineEq-no-skip" } : fail("n8-bad-lineEq-no-skip", JSON.stringify(rec8bad.done)));

  var n8afterM = via({
    intent: "hint",
    levelId: "geo-slope-1",
    n: 8,
    history: ["m = 1"],
    geo: {},
  });
  add(n8afterM && n8afterM.ok && !n8afterM.local && /משוואת הישר/.test(n8afterM.message || "") ? { ok: true, id: "n8-lineEq-hint-server" } : fail("n8-lineEq-hint-server", JSON.stringify(n8afterM)));

  var fakeDone = via({
    intent: "one-step",
    levelId: "geo-slope-1",
    n: 1,
    history: [],
    geo: { done: { m: true }, partial: { m: true }, lastExpr: { m: "m = 2" }, coords: {}, slope: 2 },
  });
  add(
    fakeDone && fakeDone.ok && fakeDone.step && !fakeDone.solved && !(fakeDone.done && fakeDone.done.m)
      ? { ok: true, id: "no-trust-done" }
      : fail("no-trust-done", JSON.stringify(snapCheck(fakeDone)))
  );
  var fakeCheck = via({
    intent: "check",
    levelId: "geo-slope-1",
    n: 1,
    history: [],
    geo: { done: { m: true }, lastExpr: { m: "m=2" } },
    typed: "m = 9",
  });
  add(fakeCheck && !fakeCheck.ok && !(fakeCheck.done && fakeCheck.done.m) ? { ok: true, id: "no-trust-wrong-with-fake-done" } : fail("no-trust-wrong-with-fake-done", JSON.stringify(snapCheck(fakeCheck))));
  var fakeHint = via({
    intent: "hint",
    levelId: "geo-slope-1",
    n: 1,
    history: [],
    geo: { partial: { m: true }, lastExpr: { m: "m = 2" } },
  });
  add(
    fakeHint && fakeHint.step === plug
      ? { ok: true, id: "no-trust-lastExpr-hint" }
      : fail("no-trust-lastExpr-hint", JSON.stringify(fakeHint))
  );
  var fakeAns = via({
    intent: "check",
    levelId: "geo-slope-1",
    n: 1,
    history: [],
    geo: { answer: 2, "task.answer": 2, slope: 2 },
    typed: "m = 9",
  });
  add(fakeAns && !fakeAns.ok ? { ok: true, id: "no-trust-answer-field" } : fail("no-trust-answer-field", JSON.stringify(snapCheck(fakeAns))));

  var setup1 = via({ intent: "setup", levelId: "geo-slope-1", n: 1, history: [], geo: {} });
  add(setup1 && setup1.server && setup1.capability === "slope" ? { ok: true, id: "setup-capability" } : fail("setup-capability", JSON.stringify(setup1)));

  var sol1 = via({ intent: "solution", levelId: "geo-slope-1", n: 1, history: [], geo: {} });
  add(
    sol1 && !sol1.local && !sol1.mixed && sol1.steps && sol1.steps.indexOf(plug) >= 0
      ? { ok: true, id: "n1-sol-server" }
      : fail("n1-sol-server", JSON.stringify(sol1))
  );
  var sol7 = via({ intent: "solution", levelId: "geo-slope-1", n: 7, history: [], geo: {} });
  add(sol7 && !sol7.local && !sol7.mixed ? { ok: true, id: "n7-sol-server" } : fail("n7-sol-server", JSON.stringify(sol7)));
  var sol8 = via({ intent: "solution", levelId: "geo-slope-1", n: 8, history: [], geo: {} });
  add(sol8 && !sol8.local && !sol8.mixed && sol8.steps && sol8.steps.length ? { ok: true, id: "n8-sol-server" } : fail("n8-sol-server", JSON.stringify(sol8)));

  var gatePar = handler.handle({
    topic: "analytic",
    capability: "slope",
    intent: "one-step",
    levelId: "geo-parallel-1",
    n: 9,
    history: [],
    geo: {},
  });
  add(gatePar && gatePar.ok && !gatePar.local ? { ok: true, id: "gate-parallel-slope-server" } : fail("gate-parallel-slope-server", JSON.stringify(gatePar)));
  var gatePerp = handler.handle({
    topic: "analytic",
    capability: "slope",
    intent: "one-step",
    levelId: "geo-perp-1",
    n: 1,
    history: [],
    geo: {},
  });
  add(gatePerp && gatePerp.ok && !gatePerp.local ? { ok: true, id: "gate-perp-slope-server" } : fail("gate-perp-slope-server", JSON.stringify(gatePerp)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoSlopePage/.test(src) && /geo-slope-1/.test(src) ? { ok: true, id: "gate-slope-page" } : fail("gate-slope-page", "missing"));
  add(/kind === "slope" && \(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\) \|\| isGeoMidpointPage\(\)\)/.test(src) || /kind === "slope" && \(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\)\)/.test(src) || /kind === "slope" && \(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\)\)/.test(src) || /\(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\) \|\| isGeoMidpointPage\(\)\) && kind === "slope"/.test(src) || /\(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\) \|\| isGeoAxisLinesPage\(\)\) && kind === "slope"/.test(src) || /\(isGeoSlopePage\(\) \|\| isGeoParallelPage\(\)\) && kind === "slope"/.test(src) ? { ok: true, id: "gate-kind" } : fail("gate-kind", "kind not gated"));
  add(/"slope"/.test(src) ? { ok: true, id: "gate-capability" } : fail("gate-capability", "missing"));
  add(/showBasicEqServerUnavailable/.test(src) && /isGeoSlopePage/.test(src) ? { ok: true, id: "node-off-wired" } : fail("node-off-wired", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "slope"/.test(geoApi) ? { ok: true, id: "slope-capability-wired" } : fail("slope-capability-wired", "missing"));
  add(/\/api\/geometry/.test(fs.readFileSync(path.join(__dirname, "api.js"), "utf8")) ? { ok: true, id: "single-endpoint" } : fail("single-endpoint", "missing"));

  console.log("parity-geo-slope: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 60).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
