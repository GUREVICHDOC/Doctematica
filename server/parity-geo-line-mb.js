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
    mbRearranged: !!res.mbRearranged,
    mbRearrangeExpr: res.mbRearrangeExpr ? String(res.mbRearrangeExpr) : "",
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
      Object.assign({ topic: "analytic", capability: "line-mb" }, payload)
    );
  }

  function parityTyped(id, n, typed, history, geo) {
    var pack = packFor(engine, "geo-line-mb-1", n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var local = G.checkTyped(typed, pack, progress);
    var remote = via({
      intent: "check",
      levelId: "geo-line-mb-1",
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
      ls.mbRearranged === rs.mbRearranged;
    add(match ? { ok: true, id: id } : fail(id, JSON.stringify({ typed: typed, ls: ls, rs: rs })));
    return remote;
  }

  var pack1 = packFor(engine, "geo-line-mb-1", 1);
  add(
    pack1 && pack1.tasks.every(function (t) { return t.kind === "lineMb"; })
      ? { ok: true, id: "pack-mb-1-kinds" }
      : fail("pack-mb-1-kinds", "unexpected")
  );

  parityTyped("mb-sorted-m", 1, "m = 2", [], {});
  parityTyped("mb-sorted-b", 1, "b = −8", ["m = 2"], {});
  parityTyped("mb-direct-number-m", 1, "2", [], {});
  parityTyped("mb-b-while-m-pending", 1, "b = −8", [], {});
  parityTyped("mb-swap-m-gets-b", 1, "−8", [], {});
  parityTyped("mb-wrong-sign", 1, "m = −2", [], {});
  parityTyped("mb-wrong-m", 1, "m = 5", [], {});

  var fakeMb = via({
    intent: "check",
    levelId: "geo-line-mb-1",
    n: 1,
    history: [],
    geo: { done: { m: true, b: true }, mbRearranged: true },
    typed: "99",
  });
  add(
    fakeMb && !fakeMb.ok && !(fakeMb.done && fakeMb.done.m)
      ? { ok: true, id: "no-trust-client-mb-done" }
      : fail("no-trust-client-mb-done", JSON.stringify(snapCheck(fakeMb)))
  );

  parityTyped("mb-neg-slope", 2, "m = −4", [], {});
  parityTyped("mb-neg-b", 2, "b = 7", ["m = −4"], {});
  parityTyped("mb-frac-m", 4, "m = 2/5", [], {});
  parityTyped("mb-b0", 6, "b = 0", ["m = 2"], {});
  parityTyped("mb-m0", 8, "m = 0", [], {});
  parityTyped("mb-m0-b", 8, "b = 5", ["m = 0"], {});

  var hintSorted = via({ intent: "hint", levelId: "geo-line-mb-1", n: 1, history: [], geo: {} });
  add(
    hintSorted && hintSorted.ok && !hintSorted.local && /שיפוע|m/.test(hintSorted.message)
      ? { ok: true, id: "hint-sorted-m" }
      : fail("hint-sorted-m", JSON.stringify(hintSorted))
  );

  var oneSorted = via({ intent: "one-step", levelId: "geo-line-mb-1", n: 1, history: [], geo: {} });
  add(
    oneSorted && oneSorted.ok && oneSorted.step && /m\s*=\s*2/.test(oneSorted.step) && !oneSorted.solved
      ? { ok: true, id: "onestep-m-not-solved" }
      : fail("onestep-m-not-solved", JSON.stringify(oneSorted))
  );

  var hintUnsorted = via({ intent: "hint", levelId: "geo-line-mb-1", n: 10, history: [], geo: {} });
  add(
    hintUnsorted && hintUnsorted.ok && /לסדר|y = mx/.test(hintUnsorted.message) && !/m\s*=\s*−3/.test(hintUnsorted.message)
      ? { ok: true, id: "hint-unsorted-rearrange-first" }
      : fail("hint-unsorted-rearrange-first", JSON.stringify(hintUnsorted))
  );

  var oneUnsorted = via({ intent: "one-step", levelId: "geo-line-mb-1", n: 10, history: [], geo: {} });
  add(
    oneUnsorted && oneUnsorted.ok && oneUnsorted.step && /=/.test(oneUnsorted.step) && !(oneUnsorted.done && oneUnsorted.done.m) && !oneUnsorted.solved
      ? { ok: true, id: "onestep-rearrange-not-solved" }
      : fail("onestep-rearrange-not-solved", JSON.stringify(oneUnsorted))
  );

  parityTyped("mb-bad-rearrange", 10, "y + 3x = 11", [], {});
  parityTyped("mb-same-eq", 10, "y + 3x = 10", [], {});
  parityTyped("mb-direct-m-unsorted", 10, "m = −3", [], {});
  parityTyped("mb-rearrange-y", 10, "y = −3x + 10", [], {});
  parityTyped("mb-m-after-rearrange", 10, "m = −3", ["y = −3x + 10"], {});
  parityTyped("mb-b-after-m-unsorted", 10, "b = 10", ["y = −3x + 10", "m = −3"], {});

  var sol = via({ intent: "solution", levelId: "geo-line-mb-1", n: 1, history: [], geo: {} });
  add(
    sol && sol.ok && !sol.local && !sol.mixed && sol.steps && sol.steps.length && sol.done.m && sol.done.b
      ? { ok: true, id: "solution-mb-server" }
      : fail("solution-mb-server", JSON.stringify(sol && { mixed: sol.mixed, n: sol.steps && sol.steps.length, done: sol.done }))
  );

  var setup = via({ intent: "setup", levelId: "geo-line-mb-1", n: 1, history: [], geo: {} });
  add(
    setup && setup.server && setup.capability === "line-mb" && setup.task && setup.task.kind === "lineMb"
      ? { ok: true, id: "setup-line-mb-capability" }
      : fail("setup-line-mb-capability", JSON.stringify(setup))
  );

  var gateFuture = handler.handle({
    topic: "analytic",
    capability: "line-mb",
    intent: "one-step",
    levelId: "geo-perp-1",
    n: 1,
    history: [],
    geo: {},
  });
  add(
    gateFuture && gateFuture.ok && !gateFuture.local
      ? { ok: true, id: "gate-perp-now-server" }
      : fail("gate-perp-now-server", JSON.stringify(gateFuture))
  );

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoLineMbPage/.test(src) && /geo-line-mb-1/.test(src) ? { ok: true, id: "gate-mb-page" } : fail("gate-mb-page", "missing"));
  add(/"line-mb"/.test(src) ? { ok: true, id: "gate-mb-capability" } : fail("gate-mb-capability", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "line-mb"/.test(geoApi) ? { ok: true, id: "mb-capability-wired" } : fail("mb-capability-wired", geoApi));

  console.log("parity-geo-line-mb: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 40).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
