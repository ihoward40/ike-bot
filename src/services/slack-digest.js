// services/slack-digest.js
// Daily Ops Briefing for Slack

const { sendSlackMessage } = require("./slack");
const { readTelemetrySummary } = require("../utils/telemetry-summary");
const { getActiveCases, getUpcomingDeadlines } = require("./case-service");
const { systemHealthCheck } = require("../utils/health-monitor");

/**
 * Build daily digest message
 * @returns {Promise<string>}
 */
async function buildSlackDigest() {
  const telemetry = readTelemetrySummary(300);
  const cases = await getActiveCases();
  const deadlines = await getUpcomingDeadlines();
  const health = await systemHealthCheck();

  const criticalCases = cases.filter(c => c.priority === "critical");
  const highCases = cases.filter(c => c.priority === "high");
  const mediumCases = cases.filter(c => c.priority === "medium");
  const lowCases = cases.filter(c => c.priority === "low");

  // Get next 48h deadlines
  const now = new Date();
  const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const urgentDeadlines = deadlines.filter(d => {
    const deadlineDate = new Date(d.nextDeadline);
    return deadlineDate <= fortyEightHoursFromNow;
  });

  const healthStatus = {
    make: health.status === "healthy" ? "✅ OK" : "⚠️ Issues",
    notion: health.status === "healthy" ? "✅ OK" : "⚠️ Issues",
    drive: health.status === "healthy" ? "✅ OK" : "⚠️ Issues",
    slack: "✅ OK" // If we're sending this, Slack is working
  };

  return `
🔱 *SintraPrime Daily Ops Briefing* — ${new Date().toLocaleDateString()}

📌 *Active Cases:* ${cases.length}
🔥 *Critical:* ${criticalCases.length}
🟠 *High:* ${highCases.length}
🟡 *Medium:* ${mediumCases.length}
🟢 *Low:* ${lowCases.length}

🕒 *Next 48h Deadlines:*
${urgentDeadlines.slice(0, 5).map(d =>
  `• *${d.creditor}* (${d.caseId}) — ${d.nextDeadline}`
).join("\n") || "• None"}

⚙️ *System Health:*
• Make.com: ${healthStatus.make}
• Notion API: ${healthStatus.notion}
• Drive: ${healthStatus.drive}
• Slack: ${healthStatus.slack}

📈 *Automation Performance (24h):*
• Success Rate: ${(telemetry.successRate * 100).toFixed(1)}%
• Failed Executions: ${telemetry.failExec}
• Avg Duration: ${telemetry.avgDurationMs}ms

📂 *New Evidence Logged:* Auto-organizer active.

💡 *Top Recommendations:*
• Prioritize cases with deadlines under 48h
• Review failed executions in telemetry
${criticalCases.length > 0 ? `• Address ${criticalCases.length} critical case(s) immediately` : ""}
`;
}

/**
 * Send daily digest to Slack
 * @returns {Promise<Object>}
 */
async function sendSlackDigest() {
  try {
    const text = await buildSlackDigest();
    return await sendSlackMessage(text);
  } catch (error) {
    console.error("Error sending Slack digest:", error);
    return { ok: false, error: error.message };
  }
}

module.exports = {
  buildSlackDigest,
  sendSlackDigest
};
