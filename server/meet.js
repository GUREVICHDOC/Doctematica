"use strict";

var createQuadSystemsHandler = require("./systems-quad").createQuadSystemsHandler;
var teachApi = require("./systems-teach");

var MEET_SWAP = "בזוג סדור רושמים תחילה את שיעור ה־x ולאחר מכן את שיעור ה־y.";
var MEET_NEED_Y =
  "מצאת את שיעורי ה־x של נקודות המפגש. כדי לקבל את הנקודות עצמן, צריך למצוא גם את שיעור ה־y המתאים לכל x.";
var MEET_MISSING = "נמצאו שני ערכי x אפשריים, ולכן בדוק את שני הערכים כדי למצוא את כל נקודות המפגש.";
var MEET_MIXED = "שיעור ה־y שכתבת אינו מתאים לערך ה־x הזה. בדוק את ההצבה.";
var MEET_ARITH = "ההצבה נכונה. בדוק שוב את החישוב המספרי.";
var EQUATE_REASON = "בנקודת המפגש לשתי הפונקציות אותו שיעור y.";
var SUB_REASON = "מציבים את הביטוי של y מאחת המשוואות במשוואה השנייה.";
var ARRANGE_HINT = "התקבלה משוואה ריבועית. סדר אותה לצורה ax²+bx+c=0.";
var AFTER_ROOTS = "מצאת את שיעורי ה־x האפשריים של נקודות המפגש. עכשיו מצא את y המתאים לכל אחד מהם.";

function key(text) {
  return String(text || "")
    .replace(/\s+/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/²/g, "^2")
    .replace(/[·×]/g, "*");
}

function yRhs(eq) {
  var m = key(eq).match(/^y=(.+)$/i);
  return m ? m[1] : "";
}

function bothY(eq1, eq2) {
  return !!(yRhs(eq1) && yRhs(eq2));
}

function linearPair(eq1, eq2) {
  return bothY(eq1, eq2) && !/[\^²]/.test(String(eq1 || "")) && !/[\^²]/.test(String(eq2 || ""));
}

function workLines(history) {
  return (history || []).filter(function (line) {
    return String(line || "").indexOf("method:") !== 0;
  });
}

function methodOf(history) {
  var method = "";
  (history || []).forEach(function (line) {
    var text = String(line || "");
    if (text.indexOf("method:") === 0) method = text.slice(7);
  });
  return method === "sub" ? "sub" : method === "equate" ? "equate" : "";
}

function equateReason(method) {
  return method === "sub" ? SUB_REASON : EQUATE_REASON;
}

function xValue(Sys, text) {
  try {
    var iso = Sys.readIsolation(Sys.parseEquation(text));
    if (!iso || iso.v !== "x") return null;
    if (Math.abs(iso.rhs.x) > 1e-8 || Math.abs(iso.rhs.y) > 1e-8) return null;
    return iso.rhs.k;
  } catch (err) {
    return null;
  }
}

function evalExpr(Q, expr, x) {
  var parsed = Q.parseABC(String(expr || "") + "=0");
  if (!parsed) return null;
  return parsed.a * x * x + parsed.b * x + parsed.c;
}

function plugBody(Q, Sys, expr, x) {
  var parsed = Q.parseABC(String(expr || "") + "=0");
  if (!parsed) return Sys.fmt(x);
  var raw = Sys.fmt(x);
  var shown = x < 0 ? "(" + raw + ")" : raw;
  var parts = [];
  function push(coef, body) {
    if (Math.abs(coef) < 1e-8) return;
    var neg = coef < 0;
    var mag = Math.abs(coef);
    var bit = body ? (Math.abs(mag - 1) < 1e-8 ? body : Sys.fmt(mag) + "·" + body) : Sys.fmt(mag);
    if (!parts.length) parts.push((neg ? "−" : "") + bit);
    else parts.push((neg ? "−" : "+") + bit);
  }
  push(parsed.b, shown);
  push(parsed.c, "");
  return parts.length ? parts.join("") : "0";
}

function easierIndex(Q, r1, r2) {
  var p1 = Q.parseABC(r1 + "=0");
  var p2 = Q.parseABC(r2 + "=0");
  var c1 = p1 ? Math.abs(p1.b) : 99;
  var c2 = p2 ? Math.abs(p2.b) : 99;
  if (c1 < c2 - 1e-9) return 0;
  if (c2 < c1 - 1e-9) return 1;
  return String(r1).length <= String(r2).length ? 0 : 1;
}

function looksLikePair(text) {
  var src = String(text || "");
  if (/x\s*=/i.test(src) && /y\s*=/i.test(src)) return true;
  return /\([^)]*[,;][^)]*\)/.test(src);
}

function onlyX(text) {
  var src = String(text || "");
  return /^x\s*=/i.test(src) && !/y\s*=/i.test(src) && src.indexOf("(") < 0;
}

function adaptMessage(message, typed) {
  var msg = String(message || "");
  if (msg.indexOf("הערך של x נכתב ראשון") >= 0) return MEET_SWAP;
  if (msg.indexOf("פתרון אחד") >= 0 && msg.indexOf("פתרון נוסף") >= 0) return MEET_MISSING;
  if (msg.indexOf("איזה ערך של y") >= 0) return MEET_MIXED;
  if (msg.indexOf("טעות בחישוב") >= 0) return MEET_ARITH;
  if (msg.indexOf("כזוג סדור") >= 0 && onlyX(typed)) return MEET_NEED_Y;
  return msg;
}

function choiceView(method) {
  return {
    ok: true,
    applied: true,
    historyMark: "method:" + method,
    reason: method === "sub" ? "נמשיך בהצבה." : "נמשיך בהשוואה.",
    choice: null,
    phase: "equate",
    prompt: "אפשר להשוות בין שני הביטויים ולמצוא את x.",
    input: true,
    buttons: [],
    known: {},
    solved: false,
    offerFormula: false,
    offerSplit: false,
  };
}

function chooseView() {
  return {
    ok: true,
    phase: "choose_method",
    prompt: "באיזו דרך תרצה לפתור?",
    input: false,
    buttons: [
      { label: "השוואה", choice: { kind: "method", method: "equate" } },
      { label: "הצבה", choice: { kind: "method", method: "sub" } },
    ],
    known: {},
    solved: false,
    offerFormula: false,
    offerSplit: false,
    hints: [
      "נקודת מפגש נמצאת על שני הגרפים ולכן מקיימת את שתי המשוואות.",
      "בשתי המשוואות y שווה לביטוי ב־x. מה אפשר להסיק לגבי שני הביטויים בנקודת המפגש?",
      "אפשר להשוות בין שני הביטויים ולמצוא את x.",
    ],
  };
}

function createMeetHandler(engine) {
  var quad = createQuadSystemsHandler(engine);
  var Q = engine.DoctematicaQuadratic;
  var Sys = engine.DoctematicaSystems;
  var A = engine.DoctematicaAlgebra;

  function targetOf(r1, r2) {
    var eq = r1 + "=" + r2;
    var guard = 0;
    while (guard < 20) {
      guard += 1;
      var next = teachApi.nextAlgebra(Sys, A, eq, { mode: "solve", v: "x" });
      if (!next) return { kind: "none" };
      if (next.already) {
        if (next.terminal === "none") return { kind: "none" };
        if (next.terminal === "infinite") return { kind: "infinite" };
        var x = xValue(Sys, eq);
        if (x == null) return { kind: "none" };
        return { kind: "point", x: x, y: evalExpr(Q, r1, x) };
      }
      if (!next.eq) return { kind: "none" };
      eq = next.eq;
    }
    return { kind: "none" };
  }

  function linearView(st, extra) {
    extra = extra || {};
    var known = {};
    if (st.foundX && typeof st.x === "number") known.x = st.x;
    if (typeof st.y === "number" && st.phase !== "plug" && st.phase !== "yval") known.y = st.y;
    if (st.phase === "pair" || st.phase === "done") {
      if (typeof st.y === "number") known.y = st.y;
    }
    var answer = "";
    if (st.doneKind === "none") answer = "אין פתרון ממשי";
    if (st.doneKind === "infinite") answer = "אינסוף נקודות מפגש";
    if (st.doneKind === "unique" || st.doneKind === "point") answer = Sys.formatPairs([{ x: st.x, y: st.y }]);
    var prompt = extra.prompt || "";
    if (!prompt && st.phase === "choose_method") prompt = "באיזו דרך תרצה לפתור?";
    if (!prompt && st.phase === "solve") prompt = "אפשר להשוות בין שני הביטויים ולמצוא את x.";
    if (!prompt && (st.phase === "plug" || st.phase === "yval")) {
      prompt = "מצאת את שיעור ה־x של נקודת המפגש. עכשיו מצא את שיעור ה־y המתאים.";
    }
    if (!prompt && st.phase === "pair") prompt = "רשמו את נקודת המפגש כזוג סדור.";
    return {
      ok: extra.ok !== false,
      phase: st.phase,
      prompt: prompt,
      input: st.phase !== "choose_method" && st.phase !== "done",
      buttons: st.phase === "choose_method" ? chooseView().buttons : [],
      known: known,
      solved: st.phase === "done",
      kind: st.doneKind === "point" ? "unique" : st.doneKind,
      answer: answer,
      message: extra.message || "",
      note: extra.note || "",
      hint: extra.hint || prompt,
      hints: extra.hints || null,
      offerFormula: false,
      offerSplit: false,
      step: extra.step || "",
      reason: extra.reason || "",
      done: !!extra.done,
    };
  }

  function replayLinear(eq1, eq2, history) {
    var r1 = yRhs(eq1);
    var r2 = yRhs(eq2);
    var goal = targetOf(r1, r2);
    var st = {
      eq1: eq1,
      eq2: eq2,
      r1: r1,
      r2: r2,
      start: r1 + "=" + r2,
      alt: r2 + "=" + r1,
      method: methodOf(history),
      phase: "choose_method",
      current: "",
      x: null,
      y: null,
      foundX: false,
      plug: "",
      goal: goal,
    };
    var lines = workLines(history);
    var i;
    for (i = 0; i < lines.length; i++) {
      var step = acceptLinear(st, lines[i]);
      if (!step.ok) return step;
    }
    return { ok: true, st: st };
  }

  function acceptLinear(st, typed) {
    var text = String(typed || "").trim();
    if (!text) return { ok: false, message: "כתבו את הצעד הבא." };
    if (st.phase === "done") return { ok: false, message: "התרגיל כבר פתור." };
    if (st.goal.kind === "point" && looksLikePair(text)) {
      var judged = Sys.checkOrderedPairs(text, [{ x: st.goal.x, y: st.goal.y }]);
      if (!judged.ok) return { ok: false, message: adaptMessage(judged.message, text) };
      st.foundX = true;
      st.x = st.goal.x;
      st.y = st.goal.y;
      st.phase = "done";
      st.doneKind = "unique";
      return { ok: true, message: "נכון." };
    }
    if (st.phase === "conclude") {
      if (st.goal.kind === "none" && /אין פתרון/.test(text)) {
        st.phase = "done";
        st.doneKind = "none";
        return { ok: true, message: "נכון. אין נקודת מפגש." };
      }
      if (st.goal.kind === "infinite" && /אינסוף/.test(text)) {
        st.phase = "done";
        st.doneKind = "infinite";
        return { ok: true, message: "נכון. שתי הפונקציות זהות." };
      }
      return { ok: false, message: st.goal.kind === "none" ? "אין נקודת מפגש." : "שתי הפונקציות זהות." };
    }
    if (st.phase === "choose_method" || !st.current) {
      if (st.goal.kind === "none" && /אין פתרון/.test(text)) {
        st.phase = "done";
        st.doneKind = "none";
        return { ok: true, message: "נכון. אין נקודת מפגש." };
      }
      if (st.goal.kind === "infinite" && /אינסוף/.test(text)) {
        st.phase = "done";
        st.doneKind = "infinite";
        return { ok: true, message: "נכון. שתי הפונקציות זהות." };
      }
      if (key(text) === key(st.start) || key(text) === key(st.alt)) {
        st.current = text;
        st.phase = "solve";
        return openSolved(st, text, "השוואת הביטויים נכונה.");
      }
      var skipped = A.checkStep(st.start, text);
      if (skipped && skipped.ok) {
        st.current = text;
        st.phase = "solve";
        return openSolved(st, text, skipped.message || "צעד חוקי.");
      }
      return {
        ok: false,
        message: (skipped && skipped.message) || "אפשר להשוות בין שני הביטויים ולמצוא את x.",
      };
    }
    if (st.phase === "solve") {
      if (st.goal.kind === "none" && /אין פתרון/.test(text)) {
        st.phase = "done";
        st.doneKind = "none";
        return { ok: true, message: "נכון. אין נקודת מפגש." };
      }
      if (st.goal.kind === "infinite" && /אינסוף/.test(text)) {
        st.phase = "done";
        st.doneKind = "infinite";
        return { ok: true, message: "נכון. שתי הפונקציות זהות." };
      }
      var moved = A.checkStep(st.current, text);
      if (!moved || !moved.ok) {
        return { ok: false, message: adaptMessage((moved && moved.message) || "הצעד אינו שקול.", text) };
      }
      st.current = text;
      return openSolved(st, text, moved.message || "צעד חוקי.");
    }
    if (st.phase === "plug" || st.phase === "yval") {
      if (onlyX(text)) return { ok: false, message: MEET_NEED_Y };
      var bodies = [plugBody(Q, Sys, st.r1, st.x), plugBody(Q, Sys, st.r2, st.x)];
      var asY = key(text).replace(/^y=/, "");
      var structured = bodies.some(function (body) {
        return key(body) && asY.indexOf(key(body)) >= 0;
      });
      var claimed = text.match(/=\s*([+−–—-]?\d+(?:[./]\d+)?)\s*$/);
      var claimedNum = claimed ? Number(String(claimed[1]).replace(/[−–—]/g, "-")) : null;
      if (structured && claimedNum != null && Math.abs(claimedNum - st.y) > 1e-6 && /[+\-·*−]/.test(asY)) {
        return { ok: false, message: MEET_ARITH };
      }
      if (bodies.some(function (body) { return key(text) === key("y=" + body); })) {
        st.plug = text;
        if (/[+\-·*−]/.test(key(text).replace(/^y=/, ""))) {
          st.phase = "yval";
          return { ok: true, message: "ההצבה נכונה. חשבו את y." };
        }
        st.phase = "pair";
        return { ok: true, message: "y = " + Sys.fmt(st.y) + "." };
      }
      if (key(text) === key("y=" + Sys.fmt(st.y))) {
        st.phase = "pair";
        return { ok: true, message: "y = " + Sys.fmt(st.y) + "." };
      }
      if (claimedNum != null && Math.abs(claimedNum - st.y) > 1e-6 && /^y=/i.test(text)) {
        return { ok: false, message: MEET_MIXED };
      }
      return { ok: false, message: "הציבו את x באחת משתי המשוואות כדי למצוא את y." };
    }
    if (st.phase === "pair") {
      if (onlyX(text)) return { ok: false, message: MEET_NEED_Y };
      var pair = Sys.checkOrderedPairs(text, [{ x: st.x, y: st.y }]);
      if (!pair.ok) return { ok: false, message: adaptMessage(pair.message, text) };
      st.phase = "done";
      st.doneKind = "unique";
      return { ok: true, message: "נכון." };
    }
    return { ok: false, message: "הצעד אינו שקול." };
  }

  function openSolved(st, text, message) {
    if (st.goal.kind === "none") {
      var noneNext = teachApi.nextAlgebra(Sys, A, text, { mode: "solve", v: "x" });
      if (noneNext && noneNext.already && noneNext.terminal === "none") {
        st.phase = "conclude";
        st.doneKind = null;
        return { ok: true, message: message };
      }
    }
    if (st.goal.kind === "infinite") {
      var infNext = teachApi.nextAlgebra(Sys, A, text, { mode: "solve", v: "x" });
      if (infNext && infNext.already && infNext.terminal === "infinite") {
        st.phase = "conclude";
        return { ok: true, message: message };
      }
    }
    var x = bareX(text);
    if (x != null && st.goal.kind === "point" && Math.abs(x - st.goal.x) < 1e-6) {
      st.foundX = true;
      st.x = x;
      st.y = st.goal.y;
      st.phase = "plug";
      return { ok: true, message: message || "מצאתם את x. עכשיו מצאו את y." };
    }
    st.phase = "solve";
    return { ok: true, message: message || "צעד חוקי." };
  }

  function bareX(text) {
    if (A.isolatedRhsKind(text, "x") !== "value") return null;
    return xValue(Sys, text);
  }

  function teachStep(text) {
    var term = teachApi.nextAlgebra(Sys, A, text, { mode: "solve", v: "x" });
    if (term && term.already && (term.terminal === "none" || term.terminal === "infinite")) {
      return { terminal: term.terminal };
    }
    var act = engine.DoctematicaTeach.nextAction(text);
    if (!act || act.done || !act.eq) return null;
    return {
      eq: act.eq,
      reason: act.explain || act.hint || "ממשיכים לפתור את המשוואה.",
      hint: act.hint || act.explain || "המשיכו לפתור את המשוואה עד למציאת x.",
    };
  }

  function nextLinear(st) {
    if (st.phase === "choose_method" || !st.current) {
      return { eq: st.start, reason: equateReason(st.method) };
    }
    if (st.phase === "solve" || st.phase === "conclude") {
      var next = teachStep(st.current || st.start);
      if (next && next.terminal === "none") {
        return { eq: "אין פתרון ממשי", reason: "המשוואה סותרת, ולכן לגרפים אין נקודת מפגש." };
      }
      if (next && next.terminal === "infinite") {
        return { eq: "אינסוף נקודות מפגש", reason: "שתי הפונקציות זהות, ולכן כל נקודה על הגרף היא נקודת מפגש." };
      }
      if (next && next.eq) return { eq: next.eq, reason: next.reason };
      return null;
    }
    if (st.phase === "plug") {
      var exprs = [st.r1, st.r2];
      var idx = easierIndex(Q, st.r1, st.r2);
      var body = plugBody(Q, Sys, exprs[idx], st.x);
      return {
        eq: "y=" + body,
        reason: "הציבו x = " + Sys.fmt(st.x) + " במשוואה " + st[["eq1", "eq2"][idx]] + ".",
      };
    }
    if (st.phase === "yval") {
      return { eq: "y=" + Sys.fmt(st.y), reason: "חישבנו וקיבלנו y = " + Sys.fmt(st.y) + "." };
    }
    if (st.phase === "pair") {
      return {
        eq: Sys.formatPairs([{ x: st.x, y: st.y }]),
        reason: "נקודת המפגש היא זוג סדור: קודם שיעור ה־x ואחר כך שיעור ה־y.",
      };
    }
    return null;
  }

  function linearHints(st) {
    if (st.phase === "choose_method") return chooseView().hints;
    if (st.phase === "solve" || st.phase === "conclude") {
      var next = teachStep(st.current || st.start);
      if (next && next.terminal === "none") return ["המשוואה סותרת, ולכן אין נקודת מפגש."];
      if (next && next.terminal === "infinite") return ["שתי הפונקציות זהות, ולכן יש אינסוף נקודות מפגש."];
      if (next && next.hint) return [next.hint];
      return ["המשיכו לפתור את המשוואה עד למציאת x."];
    }
    if (st.phase === "plug") return ["הציבו את x ומצאו את y."];
    if (st.phase === "yval") return ["חשבו את ערך ה־y."];
    if (st.phase === "pair") return ["רשמו את נקודת המפגש כזוג סדור."];
    return ["התרגיל כבר פתור."];
  }

  function handleLinear(body, intent, eq1, eq2, hist) {
    if (intent === "choice") {
      var choice = (body && body.choice) || {};
      var method = choice.method === "sub" ? "sub" : choice.method === "equate" ? "equate" : "";
      if (!method) return { ok: false, message: "בחרו השוואה או הצבה." };
      return choiceView(method);
    }
    var loaded = replayLinear(eq1, eq2, hist);
    if (!loaded.ok && intent !== "check") return { ok: false, message: loaded.message };
    if (intent === "setup") {
      if (!workLines(hist).length) return chooseView();
      return linearView(loaded.st);
    }
    if (intent === "hint") {
      if (!loaded.ok) return { ok: false, message: loaded.message };
      var hints = linearHints(loaded.st);
      return { ok: true, hint: hints[0], hints: hints, phase: loaded.st.phase };
    }
    if (intent === "one-step") {
      if (!loaded.ok) return { ok: false, message: loaded.message };
      if (loaded.st.phase === "done") {
        var doneView = linearView(loaded.st, { message: "התרגיל כבר פתור.", done: true });
        return doneView;
      }
      var action = nextLinear(loaded.st);
      if (!action || !action.eq) return { ok: false, message: "אין צעד המשך." };
      var after = replayLinear(eq1, eq2, hist.concat([action.eq]));
      if (!after.ok) return { ok: false, message: after.message };
      var view = linearView(after.st, { message: action.reason, step: action.eq, reason: action.reason });
      return view;
    }
    if (intent === "check") {
      if (!loaded.ok) return { ok: false, message: loaded.message };
      var typed = String((body && body.typed) || "").trim();
      var before = loaded.st.current || loaded.st.start;
      var step = acceptLinear(loaded.st, typed);
      if (!step.ok) return { ok: false, message: adaptMessage(step.message, typed), phase: loaded.st.phase };
      var reason = step.message || "צעד חוקי.";
      var act = engine.DoctematicaTeach.nextAction(before);
      if (act && act.eq && act.explain && key(act.eq) === key(typed)) reason = act.explain;
      var out = linearView(loaded.st, { message: reason, reason: reason });
      out.ok = true;
      return out;
    }
    return { error: "unknown intent", message: "unknown intent" };
  }

  function polishQuad(remote, body) {
    if (!remote) return remote;
    var hist = Array.isArray(body.history) ? body.history : [];
    var eq1 = String(body.eq1 || "");
    var eq2 = String(body.eq2 || "");
    var typed = String((body && body.typed) || "");
    if (remote.message) remote.message = adaptMessage(remote.message, typed);
    if (bothY(eq1, eq2) && remote.reason && remote.reason.indexOf("הצבנו את הביטוי של y מהמשוואה השנייה") >= 0) {
      remote.reason = equateReason(methodOf(hist));
    }
    if (remote.steps && remote.steps[0] && bothY(eq1, eq2)) {
      if (String(remote.steps[0].reason || "").indexOf("הצבנו את הביטוי של y מהמשוואה השנייה") >= 0) {
        remote.steps[0].reason = equateReason(methodOf(hist));
      }
    }
    var shown = remote.step || body._last || "";
    if (remote.phase === "quad" && remote.hint && shown && !Q.isAbcOrder(shown)) {
      remote.hints = [ARRANGE_HINT, remote.hint];
    }
    if (remote.phase === "back") {
      remote.hints = [AFTER_ROOTS, remote.hint || AFTER_ROOTS];
    }
    return remote;
  }

  function quadBody(body) {
    var hist = Array.isArray(body.history) ? body.history.map(String) : [];
    var lines = workLines(hist);
    return {
      topic: "systems-quad",
      intent: body.intent,
      eq1: body.eq1,
      eq2: body.eq2,
      history: lines,
      typed: body.typed,
      choice: body.choice,
      _last: lines.length ? lines[lines.length - 1] : "",
    };
  }

  function handle(body) {
    body = body || {};
    if (String(body.topic || "") !== "calculus-meet") {
      return { error: "unknown topic", message: "unknown topic" };
    }
    var intent = String(body.intent || "");
    var eq1 = String(body.eq1 || "");
    var eq2 = String(body.eq2 || "");
    var hist = Array.isArray(body.history) ? body.history.map(String) : [];
    if (intent === "solution") {
      var steps = [];
      var walk = hist.slice();
      var guard = 0;
      var last = null;
      while (guard < 80) {
        guard += 1;
        var remote = handle({
          topic: "calculus-meet",
          intent: "one-step",
          eq1: eq1,
          eq2: eq2,
          history: walk,
        });
        if (!remote || remote.ok === false) return remote || { ok: false, message: "הפתרון נעצר." };
        if (remote.done && !remote.step) break;
        if (!remote.step) break;
        steps.push({ eq: remote.step, reason: remote.reason || "" });
        walk.push(remote.step);
        last = remote;
        if (remote.solved) break;
      }
      return {
        ok: true,
        steps: steps,
        answer: (last && last.answer) || "",
        solved: !!(last && last.solved),
        kind: last && last.kind,
      };
    }
    if (bothY(eq1, eq2) && !workLines(hist).length && intent === "setup") return chooseView();
    if (bothY(eq1, eq2) && !workLines(hist).length && intent === "choice") {
      var picked = ((body && body.choice) || {}).method;
      var name = picked === "sub" ? "sub" : picked === "equate" ? "equate" : "";
      if (!name) return { ok: false, message: "בחרו השוואה או הצבה." };
      return choiceView(name);
    }
    if (bothY(eq1, eq2) && !workLines(hist).length && intent === "hint") {
      var opening = chooseView();
      return { ok: true, hint: opening.hints[0], hints: opening.hints, phase: "choose_method" };
    }
    if (linearPair(eq1, eq2)) return handleLinear(body, intent, eq1, eq2, hist);
    var forwarded = quadBody(body);
    var result = quad.handle(forwarded);
    body._last = forwarded._last;
    if (intent === "check" && result && result.ok === false) {
      var typed = String((body && body.typed) || "");
      if (looksLikePair(typed) || /אין פתרון/.test(typed)) {
        var solved = quad.handle({ topic: "systems-quad", intent: "solution", eq1: eq1, eq2: eq2, history: [] });
        var ans = String((solved && solved.answer) || "");
        if (/אין פתרון/.test(ans) && /אין פתרון/.test(typed)) {
          return {
            ok: true,
            solved: true,
            kind: "none",
            phase: "done",
            answer: "אין פתרון ממשי",
            input: false,
            message: "נכון.",
            known: {},
            buttons: [],
            offerFormula: false,
            offerSplit: false,
          };
        }
        var parsed = Sys.parseSolutionPairs(ans);
        if (looksLikePair(typed) && parsed.ok && parsed.pairs.length) {
          var judged = Sys.checkOrderedPairs(typed, parsed.pairs);
          if (judged.ok) {
            return {
              ok: true,
              solved: true,
              kind: parsed.pairs.length > 1 ? "pairs" : "unique",
              phase: "done",
              answer: Sys.formatPairs(parsed.pairs),
              input: false,
              message: "נכון.",
              known: {},
              buttons: [],
              offerFormula: false,
              offerSplit: false,
            };
          }
          return { ok: false, message: adaptMessage(judged.message, typed), phase: result.phase };
        }
      }
    }
    return polishQuad(result, body);
  }

  return { handle: handle };
}

module.exports = {
  createMeetHandler: createMeetHandler,
};
