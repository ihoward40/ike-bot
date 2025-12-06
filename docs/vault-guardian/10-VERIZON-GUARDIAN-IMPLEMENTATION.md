# VERIZON_GUARDIAN_v1.0 Implementation Guide

**PATH A: Urgent Verizon Monitoring Scenario**

> ⚖️ **MISSION**: Monitor all Verizon communications, detect violations, alert immediately, preserve evidence, and track case timeline.

---

## 🎯 Scenario Overview

**Purpose**: Real-time monitoring and automated response system for Verizon communications  
**Trigger**: Gmail Watch (new emails from @verizon.com)  
**Modules**: 7 (with AI classification and severity routing)  
**Deployment Time**: 20-30 minutes  
**Priority**: CRITICAL - Live Fire Defense

### What This Scenario Does

1. **Auto-detects** ANY email from Verizon (@verizon.com, @vzw.com, @verizonwireless.com)
2. **AI Analysis** via GPT-4 to classify violation type and severity
3. **Instant Alerts** to Slack #verizon-watch with severity-based routing
4. **Evidence Preservation** - uploads email to Google Drive
5. **Case Tracking** - logs all incidents to Notion with timeline
6. **Damage Estimation** - calculates potential claims value
7. **Error Recovery** - handles failures with fallback notifications

---

## 📋 Pre-Configured Settings

**Your Configuration** (Already Embedded):
- **Notion Database**: `5b5979486c04411382801840f4818800` (Verizon_Case_Tracker)
- **Slack Channel**: `C0A20NPLY65` (#verizon-watch)
- **Slack User**: `U0917LJH52L` (for @mentions on CRITICAL alerts)
- **PostGrid API**: Not configured (can add later for certified mail automation)

---

## 🏗️ Module-by-Module Configuration

### Module 1: Gmail > Watch Emails

**Purpose**: Monitor incoming emails from Verizon domains  
**Trigger**: Real-time (webhook-based)

**Configuration**:
```json
{
  "connection": "IKE Solutions Gmail",
  "folder": "INBOX",
  "criteria": {
    "from": "verizon.com OR vzw.com OR verizonwireless.com OR @verizon.net"
  },
  "maxResults": 10
}
```

**Output Variables**:
- `{{1.id}}` - Email ID
- `{{1.from}}` - Sender email
- `{{1.subject}}` - Email subject
- `{{1.snippet}}` - Email preview text
- `{{1.date}}` - Received timestamp
- `{{1.bodyPlain}}` - Full email body (plain text)

---

### Module 2: OpenAI > Create Completion (GPT-4 Classifier)

**Purpose**: Analyze email content for violation types, severity, and damage estimates

**Configuration**:
```json
{
  "connection": "OpenAI API",
  "model": "gpt-4",
  "temperature": 0.3,
  "maxTokens": 500,
  "messages": [
    {
      "role": "system",
      "content": "You are a legal analyst specializing in consumer protection violations. Analyze emails from Verizon for potential violations of: ADA Title II, FDCPA, TCPA, service quality issues, billing disputes, and deceptive practices. Return structured JSON with: violation_types (array), severity (CRITICAL/HIGH/MEDIUM/LOW), summary (1-2 sentences), estimated_damages (number), evidence_strength (Strong/Moderate/Weak), action_required (string)."
    },
    {
      "role": "user",
      "content": "Analyze this email:\n\nFrom: {{1.from}}\nSubject: {{1.subject}}\nDate: {{1.date}}\n\nBody:\n{{1.bodyPlain}}\n\nContext: Sender is SSA-Disabled customer with active billing dispute. Service disconnection during dispute = violation."
    }
  ]
}
```

**Output Variables**:
- `{{2.choices[0].message.content}}` - Full JSON analysis

**Sample Output**:
```json
{
  "violation_types": ["Service Disconnection During Dispute", "ADA Title II Violation", "Collection Under Duress"],
  "severity": "CRITICAL",
  "summary": "Verizon threatened service disconnection while billing dispute is active and customer is SSA-Disabled.",
  "estimated_damages": 50000,
  "evidence_strength": "Strong",
  "action_required": "Immediate certified mail response required. Service restoration demanded."
}
```

---

### Module 3: Tools > Parse JSON

**Purpose**: Convert GPT-4 text response to structured data

**Configuration**:
```json
{
  "type": "json",
  "json": "{{2.choices[0].message.content}}"
}
```

**Output Variables**:
- `{{3.violation_types}}` - Array of violation types
- `{{3.severity}}` - CRITICAL/HIGH/MEDIUM/LOW
- `{{3.summary}}` - Brief summary
- `{{3.estimated_damages}}` - Dollar amount
- `{{3.evidence_strength}}` - Strong/Moderate/Weak
- `{{3.action_required}}` - Recommended actions

---

### Module 4: Google Drive > Upload File

**Purpose**: Preserve email evidence in organized Drive structure

**Configuration**:
```json
{
  "connection": "IKE Solutions Google Account",
  "folder": "Trust_Vault/Verizon_Evidence/2025/12",
  "name": "VERIZON_{{formatDate(1.date; 'YYYYMMDD_HHmmss')}}_{{1.id}}.txt",
  "data": "**VERIZON EMAIL EVIDENCE**\n\nCase ID: AUTO-{{formatDate(now; 'YYYYMMDDHHmmss')}}\nReceived: {{formatDate(1.date; 'YYYY-MM-DD HH:mm:ss')}} EST\n\n---\n\nFrom: {{1.from}}\nSubject: {{1.subject}}\nDate: {{1.date}}\n\n---\n\nBODY:\n{{1.bodyPlain}}\n\n---\n\nAI ANALYSIS:\n{{toJSON(3)}}\n\n---\n\nGmail Link: https://mail.google.com/mail/u/0/#inbox/{{1.id}}\nPreserved: {{formatDate(now; 'YYYY-MM-DD HH:mm:ss')}} EST",
  "mimeType": "text/plain"
}
```

**Output Variables**:
- `{{4.id}}` - Drive file ID
- `{{4.webViewLink}}` - Shareable link to evidence

---

### Module 5: Notion > Create Database Item

**Purpose**: Log incident to Verizon_Case_Tracker database

**Configuration**:
```json
{
  "connection": "IKE Solutions Notion",
  "database_id": "5b5979486c04411382801840f4818800",
  "properties": {
    "Case_ID": {
      "title": [
        {
          "text": {
            "content": "VZN-{{formatDate(now; 'YYYYMMDD-HHmmss')}}"
          }
        }
      ]
    },
    "Email_From": {
      "rich_text": [
        {
          "text": {
            "content": "{{1.from}}"
          }
        }
      ]
    },
    "Email_Subject": {
      "rich_text": [
        {
          "text": {
            "content": "{{1.subject}}"
          }
        }
      ]
    },
    "Received_Date": {
      "date": {
        "start": "{{1.date}}"
      }
    },
    "Severity": {
      "select": {
        "name": "{{3.severity}}"
      }
    },
    "Violation_Types": {
      "multi_select": [
        {{map(3.violation_types; 'name'; value)}}
      ]
    },
    "Summary": {
      "rich_text": [
        {
          "text": {
            "content": "{{3.summary}}"
          }
        }
      ]
    },
    "Estimated_Damages": {
      "number": {{3.estimated_damages}}
    },
    "Evidence_Strength": {
      "select": {
        "name": "{{3.evidence_strength}}"
      }
    },
    "Action_Required": {
      "rich_text": [
        {
          "text": {
            "content": "{{3.action_required}}"
          }
        }
      ]
    },
    "Gmail_Link": {
      "url": "https://mail.google.com/mail/u/0/#inbox/{{1.id}}"
    },
    "Drive_Evidence": {
      "url": "{{4.webViewLink}}"
    },
    "Status": {
      "select": {
        "name": "New"
      }
    },
    "Created_By": {
      "rich_text": [
        {
          "text": {
            "content": "VERIZON_GUARDIAN_v1.0"
          }
        }
      ]
    }
  }
}
```

**Output Variables**:
- `{{5.id}}` - Notion page ID
- `{{5.url}}` - Direct link to Notion record

---

### Module 6: Router (Severity-Based Alert Routing)

**Purpose**: Route to appropriate Slack alert based on severity

**Routes**:

#### Route 1: CRITICAL Severity
**Filter**: `{{3.severity}}` equals `CRITICAL`  
**Next Module**: Module 7A (Critical Alert)

#### Route 2: HIGH Severity
**Filter**: `{{3.severity}}` equals `HIGH`  
**Next Module**: Module 7B (High Alert)

#### Route 3: MEDIUM/LOW Severity
**Filter**: `{{3.severity}}` matches `MEDIUM|LOW`  
**Next Module**: Module 7C (Standard Alert)

---

### Module 7A: Slack > Post Message (CRITICAL Alert)

**Purpose**: Immediate escalation with @mention

**Configuration**:
```json
{
  "connection": "Vault Guardian Bot",
  "channel": "C0A20NPLY65",
  "text": "🚨 *VERIZON CASE ALERT: Critical Priority Violation Detected* 🚨\n\n⚖️ **Case:** VZN-{{formatDate(now; 'YYYYMMDD-HHmmss')}}\n📧 **From:** {{1.from}}\n📋 **Subject:** {{1.subject}}\n🕐 **Received:** {{formatDate(1.date; 'YYYY-MM-DD HH:mm:ss')}} EST\n\n**Violation Types:**\n{{join(map(3.violation_types; value); '\n- ')}}\n\n**Summary:**\n{{3.summary}}\n\n💰 **Estimated Damages:** ${{formatNumber(3.estimated_damages; 0; ','; '.')}}\n📊 **Evidence Strength:** {{3.evidence_strength}}\n\n**Action Required:**\n{{3.action_required}}\n\n🔗 **Evidence:**\n• Notion: {{5.url}}\n• Gmail: https://mail.google.com/mail/u/0/#inbox/{{1.id}}\n• Drive: {{4.webViewLink}}\n\n⚠️ *IMMEDIATE RESPONSE REQUIRED*\n\n<@U0917LJH52L>",
  "username": "Verizon Guardian",
  "icon_emoji": ":warning:",
  "mrkdwn": true
}
```

---

### Module 7B: Slack > Post Message (HIGH Alert)

**Purpose**: High priority alert (no @mention)

**Configuration**:
```json
{
  "connection": "Vault Guardian Bot",
  "channel": "C0A20NPLY65",
  "text": "⚠️ *VERIZON CASE ALERT: High Priority Violation* ⚠️\n\n⚖️ **Case:** VZN-{{formatDate(now; 'YYYYMMDD-HHmmss')}}\n📧 **From:** {{1.from}}\n📋 **Subject:** {{1.subject}}\n🕐 **Received:** {{formatDate(1.date; 'YYYY-MM-DD HH:mm:ss')}} EST\n\n**Violation Types:**\n{{join(map(3.violation_types; value); '\n- ')}}\n\n**Summary:**\n{{3.summary}}\n\n💰 **Estimated Damages:** ${{formatNumber(3.estimated_damages; 0; ','; '.')}}\n📊 **Evidence Strength:** {{3.evidence_strength}}\n\n**Action Required:**\n{{3.action_required}}\n\n🔗 **Evidence:**\n• Notion: {{5.url}}\n• Gmail: https://mail.google.com/mail/u/0/#inbox/{{1.id}}\n• Drive: {{4.webViewLink}}",
  "username": "Verizon Guardian",
  "icon_emoji": ":large_orange_diamond:",
  "mrkdwn": true
}
```

---

### Module 7C: Slack > Post Message (Standard Alert)

**Purpose**: Standard notification for MEDIUM/LOW severity

**Configuration**:
```json
{
  "connection": "Vault Guardian Bot",
  "channel": "C0A20NPLY65",
  "text": "📋 *Verizon Communication Logged* 📋\n\n⚖️ **Case:** VZN-{{formatDate(now; 'YYYYMMDD-HHmmss')}}\n📧 **From:** {{1.from}}\n📋 **Subject:** {{1.subject}}\n🕐 **Received:** {{formatDate(1.date; 'YYYY-MM-DD HH:mm:ss')}} EST\n\n**Severity:** {{3.severity}}\n\n**Summary:**\n{{3.summary}}\n\n🔗 **Evidence:**\n• Notion: {{5.url}}\n• Gmail: https://mail.google.com/mail/u/0/#inbox/{{1.id}}\n• Drive: {{4.webViewLink}}",
  "username": "Verizon Guardian",
  "icon_emoji": ":clipboard:",
  "mrkdwn": true
}
```

---

### Module 8: Error Handler (Fallback)

**Purpose**: Catch and report any module failures

**Configuration**:
```json
{
  "connection": "Vault Guardian Bot",
  "channel": "C0A20NPLY65",
  "text": "🔴 *VERIZON GUARDIAN ERROR: Processing Failed* 🔴\n\n⚠️ **Module:** {{error.module.name}}\n📛 **Error:** {{error.message}}\n🕐 **Timestamp:** {{formatDate(now; 'YYYY-MM-DD HH:mm:ss')}} EST\n\n📧 **Email Info (if available):**\n• From: {{1.from}}\n• Subject: {{1.subject}}\n• Date: {{1.date}}\n\n📋 **Payload:**\n```{{toJSON(error)}}```\n\n🛠️ **Action Required:** Check scenario logs and retry manually.\n\n<@U0917LJH52L>",
  "username": "Verizon Guardian",
  "icon_emoji": ":rotating_light:",
  "mrkdwn": true
}
```

**Error Routes**: From all modules (1-7) → Module 8

---

## 📦 Ready-to-Import JSON Blueprint

**File**: `scenarios/VERIZON_GUARDIAN_v1.0_blueprint.json`

This blueprint includes all 8 modules with your actual IDs pre-configured. No placeholder replacement needed.

---

## 🚀 Deployment Instructions

### Step 1: Create Notion Database

1. Go to Notion
2. Create new database: **Verizon_Case_Tracker**
3. Add these properties:

| Property Name | Type | Configuration |
|--------------|------|---------------|
| Case_ID | Title | Primary identifier |
| Email_From | Text | Sender email |
| Email_Subject | Text | Email subject line |
| Received_Date | Date | When email arrived |
| Severity | Select | Options: CRITICAL, HIGH, MEDIUM, LOW |
| Violation_Types | Multi-select | Options: Service Disconnection, ADA Violation, FDCPA Violation, TCPA Violation, Billing Dispute, Deceptive Practice, Quality Issue |
| Summary | Text | Brief description |
| Estimated_Damages | Number | Dollar amount |
| Evidence_Strength | Select | Options: Strong, Moderate, Weak |
| Action_Required | Text | Recommended actions |
| Gmail_Link | URL | Link to email |
| Drive_Evidence | URL | Link to evidence file |
| Status | Select | Options: New, In Progress, Resolved, Escalated |
| Created_By | Text | Automation identifier |

**Note**: Database ID `5b5979486c04411382801840f4818800` is already embedded in the blueprint.

---

### Step 2: Create Slack Channel

1. In Slack, create channel: **#verizon-watch**
2. Invite Vault Guardian Bot
3. Channel ID `C0A20NPLY65` is already embedded in the blueprint

---

### Step 3: Create Google Drive Folder

1. In Google Drive, navigate to: **Trust_Vault/**
2. Create folder: **Verizon_Evidence/**
3. Inside, create: **2025/12/** (year/month structure)
4. Set permissions: Private (owner only)

---

### Step 4: Import Scenario to Make.com

1. Go to Make.com: https://www.make.com/en/scenarios
2. Click **"..."** → **"Import Blueprint"**
3. Upload: `scenarios/VERIZON_GUARDIAN_v1.0_blueprint.json`
4. Make.com will import all 8 modules with connections

---

### Step 5: Configure Connections

**Required Connections**:
1. **Gmail** - IKE Solutions Gmail account
2. **OpenAI API** - GPT-4 access (requires API key)
3. **Google Drive** - IKE Solutions Google account
4. **Notion** - IKE Solutions Notion workspace
5. **Slack** - Vault Guardian Bot token

**Setup**:
- Make.com will prompt for each connection during import
- Use existing connections if already configured
- For OpenAI: Get API key from https://platform.openai.com/api-keys

---

### Step 6: Test the Scenario

**Test Procedure**:
1. In Make.com, click **"Run once"**
2. Send test email from personal account with subject: `Test Verizon Alert`
3. Temporarily add `OR from:your-personal-email@gmail.com` to Module 1 filter
4. Verify:
   - ✅ Email detected
   - ✅ GPT-4 analysis completed
   - ✅ Drive file uploaded
   - ✅ Notion record created
   - ✅ Slack alert posted
5. Remove test filter from Module 1

---

### Step 7: Activate Scenario

1. In Make.com, click **"On"** to activate
2. Scenario will now run automatically on new Verizon emails
3. Check **Scheduling**: Should be "Instant" (webhook-triggered)
4. Set **Max Execution Time**: 60 seconds
5. Set **Max Consecutive Errors**: 5

---

## 🧪 Testing & Validation

### Test Case 1: Critical Severity Email

**Setup**:
- Send email with keywords: "service disconnection", "billing dispute", "disabled"
- Expected: CRITICAL alert with @mention

**Validation**:
- ✅ Slack alert posted to #verizon-watch
- ✅ @mention of user U0917LJH52L
- ✅ Notion record created with CRITICAL severity
- ✅ Drive evidence uploaded
- ✅ All links working

---

### Test Case 2: High Severity Email

**Setup**:
- Send email with keywords: "collections", "late payment", "delinquent"
- Expected: HIGH alert (no @mention)

**Validation**:
- ✅ Slack alert posted
- ✅ No @mention
- ✅ Notion record with HIGH severity
- ✅ Evidence preserved

---

### Test Case 3: Standard Email

**Setup**:
- Send routine email: "Your bill is ready", "service update"
- Expected: Standard notification

**Validation**:
- ✅ Logged to Notion
- ✅ Standard Slack message
- ✅ Evidence preserved

---

### Test Case 4: Error Recovery

**Setup**:
- Temporarily break Notion connection
- Send test email
- Expected: Error alert

**Validation**:
- ✅ Error handler triggered
- ✅ Slack alert with error details
- ✅ @mention for manual intervention

---

## 📊 Monitoring & Maintenance

### Daily Checks

**Morning Review** (5 minutes):
1. Check #verizon-watch for overnight alerts
2. Review new Notion records
3. Verify no error alerts

**Weekly Review** (15 minutes):
1. Review all cases in Notion
2. Check Drive evidence folder size
3. Verify scenario execution history in Make.com

### Monthly Maintenance

1. **Archive old evidence** (older than 90 days)
2. **Review violation patterns** in Notion
3. **Update GPT-4 prompt** if needed for better classification
4. **Check API usage**:
   - OpenAI tokens
   - Make.com operations
   - Gmail API calls

---

## 🔧 Troubleshooting

### Issue: No alerts appearing

**Diagnosis**:
1. Check Make.com scenario status (On/Off)
2. Check Gmail connection validity
3. Check filter syntax in Module 1

**Fix**:
- Reactivate scenario
- Reconnect Gmail
- Test filter: `from:verizon.com`

---

### Issue: GPT-4 analysis fails

**Diagnosis**:
1. Check OpenAI API key validity
2. Check API quota/rate limits
3. Review error in Module 2 logs

**Fix**:
- Regenerate API key
- Upgrade OpenAI plan
- Add retry logic

---

### Issue: Notion record not created

**Diagnosis**:
1. Check Notion database ID correct
2. Verify all property names match
3. Check connection permissions

**Fix**:
- Update database ID in Module 5
- Rename properties to match
- Reconnect Notion with full access

---

### Issue: Slack alerts missing @mention

**Diagnosis**:
1. Verify user ID: `U0917LJH52L`
2. Check router logic in Module 6
3. Verify CRITICAL path selected

**Fix**:
- Update user ID in Module 7A
- Review router conditions
- Test with known CRITICAL email

---

## 🎯 Success Criteria

**Scenario is successful when**:

✅ **Detection**: All Verizon emails captured within 30 seconds  
✅ **Analysis**: GPT-4 classification accurate >90%  
✅ **Alerts**: Slack notifications <60 seconds from email receipt  
✅ **Logging**: 100% of emails logged to Notion  
✅ **Evidence**: All emails preserved in Drive  
✅ **Reliability**: <1% error rate over 7 days  

---

## 📈 Performance Metrics

**Expected Performance**:
- **Response Time**: 30-60 seconds from email to alert
- **Operations/Month**: ~100-150 (assuming 3-5 Verizon emails/day)
- **Storage**: ~5-10 MB/month in Drive
- **API Costs**: 
  - OpenAI: ~$5-10/month (GPT-4 tokens)
  - Make.com: 100-150 operations (~$0-5 on free plan)

---

## 🔐 Security & Privacy

**Data Protection**:
- ✅ All evidence stored in private Google Drive
- ✅ Notion database access restricted to owner
- ✅ Slack channel private (#verizon-watch)
- ✅ No data shared with third parties (except OpenAI for analysis)
- ✅ All connections use OAuth 2.0

**Compliance**:
- ✅ Email content never sent externally except for AI analysis
- ✅ Evidence retention follows legal requirements
- ✅ Audit trail maintained in Notion

---

## 🚀 Future Enhancements

### Phase 1.1: Certified Mail Automation (Optional)

**Add Module 9**: PostGrid > Send Certified Mail

When configured with PostGrid API key:
- Auto-generates response letter
- Sends certified mail automatically
- Logs tracking number to Notion

**Estimated Time**: 1 hour to implement

---

### Phase 1.2: Advanced Analytics

**Add Module 10**: Google Sheets > Log Summary

- Daily digest of all cases
- Violation type statistics
- Damage amount totals
- Timeline visualization

**Estimated Time**: 2 hours to implement

---

### Phase 1.3: Multi-Company Support

**Extend to Monitor**:
- AT&T
- Comcast
- Spectrum
- Other providers

**Estimated Time**: 30 minutes per company

---

## 📞 Support & Escalation

**If Issues Arise**:

1. **Check Scenario Logs**: Make.com → Scenarios → History
2. **Review Error Handler Alerts**: #verizon-watch for error notifications
3. **Manual Fallback**: Forward emails manually to Notion if automation fails
4. **Escalation**: Contact Make.com support for platform issues

---

## ✅ Deployment Checklist

**Pre-Deployment**:
- [ ] Notion database created with all properties
- [ ] Slack #verizon-watch channel created
- [ ] Google Drive folder structure created
- [ ] OpenAI API key obtained
- [ ] All Make.com connections configured

**Deployment**:
- [ ] JSON blueprint imported to Make.com
- [ ] All connections authenticated
- [ ] Test email sent and validated
- [ ] Scenario activated

**Post-Deployment**:
- [ ] First real Verizon email processed successfully
- [ ] Alerts appearing in #verizon-watch
- [ ] Notion records being created
- [ ] Evidence files in Drive
- [ ] Error handler tested

**Go-Live**:
- [ ] Scenario running for 24 hours without errors
- [ ] All alerts timely and accurate
- [ ] Team notified of new system
- [ ] Documentation shared

---

## 🎖️ Mission Status

**VERIZON_GUARDIAN_v1.0: READY FOR DEPLOYMENT**

⚖️ **Protection**: Active monitoring of all Verizon communications  
🛡️ **Evidence**: Automatic preservation and organization  
⚡ **Speed**: 30-60 second response time  
🎯 **Accuracy**: AI-powered violation detection  
📊 **Tracking**: Complete case timeline in Notion  

**The fortress stands guard. Verizon cannot move unseen.**

---

*Last Updated: 2025-12-04*  
*Version: 1.0*  
*Status: Production Ready*
