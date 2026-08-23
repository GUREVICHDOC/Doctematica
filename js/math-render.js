(function (global) {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function fracWrap(numHtml, denHtml) {
    return (
      '<span class="m-frac"><span class="m-num">' +
      numHtml +
      '</span><span class="m-den">' +
      denHtml +
      "</span></span>"
    );
  }

  function fracHTML(num, den) {
    return fracWrap(
      escapeHtml(String(num).replace(/-/g, "−")),
      escapeHtml(String(den).replace(/-/g, "−"))
    );
  }

  function unwrapParens(s) {
    var t = String(s).trim();
    if (t.charAt(0) === "(" && t.charAt(t.length - 1) === ")") {
      var inner = t.slice(1, -1);
      var depth = 0;
      var ok = true;
      for (var i = 0; i < inner.length; i++) {
        if (inner.charAt(i) === "(") depth += 1;
        if (inner.charAt(i) === ")") depth -= 1;
        if (depth < 0) ok = false;
      }
      if (ok && depth === 0) return inner;
    }
    return t;
  }

  function mixedHTML(w, n, d) {
    return (
      '<span class="m-mixed">' +
      escapeHtml(w) +
      fracHTML(n, d) +
      "</span>"
    );
  }

  function neighborChar(s, i, dir) {
    var j = i + dir;
    while (j >= 0 && j < s.length && s.charAt(j) === " ") j += dir;
    if (j < 0 || j >= s.length) return "";
    return s.charAt(j);
  }

  function isNumChar(c) {
    return (c >= "0" && c <= "9") || c === ".";
  }

  function hideTimesSign(left, right) {
    if (right === "x" || right === "X" || right === "y" || right === "Y" || right === "(") return true;
    if (
      left === ")" &&
      (right === "x" || right === "X" || right === "y" || right === "Y" || right === "(" || isNumChar(right))
    ) {
      return true;
    }
    return false;
  }

  function sideToHTML(side) {
    var s = String(side);
    var out = "";
    var i = 0;
    while (i < s.length) {
      var mixed = s.slice(i).match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)/);
      if (mixed) {
        out += mixedHTML(mixed[1], mixed[2], mixed[3]);
        i += mixed[0].length;
        continue;
      }
      var sqrtm = s.slice(i).match(/^√\(([^()]*)\)/) || s.slice(i).match(/^√(\d+(?:\.\d+)?)/);
      if (sqrtm) {
        out +=
          '<span class="m-sqrt"><span class="m-rad-sign">√</span><span class="m-rad">' +
          sideToHTML(sqrtm[1]) +
          "</span></span>";
        i += sqrtm[0].length;
        continue;
      }
      var algFrac = s.slice(i).match(/^([−-]?(\d+\([^()]+\)|\([^()]+\)|\d*[xy]|\d+))\s*\/\s*(\([^()]+\)|[−-]?\d+)(?![.\dxy])/i);
      if (algFrac && algFrac[0].indexOf("/") !== -1) {
        out += fracWrap(sideToHTML(unwrapParens(algFrac[1])), sideToHTML(unwrapParens(algFrac[3])));
        i += algFrac[0].length;
        continue;
      }
      var pow = s.slice(i).match(/^((?:\(-?\d+\))|(?:-?\d+)|[xy])(\^2|²)/i);
      if (pow) {
        var base = pow[1];
        var baseHtml;
        if (/^[xy]$/i.test(base)) {
          baseHtml = '<span class="m-x">' + escapeHtml(base) + "</span>";
        } else {
          baseHtml = sideToHTML(base);
        }
        out += '<span class="m-pow">' + baseHtml + '<sup class="m-sup">2</sup></span>';
        i += pow[0].length;
        continue;
      }
      var wrappedFrac = s.slice(i).match(/^\((-?\d+)\)\s*\/\s*\((-?\d+)\)/);
      if (wrappedFrac) {
        out += fracHTML(wrappedFrac[1], wrappedFrac[2]);
        i += wrappedFrac[0].length;
        continue;
      }
      var parFrac = s.slice(i).match(/^\((-?\d+)\s*\/\s*(-?\d+)\)/);
      if (parFrac) {
        out += fracHTML(parFrac[1], parFrac[2]);
        i += parFrac[0].length;
        continue;
      }
      var signedFrac = s.slice(i).match(/^-(\()(\d+)\/(\d+)(\))/);
      if (signedFrac) {
        out += '<span class="m-neg">−</span>' + fracHTML(signedFrac[2], signedFrac[3]);
        i += signedFrac[0].length;
        continue;
      }
      var bareFrac = s.slice(i).match(/^(\d+)\s*\/\s*(-?\d+)/);
      if (bareFrac) {
        out += fracHTML(bareFrac[1], bareFrac[2]);
        i += bareFrac[0].length;
        continue;
      }
      var ch = s.charAt(i);
      if (ch === "*" || ch === "×" || ch === "·") {
        if (!hideTimesSign(neighborChar(s, i, -1), neighborChar(s, i, 1))) {
          out += '<span class="m-op">×</span>';
        }
        i += 1;
        continue;
      }
      if (ch === "-") {
        out += '<span class="m-op">−</span>';
        i += 1;
        continue;
      }
      if (ch === "+") {
        out += '<span class="m-op">+</span>';
        i += 1;
        continue;
      }
      if (ch === "=") {
        out += '<span class="m-eq">=</span>';
        i += 1;
        continue;
      }
      if (ch === "^" && s.charAt(i + 1) === "2") {
        out += '<sup class="m-sup">2</sup>';
        i += 2;
        continue;
      }
      if (ch === "x" || ch === "X") {
        out += '<span class="m-x">x</span>';
        i += 1;
        continue;
      }
      if (ch === "y" || ch === "Y") {
        out += '<span class="m-x">y</span>';
        i += 1;
        continue;
      }
      out += escapeHtml(ch);
      i += 1;
    }
    return out;
  }

  function toHTML(text) {
    var src = String(text || "").trim();
    if (!src) return "";
    var parts = src.split("=");
    if (parts.length === 1) return '<span class="m-expr" dir="ltr">' + sideToHTML(src) + "</span>";
    return (
      '<span class="m-expr" dir="ltr">' +
      parts
        .map(function (p) {
          return sideToHTML(p);
        })
        .join('<span class="m-eq">=</span>') +
      "</span>"
    );
  }

  function systemHTML(eq1, eq2) {
    return (
      '<span class="sys" dir="ltr">' +
      '<span class="sys-brace">{</span>' +
      '<span class="sys-eqs">' +
      toHTML(eq1) +
      toHTML(eq2) +
      "</span></span>"
    );
  }

  global.DoctematicaMath = {
    toHTML: toHTML,
    systemHTML: systemHTML,
    fracHTML: fracHTML,
  };
})(window);
