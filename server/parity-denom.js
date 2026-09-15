"use strict";

var http = require("http");
var path = require("path");
var spawn = require("child_process").spawn;
var loadEngine = require("./load-engine").loadEngine;

var PORT = Number(process.env.DOCTEMATICA_PARITY_PORT || 8792);
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

function jsonEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
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

function domainProof(engine, start) {
  var info = engine.DoctematicaTeach.analyzeDomain(start);
  if (!info) return { trail: [] };
  return { trail: [{ display: info.display }] };
}

function postDenom(payload) {
  payload = Object.assign(
    {
      topic: "equations",
      subtopic: "denom",
    },
    payload
  );
  return postJson("/api/equations", payload);
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

function snapDomain(res) {
  res = res || {};
  return {
    ok: !!res.ok,
    done: !!res.done,
    skip: !!res.skip,
    partial: !!res.partial,
    phase: res.phase || null,
    display: res.display ? String(res.display) : null,
    message: String(res.message || ""),
    itemIndex: res.itemIndex == null ? null : res.itemIndex,
    nextBranch: res.nextBranch == null ? null : res.nextBranch,
  };
}

function snapLcdValue(res) {
  res = res || {};
  return {
    ok: !!res.ok,
    reduced: !!res.reduced,
    lcd: res.lcd != null ? String(res.lcd) : null,
    message: String(res.message || ""),
  };
}

function checkCases() {
  return [
    { id: "const-den-mid", previous: "x/5=8", typed: "x=8*5" },
    { id: "const-den-skip", previous: "x/5=8", typed: "x=40" },
    { id: "const-den-arith", previous: "x/5=8", typed: "x=13" },
    { id: "multi-den-lcd-form", previous: "x/3+x/4=7", typed: "(4x+3x)/12=7" },
    { id: "multi-den-combine", previous: "x/3+x/4=7", typed: "7x/12=7" },
    { id: "multi-den-skip", previous: "x/3+x/4=7", typed: "x=12" },
    { id: "multi-den-wrong", previous: "x/3+x/4=7", typed: "(4x+3x)/12=84" },
    { id: "parens-mid", previous: "(x+6)/4=5", typed: "x+6=20" },
    { id: "parens-skip", previous: "(x+6)/4=5", typed: "x=14" },
    { id: "parens-wrong-mul", previous: "(x+6)/4=5", typed: "x+6=9" },
    { id: "cross-mul-ok", previous: "(x-7)/6=1/2", typed: "x-7=3" },
    { id: "rat-clear-ok", start: "8/x=2", previous: "8/x=2", typed: "8=2x" },
    { id: "rat-clear-wrong", start: "8/x=2", previous: "8/x=2", typed: "8=x" },
    { id: "rat-skip", start: "8/x=2", previous: "8/x=2", typed: "x=4" },
    { id: "rat-parens-clear-ok", start: "10/(x+2)=2", previous: "10/(x+2)=2", typed: "10=2(x+2)" },
    { id: "rat-parens-clear-wrong", start: "10/(x+2)=2", previous: "10/(x+2)=2", typed: "10=2x+2" },
    { id: "rat-two-dens-ok", start: "4/x=3/(x-2)", previous: "4/x=3/(x-2)", typed: "4(x-2)=3x" },
    { id: "rat-two-dens-wrong", start: "4/x=3/(x-2)", previous: "4/x=3/(x-2)", typed: "4(x-2)=3" },
    { id: "after-clear-expand", previous: "10=2(x+2)", typed: "10=2x+4" },
    { id: "after-clear-solve", previous: "10=2x+4", typed: "x=3" },
    { id: "after-const-lcd-solve", previous: "7x/12=7", typed: "x=12" },
    { id: "after-mul-compute", previous: "x = 8 * 5", typed: "x=40" },
    { id: "sign-wrong-const", previous: "x/2+x/5=-14", typed: "x=20" },
    { id: "illegal-skip-const", previous: "x/5=8", typed: "x=8" },
    { id: "l3-n6-bank", start: "5/x+3/x=2", previous: "5/x+3/x=2", typed: "8/x=2" },
    { id: "l4-n9-bank", start: "4/x=3/(x-2)", previous: "4/x=3/(x-2)", typed: "4(x-2)=3x" },
    { id: "domain-reject-sol", start: "8/x=2", previous: "8/x=2", typed: "x=0" },
  ];
}

function tutorEqs() {
  return [
    { id: "l1-n1", eq: "x/5=8" },
    { id: "l1-n6", eq: "x/3+x/4=7" },
    { id: "l2-n22", eq: "(x-7)/6=1/2" },
    { id: "l2-n24", eq: "(x+6)/4=5" },
    { id: "l3-n1", eq: "8/x=2" },
    { id: "l3-n6", eq: "5/x+3/x=2" },
    { id: "l4-n1", eq: "10/(x+2)=2" },
    { id: "l4-n9", eq: "4/x=3/(x-2)" },
    { id: "after-clear", eq: "10=2(x+2)" },
    { id: "solved", eq: "x=40" },
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

async function runCheckParity(engine) {
  var Algebra = engine.DoctematicaAlgebra;
  var mismatches = [];
  var list = checkCases();
  var i;
  for (i = 0; i < list.length; i++) {
    var c = list[i];
    var start = c.start || c.previous;
    var domain = domainProof(engine, start);
    var local = snapshot(Algebra.checkStep(c.previous, c.typed));
    var remote = snapshot(
      await postDenom({
        intent: "check",
        start: start,
        history: [c.previous],
        typed: c.typed,
        domain: domain,
      })
    );
    if (!snapsEqual(local, remote)) {
      mismatches.push({ stage: 1, id: c.id, previous: c.previous, typed: c.typed, local: local, server: remote });
    }
  }
  var alias = snapshot(
    await postJson("/api/equations/basic", {
      intent: "check",
      start: "x - 4 = 3",
      history: ["x - 4 = 3"],
      typed: "x = 7",
    })
  );
  var localBasic = snapshot(Algebra.checkStep("x - 4 = 3", "x = 7"));
  if (!snapsEqual(alias, localBasic)) {
    mismatches.push({ stage: 1, id: "basic-alias", local: localBasic, server: alias });
  }
  return { count: list.length + 1, mismatches: mismatches };
}

async function runTutorParity(engine) {
  var mismatches = [];
  var rows = tutorEqs();
  var i;
  for (i = 0; i < rows.length; i++) {
    var row = rows[i];
    var domain = domainProof(engine, row.eq);
    var hintLocal = localHint(engine, row.eq);
    var hintRemote = remoteHint(
      await postDenom({ intent: "hint", start: row.eq, history: [row.eq], domain: domain })
    );
    if (!jsonEqual(hintLocal, hintRemote)) {
      mismatches.push({ stage: 1, id: row.id + "-hint", local: hintLocal, server: hintRemote });
    }
    var oneLocal = localOneStep(engine, row.eq);
    var oneRemote = remoteOneStep(
      await postDenom({ intent: "one-step", start: row.eq, history: [row.eq], domain: domain })
    );
    if (!jsonEqual(oneLocal, oneRemote)) {
      mismatches.push({ stage: 1, id: row.id + "-one-step", local: oneLocal, server: oneRemote });
    }
    var solLocal = localSolution(engine, row.eq);
    var solRemote = remoteSolution(
      await postDenom({ intent: "solution", start: row.eq, history: [row.eq], domain: domain })
    );
    if (!jsonEqual(solLocal, solRemote)) {
      mismatches.push({ stage: 1, id: row.id + "-solution", local: solLocal, server: solRemote });
    }
  }
  return { count: rows.length * 3, mismatches: mismatches };
}

function localDomainCheck(engine, start, typed, domain) {
  var Teach = engine.DoctematicaTeach;
  var info = Teach.analyzeDomain(start);
  if (!info) {
    return snapDomain({
      ok: true,
      skip: true,
      done: true,
      message: "אין תחום הצבה מיוחד (אין נעלם במכנה).",
    });
  }
  var res;
  if (info.items && info.items.length > 1) {
    res = Teach.checkDomainProgress(
      start,
      typed,
      {
        items: (domain && domain.progressItems) || [],
        split: !domain || domain.split !== false,
        activeBranch: (domain && domain.activeBranch) || 0,
      },
      {}
    );
  } else {
    var trail = (domain && domain.trail) || [];
    res = Teach.checkDomain(start, typed, {
      previous: trail.length
        ? trail[trail.length - 1].display
        : (info.items[0] && info.items[0].rawPart) || info.rawDisplay,
      started: trail.length > 0,
    });
  }
  return snapDomain(res);
}

async function runDomainParity(engine) {
  var Teach = engine.DoctematicaTeach;
  var mismatches = [];
  var cases = [
    { id: "no-domain-skip", start: "x/5=8", typed: "x≠0" },
    { id: "one-forbidden-ok", start: "8/x=2", typed: "x≠0" },
    { id: "one-forbidden-wrong", start: "8/x=2", typed: "x≠1" },
    { id: "one-forbidden-raw", start: "10/(x+2)=2", typed: "x+2≠0" },
    { id: "one-forbidden-solved", start: "10/(x+2)=2", typed: "x≠-2" },
    {
      id: "one-forbidden-step",
      start: "10/(x+2)=2",
      typed: "x≠-2",
      domain: { trail: [{ display: "x+2≠0" }] },
    },
    { id: "one-forbidden-arith", start: "10/(x+2)=2", typed: "x≠2" },
    { id: "bank-l3-n1", start: "8/x=2", typed: "x≠0" },
    { id: "bank-l4-n3", start: "x/(6-2x)=-2", typed: "x≠3" },
    { id: "bank-l4-n3-raw", start: "x/(6-2x)=-2", typed: "6-2x≠0" },
    { id: "two-forbidden-full", start: "4/x=3/(x-2)", typed: "x≠0, x≠2" },
    { id: "two-forbidden-wrong", start: "4/x=3/(x-2)", typed: "x≠0" },
    {
      id: "two-forbidden-first-cell",
      start: "4/x=3/(x-2)",
      typed: "x≠0",
      domain: { split: true, activeBranch: 0, progressItems: [{ trail: [] }, { trail: [] }] },
    },
    {
      id: "two-forbidden-second-cell",
      start: "4/x=3/(x-2)",
      typed: "x≠2",
      domain: {
        split: true,
        activeBranch: 1,
        progressItems: [
          { phase: "solved", display: "x≠0", itemIndex: 0, trail: [{ display: "x≠0" }] },
          { trail: [] },
        ],
      },
    },
    { id: "two-dens-l4-n11", start: "3/(x-2)-7/(4-x)=0", typed: "x≠2, x≠4" },
  ];
  var i;
  for (i = 0; i < cases.length; i++) {
    var c = cases[i];
    var domain = c.domain || { trail: [] };
    var local = localDomainCheck(engine, c.start, c.typed, domain);
    var remote = snapDomain(
      await postDenom({
        intent: "domain-check",
        start: c.start,
        history: [c.start],
        typed: c.typed,
        domain: domain,
      })
    );
    if (!jsonEqual(local, remote)) {
      mismatches.push({ stage: 2, id: c.id, typed: c.typed, local: local, server: remote });
    }
  }

  var hintCases = ["8/x=2", "10/(x+2)=2", "4/x=3/(x-2)"];
  for (i = 0; i < hintCases.length; i++) {
    var eq = hintCases[i];
    var info = Teach.analyzeDomain(eq);
    var localHintText =
      info.items.length > 1
        ? "רשמו באחד התאים מכנה≠0 או x≠… — איזה מכנה שתרצו. התא השני יהיה למכנה שנשאר."
        : "רשמו תחום הצבה, למשל " + info.rawDisplay + " או " + info.display + ".";
    var remoteHint0 = await postDenom({
      intent: "domain-hint",
      start: eq,
      history: [eq],
      domain: { trail: [] },
    });
    if (remoteHint0.hint !== localHintText) {
      mismatches.push({
        stage: 2,
        id: "hint-start-" + eq,
        local: localHintText,
        server: remoteHint0.hint,
      });
    }
    var nxt = Teach.domainNextStep(info.items[0].rawPart);
    var remoteOne = await postDenom({
      intent: "domain-one-step",
      start: eq,
      history: [eq],
      domain: { trail: [], split: info.items.length > 1, activeBranch: 0, progressItems: info.items.map(function () { return { trail: [] }; }) },
    });
    if (info.items.length === 1 && remoteOne.display !== info.items[0].rawPart && remoteOne.step !== info.items[0].rawPart) {
      if (String(remoteOne.step) !== String(info.items[0].rawPart)) {
        mismatches.push({
          stage: 2,
          id: "one-step-start-" + eq,
          local: info.items[0].rawPart,
          server: remoteOne.step,
        });
      }
    }
    var remoteMid = await postDenom({
      intent: "domain-hint",
      start: eq,
      history: [eq],
      domain: { trail: [{ display: info.items[0].rawPart }] },
    });
    if (info.items.length === 1 && remoteMid.hint !== String(nxt.hint || nxt.display || "")) {
      mismatches.push({
        stage: 2,
        id: "hint-mid-" + eq,
        local: nxt.hint,
        server: remoteMid.hint,
      });
    }
  }

  var reveal = await postDenom({ intent: "domain-reveal", start: "10/(x+2)=2", history: ["10/(x+2)=2"] });
  var want = Teach.analyzeDomain("10/(x+2)=2");
  if (!reveal.ok || !reveal.done || reveal.display !== want.display) {
    mismatches.push({ stage: 2, id: "domain-reveal", local: want.display, server: reveal.display });
  }

  var setup = await postDenom({ intent: "setup", start: "8/x=2", history: ["8/x=2"] });
  if (!setup.domain || !setup.domain.needed || setup.domain.display !== Teach.analyzeDomain("8/x=2").display) {
    mismatches.push({ stage: 2, id: "setup-domain", server: setup.domain });
  }
  var setupNone = await postDenom({ intent: "setup", start: "x/5=8", history: ["x/5=8"] });
  if (setupNone.domain && setupNone.domain.needed) {
    mismatches.push({ stage: 2, id: "setup-no-domain", server: setupNone.domain });
  }

  return { count: cases.length + hintCases.length * 3 + 3, mismatches: mismatches };
}

async function runLcdParity(engine) {
  var Teach = engine.DoctematicaTeach;
  var mismatches = [];
  var eqs = [
    { id: "const-multi", eq: "x/3+x/4=7" },
    { id: "bank-l1-n6", eq: "x/3+x/4=7" },
    { id: "bank-l1-n11", eq: "3x-x/4+11=0" },
    { id: "parens", eq: "(x-6)/8+(x+3)/3=3" },
    { id: "var-den", eq: "5/x+3/x=2" },
    { id: "two-var", eq: "4/x=3/(x-2)" },
  ];
  var i;
  for (i = 0; i < eqs.length; i++) {
    var row = eqs[i];
    var info = Teach.analyzeLcdNeed(row.eq);
    var domain = domainProof(engine, row.eq);
    var need = await postDenom({ intent: "lcd-need", start: row.eq, history: [row.eq], domain: domain });
    var localNeed = !!info;
    if (!!need.lcd.needed !== localNeed) {
      mismatches.push({ stage: 3, id: row.id + "-need", local: localNeed, server: need.lcd.needed });
      continue;
    }
    if (!info) continue;
    var okVal = await postDenom({
      intent: "lcd-value",
      start: row.eq,
      history: [row.eq],
      typed: String(info.lcd),
      domain: domain,
    });
    var localOk = snapLcdValue(Teach.checkLcdValue(row.eq, String(info.lcd)));
    if (!jsonEqual(localOk, snapLcdValue(okVal))) {
      mismatches.push({ stage: 3, id: row.id + "-lcd-ok", local: localOk, server: snapLcdValue(okVal) });
    }
    var badVal = await postDenom({
      intent: "lcd-value",
      start: row.eq,
      history: [row.eq],
      typed: "1",
      domain: domain,
    });
    var localBad = snapLcdValue(Teach.checkLcdValue(row.eq, "1"));
    if (!jsonEqual(localBad, snapLcdValue(badVal))) {
      mismatches.push({ stage: 3, id: row.id + "-lcd-bad", local: localBad, server: snapLcdValue(badVal) });
    }
    var term = info.terms[0];
    var mulOk = await postDenom({
      intent: "lcd-mul",
      start: row.eq,
      history: [row.eq],
      typed: String(term.mulDisplay != null ? term.mulDisplay : term.mul),
      termIndex: 0,
      domain: domain,
      lcd: { lcd: info.lcd, phase: "muls" },
    });
    var localMul = Teach.checkLcdMultiplier(term, String(term.mulDisplay != null ? term.mulDisplay : term.mul));
    if (!!mulOk.ok !== !!localMul.ok) {
      mismatches.push({ stage: 3, id: row.id + "-mul-ok", local: localMul, server: mulOk });
    }
    var mulBad = await postDenom({
      intent: "lcd-mul",
      start: row.eq,
      history: [row.eq],
      typed: "99",
      termIndex: 0,
      domain: domain,
      lcd: { lcd: info.lcd, phase: "muls" },
    });
    var localMulBad = Teach.checkLcdMultiplier(term, "99");
    if (!!mulBad.ok !== !!localMulBad.ok) {
      mismatches.push({ stage: 3, id: row.id + "-mul-bad", local: localMulBad, server: mulBad });
    }
    var hats = await postDenom({
      intent: "lcd-one-step",
      start: row.eq,
      history: [row.eq],
      domain: domain,
    });
    if (!hats.ok || !hats.mark || String(hats.mark.lcd) !== String(info.lcd)) {
      mismatches.push({ stage: 3, id: row.id + "-lcd-one-step", server: hats });
    }
    var lcdHint = await postDenom({
      intent: "lcd-hint",
      start: row.eq,
      history: [row.eq],
      domain: domain,
      lcd: { phase: "ask" },
    });
    if (!lcdHint.hint) {
      mismatches.push({ stage: 3, id: row.id + "-lcd-hint", server: lcdHint });
    }
  }

  var noLcd = Teach.analyzeLcdNeed("x=40");
  var needNone = await postDenom({
    intent: "lcd-need",
    start: "x/5=8",
    history: ["x=40"],
    domain: { trail: [] },
  });
  if (!!needNone.lcd.needed !== !!noLcd) {
    mismatches.push({ stage: 3, id: "lcd-after-solved", local: !!noLcd, server: needNone.lcd });
  }

  return { count: eqs.length * 7 + 1, mismatches: mismatches };
}

async function runFullParity(engine) {
  var Algebra = engine.DoctematicaAlgebra;
  var Teach = engine.DoctematicaTeach;
  var mismatches = [];
  var count = 0;

  function add(id, ok, extra) {
    count += 1;
    if (!ok) mismatches.push(Object.assign({ stage: 4, id: id }, extra || {}));
  }

  var blocked = await postDenom({
    intent: "check",
    start: "8/x=2",
    history: ["8/x=2"],
    typed: "x=4",
    domain: { trail: [] },
  });
  add("gate-no-domain", blocked.errorId === "domain-required" && blocked.ok === false, { server: blocked });

  var fakeDone = await postDenom({
    intent: "check",
    start: "8/x=2",
    history: ["8/x=2"],
    typed: "x=4",
    domain: { done: true, trail: [] },
  });
  add("gate-ignore-client-done", fakeDone.errorId === "domain-required", { server: fakeDone });

  var fakeTrail = await postDenom({
    intent: "check",
    start: "8/x=2",
    history: ["8/x=2"],
    typed: "x=4",
    domain: { trail: [{ display: "x≠9" }] },
  });
  add("gate-bad-trail", fakeTrail.errorId === "domain-required", { server: fakeTrail });

  var walk1 = await postDenom({
    intent: "domain-check",
    start: "10/(x+2)=2",
    history: ["10/(x+2)=2"],
    typed: "x+2≠0",
    domain: { trail: [] },
  });
  add("walk-raw", walk1.ok && !walk1.done && walk1.phase === "raw", { server: walk1 });

  var walk2 = await postDenom({
    intent: "domain-check",
    start: "10/(x+2)=2",
    history: ["10/(x+2)=2"],
    typed: "x≠-2",
    domain: { trail: [{ display: walk1.display }] },
  });
  add("walk-domain-done", walk2.ok && walk2.done, { server: walk2 });

  var walk3 = await postDenom({
    intent: "check",
    start: "10/(x+2)=2",
    history: ["10/(x+2)=2"],
    typed: "10=2(x+2)",
    domain: { trail: [{ display: "x+2≠0" }, { display: "x≠-2" }] },
  });
  var local3 = snapshot(Algebra.checkStep("10/(x+2)=2", "10=2(x+2)"));
  add("walk-clear", snapsEqual(snapshot(walk3), local3) && walk3.ok, { local: local3, server: snapshot(walk3) });

  var walk4 = await postDenom({
    intent: "check",
    start: "10/(x+2)=2",
    history: ["10/(x+2)=2", "10=2(x+2)"],
    typed: "x=3",
    domain: { trail: [{ display: Teach.analyzeDomain("10/(x+2)=2").display }] },
  });
  add("walk-solved", walk4.ok && walk4.solved, { server: snapshot(walk4) });

  var constSkip = await postDenom({
    intent: "check",
    start: "x/5=8",
    history: ["x/5=8"],
    typed: "x=40",
    domain: { trail: [] },
  });
  add("no-domain-skip-final", constSkip.ok && constSkip.solved, { server: snapshot(constSkip) });

  var lcdWalk = Teach.analyzeLcdNeed("x/3+x/4=7");
  var lcdOk = await postDenom({
    intent: "lcd-value",
    start: "x/3+x/4=7",
    history: ["x/3+x/4=7"],
    typed: String(lcdWalk.lcd),
    domain: { trail: [] },
  });
  add("lcd-then-eq-value", lcdOk.ok, { server: snapLcdValue(lcdOk) });

  var afterLcd = await postDenom({
    intent: "check",
    start: "x/3+x/4=7",
    history: ["x/3+x/4=7"],
    typed: "x=12",
    domain: { trail: [] },
  });
  add("lcd-optional-skip-eq", afterLcd.ok && afterLcd.solved, { server: snapshot(afterLcd) });

  var hintDom = await postDenom({
    intent: "hint",
    start: "8/x=2",
    history: ["8/x=2"],
    domain: { trail: [] },
  });
  add("hint-blocked-without-domain", hintDom.errorId === "domain-required" || /תחום/.test(hintDom.hint || ""), {
    server: hintDom,
  });

  var sol = await postDenom({ intent: "solution", start: "8/x=2", history: ["8/x=2"] });
  add("solution-has-steps", sol.ok && sol.steps && sol.steps.length && String(sol.answer) === "4", { server: sol });

  var two = Teach.analyzeDomain("4/x=3/(x-2)");
  var twoA = await postDenom({
    intent: "domain-check",
    start: "4/x=3/(x-2)",
    history: ["4/x=3/(x-2)"],
    typed: "x≠0",
    domain: { split: true, activeBranch: 0, progressItems: [{ trail: [] }, { trail: [] }] },
  });
  add("two-branch-first", twoA.ok && !twoA.done, { server: snapDomain(twoA) });
  var twoB = await postDenom({
    intent: "domain-check",
    start: "4/x=3/(x-2)",
    history: ["4/x=3/(x-2)"],
    typed: "x≠2",
    domain: {
      split: true,
      activeBranch: 1,
      progressItems: twoA.progressItems,
    },
  });
  add("two-branch-done", twoB.ok && twoB.done && twoB.display === two.display, { server: snapDomain(twoB) });

  var eqAfterTwo = await postDenom({
    intent: "check",
    start: "4/x=3/(x-2)",
    history: ["4/x=3/(x-2)"],
    typed: "x=8",
    domain: { trail: [{ display: two.display }] },
  });
  add("two-branch-then-solve", eqAfterTwo.ok && eqAfterTwo.solved, { server: snapshot(eqAfterTwo) });

  return { count: count, mismatches: mismatches };
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
    console.log("equations/denom parity vs POST /api/equations");
    var s1check = await runCheckParity(engine);
    printStage("stage 1 check", s1check);
    if (s1check.mismatches.length) {
      process.exitCode = 1;
      return;
    }
    var s1tutor = await runTutorParity(engine);
    printStage("stage 1 hint/one-step/solution", s1tutor);
    if (s1tutor.mismatches.length) {
      process.exitCode = 1;
      return;
    }
    var s2 = await runDomainParity(engine);
    printStage("stage 2 domain", s2);
    if (s2.mismatches.length) {
      process.exitCode = 1;
      return;
    }
    var s3 = await runLcdParity(engine);
    printStage("stage 3 lcd", s3);
    if (s3.mismatches.length) {
      process.exitCode = 1;
      return;
    }
    var s4 = await runFullParity(engine);
    printStage("stage 4 full walks + gates", s4);
    if (s4.mismatches.length) {
      process.exitCode = 1;
      return;
    }
    console.log("no parity mismatches");
    console.log(
      "total: " +
        (s1check.count + s1tutor.count + s2.count + s3.count + s4.count)
    );
  } finally {
    finished = true;
    child.kill("SIGTERM");
  }
}

main().catch(function (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
