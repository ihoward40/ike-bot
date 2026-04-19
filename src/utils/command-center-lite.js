// utils/command-center-lite.js
// Command Center Lite - Operational Dashboard Data Builder

const { getActiveCases, getUpcomingDeadlines } = require("../services/case-service");
const { getTelemetrySummary } = require("./telemetry-summary");
const { getSystemHealth } = require("./health-monitor");
const { computeCaseInfluence } = require("./case-influence");

/**
 * Build complete command center data
 * @returns {Promise<Object>}
 */
async function buildCommandCenterLite() {
  try {
    const [cases, deadlines, telemetry, health] = await Promise.all([
      getActiveCases(),
      getUpcomingDeadlines(),
      Promise.resolve(getTelemetrySummary(500)),
      Promise.resolve(getSystemHealth())
    ]);

    // Enrich cases with influence scoring
    const enrichedCases = cases.map(c => {
      const influence = computeCaseInfluence(c);
      return {
        ...c,
        influenceScore: influence.score,
        influenceLabel: influence.label,
        influenceBreakdown: influence.breakdown
      };
    });

    // Sort by highest influence first
    enrichedCases.sort((a, b) => b.influenceScore - a.influenceScore);

    // Calculate warnings
    const warnings = calculateWarnings(enrichedCases, deadlines);

    // Get top 3 priority cases
    const topCases = enrichedCases.slice(0, 3);

    return {
      status: "online",
      timestamp: new Date().toISOString(),
      overview: {
        totalCases: enrichedCases.length,
        upcomingDeadlines: deadlines.length,
        automationSuccessRate: telemetry.overall.successRate,
        failedExecutions: telemetry.overall.failureCount,
        lastExecution: telemetry.recentActivity[0] || null,
        avgDurationMs: telemetry.overall.avgDurationMs
      },
      topPriorityCases: topCases.map(c => ({
        caseId: c.caseId,
        creditor: c.creditor,
        priority: c.priority,
        influenceScore: c.influenceScore,
        influenceLabel: c.influenceLabel,
        nextDeadline: c.nextDeadline
      })),
      cases: enrichedCases,
      deadlines,
      warnings,
      systemHealth: health,
      creditorPerformance: aggregateByCreditor(enrichedCases, telemetry),
      templatePerformance: telemetry.byTemplate || {}
    };
  } catch (error) {
    console.error("Error building command center:", error);
    return {
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Calculate warnings for cases
 * @param {Array} cases
 * @param {Array} deadlines
 * @returns {Array}
 */
function calculateWarnings(cases, deadlines) {
  const warnings = [];
  const now = Date.now();

  deadlines.forEach(d => {
    if (!d.nextDeadline) return;
    
    const deadlineMs = new Date(d.nextDeadline).getTime();
    const hoursLeft = (deadlineMs - now) / 3600000;

    if (hoursLeft <= 0) {
      warnings.push({
        caseId: d.caseId,
        creditor: d.creditor,
        type: "deadline_overdue",
        severity: "critical",
        message: "Deadline already passed"
      });
    } else if (hoursLeft <= 24) {
      warnings.push({
        caseId: d.caseId,
        creditor: d.creditor,
        type: "deadline_critical",
        severity: "high",
        message: "Deadline under 24 hours"
      });
    } else if (hoursLeft <= 48) {
      warnings.push({
        caseId: d.caseId,
        creditor: d.creditor,
        type: "deadline_warning",
        severity: "medium",
        message: "Deadline under 48 hours"
      });
    }
  });

  // Check for high failure counts
  cases.forEach(c => {
    if (c.telemetryFailCount >= 3) {
      warnings.push({
        caseId: c.caseId,
        creditor: c.creditor,
        type: "high_friction",
        severity: "medium",
        message: `${c.telemetryFailCount} automation failures detected`
      });
    }
  });

  return warnings;
}

/**
 * Aggregate cases by creditor
 * @param {Array} cases
 * @param {Object} telemetry
 * @returns {Object}
 */
function aggregateByCreditor(cases, telemetry) {
  const creditorMap = {};

  cases.forEach(c => {
    if (!creditorMap[c.creditor]) {
      creditorMap[c.creditor] = {
        totalCases: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        avgInfluence: 0,
        totalInfluence: 0
      };
    }

    creditorMap[c.creditor].totalCases++;
    creditorMap[c.creditor].totalInfluence += c.influenceScore || 0;
    
    switch (c.priority) {
      case "critical":
        creditorMap[c.creditor].critical++;
        break;
      case "high":
        creditorMap[c.creditor].high++;
        break;
      case "medium":
        creditorMap[c.creditor].medium++;
        break;
      case "low":
        creditorMap[c.creditor].low++;
        break;
    }
  });

  // Calculate averages
  Object.keys(creditorMap).forEach(creditor => {
    const data = creditorMap[creditor];
    data.avgInfluence = data.totalCases > 0 
      ? (data.totalInfluence / data.totalCases).toFixed(2)
      : 0;
  });

  return creditorMap;
}

module.exports = {
  buildCommandCenterLite,
  calculateWarnings,
  aggregateByCreditor
};
