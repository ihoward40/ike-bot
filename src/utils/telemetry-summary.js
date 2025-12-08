// telemetry-summary.js
// Router v8 — Aggregates telemetry-log.jsonl into clean stats for Command Center Lite

const fs = require("fs");
const path = require("path");

const TELEMETRY_PATH = path.join(__dirname, "../../data/telemetry-log.jsonl");

/**
 * Read last N telemetry entries from JSONL file.
 * @param {number} limit - Number of entries to read
 * @returns {Array<Object>}
 */
function readLastEntries(limit = 500) {
  if (!fs.existsSync(TELEMETRY_PATH)) return [];

  const lines = fs.readFileSync(TELEMETRY_PATH, "utf-8")
    .trim()
    .split("\n")
    .filter(line => line.length > 0);

  const slice = lines.slice(-limit);
  return slice
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Build summary from telemetry events (no prediction, just counts).
 * @param {Array<Object>} events
 * @returns {Object}
 */
function buildSummary(events) {
  const execEvents = events.filter(e => e.type === "execution");
  const healthEvents = events.filter(e => e.type === "system_health");

  const totalExec = execEvents.length;
  const successExec = execEvents.filter(e => e.status === "success").length;
  const failExec = execEvents.filter(e => e.status === "failure").length;

  const lastExec = execEvents[execEvents.length - 1] || null;
  const successRate = totalExec === 0 ? 1 : successExec / totalExec;

  // Average duration for basic performance feel
  const avgDuration =
    totalExec === 0
      ? 0
      : Math.round(
          execEvents.reduce((acc, e) => acc + (e.durationMs || 0), 0) /
            totalExec
        );

  const lastHealth = healthEvents[healthEvents.length - 1] || null;

  // Group by creditor
  const byCreditor = {};
  execEvents.forEach(e => {
    const cred = e.creditor || "Unknown";
    if (!byCreditor[cred]) {
      byCreditor[cred] = { total: 0, success: 0, fail: 0 };
    }
    byCreditor[cred].total++;
    if (e.status === "success") byCreditor[cred].success++;
    if (e.status === "failure") byCreditor[cred].fail++;
  });

  // Group by templateKey
  const byTemplate = {};
  execEvents.forEach(e => {
    const tpl = e.templateKey || "Unknown";
    if (!byTemplate[tpl]) {
      byTemplate[tpl] = { total: 0, success: 0, fail: 0 };
    }
    byTemplate[tpl].total++;
    if (e.status === "success") byTemplate[tpl].success++;
    if (e.status === "failure") byTemplate[tpl].fail++;
  });

  return {
    overall: {
      totalExecutions: totalExec,
      successCount: successExec,
      failureCount: failExec,
      successRate: Math.round(successRate * 100),
      avgDurationMs: avgDuration,
      lastExecution: lastExec ? lastExec.timestamp : null
    },
    byCreditor,
    byTemplate,
    recentActivity: execEvents.slice(-10).reverse(), // Last 10, newest first
    systemHealth: lastHealth || { status: "unknown" }
  };
}

/**
 * Get current telemetry summary.
 * @param {number} limit - Number of entries to analyze
 * @returns {Object}
 */
function getTelemetrySummary(limit = 500) {
  const events = readLastEntries(limit);
  return buildSummary(events);
}

module.exports = {
  readLastEntries,
  buildSummary,
  getTelemetrySummary
};
