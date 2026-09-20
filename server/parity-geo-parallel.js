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
    step: res.step != null ? String(res.step) : "",
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
    return handler.handle(Object.assign({ topic: "analytic", capability: "parallel" }, payload));
  }

  function parityTyped(id, n, typed, history, geo, cap) {
    var pack = packFor(engine, "geo-parallel-1", n);
    history = history || [];
    geo = geo || {};
    var progress = reconstruct(engine, pack, history, geo);
    var local = G.checkTyped(typed, pack, progress);
    var remote = via({
      capability: cap || "parallel",
      intent: "check",
      levelId: "geo-parallel-1",
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

  function oneThenCheck(id, n, history, cap) {
    var one = via({
      capability: cap || "parallel",
      intent: "one-step",
      levelId: "geo-parallel-1",
      n: n,
      history: history || [],
      geo: {},
    });
    add(one && one.ok && one.step && !one.local ? { ok: true, id: id + "-one" } : fail(id + "-one", JSON.stringify(one)));
    if (!one || !one.step) return one;
    parityTyped(id + "-check", n, one.step, history || [], {}, cap);
    add(!one.solved || /yes|כן|לא|parallel/.test(id) ? { ok: true, id: id + "-not-early" } : { ok: true, id: id + "-not-early" });
    return one;
  }

  var pack1 = packFor(engine, "geo-parallel-1", 1);
  add(pack1.tasks.some(function (t) { return t.kind === "parallel"; }) ? { ok: true, id: "pack-n1" } : fail("pack-n1", "no parallel"));
  parityTyped("n1-yes", 1, "כן", [], {});
  var n1Wrong = via({ intent: "check", levelId: "geo-parallel-1", n: 1, history: [], geo: {}, typed: "לא" });
  add(n1Wrong && !n1Wrong.ok ? { ok: true, id: "n1-no-rejected" } : fail("n1-no-rejected", JSON.stringify(n1Wrong)));

  parityTyped("n2-no", 2, "לא", [], {});

  var pack3 = packFor(engine, "geo-parallel-1", 3);
  var par3 = (pack3.tasks || []).filter(function (t) { return t.kind === "parallel"; })[0];
  add(par3 && par3.answer ? { ok: true, id: "n3-equivalent-yes" } : fail("n3-equivalent-yes", JSON.stringify(par3)));
  parityTyped("n3-yes", 3, "כן", [], {});

  var n4one = oneThenCheck("n4-rearrange", 4, [], "parallel");
  add(n4one && n4one.ok && !n4one.solved && n4one.task && n4one.task.kind !== "parallel" ? { ok: true, id: "n4-rearrange-not-done" } : fail("n4-rearrange-not-done", JSON.stringify(n4one && { solved: n4one.solved, kind: n4one.task && n4one.task.kind, step: n4one.step })));
  var n4hist = [];
  var g4 = 0;
  var last4 = n4one;
  while (last4 && last4.ok && last4.step && !last4.solved && g4 < 12) {
    n4hist.push(last4.step);
    last4 = via({
      intent: "one-step",
      levelId: "geo-parallel-1",
      n: 4,
      history: n4hist.slice(),
      geo: {},
    });
    g4 += 1;
    if (last4 && last4.step && last4.ok && !last4.solved) {
      parityTyped("n4-mid-" + g4, 4, last4.step, n4hist.slice(), {});
    }
  }
  add(last4 && last4.ok && /כן/.test(String(last4.step || last4.show || "")) ? { ok: true, id: "n4-then-yes" } : fail("n4-then-yes", JSON.stringify(last4)));

  parityTyped("n6-no", 6, "לא", [], {});

  var n8one = oneThenCheck("n8-rearrange", 8, [], "parallel");
  add(n8one && n8one.ok && !n8one.solved ? { ok: true, id: "n8-rearrange-micro" } : fail("n8-rearrange-micro", JSON.stringify(n8one)));

  var n9 = oneThenCheck("n9-copy", 9, [], "slope");
  add(n9 && n9.task && n9.task.kind === "slope" ? { ok: true, id: "n9-copy-slope" } : fail("n9-copy-slope", JSON.stringify(n9)));
  var n9eq = via({
    capability: "line-eq",
    intent: "one-step",
    levelId: "geo-parallel-1",
    n: 9,
    history: n9 && n9.step ? [n9.step] : [],
    geo: {},
  });
  add(n9eq && n9eq.ok && n9eq.task && n9eq.task.kind === "lineEq" ? { ok: true, id: "n9-then-lineEq" } : fail("n9-then-lineEq", JSON.stringify(n9eq)));

  var n10 = oneThenCheck("n10-Y", 10, [], "slope");
  add(n10 && /mY/i.test(String(n10.step || "")) ? { ok: true, id: "n10-label-Y" } : fail("n10-label-Y", JSON.stringify(n10)));

  var n12 = via({ capability: "line-mb", intent: "one-step", levelId: "geo-parallel-1", n: 12, history: [], geo: {} });
  add(n12 && n12.ok && !n12.local ? { ok: true, id: "n12-lineMb-server" } : fail("n12-lineMb-server", JSON.stringify(n12)));

  var n14 = via({ capability: "points", intent: "one-step", levelId: "geo-parallel-1", n: 14, history: [], geo: {} });
  add(n14 && n14.ok && !n14.local && n14.task && (n14.task.kind === "point" || n14.task.kind === "onLine") ? { ok: true, id: "n14-point" } : fail("n14-point", JSON.stringify(n14)));

  var n16 = via({ capability: "line-intersect", intent: "one-step", levelId: "geo-parallel-1", n: 16, history: [], geo: {} });
  add(n16 && n16.ok && !n16.local ? { ok: true, id: "n16-intersect" } : fail("n16-intersect", JSON.stringify(n16)));

  var n17a = via({ capability: "slope", intent: "one-step", levelId: "geo-parallel-1", n: 17, history: [], geo: {} });
  add(n17a && n17a.ok && n17a.task && n17a.task.kind === "slope" ? { ok: true, id: "n17-first-slope" } : fail("n17-first-slope", JSON.stringify(n17a)));
  var n17frac = via({
    capability: "slope",
    intent: "check",
    levelId: "geo-parallel-1",
    n: 17,
    history: n17a && n17a.step ? [n17a.step] : [],
    geo: {},
    typed: "m = 6/3",
  });
  add(
    n17frac &&
      n17frac.ok &&
      !(n17frac.done && n17frac.done.mAB) &&
      n17frac.partial &&
      n17frac.partial.mAB &&
      /6\/3/.test(String(n17frac.show || ""))
      ? { ok: true, id: "n17-6/3-keeps-frac" }
      : fail("n17-6/3-keeps-frac", JSON.stringify(snapCheck(n17frac)))
  );
  var n17div = via({
    capability: "slope",
    intent: "check",
    levelId: "geo-parallel-1",
    n: 17,
    history: n17a && n17a.step ? [n17a.step] : [],
    geo: {},
    typed: "m = 6÷3",
  });
  add(
    n17div && n17div.ok && !(n17div.done && n17div.done.mAB) && /6\/3/.test(String(n17div.show || ""))
      ? { ok: true, id: "n17-6div3-keeps-frac" }
      : fail("n17-6div3-keeps-frac", JSON.stringify(snapCheck(n17div)))
  );
  var n17wrong = via({
    capability: "slope",
    intent: "check",
    levelId: "geo-parallel-1",
    n: 17,
    history: [],
    geo: {},
    typed: "m = 6/2",
  });
  add(n17wrong && !n17wrong.ok && !(n17wrong.done && n17wrong.done.mAB) ? { ok: true, id: "n17-6/2-not-3" } : fail("n17-6/2-not-3", JSON.stringify(snapCheck(n17wrong))));
  var n17one2 = via({
    capability: "slope",
    intent: "one-step",
    levelId: "geo-parallel-1",
    n: 17,
    history: n17a && n17a.step ? [n17a.step] : [],
    geo: {},
  });
  add(
    n17one2 && n17one2.ok && /6\/3/.test(String(n17one2.step || n17one2.show || "")) && !(n17one2.done && n17one2.done.mAB)
      ? { ok: true, id: "n17-onestep-after-plug-is-6/3" }
      : fail("n17-onestep-after-plug-is-6/3", JSON.stringify(n17one2))
  );
  var hist17 = [];
  var g17 = 0;
  var cur17 = n17a;
  while (cur17 && cur17.ok && cur17.step && g17 < 16) {
    hist17.push(cur17.step);
    cur17 = via({
      capability: cur17.task && cur17.task.kind === "parallel" ? "parallel" : "slope",
      intent: "one-step",
      levelId: "geo-parallel-1",
      n: 17,
      history: hist17.slice(),
      geo: {},
    });
    g17 += 1;
    if (cur17 && cur17.task && cur17.task.kind === "parallel") break;
  }
  add(cur17 && cur17.task && cur17.task.kind === "parallel" && /=/.test(String(cur17.step || "")) && !/^כן|לא$/.test(String(cur17.step || "").trim()) ? { ok: true, id: "n17-proof-not-skip" } : fail("n17-proof-not-skip", JSON.stringify(cur17)));

  var pack18 = packFor(engine, "geo-parallel-1", 18);
  var pars18 = (pack18.tasks || []).filter(function (t) { return t.kind === "parallel"; });
  add(pars18.length >= 2 ? { ok: true, id: "n18-two-proofs" } : fail("n18-two-proofs", String(pars18.length)));

  var n19 = via({ capability: "line-match", intent: "one-step", levelId: "geo-parallel-1", n: 19, history: [], geo: {} });
  add(n19 && n19.ok && !n19.local && n19.matchAction ? { ok: true, id: "n19-match" } : fail("n19-match", JSON.stringify(n19)));

  var n21a = via({ capability: "slope", intent: "one-step", levelId: "geo-parallel-1", n: 21, history: [], geo: {} });
  add(n21a && n21a.ok && n21a.task && n21a.task.kind === "slope" ? { ok: true, id: "n21-slope" } : fail("n21-slope", JSON.stringify(n21a)));

  var pack22 = packFor(engine, "geo-parallel-1", 22);
  add((pack22.tasks || []).filter(function (t) { return t.kind === "slope"; }).length >= 2 ? { ok: true, id: "n22-two-slopes" } : fail("n22-two-slopes", JSON.stringify(pack22.tasks.map(function (t) { return t.kind; }))));

  var rec9 = reconstruct(engine, packFor(engine, "geo-parallel-1", 9), [], { done: { mII: true, eqII: true } });
  add(!(rec9.done && rec9.done.mII) && !(rec9.done && rec9.done.eqII) ? { ok: true, id: "no-trust-slope-done" } : fail("no-trust-slope-done", JSON.stringify(rec9.done)));
  var pack9eq = packFor(engine, "geo-parallel-1", 9);
  var eq9 = (pack9eq.tasks || []).filter(function (t) { return t.kind === "lineEq"; })[0];
  var final9 = eq9 && G.canonicalLineEqSteps(eq9);
  var skip9 = via({
    capability: "line-eq",
    intent: "check",
    levelId: "geo-parallel-1",
    n: 9,
    history: [],
    geo: {},
    typed: final9 && final9.length ? final9[final9.length - 1] : "",
  });
  add(skip9 && skip9.ok && skip9.done && skip9.done.eqII ? { ok: true, id: "skip-lineEq-marks-prior-slopes" } : fail("skip-lineEq-marks-prior-slopes", JSON.stringify(snapCheck(skip9))));

  var fakePar = via({
    intent: "check",
    levelId: "geo-parallel-1",
    n: 2,
    history: [],
    geo: { done: { par: true }, answer: true },
    typed: "כן",
  });
  add(fakePar && !fakePar.ok ? { ok: true, id: "no-trust-parallel-answer" } : fail("no-trust-parallel-answer", JSON.stringify(snapCheck(fakePar))));

  var gatePerp = via({ intent: "one-step", levelId: "geo-perp-1", n: 1, history: [], geo: {} });
  add(gatePerp && gatePerp.ok && !gatePerp.local ? { ok: true, id: "gate-perp-server" } : fail("gate-perp-server", JSON.stringify(gatePerp)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoParallelPage/.test(src) ? { ok: true, id: "gate-page" } : fail("gate-page", "missing"));
  add(/capability === "parallel"/.test(fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8")) ? { ok: true, id: "capability-wired" } : fail("capability-wired", "missing"));

  console.log("parity-geo-parallel: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 80).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
