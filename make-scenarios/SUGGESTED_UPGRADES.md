# Suggested Upgrades for Binder Publish & Ingest System

## Overview

This document contains **20 enhancement options** for the binder publish ritual and Make.com ingestion scenario. Pick what fits your needs. These range from simple quality-of-life improvements to court-grade features.

---

## Publishing Upgrades (SintraPrime Side)

### 1. `.lock` File During Publish

**Purpose:** Visual progress indicator for humans without triggering Make.

**Implementation:**
- Create `PDF.lock` at Step 6 (start of OUTBOX operations)
- Delete right before Step 9 (creating `.ready`)
- Make ignores `.lock` files

**Benefit:** Operators can see "publishing in progress" without confusion.

**Example:**
```python
# At start of Step 6
lock_path = f"{OUTBOX}/{PDF}.lock"
with open(lock_path, 'w') as f:
    f.write(f"Publishing started: {datetime.now().isoformat()}\n")

try:
    # ... Steps 6-8 ...
    
    # Before Step 9
    if os.path.exists(lock_path):
        os.remove(lock_path)
    
    # Now create .ready
finally:
    # Cleanup lock on error
    if os.path.exists(lock_path):
        os.remove(lock_path)
```

---

### 2. READY Content as JSON

**Purpose:** Embed metadata in `.ready` file instead of separate sidecar.

**Implementation:**
Replace "ready\n" with:
```json
{
  "case_id": "HTN-2026-0007",
  "generated_at": "2026-01-24T13:00:00Z",
  "generator": "SintraPrime v2.1",
  "pdf_sha256": "abc123...",
  "pdf_name": "HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf",
  "sha256_name": "HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.sha256",
  "config_version": "1.0"
}
```

**Benefit:** 
- Make can skip separate sidecar download
- Single source of truth for metadata
- Easier debugging and auditing

**Make Changes Required:**
- Parse JSON from `.ready` file
- Extract SHA from JSON instead of sidecar
- Optionally still verify separate `.sha256` file if present

---

### 3. OUTBOX Re-Hash Validation (Step 8)

**Purpose:** Catch Drive sync corruption before Make processes.

**Implementation:**
```python
# After Step 7 (files renamed in OUTBOX)
if use_sha:
    # Recompute hash on OUTBOX PDF
    outbox_hash = compute_sha256(f"{OUTBOX}/{PDF}")
    
    # Read hash from sidecar
    with open(f"{OUTBOX}/{SHA}", 'r') as f:
        sidecar_hash = f.read().split()[0].strip().lower()
    
    if outbox_hash != sidecar_hash:
        # Corruption detected!
        cleanup_temps()
        write_error_file(f"SHA mismatch: {outbox_hash} != {sidecar_hash}")
        raise ValueError("Drive sync corruption detected")
```

**Benefit:** 
- Prevents processing corrupted files
- Catches sync issues early
- Maintains data integrity

**Cost:** Adds ~1-5 seconds for large PDFs (worth it for critical cases).

---

### 4. Staging Folder for Atomic Moves

**Purpose:** Even safer atomic operations.

**Implementation:**
- Add intermediate `BinderStage/` folder (same volume as OUTBOX)
- Publish to STAGE first
- Move entire set to OUTBOX as final atomic step

**Example:**
```python
# Publish to STAGE
publish_to_folder(STAGE, pdf, sha)

# Atomic move to OUTBOX
shutil.move(f"{STAGE}/{PDF}", f"{OUTBOX}/{PDF}")
shutil.move(f"{STAGE}/{SHA}", f"{OUTBOX}/{SHA}")

# Now create .ready in OUTBOX
create_ready_marker(f"{OUTBOX}/{READY}")
```

**Benefit:** Filesystem-level atomicity guarantees.

**Note:** Depends on filesystem behavior (works best on local filesystems).

---

### 5. Error Marker Standard

**Purpose:** Structured error reporting for Make to route.

**Implementation:**
On failure, create:
```
OUTBOX/{CaseID}_BINDER_ERROR_{timestamp}.txt
```

**Content Format:**
```json
{
  "case_id": "HTN-2026-0007",
  "creditor": "Verizon",
  "step_failed": "Step 7: Rename PDF in OUTBOX",
  "error_type": "OSError",
  "error_message": "Permission denied",
  "timestamp": "2026-01-24T13:05:30Z",
  "stack_trace": "Traceback...",
  "file_states": {
    "pdf_tmp_exists": true,
    "pdf_exists": false,
    "sha_tmp_exists": false,
    "ready_exists": false
  }
}
```

**Make Enhancement:**
- Watch for `*_ERROR_*.txt` files
- Route to Error Queue in Notion
- Send Slack alert with details
- Move error file to Quarantine

**Benefit:** Structured error handling and automated triage.

---

## Ingestion Upgrades (Make Side)

### 6. Idempotency Lock

**Purpose:** Prevent duplicate processing if `.ready` appears twice.

**Implementation:**
Add to Notion Case database:
- Property: `Last Binder File ID` (Text)

In Make scenario:
```
After finding PDF:
  - Get PDF file ID
  - Check if Case.Last_Binder_File_ID == PDF_file_id
  - If yes: Log "Already processed" and STOP
  - If no: Continue processing
  - After success: Update Case.Last_Binder_File_ID = PDF_file_id
```

**Benefit:** Idempotent processing, safe retries.

---

### 7. Processing Folder

**Purpose:** Prevent re-triggering during processing.

**Implementation:**
- Add `BinderProcessing/` folder
- First action after detecting `.ready`: move to Processing
- Process from Processing folder
- Archive from Processing (not Outbox)

**Flow:**
```
OUTBOX/.ready detected
  ↓
Move to PROCESSING/
  ↓
Make processes (OUTBOX trigger won't re-fire)
  ↓
Archive from PROCESSING/
```

**Benefit:** Clean separation, no re-triggering.

---

### 8. Bundle Archive

**Purpose:** Organized archive structure.

**Implementation:**
Instead of flat archive:
```
BinderArchive/
  HTN-2026-0007/
    2026-01-24_Verizon/
      HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf
      HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.sha256
      HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.ready
```

**Make Changes:**
- Create folder: `{CaseID}/{Date}_{Creditor}/`
- Move all three files into folder
- Keep archive browseable by case

**Benefit:** Easy to find all binders for a case, organized chronologically.

---

### 9. SHA Strict Mode Toggle

**Purpose:** Configurable SHA requirement level.

**FieldMap Addition:**
```json
{
  "settings": {
    "sha": {
      "enabled": true,
      "required": false,
      "strict_match": false
    }
  }
}
```

**Make Logic:**
```
if CFG.settings.sha.required and sha_not_found:
  Set Case.Auto_Status = "Error"
  Set Case.Next_Action = "SHA256 missing - manual review required"
  STOP (don't create Evidence Log)

if CFG.settings.sha.strict_match and sha_mismatch:
  Set Case.Auto_Status = "Error"
  Set Case.Next_Action = "SHA256 mismatch - verify file integrity"
  STOP
```

**Benefit:** Flexible security policies per deployment.

---

### 10. Evidence Notes Templating

**Purpose:** Uniform, structured evidence notes.

**Template:**
```
Binder ingest via ready marker
SHA256: {sha256_or_not_provided}
Source file: {filename}
Outbox timestamp: {ready_detected_time}
Processing timestamp: {now}
Generator: {from_ready_json_if_present}
```

**Benefit:** Consistent audit trail, easy parsing.

---

### 11. Run Ledger

**Purpose:** Complete automation audit trail.

**Implementation:**
Create Notion database: **Automation Runs**

**Schema:**
- Run ID (Auto-number)
- Scenario (Select: BinderOutbox, EvidenceUpload, etc.)
- Trigger Time (Date)
- Case ID (Text, relation to Cases)
- File IDs (Text, JSON)
- Result (Select: Success, Error, Unmatched, etc.)
- Duration (Number, seconds)
- Notes (Text, errors/warnings)

**Make Action:**
Every run creates a row, regardless of success/failure.

**Benefit:** Auditors love receipts. Complete accountability.

---

### 12. Slack Alert Thresholds

**Purpose:** Reduce noise, focus on problems.

**Implementation:**
- Success: No Slack (or daily digest)
- Warnings (missing SHA): Log only
- Errors (unmatched, PDF missing): Immediate Slack
- Critical (Make scenario error): Slack + email

**Digest Example:**
```
Daily Binder Summary (2026-01-24):
✅ 47 successful
⚠️  3 missing SHA
❌ 2 unmatched cases
💥 0 errors
```

**Benefit:** Signal over noise.

---

## Governance Upgrades (FieldMap / Standards)

### 13. Central Config Flags

**Purpose:** Single source of truth for all scenario behaviors.

**FieldMap Addition:**
```json
{
  "settings": {
    "ready": {
      "enabled": true,
      "format": "json"
    },
    "sha": {
      "enabled": true,
      "required": false,
      "strict_match": false
    },
    "archive": {
      "structure": "by_case",
      "retention_days": 2555
    },
    "notifications": {
      "slack_success": false,
      "slack_errors": true,
      "slack_digest": "daily"
    }
  }
}
```

**Benefit:** Change behavior without rebuilding scenarios.

---

### 14. Filename Schema Version

**Purpose:** Support multiple naming conventions.

**FieldMap:**
```json
{
  "settings": {
    "filename_schema_version": "v2"
  }
}
```

**Make Logic:**
```
if CFG.settings.filename_schema_version == "v1":
  case_id_pattern = "HTN-\\d{4}-\\d{4}"
elif CFG.settings.filename_schema_version == "v2":
  case_id_pattern = "HTN-\\d{4}-\\d{4}-[A-Z]{2}"
```

**Benefit:** Graceful migration when standards change.

---

### 15. Exhibit Numbering Policy

**Purpose:** Consistent exhibit code generation.

**FieldMap:**
```json
{
  "settings": {
    "exhibit": {
      "prefix": "EX-",
      "padding": 2,
      "start_number": 1,
      "binder_label": "BINDER"
    }
  }
}
```

**Make Logic:**
```
exhibit_code = CFG.settings.exhibit.prefix + 
               padLeft(exhibit_num, CFG.settings.exhibit.padding, "0")
```

**Benefit:** Easy to change numbering format centrally.

---

### 16. CaseID Regex Constant

**Purpose:** One place to update CaseID validation.

**FieldMap:**
```json
{
  "settings": {
    "case_id_pattern": "HTN-\\d{4}-\\d{4}",
    "case_id_examples": ["HTN-2026-0001", "HTN-9999-9999"]
  }
}
```

**All Scenarios Use:**
```
case_id = match(filename, CFG.settings.case_id_pattern)
```

**Benefit:** Change CaseID format once, all scenarios update.

---

### 17. Quarantine Folder

**Purpose:** Separate problem files from good archives.

**Implementation:**
- Add `System/Quarantine/` folder
- Unmatched cases go here (not Archive)
- Malformed files go here
- Error markers go here

**Folder Structure:**
```
Trust_Vault/System/
  BinderOutbox/      (watched)
  BinderArchive/     (successful only)
  BinderQuarantine/  (problems)
```

**Benefit:** Fast triage, don't pollute archive.

---

## Court-Grade Extras (Optional but Elite)

### 18. Hash Manifest

**Purpose:** Document all evidence exhibit hashes in one file.

**Implementation:**
SintraPrime publishes:
- `HTN-2026-0007_BINDER.pdf`
- `HTN-2026-0007_BINDER.pdf.sha256`
- `HTN-2026-0007_MANIFEST.json`
- `HTN-2026-0007_BINDER.pdf.ready`

**Manifest Content:**
```json
{
  "case_id": "HTN-2026-0007",
  "generated": "2026-01-24T13:00:00Z",
  "exhibits": [
    {
      "code": "EX-01",
      "title": "Credit Report - TransUnion",
      "file": "exhibit_01_credit_report.pdf",
      "sha256": "abc123..."
    },
    {
      "code": "EX-02",
      "title": "Notice of Intent to Sue",
      "file": "exhibit_02_notice.pdf",
      "sha256": "def456..."
    }
  ],
  "binder": {
    "file": "HTN-2026-0007_BINDER.pdf",
    "sha256": "ghi789...",
    "page_count": 147
  }
}
```

**Make Action:**
- Download manifest
- Store manifest link in Evidence Log Notes
- Optionally create individual Evidence entries per exhibit

**Benefit:** Complete chain of custody, exhibit-level tracking.

---

### 19. Signed Manifest

**Purpose:** Cryptographic proof of manifest authenticity.

**Implementation:**
SintraPrime signs manifest with Ed25519:
```
manifest.json
manifest.sig
```

**Signature Generation:**
```python
import nacl.signing
import nacl.encoding

# Sign manifest
signing_key = nacl.signing.SigningKey.from_seed(seed)
signed = signing_key.sign(manifest_json.encode())

# Write signature
with open("manifest.sig", "wb") as f:
    f.write(signed.signature)
```

**Make Action:**
- Download both files
- Verify signature
- Log verification status in Evidence

**Benefit:** Tamper-proof evidence, court admissible.

---

### 20. Timestamp Anchor

**Purpose:** Provable time of binder creation.

**Implementation (Simple):**
Store `completed_at` in READY JSON:
```json
{
  "completed_at": "2026-01-24T13:00:00Z",
  "completed_at_unix": 1737724800
}
```

**Implementation (Advanced):**
Use RFC-3161 Time Stamping Authority:
- Get TSA token for binder PDF
- Include token in manifest
- Make verifies token

**Benefit:** Legal proof of when document existed.

---

## Upgrade Priority Matrix

| Priority | Upgrade | Effort | Impact |
|----------|---------|--------|--------|
| 🔥 High | #6 Idempotency Lock | Low | High |
| 🔥 High | #9 SHA Strict Mode | Low | High |
| 🔥 High | #11 Run Ledger | Medium | High |
| ⚡ Medium | #2 READY JSON | Medium | Medium |
| ⚡ Medium | #7 Processing Folder | Low | Medium |
| ⚡ Medium | #8 Bundle Archive | Medium | Medium |
| ⚡ Medium | #12 Slack Thresholds | Low | Medium |
| ⚡ Medium | #17 Quarantine Folder | Low | Medium |
| 💡 Nice-to-Have | #1 Lock File | Low | Low |
| 💡 Nice-to-Have | #3 Outbox Re-Hash | Low | Medium |
| 💡 Nice-to-Have | #10 Notes Template | Low | Low |
| 💡 Nice-to-Have | #13 Config Flags | Medium | Medium |
| 🎓 Advanced | #18 Hash Manifest | High | High* |
| 🎓 Advanced | #19 Signed Manifest | High | High* |
| 🎓 Advanced | #20 Timestamp Anchor | High | High* |

*High impact for legal/court cases only.

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] #6 Idempotency Lock
- [ ] #11 Run Ledger
- [ ] #17 Quarantine Folder

### Phase 2: Reliability (Week 3-4)
- [ ] #9 SHA Strict Mode
- [ ] #7 Processing Folder
- [ ] #12 Slack Thresholds

### Phase 3: Organization (Week 5-6)
- [ ] #8 Bundle Archive
- [ ] #13 Config Flags
- [ ] #10 Notes Template

### Phase 4: Advanced (Month 2+)
- [ ] #2 READY JSON
- [ ] #18 Hash Manifest
- [ ] #3 Outbox Re-Hash
- [ ] #19 Signed Manifest (if needed)

---

## Related Documentation

- [Ritual Specification](./SINTRAPRIME_READY_RITUAL.md)
- [Make Scenario](./BINDER_OUTBOX_READY_MARKER_v1.md)
- [Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md)
- [Test Harness](./TEST_HARNESS.md)

---

## Version History

- **v1.0** (2026-01-24): Initial 20 suggested upgrades
