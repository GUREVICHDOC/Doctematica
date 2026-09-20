(function (global) {
  function isFracNode(v) {
    return v && typeof v === "object" && v.type === "frac";
  }

  function isSqrtNode(v) {
    return v && typeof v === "object" && v.type === "sqrt";
  }

  function isNrootNode(v) {
    return v && typeof v === "object" && v.type === "nroot";
  }

  function isPowNode(v) {
    return v && typeof v === "object" && v.type === "pow";
  }

  function isAreaNode(v) {
    return v && typeof v === "object" && v.type === "area";
  }

  function isMSlopeNode(v) {
    return v && typeof v === "object" && (v.type === "mslope" || v.type === "mdist");
  }

  /** Plain "x^3" / "2^4" → pow node (for radicands that stored caret as text). */
  function tryParsePowText(s) {
    var t = String(s || "").replace(/\s+/g, "");
    var m = t.match(/^([A-Za-z]|-?\d+(?:\.\d+)?)\^(\d+)$/);
    if (!m) return null;
    return { type: "pow", base: m[1], exp: m[2] };
  }

  function grabFracNumerator(left) {
    var s = String(left || "");
    if (!s) return { left: "", num: "" };

    // סוגריים מלאים בסוף: (6*2) או 3(x+1)
    if (s.charAt(s.length - 1) === ")") {
      var depth = 0;
      var i;
      for (i = s.length - 1; i >= 0; i--) {
        var ch = s.charAt(i);
        if (ch === ")") depth += 1;
        else if (ch === "(") {
          depth -= 1;
          if (depth === 0) {
            var start = i;
            var before = s.slice(0, start);
            var coef = before.match(/(\d+(?:\.\d+)?)$/);
            if (coef) start = before.length - coef[1].length;
            return { left: s.slice(0, start), num: s.slice(start) };
          }
        }
      }
    }

    // שרשרת כפל בסוף: 6*2, AO×BO, x*3 — בלי לחצות + − =
    // גורם: מספר, מספר+x, אות/קודקודים, או x^2
    var atom =
      "(?:\\d+(?:\\.\\d+)?(?:[xy](?:\\^[2-9])?)?|[A-Za-z]{1,4}(?:\\^[2-9])?)";
    var mulOp = "[×*·]";
    var prod = s.match(new RegExp("(" + atom + "(?:" + mulOp + atom + ")*)$", "i"));
    if (!prod) return { left: s, num: "" };
    var num = prod[1];
    var rest = s.slice(0, -num.length);
    // מינוס יחידתי לפני המכפלה: -6*2 או -x
    if (/[-−]$/.test(rest)) {
      var beforeMinus = rest.slice(0, -1);
      if (!beforeMinus || /[+\-−×*·\/(=]$/.test(beforeMinus)) {
        num = rest.slice(-1) + num;
        rest = beforeMinus;
      }
    }
    return { left: rest, num: num };
  }

  /** Grab base for ^ : full (...), optional leading coeff, or letter/number. */
  function grabPowBase(left) {
    var s = String(left || "");
    if (!s) return { left: "", base: "x" };

    if (s.charAt(s.length - 1) === ")") {
      var depth = 0;
      var i;
      for (i = s.length - 1; i >= 0; i--) {
        var ch = s.charAt(i);
        if (ch === ")") depth += 1;
        else if (ch === "(") {
          depth -= 1;
          if (depth === 0) {
            var start = i;
            var before = s.slice(0, start);
            var coef = before.match(/(\d+(?:\.\d+)?)$/);
            if (coef) start = before.length - coef[1].length;
            return { left: s.slice(0, start), base: s.slice(start) };
          }
        }
      }
    }

    var atom = s.match(/([A-Za-z]|-?\d+(?:\.\d+)?)$/);
    if (atom) {
      return { left: s.slice(0, -atom[1].length), base: atom[1] };
    }
    return { left: s, base: "x" };
  }

  function MathField(host, actionsHost) {
    this.host = host;
    this.actionsHost = actionsHost;
    this.parts = [{ type: "text", value: "" }];
    this.focusPart = 0;
    this.focusPath = ["value"];
    this.disabled = false;
    this.buildActions();
    this.render();
    var self = this;
    this.host.addEventListener("click", function (event) {
      if (event.target === self.host) self.focus();
    });
  }

  MathField.prototype.pathKey = function (path) {
    return (path || []).join(".");
  };

  MathField.prototype.getAt = function (part, path) {
    var node = part;
    var i;
    for (i = 0; i < path.length; i++) {
      if (node == null) return "";
      node = node[path[i]];
    }
    return node;
  };

  MathField.prototype.setAt = function (part, path, value) {
    var node = part;
    var i;
    for (i = 0; i < path.length - 1; i++) {
      if (node == null) return;
      node = node[path[i]];
    }
    if (node) node[path[path.length - 1]] = value;
  };

  MathField.prototype.collectSlots = function (node, path, out) {
    if (node.type === "text") {
      out.push({ path: ["value"] });
      return;
    }
    if (node.type === "sqrt") {
      if (isFracNode(node.rad) || isPowNode(node.rad)) this.collectSlots(node.rad, path.concat("rad"), out);
      else out.push({ path: path.concat("rad") });
      return;
    }
    if (node.type === "nroot") {
      out.push({ path: path.concat("index") });
      if (isFracNode(node.rad) || isPowNode(node.rad)) this.collectSlots(node.rad, path.concat("rad"), out);
      else out.push({ path: path.concat("rad") });
      return;
    }
    if (node.type === "pow") {
      out.push({ path: path.concat("base") });
      out.push({ path: path.concat("exp") });
      return;
    }
    if (node.type === "area") {
      out.push({ path: path.concat("verts") });
      return;
    }
    if (node.type === "mslope" || node.type === "mdist") {
      out.push({ path: path.concat("pts") });
      return;
    }
    if (node.type === "mixed") out.push({ path: path.concat("whole") });
    var self = this;
    ["num", "den"].forEach(function (field) {
      var next = path.concat(field);
      var val = node[field];
      if (isFracNode(val)) self.collectSlots(val, next, out);
      else out.push({ path: next });
    });
  };

  MathField.prototype.slots = function () {
    var out = [];
    for (var i = 0; i < this.parts.length; i++) {
      var local = [];
      this.collectSlots(this.parts[i], [], local);
      for (var s = 0; s < local.length; s++) {
        out.push({ index: i, path: local[s].path });
      }
    }
    return out;
  };

  /** 2/3 then (x+6) typed in the den slot → (2/3)(x+6), like the site path. */
  function splitNumericDenParens(d) {
    var t = String(d || "").replace(/\s+/g, "");
    var m = t.match(/^([+\-−]?\d+(?:\.\d+)?)(\(.+\))$/);
    if (!m) return null;
    var par = m[2];
    var depth = 0;
    var i;
    for (i = 0; i < par.length; i++) {
      var ch = par.charAt(i);
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth < 0) return null;
      }
    }
    if (depth !== 0) return null;
    return { den: m[1], rest: m[2] };
  }

  MathField.prototype.serializeSlot = function (val) {
    if (isFracNode(val)) {
      var n = this.serializeSlot(val.num);
      var d = this.serializeSlot(val.den);
      var pulled = splitNumericDenParens(d);
      if (pulled && /^-?\d+$/.test(String(n).replace(/−/g, "-")) && /^-?\d+$/.test(String(pulled.den).replace(/−/g, "-"))) {
        return "(" + String(n).replace(/-/g, "−") + "/" + pulled.den + ")" + pulled.rest;
      }
      if (/^-?\d+$/.test(n) && /^-?\d+$/.test(d) && d !== "0" && d !== "-0") return n + "/" + d;
      return "(" + n + ")/(" + d + ")";
    }
    if (isPowNode(val)) {
      var b = this.serializeSlot(val.base);
      var e = this.serializeSlot(val.exp);
      if (!e) e = "2";
      if (/^[xy]$/i.test(b)) return b + "^" + e;
      if (/^-?\d+(?:\.\d+)?$/.test(b)) return b + "^" + e;
      if (/^\(.*\)$/.test(b)) return b + "^" + e;
      return "(" + b + ")^" + e;
    }
    return String(val || "").trim();
  };

  MathField.prototype.serializePart = function (part) {
    if (part.type === "text") return part.value || "";
    if (part.type === "sqrt") return "√(" + this.serializeSlot(part.rad) + ")";
    if (part.type === "nroot") {
      var idx = this.serializeSlot(part.index) || "3";
      var radS = this.serializeSlot(part.rad);
      if (idx === "3") return "∛(" + radS + ")";
      if (idx === "4") return "∜(" + radS + ")";
      return "√[" + idx + "](" + radS + ")";
    }
    if (part.type === "pow") {
      var b = this.serializeSlot(part.base);
      var e = this.serializeSlot(part.exp);
      if (!e) e = "2";
      if (/^[xy]$/i.test(b)) return b + "^" + e;
      if (/^-?\d+(?:\.\d+)?$/.test(b)) return b + "^" + e;
      if (/^\(.*\)$/.test(b)) return b + "^" + e;
      return "(" + b + ")^" + e;
    }
    if (part.type === "area") {
      var verts = this.serializeSlot(part.verts).replace(/\s+/g, "").toUpperCase();
      var mark = part.shape === "rect" ? "□" : "△";
      var letter = part.shape === "perim" ? "P" : "S";
      return letter + mark + verts;
    }
    if (part.type === "mslope") {
      var pts = this.serializeSlot(part.pts).replace(/\s+/g, "").toUpperCase();
      return "m" + pts;
    }
    if (part.type === "mdist") {
      var dpts = this.serializeSlot(part.pts).replace(/\s+/g, "").toUpperCase();
      return dpts ? "d" + dpts : "d";
    }
    if (part.type === "frac") return this.serializeSlot(part);
    var w = String(part.whole || "").trim();
    var n = this.serializeSlot(part.num);
    var d = this.serializeSlot(part.den);
    return (w ? w + " " : "") + n + "/" + d;
  };

  MathField.prototype.serialize = function () {
    this.readInputs();
    var self = this;
    var bits = this.parts.map(function (part) {
      return self.serializePart(part);
    });
    var i;
    for (i = 0; i < bits.length; i++) {
      var cur = String(bits[i] || "");
      var next = String(bits[i + 1] || "");
      if (
        this.parts[i] &&
        this.parts[i].type === "frac" &&
        /^-?\d+\/-?\d+$/.test(cur.replace(/−/g, "-")) &&
        /^\s*[\(xyXY]/.test(next)
      ) {
        bits[i] = "(" + cur + ")";
      }
    }
    return bits.join("").replace(/\s+/g, " ").trim();
  };

  MathField.prototype.setDisabled = function (disabled) {
    this.disabled = !!disabled;
    var inputs = this.host.querySelectorAll("input");
    for (var i = 0; i < inputs.length; i++) inputs[i].disabled = this.disabled;
    var buttons = this.actionsHost.querySelectorAll("button");
    for (var b = 0; b < buttons.length; b++) buttons[b].disabled = this.disabled;
    if (this.disabled) this.host.classList.add("is-locked");
    else this.host.classList.remove("is-locked");
  };

  MathField.prototype.clear = function () {
    this.parts = [{ type: "text", value: "" }];
    this.focusPart = 0;
    this.focusPath = ["value"];
    this.caretPos = null;
    this.setDisabled(false);
    this.render();
  };

  MathField.prototype.focus = function () {
    this.host.focus();
    var el = this.host.querySelector("[data-active='1']");
    if (el) {
      el.focus();
      var pos = this.caretPos != null ? this.caretPos : el.value.length;
      this.caretPos = null;
      try {
        if (pos > el.value.length) pos = el.value.length;
        if (pos < 0) pos = 0;
        el.setSelectionRange(pos, pos);
      } catch (e) {}
    }
  };

  MathField.prototype.normalize = function () {
    var out = [];
    var i;
    for (i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      if (p.type === "text") {
        var prev = out[out.length - 1];
        if (prev && prev.type === "text") {
          prev.value += p.value || "";
          continue;
        }
        out.push({ type: "text", value: p.value || "" });
      } else {
        out.push(p);
      }
    }
    if (!out.length) out.push({ type: "text", value: "" });
    if (out[0].type !== "text") out.unshift({ type: "text", value: "" });
    if (out[out.length - 1].type !== "text") out.push({ type: "text", value: "" });
    this.parts = out;
    if (this.focusPart >= this.parts.length) this.focusPart = this.parts.length - 1;
    if (this.focusPart < 0) this.focusPart = 0;
  };

  MathField.prototype.removePart = function (index) {
    this.readInputs();
    if (!this.parts[index] || this.parts[index].type === "text") return;
    var left = this.parts[index - 1];
    var right = this.parts[index + 1];
    var leftVal = left && left.type === "text" ? left.value || "" : "";
    var rightVal = right && right.type === "text" ? right.value || "" : "";
    var start = index;
    var count = 1;
    if (left && left.type === "text") {
      start = index - 1;
      count += 1;
    }
    if (right && right.type === "text") count += 1;
    this.parts.splice(start, count, { type: "text", value: leftVal + rightVal });
    this.focusPart = start;
    this.focusPath = ["value"];
    this.caretPos = leftVal.length;
    this.normalize();
    this.render();
    this.focus();
  };

  MathField.prototype.splitCurrentText = function () {
    var part = this.parts[this.focusPart];
    var el = this.host.querySelector(
      'input[data-part="' + this.focusPart + '"][data-path="value"]'
    );
    if (!part || part.type !== "text") return { left: "", right: "" };
    var value = el ? el.value : part.value || "";
    var cursor = el && el.selectionStart != null ? el.selectionStart : value.length;
    this.parts[this.focusPart].value = value;
    return { left: value.slice(0, cursor), right: value.slice(cursor) };
  };

  MathField.prototype.insertWithSplit = function (split, middle) {
    var i = this.focusPart;
    if (!this.parts[i] || this.parts[i].type !== "text") {
      this.parts.splice(i + 1, 0, middle, { type: "text", value: "" });
      this.focusPart = i + 1;
      return;
    }
    var next = [{ type: "text", value: split.left }, middle, { type: "text", value: split.right }];
    this.parts.splice.apply(this.parts, [i, 1].concat(next));
    this.focusPart = i + 1;
  };

  MathField.prototype.nestFracInSlot = function () {
    this.readInputs();
    var part = this.parts[this.focusPart];
    var path = this.focusPath.slice();
    var cur = this.getAt(part, path);
    if (isFracNode(cur)) return false;
    var value = String(cur || "");
    var el = this.host.querySelector(
      'input[data-part="' + this.focusPart + '"][data-path="' + this.pathKey(path) + '"]'
    );
    var cursor = el && el.selectionStart != null ? el.selectionStart : value.length;
    var left = value.slice(0, cursor);
    var right = value.slice(cursor);
    var grabbed = grabFracNumerator(left);
    var num = grabbed.num;
    left = grabbed.left;
    var nested = { type: "frac", num: num, den: "" };
    if (left || right) nested.num = left + num + right;
    this.setAt(part, path, nested);
    this.focusPath = path.concat(nested.num ? "den" : "num");
    this.normalize();
    this.render();
    this.focus();
    return true;
  };

  MathField.prototype.insertFrac = function () {
    if (this.disabled) return;
    var part = this.parts[this.focusPart];
    if (part && part.type !== "text") {
      this.nestFracInSlot();
      return;
    }
    var split = this.splitCurrentText();
    var grabbed = grabFracNumerator(split.left);
    var num = grabbed.num;
    split.left = grabbed.left;
    this.insertWithSplit(split, { type: "frac", num: num, den: "" });
    this.normalize();
    this.focusPath = [num ? "den" : "num"];
    this.render();
    this.focus();
  };

  MathField.prototype.insertSqrt = function () {
    if (this.disabled) return;
    var part = this.parts[this.focusPart];
    if (part && part.type !== "text") return;
    var split = this.splitCurrentText();
    var rad = "";
    var grabbed = split.left.match(/(-?\d+(?:\.\d+)?)$/);
    if (grabbed) {
      rad = grabbed[1];
      split.left = split.left.slice(0, -rad.length);
    }
    this.insertWithSplit(split, { type: "sqrt", rad: rad });
    this.normalize();
    this.focusPath = ["rad"];
    this.render();
    this.focus();
  };

  MathField.prototype.insertNroot = function () {
    if (this.disabled) return;
    var part = this.parts[this.focusPart];
    if (part && part.type !== "text") return;
    var split = this.splitCurrentText();
    var rad = "";
    var grabbed = split.left.match(/(-?\d+(?:\.\d+)?|[xy](?:\^[2-9])?)$/i);
    if (grabbed) {
      rad = grabbed[1];
      split.left = split.left.slice(0, -rad.length);
    }
    var radNode = tryParsePowText(rad) || rad;
    this.insertWithSplit(split, { type: "nroot", index: "3", rad: radNode });
    this.normalize();
    this.focusPath = ["index"];
    this.render();
    this.focus();
  };

  MathField.prototype.nestPowInSlot = function () {
    this.readInputs();
    var part = this.parts[this.focusPart];
    if (!part || part.type === "text") return false;
    var path = this.focusPath.slice();
    // אינדקס של שורש-n: חזקה שייכת לתוך השורש, לא למעלה
    if (part.type === "nroot" && path[0] === "index") {
      path = ["rad"];
      this.focusPath = ["rad"];
    }
    var parentPath = path.slice(0, -1);
    var last = path[path.length - 1];
    if (parentPath.length && isPowNode(this.getAt(part, parentPath))) {
      if (last === "base") {
        this.focusPath = parentPath.concat("exp");
        this.render();
        this.focus();
        return true;
      }
      return true;
    }
    var cur = this.getAt(part, path);
    if (isFracNode(cur) || isPowNode(cur) || (cur != null && typeof cur === "object")) return false;
    var value = String(cur || "");
    var el = this.host.querySelector(
      'input[data-part="' + this.focusPart + '"][data-path="' + this.pathKey(path) + '"]'
    );
    var cursor = el && el.selectionStart != null ? el.selectionStart : value.length;
    var left = value.slice(0, cursor);
    var right = value.slice(cursor);
    var grabbed = grabPowBase(left);
    var base = grabbed.base;
    var remLeft = grabbed.left;
    if (remLeft || right) base = remLeft + base + right;
    this.setAt(part, path, { type: "pow", base: base, exp: "2" });
    this.focusPath = path.concat("exp");
    this.normalize();
    this.render();
    this.focus();
    return true;
  };

  MathField.prototype.insertChars = function (ch) {
    if (this.disabled) return;
    this.readInputs();
    var el =
      this.host.querySelector("[data-active='1']") || this.host.querySelector("input");
    if (!el) return;
    var v = el.value || "";
    var a = el.selectionStart != null ? el.selectionStart : v.length;
    var b = el.selectionEnd != null ? el.selectionEnd : v.length;
    var next = v.slice(0, a) + ch + v.slice(b);
    el.value = next;
    var partIndex = parseInt(el.getAttribute("data-part"), 10);
    var path = (el.getAttribute("data-path") || "value").split(".");
    if (this.parts[partIndex]) this.setAt(this.parts[partIndex], path, next);
    this.focusPart = partIndex;
    this.focusPath = path;
    this.caretPos = a + String(ch).length;
    if (path[0] === "verts") {
      var cleaned = this.sanitizeAreaVerts(next, this.areaVertsNeed(this.parts[partIndex]));
      el.value = cleaned;
      this.setAt(this.parts[partIndex], path, cleaned);
      this.caretPos = cleaned.length;
      this.fitAllSlots();
      if (cleaned.length >= this.areaVertsNeed(this.parts[partIndex])) {
        this.focusAfterAreaVerts(partIndex);
        return;
      }
    } else if (el.classList.contains("ml-text")) {
      this.fitText(el, el.classList.contains("is-grow"));
    } else {
      this.fitAllSlots();
    }
    try {
      el.setSelectionRange(this.caretPos, this.caretPos);
    } catch (e) {}
    el.focus();
  };

  MathField.prototype.insertPow = function () {
    if (this.disabled) return;
    var part = this.parts[this.focusPart];
    if (!part || part.type !== "text") {
      if (this.nestPowInSlot()) return;
      return;
    }
    var split = this.splitCurrentText();
    var grabbed = grabPowBase(split.left);
    split.left = grabbed.left;
    this.insertWithSplit(split, { type: "pow", base: grabbed.base, exp: "2" });
    this.normalize();
    this.focusPath = ["exp"];
    this.render();
    this.focus();
  };

  MathField.prototype.areaVertsNeed = function (part) {
    if (part && part.type === "area" && part.shape === "rect") return 4;
    return 3;
  };

  MathField.prototype.insertArea = function (shape) {
    if (this.disabled) return;
    var part = this.parts[this.focusPart];
    if (part && part.type !== "text") return;
    var split = this.splitCurrentText();
    this.insertWithSplit(split, {
      type: "area",
      shape: shape === "rect" ? "rect" : shape === "perim" ? "perim" : "triangle",
      verts: "",
    });
    this.normalize();
    this.focusPath = ["verts"];
    this.render();
    this.focus();
  };

  MathField.prototype.insertMSlope = function (pts) {
    if (this.disabled) return;
    var part = this.parts[this.focusPart];
    if (part && part.type !== "text") return;
    var split = this.splitCurrentText();
    var labels = this.cleanMSlopePts(pts || this.mSlopePts || "AB") || "AB";
    this.insertWithSplit(split, { type: "mslope", pts: labels });
    this.normalize();
    var i;
    for (i = 0; i < this.parts.length; i++) {
      if (this.parts[i].type === "mslope") break;
    }
    var right = this.parts[i + 1];
    if (right && right.type === "text" && !/^\s*=/.test(right.value || "")) {
      right.value = " = " + (right.value || "");
    }
    if (labels.length >= 2) {
      this.focusPart = Math.min(i + 1, this.parts.length - 1);
      this.focusPath = ["value"];
      this.caretPos = (this.parts[this.focusPart].value || "").length;
    } else {
      this.focusPart = i;
      this.focusPath = ["pts"];
    }
    this.render();
    this.focus();
  };

  MathField.prototype.cleanMSlopePts = function (pts) {
    return String(pts || "")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase()
      .slice(0, 4);
  };

  MathField.prototype.setMSlopeEnabled = function (enabled, pts) {
    this.mSlopePts = this.cleanMSlopePts(pts || "AB") || "AB";
    if (this.mSlopeWrap) {
      this.mSlopeWrap.classList.toggle("hidden", !enabled);
      var lab = this.mSlopeWrap.querySelector(".mslope-icon small");
      if (lab) lab.textContent = this.mSlopePts || "AB";
    }
  };

  MathField.prototype.insertMDist = function (pts) {
    if (this.disabled) return;
    var part = this.parts[this.focusPart];
    if (part && part.type !== "text") return;
    var split = this.splitCurrentText();
    var labels = this.cleanMSlopePts(pts || this.mDistPts || "AB") || "AB";
    this.insertWithSplit(split, { type: "mdist", pts: labels });
    this.normalize();
    var i;
    for (i = 0; i < this.parts.length; i++) {
      if (this.parts[i].type === "mdist") break;
    }
    var right = this.parts[i + 1];
    if (right && right.type === "text" && !/^\s*=/.test(right.value || "")) {
      right.value = " = " + (right.value || "");
    }
    if (labels.length >= 1) {
      this.focusPart = Math.min(i + 1, this.parts.length - 1);
      this.focusPath = ["value"];
      this.caretPos = (this.parts[this.focusPart].value || "").length;
    } else {
      this.focusPart = i;
      this.focusPath = ["pts"];
    }
    this.render();
    this.focus();
  };

  MathField.prototype.setMDistEnabled = function (enabled, pts) {
    this.mDistPts = this.cleanMSlopePts(pts || "AB") || "AB";
    if (this.mDistWrap) {
      this.mDistWrap.classList.toggle("hidden", !enabled);
      var lab = this.mDistWrap.querySelector(".mslope-icon small");
      if (lab) lab.textContent = this.mDistPts || "AB";
    }
  };

  MathField.prototype.insertMixed = function () {
    if (this.disabled) return;
    var part = this.parts[this.focusPart];
    if (part && part.type !== "text") return;
    var split = this.splitCurrentText();
    var whole = "";
    var grabbed = split.left.match(/(-?\d+)$/);
    if (grabbed) {
      whole = grabbed[1];
      split.left = split.left.slice(0, -whole.length);
    }
    this.insertWithSplit(split, { type: "mixed", whole: whole, num: "", den: "" });
    this.normalize();
    this.focusPath = [whole ? "num" : "whole"];
    this.render();
    this.focus();
  };

  MathField.prototype.moveSlot = function (dir, fromStart, fromEnd) {
    var slots = this.slots();
    var here = -1;
    var key = this.pathKey(this.focusPath);
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].index === this.focusPart && this.pathKey(slots[i].path) === key) {
        here = i;
        break;
      }
    }
    var next = here + dir;
    if (dir > 0 && !fromEnd) return false;
    if (dir < 0 && !fromStart) return false;
    if (next < 0 || next >= slots.length) return false;
    this.focusPart = slots[next].index;
    this.focusPath = slots[next].path.slice();
    var el = this.host.querySelector(
      'input[data-part="' + this.focusPart + '"][data-path="' + this.pathKey(this.focusPath) + '"]'
    );
    if (el) {
      el.focus();
      var pos = dir > 0 ? 0 : el.value.length;
      try {
        el.setSelectionRange(pos, pos);
      } catch (e) {}
    }
    return true;
  };

  MathField.prototype.unwrapNested = function () {
    var path = this.focusPath;
    if (path.length < 2) return false;
    var parentPath = path.slice(0, -1);
    var part = this.parts[this.focusPart];
    var nested = this.getAt(part, parentPath);
    if (!isFracNode(nested)) return false;
    this.setAt(part, parentPath, String(nested.num || ""));
    this.focusPath = parentPath;
    this.caretPos = String(nested.num || "").length;
    this.render();
    this.focus();
    return true;
  };

  MathField.prototype.onKey = function (event, partIndex, path) {
    if (this.disabled) {
      event.preventDefault();
      return;
    }
    this.focusPart = partIndex;
    this.focusPath = path.slice();
    var el = event.target;
    var part = this.parts[partIndex];
    var start = el.selectionStart;
    var end = el.selectionEnd;
    var atStart = start === 0 && end === 0;
    var atEnd = start === el.value.length && end === el.value.length;
    var last = path[path.length - 1];
    if (event.key === "ArrowRight") {
      if (this.moveSlot(1, false, atEnd)) event.preventDefault();
    } else if (event.key === "ArrowLeft") {
      if (this.moveSlot(-1, atStart, false)) event.preventDefault();
    } else if (event.key === "ArrowDown" && last === "num") {
      event.preventDefault();
      this.focusPath = path.slice(0, -1).concat("den");
      var den = this.host.querySelector(
        'input[data-part="' + partIndex + '"][data-path="' + this.pathKey(this.focusPath) + '"]'
      );
      if (den) {
        den.focus();
        try {
          den.setSelectionRange(0, 0);
        } catch (e) {}
      }
    } else if (event.key === "ArrowUp" && last === "den") {
      event.preventDefault();
      this.focusPath = path.slice(0, -1).concat("num");
      var num = this.host.querySelector(
        'input[data-part="' + partIndex + '"][data-path="' + this.pathKey(this.focusPath) + '"]'
      );
      if (num) {
        num.focus();
        try {
          num.setSelectionRange(num.value.length, num.value.length);
        } catch (e) {}
      }
    } else if (event.key === "/" || event.key === "÷") {
      event.preventDefault();
      this.insertFrac();
      return;
    } else if (event.key === "^") {
      event.preventDefault();
      this.insertPow();
      return;
    } else if (event.key === "Delete" && atEnd) {
      var nextPart = this.parts[partIndex + 1];
      if (part && part.type === "text" && nextPart && nextPart.type !== "text") {
        event.preventDefault();
        this.removePart(partIndex + 1);
      }
    } else if (event.key === "Backspace" && atStart) {
      if (path.length >= 2 && last === "num") {
        event.preventDefault();
        this.unwrapNested();
        return;
      }
      var prevPart = this.parts[partIndex - 1];
      if (part && part.type === "text" && prevPart && prevPart.type !== "text") {
        event.preventDefault();
        this.removePart(partIndex - 1);
        return;
      }
      if (part && part.type !== "text" && path.length === 1) {
        event.preventDefault();
        var slots = this.slots().filter(function (s) {
          return s.index === partIndex;
        });
        if (path[0] === slots[0].path[0] || !(el.value || "").trim()) {
          this.removePart(partIndex);
        } else {
          this.moveSlot(-1, true, false);
        }
      }
    }
  };

  MathField.prototype.readInputs = function () {
    var inputs = this.host.querySelectorAll("input[data-part]");
    var self = this;
    inputs.forEach(function (input) {
      var i = parseInt(input.getAttribute("data-part"), 10);
      var path = (input.getAttribute("data-path") || "value").split(".");
      if (self.parts[i]) self.setAt(self.parts[i], path, input.value);
    });
  };

  MathField.prototype.fitText = function (input, grow) {
    if (grow) {
      input.classList.add("is-grow");
      input.style.width = "";
      return;
    }
    input.classList.remove("is-grow");
    input.style.width = "1px";
    var w = input.scrollWidth + 6;
    input.style.width = Math.max(10, w) + "px";
  };

  MathField.prototype.fitSlot = function (input) {
    if (!input) return;
    input.style.width = "1px";
    var minW = input.classList.contains("ml-area-verts")
      ? input.maxLength >= 4
        ? 34
        : 22
      : input.classList.contains("ml-mslope-pts")
        ? 18
      : 28;
    var w = Math.max(minW, input.scrollWidth + 12);
    input.style.width = w + "px";
  };

  MathField.prototype.fitAllSlots = function () {
    var slots = this.host.querySelectorAll(".ml-slot, .ml-base, .ml-exp, .ml-whole, .ml-area-verts, .ml-mslope-pts");
    var i;
    for (i = 0; i < slots.length; i++) this.fitSlot(slots[i]);
    var fracs = this.host.querySelectorAll(".ml-frac");
    for (i = 0; i < fracs.length; i++) {
      var num = fracs[i].querySelector(":scope > .m-num.ml-slot");
      var den = fracs[i].querySelector(":scope > .m-den.ml-slot");
      if (!num || !den) continue;
      var wide = Math.max(num.offsetWidth, den.offsetWidth);
      num.style.width = wide + "px";
      den.style.width = wide + "px";
    }
  };

  MathField.prototype.sanitizeAreaVerts = function (raw, need) {
    return String(raw || "")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase()
      .slice(0, need || 4);
  };

  MathField.prototype.focusAfterAreaVerts = function (partIndex) {
    this.focusPart = partIndex;
    this.focusPath = ["verts"];
    if (this.moveSlot(1, false, true)) return;
    this.normalize();
    var next = Math.min(partIndex + 1, this.parts.length - 1);
    if (this.parts[next] && this.parts[next].type === "text") {
      this.focusPart = next;
    } else {
      this.focusPart = this.parts.length - 1;
    }
    this.focusPath = ["value"];
    this.caretPos = 0;
    this.render();
    this.focus();
  };

  MathField.prototype.maybeAdvanceAreaVerts = function (partIndex, path, el) {
    if (!path || path[0] !== "verts") return false;
    var part = this.parts[partIndex];
    if (!part || part.type !== "area") return false;
    var cleaned = this.sanitizeAreaVerts(el ? el.value : part.verts, this.areaVertsNeed(part));
    if (el && el.value !== cleaned) {
      el.value = cleaned;
      try {
        el.setSelectionRange(cleaned.length, cleaned.length);
      } catch (e) {}
    }
    this.setAt(part, ["verts"], cleaned);
    this.fitAllSlots();
    if (cleaned.length < this.areaVertsNeed(part)) return false;
    var self = this;
    setTimeout(function () {
      self.focusAfterAreaVerts(partIndex);
    }, 0);
    return true;
  };

  MathField.prototype.maybeAdvanceMSlopePts = function (partIndex, path, el) {
    if (!path || path[0] !== "pts") return false;
    var part = this.parts[partIndex];
    if (!part || (part.type !== "mslope" && part.type !== "mdist")) return false;
    var cleaned = this.cleanMSlopePts(el ? el.value : part.pts || "");
    if (el && el.value !== cleaned) {
      el.value = cleaned;
      try {
        el.setSelectionRange(cleaned.length, cleaned.length);
      } catch (e) {}
    }
    this.setAt(part, ["pts"], cleaned);
    this.fitAllSlots();
    if (cleaned.length < 2) return false;
    var self = this;
    setTimeout(function () {
      self.focusAfterAreaVerts(partIndex);
    }, 0);
    return true;
  };

  MathField.prototype.makeInput = function (partIndex, path, value, cls) {
    var self = this;
    var input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.className = cls || "ml-text";
    input.value = value || "";
    input.setAttribute("data-part", String(partIndex));
    input.setAttribute("data-path", this.pathKey(path));
    if (cls === "ml-area-verts") {
      var need = 3;
      var areaPart = this.parts[partIndex];
      if (areaPart && areaPart.type === "area" && areaPart.shape === "rect") need = 4;
      input.maxLength = need;
      input.setAttribute("inputmode", "text");
      input.setAttribute("autocapitalize", "characters");
    }
    if (cls === "ml-mslope-pts") {
      input.maxLength = 2;
      input.setAttribute("inputmode", "text");
      input.setAttribute("autocapitalize", "characters");
    }
    if (this.focusPart === partIndex && this.pathKey(this.focusPath) === this.pathKey(path)) {
      input.setAttribute("data-active", "1");
    }
    input.addEventListener("input", function () {
      if (self.parts[partIndex]) self.setAt(self.parts[partIndex], path, input.value);
      if (path[0] === "verts" && self.maybeAdvanceAreaVerts(partIndex, path, input)) {
        return;
      }
      if (path[0] === "pts" && self.maybeAdvanceMSlopePts(partIndex, path, input)) {
        return;
      }
      if (path.length === 1 && path[0] === "value") {
        self.fitText(input, input.classList.contains("is-grow"));
      } else {
        self.fitAllSlots();
      }
    });
    input.addEventListener("focus", function () {
      self.focusPart = partIndex;
      self.focusPath = path.slice();
    });
    input.addEventListener("keydown", function (event) {
      self.onKey(event, partIndex, path);
    });
    return input;
  };

  MathField.prototype.renderFracNode = function (node, partIndex, path) {
    var frac = document.createElement("span");
    frac.className = "m-frac ml-frac";
    frac.appendChild(this.renderFracSlot(node, "num", partIndex, path.concat("num")));
    frac.appendChild(this.renderFracSlot(node, "den", partIndex, path.concat("den")));
    return frac;
  };

  MathField.prototype.renderFracSlot = function (parentNode, field, partIndex, path) {
    var val = parentNode[field];
    if (isFracNode(val)) {
      var wrap = document.createElement("span");
      wrap.className = field === "num" ? "m-num" : "m-den";
      wrap.appendChild(this.renderFracNode(val, partIndex, path));
      return wrap;
    }
    var input = this.makeInput(
      partIndex,
      path,
      val,
      (field === "num" ? "m-num" : "m-den") + " ml-slot"
    );
    input.placeholder = "□";
    return input;
  };

  MathField.prototype.renderPowNode = function (node, partIndex, path) {
    var pow = document.createElement("span");
    pow.className = "ml-pow";
    pow.appendChild(this.makeInput(partIndex, path.concat("base"), node.base, "ml-base"));
    var exp = this.makeInput(partIndex, path.concat("exp"), node.exp, "ml-exp");
    exp.placeholder = "n";
    pow.appendChild(exp);
    return pow;
  };

  MathField.prototype.renderRadContent = function (rad, partIndex, path) {
    if (typeof rad === "string" || rad == null) {
      var asPow = tryParsePowText(rad);
      if (asPow) {
        var owner = this.parts[partIndex];
        if (owner && path.length === 1 && path[0] === "rad") owner.rad = asPow;
        return this.renderPowNode(asPow, partIndex, path);
      }
    }
    if (isPowNode(rad)) return this.renderPowNode(rad, partIndex, path);
    if (isFracNode(rad)) return this.renderFracNode(rad, partIndex, path);
    return this.makeInput(partIndex, path, rad, "ml-slot");
  };

  MathField.prototype.render = function () {
    this.host.innerHTML = "";
    this.host.setAttribute("dir", "ltr");
    var self = this;
    var run = document.createElement("span");
    run.className = "math-run";
    if (this.parts.length === 1) run.classList.add("is-grow");
    this.parts.forEach(function (part, index) {
      if (part.type === "text") {
        var grow = self.parts.length === 1;
        var textInput = self.makeInput(index, ["value"], part.value, "ml-text");
        if (grow) self.fitText(textInput, true);
        run.appendChild(textInput);
        return;
      }
      if (part.type === "sqrt") {
        var sqrt = document.createElement("span");
        sqrt.className = "ml-sqrt";
        var sign = document.createElement("span");
        sign.className = "ml-rad-sign";
        sign.textContent = "√";
        sqrt.appendChild(sign);
        var rad = document.createElement("span");
        rad.className = "ml-rad";
        rad.appendChild(self.renderRadContent(part.rad, index, ["rad"]));
        sqrt.appendChild(rad);
        run.appendChild(sqrt);
        return;
      }
      if (part.type === "nroot") {
        var nroot = document.createElement("span");
        nroot.className = "ml-sqrt ml-nroot";
        var idxEl = self.makeInput(index, ["index"], part.index, "ml-nroot-idx");
        idxEl.placeholder = "n";
        nroot.appendChild(idxEl);
        var nSign = document.createElement("span");
        nSign.className = "ml-rad-sign";
        nSign.textContent = "√";
        nroot.appendChild(nSign);
        var nRad = document.createElement("span");
        nRad.className = "ml-rad";
        nRad.appendChild(self.renderRadContent(part.rad, index, ["rad"]));
        nroot.appendChild(nRad);
        run.appendChild(nroot);
        return;
      }
      if (part.type === "pow") {
        run.appendChild(self.renderPowNode(part, index, []));
        return;
      }
      if (part.type === "area") {
        var area = document.createElement("span");
        area.className = "ml-area" + (part.shape === "rect" ? " is-rect" : "");
        var sLetter = document.createElement("span");
        sLetter.className = "ml-area-s";
        sLetter.textContent = part.shape === "perim" ? "P" : "S";
        area.appendChild(sLetter);
        var mark = document.createElement("span");
        mark.className = part.shape === "rect" ? "ml-area-rect" : "ml-area-tri";
        mark.setAttribute("aria-hidden", "true");
        mark.innerHTML =
          part.shape === "rect"
            ? '<svg viewBox="0 0 14 12" width="0.72em" height="0.58em" focusable="false"><rect x="1.4" y="1.6" width="11.2" height="8.8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
            : '<svg viewBox="0 0 14 12" width="0.7em" height="0.6em" focusable="false"><path d="M7 1.2 L12.8 10.8 H1.2 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
        area.appendChild(mark);
        var vertsInp = self.makeInput(index, ["verts"], part.verts, "ml-area-verts");
        vertsInp.placeholder = part.shape === "rect" ? "ABCD" : "…";
        vertsInp.setAttribute("aria-label", part.shape === "rect" ? "קודקודי המלבן" : "קודקודי המשולש");
        area.appendChild(vertsInp);
        run.appendChild(area);
        return;
      }
      if (part.type === "mslope" || part.type === "mdist") {
        var msl = document.createElement("span");
        msl.className = "ml-mslope";
        var mLet = document.createElement("span");
        mLet.className = "ml-mslope-m";
        mLet.textContent = part.type === "mdist" ? "d" : "m";
        msl.appendChild(mLet);
        var ptsInp = self.makeInput(index, ["pts"], part.pts, "ml-mslope-pts");
        ptsInp.placeholder = part.type === "mdist" ? this.mDistPts || "AB" : this.mSlopePts || "AB";
        ptsInp.setAttribute(
          "aria-label",
          part.type === "mdist" ? "שתי נקודות למרחק" : "שם הישר או שתי נקודות לשיפוע"
        );
        msl.appendChild(ptsInp);
        run.appendChild(msl);
        return;
      }
      if (part.type === "mixed") {
        var whole = self.makeInput(index, ["whole"], part.whole, "ml-whole");
        whole.placeholder = "□";
        run.appendChild(whole);
      }
      run.appendChild(self.renderFracNode(part, index, []));
    });
    this.host.appendChild(run);
    if (this.parts.length !== 1) {
      var texts = run.querySelectorAll(".ml-text");
      for (var t = 0; t < texts.length; t++) self.fitText(texts[t], false);
    }
    this.fitAllSlots();
    this.setDisabled(this.disabled);
  };

  MathField.prototype.buildActions = function () {
    var self = this;
    this.actionsHost.innerHTML = "";
    [
      {
        label: "שבר",
        icon: '<span class="frac-icon" aria-hidden="true"><i></i><i></i></span>',
        run: function () {
          self.insertFrac();
        },
      },
      {
        label: "שורש",
        icon: '<span class="sqrt-icon" aria-hidden="true">√</span>',
        run: function () {
          self.insertSqrt();
        },
      },
      {
        label: "שורש n",
        icon: '<span class="nroot-icon" aria-hidden="true"><sup>n</sup>√</span>',
        run: function () {
          self.insertNroot();
        },
      },
      {
        label: "±",
        icon: '<span class="pm-icon" aria-hidden="true">±</span>',
        run: function () {
          self.insertChars("±");
        },
      },
      {
        label: "שונה",
        icon: '<span class="neq-icon" aria-hidden="true">≠</span>',
        run: function () {
          self.insertChars("≠");
        },
      },
      {
        label: "חזקה",
        icon: '<span class="pow-icon" aria-hidden="true">x<sup>n</sup></span>',
        run: function () {
          self.insertPow();
        },
      },
      {
        label: "שבר מעורב",
        icon: '<span class="mixed-icon" aria-hidden="true"><b></b><span class="frac-icon"><i></i><i></i></span></span>',
        run: function () {
          self.insertMixed();
        },
      },
    ].forEach(function (spec) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ghost math-action";
      btn.innerHTML = spec.icon + "<span>" + spec.label + "</span>";
      btn.addEventListener("mousedown", function (event) {
        event.preventDefault();
      });
      btn.addEventListener("click", spec.run);
      self.actionsHost.appendChild(btn);
    });
    this.buildMSlopeButton();
    this.buildMDistButton();
    this.buildAreaMenu();
  };

  MathField.prototype.buildMSlopeButton = function () {
    var self = this;
    var wrap = document.createElement("div");
    wrap.className = "mslope-action-wrap hidden";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ghost math-action";
    btn.innerHTML =
      '<span class="mslope-icon" aria-hidden="true"><b>m</b><small>AB</small></span><span>שיפוע</span>';
    btn.addEventListener("mousedown", function (event) {
      event.preventDefault();
    });
    btn.addEventListener("click", function () {
      self.insertMSlope(self.mSlopePts);
    });
    wrap.appendChild(btn);
    this.actionsHost.appendChild(wrap);
    this.mSlopeWrap = wrap;
  };

  MathField.prototype.buildMDistButton = function () {
    var self = this;
    var wrap = document.createElement("div");
    wrap.className = "mslope-action-wrap hidden";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ghost math-action";
    btn.innerHTML =
      '<span class="mslope-icon" aria-hidden="true"><b>d</b><small>AB</small></span><span>מרחק</span>';
    btn.addEventListener("mousedown", function (event) {
      event.preventDefault();
    });
    btn.addEventListener("click", function () {
      self.insertMDist(self.mDistPts);
    });
    wrap.appendChild(btn);
    this.actionsHost.appendChild(wrap);
    this.mDistWrap = wrap;
  };

  MathField.prototype.closeAreaMenu = function () {
    if (!this.areaMenu) return;
    this.areaMenu.classList.add("hidden");
  };

  MathField.prototype.buildAreaMenu = function () {
    var self = this;
    var wrap = document.createElement("div");
    wrap.className = "area-menu-wrap";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ghost math-action";
    btn.setAttribute("aria-haspopup", "true");
      btn.innerHTML =
      '<span class="area-icon" aria-hidden="true"><b>S</b></span><span>שטחים והיקפים</span>';
    var menu = document.createElement("div");
    menu.className = "area-shape-menu hidden";
    menu.setAttribute("role", "menu");
    var items = [
      {
        shape: "triangle",
        label: "משולש",
        html:
          '<span class="area-icon"><b>S</b><svg viewBox="0 0 14 12" width="14" height="12" focusable="false"><path d="M7 1.2 L12.8 10.8 H1.2 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></span><span>משולש</span><small>3 קודקודים</small>',
      },
      {
        shape: "rect",
        label: "מלבן",
        html:
          '<span class="area-icon"><b>S</b><svg viewBox="0 0 14 12" width="14" height="12" focusable="false"><rect x="1.4" y="1.6" width="11.2" height="8.8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></span><span>מלבן</span><small>4 קודקודים</small>',
      },
      {
        shape: "perim",
        label: "היקף",
        html:
          '<span class="area-icon"><b>P</b><svg viewBox="0 0 14 12" width="14" height="12" focusable="false"><path d="M7 1.2 L12.8 10.8 H1.2 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></span><span>היקף</span><small>סכום צלעות</small>',
      },
    ];
    items.forEach(function (item) {
      var opt = document.createElement("button");
      opt.type = "button";
      opt.className = "area-shape-opt";
      opt.setAttribute("role", "menuitem");
      opt.innerHTML = item.html;
      opt.addEventListener("mousedown", function (event) {
        event.preventDefault();
      });
      opt.addEventListener("click", function () {
        self.closeAreaMenu();
        self.insertArea(item.shape);
      });
      menu.appendChild(opt);
    });
    btn.addEventListener("mousedown", function (event) {
      event.preventDefault();
    });
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      menu.classList.toggle("hidden");
    });
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    this.actionsHost.appendChild(wrap);
    this.areaMenu = menu;
    if (!MathField._areaMenuDocBound) {
      MathField._areaMenuDocBound = true;
      document.addEventListener("click", function () {
        var menus = document.querySelectorAll(".area-shape-menu");
        for (var i = 0; i < menus.length; i++) menus[i].classList.add("hidden");
      });
    }
  };

  global.DoctematicaMathField = MathField;
})(window);
