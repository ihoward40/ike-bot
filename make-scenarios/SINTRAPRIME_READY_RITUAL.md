# SINTRAPRIME `.ready` Publish Ritual (v1.0)

## Goal

Guarantee that when Make sees:

`{pdf}.ready`

…the following are already true in **BinderOutbox**:

* `{pdf}` exists and is final (not partial)
* `{pdf}.sha256` exists and matches the PDF *(if you're using it)*
* No temp files remain

This is the "no false-ready" ceremony that prevents Make from processing incomplete uploads.

---

## Required Paths

### WORK DIR (local, not watched)
`...\work\binders\{CaseID}\`

**Purpose:** Local working directory for rendering binder. Not synced to Drive, not watched by Make.

### OUTBOX (watched / Drive-synced)
`Trust_Vault/System/BinderOutbox/`

**Purpose:** Watched folder where Make.com triggers fire. Files must only appear here when complete.

### STAGE DIR (optional, same volume as Outbox)
`Trust_Vault/System/BinderStage/`

**Purpose:** Optional staging directory for atomic moves. Not strictly required but makes operations safer.

---

## Canonical Filenames

Let:

* `PDF = {CaseID}_BINDER_{CreditorSlug}_{YYYY-MM-DD}.pdf`
* `SHA = {PDF}.sha256`
* `READY = {PDF}.ready`

### Temp Names

* `PDF_TMP = {PDF}.tmp`
* `SHA_TMP = {SHA}.tmp`
* `READY_TMP = {READY}.tmp`

### Example

For case `HTN-2026-0007` with creditor Verizon on 2026-01-24:

* `PDF = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf`
* `SHA = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.sha256`
* `READY = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.ready`

Temp files:
* `PDF_TMP = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.tmp`
* `SHA_TMP = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.sha256.tmp`
* `READY_TMP = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.ready.tmp`

---

## Ritual Steps (Execute in This Order)

### Step 1 — Render binder into WORK as `.tmp`

**Write** the binder output to:

```
WORK/{PDF_TMP}
```

**Rules:**
* Write in one stream
* Flush and close file handle
* Confirm file size > 0

**Example:**
```python
# Pseudocode
pdf_content = render_binder(case_data)
with open(f"{WORK_DIR}/{PDF_TMP}", 'wb') as f:
    f.write(pdf_content)
    f.flush()
    os.fsync(f.fileno())

assert os.path.getsize(f"{WORK_DIR}/{PDF_TMP}") > 0
```

---

### Step 2 — Finalize PDF in WORK (rename `.tmp` → final)

Rename:

```
WORK/{PDF_TMP} → WORK/{PDF}
```

**Why:** File renames are atomic on the same filesystem, so you never end up with a half-final PDF.

**Example:**
```python
os.rename(f"{WORK_DIR}/{PDF_TMP}", f"{WORK_DIR}/{PDF}")
```

---

### Step 3 — Compute SHA256 from the finalized WORK PDF

**(Optional but recommended)**

Compute SHA-256 of:

```
WORK/{PDF}
```

**Output:** `sha256hex` (lowercase)

**Example:**
```python
import hashlib

def compute_sha256(filepath):
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest().lower()

sha256hex = compute_sha256(f"{WORK_DIR}/{PDF}")
```

---

### Step 4 — Write SHA sidecar as `.tmp` in WORK

**(Optional, do this only if Step 3 was performed)**

Write:

```
WORK/{SHA_TMP}
```

**Content exactly:**
```
<sha256hex>  <PDF>
```

Note: Two spaces between hash and filename.

**Flush + close.**

**Example:**
```python
sidecar_content = f"{sha256hex}  {PDF}\n"
with open(f"{WORK_DIR}/{SHA_TMP}", 'w') as f:
    f.write(sidecar_content)
    f.flush()
    os.fsync(f.fileno())
```

---

### Step 5 — Finalize SHA in WORK (rename `.tmp` → final)

Rename:

```
WORK/{SHA_TMP} → WORK/{SHA}
```

**Example:**
```python
os.rename(f"{WORK_DIR}/{SHA_TMP}", f"{WORK_DIR}/{SHA}")
```

---

### Step 6 — Copy files into OUTBOX using temp names

Now publish to the watched folder **without ever creating final names directly**.

**Copy:**

```
WORK/{PDF} → OUTBOX/{PDF_TMP}
```

If using SHA:

```
WORK/{SHA} → OUTBOX/{SHA_TMP}
```

**Rules:**
* After copy, confirm file exists at destination
* Confirm destination file size equals source size (or at least > 0 for SHA)
* **Close all handles**

**Example:**
```python
import shutil

# Copy PDF
shutil.copy2(f"{WORK_DIR}/{PDF}", f"{OUTBOX_DIR}/{PDF_TMP}")
assert os.path.exists(f"{OUTBOX_DIR}/{PDF_TMP}")
assert os.path.getsize(f"{OUTBOX_DIR}/{PDF_TMP}") == os.path.getsize(f"{WORK_DIR}/{PDF}")

# Copy SHA (if using)
if sha256hex:
    shutil.copy2(f"{WORK_DIR}/{SHA}", f"{OUTBOX_DIR}/{SHA_TMP}")
    assert os.path.exists(f"{OUTBOX_DIR}/{SHA_TMP}")
    assert os.path.getsize(f"{OUTBOX_DIR}/{SHA_TMP}") > 0
```

---

### Step 7 — Finalize OUTBOX files (rename temp → final)

Rename in OUTBOX:

```
OUTBOX/{PDF_TMP} → OUTBOX/{PDF}
```

If using SHA:

```
OUTBOX/{SHA_TMP} → OUTBOX/{SHA}
```

**This step is critical:** Make won't see the final name until rename completes.

**Example:**
```python
os.rename(f"{OUTBOX_DIR}/{PDF_TMP}", f"{OUTBOX_DIR}/{PDF}")

if sha256hex:
    os.rename(f"{OUTBOX_DIR}/{SHA_TMP}", f"{OUTBOX_DIR}/{SHA}")
```

---

### Step 8 — Write READY marker last (two-step)

This is the **"no false-ready" guarantee**.

**1. Write:**

```
OUTBOX/{READY_TMP}
```

With content:
```
ready
```

Flush + close.

**2. Rename:**

```
OUTBOX/{READY_TMP} → OUTBOX/{READY}
```

✅ **Only after this rename should Make ever trigger.**

**Example:**
```python
# Write ready marker as temp
with open(f"{OUTBOX_DIR}/{READY_TMP}", 'w') as f:
    f.write("ready\n")
    f.flush()
    os.fsync(f.fileno())

# Atomic rename to final
os.rename(f"{OUTBOX_DIR}/{READY_TMP}", f"{OUTBOX_DIR}/{READY}")
```

---

## Safety Checks (Recommended and Fast)

### Check A — Verify OUTBOX PDF size

**Before creating READY marker:**

* Ensure `OUTBOX/{PDF}` exists
* Ensure size > (some sane minimum, e.g., 50 KB) to avoid "empty binder" failures

**Example:**
```python
MIN_BINDER_SIZE = 50 * 1024  # 50 KB

pdf_path = f"{OUTBOX_DIR}/{PDF}"
assert os.path.exists(pdf_path), f"PDF not found: {pdf_path}"

pdf_size = os.path.getsize(pdf_path)
assert pdf_size > MIN_BINDER_SIZE, f"PDF too small: {pdf_size} bytes"
```

---

### Check B — Verify SHA matches (if SHA enabled)

**Before creating READY marker:**

* Recompute SHA256 on `OUTBOX/{PDF}` (or trust WORK if you're confident)
* Confirm equals the value in `OUTBOX/{SHA}`

**If mismatch:**
* Delete `OUTBOX/{READY}` if created (or don't create it at all)
* Write an error file instead (see Error Protocol below)

**Example:**
```python
if sha256hex:
    # Read sidecar
    with open(f"{OUTBOX_DIR}/{SHA}", 'r') as f:
        sidecar_content = f.read().strip()
    
    # Parse hash from sidecar (format: "hash  filename")
    sidecar_hash = sidecar_content.split()[0].lower()
    
    # Recompute hash on outbox PDF
    outbox_hash = compute_sha256(f"{OUTBOX_DIR}/{PDF}")
    
    if sidecar_hash != outbox_hash:
        raise ValueError(f"SHA256 mismatch: {sidecar_hash} != {outbox_hash}")
```

---

## Error Protocol (Never Poison Outbox)

If anything fails before READY:

1. **Delete any temp files left in OUTBOX:**
   * `{PDF}.tmp`
   * `{SHA}.tmp`
   * `{READY}.tmp`

2. **Do NOT leave a `.ready`**

3. **Instead write:**
   ```
   OUTBOX/{CaseID}_BINDER_ERROR_{YYYY-MM-DDTHH-mm-ss}.txt
   ```

**Suggested content:**

```
ERROR: Binder publish failed

CaseID: {CaseID}
Creditor: {Creditor}
Step Failed: {step_name}
Error Message: {error_message}
Timestamp: {YYYY-MM-DDTHH:mm:ss}

Stack Trace:
{stack_trace}
```

**Example:**
```python
import traceback
from datetime import datetime

def write_error_file(case_id, creditor, step_name, error):
    timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
    error_filename = f"{case_id}_BINDER_ERROR_{timestamp}.txt"
    
    error_content = f"""ERROR: Binder publish failed

CaseID: {case_id}
Creditor: {creditor}
Step Failed: {step_name}
Error Message: {str(error)}
Timestamp: {datetime.now().isoformat()}

Stack Trace:
{traceback.format_exc()}
"""
    
    with open(f"{OUTBOX_DIR}/{error_filename}", 'w') as f:
        f.write(error_content)
    
    # Cleanup any temp files
    for temp_file in [f"{PDF_TMP}", f"{SHA_TMP}", f"{READY_TMP}"]:
        temp_path = f"{OUTBOX_DIR}/{temp_file}"
        if os.path.exists(temp_path):
            os.remove(temp_path)
```

---

## Optional Upgrade: `.lock` file (for human debugging)

If you want visible progress during publish without triggering Make:

* **Create** `OUTBOX/{PDF}.lock` at the start of Step 6
* **Delete** it right before Step 8

Make ignores `.lock`, humans can see "publishing in progress."

**Example:**
```python
# At start of Step 6
lock_path = f"{OUTBOX_DIR}/{PDF}.lock"
with open(lock_path, 'w') as f:
    f.write(f"Publishing started: {datetime.now().isoformat()}\n")

try:
    # ... perform Steps 6-7 ...
    
    # Before Step 8
    if os.path.exists(lock_path):
        os.remove(lock_path)
    
    # Now do Step 8 (create .ready)
    # ...
    
except Exception as e:
    # Cleanup lock on error
    if os.path.exists(lock_path):
        os.remove(lock_path)
    raise
```

---

## Minimal Version (Still Safe)

If you want the simplest ritual that still avoids false-ready:

1. Write PDF in WORK as `.tmp`, rename to `.pdf`
2. Copy to OUTBOX as `.tmp`, rename to `.pdf`
3. Write `.ready` last (write `.tmp`, rename)

Even without SHA, this is solid.

**Pseudocode:**
```python
# Step 1-2: Create PDF in WORK
write(f"{WORK}/{PDF}.tmp")
rename(f"{WORK}/{PDF}.tmp", f"{WORK}/{PDF}")

# Step 6-7: Copy to OUTBOX
copy(f"{WORK}/{PDF}", f"{OUTBOX}/{PDF}.tmp")
rename(f"{OUTBOX}/{PDF}.tmp", f"{OUTBOX}/{PDF}")

# Step 8: Create READY
write(f"{OUTBOX}/{READY}.tmp", "ready")
rename(f"{OUTBOX}/{READY}.tmp", f"{OUTBOX}/{READY}")
```

---

## Make-side Rule (To Match Ritual)

Make watches:

* `*.ready`

Then it derives:

* PDF = remove `.ready`
* SHA = PDF + `.sha256`

And processes only after confirming PDF exists.

See: [BINDER_OUTBOX_READY_v1.md](./BINDER_OUTBOX_READY_MARKER_v1.md)

---

## Implementation Checklist

Developer checklist for implementing this ritual:

- [ ] Create WORK directory structure
- [ ] Create OUTBOX directory structure
- [ ] Implement Step 1-2: Render PDF with `.tmp` → rename pattern
- [ ] Implement Step 3-5: SHA256 computation and sidecar (if using)
- [ ] Implement Step 6-7: Copy to OUTBOX with `.tmp` → rename pattern
- [ ] Implement Step 8: READY marker with `.tmp` → rename pattern
- [ ] Implement Safety Check A: Minimum PDF size validation
- [ ] Implement Safety Check B: SHA256 verification (if using)
- [ ] Implement Error Protocol: Cleanup and error file creation
- [ ] Add `.lock` file support (optional)
- [ ] Test with interruption scenarios (see Test Harness below)

---

## Test Harness Plan

To verify the ritual prevents false-ready scenarios:

### Test 1: Interrupt During PDF Copy
1. Start publish process
2. Kill process during Step 6 (PDF copy)
3. Verify: OUTBOX contains `{PDF}.tmp` but no `.ready`
4. Verify: Make does not trigger
5. Cleanup: Remove `.tmp` file

### Test 2: Interrupt During SHA Copy
1. Start publish process
2. Kill process during Step 6 (SHA copy)
3. Verify: OUTBOX contains `{PDF}` and possibly `{SHA}.tmp` but no `.ready`
4. Verify: Make does not trigger
5. Cleanup: Remove files

### Test 3: Interrupt Before READY Rename
1. Start publish process
2. Kill process after writing `{READY}.tmp` but before rename
3. Verify: OUTBOX contains `{PDF}`, `{SHA}`, and `{READY}.tmp` but no `{READY}`
4. Verify: Make does not trigger
5. Cleanup: Remove files

### Test 4: SHA Mismatch
1. Corrupt PDF after copying to OUTBOX (before Safety Check B)
2. Verify: Safety Check B fails
3. Verify: No `.ready` file created
4. Verify: Error file written
5. Verify: Make does not trigger

### Test 5: Complete Success
1. Run full publish process
2. Verify: `{PDF}`, `{SHA}`, and `{READY}` all exist in OUTBOX
3. Verify: Make triggers and processes files
4. Verify: All files archived correctly

### Test 6: Concurrent Publishes
1. Start two publish processes for different cases simultaneously
2. Verify: Both complete without interference
3. Verify: Make triggers twice with correct files

---

## Full Example Implementation (Python)

```python
import os
import shutil
import hashlib
import traceback
from datetime import datetime
from pathlib import Path

class BinderPublisher:
    def __init__(self, work_dir, outbox_dir, min_size=50*1024):
        self.work_dir = Path(work_dir)
        self.outbox_dir = Path(outbox_dir)
        self.min_size = min_size
    
    def compute_sha256(self, filepath):
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest().lower()
    
    def publish(self, case_id, creditor, pdf_content, use_sha=True):
        """
        Publish binder with no-false-ready guarantee.
        
        Args:
            case_id: Case ID (e.g., "HTN-2026-0007")
            creditor: Creditor slug (e.g., "Verizon")
            pdf_content: PDF binary content
            use_sha: Whether to create SHA256 sidecar
        """
        date_str = datetime.now().strftime("%Y-%m-%d")
        pdf_name = f"{case_id}_BINDER_{creditor}_{date_str}.pdf"
        sha_name = f"{pdf_name}.sha256"
        ready_name = f"{pdf_name}.ready"
        
        try:
            # Step 1: Write PDF to WORK as .tmp
            pdf_tmp = self.work_dir / f"{pdf_name}.tmp"
            with open(pdf_tmp, 'wb') as f:
                f.write(pdf_content)
                f.flush()
                os.fsync(f.fileno())
            
            assert pdf_tmp.stat().st_size > 0, "PDF file is empty"
            
            # Step 2: Rename to final in WORK
            pdf_work = self.work_dir / pdf_name
            os.rename(pdf_tmp, pdf_work)
            
            sha256hex = None
            if use_sha:
                # Step 3: Compute SHA256
                sha256hex = self.compute_sha256(pdf_work)
                
                # Step 4: Write SHA sidecar as .tmp
                sha_tmp = self.work_dir / f"{sha_name}.tmp"
                with open(sha_tmp, 'w') as f:
                    f.write(f"{sha256hex}  {pdf_name}\n")
                    f.flush()
                    os.fsync(f.fileno())
                
                # Step 5: Rename to final in WORK
                sha_work = self.work_dir / sha_name
                os.rename(sha_tmp, sha_work)
            
            # Step 6: Copy to OUTBOX as .tmp
            pdf_outbox_tmp = self.outbox_dir / f"{pdf_name}.tmp"
            shutil.copy2(pdf_work, pdf_outbox_tmp)
            assert pdf_outbox_tmp.exists()
            assert pdf_outbox_tmp.stat().st_size == pdf_work.stat().st_size
            
            if use_sha:
                sha_outbox_tmp = self.outbox_dir / f"{sha_name}.tmp"
                shutil.copy2(sha_work, sha_outbox_tmp)
                assert sha_outbox_tmp.exists()
            
            # Step 7: Rename to final in OUTBOX
            pdf_outbox = self.outbox_dir / pdf_name
            os.rename(pdf_outbox_tmp, pdf_outbox)
            
            if use_sha:
                sha_outbox = self.outbox_dir / sha_name
                os.rename(sha_outbox_tmp, sha_outbox)
            
            # Safety Check A: Verify PDF size
            assert pdf_outbox.stat().st_size > self.min_size, \
                f"PDF too small: {pdf_outbox.stat().st_size} bytes"
            
            # Safety Check B: Verify SHA matches (if using)
            if use_sha:
                outbox_hash = self.compute_sha256(pdf_outbox)
                assert outbox_hash == sha256hex, \
                    f"SHA256 mismatch: {sha256hex} != {outbox_hash}"
            
            # Step 8: Create READY marker
            ready_tmp = self.outbox_dir / f"{ready_name}.tmp"
            with open(ready_tmp, 'w') as f:
                f.write("ready\n")
                f.flush()
                os.fsync(f.fileno())
            
            ready_outbox = self.outbox_dir / ready_name
            os.rename(ready_tmp, ready_outbox)
            
            print(f"✅ Published: {pdf_name}")
            return {
                "pdf": str(pdf_outbox),
                "sha": str(sha_outbox) if use_sha else None,
                "ready": str(ready_outbox)
            }
            
        except Exception as e:
            # Error Protocol: Cleanup and write error file
            self._cleanup_temps(pdf_name, sha_name, ready_name)
            self._write_error_file(case_id, creditor, e)
            raise
    
    def _cleanup_temps(self, pdf_name, sha_name, ready_name):
        """Remove any temp files from OUTBOX."""
        for temp_name in [f"{pdf_name}.tmp", f"{sha_name}.tmp", f"{ready_name}.tmp"]:
            temp_path = self.outbox_dir / temp_name
            if temp_path.exists():
                temp_path.unlink()
    
    def _write_error_file(self, case_id, creditor, error):
        """Write error file to OUTBOX."""
        timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
        error_filename = f"{case_id}_BINDER_ERROR_{timestamp}.txt"
        
        error_content = f"""ERROR: Binder publish failed

CaseID: {case_id}
Creditor: {creditor}
Error Message: {str(error)}
Timestamp: {datetime.now().isoformat()}

Stack Trace:
{traceback.format_exc()}
"""
        
        error_path = self.outbox_dir / error_filename
        with open(error_path, 'w') as f:
            f.write(error_content)
        
        print(f"❌ Error file created: {error_filename}")


# Usage example
if __name__ == "__main__":
    publisher = BinderPublisher(
        work_dir="/path/to/work/binders",
        outbox_dir="/path/to/Trust_Vault/System/BinderOutbox"
    )
    
    # Generate or load PDF content
    pdf_content = b"%PDF-1.4..."  # Your PDF bytes
    
    # Publish with no-false-ready guarantee
    result = publisher.publish(
        case_id="HTN-2026-0007",
        creditor="Verizon",
        pdf_content=pdf_content,
        use_sha=True
    )
    
    print(f"Published files: {result}")
```

---

## Related Documentation

- [BINDER_OUTBOX_READY_v1 Make Scenario](./BINDER_OUTBOX_READY_MARKER_v1.md)
- [Make.com Scenarios Overview](./README.md)
- [FieldMap Configuration](../config-templates/FieldMap_Manifest.template.json)

---

## Version History

- **v1.0** (2026-01-24): Initial publish ritual specification
