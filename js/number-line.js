(function (global) {
  var host = null;
  var onEmpty = null;
  var svg = null;
  var drag = null;
  var state = empty();
  var NEAR = 0.08;

  function laneCount() {
    return Math.max(2, (state.arrows && state.arrows.length) || 0);
  }

  function axisY() {
    return 36 + laneCount() * 28;
  }

  function laneY(idx) {
    return 24 + (idx % laneCount()) * 28;
  }

  function empty() {
    return {
      open: false,
      step: 0,
      marks: [],
      arrows: [],
      selected: null,
      overlap: null,
      note: "",
    };
  }

  function reset() {
    var check = state.onCheck;
    state = empty();
    state.onCheck = check;
    drag = null;
    render();
  }

  function close() {
    state.open = false;
    drag = null;
    render();
  }

  function open() {
    state.open = true;
    render();
  }

  function isOpen() {
    return !!state.open;
  }

  function nearestMark(pos) {
    var best = null;
    var bestD = 1;
    state.marks.forEach(function (mark) {
      var d = Math.abs(mark.pos - pos);
      if (d < bestD) {
        best = mark;
        bestD = d;
      }
    });
    return bestD <= NEAR ? best : null;
  }

  function snapshot() {
    var layers = state.arrows.map(function (arrow) {
      var mark = nearestMark(arrow.pos);
      if (!mark) return null;
      return { bound: mark.value, included: !!arrow.included, direction: arrow.direction };
    });
    return {
      open: !!state.open,
      step: state.step,
      marks: state.marks.map(function (mark) {
        return { value: mark.value, pos: mark.pos };
      }),
      arrows: state.arrows.map(function (arrow) {
        return { direction: arrow.direction, pos: arrow.pos, included: !!arrow.included };
      }),
      layers: layers,
      overlap: !!state.overlap,
    };
  }

  function applyAction(action) {
    if (!action) return;
    if (action.type === "mark") {
      var exists = state.marks.some(function (mark) {
        return Math.abs(Number(mark.value) - Number(action.value)) < 1e-8;
      });
      if (!exists) {
        state.marks.push({
          value: Number(action.value),
          pos: action.pos,
          num: action.num,
          den: action.den,
          sign: action.sign,
        });
      }
    } else if (action.type === "move") {
      state.marks.forEach(function (mark) {
        if (Math.abs(Number(mark.value) - Number(action.value)) < 1e-8) mark.pos = action.pos;
      });
    } else if (action.type === "arrow") {
      state.arrows.push({
        direction: action.direction,
        included: !!action.included,
        pos: action.pos,
      });
    } else if (action.type === "arrow-fix" && state.arrows[action.index]) {
      var fixed = state.arrows[action.index];
      if (action.direction) fixed.direction = action.direction;
      if (action.included != null) fixed.included = !!action.included;
      if (action.pos != null) fixed.pos = action.pos;
    } else if (action.type === "layer" && action.layer && action.layer.direction !== "segment") {
      var pos = posOfValue(action.layer.bound);
      if (pos == null) pos = 0.5;
      var near = state.arrows.some(function (arrow) {
        return arrow.direction === action.layer.direction && Math.abs(arrow.pos - pos) <= NEAR;
      });
      if (!near) state.arrows.push({ direction: action.layer.direction, included: !!action.layer.included, pos: pos });
    } else if (action.type === "overlap") {
      state.overlap = action;
    }
    state.step += 1;
    state.note = "";
    render();
  }

  function fmt(n) {
    var v = Number(n);
    if (Math.abs(v - Math.round(v)) < 1e-8) return String(Math.round(v)).replace("-", "−");
    return String(Math.round(v * 1000) / 1000).replace("-", "−");
  }

  function parseNum(text) {
    var t = String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/\u2044/g, "/")
      .replace(/\s+/g, "");
    if (!t) return null;
    if (/^-?\d+(?:\.\d+)?$/.test(t)) return { value: Number(t) };
    var wrapped = t.match(/^-\((\d+)\/(\d+)\)$/);
    var signed = wrapped ? null : t.match(/^(?:-?\()?(-?)(\d+)\)?\/(\d+)\)?$/);
    var sign = 1;
    var num;
    var den;
    if (wrapped) {
      sign = -1;
      num = Number(wrapped[1]);
      den = Number(wrapped[2]);
    } else if (signed && signed[3]) {
      sign = signed[1] === "-" ? -1 : 1;
      num = Number(signed[2]);
      den = Number(signed[3]);
    } else return null;
    if (!den || !isFinite(num) || !isFinite(den)) return null;
    return { value: (sign * num) / den, num: num, den: den, sign: sign };
  }

  function xOf(pos) {
    return 36 + pos * 568;
  }

  function posFromClient(clientX) {
    if (!svg) return 0.5;
    var rect = svg.getBoundingClientRect();
    if (!rect.width) return 0.5;
    return clamp((clientX - rect.left) / rect.width);
  }

  function clamp(pos) {
    return Math.min(0.92, Math.max(0.08, pos));
  }

  function posOfValue(value) {
    var i;
    for (i = 0; i < state.marks.length; i++) {
      if (Math.abs(Number(state.marks[i].value) - Number(value)) < 1e-8) return state.marks[i].pos;
    }
    return null;
  }

  function freePos() {
    var spots = [0.5, 0.35, 0.65, 0.22, 0.78];
    var i;
    for (i = 0; i < spots.length; i++) {
      var taken = state.marks.some(function (mark) {
        return Math.abs(mark.pos - spots[i]) < 0.06;
      }) || state.arrows.some(function (arrow) {
        return Math.abs(arrow.pos - spots[i]) < 0.06;
      });
      if (!taken) return spots[i];
    }
    return 0.5;
  }

  function render() {
    if (!host) return;
    host.classList.toggle("hidden", !state.open);
    host.innerHTML = "";
    svg = null;
    if (!state.open) return;

    var tools = document.createElement("div");
    tools.className = "nline-tools";
    var input = document.createElement("input");
    input.type = "text";
    input.className = "nline-num";
    input.dir = "ltr";
    input.placeholder = "מספר או שבר, ואז אנטר";
    input.setAttribute("aria-label", "הקלידו מספר או שבר ולחצו אנטר כדי לשים אותו על הציר");
    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      event.stopPropagation();
      placeTypedNumber(input.value);
    });
    tools.appendChild(input);
    tools.appendChild(button("הוסף מספר", function () {
      placeTypedNumber(input.value);
    }));
    tools.appendChild(button("חץ ימינה", function () { addArrow("right"); }));
    tools.appendChild(button("חץ שמאלה", function () { addArrow("left"); }));
    tools.appendChild(button("נקודה", function () { addArrow("point"); }));
    tools.appendChild(button("מחק", removeSelected));
    tools.appendChild(button("בדוק שרטוט", function () {
      if (typeof state.onCheck === "function") state.onCheck(snapshot());
    }));
    tools.appendChild(button("∅", function () {
      if (typeof onEmpty === "function") onEmpty();
    }));

    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 640 " + (axisY() + 78));
    svg.setAttribute("class", "nline-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "ציר מספרים");
    drawAxis(svg);
    drawOverlap(svg);
    state.arrows.forEach(function (arrow, idx) {
      drawArrow(svg, arrow, idx);
    });
    state.marks.forEach(function (mark, idx) {
      drawMark(svg, mark, idx);
    });
    svg.addEventListener("pointermove", onPointerMove);
    svg.addEventListener("pointerup", onPointerUp);
    svg.addEventListener("pointercancel", onPointerUp);

    var note = document.createElement("p");
    note.className = "nline-note";
    note.textContent = state.note || "הקלידו מספר או שבר ולחצו אנטר, ואז גררו אותו על הציר. לחיצה על העיגול פותחת או סוגרת אותו.";

    host.appendChild(svg);
    host.appendChild(tools);
    host.appendChild(note);
    if (state.refocusNum) {
      state.refocusNum = false;
      input.focus();
    }
  }

  function placeTypedNumber(raw) {
    var parsed = parseNum(raw);
    state.refocusNum = true;
    if (!parsed) {
      state.note = "כתבו מספר או שבר, למשל 3 או −2, ולחצו אנטר.";
      render();
      return;
    }
    var existing = -1;
    state.marks.forEach(function (mark, idx) {
      if (Math.abs(mark.value - parsed.value) < 1e-8) existing = idx;
    });
    if (existing >= 0) {
      state.selected = { kind: "mark", index: existing };
      state.note = "המספר כבר על הציר. גררו אותו למקום המתאים.";
      render();
      return;
    }
    state.marks.push({
      value: parsed.value,
      pos: freePos(),
      num: parsed.num,
      den: parsed.den,
      sign: parsed.sign,
    });
    state.selected = { kind: "mark", index: state.marks.length - 1 };
    state.note = "";
    render();
  }

  function addArrow(direction) {
    if (state.arrows.length >= 8) {
      state.note = "יש כבר כמה חצים. מחקו חץ מיותר.";
      render();
      return;
    }
    state.arrows.push({ direction: direction, included: direction === "point", pos: freePos() });
    state.selected = { kind: "arrow", index: state.arrows.length - 1 };
    state.note = "";
    render();
  }

  function button(label, fn) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ghost nline-btn";
    b.textContent = label;
    b.addEventListener("click", fn);
    return b;
  }

  function el(name, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function drawAxis(node) {
    var yAxis = axisY();
    node.appendChild(el("line", { x1: 18, y1: yAxis, x2: 622, y2: yAxis, class: "nline-axis" }));
    node.appendChild(el("polygon", { points: "622," + yAxis + " 610," + (yAxis - 5) + " 610," + (yAxis + 5), class: "nline-axis" }));
    node.appendChild(el("polygon", { points: "18," + yAxis + " 30," + (yAxis - 5) + " 30," + (yAxis + 5), class: "nline-axis" }));
  }

  function drawMark(node, mark, idx) {
    var x = xOf(mark.pos);
    var yAxis = axisY();
    var tick = el("line", { x1: x, y1: yAxis - 8, x2: x, y2: yAxis + 8, class: "nline-tick" });
    var label = el("text", { x: x, y: yAxis + 28, class: "nline-label", "text-anchor": "middle" });
    var frac = null;
    if (mark.den) {
      frac = drawFrac(node, x, yAxis + 22, mark);
      label = frac.g;
    } else {
      label.textContent = fmt(mark.value);
    }
    var hit = el("circle", {
      cx: x,
      cy: axisY(),
      r: 16,
      class: "nline-hit nline-drag" + (isSelected("mark", idx) ? " is-on" : ""),
    });
    hit.addEventListener("pointerdown", function (event) {
      beginDrag(event, "mark", idx, false);
    });
    mark.node = { tick: tick, label: label, hit: hit, frac: frac };
    node.appendChild(tick);
    node.appendChild(hit);
    node.appendChild(label);
  }

  function drawFrac(node, x, yTop, mark) {
    var g = el("g", { class: "nline-frac", "pointer-events": "none" });
    var numText = (mark.sign < 0 ? "−" : "") + String(mark.num);
    var num = el("text", { x: x, y: yTop + 11, class: "nline-label nline-frac-num", "text-anchor": "middle" });
    num.textContent = numText;
    var den = el("text", { x: x, y: yTop + 29, class: "nline-label nline-frac-den", "text-anchor": "middle" });
    den.textContent = String(mark.den);
    var w = Math.max(numText.length, String(mark.den).length) * 8 + 6;
    var bar = el("line", {
      x1: x - w / 2,
      y1: yTop + 15,
      x2: x + w / 2,
      y2: yTop + 15,
      class: "nline-frac-bar",
    });
    g.appendChild(num);
    g.appendChild(bar);
    g.appendChild(den);
    return { g: g, num: num, den: den, bar: bar, w: w };
  }

  function drawArrow(node, arrow, idx) {
    var color = ["nline-a", "nline-b", "nline-c"][idx % 3];
    var y = arrow.direction === "point" ? axisY() : laneY(idx);
    var line = el("line", { class: "nline-ray " + color });
    var shaft = el("line", { class: "nline-shaft" });
    var head = el("polygon", { class: "nline-head " + color });
    var point = el("circle", { r: 6, class: "nline-point " + color + (arrow.included ? " is-closed" : " is-open") });
    var hit = el("circle", { r: 14, class: "nline-hit nline-drag" + (isSelected("arrow", idx) ? " is-on" : "") });
    arrow.node = { line: line, shaft: shaft, head: head, point: point, hit: hit, y: y };
    paintArrow(arrow);
    point.addEventListener("pointerdown", function (event) {
      beginDrag(event, "arrow", idx, true);
    });
    shaft.addEventListener("pointerdown", function (event) {
      beginDrag(event, "arrow", idx, false);
    });
    hit.addEventListener("pointerdown", function (event) {
      beginDrag(event, "arrow", idx, true);
    });
    node.appendChild(line);
    node.appendChild(shaft);
    node.appendChild(head);
    node.appendChild(point);
    node.appendChild(hit);
  }

  function paintMark(mark) {
    if (!mark.node) return;
    var x = xOf(mark.pos);
    mark.node.tick.setAttribute("x1", x);
    mark.node.tick.setAttribute("x2", x);
    if (mark.node.frac) {
      var frac = mark.node.frac;
      var half = frac.w / 2;
      frac.num.setAttribute("x", x);
      frac.den.setAttribute("x", x);
      frac.bar.setAttribute("x1", x - half);
      frac.bar.setAttribute("x2", x + half);
    } else {
      mark.node.label.setAttribute("x", x);
    }
    mark.node.hit.setAttribute("cx", x);
  }

  function paintArrow(arrow) {
    if (!arrow.node) return;
    var x = xOf(arrow.pos);
    var y = arrow.node.y;
    if (arrow.direction === "point") {
      arrow.node.line.setAttribute("x1", x);
      arrow.node.line.setAttribute("x2", x);
      arrow.node.line.setAttribute("y1", y);
      arrow.node.line.setAttribute("y2", y);
      arrow.node.shaft.setAttribute("x1", x);
      arrow.node.shaft.setAttribute("x2", x);
      arrow.node.shaft.setAttribute("y1", y);
      arrow.node.shaft.setAttribute("y2", y);
      arrow.node.head.setAttribute("points", x + "," + y);
      arrow.node.point.setAttribute("cx", x);
      arrow.node.point.setAttribute("cy", y);
      arrow.node.point.classList.toggle("is-closed", true);
      arrow.node.point.classList.toggle("is-open", false);
      arrow.node.hit.setAttribute("cx", x);
      arrow.node.hit.setAttribute("cy", y);
      return;
    }
    var tip;
    var tail;
    if (arrow.direction === "right") {
      tail = x;
      tip = 608;
      arrow.node.head.setAttribute("points", tip + "," + y + " " + (tip - 12) + "," + (y - 6) + " " + (tip - 12) + "," + (y + 6));
    } else {
      tail = x;
      tip = 32;
      arrow.node.head.setAttribute("points", tip + "," + y + " " + (tip + 12) + "," + (y - 6) + " " + (tip + 12) + "," + (y + 6));
    }
    arrow.node.line.setAttribute("x1", Math.min(tail, tip));
    arrow.node.line.setAttribute("x2", Math.max(tail, tip));
    arrow.node.line.setAttribute("y1", y);
    arrow.node.line.setAttribute("y2", y);
    arrow.node.shaft.setAttribute("x1", Math.min(tail, tip));
    arrow.node.shaft.setAttribute("x2", Math.max(tail, tip));
    arrow.node.shaft.setAttribute("y1", y);
    arrow.node.shaft.setAttribute("y2", y);
    arrow.node.point.setAttribute("cx", x);
    arrow.node.point.setAttribute("cy", y);
    arrow.node.point.classList.toggle("is-closed", !!arrow.included);
    arrow.node.point.classList.toggle("is-open", !arrow.included);
    arrow.node.hit.setAttribute("cx", x);
    arrow.node.hit.setAttribute("cy", y);
  }

  function drawCover(node, ov) {
    if (!ov || ov.empty) return;
    var x1 = ov.from === "-inf" || ov.from == null ? 32 : xOf(posOfValue(ov.from) == null ? 0.08 : posOfValue(ov.from));
    var x2 = ov.to === "inf" || ov.to == null ? 608 : xOf(posOfValue(ov.to) == null ? 0.92 : posOfValue(ov.to));
    var yAxis = axisY();
    if (ov.point || Math.abs(x1 - x2) < 2) {
      node.appendChild(el("circle", { cx: x1, cy: yAxis, r: 7, class: "nline-overlap" }));
      return;
    }
    node.appendChild(el("line", {
      x1: Math.min(x1, x2),
      y1: yAxis,
      x2: Math.max(x1, x2),
      y2: yAxis,
      class: "nline-overlap",
    }));
  }

  function drawOverlap(node) {
    var ov = state.overlap;
    if (!ov || ov.empty) return;
    var regions = ov.regions && ov.regions.length ? ov.regions : [ov];
    regions.forEach(function (region) { drawCover(node, region); });
  }

  function isSelected(kind, index) {
    return state.selected && state.selected.kind === kind && state.selected.index === index;
  }

  function beginDrag(event, kind, index, fromCircle) {
    event.preventDefault();
    event.stopPropagation();
    var item = kind === "mark" ? state.marks[index] : state.arrows[index];
    if (!item) return;
    state.selected = { kind: kind, index: index };
    drag = {
      kind: kind,
      index: index,
      fromCircle: !!fromCircle,
      startPos: item.pos,
      x: event.clientX,
      moved: false,
    };
    if (svg.setPointerCapture) {
      try { svg.setPointerCapture(event.pointerId); } catch (err) {}
    }
    paintSelection();
  }

  function onPointerMove(event) {
    if (!drag) return;
    var item = drag.kind === "mark" ? state.marks[drag.index] : state.arrows[drag.index];
    if (!item || !svg) return;
    var rect = svg.getBoundingClientRect();
    var dx = rect.width ? (event.clientX - drag.x) / rect.width : 0;
    if (Math.abs(event.clientX - drag.x) > 4) drag.moved = true;
    item.pos = clamp(drag.startPos + dx);
    if (drag.kind === "mark") paintMark(item);
    else paintArrow(item);
  }

  function onPointerUp() {
    if (!drag) return;
    var item = drag.kind === "arrow" ? state.arrows[drag.index] : null;
    if (item && drag.fromCircle && !drag.moved) {
      item.included = !item.included;
      paintArrow(item);
    }
    drag = null;
  }

  function paintSelection() {
    if (!host) return;
    host.querySelectorAll(".nline-hit.is-on").forEach(function (node) {
      node.classList.remove("is-on");
    });
    if (!state.selected) return;
    var item = state.selected.kind === "mark" ? state.marks[state.selected.index] : state.arrows[state.selected.index];
    if (item && item.node && item.node.hit) item.node.hit.classList.add("is-on");
  }

  function removeSelected() {
    if (!state.selected) {
      state.note = "בחרו מספר או חץ, ואז מחקו.";
      render();
      return;
    }
    if (state.selected.kind === "mark") state.marks.splice(state.selected.index, 1);
    else state.arrows.splice(state.selected.index, 1);
    state.selected = null;
    state.note = "";
    render();
  }

  function mount(el, opts) {
    host = el;
    opts = opts || {};
    onEmpty = opts.onEmpty || null;
    state.onCheck = opts.onCheck || null;
    render();
  }

  global.DoctematicaNumberLine = {
    mount: mount,
    reset: reset,
    open: open,
    close: close,
    isOpen: isOpen,
    snapshot: snapshot,
    applyAction: applyAction,
  };
})(window);
