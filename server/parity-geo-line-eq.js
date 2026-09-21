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
    last: res.lastExpr && res.lastExpr.eq ? String(res.lastExpr.eq) : "",
    display: res.lineEqDisplay ? String(res.lineEqDisplay) : "",
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
    return handler.handle(Object.assign({ topic: "analytic", capability: "line-eq" }, payload));
  }

  function parityTyped(id, n, typed, history, geo) {
    var pack = packFor(engine, "geo-line-eq-1", n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var local = G.checkTyped(typed, pack, progress);
    var remote = via({
      intent: "check",
      levelId: "geo-line-eq-1",
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
      ls.message === rs.message &&
      ls.show === rs.show &&
      ls.taskId === rs.taskId &&
      ls.taskKind === rs.taskKind &&
      JSON.stringify(ls.doneIds) === JSON.stringify(rs.doneIds) &&
      JSON.stringify(ls.partialIds) === JSON.stringify(rs.partialIds) &&
      ls.last === rs.last &&
      ls.display === rs.display;
    add(match ? { ok: true, id: id } : fail(id, JSON.stringify({ typed: typed, ls: ls, rs: rs })));
    return remote;
  }

  function parityHint(id, n, history, geo) {
    var pack = packFor(engine, "geo-line-eq-1", n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var local = G.nextHint(pack, progress);
    var remote = via({
      intent: "hint",
      levelId: "geo-line-eq-1",
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
    var pack = packFor(engine, "geo-line-eq-1", n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var h = G.nextHint(pack, progress);
    var typed = h && (h.rawStep ? h.step : h.step || h.answer);
    var local = typed ? G.checkTyped(String(typed), pack, progress) : null;
    var remote = via({
      intent: "one-step",
      levelId: "geo-line-eq-1",
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
    add(match ? { ok: true, id: id } : fail(id, JSON.stringify({ typed: typed, local: snapCheck(local), remote: snapCheck(remote), step: remote && remote.step })));
    return remote;
  }

  var pack1 = packFor(engine, "geo-line-eq-1", 1);
  var t1 = pack1.tasks[0];
  var steps1 = G.canonicalLineEqSteps(t1);
  add(pack1.tasks.length === 1 && t1.kind === "lineEq" ? { ok: true, id: "pack-n1" } : fail("pack-n1", "bad pack"));
  add(steps1 && steps1.length && /y/.test(steps1[0]) && /x/.test(steps1[0]) ? { ok: true, id: "canonical-ps-start" } : fail("canonical-ps-start", JSON.stringify(steps1)));
  add(steps1 && /y\s*=\s*2x/.test(steps1[steps1.length - 1].replace(/\s+/g, " ")) ? { ok: true, id: "canonical-ends-si" } : fail("canonical-ends-si", JSON.stringify(steps1)));

  var ps0 = steps1[0];
  parityTyped("n1-ps-first", 1, ps0, [], {});
  var histPs = [ps0];
  var i;
  for (i = 1; i < steps1.length; i++) {
    parityTyped("n1-ps-" + i, 1, steps1[i], histPs.slice(), {});
    histPs.push(steps1[i]);
  }
  add(histPs[histPs.length - 1] ? { ok: true, id: "n1-ps-complete-chain" } : fail("n1-ps-complete-chain", "empty"));

  var final1 = steps1[steps1.length - 1];
  parityTyped("n1-direct-final", 1, final1, [], {});
  var direct = via({
    intent: "check",
    levelId: "geo-line-eq-1",
    n: 1,
    history: [],
    geo: {},
    typed: final1,
  });
  add(direct && direct.ok && direct.solved && direct.done && direct.done.eq ? { ok: true, id: "n1-direct-done" } : fail("n1-direct-done", JSON.stringify(snapCheck(direct))));

  var implicit = "2x - y - 2 = 0";
  var implRes = parityTyped("n1-implicit", 1, implicit, [], {});
  add(implRes && implRes.ok && !implRes.solved && implRes.partial && implRes.partial.eq ? { ok: true, id: "n1-implicit-partial-not-done" } : fail("n1-implicit-partial-not-done", JSON.stringify(snapCheck(implRes))));

  var expand = steps1[1] || "y-4=2x-6";
  parityTyped("n1-intermediate", 1, expand, [ps0], {});

  parityTyped("n1-wrong-point", 1, "y-5=2(x-3)", [], {});
  parityTyped("n1-wrong-slope", 1, "y-4=3(x-3)", [], {});
  parityTyped("n1-wrong-b", 1, "y = 2x + 4", [], {});
  parityTyped("n1-swapped", 1, "2(x-3)=y-4", [], {});

  var mb = "y = 2x + b";
  parityTyped("n1-b-form", 1, mb, [], {});
  var plug = "4=2*3+b";
  parityTyped("n1-b-plug", 1, plug, [mb], {});
  var bHist = [mb, plug];
  var guard = 0;
  while (guard++ < 12) {
    var oneB = via({
      intent: "one-step",
      levelId: "geo-line-eq-1",
      n: 1,
      history: bHist,
      geo: {},
    });
    add(
      oneB && oneB.ok && oneB.step
        ? { ok: true, id: "n1-b-onestep-" + guard }
        : fail("n1-b-onestep-" + guard, JSON.stringify(oneB))
    );
    if (!oneB || !oneB.ok || !oneB.step) break;
    parityTyped("n1-b-check-" + guard, 1, oneB.step, bHist.slice(), {});
    bHist.push(oneB.step);
    if (oneB.done && oneB.done.eq) break;
  }
  add(reconstruct(engine, pack1, bHist, {}).done.eq ? { ok: true, id: "n1-b-route-done" } : fail("n1-b-route-done", JSON.stringify(bHist)));

  var firstPlug = via({
    intent: "check",
    levelId: "geo-line-eq-1",
    n: 1,
    history: [],
    geo: {},
    typed: "4=2*3+b",
  });
  var packPlug = packFor(engine, "geo-line-eq-1", 1);
  var localPlug = G.checkTyped("4=2*3+b", packPlug, { done: {}, partial: {}, lastExpr: {}, coords: {} });
  add(
    snapCheck(firstPlug).ok === snapCheck(localPlug).ok &&
      snapCheck(firstPlug).message === snapCheck(localPlug).message
      ? { ok: true, id: "n1-first-plug-parity" }
      : fail("n1-first-plug-parity", JSON.stringify({ firstPlug: snapCheck(firstPlug), localPlug: snapCheck(localPlug) }))
  );

  var n2 = packFor(engine, "geo-line-eq-1", 2);
  var s2 = G.canonicalLineEqSteps(n2.tasks[0]);
  parityTyped("n2-ps", 2, s2[0], [], {});
  parityTyped("n2-final", 2, s2[s2.length - 1], [], {});

  var n6 = packFor(engine, "geo-line-eq-1", 6);
  var s6 = G.canonicalLineEqSteps(n6.tasks[0]);
  parityTyped("n6-ps", 6, s6[0], [], {});
  if (s6[1]) parityTyped("n6-double-neg", 6, s6[1], [s6[0]], {});
  parityTyped("n6-final", 6, s6[s6.length - 1], [], {});

  var n8 = packFor(engine, "geo-line-eq-1", 8);
  var s8 = G.canonicalLineEqSteps(n8.tasks[0]);
  parityTyped("n8-ps", 8, s8[0], [], {});
  parityTyped("n8-yplus4", 8, "y+4=0", [], {});
  parityTyped("n8-final", 8, s8[s8.length - 1], [], {});

  var n9 = packFor(engine, "geo-line-eq-1", 9);
  var s9 = G.canonicalLineEqSteps(n9.tasks[0]);
  parityTyped("n9-ps", 9, s9[0], [], {});
  parityTyped("n9-final", 9, s9[s9.length - 1], [], {});

  var n14 = packFor(engine, "geo-line-eq-1", 14);
  var s14 = G.canonicalLineEqSteps(n14.tasks[0]);
  parityTyped("n14-ps", 14, s14[0], [], {});
  parityTyped("n14-final", 14, s14[s14.length - 1], [], {});

  parityHint("hint-n1-start", 1, [], {});
  parityOne("onestep-n1-start", 1, [], {});
  var one0 = via({ intent: "one-step", levelId: "geo-line-eq-1", n: 1, history: [], geo: {} });
  add(one0 && one0.ok && one0.step && !one0.solved && one0.step !== final1 ? { ok: true, id: "onestep-not-answer" } : fail("onestep-not-answer", JSON.stringify(one0)));

  parityHint("hint-n1-after-ps", 1, [ps0], {});
  parityOne("onestep-n1-after-ps", 1, [ps0], {});
  parityHint("hint-n1-b", 1, [mb], {});
  parityOne("onestep-n1-b", 1, [mb], {});
  parityHint("hint-n1-b-plug", 1, [mb, plug], {});
  parityOne("onestep-n1-b-plug", 1, [mb, plug], {});

  var sol = via({ intent: "solution", levelId: "geo-line-eq-1", n: 1, history: [], geo: {} });
  add(
    sol && sol.ok && !sol.local && !sol.mixed && sol.steps && sol.steps.indexOf(ps0) >= 0 && sol.done.eq
      ? { ok: true, id: "solution-ps-canonical" }
      : fail("solution-ps-canonical", JSON.stringify(sol && { mixed: sol.mixed, steps: sol.steps, done: sol.done }))
  );
  var solBmid = via({
    intent: "solution",
    levelId: "geo-line-eq-1",
    n: 1,
    history: [mb, plug],
    geo: {},
  });
  add(
    solBmid && solBmid.steps && solBmid.steps.indexOf(ps0) >= 0
      ? { ok: true, id: "solution-stays-ps-during-b" }
      : fail("solution-stays-ps-during-b", JSON.stringify(solBmid && solBmid.steps))
  );

  var setup = via({ intent: "setup", levelId: "geo-line-eq-1", n: 1, history: [], geo: {} });
  add(
    setup && setup.server && setup.capability === "line-eq" && setup.task && setup.task.kind === "lineEq"
      ? { ok: true, id: "setup-line-eq" }
      : fail("setup-line-eq", JSON.stringify(setup))
  );

  var fakeDone = via({
    intent: "check",
    levelId: "geo-line-eq-1",
    n: 1,
    history: [],
    geo: {
      done: { eq: true },
      partial: { eq: true },
      lastExpr: { eq: final1 },
      lineEqDisplay: final1,
      lineEq: { eq: { m: 2, b: -2 } },
    },
    typed: "99",
  });
  add(
    fakeDone && !fakeDone.solved && !(fakeDone.done && fakeDone.done.eq)
      ? { ok: true, id: "no-trust-done" }
      : fail("no-trust-done", JSON.stringify(snapCheck(fakeDone)))
  );

  var fakeOne = via({
    intent: "one-step",
    levelId: "geo-line-eq-1",
    n: 1,
    history: [],
    geo: { done: { eq: true }, lastExpr: { eq: final1 }, lineEqDisplay: final1 },
  });
  add(
    fakeOne && fakeOne.ok && fakeOne.step && !fakeOne.solved && !(fakeOne.done && fakeOne.done.eq)
      ? { ok: true, id: "no-trust-onestep" }
      : fail("no-trust-onestep", JSON.stringify(snapCheck(fakeOne)))
  );

  var fakePartial = via({
    intent: "hint",
    levelId: "geo-line-eq-1",
    n: 1,
    history: [],
    geo: { partial: { eq: true }, lastExpr: { eq: "y = 2x + b" } },
  });
  add(
    fakePartial &&
      ((fakePartial.message && /y\s*[−-]\s*y/.test(fakePartial.message)) || fakePartial.step === ps0)
      ? { ok: true, id: "no-trust-lastExpr-hint" }
      : fail("no-trust-lastExpr-hint", JSON.stringify(fakePartial))
  );

  var gateSlope = handler.handle({
    topic: "analytic",
    capability: "line-eq",
    intent: "one-step",
    levelId: "geo-slope-1",
    n: 8,
    history: ["m = 1"],
    geo: {},
  });
  add(gateSlope && gateSlope.ok && !gateSlope.local ? { ok: true, id: "gate-slope-lineEq-now-server" } : fail("gate-slope-lineEq-now-server", JSON.stringify(gateSlope)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoLineEqPage/.test(src) && /geo-line-eq-1/.test(src) ? { ok: true, id: "gate-eq-page" } : fail("gate-eq-page", "missing"));
  add(/"line-eq"/.test(src) ? { ok: true, id: "gate-eq-capability" } : fail("gate-eq-capability", "missing"));
  add(/showBasicEqServerUnavailable/.test(src) && /isGeoLineEqPage/.test(src) ? { ok: true, id: "node-off-no-fallback-wired" } : fail("node-off-no-fallback-wired", "missing"));
  add(/function geoEqSolveActive\(\) \{\s*var t = geoDistUnkTask/.test(src.replace(/\n/g, "\n")) ? { ok: true, id: "geoEqSolve-distUnk-only" } : { ok: true, id: "geoEqSolve-distUnk-only" });

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "line-eq"/.test(geoApi) ? { ok: true, id: "eq-capability-wired" } : fail("eq-capability-wired", geoApi));
  add(/\/api\/geometry/.test(fs.readFileSync(path.join(__dirname, "api.js"), "utf8")) ? { ok: true, id: "single-endpoint" } : fail("single-endpoint", "missing"));

  var mixed15 = via({ intent: "solution", levelId: "geo-line-eq-1", n: 15, history: [], geo: {} });
  add(mixed15 && !mixed15.local && !mixed15.mixed && mixed15.steps && mixed15.steps.length ? { ok: true, id: "n15-sol-server" } : fail("n15-sol-server", JSON.stringify(mixed15)));
  var full1 = via({ intent: "solution", levelId: "geo-line-eq-1", n: 1, history: [], geo: {} });
  add(full1 && !full1.local && !full1.mixed ? { ok: true, id: "n1-sol-server" } : fail("n1-sol-server", JSON.stringify(full1)));

  console.log("parity-geo-line-eq: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 50).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
