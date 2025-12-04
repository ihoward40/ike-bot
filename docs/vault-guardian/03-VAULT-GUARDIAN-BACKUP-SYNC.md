# VAULT_GUARDIAN_BACKUP_SYNC_v1.0 Configuration Guide

## Overview
This guide provides detailed configuration for building the VAULT_GUARDIAN_BACKUP_SYNC_v1.0 scenario in Make.com. This scenario monitors the Archive folder for new files and automatically syncs them to Archive_Backups with proper logging.

## Architecture Overview

**Total Modules**: 4 modules (simpler than AUTO_HEAL)  
**Purpose**: Automated backup synchronization and logging  
**Trigger**: New files detected in Archive folder  
**Actions**: Copy to Archive_Backups, log details, update Notion

## Module Flow Diagram

```
[1] Watch Archive Folder
         ↓
[2] Copy to Archive_Backups
         ↓
[3] Log Backup Details to Notion
         ↓
[4] Send Confirmation Notification
```

## Prerequisites

Before starting:
- [ ] Make.com Pro or higher subscription
- [ ] Google Drive integration connected
- [ ] Notion integration connected
- [ ] Slack integration connected (optional)
- [ ] Archive folder identified in Google Drive
- [ ] Archive_Backups folder created (from [01-GOOGLE-DRIVE-SETUP.md](./01-GOOGLE-DRIVE-SETUP.md))
- [ ] Notion Backup Log database created

## Module-by-Module Configuration

---

### Module 1: Watch Archive Folder

**Module Type**: `Google Drive` → `Watch Files`

**Purpose**: Monitors the main Archive folder for newly added files

**Configuration**:
```yaml
Connection: [Your Google Drive Connection]

Folder to Watch: [Archive Folder ID]
  - Get this from: Google Drive URL after /folders/

Watch for: New Files Only
Folder depth: Current folder only (not subfolders)
File types: All files

Limit: 10 files per execution
Sort by: Created time (newest first)

Advanced Options:
  - Exclude: .tmp, .part (temporary files)
  - Minimum size: 1 KB (avoid empty files)
```

**Output Fields to Capture**:
- `file_id` (Google Drive file ID)
- `file_name` (Name property)
- `file_size` (Size in bytes)
- `file_type` (MIME type)
- `created_time` (Creation timestamp)
- `md5_checksum` (MD5 hash)
- `web_content_link` (Download link)
- `owner_email` (File owner)

**Error Handling**:
- On connection error → Retry 3 times with 2 min interval
- On no new files → Skip gracefully (expected)
- On API quota exceeded → Pause for 15 minutes, then retry

**Polling Schedule**:
```yaml
Interval: 15 minutes (adjustable based on backup frequency)
Time Zone: [Your timezone]
Active Hours: 24/7 (or business hours only if preferred)
```

---

### Module 2: Copy to Archive_Backups

**Module Type**: `Google Drive` → `Copy a File`

**Purpose**: Creates a copy in Archive_Backups folder for redundancy

**Configuration**:
```yaml
Connection: [Your Google Drive Connection]

Source File:
  File ID: {{1.file_id}}

Destination:
  Folder ID: [Archive_Backups Folder ID]
  
New File Name: {{1.file_name}}_backup_{{formatDate(now, "YYYYMMDD_HHmmss")}}
  Example: document.pdf_backup_20231204_153022.pdf

Options:
  - Convert to Google format: NO (keep original format)
  - Overwrite if exists: NO (keep all versions)
  - Share with same users: NO (different permissions)

Output to Store:
  - backup_file_id (New file ID)
  - backup_file_link (Web link)
  - backup_created_time (When backup was created)
```

**File Naming Strategy**:
- Preserves original filename
- Appends `_backup_` suffix
- Adds timestamp for version tracking
- Example: `tax_return_2023.pdf_backup_20231204_153022.pdf`

**Error Handling**:
- On copy failure → Retry 2 times
- On insufficient storage → Send alert to admin
- On permission denied → Log error and skip (don't block other files)
- On success → Continue to Module 3

**Advanced: Organize by Date (Optional)**
If you want to organize backups by date:
```yaml
# Add a step before copying:
Set Variables:
  - year_folder: {{formatDate(1.created_time, "YYYY")}}
  - month_folder: {{formatDate(1.created_time, "YYYY-MM")}}
  
# Then create/find folder structure:
Archive_Backups/
  └── 2023/
      └── 2023-12/
          └── [files here]

# Update destination to: {{created_year_month_folder_id}}
```

---

### Module 3: Log Backup Details to Notion

**Module Type**: `Notion` → `Create Database Item`

**Purpose**: Creates a detailed log entry in Notion Backup Log database

**Configuration**:
```yaml
Connection: [Your Notion Connection]
Database ID: [Your Backup Log Database ID]

Properties to Set:

# Title (required)
Name/Title: "{{1.file_name}} - Backup {{formatDate(now, 'YYYY-MM-DD')}}"

# Core Properties
Original File ID: {{1.file_id}} (Text property)
Backup File ID: {{2.backup_file_id}} (Text property)
File Name: {{1.file_name}} (Text property)
File Size: {{1.file_size}} bytes (Number property)
File Type: {{1.file_type}} (Text property)

# Hash & Verification
MD5 Hash: {{1.md5_checksum}} (Text property)
Hash Verified: TRUE (Checkbox - auto-set since we copied)

# Timestamps
Original Created: {{1.created_time}} (Date property)
Backup Created: {{2.backup_created_time}} (Date property)
Logged At: {{now}} (Date property)

# Links
Original Link: {{1.web_content_link}} (URL property)
Backup Link: {{2.backup_file_link}} (URL property)

# Metadata
Source: "Archive Folder" (Select property)
Backup Method: "AUTO_SYNC" (Select property)
Owner: {{1.owner_email}} (Email property)
Status: "completed" (Select property)

# Tags (Optional)
Tags: ["automated", "archive_backup", "{{formatDate(now, 'YYYY-MM')}}"]

# Notes
Notes: "Automated backup via VAULT_GUARDIAN_BACKUP_SYNC_v1.0"
```

**Database Schema** (Create in Notion first):
```
Backup Log Database Properties:
- Name (Title) - Auto-generated name
- Original File ID (Text)
- Backup File ID (Text)
- File Name (Text)
- File Size (Number)
- File Type (Text)
- MD5 Hash (Text)
- Hash Verified (Checkbox)
- Original Created (Date)
- Backup Created (Date)
- Logged At (Date)
- Original Link (URL)
- Backup Link (URL)
- Source (Select: Archive Folder, Manual Upload, Vault Repair)
- Backup Method (Select: AUTO_SYNC, MANUAL, AUTO_HEAL)
- Owner (Email)
- Status (Select: completed, failed, pending)
- Tags (Multi-select)
- Notes (Text)
```

**Error Handling**:
- On Notion API error → Retry 2 times
- On database not found → Alert admin and continue
- On property mismatch → Log warning and use defaults
- Store execution data for retry

---

### Module 4: Send Confirmation Notification

**Module Type**: `Slack` → `Create a Message` (Optional but Recommended)

**Purpose**: Sends confirmation to team that backup was created successfully

**Configuration**:
```yaml
Connection: [Your Slack Connection]
Channel: #vault-guardian-backups

Message Type: Simple text (or Block Kit for rich formatting)

Message Content:
---
✅ **Backup Synced Successfully**

**File**: `{{1.file_name}}`
**Size**: {{formatNumber(divide(1.file_size, 1048576), 2)}} MB
**Source**: Archive Folder
**Backup Location**: Archive_Backups

**Details**:
- Original: [View File]({{1.web_content_link}})
- Backup: [View Backup]({{2.backup_file_link}})
- Created: {{formatDate(1.created_time, "MMM DD, YYYY HH:mm")}}
- Hash: `{{1.md5_checksum}}`

**Status**: ✓ Backup logged to Notion
---

Send as: Regular message
Thread: No (creates individual messages)
```

**Alternative: Summary Digest (Reduce Noise)**
If you prefer daily/hourly summaries instead of per-file notifications:

```yaml
# Use Aggregator module before Slack
Module Type: Flow Control → Aggregator

Aggregate from: Module 1 (all files in this run)
Aggregate into: Single summary message

Summary Message:
---
📦 **Backup Sync Summary** - {{formatDate(now, "YYYY-MM-DD HH:mm")}}

**Files Backed Up**: {{length(aggregated_items)}}
**Total Size**: {{sum(aggregated_items.file_size) / 1048576}} MB

**Files**:
{{#each aggregated_items}}
  • {{file_name}} ({{formatBytes(file_size)}})
{{/each}}

**All backups logged to Notion ✓**
---
```

**Error Handling**:
- On Slack delivery failure → Log to IKE-BOT only (don't block)
- On rate limit → Queue for later delivery

---

## Scenario Settings

### Trigger & Scheduling
```yaml
Scenario Type: Scheduled
Schedule: Every 15 minutes (adjustable)
Time Zone: [Your timezone]

Active Hours: 
  Option 1: 24/7 (recommended)
  Option 2: Business hours only (9 AM - 6 PM)

Max consecutive runs: Unlimited
Max processing time: 120 seconds
```

### Advanced Settings
```yaml
Sequential Processing: Yes
  - Process files one at a time to avoid conflicts

Max Number of Cycles: 1
  - Complete all operations per file

Data Store: Enabled
  - Store last processed file timestamp
  - Avoid duplicate processing

Incomplete Executions: Allow storage
  - Resume on error

Execution History: 30 days
  - Keep longer history for backup auditing
```

### Data Store Configuration
Create a data store to track processed files:

```yaml
Data Store Name: vault_guardian_processed_files
Structure:
  - file_id (Text, Primary Key)
  - processed_at (Date)
  - backup_file_id (Text)
  - status (Text: completed, failed)

# Add after Module 1:
Check Data Store → If file_id exists → Skip
If new → Continue to Module 2
After Module 3 → Add to Data Store
```

---

## Error Recovery & Retries

### Retry Configuration
```yaml
Module 2 (Copy):
  - Max retries: 3
  - Interval: 2 minutes
  - Backoff: Exponential (2min, 4min, 8min)

Module 3 (Notion):
  - Max retries: 2  
  - Interval: 1 minute
  - Backoff: Linear

Module 4 (Slack):
  - Max retries: 1
  - Interval: 30 seconds
  - On final failure: Log only (don't block)
```

### Error Notification
Add global error handler:

```yaml
Trigger: Any module fails after retries
Action: Send alert

Slack Alert:
---
❌ **BACKUP SYNC FAILED**

**Scenario**: BACKUP_SYNC_v1.0
**File**: {{1.file_name}} (if available)
**Failed Module**: {{error.module_name}}
**Error**: {{error.message}}

**File Details**:
- File ID: {{1.file_id}}
- Size: {{1.file_size}} bytes
- Type: {{1.file_type}}

**Action Required**: Review Make.com logs
**Time**: {{formatDate(now, "YYYY-MM-DD HH:mm:ss")}}
---

Channel: #vault-guardian-errors
Priority: High
```

---

## Testing Checklist

Before activating:
- [ ] Module 1: Watch folder triggering correctly
- [ ] Module 2: Files copying to Archive_Backups
- [ ] Module 3: Notion entries being created
- [ ] Module 4: Slack notifications sending
- [ ] Data store preventing duplicates
- [ ] Error handlers working
- [ ] Test with various file types (.pdf, .docx, .xlsx, etc.)
- [ ] Test with large files (>100 MB)
- [ ] Test with rapid file additions (stress test)
- [ ] Verify folder permissions

---

## Deployment Steps

1. **Create Scenario**: New scenario in Make.com
2. **Name It**: `VAULT_GUARDIAN_BACKUP_SYNC_v1.0`
3. **Configure Modules**: Follow steps 1-4 above
4. **Add Error Handlers**: Global and per-module
5. **Create Data Store**: For duplicate prevention
6. **Test Run**: Use test files in Archive folder
7. **Review Results**: Check all 4 modules completed
8. **Activate**: Turn scenario ON
9. **Monitor**: First 24 hours closely

---

## Monitoring & Maintenance

### Daily Checks
- Review Slack notifications for successful backups
- Check for any error alerts
- Verify Notion log entries are accurate

### Weekly Checks
- Review backup count vs. expected
- Check storage usage in Archive_Backups
- Verify data store size (clean old entries if needed)

### Monthly Review
- Analyze backup frequency patterns
- Review file type distribution
- Check Make.com operations usage
- Verify backup retention policy compliance
- Test restore from Archive_Backups

### Cleanup Schedule
Recommended data store cleanup:
```yaml
Separate Scenario: vault_guardian_cleanup
Schedule: Daily at 2 AM
Action: Remove entries >90 days from data store
Reason: Keep data store lean
```

---

## Integration with AUTO_HEAL

This scenario works in tandem with AUTO_HEAL:

```
Archive Folder (Source)
    ↓
    ├─→ BACKUP_SYNC ─→ Archive_Backups (Redundant Copy)
    │                        ↓
    └─→ Trust Vault ←─ AUTO_HEAL (Restores from Archive_Backups)
                              ↓
                        Notion Ledger (Tracks health)
```

**Key Points**:
- BACKUP_SYNC ensures Archive_Backups stays current
- AUTO_HEAL pulls from Archive_Backups when needed
- Notion logs both sync and heal operations
- Together they provide automated vault protection

---

## Advanced Features (Optional)

### Feature 1: Intelligent File Filtering
Add filtering before Module 2:

```yaml
Module 1.5: Router - File Type Filter
Route 1 (Documents):
  - Condition: file_type contains "pdf", "doc", "xls"
  - Destination: Module 2 (full backup)
  
Route 2 (Images):
  - Condition: file_type contains "jpg", "png"
  - Destination: Module 2 (compress first - optional)
  
Route 3 (Exclude):
  - Condition: file_name contains ".tmp", ".cache"
  - Destination: Skip (no backup needed)
```

### Feature 2: Backup Verification
Add after Module 2:

```yaml
Module 2.5: Verify Backup Integrity
Type: Google Drive → Get File Metadata

File ID: {{2.backup_file_id}}
Fields: md5Checksum

Comparison:
  If backup_md5 ≠ original_md5 → Alert + Retry
  If backup_md5 = original_md5 → Continue
```

### Feature 3: Automatic Folder Organization
Organize backups by date automatically:

```yaml
Module 1.5: Create/Find Date Folders
Type: Google Drive → Search/Create Folder

Parent: Archive_Backups folder
Folder Name: {{formatDate(now, "YYYY/MM")}}
  - Creates: 2023/12/ structure

If not exists → Create
If exists → Use existing

Update Module 2 destination to: {{date_folder_id}}
```

---

## Troubleshooting

### Issue: Scenario Not Triggering
**Solution**:
- Check polling schedule is active
- Verify folder ID is correct
- Test folder permissions
- Check Make.com operation quota

### Issue: Files Not Copying
**Solution**:
- Verify Archive_Backups folder permissions
- Check service account has Editor access
- Test manually copying a file
- Check storage quota hasn't been exceeded

### Issue: Duplicate Backups Created
**Solution**:
- Verify data store is enabled and working
- Check file_id is being stored correctly
- Review duplicate prevention logic
- Clear data store and rebuild if corrupted

### Issue: Notion Entries Missing Properties
**Solution**:
- Verify database schema matches configuration
- Check property names match exactly (case-sensitive)
- Test creating manual entry in Notion
- Update module configuration to match schema

### Issue: High Make.com Operations Usage
**Solution**:
- Increase polling interval (15 min → 30 min)
- Add file size limits to reduce processing
- Use aggregator for batch operations
- Consider upgrading Make.com plan

---

## Performance Optimization

### For High-Volume Backups
```yaml
Optimization 1: Batch Processing
  - Use aggregator to process 10+ files at once
  - Single Notion entry for batch
  - Single Slack summary message

Optimization 2: Selective Syncing
  - Filter by file size (>1 MB only)
  - Filter by file type (documents only)
  - Exclude temporary/cache files

Optimization 3: Deferred Slack Notifications
  - Only send on errors
  - Or hourly summary instead of per-file
  - Reduces API calls significantly
```

### For Low-Volume Backups
```yaml
Optimization: Reduce Polling Frequency
  - Change from 15 min to 1 hour
  - Saves Make.com operations
  - Still provides timely backups
```

---

## Success Metrics

Track these KPIs:
- **Backup Success Rate**: Target >99%
- **Average Sync Time**: Target <30 seconds per file
- **Storage Growth**: Monitor monthly increase
- **Error Rate**: Target <1%
- **Make.com Operations**: Track against quota

---

## Next Steps

After completing BACKUP_SYNC configuration:
1. Review [Test Plan](./04-TEST-PLAN.md) for both scenarios
2. Complete [Readiness Checklist](./05-READINESS-CHECKLIST.md)
3. Review [Phase Four Planning](./06-PHASE-FOUR-PLANNING.md) for future enhancements

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-04  
**Scenario Version**: VAULT_GUARDIAN_BACKUP_SYNC_v1.0  
**Maintained By**: IKE-BOT Infrastructure Team
