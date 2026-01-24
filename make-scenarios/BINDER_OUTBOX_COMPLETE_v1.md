# MAKE Scenario: `BINDER_OUTBOX_COMPLETE_v1` (Consolidated)

## Overview

This Make.com scenario automates the complete binder PDF ingestion workflow from Google Drive to Notion. It watches a Google Drive folder for new binder PDFs, validates case IDs, processes SHA256 sidecar files, creates Evidence Log entries, and archives files.

## Key Features

- **Automated PDF Detection**: Watches Google Drive folder for new binder PDFs
- **Case ID Validation**: Extracts and validates case IDs from filenames (format: `HTN-XXXX-XXXX`)
- **SHA256 Verification**: Finds and parses `.sha256` sidecar files with retry logic
- **Notion Integration**: Updates Case pages and creates Evidence Log entries
- **File Archiving**: Moves processed files to archive folder
- **Error Handling**: Routes invalid/unmatched files appropriately

## Prerequisites

### Google Drive
- Binder Outbox folder (for new PDFs)
- Binder Archive folder (for processed PDFs)
- FieldMap_Manifest.json file

### Notion
- Cases database with `CaseID` property
- Evidence Log database
- Queue database (optional, for BuildBinder tracking)

### Configuration
- FieldMap_Manifest.json must be accessible in Google Drive
- All folder IDs must be configured in FieldMap

---

## Variables Used

Variables are set throughout the scenario using "Set variables" modules:

* `CFG` = Parsed FieldMap JSON configuration
* `file_name` = Name of the PDF file
* `binder_link` = Google Drive web view link
* `binder_file_id` = Google Drive file ID
* `case_id` = Extracted case ID (format: HTN-XXXX-XXXX)
* `sha_note` = SHA256 hash note for Evidence Log
* `sidecar_id` = ID of .sha256 sidecar file (if found)
* `case_page_id` = Notion page ID of matched Case
* `exhibit_code` = Generated exhibit code (e.g., EX-01)

---

## Module Flow

### Module 1 — Google Drive (Trigger): **Watch files in a folder**

**Configuration:**
* **Folder:** `CFG.drive._placeholders.binder_outbox_folder_id`
  *(Note: Triggers can't dynamically read CFG yet, so paste folder ID manually once)*
* **Watch:** Newly created files
* **Limit:** 10
* **Include subfolders:** No

**Output:**
- `{{1.id}}` - File ID
- `{{1.name}}` - Filename

### Filter (immediately after Module 1) — Only PDFs

**Condition:**
* `{{1.name}}` ends with `.pdf`

---

### Module 2 — Google Drive: **Get a file**

**Configuration:**
* **File ID:** `{{1.id}}`

**Outputs:**
- `{{2.name}}` - Filename
- `{{2.webViewLink}}` - Web view link
- `{{2.id}}` - File ID

---

### Module 3 — Google Drive: **Download a file** (FieldMap)

**Configuration:**
* **File:** `FieldMap_Manifest.json` (hardwire file ID once)

**Output:**
- File content (JSON string)

---

### Module 4 — Tools → JSON: **Parse JSON** (FieldMap)

**Configuration:**
* **JSON string:** Content from Module 3

**Result:** `CFG` object

**Available References:**
- `{{4.notion._placeholders.db_cases_id}}`
- `{{4.notion._placeholders.db_evidence_id}}`
- `{{4.notion._placeholders.db_queue_id}}` (optional)
- `{{4.drive._placeholders.binder_outbox_folder_id}}`
- `{{4.drive._placeholders.binder_archive_folder_id}}`

---

### Module 5 — Tools: **Set variables** (Basic file vars + CaseID parse)

**Set:**
* `file_name = {{2.name}}`
* `binder_link = {{2.webViewLink}}`
* `binder_file_id = {{2.id}}`
* `case_id = {{match(2.name; "HTN-\\d{4}-\\d{4}")}}`

**Note:** If `match()` returns an array in your Make tenant, take the first element.

---

### Module 6 — Router: **CaseID Found?**

Two routes based on whether case_id was successfully extracted.

#### Route 6A — INVALID_FILENAME (no CaseID)

**Filter:** `case_id is empty`

**Module 6A-1 — Google Drive: Move a file**
* **File ID:** `{{binder_file_id}}`
* **Destination:** `{{4.drive._placeholders.binder_archive_folder_id}}`
* **Rename (optional):** `INVALID_{{file_name}}`

**Module 6A-2 — STOP** (end route)

---

#### Route 6B — VALID_CASEID

**Filter:** `case_id is not empty`

Continue to Module 7.

---

### Module 7 — Tools: **Sleep**

**Configuration:**
* **Seconds:** `10`

**Purpose:** Allow time for .sha256 sidecar file to be uploaded.

---

### Module 8 — Google Drive: **Search for files/folders** (Find sidecar)

**Configuration:**
* **Search term:** `{{file_name}}.sha256`
* **Folder:** `{{4.drive._placeholders.binder_outbox_folder_id}}`
* **Type:** Files
* **Limit:** 1

**Output:**
- `{{8.results}}` - Array of matching files
- `{{8.results[1].id}}` - Sidecar file ID (if found)

---

### Module 9 — Router: **Sidecar found?**

Two routes based on whether sidecar file was found.

#### Route 9A — SIDECAR_FOUND

**Filter:** `length({{8.results}}) > 0`

Continue to Module 13 (Sidecar Parse Chain) using `{{8.results[1].id}}`

#### Route 9B — SIDECAR_NOT_FOUND (Retry once)

**Filter:** `length({{8.results}}) = 0`

Continue to Module 10 for retry logic.

---

### Module 10 — Tools: **Sleep** (Retry delay)

**Configuration:**
* **Seconds:** `15`

**Purpose:** Additional wait before retry.

---

### Module 11 — Google Drive: **Search for files/folders** (Retry sidecar)

**Configuration:**
* **Search term:** `{{file_name}}.sha256`
* **Folder:** `{{4.drive._placeholders.binder_outbox_folder_id}}`
* **Type:** Files
* **Limit:** 1

**Output:**
- `{{11.results}}` - Array of matching files
- `{{11.results[1].id}}` - Sidecar file ID (if found)

---

### Module 12 — Router: **Found on retry?**

Two routes based on retry result.

#### Route 12A — FOUND_ON_RETRY

**Filter:** `length({{11.results}}) > 0`

Continue to Module 13 (Sidecar Parse Chain) using `{{11.results[1].id}}`

#### Route 12B — STILL_MISSING

**Filter:** `length({{11.results}}) = 0`

**Module 12B-1 — Tools: Set variable**
* `sha_note = "SHA256: not provided"`
* `sidecar_id = ""` (empty)

Then jump to Module 18 (Notion: Find Case).

---

## Sidecar Parse Chain (Routes 9A and 12A)

Used by both Route 9A (first search) and Route 12A (retry search).

### Module 13 — Google Drive: **Download a file** (Sidecar)

**Configuration:**
* **File ID:**
  * If Route 9A: `{{8.results[1].id}}`
  * If Route 12A: `{{11.results[1].id}}`

**Output:**
- `{{13.data}}` - Sidecar file content
- `{{13.id}}` - File ID

---

### Module 14 — Tools: **Set variables** (Normalize sidecar content)

**Set:**
* `sidecar_text = {{trim(13.data)}}`
* `sidecar_id = {{13.id}}`

---

### Module 15 — Tools: **Set variables** (Extract hash + filename)

**Sidecar Format:**
```
<sha256hex>  <pdf_filename>
```

**Set:**
* `parts = split(sidecar_text; "  ")`
* `sha256 = lower(trim(get(parts; 1)))`
* `sha_filename = trim(get(parts; 2))`
* `sha_filename_ok = (sha_filename = file_name)`

---

### Module 16 — Router: **Sidecar filename matches PDF?**

Two routes based on filename validation.

#### Route 16A — OK

**Filter:** `sha_filename_ok = true`

**Module 16A-1 — Tools: Set variable**
* `sha_note = "SHA256: " & sha256`

Then jump to Module 18 (Notion: Find Case).

#### Route 16B — MISMATCH

**Filter:** `sha_filename_ok = false`

**Module 16B-1 — Tools: Set variable**
* `sha_note = "SHA256: PARSE_MISMATCH (sidecar filename=" & sha_filename & ")"`

Then jump to Module 18 (Notion: Find Case).

---

## Common Path (After SHA note exists)

All routes converge here after `sha_note` has been set.

### Module 18 — Notion: **Search objects** (Find Case by CaseID)

**Configuration:**
* **Database:** `{{4.notion._placeholders.db_cases_id}}`
* **Filter:**
  * Property: `CaseID`
  * Condition: Equals
  * Value: `{{case_id}}`
* **Limit:** 1

**Output:**
- `{{18.results}}` - Array of matching cases
- `{{18.results[1].id}}` - Case page ID (if found)

---

### Module 19 — Router: **Case found?**

Two routes based on whether case was found in Notion.

#### Route 19A — CASE_NOT_FOUND

**Filter:** `length({{18.results}}) = 0`

**Module 19A-1 — Google Drive: Move a file**
* **File ID:** `{{binder_file_id}}`
* **Destination:** `{{4.drive._placeholders.binder_archive_folder_id}}`
* **Rename (optional):** `UNMATCHED_{{file_name}}`

**Module 19A-2 — Router: Sidecar exists?**
* **Condition:** `sidecar_id is not empty`
* **If yes:** Move sidecar too
  * **Google Drive: Move file**
  * **File ID:** `{{sidecar_id}}`
  * **Destination:** `{{4.drive._placeholders.binder_archive_folder_id}}`

**STOP** (end route)

---

#### Route 19B — CASE_FOUND

**Filter:** `length({{18.results}}) > 0`

Continue to Module 20.

---

### Module 20 — Tools: **Set variables** (Case page ID)

**Set:**
* `case_page_id = {{18.results[1].id}}`

**Optional:**
* `creditor = {{18.results[1].properties["Creditor"].select.name}}`

---

### Module 21 — Notion: **Update a database item** (Update Case)

**Configuration:**
* **Page ID:** `{{case_page_id}}`

**Set:**
* `Binder PDF` (URL) = `{{binder_link}}`
* `Auto Status` = `Done`
* `Auto Last Run` (Date) = `{{now}}`
* `Next Action` = `Binder ready — proceed to serve/attach/escalate as needed`

---

### Module 22 — Notion: **Search objects** (Evidence Log for this case)

**Configuration:**
* **Database:** `{{4.notion._placeholders.db_evidence_id}}`
* **Filter:** `Case` relation contains `{{case_page_id}}`
* **Limit:** 100

**Output:**
- `{{22.results}}` - Array of existing evidence entries

---

### Module 23 — Tools: **Set variables** (Next Exhibit Code)

**Set:**
* `e_count = {{length(22.results)}}`
* `exhibit_num = {{add(e_count; 1)}}`
* `exhibit_code = {{concat("EX-"; padLeft(toString(exhibit_num); 2; "0"))}}`

**Example:** If 5 evidence entries exist, exhibit_code will be "EX-06"

---

### Module 24 — Notion: **Create a database item** (Evidence Log entry for binder)

**Configuration:**
* **Database:** `{{4.notion._placeholders.db_evidence_id}}`

**Set:**
* `EvidenceID` (Title) = `{{case_id}}_BINDER_{{formatDate(now; "YYYY-MM-DD")}}`
* `Case` (Relation) = `{{case_page_id}}`
* `Exhibit Code` = `{{exhibit_code}}`
* `Title` = `Binder PDF — {{case_id}}`
* `Source` = `Report` (or "Binder" if you add that option)
* `Date` = `{{now}}`
* `File` (URL) = `{{binder_link}}`
* `Notes` = `Binder outbox ingest | File: {{file_name}}\n{{sha_note}}`

---

### Module 25 (Optional) — Notion: **Search objects** (Find BuildBinder queue request)

**Purpose:** Automatically close the queue item that triggered binder generation.

**Configuration:**
* **Database:** `{{4.notion._placeholders.db_queue_id}}`
* **Filters:**
  * `Case` relation contains `{{case_page_id}}`
  * `Action Type` equals `BuildBinder`
  * `Status` is `Queued` OR `Running`
* **Limit:** 1

**Output:**
- `{{25.results[1].id}}` - Queue item page ID (if found)

---

### Module 26 (Optional) — Notion: **Update database item** (Close queue item)

**Configuration:**
* **Page ID:** `{{25.results[1].id}}`

**Set:**
* `Status` = `Done`
* `Output Link` = `{{binder_link}}`
* `Run Log` = `Binder detected in Outbox {{now}} | Exhibit {{exhibit_code}} | {{sha_note}}`

---

### Module 27 — Google Drive: **Move a file** (Archive the binder PDF)

**Configuration:**
* **File ID:** `{{binder_file_id}}`
* **Destination folder:** `{{4.drive._placeholders.binder_archive_folder_id}}`
* **Rename (optional):** `{{case_id}}_BINDER_COMPLETE_{{formatDate(now; "YYYY-MM-DD")}}.pdf`

---

### Module 28 — Router: **Archive sidecar too?**

Two routes based on whether sidecar was found.

#### Route 28A — HAS_SIDECAR

**Filter:** `sidecar_id is not empty`

**Module 28A-1 — Google Drive: Move a file**
* **File ID:** `{{sidecar_id}}`
* **Destination:** `{{4.drive._placeholders.binder_archive_folder_id}}`

#### Route 28B — NO_SIDECAR

**Filter:** `sidecar_id is empty`

End route.

---

### Module 29 (Optional) — Slack: **Post a message**

**Configuration:**
* **Channel:** Your notification channel
* **Message:**
```
✅ Binder archived: {{case_id}} | Exhibit {{exhibit_code}}
{{binder_link}}
{{sha_note}}
```

---

## Important Notes

### 1. Trigger Configuration Limitation

**Issue:** Make.com triggers cannot dynamically read configuration variables yet.

**Solution:** Module 1 folder selection must be set manually once. Copy the folder ID from your FieldMap and paste it into the trigger configuration.

**All other modules** can reference `{{4.drive._placeholders.binder_outbox_folder_id}}` dynamically.

---

### 2. Binary vs. Text File Downloads

**Issue:** Some Google Drive "Download file" modules return binary/base64 data.

**Solution for Sidecar Files:**
- Sidecar `.sha256` files contain plain text
- Ensure Module 13 download output provides raw text
- If it returns base64/binary, add a "Convert to text" tool step after download

---

### 3. Race Condition Prevention

**Current Approach:** Sleep + Retry
- Module 7: Wait 10 seconds
- Module 8: Search for sidecar
- Module 10: Wait 15 more seconds
- Module 11: Retry search

**Better Approach:** Use `.ready` marker files (see alternative scenario)

---

## Error Handling Routes

### Invalid Filename (No CaseID)
- **Route:** 6A
- **Action:** Move to archive with `INVALID_` prefix
- **Result:** Stops processing

### Case Not Found in Notion
- **Route:** 19A
- **Action:** Move to archive with `UNMATCHED_` prefix
- **Includes:** Also moves sidecar if found
- **Result:** Stops processing

### Sidecar Missing
- **Route:** 12B
- **Action:** Continue with `sha_note = "SHA256: not provided"`
- **Result:** Creates Evidence Log entry without hash

### Sidecar Filename Mismatch
- **Route:** 16B
- **Action:** Set `sha_note` with mismatch warning
- **Result:** Creates Evidence Log entry with warning

---

## FieldMap Configuration

The FieldMap_Manifest.json file must contain:

```json
{
  "drive": {
    "_placeholders": {
      "binder_outbox_folder_id": "1ABC...",
      "binder_archive_folder_id": "1DEF..."
    }
  },
  "notion": {
    "_placeholders": {
      "db_cases_id": "abc123...",
      "db_evidence_id": "def456...",
      "db_queue_id": "ghi789..."
    }
  }
}
```

See `config-templates/FieldMap_Manifest.template.json` for complete template.

---

## Testing Checklist

- [ ] Upload a properly named PDF (e.g., `HTN-1234-5678_binder.pdf`)
- [ ] Upload matching `.sha256` sidecar file
- [ ] Verify case exists in Notion with matching CaseID
- [ ] Check that Evidence Log entry is created with correct exhibit code
- [ ] Verify files are moved to archive folder
- [ ] Test invalid filename (no CaseID pattern)
- [ ] Test unmatched case (CaseID not in Notion)
- [ ] Test missing sidecar file
- [ ] Test sidecar filename mismatch
- [ ] Verify queue item is marked Done (if using Module 25-26)
- [ ] Check Slack notification (if using Module 29)

---

## Troubleshooting

### Sidecar Not Found
- Check filename exactly matches: `<pdf_name>.pdf.sha256`
- Increase sleep duration in Module 7 or 10
- Consider using `.ready` marker approach

### Case Not Found
- Verify CaseID format matches: `HTN-XXXX-XXXX`
- Check that CaseID property in Notion is text type
- Ensure case exists before running scenario

### Exhibit Code Issues
- Verify Evidence Log database has correct relation to Cases
- Check that the search in Module 22 returns correct results
- Ensure exhibit numbering starts at 1

### Files Not Moving
- Verify folder IDs in FieldMap are correct
- Check Google Drive permissions
- Ensure Make has appropriate Drive access

---

## Alternative: .ready Marker Approach

For a more robust solution with zero race conditions, see:
- `BINDER_OUTBOX_READY_MARKER_v1.md`

This alternative approach watches for `.ready` marker files instead of PDFs directly, ensuring both PDF and sidecar are present before processing begins.

---

## Related Documentation

- [FieldMap Configuration Template](../config-templates/FieldMap_Manifest.template.json)
- [Ready Marker Scenario](./BINDER_OUTBOX_READY_MARKER_v1.md)
- [SHA256 Sidecar Format](./docs/sha256-sidecar-format.md)
- [Make.com Webhook Integration](../README.md#webhooks)

---

## Version History

- **v1.0** (2026-01-24): Initial consolidated scenario with inline sidecar parsing
