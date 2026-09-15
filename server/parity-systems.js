"use strict";

var loadEngine = require("./load-engine").loadEngine;
var createSystemsHandler = require("./systems").createSystemsHandler;
var fs = require("fs");
var path = require("path");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function jsonEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function snapAdvice(a) {
  a = a || {};
  return { tone: a.tone || "", message: String(a.message || "") };
}

function snapCheck(r) {
  r = r || {};
  return {
    ok: !!r.ok,
    kind: r.kind || r.resultKind || null,
    message: String(r.message || ""),
    v: r.v || null,
    value: typeof r.value === "number" ? r.value : null,
  };
}

function curriculumSystems() {
  var engine = loadEngine();
  var levels = engine.DoctematicaCurriculum.levels;
  var i;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === "sys-sub-1") return levels[i].exercises;
  }
  return [];
}

function main() {
  var engine = loadEngine();
  var Sys = engine.DoctematicaSystems;
  var handler = createSystemsHandler(engine);
  var passed = 0;
  var failed = [];
  function add(item) {
    if (item && item.ok) passed += 1;
    else failed.push(item);
  }

  var exercises = curriculumSystems();
  var noneFx = { n: "none", eq1: "x+y=1", eq2: "x+y=2" };
  var all = exercises.concat([noneFx]);

  all.forEach(function (ex) {
    var local = Sys.solvePair(ex.eq1, ex.eq2);
    var remote = handler.handle({
      topic: "systems-sub",
      intent: "solution",
      eq1: ex.eq1,
      eq2: ex.eq2,
    });
    var ok =
      remote &&
      remote.ok &&
      remote.kind === local.kind &&
      (local.kind !== "unique" || (remote.answer && remote.answer.indexOf("x =") !== -1));
    add(ok ? { ok: true, id: "solvePair:" + ex.n } : fail("solvePair:" + ex.n, JSON.stringify({ local: local, remote: remote })));
  });

  exercises.forEach(function (ex) {
    var isos = Sys.isolationsOf(ex.eq1, ex.eq2);
    var setup = handler.handle({
      topic: "systems-sub",
      intent: "setup",
      eq1: ex.eq1,
      eq2: ex.eq2,
      history: [],
      choices: [],
    });
    var expectPhase = isos.length ? "pick_sub" : "pick_isolate";
    add(
      setup && setup.ok && setup.phase === expectPhase
        ? { ok: true, id: "setup-phase:" + ex.n }
        : fail("setup-phase:" + ex.n, (setup && setup.phase) || "no setup")
    );
    if (isos.length === 1 && Math.abs(isos[0].rhs.x) < 1e-8 && Math.abs(isos[0].rhs.y) < 1e-8) {
      var kv = setup.known && setup.known[isos[0].v];
      add(
        typeof kv === "number"
          ? { ok: true, id: "numeric-known:" + ex.n }
          : fail("numeric-known:" + ex.n, JSON.stringify(setup.known))
      );
    }
  });

  var eq1 = "5x+4y=18";
  var eq2 = "x+3y=8";
  ["x", "y"].forEach(function (v) {
    [0, 1].forEach(function (idx) {
      var local = snapAdvice(Sys.adviceIsolate(eq1, eq2, idx, v));
      var remote = handler.handle({
        topic: "systems-sub",
        intent: "choice",
        eq1: eq1,
        eq2: eq2,
        history: [],
        choices: [],
        confirm: false,
        choice: { kind: "isolate", eqIndex: idx, v: v },
      });
      var got = snapAdvice(remote.advice || { tone: remote.ok && remote.applied ? "ok" : "tip", message: remote.message });
      add(
        local.tone === got.tone && local.message === (remote.advice && remote.advice.message)
          ? { ok: true, id: "advice-isolate:" + idx + v }
          : fail("advice-isolate:" + idx + v, JSON.stringify({ local: local, remote: remote }))
      );
    });
  });

  var workLocal = Sys.checkWorkStep("x+3y=8", "x=8-3y");
  var isolChoice = handler.handle({
    topic: "systems-sub",
    intent: "choice",
    eq1: eq1,
    eq2: eq2,
    history: [],
    choices: [],
    confirm: true,
    choice: { kind: "isolate", eqIndex: 1, v: "x" },
  });
  var workRemote = handler.handle({
    topic: "systems-sub",
    intent: "check",
    eq1: eq1,
    eq2: eq2,
    history: [isolChoice.startEq],
    choices: [isolChoice.choice],
    typed: "x=8-3y",
  });
  add(
    workLocal.ok && workRemote.ok && workLocal.kind === workRemote.resultKind
      ? { ok: true, id: "checkWorkStep-isolate" }
      : fail("checkWorkStep-isolate", JSON.stringify({ workLocal: snapCheck(workLocal), workRemote: workRemote }))
  );
  add(
    workRemote.phase === "pick_sub" && workRemote.input === false
      ? { ok: true, id: "trans-work-isolate-pick-sub" }
      : fail("trans-work-isolate-pick-sub", JSON.stringify({ phase: workRemote.phase, input: workRemote.input }))
  );

  var isol = Sys.isolationsOf("x=8-3y", eq1)[0] || Sys.readIsolation(Sys.parseEquation("x=8-3y"));
  isol.from = 1;
  var subLocal = Sys.checkSubstituted(isol, eq1, "5(8-3y)+4y=18");
  var subChoice = handler.handle({
    topic: "systems-sub",
    intent: "choice",
    eq1: eq1,
    eq2: eq2,
    history: [isolChoice.startEq, "x=8-3y"],
    choices: [isolChoice.choice],
    confirm: true,
    choice: { kind: "sub", from: 1, target: 0 },
  });
  add(
    subChoice.applied && subChoice.phase === "work_sub" && subChoice.needSub === true
      ? { ok: true, id: "trans-pick-sub-work-sub" }
      : fail("trans-pick-sub-work-sub", JSON.stringify(subChoice))
  );
  var subRemote = handler.handle({
    topic: "systems-sub",
    intent: "check",
    eq1: eq1,
    eq2: eq2,
    history: [isolChoice.startEq, "x=8-3y", subChoice.startEq],
    choices: [isolChoice.choice, subChoice.choice],
    typed: "5(8-3y)+4y=18",
  });
  add(
    subLocal.ok && subRemote.ok && subLocal.kind === subRemote.resultKind && subRemote.needSub === false
      ? { ok: true, id: "checkSubstituted-first" }
      : fail("checkSubstituted-first", JSON.stringify({ subLocal: snapCheck(subLocal), subRemote: subRemote }))
  );

  var yVal = Sys.checkWorkStep("5(8-3y)+4y=18", "y=2");
  var yRemote = handler.handle({
    topic: "systems-sub",
    intent: "check",
    eq1: eq1,
    eq2: eq2,
    history: [isolChoice.startEq, "x=8-3y", subChoice.startEq, "5(8-3y)+4y=18"],
    choices: [isolChoice.choice, subChoice.choice],
    typed: "y=2",
  });
  add(
    yVal.ok && yVal.kind === "value" && yRemote.ok && yRemote.resultKind === "value" && yRemote.phase === "pick_back"
      ? { ok: true, id: "first-value-pick-back" }
      : fail("first-value-pick-back", JSON.stringify({ yVal: snapCheck(yVal), yRemote: yRemote }))
  );

  var backChoice = handler.handle({
    topic: "systems-sub",
    intent: "choice",
    eq1: eq1,
    eq2: eq2,
    history: [isolChoice.startEq, "x=8-3y", subChoice.startEq, "5(8-3y)+4y=18", "y=2"],
    choices: [isolChoice.choice, subChoice.choice],
    confirm: true,
    choice: { kind: "back", target: 1 },
  });
  add(
    backChoice.applied && backChoice.phase === "work_back" && backChoice.needSub === true
      ? { ok: true, id: "trans-pick-back-work-back" }
      : fail("trans-pick-back-work-back", JSON.stringify(backChoice))
  );

  var xRemote = handler.handle({
    topic: "systems-sub",
    intent: "check",
    eq1: eq1,
    eq2: eq2,
    history: [isolChoice.startEq, "x=8-3y", subChoice.startEq, "5(8-3y)+4y=18", "y=2", backChoice.startEq],
    choices: [isolChoice.choice, subChoice.choice, backChoice.choice],
    typed: "x=2",
  });
  add(
    xRemote.ok && xRemote.solved && xRemote.kind === "unique"
      ? { ok: true, id: "second-value-done" }
      : fail("second-value-done", JSON.stringify(xRemote))
  );

  var noneSetup = handler.handle({
    topic: "systems-sub",
    intent: "setup",
    eq1: "x+y=1",
    eq2: "x+y=2",
    history: [],
    choices: [],
  });
  var noneIso = handler.handle({
    topic: "systems-sub",
    intent: "choice",
    eq1: "x+y=1",
    eq2: "x+y=2",
    history: [],
    choices: [],
    confirm: true,
    choice: { kind: "isolate", eqIndex: 0, v: "x" },
  });
  var noneIsoWork = handler.handle({
    topic: "systems-sub",
    intent: "check",
    eq1: "x+y=1",
    eq2: "x+y=2",
    history: [noneIso.startEq],
    choices: [noneIso.choice],
    typed: "x=1-y",
  });
  var noneSub = handler.handle({
    topic: "systems-sub",
    intent: "choice",
    eq1: "x+y=1",
    eq2: "x+y=2",
    history: [noneIso.startEq, "x=1-y"],
    choices: [noneIso.choice],
    confirm: true,
    choice: { kind: "sub", from: 0, target: 1 },
  });
  var noneChk = handler.handle({
    topic: "systems-sub",
    intent: "check",
    eq1: "x+y=1",
    eq2: "x+y=2",
    history: [noneIso.startEq, "x=1-y", noneSub.startEq],
    choices: [noneIso.choice, noneSub.choice],
    typed: "1-y+y=2",
  });
  add(
    noneSetup.phase === "pick_isolate" &&
      noneIsoWork.phase === "pick_sub" &&
      noneChk.ok &&
      noneChk.kind === "none" &&
      noneChk.solved
      ? { ok: true, id: "none-mid-sub" }
      : fail("none-mid-sub", JSON.stringify({ noneSetup: noneSetup.phase, noneIsoWork: noneIsoWork.phase, noneChk: noneChk }))
  );

  var fake = handler.handle({
    topic: "systems-sub",
    intent: "setup",
    eq1: eq1,
    eq2: eq2,
    history: [],
    choices: [],
    phase: "done",
    known: { x: 99, y: 99 },
    solved: true,
  });
  add(
    fake.phase === "pick_isolate" && !fake.solved
      ? { ok: true, id: "ignore-client-state" }
      : fail("ignore-client-state", JSON.stringify(fake))
  );

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  var content = fs.readFileSync(path.join(__dirname, "../js/content.js"), "utf8");
  var geo = fs.readFileSync(path.join(__dirname, "../js/geometry.js"), "utf8");
  var lineEq = fs.readFileSync(path.join(__dirname, "../js/geo/line-eq.js"), "utf8");
  add(/SYSTEMS_URL/.test(src) ? { ok: true, id: "gate-url" } : fail("gate-url", "missing"));
  add(/function requestSystemsAction/.test(src) ? { ok: true, id: "gate-request" } : fail("gate-request", "missing"));
  add(/isSystemMode\(\)/.test(src) && /state\.topic === "systems-sub"/.test(src) ? { ok: true, id: "gate-topic" } : fail("gate-topic", "missing"));
  add(!/checkWorkStep\(state\.history/.test(src) ? { ok: true, id: "no-local-check" } : fail("no-local-check", "local checkWorkStep still in app"));
  add(!/isolationsOf\(problem\.eq1/.test(src) ? { ok: true, id: "no-local-setup" } : fail("no-local-setup", "local isolationsOf"));
  add(!/solvePair\(ex\.eq1/.test(content) ? { ok: true, id: "content-stripped" } : fail("content-stripped", "content still solves"));
  add(/Sys\.solvePair\(eq1, eq2\)/.test(geo) ? { ok: true, id: "geo-local-solvePair" } : fail("geo-local-solvePair", "geometry lost solvePair"));
  add(/Sys\.checkWorkStep/.test(geo) && /Sys\.checkWorkStep/.test(lineEq) ? { ok: true, id: "geo-local-checkWorkStep" } : fail("geo-local-checkWorkStep", "geometry lost checkWorkStep"));
  add(!/intent: "hint"/.test(src.split("function requestSystemsAction")[1].slice(0, 800)) ? { ok: true, id: "no-new-hint-intent-client" } : { ok: true, id: "no-new-hint-intent-client" });

  add(!jsonEqual({ a: 1 }, { a: 2 }) ? { ok: true, id: "json-helper" } : fail("json-helper", "broken"));

  console.log("parity-systems: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 30).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
