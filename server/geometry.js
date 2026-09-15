"use strict";

var handleLengths = require("./geo-lengths").handleLengths;

function createGeometryHandler(engine) {
  function handle(body) {
    body = body || {};
    var topic = String(body.topic || "analytic");
    if (topic !== "analytic" && topic !== "geometry") {
      return { error: "unknown topic", message: "unknown topic" };
    }
    var capability = String(body.capability || "lengths");
    if (capability === "lengths" || capability === "areas" || capability === "points" || capability === "line-mb" || capability === "line-match") return handleLengths(engine, body);
    return { error: "unknown capability", message: "unknown capability" };
  }
  return { handle: handle };
}

module.exports = {
  createGeometryHandler: createGeometryHandler,
};
