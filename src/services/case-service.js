// services/case-service.js
// Notion/DB helpers for cases + deadlines

const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const NOTION_DATABASE_ID = process.env.NOTION_CASES_DATABASE_ID || "b12e9675f58240fa8751dad99a0df320";

/**
 * Get all active cases from Notion
 * @returns {Promise<Array>} Array of active case objects
 */
async function getActiveCases() {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        and: [
          {
            property: "Status",
            select: {
              does_not_equal: "Closed – Won"
            }
          },
          {
            property: "Status",
            select: {
              does_not_equal: "Closed – Settled"
            }
          }
        ]
      },
      sorts: [
        {
          property: "Next Deadline",
          direction: "ascending"
        }
      ]
    });

    return response.results.map(page => ({
      caseId: page.properties["Case ID"]?.title?.[0]?.text?.content || page.id,
      title: page.properties["Name"]?.title?.[0]?.text?.content || "Untitled Case",
      creditor: page.properties["Creditor / Entity"]?.select?.name || "Unknown",
      priority: page.properties["Priority"]?.select?.name || "low",
      status: page.properties["Status"]?.select?.name || "Open",
      nextDeadline: page.properties["Next Deadline"]?.date?.start || null,
      nextActionSummary: page.properties["Next Action Summary"]?.rich_text?.[0]?.text?.content || "",
      beneficiaryImpact: page.properties["Beneficiary Impact"]?.select?.name || "none",
      telemetryFailCount: page.properties["Telemetry Fail Count"]?.number || 0,
      linkedCases: parseLinkedCases(page.properties["Linked Cases JSON"]?.rich_text?.[0]?.text?.content),
      lastTemplateKey: page.properties["Last Action"]?.rich_text?.[0]?.text?.content || null,
      notionPageId: page.id,
      notionPageUrl: page.url
    }));
  } catch (error) {
    console.error("Error fetching active cases:", error);
    return [];
  }
}

/**
 * Get upcoming deadlines (next 7 days)
 * @returns {Promise<Array>} Array of cases with upcoming deadlines
 */
async function getUpcomingDeadlines() {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        and: [
          {
            property: "Next Deadline",
            date: {
              on_or_after: now.toISOString().split('T')[0]
            }
          },
          {
            property: "Next Deadline",
            date: {
              on_or_before: sevenDaysFromNow.toISOString().split('T')[0]
            }
          }
        ]
      },
      sorts: [
        {
          property: "Next Deadline",
          direction: "ascending"
        }
      ]
    });

    return response.results.map(page => ({
      caseId: page.properties["Case ID"]?.title?.[0]?.text?.content || page.id,
      creditor: page.properties["Creditor / Entity"]?.select?.name || "Unknown",
      nextDeadline: page.properties["Next Deadline"]?.date?.start || null,
      priority: page.properties["Priority"]?.select?.name || "low",
      nextActionSummary: page.properties["Next Action Summary"]?.rich_text?.[0]?.text?.content || "",
      notionPageId: page.id
    }));
  } catch (error) {
    console.error("Error fetching upcoming deadlines:", error);
    return [];
  }
}

/**
 * Get all cases (for linking operations)
 * @returns {Promise<Array>}
 */
async function getCases() {
  return await getActiveCases();
}

/**
 * Update a case in Notion
 * @param {string} caseId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
async function updateCase(caseId, updates) {
  try {
    // Find the page by Case ID
    const searchResponse = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: "Case ID",
        title: {
          equals: caseId
        }
      }
    });

    if (searchResponse.results.length === 0) {
      throw new Error(`Case not found: ${caseId}`);
    }

    const pageId = searchResponse.results[0].id;

    // Build properties update object
    const properties = {};

    if (updates.telemetryFailCount !== undefined) {
      properties["Telemetry Fail Count"] = { number: updates.telemetryFailCount };
    }

    if (updates.influenceScore !== undefined) {
      properties["Influence Score"] = { number: updates.influenceScore };
    }

    if (updates.influenceLabel !== undefined) {
      properties["Influence Label"] = { 
        select: { name: updates.influenceLabel }
      };
    }

    if (updates.linkedCases !== undefined) {
      properties["Linked Cases JSON"] = {
        rich_text: [{
          text: { content: JSON.stringify(updates.linkedCases) }
        }]
      };
    }

    // Update the page
    const response = await notion.pages.update({
      page_id: pageId,
      properties
    });

    return {
      ok: true,
      pageId: response.id,
      updated: Object.keys(properties)
    };
  } catch (error) {
    console.error(`Error updating case ${caseId}:`, error);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Parse linked cases JSON string
 * @param {string} jsonString
 * @returns {Object|null}
 */
function parseLinkedCases(jsonString) {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

module.exports = {
  getActiveCases,
  getUpcomingDeadlines,
  getCases,
  updateCase
};
