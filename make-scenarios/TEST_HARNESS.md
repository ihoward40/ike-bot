# Test Harness Plan: Prove Make Never Processes Early

## Overview

This test harness verifies that the `.ready` publish ritual prevents Make.com from processing incomplete uploads. The goal: **zero** Make runs occur without `.ready`, and **zero** Case updates happen unless PDF exists and CaseID resolves.

---

## Setup

### Prerequisites

**Make Scenario:**
- Watches `BinderOutbox/` for `*.ready` files
- Logs all runs to Slack or Notion "Automation Runs" database
- Implements error handling per spec

**Local Paths:**
- `WORK/` - Local working directory (not synced)
- `OUTBOX/` - Google Drive synced folder (watched by Make)
- `ARCHIVE/` - Archive folder for processed files

**Test Infrastructure:**
- Fake binder generator that creates large files (200-500MB) for realistic timing
- Process killer utility for interruption tests
- Log parser to verify Make trigger counts
- Notion/Slack monitor to check automation runs

---

## Test Suite

### Test 1: Happy Path

**Goal:** Verify complete success flow.

**Steps:**
1. Generate test PDF (200MB)
2. Run publish ritual with SHA enabled
3. Write PDF → SHA → READY in correct order

**Expected Results:**
- ✅ Make triggers exactly once
- ✅ SHA256 logged correctly
- ✅ All three files (PDF, SHA, READY) archived together
- ✅ Case updated in Notion
- ✅ Evidence Log entry created
- ✅ No error files in OUTBOX

**Pass Criteria:**
- Make execution count = 1
- Case `Auto Status` = "Done"
- Evidence Log contains correct SHA256

---

### Test 2: Interrupted Mid-Copy

**Goal:** Prove no early trigger on incomplete copy.

**Steps:**
1. Start copying `OUTBOX/PDF.tmp`
2. Kill process at 50% progress
3. Verify state of OUTBOX

**Expected Results:**
- ✅ `PDF.tmp` exists (partial file)
- ✅ No `.ready` file exists
- ✅ Make does NOT trigger
- ✅ No Case updates
- ✅ No Evidence Log entries

**Pass Criteria:**
- Make execution count = 0
- OUTBOX contains only `.tmp` file
- Logs show no Make activity

---

### Test 3: False-Ready Attempt

**Goal:** Verify Make handles manually created `.ready` gracefully.

**Steps:**
1. Manually create `.ready` file before PDF exists
2. Wait for Make trigger
3. Verify error handling

**Expected Results:**
- ✅ Make triggers (detects `.ready`)
- ✅ PDF check fails (PDF doesn't exist)
- ✅ `.ready` archived as `PDF_MISSING_*` or moved to quarantine
- ✅ Error logged to Slack/Notion
- ✅ No Case update

**Pass Criteria:**
- Make execution count = 1
- Execution status = "Failed - PDF Missing"
- No Case `Auto Status` change

---

### Test 4: Temp Rename Failure

**Goal:** Verify `.ready` never appears if rename fails.

**Steps:**
1. Copy succeeds: `PDF.tmp` exists in OUTBOX
2. Block rename operation (keep file handle open)
3. Attempt to rename `PDF.tmp → PDF`
4. Verify state

**Expected Results:**
- ✅ `PDF.tmp` remains in OUTBOX
- ✅ Rename fails with error
- ✅ `.ready` never created
- ✅ Make does NOT trigger
- ✅ Error file written

**Pass Criteria:**
- Make execution count = 0
- Error file exists with "rename failed" message
- No `.ready` file present

---

### Test 5: SHA Mismatch

**Goal:** Verify SHA validation catches corruption.

**Steps:**
1. Publish PDF normally
2. Write incorrect SHA256 value in sidecar
3. Complete with `.ready` file

**Expected Results:**
- ✅ Make triggers
- ✅ SHA parsed successfully
- ✅ Evidence Log shows `PARSE_MISMATCH` or `SHA_FAIL` note
- ✅ Files still archived
- ✅ Case updated with warning in Notes

**Pass Criteria:**
- Make execution count = 1
- Evidence Log Notes contains "PARSE_MISMATCH" or "SHA256: <hash>"
- Case updated despite mismatch

**Alternative (if Step 8 validation enabled):**
- ✅ Validation catches mismatch before `.ready`
- ✅ No `.ready` created
- ✅ Error file written
- ✅ Make does NOT trigger

---

### Test 6: Missing SHA

**Goal:** Verify optional SHA works correctly.

**Steps:**
1. Publish PDF only (no SHA file)
2. Create `.ready` marker

**Expected Results:**
- ✅ Make triggers
- ✅ PDF found and processed
- ✅ Evidence Log shows `SHA256: not provided`
- ✅ Case updated successfully
- ✅ Files archived

**Pass Criteria:**
- Make execution count = 1
- Evidence Log Notes = "SHA256: not provided"
- Case `Auto Status` = "Done"

---

### Test 7: Duplicate Ready

**Goal:** Verify idempotency (no double processing).

**Steps:**
1. Publish complete binder (PDF + SHA + READY)
2. Make processes and archives
3. Manually copy same `.ready` file back to OUTBOX
4. Wait for Make trigger

**Expected Results:**
- ✅ First trigger: processes successfully
- ✅ Second trigger: detects duplicate (if idempotency enabled)
- ✅ No duplicate Evidence Log entry
- ✅ Logs show "already processed" message

**Pass Criteria:**
- Make execution count = 2
- Evidence Log entry count = 1 (not 2)
- Second run logs "duplicate detected" or similar

**Note:** Requires idempotency implementation (see SUGGESTED_UPGRADES.md).

---

### Test 8: Case Not Found

**Goal:** Verify unmatched CaseID handling.

**Steps:**
1. Publish binder with CaseID that doesn't exist in Notion
2. Complete with `.ready` marker

**Expected Results:**
- ✅ Make triggers
- ✅ PDF and CaseID extracted successfully
- ✅ Notion search returns no results
- ✅ Files archived with `UNMATCHED_` prefix
- ✅ Slack notification sent (if configured)
- ✅ No Case update (case doesn't exist)

**Pass Criteria:**
- Make execution count = 1
- Files in archive: `UNMATCHED_{PDF}`, `UNMATCHED_{SHA}`, etc.
- Slack message contains "Case not found: {CaseID}"

---

### Test 9: Drive Latency

**Goal:** Verify scenario works despite sync delays.

**Steps:**
1. Publish PDF to OUTBOX
2. Wait 10 seconds
3. Publish SHA to OUTBOX
4. Wait 30 seconds (simulate Drive sync delay)
5. Publish `.ready` marker

**Expected Results:**
- ✅ Make triggers after `.ready` appears
- ✅ All files found (despite staggered uploads)
- ✅ Processing succeeds
- ✅ No retry needed

**Pass Criteria:**
- Make execution count = 1
- Processing succeeds without errors
- Total time < 60 seconds from `.ready` to archive

---

### Test 10: Regression Soak

**Goal:** Verify stability over many iterations.

**Steps:**
1. Create 50 unique test binders (different CaseIDs)
2. Run publish ritual for all 50
3. Space publishes by 10-30 seconds (realistic timing)
4. Run overnight or over several hours

**Expected Results:**
- ✅ 50 Make runs (one per binder)
- ✅ 50 successful processes
- ✅ 0 early triggers (before `.ready`)
- ✅ 0 orphaned `.tmp` files in OUTBOX
- ✅ 50 Evidence Log entries created
- ✅ All files properly archived

**Pass Criteria:**
- Make execution count = 50
- Success rate = 100%
- OUTBOX contains 0 files (all archived)
- No `.tmp` or error files remain

---

## Pass/Fail Criteria Summary

### Overall Suite Pass Requires:

- ✅ **Zero** Make runs occur without `.ready`
- ✅ **Zero** Case updates happen unless PDF exists and CaseID resolves
- ✅ Archives always contain coherent sets (PDF + READY + SHA when present)
- ✅ Error files written for all failure cases
- ✅ No orphaned `.tmp` files after any test
- ✅ Idempotency works (Test 7, if implemented)
- ✅ All 10 tests pass individually

---

## Test Automation Script Template

### Python Example

```python
import os
import time
import subprocess
import shutil
from pathlib import Path

class BinderTestHarness:
    def __init__(self, work_dir, outbox_dir, archive_dir):
        self.work_dir = Path(work_dir)
        self.outbox_dir = Path(outbox_dir)
        self.archive_dir = Path(archive_dir)
        self.results = {}
    
    def setup(self):
        """Prepare test environment."""
        self.work_dir.mkdir(exist_ok=True)
        # Clean OUTBOX before tests
        for f in self.outbox_dir.glob("*"):
            f.unlink()
    
    def teardown(self):
        """Clean up after tests."""
        # Archive logs, cleanup temp files
        pass
    
    def test_1_happy_path(self):
        """Test complete success flow."""
        case_id = "HTN-9999-0001"
        pdf_content = self.generate_fake_pdf(size_mb=200)
        
        # Run publish ritual
        result = self.publish_binder(case_id, "TestCreditor", pdf_content)
        
        # Wait for Make to process
        time.sleep(30)
        
        # Verify
        assert self.count_make_runs(case_id) == 1
        assert self.check_case_status(case_id) == "Done"
        assert self.check_evidence_log_exists(case_id)
        
        self.results["test_1"] = "PASS"
    
    def test_2_interrupted_mid_copy(self):
        """Test interruption during copy."""
        case_id = "HTN-9999-0002"
        pdf_content = self.generate_fake_pdf(size_mb=200)
        
        # Start publish in subprocess
        proc = subprocess.Popen([
            "python", "publish_binder.py",
            "--case-id", case_id,
            "--work", str(self.work_dir),
            "--outbox", str(self.outbox_dir)
        ])
        
        # Wait for copy to start
        time.sleep(2)
        
        # Kill process
        proc.kill()
        proc.wait()
        
        # Verify
        time.sleep(10)
        assert self.count_make_runs(case_id) == 0
        assert not (self.outbox_dir / f"{case_id}_BINDER_*.ready").exists()
        assert (self.outbox_dir / f"{case_id}_BINDER_*.pdf.tmp").exists()
        
        self.results["test_2"] = "PASS"
    
    def test_3_false_ready(self):
        """Test manually created .ready file."""
        case_id = "HTN-9999-0003"
        
        # Create .ready without PDF
        ready_file = self.outbox_dir / f"{case_id}_BINDER_Test_2026-01-24.pdf.ready"
        ready_file.write_text("ready\n")
        
        # Wait for Make
        time.sleep(30)
        
        # Verify
        assert self.count_make_runs(case_id) == 1
        assert not ready_file.exists()  # Should be archived
        assert not self.check_case_updated(case_id)
        
        self.results["test_3"] = "PASS"
    
    # ... implement remaining tests ...
    
    def run_all_tests(self):
        """Run complete test suite."""
        tests = [
            self.test_1_happy_path,
            self.test_2_interrupted_mid_copy,
            self.test_3_false_ready,
            # ... add all 10 tests ...
        ]
        
        self.setup()
        
        for test in tests:
            try:
                print(f"Running {test.__name__}...")
                test()
                print(f"✅ {test.__name__} PASSED")
            except AssertionError as e:
                print(f"❌ {test.__name__} FAILED: {e}")
                self.results[test.__name__] = f"FAIL: {e}"
            except Exception as e:
                print(f"💥 {test.__name__} ERROR: {e}")
                self.results[test.__name__] = f"ERROR: {e}"
        
        self.teardown()
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary."""
        total = len(self.results)
        passed = sum(1 for r in self.results.values() if r == "PASS")
        
        print("\n" + "="*50)
        print(f"TEST SUITE SUMMARY: {passed}/{total} PASSED")
        print("="*50)
        
        for test, result in self.results.items():
            status = "✅" if result == "PASS" else "❌"
            print(f"{status} {test}: {result}")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED!")
        else:
            print(f"\n⚠️  {total - passed} TEST(S) FAILED")


if __name__ == "__main__":
    harness = BinderTestHarness(
        work_dir="/path/to/work",
        outbox_dir="/path/to/outbox",
        archive_dir="/path/to/archive"
    )
    harness.run_all_tests()
```

---

## Monitoring Tools

### Notion Query for Automation Runs
```
Database: Automation Runs
Filter: 
  - Created Time: Last 24 hours
  - Scenario: BINDER_OUTBOX_READY
Group by: Result Status
```

### Slack Alert Parser
```python
def parse_slack_alerts(channel_id, start_time):
    """Count Make alerts in time window."""
    messages = slack_client.conversations_history(
        channel=channel_id,
        oldest=start_time
    )
    
    return {
        "total_runs": len([m for m in messages if "Binder" in m["text"]]),
        "errors": len([m for m in messages if "⚠️" in m["text"]]),
        "success": len([m for m in messages if "✅" in m["text"]])
    }
```

---

## Manual Testing Checklist

For manual verification without automation:

- [ ] Test 1: Happy path - Publish complete binder, verify success
- [ ] Test 2: Interrupted - Kill process mid-copy, verify no trigger
- [ ] Test 3: False ready - Create `.ready` manually, verify error handling
- [ ] Test 4: Rename failure - Block rename, verify no `.ready`
- [ ] Test 5: SHA mismatch - Wrong hash, verify warning logged
- [ ] Test 6: Missing SHA - No sidecar, verify "not provided" note
- [ ] Test 7: Duplicate - Re-process same file, verify idempotency
- [ ] Test 8: No case - Unknown CaseID, verify unmatched handling
- [ ] Test 9: Latency - Delay SHA upload, verify success
- [ ] Test 10: Soak - Run 50 binders, verify 100% success

---

## Debugging Failed Tests

### Common Issues

**Make triggers early:**
- Check `.ready` creation timing
- Verify atomic rename operations
- Check for race conditions in file sync

**Files not found:**
- Verify Drive sync timing
- Check search folder configuration
- Verify filename matching logic

**Duplicate processing:**
- Implement idempotency lock
- Check archive move timing
- Verify trigger doesn't fire on archived files

**SHA mismatch false positives:**
- Check hash computation consistency
- Verify file hasn't changed during processing
- Check sidecar parsing logic

---

## Continuous Integration

### CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test-binder-ritual.yml
name: Test Binder Publish Ritual

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
      - name: Run Test Harness
        run: |
          python test_harness.py
      - name: Check Results
        run: |
          if [ $? -eq 0 ]; then
            echo "✅ All tests passed"
          else
            echo "❌ Tests failed"
            exit 1
          fi
```

---

## Related Documentation

- [Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md)
- [Ritual Specification](./SINTRAPRIME_READY_RITUAL.md)
- [Make Scenario](./BINDER_OUTBOX_READY_MARKER_v1.md)
- [Suggested Upgrades](./SUGGESTED_UPGRADES.md)

---

## Version History

- **v1.0** (2026-01-24): Initial test harness plan with 10 tests
