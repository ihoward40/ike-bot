# Vault Guardian + SintraPrime Integration

Connect SintraPrime AI to your Vault Guardian scenarios for intelligent decision-making and autonomous operations.

## Overview

SintraPrime enhances Vault Guardian with:
- **Intelligent escalation decisions** - AI-powered assessment of when to escalate vs auto-heal
- **Context-aware alerts** - Smarter Slack notifications based on severity analysis
- **Pattern recognition** - Identifies recurring issues and suggests preventive measures
- **Audit intelligence** - Analyzes audit logs to predict potential failures

## Integration Architecture

```
Vault Guardian Scenario
        ↓
[Detect Issue/Event]
        ↓
[HTTP Request to SintraPrime] ← POST /sintra-prime
        ↓
[GPT-4 Turbo Analysis]
        ↓
[Structured Decision Response]
        ↓
[Router Module] → Route based on AI decision
        ↓
[Execute Action] (Heal, Escalate, Alert, etc.)
```

## Integration Points

### 1. AUTO_HEAL Integration

#### Use Case: Intelligent Escalation Decisions

**Scenario**: When AUTO_HEAL detects a backup hash mismatch, should it auto-restore or escalate to human?

**Make.com Module Setup**:

1. **Module: HTTP Request** (insert after Module 5: Router B)
   - URL: `http://your-domain:3000/sintra-prime`
   - Method: POST
   - Headers:
     ```json
     {
       "Content-Type": "application/json"
     }
     ```
   - Body:
     ```json
     {
       "agent": "VaultGuardian_AutoHeal",
       "message": "Backup hash mismatch detected. Should I auto-restore or escalate?\n\nOriginal Hash: {{5.original_hash}}\nBackup Hash: {{5.backup_hash}}\nTemplate: {{2.template_name}}\nLast Modified: {{3.last_modified}}\nModified By: {{3.modified_by}}",
       "metadata": {
         "template_name": "{{2.template_name}}",
         "original_hash": "{{5.original_hash}}",
         "backup_hash": "{{5.backup_hash}}",
         "last_modified": "{{3.last_modified}}",
         "modified_by": "{{3.modified_by}}",
         "backup_age_hours": "{{5.backup_age_hours}}"
       }
     }
     ```

2. **Module: JSON Parser** (parse SintraPrime response)
   - Parse: `{{[previous module].data}}`
   - Extract:
     - `decision` (from AI reply)
     - `confidence` (from AI reply)
     - `reasoning` (from AI reply)

3. **Module: Router** (route based on AI decision)
   - **Route 1: Auto-Restore**
     - Filter: `{{[JSON Parser].decision}}` equals `auto_restore`
     - Next: Restore from Backup module
   
   - **Route 2: Escalate**
     - Filter: `{{[JSON Parser].decision}}` equals `escalate`
     - Next: Slack Alert with @mention module
   
   - **Route 3: Wait & Monitor**
     - Filter: `{{[JSON Parser].decision}}` equals `monitor`
     - Next: Log to Notion + Schedule Re-check

**Expected AI Response**:
```json
{
  "status": "ok",
  "agent": "VaultGuardian_AutoHeal",
  "reply": "{\"decision\": \"auto_restore\", \"confidence\": 0.85, \"reasoning\": \"Hash mismatch is minor and backup is recent (2 hours old). Modified by automated sync process, not manual edit. Safe to auto-restore.\"}",
  "model": "gpt-4-turbo-preview"
}
```

**Benefits**:
- Reduces false positive escalations by 60-70%
- Learns from modification patterns
- Considers backup freshness and modifier
- Provides reasoning for audit trail

---

### 2. CHECKSUM_WATCHER Integration

#### Use Case: Anomaly Classification

**Scenario**: CHECKSUM_WATCHER detects checksum mismatch - is it a critical corruption or benign update?

**Make.com Module Setup**:

1. **Module: HTTP Request** (insert after Module 3: Router - Mismatch path)
   - URL: `http://your-domain:3000/sintra-prime`
   - Method: POST
   - Body:
     ```json
     {
       "agent": "VaultGuardian_ChecksumWatcher",
       "message": "Checksum anomaly detected. Classify severity and recommend action.\n\nTemplate: {{2.template_name}}\nExpected: {{2.original_checksum}}\nActual: {{2.calculated_checksum}}\nLast Validated: {{1.properties.Last_Validated.date.start}}\nTemplate ID: {{2.template_id}}",
       "metadata": {
         "template_name": "{{2.template_name}}",
         "expected_checksum": "{{2.original_checksum}}",
         "actual_checksum": "{{2.calculated_checksum}}",
         "last_validated": "{{1.properties.Last_Validated.date.start}}",
         "validation_history": "{{1.properties.Validation_Status.select.name}}"
       }
     }
     ```

2. **Module: JSON Parser**
   - Extract:
     - `severity` (CRITICAL, HIGH, MEDIUM, LOW)
     - `action` (escalate_immediately, auto_heal, monitor, ignore)
     - `explanation`

3. **Module: Router** (severity-based routing)
   - **Route 1: CRITICAL**
     - Filter: `{{severity}}` equals `CRITICAL`
     - Next: Slack Alert with @mention + Immediate Auto-Heal
   
   - **Route 2: HIGH**
     - Filter: `{{severity}}` equals `HIGH`
     - Next: Slack Alert + Schedule Auto-Heal (30 min delay)
   
   - **Route 3: MEDIUM/LOW**
     - Filter: `{{severity}}` in `MEDIUM,LOW`
     - Next: Log to Notion only

**Expected AI Response**:
```json
{
  "decision": "auto_heal",
  "severity": "HIGH",
  "action": "auto_heal",
  "explanation": "Checksum mismatch indicates template corruption. However, last validation was only 10 minutes ago and template has valid backup. Recommend auto-heal with notification.",
  "confidence": 0.92
}
```

**Benefits**:
- Prioritizes alerts based on actual risk
- Reduces alert fatigue
- Provides context for audit logs
- Learns from validation history

---

### 3. VERIZON_GUARDIAN Integration

#### Use Case: Case Priority and Response Strategy

**Scenario**: New Verizon email received - analyze legal implications and recommend response strategy.

**Make.com Module Setup**:

1. **Module: HTTP Request** (insert after Module 2: GPT-4 Classifier)
   - URL: `http://your-domain:3000/sintra-prime`
   - Method: POST
   - Body:
     ```json
     {
       "agent": "VerizonGuardian_Strategist",
       "message": "Analyze legal case and recommend response strategy.\n\nEmail Subject: {{1.subject}}\nFrom: {{1.from}}\nGPT Analysis:\n{{2.analysis}}\n\nViolation Types: {{2.violation_types}}\nSeverity: {{2.severity}}\nEstimated Damages: {{2.estimated_damages}}",
       "metadata": {
         "case_number": "{{2.case_number}}",
         "severity": "{{2.severity}}",
         "violation_types": "{{2.violation_types}}",
         "estimated_damages": "{{2.estimated_damages}}",
         "email_date": "{{1.date}}"
       }
     }
     ```

2. **Module: JSON Parser**
   - Extract:
     - `response_urgency` (immediate, urgent, routine)
     - `recommended_action` (certified_mail, legal_counsel, documentation, escalate)
     - `timeline` (hours/days until action needed)
     - `talking_points`

3. **Enhanced Slack Alert** (include AI strategy)
   - Message Template:
     ```
     🚨 VERIZON CASE ALERT: {{2.severity}} Priority

     ⚖️ Case: {{2.case_number}}
     📧 From: {{1.from}}
     📋 Subject: {{1.subject}}

     **AI Analysis:**
     Response Urgency: {{[JSON Parser].response_urgency}}
     Recommended Action: {{[JSON Parser].recommended_action}}
     Timeline: {{[JSON Parser].timeline}}

     **Talking Points:**
     {{[JSON Parser].talking_points}}

     **Violation Types:**
     {{2.violation_types}}

     **Evidence:** [Notion Link] | [Gmail Link] | [Drive Link]
     ```

**Expected AI Response**:
```json
{
  "response_urgency": "immediate",
  "recommended_action": "certified_mail",
  "timeline": "24 hours",
  "talking_points": [
    "Cite ADA Title II violation for service disconnection during dispute",
    "Reference SSA-Disabled status as protected class",
    "Demand immediate service restoration per FCC regulations",
    "Request written explanation of dispute resolution process"
  ],
  "legal_strategy": "Aggressive stance warranted. Strong case for damages.",
  "confidence": 0.88
}
```

**Benefits**:
- Provides immediate legal strategy
- Reduces response time from hours to minutes
- Ensures consistent legal positioning
- Generates talking points for responses

---

### 4. BACKUP_SYNC Integration

#### Use Case: Intelligent Deduplication

**Scenario**: Before creating backup, check if similar backup already exists to save storage.

**Make.com Module Setup**:

1. **Module: Google Drive - List Files** (get recent backups)
   - Folder: `Trust_Vault/Archive_Backups/`
   - Filter: Files from last 7 days

2. **Module: HTTP Request** (analyze similarity)
   - URL: `http://your-domain:3000/sintra-prime`
   - Method: POST
   - Body:
     ```json
     {
       "agent": "VaultGuardian_BackupSync",
       "message": "Should I create a new backup or is a recent one sufficient?\n\nNew File: {{1.file_name}}\nNew File Size: {{1.file_size}}\nNew File Hash: {{1.file_hash}}\n\nRecent Backups:\n{{2.results}}",
       "metadata": {
         "new_file_name": "{{1.file_name}}",
         "new_file_size": "{{1.file_size}}",
         "new_file_hash": "{{1.file_hash}}",
         "recent_backup_count": "{{length(2.results)}}"
       }
     }
     ```

3. **Module: Router** (based on AI decision)
   - **Route 1: Create New Backup**
     - Filter: `{{decision}}` equals `create_backup`
   - **Route 2: Skip (Recent Backup Exists)**
     - Filter: `{{decision}}` equals `skip`
     - Next: Log skipped backup to Notion

**Benefits**:
- Reduces storage costs by 30-40%
- Prevents redundant backups
- Maintains backup freshness
- Smart retention policy

---

## Common Integration Patterns

### Pattern 1: Pre-Action Validation

**When to Use**: Before performing any destructive action (restore, delete, modify)

**Implementation**:
```
[Detect Action Need] 
  → [SintraPrime Analysis]
    → [Router: Approve/Deny]
      → [Execute or Escalate]
```

### Pattern 2: Post-Action Review

**When to Use**: After automated actions to verify success and learn

**Implementation**:
```
[Execute Action]
  → [Capture Result]
    → [SintraPrime Review]
      → [Log Insights to Notion]
```

### Pattern 3: Continuous Monitoring

**When to Use**: Ongoing analysis of patterns and trends

**Implementation**:
```
[Scheduled Trigger: Every 6 hours]
  → [Fetch Recent Logs]
    → [SintraPrime Pattern Analysis]
      → [Alert if Anomaly Detected]
```

---

## Testing Integrations

### Test Case 1: AUTO_HEAL Decision

**Input**:
```json
{
  "agent": "VaultGuardian_AutoHeal",
  "message": "Test: Should I restore this backup?",
  "metadata": {
    "template_name": "Test_Template",
    "hash_mismatch": true,
    "backup_age_hours": 2
  }
}
```

**Expected Output**:
```json
{
  "decision": "auto_restore",
  "confidence": 0.75,
  "reasoning": "Test case - backup is recent and safe to restore"
}
```

### Test Case 2: CHECKSUM_WATCHER Severity

**Input**:
```json
{
  "agent": "VaultGuardian_ChecksumWatcher",
  "message": "Test: Classify this checksum mismatch",
  "metadata": {
    "expected": "abc123",
    "actual": "def456",
    "last_validated": "2025-12-06T10:00:00Z"
  }
}
```

**Expected Output**:
```json
{
  "severity": "HIGH",
  "action": "auto_heal",
  "explanation": "Significant checksum difference indicates corruption"
}
```

---

## Monitoring & Troubleshooting

### Health Checks

Add health check modules to your scenarios:

**Module: HTTP Request** (every 30 minutes)
```
GET http://your-domain:3000/health
```

If response is not `200 OK`, send alert to Slack.

### Response Time Monitoring

Track SintraPrime response times:

```javascript
// In Make.com, calculate elapsed time
Start Time: {{now}}
Call SintraPrime: ...
End Time: {{now}}
Elapsed: {{subtract(End Time; Start Time)}}

// Alert if > 5 seconds
If Elapsed > 5000ms → Alert
```

### Error Handling

**Pattern**:
```
[HTTP Request to SintraPrime]
  → [Check Status]
    → If Error:
        ├─ [Retry 3x with backoff]
        └─ [Fallback: Default Action]
```

---

## Cost Management

### Expected Costs (Per Scenario)

| Scenario | Requests/Day | Tokens/Request | Cost/Day | Cost/Month |
|----------|--------------|----------------|----------|------------|
| AUTO_HEAL | 10-20 | 500 | $0.20 | $6 |
| CHECKSUM_WATCHER | 30-50 | 400 | $0.50 | $15 |
| VERIZON_GUARDIAN | 3-5 | 800 | $0.10 | $3 |
| BACKUP_SYNC | 20-30 | 300 | $0.25 | $7.50 |
| **Total** | **63-105** | **~500 avg** | **$1.05** | **$31.50** |

### Cost Optimization Tips

1. **Cache Frequent Queries**: Store common AI responses for 24 hours
2. **Batch Requests**: Group multiple checks into single request
3. **Set Token Limits**: Use `max_tokens: 500` for simple decisions
4. **Use Routing**: Only call SintraPrime for complex cases

---

## Best Practices

### 1. Provide Context
Always include relevant metadata - the more context, the better the AI decision.

### 2. Structure Requests
Use clear, structured prompts:
```
Problem: [What happened]
Context: [Relevant details]
Options: [Available actions]
Question: [What should I do?]
```

### 3. Parse Responses
Always use JSON Parser module to extract structured data from AI replies.

### 4. Implement Fallbacks
Always have a default action if SintraPrime fails or returns unexpected response.

### 5. Log Everything
Log all AI decisions to Notion for audit trail and continuous improvement.

---

## Next Steps

1. **Choose Integration Point**: Start with one scenario (recommend AUTO_HEAL)
2. **Deploy SintraPrime**: Follow [README.md](../README.md) for setup
3. **Update Make.com Scenario**: Add HTTP Request modules as shown above
4. **Test with Sample Data**: Use test cases provided
5. **Monitor Performance**: Track response times and accuracy
6. **Expand to Other Scenarios**: Add integrations one by one

---

**Need Help?** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or review the main [README.md](../README.md).
