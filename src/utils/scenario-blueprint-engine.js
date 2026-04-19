// scenario-blueprint-engine.js
// Router v7 — Autonomous Scenario Builder

/**
 * @typedef {Object} ScenarioBlueprint
 * @property {string} id
 * @property {string} name
 * @property {string} templateKey
 * @property {Object} trigger
 * @property {Array<Object>} steps
 * @property {Object} metadata
 */

const SCENARIO_PATTERNS = {
  REGULATOR: ["load_case", "fill_template", "export_pdf", "upload_drive", "log_notion", "slack_notify"],
  ADMIN: ["load_case", "fill_template", "export_pdf", "upload_drive", "log_notion", "slack_notify"],
  IRS_PROCEDURE: ["load_case", "fill_template", "export_pdf", "upload_drive", "log_notion", "calendar_block", "slack_notify"],
  LITIGATION: ["load_case", "fill_template", "export_pdf", "upload_drive", "log_notion", "calendar_block", "slack_notify", "email_alert"],
  MONITOR: ["load_case", "log_notion"]
};

function buildTrigger(templateKey, idSuffix) {
  return {
    type: "http",
    endpoint: `/hook/${templateKey.toLowerCase()}/${idSuffix}`,
    method: "POST",
    expects: ["caseId", "creditor", "docId", "pdfId", "deadline", "threadId"]
  };
}

function buildStep(stepId, patternKey) {
  switch (patternKey) {
    case "load_case":
      return {
        id: `step_${stepId}_load_case`,
        type: "notion.fetchCase",
        description: "Load case data from Notion Master Case Ledger",
        params: { caseId: "{{caseId}}" }
      };
    
    case "fill_template":
      return {
        id: `step_${stepId}_fill_template`,
        type: "google.docs.fill",
        description: "Fill Google Doc template with case data",
        params: {
          docId: "{{docId}}",
          variables: {
            CASE_ID: "{{caseId}}",
            CREDITOR: "{{creditor}}",
            DEADLINE: "{{deadline}}",
            THREAD_ID: "{{threadId}}",
            TEMPLATE_KEY: "{{templateKey}}"
          }
        }
      };
    
    case "export_pdf":
      return {
        id: `step_${stepId}_export_pdf`,
        type: "google.docs.exportPdf",
        description: "Export document as PDF",
        params: {
          docId: "{{docId}}"
        }
      };
    
    case "upload_drive":
      return {
        id: `step_${stepId}_upload_drive`,
        type: "google.drive.move",
        description: "Move PDF to Drive folder",
        params: {
          fileId: "{{pdfId}}",
          folderPath: "/Enforcement/{{creditor}}/{{caseId}}"
        }
      };
    
    case "log_notion":
      return {
        id: `step_${stepId}_log_notion`,
        type: "notion.appendLog",
        description: "Log action in Notion case",
        params: {
          caseId: "{{caseId}}",
          event: "Automation run for template {{templateKey}}",
          documentUrl: "{{docId}}",
          pdfUrl: "{{pdfId}}"
        }
      };
    
    case "calendar_block":
      return {
        id: `step_${stepId}_calendar_block`,
        type: "calendar.createEvent",
        description: "Add deadline to Google Calendar",
        params: {
          title: "{{templateKey}} – {{creditor}} ({{caseId}})",
          date: "{{deadline}}",
          description: "SintraPrime automated deadline",
          reminders: [
            { method: "email", minutes: 1440 },  // 1 day before
            { method: "popup", minutes: 60 }     // 1 hour before
          ]
        }
      };
    
    case "slack_notify":
      return {
        id: `step_${stepId}_slack_notify`,
        type: "slack.postMessage",
        description: "Send Slack notification to enforcement channel",
        params: {
          channel: "#trust-enforcement",
          text: "🔥 *SintraPrime Enforcement Action*\nTemplate: {{templateKey}}\nCase: {{caseId}}\nCreditor: {{creditor}}\nDeadline: {{deadline}}\n\n📄 [Document]({{docId}}) | 📋 [PDF]({{pdfId}})"
        }
      };
    
    case "email_alert":
      return {
        id: `step_${stepId}_email_alert`,
        type: "email.send",
        description: "Send email alert for critical actions",
        params: {
          to: "HowardIsiah@gmail.com",
          subject: "⚠️ SintraPrime Critical Action: {{templateKey}}",
          body: "Case: {{caseId}}\nCreditor: {{creditor}}\nDeadline: {{deadline}}\n\nDocument: {{docId}}\nPDF: {{pdfId}}"
        }
      };
    
    default:
      return null;
  }
}

/**
 * Build a scenario blueprint for one templateKey + track.
 * @param {string} templateKey
 * @param {"ADMIN"|"REGULATOR"|"IRS_PROCEDURE"|"LITIGATION"|"MONITOR"} track
 * @param {Object} [options]
 * @returns {ScenarioBlueprint}
 */
function buildScenarioBlueprint(templateKey, track, options = {}) {
  const pattern = SCENARIO_PATTERNS[track] || SCENARIO_PATTERNS.MONITOR;
  const steps = pattern
    .map((p, idx) => buildStep(idx + 1, p))
    .filter(Boolean);

  const id = `AUTO_${templateKey}`;
  const name = `${templateKey} – ${track} Autopilot`;
  const trigger = buildTrigger(templateKey, track.toLowerCase());

  return {
    id,
    name,
    templateKey,
    track,
    trigger,
    steps,
    metadata: {
      createdBy: "SintraPrime-Router-v7",
      track,
      version: options.version || 1,
      lastUpdated: new Date().toISOString(),
      description: options.description || `Auto-generated scenario for ${templateKey}`
    }
  };
}

/**
 * Build blueprints for all template keys in a given plan.
 * @param {Object} plan
 * @param {Array} plan.actions
 * @returns {ScenarioBlueprint[]}
 */
function buildBlueprintsFromPlan(plan) {
  const seen = new Set();
  const out = [];

  for (const action of plan.actions) {
    const k = action.templateKey;
    if (!k || seen.has(k)) continue;
    seen.add(k);

    const track = action.track || "ADMIN";
    out.push(buildScenarioBlueprint(k, track));
  }

  return out;
}

/**
 * Check which scenarios exist vs which are missing
 * @param {Object} plan
 * @param {Object} registry - Existing scenario registry
 * @returns {Object}
 */
function analyzeScenarioGaps(plan, registry = {}) {
  const needsScenario = [];
  const needsUpdate = [];
  const ready = [];

  for (const action of plan.actions) {
    const templateKey = action.templateKey;
    if (!templateKey) continue;

    const existing = registry[templateKey];

    if (!existing || existing.status !== "active") {
      // Missing or inactive
      const blueprint = buildScenarioBlueprint(templateKey, action.track || "ADMIN");
      needsScenario.push({
        templateKey,
        track: action.track,
        blueprint
      });
    } else if (existing.track !== action.track) {
      // Track changed, needs update
      const blueprint = buildScenarioBlueprint(templateKey, action.track);
      needsUpdate.push({
        templateKey,
        oldTrack: existing.track,
        newTrack: action.track,
        blueprint
      });
    } else {
      // Ready to use
      ready.push(templateKey);
    }
  }

  return {
    needsScenario,
    needsUpdate,
    ready,
    summary: {
      total: new Set(plan.actions.map(a => a.templateKey).filter(Boolean)).size,
      missing: needsScenario.length,
      needsUpdate: needsUpdate.length,
      ready: ready.length
    }
  };
}

/**
 * Export scenario blueprint as Make.com-compatible JSON
 * @param {ScenarioBlueprint} blueprint
 * @returns {Object}
 */
function exportToMakeFormat(blueprint) {
  return {
    name: blueprint.name,
    flow: [
      {
        id: 1,
        module: "gateway:CustomWebHook",
        version: 1,
        parameters: {
          hook: blueprint.id,
          maxResults: 1
        },
        metadata: {
          endpoint: blueprint.trigger.endpoint,
          expects: blueprint.trigger.expects
        }
      },
      ...blueprint.steps.map((step, idx) => ({
        id: idx + 2,
        module: step.type.replace(".", ":"),
        version: 1,
        parameters: step.params,
        metadata: {
          description: step.description
        }
      }))
    ],
    metadata: blueprint.metadata
  };
}

module.exports = {
  buildScenarioBlueprint,
  buildBlueprintsFromPlan,
  analyzeScenarioGaps,
  exportToMakeFormat,
  SCENARIO_PATTERNS
};
