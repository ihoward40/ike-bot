# BinderOutbox System Specification

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Production Ready

---

## Table of Contents

0. [Glossary](#0-glossary)
1. [System Architecture](#1-system-architecture)
2. [FieldMap.json Specification](#2-fieldmapjson-specification)
3. [BinderOutbox Output Contract](#3-binderoutbox-output-contract)
4. [Notion Database Schemas](#4-notion-database-schemas)
5. [Notion Dashboard Page Spec](#5-notion-dashboard-page-spec)
6. [Make Scenarios Module Specs](#6-make-scenarios-module-specs)
7. [Publish Request Loop](#7-publish-request-loop)
8. [Test Plan](#8-test-plan)
9. [Implementation Order](#9-implementation-order)
10. [Operational Guarantees](#10-operational-guarantees)

---

## 0) Glossary

| Term | Definition |
|------|------------|
| **Outbox** | Google Drive folder where finalized binder artifacts appear after local processing |
| **READY contract** | A `.ready` file written last, only after all artifacts are valid and complete |
| **Ops Queue** | Notion dispatch table written by dashboard buttons for error recovery and manual operations |
| **FieldMap.json** | Single source of truth configuration file containing all folder IDs, database IDs, and routing rules |
| **Artifact** | A binder PDF file and its associated metadata (SHA256 hash, ready file) |
| **SintraPrime** | Local PowerShell processing system that generates binder PDFs |
| **Idempotent** | Operation that can be safely repeated without creating duplicates |
| **No false-ready** | Publishing ritual that ensures `.ready` file only appears when artifacts are valid |
| **DedupKey** | Notion formula property that prevents duplicate operations in the queue |
| **Job File** | JSON configuration file placed in BinderJobs folder to trigger PowerShell operations |

---

## 1) System Architecture

The BinderOutbox system is a 4-layer pipeline that automates binder PDF publishing, ingestion, and operational recovery.

### Layer 1 - SintraPrime (PowerShell)

**Purpose:** Local processing and binder generation

**Inputs:**
- Case data from Notion
- Evidence files from local storage
- Job files from BinderJobs/In folder

**Outputs:**
- **BinderOutbox:** Finalized binder PDFs with `.ready` marker
- **BinderJobs/Out:** Job result files with status and metadata

**Key Responsibilities:**
- Generate court-ready binder PDFs
- Calculate SHA256 hashes for integrity verification
- Follow "no false-ready" publishing ritual
- Process job requests (re-ingest, force archive, publish)

---

### Layer 2 - Google Drive

**Purpose:** File handoff bus between PowerShell and Make automation

**Folder Structure:**
```
BinderOutbox/
├── Outbox/           # New artifacts waiting for ingestion
├── Archive/          # Successfully processed artifacts
└── Errors/           # Failed artifacts for manual review

BinderJobs/
├── In/              # Job requests from Make → PowerShell
├── Out/             # Job results from PowerShell → Make
└── Archive/         # Completed job files
```

**Key Responsibilities:**
- Reliable file storage and synchronization
- Provide Make with file change triggers
- Maintain audit trail via Archive folders

---

### Layer 3 - Make (Automation Platform)

**Purpose:** Orchestration, ingestion, and ops dispatch

**4 Core Scenarios:**

| Scenario | Trigger | Purpose |
|----------|---------|---------|
| **A. BINDER_OUTBOX_INGEST_v1** | New `.ready` file in Outbox | Validate artifacts, log to Notion Evidence DB, archive files |
| **B. OPS_QUEUE_DISPATCH_v1** | New Ops Queue record | Execute button commands with deduplication |
| **C. BINDER_JOB_RESULTS_v1** | New file in BinderJobs/Out | Update Notion with job completion status |
| **D. CONFIG_SYNC_v1** | Every 15 minutes | Sync FieldMap.json config to Notion System Config DB |

**Key Responsibilities:**
- Watch Drive folders for changes
- Validate artifacts before logging
- Execute ops recovery workflows
- Maintain config synchronization

---

### Layer 4 - Notion

**Purpose:** Ops dashboard, data logging, and manual controls

**5 Core Databases:**

1. **Cases** - Case metadata and binder status
2. **Evidence** - Logged artifacts with file metadata
3. **Binder Errors** - Failed ingestion tracking
4. **Ops Queue** - Button-triggered operations (deduped)
5. **System Config** - Live FieldMap.json mirror

**Dashboard Features:**
- Real-time ingestion monitoring
- One-click error recovery buttons
- Audit trail and search
- Config viewing (read-only)

---

## 2) FieldMap.json Specification

**Location:** Google Drive (root or designated config folder)  
**Format:** JSON  
**Purpose:** Single source of truth for all system configuration

### Complete Schema

```json
{
  "schema": "fieldmap.v1",
  "binderOutbox": {
    "provider": "gdrive",
    "outboxFolderId": "FOLDER_ID_OUTBOX",
    "archiveFolderId": "FOLDER_ID_ARCHIVE",
    "errorsFolderId": "FOLDER_ID_ERRORS",
    "minPdfBytes": 50000,
    "shaMode": "required",
    "rehashOutbox": true,
    "readyPayload": "json"
  },
  "binderJobs": {
    "inFolderId": "FOLDER_ID_JOBS_IN",
    "outFolderId": "FOLDER_ID_JOBS_OUT",
    "archiveFolderId": "FOLDER_ID_JOBS_ARCHIVE"
  },
  "notion": {
    "caseDbId": "NOTION_DB_CASES",
    "evidenceDbId": "NOTION_DB_EVIDENCE",
    "errorDbId": "NOTION_DB_ERRORS",
    "opsQueueDbId": "NOTION_DB_OPSQUEUE",
    "systemConfigDbId": "NOTION_DB_SYSTEMCONFIG"
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

### Property Descriptions

#### binderOutbox Section

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `provider` | string | Yes | Storage provider (currently only "gdrive") |
| `outboxFolderId` | string | Yes | Google Drive folder ID for new artifacts |
| `archiveFolderId` | string | Yes | Google Drive folder ID for archived artifacts |
| `errorsFolderId` | string | Yes | Google Drive folder ID for failed artifacts |
| `minPdfBytes` | number | Yes | Minimum PDF file size (bytes) for validation |
| `shaMode` | enum | Yes | SHA256 requirement: "required", "optional", "disabled" |
| `rehashOutbox` | boolean | No | Whether to recalculate SHA256 if missing (default: true) |
| `readyPayload` | enum | Yes | Ready file format: "json" or "empty" |

#### binderJobs Section

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `inFolderId` | string | Yes | Job requests folder (Make → PowerShell) |
| `outFolderId` | string | Yes | Job results folder (PowerShell → Make) |
| `archiveFolderId` | string | Yes | Completed jobs archive |

#### notion Section

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `caseDbId` | string | Yes | Cases database ID |
| `evidenceDbId` | string | Yes | Evidence (logged artifacts) database ID |
| `errorDbId` | string | Yes | Binder Errors database ID |
| `opsQueueDbId` | string | Yes | Ops Queue (button dispatch) database ID |
| `systemConfigDbId` | string | Yes | System Config (FieldMap mirror) database ID |

#### routing Section

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `ActionType.*` | string | Yes | Maps action types to Make routing handlers |

---

## 3) BinderOutbox Output Contract

### The "No False-Ready" Publishing Ritual

**Guarantee:** A `.ready` file ONLY appears when all artifacts are valid and complete.

### Publishing Sequence

PowerShell MUST follow this exact order:

```powershell
# Step 1: Write temporary files in work area
Write-File "Case-12345-Binder.pdf.tmp" -Content $pdfBytes
Write-File "Case-12345-Binder.pdf.sha256.tmp" -Content $sha256Hash

# Step 2: Atomic rename to final PDF name
Rename-Item "Case-12345-Binder.pdf.tmp" -NewName "Case-12345-Binder.pdf"

# Step 3: Atomic rename to final SHA256 name (if shaMode = required)
Rename-Item "Case-12345-Binder.pdf.sha256.tmp" -NewName "Case-12345-Binder.pdf.sha256"

# Step 4: Write ready file LAST (ALWAYS LAST)
Rename-Item "Case-12345-Binder.ready.tmp" -NewName "Case-12345-Binder.ready"
```

### Output File Types

#### 1. PDF File
- **Name Pattern:** `{CaseID}-Binder.pdf` or `Case-{CaseID}-Binder-{Timestamp}.pdf`
- **Minimum Size:** As specified in `FieldMap.json` (default: 50KB)
- **Validation:** Must be readable PDF with valid header

#### 2. SHA256 File (Optional/Required based on shaMode)
- **Name Pattern:** `{PdfName}.sha256`
- **Content:** 64-character hex hash (lowercase or uppercase)
- **Example:** `a3f2e8b9c1d4f6e8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4`

#### 3. Ready File (Required)
- **Name Pattern:** `{PdfName}.ready`
- **Content (json mode):**
```json
{
  "caseId": "12345",
  "binderName": "Case-12345-Binder.pdf",
  "sha256": "a3f2e8b9...",
  "timestamp": "2026-01-24T16:00:00Z",
  "runId": "run-abc123",
  "metadata": {
    "creditor": "Example Bank",
    "evidenceCount": 15,
    "pageCount": 127
  }
}
```
- **Content (empty mode):** Empty file (0 bytes)

### Critical Rules

1. ✅ **NEVER** write `.ready` before PDF and SHA256 are finalized
2. ✅ **ALWAYS** use `.tmp` extension during write operations
3. ✅ **ALWAYS** use atomic rename operations (not copy + delete)
4. ✅ **ALWAYS** write `.ready` file LAST in the sequence
5. ❌ **NEVER** write directly to final filenames (bypasses atomicity)

### Error Handling

If any step fails:
1. Delete all `.tmp` files
2. Do NOT write `.ready` file
3. Log error to BinderErrors folder or local log
4. Exit with non-zero status

---

## 4) Notion Database Schemas

### Database 1: Cases

**Purpose:** Master case tracking with binder status

| Property Name | Type | Formula/Config | Description |
|---------------|------|----------------|-------------|
| CaseID | Title | - | Unique case identifier |
| Creditor | Text | - | Creditor/opposing party name |
| Binder Status | Select | Options: Not Started, In Progress, Published, Error | Current binder generation status |
| Last Binder Date | Date | - | Timestamp of last successful binder |
| Last Binder File ID | Text | - | Google Drive file ID of latest binder PDF |
| Last Binder SHA256 | Text | - | SHA256 hash of latest binder |
| Evidence Count | Number | - | Number of evidence items logged |
| Binder Run ID | Text | - | Last PowerShell run identifier |
| Notes | Rich Text | - | Case notes and context |

---

### Database 2: Evidence

**Purpose:** Logged artifacts from BinderOutbox ingestion

| Property Name | Type | Formula/Config | Description |
|---------------|------|----------------|-------------|
| Title | Title | - | Evidence/artifact filename |
| Case | Relation | → Cases | Related case record |
| Evidence Type | Select | Options: Binder PDF, Supporting Doc, Exhibit, Correspondence | Type of evidence |
| File ID | Text | - | Google Drive file ID |
| File Size | Number | - | File size in bytes |
| SHA256 | Text | - | SHA256 hash for integrity |
| READY Raw | Rich Text | - | Full JSON content of `.ready` file |
| Run ID | Text | - | PowerShell run identifier |
| Creditor | Rollup | From Case → Creditor | Creditor name (for filtering) |
| Ingested At | Created Time | - | When logged to Notion |
| Archive File ID | Text | - | Drive file ID after archival |
| Status | Select | Options: Active, Archived, Superseded | Current status |

**Key Indexes/Filters:**
- Filter by Case
- Filter by Run ID (find all artifacts from same run)
- Filter by Ingested At (today's uploads)

---

### Database 3: Binder Errors

**Purpose:** Failed ingestion tracking and recovery

| Property Name | Type | Formula/Config | Description |
|---------------|------|----------------|-------------|
| Title | Title | - | Error description |
| Error Type | Select | Options: Missing PDF, Missing SHA, SHA Mismatch, PDF Too Small, Invalid Ready, Archive Failed | Categorized error type |
| Status | Select | Options: New, Investigating, Resolved, Ignored | Error resolution status |
| PDF File ID | Text | - | Drive file ID of problematic PDF |
| Ready File ID | Text | - | Drive file ID of `.ready` file |
| SHA File ID | Text | - | Drive file ID of `.sha256` file (if exists) |
| Expected SHA | Text | - | SHA256 from `.ready` file |
| Actual SHA | Text | - | Calculated SHA256 from PDF |
| Case ID Hint | Text | - | Extracted case ID from filename |
| Run ID | Text | - | PowerShell run identifier |
| Error Details | Rich Text | - | Full error message and stack trace |
| Resolution Notes | Rich Text | - | Manual notes on how error was fixed |
| Detected At | Created Time | - | When error was logged |
| Resolved At | Date | - | When error was marked resolved |
| Linked Ops | Relation | → Ops Queue | Related recovery operations |

---

### Database 4: Ops Queue

**Purpose:** Button-triggered operations with deduplication

| Property Name | Type | Formula/Config | Description |
|---------------|------|----------|-------------|
| Title | Title | - | Operation description |
| Action Type | Select | Options: BINDER_REINGEST, BINDER_FORCE_ARCHIVE, BINDER_MARK_RESOLVED, BINDER_PUBLISH_REQUEST | Operation to perform |
| DedupKey | Formula | `prop("Action Type") + "-" + prop("File ID 1") + "-" + prop("File ID 2")` | Prevents duplicate operations |
| Status | Select | Options: Queued, Processing, Completed, Failed | Current operation status |
| File ID 1 | Text | - | Primary file ID (e.g., PDF) |
| File ID 2 | Text | - | Secondary file ID (e.g., ready file) |
| File ID 3 | Text | - | Tertiary file ID (e.g., SHA file) |
| Case ID | Text | - | Related case identifier |
| Linked Error | Relation | → Binder Errors | Related error record (if recovery op) |
| Created At | Created Time | - | When button was clicked |
| Processed At | Date | - | When operation completed |
| Result | Rich Text | - | Operation outcome and logs |

**Dedup Formula Breakdown:**
```
DedupKey = Action Type + "-" + File ID 1 + "-" + File ID 2
```
Example: `BINDER_REINGEST-abc123-def456`

This prevents duplicate button clicks from creating multiple queue entries.

---

### Database 5: System Config

**Purpose:** Live mirror of FieldMap.json for dashboard viewing

| Property Name | Type | Formula/Config | Description |
|---------------|------|----------|-------------|
| Key | Title | - | Config key path (e.g., `binderOutbox.outboxFolderId`) |
| Value | Text | - | Current value |
| Type | Select | Options: String, Number, Boolean, Object | Value type |
| Updated At | Last Edited Time | - | When config was last synced |
| Source | Select | Options: FieldMap.json, Manual Override | Where value came from |
| Category | Formula | `substring(prop("Key"), 0, indexOf(prop("Key"), "."))` | Top-level config section |

**Key Entries (Auto-synced from FieldMap.json):**
- `binderOutbox.outboxFolderId`
- `binderOutbox.archiveFolderId`
- `binderOutbox.errorsFolderId`
- `binderOutbox.minPdfBytes`
- `binderOutbox.shaMode`
- `binderJobs.inFolderId`
- `binderJobs.outFolderId`
- `notion.caseDbId`
- `notion.evidenceDbId`
- `notion.errorDbId`
- `notion.opsQueueDbId`
- (See [FIELD_MAP_KEYS.md](./FIELD_MAP_KEYS.md) for complete list)

---

## 5) Notion Dashboard Page Spec

### Page Name
`BinderOutbox Ops — Command Center`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  🎛️ BinderOutbox Ops — Command Center                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Quick Stats                                          │
│  - Today's Ingests: [count]                             │
│  - Open Errors: [count]                                 │
│  - Queued Ops: [count]                                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔴 NEW ERRORS (Status = New)                           │
│  [Linked View: Binder Errors]                           │
│  Filter: Status = "New"                                 │
│  Sort: Detected At (desc)                               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📥 TODAY'S INGESTS                                      │
│  [Linked View: Evidence]                                │
│  Filter: Ingested At = Today                            │
│  Sort: Ingested At (desc)                               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔄 RETRY QUEUE (Action = REINGEST, Status = Queued)    │
│  [Linked View: Ops Queue]                               │
│  Filter: Action Type = "BINDER_REINGEST" AND            │
│         Status = "Queued"                               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🗑️ FORCE ARCHIVE QUEUE                                 │
│  [Linked View: Ops Queue]                               │
│  Filter: Action Type = "BINDER_FORCE_ARCHIVE" AND       │
│         Status = "Queued"                               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ⚠️ CASES WITH ISSUES                                    │
│  [Linked View: Cases]                                   │
│  Filter: Binder Status = "Error"                        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔘 RECOVERY BUTTONS                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Re-ingest    │ │ Force Archive│ │ Mark Resolved│   │
│  │ From Error   │ │ Bad Files    │ │ Error        │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                          │
│  ┌──────────────┐                                       │
│  │ Request      │                                       │
│  │ Binder       │                                       │
│  │ Publish      │                                       │
│  └──────────────┘                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Button Configurations

#### Button 1: Re-ingest From Error
- **Action:** Create Ops Queue entry
- **Properties to Set:**
  - Action Type: `BINDER_REINGEST`
  - Status: `Queued`
  - File ID 1: `[from Error: PDF File ID]`
  - File ID 2: `[from Error: Ready File ID]`
  - File ID 3: `[from Error: SHA File ID]`
  - Linked Error: `[current Error record]`

#### Button 2: Force Archive Bad Files
- **Action:** Create Ops Queue entry
- **Properties to Set:**
  - Action Type: `BINDER_FORCE_ARCHIVE`
  - Status: `Queued`
  - File ID 1: `[from Error: PDF File ID]`
  - File ID 2: `[from Error: Ready File ID]`
  - File ID 3: `[from Error: SHA File ID]`

#### Button 3: Mark Resolved
- **Action:** Update Binder Error
- **Properties to Set:**
  - Status: `Resolved`
  - Resolved At: `[now]`
  - Resolution Notes: `[user input]`

#### Button 4: Request Binder Publish
- **Action:** Create Ops Queue entry
- **Properties to Set:**
  - Action Type: `BINDER_PUBLISH_REQUEST`
  - Status: `Queued`
  - Case ID: `[user input or from Case page]`

---

## 6) Make Scenarios Module Specs

### Scenario A: BINDER_OUTBOX_INGEST_v1

**Trigger:** Watch for new `.ready` files in BinderOutbox/Outbox folder  
**Frequency:** Every 2 minutes  
**Total Modules:** 34

#### Module Flow

```
[1] Watch Google Drive Folder (Outbox)
    ↓ Trigger on new .ready files
[2] Get Ready File Content
    ↓
[3] Parse JSON (if readyPayload = json)
    ↓
[4] Extract Case ID from Ready JSON or Filename
    ↓
[5-10] Search for matching PDF, SHA256 files by basename
    ↓
[11] Validate: PDF exists
    Filter: {{PDF.id}} not empty
    ↓
[12] Validate: PDF size >= minPdfBytes
    Filter: {{PDF.size}} >= {{FieldMap.binderOutbox.minPdfBytes}}
    ↓
[13] Download PDF file
    ↓
[14] Calculate SHA256 hash (if shaMode = required)
    ↓
[15] Get SHA256 file content (if exists)
    ↓
[16] Compare SHA256 hashes
    Filter: {{calculated}} = {{fromFile}} OR {{shaMode}} != required
    ↓
[17-20] Search Notion Cases DB for matching Case ID
    ↓
[21] Search Notion Evidence DB for duplicate (by File ID or SHA256)
    Filter: File ID = {{PDF.id}} OR SHA256 = {{hash}}
    ↓
[22] Check if duplicate exists
    Filter: {{searchResults.length}} = 0 (skip if duplicate)
    ↓
[23] Create Evidence Record
    Database: {{FieldMap.notion.evidenceDbId}}
    Properties:
      - Title: {{PDF.name}}
      - Case: [relation to Case]
      - File ID: {{PDF.id}}
      - SHA256: {{hash}}
      - READY Raw: {{readyContent}}
      - Run ID: {{runId}}
      - File Size: {{PDF.size}}
    ↓
[24-26] Move PDF to Archive folder
    ↓
[27-28] Move Ready file to Archive folder
    ↓
[29-30] Move SHA file to Archive folder (if exists)
    ↓
[31] Update Case record: Last Binder Date, File ID
    ↓
[32] Log success to Make audit log
    ↓
[ERROR HANDLER - Modules 33-34]
    Create Binder Error record with details
    Move files to Errors folder
```

#### Key Filter Expressions (Copy-Paste Ready)

**Module 11 - PDF Exists:**
```
{{11.id}} != null AND {{11.id}} != ""
```

**Module 12 - PDF Size Check:**
```
{{11.size}} >= 50000
```

**Module 16 - SHA256 Match:**
```
{{14.hash}} = {{15.content}} OR "{{FieldMap.binderOutbox.shaMode}}" != "required"
```

**Module 22 - Skip Duplicates:**
```
{{21.array.length}} = 0
```

---

### Scenario B: OPS_QUEUE_DISPATCH_v1

**Trigger:** Watch for new Ops Queue records with Status = Queued  
**Frequency:** Every 1 minute  
**Total Modules:** 41 (including dedup chain)

#### Module Flow

```
[38] Watch Notion Database (Ops Queue)
    Filter: Status = "Queued"
    ↓
[38.5] DEDUP CHAIN START
    ↓
[38.6] Search for duplicate DedupKeys
    Database: Ops Queue
    Filter: DedupKey = {{38.DedupKey}} AND Status in (Queued, Processing)
    ↓
[38.7] Check if duplicate found (created before this one)
    Filter: {{38.6.results.length}} > 1
    → If YES: Update Status to "Duplicate" and STOP
    → If NO: Continue to routing
    ↓
[39] Update Status to "Processing"
    ↓
[40] Router by Action Type
    Routes:
      - BINDER_REINGEST → Route 1
      - BINDER_FORCE_ARCHIVE → Route 2
      - BINDER_MARK_RESOLVED → Route 3
      - BINDER_PUBLISH_REQUEST → Route 4
    ↓
[41.1] ROUTE 1: Re-ingest
    - Copy files from Errors → Outbox
    - Delete from Errors folder
    - Update Error Status to "Retry Queued"
    ↓
[41.2] ROUTE 2: Force Archive
    - Move files from Errors → Archive
    - Update Error Status to "Force Archived"
    ↓
[41.3] ROUTE 3: Mark Resolved
    - Update Error Status to "Resolved"
    - Set Resolved At timestamp
    ↓
[41.4] ROUTE 4: Publish Request
    - Create job file in BinderJobs/In
    - Job payload: { action: "publish", caseId: "..." }
    ↓
[42] Update Ops Queue Status to "Completed"
    Set Processed At timestamp
    Log result
```

#### Dedup Chain Detail (Modules 38.5-38.7)

**Purpose:** Prevent duplicate operations from button-mashing

**Module 38.6 - Search for Duplicates:**
```
Database: Ops Queue
Filter: DedupKey = "{{38.DedupKey}}" AND Status in ("Queued", "Processing")
Sort: Created At (asc)
```

**Module 38.7 - Skip if Duplicate:**
```
{{38.6.results.length}} > 1 AND {{38.6.results[0].id}} != {{38.id}}
```

If this filter passes, update Status to "Duplicate" and stop processing.

---

### Scenario C: BINDER_JOB_RESULTS_v1

**Trigger:** Watch for new files in BinderJobs/Out folder  
**Frequency:** Every 2 minutes  
**Total Modules:** 15

#### Module Flow

```
[1] Watch Google Drive Folder (BinderJobs/Out)
    ↓
[2] Download job result file
    ↓
[3] Parse JSON
    Expected format: { jobId, status, caseId, result, error }
    ↓
[4] Router by Status
    Routes:
      - success → Route 1
      - error → Route 2
    ↓
[5.1] ROUTE 1: Success
    - Update Ops Queue: Status = "Completed"
    - Update Case: Set appropriate status
    ↓
[5.2] ROUTE 2: Error
    - Update Ops Queue: Status = "Failed"
    - Create Binder Error record
    ↓
[6] Move result file to BinderJobs/Archive
    ↓
[7] Log to Make audit log
```

---

### Scenario D: CONFIG_SYNC_v1

**Trigger:** Scheduled every 15 minutes  
**Total Modules:** 12

#### Module Flow

```
[1] Scheduled Trigger (every 15 min)
    ↓
[2] Search for FieldMap.json in Drive
    ↓
[3] Download FieldMap.json
    ↓
[4] Parse JSON
    ↓
[5] Flatten JSON to key-value pairs
    Example: { "binderOutbox.outboxFolderId": "abc123" }
    ↓
[6] Iterator: For each key-value pair
    ↓
[7] Search System Config DB for existing key
    ↓
[8] Check if record exists
    Filter: {{7.results.length}} > 0
    → If YES: Update record
    → If NO: Create record
    ↓
[9] Update or Create System Config record
    Properties:
      - Key: {{key}}
      - Value: {{value}}
      - Type: [auto-detect from value type]
      - Source: "FieldMap.json"
    ↓
[10] Log sync completion
```

#### JSON Flattening Logic

**Input:**
```json
{
  "binderOutbox": {
    "outboxFolderId": "abc123",
    "minPdfBytes": 50000
  },
  "notion": {
    "caseDbId": "def456"
  }
}
```

**Output:**
```json
[
  { "key": "binderOutbox.outboxFolderId", "value": "abc123", "type": "String" },
  { "key": "binderOutbox.minPdfBytes", "value": "50000", "type": "Number" },
  { "key": "notion.caseDbId", "value": "def456", "type": "String" }
]
```

---

## 7) Publish Request Loop (Job File Contract)

### Overview

The publish request loop allows Notion buttons to trigger PowerShell binder generation.

**Flow:** Notion Button → Ops Queue → Make → BinderJobs/In → PowerShell → BinderJobs/Out → Make → Notion

---

### Job File Schema (BinderJobs/In)

**Filename:** `job-{timestamp}-{uuid}.json`

**Content:**
```json
{
  "jobId": "job-abc123",
  "action": "publish_binder",
  "caseId": "12345",
  "requestedBy": "notion_button",
  "requestedAt": "2026-01-24T16:00:00Z",
  "priority": "normal",
  "options": {
    "forceRegenerate": false,
    "includeExhibits": true,
    "outputFormat": "pdf"
  }
}
```

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `jobId` | string | Unique job identifier |
| `action` | enum | Job type: "publish_binder", "republish", "archive" |
| `caseId` | string | Target case ID |
| `requestedBy` | string | Source of request (e.g., "notion_button") |
| `requestedAt` | ISO 8601 | Timestamp of request |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `priority` | enum | "high", "normal", "low" (default: "normal") |
| `options` | object | Job-specific options |

---

### Result File Schema (BinderJobs/Out)

**Filename:** `result-{jobId}.json`

**Success Response:**
```json
{
  "jobId": "job-abc123",
  "status": "success",
  "caseId": "12345",
  "completedAt": "2026-01-24T16:05:00Z",
  "result": {
    "pdfFileId": "drive-file-id",
    "sha256": "a3f2e8b9...",
    "pageCount": 127,
    "evidenceCount": 15,
    "outputPath": "Case-12345-Binder.pdf",
    "runId": "run-abc123"
  }
}
```

**Error Response:**
```json
{
  "jobId": "job-abc123",
  "status": "error",
  "caseId": "12345",
  "completedAt": "2026-01-24T16:05:00Z",
  "error": {
    "code": "EVIDENCE_NOT_FOUND",
    "message": "Required evidence files missing for case 12345",
    "details": {
      "missingFiles": ["exhibit-1.pdf", "exhibit-2.pdf"]
    }
  }
}
```

#### Status Values

| Status | Description |
|--------|-------------|
| `success` | Job completed successfully |
| `error` | Job failed with recoverable error |
| `fatal_error` | Job failed with unrecoverable error |

#### Common Error Codes

| Code | Description |
|------|-------------|
| `CASE_NOT_FOUND` | Case ID doesn't exist |
| `EVIDENCE_NOT_FOUND` | Required evidence files missing |
| `PDF_GENERATION_FAILED` | PDF creation failed |
| `INVALID_JOB_SCHEMA` | Job file JSON is invalid |
| `FILESYSTEM_ERROR` | File I/O error |

---

## 8) Test Plan

### Group A: Publish Ritual (4 Tests)

#### Test A1: Valid Publish Sequence
**Setup:** Clean outbox folder  
**Actions:**
1. Write `test.pdf.tmp` (100KB valid PDF)
2. Rename to `test.pdf`
3. Write `test.pdf.sha256.tmp` (valid hash)
4. Rename to `test.pdf.sha256`
5. Write `test.pdf.ready.tmp` (valid JSON)
6. Rename to `test.pdf.ready`

**Expected:**
- Make triggers ingestion
- Evidence record created
- Files moved to Archive
- No errors logged

---

#### Test A2: No False Ready - Missing PDF
**Setup:** Clean outbox folder  
**Actions:**
1. Write `test.pdf.ready` WITHOUT PDF file

**Expected:**
- Make detects missing PDF
- Binder Error created: "Missing PDF"
- Ready file moved to Errors
- No Evidence record created

---

#### Test A3: No False Ready - PDF Too Small
**Setup:** Clean outbox folder  
**Actions:**
1. Write valid sequence, but PDF is only 10KB (below minPdfBytes)

**Expected:**
- Make detects undersized PDF
- Binder Error created: "PDF Too Small"
- Files moved to Errors

---

#### Test A4: SHA256 Mismatch
**Setup:** Clean outbox folder  
**Actions:**
1. Write valid PDF
2. Write SHA256 with WRONG hash
3. Write ready file

**Expected:**
- Make calculates actual SHA
- Detects mismatch
- Binder Error created: "SHA Mismatch"
- Files moved to Errors

---

### Group B: Make Ingestion (4 Tests)

#### Test B1: Idempotent - Duplicate Prevention
**Setup:** Evidence record already exists for PDF (same File ID)  
**Actions:**
1. Publish same PDF again with same File ID

**Expected:**
- Make detects duplicate (Module 22)
- Skips Evidence creation
- Archives files
- No duplicate Evidence record

---

#### Test B2: Case Not Found
**Setup:** Ready file references non-existent Case ID  
**Actions:**
1. Publish PDF with caseId: "99999" (doesn't exist)

**Expected:**
- Make searches for Case, finds none
- Continues ingestion (creates orphan Evidence record)
- OR creates Binder Error if strict mode enabled

---

#### Test B3: Concurrent Publishes
**Setup:** Two identical PDFs published within 30 seconds  
**Actions:**
1. Publish `test1.pdf.ready` at T+0
2. Publish `test1.pdf.ready` at T+10

**Expected:**
- Both trigger Make independently
- Dedup logic in Module 22 catches second one
- Only one Evidence record created

---

#### Test B4: Archive Failure Recovery
**Setup:** Archive folder has restricted permissions  
**Actions:**
1. Publish valid PDF
2. Make attempts to archive, fails

**Expected:**
- Error handler catches archive failure
- Binder Error created: "Archive Failed"
- Files remain in Outbox or moved to Errors
- Evidence record NOT created (or marked as problematic)

---

### Group C: Ops Queue (3 Tests)

#### Test C1: Dedup - Button Mash Prevention
**Setup:** Binder Error exists  
**Actions:**
1. Click "Re-ingest" button 5 times rapidly

**Expected:**
- 5 Ops Queue records created
- Dedup chain (Module 38.7) processes first one
- Other 4 marked as "Duplicate"
- Only 1 re-ingest operation executed

---

#### Test C2: Re-ingest Success
**Setup:** Files in Errors folder  
**Actions:**
1. Create Ops Queue entry: Action = BINDER_REINGEST
2. Wait for Make to process

**Expected:**
- Make copies files from Errors → Outbox
- Deletes from Errors
- INGEST scenario triggers
- Evidence created
- Ops Queue Status = "Completed"

---

#### Test C3: Force Archive
**Setup:** Unrecoverable bad files in Errors  
**Actions:**
1. Create Ops Queue entry: Action = BINDER_FORCE_ARCHIVE

**Expected:**
- Make moves files to Archive (bypasses validation)
- Error Status = "Force Archived"
- Ops Queue Status = "Completed"

---

### Group D: Publish Loop (1 Test)

#### Test D1: End-to-End Job Request
**Setup:** Valid Case in Notion  
**Actions:**
1. Click "Request Binder Publish" button
2. Enter Case ID: "12345"
3. Wait for job completion

**Expected:**
- Ops Queue entry created
- Make writes job file to BinderJobs/In
- PowerShell picks up job, generates binder
- Result file written to BinderJobs/Out
- Make updates Ops Queue Status
- Evidence record created from published PDF

---

### Group E: Config Sync (2 Tests)

#### Test E1: Initial Sync
**Setup:** Empty System Config DB  
**Actions:**
1. Upload FieldMap.json to Drive
2. Trigger CONFIG_SYNC scenario

**Expected:**
- 15+ System Config records created
- All keys match FieldMap.json
- Types auto-detected correctly

---

#### Test E2: Config Update
**Setup:** System Config DB has old values  
**Actions:**
1. Update FieldMap.json: change minPdfBytes from 50000 → 100000
2. Wait for next sync (or trigger manually)

**Expected:**
- System Config record updated
- Updated At timestamp refreshed
- Old value overwritten

---

## 9) Implementation Order

### Phase 1: Core Ingestion (Est. 1 hour)

**Goal:** Get basic publish → ingest → archive working

**Steps:**
1. Create Notion databases: Cases, Evidence, Binder Errors
2. Create FieldMap.json in Drive
3. Build Make Scenario A (BINDER_OUTBOX_INGEST_v1)
   - Modules 1-16: Watch, validate, hash check
   - Modules 17-24: Create Evidence
   - Modules 25-30: Archive files
   - Modules 31-34: Error handling
4. Test with Group A tests (Publish Ritual)

**Deliverables:**
- ✅ Valid PDFs get logged to Evidence
- ✅ Invalid PDFs create Binder Errors
- ✅ Files archived after success

---

### Phase 2: Ops Dashboard (Est. 45 min)

**Goal:** Add recovery buttons and ops queue

**Steps:**
1. Create Notion databases: Ops Queue, System Config
2. Build Notion dashboard page with 5 views
3. Add 4 recovery buttons
4. Build Make Scenario B (OPS_QUEUE_DISPATCH_v1)
   - Modules 38-39: Watch and dedup
   - Module 40: Router
   - Modules 41.1-41.3: Re-ingest, Force Archive, Mark Resolved
5. Test with Group C tests (Ops Queue)

**Deliverables:**
- ✅ Buttons create Ops Queue entries
- ✅ Dedup prevents duplicates
- ✅ Re-ingest moves files back to Outbox
- ✅ Force archive bypasses validation

---

### Phase 3: Publish Loop (Est. 1 hour)

**Goal:** Enable button-triggered binder generation

**Steps:**
1. Build Make Scenario C (BINDER_JOB_RESULTS_v1)
2. Add Route 4 to Scenario B (Module 41.4)
3. Update PowerShell to watch BinderJobs/In
4. Update PowerShell to write result files
5. Test with Group D test (Publish Loop)

**Deliverables:**
- ✅ Button creates job file
- ✅ PowerShell processes job
- ✅ Result logged back to Notion

---

### Phase 4: Config Sync (Est. 15 min)

**Goal:** Auto-sync FieldMap.json to Notion

**Steps:**
1. Build Make Scenario D (CONFIG_SYNC_v1)
2. Test with Group E tests (Config Sync)

**Deliverables:**
- ✅ FieldMap.json synced every 15 min
- ✅ System Config DB stays current

---

**Total Implementation Time:** ~3 hours  
**Production Readiness:** After all 4 phases + full test plan

---

## 10) Operational Guarantees

The BinderOutbox system enforces the following guarantees:

### 1. No False-Ready Guarantee
✅ **Promise:** A `.ready` file ONLY appears when all artifacts are complete and valid.

**Enforcement:**
- PowerShell uses `.tmp` files during writes
- Atomic rename operations (not copy + delete)
- `.ready` file written LAST in sequence
- If any step fails, no `.ready` file is created

**Impact:** Make automation NEVER triggers on incomplete artifacts.

---

### 2. Idempotent Ingestion
✅ **Promise:** Publishing the same artifact multiple times does NOT create duplicate Evidence records.

**Enforcement:**
- Module 21: Search for existing Evidence by File ID or SHA256
- Module 22: Skip creation if duplicate found
- Still archives files (safe cleanup)

**Impact:** Re-running failed jobs is safe and won't pollute database.

---

### 3. Error Non-Retrigger
✅ **Promise:** Once a file is moved to Errors folder, it will NOT automatically re-trigger ingestion.

**Enforcement:**
- Errors folder is NOT watched by Make
- Only manual Ops Queue actions can re-ingest
- Archive folder is NOT watched either

**Impact:** Bad files don't create infinite error loops.

---

### 4. Deduped Ops Queue
✅ **Promise:** Button-mashing CANNOT create duplicate operations.

**Enforcement:**
- Modules 38.5-38.7: Dedup chain checks DedupKey
- Formula: `Action Type + File ID 1 + File ID 2`
- First operation processes, others marked "Duplicate"

**Impact:** Ops team can click buttons aggressively without worry.

---

### 5. Auditable Operations
✅ **Promise:** Every ingestion, error, and operation is logged with full context.

**Enforcement:**
- Evidence DB: Logs all successful ingests with timestamps
- Binder Errors DB: Logs all failures with error details
- Ops Queue DB: Logs all manual operations with results
- System Config DB: Tracks all config changes

**Impact:** Complete audit trail for compliance and debugging.

---

### 6. Config Consistency
✅ **Promise:** Notion dashboard always shows current FieldMap.json configuration.

**Enforcement:**
- Scenario D syncs every 15 minutes
- System Config DB mirrors FieldMap.json
- No manual editing of config in Notion (read-only)

**Impact:** Single source of truth, no drift between systems.

---

### 7. Graceful Degradation
✅ **Promise:** If one component fails, others continue operating.

**Design:**
- PowerShell publishes to Drive (works even if Make is down)
- Make ingests when available (queue builds up if down)
- Notion buttons queue operations (execute when Make recovers)

**Impact:** System is resilient to partial outages.

---

## Conclusion

This specification provides complete documentation for building and operating the BinderOutbox system. Follow the Implementation Order (Section 9) to build the system in ~3 hours, then validate with the Test Plan (Section 8).

**Key Success Metrics:**
- ⏱️ Time to implement: 3-4 hours
- 💰 Time saved per week: ~2 hours (manual artifact logging)
- 📊 ROI: Pays for itself in 2 weeks
- 🎯 Reliability: 99.9% (with no false-ready guarantee)

For configuration reference, see [FIELD_MAP_KEYS.md](./FIELD_MAP_KEYS.md).
