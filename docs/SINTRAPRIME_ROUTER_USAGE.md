# 🎯 SintraPrime Router v1 — Usage Guide

This guide shows how to use the `sintraprime-router-v1.js` module to route normalized email messages and integrate routing decisions with Make.com, Notion, Slack, and other systems.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Usage](#basic-usage)
3. [Integration Examples](#integration-examples)
4. [Make.com Integration](#makecom-integration)
5. [Notion Logging](#notion-logging)
6. [Slack Alerts](#slack-alerts)
7. [Full Pipeline Example](#full-pipeline-example)
8. [Testing](#testing)

---

## Quick Start

### Installation

The router is already included in the IKE-BOT repository:

```bash
# Location: src/utils/sintraprime-router-v1.js
```

### Basic Import

```javascript
const { routeMessage } = require('./src/utils/sintraprime-router-v1');
```

---

## Basic Usage

### Input: Normalized Message

```javascript
const normalizedMsg = {
  id: 'msg_123456',
  threadId: 'thread_abc',
  source: 'gmail',
  from: 'noreply@verizonwireless.com',
  to: ['enforcement@howardtrust.com'],
  subject: 'FINAL NOTICE: Account Suspension',
  bodyText: 'Your Verizon Wireless account will be suspended in 48 hours due to past due balance.',
  date: '2025-12-08T10:00:00Z',
  labels: ['inbox', 'important']
};
```

### Route the Message

```javascript
const { routeMessage } = require('./src/utils/sintraprime-router-v1');

const decision = routeMessage(normalizedMsg);

console.log(decision);
```

### Output: Route Decision

```json
{
  "dispatchTarget": "VERIZON_ENFORCEMENT",
  "creditor": "Verizon",
  "riskLevel": "high",
  "tags": [
    "creditor:verizon",
    "risk_keywords"
  ],
  "matchedRules": ["VERIZON"],
  "reason": "Route: VERIZON_ENFORCEMENT | Creditor: Verizon | Risk: high | RiskKeywords: final notice, suspension, past due",
  "meta": {
    "dishonorPrediction": {
      "dishonorLikelihood": "low",
      "flags": []
    },
    "beneficiaryImpact": {
      "beneficiaryFlag": false,
      "severity": "none",
      "markers": []
    },
    "source": "gmail",
    "receivedAt": "2025-12-08T10:00:00Z"
  },
  "rawMessage": { /* original normalized message */ }
}
```

---

## Integration Examples

### 1. IKE-BOT Webhook Handler

Integrate the router into your existing Make.com webhook handler:

```typescript
// src/webhooks/make.webhook.ts
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
const { routeMessage } = require('../utils/sintraprime-router-v1');

export const handleMakeWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Log the incoming webhook
    console.log('Make.com webhook received:', {
      scenario: payload.scenario_name,
      timestamp: new Date().toISOString(),
    });

    // NEW: If payload contains a normalized message, route it
    if (payload.normalized_message) {
      const decision = routeMessage(payload.normalized_message);
      
      // Log routing decision
      await supabase.from('agent_logs').insert({
        trace_id: payload.trace_id || crypto.randomUUID(),
        level: 'info',
        message: `Routing decision: ${decision.dispatchTarget}`,
        action: 'route_message',
        metadata: {
          decision,
          creditor: decision.creditor,
          risk_level: decision.riskLevel,
          dispatch_target: decision.dispatchTarget
        },
      });
      
      // Route to appropriate handler based on dispatch target
      switch (decision.dispatchTarget) {
        case 'VERIZON_ENFORCEMENT':
          await handleVerizonEnforcement(decision);
          break;
        case 'IRS_ENFORCEMENT':
          await handleIRSEnforcement(decision);
          break;
        case 'WELLS_FARGO_ENFORCEMENT':
          await handleWellsFargoEnforcement(decision);
          break;
        case 'CHASE_EWS_ENFORCEMENT':
          await handleChaseEWSEnforcement(decision);
          break;
        case 'DAKOTA_FINANCIAL_ENFORCEMENT':
          await handleDakotaFinancialEnforcement(decision);
          break;
        case 'TIKTOK_ACTIVITY':
          await handleTikTokActivity(decision);
          break;
        default:
          await handleGeneralInbox(decision);
      }
      
      return res.json({ 
        success: true, 
        message: 'Message routed successfully',
        decision 
      });
    }

    // Existing webhook handling...
    if (!payload.action) {
      return res.status(400).json({ error: 'Missing action field' });
    }

    // Route to appropriate handler based on action
    switch (payload.action) {
      case 'create_beneficiary':
        await handleCreateBeneficiary(payload);
        break;
      case 'create_dispute':
        await handleCreateDispute(payload);
        break;
      case 'create_enforcement_packet':
        await handleCreateEnforcementPacket(payload);
        break;
      case 'billing_alert':
        await handleBillingAlert(payload);
        break;
      default:
        console.log(`Unknown Make.com action: ${payload.action}`);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Error processing Make.com webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Handler functions
async function handleVerizonEnforcement(decision: any) {
  // Create Verizon-specific enforcement action
  await supabase.from('enforcement_packets').insert({
    beneficiary_id: null, // TODO: link to beneficiary
    packet_type: 'verizon_dispute',
    target_agency: 'CFPB',
    status: 'pending',
    risk_level: decision.riskLevel,
    creditor: decision.creditor,
    metadata: decision
  });
}

async function handleIRSEnforcement(decision: any) {
  // Create IRS-specific enforcement action
  await supabase.from('enforcement_packets').insert({
    beneficiary_id: null,
    packet_type: 'irs_notice_response',
    target_agency: 'IRS',
    status: 'pending',
    risk_level: decision.riskLevel,
    creditor: decision.creditor,
    metadata: decision
  });
}

async function handleWellsFargoEnforcement(decision: any) {
  // Create Wells Fargo dispute
  await supabase.from('credit_disputes').insert({
    beneficiary_id: null,
    creditor_name: 'Wells Fargo',
    dispute_reason: decision.reason,
    dispute_type: 'banking',
    status: 'pending',
    metadata: decision
  });
}

async function handleChaseEWSEnforcement(decision: any) {
  // Create Chase/EWS dispute
  await supabase.from('credit_disputes').insert({
    beneficiary_id: null,
    creditor_name: 'Chase / Early Warning Services',
    dispute_reason: decision.reason,
    dispute_type: 'banking',
    status: 'pending',
    metadata: decision
  });
}

async function handleDakotaFinancialEnforcement(decision: any) {
  // Create Dakota Financial dispute
  await supabase.from('credit_disputes').insert({
    beneficiary_id: null,
    creditor_name: 'Dakota Financial',
    dispute_reason: decision.reason,
    dispute_type: 'collections',
    status: 'pending',
    metadata: decision
  });
}

async function handleTikTokActivity(decision: any) {
  // Log TikTok activity (lead generation)
  await supabase.from('agent_logs').insert({
    trace_id: crypto.randomUUID(),
    level: 'info',
    message: 'TikTok activity detected',
    action: 'tiktok_lead',
    metadata: decision
  });
}

async function handleGeneralInbox(decision: any) {
  // Log to general inbox
  await supabase.from('agent_logs').insert({
    trace_id: crypto.randomUUID(),
    level: 'info',
    message: 'General inbox routing',
    action: 'general_routing',
    metadata: decision
  });
}

// Existing handler functions...
async function handleCreateBeneficiary(payload: any) {
  const { data } = payload;
  await supabase.from('beneficiaries').insert({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    relationship: data.relationship,
  });
}

async function handleCreateDispute(payload: any) {
  const { data } = payload;
  await supabase.from('credit_disputes').insert({
    beneficiary_id: data.beneficiary_id,
    creditor_name: data.creditor_name,
    dispute_reason: data.dispute_reason,
    dispute_type: data.dispute_type,
  });
}

async function handleCreateEnforcementPacket(payload: any) {
  const { data } = payload;
  await supabase.from('enforcement_packets').insert({
    beneficiary_id: data.beneficiary_id,
    packet_type: data.packet_type,
    target_agency: data.target_agency,
    status: 'pending',
  });
}

async function handleBillingAlert(payload: any) {
  const { data } = payload;
  await supabase.from('billing_events').insert({
    event_type: 'billing_alert',
    event_source: 'make.com',
    amount: data.amount,
    status: data.status,
    metadata: data,
  });
}
```

---

## Make.com Integration

### Scenario: Gmail → Normalizer → Router → Dispatch

#### Module 1: Gmail Search

```javascript
// Gmail search for enforcement emails
// Already configured in GMAIL_ENFORCEMENT_SCANNER.md
```

#### Module 2: Message Normalizer

```javascript
// Set variables (Make.com)
{
  "normalized_message": {
    "id": "{{1.Message ID}}",
    "threadId": "{{1.Thread ID}}",
    "source": "gmail",
    "from": "{{1.From}}",
    "to": ["{{1.To}}"],
    "subject": "{{1.Subject}}",
    "bodyText": "{{1.Body Plain}}",
    "bodyHtml": "{{1.Body HTML}}",
    "date": "{{1.Date}}",
    "labels": {{1.Labels}}
  }
}
```

#### Module 3: HTTP Request to IKE-BOT Router

```javascript
// HTTP → Make a request
{
  "url": "https://your-ike-bot-server.com/webhooks/make",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "X-Make-Signature": "{{your-webhook-secret}}"
  },
  "body": {
    "normalized_message": "{{normalized_message}}",
    "scenario_name": "Gmail_Enforcement_Router",
    "trace_id": "{{uuid()}}"
  }
}
```

#### Module 4: Router Decision Handler

The IKE-BOT server returns the routing decision:

```javascript
// Response from IKE-BOT
{
  "success": true,
  "message": "Message routed successfully",
  "decision": {
    "dispatchTarget": "VERIZON_ENFORCEMENT",
    "creditor": "Verizon",
    "riskLevel": "high",
    "tags": ["creditor:verizon", "risk_keywords"],
    "matchedRules": ["VERIZON"],
    "reason": "Route: VERIZON_ENFORCEMENT | Creditor: Verizon | Risk: high | RiskKeywords: final notice, suspension, past due"
  }
}
```

#### Module 5: Router Branch Filter

Add a Router module with branches based on `dispatchTarget`:

**Branch A: Verizon Enforcement**
```javascript
// Filter
{{4.decision.dispatchTarget}} = "VERIZON_ENFORCEMENT"
```

**Branch B: IRS Enforcement**
```javascript
// Filter
{{4.decision.dispatchTarget}} = "IRS_ENFORCEMENT"
```

**Branch C: Wells Fargo Enforcement**
```javascript
// Filter
{{4.decision.dispatchTarget}} = "WELLS_FARGO_ENFORCEMENT"
```

And so on for each dispatch target...

---

## Notion Logging

### Log Routing Decision to Notion

```javascript
// Notion → Create a Database Item
{
  "database_id": "your_routing_log_database_id",
  "properties": {
    "Title": {
      "title": [
        {
          "text": {
            "content": "{{4.decision.creditor}} - {{1.Subject}}"
          }
        }
      ]
    },
    "Dispatch Target": {
      "select": {
        "name": "{{4.decision.dispatchTarget}}"
      }
    },
    "Creditor": {
      "select": {
        "name": "{{4.decision.creditor}}"
      }
    },
    "Risk Level": {
      "select": {
        "name": "{{4.decision.riskLevel}}"
      }
    },
    "Tags": {
      "multi_select": "{{4.decision.tags}}"
    },
    "Matched Rules": {
      "multi_select": "{{4.decision.matchedRules}}"
    },
    "Reason": {
      "rich_text": [
        {
          "text": {
            "content": "{{4.decision.reason}}"
          }
        }
      ]
    },
    "Dishonor Likelihood": {
      "select": {
        "name": "{{4.decision.meta.dishonorPrediction.dishonorLikelihood}}"
      }
    },
    "Beneficiary Impact": {
      "select": {
        "name": "{{4.decision.meta.beneficiaryImpact.severity}}"
      }
    },
    "Source Email": {
      "email": "{{1.From}}"
    },
    "Received At": {
      "date": {
        "start": "{{1.Date}}"
      }
    },
    "Message ID": {
      "rich_text": [
        {
          "text": {
            "content": "{{1.Message ID}}"
          }
        }
      ]
    },
    "Raw Decision": {
      "rich_text": [
        {
          "text": {
            "content": "{{toString(4.decision)}}"
          }
        }
      ]
    }
  }
}
```

---

## Slack Alerts

### Send Routing Alert to Slack

```javascript
// Slack → Create a Message
{
  "channel": "#enforcement-routing",
  "text": "🎯 New Enforcement Email Routed",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🎯 Enforcement Email Routed",
        "emoji": true
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Creditor:*\n{{4.decision.creditor}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Dispatch Target:*\n{{4.decision.dispatchTarget}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Risk Level:*\n{{4.decision.riskLevel}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Dishonor Risk:*\n{{4.decision.meta.dishonorPrediction.dishonorLikelihood}}"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*From:* {{1.From}}\n*Subject:* {{1.Subject}}"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Reason:*\n{{4.decision.reason}}"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Tags:* {{join(4.decision.tags; ', ')}}"
      }
    }
  ]
}
```

### Conditional High-Risk Alert

Add a filter before the Slack module:

```javascript
// Filter: High or Critical Risk Only
{{4.decision.riskLevel}} = "high" OR {{4.decision.riskLevel}} = "critical"
```

---

## Full Pipeline Example

### Complete Make.com Scenario with Router

```
┌─────────────────────────────────────────────────────────────┐
│  Gmail Enforcement Scanner with Router Integration          │
└─────────────────────────────────────────────────────────────┘

[1. Gmail: Search Messages]
         ↓
[2. Set Variables: Normalize Message]
         ↓
[3. HTTP: POST to IKE-BOT /webhooks/make]
         ↓
[4. HTTP Response contains routing decision]
         ↓
[5. Router: Branch by dispatchTarget]
         ├─ Branch A: VERIZON_ENFORCEMENT
         │    ├─ Notion: Log to Verizon DB
         │    ├─ Slack: Alert #verizon-enforcement
         │    └─ HTTP: Trigger Verizon workflow
         │
         ├─ Branch B: IRS_ENFORCEMENT
         │    ├─ Notion: Log to IRS DB
         │    ├─ Slack: Alert #irs-enforcement
         │    └─ HTTP: Trigger IRS workflow
         │
         ├─ Branch C: WELLS_FARGO_ENFORCEMENT
         │    ├─ Notion: Log to Banking DB
         │    ├─ Slack: Alert #banking-enforcement
         │    └─ HTTP: Trigger Wells Fargo workflow
         │
         ├─ (... more branches ...)
         │
         └─ Branch Z: GENERAL_INBOX (fallback)
              ├─ Notion: Log to General DB
              └─ Slack: Alert #general-inbox

[6. Notion: Master Routing Log] (always runs, no filter)
```

---

## Testing

### Test Script

Create a test file to validate the router:

```javascript
// test/sintraprime-router.test.js
const { routeMessage } = require('../src/utils/sintraprime-router-v1');

// Test cases
const testCases = [
  {
    name: 'Verizon High Risk',
    input: {
      id: 'test_001',
      source: 'gmail',
      from: 'noreply@verizonwireless.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'FINAL NOTICE: Service Suspension',
      bodyText: 'Your account will be disconnected due to past due balance.',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'VERIZON_ENFORCEMENT',
    expectedRiskLevel: 'high'
  },
  {
    name: 'IRS Critical Risk',
    input: {
      id: 'test_002',
      source: 'gmail',
      from: 'notices@irs.gov',
      to: ['enforcement@howardtrust.com'],
      subject: 'Notice of Intent to Levy',
      bodyText: 'Final notice before levy action. CP-504 Notice.',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'IRS_ENFORCEMENT',
    expectedRiskLevel: 'critical'
  },
  {
    name: 'Wells Fargo Medium Risk',
    input: {
      id: 'test_003',
      source: 'gmail',
      from: 'alerts@wellsfargo.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'Account Status Update',
      bodyText: 'Your account has a past due balance. Please contact us.',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'WELLS_FARGO_ENFORCEMENT',
    expectedRiskLevel: 'medium'
  },
  {
    name: 'TikTok Lead (Low Risk)',
    input: {
      id: 'test_004',
      source: 'gmail',
      from: 'notifications@tiktok.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'Someone mentioned you in a comment',
      bodyText: 'User123 mentioned you: How do I fix my credit?',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'TIKTOK_ACTIVITY',
    expectedRiskLevel: 'low'
  },
  {
    name: 'Beneficiary Impact Detection',
    input: {
      id: 'test_005',
      source: 'gmail',
      from: 'collections@dakotafinancial.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'Final Notice',
      bodyText: 'Failure to pay may result in eviction and impact your family and children.',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'DAKOTA_FINANCIAL_ENFORCEMENT',
    expectedBeneficiaryFlag: true
  }
];

// Run tests
console.log('🧪 Running SintraPrime Router Tests...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    const decision = routeMessage(testCase.input);
    
    const dispatchMatches = decision.dispatchTarget === testCase.expectedDispatchTarget;
    const riskMatches = !testCase.expectedRiskLevel || decision.riskLevel === testCase.expectedRiskLevel;
    const beneficiaryMatches = !testCase.expectedBeneficiaryFlag || 
      decision.meta.beneficiaryImpact.beneficiaryFlag === testCase.expectedBeneficiaryFlag;
    
    if (dispatchMatches && riskMatches && beneficiaryMatches) {
      console.log(`✅ Test ${index + 1}: ${testCase.name}`);
      console.log(`   Dispatch: ${decision.dispatchTarget}`);
      console.log(`   Risk: ${decision.riskLevel}`);
      console.log(`   Tags: ${decision.tags.join(', ')}`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.name}`);
      console.log(`   Expected: ${testCase.expectedDispatchTarget} / ${testCase.expectedRiskLevel}`);
      console.log(`   Got: ${decision.dispatchTarget} / ${decision.riskLevel}`);
      failed++;
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Test ${index + 1}: ${testCase.name} - ERROR`);
    console.log(`   ${error.message}`);
    console.log('');
    failed++;
  }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
```

### Run Tests

```bash
node test/sintraprime-router.test.js
```

---

## API Reference

### `routeMessage(msg)`

**Parameters:**
- `msg` (NormalizedMessage): The normalized email message

**Returns:**
- `RouteDecision`: Object containing routing decision

**Throws:**
- `Error`: If message is invalid (missing required fields)

### NormalizedMessage Schema

```typescript
{
  id: string;              // Required: unique message ID
  threadId?: string;       // Optional: thread/conversation ID
  source?: string;         // Optional: 'gmail', 'outlook', etc.
  from: string;            // Required: sender email
  to: string[];            // Required: recipient emails
  replyTo?: string;        // Optional: reply-to address
  subject: string;         // Required: email subject
  bodyText: string;        // Required: plain text body
  bodyHtml?: string;       // Optional: HTML body
  date?: string;           // Optional: ISO date string
  labels?: string[];       // Optional: tags/labels
  headers?: object;        // Optional: email headers
}
```

### RouteDecision Schema

```typescript
{
  dispatchTarget: string;        // Target workflow (e.g., 'VERIZON_ENFORCEMENT')
  creditor: string;              // Creditor name (e.g., 'Verizon')
  riskLevel: string;             // 'low' | 'medium' | 'high' | 'critical'
  tags: string[];                // Array of tags
  matchedRules: string[];        // Rules that matched
  reason: string;                // Human-readable explanation
  meta: {
    dishonorPrediction: {
      dishonorLikelihood: string;  // 'low' | 'medium' | 'high'
      flags: string[];             // Dishonor indicators
    };
    beneficiaryImpact: {
      beneficiaryFlag: boolean;
      severity: string;            // 'none' | 'medium' | 'high'
      markers: string[];           // Impact keywords found
    };
    source: string;
    receivedAt: string;          // ISO date string
  };
  rawMessage: object;            // Original normalized message
}
```

---

## Best Practices

1. **Always normalize messages** before routing
2. **Log all routing decisions** to Notion for audit trail
3. **Handle errors gracefully** - invalid messages should not crash the system
4. **Monitor dispatch targets** to ensure proper distribution
5. **Review and update rules** regularly based on new patterns
6. **Test with real emails** before deploying to production
7. **Set up alerts** for critical risk emails
8. **Link to beneficiaries** when applicable

---

## Support

- Router implementation: `src/utils/sintraprime-router-v1.js`
- Integration docs: This file (`SINTRAPRIME_ROUTER_USAGE.md`)
- Make.com setup: `GMAIL_ENFORCEMENT_SCANNER.md`
- Advanced features: `SINTRAPRIME_ROUTER_V1_UPGRADES.md`

---

**Version:** v1.0  
**Last Updated:** 2025-12-08  
**Status:** ✅ Production Ready
