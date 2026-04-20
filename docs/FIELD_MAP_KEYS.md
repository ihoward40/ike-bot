# FieldMap.json Configuration Keys Reference

**Purpose:** This document lists all configuration keys that are synced from `FieldMap.json` to the Notion System Config database.

**Sync Frequency:** Every 15 minutes (via Make Scenario D: CONFIG_SYNC_v1)

---

## Overview

The System Config database in Notion mirrors the structure of `FieldMap.json`, flattening nested JSON into dot-notation keys. This provides:

1. **Read-only dashboard visibility** - View current config without opening Drive
2. **Audit trail** - Track when config values were last updated
3. **Single source of truth** - FieldMap.json remains authoritative

---

## Configuration Keys Table

### BinderOutbox Section

| Key | Type | Example Value | Purpose |
|-----|------|---------------|---------|
| `binderOutbox.provider` | String | `"gdrive"` | Storage provider identifier |
| `binderOutbox.outboxFolderId` | String | `"1a2B3c4D5e6F7g8H9i0J"` | Google Drive folder ID for new artifacts |
| `binderOutbox.archiveFolderId` | String | `"2b3C4d5E6f7G8h9I0j1K"` | Google Drive folder ID for archived artifacts |
| `binderOutbox.errorsFolderId` | String | `"3c4D5e6F7g8H9i0J1k2L"` | Google Drive folder ID for failed artifacts |
| `binderOutbox.minPdfBytes` | Number | `50000` | Minimum PDF file size in bytes (validation threshold) |
| `binderOutbox.shaMode` | String | `"required"` | SHA256 requirement: "required", "optional", or "disabled" |
| `binderOutbox.rehashOutbox` | Boolean | `true` | Whether to recalculate SHA256 if missing during ingestion |
| `binderOutbox.readyPayload` | String | `"json"` | Ready file format: "json" or "empty" |

### BinderJobs Section

| Key | Type | Example Value | Purpose |
|-----|------|---------------|---------|
| `binderJobs.inFolderId` | String | `"4d5E6f7G8h9I0j1K2l3M"` | Job requests folder (Make → PowerShell) |
| `binderJobs.outFolderId` | String | `"5e6F7g8H9i0J1k2L3m4N"` | Job results folder (PowerShell → Make) |
| `binderJobs.archiveFolderId` | String | `"6f7G8h9I0j1K2l3M4n5O"` | Completed jobs archive folder |

### Notion Section

| Key | Type | Example Value | Purpose |
|-----|------|---------------|---------|
| `notion.caseDbId` | String | `"a1b2c3d4e5f6"` | Cases database ID (32-char hex) |
| `notion.evidenceDbId` | String | `"b2c3d4e5f6a1"` | Evidence (logged artifacts) database ID |
| `notion.errorDbId` | String | `"c3d4e5f6a1b2"` | Binder Errors database ID |
| `notion.opsQueueDbId` | String | `"d4e5f6a1b2c3"` | Ops Queue (button dispatch) database ID |
| `notion.systemConfigDbId` | String | `"e5f6a1b2c3d4"` | System Config (this database!) ID |

### Routing Section

| Key | Type | Example Value | Purpose |
|-----|------|---------------|---------|
| `routing.ActionType.BINDER_COMPLETE` | String | `"route_binder_log"` | Handler for successful binder completion |
| `routing.ActionType.BINDER_ERROR` | String | `"route_error"` | Handler for binder errors |
| `routing.ActionType.BINDER_REINGEST` | String | `"route_reingest"` | Handler for re-ingest operations |
| `routing.ActionType.BINDER_FORCE_ARCHIVE` | String | `"route_force_archive"` | Handler for force archive operations |
| `routing.ActionType.BINDER_PUBLISH_REQUEST` | String | `"route_publish_request"` | Handler for publish request jobs |
| `routing.ActionType.BINDER_MARK_RESOLVED` | String | `"route_mark_resolved"` | Handler for marking errors resolved |

---

## Adding New Configuration Keys

To add a new configuration key to the system:

### Step 1: Update FieldMap.json

Add the new key to the appropriate section:

```json
{
  "binderOutbox": {
    "outboxFolderId": "...",
    "newSetting": "newValue"
  }
}
```

### Step 2: Wait for Auto-Sync

The CONFIG_SYNC_v1 Make scenario runs every 15 minutes and will automatically:
1. Detect the new key
2. Create a new System Config record
3. Set the value and type

**Manual Trigger (Optional):**
If you need immediate sync, manually trigger the CONFIG_SYNC_v1 scenario in Make.

### Step 3: Verify in Notion

1. Open the System Config database
2. Search for your new key: `binderOutbox.newSetting`
3. Verify the value and type are correct
4. Check "Updated At" timestamp

### Step 4: Update Make Scenarios (If Needed)

If the new key is used for validation or routing:
1. Update relevant Make modules to reference the new key
2. Add filter expressions if needed
3. Test with the new configuration value

---

## Dashboard Usage Tips

### Viewing Current Config

**Quick View:**
1. Open "BinderOutbox Ops — Command Center" dashboard
2. Scroll to "System Config" section (add linked view if missing)
3. Filter by `Category` to group related keys

**Category Filter Examples:**
- `binderOutbox` - All outbox-related settings
- `binderJobs` - Job folder IDs
- `notion` - Database IDs
- `routing` - Action routing handlers

### Searching for Specific Keys

**Example Searches:**
- Search: `outbox` → Finds all keys containing "outbox"
- Search: `DbId` → Finds all Notion database IDs
- Filter: `Type = Number` → Shows all numeric settings

### Understanding Updates

**Updated At Column:**
- Shows when each key was last synced
- If all keys show same timestamp → Full sync occurred
- If timestamps vary → Partial updates (unusual, investigate)

**Source Column:**
- `FieldMap.json` → Synced from Drive (normal)
- `Manual Override` → Modified by hand (avoid this!)

---

## Example System Config Dashboard View

### View Configuration

**Database:** System Config  
**View Name:** Config by Category  
**View Type:** Table

**Properties to Show:**
1. Key (Title) - Sortable, Searchable
2. Value - Wrapped text
3. Type - Select filter
4. Category - Formula (auto-calculated)
5. Updated At - Date, sorted descending
6. Source - Select

**Grouping:**
- Group by: `Category`
- Collapsed by default

**Filters:**
- Source = "FieldMap.json" (hide manual overrides)

**Result:**
```
▼ binderOutbox (8 keys)
  binderOutbox.provider             = "gdrive"        [String]  2026-01-24
  binderOutbox.outboxFolderId       = "1a2B3c..."     [String]  2026-01-24
  binderOutbox.archiveFolderId      = "2b3C4d..."     [String]  2026-01-24
  ...

▼ binderJobs (3 keys)
  binderJobs.inFolderId             = "4d5E6f..."     [String]  2026-01-24
  binderJobs.outFolderId            = "5e6F7g..."     [String]  2026-01-24
  ...

▼ notion (5 keys)
  notion.caseDbId                   = "a1b2c3..."     [String]  2026-01-24
  notion.evidenceDbId               = "b2c3d4..."     [String]  2026-01-24
  ...

▼ routing (6 keys)
  routing.ActionType.BINDER_COMPLETE = "route_bin..."  [String]  2026-01-24
  ...
```

---

## Troubleshooting

### Problem: Keys Not Syncing

**Symptoms:**
- New keys in FieldMap.json don't appear in System Config
- Updated values don't refresh

**Solutions:**
1. Check CONFIG_SYNC_v1 scenario status in Make
2. Verify FieldMap.json is valid JSON (use JSON validator)
3. Check Make execution history for errors
4. Manually trigger CONFIG_SYNC_v1 to force immediate sync
5. Verify Google Drive permissions for Make connection

---

### Problem: Wrong Values in System Config

**Symptoms:**
- Values don't match FieldMap.json
- Type detection is incorrect

**Solutions:**
1. Check "Updated At" timestamp - if old, sync may not have run
2. Verify FieldMap.json on Drive is latest version
3. Check for manual overrides (Source = "Manual Override")
4. Delete incorrect record and wait for next sync to recreate
5. Force sync via manual trigger

---

### Problem: Duplicate Keys

**Symptoms:**
- Same key appears multiple times in System Config

**Solutions:**
1. This should NOT happen (scenario has dedup logic)
2. Manually delete duplicates, keeping most recent
3. Check Make scenario Module 7-8 (duplicate detection)
4. Report as bug if recurring

---

## Best Practices

### DO ✅

- **Always edit FieldMap.json** - Never edit System Config directly
- **Use version control** - Keep FieldMap.json in Git or Drive history
- **Document changes** - Add comments in FieldMap.json (if using JSON5 or JSONC)
- **Test after changes** - Verify sync worked and values are correct
- **Review regularly** - Check System Config monthly for drift

### DON'T ❌

- **Never manually edit System Config** - Changes will be overwritten
- **Don't add random keys** - Keep FieldMap.json clean and documented
- **Don't use sensitive data** - No passwords or API keys in FieldMap.json
- **Don't delete System Config DB** - Breaks CONFIG_SYNC scenario
- **Don't change sync frequency** - 15 min is optimal for freshness vs. API usage

---

## Related Documentation

- **[Complete System Spec](./BINDER_SYSTEM_SPEC.md)** - Full architecture and implementation guide
- **[Make Scenario D Spec](./BINDER_SYSTEM_SPEC.md#scenario-d-config_sync_v1)** - CONFIG_SYNC module details
- **[Implementation Phase 4](./BINDER_SYSTEM_SPEC.md#phase-4-config-sync-est-15-min)** - Config sync setup guide

---

## Appendix: Full FieldMap.json Example

```json
{
  "schema": "fieldmap.v1",
  "binderOutbox": {
    "provider": "gdrive",
    "outboxFolderId": "1a2B3c4D5e6F7g8H9i0J",
    "archiveFolderId": "2b3C4d5E6f7G8h9I0j1K",
    "errorsFolderId": "3c4D5e6F7g8H9i0J1k2L",
    "minPdfBytes": 50000,
    "shaMode": "required",
    "rehashOutbox": true,
    "readyPayload": "json"
  },
  "binderJobs": {
    "inFolderId": "4d5E6f7G8h9I0j1K2l3M",
    "outFolderId": "5e6F7g8H9i0J1k2L3m4N",
    "archiveFolderId": "6f7G8h9I0j1K2l3M4n5O"
  },
  "notion": {
    "caseDbId": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "evidenceDbId": "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7",
    "errorDbId": "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
    "opsQueueDbId": "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
    "systemConfigDbId": "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
  },
  "routing": {
    "ActionType": {
      "BINDER_COMPLETE": "route_binder_log",
      "BINDER_ERROR": "route_error",
      "BINDER_REINGEST": "route_reingest",
      "BINDER_FORCE_ARCHIVE": "route_force_archive",
      "BINDER_PUBLISH_REQUEST": "route_publish_request",
      "BINDER_MARK_RESOLVED": "route_mark_resolved"
    }
  }
}
```

---

**Last Updated:** January 2026  
**Maintained By:** BinderOutbox System Team
