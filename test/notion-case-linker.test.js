// test/notion-case-linker.test.js
// Test suite for Notion Case Auto-Linker

const { NotionCaseLinker } = require('../src/utils/notion-case-linker');

// Mock Notion client
jest.mock('@notionhq/client', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      databases: {
        query: jest.fn().mockResolvedValue({ results: [] })
      },
      pages: {
        create: jest.fn().mockResolvedValue({
          id: 'mock-page-id-123',
          url: 'https://notion.so/mock-page-id-123',
          properties: {
            'Case Title': {
              title: [{ plain_text: 'Verizon – Test Case – December 2025' }]
            }
          }
        }),
        update: jest.fn().mockResolvedValue({}),
        retrieve: jest.fn().mockResolvedValue({
          properties: {
            'Risk Level': { select: { name: 'Low' } },
            'Dishonor Prediction': { select: { name: 'Low' } },
            'Tags': { multi_select: [] },
            'Summary': { rich_text: [{ plain_text: 'Initial summary' }] }
          }
        })
      }
    }))
  };
});

describe('NotionCaseLinker', () => {
  let linker;
  let mockRouterOutput;
  let mockEmailData;

  beforeEach(() => {
    linker = new NotionCaseLinker('fake-api-key', 'fake-database-id');

    mockRouterOutput = {
      dispatchTarget: 'VERIZON_ENFORCEMENT',
      creditor: 'Verizon',
      riskLevel: 'high',
      tags: ['creditor:verizon', 'risk_keywords'],
      matchedRules: ['VERIZON'],
      reason: 'Route: VERIZON_ENFORCEMENT | Risk: high',
      meta: {
        dishonorPrediction: {
          dishonorLikelihood: 'medium',
          flags: ['refusal_to_engage']
        },
        beneficiaryImpact: {
          beneficiaryFlag: false,
          severity: 'none',
          markers: []
        },
        source: 'gmail',
        receivedAt: new Date().toISOString()
      },
      rawMessage: {}
    };

    mockEmailData = {
      id: 'email-123',
      threadId: 'thread-456',
      source: 'gmail',
      from: 'verizon@verizon.com',
      to: ['howardisiah@gmail.com'],
      subject: 'Billing Notice',
      bodyText: 'Your Verizon account...',
      date: new Date().toISOString()
    };
  });

  describe('linkOrCreateCase', () => {
    test('should create new case when no existing case found', async () => {
      const result = await linker.linkOrCreateCase(mockRouterOutput, mockEmailData);

      expect(result.isNew).toBe(true);
      expect(result.caseId).toBe('mock-page-id-123');
      expect(result.action).toBe('created');
      expect(result.caseUrl).toContain('notion.so');
    });

    test('should update existing case when match found', async () => {
      // Mock finding an existing case
      linker.notion.databases.query = jest.fn().mockResolvedValue({
        results: [{
          id: 'existing-case-id',
          url: 'https://notion.so/existing-case-id',
          properties: {
            'Case Title': {
              title: [{ plain_text: 'Existing Case' }]
            },
            'Summary': {
              rich_text: [{ plain_text: 'thread-456' }]
            }
          }
        }]
      });

      const result = await linker.linkOrCreateCase(mockRouterOutput, mockEmailData);

      expect(result.isNew).toBe(false);
      expect(result.action).toBe('updated');
    });
  });

  describe('generateCaseTitle', () => {
    test('should generate proper case title', () => {
      const title = linker.generateCaseTitle('Verizon', mockEmailData);
      
      expect(title).toContain('Verizon');
      expect(title).toContain('Billing Notice');
      expect(title).toMatch(/\d{4}/); // Contains year
    });

    test('should truncate long subjects', () => {
      const longEmailData = {
        ...mockEmailData,
        subject: 'A'.repeat(100)
      };

      const title = linker.generateCaseTitle('Verizon', longEmailData);
      
      expect(title.length).toBeLessThan(100);
    });
  });

  describe('inferCaseType', () => {
    test('should infer Billing / Telecom for billing keywords', () => {
      const tags = [];
      const emailData = {
        subject: 'Billing Statement',
        bodyText: 'Your invoice is due'
      };

      const caseType = linker.inferCaseType(tags, emailData);
      expect(caseType).toBe('Billing / Telecom');
    });

    test('should infer Credit Reporting for credit keywords', () => {
      const tags = [];
      const emailData = {
        subject: 'Credit Bureau Report',
        bodyText: 'metro-2 reporting'
      };

      const caseType = linker.inferCaseType(tags, emailData);
      expect(caseType).toBe('Credit Reporting / Metro-2');
    });

    test('should infer IRS Procedure for tax keywords', () => {
      const tags = [];
      const emailData = {
        subject: 'IRS Notice',
        bodyText: 'tax assessment'
      };

      const caseType = linker.inferCaseType(tags, emailData);
      expect(caseType).toBe('IRS Procedure');
    });

    test('should infer Beneficiary Protection from tags', () => {
      const tags = ['beneficiary_impact'];
      const emailData = {
        subject: 'Account Notice',
        bodyText: 'Standard notice'
      };

      const caseType = linker.inferCaseType(tags, emailData);
      expect(caseType).toBe('Beneficiary Protection');
    });

    test('should default to Other for unknown types', () => {
      const tags = [];
      const emailData = {
        subject: 'Random Subject',
        bodyText: 'Random content'
      };

      const caseType = linker.inferCaseType(tags, emailData);
      expect(caseType).toBe('Other');
    });
  });

  describe('truncate', () => {
    test('should not truncate short text', () => {
      const text = 'Short text';
      const result = linker.truncate(text, 100);
      
      expect(result).toBe(text);
    });

    test('should truncate long text with ellipsis', () => {
      const text = 'A'.repeat(100);
      const result = linker.truncate(text, 50);
      
      expect(result.length).toBe(50);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('capitalizeFirst', () => {
    test('should capitalize first letter', () => {
      expect(linker.capitalizeFirst('low')).toBe('Low');
      expect(linker.capitalizeFirst('high')).toBe('High');
      expect(linker.capitalizeFirst('CRITICAL')).toBe('Critical');
    });
  });

  describe('createCase', () => {
    test('should create case with all required properties', async () => {
      const result = await linker.createCase(mockRouterOutput, mockEmailData);

      expect(result.id).toBeDefined();
      expect(result.url).toBeDefined();
      expect(linker.notion.pages.create).toHaveBeenCalled();

      const createCall = linker.notion.pages.create.mock.calls[0][0];
      expect(createCall.properties['Case Title']).toBeDefined();
      expect(createCall.properties['Creditor / Entity']).toBeDefined();
      expect(createCall.properties['Risk Level']).toBeDefined();
      expect(createCall.properties['Current Status']).toBeDefined();
    });

    test('should include dishonor notes when flags present', async () => {
      await linker.createCase(mockRouterOutput, mockEmailData);

      const createCall = linker.notion.pages.create.mock.calls[0][0];
      expect(createCall.properties['Dishonor Notes']).toBeDefined();
      expect(createCall.properties['Dishonor Notes'].rich_text[0].text.content).toContain('refusal_to_engage');
    });

    test('should include beneficiary notes when markers present', async () => {
      mockRouterOutput.meta.beneficiaryImpact = {
        beneficiaryFlag: true,
        severity: 'high',
        markers: ['housing', 'medical']
      };

      await linker.createCase(mockRouterOutput, mockEmailData);

      const createCall = linker.notion.pages.create.mock.calls[0][0];
      expect(createCall.properties['Beneficiary Risk Notes']).toBeDefined();
      expect(createCall.properties['Beneficiary Risk Notes'].rich_text[0].text.content).toContain('housing');
    });
  });

  describe('updateCase', () => {
    test('should update case with new communication', async () => {
      await linker.updateCase('page-id-123', mockRouterOutput, mockEmailData);

      expect(linker.notion.pages.update).toHaveBeenCalled();

      const updateCall = linker.notion.pages.update.mock.calls[0][0];
      expect(updateCall.page_id).toBe('page-id-123');
      expect(updateCall.properties['Last Communication Date']).toBeDefined();
      expect(updateCall.properties['Latest Email Body']).toBeDefined();
    });

    test('should upgrade risk level when new is higher', async () => {
      // Mock current risk as 'Low'
      linker.getCurrentRiskLevel = jest.fn().mockResolvedValue('Low');

      mockRouterOutput.riskLevel = 'critical';
      await linker.updateCase('page-id-123', mockRouterOutput, mockEmailData);

      const updateCall = linker.notion.pages.update.mock.calls[0][0];
      expect(updateCall.properties['Risk Level']).toBeDefined();
      expect(updateCall.properties['Risk Level'].select.name).toBe('Critical');
    });

    test('should not downgrade risk level', async () => {
      // Mock current risk as 'Critical'
      linker.getCurrentRiskLevel = jest.fn().mockResolvedValue('Critical');

      mockRouterOutput.riskLevel = 'low';
      await linker.updateCase('page-id-123', mockRouterOutput, mockEmailData);

      const updateCall = linker.notion.pages.update.mock.calls[0][0];
      expect(updateCall.properties['Risk Level']).toBeUndefined();
    });

    test('should merge tags without duplicates', async () => {
      linker.getCurrentTags = jest.fn().mockResolvedValue(['existing-tag', 'creditor:verizon']);

      mockRouterOutput.tags = ['creditor:verizon', 'new-tag'];
      await linker.updateCase('page-id-123', mockRouterOutput, mockEmailData);

      const updateCall = linker.notion.pages.update.mock.calls[0][0];
      const tags = updateCall.properties['Tags'].multi_select.map(t => t.name);
      
      expect(tags).toContain('existing-tag');
      expect(tags).toContain('new-tag');
      expect(tags).toContain('creditor:verizon');
      // Check no duplicates
      expect(tags.length).toBe(new Set(tags).size);
    });
  });

  describe('error handling', () => {
    test('should handle Notion API errors gracefully', async () => {
      linker.notion.pages.create = jest.fn().mockRejectedValue(new Error('Notion API error'));

      await expect(
        linker.createCase(mockRouterOutput, mockEmailData)
      ).rejects.toThrow('Notion API error');
    });

    test('should return null when case search fails', async () => {
      linker.notion.databases.query = jest.fn().mockRejectedValue(new Error('Query failed'));

      const result = await linker.findExistingCase('Verizon', 'test-thread');
      expect(result).toBeNull();
    });
  });
});
