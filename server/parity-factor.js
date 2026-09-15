"use strict";

var http = require("http");
var path = require("path");
var spawn = require("child_process").spawn;
var loadEngine = require("./load-engine").loadEngine;
var handleFactor = require("./quad-factor").handleFactor;
var snapshotFactor = require("./quad-factor").snapshotFactor;

var PORT = Number(process.env.DOCTEMATICA_PARITY_PORT || 8794);
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

function postFactor(payload) {
  return postJson(
    Object.assign(
      {
        topic: "quadratic",
        subtopic: "factor",
      },
      payload
    )
  );
}

function snap(res) {
  if (res && res.error) return { error: res.error, message: res.message };
  if (res && res.hint != null && res.ok && res.step !== undefined && !res.factored && res.eqs == null && res.intent !== "check") {
    return {
      ok: !!res.ok,
      hint: String(res.hint || ""),
      step: res.step ? String(res.step) : null,
      split: !!res.split,
      done: !!res.done,
    };
  }
  return snapshotFactor(res, { canSplit: res && res.canSplit, step: res && res.step, hint: res && res.hint, done: res && res.done });
}

async function compare(engine, id, payload) {
  var local = handleFactor(engine, payload);
  var remote = await postFactor(payload);
  var a = payload.intent === "solution" ? local : payload.intent === "hint" ? local : snap(local);
  var b = payload.intent === "solution" ? remote : payload.intent === "hint" ? remote : snap(remote);
  if (payload.intent === "hint") {
    a = { ok: true, hint: String(local.hint || ""), step: local.step || null, split: !!local.split, done: !!local.done };
    b = { ok: true, hint: String(remote.hint || ""), step: remote.step || null, split: !!remote.split, done: !!remote.done };
  }
  if (payload.intent === "solution") {
    a = {
      ok: true,
      steps: (local.steps || []).map(function (s) {
        return s.eq;
      }),
      answer: local.answer,
    };
    b = {
      ok: true,
      steps: (remote.steps || []).map(function (s) {
        return s.eq;
      }),
      answer: remote.answer,
    };
  }
  if (!jsonEqual(a, b)) return { id: id, payload: payload, local: a, server: b };
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

function factorExercises(engine) {
  var levels = engine.DoctematicaCurriculum.levels || [];
  var level = levels.filter(function (item) {
    return item.id === "quad-factor";
  })[0];
  return (level && level.exercises) || [];
}

async function run(engine) {
  var mismatches = [];
  var count = 0;
  var Q = engine.DoctematicaQuadratic;
  var exs = factorExercises(engine);
  var i;

  async function add(id, payload) {
    count += 1;
    var m = await compare(engine, id, payload);
    if (m) mismatches.push(m);
  }

  for (i = 0; i < exs.length; i++) {
    var start = exs[i].start;
    var n = exs[i].n;
    var pack = Q.analyzeFactorStart(start);
    var prod = Q.parseProductEq(pack.factored);
    var r1 = "x = " + Q.fmtDisp(pack.otherF);

    await add("n" + n + "-factor", {
      intent: "check",
      start: start,
      history: [start],
      typed: pack.factored,
    });
    await add("n" + n + "-wrong-prod", {
      intent: "check",
      start: start,
      history: [start],
      typed: "x(x-1)=0",
    });
    await add("n" + n + "-illegal-skip", {
      intent: "check",
      start: start,
      history: [start],
      typed: "x=3",
    });
    await add("n" + n + "-split", {
      intent: "split",
      start: start,
      history: [start, pack.factored],
    });
    await add("n" + n + "-split-early", {
      intent: "split",
      start: start,
      history: [start],
    });
    if (prod) {
      await add("n" + n + "-branch0", {
        intent: "check",
        start: start,
        history: [start, pack.factored],
        factor: { split: true, trails: [[prod.e1], [prod.e2]] },
        typed: "x = 0",
      });
      await add("n" + n + "-branch1", {
        intent: "check",
        start: start,
        history: [start, pack.factored],
        factor: { split: true, trails: [["x = 0"], [prod.e2]] },
        typed: r1,
      });
      await add("n" + n + "-branch1-first", {
        intent: "check",
        start: start,
        history: [start, pack.factored],
        factor: { split: true, trails: [[prod.e1], [prod.e2]] },
        typed: r1,
      });
    }
    await add("n" + n + "-roots-skip", {
      intent: "check",
      start: start,
      history: [start, pack.factored],
      typed: "x = 0, " + r1,
    });
    await add("n" + n + "-hint", { intent: "hint", start: start, history: [start] });
    await add("n" + n + "-hint-after", {
      intent: "hint",
      start: start,
      history: [start, pack.factored],
    });
    await add("n" + n + "-one-step", { intent: "one-step", start: start, history: [start] });
    await add("n" + n + "-one-step-split", {
      intent: "one-step",
      start: start,
      history: [start, pack.factored],
    });
    await add("n" + n + "-solution", { intent: "solution", start: start, history: [start] });
  }

  await add("fake-done", {
    intent: "check",
    start: "x^2-5x=0",
    history: ["x^2-5x=0"],
    factor: { split: true, solved: [true, true] },
    typed: "x=0",
  });
  await add("missing-eq", {
    intent: "check",
    start: "x^2-5x=0",
    history: ["x^2-5x=0"],
    typed: "x(x-5)",
  });

  return { count: count, mismatches: mismatches };
}

function printStage(name, result) {
  console.log(name + ": " + result.count + " checks, mismatches " + result.mismatches.length);
  result.mismatches.slice(0, 8).forEach(function (m) {
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
    console.log("quadratic/factor parity vs POST /api/quadratic");
    var result = await run(engine);
    printStage("factor", result);
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
