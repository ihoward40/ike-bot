# 🔥 SintraPrime Notion Case Auto-Linker v1 — Complete Guide

**Automatically link emails to existing cases or create new ones in Notion**

This is the **Case Management Brain** that law firms, compliance departments, and federal investigators use — built in Black-Gold Mythic Trust Mode for the Howard Empire.

---

## 📊 **1. NOTION DATABASE SCHEMA**

### Create Database: **⚡ SintraPrime — Master Case Ledger**

#### Primary Property

| Property Name | Type | Notes |
|--------------|------|-------|
| **Case Title** | Title | Auto-generated: "Verizon – Billing Dispute – December 2025" |

#### Case Metadata

| Property Name | Type | Options |
|--------------|------|---------|
| **Creditor / Entity** | Select | Verizon, IRS, Wells Fargo, Chase/EWS, Dakota, SSA, TikTok, Other |
| **Case Type** | Select | Billing / Telecom, Credit Reporting / Metro-2, Banking Closure, IRS Procedure, Trust Administration, Beneficiary Protection, Enforcement, Investigation, Automation System Error, Other |
| **Risk Level** | Select | Low, Medium, High, Critical |
| **Dishonor Prediction** | Select | Low, Medium, High |
| **Beneficiary Impact** | Select | None, Medium, High |
| **Current Status** | Select | New, Pending, Waiting on Them, In Enforcement, In Litigation Mode, Closed – Won, Closed – Lost, Closed – Settled, Archived |

#### Operational Fields

| Property Name | Type | Notes |
|--------------|------|-------|
| **Last Communication Date** | Date | Auto-updated with each new email |
| **Next Deadline** | Date | Manually set or auto-calculated |
| **Auto Deadline Type** | Select | 15-day Notice, 30-day Dispute, 60-day Enforcement, 72-hour Urgency, Custom |
| **Evidence Count** | Number | Manually tracked |

#### AI / Automation Metadata

| Property Name | Type | Notes |
|--------------|------|-------|
| **Router Dispatch Target** | Text | e.g., "VERIZON_ENFORCEMENT" |
| **Tags** | Multi-select | Auto-populated from router |
| **Slack Alert Received?** | Checkbox | Track if Slack notification sent |
| **Created by Router** | Checkbox | Auto-set to true for automated cases |

#### Long Text Fields

| Property Name | Type | Notes |
|--------------|------|-------|
| **Summary** | Long text | Appends each routing decision with timestamp |
| **Latest Email Body** | Long text | Most recent email body (truncated to 2000 chars) |
| **Dishonor Notes** | Long text | Auto-populated from dishonor prediction flags |
| **Beneficiary Risk Notes** | Long text | Auto-populated from beneficiary markers |
| **Enforcement Path** | Long text | Tracks dispatch targets and actions |

---

## 🔧 **2. AUTO-LINKER MODULE CODE**

### Installation

```bash
npm install @notionhq/client
```

### Core Module: `src/utils/notion-case-linker.js`

**Full implementation included in the repository.**

#### Key Features:

1. **Smart Case Matching**: Finds existing cases by creditor + thread/subject similarity
2. **Auto-Create**: Creates new cases with all metadata auto-populated
3. **Intelligent Updates**: Only updates risk/dishonor if new level is higher
4. **Tag Merging**: Combines existing tags with new ones (no duplicates)
5. **Summary Appending**: Adds timestamped entries to case history
6. **Truncation**: Safely handles long text fields (2000 char limit)

---

## 🚀 **3. INTEGRATION WITH ROUTER MICROSERVICE**

### Update `router-microservice.ts`

Add Notion linking to the routing flow:

```typescript
import { NotionCaseLinker } from '../utils/notion-case-linker';

// Initialize linker
const caseLinker = new NotionCaseLinker(
  process.env.NOTION_API_KEY,
  process.env.NOTION_DATABASE_ID
);

// In /route-email endpoint, after routing:
app.post('/route-email', async (req, res) => {
  try {
    const gmailRaw = req.body;
    const normalized = normalizeGmailMessage(gmailRaw);
    const decision = routeMessage(normalized);

    // NEW: Auto-link to Notion case
    const caseLink = await caseLinker.linkOrCreateCase(decision, normalized);

    res.json({
      ok: true,
      route: decision.dispatchTarget,
      data: decision,
      notionCase: {
        id: caseLink.caseId,
        title: caseLink.caseTitle,
        url: caseLink.caseUrl,
        action: caseLink.action,
        isNew: caseLink.isNew
      }
    });

  } catch (err) {
    console.error("Routing error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
```

---

## ⚙️ **4. ENVIRONMENT CONFIGURATION**

Add to `.env`:

```bash
# Notion Configuration
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=b12e9675f58240fa8751dad99a0df320
```

### How to Get Notion API Key:

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Name: `SintraPrime Router`
4. Copy the **Internal Integration Token**
5. Go to your Notion database → Click "..." → **Add connections** → Select `SintraPrime Router`

---

## 📋 **5. USAGE EXAMPLES**

### Standalone Usage

```javascript
const { NotionCaseLinker } = require('./src/utils/notion-case-linker');
const { routeMessage } = require('./src/utils/sintraprime-router-v1');
const { normalizeGmailMessage } = require('./src/utils/normalizer-gmail');

// Initialize
const linker = new NotionCaseLinker(
  process.env.NOTION_API_KEY,
  process.env.NOTION_DATABASE_ID
);

// Process email
const gmailPayload = { /* Gmail API response */ };
const normalized = normalizeGmailMessage(gmailPayload);
const routerOutput = routeMessage(normalized);

// Link to case
const result = await linker.linkOrCreateCase(routerOutput, normalized);

console.log(result);
// {
//   isNew: true,
//   caseId: "abc123-notion-page-id",
//   caseTitle: "Verizon – Final Notice – December 2025",
//   caseUrl: "https://notion.so/abc123...",
//   action: "created"
// }
```

### Make.com Integration

After routing the email through the microservice, capture the Notion response:

```json
{
  "ok": true,
  "route": "VERIZON_ENFORCEMENT",
  "data": { /* routing decision */ },
  "notionCase": {
    "id": "abc123",
    "title": "Verizon – Final Notice – December 2025",
    "url": "https://notion.so/abc123",
    "action": "created",
    "isNew": true
  }
}
```

Use this in Make.com to:
- Send Slack alert with Notion link
- Create calendar reminder for deadlines
- Trigger enforcement workflows
- Update other systems

---

## 🧪 **6. TESTING**

### Test Case Creation

```javascript
const testEmail = {
  id: 'test-123',
  threadId: 'thread-456',
  source: 'gmail',
  from: 'verizon@verizon.com',
  to: ['howardisiah@gmail.com'],
  subject: 'Final Notice - Service Disconnection',
  bodyText: 'Your Verizon Wireless service will be disconnected...',
  date: new Date().toISOString()
};

const testRouter = {
  dispatchTarget: 'VERIZON_ENFORCEMENT',
  creditor: 'Verizon',
  riskLevel: 'critical',
  tags: ['creditor:verizon', 'risk_keywords', 'dishonor_watch'],
  matchedRules: ['VERIZON'],
  reason: 'Route: VERIZON_ENFORCEMENT | Risk: critical | RiskKeywords: final notice, disconnected',
  meta: {
    dishonorPrediction: {
      dishonorLikelihood: 'high',
      flags: ['refusal_to_engage']
    },
    beneficiaryImpact: {
      beneficiaryFlag: false,
      severity: 'none',
      markers: []
    }
  },
  rawMessage: testEmail
};

// Run test
const result = await linker.linkOrCreateCase(testRouter, testEmail);
console.log('Test Result:', result);
```

### Expected Output

**First Run (New Case):**
```json
{
  "isNew": true,
  "caseId": "notion-page-id-123",
  "caseTitle": "Verizon – Final Notice - Service Disconnection – December 2025",
  "caseUrl": "https://notion.so/...",
  "action": "created"
}
```

**Second Run (Update Existing):**
```json
{
  "isNew": false,
  "caseId": "notion-page-id-123",
  "caseTitle": "Verizon – Final Notice - Service Disconnection – December 2025",
  "caseUrl": "https://notion.so/...",
  "action": "updated"
}
```

---

## 🔐 **7. SECURITY CONSIDERATIONS**

### API Key Protection

- Store `NOTION_API_KEY` in environment variables only
- Never commit `.env` to git
- Use different keys for dev/staging/production
- Rotate keys quarterly

### Rate Limiting

Notion API limits:
- **3 requests per second** per integration
- Auto-linker uses 1-3 requests per email (query + create/update)
- For bulk processing, add rate limiting:

```javascript
const pLimit = require('p-limit');
const limit = pLimit(2); // 2 concurrent requests

const results = await Promise.all(
  emails.map(email => limit(() => linker.linkOrCreateCase(routerOutput, email)))
);
```

### Error Handling

The linker includes built-in error handling:
- Returns `null` if case search fails (creates new case instead)
- Logs errors to console
- Throws errors on critical failures (create/update)

---

## 📈 **8. MONITORING & METRICS**

### Track These Metrics

1. **Case Creation Rate**: How many new cases per day?
2. **Case Match Rate**: % of emails matched to existing cases
3. **Risk Distribution**: How many Critical/High/Medium/Low cases?
4. **Dishonor Prediction Accuracy**: Track false positives
5. **Response Time**: Notion API latency

### Add Logging

```javascript
// In linkOrCreateCase method
console.log('[Notion Linker] Processing:', {
  creditor: routerOutput.creditor,
  riskLevel: routerOutput.riskLevel,
  action: result.action,
  duration: Date.now() - startTime
});
```

### Notion Database Views

Create these views in your database:

1. **🚨 High Priority Dashboard**
   - Filter: Risk Level = Critical OR High
   - Sort: Last Communication Date (descending)

2. **📊 Active Cases by Creditor**
   - Group by: Creditor / Entity
   - Filter: Status ≠ Archived

3. **⏰ Upcoming Deadlines**
   - Filter: Next Deadline < 7 days from now
   - Sort: Next Deadline (ascending)

4. **🤖 Auto-Created Cases**
   - Filter: Created by Router = checked
   - Sort: Last Communication Date (descending)

---

## 🎯 **9. ADVANCED FEATURES**

### A. Auto-Deadline Calculation

Add to `createCase` method:

```javascript
// Calculate deadline based on case type
let deadlineDate = null;
if (caseType === 'Billing / Telecom') {
  deadlineDate = this.addDays(new Date(), 30); // 30-day dispute window
} else if (caseType === 'Credit Reporting / Metro-2') {
  deadlineDate = this.addDays(new Date(), 30); // FCRA 30-day window
} else if (riskLevel === 'critical') {
  deadlineDate = this.addDays(new Date(), 3); // 72-hour urgency
}

if (deadlineDate) {
  properties['Next Deadline'] = {
    date: { start: deadlineDate.toISOString() }
  };
  properties['Auto Deadline Type'] = {
    select: { name: this.inferDeadlineType(caseType, riskLevel) }
  };
}
```

### B. Evidence Counter

Track attachments and evidence:

```javascript
// In updateCase method
const evidenceCount = await this.getEvidenceCount(pageId);
updates['Evidence Count'] = {
  number: evidenceCount + (emailData.attachments?.length || 0)
};
```

### C. Multi-Database Support

Link to multiple databases:

```javascript
// Link to enforcement tracking database
if (dispatchTarget === 'VERIZON_ENFORCEMENT') {
  await this.linkToEnforcementDatabase(newCase.id, routerOutput);
}

// Link to beneficiary protection database
if (meta.beneficiaryImpact?.beneficiaryFlag) {
  await this.linkToBeneficiaryDatabase(newCase.id, routerOutput);
}
```

---

## 🔄 **10. MAINTENANCE**

### Weekly Tasks

- Review unmatched cases (Created by Router = true, but not linked to thread)
- Archive closed cases older than 90 days
- Update creditor/case type taxonomy as needed

### Monthly Tasks

- Analyze case matching accuracy
- Review dishonor prediction performance
- Optimize search queries for performance
- Update risk keyword list

### Quarterly Tasks

- Rotate Notion API keys
- Backup database structure and views
- Review automation rules and adjust thresholds

---

## ✅ **11. PRODUCTION CHECKLIST**

Before deploying to production:

- [ ] Notion database created with all properties
- [ ] Notion integration connected to database
- [ ] `NOTION_API_KEY` and `NOTION_DATABASE_ID` set in `.env`
- [ ] Case linker tested with sample emails
- [ ] Rate limiting configured for bulk processing
- [ ] Error handling and logging in place
- [ ] Monitoring dashboard created in Notion
- [ ] Team trained on case management workflow
- [ ] Backup/archive strategy defined
- [ ] Security review completed

---

## 🚀 **NEXT STEPS**

1. **Set up Notion database** using schema above
2. **Configure environment variables** with API key
3. **Test with sample emails** to verify case creation
4. **Integrate with router microservice** to enable auto-linking
5. **Create Notion views** for dashboard monitoring
6. **Deploy to production** and monitor case flow

---

## 📚 **RESOURCES**

- [Notion API Documentation](https://developers.notion.com/)
- [SintraPrime Router v1 Code](../src/utils/sintraprime-router-v1.js)
- [Router Microservice Integration](./SINTRAPRIME_ROUTER_MICROSERVICE.md)
- [Make.com Usage Guide](./SINTRAPRIME_ROUTER_USAGE.md)

---

**Built with 🖤 for the Howard Trust Empire**

*SintraPrime Notion Case Auto-Linker v1 — The Case Management Brain that never sleeps.*
