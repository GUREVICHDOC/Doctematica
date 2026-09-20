"use strict";

var http = require("http");
var loadEngine = require("./load-engine").loadEngine;
var createEquationsHandler = require("./equations").createEquationsHandler;
var createQuadraticHandler = require("./quadratic").createQuadraticHandler;
var createHighPowerHandler = require("./high-power").createHighPowerHandler;
var createSystemsHandler = require("./systems").createSystemsHandler;
var createGeometryHandler = require("./geometry").createGeometryHandler;

var PORT = Number(process.env.DOCTEMATICA_API_PORT || 8787);
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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  res.end(raw);
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

var server = http.createServer(function (req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }
  if (req.method === "GET" && req.url === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (req.method === "POST" && req.url === "/api/check-step") {
    readBody(req, function (err, body) {
      if (err || !body) {
        sendJson(res, 400, { ok: false, message: "invalid json" });
        return;
      }
      sendJson(res, 200, equations.handleCheck(body));
    });
    return;
  }
  if (req.method === "POST" && (req.url === "/api/equations" || req.url === "/api/equations/basic")) {
    readBody(req, function (err, body) {
      if (err || !body) {
        sendJson(res, 400, { ok: false, message: "invalid json" });
        return;
      }
      if (req.url === "/api/equations/basic" && !body.subtopic) body.subtopic = "basic";
      var result = equations.handle(body);
      if (result && result.error) {
        sendJson(res, 400, { ok: false, message: result.message || result.error });
        return;
      }
      sendJson(res, 200, result);
    });
    return;
  }
  if (req.method === "POST" && req.url === "/api/high-power") {
    readBody(req, function (err, body) {
      if (err || !body) {
        sendJson(res, 400, { ok: false, message: "invalid json" });
        return;
      }
      var result = highPower.handle(body);
      if (result && result.error) {
        sendJson(res, 400, { ok: false, message: result.message || result.error });
        return;
      }
      sendJson(res, 200, result);
    });
    return;
  }
  if (req.method === "POST" && req.url === "/api/systems") {
    readBody(req, function (err, body) {
      if (err || !body) {
        sendJson(res, 400, { ok: false, message: "invalid json" });
        return;
      }
      var result = systems.handle(body);
      if (result && result.error) {
        sendJson(res, 400, { ok: false, message: result.message || result.error });
        return;
      }
      sendJson(res, 200, result);
    });
    return;
  }
  if (req.method === "POST" && req.url === "/api/geometry") {
    readBody(req, function (err, body) {
      if (err || !body) {
        sendJson(res, 400, { ok: false, message: "invalid json" });
        return;
      }
      var result;
      try {
        result = geometry.handle(body);
      } catch (err) {
        sendJson(res, 500, {
          ok: false,
          error: "server",
          message: "שגיאה בעיבוד הבדיקה.",
        });
        return;
      }
      if (result && result.error) {
        sendJson(res, 400, { ok: false, message: result.message || result.error });
        return;
      }
      sendJson(res, 200, result);
    });
    return;
  }
  if (req.method === "POST" && req.url === "/api/quadratic") {
    readBody(req, function (err, body) {
      if (err || !body) {
        sendJson(res, 400, { ok: false, message: "invalid json" });
        return;
      }
      var result = quadratic.handle(body);
      if (result && result.error) {
        sendJson(res, 400, { ok: false, message: result.message || result.error });
        return;
      }
      sendJson(res, 200, result);
    });
    return;
  }
  sendJson(res, 404, { ok: false, message: "not found" });
});

server.listen(PORT, "127.0.0.1", function () {
  console.log("Doctematica API on http://127.0.0.1:" + PORT);
});
