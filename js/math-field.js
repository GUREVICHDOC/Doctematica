(function (global) {
  function isFracNode(v) {
    return v && typeof v === "object" && v.type === "frac";
  }

  function isSqrtNode(v) {
    return v && typeof v === "object" && v.type === "sqrt";
  }

  function grabFracNumerator(left) {
    var s = String(left || "");
    var alg = s.match(/((?:\d+(?:\.\d+)?)?[xy](?:\^2)?)$/i);
    var grabbed = alg || s.match(/(-?\d+(?:\.\d+)?)$/);
    if (!grabbed) return { left: s, num: "" };
    var num = grabbed[1];
    var rest = s.slice(0, -num.length);
    if (alg && /[-−]$/.test(rest)) {
      var before = rest.slice(0, -1);
      if (!before || /[+\-−×*\/(=]$/.test(before)) {
        num = rest.slice(-1) + num;
        rest = before;
      }
    }
    return { left: rest, num: num };
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
      if (isFracNode(node.rad)) this.collectSlots(node.rad, path.concat("rad"), out);
      else out.push({ path: path.concat("rad") });
      return;
    }
    if (node.type === "pow") {
      out.push({ path: path.concat("base") });
      out.push({ path: path.concat("exp") });
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

  MathField.prototype.serializeSlot = function (val) {
    if (isFracNode(val)) {
      var n = this.serializeSlot(val.num);
      var d = this.serializeSlot(val.den);
      if (/^-?\d+$/.test(n) && /^-?\d+$/.test(d) && d !== "0" && d !== "-0") return n + "/" + d;
      return "(" + n + ")/(" + d + ")";
    }
    return String(val || "").trim();
  };

  MathField.prototype.serializePart = function (part) {
    if (part.type === "text") return part.value || "";
    if (part.type === "sqrt") return "√(" + this.serializeSlot(part.rad) + ")";
    if (part.type === "pow") {
      var b = this.serializeSlot(part.base);
      var e = this.serializeSlot(part.exp);
      if (/^[xy]$/i.test(b) && e === "2") return b + "^2";
      if (/^[xy]$/i.test(b)) return b + "^" + e;
      return "(" + b + ")^" + e;
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
    return this.parts
      .map(function (part) {
        return self.serializePart(part);
      })
      .join("")
      .replace(/\s+/g, " ")
      .trim();
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
    if (el.classList.contains("ml-text")) {
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
      this.insertChars("^");
      return;
    }
    var split = this.splitCurrentText();
    var base = "x";
    var grabbed = split.left.match(/([A-Za-z]|\)|\d+(?:\.\d+)?)$/);
    if (grabbed) {
      base = grabbed[1];
      split.left = split.left.slice(0, -base.length);
    }
    this.insertWithSplit(split, { type: "pow", base: base, exp: "2" });
    this.normalize();
    this.focusPath = ["exp"];
    this.render();
    this.focus();
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
    var w = Math.max(28, input.scrollWidth + 12);
    input.style.width = w + "px";
  };

  MathField.prototype.fitAllSlots = function () {
    var slots = this.host.querySelectorAll(".ml-slot, .ml-base, .ml-exp, .ml-whole");
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
    if (this.focusPart === partIndex && this.pathKey(this.focusPath) === this.pathKey(path)) {
      input.setAttribute("data-active", "1");
    }
    input.addEventListener("input", function () {
      if (self.parts[partIndex]) self.setAt(self.parts[partIndex], path, input.value);
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
        if (isFracNode(part.rad)) {
          rad.appendChild(self.renderFracNode(part.rad, index, ["rad"]));
        } else {
          rad.appendChild(self.makeInput(index, ["rad"], part.rad, "ml-slot"));
        }
        sqrt.appendChild(rad);
        run.appendChild(sqrt);
        return;
      }
      if (part.type === "pow") {
        var pow = document.createElement("span");
        pow.className = "ml-pow";
        pow.appendChild(self.makeInput(index, ["base"], part.base, "ml-base"));
        var exp = self.makeInput(index, ["exp"], part.exp, "ml-exp");
        exp.placeholder = "n";
        pow.appendChild(exp);
        run.appendChild(pow);
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
        label: "±",
        icon: '<span class="pm-icon" aria-hidden="true">±</span>',
        run: function () {
          self.insertChars("±");
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
  };

  global.DoctematicaMathField = MathField;
})(window);
