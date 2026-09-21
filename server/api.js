"use strict";

var fs = require("fs");
var http = require("http");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createEquationsHandler = require("./equations").createEquationsHandler;
var createQuadraticHandler = require("./quadratic").createQuadraticHandler;
var createHighPowerHandler = require("./high-power").createHighPowerHandler;
var createSystemsHandler = require("./systems").createSystemsHandler;
var createGeometryHandler = require("./geometry").createGeometryHandler;

var ROOT = path.resolve(__dirname, "..");
var PORT = Number(process.env.DOCTEMATICA_API_PORT || process.env.PORT || 8787);
if (!PORT || PORT < 1 || PORT > 65535) PORT = 8787;
var HOST = process.env.HOST || "0.0.0.0";

var MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

var engine = loadEngine();
var equations = createEquationsHandler(engine);
var quadratic = createQuadraticHandler(engine);
var highPower = createHighPowerHandler(engine);
var systems = createSystemsHandler(engine);
var geometry = createGeometryHandler(engine);

function sendJson(res, status, body) {
  var raw;
  try {
    raw = JSON.stringify(body);
  } catch (err) {
    status = 500;
    raw = JSON.stringify({
      ok: false,
      error: "server",
      message: "שגיאה בעיבוד הבדיקה.",
    });
  }
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(raw);
}

function sendServerError(res) {
  sendJson(res, 500, {
    ok: false,
    error: "server",
    message: "שגיאה בעיבוד הבדיקה.",
  });
}

function logErr(err) {
  var msg = err && err.message ? String(err.message) : String(err);
  console.error(msg);
}

function pathnameOf(req) {
  try {
    return decodeURIComponent(String(req.url || "/").split("?")[0] || "/");
  } catch (err) {
    return "";
  }
}

function readBody(req, cb) {
  var chunks = [];
  req.on("data", function (c) {
    chunks.push(c);
    if (chunks.reduce(function (n, x) { return n + x.length; }, 0) > 20000) {
      req.destroy();
      cb(new Error("body too large"));
    }
  });
  req.on("end", function () {
    try {
      cb(null, JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
    } catch (err) {
      cb(err);
    }
  });
  req.on("error", cb);
}

function handlePostJson(req, res, run) {
  readBody(req, function (err, body) {
    if (err || !body) {
      sendJson(res, 400, { ok: false, message: "invalid json" });
      return;
    }
    var result;
    try {
      result = run(body);
    } catch (caught) {
      logErr(caught);
      sendServerError(res);
      return;
    }
    if (result && result.error) {
      sendJson(res, 400, { ok: false, message: result.message || result.error });
      return;
    }
    sendJson(res, 200, result);
  });
}

function allowedStaticRel(rel) {
  if (rel === "index.html") return true;
  if (rel.indexOf("css/") === 0) return true;
  if (rel.indexOf("js/") === 0) return true;
  if (rel.indexOf("data/") === 0) return true;
  return false;
}

function safeAbs(relPosix) {
  var parts = String(relPosix || "").split("/").filter(Boolean);
  var i;
  for (i = 0; i < parts.length; i++) {
    if (parts[i] === ".." || parts[i] === "." || parts[i].charAt(0) === ".") return null;
  }
  var abs = path.resolve(ROOT, parts.join(path.sep));
  if (abs !== ROOT && abs.indexOf(ROOT + path.sep) !== 0) return null;
  return abs;
}

function tryServeStatic(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  var pathname = pathnameOf(req);
  if (!pathname) return false;
  if (pathname === "/") pathname = "/index.html";
  var rel = path.posix.normalize(pathname).replace(/^\/+/, "");
  if (!rel || rel === ".." || rel.indexOf("../") === 0) {
    res.writeHead(403);
    res.end();
    return true;
  }
  if (!allowedStaticRel(rel)) return false;
  var ext = path.extname(rel).toLowerCase();
  if (!MIME[ext] || ext === ".map") return false;
  var abs = safeAbs(rel);
  if (!abs) {
    res.writeHead(403);
    res.end();
    return true;
  }
  var st;
  try {
    st = fs.statSync(abs);
  } catch (err) {
    return false;
  }
  if (!st.isFile()) return false;
  res.writeHead(200, {
    "Content-Type": MIME[ext],
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (req.method === "HEAD") {
    res.end();
    return true;
  }
  fs.createReadStream(abs)
    .on("error", function (err) {
      logErr(err);
      if (!res.headersSent) sendServerError(res);
      else res.end();
    })
    .pipe(res);
  return true;
}

function handleRequest(req, res) {
  var pathname = pathnameOf(req);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }
  if (req.method === "GET" && (pathname === "/health" || pathname === "/api/health")) {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (req.method === "POST" && pathname === "/api/check-step") {
    handlePostJson(req, res, function (body) {
      return equations.handleCheck(body);
    });
    return;
  }
  if (req.method === "POST" && (pathname === "/api/equations" || pathname === "/api/equations/basic")) {
    handlePostJson(req, res, function (body) {
      if (pathname === "/api/equations/basic" && !body.subtopic) body.subtopic = "basic";
      return equations.handle(body);
    });
    return;
  }
  if (req.method === "POST" && pathname === "/api/high-power") {
    handlePostJson(req, res, function (body) {
      return highPower.handle(body);
    });
    return;
  }
  if (req.method === "POST" && pathname === "/api/systems") {
    handlePostJson(req, res, function (body) {
      return systems.handle(body);
    });
    return;
  }
  if (req.method === "POST" && pathname === "/api/geometry") {
    handlePostJson(req, res, function (body) {
      return geometry.handle(body);
    });
    return;
  }
  if (req.method === "POST" && pathname === "/api/quadratic") {
    handlePostJson(req, res, function (body) {
      return quadratic.handle(body);
    });
    return;
  }
  if (tryServeStatic(req, res)) return;
  sendJson(res, 404, { ok: false, message: "not found" });
}

var server = http.createServer(function (req, res) {
  try {
    handleRequest(req, res);
  } catch (err) {
    logErr(err);
    if (!res.headersSent) sendServerError(res);
    else res.end();
  }
});

process.on("uncaughtException", function (err) {
  logErr(err);
});
process.on("unhandledRejection", function (err) {
  logErr(err);
});

server.listen(PORT, HOST, function () {
  console.log("Doctematica on http://127.0.0.1:" + PORT + " (bind " + HOST + ")");
});
