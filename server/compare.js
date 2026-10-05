"use strict";

var createMeetHandler = require("./meet").createMeetHandler;

function near(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-6;
}

function polyOf(Q, expr) {
  var parsed = Q.parseABC(String(expr || "") + "=0");
  if (!parsed) return null;
  return { a: parsed.a, b: parsed.b, c: parsed.c };
}

function evalPoly(p, x) {
  if (!p) return null;
  return p.a * x * x + p.b * x + p.c;
}

function subPoly(p, q) {
  return { a: p.a - q.a, b: p.b - q.b, c: p.c - q.c };
}

function rootsOf(diff) {
  if (!diff) return [];
  if (Math.abs(diff.a) < 1e-9) {
    if (Math.abs(diff.b) < 1e-9) return [];
    return [-diff.c / diff.b];
  }
  var disc = diff.b * diff.b - 4 * diff.a * diff.c;
  if (disc < -1e-8) return [];
  if (Math.abs(disc) < 1e-8) return [-diff.b / (2 * diff.a)];
  var root = Math.sqrt(disc);
  return [(-diff.b - root) / (2 * diff.a), (-diff.b + root) / (2 * diff.a)].sort(function (a, b) {
    return a - b;
  });
}

function uniq(xs) {
  var out = [];
  (xs || []).forEach(function (x) {
    if (!out.some(function (y) { return near(x, y); })) out.push(x);
  });
  return out.sort(function (a, b) { return a - b; });
}

function buildModel(M, Q, ex) {
  var given = (ex.points || []).map(function (p) { return { x: Number(p.x), y: Number(p.y) }; });
  var fPoly = ex.f ? polyOf(Q, ex.f) : null;
  var gPoly = ex.g ? polyOf(Q, ex.g) : null;
  if (!fPoly && given.length >= 2 && ex.fRole === "line") {
    var slope = (given[1].y - given[0].y) / (given[1].x - given[0].x);
    fPoly = { a: 0, b: slope, c: given[0].y - slope * given[0].x };
  }
  var diff = fPoly && gPoly ? subPoly(fPoly, gPoly) : null;
  var xs = given.length ? uniq(given.map(function (p) { return p.x; })) : uniq(rootsOf(diff));
  var qualitative = !ex.f || !ex.g;
  return {
    f: fPoly,
    g: gPoly,
    fExpr: ex.f || "",
    gExpr: ex.g || "",
    xs: xs,
    given: given,
    qualitative: qualitative,
    gOpens: ex.gOpens || (gPoly && gPoly.a < 0 ? "down" : "up"),
    fName: "f",
    gName: "g",
    fRole: ex.fRole || (fPoly && Math.abs(fPoly.a) > 1e-9 ? "parabola" : "line"),
    gRole: ex.gRole || (gPoly && Math.abs(gPoly.a) > 1e-9 ? "parabola" : "line"),
    diff: diff,
    contact: contactOf(diff, xs),
  };
}

function contactOf(diff, xs) {
  if (!xs.length) return "none";
  if (diff && Math.abs(diff.a) > 1e-9) {
    var disc = diff.b * diff.b - 4 * diff.a * diff.c;
    if (Math.abs(disc) < 1e-8) return "tangency";
  }
  return "crossing";
}

function discOf(diff) {
  if (!diff || Math.abs(diff.a) < 1e-9) return null;
  return diff.b * diff.b - 4 * diff.a * diff.c;
}

function aboveAt(model, x) {
  if (model.qualitative) {
    var lo = model.xs[0];
    var hi = model.xs[model.xs.length - 1];
    var inside = model.xs.length >= 2 && x > lo && x < hi;
    if (model.gRole === "parabola" && model.gOpens === "up") return inside ? "f" : "g";
    if (model.gRole === "parabola" && model.gOpens === "down") return inside ? "g" : "f";
    return "f";
  }
  var d = evalPoly(model.f, x) - evalPoly(model.g, x);
  if (d > 1e-6) return "f";
  if (d < -1e-6) return "g";
  return "eq";
}

function openRay(from, to) {
  return { from: from, to: to, fromIncluded: false, toIncluded: false, empty: false, all: false };
}

function regionsOf(xs) {
  var cuts = uniq(xs);
  if (!cuts.length) return [openRay("-inf", "inf")];
  var out = [openRay("-inf", cuts[0])];
  var i;
  for (i = 0; i < cuts.length - 1; i++) out.push(openRay(cuts[i], cuts[i + 1]));
  out.push(openRay(cuts[cuts.length - 1], "inf"));
  return out;
}

function testPoint(region) {
  if (region.from === "-inf" && region.to === "inf") return 0;
  if (region.from === "-inf") return Number(region.to) - 1;
  if (region.to === "inf") return Number(region.from) + 1;
  return (Number(region.from) + Number(region.to)) / 2;
}

function wantedRegions(model, who, includeEnds) {
  var cuts = model.xs;
  var pieces = [];
  regionsOf(cuts).forEach(function (region) {
    if (aboveAt(model, testPoint(region)) === who) pieces.push(region);
  });
  if (!includeEnds) return pieces;
  var withEnds = pieces.map(function (region) {
    return {
      from: region.from,
      to: region.to,
      fromIncluded: region.from !== "-inf",
      toIncluded: region.to !== "inf",
      empty: false,
      all: false,
    };
  });
  return mergeTouching(withEnds);
}

function mergeTouching(list) {
  var items = list.slice().sort(function (a, b) {
    var ax = a.from === "-inf" ? -1e9 : Number(a.from);
    var bx = b.from === "-inf" ? -1e9 : Number(b.from);
    return ax - bx;
  });
  var out = [];
  items.forEach(function (region) {
    var prev = out[out.length - 1];
    if (prev && prev.to !== "inf" && region.from !== "-inf" && near(prev.to, region.from) && (prev.toIncluded || region.fromIncluded)) {
      prev.to = region.to;
      prev.toIncluded = region.toIncluded;
      return;
    }
    out.push({
      from: region.from,
      to: region.to,
      fromIncluded: region.fromIncluded,
      toIncluded: region.toIncluded,
      empty: false,
      all: false,
    });
  });
  return out;
}

function signRegions(poly, want, includeEnds) {
  var zeros = uniq(rootsOf(poly));
  var pieces = [];
  regionsOf(zeros).forEach(function (region) {
    var y = evalPoly(poly, testPoint(region));
    var pos = y > 1e-6;
    if ((want === "pos" && pos) || (want === "neg" && !pos && Math.abs(y) > 1e-6)) pieces.push(region);
  });
  if (!includeEnds) return pieces;
  return mergeTouching(pieces.map(function (region) {
    return {
      from: region.from,
      to: region.to,
      fromIncluded: region.from !== "-inf",
      toIncluded: region.to !== "inf",
      empty: false,
      all: false,
    };
  }));
}

function fresh(ex) {
  var known = { xs: [], points: [], intercepts: [] };
  if (ex.points && ex.points.length) {
    ex.points.forEach(function (p) {
      known.xs.push(Number(p.x));
      known.points.push({ x: Number(p.x), y: Number(p.y) });
    });
  }
  return { done: {}, phase: {}, work: [], known: known };
}

function tasksOf(ex) {
  var map = {};
  (ex.tasks || []).forEach(function (task) { map[task.id] = task; });
  return map;
}

function currentTask(ex, progress) {
  var map = tasksOf(ex);
  var parts = ex.parts || [];
  var i;
  var j;
  for (i = 0; i < parts.length; i++) {
    var ids = parts[i].taskIds || [];
    for (j = 0; j < ids.length; j++) {
      var task = map[ids[j]];
      if (task && !(progress.done && progress.done[task.id])) return task;
    }
  }
  return null;
}

function currentPart(ex, progress) {
  var task = currentTask(ex, progress);
  if (!task) return null;
  var parts = ex.parts || [];
  var i;
  for (i = 0; i < parts.length; i++) {
    if ((parts[i].taskIds || []).indexOf(task.id) >= 0) return parts[i];
  }
  return null;
}

function knownXs(progress, model) {
  var fromPoints = (progress.known && progress.known.points || []).map(function (p) { return p.x; });
  var listed = (progress.known && progress.known.xs) || [];
  var xs = uniq(fromPoints.concat(listed));
  if (!xs.length && model.given.length) xs = model.xs.slice();
  return xs;
}

function scaleOf(model, progress) {
  var vals = model.xs.slice();
  (progress.known.points || []).forEach(function (p) {
    vals.push(p.x, p.y);
  });
  (progress.known.intercepts || []).forEach(function (p) { vals.push(p.x); });
  var max = 2;
  vals.forEach(function (v) {
    if (isFinite(v) && Math.abs(v) > max) max = Math.abs(v);
  });
  return 0.72 / (max + 1);
}

function parabolaFrame(poly, xs) {
  var vx = -poly.b / (2 * poly.a);
  var top = Math.abs(evalPoly(poly, vx));
  (xs || []).forEach(function (x) {
    var y = Math.abs(evalPoly(poly, x));
    if (y > top) top = y;
  });
  var yShow = top * 1.22 + 0.6;
  var dx = Math.sqrt(yShow / Math.abs(poly.a));
  var maxX = Math.max(Math.abs(vx - dx), Math.abs(vx + dx), 1);
  (xs || []).forEach(function (x) {
    if (Math.abs(x) > maxX) maxX = Math.abs(x);
  });
  return {
    sx: 0.86 / maxX,
    sy: 0.84 / Math.max(yShow, 1),
    x0: vx - dx,
    x1: vx + dx,
  };
}

function samples(poly, frame) {
  if (!poly) return [];
  if (!frame || frame.x0 == null) {
    var unit = frame;
    var out = [];
    var i;
    for (i = -8; i <= 8; i++) {
      var x = (i / 8) * (0.9 / unit);
      var y = evalPoly(poly, x);
      if (!isFinite(y) || Math.abs(y * unit) > 1.15) continue;
      out.push({ qx: x * unit, qy: y * unit });
    }
    return out;
  }
  var pts = [];
  var n;
  for (n = 0; n <= 48; n++) {
    var x = frame.x0 + (frame.x1 - frame.x0) * (n / 48);
    pts.push({ qx: x * frame.sx, qy: evalPoly(poly, x) * frame.sy });
  }
  return pts;
}

function lineOf(poly, unitOrFrame) {
  if (unitOrFrame && unitOrFrame.sx) {
    var frame = unitOrFrame;
    var x1 = -0.9 / frame.sx;
    var x2 = 0.9 / frame.sx;
    return {
      x1: x1 * frame.sx,
      y1: evalPoly(poly, x1) * frame.sy,
      x2: x2 * frame.sx,
      y2: evalPoly(poly, x2) * frame.sy,
    };
  }
  var unit = unitOrFrame;
  var a = -0.9 / unit;
  var b = 0.9 / unit;
  return { x1: a * unit, y1: evalPoly(poly, a) * unit, x2: b * unit, y2: evalPoly(poly, b) * unit };
}

function bookArch(points) {
  var left = points[0];
  var right = points[points.length - 1];
  var x1 = 0.06;
  var y1 = 0.08;
  var x2 = 0.58;
  var y2 = 0.36;
  var lift = 8;
  function lineY(x) {
    return y1 + (y2 - y1) * ((x - x1) / (x2 - x1));
  }
  var curve = [];
  var i;
  for (i = 0; i <= 56; i++) {
    var x = -0.22 + 1.2 * (i / 56);
    var y = lineY(x) + lift * (x - x1) * (x2 - x);
    if (y > 0.92 || y < -0.9) continue;
    curve.push({ qx: x, qy: y });
  }
  return {
    line: { x1: -0.82, y1: lineY(-0.82), x2: 0.9, y2: lineY(0.9) },
    curve: curve,
    marks: [
      { qx: x1, qy: y1, label: "(" + left.x + ", " + left.y + ")" },
      { qx: x2, qy: y2, label: "(" + right.x + ", " + right.y + ")" },
    ],
  };
}

function figureOf(M, model, progress) {
  var paraPoly = model.f && Math.abs(model.f.a) > 1e-9 ? model.f : model.g && Math.abs(model.g.a) > 1e-9 ? model.g : null;
  var frame = paraPoly ? parabolaFrame(paraPoly, model.xs) : null;
  var unit = scaleOf(model, progress);
  var marks = [];
  var seen = {};
  function addX(x, y, label) {
    var key = String(Math.round(x * 1000)) + ":" + (y == null ? "" : String(Math.round(y * 1000)));
    if (seen[key]) return;
    seen[key] = true;
    var mark = { qx: frame ? x * frame.sx : x * unit, label: label };
    if (y == null) mark.guide = true;
    else mark.qy = frame ? y * frame.sy : y * unit;
    marks.push(mark);
  }
  (model.given || []).forEach(function (p) {
    addX(p.x, p.y, "P(" + M.fmt(p.x) + ", " + M.fmt(p.y) + ")");
  });
  (progress.known.points || []).forEach(function (p) {
    addX(p.x, p.y, "(" + M.fmt(p.x) + ", " + M.fmt(p.y) + ")");
  });
  (progress.known.xs || []).forEach(function (x) {
    var has = (progress.known.points || []).some(function (p) { return near(p.x, x); });
    if (!has && !model.given.some(function (p) { return near(p.x, x); })) addX(x, null, "x=" + M.fmt(x));
  });
  (progress.known.intercepts || []).forEach(function (p) {
    addX(p.x, 0, "(" + M.fmt(p.x) + ", 0)");
  });
  var figure = { marks: marks };
  function graphEq(name, expr) {
    if (!expr) return "";
    return name + "(x)=" + String(expr).replace(/\s+/g, "");
  }
  if (model.qualitative && model.f && model.gRole === "parabola") {
    var arch = bookArch(model.given);
    figure.line = arch.line;
    figure.curve = arch.curve;
    figure.marks = arch.marks;
    return figure;
  }
  var drawScale = frame || unit;
  if (model.f && Math.abs(model.f.a) > 1e-9) {
    figure.curve = samples(model.f, frame || unit);
    figure.curveEq = graphEq("f", model.fExpr);
  } else if (model.f) {
    figure.line = lineOf(model.f, drawScale);
    figure.lineEq = graphEq("f", model.fExpr);
  }
  if (model.g && Math.abs(model.g.a) > 1e-9) {
    var gCurve = samples(model.g, frame || unit);
    if (figure.curve) {
      figure.curves = [gCurve];
      figure.curveEqs = [graphEq("g", model.gExpr)];
    } else {
      figure.curve = gCurve;
      figure.curveEq = graphEq("g", model.gExpr);
    }
  } else if (model.g) {
    var gLine = lineOf(model.g, drawScale);
    if (figure.line) {
      figure.lines = [gLine];
      figure.lineEqs = [graphEq("g", model.gExpr)];
    } else {
      figure.line = gLine;
      figure.lineEq = graphEq("g", model.gExpr);
    }
  }
  return figure;
}

function viewFor(engine, M, ex, model, progress) {
  var task = currentTask(ex, progress);
  var part = currentPart(ex, progress);
  var input = "math";
  var domains = null;
  if (task && (task.kind === "comparePair" || task.kind === "compare" || task.kind === "positivity")) {
    var solvingZero = task.kind === "positivity" && !zerosFound(model, progress, task);
    input = solvingZero ? "math" : "domains";
    if (task.kind === "comparePair") {
      var savedPair = progress.pair || {};
      domains = [
        { id: "gt", label: "f(x) > g(x)", locked: !!savedPair.gt, value: savedPair.gt || "" },
        { id: "lt", label: "f(x) < g(x)", locked: !!savedPair.lt, value: savedPair.lt || "" },
      ];
    } else if (task.kind === "positivity" && !solvingZero) {
      domains = [{ id: "pos", label: (task.fn || "g") + "(x) > 0" }];
    } else if (task.kind !== "positivity") {
      domains = [{ id: "ans", label: part ? part.text : "התחום" }];
    }
  }
  return {
    stem: ex.stem || "",
    part: part ? { label: part.label || "", text: part.text || "" } : null,
    focusKind: task ? task.kind : "",
    figure: figureOf(M, model, progress),
    input: input,
    domains: domains,
    hint: hintsFor(engine, M, ex, model, progress)[0],
    pointHeading: part ? "סעיף " + part.label : "",
  };
}

function hintsFor(engine, M, ex, model, progress) {
  var task = currentTask(ex, progress);
  if (!task) return ["התרגיל כבר פתור."];
  if (task.kind === "meetX" && model.xs.length && knownXs(progress, model).length >= model.xs.length) {
    return ["מתי לשתי הפונקציות יש אותו ערך y? הסתכל על נקודת המפגש שכבר מצאת."];
  }
  if (task.kind === "meetPoint" || task.kind === "meetX") {
    if (!(progress.work || []).length) {
      if (model.contact === "none") {
        return [
          "נקודת מפגש צריכה לקיים את שתי הפונקציות באותו ערך x ובאותו ערך y.",
          "כדי לבדוק אם קיימת נקודת מפגש, השוו בין f(x) ל־g(x).",
        ];
      }
      return [
        "נקודת מפגש נמצאת על שני הגרפים ולכן מקיימת את שתי המשוואות.",
        "בשתי המשוואות y שווה לביטוי ב־x. מה אפשר להסיק לגבי שני הביטויים בנקודת המפגש?",
        "אפשר להשוות בין שני הביטויים ולמצוא את x.",
      ];
    }
    if ((progress.work || []).some(function (line) { return negDiscClaim(line, discOf(model.diff)); })) {
      return ["אין ערך x שבו f(x)=g(x), ולכן הגרפים אינם נפגשים."];
    }
    if (model.fExpr && model.gExpr) {
      var meet = createMeetHandler(engine);
      var remote = meet.handle({
        topic: "calculus-meet",
        intent: "hint",
        eq1: "y=" + model.fExpr,
        eq2: "y=" + model.gExpr,
        history: progress.work || [],
      });
      if (remote && remote.hints && remote.hints.length) return remote.hints;
    }
    return ["המשיכו לפתור את המשוואה."];
  }
  if (task.kind === "example" || task.kind === "whichFn" || task.kind === "compare" || task.kind === "comparePair") {
    var xs = knownXs(progress, model);
    if (task.kind === "comparePair") {
      var savedPairEarly = progress.pair || {};
      var heldEarly = progress.held || {};
      if (heldEarly[task.id + ":gt"] || heldEarly[task.id + ":lt"] || heldEarly[task.id]) {
        return [model.contact === "tangency"
          ? "זה צד אחד של נקודת ההשקה. בדקו גם את הצד השני."
          : "התחום שרשמתם נכון. יש עוד תחום."];
      }
      if (savedPairEarly.gt && !savedPairEarly.lt) return ["עכשיו רשמו את התחום שבו f(x) < g(x)."];
      if (savedPairEarly.lt && !savedPairEarly.gt) return ["עכשיו רשמו את התחום שבו f(x) > g(x)."];
    }
    if ((progress.held || {})[task.id]) return ["התחום שרשמתם נכון. יש עוד תחום."];
    if (task.kind === "compare" || task.kind === "comparePair") {
      if (!xs.length && (progress.contact === "none" || model.contact === "none")) {
        return ["אין ערכי x שבהם הפונקציות שוות. לכן אין נקודת מפגש שמחלקת את הישר. בדקו מי מהפונקציות גדולה יותר עבור ערך x אחד."];
      }
      if (!xs.length) return ["כדי לדעת היכן היחס בין הפונקציות יכול להשתנות, מצאו קודם היכן הן שוות."];
      if (model.contact === "tangency") return ["מצאנו ערך x אחד שבו הפונקציות שוות. בדקו מה קורה משני צדדיו."];
      if (model.xs.length >= 2) return ["מצאנו שתי נקודות מפגש. הן מחלקות את ציר x לשלושה תחומים. בדקו בכל תחום איזה גרף נמצא מעל השני."];
    }
    if (!xs.length) return ["כדי לחלק את הגרף לתחומים, מצא קודם היכן שתי הפונקציות שוות."];
    if (task.kind === "example") {
      return [
        "השווה בין הגבהים של שני הגרפים עבור אותו ערך x.",
        "הפונקציה שהגרף שלה גבוה יותר היא בעלת הערך הגדול יותר.",
      ];
    }
    if (task.kind === "whichFn") {
      return [
        "השווה בין הגבהים של שני הגרפים עבור אותו ערך x.",
        "הפונקציה שהגרף שלה גבוה יותר היא בעלת הערך הגדול יותר.",
      ];
    }
    if (task.kind === "comparePair") {
      var savedPair = progress.pair || {};
      var held = progress.held || {};
      if (held[task.id + ":gt"] || held[task.id + ":lt"] || held[task.id]) {
        return ["התחום שרשמתם נכון. יש עוד תחום."];
      }
      if (savedPair.gt && !savedPair.lt) return ["עכשיו רשמו את התחום שבו f(x) < g(x)."];
      if (savedPair.lt && !savedPair.gt) return ["עכשיו רשמו את התחום שבו f(x) > g(x)."];
    }
    if ((progress.held || {})[task.id]) return ["התחום שרשמתם נכון. יש עוד תחום."];
    return ["נקודות המפגש מחלקות את ציר x לתחומים. בדוק בכל תחום איזה גרף נמצא מעל השני."];
  }
  if (task.kind === "positivity") return positivityHints(engine, model, progress, task);
  return ["השווה בין הגבהים של שני הגרפים עבור אותו ערך x."];
}

function rememberX(progress, x, y) {
  if (!progress.known.xs.some(function (v) { return near(v, x); })) progress.known.xs.push(x);
  progress.known.xs.sort(function (a, b) { return a - b; });
  if (y != null && !progress.known.points.some(function (p) { return near(p.x, x); })) {
    progress.known.points.push({ x: x, y: y });
  }
}

function openQuotient(engine, text) {
  var A = engine.DoctematicaAlgebra;
  if (!A || typeof A.isolatedRhsKind !== "function") return false;
  var kind = A.isolatedRhsKind(text, "x");
  return kind === "expr" || kind === "unreduced";
}

function parseXs(M, text) {
  var list = M.parseRegionList(text);
  if (list && list.length && list.every(function (iv) { return iv.point || (near(iv.from, iv.to) && iv.fromIncluded && iv.toIncluded); })) {
    return list.map(function (iv) { return Number(iv.from); });
  }
  var found = [];
  String(text || "").replace(/[−–—]/g, "-").replace(/x[₁₂12]?\s*=\s*([+-]?\d+(?:[./]\d+)?)/gi, function (_m, n) {
    var v = M.bareNumber ? M.bareNumber(n) : Number(n);
    if (v == null || !isFinite(Number(v))) {
      var bits = String(n).split("/");
      v = bits.length === 2 ? Number(bits[0]) / Number(bits[1]) : Number(n);
    }
    if (isFinite(v)) found.push(Number(v));
    return "";
  });
  return uniq(found);
}

function numbersIn(text) {
  var src = String(text || "").replace(/[−–—]/g, "-");
  var found = [];
  src.replace(/[+-]?\d+(?:\/\d+|\.\d+)?/g, function (n) {
    var v = n.indexOf("/") >= 0 ? Number(n.split("/")[0]) / Number(n.split("/")[1]) : Number(n);
    if (isFinite(v)) found.push(v);
    return "";
  });
  return found;
}

function whoName(text) {
  var s = String(text || "");
  if (/פרבול/.test(s) || /\bg\b/i.test(s) || /g\(x\)/.test(s)) return "g";
  if (/ישר/.test(s) && !/פרבול/.test(s)) return "f";
  if (/\bf\b/i.test(s) || /f\(x\)/.test(s)) return "f";
  return "";
}

function relationHolds(model, x, rel) {
  var who = aboveAt(model, x);
  if (who === "eq") return rel === "ge" || rel === "le";
  if (rel === "gt" || rel === "ge") return who === "f";
  if (rel === "lt" || rel === "le") return who === "g";
  return false;
}

function expectedSet(M, model, task) {
  if (task.kind === "positivity") {
    var poly = task.fn === "f" ? model.f : model.g;
    return signRegions(poly, "pos", false);
  }
  var who = task.who || "f";
  var include = !!task.include;
  if (task.notAbove) {
    who = task.subject === "g" ? "f" : "g";
    include = true;
  }
  return wantedRegions(model, who, include);
}

function looseEnds(list) {
  return (list || []).map(function (iv) {
    return { from: iv.from, to: iv.to, fromIncluded: false, toIncluded: false, empty: false, all: false };
  });
}

function judgeSet(M, student, expected, task) {
  var model = task._model;
  if (!student) return { ok: false, errorId: "unparsed", message: "רשמו את התחום, למשל x > 3." };
  if (M.sameIntervalSet(student, expected)) return { ok: true };
  if (student.length && student.length < expected.length && student.every(function (iv) {
    return expected.some(function (want) { return M.sameInterval(iv, want); });
  })) {
    return { ok: false, errorId: "onlyOneRegionReturned", message: "חסר תחום. בדקו את שני הצדדים של נקודות המפגש." };
  }
  if (M.sameRegionSet(looseEnds(student), looseEnds(expected))) {
    var studentClosed = student.some(function (iv) { return iv.fromIncluded || iv.toIncluded; });
    var expectClosed = expected.some(function (iv) { return iv.fromIncluded || iv.toIncluded; });
    if (!expectClosed && studentClosed) {
      return {
        ok: false,
        errorId: task._model && task._model.contact === "tangency" ? "equalityIncludedInStrictComparison" : "intersectionIncludedInStrictComparison",
        message: task.kind === "positivity"
          ? "בנקודת החיתוך עם ציר x מתקיים " + ((task.fn || "g") + "(x) = 0") + ", ולכן היא אינה נכללת."
          : "בנקודת המפגש f(x)=g(x), ולכן היא אינה נכללת באי־שוויון מחמיר.",
      };
    }
    if (expectClosed && !studentClosed) {
      return {
        ok: false,
        errorId: "intersectionExcludedFromInclusiveComparison",
        message: task.notAbove
          ? "התחום שבחרת נכון, אבל «אינו מעל» כולל גם את נקודות המפגש, שבהן הגרפים שווים."
          : "התחום שבחרת נכון, אבל הסימן ≤ כולל גם את נקודת המפגש שבה שתי הפונקציות שוות.",
      };
    }
    return { ok: false, errorId: "wrongRelationAtBoundary", message: "התחומים נכונים, אבל בדקו אם נקודת המפגש כלולה." };
  }
  if (model && model.contact === "none") {
    var studentAll = student.length === 1 && (student[0].all || (student[0].from === "-inf" && student[0].to === "inf"));
    var expectAll = expected.length === 1 && (expected[0].all || (expected[0].from === "-inf" && expected[0].to === "inf"));
    if (!student.length && expectAll) {
      return { ok: false, errorId: "wrongEmptySet", message: "יש ערכי x שמקיימים את האי־שוויון. היעדר מפגש אינו תחום ריק." };
    }
    if (studentAll && !expected.length) {
      return { ok: false, errorId: "wrongAllReals", message: "לא כל x מקיים את האי־שוויון. בדקו איזו פונקציה נמצאת מעל השנייה." };
    }
  }
  var swappedWho = (task.who || "f") === "f" ? "g" : "f";
  var swapped = model ? wantedRegions(model, swappedWho, !!task.include) : [];
  if (model && model.contact === "tangency" && M.sameIntervalSet(student, swapped)) {
    return {
      ok: false,
      errorId: "relationFlippedAcrossTangency",
      message: "נקודת המפגש היא נקודת השקה. כאשר הגרפים נוגעים ואינם חוצים זה את זה, לא בהכרח משתנה איזה גרף נמצא מעל השני.",
    };
  }
  if (task.kind !== "positivity" && M.sameIntervalSet(student, swapped)) {
    return { ok: false, errorId: "confusedFunctionOrder", message: "בדוק איזה מהגרפים נמצא גבוה יותר בתחום שסימנת." };
  }
  if (model && model.contact === "tangency" && touchesOnlyRoot(student, model.xs[0]) && !M.sameIntervalSet(student, expected)) {
    return {
      ok: false,
      errorId: "tangencyTreatedAsCrossing",
      message: "נקודת המפגש היא נקודת השקה. כאשר הגרפים נוגעים ואינם חוצים זה את זה, לא בהכרח משתנה איזה גרף נמצא מעל השני.",
    };
  }
  if (model && model.contact === "tangency" && !student.length && expected.length) {
    return { ok: false, errorId: "wrongEmptySet", message: "יש ערכי x שמקיימים את האי־שוויון. נקודת ההשקה אינה מוחקת את ההשוואה בשאר הציר." };
  }
  if (!student.length && expected.length) {
    return { ok: false, errorId: "wrongEmptySet", message: "יש ערכי x שמקיימים את האי־שוויון." };
  }
  if (student.length && !expected.length) {
    return { ok: false, errorId: "wrongAllReals", message: student.length === 1 && (student[0].all || (student[0].from === "-inf" && student[0].to === "inf"))
      ? "לא כל x מקיים את האי־שוויון."
      : "התחום שבחרתם אינו ריק, והאי־שוויון אינו מתקיים." };
  }
  return { ok: false, errorId: "region", message: "התחום אינו מתאים להשוואה בין הגרפים." };
}

function touchesOnlyRoot(list, root) {
  if (!list || list.length !== 1 || root == null) return false;
  var iv = list[0];
  if (iv.all || (iv.from === "-inf" && iv.to === "inf")) return false;
  return (iv.to !== "inf" && near(Number(iv.to), root)) || (iv.from !== "-inf" && near(Number(iv.from), root));
}

function finish(progress, task) {
  progress.done[task.id] = true;
  progress.work = [];
}

function good(progress, show, message) {
  return { ok: true, progress: progress, show: show, message: message || "נכון." };
}

function bad(id, message) {
  return { ok: false, errorId: id, message: message };
}

function negDiscClaim(text, disc) {
  if (disc == null || disc >= -1e-8) return false;
  var t = String(text || "").replace(/\s+/g, "").replace(/[−–—]/g, "-");
  if (t === "Δ<0" || t === "delta<0" || /דיסקרימיננטהשלילית/.test(t)) return true;
  var named = t.match(/^(?:Δ|delta)=(-?\d+(?:\.\d+)?)$/i);
  return !!(named && Math.abs(Number(named[1]) - disc) < 1e-4);
}

function noMeetPhrase(text) {
  return /אין\s*נקוד/.test(String(text || "")) || /אינם נפגש|אין מפגש|אין חיתוך/.test(String(text || ""));
}

function cannotComparePhrase(text) {
  return /אי אפשר|לא ניתן|לא יודע/.test(String(text || ""));
}

function undefinedPhrase(text) {
  return /לא מוגדר/.test(String(text || ""));
}

function checkMeet(engine, M, ex, model, progress, task, typed) {
  if (task.kind === "meetX" && /^y\s*=/i.test(String(typed || ""))) {
    return bad("usedYInsteadOfIntersectionX", "השאלה מבקשת את שיעור ה־x של נקודת המפגש, לא את שיעור ה־y.");
  }
  var meet = createMeetHandler(engine);
  var eq1 = "y=" + model.fExpr;
  var eq2 = "y=" + model.gExpr;
  if (!model.fExpr || !model.gExpr) return bad("meet", "כאן נקודות המפגש נתונות בציור.");
  var hist = progress.work || [];
  if (undefinedPhrase(typed)) {
    return bad("noRealRootsMisreadAsDomainError", "הפונקציות מוגדרות. אין x שבו ערכיהן שווים, וזה אינו אומר שהן אינן מוגדרות.");
  }
  if (model.contact === "none" && negDiscClaim(typed, discOf(model.diff)) && hist.length) {
    progress.work = hist.concat([String(typed)]);
    return good(progress, typed, "דיסקרימיננטה שלילית אומרת שאין פתרון ממשי. רשמו שאין פתרון ממשי, ולכן אין נקודת מפגש.");
  }
  var remote = meet.handle({ topic: "calculus-meet", intent: "check", eq1: eq1, eq2: eq2, history: hist, typed: typed });
  var rawXs = parseXs(M, typed);
  var xs = openQuotient(engine, typed) ? [] : rawXs;
  if (model.contact === "none" && rawXs.length) {
    return bad("inventedIntersection", "אין ערך x שבו f(x)=g(x). אין לסמן נקודת מפגש.");
  }
  if (model.contact === "tangency" && rawXs.length > 1) {
    return bad("tangencyTreatedAsTwoIntersections", "יש נקודת מפגש אחת. זהו שורש כפול, לא שתי נקודות שונות.");
  }
  var known = knownXs(progress, model);
  if (
    task.kind === "meetX" &&
    xs.length === model.xs.length &&
    model.xs.length &&
    xs.every(function (x) { return model.xs.some(function (w) { return near(w, x); }); })
  ) {
    xs.forEach(function (x) { rememberX(progress, x, null); });
    progress.contact = model.contact;
    finish(progress, task);
    return good(progress, typed, model.contact === "tangency"
      ? "זהו ערך ה־x היחיד שבו הפונקציות שוות. הנקודה היא נקודת השקה."
      : (known.length ? "זה שיעור ה־x של נקודת המפגש שכבר מצאתם." : "אלה ערכי ה־x שבהם הפונקציות שוות."));
  }
  if (known.length && xs.length && xs.some(function (x) { return !known.some(function (k) { return near(k, x); }); }) && task.kind === "meetX") {
    var yHit = model.given.concat(progress.known.points || []).some(function (p) {
      return xs.some(function (x) { return near(x, p.y) && !near(x, p.x); });
    });
    if (yHit) return bad("usedYInsteadOfIntersectionX", "השאלה מבקשת את שיעור ה־x של נקודת המפגש, לא את שיעור ה־y.");
    return bad("recalculatedKnownIntersectionIncorrectly", "ערך ה־x של נקודת המפגש כבר נמצא. השתמשו בו.");
  }
  if (!remote || remote.ok === false) {
    if (xs.length && xs.length === model.xs.length && xs.every(function (x) { return model.xs.some(function (w) { return near(w, x); }); })) {
      xs.forEach(function (x) { rememberX(progress, x, null); });
      if (task.kind === "meetX") {
        progress.contact = model.contact;
        finish(progress, task);
        return good(progress, typed, model.contact === "tangency"
          ? "זהו ערך ה־x היחיד שבו הפונקציות שוות. הנקודה היא נקודת השקה."
          : "אלה ערכי ה־x שבהם הפונקציות שוות.");
      }
    }
    return bad((remote && remote.errorId) || "meet", (remote && remote.message) || "הצעד אינו שקול.");
  }
  progress.work = hist.concat([String(typed)]);
  xs.forEach(function (x) {
    if (model.xs.some(function (w) { return near(w, x); })) rememberX(progress, x, null);
  });
  if (remote.solved && remote.answer && remote.kind !== "none") {
    var Sys = engine.DoctematicaSystems;
    var parsed = Sys.parseSolutionPairs(remote.answer);
    if (parsed && parsed.ok) {
      parsed.pairs.forEach(function (p) { rememberX(progress, p.x, p.y); });
    }
  }
  var have = knownXs(progress, model);
  var allX = model.xs.length && model.xs.every(function (x) { return have.some(function (h) { return near(h, x); }); });
  if ((remote && remote.kind === "none") || (model.contact === "none" && /אין פתרון/.test(String(typed)) && hist.length)) {
    progress.contact = "none";
    finish(progress, task);
    return good(progress, typed, "אין ערך x שבו f(x)=g(x), ולכן הגרפים אינם נפגשים.");
  }
  if (task.kind === "meetX" && allX) {
    progress.contact = model.contact;
    finish(progress, task);
    return good(progress, typed, model.contact === "tangency"
      ? "זהו ערך ה־x היחיד שבו הפונקציות שוות. הנקודה היא נקודת השקה."
      : "מצאתם את ערכי ה־x. הם ישמשו גם בסעיפים הבאים.");
  }
  if (task.kind === "meetPoint" && remote.solved) {
    progress.contact = model.contact;
    finish(progress, task);
    return good(progress, typed, "נקודת המפגש נשמרה.");
  }
  var note = remote.message || "צעד חוקי.";
  var preview = meet.handle({ topic: "calculus-meet", intent: "one-step", eq1: eq1, eq2: eq2, history: hist });
  if (preview && preview.reason && preview.step && String(preview.step).replace(/\s+/g, "") === String(typed).replace(/\s+/g, "")) {
    note = preview.reason;
  }
  return good(progress, typed, note);
}

function checkExample(M, model, progress, task, typed) {
  var xs = parseXs(M, typed);
  if (!xs.length) {
    var bare = numbersIn(typed);
    if (bare.length === 1 && !/[<>=]/.test(typed)) xs = bare;
  }
  if (xs.length !== 1) return bad("example", "תנו ערך אחד של x.");
  var x = xs[0];
  if (model.xs.some(function (c) { return near(c, x); }) && (task.rel === "gt" || task.rel === "lt")) {
    return bad("intersectionIncludedInStrictComparison", "בנקודת המפגש f(x)=g(x), ולכן היא אינה נכללת באי־שוויון מחמיר.");
  }
  if (!relationHolds(model, x, task.rel || "gt")) {
    return bad("wrongTestPointRegion", "הערך שבחרתם אינו נמצא בתחום שבו מתקיים האי־שוויון.");
  }
  finish(progress, task);
  return good(progress, typed, "הערך מקיים את התנאי.");
}

function checkWhich(model, progress, task, typed) {
  var who = whoName(typed);
  var at = Number(task.at);
  var above = aboveAt(model, at);
  if (!who) return bad("which", "רשמו איזו פונקציה גדולה יותר, f או g.");
  if (who !== above) return bad("confusedFunctionOrder", "בדוק איזה מהגרפים נמצא גבוה יותר בערך x הזה.");
  finish(progress, task);
  return good(progress, typed, "נכון. ב־x = " + at + " הפונקציה " + above + " גבוהה יותר.");
}

function pairLabel(id) {
  return id === "gt" ? "f(x) > g(x)" : "f(x) < g(x)";
}

function mergeIntervals(M, lists) {
  var out = [];
  (lists || []).forEach(function (list) {
    (list || []).forEach(function (iv) {
      if (!out.some(function (have) { return M.sameInterval(have, iv); })) out.push(iv);
    });
  });
  return out;
}

function settleRegions(M, progress, slot, student, expected) {
  progress.held = progress.held || {};
  var merged = mergeIntervals(M, [progress.held[slot], student]);
  var cover = M.takeRegions(merged, expected);
  if (cover.complete) {
    delete progress.held[slot];
    return { ok: true, done: true, show: M.formatIntervalSet(expected) };
  }
  var fresh = M.takeRegions(student, expected);
  if (fresh.partial) {
    progress.held[slot] = cover.matched;
    return { ok: true, done: false, show: M.formatIntervalSet(fresh.matched), message: "התחום נכון. יש עוד תחום." };
  }
  return null;
}

function checkPair(M, model, progress, task, domains) {
  var sides = [
    { id: "gt", who: "f" },
    { id: "lt", who: "g" },
  ];
  progress.pair = progress.pair || {};
  var accepted = [];
  var partials = [];
  var shows = [];
  var problem = null;
  sides.forEach(function (side) {
    if (progress.pair[side.id]) return;
    var raw = String((domains && domains[side.id]) || "").trim();
    if (!raw) return;
    if (cannotComparePhrase(raw) && model.contact === "none") {
      if (!problem) problem = { id: side.id, errorId: "noIntersectionMeansCannotCompare", message: "דווקא מכיוון שהגרפים אינם נפגשים, הסדר ביניהם אינו מתחלף. בדקו באיזה גרף נמצא גבוה יותר עבור ערך x אחד." };
      return;
    }
    if (undefinedPhrase(raw)) {
      if (!problem) problem = { id: side.id, errorId: "noRealRootsMisreadAsDomainError", message: "הפונקציות מוגדרות. אין x שבו ערכיהן שווים, וזה אינו אומר שהן אינן מוגדרות." };
      return;
    }
    var student = M.parseRegionList(raw);
    var expected = wantedRegions(model, side.who, false);
    var settled = student ? settleRegions(M, progress, task.id + ":" + side.id, student, expected) : null;
    if (settled && settled.done) {
      progress.pair[side.id] = settled.show;
      accepted.push(side.id);
      shows.push(settled.show);
    } else if (settled) {
      partials.push(side.id);
      shows.push(settled.show);
    } else {
      var judge = judgeSet(M, student, expected, {
        who: side.who,
        include: false,
        _model: model,
        kind: "compare",
      });
      if (judge.ok) {
        progress.pair[side.id] = M.formatIntervalSet(expected);
        accepted.push(side.id);
        shows.push(progress.pair[side.id]);
      } else if (!problem) problem = { id: side.id, errorId: judge.errorId, message: judge.message };
    }
  });
  var result;
  if (progress.pair.gt && progress.pair.lt) {
    finish(progress, task);
    result = good(progress, "f(x) > g(x): " + progress.pair.gt + " , f(x) < g(x): " + progress.pair.lt, "התחומים נכונים.");
  } else if (accepted.length || partials.length) {
    var msg = partials.length
      ? (model.contact === "tangency" ? "זה צד אחד של נקודת ההשקה. בדקו גם את הצד השני." : "התחום נכון. יש עוד תחום.")
      : "התחום של " + accepted.map(pairLabel).join(" וגם ") + " נכון.";
    if (!partials.length) {
      var left = sides.filter(function (side) { return !progress.pair[side.id]; })[0];
      if (left) msg += " עכשיו רשמו את התחום של " + pairLabel(left.id) + ".";
    }
    if (problem) msg += " " + pairLabel(problem.id) + ": " + problem.message;
    result = good(progress, "", msg);
  } else if (problem) {
    return bad(problem.errorId, pairLabel(problem.id) + ": " + problem.message);
  } else {
    return bad("unparsed", "רשמו את התחום, למשל x > 3.");
  }
  result.clearDomains = accepted.concat(partials);
  if (problem) result.errorId = problem.errorId;
  return result;
}

function checkDomains(M, model, progress, task, domains) {
  task._model = model;
  task._xs = model.xs;
  if (task.kind === "comparePair") return checkPair(M, model, progress, task, domains);
  var raw = task.kind === "positivity" ? domains.pos : domains.ans;
  if (cannotComparePhrase(raw) && model.contact === "none") {
    return bad("noIntersectionMeansCannotCompare", "דווקא מכיוון שהגרפים אינם נפגשים, הסדר ביניהם אינו מתחלף. בדקו באיזה גרף נמצא גבוה יותר עבור ערך x אחד.");
  }
  if (undefinedPhrase(raw)) {
    return bad("noRealRootsMisreadAsDomainError", "הפונקציות מוגדרות. אין x שבו ערכיהן שווים, וזה אינו אומר שהן אינן מוגדרות.");
  }
  var student = M.parseRegionList(raw || "");
  var expected = expectedSet(M, model, task);
  if (task.kind === "positivity") {
    var other = task.fn === "f" ? model.g : model.f;
    var otherSet = other ? signRegions(other, "pos", false) : [];
    if (student && otherSet.length && M.sameIntervalSet(student, otherSet) && !M.sameIntervalSet(student, expected)) {
      return bad("wrongGraphForPositivity", "השאלה עוסקת ב־" + (task.fn || "g") + "(x), לא בפונקציה השנייה.");
    }
    var compared = wantedRegions(model, "g", false);
    if (student && M.sameIntervalSet(student, compared) && !M.sameIntervalSet(student, expected)) {
      return bad("comparedToOtherFunctionInsteadOfZero", "כאן משווים את הגרף לציר x, לא לפונקציה השנייה.");
    }
  }
  var fieldId = task.kind === "positivity" ? "pos" : "ans";
  var settled = student ? settleRegions(M, progress, task.id, student, expected) : null;
  if (settled && !settled.done) {
    var partial = good(progress, settled.show, settled.message);
    partial.clearDomains = [fieldId];
    return partial;
  }
  if (settled && settled.done) {
    if (task.kind === "positivity") {
      var zeroList = uniq(rootsOf(task.fn === "f" ? model.f : model.g));
      zeroList.forEach(function (x) {
        if (!(progress.known.intercepts || []).some(function (p) { return near(p.x, x); })) {
          progress.known.intercepts.push({ fn: task.fn || "g", x: x });
        }
      });
    }
    finish(progress, task);
    var doneRegions = good(progress, settled.show, "התחום נכון.");
    doneRegions.clearDomains = [fieldId];
    return doneRegions;
  }
  var judged = judgeSet(M, student, expected, task);
  if (!judged.ok) return bad(judged.errorId, judged.message);
  if (task.kind === "positivity") {
    var zeros = uniq(rootsOf(task.fn === "f" ? model.f : model.g));
    zeros.forEach(function (x) {
      if (!(progress.known.intercepts || []).some(function (p) { return near(p.x, x); })) {
        progress.known.intercepts.push({ fn: task.fn || "g", x: x });
      }
    });
  }
  finish(progress, task);
  return good(progress, raw, "התחום נכון.");
}

function eqKey(text) {
  return String(text || "").replace(/\s+/g, "").replace(/[−–—]/g, "-");
}

function posFn(task) {
  return (task && task.fn) || "g";
}

function posPoly(model, task) {
  return posFn(task) === "f" ? model.f : model.g;
}

function posExpr(model, task) {
  return posFn(task) === "f" ? model.fExpr : model.gExpr;
}

function posZeros(model, task) {
  return uniq(rootsOf(posPoly(model, task)));
}

function knownZeros(progress, fn) {
  return (progress.known.intercepts || []).filter(function (p) { return p.fn === fn; });
}

function zerosFound(model, progress, task) {
  var zeros = posZeros(model, task);
  if (!zeros.length) return true;
  return knownZeros(progress, posFn(task)).length >= zeros.length;
}

function isFnZero(text, fn) {
  var t = eqKey(text);
  return t === fn + "(x)=0" || t === "y=0";
}

function isExprZero(text, expr) {
  var t = eqKey(text);
  var e = eqKey(expr);
  if (!e) return false;
  return t === e + "=0" || t === "0=" + e || t === "(" + e + ")=0";
}

function zeroEq(expr) {
  return String(expr || "").replace(/\s+/g, "") + "=0";
}

function solveFrom(work, expr, fn) {
  var i;
  for (i = work.length - 1; i >= 0; i--) {
    if (!isFnZero(work[i], fn)) return work[i];
  }
  return zeroEq(expr);
}

function bareRoot(A, text) {
  if (A.isolatedRhsKind(text, "x") !== "value") return null;
  var nums = numbersIn(String(text).split("=").filter(function (side) {
    return !/^\s*x\s*$/i.test(side);
  }).join(""));
  return nums.length === 1 ? nums[0] : null;
}

function recordZero(progress, fn, x, show) {
  if (!knownZeros(progress, fn).some(function (p) { return near(p.x, x); })) {
    progress.known.intercepts.push({ fn: fn, x: x });
  }
  progress.work = [];
  return good(progress, show, "זו נקודת החיתוך עם ציר x. עכשיו מצאו היכן " + fn + "(x) חיובי.");
}

function positivityHints(engine, model, progress, task) {
  if ((progress.held || {})[task.id]) return ["התחום שרשמתם נכון. יש עוד תחום."];
  var fn = posFn(task);
  if (zerosFound(model, progress, task)) {
    return ["נקודת החיתוך עם ציר x מחלקת את הציר. בדקו באיזה צד הגרף נמצא מעל ציר x."];
  }
  var work = progress.work || [];
  var expr = posExpr(model, task);
  if (!work.length) {
    return [fn + "(x) חיובי מעל ציר x. מצאו קודם את נקודת החיתוך: פתרו " + fn + "(x) = 0."];
  }
  if (isFnZero(work[work.length - 1], fn)) {
    return ["רשמו את המשוואה ופתרו אותה עד למציאת x."];
  }
  var poly = posPoly(model, task);
  if (poly && Math.abs(poly.a) < 1e-9 && engine.DoctematicaTeach) {
    var act = engine.DoctematicaTeach.nextAction(work[work.length - 1]);
    if (act && act.hint) return [act.hint];
  }
  return ["המשיכו לפתור את המשוואה עד למציאת x."];
}

function checkPositivity(engine, M, model, progress, task, typed) {
  var fn = posFn(task);
  var expr = posExpr(model, task);
  var zeros = posZeros(model, task);
  if (/[<>≤≥]/.test(typed) || /אין/.test(typed)) {
    return checkDomains(M, model, progress, task, { pos: typed });
  }
  if (zerosFound(model, progress, task)) {
    return bad("pos", "את נקודת החיתוך עם ציר x כבר מצאתם. רשמו עבור אילו x הגרף מעל הציר.");
  }
  var A = engine.DoctematicaAlgebra;
  var root = bareRoot(A, typed);
  if (root != null) {
    if (zeros.some(function (z) { return near(z, root); })) return recordZero(progress, fn, root, typed);
    return bad("pos", "זה אינו שיעור ה־x של נקודת החיתוך עם ציר x.");
  }
  var work = progress.work || [];
  if (!work.length && (isFnZero(typed, fn) || isExprZero(typed, expr))) {
    progress.work = [typed];
    return good(progress, typed, isFnZero(typed, fn) ? "נכון. רשמו את המשוואה ופתרו אותה." : "נכון. פתרו את המשוואה עד למציאת x.");
  }
  if (work.length && isFnZero(work[work.length - 1], fn) && isExprZero(typed, expr)) {
    progress.work = work.concat([typed]);
    return good(progress, typed, "נכון. פתרו את המשוואה עד למציאת x.");
  }
  var from = solveFrom(work, expr, fn);
  var moved = A.checkStep(from, typed);
  if (moved && moved.ok) {
    var found = bareRoot(A, typed);
    if (found != null && zeros.some(function (z) { return near(z, found); })) return recordZero(progress, fn, found, typed);
    progress.work = work.concat([typed]);
    return good(progress, typed, moved.message || "צעד חוקי.");
  }
  if (moved && moved.message) return bad(moved.errorId || "pos", moved.message);
  return bad("pos", "מצאו קודם את נקודת החיתוך עם ציר x. פתרו " + fn + "(x) = 0.");
}

function checkTyped(engine, M, ex, model, progress, typed) {
  var task = currentTask(ex, progress);
  if (!task) return bad("done", "התרגיל כבר פתור.");
  if (task.kind === "meetPoint" || task.kind === "meetX") return checkMeet(engine, M, ex, model, progress, task, typed);
  if (task.kind === "example") return checkExample(M, model, progress, task, typed);
  if (task.kind === "whichFn") return checkWhich(model, progress, task, typed);
  if (task.kind === "positivity") return checkPositivity(engine, M, model, progress, task, typed);
  if (task.kind === "compare") {
    return checkDomains(M, model, progress, task, { ans: typed, pos: typed });
  }
  return bad("task", "כתבו את התשובה לסעיף.");
}

function nextLine(engine, M, ex, model, progress) {
  var task = currentTask(ex, progress);
  if (!task) return "";
  if (task.kind === "meetX" && knownXs(progress, model).length >= model.xs.length && model.xs.length) {
    return model.xs.map(function (x) { return "x=" + M.fmt(x); }).join(" או ");
  }
  if (task.kind === "meetPoint" || task.kind === "meetX") {
    if (!model.fExpr) return "";
    var meet = createMeetHandler(engine);
    var remote = meet.handle({
      topic: "calculus-meet",
      intent: "one-step",
      eq1: "y=" + model.fExpr,
      eq2: "y=" + model.gExpr,
      history: progress.work || [],
    });
    if (task.kind === "meetX" && remote && remote.step && /^y=/i.test(remote.step)) {
      return model.xs.map(function (x) { return "x=" + M.fmt(x); }).join(" או ");
    }
    return (remote && remote.step) || "";
  }
  if (task.kind === "whichFn") return task.expectName || (aboveAt(model, Number(task.at)) === "g" ? "g" : "f");
  if (task.kind === "example") {
    var sample = regionsOf(model.xs).filter(function (region) {
      return relationHolds(model, testPoint(region), task.rel || "gt");
    })[0];
    return sample ? "x=" + M.fmt(testPoint(sample)) : "";
  }
  if (task.kind === "positivity") {
    var fn = posFn(task);
    var expr = posExpr(model, task);
    var poly = posPoly(model, task);
    if (!zerosFound(model, progress, task)) {
      var work = progress.work || [];
      if (!work.length) return fn + "(x)=0";
      if (isFnZero(work[work.length - 1], fn)) return zeroEq(expr);
      if (poly && Math.abs(poly.a) < 1e-9 && engine.DoctematicaTeach) {
        var act = engine.DoctematicaTeach.nextAction(work[work.length - 1]);
        if (act && act.eq && !act.done) return act.eq;
      }
      var missing = posZeros(model, task).filter(function (z) {
        return !knownZeros(progress, fn).some(function (p) { return near(p.x, z); });
      })[0];
      return "x=" + M.fmt(missing);
    }
    return M.formatIntervalSet(expectedSet(M, model, task));
  }
    if (task.kind === "comparePair") {
      var savedPair = progress.pair || {};
      if (!savedPair.gt) return M.formatIntervalSet(wantedRegions(model, "f", false));
      if (!savedPair.lt) return M.formatIntervalSet(wantedRegions(model, "g", false));
      return "";
    }
    if (task.kind === "compare") {
      var xs = knownXs(progress, model);
      if (!xs.length) return "x=" + model.xs.map(function (x) { return M.fmt(x); }).join(" או x=");
      return M.formatIntervalSet(expectedSet(M, model, task));
    }
  return "";
}

function solutionLines(engine, M, ex, model) {
  var progress = fresh(ex);
  var lines = [];
  var notes = [];
  var guard = 0;
  while (currentTask(ex, progress) && guard < 40) {
    guard += 1;
    var task = currentTask(ex, progress);
    var line = nextLine(engine, M, ex, model, progress);
    if (!line) break;
    var checked;
    if (task.kind === "comparePair") {
      var pairNow = progress.pair || {};
      var pairPayload = {};
      if (!pairNow.gt) pairPayload.gt = M.formatIntervalSet(wantedRegions(model, "f", false));
      else pairPayload.lt = M.formatIntervalSet(wantedRegions(model, "g", false));
      checked = checkDomains(M, model, progress, task, pairPayload);
      if (!checked || !checked.ok) break;
      if (checked.show) {
        lines.push(checked.show);
        notes.push(checked.message || "");
      }
      progress = checked.progress;
      continue;
    } else {
      checked = checkTyped(engine, M, ex, model, progress, line);
    }
    if (!checked || !checked.ok) break;
    lines.push(line);
    notes.push(checked.message || "");
    progress = checked.progress;
  }
  return { steps: lines, notes: notes };
}

function handle(engine, ex, body) {
  var M = engine.DoctematicaFnModel;
  var Q = engine.DoctematicaQuadratic;
  var model = buildModel(M, Q, ex);
  var progress = body.progress && body.progress.known ? body.progress : fresh(ex);
  if (!progress.known) progress = fresh(ex);
  if (!progress.done) progress.done = {};
  if (!progress.work) progress.work = [];
  var intent = String(body.intent || "check");
  if (intent === "hint") {
    var hints = hintsFor(engine, M, ex, model, progress);
    return { ok: true, hint: hints[0], hints: hints, view: viewFor(engine, M, ex, model, progress) };
  }
  if (intent === "solution") {
    var solved = solutionLines(engine, M, ex, model);
    return { ok: true, steps: solved.steps, notes: solved.notes, answer: solved.steps.length ? solved.steps[solved.steps.length - 1] : "" };
  }
  if (intent === "one-step") {
    var step = nextLine(engine, M, ex, model, progress);
    if (!step) return { ok: false, message: "אין צעד נוסף." };
    var task = currentTask(ex, progress);
    var applied;
    if (task && task.kind === "comparePair") {
      var pairNow = progress.pair || {};
      var pairPayload = {};
      if (!pairNow.gt) pairPayload.gt = step;
      else pairPayload.lt = step;
      applied = checkDomains(M, model, progress, task, pairPayload);
      step = applied.show || "";
    } else {
      applied = checkTyped(engine, M, ex, model, progress, step);
    }
    if (!applied.ok) return { ok: false, message: applied.message || "אין צעד נוסף." };
    var doneTask = !currentTask(ex, applied.progress);
    return {
      ok: true,
      show: step,
      message: applied.message || "",
      progress: applied.progress,
      solved: doneTask,
      view: viewFor(engine, M, ex, model, applied.progress),
      hint: hintsFor(engine, M, ex, model, applied.progress)[0],
    };
  }
  if (body.domains) {
    var taskNow = currentTask(ex, progress);
    if (!taskNow) return { ok: false, message: "התרגיל כבר פתור." };
    var byFields = checkDomains(M, model, progress, taskNow, body.domains);
    if (!byFields.ok) return { ok: false, message: byFields.message, errorId: byFields.errorId };
    return {
      ok: true,
      show: byFields.show || "",
      message: byFields.message || "",
      progress: byFields.progress,
      solved: !currentTask(ex, byFields.progress),
      view: viewFor(engine, M, ex, model, byFields.progress),
      hint: hintsFor(engine, M, ex, model, byFields.progress)[0],
      clearDomains: byFields.clearDomains || [],
      errorId: byFields.errorId,
    };
  }
  var checked = checkTyped(engine, M, ex, model, progress, body.typed);
  if (!checked.ok) return { ok: false, message: checked.message, errorId: checked.errorId };
  return {
    ok: true,
    show: checked.show || body.typed || "",
    message: checked.message || "",
    progress: checked.progress,
    solved: !currentTask(ex, checked.progress),
    view: viewFor(engine, M, ex, model, checked.progress),
    hint: hintsFor(engine, M, ex, model, checked.progress)[0],
  };
}

function openingView(engine, ex) {
  var M = engine.DoctematicaFnModel;
  var Q = engine.DoctematicaQuadratic;
  var model = buildModel(M, Q, ex);
  return viewFor(engine, M, ex, model, fresh(ex));
}

module.exports = {
  handle: handle,
  openingView: openingView,
  buildModel: buildModel,
};
