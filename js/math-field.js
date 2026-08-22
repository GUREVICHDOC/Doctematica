(function (global) {
  function MathField(host, actionsHost) {
    this.host = host;
    this.actionsHost = actionsHost;
    this.parts = [{ type: "text", value: "" }];
    this.focusPart = 0;
    this.focusField = "value";
    this.disabled = false;
    this.buildActions();
    this.render();
  }

  MathField.prototype.fieldsOf = function (part) {
    if (part.type === "frac") return ["num", "den"];
    if (part.type === "mixed") return ["whole", "num", "den"];
    return ["value"];
  };

  MathField.prototype.slots = function () {
    var out = [];
    for (var i = 0; i < this.parts.length; i++) {
      var fields = this.fieldsOf(this.parts[i]);
      for (var f = 0; f < fields.length; f++) {
        out.push({ index: i, field: fields[f] });
      }
    }
    return out;
  };

  MathField.prototype.serializePart = function (part) {
    if (part.type === "text") return part.value || "";
    if (part.type === "frac") {
      var n = String(part.num || "").trim();
      var d = String(part.den || "").trim();
      if (/^-?\d+$/.test(n) && /^-?\d+$/.test(d) && d !== "0" && d !== "-0") return n + "/" + d;
      return "(" + n + ")/(" + d + ")";
    }
    var w = String(part.whole || "").trim();
    var n2 = String(part.num || "").trim();
    var d2 = String(part.den || "").trim();
    return (w ? w + " " : "") + n2 + "/" + d2;
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
    this.focusField = "value";
    this.setDisabled(false);
    this.render();
  };

  MathField.prototype.focus = function () {
    this.host.focus();
    var el = this.host.querySelector("[data-active='1']");
    if (el) {
      el.focus();
      var end = el.value.length;
      try {
        el.setSelectionRange(end, end);
      } catch (e) {}
    }
  };

  MathField.prototype.splitCurrentText = function () {
    var part = this.parts[this.focusPart];
    var el = this.host.querySelector(
      'input[data-part="' + this.focusPart + '"][data-field="' + this.focusField + '"]'
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

  MathField.prototype.insertFrac = function () {
    if (this.disabled) return;
    var split = this.splitCurrentText();
    var num = "";
    var grabbed = split.left.match(/(-?\d+)$/);
    if (grabbed) {
      num = grabbed[1];
      split.left = split.left.slice(0, -num.length);
    }
    this.insertWithSplit(split, { type: "frac", num: num, den: "" });
    this.focusField = num ? "den" : "num";
    this.render();
    this.focus();
  };

  MathField.prototype.insertMixed = function () {
    if (this.disabled) return;
    var split = this.splitCurrentText();
    var whole = "";
    var grabbed = split.left.match(/(-?\d+)$/);
    if (grabbed) {
      whole = grabbed[1];
      split.left = split.left.slice(0, -whole.length);
    }
    this.insertWithSplit(split, { type: "mixed", whole: whole, num: "", den: "" });
    this.focusField = whole ? "num" : "whole";
    this.render();
    this.focus();
  };

  MathField.prototype.moveSlot = function (dir, fromStart, fromEnd) {
    var slots = this.slots();
    var here = -1;
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].index === this.focusPart && slots[i].field === this.focusField) {
        here = i;
        break;
      }
    }
    var next = here + dir;
    if (dir > 0 && !fromEnd) return false;
    if (dir < 0 && !fromStart) return false;
    if (next < 0 || next >= slots.length) return false;
    this.focusPart = slots[next].index;
    this.focusField = slots[next].field;
    var el = this.host.querySelector(
      'input[data-part="' + this.focusPart + '"][data-field="' + this.focusField + '"]'
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

  MathField.prototype.onKey = function (event, partIndex, field) {
    if (this.disabled) {
      event.preventDefault();
      return;
    }
    this.focusPart = partIndex;
    this.focusField = field;
    var el = event.target;
    var start = el.selectionStart;
    var end = el.selectionEnd;
    var atStart = start === 0 && end === 0;
    var atEnd = start === el.value.length && end === el.value.length;
    if (event.key === "ArrowRight") {
      if (this.moveSlot(1, false, atEnd)) event.preventDefault();
    } else if (event.key === "ArrowLeft") {
      if (this.moveSlot(-1, atStart, false)) event.preventDefault();
    } else if (event.key === "ArrowDown" && field === "num") {
      event.preventDefault();
      this.focusField = "den";
      var den = this.host.querySelector('input[data-part="' + partIndex + '"][data-field="den"]');
      if (den) {
        den.focus();
        try {
          den.setSelectionRange(0, 0);
        } catch (e) {}
      }
    } else if (event.key === "ArrowUp" && field === "den") {
      event.preventDefault();
      this.focusField = "num";
      var num = this.host.querySelector('input[data-part="' + partIndex + '"][data-field="num"]');
      if (num) {
        num.focus();
        try {
          num.setSelectionRange(num.value.length, num.value.length);
        } catch (e) {}
      }
    } else if (event.key === "Backspace" && atStart) {
      var part = this.parts[partIndex];
      if (part.type !== "text") {
        event.preventDefault();
        var fields = this.fieldsOf(part);
        if (field === fields[0]) {
          this.parts.splice(partIndex, 1, { type: "text", value: this.serializePart(part) });
          this.focusPart = partIndex;
          this.focusField = "value";
          this.render();
          this.focus();
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
      var field = input.getAttribute("data-field");
      if (self.parts[i]) self.parts[i][field] = input.value;
    });
  };

  MathField.prototype.fitText = function (input, grow) {
    if (grow) {
      input.classList.add("is-grow");
      input.style.width = "";
      return;
    }
    input.classList.remove("is-grow");
    var len = (input.value || "").length;
    input.style.width = (len === 0 ? 0.35 : len + 0.15) + "ch";
  };

  MathField.prototype.makeInput = function (partIndex, field, value, cls) {
    var self = this;
    var input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.className = cls || "ml-text";
    input.value = value || "";
    input.setAttribute("data-part", String(partIndex));
    input.setAttribute("data-field", field);
    if (this.focusPart === partIndex && this.focusField === field) {
      input.setAttribute("data-active", "1");
    }
    input.addEventListener("input", function () {
      self.parts[partIndex][field] = input.value;
      if (field === "value") {
        var grow = input.classList.contains("is-grow");
        self.fitText(input, grow);
      }
    });
    input.addEventListener("focus", function () {
      self.focusPart = partIndex;
      self.focusField = field;
    });
    input.addEventListener("keydown", function (event) {
      self.onKey(event, partIndex, field);
    });
    return input;
  };

  MathField.prototype.render = function () {
    this.host.innerHTML = "";
    this.host.setAttribute("dir", "ltr");
    var self = this;
    this.parts.forEach(function (part, index) {
      if (part.type === "text") {
        var lastText = -1;
        for (var t = self.parts.length - 1; t >= 0; t--) {
          if (self.parts[t].type === "text") {
            lastText = t;
            break;
          }
        }
        var grow = index === lastText;
        var textInput = self.makeInput(index, "value", part.value, "ml-text");
        self.fitText(textInput, grow);
        self.host.appendChild(textInput);
        return;
      }
      if (part.type === "mixed") {
        var whole = self.makeInput(index, "whole", part.whole, "ml-whole");
        whole.placeholder = "□";
        self.host.appendChild(whole);
      }
      var frac = document.createElement("span");
      frac.className = "m-frac ml-frac";
      var num = self.makeInput(index, "num", part.num, "m-num ml-slot");
      var den = self.makeInput(index, "den", part.den, "m-den ml-slot");
      num.placeholder = "□";
      den.placeholder = "□";
      frac.appendChild(num);
      frac.appendChild(den);
      self.host.appendChild(frac);
    });
    this.setDisabled(this.disabled);
  };

  MathField.prototype.buildActions = function () {
    var self = this;
    this.actionsHost.innerHTML = "";
    [
      {
        label: "שבר",
        icon: '<span class="frac-icon" aria-hidden="true"><i></i><i></i></span>',
        run: function () { self.insertFrac(); },
      },
      {
        label: "שבר מעורב",
        icon: '<span class="mixed-icon" aria-hidden="true"><b></b><span class="frac-icon"><i></i><i></i></span></span>',
        run: function () { self.insertMixed(); },
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
