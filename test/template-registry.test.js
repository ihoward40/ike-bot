// template-registry.test.js
// Tests for Master Template Key Map

const {
  TEMPLATE_REGISTRY,
  getTemplate,
  getTemplatesByCategory,
  searchTemplatesByTags,
  getAllTemplateKeys,
  isValidTemplateKey,
  getTemplatesForCreditor
} = require('../src/utils/template-registry');

describe('Template Registry', () => {
  describe('getTemplate', () => {
    test('should return Verizon initial dispute template', () => {
      const template = getTemplate('VERIZON_INITIAL_DISPUTE');
      expect(template).toBeDefined();
      expect(template.key).toBe('VERIZON_INITIAL_DISPUTE');
      expect(template.category).toBe('VERIZON');
      expect(template.googleDocId).toBe('GDOC_VERZ_01');
    });

    test('should return IRS formal response template', () => {
      const template = getTemplate('IRS_FORMAL_RESPONSE_PACKAGE');
      expect(template).toBeDefined();
      expect(template.category).toBe('IRS');
      expect(template.requiredFields).toContain('notice_type');
    });

    test('should return null for invalid template key', () => {
      const template = getTemplate('INVALID_KEY');
      expect(template).toBeNull();
    });
  });

  describe('getTemplatesByCategory', () => {
    test('should return all Verizon templates', () => {
      const templates = getTemplatesByCategory('VERIZON');
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.category === 'VERIZON')).toBe(true);
      
      const keys = templates.map(t => t.key);
      expect(keys).toContain('VERIZON_INITIAL_DISPUTE');
      expect(keys).toContain('FCC_TELECOM_COMPLAINT');
    });

    test('should return all IRS templates', () => {
      const templates = getTemplatesByCategory('IRS');
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.category === 'IRS')).toBe(true);
      
      const keys = templates.map(t => t.key);
      expect(keys).toContain('IRS_FORMAL_RESPONSE_PACKAGE');
      expect(keys).toContain('TAS_ASSISTANCE_REQUEST');
    });

    test('should return empty array for non-existent category', () => {
      const templates = getTemplatesByCategory('NONEXISTENT');
      expect(templates).toEqual([]);
    });
  });

  describe('searchTemplatesByTags', () => {
    test('should find templates with telecom tag', () => {
      const templates = searchTemplatesByTags(['telecom']);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.tags.includes('telecom'))).toBe(true);
    });

    test('should find templates with regulator tag', () => {
      const templates = searchTemplatesByTags(['regulator']);
      expect(templates.length).toBeGreaterThan(0);
      
      const keys = templates.map(t => t.key);
      expect(keys).toContain('FCC_TELECOM_COMPLAINT');
      expect(keys).toContain('CFPB_BANKING_COMPLAINT');
    });

    test('should find templates with multiple tags (OR logic)', () => {
      const templates = searchTemplatesByTags(['tro', 'emergency']);
      expect(templates.length).toBeGreaterThan(0);
      
      const keys = templates.map(t => t.key);
      expect(keys).toContain('TRO_TEMPLATE_VERIZON');
      expect(keys).toContain('EMERGENCY_TRO_TEMPLATE');
    });

    test('should return empty array for non-matching tags', () => {
      const templates = searchTemplatesByTags(['nonexistent_tag']);
      expect(templates).toEqual([]);
    });
  });

  describe('getAllTemplateKeys', () => {
    test('should return all template keys', () => {
      const keys = getAllTemplateKeys();
      expect(keys.length).toBeGreaterThan(20); // We have many templates
      expect(keys).toContain('VERIZON_INITIAL_DISPUTE');
      expect(keys).toContain('IRS_FORMAL_RESPONSE_PACKAGE');
      expect(keys).toContain('CFPB_BANKING_COMPLAINT');
      expect(keys).toContain('EMERGENCY_TRO_TEMPLATE');
    });
  });

  describe('isValidTemplateKey', () => {
    test('should return true for valid template keys', () => {
      expect(isValidTemplateKey('VERIZON_INITIAL_DISPUTE')).toBe(true);
      expect(isValidTemplateKey('IRS_FORMAL_RESPONSE_PACKAGE')).toBe(true);
      expect(isValidTemplateKey('CFPB_BANKING_COMPLAINT')).toBe(true);
    });

    test('should return false for invalid template keys', () => {
      expect(isValidTemplateKey('INVALID_KEY')).toBe(false);
      expect(isValidTemplateKey('')).toBe(false);
      expect(isValidTemplateKey('verizon_initial_dispute')).toBe(false); // case sensitive
    });
  });

  describe('getTemplatesForCreditor', () => {
    test('should return Verizon templates for Verizon creditor', () => {
      const templates = getTemplatesForCreditor('Verizon');
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.category === 'VERIZON')).toBe(true);
    });

    test('should return IRS templates for IRS creditor', () => {
      const templates = getTemplatesForCreditor('IRS');
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.category === 'IRS')).toBe(true);
    });

    test('should return Wells Fargo templates for Wells Fargo creditor', () => {
      const templates = getTemplatesForCreditor('Wells Fargo');
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.category === 'WELLS_FARGO')).toBe(true);
    });

    test('should return Chase templates for Chase / EWS creditor', () => {
      const templates = getTemplatesForCreditor('Chase / EWS');
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.category === 'CHASE_EWS')).toBe(true);
    });

    test('should return general templates for unknown creditor', () => {
      const templates = getTemplatesForCreditor('Unknown Creditor');
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.category === 'GENERAL')).toBe(true);
    });
  });

  describe('Template Structure Validation', () => {
    test('all templates should have required fields', () => {
      const keys = getAllTemplateKeys();
      
      keys.forEach(key => {
        const template = getTemplate(key);
        expect(template).toBeDefined();
        expect(template.key).toBe(key);
        expect(template.description).toBeDefined();
        expect(template.googleDocId).toBeDefined();
        expect(template.driveFolder).toBeDefined();
        expect(template.makeScenarioId).toBeDefined();
        expect(template.notionTemplateId).toBeDefined();
        expect(template.category).toBeDefined();
        expect(Array.isArray(template.requiredFields)).toBe(true);
        expect(Array.isArray(template.tags)).toBe(true);
      });
    });

    test('all Verizon templates should have verizon tag', () => {
      const templates = getTemplatesByCategory('VERIZON');
      templates.forEach(template => {
        expect(template.tags).toContain('verizon');
      });
    });

    test('all regulator templates should have regulator tag', () => {
      const regulatorKeys = [
        'FCC_TELECOM_COMPLAINT',
        'BPU_VERIZON_COMPLAINT',
        'CFPB_BANKING_COMPLAINT',
        'OCC_NATIONAL_BANK_COMPLAINT',
        'FDIC_COMPLAINT',
        'FTC_SOCIAL_MEDIA_COMPLAINT'
      ];
      
      regulatorKeys.forEach(key => {
        const template = getTemplate(key);
        expect(template.tags).toContain('regulator');
      });
    });
  });

  describe('Cross-Category Templates', () => {
    test('CFPB complaint templates should exist for multiple categories', () => {
      const cfpbTemplates = searchTemplatesByTags(['cfpb']);
      expect(cfpbTemplates.length).toBeGreaterThan(2);
      
      const categories = cfpbTemplates.map(t => t.category);
      expect(categories).toContain('WELLS_FARGO');
      expect(categories).toContain('CHASE_EWS');
      expect(categories).toContain('DAKOTA');
    });

    test('TRO templates should exist for litigation cases', () => {
      const troTemplates = searchTemplatesByTags(['tro']);
      expect(troTemplates.length).toBeGreaterThan(0);
      
      const keys = troTemplates.map(t => t.key);
      expect(keys).toContain('TRO_TEMPLATE_VERIZON');
      expect(keys).toContain('EMERGENCY_TRO_TEMPLATE');
    });
  });
});
