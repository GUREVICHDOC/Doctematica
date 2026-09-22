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
    if (right === "x" || right === "X" || right === "y" || right === "Y") return true;
    if (left === ")" && (right === "x" || right === "X" || right === "y" || right === "Y")) return true;
    return false;
  }

  function emitTimesAfterFracIfNeeded(out, s, i) {
    var ch = s.charAt(i);
    if (isNumChar(ch) || ch === "(") {
      out += '<span class="m-op">·</span>';
    }
  }

  /** Match algebraic numerator / denominator as one stacked fraction. */
  function matchBalancedParen(s, start) {
    if (s.charAt(start) !== "(") return null;
    var depth = 0;
    var i;
    for (i = start; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth === 0) return s.slice(start, i + 1);
      }
    }
    return null;
  }

  function matchSlashDen(s, from) {
    var m = s.slice(from).match(/^\s*\/\s*/);
    if (!m) return null;
    var p = from + m[0].length;
    var start = p;
    if (s.charAt(p) === "+" || s.charAt(p) === "-" || s.charAt(p) === "−") p += 1;
    while (p < s.length && isNumChar(s.charAt(p))) p += 1;
    // 8/3x and 2/3(x+6) are (8/3)·x and (2/3)(x+6) — not a longer denominator.
    if (p > start && (/^[xy]/i.test(s.charAt(p)) || s.charAt(p) === "(")) {
      var numDen = s.slice(start, p);
      if (numDen && /^[+\-−]?\d+(?:\.\d+)?$/.test(numDen.replace(/−/g, "-"))) {
        return { consumed: p - from, den: numDen };
      }
    }
    if (s.charAt(p) === "(") {
      while (s.charAt(p) === "(") {
        var par = matchBalancedParen(s, p);
        if (!par) return null;
        p += par.length;
      }
    } else if (/^[xy]/i.test(s.charAt(p))) {
      p += 1;
      if (s.slice(p, p + 2) === "^2" || s.charAt(p) === "²") {
        p += s.charAt(p) === "²" ? 1 : 2;
      }
    } else if (p === start || (p === start + 1 && /[+\-−]/.test(s.charAt(start)) && !isNumChar(s.charAt(start + 1)))) {
      return null;
    }
    var den = s.slice(start, p);
    if (!den) return null;
    if (/[.\dxy]/i.test(s.charAt(p))) return null;
    return { consumed: p - from, den: den };
  }

  function matchAlgFrac(s, i) {
    var j = i;
    while (j < s.length && isNumChar(s.charAt(j))) j += 1;
    var numEnd = -1;

    if (s.charAt(j) === "(") {
      var p1 = matchBalancedParen(s, j);
      if (!p1) return null;
      var k = j + p1.length;
      if (s.charAt(k) === "(") {
        var p2 = matchBalancedParen(s, k);
        if (!p2) return null;
        numEnd = k + p2.length;
      } else if (s.slice(k, k + 2) === "^2" || s.charAt(k) === "²") {
        numEnd = k + (s.charAt(k) === "²" ? 1 : 2);
      } else {
        numEnd = k;
      }
    } else if (/^[xy]/i.test(s.charAt(j))) {
      var letterEnd = j + 1;
      if (s.slice(letterEnd, letterEnd + 2) === "^2" || s.charAt(letterEnd) === "²") {
        letterEnd += s.charAt(letterEnd) === "²" ? 1 : 2;
      }
      numEnd = letterEnd;
    } else if (j > i) {
      numEnd = j;
    } else {
      return null;
    }

    var slashDen = matchSlashDen(s, numEnd);
    if (!slashDen) return null;
    var full = s.slice(i, numEnd + slashDen.consumed);
    return [full, s.slice(i, numEnd), slashDen.den];
  }

  function sideToHTML(side) {
    var s = String(side);
    var out = "";
    var i = 0;
    while (i < s.length) {
      // S△AOB — S גדול, משולש וקודקודים קטנים
      var areaLab = s.slice(i).match(/^[SP](?:△|Δ)([A-Za-z]{2,6})/);
      if (areaLab) {
        out +=
          '<span class="m-area">' +
          '<span class="m-area-s">' +
          escapeHtml(areaLab[0].charAt(0)) +
          "</span>" +
          '<span class="m-area-tri" aria-hidden="true">△</span>' +
          '<span class="m-area-verts">' +
          escapeHtml(areaLab[1]) +
          "</span></span>";
        i += areaLab[0].length;
        if (s.charAt(i) === ":") {
          out += '<span class="m-eq">=</span>';
          i += 1;
          while (s.charAt(i) === " ") i += 1;
        }
        continue;
      }
      var mSlopeLab = s.slice(i).match(/^m_?((?:III|II|I)|[A-Za-z]{2,4}|\d+|[₀₁₂₃₄₅₆₇₈₉]+)(?![A-Za-z])/);
      if (mSlopeLab) {
        out +=
          '<span class="m-slope">' +
          '<span class="m-slope-m">m</span>' +
          '<span class="m-slope-pts">' +
          escapeHtml(mSlopeLab[1]) +
          "</span></span>";
        i += mSlopeLab[0].length;
        continue;
      }
      var dDistLab = s.slice(i).match(/^d_?((?:[A-Za-z]{2,4}|\d+))(?![A-Za-z])/);
      if (dDistLab) {
        out +=
          '<span class="m-slope">' +
          '<span class="m-slope-m">d</span>' +
          '<span class="m-slope-pts">' +
          escapeHtml(dDistLab[1]) +
          "</span></span>";
        i += dDistLab[0].length;
        continue;
      }
      if (dDistLab) {
        out +=
          '<span class="m-slope">' +
          '<span class="m-slope-m">d</span>' +
          '<span class="m-slope-pts">' +
          escapeHtml(dDistLab[1]) +
          "</span></span>";
        i += dDistLab[0].length;
        continue;
      }
      var mixed = s.slice(i).match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)/);
      if (mixed) {
        out += mixedHTML(mixed[1], mixed[2], mixed[3]);
        i += mixed[0].length;
        continue;
      }
      var mixedHalf = s.slice(i).match(/^(-?\d+)½/);
      if (mixedHalf) {
        out += mixedHTML(mixedHalf[1], "1", "2");
        i += mixedHalf[0].length;
        continue;
      }
      if (s.charAt(i) === "½") {
        out += fracHTML("1", "2");
        i += 1;
        continue;
      }
      var nrootm =
        s.slice(i).match(/^√\[(\d+)\]\(([^()]*)\)/) ||
        s.slice(i).match(/^∛\(([^()]*)\)/) ||
        s.slice(i).match(/^∜\(([^()]*)\)/);
      if (nrootm) {
        var nIdx = nrootm[2] != null ? nrootm[1] : s.charAt(i) === "∜" ? "4" : "3";
        var nRad = nrootm[2] != null ? nrootm[2] : nrootm[1];
        out +=
          '<span class="m-sqrt m-nroot"><sup class="m-nroot-idx">' +
          escapeHtml(nIdx) +
          '</sup><span class="m-rad-sign">√</span><span class="m-rad">' +
          sideToHTML(nRad) +
          "</span></span>";
        i += nrootm[0].length;
        continue;
      }
      if (s.charAt(i) === "√" && s.charAt(i + 1) === "(") {
        var radBal = matchBalancedParen(s, i + 1);
        if (radBal) {
          out +=
            '<span class="m-sqrt"><span class="m-rad-sign">√</span><span class="m-rad">' +
            sideToHTML(unwrapParens(radBal)) +
            "</span></span>";
          i += 1 + radBal.length;
          continue;
        }
      }
      var sqrtm = s.slice(i).match(/^√(\d+(?:\.\d+)?)/);
      if (sqrtm) {
        out +=
          '<span class="m-sqrt"><span class="m-rad-sign">√</span><span class="m-rad">' +
          sideToHTML(sqrtm[1]) +
          "</span></span>";
        i += sqrtm[0].length;
        continue;
      }
      var algFrac = matchAlgFrac(s, i);
      if (algFrac) {
        out += fracWrap(sideToHTML(unwrapParens(algFrac[1])), sideToHTML(unwrapParens(algFrac[2])));
        i += algFrac[0].length;
        continue;
      }
      var pow = s.slice(i).match(/^((?:\(-?\d+\))|(?:-?\d+)|[xy])(\^[2-6]|²|³|⁴|⁵|⁶)/i);
      if (pow) {
        var base = pow[1];
        var expTok = pow[2];
        var exp =
          expTok === "^6" || expTok === "⁶"
            ? "6"
            : expTok === "^5" || expTok === "⁵"
              ? "5"
              : expTok === "^4" || expTok === "⁴"
                ? "4"
                : expTok === "^3" || expTok === "³"
                  ? "3"
                  : "2";
        var baseHtml;
        if (/^[xy]$/i.test(base)) {
          baseHtml = '<span class="m-x">' + escapeHtml(base) + "</span>";
        } else {
          baseHtml = sideToHTML(base);
        }
        out += '<span class="m-pow">' + baseHtml + '<sup class="m-sup">' + exp + "</sup></span>";
        i += pow[0].length;
        continue;
      }
      var parenPow = s.slice(i).match(/^(\([^()]+\))(\^[2-6]|²|³|⁴|⁵|⁶)/);
      if (parenPow) {
        var pTok = parenPow[2];
        var pExp =
          pTok === "^6" || pTok === "⁶"
            ? "6"
            : pTok === "^5" || pTok === "⁵"
              ? "5"
              : pTok === "^4" || pTok === "⁴"
                ? "4"
                : pTok === "^3" || pTok === "³"
                  ? "3"
                  : "2";
        out +=
          '<span class="m-pow">' +
          sideToHTML(parenPow[1]) +
          '<sup class="m-sup">' +
          pExp +
          "</sup></span>";
        i += parenPow[0].length;
        continue;
      }
      // Balanced paren power: (…)^2 / (…)^3 when inner has nested parens
      if (s.charAt(i) === "(") {
        var bal = matchBalancedParen(s, i);
        if (bal) {
          var afterBal = i + bal.length;
          var balExp = null;
          var balPowLen = 0;
          if (s.slice(afterBal, afterBal + 2) === "^3" || s.charAt(afterBal) === "³") {
            balExp = "3";
            balPowLen = s.charAt(afterBal) === "³" ? 1 : 2;
          } else if (s.slice(afterBal, afterBal + 2) === "^2" || s.charAt(afterBal) === "²") {
            balExp = "2";
            balPowLen = s.charAt(afterBal) === "²" ? 1 : 2;
          }
          if (balExp) {
            out +=
              '<span class="m-pow">' +
              sideToHTML(bal) +
              '<sup class="m-sup">' +
              balExp +
              "</sup></span>";
            i = afterBal + balPowLen;
            continue;
          }
          var slashDen = matchSlashDen(s, afterBal);
          if (slashDen) {
            out += fracWrap(sideToHTML(unwrapParens(bal)), sideToHTML(slashDen.den));
            i = afterBal + slashDen.consumed;
            continue;
          }
        }
      }
      var wrappedFrac = s.slice(i).match(/^\((-?\d+)\)\s*\/\s*\((-?\d+)\)/);
      if (wrappedFrac) {
        out += fracHTML(wrappedFrac[1], wrappedFrac[2]);
        i += wrappedFrac[0].length;
        emitTimesAfterFracIfNeeded(out, s, i);
        continue;
      }
      var parFrac = s.slice(i).match(/^\(([−–—-]?)(\d+)\s*\/\s*(\d+)\)/);
      if (parFrac) {
        if (parFrac[1]) {
          out += '<span class="m-neg">−</span>' + fracHTML(parFrac[2], parFrac[3]);
        } else {
          out += fracHTML(parFrac[2], parFrac[3]);
        }
        i += parFrac[0].length;
        emitTimesAfterFracIfNeeded(out, s, i);
        continue;
      }
      var signedFrac = s.slice(i).match(/^[−–—-]\((\d+)\s*\/\s*(\d+)\)/);
      if (signedFrac) {
        out += '<span class="m-neg">−</span>' + fracHTML(signedFrac[1], signedFrac[2]);
        i += signedFrac[0].length;
        emitTimesAfterFracIfNeeded(out, s, i);
        continue;
      }
      var bareFrac = s.slice(i).match(/^(\d+)\s*\/\s*(-?\d+)/);
      if (bareFrac) {
        out += fracHTML(bareFrac[1], bareFrac[2]);
        i += bareFrac[0].length;
        emitTimesAfterFracIfNeeded(out, s, i);
        continue;
      }
      var ch = s.charAt(i);
      if (ch === "*" || ch === "×" || ch === "·") {
        if (!hideTimesSign(neighborChar(s, i, -1), neighborChar(s, i, 1))) {
          out += '<span class="m-op">·</span>';
        }
        i += 1;
        continue;
      }
      if (ch === "-" || ch === "−" || ch === "–" || ch === "—") {
        out += '<span class="m-op">−</span>';
        i += 1;
        continue;
      }
      if (ch === "+") {
        out += '<span class="m-op">+</span>';
        i += 1;
        continue;
      }
      if (ch === "=" || ch === "≠") {
        out += '<span class="m-eq">' + (ch === "≠" ? "≠" : "=") + "</span>";
        i += 1;
        continue;
      }
      if (ch === "^" && s.charAt(i + 1) === "2") {
        out += '<sup class="m-sup">2</sup>';
        i += 2;
        continue;
      }
      var xIdx = s.slice(i).match(/^x(₁,₂|₁|₂)/);
      if (xIdx) {
        out += '<span class="m-x">x' + escapeHtml(xIdx[1]) + "</span>";
        i += xIdx[0].length;
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

  var LIN_X_TERM =
    "[−–—-]?(?:(?:\\(\\s*\\d+(?:\\.\\d+)?\\s*\\/\\s*\\d+(?:\\.\\d+)?\\s*\\)\\s*)|\\d+(?:\\.\\d+)?(?:\\/\\d+(?:\\.\\d+)?)?\\s*)?[xXyY]";
  var LIN_TERM =
    "(?:" + LIN_X_TERM + "|[−–—-]?\\d+(?:\\.\\d+)?(?:\\/\\d+(?:\\.\\d+)?)?|[a-zA-Z])";
  var LIN_SIDE = "(?:" + LIN_TERM + "(?:\\s*[+−–—-]\\s*" + LIN_TERM + ")*)";
  var RE_LINEAR_EQ = new RegExp(LIN_SIDE + "\\s*=\\s*" + LIN_SIDE, "gi");
  var RE_SLOPE_TEMPLATE = /y\s*=\s*mx\s*[+−–—-]\s*b/gi;
  var RE_SLOPE_YX =
    /[yY]\s*=\s*[−–—-]?(?:(?:\(\s*\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\s*\)\s*[xX]|\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?\s*[xX])|[xX])(?:\s*[+−–—-]\s*\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)?/gi;
  var M_TAG = "(?:_(?:III|II|I|[A-Za-z]{1,4}|\\d+)|[₀₁₂₃₄₅₆₇₈₉]+|\\d+|[A-Za-z]{1,4})?";
  var M_VAL =
    "[−–—-]?(?:\\d+\\s+\\d+\\s*\\/\\s*\\d+|\\(\\d+\\s*\\/\\s*\\d+\\)|\\d+\\s*\\/\\s*\\d+|\\d+½|\\d+(?:\\.\\d+)?|½)";
  var RE_M_EQ = new RegExp("\\bm" + M_TAG + "\\s*=\\s*" + M_VAL, "gi");
  var RE_M_EQ_LIST = new RegExp(
    "\\bm" + M_TAG + "\\s*=\\s*" + M_VAL + "(?:\\s*[,;]\\s*m" + M_TAG + "\\s*=\\s*" + M_VAL + ")+",
    "gi"
  );
  var RE_PROSE_MATH =
    /S(?:△|Δ|□|▭)?[A-Za-z]{3,4}(?:\s*=\s*S(?:△|Δ|□|▭)?[A-Za-z]{3,4}\s*[−–—-]\s*S(?:△|Δ|□|▭)?[A-Za-z]{3,4})?|[A-Za-z]→[A-Za-z]{2}|[A-Za-z]\s*\(\s*[−–—-]?(?:\d+\/\d+|\d+(?:\.\d+)?)\s*[.,;]\s*[−–—-]?(?:\d+\/\d+|\d+(?:\.\d+)?)\s*\)|\(\s*[−–—-]?(?:\d+\/\d+|\d+(?:\.\d+)?)\s*[.,;]\s*[−–—-]?(?:\d+\/\d+|\d+(?:\.\d+)?)\s*\)|[−–—-]?\d+(?:\.\d+)?[xX](?!\w)/g;
  var PROD_NUM =
    "(?:\\(\\s*[−–—-]?\\s*\\d+\\s*\\/\\s*\\d+\\s*\\)|\\(\\s*[−–—-]?\\s*\\d+(?:\\.\\d+)?\\s*\\)|[−–—-]?\\d+\\s*\\/\\s*\\d+|[−–—-]?\\d+(?:\\.\\d+)?|½)";
  var RE_PROD_EQ = new RegExp(
    PROD_NUM +
      "\\s*[·×*]\\s*" +
      PROD_NUM +
      "\\s*[=≠]\\s*" +
      PROD_NUM +
      "(?:\\s*≠\\s*" +
      PROD_NUM +
      ")?",
    "gi"
  );

  function proseChunkHTML(chunk) {
    return toHTML(String(chunk || "").trim());
  }

  function detachHebrewFromMath(text) {
    return String(text || "")
      .replace(/ל[\-־—–](?=\s*y\s*=)/gi, "לצורה \u2066")
      .replace(/ל[\-־—–](?=\s*[0-9]*\s*[xyXY])/gi, " \u2066");
  }

  // «מ-70» הוא מקף עברי (יותר מ־70), לא המספר −70.
  function hebrewMaqaf(text) {
    return String(text || "").replace(/([\u05D0-\u05EA])[−–—\-]\s*(?=\d)/g, "$1־");
  }

  function proseHTML(text) {
    var src = hebrewMaqaf(detachHebrewFromMath(text));
    var slots = [];
    function stash(chunk) {
      var id = "\x00M" + slots.length + "\x00";
      slots.push(
        '<span class="math-prose" dir="ltr">\u2066' + proseChunkHTML(chunk) + "\u2067</span>"
      );
      return id;
    }
    src = src.replace(RE_M_EQ_LIST, stash);
    src = src.replace(RE_M_EQ, stash);
    src = src.replace(/\bd_?[A-Za-z]{2,4}(?:\s*=\s*[^\s,;]+)?/g, stash);
    src = src.replace(/\bd\s*=\s*√[^\n.]*/g, stash);
    src = src.replace(RE_SLOPE_TEMPLATE, stash);
    src = src.replace(RE_PROD_EQ, stash);
    src = src.replace(RE_LINEAR_EQ, function (chunk, offset, full) {
      if (offset > 0 && /[xX0-9)]\s*[+−–—-]\s*$/.test(full.slice(0, offset))) return chunk;
      return stash(chunk);
    });
    src = src.replace(RE_SLOPE_YX, stash);
    src = src.replace(RE_PROSE_MATH, stash);
    src = src.replace(
      /(^|[^A-Za-z0-9])([−–—-]\s*(?:\d+\s+\d+\s*\/\s*\d+|\(\d+\s*\/\s*\d+\)|\d+\s*\/\s*\d+|\d+(?:\.\d+)?))/g,
      function (_, pre, num) {
        if (/[\u05D0-\u05EA]/.test(pre)) return pre + num;
        return pre + stash(num);
      }
    );
    src = src.replace(/(^|[^A-Za-z0-9])(\d+\s*\/\s*\d+)/g, function (_, pre, frac) {
      return pre + stash(frac);
    });
    var esc = escapeHtml(src);
    slots.forEach(function (html, i) {
      esc = esc.split("\x00M" + i + "\x00").join(html);
    });
    return esc;
  }

  global.DoctematicaMath = {
    toHTML: toHTML,
    proseHTML: proseHTML,
    systemHTML: systemHTML,
    fracHTML: fracHTML,
  };
})(window);
