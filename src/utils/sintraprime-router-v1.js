// sintraprime-router-v1.js
// SintraPrime Orchestration Router v1
// Purpose: Take a normalized email/message object and decide
// which enforcement / workflow route it should go to.

// --------- Types (JSDoc for clarity) ---------

/**
 * @typedef {Object} NormalizedMessage
 * @property {string} id
 * @property {string} [threadId]
 * @property {string} [source]           // e.g. 'gmail'
 * @property {string} from               // raw from string
 * @property {string[]} to               // array of recipient emails
 * @property {string} [replyTo]
 * @property {string} subject
 * @property {string} bodyText
 * @property {string} [bodyHtml]
 * @property {string} [date]             // ISO string
 * @property {string[]} [labels]         // gmail labels, etc.
 * @property {Object<string,string>} [headers]
 */

/**
 * @typedef {Object} RouteDecision
 * @property {string} dispatchTarget     // e.g. 'VERIZON_ENFORCEMENT'
 * @property {string} creditor           // e.g. 'Verizon Wireless'
 * @property {string} riskLevel          // 'low' | 'medium' | 'high' | 'critical'
 * @property {string[]} tags
 * @property {string[]} matchedRules
 * @property {string} reason
 * @property {Object} meta
 * @property {Object} rawMessage         // passthrough of the normalized message
 */

// --------- Helper: safe text mashup ---------

/**
 * Combine subject + body for keyword scans.
 * @param {NormalizedMessage} msg
 */
function getSearchText(msg) {
  const s = msg.subject || '';
  const b = msg.bodyText || '';
  return (s + '\n' + b).toLowerCase();
}

/**
 * Lowercase sender line once.
 * @param {NormalizedMessage} msg
 */
function getSender(msg) {
  return (msg.from || '').toLowerCase();
}

// --------- Creditor / Case Detection Rules ---------

/**
 * Rule objects return { matched, creditor, dispatchTarget, tags[] }
 */
const CREDITOR_RULES = [
  {
    name: 'VERIZON',
    creditor: 'Verizon',
    dispatchTarget: 'VERIZON_ENFORCEMENT',
    match: (msg, text, from) =>
      from.includes('verizon.com') ||
      text.includes('verizon wireless') ||
      text.includes('verizon fios') ||
      text.includes('verizon communications')
  },
  {
    name: 'IRS',
    creditor: 'IRS',
    dispatchTarget: 'IRS_ENFORCEMENT',
    match: (msg, text, from) =>
      from.includes('@irs.gov') ||
      text.includes('internal revenue service') ||
      text.includes('cp-') || // CP notices
      text.includes('notice of deficiency') ||
      text.includes('intent to levy')
  },
  {
    name: 'WELLS_FARGO',
    creditor: 'Wells Fargo',
    dispatchTarget: 'WELLS_FARGO_ENFORCEMENT',
    match: (msg, text, from) =>
      from.includes('wellsfargo.com') ||
      text.includes('wells fargo')
  },
  {
    name: 'CHASE_EWS',
    creditor: 'Chase / EWS',
    dispatchTarget: 'CHASE_EWS_ENFORCEMENT',
    match: (msg, text, from) =>
      from.includes('chase.com') ||
      from.includes('jpmorganchase.com') ||
      text.includes('early warning services') ||
      text.includes('ews report') ||
      text.includes('account closure by chase')
  },
  {
    name: 'DAKOTA_FINANCIAL',
    creditor: 'Dakota Financial',
    dispatchTarget: 'DAKOTA_FINANCIAL_ENFORCEMENT',
    match: (msg, text, from) =>
      from.includes('dakotafinancial') ||
      text.includes('dakota financial') ||
      text.includes('equipment finance') && text.includes('dakota')
  },
  {
    name: 'TIKTOK',
    creditor: 'TikTok',
    dispatchTarget: 'TIKTOK_ACTIVITY',
    match: (msg, text, from) =>
      from.includes('tiktok.com') ||
      from.includes('tiktokforbusiness') ||
      text.includes('your tiktok account') ||
      text.includes('tiktok ads') ||
      text.includes('tiktok creator')
  }
];

// --------- Risk Scoring ---------

const RISK_KEYWORDS = [
  { word: 'final notice', score: 4 },
  { word: 'termination', score: 4 },
  { word: 'service disconnected', score: 4 },
  { word: 'disconnected', score: 3 },
  { word: 'suspension', score: 3 },
  { word: 'collections', score: 3 },
  { word: 'charge-off', score: 3 },
  { word: 'foreclosure', score: 4 },
  { word: 'repossession', score: 4 },
  { word: 'levy', score: 4 },
  { word: 'lien', score: 3 },
  { word: 'court', score: 2 },
  { word: 'lawsuit', score: 3 },
  { word: 'negative credit', score: 3 },
  { word: 'credit bureau', score: 2 },
  { word: 'dispute denied', score: 3 },
  { word: 'shut off', score: 3 },
  { word: 'past due', score: 2 },
  { word: 'overdue', score: 2 }
];

/**
 * @param {string} text
 * @returns {{score: number, level: string, matchedWords: string[]}}
 */
function computeRisk(text) {
  let score = 0;
  const matchedWords = [];
  for (const kw of RISK_KEYWORDS) {
    if (text.includes(kw.word)) {
      score += kw.score;
      matchedWords.push(kw.word);
    }
  }

  let level = 'low';
  if (score >= 10) level = 'critical';
  else if (score >= 6) level = 'high';
  else if (score >= 3) level = 'medium';

  return { score, level, matchedWords };
}

// --------- Dishonor Prediction Placeholder ---------

/**
 * Very simple dishonor prediction stub for v1.
 * You can later wire this into SintraPrime's deeper model.
 *
 * @param {NormalizedMessage} msg
 * @param {string} text
 */
function predictDishonor(msg, text) {
  const lower = text;
  const flags = [];

  if (lower.includes('we will not respond further')) {
    flags.push('refusal_to_engage');
  }
  if (lower.includes('this is our final decision')) {
    flags.push('final_decision_language');
  }
  if (lower.includes('we are unable to locate') || lower.includes('no record of')) {
    flags.push('record_denial');
  }

  const dishonorLikelihood =
    flags.length >= 2 ? 'high' :
    flags.length === 1 ? 'medium' :
    'low';

  return { dishonorLikelihood, flags };
}

// --------- Beneficiary Protection Placeholder ---------

/**
 * @param {string} text
 */
function detectBeneficiaryImpact(text) {
  const markers = ['child', 'housing', 'medical', 'eviction', 'disability', 'family'];
  const hits = markers.filter(m => text.includes(m));
  const flag = hits.length > 0;
  let severity = 'none';
  if (hits.length >= 3) severity = 'high';
  else if (hits.length >= 1) severity = 'medium';

  return {
    beneficiaryFlag: flag,
    severity,
    markers: hits
  };
}

// --------- Main Routing Function ---------

/**
 * Main router function.
 * @param {NormalizedMessage} msg
 * @returns {RouteDecision}
 */
function routeMessage(msg) {
  if (!msg || !msg.from || !msg.subject) {
    throw new Error('routeMessage: invalid message payload – missing basic fields.');
  }

  const text = getSearchText(msg);
  const from = getSender(msg);

  /** @type {string[]} */
  const matchedRules = [];
  let creditor = 'General';
  let dispatchTarget = 'GENERAL_INBOX';
  const tags = [];

  // 1. Creditor detection
  for (const rule of CREDITOR_RULES) {
    if (rule.match(msg, text, from)) {
      matchedRules.push(rule.name);
      creditor = rule.creditor;
      dispatchTarget = rule.dispatchTarget;
      tags.push(`creditor:${rule.name.toLowerCase()}`);
      break; // first match wins for v1
    }
  }

  // 2. Risk scoring
  const { level: riskLevel, matchedWords } = computeRisk(text);
  if (matchedWords.length) {
    tags.push('risk_keywords');
  }

  // 3. Dishonor prediction
  const dishonor = predictDishonor(msg, text);
  if (dishonor.dishonorLikelihood !== 'low') {
    tags.push('dishonor_watch');
  }

  // 4. Beneficiary protection
  const beneficiary = detectBeneficiaryImpact(text);
  if (beneficiary.beneficiaryFlag) {
    tags.push('beneficiary_impact');
  }

  // 5. Reason string for logs / Make.com mapping
  const reasonParts = [];
  reasonParts.push(`Route: ${dispatchTarget}`);
  reasonParts.push(`Creditor: ${creditor}`);
  reasonParts.push(`Risk: ${riskLevel}`);
  if (matchedWords.length) {
    reasonParts.push(`RiskKeywords: ${matchedWords.join(', ')}`);
  }
  if (dishonor.flags.length) {
    reasonParts.push(`DishonorFlags: ${dishonor.flags.join(', ')}`);
  }
  if (beneficiary.beneficiaryFlag) {
    reasonParts.push(`BeneficiaryMarkers: ${beneficiary.markers.join(', ')}`);
  }

  /** @type {RouteDecision} */
  const result = {
    dispatchTarget,
    creditor,
    riskLevel,
    tags,
    matchedRules,
    reason: reasonParts.join(' | '),
    meta: {
      dishonorPrediction: dishonor,
      beneficiaryImpact: beneficiary,
      source: msg.source || 'gmail',
      receivedAt: msg.date || new Date().toISOString()
    },
    rawMessage: msg
  };

  return result;
}

// --------- Export ---------

module.exports = {
  routeMessage
};
