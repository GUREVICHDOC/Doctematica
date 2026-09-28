"use strict";

var teach = require("./systems-teach");
var createSystemsHandler = require("./systems").createSystemsHandler;
var createElimHandler = require("./systems-elim").createElimHandler;

function normLine(s) {
  return String(s || "")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
}

function cleanLine(s) {
  return String(s || "").trim().replace(/[−–—]/g, "-");
}

function splitAtMethod(history) {
  var hist = Array.isArray(history) ? history.map(String) : [];
  var i;
  for (i = 0; i < hist.length; i++) {
    if (hist[i].indexOf("method:") === 0) {
      return { before: hist.slice(0, i), method: hist[i].slice(7), after: hist.slice(i + 1) };
    }
  }
  return { before: hist, method: "", after: [] };
}

function knownOf(Sys, eq) {
  var known = {};
  var i;
  for (i = 0; i < 2; i++) {
    var status = Sys.equationStatus(eq[i]);
    if (status.kind === "value" && (status.v === "x" || status.v === "y")) known[status.v] = status.value;
  }
  return known;
}

function bothReady(Sys, eq) {
  return Sys.equationStatus(eq[0]).ready && Sys.equationStatus(eq[1]).ready;
}

function preferMethod(Sys, eq1, eq2) {
  var a = Sys.equationStatus(eq1);
  var b = Sys.equationStatus(eq2);
  if (a.kind === "value" || b.kind === "value" || a.kind === "isolated" || b.kind === "isolated") return "sub";
  if (Sys.bestElimOp(eq1, eq2)) return "elim";
  var iso = Sys.bestIsolateChoice(eq1, eq2);
  if (iso && Math.abs(Number(iso.absA) - 1) < 1e-8) return "sub";
  return "elim";
}

function methodNote(Sys, eq1, eq2) {
  var a = Sys.equationStatus(eq1);
  var b = Sys.equationStatus(eq2);
  var valued = a.kind === "value" ? a : b.kind === "value" ? b : null;
  if (valued) return "שתי השיטות אפשריות. שיטת ההצבה נוחה כאן משום שכבר מצאתם את " + valued.v + ".";
  var isolated = a.kind === "isolated" ? a : b.kind === "isolated" ? b : null;
  if (isolated) return "שתי השיטות אפשריות. שיטת ההצבה עשויה להיות קצרה יותר משום ש־" + isolated.v + " כבר מבודד.";
  if (Sys.bestElimOp(eq1, eq2)) return "שתי השיטות אפשריות. השוואת מקדמים נוחה כאן כי אפשר לבטל משתנה בלי להכפיל.";
  return "שתי השיטות אפשריות.";
}

function replay(Sys, eq1, eq2, before) {
  var eq = [String(eq1 || ""), String(eq2 || "")];
  var i;
  for (i = 0; i < before.length; i++) {
    var line = String(before[i]);
    if (line.indexOf("sys:") !== 0) return { error: "צעד לא מוכר בשלב הסידור." };
    var bits = line.slice(4).split("|");
    var chk = checkPair(Sys, eq[0], eq[1], bits[0] || "", bits[1] || "");
    if (!chk.ok) return { error: chk.message || "צעד הסידור לא שוחזר." };
    eq = [chk.eq1, chk.eq2];
  }
  return { eq: eq };
}

function signFlipMessage(Sys, curText, nextText) {
  var cur;
  var next;
  try {
    cur = Sys.parseEquation(curText);
    next = Sys.parseEquation(nextText);
  } catch (err) {
    return "";
  }
  function diffs(a, b) {
    var out = [];
    ["x", "y", "k"].forEach(function (key) {
      if (Math.abs(a[key] - b[key]) > 1e-8) out.push(key);
    });
    return out;
  }
  var left = diffs(cur.left, next.left);
  var right = diffs(cur.right, next.right);
  var sideName = "";
  var key = "";
  var src = null;
  var dst = null;
  if (!left.length && right.length === 1) {
    sideName = "ימין";
    key = right[0];
    src = cur.right;
    dst = next.right;
  } else if (!right.length && left.length === 1) {
    sideName = "שמאל";
    key = left[0];
    src = cur.left;
    dst = next.left;
  } else return "";
  if (!(Math.abs(dst[key] + src[key]) < 1e-8) || Math.abs(src[key]) < 1e-8) return "";
  var what = key === "x" ? "x" : key === "y" ? "y" : "המספר";
  return "בהעברת האיבר צריך להחליף סימן. המקדם של " + what + " באגף " + sideName + " רק החליף סימן, בלי לעבור אגף.";
}

function checkPair(Sys, cur1, cur2, next1, next2) {
  var cur = [cur1, cur2];
  var next = [cleanLine(next1), cleanLine(next2)];
  if (!next[0] || !next[1]) return { ok: false, message: "כתבו את שתי המשוואות. משוואה שלא השתנתה מעתיקים כמו שהיא." };
  var notes = [];
  var out = ["", ""];
  var changed = false;
  var i;
  for (i = 0; i < 2; i++) {
    if (normLine(cur[i]) === normLine(next[i])) {
      out[i] = cur[i];
      continue;
    }
    changed = true;
    var res = Sys.checkWorkStep(cur[i], next[i]);
    if (!res || !res.ok) {
      var denomWhy = Sys.denomMiss ? Sys.denomMiss(cur[i], next[i]) : "";
      var flipped = denomWhy || (res && res.errorId === "distribute" ? "" : signFlipMessage(Sys, cur[i], next[i]));
      return { ok: false, message: "במשוואה " + (i + 1) + ": " + (flipped || (res && res.message) || "הצעד לא חוקי.") };
    }
    out[i] = next[i];
    var before = Sys.equationStatus(cur[i]);
    var lcdNote = Sys.lcdNote ? Sys.lcdNote(cur[i], next[i]) : "";
    if (lcdNote) notes.push(lcdNote);
    if (before.ready) notes.push("משוואה " + (i + 1) + " כבר הייתה מסודרת; לא היה צורך לשנות אותה.");
    else if (Sys.writtenNeedsCombine(cur[i]) && !Sys.equationStatus(next[i]).ready) {
      var site = teach.arrangeStep(Sys, cur[i]);
      if (!site || !site.eq || normLine(site.eq) !== normLine(next[i])) {
        notes.push("הצעד נכון. אפשר היה לכנס קודם איברים דומים ולקצר את הדרך.");
      }
    }
  }
  if (!changed) return { ok: false, message: "זו אותה מערכת. סדרו משוואה שעדיין לא בצורה מוכנה." };
  return { ok: true, eq1: out[0], eq2: out[1], note: notes.join(" ") };
}

function hintFor(Sys, eq) {
  var ready = [Sys.equationStatus(eq[0]), Sys.equationStatus(eq[1])];
  if (ready[0].ready && ready[1].ready) return "שתי המשוואות מוכנות. בחרו שיטת פתרון. " + methodNote(Sys, eq[0], eq[1]);
  var bits = [];
  var open = [];
  var i;
  for (i = 0; i < 2; i++) {
    if (ready[i].kind === "value") {
      bits.push("כבר מצאתם ש־" + ready[i].v + " = " + Sys.fmt(ready[i].value) + ". אין צורך לסדר את המשוואה הזו מחדש; נשמור את הערך להמשך.");
    } else if (ready[i].ready) {
      bits.push("משוואה " + (i + 1) + " כבר מסודרת.");
    } else {
      open.push(i);
    }
  }
  if (open.length === 1 && bits.length) bits.push("כעת סדרו את משוואה " + (open[0] + 1) + ".");
  for (i = 0; i < open.length; i++) {
    var idx = open[i];
    var step = teach.arrangeStep(Sys, eq[idx]);
    var prefix = open.length > 1 ? "משוואה " + (idx + 1) + ": " : "";
    if (step && step.hint) bits.push(prefix + step.hint);
    else if (step && step.error) bits.push(prefix + step.error);
  }
  return bits.join(" ");
}

function arrangeView(Sys, eq, extra) {
  extra = extra || {};
  var ready = bothReady(Sys, eq);
  var prompt = ready
    ? "באיזו שיטה תרצו לפתור? " + methodNote(Sys, eq[0], eq[1])
    : "סדרו כל משוואה לצורה ax+by=c, או לבידוד של משתנה. משוואה שלא משנים מעתיקים כמו שהיא.";
  return {
    ok: extra.ok != null ? !!extra.ok : true,
    phase: ready ? "choose_method" : "normalize",
    prompt: prompt,
    buttons: ready
      ? [
          { label: "שיטת ההצבה", choice: { kind: "method", method: "sub" } },
          { label: "שיטת השוואת מקדמים", choice: { kind: "method", method: "elim" } },
        ]
      : [],
    input: false,
    arrange: {
      eq1: eq[0],
      eq2: eq[1],
      open: [!Sys.equationStatus(eq[0]).ready, !Sys.equationStatus(eq[1]).ready],
      lcd: [Sys.lcdPack ? Sys.lcdPack(eq[0]) : null, Sys.lcdPack ? Sys.lcdPack(eq[1]) : null],
    },
    known: knownOf(Sys, eq),
    needSub: false,
    solved: false,
    message: extra.message || "",
    note: extra.note || "",
    applied: extra.applied,
    choice: extra.choice || null,
    historyMark: extra.historyMark || "",
    reason: extra.reason || "",
  };
}

function childHandle(systems, elim, method, body, eq, after, intent) {
  var handler = method === "elim" ? elim : systems;
  var next = {
    topic: method === "elim" ? "systems-elim" : "systems-sub",
    intent: intent,
    eq1: eq[0],
    eq2: eq[1],
    history: after,
    choices: body.choices || [],
    typed: body.typed,
    choice: body.choice,
    confirm: body.confirm,
    scale: body.scale,
  };
  return handler.handle(next);
}

function sameEqText(a, b) {
  return String(a || "").replace(/\s+/g, "") === String(b || "").replace(/\s+/g, "");
}

function hatsOf(Sys, before, after) {
  if (!Sys.lcdPack || !Sys.numericDenomStep) return null;
  var pack = Sys.lcdPack(before);
  if (!pack || !pack.terms || !pack.terms.length) return null;
  var step = Sys.numericDenomStep(before);
  if (!step || !step.eq || !sameEqText(step.eq, after)) return null;
  return {
    lcd: pack.lcd,
    leftN: pack.leftN,
    terms: pack.terms.map(function (t) {
      return { text: t.text, den: t.den, mul: t.mul, side: t.side };
    }),
    muls: pack.terms.map(function (t) {
      return t.mul;
    }),
  };
}

function nextArrangeAction(Sys, eq) {
  if (!bothReady(Sys, eq)) {
    var next = eq.slice();
    var reasons = [];
    var hats = [null, null];
    var i;
    for (i = 0; i < 2; i++) {
      if (Sys.equationStatus(eq[i]).ready) continue;
      var step = teach.arrangeStep(Sys, eq[i]);
      if (!step || step.already) continue;
      if (step.error || !step.eq) return step || { error: "אין צעד סידור." };
      next[i] = step.eq;
      hats[i] = hatsOf(Sys, eq[i], step.eq);
      reasons.push("משוואה " + (i + 1) + ": " + (step.reason || ""));
    }
    if (!reasons.length) return { error: "אין צעד סידור." };
    return {
      token: "sys:" + next[0] + "|" + next[1],
      reason: reasons.join(" "),
      hint: hintFor(Sys, eq),
      lcdHats: hats[0] || hats[1] ? hats : null,
    };
  }
  var method = preferMethod(Sys, eq[0], eq[1]);
  var why = methodNote(Sys, eq[0], eq[1]);
  return {
    token: "method:" + method,
    reason: method === "sub" ? "נמשיך בשיטת ההצבה. " + why : "נמשיך בהשוואת מקדמים. " + why,
    hint: "באיזו שיטה תרצו לפתור? " + why,
  };
}

function createArrangeHandler(engine) {
  var systems = createSystemsHandler(engine);
  var elim = createElimHandler(engine);

  function context(body) {
    var Sys = engine.DoctematicaSystems;
    var pair = { eq1: String((body && body.eq1) || ""), eq2: String((body && body.eq2) || "") };
    var split = splitAtMethod(body && body.history);
    if (split.method && split.method !== "sub" && split.method !== "elim") return { error: "שיטה לא מוכרת." };
    var played = replay(Sys, pair.eq1, pair.eq2, split.before);
    if (played.error) return { error: played.error };
    return { Sys: Sys, pair: pair, eq: played.eq, split: split, body: body || {} };
  }

  function handleSetup(body) {
    var ctx = context(body);
    if (ctx.error) return { ok: false, message: ctx.error };
    if (ctx.split.method) return childHandle(systems, elim, ctx.split.method, ctx.body, ctx.eq, ctx.split.after, "setup");
    return arrangeView(ctx.Sys, ctx.eq, { ok: true });
  }

  function termsForLcd(pack, lcd) {
    return (pack.terms || []).map(function (t) {
      return { text: t.text, den: t.den, mul: lcd / t.den, side: t.side };
    });
  }

  function handleLcdToken(Teach, eq, typed) {
    var value = String(typed).match(/^lcdv:([01]):(.+)$/);
    if (value) {
      var idx = Number(value[1]);
      var pack = eq && Teach.analyzeLcdNeed(eq[idx]);
      if (!pack || pack.algebraic) return { ok: false, lcdAssist: true, message: "במשוואה " + (idx + 1) + " אין צורך במכנה משותף." };
      var res = Teach.checkLcdValue(eq[idx], value[2]);
      if (!res.ok && res.reduced) {
        var got = parseInt(String(value[2]).replace(/\s+/g, ""), 10);
        return {
          ok: true,
          lcdAssist: true,
          phase: "muls",
          index: idx,
          lcd: got,
          note: "הצעד נכון. היה אפשר להשתמש במכנה המשותף הקטן יותר, " + res.lcd + ", ולקבל מספרים פשוטים יותר.",
          message: "עכשיו רשמו מעל כל איבר בכמה מכפילים.",
          terms: termsForLcd(pack, got),
          leftN: pack.leftTerms.length,
        };
      }
      if (!res.ok) return { ok: false, lcdAssist: true, message: res.message };
      return {
        ok: true,
        lcdAssist: true,
        phase: "muls",
        index: idx,
        lcd: res.lcd,
        message: res.message,
        terms: termsForLcd(pack, res.lcd),
        leftN: pack.leftTerms.length,
      };
    }
    var muls = String(typed).match(/^lcdm:([01]):(\d+):(.+)$/);
    if (!muls) return null;
    var mIdx = Number(muls[1]);
    var lcd = parseInt(muls[2], 10);
    var packM = Teach.analyzeLcdNeed(eq[mIdx]);
    if (!packM || packM.algebraic) return { ok: false, lcdAssist: true, message: "במשוואה " + (mIdx + 1) + " אין צורך במכנה משותף." };
    var typedMuls = muls[3].split(",");
    var ti;
    for (ti = 0; ti < packM.terms.length; ti++) {
      var want = lcd / packM.terms[ti].den;
      var chk = Teach.checkLcdMultiplier({ mul: want, mulDisplay: String(want) }, typedMuls[ti] || "");
      if (!chk.ok) {
        return {
          ok: false,
          lcdAssist: true,
          message: "במשוואה " + (mIdx + 1) + ", האיבר " + String(packM.terms[ti].text).replace(/-/g, "−") + ": " + chk.message,
        };
      }
    }
    return {
      ok: true,
      lcdAssist: true,
      phase: "write",
      index: mIdx,
      lcd: lcd,
      message: "המכפילים נכונים. עכשיו כתבו את המשוואה אחרי הכפל. אפשר גם לדלג ולכתוב אותה ישר.",
    };
  }

  function handleCheck(body) {
    var ctx = context(body);
    if (ctx.error) return { ok: false, message: ctx.error };
    if (ctx.split.method) return childHandle(systems, elim, ctx.split.method, ctx.body, ctx.eq, ctx.split.after, "check");
    var typed = String((body && body.typed) || "");
    if (typed.indexOf("lcdv:") === 0 || typed.indexOf("lcdm:") === 0) {
      return handleLcdToken(engine.DoctematicaTeach, ctx.eq, typed);
    }
    if (typed.indexOf("sys:") !== 0) return { ok: false, message: "כתבו את שתי המשוואות של המערכת." };
    var bits = typed.slice(4).split("|");
    var chk = checkPair(ctx.Sys, ctx.eq[0], ctx.eq[1], bits[0] || "", bits[1] || "");
    if (!chk.ok) return { ok: false, message: chk.message, phase: bothReady(ctx.Sys, ctx.eq) ? "choose_method" : "normalize" };
    var eq = [chk.eq1, chk.eq2];
    var ready = bothReady(ctx.Sys, eq);
    var view = arrangeView(ctx.Sys, eq, {
      ok: true,
      message: ready ? "שתי המשוואות מוכנות. בחרו שיטת פתרון." : "המערכת נשמרה. המשיכו לסדר את המשוואה שעדיין לא מוכנה.",
      note: chk.note || (ready ? methodNote(ctx.Sys, eq[0], eq[1]) : ""),
    });
    return view;
  }

  function handleChoice(body) {
    var ctx = context(body);
    if (ctx.error) return { ok: false, message: ctx.error };
    if (ctx.split.method) return childHandle(systems, elim, ctx.split.method, ctx.body, ctx.eq, ctx.split.after, "choice");
    var choice = (body && body.choice) || {};
    if (!bothReady(ctx.Sys, ctx.eq) || choice.kind !== "method") {
      return { ok: false, message: "קודם מביאים את שתי המשוואות לצורה שאפשר לפתור ממנה." };
    }
    var method = choice.method === "elim" ? "elim" : choice.method === "sub" ? "sub" : "";
    if (!method) return { ok: false, message: "בחרו שיטת הצבה או השוואת מקדמים." };
    var child = childHandle(systems, elim, method, { history: [], choices: [] }, ctx.eq, [], "setup");
    child.ok = true;
    child.applied = true;
    child.historyMark = "method:" + method;
    child.reason = method === "sub" ? "נמשיך בשיטת ההצבה." : "נמשיך בהשוואת מקדמים.";
    child.choice = null;
    return child;
  }

  function handleHint(body) {
    var ctx = context(body);
    if (ctx.error) return { ok: false, message: ctx.error };
    if (ctx.split.method) return childHandle(systems, elim, ctx.split.method, ctx.body, ctx.eq, ctx.split.after, "hint");
    return { ok: true, hint: hintFor(ctx.Sys, ctx.eq), phase: bothReady(ctx.Sys, ctx.eq) ? "choose_method" : "normalize" };
  }

  function handleOneStep(body) {
    var ctx = context(body);
    if (ctx.error) return { ok: false, message: ctx.error };
    if (ctx.split.method) return childHandle(systems, elim, ctx.split.method, ctx.body, ctx.eq, ctx.split.after, "one-step");
    var action = nextArrangeAction(ctx.Sys, ctx.eq);
    if (!action || action.error || !action.token) return { ok: false, message: (action && action.error) || "אין צעד המשך." };
    if (action.token.indexOf("method:") === 0) {
      var method = action.token.slice(7);
      var child = childHandle(systems, elim, method, { history: [], choices: [] }, ctx.eq, [], "setup");
      child.ok = true;
      child.step = action.token;
      child.reason = action.reason || "";
      child.hint = action.hint || "";
      child.done = false;
      return child;
    }
    var bits = action.token.slice(4).split("|");
    var chk = checkPair(ctx.Sys, ctx.eq[0], ctx.eq[1], bits[0] || "", bits[1] || "");
    if (!chk.ok) return { ok: false, message: chk.message, eq: action.token };
    var view = arrangeView(ctx.Sys, [chk.eq1, chk.eq2], { ok: true, message: action.reason || "", note: chk.note || "" });
    view.step = "sys:" + chk.eq1 + "|" + chk.eq2;
    view.reason = action.reason || "";
    view.hint = action.hint || "";
    view.done = false;
    if (action.lcdHats) view.lcdHats = action.lcdHats;
    return view;
  }

  function handleSolution(body) {
    var hist = Array.isArray(body.history) ? body.history.map(String) : [];
    var steps = [];
    var guard = 0;
    while (guard < 80) {
      guard += 1;
      if (splitAtMethod(hist).method) break;
      var remote = handleOneStep({ eq1: body.eq1, eq2: body.eq2, history: hist, choices: [] });
      if (!remote || remote.ok === false) return remote || { ok: false, message: "הפתרון נעצר." };
      if (!remote.step) break;
      steps.push({ eq: remote.step, reason: remote.reason || "", lcdHats: remote.lcdHats || null });
      hist = hist.concat([remote.step]);
    }
    var split = splitAtMethod(hist);
    if (!split.method) return { ok: false, message: "הסידור לא הושלם." };
    var ctx = context({ eq1: body.eq1, eq2: body.eq2, history: hist });
    if (ctx.error) return { ok: false, message: ctx.error };
    var rest = childHandle(systems, elim, split.method, { history: [], choices: [] }, ctx.eq, [], "solution");
    if (!rest || rest.ok === false) return rest || { ok: false, message: "פתרון השיטה נעצר." };
    return {
      ok: true,
      kind: rest.kind || null,
      answer: rest.answer || "",
      steps: steps.concat(rest.steps || []),
      solved: !!rest.solved,
      explain: "קודם מסדרים את שתי המשוואות, בוחרים שיטת הצבה או השוואת מקדמים, וממשיכים בשיטה שנבחרה.",
    };
  }

  function handle(body) {
    body = body || {};
    if (String(body.topic || "") !== "systems-arrange") return { error: "unknown topic", message: "unknown topic" };
    var intent = String(body.intent || "");
    if (intent === "setup") return handleSetup(body);
    if (intent === "check") return handleCheck(body);
    if (intent === "choice") return handleChoice(body);
    if (intent === "hint") return handleHint(body);
    if (intent === "one-step") return handleOneStep(body);
    if (intent === "solution") return handleSolution(body);
    return { error: "unknown intent", message: "unknown intent" };
  }

  return { handle: handle, preferMethod: function (eq1, eq2) { return preferMethod(engine.DoctematicaSystems, eq1, eq2); } };
}

module.exports = {
  createArrangeHandler: createArrangeHandler,
};
