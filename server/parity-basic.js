"use strict";

var http = require("http");
var path = require("path");
var spawn = require("child_process").spawn;
var loadEngine = require("./load-engine").loadEngine;

var PORT = Number(process.env.DOCTEMATICA_PARITY_PORT || 8791);
var HOST = "127.0.0.1";

function snapshot(result) {
  result = result || {};
  return {
    ok: !!result.ok,
    solved: !!result.solved,
    same: !!result.same,
    errorId: result.errorId || null,
    message: String(result.message || ""),
  };
}

function snapsEqual(a, b) {
  return (
    a.ok === b.ok &&
    a.solved === b.solved &&
    a.same === b.same &&
    a.errorId === b.errorId &&
    a.message === b.message
  );
}

function postJson(apiPath, payload) {
  var body = JSON.stringify(payload);
  return new Promise(function (resolve, reject) {
    var req = http.request(
      {
        hostname: HOST,
        port: PORT,
        path: apiPath,
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

function postCheck(previous, typed) {
  return postJson("/api/check-step", { previous: previous, typed: typed });
}

function postBasic(payload) {
  return postJson("/api/equations/basic", payload);
}

function jsonEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function localHint(engine, eq) {
  var act = engine.DoctematicaTeach.nextAction(eq) || {};
  return {
    ok: true,
    done: !!act.done,
    hint: String(act.hint || ""),
    step: act.eq ? String(act.eq) : null,
  };
}

function localOneStep(engine, eq) {
  var act = engine.DoctematicaTeach.nextAction(eq);
  if (!act || act.done || !act.eq) {
    return {
      ok: true,
      solved: false,
      same: false,
      errorId: null,
      message: "",
      done: true,
      hint: String((act && act.hint) || "המשוואה כבר פתורה."),
      step: null,
    };
  }
  var check = snapshot(engine.DoctematicaAlgebra.checkStep(eq, act.eq));
  check.done = false;
  check.hint = String(act.hint || "");
  check.step = String(act.eq);
  return check;
}

function localSolution(engine, start) {
  var path = engine.DoctematicaTeach.fullPath(start) || {};
  return {
    ok: true,
    steps: (path.steps || []).map(function (s) {
      s = s || {};
      return { eq: String(s.eq || ""), explain: String(s.explain || "") };
    }),
    answer: String(path.answer || ""),
  };
}

function remoteHint(remote) {
  return {
    ok: true,
    done: !!remote.done,
    hint: String(remote.hint || ""),
    step: remote.step ? String(remote.step) : null,
  };
}

function remoteOneStep(remote) {
  var check = snapshot(remote);
  check.done = !!remote.done;
  check.hint = String(remote.hint || "");
  check.step = remote.step ? String(remote.step) : null;
  return check;
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

function tutorEqs() {
  return [
    { id: "l1-n1", level: "level-01", n: 1, eq: "x - 4 = 3" },
    { id: "l1-n1-mid", level: "level-01", n: 1, eq: "x = 3 + 4" },
    { id: "l1-n1-done", level: "level-01", n: 1, eq: "x = 7" },
    { id: "l2-n13", level: "level-02", n: 13, eq: "2x = 12" },
    { id: "l3-n34", level: "level-03", n: 34, eq: "2x - 3 = 7" },
    { id: "l3-n34-mid", level: "level-03", n: 34, eq: "2x = 10" },
    { id: "l3-n51", level: "level-03", n: 51, eq: "(1/2)x + 4 = 6" },
    { id: "l4-n55", level: "level-04", n: 55, eq: "7x + 3x = 50" },
    { id: "l4-n61", level: "level-04", n: 61, eq: "7x = 4x + 12" },
    { id: "l5-n75", level: "level-05", n: 75, eq: "2(x+6)=20" },
    { id: "l5-n76", level: "level-05", n: 76, eq: "7(x+2)+8=43" },
    { id: "l5-n88", level: "level-05", n: 88, eq: "7(x+4)=3(6-x)" },
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

function cases() {
  return [
    {
      id: "l1-n1-nonfinal",
      level: "level-01",
      n: 1,
      kind: "correct-nonfinal",
      previous: "x - 4 = 3",
      typed: "x - 4 + 4 = 3 + 4",
    },
    {
      id: "l1-n1-final",
      level: "level-01",
      n: 1,
      kind: "final-ok",
      previous: "x - 4 = 3",
      typed: "x = 7",
    },
    {
      id: "l1-n1-arith",
      level: "level-01",
      n: 1,
      kind: "arith-wrong",
      previous: "x - 4 = 3",
      typed: "x = 8",
    },
    {
      id: "l1-n7-sign",
      level: "level-01",
      n: 7,
      kind: "move-sign-wrong",
      previous: "x + 4 = 9",
      typed: "x = 13",
    },
    {
      id: "l1-n11-frac-final",
      level: "level-01",
      n: 11,
      kind: "final-ok",
      previous: "x + 1/2 = 1",
      typed: "x = 1/2",
    },
    {
      id: "l1-n10-decimal-final",
      level: "level-01",
      n: 10,
      kind: "final-ok",
      previous: "6.5 + x = 4",
      typed: "x = -2.5",
    },
    {
      id: "l1-n7-same",
      level: "level-01",
      n: 7,
      kind: "same-eq",
      previous: "x + 4 = 9",
      typed: "x + 4 = 9",
    },
    {
      id: "l2-n13-nonfinal",
      level: "level-02",
      n: 13,
      kind: "correct-nonfinal",
      previous: "2x = 12",
      typed: "x = 12/2",
    },
    {
      id: "l2-n13-final",
      level: "level-02",
      n: 13,
      kind: "final-ok",
      previous: "2x = 12",
      typed: "x = 6",
    },
    {
      id: "l2-n13-arith",
      level: "level-02",
      n: 13,
      kind: "arith-wrong",
      previous: "2x = 12",
      typed: "x = 8",
    },
    {
      id: "l2-n23-frac-final",
      level: "level-02",
      n: 23,
      kind: "final-ok",
      previous: "8x = 7",
      typed: "x = 7/8",
    },
    {
      id: "l2-n20-skip-final",
      level: "level-02",
      n: 20,
      kind: "legal-skip",
      previous: "-x = 7",
      typed: "x = -7",
    },
    {
      id: "l3-n34-nonfinal",
      level: "level-03",
      n: 34,
      kind: "correct-nonfinal",
      previous: "2x - 3 = 7",
      typed: "2x = 10",
    },
    {
      id: "l3-n34-final-skip",
      level: "level-03",
      n: 34,
      kind: "legal-skip",
      previous: "2x - 3 = 7",
      typed: "x = 5",
    },
    {
      id: "l3-n34-sign",
      level: "level-03",
      n: 34,
      kind: "move-sign-wrong",
      previous: "2x - 3 = 7",
      typed: "2x = 7 - 3",
    },
    {
      id: "l3-n34-sign-computed",
      level: "level-03",
      n: 34,
      kind: "move-sign-wrong",
      previous: "2x - 3 = 7",
      typed: "2x = 4",
    },
    {
      id: "l3-n51-nonfinal",
      level: "level-03",
      n: 51,
      kind: "correct-nonfinal",
      previous: "(1/2)x + 4 = 6",
      typed: "(1/2)x = 2",
    },
    {
      id: "l3-n51-skip",
      level: "level-03",
      n: 51,
      kind: "legal-skip",
      previous: "(1/2)x + 4 = 6",
      typed: "x = 4",
    },
    {
      id: "l4-n55-nonfinal",
      level: "level-04",
      n: 55,
      kind: "correct-nonfinal",
      previous: "7x + 3x = 50",
      typed: "10x = 50",
    },
    {
      id: "l4-n55-combine-wrong",
      level: "level-04",
      n: 55,
      kind: "arith-wrong",
      previous: "7x + 3x = 50",
      typed: "9x = 50",
    },
    {
      id: "l4-n55-skip",
      level: "level-04",
      n: 55,
      kind: "legal-skip",
      previous: "7x + 3x = 50",
      typed: "x = 5",
    },
    {
      id: "l4-n61-nonfinal",
      level: "level-04",
      n: 61,
      kind: "correct-nonfinal",
      previous: "7x = 4x + 12",
      typed: "3x = 12",
    },
    {
      id: "l4-n61-skip",
      level: "level-04",
      n: 61,
      kind: "legal-skip",
      previous: "7x = 4x + 12",
      typed: "x = 4",
    },
    {
      id: "l4-n57-both-sides",
      level: "level-04",
      n: 57,
      kind: "correct-nonfinal",
      previous: "9x + 6x = 55 - 10",
      typed: "15x = 45",
    },
    {
      id: "l5-n75-expand-ok",
      level: "level-05",
      n: 75,
      kind: "expand-ok",
      previous: "2(x+6)=20",
      typed: "2x+12=20",
    },
    {
      id: "l5-n75-expand-wrong",
      level: "level-05",
      n: 75,
      kind: "expand-wrong",
      previous: "2(x+6)=20",
      typed: "2x+6=20",
    },
    {
      id: "l5-n75-skip-mid",
      level: "level-05",
      n: 75,
      kind: "legal-skip",
      previous: "2(x+6)=20",
      typed: "2x = 8",
    },
    {
      id: "l5-n75-skip-final",
      level: "level-05",
      n: 75,
      kind: "legal-skip",
      previous: "2(x+6)=20",
      typed: "x=4",
    },
    {
      id: "l5-n76-expand-ok",
      level: "level-05",
      n: 76,
      kind: "expand-ok",
      previous: "7(x+2)+8=43",
      typed: "7x+14+8=43",
    },
    {
      id: "l5-n88-expand-ok",
      level: "level-05",
      n: 88,
      kind: "expand-ok",
      previous: "7(x+4)=3(6-x)",
      typed: "7x+28=18-3x",
    },
    {
      id: "l5-n88-expand-wrong",
      level: "level-05",
      n: 88,
      kind: "expand-wrong",
      previous: "7(x+4)=3(6-x)",
      typed: "7x+28=18+3x",
    },
    {
      id: "l5-n88-skip-final",
      level: "level-05",
      n: 88,
      kind: "legal-skip",
      previous: "7(x+4)=3(6-x)",
      typed: "x=-1",
    },
  ];
}

function addTeachOneSteps(engine, list) {
  var Teach = engine.DoctematicaTeach;
  var Algebra = engine.DoctematicaAlgebra;
  var starts = [
    { id: "l1-n1-teach", level: "level-01", n: 1, previous: "x - 4 = 3" },
    { id: "l2-n13-teach", level: "level-02", n: 13, previous: "2x = 12" },
    { id: "l3-n34-teach", level: "level-03", n: 34, previous: "2x - 3 = 7" },
    { id: "l4-n61-teach", level: "level-04", n: 61, previous: "7x = 4x + 12" },
    { id: "l5-n75-teach", level: "level-05", n: 75, previous: "2(x+6)=20" },
    { id: "l5-n88-teach", level: "level-05", n: 88, previous: "7(x+4)=3(6-x)" },
  ];
  starts.forEach(function (row) {
    var act = Teach.nextAction(row.previous);
    if (!act || !act.eq) {
      throw new Error("Teach.nextAction missing for " + row.id);
    }
    var local = Algebra.checkStep(row.previous, act.eq);
    if (!local || !local.ok) {
      throw new Error("Teach.nextAction not accepted locally for " + row.id + ": " + act.eq);
    }
    list.push({
      id: row.id,
      level: row.level,
      n: row.n,
      kind: "teach-one-step",
      previous: row.previous,
      typed: act.eq,
    });
  });
}

async function runCases(engine, list) {
  var Algebra = engine.DoctematicaAlgebra;
  var mismatches = [];
  var i;
  for (i = 0; i < list.length; i++) {
    var c = list[i];
    var local = snapshot(Algebra.checkStep(c.previous, c.typed));
    var viaOld = snapshot(await postCheck(c.previous, c.typed));
    var viaNew = snapshot(
      await postBasic({
        intent: "check",
        start: c.previous,
        history: [c.previous],
        typed: c.typed,
      })
    );
    if (!snapsEqual(local, viaOld) || !snapsEqual(local, viaNew)) {
      mismatches.push({
        intent: "check",
        id: c.id,
        level: c.level,
        n: c.n,
        kind: c.kind,
        previous: c.previous,
        typed: c.typed,
        local: local,
        checkStep: viaOld,
        equationsBasic: viaNew,
      });
    }
  }
  return mismatches;
}

async function runTutor(engine) {
  var mismatches = [];
  var rows = tutorEqs();
  var i;
  for (i = 0; i < rows.length; i++) {
    var row = rows[i];
    var hintLocal = localHint(engine, row.eq);
    var hintRemote = remoteHint(
      await postBasic({ intent: "hint", start: row.eq, history: [row.eq] })
    );
    if (!jsonEqual(hintLocal, hintRemote)) {
      mismatches.push({
        intent: "hint",
        id: row.id + "-hint",
        eq: row.eq,
        local: hintLocal,
        server: hintRemote,
      });
    }
    var oneLocal = localOneStep(engine, row.eq);
    var oneRemote = remoteOneStep(
      await postBasic({ intent: "one-step", start: row.eq, history: [row.eq] })
    );
    if (!jsonEqual(oneLocal, oneRemote)) {
      mismatches.push({
        intent: "one-step",
        id: row.id + "-one-step",
        eq: row.eq,
        local: oneLocal,
        server: oneRemote,
      });
    }
    var solLocal = localSolution(engine, row.eq);
    var solRemote = remoteSolution(
      await postBasic({ intent: "solution", start: row.eq, history: [row.eq] })
    );
    if (!jsonEqual(solLocal, solRemote)) {
      mismatches.push({
        intent: "solution",
        id: row.id + "-solution",
        eq: row.eq,
        local: solLocal,
        server: solRemote,
      });
    }
  }
  return mismatches;
}

function eqKey(s) {
  return String(s || "")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function sameLinear(Algebra, a, b) {
  if (eqKey(a) === eqKey(b)) return true;
  try {
    return Algebra.equivalent(Algebra.parseEquation(a), Algebra.parseEquation(b));
  } catch (err) {
    return false;
  }
}

async function numericMulContract(engine) {
  var Teach = engine.DoctematicaTeach;
  var Algebra = engine.DoctematicaAlgebra;
  var mismatches = [];

  function fail(id, detail) {
    mismatches.push({ id: id, detail: detail });
  }

  async function check(id, eq, pred) {
    var local = Teach.nextAction(eq) || {};
    var remote = await postBasic({ intent: "hint", start: eq, history: [eq] });
    var one = await postBasic({ intent: "one-step", start: eq, history: [eq] });
    var err = pred(local, remote || {}, one || {});
    if (err) fail(id, err + " local=" + JSON.stringify({ hint: local.hint, eq: local.eq }));
    if (remote && String(remote.hint || "") !== String(local.hint || "")) {
      fail(id + "-hint-parity", JSON.stringify({ local: local.hint, remote: remote.hint }));
    }
    if (one && local.eq && String(one.step || "") !== String(local.eq)) {
      fail(id + "-step-parity", JSON.stringify({ local: local.eq, remote: one.step, hint: one.hint }));
    }
  }

  function isMulHint(hint) {
    return /כפל/.test(String(hint || "")) && /·/.test(String(hint || "")) && !/[×xX*]/.test(String(hint || "").replace(/הכפל/g, ""));
  }

  await check("prod-dot", "2x + 2·6 = 20", function (local) {
    if (!isMulHint(local.hint) || local.hint.indexOf("2·6") < 0) return "hint should ask to compute 2·6";
    if (/העבירו/.test(local.hint)) return "must not move 12 before the product is computed";
    if (!sameLinear(Algebra, local.eq, "2x + 12 = 20")) return "step should be 2x+12=20, got " + local.eq;
    if (/[·×*]/.test(String(local.eq || ""))) return "computed step should not keep a multiply sign";
    return "";
  });

  await check("prod-star", "2x+2*6=20", function (local) {
    if (!isMulHint(local.hint) || local.hint.indexOf("2·6") < 0) return "star input still displays ·";
    if (!sameLinear(Algebra, local.eq, "2x+12=20")) return "got " + local.eq;
    return "";
  });

  await check("prod-times", "2x+2×6=20", function (local) {
    if (!isMulHint(local.hint) || local.hint.indexOf("2·6") < 0) return "times sign displays as ·";
    if (!sameLinear(Algebra, local.eq, "2x+12=20")) return "got " + local.eq;
    return "";
  });

  await check("prod-then-move", "2x + 12 = 20", function (local) {
    if (/כפל/.test(String(local.hint || ""))) return "12 is already computed";
    if (!/העבירו/.test(String(local.hint || "")) || String(local.hint).indexOf("12") < 0) return "now move 12, got " + local.hint;
    return "";
  });

  await check("expand-still-computes", "2(x+6)=20", function (local) {
    if (/כפל/.test(String(local.hint || ""))) return "opening parens stays the site path";
    if (!/סוגר/.test(String(local.hint || ""))) return "expected paren hint, got " + local.hint;
    if (!sameLinear(Algebra, local.eq, "2x+12=20")) return "got " + local.eq;
    return "";
  });

  await check("legal-student-path", "2x+2·6=20", function (local) {
    var opened = Algebra.checkStep("2(x+6)=20", "2x+2·6=20");
    if (!opened || !opened.ok) return "2x+2·6=20 should stay a legal expansion";
    if (!isMulHint(local.hint)) return "follow the written product, got " + local.hint;
    if (!sameLinear(Algebra, local.eq, "2x+12=20")) return "got " + local.eq;
    return "";
  });

  var after = Teach.nextAction("2x + 2·6 = 20");
  await check("after-product", after && after.eq, function (local) {
    if (/כפל/.test(String(local.hint || ""))) return "next hint still talks about a product";
    if (!/העבירו/.test(String(local.hint || ""))) return "after computing, move the constant, got " + local.hint;
    return "";
  });

  await check("neg-product", "2x - 3·4 = 5", function (local) {
    if (String(local.hint || "").indexOf("3·4") < 0) return "hint " + local.hint;
    if (!sameLinear(Algebra, local.eq, "2x - 12 = 5")) return "got " + local.eq;
    return "";
  });

  await check("paren-neg", "x + 5·(-2) = 1", function (local) {
    if (String(local.hint || "").replace(/[−–—]/g, "-").indexOf("5·(-2)") < 0) return "hint " + local.hint;
    if (!sameLinear(Algebra, local.eq, "x - 10 = 1")) return "got " + local.eq;
    if (/\+\s*-/.test(String(local.eq || ""))) return "negative product should not stay as + -";
    return "";
  });

  await check("two-products", "2·6 + 3·4 = x", function (local) {
    if (String(local.hint || "").indexOf("2·6") < 0 || String(local.hint || "").indexOf("3·4") < 0) return "hint " + local.hint;
    if (/אחדו|העבירו/.test(String(local.hint || ""))) return "compute both products before combining";
    if (!sameLinear(Algebra, local.eq, "12 + 12 = x")) return "got " + local.eq;
    return "";
  });

  await check("coeff-x", "2·x = 10", function (local) {
    if (/כפל/.test(String(local.hint || ""))) return "2·x is not a numeric product";
    if (!/חלקו/.test(String(local.hint || ""))) return "got " + local.hint;
    return "";
  });

  await check("implicit-coeff", "2x = 10", function (local) {
    if (/כפל/.test(String(local.hint || ""))) return "2x is not a numeric product";
    return "";
  });

  await check("times-unknown", "2x·6 = 12", function (local) {
    if (/כפל/.test(String(local.hint || ""))) return "a factor with x is not a pure numeric product";
    return "";
  });

  await check("chain", "2·6·4 + x = 1", function (local) {
    if (String(local.hint || "").indexOf("2·6·4") < 0) return "hint " + local.hint;
    if (!sameLinear(Algebra, local.eq, "48 + x = 1")) return "got " + local.eq;
    return "";
  });

  await check("div-chain", "12/2·3 + x = 1", function (local) {
    if (String(local.hint || "").indexOf("·") < 0) return "hint " + local.hint;
    if (!sameLinear(Algebra, local.eq, "18 + x = 1")) return "got " + local.eq;
    return "";
  });

  await check("sum-unchanged", "x = 3 + 4", function (local) {
    if (/כפל/.test(String(local.hint || ""))) return "addition is not a product";
    if (!sameLinear(Algebra, local.eq, "x = 7")) return "got " + local.eq;
    return "";
  });

  return mismatches;
}

function printReport(list, checkMismatches, tutorMismatches, mulMismatches) {
  mulMismatches = mulMismatches || [];
  console.log("equations/basic parity");
  console.log("check cases: " + list.length);
  console.log("tutor eqs: " + tutorEqs().length + " × hint / one-step / solution");
  console.log("check mismatches: " + checkMismatches.length);
  console.log("tutor mismatches: " + tutorMismatches.length);
  console.log("numeric-mul mismatches: " + mulMismatches.length);
  var all = checkMismatches.concat(tutorMismatches).concat(mulMismatches);
  if (all.length) {
    all.forEach(function (m) {
      console.log("");
      console.log("MISMATCH " + m.id);
      console.log(JSON.stringify(m, null, 2));
    });
    process.exitCode = 1;
  } else {
    console.log("no parity mismatches");
  }
}

function startApi() {
  var child = spawn(process.execPath, [path.join(__dirname, "api.js")], {
    env: Object.assign({}, process.env, { DOCTEMATICA_API_PORT: String(PORT) }),
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", function () {});
  child.stderr.on("data", function (buf) {
    process.stderr.write(buf);
  });
  return child;
}

async function main() {
  var engine = loadEngine();
  var list = cases();
  addTeachOneSteps(engine, list);
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
    var checkMismatches = await runCases(engine, list);
    var tutorMismatches = await runTutor(engine);
    var mulMismatches = await numericMulContract(engine);
    printReport(list, checkMismatches, tutorMismatches, mulMismatches);
  } finally {
    finished = true;
    child.kill("SIGTERM");
  }
}

main().catch(function (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
