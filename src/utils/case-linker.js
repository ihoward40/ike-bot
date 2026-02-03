// utils/case-linker.js
// v11B — Case Linking Intelligence Engine

const { getCases, updateCase } = require("../services/case-service");
const { logTelemetry } = require("./telemetry-engine");

/**
 * Link cases based on structural relationships
 * @returns {Promise<boolean>}
 */
async function buildCaseLinks() {
  try {
    const cases = await getCases();

    for (const c of cases) {
      const relatedByCreditor = cases
        .filter(x => x.caseId !== c.caseId && x.creditor === c.creditor)
        .map(x => x.caseId);

      const relatedByBeneficiary = cases
        .filter(x => x.caseId !== c.caseId && x.beneficiary === c.beneficiary)
        .map(x => x.caseId);

      const sharedTimelines = cases
        .filter(x => {
          if (x.caseId === c.caseId || !x.nextDeadline || !c.nextDeadline) return false;
          const diff = Math.abs(new Date(x.nextDeadline) - new Date(c.nextDeadline));
          return diff < 3 * 24 * 3600 * 1000; // Within 3 days
        })
        .map(x => x.caseId);

      const relatedByTemplates = cases
        .filter(x =>
          x.caseId !== c.caseId &&
          x.lastTemplateKey &&
          x.lastTemplateKey === c.lastTemplateKey
        )
        .map(x => x.caseId);

      const regulatorMapping = mapRegulators(c.creditor);

      const links = {
        relatedByCreditor,
        relatedByBeneficiary,
        sharedTimelines,
        relatedByTemplates,
        regulators: regulatorMapping
      };

      await updateCase(c.caseId, { linkedCases: links });

      logTelemetry({
        type: "case_linking",
        caseId: c.caseId,
        linksFound: {
          creditor: relatedByCreditor.length,
          beneficiary: relatedByBeneficiary.length,
          timelines: sharedTimelines.length,
          templates: relatedByTemplates.length
        }
      });
    }

    return true;
  } catch (error) {
    console.error("Error building case links:", error);
    logTelemetry({
      type: "case_linking",
      status: "failure",
      error: error.message
    });
    return false;
  }
}

/**
 * Map creditors to their regulators
 * @param {string} creditor
 * @returns {Array<string>}
 */
function mapRegulators(creditor) {
  const REGULATOR_MAP = {
    "Verizon Wireless": ["FCC", "State AG", "BPU"],
    "Verizon Fios": ["BPU", "FCC", "State AG"],
    "Verizon": ["FCC", "BPU", "State AG"],
    "Wells Fargo": ["CFPB", "OCC", "State AG"],
    "Chase": ["CFPB", "OCC", "State AG"],
    "EWS": ["CFPB", "State AG"],
    "IRS": ["TAS", "TIGTA"],
    "Dakota Financial": ["State AG", "CFPB"],
    "Experian": ["CFPB", "State AG"],
    "Equifax": ["CFPB", "State AG"],
    "TransUnion": ["CFPB", "State AG"],
    "TikTok": ["FTC", "State AG"]
  };

  return REGULATOR_MAP[creditor] || ["State AG"];
}

module.exports = {
  buildCaseLinks,
  mapRegulators
};
