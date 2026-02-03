// telemetry-engine.js
// Router v8A — Telemetry Logging Framework (Safe / Non-Predictive)

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
const TELEMETRY_PATH = path.join(DATA_DIR, "telemetry-log.jsonl");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Record a telemetry event in JSON Lines format.
 * @param {Object} event
 */
function logTelemetry(event) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event
  };

  try {
    fs.appendFileSync(TELEMETRY_PATH, JSON.stringify(entry) + "\n");
  } catch (err) {
    console.error("Telemetry logging failed:", err.message);
  }
}

/**
 * Standard telemetry wrapper for execution events.
 * @param {Function} fn
 * @param {Object} meta
 */
async function telemetryWrap(fn, meta = {}) {
  const start = Date.now();
  try {
    const result = await fn();

    logTelemetry({
      type: "execution",
      status: "success",
      durationMs: Date.now() - start,
      ...meta,
      resultSummary: result ? "ok" : "empty"
    });

    return result;
  } catch (err) {
    logTelemetry({
      type: "execution",
      status: "failure",
      durationMs: Date.now() - start,
      error: err.message,
      stack: err.stack,
      ...meta
    });

    throw err;
  }
}

/**
 * Log system health metrics.
 * @param {Object} metrics
 */
function logHealthMetrics(metrics) {
  logTelemetry({
    type: "system_health",
    ...metrics
  });
}

module.exports = { 
  logTelemetry, 
  telemetryWrap,
  logHealthMetrics,
  TELEMETRY_PATH
};
