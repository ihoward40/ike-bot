// utils/action-replay.js
// Action Replay Engine - Retry failed executions

const fs = require("fs");
const path = require("path");
const { logTelemetry } = require("./telemetry-engine");

const TELEMETRY_PATH = path.join(__dirname, "../../data/telemetry-log.jsonl");

/**
 * Read the last failure event from telemetry log
 * @returns {Object|null}
 */
function readLastFailure() {
  try {
    if (!fs.existsSync(TELEMETRY_PATH)) {
      return null;
    }

    const lines = fs
      .readFileSync(TELEMETRY_PATH, "utf8")
      .trim()
      .split("\n")
      .reverse();

    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        if (event.type === "execution" && event.status === "failure") {
          return event;
        }
      } catch {
        // Skip malformed lines
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error("Error reading last failure:", error);
    return null;
  }
}

/**
 * Get all recent failures (last N)
 * @param {number} limit
 * @returns {Array<Object>}
 */
function readRecentFailures(limit = 10) {
  try {
    if (!fs.existsSync(TELEMETRY_PATH)) {
      return [];
    }

    const lines = fs
      .readFileSync(TELEMETRY_PATH, "utf8")
      .trim()
      .split("\n")
      .reverse();

    const failures = [];

    for (const line of lines) {
      if (failures.length >= limit) break;
      
      try {
        const event = JSON.parse(line);
        if (event.type === "execution" && event.status === "failure") {
          failures.push(event);
        }
      } catch {
        continue;
      }
    }

    return failures;
  } catch (error) {
    console.error("Error reading recent failures:", error);
    return [];
  }
}

/**
 * Replay a specific action (requires execution engine)
 * @param {Object} failureEvent
 * @param {Function} executeActionFn - The execute function from execution engine
 * @returns {Promise<Object>}
 */
async function replayAction(failureEvent, executeActionFn) {
  try {
    logTelemetry({
      type: "replay_attempt",
      originalFailure: failureEvent.timestamp,
      caseId: failureEvent.caseId,
      templateKey: failureEvent.templateKey
    });

    const action = {
      templateKey: failureEvent.templateKey,
      track: failureEvent.track,
      channel: failureEvent.channel
    };

    const caseData = {
      caseId: failureEvent.caseId,
      creditor: failureEvent.creditor
    };

    // Execute the action again
    const result = await executeActionFn(action, caseData);

    logTelemetry({
      type: "replay_result",
      status: result.ok ? "success" : "failure",
      caseId: failureEvent.caseId,
      templateKey: failureEvent.templateKey
    });

    return {
      ok: true,
      replayed: true,
      originalFailure: failureEvent.timestamp,
      result
    };
  } catch (error) {
    console.error("Error replaying action:", error);
    
    logTelemetry({
      type: "replay_result",
      status: "failure",
      caseId: failureEvent.caseId,
      error: error.message
    });

    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Replay the last failed action
 * @param {Function} executeActionFn
 * @returns {Promise<Object|null>}
 */
async function replayLastFailure(executeActionFn) {
  const failure = readLastFailure();
  
  if (!failure) {
    return {
      ok: false,
      message: "No recent failures found"
    };
  }

  return await replayAction(failure, executeActionFn);
}

module.exports = {
  readLastFailure,
  readRecentFailures,
  replayAction,
  replayLastFailure
};
