# VAULT_GUARDIAN_AUTO_HEAL_v1.0 Configuration Guide

## Overview
This guide provides detailed, module-by-module configuration for building the VAULT_GUARDIAN_AUTO_HEAL_v1.0 scenario in Make.com. This scenario automatically monitors the Trust Vault, detects corruption or missing files, and restores from backups.

## Architecture Overview

**Total Modules**: 8 modules with decision routers  
**Purpose**: Automated detection and healing of vault corruption  
**Trigger**: Notion database watch (continuous monitoring)  
**Actions**: Backup retrieval, hash verification, restoration, notifications

## Module Flow Diagram

```
[1] Notion Ledger Watch
         ↓
[2] Backup Retrieval Check
         ↓
    [Router A] - Backup Found?
         ↓                    ↓
       YES                  NO
         ↓                    ↓
[3] Hash Verification   [6] Escalation Path
         ↓
    [Router B] - Hash Match?
         ↓                    ↓
       YES                  NO
         ↓                    ↓
[4] False Alarm        [7] Restore/Copy
         ↓                    ↓
[5] Log & Close       [8] Success Notification
                            ↓
                      Update Notion + Slack
```

## Prerequisites

Before starting:
- [ ] Make.com Pro or higher subscription
- [ ] Notion integration connected to Make.com
- [ ] Google Drive integration connected to Make.com
- [ ] Slack integration connected to Make.com
- [ ] Notion Vault Ledger database created
- [ ] Google Drive Archive_Backups folder configured (see [01-GOOGLE-DRIVE-SETUP.md](./01-GOOGLE-DRIVE-SETUP.md))

## Module-by-Module Configuration

---

### Module 1: Notion Ledger Watch

**Module Type**: `Notion` → `Watch Database Items`

**Purpose**: Monitors the Vault Ledger for files marked as corrupted or missing

**Configuration**:
```yaml
Connection: [Your Notion Connection]
Database ID: [Your Vault Ledger Database ID]

Filters:
  - Status = "corrupted" OR Status = "missing"
  - Auto-heal = TRUE
  - Last Check < 5 minutes ago

Watch Mode: New and Updated Items
Limit: 10
Sort By: last_modified (descending)
```

**Output Fields to Map**:
- `file_id` (Notion page ID)
- `file_name` (Title property)
- `file_hash` (Text property)
- `file_path` (Text property)  
- `backup_location` (URL property)
- `status` (Status property)

**Error Handling**:
- On connection error → Retry 3 times with 1 min interval
- On no results → Continue (expected behavior)

---

### Module 2: Backup Retrieval Check

**Module Type**: `Google Drive` → `Search Files`

**Purpose**: Searches Archive_Backups for the backup file

**Configuration**:
```yaml
Connection: [Your Google Drive Connection]
Search Query: "name='{{1.file_name}}' and '{{ARCHIVE_BACKUPS_FOLDER_ID}}' in parents"
Fields: id, name, md5Checksum, size, createdTime, webContentLink

Drive: My Drive
Folder: [Archive_Backups Folder ID]
Search in subfolders: Yes
Limit: 1
```

**Variables Needed**:
- `ARCHIVE_BACKUPS_FOLDER_ID`: From Google Drive setup

**Output to Store**:
- `backup_file_id`
- `backup_file_hash` (md5Checksum)
- `backup_download_link` (webContentLink)

**Error Handling**:
- On not found → Continue to Router A (NO path)
- On connection error → Retry 2 times, then escalate

---

### Router A: Backup Found?

**Module Type**: `Flow Control` → `Router`

**Purpose**: Decides whether backup exists

**Routes**:

**Route 1 (YES - Backup Found)**:
```yaml
Condition: {{2.backup_file_id}} is not empty
Label: "Backup Found"
Next Module: 3 (Hash Verification)
```

**Route 2 (NO - No Backup)**:
```yaml
Condition: {{2.backup_file_id}} is empty
Label: "No Backup Available"
Next Module: 6 (Escalation Path)
```

**Fallback**:
- Default Route: Route 2 (Escalation)

---

### Module 3: Hash Verification

**Module Type**: `Tools` → `Set Variable` + `Text Parser`

**Purpose**: Compares original file hash with backup hash

**Configuration**:
```yaml
Action: Compare MD5 Hashes

Variables to Set:
  - original_hash: {{1.file_hash}}
  - backup_hash: {{2.backup_file_hash}}
  - hash_match: {{if(1.file_hash = 2.backup_file_hash, "true", "false")}}

Comparison Logic:
  - Strip whitespace from both hashes
  - Convert to lowercase
  - Direct string comparison
```

**Output**:
- `hash_match` (boolean string: "true" or "false")

---

### Router B: Hash Match?

**Module Type**: `Flow Control` → `Router`

**Purpose**: Decides if hash mismatch is real or false alarm

**Routes**:

**Route 1 (Mismatch - Real Issue)**:
```yaml
Condition: {{3.hash_match}} = "false"
Label: "Hash Mismatch - Restore Needed"
Next Module: 7 (Restore/Copy)
```

**Route 2 (Match - False Alarm)**:
```yaml
Condition: {{3.hash_match}} = "true"  
Label: "False Alarm - Hash Matches"
Next Module: 4 (False Alarm Handler)
```

**Fallback**:
- Default Route: Route 1 (Restore - safer default)

---

### Module 4: False Alarm Handler

**Module Type**: `Notion` → `Update Database Item`

**Purpose**: Updates Notion when hash mismatch resolved on re-check

**Configuration**:
```yaml
Connection: [Your Notion Connection]
Page ID: {{1.file_id}}

Properties to Update:
  - Status: "verified" (Select property)
  - Last Verified: {{now}} (Date property)
  - Notes: "False alarm - hash verified on re-check" (Text property)
  - Auto-heal: FALSE (Checkbox property)
```

**Continue to**: Module 5 (Log & Close)

---

### Module 5: Log & Close

**Module Type**: `HTTP` → `Make a Request` (to IKE-BOT)

**Purpose**: Logs false alarm event to agent_logs

**Configuration**:
```yaml
URL: https://your-ike-bot.com/api/agent-logs
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "level": "info",
  "action": "vault_auto_heal_false_alarm",
  "message": "File {{1.file_name}} verified - false alarm",
  "metadata": {
    "file_id": "{{1.file_id}}",
    "file_name": "{{1.file_name}}",
    "original_hash": "{{3.original_hash}}",
    "backup_hash": "{{3.backup_hash}}"
  }
}
```

**Optional**: Add Slack notification for false alarms (low priority)

---

### Module 6: Escalation Path (No Backup Found)

**Module Type**: `Slack` → `Create a Message`

**Purpose**: Alerts team when no backup exists - requires manual intervention

**Configuration**:
```yaml
Connection: [Your Slack Connection]
Channel: #vault-guardian-alerts
Message Type: Block Kit

Message Blocks:
---
🚨 **VAULT GUARDIAN: MANUAL INTERVENTION REQUIRED**

**File**: {{1.file_name}}
**Status**: {{1.status}}
**Issue**: No backup found in Archive_Backups

**File Details**:
- File ID: `{{1.file_id}}`
- Expected Path: `{{1.file_path}}`
- Expected Backup: `{{1.backup_location}}`
- Last Known Hash: `{{1.file_hash}}`

**Action Required**:
1. Locate backup manually
2. Upload to Archive_Backups folder
3. Trigger manual heal via Slack (optional)
4. Or mark as permanent loss in Notion

**Priority**: HIGH
**Timestamp**: {{formatDate(now, "YYYY-MM-DD HH:mm:ss")}}
---

Thread Replies: Yes (creates discussion thread)
```

**Error Handling**:
- On Slack failure → Log to IKE-BOT error endpoint
- Continue to Notion update

**Follow-up Action**: Update Notion
```yaml
Module: Notion → Update Database Item
Page ID: {{1.file_id}}
Properties:
  - Status: "escalated" (Select)
  - Escalated At: {{now}} (Date)
  - Notes: "No backup found - manual intervention required"
```

---

### Module 7: Restore/Copy Operation

**Module Type**: `Google Drive` → `Copy a File`

**Purpose**: Restores file from backup to Trust Vault

**Configuration**:
```yaml
Connection: [Your Google Drive Connection]

Source File:
  File ID: {{2.backup_file_id}}

Destination:
  Folder ID: [Trust Vault Main Folder ID]
  New File Name: {{1.file_name}}
  
Options:
  - Overwrite if exists: YES
  - Preserve original created date: NO
  - Create new version: YES

Output:
  - Store new file ID
  - Store new file link
```

**Error Handling**:
- On permission denied → Escalate to Module 6
- On insufficient storage → Escalate with specific error
- On success → Continue to Module 8

---

### Module 8: Success Notification & Update

**Module Type**: Multiple (Aggregator)

**Sub-Module 8A: Update Notion**
```yaml
Module: Notion → Update Database Item
Connection: [Your Notion Connection]
Page ID: {{1.file_id}}

Properties to Update:
  - Status: "restored" (Select)
  - Restored At: {{now}} (Date)
  - Restored From: "Archive_Backups" (Text)
  - File Hash: {{2.backup_file_hash}} (Text - updated hash)
  - Auto-heal: FALSE (Checkbox - disable further auto-heal)
  - Notes: "Auto-restored from backup on {{formatDate(now, 'YYYY-MM-DD HH:mm')}}"
```

**Sub-Module 8B: Slack Success Notification**
```yaml
Module: Slack → Create a Message
Connection: [Your Slack Connection]
Channel: #vault-guardian-notifications

Message:
---
✅ **VAULT GUARDIAN: AUTO-HEAL SUCCESSFUL**

**File Restored**: {{1.file_name}}
**Restored From**: Archive_Backups
**Timestamp**: {{formatDate(now, "YYYY-MM-DD HH:mm:ss")}}

**Details**:
- Original Hash: `{{1.file_hash}}`
- Backup Hash: `{{2.backup_file_hash}}`
- File ID: `{{7.new_file_id}}`
- Backup Source: {{2.backup_download_link}}

**Status**: Vault integrity restored automatically
---
```

**Sub-Module 8C: Log to IKE-BOT**
```yaml
Module: HTTP → Make a Request
URL: https://your-ike-bot.com/api/agent-logs
Method: POST
Body:
{
  "level": "info",
  "action": "vault_auto_heal_success",
  "message": "File {{1.file_name}} successfully restored from backup",
  "metadata": {
    "file_id": "{{1.file_id}}",
    "file_name": "{{1.file_name}}",
    "restored_file_id": "{{7.new_file_id}}",
    "backup_hash": "{{2.backup_file_hash}}",
    "duration_ms": {{timestamp_diff(now, 1.created_time)}}
  }
}
```

---

## Error Handling Paths

### Global Error Handler
Add a global error handler to the scenario:

```yaml
Trigger: Any module error
Actions:
  1. Slack alert to #vault-guardian-errors
  2. Log to IKE-BOT agent_logs (level: error)
  3. Update Notion item status to "error"
  4. Pause scenario if 3+ consecutive errors
```

**Slack Error Message Template**:
```
❌ **VAULT GUARDIAN ERROR**

**Scenario**: AUTO_HEAL_v1.0
**Module**: {{error.module_name}}
**Error**: {{error.message}}
**File**: {{1.file_name}} (if available)

**Stack Trace**: 
{{error.stack}}

**Action**: Scenario paused for review
**Time**: {{formatDate(now, "YYYY-MM-DD HH:mm:ss")}}
```

---

## Scenario Settings

### Schedule & Trigger Settings
```yaml
Scheduling: Immediately as data arrives
Max consecutive runs: No limit
Max processing time: 60 seconds per execution
Data store: Enabled (for stateful tracking)

Scenario Status: Active (after testing)
```

### Advanced Settings
```yaml
Sequential Processing: Yes (process one at a time)
Max Number of Cycles: 1 (complete all operations per trigger)
Allow Storing Incomplete Executions: Yes
Execution History: 7 days
```

### Webhook Settings (Optional)
For manual trigger via Slack:
```yaml
Custom Webhook: https://hook.us1.make.com/[YOUR_WEBHOOK_ID]
Webhook Trigger: Manual heal request
Required Parameters: file_id, file_name
```

---

## Testing Checklist

Before activating:
- [ ] All 8 modules configured correctly
- [ ] Router conditions tested with sample data
- [ ] Notion connection working
- [ ] Google Drive connection working
- [ ] Slack notifications delivered
- [ ] Error handlers triggering correctly
- [ ] Test Case 1 passed (Successful restore)
- [ ] Test Case 2 passed (No backup found)
- [ ] Test Case 3 passed (False alarm)
- [ ] Test Case 4 passed (Manual trigger - optional)

---

## Deployment Steps

1. **Save Draft**: Save scenario as inactive draft
2. **Test Run**: Run with test data from Test Plan
3. **Review Logs**: Check all logs and notifications
4. **Activate**: Set scenario to Active status
5. **Monitor**: Watch first 24 hours closely
6. **Document**: Update run book with any issues

---

## Monitoring & Maintenance

### Daily Checks
- Review Slack notifications for patterns
- Check Notion ledger for stuck items
- Verify Make.com operations count

### Weekly Checks
- Review false alarm rate
- Check escalation count
- Verify backup coverage

### Monthly Review
- Analyze auto-heal success rate
- Review error logs for patterns
- Update router conditions if needed
- Check Make.com operations usage

---

## Troubleshooting

### Issue: Scenario Not Triggering
**Solution**: 
- Check Notion connection still valid
- Verify database permissions
- Check filter conditions in Module 1

### Issue: Backup Not Found but Exists
**Solution**:
- Verify Archive_Backups folder ID
- Check search query syntax
- Ensure file naming matches exactly

### Issue: Hash Always Mismatches
**Solution**:
- Check hash format (MD5 vs SHA256)
- Verify hash storage in Notion
- Test hash comparison logic independently

### Issue: Restore Fails with Permissions Error
**Solution**:
- Verify service account has Editor access
- Check Trust Vault folder permissions
- Ensure target folder ID is correct

---

## Next Steps

After completing AUTO_HEAL configuration:
1. Proceed to [VAULT_GUARDIAN_BACKUP_SYNC setup](./03-VAULT-GUARDIAN-BACKUP-SYNC.md)
2. Complete [Test Plan](./04-TEST-PLAN.md)
3. Review [Readiness Checklist](./05-READINESS-CHECKLIST.md)

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-04  
**Scenario Version**: VAULT_GUARDIAN_AUTO_HEAL_v1.0  
**Maintained By**: IKE-BOT Infrastructure Team
