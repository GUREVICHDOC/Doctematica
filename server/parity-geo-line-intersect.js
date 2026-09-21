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
    equated: !!(res.intersect && res.intersect.equated),
    xDone: !!(res.intersect && res.intersect.xDone),
    yDone: !!(res.intersect && res.intersect.yDone),
    hasCoordX: !!(res.coords && res.coords.P && res.coords.P.x),
    hasCoordY: !!(res.coords && res.coords.P && res.coords.P.y),
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
      Object.assign({ topic: "analytic", capability: "line-intersect" }, payload)
    );
  }

  function parityTyped(id, n, typed, history, geo) {
    var pack = packFor(engine, "geo-line-intersect-1", n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var local = G.checkTyped(typed, pack, progress);
    var remote = via({
      intent: "check",
      levelId: "geo-line-intersect-1",
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
      ls.equated === rs.equated &&
      ls.xDone === rs.xDone &&
      ls.yDone === rs.yDone;
    add(match ? { ok: true, id: id } : fail(id, JSON.stringify({ typed: typed, ls: ls, rs: rs })));
    return remote;
  }

  var pack1 = packFor(engine, "geo-line-intersect-1", 1);
  add(
    pack1 && pack1.tasks.length === 1 && pack1.tasks[0].kind === "lineIntersect"
      ? { ok: true, id: "pack-intersect-1" }
      : fail("pack-intersect-1", "unexpected")
  );

  var canon = G.canonicalLineIntersectSteps(pack1.tasks[0], pack1);
  var equate = canon && canon[0];
  add(equate && /=/.test(equate) ? { ok: true, id: "canonical-equate-n1" } : fail("canonical-equate-n1", JSON.stringify(canon)));

  parityTyped("n1-wrong-equate", 1, "x + 2 = x + 6", [], {});
  parityTyped("n1-equate", 1, equate, [], {});
  var rev = String(equate || "")
    .split("=")
    .map(function (s) {
      return s.trim();
    });
  if (rev.length === 2) {
    parityTyped("n1-equate-reverse", 1, rev[1] + " = " + rev[0], [], {});
  }
  parityTyped("n1-direct-point", 1, "P(2;4)", [], {});
  parityTyped("n1-swapped-xy", 1, "P(4;2)", [], {});
  parityTyped("n1-wrong-point", 1, "P(2;5)", [], {});

  var afterEq = via({ intent: "check", levelId: "geo-line-intersect-1", n: 1, history: [], geo: {}, typed: equate });
  add(afterEq && afterEq.ok && afterEq.intersect && afterEq.intersect.equated && !afterEq.done.P ? { ok: true, id: "equate-not-done" } : fail("equate-not-done", JSON.stringify(snapCheck(afterEq))));

  var histEq = [equate];
  var oneX = via({ intent: "one-step", levelId: "geo-line-intersect-1", n: 1, history: histEq, geo: {} });
  add(oneX && oneX.ok && oneX.step && !oneX.solved ? { ok: true, id: "onestep-after-equate-not-solved" } : fail("onestep-after-equate-not-solved", JSON.stringify(oneX)));
  if (oneX && oneX.step) {
    parityTyped("n1-algebra-step", 1, oneX.step, histEq, {});
  }

  parityTyped("n1-direct-x", 1, "x = 2", histEq, {});
  var histX = histEq.concat(["x = 2"]);
  parityTyped("n1-plug", 1, "y = 2 + 2", histX, {});
  parityTyped("n1-y", 1, "y = 4", histX.concat(["y = 2 + 2"]), {});
  parityTyped("n1-point-after", 1, "P(2;4)", histX.concat(["y = 2 + 2", "y = 4"]), {});
  parityTyped("n1-wrong-y", 1, "y = 9", histX, {});

  var otherPlug = via({
    intent: "check",
    levelId: "geo-line-intersect-1",
    n: 1,
    history: histX,
    geo: {},
    typed: "y = −2 + 6",
  });
  var localOther = G.checkTyped("y = −2 + 6", pack1, reconstruct(engine, pack1, histX, {}));
  add(
    snapCheck(localOther).ok === snapCheck(otherPlug).ok
      ? { ok: true, id: "n1-alt-line-plug-parity" }
      : fail("n1-alt-line-plug-parity", JSON.stringify({ local: snapCheck(localOther), remote: snapCheck(otherPlug) }))
  );

  var fake = via({
    intent: "check",
    levelId: "geo-line-intersect-1",
    n: 1,
    history: [],
    geo: { done: { P: true }, intersect: { equated: true, xDone: true, yDone: true }, coords: { P: { x: true, y: true } } },
    typed: "99",
  });
  add(
    fake && !fake.ok && !(fake.done && fake.done.P)
      ? { ok: true, id: "no-trust-client-intersect-done" }
      : fail("no-trust-client-intersect-done", JSON.stringify(snapCheck(fake)))
  );

  var hint1 = via({ intent: "hint", levelId: "geo-line-intersect-1", n: 1, history: [], geo: {} });
  add(
    hint1 && hint1.ok && !hint1.local && /השוו|y/.test(hint1.message) && !/\(2;4\)/.test(hint1.message)
      ? { ok: true, id: "hint-equate-no-point" }
      : fail("hint-equate-no-point", JSON.stringify(hint1))
  );

  var one1 = via({ intent: "one-step", levelId: "geo-line-intersect-1", n: 1, history: [], geo: {} });
  add(
    one1 && one1.ok && one1.step && !one1.solved && !(one1.done && one1.done.P)
      ? { ok: true, id: "onestep-equate-not-solved" }
      : fail("onestep-equate-not-solved", JSON.stringify(one1))
  );

  var pack3 = packFor(engine, "geo-line-intersect-1", 3);
  var hint3 = via({ intent: "hint", levelId: "geo-line-intersect-1", n: 3, history: [], geo: {} });
  add(
    hint3 && hint3.ok && !hint3.local && /סדר|y = mx|העבירו|איבר/.test(hint3.message) && !/\(−2;−8\)/.test(hint3.message)
      ? { ok: true, id: "hint-rearrange-first" }
      : fail("hint-rearrange-first", JSON.stringify(hint3))
  );
  parityTyped("n3-bad-rearrange", 3, "y + 4x = 0", [], {});
  var one3 = via({ intent: "one-step", levelId: "geo-line-intersect-1", n: 3, history: [], geo: {} });
  add(one3 && one3.ok && one3.step && !one3.solved ? { ok: true, id: "onestep-rearrange-n3" } : fail("onestep-rearrange-n3", JSON.stringify(one3)));
  if (one3 && one3.step) {
    parityTyped("n3-rearrange-step", 3, one3.step, [], {});
  }

  parityTyped("n2-direct-neg", 2, "P(10;−6)", [], {});
  parityTyped("n5-frac-direct", 5, "P(4;4)", [], {});
  parityTyped("n4-origin-b0", 4, "P(1;3)", [], {});

  var sol1 = via({ intent: "solution", levelId: "geo-line-intersect-1", n: 1, history: [], geo: {} });
  add(
    sol1 && sol1.ok && !sol1.local && !sol1.mixed && sol1.steps && sol1.steps.length && sol1.done.P
      ? { ok: true, id: "solution-pure-server" }
      : fail("solution-pure-server", JSON.stringify(sol1 && { mixed: sol1.mixed, n: sol1.steps && sol1.steps.length }))
  );

  var sol8 = via({ intent: "solution", levelId: "geo-line-intersect-1", n: 8, history: [], geo: {} });
  add(
    sol8 && sol8.ok && !sol8.local && !sol8.mixed && sol8.steps && sol8.steps.length
      ? { ok: true, id: "solution-n8-server" }
      : fail("solution-n8-server", JSON.stringify(sol8))
  );

  var setup = via({ intent: "setup", levelId: "geo-line-intersect-1", n: 1, history: [], geo: {} });
  add(
    setup && setup.server && setup.capability === "line-intersect"
      ? { ok: true, id: "setup-capability" }
      : fail("setup-capability", JSON.stringify(setup))
  );

  var gateFuture = handler.handle({
    topic: "analytic",
    capability: "line-intersect",
    intent: "one-step",
    levelId: "geo-perp-1",
    n: 1,
    history: [],
    geo: {},
  });
  add(gateFuture && gateFuture.ok && !gateFuture.local ? { ok: true, id: "gate-perp-now-server" } : fail("gate-perp-now-server", JSON.stringify(gateFuture)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoLineIntersectPage/.test(src) && /geo-line-intersect-1/.test(src) ? { ok: true, id: "gate-page" } : fail("gate-page", "missing"));
  add(/"line-intersect"/.test(src) ? { ok: true, id: "gate-capability-client" } : fail("gate-capability-client", "missing"));
  add(/showBasicEqServerUnavailable/.test(src) && /isGeoExtraPointPage/.test(src) ? { ok: true, id: "node-off-wired" } : fail("node-off-wired", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "line-intersect"/.test(geoApi) ? { ok: true, id: "capability-wired" } : fail("capability-wired", geoApi));

  console.log("parity-geo-line-intersect: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 40).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
