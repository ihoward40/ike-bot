// services/slack.js
// Slack notification service

const axios = require("axios");
const { logTelemetry } = require("../utils/telemetry-engine");

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * Send a message to Slack
 * @param {string} text - The message text
 * @param {Array} blocks - Optional Block Kit blocks
 * @returns {Promise<Object>}
 */
async function sendSlackMessage(text, blocks = null) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn("SLACK_WEBHOOK_URL not configured");
    return { ok: false, error: "Slack webhook not configured" };
  }

  try {
    const payload = { text };
    if (blocks) {
      payload.blocks = blocks;
    }

    await axios.post(SLACK_WEBHOOK_URL, payload);

    logTelemetry({
      type: "slack_notification",
      status: "success",
      channel: "webhook"
    });

    return { ok: true };
  } catch (error) {
    console.error("Error sending Slack message:", error);
    
    logTelemetry({
      type: "slack_notification",
      status: "failure",
      error: error.message
    });

    return { ok: false, error: error.message };
  }
}

/**
 * Send enforcement alert to Slack
 * @param {Object} alert
 * @returns {Promise<Object>}
 */
async function sendEnforcementAlert(alert) {
  const { caseId, creditor, priority, action, deadline } = alert;

  const priorityEmoji = {
    critical: "🔥",
    high: "🟠",
    medium: "🟡",
    low: "🟢"
  };

  const text = `${priorityEmoji[priority] || "📌"} *Enforcement Alert*\n` +
    `Case: ${caseId}\n` +
    `Creditor: ${creditor}\n` +
    `Priority: ${priority}\n` +
    `Action: ${action}\n` +
    `Deadline: ${deadline || "N/A"}`;

  return await sendSlackMessage(text);
}

/**
 * Send system health alert to Slack
 * @param {Object} health
 * @returns {Promise<Object>}
 */
async function sendHealthAlert(health) {
  const statusEmoji = {
    healthy: "✅",
    degraded: "⚠️",
    critical: "🚨"
  };

  const text = `${statusEmoji[health.status] || "📊"} *System Health Update*\n` +
    `Status: ${health.status}\n` +
    `Success Rate: ${(health.successRate * 100).toFixed(1)}%\n` +
    `Failed Executions: ${health.failedExecutions}`;

  return await sendSlackMessage(text);
}

module.exports = {
  sendSlackMessage,
  sendEnforcementAlert,
  sendHealthAlert
};
