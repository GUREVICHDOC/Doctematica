(function (global) {
  function nicePad(min, max, pad) {
    if (min === max) {
      min -= 1;
      max += 1;
    }
    var span = max - min;
    return { min: min - span * pad, max: max + span * pad };
  }

  function readableAngleDeg(dx, dy) {
    var a = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (a > 90) a -= 180;
    if (a <= -90) a += 180;
    return a;
  }

  /** כיוון נורמל בפיקסלים — לצד y>G(x) (מעל הישר בגרף) */
  function screenNormalAboveLine(g, x, y, sx, sy) {
    var m = isFinite(g.m) ? g.m : 0;
    var len = Math.sqrt(m * m + 1) || 1;
    var sx0 = sx(x);
    var sy0 = sy(y);
    var sx1 = sx(x - m / len);
    var sy1 = sy(y + 1 / len);
    var nx = sx1 - sx0;
    var ny = sy1 - sy0;
    var nlen = Math.sqrt(nx * nx + ny * ny) || 1;
    return { x: nx / nlen, y: ny / nlen };
  }

  function pointLabelObstacles(points, sx, sy, Geo) {
    var out = [];
    points.forEach(function (p) {
      if (String(p.label || "").toUpperCase() === "O") return;
      var cx = sx(p.x);
      var cy = sy(p.y);
      out.push({ x: cx, y: cy, r: 20 });
      var tx = cx + (p.x < 0 ? -8 : 8);
      var ty = cy - 10;
      var label = Geo && Geo.coordLabel ? Geo.coordLabel(p) : String(p.label || "");
      out.push({ x: tx, y: ty, r: Math.max(28, label.length * 4.2) });
    });
    return out;
  }

  function scoreEqPlacement(px, py, eqLen, t, obstacles) {
    var halfW = Math.max(36, eqLen * 3.6);
    var halfH = 12;
    var penalty = Math.abs(t - 0.5) * 14;
    var i;
    for (i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      var dx = px - o.x;
      var dy = py - o.y;
      var need = o.r + Math.max(halfW, halfH);
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < need) penalty += (need - dist) * 3.2;
    }
    return penalty;
  }

  function eqLabelVisualLen(eq) {
    var s = String(eq || "");
    var extra = 0;
    if (/\([^)]*\d+\s*\/\s*\d+[^)]*\)/.test(s) || /\d+\/\d+/.test(s)) extra = 10;
    return s.length + extra;
  }

  function appendPointLabel(svg, tx, ty, labelText, labelHtml, cls, anchor) {
    var MathR = global.DoctematicaMath;
    if (labelHtml && MathR && typeof MathR.toHTML === "function") {
      var foW = Math.max(56, eqLabelVisualLen(labelText) * 6.8);
      var foH = 28;
      var fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
      var xOff = anchor === "end" ? -foW : 0;
      fo.setAttribute("x", String(tx + xOff));
      fo.setAttribute("y", String(ty - foH + 6));
      fo.setAttribute("width", String(foW));
      fo.setAttribute("height", String(foH));
      var div = document.createElement("div");
      div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      div.className = "coord-point-label-html " + cls;
      div.innerHTML = labelHtml;
      fo.appendChild(div);
      svg.appendChild(fo);
      return fo;
    }
    var el = document.createElementNS("http://www.w3.org/2000/svg", "text");
    el.setAttribute("x", tx);
    el.setAttribute("y", ty);
    el.setAttribute("class", cls);
    if (anchor === "end") el.setAttribute("text-anchor", "end");
    el.textContent = labelText;
    svg.appendChild(el);
    return el;
  }

  function appendLineEqLabel(svg, eq, g, ends, sx, sy, obstacles) {
    if (!eq || g.showEq === false) return;
    var visLen = eqLabelVisualLen(eq);
    var p0x = sx(ends[0].x);
    var p0y = sy(ends[0].y);
    var p1x = sx(ends[1].x);
    var p1y = sy(ends[1].y);
    var dx = p1x - p0x;
    var dy = p1y - p0y;
    var segLen = Math.sqrt(dx * dx + dy * dy);
    if (segLen < 24) return;
    var angleDeg = readableAngleDeg(dx, dy);
    var ts = [0.5, 0.38, 0.62, 0.26, 0.74, 0.18, 0.82, 0.1, 0.9];
    var mx = (ends[0].x + ends[1].x) / 2;
    var my = (ends[0].y + ends[1].y) / 2;
    var nrm = screenNormalAboveLine(g, mx, my, sx, sy);
    var perp = 15;
    var best = null;
    var bestScore = Infinity;
    var i;
    for (i = 0; i < ts.length; i++) {
      var t = ts[i];
      var px = p0x + dx * t + nrm.x * perp;
      var py = p0y + dy * t + nrm.y * perp;
      var sc = scoreEqPlacement(px, py, visLen, t, obstacles);
      if (sc < bestScore) {
        bestScore = sc;
        best = { px: px, py: py, t: t };
      }
    }
    if (!best) return;
    if (bestScore > 80) {
      perp = 22;
      for (i = 0; i < ts.length; i++) {
        var t2 = ts[i];
        var px2 = p0x + dx * t2 + nrm.x * perp;
        var py2 = p0y + dy * t2 + nrm.y * perp;
        var sc2 = scoreEqPlacement(px2, py2, visLen, t2, obstacles);
        if (sc2 < bestScore) {
          bestScore = sc2;
          best = { px: px2, py: py2, t: t2 };
        }
      }
    }
    var wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
    wrap.setAttribute("class", "coord-line-eq-wrap");
    wrap.setAttribute("transform", "translate(" + best.px + " " + best.py + ") rotate(" + angleDeg + ")");
    var MathR = global.DoctematicaMath;
    if (MathR && typeof MathR.toHTML === "function") {
      var foW = Math.max(108, visLen * 7.8);
      var foH = 32;
      var fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
      fo.setAttribute("x", String(-foW / 2));
      fo.setAttribute("y", String(-foH / 2));
      fo.setAttribute("width", String(foW));
      fo.setAttribute("height", String(foH));
      var div = document.createElement("div");
      div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      div.className = "coord-line-eq-html";
      div.innerHTML = MathR.toHTML(eq);
      fo.appendChild(div);
      wrap.appendChild(fo);
    } else {
      var lab = document.createElementNS("http://www.w3.org/2000/svg", "text");
      lab.setAttribute("class", "coord-line-eq");
      lab.setAttribute("text-anchor", "middle");
      lab.setAttribute("dominant-baseline", "middle");
      lab.textContent = eq;
      wrap.appendChild(lab);
    }
    svg.appendChild(wrap);
  }

  function CoordBoard(host) {
    this.host = host;
    this._view = null;
    this._scene = null;
    this._drag = null;
    this._onDrawChange = null;
    this._boundMove = this._onPointerMove.bind(this);
    this._boundUp = this._onPointerUp.bind(this);
    this._boundKey = this._onKeyDown.bind(this);
    this._keyBound = false;
  }

  CoordBoard.prototype.clear = function () {
    if (this.host) {
      this.host.innerHTML = "";
      this.host.classList.add("hidden");
    }
    this._view = null;
    this._scene = null;
    this._drag = null;
    this._onDrawChange = null;
    window.removeEventListener("pointermove", this._boundMove);
    window.removeEventListener("pointerup", this._boundUp);
    window.removeEventListener("keydown", this._boundKey);
    this._keyBound = false;
  };

  CoordBoard.prototype._computeView = function (points, extra) {
    var xs = [0];
    var ys = [0];
    (points || []).forEach(function (p) {
      xs.push(p.x);
      ys.push(p.y);
    });
    (extra || []).forEach(function (p) {
      if (!p || !isFinite(p.x) || !isFinite(p.y)) return;
      xs.push(p.x);
      ys.push(p.y);
    });
    var xRange = nicePad(Math.min.apply(null, xs), Math.max.apply(null, xs), 0.18);
    var yRange = nicePad(Math.min.apply(null, ys), Math.max.apply(null, ys), 0.22);
    if (Math.abs(yRange.max - yRange.min) < 4) {
      yRange.min = Math.min(yRange.min, -3.5);
      yRange.max = Math.max(yRange.max, 3.5);
    }
    if (Math.abs(xRange.max - xRange.min) < 4) {
      xRange.min = Math.min(xRange.min, -2);
      xRange.max = Math.max(xRange.max, 2);
    }
    var width = 420;
    var height = 620;
    var margin = { t: 36, r: 34, b: 44, l: 34 };
    var plotW = width - margin.l - margin.r;
    var plotH = height - margin.t - margin.b;
    // אותו קנה־מידה ל־x ו־y — אחרת גובה מאונך לא נראה 90° בשרטוט
    var xSpan = xRange.max - xRange.min;
    var ySpan = yRange.max - yRange.min;
    var unit = Math.min(plotW / xSpan, plotH / ySpan);
    var xMid = (xRange.min + xRange.max) / 2;
    var yMid = (yRange.min + yRange.max) / 2;
    xRange = { min: xMid - plotW / unit / 2, max: xMid + plotW / unit / 2 };
    yRange = { min: yMid - plotH / unit / 2, max: yMid + plotH / unit / 2 };
    return {
      xRange: xRange,
      yRange: yRange,
      width: width,
      height: height,
      margin: margin,
      plotW: plotW,
      plotH: plotH,
      unit: unit,
      sx: function (x) {
        return margin.l + ((x - xRange.min) / (xRange.max - xRange.min)) * plotW;
      },
      sy: function (y) {
        return margin.t + ((yRange.max - y) / (yRange.max - yRange.min)) * plotH;
      },
      mathFromScreen: function (px, py) {
        var x = xRange.min + ((px - margin.l) / plotW) * (xRange.max - xRange.min);
        var y = yRange.max - ((py - margin.t) / plotH) * (yRange.max - yRange.min);
        return { x: x, y: y };
      },
    };
  };

  CoordBoard.prototype._emitDrawChange = function () {
    if (this._onDrawChange && this._scene && this._scene.drawState) {
      this._onDrawChange(this._scene.drawState);
    }
  };

  CoordBoard.prototype._showHeight = function (h) {
    if (!h) return false;
    return h.visible || h.snapped;
  };

  CoordBoard.prototype._triangleVerts = function () {
    var scene = this._scene;
    if (!scene || !scene.drawConfig) return [];
    var seen = {};
    var out = [];
    function add(v) {
      var u = String(v || "").toUpperCase();
      if (!u || seen[u]) return;
      seen[u] = true;
      out.push(u);
    }
    (scene.drawConfig.triangles || []).forEach(function (tri) {
      (tri || []).forEach(add);
    });
    (scene.drawConfig.triangle || []).forEach(add);
    if (!out.length) {
      (scene.drawConfig.heights || []).forEach(function (h) {
        add(h.from);
        (h.base || []).forEach(add);
      });
    }
    return out;
  };

  CoordBoard.prototype._startPickHeight = function () {
    var scene = this._scene;
    if (!scene || !scene.drawState) return;
    scene.drawState.pickMode = "height-vertex";
    scene.drawState.note = "בחרו קודקוד שממנו להוריד גובה.";
    this._emitDrawChange();
    this.render(scene);
  };

  CoordBoard.prototype._cancelPick = function () {
    var scene = this._scene;
    if (!scene || !scene.drawState) return;
    scene.drawState.pickMode = null;
    if (!scene.drawState.heights || !scene.drawState.heights.length) {
      scene.drawState.note = null;
    }
    this._emitDrawChange();
    this.render(scene);
  };

  CoordBoard.prototype._addedHeights = function () {
    var scene = this._scene;
    if (!scene || !scene.drawState) return [];
    return (scene.drawState.heights || []).filter(function (h) {
      return h && (h.userAdded || h.visible);
    });
  };

  CoordBoard.prototype._removeLastHeight = function () {
    var scene = this._scene;
    if (!scene || !scene.drawState) return false;
    var list = scene.drawState.heights || [];
    if (!list.length) return false;
    list.pop();
    scene.drawState.heights = list;
    scene.drawState.note = list.length
      ? "נמחק הגובה האחרון שנוסף."
      : null;
    this._emitDrawChange();
    this.render(scene);
    return true;
  };

  CoordBoard.prototype._isTypingTarget = function (el) {
    if (!el) return false;
    var tag = String(el.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (el.isContentEditable) return true;
    if (el.closest && el.closest("#math-field, .math-line, .math-keys")) {
      var field = document.getElementById("math-field");
      var text = field ? String(field.textContent || "").replace(/\s+/g, "") : "";
      return text.length > 0;
    }
    return false;
  };

  CoordBoard.prototype._onKeyDown = function (event) {
    if (event.key !== "Delete" && event.key !== "Del" && event.key !== "Backspace") return;
    if (this._isTypingTarget(event.target) || this._isTypingTarget(document.activeElement)) {
      return;
    }
    if (!this._scene || !this._scene.drawConfig || !this._scene.drawConfig.enabled) return;
    if (!this._addedHeights().length) return;
    event.preventDefault();
    this._removeLastHeight();
  };

  CoordBoard.prototype._pickHeightVertex = function (vertex) {
    var scene = this._scene;
    if (!scene || !scene.drawState || !scene.drawConfig) return;
    var GD = global.DoctematicaGeoDraw;
    if (!GD) return;
    var item = GD.buildHeightFromVertex(scene.drawConfig, scene.pointMap || {}, vertex);
    if (!item) return;
    scene.drawState.heights = (scene.drawState.heights || []).filter(function (h) {
      return h.id !== item.id && String(h.from).toUpperCase() !== String(item.from).toUpperCase();
    });
    scene.drawState.heights.push(item);
    scene.drawState.pickMode = null;
    scene.drawState.note = item.note || null;
    this._emitDrawChange();
    this.render(scene);
  };

  CoordBoard.prototype._renderToolbar = function () {
    var scene = this._scene;
    if (!scene || !scene.drawConfig || !scene.drawConfig.enabled) return null;
    var bar = document.createElement("div");
    bar.className = "coord-draw-bar";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "כלי ציור על הגרף");

    var hint = document.createElement("span");
    hint.className = "coord-draw-hint";
    var pick = scene.drawState && scene.drawState.pickMode === "height-vertex";
    var note = scene.drawState && scene.drawState.note;
    if (pick) {
      hint.textContent = "בחרו קודקוד: לחצו על נקודה בשרטוט או על הכפתור.";
    } else if (note) {
      hint.textContent = note;
      hint.classList.add("is-note");
    } else {
      hint.textContent =
        scene.drawConfig.hintText || "אפשר להוסיף גובה ולגרור את רגלו למקום הנכון.";
      if (this._addedHeights().length) {
        hint.textContent += " Delete מוחק את הגובה שנוסף.";
      }
    }
    bar.appendChild(hint);

    var self = this;
    if (pick) {
      this._triangleVerts().forEach(function (v) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "coord-draw-btn is-pick";
        btn.textContent = v;
        btn.addEventListener("click", function () {
          self._pickHeightVertex(v);
        });
        bar.appendChild(btn);
      });
      var cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "coord-draw-btn is-ghost";
      cancel.textContent = "ביטול";
      cancel.addEventListener("click", function () {
        self._cancelPick();
      });
      bar.appendChild(cancel);
    } else if ((scene.drawConfig.heights || []).length || (scene.drawConfig.triangle || []).length) {
      var btnH = document.createElement("button");
      btnH.type = "button";
      btnH.className = "coord-draw-btn";
      btnH.textContent = "+ גובה";
      btnH.addEventListener("click", function () {
        self._startPickHeight();
      });
      bar.appendChild(btnH);
      if (this._addedHeights().length) {
        var btnDel = document.createElement("button");
        btnDel.type = "button";
        btnDel.className = "coord-draw-btn is-ghost";
        btnDel.textContent = "מחק";
        btnDel.title = "מחיקת הגובה שנוסף (מקש Delete)";
        btnDel.addEventListener("click", function () {
          self._removeLastHeight();
        });
        bar.appendChild(btnDel);
      }
    }
    return bar;
  };

  CoordBoard.prototype._onPointerMove = function (event) {
    if (!this._drag || !this._view || !this._scene) return;
    var svg = this.host.querySelector(".coord-svg");
    if (!svg) return;
    var rect = svg.getBoundingClientRect();
    var px = ((event.clientX - rect.left) / rect.width) * this._view.width;
    var py = ((event.clientY - rect.top) / rect.height) * this._view.height;
    var m = this._view.mathFromScreen(px, py);
    var GD = global.DoctematicaGeoDraw;
    var h = this._drag.item;
    var map = this._scene.pointMap || {};
    var r = GD.resolveHeightSpec(
      { from: h.from, base: h.base, footLabel: h.footLabel, id: h.id },
      map
    );
    if (!r) return;
    var snap = GD.snapHeightFoot(m.x, m.y, r.fromPt, r.baseA, r.baseB);
    var wasSnapped = !!h.snapped;
    h.foot.x = snap.x;
    h.foot.y = snap.y;
    h.snapped = snap.snapped;
    h.visible = true;
    this._dragMoved = true;
    if (snap.snapped && !wasSnapped) {
      this._emitDrawChange();
    }
    this.render(this._scene);
  };

  CoordBoard.prototype._onPointerUp = function () {
    if (this._drag && this._dragMoved && this._drag.item) {
      var h = this._drag.item;
      if (h.snapped && h.footLabel) {
        this._scene.drawState.note =
          "הגובה במקום. עכשיו מצאו את שיעורי הנקודה " +
          h.footLabel +
          " (למשל " +
          h.footLabel +
          "(x;y) או " +
          h.footLabel +
          "x=…).";
      }
      this._emitDrawChange();
    } else if (this._drag && this._dragMoved) {
      this._emitDrawChange();
    }
    this._drag = null;
    this._dragMoved = false;
    window.removeEventListener("pointermove", this._boundMove);
    window.removeEventListener("pointerup", this._boundUp);
    if (this._scene) this.render(this._scene);
  };

  CoordBoard.prototype.render = function (scene) {
    if (!this.host) return;
    scene = scene || {};
    this._scene = scene;
    this._onDrawChange = scene.onDrawChange || null;

    var points = scene.points || [];
    var segments = scene.segments || [];
    var highlight = scene.highlight || null;
    var drawState = scene.drawState || { heights: [], auxPoints: [] };
    scene.drawState = drawState;

    this.host.classList.remove("hidden");
    this.host.innerHTML = "";

    if (!this._keyBound) {
      window.addEventListener("keydown", this._boundKey);
      this._keyBound = true;
    }

    var toolbar = this._renderToolbar();
    if (toolbar) this.host.appendChild(toolbar);

    var extra = [];
    (drawState.heights || []).forEach(function (h) {
      if (h && h.foot) extra.push(h.foot);
    });
    (scene.graphs || []).forEach(function (g) {
      if (!g) return;
      if (g.vertical != null && isFinite(g.vertical)) {
        extra.push({ x: g.vertical, y: 0 });
        return;
      }
      if (!isFinite(g.m) || !isFinite(g.b)) return;
      extra.push({ x: 0, y: g.b });
      if (Math.abs(g.m) > 1e-9) extra.push({ x: -g.b / g.m, y: 0 });
    });
    var view = this._computeView(points, extra);
    this._view = view;
    var sx = view.sx;
    var sy = view.sy;
    var width = view.width;
    var height = view.height;
    var margin = view.margin;

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("class", "coord-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "מערכת צירים");

    function line(x1, y1, x2, y2, cls) {
      var el = document.createElementNS("http://www.w3.org/2000/svg", "line");
      el.setAttribute("x1", x1);
      el.setAttribute("y1", y1);
      el.setAttribute("x2", x2);
      el.setAttribute("y2", y2);
      el.setAttribute("class", cls);
      svg.appendChild(el);
      return el;
    }

    function text(x, y, str, cls) {
      var el = document.createElementNS("http://www.w3.org/2000/svg", "text");
      el.setAttribute("x", x);
      el.setAttribute("y", y);
      el.setAttribute("class", cls);
      el.textContent = str;
      svg.appendChild(el);
      return el;
    }

    var ox = sx(0);
    var oy = sy(0);
    line(margin.l, oy, width - margin.r, oy, "coord-axis");
    line(ox, height - margin.b, ox, margin.t, "coord-axis");
    line(width - margin.r, oy, width - margin.r - 8, oy - 5, "coord-axis");
    line(width - margin.r, oy, width - margin.r - 8, oy + 5, "coord-axis");
    line(ox, margin.t, ox - 5, margin.t + 8, "coord-axis");
    line(ox, margin.t, ox + 5, margin.t + 8, "coord-axis");
    text(width - margin.r + 4, oy - 8, "x", "coord-axis-label");
    text(ox + 8, margin.t + 4, "y", "coord-axis-label");
    text(ox - 10, oy + 14, "O", "coord-origin");

    function clipLineToView(g) {
      if (!g) return null;
      var xr = view.xRange;
      var yr = view.yRange;
      if (g.vertical != null && isFinite(g.vertical)) {
        var vx = g.vertical;
        if (vx < xr.min - 1e-6 || vx > xr.max + 1e-6) return null;
        return [
          { x: vx, y: yr.min },
          { x: vx, y: yr.max },
        ];
      }
      if (!isFinite(g.m) || !isFinite(g.b)) return null;
      var hits = [];
      function add(x, y) {
        if (!isFinite(x) || !isFinite(y)) return;
        if (x < xr.min - 1e-6 || x > xr.max + 1e-6) return;
        if (y < yr.min - 1e-6 || y > yr.max + 1e-6) return;
        hits.push({ x: x, y: y });
      }
      add(xr.min, g.m * xr.min + g.b);
      add(xr.max, g.m * xr.max + g.b);
      if (Math.abs(g.m) > 1e-9) {
        add((yr.min - g.b) / g.m, yr.min);
        add((yr.max - g.b) / g.m, yr.max);
      }
      var uniq = [];
      hits.forEach(function (p) {
        if (
          uniq.some(function (q) {
            return Math.abs(q.x - p.x) < 1e-6 && Math.abs(q.y - p.y) < 1e-6;
          })
        ) {
          return;
        }
        uniq.push(p);
      });
      if (uniq.length < 2) return null;
      var best = [uniq[0], uniq[1]];
      var d = 0;
      var i;
      var j;
      for (i = 0; i < uniq.length; i++) {
        for (j = i + 1; j < uniq.length; j++) {
          var dd =
            (uniq[i].x - uniq[j].x) * (uniq[i].x - uniq[j].x) +
            (uniq[i].y - uniq[j].y) * (uniq[i].y - uniq[j].y);
          if (dd > d) {
            d = dd;
            best = [uniq[i], uniq[j]];
          }
        }
      }
      return best;
    }

    var Geo = global.DoctematicaGeometry;
    var pointObstacles = pointLabelObstacles(points, sx, sy, Geo);

    (scene.graphs || []).forEach(function (g) {
      var ends = clipLineToView(g);
      if (!ends) return;
      line(sx(ends[0].x), sy(ends[0].y), sx(ends[1].x), sy(ends[1].y), g.graphClass || "coord-line");
      if (g.showEq === false) {
        if (g.lineLabel) {
          var mx = (ends[0].x + ends[1].x) / 2;
          var my = (ends[0].y + ends[1].y) / 2;
          var p0x = sx(ends[0].x);
          var p0y = sy(ends[0].y);
          var p1x = sx(ends[1].x);
          var p1y = sy(ends[1].y);
          var dx = p1x - p0x;
          var dy = p1y - p0y;
          var nrm = screenNormalAboveLine(g, mx, my, sx, sy);
          var px = (p0x + p1x) / 2 + nrm.x * 18;
          var py = (p0y + p1y) / 2 + nrm.y * 18;
          var nameLab = document.createElementNS("http://www.w3.org/2000/svg", "text");
          nameLab.setAttribute("class", "coord-line-name");
          nameLab.setAttribute("x", String(px));
          nameLab.setAttribute("y", String(py));
          nameLab.setAttribute("text-anchor", "middle");
          nameLab.setAttribute("dominant-baseline", "middle");
          nameLab.textContent = String(g.lineLabel);
          svg.appendChild(nameLab);
        }
        return;
      }
      var eq = g.eqText || (Geo && Geo.givenLineEqText ? Geo.givenLineEqText(g._raw || g) : "");
      if (!eq && Geo && Geo.prettyLineEq) eq = Geo.prettyLineEq(g._raw || g);
      appendLineEqLabel(svg, eq, g, ends, sx, sy, pointObstacles);
    });

    function isHi(seg) {
      if (!highlight) return false;
      if (highlight.from && highlight.to) {
        return (
          (seg.from === highlight.from && seg.to === highlight.to) ||
          (seg.from === highlight.to && seg.to === highlight.from)
        );
      }
      return false;
    }

    function resolvePt(lab) {
      var key = String(lab || "").toUpperCase();
      if (key === "O") return { label: "O", x: 0, y: 0 };
      return points.filter(function (p) {
        return String(p.label || "").toUpperCase() === key;
      })[0] || null;
    }

    (scene.axisGuides || []).forEach(function (g) {
      var gp = resolvePt(g.point);
      if (!gp) return;
      if (g.axis === "y") line(sx(gp.x), sy(gp.y), sx(0), sy(gp.y), "coord-guide");
      else line(sx(gp.x), sy(gp.y), sx(gp.x), sy(0), "coord-guide");
    });

    (scene.distGuides || []).forEach(function (g) {
      if (!g.from || !g.to) return;
      line(sx(g.from.x), sy(g.from.y), sx(g.to.x), sy(g.to.y), "coord-guide is-dist");
    });

    (scene.polygons || []).forEach(function (poly) {
      var verts = (poly.verts || []).map(resolvePt).filter(Boolean);
      if (verts.length < 3) return;
      var el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      el.setAttribute(
        "points",
        verts
          .map(function (p) {
            return sx(p.x) + "," + sy(p.y);
          })
          .join(" ")
      );
      el.setAttribute("class", "coord-poly");
      svg.appendChild(el);
    });

    (scene.areaLabels || []).forEach(function (lab) {
      var verts = (lab.verts || []).map(resolvePt).filter(Boolean);
      if (verts.length < 3) return;
      var cx = 0;
      var cy = 0;
      verts.forEach(function (p) {
        cx += p.x;
        cy += p.y;
      });
      cx /= verts.length;
      cy /= verts.length;
      var txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txt.setAttribute("class", "coord-area-s");
      txt.setAttribute("x", String(sx(cx)));
      txt.setAttribute("y", String(sy(cy)));
      txt.setAttribute("text-anchor", "middle");
      txt.setAttribute("dominant-baseline", "middle");
      txt.textContent = String(lab.text || "");
      svg.appendChild(txt);
    });

    function drawRightAngle(at, from, to) {
      if (!at || !from || !to) return;
      var size = 14;
      var ux = from.x - at.x;
      var uy = from.y - at.y;
      var vx = to.x - at.x;
      var vy = to.y - at.y;
      var lu = Math.sqrt(ux * ux + uy * uy) || 1;
      var lv = Math.sqrt(vx * vx + vy * vy) || 1;
      ux /= lu;
      uy /= lu;
      vx /= lv;
      vy /= lv;
      function screenDelta(mx, my, len) {
        var px0 = sx(at.x);
        var py0 = sy(at.y);
        var px1 = sx(at.x + mx);
        var py1 = sy(at.y + my);
        var dx = px1 - px0;
        var dy = py1 - py0;
        var n = Math.sqrt(dx * dx + dy * dy) || 1;
        return { x: (dx / n) * len, y: (dy / n) * len };
      }
      var u = screenDelta(ux, uy, size);
      var v = screenDelta(vx, vy, size);
      var path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      var ax = sx(at.x);
      var ay = sy(at.y);
      path.setAttribute(
        "points",
        [ax + u.x + "," + (ay + u.y), ax + u.x + v.x + "," + (ay + u.y + v.y), ax + v.x + "," + (ay + v.y)].join(" ")
      );
      path.setAttribute("class", "coord-right-angle");
      path.setAttribute("fill", "none");
      svg.appendChild(path);
    }

    (scene.rightAngles || []).forEach(function (ra) {
      drawRightAngle(resolvePt(ra.at), resolvePt(ra.from), resolvePt(ra.to));
    });

    segments.forEach(function (seg) {
      var a = resolvePt(seg.from);
      var b = resolvePt(seg.to);
      if (!a || !b) return;
      var cls = isHi(seg) ? "coord-seg is-hot" : "coord-seg";
      if (seg.dashed) cls += " is-dashed";
      if (seg.height) cls += " is-draw is-height";
      line(sx(a.x), sy(a.y), sx(b.x), sy(b.y), cls);
    });

    function centroidOfPolys() {
      var acc = { x: 0, y: 0, n: 0 };
      (scene.polygons || []).forEach(function (poly) {
        var verts = (poly.verts || []).map(resolvePt).filter(Boolean);
        if (verts.length < 3) return;
        verts.forEach(function (p) {
          acc.x += p.x;
          acc.y += p.y;
          acc.n += 1;
        });
      });
      if (!acc.n) return null;
      return { x: acc.x / acc.n, y: acc.y / acc.n };
    }
    var triC = centroidOfPolys();
    (scene.segLabels || []).forEach(function (lab) {
      var a = resolvePt(lab.from);
      var b = resolvePt(lab.to);
      if (!a || !b) return;
      var p0x = sx(a.x);
      var p0y = sy(a.y);
      var p1x = sx(b.x);
      var p1y = sy(b.y);
      var dx = p1x - p0x;
      var dy = p1y - p0y;
      var slen = Math.sqrt(dx * dx + dy * dy) || 1;
      var mx = (a.x + b.x) / 2;
      var my = (a.y + b.y) / 2;
      var nx = -dy / slen;
      var ny = dx / slen;
      if (triC) {
        var toC = { x: sx(triC.x) - (p0x + p1x) / 2, y: sy(triC.y) - (p0y + p1y) / 2 };
        if (nx * toC.x + ny * toC.y < 0) {
          nx = -nx;
          ny = -ny;
        }
      }
      var angleDeg = readableAngleDeg(dx, dy);
      var px = (p0x + p1x) / 2 + nx * 16;
      var py = (p0y + p1y) / 2 + ny * 16;
      var wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      wrap.setAttribute("class", "coord-seg-len-wrap");
      wrap.setAttribute("transform", "translate(" + px + " " + py + ") rotate(" + angleDeg + ")");
      var lenT = document.createElementNS("http://www.w3.org/2000/svg", "text");
      lenT.setAttribute("class", "coord-seg-len");
      lenT.setAttribute("text-anchor", "middle");
      lenT.setAttribute("dominant-baseline", "middle");
      lenT.textContent = String(lab.text || "");
      wrap.appendChild(lenT);
      svg.appendChild(wrap);
    });

    // גבהים שהתלמיד הוסיף
    var self = this;
    var GD = global.DoctematicaGeoDraw;
    (drawState.heights || []).forEach(function (h) {
      if (!self._showHeight(h)) return;
      var apex = resolvePt(h.from);
      if (!apex || !h.foot) return;
      line(sx(apex.x), sy(apex.y), sx(h.foot.x), sy(h.foot.y), "coord-seg is-draw is-height");
      if (h.snapped) {
        var baseA = resolvePt(h.base[0]);
        var baseB = resolvePt(h.base[1]);
        if (baseA && baseB) {
          var tangent = GD.baseTangentPoint
            ? GD.baseTangentPoint(h.foot, baseA, baseB)
            : baseB.x !== baseA.x
              ? baseB
              : baseA;
          drawRightAngle(h.foot, apex, tangent);
        }
      }
      var fx = sx(h.foot.x);
      var fy = sy(h.foot.y);
      var handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle.setAttribute("cx", fx);
      handle.setAttribute("cy", fy);
      handle.setAttribute("r", 8);
      handle.setAttribute("class", "coord-draw-handle" + (h.snapped ? " is-snapped" : ""));
      handle.setAttribute("data-height-id", h.id);
      handle.style.cursor = "grab";
      handle.addEventListener("pointerdown", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        self._drag = { item: h };
        self._dragMoved = false;
        handle.setPointerCapture(ev.pointerId);
        window.addEventListener("pointermove", self._boundMove);
        window.addEventListener("pointerup", self._boundUp);
      });
      svg.appendChild(handle);
      if (h.snapped && h.footLabel) {
        var footKey = String(h.footLabel || "").toUpperCase();
        var footKnown = points.some(function (p) {
          return String(p.label || "").toUpperCase() === footKey;
        });
        if (!footKnown) {
          text(fx + 10, fy - 8, h.footLabel, "coord-point-label is-unknown is-foot-label");
        }
      }
    });

    points.forEach(function (p) {
      if (String(p.label || "").toUpperCase() === "O") return;
      var cx = sx(p.x);
      var cy = sy(p.y);
      var pickable =
        drawState.pickMode === "height-vertex" &&
        self._triangleVerts().indexOf(String(p.label || "").toUpperCase()) >= 0;
      var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", cx);
      dot.setAttribute("cy", cy);
      dot.setAttribute("r", pickable ? 7 : 4.5);
      var hot = highlight && highlight.point === p.label;
      var cls = hot ? "coord-dot is-hot" : "coord-dot";
      if (p.hideX || p.hideY) cls += " is-unknown";
      if (p.revealed) cls += " is-revealed";
      if (pickable) cls += " is-pickable";
      dot.setAttribute("class", cls);
      if (pickable) {
        dot.style.cursor = "pointer";
        dot.addEventListener("pointerdown", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          self._pickHeightVertex(p.label);
        });
      }
      svg.appendChild(dot);

      var Geo = global.DoctematicaGeometry;
      var label = Geo && Geo.coordLabel ? Geo.coordLabel(p) : p.label;
      var labelHtml = Geo && Geo.coordLabelHTML ? Geo.coordLabelHTML(p) : null;
      var ty = cy - 10;
      var tx = cx + 8;
      if (p.x < 0) tx = cx - 8;
      var cls = p.x < 0 ? "coord-point-label is-left" : "coord-point-label";
      if (p.hideX || p.hideY) cls += " is-unknown";
      if (p.revealed) cls += " is-revealed";
      appendPointLabel(svg, tx, ty, label, labelHtml, cls, p.x < 0 ? "end" : "start");
    });

    this.host.appendChild(svg);
  };

  global.DoctematicaCoordBoard = CoordBoard;
})(window);
