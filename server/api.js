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
var db = require("./db");
var auth = require("./auth");

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
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

var engine = loadEngine();
var equations = createEquationsHandler(engine);
var quadratic = createQuadraticHandler(engine);
var highPower = createHighPowerHandler(engine);
var systems = createSystemsHandler(engine);
var geometry = createGeometryHandler(engine);

function sendJson(res, status, body, cookie) {
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
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Cache-Control": "no-store",
  };
  if (cookie) {
    headers["Set-Cookie"] = cookie;
    delete headers["Access-Control-Allow-Origin"];
  }
  res.writeHead(status, headers);
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

function redirect(res, loc) {
  res.writeHead(302, { Location: loc, "Cache-Control": "no-store" });
  res.end();
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

function requireAppUser(req, res, then) {
  if (!auth.authEnabled()) {
    then();
    return;
  }
  auth.readSession(req).then(function (session) {
    if (!session) {
      sendJson(res, 401, {
        ok: false,
        error: "auth",
        message: "יש להתחבר כדי להמשיך.",
      });
      return;
    }
    then();
  }).catch(function (err) {
    logErr(err);
    sendServerError(res);
  });
}

function handleMathPost(req, res, run) {
  requireAppUser(req, res, function () {
    handlePostJson(req, res, run);
  });
}

function allowedStaticRel(rel) {
  if (rel === "index.html" || rel === "login.html") return true;
  if (rel.indexOf("css/") === 0) return true;
  if (rel.indexOf("js/") === 0) return true;
  if (rel.indexOf("data/") === 0) return true;
  if (rel.indexOf("img/") === 0) return true;
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

function streamFile(rel, req, res) {
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
    "Cache-Control": ext === ".html" ? "no-store" : "no-store",
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

function serveLogin(req, res) {
  return streamFile("login.html", req, res);
}

function serveApp(req, res) {
  return streamFile("index.html", req, res);
}

function tryServeStatic(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  var pathname = pathnameOf(req);
  if (!pathname) return false;
  var rel = path.posix.normalize(pathname).replace(/^\/+/, "");
  if (!rel || rel === ".." || rel.indexOf("../") === 0) {
    res.writeHead(403);
    res.end();
    return true;
  }
  if (rel === "index.html" || rel === "login.html") return false;
  if (!allowedStaticRel(rel)) return false;
  return streamFile(rel, req, res);
}

function handleAuthBody(req, res, fn) {
  readBody(req, function (err, body) {
    if (err || !body) {
      sendJson(res, 400, { ok: false, error: "invalid_json", message: "invalid json" });
      return;
    }
    fn(body, req)
      .then(function (out) {
        sendJson(res, out.status, out.body, out.cookie);
      })
      .catch(function (caught) {
        logErr(caught);
        sendServerError(res);
      });
  });
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
  if (req.method === "POST" && pathname === "/api/auth/signup") {
    handleAuthBody(req, res, auth.signup);
    return;
  }
  if (req.method === "POST" && pathname === "/api/auth/login") {
    handleAuthBody(req, res, auth.login);
    return;
  }
  if (req.method === "POST" && pathname === "/api/auth/logout") {
    auth
      .logout(req)
      .then(function (out) {
        sendJson(res, out.status, out.body, out.cookie);
      })
      .catch(function (err) {
        logErr(err);
        sendServerError(res);
      });
    return;
  }
  if (req.method === "GET" && pathname === "/api/auth/me") {
    auth
      .me(req)
      .then(function (out) {
        sendJson(res, out.status, out.body);
      })
      .catch(function (err) {
        logErr(err);
        sendServerError(res);
      });
    return;
  }
  if (req.method === "POST" && pathname === "/api/check-step") {
    handleMathPost(req, res, function (body) {
      return equations.handleCheck(body);
    });
    return;
  }
  if (req.method === "POST" && (pathname === "/api/equations" || pathname === "/api/equations/basic")) {
    handleMathPost(req, res, function (body) {
      if (pathname === "/api/equations/basic" && !body.subtopic) body.subtopic = "basic";
      return equations.handle(body);
    });
    return;
  }
  if (req.method === "POST" && pathname === "/api/high-power") {
    handleMathPost(req, res, function (body) {
      return highPower.handle(body);
    });
    return;
  }
  if (req.method === "POST" && pathname === "/api/systems") {
    handleMathPost(req, res, function (body) {
      return systems.handle(body);
    });
    return;
  }
  if (req.method === "POST" && pathname === "/api/geometry") {
    handleMathPost(req, res, function (body) {
      return geometry.handle(body);
    });
    return;
  }
  if (req.method === "POST" && pathname === "/api/quadratic") {
    handleMathPost(req, res, function (body) {
      return quadratic.handle(body);
    });
    return;
  }

  if ((req.method === "GET" || req.method === "HEAD") && (pathname === "/login" || pathname === "/login.html")) {
    if (!auth.authEnabled()) {
      serveLogin(req, res);
      return;
    }
    auth.readSession(req).then(function (session) {
      if (session) redirect(res, "/");
      else serveLogin(req, res);
    }).catch(function (err) {
      logErr(err);
      serveLogin(req, res);
    });
    return;
  }

  if ((req.method === "GET" || req.method === "HEAD") && (pathname === "/" || pathname === "/index.html")) {
    if (!auth.authEnabled()) {
      serveApp(req, res);
      return;
    }
    auth.readSession(req).then(function (session) {
      if (!session) redirect(res, "/login");
      else serveApp(req, res);
    }).catch(function (err) {
      logErr(err);
      redirect(res, "/login");
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

function listen() {
  if (process.env.NODE_ENV === "production" && auth.authEnabled() && !String(process.env.SESSION_SECRET || "").trim()) {
    console.error("SESSION_SECRET is required in production");
    process.exit(1);
  }
  server.listen(PORT, HOST, function () {
    console.log("Doctematica on http://127.0.0.1:" + PORT + " (bind " + HOST + ")");
  });
}

db.migrate()
  .then(listen)
  .catch(function (err) {
    logErr(err);
    listen();
  });
