// utils/case-influence.js
// v11C — Case Influence Weighting Engine

/**
 * Calculate priority score
 * @param {string} priority
 * @returns {number}
 */
function priorityScore(priority) {
  switch ((priority || "").toLowerCase()) {
    case "critical":
      return 8;
    case "high":
      return 5;
    case "medium":
      return 3;
    case "low":
      return 1;
    default:
      return 0;
  }
}

/**
 * Calculate deadline urgency score
 * @param {string} nextDeadline
 * @returns {number}
 */
function deadlineScore(nextDeadline) {
  if (!nextDeadline) return 0;
  
  const msLeft = new Date(nextDeadline) - Date.now();
  const hoursLeft = msLeft / 3600000;

  if (hoursLeft <= 0) return 6;        // Already overdue
  if (hoursLeft <= 24) return 7;       // Under 24 hours
  if (hoursLeft <= 72) return 4;       // Under 72 hours
  if (hoursLeft <= 7 * 24) return 2;   // Within 7 days
  return 0;
}

/**
 * Calculate beneficiary impact score
 * @param {string} impactLevel
 * @returns {number}
 */
function beneficiaryScore(impactLevel) {
  switch ((impactLevel || "").toLowerCase()) {
    case "direct":
      return 5;
    case "indirect":
      return 2;
    default:
      return 0;
  }
}

/**
 * Calculate automation friction score
 * @param {number} failCount
 * @returns {number}
 */
function frictionScore(failCount) {
  if (!failCount || failCount <= 0) return 0;
  if (failCount <= 2) return 2;
  return 4;
}

/**
 * Calculate cluster size score
 * @param {Object} linkedCases
 * @returns {number}
 */
function clusterScore(linkedCases = {}) {
  const totalClusterMembers =
    (linkedCases.relatedByCreditor || []).length +
    (linkedCases.relatedByBeneficiary || []).length +
    (linkedCases.sharedTimelines || []).length;

  if (totalClusterMembers >= 4) return 4;
  if (totalClusterMembers >= 2) return 2;
  return 0;
}

/**
 * Calculate regulator involvement score
 * @param {Array<string>} regulators
 * @returns {number}
 */
function regulatorScore(regulators = []) {
  if (!regulators || regulators.length === 0) return 0;
  return 1;
}

/**
 * Convert total score to label
 * @param {number} total
 * @returns {string}
 */
function labelInfluence(total) {
  if (total >= 13) return "🔥 Critical Focus";
  if (total >= 9) return "🟠 High";
  if (total >= 5) return "🟡 Elevated";
  return "🟢 Stable";
}

/**
 * Compute influence score for a case
 * @param {Object} c - Case object
 * @returns {{score: number, label: string, breakdown: Object}}
 */
function computeCaseInfluence(c) {
  const p = priorityScore(c.priority);
  const d = deadlineScore(c.nextDeadline);
  const b = beneficiaryScore(c.beneficiaryImpact);
  const f = frictionScore(c.telemetryFailCount || 0);
  const cl = clusterScore(c.linkedCases || {});
  const r = regulatorScore((c.linkedCases && c.linkedCases.regulators) || []);

  const total = p + d + b + f + cl + r;

  return {
    score: total,
    label: labelInfluence(total),
    breakdown: {
      priority: p,
      deadline: d,
      beneficiary: b,
      friction: f,
      cluster: cl,
      regulator: r
    }
  };
}

module.exports = {
  computeCaseInfluence,
  priorityScore,
  deadlineScore,
  beneficiaryScore,
  frictionScore,
  clusterScore,
  regulatorScore,
  labelInfluence
};
