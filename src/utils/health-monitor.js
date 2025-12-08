// health-monitor.js
// Router v8B — System Health Monitor

const { logHealthMetrics } = require("./telemetry-engine");
const { getTelemetrySummary } = require("./telemetry-summary");

/**
 * Collect and log system health metrics.
 * @returns {Object}
 */
function collectHealthMetrics() {
  const summary = getTelemetrySummary(1000); // Last 1000 events
  
  const health = {
    timestamp: new Date().toISOString(),
    status: determineHealthStatus(summary),
    metrics: {
      totalExecutions: summary.overall.totalExecutions,
      successRate: summary.overall.successRate,
      avgDurationMs: summary.overall.avgDurationMs,
      failureCount: summary.overall.failureCount
    },
    creditorPerformance: Object.keys(summary.byCreditor).map(cred => ({
      creditor: cred,
      total: summary.byCreditor[cred].total,
      successRate: Math.round(
        (summary.byCreditor[cred].success / summary.byCreditor[cred].total) * 100
      )
    })),
    templatePerformance: Object.keys(summary.byTemplate).map(tpl => ({
      template: tpl,
      total: summary.byTemplate[tpl].total,
      successRate: Math.round(
        (summary.byTemplate[tpl].success / summary.byTemplate[tpl].total) * 100
      )
    }))
  };

  // Log to telemetry
  logHealthMetrics(health);

  return health;
}

/**
 * Determine overall system health status.
 * @param {Object} summary
 * @returns {string} 'healthy' | 'degraded' | 'critical'
 */
function determineHealthStatus(summary) {
  const { successRate, totalExecutions } = summary.overall;

  // Need minimum data to make assessment
  if (totalExecutions < 10) {
    return "healthy"; // Not enough data yet
  }

  if (successRate >= 90) return "healthy";
  if (successRate >= 70) return "degraded";
  return "critical";
}

/**
 * Get current system health status.
 * @returns {Object}
 */
function getSystemHealth() {
  return collectHealthMetrics();
}

module.exports = {
  collectHealthMetrics,
  getSystemHealth,
  determineHealthStatus
};
