"use strict";

var http = require("http");
var path = require("path");
var spawn = require("child_process").spawn;
var loadEngine = require("./load-engine").loadEngine;
var handleFormula = require("./quad-formula").handleFormula;

var PORT = Number(process.env.DOCTEMATICA_PARITY_PORT || 8795);
var HOST = "127.0.0.1";

function jsonEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function postJson(payload) {
  var body = JSON.stringify(payload);
  return new Promise(function (resolve, reject) {
    var req = http.request(
      {
        hostname: HOST,
        port: PORT,
        path: "/api/quadratic",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      function (res) {
        var chunks = [];
        res.on("data", function (c) {
          chunks.push(c);
        });
        res.on("end", function () {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function postFormula(payload) {
  return postJson(
    Object.assign(
      {
        topic: "quadratic",
        subtopic: "formula",
      },
      payload
    )
  );
}

function clean(res) {
  res = res || {};
  var out = {
    ok: !!res.ok,
    more: !!res.more,
    skip: !!res.skip,
    solved: !!res.solved,
    message: String(res.message || ""),
    nextPhase: res.nextPhase || null,
    nextLetter: res.nextLetter || null,
    nextRoot: res.nextRoot == null ? null : res.nextRoot,
    kind: res.kind || null,
    answer: res.answer != null ? String(res.answer) : null,
    hint: res.hint != null ? String(res.hint) : null,
  };
  if (res.view) out.view = res.view;
  if (res.fill) out.fill = res.fill;
  if (res.steps) {
    out.steps = res.steps.map(function (s) {
      return s.eq || s;
    });
  }
  return out;
}

async function compare(engine, id, payload) {
  var local = clean(handleFormula(engine, payload));
  var remote = clean(await postFormula(payload));
  if (!jsonEqual(local, remote)) return { id: id, local: local, server: remote };
  return null;
}

function waitHealth(timeoutMs) {
  var started = Date.now();
  return new Promise(function (resolve, reject) {
    function tick() {
      var req = http.get("http://" + HOST + ":" + PORT + "/api/health", function (res) {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      req.on("error", retry);
      req.setTimeout(400, function () {
        req.destroy();
        retry();
      });
    }
    function retry() {
      if (Date.now() - started > timeoutMs) {
        reject(new Error("API did not become ready on port " + PORT));
        return;
      }
      setTimeout(tick, 80);
    }
    tick();
  });
}

function startApi() {
  var child = spawn(process.execPath, [path.join(__dirname, "api.js")], {
    env: Object.assign({}, process.env, { DOCTEMATICA_API_PORT: String(PORT) }),
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr.on("data", function (buf) {
    process.stderr.write(buf);
  });
  return child;
}

function formulaExercises(engine) {
  var levels = engine.DoctematicaCurriculum.levels || [];
  var level = levels.filter(function (item) {
    return item.id === "quad-formula";
  })[0];
  return (level && level.exercises) || [];
}

async function run(engine) {
  var mismatches = [];
  var count = 0;
  var Q = engine.DoctematicaQuadratic;
  var exs = formulaExercises(engine);

  async function add(id, payload) {
    count += 1;
    var m = await compare(engine, id, payload);
    if (m) mismatches.push(m);
  }

  var i;
  for (i = 0; i < exs.length; i++) {
    var start = exs[i].start;
    var n = exs[i].n;
    var want = Q.analyzeStart(start);
    await add("n" + n + "-a-ok", { intent: "check", start: start, phase: "abc", letter: "a", typed: String(want.a) });
    await add("n" + n + "-a-bad", { intent: "check", start: start, phase: "abc", letter: "a", typed: String(want.a + 1) });
    await add("n" + n + "-b-ok", { intent: "check", start: start, phase: "abc", letter: "b", typed: String(want.b) });
    await add("n" + n + "-c-ok", { intent: "check", start: start, phase: "abc", letter: "c", typed: String(want.c) });
    await add("n" + n + "-plug-ok", {
      intent: "check",
      start: start,
      phase: "plug",
      slots: {
        a1: String(want.a),
        a2: String(want.a),
        b1: String(want.b),
        b2: want.b < 0 ? "(" + want.b + ")" : String(want.b),
        c: String(want.c),
      },
    });
    await add("n" + n + "-plug-bad-a", {
      intent: "check",
      start: start,
      phase: "plug",
      slots: { a1: "9", a2: "9", b1: String(want.b), b2: String(want.b), c: String(want.c) },
    });
    if (want.b < 0) {
      await add("n" + n + "-plug-no-parens", {
        intent: "check",
        start: start,
        phase: "plug",
        slots: {
          a1: String(want.a),
          a2: String(want.a),
          b1: String(want.b),
          b2: String(want.b),
          c: String(want.c),
        },
      });
    }
    await add("n" + n + "-disc-ok", {
      intent: "check",
      start: start,
      phase: "compute",
      slots: { negB: String(-want.b), disc: String(want.D), den: String(2 * want.a) },
    });
    await add("n" + n + "-disc-bad", {
      intent: "check",
      start: start,
      phase: "compute",
      slots: { negB: String(-want.b), disc: String(want.D + 3), den: String(2 * want.a) },
    });
    if (want.kind !== "none") {
      await add("n" + n + "-sqrt-ok", { intent: "check", start: start, phase: "sqrt", slots: { s: String(want.s) } });
      await add("n" + n + "-sqrt-bad", { intent: "check", start: start, phase: "sqrt", slots: { s: "0" } });
    } else {
      await add("n" + n + "-sqrt-blocked", { intent: "check", start: start, phase: "sqrt", slots: { s: "1" } });
    }
    await add("n" + n + "-count-ok", { intent: "check", start: start, phase: "count", picked: want.kind });
    await add("n" + n + "-count-bad", {
      intent: "check",
      start: start,
      phase: "count",
      picked: want.kind === "two" ? "none" : "two",
    });
    if (want.kind === "none") {
      await add("n" + n + "-none-ok", { intent: "check", start: start, phase: "nosol", typed: "אין פתרון ממשי" });
      await add("n" + n + "-none-bad", { intent: "check", start: start, phase: "nosol", typed: "x=0" });
    } else {
      await add("n" + n + "-root-num", {
        intent: "check",
        start: start,
        phase: "rootwork",
        root: { at: 1 },
        slots: { rnum: String(Q.numWant(want, 1)), rden: String(Q.denWant(want)) },
      });
      await add("n" + n + "-root-val", {
        intent: "check",
        start: start,
        phase: "rootwork",
        root: { at: 1, numDone: true, denDone: true },
        slots: { rval: Q.fmt(Q.rootWant(want, 1)) },
      });
      await add("n" + n + "-root-bad", {
        intent: "check",
        start: start,
        phase: "rootwork",
        root: { at: 1, numDone: true, denDone: true },
        slots: { rval: "99" },
      });
      if (want.kind === "two") {
        await add("n" + n + "-root2-val", {
          intent: "check",
          start: start,
          phase: "rootwork",
          root: { at: -1, numDone: true, denDone: true },
          slots: { rval: Q.fmt(Q.rootWant(want, -1)) },
        });
      }
    }
    await add("n" + n + "-hint-abc", { intent: "hint", start: start, phase: "abc" });
    await add("n" + n + "-hint-compute", { intent: "hint", start: start, phase: "compute" });
    await add("n" + n + "-one-abc", { intent: "one-step", start: start, phase: "abc" });
    await add("n" + n + "-one-plug", { intent: "one-step", start: start, phase: "plug" });
    await add("n" + n + "-solution", { intent: "solution", start: start });
    await add("n" + n + "-nosol-cheat", { intent: "check", start: start, phase: "nosol", typed: "אין פתרון ממשי" });
  }

  var two = null;
  var one = null;
  var none = null;
  for (i = 0; i < exs.length; i++) {
    var wkind = Q.analyzeStart(exs[i].start);
    if (!two && wkind.kind === "two") two = { start: exs[i].start, want: wkind };
    if (!one && wkind.kind === "one") one = { start: exs[i].start, want: wkind };
    if (!none && wkind.kind === "none") none = { start: exs[i].start, want: wkind };
  }
  if (two) {
    await add("advance-x1-to-x2", {
      intent: "check",
      start: two.start,
      phase: "rootwork",
      root: { at: 1, numDone: true, denDone: true },
      slots: { rval: Q.fmt(Q.rootWant(two.want, 1)) },
    });
    var x1 = handleFormula(engine, {
      intent: "check",
      start: two.start,
      phase: "rootwork",
      root: { at: 1, numDone: true, denDone: true },
      slots: { rval: Q.fmt(Q.rootWant(two.want, 1)) },
    });
    count += 1;
    if (!(x1.ok && x1.nextRoot === -1 && x1.nextLetter === "x2" && x1.nextPhase === "rootwork" && !x1.solved)) {
      mismatches.push({
        id: "advance-x1-to-x2-contract",
        local: { ok: x1.ok, nextRoot: x1.nextRoot, nextLetter: x1.nextLetter, nextPhase: x1.nextPhase, solved: !!x1.solved },
        server: "expected nextRoot=-1, nextLetter=x2, still rootwork, not solved",
      });
    }
    await add("advance-x1-one-step", {
      intent: "one-step",
      start: two.start,
      phase: "rootwork",
      root: { at: 1, numDone: true, denDone: true },
    });
    var stepX1 = handleFormula(engine, {
      intent: "one-step",
      start: two.start,
      phase: "rootwork",
      root: { at: 1, numDone: true, denDone: true },
    });
    count += 1;
    if (!(stepX1.ok && stepX1.nextRoot === -1 && !stepX1.solved)) {
      mismatches.push({
        id: "advance-x1-one-step-contract",
        local: { ok: stepX1.ok, nextRoot: stepX1.nextRoot, solved: !!stepX1.solved },
        server: "one-step on x1 must request x2, not finish",
      });
    }
    await add("x2-completes", {
      intent: "check",
      start: two.start,
      phase: "rootwork",
      root: { at: -1, numDone: true, denDone: true },
      slots: { rval: Q.fmt(Q.rootWant(two.want, -1)) },
    });
  }
  if (one) {
    var only = handleFormula(engine, {
      intent: "check",
      start: one.start,
      phase: "rootwork",
      root: { at: 1, numDone: true, denDone: true },
      slots: { rval: Q.fmt(Q.rootWant(one.want, 1)) },
    });
    count += 1;
    if (!(only.ok && only.solved && only.nextRoot == null)) {
      mismatches.push({
        id: "one-root-no-x2",
        local: { ok: only.ok, solved: !!only.solved, nextRoot: only.nextRoot },
        server: "single root should solve without nextRoot",
      });
    }
    await add("one-root-final", {
      intent: "check",
      start: one.start,
      phase: "rootwork",
      root: { at: 1, numDone: true, denDone: true },
      slots: { rval: Q.fmt(Q.rootWant(one.want, 1)) },
    });
  }
  if (none) {
    var nos = handleFormula(engine, {
      intent: "check",
      start: none.start,
      phase: "nosol",
      typed: "אין פתרון ממשי",
    });
    count += 1;
    if (!(nos.ok && nos.solved && nos.nextPhase === "done" && nos.nextRoot == null)) {
      mismatches.push({
        id: "none-done",
        local: { ok: nos.ok, solved: !!nos.solved, nextPhase: nos.nextPhase },
        server: "nosol should complete without x2",
      });
    }
  }

  function md53Bad(res, id) {
    var msg = String((res && res.message) || "");
    var ans = res && res.answer != null ? String(res.answer) : "";
    var viewAns = res && res.view && res.view.answer != null ? String(res.view.answer) : "";
    if (!res || !res.ok || !res.solved || !ans || msg.indexOf("undefined") >= 0 || !viewAns) {
      mismatches.push({
        id: id,
        local: {
          ok: !!(res && res.ok),
          solved: !!(res && res.solved),
          message: msg,
          answer: ans,
          viewAnswer: viewAns,
        },
        server: "md53 must return answer, not undefined",
      });
    }
  }

  var md53Rows = [two, one, none].filter(Boolean);
  var mi;
  for (mi = 0; mi < md53Rows.length; mi++) {
    var row = md53Rows[mi];
    var w = row.want;
    var manual = handleFormula(engine, {
      intent: "check",
      start: row.start,
      phase: "abc",
      letter: "c",
      typed: String(w.c),
      md53: true,
    });
    count += 1;
    md53Bad(manual, "md53-manual-" + w.kind);
    await add("md53-manual-http-" + w.kind, {
      intent: "check",
      start: row.start,
      phase: "abc",
      letter: "c",
      typed: String(w.c),
      md53: true,
    });
    var step = handleFormula(engine, {
      intent: "one-step",
      start: row.start,
      phase: "abc",
      md53: true,
    });
    count += 1;
    md53Bad(step, "md53-one-step-" + w.kind);
    await add("md53-one-step-http-" + w.kind, {
      intent: "one-step",
      start: row.start,
      phase: "abc",
      md53: true,
    });
    var sol = handleFormula(engine, { intent: "solution", start: row.start, md53: true });
    count += 1;
    if (!sol.answer || String(sol.answer).indexOf("undefined") >= 0) {
      mismatches.push({ id: "md53-solution-" + w.kind, local: sol, server: "solution must have answer" });
    }
    await add("md53-solution-http-" + w.kind, { intent: "solution", start: row.start, md53: true });
  }

  var mixedStart = "6+7x=-x^2";
  var mixedStd = "x^2+7x+6=0";
  var mixedRemote = await postJson({
    topic: "quadratic",
    subtopic: "mixed",
    intent: "check",
    start: mixedStart,
    history: [mixedStart, mixedStd],
    phase: "abc",
    letter: "c",
    typed: "6",
    md53: true,
  });
  count += 1;
  md53Bad(mixedRemote, "md53-mixed-6plus7x");

  return { count: count, mismatches: mismatches };
}

function printStage(name, result) {
  console.log(name + ": " + result.count + " checks, mismatches " + result.mismatches.length);
  result.mismatches.slice(0, 6).forEach(function (m) {
    console.log("");
    console.log("MISMATCH " + m.id);
    console.log(JSON.stringify({ local: m.local, server: m.server }, null, 2));
  });
}

async function main() {
  var engine = loadEngine();
  var child = startApi();
  var finished = false;
  child.on("exit", function (code) {
    if (!finished && code) {
      console.error("API exited with code " + code);
      process.exit(1);
    }
  });
  try {
    await waitHealth(8000);
    console.log("quadratic/formula parity vs POST /api/quadratic");
    var result = await run(engine);
    printStage("formula", result);
    if (result.mismatches.length) {
      process.exitCode = 1;
      return;
    }
    console.log("no parity mismatches");
    console.log("total: " + result.count);
  } finally {
    finished = true;
    child.kill("SIGTERM");
  }
}

main().catch(function (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
