"use strict";

var handleHighRoot = require("./high-root").handleHighRoot;
var handleHighFactor = require("./high-factor").handleHighFactor;

function createHighPowerHandler(engine) {
  function handle(body) {
    body = body || {};
    var topic = String(body.topic || "high-power");
    var subtopic = String(body.subtopic || "");
    if (topic !== "high-power") {
      return { error: "unknown topic", message: "unknown topic" };
    }
    if (subtopic === "root") return handleHighRoot(engine, body);
    if (subtopic === "factor") return handleHighFactor(engine, body);
    return { error: "unknown subtopic", message: "unknown subtopic" };
  }

  return { handle: handle };
}

module.exports = {
  createHighPowerHandler: createHighPowerHandler,
};
