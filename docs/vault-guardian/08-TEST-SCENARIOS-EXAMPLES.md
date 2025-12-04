# Vault Guardian Test Scenarios & Examples

## Overview

This guide provides practical test scenarios, sample data, and step-by-step examples for validating all Vault Guardian components before production deployment.

## Test Environment Setup

### Sample Test Data

Create these test files for comprehensive testing:

```yaml
Test Files:
  - test_document_valid.pdf (5 MB)
    Purpose: Valid file with correct hash
    Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    
  - test_document_corrupted.docx (2 MB)
    Purpose: File with corrupted data
    Hash: CORRUPTED_HASH_12345
    
  - test_spreadsheet_missing.xlsx (3 MB)
    Purpose: File missing from vault
    Hash: f7d8c9e1234567890abcdef1234567890abcdef
    
  - test_image_false_alarm.jpg (1 MB)
    Purpose: File flagged incorrectly
    Hash: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
    
  - test_config_manual.json (100 KB)
    Purpose: Manual heal trigger test
    Hash: 1234567890abcdef1234567890abcdef12345678
```

### Notion Test Database

Create test entries in your Notion Vault Ledger:

| File Name | Status | Hash | Auto-heal | Backup Location |
|-----------|--------|------|-----------|-----------------|
| test_document_valid.pdf | healthy | e3b0c442... | FALSE | Archive_Backups/test_document_valid.pdf |
| test_document_corrupted.docx | corrupted | CORRUPTED... | TRUE | Archive_Backups/test_document_corrupted.docx |
| test_spreadsheet_missing.xlsx | missing | f7d8c9e1... | TRUE | [empty] |
| test_image_false_alarm.jpg | corrupted | a1b2c3d4... | TRUE | Archive_Backups/test_image_false_alarm.jpg |
| test_config_manual.json | corrupted | 12345678... | FALSE | Archive_Backups/test_config_manual.json |

---

## Scenario 1: Complete End-to-End Flow

### Objective
Validate the entire Vault Guardian system from file corruption to restoration.

### Steps

#### 1. Setup Phase
```bash
# Create test file in Trust Vault
$ echo "Test Content - Original" > test_e2e.txt
$ Upload to Trust Vault folder

# Create backup in Archive_Backups
$ cp test_e2e.txt test_e2e_backup.txt
$ Upload to Archive_Backups folder
```

#### 2. Trigger BACKUP_SYNC
```yaml
Action: Place new file in Archive folder
Expected: 
  - File copied to Archive_Backups within 15 minutes
  - Notion entry created in Backup Log
  - Slack notification in #vault-guardian-backups
  
Verification:
  ✓ Backup file exists: Archive_Backups/test_e2e.txt_backup_20251204_120000.txt
  ✓ Notion entry shows: Status = "completed", Method = "AUTO_SYNC"
  ✓ Slack shows: "✅ Backup Synced Successfully"
```

#### 3. Simulate Corruption
```bash
# Modify original file (simulate corruption)
$ echo "Test Content - CORRUPTED" > test_e2e.txt
$ Upload to Trust Vault folder (overwrites original)

# Update Notion Ledger
$ Set Status = "corrupted"
$ Set Auto-heal = TRUE
$ Set File Hash = [new corrupted hash]
```

#### 4. Trigger AUTO_HEAL
```yaml
Expected AUTO_HEAL Flow:
  [1] Notion Watch → Detects corrupted entry
  [2] Backup Search → Finds backup in Archive_Backups
  [Router A] → Routes to "Backup Found" (YES path)
  [3] Hash Verification → Calculates mismatch
  [Router B] → Routes to "Restore" (hash ≠)
  [7] Restore → Copies backup to Trust Vault
  [8] Success → Updates Notion + Slack notification
  
Verification:
  ✓ File in Trust Vault restored to original content
  ✓ Notion shows: Status = "restored", Restored At = [timestamp]
  ✓ Slack shows: "✅ VAULT GUARDIAN: AUTO-HEAL SUCCESSFUL"
  ✓ File hash matches backup hash
```

#### 5. Trigger CHECKSUM_WATCHER
```yaml
Expected CHECKSUM_WATCHER Flow:
  [1] Notion Search → Retrieves restored file entry
  [2] Calculate Checksum → Compares hashes
  [Router] → Routes to "Checksum Match" (valid)
  [4] Update → Sets Validation_Status = "Valid"
  [7] Audit Log → Logs to Google Sheets
  
Verification:
  ✓ Notion shows: Validation_Status = "Valid"
  ✓ Google Sheets has log entry with Status = "VALID"
  ✓ No Slack alert (validation passed)
```

### Expected Timeline
```
T+0:00  - File placed in Archive
T+0:15  - BACKUP_SYNC creates backup
T+0:20  - File corrupted manually
T+0:21  - Notion updated with corruption flag
T+0:22  - AUTO_HEAL detects and restores
T+0:37  - CHECKSUM_WATCHER validates restoration
```

### Success Criteria
- [x] Complete flow executed without errors
- [x] File successfully restored from backup
- [x] All notifications delivered
- [x] Audit logs complete
- [x] Total time < 40 minutes

---

## Scenario 2: Escalation Path Testing

### Objective
Validate escalation workflow when no backup is available.

### Steps

#### 1. Create Scenario
```yaml
# Notion Entry
File Name: critical_document_no_backup.pdf
Status: missing
Auto-heal: TRUE
Backup Location: [empty or non-existent]

# Ensure no backup exists
Action: Verify Archive_Backups does NOT contain this file
```

#### 2. Trigger AUTO_HEAL
```yaml
Expected Flow:
  [1] Notion Watch → Detects missing file
  [2] Backup Search → Searches Archive_Backups
  [Router A] → Routes to "No Backup" (NO path)
  [6] Escalation → Sends high-priority Slack alert
  [16] Update Notion → Status = "escalated"
  
Slack Alert Content:
  🚨 VAULT GUARDIAN: MANUAL INTERVENTION REQUIRED
  File: critical_document_no_backup.pdf
  Issue: No backup found
  Priority: HIGH
  Action: [Manual steps listed]
```

#### 3. Manual Resolution
```yaml
Option A: Locate and Upload Backup
  1. Find backup manually (different location, external drive, etc.)
  2. Upload to Archive_Backups folder
  3. Update Notion: Status = "corrupted", Auto-heal = TRUE
  4. AUTO_HEAL will retry and succeed
  
Option B: Manual Heal via Slack
  1. Use Slack command: /vault-heal file_id=[notion_page_id]
  2. Webhook triggers AUTO_HEAL with specific file
  3. Follow restoration flow
  
Option C: Mark as Permanent Loss
  1. Update Notion: Status = "permanent_loss"
  2. Document in Notes field
  3. Notify stakeholders
```

### Verification Checklist
- [x] Escalation alert sent to Slack
- [x] Alert includes all required information
- [x] Notion status updated to "escalated"
- [x] Manual intervention instructions clear
- [x] Resolution path documented

---

## Scenario 3: False Alarm Detection

### Objective
Validate system correctly identifies and handles false positives.

### Steps

#### 1. Create False Positive
```yaml
# Setup
File: test_false_alarm.txt
Original Hash: abc123 (correct)
Backup Hash: abc123 (same, correct)

# Notion Entry (incorrectly flagged)
Status: corrupted (false positive)
Auto-heal: TRUE
File Hash: abc123 (actually correct)
```

#### 2. Trigger AUTO_HEAL
```yaml
Expected Flow:
  [1] Notion Watch → Detects "corrupted" flag
  [2] Backup Search → Finds backup
  [Router A] → Routes to "Backup Found"
  [3] Hash Verification → Compares hashes
      original_hash: abc123
      backup_hash: abc123
      hash_match: TRUE
  [Router B] → Routes to "False Alarm" path
  [10] Update Notion → Status = "verified"
  [11] Log to IKE-BOT → Action = "false_alarm"
  
No Restoration Occurs!
```

#### 3. Verify System Behavior
```yaml
File Status:
  ✓ Original file UNCHANGED
  ✓ No copy operation performed
  ✓ File remains in Trust Vault
  
Notion Updates:
  ✓ Status changed to "verified"
  ✓ Last Verified timestamp updated
  ✓ Notes: "False alarm - hash verified on re-check"
  ✓ Auto-heal disabled (set to FALSE)
  
Logs:
  ✓ IKE-BOT agent_logs entry created
  ✓ Level: "info"
  ✓ Action: "vault_auto_heal_false_alarm"
```

### Analysis
```
False Alarm Rate: Should be < 5%

Common Causes:
  - Timing issues (hash calculated during file update)
  - Cache staleness
  - Incorrect hash storage in Notion
  - Manual flag without verification

Prevention:
  - Add delay before marking as corrupted
  - Implement double-check before flagging
  - Review hash storage mechanism
```

---

## Scenario 4: Checksum Validation Cycle

### Objective
Test complete checksum validation workflow.

### Steps

#### 1. Prepare Test Data
```yaml
# Create 3 Notion entries
Entry 1:
  Template_Name: Valid Template
  Guardian_Checksum: [correct hash]
  Status: Synced
  
Entry 2:
  Template_Name: Anomaly Template
  Guardian_Checksum: [incorrect hash]
  Status: Synced
  
Entry 3:
  Template_Name: New Template
  Guardian_Checksum: [empty]
  Status: Synced
```

#### 2. Trigger CHECKSUM_WATCHER
```yaml
Module 1: Retrieves 3 entries
Module 2: Calculates fresh checksums for each

Entry 1 Flow (Valid):
  Router → Route 1 (Checksum Match)
  Module 4 → Updates Last_Validated
  Result: ✓ Validation_Status = "Valid"
  
Entry 2 Flow (Anomaly):
  Router → Route 2 (Checksum Mismatch)
  Module 5 → Sends Slack alert
  Result: 🚨 Alert sent, awaiting manual review
  
Entry 3 Flow (Missing):
  Router → Route 3 (Missing Checksum)
  Module 6 → Generates and stores checksum
  Result: ✓ Validation_Status = "Generated"
```

#### 3. Verify Audit Log
```yaml
Google Sheets "Checksum_Validation_Log":
  Row 1: Valid Template | VALID | [matching hashes]
  Row 2: Anomaly Template | MISMATCH | [different hashes]
  Row 3: New Template | GENERATED | [new hash stored]
  
Each row contains:
  - Timestamp
  - Template name
  - Notion ID
  - Original checksum
  - Calculated checksum
  - Status
  - Router route taken
  - Executor version
```

### Expected Outcomes
```
Validation Success Rate: >95%
Processing Time: <30 seconds per cycle
Anomaly Detection: 1-5% of records
False Positives: <2%
```

---

## Scenario 5: Integration Testing

### Objective
Validate all three scenarios working together seamlessly.

### Steps

#### 1. Setup Integrated Environment
```yaml
Active Scenarios:
  ✓ BACKUP_SYNC (running every 15 min)
  ✓ AUTO_HEAL (watching Notion continuously)
  ✓ CHECKSUM_WATCHER (running every 15 min)
  
Test Sequence:
  1. BACKUP_SYNC creates backup
  2. File gets corrupted
  3. CHECKSUM_WATCHER detects anomaly
  4. AUTO_HEAL restores from backup
  5. CHECKSUM_WATCHER validates restoration
```

#### 2. Execute Integration Flow
```yaml
T+0:00 - Place file in Archive
  Expected: BACKUP_SYNC triggers

T+0:15 - BACKUP_SYNC executes
  Result: Backup created in Archive_Backups
  
T+0:16 - Simulate corruption
  Action: Modify file, update Notion
  
T+0:17 - AUTO_HEAL triggers
  Result: Detects corruption, searches backup
  
T+0:18 - AUTO_HEAL restores
  Result: File restored, Notion updated
  
T+0:30 - CHECKSUM_WATCHER validates
  Result: Checksum match, status = "Valid"
  
T+0:45 - Next BACKUP_SYNC cycle
  Result: Backup updated with restored file
```

#### 3. Verify End State
```yaml
Trust Vault:
  ✓ File content restored to original
  ✓ File hash matches backup
  
Archive_Backups:
  ✓ Latest backup reflects restored file
  ✓ Backup history maintained
  
Notion Vault Ledger:
  ✓ Status = "restored" → "verified"
  ✓ Auto-heal disabled
  ✓ Last Validated timestamp current
  
Notion Backup Log:
  ✓ Original backup entry
  ✓ Post-restoration backup entry
  
Google Sheets:
  ✓ Validation log shows restoration cycle
  ✓ All checksums recorded
  
Slack Channels:
  ✓ Backup notification
  ✓ Restoration success notification
  ✓ Validation confirmation (if configured)
```

### Performance Metrics
```
Total Recovery Time: <5 minutes
Data Loss: 0 bytes
Automation Rate: 100% (no manual intervention)
Notification Delivery: 100%
```

---

## Scenario 6: Stress Testing

### Objective
Validate system performance under high load.

### Test Configuration
```yaml
Volume:
  - 100 files in Archive folder
  - 50 corrupted files in Vault
  - 25 checksum validations
  
Timing:
  - All files added simultaneously
  - Scenarios running concurrently
  
Expected Behavior:
  - Sequential processing (no parallel conflicts)
  - No dropped operations
  - Graceful degradation if needed
```

### Execution Steps

#### 1. Load Test - BACKUP_SYNC
```yaml
Action: Upload 100 files to Archive simultaneously
Expected:
  - Files processed sequentially
  - ~10 files per 15-minute cycle
  - Total completion: ~2.5 hours
  - No failures or timeouts
  
Monitoring:
  - Make.com operations count
  - Execution time per file
  - Error rate
  - Memory/CPU usage (if available)
```

#### 2. Load Test - AUTO_HEAL
```yaml
Action: Flag 50 files as corrupted simultaneously
Expected:
  - Each file processed independently
  - No race conditions
  - Backup search doesn't conflict
  - Restoration completed for all
  
Key Metrics:
  - Success rate: >99%
  - Average heal time: <30 seconds
  - Peak operations: Track quota usage
```

#### 3. Load Test - CHECKSUM_WATCHER
```yaml
Action: 25 records needing validation
Expected:
  - All processed within single 15-min cycle
  - Audit log complete
  - No missing entries
  
Performance:
  - Processing rate: >10 records/minute
  - Calculation time: <2 seconds per hash
  - Router decision time: <1 second
```

### Optimization Recommendations
```yaml
If Performance Issues:
  1. Increase BACKUP_SYNC interval (15 min → 30 min)
  2. Add batch processing for CHECKSUM_WATCHER
  3. Implement file size filters
  4. Upgrade Make.com plan tier
  5. Add rate limiting
```

---

## Scenario 7: Error Recovery Testing

### Objective
Validate error handlers and retry logic.

### Test Cases

#### 1. Notion Connection Failure
```yaml
Simulate: Revoke Notion API token temporarily
Expected:
  - Module fails with connection error
  - Error handler catches failure
  - Slack alert sent to #vault-guardian-errors
  - Scenario pauses after 3 consecutive errors
  
Recovery:
  - Restore Notion token
  - Manually resume scenario
  - Pending operations complete
```

#### 2. Google Drive Quota Exceeded
```yaml
Simulate: Reach storage quota limit
Expected:
  - Copy operation fails
  - Error message: "Insufficient storage"
  - Escalation alert sent
  - Scenario continues for other files
  
Recovery:
  - Free up storage or expand quota
  - Retry failed operations
  - Monitor quota usage
```

#### 3. Slack Rate Limit
```yaml
Simulate: Send >1 message per second
Expected:
  - Slack API returns 429 error
  - Retry with exponential backoff
  - Messages queued
  - Eventually delivered
  
Monitoring:
  - Check Slack rate limit headers
  - Verify retry logic working
  - No messages lost
```

---

## Test Data Templates

### Notion Vault Ledger Entry Template
```json
{
  "File Name": "test_file_001.pdf",
  "Status": "healthy",
  "File Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "File Path": "/Trust_Vault/Documents/test_file_001.pdf",
  "Auto-heal": false,
  "Backup Location": "https://drive.google.com/file/d/ABC123/view",
  "Last Verified": "2025-12-04T10:00:00Z",
  "Created At": "2025-12-01T09:00:00Z"
}
```

### Notion Backup Log Entry Template
```json
{
  "Name": "test_file_001.pdf - Backup 2025-12-04",
  "Original File ID": "1a2b3c4d5e6f7g8h9i0j",
  "Backup File ID": "9i8h7g6f5e4d3c2b1a0j",
  "File Name": "test_file_001.pdf",
  "File Size": 5242880,
  "File Type": "application/pdf",
  "MD5 Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "Hash Verified": true,
  "Original Created": "2025-12-01T09:00:00Z",
  "Backup Created": "2025-12-04T10:00:00Z",
  "Logged At": "2025-12-04T10:00:05Z",
  "Source": "Archive Folder",
  "Backup Method": "AUTO_SYNC",
  "Status": "completed"
}
```

### Google Sheets Audit Log Entry
```csv
2025-12-04 10:15:00,test_template_001,abc-123-def-456,e3b0c44298fc...,e3b0c44298fc...,VALID,Route 1,VAULT_GUARDIAN_v1.1
```

---

## Validation Checklist

### Pre-Test Validation
- [ ] All scenarios built in Make.com
- [ ] All connections authorized
- [ ] Test data created
- [ ] Slack channels configured
- [ ] Notion databases ready
- [ ] Google Sheets set up

### Post-Test Validation
- [ ] All test scenarios passed
- [ ] No unexpected errors
- [ ] Performance within targets
- [ ] Notifications delivered
- [ ] Audit logs complete
- [ ] Documentation accurate

---

## Troubleshooting Test Issues

### Issue: Test Scenarios Not Triggering
**Solution**: 
- Check scenario is Active
- Verify trigger conditions met
- Review filter configurations
- Check connection expiration

### Issue: Inconsistent Test Results
**Solution**:
- Clear test data between runs
- Reset Notion entries to known state
- Verify no parallel tests running
- Check timezone settings

### Issue: Performance Slower Than Expected
**Solution**:
- Check Make.com operations quota
- Review module timeout settings
- Optimize filters and queries
- Consider upgrading plan

---

## Next Steps After Testing

1. **Document Results**: Record all test outcomes
2. **Update Configs**: Adjust based on test learnings
3. **Create Runbook**: Document common issues and solutions
4. **Train Team**: Share test scenarios with operators
5. **Schedule Retesting**: Plan quarterly validation runs

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-04  
**Test Scenarios**: 7 comprehensive scenarios  
**Maintained By**: IKE-BOT QA Team
