// notion-case-linker.js
// SintraPrime Notion Case Auto-Linker v1
// Purpose: Automatically link emails to existing cases or create new ones

const { Client } = require('@notionhq/client');

/**
 * @typedef {Object} CaseLinkResult
 * @property {boolean} isNew
 * @property {string} caseId - Notion page ID
 * @property {string} caseTitle
 * @property {string} caseUrl
 * @property {string} action - 'created' | 'updated' | 'appended'
 */

class NotionCaseLinker {
  constructor(apiKey, databaseId) {
    this.notion = new Client({ auth: apiKey });
    this.databaseId = databaseId;
  }

  /**
   * Main linking function - finds or creates a case
   * @param {Object} routerOutput - Output from sintraprime-router-v1.js
   * @param {Object} emailData - Raw email data
   * @returns {Promise<CaseLinkResult>}
   */
  async linkOrCreateCase(routerOutput, emailData) {
    const {
      creditor,
      dispatchTarget,
      riskLevel,
      tags,
      meta
    } = routerOutput;

    // Step 1: Try to find existing case
    const existingCase = await this.findExistingCase(
      creditor,
      emailData.threadId || emailData.subject
    );

    if (existingCase) {
      // Step 2a: Update existing case
      await this.updateCase(existingCase.id, routerOutput, emailData);
      return {
        isNew: false,
        caseId: existingCase.id,
        caseTitle: existingCase.properties['Case Title']?.title[0]?.plain_text || 'Untitled',
        caseUrl: existingCase.url,
        action: 'updated'
      };
    } else {
      // Step 2b: Create new case
      const newCase = await this.createCase(routerOutput, emailData);
      return {
        isNew: true,
        caseId: newCase.id,
        caseTitle: newCase.properties['Case Title']?.title[0]?.plain_text || 'Untitled',
        caseUrl: newCase.url,
        action: 'created'
      };
    }
  }

  /**
   * Find existing case by creditor and thread/subject
   */
  async findExistingCase(creditor, identifierKey) {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          and: [
            {
              property: 'Creditor / Entity',
              select: {
                equals: creditor
              }
            },
            {
              property: 'Current Status',
              select: {
                does_not_equal: 'Archived'
              }
            }
          ]
        },
        sorts: [
          {
            property: 'Last Communication Date',
            direction: 'descending'
          }
        ],
        page_size: 10
      });

      // Look for exact thread match or similar subject
      for (const page of response.results) {
        const summary = page.properties['Summary']?.rich_text[0]?.plain_text || '';
        if (summary.includes(identifierKey) || identifierKey.includes(summary.substring(0, 50))) {
          return page;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding existing case:', error);
      return null;
    }
  }

  /**
   * Create a new case in Notion
   */
  async createCase(routerOutput, emailData) {
    const {
      creditor,
      dispatchTarget,
      riskLevel,
      tags,
      meta,
      reason
    } = routerOutput;

    const caseTitle = this.generateCaseTitle(creditor, emailData);
    const caseType = this.inferCaseType(tags, emailData);

    const properties = {
      'Case Title': {
        title: [{ text: { content: caseTitle } }]
      },
      'Creditor / Entity': {
        select: { name: creditor }
      },
      'Case Type': {
        select: { name: caseType }
      },
      'Risk Level': {
        select: { name: this.capitalizeFirst(riskLevel) }
      },
      'Dishonor Prediction': {
        select: { name: this.capitalizeFirst(meta.dishonorPrediction?.dishonorLikelihood || 'Low') }
      },
      'Beneficiary Impact': {
        select: { name: this.capitalizeFirst(meta.beneficiaryImpact?.severity || 'None') }
      },
      'Current Status': {
        select: { name: 'New' }
      },
      'Last Communication Date': {
        date: { start: emailData.date || new Date().toISOString() }
      },
      'Router Dispatch Target': {
        rich_text: [{ text: { content: dispatchTarget } }]
      },
      'Tags': {
        multi_select: tags.map(tag => ({ name: tag }))
      },
      'Created by Router': {
        checkbox: true
      },
      'Summary': {
        rich_text: [{ text: { content: this.truncate(reason, 2000) } }]
      },
      'Latest Email Body': {
        rich_text: [{ text: { content: this.truncate(emailData.bodyText || '', 2000) } }]
      }
    };

    // Add conditional fields
    if (meta.dishonorPrediction?.flags?.length > 0) {
      properties['Dishonor Notes'] = {
        rich_text: [{ text: { content: `Flags: ${meta.dishonorPrediction.flags.join(', ')}` } }]
      };
    }

    if (meta.beneficiaryImpact?.markers?.length > 0) {
      properties['Beneficiary Risk Notes'] = {
        rich_text: [{ text: { content: `Markers: ${meta.beneficiaryImpact.markers.join(', ')}` } }]
      };
    }

    if (dispatchTarget) {
      properties['Enforcement Path'] = {
        rich_text: [{ text: { content: `Dispatched to: ${dispatchTarget}` } }]
      };
    }

    try {
      const response = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties
      });

      return response;
    } catch (error) {
      console.error('Error creating case:', error);
      throw error;
    }
  }

  /**
   * Update existing case with new communication
   */
  async updateCase(pageId, routerOutput, emailData) {
    const {
      riskLevel,
      tags,
      meta,
      reason
    } = routerOutput;

    const updates = {
      'Last Communication Date': {
        date: { start: emailData.date || new Date().toISOString() }
      },
      'Latest Email Body': {
        rich_text: [{ text: { content: this.truncate(emailData.bodyText || '', 2000) } }]
      }
    };

    // Update risk if higher
    const riskHierarchy = { low: 1, medium: 2, high: 3, critical: 4 };
    const currentRisk = await this.getCurrentRiskLevel(pageId);
    if (riskHierarchy[riskLevel.toLowerCase()] > riskHierarchy[currentRisk.toLowerCase()]) {
      updates['Risk Level'] = {
        select: { name: this.capitalizeFirst(riskLevel) }
      };
    }

    // Update dishonor prediction if higher
    if (meta.dishonorPrediction) {
      const dishonorHierarchy = { low: 1, medium: 2, high: 3 };
      const currentDishonor = await this.getCurrentDishonorLevel(pageId);
      const newLevel = meta.dishonorPrediction.dishonorLikelihood;
      if (dishonorHierarchy[newLevel.toLowerCase()] > dishonorHierarchy[currentDishonor.toLowerCase()]) {
        updates['Dishonor Prediction'] = {
          select: { name: this.capitalizeFirst(newLevel) }
        };
      }
    }

    // Merge tags
    const currentTags = await this.getCurrentTags(pageId);
    const mergedTags = [...new Set([...currentTags, ...tags])];
    updates['Tags'] = {
      multi_select: mergedTags.map(tag => ({ name: tag }))
    };

    // Append to summary
    const currentSummary = await this.getCurrentSummary(pageId);
    const newSummary = `${currentSummary}\n\n---\n[${new Date().toISOString()}]\n${reason}`;
    updates['Summary'] = {
      rich_text: [{ text: { content: this.truncate(newSummary, 2000) } }]
    };

    try {
      await this.notion.pages.update({
        page_id: pageId,
        properties: updates
      });
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  }

  /**
   * Helper: Get current risk level
   */
  async getCurrentRiskLevel(pageId) {
    try {
      const page = await this.notion.pages.retrieve({ page_id: pageId });
      return page.properties['Risk Level']?.select?.name || 'Low';
    } catch (error) {
      return 'Low';
    }
  }

  /**
   * Helper: Get current dishonor level
   */
  async getCurrentDishonorLevel(pageId) {
    try {
      const page = await this.notion.pages.retrieve({ page_id: pageId });
      return page.properties['Dishonor Prediction']?.select?.name || 'Low';
    } catch (error) {
      return 'Low';
    }
  }

  /**
   * Helper: Get current tags
   */
  async getCurrentTags(pageId) {
    try {
      const page = await this.notion.pages.retrieve({ page_id: pageId });
      return page.properties['Tags']?.multi_select?.map(t => t.name) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Helper: Get current summary
   */
  async getCurrentSummary(pageId) {
    try {
      const page = await this.notion.pages.retrieve({ page_id: pageId });
      return page.properties['Summary']?.rich_text[0]?.plain_text || '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Generate case title from creditor and email
   */
  generateCaseTitle(creditor, emailData) {
    const month = new Date(emailData.date || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const subject = emailData.subject || 'Untitled';
    const shortSubject = subject.substring(0, 50);
    return `${creditor} – ${shortSubject} – ${month}`;
  }

  /**
   * Infer case type from tags and email content
   */
  inferCaseType(tags, emailData) {
    const text = (emailData.subject + ' ' + emailData.bodyText).toLowerCase();

    if (text.includes('billing') || text.includes('invoice') || text.includes('payment')) return 'Billing / Telecom';
    if (text.includes('credit') || text.includes('bureau') || text.includes('metro-2')) return 'Credit Reporting / Metro-2';
    if (text.includes('closure') || text.includes('account closed')) return 'Banking Closure';
    if (text.includes('irs') || text.includes('tax')) return 'IRS Procedure';
    if (tags.includes('beneficiary_impact')) return 'Beneficiary Protection';
    if (text.includes('enforce') || text.includes('legal')) return 'Enforcement';

    return 'Other';
  }

  /**
   * Utility: Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Utility: Truncate text
   */
  truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

module.exports = { NotionCaseLinker };
