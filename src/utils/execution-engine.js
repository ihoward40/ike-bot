// execution-engine.js
// Router v6 — Execution Engine
// Fires Make.com workflows, document generation, Notion sync, Slack alerts, and file ops.

const TEMPLATE_BINDINGS = require("../config/TEMPLATE_BINDINGS.json");

/**
 * @typedef {Object} ExecutionResult
 * @property {boolean} ok
 * @property {string} [docId]
 * @property {string} [pdfId]
 * @property {string} [deadline]
 * @property {string} [makeRunId]
 * @property {string} [error]
 */

/**
 * Execute a single enforcement action.
 * @param {Object} action
 * @param {string} action.templateKey
 * @param {string} action.track
 * @param {string} action.channel
 * @param {string} action.description
 * @param {number} action.timeframeDays
 * @param {Object} caseData
 * @param {string} caseData.caseId
 * @param {string} caseData.creditor
 * @param {string} caseData.threadId
 * @param {string} planPriority
 * @param {string} planPosture
 * @returns {Promise<ExecutionResult>}
 */
async function executeAction(action, caseData, planPriority, planPosture) {
  const { templateKey, description, timeframeDays, track, channel } = action;

  const binding = TEMPLATE_BINDINGS[templateKey];
  if (!binding) {
    console.error("Missing template binding:", templateKey);
    return { ok: false, error: "MISSING_TEMPLATE_BINDING" };
  }

  try {
    // Calculate deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + timeframeDays);
    const deadlineISO = deadline.toISOString();

    // Prepare execution payload
    const payload = {
      caseId: caseData.caseId,
      creditor: caseData.creditor,
      threadId: caseData.threadId,
      templateKey,
      track,
      channel,
      description,
      priority: planPriority,
      posture: planPosture,
      deadline: deadlineISO,
      binding: {
        googleDocId: binding.googleDocId,
        notionTemplateId: binding.notionTemplateId,
        makeScenarioId: binding.makeScenarioId,
        driveFolderPath: binding.driveFolderPath
      }
    };

    // Log execution intent
    console.log(`[Router v6] Executing action: ${templateKey} for case ${caseData.caseId}`);
    console.log(`  Track: ${track}, Channel: ${channel}`);
    console.log(`  Deadline: ${deadlineISO} (${timeframeDays} days)`);
    console.log(`  Make Scenario ID: ${binding.makeScenarioId}`);

    // In production, this would:
    // 1) Call Google Drive API to create folder
    // 2) Copy Google Doc template
    // 3) Export PDF
    // 4) Trigger Make.com scenario via webhook
    // 5) Update Notion case
    // 6) Add to Google Calendar
    // 7) Send Slack notification

    // For now, return mock success
    return {
      ok: true,
      docId: `mock-doc-${templateKey}`,
      pdfId: `mock-pdf-${templateKey}`,
      deadline: deadlineISO,
      makeRunId: `mock-run-${Date.now()}`,
      payload
    };

  } catch (err) {
    console.error(`[Router v6] Execution error for ${templateKey}:`, err);
    return {
      ok: false,
      error: err.message
    };
  }
}

/**
 * Execute ALL actions in a Countermeasure Plan
 * @param {Object} plan
 * @param {Array} plan.actions
 * @param {string} plan.priority
 * @param {string} plan.posture
 * @param {Object} caseData
 * @returns {Promise<ExecutionResult[]>}
 */
async function executePlan(plan, caseData) {
  const results = [];

  console.log(`[Router v6] Executing plan with ${plan.actions.length} actions for case ${caseData.caseId}`);

  for (const action of plan.actions) {
    const result = await executeAction(
      action,
      caseData,
      plan.priority,
      plan.posture
    );
    results.push(result);

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const successCount = results.filter(r => r.ok).length;
  console.log(`[Router v6] Execution complete: ${successCount}/${results.length} succeeded`);

  return results;
}

/**
 * Get execution summary statistics
 * @param {ExecutionResult[]} results
 * @returns {Object}
 */
function getExecutionSummary(results) {
  const total = results.length;
  const succeeded = results.filter(r => r.ok).length;
  const failed = total - succeeded;

  return {
    total,
    succeeded,
    failed,
    successRate: total > 0 ? (succeeded / total * 100).toFixed(1) + '%' : '0%',
    results
  };
}

module.exports = {
  executeAction,
  executePlan,
  getExecutionSummary
};
