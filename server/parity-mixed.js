"use strict";

var http = require("http");
var path = require("path");
var spawn = require("child_process").spawn;
var loadEngine = require("./load-engine").loadEngine;
var handleMixed = require("./quad-mixed").handleMixed;

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

function postMixed(payload) {
  return postJson(
    Object.assign(
      {
        topic: "quadratic",
        subtopic: "mixed",
      },
      payload
    )
  );
}

function clean(res) {
  res = JSON.parse(JSON.stringify(res || {}));
  delete res.lcd;
  delete res.offerFormula;
  return res;
}

async function compare(engine, id, payload) {
  var local = clean(handleMixed(engine, payload));
  var remote = clean(await postMixed(payload));
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

function mixedLevels(engine) {
  return (engine.DoctematicaCurriculum.levels || []).filter(function (item) {
    return item.topic === "quadratic" && item.mode === "quad-mixed";
  });
}

async function run(engine) {
  var mismatches = [];
  var count = 0;
  var Q = engine.DoctematicaQuadratic;
  var Teach = engine.DoctematicaTeach;
  var levels = mixedLevels(engine);

  async function add(id, payload) {
    count += 1;
    var m = await compare(engine, id, payload);
    if (m) mismatches.push(m);
  }

  var li;
  for (li = 0; li < levels.length; li++) {
    var level = levels[li];
    var exs = level.exercises || [];
    var ei;
    for (ei = 0; ei < exs.length; ei++) {
      var start = exs[ei].start;
      var n = exs[ei].n;
      var id = level.id + "-n" + n;
      var pack;
      try {
        pack = Q.analyzeMixedStart(start);
      } catch (err) {
        continue;
      }
      var domain = Teach.analyzeDomain(start);
      if (domain) {
        await add(id + "-no-domain", {
          intent: "check",
          start: start,
          history: [start],
          typed: pack.standard || start,
        });
        await add(id + "-domain-setup", { intent: "setup", start: start, history: [start] });
      }
      var payloadBase = { start: start, history: [start] };
      if (domain) {
        payloadBase.domain = { trail: [{ display: domain.display }] };
      }
      await add(id + "-wrong", Object.assign({ intent: "check", typed: "x=1" }, payloadBase));
      var act = Q.nextMixedStep(start, pack);
      if (act && act.eq) {
        await add(id + "-first", Object.assign({ intent: "check", typed: act.eq }, payloadBase));
      }
      await add(id + "-hint", Object.assign({ intent: "hint" }, payloadBase));
      await add(id + "-one-step", Object.assign({ intent: "one-step" }, payloadBase));
      await add(id + "-solution", Object.assign({ intent: "solution" }, payloadBase));

      if (pack.standard && pack.standard !== start) {
        var stdHist = { start: start, history: [start, pack.standard] };
        if (domain) stdHist.domain = payloadBase.domain;
        if (pack.natural === "factor" && pack.factor) {
          await add(id + "-to-factor", Object.assign({ intent: "check", typed: pack.factor.factored }, stdHist));
        }
        if (pack.natural === "sqrt") {
          var iso = act && act.path === "sqrt" ? act.eq : null;
          if (iso) await add(id + "-to-sqrt", Object.assign({ intent: "check", typed: iso }, stdHist));
        }
        if (pack.natural === "linear") {
          await add(id + "-formula-enter-block", Object.assign({ intent: "formula-enter" }, stdHist));
        }
        if (Q.isAbcOrder(pack.standard) && pack.classify && pack.classify.kind !== "linear") {
          await add(id + "-formula-enter", Object.assign({ intent: "formula-enter" }, stdHist));
          await add(
            id + "-formula-a",
            Object.assign(
              {
                intent: "check",
                phase: "abc",
                letter: "a",
                typed: String(pack.a),
              },
              stdHist
            )
          );
        }
      }
    }
  }

  await add("trust-path-ignored", {
    intent: "check",
    start: "6+7x=-x^2",
    history: ["6+7x=-x^2"],
    mixed: { path: "formula" },
    typed: "x=1",
  });

  var unordered = "6+7x+x^2=0";
  await add("formula-enter-standard-not-abc", {
    intent: "formula-enter",
    start: "6+7x=-x^2",
    history: ["6+7x=-x^2", unordered],
  });
  var nActUn = Q.nextMixedStep(unordered, Q.analyzeMixedStart("6+7x=-x^2"));
  if (nActUn && nActUn.path === "formula" && !nActUn.eq) {
    mismatches.push({
      id: "next-step-reorder-before-formula",
      local: nActUn,
      server: { expect: "reorder to ax^2+bx+c=0, not formula enter" },
    });
  }

  function normStep(s) {
    return String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/²/g, "^2")
      .replace(/\s+/g, "");
  }
  function expectStep(id, act, eq) {
    count += 1;
    var got = act && normStep(act.eq);
    if (got !== normStep(eq)) {
      mismatches.push({ id: id, local: act, server: { expect: eq } });
    }
  }
  var screenStart = "4(x+2)(x+3)-6x=12";
  var screenPack = Q.analyzeMixedStart(screenStart);
  var scattered = "4x^2+12x+8x+24-6x=12";
  var combined = "4x^2+14x+24=12";
  var screenAct = Q.nextMixedStep(scattered, screenPack);
  expectStep("combine-before-move", screenAct, combined);
  count += 1;
  if (!screenAct || !/אספו איברים דומים/.test(String(screenAct.hint || "")) || /העבירו את כל האיברים/.test(String(screenAct.hint || ""))) {
    mismatches.push({ id: "combine-before-move-hint", local: screenAct && screenAct.hint, server: { expect: "collect like terms" } });
  }
  expectStep("combine-unicode-minus", Q.nextMixedStep("4x²+12x+8x+24−6x=12", screenPack), combined);
  expectStep("combine-both-sides", Q.nextMixedStep("4x^2+12x+8x+20+4-6x=8+4", screenPack), combined);
  expectStep("combine-right-only", Q.nextMixedStep("4x^2+14x+24=8+4", screenPack), combined);
  expectStep("move-after-combine", Q.nextMixedStep(combined, screenPack), "4x^2+14x+24-12=0");
  expectStep("combine-after-move", Q.nextMixedStep("4x^2+12x+8x-6x+24-12=0", screenPack), screenPack.standard);
  var screenSteps = (screenPack.steps || []).map(normStep);
  var combinedAt = screenSteps.indexOf(normStep(combined));
  var movedAt = screenSteps.indexOf("4x^2+14x+24-12=0");
  count += 1;
  if (combinedAt < 0 || movedAt < 0 || combinedAt > movedAt) {
    mismatches.push({
      id: "solution-combines-before-move",
      local: screenPack.steps,
      server: { expect: combined + " before 4x^2+14x+24-12=0" },
    });
  }
  var skipMove = Q.checkMixedTyped(scattered, "4x^2+12x+8x-6x+24-12=0", screenPack);
  count += 1;
  if (!skipMove.ok) {
    mismatches.push({ id: "skip-move-still-legal", local: skipMove, server: { expect: "ok" } });
  }
  await add("combine-before-move-one-step", {
    intent: "one-step",
    start: screenStart,
    history: [screenStart, scattered],
  });
  var one = handleMixed(engine, {
    intent: "one-step",
    start: screenStart,
    history: [screenStart, scattered],
  });
  count += 1;
  if (!one.ok || normStep(one.step) !== normStep(combined)) {
    mismatches.push({ id: "combine-before-move-one-step-eq", local: one, server: { expect: combined } });
  }

  var bothStart = "6x^2-4x-26+10x=5x^2-26";
  var bothPack = Q.analyzeMixedStart(bothStart);
  expectStep("combine-one-side-of-two", Q.nextMixedStep(bothStart, bothPack), "6x^2+6x-26=5x^2-26");

  var negScattered = "-15x^2+35x-60x+140=-10x-40";
  var negPack = Q.analyzeMixedStart("-5(x+4)(3x-7)=-(x+4)10");
  expectStep("combine-keeps-negative-a", Q.nextMixedStep(negScattered, negPack), "-15x^2-25x+140=-10x-40");

  var sqrtStart = "5x^2+20=4x^2+84";
  var sqrtAct = Q.nextMixedStep(sqrtStart, Q.analyzeMixedStart(sqrtStart));
  expectStep("sqrt-still-moves-before-combine", sqrtAct, "5x^2-4x^2=84-20");

  var arrangedStart = "(x+4)(x+7)=70";
  var arrangedHist = [
    arrangedStart,
    "x^2+7x+4x+28=70",
    "x^2+11x+28=70",
    "x^2+11x+28-70=0",
    "x^2+11x-42=0",
  ];
  var choose = handleMixed(engine, { intent: "one-step", start: arrangedStart, history: arrangedHist });
  count += 1;
  if (!choose || !choose.ok || choose.enter !== "formula" || choose.nextLetter !== "b" || !choose.fill || choose.fill.a == null) {
    mismatches.push({
      id: "arranged-one-step-starts-formula",
      local: choose,
      server: { expect: "enter formula and fill a, next letter b" },
    });
  }
  var Qh = require("./quadratic").createQuadraticHandler(engine);
  var arrived = Qh.handle({
    topic: "quadratic",
    subtopic: "mixed",
    intent: "check",
    start: arrangedStart,
    history: arrangedHist.slice(0, 4),
    previous: arrangedHist[3],
    typed: arrangedHist[4],
  });
  count += 1;
  if (!arrived || !arrived.ok || !arrived.offerFormula || arrived.enter) {
    mismatches.push({
      id: "arranged-check-offers-buttons",
      local: arrived,
      server: { expect: "ok, offerFormula, no enter" },
    });
  }
  var offered = Qh.handle({
    topic: "quadratic",
    subtopic: "mixed",
    intent: "one-step",
    start: arrangedStart,
    history: arrangedHist,
  });
  count += 1;
  if (!offered || offered.enter !== "formula" || offered.nextLetter !== "b") {
    mismatches.push({
      id: "arranged-one-step-offerFormula",
      local: offered,
      server: { expect: "one-step enters formula at a" },
    });
  }

  return { count: count, mismatches: mismatches };
}

function walkMixed(engine, start) {
  var handle = require("./quad-mixed").handleMixed;
  var hist = [start];
  var path = null;
  var split = false;
  var trails = [[], []];
  var seen = Object.create(null);
  var i;
  for (i = 0; i < 24; i++) {
    var last = hist[hist.length - 1];
    var key = String(path) + "|" + last + "|split:" + split + "|" + trails[0].join(",") + "|" + trails[1].join(",");
    if (seen[key]) return { ok: false, id: start, fail: "loop", last: last, path: path };
    seen[key] = true;
    var body = { intent: "one-step", start: start, history: hist };
    if (path === "formula") body.phase = "abc";
    if (path === "factor") body.factor = { split: split, trails: trails };
    var res = handle(engine, body);
    var msg = String((res && (res.message || res.hint)) || "");
    if (/זו אותה משוואה|תו לא מוכר|undefined/.test(msg)) {
      return { ok: false, id: start, fail: msg, last: last, path: path };
    }
    if (res && (res.chooseFormula || ((res.path === "formula" || res.enter === "formula") && !res.step))) {
      var ent = handle(engine, { intent: "formula-enter", start: start, history: hist });
      if (!ent.ok) return { ok: false, id: start, fail: "formula-enter: " + ent.message, last: last };
      var abc = handle(engine, { intent: "one-step", start: start, history: hist, phase: "abc" });
      if (!abc.ok) return { ok: false, id: start, fail: "formula-abc: " + abc.message, last: last };
      if (abc.nextPhase !== "plug" && abc.nextPhase !== "done") {
        return { ok: false, id: start, fail: "formula nextPhase " + abc.nextPhase, last: last };
      }
      return { ok: true, via: "formula" };
    }
    if (res && res.split && !split) {
      path = "factor";
      split = true;
      continue;
    }
    if (res && (res.solvedAll || res.solved === true)) return { ok: true, via: path || res.path || "solved" };
    if (path === "factor" && res && res.step) {
      var which = typeof res.which === "number" ? res.which : 1;
      trails[which] = trails[which].concat([res.step]);
      continue;
    }
    if (res && (res.done || !res.step)) {
      if (path === "sqrt" || res.path === "sqrt") return { ok: true, via: "sqrt" };
      if (path === "linear" || res.path === "linear") return { ok: true, via: "linear" };
      if (path === "factor") return { ok: true, via: "factor" };
      return { ok: false, id: start, fail: "stuck", last: last, msg: msg, path: path };
    }
    hist.push(res.step);
    if (res.path) path = res.path;
  }
  return { ok: false, id: start, fail: "too many steps", last: hist[hist.length - 1] };
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
    console.log("quadratic/mixed parity vs POST /api/quadratic");
    var result = await run(engine);
    printStage("mixed", result);
    if (result.mismatches.length) {
      process.exitCode = 1;
      return;
    }
    var walks = [];
    mixedLevels(engine).forEach(function (level) {
      (level.exercises || []).forEach(function (ex) {
        if (level.id === "quad-mixed-6" || level.id === "quad-mixed-7") return;
        if (engine.DoctematicaTeach.analyzeDomain(ex.start)) return;
        if (engine.DoctematicaTeach.analyzeLcdNeed && engine.DoctematicaTeach.analyzeLcdNeed(ex.start)) return;
        walks.push(walkMixed(engine, ex.start));
      });
    });
    var badWalk = walks.filter(function (w) {
      return !w.ok;
    });
    console.log("mixed one-step walks: " + walks.length + ", failed " + badWalk.length);
    badWalk.slice(0, 8).forEach(function (w) {
      console.log("WALK FAIL " + w.id + " " + w.fail + " last=" + w.last + " path=" + w.path);
    });
    if (badWalk.length) {
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
