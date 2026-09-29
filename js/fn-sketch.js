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
      class: "fn-graph-line" + (selected ? " is-selected" : ""),
    }));
  }

  function drawCurve(svg, samples, className) {
    if (!samples || samples.length < 2) return;
    var d = samples.map(function (p, index) {
      return (index ? "L " : "M ") + sx(p.qx).toFixed(1) + " " + sy(p.qy).toFixed(1);
    }).join(" ");
    svg.appendChild(el("path", { d: d, class: className || "fn-graph-line" }));
  }

  function drawFigure(svg, figure) {
    var hasCurve = figure && figure.curve && figure.curve.length;
    if (hasCurve) drawCurve(svg, figure.curve, "fn-graph-line");
    var line = figure && figure.line;
    if (!line && !hasCurve) {
      var trend = figure && figure.trend;
      line = {
        x1: -0.72,
        y1: trend === "dec" ? 0.55 : trend === "flat" ? 0.38 : -0.15,
        x2: 0.72,
        y2: trend === "dec" ? -0.45 : trend === "flat" ? 0.38 : 0.62,
      };
    }
    if (line) drawLine(svg, line);
    var marks = (figure && figure.marks) || [];
    marks.forEach(function (mark) {
      var q = mark && typeof mark === "object" ? Number(mark.qx) : (Number(mark) < 0 ? -0.62 : 0.48);
      var text = mark && mark.label ? mark.label : "x=" + String(mark).replace(/-/g, "−");
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
        return { x: p.x, y: p.y, qx: p.qx, qy: p.qy };
      }),
      line: model.line
        ? { x1: model.line.x1, y1: model.line.y1, x2: model.line.x2, y2: model.line.y2 }
        : null,
      curve: (model.curve || []).map(function (p) { return { qx: p.qx, qy: p.qy }; }),
      refs: (model.refs || []).map(function (r) {
        return { x1: r.x1, y1: r.y1, x2: r.x2, y2: r.y2 };
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
      (model && model.curve && model.curve.length)
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
      model: { points: [], line: null },
      pending: null,
      ink: null,
      drag: null,
      selected: null,
      undo: [],
      noteOverride: "",
      locked: false,
      onPoint: null,
      onChange: null,
      onCheck: null,
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
    edit.appendChild(moveBtn);
    edit.appendChild(undoBtn);
    edit.appendChild(deleteBtn);
    tools.appendChild(pick);
    tools.appendChild(edit);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("class", "fn-svg");
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
    root.appendChild(svg);
    root.appendChild(form);
    root.appendChild(note);
    root.appendChild(checkSketchBtn);
    checkSketchBtn.addEventListener("click", function () {
      if (state.onCheck) state.onCheck();
    });

    function defaultNote() {
      if (state.tool === "point") return "לחצו על המקום, ורשמו את הזוג.";
      if (state.tool === "pen" && state.reference) return "גררו קו עזר. ישר כמעט אופקי נצמד ל־y קבוע.";
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

    function paintTools() {
      var live = (state.mode === "sketch" && !state.locked) || (state.mode === "figure" && state.reference);
      tools.classList.toggle("hidden", !live);
      checkSketchBtn.classList.toggle("hidden", state.mode !== "sketch" || !!state.locked);
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
      if (state.mode === "figure" && state.reference) note.textContent = state.noteOverride || defaultNote();
      else if (state.mode !== "sketch") note.textContent = "";
      else if (state.locked) note.textContent = "";
      else note.textContent = state.noteOverride || defaultNote();
    }

    function paint() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      axes(svg);
      if (state.mode === "figure" && state.figure) {
        drawFigure(svg, state.figure);
        var selectedRef = state.selected && state.selected.kind === "ref" ? state.selected.index : -1;
        var selectedPoint = state.selected && state.selected.kind === "point" ? state.selected.index : -1;
        drawPoints(svg, state.model.points, selectedPoint);
        (state.model.refs || []).forEach(function (ref, index) { drawLine(svg, ref, index === selectedRef); });
      }
      if (state.mode === "sketch") {
        var selectedPoint = state.selected && state.selected.kind === "point" ? state.selected.index : -1;
        var selectedLine = !!(state.selected && state.selected.kind === "line");
        drawPoints(svg, state.model.points, selectedPoint);
        if (state.model.curve && state.model.curve.length) drawCurve(svg, state.model.curve, "fn-graph-line");
        if (state.model.line) drawLine(svg, state.model.line, selectedLine);
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
      else state.model.line = null;
      state.selected = null;
      state.noteOverride = "";
      changed();
      paint();
    });

    svg.addEventListener("pointerdown", function (event) {
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

    svg.addEventListener("pointermove", function (event) {
      if (state.refDrag) {
        var refMove = localPoint(event);
        if (!refMove) return;
        var refLast = state.refDrag[state.refDrag.length - 1];
        if (Math.abs(refMove.x - refLast.x) + Math.abs(refMove.y - refLast.y) < 2) return;
        state.refDrag.push(refMove);
        return;
      }
      if (state.mode !== "sketch" && !(state.mode === "figure" && state.reference)) return;
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
      var origin = state.drag.origin;
      if (state.drag.hit.kind === "point") {
        var src = origin.points[state.drag.hit.index];
        state.model.points[state.drag.hit.index] = {
          x: src.x,
          y: src.y,
          qx: src.qx + dqx,
          qy: src.qy + dqy,
        };
      } else if (state.drag.hit.kind === "ref" && origin.refs && origin.refs[state.drag.hit.index]) {
        var srcRef = origin.refs[state.drag.hit.index];
        state.model.refs[state.drag.hit.index] = {
          x1: srcRef.x1 + dqx,
          y1: srcRef.y1 + dqy,
          x2: srcRef.x2 + dqx,
          y2: srcRef.y2 + dqy,
        };
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
        if (state.family === "parabola" && ink.length > 4) {
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
      if (drag.hit.kind === "line" || drag.hit.kind === "ref") {
        state.undo.push(drag.origin);
        state.noteOverride = "";
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
      state.onPoint(moved, state.model, function (ok, message) {
        state.checking = false;
        if (!ok) {
          state.noteOverride = message || "הנקודה לא במקום המתאים.";
          revert();
          return;
        }
        state.undo.push(drag.origin);
        state.noteOverride = "";
        changed();
        paint();
      });
    }

    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", function () {
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
      state.onPoint(point, state.model, function (ok, message) {
        state.checking = false;
        if (!ok) {
          state.noteOverride = message || "הנקודה לא במקום המתאים.";
          state.pending = pending;
          paintTools();
          return;
        }
        accept();
      });
    });

    return {
      showFigure: function (figure, hooks) {
        hooks = hooks || {};
        var keepTools = state.mode === "figure" && state.reference && !!(figure && hooks.reference);
        state.mode = figure ? "figure" : "hidden";
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
        var incoming = hooks.model || { points: [], line: null };
        var lock = !!hooks.locked;
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
        if (incoming !== state.model && modelHas(incoming) && !sameModel(state.model, incoming)) {
          state.model = incoming;
          state.undo = [];
          state.selected = null;
        }
        paint();
      },
      hide: function () {
        state.mode = "hidden";
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
      setModel: function (model) {
        state.model = model || { points: [], line: null };
        if (state.mode === "sketch") paint();
      },
    };
  }

  global.DoctematicaFnSketch = { mount: mount };
})(window);
