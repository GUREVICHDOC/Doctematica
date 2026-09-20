"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var packFor = require("./geo-lengths").packFor;
var reconstruct = require("./geo-lengths").reconstruct;
var capabilityForFocus = require("./geo-lengths").capabilityForFocus;
var LINE_EQ_PAGE_IDS = require("./geo-lengths").LINE_EQ_PAGE_IDS;
var PARALLEL_PAGE_IDS = require("./geo-lengths").PARALLEL_PAGE_IDS;
var AXIS_LINES_PAGE_IDS = require("./geo-lengths").AXIS_LINES_PAGE_IDS;

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
    step: res.step != null ? String(res.step) : "",
    taskId: res.task && res.task.id ? res.task.id : null,
    taskKind: res.task && res.task.kind ? res.task.kind : null,
    cap: res.capability || "",
    server: !!res.server,
    doneIds: Object.keys(res.done || {})
      .filter(function (k) {
        return res.done[k];
      })
      .sort(),
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
    return handler.handle(Object.assign({ topic: "analytic", capability: "axis-lines" }, payload));
  }

  function parityTyped(id, n, typed, history, geo, cap) {
    var pack = packFor(engine, "geo-axis-lines-1", n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var local = G.checkTyped(typed, pack, progress);
    var remote = via({
      capability: cap || capabilityForFocus(pack, G.currentFocusTask(pack, progress)) || "axis-lines",
      intent: "check",
      levelId: "geo-axis-lines-1",
      n: n,
      history: history,
      geo: geo,
      typed: typed,
    });
    var ls = snapCheck(local);
    var rs = snapCheck(remote);
    var same =
      ls.ok === rs.ok &&
      ls.solved === rs.solved &&
      ls.doneIds.join(",") === rs.doneIds.join(",") &&
      (ls.ok ? true : /מקביל|מאונך|עוד לא|כן|לא|ישר/.test(rs.message) || ls.message === rs.message);
    add(
      same
        ? { ok: true, id: id }
        : fail(id, JSON.stringify({ typed: typed, local: ls, remote: rs }))
    );
    return remote;
  }

  add(
    AXIS_LINES_PAGE_IDS && AXIS_LINES_PAGE_IDS["geo-axis-lines-1"] && !LINE_EQ_PAGE_IDS["geo-axis-lines-1"] && !PARALLEL_PAGE_IDS["geo-axis-lines-1"]
      ? { ok: true, id: "gate-not-in-lineEq-or-parallel-ids" }
      : fail("gate-not-in-lineEq-or-parallel-ids", JSON.stringify({ LINE_EQ_PAGE_IDS: LINE_EQ_PAGE_IDS, PARALLEL_PAGE_IDS: PARALLEL_PAGE_IDS, AXIS_LINES_PAGE_IDS: AXIS_LINES_PAGE_IDS }))
  );

  var setup1 = via({ intent: "setup", levelId: "geo-axis-lines-1", n: 1, history: [], geo: {} });
  add(
    setup1 && setup1.server && setup1.capability === "axis-lines" && setup1.task && setup1.task.kind === "lineEq"
      ? { ok: true, id: "setup-n1-axis-lines" }
      : fail("setup-n1-axis-lines", JSON.stringify(setup1))
  );

  var n1y = parityTyped("n1-y=4", 1, "y=4");
  add(n1y && n1y.ok && n1y.solved && n1y.done && n1y.done.eq ? { ok: true, id: "n1-complete" } : fail("n1-complete", JSON.stringify(snapCheck(n1y))));
  var n1ps = via({ intent: "check", levelId: "geo-axis-lines-1", n: 1, history: [], geo: {}, typed: "y-4=0(x-3)" });
  add(n1ps && !n1ps.ok ? { ok: true, id: "n1-reject-point-slope" } : fail("n1-reject-point-slope", JSON.stringify(snapCheck(n1ps))));
  var n1wrong = via({ intent: "check", levelId: "geo-axis-lines-1", n: 1, history: [], geo: {}, typed: "x=4" });
  add(
    n1wrong && !n1wrong.ok && /y\s*=/.test(String(n1wrong.message || "")) && !/קטע\/נקודה/.test(String(n1wrong.message || ""))
      ? { ok: true, id: "n1-wrong-axis-feedback" }
      : fail("n1-wrong-axis-feedback", JSON.stringify(snapCheck(n1wrong)))
  );
  var n1badk = via({ intent: "check", levelId: "geo-axis-lines-1", n: 1, history: [], geo: {}, typed: "y=3" });
  add(
    n1badk && !n1badk.ok && /y\s*=\s*4/.test(String(n1badk.message || "").replace(/−/g, "-"))
      ? { ok: true, id: "n1-wrong-const-feedback" }
      : fail("n1-wrong-const-feedback", JSON.stringify(snapCheck(n1badk)))
  );

  var n2x = via({ intent: "check", levelId: "geo-axis-lines-1", n: 2, history: [], geo: {}, typed: "x=5" });
  add(n2x && n2x.ok && !n2x.solved && n2x.done && n2x.done.eq && !n2x.done.yn ? { ok: true, id: "n2-x=5-not-solved" } : fail("n2-x=5-not-solved", JSON.stringify(snapCheck(n2x))));
  var n2x0 = via({ intent: "check", levelId: "geo-axis-lines-1", n: 2, history: [], geo: {}, typed: "x-5=0" });
  add(n2x0 && n2x0.ok && n2x0.done && n2x0.done.eq ? { ok: true, id: "n2-x-5=0" } : fail("n2-x-5=0", JSON.stringify(snapCheck(n2x0))));
  var n2yesEarly = via({ intent: "check", levelId: "geo-axis-lines-1", n: 2, history: [], geo: {}, typed: "כן" });
  add(n2yesEarly && !n2yesEarly.ok ? { ok: true, id: "n2-yesNo-before-eq" } : fail("n2-yesNo-before-eq", JSON.stringify(snapCheck(n2yesEarly))));
  var n2yes = via({ intent: "check", levelId: "geo-axis-lines-1", n: 2, history: ["x = 5"], geo: {}, typed: "כן" });
  add(n2yes && n2yes.ok && n2yes.solved && n2yes.done && n2yes.done.yn ? { ok: true, id: "n2-yesNo-after-eq" } : fail("n2-yesNo-after-eq", JSON.stringify(snapCheck(n2yes))));
  var n2setup = via({ intent: "setup", levelId: "geo-axis-lines-1", n: 2, history: ["x = 5"], geo: {} });
  add(n2setup && n2setup.capability === "axis-lines" && n2setup.task && n2setup.task.kind === "yesNo" ? { ok: true, id: "n2-focus-yesNo" } : fail("n2-focus-yesNo", JSON.stringify(n2setup)));

  var n3a = via({ intent: "check", levelId: "geo-axis-lines-1", n: 3, history: [], geo: {}, typed: "x=-3" });
  add(n3a && n3a.ok && n3a.done && n3a.done.eqA && !n3a.solved ? { ok: true, id: "n3-vertical" } : fail("n3-vertical", JSON.stringify(snapCheck(n3a))));
  var n3b = via({ intent: "check", levelId: "geo-axis-lines-1", n: 3, history: ["x = -3"], geo: {}, typed: "y=2" });
  add(n3b && n3b.ok && n3b.solved ? { ok: true, id: "n3-horizontal" } : fail("n3-horizontal", JSON.stringify(snapCheck(n3b))));

  var n4skip = via({ intent: "check", levelId: "geo-axis-lines-1", n: 4, history: [], geo: {}, typed: "y=6" });
  add(n4skip && n4skip.ok && n4skip.solved && n4skip.done && n4skip.done.eq && n4skip.done.mAB ? { ok: true, id: "n4-skip-y=6-marks-slope" } : fail("n4-skip-y=6-marks-slope", JSON.stringify(snapCheck(n4skip))));
  var n4m = via({ capability: "slope", intent: "check", levelId: "geo-axis-lines-1", n: 4, history: [], geo: {}, typed: "m=0" });
  add(n4m && n4m.ok && n4m.done && n4m.done.mAB && !n4m.solved ? { ok: true, id: "n4-m=0" } : fail("n4-m=0", JSON.stringify(snapCheck(n4m))));
  var n4eq = via({ intent: "check", levelId: "geo-axis-lines-1", n: 4, history: ["mAB = 0"], geo: {}, typed: "y=6" });
  add(n4eq && n4eq.ok && n4eq.solved ? { ok: true, id: "n4-then-y=6" } : fail("n4-then-y=6", JSON.stringify(snapCheck(n4eq))));
  var recSkip = reconstruct(engine, packFor(engine, "geo-axis-lines-1", 4), ["y = 6"], {});
  var recFull = reconstruct(engine, packFor(engine, "geo-axis-lines-1", 4), ["mAB = 0", "y = 6"], {});
  add(recSkip.done && recSkip.done.eq && recSkip.done.mAB && recFull.done && recFull.done.eq && recFull.done.mAB ? { ok: true, id: "n4-recon-same" } : fail("n4-recon-same", JSON.stringify({ skip: recSkip.done, full: recFull.done })));

  var n5x = via({ intent: "check", levelId: "geo-axis-lines-1", n: 5, history: [], geo: {}, typed: "x=5" });
  add(n5x && n5x.ok && !n5x.solved ? { ok: true, id: "n5-x=5" } : fail("n5-x=5", JSON.stringify(snapCheck(n5x))));
  var n5yes = via({ intent: "check", levelId: "geo-axis-lines-1", n: 5, history: ["x = 5"], geo: {}, typed: "כן" });
  add(n5yes && !n5yes.ok ? { ok: true, id: "n5-yes-wrong" } : fail("n5-yes-wrong", JSON.stringify(snapCheck(n5yes))));
  var n5no = via({ intent: "check", levelId: "geo-axis-lines-1", n: 5, history: ["x = 5"], geo: {}, typed: "לא" });
  add(n5no && n5no.ok && n5no.solved ? { ok: true, id: "n5-no-true" } : fail("n5-no-true", JSON.stringify(snapCheck(n5no))));

  var n6a = via({ intent: "check", levelId: "geo-axis-lines-1", n: 6, history: [], geo: {}, typed: "y=-9" });
  add(n6a && n6a.ok && n6a.done && n6a.done.eqAB ? { ok: true, id: "n6-y=-9" } : fail("n6-y=-9", JSON.stringify(snapCheck(n6a))));
  var n6b = via({ intent: "check", levelId: "geo-axis-lines-1", n: 6, history: ["y = -9"], geo: {}, typed: "x=-5" });
  add(n6b && n6b.ok && n6b.done && n6b.done.eqCD ? { ok: true, id: "n6-x=-5" } : fail("n6-x=-5", JSON.stringify(snapCheck(n6b))));
  var n6c = via({ intent: "check", levelId: "geo-axis-lines-1", n: 6, history: ["y = -9", "x = -5"], geo: {}, typed: "y=0" });
  add(n6c && n6c.ok && n6c.done && n6c.done.eqEF ? { ok: true, id: "n6-y=0" } : fail("n6-y=0", JSON.stringify(snapCheck(n6c))));
  var n6d = via({ intent: "check", levelId: "geo-axis-lines-1", n: 6, history: ["y = -9", "x = -5", "y = 0"], geo: {}, typed: "x=0" });
  add(n6d && n6d.ok && n6d.solved ? { ok: true, id: "n6-x=0" } : fail("n6-x=0", JSON.stringify(snapCheck(n6d))));
  var n6skipV = via({ intent: "check", levelId: "geo-axis-lines-1", n: 6, history: [], geo: {}, typed: "x=0" });
  add(n6skipV && !n6skipV.ok && /y\s*=/.test(String(n6skipV.message || "")) ? { ok: true, id: "n6-x=0-before-part" } : fail("n6-x=0-before-part", JSON.stringify(snapCheck(n6skipV))));

  var n7earlyEq = via({ intent: "check", levelId: "geo-axis-lines-1", n: 7, history: [], geo: {}, typed: "x=5" });
  add(n7earlyEq && !(n7earlyEq.done && n7earlyEq.done.eqB) ? { ok: true, id: "n7-axis-before-part" } : fail("n7-axis-before-part", JSON.stringify(snapCheck(n7earlyEq))));
  var n7fake = via({
    intent: "check",
    levelId: "geo-axis-lines-1",
    n: 7,
    history: [],
    geo: { done: { A: true, B: true }, coords: { A: { x: true, y: true }, B: { x: true, y: true } }, answerX: 5 },
    typed: "x=5",
  });
  add(n7fake && !(n7fake.done && n7fake.done.eqB) ? { ok: true, id: "n7-no-trust-coords" } : fail("n7-no-trust-coords", JSON.stringify(snapCheck(n7fake))));

  var n8given = via({ intent: "check", levelId: "geo-axis-lines-1", n: 8, history: [], geo: {}, typed: "y=2" });
  add(n8given && !n8given.ok ? { ok: true, id: "n8-copy-given" } : fail("n8-copy-given", JSON.stringify(snapCheck(n8given))));
  var n8ok = via({ intent: "check", levelId: "geo-axis-lines-1", n: 8, history: [], geo: {}, typed: "y=5" });
  add(n8ok && n8ok.ok && n8ok.solved ? { ok: true, id: "n8-y=5" } : fail("n8-y=5", JSON.stringify(snapCheck(n8ok))));

  var n9skip = via({ intent: "check", levelId: "geo-axis-lines-1", n: 9, history: [], geo: {}, typed: "x=-2" });
  add(n9skip && !n9skip.ok && /y\s*=/.test(String(n9skip.message || "")) ? { ok: true, id: "n9-vertical-while-horizontal" } : fail("n9-vertical-while-horizontal", JSON.stringify(snapCheck(n9skip))));
  var n9a = via({ intent: "check", levelId: "geo-axis-lines-1", n: 9, history: [], geo: {}, typed: "y=-3" });
  add(n9a && n9a.ok && !n9a.solved ? { ok: true, id: "n9-y=-3" } : fail("n9-y=-3", JSON.stringify(snapCheck(n9a))));
  var n9b = via({ intent: "check", levelId: "geo-axis-lines-1", n: 9, history: ["y = -3"], geo: {}, typed: "x=-2" });
  add(n9b && n9b.ok && n9b.solved ? { ok: true, id: "n9-x=-2" } : fail("n9-x=-2", JSON.stringify(snapCheck(n9b))));

  var pack18 = packFor(engine, "geo-axis-lines-1", 18);
  var eqBC = (pack18.tasks || []).filter(function (t) {
    return t.id === "eqBC";
  })[0];
  add(eqBC && eqBC.kind === "lineEq" && !eqBC.axisParallel ? { ok: true, id: "n18-eqBC-not-axis" } : fail("n18-eqBC-not-axis", JSON.stringify(eqBC && { kind: eqBC.kind, axis: eqBC.axisParallel })));
  var steps18 = G.canonicalLineEqSteps(eqBC) || [];
  add(steps18.length > 1 && /y/.test(String(steps18[0] || "")) && /x/.test(String(steps18[0] || "")) ? { ok: true, id: "n18-point-slope-canonical" } : fail("n18-point-slope-canonical", JSON.stringify(steps18)));

  var fakeDone = via({
    intent: "check",
    levelId: "geo-axis-lines-1",
    n: 1,
    history: [],
    geo: { done: { eq: true }, lastExpr: { eq: "y = 4" }, lineEq: { L: "y = 4" } },
    typed: "x=4",
  });
  add(fakeDone && !fakeDone.ok && !(fakeDone.solved) ? { ok: true, id: "no-trust-axis-done" } : fail("no-trust-axis-done", JSON.stringify(snapCheck(fakeDone))));
  var fakeYn = via({
    intent: "check",
    levelId: "geo-axis-lines-1",
    n: 2,
    history: [],
    geo: { done: { eq: true, yn: true }, answer: true },
    typed: "כן",
  });
  add(fakeYn && !fakeYn.ok ? { ok: true, id: "no-trust-yesNo-done" } : fail("no-trust-yesNo-done", JSON.stringify(snapCheck(fakeYn))));

  var gatePerp = via({ intent: "one-step", levelId: "geo-perp-1", n: 1, history: [], geo: {} });
  add(gatePerp && gatePerp.ok && !gatePerp.local ? { ok: true, id: "gate-perp-server" } : fail("gate-perp-server", JSON.stringify(snapCheck(gatePerp))));
  var gateSlopeLocal = via({ intent: "one-step", levelId: "geo-perp-1", n: 1, history: [], geo: {} });
  add(gateSlopeLocal && gateSlopeLocal.ok && !gateSlopeLocal.local ? { ok: true, id: "gate-perp-server-repeat" } : fail("gate-perp-server-repeat", JSON.stringify(snapCheck(gateSlopeLocal))));

  var hint1 = via({ intent: "hint", levelId: "geo-axis-lines-1", n: 1, history: [], geo: {} });
  add(hint1 && /y\s*=\s*4/.test(String(hint1.message || "")) ? { ok: true, id: "hint-n1" } : fail("hint-n1", JSON.stringify(hint1)));
  var one1 = via({ intent: "one-step", levelId: "geo-axis-lines-1", n: 1, history: [], geo: {} });
  add(one1 && one1.ok && one1.step && /y\s*=\s*4/.test(one1.step) && one1.solved ? { ok: true, id: "onestep-n1-solved" } : fail("onestep-n1-solved", JSON.stringify(snapCheck(one1))));
  var one2 = via({ intent: "one-step", levelId: "geo-axis-lines-1", n: 2, history: [], geo: {} });
  add(one2 && one2.ok && /x\s*=\s*5/.test(String(one2.step || "")) && !one2.solved ? { ok: true, id: "onestep-n2-not-solved" } : fail("onestep-n2-not-solved", JSON.stringify(snapCheck(one2))));

  var sol1 = via({ intent: "solution", levelId: "geo-axis-lines-1", n: 1, history: [], geo: {} });
  add(sol1 && !sol1.local && !sol1.mixed && sol1.steps && sol1.steps.some(function (s) { return /y\s*=\s*4/.test(String(s)); }) && !sol1.steps.some(function (s) { return /y\s*[−-]\s*4/.test(String(s)); }) ? { ok: true, id: "sol-n1-single" } : fail("sol-n1-single", JSON.stringify(sol1)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoAxisLinesPage/.test(src) && /geo-axis-lines-1/.test(src) ? { ok: true, id: "client-page-gate" } : fail("client-page-gate", "missing"));
  add(/kind === "yesNo"/.test(src) && /isGeoAxisLinesPage/.test(src) ? { ok: true, id: "client-yesNo-gate" } : fail("client-yesNo-gate", "missing"));
  add(/"axis-lines"/.test(src) ? { ok: true, id: "client-capability" } : fail("client-capability", "missing"));
  add(/showBasicEqServerUnavailable/.test(src) && /isGeoAxisLinesPage/.test(src) ? { ok: true, id: "node-off-wired" } : fail("node-off-wired", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "axis-lines"/.test(geoApi) ? { ok: true, id: "capability-wired" } : fail("capability-wired", "missing"));

  console.log("parity-geo-axis-lines: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 80).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
