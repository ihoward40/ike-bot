# SintraPrime Template Automation System

**Master Template Key Map & Automation Engine**

Transform Router v4's tactical plans into automated document generation, workflow triggers, and enforcement actions.

---

## 📋 **Overview**

The Template Automation System connects Router v4 action plans to real-world automation:

- **30+ enforcement templates** organized by creditor/category
- **4 automation channels**: Google Docs, Notion, Make.com, Google Drive
- **Automatic execution** of countermeasure plans
- **Complete integration** with Router v1-v4 pipeline

### Architecture

```
Router v4 Countermeasure Plan
        ↓
Template Registry (30+ templates)
        ↓
Template Automation Engine
        ↓
    ┌───┴───┬───────┬────────┐
    ↓       ↓       ↓        ↓
Google    Notion  Make.com  Drive
 Docs     Pages  Scenarios Folders
```

---

## 🗂️ **Template Categories**

### **1. VERIZON (6 templates)**
- `VERIZON_INITIAL_DISPUTE` - First dispute letter
- `VERIZON_ADMIN_FOLLOWUP` - Follow-up admin demand
- `VERIZON_FINAL_LEGAL_DEMAND` - Final notice before regulators
- `FCC_TELECOM_COMPLAINT` - FCC filing package
- `BPU_VERIZON_COMPLAINT` - NJ Board of Public Utilities escalation
- `TRO_TEMPLATE_VERIZON` - Emergency TRO/Injunction

### **2. IRS (5 templates)**
- `IRS_FORMAL_RESPONSE_PACKAGE` - Full response to IRS notice
- `IRS_APPEAL_TEMPLATE` - Appeals Office request
- `TAS_ASSISTANCE_REQUEST` - Taxpayer Advocate Service
- `IRS_COLLECTION_DUE_PROCESS` - CDP hearing request
- `IRS_PENALTY_ABATEMENT` - Penalty abatement (reasonable cause)

### **3. WELLS FARGO (4 templates)**
- `WELLS_FARGO_INITIAL_DISPUTE` - First dispute letter
- `CFPB_BANKING_COMPLAINT` - CFPB complaint
- `OCC_NATIONAL_BANK_COMPLAINT` - Office of Comptroller complaint
- `FDIC_COMPLAINT` - FDIC complaint

### **4. CHASE / EWS (3 templates)**
- `CHASE_INITIAL_DISPUTE` - First dispute letter
- `EWS_REPORT_DISPUTE` - Early Warning Services report dispute
- `CFPB_CHASE_COMPLAINT` - CFPB complaint for Chase

### **5. DAKOTA FINANCIAL (3 templates)**
- `DAKOTA_INITIAL_DISPUTE` - Equipment finance dispute
- `CFPB_EQUIPMENT_FINANCE_COMPLAINT` - CFPB complaint
- `STATE_AG_EQUIPMENT_FINANCE` - State Attorney General complaint

### **6. TIKTOK (2 templates)**
- `TIKTOK_ACCOUNT_APPEAL` - Account restriction/ban appeal
- `FTC_SOCIAL_MEDIA_COMPLAINT` - FTC unfair practices complaint

### **7. GENERAL / CROSS-CUTTING (5 templates)**
- `CREDIT_BUREAU_DISPUTE` - Credit bureau dispute (Equifax/Experian/TransUnion)
- `FCRA_REINVESTIGATION_DEMAND` - FCRA §623 reinvestigation demand
- `STATE_AG_GENERAL_COMPLAINT` - General state AG consumer complaint
- `LITIGATION_DEMAND_LETTER` - Pre-litigation demand letter
- `EMERGENCY_TRO_TEMPLATE` - Emergency TRO/Preliminary Injunction

---

## 🔑 **Template Structure**

Each template has:

```typescript
{
  key: 'VERIZON_INITIAL_DISPUTE',
  description: 'First dispute letter - billing/service issue',
  googleDocId: 'GDOC_VERZ_01',           // Google Doc template ID
  driveFolder: '/Verizon/Disputes/',     // Drive folder path
  makeScenarioId: 'MAKE_VERZ_INIT',      // Make.com scenario webhook
  notionTemplateId: 'NOTION_VERZ_INIT',  // Notion template page ID
  category: 'VERIZON',
  requiredFields: [                       // Required data fields
    'account_number',
    'dispute_date',
    'amount',
    'issue_description'
  ],
  tags: ['telecom', 'billing', 'initial_dispute', 'verizon']
}
```

---

## 🚀 **Quick Start**

### **1. Setup Template IDs**

Edit `src/utils/template-registry.js` and replace placeholder IDs with real ones:

```javascript
const VERIZON_TEMPLATES = {
  VERIZON_INITIAL_DISPUTE: {
    // Replace these with your actual IDs
    googleDocId: '1ABC123...XYZ789',  // Real Google Doc template ID
    makeScenarioId: 'https://hook.us2.make.com/abc123xyz',  // Real Make.com webhook
    notionTemplateId: 'abc123-def456-...',  // Real Notion template page ID
    // ...
  }
};
```

### **2. Test Template Lookup**

```javascript
const { getTemplate } = require('./src/utils/template-registry');

const template = getTemplate('VERIZON_INITIAL_DISPUTE');
console.log(template);
// {
//   key: 'VERIZON_INITIAL_DISPUTE',
//   description: 'First dispute letter...',
//   googleDocId: '1ABC123...',
//   ...
// }
```

### **3. Execute Template Automation**

```javascript
const { executeTemplateAutomation } = require('./src/utils/template-automation');

const result = await executeTemplateAutomation('VERIZON_INITIAL_DISPUTE', {
  caseId: 'CASE-VRZ-20251207-ABC123',
  creditor: 'Verizon',
  userEmail: 'HowardIsiah@gmail.com',
  templateData: {
    account_number: '123456789',
    dispute_date: '2025-12-07',
    amount: '$500.00',
    issue_description: 'Unauthorized charges for service never requested'
  }
});

console.log(result);
// {
//   success: true,
//   templateKey: 'VERIZON_INITIAL_DISPUTE',
//   googleDocUrl: 'https://docs.google.com/document/d/...',
//   notionPageUrl: 'https://notion.so/...',
//   driveFileUrl: 'https://drive.google.com/drive/folders/...',
//   makeScenarioResponse: '...',
//   metadata: { ... }
// }
```

### **4. Execute Router v4 Countermeasure Plan**

```javascript
const { generateCountermeasures } = require('./src/utils/countermeasure-engine');
const { executeCountermeasurePlan } = require('./src/utils/template-automation');

// Generate countermeasures from Router v2 decision
const plan = generateCountermeasures(routerDecision, persona);

// Execute all actions automatically
const results = await executeCountermeasurePlan(plan, {
  caseId: 'CASE-VRZ-20251207-ABC123',
  creditor: 'Verizon',
  userEmail: 'HowardIsiah@gmail.com',
  templateData: {
    account_number: '123456789',
    // ... other data
  }
});

console.log(results);
// {
//   planSummary: {
//     priority: 'high',
//     posture: 'enforce',
//     totalActions: 3,
//     requiresHumanReview: false
//   },
//   actionResults: [
//     {
//       templateKey: 'VERIZON_ADMIN_FOLLOWUP',
//       track: 'ADMIN',
//       success: true,
//       urls: { googleDoc: '...', notion: '...', drive: '...' }
//     },
//     // ... more actions
//   ],
//   summary: { successful: 3, failed: 0, total: 3 }
// }
```

---

## 📖 **API Reference**

### **Template Registry**

#### `getTemplate(templateKey)`
Get template by key.

```javascript
const template = getTemplate('VERIZON_INITIAL_DISPUTE');
```

#### `getTemplatesByCategory(category)`
Get all templates for a category.

```javascript
const templates = getTemplatesByCategory('VERIZON');
// Returns array of all Verizon templates
```

#### `searchTemplatesByTags(tags)`
Search templates by tags (OR logic).

```javascript
const templates = searchTemplatesByTags(['regulator', 'cfpb']);
// Returns all templates with either tag
```

#### `getTemplatesForCreditor(creditor)`
Get templates for a specific creditor (maps Router v2 creditor names).

```javascript
const templates = getTemplatesForCreditor('Verizon');
// Automatically maps to 'VERIZON' category
```

#### `getAllTemplateKeys()`
Get all template keys.

```javascript
const keys = getAllTemplateKeys();
// ['VERIZON_INITIAL_DISPUTE', 'IRS_FORMAL_RESPONSE_PACKAGE', ...]
```

#### `isValidTemplateKey(templateKey)`
Check if a template key exists.

```javascript
const isValid = isValidTemplateKey('VERIZON_INITIAL_DISPUTE');
// true
```

---

### **Template Automation**

#### `executeTemplateAutomation(templateKey, context)`
Execute automation for a specific template.

**Parameters:**
- `templateKey` (string) - Template key from registry
- `context` (AutomationContext) - Automation context object

**Context Object:**
```javascript
{
  caseId: 'CASE-VRZ-20251207-ABC123',        // Required
  creditor: 'Verizon',                       // Required
  userEmail: 'HowardIsiah@gmail.com',        // Required
  templateData: {                             // Required - template-specific data
    account_number: '123456789',
    dispute_date: '2025-12-07',
    // ...
  },
  createGoogleDoc: true,                      // Optional (default: true)
  createNotionPage: true,                     // Optional (default: true)
  triggerMakeScenario: true,                  // Optional (default: true)
  createDriveAssets: true                     // Optional (default: true)
}
```

**Returns:**
```javascript
{
  success: true,
  templateKey: 'VERIZON_INITIAL_DISPUTE',
  googleDocUrl: 'https://docs.google.com/document/d/...',
  notionPageUrl: 'https://notion.so/...',
  driveFileUrl: 'https://drive.google.com/drive/folders/...',
  makeScenarioResponse: '...',
  metadata: {
    executedAt: '2025-12-07T10:00:00Z',
    template: {
      description: '...',
      category: 'VERIZON'
    },
    makeScenario: { triggered: true, scenarioId: 'MAKE_VERZ_INIT' },
    googleDoc: { created: true, docId: 'GDOC_VERZ_01' },
    notionPage: { created: true, templateId: 'NOTION_VERZ_INIT' },
    driveAssets: { created: true, folder: '/Verizon/Disputes/' }
  }
}
```

#### `executeBatchTemplateAutomation(automations)`
Execute multiple template automations in sequence with rate limiting.

```javascript
const results = await executeBatchTemplateAutomation([
  {
    templateKey: 'VERIZON_ADMIN_FOLLOWUP',
    context: { caseId: '...', creditor: 'Verizon', ... }
  },
  {
    templateKey: 'FCC_TELECOM_COMPLAINT',
    context: { caseId: '...', creditor: 'Verizon', ... }
  }
]);
// Returns array of AutomationResult objects
```

#### `executeCountermeasurePlan(plan, baseContext)`
Execute all actions from a Router v4 countermeasure plan.

**Parameters:**
- `plan` (CountermeasurePlan) - From `countermeasure-engine.js`
- `baseContext` (AutomationContext) - Base context for all actions

**Returns:**
```javascript
{
  planSummary: {
    priority: 'high',
    posture: 'enforce',
    totalActions: 3,
    requiresHumanReview: false
  },
  actionResults: [
    {
      templateKey: 'VERIZON_ADMIN_FOLLOWUP',
      track: 'ADMIN',
      success: true,
      urls: {
        googleDoc: 'https://docs.google.com/document/d/...',
        notion: 'https://notion.so/...',
        drive: 'https://drive.google.com/drive/folders/...'
      },
      metadata: { ... }
    }
  ],
  errors: [],
  summary: { successful: 3, failed: 0, total: 3 }
}
```

---

## 🔗 **Integration with Router v4**

Router v4 automatically suggests template keys in its action plans. The automation engine can execute these automatically.

### **Full Pipeline Example**

```javascript
// 1. Normalize Gmail message
const normalized = normalizeGmailMessage(gmailRaw);

// 2. Route with Router v2
const routingDecision = routeMessage(normalized);

// 3. Generate countermeasures with Router v4
const plan = generateCountermeasures(routingDecision, persona);

// 4. Link to Notion case
const notionCase = await linkOrCreateCase(routingDecision, normalized);

// 5. Execute countermeasure plan (AUTOMATIC DOCUMENT GENERATION)
const automationResults = await executeCountermeasurePlan(plan, {
  caseId: notionCase.id,
  creditor: routingDecision.creditor,
  userEmail: 'HowardIsiah@gmail.com',
  templateData: {
    account_number: extractAccountNumber(normalized),
    dispute_date: normalized.date,
    // ... extract from email
  }
});

// 6. Return complete response
return {
  routing: routingDecision,
  countermeasures: plan,
  notionCase: notionCase,
  automation: automationResults
};
```

---

## 🎯 **Make.com Integration**

### **Scenario Setup**

For each template, create a Make.com scenario:

1. **Trigger:** Custom Webhook
2. **Modules:**
   - **Google Docs:** Create document from template
   - **Notion:** Create database item
   - **Google Drive:** Create folder/upload files
   - **Slack:** Send notification
   - **Email:** Send draft to user

3. **Webhook URL:** Save this as `makeScenarioId` in template registry

### **Payload Structure**

Make.com scenarios receive this payload:

```json
{
  "templateKey": "VERIZON_INITIAL_DISPUTE",
  "caseId": "CASE-VRZ-20251207-ABC123",
  "creditor": "Verizon",
  "templateData": {
    "account_number": "123456789",
    "dispute_date": "2025-12-07",
    "amount": "$500.00",
    "issue_description": "..."
  },
  "executedAt": "2025-12-07T10:00:00Z"
}
```

---

## 📝 **Google Docs Templates**

### **Template Setup**

1. Create a Google Doc template
2. Use placeholders: `{{account_number}}`, `{{dispute_date}}`, etc.
3. Share with service account email
4. Copy document ID and add to `template-registry.js`

### **Placeholder Syntax**

```
Dear {{creditor_name}},

RE: Account #{{account_number}} - Dispute

This letter concerns charges of {{amount}} on {{dispute_date}}.

{{issue_description}}

Sincerely,
{{user_name}}
```

---

## 📊 **Notion Templates**

### **Database Setup**

Each template category should have a Notion database template page:

1. **Properties:**
   - Case ID (text)
   - Template Key (text)
   - Creditor (select)
   - Status (select)
   - Created At (date)
   - ... template-specific fields

2. **Template Page:**
   - Pre-formatted structure
   - Placeholder blocks
   - Linked databases

3. **API Integration:**
   - Share database with integration
   - Copy template page ID
   - Add to `template-registry.js`

---

## 💾 **Google Drive Organization**

### **Folder Structure**

```
/SintraPrime Enforcement/
├── /Verizon/
│   ├── /Disputes/
│   │   └── /CASE-VRZ-20251207-ABC123/
│   ├── /Admin/
│   ├── /LegalDemand/
│   ├── /FCC/
│   └── /BPU/
├── /IRS/
│   ├── /FormalResponse/
│   ├── /Appeals/
│   └── /TAS/
├── /WellsFargo/
├── /Chase/
└── /General/
```

Each case gets its own subfolder with:
- Generated documents
- Evidence files
- Email exports
- Timeline logs

---

## 🧪 **Testing**

### **Run Template Registry Tests**

```bash
npm run template:test
```

### **Test Single Template**

```javascript
const { executeTemplateAutomation } = require('./src/utils/template-automation');

const result = await executeTemplateAutomation('VERIZON_INITIAL_DISPUTE', {
  caseId: 'TEST-001',
  creditor: 'Verizon',
  userEmail: 'test@example.com',
  templateData: {
    account_number: '123456789',
    dispute_date: '2025-12-07',
    amount: '$500.00',
    issue_description: 'Test dispute'
  },
  // Disable actual API calls for testing
  createGoogleDoc: false,
  createNotionPage: false,
  triggerMakeScenario: false,
  createDriveAssets: false
});

console.log('Test Result:', result);
```

---

## 🔐 **Security & Permissions**

### **Required Permissions**

1. **Google Docs API:**
   - `https://www.googleapis.com/auth/documents`
   - `https://www.googleapis.com/auth/drive.file`

2. **Notion API:**
   - Integration with read/write access to target databases

3. **Make.com:**
   - Webhook URLs (no auth required if using unique URLs)

4. **Google Drive API:**
   - `https://www.googleapis.com/auth/drive.file`

### **Environment Variables**

```bash
# Google APIs
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...

# Notion
NOTION_API_KEY=...
NOTION_DATABASE_ID=...

# Make.com (optional, can use direct webhook URLs in registry)
MAKE_COM_API_KEY=...
```

---

## 📈 **Monitoring & Metrics**

### **Track Automation Success**

```javascript
const { getAutomationStatus } = require('./src/utils/template-automation');

const status = await getAutomationStatus('CASE-VRZ-20251207-ABC123');
console.log(status);
// {
//   caseId: 'CASE-VRZ-20251207-ABC123',
//   templatesExecuted: ['VERIZON_INITIAL_DISPUTE', 'VERIZON_ADMIN_FOLLOWUP'],
//   lastExecuted: '2025-12-07T10:00:00Z',
//   pendingActions: ['FCC_TELECOM_COMPLAINT']
// }
```

### **Key Metrics**

- Templates executed per case
- Automation success rate
- Average execution time
- Failed automations (with error details)
- Most used templates
- Creditor breakdown

---

## 🚀 **Production Deployment**

### **1. Setup Template IDs**

Replace all placeholder IDs in `template-registry.js` with real ones from:
- Google Docs template IDs
- Make.com webhook URLs
- Notion template page IDs

### **2. Configure Service Accounts**

- Google Cloud project with Docs/Drive API enabled
- Notion integration with database access
- Make.com scenarios configured and active

### **3. Test Each Template**

Use the test script to verify each template works:

```bash
npm run template:test
```

### **4. Monitor Logs**

All automation executions are logged:

```
[TemplateAutomation] Executing: VERIZON_INITIAL_DISPUTE
[TemplateAutomation] Context: { caseId: '...', creditor: 'Verizon', ... }
[Make.com] Triggering scenario: MAKE_VERZ_INIT
[GoogleDocs] Creating document from template: GDOC_VERZ_01
[Notion] Creating page from template: NOTION_VERZ_INIT
[GoogleDrive] Creating folder: /Verizon/Disputes/
[TemplateAutomation] ✅ Executed: VERIZON_INITIAL_DISPUTE
```

---

## 📚 **Further Reading**

- [Router v4 Countermeasure Engine](./COUNTERMEASURE_ENGINE.md)
- [Notion Case Linker](./NOTION_CASE_LINKER.md)
- [Router Microservice API](./SINTRAPRIME_ROUTER_MICROSERVICE.md)
- [Gmail Enforcement Scanner](./GMAIL_ENFORCEMENT_SCANNER.md)

---

## 🆘 **Troubleshooting**

### **Template Not Found**

```
Error: Template 'INVALID_KEY' not found in registry
```

**Solution:** Check template key spelling and case sensitivity. Use `getAllTemplateKeys()` to see valid keys.

### **Automation Failed**

```
Error: Failed to execute VERIZON_INITIAL_DISPUTE: API rate limit exceeded
```

**Solution:** Batch automations use 2-second delays between executions. For large batches, increase delay or split into smaller batches.

### **Missing Required Fields**

```
Error: Missing required fields: account_number, dispute_date
```

**Solution:** Check template definition for `requiredFields` array and ensure all fields are provided in `templateData`.

---

**Built with ⚡ by SintraPrime — Enforcement Automation for the Howard Trust Empire**
