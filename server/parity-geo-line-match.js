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
    message: String(res.message || ""),
    show: res.show ? String(res.show) : "",
    taskId: res.task && res.task.id ? res.task.id : null,
    doneIds: Object.keys(res.done || {})
      .filter(function (k) {
        return res.done[k];
      })
      .sort(),
    lineKeys: Object.keys(res.lineMatch || {})
      .map(function (k) {
        var row = res.lineMatch[k] || {};
        return k + ":" + (row.lineKey || "") + ":" + (row.reason || "") + ":" + (!!row.lineDone) + ":" + (!!row.reasonDone);
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
    return handler.handle(
      Object.assign({ topic: "analytic", capability: "line-match" }, payload)
    );
  }

  function parityAction(id, n, action, history, geo) {
    var pack = packFor(engine, "geo-line-match-1", n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var local =
      action.type === "lineMatch.line"
        ? G.submitLineMatchLine(action.taskId, action.lineKey, pack, progress)
        : G.submitLineMatchReason(action.taskId, action.reasonId, pack, progress);
    if (local && local.ok) {
      if (local.done) progress.done = local.done;
      if (local.lineMatch) progress.lineMatch = local.lineMatch;
      if (G.lineMatchAutoCompleteRemaining && local.done) {
        var auto = G.lineMatchAutoCompleteRemaining(pack, progress);
        if (auto && auto.length) {
          var last = auto[auto.length - 1];
          if (last.done) local.done = last.done;
          if (last.solved) local.solved = true;
          if (last.lineMatch) local.lineMatch = last.lineMatch;
        }
      }
    }
    var remote = via({
      intent: "check",
      levelId: "geo-line-match-1",
      n: n,
      history: history,
      geo: geo,
      action: action,
    });
    var ls = snapCheck(local);
    var rs = snapCheck(remote);
    var match =
      ls.ok === rs.ok &&
      ls.solved === rs.solved &&
      ls.message === rs.message &&
      ls.show === rs.show &&
      ls.taskId === rs.taskId &&
      JSON.stringify(ls.doneIds) === JSON.stringify(rs.doneIds);
    add(match ? { ok: true, id: id } : fail(id, JSON.stringify({ action: action, ls: ls, rs: rs })));
    return remote;
  }

  var pack19 = packFor(engine, "geo-line-match-1", 19);
  add(
    pack19 && pack19.tasks.every(function (t) { return t.kind === "lineMatch"; })
      ? { ok: true, id: "pack-match-19-kinds" }
      : fail("pack-match-19-kinds", "unexpected")
  );

  parityAction("match-wrong-line", 19, { type: "lineMatch.line", taskId: "eq1", lineKey: "II" }, [], {});
  parityAction("match-correct-line", 19, { type: "lineMatch.line", taskId: "eq1", lineKey: "I" }, [], {});
  parityAction(
    "match-wrong-reason",
    19,
    { type: "lineMatch.reason", taskId: "eq1", reasonId: "m_neg" },
    ["lineMatch:line:eq1:I"],
    {}
  );
  parityAction(
    "match-reason-before-line",
    19,
    { type: "lineMatch.reason", taskId: "eq1", reasonId: "m_pos" },
    [],
    {}
  );
  parityAction(
    "match-correct-reason",
    19,
    { type: "lineMatch.reason", taskId: "eq1", reasonId: "m_pos" },
    ["lineMatch:line:eq1:I"],
    {}
  );

  var fakeDone = via({
    intent: "check",
    levelId: "geo-line-match-1",
    n: 19,
    history: [],
    geo: { done: { eq1: true, eq2: true }, lineMatch: { eq1: { lineDone: true, reasonDone: true, lineKey: "I" } } },
    action: { type: "lineMatch.line", taskId: "eq1", lineKey: "II" },
  });
  add(
    fakeDone && !fakeDone.ok && !(fakeDone.done && fakeDone.done.eq1)
      ? { ok: true, id: "no-trust-client-match-done" }
      : fail("no-trust-client-match-done", JSON.stringify(snapCheck(fakeDone)))
  );

  var hintLine = via({ intent: "hint", levelId: "geo-line-match-1", n: 19, history: [], geo: {} });
  add(
    hintLine && hintLine.ok && !hintLine.local && /שיפוע|ישר/.test(hintLine.message) && !/answerKey|eq1 →/.test(hintLine.message)
      ? { ok: true, id: "hint-match-no-answer" }
      : fail("hint-match-no-answer", JSON.stringify(hintLine))
  );

  var hintReason = via({
    intent: "hint",
    levelId: "geo-line-match-1",
    n: 19,
    history: ["lineMatch:line:eq1:I"],
    geo: {},
  });
  add(
    hintReason && /נמק|שיפוע חיובי/.test(hintReason.message)
      ? { ok: true, id: "hint-match-reason" }
      : fail("hint-match-reason", JSON.stringify(hintReason))
  );

  var oneLine = via({ intent: "one-step", levelId: "geo-line-match-1", n: 19, history: [], geo: {} });
  add(
    oneLine && oneLine.ok && oneLine.matchAction && oneLine.matchAction.type === "lineMatch.line" && oneLine.step && !oneLine.solved
      ? { ok: true, id: "onestep-line-not-solved" }
      : fail("onestep-line-not-solved", JSON.stringify(oneLine))
  );

  var oneReason = via({
    intent: "one-step",
    levelId: "geo-line-match-1",
    n: 19,
    history: ["lineMatch:line:eq1:I"],
    geo: {},
  });
  add(
    oneReason && oneReason.ok && oneReason.matchAction && oneReason.matchAction.type === "lineMatch.reason" && oneReason.done && oneReason.done.eq1
      ? { ok: true, id: "onestep-reason-not-full-solved" }
      : fail("onestep-reason-not-full-solved", JSON.stringify(oneReason))
  );

  var noneWrong = via({
    intent: "check",
    levelId: "geo-line-match-1",
    n: 31,
    history: [],
    geo: {},
    action: { type: "lineMatch.line", taskId: "eq3", lineKey: "I" },
  });
  add(
    noneWrong && !noneWrong.ok
      ? { ok: true, id: "none-wrong-line" }
      : fail("none-wrong-line", JSON.stringify(snapCheck(noneWrong)))
  );

  var noneOk = via({
    intent: "check",
    levelId: "geo-line-match-1",
    n: 31,
    history: [],
    geo: {},
    action: { type: "lineMatch.line", taskId: "eq3", lineKey: "none" },
  });
  add(
    noneOk && noneOk.ok
      ? { ok: true, id: "none-correct" }
      : fail("none-correct", JSON.stringify(snapCheck(noneOk)))
  );

  var three = via({
    intent: "check",
    levelId: "geo-line-match-1",
    n: 28,
    history: [],
    geo: {},
    action: { type: "lineMatch.line", taskId: "eq1", lineKey: "III" },
  });
  add(three && three.ok ? { ok: true, id: "three-lines-choice" } : fail("three-lines-choice", JSON.stringify(snapCheck(three))));

  var typedReject = via({
    intent: "check",
    levelId: "geo-line-match-1",
    n: 19,
    history: [],
    geo: {},
    typed: "I",
  });
  add(typedReject && !typedReject.ok ? { ok: true, id: "typed-not-choice" } : fail("typed-not-choice", JSON.stringify(snapCheck(typedReject))));

  var sol = via({ intent: "solution", levelId: "geo-line-match-1", n: 19, history: [], geo: {} });
  add(
    sol && sol.ok && !sol.local && sol.steps && sol.steps.length && sol.done.eq1 && sol.done.eq2
      ? { ok: true, id: "solution-match-server" }
      : fail("solution-match-server", JSON.stringify(sol && { mixed: sol.mixed, done: sol.done }))
  );

  var setup = via({ intent: "setup", levelId: "geo-line-match-1", n: 19, history: [], geo: {} });
  add(
    setup && setup.server && setup.capability === "line-match"
      ? { ok: true, id: "setup-line-match-capability" }
      : fail("setup-line-match-capability", JSON.stringify(setup))
  );

  var laterMatch = handler.handle({
    topic: "analytic",
    capability: "line-match",
    intent: "one-step",
    levelId: "geo-perp-1",
    n: 1,
    history: [],
    geo: {},
  });
  add(
    laterMatch && laterMatch.ok && !laterMatch.local
      ? { ok: true, id: "gate-perp-now-server" }
      : fail("gate-perp-now-server", JSON.stringify(laterMatch))
  );

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoLineMatchPage/.test(src) && /requestLineMatchAction/.test(src) ? { ok: true, id: "gate-match-page" } : fail("gate-match-page", "missing"));
  add(/payload.action/.test(src) ? { ok: true, id: "client-sends-action" } : fail("client-sends-action", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "line-match"/.test(geoApi) ? { ok: true, id: "match-capability-wired" } : fail("match-capability-wired", geoApi));

  var api = fs.readFileSync(path.join(__dirname, "api.js"), "utf8");
  add(/\/api\/geometry/.test(api) && !/\/api\/geometry\/line/.test(api) ? { ok: true, id: "single-endpoint" } : fail("single-endpoint", "split"));

  console.log("parity-geo-line-match: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 40).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
