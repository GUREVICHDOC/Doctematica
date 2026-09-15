"use strict";

var http = require("http");
var path = require("path");
var spawn = require("child_process").spawn;
var loadEngine = require("./load-engine").loadEngine;
var checkSqrtTyped = require("./quadratic").checkSqrtTyped;
var snapshotSqrtCheck = require("./quadratic").snapshotSqrtCheck;

var PORT = Number(process.env.DOCTEMATICA_PARITY_PORT || 8793);
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

function postSqrt(payload) {
  return postJson(
    Object.assign(
      {
        topic: "quadratic",
        subtopic: "sqrt",
      },
      payload
    )
  );
}

function snapHint(remote) {
  return {
    ok: true,
    done: !!remote.done,
    hint: String(remote.hint || ""),
    step: remote.step ? String(remote.step) : null,
  };
}

function localHint(engine, start, cur) {
  var Q = engine.DoctematicaQuadratic;
  var Teach = engine.DoctematicaTeach;
  var pack = Q.analyzeSqrtStart(start);
  var act = Teach.nextAction(cur, { unknown: "x2" }) || {};
  var extra = (act.isolated || act.done) && Q.nextSqrtStep(cur, pack);
  return {
    ok: true,
    done: !!((extra && extra.solved) || (act.done && !extra)),
    hint: String((extra && extra.hint) || act.hint || ""),
    step: extra && extra.eq ? String(extra.eq) : act.eq ? String(act.eq) : null,
  };
}

function localSolution(engine, start) {
  var pack = engine.DoctematicaQuadratic.analyzeSqrtStart(start);
  return {
    ok: true,
    steps: (pack.steps || []).map(function (eq) {
      return { eq: String(eq || ""), explain: "" };
    }),
    answer: String(pack.answer || ""),
  };
}

function remoteSolution(remote) {
  return {
    ok: true,
    steps: (remote.steps || []).map(function (s) {
      s = s || {};
      return { eq: String(s.eq || ""), explain: String(s.explain || "") };
    }),
    answer: String(remote.answer || ""),
  };
}

function checkCases() {
  return [
    { id: "n30-iso-skip", start: "x^2=4", history: ["x^2=4"], typed: "x^2=4", note: "same" },
    { id: "n30-both", start: "x^2=4", history: ["x^2=4"], typed: "√(x^2)=√(4)" },
    { id: "n30-pm", start: "x^2=4", history: ["x^2=4"], typed: "x=±2" },
    { id: "n30-skip-final", start: "x^2=4", history: ["x^2=4"], typed: "x=2, x=-2" },
    { id: "n30-one-side", start: "x^2=4", history: ["x^2=4"], typed: "x=2" },
    { id: "n30-second-side", start: "x^2=4", history: ["x^2=4", "x=2"], typed: "x=-2" },
    { id: "n30-one-sqrt-side", start: "x^2=4", history: ["x^2=4"], typed: "√(x^2)=4" },
    { id: "n30-wrong-root", start: "x^2=4", history: ["x^2=4"], typed: "x=±3" },
    { id: "n30-illegal-linear", start: "x^2=4", history: ["x^2=4"], typed: "x=4" },
    { id: "n32-iso", start: "x^2-100=0", history: ["x^2-100=0"], typed: "x^2=100" },
    { id: "n32-both", start: "x^2-100=0", history: ["x^2-100=0", "x^2=100"], typed: "√(x^2)=√(100)" },
    { id: "n32-pm", start: "x^2-100=0", history: ["x^2-100=0", "x^2=100"], typed: "x=±10" },
    { id: "n33-iso", start: "x^2-1=0", history: ["x^2-1=0"], typed: "x^2=1" },
    { id: "n33-pm", start: "x^2-1=0", history: ["x^2-1=0", "x^2=1"], typed: "x=±1" },
    { id: "n35-iso", start: "x^2-1/4=0", history: ["x^2-1/4=0"], typed: "x^2=1/4" },
    { id: "n35-pm", start: "x^2-1/4=0", history: ["x^2-1/4=0", "x^2=1/4"], typed: "x=±1/2" },
    { id: "n37-none", start: "x^2+81=0", history: ["x^2+81=0"], typed: "x^2=-81" },
    { id: "n37-none-ans", start: "x^2+81=0", history: ["x^2+81=0", "x^2=-81"], typed: "אין פתרון ממשי" },
    { id: "n37-wrong-pm", start: "x^2+81=0", history: ["x^2+81=0", "x^2=-81"], typed: "x=±9" },
    { id: "n38-one", start: "x^2=0", history: ["x^2=0"], typed: "x=0" },
    { id: "n38-wrong-pm", start: "x^2=0", history: ["x^2=0"], typed: "x=±0" },
    { id: "n39-iso", start: "-x^2+36=0", history: ["-x^2+36=0"], typed: "x^2=36" },
    { id: "n39-pm", start: "-x^2+36=0", history: ["-x^2+36=0", "x^2=36"], typed: "x=±6" },
    { id: "n40-iso", start: "3x^2-3=0", history: ["3x^2-3=0"], typed: "3x^2=3" },
    { id: "n40-div", start: "3x^2-3=0", history: ["3x^2-3=0", "3x^2=3"], typed: "x^2=1" },
    { id: "n40-pm", start: "3x^2-3=0", history: ["3x^2-3=0", "x^2=1"], typed: "x=±1" },
    { id: "n40-skip", start: "3x^2-3=0", history: ["3x^2-3=0"], typed: "x=±1" },
    { id: "n41-iso", start: "5x^2-80=0", history: ["5x^2-80=0"], typed: "x^2=16" },
    { id: "n43-none-iso", start: "8x^2+8=0", history: ["8x^2+8=0"], typed: "x^2=-1" },
    { id: "n43-none-ans", start: "8x^2+8=0", history: ["8x^2+8=0", "x^2=-1"], typed: "אין פתרון ממשי" },
    { id: "n44-pm", start: "4x^2-9=0", history: ["4x^2-9=0"], typed: "x=±3/2" },
    { id: "arith-wrong-iso", start: "x^2-16=0", history: ["x^2-16=0"], typed: "x^2=15" },
    { id: "missing-eq", start: "x^2=4", history: ["x^2=4"], typed: "x+2" },
  ];
}

function tutorEqs() {
  return [
    { id: "n30", start: "x^2=4" },
    { id: "n30-iso", start: "x^2=4", cur: "x^2=4" },
    { id: "n32-mid", start: "x^2-100=0", cur: "x^2=100" },
    { id: "n37", start: "x^2+81=0" },
    { id: "n37-iso", start: "x^2+81=0", cur: "x^2=-81" },
    { id: "n38", start: "x^2=0" },
    { id: "n40", start: "3x^2-3=0" },
    { id: "n40-iso", start: "3x^2-3=0", cur: "x^2=1" },
    { id: "n43", start: "8x^2+8=0" },
    { id: "n44", start: "4x^2-9=0" },
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
    var local = snapshotSqrtCheck(checkSqrtTyped(engine, payload));
    var remote = snapshotSqrtCheck(await postSqrt(payload));
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

    var hintLocal = localHint(engine, row.start, cur);
    var hintRemote = snapHint(
      await postSqrt({ intent: "hint", start: row.start, history: hist })
    );
    if (!jsonEqual(hintLocal, hintRemote)) {
      mismatches.push({ id: row.id + "-hint", local: hintLocal, server: hintRemote });
    }

    var oneRemote = await postSqrt({ intent: "one-step", start: row.start, history: hist });
    var oneLocal = engine.DoctematicaTeach.nextAction(cur, { unknown: "x2" }) || {};
    var pack = engine.DoctematicaQuadratic.analyzeSqrtStart(row.start);
    var nextEq = oneLocal.eq;
    if (!nextEq) {
      var fin = engine.DoctematicaQuadratic.nextSqrtStep(cur, pack);
      nextEq = fin && fin.eq;
    }
    if (nextEq) {
      if (String(oneRemote.step) !== String(nextEq)) {
        mismatches.push({
          id: row.id + "-one-step-eq",
          local: nextEq,
          server: oneRemote.step,
        });
      }
      var checkLocal = snapshotSqrtCheck(
        checkSqrtTyped(engine, {
          start: row.start,
          history: hist,
          previous: cur,
          typed: nextEq,
        })
      );
      var checkRemote = snapshotSqrtCheck(oneRemote);
      delete checkRemote.step;
      delete checkRemote.hint;
      delete checkRemote.done;
      if (!jsonEqual(checkLocal, checkRemote)) {
        mismatches.push({
          id: row.id + "-one-step-check",
          local: checkLocal,
          server: checkRemote,
        });
      }
    } else if (oneRemote.step) {
      mismatches.push({ id: row.id + "-one-step-extra", server: oneRemote });
    }

    var solLocal = localSolution(engine, row.start);
    var solRemote = remoteSolution(
      await postSqrt({ intent: "solution", start: row.start, history: [row.start] })
    );
    if (!jsonEqual(solLocal, solRemote)) {
      mismatches.push({ id: row.id + "-solution", local: solLocal, server: solRemote });
    }
  }
  return { count: rows.length * 3, mismatches: mismatches };
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
    console.log("quadratic/sqrt parity vs POST /api/quadratic");
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
