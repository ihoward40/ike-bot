// utils/live-stream-processor.js
// v12A — Live Stream Processor (Event Watcher)

const { logTelemetry } = require("./telemetry-engine");
const { buildCaseLinks } = require("./case-linker");
const { computeCaseInfluence } = require("./case-influence");
const { getCases, updateCase } = require("../services/case-service");

/**
 * Handle incoming event and trigger appropriate reactions
 * @param {Object} event
 * @returns {Promise<Object>}
 */
async function handleEvent(event) {
  const enriched = {
    ...event,
    ingestedAt: new Date().toISOString()
  };

  // Always log the event as telemetry
  logTelemetry({
    type: "event",
    source: enriched.source,
    eventType: enriched.type,
    caseId: enriched.payload?.caseId || null
  });

  try {
    // Light, safe reactions based on event type
    switch (event.type) {
      case "execution_failed":
        // Increment fail counters per case in DB
        if (event.payload?.caseId) {
          const failCount = event.payload.failCountIncrement || 1;
          await updateCaseFailCount(event.payload.caseId, failCount);
        }
        break;

      case "case_updated":
      case "email_routed":
        // Rebuild case links when new cases arrive or cases are updated
        await buildCaseLinks();
        break;

      case "evidence_added":
        // Mark case as having fresh docs
        if (event.payload?.caseId) {
          logTelemetry({
            type: "evidence_tracking",
            caseId: event.payload.caseId,
            evidenceType: event.payload.evidenceType || "document"
          });
        }
        break;

      case "health_check":
        // Already logged via telemetry; no extra work needed
        break;

      case "execution_complete":
        // Log successful execution
        if (event.payload?.caseId) {
          logTelemetry({
            type: "execution_success",
            caseId: event.payload.caseId,
            templateKey: event.payload.templateKey
          });
        }
        break;

      default:
        // No specific action, just logged
        break;
    }

    // Optionally recalculate influence scores for affected cases
    if (event.payload?.caseId) {
      await recalcInfluenceForCase(event.payload.caseId);
    }

    return { ok: true, eventProcessed: event.type };
  } catch (error) {
    console.error("Error handling event:", error);
    logTelemetry({
      type: "event_processing_error",
      eventType: event.type,
      error: error.message
    });
    return { ok: false, error: error.message };
  }
}

/**
 * Update case fail count
 * @param {string} caseId
 * @param {number} increment
 * @returns {Promise<void>}
 */
async function updateCaseFailCount(caseId, increment = 1) {
  try {
    const cases = await getCases();
    const target = cases.find(c => c.caseId === caseId);
    
    if (!target) {
      console.warn(`Case not found for fail count update: ${caseId}`);
      return;
    }

    const current = target.telemetryFailCount || 0;
    await updateCase(caseId, { telemetryFailCount: current + increment });
  } catch (error) {
    console.error(`Error updating fail count for ${caseId}:`, error);
  }
}

/**
 * Recalculate influence for a specific case
 * @param {string} caseId
 * @returns {Promise<void>}
 */
async function recalcInfluenceForCase(caseId) {
  try {
    const cases = await getCases();
    const target = cases.find(c => c.caseId === caseId);
    
    if (!target) {
      return;
    }

    const influence = computeCaseInfluence(target);
    await updateCase(caseId, {
      influenceScore: influence.score,
      influenceLabel: influence.label
    });
  } catch (error) {
    console.error(`Error recalculating influence for ${caseId}:`, error);
  }
}

/**
 * Recalculate influence for all cases (use sparingly)
 * @returns {Promise<void>}
 */
async function recalcInfluenceForAllCases() {
  try {
    const cases = await getCases();
    
    for (const c of cases) {
      const influence = computeCaseInfluence(c);
      await updateCase(c.caseId, {
        influenceScore: influence.score,
        influenceLabel: influence.label
      });
    }
  } catch (error) {
    console.error("Error recalculating all case influences:", error);
  }
}

module.exports = {
  handleEvent,
  updateCaseFailCount,
  recalcInfluenceForCase,
  recalcInfluenceForAllCases
};
