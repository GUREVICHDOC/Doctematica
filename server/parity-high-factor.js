"use strict";

var http = require("http");
var path = require("path");
var spawn = require("child_process").spawn;
var loadEngine = require("./load-engine").loadEngine;
var handleHighFactor = require("./high-factor").handleHighFactor;

var PORT = Number(process.env.DOCTEMATICA_PARITY_PORT || 8797);
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
        path: "/api/high-power",
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
  return postJson(Object.assign({ topic: "high-power", subtopic: "factor" }, payload));
}

function snap(res) {
  res = res || {};
  return {
    ok: !!res.ok,
    factored: !!res.factored,
    split: !!res.split,
    resplit: !!res.resplit,
    rearrange: !!res.rearrange,
    solved: !!res.solved,
    solvedAll: !!res.solvedAll,
    canSplit: !!res.canSplit,
    message: String(res.message || ""),
    step: res.step ? String(res.step) : null,
    hint: res.hint ? String(res.hint) : "",
    which: res.which == null ? null : res.which,
    eqs: res.eqs ? res.eqs.map(String) : null,
  };
}

function checkCases() {
  return [
    { id: "arrange", start: "x^3=16x", history: ["x^3=16x"], typed: "x^3-16x=0" },
    { id: "factor-x", start: "x^3-9x=0", history: ["x^3-9x=0"], typed: "x(x^2-9)=0" },
    { id: "factor-xq", start: "x^3-4x^2=0", history: ["x^3-4x^2=0"], typed: "x^2(x-4)=0" },
    { id: "partial", start: "x^3-4x^2=0", history: ["x^3-4x^2=0"], typed: "x(x^2-4x)=0" },
    { id: "wrong-prod", start: "x^3-9x=0", history: ["x^3-9x=0"], typed: "x(x-9)=0" },
    { id: "skip-zero", start: "x^3-9x=0", history: ["x^3-9x=0", "x(x^2-9)=0"], typed: "x=0", factor: { split: true, trails: [["x=0"], ["x^2-9=0"]] } },
    { id: "none-branch", start: "x^3+x=0", history: ["x^3+x=0", "x(x^2+1)=0"], typed: "אין פתרון ממשי", factor: { split: true, trails: [["x=0"], ["x^2+1=0"]] } },
  ];
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

async function runChecks(engine) {
  var mismatches = [];
  var list = checkCases();
  var i;
  for (i = 0; i < list.length; i++) {
    var c = list[i];
    var payload = {
      intent: "check",
      start: c.start,
      history: c.history,
      previous: c.history[c.history.length - 1],
      typed: c.typed,
      factor: c.factor,
    };
    var local = snap(handleHighFactor(engine, payload));
    var remote = snap(await postFactor(payload));
    if (!jsonEqual(local, remote)) {
      mismatches.push({ id: c.id, typed: c.typed, local: local, server: remote });
    }
  }
  return { count: list.length, mismatches: mismatches };
}

async function runTutor(engine) {
  var mismatches = [];
  var starts = ["x^3-9x=0", "x^3=16x", "x^3-4x^2=0", "x^3+x=0", "x^4-x^2=0"];
  var i;
  for (i = 0; i < starts.length; i++) {
    var start = starts[i];
    var hist = [start];
    var intents = ["hint", "one-step", "solution"];
    var j;
    for (j = 0; j < intents.length; j++) {
      var payload = { intent: intents[j], start: start, history: hist };
      var local = snap(handleHighFactor(engine, payload));
      var remote = snap(await postFactor(payload));
      if (!jsonEqual(local, remote)) {
        mismatches.push({ id: start + "-" + intents[j], local: local, server: remote });
      }
    }
  }
  return { count: starts.length * 3, mismatches: mismatches };
}

function printStage(name, result) {
  console.log(name + ": " + result.count + " checks, mismatches " + result.mismatches.length);
  result.mismatches.forEach(function (m) {
    console.log("");
    console.log("MISMATCH " + m.id);
    console.log(JSON.stringify(m, null, 2));
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
    console.log("high-power/factor parity vs POST /api/high-power");
    var checks = await runChecks(engine);
    printStage("check", checks);
    if (checks.mismatches.length) {
      process.exitCode = 1;
      return;
    }
    var tutor = await runTutor(engine);
    printStage("hint/one-step/solution", tutor);
    if (tutor.mismatches.length) {
      process.exitCode = 1;
      return;
    }
    console.log("no parity mismatches");
    console.log("total: " + (checks.count + tutor.count));
  } finally {
    finished = true;
    child.kill("SIGTERM");
  }
}

main().catch(function (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
