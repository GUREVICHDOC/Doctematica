"use strict";

var signGraph = require("./sign-graph");
var levelProbe = require("./level-probe");
var currentEngine = null;

function ascii(s) {
  return String(s || "")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "")
    .replace(/·/g, "*");
}

function near(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-6;
}

function freshProgress() {
  return {
    poly: true,
    task: 0,
    phase: "",
    algebra: [],
    chain: null,
    route: null,
    points: [],
    plugs: {},
    paramEq: "",
    formulaBranch: null,
    formulaRole: "",
    signGot: [],
    signSides: {},
    pointCols: [],
    forkCard: null,
    known: [],
    canSplit: false,
    offerFormula: false,
    md53: false,
  };
}

function loadProgress(body) {
  var raw = body && body.progress;
  if (!raw || !raw.poly) return freshProgress();
  return {
    poly: true,
    task: Number(raw.task) || 0,
    phase: String(raw.phase || ""),
    algebra: Array.isArray(raw.algebra) ? raw.algebra.map(String) : [],
    chain: raw.chain || null,
    route: raw.route && raw.route.engine ? { engine: String(raw.route.engine), start: String(raw.route.start || "") } : null,
    points: Array.isArray(raw.points)
      ? raw.points.map(function (p) {
          return { x: Number(p.x), y: Number(p.y) };
        })
      : [],
    plugs: raw.plugs && typeof raw.plugs === "object" ? raw.plugs : {},
    paramEq: String(raw.paramEq || ""),
    formulaBranch: raw.formulaBranch == null ? null : raw.formulaBranch,
    formulaRole: String(raw.formulaRole || ""),
    signGot: Array.isArray(raw.signGot) ? raw.signGot.map(String) : [],
    signSides: raw.signSides && typeof raw.signSides === "object" ? {
      pos: Array.isArray(raw.signSides.pos) ? raw.signSides.pos.map(String) : [],
      neg: Array.isArray(raw.signSides.neg) ? raw.signSides.neg.map(String) : [],
    } : {},
    pointCols: Array.isArray(raw.pointCols) ? raw.pointCols.map(function (col) { return Array.isArray(col) ? col.map(String) : []; }) : [],
    forkCard: raw.forkCard && raw.forkCard.parallel ? raw.forkCard : null,
    known: Array.isArray(raw.known) ? raw.known.map(Number).filter(function (n) { return isFinite(n); }) : [],
    canSplit: !!raw.canSplit,
    offerFormula: !!raw.offerFormula,
    md53: !!raw.md53,
  };
}

function taskAt(ex, progress) {
  var tasks = ex.tasks || [];
  if (progress.task < 0 || progress.task >= tasks.length) return null;
  return tasks[progress.task];
}

function openingPhase(task) {
  if (!task) return "done";
  if (task.kind === "zeros" || task.kind === "solve") return "setup";
  if (task.kind === "sign") return "sign";
  if (task.kind === "collect") return "points";
  if (task.kind === "level") return "level";
  return "work";
}

function arm(ex, progress) {
  if (!progress.phase) progress.phase = openingPhase(taskAt(ex, progress));
  return progress;
}

function fail(id, message) {
  return { ok: false, errorId: id, message: message };
}

function numText(M, n) {
  return M.fmt(n).replace(/−/g, "-");
}

function plugToken(x) {
  var text = String(x);
  if (/^\d+(\.\d+)?$/.test(text)) return text;
  return "(" + text + ")";
}

function substX(expr, x) {
  var token = plugToken(x);
  var s = String(expr || "");
  if (token.charAt(0) === "(") {
    s = s.replace(/x/g, token);
    s = s.replace(/(\d|\))(\()/g, "$1*$2");
    return s;
  }
  s = s.replace(/(\d)x/g, "$1*" + token);
  s = s.replace(/\)x/g, ")*" + token);
  return s.replace(/x/g, token);
}

function juxtapose(text) {
  return String(text || "").replace(/(\d|\))(\()/g, "$1*$2");
}

function evalFn(Q, expr, x) {
  if (String(expr).indexOf("k") >= 0 || /[a-wyz]/i.test(String(expr).replace(/x/g, ""))) return null;
  var v = Q.evalExpr(juxtapose(substX(expr, x)));
  return v == null || !isFinite(v) ? null : v;
}

function shapeOf(Q, rhs, letter) {
  var text = String(rhs || "");
  if (letter && new RegExp("\\b" + letter + "\\b").test(text)) {
    var zero = Q.evalExpr(juxtapose(text.replace(new RegExp("\\b" + letter + "\\b", "g"), "(0)")));
    var one = Q.evalExpr(juxtapose(text.replace(new RegExp("\\b" + letter + "\\b", "g"), "(1)")));
    if (zero == null || one == null || !isFinite(zero) || !isFinite(one)) return null;
    return { constant: zero, coef: one - zero };
  }
  var v = Q.evalExpr(juxtapose(text));
  if (v == null || !isFinite(v)) return null;
  return { constant: v, coef: 0 };
}

function expectedShape(Q, expr, x, letter) {
  return shapeOf(Q, substX(expr, x), letter);
}

function rootNumbers(pack) {
  if (!pack || pack.kind === "none" || !pack.root) return [];
  var v = pack.root.n / pack.root.d;
  if (pack.kind === "two") return [v, -v];
  return [v];
}

function productFactors(equation) {
  var s = ascii(equation);
  var cut = s.indexOf("=");
  if (cut < 0) return null;
  var left = s.slice(0, cut);
  var right = s.slice(cut + 1);
  if (right !== "0") return null;
  if (left.charAt(0) !== "(") return null;
  var factors = [];
  var depth = 0;
  var start = -1;
  var i;
  for (i = 0; i < left.length; i++) {
    var ch = left.charAt(i);
    if (ch === "(") {
      if (depth === 0) start = i + 1;
      depth += 1;
    } else if (ch === ")") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        factors.push(left.slice(start, i));
        start = -1;
      }
    } else if (depth === 0 && ch !== "*") {
      return null;
    }
  }
  if (depth !== 0 || factors.length < 2) return null;
  return factors;
}

function factorRoots(Q, factor) {
  var eq = String(factor).indexOf("=") >= 0 ? ascii(factor) : ascii(factor) + "=0";
  var parsed = null;
  try {
    parsed = Q.parseABC(eq);
  } catch (err) {
    parsed = null;
  }
  if (!parsed) return [];
  if (parsed.a) {
    var D = parsed.b * parsed.b - 4 * parsed.a * parsed.c;
    if (D < -1e-8) return [];
    var s = Math.sqrt(Math.max(0, D));
    return [(-parsed.b + s) / (2 * parsed.a), (-parsed.b - s) / (2 * parsed.a)];
  }
  if (parsed.b) return [-parsed.c / parsed.b];
  return [];
}

function quadRoots(parsed) {
  if (!parsed) return [];
  if (parsed.a) {
    var D = parsed.b * parsed.b - 4 * parsed.a * parsed.c;
    if (D < -1e-8) return [];
    var s = Math.sqrt(Math.max(0, D));
    return [(-parsed.b + s) / (2 * parsed.a), (-parsed.b - s) / (2 * parsed.a)];
  }
  if (parsed.b) return [-parsed.c / parsed.b];
  return [];
}

function radicalLine(parsed) {
  var D = parsed.b * parsed.b - 4 * parsed.a * parsed.c;
  var num = -parsed.b;
  var den = 2 * parsed.a;
  var numShow = num < 0 ? "(" + num + ")" : String(num);
  var denShow = den < 0 ? "(" + den + ")" : String(den);
  return "x=(" + numShow + "±√" + D + ")/" + denShow;
}

function classify(Q, equation) {
  var eq = ascii(equation);
  if (!eq || eq.indexOf("=") < 0) return null;
  var factors = productFactors(eq);
  if (factors) {
    var productRoots = [];
    factors.forEach(function (factor) {
      factorRoots(Q, factor).forEach(function (root) { productRoots.push(root); });
    });
    return { engine: "product", start: eq, roots: uniqueSorted(productRoots), answer: "" };
  }
  try {
    var chain = Q.analyzeHighChainStart(eq);
    return { engine: "chain", start: chain.standard || eq, roots: (chain.roots || []).slice(), answer: chain.answer || "" };
  } catch (err) {}
  var B = currentEngine && currentEngine.DoctematicaBiquad;
  if (B && B.analyzeBiquadStart) {
    try {
      var bi = B.analyzeBiquadStart(eq);
      if (bi && bi.shape) {
        return { engine: "biquad", start: eq, roots: (bi.xRoots || []).slice(), answer: bi.answer || "" };
      }
    } catch (errBi) {}
  }
  try {
    var root = Q.analyzeHighRootStart(eq);
    return { engine: "root", start: eq, roots: rootNumbers(root), answer: root.answer || "", kind: root.kind, n: root.n };
  } catch (err2) {}
  var parsed = null;
  try {
    parsed = Q.parseABC(eq);
  } catch (err3) {}
  if (parsed && parsed.a) {
    var written = Q.analyze(parsed.a, parsed.b, parsed.c, eq);
    var roots = quadRoots(parsed);
    if (written.roots && written.roots.length) {
      roots = written.roots.map(function (r) {
        return r && r.n != null ? r.n / r.d : Number(r);
      });
    }
    return {
      engine: "quad",
      start: eq,
      roots: roots,
      answer: written.s == null ? radicalLine(parsed) : written.answer || "",
      view: { a: written.a, b: written.b, c: written.c, D: written.D, s: written.s, kind: written.kind },
    };
  }
  if (parsed && !parsed.a && parsed.b) {
    return { engine: "linear", start: eq, roots: [-parsed.c / parsed.b], answer: "" };
  }
  return null;
}

function sameRoots(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  var used = [];
  var i;
  var j;
  for (i = 0; i < a.length; i++) {
    var hit = false;
    for (j = 0; j < b.length; j++) {
      if (used[j]) continue;
      if (near(a[i], b[j])) {
        used[j] = true;
        hit = true;
        break;
      }
    }
    if (!hit) return false;
  }
  return true;
}

function targetOf(Q, ex, task) {
  if (!task) return null;
  if (task.kind === "zeros") return classify(Q, ex.fn + "=0");
  if (task.kind === "solve") return classify(Q, ex.fn + "=" + task.y);
  return null;
}

function uniqueSorted(list) {
  var out = [];
  (list || []).forEach(function (n) {
    if (!out.some(function (have) { return near(have, n); })) out.push(n);
  });
  out.sort(function (a, b) { return a - b; });
  return out;
}

function polyCoeffs(expr) {
  var s = ascii(expr);
  if (!s || s.indexOf("(") >= 0) return null;
  s = s.replace(/-/g, "+-");
  if (s.charAt(0) === "+") s = s.slice(1);
  var parts = s.split("+").filter(function (part) { return part !== ""; });
  var coeffs = [];
  var i;
  for (i = 0; i < parts.length; i++) {
    var part = parts[i];
    var power = part.match(/^(-?)(\d*)x(?:\^(\d+))?$/);
    var constant = part.match(/^(-?\d+(?:\.\d+)?)$/);
    if (power) {
      var coef = (power[2] === "" ? 1 : Number(power[2])) * (power[1] === "-" ? -1 : 1);
      var deg = power[3] ? Number(power[3]) : 1;
      coeffs[deg] = (coeffs[deg] || 0) + coef;
    } else if (constant && part.indexOf("x") < 0) {
      coeffs[0] = (coeffs[0] || 0) + Number(part);
    } else return null;
  }
  return coeffs;
}

function deflate(coeffs, root) {
  var deg = coeffs.length - 1;
  var acc = coeffs[deg] || 0;
  var next = [];
  next[deg - 1] = acc;
  var k;
  for (k = deg - 1; k >= 1; k--) {
    acc = (coeffs[k] || 0) + root * acc;
    next[k - 1] = acc;
  }
  var rem = (coeffs[0] || 0) + root * acc;
  return { rest: next, rem: rem };
}

function rationalRoots(coeffs) {
  var c = (coeffs || []).slice();
  var roots = [];
  var guard = 0;
  while (guard < 8 && c.length > 1 && Math.abs(c[0] || 0) < 1e-8) {
    roots.push(0);
    c = deflate(c, 0).rest;
    guard += 1;
  }
  var deg = c.length - 1;
  while (deg > 0 && Math.abs(c[deg] || 0) < 1e-8) deg -= 1;
  var constant = Math.abs(Math.round(c[0] || 0));
  var lead = Math.abs(Math.round(c[deg] || 0));
  if (!constant || !lead) return roots;
  function divisors(n) {
    var out = [];
    var i;
    for (i = 1; i <= n; i++) if (n % i === 0) out.push(i);
    return out;
  }
  var candidates = [];
  divisors(constant).forEach(function (p) {
    divisors(lead).forEach(function (q) {
      candidates.push(p / q);
      candidates.push(-p / q);
    });
  });
  candidates.forEach(function (root) {
    var spins = 0;
    while (spins < 6) {
      var split = deflate(c, root);
      if (Math.abs(split.rem) > 1e-4) break;
      roots.push(root);
      c = split.rest;
      spins += 1;
    }
  });
  return roots;
}

function expectedZeros(Q, ex) {
  var found = classify(Q, ex.fn + "=0");
  if (found && found.roots && found.roots.length) return uniqueSorted(found.roots);
  return uniqueSorted(rationalRoots(polyCoeffs(ex.fn) || []));
}

function multiplicityAt(ex, x) {
  var coeffs = polyCoeffs(ex.fn);
  if (!coeffs) return 0;
  return rationalRoots(coeffs).filter(function (root) { return near(root, x); }).length;
}

function leadingPositive(Q, ex, roots) {
  var x = 20;
  if (roots && roots.length) x = roots[roots.length - 1] + 3;
  var y = evalFn(Q, ex.fn, x);
  return y == null ? true : y > 0;
}

function signRegions(zeros, positiveRight) {
  var xs = (zeros || []).slice().sort(function (a, b) { return Number(a.x) - Number(b.x); });
  var bounds = [{ x: "-inf" }].concat(xs).concat([{ x: "inf" }]);
  var sign = positiveRight ? "pos" : "neg";
  var regions = [];
  var i;
  for (i = bounds.length - 2; i >= 0; i--) {
    regions.unshift({ from: bounds[i].x, to: bounds[i + 1].x, property: sign });
    if (bounds[i].x !== "-inf" && bounds[i].kind !== "touch") sign = sign === "pos" ? "neg" : "pos";
  }
  return regions;
}

function rootKind(Q, ex, x) {
  var h = 0.001;
  var left = evalFn(Q, ex.fn, x - h);
  var right = evalFn(Q, ex.fn, x + h);
  if (left == null || right == null) return "cross";
  if (left * right > 0) return "touch";
  return "cross";
}

function displayRoot(ex, x) {
  if (ex && ex.round && Math.abs(x - Math.round(x)) > 1e-4) return Number(Number(x).toFixed(ex.round));
  return x;
}

function chartOf(Q, ex) {
  var roots = expectedZeros(Q, ex);
  var zeros = roots.map(function (x) {
    var m = multiplicityAt(ex, x);
    var kind = m >= 2 && m % 2 === 0 ? "touch" : m >= 1 ? "cross" : rootKind(Q, ex, x);
    return { x: displayRoot(ex, x), kind: kind, raw: x };
  });
  return {
    roots: roots,
    regions: signRegions(zeros, leadingPositive(Q, ex, roots)),
    zeros: zeros,
  };
}

function figureOf(Q, M, ex, points) {
  if (!ex.graph) return null;
  var roots = expectedZeros(Q, ex);
  var win = ex.window || null;
  var rootLo = roots.length ? Math.min.apply(null, roots) : -5;
  var rootHi = roots.length ? Math.max.apply(null, roots) : 5;
  var lo = win && win.lo != null ? win.lo : Math.min(rootLo - 2, -2);
  var hi = win && win.hi != null ? win.hi : Math.max(rootHi + 2, 2);
  if (!(win && win.lo != null)) {
    var reach = Math.max(Math.abs(lo), Math.abs(hi), 2);
    lo = -reach;
    hi = reach;
  }
  var span = Math.max(hi - lo, 1);
  var samples = [];
  var maxY = 1;
  var i;
  var steps = win ? 64 : 24;
  for (i = 0; i <= steps; i++) {
    var x = lo + (span * i) / steps;
    var y = evalFn(Q, ex.fn, x);
    if (y == null || !isFinite(y)) y = 0;
    samples.push({ x: x, y: y });
    maxY = Math.max(maxY, Math.abs(y));
  }
  var scale = win && win.yCap ? win.yCap : maxY;
  if (!(scale > 0)) scale = 1;
  function qxOf(x) {
    if (lo < 0 && hi > 0) return (x / Math.max(-lo, hi)) * 0.75;
    return ((x - lo) / span) * 1.5 - 0.75;
  }
  function qyOf(y) {
    return (y / scale) * 0.7;
  }
  var figure = {
    curve: samples.map(function (p) {
      return { qx: qxOf(p.x), qy: qyOf(p.y) };
    }),
    marks: (points || []).map(function (p) {
      return { qx: qxOf(p.x), qy: qyOf(0), label: M.fmt(displayRoot(ex, p.x)) };
    }),
  };
  if (win && win.yCap) {
    figure.anchors = [
      { y: 0, qy: 0 },
      { y: win.yCap, qy: qyOf(win.yCap) },
      { y: -win.yCap, qy: qyOf(-win.yCap) },
    ];
  }
  return figure;
}

function partOf(ex, progress) {
  var parts = ex.parts || [];
  var task = taskAt(ex, progress);
  var part = parts[progress.task] || parts[0] || { label: "", text: "" };
  if (task && task.part) {
    parts.forEach(function (item) {
      if (item.label === task.part) part = item;
    });
  }
  return part;
}

function viewFor(engine, ex, progress) {
  var Q = engine.DoctematicaQuadratic;
  var M = engine.DoctematicaFnModel;
  var task = taskAt(ex, progress);
  var part = partOf(ex, progress);
  var view = {
    part: { label: part.label || "", text: part.text || "" },
    focusKind: task ? task.kind : "done",
    figure: figureOf(Q, M, ex, progress.points),
  };
  if (task && task.kind === "sign") {
    var chart = chartOf(Q, ex);
    var expected = signGraph.intervalsFor(chart.regions, task.side);
    var got = progress.signGot || [];
    var rows = got.map(function (text) {
      return { locked: true, value: text };
    });
    if (got.length < expected.length) rows.push({ locked: false, value: "" });
    view.input = "domains";
    view.domains = [
      {
        id: task.side,
        label: task.side === "pos" ? "f(x) > 0" : "f(x) < 0",
        rows: rows,
      },
    ];
  }
  if (task && task.kind === "level") {
    view.family = "probe";
    view.input = "math";
    view.probe = {
      mode: "drag",
      label: "y = k",
      anchors: (view.figure && view.figure.anchors) || [{ y: 0, qy: 0 }],
    };
  }
  view.canSplit = !!progress.canSplit;
  view.offerFormula = !!progress.offerFormula;
  if (progress.route && progress.route.engine === "product" && progress.phase === "algebra") {
    var productReady = (progress.algebra || []).some(function (line) { return productFactors(line); });
    if (!(progress.chain && progress.chain.split) && productReady) view.canSplit = true;
    else if (progress.chain && progress.chain.split && productQuadOpen(progress)) view.offerFormula = true;
  }
  if (progress.route && progress.chain && progress.chain.split && (progress.phase === "algebra" || progress.phase === "points")) {
    var fork = {
      eqs: progress.chain.eqs || [],
      solved: progress.chain.solved || [],
      heads: progress.chain.heads || [],
      trails: progress.chain.trails || [],
    };
    if (fork.eqs.length) {
      fork.trails = displayTrails(progress.chain);
      (progress.pointCols || []).forEach(function (col, index) {
        fork.trails[index] = (fork.trails[index] || []).concat(col || []);
      });
      if (progress.phase === "points") fork.keepMain = true;
      view.fork = fork;
      if (progress.phase === "algebra") view.input = "fork";
    }
  }
  return view;
}

function payload(engine, ex, progress, extra) {
  var out = {
    ok: true,
    progress: progress,
    view: viewFor(engine, ex, progress),
    solved: false,
  };
  Object.keys(extra || {}).forEach(function (key) {
    out[key] = extra[key];
  });
  if (!taskAt(ex, progress)) out.solved = true;
  if (!out.parallel && out.view && out.view.fork) {
    var liveParallel = chainParallel(progress);
    if (liveParallel) out.parallel = liveParallel;
  }
  return out;
}

function chainParallel(progress) {
  if (!progress.chain || !progress.chain.split) return null;
  var forkTrails = displayTrails(progress.chain);
  if (forkTrails.length < 2) return null;
  return {
    parallel: forkTrails.map(function (trail, index) {
      var steps = trail.slice();
      ((progress.pointCols || [])[index] || []).forEach(function (line) {
        if (steps.indexOf(line) < 0) steps.push(line);
      });
      return { label: (progress.chain.eqs || [])[index] || "", steps: steps };
    }),
  };
}

function rootsInText(text) {
  var src = String(text || "").replace(/[−–]/g, "-");
  var found = [];
  var pm = /x\s*=\s*±\s*(\d+(?:\.\d+)?)/g;
  var plus;
  while ((plus = pm.exec(src))) {
    found.push(Number(plus[1]));
    found.push(-Number(plus[1]));
  }
  var re = /x\s*=\s*(-?\d+(?:\.\d+)?)/g;
  var hit;
  while ((hit = re.exec(src))) found.push(Number(hit[1]));
  return found;
}

function columnIndexForRoot(Q, progress, x) {
  var chain = progress.chain || {};
  var eqs = chain.eqs || [];
  var trails = displayTrails(chain);
  var i;
  for (i = 0; i < Math.max(eqs.length, trails.length); i++) {
    var bag = rootsInText(eqs[i]).concat(rootsInText((trails[i] || []).join(" ")));
    if (bag.some(function (root) { return near(root, x); })) return i;
  }
  if (progress.route && progress.route.engine === "product" && progress.route.start) {
    var specs = productSpecs(Q, progress);
    for (i = 0; i < specs.length; i++) {
      if ((specs[i].roots || []).some(function (root) { return near(root, x); })) return i;
    }
  }
  return 0;
}

function placePointInColumn(Q, progress, x, text) {
  var index = columnIndexForRoot(Q, progress, x);
  progress.pointCols = progress.pointCols || [];
  while (progress.pointCols.length <= index) progress.pointCols.push([]);
  if (progress.pointCols[index].indexOf(text) < 0) progress.pointCols[index].push(text);
  var card = chainParallel(progress);
  if (card) progress.forkCard = card;
  return progress.forkCard;
}

function rememberSignSide(progress, side) {
  if (!side) return;
  progress.signSides = progress.signSides || {};
  progress.signSides[side] = (progress.signGot || []).slice();
}

function signColumnParallel(ex, progress) {
  var sides = [];
  (ex.tasks || []).forEach(function (task) {
    if (task.kind === "sign" && sides.indexOf(task.side) < 0) sides.push(task.side);
  });
  if (sides.length < 2) return null;
  var cols = sides.map(function (side) {
    return {
      label: side === "pos" ? "תחומי חיוביות" : "תחומי שליליות",
      steps: ((progress.signSides && progress.signSides[side]) || []).slice(),
    };
  });
  if (!cols.some(function (col) { return col.steps.length; })) return null;
  return { parallel: cols };
}

function archiveClosedFork(done, progress, forkShot) {
  if (!done || !forkShot || (done.view && done.view.fork)) return;
  if (done.parallel && done.parallel.parallel) return;
  var archived = chainParallel(progress);
  if (archived) done.parallel = archived;
}

function advance(ex, progress) {
  progress.task += 1;
  progress.phase = "";
  progress.algebra = [];
  progress.chain = null;
  progress.route = null;
  progress.paramEq = "";
  progress.formulaBranch = null;
  progress.formulaRole = "";
  progress.signGot = [];
  progress.canSplit = false;
  progress.offerFormula = false;
  progress.phase = openingPhase(taskAt(ex, progress));
}

function pointText(M, x, ex) {
  var label = ex && ex.round && Math.abs(x - Math.round(x)) > 1e-4 ? Number(x).toFixed(ex.round) : numText(M, x);
  return "(" + label + ", 0)";
}

function rememberZero(progress, at) {
  progress.known = progress.known || [];
  if (!progress.known.some(function (x) { return near(x, at); })) progress.known.push(at);
  if (!progress.points.some(function (p) { return near(p.x, at); })) progress.points.push({ x: at, y: 0 });
}

function wantedXs(Q, ex, task, progress) {
  if (task && task.kind === "collect") {
    return uniqueSorted([].concat(task.given || [], progress.known || []));
  }
  return expectedZeros(Q, ex);
}

function valueCall(M, at, value) {
  return "f(" + numText(M, at) + ")=" + numText(M, value);
}

function plugCall(M, expr, at) {
  return "f(" + numText(M, at) + ")=" + substX(expr, at);
}

function formatLinear(M, constant, coef, letter) {
  var noConstant = near(constant, 0);
  var noLetter = !letter || near(coef, 0);
  var cText = numText(M, constant);
  if (noLetter) return cText;
  var kText;
  if (near(coef, 1)) kText = letter;
  else if (near(coef, -1)) kText = "-" + letter;
  else kText = numText(M, coef) + letter;
  if (noConstant) return kText;
  if (coef < 0) return cText + kText;
  return cText + "+" + kText;
}

function computedCall(Q, M, expr, at, letter) {
  var shape = expectedShape(Q, expr, at, letter);
  if (!shape) return plugCall(M, expr, at);
  return "f(" + numText(M, at) + ")=" + formatLinear(M, shape.constant, shape.coef, letter);
}

function powerLeft(text) {
  return /[\^²³⁴]/.test(String(text || ""));
}

function hintsFor(engine, ex, progress) {
  var task = taskAt(ex, progress);
  var M = engine.DoctematicaFnModel;
  if (!task) return ["סיימתם את התרגיל."];
  if (task.kind === "zeros" && progress.phase === "setup") {
    return [
      "מהו ערך ה־y של כל נקודה שנמצאת על ציר ה־x?",
      "בנקודת חיתוך עם ציר ה־x מתקיים f(x) = 0.",
    ];
  }
  if (task.kind === "zeros" && progress.phase === "points") {
    return ["נמצאו ערכי x. רשמו כל נקודת חיתוך בצורה (x, 0). נקודה שמופיעה פעמיים נרשמת פעם אחת."];
  }
  if (task.kind === "solve" && progress.phase === "setup") {
    return [
      "כאן y ידוע, ומחפשים את x.",
      "כתבו את המשוואה f(x) = " + numText(M, task.y) + ".",
    ];
  }
  if (task.kind === "values" || task.kind === "verify") {
    var at = task.kind === "verify" ? task.at : currentValueAt(task, progress);
    if (task.kind === "verify") {
      return [
        "x כבר נתון. צריך להראות שמתקיים f(" + numText(M, task.at) + ") = 0.",
        "הציבו את x = " + numText(M, task.at) + " בפונקציה.",
      ];
    }
    return [
      "x נתון. הציבו אותו בפונקציה.",
      at == null ? "רשמו את ערך הפונקציה." : "חשבו את f(" + numText(M, at) + ").",
    ];
  }
  if (task.kind === "compare") {
    var openAt = [].concat(task.at || []).filter(function (x) {
      return progress.plugs[task.id + ":" + x] === "sub";
    })[0];
    if (openAt != null) {
      return ["החזקה מספרית. חשבו אותה, והשאירו את " + (ex.letter || "k") + "."];
    }
    return [
      "הציבו כל אחד מהערכים בנפרד.",
      "בבסיס שלילי החזקה נכתבת עם סוגריים, ו־(−3)^4 חיובי.",
      "חשבו את החזקה והשוו את שני הערכים.",
    ];
  }
  if (task.kind === "param") {
    if (progress.paramEq) {
      var act = engine.DoctematicaAlgebra.nextParamAction(progress.paramEq, { target: task.letter });
      if (act && act.hints && act.hints.length) return act.hints;
      return ["כעת " + task.letter + " הוא הנעלם. פתרו את המשוואה."];
    }
    return [
      "הנתון אומר להציב את x ואת y שניתנו.",
      "הציבו x = " + numText(M, task.x) + " ו־y = " + numText(M, task.y) + ".",
    ];
  }
  if (task.kind === "level") {
    return [
      "הישר y = k מקביל לציר ה־x.",
      "k > 0 אומר שהישר נמצא מעל ציר ה־x.",
      "בדקו כמה פעמים ישר כזה יכול לפגוש את הגרף.",
    ];
  }
  if (task.kind === "collect") {
    return ["השורשים כבר ידועים מהסעיפים הקודמים ומהנתונים. רשמו כל נקודת אפס בצורה (x, 0)."];
  }
  if (task.kind === "sign") {
    if (task.side === "neg") {
      return [
        "נקודות האפס מחלקות את ציר ה־x לתחומים. בדקו באילו מהם הגרף נמצא מתחת לציר.",
        "מתחת לציר ה־x מתקיים f(x) < 0.",
      ];
    }
    return [
      "נקודות האפס מחלקות את ציר ה־x לתחומים. בדקו באילו מהם הגרף נמצא מעל ציר ה־x.",
      "מעל ציר ה־x מתקיים f(x) > 0.",
    ];
  }
  var routed = algebraHint(engine, progress);
  if (routed) return [routed];
  return ["המשיכו לפי המשוואה שכבר כתובה."];
}

function productFallbackText() {
  return "הפתיחה נכונה ושקולה. למשוואה הכללית הזאת אין כלי המשך, ולכן ממשיכים מהמכפלה המקורית: כל גורם שווה לאפס.";
}

function sidesMatch(Q, equation, other) {
  var left = ascii(equation).split("=")[0];
  var typedLeft = ascii(other).split("=")[0];
  if (!typedLeft || typedLeft === left || ascii(other).indexOf("=0") < 0) return false;
  var samples = [0, 1, -1, 2, 3, 4];
  return samples.every(function (x) {
    var a = evalFn(Q, left, x);
    var b = evalFn(Q, typedLeft, x);
    return a != null && b != null && Math.abs(a - b) < 1e-4;
  });
}

function unsupportedProductExpansion(engine, progress) {
  if (!progress || !progress.route || progress.route.engine !== "product" || productIsSplit(progress)) return false;
  var last = progress.algebra && progress.algebra[progress.algebra.length - 1];
  if (!last || ascii(last) === ascii(progress.route.start)) return false;
  var Q = engine.DoctematicaQuadratic;
  if (classify(Q, last)) return false;
  return sidesMatch(Q, progress.route.start, last);
}

function algebraHint(engine, progress) {
  if (!progress.route) return "";
  if (progress.route.engine === "product" && !productSplitShown(engine.DoctematicaQuadratic, progress)) {
    if (unsupportedProductExpansion(engine, progress)) return productFallbackText();
    return "המשוואה כבר כתובה כמכפלה השווה לאפס. פצלו אותה למשוואות.";
  }
  if (progress.route.engine === "biquad" && !(progress.chain && progress.chain.split) && progress.algebra.length < 3) {
    return "מופיעות רק החזקות x^4 ו־x^2. אפשר להתייחס ל־x^2 כמשתנה חדש.";
  }
  var res = delegate(engine, progress, "hint", "");
  return (res && (res.hint || res.message)) || "";
}

function delegate(engine, progress, intent, typed) {
  var route = progress.route;
  if (!route) return { ok: false, message: "קודם כתבו את המשוואה." };
  var history = progress.algebra.length ? progress.algebra.slice() : [route.start];
  var body = {
    intent: intent,
    start: route.start,
    history: history,
    typed: typed,
    factor: progress.chain,
    formulaBranch: progress.formulaBranch,
    branch: progress.branchPick,
    md53: !!progress.md53,
  };
  if (route.engine === "product") return delegateProduct(engine, progress, intent, typed);
  if (route.engine === "biquad") return require("./biquad").handleBiquad(engine, body);
  if (route.engine === "chain") return require("./high-chain").handleHighChain(engine, body);
  if (route.engine === "root") return require("./high-root").handleHighRoot(engine, body);
  if (route.engine === "quad") return delegateQuad(engine, route, intent, typed);
  if (route.engine === "linear") return delegateLinear(engine, history, intent, typed);
  return { ok: false, message: "לא זיהיתי את סוג המשוואה." };
}

function evalMath(text) {
  var s = ascii(text).replace(/√(\d+(?:\.\d+)?)/g, function (_, n) {
    return "(" + Math.sqrt(Number(n)) + ")";
  });
  s = s.replace(/±/g, "+");
  if (!/^[0-9+\-*/^().]+$/.test(s)) return null;
  var Q = currentEngine && currentEngine.DoctematicaQuadratic;
  if (!Q) return null;
  return Q.evalExpr(s);
}

function valuesIn(text) {
  var raw = ascii(text);
  var out = [];
  function push(v) {
    if (v == null || !isFinite(v)) return;
    if (!out.some(function (have) { return near(have, v); })) out.push(v);
  }
  if (raw.indexOf("±") >= 0) {
    var plus = raw.replace(/±/g, "+");
    var minus = raw.replace(/±/g, "-");
    String(plus + "," + minus).split(",").forEach(function (piece) {
      var rhs = piece.indexOf("=") >= 0 ? piece.slice(piece.indexOf("=") + 1) : piece;
      push(evalMath(rhs));
    });
    return out;
  }
  raw.split(",").forEach(function (piece) {
    var rhs = piece.indexOf("=") >= 0 ? piece.slice(piece.indexOf("=") + 1) : piece;
    push(evalMath(rhs));
    var dec = rhs.match(/-?\d+\.\d+/);
    if (dec) push(Number(dec[0]));
  });
  return out;
}

function coversRoots(text, roots) {
  if (!roots || !roots.length) return false;
  var vals = valuesIn(text);
  if (!vals.length) return false;
  return roots.every(function (root) {
    return vals.some(function (v) { return Math.abs(v - root) < 5e-4; });
  });
}

function shortDecimals(text, roots, round) {
  if (!round) return false;
  var hits = String(text || "").match(/-?\d+\.\d+/g) || [];
  var i;
  for (i = 0; i < hits.length; i++) {
    var token = hits[i];
    var places = (token.split(".")[1] || "").length;
    var value = Number(token);
    var close = (roots || []).some(function (root) {
      return Math.abs(root - Math.round(root)) > 1e-4 && Math.abs(value - root) < 0.05;
    });
    if (close && places < round && (roots || []).every(function (root) { return Math.abs(value - root) > 5e-4; })) return true;
  }
  return false;
}

function productSpecs(Q, progress) {
  var factors = productFactors(progress.route.start) || [];
  return factors.map(function (factor) {
    var eq = factor.indexOf("=") >= 0 ? ascii(factor) : ascii(factor) + "=0";
    var parsed = null;
    try { parsed = Q.parseABC(eq); } catch (err) { parsed = null; }
    return { eq: eq, parsed: parsed, roots: factorRoots(Q, factor), linear: !!(parsed && !parsed.a && parsed.b) };
  });
}

function productIsSplit(progress) {
  return !!(progress.chain && progress.chain.split);
}

function productQuadOpen(progress) {
  var chain = progress.chain || {};
  return (chain.eqs || []).some(function (eq, index) {
    return !(chain.solved && chain.solved[index]) && /x\^2/.test(ascii(eq));
  });
}

function productChainOf(specs) {
  return {
    split: true,
    eqs: specs.map(function (spec) { return spec.eq; }),
    solvedFlags: specs.map(function () { return false; }),
    heads: specs.map(function (spec) { return spec.eq; }),
    trails: specs.map(function () { return []; }),
    pending: specs.map(function (_, index) { return index; }),
  };
}

function productChainPayload(chain, extra) {
  var solved = (chain.solvedFlags || chain.solved || []).slice();
  return Object.assign({
    split: true,
    eqs: (chain.eqs || []).slice(),
    solvedFlags: solved,
    heads: (chain.heads || []).slice(),
    trails: (chain.trails || []).map(function (row) { return (row || []).slice(); }),
    pending: solved.map(function (flag, index) { return flag ? -1 : index; }).filter(function (index) { return index >= 0; }),
  }, extra || {});
}

function touchProduct(progress, specs, index, line, solved) {
  var base = productIsSplit(progress) ? progress.chain : productChainOf(specs);
  var trails = (base.trails || specs.map(function () { return []; })).map(function (row) {
    return (row || []).slice();
  });
  var flags = (base.solved || base.solvedFlags || specs.map(function () { return false; })).slice();
  if (line && trails[index] && ascii(trails[index][trails[index].length - 1] || "") !== ascii(line)) trails[index].push(line);
  if (solved) flags[index] = true;
  return productChainPayload({
    eqs: base.eqs || specs.map(function (spec) { return spec.eq; }),
    heads: base.heads || specs.map(function (spec) { return spec.eq; }),
    trails: trails,
    solvedFlags: flags,
  });
}

function productFormulaEnter(Q, spec, index, md53) {
  var written = Q.analyze(spec.parsed.a, spec.parsed.b, spec.parsed.c, spec.eq);
  return {
    ok: true,
    enter: "formula",
    path: "formula",
    md53: !!md53,
    formulaEq: spec.eq,
    formulaBranch: index,
    view: { a: written.a, b: written.b, c: written.c, D: written.D, s: written.s, kind: written.kind },
    message: md53
      ? "md53: רשמו a, אחר כך b, אחר כך c. אחרי שלושתם מופיע הפתרון."
      : "הגורם הריבועי נפתר בנוסחת השורשים. קודם רושמים את a, את b ואת c.",
  };
}

function productSplitShown(Q, progress) {
  var specs = productSpecs(Q, progress);
  if (!specs.length) return false;
  return (progress.algebra || []).some(function (line) {
    var compact = ascii(line);
    return specs.every(function (spec) { return compact.indexOf(ascii(spec.eq)) >= 0; });
  });
}

function isolatedRoot(text, root) {
  var match = ascii(text).match(/^x=(.+)$/);
  if (!match) return false;
  var rhs = match[1];
  if (/[a-z√]/i.test(rhs)) return false;
  var body = rhs.replace(/^[+-]/, "");
  if (/[+-]/.test(body)) return false;
  var value = evalMath(rhs);
  return value != null && Math.abs(value - root) < 1e-6;
}

function branchSolved(spec, algebra) {
  return (algebra || []).some(function (line) {
    if (spec.linear) return isolatedRoot(line, spec.roots[0]);
    return coversRoots(line, spec.roots);
  });
}

function linearCursor(engine, spec, algebra) {
  var cur = spec.eq;
  (algebra || []).forEach(function (line) {
    var step = engine.DoctematicaAlgebra.checkStep(cur, line, { target: "x" });
    if (step && step.ok) cur = line;
  });
  return cur;
}

function delegateProduct(engine, progress, intent, typed) {
  var Q = engine.DoctematicaQuadratic;
  var specs = productSpecs(Q, progress);
  if (!specs.length) return { ok: false, message: "לא הצלחתי לקרוא את המכפלה." };
  function linesOf(index) {
    var trail = (progress.chain && progress.chain.trails && progress.chain.trails[index]) || [];
    return (progress.algebra || []).concat(trail);
  }
  function stillOpen() {
    return specs.filter(function (spec, index) {
      if (progress.chain && progress.chain.solved && progress.chain.solved[index]) return false;
      return !branchSolved(spec, linesOf(index));
    });
  }
  if (intent === "hint") {
    if (!productIsSplit(progress) && !productSplitShown(Q, progress)) {
      if (unsupportedProductExpansion(engine, progress)) return { ok: true, hint: productFallbackText() };
      return { ok: true, hint: "המשוואה כבר כתובה כמכפלה השווה לאפס. פצלו אותה למשוואות." };
    }
    var openNow = stillOpen();
    var hintAt = progress.branchPick != null && progress.branchPick !== "" ? Number(progress.branchPick) : -1;
    var hinted = hintAt >= 0 && specs[hintAt] && openNow.indexOf(specs[hintAt]) >= 0 ? specs[hintAt] : openNow[0];
    if (hinted && hinted.linear) return { ok: true, hint: "פתרו את " + hinted.eq + "." };
    if (hinted && hinted.parsed) return { ok: true, hint: "הגורם הריבועי נפתר בנוסחת השורשים, מהמקדמים a, b, c." };
    return { ok: true, hint: "רשמו את נקודות החיתוך." };
  }
  if (intent === "split" || (intent === "one-step" && !productIsSplit(progress))) {
    var splitMessage = unsupportedProductExpansion(engine, progress)
      ? productFallbackText()
      : "המשוואה כבר כתובה כמכפלה השווה לאפס. פצלו אותה למשוואות.";
    return productChainPayload(productChainOf(specs), {
      ok: true,
      message: splitMessage,
      hint: splitMessage,
    });
  }
  if (intent === "formula-enter") {
    var flags = (progress.chain && progress.chain.solved) || [];
    var chosen = specs.filter(function (spec, index) { return spec.parsed && spec.parsed.a && !flags[index]; })[0];
    if (!chosen) return { ok: false, message: "הענף הריבועי כבר נפתר." };
    return productFormulaEnter(Q, chosen, specs.indexOf(chosen), progress.md53);
  }
  if (intent === "one-step") {
    var pending = stillOpen();
    if (!pending.length) return { ok: true, solved: true, message: "כל הגורמים נפתרו." };
    var pickedAt = progress.branchPick != null && progress.branchPick !== "" ? Number(progress.branchPick) : -1;
    var chosen = pickedAt >= 0 && specs[pickedAt] && pending.indexOf(specs[pickedAt]) >= 0 ? specs[pickedAt] : null;
    var linear = chosen ? (chosen.linear ? chosen : null) : pending.filter(function (spec) { return spec.linear; })[0];
    if (linear) {
      var linearAt = specs.indexOf(linear);
      var cursor = linearCursor(engine, linear, linesOf(linearAt));
      var act = engine.DoctematicaAlgebra.nextParamAction(cursor, { target: "x" });
      var nextEq = act && act.eq ? act.eq : "x=" + linear.roots[0];
      var linearDone = isolatedRoot(nextEq, linear.roots[0]);
      return Object.assign(touchProduct(progress, specs, linearAt, nextEq, linearDone), {
        ok: true,
        which: linearAt,
        step: nextEq,
        message: (act && act.explain) || "פותרים את הגורם הלינארי.",
        solved: linearDone && pending.length === 1,
      });
    }
    var quad = chosen || pending[0];
    return productFormulaEnter(Q, quad, specs.indexOf(quad), progress.md53);
  }
  var compact = ascii(typed);
  if (/\/\(/.test(compact)) {
    return { ok: false, errorId: "lostFactor", message: "חלוקה בגורם שעלול להיות 0 מוחקת פתרון." };
  }
  var allRoots = [];
  specs.forEach(function (spec) { spec.roots.forEach(function (root) { allRoots.push(root); }); });
  if (shortDecimals(typed, allRoots, 3)) {
    return { ok: false, errorId: "earlyRound", message: "מוקדם לעגל. השאירו לפחות שלוש ספרות אחרי הנקודה, או את השורש המדויק." };
  }
  if (specs.every(function (spec) { return compact.indexOf(ascii(spec.eq)) >= 0; })) {
    return productChainPayload(productIsSplit(progress) ? progress.chain : productChainOf(specs), {
      ok: true,
      message: "המכפלה התפצלה. פתרו כל משוואה.",
    });
  }
  var one = specs.filter(function (spec) { return compact === ascii(spec.eq); })[0];
  if (one) {
    return Object.assign(touchProduct(progress, specs, specs.indexOf(one), "", false), {
      ok: true,
      message: "זה אחד הגורמים. פתרו אותו, ואחר כך את הגורם השני.",
    });
  }
  var solvedNow = specs.filter(function (spec) { return branchSolved(spec, progress.algebra.concat([typed])); });
  if (coversRoots(typed, allRoots) || solvedNow.length === specs.length) {
    return { ok: true, solved: true, step: typed, message: "כל הגורמים נפתרו." };
  }
  var hit = specs.filter(function (spec) {
    return spec.linear ? isolatedRoot(typed, spec.roots[0]) : coversRoots(typed, spec.roots);
  })[0];
  if (hit) {
    var hitAt = specs.indexOf(hit);
    var both = stillOpen().length <= 1;
    return Object.assign(touchProduct(progress, specs, hitAt, typed, true), {
      ok: true,
      which: hitAt,
      step: typed,
      message: both ? "כל הגורמים נפתרו." : "הגורם הזה נפתר. נשאר עוד גורם.",
      solved: both,
    });
  }
  var linearSpec = specs.filter(function (spec) { return spec.linear; })[0];
  if (linearSpec) {
    var moved = engine.DoctematicaAlgebra.checkStep(linearCursor(engine, linearSpec, linesOf(specs.indexOf(linearSpec))), typed, { target: "x" });
    if (moved && moved.ok) {
      return Object.assign(touchProduct(progress, specs, specs.indexOf(linearSpec), typed, false), {
        ok: true,
        which: specs.indexOf(linearSpec),
        step: typed,
        message: moved.message || "צעד חוקי בגורם הלינארי.",
      });
    }
  }
  var left = ascii(progress.route.start).split("=")[0];
  var typedLeft = compact.split("=")[0];
  if (typedLeft && typedLeft !== left && compact.indexOf("=0") >= 0) {
    var samples = [0, 1, -1, 2, 3, 4];
    var equivalent = samples.every(function (x) {
      var a = evalFn(Q, left, x);
      var b = evalFn(Q, typedLeft, x);
      return a != null && b != null && Math.abs(a - b) < 1e-4;
    });
    if (equivalent) {
      var continued = classify(Q, typed);
      if (continued && continued.engine && continued.engine !== "product") {
        progress.route = { engine: continued.engine, start: continued.start || typed };
        return { ok: true, step: typed, message: "הפתיחה נכונה. ממשיכים מהמשוואה החדשה." };
      }
      return { ok: true, step: typed, message: productFallbackText() };
    }
    if (/x\^3|x\^2/.test(typedLeft) && typedLeft.indexOf("(") < 0) {
      return { ok: false, errorId: "badExpansion", message: "פתיחת הסוגריים אינה שקולה למשוואה. אפשר לפצל את המכפלה בלי לפתוח." };
    }
  }
  return { ok: false, errorId: "product", message: "המשוואה כבר כתובה כמכפלה השווה לאפס. פצלו אותה למשוואות." };
}

function delegateQuad(engine, route, intent, typed) {
  var Q = engine.DoctematicaQuadratic;
  var parsed = Q.parseABC(route.start);
  var written = parsed ? Q.analyze(parsed.a, parsed.b, parsed.c, route.start) : null;
  if (!written) return { ok: false, message: "לא הצלחתי לקרוא את המשוואה הריבועית." };
  if (intent === "hint") {
    var mixedHint = require("./quad-mixed").handleMixed(engine, {
      intent: "hint",
      start: route.start,
      history: [route.start],
    });
    return { ok: true, hint: (mixedHint && mixedHint.hint) || "", path: mixedHint && mixedHint.path };
  }
  if (intent === "one-step") {
    return {
      ok: true,
      enter: "formula",
      path: "formula",
      view: { a: written.a, b: written.b, c: written.c, D: written.D, s: written.s, kind: written.kind },
      message: "המשוואה ריבועית. עוברים לנוסחת השורשים.",
    };
  }
  if (ascii(typed) === ascii(written.answer)) {
    return { ok: true, solved: true, message: "הפתרון: " + written.answer + "." };
  }
  return { ok: false, message: "פתרו את המשוואה הריבועית בנוסחת השורשים." };
}

function delegateLinear(engine, history, intent, typed) {
  var A = engine.DoctematicaAlgebra;
  var cur = history[history.length - 1];
  if (intent === "hint" || intent === "one-step") {
    if (A.hasParamLetter && A.hasParamLetter(cur)) {
      var act = A.nextParamAction(cur, { target: "x" });
      if (!act) return { ok: false, message: "אין צעד נוסף." };
      return {
        ok: true,
        step: act.eq || "",
        hint: act.hint || act.explain || "",
        message: act.explain || act.hint || "",
        solved: !!act.done && !act.eq,
      };
    }
    var teach = engine.DoctematicaTeach && engine.DoctematicaTeach.nextAction(cur);
    if (!teach || !teach.eq) return { ok: false, message: "אין צעד נוסף." };
    return {
      ok: true,
      step: teach.eq,
      hint: teach.hint || teach.explain || "",
      message: teach.explain || teach.hint || "",
      solved: !!teach.done && !teach.eq,
    };
  }
  return A.checkStep(cur, typed, { target: "x" }) || { ok: false, message: "הצעד לא שקול למשוואה." };
}

function forkHasLine(fork, line) {
  var want = ascii(line);
  if (!fork || !want) return false;
  return (fork.trails || []).some(function (trail) {
    return (trail || []).some(function (item) { return ascii(item) === want; });
  });
}

function displayTrails(chain) {
  var n = Math.max((chain.trails || []).length, (chain.eqs || []).length, (chain.work || []).length);
  var out = [];
  var i;
  for (i = 0; i < n; i++) {
    var row = ((chain.trails || [])[i] || []).slice();
    var extra = chain.work && chain.work[i] && chain.work[i].history ? chain.work[i].history : [];
    extra.forEach(function (line) {
      if (row.indexOf(line) < 0) row.push(line);
    });
    out.push(row);
  }
  return out;
}

function forkSnapshot(progress) {
  var chain = progress.chain;
  if (!chain || !chain.split || !(chain.trails && chain.trails.length)) return null;
  return {
    eqs: (chain.eqs || []).slice(),
    solved: (chain.solved || []).slice(),
    heads: (chain.heads || []).slice(),
    trails: displayTrails(chain),
  };
}

function rememberChain(progress, res) {
  if (!res) return;
  if (res.formulaBranch != null) progress.formulaBranch = res.formulaBranch;
  if (res.split || (res.trails && res.trails.length) || (progress.chain && progress.chain.split)) {
    var prev = progress.chain || {};
    progress.chain = {
      split: true,
      trails: res.trails || prev.trails || [],
      pending: res.pending || prev.pending || [],
      eqs: res.eqs || prev.eqs || [],
      solved: res.solvedFlags || prev.solved || [],
      heads: res.heads || prev.heads || [],
      work: prev.work || null,
    };
  }
}

function pushLine(progress, line) {
  if (!line) return;
  var last = progress.algebra[progress.algebra.length - 1];
  if (ascii(last || "") === ascii(line)) return;
  progress.algebra.push(String(line));
}

function engineSolved(res) {
  if (!res || res.ok === false) return false;
  if (res.solved || res.solvedAll) return true;
  if (res.done && !res.step && !res.enter) return true;
  return false;
}

function afterAlgebra(engine, ex, progress, task) {
  if (task.kind === "zeros") {
    progress.phase = "points";
    var chart = chartOf(engine.DoctematicaQuadratic, ex);
    var touches = (chart.zeros || []).filter(function (zero) { return zero.kind === "touch"; });
    var note = "נמצאו ערכי x. רשמו את נקודות החיתוך, כל אחת פעם אחת.";
    if (touches.length) note += " שורש כפול הוא נקודת חיתוך אחת, והגרף נוגע בציר בלי להחליף סימן.";
    return note;
  }
  advance(ex, progress);
  return "זהו הפתרון.";
}

function openAlgebra(Q, ex, task, typed) {
  var target = targetOf(Q, ex, task);
  if (!target) return fail("equation", "לא הצלחתי לבנות את המשוואה.");
  var compact = ascii(typed);
  if (task.kind === "zeros" && compact === "x=0") {
    return fail("axisSwap", "נקודת חיתוך עם ציר ה־x מקיימת y = 0, לא x = 0.");
  }
  if (task.kind === "solve" && /^f\([^x]/.test(compact)) {
    return fail("plugInsteadOfSolve", "כאן y ידוע. מחפשים את x, לא מחשבים ערך ב־x נתון.");
  }
  var claim =
    compact === "y=0" ||
    compact === "f(x)=0" ||
    (task.kind === "solve" && (compact === "y=" + task.y || compact === "f(x)=" + task.y));
  if (claim) {
    return {
      ok: true,
      route: { engine: target.engine, start: target.start },
      show: typed,
      opened: true,
    };
  }
  var got = classify(Q, typed);
  if (got && sameRoots(got.roots, target.roots)) {
    return {
      ok: true,
      route: { engine: got.engine, start: got.start },
      show: typed,
      opened: ascii(got.start) !== compact,
    };
  }
  if (task.kind === "zeros") return fail("notZero", "כדי לחתוך את ציר ה־x כותבים y = 0, כלומר f(x) = 0.");
  return fail("notLevel", "כתבו את המשוואה f(x) = " + task.y + ".");
}

function oddRootMistake(Q, progress, typed) {
  if (!progress.route || progress.route.engine !== "root") return null;
  if (!Q.isNoRealText(typed)) return null;
  var pack = null;
  try {
    pack = Q.analyzeHighRootStart(progress.route.start);
  } catch (err) {
    return null;
  }
  if (pack && pack.kind === "one" && pack.n % 2 === 1) {
    return fail("oddRoot", "החזקה אי־זוגית, ולכן למספר שלילי יש שורש ממשי.");
  }
  return null;
}

function finishIfSolved(engine, ex, progress, task, res) {
  if (!engineSolved(res)) return null;
  var note = afterAlgebra(engine, ex, progress, task);
  return payload(engine, ex, progress, {
    show: res.step || res.show || "",
    message: (res.message || "") + (note ? " " + note : ""),
    hint: hintsFor(engine, ex, progress)[0],
  });
}

function runAlgebra(engine, ex, progress, task, intent, typed) {
  var Q = engine.DoctematicaQuadratic;
  var odd = oddRootMistake(Q, progress, typed);
  if (odd) return odd;
  if (progress.formulaRole === "biquad" && intent === "check") {
    progress.formulaRole = "";
    var absorbed = require("./biquad").handleBiquad(engine, {
      intent: "absorb",
      start: progress.route.start,
      history: progress.algebra.length ? progress.algebra.slice() : [progress.route.start],
      factor: progress.chain,
      typed: typed,
    });
    if (!absorbed || absorbed.ok === false) {
      return {
        ok: false,
        errorId: absorbed && absorbed.errorId,
        message: (absorbed && absorbed.message) || "לא הצלחתי לקרוא את ערכי t.",
      };
    }
    rememberChain(progress, absorbed);
    if (absorbed.step) pushLine(progress, absorbed.step);
    var absorbedFork = forkSnapshot(progress);
    var absorbedDone = finishIfSolved(engine, ex, progress, task, absorbed);
    if (absorbedDone) {
      archiveClosedFork(absorbedDone, progress, absorbedFork);
      return absorbedDone;
    }
    return payload(engine, ex, progress, {
      show: absorbed.step || typed,
      message: absorbed.message || "נרשמו ערכי t. ממשיכים בכל ענף.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  var res = delegate(engine, progress, intent, typed);
  if (res && (res.enter === "formula" || (res.path === "formula" && res.view))) {
    rememberChain(progress, res);
    progress.formulaRole = progress.route && progress.route.engine === "biquad" ? "biquad" : "";
    if (res.formulaBranch != null) openFormulaWork(progress, res.formulaBranch);
    return payload(engine, ex, progress, {
      enter: "formula",
      path: "formula",
      view: res.view,
      formulaEq: res.formulaEq || "",
      formulaBranch: res.formulaBranch,
      message: res.message || res.hint || "",
      hint: res.hint || "",
      md53: !!res.md53,
    });
  }
  if (!res || res.ok === false) {
    return {
      ok: false,
      errorId: res && res.errorId,
      message: (res && res.message) || "הצעד לא שקול למשוואה.",
    };
  }
  rememberChain(progress, res);
  progress.canSplit = !!res.canSplit;
  progress.offerFormula = !!res.offerFormula;
  var line = intent === "one-step" || intent === "split" ? res.step || "" : typed;
  if (!line && res.eqs && res.eqs.length && !res.split) line = res.eqs.join(" או ");
  if (line && res.which == null && !res.split) pushLine(progress, line);
  var branchStep = res.which != null || (res.split && !res.step);
  var forkShot = forkSnapshot(progress);
  var done = finishIfSolved(engine, ex, progress, task, res);
  if (done) {
    if (!done.show) done.show = line;
    if (forkShot && forkHasLine(forkShot, done.show)) done.show = "";
    archiveClosedFork(done, progress, forkShot);
    return done;
  }
  return payload(engine, ex, progress, {
    show: branchStep ? "" : line,
    message: res.message || res.hint || "צעד חוקי.",
    hint: intent === "hint" ? res.hint || "" : hintsFor(engine, ex, progress)[0],
  });
}

function parsePoints(G, text) {
  var groups = String(text || "").match(/\([^)]+\)/g);
  if (!groups) {
    var one = G.parsePointPair(text);
    return one ? [one] : [];
  }
  return groups
    .map(function (group) {
      return G.parsePointPair(group);
    })
    .filter(Boolean);
}

function loosePoints(Q, G, text) {
  var direct = parsePoints(G, text);
  if (direct.length) return direct;
  var cleaned = String(text || "").replace(/√(\d+(?:\.\d+)?)/g, function (_, n) {
    return String(Math.sqrt(Number(n)));
  });
  return parsePoints(G, cleaned);
}

function matchesWanted(value, want, ex) {
  var tol = ex && ex.round ? 5e-4 : 1e-6;
  return want.some(function (x) { return Math.abs(value - x) < tol || near(value, displayRoot(ex, x)); });
}

function checkPoints(engine, ex, progress, typed) {
  var Q = engine.DoctematicaQuadratic;
  var M = engine.DoctematicaFnModel;
  var G = engine.DoctematicaGeometry;
  var task = taskAt(ex, progress);
  var want = wantedXs(Q, ex, task, progress);
  if (shortDecimals(typed, want, ex.round || 0)) {
    return fail("earlyRound", "מוקדם לעגל. השאירו לפחות שלוש ספרות אחרי הנקודה, או את השורש המדויק.");
  }
  var found = loosePoints(Q, G, typed);
  if (!found.length) {
    if (/^x=/i.test(ascii(typed)) || ascii(typed).indexOf("x=") >= 0) {
      return fail("pointsMissing", "מצאתם ערכי x. רשמו את נקודות החיתוך, כל אחת בצורה (x, 0).");
    }
    return fail("pointsMissing", "רשמו את נקודות החיתוך עם ציר ה־x.");
  }
  var seen = [];
  var i;
  for (i = 0; i < found.length; i++) {
    if (!near(found[i].y, 0)) return fail("notOnAxis", "נקודת חיתוך עם ציר ה־x נמצאת בגובה y = 0.");
    if (!matchesWanted(found[i].x, want, ex)) {
      return fail("wrongRoot", "הערך הזה אינו נקודת אפס של הפונקציה.");
    }
    if (seen.some(function (x) { return near(x, found[i].x) || Math.abs(x - found[i].x) < 5e-4; })) {
      return fail("duplicateZero", "זו אותה נקודת חיתוך. אין לרשום אותה פעמיים.");
    }
    seen.push(found[i].x);
  }
  var bag = progress.points.map(function (p) { return p.x; });
  seen.forEach(function (x) {
    if (!bag.some(function (have) { return Math.abs(have - x) < 5e-4; })) {
      bag.push(x);
      progress.points.push({ x: x, y: 0 });
      placePointInColumn(Q, progress, x, pointText(M, x, ex));
    }
  });
  var pointCard = progress.forkCard;
  if (bag.length < want.length) {
    var missingNote = progress.route && progress.route.engine === "product"
      ? "נכון, ועדיין חסרה נקודת חיתוך. חלוקה בגורם שעלול להיות 0 מוחקת פתרון."
      : "נכון, ועדיין חסרה נקודת חיתוך.";
    return payload(engine, ex, progress, {
      show: typed,
      parallel: pointCard,
      message: missingNote,
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  advance(ex, progress);
  return payload(engine, ex, progress, {
    show: typed,
    parallel: pointCard,
    message: "אלו נקודות החיתוך עם ציר ה־x.",
    hint: hintsFor(engine, ex, progress)[0],
  });
}

function nextValueAt(task, progress) {
  var list = task.at == null ? [] : [].concat(task.at);
  var i;
  for (i = 0; i < list.length; i++) {
    if (progress.plugs[task.id + ":" + list[i]] !== "value") return list[i];
  }
  return null;
}

function currentValueAt(task, progress) {
  var list = task.at == null ? [] : [].concat(task.at);
  var i;
  for (i = 0; i < list.length; i++) {
    if (progress.plugs[task.id + ":" + list[i]] === "sub") return list[i];
  }
  return nextValueAt(task, progress);
}

function barePower(M, text, at) {
  return !!(M && M.bareNegativePower && M.bareNegativePower(text, at));
}

function checkValues(engine, ex, progress, task, typed) {
  var Q = engine.DoctematicaQuadratic;
  var M = engine.DoctematicaFnModel;
  var G = engine.DoctematicaGeometry;
  var compact = ascii(typed);
  if (compact === "f(x)=0" || compact === "y=0") {
    return fail("solveInsteadOfPlug", "x כבר נתון. הציבו אותו בפונקציה, לא כתבו f(x) = 0.");
  }
  var list = [].concat(task.at);
  var calls = String(typed || "").match(/f\([^)]+\)=[^,]+/gi) || [];
  var chunks = calls.length ? calls : [typed];
  var used = false;
  var pendingCalc = false;
  var i;
  for (i = 0; i < chunks.length; i++) {
    var piece = chunks[i];
    var hit = null;
    var j;
    for (j = 0; j < list.length; j++) {
      if (mentionsAt(Q, M, G, ex.fn, piece, list[j])) {
        hit = list[j];
        break;
      }
    }
    if (hit == null && list.length === 1 && !G.parsePointPair(piece)) hit = list[0];
    if (hit == null) continue;
    if (barePower(M, piece, hit)) {
      return fail("bareNegativePower", "מספר שלילי בחזקה נכתב בסוגריים בבסיס: (" + numText(M, hit) + ")^n.");
    }
    var asPoint = G.parsePointPair(piece);
    if (asPoint && near(asPoint.x, hit)) {
      if (!near(asPoint.y, evalFn(Q, ex.fn, hit))) return fail("sign", "בדקו את הסימן אחרי ההצבה.");
      progress.plugs[task.id + ":" + hit] = "value";
      used = true;
      continue;
    }
    var verdict = judgePlug(Q, M, ex.fn, hit, piece, progress.plugs[task.id + ":" + hit]);
    if (!verdict.ok) return verdict;
    progress.plugs[task.id + ":" + hit] = verdict.stage;
    if (verdict.stage !== "value") pendingCalc = true;
    used = true;
  }
  if (!used) return fail("plug", "הציבו את הערך הנתון של x בפונקציה.");
  if (nextValueAt(task, progress) == null) {
    var zeroAt = [].concat(task.at).filter(function (at) {
      return progress.plugs[task.id + ":" + at] === "value" && near(evalFn(Q, ex.fn, at), 0);
    });
    zeroAt.forEach(function (at) { rememberZero(progress, at); });
    advance(ex, progress);
    return payload(engine, ex, progress, {
      show: typed,
      message: zeroAt.length ? "הערך הוא 0, ולכן גם זו נקודת אפס." : "זהו ערך הפונקציה.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  return payload(engine, ex, progress, {
    show: typed,
    message: pendingCalc ? "נכון. המשיכו לחשב את הערך." : "נכון. המשיכו לערך הבא.",
    hint: hintsFor(engine, ex, progress)[0],
  });
}

function mentionsAt(Q, M, G, expr, text, at) {
  var compact = ascii(text);
  var token = numText(M, at);
  if (compact.indexOf("f(" + token + ")") >= 0 || compact.indexOf("f(" + String(at) + ")") >= 0) return true;
  var point = G.parsePointPair(text);
  if (point && near(point.x, at)) return true;
  var bare = M.bareNumber(text);
  if (bare != null && !/f\(/i.test(text) && !/=/.test(compact)) return near(bare, evalFn(Q, expr, at));
  return false;
}

function judgePlug(Q, M, expr, at, text, stage) {
  var want = evalFn(Q, expr, at);
  var compact = ascii(text);
  var rhs = compact;
  var call = compact.match(/^f\([^)]+\)=(.+)$/i);
  var yLine = compact.match(/^y=(.+)$/i);
  if (call) rhs = call[1];
  else if (yLine) rhs = yLine[1];
  var bare = M.bareNumber(text);
  var rhsBare = M.bareNumber(rhs);
  if ((bare != null && near(bare, want)) || (rhsBare != null && near(rhsBare, want))) return { ok: true, stage: "value" };
  var rhsVal = Q.evalExpr(rhs);
  var sub = ascii(substX(expr, at));
  if (rhsVal != null && near(rhsVal, want) && rhs.indexOf("x") < 0) {
    return { ok: true, stage: "sub" };
  }
  if (ascii(rhs) === sub || shapeMatches(Q, rhs, sub, null)) return { ok: true, stage: "sub" };
  if (want != null && rhsVal != null && near(Math.abs(rhsVal), Math.abs(want)) && rhsVal * want < 0) {
    return fail("sign", "בדקו את הסימן אחרי ההצבה.");
  }
  return fail("plug", "ההצבה אינה מתאימה ל־x = " + numText(M, at) + ".");
}

function shapeMatches(Q, rhs, sub, letter) {
  var a = shapeOf(Q, rhs, letter);
  var b = shapeOf(Q, sub, letter);
  if (!a || !b) return false;
  return near(a.constant, b.constant) && near(a.coef, b.coef);
}

function checkVerify(engine, ex, progress, task, typed) {
  var Q = engine.DoctematicaQuadratic;
  var M = engine.DoctematicaFnModel;
  var compact = ascii(typed);
  if (compact === "f(x)=0" || compact === "y=0" || compact === "x=0") {
    return fail("solveInsteadOfPlug", "x כבר נתון. מציבים אותו ומראים שהערך הוא 0, לא פותרים למציאת x.");
  }
  if (task.at !== 0 && /f\(0\)/.test(compact)) {
    return fail("swappedPlug", "בודקים אם f(" + numText(M, task.at) + ") = 0, לא את f(0).");
  }
  if (barePower(M, typed, task.at)) {
    return fail("bareNegativePower", "מספר שלילי בחזקה נכתב בסוגריים בבסיס: (" + numText(M, task.at) + ")^n.");
  }
  var key = task.id + ":" + task.at;
  var verdict = judgePlug(Q, M, ex.fn, task.at, typed, progress.plugs[key]);
  if (!verdict.ok) return verdict;
  progress.plugs[key] = verdict.stage;
  var want = evalFn(Q, ex.fn, task.at);
  if (verdict.stage === "value" && near(want, 0)) {
    rememberZero(progress, task.at);
    advance(ex, progress);
    return payload(engine, ex, progress, {
      show: typed,
      message: "ההצבה נותנת 0, ולכן הפונקציה מתאפסת בנקודה זו.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  if (verdict.stage === "value") return fail("notZero", "הערך שהתקבל אינו 0.");
  return payload(engine, ex, progress, {
    show: typed,
    message: "ההצבה נכונה. חשבו עד שהתוצאה היא 0.",
    hint: "חשבו את החזקה ואת הכפל.",
  });
}

function checkCompare(engine, ex, progress, task, typed) {
  var Q = engine.DoctematicaQuadratic;
  var M = engine.DoctematicaFnModel;
  var letter = ex.letter || "k";
  if (barePower(M, typed, -3) || barePower(M, typed, task.at[0])) {
    var badAt = task.at.filter(function (x) { return x < 0; })[0];
    return fail("bareNegativePower", "מספר שלילי בחזקה נכתב בסוגריים בבסיס: (" + numText(M, badAt) + ")^4.");
  }
  var calls = String(typed || "").match(/f\([^)]+\)=[^,]+/gi) || [];
  if (!calls.length && ascii(typed).indexOf("f(") < 0) {
    return fail("compare", "הציבו כל ערך בפונקציה, למשל f(" + numText(M, task.at[0]) + ").");
  }
  var pieces = calls.length ? calls : [typed];
  var i;
  for (i = 0; i < pieces.length; i++) {
    var piece = pieces[i];
    var head = ascii(piece).match(/^f\(([^)]+)\)=(.+)$/i);
    if (!head) continue;
    var at = Q.evalExpr(head[1]);
    var slot = task.at.filter(function (x) { return near(x, at); })[0];
    if (slot == null) return fail("compare", "מציבים את הערכים שמופיעים בשאלה.");
    var got = shapeOf(Q, head[2], letter);
    var want = expectedShape(Q, ex.fn, slot, letter);
    if (!got || !want) return fail("compare", "לא הצלחתי לקרוא את ההצבה.");
    if (near(Math.abs(got.constant), Math.abs(want.constant)) && got.constant * want.constant < 0) {
      return fail("evenPowerSign", "(" + numText(M, slot) + ")^4 חיובי. המינוס נמצא בתוך הסוגריים, והחזקה זוגית.");
    }
    if (!near(got.constant, want.constant) || !near(got.coef, want.coef)) {
      return fail("compare", "ההצבה של x = " + numText(M, slot) + " אינה נכונה.");
    }
    progress.plugs[task.id + ":" + slot] = powerLeft(head[2]) ? "sub" : "value";
  }
  var ready = task.at.every(function (x) { return progress.plugs[task.id + ":" + x] === "value"; });
  if (!ready) {
    var open = task.at.some(function (x) { return progress.plugs[task.id + ":" + x] === "sub"; });
    return payload(engine, ex, progress, {
      show: typed,
      message: open ? "נכון. חשבו את החזקה." : "נכון. הציבו גם את הערך השני.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  var left = expectedShape(Q, ex.fn, task.at[0], letter);
  var right = expectedShape(Q, ex.fn, task.at[1], letter);
  if (!left || !right || !near(left.constant, right.constant) || !near(left.coef, right.coef)) {
    return fail("compare", "שני הערכים אינם שווים.");
  }
  advance(ex, progress);
  return payload(engine, ex, progress, {
    show: typed,
    message: "שני הערכים שווים, ולכן f(" + numText(M, task.at[0]) + ") = f(" + numText(M, task.at[1]) + ").",
    hint: hintsFor(engine, ex, progress)[0],
  });
}

function paramCanonical(M, constant, coef, letter, y) {
  var c = constant - y;
  var cText = numText(M, c);
  if (near(coef, -1)) return cText + "-" + letter + "=0";
  if (near(coef, 1)) return cText + "+" + letter + "=0";
  return cText + "+" + numText(M, coef) + letter + "=0";
}

function checkParam(engine, ex, progress, task, typed) {
  var Q = engine.DoctematicaQuadratic;
  var M = engine.DoctematicaFnModel;
  var A = engine.DoctematicaAlgebra;
  var letter = task.letter;
  var compact = ascii(typed);
  if (barePower(M, typed, task.x)) {
    return fail("bareNegativePower", "מספר שלילי בחזקה נכתב בסוגריים בבסיס: (" + numText(M, task.x) + ")^4.");
  }
  var want = expectedShape(Q, ex.fn, task.x, letter);
  if (!want) return fail("param", "לא הצלחתי לקרוא את הפונקציה.");
  var answer = (task.y - want.constant) / want.coef;
  var isolated = compact.match(new RegExp("^" + letter + "=([\\d./-]+)$", "i"));
  if (isolated) {
    var gotLetter = Q.evalExpr(isolated[1]);
    if (gotLetter != null && near(gotLetter, answer)) {
      advance(ex, progress);
      return payload(engine, ex, progress, { show: typed, message: "זהו ערך הפרמטר.", hint: hintsFor(engine, ex, progress)[0] });
    }
    if (gotLetter != null && near(gotLetter, -answer) && task.x < 0) {
      return fail("evenPowerSign", "(" + numText(M, task.x) + ")^4 חיובי. המינוס נמצא בתוך הסוגריים, והחזקה זוגית.");
    }
  }
  var canonical = paramCanonical(M, want.constant, want.coef, letter, task.y);
  if (!progress.paramEq) {
    var call = compact.match(/^f\([^)]+\)=(.+)$/i);
    var rhs = call ? call[1] : compact.split("=")[0];
    var asEq = compact.indexOf("=") >= 0 ? compact : "";
    var shaped = null;
    if (call) shaped = shapeOf(Q, call[1], letter);
    else if (asEq) {
      var sides = asEq.split("=");
      var left = shapeOf(Q, sides[0], letter);
      var right = shapeOf(Q, sides[1], letter);
      if (left && right) shaped = { constant: left.constant - right.constant, coef: left.coef - right.coef };
    }
    var zeroForm = { constant: want.constant - task.y, coef: want.coef };
    var target = call ? want : zeroForm;
    var sameDir = shaped && near(shaped.constant, target.constant) && near(shaped.coef, target.coef);
    var swapped = !call && shaped && near(shaped.constant, -target.constant) && near(shaped.coef, -target.coef);
    if (
      shaped &&
      !sameDir &&
      !swapped &&
      near(Math.abs(shaped.constant), Math.abs(target.constant)) &&
      shaped.constant * target.constant < 0 &&
      task.x < 0
    ) {
      return fail("evenPowerSign", "(" + numText(M, task.x) + ")^4 חיובי. המינוס נמצא בתוך הסוגריים, והחזקה זוגית.");
    }
    if (sameDir || swapped) {
      progress.paramEq = powerLeft(typed) ? typed : canonical;
      var jumped = A.checkStep(canonical, typed, { target: letter });
      if (jumped && jumped.ok && jumped.solved) {
        advance(ex, progress);
        return payload(engine, ex, progress, { show: typed, message: jumped.message || "זהו ערך הפרמטר.", hint: hintsFor(engine, ex, progress)[0] });
      }
      return payload(engine, ex, progress, {
        show: typed,
        message: "ההצבה נכונה. פתרו עבור " + letter + ".",
        hint: hintsFor(engine, ex, progress)[0],
      });
    }
    if (compact === "f(" + numText(M, task.x) + ")=" + numText(M, task.y) || compact === "f(" + String(task.x) + ")=0") {
      return payload(engine, ex, progress, {
        show: typed,
        message: "נכון שזה הנתון. כעת הציבו את x בפונקציה.",
        hint: hintsFor(engine, ex, progress)[0],
      });
    }
    var direct = A.checkStep(canonical, typed, { target: letter });
    if (direct && direct.ok && direct.solved) {
      advance(ex, progress);
      return payload(engine, ex, progress, { show: typed, message: direct.message || "זהו ערך הפרמטר.", hint: hintsFor(engine, ex, progress)[0] });
    }
    return fail("param", "הציבו x = " + numText(M, task.x) + " ו־y = " + numText(M, task.y) + ".");
  }
  var step = A.checkStep(progress.paramEq, typed, { target: letter });
  if (!step || !step.ok) {
    var act = A.nextParamAction(progress.paramEq, { target: letter });
    if (act && act.eq && ascii(act.eq) === compact) step = A.checkStep(progress.paramEq, act.eq, { target: letter });
  }
  if (!step || !step.ok) return fail((step && step.errorId) || "param", (step && step.message) || "הצעד לא שקול למשוואה.");
  if (step.solved) {
    advance(ex, progress);
    return payload(engine, ex, progress, { show: typed, message: step.message || "זהו ערך הפרמטר.", hint: hintsFor(engine, ex, progress)[0] });
  }
  progress.paramEq = typed;
  return payload(engine, ex, progress, { show: typed, message: step.message || "צעד חוקי.", hint: hintsFor(engine, ex, progress)[0] });
}

var TOUCH_NOTE = "שימו לב: הגרף נוגע בציר ה־x בנקודה הזו, אך אינו בהכרח עובר מצד אחד של הציר לצד השני.";

function savedIntervals(M, progress) {
  var out = [];
  (progress.signGot || []).forEach(function (row) {
    var parsed = M.parseRegionList(row);
    (parsed || []).forEach(function (interval) { out.push(interval); });
  });
  return out;
}

function checkSign(engine, ex, progress, task, domains) {
  var Q = engine.DoctematicaQuadratic;
  var M = engine.DoctematicaFnModel;
  var text = domains && domains[task.side];
  if (!text) return fail("interval", "כתבו את התחום.");
  if (/y/i.test(ascii(text))) return fail("yBound", "גבול התחום הוא ערך של x, לא של y.");
  var fresh = M.parseRegionList(text);
  if (!fresh) return fail("unparsedInterval", "כתבו תחום, למשל x < −4 או −4 < x < 0.");
  var prior = savedIntervals(M, progress);
  var list = prior.concat(fresh);
  var chart = chartOf(Q, ex);
  var synthetic = { regions: chart.regions, zeros: chart.zeros };
  var expected = signGraph.intervalsFor(chart.regions, task.side);
  var otherSide = task.side === "pos" ? "neg" : "pos";
  var other = signGraph.intervalsFor(chart.regions, otherSide);
  if (M.sameIntervalSet(list, other) && !M.sameIntervalSet(list, expected)) {
    return fail("positiveNegativeReversed", "בדקו את מיקום הגרף ביחס לציר ה־x: מעל הציר ערכי הפונקציה חיוביים.");
  }
  var judged = signGraph.diagnose(
    M,
    synthetic,
    task.side === "pos" ? list : other,
    task.side === "neg" ? list : other
  );
  if (M.sameIntervalSet(list, expected)) {
    progress.signGot = expected.map(function (interval) { return M.formatIntervalSet([interval]); });
    rememberSignSide(progress, task.side);
    advance(ex, progress);
    return payload(engine, ex, progress, {
      show: text,
      parallel: signColumnParallel(ex, progress),
      message: task.side === "pos" ? "אלו התחומים שבהם הגרף מעל ציר ה־x." : "אלו התחומים שבהם הגרף מתחת לציר ה־x.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  var take = M.takeRegions(list, expected);
  if (take.partial && !take.foreign) {
    var before = (progress.signGot || []).length;
    progress.signGot = take.matched.map(function (interval) { return M.formatIntervalSet([interval]); });
    var left = expected.length - take.matched.length;
    var more = left > 1 ? "יש עוד תחומים." : "יש עוד תחום.";
    var grew = progress.signGot.length > before;
    rememberSignSide(progress, task.side);
    return payload(engine, ex, progress, {
      show: text,
      parallel: signColumnParallel(ex, progress),
      message: grew ? "התחום הזה נכון, ו" + more : "את התחום הזה כבר רשמתם. " + more,
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  if (!judged.ok) {
    var message = judged.message;
    var hasTouch = (chart.zeros || []).some(function (zero) { return zero.kind === "touch"; });
    if (hasTouch && (judged.errorId === "touchingTreatedAsCrossing" || judged.errorId === "wrongSignAfterTouch" || judged.errorId === "wrongDoubleInterval")) {
      message = TOUCH_NOTE;
    }
    return {
      ok: false,
      errorId: judged.errorId,
      message: message,
      progress: progress,
      view: viewFor(engine, ex, progress),
    };
  }
  return fail(judged.errorId || "interval", judged.message || "התחום אינו מתאים לגרף.");
}

function readCount(text) {
  var s = String(text || "").replace(/\s+/g, "");
  if (s === "2" || s === "שתיים" || s === "שני") return 2;
  if (s === "0" || s === "אפס") return 0;
  if (s === "1" || s === "אחת" || s === "אחד") return 1;
  if (s === "3" || s === "שלוש") return 3;
  if (s === "4" || s === "ארבע") return 4;
  var m = s.match(/^-?\d+$/);
  return m ? Number(m[0]) : null;
}

function probeKnots(Q, ex) {
  var win = ex.window || { lo: -5, hi: 5 };
  var n = 80;
  var samples = [];
  var i;
  for (i = 0; i <= n; i++) {
    var x = win.lo + ((win.hi - win.lo) * i) / n;
    var y = evalFn(Q, ex.fn, x);
    samples.push(y == null ? 0 : y);
  }
  var knots = [{ y: "inf", kind: "end" }];
  for (i = 1; i < samples.length - 1; i++) {
    var a = samples[i - 1];
    var b = samples[i];
    var c = samples[i + 1];
    if (b <= a && b <= c && (b < a || b < c)) knots.push({ y: b, kind: "min" });
    else if (b >= a && b >= c && (b > a || b > c)) knots.push({ y: b, kind: "max" });
  }
  knots.push({ y: "inf", kind: "end" });
  return knots;
}

function checkLevel(engine, ex, progress, task, body) {
  var typed = String((body && body.typed) || "").trim();
  var compact = ascii(typed);
  if (/k[<>]|y[<>]/.test(compact)) {
    return fail("levelRange", "השאלה מבקשת את מספר נקודות החיתוך, לא תחום של k.");
  }
  var said = readCount(typed);
  if (said == null) return fail("count", "רשמו כמה נקודות חיתוך יש לישר עם הגרף.");
  var probe = body && body.probe;
  if (probe && probe.on && !(Number(probe.qy) > 0.02)) {
    return fail("belowAxis", "k > 0 אומר שהישר נמצא מעל ציר ה־x.");
  }
  var knots = probeKnots(engine.DoctematicaQuadratic, ex);
  var want = task.count != null ? task.count : levelProbe.probeCount(knots, 1);
  if (said !== want) {
    return fail("count", "ספרו שוב את המפגשים של ישר שמעל ציר ה־x עם הגרף.");
  }
  advance(ex, progress);
  return payload(engine, ex, progress, {
    show: typed,
    message: "ישר מעל ציר ה־x פוגש את הגרף ב־" + want + " נקודות.",
    hint: hintsFor(engine, ex, progress)[0],
  });
}

function probeCheck(engine, ex, progress, body) {
  var probe = body && body.probe;
  if (!probe || !probe.on) {
    return payload(engine, ex, progress, {
      probeMarkers: [],
      message: "הוסיפו ישר אופקי. k > 0 אומר שהישר נמצא מעל ציר ה־x.",
    });
  }
  if (!(Number(probe.qy) > 0.02)) {
    progress.probeReady = false;
    return payload(engine, ex, progress, {
      probeMarkers: [],
      message: "k > 0 אומר שהישר נמצא מעל ציר ה־x.",
    });
  }
  progress.probeReady = true;
  var figure = figureOf(engine.DoctematicaQuadratic, engine.DoctematicaFnModel, ex, progress.points);
  var markers = levelProbe.crossings(figure && figure.curve, probe.qy);
  return payload(engine, ex, progress, {
    probeMarkers: markers,
    message: "הישר מעל הציר. ספרו כמה פעמים הוא פוגש את הגרף.",
  });
}

function checkTyped(engine, ex, progress, body) {
  var task = taskAt(ex, progress);
  if (!task) return payload(engine, ex, progress, { message: "סיימתם את התרגיל.", solved: true });
  if (task.kind === "sign") return checkSign(engine, ex, progress, task, body.domains || {});
  if (task.kind === "level") return checkLevel(engine, ex, progress, task, body);
  var typed = String((body && body.typed) || "").trim();
  if (!typed) return fail("empty", "כתבו שלב.");
  if (body.branch != null && body.branch !== "") progress.branchPick = body.branch;
  if (task.kind === "collect") {
    if (ascii(typed) === "f(x)=0" || ascii(typed) === "y=0") {
      return fail("alreadyKnown", "השורשים כבר ידועים מהסעיפים הקודמים ומהנתונים. רשמו את נקודות האפס.");
    }
    return checkPoints(engine, ex, progress, typed);
  }
  if (task.kind === "values") return checkValues(engine, ex, progress, task, typed);
  if (task.kind === "verify") return checkVerify(engine, ex, progress, task, typed);
  if (task.kind === "compare") return checkCompare(engine, ex, progress, task, typed);
  if (task.kind === "param") return checkParam(engine, ex, progress, task, typed);
  if (progress.phase === "points") return checkPoints(engine, ex, progress, typed);
  if (progress.phase === "setup") {
    var opened = openAlgebra(engine.DoctematicaQuadratic, ex, task, typed);
    if (!opened.ok) return opened;
    progress.route = opened.route;
    progress.phase = "algebra";
    if (!opened.opened) pushLine(progress, opened.route.start);
    return payload(engine, ex, progress, {
      show: typed,
      message: opened.opened ? "נכון. כעת פותרים את המשוואה שהתקבלה." : "נכון. ממשיכים לפתור את המשוואה.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  return runAlgebra(engine, ex, progress, task, "check", typed);
}

function oneStep(engine, ex, progress) {
  var task = taskAt(ex, progress);
  var Q = engine.DoctematicaQuadratic;
  var M = engine.DoctematicaFnModel;
  var A = engine.DoctematicaAlgebra;
  if (!task) return payload(engine, ex, progress, { message: "אין צעד נוסף.", solved: true });
  if (task.kind === "zeros" || task.kind === "solve") {
    if (progress.phase === "setup") {
      var claim = task.kind === "zeros" ? "f(x)=0" : "f(x)=" + numText(M, task.y);
      var opened = openAlgebra(Q, ex, task, claim);
      progress.route = opened.route;
      progress.phase = "algebra";
      return payload(engine, ex, progress, {
        show: claim,
        message: task.kind === "zeros" ? "על ציר ה־x מתקיים y = 0, ולכן f(x) = 0." : "y נתון, ולכן כותבים את המשוואה.",
        hint: hintsFor(engine, ex, progress)[0],
      });
    }
    if (progress.phase === "points") {
      var want = expectedZeros(Q, ex);
      var missing = want.filter(function (x) {
        return !progress.points.some(function (p) { return Math.abs(p.x - x) < (ex.round ? 5e-4 : 1e-6); });
      });
      if (!missing.length) {
        advance(ex, progress);
        return payload(engine, ex, progress, { message: "כל נקודות החיתוך נרשמו.", hint: hintsFor(engine, ex, progress)[0] });
      }
      progress.points.push({ x: missing[0], y: 0 });
      var show = pointText(M, missing[0], ex);
      var pointCard = placePointInColumn(Q, progress, missing[0], show);
      if (progress.points.length >= want.length) advance(ex, progress);
      return payload(engine, ex, progress, {
        show: show,
        parallel: pointCard,
        message: "נקודת החיתוך היא נקודה על ציר ה־x.",
        hint: hintsFor(engine, ex, progress)[0],
      });
    }
    if (progress.algebra.length === 0 && progress.route) {
      pushLine(progress, progress.route.start);
      return payload(engine, ex, progress, {
        show: progress.route.start,
        message: "זו המשוואה שצריך לפתור.",
        hint: hintsFor(engine, ex, progress)[0],
      });
    }
    return runAlgebra(engine, ex, progress, task, "one-step", "");
  }
  if (task.kind === "values") {
    var at = currentValueAt(task, progress);
    if (at == null) {
      advance(ex, progress);
      return payload(engine, ex, progress, { message: "כל הערכים חושבו.", hint: hintsFor(engine, ex, progress)[0] });
    }
    var key = task.id + ":" + at;
    var showValue = progress.plugs[key] === "sub" ? valueCall(M, at, evalFn(Q, ex.fn, at)) : plugCall(M, ex.fn, at);
    progress.plugs[key] = progress.plugs[key] === "sub" ? "value" : "sub";
    if (progress.plugs[key] === "value" && near(evalFn(Q, ex.fn, at), 0)) rememberZero(progress, at);
    if (progress.plugs[key] === "value" && nextValueAt(task, progress) == null) advance(ex, progress);
    return payload(engine, ex, progress, {
      show: showValue,
      message: progress.plugs[key] === "value" || progress.task !== taskAt(ex, progress) ? "מחשבים את ההצבה." : "מציבים את x הנתון.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  if (task.kind === "verify") {
    var vkey = task.id + ":" + task.at;
    if (progress.plugs[vkey] !== "sub") {
      progress.plugs[vkey] = "sub";
      return payload(engine, ex, progress, {
        show: plugCall(M, ex.fn, task.at),
        message: "מציבים את x שכבר נתון.",
        hint: hintsFor(engine, ex, progress)[0],
      });
    }
    progress.plugs[vkey] = "value";
    rememberZero(progress, task.at);
    advance(ex, progress);
    return payload(engine, ex, progress, {
      show: valueCall(M, task.at, 0),
      message: "החישוב נותן 0, ולכן זו נקודת אפס.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  if (task.kind === "compare") {
    var pending = task.at.filter(function (x) { return progress.plugs[task.id + ":" + x] === "sub"; })[0];
    if (pending == null) pending = task.at.filter(function (x) { return progress.plugs[task.id + ":" + x] !== "value"; })[0];
    if (pending == null) {
      advance(ex, progress);
      return payload(engine, ex, progress, { message: "שני הערכים שווים.", hint: hintsFor(engine, ex, progress)[0] });
    }
    var cmpKey = task.id + ":" + pending;
    var rawCmp = plugCall(M, ex.fn, pending);
    var doneCmp = computedCall(Q, M, ex.fn, pending, ex.letter || "k");
    if (progress.plugs[cmpKey] !== "sub" && ascii(rawCmp) !== ascii(doneCmp)) {
      progress.plugs[cmpKey] = "sub";
      return payload(engine, ex, progress, {
        show: rawCmp,
        message: "מציבים את x הנתון. עכשיו מחשבים את החזקה.",
        hint: hintsFor(engine, ex, progress)[0],
      });
    }
    progress.plugs[cmpKey] = "value";
    var both = task.at.every(function (x) { return progress.plugs[task.id + ":" + x] === "value"; });
    if (both) advance(ex, progress);
    return payload(engine, ex, progress, {
      show: doneCmp,
      message: both ? "שני הערכים זהים, ולכן הפונקציה מקבלת אותו ערך." : "החזקה חושבה. נשאר עוד ערך.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  if (task.kind === "param") {
    if (!progress.paramEq) {
      var shape = expectedShape(Q, ex.fn, task.x, task.letter);
      progress.paramEq = substX(ex.fn, task.x) + "=" + numText(M, task.y);
      return payload(engine, ex, progress, {
        show: progress.paramEq,
        message: "מציבים את x ואת y שניתנו.",
        hint: hintsFor(engine, ex, progress)[0],
      });
    }
    var act = A.nextParamAction(progress.paramEq, { target: task.letter });
    if (!act || !act.eq || act.done) {
      var shapeNow = expectedShape(Q, ex.fn, task.x, task.letter);
      var isolated = task.letter + "=" + numText(M, (task.y - shapeNow.constant) / shapeNow.coef);
      advance(ex, progress);
      return payload(engine, ex, progress, { show: isolated, message: "בודדו את הפרמטר.", hint: hintsFor(engine, ex, progress)[0] });
    }
    var moved = A.checkStep(progress.paramEq, act.eq, { target: task.letter });
    progress.paramEq = act.eq;
    if (moved && moved.solved) advance(ex, progress);
    return payload(engine, ex, progress, {
      show: act.eq,
      message: act.explain || act.hint || "ממשיכים בפתרון.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  if (task.kind === "collect") {
    var wantCollect = wantedXs(Q, ex, task, progress);
    var missingCollect = wantCollect.filter(function (x) {
      return !progress.points.some(function (p) { return near(p.x, x); });
    });
    if (!missingCollect.length) {
      advance(ex, progress);
      return payload(engine, ex, progress, { message: "כל נקודות האפס נרשמו.", hint: hintsFor(engine, ex, progress)[0] });
    }
    progress.points.push({ x: missingCollect[0], y: 0 });
    if (progress.points.filter(function (p) {
      return wantCollect.some(function (x) { return near(p.x, x); });
    }).length >= wantCollect.length) advance(ex, progress);
    return payload(engine, ex, progress, {
      show: pointText(M, missingCollect[0], ex),
      message: "השורש כבר ידוע. רושמים את נקודת האפס.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  if (task.kind === "level") {
    var count = task.count != null ? task.count : levelProbe.probeCount(probeKnots(Q, ex), 1);
    advance(ex, progress);
    return payload(engine, ex, progress, {
      show: String(count),
      message: "ישר y = k מעל ציר ה־x פוגש את הגרף ב־" + count + " נקודות.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  if (task.kind === "sign") {
    var chart = chartOf(Q, ex);
    var expected = signGraph.intervalsFor(chart.regions, task.side);
    var have = progress.signGot || [];
    if (have.length >= expected.length) {
      advance(ex, progress);
      return payload(engine, ex, progress, { message: "התחום נרשם.", hint: hintsFor(engine, ex, progress)[0] });
    }
    var next = M.formatIntervalSet([expected[have.length]]);
    progress.signGot = have.concat([next]);
    rememberSignSide(progress, task.side);
    if (progress.signGot.length >= expected.length) advance(ex, progress);
    return payload(engine, ex, progress, {
      show: next,
      parallel: signColumnParallel(ex, progress),
      message: task.side === "pos" ? "בחלק הזה הגרף מעל ציר ה־x, ולכן f(x) > 0." : "בחלק הזה הגרף מתחת לציר ה־x, ולכן f(x) < 0.",
      hint: hintsFor(engine, ex, progress)[0],
    });
  }
  return fail("step", "אין צעד נוסף.");
}

function solutionSteps(engine, ex) {
  var Q = engine.DoctematicaQuadratic;
  var M = engine.DoctematicaFnModel;
  var steps = [];
  var notes = [];
  function add(step, note) {
    if (step && step.parallel) {
      steps.push(step);
      notes.push(note || step.explain || "");
      return;
    }
    if (steps.length && ascii(steps[steps.length - 1]) === ascii(step)) {
      if (note && !notes[notes.length - 1]) notes[notes.length - 1] = note;
      return;
    }
    steps.push(step);
    notes.push(note || "");
  }
  var signCols = [];
  function flushSign() {
    if (!signCols.length) return;
    if (signCols.length >= 2) {
      add({
        parallel: signCols.map(function (col) {
          return { label: col.label, steps: col.steps };
        }),
      }, signCols.map(function (col) { return col.note; }).filter(Boolean).join(" "));
    } else {
      add(signCols[0].steps[0], signCols[0].note || "");
    }
    signCols = [];
  }
  (ex.tasks || []).forEach(function (task, index) {
    var part = (ex.parts || [])[index];
    if (task.part) {
      (ex.parts || []).forEach(function (item) {
        if (item.label === task.part) part = item;
      });
    }
    if (task.kind !== "sign") flushSign();
    if (part && part.label && steps.indexOf("משימה:" + part.label) < 0) add("משימה:" + part.label, "");
    if (task.kind === "zeros" || task.kind === "solve") {
      var target = targetOf(Q, ex, task);
      if (task.kind === "zeros") add("f(x)=0", "כדי למצוא חיתוך עם ציר ה־x דורשים y = 0.");
      else add("f(x)=" + numText(M, task.y), "y נתון, ולכן פותרים משוואה עבור x.");
      if (target) {
        add(target.start, "זו המשוואה שמועברת למנוע המתאים.");
        if (target.engine === "chain") {
          try {
            var chain = Q.analyzeHighChainStart(target.start);
            (chain.steps || []).forEach(function (step) {
              if (step && step.parallel) {
                var fork = step;
                if (task.kind === "zeros") {
                  var chainCols = (step.parallel || []).map(function (col) {
                    return { label: col.label || "", steps: (col.steps || []).slice() };
                  });
                  expectedZeros(Q, ex).forEach(function (x) {
                    var at = 0;
                    chainCols.forEach(function (col, index) {
                      var blob = [col.label].concat((col.steps || []).map(function (bit) {
                        return bit && bit.eq != null ? bit.eq : bit;
                      })).join(" ");
                      if (rootsInText(blob).some(function (root) { return near(root, x); })) at = index;
                    });
                    var point = pointText(M, x, ex);
                    if (chainCols[at].steps.indexOf(point) < 0) chainCols[at].steps.push(point);
                  });
                  fork = { parallel: chainCols, explain: step.explain };
                }
                add(fork, step.explain || "");
              } else add(String(step.eq || step), String(step.explain || ""));
            });
          } catch (err) {}
        } else if (target.engine === "root") {
          try {
            var root = Q.analyzeHighRootStart(target.start);
            (root.steps || []).forEach(function (step) {
              add(String(step), "");
            });
          } catch (err2) {}
        } else if (target.engine === "product") {
          var specs = productSpecs(Q, { route: { start: target.start }, algebra: [] });
          var cols = specs.map(function (spec) {
            var col = [spec.eq];
            if (spec.linear) {
              var cur = spec.eq;
              var guard = 0;
              while (guard < 6) {
                var act = engine.DoctematicaAlgebra.nextParamAction(cur, { target: "x" });
                if (!act || !act.eq) break;
                col.push(act.eq);
                if (isolatedRoot(act.eq, spec.roots[0])) break;
                cur = act.eq;
                guard += 1;
              }
            } else if (spec.parsed && spec.parsed.a) {
              var written = Q.analyze(spec.parsed.a, spec.parsed.b, spec.parsed.c, spec.eq);
              (written.steps || []).forEach(function (step) {
                col.push(String(step));
              });
              if (written.s == null) col.push(radicalLine(spec.parsed));
            }
            return { label: spec.eq, steps: col };
          });
          if (task.kind === "zeros") {
            expectedZeros(Q, ex).forEach(function (x) {
              var at = 0;
              specs.forEach(function (spec, index) {
                if ((spec.roots || []).some(function (root) { return near(root, x); })) at = index;
              });
              var point = pointText(M, x, ex);
              if (cols[at].steps.indexOf(point) < 0) cols[at].steps.push(point);
            });
          }
          add({
            parallel: cols,
            explain: "המשוואה כבר כתובה כמכפלה השווה לאפס. פצלו אותה למשוואות.",
          }, "המשוואה כבר כתובה כמכפלה השווה לאפס. פצלו אותה למשוואות.");
        } else if (target.engine === "biquad" && currentEngine && currentEngine.DoctematicaBiquad) {
          try {
            var bi = currentEngine.DoctematicaBiquad.analyzeBiquadStart(target.start);
            (bi.steps || []).forEach(function (step) {
              add(String(step.eq || step), String(step.explain || ""));
            });
          } catch (errBi) {}
        } else if (target.answer) add(target.answer, "פותרים במנוע המתאים לסוג המשוואה.");
      }
      if (task.kind === "zeros" && !(target && (target.engine === "product" || target.engine === "chain"))) {
        expectedZeros(Q, ex).forEach(function (x) {
          add(pointText(M, x, ex), "אחרי שנמצא x רושמים את הנקודה על ציר ה־x. שורש כפול הוא נקודה אחת.");
        });
      }
    } else if (task.kind === "values") {
      [].concat(task.at).forEach(function (at) {
        add(plugCall(M, ex.fn, at), "מציבים את x הנתון.");
        add(valueCall(M, at, evalFn(Q, ex.fn, at)), "מחשבים את הערך.");
      });
    } else if (task.kind === "verify") {
      add(plugCall(M, ex.fn, task.at), "x נתון, ולכן זו בדיקה ולא חיפוש של נקודת אפס.");
      add(valueCall(M, task.at, evalFn(Q, ex.fn, task.at)), "התוצאה 0 מראה שהפונקציה מתאפסת בנקודה זו.");
    } else if (task.kind === "compare") {
      task.at.forEach(function (at) {
        var rawCmp = plugCall(M, ex.fn, at);
        var doneCmp = computedCall(Q, M, ex.fn, at, ex.letter || "k");
        add(rawCmp, "מציבים כל ערך. בבסיס שלילי שומרים על הסוגריים.");
        add(doneCmp, "מחשבים את החזקה המספרית. הפרמטר נשאר.");
      });
      add(
        "f(" + numText(M, task.at[0]) + ")=f(" + numText(M, task.at[1]) + ")",
        "אחרי החישוב שני הערכים זהים."
      );
    } else if (task.kind === "param") {
      add(substX(ex.fn, task.x) + "=" + numText(M, task.y), "מציבים את x ואת y שניתנו, ופותרים עבור הפרמטר.");
      var shape = expectedShape(Q, ex.fn, task.x, task.letter);
      if (shape) {
        add(formatLinear(M, shape.constant, shape.coef, task.letter) + "=" + numText(M, task.y), "מחשבים את החזקה המספרית.");
        add(task.letter + "=" + numText(M, (task.y - shape.constant) / shape.coef), "בודדו את הפרמטר.");
      }
    } else if (task.kind === "sign") {
      var chart = chartOf(Q, ex);
      if (!signCols.length) {
        add(
          "נקודות האפס מחלקות את ציר ה־x לתחומים",
          "לפי הגרף בודקים היכן העקומה מעל הציר והיכן מתחתיו."
        );
      }
      signCols.push({
        label: task.side === "pos" ? "תחומי חיוביות" : "תחומי שליליות",
        steps: [M.formatIntervalSet(signGraph.intervalsFor(chart.regions, task.side))],
        note: task.side === "pos" ? "מעל ציר ה־x מתקיים f(x) > 0." : "מתחת לציר ה־x מתקיים f(x) < 0.",
      });
    } else if (task.kind === "collect") {
      var carried = [];
      (ex.tasks || []).forEach(function (prev) {
        if (prev.kind === "verify") carried.push(prev.at);
        if (prev.kind === "values") {
          [].concat(prev.at).forEach(function (at) {
            if (near(evalFn(Q, ex.fn, at), 0)) carried.push(at);
          });
        }
      });
      uniqueSorted([].concat(task.given || [], carried)).forEach(function (x) {
        add(pointText(M, x, ex), "השורשים כבר ידועים. רושמים את נקודות האפס.");
      });
    } else if (task.kind === "level") {
      var count = task.count != null ? task.count : 2;
      add(String(count), "ישר y = k מעל ציר ה־x פוגש את הגרף ב־" + count + " נקודות.");
    }
  });
  flushSign();
  return { steps: steps, notes: notes };
}

function chainWork(progress) {
  var chain = progress.chain;
  if (!chain) return [];
  var n = (chain.eqs || []).length;
  var prev = chain.work || [];
  var work = [];
  var i;
  for (i = 0; i < n; i++) work[i] = prev[i] || null;
  chain.work = work;
  return work;
}

function openFormulaWork(progress, index) {
  if (index == null || index < 0 || !progress.chain) return;
  var work = chainWork(progress);
  var cur = work[index];
  if (cur && cur.engine === "formula") return;
  work[index] = { engine: "formula", phase: "abc", letter: "a", slots: {}, history: [] };
  progress.formulaBranch = index;
}

function storeFormulaWork(progress, index, res, letter, typed) {
  var work = chainWork(progress);
  var cur = work[index] || { engine: "formula", phase: "abc", letter: "a", slots: {}, history: [] };
  var slots = Object.assign({}, cur.slots || {});
  var history = (cur.history || []).slice();
  var value = res && res.fill && letter && res.fill[letter] != null ? res.fill[letter] : null;
  if ((value == null || value === "") && res && res.ok && typed != null && typed !== "") value = typed;
  if (res && res.ok && letter && value != null && value !== "") {
    slots[letter] = String(value);
    var line = letter + "=" + slots[letter];
    if (history[history.length - 1] !== line) history.push(line);
  }
  if (res && res.ok && res.solved && res.answer) {
    var ans = String(res.answer);
    if (history[history.length - 1] !== ans) history.push(ans);
    if (progress.chain.solved) progress.chain.solved[index] = true;
  }
  work[index] = {
    engine: "formula",
    phase: (res && (res.nextPhase || res.phase)) || cur.phase || "abc",
    letter: (res && res.nextLetter) || letter || cur.letter || "a",
    slots: slots,
    history: history,
  };
  progress.formulaBranch = index;
}

function formulaRequest(progress, index, body, intent) {
  var eqs = (progress.chain && progress.chain.eqs) || [];
  var cur = (progress.chain.work && progress.chain.work[index]) || {};
  return {
    intent: intent,
    start: eqs[index] || "",
    history: [eqs[index] || ""],
    phase: (body && body.phase) || cur.phase || "abc",
    letter: (body && body.letter) || cur.letter || "a",
    slots: Object.assign({}, cur.slots || {}, (body && body.slots) || {}),
    typed: body && body.typed,
    root: (body && body.root) || cur.root,
    compute: (body && body.compute) || cur.compute,
    md53: !!((body && body.md53) || progress.md53),
  };
}

function formulaIndex(progress, body) {
  if (!progress.chain || !progress.chain.split || progress.phase !== "algebra") return null;
  var work = progress.chain.work || [];
  function openAt(index) {
    var item = work[index];
    if (item && item.engine === "formula" && item.phase !== "done") return index;
    return null;
  }
  if (body && body.branch != null && body.branch !== "") {
    var picked = Number(body.branch);
    var pickedOpen = openAt(picked);
    if (pickedOpen != null) return pickedOpen;
    var pickedSolved = progress.chain.solved && progress.chain.solved[picked];
    if (!pickedSolved) return null;
  }
  var active = body && body.formulaBranch != null && body.formulaBranch !== "" ? Number(body.formulaBranch) : progress.formulaBranch;
  var activeOpen = active != null ? openAt(active) : null;
  if (activeOpen != null) return activeOpen;
  var i;
  for (i = 0; i < work.length; i++) {
    var found = openAt(i);
    if (found != null) return found;
  }
  return null;
}

function formulaPayload(engine, ex, progress, res) {
  var out = payload(engine, ex, progress, {
    message: (res && res.message) || "",
    hint: (res && (res.hint || res.message)) || "",
  });
  if (res) {
    out.phase = res.phase;
    out.nextPhase = res.nextPhase;
    out.nextLetter = res.nextLetter;
    out.letter = res.letter;
    out.fill = res.fill;
    out.formulaView = res.view;
    if (res.answer) out.answer = res.answer;
    if (res.kind) out.kind = res.kind;
    if (res.solved) out.solved = true;
  }
  return out;
}

function continueBranchFormula(engine, ex, progress, task, body, intent) {
  var index = body && body.phase
    ? (body.branch != null && body.branch !== "" ? Number(body.branch) : (body.formulaBranch != null && body.formulaBranch !== "" ? Number(body.formulaBranch) : progress.formulaBranch))
    : formulaIndex(progress, body);
  var eqs = (progress.chain && progress.chain.eqs) || [];
  if (index == null || !eqs[index]) return { ok: false, message: "בחרו ענף.", progress: progress, view: viewFor(engine, ex, progress) };
  var req = formulaRequest(progress, index, body, intent);
  var res = require("./quad-formula").handleFormula(engine, req);
  if (!res || res.ok === false) {
    return {
      ok: false,
      message: (res && res.message) || "המקדם לא נכון.",
      progress: progress,
      view: viewFor(engine, ex, progress),
      phase: "abc",
      nextPhase: "abc",
      nextLetter: req.letter,
      letter: req.letter,
    };
  }
  var noted = req.typed;
  var notedLetter = res.letter || req.letter;
  if ((noted == null || noted === "") && req.slots && notedLetter && req.slots[notedLetter] != null) noted = req.slots[notedLetter];
  if (intent !== "hint") storeFormulaWork(progress, index, res, notedLetter, noted);
  var out = formulaPayload(engine, ex, progress, res);
  out.formulaBranch = index;
  return out;
}

function handle(engine, ex, body) {
  body = body || {};
  currentEngine = engine;
  var intent = String(body.intent || "check");
  var progress = arm(ex, loadProgress(body));
  if (body.branch != null && body.branch !== "") progress.branchPick = body.branch;
  if (intent === "probe-check") return probeCheck(engine, ex, progress, body);
  if (progress.phase === "algebra" && progress.chain && progress.chain.split && body.phase && (intent === "check" || intent === "one-step" || intent === "hint")) {
    var livePhase = taskAt(ex, progress);
    return continueBranchFormula(engine, ex, progress, livePhase, body, intent === "one-step" ? "one-step" : intent);
  }
  if (intent === "hint") {
    var formulaHintAt = formulaIndex(progress, body);
    if (formulaHintAt != null) return continueBranchFormula(engine, ex, progress, taskAt(ex, progress), body, "hint");
    if (body.branch != null && body.branch !== "" && progress.chain && progress.chain.solved && progress.chain.solved[Number(body.branch)]) {
      progress.branchPick = null;
    }
    var hints = hintsFor(engine, ex, progress);
    return { ok: true, hint: hints[0], hints: hints, view: viewFor(engine, ex, progress), progress: progress };
  }
  if (intent === "solution") {
    var solved = solutionSteps(engine, ex);
    return { ok: true, steps: solved.steps, notes: solved.notes, view: viewFor(engine, ex, progress) };
  }
  if (intent === "one-step" || intent === "step") {
    if (body.branch != null && body.branch !== "") progress.branchPick = body.branch;
    var formulaStepAt = formulaIndex(progress, body);
    if (formulaStepAt != null) return continueBranchFormula(engine, ex, progress, taskAt(ex, progress), body, "one-step");
    if (body.branch != null && body.branch !== "" && progress.chain && progress.chain.solved && progress.chain.solved[Number(body.branch)]) {
      progress.branchPick = null;
    }
    return oneStep(engine, ex, progress);
  }
  if (intent === "split" || intent === "formula-enter") {
    var live = taskAt(ex, progress);
    if (!live) return payload(engine, ex, progress, { message: "סיימתם את התרגיל.", solved: true });
    if (intent === "formula-enter" && body.md53) progress.md53 = true;
    return runAlgebra(engine, ex, progress, live, intent === "split" ? "split" : "formula-enter", "");
  }
  return checkTyped(engine, ex, progress, body);
}

function openingView(engine, ex) {
  currentEngine = engine;
  return viewFor(engine, ex, arm(ex, freshProgress()));
}

module.exports = {
  handle: handle,
  openingView: openingView,
};
