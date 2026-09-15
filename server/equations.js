"use strict";

function snapshotCheckStep(result) {
  result = result || {};
  return {
    ok: !!result.ok,
    solved: !!result.solved,
    same: !!result.same,
    errorId: result.errorId || null,
    message: String(result.message || ""),
  };
}

function lastEq(body) {
  body = body || {};
  if (Array.isArray(body.history) && body.history.length) {
    return String(body.history[body.history.length - 1] || "");
  }
  if (body.previous) return String(body.previous);
  return String(body.start || "");
}

function snapshotHint(act) {
  act = act || {};
  return {
    ok: true,
    done: !!act.done,
    hint: String(act.hint || ""),
    step: act.eq ? String(act.eq) : null,
  };
}

function snapshotSolution(path, domainSnap) {
  path = path || {};
  var steps = (path.steps || []).map(function (s) {
    s = s || {};
    return {
      eq: String(s.eq || ""),
      explain: String(s.explain || ""),
    };
  });
  var out = {
    ok: true,
    steps: steps,
    answer: String(path.answer || ""),
  };
  if (domainSnap && domainSnap.needed) out.domain = domainSnap;
  return out;
}

function trailText(entry) {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  return String(entry.display || "");
}

function snapshotDomainInfo(info) {
  if (!info) return { needed: false };
  return {
    needed: true,
    split: !!(info.items && info.items.length > 1),
    count: info.count || 0,
    densCount: info.densCount || 0,
    display: String(info.display || ""),
    rawDisplay: String(info.rawDisplay || ""),
    parts: (info.parts || []).map(String),
    rawParts: (info.rawParts || []).map(String),
    items: (info.items || []).map(function (it) {
      it = it || {};
      return {
        den: String(it.den || ""),
        rawPart: String(it.rawPart || ""),
        solvedPart: String(it.solvedPart || ""),
      };
    }),
  };
}

function snapshotProgressItems(items) {
  return (items || []).map(function (p) {
    p = p || {};
    return {
      phase: p.phase || null,
      display: p.display || null,
      itemIndex: p.itemIndex == null ? null : p.itemIndex,
      trail: (p.trail || []).map(function (t) {
        return { display: trailText(t) };
      }),
    };
  });
}

function snapshotDomainCheck(res) {
  res = res || {};
  var out = {
    ok: !!res.ok,
    done: !!res.done,
    skip: !!res.skip,
    partial: !!res.partial,
    same: !!res.same,
    phase: res.phase || null,
    display: res.display ? String(res.display) : null,
    message: String(res.message || ""),
    itemIndex: res.itemIndex == null ? null : res.itemIndex,
    nextBranch: res.nextBranch == null ? null : res.nextBranch,
    parts: res.parts ? res.parts.map(String) : null,
  };
  if (res.progressItems) out.progressItems = snapshotProgressItems(res.progressItems);
  if (res.info) out.domain = snapshotDomainInfo(res.info);
  return out;
}

function snapshotLcdInfo(info) {
  if (!info) return { needed: false };
  return {
    needed: true,
    lcd: info.lcd,
    algebraic: !!info.algebraic,
    leftTerms: (info.leftTerms || []).map(String),
    rightTerms: (info.rightTerms || []).map(String),
    dens: info.dens,
    terms: (info.terms || []).map(function (t) {
      t = t || {};
      return {
        text: String(t.text || ""),
        den: t.den,
        denExpr: t.denExpr != null ? String(t.denExpr) : undefined,
        mul: t.mul,
        mulDisplay: t.mulDisplay != null ? String(t.mulDisplay) : String(t.mul),
        side: t.side || null,
      };
    }),
  };
}

function snapshotLcdValue(res) {
  res = res || {};
  var out = {
    ok: !!res.ok,
    reduced: !!res.reduced,
    lcd: res.lcd != null ? res.lcd : null,
    message: String(res.message || ""),
  };
  if (res.info) out.lcdInfo = snapshotLcdInfo(res.info);
  return out;
}

function lcdMarkFromInfo(info) {
  var snap = snapshotLcdInfo(info);
  if (!snap.needed) return null;
  return {
    lcd: snap.lcd,
    muls: snap.terms.map(function (t) {
      return t.mulDisplay != null ? t.mulDisplay : t.mul;
    }),
    terms: snap.terms.map(function (t) {
      return {
        text: t.text,
        mul: t.mulDisplay != null ? t.mulDisplay : t.mul,
        den: t.den,
        side: t.side,
      };
    }),
    leftN: snap.leftTerms.length,
  };
}

function createEquationsHandler(engine) {
  var Algebra = engine.DoctematicaAlgebra;
  var Teach = engine.DoctematicaTeach;

  function domainStatus(start, domain) {
    var info = Teach.analyzeDomain(start);
    if (!info) return { needed: false, done: true };
    domain = domain || {};
    var i;
    var fullTrail = domain.trail || [];
    if (fullTrail.length) {
      var opts = { started: false };
      if (info.items && info.items[0]) opts.previous = info.items[0].rawPart;
      var last = { ok: false, done: false };
      for (i = 0; i < fullTrail.length; i++) {
        last = Teach.checkDomain(start, trailText(fullTrail[i]), opts);
        if (!last.ok) break;
        opts.started = true;
        opts.previous = last.display;
        if (last.done) return { needed: true, done: true };
      }
    }
    if (info.items && info.items.length > 1) {
      var progress = {
        items: [],
        split: domain.split !== false,
        activeBranch: 0,
      };
      var branches = domain.progressItems || [];
      var b;
      for (b = 0; b < branches.length; b++) {
        var p = branches[b] || {};
        var tr = p.trail || [];
        progress.activeBranch = b;
        var t;
        for (t = 0; t < tr.length; t++) {
          var res = Teach.checkDomainProgress(start, trailText(tr[t]), progress, {});
          if (!res.ok) return { needed: true, done: false };
          if (res.progressItems) progress.items = res.progressItems;
          if (res.nextBranch != null && res.nextBranch >= 0) progress.activeBranch = res.nextBranch;
          if (res.done) return { needed: true, done: true };
        }
      }
    }
    return { needed: true, done: false };
  }

  function requireDomain(body) {
    if (String(body.subtopic || "basic") !== "denom") return null;
    var start = String(body.start || lastEq(body) || "");
    var st = domainStatus(start, body.domain);
    if (st.needed && !st.done) {
      return {
        ok: false,
        solved: false,
        same: false,
        errorId: "domain-required",
        message: "קודם רשמו את תחום ההצבה.",
      };
    }
    return null;
  }

  function attachLcdOffer(eqText, extra) {
    extra = extra || {};
    extra.lcd = snapshotLcdInfo(Teach.analyzeLcdNeed(eqText));
    return extra;
  }

  function handleCheck(body) {
    var blocked = requireDomain(body);
    if (blocked) return blocked;
    var previous = lastEq(body);
    var typed = String((body && body.typed) || "");
    return attachLcdOffer(typed || previous, snapshotCheckStep(Algebra.checkStep(previous, typed)));
  }

  function handleHint(body) {
    var blocked = requireDomain(body);
    if (blocked) {
      return { ok: true, done: false, hint: blocked.message, step: null, errorId: blocked.errorId };
    }
    var act = Teach.nextAction(lastEq(body));
    return snapshotHint(act);
  }

  function handleOneStep(body) {
    var blocked = requireDomain(body);
    if (blocked) return blocked;
    var cur = lastEq(body);
    if (body.lcdMarks) {
      var cleared = typeof Teach.clearEqDens === "function" ? Teach.clearEqDens(cur) : null;
      if (cleared) {
        var clearCheck = snapshotCheckStep(Algebra.checkStep(cur, cleared));
        clearCheck.done = false;
        clearCheck.hint = "כפלו כל איבר במכפיל והורידו את המכנים.";
        clearCheck.step = String(cleared);
        return attachLcdOffer(cleared, clearCheck);
      }
    }
    var act = Teach.nextAction(cur);
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
    var check = snapshotCheckStep(Algebra.checkStep(cur, act.eq));
    check.done = false;
    check.hint = String(act.hint || "");
    check.step = String(act.eq);
    return attachLcdOffer(act.eq, check);
  }

  function handleSolution(body) {
    var start = String((body && body.start) || lastEq(body) || "");
    return snapshotSolution(Teach.fullPath(start), snapshotDomainInfo(Teach.analyzeDomain(start)));
  }

  function handleSetup(body) {
    var start = String((body && body.start) || lastEq(body) || "");
    return {
      ok: true,
      domain: snapshotDomainInfo(Teach.analyzeDomain(start)),
      lcd: snapshotLcdInfo(Teach.analyzeLcdNeed(start)),
    };
  }

  function handleDomainCheck(body) {
    var start = String((body && body.start) || lastEq(body) || "");
    var typed = String((body && body.typed) || "");
    var domain = body.domain || {};
    var info = Teach.analyzeDomain(start);
    if (!info) {
      return snapshotDomainCheck({ ok: true, skip: true, done: true, message: "אין תחום הצבה מיוחד (אין נעלם במכנה)." });
    }
    var res;
    if (info.items && info.items.length > 1) {
      res = Teach.checkDomainProgress(
        start,
        typed,
        {
          items: snapshotProgressItems(domain.progressItems || []),
          split: domain.split !== false,
          activeBranch: domain.activeBranch || 0,
        },
        {}
      );
    } else {
      var trail = domain.trail || [];
      res = Teach.checkDomain(start, typed, {
        previous: trail.length
          ? trailText(trail[trail.length - 1])
          : (info.items[0] && info.items[0].rawPart) || info.rawDisplay,
        started: trail.length > 0,
      });
    }
    return snapshotDomainCheck(res);
  }

  function currentDomainConstraint(start, domain) {
    var info = Teach.analyzeDomain(start);
    if (!info) return "";
    domain = domain || {};
    if (info.items && info.items.length > 1) {
      var idx = domain.activeBranch || 0;
      var prog = (domain.progressItems || [])[idx];
      if (prog && prog.trail && prog.trail.length) return trailText(prog.trail[prog.trail.length - 1]);
      var item = info.items[idx] || info.items[0];
      return item ? item.rawPart : info.rawDisplay;
    }
    var trail = domain.trail || [];
    if (trail.length) return trailText(trail[trail.length - 1]);
    return (info.items[0] && info.items[0].rawPart) || info.rawDisplay;
  }

  function domainStarted(start, domain) {
    var info = Teach.analyzeDomain(start);
    domain = domain || {};
    if (!info) return false;
    if (info.items && info.items.length > 1) {
      var idx = domain.activeBranch || 0;
      var prog = (domain.progressItems || [])[idx];
      return !!(prog && prog.trail && prog.trail.length);
    }
    return !!(domain.trail && domain.trail.length);
  }

  function handleDomainHint(body) {
    var start = String((body && body.start) || lastEq(body) || "");
    var info = Teach.analyzeDomain(start);
    if (!info) {
      return { ok: true, done: true, hint: "אין תחום הצבה מיוחד.", step: null };
    }
    var domain = body.domain || {};
    if (!domainStarted(start, domain)) {
      var hint =
        info.items && info.items.length > 1
          ? "רשמו באחד התאים מכנה≠0 או x≠… — איזה מכנה שתרצו. התא השני יהיה למכנה שנשאר."
          : "רשמו תחום הצבה, למשל " + info.rawDisplay + " או " + info.display + ".";
      return { ok: true, done: false, hint: hint, step: null };
    }
    var nxt = Teach.domainNextStep(currentDomainConstraint(start, domain));
    return {
      ok: true,
      done: !!nxt.done,
      hint: String(nxt.hint || nxt.display || ""),
      step: nxt.display ? String(nxt.display) : null,
    };
  }

  function handleDomainOneStep(body) {
    var start = String((body && body.start) || lastEq(body) || "");
    var info = Teach.analyzeDomain(start);
    if (!info) {
      return snapshotDomainCheck({ ok: true, skip: true, done: true, message: "אין תחום הצבה מיוחד." });
    }
    var domain = body.domain || {};
    var typed;
    if (!domainStarted(start, domain)) {
      if (info.items && info.items.length > 1) {
        var idx = domain.activeBranch || 0;
        var taken = {};
        (domain.progressItems || []).forEach(function (p, i) {
          if (i === idx) return;
          if (p && p.itemIndex != null) taken[p.itemIndex] = true;
        });
        var pick = info.items[idx] || info.items[0];
        var u;
        for (u = 0; u < info.items.length; u++) {
          if (!taken[u]) {
            pick = info.items[u];
            break;
          }
        }
        typed = pick.rawPart;
      } else {
        typed = (info.items[0] && info.items[0].rawPart) || info.rawDisplay;
      }
    } else {
      typed = Teach.domainNextStep(currentDomainConstraint(start, domain)).display;
    }
    body.typed = typed;
    var checked = handleDomainCheck(body);
    checked.step = typed;
    return checked;
  }

  function handleDomainReveal(body) {
    var start = String((body && body.start) || lastEq(body) || "");
    var info = Teach.analyzeDomain(start);
    if (!info) {
      return snapshotDomainCheck({ ok: true, skip: true, done: true, message: "אין תחום הצבה מיוחד." });
    }
    var progressItems = (info.items || []).map(function (it, i) {
      return {
        phase: "solved",
        display: it.solvedPart,
        itemIndex: i,
        trail: [{ display: it.solvedPart }],
      };
    });
    return snapshotDomainCheck({
      ok: true,
      done: true,
      phase: "solved",
      display: info.display,
      parts: info.parts,
      info: info,
      progressItems: progressItems,
      message: "תחום הצבה: " + info.display + ".",
    });
  }

  function handleLcdNeed(body) {
    var blocked = requireDomain(body);
    if (blocked) return { ok: true, needed: false, lcd: { needed: false }, errorId: blocked.errorId };
    return { ok: true, lcd: snapshotLcdInfo(Teach.analyzeLcdNeed(lastEq(body))) };
  }

  function handleLcdStart(body) {
    var blocked = requireDomain(body);
    if (blocked) return blocked;
    var info = Teach.analyzeLcdNeed(lastEq(body));
    if (!info) {
      return { ok: false, message: "כרגע אין צורך במכנה משותף.", lcd: { needed: false } };
    }
    return { ok: true, phase: "ask", lcd: snapshotLcdInfo(info), message: "רשמו את המכנה המשותף המצומצם ביותר." };
  }

  function handleLcdValue(body) {
    var blocked = requireDomain(body);
    if (blocked) return blocked;
    return snapshotLcdValue(Teach.checkLcdValue(lastEq(body), String((body && body.typed) || "")));
  }

  function handleLcdMul(body) {
    var blocked = requireDomain(body);
    if (blocked) return blocked;
    var info = Teach.analyzeLcdNeed(lastEq(body));
    if (!info) return { ok: false, message: "כרגע אין צורך במכנה משותף." };
    var lcdTyped = body.lcd && body.lcd.lcd != null ? String(body.lcd.lcd) : "";
    if (lcdTyped) {
      var lcdCheck = Teach.checkLcdValue(lastEq(body), lcdTyped);
      if (!lcdCheck.ok) return snapshotLcdValue(lcdCheck);
    }
    var idx = Number(body.termIndex);
    var term = info.terms && info.terms[idx];
    if (!term) return { ok: false, message: "איבר לא ידוע." };
    var mulRes = Teach.checkLcdMultiplier(term, String((body && body.typed) || ""));
    return {
      ok: !!mulRes.ok,
      message: String(mulRes.message || ""),
      termIndex: idx,
      mulDisplay: term.mulDisplay != null ? String(term.mulDisplay) : String(term.mul),
    };
  }

  function handleLcdOneStep(body) {
    var blocked = requireDomain(body);
    if (blocked) return blocked;
    var info = Teach.analyzeLcdNeed(lastEq(body));
    if (!info) return { ok: false, message: "כרגע אין צורך במכנה משותף.", lcd: { needed: false } };
    var mark = lcdMarkFromInfo(info);
    return {
      ok: true,
      lcd: snapshotLcdInfo(info),
      mark: mark,
      message: "מכנה משותף " + info.lcd + " — המכפילים מעל כל איבר.",
    };
  }

  function handleLcdHint(body) {
    var blocked = requireDomain(body);
    if (blocked) return { ok: true, done: false, hint: blocked.message, step: null };
    var phase = body.lcd && body.lcd.phase;
    var info = Teach.analyzeLcdNeed(lastEq(body));
    if (!info) return { ok: true, done: true, hint: "אין צורך במכנה משותף כרגע.", step: null };
    if (phase === "muls") {
      return { ok: true, done: false, hint: "המכפיל = המכנה המשותף חלקי המכנה של האיבר.", step: null };
    }
    return {
      ok: true,
      done: false,
      hint: "רשמו את המכנה המשותף המצומצם ביותר, ואז מעל כל איבר — בכמה מכפילים.",
      step: null,
    };
  }

  function handle(body) {
    body = body || {};
    var topic = String(body.topic || "equations");
    var subtopic = String(body.subtopic || "basic");
    if (topic !== "equations") {
      return { error: "unknown topic", message: "unknown topic" };
    }
    if (subtopic !== "basic" && subtopic !== "denom") {
      return { error: "unknown subtopic", message: "unknown subtopic" };
    }
    var intent = String(body.intent || "");
    if (intent === "setup") return handleSetup(body);
    if (intent === "check") return handleCheck(body);
    if (intent === "hint") return handleHint(body);
    if (intent === "one-step") return handleOneStep(body);
    if (intent === "solution") return handleSolution(body);
    if (subtopic === "denom") {
      if (intent === "domain-check") return handleDomainCheck(body);
      if (intent === "domain-hint") return handleDomainHint(body);
      if (intent === "domain-one-step") return handleDomainOneStep(body);
      if (intent === "domain-reveal") return handleDomainReveal(body);
      if (intent === "lcd-need") return handleLcdNeed(body);
      if (intent === "lcd-start") return handleLcdStart(body);
      if (intent === "lcd-value") return handleLcdValue(body);
      if (intent === "lcd-mul") return handleLcdMul(body);
      if (intent === "lcd-one-step") return handleLcdOneStep(body);
      if (intent === "lcd-hint") return handleLcdHint(body);
    }
    return { error: "unknown intent", message: "unknown intent" };
  }

  return {
    handle: handle,
    handleCheck: function (body) {
      return handleCheck(body || {});
    },
    domainStatus: domainStatus,
    snapshotCheckStep: snapshotCheckStep,
    snapshotDomainCheck: snapshotDomainCheck,
    snapshotLcdValue: snapshotLcdValue,
    snapshotLcdInfo: snapshotLcdInfo,
  };
}

module.exports = {
  createEquationsHandler: createEquationsHandler,
  snapshotCheckStep: snapshotCheckStep,
  snapshotHint: snapshotHint,
  snapshotSolution: snapshotSolution,
};
