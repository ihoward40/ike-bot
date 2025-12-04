# Vault Guardian Make.com Scenario Blueprints

## Overview

This directory contains ready-to-deploy JSON blueprints for all Vault Guardian Make.com scenarios. These can be imported directly into Make.com to quickly set up the automation system.

## Available Blueprints

### 1. AUTO_HEAL_v1.0_blueprint.json
**Purpose**: Automated corruption detection and restoration  
**Modules**: 11 modules with 2 routers  
**Complexity**: Advanced

**Features**:
- Watches Notion Vault Ledger for corrupted files
- Searches Archive_Backups for backup copies
- Verifies file integrity with hash comparison
- Automatically restores from backup or escalates
- Updates Notion and sends Slack notifications
- Logs false alarms to IKE-BOT

**Import Steps**:
1. Open Make.com dashboard
2. Click "Scenarios" → "..." → "Import Blueprint"
3. Select `AUTO_HEAL_v1.0_blueprint.json`
4. Replace placeholders:
   - `YOUR_VAULT_LEDGER_DB_ID`: Your Notion Vault Ledger database ID
   - `YOUR_ARCHIVE_BACKUPS_FOLDER_ID`: Your Google Drive Archive_Backups folder ID
   - `YOUR_TRUST_VAULT_FOLDER_ID`: Your Google Drive Trust Vault folder ID
   - `YOUR_IKE_BOT_URL`: Your IKE-BOT API endpoint
5. Configure connections (Notion, Google Drive, Slack, HTTP)
6. Test with sample data
7. Activate

---

### 2. BACKUP_SYNC_v1.0_blueprint.json
**Purpose**: Automated backup synchronization  
**Modules**: 4 modules  
**Complexity**: Simple

**Features**:
- Watches Archive folder for new files
- Copies files to Archive_Backups with timestamp
- Creates detailed log entry in Notion
- Sends Slack confirmation notification

**Import Steps**:
1. Open Make.com dashboard
2. Click "Scenarios" → "..." → "Import Blueprint"
3. Select `BACKUP_SYNC_v1.0_blueprint.json`
4. Replace placeholders:
   - `YOUR_ARCHIVE_FOLDER_ID`: Your Google Drive Archive folder ID
   - `YOUR_ARCHIVE_BACKUPS_FOLDER_ID`: Your Google Drive Archive_Backups folder ID
   - `YOUR_BACKUP_LOG_DB_ID`: Your Notion Backup Log database ID
5. Configure connections (Google Drive, Notion, Slack)
6. Test with sample file
7. Activate with 15-minute schedule

---

### 3. CHECKSUM_WATCHER_v1.1_blueprint.json
**Purpose**: Proactive integrity monitoring  
**Modules**: 8 modules with router  
**Complexity**: Intermediate

**Features**:
- Monitors Notion databases for data integrity
- Calculates and validates SHA-256 checksums
- Detects anomalies and alerts via Slack
- Auto-generates checksums for new records
- Logs all validation events to Google Sheets

**Location**: Embedded in [07-CHECKSUM-WATCHER-IMPLEMENTATION.md](../07-CHECKSUM-WATCHER-IMPLEMENTATION.md#complete-scenario-blueprint-makecom-import)

**Import Steps**:
1. Copy JSON from guide 07
2. Save as `CHECKSUM_WATCHER_v1.1_blueprint.json`
3. Import to Make.com
4. Replace placeholders:
   - `YOUR_NOTION_TEMPLATE_DB_ID`: Your Notion Template_Mappings database ID
   - `YOUR_AUDIT_LOG_SHEET_ID`: Your Google Sheets audit log ID
   - `<@USER_ID_REPLACE>`: Your Slack user ID(s)
5. Configure connections
6. Test with sample records
7. Activate with 15-minute schedule

---

## Placeholder Reference Guide

### Google Drive IDs
To find folder IDs:
1. Open folder in Google Drive
2. Look at URL: `https://drive.google.com/drive/folders/[FOLDER_ID]`
3. Copy the `FOLDER_ID` portion

### Notion Database IDs
To find database IDs:
1. Open database in Notion
2. Click "..." → "Copy link"
3. Extract ID from URL: `https://notion.so/[DATABASE_ID]?v=...`
4. Copy the `DATABASE_ID` portion (32 character hex string)

### Slack User IDs
To find user IDs:
1. Click on user profile in Slack
2. Click "..." → "Copy member ID"
3. Format as `<@USER_ID>` in scenario

### Google Sheets IDs
To find spreadsheet IDs:
1. Open sheet in browser
2. Look at URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
3. Copy the `SPREADSHEET_ID` portion

---

## Connection Setup

Before importing, ensure you have these connections configured in Make.com:

### Required Connections
- [ ] **Notion**: Connect your Notion workspace
- [ ] **Google Drive**: Connect your Google account with Drive access
- [ ] **Slack**: Connect your Slack workspace (requires bot token)
- [ ] **HTTP**: For IKE-BOT API calls (no authentication needed if public endpoint)

### Connection Permissions

#### Notion
- Read/Write access to specified databases
- Do NOT grant full workspace access

#### Google Drive
- Read access to Archive folder
- Write access to Archive_Backups folder
- Read/Write access to Trust Vault (for AUTO_HEAL)

#### Slack
- Post messages to specific channels
- Do NOT grant read message history permission

---

## Testing After Import

### Quick Test Checklist

#### AUTO_HEAL Test
1. Create test Notion entry with Status = "corrupted"
2. Ensure backup exists in Archive_Backups
3. Run scenario once
4. Verify file restored and Notion updated

#### BACKUP_SYNC Test
1. Upload test file to Archive folder
2. Wait for scheduled run (or trigger manually)
3. Verify backup created in Archive_Backups
4. Check Notion log entry created

#### CHECKSUM_WATCHER Test
1. Create test Notion entry with checksum
2. Run scenario once
3. Verify Google Sheets log entry
4. Check Notion validation status updated

---

## Troubleshooting Imports

### Issue: Import Fails
**Solution**: 
- Ensure JSON file is valid (no truncation)
- Check Make.com plan supports blueprint imports
- Try importing in smaller sections

### Issue: Connections Not Available
**Solution**:
- Set up connections in Make.com first
- Authorize each service
- Refresh connection list during import

### Issue: Modules Don't Match
**Solution**:
- Make.com API may have changed
- Update module versions manually
- Refer to detailed guides for current configs

---

## Version History

| Blueprint | Version | Date | Changes |
|-----------|---------|------|---------|
| AUTO_HEAL | v1.0 | 2025-12-04 | Initial release |
| BACKUP_SYNC | v1.0 | 2025-12-04 | Initial release |
| CHECKSUM_WATCHER | v1.1 | 2025-12-04 | Initial release |

---

## Support

For detailed configuration guides, see:
- [AUTO_HEAL Guide](../02-VAULT-GUARDIAN-AUTO-HEAL.md)
- [BACKUP_SYNC Guide](../03-VAULT-GUARDIAN-BACKUP-SYNC.md)
- [CHECKSUM_WATCHER Guide](../07-CHECKSUM-WATCHER-IMPLEMENTATION.md)

For issues or questions:
- Check [Implementation Details](../09-IMPLEMENTATION-DETAILS.md)
- Review [Test Scenarios](../08-TEST-SCENARIOS-EXAMPLES.md)
- Consult [Troubleshooting Guide](../09-IMPLEMENTATION-DETAILS.md#troubleshooting)

---

**Last Updated**: 2025-12-04  
**Maintained By**: IKE-BOT Infrastructure Team
