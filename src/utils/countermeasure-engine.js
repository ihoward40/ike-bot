// countermeasure-engine.js
// Router v4 Countermeasure Engine — decides recommended next moves.
// Purpose: Transform routing data + persona into actionable enforcement plans

/**
 * @typedef {Object} CountermeasureAction
 * @property {string} track          // e.g. 'ADMIN', 'REGULATOR', 'LITIGATION', 'MONITOR'
 * @property {string} channel        // e.g. 'INTERNAL', 'CFPB', 'FCC', 'BPU', 'COURT', 'TAS'
 * @property {string} templateKey    // key to your document/automation template
 * @property {number} timeframeDays  // target window to execute
 * @property {string} description    // human-readable explanation
 * @property {boolean} requiresEvidence // needs documentation gathering first
 * @property {string[]} prerequisites // other actions that must complete first
 */

/**
 * @typedef {Object} CountermeasurePlan
 * @property {string} priority       // 'low' | 'medium' | 'high' | 'critical'
 * @property {string} posture        // 'observe' | 'press' | 'enforce' | 'emergency'
 * @property {string} recommendedPath // overall strategy description
 * @property {CountermeasureAction[]} actions
 * @property {boolean} requiresHumanReview
 * @property {string[]} flags        // warning flags for escalation
 * @property {string} narrative      // explanation for case file
 * @property {Object} timelines      // key deadline map
 */

/**
 * @typedef {Object} RouterV2Decision
 * @property {string} dispatchTarget
 * @property {string} creditor
 * @property {string} riskLevel
 * @property {string[]} tags
 * @property {Object} meta
 * @property {Object} meta.dishonorPrediction
 * @property {string} meta.dishonorPrediction.dishonorLikelihood
 * @property {string[]} meta.dishonorPrediction.flags
 * @property {Object} meta.beneficiaryImpact
 * @property {boolean} meta.beneficiaryImpact.beneficiaryFlag
 * @property {string} meta.beneficiaryImpact.severity
 */

/**
 * @typedef {Object} RouterV3Persona
 * @property {string} behaviorProfile  // 'ADVERSARIAL', 'PROCEDURAL', 'COOPERATIVE', 'NEGLECTFUL'
 * @property {string} responsePattern  // 'STONEWALLING', 'BOILERPLATE', 'ENGAGED', 'SILENT'
 * @property {number} trustScore       // 0-100
 * @property {string[]} flags          // behavior flags
 */

// ========================
// Priority & Posture Logic
// ========================

/**
 * Decide priority level and enforcement posture.
 * @param {RouterV2Decision} routerDecision
 * @param {RouterV3Persona} [persona]
 * @returns {{priority: string, posture: string, flags: string[]}}
 */
function decidePriorityAndPosture(routerDecision, persona) {
  const flags = [];
  let priority = 'medium';
  let posture = 'press'; // default: active but not emergency

  // 1. Check risk level from router
  if (routerDecision.riskLevel === 'critical') {
    priority = 'critical';
    posture = 'emergency';
    flags.push('CRITICAL_RISK');
  } else if (routerDecision.riskLevel === 'high') {
    priority = 'high';
    posture = 'enforce';
    flags.push('HIGH_RISK');
  } else if (routerDecision.riskLevel === 'low') {
    priority = 'low';
    posture = 'observe';
  }

  // 2. Check dishonor prediction
  const dishonor = routerDecision.meta?.dishonorPrediction;
  if (dishonor?.dishonorLikelihood === 'high') {
    if (priority !== 'critical') priority = 'high';
    // Only change posture if not already emergency
    if (posture !== 'emergency') posture = 'enforce';
    flags.push('DISHONOR_LIKELY');
  }

  // 3. Check beneficiary impact
  const beneficiary = routerDecision.meta?.beneficiaryImpact;
  if (beneficiary?.beneficiaryFlag && beneficiary.severity === 'high') {
    if (priority === 'low' || priority === 'medium') {
      priority = 'high';
    }
    flags.push('BENEFICIARY_AT_RISK');
  }

  // 4. Factor in persona if available
  if (persona) {
    if (persona.behaviorProfile === 'ADVERSARIAL') {
      flags.push('ADVERSARIAL_ENTITY');
      if (posture === 'observe') posture = 'press';
    }
    
    if (persona.responsePattern === 'STONEWALLING') {
      flags.push('STONEWALLING');
      if (posture !== 'emergency') posture = 'enforce';
    }

    if (persona.trustScore < 20) {
      flags.push('ZERO_TRUST');
      if (priority === 'low') priority = 'medium';
    }
  }

  return { priority, posture, flags };
}

// ========================
// Track & Channel Selection
// ========================

/**
 * Decide which enforcement track(s) to use.
 * @param {string} creditor
 * @param {string} posture
 * @param {string[]} flags
 * @returns {string[]} - Array of tracks: 'ADMIN', 'REGULATOR', 'LITIGATION', 'MONITOR'
 */
function selectTracks(creditor, posture, flags) {
  const tracks = [];

  if (posture === 'observe') {
    return ['MONITOR'];
  }

  // Start with admin for most cases
  if (posture === 'press' || posture === 'enforce') {
    tracks.push('ADMIN');
  }

  // Add regulator for specific creditors or high-risk situations
  if (flags.includes('DISHONOR_LIKELY') || flags.includes('STONEWALLING')) {
    tracks.push('REGULATOR');
  }

  // Telecom-specific regulators
  if (creditor === 'Verizon' && (posture === 'enforce' || posture === 'emergency')) {
    if (!tracks.includes('REGULATOR')) tracks.push('REGULATOR');
  }

  // Banking-specific escalation
  if ((creditor === 'Wells Fargo' || creditor === 'Chase / EWS') && flags.includes('HIGH_RISK')) {
    if (!tracks.includes('REGULATOR')) tracks.push('REGULATOR');
  }

  // IRS always needs specialized track
  if (creditor === 'IRS') {
    tracks.push('IRS_PROCEDURE');
  }

  // Emergency = prep for litigation
  if (posture === 'emergency') {
    tracks.push('LITIGATION');
  }

  return tracks.length > 0 ? tracks : ['ADMIN'];
}

/**
 * Map creditor to appropriate regulatory channels.
 * @param {string} creditor
 * @returns {string[]}
 */
function getRegulatorChannels(creditor) {
  const channelMap = {
    'Verizon': ['FCC', 'BPU', 'STATE_AG'],
    'Wells Fargo': ['CFPB', 'OCC', 'STATE_AG'],
    'Chase / EWS': ['CFPB', 'OCC', 'STATE_AG'],
    'IRS': ['TAS', 'TIGTA'],
    'Dakota Financial': ['CFPB', 'STATE_AG'],
    'TikTok': ['FTC', 'STATE_AG']
  };

  return channelMap[creditor] || ['CFPB', 'STATE_AG'];
}

// ========================
// Action Builder
// ========================

/**
 * Build the action plan based on tracks.
 * @param {string[]} tracks
 * @param {string} creditor
 * @param {string} priority
 * @param {RouterV2Decision} routerDecision
 * @returns {CountermeasureAction[]}
 */
function buildActions(tracks, creditor, priority, routerDecision) {
  const actions = [];

  // ADMIN track actions
  if (tracks.includes('ADMIN')) {
    if (priority === 'critical') {
      actions.push({
        track: 'ADMIN',
        channel: 'INTERNAL',
        templateKey: 'FINAL_LEGAL_DEMAND',
        timeframeDays: 3,
        description: 'Send final legal demand with statutory citations',
        requiresEvidence: true,
        prerequisites: []
      });
    } else if (priority === 'high') {
      actions.push({
        track: 'ADMIN',
        channel: 'INTERNAL',
        templateKey: 'FORMAL_DISPUTE_LETTER',
        timeframeDays: 7,
        description: 'Send formal dispute letter citing violations',
        requiresEvidence: true,
        prerequisites: []
      });
    } else {
      actions.push({
        track: 'ADMIN',
        channel: 'INTERNAL',
        templateKey: 'ADMIN_FOLLOW_UP',
        timeframeDays: 15,
        description: 'Send administrative follow-up requesting response',
        requiresEvidence: false,
        prerequisites: []
      });
    }
  }

  // REGULATOR track actions
  if (tracks.includes('REGULATOR')) {
    const channels = getRegulatorChannels(creditor);
    
    actions.push({
      track: 'REGULATOR',
      channel: channels[0], // Primary regulator
      templateKey: 'REGULATOR_COMPLAINT',
      timeframeDays: priority === 'critical' ? 5 : 15,
      description: `File complaint with ${channels[0]} with full documentation`,
      requiresEvidence: true,
      prerequisites: ['ADMIN']
    });

    // Add secondary regulators for high/critical priority
    if (priority === 'high' || priority === 'critical') {
      if (channels.length > 1) {
        actions.push({
          track: 'REGULATOR',
          channel: channels[1],
          templateKey: 'REGULATOR_COMPLAINT_SECONDARY',
          timeframeDays: priority === 'critical' ? 7 : 21,
          description: `File parallel complaint with ${channels[1]}`,
          requiresEvidence: true,
          prerequisites: ['ADMIN']
        });
      }
    }
  }

  // IRS_PROCEDURE track (special handling)
  if (tracks.includes('IRS_PROCEDURE')) {
    if (routerDecision.meta?.dishonorPrediction?.flags?.includes('record_denial')) {
      actions.push({
        track: 'IRS_PROCEDURE',
        channel: 'TAS',
        templateKey: 'TAS_ASSISTANCE_REQUEST',
        timeframeDays: 10,
        description: 'Request Taxpayer Advocate Service intervention',
        requiresEvidence: true,
        prerequisites: []
      });
    } else {
      actions.push({
        track: 'IRS_PROCEDURE',
        channel: 'IRS',
        templateKey: 'IRS_PROCEDURAL_RESPONSE',
        timeframeDays: 30,
        description: 'Submit procedural response to IRS notice',
        requiresEvidence: true,
        prerequisites: []
      });
    }
  }

  // LITIGATION track (emergency only)
  if (tracks.includes('LITIGATION')) {
    actions.push({
      track: 'LITIGATION',
      channel: 'COURT',
      templateKey: 'TRO_PREP',
      timeframeDays: 1,
      description: 'Prepare TRO/emergency injunction documentation',
      requiresEvidence: true,
      prerequisites: ['ADMIN', 'REGULATOR']
    });

    actions.push({
      track: 'LITIGATION',
      channel: 'INTERNAL',
      templateKey: 'LITIGATION_EVIDENCE_PACKAGE',
      timeframeDays: 3,
      description: 'Assemble complete litigation evidence package',
      requiresEvidence: true,
      prerequisites: []
    });
  }

  // MONITOR track (low priority / observe posture)
  if (tracks.includes('MONITOR')) {
    actions.push({
      track: 'MONITOR',
      channel: 'INTERNAL',
      templateKey: 'MONITORING_LOG',
      timeframeDays: 30,
      description: 'Continue monitoring communications, no immediate action',
      requiresEvidence: false,
      prerequisites: []
    });
  }

  return actions;
}

// ========================
// Timeline Calculator
// ========================

/**
 * Calculate key deadlines based on actions.
 * @param {CountermeasureAction[]} actions
 * @returns {Object}
 */
function calculateTimelines(actions) {
  const now = new Date();
  const timelines = {};

  // Sort actions by timeframe
  const sorted = [...actions].sort((a, b) => a.timeframeDays - b.timeframeDays);

  if (sorted.length > 0) {
    const first = sorted[0];
    const firstDate = new Date(now);
    firstDate.setDate(firstDate.getDate() + first.timeframeDays);
    timelines.immediate = {
      action: first.templateKey,
      deadline: firstDate.toISOString().split('T')[0],
      days: first.timeframeDays
    };
  }

  // Find the longest timeframe for final deadline
  const last = sorted[sorted.length - 1];
  const lastDate = new Date(now);
  lastDate.setDate(lastDate.getDate() + last.timeframeDays);
  timelines.final = {
    action: last.templateKey,
    deadline: lastDate.toISOString().split('T')[0],
    days: last.timeframeDays
  };

  // Add standard regulatory deadlines
  const fifteenDay = new Date(now);
  fifteenDay.setDate(fifteenDay.getDate() + 15);
  timelines.fifteenDayNotice = fifteenDay.toISOString().split('T')[0];

  const thirtyDay = new Date(now);
  thirtyDay.setDate(thirtyDay.getDate() + 30);
  timelines.thirtyDayDispute = thirtyDay.toISOString().split('T')[0];

  return timelines;
}

// ========================
// Narrative Generator
// ========================

/**
 * Generate human-readable narrative for the case file.
 * @param {string} creditor
 * @param {string} posture
 * @param {string[]} flags
 * @param {CountermeasureAction[]} actions
 * @returns {string}
 */
function generateNarrative(creditor, posture, flags, actions) {
  const parts = [];

  parts.push(`Creditor: ${creditor}`);
  parts.push(`Enforcement Posture: ${posture.toUpperCase()}`);

  if (flags.length > 0) {
    parts.push(`Active Flags: ${flags.join(', ')}`);
  }

  parts.push(`\nRecommended Actions (${actions.length} total):`);
  
  actions.forEach((action, idx) => {
    parts.push(
      `${idx + 1}. [${action.track}] ${action.description} (${action.timeframeDays} days)`
    );
  });

  if (flags.includes('BENEFICIARY_AT_RISK')) {
    parts.push('\n⚠️ BENEFICIARY PROTECTION: High-priority due to impact on vulnerable beneficiaries.');
  }

  if (flags.includes('DISHONOR_LIKELY')) {
    parts.push('\n⚠️ DISHONOR PREDICTION: High likelihood of continued refusal to cooperate. Escalation recommended.');
  }

  if (flags.includes('STONEWALLING')) {
    parts.push('\n⚠️ STONEWALLING DETECTED: Entity is engaging in delay tactics. Regulatory intervention advised.');
  }

  return parts.join('\n');
}

// ========================
// Human Review Decision
// ========================

/**
 * Determine if human review is required before execution.
 * @param {string} priority
 * @param {string} posture
 * @param {CountermeasureAction[]} actions
 * @returns {boolean}
 */
function requiresHumanReview(priority, posture, actions) {
  // Critical priority always needs review
  if (priority === 'critical') return true;

  // Emergency posture needs review
  if (posture === 'emergency') return true;

  // Litigation track needs review
  if (actions.some(a => a.track === 'LITIGATION')) return true;

  // Multiple regulator filings need review
  const regulatorActions = actions.filter(a => a.track === 'REGULATOR');
  if (regulatorActions.length > 1) return true;

  // Otherwise, automation can proceed
  return false;
}

// ========================
// Main Countermeasure Function
// ========================

/**
 * Generate countermeasure plan from routing decision and persona.
 * @param {RouterV2Decision} routerDecision - Output from sintraprime-router-v1.js
 * @param {RouterV3Persona} [persona] - Optional behavior profile
 * @param {Object} [history] - Optional historical data
 * @returns {CountermeasurePlan}
 */
function generateCountermeasures(routerDecision, persona = null, history = null) {
  if (!routerDecision || !routerDecision.creditor) {
    throw new Error('generateCountermeasures: invalid routerDecision');
  }

  // Step 1: Decide priority and posture
  const { priority, posture, flags } = decidePriorityAndPosture(routerDecision, persona);

  // Step 2: Select enforcement tracks
  const tracks = selectTracks(routerDecision.creditor, posture, flags);

  // Step 3: Build action list
  const actions = buildActions(tracks, routerDecision.creditor, priority, routerDecision);

  // Step 4: Calculate timelines
  const timelines = calculateTimelines(actions);

  // Step 5: Generate narrative
  const narrative = generateNarrative(routerDecision.creditor, posture, flags, actions);

  // Step 6: Determine human review requirement
  const needsReview = requiresHumanReview(priority, posture, actions);

  // Step 7: Select recommended path
  const recommendedPath = posture === 'emergency' 
    ? 'EMERGENCY_INTERVENTION'
    : posture === 'enforce'
    ? 'AGGRESSIVE_ENFORCEMENT'
    : posture === 'press'
    ? 'ACTIVE_DISPUTE_MANAGEMENT'
    : 'MONITORING_MODE';

  return {
    priority,
    posture,
    recommendedPath,
    actions,
    requiresHumanReview: needsReview,
    flags,
    narrative,
    timelines
  };
}

// ========================
// Exports
// ========================

module.exports = {
  generateCountermeasures,
  decidePriorityAndPosture,
  selectTracks,
  getRegulatorChannels,
  buildActions,
  calculateTimelines,
  generateNarrative,
  requiresHumanReview
};
