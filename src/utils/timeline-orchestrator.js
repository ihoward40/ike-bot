// timeline-orchestrator.js
// Router v5 — Multi-Creditor Timeline Orchestrator

/**
 * @typedef {Object} CountermeasureAction
 * @property {string} track
 * @property {string} channel
 * @property {string} templateKey
 * @property {number} timeframeDays
 * @property {string} description
 */

/**
 * @typedef {Object} CountermeasurePlan
 * @property {string} priority
 * @property {string} posture
 * @property {string} recommendedPath
 * @property {CountermeasureAction[]} actions
 * @property {boolean} requiresHumanReview
 * @property {string[]} flags
 * @property {string} narrative
 */

/**
 * @typedef {Object} TimelineEvent
 * @property {string} id
 * @property {string} caseId
 * @property {string} creditor
 * @property {string} track
 * @property {string} channel
 * @property {string} templateKey
 * @property {string} title
 * @property {string} description
 * @property {string} priority
 * @property {string} posture
 * @property {string} dueDateISO
 * @property {number} daysFromNow
 * @property {boolean} requiresHumanReview
 * @property {string[]} flags
 */

/**
 * Build a timeline from a countermeasure plan
 * @param {CountermeasurePlan} plan
 * @param {Object} caseInfo
 * @param {string} caseInfo.caseId
 * @param {string} caseInfo.creditor
 * @param {string} [caseInfo.startDate] - ISO date string, defaults to now
 * @returns {TimelineEvent[]}
 */
function buildCaseTimeline(plan, caseInfo) {
  const startDate = caseInfo.startDate ? new Date(caseInfo.startDate) : new Date();
  const timeline = [];

  for (const action of plan.actions) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + action.timeframeDays);

    const event = {
      id: `${caseInfo.caseId}-${action.templateKey}-${Date.now()}`,
      caseId: caseInfo.caseId,
      creditor: caseInfo.creditor,
      track: action.track,
      channel: action.channel,
      templateKey: action.templateKey,
      title: `${action.track}/${action.channel}: ${action.templateKey}`,
      description: action.description,
      priority: plan.priority,
      posture: plan.posture,
      dueDateISO: dueDate.toISOString(),
      daysFromNow: action.timeframeDays,
      requiresHumanReview: plan.requiresHumanReview,
      flags: plan.flags
    };

    timeline.push(event);
  }

  return timeline.sort((a, b) => a.daysFromNow - b.daysFromNow);
}

/**
 * Merge multiple case timelines into a global timeline
 * @param {TimelineEvent[][]} caseTimelines
 * @returns {TimelineEvent[]}
 */
function mergeGlobalTimeline(caseTimelines) {
  const merged = [];
  const now = new Date();

  for (const timeline of caseTimelines) {
    for (const event of timeline) {
      const dueDate = new Date(event.dueDateISO);
      const diffMs = dueDate.getTime() - now.getTime();
      const daysFromNow = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      merged.push({
        ...event,
        daysFromNow
      });
    }
  }

  return merged.sort((a, b) => {
    if (a.daysFromNow !== b.daysFromNow) {
      return a.daysFromNow - b.daysFromNow;
    }
    // Secondary sort: priority (critical > high > medium > low)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
  });
}

/**
 * Filter timeline events by date range
 * @param {TimelineEvent[]} timeline
 * @param {Object} options
 * @param {number} [options.daysAhead=7] - Number of days to look ahead
 * @param {boolean} [options.includeOverdue=true] - Include overdue items
 * @returns {TimelineEvent[]}
 */
function filterTimeline(timeline, options = {}) {
  const daysAhead = options.daysAhead !== undefined ? options.daysAhead : 7;
  const includeOverdue = options.includeOverdue !== undefined ? options.includeOverdue : true;

  return timeline.filter(event => {
    if (includeOverdue && event.daysFromNow < 0) return true;
    return event.daysFromNow >= 0 && event.daysFromNow <= daysAhead;
  });
}

/**
 * Group timeline events by buckets (today, overdue, next 3 days, etc.)
 * @param {TimelineEvent[]} timeline
 * @returns {Object}
 */
function groupTimelineBuckets(timeline) {
  const buckets = {
    overdue: [],
    today: [],
    tomorrow: [],
    next_3_days: [],
    next_7_days: [],
    beyond: []
  };

  for (const event of timeline) {
    const days = event.daysFromNow;

    if (days < 0) {
      buckets.overdue.push(event);
    } else if (days === 0) {
      buckets.today.push(event);
    } else if (days === 1) {
      buckets.tomorrow.push(event);
    } else if (days <= 3) {
      buckets.next_3_days.push(event);
    } else if (days <= 7) {
      buckets.next_7_days.push(event);
    } else {
      buckets.beyond.push(event);
    }
  }

  return buckets;
}

/**
 * Format a timeline event as a human-readable summary
 * @param {TimelineEvent} event
 * @returns {string}
 */
function formatEventSummary(event) {
  const dueStr = event.daysFromNow === 0 ? "TODAY" :
    event.daysFromNow === 1 ? "TOMORROW" :
    event.daysFromNow < 0 ? `OVERDUE (${Math.abs(event.daysFromNow)}d ago)` :
    `in ${event.daysFromNow}d`;

  const priorityEmoji = event.priority === "critical" ? "🚨" :
    event.priority === "high" ? "⚠️" :
    event.priority === "medium" ? "📌" : "ℹ️";

  return `${priorityEmoji} ${dueStr} | ${event.creditor} | ${event.track}/${event.channel} | ${event.templateKey}`;
}

/**
 * Format full daily briefing text
 * @param {TimelineEvent[]} timeline
 * @returns {string}
 */
function formatDailyBriefing(timeline) {
  const buckets = groupTimelineBuckets(timeline);
  const sections = [];

  if (buckets.overdue.length > 0) {
    sections.push("⏰ OVERDUE:");
    sections.push(...buckets.overdue.slice(0, 5).map(e => `  - ${formatEventSummary(e)}`));
    if (buckets.overdue.length > 5) {
      sections.push(`  ... and ${buckets.overdue.length - 5} more overdue items`);
    }
    sections.push("");
  }

  if (buckets.today.length > 0) {
    sections.push("🔥 TODAY:");
    sections.push(...buckets.today.map(e => `  - ${formatEventSummary(e)}`));
    sections.push("");
  }

  if (buckets.tomorrow.length > 0) {
    sections.push("📅 TOMORROW:");
    sections.push(...buckets.tomorrow.map(e => `  - ${formatEventSummary(e)}`));
    sections.push("");
  }

  if (buckets.next_3_days.length > 0) {
    sections.push("📆 NEXT 3 DAYS:");
    sections.push(...buckets.next_3_days.map(e => `  - ${formatEventSummary(e)}`));
    sections.push("");
  }

  const highPriorityWeek = buckets.next_7_days.filter(e => 
    e.priority === "high" || e.priority === "critical"
  );
  if (highPriorityWeek.length > 0) {
    sections.push("⏳ NEXT 7 DAYS (HIGH/CRITICAL ONLY):");
    sections.push(...highPriorityWeek.map(e => `  - ${formatEventSummary(e)}`));
  }

  return sections.join("\n");
}

module.exports = {
  buildCaseTimeline,
  mergeGlobalTimeline,
  filterTimeline,
  groupTimelineBuckets,
  formatEventSummary,
  formatDailyBriefing
};
