// template-registry.js
// Master Template Key Map for SintraPrime — connects Router v4 actions to automation templates
// Purpose: Unified registry of all enforcement templates (Google Docs, Notion, Make.com, Drive)

/**
 * @typedef {Object} TemplateDefinition
 * @property {string} key - Unique template key (e.g., 'VERIZON_INITIAL_DISPUTE')
 * @property {string} description - Human-readable description
 * @property {string} googleDocId - Google Doc template ID
 * @property {string} driveFolder - Drive folder path
 * @property {string} makeScenarioId - Make.com scenario webhook ID or name
 * @property {string} notionTemplateId - Notion template page ID
 * @property {string} category - Template category (VERIZON, IRS, WELLS_FARGO, etc.)
 * @property {string[]} requiredFields - Fields needed for template
 * @property {string[]} tags - Searchable tags
 */

// ========================
// VERIZON TEMPLATES
// ========================

const VERIZON_TEMPLATES = {
  VERIZON_INITIAL_DISPUTE: {
    key: 'VERIZON_INITIAL_DISPUTE',
    description: 'First dispute letter - billing/service issue',
    googleDocId: 'GDOC_VERZ_01', // Replace with actual Google Doc ID
    driveFolder: '/Verizon/Disputes/',
    makeScenarioId: 'MAKE_VERZ_INIT', // Replace with actual Make.com webhook URL
    notionTemplateId: 'NOTION_VERZ_INIT', // Replace with actual Notion template page ID
    category: 'VERIZON',
    requiredFields: ['account_number', 'dispute_date', 'amount', 'issue_description'],
    tags: ['telecom', 'billing', 'initial_dispute', 'verizon']
  },
  VERIZON_ADMIN_FOLLOWUP: {
    key: 'VERIZON_ADMIN_FOLLOWUP',
    description: 'Second notice, follow-up admin demand',
    googleDocId: 'GDOC_VERZ_02',
    driveFolder: '/Verizon/Admin/',
    makeScenarioId: 'MAKE_VERZ_ADMIN_FU',
    notionTemplateId: 'NOTION_VERZ_ADMIN',
    category: 'VERIZON',
    requiredFields: ['account_number', 'original_dispute_date', 'days_elapsed'],
    tags: ['telecom', 'followup', 'administrative', 'verizon']
  },
  VERIZON_FINAL_LEGAL_DEMAND: {
    key: 'VERIZON_FINAL_LEGAL_DEMAND',
    description: 'Final notice before regulators/litigation',
    googleDocId: 'GDOC_VERZ_03',
    driveFolder: '/Verizon/LegalDemand/',
    makeScenarioId: 'MAKE_VERZ_FINAL',
    notionTemplateId: 'NOTION_VERZ_FINAL',
    category: 'VERIZON',
    requiredFields: ['account_number', 'total_damages', 'timeline_summary'],
    tags: ['telecom', 'final_demand', 'pre_litigation', 'verizon']
  },
  FCC_TELECOM_COMPLAINT: {
    key: 'FCC_TELECOM_COMPLAINT',
    description: 'FCC filing package for telecom violations',
    googleDocId: 'GDOC_VERZ_FCC',
    driveFolder: '/Verizon/FCC/',
    makeScenarioId: 'MAKE_VERZ_FCC',
    notionTemplateId: 'NOTION_VERZ_FCC',
    category: 'VERIZON',
    requiredFields: ['fcc_consumer_complaint_form', 'evidence_summary', 'statutory_violations'],
    tags: ['telecom', 'fcc', 'regulator', 'complaint', 'verizon']
  },
  BPU_VERIZON_COMPLAINT: {
    key: 'BPU_VERIZON_COMPLAINT',
    description: 'NJ BPU (Board of Public Utilities) escalation',
    googleDocId: 'GDOC_VERZ_BPU',
    driveFolder: '/Verizon/BPU/',
    makeScenarioId: 'MAKE_VERZ_BPU',
    notionTemplateId: 'NOTION_VERZ_BPU',
    category: 'VERIZON',
    requiredFields: ['bpu_case_number', 'service_address', 'state_violations'],
    tags: ['telecom', 'bpu', 'new_jersey', 'state_regulator', 'verizon']
  },
  TRO_TEMPLATE_VERIZON: {
    key: 'TRO_TEMPLATE_VERIZON',
    description: 'TRO/Injunction template for emergency relief',
    googleDocId: 'GDOC_VERZ_TRO',
    driveFolder: '/Verizon/TRO/',
    makeScenarioId: 'MAKE_VERZ_TRO',
    notionTemplateId: 'NOTION_VERZ_TRO',
    category: 'VERIZON',
    requiredFields: ['irreparable_harm', 'likelihood_success', 'emergency_basis'],
    tags: ['telecom', 'tro', 'injunction', 'emergency', 'litigation', 'verizon']
  }
};

// ========================
// IRS TEMPLATES
// ========================

const IRS_TEMPLATES = {
  IRS_FORMAL_RESPONSE_PACKAGE: {
    key: 'IRS_FORMAL_RESPONSE_PACKAGE',
    description: 'Full response packet to IRS notice',
    googleDocId: 'GDOC_IRS_01',
    driveFolder: '/IRS/FormalResponse/',
    makeScenarioId: 'MAKE_IRS_RESP',
    notionTemplateId: 'NOTION_IRS_RESP',
    category: 'IRS',
    requiredFields: ['notice_type', 'tax_year', 'ssn', 'response_deadline'],
    tags: ['irs', 'tax', 'response', 'formal']
  },
  IRS_APPEAL_TEMPLATE: {
    key: 'IRS_APPEAL_TEMPLATE',
    description: 'Formal appeals request (Appeals Office)',
    googleDocId: 'GDOC_IRS_APPEAL',
    driveFolder: '/IRS/Appeals/',
    makeScenarioId: 'MAKE_IRS_APPEAL',
    notionTemplateId: 'NOTION_IRS_APPEAL',
    category: 'IRS',
    requiredFields: ['original_determination', 'appeal_basis', 'facts_law'],
    tags: ['irs', 'tax', 'appeal', 'administrative']
  },
  TAS_ASSISTANCE_REQUEST: {
    key: 'TAS_ASSISTANCE_REQUEST',
    description: 'Taxpayer Advocate Service request',
    googleDocId: 'GDOC_IRS_TAS',
    driveFolder: '/IRS/TAS/',
    makeScenarioId: 'MAKE_IRS_TAS',
    notionTemplateId: 'NOTION_IRS_TAS',
    category: 'IRS',
    requiredFields: ['hardship_type', 'tas_criteria', 'relief_requested'],
    tags: ['irs', 'tax', 'tas', 'advocate', 'hardship']
  },
  IRS_COLLECTION_DUE_PROCESS: {
    key: 'IRS_COLLECTION_DUE_PROCESS',
    description: 'CDP (Collection Due Process) hearing request',
    googleDocId: 'GDOC_IRS_CDP',
    driveFolder: '/IRS/CDP/',
    makeScenarioId: 'MAKE_IRS_CDP',
    notionTemplateId: 'NOTION_IRS_CDP',
    category: 'IRS',
    requiredFields: ['levy_notice', 'collection_alternatives', 'hearing_basis'],
    tags: ['irs', 'tax', 'cdp', 'collection', 'hearing']
  },
  IRS_PENALTY_ABATEMENT: {
    key: 'IRS_PENALTY_ABATEMENT',
    description: 'Penalty abatement request (reasonable cause)',
    googleDocId: 'GDOC_IRS_PENALTY_AB',
    driveFolder: '/IRS/PenaltyAbatement/',
    makeScenarioId: 'MAKE_IRS_PENALTY_AB',
    notionTemplateId: 'NOTION_IRS_PENALTY_AB',
    category: 'IRS',
    requiredFields: ['penalty_type', 'reasonable_cause', 'compliance_history'],
    tags: ['irs', 'tax', 'penalty', 'abatement', 'relief']
  }
};

// ========================
// WELLS FARGO TEMPLATES
// ========================

const WELLS_FARGO_TEMPLATES = {
  WELLS_FARGO_INITIAL_DISPUTE: {
    key: 'WELLS_FARGO_INITIAL_DISPUTE',
    description: 'First dispute letter - account/service issue',
    googleDocId: 'GDOC_WF_01',
    driveFolder: '/WellsFargo/Disputes/',
    makeScenarioId: 'MAKE_WF_INIT',
    notionTemplateId: 'NOTION_WF_INIT',
    category: 'WELLS_FARGO',
    requiredFields: ['account_number', 'dispute_date', 'issue_type'],
    tags: ['banking', 'dispute', 'wells_fargo', 'initial']
  },
  CFPB_BANKING_COMPLAINT: {
    key: 'CFPB_BANKING_COMPLAINT',
    description: 'CFPB complaint for banking violations',
    googleDocId: 'GDOC_WF_CFPB',
    driveFolder: '/WellsFargo/CFPB/',
    makeScenarioId: 'MAKE_WF_CFPB',
    notionTemplateId: 'NOTION_WF_CFPB',
    category: 'WELLS_FARGO',
    requiredFields: ['violation_type', 'financial_harm', 'cfpb_category'],
    tags: ['banking', 'cfpb', 'regulator', 'wells_fargo', 'complaint']
  },
  OCC_NATIONAL_BANK_COMPLAINT: {
    key: 'OCC_NATIONAL_BANK_COMPLAINT',
    description: 'OCC (Office of Comptroller) complaint',
    googleDocId: 'GDOC_WF_OCC',
    driveFolder: '/WellsFargo/OCC/',
    makeScenarioId: 'MAKE_WF_OCC',
    notionTemplateId: 'NOTION_WF_OCC',
    category: 'WELLS_FARGO',
    requiredFields: ['bank_charter_number', 'regulation_violated', 'occ_jurisdiction'],
    tags: ['banking', 'occ', 'regulator', 'wells_fargo', 'national_bank']
  },
  FDIC_COMPLAINT: {
    key: 'FDIC_COMPLAINT',
    description: 'FDIC complaint for insured institution',
    googleDocId: 'GDOC_WF_FDIC',
    driveFolder: '/WellsFargo/FDIC/',
    makeScenarioId: 'MAKE_WF_FDIC',
    notionTemplateId: 'NOTION_WF_FDIC',
    category: 'WELLS_FARGO',
    requiredFields: ['fdic_cert_number', 'deposit_insurance_issue', 'fdic_authority'],
    tags: ['banking', 'fdic', 'regulator', 'wells_fargo', 'deposit_insurance']
  }
};

// ========================
// CHASE / EWS TEMPLATES
// ========================

const CHASE_EWS_TEMPLATES = {
  CHASE_INITIAL_DISPUTE: {
    key: 'CHASE_INITIAL_DISPUTE',
    description: 'First dispute letter - Chase account issue',
    googleDocId: 'GDOC_CHASE_01',
    driveFolder: '/Chase/Disputes/',
    makeScenarioId: 'MAKE_CHASE_INIT',
    notionTemplateId: 'NOTION_CHASE_INIT',
    category: 'CHASE_EWS',
    requiredFields: ['account_number', 'dispute_date', 'issue_description'],
    tags: ['banking', 'chase', 'dispute', 'initial']
  },
  EWS_REPORT_DISPUTE: {
    key: 'EWS_REPORT_DISPUTE',
    description: 'Early Warning Services report dispute (ChexSystems alternative)',
    googleDocId: 'GDOC_EWS_01',
    driveFolder: '/Chase/EWS/',
    makeScenarioId: 'MAKE_EWS_DISPUTE',
    notionTemplateId: 'NOTION_EWS_DISPUTE',
    category: 'CHASE_EWS',
    requiredFields: ['ews_report_date', 'disputed_items', 'fcra_basis'],
    tags: ['banking', 'ews', 'chexsystems', 'credit_reporting', 'fcra']
  },
  CFPB_CHASE_COMPLAINT: {
    key: 'CFPB_CHASE_COMPLAINT',
    description: 'CFPB complaint for Chase violations',
    googleDocId: 'GDOC_CHASE_CFPB',
    driveFolder: '/Chase/CFPB/',
    makeScenarioId: 'MAKE_CHASE_CFPB',
    notionTemplateId: 'NOTION_CHASE_CFPB',
    category: 'CHASE_EWS',
    requiredFields: ['violation_type', 'financial_harm', 'cfpb_category'],
    tags: ['banking', 'chase', 'cfpb', 'regulator', 'complaint']
  }
};

// ========================
// DAKOTA FINANCIAL TEMPLATES
// ========================

const DAKOTA_TEMPLATES = {
  DAKOTA_INITIAL_DISPUTE: {
    key: 'DAKOTA_INITIAL_DISPUTE',
    description: 'First dispute letter - equipment finance issue',
    googleDocId: 'GDOC_DAKOTA_01',
    driveFolder: '/Dakota/Disputes/',
    makeScenarioId: 'MAKE_DAKOTA_INIT',
    notionTemplateId: 'NOTION_DAKOTA_INIT',
    category: 'DAKOTA',
    requiredFields: ['lease_number', 'equipment_description', 'dispute_basis'],
    tags: ['equipment_finance', 'dakota', 'dispute', 'initial']
  },
  CFPB_EQUIPMENT_FINANCE_COMPLAINT: {
    key: 'CFPB_EQUIPMENT_FINANCE_COMPLAINT',
    description: 'CFPB complaint for equipment finance violations',
    googleDocId: 'GDOC_DAKOTA_CFPB',
    driveFolder: '/Dakota/CFPB/',
    makeScenarioId: 'MAKE_DAKOTA_CFPB',
    notionTemplateId: 'NOTION_DAKOTA_CFPB',
    category: 'DAKOTA',
    requiredFields: ['tila_violations', 'udaap_concerns', 'financial_harm'],
    tags: ['equipment_finance', 'dakota', 'cfpb', 'tila', 'udaap']
  },
  STATE_AG_EQUIPMENT_FINANCE: {
    key: 'STATE_AG_EQUIPMENT_FINANCE',
    description: 'State Attorney General complaint',
    googleDocId: 'GDOC_DAKOTA_AG',
    driveFolder: '/Dakota/StateAG/',
    makeScenarioId: 'MAKE_DAKOTA_AG',
    notionTemplateId: 'NOTION_DAKOTA_AG',
    category: 'DAKOTA',
    requiredFields: ['state_consumer_protection_law', 'deceptive_practices', 'state_jurisdiction'],
    tags: ['equipment_finance', 'dakota', 'state_ag', 'consumer_protection']
  }
};

// ========================
// TIKTOK TEMPLATES
// ========================

const TIKTOK_TEMPLATES = {
  TIKTOK_ACCOUNT_APPEAL: {
    key: 'TIKTOK_ACCOUNT_APPEAL',
    description: 'TikTok account restriction/ban appeal',
    googleDocId: 'GDOC_TIKTOK_01',
    driveFolder: '/TikTok/Appeals/',
    makeScenarioId: 'MAKE_TIKTOK_APPEAL',
    notionTemplateId: 'NOTION_TIKTOK_APPEAL',
    category: 'TIKTOK',
    requiredFields: ['account_username', 'restriction_type', 'appeal_basis'],
    tags: ['tiktok', 'social_media', 'appeal', 'account']
  },
  FTC_SOCIAL_MEDIA_COMPLAINT: {
    key: 'FTC_SOCIAL_MEDIA_COMPLAINT',
    description: 'FTC complaint for unfair social media practices',
    googleDocId: 'GDOC_TIKTOK_FTC',
    driveFolder: '/TikTok/FTC/',
    makeScenarioId: 'MAKE_TIKTOK_FTC',
    notionTemplateId: 'NOTION_TIKTOK_FTC',
    category: 'TIKTOK',
    requiredFields: ['ftc_act_section', 'unfair_practice', 'consumer_harm'],
    tags: ['tiktok', 'social_media', 'ftc', 'regulator', 'unfair_practices']
  }
};

// ========================
// GENERAL / CROSS-CUTTING TEMPLATES
// ========================

const GENERAL_TEMPLATES = {
  CREDIT_BUREAU_DISPUTE: {
    key: 'CREDIT_BUREAU_DISPUTE',
    description: 'Credit bureau dispute letter (Equifax/Experian/TransUnion)',
    googleDocId: 'GDOC_CREDIT_01',
    driveFolder: '/CreditBureaus/Disputes/',
    makeScenarioId: 'MAKE_CREDIT_DISPUTE',
    notionTemplateId: 'NOTION_CREDIT_DISPUTE',
    category: 'GENERAL',
    requiredFields: ['bureau_name', 'disputed_items', 'fcra_basis'],
    tags: ['credit_reporting', 'fcra', 'dispute', 'general']
  },
  FCRA_REINVESTIGATION_DEMAND: {
    key: 'FCRA_REINVESTIGATION_DEMAND',
    description: 'FCRA §623 reinvestigation demand to furnisher',
    googleDocId: 'GDOC_FCRA_01',
    driveFolder: '/FCRA/Reinvestigation/',
    makeScenarioId: 'MAKE_FCRA_REVINV',
    notionTemplateId: 'NOTION_FCRA_REVINV',
    category: 'GENERAL',
    requiredFields: ['furnisher_name', 'account_identifier', 'fcra_section_623'],
    tags: ['credit_reporting', 'fcra', 'reinvestigation', 'furnisher']
  },
  STATE_AG_GENERAL_COMPLAINT: {
    key: 'STATE_AG_GENERAL_COMPLAINT',
    description: 'General state Attorney General consumer complaint',
    googleDocId: 'GDOC_AG_01',
    driveFolder: '/StateAG/General/',
    makeScenarioId: 'MAKE_AG_GENERAL',
    notionTemplateId: 'NOTION_AG_GENERAL',
    category: 'GENERAL',
    requiredFields: ['state', 'consumer_protection_violation', 'harm_description'],
    tags: ['state_ag', 'consumer_protection', 'general']
  },
  LITIGATION_DEMAND_LETTER: {
    key: 'LITIGATION_DEMAND_LETTER',
    description: 'Pre-litigation demand letter (general)',
    googleDocId: 'GDOC_LIT_DEMAND',
    driveFolder: '/Litigation/Demands/',
    makeScenarioId: 'MAKE_LIT_DEMAND',
    notionTemplateId: 'NOTION_LIT_DEMAND',
    category: 'GENERAL',
    requiredFields: ['defendant_name', 'claims_summary', 'damages', 'settlement_demand'],
    tags: ['litigation', 'demand', 'pre_litigation', 'general']
  },
  EMERGENCY_TRO_TEMPLATE: {
    key: 'EMERGENCY_TRO_TEMPLATE',
    description: 'Emergency TRO/Preliminary Injunction (general)',
    googleDocId: 'GDOC_TRO_GENERAL',
    driveFolder: '/Litigation/TRO/',
    makeScenarioId: 'MAKE_TRO_GENERAL',
    notionTemplateId: 'NOTION_TRO_GENERAL',
    category: 'GENERAL',
    requiredFields: ['irreparable_harm', 'likelihood_success', 'balance_hardships', 'public_interest'],
    tags: ['litigation', 'tro', 'injunction', 'emergency', 'general']
  }
};

// ========================
// CONSOLIDATED REGISTRY
// ========================

const TEMPLATE_REGISTRY = {
  ...VERIZON_TEMPLATES,
  ...IRS_TEMPLATES,
  ...WELLS_FARGO_TEMPLATES,
  ...CHASE_EWS_TEMPLATES,
  ...DAKOTA_TEMPLATES,
  ...TIKTOK_TEMPLATES,
  ...GENERAL_TEMPLATES
};

// ========================
// HELPER FUNCTIONS
// ========================

/**
 * Get template by key.
 * @param {string} templateKey
 * @returns {TemplateDefinition|null}
 */
function getTemplate(templateKey) {
  return TEMPLATE_REGISTRY[templateKey] || null;
}

/**
 * Get all templates for a category.
 * @param {string} category - e.g., 'VERIZON', 'IRS', 'GENERAL'
 * @returns {TemplateDefinition[]}
 */
function getTemplatesByCategory(category) {
  return Object.values(TEMPLATE_REGISTRY).filter(t => t.category === category);
}

/**
 * Search templates by tags.
 * @param {string[]} tags
 * @returns {TemplateDefinition[]}
 */
function searchTemplatesByTags(tags) {
  return Object.values(TEMPLATE_REGISTRY).filter(template =>
    tags.some(tag => template.tags.includes(tag))
  );
}

/**
 * Get all template keys.
 * @returns {string[]}
 */
function getAllTemplateKeys() {
  return Object.keys(TEMPLATE_REGISTRY);
}

/**
 * Validate if a template key exists.
 * @param {string} templateKey
 * @returns {boolean}
 */
function isValidTemplateKey(templateKey) {
  return templateKey in TEMPLATE_REGISTRY;
}

/**
 * Get templates for a specific creditor (maps Router v2 creditor names).
 * @param {string} creditor - e.g., 'Verizon', 'IRS', 'Wells Fargo', 'Chase / EWS'
 * @returns {TemplateDefinition[]}
 */
function getTemplatesForCreditor(creditor) {
  const categoryMap = {
    'Verizon': 'VERIZON',
    'IRS': 'IRS',
    'Wells Fargo': 'WELLS_FARGO',
    'Chase / EWS': 'CHASE_EWS',
    'Dakota Financial': 'DAKOTA',
    'TikTok': 'TIKTOK',
    'General': 'GENERAL'
  };
  
  const category = categoryMap[creditor] || 'GENERAL';
  return getTemplatesByCategory(category);
}

// ========================
// EXPORTS
// ========================

module.exports = {
  TEMPLATE_REGISTRY,
  VERIZON_TEMPLATES,
  IRS_TEMPLATES,
  WELLS_FARGO_TEMPLATES,
  CHASE_EWS_TEMPLATES,
  DAKOTA_TEMPLATES,
  TIKTOK_TEMPLATES,
  GENERAL_TEMPLATES,
  getTemplate,
  getTemplatesByCategory,
  searchTemplatesByTags,
  getAllTemplateKeys,
  isValidTemplateKey,
  getTemplatesForCreditor
};
