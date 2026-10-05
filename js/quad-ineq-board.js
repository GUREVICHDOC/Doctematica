(function (global) {
  var host = null;
  var state = empty();
  var commitHandler = null;
  var FIELDS = ["x", "expr", "value", "sign"];

  function empty() {
    return {
      open: false,
      mode: "",
      roots: [],
      regions: [],
      rows: [],
      direction: "",
      marks: [],
      criticals: [],
      criticalReady: false,
      rootCount: null,
      probes: {},
      markSeq: 1,
      selected: null,
      note: "",
      signSeed: null,
      stroke: [],
      pen: false,
    };
  }

  function mount(el) {
    host = el;
    render();
  }

  function reset() {
    state = empty();
    render();
  }

  function open(mode) {
    state.open = true;
    state.mode = mode || state.mode || "signs";
    render();
  }

  function close() {
    state.open = false;
    render();
  }

  function isOpen() {
    return !!state.open;
  }

  function setModel(model) {
    model = model || {};
    if (model.roots) {
      state.roots = model.roots;
      state.criticalReady = true;
      state.criticals = placedCriticals(model.roots);
      state.rootCount = model.rootCount != null ? model.rootCount : model.roots.length;
    }
    if (model.regions) {
      state.regions = model.regions;
      while (state.rows.length < state.regions.length) state.rows.push({ x: "", expr: "", value: "", sign: "" });
    }
    render();
  }

  function applyAction(action) {
    if (!action) return;
    state.open = true;
    if (!state.mode) state.mode = "signs";
    if (action.type === "sample" || action.type === "expr" || action.type === "result" || action.type === "mark") {
      state.mode = "signs";
      var row = state.rows[action.region] || { x: "", expr: "", value: "", sign: "" };
      if (action.type === "sample") row.x = action.text || String(action.value);
      if (action.type === "expr") row.expr = action.text || "";
      if (action.type === "result") row.value = action.text || "";
      if (action.type === "mark") row.sign = action.sign || "";
      state.rows[action.region] = row;
      state.signSeed = state.signSeed || {};
      state.signSeed[action.region] = {
        x: row.x,
        expr: row.expr,
        value: row.value,
        sign: row.sign,
        force: action.type,
      };
    }
    if (action.type === "direction") state.direction = action.direction;
    render();
  }

  function snapshot() {
    return {
      open: !!state.open,
      mode: state.mode,
      regions: state.rows.map(function (row) {
        return { x: row.x, expr: row.expr, value: row.value, sign: row.sign };
      }),
      parabola: {
        open: state.open && state.mode === "parabola",
        direction: state.direction,
        marks: state.marks.map(function (mark) {
          return { value: mark.value, pos: mark.pos, x: xOfSign(mark.pos) };
        }),
        stroke: thinStroke(state.stroke || []).map(function (p) {
          return { x: Math.round(p.x), above: Math.round(96 - p.y) };
        }),
        regionSign: state.parabolaSign || null,
      },
    };
  }

  function render() {
    if (!host) return;
    host.classList.toggle("hidden", !state.open);
    host.innerHTML = "";
    if (!state.open) return;
    var tools = document.createElement("div");
    tools.className = "qineq-tools";
    tools.appendChild(button("בדיקת סימנים", function () { state.mode = "signs"; render(); }, state.mode === "signs"));
    tools.appendChild(button("שרטוט פרבולה", function () { state.mode = "parabola"; render(); }, state.mode === "parabola"));
    host.appendChild(tools);
    if (state.mode === "parabola") renderParabola();
    else renderSigns();
  }

  function button(label, fn, on) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ghost nline-btn" + (on ? " is-on" : "");
    b.textContent = label;
    b.addEventListener("click", fn);
    return b;
  }

  function renderSigns() {
    var note = document.createElement("p");
    note.className = "qineq-note";
    var cuts = state.criticalReady ? (state.criticals || []).length : null;
    note.textContent = cuts === 0
      ? "אין נקודות אפס על הציר. ממלאים מספר אחד, ואפשר גם הצבה, תוצאה וסימן. אחרי כל מילוי לוחצים אנטר."
      : cuts === 1
        ? "נקודת האפס מחלקת את הציר לשני תחומים. בכל תחום ממלאים מספר, הצבה, תוצאה וסימן."
        : cuts === 2
          ? "נקודות האפס מחלקות את הציר לשלושה תחומים. בכל תחום ממלאים מספר, הצבה, תוצאה וסימן."
          : "כל מספר על הציר מפריד תחומים. בכל תחום ממלאים מספר, הצבה, תוצאה וסימן. אחרי כל מילוי לוחצים אנטר.";
    host.appendChild(note);

    var input = null;
    if (!state.criticalReady) {
    var tools = document.createElement("div");
    tools.className = "nline-tools";
    input = document.createElement("input");
    input.type = "text";
    input.className = "nline-num qineq-num";
    input.dir = "rtl";
    input.placeholder = "מספר או שבר, ואז אנטר";
    input.setAttribute("aria-label", "הקלידו מספר או שבר ולחצו אנטר כדי לשים אותו על הציר");
    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      event.stopPropagation();
      placeBoundary(input.value);
    });
    tools.appendChild(input);
    tools.appendChild(button("הוסף מספר", function () { placeBoundary(input.value); }));
    tools.appendChild(button("מחק", removeBoundary));
    host.appendChild(tools);
    }

    var zones = signZones();
    absorbSeeds(zones);
    var stage = document.createElement("div");
    stage.className = "qineq-stage";
    var row = document.createElement("div");
    row.className = "qineq-zones";
    zones.forEach(function (zone, index) {
      row.appendChild(zoneEditor(zone, index));
    });
    stage.appendChild(row);
    stage.appendChild(drawSignAxis());
    host.appendChild(stage);

    var foot = document.createElement("p");
    foot.className = "nline-note";
    foot.textContent = state.note || "גררו את המספרים על הציר. אחרי כל מילוי לוחצים אנטר, והאתר עובר לתא הבא.";
    host.appendChild(foot);
    syncRows(zones);
    if (state.focus) focusPending();
    else if (state.refocusNum && input) {
      state.refocusNum = false;
      input.focus();
    }
  }

  function placedCriticals(roots) {
    var list = roots || [];
    if (!list.length) return [];
    var vals = list.map(function (r) { return Number(r.value != null ? r.value : r); });
    var min = Math.min.apply(null, vals);
    var max = Math.max.apply(null, vals);
    var span = max - min;
    return list.map(function (r, i) {
      var v = Number(r.value != null ? r.value : r);
      var pos = list.length === 1 || span < 1e-9 ? 0.5 : 0.28 + 0.44 * ((v - min) / span);
      return { id: "c" + i, value: v, pos: pos, text: r.text || fmtSign(v), locked: true };
    });
  }

  function boundMarks() {
    if (state.criticalReady) return state.criticals || [];
    return state.marks;
  }

  function signZones() {
    var ordered = boundMarks().slice().sort(function (a, b) { return a.pos - b.pos; });
    var cuts = [{ x: 0 }].concat(ordered.map(function (mark) {
      return { x: xOfSign(mark.pos), mark: mark };
    })).concat([{ x: 640 }]);
    var zones = [];
    var i;
    for (i = 0; i < cuts.length - 1; i++) {
      var left = cuts[i].mark || null;
      var right = cuts[i + 1].mark || null;
      zones.push({
        id: (left ? left.id : "L") + ":" + (right ? right.id : "R"),
        from: left ? left.value : "-inf",
        to: right ? right.value : "inf",
        fromText: left ? left.text || fmtSign(left.value) : "",
        toText: right ? right.text || fmtSign(right.value) : "",
        width: ((cuts[i + 1].x - cuts[i].x) / 640) * 100,
      });
    }
    return zones;
  }

  function absorbSeeds(zones) {
    state.probes = state.probes || {};
    zones.forEach(function (zone, index) {
      if (!state.probes[zone.id]) {
        var seed = state.rows[index] || {};
        state.probes[zone.id] = {
          x: seed.x || "",
          expr: seed.expr || "",
          value: seed.value || "",
          sign: seed.sign || "",
        };
      }
      zone.probe = state.probes[zone.id];
    });
    if (!state.signSeed) return;
    Object.keys(state.signSeed).forEach(function (key) {
      var zone = zones[Number(key)];
      var src = state.signSeed[key];
      if (!zone || !src) return;
      if (src.force === "sample" || !zone.probe.x) zone.probe.x = src.x || zone.probe.x;
      if (src.force === "expr" || src.expr) zone.probe.expr = src.expr || zone.probe.expr;
      if (src.force === "result" || src.value) zone.probe.value = src.value || zone.probe.value;
      if (src.force === "mark" || src.sign) zone.probe.sign = src.sign || zone.probe.sign;
    });
    state.signSeed = null;
  }

  function rememberZone(index, zone) {
    var probe = zone.probe || { x: "", expr: "", value: "", sign: "" };
    state.rows[index] = {
      x: probe.x,
      expr: probe.expr,
      value: probe.value,
      sign: probe.sign,
      from: zone.from,
      to: zone.to,
      fromText: zone.fromText,
      toText: zone.toText,
    };
  }

  function syncRows(zones) {
    state.rows = zones.map(function (zone) {
      var probe = zone.probe || { x: "", expr: "", value: "", sign: "" };
      return {
        x: probe.x,
        expr: probe.expr,
        value: probe.value,
        sign: probe.sign,
        from: zone.from,
        to: zone.to,
        fromText: zone.fromText,
        toText: zone.toText,
      };
    });
  }

  function zoneEditor(zone, index) {
    var probe = zone.probe;
    var box = document.createElement("div");
    box.className = "qineq-zone";
    box.style.width = zone.width + "%";
    box.appendChild(miniField("מספר", probe.x, "x", zone, index, function (v) { probe.x = v; rememberZone(index, zone); }));
    box.appendChild(mathMini("הצבה", probe.expr, zone, index, function (v) { probe.expr = v; rememberZone(index, zone); }));
    box.appendChild(miniField("תוצאה", probe.value, "value", zone, index, function (v) { probe.value = v; rememberZone(index, zone); }));
    var signs = document.createElement("div");
    signs.className = "qineq-signs";
    ["+", "−"].forEach(function (mark) {
      var chosen = probe.sign === mark;
      var b = button(mark, function () {
        probe.sign = mark;
        clearFrom(probe, "sign");
        rememberZone(index, zone);
        commitCell(index, zone, "sign");
      }, chosen);
      b.setAttribute("data-zone", zone.id);
      b.setAttribute("data-field", "sign");
      b.setAttribute("data-mark", mark);
      if (probe.ok && probe.ok.sign && chosen) b.classList.add("is-ok");
      if (state.bad && state.bad.zone === zone.id && state.bad.field === "sign" && chosen) b.classList.add("is-bad");
      signs.appendChild(b);
    });
    box.appendChild(signs);
    return box;
  }

  function clearFrom(probe, field) {
    probe.ok = probe.ok || {};
    var i = FIELDS.indexOf(field);
    if (i < 0) i = 0;
    for (; i < FIELDS.length; i++) probe.ok[FIELDS[i]] = false;
  }

  function earlierOpen(probe, field) {
    var need = field === "sign" ? ["x", "value"] : field === "x" ? [] : ["x"];
    var i;
    for (i = 0; i < need.length; i++) {
      if (!probe.ok || !probe.ok[need[i]]) return need[i];
    }
    return "";
  }

  function nextOpen(index, field) {
    var zones = signZones();
    var at = FIELDS.indexOf(field);
    var i;
    var z;
    for (i = at + 1; i < FIELDS.length; i++) {
      if (FIELDS[i] === "expr" && field !== "x") continue;
      var here = state.probes[zones[index].id] || {};
      if (!here.ok || !here.ok[FIELDS[i]]) return { zone: zones[index].id, field: FIELDS[i] };
    }
    for (z = index + 1; z < zones.length; z++) {
      var hole = firstOpen(state.probes[zones[z].id] || {});
      if (hole) return { zone: zones[z].id, field: hole };
    }
    for (z = 0; z < index; z++) {
      var hole2 = firstOpen(state.probes[zones[z].id] || {});
      if (hole2) return { zone: zones[z].id, field: hole2 };
    }
    return null;
  }

  function firstOpen(probe) {
    var order = ["x", "value", "sign"];
    var i;
    for (i = 0; i < order.length; i++) {
      if (!probe.ok || !probe.ok[order[i]]) return order[i];
    }
    return "";
  }

  function commitCell(index, zone, field) {
    var probe = zone.probe || {};
    var prior = earlierOpen(probe, field);
    if (prior) {
      state.bad = { zone: zone.id, field: prior };
      state.note = prior === "x" ? "קודם מאשרים את המספר באנטר." : prior === "expr" ? "קודם מאשרים את ההצבה באנטר." : "קודם מאשרים את התוצאה באנטר.";
      state.focus = { zone: zone.id, field: prior };
      render();
      return;
    }
    if (field === "expr" && !String(probe.expr || "").trim()) {
      state.bad = null;
      state.note = "";
      state.focus = { zone: zone.id, field: "value" };
      render();
      return;
    }
    if (field !== "sign" && !String(probe[field] || "").trim()) {
      state.bad = { zone: zone.id, field: field };
      state.note = field === "x" ? "כותבים מספר מתוך התחום, ואז לוחצים אנטר." : field === "expr" ? "מציבים את המספר בביטוי, ואז לוחצים אנטר." : "מחשבים את ערך הביטוי, ואז לוחצים אנטר.";
      state.focus = { zone: zone.id, field: field };
      render();
      return;
    }
    if (!commitHandler || state.checking) return;
    state.checking = true;
    commitHandler({
      index: index,
      field: field,
      zoneId: zone.id,
      x: probe.x,
      expr: probe.expr,
      value: probe.value,
      sign: probe.sign,
      from: zone.from,
      to: zone.to,
      fromText: zone.fromText,
      toText: zone.toText,
    }, function (remote) {
      state.checking = false;
      remote = remote || {};
      var blamed = remote.field || field;
      probe.ok = probe.ok || {};
      if (remote.ok) {
        probe.ok[field] = true;
        state.bad = null;
        state.note = remote.message || "";
        state.focus = nextOpen(index, field);
        if (!state.focus && state.note) state.note += " עכשיו רושמים את התחומים שפותרים את אי־השוויון.";
      } else {
        probe.ok[field] = false;
        if (blamed !== field) probe.ok[blamed] = false;
        state.bad = { zone: zone.id, field: blamed };
        state.note = remote.message || "עוד לא.";
        state.focus = { zone: zone.id, field: blamed };
      }
      rememberZone(index, zone);
      render();
    });
  }

  function focusPending() {
    var want = state.focus;
    state.focus = null;
    if (!want || !host) return;
    var nodes = host.querySelectorAll("[data-field]");
    var fallback = null;
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute("data-zone") !== want.zone) continue;
      if (nodes[i].getAttribute("data-field") !== want.field) continue;
      if (want.field === "sign" && want.mark && nodes[i].getAttribute("data-mark") !== want.mark) {
        if (!fallback) fallback = nodes[i];
        continue;
      }
      focusNode(nodes[i]);
      return;
    }
    if (fallback) focusNode(fallback);
  }

  function focusNode(el) {
    var math = el.closest ? el.closest(".qineq-math") : null;
    if (math) math.classList.add("is-editing");
    el.focus();
    if (el.select) el.select();
  }

  function markField(el, zone, field) {
    el.setAttribute("data-zone", zone.id);
    el.setAttribute("data-field", field);
    var probe = zone.probe || {};
    if (probe.ok && probe.ok[field]) el.classList.add("is-ok");
    if (state.bad && state.bad.zone === zone.id && state.bad.field === field) el.classList.add("is-bad");
  }

  function mathMini(placeholder, value, zone, index, onInput) {
    var editing = state.focus && state.focus.zone === zone.id && state.focus.field === "expr";
    var wrap = document.createElement("div");
    wrap.className = "qineq-math" + (value && !editing ? "" : " is-editing");
    var probe = zone.probe || {};
    if (probe.ok && probe.ok.expr) wrap.classList.add("is-ok");
    if (state.bad && state.bad.zone === zone.id && state.bad.field === "expr") wrap.classList.add("is-bad");
    var view = document.createElement("div");
    view.className = "qineq-math-view";
    view.dir = "ltr";
    view.setAttribute("role", "textbox");
    view.setAttribute("aria-label", placeholder);
    var input = document.createElement("input");
    input.className = "qineq-mini";
    input.dir = "ltr";
    input.placeholder = placeholder;
    input.setAttribute("aria-label", placeholder);
    input.value = value || "";
    markField(input, zone, "expr");
    function paint() {
      var text = input.value;
      if (text && global.DoctematicaMath && global.DoctematicaMath.toHTML) {
        view.innerHTML = global.DoctematicaMath.toHTML(text);
      } else {
        view.textContent = text;
      }
    }
    input.addEventListener("input", function () {
      clearFrom(probe, "expr");
      onInput(input.value);
      paint();
    });
    input.addEventListener("blur", function () {
      if (input.value) wrap.classList.remove("is-editing");
      paint();
    });
    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      event.stopPropagation();
      commitCell(index, zone, "expr");
    });
    view.addEventListener("click", function () {
      wrap.classList.add("is-editing");
      input.focus();
    });
    paint();
    wrap.appendChild(view);
    wrap.appendChild(input);
    return wrap;
  }

  function miniField(placeholder, value, field, zone, index, onInput) {
    var input = document.createElement("input");
    input.className = "qineq-mini";
    input.dir = "ltr";
    input.placeholder = placeholder;
    input.setAttribute("aria-label", placeholder);
    input.value = value || "";
    markField(input, zone, field);
    input.addEventListener("input", function () {
      clearFrom(zone.probe, field);
      onInput(input.value);
    });
    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      event.stopPropagation();
      commitCell(index, zone, field);
    });
    return input;
  }

  function placeBoundary(raw) {
    var parsed = parseBound(raw);
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
      state.selected = existing;
      state.note = "המספר כבר על הציר. גררו אותו למקום המתאים.";
      render();
      return;
    }
    state.marks.push({
      id: state.markSeq++,
      value: parsed.value,
      pos: freeBoundPos(),
      text: parsed.text,
      num: parsed.num,
      den: parsed.den,
      sign: parsed.sign,
    });
    state.selected = state.marks.length - 1;
    state.note = "";
    render();
  }

  function removeBoundary() {
    if (state.selected == null || !state.marks[state.selected]) {
      if (state.stroke && state.stroke.length) {
        state.stroke = [];
        state.note = "";
        render();
        return;
      }
      state.note = "בחרו מספר על הציר, ואז מחקו.";
      render();
      return;
    }
    state.marks.splice(state.selected, 1);
    state.selected = null;
    state.note = "";
    render();
  }

  function freeBoundPos() {
    var spots = [0.5, 0.32, 0.68, 0.18, 0.82];
    var i;
    for (i = 0; i < spots.length; i++) {
      var taken = state.marks.some(function (mark) {
        return Math.abs(mark.pos - spots[i]) < 0.06;
      });
      if (!taken) return spots[i];
    }
    return Math.min(0.9, 0.15 + state.marks.length * 0.12);
  }

  function parseBound(text) {
    var t = String(text || "").replace(/[−–—]/g, "-").replace(/\u2044/g, "/").replace(/\s+/g, "");
    if (!t) return null;
    if (/^-?\d+(?:\.\d+)?$/.test(t)) return { value: Number(t), text: t.replace("-", "−") };
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
    if (!den) return null;
    var shown = (sign < 0 ? "−" : "") + num + "/" + den;
    return { value: (sign * num) / den, text: shown, num: num, den: den, sign: sign };
  }

  function fmtSign(n) {
    var v = Number(n);
    if (Math.abs(v - Math.round(v)) < 1e-8) return String(Math.round(v)).replace("-", "−");
    return String(Math.round(v * 1000) / 1000).replace("-", "−");
  }

  function xOfSign(pos) {
    return 36 + pos * 568;
  }

  function clampPos(pos) {
    return Math.min(0.92, Math.max(0.08, pos));
  }

  function drawSignAxis(opts) {
    opts = opts || {};
    var parabola = !!opts.parabola;
    var yAxis = parabola ? 96 : 28;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 640 " + (parabola ? 220 : 118));
    svg.setAttribute("class", "nline-svg qineq-axis");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", parabola ? "ציר מספרים לשרטוט פרבולה" : "ציר מספרים לבדיקת סימנים");
    svg.appendChild(svgEl("line", { x1: 18, y1: yAxis, x2: 622, y2: yAxis, class: "nline-axis" }));
    svg.appendChild(svgEl("polygon", { points: "622," + yAxis + " 610," + (yAxis - 5) + " 610," + (yAxis + 5), class: "nline-axis" }));
    svg.appendChild(svgEl("polygon", { points: "18," + yAxis + " 30," + (yAxis - 5) + " 30," + (yAxis + 5), class: "nline-axis" }));
    if (parabola && state.stroke && state.stroke.length) {
      var ink = svgEl("path", { d: strokePath(state.stroke), class: "qineq-curve" });
      ink.setAttribute("fill", "none");
      ink.setAttribute("pointer-events", "none");
      svg.appendChild(ink);
    }
    if (parabola && state.pen) {
      svg.classList.add("is-pen");
      var pad = svgEl("rect", { x: 0, y: 0, width: 640, height: 220, class: "qineq-pad" });
      pad.addEventListener("pointerdown", function (event) { beginPen(event, svg); });
      svg.appendChild(pad);
    }
    var shown = parabola ? state.marks : boundMarks();
    shown.forEach(function (mark, idx) {
      var x = xOfSign(mark.pos);
      var sep = null;
      if (!parabola) {
        sep = svgEl("line", { x1: x, y1: 0, x2: x, y2: yAxis, class: "qineq-sep" });
        svg.appendChild(sep);
      }
      var tick = svgEl("line", { x1: x, y1: yAxis - 8, x2: x, y2: yAxis + 8, class: "nline-tick" });
      svg.appendChild(tick);
      var label = null;
      var frac = null;
      var labelY = parabola ? yAxis + 78 : yAxis + 28;
      if (mark.den) {
        frac = signFrac(x, parabola ? yAxis + 36 : yAxis + 16, mark);
        svg.appendChild(frac.g);
      } else {
        label = svgEl("text", { x: x, y: labelY, class: "nline-label", "text-anchor": "middle" });
        label.textContent = mark.text || fmtSign(mark.value);
        svg.appendChild(label);
      }
      var hit = svgEl("circle", {
        cx: x,
        cy: yAxis,
        r: 16,
        class: "nline-hit nline-drag" + (state.selected === idx ? " is-on" : ""),
      });
      mark.node = { sep: sep, tick: tick, label: label, frac: frac, hit: hit };
      if (!mark.locked) {
        hit.addEventListener("pointerdown", function (event) {
          beginBoundDrag(event, idx, svg);
        });
      }
      svg.appendChild(hit);
    });
    svg.addEventListener("pointermove", onBoundMove);
    svg.addEventListener("pointerup", onBoundUp);
    svg.addEventListener("pointercancel", onBoundUp);
    state.signSvg = svg;
    return svg;
  }

  function strokePath(pts) {
    var d = "";
    (pts || []).forEach(function (p, i) {
      d += (i ? " L " : "M ") + Number(p.x).toFixed(1) + " " + Number(p.y).toFixed(1);
    });
    return d;
  }

  function thinStroke(pts) {
    if (!pts || pts.length <= 80) return pts || [];
    var out = [];
    var step = (pts.length - 1) / 79;
    var i;
    for (i = 0; i < 80; i++) out.push(pts[Math.round(i * step)]);
    return out;
  }

  function axisPoint(event, svg) {
    var pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    var ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 96 };
    var p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function beginPen(event, svg) {
    event.preventDefault();
    event.stopPropagation();
    state.drawing = true;
    state.live = [axisPoint(event, svg)];
    state.penPath = svgEl("path", { d: strokePath(state.live), class: "qineq-curve" });
    state.penPath.setAttribute("fill", "none");
    state.penPath.setAttribute("pointer-events", "none");
    svg.appendChild(state.penPath);
    if (svg.setPointerCapture) {
      try { svg.setPointerCapture(event.pointerId); } catch (err) {}
    }
  }

  function paintPen() {
    if (!state.penPath || !state.live) return;
    state.penPath.setAttribute("d", strokePath(state.live));
  }

  function signFrac(x, yTop, mark) {
    var g = svgEl("g", { class: "nline-frac", "pointer-events": "none" });
    var numText = (mark.sign < 0 ? "−" : "") + String(mark.num);
    var num = svgEl("text", { x: x, y: yTop + 12, class: "nline-label nline-frac-num", "text-anchor": "middle" });
    num.textContent = numText;
    var den = svgEl("text", { x: x, y: yTop + 32, class: "nline-label nline-frac-den", "text-anchor": "middle" });
    den.textContent = String(mark.den);
    var w = Math.max(numText.length, String(mark.den).length) * 8 + 6;
    var bar = svgEl("line", {
      x1: x - w / 2,
      y1: yTop + 16,
      x2: x + w / 2,
      y2: yTop + 16,
      class: "nline-frac-bar",
    });
    g.appendChild(num);
    g.appendChild(bar);
    g.appendChild(den);
    return { g: g, num: num, den: den, bar: bar, w: w };
  }

  function svgEl(name, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  var boundDrag = null;

  function beginBoundDrag(event, index, svg) {
    event.preventDefault();
    event.stopPropagation();
    var mark = state.marks[index];
    if (!mark) return;
    state.selected = index;
    boundDrag = { index: index, startPos: mark.pos, x: event.clientX, svg: svg };
    if (svg.setPointerCapture) {
      try { svg.setPointerCapture(event.pointerId); } catch (err) {}
    }
    if (mark.node && mark.node.hit) mark.node.hit.classList.add("is-on");
  }

  function onBoundMove(event) {
    if (state.drawing && state.live) {
      var svg = state.signSvg;
      if (!svg) return;
      var next = axisPoint(event, svg);
      var prev = state.live[state.live.length - 1];
      if (Math.abs(next.x - prev.x) + Math.abs(next.y - prev.y) > 2) state.live.push(next);
      paintPen();
      return;
    }
    if (!boundDrag) return;
    var mark = state.marks[boundDrag.index];
    var svg = boundDrag.svg;
    if (!mark || !svg) return;
    var rect = svg.getBoundingClientRect();
    var dx = rect.width ? (event.clientX - boundDrag.x) / rect.width : 0;
    mark.pos = clampPos(boundDrag.startPos + dx);
    paintBound(mark);
  }

  function paintBound(mark) {
    if (!mark.node) return;
    var x = xOfSign(mark.pos);
    if (mark.node.sep) {
      mark.node.sep.setAttribute("x1", x);
      mark.node.sep.setAttribute("x2", x);
    }
    mark.node.tick.setAttribute("x1", x);
    mark.node.tick.setAttribute("x2", x);
    mark.node.hit.setAttribute("cx", x);
    if (mark.node.label) mark.node.label.setAttribute("x", x);
    if (mark.node.frac) {
      var frac = mark.node.frac;
      var half = frac.w / 2;
      frac.num.setAttribute("x", x);
      frac.den.setAttribute("x", x);
      frac.bar.setAttribute("x1", x - half);
      frac.bar.setAttribute("x2", x + half);
    }
  }

  function onBoundUp() {
    if (state.drawing) {
      state.stroke = thinStroke(state.live || []);
      state.drawing = false;
      state.live = null;
      if (state.stroke.length < 8) {
        state.stroke = [];
        state.note = "ציירו קו ארוך יותר, קשת אחת של פרבולה.";
        render();
      }
      return;
    }
    if (!boundDrag) return;
    boundDrag = null;
    render();
  }

  function field(label, value, onInput) {
    var wrap = document.createElement("label");
    wrap.className = "qineq-field";
    wrap.appendChild(document.createTextNode(label));
    var input = document.createElement("input");
    input.dir = "ltr";
    input.value = value || "";
    input.addEventListener("input", function () { onInput(input.value); });
    wrap.appendChild(input);
    return wrap;
  }

  function renderParabola() {
    var note = document.createElement("p");
    note.className = "qineq-note";
    note.textContent = "אפשר לסמן מספרים על הציר. «פרבולה» מפעיל ציור: גררו וציירו את הקו בעצמכם.";
    host.appendChild(note);
    var tools = document.createElement("div");
    tools.className = "nline-tools";
    var input = document.createElement("input");
    input.type = "text";
    input.className = "nline-num qineq-num";
    input.dir = "rtl";
    input.placeholder = "מספר או שבר, ואז אנטר";
    input.setAttribute("aria-label", "הקלידו מספר או שבר ולחצו אנטר כדי לשים אותו על הציר");
    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      event.stopPropagation();
      placeBoundary(input.value);
    });
    tools.appendChild(input);
    tools.appendChild(button("הוסף מספר", function () { placeBoundary(input.value); }));
    tools.appendChild(button("מחק", removeBoundary));
    tools.appendChild(button("פרבולה", function () {
      state.pen = !state.pen;
      state.note = state.pen ? "גררו על הציר וציירו את הפרבולה." : "";
      render();
    }, state.pen));
    host.appendChild(tools);
    host.appendChild(drawSignAxis({ parabola: true }));
    var foot = document.createElement("p");
    foot.className = "nline-note";
    foot.textContent = state.note || "הפרבולה שציירתם נבדקת לפי הכיוון. אם סימנתם נקודות אפס, היא צריכה לעבור בהן. מעל הציר הביטוי חיובי, ומתחתיו שלילי.";
    host.appendChild(foot);
    if (state.refocusNum) {
      state.refocusNum = false;
      input.focus();
    }
  }

  global.DoctematicaQuadIneq = {
    mount: mount,
    reset: reset,
    open: open,
    close: close,
    isOpen: isOpen,
    setModel: setModel,
    applyAction: applyAction,
    snapshot: snapshot,
    setCommit: function (fn) { commitHandler = fn; },
  };
})(window);
