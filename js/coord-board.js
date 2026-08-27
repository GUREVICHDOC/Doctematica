(function (global) {
  function nicePad(min, max, pad) {
    if (min === max) {
      min -= 1;
      max += 1;
    }
    var span = max - min;
    return { min: min - span * pad, max: max + span * pad };
  }

  function CoordBoard(host) {
    this.host = host;
  }

  CoordBoard.prototype.clear = function () {
    if (this.host) {
      this.host.innerHTML = "";
      this.host.classList.add("hidden");
    }
  };

  CoordBoard.prototype.render = function (scene) {
    if (!this.host) return;
    scene = scene || {};
    var points = scene.points || [];
    var segments = scene.segments || [];
    var highlight = scene.highlight || null;

    this.host.classList.remove("hidden");
    this.host.innerHTML = "";

    var xs = [0];
    var ys = [0];
    points.forEach(function (p) {
      xs.push(p.x);
      ys.push(p.y);
    });
    var xRange = nicePad(Math.min.apply(null, xs), Math.max.apply(null, xs), 0.18);
    var yRange = nicePad(Math.min.apply(null, ys), Math.max.apply(null, ys), 0.22);

    // Prefer a bit more room so axes read clearly
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

    function sx(x) {
      return margin.l + ((x - xRange.min) / (xRange.max - xRange.min)) * plotW;
    }
    function sy(y) {
      return margin.t + ((yRange.max - y) / (yRange.max - yRange.min)) * plotH;
    }

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

    // Axes
    var ox = sx(0);
    var oy = sy(0);
    line(margin.l, oy, width - margin.r, oy, "coord-axis");
    line(ox, height - margin.b, ox, margin.t, "coord-axis");
    // arrows
    line(width - margin.r, oy, width - margin.r - 8, oy - 5, "coord-axis");
    line(width - margin.r, oy, width - margin.r - 8, oy + 5, "coord-axis");
    line(ox, margin.t, ox - 5, margin.t + 8, "coord-axis");
    line(ox, margin.t, ox + 5, margin.t + 8, "coord-axis");
    text(width - margin.r + 4, oy - 8, "x", "coord-axis-label");
    text(ox + 8, margin.t + 4, "y", "coord-axis-label");
    text(ox - 10, oy + 14, "O", "coord-origin");

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

    var guides = scene.axisGuides || [];
    guides.forEach(function (g) {
      var gp = points.filter(function (p) {
        return p.label === g.point;
      })[0];
      if (!gp) return;
      if (g.axis === "y") {
        line(sx(gp.x), sy(gp.y), sx(0), sy(gp.y), "coord-guide");
      } else {
        line(sx(gp.x), sy(gp.y), sx(gp.x), sy(0), "coord-guide");
      }
    });

    var distGuides = scene.distGuides || [];
    distGuides.forEach(function (g) {
      if (!g.from || !g.to) return;
      line(sx(g.from.x), sy(g.from.y), sx(g.to.x), sy(g.to.y), "coord-guide is-dist");
    });

    function resolvePt(lab) {
      var key = String(lab || "").toUpperCase();
      if (key === "O") return { label: "O", x: 0, y: 0 };
      return points.filter(function (p) {
        return String(p.label || "").toUpperCase() === key;
      })[0] || null;
    }

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

    (scene.rightAngles || []).forEach(function (ra) {
      var at = resolvePt(ra.at || "O");
      var from = resolvePt(ra.from);
      var to = resolvePt(ra.to);
      if (!at || !from || !to) return;
      var size = ra.size || 14;
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
      // convert unit math vectors to screen: y flips
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
    });

    segments.forEach(function (seg) {
      var a = resolvePt(seg.from);
      var b = resolvePt(seg.to);
      if (!a || !b) return;
      var cls = isHi(seg) ? "coord-seg is-hot" : "coord-seg";
      if (seg.dashed) cls += " is-dashed";
      line(sx(a.x), sy(a.y), sx(b.x), sy(b.y), cls);
    });

    points.forEach(function (p) {
      if (String(p.label || "").toUpperCase() === "O") return;
      var cx = sx(p.x);
      var cy = sy(p.y);
      var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", cx);
      dot.setAttribute("cy", cy);
      dot.setAttribute("r", 4.5);
      var hot = highlight && highlight.point === p.label;
      var cls = hot ? "coord-dot is-hot" : "coord-dot";
      if (p.hideX || p.hideY) cls += " is-unknown";
      if (p.revealed) cls += " is-revealed";
      dot.setAttribute("class", cls);
      svg.appendChild(dot);

      function fmtCoord(v, hidden) {
        if (hidden) return " ";
        if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
        return String(v);
      }
      var label =
        p.label +
        "(" +
        fmtCoord(p.x, !!p.hideX) +
        ";" +
        fmtCoord(p.y, !!p.hideY) +
        ")";
      var ty = cy - 10;
      var tx = cx + 8;
      if (p.x < 0) tx = cx - 8;
      var lab = text(
        tx,
        ty,
        label,
        p.x < 0 ? "coord-point-label is-left" : "coord-point-label"
      );
      if (p.x < 0) lab.setAttribute("text-anchor", "end");
      if (p.hideX || p.hideY) lab.setAttribute("class", lab.getAttribute("class") + " is-unknown");
      if (p.revealed) lab.setAttribute("class", lab.getAttribute("class") + " is-revealed");
    });

    this.host.appendChild(svg);
  };

  global.DoctematicaCoordBoard = CoordBoard;
})(window);
