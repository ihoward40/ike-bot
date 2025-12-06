# Vault Guardian Test Plan

## Overview
This comprehensive test plan covers all 4 required test cases for both VAULT_GUARDIAN_AUTO_HEAL_v1.0 and VAULT_GUARDIAN_BACKUP_SYNC_v1.0 scenarios. Each test includes setup, execution steps, expected outcomes, and rollback procedures.

## Test Environment Setup

### Prerequisites
- [ ] Both scenarios built but NOT activated yet
- [ ] Test Notion database with test entries
- [ ] Test Google Drive folders (separate from production)
- [ ] Slack test channel configured (#vault-guardian-testing)
- [ ] Test files prepared (various formats and sizes)
- [ ] Backup copies of all test data

### Test Data Preparation

**Create Test Files**:
```
test_document_1.pdf (5 MB, valid hash)
test_document_2.docx (2 MB, corrupted)
test_spreadsheet_1.xlsx (3 MB, missing from vault)
test_image_1.jpg (1 MB, false alarm test)
test_config_1.json (100 KB, manual heal test)
```

**Create Test Notion Entries**:
```yaml
Entry 1: Valid file with backup available
Entry 2: Corrupted file with no backup
Entry 3: File with hash mismatch (false alarm)
Entry 4: File for manual heal trigger
```

---

## Test Case 1: Successful Restore from Backup

### Purpose
Verify AUTO_HEAL can detect corruption, find backup, verify hash mismatch, and successfully restore the file.

### Test Scenario
A file in the Trust Vault is corrupted, a valid backup exists in Archive_Backups, and the system should automatically restore it.

### Setup Steps

1. **Prepare Test File**
   ```bash
   File: test_document_1.pdf
   Location: Trust Vault test folder
   Size: 5 MB
   Original Hash: abc123def456 (valid MD5)
   ```

2. **Create Backup**
   ```bash
   Backup File: test_document_1.pdf
   Location: Archive_Backups/Daily/
   Backup Hash: abc123def456 (matches original)
   ```

3. **Simulate Corruption**
   ```bash
   Action: Modify Trust Vault copy (add random bytes)
   New Hash: xyz789ghi012 (corrupted, doesn't match)
   ```

4. **Create Notion Entry**
   ```yaml
   File Name: test_document_1.pdf
   File Hash: xyz789ghi012 (corrupted hash)
   Expected Hash: abc123def456 (original)
   Status: corrupted
   Auto-heal: TRUE
   Backup Location: Archive_Backups/Daily/test_document_1.pdf
   ```

### Execution Steps

1. **Trigger AUTO_HEAL Scenario**
   - Method: Run once (manual trigger for testing)
   - Watch: Make.com execution log

2. **Observe Module Flow**
   ```
   [1] Notion Watch → Should detect corrupted entry ✓
   [2] Backup Retrieval → Should find backup file ✓
   [Router A] → Should route to "Backup Found" ✓
   [3] Hash Verification → Should detect mismatch ✓
   [Router B] → Should route to "Restore Needed" ✓
   [7] Restore/Copy → Should copy backup to vault ✓
   [8] Success Notification → Should update Notion + Slack ✓
   ```

3. **Monitor Outputs**
   - Check Make.com module results
   - Watch Slack for success notification
   - Verify Notion entry updated

### Expected Outcomes

#### ✅ Success Criteria

1. **Module 1: Notion Watch**
   - Detects corrupted file entry
   - Pulls correct file details
   - Timestamp: Within 1 minute of entry creation

2. **Module 2: Backup Retrieval**
   - Finds backup in Archive_Backups
   - Returns correct file ID and hash
   - Download link available

3. **Router A: Backup Found**
   - Routes to Hash Verification (not Escalation)
   - Condition: backup_file_id is not empty

4. **Module 3: Hash Verification**
   - Compares hashes correctly
   - Result: hash_match = "false"
   - Both hashes logged

5. **Router B: Hash Mismatch**
   - Routes to Restore/Copy (not False Alarm)
   - Condition: hash_match = "false"

6. **Module 7: Restore Operation**
   - Copies backup to Trust Vault
   - New file ID generated
   - Overwrites corrupted version

7. **Module 8: Success Notification**
   - **Notion**: Status → "restored", Restored At → current timestamp
   - **Slack**: Message to #vault-guardian-notifications with:
     - ✅ Success emoji
     - File name
     - Timestamp
     - Hash details
     - File links
   - **IKE-BOT**: Log entry created with action "vault_auto_heal_success"

8. **File Verification**
   - New file hash matches backup hash (abc123def456)
   - File size matches original (5 MB)
   - File is accessible and valid
   - Content is uncorrupted

### Rollback Procedure

If test needs to be reset:

```bash
1. Delete restored file from Trust Vault
2. Re-corrupt original file (or restore corrupted version)
3. Update Notion entry:
   - Status: corrupted
   - Auto-heal: TRUE
   - Restored At: [clear this field]
4. Clear Make.com execution history (optional)
5. Re-run test
```

### Validation Checklist

- [ ] Corrupted file detected automatically
- [ ] Backup found in Archive_Backups
- [ ] Hash mismatch identified correctly
- [ ] File restored successfully
- [ ] Notion entry updated with "restored" status
- [ ] Slack notification sent with success message
- [ ] IKE-BOT log entry created
- [ ] Restored file is valid and uncorrupted
- [ ] Execution completed in <30 seconds
- [ ] No errors in Make.com logs

---

## Test Case 2: No Backup Found (Escalation Path)

### Purpose
Verify AUTO_HEAL properly escalates when no backup is available, alerting team for manual intervention.

### Test Scenario
A file is corrupted or missing, but no backup exists in Archive_Backups. System should escalate to human operators.

### Setup Steps

1. **Prepare Test File**
   ```bash
   File: test_spreadsheet_1.xlsx
   Location: Trust Vault (missing/corrupted)
   Expected Hash: def456ghi789
   ```

2. **Ensure No Backup Exists**
   ```bash
   Location: Archive_Backups/
   Action: Verify test_spreadsheet_1.xlsx does NOT exist
   Search Result: No files found
   ```

3. **Create Notion Entry**
   ```yaml
   File Name: test_spreadsheet_1.xlsx
   File Hash: def456ghi789
   Status: missing
   Auto-heal: TRUE
   Backup Location: [empty or incorrect]
   ```

### Execution Steps

1. **Trigger AUTO_HEAL Scenario**
   - Method: Run once
   - Watch: Module execution flow

2. **Observe Module Flow**
   ```
   [1] Notion Watch → Should detect missing entry ✓
   [2] Backup Retrieval → Should find NO backup ✓
   [Router A] → Should route to "No Backup" path ✓
   [6] Escalation Path → Should trigger alert ✓
   ```

3. **Monitor Escalation**
   - Check Slack alert sent
   - Verify Notion updated with escalation status
   - Confirm manual intervention message clear

### Expected Outcomes

#### ✅ Success Criteria

1. **Module 1: Notion Watch**
   - Detects missing file entry
   - Pulls file details

2. **Module 2: Backup Retrieval**
   - Searches Archive_Backups
   - Returns empty result
   - backup_file_id is empty/null

3. **Router A: Backup Found?**
   - Routes to Escalation Path (Route 2)
   - Condition: backup_file_id is empty

4. **Module 6: Escalation Alert**
   - **Slack Message**:
     ```
     🚨 VAULT GUARDIAN: MANUAL INTERVENTION REQUIRED
     
     File: test_spreadsheet_1.xlsx
     Status: missing
     Issue: No backup found in Archive_Backups
     
     File Details:
     - File ID: [UUID]
     - Expected Path: [path]
     - Last Known Hash: def456ghi789
     
     Action Required:
     1. Locate backup manually
     2. Upload to Archive_Backups
     3. Trigger manual heal
     4. Or mark as permanent loss
     
     Priority: HIGH
     ```
   - Message sent to: #vault-guardian-alerts
   - Creates discussion thread

5. **Notion Update**
   - Status: "escalated"
   - Escalated At: Current timestamp
   - Notes: "No backup found - manual intervention required"
   - Auto-heal: FALSE (prevents infinite retries)

6. **IKE-BOT Log**
   - Entry created with action: "vault_auto_heal_escalation"
   - Level: "warn"
   - Contains file details and escalation reason

### Rollback Procedure

```bash
1. Update Notion entry:
   - Status: missing
   - Escalated At: [clear]
   - Auto-heal: TRUE
2. Delete Slack escalation message (optional)
3. Re-run test
```

### Validation Checklist

- [ ] Missing file detected
- [ ] Backup search returned no results
- [ ] Router correctly chose escalation path
- [ ] Slack alert sent with HIGH priority
- [ ] Alert message contains all required details
- [ ] Notion entry updated to "escalated" status
- [ ] Auto-heal disabled to prevent retry loop
- [ ] IKE-BOT log entry created
- [ ] Manual intervention instructions clear
- [ ] No errors in execution

### Post-Test Actions

After validating escalation:
1. Manually create backup in Archive_Backups
2. Test manual heal trigger (Test Case 4)
3. Verify system can recover after manual intervention

---

## Test Case 3: False Alarm (Hash Mismatch Resolved on Re-check)

### Purpose
Verify AUTO_HEAL correctly identifies false alarms when hash verification shows files are actually identical.

### Test Scenario
A file is flagged as corrupted, but hash re-verification shows it matches the backup (false alarm, possibly due to timing or cache).

### Setup Steps

1. **Prepare Test File**
   ```bash
   File: test_image_1.jpg
   Location: Trust Vault
   Actual Hash: ghi789jkl012
   Size: 1 MB
   ```

2. **Create Valid Backup**
   ```bash
   Backup File: test_image_1.jpg
   Location: Archive_Backups/Daily/
   Backup Hash: ghi789jkl012 (SAME as original)
   ```

3. **Create Notion Entry (Incorrectly Flagged)**
   ```yaml
   File Name: test_image_1.jpg
   File Hash: ghi789jkl012
   Status: corrupted (flagged incorrectly)
   Auto-heal: TRUE
   Backup Location: Archive_Backups/Daily/test_image_1.jpg
   
   # Note: In reality, the file is fine - this simulates false positive
   ```

### Execution Steps

1. **Trigger AUTO_HEAL Scenario**
   - Method: Run once
   - Watch for false alarm detection

2. **Observe Module Flow**
   ```
   [1] Notion Watch → Detects "corrupted" entry ✓
   [2] Backup Retrieval → Finds backup ✓
   [Router A] → Routes to Hash Verification ✓
   [3] Hash Verification → Hashes MATCH ✓
   [Router B] → Routes to False Alarm path ✓
   [4] False Alarm Handler → Updates Notion ✓
   [5] Log & Close → Logs event ✓
   ```

3. **Monitor Resolution**
   - Check Notion status changed to "verified"
   - Verify no restore operation performed
   - Confirm false alarm logged

### Expected Outcomes

#### ✅ Success Criteria

1. **Module 1: Notion Watch**
   - Detects entry marked as corrupted
   - Pulls file details

2. **Module 2: Backup Retrieval**
   - Finds backup file
   - Returns backup hash: ghi789jkl012

3. **Router A: Backup Found**
   - Routes to Hash Verification
   - backup_file_id not empty

4. **Module 3: Hash Verification**
   - Compares hashes
   - Original: ghi789jkl012
   - Backup: ghi789jkl012
   - Result: hash_match = "true"

5. **Router B: Hash Match?**
   - Routes to False Alarm Handler (Route 2)
   - Condition: hash_match = "true"

6. **Module 4: False Alarm Handler**
   - **Notion Update**:
     - Status: "verified"
     - Last Verified: Current timestamp
     - Notes: "False alarm - hash verified on re-check"
     - Auto-heal: FALSE (no further action needed)

7. **Module 5: Log & Close**
   - **IKE-BOT Log**:
     - Level: "info"
     - Action: "vault_auto_heal_false_alarm"
     - Message: "File test_image_1.jpg verified - false alarm"
     - Metadata includes both hashes (showing they match)

8. **File Status**
   - Original file UNCHANGED (no restore performed)
   - File remains in Trust Vault
   - No copy operation executed

### Rollback Procedure

```bash
1. Update Notion entry:
   - Status: corrupted
   - Last Verified: [clear]
   - Auto-heal: TRUE
   - Notes: [clear]
2. Re-run test
```

### Validation Checklist

- [ ] Entry detected as corrupted (false positive)
- [ ] Backup found successfully
- [ ] Hash verification performed
- [ ] Hashes matched correctly
- [ ] Router chose false alarm path
- [ ] No restore operation performed
- [ ] Notion updated to "verified" status
- [ ] IKE-BOT log entry shows "false_alarm"
- [ ] Original file left untouched
- [ ] Auto-heal disabled (resolved)
- [ ] No unnecessary operations executed

### Analysis

**Key Insights**:
- False alarm rate should be <5% in production
- Common causes: timing issues, cache staleness, incorrect hash storage
- This path prevents unnecessary restore operations
- Saves Make.com operations and maintains file integrity

### Improvement Actions

If false alarm rate is high:
1. Improve initial hash verification logic
2. Add delay before marking as corrupted
3. Implement double-check before flagging
4. Review hash storage mechanism in Notion

---

## Test Case 4: Manual Heal via Slack Trigger (Optional)

### Purpose
Verify operators can manually trigger heal operation for specific files via Slack, providing manual override capability.

### Test Scenario
An operator identifies a corrupted file and wants to trigger healing manually without waiting for automated detection.

### Setup Steps

1. **Prepare Test File**
   ```bash
   File: test_config_1.json
   Location: Trust Vault
   Current State: Corrupted (manual corruption)
   Hash: jkl012mno345
   ```

2. **Create Backup**
   ```bash
   Backup File: test_config_1.json
   Location: Archive_Backups/Manual/
   Hash: mno345pqr678 (valid backup)
   ```

3. **Create Notion Entry**
   ```yaml
   File Name: test_config_1.json
   File Hash: jkl012mno345 (corrupted)
   Status: corrupted
   Auto-heal: FALSE (disabled - will trigger manually)
   Backup Location: Archive_Backups/Manual/test_config_1.json
   ```

4. **Set Up Slack Webhook (If Not Already)**
   ```yaml
   # Add to AUTO_HEAL scenario:
   Module 0: Custom Webhook (Instant Trigger)
   Webhook URL: https://hook.us1.make.com/[webhook_id]
   
   Webhook Parameters:
     - file_id (required)
     - file_name (optional, for display)
     - operator_name (who triggered)
   ```

### Execution Steps

1. **Trigger via Slack Command**
   
   **Option A: Slash Command** (Preferred)
   ```
   In Slack: #vault-guardian-ops
   Command: /vault-heal file_id=[notion_page_id]
   ```

   **Option B: Custom App Button** (Advanced)
   ```
   Slack App: Vault Guardian Control Panel
   Button: "🔧 Trigger Manual Heal"
   Modal: Enter file_id or select from dropdown
   ```

   **Option C: Direct Webhook Call** (For Testing)
   ```bash
   curl -X POST https://hook.us1.make.com/[webhook_id] \
     -H "Content-Type: application/json" \
     -d '{
       "file_id": "[notion_page_id]",
       "file_name": "test_config_1.json",
       "operator_name": "test_operator",
       "trigger_source": "manual_slack"
     }'
   ```

2. **Observe Execution**
   ```
   [0] Webhook Trigger → Receives manual heal request ✓
   [1] Notion Lookup → Fetches file details ✓
   [2] Backup Retrieval → Finds backup ✓
   [Router A] → Routes based on backup availability ✓
   [3-8] Standard AUTO_HEAL flow... ✓
   ```

3. **Monitor Slack Response**
   - Immediate confirmation message
   - Progress updates
   - Final success/failure notification

### Expected Outcomes

#### ✅ Success Criteria

1. **Webhook Reception**
   - Receives POST request with file_id
   - Validates required parameters
   - Extracts operator_name

2. **Immediate Slack Confirmation**
   ```
   ⚙️ Manual heal triggered for test_config_1.json
   Operator: test_operator
   Status: Processing...
   ```

3. **Notion Lookup (Custom Module)**
   - Fetches Notion entry by file_id
   - Retrieves all file details
   - Even if Auto-heal is FALSE

4. **Standard AUTO_HEAL Flow**
   - Executes Modules 2-8 as normal
   - Backup found → Hash checked → Restore if needed
   - All logic same as automated trigger

5. **Enhanced Slack Notification**
   ```
   ✅ Manual heal completed successfully
   
   File: test_config_1.json
   Triggered by: test_operator
   Action: Restored from backup
   
   Details:
   - Original hash: jkl012mno345
   - Backup hash: mno345pqr678
   - Restored at: 2023-12-04 15:30:22
   
   File is now verified and restored ✓
   ```

6. **Notion Update**
   - Status: "restored"
   - Restored At: Current timestamp
   - Restored By: "test_operator" (manual trigger)
   - Trigger Method: "manual_slack"
   - Notes: "Manually healed via Slack by test_operator"

7. **IKE-BOT Log**
   - Action: "vault_manual_heal"
   - Level: "info"
   - Operator: test_operator
   - Metadata includes trigger source

### Rollback Procedure

```bash
1. Re-corrupt test file
2. Update Notion:
   - Status: corrupted
   - Restored At: [clear]
   - Restored By: [clear]
   - Trigger Method: [clear]
3. Re-test webhook trigger
```

### Validation Checklist

- [ ] Webhook receives POST request correctly
- [ ] Required parameters validated
- [ ] Immediate Slack confirmation sent
- [ ] Notion entry fetched successfully
- [ ] AUTO_HEAL flow executed fully
- [ ] File restored correctly
- [ ] Slack success notification sent
- [ ] Notification includes operator name
- [ ] Notion updated with manual trigger details
- [ ] IKE-BOT log includes "manual_heal" action
- [ ] Execution completed in <45 seconds

### Slack Integration Setup

**Slash Command Configuration**:
```yaml
Command: /vault-heal
Description: "Manually trigger Vault Guardian healing"
Usage: /vault-heal file_id=[id]

Webhook:
  URL: https://hook.us1.make.com/[webhook_id]
  Method: POST
  
Response:
  Type: ephemeral (only visible to user)
  Text: "Manual heal triggered. Check #vault-guardian-notifications for updates."
```

**App Button Configuration** (Advanced):
```yaml
Button Location: #vault-guardian-ops channel
Button Text: "🔧 Trigger Manual Heal"
Button Style: Primary

Modal:
  Title: "Manual Vault Heal"
  Fields:
    - File ID (required, text input)
    - Reason (optional, text area)
  Submit: "Start Healing"
  
On Submit:
  → Call webhook with parameters
  → Show confirmation
```

### Security Considerations

**Access Control**:
- Restrict Slack command to specific users/roles
- Log all manual triggers for audit
- Require reason/justification (optional)
- Rate limit manual triggers (max 10/hour)

**Validation**:
- Verify file_id format (UUID)
- Check Notion entry exists
- Confirm backup available before starting
- Validate operator has permissions

---

## Test Summary Matrix

| Test Case | Purpose | Trigger | Expected Path | Duration | Pass Criteria |
|-----------|---------|---------|---------------|----------|---------------|
| **TC1: Successful Restore** | Full heal flow | Auto | Modules 1→2→A→3→B→7→8 | <30s | File restored, Notion updated, Slack notified |
| **TC2: No Backup** | Escalation | Auto | Modules 1→2→A→6 | <15s | Slack alert, Notion escalated, no restore |
| **TC3: False Alarm** | Prevent unnecessary restore | Auto | Modules 1→2→A→3→B→4→5 | <20s | No restore, Notion verified, log created |
| **TC4: Manual Trigger** | Operator override | Manual | Modules 0→1→2→A→3→B→7→8 | <45s | Triggered via Slack, full heal flow, operator tracked |

---

## BACKUP_SYNC Test Cases

### Test Case 5: Basic File Sync

**Purpose**: Verify new files in Archive are copied to Archive_Backups

**Setup**:
1. Place new file in Archive folder: `test_sync_1.pdf`
2. Ensure Archive_Backups does not have this file

**Execution**:
1. Trigger BACKUP_SYNC (or wait for scheduled run)
2. Observe modules 1-4

**Expected Outcome**:
- Module 1: Detects new file
- Module 2: Copies to Archive_Backups with timestamp suffix
- Module 3: Creates Notion log entry
- Module 4: Sends Slack confirmation

**Validation**:
- [ ] File copied successfully
- [ ] Filename includes timestamp
- [ ] Notion entry created with all fields
- [ ] Slack notification received
- [ ] MD5 hashes match

### Test Case 6: Multiple Files Sync

**Purpose**: Verify batch processing of multiple files

**Setup**:
1. Place 5 files in Archive folder simultaneously
2. File types: PDF, DOCX, XLSX, JPG, JSON

**Execution**:
1. Trigger BACKUP_SYNC
2. Watch sequential processing

**Expected Outcome**:
- All 5 files copied to Archive_Backups
- 5 Notion entries created
- 1 summary Slack message (if using aggregator)
- No errors or skipped files

**Validation**:
- [ ] All files copied successfully
- [ ] Processing order: newest first
- [ ] No duplicates created
- [ ] Data store updated for each file
- [ ] Total execution time <2 minutes

---

## Integrated Test Scenario

### End-to-End Workflow Test

**Purpose**: Test both scenarios working together

**Scenario**:
1. New file added to Archive → BACKUP_SYNC copies to Archive_Backups
2. Original file in Vault gets corrupted → AUTO_HEAL restores from Archive_Backups
3. Verify complete flow from backup creation to restoration

**Execution**:
```
[BACKUP_SYNC]
  Step 1: Add file to Archive
  Step 2: Wait for sync (15 min max)
  Step 3: Verify backup created
  
[SIMULATE CORRUPTION]
  Step 4: Corrupt file in Vault
  Step 5: Update Notion ledger
  
[AUTO_HEAL]
  Step 6: Wait for AUTO_HEAL trigger
  Step 7: Verify restoration from backup
  Step 8: Validate file integrity
```

**Expected Outcome**:
- Complete cycle from backup to restoration
- Both scenarios execute without errors
- File ends in valid, restored state
- All notifications sent correctly

---

## Rollback Plan (Comprehensive)

### If Tests Fail and Need Complete Reset

1. **Pause Both Scenarios**
   ```
   Make.com → Scenarios → Turn OFF
   ```

2. **Clear Test Data**
   ```bash
   # Google Drive
   - Delete all test files from Archive_Backups
   - Delete test files from Trust Vault
   - Keep original clean copies
   
   # Notion
   - Delete all test entries
   - Or reset Status/Auto-heal flags
   
   # Slack
   - Clear test messages (optional)
   
   # Make.com
   - Clear execution history (optional)
   - Reset data store
   ```

3. **Restore Clean State**
   ```bash
   - Re-upload clean test files
   - Recreate Notion test entries
   - Verify folder permissions
   ```

4. **Re-test**
   ```
   - Start with Test Case 1
   - Progress through all 4 test cases
   - Document any issues encountered
   ```

---

## Success Criteria Summary

**All tests must meet these criteria**:

- [ ] **Functionality**: All expected modules execute
- [ ] **Accuracy**: Correct decisions made by routers
- [ ] **Performance**: Execution within time limits
- [ ] **Notifications**: All alerts/messages sent
- [ ] **Data Integrity**: Files restored correctly
- [ ] **Logging**: All actions logged to IKE-BOT
- [ ] **Error Handling**: Failures handled gracefully
- [ ] **No Regressions**: Existing functionality unaffected

---

## Post-Test Actions

After all tests pass:

1. **Document Results**
   - Record test execution times
   - Note any warnings or minor issues
   - Document actual vs. expected behavior

2. **Update Configurations**
   - Adjust timing if needed
   - Tune router conditions based on results
   - Update error thresholds

3. **Prepare for Production**
   - Complete [Readiness Checklist](./05-READINESS-CHECKLIST.md)
   - Schedule activation window
   - Brief team on monitoring procedures

4. **Archive Test Data**
   - Keep test files for future regression testing
   - Document test environment configuration
   - Store execution logs

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-04  
**Test Plan Status**: Ready for Execution  
**Maintained By**: IKE-BOT QA Team
