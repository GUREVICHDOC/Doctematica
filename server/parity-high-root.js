"use strict";

var http = require("http");
var path = require("path");
var spawn = require("child_process").spawn;
var loadEngine = require("./load-engine").loadEngine;
var checkHighRoot = require("./high-root").checkHighRoot;
var snapshotRoot = require("./high-root").snapshotRoot;
var handleHighRoot = require("./high-root").handleHighRoot;

var PORT = Number(process.env.DOCTEMATICA_PARITY_PORT || 8796);
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

function postRoot(payload) {
  return postJson(Object.assign({ topic: "high-power", subtopic: "root" }, payload));
}

function checkCases() {
  return [
    { id: "cube-iso-skip", start: "x^3=27", history: ["x^3=27"], typed: "x^3=27" },
    { id: "cube-both", start: "x^3=27", history: ["x^3=27"], typed: "∛(x^3)=∛(27)" },
    { id: "cube-final", start: "x^3=27", history: ["x^3=27"], typed: "x=3" },
    { id: "cube-wrong", start: "x^3=27", history: ["x^3=27"], typed: "x=4" },
    { id: "cube-pm-illegal", start: "x^3=27", history: ["x^3=27"], typed: "x=±3" },
    { id: "even-pm", start: "x^4=81", history: ["x^4=81"], typed: "x=±3" },
    { id: "even-one", start: "x^4=81", history: ["x^4=81"], typed: "x=3" },
    { id: "even-second", start: "x^4=81", history: ["x^4=81", "x=3"], typed: "x=-3" },
    { id: "even-none-iso", start: "x^4+16=0", history: ["x^4+16=0"], typed: "x^4=-16" },
    { id: "even-none-ans", start: "x^4+16=0", history: ["x^4+16=0", "x^4=-16"], typed: "אין פתרון ממשי" },
    { id: "even-none-wrong-pm", start: "x^4+16=0", history: ["x^4+16=0", "x^4=-16"], typed: "x=±2" },
    { id: "odd-neg-iso", start: "x^3+125=0", history: ["x^3+125=0"], typed: "x^3=-125" },
    { id: "odd-neg-ans", start: "x^3+125=0", history: ["x^3+125=0", "x^3=-125"], typed: "x=-5" },
    { id: "zero", start: "x^5=0", history: ["x^5=0"], typed: "x=0" },
    { id: "arrange", start: "x^3-64=0", history: ["x^3-64=0"], typed: "x^3=64" },
    { id: "skip-legal", start: "x^3-64=0", history: ["x^3-64=0"], typed: "x=4" },
    { id: "skip-illegal-num", start: "x^3-64=0", history: ["x^3-64=0"], typed: "x=5" },
    { id: "missing-eq", start: "x^3=27", history: ["x^3=27"], typed: "x+3" },
  ];
}

function tutorEqs() {
  return [
    { id: "cube", start: "x^3=27" },
    { id: "even", start: "x^4=81" },
    { id: "none", start: "x^4+16=0", cur: "x^4=-16" },
    { id: "odd-neg", start: "x^3+125=0" },
    { id: "zero", start: "x^5=0" },
    { id: "arrange", start: "x^3-64=0" },
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
    };
    var local = snapshotRoot(checkHighRoot(engine, payload));
    var remote = snapshotRoot(await postRoot(payload));
    if (!jsonEqual(local, remote)) {
      mismatches.push({ id: c.id, typed: c.typed, local: local, server: remote });
    }
  }
  return { count: list.length, mismatches: mismatches };
}

async function runTutor(engine) {
  var mismatches = [];
  var rows = tutorEqs();
  var i;
  for (i = 0; i < rows.length; i++) {
    var row = rows[i];
    var cur = row.cur || row.start;
    var hist = [row.start];
    if (row.cur && row.cur !== row.start) hist.push(row.cur);

    var hintLocal = handleHighRoot(engine, { intent: "hint", start: row.start, history: hist });
    var hintRemote = await postRoot({ intent: "hint", start: row.start, history: hist });
    if (String(hintLocal.hint) !== String(hintRemote.hint)) {
      mismatches.push({ id: row.id + "-hint", local: hintLocal.hint, server: hintRemote.hint });
    }

    var oneLocal = handleHighRoot(engine, { intent: "one-step", start: row.start, history: hist });
    var oneRemote = await postRoot({ intent: "one-step", start: row.start, history: hist });
    if (String(oneLocal.step || "") !== String(oneRemote.step || "")) {
      mismatches.push({ id: row.id + "-one-step", local: oneLocal.step, server: oneRemote.step });
    }

    var pack = engine.DoctematicaQuadratic.analyzeHighRootStart(row.start);
    var nxt = engine.DoctematicaQuadratic.nextHighRootStep(cur, pack);
    if (nxt && nxt.eq && String(oneRemote.step) !== String(nxt.eq)) {
      mismatches.push({ id: row.id + "-one-vs-engine", local: nxt.eq, server: oneRemote.step });
    }

    var solLocal = handleHighRoot(engine, { intent: "solution", start: row.start, history: [row.start] });
    var solRemote = await postRoot({ intent: "solution", start: row.start, history: [row.start] });
    if (String(solLocal.answer) !== String(solRemote.answer) || (solLocal.steps || []).length !== (solRemote.steps || []).length) {
      mismatches.push({ id: row.id + "-solution", local: solLocal.answer, server: solRemote.answer });
    }
  }
  return { count: rows.length * 4, mismatches: mismatches };
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
    console.log("high-power/root parity vs POST /api/high-power");
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
