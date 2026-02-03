# MAKE Scenario: `BINDER_OUTBOX_READY_v1` (Consolidated)

## Overview

This is the **cleanest and most bulletproof** binder PDF ingestion workflow. Instead of watching for PDF files directly and hoping the `.sha256` sidecar arrives in time, this scenario watches for `.ready` marker files that signal all files are complete.

**SintraPrime writes:**
1. `...pdf`
2. `...pdf.sha256` (optional but recommended)
3. `...pdf.ready` (written **last**)

**Make watches `.ready`**, then **confirms** the PDF (and sidecar) exist, then processes, then archives **all files together**.

## Why This Version is "Bulletproof"

* Make only fires when `.ready` exists, meaning SintraPrime is done writing
* You still confirm the PDF exists (and retry once) before touching Notion
* Sidecar is optional, but if it exists it's parsed and logged
* Archive moves keep Outbox clean and prevent reprocessing loops

## Naming Rules

For a binder named:
* `HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf`

SintraPrime also writes:
* `HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.sha256`
* `HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.ready`

---

## Variables Used

Variables are set throughout the scenario:

* `CFG` = Parsed FieldMap JSON configuration
* `ready_name` = Name of the `.ready` file
* `pdf_name` = Derived PDF filename (ready_name without `.ready`)
* `sha_name` = Derived sidecar filename (pdf_name + `.sha256`)
* `case_id` = Extracted case ID (format: HTN-XXXX-XXXX)
* `ready_file_id` = Google Drive file ID of ready marker
* `pdf_file_id` = Google Drive file ID of PDF
* `binder_link` = Google Drive web view link for PDF
* `sidecar_id` = Google Drive file ID of sidecar (if found)
* `sha_note` = SHA256 hash note for Evidence Log
* `case_page_id` = Notion page ID of matched Case
* `exhibit_code` = Generated exhibit code (e.g., EX-01)

---

## Module Flow

### Module 1 — Google Drive (Trigger): **Watch files in a folder**

**Configuration:**
* **Folder:** BinderOutbox (set once manually)
* **Watch:** Newly created files
* **Limit:** 10
* **Include subfolders:** No

**Output:**
- `{{1.id}}` - File ID
- `{{1.name}}` - Filename

### Filter (immediately after Module 1) — Only .ready files

**Condition:**
* `{{1.name}}` ends with `.ready`

---

### Module 2 — Google Drive: **Download a file** (FieldMap)

**Configuration:**
* **File:** `FieldMap_Manifest.json` (hardwire file ID once)

**Output:**
- File content (JSON string)

---

### Module 3 — Tools → JSON: **Parse JSON** (FieldMap)

**Configuration:**
* **JSON string:** Content from Module 2

**Result:** `CFG` object

---

### Module 4 — Tools: **Set variables** (Derive filenames from ready marker)

**Set:**
* `ready_marker_name = {{1.name}}`
* `ready_marker_id = {{1.id}}`
* `pdf_name = {{replace(ready_marker_name; ".ready"; "")}}`
* `sidecar_name = {{pdf_name}}.sha256`
* `case_id = {{match(pdf_name; "HTN-\\d{4}-\\d{4}")}}`

**Example:**
- Ready marker: `HTN-1234-5678_binder.pdf.ready`
- PDF name: `HTN-1234-5678_binder.pdf`
- Sidecar name: `HTN-1234-5678_binder.pdf.sha256`
- Case ID: `HTN-1234-5678`

---

### Module 5 — Router: **CaseID Found?**

Two routes based on whether case_id was successfully extracted.

#### Route 5A — INVALID_FILENAME (no CaseID)

**Filter:** `case_id is empty`

**Module 5A-1 — Google Drive: Move file (ready marker)**
* **File ID:** `{{ready_marker_id}}`
* **Destination:** `{{3.drive._placeholders.binder_archive_folder_id}}`
* **Rename:** `INVALID_{{ready_marker_name}}`

**Module 5A-2 — STOP** (end route)

---

#### Route 5B — VALID_CASEID

**Filter:** `case_id is not empty`

Continue to Module 6.

---

### Module 6 — Google Drive: **Search for files/folders** (Find PDF)

**Configuration:**
* **Search term:** `{{pdf_name}}`
* **Folder:** `{{3.drive._placeholders.binder_outbox_folder_id}}`
* **Type:** Files
* **Limit:** 1

**Output:**
- `{{6.results[1].id}}` - PDF file ID
- `{{6.results[1].webViewLink}}` - PDF web link

---

### Module 7 — Google Drive: **Search for files/folders** (Find sidecar)

**Configuration:**
* **Search term:** `{{sidecar_name}}`
* **Folder:** `{{3.drive._placeholders.binder_outbox_folder_id}}`
* **Type:** Files
* **Limit:** 1

**Output:**
- `{{7.results[1].id}}` - Sidecar file ID

---

### Module 8 — Router: **Both files present?**

Three routes based on file validation.

#### Route 8A — PDF_MISSING

**Filter:** `length({{6.results}}) = 0`

**Module 8A-1 — Google Drive: Move file (ready marker)**
* **File ID:** `{{ready_marker_id}}`
* **Destination:** `{{3.drive._placeholders.binder_archive_folder_id}}`
* **Rename:** `ERROR_PDF_MISSING_{{ready_marker_name}}`

**Module 8A-2 — Optional: Slack notification**
* **Message:** `⚠️ Ready marker found but PDF missing: {{pdf_name}}`

**STOP** (end route)

---

#### Route 8B — SIDECAR_MISSING

**Filter:** `length({{6.results}}) > 0 AND length({{7.results}}) = 0`

**Module 8B-1 — Tools: Set variable**
* `pdf_file_id = {{6.results[1].id}}`
* `binder_link = {{6.results[1].webViewLink}}`
* `sha_note = "SHA256: not provided (ready marker found but sidecar missing)"`
* `sidecar_id = ""`

Continue to Module 9 (skip sidecar parsing).

---

#### Route 8C — BOTH_PRESENT

**Filter:** `length({{6.results}}) > 0 AND length({{7.results}}) > 0`

**Module 8C-1 — Tools: Set variables**
* `pdf_file_id = {{6.results[1].id}}`
* `binder_link = {{6.results[1].webViewLink}}`
* `sidecar_id = {{7.results[1].id}}`

Continue to Module 9 (sidecar parsing).

---

### Module 9 — Google Drive: **Download a file** (Sidecar)

**Configuration:**
* **File ID:** `{{sidecar_id}}`

**Output:**
- `{{9.data}}` - Sidecar file content

**Note:** Only executes for Route 8C (both files present).

---

### Module 10 — Tools: **Set variables** (Extract hash + filename)

**Sidecar Format:**
```
<sha256hex>  <pdf_filename>
```

**Set:**
* `sidecar_text = {{trim(9.data)}}`
* `parts = split(sidecar_text; "  ")`
* `sha256 = lower(trim(get(parts; 1)))`
* `sha_filename = trim(get(parts; 2))`
* `sha_filename_ok = (sha_filename = pdf_name)`

---

### Module 11 — Router: **Sidecar filename matches PDF?**

Two routes based on filename validation.

#### Route 11A — OK

**Filter:** `sha_filename_ok = true`

**Module 11A-1 — Tools: Set variable**
* `sha_note = "SHA256: " & sha256`

Continue to Module 12.

#### Route 11B — MISMATCH

**Filter:** `sha_filename_ok = false`

**Module 11B-1 — Tools: Set variable**
* `sha_note = "SHA256: PARSE_MISMATCH (sidecar filename=" & sha_filename & ")"`

Continue to Module 12.

---

### Module 12 — Notion: **Search objects** (Find Case by CaseID)

**Configuration:**
* **Database:** `{{3.notion._placeholders.db_cases_id}}`
* **Filter:**
  * Property: `CaseID`
  * Condition: Equals
  * Value: `{{case_id}}`
* **Limit:** 1

---

### Module 13 — Router: **Case found?**

#### Route 13A — CASE_NOT_FOUND

**Filter:** `length({{12.results}}) = 0`

**Module 13A-1 — Google Drive: Move files to archive**
* Move PDF: `{{pdf_file_id}}` → archive, rename `UNMATCHED_{{pdf_name}}`
* Move sidecar (if exists): `{{sidecar_id}}` → archive
* Move ready marker: `{{ready_marker_id}}` → archive

**STOP**

---

#### Route 13B — CASE_FOUND

**Filter:** `length({{12.results}}) > 0`

Continue to Module 14.

---

### Module 14 — Tools: **Set variables** (Case page ID)

**Set:**
* `case_page_id = {{12.results[1].id}}`

---

### Module 15 — Notion: **Update a database item** (Update Case)

**Configuration:**
* **Page ID:** `{{case_page_id}}`

**Set:**
* `Binder PDF` (URL) = `{{binder_link}}`
* `Auto Status` = `Done`
* `Auto Last Run` (Date) = `{{now}}`
* `Next Action` = `Binder ready — proceed to serve/attach/escalate as needed`

---

### Module 16 — Notion: **Search objects** (Evidence Log for this case)

**Configuration:**
* **Database:** `{{3.notion._placeholders.db_evidence_id}}`
* **Filter:** `Case` relation contains `{{case_page_id}}`
* **Limit:** 100

---

### Module 17 — Tools: **Set variables** (Next Exhibit Code)

**Set:**
* `e_count = {{length(16.results)}}`
* `exhibit_num = {{add(e_count; 1)}}`
* `exhibit_code = {{concat("EX-"; padLeft(toString(exhibit_num); 2; "0"))}}`

---

### Module 18 — Notion: **Create a database item** (Evidence Log entry)

**Configuration:**
* **Database:** `{{3.notion._placeholders.db_evidence_id}}`

**Set:**
* `EvidenceID` (Title) = `{{case_id}}_BINDER_{{formatDate(now; "YYYY-MM-DD")}}`
* `Case` (Relation) = `{{case_page_id}}`
* `Exhibit Code` = `{{exhibit_code}}`
* `Title` = `Binder PDF — {{case_id}}`
* `Source` = `Report`
* `Date` = `{{now}}`
* `File` (URL) = `{{binder_link}}`
* `Notes` = `Binder outbox ingest (ready marker) | File: {{pdf_name}}\n{{sha_note}}`

---

### Module 19 (Optional) — Notion: **Search and update queue item**

Similar to BINDER_OUTBOX_COMPLETE_v1 Modules 25-26.

---

### Module 20 — Google Drive: **Move files to archive**

**Module 20-1: Move PDF**
* **File ID:** `{{pdf_file_id}}`
* **Destination:** `{{3.drive._placeholders.binder_archive_folder_id}}`
* **Rename:** `{{case_id}}_BINDER_COMPLETE_{{formatDate(now; "YYYY-MM-DD")}}.pdf`

**Module 20-2: Move sidecar (if exists)**
* **File ID:** `{{sidecar_id}}`
* **Destination:** `{{3.drive._placeholders.binder_archive_folder_id}}`
* **Condition:** `sidecar_id is not empty`

**Module 20-3: Move ready marker**
* **File ID:** `{{ready_marker_id}}`
* **Destination:** `{{3.drive._placeholders.binder_archive_folder_id}}`

---

### Module 21 (Optional) — Slack: **Post a message**

**Message:**
```
✅ Binder archived (ready marker): {{case_id}} | Exhibit {{exhibit_code}}
{{binder_link}}
{{sha_note}}
```

---

## Key Differences from BINDER_OUTBOX_COMPLETE_v1

| Aspect | v1 (PDF watching) | Ready Marker |
|--------|-------------------|--------------|
| **Trigger** | Watch for `.pdf` files | Watch for `.ready` files |
| **Race conditions** | Yes (sidecar may not exist) | No (ready = all files present) |
| **Sleep/retry** | Required (10s + 15s retry) | Not needed |
| **Complexity** | Higher (multiple retry routes) | Lower (straightforward flow) |
| **Publisher burden** | Low (just upload files) | Higher (must create ready marker) |
| **Processing time** | 25+ seconds (with waits) | ~5 seconds |
| **Error clarity** | Ambiguous (timing vs. missing) | Clear (missing = error) |

---

## Publisher Implementation Guide

### For SintraPrime or Custom Uploaders

```python
# Pseudocode for publisher
def publish_binder(case_id, pdf_path, sha256_hash):
    # 1. Upload PDF
    pdf_id = drive.upload(
        file=pdf_path,
        name=f"{case_id}_binder.pdf",
        folder=outbox_folder_id
    )
    
    # 2. Create and upload sidecar
    sidecar_content = f"{sha256_hash}  {case_id}_binder.pdf"
    sidecar_id = drive.upload_text(
        content=sidecar_content,
        name=f"{case_id}_binder.pdf.sha256",
        folder=outbox_folder_id
    )
    
    # 3. Create and upload ready marker
    ready_id = drive.upload_text(
        content="",  # or JSON metadata
        name=f"{case_id}_binder.pdf.ready",
        folder=outbox_folder_id
    )
    
    return {
        "pdf_id": pdf_id,
        "sidecar_id": sidecar_id,
        "ready_id": ready_id
    }
```

### Ready Marker Content Options

**Option 1: Empty File**
```
(no content)
```

**Option 2: Metadata JSON**
```json
{
  "case_id": "HTN-1234-5678",
  "generated_at": "2026-01-24T13:00:00Z",
  "generator": "SintraPrime v2.1",
  "pdf_sha256": "abc123...",
  "files": {
    "pdf": "HTN-1234-5678_binder.pdf",
    "sidecar": "HTN-1234-5678_binder.pdf.sha256"
  }
}
```

---

## Error Scenarios

### Ready marker but PDF missing
- **Route:** 8A
- **Action:** Move ready marker to archive with `ERROR_PDF_MISSING_` prefix
- **Notification:** Optional Slack alert
- **Cause:** Publisher failed between sidecar and PDF upload, or file was manually deleted

### Ready marker but sidecar missing
- **Route:** 8B
- **Action:** Continue processing with `sha_note` indicating missing sidecar
- **Result:** Evidence Log entry created without hash verification

### Sidecar filename mismatch
- **Route:** 11B
- **Action:** Set `sha_note` with mismatch warning
- **Result:** Evidence Log entry includes warning

### Case not found
- **Route:** 13A
- **Action:** Move all three files to archive with `UNMATCHED_` prefix
- **Result:** No Notion updates

---

## Testing Checklist

- [ ] Create ready marker, verify trigger fires
- [ ] Test with all three files present and valid
- [ ] Test with ready marker but missing PDF
- [ ] Test with ready marker but missing sidecar
- [ ] Test with sidecar filename mismatch
- [ ] Test with unmatched case ID
- [ ] Verify all three files archived correctly
- [ ] Test concurrent uploads (multiple ready markers)
- [ ] Verify exhibit code sequencing
- [ ] Check queue item updates (if using)
- [ ] Test Slack notifications (if using)

---

## Migration from v1

To migrate from BINDER_OUTBOX_COMPLETE_v1 to Ready Marker approach:

1. **Update Publisher Code**
   - Modify upload logic to create `.ready` marker last
   - Ensure atomic uploads (all files or none)

2. **Update Make Scenario**
   - Change trigger to watch for `.ready` instead of `.pdf`
   - Remove sleep modules (7, 10)
   - Remove retry search module (11)
   - Simplify router logic (fewer routes)
   - Add ready marker archiving

3. **Testing Period**
   - Run both scenarios in parallel temporarily
   - Monitor for issues
   - Switch traffic gradually

4. **Cleanup**
   - Disable old scenario once new one is stable
   - Update documentation
   - Clean up archive folders if needed

---

## Advantages Summary

✅ **No timing dependencies** - Publisher controls when processing starts  
✅ **Faster processing** - No artificial delays  
✅ **Clearer errors** - Missing files are obvious errors  
✅ **Simpler logic** - Fewer routes and conditions  
✅ **Better atomicity** - Ready marker = complete transaction  
✅ **Scalable** - Can handle high-frequency uploads  
✅ **Testable** - Easy to simulate scenarios  

---

## Related Documentation

- [Standard Outbox Scenario](./BINDER_OUTBOX_COMPLETE_v1.md)
- [FieldMap Configuration Template](../config-templates/FieldMap_Manifest.template.json)
- [SHA256 Sidecar Format](./docs/sha256-sidecar-format.md)

---

## Version History

- **v1.0** (2026-01-24): Initial ready marker scenario
