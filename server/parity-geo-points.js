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
    coords: res.coords || {},
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
    return handler.handle(
      Object.assign({ topic: "analytic", capability: "points" }, payload)
    );
  }

  function parityTyped(id, levelId, n, typed, history, geo) {
    var pack = packFor(engine, levelId, n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var local = G.checkTyped(typed, pack, progress);
    if ((!local || !local.ok) && G.lineAsk && G.lineAsk(pack, progress) && G.lineAsk(pack, progress).stage === "reason") {
      local = G.submitReason(typed, pack, progress);
    }
    var remote = via({
      intent: "check",
      levelId: levelId,
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
      JSON.stringify(ls.partialIds) === JSON.stringify(rs.partialIds);
    add(match ? { ok: true, id: id } : fail(id, JSON.stringify({ typed: typed, ls: ls, rs: rs })));
    return remote;
  }

  var ptsPack = packFor(engine, "geo-line-points-1", 1);
  add(ptsPack && ptsPack.tasks.every(function (t) { return t.kind === "point"; }) ? { ok: true, id: "pack-points-1-kinds" } : fail("pack-points-1-kinds", "unexpected"));

  parityTyped("points-direct-A", "geo-line-points-1", 1, "A(2;4)", [], {});
  parityTyped("points-y-plug", "geo-line-points-1", 1, "y=2+2", [], {});
  parityTyped("points-incorrect-y", "geo-line-points-1", 1, "y=9", [], {});
  parityTyped("points-x-only", "geo-line-points-1", 1, "x=2", [], {});
  var afterX = via({ intent: "check", levelId: "geo-line-points-1", n: 1, history: [], geo: {}, typed: "x=2" });
  add(afterX && afterX.ok && afterX.coords && afterX.coords.A && afterX.coords.A.x && !afterX.done.A ? { ok: true, id: "points-partial-x" } : fail("points-partial-x", JSON.stringify(snapCheck(afterX))));
  parityTyped("points-y-after-x", "geo-line-points-1", 1, "y=2+2", ["x=2"], {});
  parityTyped("points-full-after-y", "geo-line-points-1", 1, "A(2;4)", ["x=2", "y=2+2", "y=4"], {});

  parityTyped("points-C-y0", "geo-line-points-1", 1, "y=0", ["A(2;4)", "B(0;2)"], {});
  parityTyped("points-C-wrong-x0", "geo-line-points-1", 1, "x=0", ["A(2;4)", "B(0;2)"], {});

  var fakeCoords = via({
    intent: "check",
    levelId: "geo-line-points-1",
    n: 1,
    history: [],
    geo: { done: { A: true }, coords: { A: { x: true, y: true } } },
    typed: "99",
  });
  add(fakeCoords && !fakeCoords.ok && !(fakeCoords.done && fakeCoords.done.A) ? { ok: true, id: "no-trust-client-point-done" } : fail("no-trust-client-point-done", JSON.stringify(snapCheck(fakeCoords))));

  var hintY = via({ intent: "hint", levelId: "geo-line-axis-1", n: 1, history: [], geo: {} });
  add(hintY && hintY.ok && !hintY.local && /x\s*=\s*0|ציר y/.test(hintY.message) && !/\(0;6\)/.test(hintY.message) ? { ok: true, id: "hint-y-intercept-early" } : fail("hint-y-intercept-early", JSON.stringify(hintY)));

  var oneY = via({ intent: "one-step", levelId: "geo-line-axis-1", n: 1, history: [], geo: {} });
  add(oneY && oneY.ok && oneY.step && /x\s*=\s*0/i.test(oneY.step) && !oneY.solved && !(oneY.done && oneY.done.A) ? { ok: true, id: "onestep-x0-not-solved" } : fail("onestep-x0-not-solved", JSON.stringify(oneY)));
  parityTyped("axis-x0", "geo-line-axis-1", 1, "x = 0", [], {});
  parityTyped("axis-wrong-y0-for-y-int", "geo-line-axis-1", 1, "y = 0", [], {});
  parityTyped("axis-direct-A", "geo-line-axis-1", 1, "A(0;6)", [], {});
  parityTyped("axis-B-y0", "geo-line-axis-1", 1, "y = 0", ["A(0;6)"], {});
  parityTyped("axis-B-wrong-x0", "geo-line-axis-1", 1, "x = 0", ["A(0;6)"], {});
  parityTyped("axis-B-direct", "geo-line-axis-1", 1, "B(-3;0)", ["A(0;6)"], {});

  var implicit = via({ intent: "one-step", levelId: "geo-line-axis-1", n: 3, history: [], geo: {} });
  add(implicit && implicit.ok && implicit.step && /y\s*=\s*0/i.test(implicit.step) ? { ok: true, id: "implicit-x-intercept-starts-y0" } : fail("implicit-x-intercept-starts-y0", JSON.stringify(implicit)));

  var horiz = via({ intent: "check", levelId: "geo-line-axis-1", n: 4, history: ["A(0;-12)", "B(4;0)", "P(-5;0)", "Q(0;-5)", "R(4;0)", "אין חיתוך עם ציר y", "S(0;-2)"], geo: {}, typed: "אין חיתוך עם ציר x" });
  add(horiz && horiz.ok && horiz.task && horiz.task.kind === "noIntercept" && horiz.solved ? { ok: true, id: "no-intercept-x" } : fail("no-intercept-x", JSON.stringify(snapCheck(horiz))));

  var onPlug = via({ intent: "check", levelId: "geo-line-points-1", n: 3, history: [], geo: {}, typed: "5 = 1 + 4" });
  add(onPlug && onPlug.ok && onPlug.task && onPlug.task.kind === "onLine" && !onPlug.done.A ? { ok: true, id: "online-plug" } : fail("online-plug", JSON.stringify(snapCheck(onPlug))));
  parityTyped("online-calc", "geo-line-points-1", 3, "5 = 5", ["5 = 1 + 4"], {});
  parityTyped("online-yes", "geo-line-points-1", 3, "כן", ["5 = 1 + 4", "5 = 5"], {});
  parityTyped("online-wrong-no", "geo-line-points-1", 3, "לא", ["5 = 1 + 4", "5 = 5"], {});
  var reason = via({ intent: "check", levelId: "geo-line-points-1", n: 3, history: ["5 = 1 + 4", "5 = 5", "כן"], geo: {}, typed: "הערכים משני הצדדים אותו הדבר" });
  add(reason && reason.ok && reason.done && reason.done.A ? { ok: true, id: "online-reason-completes" } : fail("online-reason-completes", JSON.stringify(snapCheck(reason))));

  var freeHist = [];
  var freeGeo = {};
  var guardF = 0;
  var freeReady = false;
  while (guardF < 40) {
    guardF += 1;
    var remF = handler.handle({
      topic: "analytic",
      capability: "points",
      intent: "setup",
      levelId: "geo-line-points-1",
      n: 4,
      history: freeHist,
      geo: {},
    });
    if (remF && remF.task && remF.task.kind === "freePoint") {
      freeReady = true;
      break;
    }
    var nxtF = handler.handle({
      topic: "analytic",
      capability: "points",
      intent: "one-step",
      levelId: "geo-line-points-1",
      n: 4,
      history: freeHist,
      geo: {},
    });
    if (!nxtF || !nxtF.ok || !nxtF.step) break;
    freeHist.push(nxtF.step);
  }
  add(freeReady ? { ok: true, id: "freepoint-reached" } : fail("freepoint-reached", JSON.stringify(freeHist)));
  var free = via({ intent: "check", levelId: "geo-line-points-1", n: 4, history: freeHist, geo: {}, typed: "(0;-1)" });
  add(free && free.ok && free.task && free.task.kind === "freePoint" && free.solved ? { ok: true, id: "freepoint-on-line" } : fail("freepoint-on-line", JSON.stringify(snapCheck(free))));
  var freeBad = via({ intent: "check", levelId: "geo-line-points-1", n: 4, history: freeHist, geo: {}, typed: "(0;0)" });
  add(freeBad && !freeBad.ok ? { ok: true, id: "freepoint-off-line" } : fail("freepoint-off-line", JSON.stringify(snapCheck(freeBad))));

  var solPts = via({ intent: "solution", levelId: "geo-line-points-1", n: 1, history: [], geo: {} });
  add(solPts && solPts.ok && !solPts.local && !solPts.mixed && solPts.steps && solPts.steps.length && solPts.done.A && solPts.coords && solPts.coords.A ? { ok: true, id: "solution-points-all-server" } : fail("solution-points-all-server", JSON.stringify(solPts && { mixed: solPts.mixed, n: solPts.steps && solPts.steps.length, coords: solPts.coords })));

  var solAxis = via({ intent: "solution", levelId: "geo-line-axis-1", n: 4, history: [], geo: {} });
  add(solAxis && solAxis.ok && !solAxis.local && solAxis.done.noX && solAxis.done.R ? { ok: true, id: "solution-axis-n4" } : fail("solution-axis-n4", JSON.stringify(solAxis && solAxis.done)));

  var setup = via({ intent: "setup", levelId: "geo-line-axis-1", n: 1, history: [], geo: {} });
  add(setup && setup.server && setup.capability === "points" && setup.task && setup.task.kind === "point" ? { ok: true, id: "setup-points-capability" } : fail("setup-points-capability", JSON.stringify(setup)));

  var gateArea = handler.handle({ topic: "analytic", capability: "points", intent: "one-step", levelId: "geo-triangle-area-1", n: 5, history: [], geo: {} });
  add(gateArea && gateArea.local && gateArea.task && gateArea.task.kind === "point" ? { ok: true, id: "gate-area-point-stays-local" } : fail("gate-area-point-stays-local", JSON.stringify(gateArea)));

  var gateMbFuture = handler.handle({ topic: "analytic", capability: "points", intent: "one-step", levelId: "geo-perp-1", n: 1, history: [], geo: {} });
  add(gateMbFuture && gateMbFuture.ok && !gateMbFuture.local ? { ok: true, id: "gate-perp-points-server" } : fail("gate-perp-points-server", JSON.stringify(gateMbFuture)));

  var gateMid = handler.handle({ topic: "analytic", capability: "points", intent: "one-step", levelId: "geo-distance-1", n: 1, history: [], geo: {} });
  add(gateMid && gateMid.ok && !gateMid.local ? { ok: true, id: "gate-distance-points-server" } : fail("gate-distance-points-server", JSON.stringify(gateMid)));

  var recon = reconstruct(engine, ptsPack, ["A(2;4)"], { done: {}, coords: {} });
  add(recon.done && recon.done.A && recon.coords.A && recon.coords.A.x && recon.coords.A.y ? { ok: true, id: "reconstruct-direct-point" } : fail("reconstruct-direct-point", JSON.stringify(recon)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/function isGeoPointPage/.test(src) && /geo-line-points-1/.test(src) && /geo-line-axis-1/.test(src) ? { ok: true, id: "gate-point-pages" } : fail("gate-point-pages", "missing"));
  add(/"points"/.test(src) ? { ok: true, id: "gate-points-capability" } : fail("gate-points-capability", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "points"/.test(geoApi) ? { ok: true, id: "points-capability-wired" } : fail("points-capability-wired", geoApi));

  var api = fs.readFileSync(path.join(__dirname, "api.js"), "utf8");
  add(/\/api\/geometry/.test(api) && !/\/api\/geometry\/points/.test(api) ? { ok: true, id: "single-endpoint" } : fail("single-endpoint", "split endpoint"));

  console.log("parity-geo-points: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 40).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
