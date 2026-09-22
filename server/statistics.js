"use strict";

var handleFreq = require("./freq-table").handle;

function createStatisticsHandler(engine) {
  function handle(body) {
    body = body || {};
    var topic = String(body.topic || "statistics");
    if (topic !== "statistics") {
      return { error: "unknown topic", message: "unknown topic" };
    }
    var capability = String(body.capability || "freq-table");
    if (capability === "freq-table") return handleFreq(engine, body);
    return { error: "unknown capability", message: "unknown capability" };
  }
  return { handle: handle };
}

module.exports = {
  createStatisticsHandler: createStatisticsHandler,
};
