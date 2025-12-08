# 🚀 SintraPrime Router v1 — Advanced Upgrades

This document provides advanced upgrades and enhancements to the SintraPrime Orchestration Router v1 and Gmail Enforcement Scanner, including OAuth helpers, message normalization, expanded trigger conditions, error handling, security guardrails, and SintraPrime intelligence hooks.

---

## 📑 Table of Contents

1. [Gmail OAuth Connection Helper](#1-gmail-oauth-connection-helper)
2. [Message Normalizer Function](#2-message-normalizer-function)
3. [Trigger Condition Mapping](#3-trigger-condition-mapping)
4. [Routing Logic with Structured JSON](#4-routing-logic-with-structured-json)
5. [Error Handling Module](#5-error-handling-module)
6. [Security Guard Rails](#6-security-guard-rails)
7. [SintraPrime Intelligence Hooks](#7-sintraprime-intelligence-hooks)

---

## 1. Gmail OAuth Connection Helper

### **Purpose**
Simplify Gmail OAuth connection setup for Make.com integration with step-by-step guidance and troubleshooting.

### **Setup Instructions**

#### **Step 1: Create Gmail Connection in Make.com**

1. Navigate to Make.com → **Scenarios**
2. Click **Create a new scenario**
3. Add **Gmail** module → **Search messages**
4. Click **Add** next to Connection dropdown

#### **Step 2: OAuth Authorization**

1. **Connection name:** `Howard_Trust_Gmail_Enforcement`
2. Click **Save**
3. You'll be redirected to Google OAuth consent screen
4. **Select your Google account** (enforcement inbox)
5. Review permissions:
   - ✅ Read email messages
   - ✅ Search email
   - ✅ View email metadata
6. Click **Allow**
7. You'll be redirected back to Make.com

#### **Step 3: Verify Connection**

```javascript
// Test connection with simple search
{
  "search_query": "newer_than:1d",
  "limit": 5
}
```

**Expected result:** List of recent emails

#### **Step 4: Store Connection Details**

**Document these for troubleshooting:**

| Field | Value | Notes |
|-------|-------|-------|
| Connection ID | `[auto-generated]` | Found in Make.com connection settings |
| Google Account | `your-email@gmail.com` | Enforcement inbox |
| Authorized Date | `YYYY-MM-DD` | When OAuth was granted |
| Scopes Granted | `gmail.readonly` | Read-only recommended |
| Token Refresh | Automatic | Make.com handles this |

### **Troubleshooting OAuth Issues**

#### **Issue: "Connection expired" error**

**Solution:**
```
1. Go to Make.com → Connections
2. Find "Howard_Trust_Gmail_Enforcement"
3. Click "Reauthorize"
4. Complete OAuth flow again
```

#### **Issue: "Insufficient permissions" error**

**Solution:**
```
1. Check Google Account → Security → Third-party apps
2. Ensure Make.com has "Read" access to Gmail
3. If restricted, remove and re-add connection
```

#### **Issue: "Rate limit exceeded" error**

**Solution:**
```
1. Reduce Gmail search frequency (from every 5 min to every 15 min)
2. Decrease search result limit (from 50 to 10)
3. Add rate limit handling (see Section 6)
```

### **OAuth Security Best Practices**

1. **Use dedicated enforcement inbox** (not personal Gmail)
2. **Enable 2FA** on Google account
3. **Regularly review** connected apps in Google Security settings
4. **Rotate OAuth tokens** quarterly (re-authorize connection)
5. **Monitor Gmail API quota** in Make.com execution logs

### **OAuth Connection Helper Script**

For IKE-BOT backend integration:

```typescript
// src/utils/gmailOAuthHelper.ts
import { google } from 'googleapis';

export interface GmailOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
}

export class GmailOAuthHelper {
  private oauth2Client: any;

  constructor(config: GmailOAuthConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
    
    this.oauth2Client.setCredentials({
      refresh_token: config.refreshToken
    });
  }

  async getAccessToken(): Promise<string> {
    try {
      const { token } = await this.oauth2Client.getAccessToken();
      return token;
    } catch (error) {
      throw new Error(`OAuth token refresh failed: ${error.message}`);
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      await gmail.users.labels.list({ userId: 'me' });
      return true;
    } catch (error) {
      console.error('Gmail connection validation failed:', error);
      return false;
    }
  }

  async refreshConnection(): Promise<void> {
    await this.oauth2Client.refreshAccessToken();
  }
}

// Usage example
const gmailHelper = new GmailOAuthHelper({
  clientId: process.env.GMAIL_CLIENT_ID!,
  clientSecret: process.env.GMAIL_CLIENT_SECRET!,
  redirectUri: process.env.GMAIL_REDIRECT_URI!,
  refreshToken: process.env.GMAIL_REFRESH_TOKEN!
});

// Validate before using
const isValid = await gmailHelper.validateConnection();
if (!isValid) {
  await gmailHelper.refreshConnection();
}
```

---

## 2. Message Normalizer Function

### **Purpose**
Standardize Gmail email data into consistent JSON format for reliable Router ingestion and processing.

### **Implementation in Make.com**

#### **Add After Gmail Module, Before Router**

**Module:** Tools → **Set multiple variables**

**Variables to set:**

```javascript
// Normalized sender
normalized_sender = {{toLower(1.From)}}

// Normalized subject
normalized_subject = {{toLower(1.Subject)}}

// Cleaned body text (remove HTML, extra whitespace)
normalized_body = {{replace(replace(1.Body Plain; newline; " "); "  "; " ")}}

// Extract domain from sender
sender_domain = {{substring(1.From; add(indexOf(1.From; "@"); 1); length(1.From))}}

// Message timestamp (ISO format)
normalized_timestamp = {{formatDate(1.Date; "YYYY-MM-DDTHH:mm:ssZ")}}

// Generate unique message hash
message_hash = {{sha256(1.Message ID)}}

// Extract first 200 chars for preview
body_preview = {{substring(normalized_body; 0; 200)}}

// Tag extraction (common keywords)
detected_tags = {{if(contains(normalized_body; "verizon"); ["verizon"]; [])}}
               + {{if(contains(normalized_body; "dispute"); ["dispute"]; [])}}
               + {{if(contains(normalized_body; "payment"); ["payment"]; [])}}

// Risk level detection (keyword-based)
risk_level = {{if(contains(normalized_body; "suspend") OR contains(normalized_body; "disconnect") OR contains(normalized_body; "legal action"); "high"; 
              if(contains(normalized_body; "past due") OR contains(normalized_body; "overdue"); "medium"; "low"))}}
```

### **Normalizer Output Schema**

```json
{
  "original": {
    "from": "{{1.From}}",
    "to": "{{1.To}}",
    "subject": "{{1.Subject}}",
    "date": "{{1.Date}}",
    "message_id": "{{1.Message ID}}",
    "thread_id": "{{1.Thread ID}}"
  },
  "normalized": {
    "sender": "{{normalized_sender}}",
    "sender_domain": "{{sender_domain}}",
    "subject": "{{normalized_subject}}",
    "body_text": "{{normalized_body}}",
    "body_preview": "{{body_preview}}",
    "timestamp": "{{normalized_timestamp}}",
    "message_hash": "{{message_hash}}"
  },
  "metadata": {
    "tags": "{{detected_tags}}",
    "risk_level": "{{risk_level}}",
    "has_attachments": "{{if(length(1.Attachments) > 0; true; false)}}",
    "word_count": "{{length(split(normalized_body; " "))}}",
    "char_count": "{{length(normalized_body)}}"
  }
}
```

### **JavaScript Normalizer Function (Advanced)**

For complex normalization, add a **JavaScript** module:

```javascript
// Input: Gmail message object
const message = input.gmail_message;

// Normalize sender email
function normalizeSender(from) {
  const email = from.match(/<(.+)>/)?.[1] || from;
  return email.toLowerCase().trim();
}

// Extract and clean body text
function cleanBodyText(bodyPlain, bodyHtml) {
  let text = bodyPlain || bodyHtml || '';
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Remove email signatures (simple heuristic)
  const sigIndex = text.indexOf('--');
  if (sigIndex > 0 && sigIndex > text.length * 0.5) {
    text = text.substring(0, sigIndex);
  }
  
  return text;
}

// Extract keywords/tags
function extractTags(text) {
  const tags = [];
  const keywords = {
    'verizon': ['verizon', 'fios', 'wireless'],
    'dispute': ['dispute', 'investigation', 'complaint'],
    'payment': ['payment', 'balance', 'overdue', 'past due'],
    'legal': ['legal action', 'attorney', 'court', 'lawsuit'],
    'disconnection': ['suspend', 'disconnect', 'terminate', 'cancel']
  };
  
  const lowerText = text.toLowerCase();
  for (const [tag, words] of Object.entries(keywords)) {
    if (words.some(word => lowerText.includes(word))) {
      tags.push(tag);
    }
  }
  
  return tags;
}

// Calculate risk level
function calculateRiskLevel(text, tags) {
  const highRiskKeywords = ['suspend', 'disconnect', 'legal action', 'attorney', 'court'];
  const mediumRiskKeywords = ['past due', 'overdue', 'balance', 'payment required'];
  
  const lowerText = text.toLowerCase();
  
  if (highRiskKeywords.some(word => lowerText.includes(word))) {
    return 'high';
  }
  if (mediumRiskKeywords.some(word => lowerText.includes(word))) {
    return 'medium';
  }
  return 'low';
}

// Perform normalization
const normalized = {
  original: {
    from: message.From,
    to: message.To,
    subject: message.Subject,
    date: message.Date,
    message_id: message['Message ID'],
    thread_id: message['Thread ID']
  },
  normalized: {
    sender: normalizeSender(message.From),
    sender_domain: normalizeSender(message.From).split('@')[1],
    subject: message.Subject.toLowerCase().trim(),
    body_text: cleanBodyText(message['Body Plain'], message['Body HTML']),
    body_preview: cleanBodyText(message['Body Plain'], message['Body HTML']).substring(0, 200),
    timestamp: new Date(message.Date).toISOString(),
    message_hash: require('crypto').createHash('sha256').update(message['Message ID']).digest('hex')
  },
  metadata: {
    tags: extractTags(cleanBodyText(message['Body Plain'], message['Body HTML'])),
    risk_level: calculateRiskLevel(cleanBodyText(message['Body Plain'], message['Body HTML']), extractTags(cleanBodyText(message['Body Plain'], message['Body HTML']))),
    has_attachments: (message.Attachments || []).length > 0,
    attachment_count: (message.Attachments || []).length,
    word_count: cleanBodyText(message['Body Plain'], message['Body HTML']).split(/\s+/).length
  }
};

// Output
output = normalized;
```

---

## 3. Trigger Condition Mapping

### **Purpose**
Define precise trigger conditions for each creditor/entity to ensure accurate routing and categorization.

### **Creditor-Specific Trigger Mapping**

#### **Verizon (Wireless & Fios)**

```javascript
// Router Filter Condition
{
  "name": "Verizon Detection",
  "conditions": [
    {
      "field": "normalized_sender_domain",
      "operator": "contains_any",
      "values": ["verizon.com", "verizonwireless.com", "vzw.com"]
    },
    "OR",
    {
      "field": "normalized_subject",
      "operator": "contains_any",
      "values": ["verizon", "fios", "wireless"]
    },
    "OR",
    {
      "field": "normalized_body",
      "operator": "contains_any",
      "values": ["verizon account", "fios service", "wireless service"]
    }
  ],
  "sub_classification": {
    "Verizon Wireless": {
      "keywords": ["wireless", "cell", "mobile", "5g", "data plan"],
      "domains": ["verizonwireless.com", "vzw.com"]
    },
    "Verizon Fios": {
      "keywords": ["fios", "internet", "fiber", "tv service", "equipment"],
      "domains": ["verizon.com"]
    }
  }
}
```

#### **IRS (Internal Revenue Service)**

```javascript
{
  "name": "IRS Detection",
  "conditions": [
    {
      "field": "normalized_sender_domain",
      "operator": "equals_any",
      "values": ["irs.gov", "eftps.gov"]
    },
    "OR",
    {
      "field": "normalized_subject",
      "operator": "contains_any",
      "values": ["irs", "internal revenue", "tax notice", "cp notice"]
    },
    "OR",
    {
      "field": "normalized_body",
      "operator": "contains_any",
      "values": ["internal revenue service", "ein", "tax id", "cp-", "notice cp"]
    }
  ],
  "priority_keywords": ["cp-504", "cp-523", "levy", "lien", "seizure"],
  "risk_escalation": {
    "critical": ["levy", "seizure", "final notice"],
    "high": ["cp-504", "cp-523", "collection"],
    "medium": ["cp-", "notice", "balance due"]
  }
}
```

#### **Wells Fargo**

```javascript
{
  "name": "Wells Fargo Detection",
  "conditions": [
    {
      "field": "normalized_sender_domain",
      "operator": "contains_any",
      "values": ["wellsfargo.com", "wf.com"]
    },
    "OR",
    {
      "field": "normalized_subject",
      "operator": "contains_any",
      "values": ["wells fargo", "wf account", "wellsfargo"]
    },
    "OR",
    {
      "field": "normalized_body",
      "operator": "contains_any",
      "values": ["wells fargo bank", "wf customer service"]
    }
  ],
  "alert_keywords": ["overdraft", "negative balance", "account closure", "fraud alert"],
  "account_types": {
    "checking": ["checking", "chk"],
    "savings": ["savings", "sav"],
    "credit": ["credit card", "cc"]
  }
}
```

#### **Chase / Early Warning Services (EWS)**

```javascript
{
  "name": "Chase/EWS Detection",
  "conditions": [
    {
      "field": "normalized_sender_domain",
      "operator": "contains_any",
      "values": ["chase.com", "jpmorganchase.com", "earlywarning.com"]
    },
    "OR",
    {
      "field": "normalized_subject",
      "operator": "contains_any",
      "values": ["chase", "jpmorgan", "early warning", "chexsystems"]
    },
    "OR",
    {
      "field": "normalized_body",
      "operator": "contains_any",
      "values": ["chase bank", "early warning services", "chexsystems report"]
    }
  ],
  "critical_indicators": ["chexsystems", "account closed", "negative report", "fraud alert"],
  "dispute_triggers": ["dispute", "error", "incorrect information", "not mine"]
}
```

#### **Dakota Financial**

```javascript
{
  "name": "Dakota Financial Detection",
  "conditions": [
    {
      "field": "normalized_sender_domain",
      "operator": "contains_any",
      "values": ["dakotafinancial.com", "dfcollect.com"]
    },
    "OR",
    {
      "field": "normalized_subject",
      "operator": "contains_any",
      "values": ["dakota financial", "debt collection", "collection notice"]
    },
    "OR",
    {
      "field": "normalized_body",
      "operator": "contains_any",
      "values": ["dakota financial", "collection agency", "debt collector"]
    }
  },
  "fdcpa_triggers": ["validation", "cease and desist", "attorney", "dispute"],
  "violation_keywords": ["threaten", "harass", "call before 8am", "call after 9pm"]
}
```

#### **TikTok Alerts**

```javascript
{
  "name": "TikTok Detection",
  "conditions": [
    {
      "field": "normalized_sender_domain",
      "operator": "contains_any",
      "values": ["tiktok.com", "bytedance.com"]
    },
    "OR",
    {
      "field": "normalized_subject",
      "operator": "contains_any",
      "values": ["tiktok", "tik tok", "@tiktok"]
    },
    "OR",
    {
      "field": "normalized_body",
      "operator": "contains_any",
      "values": ["tiktok notification", "tiktok message", "someone mentioned you"]
    }
  },
  "notification_types": {
    "lead": ["interested", "dm me", "how do i", "need help"],
    "comment": ["commented on", "replied to"],
    "mention": ["mentioned you", "tagged you"]
  }
}
```

### **Consolidated Trigger Mapping Table**

| Creditor | Primary Domain | Subject Keywords | Body Keywords | Risk Keywords |
|----------|---------------|------------------|---------------|---------------|
| **Verizon Wireless** | verizonwireless.com, vzw.com | verizon, wireless, cell | wireless service, mobile account | suspend, disconnect, terminate |
| **Verizon Fios** | verizon.com | fios, internet, fiber | fios service, equipment | suspend, disconnect, service interruption |
| **IRS** | irs.gov | irs, cp notice, tax | internal revenue, notice cp | levy, seizure, final notice |
| **Wells Fargo** | wellsfargo.com | wells fargo, wf account | wells fargo bank | overdraft, account closure, fraud |
| **Chase/EWS** | chase.com, earlywarning.com | chase, early warning | chase bank, chexsystems | account closed, negative report |
| **Dakota Financial** | dakotafinancial.com | dakota, collection | debt collector, collection agency | threaten, harass, legal action |
| **TikTok** | tiktok.com | tiktok, notification | tiktok message, mentioned you | (none - social lead) |

---

## 4. Routing Logic with Structured JSON

### **Purpose**
Generate consistent, parseable JSON output from Router paths for downstream processing.

### **Structured JSON Output Schema**

```json
{
  "routing": {
    "creditor": "Verizon Wireless",
    "category": "telecom",
    "subcategory": "wireless",
    "route_path": "verizon-wireless",
    "confidence": 0.95
  },
  "message": {
    "sender": "noreply@verizonwireless.com",
    "subject": "Your Verizon Wireless Account - Important Notice",
    "body_text": "Your account is past due. Please remit payment immediately to avoid service interruption.",
    "body_preview": "Your account is past due. Please remit payment immediately to avoid...",
    "timestamp": "2025-12-08T05:00:00Z",
    "message_id": "abc123xyz",
    "thread_id": "thread_456"
  },
  "analysis": {
    "tags": ["verizon", "wireless", "payment", "disconnection"],
    "risk_level": "high",
    "priority": "urgent",
    "requires_action": true,
    "action_deadline": "2025-12-15T00:00:00Z"
  },
  "metadata": {
    "processed_at": "2025-12-08T05:01:23Z",
    "router_version": "v1.2",
    "normalizer_version": "v1.0"
  }
}
```

### **Implementation in Make.com Router Paths**

For each Router path, add a **JSON** module that structures the output:

```javascript
// Verizon Wireless Path - Structured JSON
{
  "routing": {
    "creditor": "Verizon Wireless",
    "category": "telecom",
    "subcategory": "wireless",
    "route_path": "verizon-wireless",
    "confidence": {{if(contains(normalized_sender_domain; "verizonwireless"); 1.0; 
                     if(contains(normalized_sender_domain; "vzw"); 0.9; 0.7))}}
  },
  "message": {
    "sender": "{{normalized_sender}}",
    "subject": "{{normalized_subject}}",
    "body_text": "{{normalized_body}}",
    "body_preview": "{{body_preview}}",
    "timestamp": "{{normalized_timestamp}}",
    "message_id": "{{1.Message ID}}",
    "thread_id": "{{1.Thread ID}}"
  },
  "analysis": {
    "tags": {{detected_tags}},
    "risk_level": "{{risk_level}}",
    "priority": "{{if(risk_level = "high"; "urgent"; if(risk_level = "medium"; "normal"; "low"))}}",
    "requires_action": {{if(risk_level = "high" OR risk_level = "medium"; true; false)}},
    "action_deadline": "{{if(contains(normalized_body; "immediate"); addDays(now; 3); addDays(now; 14))}}"
  },
  "metadata": {
    "processed_at": "{{now}}",
    "router_version": "v1.2",
    "normalizer_version": "v1.0"
  }
}
```

### **Creditor-Specific JSON Outputs**

#### **IRS Structured Output**

```json
{
  "routing": {
    "creditor": "IRS",
    "category": "government",
    "subcategory": "tax",
    "route_path": "irs-notices",
    "confidence": 1.0
  },
  "message": {
    "sender": "{{normalized_sender}}",
    "subject": "{{normalized_subject}}",
    "body_text": "{{normalized_body}}",
    "timestamp": "{{normalized_timestamp}}",
    "notice_type": "{{if(contains(normalized_subject; 'cp-'); substring(normalized_subject; indexOf(normalized_subject; 'cp-'); 6); 'unknown')}}",
    "tax_year": "{{if(contains(normalized_body; '2024'); '2024'; if(contains(normalized_body; '2023'); '2023'; 'unknown'))}}"
  },
  "analysis": {
    "tags": ["irs", "tax", "government", "{{if(contains(normalized_body; 'levy'); 'levy'; ''}}"],
    "risk_level": "{{if(contains(normalized_body; 'levy') OR contains(normalized_body; 'seizure'); 'critical'; 
                     if(contains(normalized_body; 'final notice'); 'high'; 'medium'))}}",
    "priority": "urgent",
    "statute_refs": ["IRC §6331", "IRC §6334"],
    "response_deadline": "{{if(contains(normalized_body; '30 days'); addDays(normalized_timestamp; 30); addDays(normalized_timestamp; 60))}}"
  }
}
```

#### **Banking Dispute Output**

```json
{
  "routing": {
    "creditor": "Wells Fargo",
    "category": "banking",
    "subcategory": "dispute",
    "route_path": "wells-fargo-dispute",
    "confidence": 0.88
  },
  "message": {
    "sender": "{{normalized_sender}}",
    "subject": "{{normalized_subject}}",
    "body_text": "{{normalized_body}}",
    "account_number": "{{if(contains(normalized_body; 'Account:'); 
                          substring(normalized_body; add(indexOf(normalized_body; 'Account:'); 8); 12); 'unknown')}}",
    "transaction_amount": "{{if(contains(normalized_body; '$'); 
                             parseNumber(substring(normalized_body; add(indexOf(normalized_body; '$'); 1); 10)); 0)}}"
  },
  "analysis": {
    "tags": ["wells-fargo", "banking", "{{if(contains(normalized_body; 'overdraft'); 'overdraft'; 'transaction')}}"],
    "risk_level": "{{if(contains(normalized_body; 'closure'); 'high'; 'medium')}}",
    "dispute_type": "{{if(contains(normalized_body; 'fraud'); 'fraud'; 
                       if(contains(normalized_body; 'unauthorized'); 'unauthorized'; 'error'))}}",
    "applicable_regs": ["Reg E", "FCRA", "FDCPA"]
  }
}
```

---

## 5. Error Handling Module

### **Purpose**
Implement robust error handling with retry logic, dead-letter queuing, and comprehensive logging.

### **Error Handler Architecture**

```
Gmail Module → [Error Check] → Normalizer → Router
                    ↓ (if error)
              Error Handler Module
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
 Retry Logic   Dead Letter     Error Logger
                Queue
```

### **Implementation: Error Handler Module**

#### **Add After Gmail Module**

**Module:** Tools → **Error handler**

**Configuration:**

```javascript
{
  "on_error": {
    "action": "handle",
    "handler": {
      "retry": {
        "enabled": true,
        "max_attempts": 3,
        "backoff": "exponential",
        "initial_delay": 5,
        "max_delay": 60
      },
      "dead_letter_queue": {
        "enabled": true,
        "destination": "notion_error_log"
      },
      "logging": {
        "enabled": true,
        "log_level": "error",
        "include_stack_trace": true
      }
    }
  }
}
```

### **Retry Logic Implementation**

```javascript
// Add after each critical module
{
  "error_handler": {
    "type": "retry",
    "config": {
      "max_retries": 3,
      "retry_delays": [5, 15, 60], // seconds
      "retry_conditions": [
        "network_timeout",
        "rate_limit_exceeded",
        "temporary_failure"
      ],
      "fallback_action": "send_to_dlq"
    }
  }
}

// Retry function (JavaScript module)
function retryWithBackoff(operation, maxRetries = 3) {
  let attempt = 0;
  const delays = [5000, 15000, 60000]; // milliseconds
  
  async function execute() {
    try {
      attempt++;
      return await operation();
    } catch (error) {
      if (attempt >= maxRetries) {
        // Send to dead letter queue
        await sendToDeadLetterQueue(error, operation);
        throw new Error(`Max retries (${maxRetries}) exceeded: ${error.message}`);
      }
      
      // Check if error is retryable
      if (isRetryableError(error)) {
        const delay = delays[attempt - 1] || 60000;
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);
        await sleep(delay);
        return execute();
      }
      
      throw error;
    }
  }
  
  return execute();
}

function isRetryableError(error) {
  const retryableErrors = [
    'ETIMEDOUT',
    'ECONNRESET',
    'RATE_LIMIT_EXCEEDED',
    'TEMPORARY_FAILURE',
    '429', // Too Many Requests
    '503', // Service Unavailable
    '504'  // Gateway Timeout
  ];
  
  return retryableErrors.some(code => 
    error.message.includes(code) || error.code === code
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### **Dead Letter Queue (DLQ) Implementation**

#### **Option 1: Notion DLQ**

**Module:** Notion → **Create a Database Item**

**Database:** `SintraPrime_Error_Log`

**Field Mappings:**

```json
{
  "Error ID": "{{uuid()}}",
  "Timestamp": "{{now}}",
  "Error Type": "{{error.type}}",
  "Error Message": "{{error.message}}",
  "Stack Trace": "{{error.stack}}",
  "Original Data": "{{toString(originalMessage)}}",
  "Retry Attempts": "{{retryCount}}",
  "Module Name": "{{moduleName}}",
  "Status": "Failed",
  "Needs Review": true
}
```

#### **Option 2: Supabase DLQ**

```typescript
// In IKE-BOT backend
interface DeadLetterEntry {
  id: string;
  timestamp: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  original_data: any;
  retry_attempts: number;
  module_name: string;
  status: 'failed' | 'pending_review' | 'resolved';
}

async function sendToDeadLetterQueue(error: Error, originalData: any, moduleName: string, retryCount: number) {
  const entry: DeadLetterEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    error_type: error.name,
    error_message: error.message,
    stack_trace: error.stack,
    original_data: originalData,
    retry_attempts: retryCount,
    module_name: moduleName,
    status: 'pending_review'
  };
  
  await supabase.from('dead_letter_queue').insert(entry);
  
  // Send alert
  await sendSlackAlert({
    channel: '#error-alerts',
    text: `⚠️ Dead Letter Queue Entry: ${error.message}`,
    details: entry
  });
}
```

### **Error Logging Implementation**

#### **Comprehensive Error Logger**

```javascript
// JavaScript module for detailed error logging
function logError(error, context) {
  const errorLog = {
    // Error details
    error_id: generateUUID(),
    timestamp: new Date().toISOString(),
    error_type: error.name || 'UnknownError',
    error_message: error.message,
    error_code: error.code,
    stack_trace: error.stack,
    
    // Context
    module_name: context.moduleName,
    scenario_name: context.scenarioName,
    execution_id: context.executionId,
    
    // Original data
    original_message: context.originalMessage,
    normalized_data: context.normalizedData,
    
    // Retry info
    retry_attempt: context.retryAttempt || 0,
    max_retries: context.maxRetries || 3,
    
    // Environment
    make_version: context.makeVersion,
    router_version: 'v1.2',
    
    // Categorization
    severity: categorizeSeverity(error),
    is_retryable: isRetryableError(error),
    requires_manual_review: requiresManualReview(error)
  };
  
  // Log to multiple destinations
  logToNotion(errorLog);
  logToSupabase(errorLog);
  sendSlackAlert(errorLog);
  
  return errorLog;
}

function categorizeSeverity(error) {
  if (error.code === '401' || error.code === '403') {
    return 'critical'; // Authentication/authorization
  }
  if (error.code === '429') {
    return 'warning'; // Rate limit
  }
  if (error.message.includes('timeout')) {
    return 'warning'; // Timeout
  }
  return 'error'; // Default
}

function requiresManualReview(error) {
  const manualReviewErrors = [
    'authentication_failed',
    'invalid_oauth_token',
    'data_validation_failed',
    'critical_system_error'
  ];
  
  return manualReviewErrors.some(type => 
    error.message.toLowerCase().includes(type)
  );
}
```

### **Error Monitoring Dashboard**

Create a Notion dashboard to monitor errors:

**Database View Filters:**

1. **Critical Errors:** `Severity = critical AND Status = pending_review`
2. **Recent Failures:** `Timestamp > now - 24h AND Status = failed`
3. **Retry Exhausted:** `Retry Attempts >= Max Retries`
4. **By Module:** Group by `Module Name`

---

## 6. Security Guard Rails

### **Purpose**
Implement token validation, input sanitization, and rate limiting to protect the system from abuse and ensure data integrity.

### **1. Token Validation**

#### **OAuth Token Checker**

```javascript
// Add at beginning of scenario
function validateOAuthToken(token) {
  const validation = {
    is_valid: false,
    expires_at: null,
    scopes: [],
    warnings: []
  };
  
  try {
    // Check token format
    if (!token || typeof token !== 'string') {
      validation.warnings.push('Invalid token format');
      return validation;
    }
    
    // Check token expiration (if available in token metadata)
    const tokenData = parseTokenMetadata(token);
    validation.expires_at = tokenData.expires_at;
    validation.scopes = tokenData.scopes;
    
    // Check if token is expiring soon (< 1 hour)
    const now = Date.now();
    const expiresIn = tokenData.expires_at - now;
    
    if (expiresIn < 3600000) { // 1 hour in ms
      validation.warnings.push('Token expires soon - consider refreshing');
    }
    
    // Validate required scopes
    const requiredScopes = ['gmail.readonly'];
    const hasRequiredScopes = requiredScopes.every(scope => 
      tokenData.scopes.includes(scope)
    );
    
    if (!hasRequiredScopes) {
      validation.warnings.push('Missing required Gmail scopes');
      return validation;
    }
    
    validation.is_valid = true;
    return validation;
    
  } catch (error) {
    validation.warnings.push(`Token validation error: ${error.message}`);
    return validation;
  }
}

// Usage in Make.com
const tokenCheck = validateOAuthToken(gmailConnection.token);
if (!tokenCheck.is_valid) {
  throw new Error(`OAuth validation failed: ${tokenCheck.warnings.join(', ')}`);
}
```

#### **Webhook Signature Validation**

```typescript
// In IKE-BOT backend
import crypto from 'crypto';

export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Usage in webhook handler
app.post('/webhooks/make', (req, res) => {
  const signature = req.headers['x-make-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.MAKE_WEBHOOK_SECRET!;
  
  if (!validateWebhookSignature(payload, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
});
```

### **2. Input Sanitization**

#### **Email Content Sanitizer**

```javascript
// Sanitize email content before processing
function sanitizeEmailContent(email) {
  return {
    from: sanitizeEmail(email.from),
    to: sanitizeEmail(email.to),
    subject: sanitizeText(email.subject),
    body: sanitizeHtml(email.body),
    attachments: sanitizeAttachments(email.attachments)
  };
}

function sanitizeEmail(email) {
  // Remove potentially malicious characters
  return email
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .toLowerCase();
}

function sanitizeText(text) {
  // Remove script tags, SQL injection attempts, XSS
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/['";]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .trim();
}

function sanitizeHtml(html) {
  // Allow only safe HTML tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a'];
  const allowedAttrs = ['href'];
  
  // Use DOMPurify-like logic (simplified)
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
  clean = clean.replace(/javascript:/gi, '');
  
  return clean;
}

function sanitizeAttachments(attachments) {
  // Validate attachment types and sizes
  const allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.png'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  return attachments.filter(attachment => {
    const ext = attachment.name.substring(attachment.name.lastIndexOf('.')).toLowerCase();
    return allowedTypes.includes(ext) && attachment.size <= maxSize;
  });
}
```

#### **JSON Payload Validator**

```typescript
// Validate incoming JSON payloads
import { z } from 'zod';

const EmailPayloadSchema = z.object({
  sender: z.string().email(),
  subject: z.string().max(500),
  body_text: z.string().max(50000),
  timestamp: z.string().datetime(),
  message_id: z.string(),
  tags: z.array(z.string()).max(20),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  metadata: z.object({
    normalized: z.boolean(),
    version: z.string()
  }).optional()
});

export function validateEmailPayload(payload: unknown) {
  try {
    return EmailPayloadSchema.parse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
```

### **3. Rate Limit Handling**

#### **Gmail API Rate Limiter**

```javascript
// Track and enforce rate limits
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  canMakeRequest() {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  getWaitTime() {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const waitTime = this.windowMs - (Date.now() - oldestRequest);
    
    return Math.max(0, waitTime);
  }
  
  reset() {
    this.requests = [];
  }
}

// Gmail rate limiter: 250 queries per user per second
const gmailLimiter = new RateLimiter(250, 1000);

// Usage before Gmail API calls
async function fetchEmailsWithRateLimit(searchQuery) {
  if (!gmailLimiter.canMakeRequest()) {
    const waitTime = gmailLimiter.getWaitTime();
    console.log(`Rate limit reached. Waiting ${waitTime}ms`);
    await sleep(waitTime);
  }
  
  return await fetchEmails(searchQuery);
}
```

#### **Make.com Execution Rate Limiter**

```javascript
// In Make.com scenario settings
{
  "scheduling": {
    "type": "interval",
    "interval": 15, // minutes
    "max_executions_per_day": 96, // 15-min intervals = 96/day
    "rate_limit": {
      "enabled": true,
      "max_operations_per_minute": 60,
      "backoff_strategy": "exponential"
    }
  }
}
```

#### **Supabase Rate Limiter (IKE-BOT)**

```typescript
// Rate limiting middleware for IKE-BOT API
import rateLimit from 'express-rate-limit';

export const webhookRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window per IP
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Apply to webhook routes
app.use('/webhooks/make', webhookRateLimiter);
```

### **4. API Key Rotation**

```typescript
// API key management
interface APIKey {
  id: string;
  key: string;
  created_at: Date;
  expires_at: Date;
  last_used: Date;
  is_active: boolean;
}

class APIKeyManager {
  async rotateKey(oldKeyId: string): Promise<APIKey> {
    // Generate new key
    const newKey = {
      id: crypto.randomUUID(),
      key: this.generateSecureKey(),
      created_at: new Date(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      last_used: new Date(),
      is_active: true
    };
    
    // Save new key
    await supabase.from('api_keys').insert(newKey);
    
    // Deactivate old key (with grace period)
    await supabase
      .from('api_keys')
      .update({ is_active: false, deactivated_at: new Date() })
      .eq('id', oldKeyId);
    
    return newKey;
  }
  
  private generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
```

---

## 7. SintraPrime Intelligence Hooks

### **Purpose**
Add advanced intelligence capabilities for predictive analysis, beneficiary protection, and case linking.

### **1. Dishonor Prediction**

```javascript
// Predictive model for potential dishonor scenarios
function predictDishonorRisk(emailData, historicalData) {
  const prediction = {
    risk_score: 0.0,
    confidence: 0.0,
    factors: [],
    recommendation: '',
    predicted_dishonor_date: null
  };
  
  // Factor 1: Payment history
  if (historicalData.missed_payments > 2) {
    prediction.risk_score += 0.3;
    prediction.factors.push('Multiple missed payments');
  }
  
  // Factor 2: Disconnection threats
  if (emailData.body_text.includes('disconnect') || emailData.body_text.includes('suspend')) {
    prediction.risk_score += 0.25;
    prediction.factors.push('Disconnection threat detected');
  }
  
  // Factor 3: Final notice language
  if (emailData.body_text.includes('final notice') || emailData.body_text.includes('last chance')) {
    prediction.risk_score += 0.2;
    prediction.factors.push('Final notice language');
  }
  
  // Factor 4: Legal action mentions
  if (emailData.body_text.includes('legal action') || emailData.body_text.includes('attorney')) {
    prediction.risk_score += 0.25;
    prediction.factors.push('Legal action threatened');
  }
  
  // Calculate confidence based on data completeness
  prediction.confidence = calculateConfidence(historicalData);
  
  // Generate recommendation
  if (prediction.risk_score > 0.7) {
    prediction.recommendation = 'HIGH RISK: Immediate intervention required. File dispute and escalate to CFPB.';
    prediction.predicted_dishonor_date = addDays(new Date(), 7);
  } else if (prediction.risk_score > 0.4) {
    prediction.recommendation = 'MEDIUM RISK: Monitor closely. Prepare dispute documentation.';
    prediction.predicted_dishonor_date = addDays(new Date(), 14);
  } else {
    prediction.recommendation = 'LOW RISK: Standard monitoring. No immediate action needed.';
    prediction.predicted_dishonor_date = null;
  }
  
  return prediction;
}

function calculateConfidence(historicalData) {
  let confidence = 0.5; // Base confidence
  
  if (historicalData.total_emails > 10) confidence += 0.2;
  if (historicalData.has_payment_history) confidence += 0.15;
  if (historicalData.has_communication_log) confidence += 0.15;
  
  return Math.min(confidence, 1.0);
}
```

#### **Dishonor Prediction Output Schema**

```json
{
  "dishonor_prediction": {
    "risk_score": 0.75,
    "confidence": 0.85,
    "factors": [
      "Multiple missed payments",
      "Disconnection threat detected",
      "Final notice language"
    ],
    "recommendation": "HIGH RISK: Immediate intervention required. File dispute and escalate to CFPB.",
    "predicted_dishonor_date": "2025-12-15T00:00:00Z",
    "historical_context": {
      "previous_disputes": 2,
      "successful_resolutions": 1,
      "average_resolution_time_days": 45
    }
  }
}
```

### **2. Beneficiary Protection Flag**

```javascript
// Determine if beneficiary protection is needed
function assessBeneficiaryProtection(emailData, beneficiaryData) {
  const protection = {
    requires_protection: false,
    protection_level: 'none',
    reasons: [],
    recommended_actions: [],
    statute_refs: []
  };
  
  // Check for vulnerable beneficiary indicators
  const vulnerabilityFactors = [
    {
      condition: beneficiaryData.age > 65,
      reason: 'Senior citizen (UDAAP protections apply)',
      action: 'File complaint with CFPB citing UDAAP',
      statute: '12 U.S.C. § 5531'
    },
    {
      condition: beneficiaryData.is_disabled,
      reason: 'Disability status (ADA protections apply)',
      action: 'Invoke ADA reasonable accommodation',
      statute: '42 U.S.C. § 12101'
    },
    {
      condition: beneficiaryData.limited_english,
      reason: 'Limited English proficiency',
      action: 'Request interpreter services and translated documents',
      statute: 'Title VI Civil Rights Act'
    },
    {
      condition: emailData.tags.includes('harassment'),
      reason: 'Harassment detected (FDCPA violation)',
      action: 'Cease and desist letter, file CFPB complaint',
      statute: '15 U.S.C. § 1692d'
    }
  ];
  
  // Evaluate each factor
  vulnerabilityFactors.forEach(factor => {
    if (factor.condition) {
      protection.requires_protection = true;
      protection.reasons.push(factor.reason);
      protection.recommended_actions.push(factor.action);
      protection.statute_refs.push(factor.statute);
    }
  });
  
  // Determine protection level
  if (protection.reasons.length >= 3) {
    protection.protection_level = 'critical';
  } else if (protection.reasons.length >= 2) {
    protection.protection_level = 'high';
  } else if (protection.reasons.length >= 1) {
    protection.protection_level = 'medium';
  }
  
  return protection;
}
```

#### **Beneficiary Protection Output Schema**

```json
{
  "beneficiary_protection": {
    "requires_protection": true,
    "protection_level": "high",
    "beneficiary_id": "ben_12345",
    "reasons": [
      "Senior citizen (UDAAP protections apply)",
      "Harassment detected (FDCPA violation)"
    ],
    "recommended_actions": [
      "File complaint with CFPB citing UDAAP",
      "Cease and desist letter, file CFPB complaint"
    ],
    "statute_refs": [
      "12 U.S.C. § 5531",
      "15 U.S.C. § 1692d"
    ],
    "priority": "urgent",
    "auto_escalate": true
  }
}
```

### **3. Case Linking ID**

```javascript
// Generate and manage case linking IDs for related enforcement actions
function generateCaseLinkingId(emailData, existingCases) {
  // Check if this email relates to existing cases
  const relatedCase = findRelatedCase(emailData, existingCases);
  
  if (relatedCase) {
    return {
      case_linking_id: relatedCase.id,
      is_new_case: false,
      linked_to: relatedCase.id,
      relationship_type: relatedCase.relationship,
      case_history: relatedCase.history
    };
  }
  
  // Generate new case linking ID
  const newCaseId = generateUniqueId(emailData);
  
  return {
    case_linking_id: newCaseId,
    is_new_case: true,
    linked_to: null,
    relationship_type: 'primary',
    case_history: []
  };
}

function findRelatedCase(emailData, existingCases) {
  // Match by sender
  const bySender = existingCases.find(c => 
    c.sender === emailData.normalized_sender
  );
  if (bySender) {
    return { ...bySender, relationship: 'same_sender' };
  }
  
  // Match by subject/thread
  const byThread = existingCases.find(c => 
    c.thread_id === emailData.thread_id
  );
  if (byThread) {
    return { ...byThread, relationship: 'same_thread' };
  }
  
  // Match by account number
  const accountNumber = extractAccountNumber(emailData.body_text);
  if (accountNumber) {
    const byAccount = existingCases.find(c => 
      c.account_number === accountNumber
    );
    if (byAccount) {
      return { ...byAccount, relationship: 'same_account' };
    }
  }
  
  // Match by creditor + beneficiary
  const byCreditorBeneficiary = existingCases.find(c => 
    c.creditor === emailData.routing.creditor &&
    c.beneficiary_id === emailData.beneficiary_id
  );
  if (byCreditorBeneficiary) {
    return { ...byCreditorBeneficiary, relationship: 'same_creditor_beneficiary' };
  }
  
  return null;
}

function generateUniqueId(emailData) {
  const components = [
    emailData.routing.creditor.replace(/\s+/g, '_').toUpperCase(),
    new Date().getFullYear(),
    ('0' + (new Date().getMonth() + 1)).slice(-2),
    generateRandomString(6)
  ];
  
  return components.join('-');
  // Example: VERIZON_WIRELESS-2025-12-A7B3C9
}

function extractAccountNumber(text) {
  const patterns = [
    /account\s*#?\s*:?\s*(\d{4,16})/i,
    /acct\s*#?\s*:?\s*(\d{4,16})/i,
    /account\s*number\s*:?\s*(\d{4,16})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}
```

#### **Case Linking Output Schema**

```json
{
  "case_linking": {
    "case_linking_id": "VERIZON_WIRELESS-2025-12-A7B3C9",
    "is_new_case": false,
    "linked_to": "VERIZON_WIRELESS-2025-11-X2Y4Z8",
    "relationship_type": "same_account",
    "case_history": [
      {
        "event_date": "2025-11-15T10:00:00Z",
        "event_type": "disconnection_threat",
        "status": "disputed"
      },
      {
        "event_date": "2025-11-20T14:30:00Z",
        "event_type": "cfpb_complaint_filed",
        "complaint_id": "CFPB-2025-112345"
      }
    ],
    "related_cases": ["VERIZON_WIRELESS-2024-08-B9C1D3"],
    "total_events": 12,
    "case_status": "active",
    "next_action_due": "2025-12-10T00:00:00Z"
  }
}
```

### **Combined Intelligence Output**

```json
{
  "intelligence": {
    "dishonor_prediction": {
      "risk_score": 0.75,
      "confidence": 0.85,
      "recommendation": "HIGH RISK: Immediate intervention required",
      "predicted_dishonor_date": "2025-12-15T00:00:00Z"
    },
    "beneficiary_protection": {
      "requires_protection": true,
      "protection_level": "high",
      "reasons": ["Senior citizen", "Harassment detected"],
      "auto_escalate": true
    },
    "case_linking": {
      "case_linking_id": "VERIZON_WIRELESS-2025-12-A7B3C9",
      "is_new_case": false,
      "linked_to": "VERIZON_WIRELESS-2025-11-X2Y4Z8",
      "total_events": 12
    },
    "processing_metadata": {
      "analyzed_at": "2025-12-08T05:10:00Z",
      "intelligence_version": "v1.0",
      "confidence_score": 0.88
    }
  }
}
```

---

## 🔧 Implementation Checklist

### **Phase 1: OAuth & Normalization**
- [ ] Set up Gmail OAuth connection in Make.com
- [ ] Test OAuth connection with simple search
- [ ] Implement Message Normalizer module
- [ ] Validate normalized output format
- [ ] Document OAuth troubleshooting steps

### **Phase 2: Trigger Mapping**
- [ ] Configure Verizon trigger conditions (Wireless & Fios)
- [ ] Configure IRS trigger conditions
- [ ] Configure Wells Fargo trigger conditions
- [ ] Configure Chase/EWS trigger conditions
- [ ] Configure Dakota Financial trigger conditions
- [ ] Configure TikTok trigger conditions
- [ ] Test each trigger with sample emails

### **Phase 3: Structured Routing**
- [ ] Implement JSON output for each Router path
- [ ] Validate JSON schema consistency
- [ ] Add creditor-specific fields
- [ ] Test JSON parsing in downstream modules

### **Phase 4: Error Handling**
- [ ] Add Error Handler module after Gmail
- [ ] Implement retry logic with exponential backoff
- [ ] Set up Dead Letter Queue (Notion or Supabase)
- [ ] Configure error logging
- [ ] Create error monitoring dashboard

### **Phase 5: Security**
- [ ] Implement OAuth token validation
- [ ] Add webhook signature validation (IKE-BOT)
- [ ] Implement input sanitization
- [ ] Configure rate limiters (Gmail API, Make.com, IKE-BOT)
- [ ] Set up API key rotation schedule

### **Phase 6: Intelligence Hooks**
- [ ] Implement dishonor prediction algorithm
- [ ] Add beneficiary protection assessment
- [ ] Create case linking ID generator
- [ ] Test intelligence outputs with historical data
- [ ] Integrate intelligence with Notion logging

### **Phase 7: Testing & Validation**
- [ ] End-to-end test with sample emails for each creditor
- [ ] Verify error handling with intentional failures
- [ ] Test rate limiting under load
- [ ] Validate security measures
- [ ] Review intelligence predictions against actual outcomes

---

## 📊 Monitoring & Maintenance

### **Key Metrics to Track**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **OAuth Token Validity** | >99% | <95% |
| **Message Processing Success Rate** | >95% | <90% |
| **Normalization Errors** | <5% | >10% |
| **Router Accuracy** | >90% | <85% |
| **Error Handler Trigger Rate** | <10% | >15% |
| **DLQ Entry Count** | <50/day | >100/day |
| **Rate Limit Hits** | <10/day | >50/day |
| **Intelligence Prediction Accuracy** | >80% | <70% |

### **Weekly Maintenance Tasks**

1. Review error logs in Notion
2. Check OAuth token expiration dates
3. Validate rate limiter thresholds
4. Review DLQ entries and resolve
5. Update trigger conditions based on new email patterns
6. Verify intelligence prediction accuracy

### **Monthly Maintenance Tasks**

1. Rotate API keys
2. Review and update creditor trigger mappings
3. Analyze Router path distribution
4. Update security policies
5. Train intelligence models with new data
6. Review beneficiary protection cases

---

## 🚀 Next Steps

1. **Review this upgrade document** with stakeholders
2. **Prioritize implementation phases** based on business needs
3. **Set up development environment** for testing
4. **Implement Phase 1** (OAuth & Normalization) first
5. **Iterate through phases** with validation at each step
6. **Deploy to production** with monitoring enabled
7. **Collect feedback** and refine based on real-world usage

---

## 📞 Support

For questions or issues implementing these upgrades:
- Review the main documentation: `SINTRAPRIME_ROUTER_SETUP.md`
- Check the Gmail Scanner guide: `GMAIL_ENFORCEMENT_SCANNER.md`
- Review activation status: `SINTRAPRIME_STATUS.md`
- Contact: HowardIsiah@gmail.com

---

**Version:** v1.2  
**Last Updated:** 2025-12-08  
**Status:** ✅ Ready for Implementation
