(function (global) {
  var EPS = 1e-6;

  function near(n, m) {
    return Math.abs(n - m) < EPS;
  }

  function near0(n) {
    return Math.abs(n) < EPS;
  }

  function getPt(map, label) {
    if (!map || !label) return null;
    var key = String(label).toUpperCase();
    if (key === "O") return { label: "O", x: 0, y: 0 };
    return map[key] || map[label] || null;
  }

  function upper(lab) {
    return String(lab || "").toUpperCase();
  }

  function tOnSegment(t) {
    return t != null && t >= -0.02 && t <= 1.02;
  }

  /** רגל גובה על הישר (בלי הידוק לקטע — כדי שיישאר מאונך) */
  function footOnLine(apex, a, b) {
    if (!apex || !a || !b) return null;
    if (near(a.y, b.y)) {
      var tx = near(b.x, a.x) ? 0 : (apex.x - a.x) / (b.x - a.x);
      return { x: apex.x, y: a.y, onAxis: "x", t: tx };
    }
    if (near(a.x, b.x)) {
      var ty = near(b.y, a.y) ? 0 : (apex.y - a.y) / (b.y - a.y);
      return { x: a.x, y: apex.y, onAxis: "y", t: ty };
    }
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var len2 = dx * dx + dy * dy;
    if (near0(len2)) return null;
    var t = ((apex.x - a.x) * dx + (apex.y - a.y) * dy) / len2;
    return { x: a.x + t * dx, y: a.y + t * dy, onAxis: null, t: t };
  }

  /** רגל גובה: הטלה על הקטע (כולל הידוק לקצוות) — לגרירה בלבד */
  function footOnSegment(apex, a, b) {
    var raw = footOnLine(apex, a, b);
    if (!raw) return null;
    var t = Math.max(0, Math.min(1, raw.t == null ? 0 : raw.t));
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return {
      x: a.x + t * dx,
      y: a.y + t * dy,
      onAxis: raw.onAxis,
      t: t,
      clamped: !tOnSegment(raw.t),
    };
  }

  function segBounds(a, b) {
    return {
      minX: Math.min(a.x, b.x),
      maxX: Math.max(a.x, b.x),
      minY: Math.min(a.y, b.y),
      maxY: Math.max(a.y, b.y),
    };
  }

  /** גרירת רגל גובה — ננעל לכיוון הנכון ונצמד לרגל המדויקת */
  function snapHeightFoot(rawX, rawY, apex, baseA, baseB, tol) {
    tol = tol == null ? 0.55 : tol;
    var exact = footOnLine(apex, baseA, baseB);
    if (!exact) return { x: rawX, y: rawY, snapped: false, exact: null };

    var bx = segBounds(baseA, baseB);
    var foot = { x: rawX, y: rawY, snapped: false, exact: exact };

    if (exact.onAxis === "x") {
      foot.y = baseA.y;
      foot.x = Math.max(bx.minX, Math.min(bx.maxX, rawX));
      if (Math.abs(foot.x - exact.x) <= tol) {
        foot.x = exact.x;
        foot.y = exact.y;
        foot.snapped = true;
      }
    } else if (exact.onAxis === "y") {
      foot.x = baseA.x;
      foot.y = Math.max(bx.minY, Math.min(bx.maxY, rawY));
      if (Math.abs(foot.y - exact.y) <= tol) {
        foot.x = exact.x;
        foot.y = exact.y;
        foot.snapped = true;
      }
    } else {
      foot.x = exact.x;
      foot.y = exact.y;
      foot.snapped = true;
    }
    return foot;
  }

  function oppositeSide(triangle, from) {
    var verts = (triangle || []).map(upper);
    var apex = upper(from);
    var base = verts.filter(function (v) {
      return v !== apex;
    });
    return base.length === 2 ? base : null;
  }

  function resolveHeightSpec(spec, map) {
    var from = getPt(map, spec.from);
    var base = (spec.base || []).map(function (lab) {
      return getPt(map, lab);
    });
    if (!from || base.length < 2 || !base[0] || !base[1]) return null;
    var exact = footOnLine(from, base[0], base[1]);
    if (!exact) return null;
    return {
      id: spec.id || "h-" + upper(spec.from),
      from: upper(spec.from),
      base: (spec.base || []).map(upper),
      footLabel: spec.footLabel || "H",
      recommended: !!spec.recommended || spec.recommended == null,
      exact: exact,
      fromPt: from,
      baseA: base[0],
      baseB: base[1],
    };
  }

  /** האם הגובה מהקודקוד לצלע הנגדית מומלץ / נוח לתרגיל */
  function assessHeightChoice(from, base, map, recommendedList) {
    var apex = upper(from);
    var baseLabs = (base || []).map(upper);
    var list = recommendedList || [];
    var match = list.filter(function (s) {
      if (upper(s.from) !== apex) return false;
      var sb = (s.base || []).map(upper).sort().join("");
      var want = baseLabs.slice().sort().join("");
      return sb === want;
    })[0];

    var a = getPt(map, baseLabs[0]);
    var b = getPt(map, baseLabs[1]);
    var apexPt = getPt(map, apex);
    var raw = footOnLine(apexPt, a, b);
    var outside = false;
    if (raw && raw.t != null && (raw.t < -0.02 || raw.t > 1.02)) outside = true;

    if (match) {
      return {
        recommended: true,
        footLabel: match.footLabel || "H",
        id: match.id || "h-" + apex,
        note: outside
          ? "זה גובה חיצוני: הרגל נופלת על המשך הצלע, לא על הקטע עצמו — זה תקין לחישוב השטח."
          : null,
      };
    }

    var tip =
      list.length && list[0]
        ? " בתרגיל הזה נוח יותר להוריד גובה מ־" +
          upper(list[0].from) +
          " אל " +
          (list[0].base || []).map(upper).join("") +
          "."
        : "";
    var note = outside
      ? "הגובה מ־" +
        apex +
        " לצלע " +
        baseLabs.join("") +
        " נופל מחוץ לקטע — זה לא גובה מתאים לחישוב השטח כאן." +
        tip
      : "גובה מ־" +
        apex +
        " לצלע " +
        baseLabs.join("") +
        " אפשרי, אבל לא הנוח ביותר לתרגיל הזה." +
        tip;

    return {
      recommended: false,
      footLabel: null,
      id: "h-" + apex,
      note: note,
    };
  }

  /** נקודה בכיוון הצלע — לסימון זווית ישרה */
  function baseTangentPoint(foot, baseA, baseB) {
    if (!foot || !baseA || !baseB) return null;
    return {
      x: foot.x + (baseB.x - baseA.x),
      y: foot.y + (baseB.y - baseA.y),
    };
  }

  function trianglesFromConfig(config) {
    config = config || {};
    if (config.triangles && config.triangles.length) {
      return config.triangles.map(function (t) {
        return (t || []).map(upper);
      });
    }
    if (config.triangle && config.triangle.length) {
      return [config.triangle.map(upper)];
    }
    return [];
  }

  function buildHeightFromVertex(config, map, from) {
    config = config || {};
    var apex = upper(from);
    var rec = (config.heights || []).filter(function (h) {
      return upper(h.from) === apex;
    })[0];
    var base = rec && rec.base && rec.base.length >= 2 ? rec.base.map(upper) : null;
    if (!base) {
      var tris = trianglesFromConfig(config);
      var tri = tris.filter(function (t) {
        return t.indexOf(apex) >= 0;
      })[0];
      if (!tri && (config.heights || []).length) {
        var h0 = config.heights[0];
        tri = [upper(h0.from)].concat((h0.base || []).map(upper));
      }
      base = oppositeSide(tri, from);
    }
    if (!base) return null;
    var assess = assessHeightChoice(from, base, map, config.heights || []);
    var midA = getPt(map, base[0]);
    var midB = getPt(map, base[1]);
    if (!midA || !midB) return null;
    var apexPt = getPt(map, from);
    var exact = apexPt ? footOnLine(apexPt, midA, midB) : null;
    var foot = exact
      ? { x: exact.x, y: exact.y }
      : { x: (midA.x + midB.x) / 2, y: (midA.y + midB.y) / 2 };
    return {
      id: assess.id,
      type: "height",
      from: apex,
      base: base,
      footLabel: assess.footLabel,
      foot: foot,
      snapped: !!exact,
      visible: true,
      userAdded: true,
      recommended: assess.recommended,
      note: assess.note,
    };
  }

  function initDrawState() {
    return { heights: [], auxPoints: [], pickMode: null, note: null };
  }

  function heightLength(spec, map, foot) {
    var r = resolveHeightSpec({ from: spec.from, base: spec.base }, map);
    if (!r || !foot) return null;
    var ax = r.fromPt.x;
    var ay = r.fromPt.y;
    if (r.exact.onAxis === "x") return Math.abs(ay - foot.y);
    if (r.exact.onAxis === "y") return Math.abs(ax - foot.x);
    return Math.sqrt((ax - foot.x) * (ax - foot.x) + (ay - foot.y) * (ay - foot.y));
  }

  function revealedFootLabels(drawState) {
    var out = {};
    ((drawState && drawState.heights) || []).forEach(function (h) {
      if (h && h.visible && h.snapped && h.footLabel) {
        out[upper(h.footLabel)] = true;
      }
    });
    return out;
  }

  global.DoctematicaGeoDraw = {
    EPS: EPS,
    near: near,
    getPt: getPt,
    footOnSegment: footOnSegment,
    footOnLine: footOnLine,
    snapHeightFoot: snapHeightFoot,
    oppositeSide: oppositeSide,
    resolveHeightSpec: resolveHeightSpec,
    assessHeightChoice: assessHeightChoice,
    baseTangentPoint: baseTangentPoint,
    buildHeightFromVertex: buildHeightFromVertex,
    initDrawState: initDrawState,
    heightLength: heightLength,
    revealedFootLabels: revealedFootLabels,
  };
})(window);
