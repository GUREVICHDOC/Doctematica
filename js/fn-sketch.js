(function (global) {
  var W = 320;
  var H = 280;
  var OX = 160;
  var OY = 140;
  var HALF = 112;

  function el(name, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function qxOf(x) {
    return (x - OX) / HALF;
  }

  function qyOf(y) {
    return (OY - y) / HALF;
  }

  function sx(q) {
    return OX + Number(q) * HALF;
  }

  function sy(q) {
    return OY - Number(q) * HALF;
  }

  function arrow(svg, x1, y1, x2, y2) {
    var line = el("line", { x1: x1, y1: y1, x2: x2, y2: y2, class: "fn-axis" });
    svg.appendChild(line);
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var size = 9;
    var path = el("path", {
      d: "M " + x2 + " " + y2 +
        " L " + (x2 - size * Math.cos(ang - 0.4)) + " " + (y2 - size * Math.sin(ang - 0.4)) +
        " M " + x2 + " " + y2 +
        " L " + (x2 - size * Math.cos(ang + 0.4)) + " " + (y2 - size * Math.sin(ang + 0.4)),
      class: "fn-axis",
    });
    svg.appendChild(path);
  }

  function axes(svg) {
    arrow(svg, 18, OY, W - 16, OY);
    arrow(svg, OX, H - 18, OX, 16);
    var xl = el("text", { x: W - 18, y: OY + 18, class: "fn-axis-name" });
    xl.textContent = "x";
    svg.appendChild(xl);
    var yl = el("text", { x: OX + 8, y: 18, class: "fn-axis-name" });
    yl.textContent = "y";
    svg.appendChild(yl);
  }

  function extendLine(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= len;
    dy /= len;
    var span = Math.max(W, H) * 2;
    return {
      x1: x1 - dx * span,
      y1: y1 - dy * span,
      x2: x2 + dx * span,
      y2: y2 + dy * span,
    };
  }

  function drawLine(svg, line, selected) {
    if (!line) return;
    var ext = extendLine(sx(line.x1), sy(line.y1), sx(line.x2), sy(line.y2));
    svg.appendChild(el("line", {
      x1: ext.x1,
      y1: ext.y1,
      x2: ext.x2,
      y2: ext.y2,
      class: "fn-graph-line" + (line.role === "probe" ? " fn-probe-line" : "") + (selected || line.snapped ? " is-selected" : ""),
    }));
  }

  function drawCurve(svg, samples, className) {
    if (!samples || samples.length < 2) return;
    var d = samples.map(function (p, index) {
      return (index ? "L " : "M ") + sx(p.qx).toFixed(1) + " " + sy(p.qy).toFixed(1);
    }).join(" ");
    svg.appendChild(el("path", { d: d, class: className || "fn-graph-line" }));
  }

  function readableAngleDeg(dx, dy) {
    var a = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (a > 90) a -= 180;
    if (a <= -90) a += 180;
    return a;
  }

  function clipToBoard(x1, y1, x2, y2) {
    var minX = 34;
    var maxX = W - 34;
    var minY = 26;
    var maxY = H - 26;
    var dx = x2 - x1;
    var dy = y2 - y1;
    var p = [-dx, dx, -dy, dy];
    var q = [x1 - minX, maxX - x1, y1 - minY, maxY - y1];
    var u1 = 0;
    var u2 = 1;
    var i;
    for (i = 0; i < 4; i++) {
      if (Math.abs(p[i]) < 1e-8) {
        if (q[i] < 0) return null;
      } else {
        var r = q[i] / p[i];
        if (p[i] < 0) {
          if (r > u1) u1 = r;
        } else if (r < u2) u2 = r;
      }
    }
    if (u1 > u2) return null;
    return {
      x1: x1 + u1 * dx,
      y1: y1 + u1 * dy,
      x2: x1 + u2 * dx,
      y2: y1 + u2 * dy,
    };
  }

  function drawGraphEq(svg, eq, px, py, angle, tone) {
    if (!eq) return;
    var MathR = global.DoctematicaMath;
    var wrap = el("g", {
      class: "fn-eq-wrap",
      transform: "translate(" + px.toFixed(1) + " " + py.toFixed(1) + ") rotate(" + angle.toFixed(1) + ")",
    });
    var visLen = String(eq).length + (/\//.test(eq) ? 8 : 0);
    var foW = Math.max(92, Math.min(168, visLen * 7.2));
    var foH = 30;
    if (MathR && typeof MathR.toHTML === "function") {
      var fo = el("foreignObject", {
        x: String(-foW / 2),
        y: String(-foH / 2),
        width: String(foW),
        height: String(foH),
      });
      var div = document.createElement("div");
      div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      div.className = "fn-eq-html" + (tone === "b" ? " is-b" : "");
      div.innerHTML = MathR.toHTML(eq);
      fo.appendChild(div);
      wrap.appendChild(fo);
    } else {
      var lab = el("text", {
        class: "fn-eq" + (tone === "b" ? " is-b" : ""),
        "text-anchor": "middle",
        "dominant-baseline": "middle",
      });
      lab.textContent = eq;
      wrap.appendChild(lab);
    }
    svg.appendChild(wrap);
  }

  function screenSeg(line) {
    var ext = extendLine(sx(line.x1), sy(line.y1), sx(line.x2), sy(line.y2));
    return clipToBoard(ext.x1, ext.y1, ext.x2, ext.y2);
  }

  function segCross(a, b) {
    var d1x = a.x2 - a.x1;
    var d1y = a.y2 - a.y1;
    var d2x = b.x2 - b.x1;
    var d2y = b.y2 - b.y1;
    var den = d1x * d2y - d1y * d2x;
    if (Math.abs(den) < 1e-6) return null;
    var t = ((b.x1 - a.x1) * d2y - (b.y1 - a.y1) * d2x) / den;
    var u = ((b.x1 - a.x1) * d1y - (b.y1 - a.y1) * d1x) / den;
    if (t < -0.02 || t > 1.02 || u < -0.02 || u > 1.02) return null;
    return { x: a.x1 + t * d1x, y: a.y1 + t * d1y };
  }

  function axisHits(seg, add) {
    var dx = seg.x2 - seg.x1;
    var dy = seg.y2 - seg.y1;
    if (Math.abs(dy) > 1e-6) {
      var tx = (OY - seg.y1) / dy;
      if (tx >= 0 && tx <= 1) add(seg.x1 + tx * dx, OY, 34);
    }
    if (Math.abs(dx) > 1e-6) {
      var ty = (OX - seg.x1) / dx;
      if (ty >= 0 && ty <= 1) add(OX, seg.y1 + ty * dy, 34);
    }
  }

  function sideOf(px, py, seg) {
    return (seg.x2 - seg.x1) * (py - seg.y1) - (seg.y2 - seg.y1) * (px - seg.x1);
  }

  function graphObstacles(figure, lines, curves) {
    var obs = [];
    function add(x, y, r) {
      if (!isFinite(x) || !isFinite(y)) return;
      if (x < -30 || x > W + 30 || y < -30 || y > H + 30) return;
      obs.push({ x: x, y: y, r: r });
    }
    add(OX, OY, 42);
    add(W - 18, OY + 16, 24);
    add(OX + 16, 16, 24);
    ((figure && figure.marks) || []).forEach(function (mark) {
      var q = Number(mark && mark.qx);
      if (!isFinite(q)) return;
      if (mark.qy != null && isFinite(Number(mark.qy))) add(sx(q), sy(Number(mark.qy)), 32);
      else add(sx(q), OY, 30);
    });
    var segs = lines.map(screenSeg).filter(Boolean);
    var i;
    var j;
    for (i = 0; i < segs.length; i++) {
      axisHits(segs[i], add);
      for (j = i + 1; j < segs.length; j++) {
        var hit = segCross(segs[i], segs[j]);
        if (hit) add(hit.x, hit.y, 40);
      }
    }
    curves.forEach(function (curve) {
      var k;
      for (k = 0; k < curve.length; k++) {
        var px = sx(curve[k].qx);
        var py = sy(curve[k].qy);
        if (k % 3 === 0) add(px, py, 22);
        if (Math.abs(py - OY) < 14) add(px, OY, 32);
        if (Math.abs(px - OX) < 14) add(OX, py, 32);
      }
      segs.forEach(function (seg) {
        for (k = 1; k < curve.length; k++) {
          var ax = sx(curve[k - 1].qx);
          var ay = sy(curve[k - 1].qy);
          var bx = sx(curve[k].qx);
          var by = sy(curve[k].qy);
          if (sideOf(ax, ay, seg) * sideOf(bx, by, seg) <= 0) add((ax + bx) / 2, (ay + by) / 2, 36);
        }
      });
    });
    return obs;
  }

  function labelScore(px, py, visLen, obstacles) {
    var half = Math.max(42, visLen * 3.3);
    var penalty = 0;
    if (px < 78 || px > W - 78) penalty += (px < 78 ? 78 - px : px - (W - 78)) * 8;
    if (py < 26 || py > H - 26) penalty += (py < 26 ? 26 - py : py - (H - 26)) * 8;
    obstacles.forEach(function (o) {
      var dist = Math.sqrt((px - o.x) * (px - o.x) + (py - o.y) * (py - o.y));
      var need = o.r + half * 0.55;
      if (dist < need) penalty += (need - dist) * 5;
    });
    return penalty;
  }

  function lineEqSpot(line, obstacles, eq) {
    var clip = screenSeg(line);
    if (!clip) return null;
    var dx = clip.x2 - clip.x1;
    var dy = clip.y2 - clip.y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / len;
    var ny = dx / len;
    var vis = String(eq || "").length + (/\//.test(eq || "") ? 8 : 0);
    var ts = [0.08, 0.14, 0.22, 0.78, 0.86, 0.92];
    var offs = [15, -15];
    var best = null;
    var bestScore = Infinity;
    ts.forEach(function (t) {
      offs.forEach(function (off) {
        var px = clip.x1 + dx * t + nx * off;
        var py = clip.y1 + dy * t + ny * off;
        var sc = labelScore(px, py, vis, obstacles);
        if (sc < bestScore) {
          bestScore = sc;
          best = { x: px, y: py, angle: readableAngleDeg(dx, dy) };
        }
      });
    });
    return best;
  }

  function segHitsRect(x1, y1, x2, y2, left, top, right, bottom) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var t0 = 0;
    var t1 = 1;
    var p = [-dx, dx, -dy, dy];
    var q = [x1 - left, right - x1, y1 - top, bottom - y1];
    var i;
    for (i = 0; i < 4; i++) {
      if (Math.abs(p[i]) < 1e-8) {
        if (q[i] < 0) return false;
      } else {
        var r = q[i] / p[i];
        if (p[i] < 0) {
          if (r > t1) return false;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return false;
          if (r < t1) t1 = r;
        }
      }
    }
    return true;
  }

  function curveEqSpot(samples, obstacles, eq, lines) {
    if (!samples || samples.length < 4) return null;
    var vis = String(eq || "").length + (/\//.test(eq || "") ? 8 : 0);
    var foW = Math.max(92, Math.min(168, vis * 7.2));
    var foH = 30;
    var n = samples.length;
    var mid = samples[Math.floor(n / 2)];
    var endY = (samples[0].qy + samples[n - 1].qy) / 2;
    var opensUp = mid.qy < endY - 1e-6;
    var vertex = 0;
    var i;
    for (i = 1; i < n; i++) {
      if (opensUp ? samples[i].qy < samples[vertex].qy : samples[i].qy > samples[vertex].qy) vertex = i;
    }
    var vx = sx(samples[vertex].qx);
    var vy = sy(samples[vertex].qy);
    var interiorY = vy + (opensUp ? -24 : 24);
    var segs = (lines || []).map(screenSeg).filter(Boolean);
    var best = null;
    var bestScore = Infinity;
    var steps = [0, -2, 2, -4, 4, -7, 7, -11, 11, -16, 16];
    steps.forEach(function (delta) {
      var j = vertex + delta;
      if (j < 1 || j > n - 2) return;
      var prev = samples[j - 1];
      var next = samples[j + 1];
      var dx = sx(next.qx) - sx(prev.qx);
      var dy = sy(next.qy) - sy(prev.qy);
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len;
      var ny = dx / len;
      [1, -1].forEach(function (sign) {
        var gap = 12 + Math.abs(nx) * (foW / 2) + Math.abs(ny) * (foH / 2);
        var px = sx(samples[j].qx) + nx * sign * gap;
        var py = sy(samples[j].qy) + ny * sign * gap;
        var curveD = Math.sqrt((sx(samples[j].qx) - vx) * (sx(samples[j].qx) - vx) + (sy(samples[j].qy) - interiorY) * (sy(samples[j].qy) - interiorY));
        var spotD = Math.sqrt((px - vx) * (px - vx) + (py - interiorY) * (py - interiorY));
        var sc = labelScore(px, py, vis, obstacles) + Math.abs(delta) * 3;
        if (spotD <= curveD) sc += 90;
        var left = px - foW / 2;
        var right = px + foW / 2;
        var top = py - foH / 2;
        var bottom = py + foH / 2;
        segs.forEach(function (seg) {
          if (segHitsRect(seg.x1, seg.y1, seg.x2, seg.y2, left - 8, top - 8, right + 8, bottom + 8)) sc += 220;
        });
        if (segHitsRect(OX, 18, OX, H - 18, left, top, right, bottom)) sc += 160;
        if (segHitsRect(18, OY, W - 18, OY, left, top, right, bottom)) sc += 160;
        if (sc < bestScore) {
          bestScore = sc;
          best = { x: px, y: py, angle: 0 };
        }
      });
    });
    return best;
  }

  function drawFigure(svg, figure) {
    var curves = [];
    if (figure && figure.curve && figure.curve.length) curves.push(figure.curve);
    ((figure && figure.curves) || []).forEach(function (curve) {
      if (curve && curve.length) curves.push(curve);
    });
    curves.forEach(function (curve, index) {
      drawCurve(svg, curve, index ? "fn-graph-b" : "fn-graph-line");
    });
    var lines = [];
    if (figure && figure.line) lines.push(figure.line);
    ((figure && figure.lines) || []).forEach(function (line) {
      if (line) lines.push(line);
    });
    if (!lines.length && !curves.length) {
      var trend = figure && figure.trend;
      lines.push({
        x1: -0.72,
        y1: trend === "dec" ? 0.55 : trend === "flat" ? 0.38 : -0.15,
        x2: 0.72,
        y2: trend === "dec" ? -0.45 : trend === "flat" ? 0.38 : 0.62,
      });
    }
    lines.forEach(function (line, index) {
      drawLine(svg, line, index > 0 || curves.length > 0);
    });
    var obstacles = graphObstacles(figure, lines, curves);
    function occupy(spot, eq) {
      if (!spot) return;
      var vis = String(eq || "").length + (/\//.test(eq || "") ? 8 : 0);
      obstacles.push({ x: spot.x, y: spot.y, r: Math.max(46, vis * 3.4) });
    }
    curves.forEach(function (curve, index) {
      var eq = index ? ((figure && figure.curveEqs) || [])[index - 1] : figure && figure.curveEq;
      var spot = curveEqSpot(curve, obstacles, eq, lines);
      occupy(spot, eq);
      if (spot) drawGraphEq(svg, eq, Math.max(78, Math.min(W - 78, spot.x)), Math.max(22, Math.min(H - 22, spot.y)), spot.angle, index ? "b" : "a");
    });
    lines.forEach(function (line, index) {
      var eq = index ? ((figure && figure.lineEqs) || [])[index - 1] : figure && figure.lineEq;
      var orange = index > 0 || curves.length > 0;
      var spot = lineEqSpot(line, obstacles, eq);
      occupy(spot, eq);
      if (spot) drawGraphEq(svg, eq, Math.max(78, Math.min(W - 78, spot.x)), Math.max(22, Math.min(H - 22, spot.y)), spot.angle, orange ? "b" : "a");
    });
    var marks = (figure && figure.marks) || [];
    marks.forEach(function (mark) {
      var q = mark && typeof mark === "object" ? Number(mark.qx) : (Number(mark) < 0 ? -0.62 : 0.48);
      var text = mark && mark.label ? mark.label : "x=" + String(mark).replace(/-/g, "−");
      if (mark && mark.guide) {
        svg.appendChild(el("line", {
          x1: sx(q),
          y1: 28,
          x2: sx(q),
          y2: H - 28,
          class: "fn-guide",
        }));
      }
      if (mark && mark.qy != null && isFinite(Number(mark.qy))) {
        var px = sx(q);
        var py = sy(Number(mark.qy));
        svg.appendChild(el("circle", { cx: px, cy: py, r: 4.5, class: "fn-dot" }));
        var named = el("text", {
          x: px + (q < 0 ? -10 : 10),
          y: py - 8,
          class: "fn-dot-label",
          "text-anchor": q < 0 ? "end" : "start",
        });
        named.textContent = text;
        svg.appendChild(named);
        return;
      }
      svg.appendChild(el("line", {
        x1: sx(q),
        y1: OY - 6,
        x2: sx(q),
        y2: OY + 6,
        class: "fn-tick",
      }));
      var label = el("text", { x: sx(q), y: OY + 22, class: "fn-mark", "text-anchor": "middle" });
      label.textContent = text;
      svg.appendChild(label);
    });
  }

  function drawPoints(svg, points, selectedIndex) {
    (points || []).forEach(function (p, index) {
      var x = sx(p.qx);
      var y = sy(p.qy);
      var hot = selectedIndex === index ? " is-selected" : "";
      if (p.open) hot += " is-open";
      if (p.role === "given") hot += " is-given";
      svg.appendChild(el("circle", { cx: x, cy: y, r: 5.5, class: "fn-dot" + hot }));
      var label = el("text", {
        x: x + (Number(p.qx) < 0 ? -8 : 8),
        y: y - 8,
        class: "fn-dot-label",
        "text-anchor": Number(p.qx) < 0 ? "end" : "start",
      });
      label.textContent = "(" + String(p.x).replace(/-/g, "−") + "," + String(p.y).replace(/-/g, "−") + ")";
      svg.appendChild(label);
    });
  }

  function cloneModel(model) {
    model = model || { points: [], line: null };
    return {
      points: (model.points || []).map(function (p) {
        return { x: p.x, y: p.y, qx: p.qx, qy: p.qy, role: p.role || "" };
      }),
      strokes: (model.strokes || []).map(function (stroke) {
        return (stroke || []).map(function (p) { return { qx: p.qx, qy: p.qy }; });
      }),
      line: model.line
        ? { x1: model.line.x1, y1: model.line.y1, x2: model.line.x2, y2: model.line.y2 }
        : null,
      curve: (model.curve || []).map(function (p) { return { qx: p.qx, qy: p.qy }; }),
      refs: (model.refs || []).map(function (r) {
        return { x1: r.x1, y1: r.y1, x2: r.x2, y2: r.y2, role: r.role || "", y: r.y, label: r.label || "" };
      }),
    };
  }

  function sameModel(a, b) {
    return JSON.stringify(cloneModel(a)) === JSON.stringify(cloneModel(b));
  }

  function modelHas(model) {
    return !!(
      (model && model.points && model.points.length) ||
      (model && model.line) ||
      (model && model.curve && model.curve.length) ||
      (model && model.strokes && model.strokes.length)
    );
  }

  function fitStroke(samples) {
    if (!samples || samples.length < 2) return null;
    var n = samples.length;
    var sumX = 0;
    var sumY = 0;
    var sumXX = 0;
    var sumXY = 0;
    var minX = samples[0].qx;
    var maxX = samples[0].qx;
    var minY = samples[0].qy;
    var maxY = samples[0].qy;
    samples.forEach(function (p) {
      sumX += p.qx;
      sumY += p.qy;
      sumXX += p.qx * p.qx;
      sumXY += p.qx * p.qy;
      if (p.qx < minX) minX = p.qx;
      if (p.qx > maxX) maxX = p.qx;
      if (p.qy < minY) minY = p.qy;
      if (p.qy > maxY) maxY = p.qy;
    });
    var dx = maxX - minX;
    var dy = maxY - minY;
    if (Math.sqrt(dx * dx + dy * dy) < 0.08) return null;
    var line;
    if (Math.abs(dx) < 0.04) {
      line = { x1: samples[0].qx, y1: minY, x2: samples[n - 1].qx, y2: maxY };
    } else {
      var den = n * sumXX - sumX * sumX;
      var slope = Math.abs(den) < 1e-8 ? 0 : (n * sumXY - sumX * sumY) / den;
      var intercept = (sumY - slope * sumX) / n;
      line = { x1: minX, y1: slope * minX + intercept, x2: maxX, y2: slope * maxX + intercept };
    }
    var len = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2));
    if (len < 0.32) {
      var scale = 0.36 / (len || 1);
      var mx = (line.x1 + line.x2) / 2;
      var my = (line.y1 + line.y2) / 2;
      var hx = ((line.x2 - line.x1) * scale) / 2;
      var hy = ((line.y2 - line.y1) * scale) / 2;
      line = { x1: mx - hx, y1: my - hy, x2: mx + hx, y2: my + hy };
    }
    return line;
  }

  function segDist(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len2 = dx * dx + dy * dy || 1;
    var t = ((px - x1) * dx + (py - y1) * dy) / len2;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    var x = x1 + t * dx;
    var y = y1 + t * dy;
    return Math.sqrt((px - x) * (px - x) + (py - y) * (py - y));
  }

  function mount(root) {
    var state = {
      mode: "hidden",
      tool: "",
      figure: null,
      model: { points: [], line: null, strokes: [] },
      family: "",
      domain: null,
      pending: null,
      ink: null,
      drag: null,
      selected: null,
      undo: [],
      noteOverride: "",
      locked: false,
      resize: null,
      onPoint: null,
      onChange: null,
      onCheck: null,
      probe: null,
      probeMarkers: [],
    };
    root.innerHTML = "";
    var tools = document.createElement("div");
    tools.className = "fn-board-tools";
    var pick = document.createElement("div");
    pick.className = "fn-tool-pick";
    var edit = document.createElement("div");
    edit.className = "fn-tool-edit";
    var pointBtn = document.createElement("button");
    pointBtn.type = "button";
    pointBtn.textContent = "נקודה";
    var penBtn = document.createElement("button");
    penBtn.type = "button";
    penBtn.textContent = "עט";
    var moveBtn = document.createElement("button");
    moveBtn.type = "button";
    moveBtn.textContent = "הזזה";
    var undoBtn = document.createElement("button");
    undoBtn.type = "button";
    undoBtn.textContent = "ביטול";
    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "מחיקה";
    pick.appendChild(pointBtn);
    pick.appendChild(penBtn);
    var clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.textContent = "נקה שרטוט";
    edit.appendChild(moveBtn);
    edit.appendChild(undoBtn);
    edit.appendChild(deleteBtn);
    edit.appendChild(clearBtn);
    var helperBtn = document.createElement("button");
    helperBtn.type = "button";
    helperBtn.className = "fn-helper-line hidden";
    helperBtn.textContent = "הוסף ישר";
    tools.appendChild(pick);
    tools.appendChild(edit);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("class", "fn-svg");
    var canvas = document.createElement("div");
    canvas.className = "fn-canvas";
    canvas.appendChild(svg);
    ["n", "s", "e", "w", "ne", "nw", "se", "sw"].forEach(function (edge) {
      var handle = document.createElement("span");
      handle.className = "fn-resize fn-resize-" + edge;
      handle.dataset.edge = edge;
      handle.title = "גררו לשינוי גודל";
      handle.setAttribute("aria-hidden", "true");
      canvas.appendChild(handle);
      handle.addEventListener("pointerdown", function (event) {
        if (state.mode !== "sketch" || event.button) return;
        event.preventDefault();
        event.stopPropagation();
        var boardStyle = window.getComputedStyle(root);
        state.resize = {
          edge: edge,
          x: event.clientX,
          y: event.clientY,
          w: canvas.getBoundingClientRect().width,
          h: canvas.getBoundingClientRect().height,
          marginStart: parseFloat(boardStyle.marginInlineStart) || 0,
          marginTop: parseFloat(boardStyle.marginTop) || 0,
        };
        try { handle.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
      });
    });
    var form = document.createElement("form");
    form.className = "fn-point-form hidden";
    var input = document.createElement("input");
    input.type = "text";
    input.dir = "ltr";
    input.placeholder = "(0,−2)";
    input.setAttribute("aria-label", "שיעורי הנקודה");
    var okBtn = document.createElement("button");
    okBtn.type = "submit";
    okBtn.textContent = "סימון";
    form.appendChild(input);
    form.appendChild(okBtn);
    var note = document.createElement("p");
    note.className = "fn-note";
    var checkSketchBtn = document.createElement("button");
    checkSketchBtn.type = "button";
    checkSketchBtn.className = "fn-sketch-check hidden";
    checkSketchBtn.textContent = "בדיקה";
    root.appendChild(tools);
    root.appendChild(helperBtn);
    root.appendChild(canvas);
    root.appendChild(form);
    root.appendChild(note);
    root.appendChild(checkSketchBtn);
    checkSketchBtn.addEventListener("click", function () {
      if (state.onCheck) state.onCheck();
    });
    function qyForProbe(probe, y) {
      var list = ((probe && probe.anchors) || []).filter(function (item) {
        return item && isFinite(Number(item.y)) && isFinite(Number(item.qy));
      }).slice().sort(function (a, b) { return Number(a.y) - Number(b.y); });
      var height = Number(y);
      if (!list.length || !isFinite(height)) return 0.35;
      if (list.length === 1 || height <= Number(list[0].y)) {
        var low = list[0];
        if (Math.abs(height - Number(low.y)) < 1e-6) return Number(low.qy);
        if (height > Number(low.y)) return Math.min(0.95, Number(low.qy) + 0.55);
        return Math.max(-0.95, Number(low.qy) - 0.38);
      }
      var high = list[list.length - 1];
      if (height >= Number(high.y)) {
        if (Math.abs(height - Number(high.y)) < 1e-6) return Number(high.qy);
        return Math.min(0.95, Number(high.qy) + 0.42);
      }
      var i;
      for (i = 0; i < list.length - 1; i++) {
        var a = list[i];
        var b = list[i + 1];
        if (height >= Number(a.y) && height <= Number(b.y)) {
          var span = Number(b.y) - Number(a.y);
          var t = span ? (height - Number(a.y)) / span : 0;
          return Number(a.qy) + (Number(b.qy) - Number(a.qy)) * t;
        }
      }
      return Number(high.qy);
    }

    function addProbeLine() {
      var probe = state.probe;
      if (!probe) return;
      var qy = probe.mode === "fixed" ? qyForProbe(probe, probe.y) : qyForProbe(probe, -8);
      if (probe.mode === "drag") {
        var lows = (probe.anchors || []).map(function (item) { return Number(item.qy); }).filter(isFinite);
        qy = (lows.length ? Math.min.apply(null, lows) : 0) - 0.42;
      }
      remember();
      state.model.refs = [{
        x1: -1.15,
        y1: qy,
        x2: 1.15,
        y2: qy,
        role: "probe",
        label: probe.label || "y = k",
      }];
      state.probeMarkers = [];
      state.noteOverride = probe.mode === "fixed"
        ? "הישר האופקי נוסף בגובה של הסעיף. ספרו את נקודות המפגש עם הגרף."
        : "גררו את הישר למעלה ולמטה. הוא נשאר אופקי.";
      paint();
      changed();
    }

    helperBtn.addEventListener("click", function () {
      if (state.probe) {
        addProbeLine();
        return;
      }
      if (!state.helperLine || state.locked) return;
      var points = state.model.points || [];
      var top = null;
      points.forEach(function (pt) {
        if (!isFinite(pt.qy)) return;
        if (!top || Number(pt.y) > Number(top.y)) top = pt;
      });
      var qy = top ? Math.min(0.9, Number(top.qy) + 0.22) : 0.62;
      remember();
      state.model.refs = (state.model.refs || []).filter(function (ref) { return ref.role !== "helper"; });
      state.model.refs.push({
        x1: -1.05,
        y1: qy,
        x2: 1.05,
        y2: qy,
        role: "helper",
        y: state.helperLine.y,
        label: "y=" + String(state.helperLine.y).replace("-", "−"),
      });
      state.noteOverride = "הישר האופקי נוסף מעל נקודת המקסימום. בדקו אם הוא פוגש את הגרף.";
      paint();
      changed();
    });

    function defaultNote() {
      if (state.tool === "point") return "לחצו על המקום, ורשמו את הזוג.";
      if (state.tool === "pen" && state.reference) return "גררו קו עזר. ישר כמעט אופקי נצמד ל־y קבוע.";
      if (state.tool === "pen" && state.family === "free") return "גררו גרף חופשי. הוא לא חייב להיות קו ישר בין הנקודות.";
      if (state.tool === "pen") return "גררו עם העט, כמו במחברת.";
      if (state.tool === "move") return "גררו כדי להזיז. מחיקה מסירה את מה שנבחר.";
      return "בחרו נקודה או עט.";
    }

    function changed() {
      if (state.onChange) state.onChange(state.model);
    }

    function remember() {
      state.undo.push(cloneModel(state.model));
      if (state.undo.length > 40) state.undo.shift();
    }

    function setNote(text) {
      var src = text || "";
      if (!src) {
        note.textContent = "";
        return;
      }
      if (global.DoctematicaMath && global.DoctematicaMath.proseHTML) {
        note.innerHTML = global.DoctematicaMath.proseHTML(src);
        return;
      }
      note.textContent = src;
    }

    function paintTools() {
      var live = (state.mode === "sketch" && !state.locked) || (state.mode === "figure" && state.reference);
      tools.classList.toggle("hidden", !live);
      checkSketchBtn.textContent = state.family === "free" ? "בדוק שרטוט" : "בדיקה";
      clearBtn.classList.toggle("hidden", state.family !== "free" || state.mode !== "sketch");
      clearBtn.disabled = state.family !== "free" || !(state.model.strokes && state.model.strokes.length);
      var offer = state.helperLine;
      var probeLive = state.mode === "figure" && !!state.probe;
      helperBtn.classList.toggle("hidden", probeLive ? false : (!offer || state.mode !== "sketch" || !!state.locked));
      helperBtn.textContent = probeLive ? "הוסף ישר אופקי" : (offer && offer.label ? offer.label : "הוסף ישר");
      checkSketchBtn.textContent = probeLive ? "בדיקת שרטוט" : (state.family === "free" ? "בדוק שרטוט" : "בדיקה");
      checkSketchBtn.classList.toggle("hidden", probeLive ? false : (state.allowCheck === false || state.mode !== "sketch" || !!state.locked));
      pointBtn.classList.toggle("is-on", live && state.tool === "point");
      penBtn.classList.toggle("is-on", live && state.tool === "pen");
      moveBtn.classList.toggle("is-on", live && state.tool === "move");
      undoBtn.disabled = !live || !state.undo.length;
      deleteBtn.disabled = !live || !state.selected;
      svg.classList.toggle("is-figure", state.mode === "figure");
      svg.classList.toggle("is-locked", state.mode === "sketch" && !!state.locked);
      svg.classList.toggle("is-pen", live && state.tool === "pen");
      svg.classList.toggle("is-point", live && state.tool === "point");
      svg.classList.toggle("is-move", live && state.tool === "move");
      if (state.mode === "figure" && (state.reference || state.probe)) setNote(state.noteOverride || (state.probe ? "הוסיפו ישר אופקי. הוא נשאר מקביל לציר ה־x." : defaultNote()));
      else if (state.mode !== "sketch") setNote("");
      else if (state.locked) setNote("");
      else setNote(state.noteOverride || defaultNote());
    }

    function hasEdge(edge, flag) {
      return edge.indexOf(flag) >= 0;
    }

    function applyResize(event) {
      var drag = state.resize;
      if (!drag) return;
      var dx = event.clientX - drag.x;
      var dy = event.clientY - drag.y;
      var width = drag.w;
      var height = drag.h;
      if (hasEdge(drag.edge, "e")) width = drag.w + dx;
      if (hasEdge(drag.edge, "w")) width = drag.w - dx;
      if (hasEdge(drag.edge, "s")) height = drag.h + dy;
      if (hasEdge(drag.edge, "n")) height = drag.h - dy;
      width = Math.min(Math.max(160, window.innerWidth - 32), Math.max(160, width));
      height = Math.min(Math.max(140, window.innerHeight - 80), Math.max(120, height));
      var shiftX = hasEdge(drag.edge, "e") ? width - drag.w : 0;
      var shiftY = hasEdge(drag.edge, "n") ? drag.h - height : 0;
      root.style.setProperty("--fn-w", Math.round(width) + "px");
      root.style.setProperty("--fn-h", Math.round(height) + "px");
      root.style.marginInlineStart = (drag.marginStart - shiftX) + "px";
      root.style.marginTop = (drag.marginTop + shiftY) + "px";
    }

    function releaseBoardShift() {
      root.style.marginTop = "";
      root.style.marginInlineStart = "";
    }

    function paint() {
      svg.setAttribute("preserveAspectRatio", state.mode === "sketch" ? "none" : "xMidYMid meet");
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      axes(svg);
      if (state.mode === "figure" && state.figure) {
        drawFigure(svg, state.figure);
        var selectedRef = state.selected && state.selected.kind === "ref" ? state.selected.index : -1;
        var selectedPoint = state.selected && state.selected.kind === "point" ? state.selected.index : -1;
        drawPoints(svg, state.model.points, selectedPoint);
        (state.model.refs || []).forEach(function (ref, index) {
          drawLine(svg, ref, index === selectedRef);
          if (!ref.label) return;
          var label = el("text", {
            x: sx(Math.max(ref.x1, ref.x2)) - 8,
            y: sy(ref.y1) - 8,
            class: "fn-dot-label",
            "text-anchor": "end",
          });
          label.textContent = ref.label;
          svg.appendChild(label);
        });
        (state.probeMarkers || []).forEach(function (hit) {
          svg.appendChild(el("circle", {
            cx: sx(hit.qx),
            cy: sy(hit.qy),
            r: 5,
            class: "fn-probe-hit",
          }));
        });
      }
      if (state.mode === "sketch") {
        var selectedPoint = state.selected && state.selected.kind === "point" ? state.selected.index : -1;
        var selectedLine = !!(state.selected && state.selected.kind === "line");
        var selectedStroke = state.selected && state.selected.kind === "stroke" ? state.selected.index : -1;
        (state.model.strokes || []).forEach(function (stroke, index) {
          drawCurve(svg, stroke, "fn-ink" + (index === selectedStroke ? " is-selected" : ""));
        });
        var shownPoints = (state.model.points || []).map(function (p) {
          var domain = state.domain;
          var open = false;
          if (domain && Math.abs(Number(p.x) - Number(domain.min)) < 1e-6 && domain.includeMin === false) open = true;
          if (domain && Math.abs(Number(p.x) - Number(domain.max)) < 1e-6 && domain.includeMax === false) open = true;
          if (!open) return p;
          return { x: p.x, y: p.y, qx: p.qx, qy: p.qy, role: p.role, open: true };
        });
        drawPoints(svg, shownPoints, selectedPoint);
        if (state.model.curve && state.model.curve.length) drawCurve(svg, state.model.curve, "fn-graph-line");
        if (state.model.line) drawLine(svg, state.model.line, selectedLine);
        (state.model.refs || []).forEach(function (ref) {
          drawLine(svg, ref, false);
          if (!ref.label) return;
          var label = el("text", {
            x: sx(Math.max(ref.x1, ref.x2)) - 36,
            y: sy(ref.y1) - 8,
            class: "fn-dot-label",
          });
          label.textContent = ref.label;
          svg.appendChild(label);
        });
        if (state.pending) {
          svg.appendChild(el("circle", {
            cx: state.pending.x,
            cy: state.pending.y,
            r: 5,
            class: "fn-dot is-pending",
          }));
        }
        if (state.ink && state.ink.length > 1) {
          var d = state.ink.map(function (p, index) {
            return (index ? "L " : "M ") + p.x.toFixed(1) + " " + p.y.toFixed(1);
          }).join(" ");
          svg.appendChild(el("path", { d: d, class: "fn-ink" }));
        }
      }
      paintTools();
      root.classList.toggle("hidden", state.mode === "hidden");
      root.classList.toggle("is-sketch", state.mode === "sketch");
      root.classList.toggle("is-figure", state.mode === "figure");
    }

    function localPoint(event) {
      var rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      var x = ((event.clientX - rect.left) / rect.width) * W;
      var y = ((event.clientY - rect.top) / rect.height) * H;
      return { x: x, y: y, qx: qxOf(x), qy: qyOf(y) };
    }

    function parseNum(token) {
      var s = String(token || "").replace(/[−–—]/g, "-");
      if (s.indexOf("/") >= 0) {
        var parts = s.split("/");
        var a = Number(parts[0]);
        var b = Number(parts[1]);
        if (!isFinite(a) || !isFinite(b) || !b) return NaN;
        return a / b;
      }
      return Number(s);
    }

    function parsePair(text) {
      var t = String(text || "")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "")
        .replace(/,/g, ";");
      var m = t.match(/^\(?([^;)]+);([^)]+)\)?$/);
      if (!m) return null;
      var x = parseNum(m[1]);
      var y = parseNum(m[2]);
      if (!isFinite(x) || !isFinite(y)) return null;
      return { x: x, y: y };
    }

    function choose(tool) {
      state.tool = state.tool === tool ? "" : tool;
      state.noteOverride = "";
      state.ink = null;
      state.drag = null;
      if (state.tool !== "point") {
        state.pending = null;
        form.classList.add("hidden");
      }
      if (state.tool !== "move") state.selected = null;
      paint();
    }

    function hitAt(p) {
      var points = state.model.points || [];
      var i;
      var best = -1;
      var bestD = 18;
      for (i = 0; i < points.length; i++) {
        var d = Math.sqrt(Math.pow(sx(points[i].qx) - p.x, 2) + Math.pow(sy(points[i].qy) - p.y, 2));
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best >= 0) return { kind: "point", index: best };
      if (state.model.line) {
        var ext = extendLine(sx(state.model.line.x1), sy(state.model.line.y1), sx(state.model.line.x2), sy(state.model.line.y2));
        if (segDist(p.x, p.y, ext.x1, ext.y1, ext.x2, ext.y2) < 20) return { kind: "line" };
      }
      var refs = state.model.refs || [];
      var r;
      var bestRef = -1;
      var bestRefD = 16;
      for (r = 0; r < refs.length; r++) {
        var refExt = extendLine(sx(refs[r].x1), sy(refs[r].y1), sx(refs[r].x2), sy(refs[r].y2));
        var refD = segDist(p.x, p.y, refExt.x1, refExt.y1, refExt.x2, refExt.y2);
        if (refD < bestRefD) {
          bestRefD = refD;
          bestRef = r;
        }
      }
      if (bestRef >= 0) return { kind: "ref", index: bestRef };
      var strokes = state.model.strokes || [];
      var s;
      var k;
      var bestStroke = -1;
      var bestStrokeD = 16;
      for (s = 0; s < strokes.length; s++) {
        var stroke = strokes[s] || [];
        for (k = 1; k < stroke.length; k++) {
          var strokeD = segDist(
            p.x,
            p.y,
            sx(stroke[k - 1].qx),
            sy(stroke[k - 1].qy),
            sx(stroke[k].qx),
            sy(stroke[k].qy)
          );
          if (strokeD < bestStrokeD) {
            bestStrokeD = strokeD;
            bestStroke = s;
          }
        }
      }
      if (bestStroke >= 0) return { kind: "stroke", index: bestStroke };
      return null;
    }

    pointBtn.addEventListener("click", function () { choose("point"); });
    penBtn.addEventListener("click", function () { choose("pen"); });
    moveBtn.addEventListener("click", function () { choose("move"); });
    undoBtn.addEventListener("click", function () {
      if (!state.undo.length) return;
      state.model = state.undo.pop();
      state.selected = null;
      state.pending = null;
      state.noteOverride = "";
      form.classList.add("hidden");
      changed();
      paint();
    });
    deleteBtn.addEventListener("click", function () {
      if (!state.selected) return;
      remember();
      if (state.selected.kind === "point") state.model.points.splice(state.selected.index, 1);
      else if (state.selected.kind === "ref") state.model.refs.splice(state.selected.index, 1);
      else if (state.selected.kind === "curve") state.model.curve = [];
      else if (state.selected.kind === "stroke") state.model.strokes.splice(state.selected.index, 1);
      else state.model.line = null;
      state.selected = null;
      state.noteOverride = "";
      changed();
      paint();
    });
    clearBtn.addEventListener("click", function () {
      if (state.family !== "free") return;
      if (!(state.model.strokes && state.model.strokes.length)) return;
      remember();
      state.model.strokes = [];
      state.selected = null;
      state.noteOverride = "";
      changed();
      paint();
    });

    svg.addEventListener("pointerdown", function (event) {
      if (state.mode === "figure" && state.probe && !event.button) {
        var probePoint = localPoint(event);
        if (!probePoint || state.probe.mode !== "drag") return;
        var probeHit = hitAt(probePoint);
        if (!probeHit || probeHit.kind !== "ref") return;
        state.drag = { hit: probeHit, start: probePoint, origin: cloneModel(state.model), moved: false, probe: true };
        state.probeMarkers = [];
        return;
      }
      if (state.mode === "figure" && state.reference && !event.button) {
        var refPoint = localPoint(event);
        if (!refPoint) return;
        if (!state.tool) {
          state.noteOverride = "קודם בחרו נקודה או עט.";
          paintTools();
          return;
        }
        if (state.tool === "point") {
          state.pending = refPoint;
          state.noteOverride = "";
          form.classList.remove("hidden");
          input.value = "";
          paint();
          input.focus();
          return;
        }
        if (state.tool === "pen") {
          try { svg.setPointerCapture(event.pointerId); } catch (errRef) { /* ignore */ }
          state.refDrag = [refPoint];
          return;
        }
        var refHit = hitAt(refPoint);
        state.selected = refHit;
        if (!refHit) {
          paint();
          return;
        }
        state.drag = { hit: refHit, start: refPoint, origin: cloneModel(state.model), moved: false };
        paint();
        return;
      }
      if (state.mode !== "sketch" || state.locked || event.button) return;
      var p = localPoint(event);
      if (!p) return;
      if (!state.tool) {
        state.noteOverride = "קודם בחרו נקודה או עט.";
        paintTools();
        return;
      }
      if (state.tool === "point") {
        state.pending = p;
        state.noteOverride = "";
        form.classList.remove("hidden");
        input.value = "";
        paint();
        input.focus();
        return;
      }
      try { svg.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
      if (state.tool === "pen") {
        state.ink = [p];
        state.selected = null;
        paint();
        return;
      }
      var hit = hitAt(p);
      state.selected = hit;
      if (!hit) {
        paint();
        return;
      }
      state.drag = { hit: hit, start: p, origin: cloneModel(state.model), moved: false };
      paint();
    });

    window.addEventListener("pointermove", function (event) {
      if (state.resize) applyResize(event);
    });

    svg.addEventListener("pointermove", function (event) {
      if (state.resize) return;
      if (state.refDrag) {
        var refMove = localPoint(event);
        if (!refMove) return;
        var refLast = state.refDrag[state.refDrag.length - 1];
        if (Math.abs(refMove.x - refLast.x) + Math.abs(refMove.y - refLast.y) < 2) return;
        state.refDrag.push(refMove);
        return;
      }
      if (state.mode !== "sketch" && !(state.mode === "figure" && state.reference) && !(state.drag && state.drag.probe)) return;
      var p = localPoint(event);
      if (!p) return;
      if (state.tool === "pen" && state.ink) {
        var last = state.ink[state.ink.length - 1];
        if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 2) return;
        state.ink.push(p);
        paint();
        return;
      }
      if (!state.drag) return;
      var dqx = p.qx - state.drag.start.qx;
      var dqy = p.qy - state.drag.start.qy;
      if (Math.abs(dqx) + Math.abs(dqy) > 0.012) state.drag.moved = true;
      if (state.drag.hit.kind === "stroke") return;
      var origin = state.drag.origin;
      if (state.drag.hit.kind === "point") {
        var src = origin.points[state.drag.hit.index];
        state.model.points[state.drag.hit.index] = {
          x: src.x,
          y: src.y,
          qx: src.qx + dqx,
          qy: src.qy + dqy,
          role: src.role || "",
        };
      } else if (state.drag.hit.kind === "ref" && origin.refs && origin.refs[state.drag.hit.index]) {
        var srcRef = origin.refs[state.drag.hit.index];
        if (srcRef.role === "probe") {
          var nextQy = srcRef.y1 + dqy;
          var anchors = (state.probe && state.probe.anchors) || [];
          var snapped = false;
          anchors.forEach(function (anchor) {
            if (Math.abs(Number(anchor.qy) - nextQy) < 0.045) {
              nextQy = Number(anchor.qy);
              snapped = true;
            }
          });
          nextQy = Math.max(-1.05, Math.min(1.05, nextQy));
          state.model.refs[state.drag.hit.index] = {
            x1: srcRef.x1,
            y1: nextQy,
            x2: srcRef.x2,
            y2: nextQy,
            role: "probe",
            label: srcRef.label || "y = k",
            snapped: snapped,
          };
          state.probeMarkers = [];
          state.noteOverride = snapped
            ? "הישר עובר בגובה של נקודת קיצון. כאן מספר החיתוכים עשוי להשתנות."
            : "הישר אופקי. גררו אותו ובדקו את נקודות המפגש.";
        } else {
          state.model.refs[state.drag.hit.index] = {
            x1: srcRef.x1 + dqx,
            y1: srcRef.y1 + dqy,
            x2: srcRef.x2 + dqx,
            y2: srcRef.y2 + dqy,
          };
        }
      } else if (origin.line) {
        state.model.line = {
          x1: origin.line.x1 + dqx,
          y1: origin.line.y1 + dqy,
          x2: origin.line.x2 + dqx,
          y2: origin.line.y2 + dqy,
        };
      }
      paint();
    });

    function endDrag(event) {
      if (state.resize) {
        state.resize = null;
        return;
      }
      if (state.refDrag && state.refDrag.length) {
        var a = state.refDrag[0];
        var b = state.refDrag[state.refDrag.length - 1];
        state.refDrag = null;
        if (Math.abs(b.qx - a.qx) + Math.abs(b.qy - a.qy) > 0.08) {
          remember();
          var y1 = b.qy;
          var y2 = b.qy;
          var x1 = a.qx;
          var x2 = b.qx;
          if (Math.abs(b.qy - a.qy) < 0.15) {
            y1 = (a.qy + b.qy) / 2;
            y2 = y1;
            x1 = -0.95;
            x2 = 0.95;
          }
          state.model.refs = (state.model.refs || []).concat([{ x1: x1, y1: y1, x2: x2, y2: y2 }]);
          changed();
        }
        paint();
        return;
      }
      if (state.ink) {
        var ink = state.ink;
        var fitted = fitStroke(ink);
        state.ink = null;
        if (state.family === "free" && ink.length > 3) {
          remember();
          var freeSamples = ink.map(function (p) { return { qx: p.qx, qy: p.qy }; });
          if (freeSamples.length > 48) {
            var thinned = [];
            var stride = (freeSamples.length - 1) / 47;
            var stepIndex;
            for (stepIndex = 0; stepIndex < 48; stepIndex++) thinned.push(freeSamples[Math.round(stepIndex * stride)]);
            freeSamples = thinned;
          }
          state.model.strokes = (state.model.strokes || []).concat([freeSamples]);
          state.noteOverride = "";
          changed();
        } else if (state.family === "parabola" && ink.length > 4) {
          remember();
          state.model.curve = ink.map(function (p) { return { qx: p.qx, qy: p.qy }; });
          state.model.line = null;
          state.noteOverride = "";
          changed();
        } else if (fitted) {
          remember();
          state.model.line = fitted;
          state.noteOverride = "";
          changed();
        }
        paint();
        return;
      }
      if (!state.drag) return;
      var drag = state.drag;
      state.drag = null;
      if (!drag.moved) {
        paint();
        return;
      }
      if (drag.hit.kind === "stroke") {
        paint();
        return;
      }
      if (drag.hit.kind === "line" || drag.hit.kind === "ref") {
        state.undo.push(drag.origin);
        if (!drag.probe) state.noteOverride = "";
        changed();
        paint();
        return;
      }
      var moved = state.model.points[drag.hit.index];
      function revert() {
        state.model.points = drag.origin.points;
        state.model.line = drag.origin.line;
        paint();
      }
      if (!state.onPoint) {
        state.undo.push(drag.origin);
        changed();
        paint();
        return;
      }
      if (state.checking) return;
      state.checking = true;
      state.onPoint(moved, state.model, function (ok, message, extra) {
        state.checking = false;
        if (!ok) {
          state.noteOverride = message || "הנקודה לא במקום המתאים.";
          revert();
          return;
        }
        if (extra && extra.role) moved.role = extra.role;
        state.undo.push(drag.origin);
        state.noteOverride = "";
        changed();
        paint();
      });
    }

    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", function () {
      if (state.resize) state.resize = null;
      if (state.ink) {
        state.ink = null;
        paint();
      }
      if (state.drag) {
        state.model.points = state.drag.origin.points;
        state.model.line = state.drag.origin.line;
        state.drag = null;
        paint();
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!state.pending) return;
      var pair = parsePair(input.value);
      if (!pair) {
        state.noteOverride = "רשמו זוג סדור, למשל (0,−2).";
        paintTools();
        return;
      }
      var point = { x: pair.x, y: pair.y, qx: state.pending.qx, qy: state.pending.qy };
      var pending = state.pending;
      function accept() {
        remember();
        state.model.points = (state.model.points || []).concat([point]);
        state.pending = null;
        state.noteOverride = "";
        form.classList.add("hidden");
        input.value = "";
        paint();
        changed();
      }
      if (!state.onPoint) {
        accept();
        return;
      }
      if (state.checking) return;
      state.checking = true;
      state.onPoint(point, state.model, function (ok, message, extra) {
        state.checking = false;
        if (!ok) {
          state.noteOverride = message || "הנקודה לא במקום המתאים.";
          state.pending = pending;
          paintTools();
          return;
        }
        if (extra && extra.role) point.role = extra.role;
        accept();
      });
    });

    return {
      showFigure: function (figure, hooks) {
        hooks = hooks || {};
        if (hooks.probe) {
          var sameProbe = state.mode === "figure" && state.probe
            && state.partKey === (hooks.partKey || "")
            && state.problemKey === (hooks.problemKey || "");
          state.mode = "figure";
          state.probe = hooks.probe;
          state.figure = figure || null;
          state.reference = false;
          state.onCheck = hooks.onCheck || null;
          state.onChange = hooks.onChange || null;
          state.partKey = hooks.partKey || "";
          state.problemKey = hooks.problemKey || "";
          state.locked = false;
          if (!sameProbe) {
            state.model = { points: [], line: null, refs: [], strokes: [] };
            state.undo = [];
            state.probeMarkers = [];
            state.noteOverride = "";
          }
          state.pending = null;
          state.ink = null;
          state.drag = null;
          paint();
          return;
        }
        state.probe = null;
        var keepTools = state.mode === "figure" && state.reference && !!(figure && hooks.reference);
        state.mode = figure ? "figure" : "hidden";
        releaseBoardShift();
        state.locked = false;
        state.reference = !!(figure && hooks.reference);
        state.figure = figure || null;
        state.onChange = hooks.onChange || null;
        if (!state.reference) {
          state.model = { points: [], line: null, refs: [], curve: [] };
          state.undo = [];
          state.tool = "";
          state.selected = null;
        } else if (!keepTools) {
          state.model = cloneModel(hooks.model || { points: [], line: null, refs: [] });
          state.undo = [];
          state.tool = "";
          state.selected = null;
        }
        state.pending = null;
        state.ink = null;
        state.drag = null;
        state.refDrag = null;
        state.noteOverride = "";
        form.classList.add("hidden");
        paint();
      },
      showSketch: function (hooks) {
        hooks = hooks || {};
        state.onPoint = hooks.onPoint || null;
        state.onChange = hooks.onChange || null;
        state.onCheck = hooks.onCheck || null;
        state.family = hooks.family || "";
        state.helperLine = hooks.helperLine || null;
        state.allowCheck = hooks.allowCheck !== false;
        state.domain = hooks.domain || null;
        var incoming = hooks.model || { points: [], line: null };
        var lock = !!hooks.locked;
        var partKey = hooks.partKey || "";
        var problemKey = hooks.problemKey || "";
        if ((partKey && partKey !== state.partKey) || (problemKey && problemKey !== state.problemKey)) {
          state.partKey = partKey;
          state.problemKey = problemKey;
          state.mode = "sketch";
          state.locked = lock;
          state.figure = null;
          state.model = cloneModel(incoming);
          state.undo = Array.isArray(hooks.undo) ? hooks.undo.map(cloneModel) : [];
          state.selected = null;
          state.pending = null;
          state.ink = null;
          state.drag = null;
          state.noteOverride = "";
          form.classList.add("hidden");
          paint();
          return;
        }
        state.partKey = partKey;
        state.problemKey = problemKey;
        if (state.mode !== "sketch" || lock !== state.locked) {
          state.mode = "sketch";
          state.locked = lock;
          state.figure = null;
          state.model = incoming;
          state.undo = [];
          state.tool = "";
          state.selected = null;
          state.pending = null;
          state.ink = null;
          state.drag = null;
          state.noteOverride = "";
          form.classList.add("hidden");
          paint();
          return;
        }
        state.locked = lock;
        if (incoming !== state.model && !sameModel(state.model, incoming)) {
          state.model = incoming;
          state.undo = [];
          state.selected = null;
          state.pending = null;
          state.ink = null;
          state.drag = null;
          state.noteOverride = "";
          form.classList.add("hidden");
        }
        paint();
      },
      snapshot: function () {
        return {
          model: cloneModel(state.model),
          undo: (state.undo || []).map(cloneModel),
        };
      },
      card: function (model) {
        var picture = el("svg", { viewBox: "0 0 " + W + " " + H, class: "fn-svg fn-history-svg" });
        picture.setAttribute("preserveAspectRatio", "xMidYMid meet");
        axes(picture);
        ((model && model.strokes) || []).forEach(function (stroke) {
          drawCurve(picture, stroke, "fn-ink");
        });
        if (model && model.curve && model.curve.length) drawCurve(picture, model.curve, "fn-graph-line");
        if (model && model.line) drawLine(picture, model.line, false);
        ((model && model.refs) || []).forEach(function (ref) { drawLine(picture, ref, false); });
        drawPoints(picture, (model && model.points) || [], -1);
        return picture;
      },
      hide: function () {
        state.mode = "hidden";
        releaseBoardShift();
        state.locked = false;
        state.pending = null;
        state.ink = null;
        state.drag = null;
        form.classList.add("hidden");
        paint();
      },
      getModel: function () {
        return cloneModel(state.model);
      },
      getProbe: function () {
        var ref = ((state.model && state.model.refs) || []).filter(function (item) { return item.role === "probe"; })[0];
        return { on: !!ref, qy: ref ? ref.y1 : null };
      },
      setProbeMarkers: function (markers) {
        state.probeMarkers = markers || [];
        if (state.mode === "figure") paint();
      },
      setModel: function (model) {
        state.model = model || { points: [], line: null };
        if (state.mode === "sketch") paint();
      },
    };
  }

  global.DoctematicaFnSketch = { mount: mount };
})(window);
